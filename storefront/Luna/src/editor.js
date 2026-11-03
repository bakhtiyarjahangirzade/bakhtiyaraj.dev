// Luna editor panel (/Luna?bolme=redaktor). Loaded on demand, only after the server has confirmed the editor
// role (public.luna_editor_me). Hiding this panel is not the protection: every call below is checked again by
// Postgres (SECURITY DEFINER functions + RLS) and by Storage policies, see supabase/luna-publishing.sql.
//
// Lifecycle of an import (docs/luna-publishing-implementation.md):
//   choose file -> inspect locally (format, limits, password, page count) -> begin revision (server)
//   -> prepare pages one by one (PDF render / archive extract / decode) while uploading them directly to Storage
//      (2 at a time, retried) and the original file via resumable upload -> cover -> finish revision (server
//      verifies every object exists) -> draft ready. Cancel/failure never touches the published version.
import './editor.css';
import { h, icon, toast } from './ui.js';
import { LIMITS_TEXT, ACCEPT, validateMeta, publishProblems, slugify, humanBytes, META_LANGUAGES } from './import-core.js';
import { inspect, preparePages, makeCover, coverFromFile } from './importer.js';
import { uploadObject, tusUpload, removeObjects } from './upload.js';
import { signPaths, attachSigner } from './remote.js';
import { toTitle } from './published.js';
import { LANGUAGES, titles } from './catalogue.js';
import { PAGES_BUCKET, SOURCES_BUCKET } from './config.js';

let ctx = null;
const jobs = new Map();      // comic id -> import job (kept while the tab lives, so retry keeps prepared pages)
const drafts = new Map();    // comic id -> unsaved form / page-order edits (kept through re-renders and retries)
const urls = new Map();      // storage path -> signed (or local blob) URL for thumbnails
const local = new Map();     // storage path -> Blob prepared in this tab (no re-download for covers)
const uuid = () => crypto.randomUUID();
const pad3 = n => String(n).padStart(3, '0');
const rand = () => Math.random().toString(36).slice(2, 10);
const token = () => ctx.acct.accessToken();

// ---------- Server calls ----------
function humanRpc(e) {
  const m = String(e?.message || e || '');
  if (/editor role required|permission denied|42501/i.test(m) || e?.code === '42501') return 'Redaktor hüququ təsdiqlənmədi. Yenidən daxil olun.';
  if (/luna_comics_slug_key|duplicate key/i.test(m)) return 'Bu ünvan (slug) artıq başqa əsərdə istifadə olunur.';
  if (/slug is permanent/i.test(m)) return 'Dərc olunmuş əsərin ünvanı dəyişdirilmir: saxlanmış kitabxana və linklər qırılmasın deyə.';
  if (/PGRST202|Could not find the function/i.test(m)) return 'Dərc xidməti serverdə hələ quraşdırılmayıb (supabase/luna-publishing.sql).';
  if (/fetch|network|Failed to load/i.test(m)) return 'Serverə qoşulmaq alınmadı. İnternet bağlantısını yoxlayın.';
  return m.replace(/^luna:\s*/, '');
}
async function rpc(fn, args = {}) {
  const sb = await ctx.acct.client();
  const { data, error } = await sb.rpc(fn, args);
  if (error) { const e = new Error(humanRpc(error)); e.code = error.code; throw e; }
  return data;
}
async function signed(paths) {
  const missing = paths.filter(p => p && !urls.has(p));
  if (missing.length) { const got = await signPaths(missing, { token: await token() }); got.forEach((v, k) => urls.set(k, v)); }
  return paths.map(p => urls.get(p));
}
async function blobOf(path) {
  if (local.has(path)) return local.get(path);
  const [u] = await signed([path]);
  const r = await fetch(u);
  if (!r.ok) throw new Error('Səhifə şəkli yüklənmədi.');
  return r.blob();
}

// ---------- Entry points ----------
export function renderEditor(c, r, { fresh } = {}) {
  ctx = c;
  if (fresh) scrollTo(0, 0);
  return r.id ? editView(r.id, fresh) : listView(fresh);
}
// Draft preview in the real reader: the editor's token signs the draft pages (Storage allows editors only).
export async function previewTitle(c, id, all) {
  ctx = c;
  const d = await rpc('luna_editor_get', { p_id: id });
  const rev = d?.draft || d?.published;
  if (!rev?.pages?.length) return null;
  const t = toTitle(d, rev, { preview: { all } });
  attachSigner(t, token);
  await t.ensure();
  t.urlsReady = true;
  return t;
}

function mount(view, fresh) {
  ctx.main.replaceChildren(view);
  document.title = view.dataset.title;
  if (fresh) ctx.main.focus({ preventScroll: true });
}
const statusLabel = { draft: 'Qaralama', published: 'Dərc olunub', unpublished: 'Dərcdən çıxarılıb' };
const badge = s => h('span', { class: `ed-badge ed-${s}`, text: statusLabel[s] || s });
// Written out by hand: browsers without Azerbaijani locale data would print "2026 M11 3".
const MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avq', 'sen', 'okt', 'noy', 'dek'];
const dateText = iso => { if (!iso) return ''; const d = new Date(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

// ---------- List ----------
async function listView(fresh) {
  const body = h('div', { class: 'ed-list-body' }, h('p', { role: 'status', class: 'small', text: 'Əsərlər yüklənir…' }));
  const newBtn = h('button', { class: 'btn btn-violet', type: 'button', onclick: () => createComic(newBtn) }, icon('plus'), 'Yeni əsər');
  const view = h('section', { class: 'ed', 'data-title': 'Redaktor paneli: Luna Comics' },
    h('header', { class: 'large-title ed-title' }, h('p', { class: 'eyebrow', text: 'Luna · yalnız redaktorlar' }), h('h1', { text: 'Redaktor paneli' })),
    h('p', { class: 'ed-lead', text: 'Öz komikslərinizi PDF, CBZ/ZIP və ya şəkil faylları kimi yükləyin, səhifələri düzün, oxucuda önizləyin və dərc edin. Dərc olunan əsər dərhal kataloqda görünür; kod dəyişikliyi və ya yenidən deploy lazım deyil.' }),
    h('div', { class: 'ed-actions' }, newBtn),
    body);
  mount(view, fresh);
  let list;
  try { list = await rpc('luna_editor_list'); }
  catch (e) {
    body.replaceChildren(h('div', { class: 'store-note store-warn', role: 'alert' }, h('p', { text: e.message }), h('button', { class: 'btn btn-glass', type: 'button', text: 'Yenidən yoxla', onclick: () => listView() })));
    return;
  }
  if (!list.length) { body.replaceChildren(h('div', { class: 'ed-empty' }, h('h2', { text: 'Hələ əsər yoxdur' }), h('p', { text: '“Yeni əsər” düyməsi ilə başlayın: əvvəl fayl seçə, məlumatı sonra doldura bilərsiniz.' }))); return; }
  const covers = await signed(list.map(c => c.cover?.path)).catch(() => []);
  body.replaceChildren(h('ul', { class: 'ed-list' }, list.map((c, k) => h('li', {},
    h('a', { class: 'ed-row', href: `/Luna?bolme=redaktor&id=${c.id}`, 'data-nav': true },
      h('span', { class: 'ed-thumb', vars: { '--tone': c.tone || '#2c2c2e' } }, covers[k] ? h('img', { src: covers[k], alt: '', loading: 'lazy' }) : icon('page')),
      h('span', { class: 'ed-row-main' },
        h('strong', { text: c.title || 'Adsız əsər' }),
        h('span', { class: 'small', text: [c.creator, c.page_count ? `${c.page_count} səhifə` : 'səhifə yoxdur', c.access === 'paid' ? `${c.price ?? '?'} AZN${c.is_sample ? ' (nümunə)' : ''}` : 'pulsuz', `yeniləndi ${dateText(c.updated_at)}`].filter(Boolean).join(' · ') })),
      badge(c.status), icon('chevron'))))));
}
async function createComic(btn) {
  btn.disabled = true;
  // The id is created once and remembered until the server confirms, so a retry after a network error
  // updates the same record instead of creating a duplicate.
  let id; try { id = sessionStorage.getItem('luna.editor.new'); } catch { /* ignore */ }
  if (!id) { id = uuid(); try { sessionStorage.setItem('luna.editor.new', id); } catch { /* ignore */ } }
  try {
    await rpc('luna_save_comic', { p_id: id, p: { ...blankMeta(), slug: `yeni-${id.slice(0, 8)}` } });
    try { sessionStorage.removeItem('luna.editor.new'); } catch { /* ignore */ }
    ctx.go(`/Luna?bolme=redaktor&id=${id}`);
  } catch (e) { btn.disabled = false; toast(e.message, 'error'); }
}
const blankMeta = () => ({ title: '', title_note: '', series: '', episode: null, creator: '', synopsis: '', language: 'az', language_note: '', genres: [], credits: [], rights: '', year: new Date().getFullYear(), access: 'free', is_sample: false, price: null, preview_pages: null });
const metaOf = d => ({ slug: d.slug, title: d.title || '', title_note: d.title_note || '', series: d.series || '', episode: d.episode ?? null, creator: d.creator || '', synopsis: d.synopsis || '', language: d.language || 'az', language_note: d.language_note || '', genres: d.genres || [], credits: d.credits || [], rights: d.rights || '', year: d.year ?? null, access: d.access || 'free', is_sample: !!d.is_sample, price: d.price === null || d.price === undefined ? null : Number(d.price), preview_pages: d.preview_pages ?? null });

// ---------- Edit ----------
let current = null; // { id, d, view }
async function editView(id, fresh) {
  const shell = h('section', { class: 'ed', 'data-title': 'Əsəri redaktə et: Luna Comics' }, h('p', { role: 'status', class: 'small ed-loading', text: 'Əsər yüklənir…' }));
  if (fresh || current?.id !== id) mount(shell, fresh);
  let d;
  try { d = await rpc('luna_editor_get', { p_id: id }); }
  catch (e) { shell.replaceChildren(h('div', { class: 'store-note store-warn', role: 'alert' }, h('p', { text: e.message }), h('button', { class: 'btn btn-glass', type: 'button', text: 'Yenidən yoxla', onclick: () => editView(id) }))); mount(shell); return; }
  if (!d) { shell.replaceChildren(h('h1', { text: 'Əsər tapılmadı' }), h('a', { class: 'btn btn-white', href: '/Luna?bolme=redaktor', 'data-nav': true, text: 'Bütün əsərlər' })); mount(shell); return; }
  const st = drafts.get(id) || { form: metaOf(d), order: null };
  drafts.set(id, st);
  if (!jobs.has(id)) jobs.set(id, newJob(id));
  current = { id, d, st, job: jobs.get(id) };
  paint(fresh);
}
async function reload() {
  const d = await rpc('luna_editor_get', { p_id: current.id });
  current.d = d;
  // Server values win for fields that were not edited locally.
  if (!formDirty()) current.st.form = metaOf(d);
  current.st.order = null;
  paint();
}
const formDirty = () => JSON.stringify(current.st.form) !== JSON.stringify(metaOf(current.d));

function paint(fresh) {
  const { d } = current;
  const focusKey = document.activeElement?.dataset?.fk;
  const view = h('section', { class: 'ed', 'data-title': `${d.title || 'Adsız əsər'}: Luna redaktor` },
    h('nav', { class: 'crumbs ed-crumbs', 'aria-label': 'Səhifə yolu' }, h('a', { href: '/Luna?bolme=redaktor', 'data-nav': true }, icon('prev'), 'Bütün əsərlər')),
    h('header', { class: 'ed-head' },
      h('div', {}, h('h1', { text: d.title || 'Adsız əsər' }), h('p', { class: 'small' }, badge(d.status), ` /Luna?eser=${d.slug}`)),
      d.status === 'published' ? h('a', { class: 'btn btn-glass', href: `/Luna?eser=${encodeURIComponent(d.slug)}`, 'data-nav': true }, 'Saytda aç', icon('arrow')) : null),
    h('div', { class: 'ed-grid' },
      h('div', { class: 'ed-col' }, importCard(), pagesCard()),
      h('div', { class: 'ed-col' }, metaCard(), publishCard(), historyCard())));
  ctx.main.replaceChildren(view);
  document.title = view.dataset.title;
  if (fresh) ctx.main.focus({ preventScroll: true });
  else if (focusKey) view.querySelector(`[data-fk="${CSS.escape(focusKey)}"]`)?.focus({ preventScroll: true });
}
function repaintCard(name) {
  const old = ctx.main.querySelector(`[data-card="${name}"]`);
  if (!old) return;
  const focusKey = document.activeElement?.dataset?.fk;
  const fresh = { import: importCard, pages: pagesCard, meta: metaCard, publish: publishCard, history: historyCard }[name]();
  old.replaceWith(fresh);
  if (focusKey) fresh.querySelector(`[data-fk="${CSS.escape(focusKey)}"]`)?.focus({ preventScroll: true });
}
const card = (name, title, ...kids) => h('section', { class: 'ed-card', 'data-card': name, 'aria-labelledby': `ed-${name}-h` }, h('h2', { id: `ed-${name}-h`, text: title }), ...kids);

// ---------- Import ----------
function newJob(comicId) {
  return { comicId, state: 'idle', plan: null, error: null, revision: null, prepared: [], uploaded: new Set(), source: { sent: 0, total: 0, done: false, tus: {} }, cover: null, ctl: null };
}
const STAGE = { idle: 'Gözləyir', checking: 'Yoxlanılır', inspected: 'Başlamağa hazır', rejected: 'Qəbul edilmədi', running: 'Hazırlanır və yüklənir', finishing: 'Yekunlaşdırılır', failed: 'Uğursuz', cancelling: 'Ləğv edilir', cancelled: 'Ləğv edildi', done: 'Hazırdır' };
function importCard() {
  const job = current.job, d = current.d;
  const input = h('input', { type: 'file', id: 'ed-file', accept: ACCEPT, multiple: true, 'data-fk': 'file', 'aria-describedby': 'ed-formats' });
  input.addEventListener('change', () => { if (input.files.length) choose([...input.files]); });
  const busy = job.state === 'running' || job.state === 'finishing' || job.state === 'cancelling' || job.state === 'checking';
  const drop = h('div', { class: 'ed-drop' },
    h('label', { for: 'ed-file', class: 'ed-drop-label' }, icon('page'), h('strong', { text: 'Faylı bura atın və ya seçin' }), h('span', { class: 'small', text: 'PDF, CBZ/ZIP və ya bir neçə JPG/PNG/WebP' })),
    input);
  drop.addEventListener('dragover', e => { if (busy) return; e.preventDefault(); drop.classList.add('is-over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('is-over'));
  drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('is-over'); if (!busy && e.dataTransfer?.files?.length) choose([...e.dataTransfer.files]); });
  const formats = h('details', { class: 'ed-formats', id: 'ed-formats', open: job.state === 'idle' || job.state === 'rejected' ? true : null },
    h('summary', { text: 'Dəstəklənən formatlar və limitlər' }), h('ul', {}, LIMITS_TEXT.map(t => h('li', { text: t }))));
  const kids = [];
  kids.push(h('p', { class: 'ed-stage', role: 'status', 'aria-live': 'polite' }, h('span', { class: `ed-dot ed-dot-${job.state}`, 'aria-hidden': 'true' }), `Vəziyyət: ${STAGE[job.state]}`, job.plan && job.state !== 'rejected' ? ` — ${job.plan.label}` : ''));
  if (job.error) kids.push(h('div', { class: 'ed-error', role: 'alert' }, job.error.split('\n').map(l => h('p', { text: l }))));
  if (['idle', 'rejected', 'cancelled', 'done', 'inspected'].includes(job.state)) kids.push(drop);
  if (job.state === 'inspected') {
    kids.push(h('div', { class: 'ed-actions' },
      h('button', { class: 'btn btn-white', type: 'button', 'data-fk': 'start', onclick: () => run(job) }, 'İdxala başla', icon('arrow'))));
    if (d.published_revision) kids.push(h('p', { class: 'small', text: 'Dərc olunmuş versiya yeni səhifələr hazır olub dərc edilənə qədər saytda dəyişmədən qalır.' }));
  }
  if (['running', 'finishing', 'failed', 'cancelling'].includes(job.state)) {
    kids.push(progressBlock(job));
    const acts = h('div', { class: 'ed-actions' });
    if (job.state === 'failed') acts.append(h('button', { class: 'btn btn-white', type: 'button', 'data-fk': 'retry', onclick: () => run(job) }, 'Yenidən cəhd et'));
    if (job.state !== 'cancelling') acts.append(h('button', { class: 'btn btn-glass', type: 'button', 'data-fk': 'cancel', onclick: () => cancel(job) }, job.state === 'failed' ? 'İmtina et və təmizlə' : 'Ləğv et'));
    kids.push(acts);
    if (job.state === 'failed') kids.push(h('p', { class: 'small', text: 'Yenidən cəhd hazır səhifələri təkrar çevirmir və yüklənmiş səhifələri təkrar yükləmir; əsərin məlumatı saxlanılır.' }));
  }
  if (job.state === 'done') kids.push(h('p', { class: 'ed-ok', role: 'status', text: `${job.total} səhifə serverdə hazırdır və qaralamaya əlavə edildi. Sıranı və üz qabığını aşağıda yoxlayın, sonra önizləyin.` }));
  kids.push(formats);
  return card('import', '1. Fayl', ...kids);
}
function progressBlock(job) {
  const prepared = job.prepared.filter(Boolean).length;
  const bar = (label, now, max, id) => h('div', { class: 'ed-progress' },
    h('label', { for: id, text: label }),
    h('progress', { id, max: String(Math.max(1, max)), value: String(now) }),
    h('span', { class: 'small', id: `${id}-t`, text: `${now} / ${max}` }));
  const kids = [bar('Səhifələr hazırlanır', prepared, job.total, 'ed-p-prep'), bar('Səhifələr yüklənir', job.uploaded.size, job.total, 'ed-p-up')];
  if (job.plan?.mode !== 'images') {
    const s = job.source;
    kids.push(h('div', { class: 'ed-progress' },
      h('label', { for: 'ed-p-src', text: 'Orijinal fayl (gizli arxiv)' }),
      h('progress', { id: 'ed-p-src', max: String(Math.max(1, s.total || job.plan?.bytes || 1)), value: String(s.sent) }),
      h('span', { class: 'small', id: 'ed-p-src-t', text: `${humanBytes(s.sent)} / ${humanBytes(s.total || job.plan?.bytes || 0)}` })));
  }
  const thumbs = h('ol', { class: 'ed-mini', 'aria-label': 'Hazırlanan səhifələr' }, job.prepared.map((p, k) => p ? h('li', { class: job.uploaded.has(k) ? 'is-up' : '' }, h('img', { src: p.url, alt: `Səhifə ${k + 1}` })) : null));
  return h('div', { class: 'ed-progress-wrap' }, ...kids, thumbs);
}
let progressTimer = 0;
function progress() {
  // Cheap in-place updates (no full repaint, focus stays on the cancel button).
  if (progressTimer) return;
  progressTimer = requestAnimationFrame(() => {
    progressTimer = 0;
    const job = current?.job; if (!job) return;
    const set = (id, v, max, text) => { const el = document.getElementById(id); if (el) { el.max = Math.max(1, max); el.value = v; } const t = document.getElementById(`${id}-t`); if (t) t.textContent = text; };
    const prepared = job.prepared.filter(Boolean).length;
    set('ed-p-prep', prepared, job.total, `${prepared} / ${job.total}`);
    set('ed-p-up', job.uploaded.size, job.total, `${job.uploaded.size} / ${job.total}`);
    set('ed-p-src', job.source.sent, job.source.total || 1, `${humanBytes(job.source.sent)} / ${humanBytes(job.source.total)}`);
    const mini = document.querySelector('.ed-mini');
    if (mini && mini.children.length !== prepared) mini.replaceWith(progressBlock(job).querySelector('.ed-mini'));
    else mini?.querySelectorAll('li').forEach((li, k) => li.classList.toggle('is-up', job.uploaded.has(k)));
  });
}
async function choose(files) {
  const job = current.job;
  if (job.revision && job.state === 'failed') await cancel(job, { quiet: true });
  Object.assign(job, newJob(job.comicId), { state: 'checking' });
  repaintCard('import');
  try {
    job.plan = await inspect(files);
    job.total = job.plan.pages;
    job.state = 'inspected';
  } catch (e) {
    job.state = 'rejected';
    job.error = e.message;
  }
  repaintCard('import');
  document.querySelector(job.state === 'inspected' ? '[data-fk="start"]' : '.ed-error')?.focus?.();
}
const isCancel = e => e?.code === 'cancelled' || e?.name === 'AbortError';
async function withRetry(fn, signal, tries = 3) {
  for (let k = 0; ; k++) {
    try { return await fn(); } catch (e) {
      if (isCancel(e) || signal.aborted || k >= tries - 1 || (e.status && e.status < 500 && e.status !== 408 && e.status !== 429)) throw e;
      await new Promise(r => setTimeout(r, 800 * 3 ** k));
    }
  }
}
async function run(job) {
  job.ctl = new AbortController();
  const signal = job.ctl.signal;
  job.state = 'running'; job.error = null;
  repaintCard('import');
  addEventListener('beforeunload', warnUnload);
  try {
    job.revision ||= uuid();
    const plan = job.plan;
    const begin = await rpc('luna_begin_revision', { p_comic: job.comicId, p_revision: job.revision, p_kind: plan.mode, p_name: plan.files.length > 1 ? `${plan.files.length} şəkil` : plan.files[0].name, p_bytes: plan.mode === 'images' ? 0 : plan.bytes });
    const tasks = [pagesPipeline(job, signal)];
    if (begin.source_path && !job.source.done) tasks.push(sourceUpload(job, begin.source_path, signal));
    await Promise.all(tasks.map(p => p.catch(e => { job.ctl.abort(); throw e; })));
    if (!job.cover) {
      const c = await makeCover(job.prepared[0].blob);
      const id = rand();
      const big = `${job.comicId}/${job.revision}/cover-${id}.${c.big.ext}`, sm = `${job.comicId}/${job.revision}/cover-sm-${id}.${c.small.ext}`;
      const tk = await token();
      await withRetry(() => uploadObject(PAGES_BUCKET, big, c.big.blob, { token: tk, signal }), signal);
      await withRetry(() => uploadObject(PAGES_BUCKET, sm, c.small.blob, { token: tk, signal }), signal);
      job.cover = { path: big, sm, width: c.big.width, height: c.big.height, tone: c.tone };
      urls.set(big, URL.createObjectURL(c.big.blob)); urls.set(sm, URL.createObjectURL(c.small.blob));
    }
    job.state = 'finishing'; repaintCard('import');
    const pages = job.prepared.map(p => ({ path: p.path, width: p.width, height: p.height, bytes: p.blob.size }));
    await rpc('luna_finish_revision', { p_revision: job.revision, p_pages: pages, p_cover: job.cover });
    job.prepared.forEach(p => { urls.set(p.path, p.url); local.set(p.path, p.blob); }); // thumbnails stay local: no re-download
    job.state = 'done';
    toast(`${pages.length} səhifə hazırdır. Qaralamanı önizləyə bilərsiniz.`);
    await reload();
  } catch (e) {
    if (job.state === 'cancelling') return;
    job.state = 'failed';
    job.error = isCancel(e) ? 'İdxal dayandırıldı.' : e.message;
    rpc('luna_fail_revision', { p_revision: job.revision, p_error: job.error }).catch(() => {});
    repaintCard('import');
    document.querySelector('[data-fk="retry"]')?.focus();
  } finally {
    removeEventListener('beforeunload', warnUnload);
  }
}
function warnUnload(e) { e.preventDefault(); e.returnValue = ''; }
async function pagesPipeline(job, signal) {
  const inflight = new Set();
  const schedule = k => {
    const p = withRetry(async () => uploadObject(PAGES_BUCKET, job.prepared[k].path, job.prepared[k].blob, { token: await token(), signal }), signal)
      .then(() => { job.uploaded.add(k); progress(); });
    const tracked = p.finally(() => inflight.delete(tracked));
    tracked.catch(() => {});
    inflight.add(tracked);
    return tracked;
  };
  const wait = async () => { while (inflight.size >= 2) await Promise.race(inflight); };
  for (let k = 0; k < job.prepared.length; k++) if (job.prepared[k] && !job.uploaded.has(k)) { await wait(); schedule(k); }
  for await (const pg of preparePages(job.plan, { signal, skip: k => !!job.prepared[k] })) {
    job.total = pg.total;
    job.prepared[pg.index] = { ...pg, url: URL.createObjectURL(pg.blob), path: `${job.comicId}/${job.revision}/p${pad3(pg.index + 1)}.${pg.ext}` };
    progress();
    await wait();
    schedule(pg.index);
  }
  await Promise.all(inflight);
  if (job.prepared.filter(Boolean).length !== job.total || job.uploaded.size !== job.total) throw new Error('Bütün səhifələr yüklənmədi. Yenidən cəhd edin.');
}
async function sourceUpload(job, path, signal) {
  const f = job.plan.files[0].file;
  job.source.total = f.size;
  const type = job.plan.mode === 'pdf' ? 'application/pdf' : /\.cbz$/i.test(f.name) ? 'application/vnd.comicbook+zip' : 'application/zip';
  await withRetry(() => tusUpload(SOURCES_BUCKET, path, f, { getToken: token, signal, state: job.source.tus, contentType: type, onProgress: s => { job.source.sent = s; progress(); } }), signal);
  job.source.done = true;
}
async function cancel(job, { quiet = false } = {}) {
  const was = job.state;
  job.state = 'cancelling';
  if (!quiet) repaintCard('import');
  job.ctl?.abort();
  await new Promise(r => setTimeout(r, 50));
  let note = 'İdxal ləğv edildi. Yüklənmiş hissələr silindi; dərc olunmuş versiyaya toxunulmadı.';
  if (job.revision) {
    try {
      await rpc('luna_fail_revision', { p_revision: job.revision, p_error: 'Redaktor tərəfindən ləğv edildi' });
      const left = await rpc('luna_discard_revision', { p_revision: job.revision });
      const tk = await token();
      await removeObjects(PAGES_BUCKET, left.pages, { token: tk });
      await removeObjects(SOURCES_BUCKET, left.sources, { token: tk });
    } catch (e) { note = `İdxal dayandırıldı, amma təmizləmə tamamlanmadı (${e.message}). “Versiyalar” bölməsindən sonra təmizləyə bilərsiniz.`; }
  }
  job.prepared.forEach(p => p && URL.revokeObjectURL(p.url));
  Object.assign(job, newJob(job.comicId), { state: was === 'inspected' ? 'idle' : 'cancelled', error: null });
  if (!quiet) { toast(note); repaintCard('import'); repaintCard('history'); document.getElementById('ed-file')?.focus(); }
}

// ---------- Pages: order, remove, cover ----------
function pagesCard() {
  const d = current.d, rev = d.draft || d.published;
  if (!rev?.pages?.length) return card('pages', '2. Səhifələr', h('p', { class: 'small', text: 'Fayl idxal olunandan sonra səhifələr burada görünəcək: sıranı dəyişə, səhifə silə və üz qabığını seçə biləcəksiniz.' }));
  const st = current.st;
  st.order ||= { pages: rev.pages.map(p => ({ ...p })), removed: new Set(), coverPage: null, coverFile: null, saving: false, composeId: null };
  const o = st.order;
  const dirty = o.removed.size || o.coverPage || o.coverFile || o.pages.some((p, k) => p.path !== rev.pages[k].path);
  const grid = h('ol', { class: 'ed-pages', 'aria-label': 'Səhifələr, oxu sırası ilə' });
  const move = (k, to) => { if (to < 0 || to >= o.pages.length) return; const [p] = o.pages.splice(k, 1); o.pages.splice(to, 0, p); repaintCard('pages'); };
  o.pages.forEach((p, k) => {
    const removed = o.removed.has(p.path);
    const isCover = o.coverPage === p.path;
    const img = h('img', { alt: `Səhifə ${k + 1}`, loading: 'lazy', width: p.width, height: p.height, src: urls.get(p.path) || '' });
    const li = h('li', { class: `ed-page${removed ? ' is-removed' : ''}${isCover ? ' is-cover' : ''}`, draggable: 'true', 'data-k': k },
      h('div', { class: 'ed-page-img' }, img, h('span', { class: 'page-no', text: String(k + 1) }), isCover ? h('span', { class: 'ed-cover-chip', text: 'Yeni üz qabığı' }) : null),
      h('div', { class: 'ed-page-tools' },
        h('button', { type: 'button', class: 'ed-tool', 'data-fk': `l${p.path}`, 'aria-label': `Səhifə ${k + 1}: bir yer əvvələ`, disabled: k === 0, onclick: () => move(k, k - 1) }, icon('prev')),
        h('button', { type: 'button', class: 'ed-tool', 'data-fk': `r${p.path}`, 'aria-label': `Səhifə ${k + 1}: bir yer sonraya`, disabled: k === o.pages.length - 1, onclick: () => move(k, k + 1) }, icon('next')),
        h('button', { type: 'button', class: 'ed-tool', 'data-fk': `c${p.path}`, 'aria-pressed': String(isCover), 'aria-label': `Səhifə ${k + 1}-i üz qabığı et`, disabled: removed, onclick: () => { o.coverPage = isCover ? null : p.path; o.coverFile = null; repaintCard('pages'); } }, icon('bookmark')),
        h('button', { type: 'button', class: 'ed-tool', 'data-fk': `x${p.path}`, 'aria-pressed': String(removed), 'aria-label': removed ? `Səhifə ${k + 1}-i geri qaytar` : `Səhifə ${k + 1}-i sil`, onclick: () => { if (removed) o.removed.delete(p.path); else { o.removed.add(p.path); if (o.coverPage === p.path) o.coverPage = null; } repaintCard('pages'); } }, icon(removed ? 'plus' : 'close'))));
    li.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', String(k)); e.dataTransfer.effectAllowed = 'move'; li.classList.add('is-drag'); });
    li.addEventListener('dragend', () => li.classList.remove('is-drag'));
    li.addEventListener('dragover', e => { e.preventDefault(); li.classList.add('is-target'); });
    li.addEventListener('dragleave', () => li.classList.remove('is-target'));
    li.addEventListener('drop', e => { e.preventDefault(); const from = Number(e.dataTransfer.getData('text/plain')); if (Number.isInteger(from)) move(from, k); });
    grid.append(li);
  });
  const need = o.pages.map(p => p.path).filter(p => !urls.has(p));
  if (need.length) signed(need).then(() => grid.querySelectorAll('.ed-page').forEach((li, k) => { const im = li.querySelector('img'); if (!im.getAttribute('src')) im.src = urls.get(o.pages[k].path) || ''; })).catch(() => {});
  const coverInput = h('input', { type: 'file', id: 'ed-cover', accept: '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp', 'data-fk': 'coverfile' });
  coverInput.addEventListener('change', async () => {
    const f = coverInput.files[0]; if (!f) return;
    try { o.coverFile = await coverFromFile(f); o.coverPage = null; o.coverFile.url = URL.createObjectURL(o.coverFile.small.blob); toast('Yeni üz qabığı hazırdır. Saxlamaq üçün “Dəyişiklikləri saxla”.'); }
    catch (e) { toast(e.message, 'error'); }
    repaintCard('pages');
  });
  const curCover = rev.cover ? urls.get(rev.cover.sm) : null;
  if (rev.cover && !curCover) signed([rev.cover.sm]).then(([u]) => { const im = document.querySelector('.ed-cover-now img'); if (im && u) im.src = u; }).catch(() => {});
  const kept = o.pages.length - o.removed.size;
  return card('pages', '2. Səhifələr',
    h('p', { class: 'small', text: `${kept} səhifə${o.removed.size ? ` (${o.removed.size} silinmək üçün işarələnib)` : ''}. Sıranı ox düymələri və ya sürükləməklə dəyişin. ${d.draft_revision && d.draft_revision !== d.published_revision ? 'Bu qaralama versiyasıdır.' : d.published_revision ? 'Dəyişiklik saxlananda yeni qaralama yaranır; saytdakı versiya dərc edilənə qədər dəyişmir.' : ''}` }),
    h('div', { class: 'ed-cover-row' },
      h('figure', { class: 'ed-cover-now' }, h('img', { src: o.coverFile?.url || (o.coverPage && urls.get(o.coverPage)) || curCover || '', alt: 'Üz qabığı' }), h('figcaption', { class: 'small', text: o.coverFile ? 'Yeni üz qabığı (fayldan)' : o.coverPage ? 'Yeni üz qabığı (səhifədən)' : 'Hazırkı üz qabığı' })),
      h('div', { class: 'field' }, h('label', { for: 'ed-cover', text: 'Üz qabığını şəkil faylı ilə əvəz et' }), coverInput, h('p', { class: 'hint', text: 'Və ya səhifədəki əlfəcin düyməsi ilə səhifəni üz qabığı seçin.' }))),
    grid,
    h('div', { class: 'ed-actions' },
      h('button', { class: 'btn btn-white', type: 'button', 'data-fk': 'saveorder', disabled: !dirty || o.saving || !kept, onclick: () => saveOrder() }, o.saving ? 'Saxlanılır…' : 'Dəyişiklikləri saxla'),
      dirty ? h('button', { class: 'btn btn-glass', type: 'button', 'data-fk': 'resetorder', onclick: () => { current.st.order = null; repaintCard('pages'); } }, 'Geri al') : null));
}
async function saveOrder() {
  const { d } = current, o = current.st.order;
  o.saving = true; repaintCard('pages');
  const rev = (o.composeId ||= uuid()); // same id on retry: no duplicate revision
  try {
    await rpc('luna_begin_revision', { p_comic: d.id, p_revision: rev, p_kind: 'edit', p_name: 'Səhifə redaktəsi', p_bytes: 0 });
    let cover = (d.draft || d.published).cover;
    if (o.coverPage || o.coverFile) {
      const c = o.coverFile || await makeCover(await blobOf(o.coverPage));
      const id = rand(), tk = await token();
      const big = `${d.id}/${rev}/cover-${id}.${c.big.ext}`, sm = `${d.id}/${rev}/cover-sm-${id}.${c.small.ext}`;
      await uploadObject(PAGES_BUCKET, big, c.big.blob, { token: tk });
      await uploadObject(PAGES_BUCKET, sm, c.small.blob, { token: tk });
      urls.set(sm, URL.createObjectURL(c.small.blob));
      cover = { path: big, sm, width: c.big.width, height: c.big.height, tone: c.tone };
    }
    const pages = o.pages.filter(p => !o.removed.has(p.path)).map(p => ({ path: p.path, width: p.width, height: p.height, bytes: p.bytes }));
    await rpc('luna_finish_revision', { p_revision: rev, p_pages: pages, p_cover: cover });
    toast('Səhifə sırası və üz qabığı yeni qaralama kimi saxlanıldı.');
    current.st.order = null;
    await reload();
  } catch (e) {
    o.saving = false; repaintCard('pages');
    toast(`Saxlanmadı: ${e.message}`, 'error');
  }
}

// ---------- Metadata ----------
function metaCard() {
  const f = current.st.form, d = current.d;
  const locked = !!d.first_published_at;
  const errs = current.st.errors || {};
  const fid = k => `ed-m-${k}`;
  const err = k => h('p', { class: 'field-error', id: `${fid(k)}-e`, text: errs[k] || '' });
  const onIn = (k, conv = v => v) => e => { f[k] = conv(e.target.value); if (k === 'title' && !locked && /^yeni-/.test(f.slug || '')) { const s = slugify(f.title); if (s) { f.slug = s; const sl = document.getElementById(fid('slug')); if (sl) sl.value = s; } } markDirty(); };
  const text = (k, label, { req, hint, max, area, type = 'text', conv, attrs = {} } = {}) => h('div', { class: 'field' },
    h('label', { for: fid(k), text: `${label}${req ? ' *' : ''}` }),
    h(area ? 'textarea' : 'input', { id: fid(k), name: k, 'data-fk': `m-${k}`, type: area ? null : type, value: area ? null : f[k] ?? '', maxlength: max, rows: area ? 4 : null, 'aria-describedby': `${fid(k)}-e${hint ? ` ${fid(k)}-h` : ''}`, 'aria-invalid': errs[k] ? 'true' : null, oninput: onIn(k, conv), ...attrs }, area ? f[k] ?? '' : null),
    hint ? h('p', { class: 'hint', id: `${fid(k)}-h`, text: hint }) : null, err(k));
  const num = v => (v === '' ? null : Number(v));
  const lang = h('select', { id: fid('language'), 'data-fk': 'm-language', onchange: e => { f.language = e.target.value; markDirty(); } },
    META_LANGUAGES.map(k => h('option', { value: k, text: LANGUAGES[k], selected: f.language === k ? true : null })));
  const known = [...new Set(titles.flatMap(t => t.genres))].sort((a, b) => a.localeCompare(b, 'az'));
  const genreInput = h('input', { id: fid('genres'), 'data-fk': 'm-genres', value: f.genres.join(', '), 'aria-describedby': `${fid('genres')}-h ${fid('genres')}-e`, oninput: e => { f.genres = e.target.value.split(',').map(s => s.trim()).filter(Boolean).slice(0, 6); markDirty(); } });
  const credits = h('div', { class: 'ed-credits' });
  const drawCredits = () => credits.replaceChildren(...f.credits.map((c, k) => h('div', { class: 'ed-credit' },
    h('input', { 'aria-label': `Kredit ${k + 1}: rol`, 'data-fk': `cr${k}`, placeholder: 'Rol, məs. Rəsm', value: c[0], oninput: e => { c[0] = e.target.value; markDirty(); } }),
    h('input', { 'aria-label': `Kredit ${k + 1}: ad`, 'data-fk': `cn${k}`, placeholder: 'Ad Soyad', value: c[1], oninput: e => { c[1] = e.target.value; markDirty(); } }),
    h('button', { type: 'button', class: 'ed-tool', 'aria-label': `Kredit ${k + 1}-i sil`, onclick: () => { f.credits.splice(k, 1); drawCredits(); markDirty(); } }, icon('close')))),
    h('button', { type: 'button', class: 'btn btn-glass', 'data-fk': 'cradd', disabled: f.credits.length >= 20, onclick: () => { f.credits.push(['', '']); drawCredits(); markDirty(); credits.querySelector(`[data-fk="cr${f.credits.length - 1}"]`)?.focus(); } }, icon('plus'), 'Kredit əlavə et'));
  drawCredits();
  const pages = (d.draft || d.published)?.page_count || 0;
  const access = h('div', { class: 'ed-access', role: 'radiogroup', 'aria-label': 'Giriş' },
    [['free', 'Pulsuz', 'Bütün səhifələr hamıya açıqdır.'], ['paid', 'Satışda (WhatsApp sorğusu)', 'Önizləmə pulsuzdur, qalan səhifələr gizli qalır. Saytda ödəniş yoxdur.']].map(([v, label, sub]) =>
      h('label', { class: 'ed-radio' }, h('input', { type: 'radio', name: 'access', value: v, 'data-fk': `acc-${v}`, checked: f.access === v ? true : null, onchange: () => { f.access = v; if (v === 'free') { f.price = null; f.preview_pages = null; f.is_sample = false; } else { f.preview_pages ||= Math.min(3, Math.max(1, pages - 1)); } markDirty(); repaintCard('meta'); } }),
        h('span', {}, h('strong', { text: label }), h('span', { class: 'small', text: sub })))));
  const paid = f.access === 'paid' ? h('div', { class: 'ed-paid' },
    text('price', 'Qiymət, AZN', { req: true, type: 'number', conv: num, attrs: { min: '0.5', max: '10000', step: '0.5', inputmode: 'decimal' } }),
    text('preview_pages', 'Önizləmə səhifələri', { req: true, type: 'number', conv: v => (v === '' ? null : Math.trunc(Number(v))), hint: pages ? `Ümumi ${pages} səhifədən neçəsi pulsuz göstərilsin (1–${Math.max(1, pages - 1)}).` : 'Fayl idxal olunandan sonra yoxlanılır.', attrs: { min: '1', max: String(Math.max(1, pages - 1)), step: '1', inputmode: 'numeric' } }),
    h('div', { class: 'field field-check' }, h('input', { id: fid('sample'), type: 'checkbox', 'data-fk': 'm-sample', checked: f.is_sample ? true : null, onchange: e => { f.is_sample = e.target.checked; markDirty(); } }),
      h('label', { for: fid('sample'), text: 'Nümunə məhsul: qiymət illüstrativdir, əsər satışda deyil (“Nümunə məhsul, satışda deyil” etiketi göstərilir). İşarələnməsə, əsər “Satışda” kimi göstərilir və WhatsApp-da alış sorğusu təklif olunur.' }))) : null;
  const msg = h('div', { class: 'form-msg', role: 'status', 'aria-live': 'polite', id: 'ed-meta-msg' });
  const form = h('form', { class: 'ed-form', novalidate: true },
    text('title', 'Ad', { req: true, max: 160 }),
    text('title_note', 'Digər adı (məs. orijinal dildə)', { max: 160 }),
    h('div', { class: 'field' },
      h('label', { for: fid('slug'), text: 'Ünvan (slug) *' }),
      h('input', { id: fid('slug'), 'data-fk': 'm-slug', value: f.slug, readonly: locked ? true : null, maxlength: 64, autocapitalize: 'none', spellcheck: 'false', 'aria-describedby': `${fid('slug')}-h ${fid('slug')}-e`, 'aria-invalid': errs.slug ? 'true' : null, oninput: e => { f.slug = e.target.value.trim().toLowerCase(); markDirty(); } }),
      h('p', { class: 'hint', id: `${fid('slug')}-h`, text: locked ? 'Dərc olunduqdan sonra ünvan dəyişmir: oxucuların kitabxanası və linklər bu ünvanla saxlanılır.' : `Link: /Luna?eser=${f.slug}. Kiçik latın hərfləri, rəqəm və tire.` }), err('slug')),
    h('div', { class: 'ed-two' }, text('series', 'Seriya', { max: 120 }), text('episode', 'Bölüm №', { type: 'number', conv: num, attrs: { min: '0', max: '9999', inputmode: 'numeric' } })),
    text('creator', 'Müəllif', { req: true, max: 160 }),
    text('synopsis', 'Qısa təsvir', { req: true, area: true, max: 2000, hint: 'Kataloqda və əsər səhifəsində göstərilir (ən azı 20 simvol).' }),
    h('div', { class: 'ed-two' },
      h('div', { class: 'field' }, h('label', { for: fid('language'), text: 'Mətnin dili *' }), lang, err('language')),
      text('year', 'İl', { type: 'number', conv: num, attrs: { min: '1900', max: '2100', inputmode: 'numeric' } })),
    text('language_note', 'Dil qeydi', { max: 200, hint: 'Məs. “Orijinal Azərbaycan dilində”.' }),
    h('div', { class: 'field' }, h('label', { for: fid('genres'), text: 'Janrlar * (vergüllə, ən çox 6)' }), genreInput,
      h('p', { class: 'hint', id: `${fid('genres')}-h` }, 'Mövcud: ', ...known.flatMap((g, k) => [k ? ', ' : '', h('button', { type: 'button', class: 'link-btn', text: g, onclick: () => { if (!f.genres.includes(g) && f.genres.length < 6) { f.genres.push(g); genreInput.value = f.genres.join(', '); markDirty(); } } })])), err('genres')),
    h('fieldset', { class: 'ed-fieldset' }, h('legend', { text: 'Kreditlər' }), credits, err('credits')),
    text('rights', 'Hüquq bəyanatı', { req: true, area: true, max: 1000, hint: 'Məs. “© 2026 Ad Soyad. Bütün hüquqlar qorunur. Luna-da müəllifin icazəsi ilə dərc olunur.” Başlanğıc kolleksiyanın CC BY qeydləri öz əsərlərinizə əlavə olunmur.' }),
    h('fieldset', { class: 'ed-fieldset' }, h('legend', { text: 'Giriş və qiymət' }), access, paid),
    msg,
    h('div', { class: 'ed-actions' }, h('button', { class: 'btn btn-violet', type: 'submit', 'data-fk': 'msave', id: 'ed-meta-save' }, 'Məlumatı yadda saxla'),
      h('span', { class: 'small ed-dirty', id: 'ed-dirty', text: formDirty() ? 'Yadda saxlanmamış dəyişikliklər var' : '' })));
  form.addEventListener('submit', e => { e.preventDefault(); saveMeta(); });
  return card('meta', '3. Məlumat', form);
}
function markDirty() { const el = document.getElementById('ed-dirty'); if (el) el.textContent = formDirty() ? 'Yadda saxlanmamış dəyişikliklər var' : ''; }
async function saveMeta() {
  const st = current.st, f = st.form;
  f.credits = f.credits.filter(c => c[0].trim() && c[1].trim()).map(c => [c[0].trim(), c[1].trim()]);
  const errs = validateMeta(f);
  st.errors = errs;
  if (Object.keys(errs).length) {
    repaintCard('meta');
    const first = Object.keys(errs)[0];
    document.getElementById(`ed-m-${first}`)?.focus();
    const m = document.getElementById('ed-meta-msg'); if (m) { m.className = 'form-msg is-error'; m.textContent = 'Qırmızı ilə işarələnmiş sahələri düzəldin.'; }
    return;
  }
  const btn = document.getElementById('ed-meta-save');
  btn.disabled = true; btn.textContent = 'Saxlanılır…';
  try {
    const saved = await rpc('luna_save_comic', { p_id: current.id, p: f });
    current.d = { ...current.d, ...saved };
    st.form = metaOf(current.d);
    st.errors = {};
    toast(current.d.status === 'published' ? 'Saxlanıldı. Dəyişiklik saytda da göründü.' : 'Məlumat saxlanıldı.');
    await reload();
    if (current.d.status === 'published') ctx.refreshCatalogue();
  } catch (e) {
    btn.disabled = false; btn.textContent = 'Məlumatı yadda saxla';
    const m = document.getElementById('ed-meta-msg'); if (m) { m.className = 'form-msg is-error'; m.textContent = e.message; }
  }
}

// ---------- Preview and publication ----------
function publishCard() {
  const d = current.d;
  const target = d.draft || d.published;
  const pending = d.draft_revision && d.draft_revision !== d.published_revision;
  const local = publishProblems(current.st.form, target?.page_count || 0, !!target?.cover);
  const problems = [...new Set([...(d.problems || []), ...local])];
  const dirty = formDirty();
  const statusText = d.status === 'published'
    ? `Dərc olunub: ${dateText(d.published_at)}. Ziyarətçilər kataloqda görür.`
    : d.status === 'unpublished' ? `Dərcdən çıxarılıb: ${dateText(d.unpublished_at)}. Kataloqda görünmür; fayllar və məlumat saxlanılıb, yenidən dərc etmək olar.`
      : 'Qaralama: hələ heç vaxt dərc olunmayıb, yalnız redaktorlar görür.';
  const pub = h('button', { class: 'btn btn-white', type: 'button', 'data-fk': 'publish', disabled: problems.length || dirty ? true : null, onclick: () => publish() },
    d.status === 'published' ? (pending ? 'Yeni versiyanı dərc et' : 'Dərc olunub') : d.status === 'unpublished' ? 'Yenidən dərc et' : 'Dərc et');
  if (d.status === 'published' && !pending) pub.disabled = true;
  return card('publish', '4. Önizləmə və dərc',
    h('p', { class: 'ed-status-line' }, badge(d.status), h('span', { text: statusText })),
    pending && d.published_revision ? h('p', { class: 'store-note store-editor', text: 'Yeni səhifə versiyası hazırdır, amma hələ dərc olunmayıb. Saytda köhnə versiya görünür.' }) : null,
    problems.length ? h('div', { class: 'ed-problems', role: 'status' }, h('p', { text: 'Dərc etməzdən əvvəl:' }), h('ul', {}, problems.map(p => h('li', { text: p })))) : null,
    dirty ? h('p', { class: 'small', text: 'Əvvəlcə məlumatı yadda saxlayın.' }) : null,
    h('div', { class: 'ed-actions' },
      h('button', { class: 'btn btn-glass', type: 'button', 'data-fk': 'preview', disabled: !target?.pages?.length, onclick: () => ctx.openPreview(d.id, false) }, icon('book'), 'Ziyarətçi kimi önizlə'),
      d.access === 'paid' ? h('button', { class: 'btn btn-glass', type: 'button', 'data-fk': 'previewall', disabled: !target?.pages?.length, onclick: () => ctx.openPreview(d.id, true) }, 'Bütün səhifələr') : null),
    h('div', { class: 'ed-actions' }, pub,
      d.status === 'published' ? h('button', { class: 'btn btn-glass ed-danger', type: 'button', 'data-fk': 'unpublish', onclick: () => unpublish() }, 'Dərcdən çıxar') : null),
    h('p', { class: 'small', text: 'Dərcdən çıxarmaq geri qaytarıla bilər: heç nə silinmir. Oxucuların kitabxanasındakı qeyd qalır və əsər yenidən dərc olunanda işləyir.' }));
}
async function publish() {
  const d = current.d;
  const again = d.status === 'published';
  if (!await confirmBox(again ? 'Yeni versiyanı dərc edək?' : 'Əsəri dərc edək?', `“${d.title}” ${again ? 'yeni səhifələrlə' : ''} kataloqda hamıya görünəcək${d.access === 'paid' ? ` (ilk ${d.preview_pages} səhifə pulsuz önizləmə, qalanı gizli)` : ''}.`, 'Dərc et')) return;
  try {
    await rpc('luna_publish', { p_comic: d.id });
    await reload();
    await ctx.refreshCatalogue();
    const live = titles.some(t => t.remote && t.slug === d.slug);
    toast(live ? 'Dərc olundu: əsər kataloqda görünür.' : 'Dərc olundu. Kataloq hələ yenilənməyib; səhifəni yeniləyin.');
  } catch (e) { toast(`Dərc olunmadı: ${e.message}`, 'error'); }
}
async function unpublish() {
  const d = current.d;
  if (!await confirmBox('Dərcdən çıxaraq?', `“${d.title}” kataloqdan və birbaşa linklərdən gizlənəcək. Fayllar və məlumat silinmir; istənilən vaxt yenidən dərc edə bilərsiniz.`, 'Dərcdən çıxar')) return;
  try { await rpc('luna_unpublish', { p_comic: d.id }); await reload(); await ctx.refreshCatalogue(); toast('Əsər dərcdən çıxarıldı.'); }
  catch (e) { toast(e.message, 'error'); }
}

// ---------- Versions / cleanup ----------
const REV = { uploading: 'yüklənir və ya yarımçıq', ready: 'hazır', failed: 'uğursuz', superseded: 'əvəzlənib', discarded: 'təmizlənib' };
const KIND = { pdf: 'PDF', zip: 'CBZ/ZIP', images: 'Şəkillər', edit: 'Sıra/üz qabığı redaktəsi' };
function historyCard() {
  const d = current.d, job = current.job;
  const list = (d.revisions || []).filter(r => r.status !== 'discarded');
  if (!list.length) return card('history', 'Versiyalar', h('p', { class: 'small', text: 'Hələ idxal olunmayıb.' }));
  const cleanable = r => r.id !== d.draft_revision && r.id !== d.published_revision && r.id !== job.revision && r.status !== 'ready';
  return card('history', 'Versiyalar',
    h('ul', { class: 'ed-revs' }, list.map(r => h('li', {},
      h('span', {}, h('strong', { text: `${KIND[r.source_kind]}${r.source_name ? `: ${r.source_name}` : ''}` }), h('span', { class: 'small', text: ` ${dateText(r.created_at)} · ${r.page_count ? `${r.page_count} səhifə · ` : ''}${r.id === d.published_revision ? 'saytdakı versiya' : r.id === d.draft_revision ? 'qaralama' : REV[r.status]}${r.error ? ` · ${r.error}` : ''}` })),
      cleanable(r) ? h('button', { class: 'btn btn-glass btn-sm', type: 'button', 'data-fk': `rm${r.id}`, onclick: e => discard(r, e.currentTarget) }, 'Təmizlə') : null))),
    h('p', { class: 'small', text: 'Təmizlə: istifadə olunmayan versiyanın fayllarını Storage-dan silir. Saytdakı və qaralama versiyaları silinmir.' }));
}
async function discard(r, btn) {
  btn.disabled = true;
  try {
    const left = await rpc('luna_discard_revision', { p_revision: r.id });
    const tk = await token();
    await removeObjects(PAGES_BUCKET, left.pages, { token: tk });
    await removeObjects(SOURCES_BUCKET, left.sources, { token: tk });
    toast(`Təmizləndi: ${left.pages.length + left.sources.length} fayl silindi.`);
    await reload();
  } catch (e) { btn.disabled = false; toast(e.message, 'error'); }
}

// ---------- Confirm dialog (focus returns to the opener) ----------
function confirmBox(title, text, ok) {
  return new Promise(resolve => {
    const opener = document.activeElement;
    let dlg = document.getElementById('ed-confirm');
    if (!dlg) { dlg = h('dialog', { id: 'ed-confirm', class: 'inquiry', 'aria-labelledby': 'ed-confirm-h' }); document.body.append(dlg); }
    dlg.replaceChildren(h('form', { method: 'dialog', class: 'inquiry-body' },
      h('h2', { id: 'ed-confirm-h', text: title }), h('p', { text }),
      h('div', { class: 'detail-actions' }, h('button', { class: 'btn btn-white', value: 'ok', text: ok }), h('button', { class: 'btn btn-glass', value: 'cancel', text: 'İmtina' }))));
    dlg.addEventListener('close', () => { resolve(dlg.returnValue === 'ok'); opener?.focus?.(); }, { once: true });
    dlg.returnValue = '';
    dlg.showModal();
    dlg.querySelector('button[value=cancel]').focus();
  });
}
