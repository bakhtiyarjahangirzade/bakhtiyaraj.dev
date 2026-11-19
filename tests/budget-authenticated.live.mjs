// Explicit opt-in production test. Only disposable harness-owned identities are mutated.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
const source=await readFile('storefront/budgettracker/app.js','utf8');
const url=source.match(/SB_URL='([^']+)'/)[1],key=source.match(/SB_KEY='([^']+)'/)[1];
const secret=JSON.parse(await readFile('../qa-secret.json','utf8')).secret;
const evidence=[];
const check=(name,condition)=>{assert.ok(condition,name);evidence.push({name,passed:true});console.log('PASS '+name)};
async function qa(action){const r=await fetch(url+'/functions/v1/budget-qa',{method:'POST',headers:{'x-test-key':secret,'Content-Type':'application/json'},body:JSON.stringify({action})});const body=await r.json();assert.ok(r.ok,body.error);return body;}
async function call(user,path,method='GET',body,headers={}){
 const r=await fetch(url+path,{method,headers:{apikey:key,Authorization:'Bearer '+user.session.access_token,'Content-Type':'application/json',...headers},body:body===undefined?undefined:JSON.stringify(body)});
 const raw=await r.text();let data;try{data=JSON.parse(raw)}catch{data=raw}return {status:r.status,ok:r.ok,data};
}
const rest='/rest/v1/',rpc=rest+'rpc/';
try{
 const [a,b]=await qa('create');
 await writeFile('../qa-fixtures.json',JSON.stringify([a,b]));
 check('Two disposable users can sign in',!!a.session.access_token&&!!b.session.access_token);
 for(const u of [a,b]){const r=await call(u,rest+'bt_profiles','POST',{user_id:u.id,nickname:'qa.'+u.id.slice(0,12),currency:'AZN',time_zone:'Europe/Berlin'});check('Create own profile '+u.email.slice(-17,-16),r.ok);}
 const id=randomUUID(),entry={id,kind:'sale',amount:10,category:'delivery',note:'Disposable QA',entry_date:'2026-11-19',created_at:new Date().toISOString()};
 let r=await call(a,rpc+'bt_save_entries','POST',{items:[entry]});check('Create entry with server revision',r.ok&&r.data[0].row.amount===10);const first=r.data[0].row.updated_at;
 r=await call(b,rest+'bt_entries?id=eq.'+id);check('Other courier cannot read entry',r.ok&&r.data.length===0);
 r=await call(b,rest+'bt_entries','POST',{...entry,id:randomUUID(),user_id:a.id});check('Owner spoofing is rejected',!r.ok);
 r=await call(b,rpc+'bt_save_entries','POST',{items:[{...entry,amount:999}]});check('RPC cannot overwrite another owner',!r.ok);
 r=await call(a,rpc+'bt_save_entries','POST',{items:[{...entry,amount:20,expected_updated_at:first}]});check('Current device update succeeds',r.ok&&!r.data[0].conflict);
 r=await call(a,rpc+'bt_save_entries','POST',{items:[{...entry,amount:99,expected_updated_at:first}]});check('Stale device gets conflict and keeps newer amount',r.ok&&r.data[0].conflict&&r.data[0].row.amount===20);
 const day={...entry,id:randomUUID(),category:'daily',note:'kuryebro:day-balance:v1'};r=await call(a,rpc+'bt_save_entries','POST',{items:[day]});check('First daily balance saved',r.ok&&!r.data[0].conflict);r=await call(a,rpc+'bt_save_entries','POST',{items:[{...day,id:randomUUID()}]});check('Concurrent daily balance cannot duplicate earnings',r.ok&&r.data[0].conflict&&r.data[0].row.id===day.id);
 const session=randomUUID();r=await call(a,rest+'bt_sessions','POST',{id:session,user_id:a.id,started_at:new Date().toISOString(),ended_at:new Date().toISOString(),distance_m:0,duration_s:1,time_zone:'Europe/Berlin'});check('Own shift saved',r.ok);
 r=await call(b,rest+'bt_routes','POST',{session_id:session,user_id:b.id,points:[]});check('Foreign route parent rejected',!r.ok);
 r=await call(a,rest+'bt_routes','POST',{session_id:session,user_id:a.id,points:[]});check('Own route parent accepted',r.ok);
 const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB1sAAAAASUVORK5CYII=','base64');
 async function upload(u,path){return fetch(url+'/storage/v1/object/bt-receipts/'+path,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+u.session.access_token,'Content-Type':'image/png'},body:image})}
 check('Own receipt upload accepted',(await upload(a,a.id+'/'+id+'.png')).ok);
 check('Foreign receipt upload rejected',!(await upload(b,a.id+'/'+randomUUID()+'.png')).ok);
 r=await call(b,'/storage/v1/object/authenticated/bt-receipts/'+a.id+'/'+id+'.png');check('Foreign receipt download rejected',!r.ok);
 r=await call(b,rpc+'bt_overview','POST',{});check('Courier cannot call admin overview',!r.ok);
 r=await call(b,rpc+'bt_finish_reset','POST',{owner:a.id});check('Courier cannot invoke privileged deletion',!r.ok);
 const recovery=await qa('recovery');
 const verified=await fetch(url+'/auth/v1/verify',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({token_hash:recovery.hash,type:'recovery'})});const sessionBody=await verified.json();
 check('Recovery token can be verified',verified.ok&&!!sessionBody.access_token);
 const changedPassword=randomUUID()+'Aa!9';r=await call({session:sessionBody},'/auth/v1/user','PUT',{password:changedPassword});check('Recovery session can set a new password',r.ok);a.password=changedPassword;
 const login=await fetch(url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email:a.email,password:changedPassword})});const loginBody=await login.json();check('New password signs in',login.ok);a.session=loginBody;
 await writeFile('../qa-fixtures.json',JSON.stringify([a,b]));
 await qa('admin');r=await call(a,rpc+'bt_overview','POST',{});check('Administrator can read own test couriers',r.ok&&r.data.some(row=>row.user_id===b.id));
 const account='/functions/v1/budget-account';
 r=await call(a,account,'POST',{action:'preview'});check('Account preview returns administrator protection status',r.ok&&typeof r.data.lastAdmin==='boolean');
 r=await call(a,account,'POST',{action:'delete',mode:'data',confirm:'DELETE',password:'invalid'});check('Wrong password cannot delete data',r.status===403);
 r=await call(a,account,'POST',{action:'delete',mode:'data',confirm:'DELETE',password:a.password,userId:b.id});check('Deletion cannot target another user',r.status===400);
 await qa('shared');r=await call(b,account,'POST',{action:'preview'});check('Other application activity marks a shared login',r.ok&&r.data.shared);
 r=await call(b,account,'POST',{action:'delete',mode:'account',confirm:'DELETE',password:b.password});check('Shared login deletion blocked',r.status===409);
 r=await call(a,account,'POST',{action:'delete',mode:'data',confirm:'DELETE',password:a.password});check('KuryeBro data deletion completes',r.ok&&r.data.ok);
 r=await call(a,rest+'bt_entries','POST',{...entry,user_id:a.id});check('Old device cannot re-upload deleted entries',!r.ok);
 r=await call(a,rpc+'bt_lifecycle_status','POST',{});check('Reset epoch is available to the owner',r.ok&&!!r.data.epoch);const epoch=r.data.epoch;
 r=await call(a,rest+'bt_profiles','POST',{user_id:a.id,nickname:'qa.reset.'+a.id.slice(0,8),currency:'AZN'},{'x-bt-epoch':epoch});check('Acknowledged reset permits fresh records',r.ok);
 r=await call(a,'/storage/v1/object/authenticated/bt-receipts/'+a.id+'/'+id+'.png','GET',undefined,{'x-bt-epoch':epoch});check('Deleted receipt is no longer downloadable',!r.ok);
 r=await call(b,rest+'bt_profiles?user_id=eq.'+b.id);check('Other courier data survives deletion',r.ok&&r.data.length===1);
 await qa('unshared');r=await call(b,account,'POST',{action:'delete',mode:'account',confirm:'DELETE',password:b.password});check('Standalone login and its KuryeBro data can be deleted',r.ok&&r.data.ok);
 r=await call(b,'/auth/v1/user');check('Deleted identity is no longer valid',!r.ok);
}finally{
 const clean=await qa('cleanup');check('All disposable test identities removed',clean.remaining===0);
 await writeFile(resolve('../../outputs/KuryeBro-canli-hesap-testleri.json'),JSON.stringify({checkedAt:new Date().toISOString(),tests:evidence},null,2));
}
