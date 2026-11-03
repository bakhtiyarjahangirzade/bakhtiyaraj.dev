import '../ribbon.css';
import './style.css';
import '../../i18n.js';

const D=JSON.parse(document.getElementById('k-data').textContent);
const U=D.u,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const fill=(s,v)=>s.replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m);
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const P=Object.fromEntries(D.programmes.map(p=>[p.id,p]));
const CH=Object.fromEntries(D.channels.map(c=>[c.id,c]));
const hhmm=m=>`${String(Math.floor(m/60)%24).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');

// ---- clock: Baku time, minutes since midnight ----
function bakuNow(){
 const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Baku',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
 const g=t=>+p.find(x=>x.type===t).value;return g('hour')*60+g('minute')+g('second')/60;
}
// ?t=HH:MM fixes the clock (useful for reviewing a given moment of the day).
const fixed=(()=>{const m=/[?&]t=(\d\d):(\d\d)/.exec(location.search);return m?(+m[1])*60+(+m[2]):null})();
const now=()=>fixed??bakuNow();

// ---- airings: every block of today's running order, with state from the clock ----
const AIR=[];
for(const c of D.channels)D.running[c.id].forEach((b,i)=>{const [h,m]=b.t.split(':').map(Number);AIR.push({...b,ch:c.id,i,start:h*60+m,end:h*60+m+b.min,key:`${c.id}:${i}`})});
const airOf=k=>AIR.find(a=>a.key===k);
const stateOf=(a,t)=>t>=a.end?'past':t>=a.start?'now':'future';
const partNow=(p,a,t)=>{let acc=a.start;for(const x of p.parts){if(t<acc+x.min)return x;acc+=x.min}return p.parts[p.parts.length-1]};
const partInto=(p,a,t)=>{let acc=a.start;for(const x of p.parts){if(t<acc+x.min)return Math.floor(t-acc)+1;acc+=x.min}return 1};
const untilText=d=>{d=Math.max(1,Math.round(d));return d>=60?fill(U.startsIn,{h:Math.floor(d/60),m:d%60}):fill(U.startsInM,{m:d})};

// ---- running order layout (positions from JS; CSP allows element.style) ----
const grid=$('#r-grid'),wrap=$('#r-wrap');
const pxPerMin=()=>innerWidth<700?2.4:3.6;
const off=()=>$('.r-chan').offsetWidth;
function layout(){
 const k=pxPerMin();grid.style.width=(1440*k+off())+'px';
 for(const h of $$('.r-hr'))h.style.left=(off()+(+h.dataset.h)*60*k)+'px';
 for(const b of $$('.r-b')){b.style.left=(+b.dataset.start*k)+'px';b.style.width=(+b.dataset.min*k)+'px'}
}
function jumpToNow(smooth){const t=now(),k=pxPerMin();wrap.scrollTo({left:Math.max(0,(t-50)*k),behavior:smooth&&!reduce.matches?'smooth':'auto'})}

let filter='all',query='';
function paint(){
 const t=now(),k=pxPerMin();
 $('#ar-clock').textContent=hhmm(Math.floor(t));
 const line=$('#r-now');line.hidden=false;line.style.left=(off()+t*k)+'px';
 const nextOf={};
 for(const c of D.channels)nextOf[c.id]=AIR.find(a=>a.ch===c.id&&a.start>t);
 for(const el of $$('.r-b')){
  const a=AIR.find(x=>x.ch===el.dataset.ch&&x.i===+el.dataset.i),s=stateOf(a,t),p=P[a.p];
  el.classList.toggle('is-past',s==='past');el.classList.toggle('is-now',s==='now');el.classList.toggle('is-live',s==='now'&&a.live);el.classList.toggle('is-next',nextOf[a.ch]===a);
  el.classList.toggle('is-dim',filter!=='all'&&a.p&&p.cat!==filter);
  const st=$('[data-state]',el);
  st.textContent=s==='now'?(a.live?`${U.live}, ${fill(U.left,{m:Math.ceil(a.end-t)})}`:`${U.onAir}, ${fill(U.left,{m:Math.ceil(a.end-t)})}`):s==='past'?U.ended:nextOf[a.ch]===a?`${U.next}, ${untilText(a.start-t)}`:(a.live?U.live:a.part!==null?p.parts[a.part].name:p.tag);
  $('button',el).setAttribute('aria-label',`${a.t}, ${CH[a.ch].name}, ${p.title}. ${st.textContent}`);
 }
 // on now, per channel
 for(const li of $$('#ar-nowlist li')){
  const a=AIR.find(x=>x.ch===li.dataset.ch&&stateOf(x,t)==='now'),p=P[a.p],n=nextOf[a.ch];
  const pct=Math.round((t-a.start)/a.min*100);
  li.innerHTML=`<b>${esc(CH[a.ch].name)}</b><button type="button" class="ar-nt" data-prog="${p.id}" data-air="${a.key}">${a.live?`<span class="ar-live">${esc(U.live)}</span> `:''}<span class="ar-ntt">${esc(p.title)}</span><span class="ar-ntp">${esc(a.live?fill(U.nowPart,{p:partNow(p,a,t).name}):a.part!==null?p.parts[a.part].name:p.tag)}</span><span class="ar-bar"><i data-w="${pct}"></i></span><span class="ar-ntn">${n?`${esc(U.next)} ${hhmm(n.start)}: ${esc(P[n.p].title)}`:`${esc(fill(U.tomorrow,{t:'00:00'}))}`}</span></button>`;
  const bar=$('.ar-bar i',li);bar.style.width=bar.dataset.w+'%';
 }
 // feature: the live broadcast on now, otherwise the next live one; after the last one, tomorrow's derby
 const lives=AIR.filter(a=>a.live).sort((x,y)=>x.start-y.start);
 const f=lives.find(a=>stateOf(a,t)==='now'&&a.ch==='a1')||lives.find(a=>stateOf(a,t)==='now')||lives.find(a=>a.start>t)||AIR.find(a=>a.p==='derbi');
 setFeature(f,t);
 // catalogue badges and next airing
 for(const card of $$('.g-card')){
  const id=card.dataset.id,ons=AIR.filter(a=>a.p===id),cur=ons.find(a=>stateOf(a,t)==='now'),nx=ons.find(a=>a.start>t);
  const badge=$('[data-badge]',card);badge.hidden=!cur;if(cur){badge.textContent=cur.live?U.live:U.onAir;badge.classList.toggle('is-live',cur.live)}
  $('[data-when]',card).textContent=cur?`${CH[cur.ch].name}, ${hhmm(cur.start)}–${hhmm(cur.end)}`:nx?`${hhmm(nx.start)}, ${CH[nx.ch].name}`:U.replay;
 }
}
let featKey=null;
function setFeature(a,t){
 const p=P[a.p],s=stateOf(a,t);
 if(featKey!==a.key){
  featKey=a.key;
  $('#ar-fph').innerHTML=D.posters[p.id].big;
  $('#ar-lead-t').textContent=p.title;
  $('#ar-fwatch').dataset.watch=p.id;$('#ar-fwatch').dataset.air=a.key;$('#ar-fmore').dataset.prog=p.id;$('#ar-fmore').dataset.air=a.key;
 }
 $('#ar-ftag').textContent=`${p.tag}, ${CH[a.ch].name}, ${hhmm(a.start)}`;
 const live=s==='now';
 $('#ar-feature').classList.toggle('is-live',live);
 $('#ar-fkick').textContent=live?U.live:`${U.next}: ${s==='past'?fill(U.tomorrow,{t:hhmm(a.start)}):untilText(a.start-t)}`;
 $('#ar-fcount').textContent=live?fill(U.minute,{p:partNow(p,a,t).name,m:partInto(p,a,t)}):'';
 const w=$('#ar-fwatch');w.disabled=!live;w.textContent=live?U.watchLive:(s==='past'?U.watchFrom:hhmm(a.start));
 if(s==='past')w.disabled=false;
}

// ---- catalogue filter + search ----
const chips=$('.ar-chips'),q=$('#ar-q');
function filterCards(){
 let n=0;const term=q.value.trim().toLocaleLowerCase();
 for(const c of $$('#g-grid .g-card')){const p=P[c.dataset.id];const ok=(filter==='all'||p.cat===filter)&&(!term||`${p.title} ${p.tag} ${p.about} ${D.cats[p.cat]}`.toLocaleLowerCase().includes(term));c.hidden=!ok;if(ok)n++}
 $('#ar-empty').hidden=n>0;
}
chips.addEventListener('change',e=>{filter=e.target.value;filterCards();paint()});
q.addEventListener('input',filterCards);
$('#ar-clear').addEventListener('click',()=>{q.value='';filter='all';chips.querySelector('input[value=all]').checked=true;filterCards();paint();q.focus()});

// ---- My list (per-viewer convenience; works without storage) ----
const KEY='arena-mylist-v1';
let mine=[];try{mine=(JSON.parse(localStorage.getItem(KEY)||'[]')||[]).filter(id=>P[id])}catch{}
const saveList=()=>{try{localStorage.setItem(KEY,JSON.stringify(mine))}catch{}};
function renderList(){
 $('#ar-count').textContent=mine.length;
 $('#ar-lempty').hidden=mine.length>0;
 $('#ar-mine').innerHTML=mine.map(id=>{const p=P[id];return `<li class="g-card"><button type="button" class="g-open" data-prog="${id}"><span class="g-ph">${D.posters[id].card}</span><span class="g-cat r-c-${p.cat}">${esc(D.cats[p.cat])}</span><span class="g-title">${esc(p.title)}</span><span class="g-tag">${esc(p.tag)}</span></button><button type="button" class="g-rm" data-rm="${id}">${esc(U.remove)}</button></li>`}).join('');
}
function toggleList(id){
 const has=mine.includes(id);mine=has?mine.filter(x=>x!==id):[id,...mine];saveList();renderList();
 toast(fill(has?U.removedT:U.addedT,{t:P[id].title}));
}
$('#ar-mine').addEventListener('click',e=>{const b=e.target.closest('[data-rm]');if(!b)return;const idx=mine.indexOf(b.dataset.rm);toggleList(b.dataset.rm);const btns=$$('#ar-mine [data-rm]');(btns[Math.min(idx,btns.length-1)]||$('#ar-lempty a')).focus()});
const tEl=$('#ar-toast');let tT;
function toast(m){tEl.textContent=m;tEl.hidden=false;clearTimeout(tT);tT=setTimeout(()=>tEl.hidden=true,3600)}

// ---- programme dialog ----
const pd=$('#ar-prog'),pb=$('#ar-pbody');let pOpener=null,cur=null;
function openProg(id,airKey,from){
 const p=P[id],t=now();pOpener=from;cur=id;
 const airs=AIR.filter(a=>a.p===id);
 const focus=airKey?airOf(airKey):airs.find(a=>stateOf(a,t)==='now')||airs.find(a=>a.start>t)||airs[airs.length-1];
 const onNow=airs.find(a=>stateOf(a,t)==='now');
 const series=p.kind==='series';
 let acc=focus&&!series?focus.start:0;
 const pn=onNow&&!series?partNow(p,onNow,t):null;
 pb.innerHTML=`<button type="button" class="ar-x" data-close aria-label="${esc(U.close)}">×</button>`+
  `<div class="ar-pph">${D.posters[id].big}</div><div class="ar-pin"><p class="g-cat r-c-${p.cat}">${esc(D.cats[p.cat])}</p><h2 id="ar-pt">${esc(p.title)}</h2><p class="ar-ptag">${esc(p.tag)}</p><p class="ar-pab">${esc(p.about)}</p>`+
  `<div class="ar-pact">${onNow?`<button type="button" class="ar-btn" data-watch="${id}" data-air="${onNow.key}">${esc(onNow.live?U.watchLive:U.watch)}</button>`:(series||airs.some(a=>stateOf(a,t)==='past')||!airs.length)?`<button type="button" class="ar-btn" data-watch="${id}">${esc(U.watchFrom)}</button>`:''}<button type="button" class="ar-btn ar-ghost" data-list="${id}" aria-pressed="${mine.includes(id)}">${esc(mine.includes(id)?U.added:U.add)}</button></div>`+
  `<h3>${esc(U.airings)}</h3>${airs.length?`<ul class="ar-airs">${airs.map(a=>{const s=stateOf(a,t);return `<li class="is-${s}"><span class="ar-at">${hhmm(a.start)}–${hhmm(a.end)}</span><span>${esc(CH[a.ch].name)}${a.part!==null?`: ${esc(p.parts[a.part].name)}`:''}</span><span class="ar-as">${esc(s==='now'?(a.live?U.live:U.onAir):s==='past'?U.ended:untilText(a.start-t))}</span></li>`}).join('')}</ul>`:`<p class="ar-muted">${esc(U.noAir)}</p>`}`+
  `<h3>${esc(series?U.eps:U.parts)}</h3><ol class="ar-parts">${p.parts.map((x,i)=>{const st=series?'':hhmm(acc);if(!series)acc+=x.min;return `<li class="${pn===x?'is-now':''}"><span class="ar-pn">${series?i+1:st}</span><span class="ar-px">${esc(x.name)}${pn===x?` <span class="ar-live">${esc(U.live)}</span>`:''}</span><span class="ar-pm">${esc(fill(U.min,{m:x.min}))}</span>${series?`<button type="button" class="ar-pplay" data-watch="${id}" data-ep="${i}" aria-label="${esc(U.watch)}: ${esc(x.name)}">▶</button>`:''}</li>`}).join('')}</ol></div>`;
 if(!pd.open)pd.showModal();
 $('[data-close]',pb).focus();
}
pb.addEventListener('click',e=>{
 if(e.target.closest('[data-close]')){pd.close();return}
 const l=e.target.closest('[data-list]');if(l){toggleList(l.dataset.list);const on=mine.includes(l.dataset.list);l.setAttribute('aria-pressed',on);l.textContent=on?U.added:U.add}
});
pd.addEventListener('close',()=>{if(!player.open){pOpener&&pOpener.focus();pOpener=null}});
pd.addEventListener('click',e=>{if(e.target===pd)pd.close()});

// ---- demo player ----
const player=$('#ar-player'),plb=$('#ar-plbody');
let S=null,tick=null,plOpener=null;
const fmt=s=>{s=Math.max(0,Math.floor(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0')};
function openPlayer(id,airKey,ep,from){
 const p=P[id],t=now(),a=airKey?airOf(airKey):null,live=!!(a&&a.live&&stateOf(a,t)==='now');
 const series=p.kind==='series',epi=series?(ep??0):null;
 const dur=(series?p.parts[epi].min:p.parts.reduce((s,x)=>s+x.min,0))*60;
 plOpener=from||document.activeElement;
 S={id,live,dur,pos:live?Math.min(dur,(t-a.start)*60):0,edge:live?(t-a.start)*60:dur,playing:false,muted:false,a,epi};
 plb.innerHTML=`<div class="pl-stage">${D.posters[id].big}<div class="pl-over"><p class="pl-kick">${live?`<span class="ar-live">${esc(U.live)}</span> `:''}${esc(D.cats[p.cat])}${a?`, ${esc(CH[a.ch].name)}`:''}</p><h2 id="ar-plt">${esc(p.title)}</h2><p class="pl-part" id="pl-part"></p></div><button type="button" class="pl-big" id="pl-big" aria-label="${esc(U.play)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button></div>`+
  `<p class="pl-demo">${esc(U.demo)}</p>`+
  `<div class="pl-bar"><button type="button" class="pl-b" id="pl-play" aria-label="${esc(U.play)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button>`+
  `<button type="button" class="pl-b" id="pl-back" aria-label="${esc(U.back10)}">−10</button><button type="button" class="pl-b" id="pl-fwd" aria-label="${esc(U.fwd10)}">+10</button>`+
  `<label class="pl-seek"><span class="sr-only">${esc(U.seek)}</span><input type="range" id="pl-range" min="0" max="${dur}" step="1" value="${Math.floor(S.pos)}"></label>`+
  `<span class="pl-time" id="pl-time"></span>${live?`<button type="button" class="pl-b pl-tolive" id="pl-live">${esc(U.toLive)}</button>`:''}`+
  `<button type="button" class="pl-b" id="pl-mute" aria-pressed="false" aria-label="${esc(U.mute)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="2" class="pl-wave"/></svg></button>`+
  `<label class="pl-sel"><span>${esc(U.subs)}</span><select id="pl-subs"><option value="">${esc(U.off)}</option><option>AZ</option><option>RU</option><option>EN</option></select></label>`+
  `<label class="pl-sel"><span>${esc(U.quality)}</span><select id="pl-q"><option>${esc(U.auto)}</option><option>1080p</option><option>720p</option><option>480p</option></select></label>`+
  `<button type="button" class="pl-b" id="pl-full" aria-label="${esc(U.full)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2"/></svg></button>`+
  `<button type="button" class="pl-b" data-close aria-label="${esc(U.close)}">×</button></div><p class="sr-only" id="pl-status" aria-live="polite"></p>`;
 syncPlayer();
 if(pd.open)pd.close();
 player.showModal();$('#pl-play').focus();
}
function syncPlayer(){
 const p=P[S.id];
 $('#pl-range').value=Math.floor(S.pos);
 $('#pl-time').textContent=S.live?`${fmt(S.pos)} / ${U.live}`:`${fmt(S.pos)} / ${fmt(S.dur)}`;
 const play=$('#pl-play'),big=$('#pl-big');
 const icon=S.playing?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
 play.innerHTML=icon;play.setAttribute('aria-label',S.playing?U.pause:U.play);
 big.hidden=S.playing;
 // current part / episode for the caption
 let part=p.parts[S.epi??0].name;
 if(S.epi===null){let acc=0;for(const x of p.parts){if(S.pos<(acc+x.min)*60){part=x.name;break}acc+=x.min}}
 $('#pl-part').textContent=part;
 const lv=$('#pl-live');if(lv)lv.disabled=S.pos>=S.edge-5;
}
function setPlaying(on){
 S.playing=on;clearInterval(tick);
 if(on)tick=setInterval(()=>{S.pos=Math.min(S.live?S.edge:S.dur,S.pos+1);if(S.live)S.edge+=1;if(!S.live&&S.pos>=S.dur)setPlaying(false);syncPlayer()},1000);
 $('#pl-status').textContent=on?U.playing:U.paused;syncPlayer();
}
plb.addEventListener('click',e=>{
 const id=e.target.closest('button')?.id;
 if(e.target.closest('[data-close]')){player.close();return}
 if(id==='pl-play'||id==='pl-big'){setPlaying(!S.playing);if(id==='pl-big')$('#pl-play').focus()}
 if(id==='pl-back'){S.pos=Math.max(0,S.pos-10);syncPlayer()}
 if(id==='pl-fwd'){S.pos=Math.min(S.live?S.edge:S.dur,S.pos+10);syncPlayer()}
 if(id==='pl-live'){S.pos=S.edge;syncPlayer()}
 if(id==='pl-mute'){S.muted=!S.muted;const b=$('#pl-mute');b.setAttribute('aria-pressed',S.muted);b.setAttribute('aria-label',S.muted?U.unmute:U.mute);b.classList.toggle('is-muted',S.muted)}
 if(id==='pl-full'){const el=$('.pl-stage',plb);if(document.fullscreenElement)document.exitFullscreen?.();else el.requestFullscreen?.().catch(()=>{})}
});
plb.addEventListener('input',e=>{if(e.target.id==='pl-range'){S.pos=Math.min(+e.target.value,S.live?S.edge:S.dur);syncPlayer()}});
player.addEventListener('keydown',e=>{if((e.key===' '||e.key==='k')&&!e.target.closest('button,select,input')){e.preventDefault();setPlaying(!S.playing)}});
player.addEventListener('close',()=>{setPlaying(false);clearInterval(tick);plb.innerHTML='';plOpener&&plOpener.isConnected?plOpener.focus():pOpener?.focus()});

// ---- one delegated handler for every programme / watch trigger on the page ----
document.addEventListener('click',e=>{
 const w=e.target.closest('[data-watch]');
 if(w&&!w.disabled){openPlayer(w.dataset.watch,w.dataset.air||null,w.dataset.ep!==undefined?+w.dataset.ep:null,pd.open?pOpener:w);return}
 const b=e.target.closest('[data-prog]');
 if(b&&!pd.contains(b))openProg(b.dataset.prog,b.dataset.air||null,b);
});
$('#ar-jump').addEventListener('click',()=>jumpToNow(true));

layout();paint();jumpToNow(false);filterCards();renderList();
addEventListener('resize',()=>{layout();paint()});
// The running order only changes minute by minute; repaint every 30 s, and not while the tab is hidden.
setInterval(()=>{if(!document.hidden)paint()},30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)paint()});
