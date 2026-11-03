// Browser-side page preparation for the editor panel. Everything a reader will see is re-encoded here from
// decoded pixels, so a renamed HTML/SVG/executable can never reach storage as a "page":
//  - PDF: rendered page by page with PDF.js (self-hosted, pinned worker), one canvas at a time;
//  - CBZ/ZIP: strict central-directory reader + capped inflate (import-core.js), then decode/re-encode;
//  - JPG/PNG/WebP: signature + header checks, real decode (createImageBitmap), dimension cross-check, re-encode.
// Work is sequential (bounded memory) and yields between pages, so the page stays responsive and cancellable.
import { LIMITS, OUT, ImportError, sniff, imageInfo, checkImageSize, fitPage, readZip, extractEntry, planSelection, isImageKind, mimeOf, humanBytes } from './import-core.js';

// Self-hosted PDF.js assets, copied from the pinned pdfjs-dist package by scripts/vendor.mjs.
export const PDFJS_VERSION = '6.4.299';
const PDF_BASE = `/Luna/vendor/pdfjs-${PDFJS_VERSION}/`;
let pdfjsP = null;
async function pdfjs() {
  pdfjsP ||= import('pdfjs-dist').then(m => {
    if (m.version !== PDFJS_VERSION) throw new Error(`PDF.js ${m.version} != ${PDFJS_VERSION}`);
    m.GlobalWorkerOptions.workerSrc = `${PDF_BASE}pdf.worker.min.mjs`;
    return m;
  }).catch(e => { pdfjsP = null; throw e; });
  return pdfjsP;
}
const pdfOptions = data => ({
  data,
  isEvalSupported: false,           // no eval/new Function (CSP stays script-src 'self')
  enableXfa: false,
  useWasm: false,                   // pure-JS JPX/JBIG2 fallbacks: no 'wasm-unsafe-eval' needed
  wasmUrl: `${PDF_BASE}wasm/`,
  cMapUrl: `${PDF_BASE}cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `${PDF_BASE}standard_fonts/`,
  iccUrl: `${PDF_BASE}iccs/`,
  maxImageSize: LIMITS.imagePixels,
  stopAtErrors: false,
});

const checkAbort = signal => { if (signal?.aborted) throw new ImportError('İdxal ləğv edildi.', 'cancelled'); };
const tick = () => new Promise(r => setTimeout(r, 0));
async function head(file, n = 2048) { return new Uint8Array(await file.slice(0, n).arrayBuffer()); }

function pdfError(e, name) {
  const n = e?.name || '';
  if (n === 'PasswordException') return new ImportError(`${name}: PDF parolla qorunur. Parolsuz nüsxə ixrac edib yenidən yükləyin.`, 'encrypted');
  if (n === 'InvalidPDFException') return new ImportError(`${name}: PDF pozulub və ya natamamdır, açılmadı.`, 'corrupt');
  if (e instanceof ImportError) return e;
  return new ImportError(`${name}: PDF oxunmadı (${String(e?.message || e).slice(0, 120)}).`, 'corrupt');
}

// ---------- Inspection (before anything is uploaded) ----------
// Returns { mode, files, pages, bytes, notes } or throws ImportError with the owner-facing reason.
export async function inspect(fileList, { signal } = {}) {
  const files = [...fileList];
  const sniffed = [];
  for (const f of files) sniffed.push({ name: f.name, size: f.size, kind: sniff(await head(f)), file: f });
  const plan = planSelection(sniffed);
  const f = plan.files[0];
  if (plan.mode === 'pdf') {
    const lib = await pdfjs();
    const task = lib.getDocument(pdfOptions(new Uint8Array(await f.file.arrayBuffer())));
    let doc;
    try { doc = await task.promise; } catch (e) { task.destroy(); throw pdfError(e, f.name); }
    try {
      checkAbort(signal);
      if (doc.numPages > LIMITS.pages) throw new ImportError(`${f.name}: ${doc.numPages} səhifə çoxdur (ən çox ${LIMITS.pages}).`, 'size');
      return { ...plan, pages: doc.numPages, bytes: f.size, label: `PDF, ${doc.numPages} səhifə, ${humanBytes(f.size)}` };
    } finally { task.destroy(); } // PDF.js 6: the loading task owns the document and its worker port
  }
  if (plan.mode === 'zip') {
    const entries = readZip(new Uint8Array(await f.file.arrayBuffer()), { name: f.name });
    return { ...plan, pages: entries.length, bytes: f.size, label: `${/\.cbz$/i.test(f.name) ? 'CBZ' : 'ZIP'}, ${entries.length} şəkil, ${humanBytes(f.size)}` };
  }
  // images: check each header now so a renamed file is named before upload starts
  for (const s of plan.files) {
    const info = imageInfo(await head(s.file, 1024 * 1024));
    checkImageSize(info.width, info.height, s.name);
  }
  const bytes = plan.files.reduce((a, s) => a + s.size, 0);
  return { ...plan, pages: plan.files.length, bytes, label: `${plan.files.length} şəkil, ${humanBytes(bytes)}` };
}

// ---------- Encoding ----------
// WebP where the browser can encode it (Chrome, Edge, Firefox); Safari's canvas cannot, so it falls back to JPEG.
function toBlob(canvas, type, q) { return new Promise(r => canvas.toBlob(r, type, q)); }
export async function encode(canvas) {
  let blob = await toBlob(canvas, 'image/webp', OUT.quality);
  if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', 0.9);
  if (!blob) throw new ImportError('Brauzer səhifəni şəklə çevirə bilmədi (yaddaş çatmır).', 'memory');
  if (blob.size > LIMITS.pageBytesOut) throw new ImportError(`Hazır səhifə ${humanBytes(blob.size)} oldu (limit ${humanBytes(LIMITS.pageBytesOut)}).`, 'size');
  return { blob, type: blob.type, ext: blob.type === 'image/webp' ? 'webp' : 'jpg' };
}
function canvasOf(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
const release = c => { c.width = 0; c.height = 0; };

async function drawBitmap(bmp, w, h) {
  const c = canvasOf(w, h);
  const g = c.getContext('2d', { alpha: false });
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  g.imageSmoothingQuality = 'high';
  g.drawImage(bmp, 0, 0, w, h);
  return c;
}

// Decodes raster bytes for real and re-encodes them. Rejects anything the browser cannot decode as an image or
// whose decoded size disagrees with its header.
export async function rasterPage(bytes, name) {
  const info = imageInfo(bytes);
  checkImageSize(info.width, info.height, name);
  let bmp;
  try { bmp = await createImageBitmap(new Blob([bytes], { type: mimeOf(info.kind) })); }
  catch { throw new ImportError(`${name}: şəkil açılmadı (fayl pozulub və ya şəkil deyil).`, 'corrupt'); }
  try {
    if (bmp.width !== info.width || bmp.height !== info.height) throw new ImportError(`${name}: başlıqdakı ölçü ilə real şəkil uyğun gəlmir.`, 'corrupt');
    const size = fitPage(bmp.width, bmp.height);
    const c = await drawBitmap(bmp, size.width, size.height);
    try { return { ...(await encode(c)), width: size.width, height: size.height, pixels: info.width * info.height }; }
    finally { release(c); }
  } finally { bmp.close?.(); }
}

// ---------- Page preparation ----------
// Yields { index, total, blob, type, ext, width, height, name } in reading order. `skip(index)` lets a retry reuse
// pages that were already prepared. Throws ImportError (code 'cancelled' when aborted).
export async function* preparePages(plan, { signal, skip = () => false } = {}) {
  let pixels = 0;
  const budget = p => { pixels += p; if (pixels > LIMITS.totalPixels) throw new ImportError('Bütün səhifələrin ümumi ölçüsü çox böyükdür; faylı hissələrə bölün.', 'size'); };
  if (plan.mode === 'pdf') {
    const f = plan.files[0];
    const lib = await pdfjs();
    const task = lib.getDocument(pdfOptions(new Uint8Array(await f.file.arrayBuffer())));
    let doc;
    try { doc = await task.promise; } catch (e) { task.destroy(); throw pdfError(e, f.name); }
    try {
      for (let p = 1; p <= doc.numPages; p++) {
        checkAbort(signal);
        if (skip(p - 1)) continue;
        let page, c;
        try {
          page = await doc.getPage(p);
          const base = page.getViewport({ scale: 1 });
          if (Math.max(base.width, base.height) / Math.min(base.width, base.height) > LIMITS.aspect) throw new ImportError(`${f.name}: səhifə ${p} çox uzundur (tərəflərin nisbəti 1:${LIMITS.aspect}-dən böyük).`, 'size');
          const size = fitPage(base.width, base.height, { upscale: true });
          const viewport = page.getViewport({ scale: size.scale });
          c = canvasOf(Math.round(viewport.width), Math.round(viewport.height));
          const g = c.getContext('2d', { alpha: false });
          const task = page.render({ canvas: c, canvasContext: g, viewport, background: '#ffffff' });
          const stop = () => task.cancel();
          signal?.addEventListener('abort', stop, { once: true });
          try { await task.promise; } finally { signal?.removeEventListener('abort', stop); }
          checkAbort(signal);
          budget(c.width * c.height);
          const out = await encode(c);
          yield { index: p - 1, total: doc.numPages, ...out, width: c.width, height: c.height, name: `${f.name} — səhifə ${p}` };
        } catch (e) {
          if (e?.name === 'RenderingCancelledException') checkAbort({ aborted: true });
          throw e instanceof ImportError ? e : pdfError(e, `${f.name}, səhifə ${p}`);
        } finally { if (c) release(c); page?.cleanup(); }
        await tick();
      }
    } finally { task.destroy(); }
    return;
  }
  if (plan.mode === 'zip') {
    const f = plan.files[0];
    const u8 = new Uint8Array(await f.file.arrayBuffer());
    const entries = readZip(u8, { name: f.name });
    for (let k = 0; k < entries.length; k++) {
      checkAbort(signal);
      if (skip(k)) continue;
      const bytes = extractEntry(u8, entries[k], { name: f.name });
      if (!isImageKind(sniff(bytes))) throw new ImportError(`${f.name}: “${entries[k].name}” adı şəkil kimidir, amma məzmunu şəkil deyil (${sniff(bytes)}).`, 'type');
      const out = await rasterPage(bytes, `${f.name}: ${entries[k].name}`);
      budget(out.pixels);
      yield { index: k, total: entries.length, ...out, name: entries[k].name };
      await tick();
    }
    return;
  }
  for (let k = 0; k < plan.files.length; k++) {
    checkAbort(signal);
    if (skip(k)) continue;
    const s = plan.files[k];
    const bytes = new Uint8Array(await s.file.arrayBuffer());
    const out = await rasterPage(bytes, s.name);
    budget(out.pixels);
    yield { index: k, total: plan.files.length, ...out, name: s.name };
    await tick();
  }
}

// ---------- Cover ----------
// Two sizes from a prepared page (or an uploaded cover image) plus a tone colour for tiles and gradients.
export async function makeCover(blob) {
  let bmp;
  try { bmp = await createImageBitmap(blob); } catch { throw new ImportError('Üz qabığı şəkli açılmadı.', 'corrupt'); }
  try {
    const mk = async w => {
      const width = Math.min(w, bmp.width), height = Math.round(bmp.height * width / bmp.width);
      const c = await drawBitmap(bmp, width, height);
      try { return { ...(await encode(c)), width, height }; } finally { release(c); }
    };
    const big = await mk(OUT.coverW), small = await mk(OUT.coverSmW);
    const t = await drawBitmap(bmp, 8, 8);
    const d = t.getContext('2d').getImageData(0, 0, 8, 8).data;
    release(t);
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    const n = d.length / 4, dark = v => Math.round((v / n) * 0.5);
    const tone = `#${[r, g, b].map(v => dark(v).toString(16).padStart(2, '0')).join('')}`;
    return { big, small, tone };
  } finally { bmp.close?.(); }
}

// A custom cover file: same validation as pages (signature, header, real decode).
export async function coverFromFile(file) {
  if (file.size > LIMITS.imageBytes) throw new ImportError(`${file.name}: ${humanBytes(file.size)} çox böyükdür (ən çox ${humanBytes(LIMITS.imageBytes)}).`, 'size');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!isImageKind(kind)) throw new ImportError(`${file.name}: üz qabığı JPG, PNG və ya WebP olmalıdır.`, 'type');
  const page = await rasterPage(bytes, file.name);
  return makeCover(page.blob);
}
