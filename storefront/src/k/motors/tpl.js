// AutoLane templates shared by the build (index.js) and the browser (app.js). Pure string functions, no DOM, no kit.js.
export const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const fill=(s,v)=>String(s).replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m);
// Own number/date formatting: ICU data for az is incomplete in some runtimes, and build and browser must print the same text.
const MONTHS={az:['yanvar','fevral','mart','aprel','may','iyun','iyul','avqust','sentyabr','oktyabr','noyabr','dekabr'],ru:['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],en:['January','February','March','April','May','June','July','August','September','October','November','December']};
export function fmt(locale){
 const lang=String(locale).slice(0,2),sep=lang==='en'?',':' ',dec=lang==='en'?'.':',';
 const num=n=>(n<0?'−':'')+String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g,sep);
 const one=n=>{const [i,f]=Math.abs(n).toFixed(1).split('.');return num(+i)+dec+f};
 const date=s=>{const [y,m,d]=s.split('-').map(Number);return `${d} ${(MONTHS[lang]||MONTHS.az)[m-1]} ${y}`};
 return {num,one,azn:n=>`${num(n)} AZN`,date};
}
// Annuity payment. rate = yearly % chosen by the visitor. Returns {monthly,total,interest,loan}.
export function finance(price,depPct,term,rate){
 const loan=Math.max(0,price*(1-depPct/100)),r=rate/1200;
 const monthly=loan===0?0:r===0?loan/term:loan*r/(1-Math.pow(1+r,-term));
 return {loan,monthly,total:monthly*term,interest:monthly*term-loan};
}
export const DEF={dep:30,term:36,rate:16};
export const passed=(c,D)=>D.total-c.adv.length;
const advSystems=(c,D)=>new Set(c.adv.map(k=>D.adv[k][0]));

const ico={
 heart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg>',
 ok:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>',
 adv:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5v5.5M8 11.5v1"/></svg>',
 back:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5"/></svg>',
 x:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>'
};
export {ico};

export function strip(c,D,big=false){
 const S=D.S,a=advSystems(c,D),p=passed(c,D);
 const seg=D.sys.map(s=>`<span class="${a.has(s.id)?'is-adv':'is-ok'}" title="${esc(s.name)}"></span>`).join('');
 const label=fill(S.stripLabel,{passed:p,total:D.total,adv:c.adv.length});
 return `<div class="al-strip${big?' al-strip-big':''}"><div class="al-strip-bar" role="img" aria-label="${esc(label)}">${seg}</div><p>${c.adv.length?fill(S.stripCap,{passed:p,total:D.total,adv:c.adv.length}):fill(S.stripClean,{total:D.total})}</p></div>`;
}

export function card(c,D,st){
 const S=D.S,F=D.F,m=finance(c.price,DEF.dep,DEF.term,DEF.rate);
 const saved=st.saved.has(c.id),cmp=st.compare.includes(c.id);
 return `<article class="al-card" data-id="${c.id}">
<a class="al-card-media" href="#car/${c.id}" tabindex="-1" aria-hidden="true">${D.img[c.id]}</a>
<div class="al-card-body">
<h3><a href="#car/${c.id}">${esc(c.make)} ${esc(c.model)}</a></h3>
<p class="al-trim">${esc(c.trim)}, ${esc(D.hub[c.hub])}</p>
<dl class="al-specs"><div><dt>${S.year}</dt><dd>${c.year}</dd></div><div><dt>${S.mileage}</dt><dd>${F.num(c.km)} ${S.km}</dd></div><div><dt>${S.fuel}</dt><dd>${esc(D.fuel[c.fuel])}</dd></div><div><dt>${S.gearbox}</dt><dd>${esc(D.gear[c.gear])}</dd></div></dl>
${strip(c,D)}
<div class="al-card-foot"><p class="al-price"><strong>${F.azn(c.price)}</strong><span>${fill(S.perMonthStar,{sum:F.azn(m.monthly)})}</span></p>
<div class="al-card-actions"><button type="button" class="al-save" data-save="${c.id}" aria-pressed="${saved}" aria-label="${esc(fill(saved?S.unsaveCar:S.saveCar,{car:c.make+' '+c.model}))}">${ico.heart}</button>
<label class="al-cmp"><input type="checkbox" data-compare="${c.id}"${cmp?' checked':''}><span>${S.compare}</span></label></div></div>
</div></article>`;
}

function tyreDiagram(c,D){
 const S=D.S,F=D.F,[fl,fr,rl,rr]=c.tread,cls=v=>v<4?'is-adv':'is-ok';
 const w=(x,y,v,lab)=>`<g class="${cls(v)}"><rect x="${x}" y="${y}" width="22" height="46" rx="6"/><text x="${x<100?x-10:x+32}" y="${y+28}" text-anchor="${x<100?'end':'start'}">${F.one(v)} ${S.mm}</text><text class="al-tl" x="${x<100?x-10:x+32}" y="${y+12}" text-anchor="${x<100?'end':'start'}">${esc(lab)}</text></g>`;
 return `<svg class="al-tyres" viewBox="-16 0 292 250" role="img" aria-label="${esc(fill(S.treadAria,{fl:F.one(fl),fr:F.one(fr),rl:F.one(rl),rr:F.one(rr)}))}">
<path class="al-car" d="M98 22c10-10 54-10 64 0 8 8 10 26 10 40v126c0 18-2 34-10 42-10 10-54 10-64 0-8-8-10-24-10-42V62c0-14 2-32 10-40Z"/>
<path class="al-car-glass" d="M104 74c14-8 38-8 52 0l-4 28c-12-4-32-4-44 0Z M106 172c12 4 36 4 48 0l2 22c-14 6-38 6-52 0Z"/>
<text class="al-tl al-front" x="130" y="14" text-anchor="middle">${esc(S.front)}</text>
${w(64,46,fl,S.fl)}${w(174,46,fr,S.fr)}${w(64,160,rl,S.rl)}${w(174,160,rr,S.rr)}
</svg>`;
}

export function report(c,D){
 const S=D.S,F=D.F,byItem={};
 for(const k of c.adv){const [s,i,note]=D.adv[k];byItem[s+'.'+i]=note}
 const ev=c.fuel==='electric';
 const sys=D.sys.map(s=>{
  const advs=s.items.filter(([i])=>byItem[s.id+'.'+i]).length;
  const items=s.items.map(([i,name])=>{const n=byItem[s.id+'.'+i];return `<li class="${n?'is-adv':'is-ok'}"><span class="al-mark">${n?ico.adv:ico.ok}</span><div><b>${esc(name)}</b>${n?`<p>${esc(n)}</p>`:''}</div><em>${n?S.advisory:S.pass}</em></li>`}).join('');
  return `<details class="al-sys"${advs?' open':''}><summary><span class="al-sys-name">${esc(s.name)}</span><span class="al-sys-count">${advs?fill(S.sysAdv,{n:s.n-advs,total:s.n,adv:advs}):fill(S.sysOk,{n:s.n,total:s.n})}</span></summary><ul>${items}</ul><p class="al-sys-more">${fill(S.sysMore,{n:s.n-s.items.length})}</p></details>`;
 }).join('');
 return `<section class="al-report" aria-labelledby="rep-${c.id}">
<div class="al-rep-head"><div><h2 id="rep-${c.id}">${S.reportTitle}</h2><p>${fill(S.reportMeta,{date:F.date(c.inspected),hub:esc(D.hub[c.hub])})}</p></div>${strip(c,D,true)}</div>
<div class="al-measure"><figure>${tyreDiagram(c,D)}<figcaption>${S.treadCap}</figcaption></figure>
<dl><div><dt>${S.padsLabel}</dt><dd>${fill(S.padsVal,{f:c.pads[0],r:c.pads[1]})}</dd></div><div><dt>${S.paintLabel}</dt><dd>${fill(S.paintVal,{a:c.paint[0],b:c.paint[1]})}</dd></div><div><dt>${ev?S.tractionLabel:S.batteryLabel}</dt><dd>${c.soh}%</dd></div><div><dt>${S.obdLabel}</dt><dd>${S.obdVal}</dd></div></dl></div>
<div class="al-systems">${sys}</div>
<p class="al-note">${S.reportNote}</p>
</section>`;
}

export function specSheet(c,D){
 const S=D.S,F=D.F,ev=c.fuel==='electric';
 const rows=[[S.year,c.year],[S.mileage,F.num(c.km)+' '+S.km],[S.body,D.body[c.body]],[S.fuel,D.fuel[c.fuel]],[S.engine,ev?S.evMotor:F.one(c.engine)+' L'],[S.power,fill(S.hpVal,{hp:c.hp})],[S.gearbox,D.gear[c.gear]],[S.drive,D.drive[c.drive]],[S.consumption,ev?fill(S.kwhVal,{v:F.one(c.cons)}):fill(S.lVal,{v:F.one(c.cons)})],[S.owners,c.owners],[S.colour,D.colour[c.colour]],[S.centre,D.hub[c.hub]]];
 return `<section class="al-spec" aria-labelledby="spec-${c.id}"><h2 id="spec-${c.id}">${S.specTitle}</h2><dl>${rows.map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section>`;
}

export function detail(c,D,st){
 const S=D.S,F=D.F,g=D.gallery[c.id]||[],saved=st.saved.has(c.id),cmp=st.compare.includes(c.id);
 const days=st.days||[];
 return `<article class="al-detail" aria-labelledby="d-title">
<a class="al-back" href="#cars">${ico.back}<span>${S.backToResults}</span></a>
<header class="al-d-head"><div><p class="al-d-id">${fill(S.stockNo,{id:c.id})}</p><h1 id="d-title" tabindex="-1">${esc(c.make)} ${esc(c.model)}</h1><p class="al-d-sub">${esc(c.trim)}, ${c.year}, ${F.num(c.km)} ${S.km}</p></div></header>
<div class="al-d-grid">
<div class="al-d-main">
<div class="al-gallery"><figure class="al-g-main">${g[0]||D.img[c.id]}</figure>${g.length>1?`<div class="al-g-thumbs" role="group" aria-label="${S.galleryLabel}">${g.map((h,i)=>`<button type="button" data-g="${i}" aria-pressed="${i===0}" aria-label="${esc(fill(S.photoN,{n:i+1,total:g.length}))}">${h}</button>`).join('')}</div>`:''}</div>
${specSheet(c,D)}
${report(c,D)}
</div>
<aside class="al-d-side">
<div class="al-buy"><p class="al-buy-price">${F.azn(c.price)}</p><p class="al-buy-note">${S.priceNote}</p>
<div class="al-buy-actions"><button type="button" class="al-btn al-btn-quiet" data-save="${c.id}" aria-pressed="${saved}">${ico.heart}<span>${saved?S.saved:S.save}</span></button><button type="button" class="al-btn al-btn-quiet" data-compare-btn="${c.id}" aria-pressed="${cmp}"><span>${cmp?S.inCompare:S.addCompare}</span></button></div></div>
<form class="al-calc" data-calc="${c.id}" novalidate><h2>${S.calcTitle}</h2>
<label class="al-f"><span>${S.deposit} <output data-o="dep">${DEF.dep}% (${F.azn(c.price*DEF.dep/100)})</output></span><input type="range" name="dep" min="10" max="70" step="5" value="${DEF.dep}"></label>
<fieldset class="al-terms"><legend>${S.term}</legend>${[12,24,36,48,60].map(t=>`<label><input type="radio" name="term" value="${t}"${t===DEF.term?' checked':''}><span>${fill(S.months,{n:t})}</span></label>`).join('')}</fieldset>
<label class="al-f"><span>${S.rate}</span><span class="al-suffix"><input type="number" name="rate" inputmode="decimal" min="0" max="40" step="0.5" value="${DEF.rate}" aria-describedby="rate-h-${c.id}"><i>%</i></span><small id="rate-h-${c.id}">${S.rateHelp}</small></label>
<div class="al-calc-out" aria-live="polite" data-out></div>
<p class="al-note">${S.calcNote}</p></form>
<form class="al-view-req" data-viewing="${c.id}" novalidate><h2>${S.viewTitle}</h2><p>${fill(S.viewLead,{hub:esc(D.hub[c.hub])})}</p>
<label class="al-f"><span>${S.yourName}</span><input name="name" autocomplete="name" required><small class="al-err" data-err="name"></small></label>
<label class="al-f"><span>${S.phone}</span><input name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="+994 50 123 45 67" required><small class="al-err" data-err="phone"></small></label>
<label class="al-f"><span>${S.day}</span><select name="day" required><option value="">${S.chooseDay}</option>${days.map(d=>`<option value="${d.v}">${esc(d.t)}</option>`).join('')}</select><small class="al-err" data-err="day"></small></label>
<fieldset class="al-slots"><legend>${S.time}</legend>${['10:00','12:00','15:00','17:30'].map((t,i)=>`<label><input type="radio" name="slot" value="${t}"${i===1?' checked':''}><span>${t}</span></label>`).join('')}</fieldset>
<button class="al-btn al-btn-main" type="submit">${S.sendRequest}</button><div class="al-done" data-done hidden></div></form>
</aside></div></article>`;
}

export function compareView(ids,D,st){
 const S=D.S,F=D.F,cars=ids.map(id=>D.cars.find(c=>c.id===id)).filter(Boolean);
 if(cars.length<2)return `<section class="al-cmpview"><a class="al-back" href="#cars">${ico.back}<span>${S.backToResults}</span></a><h1 tabindex="-1">${S.compareTitle}</h1><div class="al-empty"><h2>${S.compareEmpty}</h2><p>${fill(S.compareEmptyBody,{n:cars.length})}</p><a class="al-btn al-btn-main" href="#cars">${S.pickCars}</a></div></section>`;
 const best=(f,dir)=>{const v=cars.map(f),b=dir>0?Math.max(...v):Math.min(...v);return v.map(x=>x===b&&v.filter(y=>y===b).length<cars.length)};
 const m=c=>finance(c.price,DEF.dep,DEF.term,DEF.rate).monthly;
 const rows=[
  [S.price,c=>F.azn(c.price),best(c=>c.price,-1)],
  [S.perMonthRow,c=>F.azn(m(c)),best(m,-1)],
  [S.year,c=>c.year,best(c=>c.year,1)],
  [S.mileage,c=>F.num(c.km)+' '+S.km,best(c=>c.km,-1)],
  [S.fuel,c=>esc(D.fuel[c.fuel])],
  [S.gearbox,c=>esc(D.gear[c.gear])],
  [S.power,c=>fill(S.hpVal,{hp:c.hp}),best(c=>c.hp,1)],
  [S.drive,c=>esc(D.drive[c.drive])],
  [S.owners,c=>c.owners,best(c=>c.owners,-1)],
  [S.checksPassed,c=>`${passed(c,D)} / ${D.total}`,best(c=>passed(c,D),1)],
  [S.advisories,c=>c.adv.length?c.adv.map(k=>`<span class="al-cmp-adv">${esc(D.adv[k][2])}</span>`).join(''):S.none],
  [S.centre,c=>esc(D.hub[c.hub])]
 ];
 return `<section class="al-cmpview" aria-labelledby="cmp-h"><a class="al-back" href="#cars">${ico.back}<span>${S.backToResults}</span></a>
<div class="al-cmp-head"><h1 id="cmp-h" tabindex="-1">${S.compareTitle}</h1><p>${S.compareLead}</p></div>
<div class="al-cmp-scroll" tabindex="0" role="region" aria-labelledby="cmp-h"><table class="al-cmp-table"><thead><tr><th scope="col"><span class="sr-only">${S.parameter}</span></th>${cars.map(c=>`<th scope="col"><div class="al-cmp-car">${D.img[c.id]}<a href="#car/${c.id}">${esc(c.make)} ${esc(c.model)}</a><span>${esc(c.trim)}</span><button type="button" class="al-x" data-uncompare="${c.id}" aria-label="${esc(fill(S.removeFromCompare,{car:c.make+' '+c.model}))}">${ico.x}</button></div></th>`).join('')}</tr></thead>
<tbody>${rows.map(([k,f,b])=>`<tr><th scope="row">${k}</th>${cars.map((c,i)=>`<td${b&&b[i]?' class="is-best"':''}>${f(c)}${b&&b[i]?`<span class="sr-only"> (${S.bestInRow})</span>`:''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
<p class="al-note">${fill(S.compareNote,{dep:DEF.dep,term:DEF.term,rate:DEF.rate})}</p></section>`;
}

export function savedView(D,st){
 const S=D.S,cars=D.cars.filter(c=>st.saved.has(c.id));
 return `<section class="al-savedview" aria-labelledby="sv-h"><a class="al-back" href="#cars">${ico.back}<span>${S.backToResults}</span></a><h1 id="sv-h" tabindex="-1">${S.savedTitle}</h1>${cars.length?`<div class="al-grid">${cars.map(c=>card(c,D,st)).join('')}</div>`:`<div class="al-empty"><h2>${S.savedEmpty}</h2><p>${S.savedEmptyBody}</p><a class="al-btn al-btn-main" href="#cars">${S.pickCars}</a></div>`}</section>`;
}

// Filtering shared by build (initial count) and runtime.
export function filterCars(cars,f){
 return cars.filter(c=>(!f.make||c.make===f.make)&&(!f.model||c.model===f.model)&&(!f.year||c.year>=+f.year)&&(!f.price||c.price<=+f.price)&&(!f.km||c.km<=+f.km)&&(!f.fuel||c.fuel===f.fuel)&&(!f.gear||c.gear===f.gear));
}
export const SORTS={rec:(a,b)=>a.adv.length-b.adv.length||b.year-a.year,priceAsc:(a,b)=>a.price-b.price,priceDesc:(a,b)=>b.price-a.price,year:(a,b)=>b.year-a.year||a.km-b.km,km:(a,b)=>a.km-b.km};
