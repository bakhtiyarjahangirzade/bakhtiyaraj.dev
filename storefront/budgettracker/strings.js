// BAKHY Budget — interface strings (az / ru / en). Category ids are stored in the database, so they stay language neutral.
export const T={
az:{app:'BAKHY Budget',tagline:'Gəlir, xərc və satışlarınızı bir yerdə izləyin.',email:'E-poçt',password:'Şifrə',nickname:'Nickname',signin:'Daxil ol',signup:'Qeydiyyat',haveAcc:'Hesabınız var? Daxil olun',noAcc:'Hesabınız yoxdur? Qeydiyyat',demo:'Demo-ya bax',checkMail:'Təsdiq üçün e-poçtunuzu yoxlayın, sonra daxil olun.',nickRule:'3–20 simvol: hərf, rəqəm, _ . -',nickTaken:'Bu nickname artıq istifadə olunur.',badLogin:'E-poçt və ya şifrə yanlışdır.',weakPw:'Şifrə ən azı 8 simvol olmalıdır.',netErr:'Bağlantı xətası. Yenidən cəhd edin.',consent:'Ümumi nəzarət haqqında məlumatlandım',consentNeed:'Davam etmək üçün qeyddən razılıq verin.',
supNoticeTitle:'Ümumi nəzarət',supNotice:'Bu tətbiqdə daxil etdiyiniz bütün qeydlər (gəlir, xərc, satış) və hədəfləriniz idarəçiyə nickname ilə görünür.',
featTitle:'Standart xüsusiyyətlər',feats:['Gəlir, xərc və satış qeydləri','Aylıq büdcələr və satış hədəfi','Kateqoriya üzrə qrafik və hesabat (CSV)','Oflayn işləyir, bağlantı olanda sinxronlaşır','Azərbaycanca səsli bildirişlər','Ümumi nəzarət: idarəçi nickname üzrə satış və hədəf vəziyyətini görür'],
apkBtn:'Android üçün yüklə (APK)',apkTitle:'Yükləməzdən əvvəl',apkSoon:'APK tezliklə hazır olacaq.',apkGo:'APK-nı yüklə',close:'Bağla',
home:'Xülasə',list:'Qeydlər',add:'Əlavə et',goals:'Hədəflər',settings:'Ayarlar',watch:'Nəzarət',
balance:'Balans',income:'Gəlir',expense:'Xərc',sale:'Satış',all:'Hamısı',thisMonth:'Bu ay',salesGoal:'Satış hədəfi',noGoal:'Hədəf təyin edilməyib',of:'/',recent:'Son qeydlər',empty:'Hələ qeyd yoxdur.',byCat:'Kateqoriya üzrə xərc',budgets:'Büdcələr',limit:'Aylıq limit',setLimit:'Limit təyin et',
kind:{income:'Gəlir',expense:'Xərc',sale:'Satış'},save:'Yadda saxla',cancel:'Ləğv et',del:'Sil',note:'Qeyd',date:'Tarix',category:'Kateqoriya',amount:'Məbləğ',
cat:{market:'Market',transport:'Nəqliyyat',cafe:'Kafe',bills:'Ödənişlər',fun:'Əyləncə',health:'Sağlamlıq',salary:'Maaş',extra:'Əlavə gəlir',product:'Məhsul',service:'Xidmət',other:'Digər'},
salesTarget:'Aylıq satış hədəfi',savingTarget:'Yığım hədəfi',goalSaved:'Hədəflər yadda saxlandı.',
language:'Dil',currency:'Valyuta',sound:'Səsli bildirişlər',export:'CSV-ni yüklə',logout:'Çıxış',account:'Hesab',syncNow:'İndi sinxronlaşdır',synced:'Sinxronlaşdırıldı',pending:'Gözləyən qeyd',offline:'Oflayn',
overview:'Əməkdaşlar',month:'Bu ayın satışı',total:'Ümumi satış',target:'Hədəf',last:'Son hərəkət',never:'—',noStaff:'Hələ əməkdaş yoxdur.',back:'Geri',noAdmin:'Bu bölmə yalnız idarəçi üçündür.',entries:'Qeydlər',
demoBanner:'Demo rejim: məlumatlar yalnız bu səhifədədir.',exitDemo:'Demo-dan çıx',confirmDel:'Bu qeyd silinsin?',askNick:'Nickname seçin'},
ru:{app:'BAKHY Budget',tagline:'Доходы, расходы и продажи — в одном месте.',email:'E-mail',password:'Пароль',nickname:'Никнейм',signin:'Войти',signup:'Регистрация',haveAcc:'Уже есть аккаунт? Войти',noAcc:'Нет аккаунта? Регистрация',demo:'Посмотреть демо',checkMail:'Проверьте почту для подтверждения, затем войдите.',nickRule:'3–20 символов: буквы, цифры, _ . -',nickTaken:'Этот никнейм уже занят.',badLogin:'Неверный e-mail или пароль.',weakPw:'Пароль должен быть не короче 8 символов.',netErr:'Ошибка соединения. Попробуйте ещё раз.',consent:'Я ознакомлен(а) с общим контролем',consentNeed:'Подтвердите согласие, чтобы продолжить.',
supNoticeTitle:'Общий контроль',supNotice:'Все записи (доходы, расходы, продажи) и цели, которые вы вносите в приложении, видны руководителю под вашим никнеймом.',
featTitle:'Стандартные возможности',feats:['Записи доходов, расходов и продаж','Месячные бюджеты и цель по продажам','График по категориям и отчёт (CSV)','Работает офлайн, синхронизируется при подключении','Голосовые уведомления на азербайджанском','Общий контроль: руководитель видит продажи и состояние целей по никнеймам'],
apkBtn:'Скачать для Android (APK)',apkTitle:'Перед загрузкой',apkSoon:'APK скоро будет готов.',apkGo:'Скачать APK',close:'Закрыть',
home:'Сводка',list:'Записи',add:'Добавить',goals:'Цели',settings:'Настройки',watch:'Контроль',
balance:'Баланс',income:'Доход',expense:'Расход',sale:'Продажа',all:'Все',thisMonth:'Этот месяц',salesGoal:'Цель по продажам',noGoal:'Цель не задана',of:'/',recent:'Последние записи',empty:'Записей пока нет.',byCat:'Расходы по категориям',budgets:'Бюджеты',limit:'Месячный лимит',setLimit:'Задать лимит',
kind:{income:'Доход',expense:'Расход',sale:'Продажа'},save:'Сохранить',cancel:'Отмена',del:'Удалить',note:'Заметка',date:'Дата',category:'Категория',amount:'Сумма',
cat:{market:'Магазин',transport:'Транспорт',cafe:'Кафе',bills:'Платежи',fun:'Развлечения',health:'Здоровье',salary:'Зарплата',extra:'Доп. доход',product:'Товар',service:'Услуга',other:'Другое'},
salesTarget:'Месячная цель по продажам',savingTarget:'Цель накоплений',goalSaved:'Цели сохранены.',
language:'Язык',currency:'Валюта',sound:'Голосовые уведомления',export:'Скачать CSV',logout:'Выйти',account:'Аккаунт',syncNow:'Синхронизировать',synced:'Синхронизировано',pending:'Ожидает отправки',offline:'Офлайн',
overview:'Сотрудники',month:'Продажи за месяц',total:'Всего продаж',target:'Цель',last:'Последняя активность',never:'—',noStaff:'Сотрудников пока нет.',back:'Назад',noAdmin:'Этот раздел только для руководителя.',entries:'Записи',
demoBanner:'Демо-режим: данные только на этой странице.',exitDemo:'Выйти из демо',confirmDel:'Удалить эту запись?',askNick:'Выберите никнейм'},
en:{app:'BAKHY Budget',tagline:'Track income, expenses and sales in one place.',email:'Email',password:'Password',nickname:'Nickname',signin:'Sign in',signup:'Sign up',haveAcc:'Have an account? Sign in',noAcc:'No account? Sign up',demo:'Try the demo',checkMail:'Check your email to confirm, then sign in.',nickRule:'3–20 characters: letters, digits, _ . -',nickTaken:'That nickname is already taken.',badLogin:'Wrong email or password.',weakPw:'Password must be at least 8 characters.',netErr:'Connection error. Please try again.',consent:'I have read about general oversight',consentNeed:'Please confirm the notice to continue.',
supNoticeTitle:'General oversight',supNotice:'Every entry you add (income, expenses, sales) and your goals are visible to the manager under your nickname.',
featTitle:'Standard features',feats:['Income, expense and sales entries','Monthly budgets and a sales goal','Category chart and report (CSV)','Works offline and syncs when connected','Spoken notifications in Azerbaijani','General oversight: the manager sees sales and goal status by nickname'],
apkBtn:'Download for Android (APK)',apkTitle:'Before you download',apkSoon:'The APK will be ready soon.',apkGo:'Download APK',close:'Close',
home:'Summary',list:'Entries',add:'Add',goals:'Goals',settings:'Settings',watch:'Oversight',
balance:'Balance',income:'Income',expense:'Expense',sale:'Sale',all:'All',thisMonth:'This month',salesGoal:'Sales goal',noGoal:'No goal set',of:'/',recent:'Recent entries',empty:'No entries yet.',byCat:'Spending by category',budgets:'Budgets',limit:'Monthly limit',setLimit:'Set limit',
kind:{income:'Income',expense:'Expense',sale:'Sale'},save:'Save',cancel:'Cancel',del:'Delete',note:'Note',date:'Date',category:'Category',amount:'Amount',
cat:{market:'Groceries',transport:'Transport',cafe:'Café',bills:'Bills',fun:'Fun',health:'Health',salary:'Salary',extra:'Extra income',product:'Product',service:'Service',other:'Other'},
salesTarget:'Monthly sales goal',savingTarget:'Savings goal',goalSaved:'Goals saved.',
language:'Language',currency:'Currency',sound:'Spoken notifications',export:'Download CSV',logout:'Sign out',account:'Account',syncNow:'Sync now',synced:'Synced',pending:'Waiting to upload',offline:'Offline',
overview:'Team',month:'Sales this month',total:'Total sales',target:'Goal',last:'Last activity',never:'—',noStaff:'No team members yet.',back:'Back',noAdmin:'This section is for managers only.',entries:'Entries',
demoBanner:'Demo mode: data stays on this page only.',exitDemo:'Exit demo',confirmDel:'Delete this entry?',askNick:'Choose a nickname'}
};
export const CATS={expense:['market','transport','cafe','bills','fun','health','other'],income:['salary','extra','other'],sale:['product','service','other']};
export const CURRENCIES=['AZN','USD','EUR','RUB','TRY'];
// Spoken feedback files live in /budgettracker/audio/<lang>/<name>.mp3; add a language here once its files exist.
export const AUDIO_LANGS=['az'];
export const SOUNDS=['welcome','loginOk','incomeAdded','expenseAdded','saleAdded','deleted','budget80','budgetOver','goalHalf','goalDone','synced','error'];
