// A local stand-in for the parts of a Supabase project that Luna's SQL depends on, running in PGlite (real
// Postgres compiled to WASM). It recreates the anon/authenticated roles, auth.uid()/auth.jwt() reading the
// request.jwt.claims setting (as PostgREST and Storage do), Supabase's default grants on the public schema,
// and a storage schema whose objects table has RLS enabled. The real luna.sql and luna-publishing.sql then
// run unchanged, so their grants and policies are exercised exactly as written.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const STUB = `
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
grant usage on schema public to anon, authenticated, service_role;
-- Supabase grants these by default on objects created in public; the migrations must revoke what they do not want.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
create schema auth;
create schema extensions;
grant usage on schema auth to anon, authenticated, service_role;
create table auth.users (
  id uuid primary key, email text unique, email_confirmed_at timestamptz, is_anonymous boolean not null default false,
  raw_user_meta_data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
create function auth.role() returns text language sql stable as $$ select auth.jwt() ->> 'role' $$;
grant execute on all functions in schema auth to anon, authenticated, service_role;
create schema storage;
grant usage on schema storage to anon, authenticated, service_role;
create table storage.buckets (
  id text primary key, name text not null unique, public boolean default false,
  file_size_limit bigint, allowed_mime_types text[], created_at timestamptz default now());
create table storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text not null,
  owner uuid, owner_id text, metadata jsonb, created_at timestamptz default now(), updated_at timestamptz default now(),
  unique (bucket_id, name));
alter table storage.objects enable row level security;
alter table storage.buckets enable row level security;
grant select, insert, update, delete on storage.objects to anon, authenticated, service_role;
grant select on storage.buckets to anon, authenticated, service_role;
`;

const sql = name => readFileSync(new URL(`../../supabase/${name}`, import.meta.url), 'utf8');

export async function createDb() {
  const db = new PGlite();
  await db.exec(STUB);
  await db.exec(sql('luna.sql'));
  await db.exec(sql('luna-publishing.sql'));
  return db;
}

// Run fn(tx) as a request role with JWT claims, like PostgREST / Storage do per request.
// claims === null means the anon role without a user.
export async function as(db, claims, fn) {
  return db.transaction(async tx => {
    const role = claims ? (claims.role || 'authenticated') : 'anon';
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(claims ? { role, ...claims } : { role: 'anon' })]);
    await tx.exec(`set local role ${role}`);
    return fn(tx);
  });
}

// Owner provisioning, the same statement as supabase/luna-owner-setup.sql (run here as the database owner).
export async function grantEditor(db, email) {
  const r = await db.query(`insert into public.luna_editors (user_id, role, note)
    select id, 'owner', 'Luna owner' from auth.users
    where lower(email) = lower($1) and email_confirmed_at is not null and is_anonymous = false
    on conflict (user_id) do nothing returning user_id`, [email]);
  return r.rows.length;
}
