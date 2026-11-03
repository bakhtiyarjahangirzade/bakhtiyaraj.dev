import '../ribbon.css';
import './style.css';
import '../../i18n.js';

const D=JSON.parse(document.getElementById('k-data').textContent);
const U=D.u,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const fill=(s,v)=>s.replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m);
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const nf=new Intl.NumberFormat(D.locale);
const azn=n=>`${nf.format(n)} AZN`;
const P=Object.fromEntries(D.products.map(p=>[p.id,p]));
const Z=Object.fromEntries(D.zones.map(z=>[z.id,z]));
const KEY='forma-cart-v1';

// ---- cart state (per-viewer convenience; works without storage) ----
let cart=[],zone='baku';
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&Array.isArray(s.cart)){cart=s.cart.filter(l=>P[l.id]&&P[l.id].stock[`${l.c}|${l.s}`]!==undefined);zone=Z[s.zone]?s.zone:'baku'}}catch{}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify({cart,zone}))}catch{}};
const stockOf=(p,c,s)=>p.stock[`${c}|${s}`]??0;
const priceOf=(p,s)=>p.sizes.find(x=>x.id===s).price;
const subtotal=()=>cart.reduce((a,l)=>a+priceOf(P[l.id],l.s)*l.q,0);
const fee=sub=>{const z=Z[zone];return !z.fee||sub>=z.free?0:z.fee};
const units=()=>cart.reduce((a,l)=>a+l.q,0);

// ---- swatch colours (hex from data; style set from JS is CSP-safe) ----
for(const d of $$('.f-dot[data-hex]'))d.style.background=d.dataset.hex;

// ---- filters and sort ----
const form=$('#f-filters'),grid=$('#f-grid'),q=$('#f-q');
const tiles=$$('.f-tile',grid),note=$('[data-note]',grid);
function apply(){
 const f=new FormData(form),cat=f.get('cat')||'all',mat=f.get('mat')||'',price=f.get('price')||'',stock=f.get('stock'),sort=f.get('sort')||'rank';
 const [lo,hi]=price?price.split('-').map(Number):[0,1e9];
 const term=q.value.trim().toLocaleLowerCase(D.locale);
 let n=0;
 for(const t of tiles){
  const p=P[t.dataset.id],pr=+t.dataset.price;
  const hay=`${p.name} ${p.line} ${p.catName} ${p.matName}`.toLocaleLowerCase(D.locale);
  const ok=(cat==='all'||t.dataset.cat===cat)&&(!mat||t.dataset.mat===mat)&&pr>=lo&&pr<hi+(hi===1e9?0:0.001)&&(!stock||+t.dataset.stock>0)&&(!term||hay.includes(term));
  t.hidden=!ok;if(ok)n++;
 }
 const key={rank:t=>+t.dataset.rank,new:t=>-t.dataset.added,asc:t=>+t.dataset.price,desc:t=>-t.dataset.price}[sort];
 const order=[...tiles].sort((a,b)=>key(a)-key(b));
 order.forEach(t=>grid.append(t));
 // The material note keeps its place after the fifth visible object, and only in the default view.
 const vis=order.filter(t=>!t.hidden);
 note.hidden=!(cat==='all'&&!mat&&!price&&!stock&&!term&&vis.length>5);
 if(!note.hidden)vis[4].after(note);
 $('#f-n').textContent=fill(U.count,{n});
 $('#f-empty').hidden=n>0;
 for(const b of $$('[data-hw]'))b.setAttribute('aria-pressed',b.dataset.hw===mat);
 $('#f-reset').hidden=cat==='all'&&!mat&&!price&&!stock&&sort==='rank'&&!term;
}
form.addEventListener('change',apply);
q.addEventListener('input',apply);
form.addEventListener('reset',()=>{q.value='';setTimeout(apply)});
$('[data-reset]').addEventListener('click',()=>{form.reset();q.value='';setTimeout(()=>{apply();form.querySelector('input[name=cat]').focus()})});
for(const b of $$('[data-hw]'))b.addEventListener('click',()=>{const sel=form.elements.mat,on=sel.value===b.dataset.hw;sel.value=on?'':b.dataset.hw;apply();if(!on)grid.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})});
form.addEventListener('submit',e=>e.preventDefault());
apply();

// ---- product dialog ----
const pd=$('#f-product'),pb=$('#f-pbody');
let cur=null,opener=null;
function openProduct(id,from){
 const p=P[id];opener=from||document.activeElement;
 const c0=p.colors.find(c=>p.sizes.some(s=>stockOf(p,c.id,s.id)>0))||p.colors[0];
 const s0=p.sizes.find(s=>stockOf(p,c0.id,s.id)>0)||p.sizes[0];
 cur={p,c:c0.id,s:s0.id,q:1,img:0};
 const z=Z.baku,r=Z.regions;
 pb.innerHTML=`<button type="button" class="f-x" data-close aria-label="${esc(U.close)}">×</button>`+
  `<div class="f-gal"><div class="f-gmain" id="f-gmain">${D.imgs[id].big[0]}</div><div class="f-thumbs" role="group" aria-label="${esc(p.name)}">${D.imgs[id].thumb.map((h,i)=>`<button type="button" class="f-thumb" data-img="${i}" aria-label="${esc(fill(U.photo,{n:i+1}))}" aria-pressed="${i===0}">${h}</button>`).join('')}</div><p class="f-shown" id="f-shown"></p></div>`+
  `<div class="f-pinfo"><p class="f-pcat">${esc(p.catName)}, ${esc(p.matName.toLocaleLowerCase(D.locale))}</p><h2 id="f-pname">${esc(p.name)}</h2><p class="f-pprice" id="f-pprice"></p><p class="f-pabout">${esc(p.about)}</p>`+
  `<form id="f-pform" class="f-pform">`+
   (p.colors.length>1?`<fieldset class="f-opt"><legend>${esc(U.colour)}: <span id="f-cname"></span></legend><div class="f-swrow">${p.colors.map(c=>`<label class="f-swopt"><input type="radio" name="c" value="${c.id}"${c.id===cur.c?' checked':''}><span class="f-swb" data-hex="${c.hex}"></span><span class="sr-only">${esc(c.name)}</span></label>`).join('')}</div></fieldset>`:`<p class="f-opt1">${esc(U.colour)}: ${esc(p.colors[0].name)}</p>`)+
   (p.sizes.length>1?`<fieldset class="f-opt"><legend>${esc(U.size)}</legend><div class="f-szrow">${p.sizes.map(s=>`<label class="f-szopt"><input type="radio" name="s" value="${s.id}"${s.id===cur.s?' checked':''}><span><b>${esc(s.label)}</b><small>${azn(s.price)}</small></span></label>`).join('')}</div></fieldset>`:`<p class="f-opt1">${esc(U.size)}: ${esc(p.sizes[0].label)}</p>`)+
   `<p class="f-stock" id="f-stock" aria-live="polite"></p>`+
   `<div class="f-buy"><div class="f-step" role="group" aria-label="${esc(U.qty)}"><button type="button" data-q="-1" aria-label="${esc(U.dec)}">−</button><output id="f-qv">1</output><button type="button" data-q="1" aria-label="${esc(U.inc)}">+</button></div><button type="submit" class="f-btn f-add" id="f-add"></button></div>`+
  `</form>`+
  `<details class="f-acc" open><summary>${esc(U.dims)}</summary><p>${esc(p.spec)}</p></details>`+
  `<details class="f-acc"><summary>${esc(U.care)}</summary><p>${esc(D.care[p.mat])}</p></details>`+
  `<details class="f-acc"><summary>${esc(U.deliv)}</summary><p>${esc(fill(U.delivLine,{fee:azn(z.fee),days:z.days,free:azn(z.free),rfee:azn(r.fee),rdays:r.days}))}</p></details>`+
  `</div>`;
 for(const b of $$('.f-swb',pb))b.style.background=b.dataset.hex;
 syncProduct();
 pd.showModal();
}
function syncProduct(){
 const {p}=cur,st=stockOf(p,cur.c,cur.s),col=p.colors.find(c=>c.id===cur.c);
 if(cur.q>Math.max(st,1))cur.q=Math.max(1,st);
 $('#f-pprice',pb).textContent=azn(priceOf(p,cur.s)*cur.q);
 if($('#f-cname',pb))$('#f-cname',pb).textContent=col.name;
 $('#f-shown',pb).textContent=fill(U.shown,{c:p.colors[0].name});
 const s=$('#f-stock',pb);
 s.textContent=st===0?U.outLine:st<=3?fill(U.lowLine,{n:st}):fill(U.inStock,{n:st});
 s.className='f-stock'+(st===0?' is-out':st<=3?' is-low':'');
 $('#f-qv',pb).textContent=cur.q;
 $('[data-q="-1"]',pb).disabled=cur.q<=1;
 $('[data-q="1"]',pb).disabled=cur.q>=st;
 const add=$('#f-add',pb);add.disabled=st===0;add.textContent=st===0?U.soldBtn:U.add;
 // Sizes that are sold out in this colour stay selectable (so the visitor learns why) but are marked.
 for(const i of $$('input[name=s]',pb))i.closest('label').classList.toggle('is-none',stockOf(p,cur.c,i.value)===0);
 for(const i of $$('input[name=c]',pb))i.closest('label').classList.toggle('is-none',p.sizes.every(s=>stockOf(p,i.value,s.id)===0));
}
pb.addEventListener('change',e=>{if(e.target.name==='c')cur.c=e.target.value;if(e.target.name==='s')cur.s=e.target.value;syncProduct()});
pb.addEventListener('click',e=>{
 const qb=e.target.closest('[data-q]');if(qb){cur.q+=+qb.dataset.q;syncProduct();return}
 const tb=e.target.closest('[data-img]');if(tb){cur.img=+tb.dataset.img;$('#f-gmain',pb).innerHTML=D.imgs[cur.p.id].big[cur.img];for(const b of $$('[data-img]',pb))b.setAttribute('aria-pressed',b===tb);return}
 if(e.target.closest('[data-close]'))pd.close();
});
pb.addEventListener('submit',e=>{
 e.preventDefault();const {p,c,s,q:n}=cur,st=stockOf(p,c,s);if(!st)return;
 const line=cart.find(l=>l.id===p.id&&l.c===c&&l.s===s);
 if(line)line.q=Math.min(st,line.q+n);else cart.push({id:p.id,c,s,q:Math.min(st,n)});
 save();renderCount(true);pd.close();toast(fill(U.added,{name:p.name}));
});
pd.addEventListener('close',()=>{opener&&opener.focus();opener=null});
pd.addEventListener('click',e=>{if(e.target===pd)pd.close()});
grid.addEventListener('click',e=>{const b=e.target.closest('[data-open]');if(b)openProduct(b.dataset.open,b)});

// ---- toast ----
const tEl=$('#f-toast');let tTimer;
function toast(msg){
 tEl.innerHTML=`<span>${esc(msg)}</span><button type="button" class="f-tbtn">${esc(U.viewCart)}</button>`;
 tEl.hidden=false;clearTimeout(tTimer);tTimer=setTimeout(()=>{tEl.hidden=true},5200);
}
tEl.addEventListener('click',e=>{if(e.target.closest('button')){tEl.hidden=true;openCart()}});

// ---- cart drawer: cart → details → review ----
const cd=$('#f-cart'),cb=$('#f-cartbody');
let step='cart',details={name:'',phone:'',address:'',pay:'card',note:''},cartOpener=null;
function renderCount(bump){
 const n=units(),el=$('#f-count');el.textContent=n;
 if(bump){el.classList.remove('is-bump');void el.offsetWidth;el.classList.add('is-bump')}
}
const variantName=l=>{const p=P[l.id],c=p.colors.find(x=>x.id===l.c),s=p.sizes.find(x=>x.id===l.s);return [p.colors.length>1?c.name:'',p.sizes.length>1?s.label:''].filter(Boolean).join(', ')};
function totals(){
 const sub=subtotal(),f=fee(sub),z=Z[zone],left=z.fee&&z.free>sub?z.free-sub:0;
 const pct=z.fee?Math.min(100,Math.round(sub/z.free*100)):100;
 return `<div class="f-meter${left?'':' is-full'}"><p>${esc(left?fill(U.toFree,{p:azn(left)}):U.gotFree)}</p><span class="f-mbar"><i data-w="${pct}"></i></span></div>`+
  `<dl class="f-sum"><div><dt>${esc(U.subtotal)}</dt><dd>${azn(sub)}</dd></div><div><dt>${esc(U.delivery)} <small>${esc(z.name)}</small></dt><dd>${f?azn(f):esc(U.free)}</dd></div><div class="f-tot"><dt>${esc(U.total)}</dt><dd>${azn(sub+f)}</dd></div></dl>`;
}
const zoneSelect=()=>`<label class="f-sel f-zone"><span>${esc(U.area)}</span><select id="f-zone">${D.zones.map(z=>`<option value="${z.id}"${z.id===zone?' selected':''}>${esc(z.name)} (${z.fee?azn(z.fee):esc(U.free)})</option>`).join('')}</select></label>`;
function renderCart(focusSel){
 const head=`<header class="f-dh"><h2 id="f-carth" tabindex="-1">${esc(step==='cart'?U.cartH:step==='details'?U.detailsH:U.reviewH)}</h2><button type="button" class="f-x" data-close aria-label="${esc(U.close)}">×</button></header>`;
 let body='';
 if(!cart.length&&step!=='done'){step='cart'}
 if(step==='done'){
  body=`<div class="f-cempty"><p class="f-big">${esc(U.done)}</p><button type="button" class="f-btn" data-close>${esc(U.browse)}</button></div>`;
 }else if(!cart.length){
  body=`<div class="f-cempty"><p class="f-big">${esc(U.emptyH)}</p><p>${esc(U.emptyP)}</p><button type="button" class="f-btn" data-close>${esc(U.browse)}</button></div>`;
 }else if(step==='cart'){
  body=`<ul class="f-lines">${cart.map((l,i)=>{const p=P[l.id],st=stockOf(p,l.c,l.s);return `<li class="f-li"><span class="f-lph">${D.imgs[p.id].thumb[0]}</span><div class="f-lt"><p class="f-ln">${esc(p.name)}</p><p class="f-lv">${esc(variantName(l))}</p><div class="f-step f-step--s" role="group" aria-label="${esc(U.qty)}: ${esc(p.name)}"><button type="button" data-dq="-1" data-i="${i}" aria-label="${esc(U.dec)}"${l.q<=1?' disabled':''}>−</button><output>${l.q}</output><button type="button" data-dq="1" data-i="${i}" aria-label="${esc(U.inc)}"${l.q>=st?' disabled':''}>+</button></div>${l.q>=st?`<p class="f-lmax">${esc(U.maxed)}</p>`:''}</div><div class="f-lr"><p class="f-lp">${azn(priceOf(p,l.s)*l.q)}</p><button type="button" class="f-rm" data-rm="${i}" aria-label="${esc(fill(U.removeA,{name:p.name}))}">${esc(U.remove)}</button></div></li>`}).join('')}</ul>`+
   `<div class="f-cfoot">${zoneSelect()}${totals()}<button type="button" class="f-btn f-wide" data-step="details">${esc(U.checkout)}</button></div>`;
 }else if(step==='details'){
  const pick=zone==='pickup';
  body=`<form class="f-co" id="f-co" novalidate><p class="f-err" id="f-cerr" role="alert" hidden></p>`+
   `<div class="f-field"><label for="f-name">${esc(U.name)}</label><input id="f-name" name="name" autocomplete="name" required value="${esc(details.name)}" aria-describedby="f-name-e"><p class="f-fe" id="f-name-e" hidden>${esc(U.eName)}</p></div>`+
   `<div class="f-field"><label for="f-phone">${esc(U.phone)}</label><div class="f-pre"><span aria-hidden="true">+994</span><input id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel-national" required value="${esc(details.phone)}" aria-describedby="f-phone-h f-phone-e"></div><p class="f-hint" id="f-phone-h">${esc(U.phoneHint)}</p><p class="f-fe" id="f-phone-e" hidden>${esc(U.ePhone)}</p></div>`+
   zoneSelect()+
   (pick?`<p class="f-hint">${esc(U.pickup)}</p>`:`<div class="f-field"><label for="f-addr">${esc(U.address)}</label><textarea id="f-addr" name="address" rows="2" autocomplete="street-address" required aria-describedby="f-addr-h f-addr-e">${esc(details.address)}</textarea><p class="f-hint" id="f-addr-h">${esc(U.addressHint)}</p><p class="f-fe" id="f-addr-e" hidden>${esc(U.eAddress)}</p></div>`)+
   `<fieldset class="f-field f-radios"><legend>${esc(U.pay)}</legend><label><input type="radio" name="pay" value="card"${details.pay==='card'?' checked':''}> ${esc(U.payCard)}</label><label><input type="radio" name="pay" value="cash"${details.pay==='cash'?' checked':''}> ${esc(U.payCash)}</label></fieldset>`+
   `<div class="f-field"><label for="f-note">${esc(U.note)}</label><input id="f-note" name="note" value="${esc(details.note)}"></div>`+
   `<div class="f-cfoot">${totals()}<div class="f-row"><button type="button" class="f-btn f-ghost" data-step="cart">${esc(U.back)}</button><button type="submit" class="f-btn">${esc(U.review)}</button></div></div></form>`;
 }else{
  const z=Z[zone],sub=subtotal(),f=fee(sub);
  body=`<div class="f-review"><p class="f-demo">${esc(U.demo)}</p>`+
   `<ul class="f-rlines">${cart.map(l=>{const p=P[l.id];return `<li><span>${l.q} × ${esc(p.name)}${variantName(l)?` <small>${esc(variantName(l))}</small>`:''}</span><b>${azn(priceOf(p,l.s)*l.q)}</b></li>`}).join('')}</ul>`+
   `<dl class="f-sum"><div><dt>${esc(U.subtotal)}</dt><dd>${azn(sub)}</dd></div><div><dt>${esc(U.delivery)} <small>${esc(z.name)}, ${esc(z.days)}</small></dt><dd>${f?azn(f):esc(U.free)}</dd></div><div class="f-tot"><dt>${esc(U.total)}</dt><dd>${azn(sub+f)}</dd></div></dl>`+
   `<div class="f-to"><h3>${esc(U.to)}</h3><p>${esc(details.name)}<br>+994 ${esc(details.phone)}<br>${esc(zone==='pickup'?z.note:details.address)}<br>${esc(U.pay)}: ${esc(details.pay==='card'?U.payCard:U.payCash)}${details.note?`<br>${esc(details.note)}`:''}</p></div>`+
   `<div class="f-row"><button type="button" class="f-btn f-ghost" data-step="details">${esc(U.edit)}</button><button type="button" class="f-btn" data-finish>${esc(U.finish)}</button></div></div>`;
 }
 cb.innerHTML=head+`<div class="f-dbody">${body}</div>`;
 for(const i of $$('.f-mbar i',cb))i.style.width=i.dataset.w+'%';
 const f=focusSel&&$(focusSel,cb);(f||$('h2',cb)).focus();
}
function openCart(){
 cartOpener=document.activeElement;if(step==='done')step='cart';renderCart();
 if(!cd.open)cd.showModal();
 $('#f-carth',cb).focus();
}
function readDetails(){const f=$('#f-co',cb);if(!f)return;const d=new FormData(f);details={name:(d.get('name')||'').trim(),phone:(d.get('phone')||'').trim(),address:(d.get('address')??details.address).trim(),pay:d.get('pay')||'card',note:(d.get('note')||'').trim()}}
function validate(){
 const bad=[];
 const digits=details.phone.replace(/\D/g,'').replace(/^994/,'').replace(/^0/,'');
 const checks=[['f-name',details.name.split(/\s+/).filter(Boolean).length>=2||details.name.length>=3],['f-phone',/^(10|50|51|55|60|70|77|99)\d{7}$/.test(digits)],...(zone==='pickup'?[]:[['f-addr',details.address.length>=6]])];
 for(const [id,ok] of checks){const el=$('#'+id,cb),e=$(`#${id}-e`,cb);el.setAttribute('aria-invalid',!ok);e.hidden=ok;if(!ok)bad.push(el)}
 const er=$('#f-cerr',cb);er.hidden=!bad.length;er.textContent=fill(U.eSummary,{n:bad.length});
 if(bad.length){bad[0].focus();return false}
 details.phone=digits.replace(/^(\d\d)(\d{3})(\d\d)(\d\d)$/,'$1 $2 $3 $4');return true;
}
cb.addEventListener('click',e=>{
 const t=e.target;
 if(t.closest('[data-close]')){cd.close();return}
 const dq=t.closest('[data-dq]');if(dq){const l=cart[+dq.dataset.i],st=stockOf(P[l.id],l.c,l.s);l.q=Math.max(1,Math.min(st,l.q+ +dq.dataset.dq));save();renderCount();renderCart(`[data-dq="${dq.dataset.dq}"][data-i="${dq.dataset.i}"]`);return}
 const rm=t.closest('[data-rm]');if(rm){cart.splice(+rm.dataset.rm,1);save();renderCount();renderCart(cart.length?'.f-rm':'.f-btn');return}
 const st=t.closest('[data-step]');if(st){if(step==='details')readDetails();step=st.dataset.step;renderCart(step==='details'?'#f-name':null);return}
 if(t.closest('[data-finish]')){cart=[];save();renderCount();step='done';renderCart('.f-btn')}
});
cb.addEventListener('change',e=>{if(e.target.id==='f-zone'){if(step==='details')readDetails();zone=e.target.value;save();renderCart('#f-zone')}});
cb.addEventListener('submit',e=>{e.preventDefault();readDetails();if(validate()){step='review';renderCart()}});
cd.addEventListener('close',()=>{if(step==='done')step='cart';cartOpener&&cartOpener.focus();cartOpener=null});
cd.addEventListener('click',e=>{if(e.target===cd)cd.close()});
$('#f-cartbtn').addEventListener('click',openCart);
renderCount();
