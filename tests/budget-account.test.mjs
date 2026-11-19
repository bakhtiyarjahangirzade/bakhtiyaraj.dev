import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
test('account reset is owner-scoped, blocks stale devices and preserves shared application data',async()=>{
 const db=new PGlite(),a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
 try{
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create schema storage;
 create table auth.users(id uuid primary key,is_anonymous boolean default false);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
 grant usage on schema auth to authenticated;
 create table profiles(id uuid primary key references auth.users(id),chips int default 5000,role text default 'user',banned boolean default false,last_bonus date,games_played int default 0);
 create table chip_log(user_id uuid,reason text);
 create table other_app(user_id uuid references auth.users(id));
 create table storage.objects(owner_id text,owner uuid,bucket_id text);alter table storage.objects enable row level security;
 insert into auth.users(id) values('${a}'),('${b}');
 insert into profiles(id) values('${a}'),('${b}');`);
 for(const table of ['bt_profiles','bt_entries','bt_budgets','bt_goals','bt_sessions','bt_routes','bt_days','bt_fixed','bt_live','bt_admins']){
 await db.exec(`create table ${table}(user_id uuid);alter table ${table} enable row level security;grant select,insert on ${table} to authenticated;create policy own on ${table} to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());`);
 }
 await db.exec(await readFile(new URL('../supabase/budgettracker-account.sql',import.meta.url),'utf8'));
 await db.exec(`insert into bt_entries values('${a}'),('${b}');insert into other_app values('${a}');set test.uid='${a}';`);
 assert.equal((await db.query(`select bt_identity_scope('${a}') as s`)).rows[0].s.shared,true);
 await assert.rejects(db.exec(`select bt_begin_reset('${a}',true)`),/shared identity/);
 const epoch=(await db.query(`select bt_begin_reset('${a}',false) as epoch`)).rows[0].epoch;
 await db.exec(`set role authenticated;`);
 await assert.rejects(db.exec(`insert into bt_entries values('${a}')`),/row-level security/);
 await assert.rejects(db.exec(`select bt_finish_reset('${a}')`),/permission denied/);
 await db.exec(`reset role;select bt_finish_reset('${a}');set role authenticated;`);
 await assert.rejects(db.exec(`insert into bt_entries values('${a}')`),/row-level security/);
 await db.query(`select set_config('request.headers',$1,false)`,[JSON.stringify({'x-bt-epoch':epoch})]);
 await db.exec(`insert into bt_entries values('${a}');reset role;`);
 assert.equal((await db.query('select count(*)::int n from other_app')).rows[0].n,1);
 assert.equal((await db.query(`select count(*)::int n from bt_entries where user_id='${b}'`)).rows[0].n,1);
 assert.equal((await db.query('select count(*)::int n from auth.users')).rows[0].n,2);
 }finally{await db.close()}
});
