// Pure import rules shared by the editor panel (browser) and tests/luna-publishing.test.mjs (Node):
// file signatures, image headers, the strict ZIP/CBZ reader with decompression-bomb and traversal guards,
// natural page order, output sizes, limits and the Azerbaijani messages the owner sees.
// Nothing here touches the DOM; decoding/re-encoding happens in importer.js.
import { Inflate } from 'fflate';

const MB = 1024 * 1024;
// Chosen for the real target: Supabase Storage on the shared project (Free plan global upload limit is 50 MB per
// object), uploads sent straight from the browser to Storage (never through a Vercel function body), and a phone
// or laptop converting pages one by one.
export const LIMITS = Object.freeze({
  sourceBytes: 50 * MB,         // one PDF or CBZ/ZIP
  imageBytes: 25 * MB,          // one JPG/PNG/WebP file (also each image inside an archive)
  imageFiles: 300,              // individually selected images
  pages: 300,                   // pages per comic
  archiveEntries: 1000,         // central-directory records, including skipped metadata
  archiveExpanded: 400 * MB,    // sum of declared uncompressed sizes
  archiveRatio: 100,            // max uncompressed/compressed per entry
  imagePixels: 50e6,            // decoded pixels per source image
  imageSide: 12000,             // px, either side
  totalPixels: 3e9,             // decoded pixels across one import
  aspect: 4,                    // long side / short side
  pageBytesOut: 15 * MB,        // bucket limit for one prepared page
});
// Prepared pages: portrait pages fit 1600×2600, landscape (double-page) 2600×1600. Text stays legible at the
// reader's 260% zoom on phones while a page stays around 0.3–1 MB as WebP.
export const OUT = Object.freeze({ short: 1600, long: 2600, quality: 0.86, coverW: 1100, coverSmW: 560 });

export const ACCEPT = '.pdf,.cbz,.zip,.jpg,.jpeg,.png,.webp,application/pdf,application/zip,application/vnd.comicbook+zip,image/jpeg,image/png,image/webp';
export const humanBytes = n => (n >= MB ? `${(n / MB).toFixed(n >= 10 * MB ? 0 : 1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export class ImportError extends Error {
  constructor(message, code = 'invalid') { super(message); this.code = code; }
}
const fail = (msg, code) => { throw new ImportError(msg, code); };

// ---------- Signatures ----------
const at = (u8, sig, off = 0) => sig.every((b, i) => u8[off + i] === b);
export function sniff(u8) {
  if (!u8 || u8.length < 4) return 'empty';
  if (at(u8, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (at(u8, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (at(u8, [0x52, 0x49, 0x46, 0x46]) && at(u8, [0x57, 0x45, 0x42, 0x50], 8)) return 'webp';
  if (at(u8, [0x50, 0x4b, 0x03, 0x04]) || at(u8, [0x50, 0x4b, 0x05, 0x06])) return 'zip';
  const head = new TextDecoder('latin1').decode(u8.subarray(0, 1024));
  if (head.includes('%PDF-')) return 'pdf';
  if (at(u8, [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07])) return 'rar';
  if (at(u8, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) return '7z';
  if (head.startsWith('GIF87a') || head.startsWith('GIF89a')) return 'gif';
  if (at(u8, [0x42, 0x4d])) return 'bmp';
  if (at(u8, [0x4d, 0x5a]) || at(u8, [0x7f, 0x45, 0x4c, 0x46])) return 'executable';
  if (/^(﻿|\xef\xbb\xbf)?\s*</.test(head)) return 'markup';
  if (at(u8, [0x1f, 0x8b])) return 'gzip';
  return 'unknown';
}
export const isImageKind = k => k === 'jpeg' || k === 'png' || k === 'webp';
export const mimeOf = k => ({ jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', pdf: 'application/pdf', zip: 'application/zip' }[k]);

const KIND_HELP = {
  rar: 'RAR/CBR arxivləri dəstəklənmir. Səhifələri ZIP və ya CBZ kimi yenidən arxivləyin.',
  '7z': '7z/CB7 arxivləri dəstəklənmir. Səhifələri ZIP və ya CBZ kimi yenidən arxivləyin.',
  gif: 'GIF səhifə formatı kimi qəbul edilmir. JPG, PNG və ya WebP istifadə edin.',
  bmp: 'BMP qəbul edilmir. JPG, PNG və ya WebP istifadə edin.',
  executable: 'Bu fayl proqramdır, şəkil və ya PDF deyil.',
  markup: 'Bu fayl HTML/SVG/XML mətnidir, rastr şəkil deyil (adı dəyişdirilmiş ola bilər).',
  gzip: 'Sıxılmış GZIP/TAR faylları qəbul edilmir. ZIP və ya CBZ istifadə edin.',
  unknown: 'Faylın məzmunu tanınmadı. Qəbul edilir: PDF, CBZ/ZIP, JPG, PNG, WebP.',
  empty: 'Fayl boşdur.',
};
export const kindProblem = kind => KIND_HELP[kind] || null;

// ---------- Image headers (dimensions without decoding) ----------
export function imageInfo(u8) {
  const kind = sniff(u8);
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let w = 0, h = 0;
  try {
    if (kind === 'png') {
      if (new TextDecoder('latin1').decode(u8.subarray(12, 16)) !== 'IHDR') fail('PNG başlığı pozulub.');
      w = dv.getUint32(16); h = dv.getUint32(20);
    } else if (kind === 'jpeg') {
      let o = 2;
      while (o + 9 < u8.length) {
        if (u8[o] !== 0xff) { o += 1; continue; }
        const m = u8[o + 1];
        if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7) || m === 0xff) { o += m === 0xff ? 1 : 2; continue; }
        const len = dv.getUint16(o + 2);
        if (len < 2) break;
        if ((m >= 0xc0 && m <= 0xc3) || (m >= 0xc5 && m <= 0xc7) || (m >= 0xc9 && m <= 0xcb) || (m >= 0xcd && m <= 0xcf)) {
          h = dv.getUint16(o + 5); w = dv.getUint16(o + 7); break;
        }
        if (m === 0xda || m === 0xd9) break;
        o += 2 + len;
      }
    } else if (kind === 'webp') {
      const c = new TextDecoder('latin1').decode(u8.subarray(12, 16));
      if (c === 'VP8 ') { if (!at(u8, [0x9d, 0x01, 0x2a], 23)) fail('WebP başlığı pozulub.'); w = dv.getUint16(26, true) & 0x3fff; h = dv.getUint16(28, true) & 0x3fff; }
      else if (c === 'VP8L') { if (u8[20] !== 0x2f) fail('WebP başlığı pozulub.'); const b = dv.getUint32(21, true); w = (b & 0x3fff) + 1; h = ((b >> 14) & 0x3fff) + 1; }
      else if (c === 'VP8X') { w = 1 + (u8[24] | (u8[25] << 8) | (u8[26] << 16)); h = 1 + (u8[27] | (u8[28] << 8) | (u8[29] << 16)); }
      else fail('WebP başlığı tanınmadı.');
    } else {
      fail(kindProblem(kind) || 'Şəkil deyil.', 'type');
    }
  } catch (e) {
    if (e instanceof ImportError) throw e;
    fail('Şəklin başlığı oxunmadı: fayl kəsik və ya pozulub.');
  }
  if (!(w > 0 && h > 0)) fail('Şəklin ölçüsü oxunmadı: fayl kəsik və ya pozulub.');
  return { kind, width: w, height: h };
}

// Size rules for one decoded source image (before re-encoding).
export function checkImageSize(w, h, label = 'Şəkil') {
  if (w > LIMITS.imageSide || h > LIMITS.imageSide) fail(`${label}: ${w}×${h} px çox böyükdür (hər tərəf ən çox ${LIMITS.imageSide} px).`, 'size');
  if (w * h > LIMITS.imagePixels) fail(`${label}: ${Math.round(w * h / 1e6)} meqapiksel çox böyükdür (ən çox ${LIMITS.imagePixels / 1e6} MP).`, 'size');
  if (Math.max(w, h) / Math.min(w, h) > LIMITS.aspect) fail(`${label}: tərəflərin nisbəti ${w}×${h} səhifə üçün çox uzundur (ən çox 1:${LIMITS.aspect}).`, 'size');
}

// Prepared page size: never upscale raster pages; PDF pages are rendered straight at this size.
export function fitPage(w, h, { upscale = false } = {}) {
  const land = w > h;
  const maxW = land ? OUT.long : OUT.short, maxH = land ? OUT.short : OUT.long;
  let s = Math.min(maxW / w, maxH / h);
  if (!upscale) s = Math.min(1, s);
  s = Math.min(s, 6);
  return { width: Math.max(1, Math.round(w * s)), height: Math.max(1, Math.round(h * s)), scale: s };
}

// ---------- Natural order ("2.png" before "10.png") ----------
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
export const naturalCompare = (a, b) => collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0);

// ---------- CRC-32 ----------
let CRC;
export function crc32(u8) {
  if (!CRC) { CRC = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } }
  let c = 0xffffffff;
  for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ---------- ZIP / CBZ ----------
const IGNORED = /(^|\/)(__MACOSX\/|\._[^/]*$|\.DS_Store$|Thumbs\.db$|desktop\.ini$|ComicInfo\.xml$)/i;
const ARCHIVE_EXT = /\.(zip|cbz|rar|cbr|7z|cb7|tar|cbt|gz|tgz|bz2|xz|zst|epub)$/i;
const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;
export function unsafeEntryName(name) {
  if (!name || name.length > 255) return 'ad boşdur və ya çox uzundur';
  if (/[\u0000-\u001f\u007f]/.test(name)) return 'adda idarəetmə simvolları var';
  if (name.includes('\\')) return 'adda tərs xətt (\\) var';
  if (name.startsWith('/') || /^[a-zA-Z]:/.test(name)) return 'mütləq yoldur';
  if (name.split('/').some(seg => seg === '..' || seg === '.')) return 'qovluqdan kənara çıxan yol (..) var';
  return null;
}

// Reads the central directory strictly and returns the image entries in natural order.
// Rejects: ZIP64, multi-disk, encryption, unknown compression, traversal/absolute/odd names, symlinks,
// duplicate names, nested archives, non-image files, overlapping entries and suspicious sizes/ratios.
export function readZip(u8, { name = 'Arxiv' } = {}) {
  if (u8.length > LIMITS.sourceBytes) fail(`${name}: ${humanBytes(u8.length)} limitdən böyükdür (${humanBytes(LIMITS.sourceBytes)}).`, 'size');
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 22 - 65535); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) fail(`${name}: ZIP sonu tapılmadı; arxiv kəsik və ya pozulub.`, 'corrupt');
  if (eocd >= 20 && dv.getUint32(eocd - 20, true) === 0x07064b50) fail(`${name}: ZIP64 arxivləri dəstəklənmir. Arxivi adi ZIP kimi yenidən yaradın.`, 'unsupported');
  const disk = dv.getUint16(eocd + 4, true), cdDisk = dv.getUint16(eocd + 6, true);
  const onDisk = dv.getUint16(eocd + 8, true), total = dv.getUint16(eocd + 10, true);
  const cdSize = dv.getUint32(eocd + 12, true), cdOff = dv.getUint32(eocd + 16, true);
  if (disk || cdDisk || onDisk !== total) fail(`${name}: çoxhissəli arxivlər dəstəklənmir.`, 'unsupported');
  if (total === 0xffff || cdOff === 0xffffffff || cdSize === 0xffffffff) fail(`${name}: ZIP64 arxivləri dəstəklənmir.`, 'unsupported');
  if (total > LIMITS.archiveEntries) fail(`${name}: ${total} element çoxdur (ən çox ${LIMITS.archiveEntries}).`, 'size');
  if (cdOff + cdSize > eocd) fail(`${name}: mərkəzi kataloq pozulub.`, 'corrupt');
  const dec = new TextDecoder('utf-8');
  const entries = [], seen = new Set();
  let o = cdOff, expanded = 0;
  for (let k = 0; k < total; k++) {
    if (o + 46 > eocd || dv.getUint32(o, true) !== 0x02014b50) fail(`${name}: mərkəzi kataloq pozulub.`, 'corrupt');
    const madeBy = dv.getUint16(o + 4, true), flags = dv.getUint16(o + 8, true), method = dv.getUint16(o + 10, true);
    const crc = dv.getUint32(o + 16, true), csize = dv.getUint32(o + 20, true), usize = dv.getUint32(o + 24, true);
    const nlen = dv.getUint16(o + 28, true), xlen = dv.getUint16(o + 30, true), clen = dv.getUint16(o + 32, true);
    const ext = dv.getUint32(o + 38, true), lho = dv.getUint32(o + 42, true);
    const entryName = dec.decode(u8.subarray(o + 46, o + 46 + nlen));
    o += 46 + nlen + xlen + clen;
    const bad = unsafeEntryName(entryName);
    if (bad) fail(`${name}: “${entryName.slice(0, 80)}” təhlükəlidir (${bad}).`, 'unsafe');
    if ((madeBy >> 8) === 3 && ((ext >>> 16) & 0o170000) === 0o120000) fail(`${name}: “${entryName}” simvolik keçiddir (symlink).`, 'unsafe');
    const key = entryName.toLowerCase();
    if (seen.has(key)) fail(`${name}: “${entryName}” arxivdə iki dəfə var.`, 'unsafe');
    seen.add(key);
    if (entryName.endsWith('/')) continue;
    if (IGNORED.test(entryName)) continue;
    if (flags & 0x41) fail(`${name}: arxiv parolla şifrələnib. Şifrəsiz arxiv yükləyin.`, 'encrypted');
    if (csize === 0xffffffff || usize === 0xffffffff || lho === 0xffffffff) fail(`${name}: ZIP64 arxivləri dəstəklənmir.`, 'unsupported');
    if (ARCHIVE_EXT.test(entryName)) fail(`${name}: içində başqa arxiv var (“${entryName}”). Bütün səhifələr birbaşa bir arxivdə olmalıdır.`, 'nested');
    if (!IMAGE_EXT.test(entryName)) fail(`${name}: “${entryName}” şəkil faylı deyil. Arxivdə yalnız JPG, PNG və WebP səhifələr ola bilər.`, 'type');
    if (method !== 0 && method !== 8) fail(`${name}: “${entryName}” naməlum sıxma üsulu ilə sıxılıb.`, 'unsupported');
    if (usize > LIMITS.imageBytes) fail(`${name}: “${entryName}” açılmış halda ${humanBytes(usize)}-dır (ən çox ${humanBytes(LIMITS.imageBytes)}).`, 'size');
    if (usize === 0) fail(`${name}: “${entryName}” boşdur.`, 'corrupt');
    if (method === 0 && csize !== usize) fail(`${name}: “${entryName}” ölçüləri uyğun gəlmir.`, 'corrupt');
    if (csize === 0 || usize / csize > LIMITS.archiveRatio) fail(`${name}: “${entryName}” şübhəli dərəcədə sıxılıb (zip bomb ehtimalı).`, 'bomb');
    expanded += usize;
    if (expanded > LIMITS.archiveExpanded) fail(`${name}: açılmış ölçü ${humanBytes(LIMITS.archiveExpanded)} limitini keçir.`, 'bomb');
    if (lho + 30 > cdOff || dv.getUint32(lho, true) !== 0x04034b50) fail(`${name}: “${entryName}” yerli başlığı pozulub.`, 'corrupt');
    const lnlen = dv.getUint16(lho + 26, true), lxlen = dv.getUint16(lho + 28, true);
    if (dec.decode(u8.subarray(lho + 30, lho + 30 + lnlen)) !== entryName) fail(`${name}: “${entryName}” başlıqları uyğun gəlmir.`, 'unsafe');
    const start = lho + 30 + lnlen + lxlen;
    if (start + csize > cdOff) fail(`${name}: “${entryName}” arxivin hüdudlarından kənara çıxır.`, 'corrupt');
    entries.push({ name: entryName, method, crc, csize, usize, start, header: lho });
  }
  // Overlapping entries are a classic bomb trick (many records pointing at the same data).
  const byPos = [...entries].sort((a, b) => a.header - b.header);
  for (let i = 1; i < byPos.length; i++) if (byPos[i].header < byPos[i - 1].start + byPos[i - 1].csize) fail(`${name}: arxivdə üst-üstə düşən elementlər var (zip bomb ehtimalı).`, 'bomb');
  if (!entries.length) fail(`${name}: arxivdə JPG, PNG və ya WebP səhifə tapılmadı.`, 'empty');
  if (entries.length > LIMITS.pages) fail(`${name}: ${entries.length} səhifə çoxdur (ən çox ${LIMITS.pages}).`, 'size');
  entries.sort((a, b) => naturalCompare(a.name, b.name));
  return entries;
}

// Decompresses one entry with a hard output cap (the declared size), verifying length and CRC.
export function extractEntry(u8, e, { name = 'Arxiv' } = {}) {
  const data = u8.subarray(e.start, e.start + e.csize);
  let out;
  if (e.method === 0) out = data;
  else {
    const parts = []; let got = 0;
    const inf = new Inflate(chunk => {
      got += chunk.length;
      if (got > e.usize) throw new ImportError(`${name}: “${e.name}” elan edildiyindən böyük açılır (zip bomb ehtimalı).`, 'bomb');
      parts.push(chunk);
    });
    try {
      for (let i = 0; i < data.length; i += 16384) inf.push(data.subarray(i, Math.min(data.length, i + 16384)), i + 16384 >= data.length);
    } catch (err) {
      if (err instanceof ImportError) throw err;
      fail(`${name}: “${e.name}” açılmadı: arxiv pozulub.`, 'corrupt');
    }
    out = new Uint8Array(got);
    let p = 0; for (const c of parts) { out.set(c, p); p += c.length; }
  }
  if (out.length !== e.usize) fail(`${name}: “${e.name}” ölçüsü elan ediləndən fərqlidir.`, 'corrupt');
  if (crc32(out) !== e.crc) fail(`${name}: “${e.name}” yoxlama cəmi (CRC) uyğun gəlmir: arxiv pozulub.`, 'corrupt');
  return out;
}

// ---------- Choosing files ----------
// files: [{ name, size, kind }] where kind comes from sniff() of the first bytes.
// Returns { mode: 'pdf'|'zip'|'images', files } or throws with a message listing what is wrong.
export function planSelection(files) {
  if (!files.length) fail('Fayl seçilməyib.', 'empty');
  const problems = [];
  for (const f of files) {
    const p = kindProblem(f.kind);
    if (p && !isImageKind(f.kind) && f.kind !== 'pdf' && f.kind !== 'zip') problems.push(`${f.name}: ${p}`);
    else if (f.kind === 'zip' && /\.epub$/i.test(f.name)) problems.push(`${f.name}: EPUB dəstəklənmir. PDF, CBZ/ZIP və ya şəkillər yükləyin.`);
  }
  if (problems.length) fail(problems.join('\n'), 'type');
  const docs = files.filter(f => f.kind === 'pdf' || f.kind === 'zip');
  if (docs.length && files.length > 1) fail('PDF və ya arxivi tək seçin; onu şəkillərlə və ya başqa faylla qarışdırmaq olmaz.', 'mixed');
  if (docs.length) {
    const f = docs[0];
    if (f.size > LIMITS.sourceBytes) fail(`${f.name}: ${humanBytes(f.size)} limitdən böyükdür (ən çox ${humanBytes(LIMITS.sourceBytes)}).`, 'size');
    return { mode: f.kind, files: [f] };
  }
  if (files.length > LIMITS.imageFiles) fail(`${files.length} şəkil seçilib; ən çox ${LIMITS.imageFiles}.`, 'size');
  const big = files.filter(f => f.size > LIMITS.imageBytes);
  if (big.length) fail(big.map(f => `${f.name}: ${humanBytes(f.size)} (ən çox ${humanBytes(LIMITS.imageBytes)})`).join('\n'), 'size');
  return { mode: 'images', files: [...files].sort((a, b) => naturalCompare(a.name, b.name)) };
}

export const LIMITS_TEXT = [
  `PDF: bir fayl, ən çox ${humanBytes(LIMITS.sourceBytes)} və ${LIMITS.pages} səhifə. Parolsuz olmalıdır. Hər səhifə şəklə çevrilir.`,
  `CBZ və ya ZIP: bir arxiv, ən çox ${humanBytes(LIMITS.sourceBytes)}, içində yalnız JPG/PNG/WebP səhifələr (ComicInfo.xml nəzərə alınmır). Arxiv içində arxiv, qovluqdan kənar yollar və parollu arxivlər qəbul edilmir.`,
  `Şəkillər: JPG, PNG, WebP; ${LIMITS.imageFiles} fayla qədər, hər biri ən çox ${humanBytes(LIMITS.imageBytes)}, ${LIMITS.imageSide} px və ${LIMITS.imagePixels / 1e6} meqapiksel. Fayl adlarına görə təbii sıra ilə düzülür (2, 10, 11).`,
  'Dəstəklənmir: CBR/RAR, CB7/7z, EPUB, GIF, SVG, HEIC.',
];

// ---------- Metadata ----------
const TR = { ə: 'e', ı: 'i', ö: 'o', ü: 'u', ğ: 'g', ş: 's', ç: 'c', İ: 'i', і: 'i' };
const CYR = 'а:a б:b в:v г:g д:d е:e ё:e ж:zh з:z и:i й:y к:k л:l м:m н:n о:o п:p р:r с:s т:t у:u ф:f х:kh ц:ts ч:ch ш:sh щ:sch ы:y э:e ю:yu я:ya'
  .split(' ').reduce((m, p) => { const [a, b] = p.split(':'); m[a] = b; return m; }, {});
export function slugify(s) {
  const base = String(s || '').toLowerCase().replace(/[əıöüğşçіİ]/g, c => TR[c] || c).replace(/[а-яё]/g, c => CYR[c] ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56).replace(/-+$/, '');
  return base.length >= 2 ? base : '';
}
export const RESERVED_SLUG = /^pepper-carrot-/;
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const META_LANGUAGES = ['az', 'en', 'ru', 'tr', 'none'];

// Field errors for saving a draft (format only).
export function validateMeta(m) {
  const e = {};
  if (!SLUG_RE.test(m.slug || '') || m.slug.length < 2 || m.slug.length > 64) e.slug = 'Ünvan 2–64 simvol: kiçik latın hərfləri, rəqəmlər və tire.';
  else if (RESERVED_SLUG.test(m.slug)) e.slug = '“pepper-carrot-” ilə başlayan ünvanlar başlanğıc kolleksiyaya aiddir.';
  if ((m.title || '').length > 160) e.title = 'Ad ən çox 160 simvol ola bilər.';
  if ((m.synopsis || '').length > 2000) e.synopsis = 'Təsvir ən çox 2000 simvol ola bilər.';
  if (!META_LANGUAGES.includes(m.language)) e.language = 'Dil seçin.';
  if ((m.genres || []).length > 6) e.genres = 'Ən çox 6 janr.';
  if ((m.credits || []).length > 20) e.credits = 'Ən çox 20 kredit sətri.';
  if (m.year != null && !(m.year >= 1900 && m.year <= 2100)) e.year = 'İl 1900–2100 arasında olmalıdır.';
  if (m.access === 'paid') {
    if (!(m.price > 0 && m.price <= 10000)) e.price = 'Qiyməti AZN ilə yazın (məsələn 6 və ya 4.50).';
    if (!(Number.isInteger(m.preview_pages) && m.preview_pages >= 1)) e.preview_pages = 'Önizləmə səhifələrinin sayını yazın (ən azı 1).';
  }
  return e;
}
// Problems that block publishing; mirrors public.luna_publish_problems in supabase/luna-publishing.sql.
export function publishProblems(m, pageCount, hasCover) {
  const p = [];
  if (!pageCount) p.push('Hazır səhifə versiyası yoxdur: əvvəlcə faylı idxal edin.');
  if (!String(m.title || '').trim()) p.push('Ad boşdur.');
  if (!String(m.creator || '').trim()) p.push('Müəllif boşdur.');
  if (String(m.synopsis || '').trim().length < 20) p.push('Qısa təsvir ən azı 20 simvol olmalıdır.');
  if (String(m.rights || '').trim().length < 10) p.push('Hüquq bəyanatı yazılmayıb.');
  if (!(m.genres || []).length) p.push('Ən azı bir janr seçin.');
  if (!hasCover) p.push('Üz qabığı seçilməyib.');
  if (m.access === 'paid') {
    if (!(m.price > 0)) p.push('Qiymət (AZN) yazılmayıb.');
    if (!(m.preview_pages >= 1 && m.preview_pages < pageCount)) p.push('Önizləmə səhifələrinin sayı 1 ilə ümumi səhifə sayından bir az arasında olmalıdır.');
  }
  return p;
}
