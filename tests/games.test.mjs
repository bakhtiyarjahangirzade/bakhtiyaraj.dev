// Bot-vs-bot simulations: every game must finish and never lose or duplicate a card/tile.
import test from 'node:test';
import assert from 'node:assert/strict';
import { engine as lastOne } from '../public/games/last-one/engine.js';
import { engine as durak } from '../public/games/durak/engine.js';
import { engine as domino } from '../public/games/domino/engine.js';

function run(engine, n, opts, count) {
  let s = engine.setup(n, opts), k = 0;
  while (!engine.over(s) && k < 20000) {
    const seats = engine.toAct(s); let moved = false;
    for (const seat of seats) { const a = engine.bot(s, seat, opts); if (a == null) continue; s = engine.act(s, seat, a); moved = true; break; }
    assert.ok(moved, 'some seat must be able to move');
    assert.equal(count(s), engine === domino ? 28 : engine === durak ? 36 : 108);
    k++;
  }
  assert.ok(engine.over(s), 'game finishes');
}
test('Last One keeps 108 cards and finishes', () => { for (let i = 0; i < 60; i++) run(lastOne, 2 + i % 3, {}, s => s.hands.flat().length + s.draw.length + s.discard.length); });
test('Durak keeps 36 cards and finishes', () => { for (let i = 0; i < 60; i++) run(durak, 2 + i % 3, {}, s => s.hands.flat().length + s.talon.length + s.discarded + s.table.reduce((x, p) => x + (p.d ? 2 : 1), 0)); });
test('Domino keeps 28 tiles, a connected line, and finishes', () => { for (let i = 0; i < 40; i++) run(domino, 2 + i % 3, { target: 100 }, s => { for (let j = 1; j < s.line.length; j++) assert.equal(s.line[j - 1].b, s.line[j].a); return s.hands.flat().length + s.bone.length + s.line.length; }); });
test('illegal moves are rejected', () => {
  const s = lastOne.setup(2, {}); const other = 1 - s.turn;
  assert.throws(() => lastOne.act(s, other, { type: 'draw' }), /not your turn/);
  const d = durak.setup(2); assert.throws(() => durak.act(d, d.defender, { type: 'pass' }));
});
import { engine as blackjack, total } from '../public/games/blackjack/engine.js';
import { engine as roulette } from '../public/games/roulette/engine.js';
import { engine as poker, best7, cmp } from '../public/games/poker/engine.js';
const sum = a => a.reduce((x, y) => x + y, 0);
test('Blackjack totals soft aces and keeps playing rounds', () => {
  assert.equal(total([{ r: 'A' }, { r: 'K' }]).t, 21); assert.equal(total([{ r: 'A' }, { r: 'A' }, { r: '9' }]).t, 21);
  let s = blackjack.setup(3); for (let k = 0; k < 3000 && s.round < 20; k++) { const seat = blackjack.toAct(s)[0]; s = blackjack.act(s, seat, blackjack.bot(s, seat)); }
  assert.ok(s.round >= 20);
});
test('Roulette pays and conserves stakes', () => {
  let s = roulette.setup(2); s = roulette.act(s, 0, { type: 'bet', k: 'n7', amount: 10 }); s = roulette.act(s, 0, { type: 'spin' }); s = roulette.act(s, 1, { type: 'spin' });
  assert.equal(s.chips[0], 990 + (s.result === 7 ? 360 : 0));
});
test('Poker evaluator and chip conservation', () => {
  const C = (r, s) => ({ r, s });
  assert.ok(cmp(best7([C('A','s'),C('K','s'),C('Q','s'),C('J','s'),C('10','s'),C('2','d'),C('3','c')]), best7([C('9','h'),C('9','d'),C('9','c'),C('9','s'),C('K','d'),C('2','d'),C('3','c')])) > 0);
  for (let g = 0; g < 30; g++) { let s = poker.setup(2 + g % 5); const T = sum(s.chips) + sum(s.contrib); let k = 0;
    while (!poker.over(s) && k++ < 20000) { const seat = poker.toAct(s)[0]; s = poker.act(s, seat, poker.bot(s, seat)); assert.equal(sum(s.chips) + (s.phase === 'play' ? sum(s.contrib) : 0), T); } }
});
