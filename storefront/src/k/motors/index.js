// AutoLane — inspected used-car marketplace concept. Static render per language + runtime data for app.js.
import {L,assets} from '../kit.js';
import {CARS,SYSTEMS,TOTAL,ADV,FUEL,GEAR,BODY,DRIVE,HUB,COLOUR} from './data.js';
import {esc,fmt,card,strip,filterCars,SORTS,ico} from './tpl.js';

const S={
 navCars:L('Avtomobillər','Автомобили','Cars'),navInspection:L('Yoxlama','Проверка','Inspection'),navFinance:L('Kredit hesabı','Расчёт кредита','Finance'),navSaved:L('Saxlanılanlar','Сохранённые','Saved'),navCompare:L('Müqayisə','Сравнение','Compare'),
 mainNav:L('Əsas menyu','Главное меню','Main menu'),
 heroTitle:L('Satışdakı hər avtomobil 120 nöqtəli yoxlamadan keçib.','Каждый автомобиль в продаже прошёл проверку по 120 пунктам.','Every car on sale has passed a 120-point inspection.'),
 heroLead:L('Hesabatı alışdan əvvəl oxuyun: nə qaydasındadır, nəyə tezliklə baxmaq lazımdır və neçəyə başa gələ bilər. Yoxlamadan keçməyən avtomobil satışa çıxarılmır.','Прочитайте отчёт до покупки: что в порядке, что скоро потребует внимания и во сколько это обойдётся. Автомобили, не прошедшие проверку, в продажу не выходят.','Read the report before you buy: what is fine, what needs attention soon and what it may cost. Cars that fail the inspection are never listed.'),
 searchTitle:L('Avtomobil axtarışı','Поиск автомобиля','Find a car'),
 make:L('Marka','Марка','Make'),model:L('Model','Модель','Model'),anyMake:L('İstənilən marka','Любая марка','Any make'),anyModel:L('İstənilən model','Любая модель','Any model'),pickMakeFirst:L('Əvvəlcə marka seçin','Сначала выберите марку','Choose a make first'),
 yearFrom:L('İl, ən azı','Год, от','Year from'),priceMax:L('Qiymət, ən çox','Цена, до','Price up to'),kmMax:L('Yürüş, ən çox','Пробег, до','Mileage up to'),any:L('Fərqi yoxdur','Не важно','Any'),
 fuel:L('Yanacaq','Топливо','Fuel'),gearbox:L('Sürətlər qutusu','Коробка передач','Gearbox'),anyGear:L('Hər ikisi','Любая','Either'),
 showN:L('{n} avtomobili göstər','Показать автомобили: {n}','Show {n} cars'),showNone:L('Uyğun avtomobil yoxdur','Подходящих автомобилей нет','No matching cars'),reset:L('Sıfırla','Сбросить','Reset'),
 upTo:L('{v}-dək','до {v}','up to {v}'),from:L('{v}-dən','от {v}','from {v}'),
 heroCaption:L('Bu həftə yoxlanılıb','Проверен на этой неделе','Inspected this week'),readReport:L('Hesabatı oxu','Читать отчёт','Read the report'),
 resultsTitle:L('Satışda olan avtomobillər','Автомобили в продаже','Cars on sale'),
 countN:L('{n} avtomobil','Автомобилей: {n}','{n} cars'),sortBy:L('Sıralama','Сортировка','Sort by'),
 sortRec:L('Ən az tövsiyə','Меньше рекомендаций','Fewest advisories'),sortPriceAsc:L('Əvvəlcə ucuz','Сначала дешевле','Price, low to high'),sortPriceDesc:L('Əvvəlcə bahalı','Сначала дороже','Price, high to low'),sortYear:L('Əvvəlcə yeni','Сначала новые','Newest first'),sortKm:L('Ən az yürüş','Наименьший пробег','Lowest mileage'),
 activeFilters:L('Seçilmiş filtrlər','Выбранные фильтры','Active filters'),removeFilter:L('{f} filtrini sil','Убрать фильтр {f}','Remove filter {f}'),
 monthlyFoot:L('* Aylıq məbləğ indikativdir: 30% ilkin ödəniş, 36 ay, illik 16%. Kredit təklifi deyil.','* Ежемесячный платёж ориентировочный: взнос 30%, 36 месяцев, 16% годовых. Это не кредитное предложение.','* Monthly figures are indicative: 30% deposit, 36 months, 16% a year. Not a credit offer.'),
 emptyTitle:L('Bu filtrlərlə avtomobil yoxdur','С такими фильтрами автомобилей нет','No cars match these filters'),
 emptyBody:L('Aşağıdakı filtrlərdən birini götürün; mötərizədə neçə avtomobil görünəcəyi yazılıb.','Уберите один из фильтров ниже: в скобках указано, сколько автомобилей появится.','Drop one of the filters below; the number shows how many cars would appear.'),
 widen:L('{f} olmadan ({n})','Без «{f}» ({n})','Without {f} ({n})'),
 year:L('İl','Год','Year'),mileage:L('Yürüş','Пробег','Mileage'),body:L('Ban','Кузов','Body'),engine:L('Mühərrik','Двигатель','Engine'),power:L('Güc','Мощность','Power'),drive:L('Ötürücü','Привод','Drive'),consumption:L('Sərfiyyat','Расход','Consumption'),owners:L('Sahiblər','Владельцы','Owners'),colour:L('Rəng','Цвет','Colour'),centre:L('Mərkəz','Центр','Centre'),
 price:L('Qiymət','Цена','Price'),
 hpVal:L('{hp} a.g.','{hp} л.с.','{hp} hp'),lVal:L('{v} L/100 km','{v} л/100 км','{v} L/100 km'),kwhVal:L('{v} kVt·s/100 km','{v} кВт·ч/100 км','{v} kWh/100 km'),evMotor:L('Elektrik mühərriki','Электромотор','Electric motor'),
 perMonthStar:L('≈ {sum}/ay*','≈ {sum}/мес*','≈ {sum}/mo*'),compare:L('Müqayisə','Сравнить','Compare'),saveCar:L('{car} avtomobilini saxla','Сохранить {car}','Save {car}'),unsaveCar:L('{car} saxlanılanlardan çıxar','Убрать {car} из сохранённых','Remove {car} from saved'),
 stripLabel:L('{total} yoxlamadan {passed} keçib, {adv} tövsiyə','Пройдено {passed} из {total}, рекомендаций: {adv}','{passed} of {total} checks passed, {adv} advisories'),
 stripCap:L('{passed}/{total} keçib, {adv} tövsiyə','{passed}/{total} пройдено, рекомендаций: {adv}','{passed}/{total} passed, {adv} advisory'),stripClean:L('{total}/{total} keçib, tövsiyə yoxdur','{total}/{total} пройдено, без рекомендаций','{total}/{total} passed, no advisories'),
 backToResults:L('Nəticələrə qayıt','Назад к результатам','Back to results'),stockNo:L('Stok № {id}','Сток № {id}','Stock no. {id}'),galleryLabel:L('Şəkillər','Фотографии','Photos'),photoN:L('Şəkil {n}/{total}','Фото {n} из {total}','Photo {n} of {total}'),
 specTitle:L('Texniki göstəricilər','Характеристики','Specification'),
 reportTitle:L('Yoxlama hesabatı','Отчёт о проверке','Inspection report'),reportMeta:L('{date} tarixində, {hub}','{date}, {hub}','{date}, {hub}'),
 treadCap:L('Protektor dərinliyi; 4 mm-dən az olan təkər tövsiyə kimi qeyd olunur.','Глубина протектора; шина менее 4 мм отмечается как рекомендация.','Tread depth; any tyre under 4 mm is flagged as an advisory.'),
 treadAria:L('Protektor: ön sol {fl} mm, ön sağ {fr} mm, arxa sol {rl} mm, arxa sağ {rr} mm','Протектор: перед. левое {fl} мм, перед. правое {fr} мм, задн. левое {rl} мм, задн. правое {rr} мм','Tread: front left {fl} mm, front right {fr} mm, rear left {rl} mm, rear right {rr} mm'),
 front:L('Ön','Перед','Front'),fl:L('Ön sol','Пер. лев.','Front left'),fr:L('Ön sağ','Пер. прав.','Front right'),rl:L('Arxa sol','Зад. лев.','Rear left'),rr:L('Arxa sağ','Зад. прав.','Rear right'),km:L('km','км','km'),mm:L('mm','мм','mm'),
 padsLabel:L('Əyləc bəndləri, ön / arxa','Колодки, перед / зад','Brake pads, front / rear'),padsVal:L('{f} / {r} mm','{f} / {r} мм','{f} / {r} mm'),
 paintLabel:L('Lak qatı','Толщина ЛКП','Paint thickness'),paintVal:L('{a}–{b} µm','{a}–{b} мкм','{a}–{b} µm'),
 batteryLabel:L('12V akkumulyator sağlamlığı','Здоровье аккумулятора 12V','12V battery health'),tractionLabel:L('Dartı batareyası sağlamlığı','Здоровье тяговой батареи','Traction battery health'),
 obdLabel:L('Aktiv xəta kodları','Активные коды ошибок','Active fault codes'),obdVal:L('Yoxdur','Нет','None'),
 sysOk:L('{n}/{total} keçib','{n}/{total} пройдено','{n}/{total} passed'),sysAdv:L('{n}/{total} keçib, {adv} tövsiyə','{n}/{total} пройдено, рекомендаций: {adv}','{n}/{total} passed, {adv} advisory'),
 sysMore:L('Hesabatda bu bölmənin daha {n} yoxlaması var; hamısı keçib.','В этом разделе ещё {n} проверок, все пройдены.','{n} more checks in this section, all passed.'),
 pass:L('Keçib','Пройдено','Passed'),advisory:L('Tövsiyə','Рекомендация','Advisory'),
 reportNote:L('Tövsiyə nasazlıq deyil: avtomobil yoxlamadan keçib, amma qeyd olunan hissəyə yaxın vaxtda baxılmalıdır. Hesabat 60 gün etibarlıdır.','Рекомендация — не неисправность: автомобиль прошёл проверку, но отмеченному узлу скоро понадобится внимание. Отчёт действителен 60 дней.','An advisory is not a fault: the car passed, but the item noted will need attention soon. Reports are valid for 60 days.'),
 priceNote:L('Qiymətə yoxlama, 3 ay mühərrik və transmissiya zəmanəti daxildir.','В цену входят проверка и 3 месяца гарантии на двигатель и КПП.','Price includes the inspection and a 3-month engine and gearbox warranty.'),
 save:L('Saxla','Сохранить','Save'),saved:L('Saxlanılıb','Сохранено','Saved'),addCompare:L('Müqayisəyə əlavə et','Добавить к сравнению','Add to compare'),inCompare:L('Müqayisədədir','В сравнении','In compare'),
 calcTitle:L('İndikativ aylıq ödəniş','Ориентировочный платёж','Indicative monthly payment'),deposit:L('İlkin ödəniş','Первый взнос','Deposit'),term:L('Müddət','Срок','Term'),months:L('{n} ay','{n} мес.','{n} mo'),
 rate:L('İllik faiz dərəcəsi','Годовая ставка','Yearly interest rate'),rateHelp:L('Bankınızın təklif etdiyi dərəcəni yazın. 16% yalnız nümunədir.','Введите ставку, которую предлагает ваш банк. 16% — только пример.','Enter the rate your bank offers you. 16% is only an example.'),
 rateErr:L('0 ilə 40 arasında dərəcə yazın.','Введите ставку от 0 до 40.','Enter a rate between 0 and 40.'),
 calcMonthly:L('Ayda','В месяц','Per month'),calcLoan:L('Kredit məbləği','Сумма кредита','Amount borrowed'),calcInterest:L('Ümumi faiz','Всего процентов','Total interest'),calcTotal:L('Ümumi ödəniş','Всего к оплате','Total repaid'),
 calcNote:L('Bu, sadə annuitet hesablamasıdır, kredit təklifi və ya məsləhət deyil. AutoLane kredit vermir; real şərtləri bank müəyyən edir.','Это простой аннуитетный расчёт, а не кредитное предложение или совет. AutoLane не выдаёт кредиты; реальные условия определяет банк.','This is a simple annuity calculation, not a credit offer or advice. AutoLane does not lend; a bank sets the real terms.'),
 viewTitle:L('Baxışa yazıl','Записаться на осмотр','Book a viewing'),viewLead:L('Avtomobil {hub} ərazisindədir. Gəlməmişdən əvvəl hesabatın çap nüsxəsi hazırlanır.','Автомобиль находится: {hub}. К вашему приезду подготовят печатный отчёт.','The car is at {hub}. A printed copy of the report will be ready when you arrive.'),
 yourName:L('Adınız','Ваше имя','Your name'),phone:L('Telefon','Телефон','Phone'),day:L('Gün','День','Day'),chooseDay:L('Gün seçin','Выберите день','Choose a day'),time:L('Vaxt','Время','Time'),sendRequest:L('Baxış sorğusu göndər','Отправить запрос','Request viewing'),
 errName:L('Adınızı yazın.','Укажите имя.','Enter your name.'),errPhone:L('Nömrəni +994 və 9 rəqəmlə yazın, məsələn +994 50 123 45 67.','Введите номер с +994 и 9 цифрами, например +994 50 123 45 67.','Enter the number with +994 and 9 digits, e.g. +994 50 123 45 67.'),errDay:L('Gün seçin.','Выберите день.','Choose a day.'),
 viewDone:L('Baxış sorğusu qeydə alındı: {car}, {day}, {slot}. Bu demodur, heç bir sorğu göndərilmədi.','Запрос на осмотр записан: {car}, {day}, {slot}. Это демо, ничего не отправлено.','Viewing request recorded: {car}, {day}, {slot}. This is a demo; nothing was sent.'),
 compareTitle:L('Müqayisə','Сравнение','Compare'),compareLead:L('Hər sətirdə ən yaxşı göstərici işarələnib.','В каждой строке отмечено лучшее значение.','The best value in each row is marked.'),
 compareEmpty:L('Müqayisə üçün ən azı iki avtomobil seçin','Выберите хотя бы два автомобиля для сравнения','Pick at least two cars to compare'),compareEmptyBody:L('Hazırda seçilib: {n}. Kartlardakı “Müqayisə” qutusunu işarələyin; ən çox 3 avtomobil.','Сейчас выбрано: {n}. Отметьте «Сравнить» на карточках, максимум 3 автомобиля.','Selected now: {n}. Tick “Compare” on the cards; up to 3 cars.'),
 pickCars:L('Avtomobillərə bax','Смотреть автомобили','Browse cars'),parameter:L('Göstərici','Параметр','Specification'),perMonthRow:L('İndikativ aylıq','Ориентир. в месяц','Indicative monthly'),checksPassed:L('Keçən yoxlamalar','Пройдено проверок','Checks passed'),advisories:L('Tövsiyələr','Рекомендации','Advisories'),none:L('Yoxdur','Нет','None'),bestInRow:L('ən yaxşı','лучшее','best'),
 removeFromCompare:L('{car} müqayisədən çıxar','Убрать {car} из сравнения','Remove {car} from compare'),
 compareNote:L('Aylıq məbləğ: {dep}% ilkin ödəniş, {term} ay, illik {rate}% ilə indikativ hesab.','Платёж рассчитан ориентировочно: взнос {dep}%, {term} мес., {rate}% годовых.','Monthly figure is indicative: {dep}% deposit, {term} months, {rate}% a year.'),
 compareLimit:L('Müqayisəyə ən çox 3 avtomobil əlavə etmək olar. Birini çıxarın.','В сравнение можно добавить не более 3 автомобилей. Уберите один.','You can compare up to 3 cars. Remove one first.'),
 trayLabel:L('Müqayisə üçün seçilənlər','Выбрано для сравнения','Selected for comparison'),trayN:L('{n} / 3 seçilib','Выбрано {n} из 3','{n} of 3 selected'),trayGo:L('Müqayisə et','Сравнить','Compare'),trayClear:L('Təmizlə','Очистить','Clear'),
 savedTitle:L('Saxlanılan avtomobillər','Сохранённые автомобили','Saved cars'),savedEmpty:L('Hələ heç nə saxlamamısınız','Вы пока ничего не сохранили','Nothing saved yet'),savedEmptyBody:L('Kartdakı ürək düyməsi avtomobili bu siyahıya əlavə edir. Siyahı yalnız bu brauzerdə saxlanılır.','Кнопка с сердцем на карточке добавляет автомобиль в этот список. Список хранится только в этом браузере.','The heart on a card adds the car here. The list is kept in this browser only.'),
 savedToast:L('{car} saxlanıldı','{car} сохранён','{car} saved'),unsavedToast:L('{car} saxlanılanlardan çıxarıldı','{car} удалён из сохранённых','{car} removed from saved'),
 inspTitle:L('Yoxlama necə aparılır','Как проходит проверка','How the inspection works'),
 inspLead:L('Hər avtomobil eyni 120 nöqtəli siyahı ilə yoxlanılır. Zolağın uzunluğu bölmədəki yoxlamaların sayıdır.','Каждый автомобиль проверяется по одному и тому же списку из 120 пунктов. Длина полосы — число проверок в разделе.','Every car is checked against the same 120-point list. Bar length is the number of checks in each section.'),
 insp1Alt:L('Qaldırıcıda avtomobilin altından yağ boşaldılır','Слив масла из-под автомобиля на подъёмнике','Oil being drained from a car on a lift'),insp1Cap:L('Altlıq və sızmalar qaldırıcıda yoxlanılır.','Днище и подтёки проверяются на подъёмнике.','Underbody and leaks are checked on a lift.'),
 insp2Alt:L('Gecə işıqlanan cihazlar paneli','Подсвеченная приборная панель','Illuminated instrument cluster'),insp2Cap:L('Cihazlar panelindəki xəbərdarlıqlar və yürüş qeydə alınır.','Фиксируются предупреждения на приборной панели и пробег.','Dashboard warnings and the odometer are logged.'),
 inspChecks:L('{n} yoxlama','{n} проверок','{n} checks'),
 sysDesc:{
  body:L('13 panelin lak qatı ölçülür; rənglənmiş hissə və zərbə izləri hesabatda göstərilir.','Измеряется ЛКП 13 панелей; перекрас и следы ударов указываются в отчёте.','Paint is measured on 13 panels; repaints and impact marks go in the report.'),
  tyres:L('Hər təkərin protektoru, DOT yaşı, bəndlər və disklər ölçülür.','Протектор каждой шины, возраст по DOT, колодки и диски.','Tread on every tyre, DOT age, pads and discs.'),
  engine:L('Soyuq işəsalma, OBD skaneri, sızmalar və servis kitabçası.','Холодный пуск, сканер OBD, подтёки и сервисная книжка.','Cold start, OBD scan, leaks and the service book.'),
  electrics:L('Akkumulyator testi, işıqlar, kameralar, kondisioner gücü.','Тест аккумулятора, свет, камеры, мощность кондиционера.','Battery test, lights, cameras and air-con output.'),
  interior:L('Kəmərlər, SRS, ISOFIX, yürüşün servis qeydləri ilə uyğunluğu.','Ремни, SRS, ISOFIX, сверка пробега с сервисными записями.','Belts, airbags, ISOFIX and mileage checked against service records.'),
  road:L('Şəhər və magistralda 25 km: sükan, əyləc, asqı, qutu.','25 км по городу и трассе: руль, тормоза, подвеска, коробка.','25 km of city and highway: steering, brakes, suspension, gearbox.')},
 stepsTitle:L('Avtomobil satışa necə çıxır','Как автомобиль попадает в продажу','How a car gets listed'),
 steps:[
  [L('Mərkəzə qəbul','Приём в центре','Check-in at a centre'),L('Satıcı avtomobili Bakı, Gəncə və ya Sumqayıt mərkəzinə gətirir; sənədlər və VIN yoxlanılır.','Продавец привозит автомобиль в центр в Баку, Гяндже или Сумгайыте; проверяются документы и VIN.','The seller brings the car to the Bakı, Gəncə or Sumqayıt centre; papers and VIN are checked.')],
  [L('İki yarım saatlıq yoxlama','Проверка за два с половиной часа','A two-and-a-half-hour inspection'),L('Mexanik 120 nöqtəni keçir və ölçmələri planşetə yazır; yol testi daxildir.','Механик проходит 120 пунктов и заносит замеры в планшет, включая тест-драйв.','A mechanic works through all 120 points and logs measurements, road test included.')],
  [L('Hesabat elanla dərc olunur','Отчёт публикуется вместе с объявлением','The report is published with the listing'),L('Uğursuz bənd varsa, avtomobil təmirdən sonra yenidən yoxlanılır və ya satışa çıxmır.','Если есть непройденный пункт, автомобиль проверяют заново после ремонта или не выставляют.','If any item fails, the car is re-inspected after repair or not listed at all.')],
  [L('60 gündən sonra yenilənir','Обновление через 60 дней','Renewed after 60 days'),L('Satılmamış avtomobilin hesabatı 60 gündə bir yenidən aparılır.','Отчёт непроданного автомобиля обновляется каждые 60 дней.','An unsold car is re-inspected every 60 days.')]],
 finTitle:L('Aylıq ödəniş necə hesablanır','Как считается ежемесячный платёж','How the monthly figure is worked out'),
 finBody:L('Kalkulyator standart annuitet düsturunu istifadə edir: kredit məbləği, sizin daxil etdiyiniz illik dərəcə və seçdiyiniz müddət. Komissiya, sığorta və bank xərcləri daxil deyil, ona görə nəticə yalnız istiqamət üçündür.','Калькулятор использует стандартную аннуитетную формулу: сумма кредита, введённая вами годовая ставка и выбранный срок. Комиссии, страховка и банковские сборы не учитываются, поэтому результат лишь ориентир.','The calculator uses the standard annuity formula: the amount borrowed, the yearly rate you enter and the term you choose. Fees, insurance and bank charges are not included, so the result is only a guide.'),
 finFormula:L('Aylıq = K × r ÷ (1 − (1 + r)^−n), burada K kredit məbləği, r aylıq dərəcə, n ayların sayıdır.','Платёж = K × r ÷ (1 − (1 + r)^−n), где K — сумма кредита, r — месячная ставка, n — число месяцев.','Monthly = K × r ÷ (1 − (1 + r)^−n), where K is the amount borrowed, r the monthly rate and n the number of months.'),
 finExample:L('Nümunə: {car}, {price}, 30% ilkin ödəniş, 36 ay, illik 16% → ayda {m}.','Пример: {car}, {price}, взнос 30%, 36 мес., 16% годовых → {m} в месяц.','Example: {car}, {price}, 30% deposit, 36 months, 16% a year → {m} a month.'),
 centresTitle:L('Mərkəzlər','Центры','Centres'),
 centres:[[L('Bakı, Xətai mərkəzi','Баку, центр Хатаи','Bakı, Xətai centre'),L('Nümunə ünvan, Xətai rayonu. Hər gün 09:00–20:00.','Пример адреса, Хатаинский район. Ежедневно 09:00–20:00.','Sample address, Xətai district. Daily 09:00–20:00.')],[L('Gəncə mərkəzi','Центр Гянджа','Gəncə centre'),L('Nümunə ünvan, Kəpəz rayonu. B.e.–Ş. 10:00–19:00.','Пример адреса, Кяпазский район. Пн–Сб 10:00–19:00.','Sample address, Kəpəz district. Mon–Sat 10:00–19:00.')],[L('Sumqayıt mərkəzi','Центр Сумгайыт','Sumqayıt centre'),L('Nümunə ünvan, 9-cu mikrorayon. B.e.–Ş. 10:00–19:00.','Пример адреса, 9-й микрорайон. Пн–Сб 10:00–19:00.','Sample address, 9th microdistrict. Mon–Sat 10:00–19:00.')]],
 footNote:L('AutoLane uydurma markadır; avtomobillər, qiymətlər və hesabatlar nümunədir. Saxlama və müqayisə yalnız bu brauzerdə işləyir.','AutoLane — вымышленный бренд; автомобили, цены и отчёты — примеры. Сохранение и сравнение работают только в этом браузере.','AutoLane is a fictional brand; cars, prices and reports are samples. Saving and comparing work in this browser only.'),
 heroImgNote:L('Baş şəkil sahibinin təqdim etdiyi generasiya olunmuş təsvirdir.','Главное изображение — сгенерированная иллюстрация, предоставленная владельцем.','The lead image is a generated illustration supplied by the site owner.'),
 dayFmt:L('{d}','{d}','{d}')
};

const T=(az,ru,en)=>L(az,ru,en);
const ALT={
 hero:T('Boz krossover studiyada, ön tərəfdən','Серый кроссовер в студии, вид спереди','Grey crossover in a studio, front three-quarter view')
};

export default {id:'motors',brand:'AutoLane',kind:'site',render(ctx){
 const t=leaf=>ctx.t(leaf),r=x=>ctx.resolve(x);
 const F=fmt(ctx.locale);
 const has=k=>!!assets['motors/'+k];
 // Card image and gallery per car. The hero car uses the owner-supplied image directly.
 const altFor=c=>`${c.make} ${c.model}, ${c.year}`;
 const img={},gallery={};
 for(const c of CARS){
  if(c.photo==='hero'){
   const h=`<img src="/assets/showroom/motors.webp" width="1200" height="900" alt="${esc(altFor(c))}" loading="lazy" decoding="async">`;
   img[c.id]=h;gallery[c.id]=[h];continue;
  }
  img[c.id]=has(c.photo)?ctx.img('motors/'+c.photo,altFor(c),{sizes:'(max-width:700px) 100vw, 400px'}):`<span class="al-nophoto">${esc(c.make)}</span>`;
  gallery[c.id]=['','-a','-b'].filter(s=>has(c.photo+s)).map((s,i)=>ctx.img('motors/'+c.photo+s,`${altFor(c)}, ${ctx.raw(S.photoN,{n:i+1,total:3})}`,{sizes:'(max-width:900px) 100vw, 760px'}));
 }
 const D={lang:ctx.lang,locale:ctx.locale,total:TOTAL,S:r(S),cars:CARS,sys:r(SYSTEMS),adv:r(ADV),fuel:r(FUEL),gear:r(GEAR),body:r(BODY),drive:r(DRIVE),hub:r(HUB),colour:r(COLOUR),img,gallery};
 D.F=F;
 const Sx=D.S,st={saved:new Set(),compare:[]};
 const makes=[...new Set(CARS.map(c=>c.make))].sort();
 const opt=(v,l,sel)=>`<option value="${v}"${sel?' selected':''}>${esc(l)}</option>`;
 const hero=CARS[0];
 const sorted=[...CARS].sort(SORTS.rec);
 const ex=CARS[1],exM=(()=>{const loan=ex.price*.7,rr=16/1200;return loan*rr/(1-Math.pow(1+rr,-36))})();
 const sysBars=D.sys.map(s=>`<li><div class="al-ib"><span class="al-ib-bar" data-n="${s.n}"><i></i></span><b>${esc(s.name)}</b><em>${ctx.raw(S.inspChecks,{n:s.n})}</em></div><p>${t(S.sysDesc[s.id])}</p></li>`).join('');
 const logo=`<svg class="al-logo-mark" viewBox="0 0 40 24" aria-hidden="true"><path d="M2 22 14 2M38 22 26 2M20 4v4M20 12v4M20 20v2"/></svg>`;
 const html=`<div class="al-site">
<header class="al-top"><div class="al-wrap al-top-in"><a class="al-logo" href="#search">${logo}<span>AutoLane</span></a>
<nav aria-label="${t(S.mainNav)}"><a href="#cars">${t(S.navCars)}</a><a href="#inspection">${t(S.navInspection)}</a><a href="#finance">${t(S.navFinance)}</a><a href="#saved" class="al-nav-count">${ico.heart}<span>${t(S.navSaved)}</span><b data-count="saved">0</b></a><a href="#compare" class="al-nav-count"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h7v12H4zM13 6h7v12h-7z"/></svg><span>${t(S.navCompare)}</span><b data-count="compare">0</b></a></nav></div></header>
<div class="al-home" data-home>
<section class="al-hero" id="search" aria-labelledby="al-h1"><div class="al-wrap al-hero-in">
<div class="al-hero-copy"><h1 id="al-h1">${t(S.heroTitle)}</h1><p class="al-lead">${t(S.heroLead)}</p>
<form class="al-search" id="al-search" role="search" aria-label="${t(S.searchTitle)}">
<div class="al-search-row">
<label class="al-f"><span>${t(S.make)}</span><select name="make">${opt('',Sx.anyMake)}${makes.map(m=>opt(m,m)).join('')}</select></label>
<label class="al-f"><span>${t(S.model)}</span><select name="model" disabled>${opt('',Sx.pickMakeFirst)}</select></label>
<label class="al-f"><span>${t(S.yearFrom)}</span><select name="year">${opt('',Sx.any)}${[2016,2017,2018,2019,2020,2021,2022,2023].map(y=>opt(y,ctx.raw(S.from,{v:y}))).join('')}</select></label>
<label class="al-f"><span>${t(S.priceMax)}</span><select name="price">${opt('',Sx.any)}${[20000,25000,30000,40000,50000].map(p=>opt(p,ctx.raw(S.upTo,{v:F.azn(p)}))).join('')}</select></label>
<label class="al-f"><span>${t(S.kmMax)}</span><select name="km">${opt('',Sx.any)}${[30000,60000,100000,150000].map(k=>opt(k,ctx.raw(S.upTo,{v:F.num(k)+' '+Sx.km}))).join('')}</select></label>
<label class="al-f"><span>${t(S.fuel)}</span><select name="fuel">${opt('',Sx.any)}${Object.keys(FUEL).map(k=>opt(k,D.fuel[k])).join('')}</select></label>
</div>
<fieldset class="al-seg"><legend>${t(S.gearbox)}</legend>${[['',Sx.anyGear],['auto',D.gear.auto],['manual',D.gear.manual]].map(([v,l],i)=>`<label><input type="radio" name="gear" value="${v}"${i===0?' checked':''}><span>${esc(l)}</span></label>`).join('')}</fieldset>
<div class="al-search-go"><button class="al-btn al-btn-main" type="submit" data-show>${ctx.raw(S.showN,{n:CARS.length})}</button><button class="al-link" type="reset">${t(S.reset)}</button></div>
</form></div>
<figure class="al-hero-fig"><img src="/assets/showroom/motors.webp" width="1200" height="900" alt="${t(ALT.hero)}" fetchpriority="high" decoding="async">
<figcaption class="al-hero-tag"><span class="al-hero-k">${t(S.heroCaption)}</span><b>${esc(hero.make)} ${esc(hero.model)}, ${hero.year}</b><span>${F.num(hero.km)} ${Sx.km}, ${F.azn(hero.price)}</span>${strip(hero,D)}<a href="#car/${hero.id}">${t(S.readReport)}</a></figcaption></figure>
</div></section>
<section class="al-results" id="cars" aria-labelledby="res-h"><div class="al-wrap">
<div class="al-res-head"><h2 id="res-h">${t(S.resultsTitle)}</h2><p class="al-count" data-count-res aria-live="polite">${ctx.raw(S.countN,{n:CARS.length})}</p>
<label class="al-sort"><span>${t(S.sortBy)}</span><select name="sort" form="al-search">${[['rec',S.sortRec],['priceAsc',S.sortPriceAsc],['priceDesc',S.sortPriceDesc],['year',S.sortYear],['km',S.sortKm]].map(([v,l])=>opt(v,ctx.raw(l))).join('')}</select></label></div>
<ul class="al-chips" data-chips aria-label="${t(S.activeFilters)}"></ul>
<div class="al-grid" data-grid>${sorted.map(c=>card(c,D,st)).join('')}</div>
<div class="al-empty" data-empty hidden><h3>${t(S.emptyTitle)}</h3><p>${t(S.emptyBody)}</p><ul class="al-widen" data-widen></ul></div>
<p class="al-foot-note">${t(S.monthlyFoot)}</p>
</div></section>
<section class="al-insp" id="inspection" aria-labelledby="insp-h"><div class="al-wrap al-insp-in">
<div class="al-insp-copy"><h2 id="insp-h">${t(S.inspTitle)}</h2><p>${t(S.inspLead)}</p>
<div class="al-insp-photos"><figure>${ctx.img('motors/insp1',S.insp1Alt,{sizes:'(max-width:900px) 50vw, 240px'})}<figcaption>${t(S.insp1Cap)}</figcaption></figure><figure>${ctx.img('motors/insp2',S.insp2Alt,{sizes:'(max-width:900px) 50vw, 240px'})}<figcaption>${t(S.insp2Cap)}</figcaption></figure></div></div>
<ul class="al-ibars">${sysBars}</ul>
<div class="al-steps"><h3>${t(S.stepsTitle)}</h3><ol>${S.steps.map(([h,p])=>`<li><b>${t(h)}</b><p>${t(p)}</p></li>`).join('')}</ol></div>
</div></section>
<section class="al-fin" id="finance" aria-labelledby="fin-h"><div class="al-wrap al-fin-in"><h2 id="fin-h">${t(S.finTitle)}</h2><div><p>${t(S.finBody)}</p><p class="al-formula">${t(S.finFormula)}</p><p>${ctx.raw(S.finExample,{car:esc(ex.make+' '+ex.model),price:F.azn(ex.price),m:F.azn(exM)})}</p></div></div></section>
</div>
<div class="al-view" id="al-view" data-view hidden></div>
<div class="al-tray" data-tray hidden role="region" aria-label="${t(S.trayLabel)}"><div class="al-wrap al-tray-in"><ul data-tray-list></ul><p data-tray-n></p><a class="al-btn al-btn-main" href="#compare">${t(S.trayGo)}</a><button type="button" class="al-link" data-tray-clear>${t(S.trayClear)}</button></div></div>
<div class="al-toast" role="status" aria-live="polite" data-toast></div>
<footer class="al-foot"><div class="al-wrap al-foot-in"><div><a class="al-logo" href="#search">${logo}<span>AutoLane</span></a><p>${t(S.footNote)}</p></div>
<div><h2>${t(S.centresTitle)}</h2><ul>${S.centres.map(([h,p])=>`<li><b>${t(h)}</b><span>${t(p)}</span></li>`).join('')}</ul></div>
<div>${ctx.credits(Object.keys(assets).filter(k=>k.startsWith('motors/')))}<p class="k-credits">${t(S.heroImgNote)}</p></div></div></footer>
</div>`;
 const {F:_f,...pub}=D;
 return html+ctx.data(pub);
}};
