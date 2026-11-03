// Bazarlıq templates shared by build and browser. An "ad" may be a sample (photo = asset key) or the visitor's own (photoData = data: URL).
export const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export const fill=(s,v)=>String(s).replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m);
const MONTHS={az:['yanvar','fevral','mart','aprel','may','iyun','iyul','avqust','sentyabr','oktyabr','noyabr','dekabr'],ru:['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],en:['January','February','March','April','May','June','July','August','September','October','November','December']};
export function fmt(lang){
 const sep=lang==='en'?',':' ';
 const num=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,sep);
 return {num,azn:n=>`${num(n)} AZN`,day:iso=>{const [y,m,d]=iso.slice(0,10).split('-').map(Number);return `${d} ${(MONTHS[lang]||MONTHS.az)[m-1]}`}};
}
export const ico={
 heart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg>',
 el:'<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="6" y="5" width="20" height="14" rx="2"/><path d="M3 24h26M12 19v5M20 19v5"/></svg>',
 home:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 15v11h18V15M4 16 16 6l12 10"/><path d="M13 26v-7h6v7"/></svg>',
 kids:'<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="11" cy="11" r="3"/><circle cx="21" cy="11" r="3"/><circle cx="16" cy="18" r="7"/><path d="M13 18h.01M19 18h.01M14 21c1.3 1 2.7 1 4 0"/></svg>',
 hobby:'<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="8" cy="21" r="5"/><circle cx="24" cy="21" r="5"/><path d="M8 21l5-9h8l3 9M13 12l3 9h-8M18 8h4"/></svg>',
 all:'<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="5" width="9" height="9" rx="2"/><rect x="18" y="5" width="9" height="9" rx="2"/><rect x="5" y="18" width="9" height="9" rx="2"/><rect x="18" y="18" width="9" height="9" rx="2"/></svg>',
 cam:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-2.5h6L17 8h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/></svg>',
 back:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5"/></svg>',
 check:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>'
};
export function when(iso,D){
 const day=iso.slice(0,10),t=new Date(D.today+'T12:00:00'),y=new Date(t);y.setDate(t.getDate()-1);
 return day===D.today?fill(D.S.today,{t:iso.slice(11,16)}):day===y.toISOString().slice(0,10)?fill(D.S.yesterday,{t:iso.slice(11,16)}):D.F.day(iso);
}
export const catOf=(a,D)=>D.cats.find(c=>c.id===a.cat);
export function tag(a,D,big=false){
 const S=D.S,cls=`bz-tag${big?' bz-tag-big':''}${a.mode!=='price'?' bz-tag-'+a.mode:''}`;
 const txt=a.mode==='free'?S.free:a.mode==='swap'?S.swap:a.price?D.F.azn(a.price):S.priceTbd;
 return `<span class="${cls}">${esc(txt)}${a.mode==='price'&&a.neg?`<small>${esc(S.negShort)}</small>`:''}</span>`;
}
export function pic(a,D,size='card'){
 if(a.photoData)return `<img src="${esc(a.photoData)}" alt="${esc(a.title)}" width="800" height="800">`;
 if(a.photo&&D.img[a.photo])return D.img[a.photo];
 return `<span class="bz-noph">${ico.cam}<small>${esc(D.S.noPhoto)}</small></span>`;
}
const attrText=(a,D)=>{const c=catOf(a,D);if(!a.attr)return '';return c.field.options?(c.field.options[a.attr]||a.attr):a.attr};
export function card(a,D,st){
 const S=D.S,fav=st.fav.has(a.id),mine=a.mine;
 return `<article class="bz-card${mine?' is-mine':''}" data-id="${esc(a.id)}">
<a class="bz-card-pic" href="#elan/${esc(a.id)}" tabindex="-1" aria-hidden="true">${pic(a,D)}</a>
${tag(a,D)}
<button type="button" class="bz-fav" data-fav="${esc(a.id)}" aria-pressed="${fav}" aria-label="${esc(fill(fav?S.unfavA:S.favA,{t:a.title}))}">${ico.heart}</button>
<div class="bz-card-body"><h3><a href="#elan/${esc(a.id)}">${esc(a.title)}</a></h3><p class="bz-card-meta"><span>${esc(D.cond[a.cond])}</span><span>${esc(D.city[a.city])}</span><span>${esc(when(a.posted,D))}</span></p>${mine?`<p class="bz-mine-badge">${esc(S.yourAd)}</p>`:''}</div></article>`;
}
export function detail(a,D,st,preview=false){
 const S=D.S,c=catOf(a,D),fav=st.fav.has(a.id),at=attrText(a,D);
 const rows=[[S.category,`${c.name}, ${c.subs[a.sub]||''}`],[S.condition,D.cond[a.cond]],at&&[c.field.label,at],[S.city,D.city[a.city]],[S.postedL,when(a.posted,D)]].filter(Boolean);
 return `<article class="bz-detail${preview?' is-preview':''}" aria-labelledby="${preview?'bz-pv-h':'bz-d-h'}">
<div class="bz-d-pic">${pic(a,D,'big')}</div>
<div class="bz-d-info">
<p class="bz-d-cat">${esc(c.name)}</p>
<h${preview?2:1} id="${preview?'bz-pv-h':'bz-d-h'}" tabindex="-1">${esc(a.title)}</h${preview?2:1}>
${tag(a,D,true)}
${a.mode==='price'&&a.neg?`<p class="bz-neg">${esc(S.negotiable)}</p>`:''}
<dl class="bz-dl">${rows.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
<p class="bz-desc">${esc(a.desc)}</p>
<div class="bz-seller"><span class="bz-ava" aria-hidden="true">${esc((a.name||'?').slice(0,1))}</span><div><b>${esc(a.name)}</b><span>${esc(D.city[a.city])}</span></div></div>
${preview?'':`<div class="bz-d-actions"><button type="button" class="bz-btn bz-btn-line" data-fav="${esc(a.id)}" aria-pressed="${fav}">${ico.heart}<span>${fav?S.saved:S.save}</span></button></div>
${a.mine?`<p class="bz-note">${esc(S.yourAdNote)}</p><button type="button" class="bz-link bz-danger" data-delete="${esc(a.id)}">${esc(S.deleteAd)}</button>`:`<form class="bz-msg" data-msg="${esc(a.id)}" novalidate><label for="bz-msg-t"><b>${esc(S.writeSeller)}</b></label><div class="bz-quick">${S.quick.map(q=>`<button type="button" data-quick="${esc(q)}">${esc(q)}</button>`).join('')}</div><textarea id="bz-msg-t" name="m" rows="3" aria-describedby="bz-msg-e"></textarea><p class="bz-err" id="bz-msg-e" data-err="m"></p><button type="submit" class="bz-btn bz-btn-main">${esc(S.send)}</button><p class="bz-ok" data-ok hidden></p></form>`}`}
</div></article>`;
}
// Filtering for the browse grid.
export function matches(a,f){
 if(f.cat&&a.cat!==f.cat)return false;
 if(f.sub&&a.sub!==f.sub)return false;
 if(f.q){const q=f.q.toLowerCase();if(!(a.title.toLowerCase().includes(q)||String(a.attr||'').toLowerCase().includes(q)))return false}
 if(f.cond&&a.cond!==f.cond)return false;
 if(f.city&&a.city!==f.city)return false;
 if(f.free&&a.mode==='price')return false;
 if(f.pmax!==''&&f.pmax!=null&&a.mode==='price'&&a.price>+f.pmax)return false;
 return true;
}
export const SORTS={new:(a,b)=>b.posted.localeCompare(a.posted),cheap:(a,b)=>(a.mode==='price'?a.price:0)-(b.mode==='price'?b.price:0),dear:(a,b)=>(b.mode==='price'?b.price:0)-(a.mode==='price'?a.price:0)};
