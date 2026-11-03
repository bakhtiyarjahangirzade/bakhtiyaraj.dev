import './style.css';
import './theme.css';
import './landing.css';
import './studio-polish.css';
import './business.css';
import {projects,groupOf,serviceOf} from './projects.js';
import {products} from './product-data.js';
import {cases} from './cases.js';
import {showcaseCard,observeShowcases} from './showcase.js';
import {icon} from './icons.js';
import {t,href,locale} from './i18n.js';
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const groupTitle={real:'Real layihələr',website:'Sayt konseptləri',system:'Sistem demoları'};
const kindLabel=p=>t(p.real?'Real layihə':p.vitrine?'Vitrin konsepti':p.type==='system'?'Sistem demosu':'Sayt konsepti');
// Configurator link that carries the project as reference (and as design when it is a website concept).
export const configureHref=p=>{const service=serviceOf(p),q=new URLSearchParams({service,reference:p.id});if(service==='website'&&!p.real&&!p.vitrine)q.set('design',p.id);return `${href('/product.html')}?${q}`};
const srcset=s=>s.widths.map(w=>`${s.base}-${w}.jpg ${w}w`).join(', ');
const img=(s,sizes,eager)=>`<img src="${s.base}-${s.widths.at(-1)}.jpg" srcset="${srcset(s)}" sizes="${sizes}" alt="${esc(t(s.alt))}" width="${s.widths.at(-1)}" height="${s.widths.at(-1)*10/16}" ${eager?'fetchpriority="high"':'loading="lazy"'} decoding="async">`;

// ---- case study markup, shared by the homepage list and the catalogue dialog ----
function caseFacts(p,c,headingTag){
 const h=headingTag;
 return `<div class="case-facts"><${h}>${t('Kontekst')}</${h}><p>${t(c.context)}</p><${h}>${t('Görülən iş')}</${h}><ul class="case-scope">${c.scope.map(s=>`<li>${icon.check}<span>${t(s)}</span></li>`).join('')}</ul><${h}>${t('Dizayn qərarları')}</${h}><ul class="case-decisions">${c.decisions.map(s=>`<li>${t(s)}</li>`).join('')}</ul><p class="case-role"><span>${t('Mənim rolum')}</span> ${t('Dizayn və proqramlaşdırma')}</p></div>`;
}
function caseActions(p){
 return `<div class="case-actions"><a class="button primary" href="${configureHref(p)}">${t('Bu istiqamətdə layihə')} ${icon.arrow}</a><a class="case-link" href="${p.url}" target="_blank" rel="noopener">${t('Saytı aç')}: ${cases[p.id].domain} ${icon.external}</a></div>`;
}
function caseMedia(p,c,first){
 const main=c.shots[0];
 const thumbs=c.shots.length>1?`<div class="case-thumbs" role="group" aria-label="${esc(t('{name} layihəsinin önizləməsi',{name:p.name}))}">${c.shots.map((s,i)=>`<button type="button" data-shot="${i}" aria-pressed="${i===0}" aria-label="${esc(t('Ekran görüntüsünü göstər: {name}',{name:t(s.caption)}))}"><img src="${s.base}-${s.widths[0]}.jpg" alt="" width="${s.widths[0]}" height="${s.widths[0]*10/16}" loading="lazy" decoding="async"><span>${t(s.caption)}</span></button>`).join('')}</div>`:'';
 const phone=c.mobile?`<figure class="case-phone"><img src="${c.mobile}" alt="${esc(t('Mobil görünüş')+': '+p.name)}" width="480" height="960" loading="lazy" decoding="async"></figure>`:'';
 return `<div class="case-media"><div class="case-stage"><figure class="case-browser"><span class="case-bar" aria-hidden="true"><i></i><i></i><i></i><span>${c.domain}</span></span><span class="case-screen" data-screen>${img(main,'(min-width: 1000px) 58vw, 92vw',first)}</span></figure>${phone}</div>${thumbs}</div>`;
}
function bindThumbs(root,p){
 const c=cases[p.id];
 root.querySelectorAll('[data-shot]').forEach(b=>b.addEventListener('click',()=>{
  const s=c.shots[Number(b.dataset.shot)],screen=root.querySelector('[data-screen]');
  screen.innerHTML=img(s,'(min-width: 1000px) 58vw, 92vw',true);
  root.querySelectorAll('[data-shot]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 }));
}

// ---- homepage ----
const caseList=$('#case-list');
if(caseList){
 const real=projects.filter(p=>p.real);
 caseList.innerHTML=real.map((p,i)=>{const c=cases[p.id];return `<article class="case" id="case-${p.id}" aria-labelledby="case-title-${p.id}">${caseMedia(p,c,i===0)}<div class="case-copy"><p class="case-kind">${t('Real layihə')}<span>${t(p.category)}</span></p><h3 id="case-title-${p.id}">${p.name}</h3>${caseFacts(p,c,'h4')}${caseActions(p)}</div></article>`}).join('');
 real.forEach(p=>bindThumbs($('#case-'+p.id),p));
 // Concept index: one representative per sector, website concepts first, then system demos.
 const picks=['olio','aurea','forma','clinic','gym','estate','flow','reserve','stock'].map(id=>projects.find(p=>p.id===id));
 $('#concept-rows').innerHTML=picks.map(p=>`<li><img src="${p.image}" alt="" width="1280" height="800" loading="lazy" decoding="async"><span class="concept-sector">${t(p.category)}</span><span class="concept-name">${p.name}<small>${kindLabel(p)}</small></span><span class="concept-price">${t('{n} AZN-dən',{n:products[serviceOf(p)].price})}</span><span class="concept-links"><a href="${href('/concepts/'+p.id+'.html')}">${t('Konsept saytını aç')}<span class="sr-only"> ${p.name}</span> ${icon.external}</a><a href="${configureHref(p)}">${t('Qiyməti hesabla')}<span class="sr-only"> ${p.name}</span> ${icon.arrow}</a></span></li>`).join('');
 const total=projects.filter(p=>!p.real).length;
 $('#all-concepts').firstChild.textContent=t('Bütün {n} konsept kataloqda',{n:total})+' ';
}

// ---- catalogue ----
const grid=$('#project-grid');
let filter='all',query='',observer,lastTrigger;
const filterIds=['all','real','website','system'];
function render(){
 if(!grid)return;
 observer?.disconnect();
 const match=p=>`${p.name} ${t(p.category)} ${t(p.desc)} ${kindLabel(p)}`.toLocaleLowerCase(locale).includes(query);
 const items=projects.filter(p=>(filter==='all'||groupOf(p)===filter)&&match(p));
 $('#result-count').textContent=t('{n} layihə',{n:items.length});
 $('#empty').hidden=!!items.length;
 const groups=['real','website','system'].map(g=>[g,items.filter(p=>groupOf(p)===g)]).filter(([,list])=>list.length);
 grid.innerHTML=groups.map(([g,list])=>`<section class="catalogue-group" aria-labelledby="group-${g}"><h2 id="group-${g}">${t(groupTitle[g])} <sup>${list.length}</sup></h2><div class="showcase-grid">${list.map(showcaseCard).join('')}</div></section>`).join('');
 observer=observeShowcases(grid);
}
if(grid){
 const counts={all:projects.length};for(const p of projects)counts[groupOf(p)]=(counts[groupOf(p)]||0)+1;
 document.querySelectorAll('[data-filter]').forEach(b=>{const n=b.querySelector('sup');if(n)n.textContent=counts[b.dataset.filter]||0});
 const initial=new URLSearchParams(location.search).get('filter');
 if(filterIds.includes(initial))filter=initial;
 const syncFilter=()=>document.querySelectorAll('[data-filter]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.filter===filter)));
 syncFilter();render();
 $('.filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;filter=b.dataset.filter;syncFilter();const q=new URLSearchParams(location.search);if(filter==='all')q.delete('filter');else q.set('filter',filter);history.replaceState(null,'',location.pathname+(q.size?'?'+q:''));render()});
 $('#search').addEventListener('input',e=>{query=e.target.value.trim().toLocaleLowerCase(locale);render()});
}

// ---- project dialog (catalogue cards) ----
function openProject(id){
 const p=projects.find(p=>p.id===id);if(!p)return;lastTrigger=document.activeElement;
 const c=cases[p.id],service=products[serviceOf(p)];
 let body;
 if(c){
  body=`${caseMedia(p,c,true)}<div class="dialog-body"><p class="eyebrow">${kindLabel(p)}</p><h2 id="dialog-title">${p.name}</h2>${caseFacts(p,c,'h3')}${caseActions(p)}</div>`;
 }else{
  const visual=p.vitrine?`<div class="dialog-velvet"><span>velvet.</span><small>${t('Vitrin konsepti')}</small></div>`:`<img class="dialog-art" src="${p.image}" alt="${esc(t('{name} konsept önizləməsi',{name:p.name}))}" width="1280" height="800">`;
  body=`${visual}<div class="dialog-body"><p class="eyebrow">${kindLabel(p)}</p><h2 id="dialog-title">${p.name}</h2><p class="dialog-sector">${t(p.category)}</p><p>${t(p.desc)}</p><div class="detail-tags">${p.tags.map(tag=>`<span>${t(tag)}</span>`).join('')}</div><p class="dialog-note">${t('Konseptdəki adlar və məlumatlar nümunədir. Sayt sizin brendiniz və məzmununuzla hazırlanır.')}</p><p class="dialog-price"><span>${t(service.title)}</span><strong>${t('{n} AZN-dən',{n:service.price})}</strong></p><div class="dialog-actions"><a class="button primary" href="${configureHref(p)}">${t(p.vitrine?'Bu istiqamətdə qiyməti hesabla':'Bu konseptlə qiyməti hesabla')} ${icon.arrow}</a>${p.vitrine?'':`<a href="${href('/concepts/'+p.id+'.html')}">${t('Konsept saytını aç')} ${icon.external}</a>`}</div></div>`;
 }
 $('#dialog-content').innerHTML=body;
 if(c)bindThumbs($('#dialog-content'),p);
 $('#project-dialog').showModal();
 $('#project-dialog .close-dialog').focus();
}
const dialog=$('#project-dialog');
function closeDialog(){dialog.close()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-project]');if(b)openProject(b.dataset.project)});
dialog.querySelector('.close-dialog').addEventListener('click',closeDialog);
dialog.addEventListener('close',()=>lastTrigger?.focus({preventScroll:true}));
dialog.addEventListener('click',e=>{if(e.target!==e.currentTarget)return;const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog()});
