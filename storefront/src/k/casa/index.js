// Casa Forma — monochrome project archive with case studies, a material library and an enquiry brief.
import {L,esc,credits} from '../kit.js';
import {projects,materials,stages,team,TYPES,STATUS} from './data.js';

const C={
 nav:[['#arxiv',L('Arxiv','Архив','Archive')],['#materiallar',L('Materiallar','Материалы','Materials')],['#proses',L('İş prosesi','Процесс','Process')],['#studiya',L('Studiya','Студия','Studio')]],
 brief:L('Layihə sorğusu','Запрос на проект','Project enquiry'),
 lead:L('Bakıda memarlıq və interyer studiyası. Evlər, ictimai məkanlar və bərpa — ölçmədən təhvilə qədər.','Студия архитектуры и интерьера в Баку. Дома, общественные пространства и реставрация — от обмеров до сдачи.','An architecture and interiors studio in Baku. Houses, public spaces and restoration — from survey to handover.'),
 open:L('Layihəni aç','Открыть проект','Open project'),
 prev:L('Əvvəlki layihə','Предыдущий проект','Previous project'),next:L('Növbəti layihə','Следующий проект','Next project'),
 featured:L('Seçilmiş layihə','Избранный проект','Featured project'),
 place:L('Yer','Место','Location'),year:L('İl','Год','Year'),area:L('Sahə','Площадь','Area'),status:L('Mərhələ','Стадия','Stage'),type:L('Tip','Тип','Type'),months:L('Müddət','Срок','Duration'),
 monthsN:L('{n} ay','{n} мес.','{n} months'),dash:L('hələ yoxdur','пока нет','not yet'),
 archiveH:L('Layihələr arxivi','Архив проектов','Project archive'),
 archiveP:L('Hər layihə bir sənəddir: brif, qərar, plan, materiallar. Növə və mərhələyə görə süzün.','Каждый проект — это документ: бриф, решение, план, материалы. Отфильтруйте по типу и стадии.','Each project is a file: brief, decision, plan, materials. Filter by type and stage.'),
 all:L('Hamısı','Все','All'),typeF:L('Layihə tipi','Тип проекта','Project type'),stageF:L('Mərhələ','Стадия','Stage'),
 view:L('Görünüş','Вид','View'),list:L('Siyahı','Список','Index'),plates:L('Lövhələr','Листы','Plates'),
 count:L('{n} layihə','Проектов: {n}','{n} projects'),
 empty:L('Bu süzgəcə uyğun layihə yoxdur.','Под этот фильтр проектов нет.','No project matches this filter.'),
 reset:L('Süzgəci sıfırla','Сбросить фильтр','Reset filter'),
 colNo:L('Nömrə','Номер','No.'),colName:L('Layihə','Проект','Project'),
 matH:L('Material kitabxanası','Библиотека материалов','Material library'),
 matP:L('Arxiv ağ-qaradır, çünki orada forma danışır. Material isə öz rəngi ilə gəlir: hər nümunə harada istifadə olunduğunu göstərir.','Архив чёрно-белый, потому что там говорит форма. Материал же приходит в своём цвете: каждый образец показывает, где он применён.','The archive is black and white because there the form speaks. Materials arrive in their own colour: each sample shows where it was used.'),
 usedIn:L('İstifadə olunub','Применён','Used in'),
 procH:L('Layihə necə gedir','Как идёт проект','How a project runs'),
 procP:L('Müddətlər 150–400 m² ev üçün nümunədir; ictimai binalarda mərhələlər daha uzun olur.','Сроки — пример для дома 150–400 м²; у общественных зданий этапы длиннее.','Durations are an example for a 150–400 m² house; public buildings take longer.'),
 studioH:L('Studiya','Студия','Studio'),
 studioP:L('Dörd nəfərik və eyni anda üçdən çox layihə götürmürük. Hər layihəni bir memar başdan sona aparır, obyektə də o gedir.','Нас четверо, и мы не берём больше трёх проектов одновременно. Каждый проект от начала до конца ведёт один архитектор, и на объект ездит тоже он.','We are four people and take no more than three projects at a time. One architect leads each project from start to finish and is the one who goes to site.'),
 principles:[
  [L('Mövcud olanı saxla','Сохраняй то, что есть','Keep what is there'),L('Ağac, divar, köhnə pəncərə — sökməzdən əvvəl ölçürük və çəkirik.','Дерево, стена, старое окно — прежде чем сносить, мы обмеряем и фиксируем.','A tree, a wall, an old window — we measure and record before anything is removed.')],
  [L('İqlim üçün çiz','Черти для климата','Draw for the climate'),L('Xəzri, 40°C yay, duzlu hava: kölgə və hava axını plandan başlayır.','Хазри, летние 40°C, солёный воздух: тень и проветривание начинаются с плана.','Khazri wind, 40°C summers, salty air: shade and airflow start on the plan.')],
  [L('Az material, yaxşı detal','Мало материалов, хорошие детали','Few materials, good details'),L('Bir layihədə adətən üç-dörd material; qalanı birləşmələrin işidir.','Обычно три-четыре материала на проект; остальное — работа узлов.','Usually three or four materials per project; the rest is the work of the joints.')]
 ],
 teamH:L('Komanda','Команда','Team'),
 officeH:L('Ofis','Офис','Office'),
 office:L('Nümunə ünvan: Rəşid Behbudov küç., Bakı. Görüşlər həftə içi 10:00–18:00, əvvəlcədən razılaşdırılmaqla.','Адрес-пример: ул. Рашида Бейбутова, Баку. Встречи по будням 10:00–18:00 по договорённости.','Sample address: Rashid Behbudov St, Baku. Meetings on weekdays 10:00–18:00 by appointment.'),
 formH:L('Layihənizi təsvir edin','Опишите ваш проект','Describe your project'),
 formP:L('Bu, ilk görüşə hazırlıqdır, müqavilə deyil. Ölçüləri bilmirsinizsə, təxmini yazın.','Это подготовка к первой встрече, а не договор. Если не знаете размеров, укажите примерно.','This prepares a first meeting; it is not a contract. If you do not know the sizes, an estimate is fine.'),
 fType:L('Nə layihələndirək?','Что проектируем?','What should we design?'),
 fTypes:[['house',L('Yeni ev','Новый дом','A new house')],['flat',L('Mənzil interyeri','Интерьер квартиры','Apartment interior')],['restore',L('Bərpa','Реставрация','Restoration')],['public',L('İctimai məkan','Общественное пространство','Public space')],['work',L('Ofis və ya mağaza','Офис или магазин','Office or shop')]],
 fPlace:L('Yer','Место','Location'),fPlaceHint:L('Məsələn: Mərdəkan, Nərimanov','Например: Мардакан, Нариманов','For example: Mardakan, Narimanov'),
 fArea:L('Təxmini sahə, m²','Примерная площадь, м²','Approximate area, m²'),
 fStage:L('Hazırda nə var?','Что есть сейчас?','What exists today?'),
 fStages:[['land',L('Torpaq sahəsi','Участок','A plot')],['building',L('Mövcud bina','Существующее здание','An existing building')],['shell',L('Qara karkas','Коробка без отделки','A bare shell')]],
 fBudget:L('Tikinti büdcəsi','Бюджет строительства','Construction budget'),
 fBudgets:[['',L('Seçin','Выберите','Choose')],['b1',L('100 000 AZN-ə qədər','до 100 000 AZN','up to 100,000 AZN')],['b2',L('100 000 – 300 000 AZN','100 000 – 300 000 AZN','100,000 – 300,000 AZN')],['b3',L('300 000 AZN-dən çox','более 300 000 AZN','over 300,000 AZN')],['b0',L('Hələ bilmirəm','Пока не знаю','Not sure yet')]],
 fName:L('Adınız','Ваше имя','Your name'),fPhone:L('Telefon','Телефон','Phone'),fNote:L('Qısa təsvir','Краткое описание','Short description'),
 fNoteHint:L('Neçə nəfər yaşayacaq, nə vacibdir, nəyi saxlamaq istəyirsiniz?','Сколько человек будет жить, что важно, что хотите сохранить?','How many people, what matters, what would you like to keep?'),
 fSend:L('Sorğunu hazırla','Подготовить запрос','Prepare enquiry'),
 eType:L('Layihə növünü seçin.','Выберите тип проекта.','Choose a project type.'),
 eArea:L('Sahəni 20 ilə 20 000 m² arasında rəqəmlə yazın.','Укажите площадь числом от 20 до 20 000 м².','Enter the area as a number between 20 and 20,000 m².'),
 eName:L('Adınızı yazın.','Укажите имя.','Enter your name.'),
 ePhone:L('Telefonu +994 50 123 45 67 formatında yazın.','Укажите телефон в формате +994 50 123 45 67.','Enter the phone as +994 50 123 45 67.'),
 eSummary:L('Formada {n} sahəni düzəldin.','Исправьте поля формы: {n}.','Fix {n} fields in the form.'),
 okH:L('Sorğu hazırdır','Запрос готов','Enquiry ready'),
 okP:L('Bu konsept nümunəsidir: heç nə göndərilməyib. Real saytda studiya 2 iş günü ərzində zəng edib ilk görüşü təklif edərdi.','Это концепт: ничего не отправлено. На реальном сайте студия позвонила бы в течение 2 рабочих дней и предложила первую встречу.','This is a concept: nothing was sent. On a real site the studio would call within 2 working days to suggest a first meeting.'),
 okEdit:L('Düzəliş et','Изменить','Edit'),
 close:L('Bağla','Закрыть','Close'),
 caseBrief:L('Tapşırıq','Задача','Brief'),caseDecision:L('Qərar','Решение','Decision'),
 plan:L('Plan','План','Plan'),planNote:L('Sxematik plan, birinci səviyyə. Sahələr otaqların ölçülərindən hesablanır.','Схематичный план, первый уровень. Площади вычислены из размеров помещений.','Schematic plan, first level. Areas are computed from the room dimensions.'),
 room:L('Otaq','Помещение','Room'),total:L('Cəmi plan üzrə','Итого по плану','Plan total'),openArea:L('açıq','откр.','open'),
 north:L('Şimal','Север','North'),
 matUsed:L('Materiallar','Материалы','Materials'),
 photoOf:L('{name}: fotoşəkil {n}','{name}: фото {n}','{name}: photograph {n}'),
 sample:L('Casa Forma uydurma studiyadır; layihələr, adlar və rəqəmlər nümunədir. Fotoşəkillər real binaları göstərir, lakin bu layihələrə aid deyil.','Casa Forma — вымышленная студия; проекты, имена и цифры — примеры. Фотографии показывают реальные здания, но не относятся к этим проектам.','Casa Forma is a fictional studio; projects, names and figures are samples. The photographs show real buildings that are not these projects.'),
 top:L('Yuxarı','Наверх','Top'),
 m2:'m²'
};

const fmtArea=(ctx,n)=>`${ctx.num(n)} m²`;

function planSvg(ctx,p){
 const s=22,pad=34,{w,h,rooms}=p.plan,W=w*s+pad*2,H=h*s+pad*2;
 const r=rooms.map(([x,y,rw,rh,name,kind])=>{
  const cx=pad+(x+rw/2)*s,cy=pad+(y+rh/2)*s,area=rw*rh;
  return `<g class="pl-room${kind?' is-open':''}"><rect x="${pad+x*s}" y="${pad+y*s}" width="${rw*s}" height="${rh*s}"/><text x="${cx}" y="${cy-4}" text-anchor="middle">${ctx.t(name)}</text><text class="pl-area" x="${cx}" y="${cy+12}" text-anchor="middle">${ctx.num(area)} m²</text></g>`;
 }).join('');
 const dim=`<g class="pl-dim"><line x1="${pad}" y1="${pad-16}" x2="${pad+w*s}" y2="${pad-16}"/><line x1="${pad}" y1="${pad-22}" x2="${pad}" y2="${pad-10}"/><line x1="${pad+w*s}" y1="${pad-22}" x2="${pad+w*s}" y2="${pad-10}"/><text x="${pad+w*s/2}" y="${pad-21}" text-anchor="middle">${ctx.num(w,{minimumFractionDigits:1})} m</text>`+
  `<line x1="${pad-16}" y1="${pad}" x2="${pad-16}" y2="${pad+h*s}"/><line x1="${pad-22}" y1="${pad}" x2="${pad-10}" y2="${pad}"/><line x1="${pad-22}" y1="${pad+h*s}" x2="${pad-10}" y2="${pad+h*s}"/><text x="${pad-21}" y="${pad+h*s/2}" text-anchor="middle" transform="rotate(-90 ${pad-21} ${pad+h*s/2})">${ctx.num(h,{minimumFractionDigits:1})} m</text></g>`;
 const north=`<g class="pl-north" transform="translate(${W-22} ${H-24})"><circle r="11"/><path d="M0 -9 L5 6 L0 3 L-5 6 Z"/><text y="-15" text-anchor="middle">${ctx.t(C.north).slice(0,1)}</text></g>`;
 return `<svg class="pl-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${ctx.t(C.plan)}: ${ctx.t(p.name)}">${r}${dim}${north}</svg>`;
}

function facts(ctx,p,cls='cf-facts'){
 return `<dl class="${cls}"><div><dt>${ctx.t(C.place)}</dt><dd>${ctx.t(p.place)}</dd></div><div><dt>${ctx.t(C.year)}</dt><dd>${p.year}</dd></div><div><dt>${ctx.t(C.area)}</dt><dd>${fmtArea(ctx,p.area)}</dd></div><div><dt>${ctx.t(C.status)}</dt><dd>${ctx.t(STATUS[p.status])}</dd></div></dl>`;
}

function caseStudy(ctx,p,i){
 const total=p.plan.rooms.reduce((a,r)=>a+r[2]*r[3],0);
 const schedule=p.plan.rooms.map(r=>`<tr><td>${ctx.t(r[4])}${r[5]?` <small>(${ctx.t(C.openArea)})</small>`:''}</td><td>${ctx.num(r[2]*r[3])}</td></tr>`).join('');
 const prev=projects[(i+projects.length-1)%projects.length],next=projects[(i+1)%projects.length];
 return `<article class="cf-case" id="case-${p.id}" data-case="${p.id}" hidden aria-labelledby="case-${p.id}-h">`+
  `<header class="cf-case-head"><p class="cf-no"><span>${p.no}</span><span>${ctx.t(TYPES[p.type])}</span></p><h2 id="case-${p.id}-h">${ctx.t(p.name)}</h2>${facts(ctx,p,'cf-facts cf-facts-row')}<p class="cf-case-lead">${ctx.t(p.lead)}</p></header>`+
  `<figure class="cf-case-hero">${ctx.img('casa/'+p.photos[0],ctx.raw(C.photoOf,{name:ctx.raw(p.name),n:1}),{sizes:'(min-width: 900px) 70vw, 100vw'})}</figure>`+
  `<div class="cf-case-text"><section><h3>${ctx.t(C.caseBrief)}</h3><p>${ctx.t(p.brief)}</p></section><section><h3>${ctx.t(C.caseDecision)}</h3><p>${ctx.t(p.decision)}</p></section><section><h3>${ctx.t(C.months)}</h3><p>${p.months?ctx.t(C.monthsN,{n:p.months}):ctx.t(C.dash)}</p></section></div>`+
  `<div class="cf-case-plan"><figure>${planSvg(ctx,p)}<figcaption>${ctx.t(C.planNote)}</figcaption></figure><table class="cf-schedule"><thead><tr><th scope="col">${ctx.t(C.room)}</th><th scope="col">m²</th></tr></thead><tbody>${schedule}</tbody><tfoot><tr><th scope="row">${ctx.t(C.total)}</th><td>${ctx.num(total)}</td></tr></tfoot></table></div>`+
  `<div class="cf-case-photos">${p.photos.slice(1).map((k,n)=>`<figure>${ctx.img('casa/'+k,ctx.raw(C.photoOf,{name:ctx.raw(p.name),n:n+2}),{sizes:'(min-width: 900px) 40vw, 100vw'})}</figure>`).join('')}`+
  `<div class="cf-case-mats"><h3>${ctx.t(C.matUsed)}</h3><ul>${p.materials.map(k=>{const m=materials.find(x=>x.key===k);return `<li>${ctx.img('casa/'+k,'',{sizes:'64px',cls:'cf-swatch'})}<span>${ctx.t(m.name)}</span></li>`}).join('')}</ul></div></div>`+
  `<nav class="cf-case-nav" aria-label="${ctx.t(C.archiveH)}"><button type="button" data-open="${prev.id}"><small>${ctx.t(C.prev)}</small>${ctx.t(prev.name)}</button><button type="button" data-open="${next.id}"><small>${ctx.t(C.next)}</small>${ctx.t(next.name)}</button></nav>`+
 `</article>`;
}

export default {
 id:'casa',brand:'Casa Forma',kind:'site',
 render(ctx){
  const t=ctx.t;
  const nav=C.nav.map(([h,l])=>`<a href="${h}">${t(l)}</a>`).join('');
  const slides=projects.map((p,i)=>`<div class="cf-slide" data-slide="${i}"${i?' hidden':''}>`+
   `<figure class="cf-hero-img">${ctx.img('casa/'+p.photos[0],ctx.raw(p.name),{eager:i===0,sizes:'(min-width: 900px) 58vw, 100vw'})}</figure>`+
   `<div class="cf-hero-text"><p class="cf-no"><span>${p.no}</span><span>${t(TYPES[p.type])}</span></p><h1 class="cf-hero-h">${t(p.name)}</h1>${facts(ctx,p)}<p class="cf-hero-lead">${t(p.lead)}</p><button type="button" class="cf-btn" data-open="${p.id}">${t(C.open)}</button></div></div>`).join('');
  const typeBtns=[['all',C.all],...Object.entries(TYPES)].map(([k,l],i)=>`<button type="button" data-type="${k}" aria-pressed="${i===0}">${t(l)}</button>`).join('');
  const stageBtns=[['all',C.all],...Object.entries(STATUS)].map(([k,l],i)=>`<button type="button" data-status="${k}" aria-pressed="${i===0}">${t(l)}</button>`).join('');
  const rows=projects.map(p=>`<li class="cf-row" data-id="${p.id}" data-type="${p.type}" data-status="${p.status}"><button type="button" data-open="${p.id}"><span class="cf-c-no">${p.no}</span><span class="cf-c-name">${t(p.name)}</span><span class="cf-c-place">${t(p.place)}</span><span class="cf-c-year">${p.year}</span><span class="cf-c-area">${fmtArea(ctx,p.area)}</span><span class="cf-c-status">${t(STATUS[p.status])}</span></button><span class="cf-row-thumb" aria-hidden="true">${ctx.img('casa/'+p.photos[0],'',{sizes:'320px'})}</span></li>`).join('');
  const plates=projects.map((p,i)=>`<li class="cf-plate cf-plate-${i}" data-id="${p.id}" data-type="${p.type}" data-status="${p.status}"><button type="button" data-open="${p.id}">${ctx.img('casa/'+p.photos[0],'',{sizes:'(min-width: 900px) 33vw, 100vw'})}<span class="cf-plate-cap"><b>${t(p.name)}</b><span><i>${p.no}</i><i>${t(p.place)}</i><i>${p.year}</i></span></span></button></li>`).join('');
  const mats=materials.map(m=>`<li class="cf-mat"><figure>${ctx.img('casa/'+m.key,'',{sizes:'(min-width: 900px) 25vw, 50vw'})}</figure><h3>${t(m.name)}</h3><p>${t(m.note)}</p><p class="cf-mat-used">${t(C.usedIn)}: ${m.used.map(id=>`<button type="button" data-open="${id}">${t(projects.find(p=>p.id===id).name)}</button>`).join(', ')}</p></li>`).join('');
  const stg=stages.map(([h,d,p])=>`<li><h3>${t(h)}</h3><p class="cf-dur">${t(d)}</p><p>${t(p)}</p></li>`).join('');
  const opt=(arr)=>arr.map(([v,l])=>`<option value="${v}">${t(l)}</option>`).join('');
  const allKeys=[...new Set([...projects.flatMap(p=>p.photos),...materials.map(m=>m.key)])].map(k=>'casa/'+k);
  return `<header class="cf-top"><a class="cf-mark" href="#top" aria-label="Casa Forma">Casa<span>Forma</span></a><nav aria-label="Casa Forma">${nav}</nav><a class="cf-top-cta" href="#sorgu">${t(C.brief)}</a></header>`+
  `<section class="cf-hero" aria-roledescription="carousel" aria-label="${t(C.featured)}"><div class="cf-slides" aria-live="polite">${slides}</div>`+
   `<div class="cf-switch"><button type="button" class="cf-prev" aria-label="${t(C.prev)}">←</button><span class="cf-count"><b>1</b> / ${projects.length}</span><button type="button" class="cf-next" aria-label="${t(C.next)}">→</button><p class="cf-hero-studio">${t(C.lead)}</p></div></section>`+
  `<section class="cf-archive" id="arxiv" aria-labelledby="arxiv-h"><div class="cf-sec-head"><h2 id="arxiv-h">${t(C.archiveH)}</h2><p>${t(C.archiveP)}</p></div>`+
   `<div class="cf-tools"><div role="group" aria-label="${t(C.typeF)}" class="cf-filter">${typeBtns}</div><div role="group" aria-label="${t(C.stageF)}" class="cf-filter">${stageBtns}</div><div role="group" aria-label="${t(C.view)}" class="cf-view"><button type="button" data-view="list" aria-pressed="true">${t(C.list)}</button><button type="button" data-view="plates" aria-pressed="false">${t(C.plates)}</button></div></div>`+
   `<p class="cf-result" role="status"><span class="cf-n">${t(C.count,{n:projects.length})}</span></p>`+
   `<div class="cf-list-head" aria-hidden="true"><span>${t(C.colNo)}</span><span>${t(C.colName)}</span><span>${t(C.place)}</span><span>${t(C.year)}</span><span>${t(C.area)}</span><span>${t(C.status)}</span></div>`+
   `<ol class="cf-list">${rows}</ol><ul class="cf-plates" hidden>${plates}</ul>`+
   `<div class="cf-empty" hidden><p>${t(C.empty)}</p><button type="button" class="cf-btn cf-reset">${t(C.reset)}</button></div></section>`+
  `<section class="cf-mats" id="materiallar" aria-labelledby="mat-h"><div class="cf-sec-head"><h2 id="mat-h">${t(C.matH)}</h2><p>${t(C.matP)}</p></div><ul class="cf-mat-grid">${mats}</ul></section>`+
  `<section class="cf-proc" id="proses" aria-labelledby="proc-h"><div class="cf-sec-head"><h2 id="proc-h">${t(C.procH)}</h2><p>${t(C.procP)}</p></div><ol class="cf-stages">${stg}</ol></section>`+
  `<section class="cf-studio" id="studiya" aria-labelledby="studio-h"><figure class="cf-studio-img">${ctx.img('casa/spiral','',{sizes:'(min-width: 900px) 40vw, 100vw'})}</figure><div><h2 id="studio-h">${t(C.studioH)}</h2><p class="cf-studio-p">${t(C.studioP)}</p><ul class="cf-principles">${C.principles.map(([h,p])=>`<li><h3>${t(h)}</h3><p>${t(p)}</p></li>`).join('')}</ul><div class="cf-team"><h3>${t(C.teamH)}</h3><ul>${team.map(([n,r])=>`<li><b>${esc(n)}</b><span>${t(r)}</span></li>`).join('')}</ul><h3>${t(C.officeH)}</h3><p>${t(C.office)}</p></div></div></section>`+
  `<section class="cf-enquiry" id="sorgu" aria-labelledby="form-h"><div class="cf-sec-head"><h2 id="form-h">${t(C.formH)}</h2><p>${t(C.formP)}</p></div>`+
   `<form class="cf-form" novalidate><p class="cf-form-error" role="alert" hidden></p>`+
   `<fieldset class="cf-field cf-span"><legend>${t(C.fType)}</legend><div class="cf-chips">${C.fTypes.map(([v,l])=>`<label><input type="radio" name="type" value="${v}"><span>${t(l)}</span></label>`).join('')}</div><p class="cf-err" id="e-type" hidden>${t(C.eType)}</p></fieldset>`+
   `<label class="cf-field"><span>${t(C.fPlace)}</span><input name="place" autocomplete="address-level2" placeholder="${t(C.fPlaceHint)}"></label>`+
   `<label class="cf-field"><span>${t(C.fArea)}</span><input name="area" inputmode="numeric" aria-describedby="e-area"><span class="cf-err" id="e-area" hidden>${t(C.eArea)}</span></label>`+
   `<fieldset class="cf-field"><legend>${t(C.fStage)}</legend><div class="cf-chips">${C.fStages.map(([v,l],i)=>`<label><input type="radio" name="stage" value="${v}"${i===0?' checked':''}><span>${t(l)}</span></label>`).join('')}</div></fieldset>`+
   `<label class="cf-field"><span>${t(C.fBudget)}</span><select name="budget">${opt(C.fBudgets)}</select></label>`+
   `<label class="cf-field"><span>${t(C.fName)}</span><input name="name" autocomplete="name" aria-describedby="e-name"><span class="cf-err" id="e-name" hidden>${t(C.eName)}</span></label>`+
   `<label class="cf-field"><span>${t(C.fPhone)}</span><input name="phone" type="tel" autocomplete="tel" placeholder="+994 50 123 45 67" aria-describedby="e-phone"><span class="cf-err" id="e-phone" hidden>${t(C.ePhone)}</span></label>`+
   `<label class="cf-field cf-span"><span>${t(C.fNote)}</span><textarea name="note" rows="4" placeholder="${t(C.fNoteHint)}"></textarea></label>`+
   `<div class="cf-span cf-form-foot"><button class="cf-btn cf-btn-dark" type="submit">${t(C.fSend)}</button></div></form>`+
   `<div class="cf-ok" hidden tabindex="-1"><h3>${t(C.okH)}</h3><dl class="cf-ok-sum"></dl><p>${t(C.okP)}</p><button type="button" class="cf-btn cf-edit">${t(C.okEdit)}</button></div></section>`+
  `<footer class="cf-foot"><a class="cf-mark" href="#top">Casa<span>Forma</span></a><nav aria-label="Casa Forma">${nav}<a href="#sorgu">${t(C.brief)}</a></nav><p>${t(C.sample)}</p>${credits(ctx,allKeys)}</footer>`+
  `<dialog class="cf-dialog" aria-label="${t(C.archiveH)}"><button type="button" class="cf-close">${t(C.close)} <span aria-hidden="true">×</span></button>${projects.map((p,i)=>caseStudy(ctx,p,i)).join('')}</dialog>`+
  ctx.data({count:C.count,errSummary:C.eSummary,labels:{type:C.fType,place:C.fPlace,area:C.fArea,stage:C.fStage,budget:C.fBudget,name:C.fName,phone:C.fPhone},types:Object.fromEntries(C.fTypes),stages:Object.fromEntries(C.fStages),budgets:Object.fromEntries(C.fBudgets)});
 }
};
