// Browser end-to-end check of Luna owner publishing against the built site (dist/), served with the production
// CSP and rewrites (scripts/luna/preview.mjs), and the local Supabase stand-in (scripts/luna/mock-supabase.mjs)
// that runs the real migrations in PGlite. Requests to the production Supabase URL are routed to the stand-in,
// so NOTHING here touches the live project. Usage (after `npm run build:web`):
//   node scripts/luna/e2e-publishing.mjs [screenshot-dir]
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createGateway } from './mock-supabase.mjs';
import { grantEditor } from '../../tests/support/supabase-stub.mjs';
// Playwright is the copy preinstalled in the environment (or a local install); it is not a project dependency.
const { chromium, devices } = createRequire(import.meta.url)('playwright');

const SHOTS = resolve(process.argv[2] || 'docs/luna-shots/publishing');
mkdirSync(SHOTS, { recursive: true });
const FX = f => resolve('tests/fixtures/luna', f);
const PORT = 4179, BASE = `http://127.0.0.1:${PORT}`;
const SB = 'https://yxiedrrahclzqukfnqrn.supabase.co';
const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok: !!ok, extra }); console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`); };

const server = spawn(process.execPath, ['scripts/luna/preview.mjs', String(PORT)], { stdio: 'pipe' });
await new Promise(r => server.stdout.once('data', r));
const gw = await createGateway();
const OWNER = { email: 'owner@example.test', password: 'owner-pass-123' };
const MEMBER = { email: 'member@example.test', password: 'member-pass-123' };
await gw.addUser(OWNER.email, OWNER.password);
await gw.addUser(MEMBER.email, MEMBER.password);
await grantEditor(gw.db, OWNER.email);
const sql = async (q, p = []) => (await gw.db.query(q, p)).rows;

const browser = await chromium.launch();
const consoleErrors = [];
async function newPage(opts = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, ...opts });
  await context.route(`${SB}/**`, async route => {
    const req = route.request();
    const r = await gw.handle({ method: req.method(), url: req.url(), headers: req.headers(), body: req.postDataBuffer() });
    await route.fulfill({ status: r.status, headers: r.headers, body: r.body });
  });
  const page = await context.newPage();
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(`${page.url()}: ${m.text()}`); });
  page.on('pageerror', e => consoleErrors.push(`${page.url()}: ${e.message}`));
  return page;
}
const shot = (page, name, opts = {}) => page.screenshot({ path: `${SHOTS}/${name}.png`, ...opts });
async function signIn(page, who) {
  await page.goto(`${BASE}/Luna?bolme=hesab`);
  await page.fill('#f-email', who.email);
  await page.fill('#f-pw', who.password);
  await page.click('#auth-form button[type=submit]');
  await page.waitForSelector('text=Hesabdan çıx');
}
const overflow = page => page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
const metaSaved = page => page.waitForFunction(() => document.getElementById('ed-dirty')?.textContent === '' && document.getElementById('ed-meta-save') && !document.getElementById('ed-meta-save').disabled, null, { timeout: 20000 });
const waitJob = (page, re, timeout = 60000) => page.waitForSelector(`.ed-stage:text-matches("${re}")`, { timeout });

try {
  // ---------- 1. Guests and ordinary members are refused ----------
  const guest = await newPage();
  await guest.goto(`${BASE}/Luna?bolme=redaktor`);
  await guest.waitForSelector('text=Redaktor paneli üçün Luna redaktoru kimi daxil olun');
  check('guest: editor route shows sign-in, no panel', !(await guest.$('.ed-card')));
  const anonList = await guest.evaluate(async sb => (await fetch(`${sb}/rest/v1/rpc/luna_editor_list`, { method: 'POST', headers: { apikey: 'sb_publishable_n0X-RVe8A6z9HviK4qsWAg_FgTTKJq2', 'Content-Type': 'application/json' }, body: '{}' })).status, SB);
  check('guest: editor API refused', anonList === 401 || anonList === 403, `HTTP ${anonList}`);
  await shot(guest, '01-guest-forbidden');

  const member = await newPage();
  await signIn(member, MEMBER);
  await member.goto(`${BASE}/Luna?bolme=redaktor`);
  await member.waitForSelector('text=Hesabınız adi oxucu hesabıdır');
  const memberApi = await member.evaluate(async sb => {
    const tok = JSON.parse(localStorage.getItem('luna.auth')).access_token;
    const h = { apikey: 'sb_publishable_n0X-RVe8A6z9HviK4qsWAg_FgTTKJq2', Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' };
    const save = await fetch(`${sb}/rest/v1/rpc/luna_save_comic`, { method: 'POST', headers: h, body: JSON.stringify({ p_id: crypto.randomUUID(), p: { slug: 'hack-test', title: 'x' } }) });
    const up = await fetch(`${sb}/storage/v1/object/luna-pages/a/b/p001.webp`, { method: 'POST', headers: { ...h, 'Content-Type': 'image/webp' }, body: new Uint8Array(10) });
    return [save.status, up.status];
  }, SB);
  check('member: editor RPC and storage upload refused', memberApi[0] === 403 && memberApi[1] === 403, `HTTP ${memberApi}`);
  check('member: no editor row created', (await sql('select count(*)::int n from public.luna_editors'))[0].n === 1);
  await shot(member, '02-member-forbidden');

  // ---------- 2. Owner: create, reject bad files, import PDF ----------
  const owner = await newPage();
  await signIn(owner, OWNER);
  await owner.waitForSelector('text=Bu hesab Luna redaktorudur');
  await owner.click('a.btn-violet:has-text("Redaktor paneli")');
  await owner.waitForSelector('h1:has-text("Redaktor paneli")');
  await owner.click('button:has-text("Yeni əsər")');
  await owner.waitForSelector('[data-card=import]');
  const comicId = new URL(owner.url()).searchParams.get('id');
  check('owner: new draft record created once', (await sql('select count(*)::int n from public.luna_comics'))[0].n === 1);
  await shot(owner, '03-editor-new', { fullPage: true });

  for (const [file, re] of [['fake-page.png', 'HTML/SVG/XML'], ['comic.cbr', 'RAR/CBR'], ['traversal.zip', 'kənara çıxan'], ['nested.cbz', 'başqa arxiv'], ['encrypted.pdf', 'parolla qorunur'], ['corrupt.pdf', 'pozulub']]) {
    await owner.setInputFiles('#ed-file', FX(file));
    const msg = await owner.waitForSelector('.ed-error', { timeout: 20000 }).then(e => e.textContent());
    check(`rejects ${file}`, new RegExp(re).test(msg), msg.slice(0, 90));
  }
  await shot(owner, '04-editor-rejected');
  // Oversized: a 51 MB PDF-looking file is refused before upload.
  mkdirSync('.cache/luna-e2e', { recursive: true });
  writeFileSync('.cache/luna-e2e/huge.pdf', Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(51 * 1024 * 1024)]));
  await owner.setInputFiles('#ed-file', '.cache/luna-e2e/huge.pdf');
  const big = await owner.waitForSelector('.ed-error').then(e => e.textContent());
  check('rejects oversized source before upload', /limitdən böyükdür/.test(big), big.slice(0, 80));
  check('nothing uploaded for rejected files', (await sql('select count(*)::int n from storage.objects'))[0].n === 0);

  // Decompression bomb passes the directory check but is stopped during extraction; then cleaned up.
  await owner.setInputFiles('#ed-file', FX('bomb-lying.zip'));
  await owner.click('[data-fk=start]');
  await waitJob(owner, 'Uğursuz');
  check('zip bomb stopped while extracting', /zip bomb/.test(await owner.textContent('.ed-error')));
  await owner.click('[data-fk=cancel]');
  await waitJob(owner, 'Ləğv edildi');
  check('failed bomb import cleaned (no objects, revision discarded)', (await sql(`select count(*)::int n from storage.objects`))[0].n === 0 && (await sql(`select status from public.luna_revisions`)).every(r => r.status === 'discarded'));

  // Cancel a running CBZ import.
  await owner.setInputFiles('#ed-file', FX('numbered.cbz'));
  await owner.waitForSelector('[data-fk=start]');
  gw.faults.push({ match: /PATCH \/storage\/v1\/upload\/resumable/, status: 503, times: 0 });
  await owner.click('[data-fk=start]');
  await owner.waitForSelector('[data-fk=cancel]');
  await owner.waitForFunction(() => document.querySelectorAll('.ed-mini li').length >= 2);
  await shot(owner, '05-import-progress');
  await owner.click('[data-fk=cancel]');
  await waitJob(owner, 'Ləğv edildi');
  const afterCancel = await sql(`select count(*)::int n from storage.objects`);
  check('cancel: uploaded parts deleted, nothing ready', afterCancel[0].n === 0 && !(await sql(`select 1 from public.luna_revisions where status = 'ready'`)).length, `${afterCancel[0].n} objects`);

  // PDF import with a simulated outage on page 3 (fails 3 times -> job failed), then retry.
  await owner.setInputFiles('#ed-file', FX('mixed.pdf'));
  await owner.waitForSelector('[data-fk=start]', { timeout: 15000 }).catch(async e => { console.log('DEBUG', await owner.textContent('[data-card=import]')); throw e; });
  check('PDF inspected: 4 pages', /PDF, 4 səhifə/.test(await owner.textContent('.ed-stage')));
  gw.faults.push({ match: /POST \/storage\/v1\/object\/luna-pages\/.*\/p003\.webp/, status: 503, times: 3 });
  await owner.click('[data-fk=start]');
  await waitJob(owner, 'Uğursuz', 90000);
  await shot(owner, '06-import-failed-retry');
  const objsBefore = (await sql(`select count(*)::int n from storage.objects where bucket_id = 'luna-pages'`))[0].n;
  await owner.click('[data-fk=retry]');
  await waitJob(owner, 'Hazırdır', 90000);
  const rev = await sql(`select r.id, r.status, r.page_count, r.source_path from public.luna_revisions r join public.luna_comics c on c.draft_revision = r.id`);
  check('PDF import ready after retry, 4 pages, source stored privately', rev.length === 1 && rev[0].page_count === 4 && rev[0].source_path?.endsWith('source.pdf') && gw.blobs.has(`luna-sources/${rev[0].source_path}`));
  const pagesNow = await sql(`select path, width, height from public.luna_pages where revision_id = $1 order by position`, [rev[0].id]);
  check('retry did not duplicate pages', (await sql(`select count(*)::int n from storage.objects where bucket_id = 'luna-pages'`))[0].n === 6 && objsBefore <= 6, `${pagesNow.length} pages`);
  check('PDF pages rendered at readable size; landscape page kept landscape', pagesNow[0].width === 1600 && pagesNow[2].width > pagesNow[2].height, pagesNow.map(p => `${p.width}x${p.height}`).join(' '));
  const pageType = gw.blobs.get(`luna-pages/${pagesNow[0].path}`).type;
  check('prepared pages are WebP images', pageType === 'image/webp');
  await shot(owner, '07-pdf-ready', { fullPage: true });

  // ---------- 3. Metadata, reorder, cover ----------
  const fill = async (sel, v) => { await owner.fill(sel, ''); await owner.fill(sel, v); };
  await fill('#ed-m-title', 'Gecə qatarı');
  await fill('#ed-m-creator', 'Test Müəllif');
  await fill('#ed-m-synopsis', 'Gecə qatarında itmiş bilet, yuxusuz konduktor və pəncərədən görünən ay haqqında qısa komiks.');
  await fill('#ed-m-genres', 'Macəra, Sirr');
  await fill('#ed-m-rights', '© 2026 Test Müəllif. Bütün hüquqlar qorunur. Luna-da müəllifin icazəsi ilə dərc olunur.');
  await owner.click('[data-fk=cradd]');
  await owner.fill('[data-fk=cr0]', 'Rəsm və ssenari');
  await owner.fill('[data-fk=cn0]', 'Test Müəllif');
  check('slug follows the title for new drafts', (await owner.inputValue('#ed-m-slug')) === 'gece-qatari');
  await owner.click('#ed-meta-save');
  await metaSaved(owner);
  const saved = (await sql(`select slug, title, genres, rights from public.luna_comics where id = $1`, [comicId]))[0];
  check('metadata stored in the database', saved.slug === 'gece-qatari' && saved.genres.join() === 'Macəra,Sirr' && /©/.test(saved.rights));
  // Keyboard reorder: move page 4 one place earlier, choose page 2 as cover, remove nothing.
  const p4 = pagesNow[3].path;
  await owner.focus(`[data-fk="l${p4}"]`);
  await owner.keyboard.press('Enter');
  check('keyboard reorder keeps focus on the moved page control', await owner.evaluate(p => document.activeElement?.dataset.fk === `l${p}`, p4));
  await owner.click(`[data-fk="c${pagesNow[1].path}"]`);
  await shot(owner, '08-reorder-cover', { fullPage: true });
  await owner.click('[data-fk=saveorder]');
  await owner.waitForFunction(() => document.querySelector('[data-fk=saveorder]')?.disabled === true && !document.querySelector('.ed-cover-chip'), null, { timeout: 20000 })
    .catch(async e => { console.log('DEBUG toast:', await owner.textContent('#luna-toast')); throw e; });
  const order = await sql(`select p.path from public.luna_pages p join public.luna_comics c on c.draft_revision = p.revision_id where c.id = $1 order by p.position`, [comicId]);
  check('new order saved as a draft revision', order.map(r => r.path.slice(-9)).join() === ['p001.webp', 'p002.webp', 'p004.webp', 'p003.webp'].join(), order.map(r => r.path.slice(-9)).join());

  // ---------- 4. Draft preview in the real reader, then publish ----------
  await owner.click('[data-fk=preview]');
  await owner.waitForSelector('.rd .rd-book');
  await owner.keyboard.press('ArrowRight');
  await owner.waitForTimeout(900);
  const shown = await owner.$$eval('.rd-slot img', imgs => imgs.map(i => i.complete && i.naturalWidth > 0));
  check('draft preview opens the page-turning reader with real pages (desktop spread)', (await owner.getAttribute('.rd', 'data-mode')) === 'spread' && shown.length === 2 && shown.every(Boolean));
  await shot(owner, '09-draft-preview-spread');
  await owner.keyboard.press('Escape');
  await owner.waitForSelector('[data-card=publish]');
  check('catalogue still empty before publishing', (await gw.handle({ method: 'POST', url: `${SB}/rest/v1/rpc/luna_catalogue`, headers: {}, body: '{}' }).then(r => JSON.parse(r.body))).length === 0);
  await owner.click('[data-fk=publish]');
  await owner.click('#ed-confirm button[value=ok]');
  await owner.waitForSelector('.ed-published');
  check('published state stored', (await sql(`select status from public.luna_comics where id = $1`, [comicId]))[0].status === 'published');
  await shot(owner, '10-published', { fullPage: true });

  // ---------- 5. Another session/device: public catalogue, reader, library, resume ----------
  const phone = await newPage({ ...devices['iPhone 13'] });
  await phone.goto(`${BASE}/Luna`);
  await phone.waitForSelector('#new-h');
  check('phone: published title appears in "Luna-da yeni" and the catalogue', await phone.isVisible('.new-releases >> text=Gecə qatarı') && (await phone.$$('#kataloq .card')).length === 9);
  await phone.$eval('#new-h', el => el.scrollIntoView({ block: 'start' }));
  await phone.waitForTimeout(600);
  await shot(phone, '11-phone-shop-new', { fullPage: false });
  await phone.goto(`${BASE}/Luna?eser=gece-qatari`);
  await phone.waitForSelector('h1:has-text("Gecə qatarı")');
  const detailTxt = await phone.textContent('.detail');
  check('own work shows its rights statement, not the Pepper&Carrot attribution', /Bütün hüquqlar qorunur/.test(detailTxt) && !/peppercarrot|CC BY/i.test(detailTxt));
  await shot(phone, '12-phone-detail', { fullPage: false });
  await phone.click('.detail-actions button:has-text("Kitabxanaya əlavə et")');
  await phone.click('.detail-actions a.btn-white');
  await phone.waitForSelector('.rd');
  check('phone: single-page mode', (await phone.getAttribute('.rd', 'data-mode')) === 'single');
  await phone.click('.rd-next'); await phone.waitForTimeout(700);
  await phone.click('.rd-next'); await phone.waitForTimeout(700);
  // swipe forward
  const box = await phone.$eval('.rd-stage', el => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await phone.touchscreen.tap(box.x, box.y);
  await phone.dispatchEvent('.rd-stage', 'pointerdown', { pointerId: 7, pointerType: 'touch', clientX: box.x + 100, clientY: box.y, isPrimary: true });
  await phone.dispatchEvent('.rd-stage', 'pointerup', { pointerId: 7, pointerType: 'touch', clientX: box.x - 60, clientY: box.y + 4, isPrimary: true });
  await phone.waitForTimeout(800);
  const status = await phone.textContent('.rd-status');
  check('phone: buttons and swipe turn imported pages', /Səhifə 3 \/ 4/.test(status), status);
  const img = await phone.$eval('.rd-right img', i => ({ ok: i.complete && i.naturalWidth > 0, src: i.src.startsWith('https://yxiedrrahclzqukfnqrn.supabase.co/storage/v1/object/sign/') }));
  check('phone: page served through a short-lived signed URL', img.ok && img.src);
  await phone.click('.rd-tool:has-text("Yaxından oxu")');
  await phone.waitForSelector('.rd-zoom:not([hidden]) img');
  await shot(phone, '13-phone-reader-zoom');
  await phone.keyboard.press('Escape');
  await shot(phone, '14-phone-reader');
  await phone.reload();
  await phone.waitForSelector('.rd');
  check('phone: reload resumes at the same page (deep link)', /Səhifə 3 \/ 4/.test(await phone.textContent('.rd-status')));
  await phone.goto(`${BASE}/Luna?bolme=kitabxana`);
  check('phone: library lists the imported title with progress', /Gecə qatarı/.test(await phone.textContent('.library')) && /Səhifə 3-də qalmısınız/.test(await phone.textContent('.library')));

  // ---------- 6. Paid with preview: restricted pages are not reachable ----------
  await owner.click('[data-fk="acc-paid"]');
  await owner.fill('#ed-m-price', '6');
  await owner.fill('#ed-m-preview_pages', '2');
  await owner.click('#ed-meta-save');
  await metaSaved(owner);
  const desk = await newPage();
  await desk.goto(`${BASE}/Luna?eser=gece-qatari`);
  await desk.waitForSelector('.sample-paid');
  check('paid: labelled "Satışda, 6 AZN" with purchase inquiry, not a fake checkout', /Satışda, 6 AZN/.test(await desk.textContent('.detail')) && /Saytda ödəniş qəbul edilmir/.test(await desk.textContent('.sample-paid')));
  await desk.click('.sample-paid button');
  const draft = await desk.textContent('#luna-inquiry .draft');
  check('paid: WhatsApp purchase draft names title and price', /“Gecə qatarı”/.test(draft) && /6 AZN/.test(draft) && /almaq istəyirəm/.test(draft));
  check('paid: WhatsApp link goes to the existing destination', (await desk.getAttribute('#wa-open', 'href')).startsWith('https://wa.me/48571572697?text='));
  await shot(desk, '15-paid-inquiry');
  await desk.click('#luna-inquiry button[value=cancel]');
  await desk.goto(`${BASE}/Luna?oxu=gece-qatari&s=3`);
  await desk.waitForSelector('.rd');
  check('paid: reader ends after the 2 preview pages', /Önizləmə burada bitir/.test(await desk.textContent('.rd')) && (await desk.$$eval('.rd-select option', o => o.length)) === 4);
  await shot(desk, '16-paid-preview-end');
  const probe = await desk.evaluate(async ({ sb, paths }) => {
    const h = { apikey: 'sb_publishable_n0X-RVe8A6z9HviK4qsWAg_FgTTKJq2', 'Content-Type': 'application/json' };
    const sign = await (await fetch(`${sb}/storage/v1/object/sign/luna-pages`, { method: 'POST', headers: h, body: JSON.stringify({ expiresIn: 60, paths }) })).json();
    const pub = (await fetch(`${sb}/storage/v1/object/public/luna-pages/${paths[2]}`)).status;
    const auth = (await fetch(`${sb}/storage/v1/object/authenticated/luna-pages/${paths[2]}`, { headers: h })).status;
    const cat = await (await fetch(`${sb}/rest/v1/rpc/luna_catalogue`, { method: 'POST', headers: h, body: '{}' })).json();
    return { signed: sign.map(s => !!s.signedURL), pub, auth, catPages: cat[0].revision.pages.length };
  }, { sb: SB, paths: [...order.map(r => r.path), rev[0].source_path] });
  check('paid: only preview pages can be signed; guessed paths, public URLs and the source are refused', probe.signed.join() === 'true,true,false,false,false' && probe.pub === 400 && probe.auth === 400 && probe.catPages === 2, JSON.stringify(probe));
  const srcSign = await desk.evaluate(async ({ sb, p }) => (await (await fetch(`${sb}/storage/v1/object/sign/luna-sources`, { method: 'POST', headers: { apikey: 'sb_publishable_n0X-RVe8A6z9HviK4qsWAg_FgTTKJq2', 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 60, paths: [p] }) })).json())[0].signedURL, { sb: SB, p: rev[0].source_path });
  check('original PDF cannot be signed by visitors', srcSign === null);

  // ---------- 7. Raster import on a second title (free), desktop spread with a wide page ----------
  await owner.goto(`${BASE}/Luna?bolme=redaktor`);
  await owner.click('button:has-text("Yeni əsər")');
  await owner.waitForSelector('[data-card=import]');
  await owner.setInputFiles('#ed-file', ['page-10-wide.webp', 'page-02.png', 'page-01.jpg', 'page-03.webp'].map(FX));
  await owner.waitForSelector('[data-fk=start]');
  check('raster set inspected: 4 images', /4 şəkil/.test(await owner.textContent('.ed-stage')));
  await owner.click('[data-fk=start]');
  await waitJob(owner, 'Hazırdır');
  await owner.fill('#ed-m-title', 'Ay işığı');
  await owner.fill('#ed-m-creator', 'Test Müəllif');
  await owner.fill('#ed-m-synopsis', 'Dörd şəkildən ibarət qısa sınaq hekayəsi: ay, dəniz və bir fənər.');
  await owner.fill('#ed-m-genres', 'Fantastika');
  await owner.fill('#ed-m-rights', '© 2026 Test Müəllif. Bütün hüquqlar qorunur.');
  await owner.selectOption('#ed-m-language', 'none');
  await owner.click('#ed-meta-save');
  await metaSaved(owner);
  const id2 = new URL(owner.url()).searchParams.get('id');
  const rasterOrder = await sql(`select p.width, p.height from public.luna_pages p join public.luna_comics c on c.draft_revision = p.revision_id where c.id = $1 order by p.position`, [id2]);
  check('images in natural filename order, sizes kept (wide page last)', rasterOrder.map(r => `${r.width}x${r.height}`).join() === '600x840,600x840,600x840,1000x640', rasterOrder.map(r => `${r.width}x${r.height}`).join());
  await owner.click('[data-fk=publish]');
  await owner.click('#ed-confirm button[value=ok]');
  await owner.waitForSelector('.ed-published');
  await desk.goto(`${BASE}/Luna?oxu=ay-isigi&s=3`);
  await desk.waitForSelector('.rd');
  await desk.waitForTimeout(800);
  check('desktop: imported raster title opens as a spread', (await desk.getAttribute('.rd', 'data-mode')) === 'spread');
  await shot(desk, '17-desktop-raster-spread');

  // ---------- 8. Editor layout at 390 / 320 px ----------
  for (const w of [390, 320]) {
    await owner.setViewportSize({ width: w, height: 844 });
    await owner.goto(`${BASE}/Luna?bolme=redaktor&id=${comicId}`);
    await owner.waitForSelector('[data-card=pages] .ed-page');
    const wide = await owner.evaluate(() => [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(0, 6).map(el => `${el.tagName}.${el.className}:${Math.round(el.getBoundingClientRect().right)}`));
    check(`editor ${w}px: no horizontal overflow`, !(await overflow(owner)), wide.join(' '));
    await shot(owner, `18-editor-${w}`, { fullPage: true });
  }
  await owner.setViewportSize({ width: 1440, height: 900 });

  // ---------- 9. Unpublish (reversible) ----------
  await owner.goto(`${BASE}/Luna?bolme=redaktor&id=${comicId}`);
  await owner.click('[data-fk=unpublish]');
  await owner.click('#ed-confirm button[value=ok]');
  await owner.waitForSelector('.ed-unpublished');
  const fresh = await newPage();
  await fresh.goto(`${BASE}/Luna?eser=gece-qatari`);
  await fresh.waitForSelector('text=Bu əsər tapılmadı');
  const reSign = await fresh.evaluate(async ({ sb, p }) => (await (await fetch(`${sb}/storage/v1/object/sign/luna-pages`, { method: 'POST', headers: { apikey: 'sb_publishable_n0X-RVe8A6z9HviK4qsWAg_FgTTKJq2', 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 60, paths: [p] }) })).json())[0].signedURL, { sb: SB, p: order[0].path });
  check('unpublished: title hidden and its pages no longer signable', reSign === null);
  check('unpublished: records and files kept', (await sql(`select count(*)::int n from public.luna_pages p join public.luna_comics c on c.published_revision = p.revision_id where c.id = $1`, [comicId]))[0].n === 4);
  await shot(fresh, '19-unpublished-not-found');
  await phone.goto(`${BASE}/Luna?bolme=kitabxana`);
  check('library survives unpublish without errors', await phone.isVisible('h1:has-text("Kitabxanam")'));

  // 4xx are the deliberate refusals probed above; 503s are the simulated outage.
  const relevant = consoleErrors.filter(e => !/Failed to load resource: the server responded with a status of (4\d\d|503)/.test(e));
  check('no console errors / CSP violations', relevant.length === 0, relevant.slice(0, 5).join(' | '));
} catch (e) {
  check('e2e run', false, e.stack);
} finally {
  await browser.close();
  server.kill();
  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed (local Supabase stand-in, built site with production CSP)`);
  process.exitCode = failed.length ? 1 : 0;
}
