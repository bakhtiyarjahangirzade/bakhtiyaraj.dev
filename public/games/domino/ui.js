import { h, fill, flip, sfxCard } from '../shared/table.js';
import { seatBadge, tile, tileBacks } from '../shared/cards.js';
import { engine, fits, ends } from './engine.js';

const nm = (t, seats) => (t || '').replace(/Seat (\d)/g, (m, d) => seats[d - 1]?.name || m);

export function dominoUI(root, { say }) {
  let st, ctx, lastSeq = -1, picked = null, lastRound = 0;
  const opps = h('div', { class: 'opps' });
  const board = h('div', { class: 'center well dm-board' });
  const act = h('div', { class: 'actbar' });
  const hand = h('div', { class: 'hand dm-hand', role: 'group', 'aria-label': 'Your tiles' });
  const me = h('div', { class: 'me-row' });
  root.append(h('div', { class: 'ctable' }, opps, board, act, h('div', {}, me, hand)));
  new ResizeObserver(() => st && paintBoard()).observe(board);

  function play(t) {
    const sides = fits(st, t);
    if (sides.length === 2 && ends(st)[0] !== ends(st)[1]) { picked = t.id; paint(); say('Pick an end of the line.'); return; }
    ctx.send({ type: 'play', id: t.id, side: sides[0] }); picked = null;
  }
  function paintBoard() {
    const line = st.line;
    const T = parseFloat(getComputedStyle(board).getPropertyValue('--t')) || 34;
    const width = board.clientWidth - 40;
    const rows = []; let row = [], w = 0;
    line.forEach((t, i) => {
      const tw = (t.a === t.b ? T : T * 2) + 4;
      if (w + tw > width && row.length) { rows.push(row); row = []; w = 0; }
      row.push([t, i]); w += tw;
    });
    if (row.length) rows.push(row);
    const pickedTile = picked != null ? st.hands[ctx.mySeat]?.find(x => x.id === picked) : null;
    const endBtn = (side) => pickedTile ? h('button', { class: 'key key--amber dm-end', type: 'button', onclick: () => { ctx.send({ type: 'play', id: picked, side }); picked = null; } }, side === 'L' ? '◀ Left end' : 'Right end ▶') : null;
    fill(board,
      st.msg ? h('p', { class: 'say' }, nm(st.msg, ctx.seats)) : null,
      h('div', { class: 'dm-boneyard' }, h('span', { class: 'label' }, `Boneyard ${st.bone.length}`), h('span', { class: 'label' }, `Round ${st.round} · to ${st.target}`)),
      line.length ? h('div', { class: 'dm-line' }, endBtn('L'),
        ...rows.map((r, ri) => h('div', { class: 'dm-row' + (ri % 2 ? ' rev' : '') }, ...r.map(([t]) => {
          const dbl = t.a === t.b, a = ri % 2 ? t.b : t.a, b = ri % 2 ? t.a : t.b;
          return tile(a, b, { vertical: dbl, attrs: { 'data-k': 't' + t.id } });
        }))), endBtn('R')) : h('p', { class: 'g-hint' }, 'Play any tile to start the line.'));
  }
  function paint() {
    const my = ctx.mySeat, myTurn = st.turn === my && st.winner == null, mine = st.hands[my] || [];
    const order = []; for (let i = 1; i < st.n; i++) order.push((my + i) % st.n);
    fill(opps, ...order.map(i => h('div', { class: 'opp' }, seatBadge(ctx.seats[i], { turn: st.turn === i && st.winner == null, count: st.hands[i].length, extra: h('span', { class: 'dm-score' }, st.scores[i] + ' pts') }), tileBacks(st.hands[i].length))));
    flip(root, () => {
      paintBoard();
      fill(hand, ...mine.map(t => {
        const ok = myTurn && fits(st, t).length > 0;
        return tile(t.a, t.b, { vertical: true, button: true, attrs: { 'data-k': 't' + t.id, class: (ok ? 'playable' : '') + (picked === t.id ? ' picked' : ''), disabled: !ok || null, onclick: () => play(t), 'aria-label': `${t.a}-${t.b} tile` } });
      }));
    });
    fill(me, seatBadge(ctx.seats[my], { turn: myTurn, count: mine.length, you: true, extra: h('span', { class: 'dm-score' }, (st.scores[my] ?? 0) + ' pts') }));
    const canPlay = mine.some(t => fits(st, t).length);
    fill(act,
      myTurn && !canPlay && st.bone.length ? h('button', { class: 'key key--amber', type: 'button', onclick: () => ctx.send({ type: 'draw' }) }, 'Draw from boneyard') : null,
      myTurn && !canPlay && !st.bone.length ? h('button', { class: 'key key--amber', type: 'button', onclick: () => ctx.send({ type: 'pass' }) }, 'Pass') : null,
      h('p', { class: 'g-hint' }, st.winner != null ? '' : myTurn ? (canPlay ? 'Your turn. Play a tile that matches an end.' : st.bone.length ? 'Nothing fits. Draw a tile.' : 'Nothing fits and the boneyard is empty. Pass.') : `${ctx.seats[st.turn]?.name} is playing…`));
  }
  return {
    render(state, c) {
      st = state; ctx = c;
      if (st.seq !== lastSeq) { if (lastSeq >= 0) sfxCard(); lastSeq = st.seq; picked = null; }
      if (st.last && st.last.round !== lastRound) { lastRound = st.last.round; say(nm(`Seat ${st.last.winner + 1} wins round ${st.last.round}${st.last.blocked ? ' (blocked)' : ''}: +${st.last.pts}`, ctx.seats), 4500); }
      paint();
    }
  };
}
