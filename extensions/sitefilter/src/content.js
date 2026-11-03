/* SiteFilter content script: finds listing cards, hides the ones the rules reject,
 * removes ad slots, keeps up with infinite scroll and runs the element picker. */
(function () {
  'use strict';
  if (window.__siteFilterLoaded) return;
  window.__siteFilterLoaded = true;

  const SF = globalThis.SiteFilter;
  const { GENERIC_ADS, presetFor } = globalThis.SiteFilterPresets;
  const HOST = SF.siteKey(location.hostname);
  const PRESET = presetFor(HOST);
  const ATTR = 'data-sf';
  const WHY = 'data-sf-why';

  let settings = null;
  let matcher = null;
  let peek = false;
  let marked = new Set();
  let stats = { listings: 0, ads: 0, cards: 0, reasons: {} };
  let styleEl = null;
  let scheduled = 0;

  /* ---------- styles ---------- */

  function ensureStyle() {
    if (styleEl && styleEl.isConnected) return styleEl;
    styleEl = document.createElement('style');
    styleEl.id = 'sitefilter-style';
    (document.head || document.documentElement).appendChild(styleEl);
    return styleEl;
  }

  function hiddenCss(selector) {
    if (peek) {
      return `${selector}{outline:2px dashed #e5484d!important;outline-offset:-2px!important;opacity:.55!important;}`;
    }
    if (settings.display === 'dim') {
      return `${selector}{opacity:.12!important;filter:grayscale(1)!important;transition:opacity .15s!important;}` +
        `${selector}:hover{opacity:.7!important;}`;
    }
    return `${selector}{display:none!important;}`;
  }

  function adSelectors() {
    if (!matcher || !matcher.hideAds) return [];
    return [...GENERIC_ADS, ...((PRESET && PRESET.ads) || [])];
  }

  function validSelectors(list) {
    return list.filter((sel) => {
      try { document.createDocumentFragment().querySelector(sel); return true; } catch { return false; }
    });
  }

  function writeStyle() {
    const parts = [];
    if (matcher && matcher.active) {
      parts.push(hiddenCss(`[${ATTR}="hidden"]`));
      const extra = validSelectors([...adSelectors(), ...matcher.rule.selectors]);
      if (extra.length) parts.push(hiddenCss(extra.join(',\n')));
    }
    ensureStyle().textContent = parts.join('\n');
  }

  /* ---------- card detection ---------- */

  const SKIP_ANCESTORS = 'nav, header, footer, [role="navigation"], [role="banner"], [role="contentinfo"], #sitefilter-picker';

  function signature(el) {
    const cls = [...el.classList].filter((c) => !/^(is-|has-)?(active|selected|hover|focus|visible|hidden|first|last|odd|even)$/i.test(c)).sort().slice(0, 3);
    return el.tagName + (cls.length ? '.' + cls.join('.') : '');
  }

  function repeatingCount(parent, cache) {
    let counts = cache.get(parent);
    if (!counts) {
      counts = new Map();
      for (const child of parent.children) {
        const s = signature(child);
        counts.set(s, (counts.get(s) || 0) + 1);
      }
      cache.set(parent, counts);
    }
    return counts;
  }

  function autoCards() {
    const cache = new Map();
    const found = new Set();
    const anchors = document.querySelectorAll('a[href]');
    const limit = Math.min(anchors.length, 4000);
    for (let i = 0; i < limit; i++) {
      const a = anchors[i];
      if (a.closest(SKIP_ANCESTORS)) continue;
      let el = a;
      for (let depth = 0; depth < 8; depth++) {
        const parent = el.parentElement;
        if (!parent || parent === document.body || parent === document.documentElement) break;
        const counts = repeatingCount(parent, cache);
        const same = counts.get(signature(el)) || 0;
        if (same >= 3 && same * 2 >= parent.children.length) {
          if ((el.textContent || '').trim().length >= 20) found.add(el);
          break;
        }
        el = parent;
      }
    }
    // Keep the outermost card when one detected card sits inside another.
    return [...found].filter((card) => {
      for (let p = card.parentElement; p; p = p.parentElement) if (found.has(p)) return false;
      return true;
    });
  }

  function findCards() {
    const selectors = [matcher.rule.cardSelector, PRESET && PRESET.cards].filter(Boolean);
    for (const sel of selectors) {
      try {
        const list = [...document.querySelectorAll(sel)].filter((el) => !el.closest('#sitefilter-picker'));
        if (list.length) return list;
      } catch { /* bad user selector: fall through */ }
    }
    return autoCards();
  }

  /* ---------- card data ---------- */

  function cardText(card) {
    const out = [];
    const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const p = node.parentElement;
        if (p && (p.tagName === 'SCRIPT' || p.tagName === 'STYLE' || p.tagName === 'NOSCRIPT')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let len = 0;
    while (walker.nextNode() && len < 4000) {
      const v = walker.currentNode.nodeValue.trim();
      if (v) { out.push(v); len += v.length + 1; }
    }
    // alt/title/aria-label often carry the title on image-only cards
    for (const el of card.querySelectorAll('img[alt], [title], [aria-label]')) {
      const v = el.getAttribute('alt') || el.getAttribute('title') || el.getAttribute('aria-label');
      if (v && len < 4000) { out.push(v); len += v.length + 1; }
    }
    return out.join(' ');
  }

  function cardLinks(card) {
    const anchors = card.tagName === 'A' ? [card, ...card.querySelectorAll('a[href]')] : card.querySelectorAll('a[href]');
    const links = [];
    for (const a of anchors) {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || /^javascript:/i.test(href)) continue;
      const l = SF.normalizeLink(href, location.href);
      if (l && !links.includes(l)) links.push(l);
      if (links.length >= 6) break;
    }
    return links;
  }

  function cardBadges(card) {
    if (!matcher.sponsored) return [];
    const badges = [];
    for (const el of card.querySelectorAll('span, div, small, b, strong, em, i, p, label, mark')) {
      if (el.children.length > 1) continue;
      const v = (el.textContent || '').trim();
      if (v && v.length <= 24) badges.push(v);
      if (badges.length > 60) break;
    }
    for (const el of card.querySelectorAll('[class*="vip" i], [class*="premium" i], [class*="sponsor" i], [class*="promot" i], [class*="featured" i]')) {
      badges.push(/vip/i.test(el.className) ? 'vip' : /premium/i.test(el.className) ? 'premium' : 'sponsored');
      break;
    }
    if (/\b(vip|premium|sponsor|promoted|featured)/i.test(typeof card.className === 'string' ? card.className : '')) badges.push('sponsored');
    return badges;
  }

  function priceHint(card) {
    const el = card.querySelector('[itemprop="price"], [class*="price" i], [data-testid*="price" i], [data-test-id*="price" i], [class*="fiyat" i], [class*="qiymet" i]');
    if (!el) return '';
    return el.getAttribute('content') || el.textContent || '';
  }

  /* ---------- apply ---------- */

  function unmarkAll() {
    for (const el of marked) { el.removeAttribute(ATTR); el.removeAttribute(WHY); }
    marked = new Set();
  }

  function run() {
    scheduled = 0;
    if (!settings) return;
    writeStyle();
    const next = new Set();
    const reasons = {};
    let cards = [];
    if (matcher.active) {
      cards = findCards();
      for (const card of cards) {
        const verdict = matcher.evaluate({
          text: cardText(card),
          links: cardLinks(card),
          badges: cardBadges(card),
          priceHint: priceHint(card)
        });
        if (!verdict) continue;
        next.add(card);
        reasons[verdict.reason] = (reasons[verdict.reason] || 0) + 1;
        if (card.getAttribute(ATTR) !== 'hidden') card.setAttribute(ATTR, 'hidden');
        const why = verdict.detail ? `${verdict.reason}: ${verdict.detail}` : verdict.reason;
        if (card.getAttribute(WHY) !== why) card.setAttribute(WHY, why);
      }
    }
    for (const el of marked) if (!next.has(el)) { el.removeAttribute(ATTR); el.removeAttribute(WHY); }
    marked = next;

    let ads = 0;
    if (matcher.active) {
      const sels = validSelectors([...adSelectors(), ...matcher.rule.selectors]);
      if (sels.length) {
        try { ads = document.querySelectorAll(sels.join(',')).length; } catch { ads = 0; }
      }
    }
    const changed = stats.listings !== next.size || stats.ads !== ads;
    stats = { listings: next.size, ads, cards: cards.length, reasons };
    if (changed) report();
  }

  function report() {
    try {
      chrome.runtime.sendMessage({ type: 'sf:count', count: matcher.active ? stats.listings + stats.ads : -1 });
    } catch { /* extension reloaded; this script is orphaned */ }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = setTimeout(run, 250);
  }

  async function reload() {
    try {
      settings = await SF.load();
    } catch { return; }
    matcher = SF.buildMatcher(settings, HOST);
    if (!matcher.active) unmarkAll();
    run();
    report();
  }

  const observer = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === 'childList' && (r.addedNodes.length || r.removedNodes.length)) {
        const target = r.target;
        if (target === styleEl || (target.closest && target.closest('#sitefilter-picker'))) continue;
        schedule();
        return;
      }
    }
  });

  function start() {
    observer.observe(document.documentElement, { childList: true, subtree: true });
    reload();
    // SPA navigations (history.pushState) don't reload the script.
    let lastUrl = location.href;
    setInterval(() => { if (location.href !== lastUrl) { lastUrl = location.href; schedule(); } }, 800);
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[SF.STORAGE_KEY]) reload();
  });

  /* ---------- element picker ---------- */

  let picker = null;

  function cssEscape(s) { return window.CSS && CSS.escape ? CSS.escape(s) : s.replace(/[^\w-]/g, '\\$&'); }

  function stableClasses(el) {
    return [...el.classList].filter((c) => c.length < 40 && !/\d{3,}|^(is-|has-)?(active|selected|hover|focus|open)$/i.test(c));
  }

  function uniqueSelector(el) {
    const parts = [];
    for (let node = el; node && node.nodeType === 1 && node !== document.documentElement; node = node.parentElement) {
      if (node.id && !/\d{3,}/.test(node.id)) { parts.unshift('#' + cssEscape(node.id)); break; }
      let part = node.tagName.toLowerCase();
      const cls = stableClasses(node).slice(0, 2);
      if (cls.length) part += '.' + cls.map(cssEscape).join('.');
      const parent = node.parentElement;
      if (parent) {
        const same = [...parent.children].filter((c) => c.tagName === node.tagName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`;
      }
      parts.unshift(part);
      if (parts.length >= 6) break;
    }
    return parts.join(' > ');
  }

  function similarSelector(el) {
    const cls = stableClasses(el).slice(0, 3);
    if (!cls.length) return null;
    const own = el.tagName.toLowerCase() + '.' + cls.map(cssEscape).join('.');
    const parent = el.parentElement;
    const pcls = parent ? stableClasses(parent).slice(0, 2) : [];
    return pcls.length ? `${parent.tagName.toLowerCase()}.${pcls.map(cssEscape).join('.')} > ${own}` : own;
  }

  function cardFor(el) {
    const cards = findCards();
    return cards.find((c) => c === el || c.contains(el)) || null;
  }

  function startPicker() {
    if (picker) return;
    const host = document.createElement('div');
    host.id = 'sitefilter-picker';
    host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;';
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host{all:initial}
        .box{position:fixed;pointer-events:none;border:2px solid #ffb000;background:rgba(255,176,0,.14);border-radius:3px;transition:all .06s linear;box-shadow:0 0 0 99999px rgba(10,10,12,.18)}
        .tag{position:fixed;pointer-events:none;font:600 11px/1.6 ui-monospace,Menlo,Consolas,monospace;background:#16161a;color:#ffb000;padding:1px 6px;border-radius:3px;max-width:60vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .bar{position:fixed;left:50%;top:12px;transform:translateX(-50%);width:max-content;max-width:min(92vw,760px);pointer-events:auto;font:500 13px/1.4 system-ui,sans-serif;background:#16161a;color:#eee;padding:8px 12px;border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.35);display:flex;gap:10px;align-items:center}
        .bar b{color:#ffb000}
        .menu{position:fixed;pointer-events:auto;font:500 13px/1.3 system-ui,sans-serif;background:#16161a;color:#eee;border:1px solid #333;border-radius:10px;padding:6px;min-width:240px;box-shadow:0 12px 32px rgba(0,0,0,.45);display:none}
        .menu button{display:block;width:100%;text-align:left;background:none;border:0;color:inherit;font:inherit;padding:8px 10px;border-radius:6px;cursor:pointer}
        .menu button:hover,.menu button:focus-visible{background:#2a2a30;outline:none}
        .menu button.primary{color:#ffb000}
        .menu small{display:block;color:#999;font-size:11px;margin-top:2px}
        .x{white-space:nowrap;flex:none;background:#2a2a30;border:0;color:#eee;border-radius:5px;padding:3px 8px;cursor:pointer;font:inherit}
      </style>
      <div class="box"></div><div class="tag"></div>
      <div class="bar"><span>${esc(SF.t('pickerHint'))}</span><button class="x" data-act="cancel">${esc(SF.t('cancel'))} (Esc)</button></div>
      <div class="menu" role="menu"></div>`;
    document.documentElement.appendChild(host);
    const box = shadow.querySelector('.box');
    const tag = shadow.querySelector('.tag');
    const menu = shadow.querySelector('.menu');
    let target = null;
    let base = null;
    let locked = false;

    function show(el) {
      target = el;
      const r = el.getBoundingClientRect();
      Object.assign(box.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
      tag.textContent = similarSelector(el) || el.tagName.toLowerCase();
      Object.assign(tag.style, { left: Math.max(4, r.left) + 'px', top: Math.max(4, r.top - 20) + 'px' });
    }

    function onMove(e) {
      if (locked) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || el === host || el === document.documentElement || el === document.body) return;
      base = el;
      show(el);
    }

    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); stop(); return; }
      if (locked || !target) return;
      if (e.key === 'ArrowUp' && target.parentElement && target.parentElement !== document.body) { e.preventDefault(); show(target.parentElement); }
      if (e.key === 'ArrowDown' && base && target !== base && target.contains(base)) {
        e.preventDefault();
        let el = base;
        while (el.parentElement && el.parentElement !== target) el = el.parentElement;
        show(el);
      }
    }

    function block(e) {
      if (e.composedPath().includes(host)) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }

    function onClick(e) {
      if (e.composedPath().includes(host)) return;
      block(e);
      if (!target) return;
      locked = true;
      openMenu(e.clientX, e.clientY);
    }

    function openMenu(x, y) {
      const card = cardFor(target);
      const links = card ? cardLinks(card) : cardLinks(target);
      const similar = similarSelector(target);
      const items = [];
      if (links.length) items.push({ act: 'link', label: SF.t('pickHideListing'), note: links[0], primary: true });
      items.push({ act: 'one', label: SF.t('pickHideElement'), note: uniqueSelector(target) });
      if (similar) items.push({ act: 'similar', label: SF.t('pickHideSimilar'), note: similar });
      if (similar) items.push({ act: 'card', label: SF.t('pickTeachCard'), note: similar });
      items.push({ act: 'back', label: SF.t('pickBack') });
      menu.innerHTML = items.map((it) => `<button data-act="${it.act}" class="${it.primary ? 'primary' : ''}">${esc(it.label)}${it.note ? `<small>${esc(it.note)}</small>` : ''}</button>`).join('');
      menu.style.display = 'block';
      const w = 300, h = items.length * 46 + 12;
      menu.style.left = Math.min(x, innerWidth - w - 8) + 'px';
      menu.style.top = Math.min(y, innerHeight - h - 8) + 'px';
      menu._ctx = { links, unique: uniqueSelector(target), similar };
      const first = menu.querySelector('button');
      if (first) first.focus();
    }

    shadow.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === 'cancel') { stop(); return; }
      if (act === 'back') { menu.style.display = 'none'; locked = false; return; }
      const ctx = menu._ctx || {};
      await SF.updateSite(HOST, (rule) => {
        if (act === 'link' && ctx.links[0]) rule.hiddenLinks.push(ctx.links[0]);
        if (act === 'one') rule.selectors.push(ctx.unique);
        if (act === 'similar' && ctx.similar) rule.selectors.push(ctx.similar);
        if (act === 'card' && ctx.similar) rule.cardSelector = ctx.similar;
      });
      stop();
    });

    const opts = { capture: true };
    document.addEventListener('mousemove', onMove, opts);
    document.addEventListener('keydown', onKey, opts);
    document.addEventListener('click', onClick, opts);
    for (const t of ['mousedown', 'mouseup', 'pointerdown', 'pointerup', 'auxclick', 'contextmenu']) document.addEventListener(t, block, opts);

    function stop() {
      document.removeEventListener('mousemove', onMove, opts);
      document.removeEventListener('keydown', onKey, opts);
      document.removeEventListener('click', onClick, opts);
      for (const t of ['mousedown', 'mouseup', 'pointerdown', 'pointerup', 'auxclick', 'contextmenu']) document.removeEventListener(t, block, opts);
      host.remove();
      picker = null;
    }
    picker = { stop };
  }

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ---------- messages ---------- */

  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (!msg || typeof msg.type !== 'string') return;
    if (msg.type === 'sf:state') {
      reply({ host: HOST, preset: PRESET ? PRESET.name : null, peek, active: !!(matcher && matcher.active), ...stats });
    } else if (msg.type === 'sf:peek') {
      peek = !!msg.on;
      writeStyle();
      reply({ peek });
    } else if (msg.type === 'sf:pick') {
      startPicker();
      reply({ ok: true });
    } else if (msg.type === 'sf:rescan') {
      run();
      reply({ ...stats });
    }
  });

  start();
})();
