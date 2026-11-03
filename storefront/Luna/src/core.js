// Pure Luna logic shared by the browser and tests/luna.test.mjs: reading order, spreads,
// preview boundaries, catalogue filtering, manifest validation and progress normalisation.

// ---------- Reading order ----------
// A title is read as "leaves": the Luna jacket (index 0), every bundled story page, then one closing leaf.
// Free titles close with a colophon (credits); sample titles close at the real preview boundary.
export function buildLeaves(title) {
  const leaves = [{ kind: 'cover', label: 'Üz qabığı' }];
  title.pages.forEach((file, i) => leaves.push({ kind: 'page', n: i + 1, file, label: `Səhifə ${i + 1}` }));
  leaves.push(title.access === 'sample'
    ? { kind: 'preview-end', label: 'Önizləmənin sonu' }
    : { kind: 'colophon', label: 'Kreditlər' });
  return leaves;
}

// ---------- Spreads (desktop book) ----------
// Spread 0 is the closed front cover on the right. Then pages pair as [1,2], [3,4] ...
// A final odd leaf sits alone on the left (the back of the book), never duplicated or dropped.
export const spreadCount = n => (n <= 0 ? 0 : 1 + Math.ceil((n - 1) / 2));
export const spreadOf = i => (i <= 0 ? 0 : Math.ceil(i / 2));
export function spreadLeaves(s, n) {
  if (s <= 0) return [null, n > 0 ? 0 : null];
  const left = 2 * s - 1, right = 2 * s;
  return [left < n ? left : null, right < n ? right : null];
}
// The logical page a spread represents (used when switching to single-page mode).
export function spreadAnchor(s, n) {
  const [l, r] = spreadLeaves(s, n);
  return l ?? r ?? 0;
}

// Next/previous logical index for a mode. Returns the same index at the boundaries.
export function step(i, dir, n, mode) {
  i = clampIndex(i, n);
  if (mode === 'single') return clampIndex(i + dir, n);
  const s = spreadOf(i) + dir;
  if (s < 0 || s >= spreadCount(n)) return i;
  return spreadAnchor(s, n);
}
export function atStart(i, mode) { return mode === 'single' ? i <= 0 : spreadOf(i) === 0; }
export function atEnd(i, n, mode) { return mode === 'single' ? i >= n - 1 : spreadOf(i) >= spreadCount(n) - 1; }

export function clampIndex(i, n) {
  const v = Math.trunc(Number(i));
  if (!Number.isFinite(v) || n <= 0) return 0;
  return Math.min(Math.max(v, 0), n - 1);
}

// Status text such as "Səhifə 3–4 / 9" (story pages only; jacket and closing leaf are named).
export function statusText(i, n, leaves, mode) {
  const story = leaves.filter(l => l.kind === 'page').length;
  const shown = mode === 'single' ? [i] : spreadLeaves(spreadOf(i), n).filter(x => x !== null);
  const nums = shown.map(x => leaves[x]).filter(l => l.kind === 'page').map(l => l.n);
  if (!nums.length) return shown.map(x => leaves[x].label).join(' və ');
  const range = nums.length > 1 ? `${nums[0]}–${nums[nums.length - 1]}` : `${nums[0]}`;
  return `Səhifə ${range} / ${story}`;
}

// ---------- Layout mode ----------
// Book spread only when two pages fit at a readable height; phones always get one page.
export function chooseMode(width, height, pageRatio = 1200 / 1660) {
  if (width < 900) return 'single';
  const spreadH = Math.min(height, width / 2 / pageRatio);
  const singleH = Math.min(height, width / pageRatio);
  return spreadH >= 360 && spreadH >= singleH * 0.85 ? 'spread' : 'single';
}

// ---------- Progress ----------
// Stored progress may be stale (manifest changed), malformed or from another device. Always normalise.
export function normalizeProgress(raw, leafCount) {
  if (!raw || typeof raw !== 'object') return null;
  const i = clampIndex(raw.i ?? raw.page, leafCount);
  const at = Number.isFinite(Date.parse(raw.at)) ? new Date(raw.at).toISOString() : new Date(0).toISOString();
  return { i, n: leafCount, at, done: i >= leafCount - 1 };
}
export function progressLabel(p, leaves) {
  if (!p) return '';
  const leaf = leaves[p.i];
  if (p.done) return 'Sona qədər oxunub';
  if (!leaf || leaf.kind === 'cover') return 'Başlanmayıb';
  return leaf.kind === 'page' ? `Səhifə ${leaf.n}-də qalmısınız` : leaf.label;
}

// ---------- Catalogue ----------
const fold = s => String(s || '').toLocaleLowerCase('az').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/ə/g, 'e').replace(/ı/g, 'i');
export function filterTitles(list, { q = '', access = 'all', language = 'all', genre = 'all' } = {}, languages = {}) {
  const words = fold(q).split(/\s+/).filter(Boolean);
  return list.filter(t => {
    if (access !== 'all' && t.access !== access) return false;
    if (language !== 'all' && t.language !== language) return false;
    if (genre !== 'all' && !t.genres.includes(genre)) return false;
    if (!words.length) return true;
    const hay = fold([t.title, t.titleNote, t.series, t.creator, t.synopsis, `bölüm ${t.episode}`, ...t.genres, languages[t.language], ...t.credits.map(c => c[1])].join(' '));
    return words.every(w => hay.includes(w));
  });
}
export const genresOf = list => [...new Set(list.flatMap(t => t.genres))].sort((a, b) => a.localeCompare(b, 'az'));

// ---------- Manifest validation ----------
export function validateTitle(t) {
  const errors = [];
  const need = ['slug', 'series', 'title', 'creator', 'language', 'synopsis', 'access', 'pages', 'storyPages', 'pageSize', 'license', 'source', 'credits'];
  for (const k of need) if (t[k] === undefined || t[k] === null || t[k] === '') errors.push(`${t.slug}: missing ${k}`);
  if (!/^[a-z0-9-]{2,64}$/.test(t.slug || '')) errors.push(`${t.slug}: slug must be lowercase a-z, 0-9, dash`);
  if (!['free', 'sample'].includes(t.access)) errors.push(`${t.slug}: access must be free or sample`);
  if (!Array.isArray(t.pages) || !t.pages.length) errors.push(`${t.slug}: pages must be a non-empty list`);
  else if (new Set(t.pages).size !== t.pages.length) errors.push(`${t.slug}: duplicate page files`);
  if (t.access === 'free') {
    if (t.price !== null) errors.push(`${t.slug}: free titles have no price`);
    if (t.pages?.length !== t.storyPages) errors.push(`${t.slug}: free titles must bundle every story page`);
  }
  if (t.access === 'sample') {
    if (!(t.price > 0)) errors.push(`${t.slug}: sample titles need an illustrative AZN price`);
    if (!(t.previewPages > 0 && t.previewPages < t.storyPages)) errors.push(`${t.slug}: previewPages must be between 1 and storyPages-1`);
    if (t.pages?.length !== t.previewPages) errors.push(`${t.slug}: sample titles bundle exactly previewPages pages`);
  }
  if (!/^#[0-9a-f]{6}$/i.test(t.tone || '')) errors.push(`${t.slug}: tone must be a hex colour`);
  if (!t.license?.name || !t.license?.url || !t.license?.evidence) errors.push(`${t.slug}: license needs name, url and evidence`);
  if (!/^https:\/\//.test(t.source?.page || '') || !/^https:\/\//.test(t.source?.files || '')) errors.push(`${t.slug}: source needs https page and files URLs`);
  return errors;
}
