import '../src/fonts.css';
import './app.css';
import {T,CATS,CURRENCIES,AUDIO_LANGS} from './strings.js';

const SB_URL='https://yxiedrrahclzqukfnqrn.supabase.co',SB_KEY='sb_publishable_n0X-RVe8A6z9HviK4qsWAg_FgTTKJq2';
const APK_URL='/budgettracker/bakhy-budget.apk';
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS={get(k,d){try{const v=localStorage.getItem('bt.'+k);return v==null?d:JSON.parse(v)}catch{return d}},set(k,v){try{localStorage.setItem('bt.'+k,JSON.stringify(v))}catch{}}};
const pad=n=>String(n).padStart(2,'0');
const today=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const ym=d=>d.slice(0,7);
const uuid=()=>crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:r&3|8).toString(16)});

const saved=LS.get('settings',{}),guess=()=>{const l=(navigator.language||'az').slice(0,2);return ['az','ru','en'].includes(l)?l:'az'};
const S={lang:saved.lang||guess(),cur:saved.cur||'AZN',sound:saved.sound!==false,user:null,nick:'',admin:false,demo:false,entries:[],goals:{daily:0},pending:new Set(),dirty:{goals:false,budgets:false},lastSync:null,flags:{},tab:'home',filter:'all',overview:null,detail:null,sheet:null,authMode:'signin',msg:'',syncing:false};
const t=()=>T[S.lang];
const saveSettings=()=>LS.set('settings',{lang:S.lang,cur:S.cur,sound:S.sound});
const sb=window.supabase?window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'bt.auth'}}):null;
const money=n=>{try{return new Intl.NumberFormat({az:'az-AZ',ru:'ru-RU',en:'en-GB'}[S.lang],{style:'currency',currency:S.cur,maximumFractionDigits:2}).format(n||0)}catch{return (n||0).toFixed(2)+' '+S.cur}};
const dateLabel=d=>{try{return new Date(d+'T00:00:00').toLocaleDateString({az:'az-AZ',ru:'ru-RU',en:'en-GB'}[S.lang],{day:'numeric',month:'long',weekday:'short'})}catch{return d}};
const live=()=>S.entries.filter(e=>!e.deleted_at);
const sum=(arr,k)=>arr.filter(e=>e.kind===k).reduce((a,e)=>a+e.amount,0);
const inMonth=(e,m)=>e.date.startsWith(m);

/* ---------- spoken feedback (files are provided separately) ---------- */
function say(name){if(!S.sound||!AUDIO_LANGS.includes(S.lang))return;try{const a=new Audio(`/budgettracker/audio/${S.lang}/${name}.mp3`);a.play().catch(()=>{})}catch{}}

/* ---------- local store ---------- */
const uid=()=>S.demo?'demo':S.user?.id;
function persist(){if(S.demo||!S.user)return;LS.set('u.'+uid(),{entries:S.entries,goals:S.goals,pending:[...S.pending],dirty:S.dirty,lastSync:S.lastSync,flags:S.flags})}
function restore(){const d=S.demo?{}:LS.get('u.'+uid(),{});S.entries=d.entries||[];S.goals={daily:Number(d.goals&&(d.goals.daily??d.goals.sales))||0};S.pending=new Set(d.pending||[]);S.dirty=d.dirty||{goals:false,budgets:false};S.lastSync=d.lastSync||null;S.flags=d.flags||{}}

/* ---------- sync ---------- */
async function sync(){
 if(S.demo||!S.user||!sb||!navigator.onLine||S.syncing)return;S.syncing=true;
 try{
  const todo=S.entries.filter(e=>S.pending.has(e.id));
  for(let i=0;i<todo.length;i+=100){
   const rows=todo.slice(i,i+100).map(e=>({id:e.id,kind:e.kind,amount:e.amount,category:e.category,note:e.note,entry_date:e.date,created_at:e.created_at,deleted_at:e.deleted_at||null}));
   const {error}=await sb.from('bt_entries').upsert(rows,{onConflict:'id'});if(error)throw error;rows.forEach(r=>S.pending.delete(r.id));
  }
  if(S.dirty.goals){const {error}=await sb.from('bt_goals').upsert({user_id:S.user.id,daily_target:S.goals.daily});if(error)throw error;S.dirty.goals=false}
  let q=sb.from('bt_entries').select('id,kind,amount,category,note,entry_date,created_at,updated_at,deleted_at').order('updated_at',{ascending:true}).limit(1000);
  if(S.lastSync)q=q.gt('updated_at',S.lastSync);
  const {data,error}=await q;if(error)throw error;
  for(const r of data){const e={id:r.id,kind:r.kind,amount:Number(r.amount),category:r.category,note:r.note,date:r.entry_date,created_at:r.created_at,deleted_at:r.deleted_at};const i=S.entries.findIndex(x=>x.id===e.id);if(i<0)S.entries.push(e);else if(!S.pending.has(e.id))S.entries[i]=e;S.lastSync=r.updated_at}
  if(!S.dirty.goals){const {data:g}=await sb.from('bt_goals').select('daily_target').maybeSingle();if(g)S.goals={daily:Number(g.daily_target)}}
  persist();
 }catch(err){console.warn('sync failed',err)}finally{S.syncing=false;render()}
}

/* ---------- auth ---------- */
const NICK=/^[A-Za-z0-9_.-]{3,20}$/;
async function enter(user){
 S.user=user;S.demo=false;restore();S.tab='home';
 try{if(!(await ensureProfile())){render();return}}catch(e){console.warn(e)}
 try{const {data}=await sb.from('bt_admins').select('user_id').maybeSingle();S.admin=!!data}catch{S.admin=false}
 render();say('loginOk');sync();
}
async function ensureProfile(){
 const {data}=await sb.from('bt_profiles').select('nickname').eq('user_id',S.user.id).maybeSingle();
 if(data){S.nick=data.nickname;return true}
 const nick=S.user.user_metadata?.nickname;
 if(nick&&NICK.test(nick)){const r=await sb.from('bt_profiles').insert({nickname:nick});if(!r.error){S.nick=nick;return true}if(r.error.code!=='23505')throw r.error;S.msg=t().nickTaken}
 S.sheet={type:'nick'};return false;
}
async function submitAuth(){
 const email=$('#f-email').value.trim(),pw=$('#f-pw').value,signup=S.authMode==='signup';
 S.msg='';
 if(!email||!pw){return setMsg(t().badLogin)}
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
async function logout(){if(S.demo){S.demo=false;S.user=null;S.entries=[];S.admin=false;render();return}await sb.auth.signOut();S.user=null;S.nick='';S.admin=false;S.entries=[];S.tab='home';render()}

/* ---------- demo data ---------- */
function startDemo(){
 S.demo=true;S.user=null;S.nick='demo';S.admin=true;S.tab='home';S.goals={daily:120};S.pending=new Set();S.flags={};
 const d=new Date(),mk=(back,kind,amount,category,note)=>{const x=new Date(d);x.setDate(d.getDate()-back);return{id:uuid(),kind,amount,category,note,date:`${x.getFullYear()}-${pad(x.getMonth()+1)}-${pad(x.getDate())}`,created_at:x.toISOString(),deleted_at:null}};
 S.entries=[mk(0,'sale',38,'delivery',''),mk(0,'sale',22.5,'delivery',''),mk(0,'sale',6,'tip',''),mk(0,'expense',18,'fuel',''),mk(0,'expense',7.5,'food',''),mk(1,'sale',96,'delivery',''),mk(1,'sale',14,'bonus',''),mk(1,'expense',21,'fuel',''),mk(2,'sale',118,'delivery',''),mk(2,'expense',45,'repair','Zəncir'),mk(3,'sale',84,'delivery',''),mk(3,'expense',6,'parking','')];
 S.overview=[{nickname:'ali.kuryer',today_earn:132,today_expense:18,month_earn:2940,total_earn:9810,daily_target:120,last_activity:new Date().toISOString()},{nickname:'leyla_m',today_earn:74,today_expense:12,month_earn:3120,total_earn:12120,daily_target:150,last_activity:new Date(Date.now()-36e5).toISOString()},{nickname:'rauf88',today_earn:0,today_expense:0,month_earn:1180,total_earn:3150,daily_target:100,last_activity:new Date(Date.now()-5*864e5).toISOString()}];
 render();say('welcome');
}

/* ---------- entries ---------- */
function addEntry({kind,amount,category,note,date}){
 const e={id:uuid(),kind,amount,category,note,date,created_at:new Date().toISOString(),deleted_at:null};
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

/* ---------- views ---------- */
const ICON={home:'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',list:'M4 6h16M4 12h16M4 18h10',add:'M12 5v14M5 12h14',goals:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',settings:'M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6',watch:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'};
const icon=n=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;
const catName=id=>t().cat[id]||id;
const COLORS=7;

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
 const x=t(),tabs=['home','list','add','goals','settings'];if(S.admin)tabs.push('watch');
 const body={home:homeView,list:listView,goals:goalsView,settings:settingsView,watch:watchView,add:homeView}[S.tab]();
 return `${S.demo?`<div class="demo-bar">${esc(x.demoBanner)} <button class="link" data-act="logout">${esc(x.exitDemo)}</button></div>`:''}<div class="shell"><header class="top"><span class="brand small"><span class="logo">B</span>${esc(x.app)}</span><span class="who">${esc(S.nick)}${!navigator.onLine?` · ${esc(x.offline)}`:S.pending.size?` · ${esc(x.pending)}: ${S.pending.size}`:''}</span></header><main class="view">${body}</main>
 <nav class="tabs" aria-label="Navigation">${tabs.map(k=>`<button data-act="tab" data-v="${k}" class="${k==='add'?'plus':''}" aria-current="${S.tab===k&&k!=='add'}" aria-label="${esc(x[k])}">${icon(k)}<span>${esc(x[k])}</span></button>`).join('')}</nav></div>${S.sheet?sheetView():''}`;
}
function ring(data){
 const total=data.reduce((a,d)=>a+d.v,0),C=2*Math.PI*40;let off=0;
 if(!total)return `<svg class="ring" viewBox="0 0 100 100"><circle class="track" cx="50" cy="50" r="40"/></svg>`;
 return `<svg class="ring" viewBox="0 0 100 100"><circle class="track" cx="50" cy="50" r="40"/>${data.map((d,i)=>{const len=d.v/total*C,s=`<circle class="seg c${i%COLORS}" cx="50" cy="50" r="40" stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"/>`;off+=len;return s}).join('')}</svg>`;
}
function goalRing(pct){const C=2*Math.PI*40,len=C*pct/100;return `<svg class="ring goalring" viewBox="0 0 100 100" aria-hidden="true"><circle class="track" cx="50" cy="50" r="40"/><circle class="seg c1" cx="50" cy="50" r="40" stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}"/></svg>`}
function homeView(){
 const x=t(),d=today(),m=ym(d),day=live().filter(e=>e.date===d),mon=live().filter(e=>inMonth(e,m));
 const earn=sum(day,'sale'),spent=sum(day,'expense'),goal=S.goals.daily,pct=goal>0?Math.min(100,Math.round(earn/goal*100)):0,left=Math.max(0,goal-earn),done=goal>0&&earn>=goal;
 const byCat={};day.filter(e=>e.kind==='expense').forEach(e=>byCat[e.category]=(byCat[e.category]||0)+e.amount);
 const recent=live().sort((a,b)=>b.date.localeCompare(a.date)||b.created_at.localeCompare(a.created_at)).slice(0,5);
 return `<section class="card goal"><small>${esc(x.today)} · ${esc(x.dailyGoal)}</small><div class="goal-row"><div class="goal-ring">${goalRing(pct)}<span class="pct">${pct}%</span></div><div class="goal-text"><strong class="big">${money(earn)}</strong><span class="muted">${goal>0?`${esc(x.of)} ${money(goal)}`:esc(x.noGoal)}</span>${goal>0?`<span class="${done?'pos':'muted'}">${done?esc(x.reached):`${esc(x.remaining)}: ${money(left)}`}</span>`:''}</div></div><div class="two"><span class="pos">▲ ${esc(x.earned)} ${money(earn)}</span><span class="neg">▼ ${esc(x.spent)} ${money(spent)}</span><span>${esc(x.net)} <b>${money(earn-spent)}</b></span></div></section>
 <section class="card"><h3>${esc(x.todayExpenses)}</h3><div class="tiles">${CATS.expense.map(c=>`<button class="tile${byCat[c]?' has':''}" data-act="quick" data-v="${c}"><span>${esc(catName(c))}</span><b>${byCat[c]?money(byCat[c]):'+'}</b></button>`).join('')}</div><small class="muted">${esc(x.tapCat)}</small></section>
 <section class="card"><h3>${esc(x.monthTitle)}</h3><div class="two"><span class="pos">${esc(x.earned)} <b>${money(sum(mon,'sale'))}</b></span><span class="neg">${esc(x.spent)} <b>${money(sum(mon,'expense'))}</b></span></div></section>
 <section class="card"><h3>${esc(x.recent)}</h3>${recent.length?`<ul class="rows">${recent.map(e=>rowHtml(e,true)).join('')}</ul>`:`<p class="muted">${esc(x.empty)}</p>`}</section>`;
}
function rowHtml(e,del=false){const x=t();return `<li class="entry ${e.kind}"><div><strong>${esc(catName(e.category)||x.kind[e.kind])}</strong><small>${esc(e.note||x.kind[e.kind])} · ${esc(e.date)}</small></div><b>${e.kind==='expense'?'−':'+'}${money(e.amount)}</b>${del?`<button class="x" data-act="del" data-id="${e.id}" aria-label="${esc(x.del)}">×</button>`:''}</li>`}
function listView(){
 const x=t(),f=S.filter,items=live().filter(e=>f==='all'||e.kind===f).sort((a,b)=>b.date.localeCompare(a.date)||b.created_at.localeCompare(a.created_at));
 const groups={};items.forEach(e=>(groups[e.date]=groups[e.date]||[]).push(e));
 return `<div class="seg wide" role="group">${['all','sale','expense','income'].map(k=>`<button data-act="filter" data-v="${k}" aria-pressed="${f===k}">${esc(k==='all'?x.all:x.kind[k])}</button>`).join('')}</div>${items.length?Object.entries(groups).map(([d,arr])=>`<section class="card"><h3>${esc(dateLabel(d))}</h3><ul class="rows">${arr.map(e=>rowHtml(e,true)).join('')}</ul></section>`).join(''):`<p class="muted center">${esc(x.empty)}</p>`}`;
}
function goalsView(){
 const x=t();
 return `<form class="card form" data-act="goals"><h3>${esc(x.dailyTarget)}</h3><p class="muted">${esc(x.goalHelp)}</p><label><input id="g-daily" inputmode="decimal" value="${S.goals.daily||''}" aria-label="${esc(x.dailyTarget)}"></label><button class="btn primary" type="submit">${esc(x.save)}</button>${S.msg?`<p class="msg ok">${esc(S.msg)}</p>`:''}</form>`;
}
function settingsView(){
 const x=t();
 return `<section class="card form"><h3>${esc(x.account)}</h3><p>${esc(S.nick)}${S.user?.email?` · <span class="muted">${esc(S.user.email)}</span>`:''}</p><div class="notice"><strong>${esc(x.supNoticeTitle)}</strong><p>${esc(x.supNotice)}</p></div>
 <h3>${esc(x.language)}</h3>${langBar()}<h3>${esc(x.currency)}</h3><div class="seg wide">${CURRENCIES.map(c=>`<button data-act="cur" data-v="${c}" aria-pressed="${S.cur===c}">${c}</button>`).join('')}</div>
 <label class="check"><input id="s-sound" type="checkbox" data-act="sound" ${S.sound?'checked':''}> ${esc(x.sound)}</label>
 <button class="btn ghost" data-act="export">${esc(x.export)}</button>${S.demo?'':`<button class="btn ghost" data-act="sync">${esc(x.syncNow)}</button>`}<button class="btn danger" data-act="logout">${esc(x.logout)}</button></section>`;
}
function watchView(){
 const x=t();if(!S.admin)return `<p class="muted center">${esc(x.noAdmin)}</p>`;
 if(S.detail)return detailView();
 if(!S.overview){loadOverview();return `<p class="muted center">…</p>`}
 return `<h3 class="h">${esc(x.overview)}</h3>${S.overview.length?S.overview.map(r=>{const tg=Number(r.daily_target),te=Number(r.today_earn),p=tg>0?Math.min(100,Math.round(te/tg*100)):0;return `<button class="card staff" data-act="staff" data-id="${esc(r.user_id||r.nickname)}"><div class="row between"><strong>@${esc(r.nickname)}</strong><span class="muted">${r.last_activity?esc(new Date(r.last_activity).toLocaleDateString()):esc(x.never)}</span></div><div class="row between"><span>${esc(x.today)}</span><b>${money(te)}</b></div><progress max="100" value="${p}" class="${tg>0&&te>=tg?'done':''}"></progress><div class="row between muted"><span>${esc(x.target)}: ${tg>0?money(tg):esc(x.never)} · ${p}%</span><span>${esc(x.spent)}: ${money(Number(r.today_expense))}</span></div><div class="row between muted"><span>${esc(x.month)}: ${money(Number(r.month_earn))}</span><span>${esc(x.total)}: ${money(Number(r.total_earn))}</span></div></button>`}).join(''):`<p class="muted center">${esc(x.noStaff)}</p>`}`;
}
function detailView(){
 const x=t(),d=S.detail,items=d.entries||[];
 return `<button class="link" data-act="back">← ${esc(x.back)}</button><h3 class="h">@${esc(d.nickname)}</h3><section class="card"><div class="two"><span>${esc(x.kind.sale)}: <b>${money(sum(items,'sale'))}</b></span><span>${esc(x.kind.expense)}: <b>${money(sum(items,'expense'))}</b></span><span>${esc(x.kind.income)}: <b>${money(sum(items,'income'))}</b></span></div></section><section class="card"><h3>${esc(x.entries)}</h3>${items.length?`<ul class="rows">${items.map(e=>rowHtml(e)).join('')}</ul>`:`<p class="muted">${esc(x.empty)}</p>`}</section>`;
}
function sheetView(){
 const x=t(),sh=S.sheet;
 if(sh.type==='nick')return `<div class="sheet-bg"><form class="sheet" data-act="nick"><h3>${esc(x.askNick)}</h3><label><input id="n-nick" maxlength="20" autocomplete="username"><small>${esc(x.nickRule)}</small></label>${S.msg?`<p class="msg">${esc(S.msg)}</p>`:''}<button class="btn primary" type="submit">${esc(x.save)}</button></form></div>`;
 const kind=sh.kind,cats=CATS[kind];
 return `<div class="sheet-bg" data-act="sheet-bg"><div class="sheet" role="dialog" aria-modal="true"><div class="seg wide">${['sale','expense','income'].map(k=>`<button data-act="kind" data-v="${k}" aria-pressed="${kind===k}">${esc(x.kind[k])}</button>`).join('')}</div><div class="amount" id="amt" aria-live="polite">${esc(sh.amount||'0')}</div>
 <div class="chips">${cats.map(c=>`<button data-act="cat" data-v="${c}" aria-pressed="${sh.category===c}">${esc(catName(c))}</button>`).join('')}</div>
 <div class="keys">${['1','2','3','4','5','6','7','8','9','.','0','⌫'].map(k=>`<button data-act="key" data-v="${k}">${k}</button>`).join('')}</div>
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
 if(S.demo){S.detail={nickname:row.nickname,entries:[]};render();return}
 const {data}=await sb.from('bt_entries').select('id,kind,amount,category,note,entry_date,created_at,deleted_at').eq('user_id',row.user_id).is('deleted_at',null).order('entry_date',{ascending:false}).limit(300);
 S.detail={nickname:row.nickname,entries:(data||[]).map(r=>({id:r.id,kind:r.kind,amount:Number(r.amount),category:r.category,note:r.note,date:r.entry_date,created_at:r.created_at}))};render();
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
async function openApk(){
 const d=$('#apk');d.showModal();const go=$('#apk-go'),ok=$('#apk-ok');
 let exists=false;try{const r=await fetch(APK_URL,{method:'HEAD'});exists=r.ok&&!(r.headers.get('content-type')||'').includes('html')}catch{}
 $('#apk-soon').hidden=exists;const sync=()=>go.setAttribute('aria-disabled',String(!(exists&&ok.checked)));ok.onchange=sync;sync();
 go.onclick=e=>{if(go.getAttribute('aria-disabled')==='true')e.preventDefault()};
}
document.addEventListener('submit',async e=>{
 const f=e.target.closest('[data-act]');if(!f)return;e.preventDefault();
 const act=f.dataset.act;
 if(act==='auth')return submitAuth();
 if(act==='goals'){const v=Math.max(0,Number(String($('#g-daily').value).replace(',','.'))||0);S.goals={daily:v};S.dirty.goals=true;persist();S.msg=t().goalSaved;render();S.msg='';sync();return}
 if(act==='nick'){const nick=$('#n-nick').value.trim();if(!NICK.test(nick)){S.msg=t().nickRule;return render()}const r=await sb.from('bt_profiles').insert({nickname:nick});if(r.error){S.msg=r.error.code==='23505'?t().nickTaken:t().netErr;return render()}S.nick=nick;S.sheet=null;S.msg='';const {data}=await sb.from('bt_admins').select('user_id').maybeSingle();S.admin=!!data;render();say('welcome');sync()}
});
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-act]');if(!b||b.tagName==='FORM')return;const a=b.dataset.act,v=b.dataset.v;
 if(a==='lang'){S.lang=v;saveSettings();render()}
 else if(a==='mode'){S.authMode=S.authMode==='signup'?'signin':'signup';S.msg='';render()}
 else if(a==='demo')startDemo();
 else if(a==='apk')openApk();
 else if(a==='apk-close')$('#apk').close();
 else if(a==='quick'){openSheet('expense',v);render()}
 else if(a==='tab'){if(v==='add'){openSheet()}else{S.tab=v;S.detail=null;if(v==='watch'&&!S.demo)S.overview=null}render()}
 else if(a==='filter'){S.filter=v;render()}
 else if(a==='cur'){S.cur=v;saveSettings();render()}
 else if(a==='sound'){S.sound=b.checked;saveSettings()}
 else if(a==='export')csv();
 else if(a==='sync')sync();
 else if(a==='logout')logout();
 else if(a==='del'){if(confirm(t().confirmDel))removeEntry(b.dataset.id)}
 else if(a==='staff')openStaff(b.dataset.id);
 else if(a==='back'){S.detail=null;render()}
 else if(a==='kind'){keepSheet();S.sheet.kind=v;S.sheet.category=CATS[v][0];render()}
 else if(a==='cat'){keepSheet();S.sheet.category=v;render()}
 else if(a==='key'){let s=S.sheet.amount;if(v==='⌫')s=s.slice(0,-1);else if(v==='.'){if(!s.includes('.'))s=(s||'0')+'.'}else if(!(s.includes('.')&&s.split('.')[1].length>=2)&&s.length<10)s+=v;S.sheet.amount=s;setAmount()}
 else if(a==='sheet-close')closeSheet();
 else if(a==='sheet-bg'){if(e.target===b)closeSheet()}
 else if(a==='sheet-save'){const amount=Number(S.sheet.amount);if(!(amount>0)){say('error');return}addEntry({kind:S.sheet.kind,amount,category:S.sheet.category,note:$('#s-note').value.trim().slice(0,200),date:$('#s-date').value||today()});closeSheet()}
});
function closeSheet(){S.sheet=null;render()}
function keepSheet(){const n=$('#s-note'),d=$('#s-date');if(n)S.sheet.note=n.value;if(d&&d.value)S.sheet.date=d.value}
window.addEventListener('online',()=>{sync();render()});window.addEventListener('offline',render);

/* ---------- boot ---------- */
async function boot(){
 render();
 if('serviceWorker' in navigator)navigator.serviceWorker.register('/budgettracker/sw.js',{scope:'/budgettracker/'}).catch(()=>{});
 if(new URLSearchParams(location.search).has('demo'))return startDemo();
 if(!sb)return;
 const {data}=await sb.auth.getSession();
 if(data.session)enter(data.session.user);
 sb.auth.onAuthStateChange((ev,s)=>{if(ev==='SIGNED_OUT'&&!S.demo){S.user=null;render()}});
}
boot();
