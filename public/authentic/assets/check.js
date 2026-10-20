// Authentic checker: sends a file or pasted text to the analysis function and renders the report.
import { render as renderReport, esc } from './report.js';
const API = 'https://yxiedrrahclzqukfnqrn.supabase.co/functions/v1/authentic';
const MAX = 10 * 1024 * 1024;
const $ = (s) => document.querySelector(s);
const status = $('#status'), result = $('#result');
const prefs = window.authenticPrefs || { get: () => ({}), set: () => {} };


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
    renderReport(result, data, { onAgain: () => { result.classList.add('hidden'); scrollTo({ top: 0, behavior: 'smooth' }); } });
    result.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  } catch {
    showError('Could not reach the analysis service. Check your connection and try again.');
  } finally { input.value = ''; }
}

