-- Additive upgrade: never changes existing financial records.
alter table public.bt_sessions add column if not exists time_zone text;
alter table public.bt_profiles add column if not exists time_zone text not null default 'Asia/Baku';

create or replace function public.bt_valid_zone() returns trigger language plpgsql set search_path=public,pg_catalog as $$
begin
 if new.time_zone is not null and not exists(select 1 from pg_timezone_names where name=new.time_zone) then
  raise exception 'invalid time zone' using errcode='22023';
 end if;
 return new;
end $$;
create trigger bt_sessions_zone before insert or update of time_zone on public.bt_sessions for each row execute function public.bt_valid_zone();
create trigger bt_profiles_zone before insert or update of time_zone on public.bt_profiles for each row execute function public.bt_valid_zone();

-- A courier cannot attach a route to another courier's session.
drop policy bt_routes_own on public.bt_routes;
create policy bt_routes_own on public.bt_routes for all to authenticated
 using(user_id=(select auth.uid()))
 with check(user_id=(select auth.uid()) and exists(select 1 from public.bt_sessions s where s.id=session_id and s.user_id=(select auth.uid())));

-- Optimistic concurrency: stale devices receive a conflict, never overwrite newer entries.
create or replace function public.bt_save_entries(items jsonb) returns jsonb
 language plpgsql security invoker set search_path=public,pg_catalog as $$
declare item jsonb; current_row public.bt_entries; saved public.bt_entries; result jsonb:='[]'; owner uuid:=auth.uid();
begin
 if owner is null or jsonb_typeof(items)<>'array' or jsonb_array_length(items)>100 then raise exception 'invalid request'; end if;
 for item in select value from jsonb_array_elements(items) loop
  -- Transaction lock also covers the absent-row case without locking other couriers.
  perform pg_advisory_xact_lock(hashtextextended(owner::text||':'||(item->>'id'),0));
  select * into current_row from public.bt_entries where id=(item->>'id')::uuid and user_id=owner for update;
  if found and (item->>'expected_updated_at' is null or current_row.updated_at is distinct from (item->>'expected_updated_at')::timestamptz) then
   result:=result||jsonb_build_array(jsonb_build_object('id',current_row.id,'conflict',true,'row',to_jsonb(current_row))); continue;
  end if;
  if current_row.id is null and item->>'expected_updated_at' is not null then
   result:=result||jsonb_build_array(jsonb_build_object('id',item->>'id','conflict',true,'row',null)); continue;
  end if;
  insert into public.bt_entries(id,user_id,kind,amount,category,note,entry_date,created_at,deleted_at,photo_path)
   values((item->>'id')::uuid,owner,item->>'kind',(item->>'amount')::numeric,coalesce(item->>'category',''),coalesce(item->>'note',''),(item->>'entry_date')::date,(item->>'created_at')::timestamptz,(item->>'deleted_at')::timestamptz,item->>'photo_path')
   on conflict(id) do update set kind=excluded.kind,amount=excluded.amount,category=excluded.category,note=excluded.note,entry_date=excluded.entry_date,deleted_at=excluded.deleted_at,photo_path=excluded.photo_path
   returning * into saved;
  result:=result||jsonb_build_array(jsonb_build_object('id',saved.id,'conflict',false,'row',to_jsonb(saved)));
 end loop;
 return result;
end $$;
revoke all on function public.bt_save_entries(jsonb) from public,anon;
grant execute on function public.bt_save_entries(jsonb) to authenticated;
