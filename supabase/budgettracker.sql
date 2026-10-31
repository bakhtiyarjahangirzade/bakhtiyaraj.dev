-- BAKHY Budget Tracker (bakhtiyaraj.dev/budgettracker). Tables use the bt_ prefix inside the shared bakhy-dev project.
-- Every table has row level security: members see only their own rows, admins (bt_admins) may read everything.
create table public.bt_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  nickname text not null,
  created_at timestamptz not null default now(),
  constraint bt_nick_format check (char_length(nickname) between 3 and 20 and nickname ~ '^[A-Za-z0-9_.-]+$')
);
create unique index bt_profiles_nick_ci on public.bt_profiles (lower(nickname));

create table public.bt_entries (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  kind text not null check (kind in ('income','expense','sale')),
  amount numeric(12,2) not null check (amount > 0 and amount < 1000000000),
  category text not null default '' check (char_length(category) <= 40),
  note text not null default '' check (char_length(note) <= 200),
  entry_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index bt_entries_user_date on public.bt_entries (user_id, entry_date desc);

create table public.bt_budgets (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  category text not null check (char_length(category) between 1 and 40),
  monthly_limit numeric(12,2) not null check (monthly_limit >= 0),
  primary key (user_id, category)
);

create table public.bt_goals (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  daily_target numeric(12,2) not null default 0 check (daily_target >= 0),
  
  updated_at timestamptz not null default now()
);

create table public.bt_admins (user_id uuid primary key references auth.users(id) on delete cascade);

alter table public.bt_profiles enable row level security;
alter table public.bt_entries enable row level security;
alter table public.bt_budgets enable row level security;
alter table public.bt_goals enable row level security;
alter table public.bt_admins enable row level security;

create function public.bt_is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.bt_admins where user_id = (select auth.uid())) $$;
revoke all on function public.bt_is_admin() from public, anon;
grant execute on function public.bt_is_admin() to authenticated;

create function public.bt_touch() returns trigger language plpgsql set search_path = public as
$$ begin new.updated_at := now(); return new; end $$;
create trigger bt_entries_touch before update on public.bt_entries for each row execute function public.bt_touch();
create trigger bt_goals_touch before update on public.bt_goals for each row execute function public.bt_touch();

create policy bt_profiles_read on public.bt_profiles for select to authenticated using (user_id = (select auth.uid()) or public.bt_is_admin());
create policy bt_profiles_insert on public.bt_profiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy bt_profiles_update on public.bt_profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy bt_entries_read on public.bt_entries for select to authenticated using (user_id = (select auth.uid()) or public.bt_is_admin());
create policy bt_entries_insert on public.bt_entries for insert to authenticated with check (user_id = (select auth.uid()));
create policy bt_entries_update on public.bt_entries for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy bt_budgets_read on public.bt_budgets for select to authenticated using (user_id = (select auth.uid()) or public.bt_is_admin());
create policy bt_budgets_write on public.bt_budgets for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy bt_goals_read on public.bt_goals for select to authenticated using (user_id = (select auth.uid()) or public.bt_is_admin());
create policy bt_goals_write on public.bt_goals for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy bt_admins_self on public.bt_admins for select to authenticated using (user_id = (select auth.uid()));

revoke all on public.bt_profiles, public.bt_entries, public.bt_budgets, public.bt_goals, public.bt_admins from anon;

-- Admin overview: one row per nickname for the current month plus all-time sales.
create function public.bt_overview() returns table (
  user_id uuid, nickname text, month_sales numeric, total_sales numeric, month_income numeric, month_expense numeric,
  daily_target numeric, last_activity timestamptz
) language plpgsql stable security definer set search_path = public as $$
begin
  if not public.bt_is_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  return query
  select p.user_id, p.nickname,
    coalesce(sum(e.amount) filter (where e.kind = 'sale' and e.entry_date >= date_trunc('month', current_date)), 0),
    coalesce(sum(e.amount) filter (where e.kind = 'sale'), 0),
    coalesce(sum(e.amount) filter (where e.kind = 'income' and e.entry_date >= date_trunc('month', current_date)), 0),
    coalesce(sum(e.amount) filter (where e.kind = 'expense' and e.entry_date >= date_trunc('month', current_date)), 0),
    coalesce(g.daily_target, 0),
    max(e.updated_at)
  from public.bt_profiles p
  left join public.bt_entries e on e.user_id = p.user_id and e.deleted_at is null
  left join public.bt_goals g on g.user_id = p.user_id
  group by p.user_id, p.nickname, g.daily_target
  order by 3 desc, p.nickname;
end $$;
revoke all on function public.bt_overview() from public, anon;
grant execute on function public.bt_overview() to authenticated;

-- Table privileges (this project does not grant data access to authenticated by default). RLS above still limits rows.
revoke all on public.bt_profiles, public.bt_entries, public.bt_budgets, public.bt_goals, public.bt_admins from authenticated;
grant select, insert, update on public.bt_profiles to authenticated;
grant select, insert, update on public.bt_entries to authenticated;
grant select, insert, update, delete on public.bt_budgets to authenticated;
grant select, insert, update, delete on public.bt_goals to authenticated;
grant select on public.bt_admins to authenticated;
grant all on public.bt_profiles, public.bt_entries, public.bt_budgets, public.bt_goals, public.bt_admins to service_role;

-- Courier edition: the goal is a daily earnings target and bt_overview() reports today (Baku time) per courier.
-- Applied as migrations budgettracker_courier_daily and budgettracker_overview_baku_time:
--   alter table bt_goals rename column sales_target to daily_target; drop column saving_target;
--   bt_overview() returns user_id, nickname, today_earn, today_expense, month_earn, month_expense, total_earn, daily_target, last_activity.
