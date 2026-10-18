// Durak (podkidnoy, throw-in, no transfer). 36 cards, 2–4 players. JSON state, host-authoritative.
import { shuffle, rand, botRand } from '../shared/rng.js';
const SUITS = ['s', 'c', 'h', 'd'];
const RANKS = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const clone = s => JSON.parse(JSON.stringify(s));
export const rv = c => RANKS.indexOf(c.r);
export function beats(def, att, trump) {
  if (def.s === att.s) return rv(def) > rv(att);
  return def.s === trump && att.s !== trump;
}
const active = s => { const out = []; for (let i = 0; i < s.n; i++) if (!s.out.includes(i)) out.push(i); return out; };
function nextActive(s, from) { for (let k = 1; k <= s.n; k++) { const i = (from + k) % s.n; if (!s.out.includes(i)) return i; } return from; }
export function attackers(s) { return active(s).filter(i => i !== s.defender); }
export function tableRanks(s) { const r = new Set(); s.table.forEach(p => { r.add(p.a.r); if (p.d) r.add(p.d.r); }); return r; }
export function canThrow(s, seat, card) {
  if (seat === s.defender || s.out.includes(seat)) return false;
  if (!s.table.length) return seat === s.attacker;
  if (s.table.length >= s.limit) return false;
  const open = s.table.filter(p => !p.d).length;
  if (open >= s.hands[s.defender].length) return false;
  return tableRanks(s).has(card.r);
}

function refill(s) { // main attacker first, then the other attackers clockwise, the defender last
  const order = [s.attacker];
  for (let k = 1; k < s.n; k++) { const i = (s.attacker + k) % s.n; if (i !== s.defender && !s.out.includes(i)) order.push(i); }
  order.push(s.defender);
  for (const i of order) while (s.hands[i].length < 6 && s.talon.length) s.hands[i].push(s.talon.pop());
}
function settleOuts(s) {
  if (s.talon.length) return;
  for (let i = 0; i < s.n; i++) if (!s.out.includes(i) && !s.hands[i].length) s.out.push(i);
  const left = active(s);
  if (left.length <= 1) s.durak = left.length ? left[0] : -1;
}
function endBout(s, took) {
  if (took) { s.hands[s.defender].push(...s.table.flatMap(p => p.d ? [p.a, p.d] : [p.a])); s.msg = 'Seat ' + (s.defender + 1) + ' took the cards'; }
  else { s.discarded += s.table.length * 2; s.msg = 'Beaten · bito'; }
  s.table = []; s.passed = []; s.taking = false;
  refill(s); settleOuts(s);
  if (s.durak != null) return;
  const prevDef = s.defender;
  s.attacker = took ? nextActive(s, prevDef) : (s.out.includes(prevDef) ? nextActive(s, prevDef) : prevDef);
  s.defender = nextActive(s, s.attacker);
  s.limit = 6; s.bout++;
}
function maybeEnd(s) {
  if (!s.table.length) return;
  const all = attackers(s).filter(i => s.hands[i].length);
  const everyonePassed = all.every(i => s.passed.includes(i));
  const fullyBeaten = s.table.every(p => p.d);
  const cap = s.table.length >= s.limit || (!s.taking && s.table.filter(p => !p.d).length === 0 && s.hands[s.defender].length === 0);
  if (s.taking && (everyonePassed || s.table.length >= s.limit)) return endBout(s, true);
  if (!s.taking && fullyBeaten && (everyonePassed || cap)) return endBout(s, false);
}

export const engine = {
  setup(n) {
    const d = []; let id = 0;
    for (const su of SUITS) for (const r of RANKS) d.push({ id: id++, s: su, r });
    shuffle(d);
    const hands = []; for (let i = 0; i < n; i++) hands.push(d.splice(0, 6));
    const trumpCard = d[0]; // bottom of the talon, drawn last
    const talon = d; // pop() takes from the top
    let attacker = -1, low = 99;
    hands.forEach((h, i) => h.forEach(c => { if (c.s === trumpCard.s && rv(c) < low) { low = rv(c); attacker = i; } }));
    const noTrump = attacker < 0;
    if (noTrump) attacker = Math.floor(rand() * n); // nobody holds a trump: a random player starts
    const s = { n, hands, talon, trump: trumpCard.s, trumpCard, attacker, defender: (attacker + 1) % n, table: [], passed: [], taking: false, out: [], durak: null, discarded: 0, limit: 5, bout: 1, msg: noTrump ? 'No trumps dealt · random first attack' : 'Lowest trump attacks first', seq: 0 };
    return s;
  },
  toAct(s) {
    if (s.durak != null) return [];
    if (!s.table.length) return [s.attacker];
    const out = [];
    if (!s.taking && s.table.some(p => !p.d)) out.push(s.defender);
    for (const i of attackers(s)) if (!s.passed.includes(i) && s.hands[i].length) out.push(i);
    return out;
  },
  act(s0, seat, a) {
    if (s0.durak != null) throw new Error('The game is over.');
    const s = clone(s0); s.seq++;
    const hand = s.hands[seat];
    if (a.type === 'attack') {
      const i = hand.findIndex(c => c.id === a.id); if (i < 0) throw new Error('That card is not in your hand.');
      if (!canThrow(s, seat, hand[i])) throw new Error(s.table.length ? 'You can only add cards of a rank already on the table.' : "It's not your attack.");
      s.table.push({ a: hand.splice(i, 1)[0], d: null, by: seat }); s.passed = []; s.msg = '';
      settleOutsSoft(s); maybeEnd(s); return s;
    }
    if (a.type === 'defend') {
      if (seat !== s.defender) throw new Error('Only the defender can beat cards.');
      if (s.taking) throw new Error('You already chose to take.');
      const i = hand.findIndex(c => c.id === a.id); if (i < 0) throw new Error('That card is not in your hand.');
      const pair = s.table[a.target]; if (!pair || pair.d) throw new Error('Pick an attacking card that is not beaten yet.');
      if (!beats(hand[i], pair.a, s.trump)) throw new Error('That card does not beat it. Use a higher card of the same suit or a trump.');
      pair.d = hand.splice(i, 1)[0]; s.msg = '';
      // a fresh beat lets attackers think again
      s.passed = [];
      maybeEnd(s); return s;
    }
    if (a.type === 'take') {
      if (seat !== s.defender || !s.table.length) throw new Error('Only the defender can take.');
      s.taking = true; s.passed = []; s.msg = 'Seat ' + (seat + 1) + ' takes';
      maybeEnd(s); return s;
    }
    if (a.type === 'pass') {
      if (seat === s.defender) throw new Error('The defender cannot pass.');
      if (!s.table.length) throw new Error('Start the attack first.');
      if (!s.passed.includes(seat)) s.passed.push(seat);
      maybeEnd(s); return s;
    }
    throw new Error('Unknown move.');
  },
  over(s) {
    if (s.durak == null) return null;
    if (s.durak === -1) return { title: 'Draw', detail: 'Everyone got out together', keepTitle: true };
    return { title: 'Seat ' + (s.durak + 1) + ' is the durak', detail: 'Last one holding cards', keepTitle: true, loser: s.durak };
  },
  botDelay(s, seat) { return seat === s.defender ? 900 : 1000; },
  bot(s, seat) {
    const hand = s.hands[seat], T = s.trump;
    const cost = c => rv(c) + (c.s === T ? 10 : 0);
    if (seat === s.defender && !s.taking && s.table.some(p => !p.d)) {
      const ti = s.table.findIndex(p => !p.d), att = s.table[ti].a;
      const opts = hand.filter(c => beats(c, att, T)).sort((a, b) => cost(a) - cost(b));
      if (!opts.length) return { type: 'take' };
      const best = opts[0];
      if (best.s === T && rv(best) >= 6 && s.talon.length > 8 && s.table.length <= 2) return { type: 'take' };
      return { type: 'defend', id: best.id, target: ti };
    }
    if (seat !== s.defender) {
      if (!s.table.length) {
        if (seat !== s.attacker) return null;
        const counts = {}; hand.forEach(c => counts[c.r] = (counts[c.r] || 0) + 1);
        const sorted = [...hand].sort((a, b) => cost(a) - cost(b) - ((counts[b.r] || 0) - (counts[a.r] || 0)) * 2);
        return { type: 'attack', id: sorted[0].id };
      }
      const opts = hand.filter(c => canThrow(s, seat, c)).sort((a, b) => cost(a) - cost(b));
      const cheap = opts.filter(c => c.s !== T && (rv(c) < 6 || s.talon.length < 6 || s.taking));
      if (cheap.length) return { type: 'attack', id: cheap[0].id };
      if (s.taking && opts.length && s.talon.length < 4) return { type: 'attack', id: opts[0].id };
      return { type: 'pass' };
    }
    return null;
  }
};
// players who emptied their hand mid-bout stay until the bout ends; nothing to do here
function settleOutsSoft() {}

// What one seat is allowed to see: its own hand and counts; the talon stays face down except the trump card under it.
engine.viewFor = (s, seat) => ({ ...s, hands: s.hands.map((h, i) => i === seat ? h : h.map(() => null)), talon: s.talon.map(() => null) });
