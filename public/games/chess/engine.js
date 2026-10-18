// Chess rules (chess.js) + a small alpha-beta bot. State is plain JSON so it can travel over the network.
import { Chess } from '../../vendor/chess.mjs';
import { botRand } from '../shared/rng.js';

function load(state) {
  const c = new Chess();
  for (const m of state.moves) c.move(m);
  return c;
}
const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
// Piece-square tables from white's point of view (a8..h1), simplified.
const PST = {
  p: [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
  n: [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
  b: [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
  r: [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
  q: [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
  k: [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20]
};
function evaluate(c) {
  // positive = good for side to move
  const b = c.board(); let s = 0;
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
    const p = b[r][f]; if (!p) continue;
    const idx = p.color === 'w' ? r * 8 + f : (7 - r) * 8 + f;
    const v = VAL[p.type] + PST[p.type][idx];
    s += p.color === 'w' ? v : -v;
  }
  return c.turn() === 'w' ? s : -s;
}
function ordered(c) {
  return c.moves({ verbose: true }).sort((a, b) => (b.captured ? VAL[b.captured] * 10 - VAL[b.piece] : 0) - (a.captured ? VAL[a.captured] * 10 - VAL[a.piece] : 0) + (b.promotion ? 800 : 0) - (a.promotion ? 800 : 0));
}
function negamax(c, depth, alpha, beta, budget) {
  if (c.isCheckmate()) return -100000 - depth;
  if (c.isDraw() || c.isStalemate()) return 0;
  if (depth === 0 || budget.n-- <= 0) return evaluate(c);
  let best = -Infinity;
  for (const m of ordered(c)) {
    c.move(m); const v = -negamax(c, depth - 1, -beta, -alpha, budget); c.undo();
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  return best;
}

export const engine = {
  setup() { return { moves: [], last: null, resigned: null }; },
  toAct(state) { if (engine.over(state)) return []; const c = load(state); return [c.turn() === 'w' ? 0 : 1]; },
  act(state, seat, a) {
    if (engine.over(state)) throw new Error('The game is over.');
    if (a.type === 'resign') return { ...state, resigned: seat };
    const c = load(state);
    if ((c.turn() === 'w' ? 0 : 1) !== seat) throw new Error("It's not your turn.");
    let m;
    try { m = c.move({ from: a.from, to: a.to, promotion: a.promotion || 'q' }); } catch { m = null; }
    if (!m) throw new Error('That move is not legal.');
    return { ...state, moves: [...state.moves, m.san], last: { from: m.from, to: m.to } };
  },
  over(state) {
    if (state.resigned != null) return { title: (state.resigned === 0 ? 'Black' : 'White') + ' wins', detail: (state.resigned === 0 ? 'White' : 'Black') + ' resigned', winner: 1 - state.resigned, keepTitle: true };
    const c = load(state);
    if (c.isCheckmate()) return { title: 'Checkmate', detail: (c.turn() === 'w' ? 'Black' : 'White') + ' wins', winner: c.turn() === 'w' ? 1 : 0, keepTitle: true };
    if (c.isStalemate()) return { title: 'Draw', detail: 'Stalemate' };
    if (c.isThreefoldRepetition()) return { title: 'Draw', detail: 'Threefold repetition' };
    if (c.isInsufficientMaterial()) return { title: 'Draw', detail: 'Insufficient material' };
    if (c.isDraw()) return { title: 'Draw', detail: '50-move rule' };
    return null;
  },
  botDelay() { return 500; },
  bot(state, seat, opts) {
    const c = load(state);
    const level = opts?.level || 2;
    const moves = ordered(c);
    if (!moves.length) return null;
    const depth = level === 1 ? 1 : level === 2 ? 2 : 3;
    const budget = { n: level === 3 ? 60000 : 15000 };
    let best = null, bestV = -Infinity;
    for (const m of moves) {
      c.move(m);
      let v = -negamax(c, depth - 1, -Infinity, Infinity, budget);
      c.undo();
      v += botRand() * (level === 1 ? 120 : level === 2 ? 25 : 6);
      if (v > bestV) { bestV = v; best = m; }
    }
    return { type: 'move', from: best.from, to: best.to, promotion: best.promotion };
  },
  // helpers for the UI
  view(state) {
    const c = load(state);
    return { board: c.board(), turn: c.turn(), inCheck: c.inCheck(), legal: c.moves({ verbose: true }).map(m => ({ from: m.from, to: m.to, promotion: m.promotion, captured: m.captured })), history: c.history({ verbose: true }) };
  }
};

// Chess has no hidden information.
engine.viewFor = s => s;

// Browser only: think in a worker. Falls back to the main thread if workers are unavailable.
let worker = null, wid = 0; const waiting = new Map();
engine.botAsync = (state, seat, opts) => {
  if (typeof Worker === 'undefined' || typeof document === 'undefined') return engine.bot(state, seat, opts);
  try {
    if (!worker) { worker = new Worker(new URL('./bot-worker.js', import.meta.url), { type: 'module' }); worker.onmessage = e => { waiting.get(e.data.id)?.(e.data.a); waiting.delete(e.data.id); }; }
    return new Promise(res => { const id = ++wid; waiting.set(id, res); worker.postMessage({ id, state, seat, opts }); });
  } catch { return engine.bot(state, seat, opts); }
};
