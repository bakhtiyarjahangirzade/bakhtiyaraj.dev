(function (global) {
  'use strict';
  function remaining(state, now) {
    return state.status === 'running' ? Math.max(0, state.deadline - now) : Math.max(0, state.remaining);
  }
  function fresh(mode, minutes, now) {
    return { mode, status: 'idle', duration: minutes * 60000, remaining: minutes * 60000, deadline: null, id: String(now) + '-' + Math.random().toString(36).slice(2) };
  }
  function start(state, now) {
    return { ...state, status: 'running', deadline: now + state.remaining };
  }
  function pause(state, now) {
    return { ...state, status: 'paused', remaining: remaining(state, now), deadline: null };
  }
  function valid(state) {
    return state && ['focus', 'short', 'long'].includes(state.mode) && ['idle', 'running', 'paused', 'complete'].includes(state.status) && Number.isFinite(state.duration) && state.duration >= 60000 && state.duration <= 7200000 && Number.isFinite(state.remaining) && state.remaining >= 0 && state.remaining <= state.duration && typeof state.id === 'string' && (state.status !== 'running' || Number.isFinite(state.deadline));
  }
  const api = { remaining, fresh, start, pause, valid };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.FocusTimerCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
