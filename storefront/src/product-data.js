import {projects} from './projects.js';
export const designs=[
{id:'casa',name:'Casa Forma',category:'Memarlıq & interyer',image:'/assets/concept-casa.svg'},
{id:'olio',name:'Olio',category:'Restoran & kafe',image:'/assets/concept-olio.svg'},
{id:'aurea',name:'Aurea',category:'Otel & qonaqpərvərlik',image:'/assets/concept-aurea.svg'},
{id:'forma',name:'Forma Store',category:'Onlayn mağaza',image:'/assets/concept-forma.svg'},
{id:'atelier',name:'Atelier No.8',category:'Şəxsi brend',image:'/assets/concept-atelier.svg'}
];
export const products={
website:{id:'website',title:'Veb sayt',price:199,group:'Veb xidmətlər',image:'/assets/concept-casa.svg',desc:'Brendinizə uyğun bir sayt. Vizual istiqaməti, səhifələri və sizə lazım olan funksiyaları özünüz seçin.',included:['1 səhifə','Azərbaycan dili','Mobil görünüş','WhatsApp keçidi'],pages:1,options:[
{id:'custom',label:'Sıfırdan fərdi dizayn',price:149,help:'Hazır vizual istiqaməti uyğunlaşdırmaq əvəzinə xüsusi görünüş.'},
{id:'form',label:'Müraciət forması',price:29,help:'Ziyarətçilərin saytdan sorğu göndərməsi.'},
{id:'cms',label:'Məzmun idarəetmə paneli',price:149,help:'Mətn və şəkilləri sonradan özünüz yeniləyin.'},
{id:'blog',label:'Bloq bölməsi',price:99,help:'Məqalələrin siyahısı və ayrıca məqalə səhifəsi.'},
{id:'catalog',label:'Məhsul kataloqu',price:149,help:'Məhsul səhifələri, kateqoriyalar və axtarış.'},
{id:'booking',label:'Rezervasiya müraciəti',price:199,help:'Xidmət və vaxt seçərək rezervasiya sorğusu.'},
{id:'payment',label:'Onlayn ödəniş bağlantısı',price:199,help:'Ödəniş provayderinin inteqrasiyası; provayder xərcləri ayrıdır.'}
]},
system:{id:'system',title:'Xüsusi sistem',price:799,group:'Veb xidmətlər',image:'/assets/concept-flow.svg',desc:'İşinizin qaydaları ilə işləyən sistem. Əsas iş axınını seçin, ehtiyacınıza uyğun modulları əlavə edin.',included:['1 əsas iş axını','İdarəetmə paneli','1 administrator rolu','Azərbaycan dili'],workflows:true,options:[
{id:'roles',label:'Komanda və istifadəçi rolları',price:99,help:'Əməkdaşlara fərqli giriş və idarəetmə imkanları.'},
{id:'reports',label:'Hesabatlar',price:99,help:'İşin nəticələrini ümumi hesabatlarda izləyin.'},
{id:'export',label:'Excel / CSV ixracı',price:49,help:'Məlumatları fayl kimi çıxarın.'},
{id:'notifications',label:'E-poçt bildirişləri',price:79,help:'Seçilmiş hadisələr haqqında avtomatik bildirişlər.'},
{id:'payment',label:'Onlayn ödəniş bağlantısı',price:199,help:'Ödəniş provayderi ilə inteqrasiya.'},
{id:'integration',label:'Digər proqramla inteqrasiya',price:199,help:'Bir xarici xidmətlə standart məlumat bağlantısı.'}
]},
integrated:{id:'integrated',title:'Veb sayt + sistem',price:1599,featured:true,group:'Veb xidmətlər',image:'/assets/concept-atelier.svg',desc:'Saytınız və işinizi idarə edən sistem bir layihədə. İctimai səhifələr və daxili iş axını bir-birinə bağlı işləyir.',included:['3 sayt səhifəsi','1 əsas iş axını','İdarəetmə paneli','Sayt və sistemin bağlantısı'],pages:3,workflows:true,options:[
{id:'custom',label:'Sıfırdan fərdi sayt dizaynı',price:149,help:'Brendiniz üçün ayrıca vizual istiqamət.'},
{id:'cms',label:'Saytın məzmun idarəetməsi',price:149,help:'İctimai səhifələrin mətn və şəkillərini yeniləyin.'},
{id:'roles',label:'Komanda və istifadəçi rolları',price:99,help:'İdarəetməyə bir neçə istifadəçi rolu əlavə edin.'},
{id:'reports',label:'Hesabatlar',price:99,help:'Əsas göstəriciləri ayrıca paneldə görün.'},
{id:'export',label:'Excel / CSV ixracı',price:49,help:'Məlumatları fayla çıxarın.'},
{id:'notifications',label:'E-poçt bildirişləri',price:79,help:'Sorğular və seçilmiş hadisələr üçün bildirişlər.'},
{id:'payment',label:'Onlayn ödəniş bağlantısı',price:199,help:'Saytdakı ödənişləri sistemə bağlayın.'},
{id:'integration',label:'Digər proqramla inteqrasiya',price:199,help:'Bir xarici xidmətlə standart məlumat bağlantısı.'}
]},
print:{id:'print',title:'Çap dizaynı',price:19,secondary:true,group:'Digər xidmətlər',desc:'Çapa hazır vizit kart, flayer və digər materiallar. Qiymət dizayn üçündür; çap ayrıca hesablanır.',included:['1 dizayn','1 üz / səhifə','Çapa hazır fayl'],options:[{id:'double',label:'İkinci üz',price:9,help:'İkiüzlü material üçün arxa tərəfin dizaynı.'},{id:'source',label:'Redaktə edilə bilən mənbə faylı',price:19,help:'Dizaynın sonradan redaktə üçün hazırlanması.'}]},
video:{id:'video',title:'Video montaj',price:9,secondary:true,group:'Digər xidmətlər',desc:'Məşqçilər üçün Reels, məşq və təqdimat videoları. Sadə montajdan başlayın, istədiyiniz əlavələri seçin.',included:['1 video','30 saniyəyədək','Sadə kəsim və birləşdirmə','5 dəqiqəyədək ilkin material'],options:[{id:'captions',label:'Altyazı',price:9,help:'Videonun danışıq mətninə uyğun altyazı.'},{id:'audio',label:'Səsin təmizlənməsi',price:9,help:'Əsas səs səviyyəsinin və fon səsinin işlənməsi.'},{id:'color',label:'Rəng düzəlişi',price:9,help:'Kadrların rəng və işıq balansı.'},{id:'titles',label:'Animasiya və başlıqlar',price:19,help:'Hərəkət adları, set / təkrar yazıları və sadə qrafika.'}]}
};
export const workflowNames={crm:'Müştəri uçotu',booking:'Rezervasiya',orders:'Sifariş idarəetməsi',custom:'Fərdi iş axını'};
export const printTypes={card:{name:'Vizit kart',price:0},flyer:{name:'Flayer',price:10},poster:{name:'Afişa',price:20},brochure:{name:'Broşur',price:30}};
export const videoLengths={'30':0,'60':9,'90':18,'180':39};
const clamp=(v,min,max,fallback)=>{const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.trunc(n))):fallback};
export function readConfig(params){const id=Object.hasOwn(products,params.get('service'))?params.get('service'):'website',p=products[id];return {id,design:designs.some(d=>d.id===params.get('design'))?params.get('design'):'casa',pages:clamp(params.get('pages')??p.pages??1,p.pages??1,20,p.pages??1),languages:['az',...['en','ru'].filter(l=>(params.get('languages')||'').split(',').includes(l))],workflow:Object.hasOwn(workflowNames,params.get('workflow'))?params.get('workflow'):'crm',modules:clamp(params.get('modules')??0,0,5,0),options:p.options.filter(o=>(params.get('options')||'').split(',').includes(o.id)).map(o=>o.id),printType:Object.hasOwn(printTypes,params.get('printType'))?params.get('printType'):'card',quantity:clamp(params.get('quantity')??1,1,20,1),sheets:clamp(params.get('sheets')??1,1,20,1),length:Object.hasOwn(videoLengths,params.get('length'))?params.get('length'):'30',raw:[5,10,15,20,25,30].includes(Number(params.get('raw')))?Number(params.get('raw')):5,reference:projects.some(p=>p.id===params.get('reference'))?params.get('reference'):''};}
export function calculate(c){const p=products[c.id],items=[];const add=(label,price)=>{if(price>0)items.push({label,price})};if(p.pages)add(`Əlavə səhifələr (${c.pages-p.pages} × 29 AZN)`,(c.pages-p.pages)*29);if(p.pages||p.workflows)add(`Əlavə dillər (${c.languages.length-1} × 49 AZN)`,(c.languages.length-1)*49);if(p.workflows)add(`Əlavə modullar (${c.modules} × 149 AZN)`,c.modules*149);if(c.id==='print'){add(printTypes[c.printType].name,printTypes[c.printType].price);add(`Əlavə səhifələr (${c.sheets-1} × 9 AZN)`,(c.sheets-1)*9)}if(c.id==='video'){add(`${c.length} saniyəlik video`,videoLengths[c.length]);add(`İlkin material: ${c.raw} dəqiqə`,Math.ceil((c.raw-5)/5)*9)}for(const o of p.options)if(c.options.includes(o.id))add(o.label,o.price);const unit=p.price+items.reduce((a,b)=>a+b.price,0),quantity=c.id==='video'?c.quantity:1;return {base:p.price,items,unit,quantity,total:unit*quantity};}
export function configParams(c){const p=products[c.id],q=new URLSearchParams({service:c.id});if(p.pages){q.set('design',c.design);q.set('pages',String(c.pages))}if(p.workflows){q.set('workflow',c.workflow);q.set('modules',String(c.modules))}if(p.pages||p.workflows)q.set('languages',c.languages.join(','));if(c.options.length)q.set('options',c.options.join(','));if(c.id==='print'){q.set('printType',c.printType);q.set('sheets',String(c.sheets))}if(c.id==='video'){q.set('quantity',String(c.quantity));q.set('length',c.length);q.set('raw',String(c.raw))}if(c.reference)q.set('reference',c.reference);return q;}
