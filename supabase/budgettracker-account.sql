-- A reset epoch prevents old offline installations from re-uploading erased records.
create table public.bt_resets(user_id uuid primary key references auth.users(id) on delete cascade,epoch uuid not null default gen_random_uuid(),state text not null check(state in ('pending','ready')),updated_at timestamptz not null default now());
alter table public.bt_resets enable row level security;
revoke all on public.bt_resets from anon,authenticated;
grant all on public.bt_resets to service_role;

create function public.bt_lifecycle_status() returns jsonb language sql stable security definer set search_path=public,pg_catalog as $$
 select jsonb_build_object('epoch',r.epoch,'state',coalesce(r.state,'ready')) from (select auth.uid() as uid) u left join public.bt_resets r on r.user_id=u.uid where u.uid is not null;
$$;
revoke all on function public.bt_lifecycle_status() from public,anon;
grant execute on function public.bt_lifecycle_status() to authenticated;

create function public.bt_account_allowed() returns boolean language sql stable security definer set search_path=public,pg_catalog as $$
 select exists(select 1 from auth.users where id=auth.uid() and not is_anonymous)
 and not exists(select 1 from public.bt_resets r where r.user_id=auth.uid() and (r.state<>'ready' or r.epoch::text is distinct from (nullif(current_setting('request.headers',true),'')::jsonb->>'x-bt-epoch')));
$$;
revoke all on function public.bt_account_allowed() from public,anon;
grant execute on function public.bt_account_allowed() to authenticated;
do $$declare t text;begin
 foreach t in array array['bt_profiles','bt_entries','bt_budgets','bt_goals','bt_sessions','bt_routes','bt_days','bt_fixed','bt_live','bt_admins'] loop
 execute format('create policy bt_lifecycle_gate on public.%I as restrictive for all to authenticated using ((select public.bt_account_allowed())) with check ((select public.bt_account_allowed()))',t);
 end loop;
end$$;
create policy bt_lifecycle_storage_gate on storage.objects as restrictive for all to authenticated
 using(bucket_id<>'bt-receipts' or (select public.bt_account_allowed())) with check(bucket_id<>'bt-receipts' or (select public.bt_account_allowed()));

-- Shared identity detection is deliberately conservative. Only untouched automatic
-- game signup rows may be removed along with a KuryeBro-only identity.
create function public.bt_identity_scope(owner uuid) returns jsonb language plpgsql security definer set search_path=public,pg_catalog as $$
declare col record; used boolean; shared boolean:=false; last_admin boolean;
begin
 for col in select distinct c.relname,a.attname from pg_constraint f join pg_class c on c.oid=f.conrelid join pg_namespace n on n.oid=c.relnamespace join pg_attribute a on a.attrelid=c.oid and a.attnum=any(f.conkey)
 where f.contype='f' and f.confrelid in ('auth.users'::regclass,'public.profiles'::regclass) and n.nspname='public' and c.relname not like 'bt\_%' escape '\' and c.relname not in ('profiles','chip_log') loop
  execute format('select exists(select 1 from public.%I where %I=$1)',col.relname,col.attname) into used using owner;
  shared:=shared or used;
 end loop;
 shared:=shared or exists(select 1 from public.profiles where id=bt_identity_scope.owner and (chips<>5000 or role<>'user' or banned or last_bonus is not null or games_played<>0))
 or exists(select 1 from public.chip_log where user_id=bt_identity_scope.owner and reason<>'welcome')
 or exists(select 1 from storage.objects where owner_id=bt_identity_scope.owner::text and bucket_id<>'bt-receipts');
 select exists(select 1 from public.bt_admins where user_id=bt_identity_scope.owner) and (select count(*) from public.bt_admins)<=1 into last_admin;
 return jsonb_build_object('shared',shared,'lastAdmin',last_admin);
end$$;
revoke all on function public.bt_identity_scope(uuid) from public,anon,authenticated;
grant execute on function public.bt_identity_scope(uuid) to service_role;

create function public.bt_begin_reset(owner uuid,full_identity boolean) returns uuid language plpgsql security definer set search_path=public,pg_catalog as $$
declare scope jsonb; token uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(owner::text,1));
 scope:=public.bt_identity_scope(owner);
 if full_identity and ((scope->>'shared')::boolean or (scope->>'lastAdmin')::boolean) then raise exception 'shared identity or last administrator' using errcode='42501';end if;
 insert into public.bt_resets(user_id,state) values(owner,'pending') on conflict(user_id) do update set state='pending',epoch=gen_random_uuid(),updated_at=now() returning epoch into token;
 return token;
end$$;
create function public.bt_finish_reset(owner uuid) returns void language plpgsql security definer set search_path=public,pg_catalog as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(owner::text,1));
 if not exists(select 1 from public.bt_resets where user_id=owner and state='pending') then raise exception 'reset not started';end if;
 delete from public.bt_routes where user_id=owner;
 delete from public.bt_live where user_id=owner;
 delete from public.bt_entries where user_id=owner;
 delete from public.bt_days where user_id=owner;
 delete from public.bt_fixed where user_id=owner;
 delete from public.bt_budgets where user_id=owner;
 delete from public.bt_goals where user_id=owner;
 delete from public.bt_sessions where user_id=owner;
 delete from public.bt_profiles where user_id=owner;
 update public.bt_resets set state='ready',updated_at=now() where user_id=owner;
end$$;
revoke all on function public.bt_begin_reset(uuid,boolean),public.bt_finish_reset(uuid) from public,anon,authenticated;
grant execute on function public.bt_begin_reset(uuid,boolean),public.bt_finish_reset(uuid) to service_role;
