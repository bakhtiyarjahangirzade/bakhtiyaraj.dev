// Small DOM helpers. Everything is built with createElement/textContent (never HTML strings built from data),
// and dynamic values are set through the CSSOM, which the production CSP (style-src 'self') allows.
import { coverSrc, ACCESS, LANGUAGES } from './catalogue.js';

// Owner covers can be any ratio; boxes take the cover's own ratio so it is never cropped (starter covers are 1100×765).
// lang attribute for a title's own text (wordless starter titles have English titles).
export const langOf = t => (t.language === 'none' ? (t.remote ? 'az' : 'en') : t.language);
export const coverRatio = t => `${t.coverSize[0]} / ${t.coverSize[1]}`;

export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'vars') for (const [n, val] of Object.entries(v)) el.style.setProperty(n, val);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  return el;
}
export const icon = name => {
  const paths = {
    prev: 'M14.5 5 7.5 12l7 7', next: 'M9.5 5l7 7-7 7', close: 'M6 6l12 12M18 6 6 18',
    zoom: 'M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm4.8 11.3L20 20M10.5 7.5v6M7.5 10.5h6',
    full: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5', book: 'M12 6c-2-1.3-5-1.8-8-1.5v13c3-.3 6 .2 8 1.5 2-1.3 5-1.8 8-1.5v-13c-3-.3-6 .2-8 1.5Zm0 0v13',
    page: 'M7 3.5h7l4 4V20.5H7z', plus: 'M12 5v14M5 12h14', minus: 'M5 12h14', check: 'M5 12.5l4.5 4.5L19 7.5',
    bookmark: 'M7 4h10v16l-5-4-5 4z', arrow: 'M5 12h13M13 6l6 6-6 6', search: 'M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13Zm4.8 11.3L20 20',
    chevron: 'M9.5 6l6 6-6 6', more: 'M5 12h.01M12 12h.01M19 12h.01', home: 'M4 11.5 12 5l8 6.5V20h-5v-5H9v5H4z',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c.8-3.4 3.6-5.5 7-5.5s6.2 2.1 7 5.5', shield: 'M12 3.5 5 6v5.5c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6z', clock: 'M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 3.5V12l3 2',
    wa: 'M12 3.5a8.5 8.5 0 0 0-7.3 12.9L3.5 20.5l4.2-1.1A8.5 8.5 0 1 0 12 3.5Z',
  };
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('class', 'ic');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', paths[name]); svg.append(p);
  return svg;
};

// The Luna jacket: a cloth board in the title's tone with the original episode artwork in a window.
// The artwork file is shown whole (object-fit: contain inside its own ratio) — never cropped.
export function jacket(t, { small = true, eager = false } = {}) {
  const no = t.episode !== null && t.episode !== undefined ? `№ ${t.episode}` : '';
  return h('div', { class: 'jacket', vars: { '--tone': t.tone, '--cover-ratio': coverRatio(t) } },
    h('div', { class: 'jacket-head' },
      h('span', { class: 'jacket-series', text: t.series || t.creator }),
      no ? h('span', { class: 'jacket-no', text: no }) : null),
    h('div', { class: 'jacket-window' },
      h('img', { src: coverSrc(t, small), alt: '', width: t.coverSize[0], height: t.coverSize[1], loading: eager ? 'eager' : 'lazy', decoding: 'async' })),
    h('div', { class: 'jacket-foot' },
      h('span', { class: 'jacket-title', lang: langOf(t), text: t.title }),
      h('span', { class: 'jacket-creator', text: t.creator })),
    h('span', { class: 'jacket-moon', 'aria-hidden': 'true' }));
}

// Bento tile with the cover art as a decorative background (CSS crop). The full, uncropped cover is shown on the
// title page and in the reader; tiles only frame it.
export function artTile(t, { cls = '', chip, title = t.title, sub, desc, actions = [], href, eager = false } = {}) {
  const lang = langOf(t);
  return h('article', { class: `tile tile-art ${cls}`, vars: { '--tone': t.tone } },
    h('img', { class: 'tile-img', src: coverSrc(t, !cls.includes('tile-tall')), alt: '', loading: eager ? 'eager' : 'lazy', decoding: 'async' }),
    h('span', { class: 'tile-shade', 'aria-hidden': 'true' }),
    h('div', { class: 'tile-body' },
      chip ? h('span', { class: 'chip', text: chip }) : null,
      h('h3', { class: 'tile-title', lang: title === t.title ? lang : 'az' }, href ? h('a', { href, 'data-nav': true, class: 'tile-link', text: title }) : title),
      sub ? h('p', { class: 'tile-sub', text: sub }) : null,
      desc ? h('p', { class: 'tile-desc', text: desc }) : null,
      actions.length ? h('div', { class: 'tile-actions' }, actions) : null));
}
export function avatar(name, tone) {
  const initials = name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return h('span', { class: 'avatar', 'aria-hidden': 'true', vars: { '--tone': tone } }, h('span', { text: initials }));
}

export const accessBadge = t => h('span', { class: `badge badge-${t.access}`, text: t.access === 'sample' ? `${ACCESS.sample}, satışda deyil` : t.access === 'paid' ? `${ACCESS.paid}, ${t.price} AZN` : ACCESS.free });
export const langText = t => LANGUAGES[t.language];
export const priceText = t => (t.price ? `${t.price} AZN` : 'Pulsuz');

let toastTimer = 0;
export function toast(msg, kind = 'info') {
  const el = document.getElementById('luna-toast');
  if (!el) return;
  el.textContent = msg; el.dataset.kind = kind; el.classList.add('is-on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('is-on'), 4200);
}

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isTyping = t => !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
