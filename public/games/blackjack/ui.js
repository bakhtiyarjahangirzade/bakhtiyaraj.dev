import { h, fill, flip, sfxCard } from '../shared/table.js';
import { stdCard, cardBack, avatarUrl, confetti } from '../shared/cards.js';
import { engine, total, isBJ, MIN_BET, START } from './engine.js';

const CHIPS = [10, 25, 100, 500];
const RES = { win: 'WIN', blackjack: 'BLACKJACK', push: 'PUSH', lose: 'LOSE', bust: 'BUST' };
const fmt = n => n.toLocaleString('en-US');
export function chip(v, attrs = {}) { return h(attrs.onclick ? 'button' : 'span', { ...attrs, class: 'chip c' + v + (attrs.class ? ' ' + attrs.class : ''), type: attrs.onclick ? 'button' : null }, h('b', {}, v >= 1000 ? v / 1000 + 'K' : String(v))); }
export function chipStack(amount) {
  const out = []; let left = amount;
  for (const v of [500, 100, 25, 10]) while (left >= v && out.length < 8) { out.push(v); left -= v; }
  return h('span', { class: 'stackc' }, out.reverse().map((v, i) => { const c = chip(v); c.style.setProperty('--i', i); return c; }));
}

export function blackjackUI(root, { say }) {
  let st, ctx, lastSeq = -1, pending = 0, lastRound = 0;
  const arcText = h('div', { class: 'bj-arc', 'aria-hidden': 'true' }, h('b', {}, 'BLACKJACK PAYS 3 TO 2'), h('span', {}, 'Dealer stands on 17'));
  const dealer = h('div', { class: 'bj-dealer' });
  const spots = h('div', { class: 'bj-spots' });
  const shoe = h('div', { class: 'bj-shoe', 'data-deal-from': '', 'aria-hidden': 'true' }, h('span', { class: 'card back' }), h('span', { class: 'card back' }));
  const felt = h('div', { class: 'felt bj-felt' }, arcText, shoe, dealer, spots);
  const controls = h('div', { class: 'bj-controls' });
  root.append(h('div', { class: 'bj-wrap' }, h('div', { class: 'felt-table bj-table' }, felt), controls));

  function handEl(hd, hidden) {
    return h('div', { class: 'bj-hand' }, hd.cards.map((c, i) => (hidden && i === 1) ? cardBack({ 'data-k': 'hole' }) : stdCard(c, { key: 'c' + c.id })));
  }
  function badge(cards, hidden) {
    if (!cards.length) return null;
    if (hidden) return h('span', { class: 'bj-total' }, String(total([cards[0]]).t));
    const { t, soft } = total(cards);
    return h('span', { class: 'bj-total' + (t > 21 ? ' bust' : '') }, isBJ(cards) ? 'BJ' : (soft && t < 21 ? `${t - 10}/${t}` : String(t)));
  }
  function paint() {
    const my = ctx.mySeat;
    flip(root, () => fill(dealer, h('div', { class: 'bj-dealer-hand' }, handEl(st.dealer, st.dealer.hidden), badge(st.dealer.cards, st.dealer.hidden)), h('span', { class: 'bj-dealer-l' }, 'Dealer'), st.msg ? h('p', { class: 'say' }, st.msg) : null));
    const n = st.n;
    flip(root, () => {
      fill(spots, ...Array.from({ length: n }, (_, i) => {
        const th = n === 1 ? Math.PI / 2 : (Math.PI * (160 - i * (140 / (n - 1)))) / 180;
        const x = 50 + 41 * Math.cos(th), y = 8 + 62 * Math.sin(th);
        const turn = st.turn && st.turn.seat === i;
        const hs = st.hands[i];
        const av = h('span', { class: 'avatar sm' }); av.style.backgroundImage = `url(${avatarUrl(ctx.seats[i])})`;
        const el = h('div', { class: 'bj-spot' + (turn ? ' turn' : '') + (i === my ? ' me' : '') },
          h('div', { class: 'bj-hands' }, hs.map((hd, hi) => h('div', { class: 'bj-hwrap' + (turn && st.turn.hand === hi ? ' active' : '') },
            hd.result ? h('span', { class: 'bj-res r-' + hd.result }, RES[hd.result]) : null,
            handEl(hd), badge(hd.cards)))),
          h('div', { class: 'bj-circle' }, (st.bets[i] || hs.length) ? chipStack(hs.reduce((a, b) => a + b.bet, 0) || st.bets[i]) : null,
            h('span', { class: 'bj-bet' }, fmt(hs.reduce((a, b) => a + b.bet, 0) || st.bets[i] || 0))),
          h('div', { class: 'bj-who' }, av, h('span', { class: 'nameplate' }, `${ctx.seats[i]?.name || '—'}${i === my ? ' (you)' : ''}`, h('span', { class: 'count bj-chips' }, fmt(st.chips[i])))));
        el.style.left = x + '%'; el.style.top = y + '%';
        return el;
      }));
    });
    // controls
    const kids = [];
    if (my < 0) kids.push(h('p', { class: 'g-hint' }, 'You are watching this table.'));
    else if (st.phase === 'bet') {
      if (st.bets[my]) kids.push(h('p', { class: 'g-hint' }, 'Bet placed. Waiting for the other players…'));
      else if (st.chips[my] < MIN_BET) kids.push(h('button', { class: 'key key--amber', type: 'button', onclick: () => ctx.send({ type: 'rebuy' }) }, `Rebuy ${fmt(START)} chips`));
      else {
        kids.push(h('div', { class: 'bj-rack' }, CHIPS.filter(v => v <= st.chips[my]).map(v => chip(v, { 'aria-label': 'Add ' + v, onclick: () => { pending = Math.min(st.chips[my], pending + v); paint(); } }))),
          h('div', { class: 'bj-pending' }, h('span', { class: 'label' }, 'Your bet'), h('b', {}, fmt(pending))),
          h('button', { class: 'key', type: 'button', disabled: !pending, onclick: () => { pending = 0; paint(); } }, 'Clear'),
          h('button', { class: 'key key--amber', type: 'button', disabled: pending < MIN_BET, onclick: () => { ctx.send({ type: 'bet', amount: pending }); } }, 'Deal'));
      }
    } else if (st.phase === 'play') {
      if (st.turn && st.turn.seat === my) {
        const hd = st.hands[my][st.turn.hand];
        const v = c => 'JQK'.includes(c.r) ? '10' : c.r;
        kids.push(h('button', { class: 'key key--amber', type: 'button', onclick: () => ctx.send({ type: 'hit' }) }, 'Hit'),
          h('button', { class: 'key key--amber', type: 'button', onclick: () => ctx.send({ type: 'stand' }) }, 'Stand'),
          h('button', { class: 'key', type: 'button', disabled: hd.cards.length !== 2 || st.chips[my] < hd.bet, onclick: () => ctx.send({ type: 'double' }) }, 'Double'),
          h('button', { class: 'key', type: 'button', disabled: !(hd.cards.length === 2 && v(hd.cards[0]) === v(hd.cards[1]) && st.hands[my].length === 1 && st.chips[my] >= hd.bet), onclick: () => ctx.send({ type: 'split' }) }, 'Split'));
      } else kids.push(h('p', { class: 'g-hint' }, st.turn ? `${ctx.seats[st.turn.seat]?.name} is playing…` : 'Dealer plays…'));
    } else if (st.phase === 'settle') {
      const mine = st.hands[my] || [];
      const net = mine.reduce((a, hd) => a + (hd.payout || 0) - hd.bet, 0);
      kids.push(h('p', { class: 'bj-net ' + (net > 0 ? 'up' : net < 0 ? 'down' : '') }, mine.length ? (net > 0 ? `+${fmt(net)}` : net < 0 ? `−${fmt(-net)}` : 'Push') : ''),
        st.ready.includes(my) ? h('p', { class: 'g-hint' }, 'Waiting for the table…') : h('button', { class: 'key key--amber', type: 'button', onclick: () => ctx.send({ type: 'next' }) }, 'Next hand'));
    }
    fill(controls, ...kids);
  }
  addEventListener('resize', () => st && paint());
  return {
    render(state, c) {
      st = state; ctx = c;
      if (st.seq !== lastSeq) { if (lastSeq >= 0) sfxCard(); lastSeq = st.seq; }
      if (st.phase === 'bet' && st.round !== lastRound) { lastRound = st.round; pending = Math.min(pending || 25, st.chips[ctx.mySeat] || 0); }
      paint();
      if (st.phase === 'settle' && !st._c) { const mine = st.hands[ctx.mySeat] || []; if (mine.some(hd => hd.result === 'blackjack')) confetti(1800); st._c = 1; }
    }
  };
}
