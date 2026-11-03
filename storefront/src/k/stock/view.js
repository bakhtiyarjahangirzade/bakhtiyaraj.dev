// Stockroom model + HTML, shared by the build (index.js) and the browser (app.js). Pure functions only.
export const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const DAY=864e5,parse=iso=>{const [y,m,d]=iso.split('-').map(Number);return Date.UTC(y,m-1,d)};
export const addDays=(iso,n)=>new Date(parse(iso)+n*DAY).toISOString().slice(0,10);
export const OPEN=['new','picking'];

export const sku=(D,code)=>D.skus.find(s=>s.code===code);
export const reserved=(D,code)=>D.orders.filter(o=>OPEN.includes(o.status)).reduce((a,o)=>a+o.lines.filter(l=>l[0]===code).reduce((x,l)=>x+l[1],0),0);
export const avail=(D,s)=>Math.round((s.on-reserved(D,s.code))*10)/10;
export function status(D,s){const a=avail(D,s);return s.on<=0||a<=0?'out':a<s.min?'low':'ok'}
export const cover=(D,s)=>Math.max(0,avail(D,s))/s.use;
// Reorder when stock still expected after the supplier's lead time would sit below the minimum.
export function suggestion(D,s){
 const a=avail(D,s),proj=a+s.onOrder-s.use*s.lead;
 if(proj>=s.min)return null;
 const need=s.min+s.use*(s.lead+14)-a-s.onOrder;
 return {qty:Math.max(s.mult,Math.ceil(need/s.mult)*s.mult),proj,arrive:addDays(D.today,s.lead)};
}

export function makeFmt(D){
 const en=D.locale.startsWith('en'),G=en?',':' ',P=en?'.':',';
 const group=x=>{const neg=x<0,[i,f]=Math.abs(x).toFixed(x%1?1:0).split('.');return (neg?'−':'')+i.replace(/\B(?=(\d{3})+(?!\d))/g,G)+(f&&f!=='0'?P+f:'')};
 const F={
  n:group,
  q:(x,u)=>`${group(Math.round(x*10)/10)} ${D.units[u]}`,
  azn:x=>`${group(Math.round(x))} AZN`,
  date:iso=>{const d=new Date(parse(iso));return `${d.getUTCDate()} ${D.months[d.getUTCMonth()]}`},
  fill:(s,v)=>s.replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m),
  days:x=>x>=99?'99+':group(Math.floor(x))
 };
 return F;
}

const ICON={ok:'M4 10.5 8 14l8-8',low:'M10 4v7M10 14.5v.5',out:'M5 5l10 10M15 5 5 15'};
export const ico=(k,cls='')=>`<svg class="${cls}" viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="${ICON[k]}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;
export const badge=(D,st)=>`<span class="sr-st is-${st}">${ico(st)}${esc(D.S.st[st])}</span>`;

// Level bar: available stock against the minimum (tick). Scale = the larger of 2.5 × minimum or available.
export function level(D,s){
 const a=Math.max(0,avail(D,s)),max=Math.max(s.min*2.5,a,1),w=a/max*100,m=s.min/max*100,st=status(D,s);
 return `<svg class="sr-level is-${st}" width="100%" height="12" aria-hidden="true"><rect class="sr-level-t" y="3" width="100%" height="6" rx="3"/>${a?`<rect class="sr-level-f" y="3" width="${Math.max(2,w).toFixed(1)}%" height="6" rx="3"/>`:''}<rect class="sr-level-m" x="${m.toFixed(1)}%" y="0" width="2" height="12"/></svg>`;
}

export function filtered(D,st){
 const q=st.q.trim().toLocaleLowerCase(),order={out:0,low:1,ok:2};
 let list=D.skus.filter(s=>(st.cat==='all'||s.cat===st.cat)&&(st.st==='all'||(st.st==='attn'?status(D,s)!=='ok':status(D,s)===st.st))&&(!q||`${s.code} ${s.name}`.toLocaleLowerCase().includes(q)));
 const key={name:s=>s.name,avail:s=>avail(D,s)/Math.max(s.min,1),cover:s=>cover(D,s),status:s=>order[status(D,s)]*1000+cover(D,s)}[st.sort]||null;
 if(key)list=[...list].sort((a,b)=>{const x=key(a),y=key(b);return (typeof x==='string'?x.localeCompare(y,D.locale):x-y)*st.dir});
 return list;
}

export function rows(D,F,st,fresh){
 const list=filtered(D,st);
 return {n:list.length,html:list.map(s=>{
  const r=reserved(D,s.code),a=avail(D,s),stt=status(D,s);
  return `<tr class="${st.sel===s.code?'is-sel ':''}${fresh===s.code?'is-fresh':''}" data-code="${s.code}">`+
   `<th scope="row"><button type="button" class="sr-sku" data-code="${s.code}" aria-pressed="${st.sel===s.code}"><span class="sr-code">${s.code}</span><span class="sr-name">${esc(s.name)}</span></button></th>`+
   `<td class="sr-c-loc" data-l="${esc(D.S.colLoc)}">${s.loc}</td>`+
   `<td class="sr-num sr-c-on" data-l="${esc(D.S.colOn)}">${F.q(s.on,s.unit)}</td>`+
   `<td class="sr-num sr-c-res" data-l="${esc(D.S.colRes)}">${r?F.q(r,s.unit):'—'}</td>`+
   `<td class="sr-num sr-c-av" data-l="${esc(D.S.colAvail)}"><b>${F.q(a,s.unit)}</b>${s.onOrder?`<small>${esc(F.fill(D.S.onOrderShort,{q:F.q(s.onOrder,s.unit)}))}</small>`:''}</td>`+
   `<td class="sr-c-lvl" data-l="${esc(D.S.colLevel)}">${level(D,s)}<small>${esc(F.fill(D.S.minShort,{q:F.q(s.min,s.unit)}))}</small></td>`+
   `<td class="sr-num sr-c-cov" data-l="${esc(D.S.colCover)}">${esc(F.fill(D.S.daysN,{n:F.days(cover(D,s))}))}</td>`+
   `<td class="sr-c-st">${badge(D,stt)}</td></tr>`;
 }).join('')};
}

export function counts(D){
 const c={low:0,out:0};for(const s of D.skus){const x=status(D,s);if(x!=='ok')c[x]++}
 return {...c,open:D.orders.filter(o=>OPEN.includes(o.status)).length,sugg:D.skus.filter(s=>suggestion(D,s)).length};
}

// Order card: lines with stock check; shipping is blocked while any line exceeds what is on hand.
export function orderShort(D,o){return o.lines.filter(([c,q])=>sku(D,c).on<q)}
export function ordersHTML(D,F,fresh){
 const S=D.S,list=[...D.orders].sort((a,b)=>(OPEN.includes(b.status)-OPEN.includes(a.status))||b.no-a.no);
 return list.map(o=>{
  const short=OPEN.includes(o.status)?orderShort(D,o):[];
  const act=o.status==='new'?`<button type="button" class="sr-btn" data-act="pick" data-no="${o.no}">${esc(S.startPick)}</button>`:o.status==='picking'?`<button type="button" class="sr-btn sr-btn-primary" data-act="ship" data-no="${o.no}"${short.length?' aria-disabled="true"':''} aria-describedby="sr-o${o.no}-m">${esc(S.shipOrder)}</button>`:'';
  const due=o.status==='shipped'?F.fill(S.shippedOn,{d:F.date(o.shipped||o.due)}):F.fill(S.dueOn,{d:o.due===D.today?S.today:F.date(o.due)});
  return `<article class="sr-order is-${o.status}${fresh===o.no?' is-fresh':''}" id="sr-o${o.no}" aria-labelledby="sr-o${o.no}-h"><header><h3 id="sr-o${o.no}-h"><span>SF-${o.no}</span>${esc(o.cafe)}</h3><span class="sr-ost is-${o.status}">${esc(S.ost[o.status])}</span></header>`+
   `<p class="sr-odue">${esc(due)}</p><ul class="sr-olines">${o.lines.map(([c,q])=>{const s=sku(D,c),bad=short.some(x=>x[0]===c);return `<li class="${bad?'is-short':''}"><span><span class="sr-code">${c}</span> ${esc(s.name)}</span><b>${F.q(q,s.unit)}</b>${bad?`<em>${esc(F.fill(S.onlyHave,{q:F.q(s.on,s.unit)}))}</em>`:''}</li>`}).join('')}</ul>`+
   `<footer><p id="sr-o${o.no}-m" class="sr-omsg">${short.length?esc(F.fill(S.blocked,{n:short.length})):''}</p>${act}</footer></article>`;
 }).join('');
}

export function logHTML(D,F,filter){
 const S=D.S,list=D.log.filter(e=>!filter||e.code===filter).slice().reverse();
 if(!list.length)return `<p class="sr-empty-s">${esc(S.logEmpty)}</p>`;
 return `<table class="sr-log"><thead><tr><th scope="col">${esc(S.colWhen)}</th><th scope="col">${esc(S.colType)}</th><th scope="col">${esc(S.colItem)}</th><th scope="col" class="sr-num">${esc(S.colDelta)}</th><th scope="col" class="sr-num">${esc(S.colBal)}</th><th scope="col">${esc(S.colRef)}</th></tr></thead><tbody>`+
  list.map(e=>{const s=sku(D,e.code);return `<tr class="${e.fresh?'is-fresh':''}"><td data-l="${esc(S.colWhen)}">${esc(F.date(e.date))} ${e.time}</td><td data-l="${esc(S.colType)}"><span class="sr-mt is-${e.type}">${esc(S.mt[e.type])}</span></td><td data-l="${esc(S.colItem)}"><span class="sr-code">${e.code}</span> ${esc(s.name)}</td><td class="sr-num ${e.delta<0?'is-neg':'is-pos'}" data-l="${esc(S.colDelta)}">${e.delta>0?'+':''}${F.q(e.delta,s.unit)}</td><td class="sr-num" data-l="${esc(S.colBal)}">${F.q(e.bal,s.unit)}</td><td data-l="${esc(S.colRef)}">${esc([e.ref,e.reason&&D.reasons[e.reason]||e.note,e.by].filter(Boolean).join(', '))}</td></tr>`}).join('')+`</tbody></table>`;
}

export function reorderHTML(D,F){
 const S=D.S,list=D.skus.map(s=>[s,suggestion(D,s)]).filter(x=>x[1]).sort((a,b)=>cover(D,a[0])-cover(D,b[0]));
 if(!list.length)return `<p class="sr-empty-s">${esc(S.noSugg)}</p>`;
 const total=list.reduce((a,[s,g])=>a+g.qty*s.cost,0);
 return `<table class="sr-re"><thead><tr><th scope="col">${esc(S.colItem)}</th><th scope="col" class="sr-num">${esc(S.colAvail)}</th><th scope="col" class="sr-num">${esc(S.colUse)}</th><th scope="col" class="sr-num">${esc(S.colLead)}</th><th scope="col" class="sr-num">${esc(S.colSugg)}</th><th scope="col">${esc(S.colSup)}</th><th scope="col"><span class="sr-only">${esc(S.colAction)}</span></th></tr></thead><tbody>`+
  list.map(([s,g])=>`<tr><th scope="row"><span class="sr-code">${s.code}</span> ${esc(s.name)}<small>${esc(F.fill(S.whyRe,{p:F.q(Math.max(0,g.proj),s.unit),min:F.q(s.min,s.unit),d:F.date(g.arrive)}))}</small></th>`+
   `<td class="sr-num" data-l="${esc(S.colAvail)}">${F.q(avail(D,s),s.unit)}${s.onOrder?`<small>${esc(F.fill(S.onOrderShort,{q:F.q(s.onOrder,s.unit)}))}</small>`:''}</td><td class="sr-num" data-l="${esc(S.colUse)}">${esc(F.fill(S.perDay,{q:F.q(s.use,s.unit)}))}</td><td class="sr-num" data-l="${esc(S.colLead)}">${esc(F.fill(S.daysN,{n:s.lead}))}</td>`+
   `<td class="sr-num" data-l="${esc(S.colSugg)}"><b>${F.q(g.qty,s.unit)}</b>${s.cost?`<small>≈ ${F.azn(g.qty*s.cost)}</small>`:''}</td><td data-l="${esc(S.colSup)}">${esc(s.supName)}</td>`+
   `<td><button type="button" class="sr-btn" data-act="${s.sup==='own'?'plan':'po'}" data-code="${s.code}" data-qty="${g.qty}">${esc(s.sup==='own'?S.planRoast:S.placePO)}</button></td></tr>`).join('')+
  `</tbody></table><p class="sr-re-total">${esc(F.fill(S.reTotal,{sum:F.azn(total)}))}</p>`;
}

export function detailHTML(D,F,code){
 const S=D.S,s=sku(D,code),r=reserved(D,code),a=avail(D,s),g=suggestion(D,s);
 const last=D.log.filter(e=>e.code===code).slice(-3).reverse();
 return `<div class="sr-d-head"><p class="sr-code">${s.code}</p><h3 id="sr-d-title">${esc(s.name)}</h3>${badge(D,status(D,s))}</div>
 <dl class="sr-d-nums"><div><dt>${esc(S.colOn)}</dt><dd>${F.q(s.on,s.unit)}</dd></div><div><dt>${esc(S.colRes)}</dt><dd>${F.q(r,s.unit)}</dd></div><div><dt>${esc(S.colAvail)}</dt><dd><b>${F.q(a,s.unit)}</b></dd></div></dl>
 <div class="sr-d-level">${level(D,s)}<p>${esc(F.fill(S.levelLine,{min:F.q(s.min,s.unit),use:F.q(s.use,s.unit),d:F.days(cover(D,s))}))}</p></div>
 <dl class="sr-d-meta"><div><dt>${esc(S.colLoc)}</dt><dd>${s.loc}</dd></div><div><dt>${esc(S.colSup)}</dt><dd>${esc(s.supName)}</dd></div><div><dt>${esc(S.colLead)}</dt><dd>${esc(F.fill(S.daysN,{n:s.lead}))}</dd></div></dl>
 ${s.onOrder?`<div class="sr-d-po"><p>${esc(F.fill(S.onOrderLine,{q:F.q(s.onOrder,s.unit)}))}</p><button type="button" class="sr-btn" data-act="receive-po" data-code="${s.code}">${esc(S.receivePO)}</button></div>`:g?`<p class="sr-d-sugg">${esc(F.fill(S.suggLine,{q:F.q(g.qty,s.unit)}))}</p>`:''}
 ${last.length?`<div class="sr-d-last"><h4>${esc(S.lastMoves)}</h4><ul>${last.map(e=>`<li><span>${esc(F.date(e.date))} ${e.time}, ${esc(S.mt[e.type])}</span><b class="${e.delta<0?'is-neg':'is-pos'}">${e.delta>0?'+':''}${F.q(e.delta,s.unit)}</b></li>`).join('')}</ul></div>`:''}`;
}
