// Casa Forma — fictional architecture & interior studio in Baku. All projects, people and figures are samples.
import {L} from '../kit.js';

export const TYPES={
 home:L('Yaşayış','Жильё','Residential'),
 public:L('İctimai','Общественные','Public'),
 work:L('İş məkanı','Офисы','Workplace'),
 stay:L('Qonaqpərvərlik','Гостеприимство','Hospitality')
};
export const STATUS={
 done:L('Tamamlanıb','Завершён','Completed'),
 site:L('Tikintidə','Строится','On site'),
 study:L('Konsepsiya','Концепция','Study')
};

// Plans are drawn from these room rectangles (metres); areas on the drawing are computed from the same numbers.
export const projects=[
 {id:'stair-house',no:'CF-31',type:'home',status:'done',year:2025,area:312,months:19,
  name:L('Pilləkən evi','Дом с лестницей','The Stair House'),
  place:L('Mərdəkan, Abşeron','Мардакан, Апшерон','Mardakan, Absheron'),
  lead:L('Köhnə bağ evinin yerində üç səviyyəli ailə evi. Hər şey bir polad pilləkənin ətrafında qurulub: o, işığı damdan zirzəmiyə qədər endirir.','Семейный дом в три уровня на месте старой дачи. Всё построено вокруг стальной лестницы: она проводит свет от крыши до цокольного этажа.','A three-level family house on the site of an old dacha. Everything is organised around one steel stair that carries daylight from the roof down to the lower ground floor.'),
  brief:L('Brif: altı nəfərlik ailə, yay küləyinə açıq həyət, nənə üçün birinci mərtəbədə ayrıca otaq və köhnə ənciri saxlamaq.','Бриф: семья из шести человек, двор, открытый летнему ветру, отдельная комната для бабушки на первом этаже и сохранить старый инжир.','Brief: a family of six, a courtyard open to the summer wind, a ground-floor room for the grandmother, and keep the old fig tree.'),
  decision:L('Qərar: evi ənciri əhatə edən L formasında qurduq; pilləkən şaxtası təbii ventilyasiya bacası kimi işləyir, yayda kondisionersiz saatlar artır.','Решение: дом в форме буквы L обнимает инжир; шахта лестницы работает как вытяжная труба естественной вентиляции, летом дольше можно обходиться без кондиционера.','Decision: an L-shaped house wraps the fig; the stair shaft works as a stack-ventilation chimney, extending the hours without air conditioning in summer.'),
  photos:['stair-steel','stair-oak','oak-niche'],materials:['mat-oak','mat-stone'],
  plan:{w:18,h:12,rooms:[[0,0,7,6,L('Qonaq otağı','Гостиная','Living')],[7,0,5,6,L('Mətbəx','Кухня','Kitchen')],[12,0,6,6,L('Yemək','Столовая','Dining')],[0,6,5,6,L('Nənənin otağı','Комната бабушки','Grandmother')],[5,6,3,6,L('Pilləkən','Лестница','Stair')],[8,6,10,6,L('Həyət','Двор','Courtyard'),'open']]}},
 {id:'shell',no:'CF-28',type:'public',status:'done',year:2024,area:180,months:11,
  name:L('Beton qabıq','Бетонная оболочка','Concrete Shell'),
  place:L('Bilgəh sahili','Побережье Бильгя','Bilgah shore'),
  lead:L('Çimərlik yolu üzərində kölgə pavilyonu: 9 sm qalınlığında tökmə beton qabıq və altında açıq ictimai zal.','Теневой павильон на пляжной тропе: литая бетонная оболочка толщиной 9 см и открытый общественный зал под ней.','A shade pavilion on the beach path: a 9 cm cast concrete shell with an open public room beneath it.'),
  brief:L('Brif: yayda 40°C istidə kölgə, qışda xəzri küləyindən sığınacaq, minimum texniki qulluq.','Бриф: тень в 40-градусную жару летом, укрытие от хазри зимой, минимум обслуживания.','Brief: shade in 40°C summer heat, shelter from the khazri wind in winter, minimal maintenance.'),
  decision:L('Qərar: qabığın açıq tərəfi cənub-şərqə baxır; şimal küləyini divar yox, qabığın öz əyriliyi kəsir.','Решение: открытая сторона оболочки смотрит на юго-восток; северный ветер отсекает не стена, а сама кривизна оболочки.','Decision: the open side faces south-east; the north wind is cut by the shell’s own curvature rather than a wall.'),
  photos:['shell','shell-steps'],materials:['mat-floor'],
  plan:{w:16,h:10,rooms:[[0,0,16,7,L('Açıq zal','Открытый зал','Open hall'),'open'],[0,7,5,3,L('Kafe','Кафе','Kiosk')],[5,7,4,3,L('Duş','Душ','Showers')],[9,7,7,3,L('Pillələr','Ступени','Steps'),'open']]}},
 {id:'nasimi',no:'CF-35',type:'work',status:'site',year:2026,area:2400,months:26,
  name:L('Nəsimi ofis qülləsi','Офисная башня в Насими','Nasimi Office Tower'),
  place:L('Nəsimi, Bakı','Насими, Баку','Nasimi, Baku'),
  lead:L('14 mərtəbəli ofis binasının fasad və ictimai qatları: girişdən terrasa qədər eyni daş və eyni ritm.','Фасад и общественные этажи 14-этажного офисного здания: от входа до террасы один камень и один ритм.','Façade and public floors of a 14-storey office building: one stone and one rhythm from the entrance to the roof terrace.'),
  brief:L('Brif: icarəçilər üçün çevik mərtəbələr, qərb fasadında günəşin azaldılması, lobbinin şəhərə açılması.','Бриф: гибкие этажи для арендаторов, защита западного фасада от солнца, лобби, открытое городу.','Brief: flexible floors for tenants, solar control on the west façade, a lobby that opens to the street.'),
  decision:L('Qərar: 60 sm dərinlikli şaquli daş lamellər qərb günəşini kəsir; lobbi səki ilə eyni səviyyədə, pillələr içəridə həll olunub.','Решение: вертикальные каменные ламели глубиной 60 см режут западное солнце; лобби на уровне тротуара, перепад решён внутри.','Decision: 60 cm deep vertical stone fins cut the western sun; the lobby sits level with the pavement and the change in height is taken inside.'),
  photos:['tower','tower-stair'],materials:['mat-stone'],
  plan:{w:24,h:16,rooms:[[0,0,10,16,L('Açıq ofis','Открытый офис','Open office')],[10,0,4,8,L('Nüvə','Ядро','Core')],[10,8,4,8,L('Görüş','Переговорная','Meeting')],[14,0,10,16,L('Açıq ofis','Открытый офис','Open office')]]}},
 {id:'sumgait-steps',no:'CF-22',type:'public',status:'done',year:2023,area:1150,months:9,
  name:L('Bulvar pillələri','Ступени бульвара','Boulevard Steps'),
  place:L('Sumqayıt bulvarı','Бульвар Сумгайыта','Sumgait boulevard'),
  lead:L('Şəhər meydanından dənizə enən 4,2 metrlik hündürlük fərqi oturacaq pillələrə çevrildi.','Перепад высоты 4,2 м от городской площади к морю превратился в ступени-скамьи.','A 4.2-metre drop from the town square to the sea became a run of seating steps.'),
  brief:L('Brif: əlil arabası ilə tam keçid, axşam tədbirləri, mövcud ağacların qorunması.','Бриф: полная доступность для колясок, вечерние мероприятия, сохранение существующих деревьев.','Brief: full wheelchair access, evening events, keep the existing trees.'),
  decision:L('Qərar: pillələr arasında 1:20 mailli rampa zolağı; ağaclar üçün pillələrdə dörd “ada” saxlanıldı.','Решение: между ступенями пандус с уклоном 1:20; для деревьев в ступенях оставлены четыре «острова».','Decision: a 1:20 ramp threads between the steps; four “islands” are left in the steps for the trees.'),
  photos:['steps','steps-green'],materials:['mat-floor','mat-stone'],
  plan:{w:20,h:10,rooms:[[0,0,20,3,L('Meydan','Площадь','Square'),'open'],[0,3,14,5,L('Oturacaq pillələr','Ступени-скамьи','Seating steps'),'open'],[14,3,6,5,L('Rampa','Пандус','Ramp'),'open'],[0,8,20,2,L('Sahil yolu','Набережная','Sea walk'),'open']]}},
 {id:'ganja-atrium',no:'CF-37',type:'stay',status:'study',year:2026,area:3600,months:null,
  name:L('Atrium oteli','Отель с атриумом','Atrium Hotel'),
  place:L('Gəncə','Гянджа','Ganja'),
  lead:L('1970-ci illərin otel binasının yenidən qurulması üçün konsepsiya: qapalı dəhlizlər açıq atriuma çevrilir.','Концепция реконструкции гостиничного здания 1970-х: глухие коридоры превращаются в открытый атриум.','A study for remodelling a 1970s hotel building: blind corridors become an open atrium.'),
  brief:L('Brif: 84 otağı saxlamaq, ortaq zonaları artırmaq, mövcud karkası sökməmək.','Бриф: сохранить 84 номера, увеличить общие зоны, не сносить существующий каркас.','Brief: keep 84 rooms, add shared space, do not demolish the existing frame.'),
  decision:L('Qərar: mərkəzi dəhliz plitələri kəsilir, üstə şüşə fənər qoyulur; gecə atrium işıqlandırılmış həyət kimi işləyir.','Решение: плиты центрального коридора прорезаются, сверху ставится стеклянный фонарь; ночью атриум работает как освещённый двор.','Decision: the central corridor slabs are cut open under a glazed lantern; at night the atrium reads as a lit courtyard.'),
  photos:['atrium','atrium-night'],materials:['mat-green','mat-oak'],
  plan:{w:22,h:14,rooms:[[0,0,22,4,L('Otaqlar','Номера','Rooms')],[0,4,22,6,L('Atrium','Атриум','Atrium'),'open'],[0,10,22,4,L('Otaqlar','Номера','Rooms')]]}},
 {id:'old-city',no:'CF-26',type:'home',status:'done',year:2024,area:146,months:14,
  name:L('Qala divarı yanında ev','Дом у крепостной стены','House by the Wall'),
  place:L('İçərişəhər, Bakı','Ичеришехер, Баку','Old City, Baku'),
  lead:L('XIX əsr evinin bərpası: daş pilləkən, taxta pəncərələr və yeni mətbəx köhnə divarlara toxunmadan qurulub.','Реставрация дома XIX века: каменная лестница, деревянные окна и новая кухня встроены, не касаясь старых стен.','Restoring a 19th-century house: the stone stair, timber windows and a new kitchen, built without touching the old walls.'),
  brief:L('Brif: mühafizə zonası qaydaları, nəm divarlar, iki nəfər üçün müasir mətbəx və vanna.','Бриф: правила охранной зоны, сырые стены, современная кухня и ванная для двоих.','Brief: conservation-zone rules, damp walls, a modern kitchen and bathroom for two.'),
  decision:L('Qərar: yeni hər şey divardan 5 sm aralı, sökülə bilən taxta “mebel” kimi qurulub; divarlar əhəngli suvaqla nəfəs alır.','Решение: всё новое стоит в 5 см от стены как съёмная деревянная «мебель»; стены дышат под известковой штукатуркой.','Decision: everything new stands 5 cm off the wall as removable timber “furniture”; the walls breathe under lime plaster.'),
  photos:['old-stair','old-window'],materials:['mat-stone','mat-green'],
  plan:{w:12,h:12,rooms:[[0,0,6,6,L('Mətbəx','Кухня','Kitchen')],[6,0,6,6,L('Otaq','Комната','Living')],[0,6,4,6,L('Pilləkən','Лестница','Stair')],[4,6,4,6,L('Vanna','Ванная','Bath')],[8,6,4,6,L('Yataq','Спальня','Bedroom')]]}}
];

export const materials=[
 {key:'mat-stone',name:L('Abşeron əhəngdaşı','Апшеронский известняк','Absheron limestone'),note:L('Yerli karxanadan, isti və məsaməli. Fasad və həyət döşəməsi üçün.','Из местного карьера, тёплый и пористый. Для фасадов и мощения дворов.','From a local quarry, warm and porous. For façades and courtyard paving.'),used:['stair-house','nasimi','sumgait-steps','old-city']},
 {key:'mat-oak',name:L('Yağlanmış palıd','Промасленный дуб','Oiled oak'),note:L('Pilləkən, pəncərə taxçası və daxili qapılar; lak deyil, yağ — təmiri asandır.','Лестницы, оконные ниши и межкомнатные двери; не лак, а масло — легко обновлять.','Stairs, window seats and doors; oil rather than lacquer, so it can be repaired.'),used:['stair-house','ganja-atrium']},
 {key:'mat-floor',name:L('Əhəng-torpaq suvaq','Известково-глиняная штукатурка','Lime and clay plaster'),note:L('Əllə çəkilən, darağın izi qalan səth; nəmi buraxır, köhnə daş divarlarda çatlamır.','Наносится вручную, со следом гребня; пропускает влагу и не трескается на старых каменных стенах.','Applied by hand with the comb marks left in; it lets moisture through and does not crack on old stone walls.'),used:['shell','old-city']},
 {key:'mat-green',name:L('Yaşıl yağlı boya','Зелёная масляная краска','Green oil paint'),note:L('Köhnə Bakı qapılarının rəngi; taxta detallarda tək vurğu kimi.','Цвет старых бакинских дверей; единственный акцент на деревянных деталях.','The colour of old Baku doors; the single accent on timber details.'),used:['ganja-atrium','old-city']}
];

export const stages=[
 [L('Ölçmə və brif','Обмеры и бриф','Survey and brief'),L('2–3 həftə','2–3 недели','2–3 weeks'),L('Yerində ölçmə, mövcud vəziyyətin çəkilişi, büdcə və proqramın yazılması.','Обмеры на месте, фотофиксация, бюджет и программа помещений.','Measured survey, existing conditions, budget and a written room programme.')],
 [L('Konsepsiya','Концепция','Concept'),L('4–6 həftə','4–6 недель','4–6 weeks'),L('İki-üç plan variantı, maket və material lövhəsi. Bir istiqamət seçirik.','Два-три варианта плана, макет и доска материалов. Выбираем одно направление.','Two or three plan options, a model and a material board. We choose one direction.')],
 [L('Layihələndirmə','Проектирование','Design development'),L('8–12 həftə','8–12 недель','8–12 weeks'),L('Konstruktor və mühəndislərlə koordinasiya, işıq, mebel və detallar.','Координация с конструкторами и инженерами, свет, мебель и детали.','Coordination with structural and services engineers, lighting, joinery and details.')],
 [L('İşçi sənədlər','Рабочая документация','Construction documents'),L('6–8 həftə','6–8 недель','6–8 weeks'),L('Tender üçün çertyojlar, spesifikasiya və smeta; podratçı seçiminə kömək.','Чертежи для тендера, спецификации и смета; помощь в выборе подрядчика.','Tender drawings, specifications and cost plan; help choosing a contractor.')],
 [L('Müəllif nəzarəti','Авторский надзор','Site supervision'),L('Tikinti boyu','Весь период стройки','Throughout construction'),L('Həftəlik obyekt səfəri, nümunələrin təsdiqi, qüsurların siyahısı və təhvil.','Еженедельные выезды, утверждение образцов, списки замечаний и сдача.','Weekly site visits, sample approvals, snagging lists and handover.')]
];

export const team=[
 ['Leyla Məmmədova',L('Baş memar, təsisçi','Главный архитектор, основатель','Principal architect, founder')],
 ['Orxan Əliyev',L('İnteryer və mebel','Интерьер и мебель','Interiors and joinery')],
 ['Nigar Həsənova',L('Layihə rəhbəri, smeta','Руководитель проектов, сметы','Project lead, cost control')],
 ['Tural Quliyev',L('Texniki çertyojlar, BIM','Рабочие чертежи, BIM','Technical drawings, BIM')]
];
