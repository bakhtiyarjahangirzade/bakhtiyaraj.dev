import '../ribbon.css';
import './style.css';
import '../../i18n.js';

const D=JSON.parse(document.getElementById('k-data').textContent);
const R=D.r,C=D.cal;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const fill=(s,v)=>s.replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const SEP={az:' ',ru:' ',en:','}[D.lang]||' ',DEC=D.lang==='en'?'.':',';
const money=n=>{const [i,f]=(Math.round(n*100)/100).toFixed(2).split('.');return `${i.replace(/\B(?=(\d{3})+(?!\d))/g,SEP)}${f==='00'?'':DEC+f} AZN`};
const reduce=matchMedia('(prefers-reduced-motion: reduce)');

// receipt share bars
$$('.gv-bar-in').forEach(b=>{b.style.width=b.dataset.w+'%'});

// ---- donation ----
const form=$('.gv-form'),covers=$('.gv-covers'),review=$('.gv-review'),other=form.elements.other;
function amount(){
 const v=form.elements.amount.value;
 if(v!=='other')return +v;
 const n=parseFloat(other.value.replace(/\s/g,'').replace(',','.'));
 return isFinite(n)?n:NaN;
}
function coversText(a){
 const boxes=Math.floor(a/D.box),meals=Math.floor((a-boxes*D.box)/D.meal+1e-9);
 const parts=[];
 if(boxes)parts.push(boxes===1?R.box1:fill(R.boxes,{n:boxes}));
 if(meals)parts.push(meals===1?R.meal1:fill(R.meals,{n:meals}));
 const what=(parts.length?parts.join(R.and):R.small)+` (${R.sampleNote})`;
 return fill(form.elements.freq.value==='monthly'?R.coversM:R.covers,{a:money(a),what});
}
function setErr(id,m){const e=$('#gv-e-'+id);if(!e)return;e.hidden=!m;e.textContent=m||''}
function updateCovers(){
 const a=amount(),ok=a>=5&&a<=5000;
 covers.textContent=ok?coversText(a):'';
 if(ok)setErr('amount','');
}
$$('input[name=amount],input[name=freq]',form).forEach(i=>i.addEventListener('change',updateCovers));
other.addEventListener('focus',()=>{form.elements.amount.value='other';$('.gv-other input[type=radio]').checked=true;updateCovers()});
other.addEventListener('input',()=>{$('.gv-other input[type=radio]').checked=true;updateCovers()});
form.elements.anon.addEventListener('change',()=>{form.elements.name.disabled=form.elements.anon.checked;if(form.elements.anon.checked)setErr('name','')});
['name','email'].forEach(n=>form.elements[n].addEventListener('input',()=>{setErr(n,'');form.elements[n].removeAttribute('aria-invalid')}));
updateCovers();
const emailOk=v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
form.addEventListener('submit',e=>{
 e.preventDefault();
 const a=amount(),name=form.elements.name.value.trim(),anon=form.elements.anon.checked,email=form.elements.email.value.trim();
 const errs={amount:a>=5&&a<=5000?'':R.amountErr,name:anon||name.length>1?'':R.nameErr,email:emailOk(email)?'':R.emailErr};
 for(const [k,m] of Object.entries(errs)){setErr(k,m);const el=k==='amount'?other:form.elements[k];if(m)el.setAttribute('aria-invalid','true');else el.removeAttribute('aria-invalid')}
 if(errs.amount&&form.elements.amount.value==='other'){other.focus();return}
 const first=Object.entries(errs).find(([,m])=>m);
 if(first){(first[0]==='amount'?other:form.elements[first[0]]).focus();return}
 const freq=form.elements.freq.value,forName=D.design[form.elements.for.value];
 review.innerHTML=`<h3>${esc(R.revH)}</h3><dl>${[[R.rAmount,money(a)],[R.rFreq,freq==='monthly'?R.freqMonthly:R.freqOnce],[R.rFor,forName],[R.rFrom,anon?R.anonName:name],[R.rReceipt,email]].map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><p class="gv-covers">${esc(coversText(a))}</p><div class="gv-actions"><button type="button" class="gv-btn" data-confirm>${esc(R.confirm)}</button><button type="button" class="gv-btn gv-btn-line" data-edit>${esc(R.edit)}</button></div>`;
 form.hidden=true;review.hidden=false;review.focus();
 $('[data-edit]',review).addEventListener('click',()=>{review.hidden=true;form.hidden=false;$('button[type=submit]',form).focus()});
 $('[data-confirm]',review).addEventListener('click',()=>{
  review.innerHTML=`<h3 class="gv-thanks">${esc(R.thanksH)}</h3><p>${esc(fill(R.thanks,{amount:money(a),freq:freq==='monthly'?R.freqMonthly:R.freqOnce,for:forName,email}))}</p><p class="gv-demo">${esc(R.demoPay)}</p><button type="button" class="gv-btn gv-btn-line" data-again>${esc(R.again)}</button>`;
  review.classList.add('done');review.focus();
  $('[data-again]',review).addEventListener('click',()=>{form.reset();form.elements.name.disabled=false;review.hidden=true;review.classList.remove('done');form.hidden=false;updateCovers();$('input[name=amount]',form).focus()});
 });
});

// ---- volunteer shifts ----
const pad=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const base=new Date();base.setHours(0,0,0,0);
const days=[];for(let i=1;days.length<6;i++){const d=new Date(base.getFullYear(),base.getMonth(),base.getDate()+i);if(d.getDay()!==0)days.push(d)}
const dayName=d=>`${C.wdl[d.getDay()]}, ${d.getDate()} ${C.mong[d.getMonth()]}`;
// Sample rota: which roles run where and how many places are already taken (deterministic).
const SH={};
for(const k of Object.keys(D.kitchens)){
 SH[k]=[];
 for(const d of days)for(const r of D.roles){
  let h=3;for(const c of k+r.id+iso(d))h=(h*29+c.charCodeAt(0))>>>0;
  if(r.id==='drive'&&d.getDay()===6)continue;
  if(h%5===0)continue;
  const taken=r.id==='serve'?Math.min(r.cap,h%(r.cap+3)):h%(r.cap+1);
  SH[k].push({key:`${k}-${r.id}-${iso(d)}`,date:d,role:r,left:Math.max(0,r.cap-taken)});
 }
}
if(SH.bak)SH.bak.filter(s=>s.role.id==='pack').forEach(s=>s.left=0);// one kitchen's packing is fully booked: shows the full state
let kitchen=Object.keys(D.kitchens)[0],shift=null;
const panel=$('#gv-shifts'),sform=$('.gv-sform'),booked=$('.gv-booked');
function renderShifts(){
 const list=SH[kitchen],free=list.some(s=>s.left>0);
 const byDay=days.map(d=>[d,list.filter(s=>s.date===d)]).filter(([,l])=>l.length);
 panel.innerHTML=free?byDay.map(([d,l])=>`<div class="gv-day"><h3>${esc(dayName(d))}</h3><ul>${l.map(s=>`<li><button type="button" class="gv-slot" data-key="${s.key}" aria-pressed="${shift&&shift.key===s.key}"${s.left?'':' disabled'}><b>${esc(s.role.name)}</b><span>${s.role.time}</span><small class="${s.left?'':'full'}">${esc(s.left?(s.left===1?R.left1:fill(R.left,{n:s.left})):R.full)}</small></button></li>`).join('')}</ul></div>`).join(''):`<p class="gv-empty">${esc(R.noShifts)}</p>`;
 panel.setAttribute('aria-labelledby','gv-tab-'+kitchen);
 $$('.gv-slot',panel).forEach(b=>b.addEventListener('click',()=>pickShift(b.dataset.key)));
}
function pickShift(key){
 shift=SH[kitchen].find(s=>s.key===key);
 $$('.gv-slot',panel).forEach(b=>b.setAttribute('aria-pressed',b.dataset.key===key));
 sform.hidden=false;booked.hidden=true;
 $('.gv-picked',sform).textContent=`${dayName(shift.date)}, ${shift.role.time} — ${shift.role.name}, ${D.kitchens[kitchen].name}`;
 $('.gv-lic',sform).hidden=!shift.role.licence;
 if(!shift.role.licence)setErr('licence','');
 sform.scrollIntoView({block:'nearest',behavior:reduce.matches?'auto':'smooth'});
}
const tabs=$$('.gv-tabs [role=tab]');
tabs.forEach(tb=>tb.addEventListener('click',()=>selectTab(tb)));
$('.gv-tabs').addEventListener('keydown',e=>{
 const i=tabs.indexOf(document.activeElement),k={ArrowRight:1,ArrowLeft:-1}[e.key];
 if(i<0||!k)return;e.preventDefault();const n=tabs[(i+k+tabs.length)%tabs.length];n.focus();selectTab(n);
});
function selectTab(tb){
 tabs.forEach(x=>{x.setAttribute('aria-selected',x===tb);x.tabIndex=x===tb?0:-1});
 kitchen=tb.dataset.k;shift=null;sform.hidden=true;renderShifts();
}
renderShifts();
const phoneOk=v=>/^(?:\+994|0)(?:10|50|51|55|60|70|77|99|12)\d{7}$/.test(v.replace(/[\s()-]/g,''));
['sname','sphone'].forEach(n=>sform.elements[n].addEventListener('input',()=>{setErr(n,'');sform.elements[n].removeAttribute('aria-invalid')}));
sform.addEventListener('submit',e=>{
 e.preventDefault();
 const name=sform.elements.sname.value.trim();
 const errs={sname:name.length>1?'':R.shiftNameErr,sphone:phoneOk(sform.elements.sphone.value)?'':R.phoneErr,age:sform.elements.age.checked?'':R.ageErr,licence:shift.role.licence&&!sform.elements.licence.checked?R.licenceErr:''};
 for(const [k,m] of Object.entries(errs)){setErr(k,m);const el=sform.elements[k];if(m)el.setAttribute('aria-invalid','true');else el.removeAttribute('aria-invalid')}
 const first=Object.entries(errs).find(([,m])=>m);
 if(first){sform.elements[first[0]].focus();return}
 shift.left--;
 const k=D.kitchens[kitchen];
 booked.innerHTML=`<h3>${esc(R.bookedH)}</h3><p>${esc(fill(R.booked,{name,when:`${dayName(shift.date)}, ${shift.role.time}`,role:shift.role.name,kitchen:k.name,addr:k.addr}))}</p><p class="gv-demo">${esc(R.demoShift)}</p><button type="button" class="gv-btn gv-btn-line" data-another>${esc(R.another)}</button>`;
 sform.hidden=true;sform.reset();booked.hidden=false;shift=null;renderShifts();booked.focus();
 $('[data-another]',booked).addEventListener('click',()=>{booked.hidden=true;const b=$('.gv-slot:not([disabled])',panel);if(b)b.focus()});
});
