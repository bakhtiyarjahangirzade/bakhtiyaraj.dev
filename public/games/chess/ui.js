// Chess board UI: click or drag to move, legal-move dots, promotion picker, move log on an amber screen.
import { h, fill, sfxCard } from '../shared/table.js';
import { seatEl, confetti } from '../shared/cards.js';
import { engine } from './engine.js';

const GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const NAME = { k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' };
const files = 'abcdefgh';
let imgs = false; const repaints = new Set();
{ const t = new Image(); t.onload = () => { imgs = true; repaints.forEach(f => f()); }; t.src = '/assets/game/chess/w-k.svg'; }
function pieceEl(color, type, key) {
  if (imgs) return h('img', { class: 'pc img ' + color, src: `/assets/game/chess/${color}-${type}.svg`, alt: '', draggable: 'false', 'data-k': key });
  return h('span', { class: 'pc ' + color, 'data-k': key }, GLYPH[type] + '\uFE0E');
}

export function chessUI(root, { say }) {
  let st, view, ctx, sel = null, flipped = null, lastLen = -1;
  const board = h('div', { class: 'cb', role: 'grid', 'aria-label': 'Chess board' });
  const top = h('div', { class: 'cb-player' }), bottom = h('div', { class: 'cb-player' });
  const log = h('ol', { class: 'cb-log' });
  const status = h('p', { class: 'cb-status', role: 'status', 'aria-live': 'polite' });
  const capTop = h('div', { class: 'cb-caps' }), capBottom = h('div', { class: 'cb-caps' });
  const promo = h('div', { class: 'cb-promo', hidden: true, role: 'dialog', 'aria-label': 'Choose promotion piece' });
  const resign = h('button', { class: 'key key--sm', type: 'button', onclick: () => { if (resign.dataset.armed) { ctx.send({ type: 'resign' }); delete resign.dataset.armed; resign.textContent = 'Resign'; } else { resign.dataset.armed = '1'; resign.textContent = 'Tap again to resign'; setTimeout(() => { delete resign.dataset.armed; resign.textContent = 'Resign'; }, 3000); } } }, 'Resign');
  const flipBtn = h('button', { class: 'key key--sm', type: 'button', onclick: () => { flipped = !isFlipped(); paint(); } }, 'Flip board');

  root.append(h('div', { class: 'cb-wrap' },
    h('div', { class: 'cb-boardcol' }, top, capTop, h('div', { class: 'cb-frame' }, board, promo), capBottom, bottom),
    h('aside', { class: 'cb-side chassis' },
      h('span', { class: 'screw tl' }), h('span', { class: 'screw tr' }), h('span', { class: 'screw bl' }), h('span', { class: 'screw br' }),
      h('p', { class: 'label' }, 'Move log'),
      h('div', { class: 'bezel' }, h('div', { class: 'vfd cb-screen' }, log)),
      status,
      h('div', { class: 'g-actions' }, flipBtn, resign))));

  repaints.add(() => st && paint());
  let won = false;
  const isFlipped = () => flipped ?? (ctx.mySeat === 1);

  board.addEventListener('click', e => {
    const sq = e.target.closest('[data-sq]')?.dataset.sq; if (!sq) return;
    clickSquare(sq);
  });
  // drag to move
  let drag = null;
  board.addEventListener('pointerdown', e => {
    const cell = e.target.closest('[data-sq]'); if (!cell || !canMove()) return;
    const sq = cell.dataset.sq, p = pieceAt(sq);
    if (!p || p.color !== view.turn) return;
    const glyph = cell.querySelector('.pc'); if (!glyph) return;
    drag = { sq, glyph, x: e.clientX, y: e.clientY, moved: false, pid: e.pointerId };
  });
  board.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 6) { drag.moved = true; try { board.setPointerCapture(drag.pid); } catch {} sel = drag.sq; paintMarks(); drag.glyph.classList.add('dragging'); }
    if (drag.moved) drag.glyph.style.transform = `translate(${dx}px,${dy}px) scale(1.15)`;
  });
  board.addEventListener('pointerup', e => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.moved) return;
    try { board.releasePointerCapture(d.pid); } catch {}
    d.glyph.classList.remove('dragging'); d.glyph.style.transform = '';
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-sq]');
    if (el && el.dataset.sq !== d.sq) { tryMove(d.sq, el.dataset.sq); }
    board.addEventListener('click', ev => ev.stopPropagation(), { capture: true, once: true });
  });

  function canMove() { return ctx && engine.toAct(st).includes(ctx.mySeat); }
  function pieceAt(sq) { const f = files.indexOf(sq[0]), r = 8 - +sq[1]; return view.board[r][f]; }
  function clickSquare(sq) {
    if (!canMove()) { if (!engine.over(st)) say("Wait for your turn."); return; }
    const p = pieceAt(sq);
    if (sel && sel !== sq && view.legal.some(m => m.from === sel && m.to === sq)) { tryMove(sel, sq); return; }
    sel = p && p.color === view.turn ? (sel === sq ? null : sq) : null;
    paintMarks();
  }
  function tryMove(from, to) {
    const ms = view.legal.filter(m => m.from === from && m.to === to);
    if (!ms.length) { sel = null; paintMarks(); return; }
    if (ms.some(m => m.promotion)) { askPromotion(from, to); return; }
    sel = null; ctx.send({ type: 'move', from, to });
  }
  function askPromotion(from, to) {
    const color = view.turn;
    fill(promo, ...['q', 'r', 'b', 'n'].map(t => h('button', { class: 'key', type: 'button', 'aria-label': 'Promote to ' + NAME[t], onclick: () => { promo.hidden = true; sel = null; ctx.send({ type: 'move', from, to, promotion: t }); } }, pieceEl(color, t, 'promo' + t))),
      h('button', { class: 'key key--sm', type: 'button', onclick: () => { promo.hidden = true; } }, 'Cancel'));
    promo.hidden = false; promo.querySelector('button').focus();
  }

  function paint() {
    const fl = isFlipped();
    const cells = [];
    const last = st.last, checkSq = view.inCheck ? findKing(view.turn) : null;
    for (let i = 0; i < 64; i++) {
      const r = fl ? 7 - Math.floor(i / 8) : Math.floor(i / 8), f = fl ? 7 - (i % 8) : i % 8;
      const sq = files[f] + (8 - r), p = view.board[r][f];
      const cls = ['sq', (r + f) % 2 ? 'dark' : 'light'];
      if (last && (last.from === sq || last.to === sq)) cls.push('last');
      if (checkSq === sq) cls.push('check');
      const label = sq + (p ? ', ' + (p.color === 'w' ? 'white ' : 'black ') + NAME[p.type] : '');
      cells.push(h('button', { class: cls.join(' '), type: 'button', 'data-sq': sq, 'aria-label': label, tabindex: i === 0 ? '0' : '-1' },
        p ? pieceEl(p.color, p.type, p.color + p.type + sq) : null,
        (fl ? f === 7 : f === 0) ? h('span', { class: 'coord rk' }, String(8 - r)) : null,
        (fl ? r === 0 : r === 7) ? h('span', { class: 'coord fl' }, files[f]) : null));
    }
    fill(board, ...cells);
    paintMarks();
    // players
    const seatTop = fl ? 0 : 1, seatBottom = fl ? 1 : 0;
    const turnSeat = view.turn === 'w' ? 0 : 1, over = engine.over(st);
    [[top, seatTop], [bottom, seatBottom]].forEach(([el, s]) => {
      const seat = ctx.seats[s];
      fill(el, seatEl(seat, { turn: !over && turnSeat === s, you: s === ctx.mySeat && !ctx.local, tag: s === 0 ? 'White' : 'Black' }));
    });
    // captures
    const caps = { w: [], b: [] };
    for (const m of view.history) if (m.captured) caps[m.color].push(m.captured);
    const capEl = (color) => caps[color].sort((a, b) => 'qrbnp'.indexOf(a) - 'qrbnp'.indexOf(b)).map((t, i) => pieceEl(color === 'w' ? 'b' : 'w', t, 'cap' + color + i));
    fill(capTop, ...capEl(seatTop === 0 ? 'w' : 'b'));
    fill(capBottom, ...capEl(seatBottom === 0 ? 'w' : 'b'));
    // log
    const rows = [];
    for (let i = 0; i < st.moves.length; i += 2) rows.push(h('li', {}, h('span', { class: 'n' }, (i / 2 + 1) + '.'), h('span', {}, st.moves[i]), h('span', {}, st.moves[i + 1] || '')));
    fill(log, ...rows); log.parentElement.scrollTop = 1e6;
    status.textContent = over ? `${over.title}. ${over.detail || ''}` : view.inCheck ? `${view.turn === 'w' ? 'White' : 'Black'} is in check.` : canMove() ? (ctx.local ? `${view.turn === 'w' ? 'White' : 'Black'} to move.` : 'Your move.') : `${ctx.seats[turnSeat]?.name || 'Opponent'} is thinking…`;
    resign.hidden = !!over || ctx.mySeat < 0;
  }
  function paintMarks() {
    board.querySelectorAll('.sel,.dot,.cap').forEach(el => el.classList.remove('sel', 'dot', 'cap'));
    if (!sel) return;
    board.querySelector(`[data-sq="${sel}"]`)?.classList.add('sel');
    for (const m of view.legal) if (m.from === sel) board.querySelector(`[data-sq="${m.to}"]`)?.classList.add(m.captured ? 'cap' : 'dot');
  }
  function findKing(color) { for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) { const p = view.board[r][f]; if (p && p.type === 'k' && p.color === color) return files[f] + (8 - r); } }

  // keyboard: arrows move focus around the grid
  board.addEventListener('keydown', e => {
    const cells = [...board.children]; const i = cells.indexOf(document.activeElement); if (i < 0) return;
    const d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 8, ArrowUp: -8 }[e.key]; if (!d) return;
    e.preventDefault(); const n = cells[Math.min(63, Math.max(0, i + d))]; cells.forEach(c => c.tabIndex = -1); n.tabIndex = 0; n.focus();
  });

  return {
    render(state, c) {
      st = state; ctx = c; view = engine.view(state);
      if (st.moves.length !== lastLen) { if (lastLen >= 0) sfxCard(); lastLen = st.moves.length; sel = null; promo.hidden = true; }
      paint();
      const res = engine.over(st);
      if (res && !won) { won = true; if (res.winner != null && (res.winner === ctx.mySeat || ctx.local)) confetti(); } else if (!res) won = false;
    }
  };
}
