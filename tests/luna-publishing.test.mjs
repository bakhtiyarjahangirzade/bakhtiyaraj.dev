// Luna owner publishing: import rules (signatures, archive safety, limits, natural order), the published-title
// mapping the storefront/reader use, catalogue merging, inquiry wording and the scoped CSP.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { LIMITS, sniff, imageInfo, readZip, extractEntry, planSelection, naturalCompare, fitPage, checkImageSize, slugify, validateMeta, publishProblems, unsafeEntryName, crc32, ImportError } from '../storefront/Luna/src/import-core.js';
import { toTitle, publicAccess } from '../storefront/Luna/src/published.js';
import { titles, starter, bySlug, addRemote, attribution, whatsappText, whatsappUrl, seriesLine, pageSrc, coverSrc } from '../storefront/Luna/src/catalogue.js';
import { buildLeaves, normalizeProgress, filterTitles } from '../storefront/Luna/src/core.js';

const fx = name => new Uint8Array(readFileSync(new URL(`./fixtures/luna/${name}`, import.meta.url)));
const rejects = (fn, code, re) => assert.throws(fn, e => e instanceof ImportError && (!code || e.code === code) && (!re || re.test(e.message)), `${code} ${re}`);

test('signatures: real formats are recognised by content, renamed files are not images', () => {
  assert.equal(sniff(fx('mixed.pdf')), 'pdf');
  assert.equal(sniff(fx('numbered.cbz')), 'zip');
  assert.equal(sniff(fx('page-01.jpg')), 'jpeg');
  assert.equal(sniff(fx('page-02.png')), 'png');
  assert.equal(sniff(fx('page-03.webp')), 'webp');
  assert.equal(sniff(fx('fake-page.png')), 'markup', 'HTML named .png');
  assert.equal(sniff(fx('fake-page.jpg')), 'markup', 'SVG named .jpg');
  assert.equal(sniff(fx('program.webp')), 'executable');
  assert.equal(sniff(fx('comic.cbr')), 'rar');
  assert.equal(sniff(fx('animation.gif')), 'gif');
  for (const f of ['fake-page.png', 'fake-page.jpg', 'program.webp', 'animation.gif']) rejects(() => imageInfo(fx(f)), 'type');
});

test('image headers give real dimensions; truncated files are refused', () => {
  assert.deepEqual(imageInfo(fx('page-01.jpg')), { kind: 'jpeg', width: 600, height: 840 });
  assert.deepEqual(imageInfo(fx('page-02.png')), { kind: 'png', width: 600, height: 840 });
  assert.deepEqual(imageInfo(fx('page-03.webp')), { kind: 'webp', width: 600, height: 840 });
  assert.deepEqual(imageInfo(fx('page-10-wide.webp')), { kind: 'webp', width: 1000, height: 640 });
  rejects(() => imageInfo(fx('truncated.png').subarray(0, 20)));
  rejects(() => checkImageSize(13000, 2000), 'size');
  rejects(() => checkImageSize(8000, 8000), 'size', /meqapiksel/);
  rejects(() => checkImageSize(500, 4000), 'size', /nisbəti/);
  checkImageSize(1600, 2400);
});

test('CBZ: numbered pages are read in natural order, metadata files are skipped, CRC verified', () => {
  const u8 = fx('numbered.cbz');
  const entries = readZip(u8, { name: 'numbered.cbz' });
  assert.deepEqual(entries.map(e => e.name.split('/').pop()), ['1.png', '2.jpg', '3.png', '4.jpg', '5.png', '6.jpg', '7.png', '8.jpg', '9.png', '10.jpg', '11.png']);
  for (const e of entries) {
    const bytes = extractEntry(u8, e);
    const info = imageInfo(bytes);
    assert.deepEqual([info.width, info.height], [300, 420]);
  }
  const bad = { ...entries[0], crc: (entries[0].crc ^ 1) >>> 0 };
  rejects(() => extractEntry(u8, bad), 'corrupt', /CRC/);
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
});

test('archives: traversal, absolute paths, nesting, non-images, encryption and bombs are refused', () => {
  rejects(() => readZip(fx('traversal.zip')), 'unsafe', /\.\./);
  rejects(() => readZip(fx('absolute.zip')), 'unsafe', /mütləq/);
  rejects(() => readZip(fx('nested.cbz')), 'nested');
  rejects(() => readZip(fx('not-images.zip')), 'type', /readme\.html/);
  rejects(() => readZip(fx('encrypted.zip')), 'encrypted');
  rejects(() => readZip(fx('bomb-ratio.zip')), 'size'); // 40 MB declared > 25 MB per image
  // The lying bomb passes the directory check (it claims 1 KB) but inflation stops at the declared size.
  const u8 = fx('bomb-lying.zip');
  const [e] = readZip(u8);
  assert.equal(e.usize, 1024);
  rejects(() => extractEntry(u8, e), 'bomb');
  // An HTML file renamed .png inside a CBZ is caught by its content after extraction.
  const r = fx('renamed-html.cbz');
  const ents = readZip(r);
  assert.equal(sniff(extractEntry(r, ents[1])), 'markup');
  rejects(() => readZip(fx('mixed.pdf')), 'corrupt');
  for (const n of ['a/../b.png', '/x.png', 'C:/x.png', 'a\\b.png', 'a/./b.png', 'x\u0000.png']) assert.ok(unsafeEntryName(n), n);
  assert.equal(unsafeEntryName('chapter 1/page 01.png'), null);
});

test('file selection: one document or a set of images; clear errors for unsupported, mixed and oversized input', () => {
  assert.equal(planSelection([{ name: 'a.pdf', size: 10, kind: 'pdf' }]).mode, 'pdf');
  assert.equal(planSelection([{ name: 'a.cbz', size: 10, kind: 'zip' }]).mode, 'zip');
  const imgs = planSelection([{ name: 'p10.jpg', size: 1, kind: 'jpeg' }, { name: 'p2.png', size: 1, kind: 'png' }, { name: 'p1.webp', size: 1, kind: 'webp' }]);
  assert.deepEqual(imgs.files.map(f => f.name), ['p1.webp', 'p2.png', 'p10.jpg']);
  rejects(() => planSelection([{ name: 'a.cbr', size: 10, kind: 'rar' }]), 'type', /RAR/);
  rejects(() => planSelection([{ name: 'book.epub', size: 10, kind: 'zip' }]), 'type', /EPUB/);
  rejects(() => planSelection([{ name: 'p.png', size: 10, kind: 'markup' }]), 'type', /HTML/);
  rejects(() => planSelection([{ name: 'a.pdf', size: 1, kind: 'pdf' }, { name: 'b.png', size: 1, kind: 'png' }]), 'mixed');
  rejects(() => planSelection([{ name: 'big.pdf', size: LIMITS.sourceBytes + 1, kind: 'pdf' }]), 'size', /50 MB/);
  rejects(() => planSelection([{ name: 'big.png', size: LIMITS.imageBytes + 1, kind: 'png' }]), 'size');
  rejects(() => planSelection(Array.from({ length: LIMITS.imageFiles + 1 }, (_, k) => ({ name: `${k}.png`, size: 1, kind: 'png' }))), 'size');
  rejects(() => planSelection([]), 'empty');
  assert.ok(naturalCompare('2.png', '10.png') < 0 && naturalCompare('page-9', 'page-10') < 0);
});

test('prepared page sizes keep aspect ratio and stay within readable bounds', () => {
  const p = fitPage(420, 595, { upscale: true }); // A5 PDF in points
  assert.ok(p.height <= 2600 && p.width <= 1600 && Math.abs(p.width / p.height - 420 / 595) < 0.01);
  const l = fitPage(595, 420, { upscale: true });
  assert.ok(l.width <= 2600 && l.height <= 1600 && l.width > l.height);
  assert.deepEqual(fitPage(600, 840), { width: 600, height: 840, scale: 1 }, 'raster pages are never upscaled');
  const big = fitPage(4000, 6000);
  assert.ok(big.width <= 1600 && big.height <= 2600);
});

test('metadata validation and publish checks mirror the server', () => {
  const ok = { slug: 'gece-qatari', title: 'Gecə qatarı', creator: 'A. Müəllif', synopsis: 'Bir qatar, bir gecə və itmiş bilet haqqında.', language: 'az', genres: ['Macəra'], credits: [], rights: '© 2026 A. Müəllif. Bütün hüquqlar qorunur.', access: 'free', price: null, preview_pages: null, year: 2026 };
  assert.deepEqual(validateMeta(ok), {});
  assert.ok(validateMeta({ ...ok, slug: 'Pepper Carrot' }).slug);
  assert.ok(validateMeta({ ...ok, slug: 'pepper-carrot-99' }).slug, 'starter slugs are reserved');
  assert.ok(validateMeta({ ...ok, access: 'paid' }).price);
  assert.deepEqual(publishProblems(ok, 10, true), []);
  assert.ok(publishProblems({ ...ok, rights: '' }, 10, true).length);
  assert.ok(publishProblems({ ...ok, access: 'paid', price: 5, preview_pages: 10 }, 10, true).some(p => /Önizləmə/.test(p)));
  assert.ok(publishProblems(ok, 0, false).length >= 2);
  assert.equal(slugify('Gecə Qatarı: Bölüm 1'), 'gece-qatari-bolum-1');
  assert.equal(slugify('Ночной поезд'), 'nochnoy-poezd');
});

const row = (over = {}) => ({
  id: '11111111-1111-4111-8111-111111111111', slug: 'gece-qatari', title: 'Gecə qatarı', creator: 'A. Müəllif', synopsis: 'Bir qatar və bir gecə.',
  language: 'az', genres: ['Macəra'], credits: [['Rəsm', 'A. Müəllif']], rights: '© 2026 A. Müəllif.', access: 'free', price: null, preview_pages: null, tone: '#223344',
  published_at: '2026-11-03T10:00:00Z',
  revision: { page_count: 4, cover: { path: 'c/r/cover-x.webp', sm: 'c/r/cover-sm-x.webp', width: 1100, height: 1556 },
    pages: [1, 2, 3, 4].map(k => ({ path: `c/r/p00${k}.webp`, width: k === 3 ? 2600 : 1600, height: k === 3 ? 1600 : 2263 })) },
  ...over,
});

test('published titles map onto the reader shape; paid titles expose only preview pages', () => {
  const free = toTitle(row());
  assert.equal(free.remote, true);
  assert.equal(free.access, 'free');
  assert.equal(free.pages.length, 4);
  assert.deepEqual(free.pageSizes[2], [2600, 1600], 'a landscape page keeps its own size');
  assert.ok(Math.abs(free.pageSize[0] / free.pageSize[1] - 1600 / 2263) < 0.01, 'book box uses the median ratio');
  const leaves = buildLeaves(free);
  assert.deepEqual(leaves.map(l => l.kind), ['cover', 'page', 'page', 'page', 'page', 'colophon']);
  // luna_catalogue() already trims pages for paid titles; the mapping trims again (defence in depth).
  const paid = toTitle(row({ access: 'paid', price: 7.5, preview_pages: 2 }));
  assert.equal(paid.access, 'paid');
  assert.equal(paid.price, 7.5);
  assert.equal(paid.pages.length, 2);
  assert.equal(paid.storyPages, 4);
  assert.equal(buildLeaves(paid).at(-1).kind, 'preview-end');
  assert.equal(publicAccess({ access: 'paid', is_sample: true }), 'sample');
  assert.equal(toTitle(row({ access: 'sample', price: 4, preview_pages: 1 })).access, 'sample');
  const editorAll = toTitle(row({ access: 'paid', price: 7.5, preview_pages: 2 }), undefined, { preview: { all: true } });
  assert.equal(editorAll.pages.length, 4, 'editor full preview');
});

test('own works do not inherit the Pepper&Carrot attribution; inquiry wording matches paid vs sample', () => {
  const own = toTitle(row({ access: 'paid', price: 6, preview_pages: 2 }));
  assert.ok(!/peppercarrot|CC BY|David Revoy/i.test(attribution(own)));
  assert.ok(attribution(own).includes('© 2026 A. Müəllif.'));
  assert.ok(/almaq istəyirəm/.test(whatsappText(own)) && /6 AZN/.test(whatsappText(own)), 'paid = purchase inquiry with the real price');
  assert.ok(!/nümunə/i.test(whatsappText(own)));
  const sample = bySlug.get('pepper-carrot-08');
  assert.ok(/nümunə məhsul/.test(whatsappText(sample)) && /bölüm 8/.test(whatsappText(sample)));
  assert.ok(whatsappUrl(own).startsWith('https://wa.me/48571572697?text='));
  assert.equal(seriesLine(own), 'A. Müəllif');
  assert.equal(seriesLine(sample), 'Pepper&Carrot, bölüm 8');
  assert.ok(attribution(sample).includes('peppercarrot.com'), 'starter credits unchanged');
});

test('catalogue merge: published titles join the shop, starter slugs can never be shadowed, unpublish removes them', () => {
  const before = titles.length;
  const t = toTitle(row());
  t.urls = new Map([['c/r/p001.webp', 'https://x/signed1'], ['c/r/cover-sm-x.webp', 'https://x/sm']]);
  const clash = toTitle(row({ id: '2', slug: 'pepper-carrot-01', title: 'Impostor' }));
  addRemote([t, clash]);
  assert.equal(titles.length, before + 1);
  assert.equal(bySlug.get('pepper-carrot-01').title, 'The Potion of Flight');
  assert.equal(bySlug.get('gece-qatari'), t);
  assert.equal(pageSrc(t, 'c/r/p001.webp'), 'https://x/signed1');
  assert.equal(pageSrc(t, 'c/r/p004.webp'), '', 'unsigned page has no URL');
  assert.equal(coverSrc(t, true), 'https://x/sm');
  assert.equal(filterTitles(titles, { q: 'qatar' }).length, 1);
  addRemote([]);
  assert.equal(titles.length, before);
  assert.equal(bySlug.has('gece-qatari'), false);
  assert.deepEqual(starter.map(x => x.slug), titles.map(x => x.slug));
});

test('progress stays valid when a title is republished with fewer pages', () => {
  const p = normalizeProgress({ i: 30, n: 32, at: '2026-11-01T00:00:00Z' }, 6);
  assert.equal(p.i, 5); assert.equal(p.done, true);
  assert.equal(normalizeProgress({ i: 'x' }, 6).i, 0);
});

test('CSP: Luna gets only Supabase images/blob previews and same-origin workers; the rest of the site is unchanged', () => {
  const v = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  const csp = src => v.headers.find(r => r.source === src).headers.find(h => h.key === 'Content-Security-Policy').value;
  const site = csp('/((?!budgettracker|Luna).*)');
  assert.equal(site, "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; media-src 'self'; connect-src 'self' https://yxiedrrahclzqukfnqrn.supabase.co wss://yxiedrrahclzqukfnqrn.supabase.co; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
  for (const src of ['/Luna', '/Luna/(.*)']) {
    const c = csp(src);
    assert.ok(c.includes("img-src 'self' data: blob: https://yxiedrrahclzqukfnqrn.supabase.co;"));
    assert.ok(c.includes("worker-src 'self';"));
    assert.ok(c.includes("script-src 'self';") && !/unsafe-(inline|eval)|wasm-unsafe-eval|\*/.test(c));
  }
  const re = s => new RegExp(`^${s}$`);
  assert.ok(!re('/((?!budgettracker|Luna).*)').test('/Luna') && re('/((?!budgettracker|Luna).*)').test('/lab/'));
  assert.ok(re('/Luna/(.*)').test('/Luna/vendor/pdfjs-6.4.299/pdf.worker.min.mjs'));
  assert.ok(v.rewrites.some(r => r.source === '/Luna'));
});

test('PDF.js is pinned, self-hosted and version-matched; no CDN or secret keys in Luna sources', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const pdfPkg = JSON.parse(readFileSync(new URL('../node_modules/pdfjs-dist/package.json', import.meta.url), 'utf8'));
  assert.match(pkg.devDependencies['pdfjs-dist'], /^\d+\.\d+\.\d+$/);
  assert.equal(pkg.devDependencies.fflate, '0.8.2');
  const importer = readFileSync(new URL('../storefront/Luna/src/importer.js', import.meta.url), 'utf8');
  assert.ok(importer.includes(`PDFJS_VERSION = '${pdfPkg.version}'`), 'importer pins the installed pdfjs-dist');
  assert.ok(importer.includes('isEvalSupported: false') && importer.includes('useWasm: false'));
  const worker = new URL(`../storefront/public/Luna/vendor/pdfjs-${pdfPkg.version}/pdf.worker.min.mjs`, import.meta.url);
  assert.ok(existsSync(worker), 'worker copied by scripts/vendor.mjs');
  const src = ['app.js', 'editor.js', 'importer.js', 'upload.js', 'remote.js', 'config.js', 'account.js'].map(f => readFileSync(new URL(`../storefront/Luna/src/${f}`, import.meta.url), 'utf8')).join('\n');
  assert.ok(!/cdn\.|unpkg|jsdelivr|service_role|sb_secret_|eyJhbGciOi/i.test(src), 'no CDN, service-role or secret keys');
  assert.ok(!/user_metadata|app_metadata/.test(src), 'roles never come from client-editable metadata');
});

test('owner identity is not committed: setup takes the e-mail at run time', () => {
  const setup = readFileSync(new URL('../supabase/luna-owner-setup.sql', import.meta.url), 'utf8');
  assert.ok(setup.includes(":'owner_email'"));
  for (const f of ['../supabase/luna-owner-setup.sql', '../supabase/luna-publishing.sql', './support/supabase-stub.mjs']) {
    const s = readFileSync(new URL(f, import.meta.url), 'utf8');
    const emails = (s.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+/g) || []).filter(e => !/@example(\.|$)/.test(e));
    assert.deepEqual(emails, [], `${f} must not contain a real e-mail address`);
  }
});
