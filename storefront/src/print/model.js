// Owner-approved prices from the edited workbook, 11 November 2026. All amounts are AZN.
// Stored carts contain choices only. Every displayed price is recalculated from this catalogue.
const L=(az,ru,en)=>[az,ru,en];
export const PERSONAL_EXTRA=0.10;
export const CATEGORIES={all:L('Hamısı','Все','All'),paper:L('Çap materialları','Печатные материалы','Print materials'),editorial:L('Nəşr və menyu','Издания и меню','Editorial & menus'),packaging:L('Qablaşdırma','Упаковка','Packaging'),identity:L('Brend və rəqəmsal','Бренд и цифровой дизайн','Brand & digital')};
const item=(id,name,category,standard,premium,unit='design',personal=false,scope=L('Bir dizayn, bir ölçü.','Один дизайн, один размер.','One design, one size.'))=>({id,name,category,standard,premium,unit,personal,scope,image:`/assets/print/${category}.webp`});
export const PRINT_PRODUCTS=[
 item('business-card',L('Vizit kart','Визитка','Business card'),'paper',20,40,'design',true,L('Bir vizual istiqamət. Şəxslər eyni dizaynda dəyişir.','Одно визуальное решение. Данные людей меняются в одном дизайне.','One visual direction. Personal details vary within the same design.')),
 item('booklet',L('Buklet','Буклет','Booklet'),'paper',35,50,'design',false,L('A4 açıq ölçü, 2 qat, 6 panel.','Формат A4 в развороте, 2 сгиба, 6 панелей.','A4 unfolded, 2 folds, 6 panels.')),
 item('diptych',L('Diklet','Лифлет (1 сгиб)','Folded leaflet'),'paper',50,80,'design',false,L('1 qat, 4 panel.','1 сгиб, 4 панели.','1 fold, 4 panels.')),
 item('flyer',L('Flayer','Флаер','Flyer'),'paper',20,40,'design',false,L('A5 və ya A4, bir üz.','A5 или A4, одна сторона.','A5 or A4, one side.')),
 item('rollup',L('Roll-up','Ролл-ап','Roll-up'),'paper',30,50),
 item('banner',L('Banner','Баннер','Banner'),'paper',4,9,'area',false,L('En × hündürlük üzrə dizayn sahəsi. Çap daxil deyil.','Площадь дизайна: ширина × высота. Печать не включена.','Design area: width × height. Printing is not included.')),
 item('catalogue',L('Kataloq','Каталог','Catalogue'),'editorial',5,10,'page'),
 item('menu',L('Menyu','Меню','Menu'),'editorial',5,10,'page'),
 item('poster-a5',L('A5 poster / afişa','Постер A5','A5 poster'),'editorial',15,29),
 item('poster-a4',L('A4 poster / afişa','Постер A4','A4 poster'),'editorial',15,29),
 item('invitation',L('Dəvətnamə','Приглашение','Invitation'),'paper',15,29,'design',true,L('Bir tədbir üçün ön və arxa üz.','Лицевая и оборотная стороны для одного события.','Front and back for one event.')),
 item('box',L('Qutu dizaynı','Дизайн коробки','Box design'),'packaging',10,20,'design',false,L('Hazır bıçaq şablonu üzərində bir məhsul üçün qrafika.','Графика для одного товара на готовой развёртке.','Graphics for one product on an existing dieline.')),
 item('dieline',L('Qutu bıçaq şablonu','Развёртка коробки','Box dieline'),'packaging',20,50,'design',false,L('Bir texniki açılım. İstehsalçının ölçü təsdiqi tələb olunur.','Одна развёртка. Размеры согласовываются с производителем.','One dieline. Dimensions must be confirmed by the manufacturer.')),
 item('vector',L('Loqonun vektorlaşdırılması','Векторизация логотипа','Logo vectorisation'),'identity',10,25,'design',false,L('Mövcud loqonun vektorda yenidən çəkilməsi.','Перерисовка существующего логотипа в векторе.','Redrawing an existing logo as vector artwork.')),
 item('branding',L('Brendinq / vizual kimlik','Брендинг / айдентика','Branding / visual identity'),'identity',499,900,'design',false,L('Brif üzrə razılaşdırılmış vizual kimlik paketi.','Пакет айдентики с объёмом, согласованным в брифе.','A visual identity package with scope agreed in the brief.')),
 item('logo',L('Loqo dizaynı','Дизайн логотипа','Logo design'),'identity',350,750,'design',false,L('Bir orijinal dizayn istiqaməti və vektor faylları.','Одно оригинальное направление дизайна и векторные файлы.','One original design direction and vector files.')),
 item('sticker',L('Etiket / stiker','Этикетка / стикер','Label / sticker'),'packaging',2,5),
 item('tag',L('Məhsul birkası','Бирка товара','Product tag'),'packaging',1,2,'design',false,L('Bir maket, ön və arxa üz.','Один макет, лицевая и оборотная стороны.','One layout, front and back.')),
 item('bag',L('Kağız çanta','Бумажный пакет','Paper bag'),'packaging',10,25),
 item('folder',L('Korporativ qovluq','Корпоративная папка','Presentation folder'),'paper',15,29),
 item('letterhead',L('Firma blankı','Фирменный бланк','Letterhead'),'identity',10,19),
 item('envelope',L('Zərf','Конверт','Envelope'),'paper',5,15),
 item('gift-card',L('Hədiyyə kartı / kupon','Подарочная карта / купон','Gift card / voucher'),'paper',10,19),
 item('table-menu',L('Masaüstü menyu / tent kart','Тейбл-тент','Table menu / tent card'),'editorial',15,29),
 item('certificate',L('Sertifikat / diplom','Сертификат / диплом','Certificate / diploma'),'paper',10,19,'design',true),
 item('book-cover',L('Kitab / jurnal üz qabığı','Обложка книги / журнала','Book / magazine cover'),'editorial',29,59,'design',false,L('Ön üz, bel və arxa üz.','Передняя сторона, корешок и задняя сторона.','Front, spine and back.')),
 item('presentation',L('Təqdimat','Презентация','Presentation'),'identity',20,50,'design',false,L('Bir təqdimat. Slayd sayı brifdə razılaşdırılır.','Одна презентация. Число слайдов согласуется в брифе.','One presentation. Slide count is agreed in the brief.')),
 item('social',L('Sosial media postu','Пост для соцсетей','Social media post'),'identity',10,19),
 item('adaptation',L('Hazır maketin adaptasiyası','Адаптация готового макета','Existing layout adaptation'),'identity',3,5)
];
export const BY_ID=new Map(PRINT_PRODUCTS.map(p=>[p.id,p]));
export const LEGACY_TYPES={card:'business-card',flyer:'flyer',poster:'poster-a4',brochure:'booklet'};
export const text=(v,lang='az')=>Array.isArray(v)?v[{az:0,ru:1,en:2}[lang]??0]:String(v??'');
export const money=(n,lang='az')=>`${new Intl.NumberFormat(lang==='az'?'ru-RU':lang==='ru'?'ru-RU':'en-GB',{maximumFractionDigits:2,minimumFractionDigits:0}).format(n)} AZN`;
const bounded=(v,min,max,def,integer=true)=>{if(v===''||v===null||v===undefined)return def;const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,integer?Math.trunc(n):Math.round(n*100)/100)):def;};
export function normalizeLine(raw){
 const p=BY_ID.get(raw?.product);if(!p)return null;
 return {key:typeof raw.key==='string'&&/^[a-zA-Z0-9-]{1,80}$/.test(raw.key)?raw.key:'',product:p.id,tier:raw.tier==='premium'?'premium':'standard',quantity:bounded(raw.quantity,1,100,1),units:p.unit==='page'?bounded(raw.units,1,500,1):1,width:p.unit==='area'?bounded(raw.width,0.1,100,1,false):1,height:p.unit==='area'?bounded(raw.height,0.1,100,1,false):1,people:p.personal?bounded(raw.people,1,100,1):1};
}
export function calculateLine(raw){
 const c=normalizeLine(raw);if(!c)return null;const p=BY_ID.get(c.product),rate=p[c.tier];
 const units=p.unit==='area'?Math.round(c.width*c.height*10000)/10000:p.unit==='page'?c.units:1;
 const baseCents=Math.round(rate*100*units*c.quantity);
 const personalCents=Math.round(baseCents*PERSONAL_EXTRA*(c.people-1));
 return {config:c,rate,units,base:baseCents/100,personal:personalCents/100,total:(baseCents+personalCents)/100,extraPeople:c.people-1};
}
export function normalizeCart(raw){
 if(!raw||raw.version!==1||!Array.isArray(raw.lines))return [];
 const seen=new Set();return raw.lines.slice(0,60).map(normalizeLine).filter(c=>{if(!c||!c.key||seen.has(c.key))return false;seen.add(c.key);return true;});
}
export const cartTotal=lines=>lines.reduce((sum,c)=>sum+Math.round((calculateLine(c)?.total||0)*100),0)/100;
export function addLine(lines,raw,key){if(lines.length>=60)throw new Error('cart-limit');const line=normalizeLine({...raw,key});if(!line||!line.key)throw new Error('invalid-line');return [...lines,line];}
export function filterProducts(q='',category='all'){
 const fold=s=>s.toLocaleLowerCase('az').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ə/g,'e').replace(/ı/g,'i');const words=fold(q).trim().split(/\s+/).filter(Boolean);
 return PRINT_PRODUCTS.filter(p=>(category==='all'||p.category===category)&&words.every(w=>fold(p.name.join(' ')).includes(w)));
}
