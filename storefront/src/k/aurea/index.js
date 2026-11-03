// Aurea — nine rooms in a restored silk merchant's house in Şəki. A guest-book page with one precise tool: dates → rooms → enquiry.
import {L} from '../kit.js';

// Browsers may lack Azerbaijani calendar data, so day and month names are resolved at build time.
const cal=ctx=>({wd:[0,1,2,3,4,5,6].map(i=>ctx.date(new Date(2026,10,1+i),{weekday:'short'})),
 mon:Array.from({length:12},(_,m)=>ctx.date(new Date(2026,m,15),{month:'long'})),
 mong:Array.from({length:12},(_,m)=>ctx.date(new Date(2026,m,15),{day:'numeric',month:'long'}).replace(/^\d+\s*/,'')),
 monShort:Array.from({length:12},(_,m)=>ctx.date(new Date(2026,m,15),{month:'short'}).replace('.',''))});

const ROOMS=[
 {id:'court',img:'window',count:3,price:140,m2:18,adults:2,total:2,
  name:L('Həyət otağı','Комната во двор','Courtyard room'),
  bed:L('İkinəfərlik çarpayı, 160 sm','Двуспальная кровать, 160 см','Double bed, 160 cm'),
  view:L('Həyətə və tut ağacına','Во двор, на шелковицу','Onto the courtyard and the mulberry tree'),
  floor:L('Birinci mərtəbə, pilləkənsiz','Первый этаж, без ступеней','Ground floor, step-free'),
  bath:L('Duş','Душ','Shower'),
  note:L('Köhnə barama anbarının yerində; qalın daş divarlar yayda sərin saxlayır.','На месте старого склада коконов; толстые каменные стены летом держат прохладу.','Where the cocoon store used to be; thick stone walls keep it cool in summer.')},
 {id:'merchant',img:'walnut',count:3,price:190,m2:24,adults:2,total:3,
  name:L('Tacir otağı','Комната купца','Merchant’s room'),
  bed:L('Böyük çarpayı, 180 sm; uşaq üçün açılan taxt','Большая кровать, 180 см; раскладная тахта для ребёнка','King bed, 180 cm; fold-out bench for a child'),
  view:L('Şəbəkə pəncərə, bağa','Окно-шебеке, в сад','Şəbəkə window onto the garden'),
  floor:L('İkinci mərtəbə, 14 pillə','Второй этаж, 14 ступеней','First floor, 14 steps'),
  bath:L('Vanna və duş','Ванна и душ','Bath and shower'),
  note:L('Qoz döşəmə və 1879-cu ilin bərpa olunmuş şəbəkəsi. Səhər işığı rəngli şüşədən düşür.','Ореховый пол и восстановленное шебеке 1879 года. Утренний свет идёт через цветное стекло.','Walnut floor and the restored 1879 şəbəkə. Morning light comes through coloured glass.')},
 {id:'family',img:'beams',count:2,price:240,m2:32,adults:4,total:4,
  name:L('Ailə otağı','Семейный номер','Family room'),
  bed:L('İkinəfərlik + iki təknəfərlik çarpayı','Двуспальная + две односпальные кровати','A double and two single beds'),
  view:L('Yuxarı Başın kirəmit damlarına','На черепичные крыши Юхары Баша','Over the tiled roofs of Yukhari Bash'),
  floor:L('İkinci mərtəbə, 14 pillə','Второй этаж, 14 ступеней','First floor, 14 steps'),
  bath:L('Duş, ayrıca tualet','Душ, отдельный туалет','Shower, separate WC'),
  note:L('Tavanda orijinal palıd tirlər. İki otaq arakəsmə ilə bölünür.','Под потолком оригинальные дубовые балки. Две зоны разделены перегородкой.','Original oak beams overhead. Two areas divided by a partition.')},
 {id:'suite',img:'bath',count:1,price:320,m2:40,adults:2,total:2,
  name:L('Eyvan süiti','Сюит с эйваном','Eyvan suite'),
  bed:L('Böyük çarpayı, 180 sm','Большая кровать, 180 см','King bed, 180 cm'),
  view:L('Taxta eyvandan Qafqaz meşəsinə','С деревянного эйвана на кавказский лес','From a wooden eyvan to the Caucasus forest'),
  floor:L('Üçüncü mərtəbə, 28 pillə','Третий этаж, 28 ступеней','Second floor, 28 steps'),
  bath:L('Ayaqlı çuqun vanna','Чугунная ванна на ножках','Clawfoot cast-iron bath'),
  note:L('Evin ən yuxarı otağı, yeganə özəl eyvanla. Qışda soba yanır.','Самая верхняя комната дома, единственная с собственным эйваном. Зимой топится печь.','The top room of the house and the only one with its own eyvan. A stove is lit in winter.')}
];

const TIMELINE=[
 ['1868',L('İpək taciri Hacı Rəhim evi tikdirir: aşağıda barama anbarı, yuxarıda ailə.','Шёлковый купец Гаджи Рагим строит дом: внизу склад коконов, наверху семья.','Silk merchant Haji Rahim builds the house: the cocoon store below, the family above.')],
 ['1879',L('Yuxarı mərtəbəyə şəbəkə pəncərələr qoyulur — mismarsız və yapışqansız yığılan taxta və rəngli şüşə.','На верхнем этаже ставят окна-шебеке — дерево и цветное стекло, собранные без гвоздей и клея.','Şəbəkə windows go into the upper floor — wood and coloured glass assembled without nails or glue.')],
 ['1924',L('Ev beş ailə arasında bölünür; eyvanlar taxta ilə örtülür.','Дом делят между пятью семьями; эйваны зашивают досками.','The house is divided between five families; the eyvans are boarded up.')],
 ['1958',L('Aşağı mərtəbə barama qurutma məntəqəsi olur.','Нижний этаж становится пунктом сушки коконов.','The ground floor becomes a cocoon-drying station.')],
 ['1999',L('Ev boşalır, dam axmağa başlayır.','Дом пустеет, крыша начинает течь.','The house empties and the roof starts to leak.')],
 ['2021–2024',L('Bərpa: əhəng suvağı, qoz döşəmə, şəbəkələrin sökülüb yenidən yığılması, əl ilə kirəmit.','Реставрация: известковая штукатурка, ореховый пол, шебеке разобраны и собраны заново, черепица вручную.','Restoration: lime plaster, walnut floors, the şəbəkə taken apart and rebuilt, hand-laid tiles.')],
 ['2025',L('Aurea doqquz otaqla açılır.','Aurea открывается с девятью комнатами.','Aurea opens with nine rooms.')]
];

const ARRIVE=[
 [L('Qəbələ hava limanı','Аэропорт Габала','Qabala airport'),L('60 km, təxminən 1 saat. Transfer 50 AZN, maşın başına.','60 км, около часа. Трансфер 50 AZN за машину.','60 km, about an hour. Transfer 50 AZN per car.')],
 [L('Gəncə hava limanı','Аэропорт Гянджа','Ganja airport'),L('130 km, təxminən 2 saat. Transfer 90 AZN, maşın başına.','130 км, около 2 часов. Трансфер 90 AZN за машину.','130 km, about 2 hours. Transfer 90 AZN per car.')],
 [L('Bakıdan maşınla','Из Баку на машине','By car from Baku'),L('300 km, 4½–5 saat, Qəbələ yolu ilə.','300 км, 4½–5 часов, через Габалу.','300 km, 4½–5 hours via Qabala.')],
 [L('Avtomobil','Парковка','Parking'),L('Həyətdə 3 pulsuz yer, əvvəlcədən yazın. Doluysa, 150 m aşağıda bələdiyyə dayanacağı.','Во дворе 3 бесплатных места, предупредите заранее. Если заняты — муниципальная стоянка в 150 м ниже.','Three free spaces in the yard, ask ahead. If full, a municipal car park 150 m down the hill.')],
 [L('Səhər yeməyi','Завтрак','Breakfast'),L('08:00–10:30, yayda həyətdə, qışda çay otağında. Qiymətə daxildir.','08:00–10:30, летом во дворе, зимой в чайной комнате. Включён в цену.','08:00–10:30, in the courtyard in summer and the tea room in winter. Included.')],
 [L('Giriş və çıxış','Заезд и выезд','Check-in and out'),L('Giriş 14:00-dan, çıxış 12:00-dək. Resepsiya 07:30–23:00.','Заезд с 14:00, выезд до 12:00. Ресепшн 07:30–23:00.','Check-in from 14:00, check-out by 12:00. Reception 07:30–23:00.')]
];

const WALK=[
 [L('Şəki xanlarının sarayı','Дворец шекинских ханов','Palace of the Shaki Khans'),L('6 dəq','6 мин','6 min')],
 [L('Yuxarı karvansara','Верхний караван-сарай','Upper caravanserai'),L('4 dəq','4 мин','4 min')],
 [L('Bazar və halva dükanları','Базар и лавки халвы','Bazaar and halva shops'),L('10 dəq','10 мин','10 min')],
 [L('Kiş kəndi, alban məbədi','Село Киш, албанский храм','Kish village, Albanian church'),L('maşınla 15 dəq','15 мин на машине','15 min by car')]
];

const FAQ=[
 [L('Ödəniş saytda alınır?','Оплата на сайте?','Do you take payment on the site?'),L('Xeyr. Müraciətə 24 saat ərzində cavab verib otağı saxlayırıq; ödəniş gələndə nağd və ya kartla.','Нет. Мы отвечаем на запрос в течение суток и держим номер; оплата при заезде наличными или картой.','No. We reply within a day and hold the room; you pay on arrival in cash or by card.')],
 [L('Ləğv etmək olar?','Можно отменить?','Can I cancel?'),L('Gəlişdən 7 gün əvvələdək pulsuz. Daha gec ləğvdə ilk gecənin dəyəri tutulur.','Бесплатно до 7 дней до заезда. При более поздней отмене удерживается стоимость первой ночи.','Free until 7 days before arrival. Later cancellations are charged the first night.')],
 [L('Pilləkənsiz otaq varmı?','Есть ли номера без ступеней?','Is there a step-free room?'),L('Yalnız üç həyət otağı. Ev 1868-ci ilindir, lift yoxdur; yuxarı otaqlara dar taxta pilləkənlə qalxılır.','Только три комнаты во двор. Дому с 1868 года, лифта нет; наверх ведёт узкая деревянная лестница.','Only the three courtyard rooms. The house dates from 1868 and has no lift; upper rooms are up a narrow wooden stair.')],
 [L('Uşaqlarla gəlmək olar?','Можно с детьми?','Are children welcome?'),L('Bəli. 6 yaşadək uşaq valideynlə eyni çarpayıda pulsuzdur. Tacir otağında uşaq üçün taxt, ailə otağında dörd yer var.','Да. Дети до 6 лет в одной кровати с родителями — бесплатно. В комнате купца есть тахта для ребёнка, в семейном — четыре места.','Yes. Children under 6 sharing a bed stay free. The merchant’s room has a child’s bench; the family room sleeps four.')],
 [L('Ev heyvanı ilə olar?','Можно с животными?','Can I bring a pet?'),L('Təəssüf ki, yox: döşəmələr və şəbəkələr bərpa olunmuş orijinallardır.','К сожалению, нет: полы и шебеке — восстановленные оригиналы.','No, sorry: the floors and şəbəkə are restored originals.')]
];

const T={
 nav:[['house',L('Ev','Дом','The house')],['rooms',L('Otaqlar','Комнаты','Rooms')],['stay',L('Tarixlər','Даты','Dates')],['arrive',L('Gəliş','Как добраться','Getting here')]],
 h1:L('Şəkidə, ipək tacirinin 1868-ci il evində doqquz otaq.','Девять комнат в доме шёлкового купца 1868 года, Шеки.','Nine rooms in a silk merchant’s house of 1868, in Shaki.'),
 lede:L('Yuxarı Baş qoruğunda, xan sarayından altı dəqiqəlik yoxuşda. Arxalı həyət, qoz döşəmələr, səhər yeməyi tut ağacının altında.','В заповеднике Юхары Баш, в шести минутах подъёма от ханского дворца. Двор с галереей, ореховые полы, завтрак под шелковицей.','In the Yukhari Bash reserve, six minutes uphill from the Khan’s palace. An arcaded courtyard, walnut floors, breakfast under the mulberry tree.'),
 heroCta:L('Tarixləri seçin','Выбрать даты','Choose dates'),
 from:L('gecəsi {p}-dən, səhər yeməyi ilə','за ночь от {p}, с завтраком','a night from {p}, breakfast included'),
 houseH:L('Evin tarixi','История дома','The house'),
 houseNote:L('Bu evin və tacirin tarixi konsept üçün yazılıb. Şəkinin ipək ticarəti və şəbəkə sənəti isə realdır.','История дома и купца написана для концепта. Шёлковая торговля Шеки и искусство шебеке — реальны.','The house and its merchant are written for this concept. Shaki’s silk trade and the craft of şəbəkə are real.'),
 roomsH:L('Dörd növ, doqquz otaq','Четыре типа, девять комнат','Four kinds, nine rooms'),
 roomsSub:L('Bütün otaqlarda səhər yeməyi, əhəng suvağı, qoz döşəmə, qışda isti döşəmə və sakit Wi-Fi var. Televizor yoxdur.','Во всех комнатах завтрак, известковая штукатурка, ореховый пол, зимой тёплый пол и Wi-Fi. Телевизоров нет.','Every room has breakfast, lime plaster, a walnut floor, underfloor heating in winter and Wi-Fi. No televisions.'),
 th:{room:L('Otaq','Комната','Room'),size:L('Sahə','Площадь','Size'),bed:L('Çarpayı','Кровать','Beds'),view:L('Mənzərə','Вид','View'),floor:L('Mərtəbə','Этаж','Floor'),bath:L('Hamam','Ванная','Bathroom'),sleeps:L('Yer','Мест','Sleeps'),night:L('Gecəsi','За ночь','Per night'),stay:L('Sizin tarixlər','Ваши даты','Your dates')},
 sleeps:L('{a} böyük','{a} взрослых','{a} adults'),sleepsKid:L('{a} böyük + 1 uşaq','{a} взрослых + 1 ребёнок','{a} adults + 1 child'),
 stayH:L('Tarixləri seçin','Выберите даты','Choose your dates'),
 staySub:L('Əvvəl gəliş, sonra gediş gününə toxunun. Cümə və şənbə gecələri üçün ən azı iki gecə.','Нажмите день заезда, затем день выезда. На пятницу и субботу — минимум две ночи.','Tap the arrival day, then the departure day. Friday and Saturday stays need at least two nights.'),
 prev:L('Əvvəlki ay','Предыдущий месяц','Previous month'),next:L('Növbəti ay','Следующий месяц','Next month'),
 adults:L('Böyüklər','Взрослые','Adults'),kids:L('Uşaqlar (6+)','Дети (6+)','Children (6+)'),
 fewer:L('Azalt','Меньше','Fewer'),more:L('Artır','Больше','More'),
 arrival:L('Gəliş','Заезд','Arrival'),departure:L('Gediş','Выезд','Departure'),
 nightsL:L('Gecə','Ночей','Nights'),
 clear:L('Tarixləri sil','Сбросить даты','Clear dates'),
 compareH:L('Bu tarixlər üçün otaqlar','Комнаты на эти даты','Rooms for these dates'),
 enquiryH:L('Müraciət','Запрос','Enquiry'),
 enquirySub:L('Ödəniş tələb olunmur. 24 saat ərzində e-poçt və ya telefonla cavab veririk.','Оплата не требуется. Мы ответим по почте или телефону в течение суток.','No payment is taken. We reply by e-mail or phone within a day.'),
 lName:L('Ad və soyad','Имя и фамилия','Full name'),lEmail:L('E-poçt','Эл. почта','E-mail'),lPhone:L('Telefon','Телефон','Phone'),
 contactHint:L('E-poçt və ya telefon — biri kifayətdir.','Почта или телефон — достаточно одного.','E-mail or phone — one is enough.'),
 lTime:L('Təxmini gəliş vaxtı','Примерное время приезда','Expected arrival time'),
 times:[L('14:00–16:00','14:00–16:00','14:00–16:00'),L('16:00–19:00','16:00–19:00','16:00–19:00'),L('19:00–23:00','19:00–23:00','19:00–23:00'),L('23:00-dan sonra (əvvəlcədən yazın)','После 23:00 (предупредите)','After 23:00 (let us know)')],
 lTransfer:L('Transfer','Трансфер','Transfer'),
 tNone:L('Lazım deyil','Не нужен','Not needed'),tQab:L('Qəbələ hava limanından, 50 AZN','Из аэропорта Габала, 50 AZN','From Qabala airport, 50 AZN'),tGan:L('Gəncə hava limanından, 90 AZN','Из аэропорта Гянджа, 90 AZN','From Ganja airport, 90 AZN'),
 lMsg:L('Sual və ya xahiş','Вопрос или пожелание','Question or request'),
 send:L('Müraciəti göndər','Отправить запрос','Send enquiry'),
 sumH:L('Qalış','Проживание','Your stay'),
 arriveH:L('Gəliş və ev qaydaları','Как добраться и порядок дома','Getting here and house notes'),
 walkH:L('Piyada','Пешком','On foot'),
 faqH:L('Soruşulanlar','Вопросы','Questions'),
 addr:L('Aurea, M. F. Axundzadə küçəsi 32, Yuxarı Baş, Şəki (nümunə ünvan)','Aurea, улица М. Ф. Ахундзаде 32, Юхары Баш, Шеки (адрес-пример)','Aurea, 32 M. F. Akhundzade street, Yukhari Bash, Shaki (sample address)'),
 reception:L('Resepsiya hər gün 07:30–23:00. +994 24 555 01 68 (nümunə nömrə)','Ресепшн ежедневно 07:30–23:00. +994 24 555 01 68 (номер-пример)','Reception daily 07:30–23:00. +994 24 555 01 68 (sample number)'),
 alt:{court:L('Əhəng suvaqlı sütunlar və taxta tirli eyvan, arxada daxili həyət və taxta yelləncək','Галерея с оштукатуренными известью столбами и деревянными балками, за ней внутренний двор с деревянными качелями','A gallery of lime-plastered pillars and timber beams opening onto the inner yard and a wooden swing'),
  alley:L('Daş hasarlar arasında yoxuşa qalxan daş döşəmə yol','Каменная мостовая, поднимающаяся между каменными оградами','A stone-paved lane climbing between stone walls'),
  valley:L('Buludlu meşəli dağlar arasında dərə','Долина между лесистыми горами под облаками','A valley between forested mountains under cloud'),
  breakfast:L('Armudu stəkanda çay, nəlbəkidə qənd','Чай в стакане-армуду, на блюдце сахар','Tea in a pear-shaped armudu glass, sugar on the saucer'),
  terraces:L('Yaşıl yamaclarda pilləli tarlalar və kənd','Террасные поля и деревня на зелёных склонах','Terraced fields and a village on green slopes')}
};

const R={
 nights:L('{n} gecə','{n} ночей','{n} nights'),night1:L('1 gecə','1 ночь','1 night'),
 pickArrival:L('Gəliş gününü seçin.','Выберите день заезда.','Choose the arrival day.'),
 pickDeparture:L('İndi gediş gününü seçin.','Теперь выберите день выезда.','Now choose the departure day.'),
 weekend:L('Cümə və ya şənbə gecəsi daxildir — ən azı 2 gecə seçin.','В даты входит ночь на пятницу или субботу — выберите минимум 2 ночи.','A Friday or Saturday night is included — choose at least 2 nights.'),
 tooLong:L('Saytdan ən çox 14 gecə soruşmaq olar; uzun qalış üçün bizə yazın.','Через сайт — не больше 14 ночей; о долгом проживании напишите нам.','Up to 14 nights through the site; write to us about longer stays.'),
 noDates:L('Tarixləri seçəndə burada hər otağın qiyməti və boş yer sayı görünəcək.','После выбора дат здесь появятся цена и наличие по каждой комнате.','Once you choose dates, each room’s total and availability appear here.'),
 left:L('{n} otaq boşdur','свободно: {n}','{n} available'),left1:L('Sonuncu otaq','Последняя','Last one left'),
 soldout:L('Bu tarixlərdə dolu','На эти даты занято','Full on these dates'),
 tooMany:L('{g} nəfər üçün kiçikdir','Мала для {g} гостей','Too small for {g} guests'),
 choose:L('Seç','Выбрать','Choose'),chosen:L('Seçildi','Выбрано','Chosen'),
 total:L('Cəmi','Итого','Total'),room:L('Otaq','Комната','Room'),transfer:L('Transfer','Трансфер','Transfer'),guests:L('Qonaqlar','Гости','Guests'),dates:L('Tarixlər','Даты','Dates'),
 gAdults:L('{a} böyük','{a} взр.','{a} adults'),gKids:L('{k} uşaq','{k} дет.','{k} children'),
 pickRoom:L('Otaq seçin — müraciət forması açılacaq.','Выберите комнату — откроется форма запроса.','Choose a room to open the enquiry form.'),
 nameErr:L('Ad və soyadı yazın.','Напишите имя и фамилию.','Write your full name.'),
 contactErr:L('E-poçt və ya telefon yazın ki, cavab verə bilək.','Укажите почту или телефон, чтобы мы могли ответить.','Give an e-mail or phone so we can reply.'),
 emailErr:L('E-poçt ünvanı natamamdır (məsələn, ad@mail.az).','Адрес почты неполный (например, name@mail.az).','The e-mail address is incomplete (for example, name@mail.az).'),
 phoneErr:L('Telefonu beynəlxalq formatda yazın (məsələn, +994 50 123 45 67).','Номер в международном формате (например, +994 50 123 45 67).','Write the phone in international format (for example, +994 50 123 45 67).'),
 doneH:L('Müraciət qeydə alındı','Запрос записан','Enquiry noted'),
 done:L('{name}, {room} — {dates}, {nights}. Cəmi {total}, səhər yeməyi daxil.','{name}, {room} — {dates}, {nights}. Итого {total}, завтрак включён.','{name}, {room} — {dates}, {nights}. Total {total}, breakfast included.'),
 demo:L('Bu konsept nümunəsidir: müraciət göndərilmədi, otaq saxlanmadı və ödəniş alınmadı.','Это концепт: запрос не отправлен, комната не забронирована, оплата не взята.','This is a concept: no enquiry was sent, no room was held and no payment was taken.'),
 again:L('Başqa tarixlər','Другие даты','Other dates'),
 none:L('yoxdur','нет','none'),
 start:L('gəliş','заезд','arrival'),end:L('gediş','выезд','departure')
};

export default {
 id:'aurea',brand:'Aurea',kind:'site',
 render(ctx){
  const t=ctx.t;
  const nav=T.nav.map(([id,l])=>`<a href="#au-${id}">${t(l)}</a>`).join('');
  const rows=ROOMS.map(r=>`<tr data-room="${r.id}">
   <th scope="row"><span class="au-thumb">${ctx.img(`aurea/${r.img}`,r.name,{sizes:'(min-width: 900px) 180px, 90vw'})}</span><span class="au-rname">${t(r.name)}</span><span class="au-rnote">${t(r.note)}</span></th>
   <td data-l="${t(T.th.size)}"><span class="au-num">${r.m2}</span> m²</td>
   <td data-l="${t(T.th.bed)}">${t(r.bed)}</td>
   <td data-l="${t(T.th.view)}">${t(r.view)}<br><span class="au-sub">${t(r.floor)}</span></td>
   <td data-l="${t(T.th.bath)}">${t(r.bath)}</td>
   <td data-l="${t(T.th.sleeps)}">${t(r.total>r.adults?T.sleepsKid:T.sleeps,{a:r.adults===4?4:r.adults})}</td>
   <td data-l="${t(T.th.night)}" class="au-price"><span class="au-num">${ctx.num(r.price)}</span> AZN</td>
   <td data-l="${t(T.th.stay)}" class="au-stay"><span class="au-stay-text">—</span><button type="button" class="au-choose" data-choose="${r.id}" disabled>${t(R.choose)}</button></td>
  </tr>`).join('');
  const tl=TIMELINE.map(([y,txt])=>`<li><span class="au-year">${y}</span><p>${t(txt)}</p></li>`).join('');
  const arrive=ARRIVE.map(([h,p])=>`<div><dt>${t(h)}</dt><dd>${t(p)}</dd></div>`).join('');
  const walk=WALK.map(([h,p])=>`<li><span>${t(h)}</span><span>${t(p)}</span></li>`).join('');
  const faq=FAQ.map(([q,a])=>`<details><summary>${t(q)}</summary><p>${t(a)}</p></details>`).join('');
  const step=(name,label,val,min,max)=>`<div class="au-step"><span id="au-l-${name}">${t(label)}</span><div role="group" aria-labelledby="au-l-${name}"><button type="button" data-step="${name}" data-d="-1" aria-label="${t(T.fewer)}: ${t(label)}">−</button><output data-v="${name}" aria-live="polite">${val}</output><button type="button" data-step="${name}" data-d="1" aria-label="${t(T.more)}: ${t(label)}">+</button></div></div>`;
  const keys=['aurea/court','aurea/alley','aurea/valley','aurea/terraces','aurea/bath','aurea/beams','aurea/walnut','aurea/window','aurea/breakfast'];
  const rooms=Object.fromEntries(ROOMS.map(r=>[r.id,{name:r.name,price:r.price,count:r.count,adults:r.adults,total:r.total}]));
  return `<div class="au">
<header class="au-top"><a class="au-word" href="#au-hero">Aurea</a><nav aria-label="Aurea">${nav}</nav></header>
<section class="au-hero" id="au-hero">
 <figure class="au-hero-img">${ctx.img('aurea/court',T.alt.court,{eager:true,sizes:'(min-width: 900px) 56vw, 100vw'})}</figure>
 <div class="au-hero-copy"><p class="au-place">Şəki</p><h1>${t(T.h1)}</h1><p class="au-lede">${t(T.lede)}</p>
  <p class="au-from">${t(T.from,{p:ctx.azn(140)})}</p><a class="au-btn" href="#au-stay">${t(T.heroCta)}</a></div>
</section>
<section class="au-house" id="au-house" aria-labelledby="au-house-h">
 <div class="au-col"><h2 id="au-house-h">${t(T.houseH)}</h2><ol class="au-timeline">${tl}</ol><p class="au-aside">${t(T.houseNote)}</p></div>
 <figure class="au-alley">${ctx.img('aurea/alley',T.alt.alley,{sizes:'(min-width: 900px) 34vw, 100vw'})}</figure>
</section>
<figure class="au-band">${ctx.img('aurea/valley',T.alt.valley,{sizes:'100vw'})}</figure>
<section class="au-rooms" id="au-rooms" aria-labelledby="au-rooms-h">
 <div class="au-col"><h2 id="au-rooms-h">${t(T.roomsH)}</h2><p>${t(T.roomsSub)}</p></div>
 <div class="au-stay-tool" id="au-stay">
  <div class="au-cal-wrap">
   <div class="au-cal-head"><h2>${t(T.stayH)}</h2><p>${t(T.staySub)}</p></div>
   <div class="au-cal-nav"><button type="button" data-month="-1" aria-label="${t(T.prev)}">‹</button><button type="button" data-month="1" aria-label="${t(T.next)}">›</button></div>
   <div class="au-cal" aria-label="${t(T.stayH)}"></div>
   <div class="au-picked"><p><span>${t(T.arrival)}</span><b data-p="start">—</b></p><p><span>${t(T.departure)}</span><b data-p="end">—</b></p><p><span>${t(T.nightsL)}</span><b data-p="nights" aria-live="polite">—</b></p><button type="button" class="au-clear">${t(T.clear)}</button></div>
   <p class="au-msg" role="status" aria-live="polite"></p>
   <div class="au-guests">${step('adults',T.adults,2)}${step('kids',T.kids,0)}</div>
  </div>
 </div>
 <div class="au-compare"><h3 class="au-compare-h">${t(T.compareH)}</h3><p class="au-compare-empty">${t(R.noDates)}</p>
  <table class="au-table"><thead><tr><th scope="col">${t(T.th.room)}</th><th scope="col">${t(T.th.size)}</th><th scope="col">${t(T.th.bed)}</th><th scope="col">${t(T.th.view)}</th><th scope="col">${t(T.th.bath)}</th><th scope="col">${t(T.th.sleeps)}</th><th scope="col">${t(T.th.night)}</th><th scope="col">${t(T.th.stay)}</th></tr></thead><tbody>${rows}</tbody></table></div>
 <div class="au-enquiry" id="au-enquiry" hidden>
  <form class="au-form" novalidate><h3>${t(T.enquiryH)}</h3><p class="au-sub">${t(T.enquirySub)}</p>
   <label class="au-field"><span>${t(T.lName)}</span><input name="name" autocomplete="name" maxlength="80" aria-describedby="au-e-name"><em class="au-err" id="au-e-name" hidden></em></label>
   <div class="au-two"><label class="au-field"><span>${t(T.lEmail)}</span><input name="email" type="email" autocomplete="email" aria-describedby="au-contact-hint au-e-email"><em class="au-err" id="au-e-email" hidden></em></label>
   <label class="au-field"><span>${t(T.lPhone)}</span><input name="phone" type="tel" autocomplete="tel" placeholder="+994 50 123 45 67" aria-describedby="au-contact-hint au-e-phone"><em class="au-err" id="au-e-phone" hidden></em></label></div>
   <p class="au-hint" id="au-contact-hint">${t(T.contactHint)}</p>
   <label class="au-field"><span>${t(T.lTime)}</span><select name="time">${T.times.map(x=>`<option>${t(x)}</option>`).join('')}</select></label>
   <fieldset class="au-transfer"><legend>${t(T.lTransfer)}</legend>
    <label><input type="radio" name="transfer" value="0" checked> ${t(T.tNone)}</label><label><input type="radio" name="transfer" value="50" data-tl="${t(T.tQab)}"> ${t(T.tQab)}</label><label><input type="radio" name="transfer" value="90" data-tl="${t(T.tGan)}"> ${t(T.tGan)}</label></fieldset>
   <label class="au-field"><span>${t(T.lMsg)}</span><textarea name="msg" rows="3" maxlength="500"></textarea></label>
   <button type="submit" class="au-btn">${t(T.send)}</button>
  </form>
  <aside class="au-sum" aria-labelledby="au-sum-h"><h3 id="au-sum-h">${t(T.sumH)}</h3><dl></dl></aside>
  <div class="au-done" hidden tabindex="-1" role="status"></div>
 </div>
</section>
<section class="au-arrive" id="au-arrive" aria-labelledby="au-arrive-h">
 <figure class="au-break">${ctx.img('aurea/breakfast',T.alt.breakfast,{sizes:'(min-width: 900px) 30vw, 100vw'})}</figure>
 <div class="au-col"><h2 id="au-arrive-h">${t(T.arriveH)}</h2><dl class="au-ledger">${arrive}</dl>
  <h3>${t(T.walkH)}</h3><ul class="au-walk">${walk}</ul></div>
</section>
<section class="au-faq" aria-labelledby="au-faq-h"><div class="au-col"><h2 id="au-faq-h">${t(T.faqH)}</h2>${faq}</div></section>
<footer class="au-foot"><figure>${ctx.img('aurea/terraces',T.alt.terraces,{sizes:'(min-width: 900px) 40vw, 100vw'})}</figure>
 <div><p class="au-word">Aurea</p><p>${t(T.addr)}</p><p>${t(T.reception)}</p>${ctx.credits(keys)}</div></footer>
${ctx.data({rooms,r:R,cal:cal(ctx),lang:ctx.lang,numLoc:ctx.locale})}
</div>`;
 }
};
