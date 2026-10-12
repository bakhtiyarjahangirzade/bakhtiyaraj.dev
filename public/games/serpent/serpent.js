// Serpent Zone: a snake battle royale with a shrinking arena. Solo vs bots or online rooms (Supabase broadcast).
// The room creator is the host: it owns food, bots and the zone clock. Every player simulates their own serpent.
import { Room, myId, newCode, cleanCode } from '/games/shared/net.js';
import { mountAccount } from '/assets/account-ui.js';
import * as acc from '/assets/account.js';

const $ = s => document.querySelector(s);
const cv = $('#cv'), g = cv.getContext('2d');
const SEG = 7, SPEED = 165, BOOST = 300, TURN = 3.4, START_LEN = 28;
const R0 = 1500, RMIN = 220, SHRINK_FROM = 15, SHRINK_TO = 190, MAX_TIME = 240;
const BOT_NAMES = ['Relay', 'Diode', 'Valve', 'Fuse', 'Coil', 'Quartz', 'Ohm', 'Volt', 'Flux', 'Pulse'];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
mountAccount($('#tools'));
acc.init().then(() => { if (acc.displayName() && !localStorage.getItem('bakhy.name')) $('#nm').value = acc.displayName(); });

const me = { id: myId(), name: (() => { try { return JSON.parse(localStorage.getItem('bakhy.name')) || 'Player'; } catch { return 'Player'; } })() };
$('#nm').value = me.name;
$('#nm').addEventListener('input', e => { me.name = e.target.value.trim() || 'Player'; try { localStorage.setItem('bakhy.name', JSON.stringify(me.name)); } catch {} });

/* ---------------- world ---------------- */
let W = null;            // { time, R, food: Map, snakes: Map, phase, host, winner }
let room = null, isHost = true, mySnake = null, lastSend = 0, lastWorld = 0, lastFoodFull = 0, foodSeq = 0;
const eatQueue = [], deadQueue = [];
const rnd = (a, b) => a + Math.random() * (b - a);
const hueFor = id => { let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
function zoneR(t) { if (t < SHRINK_FROM) return R0; const k = Math.min(1, (t - SHRINK_FROM) / (SHRINK_TO - SHRINK_FROM)); return R0 + (RMIN - R0) * k; }
function spawnPoint(R) { const a = rnd(0, Math.PI * 2), d = Math.sqrt(Math.random()) * R * .7; return { x: Math.cos(a) * d, y: Math.sin(a) * d }; }
function newSnake(id, name, bot, R) {
  const p = spawnPoint(R), a = Math.atan2(-p.y, -p.x) + rnd(-.6, .6);
  const pts = []; for (let i = 0; i < START_LEN; i++) pts.push({ x: p.x - Math.cos(a) * i * SEG, y: p.y - Math.sin(a) * i * SEG });
  return { id, name, bot, hue: bot ? (BOT_NAMES.indexOf(name) * 37 + 20) % 360 : hueFor(id), a, ta: a, pts, len: START_LEN, grow: 0, alive: true, boost: false, score: 0, aiT: 0 };
}
const radius = s => 7 + Math.min(13, s.len / 45);
function addFood(x, y, v = 1, h) { const id = ++foodSeq + (isHost ? 0 : 1e6); const f = { id, x, y, v, h: h ?? Math.floor(rnd(0, 360)) }; W.food.set(id, f); return f; }
function topUpFood() { const target = Math.round(220 + W.R / 6); let tries = 0; while (W.food.size < target && tries++ < 200) { const p = spawnPoint(W.R / .72); addFood(p.x, p.y, Math.random() < .12 ? 3 : 1); } }

/* ---------------- input ---------------- */
let pointer = null, boostHeld = false, keyTurn = 0;
cv.addEventListener('pointermove', e => { pointer = { x: e.offsetX, y: e.offsetY }; });
cv.addEventListener('pointerdown', e => { pointer = { x: e.offsetX, y: e.offsetY }; if (e.pointerType === 'mouse' || e.isPrimary === false) boostHeld = true; activeTouches.add(e.pointerId); if (activeTouches.size > 1) boostHeld = true; });
const activeTouches = new Set();
addEventListener('pointerup', e => { activeTouches.delete(e.pointerId); if (activeTouches.size < 2) boostHeld = false; });
addEventListener('keydown', e => { if (e.target.closest('input')) return; if (e.code === 'Space') { boostHeld = true; e.preventDefault(); } if (e.code === 'ArrowLeft') keyTurn = -1; if (e.code === 'ArrowRight') keyTurn = 1; });
addEventListener('keyup', e => { if (e.code === 'Space') boostHeld = false; if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') keyTurn = 0; });

/* ---------------- simulation ---------------- */
function steer(s, dt) {
  let d = ((s.ta - s.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  s.a += Math.max(-TURN * dt, Math.min(TURN * dt, d));
}
function moveSnake(s, dt) {
  const speed = s.boost && s.len > 20 ? BOOST : SPEED;
  const head = s.pts[0];
  const nx = head.x + Math.cos(s.a) * speed * dt, ny = head.y + Math.sin(s.a) * speed * dt;
  const h = { x: nx, y: ny };
  if (s.pts.length < 2 || Math.hypot(nx - s.pts[1].x, ny - s.pts[1].y) >= SEG) s.pts.unshift(h); else s.pts[0] = h;
  while (s.pts.length > Math.max(2, Math.round(s.len))) s.pts.pop();
  if (s.grow > 0) { const k = Math.min(s.grow, 8 * dt * 10); s.len += k; s.grow -= k; }
  if (s.boost && s.len > 20) { s.len -= 6 * dt; s.dropT = (s.dropT || 0) + dt; if (s.dropT > .25 && isHost) { s.dropT = 0; const t = s.pts[s.pts.length - 1]; addFood(t.x, t.y, 1, s.hue); } }
}
function bodyHit(x, y, r, other, skipHead) {
  const or = radius(other);
  for (let i = skipHead ? 6 : 0; i < other.pts.length; i += 2) { const p = other.pts[i]; if ((p.x - x) ** 2 + (p.y - y) ** 2 < (r + or * .8) ** 2) return true; }
  return false;
}
function kill(s) {
  if (!s.alive) return; s.alive = false; s.diedAt = W.time;
  if (isHost) for (let i = 0; i < s.pts.length; i += 3) { const p = s.pts[i]; addFood(p.x + rnd(-6, 6), p.y + rnd(-6, 6), 2, s.hue); }
  else deadQueue.push({ id: s.id, pts: s.pts.filter((_, i) => i % 3 === 0).map(p => [Math.round(p.x), Math.round(p.y)]), hue: s.hue });
  if (s === mySnake) { shake = 18; showOver(false); }
}
function ai(s, dt) {
  s.aiT -= dt; if (s.aiT > 0) return; s.aiT = .12;
  const h = s.pts[0], dc = Math.hypot(h.x, h.y);
  if (dc > W.R - 160) { s.ta = Math.atan2(-h.y, -h.x); s.boost = false; return; }
  // danger look-ahead
  const look = { x: h.x + Math.cos(s.a) * 70, y: h.y + Math.sin(s.a) * 70 };
  for (const o of W.snakes.values()) if (o.alive && o !== s && bodyHit(look.x, look.y, 16, o, false)) { s.ta = s.a + (Math.random() < .5 ? 1.6 : -1.6); s.boost = false; return; }
  let best = null, bd = 420 ** 2;
  for (const f of W.food.values()) { const d = (f.x - h.x) ** 2 + (f.y - h.y) ** 2; if (d < bd) { bd = d; best = f; } }
  if (best) s.ta = Math.atan2(best.y - h.y, best.x - h.x); else s.ta += rnd(-.4, .4);
  s.boost = best && best.v > 1 && bd < 150 ** 2 && s.len > 60 && Math.random() < .3;
}
function eat(s) {
  const h = s.pts[0], r = radius(s) + 8;
  for (const f of W.food.values()) if ((f.x - h.x) ** 2 + (f.y - h.y) ** 2 < r * r) { s.grow += f.v * 1.4; s.score += f.v; W.food.delete(f.id); if (!isHost) eatQueue.push(f.id); if (s === mySnake) blip(f.v); }
}
function step(dt) {
  if (!W || W.phase !== 'play') return;
  if (isHost) { W.time += dt; W.R = zoneR(W.time); }
  // me
  if (mySnake && mySnake.alive) {
    if (pointer) { const ang = Math.atan2(pointer.y - cv.clientHeight / 2, pointer.x - cv.clientWidth / 2); mySnake.ta = ang; }
    if (keyTurn) mySnake.ta = mySnake.a + keyTurn * .6;
    mySnake.boost = boostHeld;
  }
  for (const s of W.snakes.values()) {
    if (!s.alive) continue;
    if (s.remote) continue;
    if (s.bot) { if (!isHost) continue; ai(s, dt); }
    steer(s, dt); moveSnake(s, dt); eat(s);
    const h = s.pts[0];
    if (Math.hypot(h.x, h.y) > W.R) { s.len -= 40 * dt; if (s === mySnake) shake = Math.max(shake, 4); if (s.len < 12) kill(s); }
  }
  // collisions (each machine checks the serpents it simulates)
  for (const s of W.snakes.values()) {
    if (!s.alive || s.remote || (s.bot && !isHost)) continue;
    const h = s.pts[0], r = radius(s) * .7;
    for (const o of W.snakes.values()) { if (o === s || !o.alive) continue; if (bodyHit(h.x, h.y, r, o, false)) { kill(s); break; } }
  }
  if (isHost) { topUpFood(); checkEnd(); }
}
function checkEnd() {
  const alive = [...W.snakes.values()].filter(s => s.alive);
  const total = W.snakes.size;
  if ((total > 1 && alive.length <= 1) || W.time > MAX_TIME) {
    const win = alive.sort((a, b) => b.len - a.len)[0] || [...W.snakes.values()].sort((a, b) => (b.diedAt || 0) - (a.diedAt || 0))[0];
    W.phase = 'end'; W.winner = win ? win.id : null; broadcastWorld(true); showOver(true);
  }
}

/* ---------------- networking ---------------- */
const snap = s => ({ id: s.id, name: s.name, bot: s.bot, hue: s.hue, len: Math.round(s.len), alive: s.alive, score: s.score, a: +s.a.toFixed(2), pts: s.pts.filter((_, i) => i % 2 === 0).map(p => [Math.round(p.x), Math.round(p.y)]) });
function broadcastWorld(full) {
  if (!room || !isHost) return;
  const now = performance.now();
  const msg = { t: 'w', time: +W.time.toFixed(2), R: Math.round(W.R), phase: W.phase, winner: W.winner || null, bots: [...W.snakes.values()].filter(s => s.bot).map(snap) };
  if (full || now - lastFoodFull > 900) { lastFoodFull = now; msg.food = [...W.food.values()].map(f => [f.id, Math.round(f.x), Math.round(f.y), f.v, f.h]); }
  room.send(msg);
}
function sendMine() {
  if (!room) return;
  if (mySnake) room.send({ t: 'p', s: snap(mySnake) });
  if (eatQueue.length) room.send({ t: 'eat', ids: eatQueue.splice(0) });
  if (deadQueue.length) for (const d of deadQueue.splice(0)) room.send({ t: 'dead', ...d });
}
function applySnap(o) {
  let s = W.snakes.get(o.id);
  if (!s) { s = { ...o, remote: true, grow: 0 }; W.snakes.set(o.id, s); }
  s.name = o.name; s.hue = o.hue; s.len = o.len; s.alive = o.alive; s.score = o.score; s.a = o.a; s.bot = o.bot;
  s.pts = o.pts.flatMap(([x, y], i, arr) => { const n = arr[i + 1]; return n ? [{ x, y }, { x: (x + n[0]) / 2, y: (y + n[1]) / 2 }] : [{ x, y }]; });
  s.remote = true;
}
function onMsg(m) {
  if (!W) return;
  if (m.t === 'p' && m.s.id !== me.id) applySnap(m.s);
  if (m.t === 'w' && !isHost) {
    W.time = m.time; W.R = m.R;
    for (const b of m.bots) applySnap(b);
    if (m.food) { W.food = new Map(m.food.map(([id, x, y, v, h]) => [id, { id, x, y, v, h }])); }
    if (m.phase === 'end' && W.phase !== 'end') { W.phase = 'end'; W.winner = m.winner; showOver(true); }
    if (m.phase === 'play' && W.phase !== 'play') W.phase = 'play';
  }
  if (m.t === 'eat' && isHost) m.ids.forEach(id => W.food.delete(id));
  if (m.t === 'dead' && isHost) { m.pts.forEach(([x, y]) => addFood(x, y, 2, m.hue)); const s = W.snakes.get(m.id); if (s) s.alive = false; }
  if (m.t === 'start' && !isHost) startRound(m.players, false);
  if (m.t === 'hello' && isHost) { lobbyList(); if (W.phase === 'play') broadcastWorld(true); }
}

/* ---------------- rounds & menus ---------------- */
function startRound(players, host) {
  isHost = host;
  W = { time: 0, R: R0, food: new Map(), snakes: new Map(), phase: 'play', winner: null };
  mySnake = newSnake(me.id, me.name, false, R0); mySnake.hue = hueFor(me.id);
  W.snakes.set(me.id, mySnake);
  if (host) {
    const bots = players.bots ?? 7;
    for (let i = 0; i < bots; i++) { const b = newSnake('bot' + i, BOT_NAMES[i % BOT_NAMES.length], true, R0); W.snakes.set(b.id, b); }
    topUpFood();
  }
  $('#menu').hidden = true; $('#over').hidden = true; $('#hud').hidden = false;
  if (host && room) { room.send({ t: 'start', players }); broadcastWorld(true); }
}
function showOver(final) {
  const o = $('#over');
  const ranking = [...W.snakes.values()].sort((a, b) => (b.alive - a.alive) || (b.len - a.len));
  const win = W.snakes.get(W.winner);
  o.replaceChildren();
  const h2 = document.createElement('h2'); h2.textContent = final ? (W.winner === me.id ? 'You win!' : `${win?.name || 'Nobody'} wins`) : 'You got coiled';
  const p = document.createElement('p'); p.textContent = final ? `Final length ${Math.round(mySnake?.len || 0)} · rank ${ranking.findIndex(s => s.id === me.id) + 1} of ${ranking.length}` : `Length ${Math.round(mySnake.len)}. Keep watching or start again.`;
  const btns = document.createElement('div'); btns.className = 'sz-btns';
  if (isHost || !room) { const again = document.createElement('button'); again.className = 'key key--amber'; again.type = 'button'; again.textContent = room ? 'New round for everyone' : 'Play again'; again.onclick = () => startRound({ bots: botCount() }, true); btns.append(again); }
  else { const w = document.createElement('p'); w.className = 'sz-help'; w.textContent = 'Waiting for the host to start a new round.'; btns.append(w); }
  const menu = document.createElement('button'); menu.className = 'key'; menu.type = 'button'; menu.textContent = 'Menu'; menu.onclick = () => { leave(); };
  btns.append(menu);
  if (!final) { const watch = document.createElement('button'); watch.className = 'key'; watch.type = 'button'; watch.textContent = 'Watch'; watch.onclick = () => { o.hidden = true; }; btns.append(watch); }
  o.append(h2, p, btns); o.hidden = false;
}
const botCount = () => room ? Math.max(2, 8 - (room.peers().length)) : 9;
function leave() { room?.leave(); room = null; W = null; mySnake = null; $('#over').hidden = true; $('#hud').hidden = true; $('#menu').hidden = false; $('#lobby').hidden = true; $('#roomplate').hidden = true; history.replaceState(null, '', location.pathname); }

$('#solo').onclick = () => { leave(); startRound({ bots: 9 }, true); };
$('#create').onclick = async () => { const code = newCode(); await openRoom(code, true); };
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
  room.on('msg', onMsg);
  room.on('presence', lobbyList);
  W = W || { time: 0, R: R0, food: new Map(), snakes: new Map(), phase: 'lobby' };
  lobbyList(code);
  room.send({ t: 'hello' });
}
function lobbyList(code) {
  const box = $('#lobby'); box.hidden = false; box.replaceChildren();
  const c = document.createElement('div'); c.className = 'code'; c.textContent = room?.code || code || ''; box.append(c);
  const link = document.createElement('p'); link.className = 'sz-help'; link.textContent = location.origin + location.pathname + '?room=' + (room?.code || ''); box.append(link);
  const ul = document.createElement('ul'); (room?.peers() || []).forEach(p => { const li = document.createElement('li'); li.textContent = '● ' + p.name + (p.id === me.id ? ' (you)' : ''); ul.append(li); }); box.append(ul);
  if (isHost) { const b = document.createElement('button'); b.className = 'key key--amber'; b.type = 'button'; b.textContent = 'Start round'; b.onclick = () => startRound({ bots: botCount() }, true); box.append(b); }
  else { const w = document.createElement('p'); w.className = 'sz-help'; w.textContent = 'Waiting for the host to start…'; box.append(w); }
}
{ const r = cleanCode(new URL(location.href).searchParams.get('room')); if (r.length === 4) { $('#code').value = r; } }

/* ---------------- rendering ---------------- */
let shake = 0, cam = { x: 0, y: 0, z: 1 };
let actx;
function blip(v) { try { const A = window.AudioContext || window.webkitAudioContext; actx ||= new A(); const t = actx.currentTime, o = actx.createOscillator(), gn = actx.createGain(); o.frequency.value = 520 + v * 180 + Math.random() * 60; gn.gain.setValueAtTime(.04, t); gn.gain.exponentialRampToValueAtTime(.0001, t + .08); o.connect(gn).connect(actx.destination); o.start(t); o.stop(t + .1); } catch {} }
function resize() { const d = Math.min(2, devicePixelRatio || 1); cv.width = cv.clientWidth * d; cv.height = cv.clientHeight * d; g.setTransform(d, 0, 0, d, 0, 0); }
addEventListener('resize', resize); resize();
function draw(now) {
  const w = cv.clientWidth, h = cv.clientHeight;
  g.fillStyle = '#0b0d12'; g.fillRect(0, 0, w, h);
  if (!W) { drawIdle(now, w, h); return; }
  const target = (mySnake && mySnake.alive) ? mySnake : [...W.snakes.values()].filter(s => s.alive).sort((a, b) => b.len - a.len)[0] || mySnake;
  if (target) { const hd = target.pts[0]; cam.x += (hd.x - cam.x) * .15; cam.y += (hd.y - cam.y) * .15; const zt = Math.max(.5, Math.min(1, 1.05 - target.len / 1600)) * Math.min(1, Math.max(.6, w / 1100)); cam.z += (zt - cam.z) * .05; }
  g.save();
  const sx = shake ? rnd(-shake, shake) : 0, sy = shake ? rnd(-shake, shake) : 0; shake *= .85; if (shake < .5) shake = 0;
  g.translate(w / 2 + sx, h / 2 + sy); g.scale(cam.z, cam.z); g.translate(-cam.x, -cam.y);
  // hex grid
  const grid = 60, x0 = cam.x - w / 2 / cam.z, y0 = cam.y - h / 2 / cam.z, x1 = cam.x + w / 2 / cam.z, y1 = cam.y + h / 2 / cam.z;
  g.fillStyle = '#141824';
  for (let y = Math.floor(y0 / grid) * grid; y < y1; y += grid) for (let x = Math.floor(x0 / grid) * grid + ((y / grid) % 2 ? grid / 2 : 0); x < x1; x += grid) { g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill(); }
  // outside zone
  g.save(); g.beginPath(); g.rect(x0 - 50, y0 - 50, x1 - x0 + 100, y1 - y0 + 100); g.arc(0, 0, W.R, 0, Math.PI * 2, true); g.fillStyle = 'rgba(255,40,80,.16)'; g.fill(); g.restore();
  g.lineWidth = 6 / cam.z; g.strokeStyle = `rgba(255,70,110,${.6 + .3 * Math.sin(now / 200)})`; g.shadowColor = '#ff2d55'; g.shadowBlur = 20; g.beginPath(); g.arc(0, 0, W.R, 0, 7); g.stroke(); g.shadowBlur = 0;
  // food
  for (const f of W.food.values()) {
    if (f.x < x0 - 20 || f.x > x1 + 20 || f.y < y0 - 20 || f.y > y1 + 20) continue;
    const r = 3 + f.v * 1.8 + Math.sin(now / 300 + f.id) * .8;
    g.fillStyle = `hsl(${f.h} 100% 65%)`; g.shadowColor = `hsl(${f.h} 100% 60%)`; g.shadowBlur = reduced ? 0 : 12; g.beginPath(); g.arc(f.x, f.y, r, 0, 7); g.fill();
  }
  g.shadowBlur = 0;
  // serpents
  const list = [...W.snakes.values()].filter(s => s.alive).sort((a, b) => a.len - b.len);
  for (const s of list) drawSnake(s, now);
  g.restore();
  // HUD
  const alive = [...W.snakes.values()].filter(s => s.alive).length;
  $('#aliveTxt').textContent = alive;
  $('#lenTxt').textContent = Math.round(mySnake?.len || 0);
  const left = Math.max(0, SHRINK_TO - W.time);
  $('#zoneTxt').textContent = W.time < SHRINK_FROM ? `closes in ${Math.ceil(SHRINK_FROM - W.time)}s` : left > 0 ? `${Math.round(W.R)}m · ${Math.ceil(left)}s` : 'final ring';
  if (now - (draw.lb || 0) > 400) {
    draw.lb = now;
    const board = $('#board'); board.replaceChildren(...[...W.snakes.values()].sort((a, b) => (b.alive - a.alive) || b.len - a.len).slice(0, 8).map(s => { const li = document.createElement('li'); li.className = (s.id === me.id ? 'me ' : '') + (s.alive ? '' : 'dead'); li.innerHTML = ''; const n = document.createElement('span'); n.textContent = s.name; const l = document.createElement('b'); l.textContent = Math.round(s.len); li.append(n, l); return li; }));
  }
}
function drawSnake(s, now) {
  const r = radius(s), pts = s.pts; if (!pts.length) return;
  const glow = s.boost && !reduced;
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i], k = i / pts.length;
    const light = 55 + 12 * Math.sin(i * .6 - now / 120);
    g.fillStyle = `hsl(${s.hue} 85% ${light - k * 18}%)`;
    if (glow && i % 3 === 0) { g.shadowColor = `hsl(${s.hue} 100% 60%)`; g.shadowBlur = 14; } else g.shadowBlur = 0;
    g.beginPath(); g.arc(p.x, p.y, r * (1 - k * .35), 0, 7); g.fill();
  }
  g.shadowBlur = 0;
  const h = pts[0], a = s.a;
  for (const side of [-1, 1]) {
    const ex = h.x + Math.cos(a + side * .55) * r * .55, ey = h.y + Math.sin(a + side * .55) * r * .55;
    g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, ey, r * .36, 0, 7); g.fill();
    g.fillStyle = '#111'; g.beginPath(); g.arc(ex + Math.cos(a) * r * .14, ey + Math.sin(a) * r * .14, r * .18, 0, 7); g.fill();
  }
  g.font = '600 13px Controls, sans-serif'; g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.8)';
  g.fillText(s.name, h.x, h.y - r - 10);
}
const idle = Array.from({ length: 6 }, (_, i) => ({ hue: i * 60, a: i, r: 120 + i * 30 }));
function drawIdle(now, w, h) {
  g.save(); g.translate(w / 2, h / 2);
  for (const s of idle) { for (let k = 0; k < 40; k++) { const t = now / 1600 + s.a - k * .03; g.fillStyle = `hsla(${s.hue} 90% 60% / ${1 - k / 40})`; g.beginPath(); g.arc(Math.cos(t) * s.r * 1.6, Math.sin(t * 1.3) * s.r, 9 - k * .15, 0, 7); g.fill(); } }
  g.restore();
}
let last = performance.now();
function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  step(dt);
  if (room && W && W.phase === 'play') {
    if (now - lastSend > 66) { lastSend = now; sendMine(); }
    if (isHost && now - lastWorld > 100) { lastWorld = now; broadcastWorld(false); }
  }
  draw(now);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
addEventListener('pagehide', () => room?.leave());
