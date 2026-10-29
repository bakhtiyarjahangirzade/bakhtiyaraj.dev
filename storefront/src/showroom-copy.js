// Copy for the showroom concepts (clinic, wealth, gym, motors, give, stream, bazar, avto, lal, estate).
// Each leaf is [az, ru, en]; the Azerbaijani text doubles as the translation key (see i18n/strings.js).
const c=(az,ru,en)=>[az,ru,en];
export const copy={
 clinic:{
  nav:[c('Xidmətlər','Услуги','Services'),c('Həkimlər','Врачи','Doctors'),c('Əlaqə','Контакты','Contact')],
  headline:c('Valideynlərin arxayın olduğu klinika.','Клиника, в которой родители спокойны.','A clinic where parents feel at ease.'),
  sub:c('Hər yaşdan uşaq üçün tibbi xidmətlər.','Медицинские услуги для детей любого возраста.','Medical care for children of every age.'),
  cta:c('Qəbula yazıl','Записаться на приём','Book an appointment'),
  ageCaption:c('Yaş qrupu','Возрастная группа','Age group'),
  servicesTitle:c('Əsas xidmətlər','Основные услуги','Key services'),
  services:[c('Analizlər','Анализы','Tests'),c('Peyvəndlər','Вакцинация','Vaccinations'),c('USM','УЗИ','Ultrasound'),c('Patronaj','Патронаж','Home care visits')],
  doctorsTitle:c('Həkimlərimiz','Наши врачи','Our doctors'),
  doctors:[c('Pediatr','Педиатр','Paediatrician'),c('Nevroloq','Невролог','Neurologist'),c('Ortoped','Ортопед','Orthopaedist')],
  quote:c('Hər uşağa diqqət və mehribanlıqla.','С вниманием и теплом к каждому ребёнку.','Attention and warmth for every child.')
 },
 wealth:{
  tabs:[c('İnvestisiya','Инвестиции','Invest'),c('Nağd pul','Наличные','Cash'),c('Təqaüd','Пенсия','Retirement')],
  headline:c('Pulunuzu arxayınlıqla böyüdün.','Приумножайте деньги спокойно и уверенно.','Grow your money with confidence.'),
  sub:c('Yığım və investisiya planlaması sizin üçün avtomatlaşdırılır.','Накопления и инвестиционное планирование автоматизируются за вас.','Saving and investment planning, automated for you.'),
  bullets:[c('İstədiyiniz üsulla investisiya edin','Инвестируйте так, как вам удобно','Invest the way you want'),c('Məqsədlərinizi bir yerdə izləyin','Следите за своими целями в одном месте','Track your goals in one place'),c('Şəffaf və sadə şərtlər','Прозрачные и простые условия','Clear and simple terms')],
  cta:c('Başla','Начать','Get started'),
  goal:c('Məqsədə doğru gedişat','Прогресс к цели','Goal progress'),
  balance:c('Proqnoz balans','Прогнозируемый баланс','Projected balance'),
  sample:c('Nümunə rəqəmlər','Примерные цифры','Sample figures'),
  cardsTitle:c('Pul necə işləyir','Как работают деньги','How your money works'),
  cards:[[c('Avtomatik investisiya','Автоматическое инвестирование','Automated investing'),c('Ödənişlər və balans planınıza uyğun tənzimlənir.','Взносы и баланс подстраиваются под ваш план.','Contributions and balance follow your plan.')],[c('Fərdi portfel','Индивидуальный портфель','Custom portfolio'),c('Risk və məqsəd üzrə seçim nümunəsi.','Пример подбора по риску и цели.','A sample selection by risk and goal.')],[c('Yığım hesabı','Накопительный счёт','Savings account'),c('Nağd pulun ayrıca və aydın görünməsi.','Наличные отдельно и на виду.','Cash kept separate and visible.')]],
  disclaimer:c('Nümunə konseptdir; maliyyə məsləhəti deyil.','Это пример концепта, а не финансовая консультация.','This is a sample concept, not financial advice.')
 },
 gym:{
  nav:[c('Məşqlər','Тренировки','Classes'),c('Cədvəl','Расписание','Schedule'),c('Qiymətlər','Цены','Prices')],
  headline:c('Döyüşməyi öyrən. Güclən.','Учись драться. Становись сильнее.','Learn to fight. Get stronger.'),
  sub:c('Başlayanlardan peşəkarlara qədər qrup məşqləri.','Групповые тренировки от новичков до профессионалов.','Group classes from beginners to pros.'),
  cta:c('Pulsuz sınaq məşqi','Бесплатная пробная тренировка','Free trial class'),
  disciplines:[['MMA',c('Vuruş və güləş bir arada.','Удары и борьба вместе.','Striking and grappling together.')],['Muay Thai',c('Dirsək, diz və təpik texnikası.','Техника ударов локтями, коленями и ногами.','Elbow, knee and kick technique.')],['BJJ',c('Yerdə nəzarət və təslim texnikası.','Контроль в партере и болевые приёмы.','Ground control and submissions.')]],
  scheduleTitle:c('Həftəlik cədvəl','Расписание на неделю','Weekly schedule'),
  days:[c('Bazar ertəsi','Понедельник','Monday'),c('Çərşənbə','Среда','Wednesday'),c('Cümə','Пятница','Friday')],
  levels:[c('Yeni başlayanlar üçün','Для новичков','For beginners'),c('Qabaqcıl qrup','Продвинутая группа','Advanced group')]
 },
 motors:{
  nav:[c('Al','Купить','Buy'),c('Sat','Продать','Sell'),c('Kredit','Кредит','Finance')],
  headline:c('Növbəti avtomobilinizi tapın.','Найдите свой следующий автомобиль.','Find your next car.'),
  sub:c('Marka, qiymət və illə axtarın; yoxlanılmış elanları müqayisə edin.','Ищите по марке, цене и году; сравнивайте проверенные объявления.','Search by make, price and year; compare inspected listings.'),
  filters:[c('Marka','Марка','Make'),c('Model','Модель','Model'),c('Maksimum qiymət','Максимальная цена','Maximum price')],
  search:c('Axtar','Найти','Search'),
  listingsTitle:c('Nümunə elanlar','Примеры объявлений','Sample listings'),
  cars:[c('Sedan','Седан','Sedan'),c('Krossover','Кроссовер','Crossover'),c('Hetçbek','Хэтчбек','Hatchback')],
  badge:c('Yoxlanılıb','Проверено','Inspected')
 },
 give:{
  nav:[c('Hekayəmiz','Наша история','Our story'),c('Təsir','Результат','Impact'),c('Dəstək ol','Поддержать','Support')],
  line1:c('Süfrəni paylaş.','Раздели стол.','Share the table.'),
  line2:c('Xeyir yarat.','Сделай добро.','Do good.'),
  sample:c('Nümunə rəqəmlər','Примерные цифры','Sample figures'),
  stats:[['12 000',c('paylaşılan yemək','розданных блюд','meals shared')],['350',c('könüllü','волонтёров','volunteers')],['24',c('tərəfdaş məkan','партнёрских мест','partner venues')]],
  cards:[[c('Hər süfrə bir hekayədir','Каждый стол — это история','Every table is a story'),c('Birlikdə yemək insanları yaxınlaşdırır.','Совместная еда сближает людей.','Eating together brings people closer.')],[c('Könüllülər və tərəfdaşlar','Волонтёры и партнёры','Volunteers and partners'),c('Hər kəs bir paya sahib ola bilər.','Каждый может внести свой вклад.','Everyone can contribute.')],[c('Şəffaf hesabat','Прозрачная отчётность','Transparent reporting'),c('Dəstək nəyə yönəlir — aydın göstərilir.','Куда идёт помощь — показано ясно.','Where support goes is shown clearly.')]],
  amount:c('Məbləğ seçin','Выберите сумму','Choose an amount')
 },
 stream:{
  nav:[c('Əsas','Главная','Home'),c('Mediya','Медиа','Media'),c('Fond','Фонд','Foundation'),c('Əlaqə','Контакты','Contact')],
  eyebrow:c('Seçilmiş','Избранное','Featured'),
  headline:c('Mövsümün ən yaxşı anları','Лучшие моменты сезона','Best moments of the season'),
  sub:c('Final dəqiqələrindən kulis arxasına qədər seçilmiş çəkilişlər.','От финальных минут до закулисья — избранные кадры.','From the final minutes to behind the scenes — selected footage.'),
  play:c('Seçilmişi izlə','Смотреть главное','Play feature'),
  all:c('Hamısına bax','Смотреть все','Browse all'),
  rowTitle:c('Ən yaxşı 5 seçim','Топ-5 подборка','Top 5 picks'),
  tiles:[c('Final dəqiqələri','Финальные минуты','Final minutes'),c('Məşqçi ilə söhbət','Разговор с тренером','Talk with the coach'),c('Kulis arxası','За кулисами','Behind the scenes'),c('Sənədli film','Документальный фильм','Documentary'),c('Analiz','Разбор','Breakdown')]
 },
 bazar:{
  headline:c('İstədiyinizi tapın, ehtiyacınız olmayanı satın.','Найдите нужное, продайте ненужное.','Find what you need, sell what you don\'t.'),
  placeholder:c('Nə axtarırsınız?','Что вы ищете?','What are you looking for?'),
  city:c('Bakı','Баку','Baku'),
  search:c('Axtar','Найти','Search'),
  cats:[c('Nəqliyyat','Транспорт','Vehicles'),c('Əmlak','Недвижимость','Property'),c('Elektronika','Электроника','Electronics'),c('Ev və bağ','Дом и сад','Home & garden'),c('Geyim','Одежда','Clothing'),c('Uşaq aləmi','Детский мир','Kids'),c('Xidmətlər','Услуги','Services'),c('İş','Работа','Jobs')],
  premium:c('Premium elanlar','Премиум-объявления','Premium listings'),
  items:[c('Noutbuk','Ноутбук','Laptop'),c('Divan','Диван','Sofa'),c('Velosiped','Велосипед','Bicycle'),c('Fotoaparat','Фотоаппарат','Camera')],
  today:c('Bu gün','Сегодня','Today'),
  post:c('Elan yerləşdir','Разместить объявление','Post a listing')
 },
 avto:{
  headline:c('Avtomobil elanları — sadə və dəqiq.','Автообъявления — просто и точно.','Car listings — simple and precise.'),
  filtersTitle:c('Filtrlər','Фильтры','Filters'),
  groups:[[c('Yanacaq','Топливо','Fuel'),[c('Benzin','Бензин','Petrol'),c('Dizel','Дизель','Diesel'),c('Hibrid','Гибрид','Hybrid')]],[c('Sürətlər qutusu','Коробка передач','Gearbox'),[c('Avtomat','Автомат','Automatic'),c('Mexanika','Механика','Manual')]]],
  price:c('Qiymət','Цена','Price'),
  sort:c('Ən yenilər','Сначала новые','Newest first'),
  badges:[c('Kredit','Кредит','Finance'),c('Barter','Бартер','Swap'),c('VIN yoxlanılıb','VIN проверен','VIN checked')]
 },
 lal:{
  headline:c('Elanlar cibinizdə.','Объявления у вас в кармане.','Listings in your pocket.'),
  sub:c('Şəkil çək, qiymət yaz, mesajlaş — hamısı telefonda.','Сфотографируйте, укажите цену, переписывайтесь — всё в телефоне.','Snap a photo, set a price, chat — all on your phone.'),
  store:c('Tezliklə mağazalarda','Скоро в магазинах приложений','Coming soon to app stores'),
  chat:[c('Salam, hələ də satılır?','Здравствуйте, ещё продаётся?','Hi, is this still available?'),c('Bəli, bu gün götürə bilərsiniz.','Да, можно забрать сегодня.','Yes, you can pick it up today.')],
  tabs:[c('Əsas','Главная','Home'),c('Mesajlar','Сообщения','Messages'),c('Elan ver','Подать объявление','Post'),c('Profil','Профиль','Profile')],
  features:[[c('Söhbət birinci','Чат прежде всего','Chat first'),c('Alıcı ilə dərhal mesajlaşın.','Сразу переписывайтесь с покупателем.','Message the buyer right away.')],[c('Qiymət düşəndə xəbər alın','Узнавайте о снижении цены','Hear about price drops'),c('Bəyəndiyiniz elanı izləyin.','Следите за понравившимся объявлением.','Follow a listing you like.')],[c('Bir toxunuşla elan','Объявление в одно касание','A listing in one tap'),c('Şəkil çəkin və dərc edin.','Сфотографируйте и опубликуйте.','Take a photo and publish.')]]
 },
 estate:{
  headline:c('Yeni evinizi xəritədə tapın.','Найдите новый дом на карте.','Find your new home on the map.'),
  modes:[c('Satış','Продажа','Sale'),c('İcarə','Аренда','Rent')],
  rooms:c('Otaq sayı','Количество комнат','Rooms'),
  types:[c('Yeni tikili','Новостройка','New build'),c('Köhnə tikili','Вторичное жильё','Resale'),c('Həyət evi','Частный дом','House')],
  badges:[c('Kupça','Купчая','Title deed'),c('Təmirli','С ремонтом','Renovated')],
  floor:c('{n}-ci mərtəbə','{n}-й этаж','Floor {n}'),
  map:c('Xəritə nümunəsi','Пример карты','Map sample')
 }
};
const flat=v=>Array.isArray(v)?(v.length===3&&v.every(x=>typeof x==='string')?[v]:v.flatMap(flat)):(v&&typeof v==='object'?Object.values(v).flatMap(flat):[]);
const tag=c('Sayt konsepti','Концепт сайта','Site concept'),sys=c('Sistem konsepti','Концепт системы','System concept'),cards=c('Elan kartları','Карточки объявлений','Listing cards'),search=c('Axtarış və filtr','Поиск и фильтры','Search and filters');
export const projectMeta={
 clinic:{type:'website',category:c('Pediatriya klinikası','Педиатрическая клиника','Paediatric clinic'),desc:c('Uşaq və ailə klinikaları üçün yaş qrupları, xidmətlər və həkimlər üzərində qurulmuş yumşaq, canlı sayt konsepti.','Мягкий, живой концепт сайта для детских и семейных клиник: возрастные группы, услуги и врачи.','A soft, lively site concept for children\'s and family clinics built around age groups, services and doctors.'),tags:[tag,c('Randevu axını','Поток записи на приём','Appointment flow'),c('Yaş qrupları','Возрастные группы','Age groups')]},
 wealth:{type:'system',category:c('İnvestisiya tətbiqi','Инвестиционное приложение','Investment app'),desc:c('Yığım və investisiya məqsədlərini sadə göstərən maliyyə tətbiqi və təqdimat saytı konsepti.','Концепт финансового приложения и сайта-презентации, который просто показывает цели накоплений и инвестиций.','A finance app and presentation-site concept that shows saving and investment goals simply.'),tags:[sys,c('Məqsəd izləmə','Отслеживание целей','Goal tracking'),c('Mobil görünüş','Мобильная версия','Mobile layout')]},
 gym:{type:'website',category:c('Döyüş idman zalı','Зал единоборств','Combat gym'),desc:c('MMA, Muay Thai və BJJ zalı üçün qara, güclü tipografiyalı sayt konsepti; cədvəl və sınaq məşqi ilə.','Концепт сайта для зала MMA, муай-тай и BJJ: чёрный фон, сильная типографика, расписание и пробная тренировка.','A site concept for an MMA, Muay Thai and BJJ gym: black, bold type, a schedule and a trial class.'),tags:[tag,c('Cədvəl','Расписание','Schedule'),c('Üzvlük','Членство','Membership')]},
 motors:{type:'website',category:c('Avtomobil axtarışı','Поиск автомобилей','Car search'),desc:c('Marka, qiymət və il üzrə axtarış, yoxlanılmış elanlar və müqayisə ilə avtomobil bazarı konsepti.','Концепт автомобильного маркетплейса: поиск по марке, цене и году, проверенные объявления и сравнение.','A car marketplace concept with search by make, price and year, inspected listings and comparison.'),tags:[tag,search,cards]},
 give:{type:'website',category:c('Xeyriyyə təşkilatı','Благотворительная организация','Charity'),desc:c('İri tipoqrafiya, təsir rəqəmləri və sadə dəstək axını olan xeyriyyə təşkilatı sayt konsepti.','Концепт сайта благотворительной организации: крупная типографика, цифры результата и простой путь поддержки.','A charity site concept with large type, impact figures and a simple support flow.'),tags:[tag,c('Təsir rəqəmləri','Цифры результата','Impact figures'),c('Dəstək axını','Путь поддержки','Support flow')]},
 stream:{type:'website',category:c('Media mərkəzi','Медиа-хаб','Media hub'),desc:c('Seçilmiş video, sıralanmış kolleksiyalar və qaranlıq interfeysli media mərkəzi sayt konsepti.','Концепт медиа-хаба с избранным видео, ранжированными подборками и тёмным интерфейсом.','A media hub concept with a featured video, ranked collections and a dark interface.'),tags:[tag,c('Video kolleksiyalar','Видеоподборки','Video collections'),c('Qaranlıq interfeys','Тёмный интерфейс','Dark interface')]},
 bazar:{type:'website',category:c('Elan platforması','Доска объявлений','Classifieds platform'),desc:c('Kateqoriya şəbəkəsi, güclü axtarış və premium elanlarla ümumi elan platforması konsepti.','Концепт универсальной доски объявлений: сетка категорий, мощный поиск и премиум-объявления.','A general classifieds concept with a category grid, strong search and premium listings.'),tags:[tag,c('Kateqoriyalar','Категории','Categories'),search]},
 avto:{type:'website',category:c('Avtomobil elanları','Автообъявления','Car listings'),desc:c('Sıx elan siyahısı, sol filtrlər və kredit, barter, VIN nişanları ilə avtomobil elanları konsepti.','Концепт автообъявлений: плотный список, фильтры слева и значки «кредит», «бартер», VIN.','A car listings concept with a dense list, left-hand filters and finance, swap and VIN badges.'),tags:[tag,cards,c('Filtrlər','Фильтры','Filters')]},
 lal:{type:'system',category:c('Mobil elan tətbiqi','Мобильное приложение объявлений','Mobile classifieds app'),desc:c('Söhbəti ön plana çıxaran, bir toxunuşla elan verən mobil elan tətbiqi konsepti.','Концепт мобильного приложения объявлений: чат на первом плане и публикация в одно касание.','A mobile classifieds app concept that puts chat first and publishes a listing in one tap.'),tags:[sys,c('Mobil görünüş','Мобильная версия','Mobile layout'),c('Mesajlaşma','Переписка','Messaging')]},
 estate:{type:'website',category:c('Daşınmaz əmlak','Недвижимость','Real estate'),desc:c('Siyahı və xəritəni yan-yana göstərən, otaq sayı və satış/icarə filtrləri olan əmlak platforması konsepti.','Концепт платформы недвижимости: список и карта рядом, фильтры по комнатам, продаже и аренде.','A property platform concept with the list and map side by side and room, sale and rent filters.'),tags:[tag,c('Xəritə axtarışı','Поиск по карте','Map search'),cards]}
};
export const showroomRows=[...flat(copy),...flat(projectMeta)];
export const showroomMeta={
 clinic:{brand:'Sunny Kids',kind:'site'},wealth:{brand:'Growly',kind:'app'},gym:{brand:'Wolfpack',kind:'site'},motors:{brand:'AutoLane',kind:'site'},give:{brand:'Bir Süfrə',kind:'site'},
 stream:{brand:'Arena',kind:'site'},bazar:{brand:'Bazarlıq',kind:'site'},avto:{brand:'Yolda',kind:'site'},lal:{brand:'Cibdə',kind:'app'},estate:{brand:'Ünvan',kind:'site'}
};
