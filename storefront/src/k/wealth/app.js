import '../ribbon.css';
import './style.css';
import '../../i18n.js';

// Growly planner: every number on screen (sentence, stats, chart, table) comes from project() below.
const D=JSON.parse(document.getElementById('k-data').textContent);
const S=D.S,LOC=S.locale;
const $=id=>document.getElementById(id);
const nf=new Intl.NumberFormat(LOC,{maximumFractionDigits:0});
const azn=n=>`${nf.format(Math.round(n))} AZN`;
const fill=(s,v)=>s.replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const now=new Date(),Y0=now.getFullYear(),M0=now.getMonth();
const monthAt=k=>{const m=M0+k;return {y:Y0+Math.floor(m/12),m:((m%12)+12)%12}};
const label=k=>{const d=monthAt(k);return `${S.monthsLong[d.m]} ${d.y}`};
const short=k=>{const d=monthAt(k);return `${S.months[d.m]} ${d.y}`};

let goals=D.goals.map(g=>({...g,extra:100,altrate:g.rate===0?2:Math.max(0,g.rate-2)}));
let sel=goals[0]?.id;
let monthlyView=false;

// Simulate n months: interest on the balance, then the contribution at month end.
function project(P,C,rate,n){
 const i=rate/100/12,rows=[{k:0,contrib:P,bal:P}];
 let bal=P,contrib=P;
 for(let k=1;k<=n;k++){bal=bal*(1+i)+C;contrib+=C;rows.push({k,contrib,bal})}
 return rows;
}
function required(T,P,rate,n){
 const i=rate/100/12;
 if(i===0)return (T-P)/n;
 const g=Math.pow(1+i,n);
 return (T-P*g)*i/(g-1);
}
function reachMonth(T,P,C,rate,cap=600){
 const i=rate/100/12;let bal=P;
 if(bal>=T)return 0;
 for(let k=1;k<=cap;k++){bal=bal*(1+i)+C;if(bal>=T-0.005)return k}
 return -1;
}

const form=$('gr-form');
const F=n=>form.elements[n];
// Date selects: months and next 40 years.
for(let y=Y0;y<=Y0+40;y++)F('year').insertAdjacentHTML('beforeend',`<option value="${y}">${y}</option>`);
S.monthsLong.forEach((m,i)=>F('month').insertAdjacentHTML('beforeend',`<option value="${i}">${esc(m)}</option>`));
for(let r=0;r<=10;r+=0.5)F('altrate').insertAdjacentHTML('beforeend',`<option value="${r}">${new Intl.NumberFormat(LOC,{maximumFractionDigits:1}).format(r)}%</option>`);

function goal(){return goals.find(g=>g.id===sel)}
function load(g){
 const d=monthAt(g.months);
 F('name').value=g.name;F('target').value=g.target;F('current').value=g.current;F('monthly').value=g.monthly;
 F('rate').value=g.rate;$('gr-rate-range').value=g.rate;F('inflation').value=g.inflation;F('extra').value=g.extra;F('altrate').value=String(g.altrate);
 F('year').value=String(d.y);F('month').value=String(d.m);
 form.querySelectorAll('.is-bad').forEach(x=>x.classList.remove('is-bad'));form.querySelectorAll('.gr-err').forEach(x=>x.textContent='');
}
const num=v=>v===''||v==null?NaN:Number(String(v).replace(',','.').replace(/\s/g,''));
function read(){
 const v={name:F('name').value.trim(),target:num(F('target').value),current:num(F('current').value),monthly:num(F('monthly').value),rate:num(F('rate').value),inflation:F('inflation').value===''?0:num(F('inflation').value),extra:F('extra').value===''?0:num(F('extra').value),altrate:Number(F('altrate').value)};
 v.months=(Number(F('year').value)-Y0)*12+Number(F('month').value)-M0;
 const bad={};
 if(!v.name)bad.name=1;
 if(!(v.target>=1&&v.target<=1e7))bad.target=1;
 if(!(v.current>=0&&v.current<=1e8))bad.current=1;
 if(!(v.monthly>=0&&v.monthly<=1e6))bad.monthly=1;
 if(!(v.rate>=0&&v.rate<=10))bad.rate=1;
 if(!(v.inflation>=0&&v.inflation<=20))bad.inflation=1;
 if(!(v.extra>=-1e5&&v.extra<=1e5))bad.extra=1;
 if(!(v.months>=1&&v.months<=480))bad.date=1;
 return {v,bad};
}
function showErrors(bad,touchedOnly){
 for(const k of ['name','target','current','monthly','rate','inflation','extra','date']){
  const box=form.querySelector(`[data-field="${k}"]`),err=$(`gr-${k}-err`),inp=k==='date'?null:F(k);
  const on=!!bad[k];box.classList.toggle('is-bad',on);err.textContent=on?S.err[k]:'';
  if(inp)inp.setAttribute('aria-invalid',on?'true':'false');
 }
}

let state=null;
function compute(){
 const {v,bad}=read();
 showErrors(bad);
 $('gr-goal-title').textContent=v.name||S.newName;
 $('gr-months-left').textContent=v.months>=1?fill(S.inMonths,{n:v.months}):'';
 if(Object.keys(bad).length){
  state=null;$('gr-summary').textContent=S.invalid;$('gr-status').textContent='';$('gr-whatif-out').textContent='';
  ['balance','contrib','growth'].forEach(k=>$(`gr-s-${k}`).textContent='—');$('gr-real').hidden=true;
  document.querySelector('.gr-plan').classList.add('is-invalid');drawEmpty();$('gr-tbody').innerHTML='';return;
 }
 document.querySelector('.gr-plan').classList.remove('is-invalid');
 const n=v.months,rows=project(v.current,v.monthly,v.rate,n);
 const wC=Math.max(0,v.monthly+v.extra),wrows=project(v.current,wC,v.altrate,n);
 const end=rows[n],req=required(v.target,v.current,v.rate,n),reach=reachMonth(v.target,v.current,v.monthly,v.rate);
 const dateL=label(n);
 let sum,status='',tone='';
 if(v.current>=v.target){sum=fill(S.reached,{current:azn(v.current),target:azn(v.target)});tone='good'}
 else{
  sum=req<=0?fill(S.needNone,{current:azn(v.current),target:azn(v.target),date:dateL}):fill(S.need,{date:dateL,target:azn(v.target),monthly:azn(Math.ceil(req))});
  if(reach>=0&&reach<n){status=fill(S.onTrack,{monthly:azn(v.monthly),reach:label(reach),ahead:n-reach});tone='good'}
  else if(reach===n){status=fill(S.onTime,{monthly:azn(v.monthly),reach:label(reach)});tone='good'}
  else{status=fill(S.behind,{monthly:azn(v.monthly),date:dateL,gap:azn(v.target-end.bal)})+' '+(reach>0?fill(S.behindReach,{reach:label(reach)}):S.behindNever);tone='short'}
 }
 $('gr-summary').textContent=sum;
 const st=$('gr-status');st.textContent=status;st.dataset.tone=tone;
 $('gr-s-balance').textContent=azn(end.bal);$('gr-s-contrib').textContent=azn(end.contrib);$('gr-s-growth').textContent=azn(end.bal-end.contrib);
 const real=$('gr-real');
 if(v.inflation>0){real.hidden=false;real.textContent=fill(S.real,{inflation:new Intl.NumberFormat(LOC,{maximumFractionDigits:1}).format(v.inflation),real:azn(end.bal/Math.pow(1+v.inflation/100,n/12))})}else real.hidden=true;
 const diff=wrows[n].bal-end.bal,dr=Math.round(Math.abs(diff));
 $('gr-whatif-out').textContent=fill(S.whatif,{monthly:azn(wC),rate:new Intl.NumberFormat(LOC,{maximumFractionDigits:1}).format(v.altrate),date:dateL,balance:azn(wrows[n].bal),diff:dr===0?S.same:fill(diff>0?S.more:S.less,{diff:nf.format(dr)})});
 state={v,rows,wrows,n};
 draw();table();
}

// ---- chart ----
const svg=$('gr-svg'),tip=$('gr-tip');
let W=720,H=340,focusK=null;
const PAD={l:64,r:16,t:26,b:34};
function nice(max,count){const raw=max/count,p=Math.pow(10,Math.floor(Math.log10(raw||1)));for(const m of [1,2,2.5,5,10])if(m*p>=raw)return m*p;return 10*p}
function drawEmpty(){svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.innerHTML=`<rect class="gr-empty-rect" x="${PAD.l}" y="${PAD.t}" width="${W-PAD.l-PAD.r}" height="${H-PAD.t-PAD.b}" rx="6"/>`;tip.hidden=true}
function draw(){
 if(!state)return drawEmpty();
 const {v,rows,wrows,n}=state;
 const maxY=Math.max(v.target,rows[n].bal,wrows[n].bal)*1.06;
 const step=nice(maxY,H<300?4:5),top=Math.ceil(maxY/step)*step;
 const iw=W-PAD.l-PAD.r,ih=H-PAD.t-PAD.b;
 const x=k=>PAD.l+k/n*iw,y=val=>PAD.t+ih-val/top*ih;
 const pts=(arr,f)=>arr.map(r=>`${x(r.k).toFixed(1)},${y(f(r)).toFixed(1)}`).join(' ');
 let g='';
 for(let val=0;val<=top+0.1;val+=step){const yy=y(val).toFixed(1);g+=`<line class="gr-grid" x1="${PAD.l}" x2="${W-PAD.r}" y1="${yy}" y2="${yy}"/><text class="gr-ax" x="${PAD.l-8}" y="${(+yy+4).toFixed(1)}" text-anchor="end">${nf.format(val)}</text>`}
 // x ticks: years, thinned to fit the width
 const span=n/12,every=Math.max(1,Math.ceil(span/(iw/90)));
 const ticks=[0];for(let k=1;k<=n;k++){const d=monthAt(k);if(d.m===0&&(d.y-Y0)%every===0)ticks.push(k)}
 if(n<=18){ticks.length=0;for(let k=0;k<=n;k+=Math.max(1,Math.ceil(n/(iw/80))))ticks.push(k)}
 let lastX=-99;for(const k of ticks){if(x(k)-lastX<56)continue;lastX=x(k);g+=`<text class="gr-ax" x="${x(k).toFixed(1)}" y="${H-12}" text-anchor="${k===0?'start':'middle'}">${esc(n<=18?short(k):String(monthAt(k).y))}</text>`}
 g+=`<line class="gr-base" x1="${PAD.l}" x2="${W-PAD.r}" y1="${y(0)}" y2="${y(0)}"/>`;
 g+=`<text class="gr-ax gr-unit" x="${PAD.l-8}" y="11" text-anchor="end">AZN</text>`;
 // stacked: contributions below, growth band above
 const base=`${x(n).toFixed(1)},${y(0)} ${x(0).toFixed(1)},${y(0)}`;
 g+=`<polygon class="gr-a-c" points="${pts(rows,r=>r.contrib)} ${base}"/>`;
 g+=`<polygon class="gr-a-g" points="${pts(rows,r=>r.bal)} ${pts([...rows].reverse(),r=>r.contrib)}"/>`;
 g+=`<polyline class="gr-l-b" points="${pts(rows,r=>r.bal)}"/>`;
 g+=`<polyline class="gr-l-w" points="${pts(wrows,r=>r.bal)}"/>`;
 const ty=y(v.target);
 g+=`<line class="gr-l-t" x1="${PAD.l}" x2="${W-PAD.r}" y1="${ty}" y2="${ty}"/><text class="gr-lab" x="${PAD.l+6}" y="${ty-6}">${esc(fill(S.goalLine,{target:azn(v.target)}))}</text>`;
 const ex=x(n),eb=y(rows[n].bal);
 g+=`<circle class="gr-dot" cx="${ex}" cy="${eb}" r="4.5"/>`;
 g+=`<g id="gr-cross" class="gr-cross" hidden><line id="gr-cx" y1="${PAD.t}" y2="${y(0)}"/><circle id="gr-cd" r="5"/></g>`;
 svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
 svg.setAttribute('aria-label',fill(S.chartLabel,{name:v.name,n}));
 svg.innerHTML=g;
 svg._geo={x,y,n,iw};
 if(focusK!=null)cross(Math.min(focusK,n));
}
function cross(k){
 if(!state)return;const {x,y}=svg._geo,{rows,wrows}=state,r=rows[k],w=wrows[k];
 focusK=k;
 const c=$('gr-cross');c.removeAttribute('hidden');
 $('gr-cx').setAttribute('x1',x(k));$('gr-cx').setAttribute('x2',x(k));$('gr-cd').setAttribute('cx',x(k));$('gr-cd').setAttribute('cy',y(r.bal));
 tip.hidden=false;
 tip.innerHTML=`<strong>${esc(label(k))}</strong><span><i class="gr-sw gr-sw-c"></i>${esc(S.tipContrib)} <b>${azn(r.contrib)}</b></span><span><i class="gr-sw gr-sw-g"></i>${esc(S.tipGrowth)} <b>${azn(r.bal-r.contrib)}</b></span><span>${esc(S.tipBalance)} <b>${azn(r.bal)}</b></span><span><i class="gr-sw gr-sw-w"></i>${esc(S.tipWhatif)} <b>${azn(w.bal)}</b></span>`;
 const px=x(k)/W*svg.clientWidth,box=svg.parentNode.clientWidth;
 const tw=tip.offsetWidth;tip.style.left=`${Math.max(0,Math.min(px-tw/2,box-tw))}px`;
}
function hide(){focusK=null;tip.hidden=true;$('gr-cross')?.setAttribute('hidden','')}
svg.addEventListener('pointermove',e=>{if(!state)return;const r=svg.getBoundingClientRect(),{n,iw}=svg._geo;const px=(e.clientX-r.left)/r.width*W;cross(Math.max(0,Math.min(n,Math.round((px-PAD.l)/iw*n))))});
svg.addEventListener('pointerleave',()=>{if(document.activeElement!==svg)hide()});
svg.addEventListener('focus',()=>{if(state)cross(focusK??state.n)});
svg.addEventListener('blur',hide);
svg.addEventListener('keydown',e=>{if(!state)return;const n=state.n;let k=focusK??n;
 if(e.key==='ArrowRight')k=Math.min(n,k+1);else if(e.key==='ArrowLeft')k=Math.max(0,k-1);else if(e.key==='Home')k=0;else if(e.key==='End')k=n;else if(e.key==='PageUp')k=Math.min(n,k+12);else if(e.key==='PageDown')k=Math.max(0,k-12);else return;
 e.preventDefault();cross(k)});
const ro=new ResizeObserver(()=>{const w=Math.round(svg.clientWidth);if(w&&w!==W){W=w;H=w<520?260:340;PAD.l=w<520?52:64;state?draw():drawEmpty()}});
ro.observe(svg);

// ---- table ----
function table(){
 const {rows,wrows,n}=state;
 const ks=monthlyView?rows.map(r=>r.k).slice(1):rows.map(r=>r.k).filter(k=>k>0&&(monthAt(k).m===11||k===n));
 $('gr-tbody').innerHTML=ks.map(k=>{const r=rows[k];return `<tr${k===n?' class="is-final"':''}><th scope="row">${esc(label(k))}${k===n?` <span class="gr-tag">${esc(S.final)}</span>`:''}</th><td>${azn(r.contrib)}</td><td>${azn(r.bal-r.contrib)}</td><td>${azn(r.bal)}</td><td>${azn(wrows[k].bal)}</td></tr>`}).join('');
 const b=$('gr-granularity');b.textContent=monthlyView?S.showYearly:S.showMonthly;b.setAttribute('aria-pressed',String(monthlyView));
}
$('gr-granularity').addEventListener('click',()=>{monthlyView=!monthlyView;if(state)table()});

// ---- goals list ----
function list(){
 const ul=$('gr-goal-list');
 ul.innerHTML=goals.map(g=>{const p=Math.min(100,Math.round(g.current/g.target*100));return `<li><button type="button" data-id="${g.id}" aria-current="${g.id===sel}"><span class="gr-g-name">${esc(g.name)}</span><span class="gr-g-meta">${azn(g.current)} / ${azn(g.target)}</span><span class="gr-g-bar" aria-hidden="true"><i data-p="${p}"></i></span><span class="sr-only">${p}%</span></button></li>`}).join('');
 ul.querySelectorAll('i[data-p]').forEach(i=>i.style.width=i.dataset.p+'%');
 const empty=$('gr-empty');empty.hidden=goals.length>0;empty.textContent=S.noGoals;
 $('gr-delete').disabled=!goal();
}
$('gr-goal-list').addEventListener('click',e=>{const b=e.target.closest('button[data-id]');if(!b)return;sel=b.dataset.id;load(goal());list();compute();if(matchMedia('(max-width:899px)').matches)tab('plan')});
let seq=0;
const addGoal=()=>{const g={id:'g'+(++seq),name:S.newName,target:5000,months:24,current:0,monthly:200,rate:0,inflation:0,extra:50,altrate:2};goals.push(g);sel=g.id;app.classList.remove('is-empty');load(g);list();compute();tab('plan');F('name').focus();F('name').select()};
$('gr-new').addEventListener('click',addGoal);$('gr-new2').addEventListener('click',addGoal);
function toast(msg){const t=$('gr-toast');t.textContent=msg;clearTimeout(toast.h);toast.h=setTimeout(()=>t.textContent='',5000)}
form.addEventListener('submit',e=>{e.preventDefault();const {v,bad}=read();if(Object.keys(bad).length){showErrors(bad);form.querySelector('.is-bad input,.is-bad select')?.focus();return}
 let g=goal();if(!g){g={id:'g'+(++seq)};goals.push(g);sel=g.id}
 Object.assign(g,{name:v.name,target:v.target,current:v.current,monthly:v.monthly,rate:v.rate,inflation:v.inflation,months:v.months,extra:v.extra,altrate:v.altrate});list();toast(fill(S.saved,{name:v.name}))});
$('gr-delete').addEventListener('click',()=>{const g=goal();if(!g||!confirm(fill(S.confirmDelete,{name:g.name})))return;goals=goals.filter(x=>x!==g);toast(fill(S.deleted,{name:g.name}));sel=goals[0]?.id;if(goal()){load(goal());list();compute()}else{list();emptyAll()}});
function emptyAll(){form.reset();F('name').value='';state=null;$('gr-goal-title').textContent=S.emptyTitle;$('gr-summary').textContent=S.noGoals;$('gr-status').textContent='';$('gr-status').dataset.tone='';$('gr-whatif-out').textContent='';drawEmpty();$('gr-tbody').innerHTML='';['balance','contrib','growth'].forEach(k=>$(`gr-s-${k}`).textContent='—');document.querySelector('.gr-app').classList.add('is-empty');tab('goals')}

// inputs
form.addEventListener('input',e=>{if(e.target.id==='gr-rate')$('gr-rate-range').value=e.target.value;if(!goal())return;compute()});
$('gr-rate-range').addEventListener('input',e=>{F('rate').value=e.target.value;compute()});
form.addEventListener('change',e=>{if(e.target.tagName==='SELECT'&&goal())compute()});

// mobile tabs
const app=document.querySelector('.gr-app');
function tab(k){app.dataset.pane=k;document.querySelectorAll('.gr-tabs button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===k)))}
document.querySelector('.gr-tabs').addEventListener('click',e=>{const b=e.target.closest('button[data-tab]');if(b){tab(b.dataset.tab);if(app.getBoundingClientRect().top<0)app.scrollIntoView({block:'start'})}});

load(goal());list();compute();
