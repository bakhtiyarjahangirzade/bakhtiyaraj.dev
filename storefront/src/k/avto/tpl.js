// Yolda templates, shared by build (index.js) and browser (app.js). Pure functions.
export const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export const fill=(s,v)=>String(s).replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m);
const MONTHS={az:['yanvar','fevral','mart','aprel','may','iyun','iyul','avqust','sentyabr','oktyabr','noyabr','dekabr'],ru:['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],en:['January','February','March','April','May','June','July','August','September','October','November','December']};
export function fmt(lang){
 const sep=lang==='en'?',':' ',dec=lang==='en'?'.':',';
 const num=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,sep);
 return {num,one:n=>n.toFixed(1).replace('.',dec),azn:n=>`${num(n)} AZN`,day:(iso)=>{const [y,m,d]=iso.slice(0,10).split('-').map(Number);return `${d} ${(MONTHS[lang]||MONTHS.az)[m-1]}`}};
}
export function posted(iso,D){
 const day=iso.slice(0,10),time=iso.slice(11,16),t=new Date(D.today+'T12:00:00'),y=new Date(t);y.setDate(t.getDate()-1);
 if(day===D.today)return fill(D.S.today,{t:time});
 if(day===y.toISOString().slice(0,10))return fill(D.S.yesterday,{t:time});
 return D.F.day(iso);
}
export const ico={
 star:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8Z"/></svg>',
 cam:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-2.5h6L17 8h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/></svg>',
 flag:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V4M5 4h12l-2 4 2 4H5"/></svg>',
 phone:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3.5h3l1.5 4-2 1.3a11 11 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z"/></svg>',
 back:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5"/></svg>'
};

// ---------- filtering ----------
export const emptyF=()=>({q:'',make:'',model:'',city:[],pmin:'',pmax:'',ymin:'',ymax:'',kmax:'',fuel:[],gear:[],body:[],seller:'',credit:false,barter:false,vin:false,photo:false});
export function match(a,f,skip=''){
 const q=f.q.trim().toLowerCase();
 if(q&&!`${a.make} ${a.model}`.toLowerCase().includes(q))return false;
 if(skip!=='make'&&f.make&&a.make!==f.make)return false;
 if(skip!=='model'&&f.model&&a.model!==f.model)return false;
 if(skip!=='city'&&f.city.length&&!f.city.includes(a.city))return false;
 if(skip!=='price'&&f.pmin!==''&&a.price<+f.pmin)return false;
 if(skip!=='price'&&f.pmax!==''&&a.price>+f.pmax)return false;
 if(skip!=='year'&&f.ymin&&a.year<+f.ymin)return false;
 if(skip!=='year'&&f.ymax&&a.year>+f.ymax)return false;
 if(skip!=='kmax'&&f.kmax!==''&&(a.km===0||a.km>+f.kmax))return false;
 if(skip!=='fuel'&&f.fuel.length&&!f.fuel.includes(a.fuel))return false;
 if(skip!=='gear'&&f.gear.length&&!f.gear.includes(a.gear))return false;
 if(skip!=='body'&&f.body.length&&!f.body.includes(a.body))return false;
 if(skip!=='seller'&&f.seller&&a.seller!==f.seller)return false;
 for(const k of ['credit','barter','vin'])if(skip!==k&&f[k]&&!a[k])return false;
 if(skip!=='photo'&&f.photo&&!a.photo)return false;
 return true;
}
export const SORTS={new:(a,b)=>b.posted.localeCompare(a.posted),cheap:(a,b)=>a.price-b.price,dear:(a,b)=>b.price-a.price,km:(a,b)=>(a.km||1e9)-(b.km||1e9),year:(a,b)=>b.year-a.year};

// Human summary of a filter set, used for saved-search names and chips: [{key, label, value?}]
export function chips(f,D){
 const S=D.S,F=D.F,out=[];
 if(f.q)out.push({k:'q',l:`“${f.q}”`});
 if(f.make)out.push({k:'make',l:f.make});
 if(f.model)out.push({k:'model',l:f.model});
 for(const c of f.city)out.push({k:'city',v:c,l:D.city[c]});
 if(f.pmin!==''||f.pmax!=='')out.push({k:'price',l:f.pmin!==''&&f.pmax!==''?`${F.num(+f.pmin)}–${F.azn(+f.pmax)}`:f.pmin!==''?fill(S.fromV,{v:F.azn(+f.pmin)}):fill(S.toV,{v:F.azn(+f.pmax)})});
 if(f.ymin||f.ymax)out.push({k:'year',l:f.ymin&&f.ymax?`${f.ymin}–${f.ymax}`:f.ymin?fill(S.fromV,{v:f.ymin}):fill(S.toV,{v:f.ymax})});
 if(f.kmax!=='')out.push({k:'kmax',l:fill(S.toV,{v:F.num(+f.kmax)+' '+S.km})});
 for(const k of f.fuel)out.push({k:'fuel',v:k,l:D.fuel[k]});
 for(const k of f.gear)out.push({k:'gear',v:k,l:D.gear[k]});
 for(const k of f.body)out.push({k:'body',v:k,l:D.body[k]});
 if(f.seller)out.push({k:'seller',l:S[f.seller==='private'?'sellerPrivate':'sellerDealer']});
 for(const k of ['credit','barter','vin','photo'])if(f[k])out.push({k,l:S['flag_'+k]});
 return out;
}
export function dropChip(f,c){
 const g=JSON.parse(JSON.stringify(f));
 if(Array.isArray(g[c.k]))g[c.k]=g[c.k].filter(x=>x!==c.v);
 else if(c.k==='price'){g.pmin='';g.pmax=''}
 else if(c.k==='year'){g.ymin='';g.ymax=''}
 else if(typeof g[c.k]==='boolean')g[c.k]=false;
 else g[c.k]='';
 if(c.k==='make')g.model='';
 return g;
}

// ---------- rows ----------
const title=a=>`${esc(a.make)} ${esc(a.model)}`;
export function badges(a,D){
 const S=D.S;
 return [a.credit&&`<span class="yo-b yo-b-credit">${S.flag_credit}</span>`,a.barter&&`<span class="yo-b yo-b-barter">${S.flag_barter}</span>`,a.vin&&`<span class="yo-b yo-b-vin">VIN</span>`,a.seller==='dealer'&&`<span class="yo-b yo-b-dealer">${S.sellerDealer}</span>`].filter(Boolean).join('');
}
export const specLine=(a,D)=>[a.engine?`${D.F.one(a.engine)} L`:'',D.fuel[a.fuel],D.gear[a.gear],a.km?`${D.F.num(a.km)} ${D.S.km}`:D.S.kmUnknown].filter(Boolean).map(esc).join(', ');
function thumb(a,D,cls='yo-th'){
 return a.photo?`<span class="${cls}">${D.img[a.photo]}</span>`:`<span class="${cls} yo-noph">${ico.cam}<small>${D.S.noPhoto}</small></span>`;
}
export function row(a,D,st){
 const S=D.S,fav=st.fav.has(a.id),isToday=a.posted.startsWith(D.today);
 return `<li class="yo-row" data-id="${a.id}">
${thumb(a,D)}
<div class="yo-row-main"><h3><a href="#elan/${a.id}">${title(a)}, ${a.year}</a></h3><p class="yo-spec">${specLine(a,D)}</p><p class="yo-badges">${badges(a,D)}</p></div>
<div class="yo-row-side"><p class="yo-price">${D.F.azn(a.price)}</p><p class="yo-meta"><span>${esc(D.city[a.city])}</span><span class="${isToday?'yo-today':''}">${esc(posted(a.posted,D))}</span></p>
<button type="button" class="yo-fav" data-fav="${a.id}" aria-pressed="${fav}" aria-label="${esc(fill(fav?S.unfavA:S.favA,{car:a.make+' '+a.model}))}">${ico.star}</button></div></li>`;
}
export function tableRow(a,D,st){
 const fav=st.fav.has(a.id);
 return `<tr data-id="${a.id}"><td class="yo-t-car"><a href="#elan/${a.id}">${title(a)}</a>${a.photo?'':`<span class="yo-t-noph" title="${esc(D.S.noPhoto)}">${ico.cam}</span>`}</td><td>${a.year}</td><td>${a.engine?D.F.one(a.engine):'—'}</td><td>${a.km?D.F.num(a.km):'—'}</td><td>${esc(D.gear[a.gear])}</td><td>${esc(D.city[a.city])}</td><td>${esc(posted(a.posted,D))}</td><td class="yo-t-price">${D.F.azn(a.price)}</td><td><button type="button" class="yo-fav" data-fav="${a.id}" aria-pressed="${fav}" aria-label="${esc(fill(fav?D.S.unfavA:D.S.favA,{car:a.make+' '+a.model}))}">${ico.star}</button></td></tr>`;
}
export function table(list,D,st){
 const S=D.S;
 return `<div class="yo-tscroll" tabindex="0" role="region" aria-label="${esc(S.viewTable)}"><table class="yo-table"><thead><tr><th scope="col">${S.colCar}</th><th scope="col">${S.colYear}</th><th scope="col">${S.colEngine}</th><th scope="col">${S.colKm}</th><th scope="col">${S.colGear}</th><th scope="col">${S.colCity}</th><th scope="col">${S.colDate}</th><th scope="col">${S.colPrice}</th><th scope="col"><span class="sr-only">${S.favourites}</span></th></tr></thead><tbody>${list.map(a=>tableRow(a,D,st)).join('')}</tbody></table></div>`;
}

// ---------- detail ----------
export function detail(a,D,st){
 const S=D.S,F=D.F,fav=st.fav.has(a.id);
 const rows=[[S.colMake,a.make],[S.colModel,a.model],[S.colYear,a.year],[S.body,D.body[a.body]],[S.colour,D.colour[a.colour]],[S.colEngine,a.engine?`${F.one(a.engine)} L, ${fill(S.hp,{n:a.hp})}`:'—'],[S.fuel,D.fuel[a.fuel]],[S.colKm,a.km?`${F.num(a.km)} ${S.km}`:S.kmUnknown],[S.gearbox,D.gear[a.gear]],[S.owners,a.owners||S.unknown],[S.painted,a.painted?fill(S.paintedN,{n:a.painted}):S.none],[S.crashed,a.crashed?S.yes:S.no],[S.market,D.market[a.market]],[S.city,D.city[a.city]]];
 const sim=D.ads.filter(b=>b.id!==a.id&&(b.body===a.body||Math.abs(b.price-a.price)<a.price*.25)).sort((x,y)=>Math.abs(x.price-a.price)-Math.abs(y.price-a.price)).slice(0,4);
 return `<article class="yo-detail" aria-labelledby="yo-d-h">
<nav class="yo-crumbs" aria-label="${S.crumbs}"><a href="#elanlar">${ico.back}${S.allAds}</a><span aria-hidden="true">/</span><a href="#elanlar" data-crumb-make="${esc(a.make)}">${esc(a.make)}</a><span aria-hidden="true">/</span><span>${esc(a.model)}</span></nav>
<header class="yo-d-head"><h1 id="yo-d-h" tabindex="-1">${title(a)}, ${a.year}</h1><p class="yo-d-price">${F.azn(a.price)}</p></header>
<div class="yo-d-grid">
<div class="yo-d-main">
<figure class="yo-d-photo">${a.photo?D.big[a.photo]:`<span class="yo-noph yo-noph-big">${ico.cam}<small>${S.noPhotoBig}</small></span>`}</figure>
<p class="yo-badges">${badges(a,D)}</p>
<section aria-labelledby="yo-ch"><h2 id="yo-ch">${S.specs}</h2><dl class="yo-dl">${rows.map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section>
<section aria-labelledby="yo-ds"><h2 id="yo-ds">${S.sellerSays}</h2><p class="yo-desc">${esc(a.desc)}</p></section>
<p class="yo-d-meta"><span>${fill(S.adNo,{n:a.id})}</span><span>${fill(S.updated,{d:esc(posted(a.posted,D))})}</span><span>${fill(S.viewsN,{n:F.num(a.views)})}</span></p>
</div>
<aside class="yo-d-side">
<div class="yo-seller"><p class="yo-seller-type">${a.seller==='dealer'?S.sellerDealer:S.sellerPrivate}</p><p class="yo-seller-name">${esc(a.name)}</p><p class="yo-seller-since">${fill(S.since,{y:a.since})}, ${esc(D.city[a.city])}</p>
<button type="button" class="yo-btn yo-btn-main yo-phone" data-phone="${a.id}" aria-expanded="false">${ico.phone}<span>+994 00 ••• •• ••</span><em>${S.showPhone}</em></button>
<p class="yo-phone-note" data-phone-note hidden>${S.phoneNote}</p>
<button type="button" class="yo-btn yo-btn-line" data-fav="${a.id}" aria-pressed="${fav}">${ico.star}<span>${fav?S.inFav:S.addFav}</span></button></div>
<div class="yo-safe"><h2>${S.safeTitle}</h2><ul>${S.safe.map(x=>`<li>${x}</li>`).join('')}</ul></div>
<button type="button" class="yo-report" data-report="${a.id}">${ico.flag}<span>${S.report}</span></button>
</aside></div>
${sim.length?`<section class="yo-sim" aria-labelledby="yo-sim-h"><h2 id="yo-sim-h">${S.similar}</h2><ul class="yo-list yo-list-compact">${sim.map(b=>row(b,D,st)).join('')}</ul></section>`:''}
</article>`;
}
