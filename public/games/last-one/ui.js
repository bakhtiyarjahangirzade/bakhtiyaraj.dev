import { h, fill, flip, sfxCard } from '../shared/table.js';
import { seatBadge, backs } from '../shared/cards.js';
import { engine, playable, COLOR_NAME } from './engine.js';

const SYM = { s: '⊘', r: '⇄', '+2': '+2', w: 'W', '+4': '+4' };
const nm = (t, seats) => (t || '').replace(/Seat (\d)/g, (m, d) => seats[d - 1]?.name || m);

export function lastOneUI(root, { say }) {
  let st, ctx, lastSeq = -1, armed = false;
  const opps = h('div', { class: 'opps' });
  const center = h('div', { class: 'center well' });
  const act = h('div', { class: 'actbar' });
  const hand = h('div', { class: 'hand', role: 'group', 'aria-label': 'Your hand' });
  const me = h('div', { class: 'me-row' });
  const picker = h('div', { class: 'lo-picker', hidden: true, role: 'dialog', 'aria-label': 'Choose a color' });
  root.append(h('div', { class: 'ctable' }, opps, center, act, h('div', {}, me, hand)), picker);

  function face(c, opts = {}) {
    const col = c.c === 'w' ? (c.wild || 'w') : c.c;
    const sym = SYM[c.v] || c.v;
    const label = (c.c === 'w' ? (c.v === '+4' ? 'Wild draw four' : 'Wild') : COLOR_NAME[c.c] + ' ' + ({ s: 'skip', r: 'reverse', '+2': 'draw two' }[c.v] || c.v));
    return h(opts.button ? 'button' : 'span', { class: `card lo c-${col}${c.c === 'w' ? ' wild' : ''}${opts.cls ? ' ' + opts.cls : ''}`, 'data-k': 'c' + c.id, type: opts.button ? 'button' : null, 'aria-label': label, disabled: opts.disabled, onclick: opts.onclick },
      h('span', { class: 'ix' }, sym), h('span', { class: 'mid' + (sym.length > 1 ? ' word' : '') }, sym), h('span', { class: 'ix b' }, sym));
  }
  function play(card) {
    if (card.c === 'w') {
      fill(picker, h('p', { class: 'label' }, 'Choose a color'), h('div', { class: 'lo-colors' }, ...['r', 'y', 'g', 'b'].map(col => h('button', { class: 'key lo-color c-' + col, type: 'button', onclick: () => { picker.hidden = true; send(card, col); } }, COLOR_NAME[col]))), h('button', { class: 'key key--sm', type: 'button', onclick: () => { picker.hidden = true; } }, 'Cancel'));
      picker.hidden = false; picker.querySelector('.lo-color').focus(); return;
    }
    send(card);
  }
  function send(card, color) { ctx.send({ type: 'play', id: card.id, color, last: armed }); armed = false; }

  function paint() {
    const my = ctx.mySeat, myTurn = st.turn === my && st.winner == null;
    const order = []; for (let i = 1; i < st.n; i++) order.push((my + i) % st.n);
    fill(opps, ...order.map(i => h('div', { class: 'opp' },
      seatBadge(ctx.seats[i], { turn: st.turn === i && st.winner == null, count: st.hands[i].length, extra: st.called[i] && st.hands[i].length === 1 ? h('span', { class: 'lo-last' }, 'LAST') : null }),
      backs(st.hands[i].length))));
    const t = st.discard[st.discard.length - 1];
    const canDraw = myTurn && !st.drew;
    flip(root, () => {
      fill(center, 
        st.msg ? h('p', { class: 'say' }, nm(st.msg, ctx.seats)) : null,
        h('div', { class: 'pile' }, h('button', { class: 'card back lo-draw' + (canDraw ? ' playable' : ''), type: 'button', disabled: !canDraw, 'aria-label': `Draw a card (${st.draw.length} left)`, onclick: () => ctx.send({ type: 'draw' }) }), h('span', { class: 'label' }, st.draw.length + ' in deck')),
        h('div', { class: 'pile' }, h('div', { class: 'lo-stack' }, ...st.discard.slice(-3).map((c, i, a) => face(c, { cls: i < a.length - 1 ? 'under u' + (a.length - 1 - i) : '' }))), h('span', { class: 'label lo-now c-' + st.color }, 'Color · ' + COLOR_NAME[st.color])),
        h('div', { class: 'lo-dir', 'aria-label': st.dir === 1 ? 'Clockwise' : 'Counter-clockwise' }, st.dir === 1 ? '↻' : '↺'));
      const cards = st.hands[my] || [];
      const lastDrawn = st.drew ? cards[cards.length - 1]?.id : null;
      hand.style.setProperty('--ov', cards.length > 12 ? '-.55' : cards.length > 8 ? '-.42' : '-.2');
      fill(hand, ...cards.map(c => {
        const ok = myTurn && playable(st, c) && (!st.drew || c.id === lastDrawn);
        return face(c, { button: true, disabled: !ok, cls: ok ? 'playable' : '', onclick: () => play(c) });
      }));
    });
    fill(me, seatBadge(ctx.seats[my], { turn: myTurn, count: (st.hands[my] || []).length, you: true }));
    const mine = st.hands[my] || [];
    const exposedOther = st.exposed != null && st.exposed !== my;
    fill(act, 
      myTurn && mine.length === 2 ? h('button', { class: 'key' + (armed ? '' : ''), type: 'button', 'aria-pressed': String(armed), onclick: () => { armed = !armed; paint(); } }, h('span', { class: 'led' }), armed ? 'LAST! called' : 'Call LAST!') : null,
      myTurn && st.drew ? h('button', { class: 'key', type: 'button', onclick: () => ctx.send({ type: 'pass' }) }, 'Pass') : null,
      exposedOther ? h('button', { class: 'key key--amber lo-catch', type: 'button', onclick: () => ctx.send({ type: 'catch' }) }, `Catch ${ctx.seats[st.exposed]?.name}! (+2)`) : null,
      h('p', { class: 'g-hint' }, st.winner != null ? '' : myTurn ? (st.drew ? 'Play the card you drew, or pass.' : mine.length === 2 ? 'Two cards left: call LAST! before you play.' : 'Your turn. Play a matching card or draw.') : `${ctx.seats[st.turn]?.name} is playing…`));
  }
  return {
    render(state, c) {
      st = state; ctx = c;
      if (st.seq !== lastSeq) { if (lastSeq >= 0) sfxCard(); lastSeq = st.seq; picker.hidden = true; }
      if (st.caught && st.caught.seq === st.seq) say(`${ctx.seats[st.caught.by]?.name} caught ${ctx.seats[st.caught.who]?.name}: +2 cards`);
      paint();
    }
  };
}
