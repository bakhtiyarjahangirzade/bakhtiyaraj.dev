import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';

test('migration compiles and rejects stale writes and foreign route parents',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon;create role authenticated;create schema auth;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
 grant usage on schema auth to authenticated;
 create table bt_profiles(user_id uuid primary key);
 create table bt_sessions(id uuid primary key,user_id uuid not null);
 create table bt_routes(session_id uuid primary key references bt_sessions(id),user_id uuid,points jsonb);
 create table bt_entries(id uuid primary key,user_id uuid,kind text,amount numeric,category text,note text,entry_date date,created_at timestamptz,updated_at timestamptz default clock_timestamp(),deleted_at timestamptz,photo_path text);
 create function touch() returns trigger language plpgsql as $$begin new.updated_at=clock_timestamp();return new;end$$;
 create trigger touch before update on bt_entries for each row execute function touch();
 alter table bt_entries enable row level security;alter table bt_routes enable row level security;alter table bt_sessions enable row level security;
 create policy own on bt_entries to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
 create policy own on bt_sessions to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
 create policy bt_routes_own on bt_routes to authenticated using(user_id=auth.uid());
 grant select,insert,update on bt_entries,bt_sessions,bt_routes to authenticated;`);
 await db.exec(await readFile(new URL('../supabase/budgettracker-lifecycle.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../supabase/budgettracker-unique-days.sql',import.meta.url),'utf8'));
 const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222',id='33333333-3333-4333-8333-333333333333';
 await db.exec(`insert into bt_sessions values('${id}','${b}',null);set role authenticated;set test.uid='${a}';`);
 const item={id,kind:'sale',amount:10,entry_date:'2026-11-19',created_at:'2026-11-19T00:00:00Z'};
 const save=async i=>(await db.query('select bt_save_entries($1::jsonb) as results',[JSON.stringify([i])])).rows[0].results[0];
 const first=await save(item);assert.equal(first.conflict,false);
 const newer=await save({...item,amount:20,expected_updated_at:first.row.updated_at});assert.equal(newer.conflict,false);
 const stale=await save({...item,amount:99,expected_updated_at:first.row.updated_at});assert.equal(stale.conflict,true);assert.equal(Number(stale.row.amount),20);
 const noRevision=await save({...item,amount:99});assert.equal(noRevision.conflict,true);
 const day={...item,id:'44444444-4444-4444-8444-444444444444',category:'daily',note:'kuryebro:day-balance:v1'};
 const daily=await save(day);assert.equal(daily.conflict,false);
 const duplicate=await save({...day,id:'55555555-5555-4555-8555-555555555555'});assert.equal(duplicate.conflict,true);assert.equal(duplicate.row.id,day.id);
 await assert.rejects(db.query('insert into bt_routes values($1,$2,\'[]\')',[id,a]),/row-level security/);
 }finally{await db.close()}
});
