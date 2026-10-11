// Helpers to build card/tile/opponent elements.
import { h } from './table.js';

export function seatBadge(seat, { turn, count, you, extra } = {}) {
  return h('span', { class: 'seat-badge' + (turn ? ' turn' : '') },
    h('span', { class: turn ? 'led on' : seat?.bot ? 'led amber' : 'led green' }),
    `${seat?.name || '—'}${you ? ' (you)' : ''}`,
    count != null ? h('span', { class: 'count' }, String(count)) : null, extra || null);
}
export function backs(n, max = 8) {
  const k = Math.min(n, max), out = [];
  for (let i = 0; i < k; i++) out.push(h('span', { class: 'card small back', 'aria-hidden': 'true' }));
  return h('span', { class: 'opp-fan', 'aria-label': `${n} cards` }, out);
}
const PIPS = { 0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
function half(n, vertical) {
  const cells = []; const on = new Set(PIPS[n]);
  for (let i = 0; i < 9; i++) {
    // rotate the 6 layout for vertical halves so pips run along the long edge
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
  return h('span', { class: 'opp-fan tiles', 'aria-label': `${n} tiles` }, out);
}
export function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
