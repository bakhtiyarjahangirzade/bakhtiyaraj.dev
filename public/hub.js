// BAKHY Workbench hub: channel filter keys, marquee, rack meters and the live amber mini screens.
import { pressFeedback } from '/assets/sound.js';
import { mountAccount } from '/assets/account-ui.js';
mountAccount(document.getElementById('headnav'));

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- Meters ---------- */
const modules = $$('.module');
const live = modules.filter(m => !m.classList.contains('is-bench')).length;
$('#m-total').textContent = String(modules.length).padStart(2, '0');
$('#m-live').textContent = String(live).padStart(2, '0');
$('#m-bench').textContent = String(modules.length - live).padStart(2, '0');

/* ---------- Filter keys ---------- */
const keys = $$('#filters .key');
const valid = keys.map(k => k.dataset.filter);
function applyFilter(f, animate) {
  let n = 0;
  for (const m of modules) {
    const show = f === 'all' || m.dataset.kind === f;
    m.hidden = !show;
    if (show) {
      n++;
      if (animate && !reduced) { m.classList.remove('is-entering'); void m.offsetWidth; m.style.animationDelay = (n * 45) + 'ms'; m.classList.add('is-entering'); }
    }
  }
  for (const k of keys) {
    const on = k.dataset.filter === f, was = k.getAttribute('aria-checked') === 'true';
    k.classList.remove('is-latching', 'is-popping');
    if (animate) { void k.offsetWidth; if (on && !was) k.classList.add('is-latching'); if (!on && was) k.classList.add('is-popping'); }
    k.setAttribute('aria-checked', on);
    k.tabIndex = on ? 0 : -1;
  }
  $('#filter-status').textContent = `${n} module${n === 1 ? '' : 's'} shown`;
  dispatchEvent(new Event('rack-filter'));
}
keys.forEach((k, i) => {
  k.addEventListener('animationend', () => k.classList.remove('is-latching', 'is-popping'));
  k.addEventListener('click', () => select(k.dataset.filter));
  k.addEventListener('keydown', e => {
    const d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = keys[(i + d + keys.length) % keys.length]; n.focus(); select(n.dataset.filter);
  });
});
function select(f) {
  pressFeedback();
  applyFilter(f, true);
  const url = new URL(location.href);
  if (f === 'all') url.searchParams.delete('category'); else url.searchParams.set('category', f);
  history.pushState({ f }, '', url);
}
function fromUrl() { const c = new URL(location.href).searchParams.get('category'); return valid.includes(c) ? c : 'all'; }
addEventListener('popstate', () => applyFilter(fromUrl(), true));
applyFilter(fromUrl(), false);

$$('a.key, .jack').forEach(a => a.addEventListener('pointerdown', () => pressFeedback()));

/* ---------- Marquee ---------- */
const lines = ['LESS FRICTION. MORE USEFUL SH*T.', 'FREE. OPEN SOURCE. NO ACCOUNTS.', 'PLAY ONLINE WITH A ROOM CODE.', 'BUILD. SHIP. REPEAT.'];
const textEl = $('#marquee-text');
const chEl = $('#marquee-ch');
function setLine(s, withCursor) {
  textEl.textContent = s;
  if (withCursor) { const c = document.createElement('span'); c.className = 'cursor'; c.setAttribute('aria-hidden', 'true'); textEl.append(c); }
}
if (!reduced) {
  let li = 0;
  const type = async () => {
    const s = lines[li % lines.length];
    chEl.textContent = 'CH 0' + ((li % lines.length) + 1);
    for (let i = 0; i <= s.length; i++) { setLine(s.slice(0, i), true); await wait(i === 0 ? 120 : 38 + Math.random() * 40); }
    await wait(3600);
    for (let i = s.length; i >= 0; i -= 2) { setLine(s.slice(0, i), true); await wait(14); }
    li++; type();
  };
  type();
}
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
const clockEl = $('#clock-face');
const tickClock = () => { const d = new Date(); clockEl.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
tickClock(); setInterval(tickClock, 10000);

/* ---------- Mini screens ---------- */
const AMBER = '255,181,63';
const glow = (ctx, a = 1) => { ctx.shadowColor = `rgba(255,160,40,${0.7 * a})`; ctx.shadowBlur = 8; };
const col = a => `rgba(${AMBER},${a})`;

const screens = {
  authentic(ctx, w, h, t) {
    glow(ctx, .6); const x0 = 14, lines = 6, lh = (h - 28) / lines, scan = (t * .5) % 1;
    for (let i = 0; i < lines; i++) { const y = 16 + i * lh, len = (w * .5) * (i % 3 === 2 ? .6 : 1), hot = i === 2 || i === 3;
      ctx.fillStyle = col(hot ? .85 : .3); ctx.fillRect(x0, y, len, Math.max(3, lh * .32)); }
    ctx.fillStyle = col(.9); ctx.fillRect(x0 - 4, 12 + scan * (h - 24), w * .5 + 8, 1.5);
    const pct = 30 + Math.round(40 * (0.5 + 0.5 * Math.sin(t * .7)));
    ctx.font = `400 ${h * .32}px Segment, monospace`; ctx.textAlign = 'right'; ctx.fillStyle = col(1); ctx.fillText(String(pct).padStart(2, '0'), w - 26, h * .62);
    ctx.font = '500 11px Controls'; ctx.fillText('%', w - 12, h * .62); ctx.textAlign = 'left'; ctx.fillStyle = col(.7); ctx.fillText('AI SHARE · 98%', w * .62, 18);
  },
  blackjack(ctx, w, h, t) {
    glow(ctx); const cw = h * .38, ch = h * .54, n = 2 + Math.floor(t / 1.2) % 3;
    for (let i = 0; i < n; i++) { ctx.save(); ctx.translate(w * .32 + i * cw * .5, h * .55); ctx.rotate((i - 1) * .08); card(ctx, cw, ch, ['A', 'K', '7', '3'][i], 1, i % 2 ? '♥' : '♠'); ctx.restore(); }
    ctx.font = `400 ${h * .32}px Segment, monospace`; ctx.fillStyle = col(1); ctx.textAlign = 'right'; ctx.fillText(n === 2 ? '21' : n === 3 ? '28' : '31', w - 14, h * .62);
    ctx.font = '500 11px Controls'; ctx.textAlign = 'left'; ctx.fillStyle = col(.7); ctx.fillText(n === 2 ? 'BLACKJACK' : 'BUST', 12, 18);
  },
  roulette(ctx, w, h, t) {
    const R = h * .42, cx = w * .4, cy = h / 2, a = t * 1.2; glow(ctx, .5);
    for (let i = 0; i < 37; i++) { const a0 = a + i * Math.PI * 2 / 37; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a0 + Math.PI * 2 / 37); ctx.closePath(); ctx.fillStyle = col(i === 0 ? .9 : i % 2 ? .45 : .12); ctx.fill(); }
    ctx.fillStyle = 'rgba(20,12,4,1)'; ctx.beginPath(); ctx.arc(cx, cy, R * .55, 0, 7); ctx.fill();
    const b = -t * 2.4; ctx.fillStyle = col(1); ctx.beginPath(); ctx.arc(cx + Math.cos(b) * R * .8, cy + Math.sin(b) * R * .8, 4, 0, 7); ctx.fill();
    ctx.font = `400 ${h * .3}px Segment, monospace`; ctx.textAlign = 'right'; ctx.fillText(String([17, 32, 0, 23][Math.floor(t / 2) % 4]).padStart(2, '0'), w - 12, h * .62);
  },
  poker(ctx, w, h, t) {
    glow(ctx); const cw = h * .32, ch = h * .46, shown = 3 + Math.floor(t / 1.4) % 3;
    for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(w * .14 + i * (cw + 6), h * .52); card(ctx, cw, ch, i < shown ? ['A', 'A', 'K', 'Q', 'A'][i] : '', i < shown ? 1 : .25, i < shown ? '♠♥♣♦♠'[i] : ''); ctx.restore(); }
    ctx.font = '500 11px Controls'; ctx.textAlign = 'left'; ctx.fillStyle = col(.75); ctx.fillText(shown === 5 ? 'THREE OF A KIND' : 'POT 1,240', 12, 18);
  },
  slots(ctx, w, h, t) {
    const syms = ['7', '★', '◆', 'BAR', '♣', '7']; const cw = w / 3.6; glow(ctx);
    for (let r = 0; r < 3; r++) { const x = w * .1 + r * (cw + 6); ctx.strokeStyle = col(.6); ctx.strokeRect(x, 10, cw, h - 20); const off = (t * (6 - r) * 60) % 60; const spinning = (t % 4) < 1.5 + r * .4;
      ctx.save(); ctx.beginPath(); ctx.rect(x, 10, cw, h - 20); ctx.clip(); ctx.textAlign = 'center'; ctx.font = `600 ${h * .3}px Wordmark, serif`; ctx.fillStyle = col(1);
      for (let k = -1; k < 3; k++) ctx.fillText(spinning ? syms[(k + Math.floor(t * 8) + r) % syms.length] : (k === 1 ? '7' : syms[(k + r + 2) % syms.length]), x + cw / 2, (spinning ? off : 0) + k * h * .36 + h * .2);
      ctx.restore(); }
  },
  kervan(ctx, w, h, t) {
    const r = Math.max(7, Math.min(w, h) / 9), dx = r * Math.sqrt(3), dy = r * 1.5;
    const cols = Math.ceil(w / dx) + 1, rows = Math.ceil(h / dy) + 1;
    ctx.lineWidth = 1;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const cx = x * dx + (y & 1) * dx / 2, cy = y * dy, land = Math.sin(x * 1.3 + y * 0.7) + Math.cos(x * 0.6 - y * 1.1) > -0.2;
      ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 180 * (60 * k - 30); ctx[k ? 'lineTo' : 'moveTo'](cx + r * .92 * Math.cos(a), cy + r * .92 * Math.sin(a)); } ctx.closePath();
      ctx.fillStyle = land ? col(.12) : col(.02); ctx.fill(); ctx.strokeStyle = col(land ? .35 : .12); ctx.stroke();
    }
    const pts = [[.15, .7], [.35, .4], [.6, .55], [.85, .3]];
    glow(ctx); ctx.strokeStyle = col(.6); ctx.setLineDash([3, 4]); ctx.beginPath(); pts.forEach(([px, py], i) => ctx[i ? 'lineTo' : 'moveTo'](px * w, py * h)); ctx.stroke(); ctx.setLineDash([]);
    pts.forEach(([px, py]) => { ctx.fillStyle = col(.9); ctx.fillRect(px * w - 4, py * h - 4, 8, 8); });
    const u = (t * .12) % 1 * (pts.length - 1), i = Math.floor(u), f = u - i, a0 = pts[i], a1 = pts[i + 1];
    ctx.fillStyle = col(1); ctx.beginPath(); ctx.arc((a0[0] + (a1[0] - a0[0]) * f) * w, (a0[1] + (a1[1] - a0[1]) * f) * h, 3.5, 0, 7); ctx.fill();
  },
  serpent(ctx, w, h, t) {
    glow(ctx); for (let s = 0; s < 3; s++) for (let k = 0; k < 26; k++) { const tt = t * .9 + s * 2.1 - k * .05; const x = w / 2 + Math.cos(tt) * w * (.3 - s * .06), y = h / 2 + Math.sin(tt * 1.6) * h * (.32 - s * .05); ctx.fillStyle = col(1 - k / 26); ctx.beginPath(); ctx.arc(x, y, 5 - k * .12, 0, 7); ctx.fill(); }
    const R = Math.max(12, h * .48 - (t % 6) * 6); ctx.strokeStyle = col(.5); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(w / 2, h / 2, R * 1.8, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  },
  chess(ctx, w, h, t) {
    const s = Math.min(w, h) - 18, x0 = (w - s) / 2, y0 = (h - s) / 2, c = s / 8;
    for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
      ctx.fillStyle = (r + f) % 2 ? col(.16) : col(.04); ctx.fillRect(x0 + f * c, y0 + r * c, c, c);
    }
    ctx.strokeStyle = col(.5); ctx.lineWidth = 1; ctx.strokeRect(x0 + .5, y0 + .5, s - 1, s - 1);
    const back = 'RNBQKBNR';
    const pieces = [];
    for (let f = 0; f < 8; f++) { pieces.push([back[f], f, 0, 1], ['P', f, 1, 1], ['P', f, 6, 0], [back[f], f, 7, 0]); }
    const moves = [[4, 6, 4, 4], [4, 1, 4, 3], [6, 7, 5, 5], [1, 0, 2, 2], [5, 7, 2, 4], [6, 0, 5, 2], [3, 6, 3, 5], [5, 0, 2, 3]];
    const step = 1.3, cyc = moves.length * step + 2, tt = t % cyc, k = Math.min(moves.length, Math.floor(tt / step)), p = Math.min(1, (tt % step) / .45);
    for (let i = 0; i <= Math.min(k, moves.length - 1); i++) {
      const [fx, fy, tx, ty] = moves[i]; const pc = pieces.find(q => q[1] === fx && q[2] === fy); if (!pc) continue;
      const e = i < k ? 1 : p; pc[1] = fx + (tx - fx) * e; pc[2] = fy + (ty - fy) * e;
      if (i === k && k < moves.length) { ctx.strokeStyle = col(.7); ctx.strokeRect(x0 + tx * c + 1.5, y0 + ty * c + 1.5, c - 3, c - 3); }
    }
    ctx.font = `600 ${c * .62}px Wordmark, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; glow(ctx);
    for (const [n, f, r, black] of pieces) {
      ctx.fillStyle = black ? col(.55) : col(1);
      ctx.fillText(n === 'P' ? '•' : n, x0 + f * c + c / 2, y0 + r * c + c / 2 + 1);
    }
  },
  lastone(ctx, w, h, t) {
    const cw = h * .42, ch = h * .64, cx = w / 2, cy = h / 2 + 6;
    const vals = ['7', '7', 'R', '+2', '3', 'W'];
    const n = Math.floor(t / 1.1) % vals.length;
    glow(ctx);
    for (let i = -2; i <= 2; i++) {
      ctx.save(); ctx.translate(cx + i * cw * .52, cy + Math.abs(i) * 6); ctx.rotate(i * .16);
      card(ctx, cw, ch, vals[(n + i + 6) % vals.length], i === 0 ? 1 : .45); ctx.restore();
    }
    if (n % 3 === 2) { ctx.font = `600 ${h * .14}px Wordmark`; ctx.fillStyle = col(1); ctx.textAlign = 'left'; ctx.fillText('LAST!', 12, 22); }
  },
  durak(ctx, w, h, t) {
    const cw = h * .4, ch = h * .6; glow(ctx);
    ctx.save(); ctx.translate(w * .22, h * .52); ctx.rotate(-1.57); card(ctx, cw, ch, '', .3, '◆'); ctx.restore();
    const ph = (t % 4) / 4;
    ctx.save(); ctx.translate(w * .55, h * .5); card(ctx, cw, ch, '9', .6, '♣'); ctx.restore();
    const lift = ph < .5 ? 1 - ph * 2 : 0;
    ctx.save(); ctx.translate(w * .55 + 14, h * .5 + 10 - lift * 40); ctx.rotate(.18); ctx.globalAlpha = 1 - lift * .6; card(ctx, cw, ch, 'K', 1, '♣'); ctx.restore();
    ctx.font = `500 11px Controls`; ctx.fillStyle = col(.7); ctx.textAlign = 'left'; ctx.fillText('TRUMP ◆', 10, 18); ctx.fillText(ph < .5 ? 'DEFEND' : 'BEATEN', w - 70, 18);
  },
  domino(ctx, w, h, t) {
    const tw = h * .26, th = tw * 2, n = 1 + Math.floor(t / .9) % 7; glow(ctx);
    const chain = [[6, 6], [6, 3], [3, 1], [1, 5], [5, 5], [5, 2], [2, 4]];
    const total = n * (th + 4), x = (w - total) / 2;
    for (let i = 0; i < n; i++) {
      const [a, b] = chain[i], dbl = a === b, px = x + i * (th + 4);
      if (dbl) tile(ctx, px + th / 2 - tw / 2, h / 2 - th / 2, tw, th, a, b, true);
      else tile(ctx, px, h / 2 - tw / 2, th, tw, a, b, false);
    }
  },
  focus(ctx, w, h, t) {
    const left = 25 * 60 - Math.floor(t) % (25 * 60), m = Math.floor(left / 60), s = left % 60;
    ctx.font = `400 ${h * .48}px Segment, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = col(.07); ctx.fillText('88:88', w / 2, h / 2 - 4);
    glow(ctx); ctx.fillStyle = col(1);
    ctx.fillText(`${String(m).padStart(2, '0')}${t % 1 < .5 ? ':' : ' '}${String(s).padStart(2, '0')}`, w / 2, h / 2 - 4);
    ctx.fillStyle = col(.8); ctx.fillRect(10, h - 10, (w - 20) * ((25 * 60 - left) / 1500 + .02), 2);
  },
  preview(ctx, w, h, t) {
    glow(ctx, .6); ctx.strokeStyle = col(.8); ctx.lineWidth = 1.4;
    const rows = ['report.psd', 'model.stl', 'notes.md', 'clip.webm'];
    const sel = Math.floor(t / 1.6) % rows.length;
    ctx.font = '500 12px Controls'; ctx.textAlign = 'left';
    rows.forEach((r, i) => {
      const y = 22 + i * 26;
      if (i === sel) { ctx.fillStyle = col(.18); ctx.fillRect(8, y - 14, w * .42, 22); }
      ctx.fillStyle = col(i === sel ? 1 : .55); ctx.fillText(r.toUpperCase(), 16, y);
    });
    const px = w * .5, pw = w * .46;
    ctx.strokeRect(px, 10, pw, h - 20);
    const shapes = [() => { ctx.fillStyle = col(.5); ctx.fillRect(px + 12, 22, pw - 24, h - 56); }, () => { ctx.beginPath(); ctx.moveTo(px + pw / 2, 22); ctx.lineTo(px + pw - 16, h - 30); ctx.lineTo(px + 16, h - 30); ctx.closePath(); ctx.stroke(); }, () => { for (let i = 0; i < 5; i++) { ctx.fillStyle = col(.6); ctx.fillRect(px + 12, 24 + i * 18, (pw - 24) * (i % 2 ? .6 : .9), 4); } }, () => { ctx.beginPath(); ctx.moveTo(px + pw / 2 - 10, h / 2 - 14); ctx.lineTo(px + pw / 2 + 14, h / 2); ctx.lineTo(px + pw / 2 - 10, h / 2 + 14); ctx.closePath(); ctx.fillStyle = col(.9); ctx.fill(); }];
    shapes[sel]();
  },
  picker(ctx, w, h, t) {
    for (let i = 0; i < 12; i++) for (let j = 0; j < 6; j++) { ctx.fillStyle = col(.05 + ((i * 7 + j * 3) % 10) / 14); ctx.fillRect(i * w / 12, j * (h - 26) / 6, w / 12 - 1, (h - 26) / 6 - 1); }
    const x = w / 2 + Math.cos(t * .7) * w * .32, y = (h - 26) / 2 + Math.sin(t * 1.1) * (h - 26) * .3;
    glow(ctx); ctx.strokeStyle = col(1); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.moveTo(x - 18, y); ctx.lineTo(x - 6, y); ctx.moveTo(x + 6, y); ctx.lineTo(x + 18, y); ctx.moveTo(x, y - 18); ctx.lineTo(x, y - 6); ctx.moveTo(x, y + 6); ctx.lineTo(x, y + 18); ctx.stroke();
    const v = Math.round(((Math.sin(t) + 1) / 2) * 200 + 40);
    ctx.font = '400 15px Segment, monospace'; ctx.fillStyle = col(1); ctx.textAlign = 'left';
    ctx.fillText('#' + [v, Math.round(v * .7), Math.round(v * .25)].map(n => n.toString(16).padStart(2, '0')).join('').toUpperCase(), 10, h - 8);
  },
  colorplus(ctx, w, h, t) {
    glow(ctx, .5); ctx.strokeStyle = col(.9); ctx.lineWidth = 1.5;
    const fw = w * .42, fh = h - 24, fx = 12, fy = 12, L = 12;
    [[fx, fy, 1, 1], [fx + fw, fy, -1, 1], [fx, fy + fh, 1, -1], [fx + fw, fy + fh, -1, -1]].forEach(([x, y, a, b]) => { ctx.beginPath(); ctx.moveTo(x + a * L, y); ctx.lineTo(x, y); ctx.lineTo(x, y + b * L); ctx.stroke(); });
    ctx.beginPath(); ctx.arc(fx + fw / 2, fy + fh / 2, fh * .28, 0, 7); ctx.stroke();
    const shots = Math.floor(t / 2) % 3, ph = (t % 2) / 2;
    const tones = [[.95, .7, .45, .25, .1], [.3, .55, .8, .6, .2], [.15, .4, .9, .7, .5]][shots];
    tones.forEach((a, i) => { const bw = (w * .45) / 5; const grow = Math.min(1, ph * 3 - i * .3); if (grow <= 0) return; ctx.fillStyle = col(a); ctx.fillRect(w * .52 + i * bw, fy + fh * (1 - grow), bw - 4, fh * grow); });
  },
  filter(ctx, w, h, t) {
    const words = ['GPU RTX 4070', 'SPONSORED AD', 'MECH KEYBOARD', 'SPONSORED AD', 'USB-C HUB'];
    const ph = (t % 4) / 4; ctx.font = '500 12px Controls'; ctx.textAlign = 'left';
    words.forEach((wd, i) => {
      const y = 14 + i * ((h - 20) / 5), bad = wd.startsWith('SPONSORED');
      const fade = bad ? Math.max(0, 1 - Math.max(0, ph - .35) * 4) : 1;
      ctx.fillStyle = col(.1 * fade + .02); ctx.fillRect(10, y, w - 20, (h - 20) / 5 - 5);
      ctx.fillStyle = col(.9 * fade + (bad ? .08 : 0)); glow(ctx, fade); ctx.fillText(wd, 18, y + 15);
      if (bad && ph > .2) { ctx.strokeStyle = col(.9); ctx.beginPath(); ctx.moveTo(14, y + 11); ctx.lineTo(14 + (w - 28) * Math.min(1, (ph - .2) * 5), y + 11); ctx.stroke(); }
    });
  }
};
function card(ctx, cw, ch, v, a, suit) {
  ctx.fillStyle = 'rgba(20,12,4,.9)'; roundRect(ctx, -cw / 2, -ch / 2, cw, ch, 5); ctx.fill();
  ctx.strokeStyle = col(a); ctx.lineWidth = 1.4; roundRect(ctx, -cw / 2, -ch / 2, cw, ch, 5); ctx.stroke();
  ctx.fillStyle = col(a); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (suit && !v) { ctx.font = `${ch * .4}px serif`; ctx.fillText(suit, 0, 0); return; }
  ctx.font = `600 ${ch * .36}px Wordmark, sans-serif`; ctx.fillText(v, 0, 0);
  if (suit) { ctx.font = `${ch * .16}px serif`; ctx.fillText(suit, -cw / 2 + 9, -ch / 2 + 11); }
}
function tile(ctx, x, y, w, h, a, b, vert) {
  ctx.fillStyle = 'rgba(20,12,4,.9)'; roundRect(ctx, x, y, w, h, 4); ctx.fill();
  ctx.strokeStyle = col(.9); ctx.lineWidth = 1.3; roundRect(ctx, x, y, w, h, 4); ctx.stroke();
  ctx.beginPath(); if (vert) { ctx.moveTo(x + 4, y + h / 2); ctx.lineTo(x + w - 4, y + h / 2); } else { ctx.moveTo(x + w / 2, y + 4); ctx.lineTo(x + w / 2, y + h - 4); } ctx.stroke();
  const half = vert ? [[x, y, w, h / 2], [x, y + h / 2, w, h / 2]] : [[x, y, w / 2, h], [x + w / 2, y, w / 2, h]];
  [a, b].forEach((n, i) => pips(ctx, ...half[i], n));
}
const PIP = { 0: [], 1: [[.5, .5]], 2: [[.28, .28], [.72, .72]], 3: [[.25, .25], [.5, .5], [.75, .75]], 4: [[.28, .28], [.72, .28], [.28, .72], [.72, .72]], 5: [[.25, .25], [.75, .25], [.5, .5], [.25, .75], [.75, .75]], 6: [[.28, .22], [.72, .22], [.28, .5], [.72, .5], [.28, .78], [.72, .78]] };
function pips(ctx, x, y, w, h, n) { ctx.fillStyle = col(1); const r = Math.min(w, h) * .09; for (const [px, py] of PIP[n]) { ctx.beginPath(); ctx.arc(x + px * w, y + py * h, r, 0, 7); ctx.fill(); } }
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

const active = new Set();
const minis = modules.map(m => ({ m, canvas: $('canvas', m), draw: screens[m.dataset.screen], t0: Math.random() * 10 }));
function size(s) {
  const r = s.canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
  s.w = r.width; s.h = r.height; s.canvas.width = Math.max(1, r.width * dpr); s.canvas.height = Math.max(1, r.height * dpr);
  s.ctx = s.canvas.getContext('2d'); s.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function paint(s, t) { const { ctx, w, h } = s; if (!ctx || !w) return; ctx.save(); ctx.clearRect(0, 0, w, h); s.draw(ctx, w, h, t + s.t0); ctx.restore(); }
document.fonts.ready.then(() => {
  minis.forEach(s => { size(s); paint(s, 2); });
  if (reduced) return;
  const io = new IntersectionObserver(es => es.forEach(e => { const s = minis.find(q => q.canvas === e.target); e.isIntersecting ? active.add(s) : active.delete(s); }));
  minis.forEach(s => io.observe(s.canvas));
  const loop = now => { const t = now / 1000; active.forEach(s => paint(s, t)); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
});
addEventListener('rack-filter', () => requestAnimationFrame(() => minis.forEach(s => { if (!s.m.hidden) { size(s); paint(s, performance.now() / 1000); } })));
addEventListener('resize', () => minis.forEach(s => { size(s); paint(s, performance.now() / 1000); }));
