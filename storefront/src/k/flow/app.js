import '../ribbon.css';
import './style.css';
import '../../i18n.js';
import {board,summary,ownerChips,makeFmt,value,monthly,daysFrom,esc} from './view.js';

const D=JSON.parse(document.getElementById('k-data').textContent),S=D.S,F=makeFmt(D);
const $=s=>document.querySelector(s);
const st={owner:'all',q:'',showLost:false,stage:'lead'};
const stageName=id=>D.stages.find(s=>s.id===id).name;
const ownerName=id=>D.owners.find(o=>o.id===id).name;
const byId=id=>D.deals.find(d=>d.id===id);
let fresh=null,openId=null;

const toastEl=$('#fl-toast');let toastT;
function toast(msg){toastEl.textContent=msg;toastEl.classList.add('is-on');clearTimeout(toastT);toastT=setTimeout(()=>toastEl.classList.remove('is-on'),4200)}

function render(){
 const B=board(D,F,st,fresh);
 $('#fl-board').innerHTML=B.html;$('#fl-tabs').innerHTML=B.tabs;
 $('#fl-summary').innerHTML=summary(D,F,st);$('#fl-owners').innerHTML=ownerChips(D,st);
 const none=!B.any&&(st.q.trim()||st.owner!=='all');
 $('#fl-noresult').hidden=!none;$('#fl-board').hidden=none;
 if(none){$('#fl-noresult-title').textContent=st.q.trim()?F.fill(S.noResult,{q:st.q.trim()}):S.noResultOwner;$('#fl-noresult-hint').textContent=st.owner!=='all'&&st.q.trim()?S.noResultOwner:''}
}

// ---- filters ----
$('#fl-q').addEventListener('input',e=>{st.q=e.target.value;render()});
$('#fl-owners').addEventListener('click',e=>{const b=e.target.closest('[data-owner]');if(!b)return;st.owner=b.dataset.owner;render();$(`#fl-owners [data-owner="${st.owner}"]`).focus()});
$('#fl-lost').addEventListener('change',e=>{st.showLost=e.target.checked;if(!st.showLost&&st.stage==='lost')st.stage='won';render()});
$('#fl-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-stage]');if(!b)return;st.stage=b.dataset.stage;render();$(`#fl-tabs [data-stage="${st.stage}"]`).focus()});
$('#fl-clear').addEventListener('click',()=>{st.q='';st.owner='all';$('#fl-q').value='';render();$('#fl-q').focus()});

// ---- stage change shared by drawer and drag ----
function move(d,to,reason){
 if(d.stage===to)return;
 const from=d.stage;d.stage=to;
 d.acts.unshift({date:D.today,kind:to==='won'?'won':to==='lost'?'lost':'stage',text:F.fill(S.actMoved,{from:stageName(from),to:stageName(to)})+(to==='lost'?`: ${reason}`:''),by:d.owner});
 if(to==='lost'){d.lostText=F.fill(S.lostLine,{reason});d.next=null}
 fresh=d.id;st.stage=to==='lost'&&!st.showLost?st.stage:to;
 render();toast(F.fill(S.moved,{co:d.co,stage:stageName(to)}));
}

// ---- drag and drop (mouse); keyboard users change the stage in the drawer ----
const boardEl=$('#fl-board');
boardEl.addEventListener('dragstart',e=>{const c=e.target.closest('.fl-card');if(!c)return;e.dataTransfer.setData('text/plain',c.dataset.id);e.dataTransfer.effectAllowed='move';c.classList.add('is-drag')});
boardEl.addEventListener('dragend',()=>boardEl.querySelectorAll('.is-drag,.is-over').forEach(x=>x.classList.remove('is-drag','is-over')));
boardEl.addEventListener('dragover',e=>{const col=e.target.closest('.fl-col');if(!col||col.dataset.stage==='lost')return;e.preventDefault();boardEl.querySelectorAll('.is-over').forEach(x=>x!==col&&x.classList.remove('is-over'));col.classList.add('is-over')});
boardEl.addEventListener('drop',e=>{const col=e.target.closest('.fl-col');if(!col||col.dataset.stage==='lost')return;e.preventDefault();const d=byId(+e.dataTransfer.getData('text/plain'));if(d)move(d,col.dataset.stage)});
boardEl.addEventListener('click',e=>{const c=e.target.closest('.fl-card');if(c)openDrawer(+c.dataset.id)});

// ---- drawer ----
const drawer=$('#fl-drawer'),body=$('#fl-drawer-body');
const ICON={inquiry:'M4 5h12v8H8l-4 3z',in:'M4 5h12v8H8l-4 3z',tasting:'M6 3v6a2 2 0 0 0 4 0V3M8 11v6M14 3c-1.5 1-2 3-2 5h2v9',proposal:'M5 3h7l3 3v11H5zM12 3v3h3',neg:'M3 10h4l3-3 3 3h4M7 13l2 2',won:'M4 10.5 8 14l8-8',lost:'M5 5l10 10M15 5 5 15',stage:'M4 10h10M11 6l4 4-4 4',note:'M4 15.5V5h12v7l-4 3.5zM12 15.5V12h4',next:'M3 4.5h14V17H3zM3 8h14M7 2.5v3M13 2.5v3',owner:'M10 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4 17c1-3 3.5-4.5 6-4.5s5 1.5 6 4.5',created:'M10 4v12M4 10h12'};
const ic=k=>`<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="${ICON[k]||ICON.note}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function drawerHTML(d){
 const stOpts=D.stages.map(s=>`<option value="${s.id}"${s.id===d.stage?' selected':''}>${esc(s.name)}</option>`).join('');
 const owOpts=D.owners.map(o=>`<option value="${o.id}"${o.id===d.owner?' selected':''}>${esc(o.name)}</option>`).join('');
 const rsOpts=Object.values(S.reasons).map(r=>`<option>${esc(r)}</option>`).join('');
 const nextOpts=Object.values(D.nextSteps).map(t=>`<option>${esc(t)}</option>`).join('');
 const formula=d.type==='daily'?F.fill(S.formulaDaily,{people:F.n(d.people),price:F.price(d.price).replace(' AZN',''),months:d.months}):F.fill(S.formulaEvent,{people:F.n(d.people),price:F.price(d.price).replace(' AZN','')});
 const late=d.next&&daysFrom(D.today,d.next.date)<0;
 return `<header class="fl-d-head"><div><p class="fl-d-kind">${esc(S.kinds[d.type])}</p><h2 id="fl-d-title">${esc(d.co)}</h2></div><button type="button" class="fl-x" data-close aria-label="${esc(S.close)}">${ic('lost')}</button></header>
 <dl class="fl-d-contact"><div><dt>${esc(S.contact)}</dt><dd>${esc(d.contact)}<span>${esc(d.role)}</span></dd></div><div><dt>${esc(S.phone)}</dt><dd><a href="tel:${d.phone.replace(/\s/g,'')}">${esc(d.phone)}</a></dd></div></dl>
 <section class="fl-d-value"><h3>${esc(S.valueTitle)}</h3><p class="fl-d-sum">${F.azn(value(d))}</p><p class="fl-d-formula">${esc(formula)}</p>${d.type==='daily'?`<p class="fl-d-month">${esc(F.fill(S.perMonth,{sum:F.azn(monthly(d))}))}</p>`:''}<p class="fl-d-created">${esc(F.fill(S.created,{date:F.date(d.created)}))}</p></section>
 <div class="fl-d-row">
  <div class="fl-field"><label for="fd-stage">${esc(S.stage)}</label><select id="fd-stage">${stOpts}</select></div>
  <div class="fl-field"><label for="fd-owner">${esc(S.owner)}</label><select id="fd-owner">${owOpts}</select></div>
 </div>
 <div class="fl-d-lost" id="fd-lost" hidden><div class="fl-field"><label for="fd-reason">${esc(S.lostAsk)}</label><select id="fd-reason">${rsOpts}</select></div><button type="button" class="fl-btn fl-btn-danger" id="fd-lost-ok">${esc(stageName('lost'))}</button></div>
 <form class="fl-d-next" id="fd-next" novalidate><h3>${esc(S.nextTitle)}</h3>
  ${d.next?`<p class="fl-d-current${late?' is-late':''}">${ic('next')}<span>${esc(d.next.text)}</span><time datetime="${d.next.date}">${esc(F.rel(d.next.date))}</time></p>`:`<p class="fl-d-current is-none">${esc(S.noNext)}</p>`}
  <div class="fl-d-row"><div class="fl-field fl-grow"><label for="fd-what">${esc(S.nextWhat)}</label><input id="fd-what" list="fd-steps" autocomplete="off" aria-describedby="fd-what-e"><datalist id="fd-steps">${nextOpts}</datalist><p class="fl-err" id="fd-what-e"></p></div>
  <div class="fl-field"><label for="fd-when">${esc(S.nextWhen)}</label><input id="fd-when" type="date" min="${D.today}" value="${d.next&&!late?d.next.date:D.today}" aria-describedby="fd-when-e"><p class="fl-err" id="fd-when-e"></p></div></div>
  <button type="submit" class="fl-btn">${esc(S.schedule)}</button></form>
 <form class="fl-d-note" id="fd-note" novalidate><label for="fd-text">${esc(S.noteLabel)}</label><textarea id="fd-text" rows="2" placeholder="${esc(S.notePh)}" aria-describedby="fd-text-e"></textarea><p class="fl-err" id="fd-text-e"></p><button type="submit" class="fl-btn">${esc(S.addNote)}</button></form>
 <section class="fl-d-hist"><h3>${esc(S.history)}</h3><ol>${d.acts.map(a=>`<li class="k-${a.kind}">${ic(a.kind)}<div><p>${esc(a.text)}</p><p class="fl-d-meta"><time datetime="${a.date}">${esc(F.date(a.date))}</time> ${esc(ownerName(a.by).split(' ')[0])}</p></div></li>`).join('')}</ol></section>`;
}

function openDrawer(id){openId=id;body.innerHTML=drawerHTML(byId(id));if(!drawer.open)drawer.showModal()}
function refreshDrawer(focusSel){const y=body.scrollTop;body.innerHTML=drawerHTML(byId(openId));body.scrollTop=y;if(focusSel)$(focusSel)?.focus()}
drawer.addEventListener('close',()=>{const id=openId;openId=null;fresh=null;render();document.querySelector(`.fl-card[data-id="${id}"]`)?.focus()});
drawer.addEventListener('click',e=>{if(e.target===drawer||e.target.closest('[data-close]'))drawer.close()});
const fieldErr=(id,msg)=>{const i=$(id),p=$(id+'-e');i.setAttribute('aria-invalid',msg?'true':'false');p.textContent=msg||''};

body.addEventListener('change',e=>{
 const d=byId(openId);if(!d)return;
 if(e.target.id==='fd-stage'){
  if(e.target.value==='lost'){$('#fd-lost').hidden=false;$('#fd-reason').focus();return}
  $('#fd-lost').hidden=true;move(d,e.target.value);refreshDrawer('#fd-stage');
 }
 if(e.target.id==='fd-owner'){d.owner=e.target.value;d.acts.unshift({date:D.today,kind:'owner',text:F.fill(S.actOwner,{name:ownerName(d.owner)}),by:d.owner});fresh=d.id;render();refreshDrawer('#fd-owner');toast(F.fill(S.actOwner,{name:ownerName(d.owner)}))}
});
body.addEventListener('click',e=>{
 if(e.target.id!=='fd-lost-ok')return;
 const d=byId(openId);if(!st.showLost){st.showLost=true;$('#fl-lost').checked=true}
 move(d,'lost',$('#fd-reason').value);refreshDrawer('#fd-stage');
});
body.addEventListener('submit',e=>{
 e.preventDefault();const d=byId(openId);
 if(e.target.id==='fd-next'){
  const what=$('#fd-what').value.trim(),when=$('#fd-when').value;
  fieldErr('#fd-what',what?'':S.errNext);fieldErr('#fd-when',when&&daysFrom(D.today,when)>=0?'':S.errPast);
  if(!what){$('#fd-what').focus();return}if(!when||daysFrom(D.today,when)<0){$('#fd-when').focus();return}
  d.next={date:when,text:what};d.acts.unshift({date:D.today,kind:'next',text:F.fill(S.actNext,{text:what,date:F.date(when)}),by:d.owner});
  fresh=d.id;render();refreshDrawer('#fd-what');toast(F.fill(S.scheduled,{text:what,date:F.rel(when)}));
 }
 if(e.target.id==='fd-note'){
  const txt=$('#fd-text').value.trim();
  if(!txt){fieldErr('#fd-text',S.errNote);$('#fd-text').focus();return}
  d.acts.unshift({date:D.today,kind:'note',text:txt,by:d.owner});refreshDrawer('#fd-text');toast(S.noteAdded);
 }
});

// ---- new deal ----
const dlg=$('#fl-new'),form=$('#fl-new-form');
const num=v=>v===''?NaN:Number(String(v).replace(',','.'));
function draft(){const f=new FormData(form);return {co:String(f.get('co')||'').trim(),contact:String(f.get('contact')||'').trim(),phone:String(f.get('phone')||'').trim(),type:f.get('type'),people:num(f.get('people')),price:num(f.get('price')),months:+f.get('months'),owner:f.get('owner')}}
function preview(){
 const x=draft();$('#fn-months-f').hidden=x.type!=='daily';
 const ok=x.people>0&&x.price>0;
 $('#fn-preview').textContent=ok?F.azn(value(x)):'—';
 $('#fn-formula').textContent=ok?(x.type==='daily'?F.fill(S.formulaDaily,{people:F.n(x.people),price:F.price(x.price).replace(' AZN',''),months:x.months}):F.fill(S.formulaEvent,{people:F.n(x.people),price:F.price(x.price).replace(' AZN','')})):'';
}
form.addEventListener('input',preview);
$('#fl-new-open').addEventListener('click',()=>{form.reset();form.querySelectorAll('[aria-invalid]').forEach(i=>i.removeAttribute('aria-invalid'));form.querySelectorAll('.fl-err').forEach(p=>p.textContent='');$('#fl-new-err').hidden=true;$('#fn-owner').value=st.owner!=='all'?st.owner:'lm';preview();dlg.showModal();$('#fn-co').focus()});
dlg.addEventListener('click',e=>{if(e.target===dlg||e.target.closest('[data-close]'))dlg.close()});
let focusAfter=null;
dlg.addEventListener('close',()=>{(focusAfter&&document.querySelector(focusAfter)||$('#fl-new-open')).focus();focusAfter=null});
form.addEventListener('submit',e=>{
 e.preventDefault();const x=draft();
 const errs={
  '#fn-co':!x.co?S.errCo:D.deals.some(d=>d.co.toLocaleLowerCase()===x.co.toLocaleLowerCase()&&!['won','lost'].includes(d.stage))?S.errDup:'',
  '#fn-contact':x.contact?'':S.errContact,
  '#fn-phone':!x.phone||/^\+994\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/.test(x.phone)?'':S.errPhone,
  '#fn-people':Number.isInteger(x.people)&&x.people>=10&&x.people<=2000?'':S.errPeople,
  '#fn-price':x.price>=4&&x.price<=60?'':S.errPrice
 };
 Object.entries(errs).forEach(([k,v])=>fieldErr(k,v));
 const bad=Object.entries(errs).filter(([,v])=>v);
 const box=$('#fl-new-err');box.hidden=!bad.length;box.textContent=bad.length?F.fill(S.errSummary,{n:bad.length}):'';
 if(bad.length){$(bad[0][0]).focus();return}
 const id=Math.max(...D.deals.map(d=>d.id))+1;
 const d={id,co:x.co,contact:x.contact,role:'',phone:x.phone||'—',type:x.type,people:x.people,price:x.price,months:x.type==='daily'?x.months:0,stage:'lead',owner:x.owner,created:D.today,
  next:{date:D.today,text:S.nextDefault},lostText:'',acts:[{date:D.today,kind:'created',text:S.actCreated,by:x.owner}]};
 D.deals.unshift(d);fresh=id;st.stage='lead';
 if(st.owner!=='all'&&st.owner!==x.owner)st.owner='all';
 if(st.q&&!`${d.co} ${d.contact}`.toLocaleLowerCase().includes(st.q.toLocaleLowerCase())){st.q='';$('#fl-q').value=''}
 render();focusAfter=`.fl-card[data-id="${id}"]`;dlg.close();toast(F.fill(S.createdToast,{co:d.co}));
});
