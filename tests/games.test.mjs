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
