(() => {
  'use strict';
  const core = window.FocusTimerCore;
  const key = 'bakhy-focus-room-v1';
  const $ = id => document.getElementById(id);
  const defaults = { focus: 25, short: 5, long: 15, alarm: 'bell', volume: 50 };
  let data;
  try { data = JSON.parse(localStorage.getItem(key)); } catch { data = null; }
  const config = { ...defaults };
  for (const mode of ['focus', 'short', 'long']) {
    const value = data?.config?.[mode];
    if (Number.isInteger(value) && value >= 1 && value <= (mode === 'focus' ? 120 : 60)) config[mode] = value;
  }
  if (['bell', 'digital', 'mute'].includes(data?.config?.alarm)) config.alarm = data.config.alarm;
  if (Number.isFinite(data?.config?.volume)) config.volume = Math.max(0, Math.min(100, data.config.volume));
  let state = core.valid(data?.state) ? data.state : core.fresh('focus', config.focus, Date.now());
  let stats = data?.stats && Number.isInteger(data.stats.sessions) && data.stats.sessions >= 0 && Number.isFinite(data.stats.minutes) && data.stats.minutes >= 0 ? data.stats : { date: day(), sessions: 0, minutes: 0, completedId: null };
  let context, rainSource, rainGain;
  let canPlay = false, rainBusy = false;
  const names = { focus: 'focus', short: 'short break', long: 'long break' };
  function day() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
  function save() {
    try { localStorage.setItem(key, JSON.stringify({ config, state, stats })); }
    catch { $('storage-note').textContent = 'Device storage unavailable; keep this window open.'; }
  }
  async function unlock() {
    try {
      context ||= new (window.AudioContext || window.webkitAudioContext)();
      await context.resume(); canPlay = context.state === 'running';
      if (!canPlay) $('audio-status').textContent = 'Sound is paused by your browser. Use Listen to enable it.';
      return canPlay;
    } catch { $('audio-status').textContent = 'Audio is unavailable. The timer still works.'; return false; }
  }
  function chime() {
    if (config.alarm === 'mute' || config.volume === 0 || !canPlay || !context || context.state !== 'running') return;
    const notes = config.alarm === 'digital' ? [660, 880, 660] : [523.25, 659.25, 783.99];
    notes.forEach((frequency, i) => {
      const start = context.currentTime + i * .28;
      const oscillator = context.createOscillator(), gain = context.createGain();
      oscillator.type = config.alarm === 'digital' ? 'triangle' : 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(.2 * config.volume / 100, start + .02);
      gain.gain.exponentialRampToValueAtTime(.0001, start + 1.5);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(start); oscillator.stop(start + 1.55);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  }
  async function toggleRain() {
    if (rainBusy) return;
    if (rainSource) { stopRain(); return; }
    rainBusy = true; $('rain').disabled = true;
    const unlocked = await unlock();
    rainBusy = false; $('rain').disabled = false;
    if (!unlocked) return;
    const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
    const samples = buffer.getChannelData(0);
    let previous = 0;
    for (let i = 0; i < samples.length; i++) { const noise = Math.random() * 2 - 1; previous = (previous + .04 * noise) / 1.04; samples[i] = previous * 4; }
    rainSource = context.createBufferSource(); rainSource.buffer = buffer; rainSource.loop = true;
    rainGain = context.createGain(); rainGain.gain.value = .26 * config.volume / 100;
    rainSource.connect(rainGain); rainGain.connect(context.destination); rainSource.start();
    $('rain').setAttribute('aria-pressed', 'true'); $('rain').querySelector('.sr-only').textContent = 'On';
    $('audio-status').textContent = 'Rain ambience is playing. Your volume controls it too.';
  }
  function stopRain() {
    if (rainSource) { rainSource.stop(); rainSource.disconnect(); rainGain.disconnect(); rainSource = null; rainGain = null; }
    $('rain').setAttribute('aria-pressed', 'false'); $('rain').querySelector('.sr-only').textContent = 'Off';
    $('audio-status').textContent = 'Sound plays while the app is open.';
  }
  function nextMode() { return state.mode === 'focus' ? (stats.sessions > 0 && stats.sessions % 4 === 0 ? 'long' : 'short') : 'focus'; }
  function finish() {
    let latest;
    try { latest = JSON.parse(localStorage.getItem(key)); } catch { latest = null; }
    const alreadyFinished = latest?.stats?.completedId === state.id;
    if (!alreadyFinished) {
      if (stats.date !== day()) stats = { date: day(), sessions: 0, minutes: 0, completedId: null };
      if (state.mode === 'focus') { stats.sessions++; stats.minutes += state.duration / 60000; }
      stats.completedId = state.id;
    } else stats = latest.stats;
    state = { ...state, status: 'complete', remaining: 0, deadline: null };
    save();
    if (!alreadyFinished) chime();
    $('timer-status').textContent = state.mode === 'focus' ? 'Session complete. Take a well-earned break.' : 'Break complete. Ready for another focus session?';
  }
  function render() {
    if (state.status === 'running' && core.remaining(state, Date.now()) <= 0) finish();
    const seconds = Math.ceil(core.remaining(state, Date.now()) / 1000);
    const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    $('clock').textContent = time;
    document.title = `${state.status === 'running' ? time + ' · ' : ''}Focus Room — BAKHY`;
    $('progress').max = state.duration;
    $('progress').value = state.duration - core.remaining(state, Date.now());
    $('phase-caption').textContent = state.mode === 'focus' ? 'TIME TO FOCUS' : 'ROOM TO BREATHE';
    $('timer-note').textContent = { idle: 'A fresh start.', running: 'You’ve got this.', paused: 'Your time. Your pace.', complete: 'Nicely done.' }[state.status];
    document.querySelector('.timer-panel').classList.toggle('break', state.mode !== 'focus');
    for (const button of document.querySelectorAll('[data-mode]')) { button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode)); button.disabled = state.status === 'running'; }
    const startLabel = state.status === 'running' ? 'Pause session' : state.status === 'paused' ? 'Resume session' : state.status === 'complete' ? `Start ${names[nextMode()]}` : `Start ${names[state.mode]}`;
    const icon = document.createElement('img'); icon.alt = ''; icon.src = state.status === 'running' ? 'assets/icons/pause.svg' : 'assets/icons/play.svg';
    const label = document.createElement('span'); label.textContent = state.status === 'running' ? 'PAUSE' : state.status === 'paused' ? 'RESUME' : 'START';
    $('start').setAttribute('aria-label', startLabel);
    $('start').replaceChildren(icon, label);
    const today = stats.date === day();
    const sessions = today ? stats.sessions : 0, minutes = today ? stats.minutes : 0;
    $('session-number').textContent = String(sessions);
    $('session-count').textContent = `${sessions} session${sessions === 1 ? '' : 's'} today`;
    $('focus-total').textContent = `${minutes} focused minute${minutes === 1 ? '' : 's'}`;
  }
  $('start').addEventListener('click', async () => {
    if (state.status === 'running') { state = core.pause(state, Date.now()); $('timer-status').textContent = 'Paused. Come back when you’re ready.'; }
    else {
      if (state.status === 'complete') { const mode = nextMode(); state = core.fresh(mode, config[mode], Date.now()); }
      state = core.start(state, Date.now()); $('timer-status').textContent = `${state.mode === 'focus' ? 'Focus' : 'Break'} session started.`;
      unlock();
    }
    save(); render();
  });
  $('reset').addEventListener('click', () => { state = core.fresh(state.mode, config[state.mode], Date.now()); save(); $('timer-status').textContent = 'Session reset. Ready when you are.'; render(); });
  for (const button of document.querySelectorAll('[data-mode]')) button.addEventListener('click', () => { const mode = button.dataset.mode; state = core.fresh(mode, config[mode], Date.now()); save(); $('timer-status').textContent = `${names[mode]} selected.`; render(); });
  for (const mode of ['focus', 'short', 'long']) {
    const input = $(mode + '-min'); input.value = config[mode];
    input.addEventListener('input', () => {
      const value = Number(input.value), max = mode === 'focus' ? 120 : 60;
      const valid = input.value !== '' && Number.isInteger(value) && value >= 1 && value <= max;
      input.setAttribute('aria-invalid', String(!valid)); input.setAttribute('aria-describedby', valid ? 'duration-help' : 'settings-error');
      const invalid = [...document.querySelectorAll('.duration-grid input')].some(field => field.getAttribute('aria-invalid') === 'true');
      $('settings-error').hidden = !invalid;
      if (!valid) { $('settings-error').textContent = `Enter a whole number between 1 and ${max} minutes for ${names[mode]}.`; return; }
      config[mode] = value;
      if (state.mode === mode && state.status === 'idle') state = core.fresh(mode, value, Date.now());
      save(); render();
    });
  }
  $('alarm').value = config.alarm; $('volume').value = config.volume; $('volume-value').textContent = config.volume + '%';
  $('alarm').addEventListener('change', () => { config.alarm = $('alarm').value; save(); });
  $('volume').addEventListener('input', () => { config.volume = Number($('volume').value); $('volume-value').textContent = config.volume + '%'; if (rainGain) rainGain.gain.setTargetAtTime(.26 * config.volume / 100, context.currentTime, .1); save(); });
  $('preview-sound').addEventListener('click', async () => { if (config.alarm === 'mute' || config.volume === 0) { $('audio-status').textContent = 'Choose a sound and raise the volume to listen.'; return; } if (await unlock()) { chime(); $('audio-status').textContent = 'Sound preview played.'; } });
  $('rain').addEventListener('click', toggleRain);
  window.addEventListener('storage', event => {
    if (event.key !== key || !event.newValue) return;
    try { const incoming = JSON.parse(event.newValue); if (core.valid(incoming.state)) { state = incoming.state; if (incoming.stats?.date && Number.isInteger(incoming.stats.sessions)) stats = incoming.stats; render(); } } catch { /* Keep the valid local timer. */ }
  });
  document.addEventListener('visibilitychange', render);
  if (location.protocol === 'focus:') { $('download').hidden = true; $('web-download-note').hidden = true; }
  if (state.status === 'complete') $('timer-status').textContent = state.mode === 'focus' ? 'Session complete. Take a well-earned break.' : 'Break complete. Ready for another focus session?';
  else if (state.status === 'paused') $('timer-status').textContent = 'Paused. Come back when you’re ready.';
  else if (state.status === 'running') $('timer-status').textContent = 'Your session is running.';
  render(); setInterval(render, 250);
})();
