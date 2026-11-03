-- Luna owner provisioning: makes ONE existing, e-mail-confirmed, non-anonymous BAKHY account a Luna editor.
-- Run after supabase/luna.sql and supabase/luna-publishing.sql, as the postgres role, by the project owner.
--
-- The owner's e-mail address is deliberately NOT in this public repository. Supply it at run time:
--
--   psql "$DATABASE_URL" -v owner_email='the-owner@example' -f supabase/luna-owner-setup.sql
--
-- In the Supabase dashboard SQL editor (no psql variables), paste the statements below and replace
-- :'owner_email' with the quoted address in the editor only. Do not commit the filled-in copy.
--
-- What it does NOT do: it does not create an account, change a password, touch auth.users, grant any
-- project/database/admin role, or promote anyone else. The account must already exist and be confirmed
-- (register at https://www.bakhtiyaraj.dev/Luna?bolme=hesab&forma=qeydiyyat and open the confirmation e-mail).

begin;

insert into public.luna_editors (user_id, role, note)
select u.id, 'owner', 'Luna owner (provisioned by luna-owner-setup.sql)'
from auth.users u
where lower(u.email) = lower(:'owner_email')
  and u.email_confirmed_at is not null
  and coalesce(u.is_anonymous, false) = false
on conflict (user_id) do nothing;

-- Must print exactly one row. Zero rows: the account does not exist yet or is not confirmed; nothing was granted.
select e.user_id, e.role, e.granted_at, (select count(*) from public.luna_editors) as editors_total
from public.luna_editors e join auth.users u on u.id = e.user_id
where lower(u.email) = lower(:'owner_email');

commit;

-- Review all editors at any time:
--   select e.user_id, u.email, e.role, e.granted_at from public.luna_editors e join auth.users u on u.id = e.user_id;
-- Revoke (takes effect on the editor's next request; their session stays an ordinary member):
--   delete from public.luna_editors where user_id = '<uuid>';
