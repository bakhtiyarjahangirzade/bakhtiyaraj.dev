-- Luna Comics owner publishing (bakhtiyaraj.dev/Luna): editor role, comic records, page revisions and
-- private storage. Run once in the shared bakhy-dev Supabase project (SQL editor, as the postgres role),
-- AFTER supabase/luna.sql. Safe to re-run: every statement is idempotent.
--
-- Not touched: auth settings and users, the shared handle_new_user trigger, luna_library / luna_progress
-- rows and policies, and every other app's tables, buckets and policies. Nothing here deletes data.
--
-- Security model (details in docs/luna-publishing-implementation.md):
--  * Editors are rows in public.luna_editors. Only the postgres/service role can write that table
--    (no grants to anon/authenticated). Being signed in, a first sign-up, a client-side user_metadata
--    claim or an anonymous guest session never makes anyone an editor.
--  * Every mutation is a SECURITY DEFINER function that checks public.luna_is_editor() first. Tables have
--    RLS enabled and only an editor SELECT policy; anon/authenticated have no INSERT/UPDATE/DELETE grants.
--  * Both buckets are private. Visitors (anon or members) can only sign URLs for objects that belong to the
--    currently published revision of a published title AND are either the cover or a page the title's
--    access rule makes public (all pages for free titles, the first preview_pages for paid/sample titles).
--    Original PDFs/archives (luna-sources), drafts, failed imports and paid non-preview pages are editor-only.
--  * Objects referenced by a published revision cannot be overwritten or deleted, and uploads are only
--    accepted into a revision that is still being imported, so replacing content never breaks the live title.


-- ---------------------------------------------------------------- editors
create table if not exists public.luna_editors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'editor')),
  note text check (char_length(note) <= 200),
  granted_at timestamptz not null default now()
);
alter table public.luna_editors enable row level security;
revoke all on public.luna_editors from public, anon, authenticated;

create or replace function public.luna_is_editor() returns boolean
language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null
     and coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
     and exists (select 1 from public.luna_editors e where e.user_id = (select auth.uid()));
$$;
revoke all on function public.luna_is_editor() from public;
grant execute on function public.luna_is_editor() to anon, authenticated;

create or replace function public.luna_require_editor() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.luna_is_editor() then
    raise exception 'luna: editor role required' using errcode = '42501';
  end if;
end $$;
revoke all on function public.luna_require_editor() from public, anon, authenticated;

-- ---------------------------------------------------------------- comics, revisions, pages
create table if not exists public.luna_comics (
  id uuid primary key,
  slug text not null unique
    check (char_length(slug) between 2 and 64 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and slug !~ '^pepper-carrot-'),
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),
  title text not null default '' check (char_length(title) <= 160),
  title_note text check (char_length(title_note) <= 160),
  series text check (char_length(series) <= 120),
  episode integer check (episode between 0 and 9999),
  creator text not null default '' check (char_length(creator) <= 160),
  synopsis text not null default '' check (char_length(synopsis) <= 2000),
  language text not null default 'az' check (language in ('az', 'en', 'ru', 'tr', 'none')),
  language_note text check (char_length(language_note) <= 200),
  genres text[] not null default '{}' check (cardinality(genres) <= 6),
  credits jsonb not null default '[]'::jsonb check (jsonb_typeof(credits) = 'array' and jsonb_array_length(credits) <= 20),
  rights text not null default '' check (char_length(rights) <= 1000),
  year integer check (year between 1900 and 2100),
  access text not null default 'free' check (access in ('free', 'paid')),
  is_sample boolean not null default false,
  price numeric(8, 2) check (price is null or (price > 0 and price <= 10000)),
  preview_pages integer check (preview_pages is null or preview_pages between 1 and 300),
  tone text check (tone ~ '^#[0-9a-f]{6}$'),
  draft_revision uuid,
  published_revision uuid,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  first_published_at timestamptz,
  published_at timestamptz,
  unpublished_at timestamptz
);

create table if not exists public.luna_revisions (
  id uuid primary key,
  comic_id uuid not null references public.luna_comics(id) on delete cascade,
  status text not null default 'uploading' check (status in ('uploading', 'ready', 'failed', 'superseded', 'discarded')),
  source_kind text not null check (source_kind in ('pdf', 'zip', 'images', 'edit')),
  source_name text check (char_length(source_name) <= 255),
  source_bytes bigint check (source_bytes between 0 and 52428800),
  source_path text,
  base_revision uuid references public.luna_revisions(id),
  page_count integer check (page_count between 1 and 300),
  cover_path text,
  cover_sm_path text,
  cover_width integer check (cover_width between 1 and 10000),
  cover_height integer check (cover_height between 1 and 10000),
  error text check (char_length(error) <= 500),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  ready_at timestamptz
);
create index if not exists luna_revisions_comic on public.luna_revisions(comic_id);

create table if not exists public.luna_pages (
  revision_id uuid not null references public.luna_revisions(id) on delete cascade,
  position integer not null check (position between 1 and 300),
  path text not null check (path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/p[0-9]{3}\.(webp|jpg|png)$'),
  width integer not null check (width between 1 and 10000),
  height integer not null check (height between 1 and 10000),
  bytes integer check (bytes between 1 and 15728640),
  primary key (revision_id, position)
);
create index if not exists luna_pages_path on public.luna_pages(path);

do $$ begin
  alter table public.luna_comics add constraint luna_comics_draft_fk foreign key (draft_revision) references public.luna_revisions(id);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.luna_comics add constraint luna_comics_published_fk foreign key (published_revision) references public.luna_revisions(id);
exception when duplicate_object then null; end $$;

alter table public.luna_comics enable row level security;
alter table public.luna_revisions enable row level security;
alter table public.luna_pages enable row level security;
revoke all on public.luna_comics, public.luna_revisions, public.luna_pages from public, anon, authenticated;
grant select on public.luna_comics, public.luna_revisions, public.luna_pages to authenticated;

drop policy if exists luna_comics_editor_read on public.luna_comics;
create policy luna_comics_editor_read on public.luna_comics for select to authenticated using ((select public.luna_is_editor()));
drop policy if exists luna_revisions_editor_read on public.luna_revisions;
create policy luna_revisions_editor_read on public.luna_revisions for select to authenticated using ((select public.luna_is_editor()));
drop policy if exists luna_pages_editor_read on public.luna_pages;
create policy luna_pages_editor_read on public.luna_pages for select to authenticated using ((select public.luna_is_editor()));

-- ---------------------------------------------------------------- object access helpers
-- True when the object is the cover or a public page of a currently published title.
create or replace function public.luna_object_public(p_bucket text, p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_bucket = 'luna-pages' and (
    exists (
      select 1 from public.luna_comics c
      join public.luna_pages p on p.revision_id = c.published_revision
      where c.status = 'published' and p.path = p_name
        and (c.access = 'free' or p.position <= coalesce(c.preview_pages, 0)))
    or exists (
      select 1 from public.luna_comics c
      join public.luna_revisions r on r.id = c.published_revision
      where c.status = 'published' and p_name in (r.cover_path, r.cover_sm_path)));
$$;
revoke all on function public.luna_object_public(text, text) from public;
grant execute on function public.luna_object_public(text, text) to anon, authenticated;

-- True when any published (or previously published, i.e. unpublished) revision references the object.
create or replace function public.luna_object_locked(p_bucket text, p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
      select 1 from public.luna_comics c join public.luna_pages p on p.revision_id = c.published_revision
      where p.path = p_name and p_bucket = 'luna-pages')
    or exists (
      select 1 from public.luna_comics c join public.luna_revisions r on r.id = c.published_revision
      where p_bucket = 'luna-pages' and p_name in (r.cover_path, r.cover_sm_path))
    or exists (
      select 1 from public.luna_comics c join public.luna_revisions r on r.id = c.published_revision
      where p_bucket = 'luna-sources' and r.source_path = p_name);
$$;
revoke all on function public.luna_object_locked(text, text) from public, anon;
grant execute on function public.luna_object_locked(text, text) to authenticated;

-- Uploads are only accepted at the exact paths of a revision that is still importing.
create or replace function public.luna_upload_allowed(p_bucket text, p_name text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare parts text[]; rev public.luna_revisions;
begin
  if not public.luna_is_editor() then return false; end if;
  parts := string_to_array(p_name, '/');
  if array_length(parts, 1) <> 3 or parts[1] !~ '^[0-9a-f-]{36}$' or parts[2] !~ '^[0-9a-f-]{36}$' then return false; end if;
  if p_bucket = 'luna-sources' then
    if parts[3] !~ '^source\.(pdf|zip|cbz)$' then return false; end if;
  elsif p_bucket = 'luna-pages' then
    if parts[3] !~ '^(p[0-9]{3}\.(webp|jpg|png)|cover(-sm)?-[a-z0-9]{1,16}\.(webp|jpg|png))$' then return false; end if;
  else return false; end if;
  select * into rev from public.luna_revisions where id = parts[2]::uuid;
  return found and rev.comic_id = parts[1]::uuid and rev.status = 'uploading'
     and not public.luna_object_locked(p_bucket, p_name);
end $$;
revoke all on function public.luna_upload_allowed(text, text) from public, anon;
grant execute on function public.luna_upload_allowed(text, text) to authenticated;

-- ---------------------------------------------------------------- storage buckets and policies
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('luna-sources', 'luna-sources', false, 52428800, array['application/pdf', 'application/zip', 'application/vnd.comicbook+zip']),
  ('luna-pages', 'luna-pages', false, 15728640, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists luna_public_read on storage.objects;
create policy luna_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'luna-pages' and public.luna_object_public(bucket_id, name));
drop policy if exists luna_editor_read on storage.objects;
create policy luna_editor_read on storage.objects for select to authenticated
  using (bucket_id in ('luna-pages', 'luna-sources') and (select public.luna_is_editor()));
drop policy if exists luna_editor_insert on storage.objects;
create policy luna_editor_insert on storage.objects for insert to authenticated
  with check (bucket_id in ('luna-pages', 'luna-sources') and public.luna_upload_allowed(bucket_id, name));
drop policy if exists luna_editor_update on storage.objects;
create policy luna_editor_update on storage.objects for update to authenticated
  using (bucket_id in ('luna-pages', 'luna-sources') and public.luna_upload_allowed(bucket_id, name))
  with check (bucket_id in ('luna-pages', 'luna-sources') and public.luna_upload_allowed(bucket_id, name));
drop policy if exists luna_editor_delete on storage.objects;
create policy luna_editor_delete on storage.objects for delete to authenticated
  using (bucket_id in ('luna-pages', 'luna-sources') and (select public.luna_is_editor()) and not public.luna_object_locked(bucket_id, name));

-- ---------------------------------------------------------------- JSON views
create or replace function public.luna_comic_json(c public.luna_comics) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', c.id, 'slug', c.slug, 'status', c.status, 'title', c.title, 'title_note', c.title_note,
    'series', c.series, 'episode', c.episode, 'creator', c.creator, 'synopsis', c.synopsis,
    'language', c.language, 'language_note', c.language_note, 'genres', to_jsonb(c.genres), 'credits', c.credits,
    'rights', c.rights, 'year', c.year, 'access', c.access, 'is_sample', c.is_sample, 'price', c.price,
    'preview_pages', c.preview_pages, 'tone', c.tone, 'draft_revision', c.draft_revision,
    'published_revision', c.published_revision, 'created_at', c.created_at, 'updated_at', c.updated_at,
    'first_published_at', c.first_published_at, 'published_at', c.published_at, 'unpublished_at', c.unpublished_at);
$$;
revoke all on function public.luna_comic_json(public.luna_comics) from public, anon, authenticated;

create or replace function public.luna_revision_json(p_id uuid, p_limit integer default null) returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when r.id is null then null else jsonb_build_object(
    'id', r.id, 'status', r.status, 'source_kind', r.source_kind, 'source_name', r.source_name,
    'source_bytes', r.source_bytes, 'page_count', r.page_count, 'error', r.error, 'created_at', r.created_at, 'ready_at', r.ready_at,
    'cover', case when r.cover_path is null then null else jsonb_build_object('path', r.cover_path, 'sm', r.cover_sm_path, 'width', r.cover_width, 'height', r.cover_height) end,
    'pages', coalesce((select jsonb_agg(jsonb_build_object('path', p.path, 'width', p.width, 'height', p.height, 'bytes', p.bytes) order by p.position)
                       from public.luna_pages p where p.revision_id = r.id and (p_limit is null or p.position <= p_limit)), '[]'::jsonb)) end
  from (select 1) one left join public.luna_revisions r on r.id = p_id;
$$;
revoke all on function public.luna_revision_json(uuid, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------- publishing checks
-- Errors that block publishing (Azerbaijani, shown in the panel). Empty array = publishable.
create or replace function public.luna_publish_problems(c public.luna_comics, p_revision uuid) returns text[]
language plpgsql stable security definer set search_path = '' as $$
declare errs text[] := '{}'; rev public.luna_revisions;
begin
  select * into rev from public.luna_revisions where id = p_revision;
  if not found or rev.status not in ('ready', 'superseded') or rev.comic_id <> c.id then errs := array_append(errs, 'Hazır səhifə versiyası yoxdur: əvvəlcə faylı idxal edin.'); end if;
  if char_length(btrim(c.title)) < 1 then errs := array_append(errs, 'Ad boşdur.'); end if;
  if char_length(btrim(c.creator)) < 1 then errs := array_append(errs, 'Müəllif boşdur.'); end if;
  if char_length(btrim(c.synopsis)) < 20 then errs := array_append(errs, 'Qısa təsvir ən azı 20 simvol olmalıdır.'); end if;
  if char_length(btrim(c.rights)) < 10 then errs := array_append(errs, 'Hüquq bəyanatı yazılmayıb.'); end if;
  if cardinality(c.genres) < 1 then errs := array_append(errs, 'Ən azı bir janr seçin.'); end if;
  if rev.cover_path is null then errs := array_append(errs, 'Üz qabığı seçilməyib.'); end if;
  if c.access = 'free' and (c.price is not null or c.is_sample) then errs := array_append(errs, 'Pulsuz əsərin qiyməti olmur.'); end if;
  if c.access = 'paid' then
    if c.price is null then errs := array_append(errs, 'Qiymət (AZN) yazılmayıb.'); end if;
    if c.preview_pages is null or c.preview_pages < 1 or c.preview_pages >= coalesce(rev.page_count, 0) then
      errs := array_append(errs, 'Önizləmə səhifələrinin sayı 1 ilə ümumi səhifə sayından bir az arasında olmalıdır.'); end if;
  end if;
  return errs;
end $$;
revoke all on function public.luna_publish_problems(public.luna_comics, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------- editor RPCs
create or replace function public.luna_editor_me() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('editor', public.luna_is_editor());
$$;
revoke all on function public.luna_editor_me() from public;
grant execute on function public.luna_editor_me() to anon, authenticated;

create or replace function public.luna_editor_list() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.luna_require_editor();
  return coalesce((select jsonb_agg(public.luna_comic_json(c) || jsonb_build_object(
      'cover', (select case when r.cover_sm_path is null then null else jsonb_build_object('path', r.cover_sm_path, 'width', r.cover_width, 'height', r.cover_height) end
                from public.luna_revisions r where r.id = coalesce(c.draft_revision, c.published_revision)),
      'page_count', (select r.page_count from public.luna_revisions r where r.id = coalesce(c.draft_revision, c.published_revision)))
    order by c.updated_at desc) from public.luna_comics c), '[]'::jsonb);
end $$;

create or replace function public.luna_editor_get(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare c public.luna_comics;
begin
  perform public.luna_require_editor();
  select * into c from public.luna_comics where id = p_id;
  if not found then return null; end if;
  return public.luna_comic_json(c) || jsonb_build_object(
    'draft', public.luna_revision_json(c.draft_revision),
    'published', public.luna_revision_json(c.published_revision),
    'problems', to_jsonb(public.luna_publish_problems(c, c.draft_revision)),
    'revisions', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'status', r.status, 'source_kind', r.source_kind, 'source_name', r.source_name,
        'page_count', r.page_count, 'error', r.error, 'created_at', r.created_at) order by r.created_at desc)
      from public.luna_revisions r where r.comic_id = c.id), '[]'::jsonb));
end $$;

-- Create or update metadata. The id is generated by the client once, so retries never duplicate a comic.
create or replace function public.luna_save_comic(p_id uuid, p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c public.luna_comics; probs text[];
begin
  perform public.luna_require_editor();
  if jsonb_typeof(p) <> 'object' then raise exception 'luna: metadata must be an object' using errcode = '22023'; end if;
  select * into c from public.luna_comics where id = p_id for update;
  if found and c.first_published_at is not null and p ? 'slug' and p ->> 'slug' <> c.slug then
    raise exception 'luna: slug is permanent after the first publication' using errcode = '22023';
  end if;
  insert into public.luna_comics as t (id, slug, title, title_note, series, episode, creator, synopsis, language, language_note,
      genres, credits, rights, year, access, is_sample, price, preview_pages, tone)
  values (p_id, p ->> 'slug', coalesce(p ->> 'title', ''), nullif(p ->> 'title_note', ''), nullif(p ->> 'series', ''),
      (p ->> 'episode')::integer, coalesce(p ->> 'creator', ''), coalesce(p ->> 'synopsis', ''), coalesce(p ->> 'language', 'az'),
      nullif(p ->> 'language_note', ''), coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p -> 'genres', '[]'::jsonb)) x), '{}'),
      coalesce(p -> 'credits', '[]'::jsonb), coalesce(p ->> 'rights', ''), (p ->> 'year')::integer, coalesce(p ->> 'access', 'free'),
      coalesce((p ->> 'is_sample')::boolean, false), (p ->> 'price')::numeric, (p ->> 'preview_pages')::integer, nullif(p ->> 'tone', ''))
  on conflict (id) do update set
    slug = excluded.slug, title = excluded.title, title_note = excluded.title_note, series = excluded.series, episode = excluded.episode,
    creator = excluded.creator, synopsis = excluded.synopsis, language = excluded.language, language_note = excluded.language_note,
    genres = excluded.genres, credits = excluded.credits, rights = excluded.rights, year = excluded.year, access = excluded.access,
    is_sample = excluded.is_sample, price = excluded.price, preview_pages = excluded.preview_pages,
    tone = coalesce(excluded.tone, t.tone), updated_at = now()
  returning * into c;
  if c.access = 'free' then update public.luna_comics set price = null, is_sample = false, preview_pages = null where id = c.id returning * into c; end if;
  -- A live title must stay valid: metadata edits that would break it are refused, not half-applied.
  if c.status = 'published' then
    probs := public.luna_publish_problems(c, c.published_revision);
    if cardinality(probs) > 0 then raise exception 'luna: % ', array_to_string(probs, ' ') using errcode = '22023'; end if;
  end if;
  return public.luna_comic_json(c);
end $$;

-- Start (or restart after a failure) an import. Idempotent for the same revision id.
create or replace function public.luna_begin_revision(p_comic uuid, p_revision uuid, p_kind text, p_name text, p_bytes bigint) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare rev public.luna_revisions; ext text;
begin
  perform public.luna_require_editor();
  if not exists (select 1 from public.luna_comics where id = p_comic) then raise exception 'luna: unknown comic' using errcode = '22023'; end if;
  ext := case p_kind when 'pdf' then 'pdf' when 'zip' then 'zip' else null end;
  insert into public.luna_revisions (id, comic_id, source_kind, source_name, source_bytes, source_path)
  values (p_revision, p_comic, p_kind, left(p_name, 255), p_bytes, case when ext is null then null else p_comic || '/' || p_revision || '/source.' || ext end)
  on conflict (id) do nothing;
  select * into rev from public.luna_revisions where id = p_revision for update;
  if rev.comic_id <> p_comic then raise exception 'luna: revision belongs to another comic' using errcode = '22023'; end if;
  if rev.status in ('ready', 'superseded', 'discarded') then raise exception 'luna: revision already finished' using errcode = '22023'; end if;
  update public.luna_revisions set status = 'uploading', error = null where id = p_revision returning * into rev;
  return jsonb_build_object('id', rev.id, 'source_path', rev.source_path);
end $$;

create or replace function public.luna_object_exists(p_bucket text, p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from storage.objects o where o.bucket_id = p_bucket and o.name = p_name);
$$;
revoke all on function public.luna_object_exists(text, text) from public, anon, authenticated;

-- Finish an import: every page and cover must already exist in storage (verified here, not trusted from the client).
-- p_pages: [{path, width, height, bytes}] in reading order (paths of this revision or of its base revision).
-- p_cover: {path, sm, width, height}.
create or replace function public.luna_finish_revision(p_revision uuid, p_pages jsonb, p_cover jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare rev public.luna_revisions; c public.luna_comics; n integer; pg jsonb; k integer := 0; prefix text; base_prefix text;
begin
  perform public.luna_require_editor();
  select * into rev from public.luna_revisions where id = p_revision for update;
  if not found then raise exception 'luna: unknown revision' using errcode = '22023'; end if;
  select * into c from public.luna_comics where id = rev.comic_id for update;
  if rev.status = 'ready' and c.draft_revision = rev.id then
    return jsonb_build_object('comic', public.luna_comic_json(c), 'revision', public.luna_revision_json(rev.id)); -- retry of a finished call
  end if;
  if rev.status <> 'uploading' then raise exception 'luna: revision is not importing' using errcode = '22023'; end if;
  n := jsonb_array_length(coalesce(p_pages, '[]'::jsonb));
  if n < 1 or n > 300 then raise exception 'luna: a comic needs 1 to 300 pages' using errcode = '22023'; end if;
  prefix := rev.comic_id || '/' || rev.id || '/';
  delete from public.luna_pages where revision_id = rev.id;
  for pg in select * from jsonb_array_elements(p_pages) loop
    k := k + 1;
    if not (pg ->> 'path' like prefix || '%' or exists (
        select 1 from public.luna_pages bp join public.luna_revisions br on br.id = bp.revision_id
        where bp.path = pg ->> 'path' and br.comic_id = rev.comic_id and br.status <> 'discarded')) then
      raise exception 'luna: page % is not part of this comic', k using errcode = '22023';
    end if;
    if not public.luna_object_exists('luna-pages', pg ->> 'path') then
      raise exception 'luna: page % was not uploaded', k using errcode = 'P0002';
    end if;
    insert into public.luna_pages (revision_id, position, path, width, height, bytes)
    values (rev.id, k, pg ->> 'path', (pg ->> 'width')::integer, (pg ->> 'height')::integer, (pg ->> 'bytes')::integer);
  end loop;
  if p_cover is null or p_cover ->> 'path' is null then raise exception 'luna: cover missing' using errcode = '22023'; end if;
  base_prefix := rev.comic_id || '/';
  if not (p_cover ->> 'path' like base_prefix || '%' and p_cover ->> 'sm' like base_prefix || '%')
     or not public.luna_object_exists('luna-pages', p_cover ->> 'path') or not public.luna_object_exists('luna-pages', p_cover ->> 'sm') then
    raise exception 'luna: cover was not uploaded' using errcode = 'P0002';
  end if;
  if rev.source_path is not null and not public.luna_object_exists('luna-sources', rev.source_path) then
    raise exception 'luna: source file was not uploaded' using errcode = 'P0002';
  end if;
  update public.luna_revisions set status = 'ready', page_count = n, ready_at = now(), error = null,
    cover_path = p_cover ->> 'path', cover_sm_path = p_cover ->> 'sm',
    cover_width = (p_cover ->> 'width')::integer, cover_height = (p_cover ->> 'height')::integer
  where id = rev.id;
  update public.luna_revisions set status = 'superseded'
    where id = c.draft_revision and id is distinct from c.published_revision and status = 'ready';
  update public.luna_comics set draft_revision = rev.id, tone = coalesce(nullif(p_cover ->> 'tone', ''), tone), updated_at = now()
    where id = c.id returning * into c;
  return jsonb_build_object('comic', public.luna_comic_json(c), 'revision', public.luna_revision_json(rev.id));
end $$;

create or replace function public.luna_fail_revision(p_revision uuid, p_error text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.luna_require_editor();
  update public.luna_revisions set status = 'failed', error = left(coalesce(p_error, 'naməlum xəta'), 500)
  where id = p_revision and status = 'uploading';
end $$;

-- Remove a failed/superseded/unfinished revision record and return the storage paths that are now safe to delete
-- (not referenced by any other revision). The client deletes those objects; storage policies refuse
-- deleting anything a published revision still uses.
create or replace function public.luna_discard_revision(p_revision uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare rev public.luna_revisions; c public.luna_comics; paths jsonb;
begin
  perform public.luna_require_editor();
  select * into rev from public.luna_revisions where id = p_revision for update;
  if not found then return '{"pages":[],"sources":[]}'::jsonb; end if;
  select * into c from public.luna_comics where id = rev.comic_id;
  if rev.id in (c.draft_revision, c.published_revision) then raise exception 'luna: revision is in use' using errcode = '22023'; end if;
  -- Candidates: objects stored under this revision's folder or referenced by it. Anything another live
  -- (non-discarded) revision still references is kept.
  with mine as (
    select o.bucket_id, o.name from storage.objects o
    where (o.bucket_id = 'luna-pages' and (o.name like rev.comic_id || '/' || rev.id || '/%'
             or o.name in (select p.path from public.luna_pages p where p.revision_id = rev.id)
             or o.name in (rev.cover_path, rev.cover_sm_path)))
       or (o.bucket_id = 'luna-sources' and o.name like rev.comic_id || '/' || rev.id || '/%')
  ), free as (
    select m.bucket_id, m.name from mine m
    where not exists (select 1 from public.luna_pages p join public.luna_revisions r on r.id = p.revision_id
                      where p.path = m.name and r.id <> rev.id and r.status <> 'discarded')
      and not exists (select 1 from public.luna_revisions r
                      where r.id <> rev.id and r.status <> 'discarded' and m.name in (r.cover_path, r.cover_sm_path, r.source_path))
  )
  select jsonb_build_object(
    'pages', coalesce((select jsonb_agg(name order by name) from free where bucket_id = 'luna-pages'), '[]'::jsonb),
    'sources', coalesce((select jsonb_agg(name order by name) from free where bucket_id = 'luna-sources'), '[]'::jsonb))
  into paths;
  update public.luna_revisions set status = 'discarded' where id = rev.id;
  delete from public.luna_pages where revision_id = rev.id;
  return paths;
end $$;

create or replace function public.luna_publish(p_comic uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c public.luna_comics; probs text[]; target uuid;
begin
  perform public.luna_require_editor();
  select * into c from public.luna_comics where id = p_comic for update;
  if not found then raise exception 'luna: unknown comic' using errcode = '22023'; end if;
  target := coalesce(c.draft_revision, c.published_revision);
  probs := public.luna_publish_problems(c, target);
  if cardinality(probs) > 0 then raise exception 'luna: % ', array_to_string(probs, ' ') using errcode = '22023'; end if;
  if c.published_revision is not null and c.published_revision <> target then
    update public.luna_revisions set status = 'superseded' where id = c.published_revision;
  end if;
  update public.luna_revisions set status = 'ready' where id = target;
  update public.luna_comics set status = 'published', published_revision = target, draft_revision = target,
    published_at = now(), first_published_at = coalesce(first_published_at, now()), unpublished_at = null, updated_at = now()
  where id = c.id returning * into c;
  return public.luna_comic_json(c);
end $$;

-- Reversible removal from the public catalogue. Records and files stay; publish again to restore.
create or replace function public.luna_unpublish(p_comic uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c public.luna_comics;
begin
  perform public.luna_require_editor();
  update public.luna_comics set status = 'unpublished', unpublished_at = now(), updated_at = now()
  where id = p_comic and status = 'published' returning * into c;
  if not found then select * into c from public.luna_comics where id = p_comic; end if;
  return public.luna_comic_json(c);
end $$;

-- ---------------------------------------------------------------- public catalogue
-- Published titles only, with ONLY the page paths visitors may read (all for free titles, preview pages otherwise).
create or replace function public.luna_catalogue() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', c.id, 'slug', c.slug, 'title', c.title, 'title_note', c.title_note, 'series', c.series, 'episode', c.episode,
      'creator', c.creator, 'synopsis', c.synopsis, 'language', c.language, 'language_note', c.language_note,
      'genres', to_jsonb(c.genres), 'credits', c.credits, 'rights', c.rights, 'year', c.year,
      'access', case when c.access = 'free' then 'free' when c.is_sample then 'sample' else 'paid' end,
      'price', c.price, 'preview_pages', c.preview_pages, 'tone', c.tone, 'published_at', c.published_at,
      'revision', public.luna_revision_json(c.published_revision, case when c.access = 'free' then null else coalesce(c.preview_pages, 0) end))
    order by c.first_published_at desc), '[]'::jsonb)
  from public.luna_comics c join public.luna_revisions r on r.id = c.published_revision
  where c.status = 'published';
$$;
revoke all on function public.luna_catalogue() from public;
grant execute on function public.luna_catalogue() to anon, authenticated;

do $$ declare f text; begin
  foreach f in array array['luna_editor_list()', 'luna_editor_get(uuid)', 'luna_save_comic(uuid, jsonb)',
      'luna_begin_revision(uuid, uuid, text, text, bigint)', 'luna_finish_revision(uuid, jsonb, jsonb)',
      'luna_fail_revision(uuid, text)', 'luna_discard_revision(uuid)', 'luna_publish(uuid)', 'luna_unpublish(uuid)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
