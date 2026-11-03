// Shared, pure logic + HTML for Reserve: used at build time (index.js) and in the browser (app.js).
export const OPEN=600,CLOSE=1260,STEP=15,ROWS=(CLOSE-OPEN)/STEP; // 10:00–21:00 in 15-minute rows
export const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export const hm=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
const DAY=864e5;
const parse=iso=>{const [y,m,d]=iso.split('-').map(Number);return Date.UTC(y,m-1,d)};
export const addDays=(iso,n)=>new Date(parse(iso)+n*DAY).toISOString().slice(0,10);
export const diffDays=(a,b)=>Math.round((parse(b)-parse(a))/DAY);
export const weekday=iso=>(new Date(parse(iso)).getUTCDay()+6)%7; // 0 = Monday
export const monday=iso=>addDays(iso,-weekday(iso));

// The shift of a barber on a date, or null on a day off / when the shop is closed.
export function shift(D,b,iso){
 if(D.closed.includes(weekday(iso))||b.off===weekday(iso))return null;
 return {from:b.from,to:b.to,br:b.br,brEnd:b.br+b.brLen};
}
const overlap=(a1,a2,b1,b2)=>a1<b2&&b1<a2;

// Deterministic sample bookings: the same date always produces the same day.
function rng(seed){let h=1779033703^seed.length;for(let i=0;i<seed.length;i++){h=Math.imul(h^seed.charCodeAt(i),3432918353);h=h<<13|h>>>19}return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);h^=h>>>16;return(h>>>0)/4294967296}}
export function seed(D){
 const out=[];let id=1;const start=monday(D.today);
 for(let day=-7;day<14;day++){
  const iso=addDays(start,day),ahead=diffDays(D.today,iso);
  const fill=ahead<0?.74:ahead===0?.6:ahead<4?.62:ahead<8?.42:ahead<14?.2:0;
  for(const b of D.barbers){
   const s=shift(D,b,iso);if(!s)continue;
   const r=rng(iso+b.id),svc=D.services.filter(x=>x.by.includes(b.id));
   let t=s.from;
   while(t<s.to){
    if(r()>fill){t+=STEP*(1+Math.floor(r()*3));continue}
    const sv=svc[Math.floor(r()*svc.length)];
    if(t+sv.dur>s.to)break;
    if(overlap(t,t+sv.dur,s.br,s.brEnd)){t=s.brEnd;continue}
    const n=Math.floor(r()*D.names.length),p=Math.floor(r()*90);
    out.push({id:id++,barber:b.id,date:iso,start:t,svc:sv.id,client:D.names[n],phone:`+994 ${['50','51','55','70','77'][n%5]} ${200+p*7} ${10+p} ${String(10+(n*13+p)%89).padStart(2,'0')}`,status:'ok'});
    t+=sv.dur+(r()<.35?STEP:0);
   }
  }
 }
 return out;
}

export const active=(D,iso)=>D.bookings.filter(x=>x.date===iso&&x.status==='ok');

// Free start times for one barber: inside the shift, outside the break, no overlap with live bookings,
// not in the past. `ignore` lets a booking be moved without colliding with itself.
export function freeSlots(D,b,iso,dur,ignore){
 const s=shift(D,b,iso);if(!s)return [];
 const ahead=diffDays(D.today,iso);if(ahead<0)return [];
 const busy=active(D,iso).filter(x=>x.barber===b.id&&x.id!==ignore).map(x=>[x.start,x.start+svcOf(D,x.svc).dur]);
 busy.push([s.br,s.brEnd]);
 const res=[];
 for(let t=s.from;t+dur<=s.to;t+=STEP){
  if(ahead===0&&t<D.now)continue;
  if(!busy.some(([a,z])=>overlap(t,t+dur,a,z)))res.push(t);
 }
 return res;
}
export const svcOf=(D,id)=>D.services.find(s=>s.id===id);
export const barberOf=(D,id)=>D.barbers.find(b=>b.id===id);

export function dayStats(D,iso){
 let open=0,booked=0,rev=0,n=0;
 for(const b of D.barbers){const s=shift(D,b,iso);if(s)open+=s.to-s.from-(s.brEnd-s.br)}
 for(const x of active(D,iso)){const sv=svcOf(D,x.svc);booked+=sv.dur;rev+=sv.price;n++}
 return {open,booked,rev,n,pct:open?Math.round(booked/open*100):0};
}

export function makeFmt(D){
 const dt=iso=>new Date(parse(iso));
 return {
  fill:(s,v)=>s.replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m),
  long:iso=>`${D.wdLong[weekday(iso)]}, ${dt(iso).getUTCDate()} ${D.monthsGen[dt(iso).getUTCMonth()]}`,
  short:iso=>`${dt(iso).getUTCDate()} ${D.monthsShort[dt(iso).getUTCMonth()]}`,
  wd:iso=>D.wdShort[weekday(iso)],day:iso=>dt(iso).getUTCDate(),
  azn:n=>`${n} AZN`,
  dur:m=>m<60?D.S.min.replace('{n}',m):m%60?D.S.hmin.replace('{h}',Math.floor(m/60)).replace('{n}',m%60):D.S.hour.replace('{h}',m/60)
 };
}

export function week(D,F,iso){
 const m=monday(iso);
 return Array.from({length:7},(_,i)=>{
  const d=addDays(m,i),st=dayStats(D,d),closed=!st.open;
  return `<li><button type="button" class="rs-day${d===iso?' is-on':''}${d===D.today?' is-today':''}${closed?' is-closed':''}" data-date="${d}" aria-pressed="${d===iso}" aria-label="${esc(F.long(d))}: ${esc(closed?D.S.closed:F.fill(D.S.dayAria,{n:st.n,p:st.pct}))}">`+
   `<span class="rs-day-wd">${esc(F.wd(d))}</span><span class="rs-day-n">${F.day(d)}</span>`+
   `<span class="rs-day-meta">${closed?esc(D.S.closedShort):`<span><b>${st.n}</b><span class="rs-day-w"> ${esc(D.S.bookW)}</span></span><span class="rs-day-p">${st.pct}%</span>`}</span>`+
   `<svg class="rs-util" width="100%" height="4" aria-hidden="true"><rect class="rs-util-t" width="100%" height="4" rx="2"/><rect class="rs-util-f" width="${st.pct}%" height="4" rx="2"/></svg></button></li>`;
 }).join('');
}

const row=t=>(t-OPEN)/STEP+1;
// Day grid: a time rail plus one column per barber. Blocks are placed with r-/s- classes (rows) because CSP forbids inline styles.
export function grid(D,F,iso,{sel,ghost,fresh,moving}={}){
 const S=D.S,ahead=diffDays(D.today,iso);
 const rail=Array.from({length:CLOSE/60-OPEN/60},(_,i)=>`<span class="r${i*4+1} s4">${hm(OPEN+i*60)}</span>`).join('');
 const cols=D.barbers.map(b=>{
  const s=shift(D,b,iso),list=active(D,iso).filter(x=>x.barber===b.id).sort((a,z)=>a.start-z.start);
  let blocks='';
  if(!s)blocks=`<div class="rs-off r1 s${ROWS}"><span>${esc(S.dayOff)}</span></div>`;
  else{
   if(s.from>OPEN)blocks+=`<div class="rs-off r1 s${(s.from-OPEN)/STEP}" aria-hidden="true"></div>`;
   if(s.to<CLOSE)blocks+=`<div class="rs-off r${row(s.to)} s${(CLOSE-s.to)/STEP}" aria-hidden="true"></div>`;
   blocks+=`<div class="rs-break r${row(s.br)} s${(s.brEnd-s.br)/STEP}"><span>${esc(S.breakL)}</span></div>`;
   for(const x of list){
    const sv=svcOf(D,x.svc),past=ahead<0||(ahead===0&&x.start+sv.dur<=D.now);
    blocks+=`<button type="button" class="rs-b r${row(x.start)} s${sv.dur/STEP}${past?' is-past':''}${sel===x.id?' is-sel':''}${fresh===x.id?' is-fresh':''}${moving===x.id?' is-moving':''}${sv.dur<=30?' is-short':''}" data-id="${x.id}" aria-label="${esc(`${hm(x.start)}–${hm(x.start+sv.dur)}, ${x.client}, ${sv.name}, ${b.name}`)}">`+
     `<span class="rs-b-t">${hm(x.start)}</span><span class="rs-b-c">${esc(x.client)}</span><span class="rs-b-s">${esc(sv.name)}</span></button>`;
   }
   if(ghost&&ghost.barber===b.id)blocks+=`<div class="rs-ghost r${row(ghost.start)} s${ghost.dur/STEP}" aria-hidden="true"><span>${hm(ghost.start)}–${hm(ghost.start+ghost.dur)}</span><span>${esc(S.ghost)}</span></div>`;
  }
  const n=list.length;
  return `<section class="rs-col${s?'':' is-off'}" data-barber="${b.id}" aria-label="${esc(b.name)}"><header class="rs-col-h"><span class="rs-ava" aria-hidden="true">${esc(b.name[0])}</span><span><b>${esc(b.name)}</b><small>${s?`${hm(s.from)}–${hm(s.to)}, ${esc(F.fill(S.nBook,{n}))}`:esc(S.dayOff)}</small></span></header><div class="rs-lane">${blocks}</div></section>`;
 }).join('');
 return `<div class="rs-rail" aria-hidden="true"><span class="rs-rail-h"></span><div class="rs-rail-lane">${rail}</div></div>${cols}`;
}
