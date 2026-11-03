// Atelier No.8 — an architectural photography studio. Three series sequenced like a book, an hour-ordered index,
// a keyboard lightbox and a commission enquiry (app.js).
import {L,esc} from '../kit.js';

const SERIES=[
 {id:'mol',name:L('Dalğaqıran','Волнорез','Breakwater'),
  sub:L('Sahil, noyabr. Yeddi kadr, səhər 07:40-dan axşam 17:40-a qədər.','Побережье, ноябрь. Семь кадров, с 07:40 утра до 17:40 вечера.','The shore in November. Seven frames, from 07:40 in the morning to 17:40.'),
  essay:[L('Xəzərdə noyabr işığı boz və yumşaqdır: buludlar günəşi diffuzora çevirir, su isə səmanın rəngini bir ton tünd təkrarlayır. Bu seriyada biz bir günü dalğaqıranın yanında keçirdik və eyni xətti — su ilə betonun görüşdüyü yeri — fərqli saatlarda çəkdik.','Ноябрьский свет на Каспии серый и мягкий: облака превращают солнце в рассеиватель, а вода повторяет цвет неба на тон темнее. В этой серии мы провели день у волнореза и снимали одну и ту же линию — место, где вода встречается с бетоном, — в разные часы.','November light on the Caspian is grey and soft: cloud turns the sun into a diffuser, and the water repeats the sky one tone darker. For this series we spent a day by the breakwater and photographed the same line — where water meets concrete — at different hours.'),
   L('Səhər tetrapodlar qara görünür, günortaya yaxın səthləri ağarır, axşam isə su yenidən onlardan açıq olur. Seriyanı bu ardıcıllıqla oxumaq lazımdır: şəkillərin ölçüsü onların arasındakı vaxtı göstərir.','Утром тетраподы кажутся чёрными, к полудню их поверхности светлеют, а вечером вода снова становится светлее них. Серию стоит читать именно в этом порядке: размер снимков передаёт время между ними.','In the morning the tetrapods read as black, by noon their faces turn pale, and by evening the water is lighter than they are again. Read the series in this order: the size of each picture stands for the time between them.')]},
 {id:'kolge',name:L('Kölgə cədvəli','Расписание тени','Shadow timetable'),
  sub:L('Pilləkənlər, divarlar, pəncərələr. Doqquz kadr, 09:30–16:20.','Лестницы, стены, окна. Девять кадров, 09:30–16:20.','Stairs, walls, windows. Nine frames, 09:30–16:20.'),
  essay:[L('Memarlıq fotoqrafiyasında ən çox soruşulan sual "nə vaxt gələk?" sualıdır. Cavab binanın oriyentasiyasındadır: cənub divarı günorta düz işıq alır, şərq üzü yalnız səhər relyef göstərir.','Самый частый вопрос в архитектурной съёмке — «когда приезжать?». Ответ в ориентации здания: южная стена получает прямой свет в полдень, восточный фасад показывает рельеф только утром.','The question we hear most in architectural photography is “when should we come?”. The answer lies in the building’s orientation: a south wall gets direct light at noon, an east face only shows relief in the morning.'),
   L('Bu seriya həmin cədvəlin özüdür. Hər kadrın altında saat yazılıb, çünki kölgənin uzunluğu və istiqaməti şəklin məzmununun yarısıdır.','Эта серия и есть такое расписание. Под каждым кадром указано время, потому что длина и направление тени — половина содержания снимка.','This series is that timetable. Every frame carries its time, because the length and direction of the shadow is half of what the picture is about.')]},
 {id:'gece',name:L('Gecə növbəsi','Ночная смена','Night shift'),
  sub:L('Fənərlər, piyadalar gedəndən sonra. Altı kadr, 19:20–00:20.','Фонари после того, как ушли пешеходы. Шесть кадров, 19:20–00:20.','Lamps after the walkers have gone. Six frames, 19:20–00:20.'),
  essay:[L('Gecə işıq artıq günəşdən yox, şəhərdən gəlir. Natrium və LED fənərlər eyni küçəni iki fərqli rəngdə göstərir; biz onları düzəltmirik, olduğu kimi saxlayırıq.','Ночью свет идёт уже не от солнца, а от города. Натриевые и светодиодные фонари показывают одну и ту же улицу в двух разных цветах; мы их не выравниваем и оставляем как есть.','At night the light comes from the city rather than the sun. Sodium and LED lamps show the same street in two different colours; we do not correct them, we keep them as they are.')]}
];

// Frames in sequence order. t = local time of the exposure (HH:MM); place = what is in the frame.
const F=(key,s,t,az,ru,en)=>({key,s,t,place:L(az,ru,en)});
const FRAMES=[
 F('c1','mol','08:10','Şimal küləyi, açıq su və mol','Северный ветер, открытая вода и мол','North wind, open water and the mole'),
 F('c3','mol','07:40','Tetrapodlar, yaxın plan','Тетраподы, крупный план','Tetrapods, close'),
 F('c2','mol','11:30','Dalğaqıran daşları və mayak','Камни волнореза и маяк','Breakwater stones and the lighthouse'),
 F('c4','mol','13:20','Liman hovuzu, sakit su','Гаванский бассейн, тихая вода','Harbour basin, still water'),
 F('c5','mol','15:50','Köhnə körpünün dayaqları','Опоры старого пирса','Piles of the old pier'),
 F('c6','mol','17:05','Yaş qum, dalğa geri çəkilir','Мокрый песок, волна отступает','Wet sand, the wave pulls back'),
 F('c7','mol','17:40','Günəş üfüqdə, son işıq','Солнце на горизонте, последний свет','Sun on the horizon, last light'),
 F('s7','kolge','09:30','Asma lampa, pəncərənin kölgəsi','Подвесная лампа, тень окна','Pendant lamp, the window’s shadow'),
 F('s1','kolge','10:15','Beton tağ, şərq üzü','Бетонная арка, восточная сторона','Concrete arch, east face'),
 F('s9','kolge','11:10','Tağlı dəhliz','Арочная галерея','Arched corridor'),
 F('s3','kolge','12:00','Şüşə blok, pilləkən qəfəsi','Стеклоблоки, лестничная клетка','Glass blocks, stair well'),
 F('s5','kolge','12:40','Ağ divarlar arasında pilləkən','Лестница между белыми стенами','Stair between white walls'),
 F('s8','kolge','13:00','Köhnə su quyusu, quru yamac','Старый колодец, сухой склон','Old well, dry slope'),
 F('s2','kolge','14:05','Pilləkən, cənub divarı','Лестница, южная стена','Stair, south wall'),
 F('s4','kolge','15:30','Talvar və jalüzinin kölgəsi','Тень козырька и жалюзи','Awning and shutter shadow'),
 F('s6','kolge','16:20','Bitki kölgəsi, sarı suvaq','Тень растения, жёлтая штукатурка','Plant shadow, yellow plaster'),
 F('n1','gece','19:20','Bulvar fənəri, son mavi işıq','Фонарь бульвара, последний синий свет','Promenade lamp, last blue light'),
 F('n6','gece','20:15','Divar lampası, kərpic','Настенный светильник, кирпич','Wall lamp, brick'),
 F('n2','gece','21:40','Tək fənər','Одинокий фонарь','A single lamp'),
 F('n4','gece','22:30','Qoşa fənər, qaranlıq fasad','Двойной фонарь, тёмный фасад','Twin lamp, dark façade'),
 F('n3','gece','23:10','Boş meydança, projektor dirəyi','Пустая площадка, мачта прожектора','Empty lot, floodlight mast'),
 F('n5','gece','00:20','Sarı fənər','Жёлтый фонарь','Yellow lamp')
];

const T={
 nav:[['#series',L('Seriyalar','Серии','Series')],['#index',L('İndeks','Индекс','Index')],['#method',L('Üsul','Метод','Method')],['#commission',L('Sifariş','Заказ','Commission')]],
 h1:L('İşıq bu divara saat 16:20-də çatır.','Свет доходит до этой стены в 16:20.','The light reaches this wall at 16:20.'),
 lede:L('Atelier No.8 Bakıda iki nəfərlik memarlıq fotoqrafiyası studiyasıdır. Bitmiş binaları, interyerləri və sahil boyu tikililəri çəkirik — və çəkilişdən əvvəl hər fasad üçün işıq cədvəli qururuq.','Atelier No.8 — студия архитектурной фотографии из двух человек в Баку. Мы снимаем готовые здания, интерьеры и постройки вдоль побережья — и перед съёмкой составляем для каждого фасада расписание света.','Atelier No.8 is a two-person architectural photography studio in Baku. We photograph finished buildings, interiors and structures along the coast — and before every shoot we draw up a light timetable for each façade.'),
 now:L('Bakıda indi','Сейчас в Баку','Now in Baku'),
 openCap:L('Dalğaqıran, 08:10. Şimal küləyi, açıq su və mol.','Волнорез, 08:10. Северный ветер, открытая вода и мол.','Breakwater, 08:10. North wind, open water and the mole.'),
 seriesH:L('Seriyalar','Серии','Series'),
 open:L('Böyüt: {p}, {t}','Открыть: {p}, {t}','Enlarge: {p}, {t}'),
 idxH:L('İndeks: bütün kadrlar saata görə','Индекс: все кадры по времени','Index: every frame by the hour'),
 idxP:L('Arxivdəki {n} kadr çəkildiyi saata görə düzülüb — səhər işığından gecə fənərlərinə qədər. Nöqtəyə və ya kadra basın.','{n} кадров архива упорядочены по времени съёмки — от утреннего света до ночных фонарей. Нажмите на точку или кадр.','The archive’s {n} frames ordered by the hour they were made, from morning light to night lamps. Select a dot or a frame.'),
 all:L('Hamısı','Все','All'),
 bands:[[7,11,L('Səhər','Утро','Morning')],[11,15,L('Günorta','Полдень','Midday')],[15,19,L('Axşamüstü','Под вечер','Late afternoon')],[19,25,L('Gecə','Ночь','Night')]],
 methH:L('Üsul','Метод','Method'),
 methP:L('Bir sifariş adətən beş addımdan keçir. Çəkiliş günündən əvvəlki iş nəticənin yarısıdır.','Обычно заказ проходит пять шагов. Работа до дня съёмки — половина результата.','A commission usually goes through five steps. The work before the shoot day is half the result.'),
 steps:[
  [L('Baxış','Осмотр','Site visit'),L('Obyektə gəlirik, fasadların oriyentasiyasını, kölgə salan qonşu binaları və giriş vaxtlarını qeyd edirik. Bakı daxilində ödənişsizdir.','Приезжаем на объект, отмечаем ориентацию фасадов, соседние здания, дающие тень, и время доступа. По Баку бесплатно.','We visit the site and note the orientation of each façade, neighbouring buildings that cast shade, and access hours. Free within Baku.')],
  [L('İşıq cədvəli','Расписание света','Light timetable'),L('Günəşin yolunu hər fasad üçün hesablayırıq və saatlarla plan göndəririk: "şərq fasadı 08:30–09:40, həyət 13:00".','Рассчитываем путь солнца для каждого фасада и присылаем план по часам: «восточный фасад 08:30–09:40, двор 13:00».','We calculate the sun’s path for each façade and send a plan by the hour: “east façade 08:30–09:40, courtyard 13:00”.')],
  [L('Çəkiliş','Съёмка','Shoot'),L('Bir və ya iki gün, cədvələ uyğun. Hava pis olarsa, yeni tarix ödənişsiz təyin olunur.','Один или два дня по расписанию. Если подведёт погода, новая дата назначается бесплатно.','One or two days, on the timetable. If the weather fails, a new date is set at no cost.')],
  [L('Seçim və emal','Отбор и обработка','Edit'),L('İlk baxış üçün 60–80 kadrlıq qalereya; siz seçirsiniz, biz perspektivi və rəngi düzəldirik.','Галерея из 60–80 кадров для первого просмотра; вы выбираете, мы правим перспективу и цвет.','A gallery of 60–80 frames for review; you choose, we correct perspective and colour.')],
  [L('Təhvil','Сдача','Delivery'),L('10 iş günü ərzində: çap üçün TIFF, veb üçün JPEG, istifadə hüququ yazılı şəkildə.','В течение 10 рабочих дней: TIFF для печати, JPEG для веба, права использования письменно.','Within 10 working days: TIFF for print, JPEG for web, usage rights in writing.')]
 ],
 ratesH:L('Qiymətlər','Цены','Rates'),
 ratesNote:L('Nümunə qiymətlərdir; dəqiq məbləğ baxışdan sonra yazılı təklifdə göstərilir.','Это примерные цены; точная сумма указывается в письменном предложении после осмотра.','Sample rates; the exact amount is set in a written quote after the site visit.'),
 rates:[
  [L('Yarım gün','Полдня','Half day'),L('4 saat, bir işıq pəncərəsi, 15 hazır kadr','4 часа, одно световое окно, 15 готовых кадров','4 hours, one light window, 15 finished frames'),450],
  [L('Tam gün','Полный день','Full day'),L('Səhər və axşam pəncərəsi, 30 hazır kadr','Утреннее и вечернее окно, 30 готовых кадров','Morning and evening windows, 30 finished frames'),800],
  [L('Gecə çəkilişi','Ночная съёмка','Night shoot'),L('Tam günə əlavə, işıqlandırma ilə razılaşdırılır','Дополнение к полному дню, согласуется со светом объекта','Add-on to a full day, agreed with the building’s lighting'),180],
  [L('Arxivdən lisenziya','Лицензия из архива','Archive licence'),L('Tək kadr, redaksiya və ya veb istifadəsi','Один кадр, редакционное или веб-использование','Single frame, editorial or web use'),120]
 ],
 from:L('{p}-dən','от {p}','from {p}'),
 comH:L('Çəkiliş sifarişi','Заказ съёмки','Commission a shoot'),
 comP:L('Obyekt və vaxt haqqında bir neçə sətir yazın. İki iş günü ərzində işıq cədvəlinin ilk variantı ilə cavab veririk.','Напишите пару строк об объекте и сроках. В течение двух рабочих дней ответим первым вариантом расписания света.','Tell us a little about the building and timing. We reply within two working days with a first draft of the light timetable.'),
 fName:L('Adınız','Ваше имя','Your name'),
 fEmail:L('E-poçt','Эл. почта','Email'),
 fOrg:L('Şirkət və ya büro (istəyə görə)','Компания или бюро (необязательно)','Company or practice (optional)'),
 fType:L('Nə çəkilməlidir?','Что нужно снять?','What needs photographing?'),
 types:[['building',L('Bitmiş bina, fasadlar','Готовое здание, фасады','A finished building, façades')],['interior',L('İnteryer','Интерьер','Interior')],['hotel',L('Otel və ya restoran','Отель или ресторан','Hotel or restaurant')],['licence',L('Arxivdən kadr lisenziyası','Лицензия на кадр из архива','Licence an archive frame')]],
 choose:L('Seçin','Выберите','Choose'),
 fWhere:L('Yer','Место','Location'),
 fWhereHint:L('Şəhər və rayon, məsələn: Bakı, Bayıl','Город и район, например: Баку, Баилово','City and district, e.g. Baku, Bayil'),
 fMonth:L('İstədiyiniz ay','Желаемый месяц','Preferred month'),
 fLight:L('Hansı işıq vacibdir?','Какой свет важен?','Which light matters?'),
 fLightHint:L('Bilmirsinizsə, baxışdan sonra biz təklif edərik.','Если не знаете, мы предложим после осмотра.','If you are not sure, we will suggest one after the visit.'),
 unsure:L('Bilmirəm','Не знаю','Not sure'),
 fMsg:L('Obyekt haqqında','Об объекте','About the building'),
 fMsgHint:L('Mərtəbə sayı, fasadların istiqaməti, açılış tarixi — bildiyiniz hər şey.','Этажность, ориентация фасадов, дата открытия — всё, что знаете.','Number of floors, façade orientation, opening date — whatever you know.'),
 fConsent:L('Məlumatlarımın bu sorğuya cavab üçün istifadəsinə razıyam.','Согласен(на) на использование моих данных для ответа на этот запрос.','I agree to my details being used to reply to this enquiry.'),
 send:L('Sorğunu hazırla','Подготовить запрос','Prepare enquiry'),
 footStudio:L('Studiya','Студия','Studio'),
 footAddr:L('Bakı, Bayıl (nümunə ünvan). Yalnız görüş təyin olunmaqla.','Баку, Баилово (условный адрес). Только по записи.','Baku, Bayil (sample address). By appointment only.'),
 footNote:L('Atelier No.8 uydurma studiyadır. Fotoşəkillər CC0 lisenziyalıdır, müəlliflərinə aiddir və real yerlərdə çəkilib; altyazılar konsept üçün yazılıb.','Atelier No.8 — вымышленная студия. Фотографии под лицензией CC0 принадлежат авторам и сняты в реальных местах; подписи написаны для концепта.','Atelier No.8 is a fictional studio. The photographs are CC0, belong to their authors and were taken in real places; the captions were written for this concept.'),
 close:L('Bağla','Закрыть','Close'),prev:L('Əvvəlki','Предыдущий','Previous'),next:L('Növbəti','Следующий','Next')
};
const MONTHS=[L('Yanvar','Январь','January'),L('Fevral','Февраль','February'),L('Mart','Март','March'),L('Aprel','Апрель','April'),L('May','Май','May'),L('İyun','Июнь','June'),L('İyul','Июль','July'),L('Avqust','Август','August'),L('Sentyabr','Сентябрь','September'),L('Oktyabr','Октябрь','October'),L('Noyabr','Ноябрь','November'),L('Dekabr','Декабрь','December')];

const U={
 counter:L('{i} / {n}','{i} / {n}','{i} / {n}'),
 eName:L('Adınızı yazın.','Укажите имя.','Enter your name.'),
 eEmail:L('E-poçt ünvanını tam yazın, məsələn ad@studio.az.','Введите адрес полностью, например name@studio.az.','Enter a full email address, e.g. name@studio.az.'),
 eType:L('Nə çəkiləcəyini seçin.','Выберите, что нужно снять.','Choose what needs photographing.'),
 eWhere:L('Obyektin yerini yazın.','Укажите, где находится объект.','Enter where the building is.'),
 eMsg:L('Obyekt haqqında ən azı bir cümlə yazın (20 simvol).','Напишите хотя бы одно предложение об объекте (20 символов).','Write at least one sentence about the building (20 characters).'),
 eConsent:L('Cavab ala bilməyiniz üçün razılıq lazımdır.','Чтобы мы могли ответить, нужно согласие.','We need your consent to be able to reply.'),
 eSummary:L('Göndərməzdən əvvəl {n} sahəni düzəldin.','Перед отправкой исправьте поля: {n}.','Fix {n} field(s) before sending.'),
 okH:L('Sorğu hazırdır','Запрос готов','Your enquiry is ready'),
 okP:L('Bu demo səhifədir: sorğu heç yerə göndərilmədi. Real saytda studiya iki iş günü ərzində {email} ünvanına işıq cədvəlinin ilk variantını göndərərdi.','Это демо-страница: запрос никуда не отправлен. На настоящем сайте студия в течение двух рабочих дней прислала бы первый вариант расписания света на {email}.','This is a demo page: the enquiry was not sent anywhere. On a real site the studio would email a first draft of the light timetable to {email} within two working days.'),
 again:L('Yeni sorğu','Новый запрос','New enquiry'),
 light:{morning:L('Səhər','Утро','Morning'),noon:L('Günorta','Полдень','Midday'),evening:L('Axşamüstü','Под вечер','Late afternoon'),night:L('Gecə','Ночь','Night'),unsure:T.unsure},
 nowBand:{morning:L('səhər işığı, kölgələr uzun və qərbə düşür','утренний свет, тени длинные и падают на запад','morning light, long shadows falling west'),noon:L('günorta işığı, kölgələr qısadır','полуденный свет, тени короткие','midday light, short shadows'),evening:L('axşamüstü işıq, fasadlar istiləşir','свет под вечер, фасады теплеют','late light, façades warming up'),night:L('gecə, işıq şəhərdən gəlir','ночь, свет идёт от города','night, the light comes from the city')}
};

const SZ={full:'100vw',wide:'(min-width:900px) 75vw, 100vw',half:'(min-width:900px) 45vw, 100vw',small:'(min-width:900px) 28vw, 60vw',thumb:'(min-width:900px) 9vw, 22vw'};
const byKey=Object.fromEntries(FRAMES.map((f,i)=>[f.key,{...f,i}]));

function fig(ctx,key,cls,size,eager){
 const f=byKey[key],s=SERIES.find(x=>x.id===f.s);
 return `<figure class="a-fig ${cls}"><button type="button" class="a-zoom" data-frame="${f.i}" aria-label="${ctx.t(T.open,{p:ctx.raw(f.place),t:f.t})}">${ctx.img(`atelier/${key}`,ctx.raw(s.name)+', '+f.t+'. '+ctx.raw(f.place),{sizes:SZ[size],eager})}</button>`+
  `<figcaption><span class="a-t">${f.t}</span> ${ctx.t(f.place)}</figcaption></figure>`;
}
const essay=(ctx,s)=>`<div class="a-essay">${s.essay.map(p=>`<p>${ctx.t(p)}</p>`).join('')}</div>`;
const shead=(ctx,s,n)=>`<header class="a-shead"><p class="a-sno">${n} / 3</p><h2 id="a-s-${s.id}">${ctx.t(s.name)}</h2><p class="a-ssub">${ctx.t(s.sub)}</p></header>`;

export default {
 id:'atelier',brand:'Atelier No.8',kind:'site',
 render(ctx){
  const [mol,kolge,gece]=SERIES;
  const series=
   `<section class="a-series a-mol" aria-labelledby="a-s-mol">${shead(ctx,mol,1)}`+
    `<div class="a-row a-r1">${fig(ctx,'c3','a-p1','half')}${fig(ctx,'c2','a-p2','half')}</div>${essay(ctx,mol)}`+
    `<div class="a-row a-r2">${fig(ctx,'c4','a-w1','wide')}</div><div class="a-row a-r3">${fig(ctx,'c5','a-w2','wide')}</div>`+
    `<div class="a-row a-r4">${fig(ctx,'c6','a-sm','small')}<p class="a-margin">${ctx.t(L('17:05. Dalğa geri çəkiləndə qum bir neçə saniyə güzgü olur. Seriyanın ən kiçik kadrı ən qısa anı göstərir.','17:05. Когда волна отступает, песок на несколько секунд становится зеркалом. Самый маленький кадр серии — самый короткий момент.','17:05. As the wave pulls back, the sand is a mirror for a few seconds. The smallest frame of the series holds its shortest moment.'))}</p></div>`+
    `<div class="a-row a-r5">${fig(ctx,'c7','a-pano','full')}</div></section>`+
   `<section class="a-series a-kolge" aria-labelledby="a-s-kolge">${shead(ctx,kolge,2)}`+
    `<div class="a-row a-k1">${fig(ctx,'s7','a-t1','half')}${fig(ctx,'s1','a-t2','wide')}</div>`+
    `<div class="a-row a-k2">${fig(ctx,'s9','a-tall','small')}${fig(ctx,'s3','a-tall','small')}${fig(ctx,'s5','a-tall','small')}</div>${essay(ctx,kolge)}`+
    `<div class="a-row a-k3">${fig(ctx,'s8','a-lone','small')}</div>`+
    `<div class="a-row a-k4">${fig(ctx,'s2','a-d1','half')}${fig(ctx,'s4','a-d2','small')}${fig(ctx,'s6','a-d3','half')}</div></section>`+
   `<section class="a-series a-gece" aria-labelledby="a-s-gece">${shead(ctx,gece,3)}`+
    `<div class="a-row a-g1">${fig(ctx,'n1','a-gbig','half')}<div class="a-gcol">${fig(ctx,'n6','a-gs','small')}${essay(ctx,gece)}</div></div>`+
    `<div class="a-row a-g2">${fig(ctx,'n2','a-gs2','small')}${fig(ctx,'n4','a-gw','wide')}</div>`+
    `<div class="a-row a-g3">${fig(ctx,'n3','a-gw2','wide')}${fig(ctx,'n5','a-gs3','small')}</div></section>`;
  const mins=t=>{const [h,m]=t.split(':').map(Number);return (h<5?h+24:h)*60+m};
  const sorted=[...FRAMES].map((f,i)=>({...f,i})).sort((a,b)=>mins(a.t)-mins(b.t));
  const bands=T.bands.map(([a,b,n])=>{const items=sorted.filter(f=>mins(f.t)>=a*60&&mins(f.t)<b*60);return `<div class="a-band" data-band><h3>${ctx.t(n)} <span>${String(a).padStart(2,'0')}:00–${String(b%24).padStart(2,'0')}:00</span></h3><ul class="a-thumbs">${items.map(f=>`<li data-s="${f.s}"><button type="button" class="a-th" data-frame="${f.i}" data-ctx="index" aria-label="${ctx.t(T.open,{p:ctx.raw(f.place),t:f.t})}">${ctx.img(`atelier/${f.key}`,'',{sizes:SZ.thumb})}<span>${f.t}</span></button></li>`).join('')}</ul></div>`}).join('');
  const ticks=[];for(let h=7;h<=25;h++)ticks.push(`<span class="a-tick" data-m="${(h*60-420)/(25*60-420)}">${h%3===1?String(h%24).padStart(2,'0'):''}</span>`);
  const dots=sorted.map(f=>`<button type="button" class="a-dot a-dot-${f.s}" data-frame="${f.i}" data-ctx="index" data-s="${f.s}" data-m="${(mins(f.t)-420)/(25*60-420)}" aria-label="${ctx.t(T.open,{p:ctx.raw(f.place),t:f.t})}"></button>`).join('');
  const data={
   frames:FRAMES.map((f,i)=>({key:f.key,s:f.s,t:f.t,place:f.place,series:SERIES.find(s=>s.id===f.s).name,img:ctx.img(`atelier/${f.key}`,ctx.raw(f.place),{sizes:'(min-width:900px) 80vw, 100vw'})})),
   order:sorted.map(f=>f.i),u:U,t:{close:T.close,prev:T.prev,next:T.next},months:MONTHS,types:Object.fromEntries(T.types)
  };
  const rates=T.rates.map(([n,d,p])=>`<tr><th scope="row">${ctx.t(n)}</th><td>${ctx.t(d)}</td><td class="a-num">${ctx.t(T.from,{p:ctx.azn(p)})}</td></tr>`).join('');
  const lights=['morning','noon','evening','night','unsure'];
  return `<div class="a-site">`+
  `<header class="a-mast"><a class="a-logo" href="#top">Atelier <span>No.8</span></a><nav aria-label="Atelier No.8">${T.nav.map(([h,l])=>`<a href="${h}">${ctx.t(l)}</a>`).join('')}</nav></header>`+
  `<section class="a-intro" aria-labelledby="a-h1"><h1 id="a-h1">${ctx.t(T.h1)}</h1><div class="a-lede"><p>${ctx.t(T.lede)}</p><p class="a-now" id="a-now" hidden><span>${ctx.t(T.now)}</span> <b id="a-clock"></b> <span id="a-band"></span></p></div></section>`+
  `<figure class="a-open"><button type="button" class="a-zoom" data-frame="0" aria-label="${ctx.t(T.open,{p:ctx.raw(byKey.c1.place),t:'08:10'})}">${ctx.img('atelier/c1',ctx.raw(T.openCap),{sizes:'100vw',eager:true})}</button><figcaption><span class="a-t">08:10</span> ${ctx.t(byKey.c1.place)}</figcaption></figure>`+
  `<div id="series" class="a-seriesall"><h2 class="sr-only">${ctx.t(T.seriesH)}</h2>${series}</div>`+
  `<section class="a-index" id="index" aria-labelledby="a-ih"><div class="a-ihead"><h2 id="a-ih">${ctx.t(T.idxH)}</h2><p>${ctx.t(T.idxP,{n:FRAMES.length})}</p></div>`+
   `<fieldset class="a-filter"><legend class="sr-only">${ctx.t(T.seriesH)}</legend>${[['all',T.all],...SERIES.map(s=>[s.id,s.name])].map(([k,n],i)=>`<label><input type="radio" name="a-s" value="${k}"${i?'':' checked'}><span>${ctx.t(n)}</span></label>`).join('')}</fieldset>`+
   `<div class="a-ruler" aria-hidden="false"><div class="a-rline">${ticks.join('')}${dots}<i class="a-nowline" id="a-nowline" hidden></i></div></div>`+
   `<div class="a-bands">${bands}</div></section>`+
  `<section class="a-method" id="method" aria-labelledby="a-mh"><div class="a-mhead"><h2 id="a-mh">${ctx.t(T.methH)}</h2><p>${ctx.t(T.methP)}</p></div><ol class="a-steps">${T.steps.map(([h,p])=>`<li><h3>${ctx.t(h)}</h3><p>${ctx.t(p)}</p></li>`).join('')}</ol>`+
   `<div class="a-rates"><h3>${ctx.t(T.ratesH)}</h3><table><tbody>${rates}</tbody></table><p class="a-note">${ctx.t(T.ratesNote)}</p></div></section>`+
  `<section class="a-com" id="commission" aria-labelledby="a-ch"><div class="a-chead"><h2 id="a-ch">${ctx.t(T.comH)}</h2><p>${ctx.t(T.comP)}</p></div>`+
   `<form class="a-form" id="a-form" novalidate><p class="a-err" id="a-err" role="alert" hidden></p>`+
    `<div class="a-f"><label for="a-name">${ctx.t(T.fName)}</label><input id="a-name" name="name" autocomplete="name" required aria-describedby="a-name-e"><p class="a-fe" id="a-name-e" hidden></p></div>`+
    `<div class="a-f"><label for="a-email">${ctx.t(T.fEmail)}</label><input id="a-email" name="email" type="email" autocomplete="email" required aria-describedby="a-email-e"><p class="a-fe" id="a-email-e" hidden></p></div>`+
    `<div class="a-f"><label for="a-org">${ctx.t(T.fOrg)}</label><input id="a-org" name="org" autocomplete="organization"></div>`+
    `<div class="a-f"><label for="a-type">${ctx.t(T.fType)}</label><select id="a-type" name="type" required aria-describedby="a-type-e"><option value="">${ctx.t(T.choose)}</option>${T.types.map(([k,n])=>`<option value="${k}">${ctx.t(n)}</option>`).join('')}</select><p class="a-fe" id="a-type-e" hidden></p></div>`+
    `<div class="a-f"><label for="a-where">${ctx.t(T.fWhere)}</label><input id="a-where" name="where" required aria-describedby="a-where-h a-where-e"><p class="a-hint" id="a-where-h">${ctx.t(T.fWhereHint)}</p><p class="a-fe" id="a-where-e" hidden></p></div>`+
    `<div class="a-f"><label for="a-month">${ctx.t(T.fMonth)}</label><select id="a-month" name="month" data-months></select></div>`+
    `<fieldset class="a-f a-light"><legend>${ctx.t(T.fLight)}</legend><div>${lights.map((k,i)=>`<label><input type="radio" name="light" value="${k}"${k==='unsure'?' checked':''}><span>${ctx.t(U.light[k])}</span></label>`).join('')}</div><p class="a-hint">${ctx.t(T.fLightHint)}</p></fieldset>`+
    `<div class="a-f a-wide"><label for="a-msg">${ctx.t(T.fMsg)}</label><textarea id="a-msg" name="msg" rows="4" required aria-describedby="a-msg-h a-msg-e"></textarea><p class="a-hint" id="a-msg-h">${ctx.t(T.fMsgHint)}</p><p class="a-fe" id="a-msg-e" hidden></p></div>`+
    `<div class="a-f a-wide a-check"><label><input type="checkbox" id="a-consent" name="consent" aria-describedby="a-consent-e"> <span>${ctx.t(T.fConsent)}</span></label><p class="a-fe" id="a-consent-e" hidden></p></div>`+
    `<div class="a-wide"><button type="submit" class="a-btn">${ctx.t(T.send)}</button></div>`+
   `</form><div class="a-ok" id="a-ok" tabindex="-1" hidden></div></section>`+
  `<footer class="a-foot"><div><p class="a-logo">Atelier <span>No.8</span></p><p>${ctx.t(T.footNote)}</p></div><div><h3>${ctx.t(T.footStudio)}</h3><p>${ctx.t(T.footAddr)}</p></div><div class="a-cred">${ctx.credits(FRAMES.map(f=>`atelier/${f.key}`))}</div></footer>`+
  `</div>`+
  `<dialog class="a-lb" id="a-lb" aria-label="${ctx.t(T.seriesH)}"><div class="a-lbin"><div class="a-lbimg" id="a-lbimg"></div><div class="a-lbbar"><p class="a-lbcap" id="a-lbcap" aria-live="polite"></p><p class="a-lbn" id="a-lbn"></p><div class="a-lbctl"><button type="button" data-lb="-1" aria-label="${ctx.t(T.prev)}">←</button><button type="button" data-lb="1" aria-label="${ctx.t(T.next)}">→</button><button type="button" data-lb="x" aria-label="${ctx.t(T.close)}">×</button></div></div></div></dialog>`+
  ctx.data(data);
 }
};
