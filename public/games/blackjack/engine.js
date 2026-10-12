// Blackjack: everyone at the table plays against the dealer. 6-deck shoe, dealer stands on soft 17,
// blackjack pays 3:2, double on any two cards, one split. Play chips only.
import { shuffle, rand, botRand } from '../shared/rng.js';
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['s', 'h', 'd', 'c'];
const clone = s => JSON.parse(JSON.stringify(s));
export const START = 1000, MIN_BET = 10;
function newShoe() { const d = []; let id = 0; for (let k = 0; k < 6; k++) for (const s of SUITS) for (const r of RANKS) d.push({ id: id++, s, r }); return shuffle(d); }
export function total(cards) {
  let t = 0, aces = 0;
  for (const c of cards) { if (c.r === 'A') { aces++; t += 11; } else t += 'JQK'.includes(c.r) ? 10 : +c.r; }
  while (t > 21 && aces) { t -= 10; aces--; }
  return { t, soft: aces > 0 };
}
export const isBJ = cards => cards.length === 2 && total(cards).t === 21;
function draw(s) { if (s.shoe.length < 20) { s.shoe = newShoe(); s.msg = 'New shoe'; } return s.shoe.pop(); }
function nextTurn(s) {
  // find next unfinished hand after current
  for (let seat = s.turn ? s.turn.seat : 0; seat < s.n; seat++) {
    const hs = s.hands[seat];
    for (let hi = (s.turn && seat === s.turn.seat) ? s.turn.hand : 0; hi < hs.length; hi++) {
      if (!hs[hi].done) { s.turn = { seat, hand: hi }; return; }
    }
    if (s.turn) s.turn = { seat: seat + 1, hand: 0 };
  }
  s.turn = null; dealerPlay(s);
}
function dealerPlay(s) {
  s.phase = 'dealer'; s.dealer.hidden = false;
  const live = s.hands.some(hs => hs.some(h => h.bet && total(h.cards).t <= 21 && !(isBJ(h.cards) && !h.split)));
  if (live) while (true) { const { t, soft } = total(s.dealer.cards); if (t < 17 || (t === 17 && soft && false)) s.dealer.cards.push(draw(s)); else break; }
  settle(s);
}
function settle(s) {
  const d = total(s.dealer.cards).t, dBJ = isBJ(s.dealer.cards);
  s.hands.forEach((hs, seat) => hs.forEach(h => {
    if (!h.bet) return;
    const p = total(h.cards).t, pBJ = isBJ(h.cards) && !h.split;
    let win = 0, res;
    if (p > 21) { res = 'bust'; win = 0; }
    else if (pBJ && !dBJ) { res = 'blackjack'; win = h.bet * 2.5; }
    else if (dBJ && !pBJ) { res = 'lose'; win = 0; }
    else if (d > 21 || p > d) { res = 'win'; win = h.bet * 2; }
    else if (p === d) { res = 'push'; win = h.bet; }
    else { res = 'lose'; win = 0; }
    h.result = res; h.payout = win; s.chips[seat] += win;
  }));
  s.phase = 'settle'; s.ready = []; s.msg = d > 21 ? 'Dealer busts' : `Dealer has ${d}`;
}
function maybeDeal(s) {
  if (engine.toAct(s).length) return;
  if (!s.bets.some(b => b > 0)) { s.sat = []; s.msg = 'Place your bets'; return; } // everyone sat out: start the betting again
  s.hands = s.bets.map(b => b ? [{ cards: [draw(s), draw(s)], bet: b, done: false, doubled: false, split: false }] : []);
  s.dealer = { cards: [draw(s), draw(s)], hidden: true };
  s.hands.forEach(hs => hs.forEach(h => { if (isBJ(h.cards)) h.done = true; }));
  s.phase = 'play'; s.turn = { seat: 0, hand: 0 }; s.msg = '';
  if (isBJ(s.dealer.cards)) { s.hands.forEach(hs => hs.forEach(h => h.done = true)); s.msg = 'Dealer blackjack'; s.turn = null; dealerPlay(s); return; }
  s.turn = null; nextTurn(s);
}
export const engine = {
  setup(n, opts) { return { n, chips: Array.from({ length: n }, (_, i) => { const v = opts?.stack?.[i]; return Number.isFinite(v) && v > 0 ? v : START; }), bets: Array(n).fill(0), hands: Array.from({ length: n }, () => []), dealer: { cards: [], hidden: true }, shoe: newShoe(), phase: 'bet', turn: null, ready: [], round: 1, seq: 0, msg: 'Place your bets' }; },
  toAct(s) {
    if (s.phase === 'bet') return [...Array(s.n).keys()].filter(i => !s.bets[i] && !(s.sat || []).includes(i));
    if (s.phase === 'play' && s.turn) return [s.turn.seat];
    if (s.phase === 'settle') return [...Array(s.n).keys()].filter(i => !s.ready.includes(i));
    return [];
  },
  act(s0, seat, a) {
    const s = clone(s0); s.seq++;
    if (a.type === 'rebuy') { if (s.chips[seat] >= MIN_BET) throw new Error('You still have chips.'); s.chips[seat] = START; s.msg = 'Seat ' + (seat + 1) + ' rebuys'; return s; }
    if (s.phase === 'bet') {
      if (a.type === 'sit') { // sit this round out
        if (s.bets[seat] || (s.sat || []).includes(seat)) throw new Error('Bet already placed.');
        (s.sat ||= []).push(seat); maybeDeal(s); return s;
      }
      if (a.type !== 'bet') throw new Error('Place a bet first.');
      if ((s.sat || []).includes(seat)) throw new Error('You are sitting out this round.');
      const amt = Math.floor(+a.amount);
      if (!(amt >= MIN_BET)) throw new Error(`Minimum bet is ${MIN_BET}.`);
      if (amt > s.chips[seat]) throw new Error('Not enough chips.');
      if (s.bets[seat]) throw new Error('Bet already placed.');
      s.bets[seat] = amt; s.chips[seat] -= amt;
      maybeDeal(s);
      return s;
    }
    if (s.phase === 'play') {
      if (!s.turn || s.turn.seat !== seat) throw new Error("It's not your turn.");
      const h = s.hands[seat][s.turn.hand];
      if (a.type === 'hit') { h.cards.push(draw(s)); const t = total(h.cards).t; if (t >= 21) { h.done = true; nextTurn(s); } return s; }
      if (a.type === 'stand') { h.done = true; nextTurn(s); return s; }
      if (a.type === 'double') {
        if (h.cards.length !== 2) throw new Error('Double only on your first two cards.');
        if (s.chips[seat] < h.bet) throw new Error('Not enough chips to double.');
        s.chips[seat] -= h.bet; h.bet *= 2; h.doubled = true; h.cards.push(draw(s)); h.done = true; nextTurn(s); return s;
      }
      if (a.type === 'split') {
        const v = c => 'JQK'.includes(c.r) ? '10' : c.r;
        if (h.cards.length !== 2 || v(h.cards[0]) !== v(h.cards[1]) || s.hands[seat].length > 1) throw new Error('You can split a pair once.');
        if (s.chips[seat] < h.bet) throw new Error('Not enough chips to split.');
        s.chips[seat] -= h.bet;
        const second = { cards: [h.cards.pop(), draw(s)], bet: h.bet, done: false, doubled: false, split: true };
        h.cards.push(draw(s)); h.split = true;
        s.hands[seat].push(second);
        if (h.cards[0].r === 'A') { h.done = true; second.done = true; nextTurn(s); }
        return s;
      }
      throw new Error('Unknown move.');
    }
    if (s.phase === 'settle') {
      if (a.type !== 'next') throw new Error('Round is over.');
      if (!s.ready.includes(seat)) s.ready.push(seat);
      if (!engine.toAct(s).length) { s.phase = 'bet'; s.bets = Array(s.n).fill(0); s.hands = Array.from({ length: s.n }, () => []); s.dealer = { cards: [], hidden: true }; s.sat = []; s.round++; s.msg = 'Place your bets'; }
      return s;
    }
    throw new Error('Unknown move.');
  },
  over() { return null; },
  botDelay(s) { return s.phase === 'settle' ? 2600 : s.phase === 'bet' ? 700 : 900; },
  bot(s, seat) {
    if (s.phase === 'bet') { if (s.chips[seat] < MIN_BET) return { type: 'rebuy' }; const opts = [10, 25, 50, 100].filter(x => x <= s.chips[seat]); return { type: 'bet', amount: opts[Math.floor(botRand() * opts.length)] }; }
    if (s.phase === 'settle') return { type: 'next' };
    if (s.phase === 'play') {
      const h = s.hands[seat][s.turn.hand]; const { t, soft } = total(h.cards); const up = total([s.dealer.cards[0]]).t;
      const v = c => 'JQK'.includes(c.r) ? 10 : c.r === 'A' ? 11 : +c.r;
      if (h.cards.length === 2 && v(h.cards[0]) === v(h.cards[1]) && s.hands[seat].length === 1 && s.chips[seat] >= h.bet && (h.cards[0].r === 'A' || v(h.cards[0]) === 8)) return { type: 'split' };
      if (h.cards.length === 2 && !soft && (t === 11 || (t === 10 && up < 10)) && s.chips[seat] >= h.bet) return { type: 'double' };
      if (soft) return t <= 17 ? { type: 'hit' } : { type: 'stand' };
      if (t <= 11) return { type: 'hit' };
      if (t === 12) return up >= 4 && up <= 6 ? { type: 'stand' } : { type: 'hit' };
      if (t <= 16) return up <= 6 ? { type: 'stand' } : { type: 'hit' };
      return { type: 'stand' };
    }
    return null;
  }
};

// What one seat is allowed to see: player cards are face up; the shoe and the dealer's hole card are not.
engine.viewFor = (s) => ({ ...s, shoe: [], shoeLeft: s.shoe.length, dealer: { ...s.dealer, cards: s.dealer.hidden ? s.dealer.cards.map((c, i) => i === 1 ? null : c) : s.dealer.cards } });
