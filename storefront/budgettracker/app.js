import '../src/fonts.css';
import './app.css';
import {T,CATS,CURRENCIES,AUDIO_LANGS} from './strings.js';

const SB_URL='https://yxiedrrahclzqukfnqrn.supabase.co',SB_KEY='sb_publishable_n0X-RVe8A6z9HviK4qsWAg_FgTTKJq2';
const APK_URL='/budgettracker/bakhy-budget.apk';
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS={get(k,d){try{const v=localStorage.getItem('bt.'+k);return v==null?d:JSON.parse(v)}catch{return d}},set(k,v){try{localStorage.setItem('bt.'+k,JSON.stringify(v))}catch{}}};
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today=()=>ymd(new Date());
const localDate=iso=>ymd(new Date(iso));
const weekStart=()=>{const d=new Date();d.setDate(d.getDate()-((d.getDay()+6)%7));return ymd(d)};
const ym=d=>d.slice(0,7);
const uuid=()=>crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:r&3|8).toString(16)});

const saved=LS.get('settings',{}),guess=()=>{const l=(navigator.language||'az').slice(0,2);return ['az','ru','en'].includes(l)?l:'az'};
const S={lang:saved.lang||guess(),cur:saved.cur||'AZN',sound:saved.sound!==false,user:null,nick:'',admin:false,demo:false,entries:[],goals:{daily:0,days:6},sessions:[],days:{},bench:undefined,active:null,pending:new Set(),photoQ:new Set(),dirty:{goals:false},lastSync:null,flags:{},tab:'home',filter:'all',overview:null,detail:null,workDetail:null,sheet:null,viewer:null,authMode:'signin',msg:'',syncing:false};
const t=()=>T[S.lang];
const sb=window.supabase?window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'bt.auth'}}):null;
const saveSettings=()=>LS.set('settings',{lang:S.lang,cur:S.cur,sound:S.sound});
const money=(n,cur=S.cur)=>{try{return new Intl.NumberFormat({az:'az-AZ',ru:'ru-RU',en:'en-GB'}[S.lang],{style:'currency',currency:cur,maximumFractionDigits:2}).format(n||0)}catch{return (n||0).toFixed(2)+' '+cur}};
const dateLabel=d=>{try{return new Date(d+'T00:00:00').toLocaleDateString({az:'az-AZ',ru:'ru-RU',en:'en-GB'}[S.lang],{day:'numeric',month:'long',weekday:'short'})}catch{return d}};
const live=()=>S.entries.filter(e=>!e.deleted_at);
const sum=(arr,k)=>arr.filter(e=>e.kind===k).reduce((a,e)=>a+e.amount,0);
const inMonth=(e,m)=>e.date.startsWith(m);
const catName=id=>t().cat[id]||id;
const fmtDur=s=>`${Math.floor(s/3600)}:${pad(Math.floor(s%3600/60))}`;
const kmOf=s=>(s.distance_m||0)/1000;

/* ---------- spoken feedback (files are provided separately) ---------- */
function say(name){if(!S.sound||!AUDIO_LANGS.includes(S.lang))return;try{new Audio(`/budgettracker/audio/${S.lang}/${name}.mp3`).play().catch(()=>{})}catch{}}

/* ---------- photo blobs live in IndexedDB until uploaded ---------- */
const demoPhotos=new Map();
const idb=(()=>{let p;const open=()=>p||(p=new Promise((res,rej)=>{const r=indexedDB.open('bt-photos',1);r.onupgradeneeded=()=>r.result.createObjectStore('p');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}));
 const tx=async(m,f)=>{const db=await open();return new Promise((res,rej)=>{const x=db.transaction('p',m),q=f(x.objectStore('p'));x.oncomplete=()=>res(q.result);x.onerror=()=>rej(x.error)})};
 return{put:(k,v)=>tx('readwrite',s=>s.put(v,k)),get:k=>tx('readonly',s=>s.get(k)),del:k=>tx('readwrite',s=>s.delete(k))}})();
async function compress(file){const bmp=await createImageBitmap(file),k=Math.min(1,1280/Math.max(bmp.width,bmp.height)),c=document.createElement('canvas');c.width=Math.round(bmp.width*k);c.height=Math.round(bmp.height*k);c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);return new Promise(r=>c.toBlob(r,'image/jpeg',.8))}

/* ---------- local store ---------- */
const uid=()=>S.demo?'demo':S.user?.id;
function persist(){if(S.demo||!S.user)return;LS.set('u.'+uid(),{entries:S.entries,goals:S.goals,sessions:S.sessions.slice(-60),days:S.days,active:S.active,pending:[...S.pending],photoQ:[...S.photoQ],dirty:S.dirty,lastSync:S.lastSync,flags:S.flags})}
function restore(){const d=S.demo?{}:LS.get('u.'+uid(),{});S.entries=d.entries||[];S.goals={daily:Number(d.goals&&(d.goals.daily??d.goals.sales))||0,days:Number(d.goals&&d.goals.days)||6};S.sessions=d.sessions||[];S.days=d.days||{};S.bench=undefined;S.active=d.active||null;S.pending=new Set(d.pending||[]);S.photoQ=new Set(d.photoQ||[]);S.dirty={goals:!!(d.dirty&&d.dirty.goals)};S.lastSync=d.lastSync||null;S.flags=d.flags||{}}

/* ---------- sync ---------- */
async function sync(){
 if(S.demo||!S.user||!sb||!navigator.onLine||S.syncing)return;S.syncing=true;
 try{
  for(const id of [...S.photoQ]){const e=S.entries.find(x=>x.id===id),blob=await idb.get(id);if(e&&blob&&e.photo_path){const {error}=await sb.storage.from('bt-receipts').upload(e.photo_path,blob,{contentType:'image/jpeg',upsert:true});if(error)throw error}S.photoQ.delete(id);await idb.del(id).catch(()=>{})}
  const todo=S.entries.filter(e=>S.pending.has(e.id));
  for(let i=0;i<todo.length;i+=100){
   const rows=todo.slice(i,i+100).map(e=>({id:e.id,kind:e.kind,amount:e.amount,category:e.category,note:e.note,entry_date:e.date,created_at:e.created_at,deleted_at:e.deleted_at||null,photo_path:e.photo_path||null}));
   const {error}=await sb.from('bt_entries').upsert(rows,{onConflict:'id'});if(error)throw error;rows.forEach(r=>S.pending.delete(r.id));
  }
  for(const s of S.sessions.filter(x=>x.dirty&&x.ended_at)){
   const {error}=await sb.from('bt_sessions').upsert({id:s.id,started_at:s.started_at,ended_at:s.ended_at,distance_m:s.distance_m,duration_s:s.duration_s});if(error)throw error;
   if(s.points&&s.points.length){const r=await sb.from('bt_routes').upsert({session_id:s.id,points:s.points});if(r.error)throw r.error}
   s.dirty=false;
  }
  for(const [day,v] of Object.entries(S.days).filter(([,v])=>v.dirty)){
   const {error}=await sb.from('bt_days').upsert({user_id:S.user.id,day,km:v.km,hours:v.hours});if(error)throw error;v.dirty=false;
  }
  if(S.dirty.goals){const {error}=await sb.from('bt_goals').upsert({user_id:S.user.id,daily_target:S.goals.daily,work_days:S.goals.days});if(error)throw error;S.dirty.goals=false}
  let q=sb.from('bt_entries').select('id,kind,amount,category,note,entry_date,created_at,updated_at,deleted_at,photo_path').order('updated_at',{ascending:true}).limit(1000);
  if(S.lastSync)q=q.gt('updated_at',S.lastSync);
  const {data,error}=await q;if(error)throw error;
  for(const r of data){const e={id:r.id,kind:r.kind,amount:Number(r.amount),category:r.category,note:r.note,date:r.entry_date,created_at:r.created_at,deleted_at:r.deleted_at,photo_path:r.photo_path};const i=S.entries.findIndex(x=>x.id===e.id);if(i<0)S.entries.push(e);else if(!S.pending.has(e.id))S.entries[i]=e;S.lastSync=r.updated_at}
  const ss=await sb.from('bt_sessions').select('id,started_at,ended_at,distance_m,duration_s').order('started_at',{ascending:false}).limit(100);
  if(ss.data)for(const r of ss.data){if(!S.sessions.some(x=>x.id===r.id)&&r.ended_at)S.sessions.push({...r,dirty:false})}
  const dd=await sb.from('bt_days').select('day,km,hours').order('day',{ascending:false}).limit(120);
  if(dd.data)for(const r of dd.data){const c=S.days[r.day];if(!c||!c.dirty)S.days[r.day]={km:Number(r.km),hours:Number(r.hours)}}
  if(!S.dirty.goals){const {data:g}=await sb.from('bt_goals').select('daily_target,work_days').maybeSingle();if(g)S.goals={daily:Number(g.daily_target),days:Number(g.work_days)||6}}
  persist();
 }catch(err){console.warn('sync failed',err)}finally{S.syncing=false;render()}
}

/* ---------- auth ---------- */
const NICK=/^[A-Za-z0-9_.-]{3,20}$/;
async function enter(user){
 S.user=user;S.demo=false;restore();S.tab='home';
 try{if(!(await ensureProfile())){render();return}}catch(e){console.warn(e)}
 try{const {data}=await sb.from('bt_admins').select('user_id').maybeSingle();S.admin=!!data}catch{S.admin=false}
 render();say('loginOk');if(S.active)startWatch();sync();
}
async function ensureProfile(){
 const {data}=await sb.from('bt_profiles').select('nickname,currency').eq('user_id',S.user.id).maybeSingle();
 if(data){S.nick=data.nickname;if(data.currency&&data.currency!==S.cur){S.cur=data.currency;saveSettings()}return true}
 const nick=S.user.user_metadata?.nickname;
 if(nick&&NICK.test(nick)){const r=await sb.from('bt_profiles').insert({nickname:nick,currency:S.cur});if(!r.error){S.nick=nick;return true}if(r.error.code!=='23505')throw r.error;S.msg=t().nickTaken}
 S.sheet={type:'nick'};return false;
}
async function submitAuth(){
 const email=$('#f-email').value.trim(),pw=$('#f-pw').value,signup=S.authMode==='signup';S.msg='';
 if(!email||!pw)return setMsg(t().badLogin);
 if(signup){
  const nick=$('#f-nick').value.trim();
  if(!NICK.test(nick))return setMsg(t().nickRule);
  if(pw.length<8)return setMsg(t().weakPw);
  if(!$('#f-consent').checked)return setMsg(t().consentNeed);
  const {data,error}=await sb.auth.signUp({email,password:pw,options:{data:{nickname:nick}}});
  if(error)return setMsg(error.message.includes('registered')?t().badLogin:error.message);
  if(data.session)return enter(data.session.user);
  S.authMode='signin';return setMsg(t().checkMail,true);
 }
 const {data,error}=await sb.auth.signInWithPassword({email,password:pw});
 if(error)return setMsg(t().badLogin);
 enter(data.user);
}
function setMsg(m,ok){S.msg=m;S.msgOk=!!ok;render()}
async function logout(){stopWatchOnly();if(S.demo){S.demo=false;S.user=null;S.entries=[];S.sessions=[];S.days={};S.bench=undefined;S.active=null;S.admin=false;render();return}await sb.auth.signOut();S.user=null;S.nick='';S.admin=false;S.entries=[];S.sessions=[];S.days={};S.bench=undefined;S.active=null;S.tab='home';render()}

/* ---------- GPS helpers (also used by the demo) ---------- */
const R=6371000,rad=x=>x*Math.PI/180;
function hav(a,b){const dl=rad(b[0]-a[0]),dg=rad(b[1]-a[1]),h=Math.sin(dl/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(h))}

/* ---------- demo data ---------- */
function walk(n,lat,lng){const pts=[];const t0=Math.floor(Date.now()/1000)-n*30;for(let i=0;i<n;i++){lat+=Math.sin(i/9)*0.0006+0.0002*Math.cos(i/4);lng+=0.0005+0.0003*Math.sin(i/13);pts.push([+lat.toFixed(5),+lng.toFixed(5),t0+i*30])}return pts}
function routeLen(p){let d=0;for(let i=1;i<p.length;i++)d+=hav(p[i-1],p[i]);return d}
function startDemo(admin){
 S.demo=true;S.user=null;S.nick='demo';S.admin=!!admin;S.tab='home';S.goals={daily:120,days:6};S.pending=new Set();S.flags={};S.active=null;
 const d=new Date(),mk=(back,kind,amount,category,note)=>{const x=new Date(d);x.setDate(d.getDate()-back);return{id:uuid(),kind,amount,category,note,date:ymd(x),created_at:x.toISOString(),deleted_at:null}};
 S.entries=[mk(0,'sale',38,'delivery',''),mk(0,'sale',22.5,'delivery',''),mk(0,'sale',6,'tip',''),mk(0,'expense',18,'fuel',''),mk(0,'expense',7.5,'food',''),mk(1,'sale',96,'delivery',''),mk(1,'sale',14,'bonus',''),mk(1,'expense',21,'fuel',''),mk(2,'sale',118,'delivery',''),mk(2,'expense',45,'repair','Zəncir'),mk(3,'sale',84,'delivery',''),mk(3,'expense',6,'parking','')];
 S.sessions=[0,1,2].map(b=>{const p=walk(70+b*15,40.4093+b*0.004,49.8671-b*0.003),dur=p.length*30+3600,st=new Date(Date.now()-b*864e5-dur*1000);return{id:uuid(),started_at:st.toISOString(),ended_at:new Date(st.getTime()+dur*1000).toISOString(),distance_m:Math.round(routeLen(p)),duration_s:dur,points:p,dirty:false}});
 S.days={};[[0,38.4,6.2],[1,64,8.5],[2,71,9],[3,52,7.4]].forEach(([b,km,h])=>{const x=new Date();x.setDate(x.getDate()-b);S.days[ymd(x)]={km,hours:h}});
 S.bench={couriers:7,earn_per_km:1.9,cost_per_km:.31,earn_per_hour:21.5};
 S.overview=[{nickname:'ali.kuryer',currency:'PLN',live_at:new Date().toISOString(),today_earn:132,today_expense:18,week_earn:540,daily_target:120,work_days:6,today_km:38.4,today_hours:6.2,month_earn:2940,total_earn:9810,last_activity:new Date().toISOString()},{nickname:'leyla_m',currency:'AZN',today_earn:74,today_expense:12,week_earn:410,daily_target:150,work_days:5,today_km:21.7,today_hours:4.1,month_earn:3120,total_earn:12120,last_activity:new Date(Date.now()-36e5).toISOString()}];
 render();say('welcome');
}

/* 30-day Warsaw simulation: real street geometry (OSRM, generated offline), modelled timing, pay and costs */
async function startWarsaw(){
 let r;try{r=await (await fetch('/budgettracker/warsaw30.json')).json()}catch{return startDemo(false)}
 S.demo=true;S.sim=true;S.user=null;S.nick='warsaw.sim';S.admin=false;S.tab='home';S.cur='PLN';S.goals={daily:320,days:6};S.pending=new Set();S.flags={};S.active=null;S.entries=[];S.sessions=[];S.days={};
 S.bench={couriers:11,earn_per_km:3.1,cost_per_km:.48,earn_per_hour:39};
 const now=Date.now();
 for(const d of r.days){
  const base=new Date();base.setDate(base.getDate()-d.back);base.setHours(0,0,0,0);const date=ymd(base),st=base.getTime()+d.start_h*3600e3;
  if(st+d.hours*3600e3>now)continue;
  const t0=Math.round(st/1000),pts=d.points.map(p=>[p[0],p[1],t0+p[2]]),dur=pts[pts.length-1][2]-pts[0][2],at=new Date(st+dur*1000).toISOString();
  S.sessions.push({id:uuid(),started_at:new Date(st).toISOString(),ended_at:at,distance_m:Math.round(routeLen(pts)),duration_s:dur,points:pts,dirty:false});
  S.days[date]={km:d.km,hours:d.hours};
  const mk=(kind,amount,category)=>S.entries.push({id:uuid(),kind,amount,category,note:'',date,created_at:at,deleted_at:null});
  mk('sale',d.earn,'daily');d.expenses.forEach(([c,a])=>mk('expense',a,c));
 }
 render();
}

/* ---------- entries ---------- */
async function addEntry({kind,amount,category,note,date,photo,quiet}){
 const e={id:uuid(),kind,amount,category,note,date,created_at:new Date().toISOString(),deleted_at:null};
 if(photo){e.photo_path=`${uid()}/${e.id}.jpg`;if(S.demo)demoPhotos.set(e.id,photo);else{await idb.put(e.id,photo).catch(()=>{});S.photoQ.add(e.id)}}
 S.entries.push(e);if(!S.demo)S.pending.add(e.id);
 const sound=quiet?null:alertFor(e);persist();if(sound)say(sound);sync();
}

/* ---------- day totals: one entry per day, with km and hours, and the per-km / per-hour numbers they give ---------- */
const n2=v=>Number(String(v??'').replace(',','.'))||0;
function dayNums(d){
 const en=live().filter(e=>e.date===d),r=S.days[d];let km=r?r.km:0,h=r?r.hours:0;
 if(!km||!h){const ss=S.sessions.filter(q=>q.ended_at&&localDate(q.started_at)===d);if(!km)km=ss.reduce((p,q)=>p+kmOf(q),0);if(!h)h=ss.reduce((p,q)=>p+(q.duration_s||0),0)/3600}
 return{earn:sum(en,'sale'),spent:sum(en,'expense'),km,h};
}
function ratios(n){const net=n.earn-n.spent;return{net,perKm:n.km>0?n.earn/n.km:null,costKm:n.km>0?n.spent/n.km:null,netKm:n.km>0?net/n.km:null,perHour:n.h>0?n.earn/n.h:null,netHour:n.h>0?net/n.h:null}}
function range30(){
 const a={net:0,k:{e:0,s:0,v:0},h:{e:0,s:0,v:0}};
 for(let i=0;i<30;i++){const x=new Date();x.setDate(x.getDate()-i);const n=dayNums(ymd(x));a.net+=n.earn-n.spent;if(n.km>0){a.k.e+=n.earn;a.k.s+=n.spent;a.k.v+=n.km}if(n.h>0){a.h.e+=n.earn;a.h.s+=n.spent;a.h.v+=n.h}}
 const k=a.k,h=a.h;
 return{any:k.v>0||h.v>0,net:a.net,perKm:k.v>0?k.e/k.v:null,costKm:k.v>0?k.s/k.v:null,netKm:k.v>0?(k.e-k.s)/k.v:null,perHour:h.v>0?h.e/h.v:null,netHour:h.v>0?(h.e-h.s)/h.v:null};
}
const kpi=(label,v)=>`<div><small>${esc(label)}</small><b>${v==null?'—':money(v)}</b></div>`;
function kpis(r,withNet=true){
 const x=t();
 return `<div class="kpis">${withNet?`<div class="wide pocket"><small>${esc(x.pocket)}</small><b>${money(r.net)}</b></div>`:''}${kpi(x.perKm,r.perKm)}${kpi(x.perHour,r.perHour)}${kpi(x.costKm,r.costKm)}${kpi(x.cost100,r.costKm==null?null:r.costKm*100)}${withNet?kpi(x.pocketKm,r.netKm)+kpi(x.pocketHour,r.netHour):''}</div>`;
}
async function loadBench(){
 S.bench=null;
 try{const {data}=await sb.rpc('bt_benchmarks'),r=Array.isArray(data)?data[0]:data,f=v=>v==null?null:Number(v);
  if(r&&(r.earn_per_km!=null||r.cost_per_km!=null||r.earn_per_hour!=null))S.bench={couriers:r.couriers,earn_per_km:f(r.earn_per_km),cost_per_km:f(r.cost_per_km),earn_per_hour:f(r.earn_per_hour)}}catch(e){console.warn(e)}
 render();
}
function statsCard(){
 const x=t(),n=dayNums(today()),has=n.km>0||n.h>0,m=range30(),b=S.bench;
 if(S.bench===undefined&&!S.demo&&sb&&S.user)loadBench();
 return `<section class="card"><h3>${esc(x.statsTitle)}</h3>${has?`<small class="muted">${esc(x.statsToday)}</small>${kpis(ratios(n))}`:`<p class="muted">${esc(x.statsNone)}</p>`}${m.any?`<small class="muted">${esc(x.stats30)}</small>${kpis(m)}`:''}${b?`<small class="muted">${esc(x.avgCourier)} · ${esc(x.stats30)}</small>${kpis({perKm:b.earn_per_km,perHour:b.earn_per_hour,costKm:b.cost_per_km},false)}<small class="muted">${esc(x.benchNote)}</small>`:''}</section>`;
}
function fillDay(sh){
 const en=live().filter(e=>e.date===sh.date&&e.category==='daily'),r=S.days[sh.date],v=n=>n?String(n):'';
 sh.earn=v(sum(en,'sale'));sh.spent=v(sum(en,'expense'));sh.km=v(r&&r.km);sh.hours=v(r&&r.hours);
}
function openDay(){S.sheet={type:'day',date:today()};fillDay(S.sheet)}
function dayPrev(sh){
 const earn=n2(sh.earn),spent=n2(sh.spent),km=n2(sh.km),h=n2(sh.hours);
 return earn>0&&(km>0||h>0)?kpis(ratios({earn,spent,km,h})):'';
}
function syncDayForm(){
 const sh=S.sheet;if(!sh||sh.type!=='day')return;
 const date=$('#d-date').value;
 if(date&&date!==sh.date){sh.date=date;fillDay(sh);$('#d-earn').value=sh.earn;$('#d-spent').value=sh.spent;$('#d-km').value=sh.km;$('#d-h').value=sh.hours}
 else{sh.earn=$('#d-earn').value;sh.spent=$('#d-spent').value;sh.km=$('#d-km').value;sh.hours=$('#d-h').value}
 $('#day-prev').innerHTML=dayPrev(sh);
 const ex=$('#day-ex');if(ex)ex.hidden=!live().some(e=>e.date===sh.date&&e.category==='daily');
}
function saveDay(){
 syncDayForm();const sh=S.sheet,earn=n2(sh.earn),spent=n2(sh.spent),km=Math.min(4999,n2(sh.km)),h=Math.min(24,n2(sh.hours)),date=sh.date||today();
 if(!(earn>0)||earn>=1e9){say('error');return}
 const now=new Date().toISOString();
 live().filter(e=>e.date===date&&e.category==='daily').forEach(e=>{e.deleted_at=now;if(!S.demo)S.pending.add(e.id)});
 S.days[date]={km:Math.round(km*10)/10,hours:Math.round(h*10)/10,dirty:!S.demo};
 addEntry({kind:'sale',amount:earn,category:'daily',note:'',date});
 if(spent>0)addEntry({kind:'expense',amount:spent,category:'daily',note:'',date,quiet:true});
 closeSheet();
}
function alertFor(e){
 if(e.kind==='sale'&&S.goals.daily>0&&e.date===today()){
  const s=sum(live().filter(x=>x.date===e.date),'sale'),a=`gd.${e.date}`,b=`gh.${e.date}`;
  if(s>=S.goals.daily&&!S.flags[a]){S.flags[a]=1;return 'goalDone'}
  if(s>=S.goals.daily/2&&!S.flags[b]){S.flags[b]=1;return 'goalHalf'}
 }
 return e.kind+'Added';
}
function removeEntry(id){const e=S.entries.find(x=>x.id===id);if(!e)return;e.deleted_at=new Date().toISOString();if(!S.demo)S.pending.add(id);persist();say('deleted');sync();render()}
async function openPhoto(id,path){
 let blob=S.demo?demoPhotos.get(id):await idb.get(id).catch(()=>null);
 if(!blob&&path&&sb){const r=await sb.storage.from('bt-receipts').download(path);if(!r.error)blob=r.data}
 if(!blob){alert(t().photoErr);return}
 S.viewer=URL.createObjectURL(blob);render();
}

/* ---------- GPS work sessions ---------- */
let watchId=null,tick=null,wake=null,lastLive=0;
async function lockScreen(){try{wake=await navigator.wakeLock?.request('screen')}catch{}}
function startWatch(){
 if(!navigator.geolocation||watchId!==null)return;
 watchId=navigator.geolocation.watchPosition(onPos,err=>{if(err.code===1){S.msg=t().gpsDenied;stopWork()}},{enableHighAccuracy:true,maximumAge:5000,timeout:30000});
 tick=setInterval(()=>{const c=$('#clock');if(c&&S.active)c.textContent=fmtDur(Math.round((Date.now()-new Date(S.active.started_at))/1000))},1000);lockScreen();
}
function stopWatchOnly(){if(watchId!==null&&navigator.geolocation)navigator.geolocation.clearWatch(watchId);watchId=null;clearInterval(tick);tick=null;try{wake&&wake.release()}catch{}wake=null}
function onPos(p){
 const a=S.active;if(!a)return;const c=p.coords;if(c.accuracy>60)return;
 const pt=[+c.latitude.toFixed(5),+c.longitude.toFixed(5),Math.round(p.timestamp/1000)],last=a.points[a.points.length-1];
 if(last){const d=hav(last,pt);if(d<8)return;if(d>3000&&pt[2]-last[2]<30)return;a.distance_m+=d}
 a.points.push(pt);persist();const k=$('#live-km');if(k)k.textContent=(a.distance_m/1000).toFixed(2);
 const sp=$('#live-spd'),av=$('#live-avg');if(sp)sp.textContent=c.speed!=null&&c.speed>=0?(c.speed*3.6).toFixed(0):'—';if(av)av.textContent=kmhTxt(moveStats(a.points).kmh);updateLiveMap(a);
 if(!S.demo&&sb&&S.user&&navigator.onLine&&Date.now()-lastLive>30000){lastLive=Date.now();sb.from('bt_live').upsert({user_id:S.user.id,session_id:a.id,lat:pt[0],lng:pt[1],accuracy:Math.round(c.accuracy)}).then(()=>{})}
}
function startWork(){
 if(!navigator.geolocation){S.msg=t().noGps;return render()}
 S.msg='';S.active={id:uuid(),started_at:new Date().toISOString(),points:[],distance_m:0};persist();startWatch();render();
}
function stopWork(){
 const a=S.active;stopWatchOnly();if(!a){render();return}
 const end=new Date(),dur=Math.max(1,Math.round((end-new Date(a.started_at))/1000)),n=a.points.length,step=Math.max(1,Math.ceil(n/4000));
 S.sessions.push({id:a.id,started_at:a.started_at,ended_at:end.toISOString(),distance_m:Math.round(a.distance_m),duration_s:dur,points:a.points.filter((_,i)=>i%step===0),dirty:!S.demo});
 if(!S.demo&&sb&&S.user)sb.from('bt_live').delete().eq('user_id',S.user.id).then(()=>{});
 S.active=null;persist();sync();render();
}
/* moving speed: segments slower than 1 m/s count as standing still and stay out of the average */
function moveStats(p){
 let mv=0,st=0,dist=0,mx=0;
 for(let i=1;i<p.length;i++){const dt=p[i][2]-p[i-1][2];if(dt<=0)continue;const d=hav(p[i-1],p[i]),v=d/dt;if(v>=1&&v<45){mv+=dt;dist+=d;if(dt<=60&&v>mx)mx=v}else st+=dt}
 return{moveS:mv,stopS:st,kmh:mv>=30?dist/mv*3.6:null,maxKmh:mx*3.6};
}
const kmhTxt=v=>v==null?'—':v.toFixed(1);
function sessStat(s){
 const ms=s.points&&s.points.length>1?moveStats(s.points):null,km=kmOf(s),mv=ms&&ms.moveS>0?ms.moveS:(s.duration_s||0);
 return{km,sec:s.duration_s||0,mv,kmh:ms&&ms.kmh!=null?ms.kmh:(mv>=30?km/(mv/3600):null)};
}
function sumSess(arr){
 let km=0,mv=0,sec=0;arr.forEach(s=>{const q=sessStat(s);km+=q.km;mv+=q.mv;sec+=q.sec});
 return{km,sec,mv,kmh:mv>=30?km/(mv/3600):null};
}
function periodCard(done){
 const x=t(),ws=weekStart(),m=ym(today()),blocks=[[x.today,done.filter(s=>localDate(s.started_at)===today())],[x.thisWeek,done.filter(s=>localDate(s.started_at)>=ws)],[x.month,done.filter(s=>localDate(s.started_at).startsWith(m))]];
 return `<section class="card"><h3>${esc(x.historyStats)}</h3><div class="pgrid">${blocks.map(([l,a])=>{const q=sumSess(a);return `<div><small>${esc(l)}</small><b>${q.km.toFixed(1)} ${esc(x.km)}</b><span>${fmtDur(q.sec)} ${esc(x.hours)}</span><span>${kmhTxt(q.kmh)} ${esc(x.kmh)}</span></div>`}).join('')}</div><small class="muted">${esc(x.speedNote)}</small></section>`;
}
function historyCard(done){
 const x=t(),g={};done.forEach(s=>{const d=localDate(s.started_at);(g[d]=g[d]||[]).push(s)});
 const days=Object.keys(g).sort().reverse().slice(0,30);
 return `<section class="card"><h3>${esc(x.routesTitle)}</h3>${days.length?days.map(d=>{const q=sumSess(g[d]);return `<div class="dayhead"><strong>${esc(dateLabel(d))}</strong><small>${q.km.toFixed(1)} ${esc(x.km)} · ${fmtDur(q.sec)} ${esc(x.hours)} · ${kmhTxt(q.kmh)} ${esc(x.kmh)}</small></div><ul class="rows">${g[d].map(s=>{const z=sessStat(s);return `<li class="entry"><button class="sess" data-act="session" data-id="${s.id}"><span class="mini">${routeSvg(s.points,120,80)}</span><div><strong>${new Date(s.started_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</strong><small>${fmtDur(s.duration_s)} ${esc(x.hours)} · ${kmhTxt(z.kmh)} ${esc(x.kmh)}</small></div><b>${z.km.toFixed(1)} ${esc(x.km)}</b></button></li>`}).join('')}</ul>`}).join(''):`<p class="muted">${esc(x.noSessions)}</p>`}</section>`;
}
function moveGrid(points,s){
 const x=t(),m=moveStats(points||[]);
 return `<div class="stats wrap"><div><small>${esc(x.moveTime)}</small><b>${fmtDur(m.moveS)}</b></div><div><small>${esc(x.stoppedTime)}</small><b>${fmtDur(m.stopS)}</b></div><div><small>${esc(x.avgMove)}</small><b>${kmhTxt(m.kmh)} ${esc(x.kmh)}</b></div><div><small>${esc(x.maxSpeed)}</small><b>${m.maxKmh>0?m.maxKmh.toFixed(0):'—'} ${esc(x.kmh)}</b></div></div>`;
}
function sessionsAll(){const arr=[...S.sessions];if(S.active)arr.push({...S.active,duration_s:Math.round((Date.now()-new Date(S.active.started_at))/1000),ended_at:null});return arr.sort((a,b)=>b.started_at.localeCompare(a.started_at))}
function routeSvg(points,w=320,h=220){
 if(!points||points.length<2)return `<svg class="route" viewBox="0 0 ${w} ${h}" aria-hidden="true"><rect class="bg" width="${w}" height="${h}" rx="16"/></svg>`;
 const lat0=points.reduce((a,p)=>a+p[0],0)/points.length,k=Math.cos(rad(lat0)),xs=points.map(p=>p[1]*k),ys=points.map(p=>-p[0]);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),sc=Math.min((w-32)/((maxX-minX)||1e-6),(h-32)/((maxY-minY)||1e-6)),ox=(w-(maxX-minX)*sc)/2,oy=(h-(maxY-minY)*sc)/2;
 const P=points.map((p,i)=>[(xs[i]-minX)*sc+ox,(ys[i]-minY)*sc+oy].map(v=>v.toFixed(1))),a=P[0],b=P[P.length-1];
 const grid=[1,2,3].map(i=>`<line x1="${w/4*i}" y1="0" x2="${w/4*i}" y2="${h}"/><line x1="0" y1="${h/4*i}" x2="${w}" y2="${h/4*i}"/>`).join('');
 return `<svg class="route" viewBox="0 0 ${w} ${h}" aria-hidden="true"><rect class="bg" width="${w}" height="${h}" rx="16"/><g class="grid">${grid}</g><polyline class="line" points="${P.map(q=>q.join(',')).join(' ')}"/><circle class="start" cx="${a[0]}" cy="${a[1]}" r="6"/><circle class="end" cx="${b[0]}" cy="${b[1]}" r="6"/></svg>`;
}
async function openSession(id){
 const s=S.sessions.find(x=>x.id===id);if(!s)return;
 if(!s.points&&!S.demo&&sb){const r=await sb.from('bt_routes').select('points').eq('session_id',id).maybeSingle();s.points=r.data?r.data.points:[]}
 S.workDetail=s;render();
}

/* ---------- maps: real tiles (OpenStreetMap via Leaflet), or Google Maps when BT_CONFIG.googleMapsKey is set ---------- */
let leafletP=null,googleP=null,liveM=null;
function loadLeaflet(){return leafletP||(leafletP=new Promise((res,rej)=>{if(window.L)return res(window.L);const l=document.createElement('link');l.rel='stylesheet';l.href='/vendor/leaflet/leaflet.css';document.head.appendChild(l);const sc=document.createElement('script');sc.src='/vendor/leaflet/leaflet.js';sc.onload=()=>res(window.L);sc.onerror=()=>rej(new Error('leaflet'));document.head.appendChild(sc)}))}
function loadGoogle(key){return googleP||(googleP=new Promise((res,rej)=>{if(window.google&&window.google.maps)return res(window.google);window.__btGmap=()=>res(window.google);const sc=document.createElement('script');sc.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(key)+'&callback=__btGmap&loading=async';sc.async=true;sc.onerror=()=>rej(new Error('google'));document.head.appendChild(sc)}))}
function mapBox(points,stops,id,live){return `<div class="map"${id?` id="${id}"`:''} data-map data-points="${esc(JSON.stringify(points||[]))}" data-stops="${esc(JSON.stringify(stops||[]))}"${live?` data-live="${esc(JSON.stringify(live))}"`:''}>${routeSvg(points)}</div>`}
async function drawMap(el){
 let pts=[],stops=[],live=null;try{pts=JSON.parse(el.dataset.points||'[]');stops=JSON.parse(el.dataset.stops||'[]');live=el.dataset.live?JSON.parse(el.dataset.live):null}catch{}
 if(!pts.length&&!live)return;
 try{
  const key=window.BT_CONFIG&&window.BT_CONFIG.googleMapsKey,all=pts.map(p=>[p[0],p[1]]);if(live)all.push([live.lat,live.lng]);
  if(key){
   const g=await loadGoogle(key);el.innerHTML='';const map=new g.maps.Map(el,{mapTypeControl:false,streetViewControl:false,fullscreenControl:false}),b=new g.maps.LatLngBounds();
   const path=pts.map(p=>({lat:p[0],lng:p[1]}));if(path.length>1)new g.maps.Polyline({path,strokeColor:'#0a84ff',strokeWeight:4,map});
   if(path.length){new g.maps.Marker({position:path[0],map,label:'A'});new g.maps.Marker({position:path[path.length-1],map,label:'B'})}
   stops.forEach((st,k)=>new g.maps.Marker({position:{lat:st.lat,lng:st.lng},map,label:String(k+1)}));
   if(live)new g.maps.Marker({position:{lat:live.lat,lng:live.lng},map,label:'●'});
   all.forEach(q=>b.extend({lat:q[0],lng:q[1]}));map.fitBounds(b);return;
  }
  const L=await loadLeaflet();el.innerHTML='';const map=L.map(el,{zoomControl:true,zoomSnap:.25});
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(map);
  let line=null,end=null;
  if(all.length>1&&pts.length>1){
   if(el.id!=='live-map'&&pts[0].length>2){
    L.polyline(pts.map(p=>[p[0],p[1]]),{color:'#fff',weight:8,opacity:.9,lineJoin:'round'}).addTo(map);
    speedRuns(pts).forEach(r=>L.polyline(r.pts,{color:['#e5433a','#0a84ff','#1f9d55'][r.c],weight:5,lineJoin:'round'}).addTo(map));
   }else line=L.polyline(pts.map(p=>[p[0],p[1]]),{color:'#0a84ff',weight:4}).addTo(map);
  }
  if(pts.length){L.circleMarker([pts[0][0],pts[0][1]],{radius:7,color:'#fff',weight:2,fillColor:'#1f9d55',fillOpacity:1}).addTo(map);end=L.circleMarker([pts[pts.length-1][0],pts[pts.length-1][1]],{radius:7,color:'#fff',weight:2,fillColor:'#e5433a',fillOpacity:1}).addTo(map)}
  stops.forEach((st,k)=>L.circleMarker([st.lat,st.lng],{radius:11,color:'#fff',weight:2,fillColor:'#ff9f0a',fillOpacity:1}).bindTooltip(String(k+1),{permanent:true,direction:'center',className:'stop-tip'}).addTo(map));
  if(live)L.circleMarker([live.lat,live.lng],{radius:9,color:'#fff',weight:3,fillColor:'#0a84ff',fillOpacity:1}).addTo(map);
  if(all.length===1)map.setView(all[0],16);else map.fitBounds(L.latLngBounds(all).pad(.2),{maxZoom:17});
  setTimeout(()=>{map.invalidateSize();if(all.length>1)map.fitBounds(L.latLngBounds(all).pad(.15),{maxZoom:17})},120);
  if(el.id==='live-map')liveM={map,line,end,L};
 }catch(err){console.warn('map',err);if(!el.querySelector('svg'))el.textContent=t().mapErr}
}
/* route colour by speed: red = slow or standing, blue = medium, green = fast */
function speedRuns(pts){
 const runs=[];let cur=null;
 for(let i=1;i<pts.length;i++){const dt=pts[i][2]-pts[i-1][2],v=dt>0?hav(pts[i-1],pts[i])/dt*3.6:0,c=v<10?0:v<25?1:2;if(!cur||cur.c!==c){cur={c,pts:[[pts[i-1][0],pts[i-1][1]]]};runs.push(cur)}cur.pts.push([pts[i][0],pts[i][1]])}
 return runs;
}
const legend=()=>{const x=t();return `<div class="legend"><span class="l0"></span>${esc(x.legSlow)}<span class="l1"></span>${esc(x.legMid)}<span class="l2"></span>${esc(x.legFast)}</div>`};
function updateLiveMap(a){
 const last=a.points[a.points.length-1];if(!last)return;
 if(!liveM){const el=$('#live-map');if(el){el.dataset.points=JSON.stringify(a.points);drawMap(el)}return}
 const ll=[last[0],last[1]],{map,L}=liveM;
 if(!liveM.line)liveM.line=L.polyline([ll],{color:'#0a84ff',weight:4}).addTo(map);else liveM.line.addLatLng(ll);
 if(!liveM.end)liveM.end=L.circleMarker(ll,{radius:7,color:'#fff',weight:2,fillColor:'#e5433a',fillOpacity:1}).addTo(map);else liveM.end.setLatLng(ll);
 map.panTo(ll);
}
function findStops(p){
 const out=[];let i=0;
 while(i<p.length){let j=i;while(j+1<p.length&&hav(p[i],p[j+1])<60)j++;const dur=p[j][2]-p[i][2];if(dur>=180){out.push({lat:p[i][0],lng:p[i][1],t:p[i][2],min:Math.round(dur/60)});i=j+1}else i++}
 return out;
}
const stopsHtml=(stops)=>{const x=t();return `<h3>${esc(x.stopsTitle)}</h3>${stops.length?`<ul class="rows">${stops.map((st,k)=>`<li class="entry"><div><strong>${k+1}</strong> <small>${new Date(st.t*1000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</small></div><b>${esc(x.stopLine.replace('{m}',st.min))}</b></li>`).join('')}</ul>`:`<p class="muted">${esc(x.noStops)}</p>`}`};
function monthPlan(){
 const n=new Date(),dim=new Date(n.getFullYear(),n.getMonth()+1,0).getDate(),el=n.getDate(),target=S.goals.daily*S.goals.days*dim/7;
 const earn=sum(live().filter(e=>inMonth(e,ym(today()))),'sale'),left=dim-el,daysLeft=Math.max(1,Math.round(left*S.goals.days/7));
 return {target,earn,forecast:el>0?earn/el*dim:0,need:target>earn&&left>0?(target-earn)/daysLeft:0,total:Math.max(1,Math.round(S.goals.days*dim/7)),units:S.goals.daily>0?earn/S.goals.daily:0};
}
function advice(plan){
 const x=t(),m=ym(today()),mon=live().filter(e=>inMonth(e,m)),earn=sum(mon,'sale'),exp=sum(mon,'expense'),by={};
 mon.filter(e=>e.kind==='expense').forEach(e=>by[e.category]=(by[e.category]||0)+e.amount);
 const fill=(str,o)=>str.replace(/\{(\w+)\}/g,(_,k)=>o[k]),pc=v=>Math.round(v/earn*100),tips=[];
 if(earn>0){
  if((by.fuel||0)/earn>=.25)tips.push(fill(x.tipFuel,{p:pc(by.fuel)}));
  if((by.food||0)/earn>=.12)tips.push(fill(x.tipFood,{p:pc(by.food)}));
  if(exp/earn>=.4){const top=Object.entries(by).sort((a,b)=>b[1]-a[1])[0];tips.push(fill(x.tipTotal,{p:pc(exp),c:top?catName(top[0]):''}))}
 }
 if(by.fine>0)tips.push(fill(x.tipFine,{a:money(by.fine)}));
 if(by.repair>0&&(!earn||by.repair/earn>=.1))tips.push(fill(x.tipRepair,{a:money(by.repair)}));
 const ws=weekStart(),lw=new Date(ws+'T00:00:00');lw.setDate(lw.getDate()-7);const lws=ymd(lw),thisW=sum(live().filter(e=>e.date>=ws),'expense'),lastW=sum(live().filter(e=>e.date>=lws&&e.date<ws),'expense');
 if(lastW>0&&thisW>lastW*1.2)tips.push(fill(x.tipWeek,{p:Math.round((thisW/lastW-1)*100)}));
 const km=S.sessions.filter(q=>localDate(q.started_at).startsWith(m)).reduce((p,q)=>p+kmOf(q),0);
 if(km>=5&&by.fuel>0)tips.push(fill(x.tipKm,{a:money(by.fuel/km)}));
 if(plan.need>0&&plan.target>0)tips.push(fill(x.tipPace,{a:money(plan.need)}));
 if(!tips.length&&earn>0&&exp/earn<.3)tips.push(fill(x.tipGood,{p:pc(exp)}));
 return tips.slice(0,4);
}

/* ---------- 3D cash bundles: one bundle per working day of the month, stacked by week; solid = earned, dashed = still to earn ---------- */
function bundlesSvg(units,total,perCol){
 const W=27,D=13.5,H=12,pad=8,cols=Math.ceil(total/perCol),lv=Math.min(perCol,total),y00=pad+lv*H+2*D,vw=(cols+1)*W+2*pad,vh=y00+(cols-1)*D+pad;
 const block=(cx,yb,h,ghost)=>{
  const ty=yb-h-2*D,fl=`${cx-W},${ty+D}`,fr=`${cx+W},${ty+D}`,tp=`${cx},${ty}`,fb=`${cx},${ty+2*D}`,g=ghost?' ghost':'';
  let o=`<polygon class="left${g}" points="${fl} ${fb} ${cx},${yb} ${cx-W},${yb-D}"/><polygon class="right${g}" points="${fb} ${fr} ${cx+W},${yb-D} ${cx},${yb}"/><polygon class="top${g}" points="${tp} ${fr} ${fb} ${fl}"/>`;
  if(ghost||h<7)return o;
  const k=D/W,x1=cx-W*.62,x2=cx-W*.38,y1=ty+D+(x1-(cx-W))*k,y2=ty+D+(x2-(cx-W))*k,r1=cx+W*.38,r2=cx+W*.62,s1=ty+2*D-(r1-cx)*k,s2=ty+2*D-(r2-cx)*k;
  o+=`<polygon class="band" points="${x1},${y1} ${x2},${y2} ${x2},${y2+h} ${x1},${y1+h}"/><polygon class="band" points="${r1},${s1} ${r2},${s2} ${r2},${s2+h} ${r1},${s1+h}"/>`;
  for(const f of [.34,.67])o+=`<line class="edge" x1="${cx-W}" y1="${ty+D+h*f}" x2="${cx}" y2="${ty+2*D+h*f}"/><line class="edge" x1="${cx}" y1="${ty+2*D+h*f}" x2="${cx+W}" y2="${ty+D+h*f}"/>`;
  return o;
 };
 let out=`<defs><linearGradient id="gTop" x1="0" y1="0" x2="1" y2="1"><stop class="t1" offset="0"/><stop class="t2" offset="1"/></linearGradient><linearGradient id="gLeft" x1="0" y1="0" x2="0" y2="1"><stop class="l1" offset="0"/><stop class="l2" offset="1"/></linearGradient><linearGradient id="gRight" x1="0" y1="0" x2="0" y2="1"><stop class="r1" offset="0"/><stop class="r2" offset="1"/></linearGradient></defs>`;
 for(let c=0;c<cols;c++){
  const cx=pad+W+c*W,yb0=y00+c*D;
  out+=`<polygon class="shadow" points="${cx},${yb0-2*D+4} ${cx+W},${yb0-D+4} ${cx},${yb0+4} ${cx-W},${yb0-D+4}"/>`;
  for(let l=0;l<perCol;l++){
   const i=c*perCol+l;if(i>=total)break;
   const f=Math.max(0,Math.min(1,units-i)),yb=yb0-l*H;
   if(f>=.999)out+=block(cx,yb,H,false);else if(f<=.001)out+=block(cx,yb,H,true);else out+=block(cx,yb,H*f,false)+block(cx,yb-H*f,H*(1-f),true);
  }
 }
 return `<svg class="bundles" viewBox="0 0 ${vw} ${vh}" role="img" aria-label="${esc(t().monthBales.replace('{n}',total))}">${out}</svg>`;
}

/* ---------- views ---------- */
const ICON={home:'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',list:'M4 6h16M4 12h16M4 18h10',add:'M12 5v14M5 12h14',work:'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',settings:'M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6',watch:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'};
const icon=n=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;

function authView(){
 const x=t(),signup=S.authMode==='signup';
 return `<main class="auth"><section class="hero"><div class="brand"><span class="logo">K</span><span>${esc(x.app)}</span></div><h1>${esc(x.tagline)}</h1><h2>${esc(x.featTitle)}</h2><ul class="feats">${x.feats.map(f=>`<li>${esc(f)}</li>`).join('')}</ul><div class="hero-actions"><button class="btn dark" data-act="apk">${esc(x.apkBtn)}</button><button class="btn ghost" data-act="demo">${esc(x.demo)}</button></div>${langBar()}</section>
 <form class="card form" data-act="auth" novalidate><h2>${esc(signup?x.signup:x.signin)}</h2>
 <label>${esc(x.email)}<input id="f-email" type="email" autocomplete="email" inputmode="email"></label>
 <label>${esc(x.password)}<input id="f-pw" type="password" autocomplete="${signup?'new-password':'current-password'}"></label>
 ${signup?`<label>${esc(x.nickname)}<input id="f-nick" autocomplete="username" maxlength="20"><small>${esc(x.nickRule)}</small></label><div class="notice slim"><label class="check"><input id="f-consent" type="checkbox"> ${esc(x.consent)}</label>${supMore()}</div>`:''}
 ${S.msg?`<p class="msg${S.msgOk?' ok':''}" role="alert">${esc(S.msg)}</p>`:''}
 <button class="btn primary" type="submit">${esc(signup?x.signup:x.signin)}</button>
 <button class="link" type="button" data-act="mode">${esc(signup?x.haveAcc:x.noAcc)}</button></form>
 <dialog id="apk"><div class="dlg"><h2>${esc(x.apkTitle)}</h2><ul class="feats">${x.feats.map(f=>`<li>${esc(f)}</li>`).join('')}</ul><div class="notice slim"><label class="check"><input id="apk-ok" type="checkbox"> ${esc(x.consent)}</label>${supMore()}</div><p class="msg" id="apk-soon" hidden>${esc(x.apkSoon)}</p><div class="row"><a id="apk-go" class="btn primary" href="${APK_URL}" download aria-disabled="true">${esc(x.apkGo)}</a><button class="btn ghost" data-act="apk-close" type="button">${esc(x.close)}</button></div></div></dialog></main>`;
}
const supMore=()=>{const x=t();return `<details class="sup"><summary>${esc(x.supShort)} <u>${esc(x.supMore)}</u></summary><p>${esc(x.supNotice)}</p></details>`};
function langBar(){return `<div class="seg" role="group" aria-label="Language">${['az','ru','en'].map(l=>`<button type="button" data-act="lang" data-v="${l}" aria-pressed="${S.lang===l}">${l.toUpperCase()}</button>`).join('')}</div>`}

function appView(){
 const x=t(),tabs=['home','list','add','work','settings'];if(S.admin)tabs.push('watch');
 const body={home:homeView,list:listView,settings:settingsView,watch:watchView,work:workView,add:homeView}[S.tab]();
 return `${S.demo?`<div class="demo-bar">${esc(S.sim?x.simBanner:x.demoBanner)} <button class="link" data-act="logout">${esc(x.exitDemo)}</button></div>`:''}<div class="shell"><header class="top"><span class="brand small"><span class="logo">K</span>${esc(x.app)}</span><span class="who">${esc(S.nick)}${!navigator.onLine?` · ${esc(x.offline)}`:S.pending.size?` · ${esc(x.pending)}: ${S.pending.size}`:''}</span></header><main class="view">${body}</main>
 <nav class="tabs" aria-label="Navigation">${tabs.map(k=>`<button data-act="tab" data-v="${k}" class="${k==='add'?'plus':''}" aria-current="${S.tab===k&&k!=='add'}" aria-label="${esc(x[k])}">${icon(k)}<span>${esc(x[k])}</span></button>`).join('')}</nav></div>${S.sheet?sheetView():''}${S.viewer?`<div class="sheet-bg" data-act="viewer-close"><div class="viewer"><img src="${S.viewer}" alt=""><button class="btn ghost" data-act="viewer-close">${esc(x.close)}</button></div></div>`:''}`;
}
function homeView(){
 const x=t(),d=today(),m=ym(d),day=live().filter(e=>e.date===d),mon=live().filter(e=>inMonth(e,m)),wk=live().filter(e=>e.date>=weekStart());
 const earn=sum(day,'sale'),spent=sum(day,'expense'),goal=S.goals.daily,days=S.goals.days||6,pct=goal>0?Math.min(100,Math.round(earn/goal*100)):0,left=Math.max(0,goal-earn),done=goal>0&&earn>=goal;
 const weekEarn=sum(wk,'sale'),byCat={};day.filter(e=>e.kind==='expense').forEach(e=>byCat[e.category]=(byCat[e.category]||0)+e.amount);
 const recent=live().sort((a,b)=>b.date.localeCompare(a.date)||b.created_at.localeCompare(a.created_at)).slice(0,5);
 const C=2*Math.PI*40,len=C*pct/100,plan=monthPlan(),tips=advice(plan),mpct=plan.target>0?Math.min(100,Math.round(plan.earn/plan.target*100)):0;
 return `<section class="card bales"><div class="bales-wrap"><div class="bales-art">${goal>0?bundlesSvg(plan.units,plan.total,Math.max(days,4)):''}</div><div class="bales-text"><small>${esc(x.monthBales.replace('{n}',plan.total))}</small>${goal>0?`<strong class="big">${money(plan.earn)}</strong><span class="muted">${esc(x.of)} ${money(plan.target)} · ${mpct}%</span><span class="muted">${esc(x.forecast)}: <b>${money(plan.forecast)}</b></span><span class="muted tiny">${esc(x.baleHint)}</span>`:`<span class="muted">${esc(x.noBales)}</span>`}</div></div></section>
 <section class="card goal"><small>${esc(x.today)} · ${esc(x.dailyGoal)}</small><div class="goal-row"><div class="goal-ring"><svg class="ring goalring" viewBox="0 0 100 100" aria-hidden="true"><circle class="track" cx="50" cy="50" r="40"/><circle class="seg c1" cx="50" cy="50" r="40" stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}"/></svg><span class="pct">${pct}%</span></div><div class="goal-text"><strong class="big">${money(earn)}</strong><span class="muted">${goal>0?`${esc(x.of)} ${money(goal)}`:esc(x.noGoal)}</span>${goal>0?`<span class="${done?'pos':'muted'}">${done?esc(x.reached):`${esc(x.remaining)}: ${money(left)}`}</span>`:''}</div></div><div class="two"><span class="pos">▲ ${esc(x.earned)} ${money(earn)}</span><span class="neg">▼ ${esc(x.spent)} ${money(spent)}</span><span>${esc(x.net)} <b>${money(earn-spent)}</b></span></div></section>
 ${statsCard()}
 <section class="card"><h3>${esc(x.todayExpenses)}</h3><div class="tiles">${CATS.expense.map(c=>`<button class="tile${byCat[c]?' has':''}" data-act="quick" data-v="${c}"><span>${esc(catName(c))}</span><b>${byCat[c]?money(byCat[c]):'+'}</b></button>`).join('')}</div><small class="muted">${esc(x.tapCat)}</small></section>

 <section class="card"><h3>${esc(x.monthTitle)}</h3><div class="two"><span class="pos">${esc(x.earned)} <b>${money(sum(mon,'sale'))}</b></span><span class="neg">${esc(x.spent)} <b>${money(sum(mon,'expense'))}</b></span></div></section>
 <section class="card"><h3>${esc(x.adviceTitle)}</h3>${tips.length?`<ul class="tips">${tips.map(q=>`<li>${esc(q)}</li>`).join('')}</ul>`:`<p class="muted">${esc(x.adviceNone)}</p>`}<small class="muted">${esc(x.adviceNote)}</small></section>
 <section class="card"><h3>${esc(x.recent)}</h3>${recent.length?`<ul class="rows">${recent.map(e=>rowHtml(e,true)).join('')}</ul>`:`<p class="muted">${esc(x.empty)}</p>`}</section>`;
}
function rowHtml(e,del=false,cur=S.cur){const x=t();return `<li class="entry ${e.kind}"><div><strong>${esc(catName(e.category)||x.kind[e.kind])}</strong><small>${esc(e.note||x.kind[e.kind])} · ${esc(e.date)}</small></div><b>${e.kind==='expense'?'−':'+'}${money(e.amount,cur)}</b>${e.photo_path?`<button class="x" data-act="photo" data-id="${e.id}" data-path="${esc(e.photo_path)}" aria-label="${esc(x.viewPhoto)}">📎</button>`:''}${del?`<button class="x" data-act="del" data-id="${e.id}" aria-label="${esc(x.del)}">×</button>`:''}</li>`}
function listView(){
 const x=t(),f=S.filter,items=live().filter(e=>f==='all'||e.kind===f).sort((a,b)=>b.date.localeCompare(a.date)||b.created_at.localeCompare(a.created_at));
 const groups={};items.forEach(e=>(groups[e.date]=groups[e.date]||[]).push(e));
 return `<div class="seg wide" role="group">${['all','sale','expense','income'].map(k=>`<button data-act="filter" data-v="${k}" aria-pressed="${f===k}">${esc(k==='all'?x.all:x.kind[k])}</button>`).join('')}</div>${items.length?Object.entries(groups).map(([d,arr])=>`<section class="card"><h3>${esc(dateLabel(d))}</h3><ul class="rows">${arr.map(e=>rowHtml(e,true)).join('')}</ul></section>`).join(''):`<p class="muted center">${esc(x.empty)}</p>`}`;
}
function workView(){
 const x=t(),a=S.active;if(S.workDetail)return sessionView();
 const all=sessionsAll(),d=today(),ws=weekStart(),dayS=all.filter(s=>localDate(s.started_at)===d),weekS=all.filter(s=>localDate(s.started_at)>=ws);
 const tot=arr=>({sec:arr.reduce((p,s)=>p+(s.duration_s||0),0),km:arr.reduce((p,s)=>p+((a&&s.id===a.id)?a.distance_m:s.distance_m)/1000,0)});
 const td=tot(dayS),tw=tot(weekS);
 const main=a?`<section class="card work-live"><small>${esc(x.working)}</small><div class="clock" id="clock">${fmtDur(Math.round((Date.now()-new Date(a.started_at))/1000))}</div><div class="two"><span><b id="live-km">${(a.distance_m/1000).toFixed(2)}</b> ${esc(x.km)}</span><span>${esc(x.nowSpeed)} <b id="live-spd">—</b> ${esc(x.kmh)}</span><span>${esc(x.avgShort)} <b id="live-avg">${kmhTxt(moveStats(a.points).kmh)}</b> ${esc(x.kmh)}</span></div>${mapBox(a.points,[],'live-map')}<small class="muted">${esc(x.keepOpen)}</small><button class="btn danger" data-act="work-stop">${esc(x.stopWork)}</button></section>`
  :`<section class="card work-start"><button class="btn primary big-btn" data-act="work-start">${esc(x.startWork)}</button>${S.msg?`<p class="msg">${esc(S.msg)}</p>`:''}</section>`;
 const done=all.filter(s=>s.ended_at);
 return `${main}${periodCard(done)}
 ${historyCard(done)}`;
}
function sessionView(){
 const x=t(),s=S.workDetail,km=kmOf(s),h=s.duration_s/3600;
 return `<button class="link" data-act="work-back">← ${esc(x.back)}</button><h3 class="h">${esc(dateLabel(localDate(s.started_at)))}</h3><section class="card">${mapBox(s.points,findStops(s.points||[]))}${legend()}<div class="stats"><div><small>${esc(x.distance)}</small><b>${km.toFixed(2)} ${esc(x.km)}</b></div><div><small>${esc(x.duration)}</small><b>${fmtDur(s.duration_s)}</b></div></div>${moveGrid(s.points)}<small class="muted">${esc(x.speedNote)}</small></section><section class="card">${stopsHtml(findStops(s.points||[]))}</section>`;
}
function settingsView(){
 const x=t();
 return `<form class="card form" data-act="goals"><h3>${esc(x.goalsTitle)}</h3><p class="muted">${esc(x.goalHelp)}</p><label>${esc(x.dailyTarget)}<input id="g-daily" inputmode="decimal" value="${S.goals.daily||''}"></label><label>${esc(x.workDays)}</label><div class="seg wide">${[1,2,3,4,5,6,7].map(n=>`<button type="button" data-act="days" data-v="${n}" aria-pressed="${S.goals.days===n}">${n}</button>`).join('')}</div><button class="btn primary" type="submit">${esc(x.save)}</button>${S.msg?`<p class="msg ok">${esc(S.msg)}</p>`:''}</form>
 <section class="card form"><h3>${esc(x.account)}</h3><p>${esc(S.nick)}${S.user?.email?` · <span class="muted">${esc(S.user.email)}</span>`:''}</p><div class="notice slim">${supMore()}</div>
 <h3>${esc(x.language)}</h3>${langBar()}<h3>${esc(x.currency)}</h3><div class="seg wide">${CURRENCIES.map(c=>`<button data-act="cur" data-v="${c}" aria-pressed="${S.cur===c}">${c}</button>`).join('')}</div>
 <label class="check"><input id="s-sound" type="checkbox" data-act="sound" ${S.sound?'checked':''}> ${esc(x.sound)}</label>
 <button class="btn ghost" data-act="export">${esc(x.export)}</button>${S.demo?'':`<button class="btn ghost" data-act="sync">${esc(x.syncNow)}</button>`}<button class="btn danger" data-act="logout">${esc(x.logout)}</button></section>`;
}
function watchView(){
 const x=t();if(!S.admin)return `<p class="muted center">${esc(x.noAdmin)}</p>`;
 if(S.detail)return detailView();
 if(!S.overview){loadOverview();return `<p class="muted center">…</p>`}
 return `<h3 class="h">${esc(x.overview)}</h3>${S.overview.length?S.overview.map(r=>{const cu=r.currency||'AZN',tg=Number(r.daily_target),te=Number(r.today_earn),p=tg>0?Math.min(100,Math.round(te/tg*100)):0,wt=tg*(Number(r.work_days)||6),mt=tg*(Number(r.work_days)||6)*new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate()/7;return `<button class="card staff" data-act="staff" data-id="${esc(r.user_id||r.nickname)}"><div class="row between"><strong>@${esc(r.nickname)} <small class="muted">${esc(cu)}</small></strong>${r.live_at?`<span class="live">● ${esc(x.liveNow)}</span>`:`<span class="muted">${r.last_activity?esc(new Date(r.last_activity).toLocaleDateString()):esc(x.never)}</span>`}</div><div class="row between"><span>${esc(x.today)}</span><b>${money(te,cu)}</b></div><progress max="100" value="${p}" class="${tg>0&&te>=tg?'done':''}"></progress><div class="row between muted"><span>${esc(x.target)}: ${tg>0?money(tg,cu):esc(x.never)} · ${p}%</span><span>${esc(x.spent)}: ${money(Number(r.today_expense),cu)}</span></div><div class="row between muted"><span>${esc(x.weekLbl)}: ${money(Number(r.week_earn),cu)}${wt>0?` ${esc(x.of)} ${money(wt,cu)}`:''}</span><span>${Number(r.today_km).toFixed(1)} ${esc(x.km)} · ${Number(r.today_hours).toFixed(1)} ${esc(x.hours)}</span></div><div class="row between muted"><span>${esc(x.month)}: ${money(Number(r.month_earn),cu)}${mt>0?` ${esc(x.of)} ${money(mt,cu)}`:''}</span><span>${esc(x.total)}: ${money(Number(r.total_earn),cu)}</span></div></button>`}).join(''):`<p class="muted center">${esc(x.noStaff)}</p>`}`;
}
function detailView(){
 const x=t(),d=S.detail,cu=d.currency||'AZN',items=d.entries||[],ses=d.sessions||[],sel=d.sel;
 return `<button class="link" data-act="back">← ${esc(x.back)}</button><h3 class="h">@${esc(d.nickname)}</h3><section class="card"><div class="two"><span>${esc(x.kind.sale)}: <b>${money(sum(items,'sale'),cu)}</b></span><span>${esc(x.kind.expense)}: <b>${money(sum(items,'expense'),cu)}</b></span><span>${esc(x.kind.income)}: <b>${money(sum(items,'income'),cu)}</b></span></div></section>
 ${d.live?`<section class="card"><h3><span class="live">● ${esc(x.liveNow)}</span></h3>${mapBox([],[],null,d.live)}<small class="muted">${esc(x.liveAt)}: ${new Date(d.live.t).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</small></section>`:''}
 ${(d.days||[]).length?`<section class="card"><h3>${esc(x.daysTitle)}</h3><ul class="rows">${d.days.map(r=>{const km=Number(r.km),h=Number(r.hours),earn=sum(items.filter(e=>e.date===r.day),'sale');return `<li class="entry"><div><strong>${esc(dateLabel(r.day))}</strong><small>${km.toFixed(1)} ${esc(x.km)} · ${h.toFixed(1)} ${esc(x.hours)}</small></div><b>${km>0&&earn>0?`${money(earn/km,cu)} / ${esc(x.km)}`:money(earn,cu)}</b></li>`}).join('')}</ul></section>`:''}
 ${ses.length?`<section class="card"><h3>${esc(x.sessions)}</h3><ul class="rows">${ses.map(s=>`<li class="entry"><button class="sess" data-act="asession" data-id="${s.id}"><div><strong>${esc(dateLabel(localDate(s.started_at)))}</strong><small>${fmtDur(s.duration_s)} ${esc(x.hours)}</small></div><b>${kmOf(s).toFixed(1)} ${esc(x.km)}</b></button></li>`).join('')}</ul></section>`:''}
 ${sel?`<section class="card"><h3>${esc(x.myMap)} · ${esc(dateLabel(localDate(sel.s.started_at)))}</h3>${sel.points.length?mapBox(sel.points,findStops(sel.points))+legend()+moveGrid(sel.points):`<p class="muted">${esc(x.noRoute)}</p>`}${sel.points.length?stopsHtml(findStops(sel.points)):''}</section>`:''}
 <section class="card"><h3>${esc(x.entries)}</h3>${items.length?`<ul class="rows">${items.map(e=>rowHtml(e,false,cu)).join('')}</ul>`:`<p class="muted">${esc(x.empty)}</p>`}</section>`;
}
function sheetView(){
 const x=t(),sh=S.sheet;
 if(sh.type==='nick')return `<div class="sheet-bg"><form class="sheet" data-act="nick"><h3>${esc(x.askNick)}</h3><label><input id="n-nick" maxlength="20" autocomplete="username"><small>${esc(x.nickRule)}</small></label>${S.msg?`<p class="msg">${esc(S.msg)}</p>`:''}<button class="btn primary" type="submit">${esc(x.save)}</button></form></div>`;
 if(sh.type==='gps')return `<div class="sheet-bg" data-act="sheet-bg"><div class="sheet"><h3>${esc(x.gpsTitle)}</h3><div class="notice"><p>${esc(x.gpsText)}</p></div><div class="row"><button class="btn ghost" data-act="sheet-close">${esc(x.cancel)}</button><button class="btn primary" data-act="gps-allow">${esc(x.gpsAllow)}</button></div></div></div>`;
 if(sh.type==='day')return `<div class="sheet-bg" data-act="sheet-bg"><form class="sheet" id="day-form" data-act="day" novalidate><h3>${esc(x.dayTitle)}</h3><p class="muted">${esc(x.dayHint)}</p>
 <label>${esc(x.dayEarned)}<input id="d-earn" inputmode="decimal" autocomplete="off" value="${esc(sh.earn)}"></label>
 <div class="row"><label>${esc(x.dayKm)}<input id="d-km" inputmode="decimal" autocomplete="off" value="${esc(sh.km)}"></label><label>${esc(x.dayHours)}<input id="d-h" inputmode="decimal" autocomplete="off" value="${esc(sh.hours)}"></label></div>
 <label>${esc(x.daySpent)}<input id="d-spent" inputmode="decimal" autocomplete="off" value="${esc(sh.spent)}"></label>
 <label>${esc(x.date)}<input id="d-date" type="date" value="${esc(sh.date)}"></label>
 <div id="day-prev">${dayPrev(sh)}</div><p class="muted" id="day-ex"${live().some(e=>e.date===sh.date&&e.category==='daily')?'':' hidden'}>${esc(x.dayReplace)}</p>
 <div class="row"><button type="button" class="btn ghost" data-act="sheet-close">${esc(x.cancel)}</button><button class="btn primary" type="submit">${esc(x.save)}</button></div>
 <button type="button" class="link" data-act="to-single">${esc(x.singleEntry)}</button></form></div>`;
 const kind=sh.kind,cats=CATS[kind];
 return `<div class="sheet-bg" data-act="sheet-bg"><div class="sheet" role="dialog" aria-modal="true"><button type="button" class="link" data-act="to-day">${esc(x.dayTitle)} →</button><div class="seg wide">${['sale','expense','income'].map(k=>`<button data-act="kind" data-v="${k}" aria-pressed="${kind===k}">${esc(x.kind[k])}</button>`).join('')}</div><div class="amount" id="amt" aria-live="polite">${esc(sh.amount||'0')}</div>
 <div class="chips">${cats.map(c=>`<button data-act="cat" data-v="${c}" aria-pressed="${sh.category===c}">${esc(catName(c))}</button>`).join('')}</div>
 <div class="keys">${['1','2','3','4','5','6','7','8','9','.','0','⌫'].map(k=>`<button data-act="key" data-v="${k}">${k}</button>`).join('')}</div>
 ${sh.permCam?`<div class="notice"><strong>${esc(x.camTitle)}</strong><p>${esc(x.camText)}</p><button class="btn primary" data-act="cam-allow">${esc(x.camAllow)}</button></div>`:`<div class="row photo-row"><button class="btn ghost" data-act="photo-pick" data-v="cam">📷 ${esc(x.takePhoto)}</button><button class="btn ghost" data-act="photo-pick" data-v="gal">🖼 ${esc(x.pickPhoto)}</button></div>${sh.photoUrl?`<div class="thumb"><img src="${sh.photoUrl}" alt="${esc(x.receipt)}"><button class="x" data-act="photo-rm" aria-label="${esc(x.removePhoto)}">×</button></div>`:''}`}
 <input type="file" id="in-cam" accept="image/*" capture="environment" hidden><input type="file" id="in-gal" accept="image/*" hidden>
 <div class="row"><input id="s-note" maxlength="200" value="${esc(sh.note||'')}" placeholder="${esc(x.note)}" aria-label="${esc(x.note)}"><input id="s-date" type="date" value="${esc(sh.date)}" aria-label="${esc(x.date)}"></div>
 <div class="row"><button class="btn ghost" data-act="sheet-close">${esc(x.cancel)}</button><button class="btn primary" data-act="sheet-save">${esc(x.save)}</button></div></div></div>`;
}
async function loadOverview(){
 if(S.demo||!sb||S.loadingOv)return;S.loadingOv=true;
 const {data,error}=await sb.rpc('bt_overview');S.loadingOv=false;if(error){console.warn(error);S.overview=[];render();return}
 S.overview=data;render();
}
async function openAdminSession(id){
 const s=(S.detail.sessions||[]).find(q=>q.id===id);if(!s)return;let pts=s.points||[];
 if(!pts.length&&!S.demo&&sb){const r=await sb.from('bt_routes').select('points').eq('session_id',id).maybeSingle();pts=r.data?r.data.points:[]}
 S.detail.sel={s,points:pts};render();
}
async function openStaff(id){
 const row=(S.overview||[]).find(r=>(r.user_id||r.nickname)===id);if(!row)return;
 if(S.demo){S.detail={nickname:row.nickname,currency:row.currency,entries:[],days:Object.entries(S.days).map(([day,v])=>({day,km:v.km,hours:v.hours})),sessions:S.sessions.map(q=>({...q})),live:row.live_at?{lat:40.4093,lng:49.8671,t:Date.now()}:null};render();return}
 const [en,se,lv,dy]=await Promise.all([sb.from('bt_entries').select('id,kind,amount,category,note,entry_date,created_at,photo_path').eq('user_id',row.user_id).is('deleted_at',null).order('entry_date',{ascending:false}).limit(300),sb.from('bt_sessions').select('id,started_at,ended_at,distance_m,duration_s').eq('user_id',row.user_id).order('started_at',{ascending:false}).limit(30),sb.from('bt_live').select('lat,lng,updated_at').eq('user_id',row.user_id).maybeSingle(),sb.from('bt_days').select('day,km,hours').eq('user_id',row.user_id).order('day',{ascending:false}).limit(30)]);
 const lvOk=lv.data&&Date.now()-new Date(lv.data.updated_at)<10*60*1000;
 S.detail={nickname:row.nickname,currency:row.currency,live:lvOk?{lat:lv.data.lat,lng:lv.data.lng,t:new Date(lv.data.updated_at).getTime()}:null,entries:(en.data||[]).map(r=>({id:r.id,kind:r.kind,amount:Number(r.amount),category:r.category,note:r.note,date:r.entry_date,created_at:r.created_at,photo_path:r.photo_path})),sessions:se.data||[],days:dy.data||[]};render();
}

/* ---------- render + events ---------- */
function render(){
 if(S.sheet&&S.sheet.type==='day'&&$('#day-form'))return;
 const root=$('#app'),open=$('#apk')?.open;
 document.documentElement.lang=S.lang;document.title=t().app;
 root.innerHTML=!S.user&&!S.demo?authView():appView();
 liveM=null;document.querySelectorAll('[data-map]').forEach(drawMap);
 if(open&&$('#apk'))$('#apk').showModal();
}
function csv(){
 const q=v=>{let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
 const rows=[['date','kind','category','amount','note'],...live().sort((a,b)=>a.date.localeCompare(b.date)).map(e=>[e.date,e.kind,catName(e.category),e.amount,e.note])];
 const blob=new Blob(['﻿'+rows.map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');
 a.href=URL.createObjectURL(blob);a.download='bakhy-budget.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function openSheet(kind='sale',category=CATS.sale[0]){S.sheet={type:'add',kind,amount:'',category,date:today()}}
function setAmount(){const a=$('#amt');if(a)a.textContent=S.sheet.amount||'0'}
function keepSheet(){const n=$('#s-note'),d=$('#s-date');if(S.sheet&&n)S.sheet.note=n.value;if(S.sheet&&d&&d.value)S.sheet.date=d.value}
function closeSheet(){if(S.sheet&&S.sheet.photoUrl)URL.revokeObjectURL(S.sheet.photoUrl);S.sheet=null;render()}
async function openApk(){
 const d=$('#apk');d.showModal();const go=$('#apk-go'),ok=$('#apk-ok');
 let exists=false;try{const r=await fetch(APK_URL,{method:'HEAD'});exists=r.ok&&!(r.headers.get('content-type')||'').includes('html')}catch{}
 $('#apk-soon').hidden=exists;const upd=()=>go.setAttribute('aria-disabled',String(!(exists&&ok.checked)));ok.onchange=upd;upd();
 go.onclick=e=>{if(go.getAttribute('aria-disabled')==='true')e.preventDefault()};
}
document.addEventListener('submit',async e=>{
 const f=e.target.closest('[data-act]');if(!f)return;e.preventDefault();
 const act=f.dataset.act;
 if(act==='auth')return submitAuth();
 if(act==='day')return saveDay();
 if(act==='goals'){const v=Math.max(0,Number(String($('#g-daily').value).replace(',','.'))||0);S.goals.daily=v;S.dirty.goals=true;persist();S.msg=t().goalSaved;render();S.msg='';sync();return}
 if(act==='nick'){const nick=$('#n-nick').value.trim();if(!NICK.test(nick)){S.msg=t().nickRule;return render()}const r=await sb.from('bt_profiles').insert({nickname:nick,currency:S.cur});if(r.error){S.msg=r.error.code==='23505'?t().nickTaken:t().netErr;return render()}S.nick=nick;S.sheet=null;S.msg='';const {data}=await sb.from('bt_admins').select('user_id').maybeSingle();S.admin=!!data;render();say('welcome');sync()}
});
document.addEventListener('input',e=>{if(e.target.closest('#day-form'))syncDayForm()});
document.addEventListener('change',async e=>{
 if(e.target.id==='d-date')return syncDayForm();
 const i=e.target;if(i.id!=='in-cam'&&i.id!=='in-gal')return;const file=i.files&&i.files[0];if(!file||!S.sheet)return;
 keepSheet();try{const blob=await compress(file);if(S.sheet.photoUrl)URL.revokeObjectURL(S.sheet.photoUrl);S.sheet.photo=blob;S.sheet.photoUrl=URL.createObjectURL(blob)}catch{alert(t().photoErr)}render();
});
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-act]');if(!b||b.tagName==='FORM')return;const a=b.dataset.act,v=b.dataset.v;
 if(a==='lang'){S.lang=v;saveSettings();render()}
 else if(a==='mode'){S.authMode=S.authMode==='signup'?'signin':'signup';S.msg='';render()}
 else if(a==='demo')startDemo(new URLSearchParams(location.search).get('demo')==='admin');
 else if(a==='apk')openApk();
 else if(a==='apk-close')$('#apk').close();
 else if(a==='tab'){if(v==='add'){openDay()}else{S.tab=v;S.detail=null;S.workDetail=null;S.msg='';if(v==='watch'&&!S.demo)S.overview=null}render()}
 else if(a==='to-single'){S.sheet=null;openSheet();render()}
 else if(a==='to-day'){keepSheet();openDay();render()}
 else if(a==='quick'){openSheet('expense',v);render()}
 else if(a==='filter'){S.filter=v;render()}
 else if(a==='cur'){if(v!==S.cur&&live().length&&!confirm(t().currencyNote))return;S.cur=v;saveSettings();if(S.user&&sb)sb.from('bt_profiles').update({currency:v}).eq('user_id',S.user.id).then(()=>{});render()}
 else if(a==='days'){const i=$('#g-daily');if(i)S.goals.daily=Math.max(0,Number(i.value.replace(',','.'))||0);S.goals.days=Number(v);S.dirty.goals=true;persist();sync();render()}
 else if(a==='sound'){S.sound=b.checked;saveSettings()}
 else if(a==='export')csv();
 else if(a==='sync')sync();
 else if(a==='logout')logout();
 else if(a==='del'){if(confirm(t().confirmDel))removeEntry(b.dataset.id)}
 else if(a==='photo')openPhoto(b.dataset.id,b.dataset.path);
 else if(a==='viewer-close'){if(e.target===b||b.tagName==='BUTTON'){URL.revokeObjectURL(S.viewer);S.viewer=null;render()}}
 else if(a==='staff')openStaff(b.dataset.id);
 else if(a==='asession')openAdminSession(b.dataset.id);
 else if(a==='back'){S.detail=null;render()}
 else if(a==='work-start'){if(LS.get('gpsOk'))startWork();else{S.sheet={type:'gps'};render()}}
 else if(a==='gps-allow'){LS.set('gpsOk',1);S.sheet=null;startWork()}
 else if(a==='work-stop')stopWork();
 else if(a==='work-back'){S.workDetail=null;render()}
 else if(a==='session')openSession(b.dataset.id);
 else if(a==='kind'){keepSheet();S.sheet.kind=v;S.sheet.category=CATS[v][0];render()}
 else if(a==='cat'){keepSheet();S.sheet.category=v;render()}
 else if(a==='key'){let s=S.sheet.amount;if(v==='⌫')s=s.slice(0,-1);else if(v==='.'){if(!s.includes('.'))s=(s||'0')+'.'}else if(!(s.includes('.')&&s.split('.')[1].length>=2)&&s.length<10)s+=v;S.sheet.amount=s;setAmount()}
 else if(a==='photo-pick'){keepSheet();if(LS.get('camOk')){$('#in-'+v).click()}else{S.sheet.permCam=v;render()}}
 else if(a==='cam-allow'){LS.set('camOk',1);const v2=S.sheet.permCam;S.sheet.permCam=null;keepSheet();render();$('#in-'+v2).click()}
 else if(a==='photo-rm'){keepSheet();URL.revokeObjectURL(S.sheet.photoUrl);S.sheet.photo=null;S.sheet.photoUrl=null;render()}
 else if(a==='sheet-close')closeSheet();
 else if(a==='sheet-bg'){if(e.target===b)closeSheet()}
 else if(a==='sheet-save'){keepSheet();const amount=Number(S.sheet.amount);if(!(amount>0)){say('error');return}addEntry({kind:S.sheet.kind,amount,category:S.sheet.category,note:(S.sheet.note||'').trim().slice(0,200),date:S.sheet.date||today(),photo:S.sheet.photo});closeSheet()}
});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&S.active&&!wake)lockScreen()});
window.addEventListener('online',()=>{sync();render()});window.addEventListener('offline',render);

/* ---------- boot ---------- */
async function boot(){
 render();
 if('serviceWorker' in navigator)navigator.serviceWorker.register('/budgettracker/sw.js',{scope:'/budgettracker/'}).catch(()=>{});
 const q=new URLSearchParams(location.search);
 if(q.get('demo')==='warsaw')return startWarsaw();
 if(q.has('demo'))return startDemo(q.get('demo')==='admin');
 if(!sb)return;
 const {data}=await sb.auth.getSession();
 if(data.session)enter(data.session.user);
 sb.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT'&&!S.demo){S.user=null;render()}});
}
boot();
