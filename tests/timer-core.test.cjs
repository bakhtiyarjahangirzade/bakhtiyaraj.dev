const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../public/apps/focus-room/timer-core.js');
test('uses wall time after a suspended timer callback', () => {
  const state = core.start(core.fresh('focus', 25, 1000), 1000);
  assert.equal(core.remaining(state, 1000 + 24 * 60000), 60000);
  assert.equal(core.remaining(state, 1000 + 30 * 60000), 0);
});
test('pause freezes remaining duration, resume preserves it', () => {
  const running = core.start(core.fresh('focus', 25, 1000), 1000);
  const paused = core.pause(running, 61000);
  assert.equal(core.remaining(paused, 999999), 24 * 60000);
  const resumed = core.start(paused, 1000000);
  assert.equal(core.remaining(resumed, 1001000), 24 * 60000 - 1000);
});
test('expired pause cannot resurrect elapsed time', () => {
  const state = core.pause(core.start(core.fresh('short', 1, 0), 0), 61000);
  assert.equal(state.remaining, 0);
});
test('rejects corrupt stored timers and accepts a serialized running timer', () => {
  const valid = core.start(core.fresh('long', 15, 1000), 1000);
  assert.ok(core.valid(JSON.parse(JSON.stringify(valid))));
  assert.ok(!core.valid({ ...valid, deadline: 'tomorrow' }));
  assert.ok(!core.valid({ ...valid, remaining: -1 }));
  assert.ok(!core.valid({ ...valid, mode: 'unknown' }));
  assert.ok(!core.valid({ ...valid, duration: Infinity }));
});
