import '../ribbon.css';
import './style.css';
import '../../i18n.js';

const D=JSON.parse(document.getElementById('k-data').textContent);
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const fill=(s,v)=>s.replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m);
const reduce=matchMedia('(prefers-reduced-motion: reduce)');

// Hero: the visitor steps through featured projects; no autoplay.
const slides=$$('.cf-slide');let cur=0;
function show(i){cur=(i+slides.length)%slides.length;slides.forEach((s,n)=>s.hidden=n!==cur);$('.cf-count b').textContent=cur+1}
$('.cf-prev').addEventListener('click',()=>show(cur-1));
$('.cf-next').addEventListener('click',()=>show(cur+1));
$('.cf-hero').addEventListener('keydown',e=>{if(e.target.closest('input,textarea'))return;if(e.key==='ArrowLeft')show(cur-1);if(e.key==='ArrowRight')show(cur+1)});

// Archive filters + index/plates view
let type='all',status='all',view='list';
const rows=$$('.cf-row'),plates=$$('.cf-plate');
function apply(){
 let n=0;
 for(const el of [...rows,...plates]){const ok=(type==='all'||el.dataset.type===type)&&(status==='all'||el.dataset.status===status);el.hidden=!ok;if(ok&&el.classList.contains('cf-row'))n++}
 $('.cf-n').textContent=fill(D.count,{n});
 $('.cf-empty').hidden=n>0;
 $('.cf-list').hidden=view!=='list'||!n;$('.cf-list-head').hidden=view!=='list'||!n;
 $('.cf-plates').hidden=view!=='plates'||!n;
 $('.cf-plates').classList.toggle('is-filtered',type!=='all'||status!=='all');
}
function press(group,attr,val){$$(`[${attr}]`,group).forEach(b=>b.setAttribute('aria-pressed',String(b.getAttribute(attr)===val)))}
$('.cf-tools').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.type){type=b.dataset.type;press(b.parentElement,'data-type',type)}
 if(b.dataset.status){status=b.dataset.status;press(b.parentElement,'data-status',status)}
 if(b.dataset.view){view=b.dataset.view;press(b.parentElement,'data-view',view)}
 apply();
});
$('.cf-reset').addEventListener('click',()=>{type='all';status='all';$$('[data-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.type==='all')));$$('[data-status]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.status==='all')));apply();$('[data-type="all"]').focus()});

// Index rows: the photograph follows the pointer on wide screens with a fine pointer.
const fine=matchMedia('(hover: hover) and (pointer: fine) and (min-width: 721px)');
let hot=null,raf=0,px=0,py=0;
function place(){raf=0;if(!hot)return;const th=$('.cf-row-thumb',hot),w=th.offsetWidth,h=th.offsetHeight;const x=Math.min(innerWidth-w-16,px+28),y=Math.max(70,Math.min(innerHeight-h-16,py-h/2));th.style.transform=`translate(${x}px,${y}px)`}
for(const r of rows){
 r.addEventListener('pointerenter',e=>{if(!fine.matches)return;hot=r;r.classList.add('is-hot');px=e.clientX;py=e.clientY;place()});
 r.addEventListener('pointermove',e=>{if(!fine.matches||reduce.matches)return;px=e.clientX;py=e.clientY;if(!raf)raf=requestAnimationFrame(place)});
 r.addEventListener('pointerleave',()=>{r.classList.remove('is-hot');if(hot===r)hot=null});
}
addEventListener('scroll',()=>{if(hot){hot.classList.remove('is-hot');hot=null}},{passive:true});

// Case study sheet (native dialog: Escape closes, focus returns to the trigger)
const dlg=$('.cf-dialog');let trigger=null;
function openCase(id){
 const art=$(`[data-case="${id}"]`,dlg);if(!art)return;
 if(!dlg.open)trigger=document.activeElement;
 $$('.cf-case',dlg).forEach(a=>a.hidden=a!==art);
 if(!dlg.open)dlg.showModal();
 dlg.scrollTop=0;$('h2',art).setAttribute('tabindex','-1');$('h2',art).focus({preventScroll:true});
 history.replaceState(null,'',`#${id}`);
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-open]');if(b){e.preventDefault();openCase(b.dataset.open)}});
$('.cf-close').addEventListener('click',()=>dlg.close());
dlg.addEventListener('close',()=>{history.replaceState(null,'',location.pathname+location.search);trigger?.focus?.({preventScroll:true})});
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
if(location.hash&&$(`[data-case="${location.hash.slice(1)}"]`,dlg))openCase(location.hash.slice(1));

// Enquiry: inline validation in the interface's voice; nothing is sent.
const form=$('.cf-form'),ok=$('.cf-ok');
const phoneOk=v=>/^\+?994[\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/.test(v.trim())||/^0\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/.test(v.trim());
function check(){
 const f=new FormData(form),errs=[];
 const set=(name,bad,errId)=>{const el=form.elements[name];const err=$('#'+errId);if(el&&el.setAttribute&&!(el instanceof RadioNodeList))el.setAttribute('aria-invalid',String(bad));err.hidden=!bad;if(bad)errs.push(el instanceof RadioNodeList?el[0]:el)};
 set('type',!f.get('type'),'e-type');
 const area=Number(String(f.get('area')||'').replace(/\s/g,'').replace(',','.'));
 set('area',!(area>=20&&area<=20000),'e-area');
 set('name',!String(f.get('name')||'').trim(),'e-name');
 set('phone',!phoneOk(String(f.get('phone')||'')),'e-phone');
 return errs;
}
form.addEventListener('submit',e=>{
 e.preventDefault();
 const errs=check(),box=$('.cf-form-error');
 if(errs.length){box.textContent=fill(D.errSummary,{n:errs.length});box.hidden=false;errs[0].focus();return}
 box.hidden=true;
 const f=new FormData(form),L=D.labels;
 const rowsOut=[[L.type,D.types[f.get('type')]],[L.place,f.get('place')||'—'],[L.area,`${f.get('area')} m²`],[L.stage,D.stages[f.get('stage')]],[L.budget,D.budgets[f.get('budget')]||'—'],[L.name,f.get('name')],[L.phone,f.get('phone')]];
 const dl=$('.cf-ok-sum');dl.replaceChildren(...rowsOut.flatMap(([k,v])=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=v;return [dt,dd]}));
 form.hidden=true;ok.hidden=false;ok.focus();
});
form.addEventListener('input',e=>{if(e.target.getAttribute('aria-invalid')==='true')check()});
form.addEventListener('change',e=>{if(e.target.name==='type'){$('#e-type').hidden=true}});
$('.cf-edit').addEventListener('click',()=>{ok.hidden=true;form.hidden=false;form.elements.name.focus()});
