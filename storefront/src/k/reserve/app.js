import '../ribbon.css';
import './style.css';
import '../../i18n.js';
import {grid,week,makeFmt,dayStats,hm,addDays,freeSlots,svcOf,barberOf,OPEN,CLOSE,monday} from './view.js';
import {panel} from './panel.js';

const D=JSON.parse(document.getElementById('k-data').textContent),S=D.S,F=makeFmt(D);
const $=s=>document.querySelector(s);
let iso=D.today,mob='elvin',fresh=null,sel=null;
let P={mode:'new',barber:'any'};
const narrow=matchMedia('(max-width:900px)');

const toastEl=$('#rs-toast');let tt;
const toast=m=>{toastEl.textContent=m;toastEl.classList.add('is-on');clearTimeout(tt);tt=setTimeout(()=>toastEl.classList.remove('is-on'),4500)};

function ghost(){
 if(!P.slot)return null;
 const svc=P.mode==='move'?D.bookings.find(b=>b.id===P.id).svc:P.svc;
 return {barber:P.slot.barber,start:P.slot.start,dur:svcOf(D,svc).dur};
}
function renderGrid(){
 const st=dayStats(D,iso),closed=!st.open;
 $('#rs-date').textContent=F.long(iso);
 $('#rs-stats').innerHTML=closed?'':`<span>${F.fill(S.statN,{n:st.n})}</span><span>${F.fill(S.statP,{p:st.pct})}</span><span>${F.fill(S.statR,{sum:F.azn(st.rev)})}</span>`;
 $('#rs-week').innerHTML=week(D,F,iso);
 $('#rs-closed').hidden=!closed;
 const g=$('#rs-grid');g.hidden=closed;$('#rs-mob').hidden=closed;
 $('#rs-notice').hidden=closed||st.n>0;$('#rs-notice').textContent=S.emptyDay;
 g.dataset.mob=mob;
 document.querySelectorAll('#rs-mob [data-barber]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.barber===mob));
 g.innerHTML=grid(D,F,iso,{sel,ghost:ghost(),fresh,moving:P.mode==='move'?P.id:null});
 if(iso===D.today)g.querySelectorAll('.rs-lane').forEach(l=>{const n=document.createElement('div');n.className='rs-now';n.style.top=`${(D.now-OPEN)/(CLOSE-OPEN)*100}%`;n.setAttribute('aria-hidden','true');l.append(n)});
}
function renderPanel(focus){
 $('#rs-panel').innerHTML=panel(D,F,iso,P);
 if(focus){const el=$('#rs-panel').querySelector(focus);if(el)el.focus({preventScroll:true})}
}
const render=focus=>{renderGrid();renderPanel(focus)};

// ---- date navigation ----
function go(d,focusDay){iso=d;fresh=null;if(P.mode==='detail'){P={mode:'new',barber:'any'};sel=null}P.slot=null;render();if(focusDay)$(`#rs-week [data-date="${d}"]`)?.focus()}
$('#rs-week').addEventListener('click',e=>{const b=e.target.closest('[data-date]');if(b)go(b.dataset.date,true)});
$('#rs-prev').addEventListener('click',()=>go(addDays(iso,-7)));
$('#rs-next').addEventListener('click',()=>go(addDays(iso,7)));
$('#rs-today').addEventListener('click',()=>go(D.today));
$('#rs-closed-go').addEventListener('click',()=>go(addDays(monday(iso),7)));
$('#rs-mob').addEventListener('click',e=>{const b=e.target.closest('[data-barber]');if(!b)return;mob=b.dataset.barber;renderGrid();b.focus()});

// ---- bookings in the grid ----
$('#rs-grid').addEventListener('click',e=>{
 const b=e.target.closest('.rs-b');if(!b)return;
 sel=+b.dataset.id;P={mode:'detail',id:sel};fresh=null;render();
 const p=$('#rs-panel');if(narrow.matches)p.scrollIntoView({block:'start'});p.querySelector('[data-act]')?.focus({preventScroll:!narrow.matches});
});

// ---- panel ----
const panelEl=$('#rs-panel');
panelEl.addEventListener('change',e=>{
 const i=e.target;
 if(i.name==='svc'){P.svc=i.value;P.slot=null;render(`input[name=svc][value="${i.value}"]`)}
 if(i.name==='barber'){P.barber=i.value;P.slot=null;if(i.value!=='any')mob=i.value;render(`input[name=barber][value="${i.value}"]`)}
 if(i.name==='slot'){const [b,t]=i.value.split('@');P.slot={barber:b,start:+t};mob=b;render(`input[name=slot][value="${i.value}"]`)}
});
panelEl.addEventListener('input',e=>{const i=e.target;if(['name','phone','note'].includes(i.name)){P[i.name]=i.value;if(P.err?.[i.name]){P.err[i.name]='';i.removeAttribute('aria-invalid');$(`#rs-${i.name}-e`).textContent=''}}});
panelEl.addEventListener('keydown',e=>{if(e.key==='Enter'&&['name','phone','note'].includes(e.target.name)){e.preventDefault();confirm()}});

function confirm(){
 const sv=svcOf(D,P.svc),b=barberOf(D,P.slot.barber),name=(P.name||'').trim(),phone=(P.phone||'').trim();
 const err={name:name.length>=2?'':S.errName,phone:/^\+994\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/.test(phone)?'':S.errPhone};
 if(err.name||err.phone){P.err=err;renderPanel(err.name?'#rs-name':'#rs-phone');return}
 if(!freeSlots(D,b,iso,sv.dur).includes(P.slot.start)){P.slot=null;renderPanel();toast(S.errTaken);return}
 const id=Math.max(...D.bookings.map(x=>x.id))+1;
 D.bookings.push({id,barber:b.id,date:iso,start:P.slot.start,svc:sv.id,client:name,phone,note:(P.note||'').trim(),status:'ok'});
 const when=`${F.short(iso)} ${hm(P.slot.start)}`;
 fresh=id;sel=null;P={mode:'new',barber:'any'};render();
 toast(F.fill(S.booked,{client:name,time:when,barber:b.name}));
 $(`.rs-b[data-id="${id}"]`)?.focus();
}
panelEl.addEventListener('click',e=>{
 const a=e.target.closest('[data-act]');if(!a)return;const act=a.dataset.act;
 const x=P.id&&D.bookings.find(b=>b.id===P.id);
 if(act==='new'){P={mode:'new',barber:'any'};sel=null;render('input[name=svc]')}
 if(act==='detail'){P={mode:'detail',id:+a.dataset.id};sel=P.id;iso=x.date;render('[data-act=move]')}
 if(act==='move'){P={mode:'move',id:x.id,barber:x.barber};mob=x.barber;render(`input[name=barber][value="${x.barber}"]`)}
 if(act==='cancel'){P.confirmCancel=true;renderPanel('[data-act=cancel-yes]')}
 if(act==='cancel-no'){P.confirmCancel=false;renderPanel('[data-act=cancel]')}
 if(act==='cancel-yes'){x.status='cancelled';toast(F.fill(S.cancelled,{client:x.client,time:hm(x.start)}));P={mode:'new',barber:'any'};sel=null;render('input[name=svc]')}
 if(act==='goto'){iso=a.dataset.date;P.slot=null;render('input[name=slot]')}
 if(act==='confirm')confirm();
 if(act==='move-save'){
  const sv=svcOf(D,x.svc),b=barberOf(D,P.slot.barber);
  if(!freeSlots(D,b,iso,sv.dur,x.id).includes(P.slot.start)){P.slot=null;renderPanel();toast(S.errTaken);return}
  Object.assign(x,{date:iso,start:P.slot.start,barber:b.id});
  fresh=x.id;sel=x.id;P={mode:'detail',id:x.id};render('[data-act=move]');
  toast(F.fill(S.moved,{client:x.client,time:`${F.short(iso)} ${hm(x.start)}`,barber:b.name}));
 }
});
// Hydrate: add the "now" line and wire the state to the server-rendered markup.
renderGrid();
