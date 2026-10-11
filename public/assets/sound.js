// Shared mechanical key click (bundled MIT radio-click sample). Lazily decoded on first press.
let ctx = null, buf = null, loading = null;
const KEY = 'bakhy.sound';
export function soundOn() { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } }
export function setSound(on) { try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch {} }
export function audioCtx() {
  if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctx = new AC(); }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
async function load() {
  if (buf || loading) return loading;
  loading = fetch('/assets/audio/radio-click.wav').then(r => r.arrayBuffer()).then(a => audioCtx().decodeAudioData(a)).then(b => { buf = b; }).catch(() => {});
  return loading;
}
export async function pressFeedback(vol = 0.35) {
  if (!soundOn()) return;
  const c = audioCtx(); if (!c) return;
  await load(); if (!buf) return;
  const s = c.createBufferSource(), g = c.createGain();
  s.buffer = buf; s.playbackRate.value = 0.94 + Math.random() * 0.12; g.gain.value = vol;
  s.connect(g).connect(c.destination); s.start();
}
