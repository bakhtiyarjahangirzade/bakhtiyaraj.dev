// Serpent Zone: a solo run recorded in the browser must replay to the same result on the server.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../public/games/serpent/sim.js';

function playLikeClient(seed, steer) {
  const { W, me } = S.soloWorld(seed, { name: 'p', skin: 'ember' });
  me.id = 'browser-id'; // the browser renames its serpent; ids must not affect the simulation
  const inputs = new Map(), changes = []; let last = null;
  while (W.phase === 'play' && me.alive) {
    const inp = steer(W, me);
    inputs.set(me.id, inp);
    const k = inp.ta + ':' + inp.boost; if (k !== last) { last = k; changes.push([W.tick, inp.ta, inp.boost]); }
    S.step(W, inputs); W.events.length = 0;
  }
  return { me, W, log: S.encodeInputs(changes) };
}
test('recorded runs replay to the same score', () => {
  for (const seed of [7, 99, 123456, 4294967295]) {
    let k = 0;
    const { me, W, log } = playLikeClient(seed, (W, s) => { k++; const h = s.pts[0]; const toC = S.atan2u(-h.y, -h.x); return { ta: (toC + ((k >> 5) % 2 ? 900 : -900) + S.A) % S.A, boost: k % 90 < 8 }; });
    const r = S.replaySolo(seed, log);
    assert.equal(r.ticks, W.tick);
    assert.equal(r.peak, Math.round(me.peak));
    assert.equal(r.kills, me.kills);
    assert.equal(r.alive, me.alive);
  }
});
test('replay is deterministic', () => {
  const { log } = playLikeClient(5, (W, s) => ({ ta: (W.tick * 13) % S.A, boost: false }));
  const a = S.replaySolo(5, log);
  assert.deepEqual(S.replaySolo(5, log), a);
});
