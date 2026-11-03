import '../ribbon.css';
import './style.css';
import '../../i18n.js';
import {esc,fill,fmt,feed,searchScreen,itemScreen,chatsScreen,chatScreen,postScreen,tabbar,bubble} from './tpl.js';

const D=JSON.parse(document.getElementById('k-data').textContent);
D.F=fmt(D.lang);
const S=D.S,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}}};
const mine=store.get('cb-mine',[]);
const st={items:[...mine,...D.items],cat:'',fav:new Set(store.get('cb-fav',[])),threads:D.threads,q:'',alert:false,typing:false,screen:'feed',stack:[],item:null,post:{step:1,photoData:'',title:'',cat:'',price:'',neg:false}};
const app=$('[data-app]'),tabs=$('[data-tabs]'),notes=$('[data-notes]');
const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const toastEl=$('[data-toast]');let tt;
const toast=m=>{toastEl.textContent=m;toastEl.classList.add('is-on');clearTimeout(tt);tt=setTimeout(()=>toastEl.classList.remove('is-on'),2400)};
const byId=id=>st.items.find(i=>i.id===id);
const now=()=>{const d=new Date();return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`};
const tabOf={feed:'feed',item:'feed',search:'search',chats:'chats',chat:'chats',post:'post'};

function render(focus=true){
 let html='';const s=st.screen;
 if(s==='feed')html=feed(D,st);
 if(s==='search')html=searchScreen(D,st);
 if(s==='item')html=itemScreen(byId(st.item),D,st);
 if(s==='chats')html=chatsScreen(D,st);
 if(s==='chat'){const it=byId(st.item);html=chatScreen(it,thread(it.id),D,st)}
 if(s==='post')html=postScreen(D,st);
 const scr=$('.cb-screen',app);scr.dataset.screen=s;scr.innerHTML=html;
 tabs.innerHTML=tabbar(tabOf[s],D,st);
 const key=s==='chat'?'chat':s;
 notes.innerHTML=(D.S.notes[key]||[]).map(n=>`<li>${esc(n)}</li>`).join('');
 $$('[data-goto]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.goto===(s==='chats'?'chat':s)));
 if(s==='chat'){const th=$('[data-thread]',app);th.scrollTop=th.scrollHeight}
 if(focus){const f=s==='search'?$('[data-qin]',app):$('.cb-bar h2, .cb-bar button, .cb-bar input',app);f&&f.focus({preventScroll:true})}
 if(!reduce()){scr.classList.remove('is-in');void scr.offsetWidth;scr.classList.add('is-in')}
}
function go(s,opt={}){if(opt.push!==false&&st.screen!==s)st.stack.push({s:st.screen,item:st.item});st.screen=s;if(opt.item)st.item=opt.item;render(opt.focus!==false)}
function back(){const p=st.stack.pop()||{s:'feed'};st.screen=p.s;st.item=p.item;render()}
function thread(id){let t=st.threads.find(x=>x.item===id);if(!t){t={item:id,unread:0,msgs:[]};st.threads.unshift(t)}t.unread=0;return t}

// ---------- chat ----------
function addMsg(t,m){t.msgs.push(m);const ol=$('.cb-msgs',app);if(ol&&st.screen==='chat'&&st.item===t.item){ol.insertAdjacentHTML('beforeend',bubble(m,D));const th=$('[data-thread]',app);th.scrollTop=th.scrollHeight}}
function reply(t,make){
 const it=byId(t.item);st.typing=true;
 const th=$('[data-thread]',app);th&&th.insertAdjacentHTML('beforeend',`<p class="cb-typing">${esc(fill(S.typing,{n:it.seller}))}</p>`);if(th)th.scrollTop=th.scrollHeight;
 setTimeout(()=>{st.typing=false;$('.cb-typing',app)?.remove();const ms=[].concat(make(it));ms.forEach(m=>addMsg(t,{at:now(),from:'them',demo:true,...m}))},reduce()?300:1300);
}
function sendText(txt,kind){
 const it=byId(st.item),t=thread(it.id);addMsg(t,{from:'me',t:txt,at:now()});
 reply(t,()=>kind===0?{t:S.rYes}:kind===1?{t:fill(S.rPrice,{p:D.F.azn(Math.round(it.price*.9))})}:kind===2?{kind:'place',t:S.rPlace}:{t:S.rText});
}
function sendOffer(p){
 const it=byId(st.item),t=thread(it.id),m={from:'me',kind:'offer',p,state:'waiting',at:now()};addMsg(t,m);
 reply(t,()=>{const ok=p>=it.price*.85;m.state=ok?'accepted':'countered';const li=[...$$('.cb-offer',app)].pop();if(li)li.outerHTML=bubble(m,D);return ok?[{t:fill(S.rAccept,{p:D.F.azn(p)})},{kind:'place',t:S.rPlace}]:{t:fill(S.rCounter,{p:D.F.azn(Math.round(it.price*.9))})}});
}
let sheetOpener=null;
function openSheet(){const sh=$('[data-sheet]',app);sheetOpener=document.activeElement;sh.hidden=false;sh.querySelector('input').focus();sh.querySelector('input').select()}
function closeSheet(){const sh=$('[data-sheet]',app);if(sh&&!sh.hidden){sh.hidden=true;sheetOpener&&sheetOpener.focus()}}

// ---------- post ----------
function readPost(){const f=$('[data-post]',app),p=st.post;if(!f)return;if(f.elements.title)p.title=f.elements.title.value;const c=f.querySelector('[name=cat]:checked');if(c)p.cat=c.value;if(f.elements.price)p.price=f.elements.price.value;if(f.elements.neg)p.neg=f.elements.neg.checked}
function postNext(){
 readPost();const p=st.post,f=$('[data-post]',app),err=(k,m)=>{const e=f.querySelector(`[data-err="${k}"]`);if(e)e.textContent=m||'';const i=f.querySelector(`[name="${k}"]`);if(i&&i.type!=='radio')i.setAttribute('aria-invalid',!!m);return !!m};
 if(p.step===2){const a=err('title',p.title.trim().length<3?S.eTitle:''),b=err('cat',!p.cat?S.eCat:'');if(a||b){f.querySelector(a?'[name=title]':'[name=cat]').focus();return}}
 if(p.step===3){if(err('price',!(+p.price>=1&&+p.price<=10000)?S.ePrice:'')){f.elements.price.focus();return}publish();return}
 p.step++;render();
}
function publish(){
 const p=st.post,it={id:'m'+Date.now().toString(36),photo:'',photoData:p.photoData,cat:p.cat,title:p.title.trim(),price:+p.price,km:0,district:'nasimi',ago:1,seller:D.S.yours,since:new Date().getFullYear(),reply:0,desc:'',mine:true};
 st.items.unshift(it);mine.unshift(it);if(!store.set('cb-mine',mine)){it.photoData='';mine[0].photoData='';store.set('cb-mine',mine)}
 st.post={step:1,photoData:'',title:'',cat:'',price:'',neg:false};st.cat='';st.stack=[];st.screen='feed';render();toast(S.published);
}
function readPhoto(inp){
 const file=inp.files&&inp.files[0];if(!file)return;
 const e=$('[data-err=photo]',app);if(!/^image\//.test(file.type)){e.textContent=S.photoErr;return}
 const url=URL.createObjectURL(file),im=new Image();
 im.onload=()=>{const s=Math.min(im.width,im.height),c=document.createElement('canvas');c.width=c.height=600;c.getContext('2d').drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,600,600);st.post.photoData=c.toDataURL('image/jpeg',.8);URL.revokeObjectURL(url);st.post.step=2;render()};
 im.onerror=()=>{e.textContent=S.photoErr};im.src=url;
}

// ---------- events ----------
app.addEventListener('click',e=>{
 const t=e.target;
 const fv=t.closest('[data-fav]');if(fv){const id=fv.dataset.fav,on=!st.fav.has(id);on?st.fav.add(id):st.fav.delete(id);store.set('cb-fav',[...st.fav]);fv.setAttribute('aria-pressed',on);fv.setAttribute('aria-label',fill(on?S.unfavA:S.favA,{t:byId(id).title}));toast(on?S.saved:S.unsaved);return}
 const op=t.closest('[data-open]');if(op){go('item',{item:op.dataset.open});return}
 const ch=t.closest('[data-chat]');if(ch){go('chat',{item:ch.dataset.chat});return}
 if(t.closest('[data-back]')){back();return}
 const ct=t.closest('[data-cat]');if(ct){st.cat=ct.dataset.cat;render(false);$(`[data-cat="${st.cat}"]`,app)?.focus();return}
 const q=t.closest('[data-q]');if(q){st.q=q.dataset.q;render();return}
 if(t.closest('[data-alert]')){st.alert=!st.alert;render(false);$('[data-alert]',app).focus();return}
 const qr=t.closest('[data-quick]');if(qr){sendText(S.quick[+qr.dataset.quick],+qr.dataset.quick);return}
 if(t.closest('[data-offer-open]')){openSheet();return}
 if(t.closest('[data-offer-close]')){closeSheet();return}
 const sg=t.closest('[data-sugg]');if(sg){$('[data-offer-form] [name=p]',app).value=sg.dataset.sugg;return}
 if(t.closest('[data-skip]')){st.post.step=2;render();return}
 if(t.closest('[data-photo-rm]')){st.post.photoData='';render();return}
});
app.addEventListener('input',e=>{if(e.target.matches('[data-qin]')){st.q=e.target.value;const pos=e.target.selectionStart;render(false);const i=$('[data-qin]',app);i.focus();i.setSelectionRange(pos,pos)}});
app.addEventListener('change',e=>{if(e.target.matches('[data-photo]'))readPhoto(e.target)});
app.addEventListener('submit',e=>{
 e.preventDefault();const f=e.target;
 if(f.matches('[data-compose]')){const v=f.elements.m.value.trim();if(!v){f.elements.m.focus();return}f.elements.m.value='';sendText(v,-1);return}
 if(f.matches('[data-offer-form]')){const it=byId(st.item),p=Math.round(+f.elements.p.value),bad=!(p>=1&&p<=it.price);$('[data-err]',f).textContent=bad?S.offerErr:'';f.elements.p.setAttribute('aria-invalid',bad);if(bad){f.elements.p.focus();return}closeSheet();sendOffer(p);return}
 if(f.matches('[data-post]'))postNext();
});
app.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet()});
tabs.addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;st.stack=[];const k=b.dataset.tab;if(k==='post')st.post.step=st.post.step||1;go(k,{push:false})});
// The tour on the left drives the phone.
$$('[data-goto]').forEach(b=>b.addEventListener('click',()=>{
 const k=b.dataset.goto;st.stack=[];
 if(k==='item')go('item',{item:'c3',push:false});
 else if(k==='chat'){st.stack=[{s:'chats'}];go('chat',{item:'c1',push:false})}
 else if(k==='search'){st.q='velosiped';go('search',{push:false})}
 else go(k,{push:false});
 if(matchMedia('(max-width:760px)').matches)$('.cb-phone').scrollIntoView({behavior:reduce()?'auto':'smooth'});
}));
render(false);
