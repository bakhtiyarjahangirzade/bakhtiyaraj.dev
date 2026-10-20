// Authentic desktop: the same detector as the website, running fully offline in the app window.
import { unzipSync } from 'fflate';
import { getDocumentProxy, extractText, getMeta } from 'unpdf';
import modelJson from '../../../supabase/functions/authentic/model.json';
import { loadModel, analyze } from '../../../supabase/functions/authentic/detector.js';
import { extract, MAX_BYTES, UserError } from '../../../supabase/functions/authentic/parse.js';
import { scanTraces } from '../../../supabase/functions/authentic/traces.js';
import { render, esc } from '../../../public/authentic/assets/report.js';

const model = loadModel(modelJson);
const NOTICE = 'Results are probabilities, not proof. Do not use them as the only basis for academic decisions.';
const WANTED = /^(\[Content_Types\]\.xml|docProps\/(core|app)\.xml|word\/(document|footnotes|endnotes|header\d*|footer\d*)\.xml|ppt\/slides\/slide\d+\.xml|ppt\/notesSlides\/notesSlide\d+\.xml)$/;
const $ = (s) => document.querySelector(s);
const items = []; // { id, name, status: 'run'|'done'|'err', data?, error? }
let current = null, seq = 0;

$('#model-info').innerHTML = `Model <b>${esc(model.v)}</b><br>Trained on <b>28,531</b> documents · 13 AI models<br>Runs offline on this computer`;

function unzip(bytes) {
  let total = 0;
  return unzipSync(bytes, { filter: (f) => {
    if (!WANTED.test(f.name)) return false;
    total += f.originalSize;
    if (f.originalSize > 30e6 || total > 80e6) throw new UserError('The file expands to an unusually large size and was rejected.');
    return true;
  } });
}

async function pdf(bytes) {
  const doc = await getDocumentProxy(bytes);
  const { text } = await extractText(doc, { mergePages: false });
  let info = {};
  try { info = (await getMeta(doc)).info || {}; } catch { /* no metadata */ }
  const pages = text.map((p) => p.replace(/[ \t]+\n/g, '\n').replace(/([^\n])\n(?!\n)/g, '$1 ').trim());
  const meta = { pages: pages.length };
  if (info.Producer) meta.producer = String(info.Producer);
  if (info.Creator) meta.creatorTool = String(info.Creator);
  if (info.Author) meta.creator = String(info.Author);
  if (pages.join('').trim().length < 20) throw new UserError('This PDF has no selectable text (it may be a scan).');
  return { text: pages.join('\n\n'), hidden: [], meta };
}

async function check(name, bytes, text) {
  const t0 = performance.now();
  const doc = text != null ? { text, hidden: [], meta: {}, kind: 'text' } : await extract(bytes, name, { unzip, pdf });
  const result = analyze(model, doc.text);
  const traces = scanTraces(doc.text + '\n' + doc.hidden.map((h) => h.text).join('\n'), doc.hidden, doc.meta, result.words);
  return {
    file: { name, kind: doc.kind, meta: doc.meta },
    analysis: { ...result, segments: (result.segments || []).map((s) => ({ ...s, p: Math.round(s.p * 1000) / 1000 })) },
    traces, ms: Math.round(performance.now() - t0), notice: NOTICE,
  };
}

const VCLS = { human: 'ok', mostly_human: 'ok', mixed: 'mid', mostly_ai: 'ai', ai: 'ai', inconclusive: '' };
function sidebar() {
  $('#side-empty').classList.toggle('hidden', items.length > 0);
  $('#list').innerHTML = items.map((it) => {
    let cls = 'run', sub = 'Checking…';
    if (it.status === 'err') { cls = 'err'; sub = it.error; }
    if (it.status === 'done') {
      const a = it.data.analysis, strong = it.data.traces.filter((t) => t.strength === 'strong').length;
      cls = strong ? 'ai' : VCLS[a.verdict] ?? '';
      sub = a.status === 'ok' ? `${Math.round(a.lo * 100)}–${Math.round(a.hi * 100)}% AI` : 'Too short';
      if (strong) sub += ` · ${strong} strong trace${strong > 1 ? 's' : ''}`;
    }
    return `<li><button type="button" data-id="${it.id}" aria-current="${it.id === current}"><span class="name">${esc(it.name)}</span><span class="dotv ${cls}"></span><span class="sub">${esc(sub)}</span></button></li>`;
  }).join('');
}

function show(id) {
  current = id; sidebar();
  const it = items.find((x) => x.id === id);
  ['#welcome', '#paste-view'].forEach((s) => $(s).classList.add('hidden'));
  const rep = $('#report');
  if (!it || it.status === 'run') { rep.innerHTML = '<p class="status"><span class="spinner"></span>Checking…</p>'; rep.classList.remove('hidden'); return; }
  if (it.status === 'err') { rep.innerHTML = `<p class="error">${esc(it.error)}</p>`; rep.classList.remove('hidden'); return; }
  rep.className = 'result';
  render(rep, it.data, { local: true, onAgain: () => { current = null; rep.classList.add('hidden'); $('#welcome').classList.remove('hidden'); sidebar(); } });
  $('#pane').scrollTop = 0;
}

async function addFiles(files) {
  const queue = [...files].map((f) => { const it = { id: ++seq, name: f.name, status: 'run', file: f }; items.unshift(it); return it; });
  if (!queue.length) return;
  show(queue[0].id);
  for (const it of queue) {
    try {
      if (it.file.size > MAX_BYTES) throw new UserError('Larger than 10 MB.');
      it.data = await check(it.name, new Uint8Array(await it.file.arrayBuffer()));
      it.status = 'done';
    } catch (e) {
      it.status = 'err'; it.error = e instanceof UserError ? e.message : 'Could not read this file.';
      console.error(e);
    }
    delete it.file;
    if (current === it.id) show(it.id); else sidebar();
  }
}

$('#files').addEventListener('change', (e) => { addFiles(e.target.files); e.target.value = ''; });
$('#list').addEventListener('click', (e) => { const b = e.target.closest('[data-id]'); if (b) show(Number(b.dataset.id)); });
addEventListener('dragover', (e) => { e.preventDefault(); document.body.classList.add('dragging'); });
addEventListener('dragleave', (e) => { if (!e.relatedTarget) document.body.classList.remove('dragging'); });
addEventListener('drop', (e) => { e.preventDefault(); document.body.classList.remove('dragging'); addFiles(e.dataTransfer.files); });

const ta = $('#text'), count = $('#count');
const words = (s) => (s.trim().match(/\S+/g) || []).length;
$('#paste').addEventListener('click', () => { current = null; sidebar(); ['#welcome', '#report'].forEach((s) => $(s).classList.add('hidden')); $('#paste-view').classList.remove('hidden'); ta.focus(); });
$('#cancel').addEventListener('click', () => { $('#paste-view').classList.add('hidden'); $('#welcome').classList.remove('hidden'); });
ta.addEventListener('input', () => { count.textContent = `${words(ta.value)} words`; });
$('#go').addEventListener('click', async () => {
  if (words(ta.value) < 80) { count.textContent = 'Paste at least 80 words.'; return; }
  const it = { id: ++seq, name: `Pasted text · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, status: 'run' };
  items.unshift(it); show(it.id);
  it.data = await check(it.name, null, ta.value); it.status = 'done'; ta.value = ''; count.textContent = '0 words';
  show(it.id);
});
