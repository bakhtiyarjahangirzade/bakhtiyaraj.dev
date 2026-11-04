import {products,readConfig,calculate,configParams} from './product-data.js';
import {serviceContent,EXTRA} from './services-content.js';
import {icon} from './icons.js';
import {t,href} from './i18n.js';
const descriptions={website:'Brendiniz, məhsulunuz və ya xidmətiniz üçün mobilə uyğun təqdimat saytı.',system:'Müştəriləri, sifarişləri və gündəlik işi idarə etmək üçün xüsusi sistem.',integrated:'Təqdimat saytı və arxasında işləyən biznes sistemi. Bir-birinə bağlı.'};
// The most common priced additions per service, read from the canonical rates (labels are translated keys).
const option=(id,o)=>{const x=products[id].options.find(v=>v.id===o);return [x.label,x.price]};
const raises={
 website:[['Əlavə səhifə',EXTRA.page],['Əlavə dil',EXTRA.language],option('website','custom'),option('website','cms')],
 system:[['Əlavə modul',EXTRA.module],option('system','roles'),option('system','reports'),['Əlavə dil',EXTRA.language]],
 integrated:[['Əlavə səhifə',EXTRA.page],['Əlavə modul',EXTRA.module],['Əlavə dil',EXTRA.language],option('integrated','payment')]
};
const primary=Object.values(products).filter(o=>!o.secondary);
const productHref=id=>`${href('/product.html')}?service=${id}`;

const heroOffers=document.querySelector('#hero-offers');
if(heroOffers)heroOffers.innerHTML=primary.map(o=>`<li><a href="${productHref(o.id)}"><span>${t(o.title)}</span><strong>${t('{n} AZN-dən',{n:o.price})}</strong>${icon.arrow}</a></li>`).join('');

const grid=document.querySelector('#offer-grid');
grid.innerHTML=primary.map(o=>`<article class="offer-card${o.id==='system'?' featured':''}"><div class="offer-heading"><h3>${t(o.title)}</h3>${o.id==='system'?`<span class="offer-card-tag">${t('Biznes üçün')}</span>`:''}</div><div class="offer-quote"><span>${o.price}<span class="price-currency">₼</span></span><small>${t('birdəfəlik, başlayan qiymət')}</small></div><p class="offer-description">${t(descriptions[o.id])}</p><p class="offer-fit"><span>${t('Kimə uyğundur')}</span>${t(serviceContent[o.id].audience[0])}</p><h4 class="offer-subhead">${t('Başlanğıc paketinə daxildir')}</h4><ul class="offer-included">${o.included.map(f=>`<li>${icon.check}<span>${t(f)}</span></li>`).join('')}</ul><h4 class="offer-subhead">${t('Qiyməti artıran seçimlər')}</h4><ul class="offer-raises">${raises[o.id].map(([label,price])=>`<li><span>${t(label)}</span><b>+${price} AZN</b></li>`).join('')}</ul><a class="offer-cta" href="${productHref(o.id)}" aria-label="${t('{title} məhsuluna bax',{title:t(o.title)})}">${t('Seçin və hesablayın')} ${icon.arrow}</a><a class="offer-more" href="${href('/services/'+o.id+'.html')}">${t('Ətraflı məlumat')}<span class="sr-only">: ${t(o.title)}</span></a></article>`).join('');
document.querySelector('#secondary-service-list').innerHTML=Object.values(products).filter(o=>o.secondary).map(o=>`<div class="secondary-service"><div><h3><a href="${href('/services/'+o.id+'.html')}">${t(o.title)}</a></h3><p>${t(o.id==='video'?'Bir videonun sadə montajı':'Çap məhsulları üçün dizayn')}</p></div><span>${t('{n} AZN-dən',{n:o.price})}</span><a href="${productHref(o.id)}" aria-label="${t('{title} məhsuluna bax',{title:t(o.title)})}">${t('Fərdiləşdir')} ${icon.arrow}</a></div>`).join('');

// Worked example, computed by the same calculate() the configurator uses.
const example=document.querySelector('#estimate-example');
if(example){
 const c=readConfig(new URLSearchParams('service=website&design=olio&pages=3&languages=az,en&options=form')),calc=calculate(c);
 example.innerHTML=`<figcaption>${t('Nümunə hesablama')}</figcaption><p class="example-title">${t('Restoran saytı: 3 səhifə, ingilis dili, müraciət forması')}</p><div class="example-lines"><div><span>${t('{title} — başlanğıc',{title:t(products.website.title)})}</span><span>${calc.base} AZN</span></div>${calc.items.map(i=>`<div><span>${i.label}</span><span>+${i.price} AZN</span></div>`).join('')}<div class="example-total"><span>${t('Hesablanan qiymət')}</span><strong>${calc.total} AZN</strong></div></div><a class="button primary" href="${href('/product.html')}?${configParams(c)}">${t('Bu nümunəni konfiquratorda açın')} ${icon.arrow}</a><p class="example-note">${t('Yekun iş həcmi və təklif müzakirədə təsdiqlənəcək.')}</p>`;
}

const navItems=[...document.querySelectorAll('.floating-nav [data-section]')];const observer=new IntersectionObserver(entries=>{for(const e of entries){if(!e.isIntersecting)continue;navItems.forEach(a=>{const active=a.dataset.section===e.target.id;if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})}},{rootMargin:'-15% 0px -55% 0px',threshold:0});navItems.forEach(a=>{const section=document.getElementById(a.dataset.section);if(section)observer.observe(section)});
const hero=document.querySelector('.intro-section'),foilStickers=[...hero.querySelectorAll('.sticker')],motionPreference=matchMedia('(prefers-reduced-motion: reduce)');let heroVisible=false,foilFrame=0,foilPoint=null;
function syncFoil(){hero.classList.toggle('foil-visible',heroVisible&&!document.hidden&&!motionPreference.matches)}
new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;syncFoil()},{threshold:.05}).observe(hero);document.addEventListener('visibilitychange',syncFoil);motionPreference.addEventListener('change',()=>{resetFoil();syncFoil()});
function resetFoil(){cancelAnimationFrame(foilFrame);foilFrame=0;foilPoint=null;foilStickers.forEach(s=>{s.style.removeProperty('--foil-angle');s.style.removeProperty('--glare-x');s.style.removeProperty('--glare-y')})}
hero.addEventListener('pointermove',e=>{if(motionPreference.matches||e.pointerType!=='mouse')return;foilPoint={x:e.clientX,y:e.clientY};if(foilFrame)return;foilFrame=requestAnimationFrame(()=>{foilFrame=0;if(!foilPoint)return;const hr=hero.getBoundingClientRect(),angle=85+Math.max(0,Math.min(1,(foilPoint.x-hr.left)/hr.width))*70;foilStickers.forEach(s=>{const r=s.getBoundingClientRect();s.style.setProperty('--foil-angle',`${angle.toFixed(1)}deg`);s.style.setProperty('--glare-x',`${Math.max(0,Math.min(100,(foilPoint.x-r.left)/r.width*100)).toFixed(1)}%`);s.style.setProperty('--glare-y',`${Math.max(0,Math.min(100,(foilPoint.y-r.top)/r.height*100)).toFixed(1)}%`)})})},{passive:true});hero.addEventListener('pointerleave',resetFoil);

import './process-motion.js';
