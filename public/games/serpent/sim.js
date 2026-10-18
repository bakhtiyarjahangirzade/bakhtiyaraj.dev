// Serpent Zone simulation. Fixed 30 Hz steps, integer angles and only + − × ÷ and sqrt in the hot path,
// so the same seed and input log give the same game in every browser and on the server. That lets the
// server replay a solo run and confirm its score before it reaches the leaderboard.
export const TICK = 1 / 30;
export const A = 4096;                       // angle units per full turn
export const SEG = 7, SPEED = 165, BOOST = 300, TURN = 3.4, START_LEN = 28;
export const R0 = 1500, RMIN = 220, SHRINK_FROM = 15, SHRINK_TO = 190, MAX_TIME = 240;
export const BOT_NAMES = ['Relay', 'Diode', 'Valve', 'Fuse', 'Coil', 'Quartz', 'Ohm', 'Volt', 'Flux', 'Pulse', 'Tesla', 'Farad'];
const PI = 3.141592653589793, TAU = 6.283185307179586;
const TURN_U = Math.round(TURN / TAU * A * TICK);

/* ---------- deterministic math ---------- */
function sinPoly(x) { // x in [-pi, pi]
  if (x > PI / 2) x = PI - x; else if (x < -PI / 2) x = -PI - x;
  const x2 = x * x;
  return x * (1 - x2 / 6 * (1 - x2 / 20 * (1 - x2 / 42 * (1 - x2 / 72 * (1 - x2 / 110 * (1 - x2 / 156 * (1 - x2 / 210)))))));
}
export const SIN = new Float64Array(A), COS = new Float64Array(A);
for (let i = 0; i < A; i++) { let r = i / A * TAU; if (r > PI) r -= TAU; SIN[i] = sinPoly(r); let c = r + PI / 2; if (c > PI) c -= TAU; COS[i] = sinPoly(c); }
const wrap = u => ((u % A) + A) % A;
function atanPoly(t) { const t2 = t * t; return t * (0.9998660 + t2 * (-0.3302995 + t2 * (0.1801410 + t2 * (-0.0851330 + t2 * 0.0208351)))); }
export function atan2u(y, x) { // integer angle units, deterministic
  if (x === 0 && y === 0) return 0;
  const ax = x < 0 ? -x : x, ay = y < 0 ? -y : y;
  let r = ax >= ay ? atanPoly(ay / ax) : PI / 2 - atanPoly(ax / ay);
  if (x < 0) r = PI - r;
  if (y < 0) r = -r;
  return wrap(Math.round(r / TAU * A));
}
export const toRad = u => u / A * TAU;
const diffU = (a, b) => { let d = wrap(b - a); if (d > A / 2) d -= A; return d; };
export function rng(seed) { let s = seed >>> 0 || 1; const f = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; return f; }

export function zoneR(t) { if (t < SHRINK_FROM) return R0; const k = Math.min(1, (t - SHRINK_FROM) / (SHRINK_TO - SHRINK_FROM)); return R0 + (RMIN - R0) * k; }
export const radius = s => 7 + Math.min(13, s.len / 45);

/* ---------- world ---------- */
// opts: { seed, bots, authority (owns food/zone/bots), local (simulate this snake), skins }
export function createWorld(opts) {
  const W = { tick: 0, time: 0, R: R0, food: [], foodSeq: 0, snakes: [], phase: 'play', winner: null, rnd: rng(opts.seed), authority: opts.authority !== false, events: [], grid: null };
  return W;
}
function spawnPoint(W, R) { const a = Math.floor(W.rnd() * A), d = (0.15 + 0.55 * W.rnd()) * R; return { x: COS[a] * d, y: SIN[a] * d }; }
export function addSnake(W, o) {
  let p = o.at;
  for (let k = 0; !p && k < 40; k++) { // keep fresh serpents apart
    const c = spawnPoint(W, W.R);
    if (k === 39 || W.snakes.every(t => { const q = t.pts[0], dx = q.x - c.x, dy = q.y - c.y; return dx * dx + dy * dy > 320 * 320; })) p = c;
  }
  const a = wrap(atan2u(-p.y, -p.x) + A / 4 * (W.rnd() < .5 ? 1 : -1) + Math.floor((W.rnd() - .5) * 600)); // start circling, not charging the middle
  const pts = []; for (let i = 0; i < START_LEN; i++) pts.push({ x: p.x - COS[a] * i * SEG, y: p.y - SIN[a] * i * SEG });
  const s = { id: o.id, name: o.name, bot: !!o.bot, skin: o.skin || 'ember', hue: o.hue ?? Math.floor(W.rnd() * 360), a, ta: a, pts, len: START_LEN, peak: START_LEN, grow: 0, alive: true, boost: false, score: 0, kills: 0, aiT: 0, drop: 0, persona: o.persona || null, local: o.local !== false };
  W.snakes.push(s); return s;
}
export function addFood(W, x, y, v = 1, h) { const f = { id: ++W.foodSeq, x, y, v, h: h ?? Math.floor(W.rnd() * 360) }; W.food.push(f); return f; }
function topUpFood(W) { const target = Math.round(220 + W.R / 6); let tries = 0; while (W.food.length < target && tries++ < 60) { const p = spawnPoint(W, W.R / .72); addFood(W, p.x, p.y, W.rnd() < .12 ? 3 : 1); } }

// Spatial hash of body points, rebuilt each tick; used by collisions and the bots' danger sense.
const CELL = 48;
function buildGrid(W) {
  const grid = new Map();
  for (const s of W.snakes) {
    if (!s.alive) continue;
    for (let i = 0; i < s.pts.length; i += 2) { const p = s.pts[i]; const k = Math.floor(p.x / CELL) * 65536 + Math.floor(p.y / CELL); let c = grid.get(k); if (!c) grid.set(k, c = []); c.push(s, p); }
  }
  W.grid = grid;
}
// Is (x,y) within r of a body point of anyone except `self` (and self's own head region)?
export function hitAt(W, x, y, r, self, skipOwn = true) {
  const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL), reach = Math.ceil((r + 20) / CELL);
  for (let gx = cx - reach; gx <= cx + reach; gx++) for (let gy = cy - reach; gy <= cy + reach; gy++) {
    const c = W.grid.get(gx * 65536 + gy); if (!c) continue;
    for (let j = 0; j < c.length; j += 2) {
      const o = c[j]; if ((o === self && skipOwn) || !o.alive) continue;
      const p = c[j + 1], rr = r + radius(o) * .8;
      const dx = p.x - x, dy = p.y - y; if (dx * dx + dy * dy < rr * rr) { hitAt.head = p === o.pts[0] || p === o.pts[2]; return o; }
    }
  }
  return null;
}

/* ---------- movement ---------- */
function moveSnake(W, s) {
  const d = diffU(s.a, s.ta); s.a = wrap(s.a + Math.max(-TURN_U, Math.min(TURN_U, d)));
  const boosting = s.boost && s.len > 20;
  const step = (boosting ? BOOST : SPEED) * TICK;
  const head = s.pts[0], nh = { x: head.x + COS[s.a] * step, y: head.y + SIN[s.a] * step };
  // keep body points exactly SEG apart along the path
  let prev = s.pts[1];
  if (!prev) { s.pts.unshift(nh); }
  else {
    let dx = nh.x - prev.x, dy = nh.y - prev.y, dist = Math.sqrt(dx * dx + dy * dy);
    while (dist >= SEG) { const k = SEG / dist; prev = { x: prev.x + dx * k, y: prev.y + dy * k }; s.pts.splice(1, 0, prev); dx = nh.x - prev.x; dy = nh.y - prev.y; dist = Math.sqrt(dx * dx + dy * dy); }
    s.pts[0] = nh;
  }
  const keep = Math.max(2, Math.round(s.len));
  if (s.pts.length > keep) s.pts.length = keep;
  if (s.grow > 0) { const k = Math.min(s.grow, 8 * TICK * 10); s.len += k; s.grow -= k; }
  if (boosting) {
    s.len -= 6 * TICK; s.drop += TICK;
    if (s.drop > .25 && W.authority) { s.drop = 0; const t = s.pts[s.pts.length - 1]; addFood(W, t.x, t.y, 1, s.hue); }
  }
  if (s.len > s.peak) s.peak = s.len;
}
function eat(W, s) {
  const h = s.pts[0], r = radius(s) + 8, r2 = r * r;
  for (let i = W.food.length - 1; i >= 0; i--) {
    const f = W.food[i], dx = f.x - h.x, dy = f.y - h.y;
    if (dx * dx + dy * dy < r2) { s.grow += f.v * 1.4; s.score += f.v; W.food.splice(i, 1); W.events.push({ t: 'eat', s, f }); }
  }
}
export function kill(W, s, by) {
  if (!s.alive) return; s.alive = false; s.diedAt = W.time;
  if (by && by !== s) by.kills++;
  if (W.authority) for (let i = 0; i < s.pts.length; i += 3) { const p = s.pts[i]; addFood(W, p.x + (W.rnd() - .5) * 12, p.y + (W.rnd() - .5) * 12, 2, s.hue); }
  W.events.push({ t: 'dead', s, by });
}

/* ---------- bots ---------- */
const PERSONAS = [
  { name: 'greedy', look: 130, hunt: 0.15, margin: 180, boost: 0.25 },
  { name: 'hunter', look: 150, hunt: 0.9, margin: 200, boost: 0.6 },
  { name: 'careful', look: 190, hunt: 0.05, margin: 260, boost: 0.1 },
  { name: 'bold', look: 120, hunt: 0.5, margin: 160, boost: 0.45 }
];
export const personaFor = i => PERSONAS[i % PERSONAS.length];
const RAYS = [0, -260, 260, -560, 560, -900, 900, -1300, 1300];
// Distance a ray can travel before hitting a body or the zone edge (sampled every 16 units).
function rayFree(W, s, au, maxD) {
  const h = s.pts[0], r = radius(s) * .9, c = COS[au], sn = SIN[au], R2 = (W.R - 30) * (W.R - 30);
  for (let d = 16; d <= maxD; d += 16) {
    const x = h.x + c * d, y = h.y + sn * d;
    if (x * x + y * y > R2) return d * .7;           // walls count, but a bit less than bodies
    if (hitAt(W, x, y, r, s)) return d;
  }
  return maxD;
}
function think(W, s) {
  const P = s.persona || PERSONAS[0];
  const h = s.pts[0];
  // future zone: aim to stay inside where the ring will be in ~6 s
  const futureR = zoneR(W.time + 6), dc2 = h.x * h.x + h.y * h.y;
  if (dc2 > (futureR - P.margin) * (futureR - P.margin)) { s.ta = atan2u(-h.y, -h.x); s.boost = dc2 > (W.R - 60) * (W.R - 60) && s.len > 40; return; }
  // 1) danger: score steering rays, pick the clearest if the way ahead is blocked
  const ahead = rayFree(W, s, s.a, P.look * 1.6);
  if (ahead < P.look) {
    let best = s.a, bestD = -1; const bias = W.rnd() < .5 ? 1 : -1; // break left/right ties at random so two bots don't mirror each other
    for (const off of RAYS) { const au = wrap(s.a + off * bias); const d = rayFree(W, s, au, P.look * 1.6) - Math.abs(off) / 40; if (d > bestD) { bestD = d; best = au; } }
    s.ta = best; s.boost = ahead < P.look * .45 && s.len > 50 && W.rnd() < P.boost; return;
  }
  // 2) hunt: cut in front of a smaller nearby serpent's head
  if (W.rnd() < P.hunt) {
    let prey = null, pd = 380 * 380;
    for (const o of W.snakes) {
      if (o === s || !o.alive || o.len > s.len * .9) continue;
      const oh = o.pts[0], dx = oh.x - h.x, dy = oh.y - h.y, d = dx * dx + dy * dy;
      if (d < pd) { pd = d; prey = o; }
    }
    if (prey) {
      const oh = prey.pts[0], lead = 70 + Math.sqrt(pd) * .35;
      const tx = oh.x + COS[prey.a] * lead, ty = oh.y + SIN[prey.a] * lead;
      s.ta = atan2u(ty - h.y, tx - h.x); s.boost = s.len > 70 && pd < 220 * 220 && W.rnd() < P.boost; return;
    }
  }
  // 3) food: value / distance, preferring clusters (remains of dead serpents)
  let best = null, bv = 0;
  for (const f of W.food) {
    const dx = f.x - h.x, dy = f.y - h.y, d2 = dx * dx + dy * dy;
    if (d2 > 520 * 520) continue;
    const ang = Math.abs(diffU(s.a, atan2u(dy, dx)));
    const v = (f.v * f.v) / (d2 + 900) * (ang > 1400 ? .35 : 1);
    if (v > bv) { bv = v; best = f; }
  }
  if (best) { s.ta = atan2u(best.y - h.y, best.x - h.x); s.boost = best.v > 1 && s.len > 80 && W.rnd() < P.boost * .5; }
  else { s.ta = wrap(s.ta + Math.floor((W.rnd() - .5) * 400)); s.boost = false; }
}

/* ---------- one tick ---------- */
// inputs: Map(id -> {ta, boost}) for locally controlled human serpents
export function step(W, inputs) {
  if (W.phase !== 'play') return;
  W.tick++; W.time = W.tick * TICK;
  if (W.authority) W.R = zoneR(W.time);
  buildGrid(W);
  for (const s of W.snakes) {
    if (!s.alive || !s.local) continue;
    if (s.bot) { if (!W.authority) continue; if (--s.aiT <= 0) { s.aiT = 3; think(W, s); } }
    else { const inp = inputs?.get(s.id); if (inp) { s.ta = wrap(inp.ta); s.boost = !!inp.boost; } }
    moveSnake(W, s); eat(W, s);
    const h = s.pts[0];
    if (h.x * h.x + h.y * h.y > W.R * W.R) { s.len -= 40 * TICK; s.hurt = true; if (s.len < 12) kill(W, s, null); } else s.hurt = false;
  }
  buildGrid(W);
  for (const s of W.snakes) {
    if (!s.alive || !s.local || (s.bot && !W.authority)) continue;
    const h = s.pts[0], o = hitAt(W, h.x, h.y, radius(s) * .7, s);
    if (!o) continue;
    if (hitAt.head && o.alive) { // head to head: the shorter serpent loses
      if (s.len > o.len + 1) kill(W, o, s); else kill(W, s, o); // equal: the one that ran into the other loses
    } else kill(W, s, o);
  }
  if (W.authority) { topUpFood(W); checkEnd(W); }
}
export function checkEnd(W) {
  const alive = W.snakes.filter(s => s.alive);
  if ((W.snakes.length > 1 && alive.length <= 1) || W.time >= MAX_TIME) {
    const win = alive.sort((a, b) => b.len - a.len)[0] || [...W.snakes].sort((a, b) => (b.diedAt || 0) - (a.diedAt || 0))[0];
    W.phase = 'end'; W.winner = win ? win.id : null; W.events.push({ t: 'end' });
  }
}

/* ---------- solo runs: input log + replay ---------- */
// The log stores only changes: "tick:angle:boost" joined by ";".
export function encodeInputs(changes) { return changes.map(c => `${c[0]}:${c[1]}:${c[2] ? 1 : 0}`).join(';'); }
export function decodeInputs(str) { return String(str || '').split(';').filter(Boolean).map(x => { const [t, a, b] = x.split(':'); return [+t, +a, b === '1']; }); }
export const SOLO_BOTS = 9;
export function soloWorld(seed, player) {
  const W = createWorld({ seed, authority: true });
  const me = addSnake(W, { id: 'me', name: player.name || 'You', skin: player.skin, hue: 30 });
  for (let i = 0; i < SOLO_BOTS; i++) addSnake(W, { id: 'bot' + i, name: BOT_NAMES[i % BOT_NAMES.length], bot: true, skin: BOT_SKINS[i % BOT_SKINS.length], persona: personaFor(i) });
  topUpFood(W);
  return { W, me };
}
export const BOT_SKINS = ['ember', 'mint', 'royal', 'sunset', 'zebra', 'candy'];
// Replay a solo run. Stops when the player dies or the round ends. Returns the result the server ranks.
export function replaySolo(seed, inputStr, maxTicks = Math.ceil(MAX_TIME / TICK) + 2) {
  const { W, me } = soloWorld(seed, { name: 'me' });
  const changes = decodeInputs(inputStr);
  let ci = 0; const cur = { ta: me.a, boost: false }; const inputs = new Map([['me', cur]]);
  while (W.phase === 'play' && me.alive && W.tick < maxTicks) {
    while (ci < changes.length && changes[ci][0] <= W.tick) { cur.ta = changes[ci][1]; cur.boost = changes[ci][2]; ci++; }
    step(W, inputs);
    W.events.length = 0;
  }
  const ranking = [...W.snakes].sort((a, b) => (b.alive - a.alive) || ((b.diedAt ?? 1e9) - (a.diedAt ?? 1e9)) || b.len - a.len);
  return { ticks: W.tick, alive: me.alive, won: W.winner === 'me', peak: Math.round(me.peak), length: Math.round(me.len), kills: me.kills, place: me.alive ? 1 : W.snakes.filter(s => s.alive || (s.diedAt ?? -1) > me.diedAt).length + 1, score: Math.round(me.peak) + me.kills * 50 + (W.winner === 'me' ? 500 : 0) };
}
