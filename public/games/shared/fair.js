// Shared by the game server and the /fair/ verifier: game registry, chip bookkeeping, and replay.
// Everything here is deterministic given the revealed seeds, so anyone can re-run a hand.
import { seeded, withRng, commitOf } from './rng.js';
import { engine as chess } from '../chess/engine.js';
import { engine as lastOne } from '../last-one/engine.js';
import { engine as durak } from '../durak/engine.js';
import { engine as domino } from '../domino/engine.js';
import { engine as blackjack } from '../blackjack/engine.js';
import { engine as roulette } from '../roulette/engine.js';
import { engine as poker } from '../poker/engine.js';

const sum = o => Object.values(o || {}).reduce((a, b) => a + b, 0);
const int = (v, lo, hi, d) => { v = Math.floor(+v); return Number.isFinite(v) && v >= lo && v <= hi ? v : d; };
const pick = (v, list, d) => list.includes(v) ? v : d;

export const GAMES = {
  chess: { engine: chess, min: 2, max: 2, opts: o => ({ level: int(o.level, 1, 3, 2), players: 2 }) },
  'last-one': { engine: lastOne, min: 2, max: 4, opts: o => ({ players: int(o.players, 2, 4, 4) }) },
  durak: { engine: durak, min: 2, max: 4, opts: o => ({ players: int(o.players, 2, 4, 2) }) },
  domino: { engine: domino, min: 2, max: 4, opts: o => ({ players: int(o.players, 2, 4, 2), target: pick(+o.target, [50, 100, 150], 100) }) },
  blackjack: {
    engine: blackjack, min: 1, max: 5, opts: o => ({ players: int(o.players, 1, 5, 3) }),
    casino: {
      minBuy: 10, maxBuy: 50000,
      settled: s => s.phase === 'bet' || s.phase === 'settle',
      handEnd: s => s.phase === 'settle',
      cashable: (s, i) => s.chips[i] + (s.phase === 'bet' ? s.bets[i] : 0),
      zero: (s, i) => { s.chips[i] = 0; if (s.phase === 'bet') s.bets[i] = 0; },
      autopilot: (s, i) => s.phase === 'bet' ? { type: 'sit' } : s.phase === 'play' ? { type: 'stand' } : { type: 'next' }
    }
  },
  roulette: {
    engine: roulette, min: 1, max: 6, opts: o => ({ players: int(o.players, 1, 6, 3) }),
    casino: {
      minBuy: 1, maxBuy: 50000,
      settled: s => s.phase === 'bet' || s.phase === 'result',
      handEnd: s => s.phase === 'result',
      cashable: (s, i) => s.chips[i] + (s.phase === 'bet' ? sum(s.bets[i]) : 0),
      zero: (s, i) => { s.chips[i] = 0; if (s.phase === 'bet') s.bets[i] = {}; },
      autopilot: (s, i) => s.phase === 'bet' ? { type: 'spin' } : { type: 'next' }
    }
  },
  poker: {
    engine: poker, min: 2, max: 6, opts: o => ({ players: int(o.players, 2, 6, 6) }),
    casino: {
      minBuy: 40, maxBuy: 2000,
      settled: s => s.phase === 'result',
      handEnd: s => s.phase === 'result',
      cashable: (s, i) => s.chips[i],
      zero: (s, i) => { s.chips[i] = 0; },
      autopilot: (s, i) => s.phase === 'result' ? { type: 'next' } : (s.currentBet - s.bets[i] > 0 ? { type: 'fold' } : { type: 'check' })
    }
  }
};

// Where one provably fair segment ends: a casino hand, or the whole game for the others.
export function segmentEnd(game, s) {
  const g = GAMES[game];
  return !!(g.casino ? g.casino.handEnd(s) || g.engine.over(s) : g.engine.over(s));
}

// Only these fields ever reach an engine, with fixed types. Anything else is dropped.
export function sanitize(a) {
  if (!a || typeof a !== 'object') throw new Error('Bad move.');
  const out = { type: String(a.type || '').slice(0, 12) };
  if (!/^[a-z]+$/.test(out.type)) throw new Error('Bad move.');
  const num = (k, lo, hi) => { if (a[k] == null) return; const v = Math.floor(+a[k]); if (!Number.isFinite(v) || v < lo || v > hi) throw new Error('Bad move.'); out[k] = v; };
  num('id', 0, 400); num('target', 0, 12); num('amount', 1, 1e9);
  if (a.to != null) { if (typeof a.to === 'string' && /^[a-h][1-8]$/.test(a.to)) out.to = a.to; else num('to', 1, 1e9); }
  if (a.from != null) { if (/^[a-h][1-8]$/.test(String(a.from))) out.from = String(a.from); else throw new Error('Bad move.'); }
  if (a.promotion != null) out.promotion = pick(a.promotion, ['q', 'r', 'b', 'n'], 'q');
  if (a.side != null) out.side = pick(a.side, ['L', 'R'], 'L');
  if (a.color != null) out.color = pick(a.color, ['r', 'y', 'g', 'b'], undefined);
  if (a.k != null) { const k = String(a.k); if (!/^([a-z]+[0-9]?|n[0-9]{1,2})$/.test(k) || k.length > 5) throw new Error('Bad move.'); out.k = k; }
  if (a.last != null) out.last = !!a.last;
  return out;
}

// Apply one logged action. '_credit' and '_cashout' are chip movements between a wallet and the table.
export function apply(game, s, seat, a) {
  const g = GAMES[game];
  if (a.type === '_credit') { const n = JSON.parse(JSON.stringify(s)); n.chips[seat] += a.amount; n.seq = (n.seq || 0) + 1; return n; }
  if (a.type === '_cashout') { const n = JSON.parse(JSON.stringify(s)); g.casino.zero(n, seat); n.seq = (n.seq || 0) + 1; return n; }
  return g.engine.act(s, seat, a);
}

// Re-run a revealed segment. Returns the final state, or throws if the log does not replay.
export function replay(r) {
  const g = GAMES[r.game];
  if (commitOf(r.seed) !== r.commit) throw new Error('The revealed seed does not match the commitment.');
  const rng = seeded(r.seed, r.clientSeed, 0);
  return withRng(rng, () => {
    let s = r.startState ? JSON.parse(JSON.stringify(r.startState)) : g.engine.setup(r.setup.n, r.setup.opts);
    for (const { seat, a } of r.actions) s = apply(r.game, s, seat, a);
    if (r.endHash && commitOf(JSON.stringify(s)) !== r.endHash) throw new Error('Replaying the log gives a different table than the server had.');
    return s;
  });
}
