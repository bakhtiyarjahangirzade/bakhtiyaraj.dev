// Game server core: hidden information, chip conservation and provably fair replay.
import test from 'node:test';
import assert from 'node:assert/strict';
import { handle, viewsFor } from '../server/core.mjs';
import { GAMES, replay } from '../public/games/shared/fair.js';

const U = { id: 'u-1', name: 'alice' }, V = { id: 'u-2', name: 'bob' };
let clock = 1_000_000;
function call(t, op, user, body = {}, wallet) {
  const r = handle(t, { op, user, body: { clientSeed: 'cs' + (clock % 997), ...body }, now: clock += 1000, balances: wallet.bal });
  for (const w of r.wallet) { wallet.bal[w.uid] = (wallet.bal[w.uid] ?? 0) + w.delta; assert.ok(wallet.bal[w.uid] >= 0, 'wallet never negative'); }
  for (const st of r.steps) wallet.states.set(st.state.seq + ':' + r.table.seq, st.state);
  wallet.reveals.push(...r.reveals);
  wallet.views = viewsFor(r.table, r.steps);
  return r.table;
}

// Nothing in a seat's view may identify a card/tile it should not see.
function assertRedacted(game, view, seat) {
  const s = view;
  const hidden = x => x === null;
  if (s.hands) s.hands.forEach((h, i) => { if (i !== seat && game !== 'blackjack') assert.ok(h.every(hidden), `${game}: seat ${seat} sees seat ${i} hand`); });
  if (s.draw) assert.ok(s.draw.every(hidden), `${game}: draw pile visible`);
  if (s.talon) assert.ok(s.talon.every(hidden), `${game}: talon visible`);
  if (s.bone) assert.ok(s.bone.every(hidden), `${game}: boneyard visible`);
  if (game === 'blackjack') { assert.equal(s.shoe.length, 0); if (s.dealer.hidden && s.dealer.cards.length > 1) assert.equal(s.dealer.cards[1], null, 'dealer hole card visible'); }
  if (game === 'poker') {
    assert.equal(s.deck.length, 0, 'poker deck visible');
    s.hole.forEach((h, i) => { if (i === seat) return; const show = s.phase === 'result' && s.result?.shown && s.inHand[i] && !s.folded[i]; if (!show) assert.ok(h.every(hidden), `poker: seat ${seat} sees seat ${i} hole cards`); });
  }
}

function playOut(game, opts, human, maxCalls = 400) {
  const W = { bal: { [U.id]: 5000 }, states: new Map(), reveals: [], views: [] };
  let t = call(null, 'create', U, { game, mode: 'bot', opts }, W);
  t = call(t, 'start', U, {}, W);
  const g = GAMES[game];
  let calls = 0;
  while (calls++ < maxCalls && t.status === 'playing') {
    const mine = W.views.find(v => v.user_id === U.id);
    for (const st of mine.data.steps) assertRedacted(game, st.state, mine.seat);
    const view = mine.data.steps.at(-1).state;
    if (!g.engine.toAct(view).includes(mine.seat)) { // nothing for me: hand ended for a busted seat etc.
      if (g.casino) { t = call(t, 'leave', U, {}, W); break; }
      assert.fail(`${game}: human not to act and game not over`);
    }
    const a = human(view, mine.seat);
    t = call(t, 'act', U, { action: a }, W);
  }
  if (t.status !== 'closed' && t.status !== 'done') t = call(t, 'leave', U, {}, W);
  return { t, W };
}

for (const game of ['last-one', 'durak', 'domino']) {
  test(`${game}: views hide other hands, game finishes, segments replay`, () => {
    for (let k = 0; k < 6; k++) {
      const { t, W } = playOut(game, { players: 2 + (k % 3) }, (v, i) => GAMES[game].engine.bot(v, i, {}));
      assert.ok(['done', 'closed'].includes(t.status));
      assert.ok(W.reveals.length >= 1, 'whole game revealed at the end');
      for (const r of W.reveals) replay(r.data); // throws if the log does not reproduce
    }
  });
}

test('casino: chips are conserved between wallet and table, and every hand replays', () => {
  for (const game of ['blackjack', 'roulette', 'poker']) {
    for (let k = 0; k < 4; k++) {
      let hands = 0;
      const human = (v, i) => {
        const e = GAMES[game].engine;
        if (game === 'blackjack' && v.phase === 'bet') { hands++; if (hands > 12) return { type: 'sit' }; }
        if (game === 'roulette' && v.phase === 'bet') { hands++; }
        return e.bot(v, i, {}) ?? { type: 'next' };
      };
      const { t, W } = playOut(game, { players: 3 }, human, 300);
      assert.ok(['closed', 'done'].includes(t.status), game + ' ' + t.status);
      // after leaving, the human holds no table chips and the wallet equals start + net result
      const humanSeat = t.seats.findIndex(s => !s.bot);
      assert.equal(GAMES[game].casino.cashable(t.state, humanSeat), 0, 'table chips paid out');
      for (const r of W.reveals) {
        const end = replay(r.data);
        assert.equal(end.seq, r.data.startState ? r.data.startState.seq + r.data.actions.length : end.seq);
      }
    }
  }
});

test('bots cannot mint chips for humans: rebuy needs wallet chips', () => {
  const W = { bal: { [U.id]: 50 }, states: new Map(), reveals: [], views: [] };
  let t = call(null, 'create', U, { game: 'blackjack', mode: 'bot', opts: { players: 1 } }, W);
  t = call(t, 'start', U, {}, W);
  assert.equal(W.bal[U.id], 0, 'whole 50 moved to the table');
  assert.equal(t.state.chips[0], 50);
  t = call(t, 'act', U, { action: { type: 'bet', amount: 50 } }, W);
  // play the hand out by standing
  for (let k = 0; k < 10 && t.state.phase === 'play'; k++) t = call(t, 'act', U, { action: { type: 'stand' } }, W);
  if (t.state.chips[0] === 0) assert.throws(() => call(t, 'act', U, { action: { type: 'rebuy' } }, W), /wallet is empty/);
  assert.throws(() => call(t, 'act', U, { action: { type: '_credit', amount: 1e6 } }, W), /Bad move/);
  assert.throws(() => call(t, 'act', U, { action: { type: 'bet', amount: -100 } }, W));
  assert.throws(() => call(t, 'act', U, { action: { type: 'bet', amount: 'lots' } }, W));
});

test('online: a player cannot act for another seat or see their cards', () => {
  const W = { bal: { [U.id]: 5000, [V.id]: 5000 }, states: new Map(), reveals: [], views: [] };
  let t = call(null, 'create', U, { game: 'poker', mode: 'online', opts: {} }, W);
  t = call(t, 'join', V, {}, W);
  assert.throws(() => call(t, 'start', V, {}, W), /Only the host/);
  t = call(t, 'start', U, {}, W);
  assert.equal(W.bal[U.id], 3000); assert.equal(W.bal[V.id], 3000);
  const vb = W.views.find(v => v.user_id === V.id);
  assertRedacted('poker', vb.data.steps.at(-1).state, vb.seat);
  const turn = t.state.turn, actor = t.seats[turn].uid === U.id ? U : V, other = actor === U ? V : U;
  assert.throws(() => call(t, 'act', other, { action: { type: 'fold' } }, W), /not your turn/);
  t = call(t, 'act', actor, { action: { type: 'fold' } }, W);
  // the winner of an uncontested pot never shows cards
  const loserView = W.views.find(v => v.user_id === actor.id).data.steps.at(-1).state;
  assert.ok(loserView.hole[1 - turn].every(c => c === null));
  // both leave: every chip returns to a wallet
  t = call(t, 'leave', U, {}, W); t = call(t, 'leave', V, {}, W);
  assert.equal(W.bal[U.id] + W.bal[V.id], 10000);
  assert.equal(t.status, 'closed');
});

test('timeouts: an absent player is played on autopilot and marked away', () => {
  const W = { bal: { [U.id]: 5000, [V.id]: 5000 }, states: new Map(), reveals: [], views: [] };
  let t = call(null, 'create', U, { game: 'durak', mode: 'online', opts: {} }, W);
  t = call(t, 'join', V, {}, W);
  t = call(t, 'start', U, {}, W);
  assert.ok(t.deadline);
  const before = t.seq;
  clock += 60000;
  t = call(t, 'tick', V, {}, W);
  assert.ok(t.seq > before, 'autopilot moved');
});
