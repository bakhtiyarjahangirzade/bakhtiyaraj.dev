// European roulette (single zero). Everyone bets on one shared wheel; play chips only.
const clone = s => JSON.parse(JSON.stringify(s));
export const START = 1000;
export const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
export const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
export function covers(k, n) {
  if (k[0] === 'n') return +k.slice(1) === n;
  if (n === 0) return false;
  switch (k) {
    case 'red': return RED.has(n); case 'black': return !RED.has(n);
    case 'odd': return n % 2 === 1; case 'even': return n % 2 === 0;
    case 'low': return n <= 18; case 'high': return n >= 19;
    case 'd1': return n <= 12; case 'd2': return n > 12 && n <= 24; case 'd3': return n > 24;
    case 'c1': return n % 3 === 1; case 'c2': return n % 3 === 2; case 'c3': return n % 3 === 0;
  }
  return false;
}
export const mult = k => k[0] === 'n' ? 36 : (k[0] === 'd' || k[0] === 'c') ? 3 : 2;
const KEYS = new Set(['red', 'black', 'odd', 'even', 'low', 'high', 'd1', 'd2', 'd3', 'c1', 'c2', 'c3', ...Array.from({ length: 37 }, (_, i) => 'n' + i)]);
export const engine = {
  setup(n, opts) { return { n, chips: Array.from({ length: n }, (_, i) => { const v = opts?.stack?.[i]; return Number.isFinite(v) && v > 0 ? v : START; }), bets: Array.from({ length: n }, () => ({})), phase: 'bet', ready: [], result: null, history: [], wins: Array(n).fill(0), round: 1, spinId: 0, seq: 0, msg: 'Place your bets' }; },
  toAct(s) { return [...Array(s.n).keys()].filter(i => !s.ready.includes(i)); },
  act(s0, seat, a) {
    const s = clone(s0); s.seq++;
    if (a.type === 'rebuy') { if (s.chips[seat] >= 1 || Object.keys(s.bets[seat]).length) throw new Error('You still have chips.'); s.chips[seat] = START; return s; }
    if (s.phase === 'bet') {
      if (s.ready.includes(seat)) throw new Error('You already pressed Spin. Wait for the others.');
      if (a.type === 'bet') {
        const amt = Math.floor(+a.amount);
        if (!KEYS.has(a.k)) throw new Error('Unknown bet.');
        if (!(amt > 0) || amt > s.chips[seat]) throw new Error('Not enough chips.');
        s.bets[seat][a.k] = (s.bets[seat][a.k] || 0) + amt; s.chips[seat] -= amt; return s;
      }
      if (a.type === 'clear') { for (const v of Object.values(s.bets[seat])) s.chips[seat] += v; s.bets[seat] = {}; return s; }
      if (a.type === 'spin') {
        s.ready.push(seat);
        if (engine.toAct(s).length) { s.msg = 'Waiting for everyone to press Spin'; return s; }
        const r = Math.floor(Math.random() * 37);
        s.result = r; s.history = [r, ...s.history].slice(0, 14); s.spinId++;
        s.wins = s.bets.map((b, i) => { let w = 0; for (const [k, v] of Object.entries(b)) if (covers(k, r)) w += v * mult(k); s.chips[i] += w; return w; });
        s.phase = 'result'; s.ready = []; s.msg = 'No more bets';
        return s;
      }
      throw new Error('Unknown move.');
    }
    if (s.phase === 'result') {
      if (a.type !== 'next') throw new Error('Wait for the next round.');
      if (!s.ready.includes(seat)) s.ready.push(seat);
      if (!engine.toAct(s).length) { s.phase = 'bet'; s.ready = []; s.bets = Array.from({ length: s.n }, () => ({})); s.round++; s.msg = 'Place your bets'; s.wins = Array(s.n).fill(0); }
      return s;
    }
    throw new Error('Unknown move.');
  },
  over() { return null; },
  botDelay(s) { return s.phase === 'result' ? 8500 : 900; },
  bot(s, seat) {
    if (s.phase === 'result') return { type: 'next' };
    const placed = Object.values(s.bets[seat]).reduce((a, b) => a + b, 0);
    if (s.chips[seat] < 1 && !placed) return { type: 'rebuy' };
    if (placed < 60 && s.chips[seat] >= 1 && Math.random() < .8) {
      const outside = ['red', 'black', 'odd', 'even', 'low', 'high', 'd1', 'd2', 'd3', 'c1', 'c2', 'c3'];
      const k = Math.random() < .55 ? outside[Math.floor(Math.random() * outside.length)] : 'n' + Math.floor(Math.random() * 37);
      return { type: 'bet', k, amount: Math.min(s.chips[seat], Math.random() < .5 ? 10 : 25) };
    }
    return { type: 'spin' };
  }
};
