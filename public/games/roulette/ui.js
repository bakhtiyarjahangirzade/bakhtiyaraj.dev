import { h, fill, sfxCard } from '../shared/table.js';
import { avatarUrl, confetti } from '../shared/cards.js';
import { chip, chipStack } from '../blackjack/ui.js';
import { engine, RED, WHEEL, START } from './engine.js';

const fmt = n => n.toLocaleString('en-US');
const colorOf = n => n === 0 ? 'g' : RED.has(n) ? 'r' : 'b';
const LABEL = { red: 'Red', black: 'Black', odd: 'Odd', even: 'Even', low: '1–18', high: '19–36', d1: '1st 12', d2: '2nd 12', d3: '3rd 12', c1: '2:1', c2: '2:1', c3: '2:1' };

export function rouletteUI(root, { say }) {
  let st, ctx, chipV = 10, shownSpin = 0, spinning = false, revealFor = -1;
  const canvas = h('canvas', { class: 'rl-wheel', width: '560', height: '560', 'aria-hidden': 'true' });
  const resultEl = h('div', { class: 'rl-result', role: 'status', 'aria-live': 'polite' });
  const hist = h('div', { class: 'rl-hist', 'aria-label': 'Last results' });
  const board = h('div', { class: 'rl-board', role: 'group', 'aria-label': 'Betting table' });
  const players = h('div', { class: 'rl-players' });
  const controls = h('div', { class: 'rl-controls' });
  root.append(h('div', { class: 'rl-wrap' },
    h('div', { class: 'rl-left' }, h('div', { class: 'rl-wheel-wrap' }, canvas, resultEl), hist, players),
    h('div', { class: 'rl-right' }, h('div', { class: 'felt-table rl-table' }, h('div', { class: 'felt rl-felt' }, board)), controls)));

  /* ---------- wheel drawing ---------- */
  const ctx2 = canvas.getContext('2d');
  let wheelA = 0, ballA = 0, ballR = 0.86, raf = 0;
  function drawWheel() {
    const c = ctx2, W = 560, R = W / 2; c.clearRect(0, 0, W, W); c.save(); c.translate(R, R);
    // outer wood
    let g = c.createRadialGradient(0, 0, R * .7, 0, 0, R); g.addColorStop(0, '#5a3418'); g.addColorStop(.6, '#3a200d'); g.addColorStop(1, '#1a0e05');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, R - 2, 0, 7); c.fill();
    c.strokeStyle = '#c9952e'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, R * .9, 0, 7); c.stroke();
    // ball track
    g = c.createRadialGradient(0, 0, R * .78, 0, 0, R * .9); g.addColorStop(0, '#2b1a0c'); g.addColorStop(1, '#6b4422'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R * .89, 0, 7); c.arc(0, 0, R * .78, 0, 7, true); c.fill();
    c.rotate(wheelA);
    const seg = Math.PI * 2 / 37;
    WHEEL.forEach((n, i) => {
      const a0 = i * seg - seg / 2 - Math.PI / 2;
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R * .78, a0, a0 + seg); c.closePath();
      c.fillStyle = n === 0 ? '#148a3c' : RED.has(n) ? '#b3201a' : '#151515'; c.fill();
      c.strokeStyle = '#c9952e'; c.lineWidth = 1.2; c.stroke();
      c.save(); c.rotate(a0 + seg / 2 + Math.PI / 2); c.fillStyle = '#fff'; c.font = '600 19px Georgia, serif'; c.textAlign = 'center'; c.fillText(String(n), 0, -R * .68); c.restore();
    });
    // inner cone
    c.fillStyle = '#2a1608'; c.beginPath(); c.arc(0, 0, R * .55, 0, 7); c.fill();
    g = c.createRadialGradient(-20, -20, 10, 0, 0, R * .52); g.addColorStop(0, '#7a4a20'); g.addColorStop(1, '#2a1608'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R * .52, 0, 7); c.fill();
    for (let k = 0; k < 4; k++) { c.save(); c.rotate(k * Math.PI / 2); g = c.createLinearGradient(0, 0, 0, -R * .4); g.addColorStop(0, '#fff1c4'); g.addColorStop(1, '#b07a22'); c.fillStyle = g; c.beginPath(); c.moveTo(-7, 0); c.lineTo(-3, -R * .4); c.lineTo(3, -R * .4); c.lineTo(7, 0); c.fill(); c.beginPath(); c.arc(0, -R * .4, 7, 0, 7); c.fill(); c.restore(); }
    g = c.createRadialGradient(-6, -6, 2, 0, 0, 22); g.addColorStop(0, '#fff6d8'); g.addColorStop(1, '#a26b18'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 22, 0, 7); c.fill();
    c.restore();
    // ball
    c.save(); c.translate(R, R);
    const bx = Math.cos(ballA) * R * ballR, by = Math.sin(ballA) * R * ballR;
    g = c.createRadialGradient(bx - 3, by - 3, 1, bx, by, 9); g.addColorStop(0, '#fff'); g.addColorStop(1, '#bdbdbd');
    c.fillStyle = g; c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 6; c.beginPath(); c.arc(bx, by, 9, 0, 7); c.fill(); c.restore();
  }
  const ease = t => 1 - Math.pow(1 - t, 3);
  function spinTo(n, done) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { finishAt(n); done(); return; }
    spinning = true;
    const seg = Math.PI * 2 / 37, idx = WHEEL.indexOf(n);
    const w0 = wheelA, w1 = w0 + Math.PI * 2 * 3 + Math.random();
    const b0 = ballA;
    // pocket idx center in canvas angle = wheel angle + idx*seg - PI/2
    const target = w1 + idx * seg - Math.PI / 2;
    let b1 = target - Math.PI * 2 * 6; while (b1 > b0 - Math.PI * 2 * 5) b1 -= Math.PI * 2;
    const T = 5200, t0 = performance.now();
    const step = now => {
      const t = Math.min(1, (now - t0) / T), e = ease(t);
      wheelA = w0 + (w1 - w0) * e; ballA = b0 + (b1 - b0) * e; ballR = t < .7 ? .84 : .84 - (.84 - .64) * ((t - .7) / .3);
      drawWheel();
      if (t < 1) raf = requestAnimationFrame(step); else { spinning = false; done(); }
    };
    cancelAnimationFrame(raf); raf = requestAnimationFrame(step);
  }
  function finishAt(n) { const seg = Math.PI * 2 / 37; ballA = wheelA + WHEEL.indexOf(n) * seg - Math.PI / 2; ballR = .64; drawWheel(); }
  drawWheel();

  /* ---------- board ---------- */
  function cell(k, label, cls, total, others) {
    const b = h('button', { class: 'rl-cell ' + cls + (st.result != null && revealFor === st.spinId && st.phase === 'result' && engine && covered(k) ? ' hit' : ''), type: 'button', 'aria-label': `${label}${total ? ', your bet ' + total : ''}`, onclick: () => place(k) }, h('span', {}, label),
      total ? h('span', { class: 'rl-chip' }, chipStack(total)) : null, others ? h('span', { class: 'rl-others', title: 'Other players' }, '+' + others) : null);
    return b;
  }
  function covered(k) { const r = st.result; if (k[0] === 'n') return +k.slice(1) === r; return false; }
  function place(k) {
    const my = ctx.mySeat; if (my < 0) return;
    if (st.phase !== 'bet' || st.ready.includes(my)) { say(st.phase !== 'bet' ? 'Wait for the next round.' : 'You already pressed Spin.'); return; }
    if (st.chips[my] < 1) { say('No chips left.'); return; }
    ctx.send({ type: 'bet', k, amount: Math.min(chipV, st.chips[my]) });
  }
  function paintBoard() {
    const my = ctx.mySeat, mine = st.bets[my] || {};
    const others = k => st.bets.reduce((a, b, i) => i === my ? a : a + (b[k] || 0), 0);
    const kids = [cell('n0', '0', 'z g', mine.n0, others('n0'))];
    for (let col = 0; col < 12; col++) for (let row = 2; row >= 0; row--) {
      const n = col * 3 + row + 1; const c = cell('n' + n, String(n), colorOf(n), mine['n' + n], others('n' + n));
      c.style.gridColumn = col + 2; c.style.gridRow = 3 - row; kids.push(c);
    }
    ['c3', 'c2', 'c1'].forEach((k, i) => { const c = cell(k, '2:1', 'col', mine[k], others(k)); c.style.gridColumn = 14; c.style.gridRow = i + 1; kids.push(c); });
    ['d1', 'd2', 'd3'].forEach((k, i) => { const c = cell(k, LABEL[k], 'dz', mine[k], others(k)); c.style.gridColumn = `${2 + i * 4} / span 4`; c.style.gridRow = 4; kids.push(c); });
    ['low', 'even', 'red', 'black', 'odd', 'high'].forEach((k, i) => { const c = cell(k, k === 'red' || k === 'black' ? '' : LABEL[k], 'ev ' + (k === 'red' ? 'r dia' : k === 'black' ? 'b dia' : ''), mine[k], others(k)); c.style.gridColumn = `${2 + i * 2} / span 2`; c.style.gridRow = 5; kids.push(c); });
    fill(board, ...kids);
    if (st.phase === 'result' && revealFor === st.spinId) board.querySelector(`[aria-label^="${st.result},"], [aria-label="${st.result}"]`)?.classList.add('hit');
  }
  function paint() {
    const my = ctx.mySeat;
    paintBoard();
    fill(hist, ...st.history.slice(revealFor === st.spinId || st.phase === 'bet' ? 0 : 1).map(n => h('span', { class: 'rl-h ' + colorOf(n) }, String(n))));
    fill(players, ...ctx.seats.map((s, i) => {
      const av = h('span', { class: 'avatar sm' }); av.style.backgroundImage = `url(${avatarUrl(s)})`;
      const bet = Object.values(st.bets[i] || {}).reduce((a, b) => a + b, 0);
      const showWin = st.phase === 'result' && revealFor === st.spinId;
      return h('div', { class: 'rl-pl' + (i === my ? ' me' : '') }, av, h('span', { class: 'nameplate' }, s.name + (i === my ? ' (you)' : ''), h('span', { class: 'count' }, fmt(showWin || st.phase === 'bet' ? st.chips[i] : st.chips[i] - st.wins[i]))),
        h('span', { class: 'rl-pl-bet' }, showWin ? (st.wins[i] ? `+${fmt(st.wins[i])}` : bet ? `−${fmt(bet)}` : '') : bet ? `bet ${fmt(bet)}` : ''),
        st.phase === 'bet' && st.ready.includes(i) ? h('span', { class: 'rl-ready' }, 'Ready') : null);
    }));
    const kids = [];
    if (my >= 0) {
      if (st.phase === 'bet') {
        const placed = Object.values(st.bets[my]).reduce((a, b) => a + b, 0);
        if (st.chips[my] < 1 && !placed) kids.push(h('button', { class: 'key key--amber', type: 'button', onclick: () => ctx.send({ type: 'rebuy' }) }, `Rebuy ${fmt(START)} chips`));
        else kids.push(h('div', { class: 'bj-rack' }, [1, 10, 25, 100, 500].map(v => { const c = chip(v === 1 ? 10 : v, { class: (chipV === v ? 'sel' : '') + (v === 1 ? ' c1' : ''), 'aria-label': 'Chip ' + v, onclick: () => { chipV = v; paint(); } }); if (v === 1) c.querySelector('b').textContent = '1'; return c; })),
          h('div', { class: 'bj-pending' }, h('span', { class: 'label' }, 'On the table'), h('b', {}, fmt(placed))),
          h('button', { class: 'key', type: 'button', disabled: !placed || st.ready.includes(my), onclick: () => ctx.send({ type: 'clear' }) }, 'Clear'),
          st.ready.includes(my) ? h('p', { class: 'g-hint' }, 'Waiting for the others…') : h('button', { class: 'key key--amber', type: 'button', onclick: () => ctx.send({ type: 'spin' }) }, ctx.seats.length > 1 ? 'Ready · Spin' : 'Spin'));
      } else if (st.phase === 'result') {
        if (revealFor !== st.spinId) kids.push(h('p', { class: 'g-hint' }, 'No more bets…'));
        else if (st.ready.includes(my)) kids.push(h('p', { class: 'g-hint' }, 'Waiting for the table…'));
        else kids.push(h('p', { class: 'bj-net ' + (st.wins[my] ? 'up' : '') }, st.wins[my] ? `+${fmt(st.wins[my])}` : ''), h('button', { class: 'key key--amber', type: 'button', onclick: () => ctx.send({ type: 'next' }) }, 'Next round'));
      }
    }
    fill(controls, ...kids);
    if (st.phase === 'result' && revealFor === st.spinId) fill(resultEl, h('span', { class: 'rl-num ' + colorOf(st.result) }, String(st.result)));
    else fill(resultEl);
  }
  return {
    render(state, c) {
      const prev = st; st = state; ctx = c;
      if (prev && prev.seq !== st.seq && st.phase === 'bet') sfxCard();
      if (st.phase === 'result' && st.spinId !== shownSpin) {
        shownSpin = st.spinId;
        if (prev) spinTo(st.result, () => { revealFor = st.spinId; paint(); if (st.wins[ctx.mySeat] > 0) { confetti(1600); say(`${st.result} ${colorOf(st.result) === 'r' ? 'red' : colorOf(st.result) === 'b' ? 'black' : 'green'} · you win ${fmt(st.wins[ctx.mySeat])}`); } else say(`${st.result} ${colorOf(st.result) === 'r' ? 'red' : colorOf(st.result) === 'b' ? 'black' : 'green'}`); });
        else { finishAt(st.result); revealFor = st.spinId; }
      }
      paint();
    }
  };
}
