// Authentic detector: hashed stylometric + lexical features, logistic regression.
// Must stay byte-for-byte compatible with train/feats.py (see tests/authentic.test.mjs).

const FUNC = new Set(`a about above after again against all also although am an and any are as at be because been before being below between both but by can could did do does doing down during each either even ever every few for from further had has have having he her here hers herself him himself his how however i if in into is it its itself just least less like many may me might more most moreover much must my myself neither no nor not now of off often on once one only or other others otherwise our ours ourselves out over own perhaps quite rather really same several shall she should since so some such than that the their theirs them themselves then there therefore these they this those though through thus to too under until up upon very was we well were what whatever when where whether which while who whom whose why will with within without would yet you your yours yourself yourselves furthermore additionally overall ultimately significant significantly crucial essential various numerous important ensure however instance example conclusion firstly secondly lastly finally believe think people things lot get got really thing very kind sort`.split(/\s+/));

const SP = /[  -​  　﻿]/g;
export function norm(t) {
  return t.replace(SP, ' ').replace(/’/g, "'").replace(/‘/g, "'")
    .replace(/“/g, '"').replace(/”/g, '"').replace(/—/g, ' -- ').replace(/–/g, '-');
}
const TOK = /[a-z]+(?:'[a-z]+)?|[0-9]+|[^\sa-z0-9]/gu;
const SENT = /(?<=[.!?])\s+/u;
const isAlpha = (c) => /\p{L}/u.test(c);
const isDigit = (c) => /\p{Nd}/u.test(c);
const toks = (s) => s.match(TOK) || [];
const pyWords = (s) => s.trim().split(/\s+/).filter(Boolean);

function shape(w) {
  const c = w[0];
  if (isDigit(c)) return 'N';
  if (!isAlpha(c)) return w;
  if (FUNC.has(w)) return w;
  const n = [...w].length;
  return n <= 3 ? 'Ws' : n <= 6 ? 'Wm' : n <= 9 ? 'Wl' : 'Wx';
}
const bucket = (x, cuts) => { for (let i = 0; i < cuts.length; i++) if (x < cuts[i]) return i; return cuts.length; };

export function features(text) {
  const t = norm(text);
  const low = t.toLowerCase();
  const tk = toks(low);
  const m = tk.map(shape);
  const f = [];
  for (const n of [1, 2, 3, 4]) for (let i = 0; i + n <= m.length; i++) f.push(`m${n}:` + m.slice(i, i + n).join(' '));
  const words = tk.filter((w) => isAlpha(w[0]));
  for (const w of words) f.push('w:' + w);
  for (let i = 0; i < words.length - 1; i++) f.push('b:' + words[i] + ' ' + words[i + 1]);
  const sents = t.trim().split(SENT).filter(Boolean);
  const L = sents.length ? sents.map((s) => toks(s.toLowerCase()).length) : [0];
  const mu = L.reduce((a, b) => a + b, 0) / L.length;
  const sd = Math.sqrt(L.reduce((a, x) => a + (x - mu) ** 2, 0) / L.length);
  const cv = mu ? sd / mu : 0;
  const nw = Math.max(words.length, 1);
  const first = words.slice(0, 150);
  const ttr = new Set(first).size / Math.max(Math.min(words.length, 150), 1);
  const awl = words.reduce((a, w) => a + [...w].length, 0) / nw;
  const caps = sents.filter((s) => { const c = s[0]; return c && c === c.toLowerCase() && c !== c.toUpperCase(); }).length / Math.max(sents.length, 1);
  const li = tk.filter((w) => w === 'i').length / nw;
  for (const [name, val, cuts] of [['sl', mu, [8, 12, 16, 20, 25, 30]], ['cv', cv, [.2, .3, .4, .5, .65, .8]], ['ttr', ttr, [.4, .5, .55, .6, .65, .7, .8]], ['awl', awl, [3.8, 4.2, 4.5, 4.8, 5.1, 5.5]], ['lc', caps, [.01, .1, .3]], ['li', li, [.001, .01, .03]]]) {
    f.push(`s:${name}${bucket(val, cuts)}`);
  }
  return f;
}

export function segments(text, lo = 50, hi = 220) {
  const t = norm(text).replace(/\r/g, '');
  const paras = t.split(/\n\s*\n|\n(?=[A-Z])/u).map((p) => p.trim()).filter(Boolean);
  const out = []; let buf = '';
  for (let p of paras) {
    if (pyWords(p).length > hi) {
      const ss = p.split(SENT); let cur = '';
      for (const s of ss) {
        if (pyWords(cur + ' ' + s).length > hi && pyWords(cur).length >= lo) { out.push(cur.trim()); cur = s; }
        else cur = (cur + ' ' + s).trim();
      }
      p = cur;
    }
    buf = buf ? (buf + '\n' + p).trim() : p;
    if (pyWords(buf).length >= lo) { out.push(buf); buf = ''; }
  }
  if (buf) {
    if (out.length && pyWords(buf).length < lo) out[out.length - 1] += '\n' + buf;
    else out.push(buf);
  }
  return out;
}

// Character 3-5-grams of each word with boundary spaces (second ensemble member).
export function charFeatures(text) {
  const out = [];
  for (const w0 of toks(norm(text).toLowerCase())) {
    if (!isAlpha(w0[0])) continue;
    const w = [...(' ' + w0 + ' ')];
    for (const n of [3, 4, 5]) for (let i = 0; i + n <= w.length; i++) out.push('c:' + w.slice(i, i + n).join(''));
  }
  return out;
}

// sklearn murmurhash3_32(seed=0), index = abs(signed) % nf
const enc = new TextEncoder();
export function murmur3(str) {
  const k = enc.encode(str); const len = k.length; let h = 0; const nb = len >> 2;
  for (let i = 0; i < nb; i++) {
    let x = k[i * 4] | (k[i * 4 + 1] << 8) | (k[i * 4 + 2] << 16) | (k[i * 4 + 3] << 24);
    x = Math.imul(x, 0xcc9e2d51); x = (x << 15) | (x >>> 17); x = Math.imul(x, 0x1b873593);
    h ^= x; h = (h << 13) | (h >>> 19); h = (Math.imul(h, 5) + 0xe6546b64) | 0;
  }
  let x = 0; const r = len & 3, o = nb * 4;
  if (r === 3) x ^= k[o + 2] << 16;
  if (r >= 2) x ^= k[o + 1] << 8;
  if (r >= 1) { x ^= k[o]; x = Math.imul(x, 0xcc9e2d51); x = (x << 15) | (x >>> 17); x = Math.imul(x, 0x1b873593); h ^= x; }
  h ^= len; h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h | 0;
}

function unpack(m) {
  const raw = typeof atob === 'function' ? Uint8Array.from(atob(m.w), (c) => c.charCodeAt(0)) : Uint8Array.from(Buffer.from(m.w, 'base64'));
  const q = new Int8Array(raw.buffer, raw.byteOffset, raw.length);
  const w = new Float32Array(q.length);
  for (let i = 0; i < q.length; i++) { const v = q[i] * m.s; w[i] = Math.sign(q[i]) * v * v; }
  return { w, b: m.b, nf: m.nf, weight: m.weight, feats: m.kind === 'char' ? charFeatures : features };
}

// model.json: { v, q (conformal half-widths per paragraph bucket), models: [{ kind, weight, nf, s, b, w }] }
export function loadModel(json) {
  return { v: json.v, q: json.q, conformal: json.conformal, iso: json.iso, parts: json.models.map(unpack) };
}

// Isotonic calibration: raw ensemble score -> probability that the paragraph is AI-written.
function calibrate(model, p) {
  const t = model.iso;
  if (!t || !t.length) return p;
  if (p <= t[0][0]) return t[0][1];
  for (let i = 1; i < t.length; i++) {
    if (p <= t[i][0]) { const [x0, y0] = t[i - 1], [x1, y1] = t[i]; return x1 === x0 ? y1 : y0 + (y1 - y0) * (p - x0) / (x1 - x0); }
  }
  return t[t.length - 1][1];
}

function partProb(m, text) {
  const counts = new Map();
  for (const f of m.feats(text)) {
    const idx = Math.abs(murmur3(f)) % m.nf;
    counts.set(idx, (counts.get(idx) || 0) + 1);
  }
  let z = 0, n2 = 0;
  for (const [idx, c] of counts) { const v = Math.log1p(c); n2 += v * v; z += v * m.w[idx]; }
  const n = Math.sqrt(n2) || 1;
  return 1 / (1 + Math.exp(-(z / n + m.b)));
}

export function prob(model, text) {
  return model.parts.reduce((a, m) => a + m.weight * partProb(m, text), 0);
}

const segBucket = (n) => (n === 1 ? 0 : n <= 3 ? 1 : n <= 6 ? 2 : 3);

// Full analysis: per-segment probabilities, word-weighted AI share and a conformal 98% interval.
export function analyze(model, text) {
  const segs = segments(text);
  const words = pyWords(norm(text)).length;
  if (!segs.length || words < 80) {
    return { status: 'too_short', words, segments: [], minWords: 80 };
  }
  const items = segs.map((s, i) => ({ i, words: pyWords(s).length, p: calibrate(model, prob(model, s)), text: s }));
  const W = items.reduce((a, x) => a + x.words, 0);
  const share = items.reduce((a, x) => a + x.words * x.p, 0) / W;
  const bucket = String(segBucket(items.length));
  let half;
  if (model.conformal && model.conformal.mode === 'adaptive') {
    // Normalised split-conformal: the range scales with how unsure the paragraph scores are.
    const u = items.reduce((a, x) => a + (x.words / W) * x.p * (1 - x.p), 0);
    half = model.conformal.q[bucket] * (Math.sqrt(u) + model.conformal.eps);
  } else half = model.q[bucket];
  const lo = Math.max(0, share - half), hi = Math.min(1, share + half);
  let verdict;
  if (hi <= 0.2) verdict = 'human';
  else if (lo >= 0.8) verdict = 'ai';
  else if (hi - lo > 0.75) verdict = 'inconclusive';
  else if (lo >= 0.5) verdict = 'mostly_ai';
  else if (hi <= 0.5) verdict = 'mostly_human';
  else verdict = 'mixed';
  return { status: 'ok', words, share, lo, hi, confidence: 0.98, verdict, segments: items, modelVersion: model.v };
}
