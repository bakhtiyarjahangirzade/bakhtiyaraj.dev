// Booking panel for Reserve (pure HTML): new booking in four steps, booking detail, or reschedule.
import {esc,hm,addDays,diffDays,shift,freeSlots,svcOf,barberOf,dayStats} from './view.js';

// First date after iso (three weeks ahead at most) where the service has a free slot.
export function nextFree(D,iso,svc,barber){
 const sv=svcOf(D,svc);
 for(let i=1;i<21;i++){const d=addDays(iso,i);for(const b of D.barbers)if(sv.by.includes(b.id)&&(barber==='any'||barber===b.id)){const f=freeSlots(D,b,d,sv.dur);if(f.length)return {date:d,start:f[0],barber:b.id}}}
 return null;
}

export function panel(D,F,iso,P){
 const S=D.S,ahead=diffDays(D.today,iso);
 if(P.mode==='detail'){
  const x=D.bookings.find(b=>b.id===P.id),sv=svcOf(D,x.svc),b=barberOf(D,x.barber),past=diffDays(D.today,x.date)<0||(x.date===D.today&&x.start<D.now);
  return `<div class="rs-p-head"><h2 id="rs-p-title">${esc(S.detailTitle)}</h2><button type="button" class="rs-link" data-act="new">${esc(S.backNew)}</button></div>
  <dl class="rs-detail"><div><dt>${esc(S.client)}</dt><dd>${esc(x.client)}<a href="tel:${x.phone.replace(/\s/g,'')}">${esc(x.phone)}</a></dd></div>
  <div><dt>${esc(S.when)}</dt><dd>${esc(F.long(x.date))}<b>${hm(x.start)}–${hm(x.start+sv.dur)}</b></dd></div>
  <div><dt>${esc(S.svc)}</dt><dd>${esc(sv.name)}<span>${esc(F.dur(sv.dur))}, ${F.azn(sv.price)}</span></dd></div>
  <div><dt>${esc(S.barber)}</dt><dd>${esc(b.name)}<span>${esc(b.role)}</span></dd></div>${x.note?`<div><dt>${esc(S.note)}</dt><dd>${esc(x.note)}</dd></div>`:''}</dl>
  ${past?`<p class="rs-hint">${esc(S.pastBooking)}</p>`:P.confirmCancel?`<div class="rs-confirm"><p id="rs-cc">${esc(F.fill(S.cancelAsk,{client:x.client,time:hm(x.start)}))}</p><div class="rs-actions"><button type="button" class="rs-btn rs-btn-danger" data-act="cancel-yes">${esc(S.cancelYes)}</button><button type="button" class="rs-btn" data-act="cancel-no">${esc(S.keep)}</button></div></div>`:
  `<div class="rs-actions"><button type="button" class="rs-btn rs-btn-primary" data-act="move">${esc(S.move)}</button><button type="button" class="rs-btn rs-btn-danger" data-act="cancel">${esc(S.cancel)}</button></div>`}`;
 }
 const moving=P.mode==='move'?D.bookings.find(b=>b.id===P.id):null;
 const svc=moving?moving.svc:P.svc,sv=svc&&svcOf(D,svc);
 let h=`<div class="rs-p-head"><h2 id="rs-p-title">${esc(moving?F.fill(S.moveTitle,{client:moving.client}):S.newTitle)}</h2>${moving?`<button type="button" class="rs-link" data-act="detail" data-id="${moving.id}">${esc(S.back)}</button>`:''}</div>`;
 h+=`<p class="rs-p-day">${esc(F.long(iso))}</p>`;
 if(!moving){
  h+=`<fieldset class="rs-step"><legend><span class="rs-n">1</span>${esc(S.svc)}</legend><div class="rs-svcs">${D.services.map(s=>`<label class="rs-svc"><input type="radio" name="svc" value="${s.id}"${s.id===svc?' checked':''}><span class="rs-svc-n">${esc(s.name)}</span><span class="rs-svc-m">${esc(F.dur(s.dur))}</span><span class="rs-svc-p">${F.azn(s.price)}</span></label>`).join('')}</div></fieldset>`;
  if(!sv)return h;
 }
 const elig=D.barbers.filter(b=>sv.by.includes(b.id));
 const slots=Object.fromEntries(elig.map(b=>[b.id,freeSlots(D,b,iso,sv.dur,moving?.id)]));
 h+=`<fieldset class="rs-step"><legend><span class="rs-n">${moving?1:2}</span>${esc(S.barber)}</legend><div class="rs-barb">`+
  `<label class="rs-opt"><input type="radio" name="barber" value="any"${P.barber==='any'?' checked':''}><span>${esc(S.anyBarber)}</span><small>${esc(F.fill(S.nFree,{n:elig.reduce((a,b)=>a+slots[b.id].length,0)}))}</small></label>`+
  elig.map(b=>`<label class="rs-opt"><input type="radio" name="barber" value="${b.id}"${P.barber===b.id?' checked':''}><span>${esc(b.name)}</span><small>${shift(D,b,iso)?esc(F.fill(S.nFree,{n:slots[b.id].length})):esc(S.dayOff)}</small></label>`).join('')+`</div></fieldset>`;
 const show=elig.filter(b=>P.barber==='any'||P.barber===b.id);
 const anyFree=show.some(b=>slots[b.id].length);
 h+=`<fieldset class="rs-step"><legend><span class="rs-n">${moving?2:3}</span>${esc(S.time)} <small>${esc(F.fill(S.takes,{d:F.dur(sv.dur)}))}</small></legend>`;
 if(ahead<0)h+=`<p class="rs-hint">${esc(S.pastDay)}</p>`;
 else if(!anyFree){
  const nf=nextFree(D,iso,svc,P.barber);
  h+=`<div class="rs-nofree"><p>${esc(dayStats(D,iso).open?S.noFree:S.closed)}</p>${nf?`<button type="button" class="rs-btn" data-act="goto" data-date="${nf.date}">${esc(F.fill(S.nextFree,{day:F.long(nf.date),time:hm(nf.start)}))}</button>`:''}</div>`;
 }else h+=show.filter(b=>slots[b.id].length).map(b=>`<div class="rs-slots" role="group" aria-label="${esc(b.name)}"><p class="rs-slots-b" aria-hidden="true">${esc(b.name)}</p><div class="rs-slot-list">${slots[b.id].map(t=>`<label class="rs-slot"><input type="radio" name="slot" value="${b.id}@${t}"${P.slot&&P.slot.barber===b.id&&P.slot.start===t?' checked':''} aria-label="${esc(`${b.name}, ${hm(t)}–${hm(t+sv.dur)}`)}"><span>${hm(t)}</span></label>`).join('')}</div></div>`).join('');
 h+=`</fieldset>`;
 if(!P.slot)return h;
 const b=barberOf(D,P.slot.barber),sum=`<p class="rs-sum"><b>${hm(P.slot.start)}–${hm(P.slot.start+sv.dur)}</b><span>${esc(b.name)}, ${esc(sv.name)}</span><span class="rs-sum-p">${F.azn(sv.price)}</span></p>`;
 if(moving)return h+sum+`<div class="rs-actions"><button type="button" class="rs-btn rs-btn-primary" data-act="move-save">${esc(S.moveSave)}</button></div>`;
 return h+`<fieldset class="rs-step rs-client"><legend><span class="rs-n">4</span>${esc(S.client)}</legend>
  <div class="rs-field"><label for="rs-name">${esc(S.name)}</label><input id="rs-name" name="name" autocomplete="name" value="${esc(P.name||'')}" aria-describedby="rs-name-e"${P.err?.name?' aria-invalid="true"':''}><p class="rs-err" id="rs-name-e">${esc(P.err?.name||'')}</p></div>
  <div class="rs-field"><label for="rs-phone">${esc(S.phone)}</label><input id="rs-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+994 50 123 45 67" value="${esc(P.phone||'')}" aria-describedby="rs-phone-e"${P.err?.phone?' aria-invalid="true"':''}><p class="rs-err" id="rs-phone-e">${esc(P.err?.phone||'')}</p></div>
  <div class="rs-field"><label for="rs-note">${esc(S.noteOpt)}</label><input id="rs-note" name="note" value="${esc(P.note||'')}"></div></fieldset>
  ${sum}<div class="rs-actions"><button type="button" class="rs-btn rs-btn-primary" data-act="confirm">${esc(S.confirm)}</button></div><p class="rs-demo">${esc(S.demoNote)}</p>`;
}
