import test from 'node:test';
import assert from 'node:assert/strict';
import {readOwnEntries,entryRow,acknowledgeEntries,dailyEntryId} from '../storefront/budgettracker/sync.mjs';
test('personal sync scopes every page to its owner and keeps timestamp ties',async()=>{
 const calls=[],rows=Array.from({length:1001},(_,i)=>({id:String(i),updated_at:'2026-11-19T12:00:00Z'}));
 const client={from(table){const q={select(){return q},eq(key,value){calls.push([key,value]);return q},order(){return q},gte(key,value){calls.push([key,value]);return q},range(a,b){return Promise.resolve({data:rows.slice(a,b+1)})}};return q;}};
 let count=0;const cursor=await readOwnEntries(client,'owner-id',rows[0].updated_at,part=>count+=part.length);
 assert.equal(count,1001);assert.equal(cursor,rows[0].updated_at);
 assert.equal(calls.filter(([k,v])=>k==='user_id'&&v==='owner-id').length,3);
 assert.equal(calls.filter(([k])=>k==='updated_at').length,3);
});
test('a failed page is reported so its cursor cannot be committed',async()=>{
 const q={select(){return q},eq(){return q},order(){return q},range(){return Promise.resolve({error:new Error('offline')})}};
 await assert.rejects(readOwnEntries({from:()=>q},'owner',null,()=>{}),/offline/);
});
test('an edit or deletion made while uploading stays pending',()=>{
 const e={id:'one',kind:'sale',amount:100,category:'delivery',note:'',date:'2026-11-19'},pending=new Set(['one']),sent=[entryRow(e)];
 e.deleted_at='2026-11-19T13:00:00Z';acknowledgeEntries([e],pending,sent);assert.ok(pending.has('one'));
 acknowledgeEntries([e],pending,[entryRow(e)]);assert.equal(pending.size,0);
});

test('daily balance identifiers are stable per account, day and kind',async()=>{
 assert.equal(await dailyEntryId('a','2026-11-19','sale'),await dailyEntryId('a','2026-11-19','sale'));
 assert.notEqual(await dailyEntryId('a','2026-11-19','sale'),await dailyEntryId('b','2026-11-19','sale'));
 assert.notEqual(await dailyEntryId('a','2026-11-19','sale'),await dailyEntryId('a','2026-11-19','expense'));
});
