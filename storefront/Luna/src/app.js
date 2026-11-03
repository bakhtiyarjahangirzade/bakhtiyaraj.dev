// Luna Comics app shell: query-based routes that survive refresh on a static host.
//   /Luna                       Kəşf et (bento vitrin + kataloq)
//   /Luna?eser=<slug>           əsər səhifəsi
//   /Luna?oxu=<slug>&s=<leaf>   oxucu (s = 0 üz qabığı, 1.. səhifələr, sonuncu kreditlər / önizləmənin sonu)
//   /Luna?bolme=kitabxana       kitabxana
//   /Luna?bolme=hesab           hesab
//   /Luna?bolme=redaktor[&id=]  redaktor paneli (yalnız server tərəfindən təsdiqlənmiş redaktorlar; editor.js)
//   /Luna?onizle=<id>[&hamisi=1]&s=  redaktor üçün qaralamanın oxucuda önizləməsi
import './luna.css';
import { titles, bySlug, LANGUAGES, ACCESS, coverSrc, pageSrc, attribution, whatsappUrl, whatsappText, seriesLine, addRemote } from './catalogue.js';
import { buildLeaves, filterTitles, genresOf, progressLabel, clampIndex } from './core.js';
import { h, icon, artTile, avatar, accessBadge, priceText, toast, langOf, coverRatio } from './ui.js';
import { fetchCatalogue, attachSigner, signCovers } from './remote.js';
import { openReader } from './reader.js';
import * as store from './store.js';
import * as acct from './account.js';

const main = document.getElementById('luna-main');
const readerMount = document.getElementById('luna-reader');
const dialog = document.getElementById('luna-inquiry');
let reader = null, lastFocus = null;
const filters = { q: '', access: 'all', language: 'all', genre: 'all' };
let libraryTab = 'all';

// ---------- Routing ----------
function route() {
  const p = new URLSearchParams(location.search);
  if (p.has('oxu')) return { view: 'reader', slug: p.get('oxu'), s: p.get('s') };
  if (p.has('onizle')) return { view: 'preview', id: p.get('onizle'), all: p.get('hamisi') === '1', s: p.get('s') };
  if (p.has('eser')) return { view: 'detail', slug: p.get('eser') };
  const b = p.get('bolme');
  if (b === 'kitabxana') return { view: 'library' };
  if (b === 'hesab') return { view: 'account' };
  if (b === 'redaktor') return { view: 'editor', id: p.get('id') };
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
  if (r.view === 'preview') return showPreview(r);
  closeReader();
  document.body.classList.remove('is-reading');
  if (r.view === 'editor') return showEditor(r, fresh);
  const remoteT = r.view === 'detail' ? bySlug.get(r.slug) : null;
  if (remoteT?.remote && !remoteT.urlsReady) { prepare(remoteT); }
  const view = r.view === 'detail' ? (bySlug.get(r.slug) ? detailView(r.slug) : pendingOr(notFound)) : r.view === 'library' ? libraryView() : r.view === 'account' ? accountView() : shopView();
  main.replaceChildren(view);
  document.title = view.dataset.title || 'Luna Comics';
  if (fresh) {
    if (location.hash && r.view === 'shop') requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
    else { scrollTo(0, 0); main.focus({ preventScroll: true }); }
  }
}
function updateNav(view) {
  document.querySelectorAll('.mast-nav a').forEach(a => a.toggleAttribute('aria-current', a.dataset.view === view || (view === 'detail' && a.dataset.view === 'shop') || (view === 'editor' && a.dataset.view === 'account')));
  const count = store.savedSlugs().filter(s => bySlug.has(s)).length;
  const c = document.getElementById('lib-count');
  c.hidden = !count; c.textContent = count;
  const a = acct.account();
  document.getElementById('account-label').textContent = a.status === 'signed-in' ? 'Hesabım' : 'Hesab';
}

// ---------- Shared pieces ----------
function inProgress() {
  return store.progressSlugs().map(s => bySlug.get(s)).filter(t => {
    if (!t) return false;
    const p = store.getProgress(t.slug, buildLeaves(t).length);
    return p.i > 0 && !p.done;
  });
}
function readAction(t, cls = 'btn btn-white') {
  const leaves = buildLeaves(t);
  const prog = store.getProgress(t.slug, leaves.length);
  const arrow = h('span', { class: 'btn-arrow' }, icon('arrow'));
  if (prog && prog.i > 0 && !prog.done) {
    const leaf = leaves[prog.i];
    return h('a', { class: cls, href: urlFor.read(t, prog.i), 'data-nav': true }, `Davam et: ${leaf.kind === 'page' ? `səhifə ${leaf.n}` : leaf.label.toLowerCase()}`, arrow);
  }
  return h('a', { class: cls, href: urlFor.read(t, 0), 'data-nav': true }, t.access !== 'free' ? `Önizləməni oxu (${t.previewPages} səhifə)` : prog?.done ? 'Yenidən oxu' : 'Oxumağa başla', arrow);
}
// "+ Əlavə et" pill. `short` for tiles and cards, full label on the title page.
function saveButton(t, { short = false, cls = 'btn btn-white' } = {}) {
  const saved = store.isSaved(t.slug);
  const label = saved ? (short ? 'Kitabxanada' : 'Kitabxanadadır') : (short ? 'Əlavə et' : 'Kitabxanaya əlavə et');
  const btn = h('button', { class: `${cls}${saved ? ' is-saved' : ''}`, type: 'button', 'aria-pressed': String(saved), 'aria-label': short ? `${t.title}: ${saved ? 'kitabxanadan çıxar' : 'kitabxanaya əlavə et'}` : null },
    icon(saved ? 'check' : 'plus'), label);
  btn.addEventListener('click', async e => {
    e.preventDefault(); e.stopPropagation();
    btn.disabled = true;
    const on = !store.isSaved(t.slug);
    try {
      await store.setSaved(t.slug, on);
      toast(on ? `“${t.title}” kitabxanaya əlavə edildi. ${storageNote(true)}` : `“${t.title}” kitabxanadan çıxarıldı.`);
    } catch { toast('Kitabxana yenilənmədi: hesab sinxronizasiyası cavab vermədi. Yenidən cəhd edin.', 'error'); }
    const y = scrollY; render(); scrollTo(0, y);
  });
  return btn;
}
function storageNote(short = false) {
  const a = acct.account();
  if (store.storageMode() === 'account') return short ? 'Hesabınızla sinxronlaşdırıldı.' : 'Kitabxana və oxu yeri hesabınızla sinxronlaşdırılır və digər cihazlarda da görünür.';
  if (a.status === 'signed-in') return short ? 'Yalnız bu cihazda saxlanıldı.' : 'Hesabınız aktivdir, amma sinxronizasiya hələ quraşdırılmayıb: kitabxana və oxu yeri yalnız bu brauzerdə saxlanılır.';
  return short ? 'Yalnız bu cihazda saxlanıldı.' : 'Hesabsız kitabxana və oxu yeri yalnız bu brauzerdə saxlanılır. Cihazlar arasında saxlamaq üçün daxil olun.';
}
function cover(t, { eager = false, small = true } = {}) {
  return h('span', { class: 'cover', vars: { '--tone': t.tone, '--cover-ratio': coverRatio(t) } },
    h('img', { src: coverSrc(t, small), alt: '', width: t.coverSize[0], height: t.coverSize[1], loading: eager ? 'eager' : 'lazy', decoding: 'async' }));
}
function titleCard(t) {
  const leaves = buildLeaves(t);
  const prog = store.getProgress(t.slug, leaves.length);
  const pct = prog ? Math.round((prog.i / (leaves.length - 1)) * 100) : 0;
  return h('li', { class: 'card', vars: { '--tone': t.tone } },
    h('a', { class: 'card-link', href: urlFor.detail(t), 'data-nav': true, 'aria-label': `${t.title}, ${seriesLine(t)}` }, cover(t)),
    h('div', { class: 'card-meta' },
      h('div', { class: 'card-row' }, accessBadge(t), h('span', { class: 'card-lang', text: LANGUAGES[t.language] })),
      h('h3', { lang: langOf(t) }, h('a', { href: urlFor.detail(t), 'data-nav': true, text: t.title, tabindex: '-1' })),
      h('p', { class: 'card-facts', text: `${t.creator}${t.episode !== null && t.episode !== undefined ? `, bölüm ${t.episode}` : ''}. ${t.access !== 'free' ? `${t.previewPages} / ${t.storyPages} səhifə önizləmə` : `${t.storyPages} səhifə`}` }),
      prog && prog.i > 0 ? h('p', { class: 'card-progress' }, h('span', { class: 'meter' }, h('span', { vars: { '--p': `${pct}%` } })), h('span', { text: progressLabel(prog, leaves) })) : null),
    saveButton(t, { short: true, cls: 'card-save' }));
}

// ---------- Recent searches (this device only) ----------
const SEARCH_KEY = 'luna.searches.v1';
function recentSearches() { try { const v = JSON.parse(localStorage.getItem(SEARCH_KEY) || '[]'); return Array.isArray(v) ? v.filter(x => typeof x === 'string').slice(0, 8) : []; } catch { return []; } }
function rememberSearch(q) {
  q = q.trim(); if (q.length < 3) return;
  const list = [q, ...recentSearches().filter(x => x.toLocaleLowerCase('az') !== q.toLocaleLowerCase('az'))].slice(0, 8);
  try { localStorage.setItem(SEARCH_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}
function searchFor(q) {
  Object.assign(filters, { q, access: 'all', language: 'all', genre: 'all' });
  rememberSearch(q);
  render();
  requestAnimationFrame(() => document.getElementById('kataloq')?.scrollIntoView({ behavior: 'smooth' }));
}

// ---------- Shop: Kəşf et ----------
function people() {
  const map = new Map();
  for (const t of titles) for (const [role, names] of t.credits) for (const name of names.split(/,\s*/)) {
    const p = map.get(name) || { name, titles: new Set(), roles: new Set(), tone: t.tone };
    p.titles.add(t.slug); p.roles.add(/tərcümə/i.test(role) ? 'tərcüməçi' : /Rəsm|ssenari/i.test(role) ? 'müəllif' : 'redaktor');
    map.set(name, p);
  }
  return [...map.values()].sort((a, b) => b.titles.size - a.titles.size || a.name.localeCompare(b.name));
}
function shopView() {
  const t1 = bySlug.get('pepper-carrot-01'), t2 = bySlug.get('pepper-carrot-02'), t3 = bySlug.get('pepper-carrot-03'),
    t5 = bySlug.get('pepper-carrot-05'), t6 = bySlug.get('pepper-carrot-06-ru'), t11 = bySlug.get('pepper-carrot-11');
  // Azerbaijani date written out by hand: browsers without az locale data would print "M11 3, Tue".
  const d = new Date();
  const today = `${['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'][d.getDay()]}, ${d.getDate()} ${['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'][d.getMonth()]}`;
  const cont = inProgress()[0];
  const freeCount = titles.filter(t => t.access === 'free').length;

  const feature = h('article', { class: 'tile tile-feature' },
    h('div', { class: 'feature-copy' },
      h('h2', { class: 'feature-title', text: 'Cadılar, iksirlər və bir pişik.' }),
      h('p', { class: 'tile-desc', text: `David Revoy-un açıq lisenziyalı Pepper&Carrot komiksi. ${freeCount} bölüm pulsuzdur və qeydiyyatsız oxunur.` }),
      h('a', { class: 'btn btn-white btn-lg', href: urlFor.read(t1, 0), 'data-nav': true }, 'Birinci bölümü oxu', h('span', { class: 'btn-arrow' }, icon('arrow')))),
    h('div', { class: 'fan', 'aria-hidden': 'true' }, [t3, t6, t1].map((t, k) => h('span', { class: `fan-${k}` }, cover(t, { eager: true })))));

  const tall = artTile(t11, {
    cls: 'tile-tall', chip: 'Gecə seçimi', sub: `${t11.creator.toUpperCase()}, BÖLÜM ${t11.episode}`, eager: true, href: urlFor.detail(t11),
    desc: 'Chaosah cadıları Pepperi “qorxunc cadı” etmək istəyir; ilk tapşırıq gənc kralı qorxutmaqdır. Nümunə məhsul, ilk 2 səhifə önizləmədir.',
    actions: [h('a', { class: 'btn btn-glass', href: urlFor.read(t11, 0), 'data-nav': true, text: 'Önizləmə' }), saveButton(t11, { short: true })],
  });
  const pick = artTile(t3, {
    cls: 'tile-pick', chip: 'Tövsiyə', href: urlFor.detail(t3), eager: true,
    desc: 'Bazar günü, boş pul kisəsi və sabahkı iksir yarışması. Seriyanın ilk macərası.',
    actions: [saveButton(t3, { short: true })],
  });
  const genreA = artTile(t2, {
    cls: 'tile-genre', chip: 'Janr', title: 'Komediya', href: null,
    desc: 'Səs effektləri ilə danışan qısa, gülməli bölümlər.',
    actions: [h('button', { class: 'btn btn-white', type: 'button', onclick: () => { Object.assign(filters, { q: '', access: 'all', language: 'all', genre: 'Komediya' }); render(); requestAnimationFrame(() => document.getElementById('kataloq').scrollIntoView({ behavior: 'smooth' })); } }, icon('arrow'), 'Bax')],
  });
  const genreB = artTile(t5, {
    cls: 'tile-genre tile-genre-b', chip: 'Sözsüz', title: 'Dilsiz oxunan hekayələr', href: null,
    desc: 'Mətnsiz bölümlər: hər dildə oxunur.',
    actions: [h('button', { class: 'btn btn-white', type: 'button', onclick: () => { Object.assign(filters, { q: '', access: 'all', language: 'none', genre: 'all' }); render(); requestAnimationFrame(() => document.getElementById('kataloq').scrollIntoView({ behavior: 'smooth' })); } }, icon('arrow'), 'Bax')],
  });
  const t15 = bySlug.get('pepper-carrot-15');
  const samples = artTile(t15, {
    cls: 'tile-genre tile-sample', chip: 'Nümunə məhsullar', title: 'Gələcək nəşrlərə ilk baxış', href: null,
    desc: 'Önizləmə pulsuzdur. Satış hələ aktiv deyil, ödəniş alınmır.',
    actions: [h('button', { class: 'btn btn-white', type: 'button', onclick: () => { Object.assign(filters, { q: '', access: 'sample', language: 'all', genre: 'all' }); render(); requestAnimationFrame(() => document.getElementById('kataloq').scrollIntoView({ behavior: 'smooth' })); } }, icon('arrow'), 'Bax')],
  });
  const rec = artTile(t6, {
    cls: 'tile-rec', chip: 'Rus dilində', href: urlFor.detail(t6), sub: 'THE POTION CONTEST',
    desc: 'Dörd cadı, bir alqış ölçən və Komona səması. 9 səhifə, Denis Prisukhin-in tərcüməsi.',
    actions: [saveButton(t6, { short: true })],
  });
  const startT = cont || t1;
  const startLeaves = buildLeaves(startT), startP = store.getProgress(startT.slug, startLeaves.length);
  const person = artTile(startT, {
    cls: 'tile-start', chip: cont ? 'Oxumağa davam et' : 'Buradan başlayın', href: urlFor.detail(startT),
    sub: cont ? progressLabel(startP, startLeaves) : '3 səhifə, 1 dəqiqə',
    actions: [readAction(startT, 'btn btn-white')],
  });
  const quote = h('figure', { class: 'tile tile-quote' },
    h('span', { class: 'quote-mark', 'aria-hidden': 'true', text: '“' }),
    h('blockquote', { lang: 'en' }, h('p', { text: 'Mmm… Best… Coffee… Ever!' })),
    h('figcaption', {}, 'Pepper, ', h('a', { href: urlFor.read(t3, 7), 'data-nav': true, lang: 'en', text: 'The Secret Ingredients' }), ', səhifə 7'));

  const ppl = people().slice(0, 4);
  const authors = h('section', { class: 'tile tile-side tile-authors', 'aria-labelledby': 'authors-h' },
    h('div', { class: 'side-head' }, h('h2', { id: 'authors-h', text: 'Müəlliflər' }), h('span', { class: 'side-more', 'aria-hidden': 'true' }, icon('more'))),
    h('ul', { class: 'people' }, ppl.map(p => h('li', {},
      h('button', { type: 'button', class: 'person', onclick: () => searchFor(p.name), 'aria-label': `${p.name}: ${p.titles.size} bölüm, kataloqda göstər` },
        avatar(p.name, p.tone),
        h('span', { class: 'person-name', text: p.name }),
        h('span', { class: 'person-meta', text: `${p.titles.size} bölüm, ${[...p.roles][0]}` }))))),
    h('a', { class: 'btn btn-violet btn-block', href: '/Luna#kataloq', 'data-nav': true, text: 'Bütün kataloqa bax' }));

  const recent = recentSearches();
  const suggestions = recent.length ? recent : ['Saffron', 'Carrot', 'Komona', 'Chaosah', 'Denis Prisukhin', 'Bayram'];
  const searches = h('section', { class: 'tile tile-side tile-recent', 'aria-labelledby': 'recent-h' },
    h('div', { class: 'side-head' },
      h('h2', { id: 'recent-h', text: recent.length ? 'Son axtarışlar' : 'Axtarış təklifləri' }),
      recent.length ? h('button', { class: 'link-btn', type: 'button', text: 'Təmizlə', onclick: () => { try { localStorage.removeItem(SEARCH_KEY); } catch { /* ignore */ } render(); } }) : null),
    h('ul', { class: 'pills' }, suggestions.map(q => h('li', {}, h('button', { type: 'button', class: 'pill', text: q, onclick: () => searchFor(q) })))),
    recent.length ? h('p', { class: 'side-note', text: 'Yalnız bu cihazda saxlanılır.' }) : null);

  const libCount = store.savedSlugs().filter(s => bySlug.has(s)).length;
  const a = acct.account();
  const menuItem = (href, ic, tone, title, sub) => h('li', {}, h('a', { href, 'data-nav': href.startsWith('/Luna') ? true : null, class: 'menu-item' },
    h('span', { class: `menu-ic menu-${tone}` }, icon(ic)), h('span', { class: 'menu-text' }, h('strong', { text: title }), h('span', { text: sub })), icon('chevron')));
  const menu = h('nav', { class: 'tile tile-side tile-menu', 'aria-labelledby': 'menu-h' },
    h('div', { class: 'side-head' }, h('h2', { id: 'menu-h', text: 'Menyu' }), h('span', { class: 'side-more', 'aria-hidden': 'true' }, icon('more'))),
    h('ul', {},
      menuItem('/Luna?bolme=kitabxana', 'bookmark', 'red', 'Kitabxanam', libCount ? `${libCount} əsər saxlanılıb` : 'Saxladığınız əsərlər'),
      menuItem(cont ? urlFor.read(cont, startP?.i) : '/Luna?bolme=kitabxana', 'clock', 'blue', 'Oxumağa davam et', cont ? cont.title : 'Qaldığınız yerdən açın'),
      menuItem('/Luna?bolme=hesab', 'user', 'violet', a.status === 'signed-in' ? 'Hesabım' : 'Hesab', a.status === 'signed-in' ? a.user.email : 'Daxil olun və ya qeydiyyat'),
      acct.account().editor ? menuItem('/Luna?bolme=redaktor', 'page', 'orange', 'Redaktor paneli', 'Komiks yüklə və dərc et') : menuItem('#lisenziyalar', 'shield', 'green', 'Mənbələr və lisenziyalar', 'CC BY 4.0, müəlliflər')));

  return h('div', { class: 'shop', 'data-title': 'Luna Comics: kəşf et' },
    h('header', { class: 'large-title' },
      today ? h('p', { class: 'eyebrow', text: today }) : null,
      h('h1', { text: 'Kəşf et' })),
    h('div', { class: 'bento' }, pick, feature, authors, genreA, tall, searches, genreB, rec, quote, samples, person, menu),
    newReleases(),
    catalogueSection());
}

function segmented(label, key, options, onChange) {
  const group = h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': label });
  for (const [v, text] of options) {
    group.append(h('button', { type: 'button', role: 'radio', 'aria-checked': String(filters[key] === v), 'data-value': v, text,
      onclick: () => { filters[key] = v; group.querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.value === v))); onChange(); } }));
  }
  return group;
}
function catalogueSection() {
  const grid = h('ol', { class: 'grid' });
  const count = h('p', { class: 'cat-count', role: 'status', 'aria-live': 'polite' });
  const search = h('input', { id: 'cat-q', type: 'search', value: filters.q, autocomplete: 'off', placeholder: 'Ad, personaj, janr, tərcüməçi', 'aria-label': 'Kataloqda axtar' });
  let t = 0;
  search.addEventListener('input', () => { filters.q = search.value; update(); clearTimeout(t); t = setTimeout(() => rememberSearch(search.value), 1200); });
  search.addEventListener('keydown', e => { if (e.key === 'Enter') rememberSearch(search.value); });
  const resetAll = () => { Object.assign(filters, { q: '', access: 'all', language: 'all', genre: 'all' }); render(); requestAnimationFrame(() => document.getElementById('cat-q')?.focus()); };
  const controls = h('div', { class: 'cat-controls' },
    h('label', { class: 'searchbox' }, icon('search'), search),
    segmented('Giriş', 'access', [['all', 'Hamısı'], ['free', ACCESS.free], ...(titles.some(x => x.access === 'paid') ? [['paid', ACCESS.paid]] : []), ['sample', 'Nümunə']], update),
    h('div', { class: 'chip-rows' },
      segmented('Mətnin dili', 'language', [['all', 'Bütün dillər'], ...Object.entries(LANGUAGES).filter(([k]) => titles.some(x => x.language === k))], update),
      segmented('Janr', 'genre', [['all', 'Bütün janrlar'], ...genresOf(titles).map(g => [g, g])], update)));
  controls.querySelectorAll('.chip-rows .segmented').forEach(s => s.classList.add('segmented-chips'));
  function update() {
    const list = filterTitles(titles, filters, LANGUAGES);
    count.textContent = `${list.length} əsər göstərilir`;
    if (list.length) grid.replaceChildren(...list.map(titleCard));
    else grid.replaceChildren(h('li', { class: 'empty' },
      h('h3', { text: 'Bu seçimə uyğun əsər yoxdur' }),
      h('p', { text: filters.q ? `“${filters.q}” üçün nəticə tapılmadı. Başqa söz yoxlayın və ya filtrləri sıfırlayın: kolleksiyada hazırda ${titles.length} əsər var.` : `Bu filtr birləşməsinə uyğun əsər yoxdur. Kolleksiyada hazırda ${titles.length} əsər var.` }),
      h('button', { class: 'btn btn-white', type: 'button', text: 'Filtrləri sıfırla', onclick: resetAll })));
  }
  update();
  return h('section', { class: 'catalogue', id: 'kataloq', 'aria-labelledby': 'kataloq-h' },
    h('div', { class: 'section-head' }, h('h2', { id: 'kataloq-h', text: 'Bütün kataloq' }), h('p', { text: titles.some(x => x.access === 'paid') ? 'Pulsuz əsərlər tam oxunur. Satışdakı əsərlərin və nümunə məhsulların yalnız önizləmə səhifələri açıqdır.' : 'Pulsuz bölümlər tam oxunur. Nümunə məhsulların yalnız önizləmə səhifələri saytdadır.' })),
    remoteNote(),
    controls, count, grid);
}

// ---------- Detail ----------
function detailView(slug) {
  const t = bySlug.get(slug);
  if (!t) return notFound();
  const own = !!t.remote;
  const leaves = buildLeaves(t);
  const prog = store.getProgress(t.slug, leaves.length);
  const stats = [
    ['Dil', LANGUAGES[t.language], t.language === 'none' ? 'mətnsiz' : t.language.toUpperCase()],
    ['Səhifə', String(t.storyPages), t.access !== 'free' ? `${t.previewPages} önizləmə` : 'tam'],
    ['Janr', t.genres[0], t.genres[1] || ''],
    ['İl', String(t.year), own ? 'nəşr' : 'ilk nəşr'],
    own ? ['Qiymət', t.access === 'free' ? 'Pulsuz' : `${t.price} AZN`, t.access === 'sample' ? 'illüstrativ' : t.access === 'paid' ? 'WhatsApp sorğusu' : 'tam oxu']
      : ['Lisenziya', t.license.name.replace(' 4.0', ''), '4.0'],
  ];
  let sampleBox = null;
  if (t.access === 'paid') {
    sampleBox = h('div', { class: 'sample-box sample-paid' },
      h('div', { class: 'sample-price' }, h('strong', { text: priceText(t) }), h('span', { text: 'tam versiyanın qiyməti' })),
      h('p', { text: `İlk ${t.previewPages} səhifə pulsuz önizləmədir. Saytda ödəniş qəbul edilmir: tam versiyanı almaq üçün WhatsApp-da sorğu göndərin, ödəniş və çatdırılma qaydası orada razılaşdırılır. Sorğu göndərmək əsəri avtomatik açmır və heç nə “alınmış” sayılmır.` }),
      h('div', { class: 'detail-actions' }, h('button', { class: 'btn btn-ember', type: 'button', onclick: () => openInquiry(t) }, icon('wa'), 'WhatsApp-da alış sorğusu')));
  } else if (t.access === 'sample') {
    sampleBox = h('div', { class: 'sample-box' },
      h('div', { class: 'sample-price' }, h('strong', { text: priceText(t) }), h('span', { text: 'illüstrativ nümunə qiymət' })),
      h('p', { text: 'Bu nümunə məhsuldur: Luna-nın gələcək ödənişli nəşrlərinin necə təqdim olunacağını göstərir. Satış aktiv deyil, ödəniş qəbul edilmir və heç nə “alınmış” sayılmır.' }),
      h('div', { class: 'detail-actions' }, h('button', { class: 'btn btn-ember', type: 'button', onclick: () => openInquiry(t) }, icon('wa'), 'WhatsApp-da maraq bildir')),
      own ? null : h('p', { class: 'small' }, 'Əsərin özü müəllifin saytında ', h('a', { href: t.source.page, rel: 'noopener', target: '_blank', text: 'CC BY 4.0 lisenziyası ilə pulsuz' }), ' mövcuddur.'));
  }
  const more = (own ? titles.filter(x => x.slug !== t.slug && (x.creator === t.creator || x.remote)) : titles.filter(x => x.slug !== t.slug && !x.remote)).slice(0, 4);
  const credits = own
    ? h('section', { class: 'detail-section credits', 'aria-labelledby': 'credits-h' },
      h('div', { class: 'section-head' }, h('h2', { id: 'credits-h', text: 'Müəlliflər və hüquqlar' })),
      h('dl', { class: 'group' }, (t.credits.length ? t.credits : [['Müəllif', t.creator]]).map(([r, w]) => fact(r, w)), t.publishedAt ? fact('Luna-da dərc', new Date(t.publishedAt).toISOString().slice(0, 10)) : null),
      h('p', { class: 'small', text: t.rights }))
    : h('section', { class: 'detail-section credits', 'aria-labelledby': 'credits-h' },
      h('div', { class: 'section-head' }, h('h2', { id: 'credits-h', text: 'Müəlliflər, mənbə və lisenziya' })),
      h('dl', { class: 'group' }, t.credits.map(([r, w]) => fact(r, w)), fact('Lisenziya', t.license.name), fact('İlk nəşr', `${t.source.published}, peppercarrot.com`)),
      h('p', { class: 'small', text: attribution(t) }),
      t.license.note ? h('p', { class: 'small', text: t.license.note }) : null,
      h('p', { class: 'small links' },
        h('a', { href: t.source.page, rel: 'noopener', target: '_blank', text: 'Bölümün orijinal səhifəsi' }),
        h('a', { href: t.source.files, rel: 'noopener', target: '_blank', text: 'Mənbə faylları' }),
        h('a', { href: t.license.evidence, rel: 'noopener', target: '_blank', text: 'Müəllifin lisenziya bəyanatı' }),
        h('a', { href: t.license.url, rel: 'noopener license', target: '_blank', text: t.license.name })));
  const strip = t.pages.slice(0, own ? 8 : t.pages.length);
  return h('article', { class: 'detail', 'data-title': `${t.title}: Luna Comics`, vars: { '--tone': t.tone } },
    h('div', { class: 'detail-hero' },
      h('img', { class: 'detail-bg', src: coverSrc(t, true), alt: '', 'aria-hidden': 'true' }),
      h('nav', { class: 'crumbs', 'aria-label': 'Səhifə yolu' }, h('a', { href: '/Luna', 'data-nav': true }, icon('prev'), 'Kəşf et'), h('a', { href: '/Luna#kataloq', 'data-nav': true, text: 'Kataloq' })),
      h('div', { class: 'detail-grid' },
        h('figure', { class: 'detail-cover' },
          h('img', { src: coverSrc(t), alt: `${t.title}: üz qabığı (orijinal, kəsilməmiş)`, width: t.coverSize[0], height: t.coverSize[1], decoding: 'async' })),
        h('div', { class: 'detail-body' },
          h('div', { class: 'card-row' }, accessBadge(t), seriesLine(t) && seriesLine(t) !== t.creator ? h('span', { class: 'chip chip-dark', text: seriesLine(t) }) : null),
          h('h1', { lang: langOf(t), text: t.title }),
          t.titleNote ? h('p', { class: 'detail-alt' }, own ? 'Digər adı: ' : 'İngiliscə adı: ', h('span', { lang: own ? null : 'en', text: t.titleNote })) : null,
          h('p', { class: 'detail-creator' }, h('button', { type: 'button', class: 'link-btn', text: t.creator, onclick: () => { go('/Luna'); searchFor(t.creator); } })),
          h('p', { class: 'detail-synopsis', text: t.synopsis }),
          h('div', { class: 'detail-actions' }, readAction(t, 'btn btn-white btn-lg'), saveButton(t, { cls: 'btn btn-glass btn-lg' })),
          prog && prog.i > 0 ? h('p', { class: 'detail-progress', text: `${progressLabel(prog, leaves)}. ${storageNote(true)}` }) : null))),
    h('dl', { class: 'stats' }, stats.map(([k, v, s]) => h('div', {}, h('dt', { text: k }), h('dd', {}, h('strong', { text: v }), h('span', { text: s }))))),
    sampleBox,
    h('section', { class: 'detail-section', 'aria-labelledby': 'pages-h' },
      h('div', { class: 'section-head' }, h('h2', { id: 'pages-h', text: 'İlk səhifələr' }), h('p', { text: `Dil: ${LANGUAGES[t.language]}.${t.languageNote ? ` ${t.languageNote}.` : ''}` })),
      h('ol', { class: 'page-strip' }, strip.map((f, k) => h('li', {},
        h('a', { href: urlFor.read(t, k + 1), 'data-nav': true, 'aria-label': `Səhifə ${k + 1}-i oxucuda aç` },
          h('img', { src: pageSrc(t, f), alt: `${t.title}, səhifə ${k + 1}`, width: t.pageSizes?.[k]?.[0] || 1200, height: t.pageSizes?.[k]?.[1] || 1660, loading: 'lazy', decoding: 'async' }),
          h('span', { class: 'page-no', text: String(k + 1) })))))),
    credits,
    more.length ? h('section', { class: 'detail-section', 'aria-labelledby': 'more-h' },
      h('div', { class: 'section-head' }, h('h2', { id: 'more-h', text: own ? 'Luna-da daha çox' : 'Seriyadan daha çox' })),
      h('ol', { class: 'grid grid-row' }, more.map(titleCard))) : null);
}
// Element.append() would print null/false as text; skip them.
const put = (el, ...kids) => el.append(...kids.flat().filter(k => k !== null && k !== undefined && k !== false));
const fact = (k, v) => h('div', {}, h('dt', { text: k }), h('dd', { text: v }));
function notFound() {
  return h('section', { class: 'empty-page', 'data-title': 'Əsər tapılmadı: Luna Comics' },
    h('h1', { text: 'Bu əsər tapılmadı' }),
    h('p', { text: 'Link köhnə və ya səhv ola bilər. Kataloqda mövcud bütün əsərlərə baxın.' }),
    h('a', { class: 'btn btn-white', href: '/Luna#kataloq', 'data-nav': true, text: 'Kataloqa keç' }));
}

// ---------- Library ----------
function libraryView() {
  const saved = store.savedSlugs().map(s => bySlug.get(s)).filter(Boolean);
  const reading = store.progressSlugs().map(s => bySlug.get(s)).filter(t => t && !saved.includes(t));
  const all = [...saved, ...reading];
  const a = acct.account();
  const view = h('section', { class: 'library', 'data-title': 'Kitabxanam: Luna Comics' },
    h('header', { class: 'large-title' }, h('h1', { text: 'Kitabxanam' })),
    h('p', { class: `store-note store-${store.storageMode()}` }, icon(store.storageMode() === 'account' ? 'check' : 'shield'), h('span', { text: storageNote() })),
    a.status !== 'signed-in' ? h('p', { class: 'small' }, h('a', { href: '/Luna?bolme=hesab', 'data-nav': true, text: 'Daxil olun və ya qeydiyyatdan keçin' }), ' (pulsuz oxu üçün tələb olunmur).') : null);
  if (!all.length) {
    put(view, h('div', { class: 'empty' },
      h('h2', { text: 'Kitabxananız hələ boşdur' }),
      h('p', { text: 'Əsər kartında “Əlavə et” düyməsini basın. Oxumağa başladığınız bölümlər də burada qaldığınız səhifə ilə görünəcək.' }),
      h('div', { class: 'detail-actions' },
        h('a', { class: 'btn btn-white', href: '/Luna#kataloq', 'data-nav': true, text: 'Kataloqa keç' }),
        h('a', { class: 'btn btn-glass', href: urlFor.read(bySlug.get('pepper-carrot-01'), 0), 'data-nav': true, text: 'Birinci bölümü oxu' }))));
    return view;
  }
  const tabs = [['all', 'Hamısı', all], ['reading', 'Davam edir', inProgress().filter(t => all.includes(t))], ['saved', 'Saxlanılıb', saved]];
  const current = tabs.find(x => x[0] === libraryTab) || tabs[0];
  put(view, h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': 'Kitabxana bölməsi' },
    tabs.map(([k, label, list]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(k === current[0]), text: `${label} ${list.length}`, onclick: () => { libraryTab = k; render(); } }))));
  if (!current[2].length) { put(view, h('p', { class: 'empty', text: 'Bu bölmədə hələ əsər yoxdur.' })); return view; }
  put(view, h('ol', { class: 'lib-list' }, current[2].map(t => {
    const leaves = buildLeaves(t), p = store.getProgress(t.slug, leaves.length);
    const pct = p ? Math.round((p.i / (leaves.length - 1)) * 100) : 0;
    return h('li', { class: 'lib-item', vars: { '--tone': t.tone } },
      h('a', { class: 'lib-cover', href: urlFor.detail(t), 'data-nav': true, 'aria-label': t.title }, cover(t)),
      h('div', { class: 'lib-body' },
        h('div', { class: 'card-row' }, accessBadge(t), h('span', { class: 'card-lang', text: store.isSaved(t.slug) ? 'Saxlanılıb' : 'Oxu tarixçəsi' })),
        h('h2', { lang: langOf(t) }, h('a', { href: urlFor.detail(t), 'data-nav': true, text: t.title })),
        h('p', { class: 'lib-prog' }, h('span', { class: 'meter' }, h('span', { vars: { '--p': `${pct}%` } })), h('span', { text: `${pct}%` }), h('span', { text: p ? progressLabel(p, leaves) : 'Hələ açılmayıb' })),
        h('div', { class: 'detail-actions' }, readAction(t, 'btn btn-white'), store.isSaved(t.slug) ? saveButton(t, { cls: 'btn btn-glass' }) : null)));
  })));
  return view;
}

// ---------- Account ----------
function accountView() {
  const a = acct.account();
  const view = h('section', { class: 'account', 'data-title': 'Hesab: Luna Comics' });
  if (a.status === 'idle' || a.status === 'loading') {
    put(view, h('header', { class: 'large-title' }, h('h1', { text: 'Hesab' })), h('p', { role: 'status', text: 'Hesab vəziyyəti yoxlanılır…' }));
    return view;
  }
  if (a.status === 'signed-in') {
    const syncText = { checking: 'Sinxronizasiya yoxlanılır…', ready: 'Kitabxana və oxu yeri hesabınızla sinxronlaşdırılır.', missing: 'Sinxronizasiya hələ quraşdırılmayıb (Luna cədvəlləri serverdə yoxdur). Kitabxana və oxu yeri hazırda yalnız bu brauzerdə saxlanılır.', error: 'Sinxronizasiya xidməti cavab vermədi. Kitabxana müvəqqəti olaraq yalnız bu brauzerdə saxlanılır.' }[a.sync] || '';
    const out = h('button', { class: 'btn btn-glass', type: 'button', text: 'Hesabdan çıx' });
    out.addEventListener('click', async () => { out.disabled = true; out.textContent = 'Çıxılır…'; await acct.signOut(); toast('Hesabdan çıxdınız. Bu cihazda başqa üzvün kitabxanası göstərilmir.'); render(); });
    put(view, h('header', { class: 'large-title' }, h('h1', { text: 'Hesabım' })),
      h('dl', { class: 'group' }, fact('E-poçt', a.user.email), fact('Sinxronizasiya', syncText)),
      a.message ? h('p', { class: 'store-note', text: a.message }) : null,
      a.editor ? h('div', { class: 'store-note store-editor' }, icon('page'), h('span', {}, 'Bu hesab Luna redaktorudur. ', h('a', { href: '/Luna?bolme=redaktor', 'data-nav': true, text: 'Redaktor panelini aç' }), ' — komiks yüklə, önizlə, dərc et.')) : null,
      h('div', { class: 'detail-actions' }, h('a', { class: 'btn btn-white', href: '/Luna?bolme=kitabxana', 'data-nav': true, text: 'Kitabxanama keç' }), a.editor ? h('a', { class: 'btn btn-violet', href: '/Luna?bolme=redaktor', 'data-nav': true, text: 'Redaktor paneli' }) : null, out),
      h('p', { class: 'small', text: 'Bu ümumi BAKHY hesabıdır: eyni e-poçt və parol BAKHY oyunlarında da işləyir. Parolun bərpası hələ Luna-da təklif olunmur.' }));
    return view;
  }
  if (a.status === 'unavailable') {
    const retry = h('button', { class: 'btn btn-glass', type: 'button', text: 'Yenidən yoxla', onclick: async () => { await acct.check(); render(); } });
    put(view, h('header', { class: 'large-title' }, h('h1', { text: 'Hesab' })),
      h('div', { class: 'store-note store-warn', role: 'alert' }, h('p', { text: 'Hesab xidməti hazırda əlçatan deyil.' }), h('p', { text: 'Daxil olmaq və qeydiyyat bu an işləmir. Pulsuz əsərləri oxumağa və kitabxananı bu brauzerdə saxlamağa davam edə bilərsiniz.' })),
      h('div', { class: 'detail-actions' }, retry, h('a', { class: 'btn btn-white', href: '/Luna#kataloq', 'data-nav': true, text: 'Kataloqa keç' })));
    return view;
  }
  return authForms(view, a);
}
function authForms(view, a) {
  let mode = new URLSearchParams(location.search).get('forma') === 'qeydiyyat' ? 'register' : 'signin';
  const tabs = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Hesab' });
  const panel = h('div', { class: 'auth-panel', role: 'tabpanel' });
  put(view, h('header', { class: 'large-title' }, h('h1', { text: 'Hesab' })),
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
    const submit = h('button', { class: 'btn btn-violet btn-block', type: 'submit', text: mode === 'register' ? 'Hesab yarat' : 'Daxil ol' });
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
  const draft = whatsappText(t);
  const paid = t.access === 'paid';
  dialog.replaceChildren(h('form', { method: 'dialog', class: 'inquiry-body' },
    h('h2', { id: 'inquiry-title', text: paid ? 'WhatsApp-da alış sorğusu' : 'WhatsApp-da maraq bildirin' }),
    h('p', { text: paid
      ? `“${t.title}” tam versiyasının qiyməti ${t.price} AZN-dir. Luna saytda ödəniş qəbul etmir: bu düymə WhatsApp-da +48 571 572 697 nömrəsinə hazır alış sorğusu qaralaması açır. Mesaj siz “Göndər”i basana qədər göndərilmir; ödəniş və tam versiyanı əldə etmə qaydası orada razılaşdırılır. Sorğu göndərmək əsəri avtomatik açmır.`
      : `“${t.title}” nümunə məhsuldur və satışda deyil. Bu düymə WhatsApp-da +48 571 572 697 nömrəsinə hazır mesaj qaralaması açır. Mesaj siz “Göndər”i basana qədər göndərilmir, ödəniş alınmır və sifariş yaradılmır.` }),
    h('blockquote', { class: 'draft', text: draft }),
    h('div', { class: 'detail-actions' },
      h('a', { class: 'btn btn-ember', href: url, target: '_blank', rel: 'noopener', id: 'wa-open', onclick: () => setTimeout(() => dialog.close(), 50) }, icon('wa'), 'WhatsApp-da qaralamanı aç'),
      h('button', { class: 'btn btn-glass', value: 'cancel', text: 'Bağla' }))));
  dialog.showModal();
}
dialog.addEventListener('close', () => lastFocus?.focus?.());

// ---------- Reader ----------
function showReader(r) {
  const t = bySlug.get(r.slug);
  if (!t) { closeReader(); main.replaceChildren(pendingOr(notFound)); return; }
  if (t.remote && !t.urlsReady) { closeReader(); main.replaceChildren(loadingView('Səhifələr hazırlanır…')); prepare(t); return; }
  startReader(t, r);
}
function startReader(t, r, { preview = false } = {}) {
  const leaves = buildLeaves(t);
  const saved = preview ? null : store.getProgress(t.slug, leaves.length);
  const start = r.s !== null && r.s !== undefined ? clampIndex(r.s, leaves.length) : saved && !saved.done ? saved.i : 0;
  if (reader && reader.slug === t.slug && reader.preview === preview) { if (reader.ctl.index !== start) reader.ctl.goTo(start); return; }
  closeReader();
  document.body.classList.add('is-reading');
  document.title = preview ? `Önizləmə: ${t.title} — Luna redaktor` : `${t.title} oxunur: Luna Comics`;
  lastFocus = document.activeElement;
  const ctl = openReader(readerMount, t, start, {
    onIndex(i, n) {
      if (preview) { const u = new URL(location.href); u.searchParams.set('s', i); history.replaceState(history.state, '', u.pathname + u.search); return; }
      store.setProgress(t.slug, i, n);
      const url = urlFor.read(t, i);
      if (location.pathname + location.search !== url) history.replaceState(history.state, '', url);
    },
    onClose() {
      if (history.state?.luna && history.state.from && !history.state.from.includes('oxu=') && !history.state.from.includes('onizle=')) history.back();
      else go(preview ? `/Luna?bolme=redaktor&id=${encodeURIComponent(t.id)}` : urlFor.detail(t), { replace: true });
    },
    onDetail() { go(preview ? `/Luna?bolme=redaktor&id=${encodeURIComponent(t.id)}` : urlFor.detail(t)); },
    onInquiry() { openInquiry(t); },
  });
  reader = { slug: t.slug, ctl, preview };
}
function closeReader() {
  if (!reader) return;
  reader.ctl.destroy(); reader = null;
  store.flush();
  document.body.classList.remove('is-reading');
}

// ---------- Published owner comics (Supabase) ----------
// state: loading | ready | missing (publishing backend not installed yet) | error (offline / service down)
let remoteState = 'loading';
async function loadRemote() {
  remoteState = 'loading';
  try {
    const list = await fetchCatalogue();
    list.forEach(t => attachSigner(t));
    if (list.length) await signCovers(list).catch(e => console.warn('Luna: cover signing failed', e));
    addRemote(list);
    remoteState = 'ready';
  } catch (e) {
    remoteState = /PGRST202|42883|PGRST205/.test(e.code) ? 'missing' : 'error';
    if (remoteState === 'error') console.warn('Luna: published catalogue unavailable', e);
  }
  const v = route().view;
  if (v === 'reader' || v === 'preview' || v === 'editor') { if (!reader) render(); }
  else { const y = scrollY; render(); scrollTo(0, y); }
}
// Signs a remote title's cover and readable pages before its detail page / reader is shown.
const preparing = new Map();
function prepare(t) {
  if (preparing.has(t.slug)) return preparing.get(t.slug);
  const p = t.ensure().then(() => { t.urlsReady = true; }, e => { t.urlsError = e; console.warn('Luna: page signing failed', e); })
    .finally(() => { preparing.delete(t.slug); const r = route(); if ((r.slug === t.slug) && !reader) render(); });
  preparing.set(t.slug, p);
  return p;
}
function loadingView(text) {
  return h('section', { class: 'empty-page', 'data-title': 'Yüklənir: Luna Comics', 'aria-busy': 'true' }, h('p', { role: 'status', class: 'lead', text }));
}
// Unknown slug: wait for the published catalogue before saying "not found"; say honestly if it could not load.
function pendingOr(fallback) {
  if (remoteState === 'loading') return loadingView('Kataloq yüklənir…');
  const view = fallback();
  if (remoteState === 'error') view.append(h('p', { class: 'small', text: 'Diqqət: Luna-da dərc olunan yeni əsərlərin siyahısı yüklənmədi (bağlantı problemi). Səhifəni yeniləyin.' }), h('button', { class: 'btn btn-glass', type: 'button', text: 'Yenidən yoxla', onclick: () => loadRemote() }));
  return view;
}
function remoteNote() {
  return remoteState === 'error' ? h('p', { class: 'store-note store-warn', role: 'status' }, icon('shield'), h('span', { text: 'Yeni dərc olunan əsərlərin siyahısı hazırda yüklənmədi. Başlanğıc kolleksiya işləyir; səhifəni bir az sonra yeniləyin.' })) : null;
}
function newReleases() {
  const list = titles.filter(t => t.remote);
  if (!list.length) return null;
  return h('section', { class: 'catalogue new-releases', 'aria-labelledby': 'new-h' },
    h('div', { class: 'section-head' }, h('h2', { id: 'new-h', text: 'Luna-da yeni' }), h('p', { text: 'Luna-nın öz nəşrləri: müəlliflərdən birbaşa.' })),
    h('ol', { class: 'grid grid-row' }, list.slice(0, 8).map(titleCard)));
}

// ---------- Editor panel and draft preview (lazy: only editors download the importer) ----------
let editorMod = null;
function loadEditor() { return (editorMod ||= import('./editor.js').catch(e => { editorMod = null; throw e; })); }
function editorCtx() {
  return { main, go, render, toast, acct, openPreview: (id, all) => go(`/Luna?onizle=${encodeURIComponent(id)}${all ? '&hamisi=1' : ''}`), refreshCatalogue: loadRemote };
}
function showEditor(r, fresh) {
  const a = acct.account();
  if (a.status === 'idle' || a.status === 'loading' || (a.status === 'signed-in' && a.editor === undefined)) {
    main.replaceChildren(loadingView('Redaktor hüququ yoxlanılır…')); document.title = 'Redaktor paneli: Luna Comics'; return;
  }
  if (a.status !== 'signed-in' || !a.editor) { main.replaceChildren(forbiddenView(a)); document.title = 'Redaktor paneli: Luna Comics'; if (fresh) { scrollTo(0, 0); main.focus({ preventScroll: true }); } return; }
  if (!editorMod) main.replaceChildren(loadingView('Redaktor paneli açılır…'));
  loadEditor().then(m => { if (route().view === 'editor') m.renderEditor(editorCtx(), r, { fresh }); })
    .catch(() => main.replaceChildren(h('section', { class: 'empty-page' }, h('h1', { text: 'Redaktor paneli açılmadı' }), h('p', { text: 'Bağlantını yoxlayıb səhifəni yeniləyin.' }))));
}
function forbiddenView(a) {
  const signedIn = a.status === 'signed-in';
  return h('section', { class: 'empty-page', 'data-title': 'Redaktor paneli: Luna Comics' },
    h('h1', { text: 'Redaktor paneli' }),
    h('p', { text: signedIn
      ? 'Bu bölmə yalnız Luna redaktorları üçündür. Hesabınız adi oxucu hesabıdır; redaktor hüququ yalnız sayt sahibi tərəfindən serverdə verilir.'
      : a.status === 'unavailable' ? 'Hesab xidmətinə qoşulmaq alınmadı, ona görə redaktor hüququ yoxlanıla bilmir.' : 'Redaktor paneli üçün Luna redaktoru kimi daxil olun.' }),
    a.editorError ? h('p', { class: 'small', text: 'Redaktor xidməti hələ quraşdırılmayıb və ya cavab vermir.' }) : null,
    h('div', { class: 'detail-actions' },
      signedIn ? h('a', { class: 'btn btn-white', href: '/Luna', 'data-nav': true, text: 'Kəşf et' }) : h('a', { class: 'btn btn-white', href: '/Luna?bolme=hesab', 'data-nav': true, text: 'Daxil ol' }),
      h('a', { class: 'btn btn-glass', href: '/Luna?bolme=kitabxana', 'data-nav': true, text: 'Kitabxanam' })));
}
async function showPreview(r) {
  const a = acct.account();
  if (a.status === 'idle' || a.status === 'loading' || (a.status === 'signed-in' && a.editor === undefined)) { closeReader(); main.replaceChildren(loadingView('Önizləmə hazırlanır…')); return; }
  if (a.status !== 'signed-in' || !a.editor) { closeReader(); main.replaceChildren(forbiddenView(a)); return; }
  if (reader?.preview && reader.slug === `preview:${r.id}:${r.all}`) return;
  closeReader();
  main.replaceChildren(loadingView('Önizləmə hazırlanır…'));
  try {
    const m = await loadEditor();
    const t = await m.previewTitle(editorCtx(), r.id, r.all);
    if (route().view !== 'preview') return;
    if (!t) { main.replaceChildren(h('section', { class: 'empty-page' }, h('h1', { text: 'Önizləmə üçün hazır səhifə yoxdur' }), h('a', { class: 'btn btn-white', href: `/Luna?bolme=redaktor&id=${encodeURIComponent(r.id)}`, 'data-nav': true, text: 'Redaktora qayıt' }))); return; }
    t.slug = `preview:${r.id}:${r.all}`;
    startReader(t, r, { preview: true });
  } catch (e) {
    main.replaceChildren(h('section', { class: 'empty-page' }, h('h1', { text: 'Önizləmə açılmadı' }), h('p', { text: String(e.message || e) })));
  }
}

// ---------- Boot ----------
store.onStoreChange(() => updateNav(route().view));
let firstAccount = true, lastEditorKey = '';
acct.onAccount(a => {
  updateNav(route().view);
  if (firstAccount) { firstAccount = false; return; }
  if (a.message && a.status === 'signed-out' && /müddəti/.test(a.message)) toast(a.message, 'error');
  if (a.sync === 'ready' && a.message) toast(a.message);
  const v = route().view;
  if (v === 'account' || v === 'library') render();
  // Editor views only re-render when the server's answer about the editor role (or the session) changes.
  const key = `${a.status}:${a.editor}`;
  if ((v === 'editor' || v === 'preview') && key !== lastEditorKey) render();
  lastEditorKey = key;
});
addEventListener('pagehide', () => store.flush());
render({ fresh: false });
acct.init();
loadRemote();
