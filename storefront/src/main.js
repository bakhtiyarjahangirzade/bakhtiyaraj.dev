import './style.css';
import './theme.css';
import './landing.css';
import './studio-polish.css';
import {projects} from './projects.js';
import {showcaseCard,observeShowcases} from './showcase.js';
import {t,href,locale} from './i18n.js';
const $=s=>document.querySelector(s),grid=$('#project-grid');
let filter='all',query='',observer,lastTrigger;
const featured=grid.dataset.view==='featured';
function render(){
 observer?.disconnect();
 const items=featured?['savor','isoclub','promox','casa'].map(id=>projects.find(p=>p.id===id)):projects.filter(p=>(filter==='all'||p.type===filter)&&`${p.name} ${t(p.category)} ${t(p.desc)}`.toLocaleLowerCase(locale).includes(query));
 if($('#result-count'))$('#result-count').textContent=t('{n} layihə',{n:items.length});
 if($('#empty'))$('#empty').hidden=!!items.length;
 grid.innerHTML=items.map(showcaseCard).join('');observer=observeShowcases(grid);
}
render();
function openProject(id){
 const p=projects.find(p=>p.id===id);if(!p)return;lastTrigger=document.activeElement;
 const kind=t(p.id==='velvet'?'VİTRİN KONSEPTİ':p.type==='portfolio'?'PORTFOLIO':'FƏRDİLƏŞDİRİLƏ BİLƏN KONSEPT');
 const image=p.image?`<img class="dialog-art" src="${p.image}" alt="${t('{name} layihəsinin önizləməsi',{name:p.name})}">`:`<div class="dialog-velvet"><span>velvet.</span><small>${t('Vitrin konsepti')}</small></div>`;
 $('#dialog-content').innerHTML=`${image}<div class="dialog-body"><p class="eyebrow">${kind}</p><h2 id="dialog-title">${p.name}</h2><p>${t(p.desc)}</p><div class="detail-tags">${p.tags.map(tag=>`<span>${t(tag)}</span>`).join('')}</div><div class="dialog-actions"><a class="button primary" href="${href('/product.html')}?service=${p.type==='system'?'system':'website'}&reference=${p.id}${p.type==='website'?'&design='+p.id:''}">${t(p.type==='portfolio'?'Bu istiqamətdə fərdiləşdir':'Konsepti fərdiləşdir')} <span>↗</span></a>${p.url?`<a href="${p.url}" target="_blank" rel="noopener">${t('Canlı domenə bax')} ↗</a>`:''}</div></div>`;
 $('#project-dialog').showModal();
}
function closeDialog(){$('#project-dialog').close();lastTrigger?.focus({preventScroll:true})}
grid.addEventListener('click',e=>{const b=e.target.closest('[data-project]');if(b)openProject(b.dataset.project)});
$('.close-dialog').addEventListener('click',closeDialog);
$('#project-dialog').addEventListener('close',()=>lastTrigger?.focus({preventScroll:true}));
$('#project-dialog').addEventListener('click',e=>{if(e.target!==e.currentTarget)return;const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog()});
$('.filters')?.addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));render()});
$('#search')?.addEventListener('input',e=>{query=e.target.value.trim().toLocaleLowerCase('az');render()});
