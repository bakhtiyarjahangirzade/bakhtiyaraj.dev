import test from 'node:test';
import assert from 'node:assert/strict';
import {splitSession,sessionsInRange,dayAt} from '../storefront/budgettracker/calendar.mjs';
import {dayMetrics} from '../storefront/budgettracker/core.mjs';
test('a shift crossing midnight is allocated to both financial days',()=>{
 const s={started_at:'2026-11-19T22:30:00Z',ended_at:'2026-11-20T00:30:00Z',distance_m:10000,time_zone:'Europe/Berlin'};
 const p=splitSession(s);assert.equal(p.length,2);assert.deepEqual(p.map(x=>x.seconds),[1800,5400]);assert.deepEqual(p.map(x=>x.km),[2.5,7.5]);
 assert.equal(dayMetrics([],{},[s],'2026-11-20').h,1.5);
});
test('spring and autumn DST days use actual elapsed time',()=>{
 const spring={started_at:'2026-03-28T23:00:00Z',ended_at:'2026-03-29T22:00:00Z',distance_m:23000,time_zone:'Europe/Berlin'};
 const autumn={started_at:'2026-10-24T22:00:00Z',ended_at:'2026-10-25T23:00:00Z',distance_m:25000,time_zone:'Europe/Berlin'};
 assert.equal(splitSession(spring)[0].seconds,23*3600);assert.equal(splitSession(autumn)[0].seconds,25*3600);
});
test('a recorded shift zone remains stable when another device uses a different zone',()=>{
 const s={started_at:'2026-11-19T21:00:00Z',ended_at:'2026-11-19T22:00:00Z',distance_m:1000,time_zone:'Asia/Baku'};
 assert.equal(splitSession(s,'America/New_York')[0].day,'2026-11-20');assert.equal(dayAt(Date.parse(s.started_at),'Europe/Berlin'),'2026-11-19');
});
test('route timing, rather than elapsed hours alone, allocates distance',()=>{
 const s={started_at:'2026-11-19T23:59:00Z',ended_at:'2026-11-20T00:01:00Z',distance_m:1000,time_zone:'UTC',points:[[40,49,Date.parse('2026-11-19T23:59:00Z')/1000],[40,49.01,Date.parse('2026-11-20T00:00:00Z')/1000],[40,49.01,Date.parse('2026-11-20T00:01:00Z')/1000]]};
 const p=splitSession(s);assert.equal(p[0].km,1);assert.equal(p[1].km,0);assert.equal(sessionsInRange([s],'2026-11-20','2026-11-20').sec,60);
});
