// Concept mini-sites: data + a pure HTML renderer used by scripts/i18n-pages.mjs (no DOM needed).
// Every visible string is an Azerbaijani key translated through i18n/strings.js. Names and data are samples, not real clients.
import {projects} from './projects.js';
import {renderShowroom,showroomIds} from './showroom.js';
import {showroomMeta} from './showroom-copy.js';
export const conceptIds=['casa','olio','aurea','forma','atelier','flow','reserve','stock',...showroomIds];
const nav=(...a)=>a;
export const concepts={
 casa:{kind:'site',brand:'Casa Forma',nav:nav('Layihələr','Studiya','Əlaqə'),headline:'Ruhu olan məkanlar.',cta:'Layihələrə bax',
  cards:[['Yaşayış interyerləri','Evlər üçün sakit və funksional məkan həlləri.'],['Kommersiya məkanları','Ofis, mağaza və restoran interyerləri.'],['Eskizdən təhvilə qədər','Konsepsiyadan icraya qədər bütün mərhələlər bir komandadadır.']],
  section:'Seçilmiş layihələr',items:['Villa nümunəsi','Kitab evi interyeri','Sahil kafesi']},
 olio:{kind:'site',brand:'Olio',nav:nav('Menyu','Məkan','Rezervasiya'),headline:'Süfrəmizdə sizə yer var.',cta:'Rezervasiya sorğusu',
  cards:[['Mövsümi menyu','Yerli məhsullardan hazırlanan yeməklər üçün nümunə təsvir.'],['Məkanın hekayəsi','Məkan, komanda və yanaşma haqqında qısa təqdimat.'],['Rezervasiya sorğusu','Qonaq sayı və vaxtı seçərək sorğu göndərmə axını.']],
  section:'Menyudan nümunələr',items:['Yaz salatı','Odun sobasında çörək','Mövsümi desert']},
 aurea:{kind:'site',brand:'Aurea',nav:nav('Otaqlar','Təcrübələr','Rezervasiya'),headline:'Bir az da qalın.',cta:'Müraciət göndər',
  cards:[['Otaqlar','Hər otaq tipi üçün qalereya və qısa təsvir.'],['Təcrübələr','Qonaqlar üçün fəaliyyət və xidmətlərin təqdimatı.'],['Qonaq müraciəti','Tarix və qonaq sayı ilə sadə müraciət axını.']],
  section:'Otaq növləri',items:['Klassik otaq','Ailə süiti','Panoram süit']},
 forma:{kind:'site',brand:'Forma Store',nav:nav('Kolleksiyalar','Məhsullar','Səbət'),headline:'Birlikdə yaşayacağınız əşyalar.',cta:'Kolleksiyaya bax',
  cards:[['Redaktə edilmiş kolleksiyalar','Məhsullar mövzu və əhval üzrə qruplaşdırılır.'],['Məhsul səhifələri','Şəkillər, təsvir və seçimlər aydın və səliqəli göstərilir.'],['Səbət axını','Seçimdən sifarişə qədər qısa və aydın yol.']],
  section:'Nümunə məhsullar',items:['Keramika vaza','Toxunma plaid','Taxta məcməyi']},
 atelier:{kind:'site',brand:'Atelier No.8',nav:nav('İşlər','Haqqında','Əlaqə'),headline:'Qeyri-adiyə baxan göz.',cta:'İşlərə bax',
  cards:[['Seçilmiş işlər','İşlər ön plana çıxır; mətn minimal saxlanılır.'],['Şəxsi yanaşma','Müəllif haqqında qısa və səmimi təqdimat.'],['Əməkdaşlıq','Yeni layihə üçün birbaşa əlaqə yolu.']],
  section:'Nümunə işlər',items:['Portret seriyası','Brend kampaniyası','Küçə fotoqrafiyası']},
 flow:{kind:'app',brand:'Flow CRM',nav:nav('Panel','Müştərilər','Tapşırıqlar'),headline:'Hər şey bir axında.',
  cards:[['Müştəri bazası','Əlaqə və tarixçə bir yerdə.'],['Satış axını','Mərhələlər üzrə sadə vizual izləmə.'],['Tapşırıqlar','Komanda üçün gündəlik iş siyahısı.']],
  section:'Satış lövhəsi',board:{columns:[['Yeni',['Müştəri A','Müştəri B']],['Təklif göndərilib',['Müştəri C']],['Təsdiqlənib',['Müştəri D','Müştəri E']]]}},
 reserve:{kind:'app',brand:'Reserve',nav:nav('Təqvim','Müştərilər','Xidmətlər'),headline:'Daha çoxuna yer açın.',
  cards:[['Təqvim','Gün və həftə üzrə boş vaxtlar.'],['Rezervasiya axını','Vaxt seçimi və təsdiq mərhələləri.'],['Müştəri idarəetməsi','Müştəri tarixçəsi və qeydlər.']],
  section:'Həftəlik təqvim',board:{days:['B.e.','Ç.a.','Ç.','C.a.','C.'],times:['10:00','12:00','14:00'],booked:['0-1','1-0','1-3','2-2','3-1','4-0','4-2']}},
 stock:{kind:'app',brand:'Stockroom',nav:nav('Məhsullar','Sifarişlər','Anbar'),headline:'Hər şeyə öz yeri.',
  cards:[['Məhsullar','Qalıq və qiymət məlumatları bir cədvəldə.'],['Sifarişlər','Yeni sifarişlərin və statusların izlənməsi.'],['Anbar hərəkətləri','Daxil olma və çıxışların qeydi.']],
  section:'Anbar cədvəli',board:{head:['Məhsul','Qalıq','Status'],rows:[['Məhsul A',48,'Kifayətdir'],['Məhsul B',12,'Azdır'],['Məhsul C',230,'Kifayətdir']]}}
};
for(const id of showroomIds)concepts[id]={kind:showroomMeta[id].kind==='app'?'app':'site',brand:showroomMeta[id].brand,custom:true};
// Shared strings used by the shell/ribbon and by service pages.
export const conceptUi=['Nümunə','Bu, BAKHY tərəfindən hazırlanmış konsept nümunəsidir. Real müştəri və ya xidməti təsvir etmir.','Bu konsepti fərdiləşdir','Bütün konseptlər','Bu səhifədəki ad, mətn və məlumatlar nümunədir.','Konsept nümunələri','Konsept saytını aç','Boş','Rezerv'];

const e=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
export function conceptMeta(id,T){
 const p=projects.find(x=>x.id===id),c=concepts[id];
 return {title:T('{name} — konsept nümunəsi | BAKHY',{name:c.brand}),desc:T(p.desc),service:c.kind==='app'?'system':'website',design:c.kind==='app'||c.custom?'':id};
}
export function renderConcept(id,T){
 if(concepts[id].custom)return renderShowroom(id,T);
 const c=concepts[id],cards=c.cards.map(([h,d],i)=>`<article><span>0${i+1}</span><h3>${e(T(h))}</h3><p>${e(T(d))}</p></article>`).join('');
 const nav=c.nav.map(n=>`<span>${e(T(n))}</span>`).join('');
 const sub=T(projects.find(p=>p.id===id).desc);
 const note=`<p class="cs-note">${e(T('Bu səhifədəki ad, mətn və məlumatlar nümunədir.'))}</p>`;
 if(c.kind==='site'){
  return `<div class="cs-site"><div class="cs-nav"><strong>${e(c.brand)}</strong><nav>${nav}</nav></div>`+
   `<section class="cs-hero"><div><h1>${e(T(c.headline))}</h1><p>${e(sub)}</p><span class="cs-btn">${e(T(c.cta))}</span></div><div class="cs-art" aria-hidden="true"><i></i><i></i><i></i></div></section>`+
   `<section class="cs-cards">${cards}</section>`+
   `<section class="cs-list"><h2>${e(T(c.section))}</h2><ol>${c.items.map((it,i)=>`<li><span>0${i+1}</span><strong>${e(T(it))}</strong><i aria-hidden="true"></i></li>`).join('')}</ol></section>${note}</div>`;
 }
 let board='';
 if(id==='flow')board=`<div class="cs-board">${c.board.columns.map(([h,items])=>`<div class="cs-col"><h3>${e(T(h))}</h3>${items.map(x=>`<div class="cs-card">${e(T(x))}</div>`).join('')}</div>`).join('')}</div>`;
 if(id==='reserve'){
  const b=new Set(c.board.booked);
  board=`<div class="cs-cal">${c.board.days.map((d,di)=>`<div class="cs-day"><h3>${e(T(d))}</h3>${c.board.times.map((t,ti)=>{const on=b.has(`${di}-${ti}`);return `<div class="cs-slot${on?' is-booked':''}"><b>${t}</b><span>${e(T(on?'Rezerv':'Boş'))}</span></div>`}).join('')}</div>`).join('')}</div>`;
 }
 if(id==='stock')board=`<table class="cs-table"><thead><tr>${c.board.head.map(h=>`<th>${e(T(h))}</th>`).join('')}</tr></thead><tbody>${c.board.rows.map(([n,q,s])=>`<tr><td>${e(T(n))}</td><td>${q}</td><td><span class="cs-pill${s==='Azdır'?' is-low':''}">${e(T(s))}</span></td></tr>`).join('')}</tbody></table>`;
 return `<div class="cs-app"><aside><strong>${e(c.brand)}</strong>${nav}</aside><div class="cs-main"><h1>${e(T(c.headline))}</h1><p>${e(sub)}</p><section class="cs-cards">${cards}</section><h2>${e(T(c.section))}</h2>${board}${note}</div></div>`;
}
