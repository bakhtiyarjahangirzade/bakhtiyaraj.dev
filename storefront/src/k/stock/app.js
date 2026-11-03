import '../ribbon.css';
import './style.css';
import '../../i18n.js';
import {rows,counts,ordersHTML,logHTML,reorderHTML,detailHTML,makeFmt,sku,avail,orderShort} from './view.js';

const D=JSON.parse(document.getElementById('k-data').textContent),S=D.S,F=makeFmt(D);
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const st={q:'',cat:'all',st:'all',sort:'status',dir:1,sel:'G-COL-HUI'};
let fresh=null,freshOrder=null,clock=10*60+5;
const narrow=matchMedia('(max-width:980px)');

const toastEl=$('#sr-toast');let tt;
const toast=m=>{toastEl.textContent=m;toastEl.classList.add('is-on');clearTimeout(tt);tt=setTimeout(()=>toastEl.classList.remove('is-on'),4800)};
const tick=()=>{clock+=2+Math.floor(Math.random()*3);return `${String(Math.floor(clock/60)).padStart(2,'0')}:${String(clock%60).padStart(2,'0')}`};

// ---- rendering ----
function renderStock(){
 const R=rows(D,F,st,fresh);
 $('#sr-rows').innerHTML=R.html;$('#sr-count').textContent=F.fill(S.rowsN,{n:R.n});
 $('#sr-table').hidden=!R.n;$('#sr-empty').hidden=!!R.n;
 if(!R.n)$('#sr-empty-t').textContent=st.q.trim()?F.fill(S.noResult,{q:st.q.trim()}):S.noResultF;
 $$('#sr-table thead th').forEach(th=>{const b=th.querySelector('[data-sort]');if(b)th.setAttribute('aria-sort',b.dataset.sort===st.sort?(st.dir>0?'ascending':'descending'):'none')});
 $('#sr-detail').innerHTML=detailHTML(D,F,st.sel);
 $$('.sr-chips [data-st]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.st===st.st));
}
function renderCounts(){
 const C=counts(D);
 $('#sr-attn-st').textContent=F.fill(S.attn,{low:C.low,out:C.out});$('#sr-attn-o').textContent=F.fill(S.attnOrders,{n:C.open});$('#sr-attn-r').textContent=F.fill(S.attnSugg,{n:C.sugg});
 $('#sr-tn-orders').textContent=C.open;$('#sr-tn-reorder').textContent=C.sugg;
}
const renderAll=()=>{renderStock();renderCounts();$('#sr-orders').innerHTML=ordersHTML(D,F,freshOrder);$('#sr-log').innerHTML=logHTML(D,F,$('#sr-log-f').value);$('#sr-reorder').innerHTML=reorderHTML(D,F);preview()};

// ---- tabs (arrow keys move between tabs) ----
const tabs=$$('[role=tab]');
function showTab(id,focus){
 tabs.forEach(t=>{const on=t.dataset.tab===id;t.setAttribute('aria-selected',on);t.tabIndex=on?0:-1;$(`#sr-p-${t.dataset.tab}`).hidden=!on});
 if(focus)$(`#sr-tab-${id}`).focus();
}
tabs.forEach((t,i)=>{t.addEventListener('click',()=>showTab(t.dataset.tab));t.addEventListener('keydown',e=>{const k={ArrowRight:1,ArrowLeft:-1}[e.key];if(k){e.preventDefault();showTab(tabs[(i+k+tabs.length)%tabs.length].dataset.tab,true)}if(e.key==='Home'){e.preventDefault();showTab(tabs[0].dataset.tab,true)}if(e.key==='End'){e.preventDefault();showTab(tabs.at(-1).dataset.tab,true)}})});
$('#sr-attn').addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(!b)return;if(b.dataset.go==='attn'){st.st='attn';st.sort='status';st.dir=1;showTab('stock');renderStock();$('#sr-table').scrollIntoView({block:'nearest'})}else showTab(b.dataset.go,true)});

// ---- filters, sort, selection ----
$('#sr-q').addEventListener('input',e=>{st.q=e.target.value;renderStock()});
$('#sr-cat').addEventListener('change',e=>{st.cat=e.target.value;renderStock()});
$('.sr-chips').addEventListener('click',e=>{const b=e.target.closest('[data-st]');if(b){st.st=b.dataset.st;renderStock()}});
$('#sr-clear').addEventListener('click',()=>{Object.assign(st,{q:'',cat:'all',st:'all'});$('#sr-q').value='';$('#sr-cat').value='all';renderStock();$('#sr-q').focus()});
$('#sr-table thead').addEventListener('click',e=>{const b=e.target.closest('[data-sort]');if(!b)return;const k=b.dataset.sort;st.dir=st.sort===k?-st.dir:1;st.sort=k;renderStock();$(`[data-sort="${k}"]`).focus()});
function select(code,scroll){
 st.sel=code;const s=sku(D,code),type=form.type.value;
 if(type==='roast'){if(s.cat==='green')form.green.value=code;if(s.cat==='roasted'){form.roasted.value=code;form.green.value=D.roastPairs[code]}}
 else form.sku.value=code;
 renderStock();preview();
 if(scroll&&narrow.matches)$('#sr-detail').scrollIntoView({block:'start'});
}
$('#sr-rows').addEventListener('click',e=>{const b=e.target.closest('.sr-sku');if(b){select(b.dataset.code,true);$(`.sr-sku[data-code="${b.dataset.code}"]`)?.focus({preventScroll:narrow.matches})}});

// ---- stock movements ----
function record(code,delta,type,ref,reason){
 const s=sku(D,code);s.on=Math.round((s.on+delta)*10)/10;
 D.log.forEach(e=>e.fresh=false);
 const e={date:D.today,time:tick(),type,code,delta:Math.round(delta*10)/10,bal:s.on,ref:ref||'',by:S.by,reason:reason||'',fresh:true};
 D.log.push(e);return e;
}
const form=$('#sr-move');
const FIELDS={receive:['sku','qty','ref'],ship:['sku','qty','cafe'],roast:['green','roasted','qty','yield'],adjust:['sku','delta','reason']};
const num=v=>v===''?NaN:Number(String(v).replace(',','.'));
function setErr(name,msg){const i=$(`#sr-${name}`),p=$(`#sr-${name}-e`);if(!i)return;i.setAttribute('aria-invalid',msg?'true':'false');p.textContent=msg||''}
function clearErr(){Object.values(FIELDS).flat().forEach(n=>setErr(n,''));$('#sr-form-err').hidden=true}
function layout(){
 const type=form.type.value;
 ['sku','green','roasted','qty','yield','delta','ref','cafe','reason'].forEach(n=>$(`#sr-${n}-f`).hidden=!FIELDS[type].includes(n));
 const s=sku(D,type==='roast'?form.green.value:form.sku.value);
 $('#sr-unit').textContent=D.units[s.unit];
 preview();
}
function preview(){
 const type=form.type.value,p=$('#sr-preview');
 if(type==='roast'){
  const g=sku(D,form.green.value),r=sku(D,form.roasted.value),q=num(form.qty.value),y=num(form.yield.value);
  p.classList.remove('is-bad');
  if(!(q>0)||!(y>0)){p.textContent=`${F.fill(S.preview,{code:g.code,from:F.q(g.on,'kg'),to:'…'})}`;return}
  const out=Math.round(q*y/100*10)/10;
  p.innerHTML=`<span>${F.fill(S.preview,{code:g.code,from:F.q(g.on,'kg'),to:F.q(g.on-q,'kg')})}</span><span>${F.fill(S.preview,{code:r.code,from:F.q(r.on,'kg'),to:F.q(r.on+out,'kg')})}</span><span>${F.fill(S.roastOut,{q:F.q(out,'kg')})}</span>`;
  return;
 }
 const s=sku(D,form.sku.value),d=type==='adjust'?num(form.delta.value):num(form.qty.value)*(type==='ship'?-1:1);
 p.textContent=F.fill(S.preview,{code:s.code,from:F.q(s.on,s.unit),to:Number.isFinite(d)&&d?F.q(s.on+d,s.unit):'…'});
 p.classList.toggle('is-bad',Number.isFinite(d)&&(s.on+d<0||(type==='ship'&&-d>avail(D,s))));
}
form.addEventListener('change',e=>{if(e.target.name==='type'){clearErr();layout()}else{if(['sku','green'].includes(e.target.name)){st.sel=e.target.value;renderStock()}if(e.target.name==='roasted'){form.green.value=D.roastPairs[e.target.value]}layout()}});
form.addEventListener('input',e=>{if(e.target.getAttribute('aria-invalid')==='true')setErr(e.target.name,'');preview()});
form.addEventListener('submit',e=>{
 e.preventDefault();clearErr();
 const type=form.type.value,err={};
 if(type==='roast'){
  const g=sku(D,form.green.value),r=sku(D,form.roasted.value),q=num(form.qty.value),y=num(form.yield.value);
  if(!(q>0))err.qty=S.errQty;else if(q>avail(D,g))err.qty=F.fill(S.errRoast,{q:F.q(avail(D,g),'kg')});else if(q>60)err.qty=S.errBatch;
  if(!(y>=70&&y<=90))err.yield=S.errYield;
  if(!show(err)){
   const ref=`Q-${1032+D.log.filter(x=>x.type==='roast').length/2}`,out=Math.round(q*y/100*10)/10;
   record(g.code,-q,'roast',ref);record(r.code,out,'roast',ref);
   fresh=r.code;st.sel=r.code;done(F.fill(S.roastToast,{ref,gin:F.q(q,'kg'),rout:F.q(out,'kg')}));
  }
  return;
 }
 const s=sku(D,form.sku.value);
 if(type==='adjust'){
  const d=num(form.delta.value);
  if(!Number.isFinite(d)||d===0)err.delta=S.errDelta;else if(s.on+d<0)err.delta=S.errBelow;
  if(!form.reason.value)err.reason=S.errReason;
  if(!show(err)){const x=record(s.code,d,'adjust','',form.reason.value);fresh=s.code;done(F.fill(S.savedToast,{type:S.mt.adjust,code:s.code,delta:`${d>0?'+':''}${F.q(d,s.unit)}`,bal:F.q(x.bal,s.unit)}))}
  return;
 }
 const q=num(form.qty.value);
 if(!(q>0))err.qty=S.errQty;else if(type==='ship'&&q>avail(D,s))err.qty=F.fill(S.errShip,{q:F.q(Math.max(0,avail(D,s)),s.unit)});
 if(!show(err)){
  const x=record(s.code,type==='ship'?-q:q,type,type==='ship'?form.cafe.value:form.ref.value.trim());
  fresh=s.code;done(F.fill(S.savedToast,{type:S.mt[type],code:s.code,delta:`${type==='ship'?'−':'+'}${F.q(q,s.unit)}`,bal:F.q(x.bal,s.unit)}));
 }
});
function show(err){
 const keys=Object.keys(err);keys.forEach(k=>setErr(k,err[k]));
 const box=$('#sr-form-err');box.hidden=!keys.length;box.textContent=keys.length?F.fill(S.errSummary,{n:keys.length}):'';
 if(keys.length)$(`#sr-${keys[0]}`).focus();
 return keys.length;
}
function done(msg){form.qty.value='';form.delta.value='';form.ref.value='';form.reason.value='';renderAll();toast(msg)}

// ---- orders, purchase orders, roast planning ----
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-act]');if(!b)return;
 const act=b.dataset.act;
 if(act==='pick'||act==='ship'){
  const o=D.orders.find(x=>x.no===+b.dataset.no);
  if(act==='pick'){o.status='picking';freshOrder=o.no;renderAll();toast(F.fill(S.pickedToast,{no:o.no}));$(`[data-act=ship][data-no="${o.no}"]`)?.focus();return}
  if(orderShort(D,o).length){toast(F.fill(S.blockedToast,{no:o.no}));$(`#sr-o${o.no}-m`).classList.add('is-flash');return}
  o.status='shipped';o.shipped=D.today;
  for(const [c,q] of o.lines)record(c,-q,'ship',`SF-${o.no}`);
  freshOrder=o.no;renderAll();toast(F.fill(S.shippedToast,{no:o.no,n:o.lines.length}));$(`#sr-o${o.no}`)?.focus?.();
 }
 if(act==='po'){const s=sku(D,b.dataset.code);s.onOrder+=+b.dataset.qty;renderAll();toast(F.fill(S.poToast,{code:s.code,q:F.q(+b.dataset.qty,s.unit)}));$('#sr-reorder button')?.focus()}
 if(act==='plan'){
  const code=b.dataset.code,q=Math.min(60,Math.ceil(+b.dataset.qty/0.84));
  showTab('stock');form.type.value='roast';layout();form.roasted.value=code;form.green.value=D.roastPairs[code];form.qty.value=q;form.yield.value=84;
  st.sel=code;renderStock();layout();form.scrollIntoView({block:'start'});form.qty.focus({preventScroll:true});
  toast(F.fill(S.planToast,{code,q:F.q(q,'kg')}));
 }
 if(act==='receive-po'){const s=sku(D,b.dataset.code),q=s.onOrder;s.onOrder=0;const x=record(s.code,q,'receive','PO');fresh=s.code;renderAll();toast(F.fill(S.savedToast,{type:S.mt.receive,code:s.code,delta:`+${F.q(q,s.unit)}`,bal:F.q(x.bal,s.unit)}))}
});
$('#sr-log-f').addEventListener('change',e=>{$('#sr-log').innerHTML=logHTML(D,F,e.target.value)});
form.type.value='receive';layout();
