import '../ribbon.css';
import './style.css';
import '../../i18n.js';

const D=JSON.parse(document.getElementById('k-data').textContent);
const R=D.r,C=D.cal,ROOMS=D.rooms;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const fill=(s,v)=>s.replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const SEP={az:'.',ru:' ',en:','}[D.lang]||'.';
const num=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,SEP);
const azn=n=>`${num(n)} AZN`;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');

const pad=n=>String(n).padStart(2,'0');
const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parse=s=>new Date(s+'T00:00');
const addDays=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const today=(()=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate())})();
const nightsOf=(a,b)=>Math.round((b-a)/864e5);
const dm=d=>`${d.getDate()} ${C.mong[d.getMonth()]}`;
const range=(a,b)=>a.getMonth()===b.getMonth()&&a.getFullYear()===b.getFullYear()?`${a.getDate()}–${b.getDate()} ${C.mong[b.getMonth()]}`:`${dm(a)} – ${dm(b)}`;

// Sample occupancy: deterministic per room type and night, heavier on Friday/Saturday.
function booked(id,d){
 let h=7;for(const c of id+iso(d))h=(h*33+c.charCodeAt(0))>>>0;
 const wd=d.getDay(),cnt=ROOMS[id].count;
 const r=h%10,we=wd===5||wd===6;
 const b=we?(r<3?0:r<6?1:r<8?2:cnt):(r<5?0:r<8?1:r<9?2:cnt);
 return Math.min(b,cnt);
}
const freeFor=(id,a,n)=>{let f=ROOMS[id].count;for(let i=0;i<n;i++)f=Math.min(f,ROOMS[id].count-booked(id,addDays(a,i)));return f};

const st={start:null,end:null,view:new Date(today.getFullYear(),today.getMonth(),1),adults:2,kids:0,room:null};
const oneMonth=matchMedia('(max-width: 980px)');
const calEl=$('.au-cal'),msg=$('.au-msg');
const maxView=new Date(today.getFullYear(),today.getMonth()+6,1);

function renderCal(){
 const months=(oneMonth.matches?[0]:[0,1]).map(k=>new Date(st.view.getFullYear(),st.view.getMonth()+k,1));
 const order=[1,2,3,4,5,6,0];// week starts on Monday
 calEl.innerHTML=months.map(m=>{
  const first=(m.getDay()+6)%7,days=new Date(m.getFullYear(),m.getMonth()+1,0).getDate();
  let cells='';for(let i=0;i<first;i++)cells+='<span></span>';
  for(let d=1;d<=days;d++){
   const dt=new Date(m.getFullYear(),m.getMonth(),d),s=iso(dt);
   const past=dt<today;
   const inR=st.start&&st.end&&dt>parse(st.start)&&dt<parse(st.end);
   const isS=s===st.start,isE=s===st.end;
   const lbl=`${d} ${C.mong[m.getMonth()]}${isS?', '+R.start:isE?', '+R.end:''}`;
   cells+=`<button type="button" data-d="${s}" class="${inR?'in':''}${isS?' s':''}${isE?' e':''}"${past?' disabled':''} aria-pressed="${isS||isE}" aria-label="${esc(lbl)}" tabindex="-1">${d}</button>`;
  }
  return `<div class="au-month"><h3>${esc(C.mon[m.getMonth()])} ${m.getFullYear()}</h3><div class="au-wd" aria-hidden="true">${order.map(i=>`<span>${esc(C.wd[i])}</span>`).join('')}</div><div class="au-days">${cells}</div></div>`;
 }).join('');
 $('[data-month="-1"]').disabled=st.view<=new Date(today.getFullYear(),today.getMonth(),1);
 $('[data-month="1"]').disabled=st.view>=maxView;
 const focusable=$(`button[data-d="${st.end||st.start}"]`,calEl)||$('button:not([disabled])',calEl);
 if(focusable)focusable.tabIndex=0;
}
calEl.addEventListener('click',e=>{const b=e.target.closest('button[data-d]');if(b)pick(b.dataset.d)});
calEl.addEventListener('keydown',e=>{
 const b=e.target.closest('button[data-d]');if(!b)return;
 const k={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key];if(!k)return;
 e.preventDefault();
 const nd=addDays(parse(b.dataset.d),k);if(nd<today)return;
 let nb=$(`button[data-d="${iso(nd)}"]`,calEl);
 if(!nb){st.view=new Date(st.view.getFullYear(),st.view.getMonth()+(k>0?1:-1),1);renderCal();nb=$(`button[data-d="${iso(nd)}"]`,calEl)}
 if(nb){$$('button[data-d]',calEl).forEach(x=>x.tabIndex=-1);nb.tabIndex=0;nb.focus()}
});
function pick(s){
 if(!st.start||st.end||parse(s)<=parse(st.start)){st.start=s;st.end=null}
 else st.end=s;
 st.room=null;
 renderCal();update();
oneMonth.addEventListener('change',renderCal);
 const b=$(`button[data-d="${s}"]`,calEl);if(b)b.focus();
}
$$('[data-month]').forEach(b=>b.addEventListener('click',()=>{st.view=new Date(st.view.getFullYear(),st.view.getMonth()+ +b.dataset.month,1);renderCal()}));
$('.au-clear').addEventListener('click',()=>{st.start=st.end=null;st.room=null;renderCal();update()});
$$('[data-step]').forEach(b=>b.addEventListener('click',()=>{
 const k=b.dataset.step,lim=k==='adults'?[1,4]:[0,2];
 st[k]=Math.max(lim[0],Math.min(lim[1],st[k]+ +b.dataset.d));
 $(`[data-v="${k}"]`).textContent=st[k];
 if(st.room&&!fits(st.room))st.room=null;
 update();
}));
const fits=id=>st.adults<=ROOMS[id].adults&&st.adults+st.kids<=ROOMS[id].total;

function stayError(){
 if(!st.start)return R.pickArrival;
 if(!st.end)return R.pickDeparture;
 const a=parse(st.start),n=nightsOf(a,parse(st.end));
 if(n>14)return R.tooLong;
 if(n<2){const wd=a.getDay();if(wd===5||wd===6)return R.weekend}
 return '';
}
const nightsText=n=>n===1?R.night1:fill(R.nights,{n});

function update(){
 $('[data-p=start]').textContent=st.start?dm(parse(st.start)):'—';
 $('[data-p=end]').textContent=st.end?dm(parse(st.end)):'—';
 const er=stayError(),ok=!er;
 const n=st.start&&st.end?nightsOf(parse(st.start),parse(st.end)):0;
 $('[data-p=nights]').textContent=n?nightsText(n):'—';
 msg.textContent=er;msg.classList.toggle('bad',!!er&&!!st.end||er===R.weekend);
 $('.au-compare').classList.toggle('ready',ok);
 $('.au-compare-empty').hidden=ok;
 for(const tr of $$('.au-table tbody tr')){
  const id=tr.dataset.room,r=ROOMS[id],cell=$('.au-stay-text',tr),btn=$('.au-choose',tr);
  tr.classList.remove('off','sel');btn.disabled=true;btn.textContent=R.choose;btn.setAttribute('aria-pressed','false');
  if(!ok){cell.textContent='—';continue}
  const free=freeFor(id,parse(st.start),n),g=st.adults+st.kids;
  if(!fits(id)){cell.innerHTML=`<span class="au-no">${esc(fill(R.tooMany,{g}))}</span>`;tr.classList.add('off');continue}
  if(!free){cell.innerHTML=`<span class="au-no">${esc(R.soldout)}</span>`;tr.classList.add('off');continue}
  cell.innerHTML=`<span class="au-calc">${esc(nightsText(n))} × ${num(r.price)} =</span> <b>${azn(r.price*n)}</b><span class="au-left">${esc(free===1?R.left1:fill(R.left,{n:free}))}</span>`;
  btn.disabled=false;
  if(st.room===id){tr.classList.add('sel');btn.textContent=R.chosen;btn.setAttribute('aria-pressed','true')}
 }
 const enq=$('#au-enquiry');
 enq.hidden=!(ok&&st.room);
 if(!enq.hidden)summary();
}
$$('.au-choose').forEach(b=>b.addEventListener('click',()=>{
 const wasHidden=$('#au-enquiry').hidden;
 st.room=b.dataset.choose;update();
 if(wasHidden){$('#au-enquiry').scrollIntoView({behavior:reduce.matches?'auto':'smooth',block:'start'});$('.au-form input[name=name]').focus({preventScroll:true})}
}));

const form=$('.au-form'),sum=$('.au-sum dl'),done=$('.au-done');
function totals(){
 const n=nightsOf(parse(st.start),parse(st.end)),room=ROOMS[st.room].price*n,tr=+form.elements.transfer.value;
 return {n,room,tr,total:room+tr};
}
function summary(){
 const x=totals(),r=ROOMS[st.room];
 const g=fill(R.gAdults,{a:st.adults})+(st.kids?', '+fill(R.gKids,{k:st.kids}):'');
 sum.innerHTML=[[R.dates,`${range(parse(st.start),parse(st.end))}<br><small>${esc(nightsText(x.n))}</small>`],[R.room,`${esc(r.name)}<br><small>${x.n} × ${num(r.price)} = ${azn(x.room)}</small>`],[R.guests,esc(g)],[R.transfer,x.tr?azn(x.tr):esc(R.none)],[R.total,`<b>${azn(x.total)}</b>`]].map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('');
}
$$('input[name=transfer]',form).forEach(i=>i.addEventListener('change',summary));

function setErr(name,m){
 const i=form.elements[name],e=$(`#au-e-${name}`);
 e.hidden=!m;e.textContent=m||'';i.setAttribute('aria-invalid',m?'true':'false');
}
const emailOk=v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const phoneOk=v=>/^\+?\d{9,15}$/.test(v.replace(/[\s()-]/g,''));
['name','email','phone'].forEach(n=>form.elements[n].addEventListener('input',()=>setErr(n,'')));
form.addEventListener('submit',e=>{
 e.preventDefault();
 const name=form.elements.name.value.trim(),email=form.elements.email.value.trim(),phone=form.elements.phone.value.trim();
 setErr('name',name.length>2?'':R.nameErr);
 setErr('email',email&&!emailOk(email)?R.emailErr:(!email&&!phone?R.contactErr:''));
 setErr('phone',phone&&!phoneOk(phone)?R.phoneErr:'');
 const bad=$$('[aria-invalid=true]',form)[0];
 if(bad){bad.focus();return}
 const x=totals();
 done.innerHTML=`<h3>${esc(R.doneH)}</h3><p>${esc(fill(R.done,{name,room:ROOMS[st.room].name,dates:range(parse(st.start),parse(st.end)),nights:nightsText(x.n),total:azn(x.total)}))}</p><p class="au-demo">${esc(R.demo)}</p><button type="button" class="au-btn au-ghost" data-again>${esc(R.again)}</button>`;
 form.hidden=true;done.hidden=false;done.focus();
 $('[data-again]',done).addEventListener('click',()=>{
  form.reset();form.hidden=false;done.hidden=true;st.start=st.end=st.room=null;renderCal();update();
oneMonth.addEventListener('change',renderCal);
  document.getElementById('au-stay').scrollIntoView({behavior:reduce.matches?'auto':'smooth'});$('button[data-d]:not([disabled])',calEl).focus({preventScroll:true});
 });
});

renderCal();update();
oneMonth.addEventListener('change',renderCal);
