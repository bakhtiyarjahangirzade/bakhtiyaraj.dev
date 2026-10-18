import { h, fill, flip, sfxCard } from '../shared/table.js';
import { tableShell, placeSeats, seatEl, backs, cardBack, arc, confetti } from '../shared/cards.js';
import { engine, playable, COLOR_NAME } from './engine.js';

const SYM = { s: '⊘', r: '⇄', '+2': '+2', w: '★', '+4': '+4' };
const nm = (t, seats) => (t || '').replace(/Seat (\d)/g, (m, d) => seats[d - 1]?.name || m);

export function lastOneUI(root, { say }) {
  let st, ctx, lastSeq = -1, armed = false, won = false;
  const T = tableShell(root, { felt: 'red' });
  const picker = h('div', { class: 'lo-picker', hidden: true, role: 'dialog', 'aria-label': 'Choose a color' });
  root.append(picker);
  picker.addEventListener('keydown', e => { if (e.key === 'Escape') { picker.hidden = true; e.stopPropagation(); } if (e.key === 'Tab') { const f = [...picker.querySelectorAll('button')]; const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { f.at(-1).focus(); e.preventDefault(); } else if (!e.shiftKey && i === f.length - 1) { f[0].focus(); e.preventDefault(); } } });

  function face(c, o = {}) {
    const col = c.c === 'w' ? (c.wild || 'w') : c.c;
    const sym = SYM[c.v] || c.v;
    const label = c.c === 'w' ? (c.v === '+4' ? 'Wild draw four' : 'Wild') : COLOR_NAME[c.c] + ' ' + ({ s: 'skip', r: 'reverse', '+2': 'draw two' }[c.v] || c.v);
    return h(o.button ? 'button' : 'span', { class: `card lo c-${col}${c.c === 'w' ? ' wild' : ''}${o.cls ? ' ' + o.cls : ''}`, 'data-k': 'c' + c.id, type: o.button ? 'button' : null, 'aria-label': label + (c.wild ? ', ' + COLOR_NAME[c.wild] : ''), disabled: o.disabled, onclick: o.onclick },
      h('span', { class: 'ix' }, sym), h('span', { class: 'gem' }, h('b', { class: sym.length > 1 ? 'word' : '' }, sym)), h('span', { class: 'ix b' }, sym));
  }
  function play(card) {
    if (card.c === 'w') {
      fill(picker, h('div', { class: 'lo-pick' }, h('p', { class: 'lo-pick-t' }, 'Pick a color'),
        h('div', { class: 'lo-colors' }, ...['r', 'y', 'g', 'b'].map(col => h('button', { class: 'lo-color c-' + col, type: 'button', 'aria-label': COLOR_NAME[col], onclick: () => { picker.hidden = true; send(card, col); } }))),
        h('button', { class: 'key key--sm', type: 'button', onclick: () => { picker.hidden = true; } }, 'Cancel')));
      picker.hidden = false; picker.querySelector('.lo-color').focus(); return;
    }
    send(card);
  }
  function send(card, color) { ctx.send({ type: 'play', id: card.id, color, last: armed }); armed = false; }

  function paint() {
    const my = ctx.mySeat, myTurn = st.turn === my && st.winner == null;
    const opps = []; for (let k = 1; k < st.n; k++) { const i = (my + k * 1 + st.n) % st.n; opps.push(seatEl(ctx.seats[i], { turn: st.turn === i && st.winner == null, count: st.hands[i].length, fan: backs(st.hands[i].length), bubble: st.called[i] && st.hands[i].length === 1 ? 'LAST!' : null })); }
    placeSeats(T, opps);
    const canDraw = myTurn && !st.drew;
    flip(root, () => {
      fill(T.felt,
        st.msg ? h('p', { class: 'say' }, nm(st.msg, ctx.seats)) : null,
        h('div', { class: 'pile' }, h('div', { class: 'stack deck', 'data-deal-from': '' }, cardBack(), cardBack(), cardBack({ button: true, class: canDraw ? 'playable lo-draw' : 'lo-draw', disabled: !canDraw || null, 'aria-label': `Draw a card (${st.draw.length} left)`, onclick: () => ctx.send({ type: 'draw' }) })), h('span', { class: 'label' }, st.draw.length + ' left')),
        h('div', { class: 'pile' }, h('div', { class: 'stack lo-discard' }, ...st.discard.slice(-4).map((c, i, a) => { const el = face(c, { cls: 'u' + (a.length - 1 - i) }); el.style.setProperty('--rot', ((c.id * 37) % 30 - 15) + 'deg'); return el; })),
          h('span', { class: 'lo-now c-' + st.color }, COLOR_NAME[st.color])),
        h('div', { class: 'lo-dir' + (st.dir === 1 ? '' : ' ccw'), 'aria-label': st.dir === 1 ? 'Clockwise' : 'Counter-clockwise' }, '↻'));
      const cards = st.hands[my] || [];
      const lastDrawn = st.drew ? cards[cards.length - 1]?.id : null;
      fill(T.hand, ...cards.map(c => {
        const ok = myTurn && playable(st, c) && (!st.drew || c.id === lastDrawn);
        return face(c, { button: true, disabled: !ok, cls: ok ? 'playable' : '', onclick: () => play(c) });
      }));
      arc(T.hand, cards.length);
    });
    const mine = st.hands[my] || [];
    fill(T.me, seatEl(ctx.seats[my], { turn: myTurn, count: mine.length, you: true, bubble: st.called[my] && mine.length === 1 ? 'LAST!' : null }));
    const exposedOther = st.exposed != null && st.exposed !== my;
    fill(T.act,
      myTurn && mine.length === 2 ? h('button', { class: 'key lo-last-btn', type: 'button', 'aria-pressed': String(armed), onclick: () => { armed = !armed; paint(); } }, h('span', { class: 'led' }), armed ? 'LAST! called' : 'Call LAST!') : null,
      myTurn && st.drew ? h('button', { class: 'key', type: 'button', onclick: () => ctx.send({ type: 'pass' }) }, 'Pass') : null,
      exposedOther ? h('button', { class: 'key key--amber lo-catch', type: 'button', onclick: () => ctx.send({ type: 'catch' }) }, `Catch ${ctx.seats[st.exposed]?.name}! (+2)`) : null,
      h('p', { class: 'g-hint' }, st.winner != null ? '' : myTurn ? (st.drew ? 'Play the card you drew, or pass.' : mine.length === 2 ? 'Two cards left: call LAST! before you play.' : 'Your turn. Match the color or symbol, or draw.') : `${ctx.seats[st.turn]?.name} is playing…`));
  }
  addEventListener('resize', () => st && paint());
  return {
    render(state, c) {
      st = state; ctx = c;
      if (st.seq !== lastSeq) { if (lastSeq >= 0) sfxCard(); lastSeq = st.seq; picker.hidden = true; }
      if (st.caught && st.caught.seq === st.seq) say(`${ctx.seats[st.caught.by]?.name} caught ${ctx.seats[st.caught.who]?.name}: +2 cards`);
      paint();
      if (st.winner != null && !won) { won = true; if (st.winner === ctx.mySeat) confetti(); } else if (st.winner == null) won = false;
    }
  };
}
