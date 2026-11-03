// Pure HTML renderers shared by the build (index.js) and the browser (app.js). No DOM, no Node APIs.
export const WORKDAYS=21;
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export {esc};

export const monthly=d=>d.type==='daily'?d.people*d.price*WORKDAYS:0;
export const value=d=>Math.round(d.type==='daily'?d.people*d.price*WORKDAYS*d.months:d.people*d.price);
const DAY=864e5;
const parse=iso=>{const [y,m,d]=iso.split('-').map(Number);return Date.UTC(y,m-1,d)};
export const daysFrom=(today,iso)=>Math.round((parse(iso)-parse(today))/DAY);
export const addDays=(iso,n)=>new Date(parse(iso)+n*DAY).toISOString().slice(0,10);

export function makeFmt(D){
 // Deterministic formatting (browsers ship different locale data): az/ru group with a no-break space and use a decimal comma.
 const en=D.locale.startsWith('en'),G=en?',':'\u00a0',P=en?'.':',';
 const group=x=>{const [i,f]=x.split('.');return i.replace(/\B(?=(\d{3})+(?!\d))/g,G)+(f?P+f:'')};
 const nf={format:x=>group(String(Math.round(x)))},nf2={format:x=>group((Math.round(x*100)/100).toFixed(2))};
 const df={format:d=>`${d.getUTCDate()} ${D.months[d.getUTCMonth()]}`};
 const fill=(s,v)=>s.replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m);
 const F={
  n:x=>nf.format(x),
  azn:x=>`${nf.format(Math.round(x))} AZN`,
  price:x=>`${nf2.format(x)} AZN`,
  date:iso=>df.format(new Date(parse(iso))),
  fill,
  rel(iso){
   const n=daysFrom(D.today,iso),S=D.S;
   if(n===0)return S.today;if(n===1)return S.tomorrow;if(n===-1)return S.yesterday;
   return n<0?fill(S.daysLate,{n:-n}):F.date(iso);
  },
  terms(d){const S=D.S;return d.type==='daily'?fill(S.termsDaily,{people:nf.format(d.people),price:nf2.format(d.price),months:d.months}):fill(S.termsEvent,{people:nf.format(d.people),price:nf2.format(d.price)})}
 };
 return F;
}

export function matches(d,st){
 if(st.owner!=='all'&&d.owner!==st.owner)return false;
 const q=st.q.trim().toLocaleLowerCase();
 return !q||`${d.co} ${d.contact}`.toLocaleLowerCase().includes(q);
}

export function visibleStages(D,st){return D.stages.filter(s=>s.id!=='lost'||st.showLost)}

export function totals(D,st){
 const list=D.deals.filter(d=>matches(d,st)),open=list.filter(d=>!['won','lost'].includes(d.stage));
 const p=Object.fromEntries(D.stages.map(s=>[s.id,s.p/100]));
 return {
  open:open.reduce((a,d)=>a+value(d),0),openN:open.length,
  weighted:open.reduce((a,d)=>a+value(d)*p[d.stage],0),
  won:list.filter(d=>d.stage==='won').reduce((a,d)=>a+value(d),0),wonN:list.filter(d=>d.stage==='won').length,
  late:open.filter(d=>d.next&&daysFrom(D.today,d.next.date)<0).length
 };
}

const ICON_CAL='<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 3.5h10v9.5H3zM3 6.5h10M5.5 2v3M10.5 2v3" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';

export function card(D,F,d,fresh){
 const S=D.S,o=D.owners.find(x=>x.id===d.owner),late=d.next&&daysFrom(D.today,d.next.date)<0&&!['won','lost'].includes(d.stage);
 const next=d.stage==='lost'?`<span class="fl-next is-lost">${esc(d.lostText)}</span>`:d.next?`<span class="fl-next${late?' is-late':''}">${ICON_CAL}<span>${esc(d.next.text)}</span><time datetime="${d.next.date}">${esc(F.rel(d.next.date))}</time></span>`:`<span class="fl-next is-none">${esc(S.noNext)}</span>`;
 return `<li><button type="button" class="fl-card${fresh?' is-fresh':''}" data-id="${d.id}" draggable="true" aria-label="${esc(`${d.co}, ${F.azn(value(d))}, ${o.name}`)}">`+
  `<span class="fl-card-top"><span class="fl-co">${esc(d.co)}</span><span class="fl-own" title="${esc(o.name)}">${esc(o.ini)}</span></span>`+
  `<span class="fl-val">${F.azn(value(d))}</span>`+
  `<span class="fl-terms">${esc(F.terms(d))}</span>${next}</button></li>`;
}

export function board(D,F,st,fresh){
 const S=D.S,stages=visibleStages(D,st);
 const cols=stages.map(s=>{
  const list=D.deals.filter(d=>d.stage===s.id&&matches(d,st));
  return {s,list,sum:list.reduce((a,d)=>a+value(d),0)};
 });
 const max=Math.max(1,...cols.map(c=>c.sum));
 const tabs=cols.map(c=>`<button type="button" class="fl-tab" data-stage="${c.s.id}" aria-pressed="${c.s.id===st.stage}" aria-controls="fl-col-${c.s.id}">${esc(c.s.name)} <b>${c.list.length}</b></button>`).join('');
 const html=cols.map(c=>`<section class="fl-col${c.s.id===st.stage?' is-current':''}" id="fl-col-${c.s.id}" data-stage="${c.s.id}" aria-labelledby="fl-h-${c.s.id}">`+
  `<header class="fl-col-head"><h3 id="fl-h-${c.s.id}">${esc(c.s.name)} <span class="fl-count">${c.list.length}</span></h3>`+
  `<p class="fl-sum"><span>${F.azn(c.sum)}</span>${c.s.p&&c.s.p<100?`<span class="fl-prob">${F.fill(S.prob,{p:c.s.p})}</span>`:''}</p>`+
  `<svg class="fl-bar" aria-hidden="true" width="100%" height="6"><rect class="fl-bar-track" width="100%" height="6" rx="3"/><rect class="fl-bar-fill" width="${c.sum?Math.max(2,c.sum/max*100).toFixed(1):0}%" height="6" rx="3"/></svg></header>`+
  (c.list.length?`<ol class="fl-cards">${c.list.map(d=>card(D,F,d,fresh===d.id)).join('')}</ol>`:`<p class="fl-empty-col">${esc(S.emptyCol)}</p>`)+`</section>`).join('');
 return {tabs,html,any:cols.some(c=>c.list.length)};
}

export function summary(D,F,st){
 const t=totals(D,st),S=D.S;
 return `<div><dt>${esc(S.sOpen)}</dt><dd>${F.azn(t.open)}</dd><dd class="fl-sub">${esc(F.fill(S.sDeals,{n:t.openN}))}</dd></div>`+
  `<div><dt>${esc(S.sWeighted)}</dt><dd>${F.azn(t.weighted)}</dd><dd class="fl-sub">${esc(S.sWeightedHint)}</dd></div>`+
  `<div><dt>${esc(S.sWon)}</dt><dd>${F.azn(t.won)}</dd><dd class="fl-sub">${esc(F.fill(S.sDeals,{n:t.wonN}))}</dd></div>`+
  `<div class="${t.late?'is-late':''}"><dt>${esc(S.sLate)}</dt><dd>${F.n(t.late)}</dd><dd class="fl-sub">${esc(S.sLateHint)}</dd></div>`;
}

export function ownerChips(D,st){
 const S=D.S,open=d=>!['won','lost'].includes(d.stage);
 const chip=(id,label,n)=>`<button type="button" class="fl-chip" data-owner="${id}" aria-pressed="${st.owner===id}">${esc(label)} <b>${n}</b></button>`;
 return chip('all',S.all,D.deals.filter(open).length)+D.owners.map(o=>chip(o.id,o.name.split(' ')[0],D.deals.filter(d=>open(d)&&d.owner===o.id).length)).join('');
}
