// Growly — goal-based savings planner (concept app). Static shell rendered per language; app.js does the arithmetic.
import {L} from '../kit.js';

// Sample goals. `months` is counted from the visitor's current month so the demo never starts with a past date.
const goals=[
 {id:'flat',name:L('Mənzil üçün ilkin ödəniş','Первый взнос за квартиру','Flat deposit'),target:24000,months:36,current:5200,monthly:450,rate:3,inflation:0},
 {id:'uni',name:L('Universitet təhsili','Учёба в университете','University tuition'),target:18000,months:84,current:2000,monthly:150,rate:4,inflation:0},
 {id:'fund',name:L('Ehtiyat fondu: 6 aylıq xərc','Резервный фонд: расходы на 6 месяцев','Emergency fund: 6 months of costs'),target:6000,months:14,current:1800,monthly:250,rate:0,inflation:0}
];

const S={
 months:[L('yan','янв','Jan'),L('fev','фев','Feb'),L('mar','мар','Mar'),L('apr','апр','Apr'),L('may','май','May'),L('iyn','июн','Jun'),L('iyl','июл','Jul'),L('avq','авг','Aug'),L('sen','сен','Sep'),L('okt','окт','Oct'),L('noy','ноя','Nov'),L('dek','дек','Dec')],
 monthsLong:[L('yanvar','январь','January'),L('fevral','февраль','February'),L('mart','март','March'),L('aprel','апрель','April'),L('may','май','May'),L('iyun','июнь','June'),L('iyul','июль','July'),L('avqust','август','August'),L('sentyabr','сентябрь','September'),L('oktyabr','октябрь','October'),L('noyabr','ноябрь','November'),L('dekabr','декабрь','December')],
 need:L('{date} tarixinə {target} toplamaq üçün ayda {monthly} lazımdır.','Срок — {date}. Чтобы накопить {target}, нужно откладывать {monthly} в месяц.','To reach {target} by {date} you need {monthly} a month.'),
 needNone:L('Mövcud {current} və fərz etdiyiniz faizlə {target} məbləğinə {date} tarixinədək əlavə ödənişsiz çatırsınız.','С текущими {current} и заданной ставкой вы достигнете {target} к сроку ({date}) без новых взносов.','With your current {current} and the rate you assumed, you reach {target} by {date} without new contributions.'),
 onTrack:L('İndiki {monthly} ilə məqsədə {reach} tarixində çatırsınız — {ahead} ay tez.','С текущими {monthly} цель будет достигнута раньше срока: {reach}, на {ahead} мес.','At your current {monthly} you get there in {reach}, {ahead} months early.'),
 onTime:L('İndiki {monthly} ilə məqsədə vaxtında, {reach} tarixində çatırsınız.','С текущими {monthly} цель будет достигнута точно в срок: {reach}.','At your current {monthly} you get there on time, in {reach}.'),
 behind:L('İndiki {monthly} ilə {date} tarixində {gap} çatışmayacaq.','С текущими {monthly} к сроку ({date}) не хватит {gap}.','At your current {monthly} you will be {gap} short on {date}.'),
 behindReach:L('Bu tempdə məqsədə təxminən {reach} tarixində çatılır.','В этом темпе цель будет достигнута примерно: {reach}.','At this pace you would get there around {reach}.'),
 behindNever:L('Bu tempdə məqsədə 50 il ərzində çatılmır.','В этом темпе цель не достигается за 50 лет.','At this pace the goal is not reached within 50 years.'),
 reached:L('Artıq {current} yığmısınız — bu, {target} məqsədindən çoxdur. Məqsədi yeniləyin və ya yenisini yaradın.','У вас уже {current} — это больше цели {target}. Обновите цель или создайте новую.','You already have {current}, more than the {target} goal. Update it or create a new one.'),
 invalid:L('Hesablama üçün qırmızı ilə işarələnmiş xanaları düzəldin.','Исправьте поля, отмеченные красным, чтобы увидеть расчёт.','Fix the fields marked in red to see the calculation.'),
 whatif:L('Əgər: ayda {monthly}, illik {rate}% fərziyyəsi ilə {date} tarixində {balance} olar ({diff}).','Если: {monthly} в месяц при допущении {rate}% годовых, к сроку ({date}) будет {balance} ({diff}).','What if: {monthly} a month at an assumed {rate}% a year gives {balance} by {date} ({diff}).'),
 real:L('{inflation}% illik inflyasiya fərziyyəsi ilə bu, bugünkü pulla təxminən {real} deməkdir.','При допущении инфляции {inflation}% в год это примерно {real} в сегодняшних деньгах.','At an assumed {inflation}% yearly inflation that is about {real} in today\'s money.'),
 err:{
  name:L('Məqsədə ad verin.','Дайте цели название.','Give the goal a name.'),
  target:L('Məqsəd məbləği 1 AZN-dən 10 000 000 AZN-ə qədər olmalıdır.','Сумма цели — от 1 до 10 000 000 AZN.','The goal must be between 1 and 10 000 000 AZN.'),
  current:L('Mövcud məbləğ 0 və ya daha çox olmalıdır.','Текущая сумма должна быть 0 или больше.','Current savings must be 0 or more.'),
  monthly:L('Aylıq ödəniş 0-dan 1 000 000 AZN-ə qədər ola bilər.','Ежемесячный взнос — от 0 до 1 000 000 AZN.','Monthly amount can be 0 to 1 000 000 AZN.'),
  rate:L('Fərz edilən faiz 0 ilə 10% arasında olmalıdır.','Допущение по ставке — от 0 до 10%.','The assumed rate must be between 0 and 10%.'),
  date:L('Tarix ən azı gələn ay, ən çox 40 il sonra olmalıdır.','Дата — не раньше следующего месяца и не позже чем через 40 лет.','The date must be from next month up to 40 years ahead.'),
  inflation:L('İnflyasiya fərziyyəsi 0 ilə 20% arasında olmalıdır.','Допущение по инфляции — от 0 до 20%.','The inflation assumption must be between 0 and 20%.'),
  extra:L('Əlavə məbləğ −100 000 ilə 100 000 AZN arasında olmalıdır.','Дополнительная сумма — от −100 000 до 100 000 AZN.','The extra amount must be between −100 000 and 100 000 AZN.')
 },
 saved:L('“{name}” yadda saxlanıldı — yalnız bu səhifədə, demo.','«{name}» сохранена — только на этой странице, демо.','“{name}” saved — on this page only, demo.'),
 deleted:L('“{name}” silindi.','«{name}» удалена.','“{name}” deleted.'),
 newName:L('Yeni məqsəd','Новая цель','New goal'),
 emptyTitle:L('Hələ məqsəd yoxdur','Целей пока нет','No goals yet'),
 tipMonth:L('{date}','{date}','{date}'),
 tipContrib:L('Öz ödənişləriniz','Ваши взносы','Your contributions'),
 tipGrowth:L('Fərz edilən artım','Предполагаемый рост','Assumed growth'),
 tipBalance:L('Balans','Баланс','Balance'),
 tipWhatif:L('Əgər…','Если…','What if'),
 goalLine:L('Məqsəd {target}','Цель {target}','Goal {target}'),
 more:L('+{diff} AZN çox','на {diff} AZN больше','{diff} AZN more'),
 less:L('{diff} AZN az','на {diff} AZN меньше','{diff} AZN less'),
 same:L('fərq yoxdur','без разницы','no difference'),
 inMonths:L('{n} ay','{n} мес.','{n} months'),
 chartLabel:L('{name}: {n} ay ərzində balansın proqnozu, fərziyyə','{name}: прогноз баланса на {n} мес., допущение','{name}: projected balance over {n} months, hypothetical'),
 yearEnd:L('İl sonu','Конец года','Year end'),
 final:L('Hədəf tarixi','Целевая дата','Target date'),
 showMonthly:L('Hər ayı göstər','Показать каждый месяц','Show every month'),
 showYearly:L('Yalnız il sonlarını göstər','Показать только концы года','Show year ends only'),
 noGoals:L('Nəyə yığdığınızı yazın — məsələn, “Avtomobil üçün ilkin ödəniş”.','Напишите, на что копите, например «Первый взнос за машину».','Write what you are saving for, for example “Car deposit”.'),
 confirmDelete:L('“{name}” silinsin?','Удалить «{name}»?','Delete “{name}”?'),
 locale:L('az-AZ','ru-RU','en-GB')
};

const field=(ctx,id,label,{type='number',suffix='',hint='',attrs=''}={})=>`<div class="gr-field" data-field="${id}"><label for="gr-${id}">${ctx.t(label)}</label><div class="gr-input"><input id="gr-${id}" name="${id}" type="${type}" ${type==='number'?'inputmode="decimal"':''} ${attrs} aria-describedby="gr-${id}-err${hint?` gr-${id}-hint`:''}">${suffix?`<span class="gr-suffix" aria-hidden="true">${suffix}</span>`:''}</div>${hint?`<p class="gr-hint" id="gr-${id}-hint">${ctx.t(hint)}</p>`:''}<p class="gr-err" id="gr-${id}-err" aria-live="polite"></p></div>`;

export default {
 id:'wealth',brand:'Growly',kind:'app',
 render(ctx){
  const t=ctx.t;
  const tabs=[['goals',L('Məqsədlər','Цели','Goals')],['plan',L('Plan','План','Plan')],['table',L('Cədvəl','Таблица','Table')]];
  const icon={goals:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>',plan:'<path d="M4 19V5M4 19h16M7 15l4-4 3 2 5-6"/>',table:'<path d="M4 5h16v14H4zM4 10h16M4 15h16M10 5v14"/>'};
  return `<div class="gr">
<header class="gr-bar">
 <a class="gr-brand" href="#planner"><svg viewBox="0 0 24 24" aria-hidden="true" class="gr-sprout"><path d="M12 21v-8M12 13c0-4 3-7 8-7 0 4-3 7-8 7zM12 15c0-3-2.5-5.5-7-5.5 0 3 2.5 5.5 7 5.5z"/></svg>Growly</a>
 <nav class="gr-nav" aria-label="${t(L('Bölmələr','Разделы','Sections'))}"><a href="#planner">${t(L('Planlayıcı','Планировщик','Planner'))}</a><a href="#how">${t(L('Necə hesablanır','Как считается','How it works'))}</a><a href="#risks">${t(L('Haqlar və risklər','Комиссии и риски','Fees and risks'))}</a></nav>
</header>

<div class="gr-app" id="planner" data-pane="plan">
 <aside class="gr-goals" id="gr-pane-goals" aria-labelledby="gr-goals-h">
  <h2 id="gr-goals-h">${t(L('Məqsədlərim','Мои цели','My goals'))}</h2>
  <ul class="gr-goal-list" id="gr-goal-list"></ul>
  <p class="gr-empty" id="gr-empty" hidden></p>
  <button type="button" class="gr-btn gr-btn-ghost" id="gr-new">${t(L('Yeni məqsəd əlavə et','Добавить новую цель','Add a new goal'))}</button>
  <p class="gr-aside-note">${t(L('Growly pulunuzu saxlamır və heç bir hesaba qoşulmur. Bu, planlaşdırma alətidir.','Growly не хранит ваши деньги и не подключается к счетам. Это инструмент планирования.','Growly never holds your money or connects to accounts. It is a planning tool.'))}</p>
 </aside>

 <section class="gr-plan" id="gr-pane-plan" aria-labelledby="gr-goal-title">
  <div class="gr-head">
   <h1 id="gr-goal-title">${t(goals[0].name)}</h1>
   <p class="gr-summary" id="gr-summary" aria-live="polite"></p>
   <p class="gr-status" id="gr-status"></p>
   <button type="button" class="gr-btn gr-empty-cta" id="gr-new2">${t(L('İlk məqsədi yarat','Создать первую цель','Create your first goal'))}</button>
  </div>
  <figure class="gr-chart">
   <div class="gr-legend" id="gr-legend">
    <span class="gr-key gr-key-c">${t(S.tipContrib)}</span><span class="gr-key gr-key-g">${t(S.tipGrowth)}</span><span class="gr-key gr-key-w">${t(L('Əgər… ssenarisi','Сценарий «если…»','What-if scenario'))}</span><span class="gr-key gr-key-t">${t(L('Məqsəd','Цель','Goal'))}</span>
   </div>
   <div class="gr-svgwrap"><svg id="gr-svg" class="gr-svg" role="img" tabindex="0" aria-describedby="gr-chart-help" viewBox="0 0 720 340" preserveAspectRatio="none"></svg><div class="gr-tip" id="gr-tip" hidden></div></div>
   <figcaption><span id="gr-chart-help">${t(L('Qrafikin üzərində gəzdirin və ya fokuslayıb ox düymələri ilə aylar üzrə hərəkət edin.','Наведите на график или сфокусируйтесь и листайте месяцы стрелками.','Hover the chart, or focus it and use the arrow keys to move by month.'))}</span> <strong>${t(L('Bu, hipotetik hesablamadır, məsləhət deyil. Gəlirlilik zəmanətli deyil; faizi siz fərz edirsiniz.','Это гипотетический расчёт, а не совет. Доходность не гарантирована; ставку задаёте вы.','This is a hypothetical calculation, not advice. Returns are not guaranteed; you choose the rate.'))}</strong></figcaption>
  </figure>
  <dl class="gr-stats">
   <div><dt>${t(L('Hədəf tarixinə balans','Баланс к целевой дате','Balance on the target date'))}</dt><dd id="gr-s-balance">—</dd></div>
   <div><dt>${t(L('Öz ödənişləriniz','Ваши взносы','Your contributions'))}</dt><dd id="gr-s-contrib">—</dd></div>
   <div><dt>${t(L('Fərz edilən artım','Предполагаемый рост','Assumed growth'))}</dt><dd id="gr-s-growth">—</dd></div>
  </dl>
  <p class="gr-real" id="gr-real" hidden></p>
 </section>

 <form class="gr-form" id="gr-form" novalidate aria-labelledby="gr-form-h">
  <h2 id="gr-form-h">${t(L('Məqsədin parametrləri','Параметры цели','Goal settings'))}</h2>
  ${field(ctx,'name',L('Məqsədin adı','Название цели','Goal name'),{type:'text',attrs:'maxlength="60" autocomplete="off"'})}
  ${field(ctx,'target',L('Lazım olan məbləğ','Нужная сумма','Amount needed'),{suffix:'AZN',attrs:'min="1" step="50"'})}
  <fieldset class="gr-field gr-date" data-field="date"><legend>${t(L('Nə vaxta qədər','К какому сроку','By when'))}</legend>
   <div class="gr-date-row"><label class="sr-only" for="gr-month">${t(L('Ay','Месяц','Month'))}</label><select id="gr-month" name="month" aria-describedby="gr-date-err"></select><label class="sr-only" for="gr-year">${t(L('İl','Год','Year'))}</label><select id="gr-year" name="year" aria-describedby="gr-date-err"></select></div>
   <p class="gr-hint" id="gr-months-left"></p><p class="gr-err" id="gr-date-err" aria-live="polite"></p>
  </fieldset>
  ${field(ctx,'current',L('Artıq yığılıb','Уже накоплено','Already saved'),{suffix:'AZN',attrs:'min="0" step="50"'})}
  ${field(ctx,'monthly',L('Hər ay qoyuram','Откладываю в месяц','I put aside each month'),{suffix:'AZN',attrs:'min="0" step="10"'})}
  <div class="gr-field gr-rate" data-field="rate"><label for="gr-rate">${t(L('Fərz etdiyim illik faiz','Допускаемая годовая ставка','Annual rate I assume'))}</label>
   <div class="gr-rate-row"><input type="range" id="gr-rate-range" min="0" max="10" step="0.5" aria-label="${t(L('Fərz edilən illik faiz, sürüşdürücü','Допускаемая годовая ставка, ползунок','Assumed annual rate, slider'))}"><div class="gr-input gr-input-s"><input id="gr-rate" name="rate" type="number" inputmode="decimal" min="0" max="10" step="0.1" aria-describedby="gr-rate-err gr-rate-hint"><span class="gr-suffix" aria-hidden="true">%</span></div></div>
   <p class="gr-hint" id="gr-rate-hint">${t(L('Ehtiyatlı başlayın. Faizsiz hesab üçün 0 yazın. Bankların əmanət faizləri dəyişir; müqavilədəki effektiv faizi yoxlayın.','Начните осторожно. Для счёта без процентов поставьте 0. Ставки по вкладам меняются; сверяйте эффективную ставку в договоре.','Start cautiously. Use 0 for a plain account. Deposit rates change; check the effective rate in the contract.'))}</p><p class="gr-err" id="gr-rate-err" aria-live="polite"></p></div>
  ${field(ctx,'inflation',L('İnflyasiya fərziyyəsi (istəyə görə)','Допущение по инфляции (необязательно)','Inflation assumption (optional)'),{suffix:'%',attrs:'min="0" max="20" step="0.5"',hint:L('Nəticəni bugünkü pulla görmək üçün. 0 — nəzərə alınmır.','Чтобы увидеть итог в сегодняшних деньгах. 0 — не учитывать.','To see the result in today\'s money. 0 leaves it out.')})}

  <fieldset class="gr-whatif"><legend>${t(L('Əgər…','Если…','What if…'))}</legend>
   ${field(ctx,'extra',L('Aylıq ödənişi dəyişsəm','Если изменю ежемесячный взнос','If I change the monthly amount by'),{suffix:'AZN',attrs:'step="10"'})}
   <div class="gr-field" data-field="altrate"><label for="gr-altrate">${t(L('Faiz başqa olsa','Если ставка будет другой','If the rate were'))}</label><select id="gr-altrate" name="altrate"></select></div>
   <p class="gr-whatif-out" id="gr-whatif-out" aria-live="polite"></p>
  </fieldset>

  <div class="gr-actions"><button type="submit" class="gr-btn">${t(L('Məqsədi yadda saxla','Сохранить цель','Save goal'))}</button><button type="button" class="gr-btn gr-btn-quiet" id="gr-delete">${t(L('Məqsədi sil','Удалить цель','Delete goal'))}</button></div>
  <p class="gr-toast" id="gr-toast" role="status"></p>
 </form>

 <section class="gr-table" id="gr-pane-table" aria-labelledby="gr-table-h">
  <div class="gr-table-head"><h2 id="gr-table-h">${t(L('Ay-ay proqnoz','Прогноз по месяцам','Month by month'))}</h2><button type="button" class="gr-btn gr-btn-ghost" id="gr-granularity" aria-pressed="false"></button></div>
  <div class="gr-scroll" tabindex="0" role="region" aria-labelledby="gr-table-h"><table><thead><tr><th scope="col">${t(L('Ay','Месяц','Month'))}</th><th scope="col">${t(S.tipContrib)}</th><th scope="col">${t(S.tipGrowth)}</th><th scope="col">${t(S.tipBalance)}</th><th scope="col">${t(L('Əgər…','Если…','What if'))}</th></tr></thead><tbody id="gr-tbody"></tbody></table></div>
 </section>

 <nav class="gr-tabs" aria-label="${t(L('Tətbiq bölmələri','Разделы приложения','App sections'))}">${tabs.map(([k,l])=>`<button type="button" data-tab="${k}" aria-pressed="${k==='plan'}"><svg viewBox="0 0 24 24" aria-hidden="true">${icon[k]}</svg>${t(l)}</button>`).join('')}</nav>
</div>

<section class="gr-how" id="how" aria-labelledby="how-h">
 <h2 id="how-h">${t(L('Growly necə hesablayır','Как считает Growly','How Growly calculates'))}</h2>
 <div class="gr-how-grid">
  <p class="gr-lede">${t(L('Hər ay balansınıza fərz etdiyiniz illik faizin on ikidə biri əlavə olunur, sonra aylıq ödənişiniz gəlir. Faiz bütün müddət sabit qalır. Vergi, komissiya və inflyasiya — siz ayrıca daxil etməsəniz — nəzərə alınmır.','Каждый месяц к балансу прибавляется двенадцатая часть допущенной вами годовой ставки, затем ваш ежемесячный взнос. Ставка не меняется весь срок. Налоги, комиссии и инфляция не учитываются, если вы не добавите их сами.','Each month your balance gains one twelfth of the annual rate you assumed, then your monthly amount is added. The rate stays fixed for the whole period. Taxes, fees and inflation are left out unless you add them yourself.'))}</p>
  <ol class="gr-steps">
   <li><strong>${t(L('Balans','Баланс','Balance'))}</strong> ${t(L('gələn ay = bu ayın balansı × (1 + faiz ÷ 12) + aylıq ödəniş.','в следующем месяце = баланс этого месяца × (1 + ставка ÷ 12) + взнос.','next month = this month\'s balance × (1 + rate ÷ 12) + monthly amount.'))}</li>
   <li><strong>${t(L('Lazım olan aylıq məbləğ','Нужный взнос','Required monthly amount'))}</strong> ${t(L('— hədəf tarixində balansı məqsədə tam bərabər edən ödənişdir. Faiz 0 olanda bu, sadəcə qalan məbləğin aylara bölünməsidir.','— это взнос, при котором баланс в целевую дату ровно равен цели. При ставке 0 это просто остаток, делённый на число месяцев.','is the amount that makes the balance equal the goal exactly on the target date. At 0 % it is simply what is left divided by the months.'))}</li>
   <li><strong>${t(L('Bugünkü pulla','В сегодняшних деньгах','In today\'s money'))}</strong> ${t(L('— balans (1 + inflyasiya)^illər nisbətinə bölünür. Bu, qiymətlərin artımını kobud nəzərə almaq üsuludur.','— баланс делится на (1 + инфляция)^годы. Это грубый способ учесть рост цен.','is the balance divided by (1 + inflation)^years: a rough way to allow for rising prices.'))}</li>
  </ol>
 </div>
</section>

<section class="gr-risks" id="risks" aria-labelledby="risks-h">
 <h2 id="risks-h">${t(L('Haqlar və risklər, açıq danışaq','Комиссии и риски, честно','Fees and risks, plainly'))}</h2>
 <div class="gr-risk-grid">
  <article><h3>${t(L('Growly-nin özü','Сам Growly','Growly itself'))}</h3><p>${t(L('Bu konseptdə planlayıcı pulsuzdur, pulunuzu saxlamır, bank və ya fondlardan komissiya almır və heç bir məhsulu tövsiyə etmir. Real məhsulda biznes modeli istifadəçiyə açıq yazılmalıdır.','В этом концепте планировщик бесплатен, не хранит деньги, не получает комиссий от банков или фондов и не рекомендует продукты. В реальном продукте бизнес-модель должна быть открыто описана.','In this concept the planner is free, holds no money, takes no commission from banks or funds and recommends no product. A real product must state its business model openly.'))}</p></article>
  <article><h3>${t(L('Əmanət','Вклад','Deposits'))}</h3><p>${t(L('Faiz dərəcəsi müqavilə müddəti bitəndə dəyişə bilər. Müddətli əmanəti vaxtından əvvəl götürəndə faizin bir hissəsi itirilə bilər. Əmanətin sığorta ilə əhatə olunub-olunmadığını və limitini bankdan soruşun.','Ставка может измениться после окончания срока договора. При досрочном снятии срочного вклада часть процентов может быть потеряна. Уточните в банке, застрахован ли вклад и каков лимит.','The rate can change when the term ends. Withdrawing a term deposit early can cost part of the interest. Ask the bank whether the deposit is insured and up to what limit.'))}</p></article>
  <article><h3>${t(L('İnvestisiya','Инвестиции','Investments'))}</h3><p>${t(L('Fond və istiqrazların dəyəri həm arta, həm də azala bilər; keçmiş nəticə gələcəyə zəmanət vermir. Qısa müddətli məqsədlər üçün dəyəri tez dəyişən alətlər daha risklidir.','Стоимость фондов и облигаций может как расти, так и падать; прошлые результаты не гарантируют будущих. Для коротких целей инструменты с колеблющейся стоимостью рискованнее.','Funds and bonds can fall as well as rise; past results do not promise future ones. For short goals, instruments whose value swings are riskier.'))}</p></article>
  <article><h3>${t(L('Komissiya, vergi, valyuta','Комиссии, налоги, валюта','Fees, tax, currency'))}</h3><p>${t(L('İllik idarəetmə haqqı 1% olsa belə, uzun müddətdə nəticəni xeyli azaldır. Vergi qaydaları məhsula görə fərqlənir. Məqsəd AZN-dədirsə, başqa valyutada yığmaq məzənnə riski yaradır.','Даже 1% годовой комиссии за управление заметно уменьшает итог на длинном сроке. Налоговые правила зависят от продукта. Если цель в AZN, накопления в другой валюте несут валютный риск.','Even a 1% yearly management fee cuts the result noticeably over a long period. Tax rules differ by product. If the goal is in AZN, saving in another currency adds exchange-rate risk.'))}</p></article>
 </div>
 <p class="gr-disclaimer">${t(L('Growly konsept nümunəsidir. Göstərilən bütün rəqəmlər sizin daxil etdiyiniz fərziyyələrdən hesablanır, maliyyə məsləhəti deyil və heç bir gəlirə zəmanət vermir.','Growly — концепт-образец. Все цифры рассчитываются из ваших допущений, не являются финансовым советом и не гарантируют доход.','Growly is a concept sample. Every figure is calculated from your own assumptions, is not financial advice and guarantees no return.'))}</p>
</section>

<footer class="gr-foot"><p><strong>Growly</strong> ${t(L('— məqsədə görə yığım planlayıcısı, konsept.','— планировщик накоплений по целям, концепт.','— goal-based savings planner, concept.'))}</p><p>${t(L('Şəkil yoxdur: bütün qrafiklər səhifədəki rəqəmlərdən çəkilir.','Без фотографий: все графики строятся из цифр на странице.','No photographs: every chart is drawn from the numbers on the page.'))}</p></footer>
${ctx.data({goals,S})}
</div>`;
 }
};
