-- Luna Comics (bakhtiyaraj.dev/Luna): saved library and reading position for signed-in members.
-- Run once in the shared bakhy-dev Supabase project (SQL editor). Tables use the luna_ prefix.
-- Not touched: auth settings, the shared handle_new_user trigger and every other app's tables and policies.
-- No payment or ownership data lives here: Luna has no entitlements until a real checkout exists.

create table if not exists public.luna_library (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  comic_slug text not null check (comic_slug ~ '^[a-z0-9-]{2,64}$'),
  added_at timestamptz not null default now(),
  primary key (user_id, comic_slug)
);

create table if not exists public.luna_progress (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  comic_slug text not null check (comic_slug ~ '^[a-z0-9-]{2,64}$'),
  leaf integer not null check (leaf >= 0 and leaf < 2000),
  leaf_count integer not null check (leaf_count > 0 and leaf_count <= 2000),
  updated_at timestamptz not null default now(),
  primary key (user_id, comic_slug),
  constraint luna_progress_leaf_in_range check (leaf < leaf_count)
);

alter table public.luna_library enable row level security;
alter table public.luna_progress enable row level security;

revoke all on public.luna_library from anon;
revoke all on public.luna_progress from anon;
grant select, insert, update, delete on public.luna_library to authenticated;
grant select, insert, update, delete on public.luna_progress to authenticated;

-- Each member reads and writes only their own rows. Anonymous (guest) sessions are excluded.
create policy luna_library_select on public.luna_library for select to authenticated
  using (user_id = (select auth.uid()) and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false);
create policy luna_library_insert on public.luna_library for insert to authenticated
  with check (user_id = (select auth.uid()) and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false);
create policy luna_library_update on public.luna_library for update to authenticated
  using (user_id = (select auth.uid()) and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false)
  with check (user_id = (select auth.uid()) and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false);
create policy luna_library_delete on public.luna_library for delete to authenticated
  using (user_id = (select auth.uid()) and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false);

create policy luna_progress_select on public.luna_progress for select to authenticated
  using (user_id = (select auth.uid()) and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false);
create policy luna_progress_insert on public.luna_progress for insert to authenticated
  with check (user_id = (select auth.uid()) and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false);
create policy luna_progress_update on public.luna_progress for update to authenticated
  using (user_id = (select auth.uid()) and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false)
  with check (user_id = (select auth.uid()) and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false);
create policy luna_progress_delete on public.luna_progress for delete to authenticated
  using (user_id = (select auth.uid()) and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false);
