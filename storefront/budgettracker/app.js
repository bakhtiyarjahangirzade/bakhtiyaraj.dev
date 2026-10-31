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
const S={lang:saved.lang||guess(),cur:saved.cur||'AZN',sound:saved.sound!==false,user:null,nick:'',admin:false,demo:false,entries:[],goals:{daily:0,days:6},sessions:[],active:null,pending:new Set(),photoQ:new Set(),dirty:{goals:false},lastSync:null,flags:{},tab:'home',filter:'all',overview:null,detail:null,workDetail:null,sheet:null,viewer:null,authMode:'signin',msg:'',syncing:false};
const t=()=>T[S.lang];
const sb=window.supabase?window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'bt.auth'}}):null;
const saveSettings=()=>LS.set('settings',{lang:S.lang,cur:S.cur,sound:S.sound});
const money=n=>{try{return new Intl.NumberFormat({az:'az-AZ',ru:'ru-RU',en:'en-GB'}[S.lang],{style:'currency',currency:S.cur,maximumFractionDigits:2}).format(n||0)}catch{return (n||0).toFixed(2)+' '+S.cur}};
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
function persist(){if(S.demo||!S.user)return;LS.set('u.'+uid(),{entries:S.entries,goals:S.goals,sessions:S.sessions.slice(-60),active:S.active,pending:[...S.pending],photoQ:[...S.photoQ],dirty:S.dirty,lastSync:S.lastSync,flags:S.flags})}
function restore(){const d=S.demo?{}:LS.get('u.'+uid(),{});S.entries=d.entries||[];S.goals={daily:Number(d.goals&&(d.goals.daily??d.goals.sales))||0,days:Number(d.goals&&d.goals.days)||6};S.sessions=d.sessions||[];S.active=d.active||null;S.pending=new Set(d.pending||[]);S.photoQ=new Set(d.photoQ||[]);S.dirty={goals:!!(d.dirty&&d.dirty.goals)};S.lastSync=d.lastSync||null;S.flags=d.flags||{}}

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
  if(S.dirty.goals){const {error}=await sb.from('bt_goals').upsert({user_id:S.user.id,daily_target:S.goals.daily,work_days:S.goals.days});if(error)throw error;S.dirty.goals=false}
  let q=sb.from('bt_entries').select('id,kind,amount,category,note,entry_date,created_at,updated_at,deleted_at,photo_path').order('updated_at',{ascending:true}).limit(1000);
  if(S.lastSync)q=q.gt('updated_at',S.lastSync);
  const {data,error}=await q;if(error)throw error;
  for(const r of data){const e={id:r.id,kind:r.kind,amount:Number(r.amount),category:r.category,note:r.note,date:r.entry_date,created_at:r.created_at,deleted_at:r.deleted_at,photo_path:r.photo_path};const i=S.entries.findIndex(x=>x.id===e.id);if(i<0)S.entries.push(e);else if(!S.pending.has(e.id))S.entries[i]=e;S.lastSync=r.updated_at}
  const ss=await sb.from('bt_sessions').select('id,started_at,ended_at,distance_m,duration_s').order('started_at',{ascending:false}).limit(100);
  if(ss.data)for(const r of ss.data){if(!S.sessions.some(x=>x.id===r.id)&&r.ended_at)S.sessions.push({...r,dirty:false})}
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
 const {data}=await sb.from('bt_profiles').select('nickname').eq('user_id',S.user.id).maybeSingle();
 if(data){S.nick=data.nickname;return true}
 const nick=S.user.user_metadata?.nickname;
 if(nick&&NICK.test(nick)){const r=await sb.from('bt_profiles').insert({nickname:nick});if(!r.error){S.nick=nick;return true}if(r.error.code!=='23505')throw r.error;S.msg=t().nickTaken}
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
async function logout(){stopWatchOnly();if(S.demo){S.demo=false;S.user=null;S.entries=[];S.sessions=[];S.active=null;S.admin=false;render();return}await sb.auth.signOut();S.user=null;S.nick='';S.admin=false;S.entries=[];S.sessions=[];S.active=null;S.tab='home';render()}

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
 S.overview=[{nickname:'ali.kuryer',today_earn:132,today_expense:18,week_earn:540,daily_target:120,work_days:6,today_km:38.4,today_hours:6.2,month_earn:2940,total_earn:9810,last_activity:new Date().toISOString()},{nickname:'leyla_m',today_earn:74,today_expense:12,week_earn:410,daily_target:150,work_days:5,today_km:21.7,today_hours:4.1,month_earn:3120,total_earn:12120,last_activity:new Date(Date.now()-36e5).toISOString()}];
 render();say('welcome');
}

/* ---------- entries ---------- */
async function addEntry({kind,amount,category,note,date,photo}){
 const e={id:uuid(),kind,amount,category,note,date,created_at:new Date().toISOString(),deleted_at:null};
 if(photo){e.photo_path=`${uid()}/${e.id}.jpg`;if(S.demo)demoPhotos.set(e.id,photo);else{await idb.put(e.id,photo).catch(()=>{});S.photoQ.add(e.id)}}
 S.entries.push(e);if(!S.demo)S.pending.add(e.id);
 const sound=alertFor(e);persist();say(sound);sync();
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
let watchId=null,tick=null,wake=null;
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
 a.points.push(pt);persist();const k=$('#live-km');if(k)k.textContent=(a.distance_m/1000).toFixed(2);const r=$('#live-route');if(r)r.innerHTML=routeSvg(a.points);
}
function startWork(){
 if(!navigator.geolocation){S.msg=t().noGps;return render()}
 S.msg='';S.active={id:uuid(),started_at:new Date().toISOString(),points:[],distance_m:0};persist();startWatch();render();
}
function stopWork(){
 const a=S.active;stopWatchOnly();if(!a){render();return}
 const end=new Date(),dur=Math.max(1,Math.round((end-new Date(a.started_at))/1000)),n=a.points.length,step=Math.max(1,Math.ceil(n/1500));
 S.sessions.push({id:a.id,started_at:a.started_at,ended_at:end.toISOString(),distance_m:Math.round(a.distance_m),duration_s:dur,points:a.points.filter((_,i)=>i%step===0),dirty:!S.demo});
 S.active=null;persist();sync();render();
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

/* ---------- 3D cash bundles: one bundle per working day, solid = earned, transparent = still to earn ---------- */
function bundlesSvg(earn,daily,days){
 const W=62,D=31,H=18,n=Math.max(1,Math.min(7,days)),cx=W+8,base=n*H+2*D+14,vw=2*W+16,vh=base+8,units=daily>0?earn/daily:0;
 const block=(yb,h,ghost)=>{
  const ty=yb-h-2*D,fl=`${cx-W},${ty+D}`,fr=`${cx+W},${ty+D}`,tp=`${cx},${ty}`,fb=`${cx},${ty+2*D}`,cls=ghost?' ghost':'';
  const topF=`<polygon class="top${cls}" points="${tp} ${fr} ${fb} ${fl}"/>`,left=`<polygon class="left${cls}" points="${fl} ${fb} ${cx},${yb} ${cx-W},${yb-D}"/>`,right=`<polygon class="right${cls}" points="${fb} ${fr} ${cx+W},${yb-D} ${cx},${yb}"/>`;
  if(ghost||h<6)return topF+left+right;
  const slope=D/W,x1=cx-W*.64,x2=cx-W*.36,y1=ty+D+(x1-(cx-W))*slope,y2=ty+D+(x2-(cx-W))*slope,rx1=cx+W*.36,rx2=cx+W*.64,ry1=ty+2*D-(rx1-cx)*slope,ry2=ty+2*D-(rx2-cx)*slope;
  return topF+left+right+`<polygon class="band" points="${x1},${y1} ${x2},${y2} ${x2},${y2+h} ${x1},${y1+h}"/><polygon class="band" points="${rx1},${ry1} ${rx2},${ry2} ${rx2},${ry2+h} ${rx1},${ry1+h}"/>`;
 };
 let out='';
 for(let i=0;i<n;i++){const f=Math.max(0,Math.min(1,units-i)),yb=base-i*H;
  if(f>=.999)out+=block(yb,H,false);else if(f<=.001)out+=block(yb,H,true);else out+=block(yb,H*f,false)+block(yb-H*f,H*(1-f),true)}
 return `<svg class="bundles" viewBox="0 0 ${vw} ${vh}" role="img" aria-label="${esc(t().weekTitle)}">${out}</svg>`;
}

/* ---------- views ---------- */
const ICON={home:'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',list:'M4 6h16M4 12h16M4 18h10',add:'M12 5v14M5 12h14',work:'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',settings:'M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6',watch:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'};
const icon=n=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;

function authView(){
 const x=t(),signup=S.authMode==='signup';
 return `<main class="auth"><section class="hero"><div class="brand"><span class="logo">B</span><span>${esc(x.app)}</span></div><h1>${esc(x.tagline)}</h1><h2>${esc(x.featTitle)}</h2><ul class="feats">${x.feats.map(f=>`<li>${esc(f)}</li>`).join('')}</ul><div class="hero-actions"><button class="btn dark" data-act="apk">${esc(x.apkBtn)}</button><button class="btn ghost" data-act="demo">${esc(x.demo)}</button></div>${langBar()}</section>
 <form class="card form" data-act="auth" novalidate><h2>${esc(signup?x.signup:x.signin)}</h2>
 <label>${esc(x.email)}<input id="f-email" type="email" autocomplete="email" inputmode="email"></label>
 <label>${esc(x.password)}<input id="f-pw" type="password" autocomplete="${signup?'new-password':'current-password'}"></label>
 ${signup?`<label>${esc(x.nickname)}<input id="f-nick" autocomplete="username" maxlength="20"><small>${esc(x.nickRule)}</small></label><div class="notice"><strong>${esc(x.supNoticeTitle)}</strong><p>${esc(x.supNotice)}</p><label class="check"><input id="f-consent" type="checkbox"> ${esc(x.consent)}</label></div>`:''}
 ${S.msg?`<p class="msg${S.msgOk?' ok':''}" role="alert">${esc(S.msg)}</p>`:''}
 <button class="btn primary" type="submit">${esc(signup?x.signup:x.signin)}</button>
 <button class="link" type="button" data-act="mode">${esc(signup?x.haveAcc:x.noAcc)}</button></form>
 <dialog id="apk"><div class="dlg"><h2>${esc(x.apkTitle)}</h2><ul class="feats">${x.feats.map(f=>`<li>${esc(f)}</li>`).join('')}</ul><div class="notice"><strong>${esc(x.supNoticeTitle)}</strong><p>${esc(x.supNotice)}</p><label class="check"><input id="apk-ok" type="checkbox"> ${esc(x.consent)}</label></div><p class="msg" id="apk-soon" hidden>${esc(x.apkSoon)}</p><div class="row"><a id="apk-go" class="btn primary" href="${APK_URL}" download aria-disabled="true">${esc(x.apkGo)}</a><button class="btn ghost" data-act="apk-close" type="button">${esc(x.close)}</button></div></div></dialog></main>`;
}
function langBar(){return `<div class="seg" role="group" aria-label="Language">${['az','ru','en'].map(l=>`<button type="button" data-act="lang" data-v="${l}" aria-pressed="${S.lang===l}">${l.toUpperCase()}</button>`).join('')}</div>`}

function appView(){
 const x=t(),tabs=['home','list','add','work','settings'];if(S.admin)tabs.push('watch');
 const body={home:homeView,list:listView,settings:settingsView,watch:watchView,work:workView,add:homeView}[S.tab]();
 return `${S.demo?`<div class="demo-bar">${esc(x.demoBanner)} <button class="link" data-act="logout">${esc(x.exitDemo)}</button></div>`:''}<div class="shell"><header class="top"><span class="brand small"><span class="logo">B</span>${esc(x.app)}</span><span class="who">${esc(S.nick)}${!navigator.onLine?` · ${esc(x.offline)}`:S.pending.size?` · ${esc(x.pending)}: ${S.pending.size}`:''}</span></header><main class="view">${body}</main>
 <nav class="tabs" aria-label="Navigation">${tabs.map(k=>`<button data-act="tab" data-v="${k}" class="${k==='add'?'plus':''}" aria-current="${S.tab===k&&k!=='add'}" aria-label="${esc(x[k])}">${icon(k)}<span>${esc(x[k])}</span></button>`).join('')}</nav></div>${S.sheet?sheetView():''}${S.viewer?`<div class="sheet-bg" data-act="viewer-close"><div class="viewer"><img src="${S.viewer}" alt=""><button class="btn ghost" data-act="viewer-close">${esc(x.close)}</button></div></div>`:''}`;
}
function homeView(){
 const x=t(),d=today(),m=ym(d),day=live().filter(e=>e.date===d),mon=live().filter(e=>inMonth(e,m)),wk=live().filter(e=>e.date>=weekStart());
 const earn=sum(day,'sale'),spent=sum(day,'expense'),goal=S.goals.daily,days=S.goals.days||6,pct=goal>0?Math.min(100,Math.round(earn/goal*100)):0,left=Math.max(0,goal-earn),done=goal>0&&earn>=goal;
 const weekEarn=sum(wk,'sale'),byCat={};day.filter(e=>e.kind==='expense').forEach(e=>byCat[e.category]=(byCat[e.category]||0)+e.amount);
 const recent=live().sort((a,b)=>b.date.localeCompare(a.date)||b.created_at.localeCompare(a.created_at)).slice(0,5);
 const C=2*Math.PI*40,len=C*pct/100;
 return `<section class="card bales"><div class="bales-wrap"><div class="bales-art">${goal>0?bundlesSvg(weekEarn,goal,days):''}</div><div class="bales-text"><small>${esc(x.weekTitle)} · ${esc(x.daysLabel.replace('{n}',days))}</small>${goal>0?`<strong class="big">${money(weekEarn)}</strong><span class="muted">${esc(x.of)} ${money(goal*days)}</span><span class="muted tiny">${esc(x.baleHint)}</span>`:`<span class="muted">${esc(x.noBales)}</span>`}</div></div></section>
 <section class="card goal"><small>${esc(x.today)} · ${esc(x.dailyGoal)}</small><div class="goal-row"><div class="goal-ring"><svg class="ring goalring" viewBox="0 0 100 100" aria-hidden="true"><circle class="track" cx="50" cy="50" r="40"/><circle class="seg c1" cx="50" cy="50" r="40" stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}"/></svg><span class="pct">${pct}%</span></div><div class="goal-text"><strong class="big">${money(earn)}</strong><span class="muted">${goal>0?`${esc(x.of)} ${money(goal)}`:esc(x.noGoal)}</span>${goal>0?`<span class="${done?'pos':'muted'}">${done?esc(x.reached):`${esc(x.remaining)}: ${money(left)}`}</span>`:''}</div></div><div class="two"><span class="pos">▲ ${esc(x.earned)} ${money(earn)}</span><span class="neg">▼ ${esc(x.spent)} ${money(spent)}</span><span>${esc(x.net)} <b>${money(earn-spent)}</b></span></div></section>
 <section class="card"><h3>${esc(x.todayExpenses)}</h3><div class="tiles">${CATS.expense.map(c=>`<button class="tile${byCat[c]?' has':''}" data-act="quick" data-v="${c}"><span>${esc(catName(c))}</span><b>${byCat[c]?money(byCat[c]):'+'}</b></button>`).join('')}</div><small class="muted">${esc(x.tapCat)}</small></section>
 <section class="card"><h3>${esc(x.monthTitle)}</h3><div class="two"><span class="pos">${esc(x.earned)} <b>${money(sum(mon,'sale'))}</b></span><span class="neg">${esc(x.spent)} <b>${money(sum(mon,'expense'))}</b></span></div></section>
 <section class="card"><h3>${esc(x.recent)}</h3>${recent.length?`<ul class="rows">${recent.map(e=>rowHtml(e,true)).join('')}</ul>`:`<p class="muted">${esc(x.empty)}</p>`}</section>`;
}
function rowHtml(e,del=false){const x=t();return `<li class="entry ${e.kind}"><div><strong>${esc(catName(e.category)||x.kind[e.kind])}</strong><small>${esc(e.note||x.kind[e.kind])} · ${esc(e.date)}</small></div><b>${e.kind==='expense'?'−':'+'}${money(e.amount)}</b>${e.photo_path?`<button class="x" data-act="photo" data-id="${e.id}" data-path="${esc(e.photo_path)}" aria-label="${esc(x.viewPhoto)}">📎</button>`:''}${del?`<button class="x" data-act="del" data-id="${e.id}" aria-label="${esc(x.del)}">×</button>`:''}</li>`}
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
 const main=a?`<section class="card work-live"><small>${esc(x.working)}</small><div class="clock" id="clock">${fmtDur(Math.round((Date.now()-new Date(a.started_at))/1000))}</div><div class="two"><span><b id="live-km">${(a.distance_m/1000).toFixed(2)}</b> ${esc(x.km)}</span></div><div id="live-route">${routeSvg(a.points)}</div><small class="muted">${esc(x.keepOpen)}</small><button class="btn danger" data-act="work-stop">${esc(x.stopWork)}</button></section>`
  :`<section class="card work-start"><button class="btn primary big-btn" data-act="work-start">${esc(x.startWork)}</button>${S.msg?`<p class="msg">${esc(S.msg)}</p>`:''}</section>`;
 const done=all.filter(s=>s.ended_at);
 return `${main}<section class="card"><div class="stats"><div><small>${esc(x.today)}</small><b>${fmtDur(td.sec)}</b><span>${td.km.toFixed(1)} ${esc(x.km)}</span></div><div><small>${esc(x.thisWeek)}</small><b>${fmtDur(tw.sec)}</b><span>${tw.km.toFixed(1)} ${esc(x.km)}</span></div></div></section>
 <section class="card"><h3>${esc(x.sessions)}</h3>${done.length?`<ul class="rows">${done.slice(0,30).map(s=>`<li class="entry"><button class="sess" data-act="session" data-id="${s.id}"><div><strong>${esc(dateLabel(localDate(s.started_at)))}</strong><small>${fmtDur(s.duration_s)} ${esc(x.hours)}</small></div><b>${kmOf(s).toFixed(1)} ${esc(x.km)}</b></button></li>`).join('')}</ul>`:`<p class="muted">${esc(x.noSessions)}</p>`}</section>`;
}
function sessionView(){
 const x=t(),s=S.workDetail,km=kmOf(s),h=s.duration_s/3600;
 return `<button class="link" data-act="work-back">← ${esc(x.back)}</button><h3 class="h">${esc(dateLabel(localDate(s.started_at)))}</h3><section class="card">${routeSvg(s.points)}<div class="stats"><div><small>${esc(x.distance)}</small><b>${km.toFixed(2)} ${esc(x.km)}</b></div><div><small>${esc(x.duration)}</small><b>${fmtDur(s.duration_s)}</b></div><div><small>${esc(x.avgSpeed)}</small><b>${s.duration_s>=120?`${(km/h).toFixed(1)} ${esc(x.kmh)}`:'—'}</b></div></div></section>`;
}
function settingsView(){
 const x=t();
 return `<form class="card form" data-act="goals"><h3>${esc(x.goalsTitle)}</h3><p class="muted">${esc(x.goalHelp)}</p><label>${esc(x.dailyTarget)}<input id="g-daily" inputmode="decimal" value="${S.goals.daily||''}"></label><label>${esc(x.workDays)}</label><div class="seg wide">${[1,2,3,4,5,6,7].map(n=>`<button type="button" data-act="days" data-v="${n}" aria-pressed="${S.goals.days===n}">${n}</button>`).join('')}</div><button class="btn primary" type="submit">${esc(x.save)}</button>${S.msg?`<p class="msg ok">${esc(S.msg)}</p>`:''}</form>
 <section class="card form"><h3>${esc(x.account)}</h3><p>${esc(S.nick)}${S.user?.email?` · <span class="muted">${esc(S.user.email)}</span>`:''}</p><div class="notice"><strong>${esc(x.supNoticeTitle)}</strong><p>${esc(x.supNotice)}</p></div>
 <h3>${esc(x.language)}</h3>${langBar()}<h3>${esc(x.currency)}</h3><div class="seg wide">${CURRENCIES.map(c=>`<button data-act="cur" data-v="${c}" aria-pressed="${S.cur===c}">${c}</button>`).join('')}</div>
 <label class="check"><input id="s-sound" type="checkbox" data-act="sound" ${S.sound?'checked':''}> ${esc(x.sound)}</label>
 <button class="btn ghost" data-act="export">${esc(x.export)}</button>${S.demo?'':`<button class="btn ghost" data-act="sync">${esc(x.syncNow)}</button>`}<button class="btn danger" data-act="logout">${esc(x.logout)}</button></section>`;
}
function watchView(){
 const x=t();if(!S.admin)return `<p class="muted center">${esc(x.noAdmin)}</p>`;
 if(S.detail)return detailView();
 if(!S.overview){loadOverview();return `<p class="muted center">…</p>`}
 return `<h3 class="h">${esc(x.overview)}</h3>${S.overview.length?S.overview.map(r=>{const tg=Number(r.daily_target),te=Number(r.today_earn),p=tg>0?Math.min(100,Math.round(te/tg*100)):0,wt=tg*(Number(r.work_days)||6);return `<button class="card staff" data-act="staff" data-id="${esc(r.user_id||r.nickname)}"><div class="row between"><strong>@${esc(r.nickname)}</strong><span class="muted">${r.last_activity?esc(new Date(r.last_activity).toLocaleDateString()):esc(x.never)}</span></div><div class="row between"><span>${esc(x.today)}</span><b>${money(te)}</b></div><progress max="100" value="${p}" class="${tg>0&&te>=tg?'done':''}"></progress><div class="row between muted"><span>${esc(x.target)}: ${tg>0?money(tg):esc(x.never)} · ${p}%</span><span>${esc(x.spent)}: ${money(Number(r.today_expense))}</span></div><div class="row between muted"><span>${esc(x.weekLbl)}: ${money(Number(r.week_earn))}${wt>0?` ${esc(x.of)} ${money(wt)}`:''}</span><span>${Number(r.today_km).toFixed(1)} ${esc(x.km)} · ${Number(r.today_hours).toFixed(1)} ${esc(x.hours)}</span></div><div class="row between muted"><span>${esc(x.month)}: ${money(Number(r.month_earn))}</span><span>${esc(x.total)}: ${money(Number(r.total_earn))}</span></div></button>`}).join(''):`<p class="muted center">${esc(x.noStaff)}</p>`}`;
}
function detailView(){
 const x=t(),d=S.detail,items=d.entries||[],ses=d.sessions||[];
 return `<button class="link" data-act="back">← ${esc(x.back)}</button><h3 class="h">@${esc(d.nickname)}</h3><section class="card"><div class="two"><span>${esc(x.kind.sale)}: <b>${money(sum(items,'sale'))}</b></span><span>${esc(x.kind.expense)}: <b>${money(sum(items,'expense'))}</b></span><span>${esc(x.kind.income)}: <b>${money(sum(items,'income'))}</b></span></div></section>
 ${ses.length?`<section class="card"><h3>${esc(x.sessions)}</h3><ul class="rows">${ses.map(s=>`<li class="entry"><div><strong>${esc(dateLabel(localDate(s.started_at)))}</strong><small>${fmtDur(s.duration_s)} ${esc(x.hours)}</small></div><b>${kmOf(s).toFixed(1)} ${esc(x.km)}</b></li>`).join('')}</ul></section>`:''}
 <section class="card"><h3>${esc(x.entries)}</h3>${items.length?`<ul class="rows">${items.map(e=>rowHtml(e)).join('')}</ul>`:`<p class="muted">${esc(x.empty)}</p>`}</section>`;
}
function sheetView(){
 const x=t(),sh=S.sheet;
 if(sh.type==='nick')return `<div class="sheet-bg"><form class="sheet" data-act="nick"><h3>${esc(x.askNick)}</h3><label><input id="n-nick" maxlength="20" autocomplete="username"><small>${esc(x.nickRule)}</small></label>${S.msg?`<p class="msg">${esc(S.msg)}</p>`:''}<button class="btn primary" type="submit">${esc(x.save)}</button></form></div>`;
 if(sh.type==='gps')return `<div class="sheet-bg" data-act="sheet-bg"><div class="sheet"><h3>${esc(x.gpsTitle)}</h3><div class="notice"><p>${esc(x.gpsText)}</p></div><div class="row"><button class="btn ghost" data-act="sheet-close">${esc(x.cancel)}</button><button class="btn primary" data-act="gps-allow">${esc(x.gpsAllow)}</button></div></div></div>`;
 const kind=sh.kind,cats=CATS[kind];
 return `<div class="sheet-bg" data-act="sheet-bg"><div class="sheet" role="dialog" aria-modal="true"><div class="seg wide">${['sale','expense','income'].map(k=>`<button data-act="kind" data-v="${k}" aria-pressed="${kind===k}">${esc(x.kind[k])}</button>`).join('')}</div><div class="amount" id="amt" aria-live="polite">${esc(sh.amount||'0')}</div>
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
async function openStaff(id){
 const row=(S.overview||[]).find(r=>(r.user_id||r.nickname)===id);if(!row)return;
 if(S.demo){S.detail={nickname:row.nickname,entries:[],sessions:[]};render();return}
 const [en,se]=await Promise.all([sb.from('bt_entries').select('id,kind,amount,category,note,entry_date,created_at,photo_path').eq('user_id',row.user_id).is('deleted_at',null).order('entry_date',{ascending:false}).limit(300),sb.from('bt_sessions').select('id,started_at,ended_at,distance_m,duration_s').eq('user_id',row.user_id).order('started_at',{ascending:false}).limit(30)]);
 S.detail={nickname:row.nickname,entries:(en.data||[]).map(r=>({id:r.id,kind:r.kind,amount:Number(r.amount),category:r.category,note:r.note,date:r.entry_date,created_at:r.created_at,photo_path:r.photo_path})),sessions:se.data||[]};render();
}

/* ---------- render + events ---------- */
function render(){
 const root=$('#app'),open=$('#apk')?.open;
 document.documentElement.lang=S.lang;document.title=t().app;
 root.innerHTML=!S.user&&!S.demo?authView():appView();
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
 if(act==='goals'){const v=Math.max(0,Number(String($('#g-daily').value).replace(',','.'))||0);S.goals.daily=v;S.dirty.goals=true;persist();S.msg=t().goalSaved;render();S.msg='';sync();return}
 if(act==='nick'){const nick=$('#n-nick').value.trim();if(!NICK.test(nick)){S.msg=t().nickRule;return render()}const r=await sb.from('bt_profiles').insert({nickname:nick});if(r.error){S.msg=r.error.code==='23505'?t().nickTaken:t().netErr;return render()}S.nick=nick;S.sheet=null;S.msg='';const {data}=await sb.from('bt_admins').select('user_id').maybeSingle();S.admin=!!data;render();say('welcome');sync()}
});
document.addEventListener('change',async e=>{
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
 else if(a==='tab'){if(v==='add'){openSheet()}else{S.tab=v;S.detail=null;S.workDetail=null;S.msg='';if(v==='watch'&&!S.demo)S.overview=null}render()}
 else if(a==='quick'){openSheet('expense',v);render()}
 else if(a==='filter'){S.filter=v;render()}
 else if(a==='cur'){S.cur=v;saveSettings();render()}
 else if(a==='days'){const i=$('#g-daily');if(i)S.goals.daily=Math.max(0,Number(i.value.replace(',','.'))||0);S.goals.days=Number(v);S.dirty.goals=true;persist();sync();render()}
 else if(a==='sound'){S.sound=b.checked;saveSettings()}
 else if(a==='export')csv();
 else if(a==='sync')sync();
 else if(a==='logout')logout();
 else if(a==='del'){if(confirm(t().confirmDel))removeEntry(b.dataset.id)}
 else if(a==='photo')openPhoto(b.dataset.id,b.dataset.path);
 else if(a==='viewer-close'){if(e.target===b||b.tagName==='BUTTON'){URL.revokeObjectURL(S.viewer);S.viewer=null;render()}}
 else if(a==='staff')openStaff(b.dataset.id);
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
 if(q.has('demo'))return startDemo(q.get('demo')==='admin');
 if(!sb)return;
 const {data}=await sb.auth.getSession();
 if(data.session)enter(data.session.user);
 sb.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT'&&!S.demo){S.user=null;render()}});
}
boot();
