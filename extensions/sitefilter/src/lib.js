/* SiteFilter shared core: storage, text normalisation, rule matching, price parsing.
 * Loaded as a classic script by the content script, popup, options page and service worker,
 * and by the Node tests through vm. Everything hangs off globalThis.SiteFilter. */
(function (root) {
  'use strict';

  const STORAGE_KEY = 'sf';

  const DEFAULT_SPONSOR_LABELS = [
    'sponsored', 'sponsorlu', 'sponsor', 'promoted', 'reklam', 'reklama', 'реклама',
    'vip', 'premium', 'öne çıkan', 'one cikan', 'doping', 'irəli çəkilib', 'irəli çəkilmiş',
    'продвигается', 'топ', 'ad'
  ];

  const DEFAULTS = Object.freeze({
    version: 1,
    enabled: true,
    display: 'hide',          // 'hide' | 'dim'
    hideAds: true,            // generic ad slots (adsbygoogle, gpt, yandex rtb ...)
    hideSponsored: false,     // listings carrying a sponsor / VIP badge
    globalKeywords: [],
    sponsorLabels: DEFAULT_SPONSOR_LABELS,
    sites: {}
  });

  const SITE_DEFAULTS = Object.freeze({
    enabled: true,
    mode: 'block',            // 'block' = hide matches · 'only' = show only matches of `allow`
    keywords: [],
    allow: [],
    priceMin: null,
    priceMax: null,
    hiddenLinks: [],
    selectors: [],
    cardSelector: '',
    ads: null,                // null → inherit global hideAds
    sponsored: null           // null → inherit global hideSponsored
  });

  const clone = (v) => JSON.parse(JSON.stringify(v));

  function normalizeSettings(raw) {
    const s = Object.assign(clone(DEFAULTS), raw && typeof raw === 'object' ? raw : {});
    s.display = s.display === 'dim' ? 'dim' : 'hide';
    s.globalKeywords = cleanList(s.globalKeywords);
    s.sponsorLabels = Array.isArray(s.sponsorLabels) ? cleanList(s.sponsorLabels) : DEFAULT_SPONSOR_LABELS.slice();
    const sites = {};
    for (const [host, rule] of Object.entries(s.sites || {})) {
      const key = siteKey(host);
      if (key) sites[key] = normalizeSite(rule);
    }
    s.sites = sites;
    return s;
  }

  function normalizeSite(raw) {
    const r = Object.assign(clone(SITE_DEFAULTS), raw && typeof raw === 'object' ? raw : {});
    r.enabled = r.enabled !== false;
    r.mode = r.mode === 'only' ? 'only' : 'block';
    r.keywords = cleanList(r.keywords);
    r.allow = cleanList(r.allow);
    r.hiddenLinks = cleanList(r.hiddenLinks);
    r.selectors = cleanList(r.selectors);
    r.cardSelector = typeof r.cardSelector === 'string' ? r.cardSelector.trim() : '';
    r.priceMin = toNumberOrNull(r.priceMin);
    r.priceMax = toNumberOrNull(r.priceMax);
    r.ads = typeof r.ads === 'boolean' ? r.ads : null;
    r.sponsored = typeof r.sponsored === 'boolean' ? r.sponsored : null;
    return r;
  }

  function cleanList(list) {
    if (!Array.isArray(list)) return [];
    const seen = new Set();
    const out = [];
    for (const item of list) {
      const v = String(item ?? '').trim();
      if (!v || seen.has(v)) continue;
      seen.add(v);
      out.push(v);
    }
    return out;
  }

  function toNumberOrNull(v) {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(String(v).replace(/[\s ]/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  /* ---------- hosts ---------- */

  function siteKey(host) {
    return String(host || '').trim().toLowerCase().replace(/^\.+|\.+$/g, '').replace(/^www\d?\./, '');
  }

  function hostFromUrl(url) {
    try {
      const u = new URL(url);
      if (!/^https?:$/.test(u.protocol)) return '';
      return siteKey(u.hostname);
    } catch { return ''; }
  }

  /* The rule for m.tap.az is the one saved for m.tap.az, else tap.az. */
  function findSiteKey(settings, host) {
    let h = siteKey(host);
    while (h) {
      if (settings.sites[h]) return h;
      const dot = h.indexOf('.');
      if (dot < 0 || h.indexOf('.', dot + 1) < 0) break; // stop at the registrable-ish domain
      h = h.slice(dot + 1);
    }
    return null;
  }

  function siteRule(settings, host) {
    const key = findSiteKey(settings, host);
    return key ? settings.sites[key] : normalizeSite({});
  }

  /* ---------- text ---------- */

  function norm(text) {
    return String(text ?? '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ə/g, 'e')
      .replace(/ё/g, 'е')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const BOUNDARY = '[\\p{L}\\p{N}]';
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  /* Keyword syntax
   *   word            substring, case/diacritic-insensitive (kırık matches "KIRIK", "kirik")
   *   "word"          whole word only
   *   a & b           every part must match
   *   /regex/flags    raw JavaScript regex on the original text (case-insensitive by default) */
  function compileKeyword(raw) {
    const k = String(raw ?? '').trim();
    if (!k) return null;
    const re = /^\/(.+)\/([a-z]*)$/s.exec(k);
    if (re) {
      try {
        const flags = re[2].includes('i') ? re[2] : re[2] + 'i';
        const rx = new RegExp(re[1], flags.replace(/[gy]/g, ''));
        return { raw: k, test: (_n, original) => rx.test(original) };
      } catch { return null; }
    }
    if (k.includes('&')) {
      const parts = k.split('&').map(compileKeyword).filter(Boolean);
      if (!parts.length) return null;
      return { raw: k, test: (n, o) => parts.every((p) => p.test(n, o)) };
    }
    const quoted = /^"(.+)"$/.exec(k);
    if (quoted) {
      const needle = norm(quoted[1]);
      if (!needle) return null;
      const rx = new RegExp(`(?<!${BOUNDARY})${escapeRe(needle)}(?!${BOUNDARY})`, 'u');
      return { raw: k, test: (n) => rx.test(n) };
    }
    const needle = norm(k);
    if (!needle) return null;
    return { raw: k, test: (n) => n.includes(needle) };
  }

  function compileList(list) {
    return (list || []).map(compileKeyword).filter(Boolean);
  }

  function firstMatch(compiled, normText, originalText) {
    for (const c of compiled) if (c.test(normText, originalText)) return c.raw;
    return null;
  }

  /* ---------- prices ---------- */

  const CUR = '(?:₼|\\$|€|£|₺|₽|₸|₴|azn|tl|try|usd|eur|gbp|rub|man\\.?|manat|руб\\.?|₾|gel)';
  const NUM = '(\\d{1,3}(?:[ .,\\u00a0\\u202f\\u2009]\\d{3})+|\\d+)(?:[.,](\\d{1,2}))?';
  const PRICE_AFTER = new RegExp(`${NUM}\\s*${CUR}(?![\\p{L}])`, 'iu');
  const PRICE_BEFORE = new RegExp(`(?<![\\p{L}])${CUR}\\s*${NUM}`, 'iu');
  const PLAIN_NUM = new RegExp(NUM);

  function toAmount(intPart, decPart) {
    const n = Number(String(intPart).replace(/[^\d]/g, '') + (decPart ? '.' + decPart : ''));
    return Number.isFinite(n) ? n : null;
  }

  /* Price from text that mentions a currency. `priceHint` is text from a price-looking element,
   * where a bare number is accepted. Returns a number or null. */
  function parsePrice(text, priceHint) {
    if (priceHint) {
      const hint = String(priceHint);
      const m = PRICE_AFTER.exec(hint) || PRICE_BEFORE.exec(hint) || PLAIN_NUM.exec(hint);
      if (m) return toAmount(m[1], m[2]);
    }
    const t = String(text ?? '');
    const a = PRICE_AFTER.exec(t);
    const b = PRICE_BEFORE.exec(t);
    const m = a && b ? (a.index <= b.index ? a : b) : (a || b);
    return m ? toAmount(m[1], m[2]) : null;
  }

  /* ---------- links ---------- */

  const TRACKING = /^(utm_\w+|ref|ref_|fbclid|gclid|yclid|_ga|mc_\w+|from|source|spm|sp_\w+|pf_rd_\w+|pd_rd_\w+|qid|sr|crid|sprefix)$/i;

  function normalizeLink(href, base) {
    try {
      const u = new URL(href, base);
      if (!/^https?:$/.test(u.protocol)) return '';
      for (const key of [...u.searchParams.keys()]) if (TRACKING.test(key)) u.searchParams.delete(key);
      u.hash = '';
      const path = u.pathname.replace(/\/+$/, '') || '/';
      const search = u.searchParams.toString();
      return `${siteKey(u.hostname)}${path}${search ? '?' + search : ''}`;
    } catch { return ''; }
  }

  /* ---------- evaluation ---------- */

  /* Builds a matcher once per settings change; `evaluate` runs per card. */
  function buildMatcher(settings, host) {
    const rule = siteRule(settings, host);
    const block = compileList([...settings.globalKeywords, ...rule.keywords]);
    const allow = compileList(rule.allow);
    const sponsorSet = new Set(settings.sponsorLabels.map(norm).filter(Boolean));
    const links = new Set(rule.hiddenLinks.map((l) => normalizeLink(/^https?:/i.test(l) ? l : 'https://' + l)).filter(Boolean));
    const sponsored = rule.sponsored ?? settings.hideSponsored;
    const active = settings.enabled && rule.enabled;
    const onlyMode = rule.mode === 'only' && allow.length > 0;
    const usesPrice = rule.priceMin !== null || rule.priceMax !== null;

    function evaluate(card) {
      if (!active) return null;
      if (card.links && links.size) {
        for (const l of card.links) if (links.has(l)) return { reason: 'link', detail: l };
      }
      const original = card.text || '';
      const n = norm(original);
      const hit = firstMatch(block, n, original);
      if (hit) return { reason: 'keyword', detail: hit };
      if (onlyMode && !firstMatch(allow, n, original)) return { reason: 'only', detail: '' };
      if (sponsored && card.badges && card.badges.some((b) => sponsorSet.has(norm(b)))) {
        return { reason: 'sponsored', detail: card.badges.find((b) => sponsorSet.has(norm(b))) };
      }
      if (usesPrice) {
        const price = card.price !== undefined ? card.price : parsePrice(original, card.priceHint);
        if (price !== null) {
          if (rule.priceMin !== null && price < rule.priceMin) return { reason: 'price', detail: String(price) };
          if (rule.priceMax !== null && price > rule.priceMax) return { reason: 'price', detail: String(price) };
        }
      }
      return null;
    }

    return {
      active,
      rule,
      hideAds: active && (rule.ads ?? settings.hideAds),
      sponsored: active && sponsored,
      sponsorSet,
      evaluate
    };
  }

  /* ---------- storage (extension contexts only) ---------- */

  async function load() {
    const got = await chrome.storage.local.get(STORAGE_KEY);
    return normalizeSettings(got[STORAGE_KEY]);
  }

  async function save(settings) {
    await chrome.storage.local.set({ [STORAGE_KEY]: normalizeSettings(settings) });
  }

  /* Read-modify-write on the rule for `host`, creating it when missing. */
  async function updateSite(host, mutate) {
    const settings = await load();
    const key = findSiteKey(settings, host) || siteKey(host);
    if (!key) return settings;
    const rule = settings.sites[key] ? settings.sites[key] : normalizeSite({});
    mutate(rule, settings);
    settings.sites[key] = normalizeSite(rule);
    await save(settings);
    return settings;
  }

  function t(key, subs) {
    try {
      const m = root.chrome && chrome.i18n && chrome.i18n.getMessage(key, subs);
      if (m) return m;
    } catch { /* not in an extension context */ }
    return key;
  }

  root.SiteFilter = {
    STORAGE_KEY, DEFAULTS, SITE_DEFAULTS, DEFAULT_SPONSOR_LABELS,
    normalizeSettings, normalizeSite, cleanList,
    siteKey, hostFromUrl, findSiteKey, siteRule,
    norm, compileKeyword, compileList, firstMatch,
    parsePrice, normalizeLink, buildMatcher,
    load, save, updateSite, t
  };
})(globalThis);
