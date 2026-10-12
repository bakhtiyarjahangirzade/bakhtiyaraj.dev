// Server-side slot spins. Each player has a seed pair: a secret server seed (only its SHA-256 commitment is shown),
// a client seed they control, and a nonce that counts spins. Spin n uses the stream seeded(seed, clientSeed + ':' + n).
// Rotating the pair reveals the old server seed so every past spin can be recomputed on /fair/.
import { MACHINES, spin, evaluate } from '../public/games/slots/machines.js';
import { seeded, withRng, randomSeed, commitOf } from '../public/games/shared/rng.js';
import { UserError } from './core.mjs';

const fail = m => { throw new UserError(m); };
export function freshSeeds(clientSeed) {
  const seed = randomSeed();
  return { seed, commit: commitOf(seed), client_seed: clientSeed || randomSeed(8), nonce: 0, free: null };
}
export function cleanClientSeed(v) { const s = String(v || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64); return s || null; }

// Pure: returns the spin result and the new seed row. Wallet change = win - cost.
export function doSpin(row, machineId, lineBet, balance) {
  const m = MACHINES.find(x => x.id === machineId); if (!m) fail('Unknown machine.');
  lineBet = Math.floor(+lineBet);
  let free = row.free && row.free.machine === m.id && row.free.left > 0 ? row.free : null;
  if (free) lineBet = free.lineBet;
  else if (!m.bets.includes(lineBet)) fail('Pick one of the listed bets.');
  const cost = free ? 0 : lineBet * m.lines.length;
  if (cost > balance) fail(balance < m.bets[0] * m.lines.length ? 'Out of chips. Claim the daily bonus from your account.' : 'Lower your bet.');
  const nonce = row.nonce;
  const grid = withRng(seeded(row.seed, row.client_seed + ':' + nonce, 0), () => spin(m));
  const res = evaluate(m, grid, lineBet);
  let next = free ? { ...free, left: free.left - 1 } : null;
  if (res.free) next = { machine: m.id, lineBet, left: (next?.left || 0) + res.free };
  if (next && next.left <= 0) next = null;
  return {
    spin: { machine: m.id, line_bet: lineBet, cost, win: res.total, grid, nonce, commit: row.commit, client_seed: row.client_seed, free_spin: !!free },
    result: { grid, wins: res.wins, total: res.total, free: res.free, freeLeft: next?.left || 0, lineBet },
    row: { ...row, nonce: nonce + 1, free: next },
    delta: res.total - cost
  };
}
// Recompute one spin from revealed seeds (used by /fair/ and tests).
export function recompute(seed, clientSeed, nonce, machineId) {
  const m = MACHINES.find(x => x.id === machineId);
  return withRng(seeded(seed, clientSeed + ':' + nonce, 0), () => spin(m));
}
