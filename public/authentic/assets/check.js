// Authentic checker: sends a file or pasted text to the analysis function and renders the report.
const API = 'https://yxiedrrahclzqukfnqrn.supabase.co/functions/v1/authentic';
const MAX = 10 * 1024 * 1024;
const $ = (s) => document.querySelector(s);
const status = $('#status'), result = $('#result');
const prefs = window.authenticPrefs || { get: () => ({}), set: () => {} };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = (x) => `${Math.round(x * 100)}%`;

// Input mode (remembered only if the visitor allowed preferences)
const tabs = { file: ['#tab-file', '#pane-file'], text: ['#tab-text', '#pane-text'] };
function mode(m) {
  for (const [k, [t, p]] of Object.entries(tabs)) { $(t).setAttribute('aria-selected', String(k === m)); $(p).classList.toggle('hidden', k !== m); }
  prefs.set({ mode: m });
}
$('#tab-file').addEventListener('click', () => mode('file'));
$('#tab-text').addEventListener('click', () => mode('text'));
if (prefs.get().mode === 'text') mode('text');

const drop = $('#drop'), input = $('#file');
input.addEventListener('change', () => input.files[0] && send(input.files[0]));
['dragenter', 'dragover'].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', (ev) => { const f = ev.dataTransfer.files[0]; if (f) send(f); });

const ta = $('#text'), count = $('#count');
const words = (s) => (s.trim().match(/\S+/g) || []).length;
ta.addEventListener('input', () => { count.textContent = `${words(ta.value)} words`; });
$('#go').addEventListener('click', () => {
  if (words(ta.value) < 80) return showError('Paste at least 80 words so the analysis is meaningful.');
  send(null, ta.value);
});

function showError(msg) { status.innerHTML = `<p class="error">${esc(msg)}</p>`; }

async function send(file, text) {
  if (file && file.size > MAX) return showError('This file is larger than 10 MB.');
  status.innerHTML = '<span class="spinner"></span>Reading and analysing…';
  result.classList.add('hidden');
  try {
    let res;
    if (file) { const fd = new FormData(); fd.append('file', file); res = await fetch(API, { method: 'POST', body: fd }); }
    else res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    const data = await res.json().catch(() => ({ error: 'The server sent an unreadable answer.' }));
    if (!res.ok || data.error) return showError(data.error || `Request failed (${res.status}).`);
    status.innerHTML = '';
    render(data);
  } catch {
    showError('Could not reach the analysis service. Check your connection and try again.');
  } finally { input.value = ''; }
}

const VERDICT = {
  human: ['Likely human-written', 'ok'], mostly_human: ['Mostly human-written', 'ok'], mixed: ['Mixed', 'mid'],
  mostly_ai: ['Mostly AI-written', 'ai'], ai: ['Likely AI-written', 'ai'], inconclusive: ['Inconclusive', 'neutral'],
};
const STRENGTH = { strong: ['Strong', 'ai'], medium: ['Medium', 'mid'], weak: ['Weak', 'neutral'] };
const ML = { creator: 'Author', lastModifiedBy: 'Last edited by', created: 'Created', modified: 'Modified', revision: 'Revisions', application: 'Made with', appVersion: 'App version', totalEditMinutes: 'Editing time (min)', slides: 'Slides', pages: 'Pages', producer: 'PDF producer', creatorTool: 'PDF creator' };

function explain(a) {
  if (a.verdict === 'inconclusive') return 'Too little or too ambiguous text for a narrow range, so we don’t draw a conclusion.';
  if (a.verdict === 'human' || a.verdict === 'mostly_human') return 'The writing looks mostly human. Highlighted paragraphs may still be worth a look.';
  if (a.verdict === 'mixed') return 'Some paragraphs look AI-written and others don’t. Compare the highlighted parts with earlier work.';
  return 'Most of the text matches AI-generated writing. Treat this as a reason for a conversation, not as proof.';
}

function trace(t) {
  const [label, cls] = STRENGTH[t.strength];
  const ex = (t.examples || []).map((e) => `<span class="ex">${esc(e)}</span>`).join('');
  return `<div class="trace"><span class="tag ${cls}">${label}</span><p>${esc(t.label)}${t.count > 1 ? ` <span class="tiny">×${t.count}</span>` : ''}${ex}${t.note ? `<span class="note">${esc(t.note)}</span>` : ''}</p></div>`;
}

function render(d) {
  const a = d.analysis, f = d.file, traces = d.traces || [];
  const strong = traces.filter((t) => t.strength === 'strong');
  let tag, body;
  if (a.status === 'too_short') {
    tag = '<span class="tag neutral">Too short</span>';
    body = `<p class="verdict-l">Not enough text</p><p class="verdict-s">This file has ${a.words} words of readable text. At least ${a.minWords} are needed for a writing analysis. The evidence scan still applies.</p>`;
  } else {
    const [label, cls] = VERDICT[a.verdict] || ['Result', 'neutral'];
    tag = `<span class="tag ${cls}">${label}</span>`;
    body = `<p class="verdict-l">AI-written share · ${Math.round(a.confidence * 100)}% confidence</p>
<p class="verdict-n">${pct(a.lo)}–${pct(a.hi)}</p>
<div class="meter lg" role="img" aria-label="AI share between ${pct(a.lo)} and ${pct(a.hi)}"><span class="band"></span><span class="dot"></span></div>
<div class="scale"><span>0%</span><span>50%</span><span>100%</span></div>
<p class="verdict-s">Best estimate ${pct(a.share)}. ${explain(a)}</p>
<h3>Paragraphs</h3>
<div class="legend"><span><i class="lg-low"></i>Likely human</span><span><i class="lg-mid"></i>Uncertain</span><span><i class="lg-high"></i>Likely AI</span></div>
<div class="paras">${a.segments.map((s) => `<div class="para ${s.p >= 0.7 ? 'h-high' : s.p >= 0.4 ? 'h-mid' : ''}"><span class="score" title="Chance this paragraph is AI-written">${pct(s.p)} AI</span>${esc(s.text).replace(/\n/g, '<br>')}</div>`).join('')}</div>`;
  }
  const alert = strong.length ? `<p class="alert"><b>${strong.length} strong ${strong.length > 1 ? 'traces' : 'trace'} found.</b> Strong traces are rarely innocent, whatever the writing analysis says.</p>` : '';
  const meta = Object.entries(f.meta || {}).filter(([, v]) => v !== '' && v != null);
  result.innerHTML = `<div class="card">
<div class="card-head"><span><b>${esc(f.name)}</b> · ${a.words} words${a.segments?.length ? ` · ${a.segments.length} paragraph${a.segments.length === 1 ? '' : 's'}` : ''}</span>${tag}</div>
<div class="card-body">${alert}${body}
<p class="notice">${esc(d.notice)} Model ${esc(a.modelVersion || '')}. Analysed in ${d.ms} ms. Your file was not stored.</p>
<div class="row no-print"><button class="pill secondary" type="button" id="print">Save as PDF</button><button class="pill" type="button" id="again">Check another</button></div></div></div>
<aside class="card"><div class="card-head"><b>Evidence in the file</b><span class="tag ${strong.length ? 'ai' : traces.length ? 'mid' : 'ok'}">${traces.length ? `${traces.length} finding${traces.length > 1 ? 's' : ''}` : 'Nothing found'}</span></div>
<div class="card-body">${traces.length ? traces.map(trace).join('') : '<p class="verdict-s">No hidden text, AI leftovers or evasion attempts found. No traces does not mean the text is human-written.</p>'}
${meta.length ? `<h3>File details</h3><dl class="kv">${meta.map(([k, v]) => `<dt>${esc(ML[k] || k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : ''}</div></aside>`;
  if (a.status === 'ok') {
    const band = result.querySelector('.band'), dot = result.querySelector('.dot');
    band.style.left = pct(a.lo); band.style.width = `${Math.max(1, Math.round((a.hi - a.lo) * 100))}%`; dot.style.left = pct(a.share);
  }
  result.classList.remove('hidden');
  $('#print').addEventListener('click', () => print());
  $('#again').addEventListener('click', () => { result.classList.add('hidden'); scrollTo({ top: 0, behavior: 'smooth' }); });
  result.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
}
