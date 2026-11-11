import '../fonts.css';
import './style.css';
import {PRINT_PRODUCTS,BY_ID,text,money,normalizeLine,normalizeCart,calculateLine,cartTotal,addLine,filterProducts} from './model.js';
import {tr} from './copy.js';
import {esc,bagIcon,productCard,configFields,bill} from './render.js';

const lang=['az','ru','en'].includes(document.documentElement.lang)?document.documentElement.lang:'az';
const T=(k,v)=>tr(lang,k,v),$=s=>document.querySelector(s),KEY='bakhy.print.bag.v1';
const shop=$('#ps-shop'),cart=$('#ps-cart'),dialog=$('#ps-dialog'),main=$('#print-main');
let lines=[],persisted=true,category='all',query='',lastTrigger=null,dialogConfig=null,undo=null,toastTimer=0;
const privateNotes=new Map();let customer='',brief='';
try{lines=normalizeCart(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{persisted=false;}
function persist(){try{localStorage.setItem(KEY,JSON.stringify({version:1,lines}));}catch{persisted=false;}header();}
function header(){const n=lines.reduce((s,c)=>s+c.quantity,0);$('#ps-count').textContent=n;$('#ps-mobile-count').textContent=n;$('#ps-mobile-total').textContent=money(cartTotal(lines),lang);document.body.classList.toggle('ps-has-items',!!lines.length);}
function toast(message,canUndo=false){clearTimeout(toastTimer);const el=$('#ps-toast');el.replaceChildren(document.createTextNode(message));if(canUndo){const b=document.createElement('button');b.type='button';b.textContent=T('undo');b.onclick=()=>{if(!undo)return;if(lines.length>=60){toast(T('limit'));return;}lines.splice(Math.min(undo.index,lines.length),0,undo.line);undo=null;persist();renderCart();el.hidden=true;};el.append(b);}el.hidden=false;toastTimer=setTimeout(()=>{el.hidden=true;},canUndo?10000:4200);}
function show(view,{push=false}={}){
 if(push)history.pushState({},'',location.pathname+(view==='cart'?'?view=cart':''));
 const isCart=view==='cart';shop.hidden=isCart;cart.hidden=!isCart;document.body.classList.toggle('ps-checkout',isCart);
 $('[data-view="shop"]').setAttribute('aria-current',isCart?'false':'page');
 if(isCart)renderCart();document.title=`${T(isCart?'checkout':'shop')} — BAKHY`;
 document.querySelectorAll('.ps-languages a').forEach(a=>{a.href=`/${a.lang}/services/print.html${isCart?'?view=cart':''}`;});
 if(push){scrollTo(0,0);main.focus({preventScroll:true});}header();
}
document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const u=new URL(a.href,location.href);if(u.origin!==location.origin||u.pathname!==location.pathname||a.closest('.ps-languages'))return;if(u.search===''||u.search==='?view=cart'){e.preventDefault();show(u.search?'cart':'shop',{push:true});}});
addEventListener('popstate',()=>{if(dialog.open)dialog.close();show(new URLSearchParams(location.search).get('view')==='cart'?'cart':'shop');});
addEventListener('storage',e=>{if(e.key!==KEY)return;try{lines=normalizeCart(JSON.parse(e.newValue||'null'));header();if(!cart.hidden)renderCart();}catch{/* Invalid external storage does not overwrite the open bag. */}});

function filter(){const found=filterProducts(query,category);$('#ps-grid').innerHTML=found.map(p=>productCard(p,lang)).join('');$('#ps-results').textContent=T('found',{n:found.length});$('#ps-empty').hidden=!!found.length;}
$('#ps-search').addEventListener('input',e=>{query=e.target.value;filter();});
$('.ps-filters').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;category=b.dataset.category;$('.ps-filters').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));filter();});
$('#ps-reset').onclick=()=>{query='';category='all';$('#ps-search').value='';$('.ps-filters').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category==='all')));filter();$('#ps-search').focus();};
shop.addEventListener('click',e=>{
 const d=e.target.closest('[data-detail]');if(d){openProduct(d.dataset.detail,d);return;}
 const b=e.target.closest('[data-add]');if(!b)return;
 const c=normalizeLine({product:b.dataset.add,tier:shop.querySelector(`[data-card-tier="${b.dataset.add}"]`).value});
 add(c,b);
});
function add(c,trigger){try{lines=addLine(lines,c,crypto.randomUUID());persist();toast(T('added',{name:text(BY_ID.get(c.product).name,lang)}));if(trigger){trigger.classList.add('ps-added');setTimeout(()=>trigger.classList.remove('ps-added'),600);}return true;}catch{toast(T('limit'));return false;}}

function validate(form){let ok=true;for(const input of form.querySelectorAll('input[type="number"]')){const valid=input.checkValidity();input.setAttribute('aria-invalid',String(!valid));const error=input.closest('.ps-field').querySelector('.ps-error');if(error)error.textContent=valid?'':T('invalid');ok=ok&&valid;}return ok;}
function formConfig(form,base){return normalizeLine({...base,...Object.fromEntries(new FormData(form))});}
function openProduct(id,trigger){const p=BY_ID.get(id);if(!p)return;lastTrigger=trigger;dialogConfig=normalizeLine({product:id,tier:shop.querySelector(`[data-card-tier="${id}"]`)?.value});
 dialog.innerHTML=`<button class="ps-close" type="button" aria-label="${esc(T('close'))}">×</button><div class="ps-detail-art"><img src="${p.image}" alt="${esc(text(p.name,lang))}" width="1200" height="900"></div><div class="ps-detail-body"><p class="ps-eyebrow">BAKHY / ${esc(T('shop'))}</p><h2 id="ps-dialog-title">${esc(text(p.name,lang))}</h2><p>${esc(text(p.scope,lang))}</p><p class="ps-detail-included">${esc(T('included'))}<br>${esc(T('files'))}</p><div class="ps-tier-scope"><strong>${esc(T('standard'))}</strong><p>${esc(T('standardScope'))}</p><strong>${esc(T('premium'))}</strong><p>${esc(T('premiumScope'))}</p></div><form id="ps-detail-form" novalidate><div class="ps-fields">${configFields(p,dialogConfig,lang)}</div>${p.personal?`<p class="ps-help">${esc(T('peopleHelp'))}<br>${esc(T('peopleExample'))}</p>`:''}<div class="ps-bill" id="ps-detail-bill" role="status" aria-live="polite">${bill(dialogConfig,lang)}</div><button class="ps-button ps-solid" type="submit">${esc(T('add'))}${bagIcon}</button></form><p class="ps-help">${esc(T('designOnly'))}<br>${esc(T('scopeNote'))}</p></div>`;
 dialog.querySelector('.ps-close').onclick=()=>dialog.close();
 const form=$('#ps-detail-form');form.oninput=form.onchange=()=>{if(!validate(form))return;dialogConfig=formConfig(form,dialogConfig);$('#ps-detail-bill').innerHTML=bill(dialogConfig,lang);};
 form.onsubmit=e=>{e.preventDefault();if(!validate(form)){form.querySelector('[aria-invalid="true"]')?.focus();return;}dialogConfig=formConfig(form,dialogConfig);if(add(dialogConfig,trigger))dialog.close();};
 dialog.showModal();
}
dialog.addEventListener('close',()=>lastTrigger?.isConnected&&lastTrigger.focus({preventScroll:true}));
dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});

function renderCart(){
 if(!lines.length){cart.innerHTML=`<div class="ps-cart-top"><p class="ps-eyebrow">BAKHY / ${esc(T('checkout'))}</p><h1>${esc(T('empty'))}</h1><p>${esc(T('emptyHelp'))}</p><a class="ps-button ps-solid" href="${location.pathname}">${esc(T('browse'))} ↗</a></div>`;return;}
 cart.innerHTML=`<div class="ps-cart-top"><a href="${location.pathname}">← ${esc(T('browse'))}</a><h1>${esc(T('checkout'))}<span> / ${lines.length}</span></h1><p>${esc(T('designOnly'))}</p></div><div class="ps-checkout-grid"><div class="ps-cart-items">${lines.map(lineView).join('')}</div><aside class="ps-summary"><h2>${esc(T('summary'))}</h2><div id="ps-summary-lines"></div><div class="ps-grand"><span>${esc(T('total'))}</span><strong id="ps-grand-total" role="status" aria-live="polite"></strong></div><p class="ps-help">${esc(T('estimate'))}</p><form id="ps-contact-form" novalidate><label class="ps-field"><span>${esc(T('customer'))}</span><input id="ps-customer" type="text" maxlength="120" value="${esc(customer)}" autocomplete="name"></label><label class="ps-field"><span>${esc(T('brief'))}</span><textarea id="ps-brief" rows="3" maxlength="1500" placeholder="${esc(T('briefHint'))}">${esc(brief)}</textarea></label></form><p id="ps-checkout-error" class="ps-error" role="alert"></p><a class="ps-button ps-solid" id="ps-send" target="_blank" rel="noopener">${esc(T('send'))} ↗</a><p class="ps-help">${esc(T('sendHelp'))}</p><p id="ps-long" class="ps-help" hidden>${esc(T('longDraft'))}</p><button id="ps-copy" class="ps-copy" type="button">${esc(T('copy'))}</button><details class="ps-message"><summary>${esc(T('draft'))}</summary><textarea id="ps-draft" rows="8" readonly aria-label="${esc(T('draft'))}"></textarea></details><p class="ps-help">${esc(T('privacy'))}</p><p class="ps-help">${esc(T(persisted?'saved':'storageError'))}</p></aside></div>`;
 cart.querySelectorAll('.ps-line-form').forEach(f=>{f.onsubmit=e=>e.preventDefault();f.oninput=f.onchange=()=>{const valid=validate(f);if(valid){const i=lines.findIndex(c=>c.key===f.dataset.key);lines[i]=formConfig(f,lines[i]);f.closest('.ps-cart-item').querySelector('.ps-line-bill').innerHTML=bill(lines[i],lang);persist();}summary();};});
 cart.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{const index=lines.findIndex(c=>c.key===b.dataset.remove);undo={line:lines[index],index};lines=lines.filter(c=>c.key!==b.dataset.remove);persist();renderCart();toast(T('removed'),true);cart.querySelector('h1')?.setAttribute('tabindex','-1');cart.querySelector('h1')?.focus({preventScroll:true});});
 cart.querySelectorAll('[data-person-notes]').forEach(el=>el.oninput=()=>{privateNotes.set(el.dataset.personNotes,el.value);summary();});
 $('#ps-contact-form').onsubmit=e=>e.preventDefault();$('#ps-customer').oninput=e=>{customer=e.target.value;summary();};$('#ps-brief').oninput=e=>{brief=e.target.value;summary();};
 $('#ps-copy').onclick=async()=>{try{await navigator.clipboard.writeText(orderText());toast(T('copied'));}catch{const d=$('#ps-draft');d.closest('details').open=true;d.focus();d.select();toast(T('copyFail'));}};
 summary();
}
function lineView(c){const p=BY_ID.get(c.product);return `<article class="ps-cart-item"><div class="ps-line-head"><img src="${p.image}" alt="" width="180" height="135"><div><h2>${esc(text(p.name,lang))}</h2><p>${esc(T('included'))}</p><p>${esc(T('files'))}</p></div><button class="ps-remove" type="button" data-remove="${c.key}" aria-label="${esc(text(p.name,lang))}: ${esc(T('remove'))}">×</button></div><form class="ps-line-form" data-key="${c.key}" novalidate aria-label="${esc(text(p.name,lang))}"><div class="ps-fields">${configFields(p,c,lang)}</div></form>${p.personal?`<p class="ps-help">${esc(T('peopleHelp'))}</p><label class="ps-field ps-person-notes"><span>${esc(T('personsNotes'))}</span><textarea rows="2" maxlength="600" data-person-notes="${c.key}" placeholder="${esc(T('notesHint'))}">${esc(privateNotes.get(c.key)||'')}</textarea></label>`:''}<div class="ps-bill ps-line-bill">${bill(c,lang)}</div></article>`;}
function summary(){if(!lines.length||!$('#ps-grand-total'))return;$('#ps-summary-lines').innerHTML=lines.map(c=>`<div class="ps-summary-row"><span>${esc(text(BY_ID.get(c.product).name,lang))}<small>${esc(T(c.tier))} · ${esc(T('countLine',{n:c.quantity}))}${c.people>1?' · '+esc(T('personLine',{n:c.people})):''}</small></span><span>${esc(money(calculateLine(c).total,lang))}</span></div>`).join('');$('#ps-grand-total').textContent=money(cartTotal(lines),lang);const draft=orderText(),long=draft.length>7000,invalid=!!cart.querySelector('[aria-invalid="true"]');$('#ps-checkout-error').textContent=invalid?T('fixFields'):'';$('#ps-send').setAttribute('aria-disabled',String(invalid));if(invalid)$('#ps-send').removeAttribute('href');else $('#ps-send').href=long?'https://wa.me/48571572697':`https://wa.me/48571572697?text=${encodeURIComponent(draft)}`;$('#ps-draft').value=draft;$('#ps-long').hidden=!long;}
function orderText(){const body=[T('greet'),''];if(customer.trim())body.push(`${T('customer')}: ${customer.trim()}`);for(const [i,c] of lines.entries()){const p=BY_ID.get(c.product),a=calculateLine(c);body.push(`${i+1}. ${text(p.name,lang)} — ${T(c.tier)}`,`${T('countLine',{n:c.quantity})}; ${T('unitRate')}: ${money(a.rate,lang)}${p.unit==='page'?T('perPage'):p.unit==='area'?T('perArea'):''}`);if(p.unit==='page')body.push(T('pageLine',{n:c.units}));if(p.unit==='area')body.push(`${c.width} × ${c.height} m = ${a.units} m²`);if(p.personal)body.push(T('personLine',{n:c.people}));if(a.personal)body.push(`${T('personalExtra',{n:a.extraPeople})}: +${money(a.personal,lang)}`);if(privateNotes.get(c.key)?.trim())body.push(privateNotes.get(c.key).trim());body.push(`${T('total')}: ${money(a.total,lang)}`,'');}body.push(`${T('total')}: ${money(cartTotal(lines),lang)}`,T('included'),T('files'),T('designOnly'));if(brief.trim())body.push('',brief.trim());return body.join('\n');}
header();show(new URLSearchParams(location.search).get('view')==='cart'?'cart':'shop');
const deep=BY_ID.get(new URLSearchParams(location.search).get('product'));if(deep)openProduct(deep.id,$(`[data-detail="${deep.id}"]`));
