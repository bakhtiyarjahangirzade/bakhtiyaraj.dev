import { SYMBOLS } from './symbols.js';
import { MACHINES, spin } from './machines.js';
import { api } from '/games/shared/net.js';
import * as acc from '/assets/account.js';
import { mountAccount } from '/assets/account-ui.js';
import { pressFeedback, soundOn, setSound } from '/assets/sound.js';
import { confetti } from '/games/shared/cards.js';

const $ = s => document.querySelector(s);
const el = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v); } for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k)); return e; };
const fmt = n => Math.floor(n).toLocaleString('en-US');
const sym = id => { const s = el('span', { class: 'sym s-' + id, 'aria-label': id }); s.innerHTML = SYMBOLS[id]; return s; };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

mountAccount($('#acc'));
acc.init();

let m = MACHINES[0], lineBet = 1, busy = false, free = 0, auto = 0, grid = null;
const tabs = $('#machines');
MACHINES.forEach(mc => tabs.append(el('button', { class: 'key', role: 'radio', type: 'button', 'aria-checked': String(mc === m), 'data-id': mc.id, onclick: () => { if (busy) return; pressFeedback(); m = mc; lineBet = mc.bets[0]; free = 0; auto = 0; build(); paintSeeds(); } }, el('span', { class: 'led' }), mc.name)));

const cab = $('#cabinet');
function build() {
  tabs.querySelectorAll('.key').forEach(k => k.setAttribute('aria-checked', String(k.dataset.id === m.id)));
  cab.className = 'cabinet t-' + m.theme;
  grid = spin(m);
  const reels = el('div', { class: 'reels', style: null });
  reels.style.setProperty('--cols', m.reels); reels.style.setProperty('--rows', m.rows);
  grid.forEach((col, r) => reels.append(el('div', { class: 'reel' }, el('div', { class: 'strip' }, col.map(sym)))));
  const lines = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  lines.setAttribute('class', 'lines'); lines.setAttribute('viewBox', `0 0 ${m.reels * 100} ${m.rows * 100}`); lines.setAttribute('preserveAspectRatio', 'none'); lines.setAttribute('aria-hidden', 'true');
  cab.replaceChildren(
    el('div', { class: 'marquee' }, el('div', { class: 'bulbs', 'aria-hidden': 'true' }, Array.from({ length: 22 }, () => el('i'))), el('h2', {}, m.name), el('p', {}, m.tag)),
    el('div', { class: 'window' }, reels, lines),
    el('div', { class: 'panel' },
      el('div', { class: 'meter' }, el('span', {}, 'Win'), el('b', { id: 'win' }, '0')),
      el('div', { class: 'meter' }, el('span', {}, 'Lines'), el('b', {}, String(m.lines.length))),
      el('div', { class: 'meter bet' }, el('span', {}, 'Bet / line'), el('div', { class: 'stepper' }, el('button', { type: 'button', 'aria-label': 'Lower bet', onclick: () => step(-1) }, '−'), el('b', { id: 'lb' }, String(lineBet)), el('button', { type: 'button', 'aria-label': 'Raise bet', onclick: () => step(1) }, '+'))),
      el('div', { class: 'meter' }, el('span', {}, 'Total bet'), el('b', { id: 'tb' }, fmt(lineBet * m.lines.length))),
      el('div', { class: 'meter free', hidden: true, id: 'freebox' }, el('span', {}, 'Free spins'), el('b', { id: 'free' }, '0')),
      el('button', { class: 'auto key', type: 'button', id: 'auto', 'aria-pressed': 'false', onclick: () => { auto = auto ? 0 : 10; paintAuto(); if (auto && !busy) go(); } }, 'Auto ×10'),
      el('button', { class: 'spin', type: 'button', id: 'spin', onclick: () => go() }, el('span', {}, 'SPIN'))),
    el('details', { class: 'paytable' }, el('summary', {}, 'Paytable'), el('div', { class: 'pt-grid' }, m.symbols.filter(s => Object.keys(s[2]).length || s[0] === m.scatter).map(([id, , pays]) => el('div', { class: 'pt' }, sym(id), el('span', {}, id === m.scatter ? '3+ anywhere = free spins' : Object.entries(pays).sort((a, b) => b[0] - a[0]).map(([n, x]) => `${n}× ${Math.round(x * (m.scale || 1))}`).join(' · ')), id === m.wild ? el('em', {}, 'Wild') : null)))));
}
function step(d) { if (busy) return; const i = Math.max(0, Math.min(m.bets.length - 1, m.bets.indexOf(lineBet) + d)); lineBet = m.bets[i]; $('#lb').textContent = lineBet; $('#tb').textContent = fmt(lineBet * m.lines.length); pressFeedback(); }

let ac;
function tick(f = 900, d = .03, v = .05) { if (!soundOn()) return; const A = window.AudioContext || window.webkitAudioContext; if (!A) return; ac ||= new A(); const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.type = 'square'; o.frequency.value = f; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + .02); }
function jingle(big) { [523, 659, 784, 1047, big ? 1319 : 0].filter(Boolean).forEach((f, i) => setTimeout(() => tick(f, .18, .07), i * 110)); }

async function go() {
  if (busy) return;
  busy = true; $('#spin').disabled = true; clearWins();
  pressFeedback();
  let r;
  try {
    await acc.ensurePlayer();
    r = await api('spin', { machine: m.id, lineBet }); // the server picks the symbols and moves the chips
  } catch (e) {
    busy = false; $('#spin').disabled = false; auto = 0; paintAuto();
    $('#win').textContent = '0'; showMsg(e.message);
    if (e.needLogin) document.querySelector('.acc-plate')?.click();
    return;
  }
  const res = r.result;
  acc.setKnownBalance(r.balance - res.total);
  seeds = r.seeds; paintSeeds();
  await animate(res.grid);
  grid = res.grid;
  free = res.freeLeft;
  $('#freebox').hidden = !free; $('#free').textContent = free;
  if (res.total) {
    acc.setKnownBalance(r.balance);
    showWins(res);
    countUp($('#win'), res.total);
    const big = res.total >= res.lineBet * m.lines.length * 10; jingle(big); if (big) confetti(2200);
  } else $('#win').textContent = '0';
  busy = false; $('#spin').disabled = false;
  if (free > 0 || auto > 0) { if (!free) auto--; if (auto === 0) paintAuto(); setTimeout(() => (free > 0 || auto > 0) && go(), res.total ? 1400 : 500); }
}
function paintAuto() { const a = $('#auto'); if (!a) return; a.setAttribute('aria-pressed', String(!!auto)); a.textContent = auto ? 'Stop auto' : 'Auto ×10'; }

/* ---------- Fair play: seed commitment, client seed, reveal ---------- */
let seeds = null;
function paintSeeds() {
  const box = $('#fair'); if (!box || !seeds) return;
  box.querySelector('[data-k=commit]').textContent = seeds.commit;
  box.querySelector('[data-k=nonce]').textContent = seeds.nonce;
  const cs = box.querySelector('[name=cs]'); if (document.activeElement !== cs) cs.value = seeds.clientSeed;
  if (!busy) { free = seeds.free && seeds.free.machine === m.id ? seeds.free.left : 0; $('#freebox').hidden = !free; $('#free').textContent = free; }
}
async function loadSeeds() { try { await acc.init(); if (!acc.current().user) return; seeds = (await api('seeds')).seeds; paintSeeds(); } catch {} }
function mountFair() {
  const box = el('details', { class: 'paytable slot-fair', id: 'fair' }, el('summary', {}, 'Fair play'),
    el('p', {}, 'Every spin is drawn on the server from a secret seed, your client seed and a spin counter. The secret seed is fixed in advance: you see its SHA-256 fingerprint below. Press "Reveal seed" any time to see it and recompute your past spins on the verification page.'),
    el('dl', { class: 'g-fair-dl' }, el('dt', {}, 'Server seed fingerprint'), el('dd', {}, el('code', { 'data-k': 'commit' }, 'play a spin to create your seeds')), el('dt', {}, 'Spins with this seed'), el('dd', { 'data-k': 'nonce' }, '0')),
    el('form', { class: 'acc-form row', onsubmit: async e => { e.preventDefault(); try { seeds = (await api('clientseed', { clientSeed: e.target.cs.value.trim() })).seeds; paintSeeds(); showMsg('Client seed saved.'); } catch (er) { showMsg(er.message); } } },
      el('label', { for: 'fair-cs' }, 'Your client seed'), el('input', { id: 'fair-cs', name: 'cs', maxlength: '64', pattern: '[A-Za-z0-9_\\-]{1,64}', required: true }), el('button', { class: 'key key--sm', type: 'submit' }, 'Save')),
    el('div', { class: 'acc-actions' },
      el('button', { class: 'key key--amber', type: 'button', onclick: async () => { if (busy) return; try { const r = await api('rotate'); seeds = r.seeds; paintSeeds(); showMsg(`Revealed seed for ${r.revealed.spins} spins. Check them on the verification page.`); } catch (er) { showMsg(er.message); } } }, 'Reveal seed & start a new one'),
      el('a', { class: 'key', href: '/fair/?slots=1', target: '_blank', rel: 'noopener' }, 'Verification page')));
  $('#app').append(box);
}

function animate(next) {
  const reels = [...cab.querySelectorAll('.reel')];
  return new Promise(done => {
    let finished = 0;
    reels.forEach((reel, r) => {
      const strip = reel.querySelector('.strip');
      const filler = Array.from({ length: 14 + r * 4 }, () => m.symbols[Math.floor(Math.random() * m.symbols.length)][0]);
      const cur = [...strip.children].map(c => c.cloneNode(true));
      strip.replaceChildren(...next[r].map(sym), ...filler.map(sym), ...cur);
      const cell = reel.clientHeight / m.rows, dist = (strip.children.length - m.rows) * cell;
      strip.style.transform = `translateY(${-dist}px)`;
      strip.classList.add('blur');
      if (reduced) { strip.style.transform = ''; strip.classList.remove('blur'); strip.replaceChildren(...next[r].map(sym)); if (++finished === reels.length) done(); return; }
      const anim = strip.animate([{ transform: `translateY(${-dist}px)` }, { transform: 'translateY(8px)', offset: .94 }, { transform: 'translateY(0)' }], { duration: 900 + r * 280, easing: 'cubic-bezier(.25,.1,.25,1)', fill: 'forwards' });
      const iv = setInterval(() => tick(700 + Math.random() * 300, .02, .02), 70);
      anim.onfinish = () => { clearInterval(iv); tick(220, .08, .08); strip.classList.remove('blur'); strip.style.transform = ''; anim.cancel(); strip.replaceChildren(...next[r].map(sym)); if (++finished === reels.length) done(); };
    });
  });
}
function clearWins() { cab.querySelectorAll('.sym.win').forEach(s => s.classList.remove('win')); const svg = cab.querySelector('.lines'); if (svg) svg.innerHTML = ''; showMsg(''); }
function showWins(res) {
  const reels = [...cab.querySelectorAll('.reel')]; const svg = cab.querySelector('.lines');
  const colors = ['#ffd54f', '#ff4081', '#69f0ae', '#40c4ff', '#ff6e40', '#e040fb', '#b2ff59', '#ffab40', '#18ffff', '#ff5252'];
  let html = '';
  res.wins.forEach((w, i) => {
    w.cells.forEach(([r, row]) => reels[r]?.querySelectorAll('.sym')[row]?.classList.add('win'));
    if (w.line >= 0) { const pts = m.lines[w.line].map((row, r) => `${r * 100 + 50},${row * 100 + 50}`).join(' '); html += `<polyline points="${pts}" fill="none" stroke="${colors[w.line % colors.length]}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>`; }
  });
  svg.innerHTML = html;
  const best = [...res.wins].sort((a, b) => b.amount - a.amount)[0];
  showMsg(best.free ? `${best.n} coins: ${best.free} free spins!` : `${best.n}× ${best.sym} pays ${fmt(best.amount)}` + (res.wins.length > 1 ? ` · ${res.wins.length} lines` : ''));
}
function showMsg(t) { $('#msg').textContent = t; $('#msg').classList.toggle('show', !!t); }
function countUp(node, v) { const t0 = performance.now(); const s = t => { const k = Math.min(1, (t - t0) / 900); node.textContent = fmt(v * k); if (k < 1) requestAnimationFrame(s); }; requestAnimationFrame(s); }

const sk = $('#sound');
const paintSound = () => { sk.setAttribute('aria-pressed', String(soundOn())); sk.lastChild.textContent = soundOn() ? 'Sound on' : 'Sound off'; };
sk.addEventListener('click', () => { setSound(!soundOn()); paintSound(); }); paintSound();
addEventListener('keydown', e => { if (e.code === 'Space' && !e.target.closest('input,button,select,textarea,dialog')) { e.preventDefault(); go(); } });
build();
mountFair();
loadSeeds();
