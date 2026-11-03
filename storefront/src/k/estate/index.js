// Ünvan — flat and house search for Baku. Build-time renderer (Node).
import {assets,esc} from '../kit.js';
import {LISTINGS,DISTRICTS,METRO,ROOM,SERIES,RENO,HEAT,PARK,TYPE} from './data.js';
import {S,PHOTO_ALT} from './strings.js';
import {makeFmt,card,pin,mapSvg} from './views.js';

const OWNER={src:'/assets/showroom/estate.webp',srcset:'/assets/showroom/estate.webp 1200w',w:1200,h:900,gen:true};
function photo(key){
 if(key==='owner-exterior')return {...OWNER,alt:PHOTO_ALT[key]};
 const a=assets['estate/'+key];
 if(!a)throw new Error('estate: missing photo '+key);
 return {src:`/assets/k/estate/${key}-${a.widths[a.widths.length-1]}.webp`,srcset:a.widths.map(w=>`/assets/k/estate/${key}-${w}.webp ${w}w`).join(', '),w:a.w,h:a.h,alt:PHOTO_ALT[key]};
}
// The "metro" line on each listing is the nearest station on the schematic map (or an explicit metroAt), so map and text agree.
const near=l=>l.metroAt?METRO.find(m=>m.n.v[0]===l.metroAt):METRO.reduce((b,m)=>Math.hypot(m.x-l.x,m.y-l.y)<Math.hypot(b.x-l.x,b.y-l.y)?m:b);
const median=a=>{if(!a.length)return null;const s=[...a].sort((x,y)=>x-y),h=s.length>>1;return s.length%2?s[h]:(s[h-1]+s[h])/2};

export default {
 id:'estate',brand:'Ünvan',kind:'site',
 render(ctx){
  const photos={};for(const l of LISTINGS)for(const k of l.photos)photos[k]=photo(k);
  const payload={locale:ctx.locale,lang:ctx.lang,S,R:ROOM,SER:SERIES,RENO,HEAT,PARK,TYPE,
   districts:DISTRICTS,metro:METRO,photos,
   listings:LISTINGS.map(l=>({...l,station:near(l).n}))};
  const D=ctx.resolve(payload),F=makeFmt(D),T=(k,v)=>F.e(k,v);
  const st={saved:new Set(),compare:{sale:[],rent:[]},requests:{},sel:null};
  const sale=D.listings.filter(l=>l.mode==='sale').sort((a,b)=>b.posted.localeCompare(a.posted));
  const dcount=id=>sale.filter(l=>l.district===id).length;

  const districtsRows=(()=>{
   const rows=D.districts.map(d=>{
    const s=D.listings.filter(l=>l.district===d.id&&l.mode==='sale'),r=D.listings.filter(l=>l.district===d.id&&l.mode==='rent');
    return {d,s:s.length,r:r.length,ms:s.length?Math.round(median(s.map(l=>l.ppm))):null,mr:r.length?Math.round(median(r.map(l=>l.ppm))*10)/10:null,metro:D.metro.filter(m=>{const pt=d.pts.split(' ').map(p=>p.split(',').map(Number));let c=false;for(let i=0,j=pt.length-1;i<pt.length;j=i++){const [xi,yi]=pt[i],[xj,yj]=pt[j];if((yi>m.y)!==(yj>m.y)&&m.x<(xj-xi)*(m.y-yi)/(yj-yi)+xi)c=!c}return c}).map(m=>m.n)};
   });
   const maxS=Math.max(...rows.map(r=>r.ms||0)),maxR=Math.max(...rows.map(r=>r.mr||0));
   const bar=(v,max)=>v==null?`<span class="es-none">${T('dNone')}</span>`:`<span class="es-bar"><svg viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true" focusable="false"><rect class="es-bar-bg" width="100" height="6"/><rect class="es-bar-v" width="${Math.round(v/max*100)}" height="6"/></svg><span>${esc(v===Math.round(v)?F.num(v):F.f1(v))}</span></span>`;
   return rows.sort((a,b)=>(b.ms||0)-(a.ms||0)).map(r=>`<tr><th scope="row"><span class="es-dn">${esc(r.d.name)}</span><span class="es-dnote">${esc(r.d.note)}</span></th>
<td data-l="${T('dSale')}">${r.s}</td><td data-l="${T('dMedSale')}">${bar(r.ms,maxS)}</td><td data-l="${T('dRent')}">${r.r}</td><td data-l="${T('dMedRent')}">${bar(r.mr,maxR)}</td><td data-l="${T('dMetro')}" class="es-dmetro">${r.metro.map(esc).join(', ')}</td>
<td><button type="button" class="es-btn es-dgo" data-district="${r.d.id}">${T('dSearch',{d:esc(r.d.name)})}</button></td></tr>`).join('');
  })();

  const checks=D.districts.map(d=>`<label class="es-chk"><input type="checkbox" name="d" value="${d.id}"><span>${esc(d.name)}</span><small data-c="${d.id}">${dcount(d.id)}</small></label>`).join('');
  const roomsSeg=['1','2','3','4'].map(v=>`<label class="es-segb"><input type="checkbox" name="r" value="${v}"><span>${v==='4'?'4+':v}</span></label>`).join('');
  const range=(id,lk,step)=>`<fieldset class="es-fs"><legend id="es-${id}-l">${T(lk)}</legend><div class="es-range"><label><span>${T('min')}</span><input type="number" name="${id}min" inputmode="numeric" min="0" step="${step}" aria-describedby="es-${id}-err"></label><label><span>${T('max')}</span><input type="number" name="${id}max" inputmode="numeric" min="0" step="${step}" aria-describedby="es-${id}-err"></label></div><p class="es-ferr" id="es-${id}-err" hidden>${T('rangeErr')}</p></fieldset>`;

  return `<div class="es-app">
<header class="es-top">
<a class="es-brand" href="#es-search"><svg class="es-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M4 26h24M7 26V12l9-6 9 6v14"/><path d="M13 26v-7h6v7"/><circle cx="16" cy="13" r="2.2"/></svg><span class="es-word">Ünvan</span><span class="es-tag">${T('tagline')}</span></a>
<div class="es-mode" role="radiogroup" aria-label="${T('modeLabel')}"><label><input type="radio" name="mode" value="sale" checked><span>${T('sale')}</span></label><label><input type="radio" name="mode" value="rent"><span>${T('rent')}</span></label></div>
<nav class="es-nav" aria-label="Ünvan"><a href="#es-districts">${T('navDistricts')}</a><button type="button" class="es-navbtn" id="es-saved-btn" aria-pressed="false">${T('navSaved')} <span class="es-badge" id="es-saved-n">0</span></button><button type="button" class="es-navbtn" id="es-cmp-btn">${T('navCompare')} <span class="es-badge" id="es-cmp-n">0</span></button></nav>
</header>
<div class="es-intro"><h1>${T('h1')}</h1><p>${T('lead')}</p></div>
<div class="es-work" id="es-search" data-view="list">
<form class="es-filters" id="es-filters" aria-labelledby="es-f-h" novalidate>
<div class="es-f-head"><h2 id="es-f-h">${T('filters')}</h2><button type="button" class="es-btn es-f-close">${T('close')}</button></div>
<div class="es-f-body">
<fieldset class="es-fs"><legend>${T('district')}</legend><div class="es-checks">${checks}</div></fieldset>
<fieldset class="es-fs"><legend>${T('rooms')}</legend><div class="es-seg">${roomsSeg}</div></fieldset>
${range('p','priceSale',1000)}
${range('a','area',5)}
<fieldset class="es-fs"><legend>${T('floor')}</legend><label class="es-tog"><input type="checkbox" name="nf"><span>${T('notFirst')}</span></label><label class="es-tog"><input type="checkbox" name="nl"><span>${T('notLast')}</span></label></fieldset>
<fieldset class="es-fs"><legend>${T('building')}</legend><div class="es-seg es-seg-wide">${['any','new','old','house'].map(v=>`<label class="es-segb"><input type="radio" name="b" value="${v}"${v==='any'?' checked':''}><span>${v==='any'?T('any'):esc(D.TYPE[v])}</span></label>`).join('')}</div></fieldset>
<fieldset class="es-fs"><legend>${T('condition')}</legend><label class="es-tog"><input type="checkbox" name="reno"><span>${T('onlyReno')}</span></label><label class="es-tog" data-only="sale"><input type="checkbox" name="deed"><span>${T('withDeed')}</span></label><label class="es-tog" data-only="rent" hidden><input type="checkbox" name="furn"><span>${T('furnishedOnly')}</span></label></fieldset>
</div>
<div class="es-f-foot"><button type="reset" class="es-btn es-reset">${T('reset')}</button><button type="button" class="es-btn es-primary es-f-apply">${T('showN',{n:sale.length})}</button></div>
</form>
<section class="es-results" aria-labelledby="es-count">
<div class="es-rhead">
<h2 id="es-count" class="es-count">${esc(F.count(sale.length))} <span>${T('inSale')}</span></h2>
<div class="es-rtools">
<button type="button" class="es-btn es-f-open" aria-controls="es-filters" aria-expanded="false">${T('filters')} <span class="es-badge" id="es-f-n" hidden>0</span></button>
<label class="es-sort"><span>${T('sort')}</span><select id="es-sort">${[['new','sortNew'],['cheap','sortCheap'],['dear','sortDear'],['ppm','sortPpm'],['area','sortArea']].map(([v,k])=>`<option value="${v}">${T(k)}</option>`).join('')}</select></label>
<div class="es-viewtog" role="group" aria-label="${T('viewLabel')}"><button type="button" data-view="list" aria-pressed="true">${T('viewList')}</button><button type="button" data-view="map" aria-pressed="false">${T('viewMap')}</button></div>
</div>
<ul class="es-chips" aria-label="${T('filters')}"></ul>
</div>
<ol class="es-list" id="es-list">${sale.map(l=>card(D,F,l,st)).join('')}</ol>
<div class="es-empty" id="es-empty" hidden><svg class="es-empty-art" viewBox="0 0 120 80" aria-hidden="true" focusable="false"><rect x="10" y="10" width="100" height="60"/><path d="M10 40h50M60 10v60M60 52h50"/><path class="es-empty-x" d="M78 22l14 14M92 22L78 36"/></svg><h3 id="es-empty-h">${T('emptyTitle')}</h3><p id="es-empty-p">${T('emptyText')}</p><div class="es-empty-acts" id="es-empty-acts"></div></div>
</section>
<section class="es-mapwrap" id="es-map" aria-labelledby="es-map-h"><h2 class="sr-only" id="es-map-h">${T('viewMap')}</h2>
<figure class="es-map"><div class="es-map-pan" id="es-map-pan">${mapSvg(D).replace('<g class="es-pins"></g>',`<g class="es-pins">${sale.map(l=>pin(D,F,l,st)).join('')}</g>`)}</div><p class="es-map-empty" id="es-map-empty" hidden>${T('mapEmpty')}</p>
<figcaption id="es-map-cap">${T('mapCaption')}</figcaption></figure>
<div class="es-legend" aria-hidden="true"><span class="es-lg-pin">${T('legendPin')}</span><span class="es-lg-metro">${T('legendMetro')}</span></div>
<div class="es-mapcard" id="es-mapcard"><p class="es-hint">${T('mapHint')}</p></div>
</section>
</div>
<section class="es-districts" id="es-districts" aria-labelledby="es-d-h">
<div class="es-dhead"><h2 id="es-d-h">${T('dTitle')}</h2><p>${T('dLead')}</p></div>
<table class="es-dtable"><thead><tr><th scope="col">${T('district')}</th><th scope="col">${T('dSale')}</th><th scope="col">${T('dMedSale')}</th><th scope="col">${T('dRent')}</th><th scope="col">${T('dMedRent')}</th><th scope="col">${T('dMetro')}</th><th scope="col"><span class="sr-only">${T('navSearch')}</span></th></tr></thead><tbody>${districtsRows}</tbody></table>
</section>
<footer class="es-foot"><p class="es-fbrand"><span class="es-word">Ünvan</span> ${T('tagline')}</p><p>${T('footNote')}</p><p>${T('footPhotos')}</p>${ctx.credits(Object.keys(photos).filter(k=>k!=='owner-exterior').map(k=>'estate/'+k))}</footer>
<div class="es-tray" id="es-tray" hidden><p id="es-tray-t"></p><ul class="es-tray-l" id="es-tray-l"></ul><div class="es-tray-a"><button type="button" class="es-btn" id="es-tray-clear">${T('trayClear')}</button><button type="button" class="es-btn es-primary" id="es-tray-open">${T('trayOpen')}</button></div></div>
<dialog class="es-sheet" id="es-detail" aria-labelledby="es-d-title"></dialog>
<dialog class="es-cmpdlg" id="es-cmpdlg" aria-labelledby="es-cmp-title"></dialog>
<div class="es-toast" id="es-toast" role="status" aria-live="polite"></div>
</div>${ctx.data(payload)}`;
 }
};
