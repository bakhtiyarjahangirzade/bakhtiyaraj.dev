import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { titles, bySlug, LANGUAGES, whatsappUrl, WHATSAPP_NUMBER } from '../storefront/Luna/src/catalogue.js';
import { buildLeaves, spreadCount, spreadOf, spreadLeaves, spreadAnchor, step, atStart, atEnd, clampIndex, statusText, chooseMode, normalizeProgress, progressLabel, filterTitles, genresOf, validateTitle } from '../storefront/Luna/src/core.js';

const pub = new URL('../storefront/public/Luna/comics/', import.meta.url);
// Width/height from a WebP header (VP8, VP8L or VP8X).
function webpSize(buf) {
  assert.equal(buf.toString('ascii', 0, 4), 'RIFF'); assert.equal(buf.toString('ascii', 8, 12), 'WEBP');
  const kind = buf.toString('ascii', 12, 16);
  if (kind === 'VP8 ') return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
  if (kind === 'VP8L') { const b = buf.readUInt32LE(21); return [(b & 0x3fff) + 1, ((b >> 14) & 0x3fff) + 1]; }
  if (kind === 'VP8X') return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
  throw new Error('unknown webp ' + kind);
}

test('Luna manifest: every title validates and slugs are unique', () => {
  assert.equal(bySlug.size, titles.length);
  for (const t of titles) assert.deepEqual(validateTitle(t), [], t.slug);
  assert.ok(titles.some(t => t.access === 'free') && titles.some(t => t.access === 'sample'));
  for (const t of titles) assert.ok(LANGUAGES[t.language], `${t.slug}: language label`);
});

test('Luna manifest: validation catches broken entries', () => {
  const base = bySlug.get('pepper-carrot-08');
  assert.ok(validateTitle({ ...base, pages: [...base.pages, 'p03.webp'] }).some(e => e.includes('previewPages')), 'sample must not bundle beyond preview');
  assert.ok(validateTitle({ ...base, price: null }).some(e => e.includes('price')));
  assert.ok(validateTitle({ ...bySlug.get('pepper-carrot-01'), pages: ['p01.webp', 'p01.webp', 'p02.webp'] }).some(e => e.includes('duplicate')));
  assert.ok(validateTitle({ ...bySlug.get('pepper-carrot-01'), license: { name: 'CC BY 4.0' } }).some(e => e.includes('license')));
});

test('Luna assets: covers and every listed page exist with the declared size; nothing beyond a preview is bundled', () => {
  const dirs = readdirSync(pub);
  assert.deepEqual(dirs.sort(), titles.map(t => t.slug).sort(), 'no orphan comic folders');
  for (const t of titles) {
    const dir = new URL(`${t.slug}/`, pub);
    assert.deepEqual(webpSize(readFileSync(new URL('cover.webp', dir))), t.coverSize, `${t.slug} cover`);
    assert.ok(existsSync(new URL('cover-sm.webp', dir)), `${t.slug} small cover`);
    for (const f of t.pages) assert.deepEqual(webpSize(readFileSync(new URL(f, dir))), t.pageSize, `${t.slug}/${f}`);
    const shipped = readdirSync(dir).filter(f => /^p\d+\.webp$/.test(f)).sort();
    assert.deepEqual(shipped, [...t.pages].sort(), `${t.slug}: only manifest pages are shipped`);
  }
});

test('Luna credits document lists every title and asset folder', () => {
  const doc = readFileSync(new URL('../docs/luna-content-credits.md', import.meta.url), 'utf8');
  for (const t of titles) {
    assert.ok(doc.includes(t.slug), `credits for ${t.slug}`);
    assert.ok(doc.includes(t.source.page), `source page for ${t.slug}`);
  }
});

test('reading order: jacket, every page once in order, closing leaf', () => {
  const free = buildLeaves(bySlug.get('pepper-carrot-03'));
  assert.equal(free.length, 9);
  assert.equal(free[0].kind, 'cover');
  assert.deepEqual(free.filter(l => l.kind === 'page').map(l => l.n), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(free.at(-1).kind, 'colophon');
  const sample = buildLeaves(bySlug.get('pepper-carrot-15'));
  assert.deepEqual(sample.map(l => l.kind), ['cover', 'page', 'page', 'page', 'preview-end']);
});

test('spreads: cover alone, pairs after, odd final leaf alone on the left; no page lost or duplicated', () => {
  for (let n = 1; n <= 14; n++) {
    const seen = [];
    for (let s = 0; s < spreadCount(n); s++) {
      const [l, r] = spreadLeaves(s, n);
      if (s === 0) assert.equal(l, null);
      if (l === null && r === null) assert.fail(`empty spread ${s} for n=${n}`);
      [l, r].filter(x => x !== null).forEach(x => seen.push(x));
    }
    assert.deepEqual(seen, [...Array(n).keys()], `n=${n}`);
    for (let i = 0; i < n; i++) assert.ok(spreadLeaves(spreadOf(i), n).includes(i), `leaf ${i} in its spread (n=${n})`);
  }
  assert.deepEqual(spreadLeaves(4, 8), [7, null], 'even leaf count ends with a lone left page');
  assert.deepEqual(spreadLeaves(4, 9), [7, 8]);
  assert.equal(spreadAnchor(0, 9), 0);
});

test('stepping: boundaries hold in both modes and spread steps visit every spread once', () => {
  const n = 8; // cover + 6 pages + colophon: the last spread is a lone left leaf
  assert.equal(step(0, -1, n, 'single'), 0);
  assert.equal(step(n - 1, 1, n, 'single'), n - 1);
  let i = 0; const visited = [spreadOf(i)];
  while (!atEnd(i, n, 'spread')) { i = step(i, 1, n, 'spread'); visited.push(spreadOf(i)); }
  assert.deepEqual(visited, [0, 1, 2, 3, 4]);
  assert.equal(step(i, 1, n, 'spread'), i);
  while (!atStart(i, 'spread')) i = step(i, -1, n, 'spread');
  assert.equal(i, 0);
  // switching modes keeps the logical page: page 4 lives in spread [3,4], and single mode shows leaf 4 again
  assert.deepEqual(spreadLeaves(spreadOf(4), n), [3, 4]);
  assert.equal(step(4, 1, n, 'single'), 5);
  assert.equal(step(4, 1, n, 'spread'), 5);
  assert.equal(step(3, -1, n, 'spread'), 1);
});

test('status text names page numbers and special leaves', () => {
  const t = bySlug.get('pepper-carrot-03'), L = buildLeaves(t);
  assert.equal(statusText(0, L.length, L, 'spread'), 'Üz qabığı');
  assert.equal(statusText(1, L.length, L, 'spread'), 'Səhifə 1–2 / 7');
  assert.equal(statusText(7, L.length, L, 'spread'), 'Səhifə 7 / 7');
  assert.equal(statusText(8, L.length, L, 'single'), 'Kreditlər');
});

test('layout: phones get one page, wide screens a spread', () => {
  assert.equal(chooseMode(320, 560), 'single');
  assert.equal(chooseMode(390, 760), 'single');
  assert.equal(chooseMode(844, 390), 'single');
  assert.equal(chooseMode(1440, 780), 'spread');
  assert.equal(chooseMode(1000, 300), 'single');
});

test('progress normalisation clamps stale or malformed data', () => {
  assert.equal(normalizeProgress(null, 9), null);
  assert.equal(normalizeProgress('x', 9), null);
  assert.equal(normalizeProgress({ i: 40, at: '2026-11-01T10:00:00Z' }, 9).i, 8);
  assert.equal(normalizeProgress({ i: -3 }, 9).i, 0);
  assert.equal(normalizeProgress({ i: '4.7' }, 9).i, 4);
  assert.equal(normalizeProgress({ i: 'abc' }, 9).i, 0);
  assert.equal(normalizeProgress({ page: 3 }, 9).i, 3);
  assert.equal(normalizeProgress({ i: 8 }, 9).done, true);
  assert.equal(normalizeProgress({ i: 2, at: 'nope' }, 9).at, new Date(0).toISOString());
  const L = buildLeaves(bySlug.get('pepper-carrot-03'));
  assert.equal(progressLabel(normalizeProgress({ i: 3 }, L.length), L), 'Səhifə 3-də qalmısınız');
  assert.equal(clampIndex(5, 0), 0);
});

test('catalogue filters: access, language, genre and accent-insensitive Azerbaijani search', () => {
  const ids = list => list.map(t => t.slug);
  assert.equal(filterTitles(titles, {}).length, titles.length);
  assert.ok(filterTitles(titles, { access: 'sample' }).every(t => t.access === 'sample'));
  assert.deepEqual(ids(filterTitles(titles, { language: 'ru' })), ['pepper-carrot-06-ru']);
  assert.ok(filterTitles(titles, { genre: 'Bayram' }).every(t => t.genres.includes('Bayram')));
  assert.deepEqual(ids(filterTitles(titles, { q: 'saffron bazar' })), ['pepper-carrot-03']);
  assert.ok(ids(filterTitles(titles, { q: 'Prisukhin' })).includes('pepper-carrot-06-ru'), 'search translator credits');
  assert.ok(ids(filterTitles(titles, { q: 'macera' })).includes('pepper-carrot-03'), 'ə folds to e');
  assert.ok(ids(filterTitles(titles, { q: 'sozsuz' }, LANGUAGES)).includes('pepper-carrot-15'));
  assert.equal(filterTitles(titles, { q: 'superman' }).length, 0);
  assert.equal(filterTitles(titles, { access: 'free', language: 'ru', genre: 'Dram' }).length, 0);
  assert.ok(genresOf(titles).includes('Komediya'));
});

test('sample inquiry builds a WhatsApp draft link and never a payment', () => {
  for (const t of titles.filter(x => x.access === 'sample')) {
    const u = new URL(whatsappUrl(t));
    assert.equal(u.origin + u.pathname, `https://wa.me/${WHATSAPP_NUMBER}`);
    assert.ok(u.searchParams.get('text').includes(t.title));
  }
  const src = ['app.js', 'reader.js', 'store.js', 'account.js'].map(f => readFileSync(new URL(`../storefront/Luna/src/${f}`, import.meta.url), 'utf8')).join('\n');
  assert.doesNotMatch(src, /card ?number|cvv|checkout|purchased|entitle(?!ments)/i);
  assert.doesNotMatch(src, /localStorage\.setItem\([^)]*password/i);
});

test('Luna HTML stays within the production CSP (no inline scripts, styles or remote assets)', () => {
  const html = readFileSync(new URL('../storefront/Luna/index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i, 'inline script');
  assert.doesNotMatch(html, /<style|\sstyle=/i, 'inline style');
  assert.doesNotMatch(html, /(src|href)="https?:\/\/(?!www\.bakhtiyaraj\.dev|www\.peppercarrot\.com)/i, 'remote asset');
  const js = readFileSync(new URL('../storefront/Luna/src/ui.js', import.meta.url), 'utf8');
  assert.doesNotMatch(js, /innerHTML/);
});

test('Supabase migration keeps Luna rows user-scoped with RLS', () => {
  const sql = readFileSync(new URL('../supabase/luna.sql', import.meta.url), 'utf8');
  for (const table of ['luna_library', 'luna_progress']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
    assert.match(sql, new RegExp(`create policy ${table}_\\w+ on public\\.${table}[^;]*auth\\.uid\\(\\)`));
  }
  assert.doesNotMatch(sql, /(function|trigger)\s+[\w.]*handle_new_user/i, 'Luna does not touch the shared signup trigger');
  assert.doesNotMatch(sql, /to anon/i);
});
