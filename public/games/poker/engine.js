// Texas Hold'em no-limit, 2–6 players, play chips. Side pots, showdown, blinds rise every 10 hands.
import { shuffle, rand, botRand } from '../shared/rng.js';
const RANKS = '23456789TJQKA';
const clone = s => JSON.parse(JSON.stringify(s));
export const START = 2000;
const rv = c => RANKS.indexOf(c.r === '10' ? 'T' : c.r);

/* ---------- hand evaluation: returns [category, ...tiebreak] (higher is better) ---------- */
export const CATS = ['High card', 'Pair', 'Two pair', 'Three of a kind', 'Straight', 'Flush', 'Full house', 'Four of a kind', 'Straight flush'];
function eval5(cs) {
  const v = cs.map(rv).sort((a, b) => b - a), suits = cs.map(c => c.s);
  const flush = suits.every(s => s === suits[0]);
  const uniq = [...new Set(v)];
  let straightHigh = -1;
  if (uniq.length === 5) { if (v[0] - v[4] === 4) straightHigh = v[0]; else if (v.join() === '12,3,2,1,0') straightHigh = 3; }
  const cnt = {}; v.forEach(x => cnt[x] = (cnt[x] || 0) + 1);
  const groups = Object.entries(cnt).map(([r, c]) => [c, +r]).sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  if (flush && straightHigh >= 0) return [8, straightHigh];
  if (groups[0][0] === 4) return [7, groups[0][1], groups[1]?.[1] ?? -1];
  if (groups[0][0] === 3 && groups[1]?.[0] === 2) return [6, groups[0][1], groups[1][1]];
  if (flush) return [5, ...v];
  if (straightHigh >= 0) return [4, straightHigh];
  if (groups[0][0] === 3) return [3, groups[0][1], ...groups.slice(1).map(g => g[1])];
  if (groups[0][0] === 2 && groups[1]?.[0] === 2) return [2, groups[0][1], groups[1][1], groups[2][1]];
  if (groups[0][0] === 2) return [1, groups[0][1], ...groups.slice(1).map(g => g[1])];
  return [0, ...v];
}
export const cmp = (a, b) => { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] ?? -1) - (b[i] ?? -1); if (d) return d; } return 0; };
export function best(cards) {
  let top = null;
  for (let a = 0; a < cards.length; a++) for (let b = a + 1; b < cards.length; b++) {
    const five = cards.filter((_, i) => i !== a && i !== b);
    if (cards.length === 6 && b !== cards.length - 1) continue;
    const sc = eval5(cards.length <= 5 ? cards : five);
    if (!top || cmp(sc, top) > 0) top = sc;
    if (cards.length <= 5) return sc;
  }
  return top;
}
function best7(cards) { // up to 7
  if (cards.length <= 5) return eval5(cards);
  let top = null; const n = cards.length;
  const idx = [];
  const rec = (start, pick) => { if (pick.length === 5) { const sc = eval5(pick.map(i => cards[i])); if (!top || cmp(sc, top) > 0) top = sc; return; } for (let i = start; i < n; i++) rec(i + 1, [...pick, i]); };
  rec(0, idx); return top;
}
export { best7 };

/* ---------- table flow ---------- */
function deck() { const d = []; let id = 0; for (const s of 'shdc') for (const r of ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']) d.push({ id: id++, s, r }); return shuffle(d); }
const alive = s => [...Array(s.n).keys()].filter(i => s.chips[i] > 0 || s.inHand?.[i]);
function nextSeat(s, from, pred) { for (let k = 1; k <= s.n; k++) { const i = (from + k) % s.n; if (pred(i)) return i; } return -1; }
const canAct = (s, i) => s.inHand[i] && !s.folded[i] && s.chips[i] > 0;

function startHand(s) {
  const players = [...Array(s.n).keys()].filter(i => s.chips[i] > 0);
  s.inHand = Array(s.n).fill(false); players.forEach(i => s.inHand[i] = true);
  s.handNo++; if (s.handNo > 1 && (s.handNo - 1) % 10 === 0) { s.sb *= 2; s.bb *= 2; s.msg = `Blinds up: ${s.sb}/${s.bb}`; } else s.msg = '';
  s.dealer = nextSeat(s, s.dealer, i => s.inHand[i]);
  s.deck = deck(); s.board = []; s.hole = Array.from({ length: s.n }, (_, i) => s.inHand[i] ? [s.deck.pop(), s.deck.pop()] : []);
  s.bets = Array(s.n).fill(0); s.contrib = Array(s.n).fill(0); s.folded = Array(s.n).fill(false); s.acted = Array(s.n).fill(false);
  s.street = 'preflop'; s.result = null; s.phase = 'play'; s.ready = [];
  const heads = players.length === 2;
  const sbSeat = heads ? s.dealer : nextSeat(s, s.dealer, i => s.inHand[i]);
  const bbSeat = nextSeat(s, sbSeat, i => s.inHand[i]);
  post(s, sbSeat, s.sb); post(s, bbSeat, s.bb);
  s.currentBet = s.bb; s.minRaise = s.bb; s.sbSeat = sbSeat; s.bbSeat = bbSeat;
  s.turn = nextSeat(s, bbSeat, i => canAct(s, i));
  if (s.turn < 0 || everyoneAllIn(s)) runOut(s);
}
function post(s, i, amt) { const a = Math.min(amt, s.chips[i]); s.chips[i] -= a; s.bets[i] += a; s.contrib[i] += a; }
const inPlay = s => [...Array(s.n).keys()].filter(i => s.inHand[i] && !s.folded[i]);
function everyoneAllIn(s) { const p = inPlay(s); const actors = p.filter(i => s.chips[i] > 0); return actors.length === 0 || (actors.length === 1 && s.bets[actors[0]] >= s.currentBet); }
function streetDone(s) { return inPlay(s).filter(i => s.chips[i] > 0).every(i => s.acted[i] && s.bets[i] === s.currentBet); }
function nextStreet(s) {
  s.bets = Array(s.n).fill(0); s.acted = Array(s.n).fill(false); s.currentBet = 0; s.minRaise = s.bb;
  if (s.street === 'preflop') { s.board.push(s.deck.pop(), s.deck.pop(), s.deck.pop()); s.street = 'flop'; }
  else if (s.street === 'flop') { s.board.push(s.deck.pop()); s.street = 'turn'; }
  else if (s.street === 'turn') { s.board.push(s.deck.pop()); s.street = 'river'; }
  else return showdown(s);
  if (everyoneAllIn(s)) return runOut(s);
  s.turn = nextSeat(s, s.dealer, i => canAct(s, i));
}
function runOut(s) { while (s.board.length < 5) s.board.push(s.deck.pop()); showdown(s); }
function showdown(s) {
  const players = inPlay(s);
  const scores = {}; players.forEach(i => scores[i] = best7([...s.hole[i], ...s.board]));
  const levels = [...new Set(s.contrib.filter(x => x > 0))].sort((a, b) => a - b);
  const won = Array(s.n).fill(0); let prev = 0; const pots = [];
  for (const lv of levels) {
    let amount = 0; s.contrib.forEach(c => amount += Math.max(0, Math.min(c, lv) - prev));
    const elig = players.filter(i => s.contrib[i] >= lv);
    if (!elig.length) { prev = lv; continue; }
    let top = null, winners = [];
    for (const i of elig) { const c = top ? cmp(scores[i], top) : 1; if (c > 0) { top = scores[i]; winners = [i]; } else if (c === 0) winners.push(i); }
    const share = Math.floor(amount / winners.length); let rem = amount - share * winners.length;
    winners.forEach(i => { won[i] += share + (rem-- > 0 ? 1 : 0); });
    pots.push({ amount, winners }); prev = lv;
  }
  won.forEach((w, i) => s.chips[i] += w);
  s.result = { won, shown: players.length > 1, hands: Object.fromEntries(players.map(i => [i, CATS[scores[i][0]]])), pots };
  const w = won.map((x, i) => [x, i]).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0]);
  s.msg = players.length > 1 ? w.map(([x, i]) => `Seat ${i + 1} wins ${x} with ${CATS[scores[i][0]].toLowerCase()}`).join(' · ') : `Seat ${w[0][1] + 1} wins ${w[0][0]}`;
  s.phase = 'result'; s.turn = -1; s.street = 'showdown';
}
function win1(s, i) { const pot = s.contrib.reduce((a, b) => a + b, 0); s.chips[i] += pot; s.result = { won: s.contrib.map((_, k) => k === i ? pot : 0), shown: false, hands: {}, pots: [{ amount: pot, winners: [i] }] }; s.msg = `Seat ${i + 1} wins ${pot}`; s.phase = 'result'; s.turn = -1; }

export const engine = {
  setup(n, opts) { const s = { n, chips: Array.from({ length: n }, (_, i) => { const v = opts?.stack?.[i]; return Number.isFinite(v) && v > 0 ? v : START; }), sb: 10, bb: 20, dealer: n - 1, handNo: 0, seq: 0, ready: [] }; startHand(s); return s; },
  toAct(s) { if (engine.over(s)) return []; if (s.phase === 'result') return [...Array(s.n).keys()].filter(i => !s.ready.includes(i) && s.chips[i] > 0); return s.turn >= 0 ? [s.turn] : []; },
  pot(s) { return s.contrib.reduce((a, b) => a + b, 0); },
  act(s0, seat, a) {
    const s = clone(s0); s.seq++;
    if (s.phase === 'result') {
      if (a.type !== 'next') throw new Error('Hand is over.');
      if (!s.ready.includes(seat)) s.ready.push(seat);
      if (!engine.toAct(s).length && !engine.over(s)) startHand(s);
      return s;
    }
    if (seat !== s.turn) throw new Error("It's not your turn.");
    const toCall = s.currentBet - s.bets[seat];
    if (a.type === 'fold') { s.folded[seat] = true; s.lastAction = { seat, text: 'Fold' }; }
    else if (a.type === 'check') { if (toCall > 0) throw new Error('You must call or fold.'); s.acted[seat] = true; s.lastAction = { seat, text: 'Check' }; }
    else if (a.type === 'call') { post(s, seat, toCall); s.acted[seat] = true; s.lastAction = { seat, text: s.chips[seat] === 0 ? 'All-in' : 'Call ' + toCall }; }
    else if (a.type === 'raise' || a.type === 'allin') {
      const max = s.bets[seat] + s.chips[seat];
      let to = a.type === 'allin' ? max : Math.floor(+a.to);
      if (!Number.isFinite(to)) throw new Error('Enter a raise amount.');
      if (to > max) to = max;
      const minTo = s.currentBet + s.minRaise;
      if (to < minTo && to < max) throw new Error(`Minimum raise is to ${minTo}.`);
      if (to <= s.currentBet) { post(s, seat, Math.min(toCall, s.chips[seat])); s.acted[seat] = true; s.lastAction = { seat, text: 'All-in' }; }
      else {
        const raiseBy = to - s.currentBet; if (raiseBy >= s.minRaise) s.minRaise = raiseBy;
        post(s, seat, to - s.bets[seat]); s.currentBet = to; s.acted = s.acted.map(() => false); s.acted[seat] = true;
        s.lastAction = { seat, text: s.chips[seat] === 0 ? 'All-in ' + to : (toCall ? 'Raise to ' + to : 'Bet ' + to) };
      }
    } else throw new Error('Unknown move.');
    const left = inPlay(s);
    if (left.length === 1) { win1(s, left[0]); return s; }
    if (streetDone(s)) { nextStreet(s); return s; }
    s.turn = nextSeat(s, seat, i => canAct(s, i));
    if (s.turn < 0) runOut(s);
    return s;
  },
  over(s) {
    const left = [...Array(s.n).keys()].filter(i => s.chips[i] > 0);
    if (s.phase === 'result' && left.length === 1) return { title: 'Seat ' + (left[0] + 1) + ' wins', detail: 'Last player with chips', winner: left[0] };
    return null;
  },
  botDelay(s) { return s.phase === 'result' ? 3200 : 1100; },
  bot(s, seat) {
    if (s.phase === 'result') return { type: 'next' };
    const toCall = s.currentBet - s.bets[seat], pot = engine.pot(s), stack = s.chips[seat];
    const hole = s.hole[seat];
    let strength;
    if (!s.board.length) {
      const [a, b] = hole.map(rv).sort((x, y) => y - x), pair = a === b, suited = hole[0].s === hole[1].s;
      strength = (pair ? .5 + a / 26 : (a + b) / 30) + (suited ? .06 : 0) + (a - b <= 2 && !pair ? .04 : 0);
    } else {
      const sc = best7([...hole, ...s.board]); const bc = {}; s.board.forEach(c => bc[c.r] = (bc[c.r] || 0) + 1); const boardSc = [Math.max(...Object.values(bc)) >= 2 ? 1 : 0];
      strength = [.12, .42, .62, .74, .82, .86, .93, .98, 1][sc[0]] + (sc[0] === 1 ? sc[1] / 60 : 0) - (s.board.length >= 3 && sc[0] === boardSc[0] && sc[0] <= 1 ? .2 : 0);
    }
    strength += (botRand() - .5) * .16;
    const odds = toCall / (pot + toCall || 1);
    if (strength > .8 && botRand() < .7) { const to = Math.min(s.bets[seat] + stack, Math.max(s.currentBet + s.minRaise, s.currentBet + Math.floor(pot * .75))); return { type: 'raise', to }; }
    if (toCall === 0) { if (strength > .6 && botRand() < .5) return { type: 'raise', to: Math.min(s.bets[seat] + stack, s.currentBet + Math.max(s.minRaise, Math.floor(pot * .5))) }; return { type: 'check' }; }
    if (strength > odds + .25 || (toCall <= s.bb && strength > .3)) return { type: 'call' };
    return { type: 'fold' };
  }
};

// What one seat is allowed to see: its own hole cards; others only at showdown and only if they did not fold. Never the deck.
engine.viewFor = (s, seat) => ({ ...s, deck: [], hole: s.hole.map((h, i) => (i === seat || (s.phase === 'result' && s.result?.shown && s.inHand[i] && !s.folded[i])) ? h : h.map(() => null)) });
