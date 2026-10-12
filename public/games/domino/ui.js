import { h, fill, flip, sfxCard } from '../shared/table.js';
import { tableShell, placeSeats, seatEl, tile, tileBacks, confetti } from '../shared/cards.js';
import { engine, fits, ends } from './engine.js';

const nm = (t, seats) => (t || '').replace(/Seat (\d)/g, (m, d) => seats[d - 1]?.name || m);

export function dominoUI(root, { say }) {
  let st, ctx, lastSeq = -1, picked = null, lastRound = 0, won = false;
  const T = tableShell(root, { felt: 'green' });
  T.felt.classList.add('dm-board');
  T.hand.classList.add('dm-hand');
  new ResizeObserver(() => st && paintBoard()).observe(T.felt);

  function play(t) {
    const sides = fits(st, t);
    if (sides.length === 2 && ends(st)[0] !== ends(st)[1]) { picked = t.id; paint(); say('Pick an end of the line.'); return; }
    ctx.send({ type: 'play', id: t.id, side: sides[0] }); picked = null;
  }
  function paintBoard() {
    const line = st.line;
    const Tsz = parseFloat(getComputedStyle(T.felt).getPropertyValue('--t')) || 34;
    const width = T.felt.clientWidth - 120;
    const rows = []; let row = [], w = 0;
    line.forEach(t => {
      const tw = (t.a === t.b ? Tsz : Tsz * 2) + 4;
      if (w + tw > width && row.length) { rows.push(row); row = []; w = 0; }
      row.push(t); w += tw;
    });
    if (row.length) rows.push(row);
    const pickedTile = picked != null ? st.hands[ctx.mySeat]?.find(x => x.id === picked) : null;
    const endBtn = side => pickedTile ? h('button', { class: 'key key--amber dm-end', type: 'button', onclick: () => { ctx.send({ type: 'play', id: picked, side }); picked = null; } }, side === 'L' ? '◀ Left end' : 'Right end ▶') : null;
    fill(T.felt,
      st.msg ? h('p', { class: 'say' }, nm(st.msg, ctx.seats)) : null,
      h('div', { class: 'dm-info' }, h('span', { class: 'dm-chip', 'data-deal-from': '' }, `Boneyard ${st.bone.length}`), h('span', { class: 'dm-chip' }, `Round ${st.round} · to ${st.target}`)),
      line.length ? h('div', { class: 'dm-line' }, endBtn('L'),
        ...rows.map((r, ri) => h('div', { class: 'dm-row' + (ri % 2 ? ' rev' : '') }, ...r.map(t => {
          const dbl = t.a === t.b, a = ri % 2 ? t.b : t.a, b = ri % 2 ? t.a : t.b;
          return tile(a, b, { vertical: dbl, attrs: { 'data-k': 't' + t.id } });
        }))), endBtn('R')) : h('p', { class: 'dm-empty' }, 'Play any tile to start the line.'));
  }
  function paint() {
    const my = ctx.mySeat, myTurn = st.turn === my && st.winner == null, mine = st.hands[my] || [];
    const opps = []; for (let k = 1; k < st.n; k++) { const i = (my + k) % st.n; opps.push(seatEl(ctx.seats[i], { turn: st.turn === i && st.winner == null, count: st.hands[i].length, tag: st.scores[i] + ' pts', fan: tileBacks(st.hands[i].length) })); }
    placeSeats(T, opps);
    flip(root, () => {
      paintBoard();
      fill(T.hand, ...mine.map(t => {
        const ok = myTurn && fits(st, t).length > 0;
        return tile(t.a, t.b, { vertical: true, button: true, attrs: { 'data-k': 't' + t.id, class: (ok ? 'playable' : '') + (picked === t.id ? ' picked' : ''), disabled: !ok || null, onclick: () => play(t), 'aria-label': `${t.a}-${t.b} tile` } });
      }));
    });
    fill(T.me, seatEl(ctx.seats[my], { turn: myTurn, count: mine.length, you: true, tag: (st.scores[my] ?? 0) + ' pts' }));
    const canPlay = mine.some(t => fits(st, t).length);
    fill(T.act,
      myTurn && !canPlay && st.bone.length ? h('button', { class: 'key key--amber', type: 'button', onclick: () => ctx.send({ type: 'draw' }) }, 'Draw from boneyard') : null,
      myTurn && !canPlay && !st.bone.length ? h('button', { class: 'key key--amber', type: 'button', onclick: () => ctx.send({ type: 'pass' }) }, 'Pass') : null,
      h('p', { class: 'g-hint' }, st.winner != null ? '' : myTurn ? (canPlay ? 'Your turn. Play a tile that matches an end.' : st.bone.length ? 'Nothing fits. Draw a tile.' : 'Nothing fits and the boneyard is empty. Pass.') : `${ctx.seats[st.turn]?.name} is playing…`));
  }
  addEventListener('resize', () => st && paint());
  return {
    render(state, c) {
      st = state; ctx = c;
      if (st.seq !== lastSeq) { if (lastSeq >= 0) sfxCard(); lastSeq = st.seq; picked = null; }
      if (st.last && st.last.round !== lastRound) { lastRound = st.last.round; say(nm(`Seat ${st.last.winner + 1} wins round ${st.last.round}${st.last.blocked ? ' (blocked)' : ''}: +${st.last.pts}`, ctx.seats), 4500); }
      paint();
      if (st.winner != null && !won) { won = true; if (st.winner === ctx.mySeat) confetti(); } else if (st.winner == null) won = false;
    }
  };
}
