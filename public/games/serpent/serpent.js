// Serpent Zone client: rendering, input (mouse, keys, touch joystick), solo runs that the server re-plays
// for the leaderboard, and online rooms over Supabase broadcast (host owns bots, food and the zone clock).
import { Room, myId, newCode, cleanCode, api, getClient } from '/games/shared/net.js';
import { mountAccount } from '/assets/account-ui.js';
import * as acc from '/assets/account.js';
import * as S from './sim.js';
import { SKINS, skinById, segColor, glowOf, drawPreview } from './skins.js';

const $ = s => document.querySelector(s);
const cv = $('#cv'), g = cv.getContext('2d');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const touchUI = matchMedia('(pointer: coarse)').matches;
const store = { get(k, d) { try { const v = localStorage.getItem('bakhy.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem('bakhy.' + k, JSON.stringify(v)); } catch {} } };
mountAccount($('#tools'));

const me = { id: myId(), name: store.get('name', 'Player'), skin: store.get('serpentSkin', 'ember') };
$('#nm').value = me.name;
$('#nm').addEventListener('input', e => { me.name = e.target.value.trim() || 'Player'; store.set('name', me.name); });
acc.onChange(s => { if (s.profile && !acc.isGuest() && !store.get('nameSet', false)) { me.name = s.profile.username; $('#nm').value = me.name; } loadSkins(); });
$('#nm').addEventListener('change', () => store.set('nameSet', true));

/* ---------------- skins ---------------- */
let owned = new Set(SKINS.filter(s => !s.price).map(s => s.id));
async function loadSkins() {
  try { if (acc.current().user) { const r = await api('skins'); owned = new Set([...SKINS.filter(s => !s.price).map(s => s.id), ...(r.owned || [])]); } } catch {}
  if (!owned.has(me.skin)) me.skin = 'ember';
  paintSkins();
}
function paintSkins() {
  const box = $('#skins'); box.replaceChildren();
  for (const sk of SKINS) {
    const c = document.createElement('canvas'); c.width = 120; c.height = 44;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'sz-skin' + (owned.has(sk.id) ? '' : ' locked'); b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(me.skin === sk.id));
    const cap = document.createElement('span'); cap.textContent = sk.name + (owned.has(sk.id) ? '' : ' · ' + sk.price.toLocaleString('en-US'));
    b.append(c, cap);
    b.onclick = async () => {
      if (owned.has(sk.id)) { me.skin = sk.id; store.set('serpentSkin', sk.id); paintSkins(); return; }
      if (!confirmBuy(sk)) return;
      try { await acc.ensurePlayer(); const r = await api('buy-skin', { skin: sk.id }); owned.add(sk.id); me.skin = sk.id; store.set('serpentSkin', sk.id); acc.setKnownBalance(r.balance); $('#skinMsg').textContent = `${sk.name} unlocked.`; paintSkins(); }
      catch (e) { $('#skinMsg').textContent = e.message; if (e.needLogin) document.querySelector('.acc-plate')?.click(); }
    };
    box.append(b); drawPreview(c, sk);
  }
}
let pendingBuy = null;
function confirmBuy(sk) { if (pendingBuy === sk.id) { pendingBuy = null; return true; } pendingBuy = sk.id; $('#skinMsg').textContent = `Tap ${sk.name} again to buy it for ${sk.price.toLocaleString('en-US')} play chips.`; return false; }
paintSkins();
setInterval(() => { if (!$('#menu').hidden) $('#skins').querySelectorAll('canvas').forEach((c, i) => drawPreview(c, SKINS[i])); }, 120);

/* ---------------- top list ---------------- */
async function loadTop() {
  const ol = $('#top');
  try {
    const sb = await getClient(); const { data, error } = await sb.rpc('leaderboard', { kind: 'serpent', lim: 5 });
    if (error) throw error;
    ol.replaceChildren(...(data?.length ? data : []).map(r => { const li = document.createElement('li'); const n = document.createElement('span'); n.textContent = r.username; const b = document.createElement('b'); b.textContent = r.score.toLocaleString('en-US'); li.append(n, b); return li; }));
    if (!data?.length) ol.innerHTML = '<li class="sz-help">No runs yet — be the first.</li>';
  } catch { ol.innerHTML = '<li class="sz-help">Leaderboard is offline.</li>'; }
}
loadTop();

/* ---------------- input ---------------- */
let pointer = null, boostHeld = false, keyTurn = 0, stickAngle = null;
const activeTouches = new Set();
cv.addEventListener('pointermove', e => { if (e.pointerType !== 'touch' || !touchUI) pointer = { x: e.offsetX, y: e.offsetY }; });
cv.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && touchUI) return; pointer = { x: e.offsetX, y: e.offsetY }; if (e.pointerType === 'mouse') boostHeld = true; activeTouches.add(e.pointerId); if (activeTouches.size > 1) boostHeld = true; });
addEventListener('pointerup', e => { activeTouches.delete(e.pointerId); if (activeTouches.size < 2 && !btnBoost) boostHeld = false; });
addEventListener('keydown', e => { if (e.target.closest('input')) return; if (e.code === 'Space') { boostHeld = true; e.preventDefault(); } if (e.code === 'ArrowLeft') keyTurn = -1; if (e.code === 'ArrowRight') keyTurn = 1; });
addEventListener('keyup', e => { if (e.code === 'Space') boostHeld = false; if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') keyTurn = 0; });

// Touch: a floating joystick on the left of the screen and a boost button on the right.
let btnBoost = false;
if (touchUI) {
  $('#help').textContent = 'Drag anywhere on the left to steer, hold BOOST on the right to speed up (it costs length).';
  const stage = $('#stage'), stick = $('#stick'), knob = $('#knob');
  let stickId = null, sx = 0, sy = 0;
  stage.addEventListener('touchstart', e => {
    if ($('#menu').hidden === false || !$('#over').hidden) return;
    for (const t of e.changedTouches) {
      if (t.target.closest('#boostBtn')) continue;
      if (stickId == null && t.clientX < innerWidth * .62) { stickId = t.identifier; sx = t.clientX; sy = t.clientY; const r = stage.getBoundingClientRect(); stick.style.left = (sx - r.left) + 'px'; stick.style.top = (sy - r.top) + 'px'; stick.classList.add('on'); knob.style.transform = ''; }
    }
    e.preventDefault();
  }, { passive: false });
  stage.addEventListener('touchmove', e => {
    for (const t of e.changedTouches) if (t.identifier === stickId) {
      const dx = t.clientX - sx, dy = t.clientY - sy, d = Math.hypot(dx, dy), m = Math.min(d, 46);
      if (d > 8) stickAngle = Math.atan2(dy, dx);
      knob.style.transform = `translate(${d ? dx / d * m : 0}px, ${d ? dy / d * m : 0}px)`;
    }
    e.preventDefault();
  }, { passive: false });
  const end = e => { for (const t of e.changedTouches) if (t.identifier === stickId) { stickId = null; stick.classList.remove('on'); } };
  stage.addEventListener('touchend', end); stage.addEventListener('touchcancel', end);
  const bb = $('#boostBtn');
  bb.addEventListener('touchstart', e => { btnBoost = boostHeld = true; bb.classList.add('on'); e.preventDefault(); e.stopPropagation(); }, { passive: false });
  const off = e => { btnBoost = boostHeld = false; bb.classList.remove('on'); e.preventDefault(); };
  bb.addEventListener('touchend', off); bb.addEventListener('touchcancel', off);
  const fs = $('#fs'); if (document.documentElement.requestFullscreen) { fs.hidden = false; fs.onclick = () => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen({ navigationUI: 'hide' }).then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {}); }; }
}
// Turn the current controls into a target angle (integer units) for my serpent.
function myInput(s) {
  let ta = s.ta;
  if (stickAngle != null && touchUI) ta = Math.round(stickAngle / (Math.PI * 2) * S.A);
  else if (pointer) ta = Math.round(Math.atan2(pointer.y - cv.clientHeight / 2, pointer.x - cv.clientWidth / 2) / (Math.PI * 2) * S.A);
  if (keyTurn) ta = s.a + keyTurn * 600;
  return { ta: ((ta % S.A) + S.A) % S.A, boost: boostHeld };
}

/* ---------------- game state ---------------- */
let W = null, mySnake = null, room = null, isHost = true, run = null, acc0 = 0, lastSend = 0, lastWorld = 0, lastFoodFull = 0;
const eatQueue = [], deadQueue = [];
const inputs = new Map();

async function startSolo() {
  leave();
  let seed = (crypto.getRandomValues(new Uint32Array(1))[0]) >>> 0, ranked = false;
  try { await acc.ensurePlayer(); const r = await api('serpent-start'); seed = r.seed; run = { id: r.run, changes: [], last: null, ranked: true }; ranked = true; }
  catch { run = { id: null, changes: [], last: null, ranked: false }; }
  const w = S.soloWorld(seed, { name: me.name, skin: me.skin });
  W = w.W; mySnake = w.me; mySnake.id = me.id; mySnake.name = me.name; mySnake.skin = me.skin;
  isHost = true; enterPlay(ranked ? 'Ranked run · score goes to the leaderboard' : 'Practice run (offline) · not ranked');
}
function enterPlay(note) {
  $('#menu').hidden = true; $('#over').hidden = true; $('#hud').hidden = false; $('#touch').hidden = !touchUI;
  document.body.classList.add('sz-playing'); acc0 = 0; last = performance.now();
  if (note) toast(note);
}
let toastT; function toast(t) { const el = $('#ztoast') || Object.assign(document.createElement('p'), { id: 'ztoast', className: 'g-toast' }); if (!el.isConnected) document.body.append(el); el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2600); }

// Advance the world in fixed steps and record my input changes for the server replay.
function tick() {
  if (!W || W.phase !== 'play') return;
  if (mySnake && mySnake.alive) {
    const inp = myInput(mySnake);
    inputs.set(mySnake.id, inp);
    if (run && !room) { const k = inp.ta + ':' + inp.boost; if (k !== run.last) { run.last = k; run.changes.push([W.tick, inp.ta, inp.boost]); } }
  }
  S.step(W, inputs);
  for (const e of W.events) {
    if (e.t === 'eat' && e.s === mySnake) blip(e.f.v);
    if (e.t === 'eat' && !W.authority) eatQueue.push(e.f.id);
    if (e.t === 'dead' && !W.authority) deadQueue.push({ id: e.s.id, pts: e.s.pts.filter((_, i) => i % 3 === 0).map(p => [Math.round(p.x), Math.round(p.y)]), hue: e.s.hue });
    if (e.t === 'dead' && e.s === mySnake) { shake = 18; finishRun(false); }
    if (e.t === 'end') { if (room) broadcastWorld(true); finishRun(true); }
  }
  W.events.length = 0;
}
async function finishRun(final) {
  const r0 = run; run = run && !room ? { ...run, done: true } : run;
  showOver(final, null);
  if (!r0 || room || !r0.ranked || r0.sent) return;
  r0.sent = true;
  try {
    const res = await api('serpent-submit', { run: r0.id, inputs: S.encodeInputs(r0.changes), ticks: W.tick });
    showOver(final, res);
    loadTop();
  } catch (e) { showOver(final, { error: e.message }); }
}

/* ---------------- online rooms ---------------- */
const snap = s => ({ id: s.id, name: s.name, bot: s.bot, hue: s.hue, skin: s.skin, len: Math.round(s.len), alive: s.alive, score: s.score, a: s.a, pts: s.pts.filter((_, i) => i % 2 === 0).map(p => [Math.round(p.x), Math.round(p.y)]) });
function broadcastWorld(full) {
  if (!room || !isHost || !W) return;
  const now = performance.now();
  const msg = { t: 'w', tick: W.tick, R: Math.round(W.R), phase: W.phase, winner: W.winner || null, bots: W.snakes.filter(s => s.bot).map(snap) };
  if (full || now - lastFoodFull > 900) { lastFoodFull = now; msg.food = W.food.map(f => [f.id, Math.round(f.x), Math.round(f.y), f.v, f.h]); }
  room.send(msg);
}
function sendMine() {
  if (!room) return;
  if (mySnake) room.send({ t: 'p', s: snap(mySnake) });
  if (eatQueue.length) room.send({ t: 'eat', ids: eatQueue.splice(0) });
  for (const d of deadQueue.splice(0)) room.send({ t: 'dead', ...d });
}
function applySnap(o) {
  let s = W.snakes.find(x => x.id === o.id);
  if (!s) { s = { id: o.id, pts: [], local: false, grow: 0, peak: 0, kills: 0 }; W.snakes.push(s); }
  if (s.local) return;
  Object.assign(s, { name: String(o.name).slice(0, 14), bot: !!o.bot, hue: +o.hue || 0, skin: skinById(o.skin).id, len: +o.len || 0, alive: !!o.alive, score: +o.score || 0, a: +o.a || 0 });
  s.pts = (o.pts || []).slice(0, 2000).flatMap(([x, y], i, arr) => { const n = arr[i + 1]; return n ? [{ x, y }, { x: (x + n[0]) / 2, y: (y + n[1]) / 2 }] : [{ x, y }]; });
}
function onMsg(m) {
  if (!W) return;
  if (m.t === 'p' && m.s?.id !== me.id) applySnap(m.s);
  if (m.t === 'w' && !isHost) {
    W.tick = m.tick; W.time = m.tick * S.TICK; W.R = m.R;
    for (const b of m.bots || []) applySnap(b);
    if (m.food) W.food = m.food.map(([id, x, y, v, h]) => ({ id, x, y, v, h }));
    if (m.phase === 'end' && W.phase !== 'end') { W.phase = 'end'; W.winner = m.winner; showOver(true); }
  }
  if (m.t === 'eat' && isHost) { const ids = new Set(m.ids); W.food = W.food.filter(f => !ids.has(f.id)); }
  if (m.t === 'dead' && isHost) { (m.pts || []).slice(0, 400).forEach(([x, y]) => S.addFood(W, x, y, 2, m.hue)); const s = W.snakes.find(x => x.id === m.id); if (s) s.alive = false; }
  if (m.t === 'start' && !isHost) startRoomRound(m.seed, false, m.bots);
  if (m.t === 'hello' && isHost) { lobbyList(); if (W.phase === 'play') broadcastWorld(true); }
}
function startRoomRound(seed, host, bots) {
  isHost = host; run = null;
  W = S.createWorld({ seed, authority: host });
  mySnake = S.addSnake(W, { id: me.id, name: me.name, skin: me.skin, hue: 30 });
  if (host) { for (let i = 0; i < bots; i++) S.addSnake(W, { id: 'bot' + i, name: S.BOT_NAMES[i % S.BOT_NAMES.length], bot: true, skin: S.BOT_SKINS[i % S.BOT_SKINS.length], persona: S.personaFor(i) }); }
  enterPlay(null);
  if (host && room) { room.send({ t: 'start', seed, bots }); broadcastWorld(true); }
}
const botCount = () => room ? Math.max(2, 8 - room.peers().length) : S.SOLO_BOTS;
function leave() {
  room?.leave(); room = null; W = null; mySnake = null; run = null;
  $('#over').hidden = true; $('#hud').hidden = true; $('#menu').hidden = false; $('#lobby').hidden = true; $('#roomplate').hidden = true; $('#touch').hidden = true;
  document.body.classList.remove('sz-playing');
  if (location.search) history.replaceState(null, '', location.pathname);
}
$('#solo').onclick = () => startSolo();
$('#create').onclick = async () => { await openRoom(newCode(), true); };
$('#join').onclick = async () => { const c = cleanCode($('#code').value); if (c.length !== 4) return; await openRoom(c, false); };
$('#code').addEventListener('input', e => { e.target.value = cleanCode(e.target.value); });
async function openRoom(code, host) {
  room?.leave();
  room = new Room('serpent', code, me); isHost = host;
  $('#led').className = 'led amber blink';
  try { await room.connect(); } catch (e) { $('#lobby').hidden = false; $('#lobby').textContent = e.message; $('#led').className = 'led red'; room = null; return; }
  $('#led').className = 'led green';
  $('#roomplate').hidden = false; $('#roomplate').textContent = 'Room ' + code;
  history.replaceState(null, '', '?room=' + code);
  room.on('msg', onMsg); room.on('presence', () => lobbyList());
  W = W || { phase: 'lobby', snakes: [], food: [] };
  lobbyList(); room.send({ t: 'hello' });
}
function lobbyList() {
  const box = $('#lobby'); box.hidden = false; box.replaceChildren();
  const c = document.createElement('div'); c.className = 'code'; c.textContent = room?.code || ''; box.append(c);
  const link = document.createElement('p'); link.className = 'sz-help'; link.textContent = location.origin + location.pathname + '?room=' + (room?.code || ''); box.append(link);
  const ul = document.createElement('ul'); (room?.peers() || []).forEach(p => { const li = document.createElement('li'); li.textContent = '● ' + p.name + (p.id === me.id ? ' (you)' : ''); ul.append(li); }); box.append(ul);
  if (isHost) { const b = document.createElement('button'); b.className = 'key key--amber'; b.type = 'button'; b.textContent = 'Start round'; b.onclick = () => startRoomRound(crypto.getRandomValues(new Uint32Array(1))[0], true, botCount()); box.append(b); }
  else { const w = document.createElement('p'); w.className = 'sz-help'; w.textContent = 'Waiting for the host to start…'; box.append(w); }
}
{ const r = cleanCode(new URL(location.href).searchParams.get('room')); if (r.length === 4) $('#code').value = r; }

/* ---------------- game over ---------------- */
function showOver(final, res) {
  if (!W) return;
  const o = $('#over');
  const ranking = [...W.snakes].sort((a, b) => (b.alive - a.alive) || (b.len - a.len));
  const win = W.snakes.find(s => s.id === W.winner);
  o.replaceChildren();
  const h2 = document.createElement('h2'); h2.textContent = final ? (W.winner === me.id ? 'You win!' : `${win?.name || 'Nobody'} wins`) : 'You got coiled';
  const p = document.createElement('p'); p.textContent = `Length ${Math.round(mySnake?.len || 0)} · best ${Math.round(mySnake?.peak || 0)} · ${mySnake?.kills || 0} kills · rank ${ranking.findIndex(s => s.id === me.id) + 1} of ${ranking.length}`;
  const sc = document.createElement('p'); sc.className = 'sz-score';
  if (res?.score != null) sc.textContent = `Verified score ${res.score.toLocaleString('en-US')}` + (res.rank ? ` · #${res.rank} on the leaderboard` : '') + (res.best ? ` · your best ${res.best.toLocaleString('en-US')}` : '');
  else if (res?.error) sc.textContent = 'Score not saved: ' + res.error;
  else if (!room && run?.ranked) sc.textContent = 'Checking your run on the server…';
  const btns = document.createElement('div'); btns.className = 'sz-btns';
  const mk = (txt, cls, fn) => { const b = document.createElement('button'); b.className = 'key ' + cls; b.type = 'button'; b.textContent = txt; b.onclick = fn; btns.append(b); return b; };
  if (!room) mk('Play again', 'key--amber', () => startSolo());
  else if (isHost) mk('New round for everyone', 'key--amber', () => startRoomRound(crypto.getRandomValues(new Uint32Array(1))[0], true, botCount()));
  else { const w = document.createElement('p'); w.className = 'sz-help'; w.textContent = 'Waiting for the host to start a new round.'; btns.append(w); }
  mk('Menu', '', () => { leave(); loadTop(); });
  if (!final) mk('Watch', '', () => { o.hidden = true; });
  o.append(h2, p, sc, btns); o.hidden = false;
}

/* ---------------- rendering ---------------- */
let shake = 0, cam = { x: 0, y: 0, z: 1 }, actx;
function blip(v) { if (reduced) return; try { const AC = window.AudioContext || window.webkitAudioContext; actx ||= new AC(); const t = actx.currentTime, o = actx.createOscillator(), gn = actx.createGain(); o.frequency.value = 520 + v * 180 + Math.random() * 60; gn.gain.setValueAtTime(.04, t); gn.gain.exponentialRampToValueAtTime(.0001, t + .08); o.connect(gn).connect(actx.destination); o.start(t); o.stop(t + .1); } catch {} }
function resize() { const d = Math.min(2, devicePixelRatio || 1); cv.width = cv.clientWidth * d; cv.height = cv.clientHeight * d; g.setTransform(d, 0, 0, d, 0, 0); }
addEventListener('resize', resize); new ResizeObserver(resize).observe(cv); resize();
function headAt(s, alpha) { // extrapolate the head between fixed steps so motion stays smooth at 30 Hz
  const h = s.pts[0]; if (!s.local || !s.alive || W.phase !== 'play') return h;
  const sp = (s.boost && s.len > 20 ? S.BOOST : S.SPEED) * S.TICK * alpha;
  return { x: h.x + S.COS[s.a] * sp, y: h.y + S.SIN[s.a] * sp };
}
function draw(now, alpha) {
  const w = cv.clientWidth, h = cv.clientHeight;
  g.fillStyle = '#0b0d12'; g.fillRect(0, 0, w, h);
  if (!W || !W.snakes.length) { drawIdle(now, w, h); return; }
  const target = (mySnake && mySnake.alive) ? mySnake : W.snakes.filter(s => s.alive).sort((a, b) => b.len - a.len)[0] || mySnake;
  if (target) { const hd = headAt(target, alpha); cam.x += (hd.x - cam.x) * .18; cam.y += (hd.y - cam.y) * .18; const small = Math.min(w, h) < 520 ? .78 : 1; const zt = Math.max(.45, Math.min(1, 1.05 - target.len / 1600)) * Math.min(1, Math.max(.6, Math.max(w, h) / 1100)) * small; cam.z += (zt - cam.z) * .05; }
  g.save();
  const sx = shake ? (Math.random() - .5) * 2 * shake : 0, sy = shake ? (Math.random() - .5) * 2 * shake : 0; shake *= .85; if (shake < .5) shake = 0;
  g.translate(w / 2 + sx, h / 2 + sy); g.scale(cam.z, cam.z); g.translate(-cam.x, -cam.y);
  const grid = 60, x0 = cam.x - w / 2 / cam.z, y0 = cam.y - h / 2 / cam.z, x1 = cam.x + w / 2 / cam.z, y1 = cam.y + h / 2 / cam.z;
  g.fillStyle = '#141824';
  for (let y = Math.floor(y0 / grid) * grid; y < y1; y += grid) for (let x = Math.floor(x0 / grid) * grid + ((y / grid) % 2 ? grid / 2 : 0); x < x1; x += grid) { g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill(); }
  g.save(); g.beginPath(); g.rect(x0 - 50, y0 - 50, x1 - x0 + 100, y1 - y0 + 100); g.arc(0, 0, W.R, 0, Math.PI * 2, true); g.fillStyle = 'rgba(255,40,80,.16)'; g.fill(); g.restore();
  g.lineWidth = 6 / cam.z; g.strokeStyle = `rgba(255,70,110,${.6 + .3 * Math.sin(now / 200)})`; g.shadowColor = '#ff2d55'; g.shadowBlur = reduced ? 0 : 20; g.beginPath(); g.arc(0, 0, W.R, 0, 7); g.stroke(); g.shadowBlur = 0;
  for (const f of W.food) {
    if (f.x < x0 - 20 || f.x > x1 + 20 || f.y < y0 - 20 || f.y > y1 + 20) continue;
    const r = 3 + f.v * 1.8 + Math.sin(now / 300 + f.id) * .8;
    g.fillStyle = `hsl(${f.h} 100% 65%)`; if (!reduced && f.v > 1) { g.shadowColor = `hsl(${f.h} 100% 60%)`; g.shadowBlur = 12; } else g.shadowBlur = 0;
    g.beginPath(); g.arc(f.x, f.y, r, 0, 7); g.fill();
  }
  g.shadowBlur = 0;
  for (const s of W.snakes.filter(s => s.alive).sort((a, b) => a.len - b.len)) drawSnake(s, now, alpha, x0, y0, x1, y1);
  g.restore();
  hud(now);
}
function drawSnake(s, now, alpha, x0, y0, x1, y1) {
  const r = S.radius(s), pts = s.pts; if (!pts.length) return;
  const sk = skinById(s.skin), glow = (s.boost || sk.neon != null) && !reduced ? glowOf(sk) || `hsl(${s.hue} 100% 60%)` : null;
  const head = headAt(s, alpha);
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = i === 0 ? head : pts[i];
    if (p.x < x0 - 40 || p.x > x1 + 40 || p.y < y0 - 40 || p.y > y1 + 40) continue;
    g.fillStyle = segColor(sk, i, pts.length, now, s.hue);
    if (glow && i % 4 === 0) { g.shadowColor = glow; g.shadowBlur = s.boost ? 16 : 8; } else g.shadowBlur = 0;
    g.beginPath(); g.arc(p.x, p.y, r * (1 - i / pts.length * .35), 0, 7); g.fill();
  }
  g.shadowBlur = 0;
  const a = S.toRad(s.a);
  for (const side of [-1, 1]) {
    const ex = head.x + Math.cos(a + side * .55) * r * .55, ey = head.y + Math.sin(a + side * .55) * r * .55;
    g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, ey, r * .36, 0, 7); g.fill();
    g.fillStyle = '#111'; g.beginPath(); g.arc(ex + Math.cos(a) * r * .14, ey + Math.sin(a) * r * .14, r * .18, 0, 7); g.fill();
  }
  if (s.hurt && s.local) { g.strokeStyle = 'rgba(255,60,90,.8)'; g.lineWidth = 3; g.beginPath(); g.arc(head.x, head.y, r + 4, 0, 7); g.stroke(); }
  g.font = '600 13px Controls, sans-serif'; g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.8)';
  g.fillText(s.name, head.x, head.y - r - 10);
}
function hud(now) {
  if (now - (hud.t || 0) < 200) return; hud.t = now;
  const alive = W.snakes.filter(s => s.alive).length;
  $('#aliveTxt').textContent = alive;
  $('#lenTxt').textContent = Math.round(mySnake?.len || 0);
  const left = Math.max(0, S.SHRINK_TO - W.time);
  $('#zoneTxt').textContent = W.time < S.SHRINK_FROM ? `closes in ${Math.ceil(S.SHRINK_FROM - W.time)}s` : left > 0 ? `${Math.round(W.R)}m · ${Math.ceil(left)}s` : 'final ring';
  const board = $('#board');
  board.replaceChildren(...[...W.snakes].sort((a, b) => (b.alive - a.alive) || b.len - a.len).slice(0, touchUI ? 5 : 8).map(s => { const li = document.createElement('li'); li.className = (s.id === me.id ? 'me ' : '') + (s.alive ? '' : 'dead'); const n = document.createElement('span'); n.textContent = s.name; const l = document.createElement('b'); l.textContent = Math.round(s.len); li.append(n, l); return li; }));
}
const idle = Array.from({ length: 6 }, (_, i) => ({ sk: SKINS[i * 2], a: i, r: 120 + i * 30 }));
function drawIdle(now, w, h) {
  g.save(); g.translate(w / 2, h / 2);
  for (const s of idle) for (let k = 39; k >= 0; k--) { const t = now / 1600 + s.a - k * .03; g.globalAlpha = 1 - k / 40; g.fillStyle = segColor(s.sk, k, 40, now, 30); g.beginPath(); g.arc(Math.cos(t) * s.r * 1.6, Math.sin(t * 1.3) * s.r, 9 - k * .15, 0, 7); g.fill(); }
  g.globalAlpha = 1; g.restore();
}
let last = performance.now();
function loop(now) {
  const dt = Math.min(.25, (now - last) / 1000); last = now;
  if (W && W.phase === 'play' && W.snakes.length) {
    acc0 += dt;
    while (acc0 >= S.TICK) { tick(); acc0 -= S.TICK; if (!W) break; }
    if (room && W) {
      if (now - lastSend > 66) { lastSend = now; sendMine(); }
      if (isHost && now - lastWorld > 100) { lastWorld = now; broadcastWorld(false); }
    }
  }
  draw(now, W ? Math.min(1, acc0 / S.TICK) : 0);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
addEventListener('pagehide', () => room?.leave());
// Pause-proof ranked runs: if the tab is hidden the world keeps its clock, so a run can't be slowed down.
document.addEventListener('visibilitychange', () => { last = performance.now(); });
