// Authentic: AI-writing analysis for student assignments (Supabase Edge Function).
// POST multipart/form-data with `file` (.docx .pptx .pdf .txt, max 10 MB) or JSON { text }.
// Files are processed in memory and never stored.
import { unzipSync } from 'npm:fflate@0.8.2';
import { getDocumentProxy, extractText, getMeta } from 'npm:unpdf@0.11.0';
import modelJson from './model.json' with { type: 'json' };
import { loadModel, analyze } from './detector.js';
import { extract, MAX_BYTES, UserError } from './parse.js';
import { scanTraces } from './traces.js';

const model = loadModel(modelJson);
const ORIGINS = ['https://bakhtiyaraj.dev', 'https://www.bakhtiyaraj.dev', 'http://127.0.0.1:3000', 'http://localhost:3000'];
const WANTED = /^(\[Content_Types\]\.xml|docProps\/(core|app)\.xml|word\/(document|footnotes|endnotes|header\d*|footer\d*)\.xml|ppt\/slides\/slide\d+\.xml|ppt\/notesSlides\/notesSlide\d+\.xml)$/;
const hits = new Map<string, number[]>();

function cors(req: Request) {
  const o = req.headers.get('origin') || '';
  const allowed = ORIGINS.includes(o) || /^https:\/\/bakhtiyaraj-dev-[a-z0-9-]+\.vercel\.app$/.test(o);
  return {
    'Access-Control-Allow-Origin': allowed ? o : ORIGINS[1],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}
const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

function limited(ip: string) {
  const now = Date.now(), win = 60 * 60 * 1000, max = 40;
  const arr = (hits.get(ip) || []).filter((t) => now - t < win);
  arr.push(now); hits.set(ip, arr);
  return arr.length > max;
}

function unzip(bytes: Uint8Array) {
  let total = 0;
  return unzipSync(bytes, {
    filter: (f) => {
      if (!WANTED.test(f.name)) return false;
      total += f.originalSize;
      if (f.originalSize > 30e6 || total > 80e6) throw new UserError('The file expands to an unusually large size and was rejected.');
      return true;
    },
  });
}

async function pdf(bytes: Uint8Array) {
  const doc = await getDocumentProxy(bytes);
  const { text } = await extractText(doc, { mergePages: false });
  let info: Record<string, string> = {};
  try { info = ((await getMeta(doc)).info || {}) as Record<string, string>; } catch { /* no metadata */ }
  const pages = (text as string[]).map((p) => p.replace(/[ \t]+\n/g, '\n').replace(/([^\n])\n(?!\n)/g, '$1 ').trim());
  const meta: Record<string, unknown> = { pages: pages.length };
  if (info.Producer) meta.producer = String(info.Producer);
  if (info.Creator) meta.creatorTool = String(info.Creator);
  if (info.Author) meta.creator = String(info.Author);
  if (info.CreationDate) meta.created = String(info.CreationDate);
  if (info.ModDate) meta.modified = String(info.ModDate);
  if (pages.join('').trim().length < 20) throw new UserError('This PDF has no selectable text (it may be a scan). Scanned PDFs are not supported yet.');
  return { text: pages.join('\n\n'), hidden: [], meta };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method === 'GET') return json(req, { ok: true, model: model.v });
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon';
  if (limited(ip)) return json(req, { error: 'Too many checks from this network. Try again in an hour.' }, 429);

  try {
    const t0 = performance.now();
    let doc: { text: string; hidden: { text: string; reason: string; where: string }[]; meta: Record<string, unknown>; kind: string };
    let fileName = 'pasted text';
    const ct = req.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = await req.json();
      const text = String(body.text || '');
      if (text.length > 200_000) throw new UserError('Text is too long (max 200,000 characters).');
      doc = { text, hidden: [], meta: {}, kind: 'text' };
    } else {
      const form = await req.formData();
      const f = form.get('file');
      if (!(f instanceof File)) throw new UserError('No file received.');
      if (f.size > MAX_BYTES) throw new UserError('File is larger than 10 MB.');
      if (f.size === 0) throw new UserError('The file is empty.');
      fileName = f.name.slice(0, 120);
      doc = await extract(new Uint8Array(await f.arrayBuffer()), f.name, { unzip, pdf });
    }
    const result = analyze(model, doc.text);
    const traces = scanTraces(doc.text + '\n' + doc.hidden.map((h) => h.text).join('\n'), doc.hidden, doc.meta as never, result.words);
    return json(req, {
      file: { name: fileName, kind: doc.kind, meta: doc.meta },
      analysis: { ...result, segments: (result.segments || []).map((s) => ({ i: s.i, words: s.words, p: Math.round(s.p * 1000) / 1000, text: s.text })) },
      traces,
      ms: Math.round(performance.now() - t0),
      notice: 'Results are probabilities, not proof. Do not use them as the only basis for academic decisions.',
    });
  } catch (e) {
    if (e instanceof UserError) return json(req, { error: e.message }, 422);
    console.error(e);
    return json(req, { error: 'Something went wrong while reading this file.' }, 500);
  }
});
