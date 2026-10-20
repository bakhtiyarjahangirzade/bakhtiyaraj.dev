// Authentic checker: sends a file or pasted text to the analysis function and renders the report.
const API = 'https://yxiedrrahclzqukfnqrn.supabase.co/functions/v1/authentic';
const MAX = 10 * 1024 * 1024;
const $ = (s) => document.querySelector(s);
const status = $('#status'), result = $('#result');

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = (x) => `${Math.round(x * 100)}%`;

// Tabs
const tabs = [['#tab-file', '#pane-file'], ['#tab-text', '#pane-text']];
tabs.forEach(([t, p]) => $(t).addEventListener('click', () => {
  tabs.forEach(([t2, p2]) => { $(t2).setAttribute('aria-selected', String(t2 === t)); $(p2).classList.toggle('hidden', p2 !== p); });
}));

// File input + drag and drop
const drop = $('#drop'), input = $('#file');
input.addEventListener('change', () => input.files[0] && send(input.files[0]));
['dragenter', 'dragover'].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', (ev) => { const f = ev.dataTransfer.files[0]; if (f) send(f); });

// Paste text
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
  status.innerHTML = '<p><span class="spinner"></span>Reading and analysing… this usually takes a few seconds.</p>';
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
  human: ['Likely human-written', 'ok'], mostly_human: ['Mostly human-written', 'ok'], mixed: ['Mixed', 'warn'],
  mostly_ai: ['Mostly AI-written', 'ai'], ai: ['Likely AI-written', 'ai'], inconclusive: ['Inconclusive', 'neutral'],
};
const STRENGTH = { strong: ['Strong', 'ai'], medium: ['Medium', 'warn'], weak: ['Weak', 'neutral'] };

function render(d) {
  const a = d.analysis, f = d.file, traces = d.traces || [];
  const strong = traces.filter((t) => t.strength === 'strong');
  let head, body;
  if (a.status === 'too_short') {
    head = '<span class="pill neutral">Too short</span>';
    body = `<p>This file has ${a.words} words of readable text. At least ${a.minWords} are needed for a meaningful writing analysis. The trace scan below still applies.</p>`;
  } else {
    const [label, cls] = VERDICT[a.verdict] || ['Result', 'neutral'];
    head = `<span class="pill ${cls}">${label}</span>`;
    body = `<div class="verdict"><span class="big">${pct(a.lo)}–${pct(a.hi)}</span><span class="muted">of the text is likely AI-written · ${Math.round(a.confidence * 100)}% confidence</span></div>
<div class="range" role="img" aria-label="AI share between ${pct(a.lo)} and ${pct(a.hi)}"><span class="band"></span><span class="dot"></span></div>
<div class="range-scale"><span>0% AI</span><span>50%</span><span>100% AI</span></div>
<p class="muted">Best estimate ${pct(a.share)}. ${explain(a)}</p>
<h3>Paragraphs</h3>
<div class="legend"><span><i class="lg-low"></i>Likely human</span><span><i class="lg-mid"></i>Uncertain</span><span><i class="lg-high"></i>Likely AI</span></div>
<div class="paras">${a.segments.map((s) => `<div class="para ${s.p >= 0.7 ? 'h-high' : s.p >= 0.4 ? 'h-mid' : ''}"><span class="score" title="Chance this paragraph is AI-written">${pct(s.p)} AI</span>${esc(s.text).replace(/\n/g, '<br>')}</div>`).join('')}</div>`;
  }
  const alert = strong.length ? `<p class="error"><b>${strong.length} strong trace${strong.length > 1 ? 's' : ''} found.</b> See the evidence panel. Strong traces are rarely innocent, whatever the writing analysis says.</p>` : '';
  const meta = Object.entries(f.meta || {}).filter(([, v]) => v !== '' && v != null);
  const ML = { creator: 'Author', lastModifiedBy: 'Last edited by', created: 'Created', modified: 'Modified', revision: 'Revisions', application: 'Made with', appVersion: 'App version', totalEditMinutes: 'Editing time (min)', slides: 'Slides', pages: 'Pages', producer: 'PDF producer', creatorTool: 'PDF creator' };
  result.innerHTML = `<div class="report">
<div class="report-head"><span><b>${esc(f.name)}</b> · ${a.words} words${a.segments ? ` · ${a.segments.length} paragraph${a.segments.length === 1 ? '' : 's'}` : ''}</span>${head}</div>
<div class="report-body">${alert}${body}<p class="notice">${esc(d.notice)} Model ${esc(a.modelVersion || '')}. Analysed in ${d.ms} ms; the file was not stored.</p>
<div class="row no-print"><button class="btn btn-ghost" type="button" id="print">Print / save as PDF</button><button class="btn btn-primary" type="button" id="again">Check another file</button></div></div></div>
<aside class="report"><div class="report-head"><b>Evidence in the file</b><span class="pill ${strong.length ? 'ai' : traces.length ? 'warn' : 'ok'}">${traces.length ? `${traces.length} finding${traces.length > 1 ? 's' : ''}` : 'Nothing found'}</span></div>
<div class="report-body">${traces.length ? traces.map(trace).join('') : '<p class="muted">No hidden text, AI leftovers or evasion attempts were found. Absence of traces does not mean the text is human-written.</p>'}
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

function explain(a) {
  if (a.verdict === 'inconclusive') return 'The text is too short or too ambiguous for a narrow range, so we do not draw a conclusion.';
  if (a.verdict === 'human' || a.verdict === 'mostly_human') return 'The writing looks mostly human. Highlighted paragraphs, if any, may still be worth a look.';
  if (a.verdict === 'mixed') return 'Some paragraphs look AI-written and others do not. Compare the highlighted parts with the student’s earlier work.';
  return 'Most of the text matches AI-generated writing. Treat this as a reason for a conversation, not as proof.';
}

function trace(t) {
  const [label, cls] = STRENGTH[t.strength];
  const ex = (t.examples || []).map((e) => `<span class="ex">${esc(e)}</span>`).join('');
  return `<div class="trace"><span class="pill ${cls}">${label}</span><p>${esc(t.label)}${t.count > 1 ? ` <span class="muted">×${t.count}</span>` : ''}${ex}${t.note ? `<br><span class="muted">${esc(t.note)}</span>` : ''}</p></div>`;
}
