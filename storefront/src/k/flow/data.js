// Sample data for Flow CRM as configured for "Nar Catering" (fictional). Build-time only (uses Tx leaves).
// Every amount is derived from headcount and portion price, so the board, drawer and totals always agree.
import {L} from '../kit.js';

export const TODAY='2026-11-03';
export const WORKDAYS=21; // working days per month used for daily lunch contracts

export const owners=[
 {id:'lm',name:'Leyla Məmmədova',ini:'LM'},
 {id:'ra',name:'Rauf Əliyev',ini:'RƏ'},
 {id:'nh',name:'Nigar Həsənova',ini:'NH'},
 {id:'oq',name:'Orxan Quliyev',ini:'OQ'}
];

export const stages=[
 {id:'lead',p:10,name:L('Müraciət','Заявка','Inquiry'),rule:L('Saytdan, zəngdən və ya tövsiyədən gələn sorğu. İşçi sayı və nahar saatı öyrənilir.','Запрос с сайта, по звонку или по рекомендации. Уточняются число сотрудников и время обеда.','A request from the website, a call or a referral. Headcount and lunch hour are confirmed.')},
 {id:'tasting',p:30,name:L('Dequstasiya','Дегустация','Tasting'),rule:L('Ofisdə 5 yeməkdən ibarət sınaq nahar. Rəy toplanmadan təklif göndərilmir.','Пробный обед из 5 блюд в офисе клиента. Предложение отправляется только после отзыва.','A five-dish trial lunch at the client’s office. No proposal goes out before feedback.')},
 {id:'proposal',p:50,name:L('Təklif','Предложение','Proposal'),rule:L('Porsiya qiyməti, menyu dövrü və çatdırılma saatı olan rəsmi təklif.','Официальное предложение: цена порции, цикл меню и время доставки.','A formal offer with portion price, menu cycle and delivery time.')},
 {id:'negotiation',p:70,name:L('Danışıqlar','Переговоры','Negotiation'),rule:L('Müddət, avans və müqavilə şərtləri müzakirə olunur.','Обсуждаются срок, аванс и условия договора.','Term, advance payment and contract terms are discussed.')},
 {id:'won',p:100,name:L('Müqavilə','Договор','Signed'),rule:L('Müqavilə imzalanıb; ilk çatdırılma planlaşdırılır.','Договор подписан; планируется первая доставка.','Contract signed; the first delivery is being planned.')},
 {id:'lost',p:0,name:L('İtirildi','Потеряна','Lost'),rule:L('Səbəb mütləq qeyd olunur ki, hesabatda görünsün.','Причина обязательна, чтобы она попала в отчёт.','A reason is required so it shows up in reporting.')}
];

export const roles={
 hr:L('HR meneceri','HR-менеджер','HR manager'),
 office:L('Ofis meneceri','Офис-менеджер','Office manager'),
 admin:L('İnzibati direktor','Административный директор','Head of administration'),
 event:L('Tədbir koordinatoru','Координатор мероприятий','Event coordinator'),
 ceo:L('Direktor','Директор','Managing director'),
 buy:L('Satınalma mütəxəssisi','Специалист по закупкам','Procurement specialist')
};

export const nextSteps={
 qualify:L('Zəng: işçi sayı və nahar saatı','Звонок: число сотрудников и время обеда','Call: headcount and lunch hour'),
 tasting:L('Ofisdə dequstasiya təşkil et','Организовать дегустацию в офисе','Arrange a tasting at their office'),
 call:L('Zəng: dequstasiyadan sonra rəy','Звонок: отзыв после дегустации','Call: feedback after the tasting'),
 menu:L('Həftəlik menyu nümunəsini göndər','Отправить пример недельного меню','Send a sample weekly menu'),
 offer:L('Yenilənmiş təklifi göndər','Отправить обновлённое предложение','Send the revised proposal'),
 legal:L('Müqavilə layihəsini hüquqşünaslara göndər','Отправить проект договора юристам','Send the draft contract to their lawyers'),
 meet:L('Görüş: satınalma komitəsi','Встреча с закупочным комитетом','Meeting with the procurement committee'),
 guests:L('Qonaq sayını dəqiqləşdir','Уточнить число гостей','Confirm the guest count'),
 start:L('İlk çatdırılma: həftəlik planı təsdiqlət','Первая доставка: утвердить план недели','First delivery: confirm the weekly plan'),
 invoice:L('Avans hesab-fakturasını göndər','Отправить счёт на аванс','Send the advance invoice')
};

export const lostReasons={
 price:L('qiymət rəqibdən yüksək oldu','цена выше, чем у конкурента','our price was above a competitor’s'),
 inhouse:L('öz yeməkxanalarını açdılar','открыли собственную столовую','they opened their own canteen'),
 timing:L('tədbir ləğv edildi','мероприятие отменено','the event was cancelled')
};

export const kinds={
 daily:L('Gündəlik nahar','Ежедневный обед','Daily lunch'),
 event:L('Tədbir','Мероприятие','Event')
};

// Activity templates; {people} {price} {months} {reason} are filled per deal.
export const acts={
 in_daily:L('Müraciət: {people} nəfər üçün gündəlik nahar','Заявка: ежедневный обед на {people} человек','Inquiry: daily lunch for {people} people'),
 in_event:L('Müraciət: {people} qonaqlı tədbir','Заявка: мероприятие на {people} гостей','Inquiry: event for {people} guests'),
 tasting:L('Dequstasiya keçirildi, menyudan 5 yemək','Проведена дегустация, 5 блюд из меню','Tasting held, five dishes from the menu'),
 proposal:L('Təklif göndərildi: porsiya {price}','Отправлено предложение: порция {price}','Proposal sent: {price} per portion'),
 neg_daily:L('Danışıqlar: {months} aylıq müddət müzakirə olunur','Переговоры: обсуждается срок {months} мес.','Negotiation: a {months}-month term is on the table'),
 neg_event:L('Danışıqlar: menyu və xidmət personalı razılaşdırılır','Переговоры: согласуются меню и обслуживающий персонал','Negotiation: menu and serving staff being agreed'),
 won:L('Müqavilə imzalandı','Договор подписан','Contract signed'),
 lost:L('Sövdələşmə itirildi: {reason}','Сделка потеряна: {reason}','Deal lost: {reason}')
};

// [id, company, contact, role, type, people, price, months, stage, owner, next, nextOffsetDays, createdDaysAgo, lostReason]
export const deals=[
 [1,'Xəzər Logistika','Səbinə Rzayeva','hr','daily',140,8.5,12,'negotiation','lm','legal',2,34],
 [2,'Kaspi Rəqəmsal','Tural Bayramov','office','daily',65,9.5,6,'proposal','ra','call',1,18],
 [3,'Atəşgah Sığorta','Günel İsmayılova','admin','daily',210,7.8,12,'tasting','nh','call',0,12],
 [4,'Sahil Biznes Mərkəzi','Elçin Hüseynov','buy','daily',320,7.2,12,'negotiation','oq','meet',6,52],
 [5,'Bulvar Media','Aynur Qasımova','event','event',180,32,0,'proposal','lm','guests',-1,9],
 [6,'Kür Enerji','Rəşad Abbasov','hr','daily',95,8.9,12,'lead','ra','qualify',0,2],
 [7,'Piral Arxitektura','Lalə Səfərova','office','daily',28,10.5,6,'lead','nh','tasting',3,4],
 [8,'Zəka Məktəbi','Fərid Nəsirov','admin','daily',460,5.9,9,'proposal','oq','offer',2,21],
 [9,'Şirvan Tekstil','Nərmin Cəfərova','hr','daily',75,8.2,12,'won','lm','start',5,61],
 [10,'Nizami Kitab Evi','Kamran Mehdiyev','ceo','event',60,28,0,'tasting','ra','call',1,7],
 [11,'Abşeron Hüquq Bürosu','Ülviyyə Kərimova','office','daily',42,11,12,'negotiation','nh','offer',-2,29],
 [12,'Qala Telekom','Samir Novruzov','buy','daily',520,7.4,12,'tasting','oq','meet',8,15],
 [13,'Göy Göl Dizayn','Aysel Məlikova','ceo','event',40,30,0,'won','nh','invoice',1,20],
 [14,'Talış Turizm','Vüqar Talıbov','event','event',220,26,0,'lead','lm','guests',2,1],
 [15,'Mərdəkan Klinikası','Sevinc Əhmədova','admin','daily',85,8,12,'proposal','ra','call',3,16],
 [16,'Bakı Mühəndislik Mərkəzi','Ramil Qurbanov','hr','daily',170,8.4,12,'lead','oq','qualify',1,3],
 [17,'Lənkəran Çay Evi','Zaur Əsgərov','ceo','event',120,24,0,'lost','lm','',0,40,'timing'],
 [18,'Gilan Mebel','Elnarə Paşayeva','hr','daily',110,7.9,12,'lost','ra','',0,44,'price'],
 [19,'Orbit Proqram','Cavid Hacıyev','office','daily',55,9.8,12,'won','ra','start',4,48],
 [20,'Ağ Şəhər Ofis Parkı','Nailə Bağırova','admin','daily',260,7.6,12,'proposal','nh','meet',5,24],
 [21,'Qobustan Film','Toğrul Əzizov','event','event',90,34,0,'negotiation','oq','guests',2,13],
 [22,'Yasamal Tibb Laboratoriyası','Könül Rüstəmova','office','daily',36,9.2,6,'tasting','lm','call',2,10],
 [23,'Səma Aviaservis','Elvin Məmmədli','hr','daily',300,7.5,12,'lost','nh','',0,57,'inhouse'],
 [24,'Bakı Dizayn Həftəsi','Fidan Əlizadə','event','event',400,22,0,'won','oq','guests',9,33]
];
