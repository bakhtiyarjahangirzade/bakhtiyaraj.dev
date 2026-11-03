import '../ribbon.css';
import './style.css';
import '../../i18n.js';
import {fmt,finance,card,detail,compareView,savedView,filterCars,SORTS,esc,DEF} from './tpl.js';

const D=JSON.parse(document.getElementById('k-data').textContent);
D.F=fmt(D.locale);
const S=D.S,F=D.F,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const fill=(s,v)=>String(s).replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m);
const store={get(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const st={saved:new Set(store.get('al-saved',[])),compare:store.get('al-compare',[]).filter(id=>D.cars.some(c=>c.id===id)).slice(0,3)};
const byId=id=>D.cars.find(c=>c.id===id);
const name=c=>`${c.make} ${c.model}`;

// Viewing days: the next six days except Sunday, from the visitor's today.
const wd=new Intl.DateTimeFormat(D.locale,{weekday:'long',day:'numeric',month:'long'});
st.days=[];for(let i=1;st.days.length<6&&i<10;i++){const d=new Date();d.setDate(d.getDate()+i);if(d.getDay()!==0)st.days.push({v:d.toISOString().slice(0,10),t:wd.format(d)})}

const form=$('#al-search'),grid=$('[data-grid]'),home=$('[data-home]'),view=$('[data-view]');
const toastEl=$('[data-toast]');let tt;
function toast(msg){toastEl.textContent=msg;toastEl.classList.add('is-on');clearTimeout(tt);tt=setTimeout(()=>toastEl.classList.remove('is-on'),2600)}

// ---------- search ----------
const fields=['make','model','year','price','km','fuel','gear'];
const readForm=()=>Object.fromEntries(fields.map(k=>[k,(form.elements[k]?.value)||'']));
let applied={};
function syncModels(){
 const make=form.elements.make.value,sel=form.elements.model,cur=sel.value;
 const models=[...new Set(D.cars.filter(c=>c.make===make).map(c=>c.model))].sort();
 sel.innerHTML=make?`<option value="">${esc(S.anyModel)}</option>`+models.map(m=>`<option${m===cur?' selected':''}>${esc(m)}</option>`).join(''):`<option value="">${esc(S.pickMakeFirst)}</option>`;
 sel.disabled=!make;
}
function syncShow(){
 const n=filterCars(D.cars,readForm()).length;
 $('[data-show]').textContent=n?fill(S.showN,{n}):S.showNone;
}
const labelOf=(k,v)=>({make:v,model:v,year:fill(S.from,{v}),price:fill(S.upTo,{v:F.azn(+v)}),km:fill(S.upTo,{v:F.num(+v)+' '+S.km}),fuel:D.fuel[v],gear:D.gear[v]})[k];
const fieldName={make:S.make,model:S.model,year:S.yearFrom,price:S.priceMax,km:S.kmMax,fuel:S.fuel,gear:S.gearbox};
function renderResults(){
 const list=filterCars(D.cars,applied).sort(SORTS[form.elements.sort?.value||$('[name=sort]').value]||SORTS.rec);
 grid.innerHTML=list.map(c=>card(c,D,st)).join('');
 $('[data-count-res]').textContent=fill(S.countN,{n:list.length});
 const act=fields.filter(k=>applied[k]);
 $('[data-chips]').innerHTML=act.map(k=>`<li><button type="button" data-unfilter="${k}" aria-label="${esc(fill(S.removeFilter,{f:fieldName[k]+': '+labelOf(k,applied[k])}))}"><span>${esc(labelOf(k,applied[k]))}</span><i aria-hidden="true">×</i></button></li>`).join('');
 const empty=$('[data-empty]');empty.hidden=list.length>0;grid.hidden=!list.length;
 if(!list.length){
  // Suggest dropping each active filter, with the count it would return.
  $('[data-widen]').innerHTML=act.map(k=>{const f={...applied,[k]:''};if(k==='make')f.model='';const n=filterCars(D.cars,f).length;return n?`<li><button type="button" class="al-btn al-btn-quiet" data-unfilter="${k}">${esc(fill(S.widen,{f:labelOf(k,applied[k]),n}))}</button></li>`:''}).join('')+`<li><button type="button" class="al-link" data-reset-all>${esc(S.reset)}</button></li>`;
 }
}
function unfilter(k){
 applied={...applied,[k]:''};if(k==='make')applied.model='';
 if(k==='gear')$$('[name=gear]',form).forEach(r=>r.checked=r.value==='');else form.elements[k].value='';
 if(k==='make'){syncModels()}
 syncShow();renderResults();
}
form.addEventListener('change',e=>{if(e.target.name==='make')syncModels();if(e.target.name==='sort'){renderResults();return}syncShow()});
form.addEventListener('submit',e=>{e.preventDefault();applied=readForm();renderResults();if(location.hash!=='#cars')location.hash='#cars';else $('#cars').scrollIntoView({behavior:motion()?'smooth':'auto'})});
form.addEventListener('reset',()=>setTimeout(()=>{syncModels();syncShow();applied={};renderResults()}));
$('[name=sort]').addEventListener('change',renderResults);
const motion=()=>!matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- saved / compare ----------
function counts(){
 for(const [k,n] of [['saved',st.saved.size],['compare',st.compare.length]]){const b=$(`[data-count=${k}]`);b.textContent=n;b.toggleAttribute('data-zero',!n)}
 const tray=$('[data-tray]');tray.hidden=!st.compare.length||location.hash==='#compare';
 $('[data-tray-list]').innerHTML=st.compare.map(id=>{const c=byId(id);return `<li>${D.img[id]}<span>${esc(name(c))}</span><button type="button" data-uncompare="${id}" aria-label="${esc(fill(S.removeFromCompare,{car:name(c)}))}">×</button></li>`}).join('');
 $('[data-tray-n]').textContent=fill(S.trayN,{n:st.compare.length});
 document.body.classList.toggle('al-has-tray',!tray.hidden);
}
function persist(){store.set('al-saved',[...st.saved]);store.set('al-compare',st.compare);counts()}
function toggleSave(id){
 const c=byId(id),on=!st.saved.has(id);on?st.saved.add(id):st.saved.delete(id);persist();
 $$(`[data-save="${id}"]`).forEach(b=>{b.setAttribute('aria-pressed',on);const sp=b.querySelector('span');if(sp)sp.textContent=on?S.saved:S.save;else b.setAttribute('aria-label',fill(on?S.unsaveCar:S.saveCar,{car:name(c)}))});
 toast(fill(on?S.savedToast:S.unsavedToast,{car:name(c)}));
 if(location.hash==='#saved')route();
}
function setCompare(id,on){
 if(on&&!st.compare.includes(id)){if(st.compare.length>=3){toast(S.compareLimit);return false}st.compare.push(id)}
 if(!on)st.compare=st.compare.filter(x=>x!==id);
 persist();
 $$(`[data-compare="${id}"]`).forEach(i=>i.checked=on);
 $$(`[data-compare-btn="${id}"]`).forEach(b=>{b.setAttribute('aria-pressed',on);b.querySelector('span').textContent=on?S.inCompare:S.addCompare});
 return true;
}
document.addEventListener('click',e=>{
 const s=e.target.closest('[data-save]');if(s){toggleSave(s.dataset.save);return}
 const u=e.target.closest('[data-uncompare]');if(u){setCompare(u.dataset.uncompare,false);if(location.hash==='#compare')route();return}
 const cb=e.target.closest('[data-compare-btn]');if(cb){setCompare(cb.dataset.compareBtn,cb.getAttribute('aria-pressed')!=='true');return}
 const uf=e.target.closest('[data-unfilter]');if(uf){unfilter(uf.dataset.unfilter);return}
 if(e.target.closest('[data-reset-all]')){form.reset();return}
 if(e.target.closest('[data-tray-clear]')){[...st.compare].forEach(id=>setCompare(id,false));return}
 const g=e.target.closest('[data-g]');if(g){const box=g.closest('.al-gallery');box.querySelector('.al-g-main').innerHTML=D.gallery[box.closest('[data-car]').dataset.car][+g.dataset.g];$$('[data-g]',box).forEach(b=>b.setAttribute('aria-pressed',b===g));return}
});
document.addEventListener('change',e=>{const c=e.target.closest('[data-compare]');if(c&&!setCompare(c.dataset.compare,c.checked))c.checked=false});

// ---------- detail: finance + viewing ----------
function calc(f){
 const c=byId(f.dataset.calc),dep=+f.elements.dep.value,term=+f.elements.term.value,rate=parseFloat(String(f.elements.rate.value).replace(',','.'));
 f.querySelector('[data-o=dep]').textContent=`${dep}% (${F.azn(c.price*dep/100)})`;
 const out=f.querySelector('[data-out]'),bad=!(rate>=0&&rate<=40);
 f.elements.rate.setAttribute('aria-invalid',bad);
 if(bad){out.innerHTML=`<p class="al-err">${esc(S.rateErr)}</p>`;return}
 const m=finance(c.price,dep,term,rate);
 out.innerHTML=`<p class="al-calc-big"><span>${esc(S.calcMonthly)}</span><strong>${F.azn(m.monthly)}</strong></p><dl><div><dt>${esc(S.calcLoan)}</dt><dd>${F.azn(m.loan)}</dd></div><div><dt>${esc(S.calcInterest)}</dt><dd>${F.azn(m.interest)}</dd></div><div><dt>${esc(S.calcTotal)}</dt><dd>${F.azn(m.total+c.price*dep/100)}</dd></div></dl>`;
}
function bindDetail(){
 const f=$('[data-calc]',view);if(!f)return;
 f.addEventListener('input',()=>calc(f));f.addEventListener('submit',e=>e.preventDefault());calc(f);
 const v=$('[data-viewing]',view);
 v.addEventListener('submit',e=>{
  e.preventDefault();const c=byId(v.dataset.viewing),el=v.elements,errs={};
  if(!el.name.value.trim())errs.name=S.errName;
  if(!/^\+?994\d{9}$/.test(el.phone.value.replace(/[\s()-]/g,'')))errs.phone=S.errPhone;
  if(!el.day.value)errs.day=S.errDay;
  for(const k of ['name','phone','day']){const m=$(`[data-err=${k}]`,v);m.textContent=errs[k]||'';el[k].setAttribute('aria-invalid',!!errs[k]);if(errs[k])el[k].setAttribute('aria-describedby',m.id||(m.id=`err-${k}`));else el[k].removeAttribute('aria-describedby')}
  const first=Object.keys(errs)[0];if(first){el[first].focus();return}
  const done=$('[data-done]',v);done.hidden=false;
  done.textContent=fill(S.viewDone,{car:name(c),day:el.day.selectedOptions[0].textContent,slot:el.slot.value});
  done.setAttribute('tabindex','-1');done.focus();
 });
}

// ---------- router ----------
let lastHome=0;
function route(){
 const h=location.hash.slice(1),[v,id]=h.split('/');
 let html='';
 if(v==='car'&&byId(id))html=`<div data-car="${id}">${detail(byId(id),D,st)}</div>`;
 else if(v==='compare')html=compareView(st.compare,D,st);
 else if(v==='saved')html=savedView(D,st);
 const inView=!!html;
 if(inView){if(home.hidden===false)lastHome=scrollY;view.innerHTML=html;view.hidden=false;home.hidden=true;scrollTo(0,0);bindDetail();const h1=view.querySelector('h1');if(h1){h1.setAttribute('tabindex','-1');h1.focus({preventScroll:true})}}
 else{const was=home.hidden;view.hidden=true;view.innerHTML='';home.hidden=false;const t=h&&document.getElementById(h);if(t)t.scrollIntoView();else if(was)scrollTo(0,lastHome)}
 $$('.al-top nav a').forEach(a=>a.getAttribute('href')==='#'+v?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current'));
 counts();
}
addEventListener('hashchange',route);
syncModels();syncShow();renderResults();route();
