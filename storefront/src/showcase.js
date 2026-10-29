export function showcaseCard(p,i=9){
 const mode={savor:'monitor',isoclub:'float',promox:'browser',casa:'monitor',aurea:'browser',flow:'float',reserve:'browser'}[p.id]||'float';
 const kind=p.id==='velvet'?'Vitrin konsepti':p.type==='portfolio'?'Portfolio':p.type==='system'?'Sistem konsepti':'Sayt konsepti';
 const domain=p.url?new URL(p.url).hostname:p.type==='system'?'İdarəetmə paneli':'Sizin brendiniz üçün';
 const visual=p.image?`<img src="${p.image}" alt="${p.name} ${p.type==='portfolio'?'saytının görüntüsü':'konsept önizləməsi'}" loading="${i<2?'eager':'lazy'}"${i<2?' fetchpriority="high"':''} decoding="async" width="1280" height="800">`:`<div class="velvet-concept"><b>velvet.</b><span>A quieter kind<br>of luxury.</span><small>VİTRİN KONSEPTİ</small></div>`;
 return `<article class="showcase-item"><button class="showcase-card mood-${p.id} mode-${mode}" data-project="${p.id}" aria-label="${p.name} — layihəyə bax"><span class="showcase-stage"><span class="preview-label">${kind}<span aria-hidden="true">↗</span></span><span class="stage-orbit" aria-hidden="true"></span><span class="device"><span class="browser-bar" aria-hidden="true"><i></i><i></i><i></i><span>${domain}</span><b>↗</b></span><span class="device-screen">${visual}</span><span class="monitor-chin" aria-hidden="true"></span></span><span class="device-stand" aria-hidden="true"></span><span class="stage-caption" aria-hidden="true">${domain}</span></span><span class="showcase-caption"><span class="showcase-name">${p.name}<small>${p.category}</small></span><span class="showcase-tags"><span>${p.type==='system'?'Xüsusi sistem':'Veb dizayn'}</span><span>${p.id==='velvet'?'Konsept':'Proqramlaşdırma'}</span></span><span class="showcase-open" aria-hidden="true">↗</span></span></button></article>`;
}
export function observeShowcases(root){
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const observer=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('in-view',e.isIntersecting&&!motion.matches)),{threshold:.15});
 root.querySelectorAll('.showcase-card').forEach(el=>observer.observe(el));
 return observer;
}

document.addEventListener('visibilitychange',()=>document.documentElement.classList.toggle('previews-paused',document.hidden));
