// Authorization and publication rules of supabase/luna-publishing.sql, executed in real Postgres (PGlite) with
// Supabase's roles, default grants and storage RLS recreated by tests/support/supabase-stub.mjs.
// Storage "uploads" and "signing" are modelled as the INSERT / SELECT on storage.objects that Supabase Storage
// performs with the caller's role, so these are the same policy decisions the real service makes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createDb, as, grantEditor } from './support/supabase-stub.mjs';

const U = {
  owner: '00000000-0000-4000-8000-000000000001', member: '00000000-0000-4000-8000-000000000002',
  guest: '00000000-0000-4000-8000-000000000003', pending: '00000000-0000-4000-8000-000000000004',
};
const claims = {
  owner: { sub: U.owner, is_anonymous: false },
  // An ordinary member who has tried to make themselves an admin through editable metadata.
  member: { sub: U.member, is_anonymous: false, user_metadata: { role: 'admin', luna_editor: true }, app_metadata: { role: 'admin' } },
  guest: { sub: U.guest, is_anonymous: true },
  ownerAsGuest: { sub: U.owner, is_anonymous: true },
  anon: null,
};
const C1 = '10000000-0000-4000-8000-000000000001', R1 = '20000000-0000-4000-8000-000000000001', R2 = '20000000-0000-4000-8000-000000000002';

let db;
const q1 = async (who, sql, params = []) => as(db, claims[who], async tx => (await tx.query(sql, params)).rows);
const call = async (who, fn, args) => {
  const ph = args.map((_, k) => `$${k + 1}`).join(', ');
  const rows = await q1(who, `select public.${fn}(${ph}) as r`, args);
  return rows[0].r;
};
const denied = async (p, re = /editor role required|permission denied/) => assert.rejects(p, e => re.test(e.message), String(re));
const upload = (who, bucket, name) => q1(who, `insert into storage.objects (bucket_id, name, owner_id) values ($1, $2, $3) returning name`, [bucket, name, claims[who]?.sub ?? null]);
const visible = async (who, bucket, name) => (await q1(who, 'select name from storage.objects where bucket_id = $1 and name = $2', [bucket, name])).length === 1;
const pg = (c, r, k, ext = 'webp') => `${c}/${r}/p${String(k).padStart(3, '0')}.${ext}`;
const meta = over => JSON.stringify({ slug: 'gece-qatari', title: 'Gecə qatarı', creator: 'Test Müəllif', synopsis: 'Bir qatar, bir gecə və itmiş bilet haqqında hekayə.', language: 'az', genres: ['Macəra'], credits: [['Rəsm', 'Test Müəllif']], rights: '© 2026 Test Müəllif. Bütün hüquqlar qorunur.', access: 'free', ...over });
const pagesJson = (c, r, n) => JSON.stringify(Array.from({ length: n }, (_, k) => ({ path: pg(c, r, k + 1), width: 1600, height: 2263, bytes: 1000 })));
const coverJson = (c, r) => JSON.stringify({ path: `${c}/${r}/cover-a1.webp`, sm: `${c}/${r}/cover-sm-a1.webp`, width: 1100, height: 1556, tone: '#223344' });

test.before(async () => {
  db = await createDb();
  await db.query(`insert into auth.users (id, email, email_confirmed_at, is_anonymous) values
    ($1, 'owner@example.test', now(), false), ($2, 'member@example.test', now(), false),
    ($3, null, null, true), ($4, 'pending@example.test', null, false)`, [U.owner, U.member, U.guest, U.pending]);
});

test('migration is idempotent and keeps existing Luna library data', async () => {
  await q1('member', `insert into public.luna_library (user_id, comic_slug) values ($1, 'pepper-carrot-01')`, [U.member]);
  await db.exec(readFileSync(new URL('../supabase/luna-publishing.sql', import.meta.url), 'utf8'));
  const rows = await q1('member', 'select comic_slug from public.luna_library');
  assert.deepEqual(rows.map(r => r.comic_slug), ['pepper-carrot-01']);
  const buckets = (await db.query(`select id, public from storage.buckets where id like 'luna-%' order by id`)).rows;
  assert.deepEqual(buckets, [{ id: 'luna-pages', public: false }, { id: 'luna-sources', public: false }]);
});

test('owner provisioning grants exactly the named confirmed account; nobody else becomes an editor', async () => {
  assert.equal(await grantEditor(db, 'nobody@example.test'), 0);
  assert.equal(await grantEditor(db, 'pending@example.test'), 0, 'unconfirmed account is not granted');
  assert.equal(await grantEditor(db, 'OWNER@example.test'), 1);
  assert.equal(await grantEditor(db, 'owner@example.test'), 0, 'idempotent');
  assert.equal((await db.query('select count(*)::int as n from public.luna_editors')).rows[0].n, 1);
  assert.deepEqual(await call('owner', 'luna_editor_me', []), { editor: true });
  for (const who of ['member', 'guest', 'ownerAsGuest', 'anon']) assert.deepEqual(await call(who, 'luna_editor_me', []), { editor: false }, who);
});

test('members, guests and anonymous visitors cannot grant roles, call editor functions or read editor tables', async () => {
  await denied(q1('member', `insert into public.luna_editors (user_id) values ($1)`, [U.member]));
  await denied(q1('member', `update public.luna_editors set user_id = $1`, [U.member]));
  await denied(q1('anon', `insert into public.luna_editors (user_id) values ($1)`, [U.member]));
  for (const who of ['member', 'guest', 'ownerAsGuest']) {
    await denied(call(who, 'luna_save_comic', [C1, meta()]));
    await denied(call(who, 'luna_editor_list', []));
    await denied(call(who, 'luna_publish', [C1]));
  }
  await denied(call('anon', 'luna_save_comic', [C1, meta()]), /permission denied/);
  await denied(q1('member', `insert into public.luna_comics (id, slug) values ($1, 'x-y')`, [C1]));
  await denied(q1('anon', 'select * from public.luna_comics'));
  // Internal helpers are not callable from the API at all (they would reveal draft paths).
  await denied(q1('anon', `select public.luna_revision_json($1, null)`, [R1]), /permission denied/);
  await denied(q1('member', `select public.luna_revision_json($1, null)`, [R1]), /permission denied/);
  await denied(q1('member', `select public.luna_object_exists('luna-pages', 'x')`), /permission denied/);
});

test('import: uploads are accepted only from editors, only into an importing revision and only at page/cover/source paths', async () => {
  const saved = await call('owner', 'luna_save_comic', [C1, meta({ rights: '' })]);
  assert.equal(saved.status, 'draft');
  await call('owner', 'luna_save_comic', [C1, meta({ rights: '' })]); // retry: same row
  assert.equal((await db.query('select count(*)::int as n from public.luna_comics')).rows[0].n, 1);
  const begin = await call('owner', 'luna_begin_revision', [C1, R1, 'pdf', 'komiks.pdf', 1234]);
  assert.equal(begin.source_path, `${C1}/${R1}/source.pdf`);
  assert.deepEqual(await call('owner', 'luna_begin_revision', [C1, R1, 'pdf', 'komiks.pdf', 1234]), begin, 'idempotent begin');
  await denied(upload('member', 'luna-pages', pg(C1, R1, 1)), /row-level security/);
  await denied(upload('anon', 'luna-pages', pg(C1, R1, 1)), /row-level security/);
  await denied(upload('owner', 'luna-pages', `${C1}/${R1}/evil.html`), /row-level security/);
  await denied(upload('owner', 'luna-pages', `${C1}/${R1}/../x/p001.webp`), /row-level security/);
  await denied(upload('owner', 'luna-pages', `${C1}/${R2}/p001.webp`), /row-level security/); // revision does not exist
  await denied(upload('owner', 'avatars', `${C1}/${R1}/p001.webp`), /row-level security/);
  for (let k = 1; k <= 3; k++) await upload('owner', 'luna-pages', pg(C1, R1, k));
  await upload('owner', 'luna-pages', `${C1}/${R1}/cover-a1.webp`);
  await upload('owner', 'luna-pages', `${C1}/${R1}/cover-sm-a1.webp`);
  // page 4 and the source are still missing: finishing must fail and leave nothing ready
  await denied(call('owner', 'luna_finish_revision', [R1, pagesJson(C1, R1, 4), coverJson(C1, R1)]), /page 4 was not uploaded/);
  await upload('owner', 'luna-pages', pg(C1, R1, 4));
  await denied(call('owner', 'luna_finish_revision', [R1, pagesJson(C1, R1, 4), coverJson(C1, R1)]), /source file was not uploaded/);
  await upload('owner', 'luna-sources', `${C1}/${R1}/source.pdf`);
  const done = await call('owner', 'luna_finish_revision', [R1, pagesJson(C1, R1, 4), coverJson(C1, R1)]);
  assert.equal(done.revision.status, 'ready');
  assert.equal(done.revision.page_count, 4);
  assert.equal(done.comic.draft_revision, R1);
  assert.equal(done.comic.tone, '#223344');
  assert.deepEqual(await call('owner', 'luna_finish_revision', [R1, pagesJson(C1, R1, 4), coverJson(C1, R1)]), done, 'retry of finish');
  // A finished revision no longer accepts uploads (cannot be altered behind the reader's back).
  await denied(upload('owner', 'luna-pages', pg(C1, R1, 5)), /row-level security/);
  // Draft: nothing public yet.
  assert.deepEqual(await call('anon', 'luna_catalogue', []), []);
  for (const who of ['anon', 'member']) {
    assert.equal(await visible(who, 'luna-pages', pg(C1, R1, 1)), false, `${who}: draft page`);
    assert.equal(await visible(who, 'luna-pages', `${C1}/${R1}/cover-a1.webp`), false, `${who}: draft cover`);
    assert.equal(await visible(who, 'luna-sources', `${C1}/${R1}/source.pdf`), false, `${who}: source`);
  }
  assert.equal(await visible('owner', 'luna-pages', pg(C1, R1, 1)), true, 'editor previews drafts');
  assert.equal(await visible('owner', 'luna-sources', `${C1}/${R1}/source.pdf`), true);
});

test('publish validates metadata; the public catalogue and storage expose exactly the readable pages', async () => {
  await assert.rejects(call('owner', 'luna_publish', [C1]), /Hüquq bəyanatı/);
  assert.equal((await call('owner', 'luna_editor_get', [C1])).status, 'draft', 'failed publish leaves a draft');
  await call('owner', 'luna_save_comic', [C1, meta()]);
  const pub = await call('owner', 'luna_publish', [C1]);
  assert.equal(pub.status, 'published');
  let cat = await call('anon', 'luna_catalogue', []);
  assert.equal(cat.length, 1);
  assert.equal(cat[0].slug, 'gece-qatari');
  assert.equal(cat[0].access, 'free');
  assert.equal(cat[0].revision.pages.length, 4);
  assert.equal(cat[0].draft_revision, undefined, 'no editor fields in the public catalogue');
  for (const who of ['anon', 'member', 'guest']) {
    for (let k = 1; k <= 4; k++) assert.equal(await visible(who, 'luna-pages', pg(C1, R1, k)), true, `${who} p${k}`);
    assert.equal(await visible(who, 'luna-sources', `${C1}/${R1}/source.pdf`), false, `${who}: original file stays private`);
  }
  // Paid with a 2-page preview: the catalogue and storage only release pages 1–2 (and the cover).
  await call('owner', 'luna_save_comic', [C1, meta({ access: 'paid', price: 7.5, preview_pages: 2 })]);
  cat = await call('anon', 'luna_catalogue', []);
  assert.equal(cat[0].access, 'paid');
  assert.equal(Number(cat[0].price), 7.5);
  assert.deepEqual(cat[0].revision.pages.map(p => p.path), [pg(C1, R1, 1), pg(C1, R1, 2)]);
  assert.equal(cat[0].revision.page_count, 4);
  for (const who of ['anon', 'member']) {
    assert.equal(await visible(who, 'luna-pages', pg(C1, R1, 2)), true);
    assert.equal(await visible(who, 'luna-pages', pg(C1, R1, 3)), false, `${who}: paid page 3 is not signable`);
    assert.equal(await visible(who, 'luna-pages', pg(C1, R1, 4)), false);
    assert.equal(await visible(who, 'luna-pages', `${C1}/${R1}/cover-sm-a1.webp`), true);
  }
  const all = await q1('anon', `select name from storage.objects where bucket_id = 'luna-pages' order by name`);
  assert.deepEqual(all.map(r => r.name.split('/').pop()), ['cover-a1.webp', 'cover-sm-a1.webp', 'p001.webp', 'p002.webp'], 'listing reveals nothing else');
  await call('owner', 'luna_save_comic', [C1, meta({ access: 'paid', price: 7.5, preview_pages: 2, is_sample: true })]);
  assert.equal((await call('anon', 'luna_catalogue', []))[0].access, 'sample');
  // A live title cannot be broken by a metadata edit.
  await assert.rejects(call('owner', 'luna_save_comic', [C1, meta({ access: 'paid', price: null, preview_pages: 2 })]), /Qiymət/);
  await assert.rejects(call('owner', 'luna_save_comic', [C1, meta({ access: 'paid', price: 5, preview_pages: 4 })]), /Önizləmə/);
  await assert.rejects(call('owner', 'luna_save_comic', [C1, meta({ slug: 'basqa-ad', access: 'paid', price: 5, preview_pages: 2 })]), /slug is permanent/);
  await call('owner', 'luna_save_comic', [C1, meta({ access: 'paid', price: 7.5, preview_pages: 2 })]);
});

test('published objects are immutable; replacing content keeps the live version until the new one is published', async () => {
  // Overwrite or delete a published page: refused (update has no matching row, delete affects nothing).
  await denied(q1('owner', `insert into storage.objects (bucket_id, name) values ('luna-pages', $1)`, [pg(C1, R1, 1)]), /row-level security|duplicate/);
  assert.equal((await q1('owner', `update storage.objects set metadata = '{}' where bucket_id = 'luna-pages' and name = $1 returning name`, [pg(C1, R1, 1)])).length, 0);
  assert.equal((await q1('owner', `delete from storage.objects where bucket_id = 'luna-pages' and name = $1 returning name`, [pg(C1, R1, 1)])).length, 0);
  assert.equal(await visible('anon', 'luna-pages', pg(C1, R1, 1)), true);
  // New import of 3 images.
  await call('owner', 'luna_begin_revision', [C1, R2, 'images', '3 şəkil', 0]);
  for (let k = 1; k <= 3; k++) await upload('owner', 'luna-pages', pg(C1, R2, k));
  await upload('owner', 'luna-pages', `${C1}/${R2}/cover-a1.webp`);
  await upload('owner', 'luna-pages', `${C1}/${R2}/cover-sm-a1.webp`);
  const done = await call('owner', 'luna_finish_revision', [R2, pagesJson(C1, R2, 3), coverJson(C1, R2)]);
  assert.equal(done.comic.draft_revision, R2);
  assert.equal(done.comic.published_revision, R1);
  let cat = await call('anon', 'luna_catalogue', []);
  assert.deepEqual(cat[0].revision.pages.map(p => p.path), [pg(C1, R1, 1), pg(C1, R1, 2)], 'old version still live');
  assert.equal(await visible('anon', 'luna-pages', pg(C1, R2, 1)), false, 'new draft not public');
  await call('owner', 'luna_publish', [C1]);
  cat = await call('anon', 'luna_catalogue', []);
  assert.deepEqual(cat[0].revision.pages.map(p => p.path), [pg(C1, R2, 1), pg(C1, R2, 2)]);
  assert.equal(await visible('anon', 'luna-pages', pg(C1, R1, 1)), false, 'superseded pages are private again');
  // Reorder/remove (an "edit" revision reusing stored pages): order 3,1 and keep the cover.
  const R3 = '20000000-0000-4000-8000-000000000003';
  await call('owner', 'luna_begin_revision', [C1, R3, 'edit', 'Səhifə redaktəsi', 0]);
  const order = JSON.stringify([3, 1].map(k => ({ path: pg(C1, R2, k), width: 1600, height: 2263, bytes: 1 })));
  await call('owner', 'luna_finish_revision', [R3, order, coverJson(C1, R2)]);
  const ed = await call('owner', 'luna_editor_get', [C1]);
  assert.deepEqual(ed.draft.pages.map(p => p.path), [pg(C1, R2, 3), pg(C1, R2, 1)]);
  // Pages from another comic cannot be borrowed.
  const C2 = '10000000-0000-4000-8000-000000000002', R4 = '20000000-0000-4000-8000-000000000004';
  await call('owner', 'luna_save_comic', [C2, meta({ slug: 'ikinci' })]);
  await call('owner', 'luna_begin_revision', [C2, R4, 'edit', 'x', 0]);
  await assert.rejects(call('owner', 'luna_finish_revision', [R4, order, coverJson(C1, R2)]), /not part of this comic/);
});

test('cleanup returns only unreferenced files; live and draft versions cannot be discarded', async () => {
  await assert.rejects(call('owner', 'luna_discard_revision', [R2]), /in use|revision is in use/);
  const left = await call('owner', 'luna_discard_revision', [R1]);
  assert.deepEqual(left.sources, [`${C1}/${R1}/source.pdf`]);
  assert.deepEqual(left.pages.map(p => p.split('/').pop()), ['cover-a1.webp', 'cover-sm-a1.webp', 'p001.webp', 'p002.webp', 'p003.webp', 'p004.webp']);
  // Those objects are no longer locked, so the editor's delete succeeds; R2 (live, reused by the draft) stays locked.
  assert.equal((await q1('owner', `delete from storage.objects where bucket_id = 'luna-pages' and name = $1 returning name`, [pg(C1, R1, 1)])).length, 1);
  assert.equal((await q1('owner', `delete from storage.objects where bucket_id = 'luna-pages' and name = $1 returning name`, [pg(C1, R2, 1)])).length, 0);
  assert.equal((await q1('member', `delete from storage.objects where bucket_id = 'luna-pages' and name = $1 returning name`, [pg(C1, R1, 2)])).length, 0, 'members delete nothing');
  // A failed import is recorded as failed, never published.
  const R5 = '20000000-0000-4000-8000-000000000005';
  await call('owner', 'luna_begin_revision', [C1, R5, 'zip', 'x.cbz', 10]);
  await upload('owner', 'luna-pages', pg(C1, R5, 1));
  await call('owner', 'luna_fail_revision', [R5, 'İdxal ləğv edildi']);
  await denied(upload('owner', 'luna-pages', pg(C1, R5, 2)), /row-level security/);
  await call('owner', 'luna_begin_revision', [C1, R5, 'zip', 'x.cbz', 10]); // retry reopens the same revision
  await upload('owner', 'luna-pages', pg(C1, R5, 2));
  await call('owner', 'luna_fail_revision', [R5, 'x']);
  assert.deepEqual((await call('owner', 'luna_discard_revision', [R5])).pages, [pg(C1, R5, 1), pg(C1, R5, 2)]);
  await assert.rejects(call('owner', 'luna_begin_revision', [C1, R5, 'zip', 'x.cbz', 10]), /already finished/);
});

test('unpublish is reversible and hides the title and its pages; slugs are validated', async () => {
  await call('owner', 'luna_unpublish', [C1]);
  assert.deepEqual(await call('anon', 'luna_catalogue', []), []);
  assert.equal(await visible('anon', 'luna-pages', pg(C1, R2, 1)), false);
  assert.equal((await call('owner', 'luna_editor_get', [C1])).status, 'unpublished');
  // The draft (2 pages) cannot be published with a 2-page preview of a paid title: the server refuses it.
  await assert.rejects(call('owner', 'luna_publish', [C1]), /Önizləmə/);
  await call('owner', 'luna_save_comic', [C1, meta({ access: 'paid', price: 7.5, preview_pages: 1 })]);
  await call('owner', 'luna_publish', [C1]);
  const cat = await call('anon', 'luna_catalogue', []);
  assert.equal(cat.length, 1);
  assert.deepEqual(cat[0].revision.pages.map(p => p.path), [pg(C1, R2, 3)], 'republish uses the latest ready draft (1-page preview)');
  assert.equal(cat[0].revision.page_count, 2);
  const C3 = '10000000-0000-4000-8000-000000000003';
  await assert.rejects(call('owner', 'luna_save_comic', [C3, meta({ slug: 'pepper-carrot-01' })]), /check constraint/);
  await assert.rejects(call('owner', 'luna_save_comic', [C3, meta({ slug: 'gece-qatari' })]), /duplicate key|unique/);
  await assert.rejects(call('owner', 'luna_save_comic', [C3, meta({ slug: '../x' })]), /check constraint/);
  // Members can keep uploaded titles in their synced library like any other slug.
  await q1('member', `insert into public.luna_library (user_id, comic_slug) values ($1, 'gece-qatari')`, [U.member]);
  await q1('member', `insert into public.luna_progress (user_id, comic_slug, leaf, leaf_count) values ($1, 'gece-qatari', 2, 4)`, [U.member]);
  assert.equal((await q1('owner', 'select * from public.luna_library')).length, 0, 'library rows stay private to their owner');
});

test('revoking the editor row removes access on the next request', async () => {
  await db.query('delete from public.luna_editors where user_id = $1', [U.owner]);
  await denied(call('owner', 'luna_editor_list', []));
  assert.equal(await visible('owner', 'luna-sources', `${C1}/${R2}/source.pdf`), false);
  await grantEditor(db, 'owner@example.test');
});
