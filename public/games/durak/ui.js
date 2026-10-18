import { h, fill, flip, sfxCard } from '../shared/table.js';
import { tableShell, placeSeats, seatEl, backs, stdCard, cardBack, arc, confetti } from '../shared/cards.js';
import { engine, beats, canThrow } from './engine.js';

const SUIT = { s: '♠', c: '♣', h: '♥', d: '♦' };
const SUIT_NAME = { s: 'spades', c: 'clubs', h: 'hearts', d: 'diamonds' };
const ORDER = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const nm = (t, seats) => (t || '').replace(/Seat (\d)/g, (m, d) => seats[d - 1]?.name || m);

export function durakUI(root, { say }) {
  let st, ctx, lastSeq = -1, picked = null, won = false;
  const T = tableShell(root, { felt: 'green' });

  const face = (c, o = {}) => stdCard(c, { ...o, cls: (o.cls || '') + (c.s === st.trump ? ' trump' : ''), note: c.s === st.trump ? 'trump' : '' });

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

  function paint() {
    const my = ctx.mySeat, mine = st.hands[my] || [], toAct = engine.toAct(st);
    const role = i => st.out.includes(i) ? 'Out' : i === st.defender ? 'Defends' : i === st.attacker ? 'Attacks' : '';
    const opps = []; for (let k = 1; k < st.n; k++) { const i = (my + k + st.n) % st.n; opps.push(seatEl(ctx.seats[i], { turn: toAct.includes(i), count: st.hands[i].length, tag: role(i), fan: backs(st.hands[i].length) })); }
    placeSeats(T, opps);
    const iDefend = my === st.defender && !st.out.includes(my);
    const mineSel = mine.find(c => c.id === picked);
    flip(root, () => {
      fill(T.felt,
        st.msg ? h('p', { class: 'say' }, nm(st.msg, ctx.seats)) : null,
        h('div', { class: 'pile dk-deck' },
          st.talon.length ? h('div', { class: 'dk-talon' }, face(st.trumpCard, { cls: 'dk-trumpcard' }), st.talon.length > 1 ? h('div', { class: 'stack deck dk-top', 'data-deal-from': '' }, cardBack(), cardBack(), cardBack()) : null)
            : h('div', { class: 'dk-trumpsuit' + (st.trump === 'h' || st.trump === 'd' ? ' red' : '') }, SUIT[st.trump] + '︎'),
          h('span', { class: 'label' }, `${st.talon.length} in deck · trump ${SUIT_NAME[st.trump]}`)),
        h('div', { class: 'dk-table', 'aria-label': 'Table' }, st.table.length ? st.table.map((p, i) => {
          const target = mineSel && !p.d && beats(mineSel, p.a, st.trump);
          return h('div', { class: 'dk-pair' + (target ? ' target' : '') },
            face(p.a, { button: !!target, onclick: target ? () => { ctx.send({ type: 'defend', id: picked, target: i }); picked = null; } : null }),
            p.d ? face(p.d, { cls: 'def' }) : null);
        }) : h('p', { class: 'dk-empty' }, st.durak != null ? '' : `${ctx.seats[st.attacker]?.name} attacks ${ctx.seats[st.defender]?.name}`)),
        h('div', { class: 'pile dk-bito' }, h('div', { class: 'stack' }, st.discarded ? cardBack({ class: 'dk-discard' }) : null), h('span', { class: 'label' }, `${st.discarded} beaten`)));
      const sorted = [...mine].sort((a, b) => (a.s === st.trump) - (b.s === st.trump) || 'scdh'.indexOf(a.s) - 'scdh'.indexOf(b.s) || ORDER.indexOf(a.r) - ORDER.indexOf(b.r));
      fill(T.hand, ...sorted.map(c => {
        let ok = false;
        if (st.durak == null && toAct.includes(my)) ok = iDefend ? !st.taking && st.table.some(p => !p.d && beats(c, p.a, st.trump)) : canThrow(st, my, c);
        return face(c, { button: true, disabled: !ok, cls: (ok ? 'playable' : '') + (picked === c.id ? ' picked' : ''), onclick: () => clickHand(c) });
      }));
      arc(T.hand, sorted.length);
    });
    fill(T.me, seatEl(ctx.seats[my], { turn: toAct.includes(my), count: mine.length, you: true, tag: role(my) }));
    const canPass = toAct.includes(my) && !iDefend && st.table.length > 0;
    const allBeaten = st.table.length && st.table.every(p => p.d);
    let hint = 'Waiting…';
    if (st.durak != null) hint = '';
    else if (st.out.includes(my)) hint = "You're out. Watch the rest play.";
    else if (iDefend && !st.table.length) hint = `Get ready: ${ctx.seats[st.attacker]?.name} attacks you.`;
    else if (iDefend) hint = st.taking ? 'You are taking. Attackers may add more cards.' : st.table.some(p => !p.d) ? 'Beat each attacking card, or take them all.' : 'All beaten. Waiting for attackers.';
    else if (!st.table.length && my === st.attacker) hint = 'Your attack: play any card.';
    else if (canPass) hint = st.taking ? 'Defender takes. Add matching ranks or press Done.' : allBeaten ? 'All beaten. Throw in a matching rank or press Done.' : 'You can throw in cards of ranks on the table.';
    fill(T.act,
      iDefend && !st.taking && st.table.some(p => !p.d) && toAct.includes(my) ? h('button', { class: 'key', type: 'button', onclick: () => ctx.send({ type: 'take' }) }, 'Take cards') : null,
      canPass ? h('button', { class: 'key key--amber', type: 'button', onclick: () => ctx.send({ type: 'pass' }) }, st.taking ? 'Done adding' : allBeaten ? 'Done · Bito' : 'Done') : null,
      h('p', { class: 'g-hint' }, hint));
  }
  addEventListener('resize', () => st && paint());
  return {
    render(state, c) {
      st = state; ctx = c;
      if (st.seq !== lastSeq) { if (lastSeq >= 0) sfxCard(); lastSeq = st.seq; if (picked != null && !(st.hands[c.mySeat] || []).some(x => x && x.id === picked)) picked = null; }
      paint();
      const res = engine.over(st);
      if (res && !won) { won = true; if (res.loser !== ctx.mySeat) confetti(); } else if (!res) won = false;
    }
  };
}
