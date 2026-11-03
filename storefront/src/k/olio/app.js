import '../ribbon.css';
import './style.css';
import '../../i18n.js';

const D=JSON.parse(document.getElementById('k-data').textContent);
const R=D.r;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const fill=(s,v)=>s.replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');

// ---- this month in the producers' table ----
const month=new Date().getMonth()+1;
$$('.ol-season [data-m]').forEach(c=>c.classList.toggle('now',+c.dataset.m===month));

// ---- dietary filter ----
const dishes=$$('.ol-dish'),count=$('.ol-count'),empty=$('.ol-empty');
function applyFilter(){
 const on=$$('.ol-filter input:checked').map(i=>i.value);
 let n=0;
 for(const li of dishes){
  const m=li.dataset.marks.split(' ');
  const ok=on.every(f=>f==='nonuts'?!m.includes('n'):m.includes(f));
  li.classList.toggle('is-out',!ok);
  if(ok)n++;
 }
 count.textContent=on.length?fill(R.count,{n,all:dishes.length}):'';
 empty.hidden=n>0;empty.textContent=n?'':R.empty;
}
$$('.ol-filter input').forEach(i=>i.addEventListener('change',applyFilter));

// ---- dish detail ----
const detail=$('#ol-detail');
const narrow=matchMedia('(max-width: 899px)');
function openDish(btn){
 const li=btn.closest('.ol-dish'),d=D.dishes[li.dataset.id];
 $$('.ol-dish-btn[aria-expanded="true"]').forEach(b=>b.setAttribute('aria-expanded','false'));
 btn.setAttribute('aria-expanded','true');
 detail.innerHTML=`<div class="ol-card">${d.img?`<figure>${d.img}</figure>`:''}<div class="ol-card-body"><h3>${esc(d.name)}</h3><p class="ol-card-price">${esc(d.price)} <span>${esc(d.g)}</span></p><p>${esc(d.desc)}</p><dl><div><dt>${esc(R.ing)}</dt><dd>${esc(d.ing)}</dd></div><div><dt>${esc(R.from)}</dt><dd>${esc(d.from)}</dd></div><div><dt>${esc(R.allergens)}</dt><dd>${esc(d.allergens)}</dd></div></dl>${d.marks.length?`<p class="ol-card-marks">${d.marks.map(esc).join(', ')}</p>`:''}<button type="button" class="ol-close">${esc(R.close)}</button></div></div>`;
 detail.classList.add('is-open');
 if(!reduce.matches){detail.classList.remove('flash');void detail.offsetWidth;detail.classList.add('flash')}
 if(narrow.matches){document.body.classList.add('ol-lock');detail.focus()}
 $('.ol-close',detail).addEventListener('click',()=>closeDish(btn));
}
function closeDish(btn){
 detail.classList.remove('is-open');document.body.classList.remove('ol-lock');
 if(btn){btn.setAttribute('aria-expanded','false');btn.focus()}
}
$$('.ol-dish-btn').forEach(b=>b.addEventListener('click',()=>openDish(b)));
// On wide screens the card pane starts with the bread, so the column is never empty.
if(!narrow.matches){openDish($('.ol-dish[data-id=bread] .ol-dish-btn'));detail.classList.remove('flash')}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&detail.classList.contains('is-open')&&narrow.matches)closeDish($('.ol-dish-btn[aria-expanded="true"]'))});

// ---- reservation request ----
const form=$('.ol-form'),strip=$('.ol-daystrip'),slots=$('.ol-slots'),stub=$('.ol-stub'),done=$('.ol-done');
const st={date:null,time:null,party:2};
const pad=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const C=D.cal;
const fmtDay={format:d=>C.wd[d.getDay()]},fmtNum={format:d=>d.getDate()},fmtMon={format:d=>C.mon[d.getMonth()]},fmtLong={format:d=>`${C.wdl[d.getDay()]}, ${d.getDate()} ${C.monl[d.getMonth()]}`};
const now=new Date();const start=new Date(now.getFullYear(),now.getMonth(),now.getDate());
const days=Array.from({length:21},(_,i)=>new Date(start.getFullYear(),start.getMonth(),start.getDate()+i));
// Deterministic sample availability: same date and slot always show the same number of free tables.
function free(dateIso,time){
 let h=0;for(const c of dateIso+time)h=(h*31+c.charCodeAt(0))>>>0;
 const d=new Date(dateIso),wd=d.getDay(),hr=+time.slice(0,2);
 let n=h%6;
 if((wd===5||wd===6)&&hr>=19&&hr<=20)n=Math.max(0,n-3);
 return n;
}
const LUNCH=['12:00','12:30','13:00','13:30','14:00'],DINNER=['18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30'];
const WEEKEND=['15:00','16:00','17:00'];

strip.innerHTML=days.map((d,i)=>{
 const closed=d.getDay()===1;
 return `<button type="button" role="radio" aria-checked="false" data-date="${iso(d)}"${closed?' disabled aria-disabled="true"':''} title="${closed?esc(R.closed):esc(fmtLong.format(d))}"><span>${esc(i===0?R.today:fmtDay.format(d))}</span><b>${fmtNum.format(d)}</b><small>${closed?'×':esc(fmtMon.format(d).replace('.',''))}</small></button>`;
}).join('');
strip.insertAdjacentHTML('afterend',`<p class="ol-muted ol-closed-note">× ${esc(R.closed)}</p>`);
const dayBtns=$$('button',strip);
// roving focus for the day radiogroup
strip.addEventListener('keydown',e=>{
 const en=dayBtns.filter(b=>!b.disabled),i=en.indexOf(document.activeElement);
 if(i<0)return;
 const k={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[e.key];
 if(k){e.preventDefault();const b=en[(i+k+en.length)%en.length];b.focus();pickDate(b)}
});
dayBtns.forEach(b=>b.addEventListener('click',()=>pickDate(b)));
function pickDate(b){
 st.date=b.dataset.date;st.time=null;
 dayBtns.forEach(x=>{const on=x===b;x.setAttribute('aria-checked',on);x.tabIndex=on||(!st.date&&x===dayBtns.find(y=>!y.disabled))?0:-1});
 renderSlots();err('date');summary();
}
dayBtns.forEach(b=>b.tabIndex=-1);(dayBtns.find(b=>!b.disabled)||{}).tabIndex=0;

function renderSlots(){
 if(!st.date){slots.innerHTML=`<p class="ol-muted">${esc(R.pickDate)}</p>`;return}
 const d=new Date(st.date+'T00:00'),we=d.getDay()===0||d.getDay()===6,isToday=st.date===iso(now);
 const group=(label,list)=>`<div class="ol-slotgroup"><h4>${esc(label)}</h4><div>${list.map(tm=>{
  const past=isToday&&(+tm.slice(0,2)*60+ +tm.slice(3))<=now.getHours()*60+now.getMinutes()+30;
  const n=past?0:free(st.date,tm);
  return `<button type="button" class="ol-slot" data-time="${tm}" aria-pressed="false"${n?'':' disabled'}><b>${tm}</b><small>${n?esc(fill(R.left,{n})):esc(R.full)}</small></button>`}).join('')}</div></div>`;
 slots.innerHTML=group(R.lunch,we?[...LUNCH,...WEEKEND]:LUNCH)+group(R.dinner,DINNER);
 $$('.ol-slot',slots).forEach(b=>b.addEventListener('click',()=>{
  st.time=b.dataset.time;$$('.ol-slot',slots).forEach(x=>x.setAttribute('aria-pressed',x===b));err('time');summary();
 }));
}
renderSlots();

const partyOut=$('[data-party]');
$$('[data-step]').forEach(b=>b.addEventListener('click',()=>{
 const n=st.party+ +b.dataset.step;
 if(n<1)return;
 if(n>8){err('party',R.bigParty,true);return}
 st.party=n;partyOut.textContent=n;checkBar();summary();
}));
$$('input[name=seat]').forEach(r=>r.addEventListener('change',()=>{checkBar();summary()}));
function seat(){return $('input[name=seat]:checked').value}
function checkBar(){
 if(seat()==='bar'&&st.party>3){err('party',R.barLimit,true);return false}
 err('party');return true;
}
function err(k,msg,link){
 const el=$(`[data-err="${k}"]`,form);if(!el)return;
 el.hidden=!msg;el.innerHTML=msg?esc(msg)+(link&&k==='party'&&st.party>=8?` <a href="#ol-private">${esc(R.privLink)}</a>`:''):'';
 const input=form.elements[k];if(input&&input.setAttribute)input.setAttribute('aria-invalid',msg?'true':'false');
}
const partyText=n=>n===1?R.guest1:fill(R.guests,{n});
function summary(){
 $('[data-s=date]',stub).textContent=st.date?fmtLong.format(new Date(st.date+'T00:00')):'—';
 $('[data-s=time]',stub).textContent=st.time||'—';
 $('[data-s=party]',stub).textContent=partyText(st.party);
 $('[data-s=seat]',stub).textContent=D.seats[seat()];
}
summary();

const phoneOk=v=>{const s=v.replace(/[\s()-]/g,'');return /^(?:\+994|0)(?:10|50|51|55|60|70|77|99|12)\d{7}$/.test(s)};
form.elements.name.addEventListener('input',()=>{if(form.elements.name.value.trim().length>1)err('name')});
// Errors clear while typing (so the layout does not jump under the pointer on blur) and appear on blur.
form.elements.phone.addEventListener('input',()=>{if(phoneOk(form.elements.phone.value))err('phone')});
form.elements.phone.addEventListener('blur',()=>{const v=form.elements.phone.value;if(v&&!phoneOk(v))err('phone',R.phoneErr)});
form.addEventListener('submit',e=>{
 e.preventDefault();
 let bad=null;const mark=(k,m)=>{err(k,m);if(m&&!bad)bad=k};
 mark('date',st.date?'':R.pickDate);
 mark('time',st.date&&!st.time?R.pickTime:'');
 if(!checkBar()&&!bad)bad='party';
 mark('name',form.elements.name.value.trim().length>1?'':R.nameErr);
 mark('phone',phoneOk(form.elements.phone.value)?'':R.phoneErr);
 err('form',bad?R.fix:'');
 if(bad){
  const target={date:strip,time:slots,party:$('.ol-party'),name:form.elements.name,phone:form.elements.phone}[bad];
  target.scrollIntoView({block:'center',behavior:reduce.matches?'auto':'smooth'});
  (target.matches('input')?target:$('button:not([disabled])',target)||target).focus({preventScroll:true});
  return;
 }
 const code='OL-'+st.date.slice(5).replace('-','')+'-'+String(Math.floor(Math.random()*900)+100);
 done.innerHTML=`<h3>${esc(R.doneH)}</h3><p>${esc(fill(R.done,{name:form.elements.name.value.trim(),date:fmtLong.format(new Date(st.date+'T00:00')),time:st.time,party:partyText(st.party),seat:D.seats[seat()],code}))}</p><p class="ol-demo">${esc(R.demo)}</p><button type="button" class="ol-btn" data-again>${esc(R.again)}</button>`;
 form.hidden=true;stub.hidden=true;done.hidden=false;done.focus();
 $('[data-again]',done).addEventListener('click',()=>{
  form.reset();st.date=null;st.time=null;st.party=2;partyOut.textContent='2';
  dayBtns.forEach(x=>x.setAttribute('aria-checked','false'));renderSlots();summary();
  ['date','time','party','name','phone','form'].forEach(k=>err(k));
  done.hidden=true;form.hidden=false;stub.hidden=false;(dayBtns.find(b=>!b.disabled)).focus();
 });
});
