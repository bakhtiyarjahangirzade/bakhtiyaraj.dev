create or replace function public.bt_identity_scope(owner uuid) returns jsonb language plpgsql security definer set search_path=public,pg_catalog as $$
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
