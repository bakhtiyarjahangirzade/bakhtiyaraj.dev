// AutoLane sample stock. Every number here is used on cards, detail, compare and finance alike.
// Build-time only (imports kit.js for translatable leaves).
import {L} from '../kit.js';

export const FUEL={petrol:L('Benzin','Бензин','Petrol'),diesel:L('Dizel','Дизель','Diesel'),hybrid:L('Hibrid','Гибрид','Hybrid'),electric:L('Elektrik','Электро','Electric')};
export const GEAR={auto:L('Avtomat','Автомат','Automatic'),manual:L('Mexaniki','Механика','Manual')};
export const BODY={sedan:L('Sedan','Седан','Saloon'),suv:L('Krossover','Кроссовер','SUV'),hatch:L('Hetçbek','Хэтчбек','Hatchback'),wagon:L('Universal','Универсал','Estate')};
export const DRIVE={fwd:L('Ön','Передний','Front'),rwd:L('Arxa','Задний','Rear'),awd:L('Tam','Полный','All-wheel')};
export const HUB={baku:L('Bakı, Xətai mərkəzi','Баку, центр Хатаи','Bakı, Xətai centre'),ganja:L('Gəncə mərkəzi','Центр Гянджа','Gəncə centre'),sumgait:L('Sumqayıt mərkəzi','Центр Сумгайыт','Sumqayıt centre')};
export const COLOUR={white:L('Ağ','Белый','White'),grey:L('Boz','Серый','Grey'),silver:L('Gümüşü','Серебристый','Silver'),black:L('Qara','Чёрный','Black'),red:L('Qırmızı','Красный','Red'),blue:L('Göy','Синий','Blue'),green:L('Yaşıl','Зелёный','Green'),beige:L('Bej','Бежевый','Beige'),yellow:L('Sarı','Жёлтый','Yellow')};

// The 120-point inspection: six systems, named check items (a representative subset of each system is itemised in the report).
export const SYSTEMS=[
 {id:'body',n:22,name:L('Kuzov və şüşələr','Кузов и стёкла','Body and glass'),items:[
  ['paint',L('Lak qatının qalınlığı, 13 panel','Толщина ЛКП, 13 панелей','Paint thickness, 13 panels')],['gaps',L('Panel aralıqları','Зазоры панелей','Panel gaps')],['glass',L('Şüşələr, güzgülər, silgilər','Стёкла, зеркала, щётки','Glass, mirrors, wipers')],['rust',L('Altlıq və korroziya','Днище и коррозия','Underbody and corrosion')],['lamps',L('Fara və fənər şüşələri','Стёкла фар и фонарей','Headlamp and lamp lenses')],['seals',L('Qapılar və kipləşdiricilər','Двери и уплотнители','Doors and seals')]]},
 {id:'tyres',n:18,name:L('Təkərlər və əyləclər','Шины и тормоза','Tyres and brakes'),items:[
  ['tread',L('Protektor dərinliyi','Глубина протектора','Tread depth')],['age',L('Təkərlərin yaşı (DOT)','Возраст шин (DOT)','Tyre age (DOT)')],['pads',L('Əyləc bəndləri','Тормозные колодки','Brake pads')],['discs',L('Əyləc diskləri','Тормозные диски','Brake discs')],['hand',L('Dayanacaq əyləci','Стояночный тормоз','Parking brake')],['align',L('Təkərlərin tənzimlənməsi','Развал-схождение','Wheel alignment')]]},
 {id:'engine',n:28,name:L('Mühərrik və transmissiya','Двигатель и трансмиссия','Engine and gearbox'),items:[
  ['start',L('Soyuq işəsalma','Холодный запуск','Cold start')],['leaks',L('Yağ və maye sızmaları','Подтёки масла и жидкостей','Oil and fluid leaks')],['obd',L('Xəta kodları (OBD)','Коды ошибок (OBD)','Fault codes (OBD)')],['shift',L('Sürət keçidləri','Переключение передач','Gear changes')],['cool',L('Soyutma sistemi','Система охлаждения','Cooling system')],['service',L('Servis tarixçəsi və yağ','Сервисная история и масло','Service history and oil')]]},
 {id:'electrics',n:20,name:L('Elektrik və elektronika','Электрика и электроника','Electrics'),items:[
  ['battery',L('12V akkumulyator','Аккумулятор 12V','12V battery')],['lights',L('İşıqlandırma','Освещение','Lighting')],['media',L('Multimedia və kameralar','Мультимедиа и камеры','Infotainment and cameras')],['windows',L('Şüşə qaldırıcılar, kilidlər','Стеклоподъёмники, замки','Windows and locks')],['climate',L('Kondisioner və iqlim','Кондиционер и климат','Air conditioning')],['sensors',L('Park sensorları','Парктроники','Parking sensors')]]},
 {id:'interior',n:16,name:L('Salon və təhlükəsizlik','Салон и безопасность','Interior and safety'),items:[
  ['belts',L('Oturacaqlar və kəmərlər','Сиденья и ремни','Seats and belts')],['srs',L('Təhlükəsizlik yastıqları (SRS)','Подушки безопасности (SRS)','Airbags (SRS)')],['upholstery',L('Üzlük və döşəmə','Обивка и покрытие пола','Upholstery and carpets')],['odo',L('Yürüşün uyğunluğu','Соответствие пробега','Mileage consistency')],['isofix',L('ISOFIX bərkidiciləri','Крепления ISOFIX','ISOFIX anchors')],['damp',L('Rütubət və qoxu','Влага и запах','Damp and odour')]]},
 {id:'road',n:16,name:L('Yol testi','Тест-драйв','Road test'),items:[
  ['steer',L('Sükan və mərkəzləmə','Руль и центровка','Steering and centring')],['brakeLine',L('Əyləcləmədə düz xətt','Прямолинейность при торможении','Straight-line braking')],['suspension',L('Asqı səsləri','Шумы подвески','Suspension noise')],['load',L('Yük altında transmissiya','Трансмиссия под нагрузкой','Gearbox under load')],['adas',L('Kruiz və köməkçi sistemlər','Круиз и ассистенты','Cruise and driver assists')],['noise',L('90 km/s-da səs-küy','Шум на 90 км/ч','Noise at 90 km/h')]]}
];
export const TOTAL=SYSTEMS.reduce((s,x)=>s+x.n,0); // 120

// Advisories found on individual cars: system, item, note. Everything not listed passed.
const ADV={
 tyreRear:['tyres','tread',L('Arxa təkərlərdə protektor 3,2 mm. 5 000 km ərzində dəyişdirmək tövsiyə olunur.','Протектор задних шин 3,2 мм. Рекомендуется замена в течение 5 000 км.','Rear tyre tread 3.2 mm. Replace within 5,000 km.')],
 tyreAge:['tyres','age',L('Ön təkərlər 2019-cu il istehsalıdır; rezin sərtləşməyə başlayıb.','Передние шины 2019 года выпуска, резина начала твердеть.','Front tyres date from 2019 and the rubber is starting to harden.')],
 padsFront:['tyres','pads',L('Ön əyləc bəndləri 4 mm. Növbəti servisdə dəyişin.','Передние колодки 4 мм. Заменить на следующем ТО.','Front brake pads 4 mm. Replace at the next service.')],
 stoneChip:['body','glass',L('Ön şüşədə sürücü zonasından kənarda 4 mm-lik daş izi.','Скол 4 мм на лобовом стекле вне зоны водителя.','4 mm stone chip on the windscreen, outside the driver’s view.')],
 bumper:['body','paint',L('Arxa bamper rənglənib (lak qatı 210 µm). Struktur zədə tapılmayıb.','Задний бампер перекрашен (ЛКП 210 мкм). Структурных повреждений нет.','Rear bumper repainted (210 µm). No structural damage found.')],
 battery:['electrics','battery',L('12V akkumulyatorun sağlamlığı 71%. Qışdan əvvəl yoxlatdırın.','Здоровье аккумулятора 12V 71%. Проверьте перед зимой.','12V battery health 71%. Have it checked before winter.')],
 ac:['electrics','climate',L('Kondisionerin soyutma gücü normadan aşağıdır; freon doldurulması tövsiyə olunur.','Кондиционер охлаждает ниже нормы, рекомендуется заправка.','Air conditioning cools below spec; a re-gas is recommended.')],
 seat:['interior','upholstery',L('Sürücü oturacağının yan dayağında dəri aşınması.','Потёртость кожи на боковой поддержке водительского сиденья.','Leather wear on the driver’s seat bolster.')],
 susp:['road','suspension',L('Kələ-kötür yolda ön asqıdan yüngül tıqqıltı; stabilizator dirəkləri yoxlanmalıdır.','Лёгкий стук спереди на неровностях, проверить стойки стабилизатора.','Light knock from the front suspension on rough roads; check the anti-roll bar links.')],
 oil:['engine','service',L('Növbəti yağ dəyişməsinə 1 200 km qalıb; satışdan əvvəl ediləcək.','До замены масла 1 200 км; будет выполнена до продажи.','Oil change due in 1,200 km; it will be done before handover.')],
 sensor:['electrics','sensors',L('Arxa sol park sensoru fasilələrlə işləyir.','Задний левый парктроник срабатывает с перебоями.','Rear left parking sensor works intermittently.')],
 wipers:['body','glass',L('Ön silgilər köhnəlib, iz qoyur.','Передние щётки изношены, оставляют полосы.','Front wiper blades are worn and smear.')]
};

// Stock. photo = asset key under motors/ (or the owner-supplied hero image), crops make the gallery from the same car's photo.
const c=(o)=>o;
export const CARS=[
 c({id:'AL-2133',make:'Chery',model:'Tiggo 7 Pro',trim:'1.5T Luxury',year:2023,km:18900,fuel:'petrol',gear:'auto',body:'suv',engine:1.5,hp:147,drive:'fwd',cons:7.4,owners:1,colour:'grey',hub:'baku',price:36900,inspected:'2026-10-29',adv:['wipers'],tread:[6.8,6.9,6.6,6.7],pads:[9,8],paint:[96,132],soh:94,photo:'hero'}),
 c({id:'AL-2141',make:'Toyota',model:'RAV4',trim:'2.5 Hybrid Prestige',year:2021,km:64200,fuel:'hybrid',gear:'auto',body:'suv',engine:2.5,hp:218,drive:'awd',cons:5.6,owners:1,colour:'white',hub:'baku',price:47900,inspected:'2026-10-31',adv:['stoneChip'],tread:[5.9,6.0,5.4,5.5],pads:[7,7],paint:[101,140],soh:88,photo:'c1'}),
 c({id:'AL-2138',make:'Hyundai',model:'Tucson',trim:'2.0 Comfort',year:2020,km:71500,fuel:'petrol',gear:'auto',body:'suv',engine:2.0,hp:156,drive:'awd',cons:8.6,owners:2,colour:'silver',hub:'baku',price:38500,inspected:'2026-10-27',adv:['tyreRear','ac'],tread:[5.1,5.0,3.2,3.3],pads:[7,6],paint:[94,138],soh:83,photo:'c2'}),
 c({id:'AL-2135',make:'Kia',model:'Rio',trim:'1.6 Luxe',year:2019,km:88000,fuel:'petrol',gear:'auto',body:'sedan',engine:1.6,hp:123,drive:'fwd',cons:6.7,owners:1,colour:'red',hub:'ganja',price:21400,inspected:'2026-10-24',adv:['padsFront','battery','oil'],tread:[4.8,4.9,5.6,5.6],pads:[4,6],paint:[90,128],soh:71,photo:'c3'}),
 c({id:'AL-2129',make:'Toyota',model:'Yaris',trim:'1.5 Hybrid',year:2020,km:92000,fuel:'hybrid',gear:'auto',body:'hatch',engine:1.5,hp:116,drive:'fwd',cons:3.9,owners:2,colour:'white',hub:'sumgait',price:21900,inspected:'2026-10-22',adv:['tyreAge','susp','seat','bumper'],tread:[4.2,4.1,4.6,4.5],pads:[6,5],paint:[92,210],soh:79,photo:'c4'}),
 c({id:'AL-2127',make:'Volkswagen',model:'Passat Variant',trim:'2.0 TDI Comfortline',year:2018,km:96400,fuel:'diesel',gear:'auto',body:'wagon',engine:2.0,hp:150,drive:'fwd',cons:5.0,owners:2,colour:'grey',hub:'baku',price:27400,inspected:'2026-10-30',adv:['seat','sensor'],tread:[6.1,6.2,5.8,5.7],pads:[8,7],paint:[118,151],soh:86,photo:'c5'}),
 c({id:'AL-2122',make:'Volkswagen',model:'Golf',trim:'1.4 TSI Highline',year:2019,km:77300,fuel:'petrol',gear:'manual',body:'hatch',engine:1.4,hp:150,drive:'fwd',cons:5.8,owners:2,colour:'blue',hub:'baku',price:24600,inspected:'2026-10-26',adv:['padsFront'],tread:[6.0,6.1,6.3,6.2],pads:[4,7],paint:[99,135],soh:90,photo:'c6'}),
 c({id:'AL-2120',make:'Suzuki',model:'Swift',trim:'1.2 GL',year:2021,km:39800,fuel:'petrol',gear:'manual',body:'hatch',engine:1.2,hp:83,drive:'fwd',cons:4.9,owners:1,colour:'yellow',hub:'ganja',price:17900,inspected:'2026-10-25',adv:[],tread:[6.4,6.5,6.6,6.6],pads:[9,8],paint:[88,121],soh:92,photo:'c7'}),
 c({id:'AL-2116',make:'Hyundai',model:'Elantra',trim:'2.0 Elegance',year:2022,km:29400,fuel:'petrol',gear:'auto',body:'sedan',engine:2.0,hp:150,drive:'fwd',cons:7.2,owners:1,colour:'grey',hub:'baku',price:31200,inspected:'2026-11-01',adv:[],tread:[7.0,7.1,7.2,7.2],pads:[10,9],paint:[97,129],soh:96,photo:'c8'}),
 c({id:'AL-2112',make:'BYD',model:'Atto 3',trim:'Extended Range',year:2023,km:15900,fuel:'electric',gear:'auto',body:'suv',engine:0,hp:204,drive:'fwd',cons:15.6,owners:1,colour:'grey',hub:'baku',price:39400,inspected:'2026-10-28',adv:['sensor'],tread:[6.9,6.9,6.8,6.8],pads:[10,10],paint:[104,136],soh:98,photo:'c9'}),
 c({id:'AL-2108',make:'Land Rover',model:'Range Rover',trim:'4.4 SDV8 Vogue',year:2013,km:158000,fuel:'diesel',gear:'auto',body:'suv',engine:4.4,hp:339,drive:'awd',cons:9.4,owners:3,colour:'black',hub:'baku',price:46800,inspected:'2026-10-23',adv:['susp','tyreRear','oil'],tread:[5.2,5.3,3.4,3.3],pads:[6,6],paint:[110,148],soh:77,photo:'c10'}),
 c({id:'AL-2104',make:'Ford',model:'EcoSport',trim:'1.5 Titanium',year:2019,km:104500,fuel:'petrol',gear:'auto',body:'suv',engine:1.5,hp:123,drive:'fwd',cons:6.9,owners:2,colour:'blue',hub:'ganja',price:19800,inspected:'2026-10-21',adv:['ac','wipers'],tread:[5.5,5.4,5.9,5.8],pads:[7,7],paint:[93,137],soh:81,photo:'c11'})
];
export {ADV};
