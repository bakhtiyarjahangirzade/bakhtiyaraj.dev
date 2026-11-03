import '../ribbon.css';
import './style.css';
import '../../i18n.js';
import {esc,fill,fmt,row,table,detail,match,SORTS,chips,dropChip,emptyF,ico} from './tpl.js';

const D=JSON.parse(document.getElementById('k-data').textContent);
D.F=fmt(D.lang);
const S=D.S,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const st={fav:new Set(store.get('yo-fav',[])),ss:store.get('yo-ss',[]),view:'list',sort:'new'};
const form=$('#yo-f'),qForm=$('#yo-q'),results=$('[data-results]'),body=$('[data-list-view]'),viewEl=$('[data-view]');
const byId=id=>D.ads.find(a=>a.id===+id);
let f=emptyF();
const toastEl=$('[data-toast]');let tt;
const toast=m=>{toastEl.textContent=m;toastEl.classList.add('is-on');clearTimeout(tt);tt=setTimeout(()=>toastEl.classList.remove('is-on'),2600)};

// ---------- form <-> state ----------
function readForm(){
 const g=emptyF(),el=form.elements;
 g.q=qForm.elements.q.value;
 g.make=el.make.value;g.model=el.model.value;
 for(const k of ['city','fuel','gear','body'])g[k]=$$(`[name=${k}]:checked`,form).map(i=>i.value);
 for(const k of ['pmin','pmax','kmax'])g[k]=el[k].value.trim();
 g.ymin=el.ymin.value;g.ymax=el.ymax.value;g.seller=form.querySelector('[name=seller]:checked')?.value||'';
 for(const k of ['credit','barter','vin','photo'])g[k]=el[k].checked;
 return g;
}
function writeForm(g){
 qForm.elements.q.value=g.q;form.elements.make.value=g.make;syncModels();form.elements.model.value=g.model;
 for(const k of ['city','fuel','gear','body'])$$(`[name=${k}]`,form).forEach(i=>i.checked=g[k].includes(i.value));
 for(const k of ['pmin','pmax','kmax','ymin','ymax'])form.elements[k].value=g[k];
 $$('[name=seller]',form).forEach(i=>i.checked=i.value===g.seller);
 for(const k of ['credit','barter','vin','photo'])form.elements[k].checked=g[k];
}
function syncModels(){
 const make=form.elements.make.value,sel=form.elements.model,cur=sel.value;
 const ms=[...new Set(D.ads.filter(a=>a.make===make).map(a=>a.model))].sort();
 sel.innerHTML=make?`<option value="">${esc(S.allModels)}</option>`+ms.map(m=>`<option${m===cur?' selected':''}>${esc(m)}</option>`).join(''):`<option value="">${esc(S.pickMake)}</option>`;
 sel.disabled=!make;
}
const activeN=g=>chips(g,D).length;

// ---------- render ----------
function facetCounts(){
 for(const el of $$('[data-c]',form)){
  const [k,v]=el.dataset.c.split(':');
  const n=v?D.ads.filter(a=>a[k]===v&&match(a,f,k)).length:D.ads.filter(a=>(k==='photo'?a.photo:a[k])&&match(a,f,k)).length;
  el.textContent=n;el.closest('label').classList.toggle('is-zero',!n);
 }
}
function render(){
 const pe=$('[data-err=price]',form),bad=f.pmin!==''&&f.pmax!==''&&+f.pmin>+f.pmax;
 pe.hidden=!bad;pe.textContent=bad?S.priceErr||'':'';
 const list=D.ads.filter(a=>match(a,f)).sort(SORTS[st.sort]);
 results.innerHTML=list.length?(st.view==='table'?table(list,D,st):`<ul class="yo-list">${list.map(a=>row(a,D,st)).join('')}</ul>`):'';
 const n=activeN(f);
 $('[data-count]').textContent=n?fill(S.countOf,{n:list.length,total:D.ads.length}):fill(S.countN,{n:list.length});
 $('[data-chips]').innerHTML=chips(f,D).map((c,i)=>`<li><button type="button" data-chip="${i}" aria-label="${esc(fill(S.removeChip,{f:c.l}))}">${esc(c.l)}<i aria-hidden="true">×</i></button></li>`).join('');
 const empty=$('[data-empty]');empty.hidden=!!list.length;
 if(!list.length)$('[data-widen]').innerHTML=chips(f,D).map((c,i)=>{const n=D.ads.filter(a=>match(a,dropChip(f,c))).length;return n?`<li><button type="button" class="yo-btn yo-btn-line" data-chip="${i}">${esc(fill(S.widen,{f:c.l,n}))}</button></li>`:''}).join('')+`<li><button type="button" class="yo-link" data-reset>${esc(S.resetAll)}</button></li>`;
 $('.yo-show').textContent=fill(S.showN,{n:list.length});
 $('[data-open-filters]').textContent=n?fill(S.filtersN,{n}):S.filters;
 facetCounts();counts();
}
function counts(){$('[data-n=fav]').textContent=st.fav.size;$('[data-n=ss]').textContent=st.ss.length}
const apply=()=>{f=readForm();render()};
form.addEventListener('change',e=>{if(e.target.name==='make'){form.elements.model.value='';syncModels()}apply()});
form.addEventListener('input',e=>{if(['pmin','pmax','kmax'].includes(e.target.name)){clearTimeout(apply.t);apply.t=setTimeout(apply,250)}});
form.addEventListener('reset',()=>setTimeout(()=>{qForm.elements.q.value='';syncModels();apply()}));
qForm.addEventListener('submit',e=>{e.preventDefault();apply();go('#elanlar')});
$('[data-sort]').addEventListener('change',e=>{st.sort=e.target.value;render()});
$$('[name=view]').forEach(r=>r.addEventListener('change',e=>{st.view=e.target.value;store.set('yo-view',st.view);render()}));
st.view=store.get('yo-view','list');$(`[name=view][value=${st.view}]`).checked=true;

// ---------- favourites, saved searches ----------
function toggleFav(id){
 const on=!st.fav.has(id);on?st.fav.add(id):st.fav.delete(id);store.set('yo-fav',[...st.fav]);
 const a=byId(id);
 $$(`[data-fav="${id}"]`).forEach(b=>{b.setAttribute('aria-pressed',on);const sp=b.querySelector('span');if(sp)sp.textContent=on?S.inFav:S.addFav;else b.setAttribute('aria-label',fill(on?S.unfavA:S.favA,{car:a.make+' '+a.model}))});
 toast(on?S.favOn:S.favOff);counts();if(location.hash==='#secilmisler')route();
}
function saveSearch(){
 const name=chips(f,D).map(c=>c.l).join(', ')||S.ssAll,key=JSON.stringify(f);
 if(st.ss.some(s=>JSON.stringify(s.f)===key)){toast(S.searchExists);return}
 st.ss.unshift({name,f:JSON.parse(key),at:Date.now()});store.set('yo-ss',st.ss);counts();toast(fill(S.savedSearchToast,{name}));
}
function favView(){
 const list=D.ads.filter(a=>st.fav.has(a.id));
 return `<a class="yo-back" href="#elanlar">${ico.back}${esc(S.backToList)}</a><h1 tabindex="-1">${esc(S.favTitle)}</h1>`+(list.length?`<ul class="yo-list">${list.map(a=>row(a,D,st)).join('')}</ul>`:`<div class="yo-empty"><h2>${esc(S.favEmpty)}</h2><p>${esc(S.favEmptyBody)}</p></div>`);
}
function ssView(){
 return `<a class="yo-back" href="#elanlar">${ico.back}${esc(S.backToList)}</a><h1 tabindex="-1">${esc(S.ssTitle)}</h1>`+(st.ss.length?`<ul class="yo-ss">${st.ss.map((s,i)=>{const g={...emptyF(),...s.f},n=D.ads.filter(a=>match(a,g)).length;return `<li><div><b>${esc(s.name)}</b><span>${esc(fill(S.ssNow,{n}))}</span></div><button type="button" class="yo-btn yo-btn-main" data-ss-open="${i}">${esc(S.ssApply)}</button><button type="button" class="yo-link" data-ss-del="${i}" aria-label="${esc(fill(S.ssDeleteA,{name:s.name}))}">${esc(S.ssDelete)}</button></li>`}).join('')}</ul>`:`<div class="yo-empty"><h2>${esc(S.ssEmpty)}</h2><p>${esc(S.ssEmptyBody)}</p></div>`);
}

// ---------- report dialog ----------
const dlg=$('#yo-report'),rf=$('[data-report-form]');let reportId=0,opener=null;
function openReport(id,btn){reportId=id;opener=btn;rf.reset();$$('[data-err]',rf).forEach(e=>e.hidden=true);rf.querySelectorAll('[aria-invalid]').forEach(e=>e.removeAttribute('aria-invalid'));dlg.showModal()}
rf.addEventListener('submit',e=>{
 e.preventDefault();
 const reason=rf.querySelector('[name=reason]:checked'),c=rf.elements.comment.value.trim();
 const er=!reason,ec=reason&&reason.value==='4'&&c.length<10;
 const r1=$('[data-err=reason]',rf),r2=$('[data-err=comment]',rf);
 r1.hidden=!er;r1.textContent=S.errReason;r2.hidden=!ec;r2.textContent=S.errComment;
 rf.elements.comment.setAttribute('aria-invalid',!!ec);
 if(er){rf.querySelector('[name=reason]').focus();return}
 if(ec){rf.elements.comment.focus();return}
 dlg.close();const rep=store.get('yo-reports',[]);rep.push({id:reportId,reason:+reason.value,c});store.set('yo-reports',rep);
 const b=$(`[data-report="${reportId}"]`);if(b){b.disabled=true;b.querySelector('span').textContent=fill(S.reportDone,{n:reportId})}
 toast(fill(S.reportDone,{n:reportId}));opener&&opener.focus();
});
$('[data-dlg-cancel]').addEventListener('click',()=>{dlg.close();opener&&opener.focus()});

// ---------- clicks ----------
document.addEventListener('click',e=>{
 const t=e.target;
 const fb=t.closest('[data-fav]');if(fb){toggleFav(+fb.dataset.fav);return}
 const ch=t.closest('[data-chip]');if(ch){f=dropChip(f,chips(f,D)[+ch.dataset.chip]);writeForm(f);render();return}
 if(t.closest('[data-reset]')){form.reset();return}
 if(t.closest('[data-save-search]')){saveSearch();return}
 const pop=t.closest('[data-pop]');if(pop){f={...emptyF(),make:pop.dataset.pop};writeForm(f);render();go('#elanlar');return}
 const cm=t.closest('[data-crumb-make]');if(cm){e.preventDefault();f={...emptyF(),make:cm.dataset.crumbMake};writeForm(f);render();go('#elanlar');return}
 const ph=t.closest('[data-phone]');if(ph&&ph.getAttribute('aria-expanded')==='false'){const a=byId(ph.dataset.phone),n=String(a.id).slice(-7);ph.querySelector('span').textContent=`+994 00 ${n.slice(0,3)} ${n.slice(3,5)} ${n.slice(5,7)}`;ph.querySelector('em').remove();ph.setAttribute('aria-expanded','true');$('[data-phone-note]').hidden=false;return}
 const rp=t.closest('[data-report]');if(rp){openReport(+rp.dataset.report,rp);return}
 const so=t.closest('[data-ss-open]');if(so){f={...emptyF(),...st.ss[+so.dataset.ssOpen].f};writeForm(f);render();go('#elanlar');return}
 const sd=t.closest('[data-ss-del]');if(sd){st.ss.splice(+sd.dataset.ssDel,1);store.set('yo-ss',st.ss);counts();route();return}
 if(t.closest('[data-open-filters]')){document.body.classList.add('yo-f-open');$('[data-open-filters]').setAttribute('aria-expanded','true');$('#yo-side select').focus();return}
 if(t.closest('[data-close-filters]')){closeFilters();return}
});
function closeFilters(){if(!document.body.classList.contains('yo-f-open'))return;document.body.classList.remove('yo-f-open');const b=$('[data-open-filters]');b.setAttribute('aria-expanded','false');b.focus()}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeFilters()});

// ---------- router ----------
const go=h=>{if(location.hash!==h)location.hash=h;else route()};
let listY=0;
function route(){
 const [v,id]=location.hash.slice(1).split('/');
 let html='';
 if(v==='elan'&&byId(id))html=detail(byId(id),D,st);else if(v==='secilmisler')html=favView();else if(v==='axtarislar')html=ssView();
 if(html){if(!body.hidden)listY=scrollY;viewEl.innerHTML=html;viewEl.hidden=false;body.hidden=true;scrollTo(0,0);viewEl.querySelector('h1')?.focus({preventScroll:true})}
 else{const was=body.hidden;viewEl.hidden=true;viewEl.innerHTML='';body.hidden=false;if(was)scrollTo(0,listY)}
 $$('.yo-topnav a').forEach(a=>a.getAttribute('href')==='#'+v?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current'));
}
addEventListener('hashchange',route);
syncModels();apply();route();
