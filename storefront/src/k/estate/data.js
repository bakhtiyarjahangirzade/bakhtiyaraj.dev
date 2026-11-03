// Ünvan sample data: 18 fictional listings in real Baku districts. Build-time only (uses L from kit.js).
// Areas are derived from the room list (plan), so the floor plan, the stated area and price per m² always agree.
import {L} from '../kit.js';

export const ROOM={
 liv:L('Qonaq otağı','Гостиная','Living room'),
 bed:L('Yataq otağı','Спальня','Bedroom'),
 kid:L('Uşaq otağı','Детская','Children’s room'),
 kit:L('Mətbəx','Кухня','Kitchen'),
 kl:L('Mətbəx-qonaq otağı','Кухня-гостиная','Kitchen-living room'),
 hall:L('Dəhliz','Прихожая','Hall'),
 bath:L('Hamam otağı','Ванная','Bathroom'),
 wc:L('Tualet','Туалет','WC'),
 bal:L('Eyvan','Балкон','Balcony'),
 ter:L('Terras','Терраса','Terrace')
};
export const HABITABLE=['liv','bed','kid','kl'];

export const SERIES={
 new:L('Yeni tikili, monolit karkas','Новостройка, монолитный каркас','New build, monolithic frame'),
 stalin:L('Stalin layihəsi, daş bina','Сталинка, каменный дом','Stalin-era stone building'),
 xrush:L('Xruşşovka, daş bina','Хрущёвка, каменный дом','Khrushchev-era stone block'),
 lenin:L('Leninqrad layihəsi','Ленинградский проект','Leningrad-series block'),
 czech:L('Çex layihəsi','Чешский проект','Czech-series block'),
 pre:L('İnqilabdan əvvəlki daş bina','Дореволюционный каменный дом','Pre-1917 stone building'),
 house:L('Həyət evi, mişar daşı','Частный дом из пиленого камня','Detached house, sawn limestone')
};
export const RENO={
 design:L('Dizayner təmiri','Дизайнерский ремонт','Designer renovation'),
 good:L('Təmirli','С ремонтом','Renovated'),
 none:L('Təmirsiz','Без ремонта','Needs renovation'),
 shell:L('Ağ karkas','Белый каркас','Shell finish')
};
export const HEAT={
 kombi:L('Fərdi kombi','Индивидуальный котёл (комби)','Individual combi boiler'),
 central:L('Mərkəzi istilik','Центральное отопление','Central heating')
};
export const PARK={
 none:L('Küçədə','На улице','On the street'),
 yard:L('Həyətdə','Во дворе','In the courtyard'),
 under:L('Yeraltı dayanacaq','Подземный паркинг','Underground parking')
};
export const TYPE={
 new:L('Yeni tikili','Новостройка','New build'),
 old:L('Köhnə tikili','Вторичное жильё','Resale'),
 house:L('Həyət evi','Частный дом','House')
};

// Schematic map geometry (viewBox 0 0 1000 680). Parcels are approximate, not survey boundaries.
export const DISTRICTS=[
 {id:'sabail',name:L('Səbail','Сабаил','Sabail'),pts:'130,495 150,430 190,410 320,455 450,410 610,395 640,470 650,515 560,505 450,520 320,545 200,520',lx:300,ly:492,
  note:L('İçərişəhər, Dənizkənarı bulvar və Bayıl. Köhnə daş binalar və dəniz mənzərəli yeni tikililər.','Ичеришехер, Приморский бульвар и Баилово. Старые каменные дома и новостройки с видом на море.','Icherisheher, the seaside boulevard and Bayil. Old stone buildings and new builds with sea views.')},
 {id:'nasimi',name:L('Nəsimi','Насими','Nasimi'),pts:'410,250 590,240 610,395 450,410',lx:528,ly:400,
  note:L('Şəhərin mərkəzi: 28 May və Nizami ətrafı. Stalin dövrü binalar və sıx yeni tikililər.','Центр города: районы 28 Мая и Низами. Сталинки и плотная новая застройка.','The city centre around 28 May and Nizami. Stalin-era blocks and dense new builds.')},
 {id:'yasamal',name:L('Yasamal','Ясамал','Yasamal'),pts:'230,290 410,250 450,410 320,455 190,410',lx:375,ly:312,
  note:L('Elmlər Akademiyası, İnşaatçılar və Yeni Yasamal. Universitetlər, sakit küçələr, yamaclarda yeni tikililər.','Элмляр Академиясы, Иншаатчылар и Новый Ясамал. Университеты, тихие улицы, новостройки на склонах.','Elmlar Akademiyasi, Inshaatchilar and New Yasamal. Universities, quiet streets, new builds on the slopes.')},
 {id:'narimanov',name:L('Nərimanov','Нариманов','Narimanov'),pts:'400,40 690,50 710,240 590,240 410,250',lx:470,ly:78,
  note:L('Gənclik, Nərimanov və Ulduz metroları. Parklar, geniş prospektlər və Atatürk prospekti.','Станции Гянджлик, Нариманов и Улдуз. Парки, широкие проспекты, проспект Ататюрка.','Ganjlik, Narimanov and Ulduz metro. Parks, wide avenues and Ataturk Avenue.')},
 {id:'xatai',name:L('Xətai','Хатаи','Khatai'),pts:'590,240 710,240 900,250 960,460 870,505 760,530 650,515 640,470 610,395',lx:840,ly:300,
  note:L('Ağ şəhər, Xətai və Həzi Aslanov. Keçmiş sənaye ərazisində yeni məhəllələr və Babək prospekti.','Белый город, Хатаи и Ази Асланов. Новые кварталы на месте промзоны и проспект Бабека.','White City, Khatai and Hazi Aslanov. New quarters on former industrial land and Babak Avenue.')},
 {id:'binaqadi',name:L('Binəqədi','Бинагади','Binagadi'),pts:'40,40 400,40 410,250 230,290 40,270',lx:300,ly:78,
  note:L('9-cu mikrorayon, Azadlıq prospekti və Binəqədi qəsəbəsi. Sovet mikrorayonları və həyət evləri.','9-й микрорайон, проспект Азадлыг и посёлок Бинагади. Советские микрорайоны и частные дома.','9th microdistrict, Azadliq Avenue and Binagadi settlement. Soviet microdistricts and detached houses.')}
];
export const METRO=[
 {n:L('İçərişəhər','Ичеришехер','Icherisheher'),x:470,y:478},
 {n:L('Sahil','Сахил','Sahil'),x:540,y:462},
 {n:L('28 May','28 Мая','28 May'),x:560,y:352},
 {n:L('Nizami','Низами','Nizami'),x:500,y:336},
 {n:L('Memar Əcəmi','Мемар Аджеми','Memar Ajami'),x:365,y:232},
 {n:L('Elmlər Akademiyası','Элмляр Академиясы','Elmlar Akademiyasi'),x:385,y:372},
 {n:L('İnşaatçılar','Иншаатчылар','Inshaatchilar'),x:282,y:328},
 {n:L('Gənclik','Гянджлик','Ganjlik'),x:585,y:205},
 {n:L('Nərimanov','Нариманов','Narimanov'),x:620,y:160},
 {n:L('Ulduz','Улдуз','Ulduz'),x:650,y:80},
 {n:L('Xətai','Хатаи','Khatai'),x:690,y:350},
 {n:L('Həzi Aslanov','Ази Асланов','Hazi Aslanov'),x:880,y:405},
 {n:L('Azadlıq prospekti','Проспект Азадлыг','Azadliq Prospekti'),x:150,y:180},
 {n:L('Dərnəgül','Дарнагюль','Darnagul'),x:90,y:120}
];

// Listing helper. plan: [[room type, m²], ...] in drawing order (see plan.js).
const P=(o)=>o;
export const LISTINGS=[
 P({id:'u101',mode:'sale',district:'nasimi',x:555,y:318,place:L('28 May metrosu yaxınlığı','У метро 28 Мая','Near 28 May metro'),
  plan:[['liv',22.4],['bed',15.2],['bed',13.6],['bal',5.0],['kit',11.8],['hall',9.6],['bath',4.6],['wc',1.8]],
  price:285000,floor:9,floors:16,type:'new',series:'new',year:2021,reno:'design',heat:'kombi',kupca:true,lift:2,park:'under',ceil:3.0,metro:6,posted:'2026-11-01',seller:'owner',photos:['u101-bed'],
  desc:L('Cənuba baxan qonaq otağı, iki ayrı yataq otağı və ayrıca tualet. Bina 2021-ci ildə istifadəyə verilib, kupça hazırdır.','Гостиная на юг, две отдельные спальни и отдельный туалет. Дом сдан в 2021 году, купчая готова.','South-facing living room, two separate bedrooms and a separate WC. The building was completed in 2021; the title deed is issued.')}),
 P({id:'u102',mode:'sale',district:'yasamal',x:360,y:398,place:L('Elmlər Akademiyası','Элмляр Академиясы','Elmlar Akademiyasi'),
  plan:[['liv',20.6],['bed',16.8],['bal',3.4],['kit',9.2],['hall',7.4],['bath',4.2]],
  price:168000,floor:3,floors:5,type:'old',series:'stalin',year:1954,reno:'good',heat:'kombi',kupca:true,lift:0,park:'yard',ceil:3.3,metro:4,posted:'2026-10-29',seller:'owner',photos:['u102-living','u102-kitchen'],
  desc:L('Hündür tavanlı daş bina, qalın divarlar. Elektrik və santexnika 2023-cü ildə yenilənib. Lift yoxdur.','Каменный дом с высокими потолками и толстыми стенами. Электрика и сантехника обновлены в 2023 году. Лифта нет.','Stone building with high ceilings and thick walls. Wiring and plumbing were replaced in 2023. No lift.')}),
 P({id:'u103',mode:'sale',district:'sabail',x:232,y:486,place:L('Bayıl, dəniz mənzərəli','Баилово, вид на море','Bayil, sea view'),
  plan:[['liv',24.8],['bed',17.2],['bed',14.0],['ter',8.6],['kit',12.6],['hall',10.4],['bath',5.2],['wc',2.0]],
  price:312000,floor:4,floors:6,type:'new',series:'new',year:2023,reno:'shell',heat:'kombi',kupca:false,lift:1,park:'under',ceil:3.1,metro:25,metroAt:'Sahil',posted:'2026-10-27',seller:'agency',photos:['owner-exterior','u103-balcony'],
  desc:L('Buxtaya baxan terras və iki yataq otağı. Ağ karkas: təmir alıcının seçiminə qalır. Kupça binanın tam təhvilindən sonra veriləcək.','Терраса с видом на бухту и две спальни. Белый каркас: отделка на выбор покупателя. Купчая — после полной сдачи дома.','A terrace over the bay and two bedrooms. Shell finish, so the fit-out is the buyer’s choice. The title deed follows full handover of the building.')}),
 P({id:'u104',mode:'sale',district:'xatai',x:722,y:468,place:L('Ağ şəhər','Белый город','White City'),
  plan:[['kl',28.4],['bed',14.6],['bal',4.2],['hall',6.8],['bath',4.8]],
  price:176000,floor:7,floors:14,type:'new',series:'new',year:2022,reno:'design',heat:'kombi',kupca:true,lift:2,park:'under',ceil:3.0,metro:12,posted:'2026-10-30',seller:'agency',photos:['u104-living','u104-block'],
  desc:L('Açıq mətbəx-qonaq otağı və ayrıca yataq otağı. Məhəllədə piyada küçələri və uşaq meydançaları var.','Открытая кухня-гостиная и отдельная спальня. В квартале пешеходные улицы и детские площадки.','An open kitchen-living room and a separate bedroom. The quarter has pedestrian streets and playgrounds.')}),
 P({id:'u105',mode:'sale',district:'binaqadi',x:255,y:150,place:L('9-cu mikrorayon','9-й микрорайон','9th microdistrict'),
  plan:[['liv',17.6],['bed',12.4],['bed',10.2],['bal',3.6],['kit',7.8],['hall',6.4],['bath',3.2],['wc',1.2]],
  price:112000,floor:5,floors:9,type:'old',series:'lenin',year:1978,reno:'good',heat:'kombi',kupca:true,lift:1,park:'yard',ceil:2.7,metro:9,posted:'2026-10-24',seller:'owner',photos:['u105-block'],
  desc:L('Üç ayrı otaq, şüşələnmiş eyvan. Mətbəx kiçikdir, amma qonaq otağı ilə birləşdirmək mümkündür (layihə razılaşdırılmalıdır).','Три изолированные комнаты, застеклённый балкон. Кухня небольшая, её можно объединить с гостиной (нужно согласование).','Three separate rooms and a glazed balcony. The kitchen is small; joining it to the living room needs an approved project.')}),
 P({id:'u106',mode:'sale',district:'narimanov',x:540,y:176,place:L('Gənclik, Atatürk prospekti','Гянджлик, проспект Ататюрка','Ganjlik, Ataturk Avenue'),
  plan:[['liv',26.2],['bed',17.8],['bed',15.4],['kid',12.6],['bal',6.4],['kit',14.2],['hall',12.8],['bath',5.6],['wc',2.2]],
  price:395000,floor:14,floors:20,type:'new',series:'new',year:2019,reno:'good',heat:'kombi',kupca:true,lift:3,park:'under',ceil:3.0,metro:5,posted:'2026-10-21',seller:'agency',photos:['u106-bath'],
  desc:L('Dörd otaqlı ailə mənzili: uşaq otağı, iki yataq otağı və geniş mətbəx. Gənclik parkına piyada 7 dəqiqə.','Семейная четырёхкомнатная квартира: детская, две спальни и большая кухня. До парка Гянджлик 7 минут пешком.','A four-room family flat: a children’s room, two bedrooms and a large kitchen. Seven minutes’ walk to Ganjlik park.')}),
 P({id:'u107',mode:'sale',district:'nasimi',x:468,y:290,place:L('Səməd Vurğun küçəsi','Улица Самеда Вургуна','Samad Vurgun Street'),
  plan:[['liv',17.4],['bal',2.4],['kit',6.0],['hall',4.2],['bath',3.0]],
  price:79000,floor:2,floors:5,type:'old',series:'xrush',year:1964,reno:'none',heat:'central',kupca:true,lift:0,park:'none',ceil:2.6,metro:7,posted:'2026-10-18',seller:'owner',photos:['u107-room'],
  desc:L('Təmir tələb edən bir otaqlı mənzil, iki pəncərə həyətə baxır. Mərkəzdə ən aşağı başlanğıc qiymətlərdən biri.','Однокомнатная квартира под ремонт, два окна во двор. Одна из самых низких стартовых цен в центре.','A one-room flat that needs renovation; two windows face the courtyard. One of the lowest entry prices in the centre.')}),
 P({id:'u108',mode:'sale',district:'yasamal',x:236,y:398,place:L('Yeni Yasamal','Новый Ясамал','New Yasamal'),
  plan:[['liv',19.2],['bed',14.4],['kit',10.6],['hall',7.2],['bath',4.4]],
  price:128000,floor:1,floors:12,type:'new',series:'new',year:2020,reno:'good',heat:'kombi',kupca:false,lift:1,park:'yard',ceil:2.9,metro:15,posted:'2026-10-26',seller:'owner',photos:[],
  desc:L('Birinci mərtəbə, eyvan yoxdur, həyətə ayrıca giriş mümkündür. Kupça yoxdur: satış müqavilə ilə aparılır.','Первый этаж, без балкона, возможен отдельный вход со двора. Купчей нет: продажа по договору.','Ground floor, no balcony; a separate entrance from the courtyard is possible. No title deed: sold by contract.')}),
 P({id:'u109',mode:'sale',district:'binaqadi',x:128,y:78,place:L('Binəqədi qəsəbəsi, 3 sot həyət','Посёлок Бинагади, участок 3 сотки','Binagadi settlement, 300 m² plot'),
  plan:[['liv',24.0],['bed',16.0],['bed',14.2],['bed',12.6],['ter',12.0],['kit',15.4],['hall',11.8],['bath',6.0],['wc',2.4]],
  price:189000,floor:1,floors:1,type:'house',series:'house',year:2008,reno:'good',heat:'kombi',kupca:true,lift:0,park:'yard',ceil:3.0,metro:25,posted:'2026-10-15',seller:'owner',photos:['u109-view'],
  desc:L('Bir mərtəbəli daş ev, örtülü terras və 3 sot həyət. Su çəni və qaz xətti var; həyətdə iki maşın yeri.','Одноэтажный каменный дом, крытая терраса и участок 3 сотки. Есть бак для воды и газ; во дворе два машиноместа.','A single-storey stone house with a covered terrace on a 300 m² plot. Water tank and gas connection; two parking spaces in the yard.')}),
 P({id:'u110',mode:'sale',district:'sabail',x:452,y:452,place:L('İçərişəhər yaxınlığı','Рядом с Ичеришехер','Next to Icherisheher'),
  plan:[['liv',28.6],['bed',18.2],['bed',15.8],['bal',4.6],['kit',12.4],['hall',11.2],['bath',5.4]],
  price:365000,floor:2,floors:3,type:'old',series:'pre',year:1912,reno:'good',heat:'kombi',kupca:true,lift:0,park:'none',ceil:3.8,metro:3,posted:'2026-10-31',seller:'agency',photos:['u110-bed','u110-bath'],
  desc:L('1912-ci il daş binası, 3,8 m tavan və orijinal taxta qapılar. Fasad qorunan tikili kimi qeydiyyatdadır: dəyişikliklər icazə ilə.','Каменный дом 1912 года, потолки 3,8 м и оригинальные деревянные двери. Фасад охраняется: изменения только с разрешения.','A 1912 stone building with 3.8 m ceilings and original timber doors. The façade is listed, so alterations need a permit.')}),
 P({id:'u111',mode:'sale',district:'xatai',x:725,y:306,place:L('Xətai metrosu, Babək prospekti','Метро Хатаи, проспект Бабека','Khatai metro, Babak Avenue'),
  plan:[['liv',18.8],['bed',13.4],['bed',11.6],['bal',4.0],['kit',8.4],['hall',7.6],['bath',3.4],['wc',1.4]],
  price:134000,floor:8,floors:9,type:'old',series:'czech',year:1986,reno:'none',heat:'central',kupca:true,lift:1,park:'yard',ceil:2.7,metro:4,posted:'2026-10-20',seller:'owner',photos:['u111-view'],
  desc:L('Çex layihəsi, ayrı otaqlar və iki tərəfə pəncərələr. Təmir tələb olunur; dam 2024-cü ildə yenilənib.','Чешский проект, изолированные комнаты и окна на две стороны. Нужен ремонт; кровля обновлена в 2024 году.','Czech-series block with separate rooms and windows on two sides. Needs renovation; the roof was redone in 2024.')}),
 P({id:'u201',mode:'rent',district:'nasimi',x:470,y:362,place:L('Nizami metrosu','Метро Низами','Nizami metro'),
  plan:[['liv',21.4],['bed',15.6],['bal',4.4],['kit',11.2],['hall',8.0],['bath',4.6]],
  price:1300,floor:6,floors:15,type:'new',series:'new',year:2018,reno:'design',heat:'kombi',furnished:true,deposit:1,lift:2,park:'under',ceil:3.0,metro:3,posted:'2026-11-02',seller:'owner',photos:['u201-bath'],
  desc:L('Əşyalı iki otaqlı mənzil, məişət texnikası ilə. Kommunal xərclər kirayəçinin üzərindədir.','Двухкомнатная квартира с мебелью и техникой. Коммунальные платежи оплачивает арендатор.','A furnished two-room flat with appliances. Utilities are paid by the tenant.')}),
 P({id:'u202',mode:'rent',district:'yasamal',x:292,y:326,place:L('İnşaatçılar','Иншаатчылар','Inshaatchilar'),
  plan:[['kl',26.8],['bal',3.2],['hall',5.0],['bath',4.2]],
  price:650,floor:4,floors:10,type:'new',series:'new',year:2015,reno:'good',heat:'kombi',furnished:true,deposit:1,lift:1,park:'yard',ceil:2.8,metro:5,posted:'2026-10-28',seller:'owner',photos:[],
  desc:L('Tələbə və tək yaşayanlar üçün studiya. Universitetlərə piyada 10 dəqiqə.','Студия для студентов и одиноких жильцов. До университетов 10 минут пешком.','A studio for students or one person. Ten minutes’ walk to the universities.')}),
 P({id:'u203',mode:'rent',district:'narimanov',x:652,y:142,place:L('Nərimanov metrosu','Метро Нариманов','Narimanov metro'),
  plan:[['liv',18.2],['bed',13.0],['bed',11.4],['bal',3.8],['kit',8.0],['hall',7.0],['bath',3.2],['wc',1.2]],
  price:900,floor:4,floors:9,type:'old',series:'lenin',year:1981,reno:'good',heat:'kombi',furnished:true,deposit:1,lift:1,park:'yard',ceil:2.7,metro:6,posted:'2026-10-25',seller:'agency',photos:['u203-bed'],
  desc:L('Ailə üçün üç otaqlı mənzil, otaqlar ayrıdır. Məktəb və bazar yaxındadır.','Трёхкомнатная квартира для семьи, комнаты изолированы. Рядом школа и рынок.','A three-room family flat with separate rooms. A school and a market are close by.')}),
 P({id:'u204',mode:'rent',district:'sabail',x:560,y:470,place:L('Dənizkənarı bulvar','Приморский бульвар','Seaside boulevard'),
  plan:[['liv',30.4],['bed',18.6],['bed',15.2],['bal',7.4],['kit',14.8],['hall',12.2],['bath',6.0],['wc',2.2]],
  price:2600,floor:3,floors:4,type:'new',series:'new',year:2016,reno:'design',heat:'kombi',furnished:true,deposit:2,lift:1,park:'under',ceil:3.2,metro:6,posted:'2026-10-30',seller:'agency',photos:['u204-building'],
  desc:L('Bulvara baxan geniş eyvan, iki yataq otağı. Minimum müqavilə müddəti 12 ay.','Большой балкон с видом на бульвар, две спальни. Минимальный срок договора 12 месяцев.','A large balcony over the boulevard and two bedrooms. Minimum lease twelve months.')}),
 P({id:'u205',mode:'rent',district:'binaqadi',x:192,y:214,place:L('Azadlıq prospekti','Проспект Азадлыг','Azadliq Avenue'),
  plan:[['liv',16.4],['bed',11.8],['bal',3.2],['kit',7.2],['hall',5.6],['bath',3.0]],
  price:550,floor:5,floors:9,type:'old',series:'xrush',year:1972,reno:'good',heat:'kombi',furnished:false,deposit:1,lift:1,park:'yard',ceil:2.6,metro:4,posted:'2026-10-22',seller:'owner',photos:['u205-view'],
  desc:L('Əşyasız iki otaqlı mənzil, təzə təmir. Uzunmüddətli kirayəçiyə üstünlük verilir.','Двухкомнатная квартира без мебели, свежий ремонт. Предпочтение долгосрочным арендаторам.','An unfurnished two-room flat, freshly renovated. Long-term tenants preferred.')}),
 P({id:'u206',mode:'rent',district:'xatai',x:800,y:474,place:L('Ağ şəhər','Белый город','White City'),
  plan:[['kl',30.2],['bed',15.8],['bal',5.6],['hall',7.4],['bath',5.0]],
  price:1500,floor:10,floors:16,type:'new',series:'new',year:2022,reno:'design',heat:'kombi',furnished:true,deposit:1,lift:2,park:'under',ceil:3.0,metro:12,posted:'2026-11-01',seller:'agency',photos:[],
  desc:L('Yeni məhəllədə əşyalı mənzil, mətbəx-qonaq otağı buxtaya baxır.','Меблированная квартира в новом квартале, кухня-гостиная с видом на бухту.','A furnished flat in the new quarter; the kitchen-living room looks over the bay.')}),
 P({id:'u207',mode:'rent',district:'narimanov',x:612,y:104,place:L('Ulduz metrosu','Метро Улдуз','Ulduz metro'),
  plan:[['liv',18.6],['bal',3.0],['kit',9.4],['hall',5.2],['bath',3.8]],
  price:700,floor:3,floors:12,type:'new',series:'new',year:2017,reno:'good',heat:'kombi',furnished:false,deposit:1,lift:1,park:'yard',ceil:2.9,metro:8,posted:'2026-10-19',seller:'owner',photos:[],
  desc:L('Bir otaqlı mənzil, ayrıca mətbəx. Ev heyvanı ilə razılaşma mümkündür.','Однокомнатная квартира с отдельной кухней. Можно договориться о домашнем питомце.','A one-room flat with a separate kitchen. Pets can be agreed with the owner.')})
];
for(const l of LISTINGS){
 l.area=Math.round(l.plan.reduce((s,[,a])=>s+a,0)*10)/10;
 l.rooms=l.plan.filter(([t])=>HABITABLE.includes(t)).length;
 l.ppm=l.mode==='sale'?Math.round(l.price/l.area):Math.round(l.price/l.area*10)/10;
}
