import {test,expect} from '@playwright/test';
import {mockBackend} from './budget-backend.fixture.mjs';
import {readFile} from 'node:fs/promises';
test.beforeEach(async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('bt.settings',JSON.stringify({lang:'en',cur:'AZN',sound:false})));
});
const demo=async page=>{await page.goto('/budgettracker/?demo');await expect(page.locator('.today-summary')).toBeVisible()};
test('mobile landing puts demo and Android download in the viewport',async({page})=>{
 await page.goto('/budgettracker/');await expect(page.getByRole('button',{name:'Try the demo'})).toBeInViewport();
 await expect(page.getByRole('button',{name:'Download for Android (APK)'})).toBeInViewport();
 await page.getByRole('button',{name:'Forgot password?'}).click();await expect(page.getByRole('button',{name:'Send reset link'})).toBeVisible();
});
test('daily total is exact, idempotent, and rejects destructive undershoots',async({page})=>{
 await demo(page);await page.locator('nav [data-v=add]').click();
 await expect(page.locator('#d-earn')).toHaveValue('66.5');await page.locator('#d-earn').fill('100');await page.locator('#day-form button[type=submit]').click();
 await expect(page.locator('.goal .big')).toContainText('100.00');
 await page.locator('nav [data-v=add]').click();await expect(page.locator('#d-earn')).toHaveValue('100');await page.locator('#day-form button[type=submit]').click();
 await expect(page.locator('.goal .big')).toContainText('100.00');
 await page.locator('nav [data-v=add]').click();await page.locator('#d-earn').fill('20');await page.locator('#day-form button[type=submit]').click();
 await expect(page.locator('#day-error')).toContainText('cannot be lower');await page.keyboard.press('Escape');await expect(page.locator('#day-form')).toHaveCount(0);
});
test('entry editing and deletion undo preserve the financial result',async({page})=>{
 await demo(page);await page.locator('nav [data-v=list]').click();
 await page.locator('[data-act=edit]').first().click();await page.locator('#amt').fill('40');await page.locator('[data-act=sheet-save]').click();
 await expect(page.locator('.entry').first()).toContainText('40.00');
 await page.locator('[data-act=del]').first().click();await expect(page.locator('.undo')).toBeVisible();await page.locator('[data-act=undo]').click();
 await expect(page.locator('.entry').first()).toContainText('40.00');
});
test('reports use consistent fuel costs and preserve existing currency',async({page})=>{
 await demo(page);await page.locator('[data-v=reports]').click();await expect(page.locator('.tips')).not.toContainText('2.42');
 await expect(page.locator('.bales .big')).toContainText('378.50');
 await page.locator('nav [data-v=settings]').click();await page.locator('[data-act=cur][data-v=EUR]').click();
 await expect(page.locator('.sync-status')).toContainText('cannot be relabelled');await expect(page.locator('[data-v=AZN]')).toHaveAttribute('aria-pressed','true');
});
test('complete offline shell opens after network loss and keeps other app caches',async({page,context})=>{
 await demo(page);await page.evaluate(async()=>{await caches.open('another-app-v1');await navigator.serviceWorker.ready});
 await expect.poll(()=>page.evaluate(()=>navigator.serviceWorker.controller!==null)).toBeTruthy();
 await context.setOffline(true);await page.reload();await expect(page.locator('.today-summary')).toBeVisible();
 await expect(page.locator('body')).toContainText('66.50');expect(await page.evaluate(()=>caches.has('another-app-v1'))).toBeTruthy();
});
test('all supported languages render and small screens do not overflow',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/budgettracker/');
 for(const lang of ['az','ru','en']){await page.locator(`[data-act=lang][data-v=${lang}]`).click();await expect(page.locator('html')).toHaveAttribute('lang',lang)}
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy()}
 expect(errors).toEqual([]);
});
test('offline account entries survive reload and sync without duplicate records',async({page,context})=>{
 await page.addInitScript(mockBackend+";{const backend=window.supabase;Object.defineProperty(window,'supabase',{get:()=>backend,set:()=>{}})}");
 await page.goto('/budgettracker/');await expect(page.locator('.today-summary')).toBeVisible();
 await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>navigator.serviceWorker.controller!==null)).toBeTruthy();
 await context.setOffline(true);
 await page.locator('nav [data-v=add]').click();await page.locator('#d-earn').fill('100');await page.locator('#d-km').fill('20');await page.locator('#d-h').fill('4');await page.locator('#day-form button[type=submit]').click();
 await page.reload();await expect(page.locator('.goal .big')).toContainText('100.00');
 await context.setOffline(false);await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('test.backend')||'{}').bt_entries?.length||0)).toBe(1);
 await page.locator('nav [data-v=settings]').click();await page.locator('[data-act=sync]').click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('bt.u.11111111-1111-4111-8111-111111111111')).pending.length)).toBe(0);
 const calls=await page.evaluate(()=>window.__backendCalls.filter(c=>c.table==='bt_entries'&&c.operation==='read'));
 expect(calls.length).toBeGreaterThan(0);expect(calls.every(c=>c.filters.some(([key,value])=>key==='user_id'&&value==='11111111-1111-4111-8111-111111111111'))).toBeTruthy();
});
test('JSON backup contains entries, day metrics and routes without account tokens',async({page})=>{
 await demo(page);await page.locator('nav [data-v=settings]').click();
 const downloadPromise=page.waitForEvent('download');await page.locator('[data-act=backup]').click();const download=await downloadPromise;
 const data=JSON.parse(await readFile(await download.path(),'utf8'));
 expect(data.format).toBe('kuryebro');expect(data.entries).toHaveLength(12);expect(data.sessions).toHaveLength(3);
 expect(data.sessions.every(s=>s.points.length>0)).toBeTruthy();expect(Object.keys(data.days)).toHaveLength(4);
 expect(JSON.stringify(data)).not.toMatch(/access_token|refresh_token/);
});

test('restore previews, imports receipts and remains idempotent after reload',async({page})=>{
 await page.addInitScript(mockBackend+";{const backend=window.supabase;Object.defineProperty(window,'supabase',{get:()=>backend,set:()=>{}})}");
 await page.goto('/budgettracker/');await expect(page.locator('.today-summary')).toBeVisible();
 await page.locator('nav [data-v=settings]').click();
 const id='33333333-3333-4333-8333-333333333333',owner='11111111-1111-4111-8111-111111111111';
 const data={format:'kuryebro',version:2,ownerId:owner,currency:'AZN',created_at:'2026-11-19T10:00:00Z',entries:[{id,kind:'sale',amount:25,category:'delivery',note:'restored',date:'2026-11-19',created_at:'2026-11-19T09:00:00Z',photo_path:owner+'/'+id+'.jpg'}],sessions:[],fixed:[],days:{},goals:{daily:50,days:5},photos:[{id,data:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB1sAAAAASUVORK5CYII='}]};
 const file={name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))};
 await page.locator('#restore-file').setInputFiles(file);await expect(page.getByRole('dialog')).toContainText('Entries: 1');
 await page.locator('[data-act=restore-apply]').click();await expect(page.getByRole('dialog')).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('test.backend')||'{}').bt_entries?.length||0)).toBe(1);
 await page.reload();await page.locator('nav [data-v=settings]').click();await page.locator('#restore-file').setInputFiles(file);
 await expect(page.getByRole('dialog')).toContainText('Entries: 0');await page.locator('[data-act=restore-apply]').click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('test.backend')||'{}').bt_entries?.length||0)).toBe(1);
});

test('another device edit stays visible until the user resolves the conflict',async({page})=>{
 await page.addInitScript(mockBackend+";{const backend=window.supabase;Object.defineProperty(window,'supabase',{get:()=>backend,set:()=>{}})}");
 await page.addInitScript(()=>{
  const owner='11111111-1111-4111-8111-111111111111',id='33333333-3333-4333-8333-333333333333',row={id,user_id:owner,kind:'sale',amount:20,category:'delivery',note:'Other device',entry_date:'2026-11-19',created_at:'2026-11-19T09:00:00Z',updated_at:'2026-11-19T10:00:00Z'};
  localStorage.setItem('test.backend',JSON.stringify({bt_entries:[row]}));localStorage.setItem('bt.u.'+owner,JSON.stringify({entries:[{...row,amount:10,date:row.entry_date,server_updated_at:'2026-11-19T09:00:00Z'}],pending:[id]}));
 });
 await page.goto('/budgettracker/');await expect(page.getByRole('heading',{name:'Changes from another device'})).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('test.backend')).bt_entries[0].amount)).toBe(20);
 await page.locator('[data-act=conflict-server]').click();await expect(page.locator('[data-act=conflict-server]')).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('bt.u.11111111-1111-4111-8111-111111111111')).pending.length)).toBe(0);
});

test('shared account deletion explains its scope and requires typed confirmation',async({page})=>{
 await page.addInitScript(mockBackend+";{const backend=window.supabase;Object.defineProperty(window,'supabase',{get:()=>backend,set:()=>{}})}");
 let deletes=0;await page.route('**/functions/v1/budget-account',route=>{const body=route.request().postDataJSON();if(body.action==='delete')deletes++;return route.fulfill({json:body.action==='preview'?{shared:true,lastAdmin:false}:{ok:true}})});
 await page.goto('/budgettracker/');await expect(page.locator('.today-summary')).toBeVisible();await page.locator('nav [data-v=settings]').click();await page.locator('[data-act=account-open]').click();
 await expect(page.getByRole('dialog')).toContainText('Only KuryeBro data');await expect(page.locator('#delete-identity')).toHaveCount(0);
 await page.locator('[data-act=account-delete]').click();expect(deletes).toBe(0);await expect(page.locator('#delete-error')).toContainText('DELETE');
 await page.locator('#delete-password').fill('fixture-password');await page.locator('#delete-confirm').fill('DELETE');await page.locator('[data-act=account-delete]').click();
 await expect(page.getByRole('button',{name:'Try the demo'})).toBeVisible();expect(deletes).toBe(1);
});
