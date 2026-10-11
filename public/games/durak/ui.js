import { h, fill, flip, sfxCard } from '../shared/table.js';
import { seatBadge, backs } from '../shared/cards.js';
import { engine, beats, canThrow, attackers } from './engine.js';

const SUIT = { s: '♠', c: '♣', h: '♥', d: '♦' };
const SUIT_NAME = { s: 'spades', c: 'clubs', h: 'hearts', d: 'diamonds' };
const RANK_NAME = { J: 'jack', Q: 'queen', K: 'king', A: 'ace' };
const nm = (t, seats) => (t || '').replace(/Seat (\d)/g, (m, d) => seats[d - 1]?.name || m);

export function durakUI(root, { say }) {
  let st, ctx, lastSeq = -1, picked = null;
  const opps = h('div', { class: 'opps' });
  const center = h('div', { class: 'center well dk-center' });
  const act = h('div', { class: 'actbar' });
  const hand = h('div', { class: 'hand', role: 'group', 'aria-label': 'Your hand' });
  const me = h('div', { class: 'me-row' });
  root.append(h('div', { class: 'ctable' }, opps, center, act, h('div', {}, me, hand)));

  const face = (c, o = {}) => h(o.button ? 'button' : 'span', {
    class: `card dk ${c.s === 'h' || c.s === 'd' ? 'red' : 'ink'}${c.s === st.trump ? ' trump' : ''}${o.cls ? ' ' + o.cls : ''}`, 'data-k': 'k' + c.id,
    type: o.button ? 'button' : null, disabled: o.disabled, onclick: o.onclick, 'aria-label': `${RANK_NAME[c.r] || c.r} of ${SUIT_NAME[c.s]}${c.s === st.trump ? ', trump' : ''}`
  }, h('span', { class: 'ix' }, c.r, h('small', {}, SUIT[c.s] + '︎')), h('span', { class: 'mid' }, SUIT[c.s] + '︎'), h('span', { class: 'ix b' }, c.r, h('small', {}, SUIT[c.s] + '︎')));

  function clickHand(c) {
    const my = ctx.mySeat;
    if (my === st.defender) {
      const open = st.table.map((p, i) => [p, i]).filter(([p]) => !p.d && beats(c, p.a, st.trump));
      if (!open.length) { say('That card does not beat any open attack.'); return; }
      if (open.length === 1) { picked = null; ctx.send({ type: 'defend', id: c.id, target: open[0][1] }); return; }
      picked = picked === c.id ? null : c.id; paint(); if (picked) say('Now tap the attacking card to beat.'); return;
    }
    ctx.send({ type: 'attack', id: c.id });
  }
  function clickPair(i) {
    if (picked == null) return;
    ctx.send({ type: 'defend', id: picked, target: i }); picked = null;
  }

  function paint() {
    const my = ctx.mySeat, mine = st.hands[my] || [], toAct = engine.toAct(st);
    const order = []; for (let i = 1; i < st.n; i++) order.push((my + i) % st.n);
    const role = i => st.out.includes(i) ? 'Out' : i === st.defender ? 'Defends' : i === st.attacker ? 'Attacks' : '';
    fill(opps, ...order.map(i => h('div', { class: 'opp' },
      seatBadge(ctx.seats[i], { turn: toAct.includes(i), count: st.hands[i].length, extra: role(i) ? h('span', { class: 'dk-role' }, role(i)) : null }),
      backs(st.hands[i].length))));
    const iDefend = my === st.defender && !st.out.includes(my);
    flip(root, () => {
      fill(center,
        st.msg ? h('p', { class: 'say' }, nm(st.msg, ctx.seats)) : null,
        h('div', { class: 'dk-deck pile' },
          st.talon.length ? h('div', { class: 'dk-talon' }, face(st.trumpCard, { cls: 'dk-trumpcard' }), st.talon.length > 1 ? h('span', { class: 'card back dk-top' }) : null) : h('div', { class: 'dk-trumpsuit ' + (st.trump === 'h' || st.trump === 'd' ? 'red' : '') }, SUIT[st.trump] + '︎'),
          h('span', { class: 'label' }, `${st.talon.length} left · trump ${SUIT_NAME[st.trump]}`)),
        h('div', { class: 'dk-table', 'aria-label': 'Table' }, st.table.length ? st.table.map((p, i) => h('div', { class: 'dk-pair' + (picked != null && !p.d && beats(mine.find(c => c.id === picked) || p.a, p.a, st.trump) ? ' target' : '') },
          (() => { const el = face(p.a, { button: picked != null && !p.d, onclick: () => clickPair(i) }); return el; })(),
          p.d ? face(p.d, { cls: 'def' }) : null)) : h('p', { class: 'g-hint' }, st.durak != null ? '' : `${ctx.seats[st.attacker]?.name} attacks ${ctx.seats[st.defender]?.name}`)),
        h('div', { class: 'pile dk-bito' }, st.discarded ? h('span', { class: 'card small back' }) : null, h('span', { class: 'label' }, `${st.discarded} out`)));
      const sorted = [...mine].sort((a, b) => (a.s === st.trump) - (b.s === st.trump) || 'scdh'.indexOf(a.s) - 'scdh'.indexOf(b.s) || ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'].indexOf(a.r) - ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'].indexOf(b.r));
      hand.style.setProperty('--ov', sorted.length > 12 ? '-.55' : sorted.length > 8 ? '-.42' : '-.2');
      fill(hand, ...sorted.map(c => {
        let ok = false;
        if (st.durak == null && toAct.includes(my)) {
          if (iDefend) ok = !st.taking && st.table.some(p => !p.d && beats(c, p.a, st.trump));
          else ok = canThrow(st, my, c);
        }
        return face(c, { button: true, disabled: !ok, cls: (ok ? 'playable' : '') + (picked === c.id ? ' picked' : ''), onclick: () => clickHand(c) });
      }));
    });
    fill(me, seatBadge(ctx.seats[my], { turn: toAct.includes(my), count: mine.length, you: true, extra: role(my) ? h('span', { class: 'dk-role' }, role(my)) : null }));
    const canPass = toAct.includes(my) && !iDefend && st.table.length > 0;
    const allBeaten = st.table.length && st.table.every(p => p.d);
    let hint = '';
    if (st.durak != null) hint = '';
    else if (st.out.includes(my)) hint = "You're out. Watch the rest play.";
    else if (iDefend) hint = st.taking ? 'You are taking. Attackers may add more cards.' : st.table.some(p => !p.d) ? 'Beat each attacking card, or take them all.' : 'All beaten. Waiting for attackers.';
    else if (!st.table.length && my === st.attacker) hint = 'Your attack: play any card.';
    else if (canPass) hint = st.taking ? 'Defender takes. Add cards of the same ranks or press Done.' : allBeaten ? 'All beaten. Throw in a matching rank or press Done.' : 'You can throw in cards of ranks on the table.';
    else hint = 'Waiting…';
    fill(act,
      iDefend && !st.taking && st.table.some(p => !p.d) && toAct.includes(my) ? h('button', { class: 'key', type: 'button', onclick: () => ctx.send({ type: 'take' }) }, 'Take cards') : null,
      canPass ? h('button', { class: 'key key--amber', type: 'button', onclick: () => ctx.send({ type: 'pass' }) }, st.taking ? 'Done adding' : allBeaten ? 'Done · Bito' : 'Done') : null,
      h('p', { class: 'g-hint' }, hint));
  }
  return {
    render(state, c) {
      st = state; ctx = c;
      if (st.seq !== lastSeq) { if (lastSeq >= 0) sfxCard(); lastSeq = st.seq; picked = null; }
      paint();
    }
  };
}
