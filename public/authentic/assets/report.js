// Shared report renderer for the website checker and the desktop app.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = (x) => `${Math.round(x * 100)}%`;
export { esc, pct };

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

export function render(result, d, { onAgain, local = false } = {}) {
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
<p class="notice">${esc(d.notice)} Model ${esc(a.modelVersion || '')}. Analysed in ${d.ms} ms ${local ? 'on this computer. Nothing was uploaded.' : '. Your file was not stored.'}</p>
<div class="row no-print"><button class="pill secondary" type="button" id="print">Save as PDF</button><button class="pill" type="button" id="again">Check another</button></div></div></div>
<aside class="card"><div class="card-head"><b>Evidence in the file</b><span class="tag ${strong.length ? 'ai' : traces.length ? 'mid' : 'ok'}">${traces.length ? `${traces.length} finding${traces.length > 1 ? 's' : ''}` : 'Nothing found'}</span></div>
<div class="card-body">${traces.length ? traces.map(trace).join('') : '<p class="verdict-s">No hidden text, AI leftovers or evasion attempts found. No traces does not mean the text is human-written.</p>'}
${meta.length ? `<h3>File details</h3><dl class="kv">${meta.map(([k, v]) => `<dt>${esc(ML[k] || k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : ''}</div></aside>`;
  if (a.status === 'ok') {
    const band = result.querySelector('.band'), dot = result.querySelector('.dot');
    band.style.left = pct(a.lo); band.style.width = `${Math.max(1, Math.round((a.hi - a.lo) * 100))}%`; dot.style.left = pct(a.share);
  }
  result.classList.remove('hidden');
  result.querySelector('#print').addEventListener('click', () => print());
  result.querySelector('#again').addEventListener('click', () => onAgain && onAgain());
}
