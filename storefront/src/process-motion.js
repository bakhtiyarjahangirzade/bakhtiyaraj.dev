const scene=document.querySelector('.studio-process');
const preference=matchMedia('(prefers-reduced-motion: reduce)');
if(scene){
 const cards=[...scene.querySelectorAll('.steps article')];
 scene.classList.add('process-ready');
 const observer=new IntersectionObserver(entries=>{for(const e of entries){scene.classList.toggle('process-active',e.isIntersecting);if(e.isIntersecting)scene.classList.add('process-revealed')}},{threshold:.15});
 observer.observe(scene);
 let frame=0;
 function reset(){cancelAnimationFrame(frame);frame=0;cards.forEach(c=>{c.style.removeProperty('--tilt-x');c.style.removeProperty('--tilt-y')})}
 scene.addEventListener('pointermove',e=>{if(preference.matches||e.pointerType!=='mouse')return;cancelAnimationFrame(frame);const x=e.clientX,y=e.clientY;frame=requestAnimationFrame(()=>{frame=0;cards.forEach(c=>{const r=c.getBoundingClientRect(),dx=Math.max(-1,Math.min(1,(x-r.left-r.width/2)/r.width)),dy=Math.max(-1,Math.min(1,(y-r.top-r.height/2)/r.height));c.style.setProperty('--tilt-x',`${-dy*5}deg`);c.style.setProperty('--tilt-y',`${dx*5}deg`)})})},{passive:true});
 scene.addEventListener('pointerleave',reset);preference.addEventListener('change',reset);
}
