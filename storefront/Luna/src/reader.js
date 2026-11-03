// The Luna reader: a paper book on desktop (cover alone, then facing pages) and one readable page on phones.
// Page turns use the Web Animations API on a two-faced leaf (no animation library). Any new request finishes
// the running turn instantly, so rapid clicks never skip, duplicate or desynchronise pages.
import { buildLeaves, spreadOf, spreadLeaves, spreadCount, step, atStart, atEnd, clampIndex, statusText, chooseMode } from './core.js';
import { pageSrc, attribution, LANGUAGES } from './catalogue.js';
import { h, icon, jacket, prefersReducedMotion, isTyping } from './ui.js';

const ZOOMS = [1, 1.5, 2, 2.6];
// Phones open the readable view at 200% (speech bubbles become legible); larger screens at 150%.
const defaultZoom = () => (innerWidth < 700 ? 3 : 2);

export function openReader(mount, title, start, { onIndex, onClose, onInquiry, onDetail }) {
  const leaves = buildLeaves(title);
  const n = leaves.length;
  const ratio = title.pageSize[0] / title.pageSize[1];
  let i = clampIndex(start, n);
  let mode = 'single', forced = null, turn = null, zoom = 0, lastTap = 0;

  // ---------- DOM ----------
  const status = h('p', { class: 'rd-status', role: 'status', 'aria-live': 'polite' });
  const select = h('select', { class: 'rd-select', 'aria-label': 'Səhifəyə keç' },
    leaves.map((l, k) => h('option', { value: k, text: l.label })));
  const prevBtn = h('button', { class: 'rd-btn rd-prev', type: 'button', 'aria-label': 'Əvvəlki səhifə' }, icon('prev'), h('span', { text: 'Əvvəlki' }));
  const nextBtn = h('button', { class: 'rd-btn rd-next', type: 'button', 'aria-label': 'Növbəti səhifə' }, h('span', { text: 'Növbəti' }), icon('next'));
  const modeBtn = h('button', { class: 'rd-tool', type: 'button', 'aria-pressed': 'false' }, icon('book'), h('span', { class: 'rd-tool-label', text: 'Tək səhifə' }));
  const zoomBtn = h('button', { class: 'rd-tool', type: 'button', 'aria-pressed': 'false' }, icon('zoom'), h('span', { class: 'rd-tool-label', text: 'Yaxından oxu' }));
  const fullBtn = document.fullscreenEnabled ? h('button', { class: 'rd-tool', type: 'button', 'aria-pressed': 'false' }, icon('full'), h('span', { class: 'rd-tool-label', text: 'Tam ekran' })) : null;
  const closeBtn = h('button', { class: 'rd-close', type: 'button' }, icon('close'), h('span', { text: 'Oxucunu bağla' }));

  const left = h('div', { class: 'rd-slot rd-left' });
  const right = h('div', { class: 'rd-slot rd-right' });
  const book = h('div', { class: 'rd-book' }, left, right, h('div', { class: 'rd-spine', 'aria-hidden': 'true' }));
  const stage = h('div', { class: 'rd-stage', tabindex: '-1', 'aria-label': `${title.title}: səhifələr` }, book);
  const zoomOut = h('button', { class: 'rd-tool', type: 'button', 'aria-label': 'Kiçilt' }, icon('minus'));
  const zoomIn = h('button', { class: 'rd-tool', type: 'button', 'aria-label': 'Böyüt' }, icon('plus'));
  const zoomLevel = h('span', { class: 'rd-zoom-level' });
  const zoomBody = h('div', { class: 'rd-zoom-body' });
  const zoomPane = h('div', { class: 'rd-zoom', hidden: true, tabindex: '0', 'aria-label': 'Yaxından oxu görünüşü, sürüşdürərək baxın' }, zoomBody);
  const zoomBar = h('div', { class: 'rd-zoombar', hidden: true }, zoomOut, zoomLevel, zoomIn);

  const root = h('section', { class: 'rd', 'aria-label': `Oxucu: ${title.title}` },
    h('header', { class: 'rd-bar' },
      closeBtn,
      h('div', { class: 'rd-title' },
        h('strong', { lang: title.language === 'ru' ? 'ru' : 'en', text: title.title }),
        h('span', { text: `${title.series}, bölüm ${title.episode}${title.access === 'sample' ? ', önizləmə' : ''}` })),
      h('div', { class: 'rd-tools' }, modeBtn, zoomBtn, fullBtn, zoomBar)),
    stage, zoomPane,
    h('footer', { class: 'rd-nav' }, prevBtn, h('div', { class: 'rd-where' }, select, status), nextBtn));
  mount.replaceChildren(root);

  // ---------- Leaves ----------
  // Nodes are cached per leaf and moved (not recreated) between slots and the turning leaf, so images never reload mid-turn.
  const cache = new Map();
  function leafNode(k) {
    if (k === null || k === undefined) return null;
    if (!cache.has(k)) cache.set(k, createLeaf(k));
    return cache.get(k);
  }
  function createLeaf(k) {
    const leaf = leaves[k];
    const paper = h('div', { class: `paper paper-${leaf.kind}`, 'data-leaf': k });
    if (leaf.kind === 'page') {
      const img = h('img', { src: pageSrc(title, leaf.file), alt: `${title.title}, səhifə ${leaf.n}`, width: title.pageSize[0], height: title.pageSize[1], decoding: 'async', draggable: 'false' });
      if (k === i) img.setAttribute('fetchpriority', 'high');
      let tries = 0;
      img.addEventListener('error', () => {
        const retry = h('button', { class: 'btn btn-quiet', type: 'button', text: 'Yenidən yüklə' });
        const box = h('div', { class: 'paper-error', role: 'alert' }, h('p', { text: `Səhifə ${leaf.n} yüklənmədi.` }), h('p', { class: 'small', text: 'Oxuduğunuz yer yadda qalıb. Bağlantını yoxlayıb yenidən yükləyin.' }), retry);
        retry.addEventListener('click', () => { tries += 1; img.src = `${pageSrc(title, leaf.file)}?r=${tries}`; box.replaceWith(img); });
        img.replaceWith(box);
      });
      paper.append(img);
    } else if (leaf.kind === 'cover') {
      paper.append(jacket(title, { small: false, eager: true }));
    } else if (leaf.kind === 'colophon') {
      paper.append(h('div', { class: 'leaf-text' },
        h('p', { class: 'leaf-kicker', text: 'Bölümün sonu' }),
        h('h2', { lang: title.language === 'ru' ? 'ru' : 'en', text: title.title }),
        h('dl', { class: 'leaf-credits' }, title.credits.flatMap(([role, who]) => [h('dt', { text: role }), h('dd', { text: who })])),
        h('p', { class: 'small', text: attribution(title) }),
        h('p', { class: 'small' }, 'Mənbə: ', h('a', { href: title.source.page, rel: 'noopener', target: '_blank', text: 'peppercarrot.com' }), ', lisenziya: ', h('a', { href: title.license.url, rel: 'noopener license', target: '_blank', text: title.license.name }), '.'),
        h('button', { class: 'btn btn-quiet', type: 'button', text: 'Əsər səhifəsinə qayıt', onclick: () => onDetail() })));
    } else {
      const rest = title.storyPages - title.previewPages;
      paper.append(h('div', { class: 'leaf-text' },
        h('p', { class: 'leaf-kicker', text: 'Önizləmənin sonu' }),
        h('h2', { text: 'Önizləmə burada bitir' }),
        h('p', { text: `Siz ${title.storyPages} səhifəlik bölümün ilk ${title.previewPages} səhifəsini oxudunuz. Qalan ${rest} səhifə Luna-ya yüklənməyib: bu nümunə məhsul hələ satışda deyil və ödəniş qəbul edilmir.` }),
        h('button', { class: 'btn btn-lantern', type: 'button', onclick: () => onInquiry() }, icon('wa'), 'WhatsApp-da maraq bildir'),
        h('p', { class: 'small' }, 'Bu əsər müəllifin saytında ', h('a', { href: title.source.page, rel: 'noopener', target: '_blank', text: 'CC BY 4.0 ilə pulsuz' }), ' oxuna bilər.'),
        h('button', { class: 'btn btn-quiet', type: 'button', text: 'Əsər səhifəsinə qayıt', onclick: () => onDetail() })));
    }
    return paper;
  }
  const fill = (slot, k) => { slot.replaceChildren(...[leafNode(k)].filter(Boolean)); slot.classList.toggle('is-empty', k === null || k === undefined); };

  // ---------- Static render ----------
  function render() {
    root.dataset.mode = mode;
    if (mode === 'spread') {
      const s = spreadOf(i), [l, r] = spreadLeaves(s, n);
      fill(left, l); fill(right, r);
      book.classList.toggle('is-front', s === 0);
      book.classList.toggle('is-back', r === null && s > 0);
    } else {
      fill(left, null); fill(right, i);
      book.classList.remove('is-front', 'is-back');
    }
    status.textContent = statusText(i, n, leaves, mode);
    select.value = String(i);
    prevBtn.disabled = atStart(i, mode);
    nextBtn.disabled = atEnd(i, n, mode);
    if (zoom) renderZoom();
    preload();
  }
  function preload() {
    for (let k = i - 2; k <= i + 3; k++) {
      const leaf = leaves[k];
      if (leaf?.kind === 'page') { const im = new Image(); im.decoding = 'async'; im.src = pageSrc(title, leaf.file); }
    }
  }
  function commit(to) {
    i = clampIndex(to, n);
    render();
    onIndex(i, n);
  }

  // ---------- Page turn ----------
  function finishTurn() {
    if (!turn) return;
    const t = turn; turn = null;
    t.anims.forEach(a => a.cancel());
    t.cleanup();
    commit(t.to);
  }
  function go(dir) {
    finishTurn();
    const m = zoom ? 'single' : mode;
    const to = step(i, dir, n, m);
    if (to === i) return;
    if (zoom || prefersReducedMotion()) { commit(to); return; }
    if (mode === 'spread') turnSpread(dir, to); else turnSingle(dir, to);
  }
  function makeTurner(side, front, back) {
    const shadeF = h('span', { class: 'shade' }), shadeB = h('span', { class: 'shade' });
    const f = h('div', { class: 'face face-front' }, front, shadeF);
    const b = h('div', { class: 'face face-back' }, back, shadeB);
    const el = h('div', { class: `rd-turner rd-turner-${side}`, 'aria-hidden': 'true' }, f, b);
    return { el, shadeF, shadeB };
  }
  function blankBack() { return h('div', { class: 'paper paper-back' }); }
  function turnSpread(dir, to) {
    const [l, r] = spreadLeaves(spreadOf(i), n);
    const [l2, r2] = spreadLeaves(spreadOf(to), n);
    const dur = 720, easing = 'cubic-bezier(.42,.08,.24,1)';
    let tr;
    if (dir > 0) { fill(left, l); fill(right, r2); tr = makeTurner('right', leafNode(r), leafNode(l2) || blankBack()); }
    else { fill(left, l2); fill(right, r); tr = makeTurner('left', leafNode(l), leafNode(r2) || blankBack()); }
    book.append(tr.el);
    const sTo = spreadOf(to);
    book.classList.toggle('is-front', sTo === 0);
    book.classList.toggle('is-back', r2 === null && sTo > 0);
    const deg = dir > 0 ? -180 : 180;
    const anims = [
      tr.el.animate([{ transform: 'rotateY(0deg)' }, { transform: `rotateY(${deg * 0.5}deg) translateZ(14px)`, offset: 0.5 }, { transform: `rotateY(${deg}deg)` }], { duration: dur, easing }),
      tr.shadeF.animate([{ opacity: 0 }, { opacity: 0.55 }], { duration: dur / 2, easing: 'ease-in', fill: 'forwards' }),
      tr.shadeB.animate([{ opacity: 0.55 }, { opacity: 0.55, offset: 0.5 }, { opacity: 0 }], { duration: dur, easing: 'ease-out', fill: 'forwards' }),
    ];
    runTurn(anims, to, () => tr.el.remove());
  }
  function turnSingle(dir, to) {
    const dur = 520, easing = 'cubic-bezier(.4,.1,.25,1)';
    let tr, kf;
    if (dir > 0) { fill(right, to); tr = makeTurner('single', leafNode(i), blankBack()); kf = [{ transform: 'rotateY(0deg)', opacity: 1 }, { transform: 'rotateY(-150deg)', opacity: 0 }]; }
    else { fill(right, i); tr = makeTurner('single', leafNode(to), blankBack()); kf = [{ transform: 'rotateY(-150deg)', opacity: 0 }, { transform: 'rotateY(0deg)', opacity: 1 }]; }
    book.append(tr.el);
    const anims = [
      tr.el.animate(kf, { duration: dur, easing }),
      tr.shadeF.animate(dir > 0 ? [{ opacity: 0 }, { opacity: 0.5 }] : [{ opacity: 0.5 }, { opacity: 0 }], { duration: dur, easing, fill: 'forwards' }),
    ];
    runTurn(anims, to, () => tr.el.remove());
  }
  function runTurn(anims, to, cleanup) {
    const t = { anims, to, cleanup };
    turn = t;
    anims[0].finished.then(() => { if (turn === t) finishTurn(); }, () => {});
  }

  // ---------- Layout ----------
  function layout() {
    const r = stage.getBoundingClientRect();
    const w = r.width - 24, hgt = r.height - 24;
    const auto = chooseMode(r.width, r.height, ratio);
    const next = forced === 'single' || auto === 'single' ? 'single' : 'spread';
    modeBtn.hidden = auto === 'single';
    let pw, ph;
    if (next === 'spread') { ph = Math.min(hgt, w / 2 / ratio); pw = ph * ratio; }
    else { ph = Math.min(hgt, w / ratio); pw = ph * ratio; }
    book.style.setProperty('--pw', `${Math.floor(pw)}px`);
    book.style.setProperty('--ph', `${Math.floor(ph)}px`);
    if (next !== mode) { finishTurn(); mode = next; render(); }
    modeBtn.setAttribute('aria-pressed', String(forced === 'single'));
    if (zoom) sizeZoom();
  }
  const ro = new ResizeObserver(() => layout());
  ro.observe(stage);

  // ---------- Zoom / readable mode ----------
  let zoomedLeaf = -1;
  function renderZoom() {
    const node = leafNode(i);
    if (zoomedLeaf !== i) { zoomPane.scrollTop = 0; zoomedLeaf = i; }
    zoomBody.replaceChildren(node);
    sizeZoom();
    zoomLevel.textContent = `${Math.round(ZOOMS[zoom - 1] * 100)}%`;
    zoomOut.disabled = zoom <= 1; zoomIn.disabled = zoom >= ZOOMS.length;
  }
  function sizeZoom() {
    const cw = zoomPane.clientWidth || stage.clientWidth;
    const base = Math.min(cw - 16, 920);
    zoomBody.style.setProperty('--zw', `${Math.round(base * ZOOMS[zoom - 1])}px`);
    zoomBody.style.setProperty('--zh', `${Math.round(base * ZOOMS[zoom - 1] / ratio)}px`);
  }
  function setZoom(level, focusX = 0.5, focusY = 0.3) {
    finishTurn();
    zoom = Math.max(0, Math.min(ZOOMS.length, level));
    const on = zoom > 0;
    root.classList.toggle('is-zoom', on);
    zoomPane.hidden = !on; zoomBar.hidden = !on; stage.hidden = on;
    zoomBtn.setAttribute('aria-pressed', String(on));
    zoomBtn.querySelector('.rd-tool-label').textContent = on ? 'Səhifəyə qayıt' : 'Yaxından oxu';
    if (on) {
      renderZoom();
      requestAnimationFrame(() => {
        zoomPane.scrollLeft = Math.max(0, zoomBody.scrollWidth * focusX - zoomPane.clientWidth / 2);
        zoomPane.scrollTop = Math.max(0, zoomBody.scrollHeight * focusY - zoomPane.clientHeight / 2);
      });
    } else { zoomedLeaf = -1; render(); layout(); }
    prevBtn.disabled = atStart(i, on ? 'single' : mode);
    nextBtn.disabled = atEnd(i, n, on ? 'single' : mode);
  }

  // ---------- Input ----------
  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));
  select.addEventListener('change', () => { finishTurn(); commit(Number(select.value)); });
  modeBtn.addEventListener('click', () => { forced = forced === 'single' ? null : 'single'; modeBtn.querySelector('.rd-tool-label').textContent = forced ? 'Kitab görünüşü' : 'Tək səhifə'; layout(); });
  zoomBtn.addEventListener('click', () => setZoom(zoom ? 0 : defaultZoom()));
  zoomIn.addEventListener('click', () => setZoom(zoom + 1));
  zoomOut.addEventListener('click', () => setZoom(zoom - 1));
  closeBtn.addEventListener('click', () => onClose());
  fullBtn?.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen?.(); else root.requestFullscreen?.().catch(() => {});
  });
  const onFs = () => fullBtn?.setAttribute('aria-pressed', String(document.fullscreenElement === root));
  document.addEventListener('fullscreenchange', onFs);

  function onKey(e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isTyping(e.target)) return;
    if (document.querySelector('dialog[open]')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
    else if (e.key === 'Home') { e.preventDefault(); finishTurn(); commit(0); }
    else if (e.key === 'End') { e.preventDefault(); finishTurn(); commit(n - 1); }
    else if (e.key === 'Escape') { if (document.fullscreenElement) return; e.preventDefault(); if (zoom) setZoom(0); else onClose(); }
  }
  document.addEventListener('keydown', onKey);

  // Deliberate horizontal swipes only: single pointer, mostly horizontal, at least 56px, not while pinch-zoomed.
  const pointers = new Map();
  let swipe = null;
  stage.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    pointers.set(e.pointerId, e);
    swipe = pointers.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now(), multi: false } : { ...(swipe || {}), multi: true };
  });
  stage.addEventListener('pointercancel', e => { pointers.delete(e.pointerId); swipe = null; });
  stage.addEventListener('pointerup', e => {
    pointers.delete(e.pointerId);
    if (!swipe || swipe.multi) { if (!pointers.size) swipe = null; return; }
    const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y, dt = performance.now() - swipe.t;
    swipe = null;
    if ((window.visualViewport?.scale || 1) > 1.05) return;
    if (Math.abs(dx) >= 56 && Math.abs(dx) > Math.abs(dy) * 1.6 && dt < 900) { go(dx < 0 ? 1 : -1); return; }
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) { // double tap opens the readable zoom near the tap
      const now = performance.now();
      if (now - lastTap < 320) { lastTap = 0; zoomAt(e); } else lastTap = now;
    }
  });
  stage.addEventListener('dblclick', e => zoomAt(e));
  function zoomAt(e) {
    const paper = e.target.closest?.('.paper-page');
    if (!paper) return;
    const k = Number(paper.dataset.leaf);
    if (k !== i) { finishTurn(); i = k; }
    const r = paper.getBoundingClientRect();
    setZoom(defaultZoom(), (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  }

  layout(); render(); onIndex(i, n);
  requestAnimationFrame(() => stage.focus({ preventScroll: true }));

  return {
    get index() { return i; },
    get mode() { return mode; },
    go, goTo(k) { finishTurn(); commit(k); },
    destroy() {
      finishTurn(); ro.disconnect();
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFs);
      if (document.fullscreenElement === root) document.exitFullscreen?.();
      mount.replaceChildren();
    },
  };
}
export const languageLabel = t => LANGUAGES[t.language];
