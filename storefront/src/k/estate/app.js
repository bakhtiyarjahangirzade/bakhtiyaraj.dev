import '../ribbon.css';
import './style.css';
import '../../i18n.js';
import {esc,makeFmt,card,pin,planOpts} from './views.js';
import {planSvg} from './plan.js';

const D=JSON.parse(document.getElementById('k-data').textContent);
const F=makeFmt(D),S=D.S,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const byId=Object.fromEntries(D.listings.map(l=>[l.id,l]));
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const store={get(k,d){try{return JSON.parse(localStorage.getItem('unvan:'+k))??d}catch{return d}},set(k,v){try{localStorage.setItem('unvan:'+k,JSON.stringify(v))}catch{}}};

const st={mode:'sale',sort:'new',savedOnly:false,sel:null,hot:null,
 saved:new Set(store.get('saved',[]).filter(id=>byId[id])),
 compare:(c=>({sale:(c.sale||[]).filter(id=>byId[id]?.mode==='sale').slice(0,3),rent:(c.rent||[]).filter(id=>byId[id]?.mode==='rent').slice(0,3)}))(store.get('compare',{})),
 requests:{},f:{}};
const persist=()=>{store.set('saved',[...st.saved]);store.set('compare',st.compare)};

const form=$('#es-filters'),list=$('#es-list'),pins=$('.es-pins'),work=$('#es-search');
const narrow=matchMedia('(max-width: 759px)'),drawer=matchMedia('(max-width: 1179px)');

// ---------- filters ----------
function readFilters(){
 const fd=new FormData(form),n=k=>{const v=fd.get(k);return v===''||v==null?null:Math.max(0,+v)};
 const f={d:new Set(fd.getAll('d')),r:new Set(fd.getAll('r')),pmin:n('pmin'),pmax:n('pmax'),amin:n('amin'),amax:n('amax'),nf:fd.has('nf'),nl:fd.has('nl'),b:fd.get('b')||'any',reno:fd.has('reno'),deed:fd.has('deed'),furn:fd.has('furn')};
 for(const k of ['p','a']){
  const bad=f[k+'min']!=null&&f[k+'max']!=null&&f[k+'min']>f[k+'max'];
  $(`#es-${k}-err`).hidden=!bad;
  for(const i of $$(`[name=${k}min],[name=${k}max]`,form))i.toggleAttribute('aria-invalid',bad);
  if(bad){f[k+'min']=null;f[k+'max']=null}
 }
 st.f=f;
}
function match(l,f=st.f,skip=''){
 if(l.mode!==st.mode)return false;
 if(st.savedOnly&&!st.saved.has(l.id))return false;
 if(skip!=='d'&&f.d.size&&!f.d.has(l.district))return false;
 if(f.r.size&&!f.r.has(String(Math.min(4,l.rooms))))return false;
 if(f.pmin!=null&&l.price<f.pmin)return false;
 if(f.pmax!=null&&l.price>f.pmax)return false;
 if(f.amin!=null&&l.area<f.amin)return false;
 if(f.amax!=null&&l.area>f.amax)return false;
 if(l.type!=='house'){if(f.nf&&l.floor===1)return false;if(f.nl&&l.floor===l.floors)return false}
 if(f.b!=='any'&&l.type!==f.b)return false;
 if(f.reno&&!['design','good'].includes(l.reno))return false;
 if(st.mode==='sale'&&f.deed&&!l.kupca)return false;
 if(st.mode==='rent'&&f.furn&&!l.furnished)return false;
 return true;
}
const SORT={new:(a,b)=>b.posted.localeCompare(a.posted),cheap:(a,b)=>a.price-b.price,dear:(a,b)=>b.price-a.price,ppm:(a,b)=>a.ppm-b.ppm,area:(a,b)=>b.area-a.area};
const results=()=>D.listings.filter(l=>match(l)).sort(SORT[st.sort]);

// Active filters as removable chips; each knows how to clear itself.
function chips(){
 const f=st.f,out=[],rng=(a,b)=>a!=null&&b!=null?`${F.num(a)}–${F.num(b)}`:a!=null?`≥ ${F.num(a)}`:`≤ ${F.num(b)}`;
 const priceL=st.mode==='sale'?S.priceSale:S.priceRent;
 if(st.savedOnly)out.push({l:S.savedOnly,clear:()=>setSavedOnly(false)});
 for(const d of f.d)out.push({l:F.district(d),clear:()=>{form.querySelector(`[name=d][value=${d}]`).checked=false}});
 if(f.r.size)out.push({l:`${S.rooms}: ${[...f.r].sort().map(v=>v==='4'?'4+':v).join(', ')}`,clear:()=>$$('[name=r]',form).forEach(i=>i.checked=false)});
 if(f.pmin!=null||f.pmax!=null)out.push({l:`${priceL}: ${rng(f.pmin,f.pmax)}`,clear:()=>{form.pmin.value='';form.pmax.value=''}});
 if(f.amin!=null||f.amax!=null)out.push({l:`${S.area}: ${rng(f.amin,f.amax)}`,clear:()=>{form.amin.value='';form.amax.value=''}});
 if(f.nf)out.push({l:S.notFirst,clear:()=>{form.nf.checked=false}});
 if(f.nl)out.push({l:S.notLast,clear:()=>{form.nl.checked=false}});
 if(f.b!=='any')out.push({l:D.TYPE[f.b],clear:()=>{form.querySelector('[name=b][value=any]').checked=true}});
 if(f.reno)out.push({l:S.onlyReno,clear:()=>{form.reno.checked=false}});
 if(st.mode==='sale'&&f.deed)out.push({l:S.withDeed,clear:()=>{form.deed.checked=false}});
 if(st.mode==='rent'&&f.furn)out.push({l:S.furnishedOnly,clear:()=>{form.furn.checked=false}});
 return out;
}
let chipList=[];
const chipBtn=(c,i,cls='es-chip')=>`<button type="button" class="${cls}" data-chip="${i}" aria-label="${esc(F.t('removeChip',{f:c.l}))}"><span>${esc(c.l)}</span><svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 7l10 10M17 7L7 17"/></svg></button>`;

// ---------- render ----------
function render(){
 readFilters();
 const res=results();chipList=chips();
 list.innerHTML=res.map(l=>card(D,F,l,st)).join('');
 const keep=st.sel&&res.some(l=>l.id===st.sel);if(!keep)st.sel=null;
 pins.innerHTML=res.map(l=>pin(D,F,l,st)).join('');
 raiseSel();
 $('#es-count').innerHTML=`${esc(F.count(res.length))} <span>${esc(st.mode==='sale'?S.inSale:S.inRent)}</span>`;
 $('.es-chips').innerHTML=chipList.map((c,i)=>`<li>${chipBtn(c,i)}</li>`).join('');
 const nf=chipList.length;$('#es-f-n').hidden=!nf;$('#es-f-n').textContent=nf;
 $('.es-f-apply').textContent=F.t('showN',{n:res.length});
 for(const d of D.districts)$(`[data-c=${d.id}]`,form).textContent=D.listings.filter(l=>l.district===d.id&&match(l,st.f,'d')).length;
 // empty state: offer to undo each active filter
 const empty=!res.length;$('#es-empty').hidden=!empty;list.hidden=empty;$('#es-map-empty').hidden=!empty;
 if(empty){
  const onlySaved=st.savedOnly&&![...st.saved].some(id=>byId[id].mode===st.mode);
  $('#es-empty-h').textContent=onlySaved?S.emptySavedTitle:S.emptyTitle;
  $('#es-empty-p').textContent=onlySaved?S.emptySaved:S.emptyText;
  $('#es-empty-acts').innerHTML=(onlySaved?`<button type="button" class="es-btn es-primary" data-empty="all">${esc(S.showAll)}</button>`:chipList.map((c,i)=>chipBtn(c,i)).join('')+`<button type="button" class="es-btn es-primary" data-empty="reset">${esc(S.resetAll)}</button>`);
 }
 mapCard();tray();badges();parcel();
}
function badges(){
 $('#es-saved-n').textContent=st.saved.size;
 $('#es-cmp-n').textContent=st.compare[st.mode].length;
 $('#es-saved-btn').setAttribute('aria-pressed',st.savedOnly);
}
// Draw the hot/selected pin last so it sits on top, but never move the focused pin (moving it would drop focus).
function raiseSel(){for(const id of [st.hot,st.sel]){const p=id&&pins.querySelector(`[data-id=${id}]`);if(p&&!p.contains(document.activeElement)&&p!==pins.lastElementChild)pins.appendChild(p)}}
function parcel(){
 const id=st.hot||st.sel,d=id&&byId[id].district;
 $$('.es-parcel').forEach(p=>p.classList.toggle('is-on',p.dataset.d===d));
}
function setHot(id){
 if(st.hot===id)return;st.hot=id;
 $$('.es-pin.is-hot').forEach(p=>p.classList.remove('is-hot'));
 $$('.es-item.is-hot').forEach(p=>p.classList.remove('is-hot'));
 if(id){pins.querySelector(`[data-id=${id}]`)?.classList.add('is-hot');list.querySelector(`[data-id=${id}]`)?.classList.add('is-hot')}
 raiseSel();parcel();
}
function select(id,{scroll=true}={}){
 st.sel=id;
 $$('.es-pin').forEach(p=>{const on=p.dataset.id===id;p.classList.toggle('is-sel',on);p.setAttribute('aria-pressed',on)});
 $$('.es-item').forEach(p=>p.classList.toggle('is-sel',p.dataset.id===id));
 raiseSel();parcel();mapCard();
 if(scroll&&id&&!narrow.matches){const it=list.querySelector(`[data-id=${id}]`);it?.scrollIntoView({block:'nearest',behavior:reduce.matches?'auto':'smooth'})}
}
function mapCard(){
 const box=$('#es-mapcard'),l=st.sel&&byId[st.sel];
 if(!l){box.innerHTML=`<p class="es-hint">${esc(S.mapHint)}</p>`;return}
 box.innerHTML=`<div class="es-mc">${planSvg(l.plan,{mini:true})}<div><p class="es-price"><strong>${esc(F.price(l))}</strong><span>${esc(F.ppm(l))}</span></p><p class="es-mc-t">${esc(F.title(l))}</p><p class="es-place">${esc(F.district(l.district))}, ${esc(l.place)}</p></div><a class="es-btn es-primary" href="#elan-${l.id}">${esc(S.open)}</a></div>`;
}
function tray(){
 const ids=st.compare[st.mode],t=$('#es-tray');
 t.hidden=!ids.length;
 $('#es-tray-t').textContent=F.t('trayN',{n:ids.length});
 $('#es-tray-l').innerHTML=ids.map(id=>{const l=byId[id];return `<li><span>${esc(F.short(l))}</span> ${esc(F.district(l.district))}</li>`}).join('');
 const ob=$('#es-tray-open');ob.disabled=ids.length<2;ob.title=ids.length<2?S.trayNeed:'';
 document.body.classList.toggle('es-has-tray',!!ids.length);
}
let toastT;
function toast(msg){const t=$('#es-toast');t.textContent=msg;t.classList.add('is-on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('is-on'),2600)}

// ---------- actions ----------
function toggleSave(id){
 if(st.saved.has(id)){st.saved.delete(id);toast(S.toastUnsaved)}else{st.saved.add(id);toast(S.toastSaved)}
 persist();refreshButtons(id);badges();if(st.savedOnly)render();
}
function toggleCmp(id){
 const l=byId[id],a=st.compare[l.mode];
 if(a.includes(id)){a.splice(a.indexOf(id),1);toast(S.toastUncmp)}
 else if(a.length>=3){toast(S.cmpLimit);return false}
 else{a.push(id);toast(F.t('toastCmp',{n:a.length}))}
 persist();refreshButtons(id);tray();badges();
 if($('#es-cmpdlg').open)renderCompare();
 return true;
}
function refreshButtons(id){
 for(const b of $$(`[data-act=save][data-id=${id}]`)){const on=st.saved.has(id);b.setAttribute('aria-pressed',on);b.querySelector('span').textContent=on?S.saved:S.save}
 for(const b of $$(`[data-act=cmp][data-id=${id}]`)){const on=st.compare[byId[id].mode].includes(id);b.setAttribute('aria-pressed',on);b.querySelector('span').textContent=on?S.comparing:S.compare}
 pins.querySelector(`[data-id=${id}]`)?.classList.toggle('is-saved',st.saved.has(id));
}
function setSavedOnly(on){st.savedOnly=on}
function setMode(m){
 st.mode=m;st.sel=null;st.hot=null;
 form.pmin.value='';form.pmax.value='';
 $('#es-p-l').textContent=m==='sale'?S.priceSale:S.priceRent;
 for(const i of $$('[name=pmin],[name=pmax]',form))i.step=m==='sale'?1000:50;
 $$('[data-only]',form).forEach(el=>el.hidden=el.dataset.only!==m);
 document.body.dataset.mode=m;
 render();
}

// ---------- detail ----------
const dlg=$('#es-detail');let cur=null,gi=0,navOpened=false;
const img=(k,cls,sizes,eager)=>{const p=D.photos[k];return `<img class="${cls}" src="${p.src}" srcset="${p.srcset}" sizes="${sizes}" width="${p.w}" height="${p.h}" alt="${esc(p.alt)}"${eager?'':' loading="lazy"'} decoding="async">`};
function gallery(l){
 const n=l.photos.length;
 if(!n)return `<div class="es-gal es-gal-none"><div class="es-gal-plan">${planSvg(l.plan,{mini:true})}</div><p>${esc(S.noPhotoText)}</p></div>`;
 const k=l.photos[gi],p=D.photos[k];
 return `<div class="es-gal" aria-roledescription="carousel"><figure class="es-gal-f">${img(k,'es-gal-img','(min-width: 1180px) 640px, 100vw',true)}<figcaption><span class="es-gal-n">${esc(F.t('photoOf',{i:gi+1,n}))}</span> ${esc(p.alt)}${p.gen?` <em>${esc(S.generated)}</em>`:''}</figcaption></figure>
${n>1?`<button type="button" class="es-gal-b es-gal-prev" data-g="-1" aria-label="${esc(S.prev)}"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7"/></svg></button><button type="button" class="es-gal-b es-gal-next" data-g="1" aria-label="${esc(S.next)}"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7"/></svg></button>
<div class="es-gal-th">${l.photos.map((t,i)=>`<button type="button" data-gi="${i}" aria-label="${esc(F.t('photoPick',{i:i+1}))}" aria-current="${i===gi}">${img(t,'','120px')}</button>`).join('')}</div>`:''}</div>`;
}
const dl=rows=>`<dl class="es-dl">${rows.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
function detailHtml(l){
 const sv=st.saved.has(l.id),cm=st.compare[l.mode].includes(l.id),sale=l.mode==='sale';
 const facts=[[S.fPrice,F.price(l)],[S.fPpm,F.ppm(l)],[S.fArea,`${F.f1(l.area)} m²`],[S.fRooms,String(l.rooms)],[S.fFloor,F.floor(l)],[S.fType,D.TYPE[l.type]],[S.fReno,D.RENO[l.reno]],
  sale?[S.fDeed,l.kupca?S.deed:S.noDeed]:[S.fFurn,l.furnished?S.furnished:S.unfurnished],...(sale?[]:[[S.fDeposit,F.t('depositN',{n:l.deposit})]]),[S.fPosted,F.dateY(l.posted)],[sale?S.fSeller:S.fLandlord,l.seller==='owner'?S.owner:S.agency]];
 const bld=[[S.bYear,String(l.year)],[S.bSeries,D.SER[l.series]],[S.bFloors,String(l.floors)],[S.bLift,l.lift?F.t('liftN',{n:l.lift}):S.noLift],[S.bHeat,D.HEAT[l.heat]],[S.bPark,D.PARK[l.park]],[S.bCeil,F.t('metres',{v:F.f1(l.ceil)})],[S.bMetro,F.metro(l)]];
 const ppmHow=F.t('ppmHow',{p:F.azn(l.price),a:F.f1(l.area),v:F.ppm(l)});
 const legend=`<table class="es-legendt"><thead><tr><th scope="col">${esc(S.room)}</th><th scope="col">${esc(S.roomArea)}</th></tr></thead><tbody>${l.plan.map(([t,a],i)=>`<tr><td><span class="es-no">${i+1}</span>${esc(D.R[t])}</td><td>${esc(F.f1(a))} m²</td></tr>`).join('')}</tbody><tfoot><tr><th scope="row">${esc(S.total)}</th><td>${esc(F.f1(l.area))} m²</td></tr></tfoot></table>`;
 const money=sale?`<section class="es-calc" aria-labelledby="es-calc-h"><h3 id="es-calc-h">${esc(S.calc)}</h3>
<div class="es-calc-f"><label><span>${esc(S.down)} <output id="es-down-o"></output></span><input type="range" id="es-down" min="10" max="70" step="5" value="30"></label>
<label><span>${esc(S.term)}</span><select id="es-term">${[5,10,15,20,25].map(y=>`<option value="${y}"${y===15?' selected':''}>${esc(F.t('years',{n:y}))}</option>`).join('')}</select></label>
<label><span>${esc(S.rate)}</span><input type="number" id="es-rate" min="0" max="40" step="0.1" value="12" inputmode="decimal" aria-describedby="es-rate-err"></label><p class="es-ferr" id="es-rate-err" hidden>${esc(S.rateErr)}</p></div>
<dl class="es-calc-o" aria-live="polite"><div class="es-calc-main"><dt>${esc(S.monthly)}</dt><dd id="es-pay"></dd></div><div><dt>${esc(S.loan)}</dt><dd id="es-loan"></dd></div><div><dt>${esc(S.interest)}</dt><dd id="es-int"></dd></div></dl>
<p class="es-small">${esc(S.calcNote)}</p></section>`
 :`<section class="es-calc" aria-labelledby="es-calc-h"><h3 id="es-calc-h">${esc(S.moveIn)}</h3><p class="es-calc-big">${esc(F.azn(l.price*(1+l.deposit)))}</p><p>${esc(F.t('moveInHow',{r:F.azn(l.price),d:F.azn(l.price*l.deposit)}))}</p><p class="es-small">${esc(S.moveInNote)}</p></section>`;
 return `<div class="es-d">
<header class="es-d-head"><div class="es-d-tt"><p class="es-d-id">${esc(F.t('listingNo',{id:l.id.toUpperCase().replace('U','U-')}))}</p><h2 id="es-d-title">${esc(F.title(l))}</h2><p class="es-place">${esc(F.district(l.district))}, ${esc(l.place)}</p></div>
<div class="es-d-price"><strong>${esc(F.price(l))}</strong><span>${esc(F.ppm(l))}</span></div>
<div class="es-d-acts"><button type="button" class="es-btn es-save" data-act="save" data-id="${l.id}" aria-pressed="${sv}"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z"/></svg><span>${esc(sv?S.saved:S.save)}</span></button><button type="button" class="es-btn es-cmp" data-act="cmp" data-id="${l.id}" aria-pressed="${cm}"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.5" y="5" width="7" height="14" rx="1.5"/><rect x="13.5" y="5" width="7" height="14" rx="1.5"/><path d="M5.8 9h2.4M15.8 9h2.4M5.8 12h2.4M15.8 12h2.4"/></svg><span>${esc(cm?S.comparing:S.compare)}</span></button><button type="button" class="es-btn es-x" data-close aria-label="${esc(S.close)}"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div></header>
<div class="es-d-grid"><div class="es-d-main">
<div id="es-gal-wrap">${gallery(l)}</div>
<section class="es-d-sec" aria-labelledby="es-facts-h"><h3 id="es-facts-h">${esc(S.facts)}</h3>${dl(facts)}<p class="es-how">${esc(S.fPpm)}: ${esc(ppmHow)}</p></section>
<section class="es-d-sec"><h3>${esc(S.about)}</h3><p class="es-desc">${esc(l.desc)}</p></section>
<section class="es-d-sec es-plan-sec" aria-labelledby="es-plan-h"><h3 id="es-plan-h">${esc(S.plan)}</h3><div class="es-plan-wrap">${planSvg(l.plan,planOpts(D,F,l,true))}${legend}</div><p class="es-small">${esc(S.planNote)}</p></section>
<section class="es-d-sec" aria-labelledby="es-bld-h"><h3 id="es-bld-h">${esc(S.bld)}</h3>${dl(bld)}</section>
</div><aside class="es-d-side">${money}<section class="es-view" id="es-view" aria-labelledby="es-view-h">${viewHtml(l)}</section></aside></div></div>`;
}
function viewHtml(l){
 const r=st.requests[l.id];
 if(r)return `<h3 id="es-view-h" tabindex="-1">${esc(S.sentTitle)}</h3><p class="es-sent">${esc(F.t('sentText',{d:F.dateY(r.date),s:S.slots[r.slot],p:r.phone}))}</p><p class="es-small es-demo">${esc(S.demo)}</p><button type="button" class="es-btn" data-cancel>${esc(S.cancelReq)}</button>`;
 const t=new Date();t.setDate(t.getDate()+1);const mx=new Date();mx.setDate(mx.getDate()+30);const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 return `<h3 id="es-view-h">${esc(S.view)}</h3><p class="es-small">${esc(S.viewLead)}</p>
<form class="es-vform" id="es-vform" novalidate>
<div class="es-verr" id="es-verr" tabindex="-1" hidden></div>
<label class="es-field"><span>${esc(S.name)}</span><input name="name" autocomplete="name" aria-describedby="es-e-name"><small class="es-ferr" id="es-e-name" hidden></small></label>
<label class="es-field"><span>${esc(S.phone)}</span><input name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="+994 50 123 45 67" aria-describedby="es-h-phone es-e-phone"><small id="es-h-phone" class="es-hintf">${esc(S.phoneHint)}</small><small class="es-ferr" id="es-e-phone" hidden></small></label>
<label class="es-field"><span>${esc(S.date)}</span><input name="date" type="date" min="${iso(t)}" max="${iso(mx)}" aria-describedby="es-e-date"><small class="es-ferr" id="es-e-date" hidden></small></label>
<fieldset class="es-field es-slots" aria-describedby="es-e-slot"><legend>${esc(S.slot)}</legend>${S.slots.map((s,i)=>`<label class="es-tog"><input type="radio" name="slot" value="${i}"><span>${esc(s)}</span></label>`).join('')}<small class="es-ferr" id="es-e-slot" hidden></small></fieldset>
<label class="es-field"><span>${esc(S.note)}</span><textarea name="note" rows="2" placeholder="${esc(S.notePh)}"></textarea></label>
<button type="submit" class="es-btn es-primary es-send">${esc(S.send)}</button></form>`;
}
function calc(){
 const l=cur;if(!l||l.mode!=='sale'||!$('#es-down'))return;
 const dp=+$('#es-down').value,y=+$('#es-term').value,ri=$('#es-rate'),r=parseFloat(String(ri.value).replace(',','.'));
 $('#es-down-o').textContent=`${dp}%, ${F.azn(Math.round(l.price*dp/100))}`;
 const bad=!(r>=0&&r<=40);$('#es-rate-err').hidden=!bad;ri.toggleAttribute('aria-invalid',bad);
 const P=Math.round(l.price*(1-dp/100)),n=y*12,i=r/1200;
 if(bad){for(const k of ['pay','loan','int'])$('#es-'+k).textContent='—';return}
 const m=i?P*i/(1-Math.pow(1+i,-n)):P/n;
 $('#es-pay').textContent=F.azn(Math.round(m));$('#es-loan').textContent=F.azn(P);$('#es-int').textContent=F.azn(Math.round(m*n-P));
}
function openDetail(id,fromNav){
 const l=byId[id];if(!l)return;
 cur=l;gi=0;navOpened=fromNav;
 if(l.mode!==st.mode){$(`[name=mode][value=${l.mode}]`).checked=true;setMode(l.mode)}
 dlg.innerHTML=detailHtml(l);
 if(!dlg.open)dlg.showModal();
 dlg.scrollTop=0;$('.es-d-head .es-x',dlg).focus();
 calc();select(id,{scroll:false});
}
function closeDetail(){if(dlg.open)dlg.close()}
dlg.addEventListener('close',()=>{
 const id=cur?.id;cur=null;
 if(location.hash===`#elan-${id}`){if(navOpened)history.back();else history.replaceState(null,'',location.pathname+location.search)}
 const back=id&&list.querySelector(`[data-id=${id}] .es-open`);if(back&&!narrow.matches)back.focus({preventScroll:false});
});
dlg.addEventListener('click',e=>{
 if(e.target===dlg){closeDetail();return}
 const t=e.target.closest('button,a');if(!t)return;
 if(t.hasAttribute('data-close'))closeDetail();
 else if(t.dataset.act==='save')toggleSave(t.dataset.id);
 else if(t.dataset.act==='cmp')toggleCmp(t.dataset.id);
 else if(t.dataset.g){gi=(gi+(+t.dataset.g)+cur.photos.length)%cur.photos.length;redrawGallery(t.classList.contains('es-gal-prev')?'.es-gal-prev':'.es-gal-next')}
 else if(t.dataset.gi){gi=+t.dataset.gi;redrawGallery(`[data-gi="${gi}"]`)}
 else if(t.hasAttribute('data-cancel')){delete st.requests[cur.id];$('#es-view').innerHTML=viewHtml(cur);toast(S.cancelled);refreshCard(cur.id);$('#es-view [name=name]').focus()}
});
function redrawGallery(focusSel){$('#es-gal-wrap').innerHTML=gallery(cur);$(focusSel,dlg)?.focus()}
dlg.addEventListener('keydown',e=>{
 if(!cur||!cur.photos.length||!e.target.closest('.es-gal'))return;
 if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();gi=(gi+(e.key==='ArrowRight'?1:-1)+cur.photos.length)%cur.photos.length;redrawGallery(e.key==='ArrowRight'?'.es-gal-next':'.es-gal-prev')}
});
dlg.addEventListener('input',e=>{if(e.target.closest('.es-calc'))calc();if(e.target.closest('#es-vform')&&e.target.hasAttribute('aria-invalid'))validate(false)});
dlg.addEventListener('change',e=>{if(e.target.closest('.es-calc'))calc()});
function phoneOk(v){
 let d=v.replace(/[\s()\-]/g,'');
 if(d.startsWith('+994'))d=d.slice(4);else if(d.startsWith('994')&&d.length===12)d=d.slice(3);else if(d.startsWith('0')&&d.length===10)d=d.slice(1);
 return /^(10|12|50|51|55|60|70|77|99)\d{7}$/.test(d)?d:null;
}
function validate(focus=true){
 const fm=$('#es-vform');if(!fm)return null;
 const E=fm.elements,v={name:E.name.value.trim(),phone:E.phone.value.trim(),date:E.date.value,slot:fm.querySelector('[name=slot]:checked')?.value,note:E.note.value.trim()};
 const err={};
 if(v.name.replace(/[^\p{L}]/gu,'').length<2)err.name=S.errName;
 const ph=phoneOk(v.phone);if(!ph)err.phone=S.errPhone;
 if(!v.date)err.date=S.errDate;else if(v.date<E.date.min||v.date>E.date.max)err.date=S.errDateRange;
 if(v.slot==null)err.slot=S.errSlot;
 for(const k of ['name','phone','date','slot']){
  const m=$('#es-e-'+k);m.hidden=!err[k];m.textContent=err[k]||'';
  const inputs=k==='slot'?$$('[name=slot]',fm):[E[k]];inputs.forEach(i=>i.toggleAttribute('aria-invalid',!!err[k]));
  fm.querySelector(k==='slot'?'.es-slots':`[name=${k}]`).closest('.es-field').classList.toggle('is-bad',!!err[k]);
 }
 const box=$('#es-verr'),keys=Object.keys(err);
 box.hidden=!keys.length;
 if(keys.length){
  const labels={name:S.name,phone:S.phone,date:S.date,slot:S.slot};
  box.innerHTML=`<p>${esc(S.errSummary)}</p><ul>${keys.map(k=>`<li><a href="#" data-f="${k}">${esc(labels[k])}</a></li>`).join('')}</ul>`;
  if(focus)box.focus();
  return null;
 }
 v.phone=`+994 ${ph.slice(0,2)} ${ph.slice(2,5)} ${ph.slice(5,7)} ${ph.slice(7)}`;v.slot=+v.slot;
 return v;
}
dlg.addEventListener('submit',e=>{
 if(e.target.id!=='es-vform')return;e.preventDefault();
 const v=validate();if(!v)return;
 st.requests[cur.id]=v;$('#es-view').innerHTML=viewHtml(cur);$('#es-view-h').focus();refreshCard(cur.id);
});
dlg.addEventListener('click',e=>{const a=e.target.closest('[data-f]');if(!a)return;e.preventDefault();const fm=$('#es-vform');(a.dataset.f==='slot'?fm.querySelector('[name=slot]'):fm.elements[a.dataset.f]).focus()});
function refreshCard(id){const old=list.querySelector(`[data-id=${id}]`);if(old){const t=document.createElement('template');t.innerHTML=card(D,F,byId[id],st);old.replaceWith(t.content.firstElementChild)}}

// ---------- compare ----------
const cdlg=$('#es-cmpdlg');
function renderCompare(){
 const ls=st.compare[st.mode].map(id=>byId[id]);
 if(!ls.length){cdlg.innerHTML=`<div class="es-cmp"><header class="es-cmp-h"><h2 id="es-cmp-title">${esc(S.cmpTitle)}</h2><button type="button" class="es-btn es-x" data-close aria-label="${esc(S.close)}"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg></button></header><p class="es-cmp-empty">${esc(S.cmpEmpty)}</p></div>`;return}
 const best=Math.min(...ls.map(l=>l.ppm)),sale=st.mode==='sale';
 const rows=[[S.fPrice,l=>F.price(l)],[S.fPpm,l=>F.ppm(l)+(ls.length>1&&l.ppm===best?`\n${S.cmpBest}`:'')],[S.fArea,l=>`${F.f1(l.area)} m²`],[S.fRooms,l=>String(l.rooms)],[S.district,l=>`${F.district(l.district)}, ${l.place}`],[S.fFloor,F.floor],[S.fType,l=>D.TYPE[l.type]],[S.bSeries,l=>D.SER[l.series]],[S.bYear,l=>String(l.year)],[S.fReno,l=>D.RENO[l.reno]],
  sale?[S.fDeed,l=>l.kupca?S.deed:S.noDeed]:[S.fFurn,l=>l.furnished?S.furnished:S.unfurnished],[S.bHeat,l=>D.HEAT[l.heat]],[S.bCeil,l=>F.t('metres',{v:F.f1(l.ceil)})],[S.bMetro,F.metro]];
 cdlg.innerHTML=`<div class="es-cmp"><header class="es-cmp-h"><h2 id="es-cmp-title">${esc(S.cmpTitle)}</h2><button type="button" class="es-btn es-x" data-close aria-label="${esc(S.close)}"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg></button></header>
<div class="es-cmp-scroll" tabindex="0" role="region" aria-labelledby="es-cmp-title"><table class="es-cmpt"><thead><tr><th scope="col"><span class="sr-only">${esc(S.facts)}</span></th>${ls.map(l=>`<th scope="col"><div class="es-cmp-plan">${planSvg(l.plan,{mini:true})}</div><a href="#elan-${l.id}" data-goto="${l.id}">${esc(F.title(l))}</a><button type="button" class="es-btn es-small-b" data-rm="${l.id}">${esc(S.cmpRemove)}</button></th>`).join('')}</tr></thead>
<tbody>${rows.map(([k,fn])=>`<tr><th scope="row">${esc(k)}</th>${ls.map(l=>{const v=fn(l).split('\n');return `<td${v[1]?' class="is-best"':''}>${esc(v[0])}${v[1]?`<small>${esc(v[1])}</small>`:''}</td>`}).join('')}</tr>`).join('')}</tbody></table></div></div>`;
}
cdlg.addEventListener('click',e=>{
 if(e.target===cdlg){cdlg.close();return}
 const t=e.target.closest('button,a');if(!t)return;
 if(t.hasAttribute('data-close'))cdlg.close();
 else if(t.dataset.rm){toggleCmp(t.dataset.rm);const f=$('[data-rm]',cdlg)||$('[data-close]',cdlg);f.focus();if(!st.compare[st.mode].length)cdlg.close()}
 else if(t.dataset.goto){cdlg.close()}
});
function openCompare(){renderCompare();cdlg.showModal();$('[data-close]',cdlg).focus()}

// ---------- events ----------
form.addEventListener('input',()=>render());
form.addEventListener('change',()=>render());
form.addEventListener('reset',()=>setTimeout(()=>{st.savedOnly=false;render()}));
$('#es-sort').addEventListener('change',e=>{st.sort=e.target.value;render()});
$$('[name=mode]').forEach(r=>r.addEventListener('change',()=>setMode(r.value)));
$('#es-saved-btn').addEventListener('click',()=>{st.savedOnly=!st.savedOnly;render();$('#es-search').scrollIntoView({block:'start',behavior:reduce.matches?'auto':'smooth'})});
$('#es-cmp-btn').addEventListener('click',openCompare);
$('#es-tray-open').addEventListener('click',openCompare);
$('#es-tray-clear').addEventListener('click',()=>{const ids=[...st.compare[st.mode]];st.compare[st.mode]=[];persist();ids.forEach(refreshButtons);tray();badges()});
function chipClick(e){const b=e.target.closest('[data-chip]');if(!b)return;chipList[+b.dataset.chip].clear();render();($('.es-chip')||$('#es-count')).focus?.()}
$('.es-chips').addEventListener('click',chipClick);
$('#es-empty-acts').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.empty==='reset'){form.reset();return}
 if(b.dataset.empty==='all'){st.savedOnly=false;render();return}
 chipClick(e);
});
list.addEventListener('click',e=>{
 const b=e.target.closest('[data-act]');if(!b)return;
 if(b.dataset.act==='save')toggleSave(b.dataset.id);else toggleCmp(b.dataset.id);
});
list.addEventListener('mouseover',e=>{const it=e.target.closest('.es-item');if(it)setHot(it.dataset.id)});
list.addEventListener('mouseleave',()=>setHot(null));
list.addEventListener('focusin',e=>{const it=e.target.closest('.es-item');if(it)setHot(it.dataset.id)});
list.addEventListener('focusout',e=>{if(!list.contains(e.relatedTarget))setHot(null)});
pins.addEventListener('click',e=>{const p=e.target.closest('.es-pin');if(p)select(p.dataset.id)});
pins.addEventListener('keydown',e=>{const p=e.target.closest('.es-pin');if(p&&(e.key==='Enter'||e.key===' ')){e.preventDefault();if(st.sel===p.dataset.id&&e.key==='Enter')location.hash=`elan-${p.dataset.id}`;else select(p.dataset.id)}});
pins.addEventListener('mouseover',e=>{const p=e.target.closest('.es-pin');if(p)setHot(p.dataset.id)});
pins.addEventListener('mouseleave',()=>setHot(null));
pins.addEventListener('focusin',e=>{const p=e.target.closest('.es-pin');if(p)setHot(p.dataset.id)});
pins.addEventListener('focusout',()=>setHot(null));
pins.addEventListener('dblclick',e=>{const p=e.target.closest('.es-pin');if(p)location.hash=`elan-${p.dataset.id}`});
// districts table: search one district
$('#es-districts').addEventListener('click',e=>{
 const b=e.target.closest('[data-district]');if(!b)return;
 $$('[name=d]',form).forEach(i=>i.checked=i.value===b.dataset.district);
 render();$('#es-search').scrollIntoView({block:'start',behavior:reduce.matches?'auto':'smooth'});$('#es-count').setAttribute('tabindex','-1');$('#es-count').focus({preventScroll:true});
});
// view toggle (phones) and filter drawer (below 1180px)
$('.es-viewtog').addEventListener('click',e=>{
 const b=e.target.closest('[data-view]');if(!b)return;
 work.dataset.view=b.dataset.view;$$('.es-viewtog [data-view]').forEach(x=>x.setAttribute('aria-pressed',x===b));
 if(b.dataset.view==='map')panTo(st.sel);
});
// On phones the map is wider than the screen and pans sideways; bring the selected pin (or the centre) into view.
function panTo(id){
 const pan=$('#es-map-pan');if(pan.scrollWidth<=pan.clientWidth)return;
 const x=id?byId[id].x/1000:.5;pan.scrollLeft=Math.max(0,x*pan.scrollWidth-pan.clientWidth/2);
}
const fOpen=$('.es-f-open');
function drawerOpen(on){
 form.classList.toggle('is-open',on);fOpen.setAttribute('aria-expanded',on);document.body.classList.toggle('es-lock',on);
 if(on)$('.es-f-close',form).focus();else fOpen.focus();
}
fOpen.addEventListener('click',()=>drawerOpen(true));
$('.es-f-close',form).addEventListener('click',()=>drawerOpen(false));
$('.es-f-apply',form).addEventListener('click',()=>drawerOpen(false));
form.addEventListener('keydown',e=>{if(e.key==='Escape'&&form.classList.contains('is-open')){e.preventDefault();drawerOpen(false)}});
drawer.addEventListener('change',()=>{if(!drawer.matches&&form.classList.contains('is-open'))drawerOpen(false)});
// hash routing: #elan-u101 opens the dossier, Back closes it
function route(fromNav){
 const m=location.hash.match(/^#elan-(u\d+)$/);
 if(m&&byId[m[1]])openDetail(m[1],fromNav);
 else if(dlg.open){navOpened=false;closeDetail()}
}
addEventListener('hashchange',()=>route(true));

document.body.dataset.mode='sale';
render();
route(false);
