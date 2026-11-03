// Wolfpack — combat gym in Baku (concept site). Timetable + trial booking run in app.js from the same class list.
import {L,esc} from '../kit.js';

const disc={
 mma:{code:'MMA',name:L('MMA','ММА','MMA'),bring:L('Qısa şort, futbolka və ya raşqard, ağız qoruyucusu. Əlcək və şin qoruyucuları ilk dəfə zaldan verilir.','Шорты, футболка или рашгард, капа. Перчатки и щитки на первый раз выдаёт зал.','Shorts, a T-shirt or rash guard, a mouthguard. Gloves and shin guards are lent for the first class.')},
 mt:{code:'MT',name:L('Muay Thai','Муай-тай','Muay Thai'),bring:L('Şort, futbolka, bint (zaldan 5 AZN-ə almaq olar). Əlcək və şin qoruyucusu ilk dəfə zaldan.','Шорты, футболка, бинты (можно купить в зале за 5 AZN). Перчатки и щитки на первый раз — от зала.','Shorts, a T-shirt, hand wraps (5 AZN at the desk). Gloves and shin guards are lent the first time.')},
 bjj:{code:'BJJ',name:L('Braziliya jiu-jitsu','Бразильское джиу-джитсу','Brazilian jiu-jitsu'),bring:L('Kimono (gi) yoxdursa, raşqard və uzun idman şalvarı ilə gəlin. Dırnaqlar qısa, zərgərlik olmasın.','Если нет кимоно (ги), приходите в рашгарде и длинных спортивных штанах. Короткие ногти, без украшений.','No gi yet? Come in a rash guard and long training trousers. Short nails, no jewellery.')},
 box:{code:'BOX',name:L('Boks','Бокс','Boxing'),bring:L('İdman ayaqqabısı, şort, futbolka, bint. Əlcəklər ilk dəfə zaldan verilir.','Спортивная обувь, шорты, футболка, бинты. Перчатки на первый раз выдаёт зал.','Trainers, shorts, a T-shirt, hand wraps. Gloves are lent the first time.')}
};
const level={
 all:L('Bütün səviyyələr','Все уровни','All levels'),
 beg:L('Başlanğıc','Начальный','Beginner'),
 int:L('Orta','Средний','Intermediate'),
 adv:L('Təcrübəli','Опытные','Advanced'),
 youth:L('Gənclər, 14–17','Подростки, 14–17','Youth, 14–17')
};
const coaches={
 oh:{name:'Orxan Hüseynov',disc:'mma',about:L('MMA dərslərini aparır: güləş girişləri, yerdə nəzarət, zərbələrin birləşdirilməsi.','Ведёт MMA: проходы, контроль в партере, связки ударов.','Leads MMA: takedown entries, ground control, putting strikes together.')},
 ke:{name:'Kənan Əsədov',disc:'mt',about:L('Muay Thai orta və təcrübəli qruplar: klinç, dirsək və diz texnikası, padlar üzərində iş.','Муай-тай, средние и опытные группы: клинч, локти и колени, работа на лапах.','Muay Thai intermediate and advanced: clinch, elbows and knees, pad work.')},
 an:{name:'Aygün Novruzova',disc:'mt',about:L('Muay Thai başlanğıc və gənclər qrupları: duruş, məsafə, təhlükəsiz partnyor işi.','Муай-тай, начальная и подростковая группы: стойка, дистанция, безопасная работа в паре.','Muay Thai beginners and youth: stance, distance, safe partner drills.')},
 nr:{name:'Nicat Rüstəmov',disc:'bjj',about:L('BJJ orta və təcrübəli qruplar, şənbə günü açıq mat.','BJJ средние и опытные группы, открытый мат в субботу.','BJJ intermediate and advanced, Saturday open mat.')},
 ec:{name:'Elvin Cəfərli',disc:'bjj',about:L('BJJ başlanğıc qrupu: düşmə texnikası, qarda, mövqedən çıxışlar.','BJJ начальная группа: страховка, гард, выходы из позиций.','BJJ beginners: breakfalls, guard, escaping positions.')},
 ta:{name:'Tural Abbasov',disc:'box',about:L('Boks bütün qruplar və cümə günü nəzarətli sparrinq.','Бокс во всех группах и контролируемый спарринг по пятницам.','Boxing for all groups and Friday controlled sparring.')}
};
// d: 1 = Monday … 7 = Sunday. cap = places, taken = already booked (sample).
const classes=[
 {id:'c1',d:1,t:'07:30',m:60,disc:'box',lvl:'all',co:'ta',cap:14,taken:9},
 {id:'c2',d:1,t:'18:00',m:60,disc:'mt',lvl:'beg',co:'an',cap:16,taken:11},
 {id:'c3',d:1,t:'19:30',m:90,disc:'mma',lvl:'int',co:'oh',cap:16,taken:16},
 {id:'c4',d:1,t:'21:00',m:90,disc:'bjj',lvl:'adv',co:'nr',cap:20,taken:12},
 {id:'c5',d:2,t:'07:30',m:60,disc:'bjj',lvl:'all',co:'ec',cap:20,taken:8},
 {id:'c6',d:2,t:'17:00',m:60,disc:'box',lvl:'youth',co:'ta',cap:12,taken:7},
 {id:'c7',d:2,t:'18:30',m:60,disc:'bjj',lvl:'beg',co:'ec',cap:20,taken:17},
 {id:'c8',d:2,t:'20:00',m:90,disc:'mt',lvl:'int',co:'ke',cap:16,taken:13},
 {id:'c9',d:3,t:'07:30',m:60,disc:'box',lvl:'all',co:'ta',cap:14,taken:6},
 {id:'c10',d:3,t:'18:00',m:60,disc:'mma',lvl:'beg',co:'oh',cap:16,taken:15},
 {id:'c11',d:3,t:'19:30',m:90,disc:'mt',lvl:'adv',co:'ke',cap:14,taken:10},
 {id:'c12',d:3,t:'21:00',m:60,disc:'box',lvl:'int',co:'ta',cap:14,taken:14},
 {id:'c13',d:4,t:'07:30',m:60,disc:'bjj',lvl:'all',co:'ec',cap:20,taken:9},
 {id:'c14',d:4,t:'17:00',m:60,disc:'mt',lvl:'youth',co:'an',cap:12,taken:12},
 {id:'c15',d:4,t:'18:30',m:60,disc:'box',lvl:'beg',co:'ta',cap:14,taken:10},
 {id:'c16',d:4,t:'20:00',m:90,disc:'mma',lvl:'adv',co:'oh',cap:14,taken:9},
 {id:'c17',d:5,t:'18:00',m:60,disc:'bjj',lvl:'beg',co:'ec',cap:20,taken:13},
 {id:'c18',d:5,t:'19:30',m:90,disc:'box',lvl:'adv',co:'ta',cap:12,taken:8},
 {id:'c19',d:6,t:'11:00',m:90,disc:'mma',lvl:'beg',co:'oh',cap:16,taken:12},
 {id:'c20',d:6,t:'12:30',m:90,disc:'bjj',lvl:'all',co:'nr',cap:24,taken:14},
 {id:'c21',d:6,t:'14:00',m:60,disc:'mt',lvl:'beg',co:'an',cap:16,taken:15}
];
const days=[null,L('Bazar ertəsi','Понедельник','Monday'),L('Çərşənbə axşamı','Вторник','Tuesday'),L('Çərşənbə','Среда','Wednesday'),L('Cümə axşamı','Четверг','Thursday'),L('Cümə','Пятница','Friday'),L('Şənbə','Суббота','Saturday'),L('Bazar','Воскресенье','Sunday')];
const dshort=[null,L('B.e.','Пн','Mon'),L('Ç.a.','Вт','Tue'),L('Ç.','Ср','Wed'),L('C.a.','Чт','Thu'),L('C.','Пт','Fri'),L('Ş.','Сб','Sat'),L('B.','Вс','Sun')];

const plans=[
 {name:L('Sınaq məşqi','Пробная тренировка','Trial class'),price:0,per:L('bir dəfə','один раз','once'),inc:L('Başlanğıc və ya bütün səviyyələr qrupunda bir dərs, əlcək və qoruyucular zaldan, məşqçi ilə 10 dəqiqəlik söhbət.','Одно занятие в начальной группе или группе для всех уровней, перчатки и защита от зала, 10 минут разговора с тренером.','One class in a beginner or all-levels group, gloves and guards lent, a 10-minute talk with the coach.')},
 {name:L('Tək giriş','Разовое посещение','Drop-in'),price:20,per:L('dərs','занятие','class'),inc:L('Cədvəldəki istənilən uyğun səviyyəli dərs. Duş və şkaf daxildir.','Любое занятие подходящего уровня по расписанию. Душ и шкафчик включены.','Any class at your level on the timetable. Shower and locker included.')},
 {name:L('8 məşq','8 тренировок','8 classes'),price:90,per:L('ay','месяц','month'),inc:L('Ayda 8 dərs istənilən istiqamətdə, şənbə açıq matı, duş və şkaf. İstifadə olunmayan dərslər növbəti aya keçmir.','8 занятий в месяц по любому направлению, открытый мат в субботу, душ и шкафчик. Неиспользованные занятия не переносятся.','8 classes a month in any discipline, Saturday open mat, shower and locker. Unused classes do not roll over.')},
 {name:L('Limitsiz','Безлимит','Unlimited'),price:140,per:L('ay','месяц','month'),inc:L('Bütün dərslər, açıq mat, ildə bir dəfə 14 günə qədər dondurma, şəxsi şkaf.','Все занятия, открытый мат, заморозка до 14 дней раз в год, личный шкафчик.','Every class, open mat, one freeze of up to 14 days a year, your own locker.')},
 {name:L('Gənclər, 14–17','Подростки, 14–17','Youth, 14–17'),price:80,per:L('ay','месяц','month'),inc:L('Həftədə iki gənclər dərsi (boks və Muay Thai), valideynin yazılı razılığı ilə.','Два подростковых занятия в неделю (бокс и муай-тай), с письменным согласием родителя.','Two youth classes a week (boxing and Muay Thai), with a parent\'s written consent.')},
 {name:L('Fərdi məşq','Персональная тренировка','Personal session'),price:40,per:L('saat','час','hour'),inc:L('Məşqçi ilə təkbətək, vaxt razılaşdırılır. Paket yoxdur — hər dəfə ayrıca.','Один на один с тренером, время по договорённости. Без пакетов — каждый раз отдельно.','One to one with a coach at an agreed time. No packages, paid per session.')}
];

const S={
 days,dshort,
 disc:Object.fromEntries(Object.entries(disc).map(([k,v])=>[k,{code:v.code,name:v.name,bring:v.bring}])),
 level,coaches:Object.fromEntries(Object.entries(coaches).map(([k,v])=>[k,{name:v.name}])),
 left:L('{n} yer qalıb','осталось мест: {n}','{n} places left'),
 full:L('Dolu','Мест нет','Full'),
 yours:L('Sizin sınaq','Ваша пробная','Your trial'),
 minutes:L('{n} dəq','{n} мин','{n} min'),
 capLine:L('{taken} / {cap} yer tutulub','{taken} из {cap} мест занято','{taken} of {cap} places booked'),
 noTrialLevel:L('Sınaq məşqi yalnız başlanğıc, bütün səviyyələr və gənclər qruplarında keçirilir. Bu dərsə məşqçi ilə danışdıqdan sonra gələ bilərsiniz.','Пробная тренировка проходит только в начальных группах, группах для всех уровней и подростковых. На это занятие можно прийти после разговора с тренером.','Trial classes are only in beginner, all-levels and youth groups. You can join this one after talking to a coach.'),
 fullNote:L('Bu dərsdə yer qalmayıb. Eyni istiqamətdə başqa günü seçin.','На это занятие мест нет. Выберите другой день по этому направлению.','This class is full. Pick another day for the same discipline.'),
 already:L('Sizin artıq sınaq yeriniz var: {cls}. Bir nəfərə bir sınaq məşqi düşür.','У вас уже есть пробное место: {cls}. Одна пробная тренировка на человека.','You already have a trial place: {cls}. One trial class per person.'),
 booked:L('{name}, yeriniz saxlanıldı: {cls}. Demo: heç nə göndərilmədi. Real zalda administrator bir gün əvvəl zəng edib təsdiqləyərdi.','{name}, место за вами: {cls}. Демо: ничего не отправлено. В реальном зале администратор позвонил бы накануне и подтвердил.','{name}, your place is held: {cls}. Demo: nothing was sent. A real gym would call the day before to confirm.'),
 clsLine:L('{disc}, {day} {time}','{disc}, {day} {time}','{disc}, {day} {time}'),
 none:L('Bu filtrlərlə dərs yoxdur.','По этим фильтрам занятий нет.','No classes match these filters.'),
 count:L('{n} dərs göstərilir','Показано занятий: {n}','{n} classes shown'),
 err:{
  name:L('Adınızı yazın.','Напишите имя.','Write your name.'),
  phone:L('Nömrəni +994 50 123 45 67 formatında yazın.','Введите номер в формате +994 50 123 45 67.','Enter the number as +994 50 123 45 67.'),
  age:L('Yaşı 14 ilə 70 arasında yazın.','Укажите возраст от 14 до 70.','Enter an age from 14 to 70.'),
  youth:L('16 yaşdan kiçiklər yalnız gənclər qrupuna yazılır.','Младше 16 лет — только в подростковую группу.','Under-16s can only book a youth class.'),
  adult:L('Gənclər qrupu 14–17 yaş üçündür. Böyüklər üçün başlanğıc qrupunu seçin.','Подростковая группа — для 14–17 лет. Взрослым — начальная группа.','The youth group is for ages 14–17. Adults should pick a beginner class.'),
  exp:L('Təcrübənizi seçin.','Выберите опыт.','Choose your experience.'),
  rules:L('Zal qaydaları ilə tanış olduğunuzu təsdiqləyin.','Подтвердите, что ознакомились с правилами зала.','Confirm you have read the house rules.'),
  guardian:L('18 yaşdan kiçiklər üçün valideyn razılığı lazımdır.','Для младше 18 лет нужно согласие родителя.','Under-18s need a parent\'s consent.')
 }
};

export default {
 id:'gym',brand:'Wolfpack',kind:'site',
 render(ctx){
  const t=ctx.t;
  const times=[...new Set(classes.map(c=>c.t))].sort();
  const cell=c=>`<button type="button" class="wp-cls" data-id="${c.id}" data-disc="${c.disc}" data-lvl="${c.lvl}"><span class="wp-code">${disc[c.disc].code}</span><span class="wp-lvl">${t(level[c.lvl])}</span><span class="wp-co">${esc(coaches[c.co].name)}</span><span class="wp-left" data-left="${c.id}">${t(S.left,{n:c.cap-c.taken})}</span></button>`;
  const table=`<table class="wp-tt"><caption class="sr-only">${t(L('Həftəlik dərs cədvəli','Недельное расписание занятий','Weekly class timetable'))}</caption><thead><tr><th scope="col"><span class="sr-only">${t(L('Vaxt','Время','Time'))}</span></th>${[1,2,3,4,5,6,7].map(d=>`<th scope="col">${t(days[d])}</th>`).join('')}</tr></thead><tbody>${times.map(tm=>`<tr><th scope="row">${tm}</th>${[1,2,3,4,5,6,7].map(d=>{const c=classes.filter(x=>x.d===d&&x.t===tm);return `<td>${c.map(cell).join('')}</td>`}).join('')}</tr>`).join('')}</tbody></table>`;
  const chip=(group,val,label,on)=>`<button type="button" class="wp-chip" data-${group}="${val}" aria-pressed="${on}">${label}</button>`;
  return `<div class="wp">
<header class="wp-top">
 <a class="wp-mark" href="#top">WOLFPACK</a>
 <nav aria-label="${t(L('Əsas menyu','Главное меню','Main menu'))}"><a href="#timetable">${t(L('Cədvəl','Расписание','Timetable'))}</a><a href="#prices">${t(L('Qiymətlər','Цены','Prices'))}</a><a href="#first">${t(L('İlk gəliş','Первый визит','First visit'))}</a><a href="#rules">${t(L('Qaydalar','Правила','Rules'))}</a></nav>
 <a class="wp-btn" href="#timetable">${t(L('Pulsuz sınaq','Бесплатная проба','Free trial'))}</a>
</header>

<section class="wp-hero" aria-labelledby="wp-h1">
 <h1 id="wp-h1" class="wp-poster"><span lang="en">MMA</span><span lang="en">Muay Thai</span><span lang="en">BJJ</span><span>${t(L('Boks','Бокс','Boxing'))}</span></h1>
 <figure class="wp-hero-photo"><img src="/assets/showroom/gym.webp" width="1200" height="900" alt="${t(L('Əllərə boks binti sarınır, qara-ağ','Бинтование рук перед тренировкой, чёрно-белое фото','Hands being wrapped before training, black and white'))}" fetchpriority="high" decoding="async"></figure>
 <div class="wp-hero-copy">
  <p class="wp-hero-lede">${t(L('Bakı, Yasamal. Dörd istiqamət, bir mat, həftədə 21 dərs. İlk dərs pulsuzdur — cədvəldən başlanğıc qrupu seçin.','Баку, Ясамал. Четыре направления, один мат, 21 занятие в неделю. Первое занятие бесплатно — выберите начальную группу в расписании.','Yasamal, Baku. Four disciplines, one mat, 21 classes a week. Your first class is free: pick a beginner group on the timetable.'))}</p>
  <a class="wp-btn wp-btn-big" href="#timetable">${t(L('Cədvələ bax və yazıl','Смотреть расписание и записаться','See the timetable and book'))}</a>
 </div>
 <dl class="wp-strip">
  <div><dt>${t(L('İş saatları','Часы работы','Hours'))}</dt><dd>${t(L('B.e.–C. 07:00–22:30, Ş. 10:00–16:00','Пн–Пт 07:00–22:30, Сб 10:00–16:00','Mon–Fri 07:00–22:30, Sat 10:00–16:00'))}</dd></div>
  <div><dt>${t(L('Bazar','Воскресенье','Sunday'))}</dt><dd>${t(L('bağlı, bərpa günü','закрыто, день восстановления','closed, recovery day'))}</dd></div>
  <div><dt>${t(L('Yaş','Возраст','Age'))}</dt><dd>${t(L('16+, gənclər qrupu 14–17','16+, подростки 14–17','16+, youth group 14–17'))}</dd></div>
 </dl>
</section>

<section class="wp-tt-sec" id="timetable" aria-labelledby="wp-tt-h">
 <div class="wp-tt-head">
  <h2 id="wp-tt-h">${t(L('Həftəlik cədvəl','Расписание на неделю','The week'))}</h2>
  <p>${t(L('Dərsə toxunun: məşqçi, səviyyə, boş yer və nə gətirmək lazım olduğu açılır. Sınaq üçün başlanğıc, bütün səviyyələr və ya gənclər dərsini seçin.','Нажмите на занятие: откроются тренер, уровень, свободные места и что взять с собой. Для пробы выберите начальную группу, все уровни или подростков.','Tap a class to see the coach, level, places left and what to bring. For a trial, choose a beginner, all-levels or youth class.'))}</p>
 </div>
 <div class="wp-filters" role="group" aria-label="${t(L('Filtrlər','Фильтры','Filters'))}">
  <div class="wp-fgroup" role="group" aria-label="${t(L('İstiqamət','Направление','Discipline'))}">${chip('fd','all',t(L('Hamısı','Все','All')),true)}${Object.entries(disc).map(([k,v])=>chip('fd',k,t(v.name),false)).join('')}</div>
  <div class="wp-fgroup" role="group" aria-label="${t(L('Səviyyə','Уровень','Level'))}">${chip('fl','all',t(L('İstənilən səviyyə','Любой уровень','Any level')),true)}${Object.entries(level).map(([k,v])=>chip('fl',k,t(v),false)).join('')}</div>
  <label class="wp-toggle"><input type="checkbox" id="wp-open"> ${t(L('Yalnız boş yeri olanlar','Только со свободными местами','Only with places left'))}</label>
 </div>
 <p class="wp-count" id="wp-count" aria-live="polite"></p>
 <div class="wp-tt-scroll">${table}</div>
 <div class="wp-mobile" id="wp-mobile">
  <div class="wp-daybar" role="group" aria-label="${t(L('Gün','День','Day'))}">${[1,2,3,4,5,6,7].map(d=>`<button type="button" class="wp-daybtn" data-mday="${d}" aria-pressed="${d===1}"><abbr title="${t(days[d])}">${t(dshort[d])}</abbr></button>`).join('')}</div>
  <h3 class="wp-mday-h" id="wp-mday-h">${t(days[1])}</h3>
  <ul class="wp-mlist" id="wp-mlist"></ul>
 </div>
 <div class="wp-empty" id="wp-empty" hidden><p>${t(S.none)}</p><button type="button" class="wp-btn wp-btn-ghost" id="wp-reset">${t(L('Filtrləri sıfırla','Сбросить фильтры','Reset filters'))}</button></div>
 <p class="wp-legend"><span class="wp-k-full">${t(S.full)}</span><span class="wp-k-yours">${t(S.yours)}</span><span>${t(L('Kodlar: MMA, MT — Muay Thai, BJJ — Braziliya jiu-jitsu, BOX — boks','Коды: MMA, MT — муай-тай, BJJ — бразильское джиу-джитсу, BOX — бокс','Codes: MMA, MT = Muay Thai, BJJ = Brazilian jiu-jitsu, BOX = boxing'))}</span></p>
</section>

<dialog class="wp-dlg" id="wp-dlg" aria-labelledby="wp-dlg-h">
 <div class="wp-dlg-in">
  <button type="button" class="wp-close" id="wp-close" aria-label="${t(L('Bağla','Закрыть','Close'))}">×</button>
  <p class="wp-dlg-code" id="wp-dlg-code"></p>
  <h2 id="wp-dlg-h"></h2>
  <dl class="wp-facts">
   <div><dt>${t(L('Məşqçi','Тренер','Coach'))}</dt><dd id="wp-f-coach"></dd></div>
   <div><dt>${t(L('Səviyyə','Уровень','Level'))}</dt><dd id="wp-f-lvl"></dd></div>
   <div><dt>${t(L('Müddət','Длительность','Length'))}</dt><dd id="wp-f-dur"></dd></div>
   <div><dt>${t(L('Yerlər','Места','Places'))}</dt><dd id="wp-f-cap"></dd></div>
  </dl>
  <div class="wp-capbar" aria-hidden="true"><i id="wp-capfill"></i></div>
  <h3>${t(L('Nə gətirməli','Что взять с собой','What to bring'))}</h3>
  <p id="wp-f-bring"></p>
  <p class="wp-note" id="wp-note" hidden></p>
  <form class="wp-form" id="wp-form" novalidate>
   <h3>${t(L('Pulsuz sınaq üçün yazıl','Записаться на бесплатную пробу','Book a free trial'))}</h3>
   <div class="wp-fields">
    <div class="wp-field"><label for="wp-name">${t(L('Ad və soyad','Имя и фамилия','Full name'))}</label><input id="wp-name" name="name" autocomplete="name" maxlength="60" aria-describedby="wp-name-err"><p class="wp-ferr" id="wp-name-err"></p></div>
    <div class="wp-field"><label for="wp-phone">${t(L('Telefon','Телефон','Phone'))}</label><input id="wp-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+994 50 123 45 67" aria-describedby="wp-phone-err"><p class="wp-ferr" id="wp-phone-err"></p></div>
    <div class="wp-field"><label for="wp-age">${t(L('Yaş','Возраст','Age'))}</label><input id="wp-age" name="age" type="number" inputmode="numeric" min="14" max="70" aria-describedby="wp-age-err"><p class="wp-ferr" id="wp-age-err"></p></div>
    <div class="wp-field"><label for="wp-exp">${t(L('Təcrübə','Опыт','Experience'))}</label><select id="wp-exp" name="exp" aria-describedby="wp-exp-err"><option value="">${t(L('Seçin','Выберите','Choose'))}</option><option value="0">${t(L('Heç məşq etməmişəm','Никогда не занимался','Never trained'))}</option><option value="1">${t(L('1 ildən az','Меньше года','Under a year'))}</option><option value="2">${t(L('1–3 il','1–3 года','1–3 years'))}</option><option value="3">${t(L('3 ildən çox','Больше 3 лет','Over 3 years'))}</option></select><p class="wp-ferr" id="wp-exp-err"></p></div>
   </div>
   <label class="wp-check" id="wp-guardian-row" hidden><input type="checkbox" name="guardian" id="wp-guardian"> ${t(L('Valideyn razıdır və ilk dərsə birlikdə gələcəyik','Родитель согласен, на первое занятие придём вместе','A parent agrees and will come to the first class'))}</label>
   <p class="wp-ferr" id="wp-guardian-err"></p>
   <label class="wp-check"><input type="checkbox" name="rules" id="wp-rules"> ${t(L('Zal qaydalarını oxudum. Sağlamlığımla bağlı məhdudiyyət varsa, məşqçiyə dərsdən əvvəl deyəcəyəm.','Я прочитал правила зала. Если есть ограничения по здоровью, скажу тренеру до занятия.','I have read the house rules and will tell the coach before class about any health limits.'))}</label>
   <p class="wp-ferr" id="wp-rules-err"></p>
   <button type="submit" class="wp-btn wp-btn-big">${t(L('Yeri saxla','Забронировать место','Hold my place'))}</button>
  </form>
  <div class="wp-ok" id="wp-ok" hidden role="status"></div>
 </div>
</dialog>

<section class="wp-prices" id="prices" aria-labelledby="wp-pr-h">
 <h2 id="wp-pr-h">${t(L('Qiymətlər','Цены','Prices'))}</h2>
 <p class="wp-sub">${t(L('Müqavilə və giriş haqqı yoxdur. Ödəniş administratorda nağd və ya kartla. Qiymətlər nümunədir.','Без договора и вступительного взноса. Оплата у администратора наличными или картой. Цены — образец.','No contract and no joining fee. Pay at the desk, cash or card. Prices are samples.'))}</p>
 <ul class="wp-plan-list">${plans.map(p=>`<li><h3>${t(p.name)}</h3><p class="wp-price"><b>${p.price===0?t(L('Pulsuz','Бесплатно','Free')):ctx.num(p.price)}</b>${p.price===0?'':` <span>AZN / ${t(p.per)}</span>`}</p><p>${t(p.inc)}</p></li>`).join('')}</ul>
</section>

<section class="wp-first" id="first" aria-labelledby="wp-first-h">
 <h2 id="wp-first-h">${t(L('İlk gəliş','Первый визит','Your first visit'))}</h2>
 <ol class="wp-steps">
  <li><h3>${t(L('15 dəqiqə tez gəlin','Приходите за 15 минут','Come 15 minutes early'))}</h3><p>${t(L('Administratorda qısa anket doldurursunuz, şkaf açarı və lazım olsa əlcək alırsınız.','У администратора заполняете короткую анкету, получаете ключ от шкафчика и при необходимости перчатки.','Fill in a short form at the desk and get a locker key and, if needed, gloves.'))}</p></li>
  <li><h3>${t(L('Məşqçiyə deyin','Скажите тренеру','Tell the coach'))}</h3><p>${t(L('İlk dəfə olduğunuzu, əvvəlki zədələri və təcrübənizi. Məşqçi sizi uyğun partnyorla cütləşdirir.','Что вы впервые, о прошлых травмах и опыте. Тренер подберёт подходящего партнёра.','That it is your first time, any past injuries and experience. The coach pairs you with a suitable partner.'))}</p></li>
  <li><h3>${t(L('Isınma və texnika','Разминка и техника','Warm-up and technique'))}</h3><p>${t(L('İlk dərsdə sparrinq yoxdur. Texnikanı partnyorla yavaş tempdə işləyirsiniz.','На первом занятии спарринга нет. Технику отрабатываете с партнёром в медленном темпе.','No sparring on your first class. You drill technique with a partner at a slow pace.'))}</p></li>
  <li><h3>${t(L('Sonra danışırıq','Потом поговорим','Talk afterwards'))}</h3><p>${t(L('Dərsdən sonra məşqçi hansı qrupun və abunəliyin sizə uyğun olduğunu deyir. Qərar sizindir, heç nə almaq məcburi deyil.','После занятия тренер подскажет, какая группа и абонемент вам подходят. Решение за вами, покупать ничего не обязательно.','After class the coach suggests a group and plan. It is your call; you do not have to buy anything.'))}</p></li>
 </ol>
 <div class="wp-bring-grid">${Object.values(disc).map(v=>`<div><h3>${t(v.name)}</h3><p>${t(v.bring)}</p></div>`).join('')}</div>
</section>

<section class="wp-rules" id="rules" aria-labelledby="wp-rules-h">
 <h2 id="wp-rules-h">${t(L('Zal qaydaları','Правила зала','House rules'))}</h2>
 <ul>
  <li>${t(L('Mata ayaqqabı ilə çıxmırıq, matdan ayaqyalın çıxmırıq — terlik götürün.','На мат не выходим в обуви, с мата не уходим босиком — возьмите шлёпанцы.','No shoes on the mat, no bare feet off it: bring sandals.'))}</li>
  <li>${t(L('Dırnaqlar qısa, geyim təmiz, hər dərsdən sonra yeni geyim.','Короткие ногти, чистая форма, после каждого занятия — свежая.','Short nails, clean kit, fresh kit after every class.'))}</li>
  <li>${t(L('Partnyor “tap” edəndə və ya “dayan” deyəndə dərhal buraxırıq.','Если партнёр стучит или говорит «стоп», сразу отпускаем.','When a partner taps or says stop, let go at once.'))}</li>
  <li>${t(L('Sparrinq yalnız məşqçinin icazəsi və onun nəzarəti ilə.','Спарринг — только с разрешения тренера и под его контролем.','Sparring only with the coach\'s permission and supervision.'))}</li>
  <li>${t(L('Dəri xəstəliyi, açıq yara və ya hərarət varsa, həmin gün mata çıxmırıq.','При кожных заболеваниях, открытых ранах или температуре в этот день на мат не выходим.','With a skin infection, open wound or temperature, stay off the mat that day.'))}</li>
  <li>${t(L('Telefonla mat üzərində video çəkmək yalnız hamının razılığı ilə.','Снимать видео на мате — только с согласия всех.','Filming on the mat only with everyone\'s consent.'))}</li>
 </ul>
</section>

<section class="wp-coaches" aria-labelledby="wp-co-h">
 <h2 id="wp-co-h">${t(L('Məşqçilər','Тренеры','Coaches'))}</h2>
 <ul>${Object.entries(coaches).map(([k,c])=>`<li><h3>${esc(c.name)}</h3><p class="wp-co-d">${t(disc[c.disc].name)}</p><p>${t(c.about)}</p><p class="wp-co-cls">${classes.filter(x=>x.co===k).map(x=>`${t(dshort[x.d])} ${x.t}`).join(', ')}</p></li>`).join('')}</ul>
</section>

<footer class="wp-foot">
 <p class="wp-mark">WOLFPACK</p>
 <p>${t(L('Bakı, Yasamal rayonu (nümunə ünvan). Telefon: +994 12 000 00 00.','Баку, Ясамальский район (адрес-образец). Телефон: +994 12 000 00 00.','Yasamal district, Baku (sample address). Phone: +994 12 000 00 00.'))}</p>
 <p class="wp-foot-note">${t(L('Konsept nümunəsi: zal, məşqçilər, cədvəl və qiymətlər uydurmadır. Əsas şəkil sahibkar tərəfindən verilmiş, süni intellektlə yaradılmış təsvirdir.','Концепт-образец: зал, тренеры, расписание и цены вымышлены. Главное изображение предоставлено владельцем и создано с помощью ИИ.','Concept sample: the gym, coaches, timetable and prices are fictional. The main image was supplied by the owner and generated with AI.'))}</p>
</footer>
${ctx.data({classes,S})}
</div>`;
 }
};
