// File intake for Authentic: type sniffing, text extraction, hidden text and metadata.
// Pure functions over bytes; the caller supplies `unzip` (fflate.unzipSync) and `pdf` helpers.

export const MAX_BYTES = 10 * 1024 * 1024;

const dec = new TextDecoder('utf-8', { fatal: false });
const ent = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&amp;/g, '&');

export function sniff(bytes, name = '') {
  const b = bytes;
  if (b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'pdf';
  if (b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04) return 'zip';
  if (b.length >= 8 && b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0) return 'legacy-office';
  // plain text: no NUL bytes in the first 4 KB and decodes as UTF-8
  const head = b.subarray(0, 4096);
  if (!head.includes(0)) {
    try { new TextDecoder('utf-8', { fatal: true }).decode(head.length < b.length ? b.subarray(0, Math.min(b.length, 65536)) : b); return 'text'; }
    catch { /* fallthrough */ }
  }
  return /\.(txt|md)$/i.test(name) ? 'text' : 'unknown';
}

function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? ent(m[1]).trim() : null;
}

function officeMeta(files) {
  const core = files['docProps/core.xml'] ? dec.decode(files['docProps/core.xml']) : '';
  const app = files['docProps/app.xml'] ? dec.decode(files['docProps/app.xml']) : '';
  const meta = {
    creator: tag(core, 'dc:creator'),
    lastModifiedBy: tag(core, 'cp:lastModifiedBy'),
    created: tag(core, 'dcterms:created'),
    modified: tag(core, 'dcterms:modified'),
    revision: tag(core, 'cp:revision'),
    application: tag(app, 'Application'),
    appVersion: tag(app, 'AppVersion'),
    totalEditMinutes: tag(app, 'TotalTime'),
  };
  for (const k of Object.keys(meta)) if (meta[k] == null || meta[k] === '') delete meta[k];
  if (meta.revision) meta.revision = Number(meta.revision);
  if (meta.totalEditMinutes) meta.totalEditMinutes = Number(meta.totalEditMinutes);
  return meta;
}

// DOCX: visible paragraphs plus runs that are hidden, white or tiny.
function docx(files) {
  const parts = Object.keys(files).filter((k) => /^word\/(document|footnotes|endnotes|header\d*|footer\d*)\.xml$/.test(k)).sort((a, b) => (a === 'word/document.xml' ? -1 : b === 'word/document.xml' ? 1 : a.localeCompare(b)));
  const paras = [], hidden = [];
  for (const k of parts) {
    const xml = dec.decode(files[k]);
    for (const p of xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || []) {
      let vis = '';
      for (const r of p.match(/<w:r[ >][\s\S]*?<\/w:r>/g) || []) {
        const rpr = (r.match(/<w:rPr>[\s\S]*?<\/w:rPr>/) || [''])[0];
        const txt = (r.match(/<w:t(?: [^>]*)?>[\s\S]*?<\/w:t>/g) || []).map((t) => ent(t.replace(/<[^>]+>/g, ''))).join('')
          + ((r.match(/<w:tab\/>/g) || []).length ? '\t' : '');
        if (!txt.trim()) { vis += txt; continue; }
        const why = [];
        if (/<w:vanish\/>|<w:vanish w:val="(?:1|true)"\/>/.test(rpr)) why.push('hidden');
        if (/<w:color w:val="(?:FFFFFF|ffffff)"/.test(rpr) && !/<w:shd [^>]*w:fill="(?!auto|FFFFFF|ffffff)/.test(rpr) && !/<w:highlight /.test(rpr)) why.push('white text');
        const sz = rpr.match(/<w:sz w:val="(\d+)"/);
        if (sz && Number(sz[1]) <= 4) why.push(`${Number(sz[1]) / 2}pt font`);
        if (why.length) hidden.push({ text: txt.trim().slice(0, 500), reason: why.join(', '), where: k.replace('word/', '').replace('.xml', '') });
        else vis += txt;
      }
      if (vis.trim()) paras.push(vis.trim());
    }
  }
  return { text: paras.join('\n\n'), hidden, meta: officeMeta(files), kind: 'docx' };
}

// PPTX: slide text in order, speaker notes, hidden slides, tiny or white text.
function pptx(files) {
  const num = (k) => Number((k.match(/(\d+)\.xml$/) || [0, 0])[1]);
  const slides = Object.keys(files).filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k)).sort((a, b) => num(a) - num(b));
  const blocks = [], hidden = [];
  let slideCount = 0;
  const shapeText = (xml, where, isHiddenSlide) => {
    const out = [];
    for (const sp of xml.match(/<p:sp>[\s\S]*?<\/p:sp>|<p:sp [\s\S]*?<\/p:sp>/g) || []) {
      const paras = [];
      for (const p of sp.match(/<a:p>[\s\S]*?<\/a:p>/g) || []) {
        let vis = '';
        for (const r of p.match(/<a:r>[\s\S]*?<\/a:r>/g) || []) {
          const t = ent(((r.match(/<a:t>([\s\S]*?)<\/a:t>/) || [0, ''])[1]));
          if (!t.trim()) { vis += t; continue; }
          const rpr = (r.match(/<a:rPr[^>]*\/>|<a:rPr[^>]*>[\s\S]*?<\/a:rPr>/) || [''])[0];
          const sz = rpr.match(/ sz="(\d+)"/);
          const why = [];
          if (sz && Number(sz[1]) < 400) why.push(`${Number(sz[1]) / 100}pt font`);
          if (isHiddenSlide) why.push('hidden slide');
          if (why.length) hidden.push({ text: t.trim().slice(0, 500), reason: why.join(', '), where });
          else vis += t;
        }
        if (vis.trim()) paras.push(vis.trim());
      }
      if (paras.length) out.push(paras.join(paras.every((p) => p.split(/\s+/).length < 12) ? '\n' : ' '));
    }
    return out;
  };
  for (const k of slides) {
    slideCount++;
    const xml = dec.decode(files[k]);
    const isHidden = /<p:sld [^>]*show="0"/.test(xml);
    const txt = shapeText(xml, `slide ${num(k)}`, isHidden);
    if (txt.length) blocks.push(txt.join('\n'));
    const notesKey = `ppt/notesSlides/notesSlide${num(k)}.xml`;
    if (files[notesKey]) {
      const notes = shapeText(dec.decode(files[notesKey]), `notes ${num(k)}`, false).filter((t) => !/^\d+$/.test(t));
      if (notes.length) blocks.push(notes.join(' '));
    }
  }
  return { text: blocks.join('\n\n'), hidden, meta: { ...officeMeta(files), slides: slideCount }, kind: 'pptx' };
}

export async function extract(bytes, name, { unzip, pdf }) {
  const kind = sniff(bytes, name);
  if (kind === 'legacy-office') throw new UserError('Old .doc/.ppt files are not supported. Save as .docx or .pptx and upload again.');
  if (kind === 'text') return { text: dec.decode(bytes), hidden: [], meta: {}, kind: 'text' };
  if (kind === 'pdf') return { ...(await pdf(bytes)), kind: 'pdf' };
  if (kind === 'zip') {
    let files;
    try { files = unzip(bytes); } catch { throw new UserError('The file looks damaged and could not be opened.'); }
    if (files['word/document.xml']) return docx(files);
    if (Object.keys(files).some((k) => k.startsWith('ppt/slides/'))) return pptx(files);
    throw new UserError('Only .docx, .pptx, .pdf and .txt files are supported.');
  }
  throw new UserError('Only .docx, .pptx, .pdf and .txt files are supported.');
}

export class UserError extends Error {}
