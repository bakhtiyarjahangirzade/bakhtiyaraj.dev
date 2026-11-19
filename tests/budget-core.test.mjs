import test from 'node:test';
import assert from 'node:assert/strict';
import {decimal,total,validDate,dayAdjustment,dayMetrics,fuelRate,monthProjection,BALANCE_NOTE,legacyTotalDates} from '../storefront/budgettracker/core.mjs';
const day='2026-11-19';
const row=(amount,kind='sale',category='delivery',date=day)=>({id:crypto.randomUUID(),amount,kind,category,date});
test('day total adds only the remainder above itemised earnings and keeps receipts',()=>{
 const rows=[row(38),row(22.5),row(6,'sale','tip'),row(18,'expense','fuel'),row(7.5,'expense','food')];
 assert.deepEqual(dayAdjustment(rows,day,100,25.5),{sale:33.5,expense:0});
 assert.equal(rows.length,5);
 assert.equal(total([...rows,row(33.5,'sale','daily')],'sale'),100);
});
test('resaving the same total is idempotent and replaces only the daily remainder',()=>{
 const rows=[row(66.5),row(33.5,'sale','daily')];
 assert.deepEqual(dayAdjustment(rows,day,100,0),{sale:33.5,expense:0});
 assert.deepEqual(dayAdjustment(rows,day,120,0),{sale:53.5,expense:0});
});
test('totals below recorded detail cannot silently delete itemised records',()=>{
 assert.throws(()=>dayAdjustment([row(66.5)],day,50,0),/below-details/);
 assert.throws(()=>dayAdjustment([row(18,'expense')],day,100,10),/below-details/);
});
test('an expense-only day and explicit zero totals are supported',()=>{
 assert.deepEqual(dayAdjustment([],day,0,18),{sale:0,expense:18});
 assert.deepEqual(dayAdjustment([],day,0,0),{sale:0,expense:0});
});
test('invalid dates, negative, nonfinite and excessive amounts are rejected',()=>{
 for(const date of ['2026-02-30','2026-13-01','abc'])assert.throws(()=>dayAdjustment([],date,100,0),/invalid/);
 for(const n of [NaN,Infinity,-1,1e9])assert.throws(()=>dayAdjustment([],day,n,0),/invalid/);
 assert.equal(validDate('2024-02-29'),true);assert.equal(validDate('2025-02-29'),false);
});
test('money totals use integer cents',()=>assert.equal(total([row(.1),row(.2)],'sale'),.3));
test('decimal entry supports comma but rejects partial numbers and excess precision',()=>{
 assert.equal(decimal('12,50'),12.5);assert.equal(decimal('0.00'),0);
 for(const n of ['12abc','1.001','-1','Infinity','1e5'])assert.ok(Number.isNaN(decimal(n)));
});
test('explicit zero manual distance takes precedence over recorded GPS',()=>{
 const session={started_at:day+'T12:00:00',ended_at:day+'T13:00:00',distance_m:10000,duration_s:3600};
 assert.deepEqual(dayMetrics([row(100)],{[day]:{km:0,hours:0}},[session],day),{earn:100,spent:0,km:0,h:0});
 assert.equal(dayMetrics([],{},[session],day).km,10);
});
test('fuel tips use the same manual distance as financial ratios',()=>{
 const rows=[row(18,'expense','fuel'),row(21,'expense','fuel','2026-11-18')],days={[day]:{km:38.4,hours:6.2},'2026-11-18':{km:64,hours:8.5}};
 assert.equal(fuelRate(rows,days,[],'2026-11',day),39/102.4);
});
test('fuel without a matching distance is excluded rather than inflating the ratio',()=>{
 assert.equal(fuelRate([row(18,'expense','fuel'),row(90,'expense','fuel','2026-11-18')],{[day]:{km:10,hours:1}},[],'2026-11',day),1.8);
});
test('monthly goal agrees with the integer number of working-day bundles',()=>{
 const p=monthProjection([row(100),row(999,'sale','daily','2026-11-30')],120,6,new Date('2026-11-19T12:00:00'));
 assert.equal(p.total,26);assert.equal(p.target,3120);assert.equal(p.earn,100);
 assert.ok(p.need>0);
 assert.equal(monthProjection([],120,6,new Date('2026-11-30T12:00:00')).need,0);
});
test('historical ambiguous totals are flagged without changing financial history',()=>{
 const old=[row(66.5),row(100,'sale','daily')];assert.deepEqual(legacyTotalDates(old),[day]);assert.equal(total(old,'sale'),166.5);
 old[1].note=BALANCE_NOTE;assert.deepEqual(legacyTotalDates(old),[]);
});
