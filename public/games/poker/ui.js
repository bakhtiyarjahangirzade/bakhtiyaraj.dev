import { h, fill, flip, sfxCard } from '../shared/table.js';
import { stdCard, cardBack, avatarUrl, confetti } from '../shared/cards.js';
import { chipStack } from '../blackjack/ui.js';
import { engine } from './engine.js';

const fmt = n => n.toLocaleString('en-US');
const nm = (t, seats) => (t || '').replace(/Seat (\d)/g, (m, d) => seats[d - 1]?.name || m);

export function pokerUI(root, { say }) {
  let st, ctx, lastSeq = -1, raiseTo = 0, won = false;
  const seatsEl = h('div', { class: 'pk-seats' });
  const center = h('div', { class: 'pk-center' });
  const controls = h('div', { class: 'pk-controls' });
  root.append(h('div', { class: 'pk-wrap' }, h('div', { class: 'felt-table pk-table' }, h('div', { class: 'felt pk-felt' }, center, seatsEl)), controls));

  function paint() {
    const my = Math.max(0, ctx.mySeat), n = st.n, over = st.phase === 'result';
    flip(root, () => {
      fill(center,
        h('div', { class: 'pk-board', 'data-deal-from': '' }, Array.from({ length: 5 }, (_, i) => st.board[i] ? stdCard(st.board[i], { key: 'b' + st.board[i].id }) : h('span', { class: 'pk-slot' }))),
        h('div', { class: 'pk-pot' }, chipStack(Math.min(engine.pot(st), 4000)), h('span', {}, 'Pot ' + fmt(engine.pot(st)))),
        st.msg ? h('p', { class: 'say pk-say' }, nm(st.msg, ctx.seats)) : null,
        h('span', { class: 'pk-blinds' }, `Blinds ${st.sb}/${st.bb} · Hand ${st.handNo}`));
      fill(seatsEl, ...Array.from({ length: n }, (_, i) => {
        const rel = (i - my + n) % n, ang = (90 + rel * 360 / n) * Math.PI / 180;
        const xr = matchMedia('(max-width: 600px)').matches ? 36 : 41; const x = 50 + xr * Math.cos(ang), y = 50 + 37 * Math.sin(ang);
        const busted = st.chips[i] <= 0 && !st.inHand[i];
        const showCards = i === ctx.mySeat || (over && st.result?.shown && st.inHand[i] && !st.folded[i]);
        const av = h('span', { class: 'avatar' + (st.turn === i ? '' : '') }); av.style.backgroundImage = `url(${avatarUrl(ctx.seats[i])})`;
        const wonAmt = over ? st.result?.won?.[i] : 0;
        const el = h('div', { class: 'pk-seat' + (st.turn === i ? ' turn' : '') + (st.folded[i] ? ' folded' : '') + (busted ? ' out' : '') + (i === ctx.mySeat ? ' me' : '') },
          h('div', { class: 'pk-hole' }, st.inHand[i] ? st.hole[i].map((c, k) => showCards && c ? stdCard(c, { key: 'h' + c.id }) : cardBack({ 'data-k': 'hb' + i + '-' + k })) : null),
          h('div', { class: 'seat' + (st.turn === i ? ' turn' : '') }, h('span', { class: 'avatar' }, h('span', { class: 'ring' })),
            h('span', { class: 'nameplate' }, ctx.seats[i]?.name + (i === ctx.mySeat ? ' (you)' : ''), h('span', { class: 'count' }, busted ? 'OUT' : fmt(st.chips[i])))),
          st.dealer === i ? h('span', { class: 'pk-btn' }, 'D') : null,
          st.bets[i] && !over ? h('span', { class: 'pk-bet' }, chipStack(st.bets[i]), h('b', {}, fmt(st.bets[i]))) : null,
          st.lastAction?.seat === i && !over ? h('span', { class: 'bubble' }, st.lastAction.text) : null,
          wonAmt ? h('span', { class: 'bubble win' }, '+' + fmt(wonAmt) + (st.result.hands[i] ? ' · ' + st.result.hands[i] : '')) : (over && st.result?.shown && st.result.hands[i] ? h('span', { class: 'bubble lose' }, st.result.hands[i]) : null));
        el.querySelector('.seat .avatar').style.backgroundImage = `url(${avatarUrl(ctx.seats[i])})`;
        el.style.left = x + '%'; el.style.top = y + '%';
        return el;
      }));
    });
    const me = ctx.mySeat, kids = [];
    if (me < 0) kids.push(h('p', { class: 'g-hint' }, 'You are watching this table.'));
    else if (over) kids.push(st.ready.includes(me) || st.chips[me] <= 0 ? h('p', { class: 'g-hint' }, st.chips[me] <= 0 ? "You're out of chips." : 'Waiting for the table…') : h('button', { class: 'key key--amber', type: 'button', onclick: () => ctx.send({ type: 'next' }) }, 'Next hand'));
    else if (st.turn === me) {
      const toCall = st.currentBet - st.bets[me], max = st.bets[me] + st.chips[me], minTo = Math.min(max, st.currentBet + st.minRaise);
      if (!raiseTo || raiseTo < minTo || raiseTo > max) raiseTo = minTo;
      const pot = engine.pot(st);
      const slider = h('input', { type: 'range', class: 'pk-range', min: String(minTo), max: String(max), step: String(st.sb), value: String(raiseTo), 'aria-label': 'Raise amount', oninput: e => { raiseTo = +e.target.value; amt.textContent = fmt(raiseTo); } });
      const amt = h('b', { class: 'pk-amt' }, fmt(raiseTo));
      kids.push(h('button', { class: 'key', type: 'button', onclick: () => ctx.send({ type: 'fold' }) }, 'Fold'),
        toCall > 0 ? h('button', { class: 'key key--amber', type: 'button', onclick: () => ctx.send({ type: 'call' }) }, toCall >= st.chips[me] ? `All-in ${fmt(st.chips[me])}` : `Call ${fmt(toCall)}`) : h('button', { class: 'key key--amber', type: 'button', onclick: () => ctx.send({ type: 'check' }) }, 'Check'));
      if (max > st.currentBet && st.chips[me] > toCall) kids.push(h('div', { class: 'pk-raise' },
        h('div', { class: 'pk-quick' }, [['½ pot', .5], ['¾', .75], ['Pot', 1]].map(([l, f]) => h('button', { class: 'key key--sm', type: 'button', onclick: () => { raiseTo = Math.max(minTo, Math.min(max, st.currentBet + Math.floor((pot + toCall) * f))); paint(); } }, l))),
        slider, amt,
        h('button', { class: 'key key--amber', type: 'button', onclick: () => ctx.send({ type: raiseTo >= max ? 'allin' : 'raise', to: raiseTo }) }, raiseTo >= max ? 'All-in' : (st.currentBet ? 'Raise' : 'Bet'))));
    } else kids.push(h('p', { class: 'g-hint' }, st.folded[me] ? 'You folded this hand.' : `${ctx.seats[st.turn]?.name || ''} is thinking…`));
    fill(controls, ...kids);
  }
  addEventListener('resize', () => st && paint());
  return {
    render(state, c) {
      st = state; ctx = c;
      if (st.seq !== lastSeq) { if (lastSeq >= 0) sfxCard(); lastSeq = st.seq; raiseTo = 0; }
      paint();
      if (st.phase === 'result' && !won) { won = true; if (st.result?.won?.[ctx.mySeat] > 0) confetti(1400); } else if (st.phase !== 'result') won = false;
    }
  };
}
