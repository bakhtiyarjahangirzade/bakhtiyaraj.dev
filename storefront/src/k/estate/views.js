// HTML views shared by the build (index.js, first paint) and the browser (app.js, every update).
// D is the resolved page payload (plain strings), state holds saved/compare/requests.
import {planSvg} from './plan.js';

export const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fill=(s,v)=>String(s).replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m);

export function makeFmt(D){
 // Own number/date formatting: browsers ship uneven Azerbaijani locale data, and build and browser must print the same digits.
 const en=D.lang==='en',gs=en?',':' ',ds=en?'.':',';
 const fmt=(n,d)=>{const s=Math.abs(n).toFixed(d),[i,f]=s.split('.');return (n<0?'−':'')+i.replace(/\B(?=(\d{3})+(?!\d))/g,gs)+(f?ds+f:'')};
 const nf={format:n=>fmt(n,Number.isInteger(n)?0:1)},n1={format:n=>fmt(n,1)},n2={format:n=>fmt(n,2)};
 const pr={select:n=>D.lang==='ru'?(n%10===1&&n%100!==11?'one':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'few':'many'):D.lang==='en'&&n===1?'one':'other'};
 const MON={az:['yanvar','fevral','mart','aprel','may','iyun','iyul','avqust','sentyabr','oktyabr','noyabr','dekabr'],ru:['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],en:['January','February','March','April','May','June','July','August','September','October','November','December']}[D.lang]||[];
 const dp=iso=>iso.split('-').map(Number);
 const df={format:d=>{const [,m,dd]=d;return `${dd} ${MON[m-1]}`}},dfy={format:d=>`${df.format(d)} ${d[0]}`};
 const S=D.S;
 const F={
  num:n=>nf.format(n),f1:n=>n1.format(n),f2:n=>n2.format(n),
  azn:n=>`${nf.format(n)} AZN`,
  t:(k,v={})=>fill(S[k],v),
  e:(k,v={})=>esc(fill(S[k],v)),
  count:n=>{const r=pr.select(n);return fill(S['res_'+r]||S.res_other,{n:nf.format(n)})},
  date:iso=>df.format(dp(iso)),
  dateY:iso=>dfy.format(dp(iso)),
  price:l=>l.mode==='rent'?fill(S.perMonth,{p:`${nf.format(l.price)} AZN`}):`${nf.format(l.price)} AZN`,
  ppm:l=>l.mode==='rent'?fill(S.ppmRent,{v:n1.format(l.ppm)}):fill(S.ppmSale,{v:nf.format(l.ppm)}),
  short:l=>l.mode==='rent'?nf.format(l.price):fill(S.thousand,{n:nf.format(Math.round(l.price/1000))}),
  title:l=>l.type==='house'?fill(S.titleHouse,{n:l.rooms,a:n1.format(l.area)}):l.plan.some(([t])=>t==='kl')&&l.rooms===1?fill(S.titleStudio,{a:n1.format(l.area)}):fill(S.titleFlat,{n:l.rooms,a:n1.format(l.area)}),
  floor:l=>l.type==='house'?S.houseFloors:fill(S.floorOf,{f:l.floor,t:l.floors}),
  district:id=>D.districts.find(d=>d.id===id).name,
  metro:l=>fill(S.metroMin,{s:l.station,m:l.metro})
 };
 return F;
}

const heart='<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z"/></svg>';
const scales='<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.5" y="5" width="7" height="14" rx="1.5"/><rect x="13.5" y="5" width="7" height="14" rx="1.5"/><path d="M5.8 9h2.4M15.8 9h2.4M5.8 12h2.4M15.8 12h2.4"/></svg>';

export function planOpts(D,F,l,big){
 return big?{names:D.R,f1:F.f1,f2:F.f2,entry:esc(D.S.entry),scale:esc(D.S.scale),title:esc(fill(D.S.planTitle,{t:F.title(l)}))}:{mini:true};
}

const thumbImg=p=>`<img class="es-timg" src="${p.srcset.split(', ')[0].split(' ')[0]}" srcset="${p.srcset}" sizes="(max-width: 759px) 112px, 180px" width="${p.w}" height="${p.h}" alt="" loading="lazy" decoding="async">`;
export function card(D,F,l,st){
 const sv=st.saved.has(l.id),cm=st.compare[l.mode].includes(l.id),req=st.requests[l.id];
 const n=l.photos.length,ph=n?(n===1?D.S.photo1:fill(D.S.photosN,{n})):D.S.noPhotos;
 const tags=[D.TYPE[l.type],D.RENO[l.reno],l.mode==='sale'?(l.kupca?D.S.deed:D.S.noDeed):(l.furnished?D.S.furnished:D.S.unfurnished)];
 return `<li class="es-item${st.sel===l.id?' is-sel':''}" data-id="${l.id}"><article class="es-card" aria-labelledby="t-${l.id}">
<a class="es-thumb${n?' has-photo':''}" href="#elan-${l.id}" tabindex="-1" aria-hidden="true">${n?thumbImg(D.photos[l.photos[0]]):''}<span class="es-tplan">${planSvg(l.plan,{mini:true})}</span><span class="es-phn">${esc(ph)}</span></a>
<div class="es-body">
<p class="es-price"><strong>${esc(F.price(l))}</strong><span>${esc(F.ppm(l))}</span></p>
<h3 id="t-${l.id}"><a class="es-open" href="#elan-${l.id}">${esc(F.title(l))}</a></h3>
<p class="es-place">${esc(F.district(l.district))}, ${esc(l.place)}</p>
<ul class="es-spec"><li>${esc(F.floor(l))}</li><li>${esc(F.metro(l))}</li></ul>
<ul class="es-tags">${tags.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>
${req?`<p class="es-req">${esc(fill(D.S.requested,{d:F.date(req.date),s:D.S.slots[req.slot]}))}</p>`:''}
<div class="es-acts"><button type="button" class="es-btn es-save" data-act="save" data-id="${l.id}" aria-pressed="${sv}">${heart}<span>${esc(sv?D.S.saved:D.S.save)}</span></button><button type="button" class="es-btn es-cmp" data-act="cmp" data-id="${l.id}" aria-pressed="${cm}">${scales}<span>${esc(cm?D.S.comparing:D.S.compare)}</span></button></div>
</div></article></li>`;
}

export function pin(D,F,l,st){
 const label=F.short(l),w=Math.round(label.length*10.4+26);
 const aria=fill(D.S.pinAria,{t:F.title(l),p:F.price(l),d:`${F.district(l.district)}, ${l.place}`});
 return `<g class="es-pin${st.sel===l.id?' is-sel':''}${st.saved.has(l.id)?' is-saved':''}" data-id="${l.id}" tabindex="0" role="button" aria-label="${esc(aria)}" aria-pressed="${st.sel===l.id}" transform="translate(${l.x} ${l.y})"><path class="es-pin-tip" d="M-8 -14 L0 0 L8 -14 Z"/><rect class="es-pin-box" x="${-w/2}" y="-48" width="${w}" height="35" rx="17.5"/><text class="es-pin-t" x="0" y="-23.5" text-anchor="middle">${esc(label)}</text></g>`;
}

export function mapSvg(D){
 const S=D.S;
 const shore='M0 488 L100 500 L130 495 L200 520 L320 545 L450 520 L560 505 L650 515 L760 530 L870 505 L960 462 L1000 450';
 const parcels=D.districts.map(d=>`<polygon class="es-parcel" data-d="${d.id}" points="${d.pts}"/>`).join('');
 const names=D.districts.map(d=>`<text class="es-dname" x="${d.lx}" y="${d.ly}" text-anchor="middle">${esc(d.name)}</text>`).join('');
 const metro=D.metro.map(m=>`<g class="es-metro" transform="translate(${m.x} ${m.y})"><circle r="6"/><text x="11" y="5">${esc(m.n)}</text></g>`).join('');
 // isobaths: offset copies of the shoreline describe depth, the way a nautical chart does
 const iso=[22,48,80].map(o=>`<path class="es-iso" d="${shore.replace(/(\d+) (\d+)/g,(_,x,y)=>`${x} ${+y+o}`)}"/>`).join('');
 return `<svg class="es-map-svg" viewBox="0 0 1000 680" role="group" aria-labelledby="es-map-title es-map-cap" preserveAspectRatio="xMidYMin meet"><title id="es-map-title">${esc(S.mapTitle)}</title>
<defs><pattern id="es-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" class="es-hatch-l"/></pattern></defs>
<rect class="es-land" x="0" y="0" width="1000" height="680"/>
<path class="es-sea" d="${shore} L1000 680 L0 680 Z"/>${iso}
<g class="es-parcels">${parcels}</g>
<path class="es-shore" d="${shore}"/>
<path class="es-blvd" d="M300 536 L450 512 L560 497 L640 506"/>
<text class="es-blvd-t" x="470" y="540" text-anchor="middle">${esc(S.boulevard)}</text>
<text class="es-sea-t" x="470" y="612" text-anchor="middle">${esc(S.bay)}</text>
<text class="es-sea-t es-sea-big" x="840" y="630" text-anchor="middle">${esc(S.sea)}</text>
<g class="es-dnames">${names}</g><g class="es-metros">${metro}</g>
<g class="es-pins"></g></svg>`;
}
