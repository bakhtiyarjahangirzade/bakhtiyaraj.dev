import test from 'node:test';
import assert from 'node:assert/strict';
import {parseBackup,planRestore} from '../storefront/budgettracker/backup.mjs';
const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',id='33333333-3333-4333-8333-333333333333';
const sample=()=>({format:'kuryebro',version:2,ownerId:owner,currency:'AZN',created_at:'2026-11-19T12:00:00Z',entries:[{id,kind:'sale',amount:100,category:'delivery',note:'Example',date:'2026-11-19',created_at:'2026-11-19T11:00:00Z',deleted_at:null}],sessions:[],fixed:[],days:{'2026-11-19':{km:20,hours:4}},goals:{daily:120,days:6},photos:[]});
const empty=()=>({currency:'AZN',entries:[],sessions:[],fixed:[],days:{}});
test('same-account restore preserves identifiers and does not duplicate a second import',async()=>{
 const b=parseBackup(JSON.stringify(sample())),first=await planRestore(b,empty(),owner);
 assert.equal(first.entries[0].id,id);assert.equal(first.entries[0].amount,100);
 const again=await planRestore(b,{...empty(),entries:first.entries,days:first.days},owner);assert.equal(again.entries.length,0);assert.equal(again.skipped,2);
});
test('cross-account restore remaps IDs deterministically and never reuses storage paths',async()=>{
 const b=sample();b.entries[0].photo_path=`${owner}/${id}.jpg`;b.photos=[{id,data:'data:image/jpeg;base64,/9j/'}];
 const parsed=parseBackup(JSON.stringify(b)),first=await planRestore(parsed,empty(),other),again=await planRestore(parsed,empty(),other);
 assert.notEqual(first.entries[0].id,id);assert.equal(first.entries[0].id,again.entries[0].id);assert.ok(first.entries[0].photo_path.startsWith(other+'/'));assert.equal(first.photos[0].id,first.entries[0].id);
});
test('stale backups cannot overwrite newer records or revive a deleted entry',async()=>{
 const b=parseBackup(JSON.stringify(sample())),current={...empty(),entries:[{...sample().entries[0],deleted_at:'2026-11-19T12:10:00Z'}]};
 const plan=await planRestore(b,current,owner);assert.equal(plan.entries.length,0);assert.equal(plan.conflicts,1);assert.ok(current.entries[0].deleted_at);
});
test('currency mismatch is rejected before any restore plan is applied',async()=>{
 await assert.rejects(planRestore(parseBackup(JSON.stringify(sample())),{...empty(),currency:'EUR'},owner),/currency-mismatch/);
});
test('active shift becomes a completed snapshot and never starts location tracking',async()=>{
 const b=sample();b.active={id,started_at:'2026-11-19T11:00:00Z',distance_m:1000,points:[[40.4,49.8,1795086000]]};
 const plan=await planRestore(parseBackup(JSON.stringify(b)),empty(),owner);assert.ok(plan.closedShift);assert.equal(plan.sessions[0].ended_at,b.created_at);assert.equal(plan.sessions[0].duration_s,3600);
});
test('version-one exports remain readable without an owner field',async()=>{
 const b=sample();b.version=1;delete b.ownerId;const plan=await planRestore(parseBackup(JSON.stringify(b)),empty(),owner);assert.equal(plan.entries.length,1);assert.notEqual(plan.entries[0].id,id);
});
test('malformed, duplicate or dangerous backup content is rejected',()=>{
 for(const change of [b=>b.entries.push({...b.entries[0]}),b=>b.entries[0].amount=-1,b=>b.entries[0].amount=1.001,b=>b.entries[0].date='2026-02-30',b=>b.days['__proto__']={km:1,hours:1},b=>b.entries[0].id='not-an-id',b=>b.photos.push({id,data:'data:image/svg+xml;base64,AAAA'})]){
  const b=sample();change(b);if(!Object.hasOwn(b.days,'__proto__')){if(Object.getPrototypeOf(b.days)!==Object.prototype)continue;}assert.throws(()=>parseBackup(JSON.stringify(b)),/invalid-backup/);
 }
 assert.throws(()=>parseBackup('{broken'),/invalid-backup/);
});
test('a referenced receipt must be present in a full backup',()=>{
 const b=sample();b.entries[0].photo_path='old/path.jpg';assert.throws(()=>parseBackup(JSON.stringify(b)),/invalid-backup/);
});
