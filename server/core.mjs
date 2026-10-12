// Game server core. Pure logic: takes a table row + a request, returns the new row and side effects.
// The Deno edge function (supabase/functions/play) does the I/O around it; tests drive it directly.
//
// Guarantees:
//  - The full game state never leaves the server. Each human gets engine.viewFor(state, theirSeat) only.
//  - Bots decide from the same redacted view a human in that seat would see.
//  - Every random draw comes from a committed seed (commit published before the client seed is known).
//  - Chips move only here: buy-in from the wallet into the table, cash-out back. Tables never mint chips for people.
import { GAMES, segmentEnd, sanitize, apply } from '../public/games/shared/fair.js';
import { seeded, withRng, randomSeed, commitOf } from '../public/games/shared/rng.js';

export class UserError extends Error {}
const fail = m => { throw new UserError(m); };
const clone = x => JSON.parse(JSON.stringify(x));
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const BOT_NAMES = ['Relay', 'Diode', 'Valve', 'Fuse', 'Coil', 'Quartz'];
const TURN_MS = 40000, NEXT_MS = 20000, MAX_STEPS = 400, KEEP_STEPS = 40;

export function newCode() { const b = new Uint8Array(4); crypto.getRandomValues(b); return Array.from(b, x => ALPHA[x % ALPHA.length]).join(''); }
function newSeed() { const seed = randomSeed(); return { seed, commit: commitOf(seed) }; }
const isHuman = seat => seat && !seat.bot;
const active = seat => isHuman(seat) && !seat.left;

/* ------------------------------------------------------------------ */
/* Request context: collects steps, wallet movements and reveals.      */
class Ctx {
  constructor(t, now) { this.t = t; this.now = now; this.steps = []; this.wallet = []; this.reveals = []; this.gone = []; this.rng = null; }
  get g() { return GAMES[this.t.game]; }
  get s() { return this.t.state; }
  rngFor() {
    const cur = this.t.fair.cur;
    if (!this.rng) this.rng = seeded(cur.seed, cur.clientSeed, cur.counter);
    return this.rng;
  }
  // Apply one action (engine move or chip movement) with the segment's stream and log it for replay.
  apply(seat, a, label) {
    const before = this.s;
    const next = withRng(this.rngFor(), () => apply(this.t.game, before, seat, a));
    this.t.fair.cur.counter = this.rng.counter;
    this.t.fair.cur.actions.push({ seat, a });
    this.t.state = next; this.t.seq++;
    this.steps.push({ state: next, actor: seat, label: label || a.type });
    if (!segmentEnd(this.t.game, before) && segmentEnd(this.t.game, next)) this.rotate();
  }
  // Start a new segment from the current state (or from setup when state is null).
  begin(setup) {
    const f = this.t.fair;
    const humans = this.t.seats.filter(active);
    const clientSeed = humans.map(h => f.seeds?.[h.uid] || '').join('|') || 'none';
    f.seg = (f.seg || 0) + 1;
    f.cur = { seg: f.seg, seed: f.next.seed, commit: f.next.commit, clientSeed, counter: 0, actions: [], startState: setup ? null : clone(this.t.state), setup: setup || null, startSeq: this.t.seq };
    f.next = newSeed();
    this.rng = null;
  }
  rotate() {
    const f = this.t.fair, cur = f.cur;
    this.reveals.push({ table_id: this.t.id, seg: cur.seg, game: this.t.game, members: this.t.seats.filter(isHuman).map(s => s.uid), data: { game: this.t.game, seg: cur.seg, seed: cur.seed, commit: cur.commit, clientSeed: cur.clientSeed, setup: cur.setup, startState: cur.startState, actions: cur.actions, endSeq: this.t.seq, endHash: commitOf(JSON.stringify(this.t.state)) } });
    f.lastReveal = cur.seg;
    this.begin(null);
  }
  credit(seat, amount, uid, reason) { // wallet -> table
    this.wallet.push({ uid, delta: -amount, reason });
    this.apply(seat, { type: '_credit', amount }, 'buy-in');
  }
  cashout(seat, reason) { // table -> wallet
    const seatObj = this.t.seats[seat], c = this.g.casino;
    const amount = c.cashable(this.s, seat);
    if (amount > 0) this.wallet.push({ uid: seatObj.uid, delta: amount, reason });
    this.apply(seat, { type: '_cashout' }, 'cash-out');
    seatObj.cashed = true;
    return amount;
  }
}

/* ------------------------------------------------------------------ */
/* Views                                                               */
export function viewsFor(t, steps) {
  const g = GAMES[t.game];
  const out = [];
  t.seats.forEach((seat, i) => {
    if (!isHuman(seat)) return;
    const data = {
      id: t.id, code: t.code, game: t.game, mode: t.mode, status: t.status, seq: t.seq,
      you: i, host: t.seats.findIndex(s => s.uid === t.host), opts: t.opts, deadline: t.deadline || null,
      seats: t.seats.map(s => ({ name: s.name, bot: !!s.bot, away: !!s.away, left: !!s.left })),
      left: !!seat.left,
      fair: t.fair ? { seg: t.fair.cur?.seg || 0, commit: t.fair.cur?.commit || null, clientSeed: t.fair.cur?.clientSeed || null, next: t.fair.next?.commit || null, lastReveal: t.fair.lastReveal || 0 } : null,
      steps: t.state ? (steps.length ? steps : [{ state: t.state, actor: -1, label: 'sync' }]).slice(-KEEP_STEPS).map(st => ({ state: g.engine.viewFor(st.state, i), actor: st.actor, label: st.label })) : []
    };
    out.push({ user_id: seat.uid, seat: i, open: t.status !== 'closed' && !seat.left, data });
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Bots, autopilot, deadlines                                          */
function autopilot(ctx, i) {
  const g = ctx.g, s = ctx.s;
  if (g.casino) return g.casino.autopilot(s, i);
  return g.engine.bot(g.engine.viewFor(s, i), i, ctx.t.opts);
}
function botMove(ctx, i) {
  const g = ctx.g;
  const opts = ctx.t.game === 'chess' ? { ...ctx.t.opts, level: 1 } : ctx.t.opts; // keep server CPU low
  return g.engine.bot(g.engine.viewFor(ctx.s, i), i, opts);
}
// Let bots (and humans who are away or leaving) play until a present human must act or a hand ends.
function runBots(ctx) {
  const { t } = ctx, g = ctx.g;
  for (let k = 0; k < MAX_STEPS; k++) {
    if (!t.state || g.engine.over(t.state)) break;
    const segBefore = t.fair.cur.seg;
    let moved = false;
    for (const i of g.engine.toAct(t.state)) {
      const seat = t.seats[i];
      const auto = seat.bot ? botMove : (seat.away || seat.leaving || seat.left) ? autopilot : null;
      if (!auto) continue;
      const a = auto(ctx, i); if (a == null) continue;
      try { ctx.apply(i, a); moved = true; break; } catch { if (seat.bot) continue; }
    }
    settleLeavers(ctx);
    if (!moved || t.fair.cur.seg !== segBefore) break; // stop at a hand boundary; the next hand starts when a human asks
  }
  settleLeavers(ctx);
  setDeadline(ctx);
}
function settleLeavers(ctx) {
  const { t } = ctx, c = ctx.g.casino;
  t.seats.forEach((seat, i) => {
    if (!isHuman(seat) || !seat.leaving) return;
    if (!seat.cashed) {
      if (c && t.state && !(c.settled(t.state) || ctx.g.engine.over(t.state))) return;
      if (c && t.state) ctx.cashout(i, t.game + ':cash-out');
    }
    seat.left = true; seat.leaving = false;
  });
  if (t.status !== 'closed' && !t.seats.some(active) && !t.seats.some(s => isHuman(s) && s.leaving)) t.status = 'closed';
}
function setDeadline(ctx) {
  const { t } = ctx;
  t.deadline = null;
  if (t.mode !== 'online' || t.status !== 'playing' || !t.state) return;
  const humans = t.seats.filter(active);
  if (humans.length < 2) return;
  const waiting = ctx.g.engine.toAct(t.state).filter(i => active(t.seats[i]) && !t.seats[i].away);
  if (!waiting.length) return;
  const nextish = ['result', 'settle'].includes(t.state.phase);
  t.deadline = ctx.now + (nextish ? NEXT_MS : TURN_MS);
}

/* ------------------------------------------------------------------ */
/* Seating and chips                                                   */
function seatFor(t, uid) { return t.seats.findIndex(s => s.uid === uid && !s.left); }
function mustSeat(t, uid) { const i = seatFor(t, uid); if (i < 0) fail('You are not seated at this table.'); return i; }

// Move each human's buy-in from their wallet onto the table.
function buyIns(ctx, balances) {
  const { t } = ctx, c = ctx.g.casino;
  if (!c) return null;
  return t.seats.map(seat => {
    if (!isHuman(seat)) return undefined;
    const bal = balances[seat.uid] ?? 0;
    const amt = Math.min(bal, c.maxBuy);
    if (amt < c.minBuy) fail(`${seat.name} needs at least ${c.minBuy} chips to sit at this table.`);
    return amt;
  });
}
function startGame(ctx, balances) {
  const { t } = ctx, g = ctx.g;
  const stacks = buyIns(ctx, balances);
  const opts = { ...t.opts, players: t.seats.length };
  const setupOpts = stacks ? { ...opts, stack: stacks } : opts;
  ctx.begin({ n: t.seats.length, opts: setupOpts });
  t.state = withRng(ctx.rngFor(), () => g.engine.setup(t.seats.length, setupOpts));
  t.fair.cur.counter = ctx.rng.counter;
  t.seq++;
  if (stacks) stacks.forEach((amt, i) => { if (amt) { ctx.wallet.push({ uid: t.seats[i].uid, delta: -amt, reason: t.game + ':buy-in' }); t.seats[i].cashed = false; } });
  t.status = 'playing';
  ctx.steps.push({ state: t.state, actor: -1, label: 'deal' });
  if (segmentEnd(t.game, t.state)) ctx.rotate();
}

/* ------------------------------------------------------------------ */
/* Operations                                                          */
// req: { op, user: {id, name}, body, now, balances: {uid: chips} }
export function handle(t, req) {
  const { op, user, body = {}, now, balances = {} } = req;
  if (op === 'create') return create(user, body, now);
  if (!t) fail('That table does not exist any more.');
  t = clone(t);
  const ctx = new Ctx(t, now);
  const g = ctx.g;
  if (body.clientSeed != null && t.fair) { const cs = String(body.clientSeed).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64); if (cs) (t.fair.seeds ||= {})[user.id] = cs; }

  switch (op) {
    case 'sync': break;
    case 'join': {
      if (t.mode !== 'online') fail('That table is private.');
      if (seatFor(t, user.id) >= 0) break;
      if (t.status !== 'lobby') fail('This game has already started.');
      if (t.seats.length >= g.max) fail('This room is full.');
      t.seats.push({ uid: user.id, name: user.name, bot: false });
      break;
    }
    case 'bot': case 'unbot': case 'opts': {
      if (t.host !== user.id) fail('Only the host can change the table.');
      if (t.status !== 'lobby') fail('The game has started.');
      if (op === 'bot') { if (t.seats.length >= g.max) fail('The table is full.'); t.seats.push({ uid: null, name: BOT_NAMES[t.seats.length % BOT_NAMES.length], bot: true }); }
      if (op === 'unbot') { const i = Math.floor(+body.seat); if (!t.seats[i]?.bot) fail('That seat is not a bot.'); t.seats.splice(i, 1); }
      if (op === 'opts') t.opts = g.opts({ ...t.opts, ...(body.opts || {}) });
      break;
    }
    case 'start': {
      if (t.host !== user.id) fail('Only the host can start.');
      if (t.status !== 'lobby') fail('The game has started.');
      if (t.seats.length < g.min) fail(`Need ${g.min - t.seats.length} more player${g.min - t.seats.length > 1 ? 's' : ''}.`);
      startGame(ctx, balances);
      runBots(ctx);
      break;
    }
    case 'again': {
      if (t.host !== user.id && t.mode === 'online') fail('Only the host can start a new game.');
      if (!(t.status === 'done' || (t.state && g.engine.over(t.state)))) fail('The game is still running.');
      // cash out anyone still holding table chips, then deal a fresh game
      if (g.casino) t.seats.forEach((seat, i) => { if (isHuman(seat) && !seat.cashed && !seat.left) ctx.cashout(i, t.game + ':cash-out'); });
      const bal = { ...balances }; for (const w of ctx.wallet) bal[w.uid] = (bal[w.uid] ?? 0) + w.delta;
      t.seats = t.seats.filter(s => !s.left);
      while (t.seats.length < g.min) t.seats.push({ uid: null, name: BOT_NAMES[t.seats.length % BOT_NAMES.length], bot: true });
      t.status = 'lobby'; t.state = null;
      startGame(ctx, bal);
      runBots(ctx);
      break;
    }
    case 'act': {
      if (t.status !== 'playing' || !t.state) fail('The game is not running.');
      const i = mustSeat(t, user.id);
      const seat = t.seats[i]; seat.away = false; seat.timeouts = 0;
      const a = sanitize(body.action);
      if (a.type === 'rebuy') { rebuy(ctx, i, balances); }
      else {
        if (a.type.startsWith('_')) fail('Bad move.');
        try { ctx.apply(i, a); } catch (e) { fail(e.message || 'That move is not allowed.'); }
      }
      runBots(ctx);
      break;
    }
    case 'tick': {
      if (t.status !== 'playing' || !t.deadline || now < t.deadline) break;
      for (const i of g.engine.toAct(t.state)) {
        const seat = t.seats[i];
        if (!active(seat) || seat.away) continue;
        seat.timeouts = (seat.timeouts || 0) + 1;
        if (seat.timeouts >= 2) seat.away = true;
        const a = autopilot(ctx, i);
        if (a) try { ctx.apply(i, a, 'timeout'); } catch { /* ignore */ }
      }
      runBots(ctx);
      break;
    }
    case 'leave': {
      const i = seatFor(t, user.id);
      if (i < 0) break;
      if (t.status === 'lobby') {
        t.seats.splice(i, 1); ctx.gone.push(user.id);
        if (t.host === user.id) { const h = t.seats.find(active); if (h) t.host = h.uid; }
        if (!t.seats.some(active)) t.status = 'closed';
        break;
      }
      leave(ctx, i);
      break;
    }
    case 'reap': { // nobody has touched the table for a long time: finish hands on autopilot, cash everyone out
      t.seats.forEach(seat => { if (active(seat)) seat.leaving = true; });
      if (t.state) runBots(ctx);
      if (t.state && g.casino) t.seats.forEach((seat, i) => { if (isHuman(seat) && !seat.cashed) ctx.cashout(i, t.game + ':cash-out'); });
      t.seats.forEach(seat => { if (isHuman(seat)) { seat.left = true; seat.leaving = false; } });
      t.status = 'closed'; t.deadline = null;
      break;
    }
    default: fail('Unknown request.');
  }
  finish(ctx);
  return { table: t, steps: ctx.steps, wallet: ctx.wallet, reveals: ctx.reveals, gone: ctx.gone };
}

function rebuy(ctx, i, balances) {
  const { t } = ctx, c = ctx.g.casino;
  if (!c) fail('Nothing to buy here.');
  if (!c.settled(t.state)) fail('Wait for the hand to finish.');
  if (c.cashable(t.state, i) >= c.minBuy) fail('You still have chips.');
  const bal = balances[t.seats[i].uid] ?? 0;
  const amt = Math.min(bal, c.maxBuy - c.cashable(t.state, i));
  if (amt < c.minBuy) fail('Your wallet is empty. Claim the daily bonus from your account.');
  ctx.credit(i, amt, t.seats[i].uid, t.game + ':buy-in');
  t.seats[i].cashed = false;
}
function leave(ctx, i) {
  const { t } = ctx, g = ctx.g, seat = t.seats[i];
  if (g.casino) {
    seat.leaving = true;
    runBots(ctx);   // finish this seat's part of the hand on autopilot
    settleLeavers(ctx);
  } else {
    seat.left = true; seat.bot = true; ctx.gone.push(seat.uid); seat.uid = null; seat.name = seat.name + ' (bot)';
    runBots(ctx);
  }
  if (!t.seats.some(active)) { t.status = 'closed'; t.deadline = null; }
}
function finish(ctx) {
  const { t } = ctx, g = ctx.g;
  // a finished poker table pays everyone out
  if (t.state && t.status === 'playing' && g.engine.over(t.state)) {
    if (g.casino) t.seats.forEach((seat, i) => { if (isHuman(seat) && !seat.cashed && !seat.left) ctx.cashout(i, t.game + ':cash-out'); });
    t.status = 'done'; t.deadline = null;
  }
  t.updated = ctx.now;
}

function create(user, body, now) {
  const game = String(body.game || '');
  const g = GAMES[game]; if (!g) fail('Unknown game.');
  const mode = body.mode === 'online' ? 'online' : 'bot';
  const opts = g.opts(body.opts || {});
  const t = {
    id: crypto.randomUUID(), code: newCode(), game, mode, status: 'lobby', host: user.id, opts,
    seats: [{ uid: user.id, name: user.name, bot: false }], state: null, seq: 0, deadline: null, updated: now,
    fair: { seg: 0, next: newSeed(), seeds: {} }
  };
  if (mode === 'bot') {
    const n = Math.max(g.min, Math.min(g.max, opts.players || g.min));
    for (let i = 1; i < n; i++) t.seats.push({ uid: null, name: BOT_NAMES[(i - 1) % BOT_NAMES.length], bot: true });
  }
  return { table: t, steps: [], wallet: [], reveals: [], gone: [] };
}
