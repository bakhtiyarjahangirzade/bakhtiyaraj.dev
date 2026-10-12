import { rand } from '../shared/rng.js';
// Slot machine definitions: reels, rows, weighted symbols, paytable (multiplier of line bet), paylines.
const L5 = [[1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2], [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [0, 1, 0, 1, 0]];
export const MACHINES = [
  { id: 'classic', name: 'Lucky Sevens', tag: '3 reels · 5 lines', theme: 'classic', reels: 3, rows: 3,
    symbols: [['cherry', 30, { 3: 10, 2: 2 }], ['lemon', 26, { 3: 15 }], ['orange', 22, { 3: 20 }], ['bell', 14, { 3: 40 }], ['bar', 9, { 3: 80 }], ['seven', 5, { 3: 200 }]],
    lines: [[1, 1, 1], [0, 0, 0], [2, 2, 2], [0, 1, 2], [2, 1, 0]], bets: [1, 2, 5, 10, 20] },
  { id: 'gems', name: 'Gem Rush', tag: '5 reels · 10 lines · wilds', theme: 'gems', reels: 5, rows: 3, wild: 'wild', scale: 1.38,
    symbols: [['topaz', 24, { 3: 4, 4: 10, 5: 30 }], ['amethyst', 22, { 3: 5, 4: 12, 5: 40 }], ['emerald', 18, { 3: 8, 4: 20, 5: 60 }], ['sapphire', 14, { 3: 10, 4: 30, 5: 90 }], ['ruby', 10, { 3: 15, 4: 50, 5: 150 }], ['diamond', 6, { 3: 30, 4: 100, 5: 400 }], ['wild', 4, { 3: 50, 4: 200, 5: 1000 }]],
    lines: L5, bets: [1, 2, 5, 10] },
  { id: 'fruit', name: 'Neon Orchard', tag: '5 reels · 10 lines · coin scatter', theme: 'neon', reels: 5, rows: 3, wild: 'star', scatter: 'coin', scale: 1.42,
    symbols: [['cherry', 22, { 3: 3, 4: 8, 5: 20 }], ['plum', 20, { 3: 4, 4: 10, 5: 25 }], ['grape', 18, { 3: 5, 4: 12, 5: 35 }], ['watermelon', 14, { 3: 8, 4: 25, 5: 70 }], ['clover', 10, { 3: 12, 4: 40, 5: 120 }], ['crown', 6, { 3: 25, 4: 80, 5: 300 }], ['star', 4, { 3: 40, 4: 150, 5: 600 }], ['coin', 5, {}]],
    lines: L5, bets: [1, 2, 5, 10] }
];
function pick(m) { const tot = m.symbols.reduce((a, s) => a + s[1], 0); let r = rand() * tot; for (const s of m.symbols) { if ((r -= s[1]) < 0) return s[0]; } return m.symbols[0][0]; }
export function spin(m) { return Array.from({ length: m.reels }, () => Array.from({ length: m.rows }, () => pick(m))); }
export function evaluate(m, grid, lineBet) {
  const pays = Object.fromEntries(m.symbols.map(s => [s[0], s[2]]));
  const wins = [];
  m.lines.forEach((line, li) => {
    const syms = line.map((row, reel) => grid[reel][row]);
    let base = syms.find(s => s !== m.wild && s !== m.scatter) || m.wild;
    if (base === m.scatter) return;
    let count = 0;
    for (const s of syms) { if (s === base || s === m.wild) count++; else break; }
    // a pure-wild run pays as wild if better
    let wildRun = 0; for (const s of syms) { if (s === m.wild) wildRun++; else break; }
    let pay = (pays[base] || {})[count] || 0, sym = base, n = count;
    const wp = m.wild ? (pays[m.wild] || {})[wildRun] || 0 : 0;
    if (wp > pay) { pay = wp; sym = m.wild; n = wildRun; }
    if (pay) wins.push({ line: li, sym, n, amount: Math.round(pay * (m.scale || 1) * lineBet), cells: line.slice(0, n).map((row, reel) => [reel, row]) });
  });
  let free = 0;
  if (m.scatter) {
    const cells = []; grid.forEach((col, r) => col.forEach((s, row) => { if (s === m.scatter) cells.push([r, row]); }));
    if (cells.length >= 3) { free = cells.length === 3 ? 5 : cells.length === 4 ? 10 : 20; wins.push({ line: -1, sym: m.scatter, n: cells.length, amount: lineBet * m.lines.length * 2, cells, free }); }
  }
  return { wins, total: wins.reduce((a, w) => a + w.amount, 0), free };
}
