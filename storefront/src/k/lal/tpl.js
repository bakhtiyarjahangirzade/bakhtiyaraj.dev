// Cibdə app screens, shared by build (first paint of the feed) and browser. Pure string templates.
export const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export const fill=(s,v)=>String(s).replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m);
export function fmt(lang){
 const sep=lang==='en'?',':' ',dec=lang==='en'?'.':',';
 return {azn:n=>`${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,sep)} AZN`,km:n=>n.toFixed(1).replace('.',dec)};
}
export const ico={
 home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4Z"/></svg>',
 search:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>',
 plus:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
 chat:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4Z"/></svg>',
 back:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
 heart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg>',
 pin:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11Z"/><circle cx="12" cy="10" r="2.2"/></svg>',
 send:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12 20 4l-4 16-4-6Z"/><path d="m12 14 8-10"/></svg>',
 cam:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-2.5h6L17 8h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/></svg>',
 clock:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
 bell:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15ZM10 20h4"/></svg>'
};
export function ago(min,S){
 if(min<60)return fill(S.agoMin,{n:min});
 if(min<1440)return fill(S.agoH,{n:Math.round(min/60)});
 return fill(S.agoD,{n:Math.round(min/1440)});
}
export const pic=(it,D)=>it.photoData?`<img src="${esc(it.photoData)}" alt="${esc(it.title)}" width="600" height="600">`:it.photo&&D.img[it.photo]?D.img[it.photo]:`<span class="cb-noph">${ico.cam}</span>`;
export function tile(it,D,st){
 const fav=st.fav.has(it.id);
 return `<li class="cb-tile"><button type="button" class="cb-tile-btn" data-open="${esc(it.id)}"><span class="cb-tile-pic">${pic(it,D)}</span><span class="cb-tile-price">${D.F.azn(it.price)}</span><span class="cb-tile-title">${esc(it.title)}</span><span class="cb-tile-meta">${D.F.km(it.km)} km, ${esc(ago(it.ago,D.S))}</span></button>${it.mine?`<span class="cb-mine">${esc(D.S.yours)}</span>`:''}<button type="button" class="cb-heart" data-fav="${esc(it.id)}" aria-pressed="${fav}" aria-label="${esc(fill(fav?D.S.unfavA:D.S.favA,{t:it.title}))}">${ico.heart}</button></li>`;
}
export function feed(D,st){
 const S=D.S,items=st.items.filter(i=>!st.cat||i.cat===st.cat);
 return `<header class="cb-bar"><div class="cb-loc">${ico.pin}<span><b>${esc(S.locName)}</b><small>${esc(S.locRadius)}</small></span></div></header>
<div class="cb-scroll"><div class="cb-chips" role="group" aria-label="${esc(S.catsL)}">${[['',S.allCats],...Object.entries(D.cats)].map(([k,l])=>`<button type="button" data-cat="${k}" aria-pressed="${st.cat===k}">${esc(l)}</button>`).join('')}</div>
<h2 class="cb-h">${esc(S.nearby)}</h2><ul class="cb-grid">${items.map(i=>tile(i,D,st)).join('')}</ul></div>`;
}
export function searchScreen(D,st){
 const S=D.S,q=st.q.trim().toLowerCase(),res=q?st.items.filter(i=>i.title.toLowerCase().includes(q)||D.cats[i.cat].toLowerCase().includes(q)):[];
 const body=!q?`<h2 class="cb-h">${esc(S.recent)}</h2><div class="cb-chips cb-chips-wrap">${S.recentList.map(r=>`<button type="button" data-q="${esc(r)}">${esc(r)}</button>`).join('')}</div>`
  :res.length?`<p class="cb-count">${esc(fill(S.found,{n:res.length}))}</p><ul class="cb-list">${res.map(i=>`<li><button type="button" data-open="${esc(i.id)}"><span class="cb-list-pic">${pic(i,D)}</span><span><b>${esc(i.title)}</b><small>${D.F.km(i.km)} km, ${esc(D.district[i.district])}</small></span><em>${D.F.azn(i.price)}</em></button></li>`).join('')}</ul>`
  :`<div class="cb-empty">${ico.search}<h2>${esc(fill(S.noneFor,{q:st.q.trim()}))}</h2><p>${esc(S.noneBody)}</p><button type="button" class="cb-btn ${st.alert?'cb-btn-done':''}" data-alert aria-pressed="${!!st.alert}">${ico.bell}<span>${esc(st.alert?S.alertOn:S.alertBtn)}</span></button></div>`;
 return `<header class="cb-bar cb-bar-search"><label class="sr-only" for="cb-q">${esc(S.searchL)}</label><input id="cb-q" type="search" value="${esc(st.q)}" placeholder="${esc(S.searchPh)}" autocomplete="off" data-qin></header><div class="cb-scroll" aria-live="polite">${body}</div>`;
}
export function itemScreen(it,D,st){
 const S=D.S,fav=st.fav.has(it.id);
 return `<header class="cb-bar cb-bar-over"><button type="button" class="cb-icon" data-back aria-label="${esc(S.back)}">${ico.back}</button><button type="button" class="cb-icon" data-fav="${esc(it.id)}" aria-pressed="${fav}" aria-label="${esc(fill(fav?S.unfavA:S.favA,{t:it.title}))}">${ico.heart}</button></header>
<div class="cb-scroll cb-scroll-item"><div class="cb-item-pic">${pic(it,D)}</div>
<div class="cb-item-body"><p class="cb-item-price">${D.F.azn(it.price)}</p><h2 class="cb-item-title">${esc(it.title)}</h2><p class="cb-item-meta">${ico.pin}${D.F.km(it.km)} km, ${esc(D.district[it.district])}<span>${esc(ago(it.ago,S))}</span></p>
<p class="cb-item-desc">${esc(it.desc)}</p>
<div class="cb-seller"><span class="cb-ava" aria-hidden="true">${esc(it.seller.slice(0,1))}</span><span><b>${esc(it.seller)}</b><small>${esc(fill(S.since,{y:it.since}))}</small></span><span class="cb-reply">${ico.clock}${esc(fill(S.replies,{n:it.reply}))}</span></div>
<p class="cb-meet">${ico.pin}<span>${esc(S.meetHint)}</span></p></div></div>
<footer class="cb-cta">${it.mine?`<p>${esc(S.yourItem)}</p>`:`<button type="button" class="cb-btn cb-btn-main" data-chat="${esc(it.id)}">${ico.chat}<span>${esc(S.write)}</span></button>`}</footer>`;
}
export function chatsScreen(D,st){
 const S=D.S,list=st.threads;
 return `<header class="cb-bar"><h2 class="cb-title">${esc(S.chats)}</h2></header><div class="cb-scroll">${list.length?`<ul class="cb-threads">${list.map(t=>{const it=st.items.find(i=>i.id===t.item),last=t.msgs[t.msgs.length-1];return `<li><button type="button" data-chat="${esc(it.id)}"><span class="cb-list-pic">${pic(it,D)}</span><span><b>${esc(it.seller)}</b><small>${esc(it.title)}</small><i>${esc(last.kind==='offer'?fill(S.offerLine,{p:D.F.azn(last.p)}):last.t)}</i></span><em>${esc(last.at)}${t.unread?`<b class="cb-dot" aria-label="${esc(S.unread)}">${t.unread}</b>`:''}</em></button></li>`}).join('')}</ul>`:`<div class="cb-empty">${ico.chat}<h2>${esc(S.noChats)}</h2></div>`}</div>`;
}
export function bubble(m,D){
 const S=D.S;
 if(m.kind==='offer')return `<li class="cb-msg cb-${m.from} cb-offer"><span class="cb-offer-k">${esc(S.offer)}</span><b>${D.F.azn(m.p)}</b><small>${esc(m.state==='accepted'?S.offerAccepted:m.state==='countered'?S.offerCountered:S.offerWaiting)}</small><time>${esc(m.at)}</time></li>`;
 if(m.kind==='place')return `<li class="cb-msg cb-${m.from} cb-place">${ico.pin}<span><b>${esc(m.t)}</b><small>${esc(S.publicPlace)}</small></span><time>${esc(m.at)}</time></li>`;
 return `<li class="cb-msg cb-${m.from}"><p>${esc(m.t)}</p>${m.demo?`<small class="cb-demo">${esc(S.demoReply)}</small>`:''}<time>${esc(m.at)}</time></li>`;
}
export function chatScreen(it,t,D,st){
 const S=D.S;
 return `<header class="cb-bar cb-bar-chat"><button type="button" class="cb-icon" data-back aria-label="${esc(S.back)}">${ico.back}</button><button type="button" class="cb-chat-item" data-open="${esc(it.id)}"><span class="cb-list-pic">${pic(it,D)}</span><span><b>${esc(it.seller)}</b><small>${esc(it.title)}, ${D.F.azn(it.price)}</small></span></button></header>
<div class="cb-scroll cb-thread" data-thread><ol class="cb-msgs" aria-live="polite">${t.msgs.map(m=>bubble(m,D)).join('')}</ol>${st.typing?`<p class="cb-typing">${esc(fill(S.typing,{n:it.seller}))}</p>`:''}</div>
<div class="cb-quick" role="group" aria-label="${esc(S.quickL)}">${S.quick.map((q,i)=>`<button type="button" data-quick="${i}">${esc(q)}</button>`).join('')}<button type="button" class="cb-quick-offer" data-offer-open>${esc(S.makeOffer)}</button></div>
<form class="cb-compose" data-compose><label class="sr-only" for="cb-m">${esc(S.message)}</label><input id="cb-m" name="m" placeholder="${esc(S.message)}" autocomplete="off"><button type="submit" class="cb-send" aria-label="${esc(S.send)}">${ico.send}</button></form>
<div class="cb-sheet" data-sheet hidden role="dialog" aria-modal="true" aria-labelledby="cb-of-h"><form data-offer-form novalidate><h2 id="cb-of-h">${esc(S.makeOffer)}</h2><p>${esc(fill(S.askPrice,{p:D.F.azn(it.price)}))}</p>
<div class="cb-sugg">${[0.9,0.8,0.7].map(x=>`<button type="button" data-sugg="${Math.round(it.price*x)}">${D.F.azn(Math.round(it.price*x))}</button>`).join('')}</div>
<label class="cb-f"><span>${esc(S.yourOffer)}</span><input name="p" type="number" inputmode="numeric" min="1" value="${Math.round(it.price*.9)}" aria-describedby="cb-of-e"></label><p class="cb-err" id="cb-of-e" data-err></p>
<div class="cb-sheet-foot"><button type="button" class="cb-link" data-offer-close>${esc(S.cancel)}</button><button type="submit" class="cb-btn cb-btn-coral">${esc(S.sendOffer)}</button></div></form></div>`;
}
export function postScreen(D,st){
 const S=D.S,p=st.post,n=p.step;
 const dots=[1,2,3].map(i=>`<span class="${i<=n?'on':''}"></span>`).join('');
 let body='';
 if(n===1)body=`<h2 class="cb-h">${esc(S.p1)}</h2><label class="cb-shot">${p.photoData?`<img src="${esc(p.photoData)}" alt="" width="600" height="600">`:`${ico.cam}<b>${esc(S.takePhoto)}</b><small>${esc(S.photoNote)}</small>`}<input type="file" accept="image/*" data-photo></label>${p.photoData?`<button type="button" class="cb-link" data-photo-rm>${esc(S.removePhoto)}</button>`:''}<p class="cb-err" data-err="photo"></p>`;
 if(n===2)body=`<h2 class="cb-h">${esc(S.p2)}</h2><label class="cb-f"><span>${esc(S.titleL)}</span><input name="title" value="${esc(p.title)}" maxlength="60" aria-describedby="cb-e-title"></label><p class="cb-err" id="cb-e-title" data-err="title"></p><fieldset class="cb-f"><legend>${esc(S.catL)}</legend><div class="cb-chips cb-chips-wrap">${Object.entries(D.cats).map(([k,l])=>`<label class="cb-radio"><input type="radio" name="cat" value="${k}"${p.cat===k?' checked':''}><span>${esc(l)}</span></label>`).join('')}</div></fieldset><p class="cb-err" data-err="cat"></p>`;
 if(n===3)body=`<h2 class="cb-h">${esc(S.p3)}</h2><label class="cb-f"><span>${esc(S.priceL)}</span><input name="price" type="number" inputmode="numeric" min="1" value="${esc(p.price)}" aria-describedby="cb-e-price"></label><p class="cb-err" id="cb-e-price" data-err="price"></p><label class="cb-check"><input type="checkbox" name="neg"${p.neg?' checked':''}><span>${esc(S.negL)}</span></label><p class="cb-hint">${esc(S.p3hint)}</p>`;
 return `<header class="cb-bar"><button type="button" class="cb-icon" data-back aria-label="${esc(S.back)}">${ico.back}</button><h2 class="cb-title">${esc(S.newAd)}</h2><span class="cb-steps" aria-label="${esc(fill(S.stepOf,{n}))}">${dots}</span></header>
<form class="cb-scroll cb-post" data-post novalidate>${body}<button type="submit" class="cb-btn cb-btn-main cb-btn-wide">${esc(n===3?S.publish:S.next)}</button>${n===1?`<button type="button" class="cb-link cb-skip" data-skip>${esc(S.skipPhoto)}</button>`:''}</form>`;
}
export function tabbar(cur,D,st){
 const S=D.S,unread=st.threads.reduce((s,t)=>s+t.unread,0);
 return [['feed',ico.home,S.tFeed],['search',ico.search,S.tSearch],['post',ico.plus,S.tPost],['chats',ico.chat,S.tChats]].map(([k,i,l])=>`<button type="button" data-tab="${k}" class="cb-tab-${k}"${cur===k?' aria-current="page"':''}>${i}<span>${esc(l)}</span>${k==='chats'&&unread?`<b class="cb-dot">${unread}</b>`:''}</button>`).join('');
}
