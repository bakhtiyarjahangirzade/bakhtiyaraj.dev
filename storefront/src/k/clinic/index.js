// Sunny Kids — paediatric clinic in Baku (concept site). The appointment request runs in app.js from the same data.
import {L,esc} from '../kit.js';

const PHONE='+994 12 000 00 00',TEL='+994120000000';
const days=[L('Bazar','Воскресенье','Sunday'),L('Bazar ertəsi','Понедельник','Monday'),L('Çərşənbə axşamı','Вторник','Tuesday'),L('Çərşənbə','Среда','Wednesday'),L('Cümə axşamı','Четверг','Thursday'),L('Cümə','Пятница','Friday'),L('Şənbə','Суббота','Saturday')];
const dshort=[L('B.','Вс','Sun'),L('B.e.','Пн','Mon'),L('Ç.a.','Вт','Tue'),L('Ç.','Ср','Wed'),L('C.a.','Чт','Thu'),L('C.','Пт','Fri'),L('Ş.','Сб','Sat')];
const months=[L('yanvar','января','January'),L('fevral','февраля','February'),L('mart','марта','March'),L('aprel','апреля','April'),L('may','мая','May'),L('iyun','июня','June'),L('iyul','июля','July'),L('avqust','августа','August'),L('sentyabr','сентября','September'),L('oktyabr','октября','October'),L('noyabr','ноября','November'),L('dekabr','декабря','December')];
// Opening hours, index = JS getDay().
const hours=[null,['08:30','19:00'],['08:30','19:00'],['08:30','19:00'],['08:30','19:00'],['08:30','19:00'],['09:30','15:00']];

const spec=[
 {id:'ped',name:L('Pediatr','Педиатр','Paediatrician'),slot:20,note:L('Ümumi müayinə, inkişaf yoxlaması, xəstəlik zamanı baxış.','Общий осмотр, проверка развития, приём при болезни.','General check-ups, development checks, visits when a child is unwell.')},
 {id:'ent',name:L('Uşaq LOR həkimi','Детский ЛОР','Paediatric ENT'),slot:20,note:L('Qulaq, burun, boğaz.','Ухо, нос, горло.','Ear, nose and throat.')},
 {id:'neu',name:L('Uşaq nevroloqu','Детский невролог','Paediatric neurologist'),slot:30,note:L('Yuxu, baş ağrısı, inkişafla bağlı suallar.','Сон, головные боли, вопросы развития.','Sleep, headaches, questions about development.')},
 {id:'der',name:L('Uşaq dermatoloqu','Детский дерматолог','Paediatric dermatologist'),slot:20,note:L('Dəri, səpgi, ekzema ilə bağlı baxış.','Кожа, сыпь, экзема.','Skin, rashes, eczema.')},
 {id:'ort',name:L('Uşaq ortopedi','Детский ортопед','Paediatric orthopaedist'),slot:30,note:L('Duruş, ayaq, yerimə.','Осанка, стопы, походка.','Posture, feet, walking.')},
 {id:'vac',name:L('Peyvənd otağı','Прививочный кабинет','Vaccination room'),slot:15,note:L('Pediatrın göndərişi və peyvənd kartı ilə.','По направлению педиатра и с прививочной картой.','With a paediatrician\'s referral and the vaccination card.')}
];
// Fictional staff. Reception: days (getDay) and hours. No photos, titles or years: a parent needs who, what and when.
const docs=[
 {id:'lh',name:'Leyla Həsənova',spec:'ped',days:[1,3,5],from:'09:00',to:'14:00'},
 {id:'rq',name:'Rəşad Quliyev',spec:'ped',days:[2,4],from:'13:00',to:'19:00',extra:{6:['09:30','14:30']}},
 {id:'na',name:'Nərmin Əliyeva',spec:'ent',days:[1,4],from:'10:00',to:'15:00'},
 {id:'fm',name:'Fərid Məmmədov',spec:'neu',days:[2,5],from:'09:00',to:'13:00'},
 {id:'as',name:'Aynur Səfərova',spec:'der',days:[3,6],from:'10:00',to:'14:00'},
 {id:'eb',name:'Elçin Babayev',spec:'ort',days:[1,4],from:'14:00',to:'18:30'},
 {id:'sk',name:'Səbinə Kərimova',spec:'vac',days:[1,2,3,4,5],from:'09:00',to:'17:00',nurse:true}
];
const nurse=L('tibb bacısı','медсестра','nurse');

const services=[
 {name:L('Ümumi müayinə və inkişaf yoxlaması','Общий осмотр и проверка развития','Check-up and development review'),who:L('0–17 yaş, pediatr','0–17 лет, педиатр','Ages 0–17, paediatrician'),min:20,price:40,bring:L('Doğum haqqında şəhadətnamə və ya şəxsiyyət vəsiqəsi, peyvənd kartı, əvvəlki analiz nəticələri, hazırda verdiyiniz dərmanların siyahısı.','Свидетельство о рождении или удостоверение, прививочная карта, прошлые анализы, список лекарств, которые ребёнок сейчас принимает.','Birth certificate or ID, vaccination card, earlier test results, a list of medicines the child is taking now.')},
 {name:L('Körpə baxışı','Осмотр младенца','Baby visit'),who:L('0–12 ay, pediatr','0–12 месяцев, педиатр','0–12 months, paediatrician'),min:30,price:45,bring:L('Doğum evindən çıxarış, çəki qeydləri, qidalanma qeydləri (nə qədər, neçə saatdan bir), əlavə bez və paltar.','Выписка из роддома, записи веса, записи кормлений (сколько и как часто), запасной подгузник и одежда.','Maternity discharge papers, weight records, feeding notes (how much and how often), a spare nappy and clothes.')},
 {name:L('Peyvənd','Прививка','Vaccination'),who:L('Pediatrın göndərişi ilə','По направлению педиатра','With a paediatrician\'s referral'),min:15,price:15,bring:L('Peyvənd kartı. Peyvənddən sonra 30 dəqiqə klinikada qalırsınız. Həmin gün uşağın hərarəti varsa, zəng edib vaxtı dəyişin.','Прививочная карта. После прививки вы остаётесь в клинике 30 минут. Если в этот день у ребёнка температура, позвоните и перенесите время.','Vaccination card. You stay at the clinic for 30 minutes afterwards. If the child has a temperature that day, call to move the time.'),plus:L('+ peyvəndin dəyəri','+ стоимость вакцины','+ cost of the vaccine')},
 {name:L('LOR müayinəsi','Приём ЛОР-врача','ENT visit'),who:L('Uşaq LOR həkimi','Детский ЛОР','Paediatric ENT'),min:20,price:45,bring:L('Əlamətlər nə vaxt başlayıb, hansı dərman verilib — qısa qeyd. Eşitmə ilə bağlı narahatlıq varsa, hansı vəziyyətlərdə hiss etdiyinizi yazın.','Короткая записка: когда начались симптомы и какие лекарства давали. Если беспокоит слух — в каких ситуациях вы это замечаете.','A short note on when symptoms started and what medicine was given. For hearing worries, note when you notice it.')},
 {name:L('Nevroloq konsultasiyası','Консультация невролога','Neurology consultation'),who:L('Uşaq nevroloqu','Детский невролог','Paediatric neurologist'),min:30,price:50,bring:L('Əvvəlki rəylər, sizi narahat edən hal telefonda videoya çəkilibsə — video, yuxu rejimi haqqında qeyd.','Прошлые заключения, видео беспокоящих эпизодов на телефоне, если есть, заметки о режиме сна.','Earlier reports, phone videos of episodes that worried you if you have them, notes on sleep.')},
 {name:L('Dermatoloq müayinəsi','Приём дерматолога','Dermatology visit'),who:L('Uşaq dermatoloqu','Детский дерматолог','Paediatric dermatologist'),min:20,price:45,bring:L('Səpginin günlər üzrə fotoları, istifadə etdiyiniz krem və sabunların adları. Həmin gün dəriyə krem çəkməyin.','Фото сыпи по дням, названия кремов и мыла, которыми пользуетесь. В день приёма не наносите крем.','Photos of the rash day by day, names of creams and soaps you use. Do not apply cream on the day.')},
 {name:L('Ortoped müayinəsi','Приём ортопеда','Orthopaedic visit'),who:L('Uşaq ortopedi','Детский ортопед','Paediatric orthopaedist'),min:30,price:50,bring:L('Uşağın hər gün geyindiyi ayaqqabı, əvvəlki rentgen şəkilləri (varsa), rahat açılan geyim.','Обувь, которую ребёнок носит каждый день, прошлые рентгеновские снимки (если есть), удобная одежда.','The shoes the child wears every day, earlier X-ray images if any, easy-to-remove clothes.')},
 {name:L('Qan analizinin götürülməsi','Забор крови на анализ','Blood sample'),who:L('Həkimin göndərişi ilə','По направлению врача','With a doctor\'s referral'),min:10,price:10,bring:L('Göndərişdə ac qarına gəlmək lazım olub-olmadığı yazılır. Su və uşağın sevdiyi oyuncağı götürün.','В направлении указано, нужно ли приходить натощак. Возьмите воду и любимую игрушку ребёнка.','The referral says whether to come without eating. Bring water and a favourite toy.'),plus:L('+ laboratoriya','+ лаборатория','+ lab fee')}
];

const ages=[
 {a:L('0–1 yaş','0–1 год','0–1 year'),t:L('Körpə baxışları 30 dəqiqədir: soyundurmaq, çəkmək və suallarınız üçün vaxt qalır. Qidalanma otağı qeydiyyatın yanındadır.','Осмотр младенца длится 30 минут: хватает времени раздеть, взвесить и ответить на ваши вопросы. Комната для кормления рядом с регистратурой.','Baby visits are 30 minutes: time to undress, weigh and answer your questions. The feeding room is next to reception.')},
 {a:L('1–3 yaş','1–3 года','1–3 years'),t:L('Bu yaşda uşaq çox vaxt valideynin qucağında müayinə olunur. Sevdiyi oyuncağı götürün; gözləmə zonasında oyuncaqlar hər gün təmizlənir.','В этом возрасте ребёнка часто осматривают на руках у родителя. Возьмите любимую игрушку; игрушки в зоне ожидания моют каждый день.','At this age a child is often examined on a parent\'s lap. Bring a favourite toy; toys in the waiting area are cleaned daily.')},
 {a:L('3–6 yaş','3–6 лет','3–6 years'),t:L('Bağçaya arayış lazımdırsa, qeydiyyatda deyin — həkim müayinədən sonra hazırlayır.','Если нужна справка в детский сад, скажите в регистратуре — врач оформит её после осмотра.','If you need a certificate for kindergarten, tell reception; the doctor fills it in after the visit.')},
 {a:L('7–12 yaş','7–12 лет','7–12 years'),t:L('Məktəb arayışları və idman bölməsi üçün baxış. Uşaq özünü necə hiss etdiyini özü də danışa bilər — həkim ona birbaşa sual verir.','Справки для школы и спортивной секции. Ребёнок может сам рассказать, как себя чувствует — врач спрашивает его напрямую.','School and sports-club certificates. Children can describe how they feel themselves; the doctor asks them directly.')},
 {a:L('13–17 yaş','13–17 лет','13–17 years'),t:L('Yeniyetmə istəsə, valideynin razılığı ilə müayinənin bir hissəsi həkimlə təkbətək keçir.','Если подросток хочет, с согласия родителя часть приёма проходит наедине с врачом.','If the teenager wishes, and with a parent\'s consent, part of the visit happens alone with the doctor.')}
];

const faq=[
 [L('Sorğudan sonra nə olur?','Что происходит после запроса?','What happens after I send a request?'),L('Qeydiyyat şöbəsi iş saatlarında zəng edib vaxtı təsdiqləyir və ya başqa vaxt təklif edir. Təsdiq zəngindən əvvəl vaxt sizin üçün saxlanılmış sayılmır.','Регистратура звонит в рабочие часы и подтверждает время или предлагает другое. До звонка время не считается закреплённым за вами.','Reception calls during opening hours to confirm the time or offer another. Until that call the time is not held for you.')],
 [L('Uşağı nənə-baba gətirə bilərmi?','Может ли ребёнка привести бабушка или дедушка?','Can a grandparent bring the child?'),L('Bəli. Valideynin yazılı razılığını və uşağın sənədini götürün. Valideynə telefonla əlaqə mümkün olsun.','Да. Возьмите письменное согласие родителя и документ ребёнка. Родитель должен быть на связи по телефону.','Yes. Bring the parent\'s written consent and the child\'s document, and make sure the parent can be reached by phone.')],
 [L('Vaxtı necə ləğv edim?','Как отменить запись?','How do I cancel?'),L('Ən azı 3 saat əvvəl zəng edin. Bu vaxtı başqa ailəyə vermək olur.','Позвоните хотя бы за 3 часа. Это время смогут отдать другой семье.','Call at least 3 hours ahead so the time can go to another family.')],
 [L('Qiymətlər necədir?','Какие цены?','What do visits cost?'),L('Xidmətlər cədvəlindəki qiymətlər nümunədir. Ödəniş qəbuldan sonra kassada nağd və ya kartla edilir.','Цены в таблице услуг — образец. Оплата после приёма в кассе, наличными или картой.','Prices in the services table are samples. You pay after the visit at the desk, cash or card.')],
 [L('Sayt həkim məsləhəti verirmi?','Даёт ли сайт медицинские советы?','Does the site give medical advice?'),L('Xeyr. Burada yalnız təşkilati məlumat var. Uşağın vəziyyəti barədə qərarı həkim müayinədə verir.','Нет. Здесь только организационная информация. Решения о состоянии ребёнка принимает врач на приёме.','No. This site only covers practical arrangements. Decisions about a child\'s health are made by a doctor at the visit.')]
];

const S={
 days,dshort,months,hours,PHONE,
 open:L('İndi açıqdır, {to}-dək','Сейчас открыто, до {to}','Open now until {to}'),
 opensAt:L('Bağlıdır. Bu gün {from}-da açılır','Закрыто. Сегодня откроется в {from}','Closed. Opens today at {from}'),
 closedNext:L('Bağlıdır. {day} {from}-da açılır','Закрыто. Откроется: {day}, {from}','Closed. Opens {day} at {from}'),
 noDocsToday:L('Bu gün həkim qəbulu yoxdur.','Сегодня приёма врачей нет.','No doctors are receiving today.'),
 today:L('Bu gün, {day}','Сегодня, {day}','Today, {day}'),
 nurse,
 err:{
  spec:L('İxtisas seçin.','Выберите специальность.','Choose a specialty.'),
  doc:L('Həkim seçin.','Выберите врача.','Choose a doctor.'),
  slot:L('Gün və vaxt seçin.','Выберите день и время.','Choose a day and a time.'),
  child:L('Uşağın adını yazın.','Напишите имя ребёнка.','Write the child\'s name.'),
  age:L('Uşağın yaşını seçin.','Выберите возраст ребёнка.','Choose the child\'s age.'),
  parent:L('Adınızı yazın, qeydiyyat şöbəsi sizə necə müraciət etsin.','Напишите ваше имя, чтобы регистратура знала, как к вам обращаться.','Write your name so reception knows who to ask for.'),
  phone:L('Nömrəni +994 50 123 45 67 formatında yazın: operator kodu və 7 rəqəm.','Введите номер в формате +994 50 123 45 67: код оператора и 7 цифр.','Enter the number as +994 50 123 45 67: operator code and 7 digits.'),
  reason:L('Qısaca yazın, niyə gəlirsiniz (ən azı 5 simvol).','Коротко напишите причину визита (минимум 5 символов).','Briefly say why you are coming (at least 5 characters).'),
  summary:L('Formada {n} xəta var. Qırmızı ilə işarələnmiş xanaları düzəldin.','В форме ошибок: {n}. Исправьте поля, отмеченные красным.','The form has {n} errors. Fix the fields marked in red.')
 },
 noDays:L('Bu həkimin yaxın 14 gündə qəbulu yoxdur. Başqa həkim seçin və ya zəng edin.','У этого врача нет приёма в ближайшие 14 дней. Выберите другого врача или позвоните.','This doctor has no reception in the next 14 days. Choose another doctor or call.'),
 noSlots:L('Bu gün üçün boş vaxt qalmayıb. Başqa gün seçin.','На этот день свободного времени нет. Выберите другой день.','No free times left on this day. Choose another day.'),
 taken:L('tutulub','занято','taken'),
 free:L('boş','свободно','free'),
 under1:L('1 yaşdan kiçik','младше 1 года','under 1'),
 years:L('{n} yaş','{n} лет','{n} years'),
 dayFull:L('{day}, {d} {month}','{day}, {d} {month}','{day} {d} {month}'),
 docDays:L('Qəbul: {days}, {from}–{to}','Приём: {days}, {from}–{to}','Receives: {days}, {from}–{to}'),
 chosen:L('{spec}','{spec}','{spec}'),
 slotLine:L('{day}, saat {time}','{day}, {time}','{day} at {time}'),
 durLine:L('{min} dəqiqə','{min} минут','{min} minutes'),
 refPrefix:L('Sorğu nömrəsi','Номер запроса','Request number'),
 first:L('İlk gəliş','Первый визит','First visit'),
 repeat:L('Təkrar gəliş','Повторный визит','Return visit'),
 changed:L('Seçim dəyişdi, vaxtı yenidən seçin.','Выбор изменился, выберите время заново.','Your choice changed; pick a time again.')
};

const tel=`<a class="sk-tel" href="tel:${TEL}">${PHONE}</a>`;

export default {
 id:'clinic',brand:'Sunny Kids',kind:'site',
 render(ctx){
  const t=ctx.t;
  const docRow=d=>{const s=spec.find(x=>x.id===d.spec);return `<li data-days="${[...d.days,...Object.keys(d.extra||{}).map(Number)].join(',')}" data-doc="${d.id}"><strong>${d.name}</strong><span>${t(s.name)}${d.nurse?`, ${t(nurse)}`:''}</span><span class="sk-today-time" data-from="${d.from}" data-to="${d.to}">${d.from}–${d.to}</span></li>`};
  const grid=`<table class="sk-grid"><caption class="sr-only">${t(L('Həkimlərin həftəlik qəbul cədvəli','Недельное расписание приёма врачей','Weekly reception schedule'))}</caption><thead><tr><th scope="col">${t(L('Həkim','Врач','Doctor'))}</th>${[1,2,3,4,5,6].map(i=>`<th scope="col"><abbr title="${t(days[i])}">${t(dshort[i])}</abbr></th>`).join('')}<th scope="col"><span class="sr-only">${t(L('Sorğu','Запрос','Request'))}</span></th></tr></thead><tbody>${docs.map(d=>{const s=spec.find(x=>x.id===d.spec);return `<tr><th scope="row"><strong>${d.name}</strong><span>${t(s.name)}${d.nurse?`, ${t(nurse)}`:''}</span></th>${[1,2,3,4,5,6].map(i=>{const h=d.days.includes(i)?[d.from,d.to]:d.extra?.[i];return h?`<td class="is-on"><span data-d="${t(dshort[i])}">${h[0]}–${h[1]}</span></td>`:`<td><span class="sr-only">${t(L('qəbul yoxdur','нет приёма','no reception'))}</span></td>`}).join('')}<td><a class="sk-link" href="#request" data-pick="${d.id}">${t(L('Bu həkimə sorğu','Запрос к этому врачу','Request this doctor'))}</a></td></tr>`}).join('')}</tbody></table>`;
  const step=(n,title,body,last=false)=>`<section class="sk-step" data-step="${n}" aria-labelledby="sk-step-${n}-h"><header class="sk-step-head"><span class="sk-num" aria-hidden="true">${n}</span><h3 id="sk-step-${n}-h">${t(title)}</h3><p class="sk-step-sum" id="sk-sum-${n}"></p><button type="button" class="sk-edit" data-edit="${n}" hidden>${t(L('Dəyiş','Изменить','Change'))}<span class="sr-only"> — ${t(title)}</span></button></header><div class="sk-step-body">${body}${last?'':`<div class="sk-step-actions"><button type="button" class="sk-btn" data-next="${n}">${t(L('Davam et','Продолжить','Continue'))}</button></div>`}<p class="sk-err" id="sk-err-${n}" aria-live="polite"></p></div></section>`;
  const fieldErr=id=>`<p class="sk-ferr" id="sk-${id}-err"></p>`;
  return `<div class="sk">
<div class="sk-sos" role="note"><p><strong>${t(L('Təcili vəziyyətdə bu saytdan istifadə etməyin.','В экстренной ситуации не пользуйтесь этим сайтом.','In an emergency, do not use this site.'))}</strong> ${t(L('Uşaq çətin nəfəs alırsa, qıcolma varsa, huşunu itiribsə və ya ağır xəsarət alıbsa, dərhal zəng edin:','Если ребёнку трудно дышать, есть судороги, он без сознания или серьёзно травмирован, звоните сразу:','If your child struggles to breathe, has a seizure, is unresponsive or badly hurt, call now:'))} <a href="tel:103">103</a> ${t(L('təcili tibbi yardım','скорая помощь','ambulance'))}, <a href="tel:112">112</a> ${t(L('fövqəladə hallar','служба экстренной помощи','emergency services'))}.</p></div>

<header class="sk-top">
 <a class="sk-brand" href="#top"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="8"/><path d="M20 3v6M20 31v6M3 20h6M31 20h6M8 8l4 4M28 28l4 4M8 32l4-4M28 12l4-4"/></svg><span>Sunny Kids</span></a>
 <nav aria-label="${t(L('Əsas menyu','Главное меню','Main menu'))}"><a href="#request">${t(L('Qəbul sorğusu','Запрос на приём','Request a visit'))}</a><a href="#services">${t(L('Xidmətlər','Услуги','Services'))}</a><a href="#doctors">${t(L('Həkimlər','Врачи','Doctors'))}</a><a href="#hours">${t(L('Saatlar','Часы работы','Hours'))}</a></nav>
 ${tel}
</header>

<section class="sk-hero" aria-labelledby="sk-h1">
 <div class="sk-hero-text">
  <h1 id="sk-h1">${t(L('Bu gün kim qəbul edir, nə gətirməli və necə yazılmalı.','Кто сегодня принимает, что взять с собой и как записаться.','Who is seeing children today, what to bring, and how to book.'))}</h1>
  <p>${t(L('Sunny Kids — Bakıda, Nərimanov rayonunda 0–17 yaşlı uşaqlar üçün poliklinika. Sorğunu iki dəqiqəyə doldurun; qeydiyyat şöbəsi zəng edib vaxtı təsdiqləyir.','Sunny Kids — поликлиника для детей 0–17 лет в Баку, Наримановский район. Заполните запрос за две минуты; регистратура перезвонит и подтвердит время.','Sunny Kids is an outpatient clinic for children aged 0–17 in Narimanov, Baku. Fill in a request in two minutes; reception calls back to confirm the time.'))}</p>
  <div class="sk-hero-cta"><a class="sk-btn sk-btn-big" href="#request">${t(L('Qəbul sorğusu göndər','Отправить запрос на приём','Send a visit request'))}</a><span>${t(L('və ya zəng edin','или позвоните','or call'))} ${tel}</span></div>
 </div>
 <aside class="sk-today" aria-labelledby="sk-today-h">
  <h2 id="sk-today-h">${t(L('Həftəlik qəbul','Приём на неделе','This week'))}</h2>
  <p class="sk-open" id="sk-open">${t(L('B.e.–C. 08:30–19:00, Ş. 09:30–15:00, bazar günü bağlıdır','Пн–Пт 08:30–19:00, Сб 09:30–15:00, в воскресенье закрыто','Mon–Fri 08:30–19:00, Sat 09:30–15:00, closed on Sunday'))}</p>
  <ul class="sk-today-list" id="sk-today-list">${docs.map(docRow).join('')}</ul>
  <p class="sk-today-empty" id="sk-today-empty" hidden></p>
 </aside>
</section>

<section class="sk-request" id="request" aria-labelledby="sk-req-h">
 <div class="sk-req-intro">
  <h2 id="sk-req-h">${t(L('Qəbul sorğusu','Запрос на приём','Visit request'))}</h2>
  <p>${t(L('Bu, sorğudur, qəbul deyil. Vaxt qeydiyyat şöbəsinin zəngi ilə təsdiqlənir. Uşağın vəziyyəti pisləşirsə, gözləməyin — 103-ə zəng edin.','Это запрос, а не запись. Время подтверждается звонком регистратуры. Если ребёнку становится хуже, не ждите — звоните 103.','This is a request, not a booking. The time is confirmed by a call from reception. If your child gets worse, do not wait: call 103.'))}</p>
 </div>
 <form class="sk-form" id="sk-form" novalidate>
  ${step(1,L('Hansı həkim lazımdır','Какой нужен врач','Which specialist'),`<fieldset><legend class="sr-only">${t(L('İxtisas','Специальность','Specialty'))}</legend><div class="sk-specs">${spec.map(s=>`<label class="sk-spec"><input type="radio" name="spec" value="${s.id}"><span><strong>${t(s.name)}</strong><small>${t(s.note)}</small></span></label>`).join('')}</div></fieldset>`)}
  ${step(2,L('Həkim','Врач','Doctor'),`<fieldset><legend class="sr-only">${t(L('Həkim','Врач','Doctor'))}</legend><div class="sk-docs" id="sk-docs"></div></fieldset>`)}
  ${step(3,L('Gün və vaxt','День и время','Day and time'),`<fieldset><legend class="sk-sub">${t(L('Gün','День','Day'))}</legend><div class="sk-days" id="sk-days"></div></fieldset><fieldset><legend class="sk-sub">${t(L('Vaxt','Время','Time'))} <span id="sk-dur"></span></legend><div class="sk-slots" id="sk-slots"></div></fieldset><p class="sk-legend"><span class="sk-key-free">${t(L('boş','свободно','free'))}</span><span class="sk-key-taken">${t(L('artıq tutulub','уже занято','already taken'))}</span></p>`)}
  ${step(4,L('Uşaq və əlaqə','Ребёнок и контакт','Child and contact'),`<div class="sk-fields">
    <div class="sk-field"><label for="sk-child">${t(L('Uşağın adı','Имя ребёнка','Child\'s name'))}</label><input id="sk-child" name="child" autocomplete="off" maxlength="60" aria-describedby="sk-child-err">${fieldErr('child')}</div>
    <div class="sk-field"><label for="sk-age">${t(L('Yaşı','Возраст','Age'))}</label><select id="sk-age" name="age" aria-describedby="sk-age-err"><option value="">${t(L('Seçin','Выберите','Choose'))}</option></select>${fieldErr('age')}</div>
    <div class="sk-field"><label for="sk-parent">${t(L('Valideynin adı','Имя родителя','Parent\'s name'))}</label><input id="sk-parent" name="parent" autocomplete="name" maxlength="60" aria-describedby="sk-parent-err">${fieldErr('parent')}</div>
    <div class="sk-field"><label for="sk-phone">${t(L('Telefon','Телефон','Phone'))}</label><input id="sk-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+994 50 123 45 67" aria-describedby="sk-phone-hint sk-phone-err"><p class="sk-hint" id="sk-phone-hint">${t(L('Bu nömrəyə zəng edib vaxtı təsdiqləyəcəyik.','На этот номер позвонят, чтобы подтвердить время.','Reception calls this number to confirm.'))}</p>${fieldErr('phone')}</div>
    <div class="sk-field sk-wide"><label for="sk-reason">${t(L('Gəlişin səbəbi','Причина визита','Reason for the visit'))}</label><textarea id="sk-reason" name="reason" rows="3" maxlength="300" aria-describedby="sk-reason-hint sk-reason-err"></textarea><p class="sk-hint" id="sk-reason-hint">${t(L('Bir-iki cümlə kifayətdir, məsələn: “3 gündür öskürür” və ya “məktəb üçün arayış”.','Достаточно одного-двух предложений, например: «кашляет 3 дня» или «справка для школы».','One or two sentences is enough, e.g. “coughing for 3 days” or “school certificate”.'))}</p>${fieldErr('reason')}</div>
    <label class="sk-check sk-wide"><input type="checkbox" name="first" id="sk-first"> ${t(L('Bu, klinikaya ilk gəlişimizdir','Мы приходим в клинику впервые','This is our first visit to the clinic'))}</label>
   </div>`)}
  ${step(5,L('Yoxlayın və göndərin','Проверьте и отправьте','Check and send'),`<dl class="sk-review" id="sk-review"></dl><p class="sk-demo">${t(L('Demo: “Sorğunu göndər” düyməsi heç nə göndərmir, məlumat yalnız bu səhifədə qalır.','Демо: кнопка «Отправить запрос» ничего не отправляет, данные остаются только на этой странице.','Demo: “Send request” sends nothing; the details stay on this page.'))}</p><div class="sk-step-actions"><button type="submit" class="sk-btn sk-btn-big">${t(L('Sorğunu göndər','Отправить запрос','Send request'))}</button></div>`,true)}
 </form>
 <div class="sk-done" id="sk-done" hidden tabindex="-1">
  <h3>${t(L('Sorğu hazırdır','Запрос готов','Request ready'))}</h3>
  <p id="sk-done-text"></p>
  <p>${t(L('Real klinikada qeydiyyat şöbəsi iş saatlarında, adətən 30 dəqiqə ərzində zəng edib vaxtı təsdiqləyərdi. Bu demo heç nə göndərmədi.','В реальной клинике регистратура позвонила бы в рабочие часы, обычно в течение 30 минут, и подтвердила время. Это демо ничего не отправило.','At a real clinic, reception would call during opening hours, usually within 30 minutes, to confirm. This demo sent nothing.'))}</p>
  <h4>${t(L('Gətirməyi unutmayın','Не забудьте взять','Remember to bring'))}</h4>
  <p id="sk-done-bring"></p>
  <button type="button" class="sk-btn sk-btn-ghost" id="sk-again">${t(L('Yeni sorğu','Новый запрос','New request'))}</button>
 </div>
</section>

<section class="sk-services" id="services" aria-labelledby="sk-serv-h">
 <h2 id="sk-serv-h">${t(L('Xidmətlər və hazırlıq','Услуги и подготовка','Services and what to prepare'))}</h2>
 <p class="sk-lead">${t(L('Müddət — həkimin uşağa ayırdığı vaxtdır. Qiymətlər nümunədir.','Длительность — время, которое врач уделяет ребёнку. Цены — образец.','Duration is the time the doctor spends with the child. Prices are samples.'))}</p>
 <div class="sk-serv-list">${services.map(s=>`<article class="sk-serv"><h3>${t(s.name)}</h3><p class="sk-serv-who">${t(s.who)}</p><dl><div><dt>${t(L('Müddət','Длительность','Duration'))}</dt><dd>${t(S.durLine,{min:s.min})}</dd></div><div><dt>${t(L('Qiymət','Цена','Price'))}</dt><dd>${ctx.azn(s.price)}${s.plus?` <small>${t(s.plus)}</small>`:''}</dd></div></dl><p class="sk-bring"><strong>${t(L('Gətirin və hazırlayın:','Возьмите и подготовьте:','Bring and prepare:'))}</strong> ${t(s.bring)}</p></article>`).join('')}</div>
</section>

<section class="sk-doctors" id="doctors" aria-labelledby="sk-doc-h">
 <h2 id="sk-doc-h">${t(L('Həkimlər və qəbul günləri','Врачи и дни приёма','Doctors and reception days'))}</h2>
 <p class="sk-lead">${t(L('Saatlar həkimin klinikada qəbul etdiyi vaxtdır. Cədvəl bayram günlərində dəyişə bilər — zəng edib dəqiqləşdirin.','Часы — время, когда врач принимает в клинике. В праздники расписание может меняться — уточняйте по телефону.','Hours are when each doctor sees patients at the clinic. The schedule can change on public holidays; call to check.'))}</p>
 <div class="sk-grid-wrap" tabindex="0" role="region" aria-labelledby="sk-doc-h">${grid}</div>
</section>

<section class="sk-ages" aria-labelledby="sk-ages-h">
 <figure class="sk-ages-photo">${ctx.img('clinic/dolls',L('Ölçüsünə görə düzülmüş beş matryoşka taxta rəfdə','Пять матрёшек, выстроенных по росту на деревянной полке','Five nesting dolls lined up by size on a wooden shelf'),{sizes:'(min-width:900px) 92vw, 100vw'})}</figure>
 <h2 id="sk-ages-h">${t(L('Hər yaşda qəbul bir az fərqlidir','В каждом возрасте приём проходит немного по-разному','Each age visits a little differently'))}</h2>
 <ol class="sk-age-list">${ages.map(a=>`<li><h3>${t(a.a)}</h3><p>${t(a.t)}</p></li>`).join('')}</ol>
</section>

<section class="sk-visit" aria-labelledby="sk-visit-h">
 <div class="sk-visit-text">
  <h2 id="sk-visit-h">${t(L('Gəlməzdən əvvəl','Перед визитом','Before you come'))}</h2>
  <ul class="sk-visit-list">
   <li>${t(L('Qəbuldan 10 dəqiqə əvvəl gəlin: ilk gəlişdə qeydiyyat kartı doldurulur.','Приходите за 10 минут: при первом визите заполняется регистрационная карта.','Arrive 10 minutes early: a registration card is filled in on the first visit.'))}</li>
   <li>${t(L('Uşağın sənədi, peyvənd kartı və əvvəlki rəylər bir qovluqda olsun.','Документ ребёнка, прививочная карта и прошлые заключения — в одной папке.','Keep the child\'s document, vaccination card and earlier reports in one folder.'))}</li>
   <li>${t(L('Giriş pilləsizdir, uşaq arabası ilə liftə minmək olur. Qidalanma və bez dəyişmə otağı birinci mərtəbədədir.','Вход без ступенек, в лифт можно с коляской. Комната для кормления и пеленания на первом этаже.','Step-free entrance and a lift that fits a pram. Feeding and changing room on the ground floor.'))}</li>
   <li>${t(L('Hərarəti və ya səpgisi olan uşaqlar üçün ayrıca gözləmə otağı var — qeydiyyatda deyin.','Для детей с температурой или сыпью есть отдельная комната ожидания — скажите в регистратуре.','There is a separate waiting room for children with a temperature or a rash; tell reception.'))}</li>
  </ul>
 </div>
 <figure class="sk-visit-photo">${ctx.img('clinic/rainbow',L('Pəncərə qarşısında rəfdə taxta göy qurşağı oyuncağı','Деревянная игрушка-радуга на полке у окна','A wooden rainbow toy on a shelf by the window'),{sizes:'(min-width:900px) 45vw, 100vw'})}</figure>
</section>

<section class="sk-hours" id="hours" aria-labelledby="sk-hours-h">
 <div>
  <h2 id="sk-hours-h">${t(L('Saatlar və ünvan','Часы и адрес','Hours and address'))}</h2>
  <table class="sk-hours-t"><tbody>${[1,2,3,4,5,6,0].map(i=>`<tr data-day="${i}"><th scope="row">${t(days[i])}</th><td>${hours[i]?`${hours[i][0]}–${hours[i][1]}`:t(L('bağlıdır','закрыто','closed'))}</td></tr>`).join('')}</tbody></table>
  <p class="sk-addr">${t(L('Bakı, Nərimanov rayonu (nümunə ünvan). Ən yaxın metro: Nərimanov.','Баку, Наримановский район (адрес-образец). Ближайшее метро: «Нариман Нариманов».','Narimanov district, Baku (sample address). Nearest metro: Nariman Narimanov.'))}</p>
  <p>${t(L('Qeydiyyat:','Регистратура:','Reception:'))} ${tel}</p>
 </div>
 <div class="sk-urgent">
  <h2>${t(L('Klinika bağlı olanda','Когда клиника закрыта','When the clinic is closed'))}</h2>
  <p>${t(L('Təcili hallarda — çətin nəfəs, qıcolma, huşun itməsi, ağır xəsarət, zəhərlənmə şübhəsi — dərhal 103 və ya 112-yə zəng edin.','В экстренных случаях — затруднённое дыхание, судороги, потеря сознания, серьёзная травма, подозрение на отравление — сразу звоните 103 или 112.','In an emergency (difficulty breathing, seizure, loss of consciousness, serious injury, suspected poisoning) call 103 or 112 immediately.'))}</p>
  <p>${t(L('Təcili olmayan suallar üçün sorğu qoyun: növbəti iş günü səhər zəng edəcəyik.','По несрочным вопросам оставьте запрос: перезвоним утром следующего рабочего дня.','For anything not urgent, leave a request: reception calls the next working morning.'))}</p>
  <p class="sk-big-tel"><a href="tel:103">103</a><a href="tel:112">112</a></p>
 </div>
</section>

<section class="sk-faq" aria-labelledby="sk-faq-h">
 <h2 id="sk-faq-h">${t(L('Valideynlərin tez-tez verdiyi suallar','Частые вопросы родителей','Questions parents often ask'))}</h2>
 ${faq.map(([q,a])=>`<details><summary>${t(q)}</summary><p>${t(a)}</p></details>`).join('')}
</section>

<footer class="sk-foot">
 <p><strong>Sunny Kids</strong> ${t(L('— uşaq poliklinikası, konsept nümunəsi. Ad, həkimlər, qiymətlər və ünvan uydurmadır.','— детская поликлиника, концепт-образец. Название, врачи, цены и адрес вымышлены.','— children\'s outpatient clinic, a concept sample. Name, doctors, prices and address are fictional.'))}</p>
 ${ctx.credits(['clinic/dolls','clinic/rainbow'])}
</footer>
${ctx.data({spec,docs,services:services.map(s=>({name:s.name,bring:s.bring})),S})}
</div>`;
 }
};
