import {t} from './i18n.js';
import {products} from './product-data.js';
import {serviceOf} from './projects.js';
export function showcaseCard(p,i=9){
 const kind=t(p.real?'Real layihə':p.vitrine?'Vitrin konsepti':p.type==='system'?'Sistem demosu':'Sayt konsepti');
 const domain=p.url?new URL(p.url).hostname:t(p.type==='system'?'İdarəetmə paneli':'Sizin brendiniz üçün');
 const visual=p.image?`<img src="${p.image}" alt="${t(p.preview?'{name} konsept önizləməsi':'{name} saytının görüntüsü',{name:p.name})}" loading="${i<2?'eager':'lazy'}"${i<2?' fetchpriority="high"':''} decoding="async" width="1280" height="800">`:'';
 const price=t('{n} AZN-dən',{n:products[serviceOf(p)].price});
 return `<article class="showcase-item"><button class="showcase-card mood-${p.id} mode-browser${p.real?' is-real':''}" data-project="${p.id}" aria-label="${t('{name} — layihəyə bax',{name:p.name})}"><span class="showcase-stage"><span class="preview-label">${kind}<span aria-hidden="true">↗</span></span><span class="stage-orbit" aria-hidden="true"></span><span class="device"><span class="browser-bar" aria-hidden="true"><i></i><i></i><i></i><span>${domain}</span><b>↗</b></span><span class="device-screen">${visual}</span><span class="monitor-chin" aria-hidden="true"></span></span><span class="device-stand" aria-hidden="true"></span><span class="stage-caption" aria-hidden="true">${domain}</span></span><span class="showcase-caption"><span class="showcase-name">${p.name}<small>${t(p.category)}</small></span><span class="showcase-tags"><span>${p.real?domain:price}</span></span><span class="showcase-open" aria-hidden="true">↗</span></span></button></article>`;
}
export function observeShowcases(root){
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const observer=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('in-view',e.isIntersecting&&!motion.matches)),{threshold:.15});
 root.querySelectorAll('.showcase-card').forEach(el=>observer.observe(el));
 return observer;
}

document.addEventListener('visibilitychange',()=>document.documentElement.classList.toggle('previews-paused',document.hidden));
