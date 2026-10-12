// Last One: Uno-style shedding game. Host-authoritative, JSON state.
import { shuffle, rand, botRand } from '../shared/rng.js';
const COLORS = ['r', 'y', 'g', 'b'];
export const COLOR_NAME = { r: 'Red', y: 'Yellow', g: 'Green', b: 'Blue' };

function deck() {
  const d = []; let id = 0;
  for (const c of COLORS) {
    d.push({ id: id++, c, v: '0' });
    for (const v of ['1', '2', '3', '4', '5', '6', '7', '8', '9', 's', 'r', '+2']) { d.push({ id: id++, c, v }); d.push({ id: id++, c, v }); }
  }
  for (let i = 0; i < 4; i++) { d.push({ id: id++, c: 'w', v: 'w' }); d.push({ id: id++, c: 'w', v: '+4' }); }
  return shuffle(d);
}
const clone = s => JSON.parse(JSON.stringify(s));
const top = s => s.discard[s.discard.length - 1];
export function playable(s, card) { const t = top(s); return card.c === 'w' || card.c === s.color || card.v === t.v; }
const next = (s, from = s.turn, k = 1) => (from + s.dir * k + s.n * 4) % s.n;

function drawCards(s, seat, k) {
  for (let i = 0; i < k; i++) {
    if (!s.draw.length) {
      const t = s.discard.pop(); s.draw = shuffle(s.discard.map(c => (c.c === 'w' || c.wild) ? { ...c, c: 'w', wild: undefined } : c)); s.discard = [t];
      if (!s.draw.length) break;
    }
    s.hands[seat].push(s.draw.pop());
  }
}

export const engine = {
  setup(n, opts) {
    const d = deck(), hands = [];
    for (let i = 0; i < n; i++) hands.push(d.splice(0, 7));
    let first; do { first = d.pop(); if (first.c === 'w' || isNaN(+first.v)) { d.unshift(first); first = null; } } while (!first);
    return { n, hands, draw: d, discard: [first], color: first.c, turn: Math.floor(rand() * n), dir: 1, drew: false, called: Array(n).fill(false), exposed: null, winner: null, msg: 'Game on', seq: 0 };
  },
  toAct(s) { return s.winner != null ? [] : [s.turn]; },
  act(s0, seat, a) {
    if (s0.winner != null) throw new Error('The game is over.');
    const s = clone(s0); s.seq++;
    if (a.type === 'catch') {
      if (s.exposed == null || s.exposed === seat) throw new Error('Nobody to catch.');
      const t = s.exposed; s.exposed = null; drawCards(s, t, 2);
      s.msg = `Caught! Seat ${t + 1} draws 2`; s.caught = { by: seat, who: t, seq: s.seq };
      return s;
    }
    if (seat !== s.turn) throw new Error("It's not your turn.");
    const hand = s.hands[seat];
    if (a.type === 'draw') {
      if (s.drew) throw new Error('You already drew. Play the card or pass.');
      drawCards(s, seat, 1); s.drew = true; s.exposed = s.exposed === seat ? null : s.exposed;
      const c = hand[hand.length - 1];
      if (!c || !playable(s, c)) { s.drew = false; s.turn = next(s); s.msg = 'Drew and passed'; }
      else s.msg = 'Drew a card';
      return s;
    }
    if (a.type === 'pass') {
      if (!s.drew) throw new Error('Draw a card first.');
      s.drew = false; s.turn = next(s); s.msg = 'Passed'; return s;
    }
    if (a.type === 'play') {
      const i = hand.findIndex(c => c.id === a.id); if (i < 0) throw new Error('That card is not in your hand.');
      const card = hand[i];
      if (s.drew && i !== hand.length - 1) throw new Error('After drawing you can only play the drawn card.');
      if (!playable(s, card)) throw new Error('That card does not match the color or symbol.');
      if (card.c === 'w' && !COLORS.includes(a.color)) throw new Error('Choose a color for the wild card.');
      hand.splice(i, 1);
      if (s.exposed != null && s.exposed !== seat) s.exposed = null; // the window to catch closes when play moves on
      s.discard.push(card.c === 'w' ? { ...card, wild: a.color } : card);
      s.color = card.c === 'w' ? a.color : card.c;
      s.drew = false;
      if (hand.length === 1) { if (a.last) { s.called[seat] = true; s.msg = 'LAST ONE!'; } else { s.exposed = seat; } }
      else s.called[seat] = false;
      if (!hand.length) { s.winner = seat; s.msg = 'Out of cards'; return s; }
      let step = 1;
      if (card.v === 's') { step = 2; s.msg = 'Skip'; }
      else if (card.v === 'r') { if (s.n === 2) step = 2; else s.dir *= -1; s.msg = 'Reverse'; }
      else if (card.v === '+2') { drawCards(s, next(s), 2); step = 2; s.msg = '+2 and skip'; }
      else if (card.v === '+4') { drawCards(s, next(s), 4); step = 2; s.msg = '+4 and skip'; }
      else if (card.v === 'w') s.msg = 'Color: ' + COLOR_NAME[a.color];
      else if (!(hand.length === 1 && a.last)) s.msg = '';
      s.turn = next(s, s.turn, step);
      return s;
    }
    throw new Error('Unknown move.');
  },
  over(s) { if (s.winner == null) return null; return { title: 'Seat ' + (s.winner + 1) + ' wins', detail: 'Out of cards first', winner: s.winner }; },
  botDelay() { return 900; },
  bot(s, seat) {
    if (s.exposed != null && s.exposed !== seat && botRand() < .6) return { type: 'catch' };
    const hand = s.hands[seat];
    let options = hand.filter(c => playable(s, c));
    if (s.drew) options = options.filter(c => c.id === hand[hand.length - 1].id);
    if (!options.length) return s.drew ? { type: 'pass' } : { type: 'draw' };
    const nextCount = s.hands[next(s)].length;
    const score = c => (c.c === 'w' ? (nextCount <= 2 ? 30 : -20) + (c.v === '+4' ? 5 : 0) : 0) + (['s', 'r', '+2'].includes(c.v) ? (nextCount <= 3 ? 25 : 5) : 0) + (c.c === s.color ? 3 : 0) + (+c.v || 0) * .5;
    options.sort((a, b) => score(b) - score(a));
    const card = options[0];
    const counts = { r: 0, y: 0, g: 0, b: 0 }; hand.forEach(c => { if (c.c !== 'w' && c.id !== card.id) counts[c.c]++; });
    const color = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    return { type: 'play', id: card.id, color: card.c === 'w' ? color : undefined, last: hand.length === 2 && botRand() < .9 };
  }
};

// What one seat is allowed to see: its own hand, card counts for everyone else, never the draw pile.
engine.viewFor = (s, seat) => ({ ...s, hands: s.hands.map((h, i) => i === seat ? h : h.map(() => null)), draw: s.draw.map(() => null) });
