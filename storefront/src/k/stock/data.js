// Sample warehouse of "Dən Roastery" (fictional, Bakı). Build-time only (Tx leaves).
// Quantities are reconciled: reserved = open café order lines; the audit log ends at the current on-hand figure.
import {L} from '../kit.js';

export const TODAY='2026-11-03';
export const units={kg:L('kg','кг','kg'),pcs:L('əd.','шт.','pcs'),pack:L('paket','уп.','packs'),btl:L('şüşə','бут.','bottles'),ctn:L('qutu','кор.','cartons')};
export const cats={
 green:L('Yaşıl dən','Зелёное зерно','Green coffee'),roasted:L('Qovrulmuş dən','Обжаренное зерно','Roasted coffee'),
 cups:L('Stəkan və qapaq','Стаканы и крышки','Cups and lids'),filters:L('Filtrlər','Фильтры','Filters'),
 syrups:L('Siroplar','Сиропы','Syrups'),milk:L('Bitki südü','Растительное молоко','Plant milk')
};
export const suppliers={
 kaspi:'Kaspi Kofe İdxal',own:L('Öz qovurma sexi','Собственный цех обжарки','Our roastery'),agqab:'Ağ Qab MMC',barista:'Barista Təchizat',sirin:'Şirin Dad',goy:'Göy Tarla'
};
// [code, name, cat, unit, onHand, min, usage per day, lead days, order multiple, supplier, location, unit cost AZN, roast source]
export const skus=[
 ['G-ETH-YIR',L('Efiopiya Yirgaçefe, yuyulmuş','Эфиопия Иргачеффе, мытая','Ethiopia Yirgacheffe, washed'),'green','kg',260,120,3.6,28,60,'kaspi','A-01',31],
 ['G-COL-HUI',L('Kolumbiya Huila','Колумбия Уила','Colombia Huila'),'green','kg',96,100,4.8,28,70,'kaspi','A-02',27],
 ['G-BRA-CER',L('Braziliya Serrado','Бразилия Серрадо','Brazil Cerrado'),'green','kg',640,180,16.7,21,60,'kaspi','A-03',19],
 ['G-KEN-AA',L('Keniya AA','Кения AA','Kenya AA'),'green','kg',70,40,1.4,35,60,'kaspi','A-04',36],
 ['R-ESP-DEN',L('Espresso qarışığı “Dən”','Эспрессо-смесь «Dən»','“Dən” espresso blend'),'roasted','kg',118,80,14,1,1,'own','B-01',0],
 ['R-ETH-FIL',L('Yirgaçefe, filtr qovurma','Иргачеффе, обжарка под фильтр','Yirgacheffe, filter roast'),'roasted','kg',22,25,3,1,1,'own','B-02',0],
 ['R-COL-ESP',L('Huila, espresso qovurma','Уила, обжарка под эспрессо','Huila, espresso roast'),'roasted','kg',41,30,4,1,1,'own','B-03',0],
 ['R-KEN-FIL',L('Keniya AA, filtr qovurma','Кения AA, обжарка под фильтр','Kenya AA, filter roast'),'roasted','kg',9,10,1.2,1,1,'own','B-04',0],
 ['C-CUP-250',L('Kağız stəkan 250 ml','Бумажный стакан 250 мл','Paper cup 250 ml'),'cups','pcs',9200,3000,520,7,1000,'agqab','C-01',0.09],
 ['C-CUP-350',L('Kağız stəkan 350 ml','Бумажный стакан 350 мл','Paper cup 350 ml'),'cups','pcs',2600,2500,380,7,1000,'agqab','C-02',0.11],
 ['C-LID-80',L('Qapaq 80 mm','Крышка 80 мм','Lid 80 mm'),'cups','pcs',12800,5000,860,7,1000,'agqab','C-03',0.04],
 ['F-V60-02',L('Konus filtr №02, 100 əd.','Конусный фильтр №02, 100 шт.','Cone filter #02, 100 pcs'),'filters','pack',72,30,2.4,10,10,'barista','D-01',6.5],
 ['F-BATCH',L('Partiya dəmləyici üçün filtr, 500 əd.','Фильтр для батч-брю, 500 шт.','Batch brewer filter, 500 pcs'),'filters','pack',12,8,0.5,10,4,'barista','D-02',24],
 ['S-VAN',L('Vanil siropu 1 l','Ванильный сироп 1 л','Vanilla syrup 1 l'),'syrups','btl',52,24,2.8,5,6,'sirin','E-01',11],
 ['S-CAR',L('Karamel siropu 1 l','Карамельный сироп 1 л','Caramel syrup 1 l'),'syrups','btl',0,18,2.1,5,6,'sirin','E-02',11],
 ['S-HAZ',L('Qəbələ fındığı siropu 1 l','Сироп из габалинского фундука 1 л','Qabala hazelnut syrup 1 l'),'syrups','btl',24,12,1.1,5,6,'sirin','E-03',13],
 ['M-OAT',L('Yulaf südü, barista 1 l','Овсяное молоко, бариста 1 л','Oat milk, barista 1 l'),'milk','ctn',160,48,14,4,12,'goy','F-01',4.2],
 ['M-ALM',L('Badam südü 1 l','Миндальное молоко 1 л','Almond milk 1 l'),'milk','ctn',60,24,4,4,12,'goy','F-02',5.1]
];
export const roastPairs={'R-ESP-DEN':'G-BRA-CER','R-ETH-FIL':'G-ETH-YIR','R-COL-ESP':'G-COL-HUI','R-KEN-FIL':'G-KEN-AA'};

export const cafes=['Fəvvarə Kofe','Köşk Espresso Bar','Dəniz Kafe','Qala Kitab Kafe','Nərimanov Coffee Lab','Xan Bağı Kafe, Gəncə'];
// [number, cafe index, status, created offset, due offset, lines]
export const orders=[
 [1048,0,'new',0,1,[['R-ESP-DEN',12],['C-CUP-250',1000],['C-LID-80',1000],['M-OAT',24]]],
 [1047,1,'picking',-1,0,[['R-ESP-DEN',8],['R-COL-ESP',4],['S-VAN',6],['S-CAR',6]]],
 [1046,2,'new',0,2,[['R-ETH-FIL',5],['F-V60-02',10],['C-CUP-350',600]]],
 [1045,3,'picking',-1,0,[['R-ESP-DEN',6],['M-ALM',12],['C-CUP-250',500]]],
 [1044,4,'new',0,3,[['R-KEN-FIL',4],['R-ETH-FIL',4],['F-V60-02',6],['F-BATCH',2]]],
 [1043,5,'shipped',-2,-1,[['R-ESP-DEN',10],['S-HAZ',6],['C-CUP-250',1000]]],
 [1042,0,'shipped',-3,-2,[['R-ESP-DEN',12],['M-OAT',24],['C-LID-80',1000]]],
 [1041,1,'shipped',-6,-5,[['R-ESP-DEN',8],['S-CAR',6],['S-VAN',6]]]
];

export const reasons={
 count:L('Sayım fərqi','Расхождение при инвентаризации','Stock count difference'),
 damage:L('Zədələnib','Повреждение','Damaged'),
 qc:L('Keyfiyyət yoxlaması / dequstasiya','Контроль качества / каппинг','Quality check / cupping'),
 expiry:L('Son istifadə tarixi keçib','Истёк срок годности','Past expiry date')
};
export const people={aysel:'Aysel',ruslan:'Ruslan'};

// Recent history, oldest first: [days ago, time, type, code, delta, ref, by, reason]. Balances are derived backwards from on-hand.
export const history=[
 [5,'10:20','ship','S-CAR',-6,'SF-1041','aysel'],
 [5,'10:20','ship','R-ESP-DEN',-8,'SF-1041','aysel'],
 [5,'10:20','ship','S-VAN',-6,'SF-1041','aysel'],
 [4,'09:05','receive','C-CUP-350',2000,'AQ-7781','aysel'],
 [3,'15:40','roast','G-BRA-CER',-60,'Q-1030','ruslan'],
 [3,'15:40','roast','R-ESP-DEN',50.4,'Q-1030','ruslan'],
 [2,'11:10','ship','R-ESP-DEN',-12,'SF-1042','aysel'],
 [2,'11:10','ship','M-OAT',-24,'SF-1042','aysel'],
 [2,'11:10','ship','C-LID-80',-1000,'SF-1042','aysel'],
 [2,'17:30','adjust','S-VAN',-1,'','aysel','damage'],
 [1,'09:30','receive','M-OAT',48,'GT-2290','aysel'],
 [1,'12:15','ship','R-ESP-DEN',-10,'SF-1043','aysel'],
 [1,'12:15','ship','S-HAZ',-6,'SF-1043','aysel'],
 [1,'12:15','ship','C-CUP-250',-1000,'SF-1043','aysel'],
 [0,'08:45','roast','G-ETH-YIR',-18,'Q-1031','ruslan'],
 [0,'08:45','roast','R-ETH-FIL',15.1,'Q-1031','ruslan'],
 [0,'09:50','adjust','F-V60-02',-2,'','aysel','count']
];
