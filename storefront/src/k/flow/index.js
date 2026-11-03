// Flow CRM — the sales pipeline of a fictional Baku caterer that sells lunch contracts to offices.
import {L,esc} from '../kit.js';
import {TODAY,owners,stages,roles,nextSteps,lostReasons,kinds,acts,deals} from './data.js';
import {board,summary,ownerChips,makeFmt,addDays,value} from './view.js';

const S={
 today:L('bu gün','сегодня','today'),tomorrow:L('sabah','завтра','tomorrow'),yesterday:L('dünən','вчера','yesterday'),
 daysLate:L('{n} gün gecikib','просрочено на {n} дн.','{n} days late'),
 termsDaily:L('{people} nəfər × {price} AZN, {months} ay','{people} чел. × {price} AZN, {months} мес.','{people} people × {price} AZN, {months} months'),
 termsEvent:L('{people} qonaq × {price} AZN, bir dəfə','{people} гостей × {price} AZN, разово','{people} guests × {price} AZN, one-off'),
 noNext:L('Növbəti addım yoxdur','Нет следующего шага','No next step'),
 prob:L('ehtimal {p}%','вероятность {p}%','{p}% likely'),
 emptyCol:L('Bu mərhələdə uyğun sövdələşmə yoxdur.','На этом этапе подходящих сделок нет.','No matching deals at this stage.'),
 sOpen:L('Açıq axın','Открытая воронка','Open pipeline'),sDeals:L('{n} sövdələşmə','сделок: {n}','{n} deals'),
 sWeighted:L('Ehtimalla hesablanmış','С учётом вероятности','Weighted value'),sWeightedHint:L('mərhələ ehtimalına görə','по вероятности этапа','by stage probability'),
 sWon:L('İmzalanmış müqavilələr','Подписанные договоры','Signed contracts'),
 sLate:L('Gecikmiş addımlar','Просроченные шаги','Overdue next steps'),sLateHint:L('açıq sövdələşmələrdə','в открытых сделках','on open deals'),
 all:L('Hamısı','Все','Everyone'),
 // drawer
 close:L('Bağla','Закрыть','Close'),stage:L('Mərhələ','Этап','Stage'),owner:L('Məsul','Ответственный','Owner'),
 contact:L('Əlaqə şəxsi','Контактное лицо','Contact'),phone:L('Telefon','Телефон','Phone'),
 valueTitle:L('Müqavilə dəyəri','Сумма договора','Contract value'),perMonth:L('{sum} ayda','{sum} в месяц','{sum} a month'),
 formulaDaily:L('{people} nəfər × {price} AZN × 21 iş günü × {months} ay','{people} чел. × {price} AZN × 21 рабочий день × {months} мес.','{people} people × {price} AZN × 21 working days × {months} months'),
 formulaEvent:L('{people} qonaq × {price} AZN','{people} гостей × {price} AZN','{people} guests × {price} AZN'),
 created:L('Yaradılıb: {date}','Создана: {date}','Created {date}'),
 nextTitle:L('Növbəti addım','Следующий шаг','Next step'),nextWhat:L('Nə edilməlidir','Что сделать','What needs to happen'),nextWhen:L('Tarix','Дата','Date'),
 schedule:L('Planlaşdır','Запланировать','Schedule'),
 scheduled:L('Növbəti addım planlaşdırıldı: {text}, {date}','Следующий шаг запланирован: {text}, {date}','Next step scheduled: {text}, {date}'),
 errNext:L('Addımı yazın.','Опишите шаг.','Describe the step.'),errPast:L('Tarix bu gündən əvvəl ola bilməz.','Дата не может быть раньше сегодняшней.','The date cannot be before today.'),
 noteLabel:L('Qeyd','Заметка','Note'),notePh:L('Məsələn: menyuda vegetarian variant istədilər','Например: попросили вегетарианский вариант','For example: they asked for a vegetarian option'),
 addNote:L('Qeyd əlavə et','Добавить заметку','Add note'),errNote:L('Boş qeyd əlavə etmək olmaz.','Пустую заметку добавить нельзя.','A note cannot be empty.'),
 noteAdded:L('Qeyd əlavə edildi','Заметка добавлена','Note added'),
 history:L('Tarixçə','История','Activity'),
 moved:L('{co}: mərhələ dəyişdi — {stage}','{co}: этап изменён — {stage}','{co}: stage changed to {stage}'),
 actMoved:L('Mərhələ dəyişdi: {from} → {to}','Этап изменён: {from} → {to}','Stage changed: {from} → {to}'),
 actOwner:L('Məsul dəyişdi: {name}','Ответственный изменён: {name}','Owner changed to {name}'),
 actNext:L('Növbəti addım: {text} ({date})','Следующий шаг: {text} ({date})','Next step: {text} ({date})'),
 actCreated:L('Sövdələşmə yaradıldı','Сделка создана','Deal created'),
 lostLine:acts.lost,
 lostAsk:L('İtirilmə səbəbi','Причина потери','Reason for losing'),
 kinds:{daily:kinds.daily,event:kinds.event},
 reasons:lostReasons,
 // new deal
 newTitle:L('Yeni sövdələşmə','Новая сделка','New deal'),
 fCo:L('Şirkət','Компания','Company'),fContact:L('Əlaqə şəxsi','Контактное лицо','Contact person'),fPhone:L('Telefon (istəyə görə)','Телефон (необязательно)','Phone (optional)'),
 fType:L('Sifariş növü','Тип заказа','Order type'),fPeople:L('Nəfər sayı','Количество человек','Headcount'),fPrice:L('Porsiya qiyməti, AZN','Цена порции, AZN','Price per portion, AZN'),
 fMonths:L('Müddət','Срок','Term'),monthsOpt:L('{n} ay','{n} мес.','{n} months'),
 fOwner:L('Məsul menecer','Ответственный менеджер','Owner'),fNext:L('İlk addım','Первый шаг','First step'),
 preview:L('Hesablanmış dəyər','Расчётная сумма','Calculated value'),
 create:L('Sövdələşmə yarat','Создать сделку','Create deal'),cancel:L('Ləğv et','Отмена','Cancel'),
 createdToast:L('{co} “Müraciət” mərhələsinə əlavə olundu. Demo: məlumat yalnız bu səhifədə saxlanır.','{co} добавлена на этап «Заявка». Демо: данные хранятся только на этой странице.','{co} was added to Inquiry. Demo: data lives only on this page.'),
 errCo:L('Şirkətin adını yazın.','Укажите название компании.','Enter the company name.'),
 errContact:L('Əlaqə şəxsini yazın.','Укажите контактное лицо.','Enter a contact person.'),
 errPhone:L('Nömrəni +994 50 123 45 67 formatında yazın.','Укажите номер в формате +994 50 123 45 67.','Use the format +994 50 123 45 67.'),
 errPeople:L('Ən azı 10 nəfər, ən çoxu 2000.','От 10 до 2000 человек.','Between 10 and 2,000 people.'),
 errPrice:L('Porsiya qiyməti 4 ilə 60 AZN arasında olmalıdır.','Цена порции — от 4 до 60 AZN.','Portion price must be between 4 and 60 AZN.'),
 errDup:L('Bu şirkət üçün açıq sövdələşmə artıq var.','Для этой компании уже есть открытая сделка.','This company already has an open deal.'),
 errSummary:L('Formada {n} xəta var.','В форме ошибок: {n}.','The form has {n} errors.'),
 nextDefault:nextSteps.qualify,
 // board messages
 noResult:L('“{q}” üzrə sövdələşmə tapılmadı','По запросу «{q}» сделок нет','No deals match “{q}”'),
 noResultOwner:L('Seçilmiş menecerdə bu axtarışa uyğun sövdələşmə yoxdur.','У выбранного менеджера нет сделок по этому запросу.','The selected owner has no deals that match.'),
 dropHint:L('{co} “{stage}” mərhələsinə köçürüldü','{co} перемещена на этап «{stage}»','{co} moved to {stage}')
};

const MONTHS=L('yan fev mar apr may iyn iyl avq sen okt noy dek','янв фев мар апр мая июн июл авг сен окт ноя дек','Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec');

export default {id:'flow',brand:'Flow CRM',kind:'app',render(ctx){
 const t=ctx.t,phone=i=>`+994 ${['50','55','51','70','77'][i%5]} ${String(200+i*37%700).padStart(3,'0')} ${String(10+i*13%89).padStart(2,'0')} ${String(10+i*29%89).padStart(2,'0')}`;
 const F0=makeFmt({locale:ctx.locale,months:ctx.raw(MONTHS).split(' '),today:TODAY,S:{}});
 const order=['lead','tasting','proposal','negotiation','won'];
 const D={today:TODAY,locale:ctx.locale,months:ctx.raw(MONTHS).split(' '),S:ctx.resolve(S),owners,
  stages:stages.map(s=>({id:s.id,p:s.p,name:ctx.raw(s.name)})),
  nextSteps:Object.fromEntries(Object.entries(nextSteps).map(([k,v])=>[k,ctx.raw(v)])),
  deals:deals.map(r=>{
   const [id,co,contact,role,type,people,price,months,stage,owner,next,nOff,age,lost]=r;
   const created=addDays(TODAY,-age),v={people:F0.n(people),price:F0.price(price),months};
   const reached=stage==='lost'?2:order.indexOf(stage);
   const keys=['in_'+type,'tasting','proposal',type==='daily'?'neg_daily':'neg_event','won'].slice(0,reached+1);
   const steps=keys.length+(stage==='lost'?1:0);
   const list=keys.map((k,i)=>({date:addDays(created,Math.round(i*age/Math.max(steps,1))),kind:k.split('_')[0],text:ctx.raw(acts[k],v),by:owner}));
   if(stage==='lost')list.push({date:addDays(TODAY,-Math.max(1,Math.round(age/5))),kind:'lost',text:ctx.raw(acts.lost,{reason:ctx.raw(lostReasons[lost])}),by:owner});
   return {id,co,contact,role:ctx.raw(roles[role]),phone:phone(id),type,people,price,months,stage,owner,created,
    next:next?{date:addDays(TODAY,nOff),text:ctx.raw(nextSteps[next])}:null,
    lostText:lost?ctx.raw(acts.lost,{reason:ctx.raw(lostReasons[lost])}):'',acts:list.reverse()};
  })};
 const F=makeFmt(D),st={owner:'all',q:'',showLost:false,stage:'lead'},B=board(D,F,st);
 const big=D.deals.reduce((a,d)=>value(d)>value(a)?d:a);
 const icon=(p)=>`<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="${p}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
 const stageRules=stages.map(s=>`<li><h3>${t(s.name)}${s.p&&s.p<100?` <span>${t(S.prob,{p:s.p})}</span>`:''}</h3><p>${t(s.rule)}</p></li>`).join('');
 const owOpts=owners.map(o=>`<option value="${o.id}">${esc(o.name)}</option>`).join('');
 return `<div class="fl">
<header class="fl-intro">
 <p class="fl-mark"><svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><path d="M4 9h17M4 16h24M4 23h11" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><circle cx="26" cy="9" r="3" fill="currentColor"/></svg><span>Flow <b>CRM</b></span></p>
 <div class="fl-intro-text">
  <h1>${t(L('Ofis naharı satan komanda üçün satış lövhəsi','Доска продаж для команды, которая продаёт офисные обеды','A sales board for a team that sells office lunches'))}</h1>
  <p>${t(L('Bu nümunədə Flow fiktiv Nar Catering şirkəti üçün qurulub: dörd menecer Bakı ofislərinə gündəlik nahar müqavilələri və korporativ tədbir menyusu satır. Mərhələləri, sahələri və hesablama qaydasını sizin prosesə görə dəyişirik.','В этом примере Flow настроен для вымышленной компании Nar Catering: четыре менеджера продают бакинским офисам договоры на ежедневные обеды и меню для корпоративов. Этапы, поля и расчёт мы меняем под ваш процесс.','In this sample Flow is set up for Nar Catering, a fictional company whose four account managers sell daily lunch contracts and event menus to Baku offices. Stages, fields and the value formula are changed to fit your process.'))}</p>
 </div>
 <p class="fl-intro-hint">${t(L('Sınayın: kartı açıb mərhələni dəyişin, qeyd yazın və ya yeni sövdələşmə yaradın. Cəmlər hər yerdə yenilənir.','Попробуйте: откройте карточку и смените этап, добавьте заметку или создайте сделку. Суммы обновятся везде.','Try it: open a card and change its stage, add a note or create a deal. Totals update everywhere.'))}</p>
</header>
<section class="fl-app" aria-label="${t(L('Satış axını','Воронка продаж','Sales pipeline'))}">
 <div class="fl-toolbar">
  <p class="fl-ws"><span class="fl-ws-dot" aria-hidden="true"></span>Nar Catering <span>${t(L('Korporativ satış','Корпоративные продажи','Corporate sales'))}</span></p>
  <div class="fl-search"><label class="sr-only" for="fl-q">${t(L('Şirkət və ya əlaqə şəxsi üzrə axtar','Поиск по компании или контакту','Search by company or contact'))}</label>${icon('M9 15.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13ZM14 14l4 4')}<input id="fl-q" type="search" autocomplete="off" placeholder="${t(L('Şirkət və ya əlaqə şəxsi','Компания или контакт','Company or contact'))}"></div>
  <button type="button" class="fl-btn fl-btn-primary" id="fl-new-open">${icon('M10 4v12M4 10h12')}${t(S.newTitle)}</button>
 </div>
 <div class="fl-filters">
  <div class="fl-chips" role="group" aria-label="${t(L('Məsul menecer','Ответственный менеджер','Owner'))}" id="fl-owners">${ownerChips(D,st)}</div>
  <label class="fl-check"><input type="checkbox" id="fl-lost"> ${t(L('İtirilənləri göstər','Показать потерянные','Show lost deals'))}</label>
 </div>
 <dl class="fl-summary" id="fl-summary" aria-live="polite">${summary(D,F,st)}</dl>
 <div class="fl-tabs" id="fl-tabs" role="group" aria-label="${t(S.stage)}">${B.tabs}</div>
 <div class="fl-board" id="fl-board">${B.html}</div>
 <div class="fl-noresult" id="fl-noresult" hidden><p class="fl-noresult-title" id="fl-noresult-title"></p><p id="fl-noresult-hint"></p><button type="button" class="fl-btn" id="fl-clear">${t(L('Axtarışı və filtri təmizlə','Сбросить поиск и фильтр','Clear search and filter'))}</button></div>
</section>
<section class="fl-setup" aria-labelledby="fl-setup-h">
 <div class="fl-setup-head">
  <h2 id="fl-setup-h">${t(L('Bu quruluş Nar Catering üçün necə işləyir','Как эта настройка работает для Nar Catering','How this setup works for Nar Catering'))}</h2>
  <p>${t(L('Hazır CRM-də “mərhələ” sadəcə sütundur. Burada hər mərhələnin giriş qaydası var və dəyər əl ilə yazılmır — menecerin danışdığı iki rəqəmdən hesablanır.','В готовых CRM «этап» — просто колонка. Здесь у каждого этапа есть правило входа, а сумма не вводится вручную — она считается из двух чисел, о которых договаривается менеджер.','In an off-the-shelf CRM a stage is just a column. Here each stage has an entry rule, and value is never typed in — it is calculated from the two numbers a manager actually negotiates.'))}</p>
 </div>
 <ol class="fl-rules">${stageRules}</ol>
 <div class="fl-formula">
  <h3>${t(L('Dəyər necə hesablanır','Как считается сумма','How value is calculated'))}</h3>
  <p><b>${t(kinds.daily)}</b> ${t(L('nəfər × porsiya qiyməti × 21 iş günü × müddət (ay)','человек × цена порции × 21 рабочий день × срок (мес.)','people × portion price × 21 working days × term in months'))}</p>
  <p><b>${t(kinds.event)}</b> ${t(L('qonaq sayı × bir qonaq üçün qiymət','число гостей × цена на гостя','guests × price per guest'))}</p>
  <p class="fl-formula-eg">${t(L('Ən böyük açıq sövdələşmə: {co}, {terms} = {sum}.','Крупнейшая открытая сделка: {co}, {terms} = {sum}.','Largest deal on the board: {co}, {terms} = {sum}.'),{co:big.co,terms:F.terms(big),sum:F.azn(value(big))})}</p>
 </div>
</section>
<footer class="fl-foot"><p><b>Flow CRM</b> — ${t(L('BAKHY konsept nümunəsi. Nar Catering, şirkətlər, adlar və məbləğlər uydurmadır; dəyişikliklər yalnız brauzerinizdə qalır.','концепт-пример BAKHY. Nar Catering, компании, имена и суммы вымышлены; изменения остаются только в вашем браузере.','a BAKHY concept sample. Nar Catering, the companies, names and amounts are fictional; changes stay in your browser only.'))}</p></footer>

<dialog class="fl-drawer" id="fl-drawer" aria-labelledby="fl-d-title"><div class="fl-drawer-inner" id="fl-drawer-body"></div></dialog>

<dialog class="fl-modal" id="fl-new" aria-labelledby="fl-new-title">
 <form class="fl-form" id="fl-new-form" novalidate>
  <header class="fl-modal-head"><h2 id="fl-new-title">${t(S.newTitle)}</h2><button type="button" class="fl-x" data-close aria-label="${t(S.close)}">${icon('M5 5l10 10M15 5 5 15')}</button></header>
  <p class="fl-form-err" id="fl-new-err" role="alert" hidden></p>
  <div class="fl-grid2">
   <div class="fl-field fl-span2"><label for="fn-co">${t(S.fCo)}</label><input id="fn-co" name="co" autocomplete="organization" required aria-describedby="fn-co-e"><p class="fl-err" id="fn-co-e"></p></div>
   <div class="fl-field"><label for="fn-contact">${t(S.fContact)}</label><input id="fn-contact" name="contact" autocomplete="name" required aria-describedby="fn-contact-e"><p class="fl-err" id="fn-contact-e"></p></div>
   <div class="fl-field"><label for="fn-phone">${t(S.fPhone)}</label><input id="fn-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+994 50 123 45 67" aria-describedby="fn-phone-e"><p class="fl-err" id="fn-phone-e"></p></div>
   <fieldset class="fl-field fl-span2 fl-seg"><legend>${t(S.fType)}</legend><label><input type="radio" name="type" value="daily" checked> ${t(kinds.daily)}</label><label><input type="radio" name="type" value="event"> ${t(kinds.event)}</label></fieldset>
   <div class="fl-field"><label for="fn-people">${t(S.fPeople)}</label><input id="fn-people" name="people" type="number" inputmode="numeric" min="10" max="2000" step="1" required aria-describedby="fn-people-e"><p class="fl-err" id="fn-people-e"></p></div>
   <div class="fl-field"><label for="fn-price">${t(S.fPrice)}</label><input id="fn-price" name="price" type="number" inputmode="decimal" min="4" max="60" step="0.1" required aria-describedby="fn-price-e"><p class="fl-err" id="fn-price-e"></p></div>
   <div class="fl-field" id="fn-months-f"><label for="fn-months">${t(S.fMonths)}</label><select id="fn-months" name="months">${[3,6,9,12].map(n=>`<option value="${n}"${n===12?' selected':''}>${t(S.monthsOpt,{n})}</option>`).join('')}</select></div>
   <div class="fl-field"><label for="fn-owner">${t(S.fOwner)}</label><select id="fn-owner" name="owner">${owOpts}</select></div>
  </div>
  <p class="fl-preview"><span>${t(S.preview)}</span><output id="fn-preview" for="fn-people fn-price fn-months">—</output><small id="fn-formula"></small></p>
  <footer class="fl-modal-foot"><button type="button" class="fl-btn" data-close>${t(S.cancel)}</button><button type="submit" class="fl-btn fl-btn-primary">${t(S.create)}</button></footer>
 </form>
</dialog>
<div class="fl-toast" id="fl-toast" role="status" aria-live="polite"></div>
${ctx.data(D)}
</div>`;
}};
