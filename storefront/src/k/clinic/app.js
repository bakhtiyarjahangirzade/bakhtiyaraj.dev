import '../ribbon.css';
import './style.css';
import '../../i18n.js';

// Sunny Kids: today board + 5-step appointment request. Local state only; nothing is sent.
const D=JSON.parse(document.getElementById('k-data').textContent);
const S=D.S,$=id=>document.getElementById(id);
const fill=(s,v)=>s.replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const mins=h=>{const [a,b]=h.split(':').map(Number);return a*60+b};
const hhmm=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
// Clinic time is Baku time, whatever the visitor's device zone.
function bakuNow(){const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Baku',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date()).map(x=>[x.type,x.value]));return {date:new Date(Date.UTC(+p.year,+p.month-1,+p.day)),min:(+p.hour%24)*60+ +p.minute}}
const NOW=bakuNow();
const docHours=(d,wd)=>d.days.includes(wd)?[d.from,d.to]:d.extra?.[wd]||null;

// ---- today board ----
(function today(){
 const wd=NOW.date.getUTCDay(),h=S.hours[wd];
 $('sk-today-h').textContent=fill(S.today,{day:S.days[wd].toLowerCase()});
 let txt;
 if(h&&NOW.min>=mins(h[0])&&NOW.min<mins(h[1]))txt=fill(S.open,{to:h[1]});
 else if(h&&NOW.min<mins(h[0]))txt=fill(S.opensAt,{from:h[0]});
 else{let k=1;while(!S.hours[(wd+k)%7])k++;const n=(wd+k)%7;txt=fill(S.closedNext,{day:S.days[n],from:S.hours[n][0]})}
 const o=$('sk-open');o.textContent=txt;o.dataset.state=txt===fill(S.open,{to:h?.[1]})?'open':'closed';
 let shown=0;
 document.querySelectorAll('#sk-today-list li').forEach(li=>{const d=D.docs.find(x=>x.id===li.dataset.doc),hh=docHours(d,wd);li.hidden=!hh;if(hh){shown++;const t=li.querySelector('.sk-today-time');t.textContent=`${hh[0]}–${hh[1]}`;if(NOW.min>=mins(hh[1]))li.classList.add('is-past')}});
 const e=$('sk-today-empty');e.hidden=shown>0;e.textContent=S.noDocsToday;
})();
document.querySelectorAll('.sk-hours-t tr').forEach(tr=>{if(+tr.dataset.day===NOW.date.getUTCDay())tr.classList.add('is-today')});

// ---- request flow ----
const form=$('sk-form');
const st={step:1,spec:null,doc:null,day:null,time:null};
for(let a=0;a<=17;a++)form.elements.age.insertAdjacentHTML('beforeend',`<option value="${a}">${esc(a===0?S.under1:fill(S.years,{n:a}))}</option>`);

const specName=id=>D.spec.find(s=>s.id===id).name;
const dayLabel=d=>fill(S.dayFull,{day:S.days[d.getUTCDay()],d:d.getUTCDate(),month:S.months[d.getUTCMonth()]});
const iso=d=>d.toISOString().slice(0,10);
function hash(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
function slots(doc,day){
 const hh=docHours(doc,day.getUTCDay());if(!hh)return [];
 const len=D.spec.find(s=>s.id===doc.spec).slot,out=[];
 const isToday=iso(day)===iso(NOW.date);
 for(let m=mins(hh[0]);m+len<=mins(hh[1]);m+=len){
  const past=isToday&&m<NOW.min+60;
  out.push({t:hhmm(m),taken:past||hash(doc.id+iso(day)+m)%7<2});
 }
 return out;
}
function nextDays(doc){const out=[];for(let k=0;k<14;k++){const d=new Date(NOW.date.getTime()+k*864e5);if(docHours(doc,d.getUTCDay())&&slots(doc,d).some(s=>!s.taken))out.push(d)}return out}

function renderDocs(){
 const box=$('sk-docs');
 const list=D.docs.filter(d=>d.spec===st.spec);
 box.innerHTML=list.map(d=>{const hh=[...d.days.map(i=>S.dshort[i])],ex=Object.keys(d.extra||{}).map(i=>`${S.dshort[i]} ${d.extra[i][0]}–${d.extra[i][1]}`);return `<label class="sk-doc"><input type="radio" name="doc" value="${d.id}"${st.doc===d.id?' checked':''}><span><strong>${esc(d.name)}</strong><small>${esc(fill(S.docDays,{days:hh.join(', '),from:d.from,to:d.to}))}${ex.length?`; ${esc(ex.join(', '))}`:''}</small></span></label>`}).join('');
 if(list.length===1&&!st.doc){st.doc=list[0].id;box.querySelector('input').checked=true}
}
function renderDays(){
 const doc=D.docs.find(d=>d.id===st.doc),box=$('sk-days');
 const avail=new Set(nextDays(doc).map(iso));
 let html='';
 for(let k=0;k<14;k++){const d=new Date(NOW.date.getTime()+k*864e5),ok=avail.has(iso(d));
  html+=`<button type="button" class="sk-day" data-day="${iso(d)}" ${ok?'':'disabled'} aria-pressed="${st.day===iso(d)}"><span>${esc(S.dshort[d.getUTCDay()])}</span><b>${d.getUTCDate()}</b><small>${esc(S.months[d.getUTCMonth()].slice(0,3))}</small></button>`}
 box.innerHTML=avail.size?html:`<p class="sk-empty">${esc(S.noDays)}</p>`;
 $('sk-dur').textContent=`(${fill(S.durLine,{min:D.spec.find(s=>s.id===doc.spec).slot})})`;
 renderSlots();
}
function renderSlots(){
 const box=$('sk-slots');
 if(!st.day){box.innerHTML='';return}
 const doc=D.docs.find(d=>d.id===st.doc),list=slots(doc,new Date(st.day+'T00:00:00Z'));
 box.innerHTML=list.some(s=>!s.taken)?list.map(s=>`<button type="button" class="sk-slot" data-time="${s.t}" ${s.taken?'disabled':''} aria-pressed="${st.time===s.t}">${s.t}<span class="sr-only"> ${esc(s.taken?S.taken:S.free)}</span></button>`).join(''):`<p class="sk-empty">${esc(S.noSlots)}</p>`;
}

const steps=[...form.querySelectorAll('.sk-step')];
function go(n){
 st.step=n;
 steps.forEach(s=>{const k=+s.dataset.step;s.classList.toggle('is-open',k===n);s.classList.toggle('is-done',k<n);s.classList.toggle('is-later',k>n);s.querySelector('.sk-edit').hidden=!(k<n);s.querySelector('.sk-step-body').hidden=k!==n});
 summaries();
 const cur=steps[n-1];
 if(n===2)renderDocs();if(n===3)renderDays();if(n===5)review();
 cur.querySelector('h3').setAttribute('tabindex','-1');
 return cur;
}
function focusStep(n){const h=steps[n-1].querySelector('h3');h.focus({preventScroll:true});steps[n-1].scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}
function summaries(){
 const doc=D.docs.find(d=>d.id===st.doc);
 $('sk-sum-1').textContent=st.step>1&&st.spec?specName(st.spec):'';
 $('sk-sum-2').textContent=st.step>2&&doc?doc.name:'';
 $('sk-sum-3').textContent=st.step>3&&st.time?fill(S.slotLine,{day:dayLabel(new Date(st.day+'T00:00:00Z')),time:st.time}):'';
 $('sk-sum-4').textContent=st.step>4?`${form.elements.child.value.trim()}, ${form.elements.age.selectedOptions[0]?.textContent||''}`:'';
}
const phoneOk=v=>{const d=v.replace(/[^\d+]/g,'');const m=d.match(/^(?:\+?994|0)?(10|12|50|51|55|60|70|77|99)(\d{7})$/);return m};
function check(n){
 const e=[];
 const setF=(id,bad)=>{const el=$('sk-'+id),er=$(`sk-${id}-err`);el.setAttribute('aria-invalid',bad?'true':'false');el.closest('.sk-field').classList.toggle('is-bad',!!bad);er.textContent=bad?S.err[id]:'';if(bad)e.push(id)};
 if(n===1&&!st.spec)e.push('spec');
 if(n===2&&!st.doc)e.push('doc');
 if(n===3&&!(st.day&&st.time))e.push('slot');
 if(n===4){
  const f=form.elements;
  setF('child',f.child.value.trim().length<2);setF('age',f.age.value==='');setF('parent',f.parent.value.trim().length<2);setF('phone',!phoneOk(f.phone.value));setF('reason',f.reason.value.trim().length<5);
 }
 const box=$(`sk-err-${n}`);
 box.textContent=!e.length?'':n===4?fill(S.err.summary,{n:e.length}):S.err[e[0]];
 if(n===4&&e.length)$('sk-'+e[0]).focus();
 return !e.length;
}
function review(){
 const f=form.elements,doc=D.docs.find(d=>d.id===st.doc),m=phoneOk(f.phone.value);
 const rows=[[steps[0].querySelector('h3').textContent,specName(st.spec)],[steps[1].querySelector('h3').textContent,doc.name],[steps[2].querySelector('h3').textContent,fill(S.slotLine,{day:dayLabel(new Date(st.day+'T00:00:00Z')),time:st.time})],[form.querySelector('label[for=sk-child]').textContent,`${f.child.value.trim()}, ${f.age.selectedOptions[0].textContent}`],[form.querySelector('label[for=sk-parent]').textContent,f.parent.value.trim()],[form.querySelector('label[for=sk-phone]').textContent,`+994 ${m[1]} ${m[2].slice(0,3)} ${m[2].slice(3,5)} ${m[2].slice(5)}`],[form.querySelector('label[for=sk-reason]').textContent,f.reason.value.trim()],['',f.first.checked?S.first:S.repeat]];
 $('sk-review').innerHTML=rows.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
}

form.addEventListener('change',e=>{
 const t=e.target;
 if(t.name==='spec'){if(st.spec!==t.value){st.spec=t.value;st.doc=null;st.day=null;st.time=null}$('sk-err-1').textContent=''}
 if(t.name==='doc'){if(st.doc!==t.value){st.doc=t.value;st.day=null;st.time=null}$('sk-err-2').textContent=''}
});
form.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.next){const n=+b.dataset.next;if(check(n)){go(n+1);focusStep(n+1)}}
 else if(b.dataset.edit){go(+b.dataset.edit);focusStep(+b.dataset.edit)}
 else if(b.dataset.day){st.day=b.dataset.day;st.time=null;$('sk-days').querySelectorAll('.sk-day').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderSlots();$('sk-err-3').textContent=''}
 else if(b.dataset.time){st.time=b.dataset.time;$('sk-slots').querySelectorAll('.sk-slot').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('sk-err-3').textContent=''}
});
form.addEventListener('input',e=>{const f=e.target.closest('.sk-field');if(f?.classList.contains('is-bad')){f.classList.remove('is-bad');const er=f.querySelector('.sk-ferr');if(er)er.textContent='';e.target.setAttribute('aria-invalid','false')}});
form.addEventListener('submit',e=>{
 e.preventDefault();
 if(st.step!==5){const n=st.step;if(check(n)){go(n+1);focusStep(n+1)}return}
 const f=form.elements,doc=D.docs.find(d=>d.id===st.doc);
 const ref='SK-'+String(hash(st.doc+st.day+st.time+f.phone.value)%90000+10000);
 $('sk-done-text').textContent=`${S.refPrefix} ${ref}. ${f.child.value.trim()}, ${doc.name}, ${fill(S.slotLine,{day:dayLabel(new Date(st.day+'T00:00:00Z')),time:st.time})}.`;
 const svc={ped:Number(f.age.value)===0?1:0,vac:2,ent:3,neu:4,der:5,ort:6}[st.spec];
 $('sk-done-bring').textContent=D.services[svc].bring;
 form.hidden=true;const done=$('sk-done');done.hidden=false;done.focus();
});
$('sk-again').addEventListener('click',()=>{form.reset();Object.assign(st,{spec:null,doc:null,day:null,time:null});form.hidden=false;$('sk-done').hidden=true;form.querySelectorAll('.sk-err,.sk-ferr').forEach(x=>x.textContent='');go(1);focusStep(1)});

// "Request this doctor" from the schedule table pre-fills steps 1–2.
document.addEventListener('click',e=>{const a=e.target.closest('[data-pick]');if(!a)return;e.preventDefault();const d=D.docs.find(x=>x.id===a.dataset.pick);
 form.hidden=false;$('sk-done').hidden=true;st.spec=d.spec;st.doc=d.id;st.day=null;st.time=null;form.querySelector(`input[name=spec][value="${d.spec}"]`).checked=true;go(3);focusStep(3)});

go(1);
