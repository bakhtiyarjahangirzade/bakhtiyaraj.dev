// Reserve — the front-desk calendar of a fictional Baku barbershop. Slots are computed, never typed in.
import {L,esc} from '../kit.js';
import {seed,grid,week,makeFmt,dayStats,hm} from './view.js';
import {panel} from './panel.js';

const TODAY='2026-11-03',NOW=800; // demo clock: Tuesday 3 November 2026, 13:20

const barbers=[
 {id:'elvin',name:'Elvin',role:L('Baş usta','Старший мастер','Head barber'),from:600,to:1140,br:840,brLen:45,off:0},
 {id:'rauf',name:'Rauf',role:L('Usta, kamuflyaj','Мастер, камуфляж седины','Barber, grey blending'),from:720,to:1260,br:960,brLen:30,off:2},
 {id:'tural',name:'Tural',role:L('Usta','Мастер','Barber'),from:600,to:1080,br:810,brLen:30,off:4},
 {id:'kamran',name:'Kamran',role:L('Usta, uşaq kəsimləri','Мастер, детские стрижки','Barber, kids’ cuts'),from:660,to:1200,br:900,brLen:30,off:3}
];
const ALL=['elvin','rauf','tural','kamran'];
const services=[
 {id:'classic',dur:45,price:25,by:ALL,name:L('Klassik saç kəsimi','Классическая стрижка','Classic haircut')},
 {id:'clipper',dur:30,price:15,by:ALL,name:L('Maşınla qısa kəsim','Короткая стрижка машинкой','Clipper cut')},
 {id:'beard',dur:30,price:15,by:['elvin','rauf','tural'],name:L('Saqqal formalaşdırma','Оформление бороды','Beard shaping')},
 {id:'combo',dur:75,price:35,by:['elvin','rauf','tural'],name:L('Saç və saqqal','Стрижка и борода','Haircut and beard')},
 {id:'shave',dur:45,price:25,by:['elvin','rauf'],name:L('İsti dəsmalla ülgüc təraşı','Бритьё опасной бритвой с горячим полотенцем','Hot-towel razor shave')},
 {id:'kids',dur:30,price:15,by:['tural','kamran'],name:L('Uşaq saç kəsimi (12 yaşa qədər)','Детская стрижка (до 12 лет)','Kids’ haircut (under 12)')},
 {id:'color',dur:60,price:40,by:['rauf'],name:L('Ağ saçların kamuflyajı','Камуфляж седины','Grey blending')}
];
const names=['Anar M.','Nihad Q.','Ramin S.','Elnur H.','Fuad A.','Kənan B.','Murad İ.','Orxan V.','Pərviz N.','Samir R.','Toğrul C.','Ülvi K.','Vüsal T.','Zaur Ə.','Cavid M.','Emil Ş.','İlkin D.','Rüfət Y.','Səbuhi Q.','Tərlan O.','Yusif Z.','Həsən G.','Əli F.','Nicat P.','Ruslan E.','Elçin L.'];

const S={
 min:L('{n} dəq','{n} мин','{n} min'),hmin:L('{h} saat {n} dəq','{h} ч {n} мин','{h} h {n} min'),hour:L('{h} saat','{h} ч','{h} h'),
 closed:L('Bazar günü bərbərxana bağlıdır.','По воскресеньям барбершоп закрыт.','The barbershop is closed on Sundays.'),closedShort:L('Bağlı','Закрыто','Closed'),
 dayAria:L('{n} rezerv, {p}% dolu','записей: {n}, занято {p}%','{n} bookings, {p}% booked'),
 dayOff:L('İstirahət günü','Выходной','Day off'),breakL:L('Fasilə','Перерыв','Break'),ghost:L('Seçilmiş vaxt','Выбранное время','Selected time'),
 bookW:L('rezerv','зап.','booked'),
 nBook:L('{n} rezerv','записей: {n}','{n} bookings'),
 newTitle:L('Yeni rezerv','Новая запись','New booking'),detailTitle:L('Rezerv','Запись','Booking'),
 backNew:L('Yeni rezerv','Новая запись','New booking'),back:L('Geri','Назад','Back'),
 svc:L('Xidmət','Услуга','Service'),barber:L('Usta','Мастер','Barber'),time:L('Vaxt','Время','Time'),client:L('Müştəri','Клиент','Client'),
 when:L('Vaxt','Время','When'),note:L('Qeyd','Заметка','Note'),
 anyBarber:L('İstənilən usta','Любой мастер','Any barber'),nFree:L('{n} boş vaxt','свободно: {n}','{n} free'),
 takes:L('{d} çəkir','займёт {d}','takes {d}'),
 pastDay:L('Keçmiş günə rezerv yaratmaq olmur. Bu günə və ya gələcək günə keçin.','На прошедший день записать нельзя. Перейдите на сегодня или будущий день.','You can’t book a past day. Switch to today or a later day.'),
 noFree:L('Bu gün seçilmiş xidmət üçün boş vaxt qalmayıb.','На этот день для выбранной услуги свободного времени нет.','No free time left for this service on this day.'),
 nextFree:L('Ən yaxın boş vaxt: {day}, {time}','Ближайшее свободное: {day}, {time}','Next free: {day}, {time}'),
 name:L('Ad','Имя','Name'),phone:L('Telefon','Телефон','Phone'),noteOpt:L('Qeyd (istəyə görə)','Заметка (необязательно)','Note (optional)'),
 errName:L('Müştərinin adını yazın.','Укажите имя клиента.','Enter the client’s name.'),
 errPhone:L('Nömrəni +994 50 123 45 67 formatında yazın.','Укажите номер в формате +994 50 123 45 67.','Use the format +994 50 123 45 67.'),
 errTaken:L('Bu vaxt artıq tutulub. Başqa vaxt seçin.','Это время уже занято. Выберите другое.','That time was just taken. Pick another.'),
 confirm:L('Rezervi təsdiqlə','Подтвердить запись','Confirm booking'),
 demoNote:L('Demo: rezerv yalnız bu səhifədə saxlanır, müştəriyə SMS göndərilmir.','Демо: запись хранится только на этой странице, SMS клиенту не отправляется.','Demo: the booking lives on this page only; no SMS is sent.'),
 booked:L('Rezerv təsdiqləndi: {client}, {time}, {barber}. SMS göndərilmədi (demo).','Запись подтверждена: {client}, {time}, {barber}. SMS не отправлено (демо).','Booking confirmed: {client}, {time} with {barber}. No SMS sent (demo).'),
 move:L('Vaxtı dəyiş','Перенести','Reschedule'),moveTitle:L('Yeni vaxt: {client}','Новое время: {client}','New time for {client}'),moveSave:L('Yeni vaxtı saxla','Сохранить новое время','Save new time'),
 moved:L('{client} {time} vaxtına keçirildi ({barber}).','{client}: запись перенесена на {time} ({barber}).','{client} moved to {time} with {barber}.'),
 cancel:L('Rezervi ləğv et','Отменить запись','Cancel booking'),cancelAsk:L('{client} üçün {time} rezervi ləğv edilsin? Vaxt boşalacaq.','Отменить запись {client} на {time}? Время освободится.','Cancel {client}’s {time} booking? The time becomes free.'),
 cancelYes:L('Bəli, ləğv et','Да, отменить','Yes, cancel'),keep:L('Saxla','Оставить','Keep it'),
 cancelled:L('{client} üçün {time} rezervi ləğv edildi.','Запись {client} на {time} отменена.','{client}’s {time} booking was cancelled.'),
 pastBooking:L('Bu rezervin vaxtı keçib; onu dəyişmək və ya ləğv etmək olmur.','Время этой записи прошло; её нельзя перенести или отменить.','This booking is in the past and can no longer be changed.'),
 emptyDay:L('Bu günə hələ heç kim yazılmayıb. İlk rezervi “Yeni rezerv” panelindən yaradın.','На этот день ещё никто не записан. Создайте первую запись в панели «Новая запись».','Nobody has booked this day yet. Create the first one in the New booking panel.'),
 closedGo:L('Bazar ertəsinə keç','Перейти на понедельник','Go to Monday'),
 statN:L('{n} rezerv','записей: {n}','{n} bookings'),statP:L('{p}% dolu','занято {p}%','{p}% booked'),statR:L('{sum} gözlənilən','{sum} ожидается','{sum} expected'),
 today:L('Bu gün','Сегодня','Today')
};

export default {id:'reserve',brand:'Reserve',kind:'app',render(ctx){
 const t=ctx.t;
 const D={today:TODAY,now:NOW,closed:[6],S:ctx.resolve(S),names,
  barbers:barbers.map(b=>({...b,role:ctx.raw(b.role)})),services:services.map(s=>({...s,name:ctx.raw(s.name)})),
  wdLong:ctx.raw(L('Bazar ertəsi|Çərşənbə axşamı|Çərşənbə|Cümə axşamı|Cümə|Şənbə|Bazar','Понедельник|Вторник|Среда|Четверг|Пятница|Суббота|Воскресенье','Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday')).split('|'),
  wdShort:ctx.raw(L('B.e.|Ç.a.|Ç.|C.a.|C.|Ş.|B.','Пн|Вт|Ср|Чт|Пт|Сб|Вс','Mon|Tue|Wed|Thu|Fri|Sat|Sun')).split('|'),
  monthsGen:ctx.raw(L('yanvar|fevral|mart|aprel|may|iyun|iyul|avqust|sentyabr|oktyabr|noyabr|dekabr','января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря','January|February|March|April|May|June|July|August|September|October|November|December')).split('|'),
  monthsShort:ctx.raw(L('yan|fev|mar|apr|may|iyn|iyl|avq|sen|okt|noy|dek','янв|фев|мар|апр|мая|июн|июл|авг|сен|окт|ноя|дек','Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec')).split('|')};
 D.bookings=seed(D);
 const F=makeFmt(D),st=dayStats(D,TODAY);
 const ico=p=>`<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="${p}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
 const priceRows=D.services.map(s=>`<tr><th scope="row">${esc(s.name)}</th><td>${esc(F.dur(s.dur))}</td><td>${F.azn(s.price)}</td><td>${esc(s.by.length===4?ctx.raw(L('hamı','все','everyone')):s.by.map(id=>barbers.find(b=>b.id===id).name).join(', '))}</td></tr>`).join('');
 const teamRows=D.barbers.map(b=>`<tr><th scope="row">${esc(b.name)}<span>${esc(b.role)}</span></th><td>${hm(b.from)}–${hm(b.to)}</td><td>${hm(b.br)}–${hm(b.br+b.brLen)}</td><td>${esc(D.wdLong[b.off])}</td></tr>`).join('');
 return `<div class="rs">
<header class="rs-top">
 <p class="rs-logo"><svg viewBox="0 0 28 28" width="26" height="26" aria-hidden="true"><rect x="3" y="5" width="22" height="19" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 11h22M9 2.5v5M19 2.5v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="8" y="15" width="7" height="5" rx="1" fill="currentColor"/></svg>Reserve</p>
 <div class="rs-top-text"><h1>${t(L('Ülgüc Barbershop-un qəbul masası','Стойка администратора барбершопа «Ülgüc»','The front desk of Ülgüc Barbershop'))}</h1>
 <p>${t(L('Yasamalda dörd ustalı fiktiv bərbərxana. Administrator telefonla yazılan müştərini təqvimə salır: xidməti seçir, Reserve ustanın iş saatına, fasiləsinə və mövcud rezervlərə görə yalnız real boş vaxtları göstərir.','Вымышленный барбершоп в Ясамале с четырьмя мастерами. Администратор записывает клиента по телефону: выбирает услугу, а Reserve показывает только реально свободное время с учётом смены, перерыва и записей мастера.','A fictional four-barber shop in Yasamal. The administrator books a phone caller: pick the service and Reserve shows only genuinely free times, based on each barber’s shift, break and existing bookings.'))}</p></div>
</header>
<div class="rs-app">
 <section class="rs-main" aria-labelledby="rs-date">
  <div class="rs-daybar">
   <div class="rs-nav"><button type="button" class="rs-icon" id="rs-prev" aria-label="${t(L('Əvvəlki həftə','Предыдущая неделя','Previous week'))}">${ico('M12 4 6 10l6 6')}</button><button type="button" class="rs-icon" id="rs-next" aria-label="${t(L('Növbəti həftə','Следующая неделя','Next week'))}">${ico('M8 4l6 6-6 6')}</button><button type="button" class="rs-btn rs-btn-s" id="rs-today">${t(S.today)}</button></div>
   <h2 id="rs-date" aria-live="polite">${esc(F.long(TODAY))}</h2>
   <p class="rs-stats" id="rs-stats"><span>${t(S.statN,{n:st.n})}</span><span>${t(S.statP,{p:st.pct})}</span><span>${t(S.statR,{sum:F.azn(st.rev)})}</span></p>
  </div>
  <ol class="rs-week" id="rs-week">${week(D,F,TODAY)}</ol>
  <div class="rs-mob" id="rs-mob" role="group" aria-label="${t(S.barber)}">${D.barbers.map((b,i)=>`<button type="button" data-barber="${b.id}" aria-pressed="${i===0}">${esc(b.name)}</button>`).join('')}</div>
  <p class="rs-notice" id="rs-notice" hidden></p>
  <div class="rs-closed" id="rs-closed" hidden><p>${t(S.closed)}</p><button type="button" class="rs-btn" id="rs-closed-go">${t(S.closedGo)}</button></div>
  <div class="rs-grid" id="rs-grid" data-mob="elvin">${grid(D,F,TODAY)}</div>
  <p class="rs-legend"><span class="rs-lg rs-lg-b"></span>${t(L('Rezerv','Запись','Booking'))}<span class="rs-lg rs-lg-p"></span>${t(L('Keçmiş','Прошедшая','Past'))}<span class="rs-lg rs-lg-n"></span>${t(L('Yeni / seçilmiş','Новая / выбранная','New / selected'))}<span class="rs-lg rs-lg-o"></span>${t(L('Fasilə, iş saatından kənar','Перерыв, нерабочее время','Break, outside hours'))}</p>
 </section>
 <aside class="rs-panel" id="rs-panel" aria-labelledby="rs-p-title" tabindex="-1">${panel(D,F,TODAY,{mode:'new',barber:'any'})}</aside>
</div>
<section class="rs-how" aria-labelledby="rs-how-h">
 <h2 id="rs-how-h">${t(L('Boş vaxt necə hesablanır','Как считается свободное время','How free time is worked out'))}</h2>
 <ol class="rs-rules">
  <li>${t(L('Ustanın növbəsi götürülür: məsələn, Elvin 10:00–19:00.','Берётся смена мастера: например, Эльвин 10:00–19:00.','Start from the barber’s shift: Elvin works 10:00–19:00.'))}</li>
  <li>${t(L('Fasilə və mövcud rezervlər çıxılır.','Вычитаются перерыв и существующие записи.','Take out the break and existing bookings.'))}</li>
  <li>${t(L('Başlanğıclar 15 dəqiqəlik addımla yoxlanır; xidmət bütöv sığmalıdır — 75 dəqiqəlik “Saç və saqqal” 60 dəqiqəlik boşluğa yazılmır.','Начало проверяется с шагом 15 минут; услуга должна поместиться целиком — 75-минутная «Стрижка и борода» не встанет в окно на 60 минут.','Starts are tried every 15 minutes and the whole service must fit — a 75-minute haircut and beard never lands in a 60-minute gap.'))}</li>
  <li>${t(L('Bu gün üçün keçmiş vaxtlar göstərilmir; usta bu xidməti etmirsə, siyahıda yoxdur.','Прошедшее время сегодня не показывается; если мастер не делает услугу, его нет в списке.','Past times today are hidden, and a barber who doesn’t offer the service isn’t listed.'))}</li>
 </ol>
 <div class="rs-tables">
  <div><h3>${t(L('Xidmətlər və qiymətlər','Услуги и цены','Services and prices'))}</h3><table class="rs-table"><thead><tr><th scope="col">${t(S.svc)}</th><th scope="col">${t(L('Müddət','Длительность','Length'))}</th><th scope="col">${t(L('Qiymət','Цена','Price'))}</th><th scope="col">${t(L('Kim edir','Кто делает','Who'))}</th></tr></thead><tbody>${priceRows}</tbody></table></div>
  <div><h3>${t(L('Komanda','Команда','Team'))}</h3><table class="rs-table"><thead><tr><th scope="col">${t(S.barber)}</th><th scope="col">${t(L('Növbə','Смена','Shift'))}</th><th scope="col">${t(S.breakL)}</th><th scope="col">${t(L('İstirahət','Выходной','Day off'))}</th></tr></thead><tbody>${teamRows}</tbody></table>
  <p class="rs-small">${t(L('Bərbərxana bazar ertəsindən şənbəyə qədər açıqdır, bazar günü bağlıdır.','Барбершоп работает с понедельника по субботу, в воскресенье закрыт.','Open Monday to Saturday, closed on Sunday.'))}</p></div>
 </div>
</section>
<footer class="rs-foot"><p><b>Reserve</b> — ${t(L('BAKHY konsept nümunəsi. Ülgüc Barbershop, ustalar və müştərilər uydurmadır; təqvimdəki “indi” 3 noyabr 2026, 13:20 kimi sabitlənib.','концепт-пример BAKHY. Барбершоп «Ülgüc», мастера и клиенты вымышлены; «сейчас» в календаре зафиксировано как 3 ноября 2026, 13:20.','a BAKHY concept sample. Ülgüc Barbershop, its barbers and clients are fictional; the calendar’s “now” is fixed at 3 November 2026, 13:20.'))}</p></footer>
<div class="rs-toast" id="rs-toast" role="status" aria-live="polite"></div>
${ctx.data(D)}
</div>`;
}};
