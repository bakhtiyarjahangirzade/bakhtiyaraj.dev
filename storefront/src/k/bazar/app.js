import '../ribbon.css';
import './style.css';
import '../../i18n.js';
import {esc,fill,fmt,card,detail,matches,SORTS,ico,catOf} from './tpl.js';

const D=JSON.parse(document.getElementById('k-data').textContent);
D.F=fmt(D.lang);
const S=D.S,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}}};
const st={fav:new Set(store.get('bz-fav',[])),mine:store.get('bz-mine',[])};
const all=()=>[...st.mine,...D.ads];
const byId=id=>all().find(a=>a.id===id);
const home=$('[data-home]'),view=$('[data-view]'),post=$('[data-post]'),grid=$('[data-grid]'),filters=$('#bz-filters'),search=$('#bz-search');
const toastEl=$('[data-toast]');let tt;
const toast=m=>{toastEl.textContent=m;toastEl.classList.add('is-on');clearTimeout(tt);tt=setTimeout(()=>toastEl.classList.remove('is-on'),2600)};
const f={cat:'',sub:'',q:'',cond:'',city:'',pmax:'',free:false,sort:'new'};

// ---------- browse ----------
function renderGrid(){
 const list=all().filter(a=>matches(a,f)).sort(SORTS[f.sort]);
 grid.innerHTML=list.map(a=>card(a,D,st)).join('');
 grid.hidden=!list.length;$('[data-empty]').hidden=!!list.length;
 $('[data-count]').textContent=fill(S.countN,{n:list.length});
 const c=D.cats.find(x=>x.id===f.cat);
 $('[data-br-title]').textContent=c?c.name:S.browseAll;
 const subs=$('[data-subs]');subs.hidden=!c;
 if(c)subs.innerHTML=[['',S.allSubs],...Object.entries(c.subs)].map(([k,l])=>`<li><button type="button" data-sub="${k}" aria-pressed="${f.sub===k}">${esc(l)}</button></li>`).join('');
 $$('[data-cat]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.cat===f.cat));
 counts();
}
function counts(){$('[data-n=fav]').textContent=st.fav.size;$('[data-n=mine]').textContent=st.mine.length}
filters.addEventListener('change',()=>{const el=filters.elements;f.cond=el.cond.value;f.city=el.city.value;f.pmax=el.pmax.value;f.free=el.free.checked;f.sort=el.sort.value;renderGrid()});
search.addEventListener('submit',e=>{e.preventDefault();f.q=search.elements.q.value.trim();f.cat=search.elements.cat.value;f.sub='';renderGrid();go('#elanlar',true)});
function clearAll(){Object.assign(f,{cat:'',sub:'',q:'',cond:'',city:'',pmax:'',free:false});filters.reset();search.reset();renderGrid()}

// ---------- favourites ----------
function toggleFav(id){
 const a=byId(id),on=!st.fav.has(id);on?st.fav.add(id):st.fav.delete(id);store.set('bz-fav',[...st.fav]);
 $$(`[data-fav="${CSS.escape(id)}"]`).forEach(b=>{b.setAttribute('aria-pressed',on);const sp=b.querySelector('span');if(sp)sp.textContent=on?S.saved:S.save;else b.setAttribute('aria-label',fill(on?S.unfavA:S.favA,{t:a.title}))});
 toast(on?S.favOn:S.favOff);counts();if(location.hash==='#secilmisler')route();
}
const listView=(title,list,emptyT,emptyB,cta)=>`<a class="bz-back" href="#elanlar">${ico.back}${esc(S.back)}</a><h1 tabindex="-1">${esc(title)}</h1>`+(list.length?`<div class="bz-grid">${list.map(a=>card(a,D,st)).join('')}</div>`:`<div class="bz-empty"><h2>${esc(emptyT)}</h2><p>${esc(emptyB)}</p>${cta?`<div><a class="bz-btn bz-btn-main" href="#elan-ver">${esc(S.post)}</a></div>`:''}</div>`);

// ---------- message form on detail ----------
function bindDetail(){
 const m=$('[data-msg]',view);if(!m)return;
 m.addEventListener('click',e=>{const q=e.target.closest('[data-quick]');if(q){m.elements.m.value=q.dataset.quick;m.elements.m.focus()}});
 m.addEventListener('submit',e=>{e.preventDefault();const v=m.elements.m.value.trim(),bad=v.length<5;
  $('[data-err=m]',m).textContent=bad?S.errMsg:'';m.elements.m.setAttribute('aria-invalid',bad);
  if(bad){m.elements.m.focus();return}
  const ok=$('[data-ok]',m);ok.hidden=false;ok.textContent=S.msgOk;m.elements.m.value='';ok.setAttribute('tabindex','-1');ok.focus()});
}

// ---------- posting studio ----------
const pf=$('#bz-pf');let step=1;let photoData='';
const draft=()=>{const el=pf.elements;return {id:'draft',cat:el.cat.value||(D.cats[0].id),sub:el.sub.value,title:el.title.value.trim()||S.draftTitle,desc:el.desc.value.trim(),cond:el.cond.value||'used',mode:el.mode.value,price:+el.price.value||0,neg:el.neg.checked,city:el.city.value||'baku',name:el.name.value.trim()||'—',attr:(el.attr&&el.attr.value.trim())||'',photoData,posted:new Date().toISOString().slice(0,16).replace('T','T'),mine:true}};
function syncCat(){
 const c=D.cats.find(x=>x.id===pf.elements.cat.value),sel=pf.elements.sub;
 sel.disabled=!c;sel.innerHTML=`<option value="">${esc(S.chooseSub)}</option>`+(c?Object.entries(c.subs).map(([k,l])=>`<option value="${k}">${esc(l)}</option>`).join(''):'');
 const box=$('[data-catfield]',pf),fd=c&&c.field;
 box.innerHTML=!fd?'':fd.options?`<label class="bz-f"><span>${esc(fd.label)}</span><select name="attr"><option value="">${esc(S.chooseSub)}</option>${Object.entries(fd.options).map(([k,l])=>`<option value="${k}">${esc(l)}</option>`).join('')}</select><small class="bz-err" data-e="attr"></small></label>`:`<label class="bz-f"><span>${esc(fd.label)}</span><input name="attr" placeholder="${esc(fd.ph)}"><small class="bz-err" data-e="attr"></small></label>`;
}
function live(){
 const d=draft();$('[data-live]').innerHTML=card(d,D,{fav:new Set()}).replace(/href="#elan\/draft"/g,'href="#elan-ver"');
 $('[data-cnt=title]',pf).textContent=fill(S.chars,{n:pf.elements.title.value.length,max:70});
 $('[data-cnt=desc]',pf).textContent=fill(S.chars,{n:pf.elements.desc.value.length,max:1000});
 $('[data-pricebox]',pf).hidden=pf.elements.mode.value!=='price';
}
function validate(n){
 const el=pf.elements,e={};
 if(n===1){if(!el.cat.value)e.cat=S.eCat;else if(!el.sub.value)e.sub=S.eSub}
 if(n===2){const t=el.title.value.trim();if(t.length<5||t.length>70)e.title=S.eTitle;if(el.desc.value.trim().length<20)e.desc=S.eDesc;if(!el.cond.value)e.cond=S.eCond;
  const c=D.cats.find(x=>x.id===el.cat.value);if(c&&c.field.required&&!(el.attr&&el.attr.value.trim()))e.attr=fill(S.eField,{f:c.field.label})}
 if(n===3){if(el.mode.value==='price'&&!(+el.price.value>=1&&+el.price.value<=100000))e.price=S.ePrice;if(!el.city.value)e.city=S.eCity;if(!el.name.value.trim())e.name=S.eName;if(!/^\+?994\d{9}$/.test(el.phone.value.replace(/[\s()-]/g,'')))e.phone=S.ePhone}
 const fs=$(`[data-step="${n}"]`,pf);
 $$('[data-e]',fs).forEach(x=>{const k=x.dataset.e;x.textContent=e[k]||'';const inp=fs.querySelector(`[name="${k}"]`);if(inp&&inp.type!=='radio')inp.setAttribute('aria-invalid',!!e[k])});
 const sum=$('[data-errsum]',pf),keys=Object.keys(e);
 sum.hidden=!keys.length;
 if(keys.length){sum.innerHTML=`<p>${esc(S.errSum)}</p><ul>${keys.map(k=>`<li><a href="#" data-goto="${k}">${esc(e[k])}</a></li>`).join('')}</ul>`;sum.focus()}
 return !keys.length;
}
function show(n){
 step=n;$$('[data-step]',pf).forEach(s=>s.hidden=+s.dataset.step!==n);
 $$('[data-stepdot]').forEach(d=>{const i=+d.dataset.stepdot;d.classList.toggle('is-done',i<n);i===n?d.setAttribute('aria-current','step'):d.removeAttribute('aria-current')});
 $('[data-prev]',pf).hidden=n===1;$('[data-next]',pf).textContent=n===4?S.publish:S.next;$('[data-stepof]',pf).textContent=fill(S.stepOf,{n});
 $('[data-errsum]',pf).hidden=true;
 $('.bz-live').hidden=n===4;
 if(n===4)$('[data-pv]',pf).innerHTML=detail(draft(),D,{fav:new Set()},true);
 const first=$(`[data-step="${n}"]`,pf).querySelector('input,select,textarea');
 if(first&&n<4)first.focus({preventScroll:true});
 post.scrollIntoView({block:'start'});
}
pf.addEventListener('input',live);
pf.addEventListener('change',e=>{if(e.target.name==='cat')syncCat();if(e.target.name==='photo')readPhoto(e.target);live()});
pf.addEventListener('submit',e=>{e.preventDefault();if(step<4){if(validate(step))show(step+1)}else publish()});
$('[data-prev]',pf).addEventListener('click',()=>show(step-1));
pf.addEventListener('click',e=>{const g=e.target.closest('[data-goto]');if(g){e.preventDefault();const k=g.dataset.goto,inp=pf.querySelector(`[name="${k}"]`);inp&&inp.focus()}
 if(e.target.closest('[data-photo-rm]')){photoData='';pf.elements.photo.value='';e.target.closest('[data-photo-rm]').hidden=true;live()}});
function readPhoto(inp){
 const file=inp.files&&inp.files[0],err=$('[data-e=photo]',pf);err.textContent='';
 if(!file)return;
 if(!/^image\//.test(file.type)){err.textContent=S.photoErr;inp.value='';return}
 const url=URL.createObjectURL(file),im=new Image();
 im.onload=()=>{const s=Math.min(1,800/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);photoData=c.toDataURL('image/jpeg',.82);URL.revokeObjectURL(url);$('[data-photo-rm]',pf).hidden=false;live()};
 im.onerror=()=>{err.textContent=S.photoErr;URL.revokeObjectURL(url)};
 im.src=url;
}
function publish(){
 const d=draft(),n=Date.now();d.id='B-'+String(n).slice(-5);d.posted=localIso();
 st.mine.unshift(d);if(!store.set('bz-mine',st.mine)){d.photoData='';store.set('bz-mine',st.mine)}
 $('[data-post-grid]').hidden=true;$('.bz-steps').hidden=true;
 const p=$('[data-published]');p.hidden=false;$('[data-pub-body]').textContent=fill(S.pubBody,{t:d.title});$('[data-pub-view]').href='#elan/'+d.id;p.focus();
 Object.assign(f,{cat:'',sub:'',q:''});renderGrid();
}
const localIso=()=>{const d=new Date(),p=x=>String(x).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`};
function resetPost(){pf.reset();photoData='';syncCat();$('[data-post-grid]').hidden=false;$('.bz-steps').hidden=false;$('[data-published]').hidden=true;$('[data-photo-rm]',pf).hidden=true;$$('[data-e]',pf).forEach(x=>x.textContent='');live();show(1)}
$('[data-pub-again]').addEventListener('click',resetPost);

// ---------- clicks ----------
document.addEventListener('click',e=>{
 const t=e.target;
 const fb=t.closest('[data-fav]');if(fb){toggleFav(fb.dataset.fav);return}
 const cb=t.closest('[data-cat]');if(cb){f.cat=cb.dataset.cat;f.sub='';search.elements.cat.value=f.cat;renderGrid();$('#elanlar').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});return}
 const sb=t.closest('[data-sub]');if(sb){f.sub=sb.dataset.sub;renderGrid();return}
 if(t.closest('[data-clear]')){clearAll();return}
 const del=t.closest('[data-delete]');if(del){st.mine=st.mine.filter(a=>a.id!==del.dataset.delete);store.set('bz-mine',st.mine);toast(S.deleted);renderGrid();go('#menim');return}
});

// ---------- router ----------
let homeY=0;
const go=(h,scroll)=>{if(location.hash!==h)location.hash=h;else route();if(scroll)$('#elanlar').scrollIntoView()};
function route(){
 const [v,id]=location.hash.slice(1).split('/');
 const wasHome=!home.hidden;if(wasHome)homeY=scrollY;
 post.hidden=v!=='elan-ver';
 let html='';
 if(v==='elan'&&byId(id)){const a=byId(id),sim=all().filter(b=>b.cat===a.cat&&b.id!==a.id).slice(0,4);html=`<a class="bz-back" href="#elanlar">${ico.back}${esc(S.back)}</a>`+detail(a,D,st)+(sim.length?`<section class="bz-sim"><h2>${esc(S.similar)}</h2><div class="bz-grid">${sim.map(b=>card(b,D,st)).join('')}</div></section>`:'')}
 else if(v==='secilmisler')html=listView(S.favTitle,all().filter(a=>st.fav.has(a.id)),S.favEmpty,S.favEmptyB);
 else if(v==='menim')html=listView(S.mineTitle,st.mine,S.mineEmpty,S.mineEmptyB,true);
 view.hidden=!html;view.innerHTML=html;home.hidden=!!html||v==='elan-ver';
 if(v==='elan-ver'){if(!$('[data-published]').hidden)resetPost();else{live();show(step)}scrollTo(0,0);$('#bz-post-h').focus({preventScroll:true})}
 else if(html){scrollTo(0,0);bindDetail();view.querySelector('h1')?.focus({preventScroll:true})}
 else if(!wasHome){scrollTo(0,homeY);if(v==='elanlar'&&!homeY)$('#elanlar').scrollIntoView()}
 else if(v==='elanlar')$('#elanlar').scrollIntoView();
 $$('.bz-nav a').forEach(a=>a.getAttribute('href')==='#'+v?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current'));
}
addEventListener('hashchange',route);
syncCat();renderGrid();live();route();
