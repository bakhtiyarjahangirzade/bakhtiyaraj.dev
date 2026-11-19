CREATE OR REPLACE FUNCTION public.bt_overview()
 RETURNS TABLE(user_id uuid, nickname text, currency text, today_earn numeric, today_expense numeric, week_earn numeric, month_earn numeric, month_expense numeric, total_earn numeric, daily_target numeric, work_days smallint, today_km numeric, today_hours numeric, live_lat double precision, live_lng double precision, live_at timestamp with time zone, last_activity timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.bt_is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  return query
  select p.user_id, p.nickname, p.currency,
    coalesce((select sum(e.amount) from public.bt_entries e where e.user_id = p.user_id and e.deleted_at is null and e.kind = 'sale' and e.entry_date = d), 0),
    coalesce((select sum(e.amount) from public.bt_entries e where e.user_id = p.user_id and e.deleted_at is null and e.kind = 'expense' and e.entry_date = d), 0),
    coalesce((select sum(e.amount) from public.bt_entries e where e.user_id = p.user_id and e.deleted_at is null and e.kind = 'sale' and e.entry_date >= date_trunc('week', d)::date and e.entry_date <= d), 0),
    coalesce((select sum(e.amount) from public.bt_entries e where e.user_id = p.user_id and e.deleted_at is null and e.kind = 'sale' and e.entry_date >= date_trunc('month', d)::date and e.entry_date <= d), 0),
    coalesce((select sum(e.amount) from public.bt_entries e where e.user_id = p.user_id and e.deleted_at is null and e.kind = 'expense' and e.entry_date >= date_trunc('month', d)::date and e.entry_date <= d), 0),
    coalesce((select sum(e.amount) from public.bt_entries e where e.user_id = p.user_id and e.deleted_at is null and e.kind = 'sale'), 0),
    coalesce(g.daily_target, 0), coalesce(g.work_days, 6::smallint),
    coalesce((select dd.km from public.bt_days dd where dd.user_id = p.user_id and dd.day = d),
             (select coalesce(sum(s.distance_m * greatest(0,extract(epoch from least(s.ended_at,(d+1)::timestamp at time zone coalesce(s.time_zone,p.time_zone))-greatest(s.started_at,d::timestamp at time zone coalesce(s.time_zone,p.time_zone)))) / nullif(extract(epoch from s.ended_at-s.started_at),0)),0)::numeric/1000 from public.bt_sessions s where s.user_id=p.user_id and s.ended_at is not null)),
    coalesce((select dd.hours from public.bt_days dd where dd.user_id = p.user_id and dd.day = d),
             (select coalesce(sum(greatest(0,extract(epoch from least(s.ended_at,(d+1)::timestamp at time zone coalesce(s.time_zone,p.time_zone))-greatest(s.started_at,d::timestamp at time zone coalesce(s.time_zone,p.time_zone))))),0)::numeric/3600 from public.bt_sessions s where s.user_id=p.user_id and s.ended_at is not null)),
    (select l.lat from public.bt_live l where l.user_id = p.user_id and l.updated_at > now() - interval '10 minutes'),
    (select l.lng from public.bt_live l where l.user_id = p.user_id and l.updated_at > now() - interval '10 minutes'),
    (select l.updated_at from public.bt_live l where l.user_id = p.user_id and l.updated_at > now() - interval '10 minutes'),
    greatest((select max(e.updated_at) from public.bt_entries e where e.user_id = p.user_id), (select max(s.updated_at) from public.bt_sessions s where s.user_id = p.user_id), (select max(dd.updated_at) from public.bt_days dd where dd.user_id = p.user_id))
  from public.bt_profiles p cross join lateral (select (now() at time zone p.time_zone)::date as d) clock left join public.bt_goals g on g.user_id = p.user_id
  where not exists (select 1 from public.bt_admins a where a.user_id = p.user_id)
  order by 4 desc, p.nickname;
end $function$
