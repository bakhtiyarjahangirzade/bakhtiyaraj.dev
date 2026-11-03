// Olio — a wood-fire and olive-oil kitchen in Bakı. The menu is the story; the page is the table the paper sheets lie on.
import {L,esc} from '../kit.js';

// Dietary marks. Every dish lists the marks it carries; "nuts" is an allergen mark (filter excludes it).
const MARKS={
 v:{abbr:'V',name:L('Vegetarian','Вегетарианское','Vegetarian')},
 vg:{abbr:'VG',name:L('Vegan','Веганское','Vegan')},
 gf:{abbr:'GF',name:L('Glütensiz','Без глютена','Gluten-free')},
 n:{abbr:'N',name:L('Qoz-fındıq var','Содержит орехи','Contains nuts')}
};

const COURSES=[
 {id:'oven',name:L('Sobadan','Из печи','From the oven'),note:L('Soba 12:00 və 18:00-da yanır; çörək hər 40 dəqiqədən bir çıxır.','Печь разжигаем в 12:00 и 18:00; хлеб выходит каждые 40 минут.','The oven is lit at 12:00 and 18:00; bread comes out every 40 minutes.')},
 {id:'small',name:L('Kiçik boşqablar','Маленькие тарелки','Small plates'),note:L('Masa üçün iki-üç boşqab kifayətdir.','На двоих хватает двух-трёх тарелок.','Two or three plates are enough for two.')},
 {id:'fire',name:L('Közdə və sobada','На углях и в печи','Embers and oven'),note:L('Balıq günün ovuna görə dəyişə bilər.','Рыба может меняться в зависимости от улова.','Fish may change with the day’s catch.')},
 {id:'sweet',name:L('Şirin','Десерты','Sweet'),note:L('Desertlər qaymaqsız da verilir.','Десерты можно без каймака.','Desserts can be served without qaymaq.')}
];

const DISHES=[
 {id:'bread',c:'oven',img:'bread',price:6,g:'420 g',marks:['v','vg'],
  name:L('Odun sobası çörəyi, Abşeron zeytun yağı','Хлеб из дровяной печи, апшеронское оливковое масло','Wood-oven bread, Absheron olive oil'),
  desc:L('İki gün mayalanan xəmir, qabığı qalın, içi nəmli. Yanında soyuq sıxım yağ, kəklikotu və dəniz duzu.','Тесто бродит два дня: толстая корка, влажный мякиш. К нему масло холодного отжима, чабрец и морская соль.','Dough fermented for two days: a thick crust and a moist crumb. Served with cold-pressed oil, thyme and sea salt.'),
  ing:L('Şəmkir buğda unu, çovdar mayası, Abşeron zeytun yağı, dağ kəklikotu, duz','Шамкирская пшеничная мука, ржаная закваска, апшеронское оливковое масло, горный чабрец, соль','Shamkir wheat flour, rye starter, Absheron olive oil, mountain thyme, salt'),
  from:L('Un — Şəmkir; yağ — Abşeron zeytunluqları, noyabr sıxımı','Мука — Шамкир; масло — апшеронские оливковые рощи, ноябрьский отжим','Flour — Shamkir; oil — Absheron olive groves, November pressing'),
  allergens:L('Qlüten','Глютен','Gluten')},
 {id:'qutab',c:'oven',price:9,g:'3 ədəd',marks:['v'],
  name:L('Balqabaq qutabı, nar və sumaq','Кутабы с тыквой, гранат и сумах','Pumpkin qutab, pomegranate and sumac'),
  desc:L('Nazik xəmir saca yox, sobanın daş altına qoyulur. Balqabaq soğanla yavaş bişirilir.','Тонкое тесто печём не на садже, а на поду печи. Тыкву медленно томим с луком.','Thin dough baked on the oven floor instead of a saj. The pumpkin is slow-cooked with onion.'),
  ing:L('Balqabaq, soğan, kərə yağı, Göyçay narı, sumaq, buğda unu','Тыква, лук, сливочное масло, гёйчайский гранат, сумах, пшеничная мука','Pumpkin, onion, butter, Goychay pomegranate, sumac, wheat flour'),
  from:L('Nar — Göyçay; balqabaq — Xaçmaz','Гранат — Гёйчай; тыква — Хачмаз','Pomegranate — Goychay; pumpkin — Khachmaz'),
  allergens:L('Qlüten, süd','Глютен, молоко','Gluten, milk')},
 {id:'pide',c:'oven',price:13,g:'1 ədəd',marks:['v'],
  name:L('Açıq pide, motal pendiri, cəfəri','Открытый пиде, сыр мотал, петрушка','Open flatbread, motal cheese, parsley'),
  desc:L('Dəri tuluqda yetişən motal pendiri sobada əriyir; üstünə təzə cəfəri və limon qabığı.','Мотал, выдержанный в бурдюке, плавится в печи; сверху свежая петрушка и цедра лимона.','Motal, aged in a sheepskin, melts in the oven; finished with fresh parsley and lemon zest.'),
  ing:L('Buğda unu, motal pendiri, yumurta, cəfəri, Lənkəran limonu','Пшеничная мука, сыр мотал, яйцо, петрушка, ленкоранский лимон','Wheat flour, motal cheese, egg, parsley, Lankaran lemon'),
  from:L('Motal — Şamaxı yaylaları','Мотал — шамахинские яйлаги','Motal — Shamakhi summer pastures'),
  allergens:L('Qlüten, süd, yumurta','Глютен, молоко, яйцо','Gluten, milk, egg')},
 {id:'olives',c:'small',price:5,g:'150 g',marks:['v','vg','gf'],
  name:L('Zeytun, sitrus qabığı, rozmarin','Оливки, цитрусовая цедра, розмарин','Olives, citrus peel, rosemary'),
  desc:L('Bu ilin Abşeron zeytunu, Lənkəran limonu və portağalı qabığı ilə bir həftə saxlanılır.','Апшеронские оливки нового урожая неделю маринуются с цедрой ленкоранских лимонов и апельсинов.','This year’s Absheron olives, kept for a week with Lankaran lemon and orange peel.'),
  ing:L('Zeytun, limon və portağal qabığı, rozmarin, zeytun yağı','Оливки, цедра лимона и апельсина, розмарин, оливковое масло','Olives, lemon and orange peel, rosemary, olive oil'),
  from:L('Zeytun — Abşeron; sitrus — Lənkəran','Оливки — Апшерон; цитрусы — Ленкорань','Olives — Absheron; citrus — Lankaran'),
  allergens:L('Yoxdur','Нет','None')},
 {id:'sprat',c:'small',img:'sprat',price:11,g:'220 g',marks:['gf'],
  name:L('Közdə kilkə, limon, duzlu soğan','Килька на углях, лимон, маринованный лук','Ember-grilled sprats, lemon, pickled onion'),
  desc:L('Səhər Xəzərdən gələn kilkə bütöv, közün üstündə bir dəqiqə bişir. Barmaqla yeyilir.','Утренняя каспийская килька целиком, минута над углями. Едят руками.','Whole Caspian sprats from the morning boat, one minute over the embers. Eaten with fingers.'),
  ing:L('Xəzər kilkəsi, Lənkəran limonu, qırmızı soğan, sirkə, duz','Каспийская килька, ленкоранский лимон, красный лук, уксус, соль','Caspian sprats, Lankaran lemon, red onion, vinegar, salt'),
  from:L('Kilkə — Xəzər, Türkan balıqçıları','Килька — Каспий, рыбаки Тюркяна','Sprats — Caspian, Türkan fishermen'),
  allergens:L('Balıq','Рыба','Fish')},
 {id:'feijoa',c:'small',price:10,g:'240 g',marks:['v','gf','n'],
  name:L('Feyxoa, keçi pendiri, qovrulmuş fındıq','Фейхоа, козий сыр, жареный фундук','Feijoa, goat’s cheese, toasted hazelnuts'),
  desc:L('Lənkəran feyxoası yalnız oktyabr–dekabrda olur; turşməzə meyvə yumşaq pendirlə.','Ленкоранская фейхоа бывает только в октябре–декабре; кисло-сладкий фрукт с мягким сыром.','Lankaran feijoa is only around October to December; a sharp fruit with soft cheese.'),
  ing:L('Feyxoa, keçi pendiri, Zaqatala fındığı, bal, nanə','Фейхоа, козий сыр, закатальский фундук, мёд, мята','Feijoa, goat’s cheese, Zaqatala hazelnuts, honey, mint'),
  from:L('Feyxoa — Lənkəran; fındıq — Zaqatala','Фейхоа — Ленкорань; фундук — Закатала','Feijoa — Lankaran; hazelnuts — Zaqatala'),
  allergens:L('Süd, fındıq','Молоко, фундук','Milk, hazelnuts')},
 {id:'aubergine',c:'small',price:9,g:'200 g',marks:['v','vg','gf'],
  name:L('Közdə badımcan, nar turşusu','Баклажан на углях, гранатовый соус','Ember aubergine, pomegranate molasses'),
  desc:L('Badımcan qabığı qaralana qədər közdə qalır, içi qaşıqla götürülür, üstünə narşərab.','Баклажан держим на углях, пока не почернеет кожура; мякоть снимаем ложкой, сверху наршараб.','Aubergine left on the embers until the skin blackens; the flesh is spooned out and dressed with narsharab.'),
  ing:L('Badımcan, narşərab, sarımsaq, reyhan, zeytun yağı','Баклажан, наршараб, чеснок, рейхан, оливковое масло','Aubergine, narsharab, garlic, purple basil, olive oil'),
  from:L('Narşərab — Göyçay','Наршараб — Гёйчай','Narsharab — Goychay'),
  allergens:L('Yoxdur','Нет','None')},
 {id:'kutum',c:'fire',img:'kutum',price:34,g:'≈700 g',marks:['gf'],
  name:L('Bütöv kütüm, nar, sumaq, kök salatı','Кутум целиком, гранат, сумах, салат из моркови','Whole kutum, pomegranate, sumac, carrot salad'),
  desc:L('Kütüm sobanın ağzında bütöv bişir; yanında sumaqlı kök və nazik dilimlənmiş limon. İki nəfərlikdir.','Кутум целиком запекаем у устья печи; к нему морковь с сумахом и тонкий лимон. На двоих.','Kutum roasted whole at the mouth of the oven, with sumac carrots and thin lemon. For two.'),
  ing:L('Kütüm, kök, sumaq, nar, limon, cəfəri','Кутум, морковь, сумах, гранат, лимон, петрушка','Kutum, carrot, sumac, pomegranate, lemon, parsley'),
  from:L('Kütüm — Kür mənsəbi, Neftçala','Кутум — устье Куры, Нефтчала','Kutum — Kura estuary, Neftchala'),
  allergens:L('Balıq','Рыба','Fish')},
 {id:'lamb',c:'fire',price:29,g:'350 g',marks:['gf'],
  name:L('Quzu qabırğası, Quba alması, soğan','Бараньи рёбра, кубинские яблоки, лук','Lamb ribs, Quba apples, onion'),
  desc:L('Qabırğa gecə boyu sobanın qalıq istisində bişir, xidmətdən əvvəl közdə qızardılır.','Рёбра всю ночь томятся в остаточном жаре печи, перед подачей обжариваем на углях.','Ribs cooked overnight in the oven’s falling heat, then crisped over embers before service.'),
  ing:L('Quzu qabırğası, Quba alması, soğan, istiot, duz','Бараньи рёбра, кубинские яблоки, лук, перец, соль','Lamb ribs, Quba apples, onion, pepper, salt'),
  from:L('Quzu — Qəbələ; alma — Quba','Баранина — Габала; яблоки — Губа','Lamb — Qabala; apples — Quba'),
  allergens:L('Yoxdur','Нет','None')},
 {id:'chicken',c:'fire',price:22,g:'½ toyuq',marks:['gf'],
  name:L('Sobada toyuq, Lənkəran limonu, sarımsaq','Цыплёнок из печи, ленкоранский лимон, чеснок','Oven chicken, Lankaran lemon, garlic'),
  desc:L('Yarım kənd toyuğu limon və bütöv sarımsaqla çuqun qabda.','Половина деревенского цыплёнка с лимоном и целыми зубчиками чеснока в чугунке.','Half a farm chicken with lemon and whole garlic cloves in cast iron.'),
  ing:L('Toyuq, limon, sarımsaq, kəklikotu, kərə yağı','Курица, лимон, чеснок, чабрец, сливочное масло','Chicken, lemon, garlic, thyme, butter'),
  from:L('Toyuq — Masallı; limon — Lənkəran','Курица — Масаллы; лимон — Ленкорань','Chicken — Masally; lemon — Lankaran'),
  allergens:L('Süd','Молоко','Milk')},
 {id:'barley',c:'fire',price:17,g:'300 g',marks:['v','n'],
  name:L('Arpa, meşə göbələyi, şabalıd','Перловка, лесные грибы, каштан','Pearl barley, wild mushrooms, chestnut'),
  desc:L('Kərə yağında bişən arpa, Qəbələ meşəsinin göbələyi və qovrulmuş Zaqatala şabalıdı.','Перловка на сливочном масле, грибы из габалинского леса и печёные закатальские каштаны.','Barley cooked in butter with mushrooms from the Qabala woods and roasted Zaqatala chestnuts.'),
  ing:L('Arpa, göbələk, şabalıd, kərə yağı, pendir','Перловка, грибы, каштан, сливочное масло, сыр','Barley, mushrooms, chestnut, butter, cheese'),
  from:L('Göbələk — Qəbələ; şabalıd — Zaqatala','Грибы — Габала; каштаны — Закатала','Mushrooms — Qabala; chestnuts — Zaqatala'),
  allergens:L('Qlüten, süd, şabalıd','Глютен, молоко, каштан','Gluten, milk, chestnut')},
 {id:'quince',c:'sweet',price:8,g:'1 ədəd',marks:['v','gf'],
  name:L('Sobada heyva, qaymaq','Печёная айва, каймак','Baked quince, qaymaq'),
  desc:L('Heyva şəkər siropunda üç saat bişir, qırmızı rəng alır.','Айва три часа томится в сиропе и становится красной.','Quince cooked in syrup for three hours until it turns red.'),
  ing:L('Heyva, şəkər, mixək, qaymaq','Айва, сахар, гвоздика, каймак','Quince, sugar, clove, qaymaq'),
  from:L('Heyva — Quba','Айва — Губа','Quince — Quba'),
  allergens:L('Süd','Молоко','Milk')},
 {id:'tiramisu',c:'sweet',img:'tiramisu',price:9,g:'160 g',marks:['v'],
  name:L('Lənkəran çayı ilə tiramisu','Тирамису с ленкоранским чаем','Tiramisu with Lankaran tea'),
  desc:L('Qəhvə əvəzinə dəmli qara çay; üstündə kakao.','Вместо кофе крепкий чёрный чай; сверху какао.','Strong black tea instead of coffee; cocoa on top.'),
  ing:L('Maskarpone, yumurta, savoyardi, Lənkəran qara çayı, kakao','Маскарпоне, яйцо, савоярди, ленкоранский чёрный чай, какао','Mascarpone, egg, savoiardi, Lankaran black tea, cocoa'),
  from:L('Çay — Lənkəran','Чай — Ленкорань','Tea — Lankaran'),
  allergens:L('Qlüten, süd, yumurta','Глютен, молоко, яйцо','Gluten, milk, egg')},
 {id:'persimmon',c:'sweet',price:7,g:'2 top',marks:['v','vg','gf'],
  name:L('Xurma sorbeti','Сорбет из хурмы','Persimmon sorbet'),
  desc:L('Yalnız yetişmiş Lənkəran xurması və bir az limon.','Только спелая ленкоранская хурма и немного лимона.','Only ripe Lankaran persimmon and a little lemon.'),
  ing:L('Xurma, şəkər, limon','Хурма, сахар, лимон','Persimmon, sugar, lemon'),
  from:L('Xurma — Lənkəran','Хурма — Ленкорань','Persimmon — Lankaran'),
  allergens:L('Yoxdur','Нет','None')}
];

// Producers and their seasons (months 1-12) — drawn as a 12-month table, current month highlighted.
const SEASONS=[
 {what:L('Zeytun və yağ','Оливки и масло','Olives and oil'),where:L('Abşeron','Апшерон','Absheron'),m:[10,11]},
 {what:L('Limon, portağal','Лимоны, апельсины','Lemons, oranges'),where:L('Lənkəran','Ленкорань','Lankaran'),m:[11,12,1,2,3]},
 {what:L('Feyxoa','Фейхоа','Feijoa'),where:L('Lənkəran','Ленкорань','Lankaran'),m:[10,11,12]},
 {what:L('Nar','Гранат','Pomegranate'),where:L('Göyçay','Гёйчай','Goychay'),m:[10,11,12,1]},
 {what:L('Alma, heyva','Яблоки, айва','Apples, quince'),where:L('Quba','Губа','Quba'),m:[9,10,11,12,1,2]},
 {what:L('Fındıq, şabalıd','Фундук, каштаны','Hazelnuts, chestnuts'),where:L('Zaqatala','Закатала','Zaqatala'),m:[8,9,10,11]},
 {what:L('Kütüm','Кутум','Kutum'),where:L('Kür mənsəbi','Устье Куры','Kura estuary'),m:[10,11,12,1,2,3,4]},
 {what:L('Kilkə','Килька','Sprats'),where:L('Xəzər','Каспий','Caspian'),m:[3,4,5,9,10,11]}
];

const SEATS=[
 {id:'hall',name:L('Zal','Зал','Dining room'),cap:L('32 yer, 8 masa','32 места, 8 столов','32 seats, 8 tables'),
  text:L('Daş divarlar, sobaya baxan uzun masa. Uşaq oturacağı var.','Каменные стены, длинный стол с видом на печь. Есть детские стулья.','Stone walls and a long table facing the oven. High chairs available.')},
 {id:'terrace',name:L('Terras','Терраса','Terrace'),cap:L('16 yer, isidilir','16 мест, с обогревом','16 seats, heated'),
  text:L('Noyabrdan martadək örtülü və isidilir. Siqaret çəkmək olmaz.','С ноября по март крытая и с обогревом. Не курят.','Covered and heated from November to March. No smoking.')},
 {id:'bar',name:L('Soba barı','Бар у печи','Oven bar'),cap:L('8 stul, 1–3 nəfər','8 стульев, 1–3 гостя','8 stools, parties of 1–3'),
  text:L('Aşpazların qabağında. Kiçik qruplar üçün; 4 nəfərdən çox oturmur.','Прямо перед поварами. Для небольших компаний, больше трёх не садим.','Right in front of the cooks. For small parties; no more than three.')}
];

const FAQ=[
 [L('Masasız gəlmək olar?','Можно прийти без брони?','Can we walk in?'),L('Bəli, barın yarısı və terrasın iki masası gələnlər üçün saxlanılır. Cümə–şənbə axşamı 19:00-dan sonra gözləmə 20–40 dəqiqə olur.','Да, половина бара и два стола на террасе остаются для тех, кто без брони. В пятницу и субботу после 19:00 ожидание 20–40 минут.','Yes: half of the bar and two terrace tables are kept for walk-ins. On Friday and Saturday after 19:00 the wait is 20–40 minutes.')],
 [L('Allergiyam var. Nə etməliyəm?','У меня аллергия. Что делать?','I have an allergy. What should I do?'),L('Sorğunun qeydində yazın və gələndə ofisianta deyin. Fındıq və şabalıd eyni mətbəxdə işlənir, ona görə tam təmiz mühitə zəmanət vermirik.','Напишите в комментарии к заявке и скажите официанту. Фундук и каштаны обрабатываются на той же кухне, полностью исключить следы мы не можем.','Write it in the request note and tell your waiter. Hazelnuts and chestnuts are handled in the same kitchen, so we cannot guarantee a trace-free plate.')],
 [L('Uşaqlarla gəlmək olar?','Можно с детьми?','Can we bring children?'),L('Bəli, zalda və terrasda. Uşaqlar üçün yarım porsiya çörək, toyuq və arpa veririk.','Да, в зале и на террасе. Для детей делаем половинные порции хлеба, курицы и перловки.','Yes, in the dining room and on the terrace. We serve half portions of the bread, chicken and barley.')],
 [L('Sorğu göndərdim, masa təsdiqdir?','Я отправил заявку — стол подтверждён?','I sent a request — is the table confirmed?'),L('Xeyr, sorğu təsdiq deyil. Bir saat ərzində zəng edib və ya mesaj yazıb təsdiqləyirik.','Нет, заявка — это ещё не подтверждение. Мы перезваниваем или пишем в течение часа.','No, a request is not a confirmation. We call or message you within an hour to confirm.')],
 [L('Xidmət haqqı var?','Есть ли плата за обслуживание?','Is there a service charge?'),L('Menyudakı qiymətlərə hər şey daxildir. 8 nəfərdən böyük masalara 10% xidmət əlavə olunur.','Цены в меню окончательные. Для столов больше 8 гостей добавляется 10% за обслуживание.','Menu prices are final. Tables of more than 8 have 10% service added.')]
];

const HOURS=[
 [L('Bazar ertəsi','Понедельник','Monday'),L('Bağlıdır','Закрыто','Closed')],
 [L('Çərşənbə axşamı – cümə','Вторник – пятница','Tuesday – Friday'),L('12:00–15:00, 18:00–23:00','12:00–15:00, 18:00–23:00','12:00–15:00, 18:00–23:00')],
 [L('Şənbə, bazar','Суббота, воскресенье','Saturday, Sunday'),L('12:00–23:00, mətbəx 22:15-dək','12:00–23:00, кухня до 22:15','12:00–23:00, kitchen until 22:15')]
];

const T={
 nav:[['menu',L('Menyu','Меню','Menu')],['season',L('Mənşə','Происхождение','Producers')],['seats',L('Məkan','Зал','The room')],['book',L('Masa sorğusu','Заявка на стол','Request a table')]],
 lede:L('Odun sobası, zeytun yağı və Xəzər sahilinin məhsulları. Rəsul Rza küçəsində, köhnə çörəkxananın yerində.','Дровяная печь, оливковое масло и продукты каспийского побережья. На улице Расула Рзы, на месте старой пекарни.','A wood oven, olive oil and produce from the Caspian coast. On Rasul Rza street, where an old bakery used to be.'),
 tonightH:L('Bu axşam','Сегодня вечером','Tonight'),
 tonight:[
  L('Soba 18:00-da yanır, ilk çörək 18:40-da','Печь разжигаем в 18:00, первый хлеб в 18:40','Oven lit at 18:00, first bread at 18:40'),
  L('Kütüm: Neftçaladan 6 balıq gəlib','Кутум: из Нефтчалы пришло 6 рыб','Kutum: six fish in from Neftchala'),
  L('Feyxoa mövsümü davam edir','Сезон фейхоа продолжается','Feijoa season continues')],
 menuH:L('Noyabr menyusu','Ноябрьское меню','November menu'),
 menuSub:L('Qiymətlər manatla, ƏDV daxil. Menyu ayda bir dəyişir; balıq gündəlik.','Цены в манатах, с НДС. Меню меняется раз в месяц, рыба — каждый день.','Prices in manat, VAT included. The menu changes monthly; the fish daily.'),
 filterLabel:L('Pəhriz','Питание','Diet'),
 fV:L('Vegetarian','Вегетарианское','Vegetarian'),fGF:L('Glütensiz','Без глютена','Gluten-free'),fN:L('Qoz-fındıqsız','Без орехов','No nuts'),
 openDish:L('Yeməyin təfərrüatı','Подробнее о блюде','Dish details'),
 detailHint:L('Tərkibi, mənşəyi və allergenləri görmək üçün yeməyə toxunun.','Нажмите на блюдо, чтобы увидеть состав, происхождение и аллергены.','Tap a dish to see what is in it, where it comes from and its allergens.'),
 seasonH:L('Haradan gəlir','Откуда продукты','Where it comes from'),
 seasonSub:L('Mətbəxə məhsul verən yeddi yer və onların mövsümü. Bu ayın sütunu işarələnib.','Семь мест, откуда приходят продукты, и их сезон. Текущий месяц отмечен.','Seven places that supply the kitchen and their seasons. This month’s column is marked.'),
 product:L('Məhsul','Продукт','Product'),region:L('Yer','Место','Place'),
 inSeason:L('mövsümdür','в сезоне','in season'),
 seatsH:L('Harada oturmaq','Где сесть','Where to sit'),
 privH:L('Soba otağı — 10–18 nəfər','Комната у печи — 10–18 гостей','The oven room — 10 to 18 guests'),
 priv:L('Ayrıca otaq, bütün masa üçün ortaq menyu: çörək, dörd kiçik boşqab, bütöv balıq və ya quzu, desert. Nəfər başına 85 AZN, içkilər ayrıca. Ən azı 5 gün əvvəl yazın.','Отдельная комната и общий сет на весь стол: хлеб, четыре маленькие тарелки, рыба целиком или баранина, десерт. 85 AZN с человека, напитки отдельно. Пишите минимум за 5 дней.','A separate room with one shared menu for the table: bread, four small plates, a whole fish or lamb, dessert. 85 AZN per person, drinks extra. Write at least five days ahead.'),
 privCta:L('Böyük masa üçün yazın','Написать о большом столе','Ask about a large table'),
 bookH:L('Masa sorğusu','Заявка на стол','Request a table'),
 bookSub:L('Bu, sorğudur: bir saat ərzində zəng edib təsdiqləyirik. 8 nəfərdən çox qonaq üçün soba otağına baxın.','Это заявка: мы перезвоним в течение часа и подтвердим. Для компаний больше 8 человек — комната у печи.','This is a request: we call within an hour to confirm. For more than 8 guests see the oven room.'),
 lDate:L('Tarix','Дата','Date'),lTime:L('Vaxt','Время','Time'),lParty:L('Qonaq sayı','Сколько гостей','Guests'),lSeat:L('Yer','Место','Seating'),
 lName:L('Ad','Имя','Name'),lPhone:L('Telefon','Телефон','Phone'),lNote:L('Qeyd (allergiya, uşaq oturacağı, ad günü)','Комментарий (аллергия, детский стул, день рождения)','Note (allergy, high chair, birthday)'),
 phoneHint:L('Məsələn, 050 123 45 67','Например, 050 123 45 67','For example, 050 123 45 67'),
 less:L('Bir nəfər az','На одного меньше','One fewer'),more:L('Bir nəfər çox','На одного больше','One more'),
 send:L('Sorğu göndər','Отправить заявку','Send request'),
 summary:L('Sorğunuz','Ваша заявка','Your request'),
 addrH:L('Ünvan və saatlar','Адрес и часы','Address and hours'),
 addr:L('Rəsul Rza küçəsi 14, Bakı. «Sahil» metrosundan 7 dəqiqə piyada.','Улица Расула Рзы 14, Баку. 7 минут пешком от метро «Сахиль».','14 Rasul Rza street, Baku. A 7-minute walk from Sahil metro.'),
 phone:L('Telefon: +994 12 555 01 23 (nümunə nömrə)','Телефон: +994 12 555 01 23 (номер-пример)','Phone: +994 12 555 01 23 (sample number)'),
 faqH:L('Tez-tez soruşulanlar','Частые вопросы','Questions we get'),
 kitchen:L('Mətbəx','Кухня','Kitchen'),
 alt:{
  oil:L('Ağ boşqabda kəklikotu ilə zeytun yağı, arxada yağ şüşəsi','Оливковое масло с чабрецом в белой тарелке, за ней бутылка масла','Olive oil with thyme in a white dish, a bottle of oil behind'),
  room:L('Daş divarlı, taxta tirli zal, uzun masalar','Зал с каменными стенами, деревянными балками и длинными столами','Dining room with stone walls, wooden beams and long tables'),
  prep:L('Mətbəxdə hazırlanmış məhsullar: portağal, kök, soğan, ət','Заготовки на кухне: апельсин, морковь, лук, мясо','Prepared ingredients in the kitchen: orange, carrot, onion, meat'),
  lamp:L('Axşam qaranlıq zalda masanın üstündə şüşə lampa','Стеклянная лампа на столе в вечернем зале','A glass lamp on a table in the evening room')
 }
};

const R={ // runtime strings (app.js)
 closed:L('Bazar ertəsi bağlıyıq','По понедельникам закрыто','Closed on Mondays'),
 today:L('bu gün','сегодня','today'),
 left:L('{n} masa','{n} стола','{n} tables'),
 full:L('Dolu','Занято','Full'),
 pickDate:L('Əvvəlcə tarix seçin.','Сначала выберите дату.','Choose a date first.'),
 pickTime:L('Vaxt seçin.','Выберите время.','Choose a time.'),
 barLimit:L('Soba barında ən çox 3 nəfər otururuq. Zal və ya terras seçin.','У печи сажаем не больше трёх. Выберите зал или террасу.','The oven bar takes up to 3 guests. Choose the dining room or terrace.'),
 bigParty:L('9 və daha çox qonaq üçün soba otağı — aşağıdakı keçidə baxın.','Для 9 и более гостей — комната у печи, ссылка ниже.','For 9 or more guests use the oven room — see the link below.'),
 nameErr:L('Adınızı yazın — masanı bu adla saxlayırıq.','Напишите имя — стол будет записан на него.','Write your name — the table is held under it.'),
 phoneErr:L('Nömrə 0XX XXX XX XX şəklində olmalıdır (məsələn, 050 123 45 67).','Номер в формате 0XX XXX XX XX (например, 050 123 45 67).','Use the 0XX XXX XX XX format (for example, 050 123 45 67).'),
 fix:L('Sorğunu göndərmək üçün işarələnmiş xanaları düzəldin.','Исправьте отмеченные поля, чтобы отправить заявку.','Fix the marked fields to send the request.'),
 guests:L('{n} nəfər','{n} гостей','{n} guests'),
 guest1:L('1 nəfər','1 гость','1 guest'),
 none:L('—','—','—'),
 doneH:L('Sorğu qeydə alındı','Заявка записана','Request noted'),
 done:L('{name}, {date} saat {time} üçün {party} — {seat}. Sorğu nömrəsi {code}.','{name}, {date} в {time}, {party} — {seat}. Номер заявки {code}.','{name}, {date} at {time}, {party} — {seat}. Request number {code}.'),
 demo:L('Bu konsept nümunəsidir: sorğu heç yerə göndərilmədi və heç kim zəng etməyəcək.','Это концепт: заявка никуда не отправлена, и никто не перезвонит.','This is a concept: the request was not sent anywhere and nobody will call.'),
 again:L('Yeni sorğu','Новая заявка','New request'),
 empty:L('Bu seçimə uyğun yemək yoxdur. Bir filtri söndürün.','Под этот выбор блюд нет. Снимите один из фильтров.','No dishes match this choice. Turn one filter off.'),
 count:L('{n} / {all} yemək','{n} из {all} блюд','{n} of {all} dishes'),
 ing:L('Tərkibi','Состав','Ingredients'),from:L('Mənşəyi','Происхождение','Provenance'),allergens:L('Allergenlər','Аллергены','Allergens'),portion:L('Porsiya','Порция','Portion'),
 close:L('Bağla','Закрыть','Close'),
 lunch:L('Nahar','Обед','Lunch'),dinner:L('Şam yeməyi','Ужин','Dinner'),
 privLink:L('Soba otağı','Комната у печи','The oven room')
};

// Browsers may lack Azerbaijani calendar data, so day and month names are resolved at build time.
const cal=ctx=>({wd:[0,1,2,3,4,5,6].map(i=>ctx.date(new Date(2026,10,1+i),{weekday:'short'})),wdl:[0,1,2,3,4,5,6].map(i=>ctx.date(new Date(2026,10,1+i),{weekday:'long'})),
 mon:Array.from({length:12},(_,m)=>ctx.date(new Date(2026,m,15),{month:'short'}).replace('.','')),monl:Array.from({length:12},(_,m)=>ctx.date(new Date(2026,m,15),{day:'numeric',month:'long'}).replace(/^\d+\s*/,''))});
const leader=(ctx,d)=>{
 const marks=d.marks.map(m=>`<abbr title="${ctx.t(MARKS[m].name)}">${MARKS[m].abbr}</abbr>`).join('');
 return `<li class="ol-dish" data-id="${d.id}" data-marks="${d.marks.join(' ')}"><button type="button" class="ol-dish-btn" aria-controls="ol-detail" aria-expanded="false"><span class="ol-dish-name">${ctx.t(d.name)}</span><span class="ol-dots" aria-hidden="true"></span><span class="ol-price">${ctx.num(d.price)}</span></button><span class="ol-marks">${marks}</span></li>`;
};

export default {
 id:'olio',brand:'Olio',kind:'site',
 render(ctx){
  const t=ctx.t;
  const months=Array.from({length:12},(_,i)=>ctx.date(new Date(2026,i,15),{month:'short'}).replace('.',''));
  const nav=T.nav.map(([id,l])=>`<a href="#ol-${id}">${t(l)}</a>`).join('');
  const menu=COURSES.map(c=>`<section class="ol-course" aria-labelledby="ol-c-${c.id}"><h3 id="ol-c-${c.id}">${t(c.name)}</h3><p class="ol-course-note">${t(c.note)}</p><ul>${DISHES.filter(d=>d.c===c.id).map(d=>leader(ctx,d)).join('')}</ul></section>`).join('');
  const legend=Object.values(MARKS).map(m=>`<li><abbr>${m.abbr}</abbr> ${t(m.name)}</li>`).join('');
  const season=`<table class="ol-season"><caption class="sr-only">${t(T.seasonH)}</caption><thead><tr><th scope="col">${t(T.product)}</th><th scope="col">${t(T.region)}</th>${months.map((m,i)=>`<th scope="col" class="ol-m" data-m="${i+1}">${esc(m)}</th>`).join('')}</tr></thead><tbody>${SEASONS.map(s=>`<tr><th scope="row">${t(s.what)}</th><td>${t(s.where)}</td>${months.map((m,i)=>`<td class="ol-m${s.m.includes(i+1)?' on':''}" data-m="${i+1}">${s.m.includes(i+1)?`<span class="sr-only">${t(T.inSeason)}</span>`:''}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const seats=SEATS.map(s=>`<li><h3>${t(s.name)}</h3><p class="ol-cap">${t(s.cap)}</p><p>${t(s.text)}</p></li>`).join('');
  const hours=HOURS.map(([d,h])=>`<div><dt>${t(d)}</dt><dd>${t(h)}</dd></div>`).join('');
  const faq=FAQ.map(([q,a])=>`<details><summary>${t(q)}</summary><p>${t(a)}</p></details>`).join('');
  const seatRadios=SEATS.map((s,i)=>`<label class="ol-seat"><input type="radio" name="seat" value="${s.id}"${i===0?' checked':''}><span>${t(s.name)}</span><small>${t(s.cap)}</small></label>`).join('');
  const keys=['olio/oil','olio/bread','olio/sprat','olio/kutum','olio/prep','olio/room','olio/lamp','olio/tiramisu'];
  const dishData=Object.fromEntries(DISHES.map(d=>[d.id,{name:d.name,desc:d.desc,ing:d.ing,from:d.from,allergens:d.allergens,price:ctx.azn(d.price),g:d.g,marks:d.marks.map(m=>MARKS[m].name),img:d.img?ctx.img(`olio/${d.img}`,d.name,{sizes:'(min-width: 1000px) 380px, 90vw'}):''}]));
  const seatNames=Object.fromEntries(SEATS.map(s=>[s.id,s.name]));
  return `<div class="ol">
<header class="ol-top"><a class="ol-word" href="#ol-hero">Olio</a><nav aria-label="Olio">${nav}</nav></header>
<section class="ol-hero" id="ol-hero">
 <figure class="ol-hero-img">${ctx.img('olio/oil',T.alt.oil,{eager:true,sizes:'(min-width: 900px) 62vw, 100vw'})}</figure>
 <div class="ol-hero-copy"><h1>Olio</h1><p class="ol-lede">${t(T.lede)}</p><a class="ol-btn" href="#ol-book">${t(T.bookH)}</a></div>
 <aside class="ol-slip" aria-labelledby="ol-tonight"><h2 id="ol-tonight">${t(T.tonightH)}</h2><ul>${T.tonight.map(x=>`<li>${t(x)}</li>`).join('')}</ul><p class="ol-slip-hours" data-hours>${t(HOURS[1][1])}</p></aside>
</section>
<section class="ol-sheet ol-menu" id="ol-menu" aria-labelledby="ol-menu-h">
 <div class="ol-menu-head"><div><h2 id="ol-menu-h">${t(T.menuH)}</h2><p>${t(T.menuSub)}</p></div>
  <fieldset class="ol-filter"><legend>${t(T.filterLabel)}</legend>
   <label><input type="checkbox" value="v"> ${t(T.fV)}</label><label><input type="checkbox" value="gf"> ${t(T.fGF)}</label><label><input type="checkbox" value="nonuts"> ${t(T.fN)}</label>
   <output class="ol-count" aria-live="polite"></output></fieldset></div>
 <div class="ol-menu-body"><div class="ol-courses">${menu}<p class="ol-empty" hidden role="status"></p><ul class="ol-legend">${legend}</ul></div>
  <aside class="ol-detail" id="ol-detail" aria-live="polite" tabindex="-1"><p class="ol-detail-hint">${t(T.detailHint)}</p></aside></div>
</section>
<section class="ol-season-wrap" id="ol-season" aria-labelledby="ol-season-h">
 <div class="ol-season-text"><h2 id="ol-season-h">${t(T.seasonH)}</h2><p>${t(T.seasonSub)}</p></div>
 <figure class="ol-prep">${ctx.img('olio/prep',T.alt.prep,{sizes:'(min-width: 900px) 40vw, 100vw'})}</figure>
 <div class="ol-sheet ol-season-sheet"><div class="ol-scroll" tabindex="0" role="region" aria-labelledby="ol-season-h">${season}</div></div>
</section>
<section class="ol-seats" id="ol-seats" aria-labelledby="ol-seats-h">
 <figure class="ol-room">${ctx.img('olio/room',T.alt.room,{sizes:'(min-width: 900px) 55vw, 100vw'})}</figure>
 <div class="ol-seats-copy"><h2 id="ol-seats-h">${t(T.seatsH)}</h2><ul>${seats}</ul>
  <div class="ol-private" id="ol-private"><h3>${t(T.privH)}</h3><p>${t(T.priv)}</p><a class="ol-link" href="#ol-visit">${t(T.privCta)}</a></div></div>
</section>
<section class="ol-book" id="ol-book" aria-labelledby="ol-book-h">
 <div class="ol-sheet ol-chit">
  <form class="ol-form" novalidate>
   <h2 id="ol-book-h">${t(T.bookH)}</h2><p class="ol-book-sub">${t(T.bookSub)}</p>
   <fieldset class="ol-dates"><legend>${t(T.lDate)}</legend><div class="ol-daystrip" role="radiogroup" aria-label="${t(T.lDate)}"></div><p class="ol-err" data-err="date" hidden></p></fieldset>
   <fieldset class="ol-times"><legend>${t(T.lTime)}</legend><div class="ol-slots"><p class="ol-muted" data-slot-empty></p></div><p class="ol-err" data-err="time" hidden></p></fieldset>
   <div class="ol-row">
    <fieldset class="ol-party"><legend>${t(T.lParty)}</legend><div class="ol-stepper"><button type="button" data-step="-1" aria-label="${t(T.less)}">−</button><output data-party aria-live="polite">2</output><button type="button" data-step="1" aria-label="${t(T.more)}">+</button></div></fieldset>
    <fieldset class="ol-seatset"><legend>${t(T.lSeat)}</legend><div class="ol-seats-pick">${seatRadios}</div></fieldset>
   </div>
   <p class="ol-err" data-err="party" hidden></p>
   <div class="ol-row ol-fields">
    <label class="ol-field"><span>${t(T.lName)}</span><input name="name" autocomplete="name" maxlength="60" aria-describedby="ol-err-name"><span class="ol-err" id="ol-err-name" data-err="name" hidden></span></label>
    <label class="ol-field"><span>${t(T.lPhone)}</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="050 123 45 67" aria-describedby="ol-phone-hint ol-err-phone"><small id="ol-phone-hint">${t(T.phoneHint)}</small><span class="ol-err" id="ol-err-phone" data-err="phone" hidden></span></label>
   </div>
   <label class="ol-field"><span>${t(T.lNote)}</span><textarea name="note" rows="2" maxlength="300"></textarea></label>
   <p class="ol-err ol-formerr" data-err="form" role="alert" hidden></p>
   <button class="ol-btn ol-send" type="submit">${t(T.send)}</button>
  </form>
  <aside class="ol-stub" aria-labelledby="ol-stub-h"><h3 id="ol-stub-h">${t(T.summary)}</h3><dl><div><dt>${t(T.lDate)}</dt><dd data-s="date">—</dd></div><div><dt>${t(T.lTime)}</dt><dd data-s="time">—</dd></div><div><dt>${t(T.lParty)}</dt><dd data-s="party">—</dd></div><div><dt>${t(T.lSeat)}</dt><dd data-s="seat">—</dd></div></dl></aside>
  <div class="ol-done" hidden tabindex="-1" role="status"></div>
 </div>
</section>
<section class="ol-faq" aria-labelledby="ol-faq-h"><h2 id="ol-faq-h">${t(T.faqH)}</h2>${faq}</section>
<footer class="ol-foot" id="ol-visit">
 <figure class="ol-lamp">${ctx.img('olio/lamp',T.alt.lamp,{sizes:'(min-width: 900px) 30vw, 100vw'})}</figure>
 <div><h2>${t(T.addrH)}</h2><p>${t(T.addr)}</p><p>${t(T.phone)}</p><dl class="ol-hours">${hours}</dl>${ctx.credits(keys)}</div>
</footer>
${ctx.data({dishes:dishData,seats:seatNames,r:R,lang:ctx.lang,cal:cal(ctx)})}
</div>`;
 }
};
