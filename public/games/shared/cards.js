// Table shell, seats with avatars, real-looking cards and dominoes, and a win burst.
import { h } from './table.js';

const BOT_AVATAR = { Relay: 1, Diode: 2, Valve: 3, Fuse: 4, Coil: 5, Quartz: 6 };
export function avatarUrl(seat) {
  const base = (seat?.name || '').replace(' (bot)', '');
  const n = seat?.bot ? (BOT_AVATAR[base] || 1) : 7;
  return `/assets/game/avatar-${n}.webp`;
}

/* ---------- Table shell ---------- */
export function tableShell(root, { felt = 'green', mark = 'BAKHY' } = {}) {
  const top = h('div', { class: 'slot-top' }), left = h('div', { class: 'slot-left' }), right = h('div', { class: 'slot-right' });
  const feltEl = h('div', { class: 'felt' + (felt === 'red' ? ' red' : '') });
  const act = h('div', { class: 'actbar' });
  const hand = h('div', { class: 'hand', role: 'group', 'aria-label': 'Your hand' });
  const me = h('div', { class: 'me-row' });
  root.append(h('div', { class: 'ctable' }, top, left,
    h('div', { class: 'felt-table' }, feltEl), right,
    h('div', { class: 'me-area' }, act, hand, me)));
  return { top, left, right, felt: feltEl, act, hand, me, mark };
}
const narrow = () => matchMedia('(max-width: 900px)').matches;
// opponents: array of elements, ordered clockwise starting from the player after you
export function placeSeats(shell, opponents) {
  shell.top.replaceChildren(); shell.left.replaceChildren(); shell.right.replaceChildren();
  if (narrow() || opponents.length === 1) { shell.top.append(...opponents); return; }
  if (opponents.length === 2) { shell.left.append(opponents[0]); shell.right.append(opponents[1]); return; }
  shell.left.append(opponents[0]); shell.top.append(...opponents.slice(1, -1)); shell.right.append(opponents[opponents.length - 1]);
}

export function seatEl(seat, { turn = false, count = null, you = false, tag = '', fan = null, bubble = null, progress = null } = {}) {
  const av = h('span', { class: 'avatar' + (you ? ' sm' : ''), 'aria-hidden': 'true' }, h('span', { class: 'ring' }));
  av.style.backgroundImage = `url(${avatarUrl(seat)})`;
  if (progress != null) av.style.setProperty('--p', progress);
  return h('div', { class: 'seat' + (turn ? ' turn' : '') },
    bubble ? h('span', { class: 'bubble' }, bubble) : null,
    av,
    h('span', { class: 'nameplate' }, `${seat?.name || '—'}${you ? ' (you)' : ''}`, tag ? h('span', { class: 'tag' }, tag) : null, count != null ? h('span', { class: 'count' }, String(count)) : null),
    fan);
}
// kept for older callers
export function seatBadge(seat, o = {}) { return seatEl(seat, o); }

export function backs(n, max = 7) {
  const out = []; for (let i = 0; i < Math.min(n, max); i++) out.push(cardBack());
  return h('span', { class: 'fan', 'aria-label': `${n} cards` }, out);
}
export function cardBack(attrs = {}) { return h(attrs.button ? 'button' : 'span', { ...attrs, button: null, class: 'card back' + (backImg ? ' has-img' : '') + (attrs.class ? ' ' + attrs.class : ''), 'aria-hidden': attrs.button ? null : 'true' }); }
let backImg = false;
{ const img = new Image(); img.onload = () => { backImg = true; document.querySelectorAll('.card.back').forEach(c => c.classList.add('has-img')); }; img.src = '/assets/game/card-back.webp'; }

/* ---------- Standard deck faces ---------- */
const SUIT = { s: '♠', c: '♣', h: '♥', d: '♦' };
const SUIT_NAME = { s: 'spades', c: 'clubs', h: 'hearts', d: 'diamonds' };
const RANK_NAME = { J: 'jack', Q: 'queen', K: 'king', A: 'ace' };
const PIPS = {
  2: [[2, 1], [2, 7]], 3: [[2, 1], [2, 4], [2, 7]], 4: [[1, 1], [3, 1], [1, 7], [3, 7]], 5: [[1, 1], [3, 1], [2, 4], [1, 7], [3, 7]],
  6: [[1, 1], [3, 1], [1, 4], [3, 4], [1, 7], [3, 7]],
  7: [[1, 1], [3, 1], [2, 2], [1, 4], [3, 4], [1, 7], [3, 7]],
  8: [[1, 1], [3, 1], [2, 2], [1, 4], [3, 4], [2, 6], [1, 7], [3, 7]],
  9: [[1, 1], [3, 1], [1, 3], [3, 3], [2, 4], [1, 5], [3, 5], [1, 7], [3, 7]],
  10: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3], [1, 5], [3, 5], [2, 6], [1, 7], [3, 7]]
};
export function stdCard(c, o = {}) {
  const red = c.s === 'h' || c.s === 'd', s = SUIT[c.s] + '︎';
  let body;
  if (c.r === 'A') body = h('span', { class: 'ace' }, s);
  else if ('JQK'.includes(c.r)) body = h('span', { class: 'court' }, h('i', {}, s), h('b', {}, c.r), h('i', {}, s));
  else body = h('span', { class: 'pips' }, PIPS[+c.r].map(([x, y]) => { const el = h('span', { class: y > 4 ? 'flip' : '' }, s); el.style.gridColumn = x; el.style.gridRow = y; return el; }));
  return h(o.button ? 'button' : 'span', {
    class: `card${red ? ' red' : ''}${o.cls ? ' ' + o.cls : ''}`, 'data-k': o.key || 'k' + c.id, type: o.button ? 'button' : null, disabled: o.disabled, onclick: o.onclick,
    'aria-label': `${RANK_NAME[c.r] || c.r} of ${SUIT_NAME[c.s]}${o.note ? ', ' + o.note : ''}`
  }, h('span', { class: 'ix' }, c.r, h('small', {}, s)), body, h('span', { class: 'ix b' }, c.r, h('small', {}, s)));
}

/* ---------- Hand arc ---------- */
export function arc(hand, n) {
  const kids = [...hand.children], mid = (kids.length - 1) / 2, spread = Math.min(4, 40 / Math.max(1, kids.length));
  kids.forEach((el, i) => { const d = i - mid; el.style.setProperty('--r', (d * spread).toFixed(2) + 'deg'); el.style.setProperty('--y', (Math.abs(d) ** 1.6 * 1.6).toFixed(1) + 'px'); });
  // overlap cards just enough to fit the space; never below a ~22px tappable slice (then the row scrolls)
  const cw = kids[0]?.offsetWidth || 80, avail = Math.max(120, hand.clientWidth - 32);
  let ov = n > 1 ? (avail - cw) / ((n - 1) * cw) - 1 : 0;
  ov = Math.max(Math.min(ov, -.22), Math.max(-.8, 22 / cw - 1));
  hand.style.setProperty('--ov', ov.toFixed(3));
  if (!hand._arcRO) { hand._arcRO = new ResizeObserver(() => arc(hand, hand.children.length)); hand._arcRO.observe(hand); }
}

/* ---------- Dominoes ---------- */
const DPIPS = { 0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
function half(n, vertical) {
  const cells = []; const on = new Set(DPIPS[n]);
  for (let i = 0; i < 9; i++) {
    const idx = !vertical && n === 6 ? [0, 3, 6, 1, 4, 7, 2, 5, 8][i] : i;
    cells.push(h('span', { class: on.has(idx) ? 'pip on' : 'pip' }));
  }
  return h('span', { class: 'half' }, cells);
}
export function tile(a, b, { vertical = false, button = false, attrs = {} } = {}) {
  return h(button ? 'button' : 'span', { ...attrs, class: 'tile' + (vertical ? ' v' : '') + (attrs.class ? ' ' + attrs.class : ''), ...(button ? { type: 'button' } : {}), 'aria-label': attrs['aria-label'] || `${a}-${b} tile` }, half(a, vertical), half(b, vertical));
}
export function tileBacks(n, max = 7) {
  const out = []; for (let i = 0; i < Math.min(n, max); i++) out.push(h('span', { class: 'tile small v back', 'aria-hidden': 'true' }));
  return h('span', { class: 'fan tiles', 'aria-label': `${n} tiles` }, out);
}
export function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* ---------- Confetti ---------- */
export function confetti(ms = 2600) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = h('canvas', { class: 'confetti', 'aria-hidden': 'true' }); document.body.append(c);
  const dpr = Math.min(2, devicePixelRatio || 1); c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
  const cols = ['#ffd36a', '#e8b54a', '#ff6a55', '#7fd1ff', '#9dff90', '#fff7e3'];
  const P = Array.from({ length: 160 }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .45, vx: (Math.random() - .5) * 14, vy: -Math.random() * 15 - 5, r: Math.random() * 6.28, vr: (Math.random() - .5) * .3, w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, c: cols[Math.floor(Math.random() * cols.length)] }));
  const t0 = performance.now();
  const step = t => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of P) { p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); }
    if (t - t0 < ms) requestAnimationFrame(step); else c.remove();
  };
  requestAnimationFrame(step);
}
