create unique index if not exists bt_entries_daily_balance_unique on public.bt_entries(user_id,entry_date,kind) where category='daily' and note='kuryebro:day-balance:v1' and deleted_at is null;
create or replace function public.bt_save_entries(items jsonb) returns jsonb
 language plpgsql security invoker set search_path=public,pg_catalog as $$
declare item jsonb; current_row public.bt_entries; saved public.bt_entries; result jsonb:='[]'; owner uuid:=auth.uid();
begin
 if owner is null or jsonb_typeof(items)<>'array' or jsonb_array_length(items)>100 then raise exception 'invalid request'; end if;
 for item in select value from jsonb_array_elements(items) loop
  -- Transaction lock also covers the absent-row case without locking other couriers.
  perform pg_advisory_xact_lock(hashtextextended(owner::text||':'||case when item->>'note'='kuryebro:day-balance:v1' and item->>'category'='daily' then (item->>'entry_date')||':'||(item->>'kind') else item->>'id' end,0));
  select * into current_row from public.bt_entries where id=(item->>'id')::uuid and user_id=owner for update;
  if found and (item->>'expected_updated_at' is null or current_row.updated_at is distinct from (item->>'expected_updated_at')::timestamptz) then
   result:=result||jsonb_build_array(jsonb_build_object('id',current_row.id,'conflict',true,'row',to_jsonb(current_row))); continue;
  end if;
  if current_row.id is null and item->>'category'='daily' and item->>'note'='kuryebro:day-balance:v1' and item->>'deleted_at' is null then
   select * into current_row from public.bt_entries where user_id=owner and entry_date=(item->>'entry_date')::date and kind=item->>'kind' and category='daily' and note='kuryebro:day-balance:v1' and deleted_at is null for update;
   if found then result:=result||jsonb_build_array(jsonb_build_object('id',item->>'id','conflict',true,'row',to_jsonb(current_row)));continue;end if;
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
