// Luna Comics app shell: query-based routes that survive refresh on a static host.
//   /Luna                       vitrin + kataloq
//   /Luna?eser=<slug>           əsər səhifəsi
//   /Luna?oxu=<slug>&s=<leaf>   oxucu (s = 0 üz qabığı, 1.. səhifələr, sonuncu kreditlər / önizləmənin sonu)
//   /Luna?bolme=kitabxana       kitabxana
//   /Luna?bolme=hesab           hesab
import './luna.css';
import { titles, bySlug, LANGUAGES, ACCESS, coverSrc, pageSrc, attribution, whatsappUrl } from './catalogue.js';
import { buildLeaves, filterTitles, genresOf, progressLabel, clampIndex } from './core.js';
import { h, icon, jacket, accessBadge, priceText, toast } from './ui.js';
import { openReader } from './reader.js';
import * as store from './store.js';
import * as acct from './account.js';

const main = document.getElementById('luna-main');
const readerMount = document.getElementById('luna-reader');
const dialog = document.getElementById('luna-inquiry');
let reader = null, lastFocus = null;
const filters = { q: '', access: 'all', language: 'all', genre: 'all' };

// ---------- Routing ----------
function route() {
  const p = new URLSearchParams(location.search);
  if (p.has('oxu')) return { view: 'reader', slug: p.get('oxu'), s: p.get('s') };
  if (p.has('eser')) return { view: 'detail', slug: p.get('eser') };
  const b = p.get('bolme');
  if (b === 'kitabxana') return { view: 'library' };
  if (b === 'hesab') return { view: 'account' };
  return { view: 'shop' };
}
function go(url, { replace = false } = {}) {
  const st = { luna: true, from: location.pathname + location.search };
  if (replace) history.replaceState(st, '', url); else history.pushState(st, '', url);
  render({ fresh: true });
}
document.addEventListener('click', e => {
  const a = e.target.closest('a[data-nav]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const url = new URL(a.href, location.href);
  if (url.pathname !== '/Luna' && url.pathname !== '/Luna/') return;
  e.preventDefault();
  if (url.hash && !url.search && route().view === 'shop') { document.getElementById(url.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }); return; }
  go(url.pathname.replace(/\/$/, '') + url.search + url.hash);
});
addEventListener('popstate', () => render({ fresh: true }));

const urlFor = {
  detail: t => `/Luna?eser=${encodeURIComponent(t.slug)}`,
  read: (t, s) => `/Luna?oxu=${encodeURIComponent(t.slug)}${s ? `&s=${s}` : ''}`,
};

function render({ fresh = false } = {}) {
  const r = route();
  updateNav(r.view);
  if (r.view === 'reader') return showReader(r);
  closeReader();
  document.body.classList.remove('is-reading');
  const view = r.view === 'detail' ? detailView(r.slug) : r.view === 'library' ? libraryView() : r.view === 'account' ? accountView() : shopView();
  main.replaceChildren(view);
  document.title = view.dataset.title || 'Luna Comics: oxu, səhifəni çevir';
  if (fresh) {
    if (location.hash && r.view === 'shop') requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
    else { scrollTo(0, 0); main.focus({ preventScroll: true }); }
  }
}
function updateNav(view) {
  document.querySelectorAll('.mast-nav a').forEach(a => a.toggleAttribute('aria-current', a.dataset.view === view));
  const count = new Set([...store.savedSlugs()].filter(s => bySlug.has(s))).size;
  const c = document.getElementById('lib-count');
  c.hidden = !count; c.textContent = count;
  const a = acct.account();
  document.getElementById('account-link').textContent = a.status === 'signed-in' ? 'Hesabım' : 'Daxil ol';
}

// ---------- Shared pieces ----------
function titleCard(t) {
  const prog = store.getProgress(t.slug, buildLeaves(t).length);
  return h('li', { class: 'card' },
    h('a', { class: 'card-link', href: urlFor.detail(t), 'data-nav': true, 'aria-label': `${t.title}, ${t.series} bölüm ${t.episode}` }, jacket(t)),
    h('div', { class: 'card-meta' },
      accessBadge(t),
      h('h3', { lang: t.language === 'ru' ? 'ru' : 'en' }, h('a', { href: urlFor.detail(t), 'data-nav': true, text: t.title, tabindex: '-1' })),
      h('p', { class: 'card-facts', text: `${t.creator}. ${LANGUAGES[t.language]}, ${t.access === 'sample' ? `${t.previewPages} / ${t.storyPages} səhifə önizləmə` : `${t.storyPages} səhifə`}` }),
      h('p', { class: 'card-genres', text: t.genres.join(', ') }),
      prog && prog.i > 0 ? h('p', { class: 'card-progress', text: progressLabel(prog, buildLeaves(t)) }) : null));
}
function readAction(t, cls = 'btn btn-lantern') {
  const leaves = buildLeaves(t);
  const prog = store.getProgress(t.slug, leaves.length);
  if (prog && prog.i > 0 && !prog.done) {
    const leaf = leaves[prog.i];
    return h('a', { class: cls, href: urlFor.read(t, prog.i), 'data-nav': true }, icon('book'), `Davam et: ${leaf.kind === 'page' ? `səhifə ${leaf.n}` : leaf.label.toLowerCase()}`);
  }
  return h('a', { class: cls, href: urlFor.read(t, 0), 'data-nav': true }, icon('book'), t.access === 'sample' ? `Önizləməni oxu (${t.previewPages} səhifə)` : prog?.done ? 'Yenidən oxu' : 'Oxumağa başla');
}
function saveButton(t) {
  const saved = store.isSaved(t.slug);
  const btn = h('button', { class: `btn btn-quiet${saved ? ' is-saved' : ''}`, type: 'button', 'aria-pressed': String(saved) },
    icon(saved ? 'check' : 'bookmark'), saved ? 'Kitabxanadadır' : 'Kitabxanaya əlavə et');
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    const on = !store.isSaved(t.slug);
    try {
      await store.setSaved(t.slug, on);
      toast(on ? `“${t.title}” kitabxanaya əlavə edildi. ${storageNote(true)}` : `“${t.title}” kitabxanadan çıxarıldı.`);
    } catch { toast('Kitabxana yenilənmədi: hesab sinxronizasiyası cavab vermədi. Yenidən cəhd edin.', 'error'); }
    render();
  });
  return btn;
}
function storageNote(short = false) {
  const a = acct.account();
  if (store.storageMode() === 'account') return short ? 'Hesabınızla sinxronlaşdırıldı.' : 'Kitabxana və oxu yeri hesabınızla sinxronlaşdırılır və digər cihazlarda da görünür.';
  if (a.status === 'signed-in') return short ? 'Yalnız bu cihazda saxlanıldı.' : 'Hesabınız aktivdir, amma sinxronizasiya hələ quraşdırılmayıb: kitabxana və oxu yeri yalnız bu brauzerdə saxlanılır.';
  return short ? 'Yalnız bu cihazda saxlanıldı.' : 'Hesabsız kitabxana və oxu yeri yalnız bu brauzerdə saxlanılır. Cihazlar arasında saxlamaq üçün daxil olun.';
}

// ---------- Shop ----------
function shopView() {
  const hero = titles.find(t => t.slug === 'pepper-carrot-01');
  const night = bySlug.get('pepper-carrot-11');
  const continuing = store.progressSlugs().map(s => bySlug.get(s)).filter(t => t && (() => { const p = store.getProgress(t.slug, buildLeaves(t).length); return p.i > 0 && !p.done; })());
  const view = h('div', { class: 'shop', 'data-title': 'Luna Comics: oxu, səhifəni çevir' },
    h('section', { class: 'hero' },
      h('div', { class: 'hero-copy' },
        h('h1', { class: 'hero-title', text: 'Səhifəni çevir, hekayə davam etsin.' }),
        h('p', { class: 'hero-lead', text: 'Luna açıq lisenziyalı komikslər üçün kiçik bir kitab mağazasıdır. Pulsuz bölümləri qeydiyyatsız oxuyun: kompüterdə açıq kitab kimi, telefonda bir səhifə, hər çevirişdə kağız hissi.' }),
        h('div', { class: 'hero-actions' },
          h('a', { class: 'btn btn-lantern', href: urlFor.read(hero, 0), 'data-nav': true }, icon('book'), 'Birinci bölümü oxu'),
          h('a', { class: 'btn btn-ghost', href: '/Luna#kataloq', 'data-nav': true, text: 'Bütün kataloq' })),
        h('p', { class: 'hero-note', text: `${titles.filter(t => t.access === 'free').length} pulsuz bölüm, ${titles.filter(t => t.access === 'sample').length} nümunə məhsul. Mətnlər orijinal dildədir, dil hər əsərin üstündə yazılıb.` })),
      h('a', { class: 'hero-book', href: urlFor.detail(night), 'data-nav': true, 'aria-label': `${night.title}: əsər səhifəsi` },
        h('div', { class: 'hero-spread' },
          h('div', { class: 'hero-page hero-page-l' }, jacket(night, { small: false, eager: true })),
          h('div', { class: 'hero-page hero-page-r' }, h('img', { src: pageSrc(night, night.pages[0]), alt: '', width: 1200, height: 1660, loading: 'eager', decoding: 'async' }))),
        h('span', { class: 'hero-caption', text: `${night.title}, səhifə 1. Önizləməni açın.` }))),
    continuing.length ? shelf('Oxumağa davam et', 'Qaldığınız yerdən açılır.', continuing, 'davam') : null,
    shelf('Pepper&Carrot ilə tanışlıq', 'Cadı Pepper və pişiyi Carrot haqqında ilk bölümlər, ardıcıllıqla.', titles.filter(t => t.featured && t.access === 'free'), 'secim'),
    catalogueSection());
  return view;
}
function shelf(title, sub, list, id) {
  return h('section', { class: 'shelf', id, 'aria-labelledby': `${id}-h` },
    h('div', { class: 'shelf-head' }, h('h2', { id: `${id}-h`, text: title }), h('p', { text: sub })),
    h('ol', { class: 'shelf-row' }, list.map(titleCard)));
}
function catalogueSection() {
  const grid = h('ol', { class: 'grid' });
  const count = h('p', { class: 'cat-count', role: 'status', 'aria-live': 'polite' });
  const search = h('input', { id: 'cat-q', type: 'search', value: filters.q, autocomplete: 'off', placeholder: 'Ad, personaj, janr, tərcüməçi' });
  const sel = (id, label, key, options) => h('div', { class: 'field' },
    h('label', { for: id, text: label }),
    h('select', { id, onchange: e => { filters[key] = e.target.value; update(); } },
      options.map(([v, t]) => h('option', { value: v, text: t, selected: filters[key] === v }))));
  const reset = h('button', { class: 'btn btn-quiet', type: 'button', text: 'Filtrləri sıfırla', onclick: () => { Object.assign(filters, { q: '', access: 'all', language: 'all', genre: 'all' }); search.value = ''; form.querySelectorAll('select').forEach(s => { s.value = 'all'; }); update(); search.focus(); } });
  const form = h('form', { class: 'filters', role: 'search', onsubmit: e => e.preventDefault() },
    h('div', { class: 'field field-q' }, h('label', { for: 'cat-q', text: 'Axtar' }), search),
    sel('cat-access', 'Giriş', 'access', [['all', 'Hamısı'], ['free', ACCESS.free], ['sample', ACCESS.sample]]),
    sel('cat-lang', 'Mətnin dili', 'language', [['all', 'Bütün dillər'], ...Object.entries(LANGUAGES)]),
    sel('cat-genre', 'Janr', 'genre', [['all', 'Bütün janrlar'], ...genresOf(titles).map(g => [g, g])]));
  search.addEventListener('input', () => { filters.q = search.value; update(); });
  function update() {
    const list = filterTitles(titles, filters, LANGUAGES);
    count.textContent = `${list.length} əsər göstərilir`;
    if (list.length) grid.replaceChildren(...list.map(titleCard));
    else grid.replaceChildren(h('li', { class: 'empty' },
      h('h3', { text: 'Bu seçimə uyğun əsər yoxdur' }),
      h('p', { text: filters.q ? `“${filters.q}” üçün nəticə tapılmadı. Başqa söz yoxlayın və ya filtrləri sıfırlayın: kolleksiyada hazırda ${titles.length} əsər var.` : `Bu filtr birləşməsinə uyğun əsər yoxdur. Kolleksiyada hazırda ${titles.length} əsər var.` }),
      reset));
  }
  update();
  return h('section', { class: 'catalogue', id: 'kataloq', 'aria-labelledby': 'kataloq-h' },
    h('div', { class: 'shelf-head' }, h('h2', { id: 'kataloq-h', text: 'Kataloq' }), h('p', { text: 'Pulsuz bölümlər tam oxunur. Nümunə məhsulların yalnız önizləmə səhifələri saytdadır.' })),
    form, count, grid);
}

// ---------- Detail ----------
function detailView(slug) {
  const t = bySlug.get(slug);
  if (!t) return notFound();
  const leaves = buildLeaves(t);
  const prog = store.getProgress(t.slug, leaves.length);
  const actions = h('div', { class: 'detail-actions' }, readAction(t), saveButton(t));
  const priceBox = t.access === 'sample'
    ? h('div', { class: 'sample-box' },
      h('p', { class: 'sample-price' }, h('strong', { text: priceText(t) }), h('span', { text: 'illüstrativ nümunə qiymət' })),
      h('p', { text: 'Bu nümunə məhsuldur: Luna-nın gələcək ödənişli nəşrlərinin necə təqdim olunacağını göstərir. Satış aktiv deyil, ödəniş qəbul edilmir və heç nə “alınmış” sayılmır.' }),
      h('button', { class: 'btn btn-ember', type: 'button', onclick: () => openInquiry(t) }, icon('wa'), 'WhatsApp-da maraq bildir'),
      h('p', { class: 'small' }, 'Əsərin özü müəllifin saytında ', h('a', { href: t.source.page, rel: 'noopener', target: '_blank', text: 'CC BY 4.0 lisenziyası ilə pulsuz' }), ' mövcuddur.'))
    : h('div', { class: 'free-box' }, h('p', { class: 'sample-price' }, h('strong', { text: 'Pulsuz' }), h('span', { text: 'qeydiyyat tələb olunmur' })));
  const previews = t.pages.slice(0, 2).map((f, k) => h('li', {},
    h('a', { href: urlFor.read(t, k + 1), 'data-nav': true, 'aria-label': `Səhifə ${k + 1}-i oxucuda aç` },
      h('img', { src: pageSrc(t, f), alt: `${t.title}, səhifə ${k + 1}`, width: 1200, height: 1660, loading: 'lazy', decoding: 'async' }))));
  return h('article', { class: 'detail', 'data-title': `${t.title}: Luna Comics` },
    h('nav', { class: 'crumbs', 'aria-label': 'Səhifə yolu' }, h('a', { href: '/Luna', 'data-nav': true, text: 'Vitrin' }), h('span', { 'aria-hidden': 'true', text: '/' }), h('a', { href: '/Luna#kataloq', 'data-nav': true, text: 'Kataloq' })),
    h('div', { class: 'detail-grid' },
      h('div', { class: 'detail-jacket' }, jacket(t, { small: false, eager: true })),
      h('div', { class: 'detail-body' },
        accessBadge(t),
        h('p', { class: 'detail-series', text: `${t.series}, bölüm ${t.episode}` }),
        h('h1', { lang: t.language === 'ru' ? 'ru' : 'en', text: t.title }),
        t.titleNote ? h('p', { class: 'detail-alt' }, 'İngiliscə adı: ', h('span', { lang: 'en', text: t.titleNote })) : null,
        h('p', { class: 'detail-creator', text: `Müəllif: ${t.creator}` }),
        h('p', { class: 'detail-synopsis', text: t.synopsis }),
        priceBox,
        actions,
        prog && prog.i > 0 ? h('p', { class: 'detail-progress', text: `${progressLabel(prog, leaves)}. ${storageNote(true)}` }) : null,
        h('dl', { class: 'facts' },
          fact('Mətnin dili', `${LANGUAGES[t.language]}. ${t.languageNote}`),
          fact('Həcm', t.access === 'sample' ? `${t.storyPages} səhifə; saytda ilk ${t.previewPages} səhifə önizləmə kimi var` : `${t.storyPages} səhifə, üz qabığı və kreditlər`),
          fact('Janr', t.genres.join(', ')),
          fact('İlk nəşr', `${t.year}, peppercarrot.com`),
          fact('Lisenziya', t.license.name)))),
    h('section', { class: 'detail-pages', 'aria-labelledby': 'pages-h' },
      h('h2', { id: 'pages-h', text: 'İlk səhifələr' }),
      h('ol', { class: 'page-strip' }, previews)),
    h('section', { class: 'credits', 'aria-labelledby': 'credits-h' },
      h('h2', { id: 'credits-h', text: 'Müəlliflər, mənbə və lisenziya' }),
      h('dl', { class: 'facts' }, t.credits.map(([r, w]) => fact(r, w))),
      h('p', { text: attribution(t) }),
      t.license.note ? h('p', { class: 'small', text: t.license.note }) : null,
      h('p', { class: 'small' },
        h('a', { href: t.source.page, rel: 'noopener', target: '_blank', text: 'Bölümün orijinal səhifəsi' }), '. ',
        h('a', { href: t.source.files, rel: 'noopener', target: '_blank', text: 'Mənbə faylları' }), '. ',
        h('a', { href: t.license.evidence, rel: 'noopener', target: '_blank', text: 'Müəllifin lisenziya bəyanatı' }), '. ',
        h('a', { href: t.license.url, rel: 'noopener license', target: '_blank', text: t.license.name }), '.')));
}
const fact = (k, v) => h('div', {}, h('dt', { text: k }), h('dd', { text: v }));
function notFound() {
  return h('section', { class: 'empty-page', 'data-title': 'Əsər tapılmadı: Luna Comics' },
    h('h1', { text: 'Bu əsər tapılmadı' }),
    h('p', { text: 'Link köhnə və ya səhv ola bilər. Kataloqda mövcud bütün əsərlərə baxın.' }),
    h('a', { class: 'btn btn-lantern', href: '/Luna#kataloq', 'data-nav': true, text: 'Kataloqa keç' }));
}

// ---------- Library ----------
function libraryView() {
  const saved = store.savedSlugs().map(s => bySlug.get(s)).filter(Boolean);
  const reading = store.progressSlugs().map(s => bySlug.get(s)).filter(t => t && !saved.includes(t));
  const items = [...saved, ...reading];
  const a = acct.account();
  const note = h('p', { class: `store-note store-${store.storageMode()}` }, storageNote());
  const view = h('section', { class: 'library', 'data-title': 'Kitabxanam: Luna Comics' },
    h('h1', { text: 'Kitabxanam' }), note,
    a.status !== 'signed-in' ? h('p', { class: 'small' }, h('a', { href: '/Luna?bolme=hesab', 'data-nav': true, text: 'Daxil olun və ya qeydiyyatdan keçin' }), ' (pulsuz oxu üçün tələb olunmur).') : null);
  if (!items.length) {
    view.append(h('div', { class: 'empty' },
      h('h2', { text: 'Kitabxananız hələ boşdur' }),
      h('p', { text: 'Əsər səhifəsində “Kitabxanaya əlavə et” düyməsini basın. Oxumağa başladığınız bölümlər də burada qaldığınız səhifə ilə görünəcək.' }),
      h('div', { class: 'detail-actions' },
        h('a', { class: 'btn btn-lantern', href: '/Luna#kataloq', 'data-nav': true, text: 'Kataloqa keç' }),
        h('a', { class: 'btn btn-quiet', href: urlFor.read(bySlug.get('pepper-carrot-01'), 0), 'data-nav': true, text: 'Birinci bölümü oxu' }))));
    return view;
  }
  view.append(h('ol', { class: 'lib-list' }, items.map(t => {
    const leaves = buildLeaves(t), p = store.getProgress(t.slug, leaves.length);
    const pct = p ? Math.round((p.i / (leaves.length - 1)) * 100) : 0;
    const bar = h('span', { class: 'lib-bar' }, h('span', { vars: { '--p': `${pct}%` } }));
    return h('li', { class: 'lib-item' },
      h('a', { class: 'lib-cover', href: urlFor.detail(t), 'data-nav': true, 'aria-label': t.title }, jacket(t)),
      h('div', { class: 'lib-body' },
        accessBadge(t),
        h('h2', { lang: t.language === 'ru' ? 'ru' : 'en' }, h('a', { href: urlFor.detail(t), 'data-nav': true, text: t.title })),
        h('p', { class: 'card-facts', text: `${t.series}, bölüm ${t.episode}. ${store.isSaved(t.slug) ? 'Kitabxanada saxlanılıb.' : 'Oxu tarixçəsindən.'}` }),
        h('p', { class: 'lib-prog' }, bar, h('span', { text: p ? progressLabel(p, leaves) : 'Hələ açılmayıb' })),
        h('div', { class: 'detail-actions' }, readAction(t), store.isSaved(t.slug) ? saveButton(t) : null)));
  })));
  return view;
}

// ---------- Account ----------
function accountView() {
  const a = acct.account();
  const view = h('section', { class: 'account', 'data-title': 'Hesab: Luna Comics' });
  if (a.status === 'idle' || a.status === 'loading') {
    view.append(h('h1', { text: 'Hesab' }), h('p', { role: 'status', text: 'Hesab vəziyyəti yoxlanılır…' }));
    return view;
  }
  if (a.status === 'signed-in') {
    const syncText = { checking: 'Sinxronizasiya yoxlanılır…', ready: 'Kitabxana və oxu yeri hesabınızla sinxronlaşdırılır.', missing: 'Sinxronizasiya hələ quraşdırılmayıb (Luna cədvəlləri serverdə yoxdur). Kitabxana və oxu yeri hazırda yalnız bu brauzerdə saxlanılır.', error: 'Sinxronizasiya xidməti cavab vermədi. Kitabxana müvəqqəti olaraq yalnız bu brauzerdə saxlanılır.' }[a.sync] || '';
    const out = h('button', { class: 'btn btn-quiet', type: 'button', text: 'Hesabdan çıx' });
    out.addEventListener('click', async () => { out.disabled = true; out.textContent = 'Çıxılır…'; await acct.signOut(); toast('Hesabdan çıxdınız. Bu cihazda başqa üzvün kitabxanası göstərilmir.'); render(); });
    view.append(h('h1', { text: 'Hesabım' }),
      h('dl', { class: 'facts' }, fact('E-poçt', a.user.email), fact('Sinxronizasiya', syncText)),
      a.message ? h('p', { class: 'store-note', text: a.message }) : null,
      h('div', { class: 'detail-actions' }, h('a', { class: 'btn btn-lantern', href: '/Luna?bolme=kitabxana', 'data-nav': true, text: 'Kitabxanama keç' }), out),
      h('p', { class: 'small', text: 'Bu ümumi BAKHY hesabıdır: eyni e-poçt və parol BAKHY oyunlarında da işləyir. Parolun bərpası hələ Luna-da təklif olunmur.' }));
    return view;
  }
  if (a.status === 'unavailable') {
    const retry = h('button', { class: 'btn btn-quiet', type: 'button', text: 'Yenidən yoxla', onclick: async () => { await acct.check(); render(); } });
    view.append(h('h1', { text: 'Hesab' }),
      h('div', { class: 'store-note store-warn', role: 'alert' }, h('p', { text: 'Hesab xidməti hazırda əlçatan deyil.' }), h('p', { text: 'Daxil olmaq və qeydiyyat bu an işləmir. Pulsuz əsərləri oxumağa və kitabxananı bu brauzerdə saxlamağa davam edə bilərsiniz.' })),
      h('div', { class: 'detail-actions' }, retry, h('a', { class: 'btn btn-lantern', href: '/Luna#kataloq', 'data-nav': true, text: 'Kataloqa keç' })));
    return view;
  }
  return authForms(view, a);
}
function authForms(view, a) {
  let mode = new URLSearchParams(location.search).get('forma') === 'qeydiyyat' ? 'register' : 'signin';
  const tabs = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Hesab' });
  const panel = h('div', { class: 'auth-panel', role: 'tabpanel' });
  view.append(h('h1', { text: 'Hesab' }),
    h('p', { class: 'lead', text: 'Hesab kitabxananızı və oxu yerinizi cihazlar arasında saxlamaq üçündür. Pulsuz komiksləri oxumaq üçün hesab lazım deyil.' }),
    a.message ? h('p', { class: 'store-note', role: 'status', text: a.message }) : null,
    tabs, panel);
  function draw() {
    tabs.replaceChildren(...[['signin', 'Daxil ol'], ['register', 'Qeydiyyat']].map(([m, label]) =>
      h('button', { type: 'button', role: 'tab', id: `tab-${m}`, 'aria-selected': String(mode === m), 'aria-controls': 'auth-form', onclick: () => { mode = m; draw(); } , text: label })));
    panel.setAttribute('aria-labelledby', `tab-${mode}`);
    panel.replaceChildren(form());
  }
  function form() {
    const email = h('input', { id: 'f-email', name: 'email', type: 'email', autocomplete: 'email', required: true, inputmode: 'email', 'aria-describedby': 'e-email' });
    const pw = h('input', { id: 'f-pw', name: 'password', type: 'password', autocomplete: mode === 'register' ? 'new-password' : 'current-password', required: true, minlength: mode === 'register' ? '8' : null, 'aria-describedby': 'e-pw h-pw' });
    const eye = h('button', { class: 'pw-toggle', type: 'button', 'aria-pressed': 'false', 'aria-controls': 'f-pw', text: 'Göstər' });
    eye.addEventListener('click', () => { const show = pw.type === 'password'; pw.type = show ? 'text' : 'password'; eye.textContent = show ? 'Gizlət' : 'Göstər'; eye.setAttribute('aria-pressed', String(show)); });
    const eErr = h('p', { id: 'e-email', class: 'field-error' }), pErr = h('p', { id: 'e-pw', class: 'field-error' });
    const ack = mode === 'register' ? h('input', { id: 'f-ack', type: 'checkbox', required: true }) : null;
    const aErr = h('p', { id: 'e-ack', class: 'field-error' });
    const msg = h('div', { class: 'form-msg', role: 'status', 'aria-live': 'polite' });
    const submit = h('button', { class: 'btn btn-lantern', type: 'submit', text: mode === 'register' ? 'Hesab yarat' : 'Daxil ol' });
    const f = h('form', { id: 'auth-form', class: 'auth-form', novalidate: true },
      h('div', { class: 'field' }, h('label', { for: 'f-email', text: 'E-poçt' }), email, eErr),
      h('div', { class: 'field' }, h('label', { for: 'f-pw', text: 'Parol' }), h('div', { class: 'pw-wrap' }, pw, eye),
        h('p', { id: 'h-pw', class: 'hint', text: mode === 'register' ? 'Ən azı 8 simvol.' : 'Qeydiyyatda seçdiyiniz parol.' }), pErr),
      ack ? h('div', { class: 'field field-check' }, ack, h('label', { for: 'f-ack', text: 'Başa düşürəm ki, bu ümumi BAKHY hesabıdır: eyni hesab BAKHY oyunlarında da işləyir və orada oyun profili (yalnız oyun üçün çiplər) avtomatik yaradılır.' }), aErr) : null,
      msg, submit,
      h('p', { class: 'small', text: mode === 'register' ? 'Qeydiyyatdan sonra e-poçtunuza təsdiq linki göndərilir. Hesab yalnız o link açıldıqdan sonra aktiv olur.' : 'Parolu unutmusunuzsa: parol bərpası hələ Luna-da təklif olunmur.' }));
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const errs = acct.validate({ email: email.value, password: pw.value }, mode);
      if (ack && !ack.checked) errs.ack = 'Davam etmək üçün bu qeydi təsdiqləyin.';
      eErr.textContent = errs.email || ''; pErr.textContent = errs.password || ''; aErr.textContent = errs.ack || '';
      email.setAttribute('aria-invalid', String(!!errs.email)); pw.setAttribute('aria-invalid', String(!!errs.password));
      msg.textContent = ''; msg.className = 'form-msg';
      if (Object.keys(errs).length) { (errs.email ? email : errs.password ? pw : ack).focus(); return; }
      submit.disabled = true; submit.textContent = mode === 'register' ? 'Hesab yaradılır…' : 'Yoxlanılır…'; f.setAttribute('aria-busy', 'true');
      const r = mode === 'register' ? await acct.register(email.value, pw.value) : await acct.signIn(email.value, pw.value);
      f.removeAttribute('aria-busy'); submit.disabled = false; submit.textContent = mode === 'register' ? 'Hesab yarat' : 'Daxil ol';
      if (!r.ok) { msg.className = 'form-msg is-error'; msg.textContent = r.error; return; }
      if (mode === 'register' && !r.confirmed) {
        pw.value = '';
        msg.className = 'form-msg is-ok';
        msg.textContent = `Təsdiq məktubu ${email.value.trim()} ünvanına göndərildi (bu ünvanla hesab hələ yoxdursa). Məktubdakı linki açın, sonra burada daxil olun.`;
        return;
      }
      toast(mode === 'register' ? 'Hesab yaradıldı və daxil oldunuz.' : 'Daxil oldunuz.');
      render();
    });
    return f;
  }
  draw();
  return view;
}

// ---------- WhatsApp inquiry (never sends anything automatically) ----------
function openInquiry(t) {
  lastFocus = document.activeElement;
  const url = whatsappUrl(t);
  const draft = decodeURIComponent(url.split('text=')[1]);
  dialog.replaceChildren(h('form', { method: 'dialog', class: 'inquiry-body' },
    h('h2', { id: 'inquiry-title', text: 'WhatsApp-da maraq bildirin' }),
    h('p', { text: `“${t.title}” nümunə məhsuldur və satışda deyil. Bu düymə WhatsApp-da +48 571 572 697 nömrəsinə hazır mesaj qaralaması açır. Mesaj siz “Göndər”i basana qədər göndərilmir, ödəniş alınmır və sifariş yaradılmır.` }),
    h('blockquote', { class: 'draft', text: draft }),
    h('div', { class: 'detail-actions' },
      h('a', { class: 'btn btn-ember', href: url, target: '_blank', rel: 'noopener', id: 'wa-open', onclick: () => setTimeout(() => dialog.close(), 50) }, icon('wa'), 'WhatsApp-da qaralamanı aç'),
      h('button', { class: 'btn btn-quiet', value: 'cancel', text: 'Bağla' }))));
  dialog.showModal();
}
dialog.addEventListener('close', () => lastFocus?.focus?.());

// ---------- Reader ----------
function showReader(r) {
  const t = bySlug.get(r.slug);
  if (!t) { closeReader(); main.replaceChildren(notFound()); return; }
  const leaves = buildLeaves(t);
  const saved = store.getProgress(t.slug, leaves.length);
  const start = r.s !== null && r.s !== undefined ? clampIndex(r.s, leaves.length) : saved && !saved.done ? saved.i : 0;
  if (reader && reader.slug === t.slug) { if (reader.ctl.index !== start) reader.ctl.goTo(start); return; }
  closeReader();
  document.body.classList.add('is-reading');
  document.title = `${t.title} oxunur: Luna Comics`;
  lastFocus = document.activeElement;
  const ctl = openReader(readerMount, t, start, {
    onIndex(i, n) {
      store.setProgress(t.slug, i, n);
      const url = urlFor.read(t, i);
      if (location.pathname + location.search !== url) history.replaceState(history.state, '', url);
    },
    onClose() {
      if (history.state?.luna && history.state.from && !history.state.from.includes('oxu=')) history.back();
      else go(urlFor.detail(t), { replace: true });
    },
    onDetail() { go(urlFor.detail(t)); },
    onInquiry() { openInquiry(t); },
  });
  reader = { slug: t.slug, ctl };
}
function closeReader() {
  if (!reader) return;
  reader.ctl.destroy(); reader = null;
  store.flush();
  document.body.classList.remove('is-reading');
}

// ---------- Boot ----------
store.onStoreChange(() => updateNav(route().view));
let firstAccount = true;
acct.onAccount(a => {
  updateNav(route().view);
  if (firstAccount) { firstAccount = false; return; }
  if (a.message && a.status === 'signed-out' && /müddəti/.test(a.message)) toast(a.message, 'error');
  if (a.sync === 'ready' && a.message) toast(a.message);
  const v = route().view;
  if (v === 'account' || v === 'library') render();
});
addEventListener('pagehide', () => store.flush());
render({ fresh: false });
acct.init();
