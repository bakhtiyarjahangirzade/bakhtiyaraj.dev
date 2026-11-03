// Bir Süfrə — community kitchens in Bakı. Blunt type, produce from the crate, and arithmetic instead of slogans.
import {L} from '../kit.js';

const cal=ctx=>({wd:[0,1,2,3,4,5,6].map(i=>ctx.date(new Date(2026,10,1+i),{weekday:'short'})),
 wdl:[0,1,2,3,4,5,6].map(i=>ctx.date(new Date(2026,10,1+i),{weekday:'long'})),
 mong:Array.from({length:12},(_,m)=>ctx.date(new Date(2026,m,15),{day:'numeric',month:'long'}).replace(/^\d+\s*/,''))});

// One food box — sample wholesale prices, November 2026. Sum = 32.00 AZN.
const BOX=[
 [L('Düyü','Рис','Rice'),'2 kg',4.6],
 [L('Günəbaxan yağı','Подсолнечное масло','Sunflower oil'),'1 l',3.6],
 [L('Qara çay','Чёрный чай','Black tea'),'250 g',3.2],
 [L('Pomidor pastası','Томатная паста','Tomato paste'),'700 g',2.8],
 [L('Kartof','Картофель','Potatoes'),'3 kg',2.7],
 [L('Mərci','Чечевица','Lentils'),'1 kg',2.4],
 [L('Qarabaşaq','Гречка','Buckwheat'),'1 kg',2.4],
 [L('Un','Мука','Flour'),'2 kg',2.2],
 [L('Makaron','Макароны','Pasta'),'1 kg',1.9],
 [L('Şəkər','Сахар','Sugar'),'1 kg',1.7],
 [L('Soğan','Лук','Onions'),'2 kg',1.6],
 [L('Kələm','Капуста','Cabbage'),L('1 baş','1 кочан','1 head'),0.9],
 [L('Qutu və çatdırılma','Коробка и доставка','Box and delivery'),'',2.0]
];
const BOX_COST=32,MEAL_COST=2.4;
const MEAL=[
 [L('Ərzaq','Продукты','Food'),1.55],
 [L('Qaz və elektrik','Газ и электричество','Gas and power'),0.30],
 [L('Birdəfəlik qab','Одноразовая посуда','Container'),0.25],
 [L('Daşıma','Доставка','Transport'),0.30]
];

const STEPS=[
 [L('Bazar ertəsi alırıq','В понедельник закупаем','Monday: we buy'),L('Ərzaq topdan bazardan, tərəvəz Xaçmaz və Quba fermerlərindən birbaşa alınır. Hər qəbz saxlanılır.','Продукты закупаем на оптовом рынке, овощи — напрямую у фермеров Хачмаза и Губы. Каждый чек сохраняется.','Staples come from the wholesale market, vegetables straight from farmers in Khachmaz and Quba. Every receipt is kept.')],
 [L('Səhər bişiririk','Утром готовим','Mornings: we cook'),L('Üç mətbəxdə könüllülər 09:00-dan doğrayır; aşpaz menyunu həftəlik qurur — şorba, plov, mərci, sulu xörək.','На трёх кухнях волонтёры с 09:00 режут овощи; повар составляет меню на неделю — суп, плов, чечевица, рагу.','In three kitchens volunteers start chopping at 09:00; the cook plans the week — soup, plov, lentils, stew.')],
 [L('Günorta paylayırıq','Днём раздаём','Midday: we serve'),L('12:00–14:00 qapı açıqdır: soruşmadan, sənədsiz isti nahar.','С 12:00 до 14:00 двери открыты: горячий обед без вопросов и документов.','From 12:00 to 14:00 the door is open: a hot lunch, no questions, no documents.')],
 [L('Axşam qutular gedir','Вечером уезжают коробки','Evenings: boxes go out'),L('Sosial işçilərin və qonşuların göstərdiyi ailələrə, yaşlılara evə çatdırırıq.','Развозим семьям, о которых сообщили соцработники и соседи, и пожилым — на дом.','We deliver to families referred by social workers and neighbours, and to older people at home.')]
];

const KITCHENS=[
 {id:'nar',name:L('Nərimanov','Нариманов','Narimanov'),addr:L('Təbriz küçəsi 41, həyətdəki bina','Улица Тебриз 41, здание во дворе','41 Tabriz street, the building in the yard')},
 {id:'yas',name:L('Yasamal','Ясамал','Yasamal'),addr:L('Şərifzadə küçəsi 88, zirzəmi','Улица Шарифзаде 88, цокольный этаж','88 Sharifzade street, lower ground floor')},
 {id:'bak',name:L('Bakıxanov','Бакиханов','Bakikhanov'),addr:L('Y. Hüseynov küçəsi 17, məktəbin yanı','Улица Я. Гусейнова 17, рядом со школой','17 Y. Huseynov street, next to the school')}
];
const ROLES=[
 {id:'prep',name:L('Hazırlıq və doğrama','Подготовка и нарезка','Prep and chopping'),time:'09:00–12:00',cap:8},
 {id:'serve',name:L('Nahar paylama','Раздача обеда','Serving lunch'),time:'12:00–14:30',cap:6},
 {id:'pack',name:L('Ərzaq qutusu yığmaq','Сборка продуктовых коробок','Packing food boxes'),time:'16:00–19:00',cap:10},
 {id:'drive',name:L('Maşınla çatdırılma','Доставка на машине','Delivery by car'),time:'17:00–20:00',cap:4,licence:true}
];

const DESIGN=[
 ['any',L('Harada lazımdırsa','Куда нужнее','Where it’s needed most'),L('Mətbəxlər arasında ehtiyaca görə bölünür.','Распределяем между кухнями по необходимости.','Split between the kitchens as needed.')],
 ['winter',L('Qış ərzaq qutuları','Зимние продуктовые коробки','Winter food boxes'),L('Dekabr–fevral, əlavə yağ, çay və qarabaşaq.','Декабрь–февраль, больше масла, чая и гречки.','December to February, with extra oil, tea and buckwheat.')],
 ['school',L('Dərsdən sonra isti yemək','Горячая еда после уроков','Hot meals after school'),L('Bakıxanov mətbəxi, 15:00, məktəbli uşaqlar üçün.','Кухня в Бакиханове, 15:00, для школьников.','Bakikhanov kitchen, 15:00, for schoolchildren.')],
 ['elder',L('Yaşlılara evə çatdırılma','Доставка пожилым на дом','Home delivery for older people'),L('Pilləkəni çıxa bilməyənlərə həftədə üç dəfə.','Три раза в неделю тем, кто не может выйти.','Three times a week to people who cannot get out.')]
];

const FAQ=[
 [L('Qəbz alacam?','Я получу квитанцию?','Will I get a receipt?'),L('Bəli, e-poçtla, ianə günü. Aylıq ianədə hər ay ayrıca qəbz gəlir.','Да, на почту в день пожертвования. При ежемесячном — квитанция каждый месяц.','Yes, by e-mail on the day you give. Monthly gifts get a receipt every month.')],
 [L('Aylıq ianəni necə dayandırım?','Как остановить ежемесячное пожертвование?','How do I stop a monthly gift?'),L('Qəbzdəki keçidlə bir kliklə və ya bizə zəng edərək. Səbəb soruşmuruq.','По ссылке в квитанции в один клик или звонком. Причину не спрашиваем.','With one click from the link in any receipt, or by phone. We don’t ask why.')],
 [L('Ərzaq gətirə bilərəm?','Можно принести продукты?','Can I bring food?'),L('Açılmamış, son istifadə tarixinə ən azı bir ay qalan quru ərzaq — bəli, hər mətbəxə 10:00–18:00. Evdə bişmiş yemək qəbul etmirik.','Нераскрытые сухие продукты со сроком годности не меньше месяца — да, на любую кухню с 10:00 до 18:00. Домашнюю еду не принимаем.','Unopened dry goods with at least a month before expiry — yes, at any kitchen 10:00–18:00. We can’t accept home-cooked food.')],
 [L('Kimə kömək etdiyinizi necə seçirsiniz?','Как вы выбираете, кому помогать?','How do you decide who gets help?'),L('İsti nahar hər kəsə açıqdır. Qutular üçün sosial işçinin, məktəbin və ya qonşunun müraciəti, yaxud ailənin özünün zəngi kifayətdir.','Горячий обед открыт для всех. Для коробок достаточно обращения соцработника, школы или соседа — или звонка самой семьи.','The hot lunch is open to all. For boxes a referral from a social worker, school or neighbour — or the family’s own call — is enough.')],
 [L('Könüllü olmaq üçün təcrübə lazımdır?','Нужен ли опыт, чтобы стать волонтёром?','Do I need experience to volunteer?'),L('Xeyr. İlk növbədə aşpaz göstəriş verir; önlük və əlcək bizdəndir. 16 yaşdan; çatdırılma üçün sürücülük vəsiqəsi.','Нет. На первой смене повар всё покажет; фартук и перчатки наши. С 16 лет; для доставки — водительские права.','No. On your first shift the cook shows you everything; aprons and gloves are ours. From age 16; delivery needs a driving licence.')]
];

const T={
 nav:[['box',L('Qutuda nə var','Что в коробке','What’s in a box')],['give',L('İanə','Пожертвовать','Give')],['shift',L('Könüllü növbə','Смена волонтёра','Volunteer')],['need',L('Yemək lazımdır?','Нужна еда?','Need food?')]],
 h1:[L('Bakıda hər gün isti nahar.','Горячий обед в Баку каждый день.','A hot lunch in Baku, every day.'),L('Hər həftə ərzaq qutusu.','Продуктовая коробка каждую неделю.','A food box, every week.')],
 lede:L('Bir Süfrə üç məhəllə mətbəxidir: Nərimanov, Yasamal, Bakıxanov. Pulu ərzağa, vaxtı isə mətbəxə verə bilərsiniz.','«Бир Сюфре» — три районные кухни: Нариманов, Ясамал, Бакиханов. Можно дать деньги на продукты или время на кухне.','Bir Süfrə is three neighbourhood kitchens: Narimanov, Yasamal and Bakikhanov. You can give money for food or time in the kitchen.'),
 ctaGive:L('İanə et','Пожертвовать','Give'),ctaShift:L('Növbə götür','Взять смену','Take a shift'),
 alt:{tomato:L('Yeşikdə qırmızı pomidorlar','Красные помидоры в ящике','Red tomatoes in a crate'),onion:L('Bazar piştaxtasında soğan','Лук на прилавке','Onions on a market stall'),cabbage:L('Hörmə səbətdə kələm','Капуста в плетёной корзине','Cabbages in a woven basket'),persimmon:L('Xurma və alma yığını','Хурма и яблоки','Persimmons and apples'),bread:L('Soyuducu barmaqlıqda təzə çörəklər','Свежий хлеб на решётке','Fresh loaves on a cooling rack'),pot:L('Qara qazanda ətli qırmızı sulu xörək','Красное рагу с мясом в чёрной кастрюле','A red meat stew in a black pot')},
 boxH:L('Bir qutuda nə var','Что лежит в одной коробке','What goes into one box'),
 boxSub:L('Dörd nəfərlik ailə üçün təxminən bir həftəlik əsas ərzaq.','Основные продукты примерно на неделю для семьи из четырёх человек.','Roughly a week of staples for a family of four.'),
 sample:L('Nümunə rəqəmlər: noyabr 2026 topdan qiymətləri ilə hesablanıb, real hesabat deyil.','Цифры-примеры: рассчитаны по оптовым ценам ноября 2026, это не реальный отчёт.','Sample figures: worked out at November 2026 wholesale prices, not a real report.'),
 item:L('Məhsul','Продукт','Item'),qty:L('Miqdar','Количество','Amount'),cost:L('Qiymət','Цена','Cost'),share:L('Payı','Доля','Share'),
 boxTotal:L('Bir qutu','Одна коробка','One box'),
 mealH:L('Bir isti nahar','Один горячий обед','One hot lunch'),
 stepsH:L('Pul hara gedir','Куда идут деньги','Where the money goes'),
 giveH:L('İanə','Пожертвование','Give'),
 giveSub:L('Məbləği seçin — yanında onun nəyə çatdığını görəcəksiniz.','Выберите сумму — рядом будет видно, на что её хватит.','Pick an amount — you’ll see what it covers next to it.'),
 lAmount:L('Məbləğ','Сумма','Amount'),lOther:L('Başqa məbləğ, AZN','Другая сумма, AZN','Other amount, AZN'),
 presetHint:[L('5 nahar','5 обедов','5 lunches'),L('1 qutu','1 коробка','1 box'),L('2 qutu','2 коробки','2 boxes'),L('5 qutu','5 коробок','5 boxes')],
 lFreq:L('Nə qədər tez-tez','Как часто','How often'),once:L('Bir dəfə','Один раз','Once'),monthly:L('Hər ay','Каждый месяц','Monthly'),
 lFor:L('Nəyə','На что','Towards'),
 lName:L('Ad','Имя','Name'),anon:L('Adımı göstərməyin','Не указывать моё имя','Keep me anonymous'),
 lEmail:L('Qəbz üçün e-poçt','Почта для квитанции','E-mail for your receipt'),
 review:L('Yoxla və təsdiqlə','Проверить и подтвердить','Review and confirm'),
 shiftH:L('Könüllü növbə','Смена волонтёра','Volunteer shift'),
 shiftSub:L('Mətbəxi seçin, sonra boş yeri olan növbəni. Növbə 2–3 saatdır.','Выберите кухню, затем смену со свободными местами. Смена — 2–3 часа.','Choose a kitchen, then a shift with places left. Shifts are 2–3 hours.'),
 kitchen:L('Mətbəx','Кухня','Kitchen'),
 lPhone:L('Telefon','Телефон','Phone'),age:L('16 yaşım var','Мне есть 16 лет','I am 16 or older'),licence:L('Sürücülük vəsiqəm var (B kateqoriya)','У меня есть права категории B','I hold a category B driving licence'),
 book:L('Növbəyə yazıl','Записаться на смену','Sign up for the shift'),
 needH:L('Yemək lazımdır?','Нужна еда?','Need food?'),
 need:[L('Nahar üçün: 12:00–14:00 istənilən mətbəxə gəlin. Sənəd, qeydiyyat, sual yoxdur.','На обед: приходите на любую кухню с 12:00 до 14:00. Без документов, записи и вопросов.','For lunch: come to any kitchen 12:00–14:00. No documents, no sign-up, no questions.'),
  L('Ərzaq qutusu üçün: +994 12 555 04 40 nömrəsinə zəng edin (09:00–18:00, nümunə nömrə). Ünvanı və ailədə neçə nəfər olduğunu soruşacağıq.','Для продуктовой коробки: позвоните +994 12 555 04 40 (09:00–18:00, номер-пример). Мы спросим адрес и сколько человек в семье.','For a food box: call +994 12 555 04 40 (09:00–18:00, sample number). We’ll ask for your address and how many people live with you.'),
  L('Qonşunuz üçün də zəng edə bilərsiniz. Adınızı ona deməyəcəyik.','Можно позвонить и за соседа. Мы не назовём ему ваше имя.','You can call for a neighbour too. We won’t tell them who called.')],
 faqH:L('Suallar','Вопросы','Questions'),
 hours:L('Mətbəxlər bazar ertəsi–şənbə 09:00–20:00, nahar 12:00–14:00. Bazar günü bağlıdır.','Кухни работают пн–сб 09:00–20:00, обед 12:00–14:00. В воскресенье закрыто.','Kitchens open Monday to Saturday 09:00–20:00, lunch 12:00–14:00. Closed on Sunday.'),
 org:L('Bir Süfrə — konsept üçün uydurulmuş xeyriyyə təşkilatı; ünvanlar və nömrələr nümunədir.','«Бир Сюфре» — вымышленная для концепта организация; адреса и номера — примеры.','Bir Süfrə is a charity invented for this concept; addresses and numbers are samples.')
};

const R={
 covers:L('{a} ilə: {what}','{a} — это: {what}','{a} covers: {what}'),
 coversM:L('Hər ay {a} ilə: {what}','Каждый месяц {a} — это: {what}','Every month {a} covers: {what}'),
 boxes:L('{n} qutu','{n} коробки','{n} boxes'),box1:L('1 qutu','1 коробка','1 box'),
 meals:L('{n} isti nahar','{n} горячих обедов','{n} hot lunches'),meal1:L('1 isti nahar','1 горячий обед','1 hot lunch'),
 and:L(' və ',' и ',' and '),
 small:L('nahar qiymətinin bir hissəsi','часть стоимости обеда','part of a lunch'),
 sampleNote:L('nümunə qiymətlərlə','по примерным ценам','at sample prices'),
 amountErr:L('5 ilə 5 000 AZN arasında məbləğ yazın.','Укажите сумму от 5 до 5 000 AZN.','Enter an amount between 5 and 5,000 AZN.'),
 emailErr:L('Qəbzi göndərmək üçün düzgün e-poçt lazımdır (məsələn, ad@mail.az).','Для квитанции нужна корректная почта (например, name@mail.az).','A valid e-mail is needed for the receipt (for example, name@mail.az).'),
 nameErr:L('Ad yazın və ya «Adımı göstərməyin» seçin.','Напишите имя или выберите «Не указывать моё имя».','Write a name or choose “Keep me anonymous”.'),
 revH:L('Yoxlayın','Проверьте','Check this'),
 rAmount:L('Məbləğ','Сумма','Amount'),rFreq:L('Tezlik','Как часто','Frequency'),rFor:L('Nəyə','На что','Towards'),rFrom:L('Kimdən','От кого','From'),rReceipt:L('Qəbz','Квитанция','Receipt'),
 anonName:L('Anonim','Анонимно','Anonymous'),
 confirm:L('İanəni təsdiqlə','Подтвердить пожертвование','Confirm gift'),edit:L('Düzəlt','Изменить','Edit'),
 thanksH:L('Təşəkkür edirik','Спасибо','Thank you'),
 thanks:L('{amount} {freq} — {for}. Qəbz {email} ünvanına gedəcəkdi.','{amount} {freq} — {for}. Квитанция ушла бы на {email}.','{amount} {freq} — {for}. The receipt would go to {email}.'),
 freqOnce:L('bir dəfə','один раз','once'),freqMonthly:L('hər ay','каждый месяц','every month'),
 demoPay:L('Demo: ödəniş alınmadı, kart məlumatı soruşulmadı və heç nə göndərilmədi.','Демо: оплата не проводилась, данные карты не запрашивались, ничего не отправлено.','Demo: no payment was taken, no card details were asked for and nothing was sent.'),
 again:L('Başqa ianə','Ещё одно пожертвование','Another gift'),
 left:L('{n} yer qalıb','осталось мест: {n}','{n} places left'),left1:L('1 yer qalıb','осталось 1 место','1 place left'),full:L('Dolub','Мест нет','Full'),
 pickShift:L('Növbə seçin.','Выберите смену.','Choose a shift.'),
 noShifts:L('Bu mətbəxdə bu həftə boş növbə qalmayıb. Başqa mətbəxə baxın.','На этой кухне на этой неделе свободных смен нет. Посмотрите другую кухню.','No shifts left at this kitchen this week. Try another kitchen.'),
 phoneErr:L('Telefonu 0XX XXX XX XX şəklində yazın.','Номер в формате 0XX XXX XX XX.','Write the phone as 0XX XXX XX XX.'),
 shiftNameErr:L('Adınızı yazın — aşpaz sizi adla qarşılayacaq.','Напишите имя — повар встретит вас по имени.','Write your name — the cook will greet you by it.'),
 ageErr:L('Növbələr 16 yaşdan başlayır.','Смены — с 16 лет.','Shifts are for ages 16 and up.'),
 licenceErr:L('Çatdırılma növbəsi üçün sürücülük vəsiqəsi lazımdır. Başqa növbə seçin.','Для доставки нужны права. Выберите другую смену.','Delivery needs a driving licence. Choose another shift.'),
 bookedH:L('Növbəyə yazıldınız','Вы записаны на смену','You’re on the shift'),
 booked:L('{name}: {when}, {role}, {kitchen} mətbəxi — {addr}. 10 dəqiqə tez gəlin.','{name}: {when}, {role}, кухня {kitchen} — {addr}. Приходите за 10 минут.','{name}: {when}, {role}, {kitchen} kitchen — {addr}. Come 10 minutes early.'),
 demoShift:L('Demo: yer yalnız bu səhifədə azaldı, heç kimə xəbər getmədi.','Демо: место уменьшилось только на этой странице, никому ничего не отправлено.','Demo: the place was taken only on this page; nobody was notified.'),
 another:L('Başqa növbə','Другая смена','Another shift'),
 fix:L('İşarələnmiş xanaları düzəldin.','Исправьте отмеченные поля.','Fix the marked fields.')
};

export default {
 id:'give',brand:'Bir Süfrə',kind:'site',
 render(ctx){
  const t=ctx.t,f2=n=>ctx.num(n,{minimumFractionDigits:2,maximumFractionDigits:2});
  const nav=T.nav.map(([id,l])=>`<a href="#gv-${id}">${t(l)}</a>`).join('');
  const max=Math.max(...BOX.map(b=>b[2]));
  const rows=BOX.map(([n,q,c])=>`<tr><th scope="row">${t(n)}</th><td>${q?t(q):''}</td><td class="gv-bar"><span class="gv-bar-in" data-w="${Math.round(c/max*100)}"></span><span class="sr-only">${Math.round(c/BOX_COST*100)}%</span></td><td class="gv-n">${f2(c)}</td></tr>`).join('');
  const meal=MEAL.map(([n,c])=>`<li><span>${t(n)}</span><b>${f2(c)}</b></li>`).join('');
  const steps=STEPS.map(([h,p],i)=>`<li><span class="gv-step-n">${i+1}</span><h3>${t(h)}</h3><p>${t(p)}</p></li>`).join('');
  const presets=[12,32,64,160].map((a,i)=>`<label class="gv-preset"><input type="radio" name="amount" value="${a}"${i===1?' checked':''}><b>${a}</b><small>${t(T.presetHint[i])}</small></label>`).join('');
  const design=DESIGN.map(([id,n,d],i)=>`<label class="gv-opt"><input type="radio" name="for" value="${id}"${i===0?' checked':''}><span><b>${t(n)}</b><small>${t(d)}</small></span></label>`).join('');
  const tabs=KITCHENS.map((k,i)=>`<button type="button" role="tab" id="gv-tab-${k.id}" aria-controls="gv-shifts" aria-selected="${i===0}" data-k="${k.id}"${i?' tabindex="-1"':''}><b>${t(k.name)}</b><small>${t(k.addr)}</small></button>`).join('');
  const faq=FAQ.map(([q,a])=>`<details><summary>${t(q)}</summary><p>${t(a)}</p></details>`).join('');
  const keys=['give/tomato','give/onion','give/cabbage','give/persimmon','give/bread','give/pot'];
  const kitchens=Object.fromEntries(KITCHENS.map(k=>[k.id,{name:k.name,addr:k.addr}]));
  const designNames=Object.fromEntries(DESIGN.map(([id,n])=>[id,n]));
  return `<div class="gv">
<header class="gv-top"><a class="gv-word" href="#gv-hero">Bir Süfrə</a><nav aria-label="Bir Süfrə">${nav}</nav></header>
<section class="gv-hero" id="gv-hero">
 <h1><span>${t(T.h1[0])}</span> <span>${t(T.h1[1])}</span></h1>
 <div class="gv-hero-foot"><p>${t(T.lede)}</p><div class="gv-actions"><a class="gv-btn" href="#gv-give">${t(T.ctaGive)}</a><a class="gv-btn gv-btn-line" href="#gv-shift">${t(T.ctaShift)}</a></div></div>
 <figure class="gv-hero-img">${ctx.img('give/tomato',T.alt.tomato,{eager:true,sizes:'(min-width: 900px) 34vw, 100vw'})}</figure>
</section>
<div class="gv-crates" aria-hidden="false">${['onion','cabbage','persimmon','bread'].map(k=>`<figure>${ctx.img(`give/${k}`,T.alt[k],{sizes:'(min-width: 900px) 25vw, 50vw'})}</figure>`).join('')}</div>
<section class="gv-box" id="gv-box" aria-labelledby="gv-box-h">
 <div class="gv-box-head"><h2 id="gv-box-h">${t(T.boxH)}</h2><p>${t(T.boxSub)}</p><p class="gv-sample">${t(T.sample)}</p></div>
 <div class="gv-receipt"><table><thead><tr><th scope="col">${t(T.item)}</th><th scope="col">${t(T.qty)}</th><th scope="col"><span class="sr-only">${t(T.share)}</span></th><th scope="col" class="gv-n">${t(T.cost)}, AZN</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><th scope="row" colspan="3">${t(T.boxTotal)}</th><td class="gv-n">${f2(BOX_COST)}</td></tr></tfoot></table></div>
 <aside class="gv-meal"><figure>${ctx.img('give/pot',T.alt.pot,{sizes:'(min-width: 900px) 28vw, 100vw'})}</figure><h3>${t(T.mealH)}</h3><p class="gv-big">${f2(MEAL_COST)} <span>AZN</span></p><ul>${meal}</ul></aside>
</section>
<section class="gv-steps" aria-labelledby="gv-steps-h"><h2 id="gv-steps-h">${t(T.stepsH)}</h2><ol>${steps}</ol></section>
<section class="gv-give" id="gv-give" aria-labelledby="gv-give-h">
 <div class="gv-give-head"><h2 id="gv-give-h">${t(T.giveH)}</h2><p>${t(T.giveSub)}</p></div>
 <form class="gv-form" novalidate>
  <fieldset><legend>${t(T.lAmount)}, AZN</legend><div class="gv-presets">${presets}<label class="gv-preset gv-other"><input type="radio" name="amount" value="other"><span>${t(T.lOther)}</span><input type="text" inputmode="decimal" name="other" aria-label="${t(T.lOther)}" aria-describedby="gv-e-amount" maxlength="7" placeholder="—"></label></div>
   <p class="gv-err" id="gv-e-amount" hidden></p>
   <p class="gv-covers" aria-live="polite"></p></fieldset>
  <fieldset><legend>${t(T.lFreq)}</legend><div class="gv-seg"><label><input type="radio" name="freq" value="once" checked><span>${t(T.once)}</span></label><label><input type="radio" name="freq" value="monthly"><span>${t(T.monthly)}</span></label></div></fieldset>
  <fieldset><legend>${t(T.lFor)}</legend><div class="gv-opts">${design}</div></fieldset>
  <div class="gv-two"><label class="gv-field"><span>${t(T.lName)}</span><input name="name" autocomplete="name" maxlength="60" aria-describedby="gv-e-name"><em class="gv-err" id="gv-e-name" hidden></em></label>
   <label class="gv-field"><span>${t(T.lEmail)}</span><input name="email" type="email" autocomplete="email" aria-describedby="gv-e-email"><em class="gv-err" id="gv-e-email" hidden></em></label></div>
  <label class="gv-check"><input type="checkbox" name="anon"> ${t(T.anon)}</label>
  <button type="submit" class="gv-btn">${t(T.review)}</button>
 </form>
 <div class="gv-review" hidden tabindex="-1"></div>
</section>
<section class="gv-shift" id="gv-shift" aria-labelledby="gv-shift-h">
 <div class="gv-shift-head"><h2 id="gv-shift-h">${t(T.shiftH)}</h2><p>${t(T.shiftSub)}</p></div>
 <div class="gv-tabs" role="tablist" aria-label="${t(T.kitchen)}">${tabs}</div>
 <div class="gv-shifts" id="gv-shifts" role="tabpanel" aria-labelledby="gv-tab-nar"></div>
 <form class="gv-sform" novalidate hidden>
  <p class="gv-picked" aria-live="polite"></p>
  <div class="gv-two"><label class="gv-field"><span>${t(T.lName)}</span><input name="sname" autocomplete="name" maxlength="60" aria-describedby="gv-e-sname"><em class="gv-err" id="gv-e-sname" hidden></em></label>
   <label class="gv-field"><span>${t(T.lPhone)}</span><input name="sphone" type="tel" autocomplete="tel" placeholder="050 123 45 67" aria-describedby="gv-e-sphone"><em class="gv-err" id="gv-e-sphone" hidden></em></label></div>
  <label class="gv-check"><input type="checkbox" name="age" aria-describedby="gv-e-age"> ${t(T.age)}</label><em class="gv-err" id="gv-e-age" hidden></em>
  <label class="gv-check gv-lic" hidden><input type="checkbox" name="licence" aria-describedby="gv-e-licence"> ${t(T.licence)}</label><em class="gv-err" id="gv-e-licence" hidden></em>
  <button type="submit" class="gv-btn">${t(T.book)}</button>
 </form>
 <div class="gv-booked" hidden tabindex="-1" role="status"></div>
</section>
<section class="gv-need" id="gv-need" aria-labelledby="gv-need-h"><h2 id="gv-need-h">${t(T.needH)}</h2><div>${T.need.map(p=>`<p>${t(p)}</p>`).join('')}</div></section>
<section class="gv-faq" aria-labelledby="gv-faq-h"><h2 id="gv-faq-h">${t(T.faqH)}</h2>${faq}</section>
<footer class="gv-foot"><p class="gv-word">Bir Süfrə</p><ul>${KITCHENS.map(k=>`<li><b>${t(k.name)}</b><span>${t(k.addr)}</span></li>`).join('')}</ul><p>${t(T.hours)}</p><p class="gv-small">${t(T.org)}</p>${ctx.credits(keys)}</footer>
${ctx.data({r:R,cal:cal(ctx),lang:ctx.lang,kitchens,design:designNames,roles:ROLES.map(r=>({id:r.id,name:r.name,time:r.time,cap:r.cap,licence:!!r.licence})),box:BOX_COST,meal:MEAL_COST})}
</div>`;
 }
};
