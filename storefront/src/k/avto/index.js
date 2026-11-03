// Yolda — dense peer-to-peer car classifieds concept. Static render per language + runtime data for app.js.
import {L,assets} from '../kit.js';
import {ADS,TODAY,CITY,FUEL,GEAR,BODY,COLOUR,MARKET} from './data.js';
import {esc,fill,fmt,row,ico,SORTS} from './tpl.js';

const S={
 brandLine:L('Avtomobil elanları, satıcıdan birbaşa','Автообъявления напрямую от продавцов','Car ads, straight from the seller'),
 searchLabel:L('Marka və ya model','Марка или модель','Make or model'),searchPh:L('Məsələn, Prius','Например, Prius','For example, Prius'),searchBtn:L('Axtar','Найти','Search'),
 favourites:L('Seçilmişlər','Избранное','Favourites'),searches:L('Axtarışlarım','Мои поиски','Saved searches'),topNav:L('Bölmələr','Разделы','Sections'),
 filters:L('Filtrlər','Фильтры','Filters'),filtersN:L('Filtrlər ({n})','Фильтры ({n})','Filters ({n})'),closeFilters:L('Bağla','Закрыть','Close'),
 make:L('Marka','Марка','Make'),model:L('Model','Модель','Model'),allMakes:L('Bütün markalar','Все марки','All makes'),allModels:L('Bütün modellər','Все модели','All models'),pickMake:L('Əvvəlcə marka','Сначала марка','Pick a make'),
 city:L('Şəhər','Город','City'),price:L('Qiymət, AZN','Цена, AZN','Price, AZN'),min:L('min.','от','min'),max:L('maks.','до','max'),priceMin:L('Ən aşağı qiymət','Минимальная цена','Minimum price'),priceMax:L('Ən yüksək qiymət','Максимальная цена','Maximum price'),
 year:L('Buraxılış ili','Год выпуска','Year'),yearMin:L('İl, ən azı','Год от','Year from'),yearMax:L('İl, ən çox','Год до','Year to'),anyYear:L('—','—','—'),
 kmMax:L('Yürüş, ən çox (km)','Пробег до (км)','Mileage up to (km)'),fuel:L('Yanacaq','Топливо','Fuel'),gearbox:L('Sürətlər qutusu','Коробка передач','Gearbox'),body:L('Ban növü','Тип кузова','Body type'),
 seller:L('Satıcı','Продавец','Seller'),anySeller:L('Hamısı','Все','All'),sellerPrivate:L('Şəxsi satıcı','Частное лицо','Private seller'),sellerDealer:L('Avtosalon','Автосалон','Dealer'),
 extras:L('Şərtlər','Условия','Options'),flag_credit:L('Kredit','Кредит','Credit'),flag_barter:L('Barter','Обмен','Swap'),flag_vin:L('VIN kodu var','Есть VIN','VIN given'),flag_photo:L('Yalnız şəkilli','Только с фото','With photos only'),
 resetAll:L('Filtrləri sıfırla','Сбросить фильтры','Clear filters'),showN:L('{n} elanı göstər','Показать объявления: {n}','Show {n} ads'),
 h1:L('Avtomobil elanları','Автообъявления','Car ads'),countN:L('{n} elan','Объявлений: {n}','{n} ads'),countOf:L('{n} elan, cəmi {total}','{n} из {total}','{n} of {total} ads'),
 sort:L('Sıralama','Сортировка','Sort'),sortNew:L('Əvvəlcə yeni','Сначала новые','Newest first'),sortCheap:L('Əvvəlcə ucuz','Сначала дешёвые','Cheapest first'),sortDear:L('Əvvəlcə bahalı','Сначала дорогие','Most expensive first'),sortKm:L('Yürüşü az','С малым пробегом','Lowest mileage'),sortYear:L('İli yeni','Год новее','Newest year'),
 view:L('Görünüş','Вид','View'),viewList:L('Siyahı','Список','List'),viewTable:L('Cədvəl','Таблица','Table'),
 saveSearch:L('Axtarışı yadda saxla','Сохранить поиск','Save search'),savedSearchToast:L('Axtarış yadda saxlanıldı: {name}','Поиск сохранён: {name}','Search saved: {name}'),searchExists:L('Bu axtarış artıq yadda saxlanılıb.','Этот поиск уже сохранён.','This search is already saved.'),
 allCars:L('Bütün avtomobillər','Все автомобили','All cars'),
 removeChip:L('Filtri götür: {f}','Убрать фильтр: {f}','Remove filter: {f}'),
 emptyTitle:L('Bu filtrlərlə elan tapılmadı','По этим фильтрам объявлений нет','No ads match these filters'),
 emptyBody:L('Bir filtri götürün. Düymədə həmin filtr olmadan neçə elan görünəcəyi yazılıb.','Уберите один фильтр. На кнопке указано, сколько объявлений появится без него.','Remove one filter. Each button shows how many ads you would see without it.'),
 widen:L('“{f}” olmadan: {n}','Без «{f}»: {n}','Without “{f}”: {n}'),
 today:L('Bu gün, {t}','Сегодня, {t}','Today, {t}'),yesterday:L('Dünən, {t}','Вчера, {t}','Yesterday, {t}'),
 km:L('km','км','km'),kmUnknown:L('yürüş məlum deyil','пробег неизвестен','mileage unknown'),noPhoto:L('Şəkil yoxdur','Нет фото','No photo'),noPhotoBig:L('Satıcı şəkil əlavə etməyib','Продавец не добавил фото','The seller has not added photos'),
 favA:L('{car} seçilmişlərə əlavə et','Добавить {car} в избранное','Add {car} to favourites'),unfavA:L('{car} seçilmişlərdən çıxar','Убрать {car} из избранного','Remove {car} from favourites'),
 favOn:L('Seçilmişlərə əlavə edildi','Добавлено в избранное','Added to favourites'),favOff:L('Seçilmişlərdən çıxarıldı','Удалено из избранного','Removed from favourites'),
 colCar:L('Avtomobil','Автомобиль','Car'),colMake:L('Marka','Марка','Make'),colModel:L('Model','Модель','Model'),colYear:L('İl','Год','Year'),colEngine:L('Mühərrik, L','Объём, л','Engine, L'),colKm:L('Yürüş','Пробег','Mileage'),colGear:L('Qutu','КПП','Gearbox'),colCity:L('Şəhər','Город','City'),colDate:L('Tarix','Дата','Posted'),colPrice:L('Qiymət','Цена','Price'),
 crumbs:L('Naviqasiya','Навигация','Breadcrumbs'),allAds:L('Bütün elanlar','Все объявления','All ads'),specs:L('Xüsusiyyətlər','Характеристики','Details'),colour:L('Rəng','Цвет','Colour'),hp:L('{n} a.g.','{n} л.с.','{n} hp'),
 owners:L('Sahiblərin sayı','Число владельцев','Owners'),unknown:L('məlum deyil','неизвестно','unknown'),painted:L('Rənglənmiş hissələr','Крашеные детали','Repainted panels'),paintedN:L('{n} hissə','{n} дет.','{n} panels'),none:L('yoxdur','нет','none'),
 crashed:L('Vuruğu var','Битый','Accident damage'),yes:L('bəli','да','yes'),no:L('xeyr','нет','no'),market:L('Hansı bazar üçün yığılıb','Для какого рынка','Built for market'),
 sellerSays:L('Satıcının qeydi','Описание продавца','Seller’s description'),adNo:L('Elan № {n}','Объявление № {n}','Ad no. {n}'),updated:L('Yeniləndi: {d}','Обновлено: {d}','Updated: {d}'),viewsN:L('Baxış: {n}','Просмотров: {n}','Views: {n}'),
 since:L('Yolda-da {y}-ci ildən','На Yolda с {y} года','On Yolda since {y}'),showPhone:L('Nömrəni göstər','Показать номер','Show number'),
 phoneNote:L('Nümunə nömrədir, +994 00 kodu mövcud deyil.','Это пример: кода +994 00 не существует.','A sample number: the +994 00 code does not exist.'),
 addFav:L('Seçilmişlərə əlavə et','В избранное','Add to favourites'),inFav:L('Seçilmişlərdədir','В избранном','In favourites'),
 safeTitle:L('Alışdan əvvəl','Перед покупкой','Before you buy'),
 safe:[L('Avtomobili görmədən beh və ya ilkin ödəniş köçürməyin.','Не переводите задаток, пока не увидели автомобиль.','Do not transfer a deposit before you have seen the car.'),L('Texniki pasportu və VIN kodunu yerində tutuşdurun.','Сверьте техпаспорт и VIN на месте.','Check the registration papers against the VIN on the car.'),L('Baxışı gündüz, ictimai yerdə və ya servisdə keçirin.','Осматривайте днём, в людном месте или на СТО.','View in daylight, in a public place or at a garage.')],
 report:L('Elandan şikayət et','Пожаловаться на объявление','Report this ad'),reportTitle:L('Elandan şikayət','Жалоба на объявление','Report an ad'),reportLead:L('Moderator elanı yoxlayacaq. Bu demoda şikayət yalnız brauzerdə qeyd olunur.','Модератор проверит объявление. В этом демо жалоба сохраняется только в браузере.','A moderator will review the ad. In this demo the report is only recorded in your browser.'),
 reason:L('Səbəb','Причина','Reason'),reasons:[L('Avtomobil artıq satılıb','Автомобиль уже продан','The car is already sold'),L('Qiymət və ya məlumat yanlışdır','Неверная цена или данные','Wrong price or details'),L('Şəkillər başqa avtomobilə aiddir','Фото другого автомобиля','Photos show a different car'),L('Fırıldaqçılıq şübhəsi','Подозрение на мошенничество','Suspected fraud'),L('Digər','Другое','Other')],
 comment:L('Şərh','Комментарий','Comment'),commentHelp:L('“Digər” seçilibsə, nə baş verdiyini yazın (ən azı 10 simvol).','Если выбрано «Другое», опишите, что не так (минимум 10 символов).','If you chose “Other”, describe what is wrong (at least 10 characters).'),
 errReason:L('Səbəb seçin.','Выберите причину.','Choose a reason.'),errComment:L('Ən azı 10 simvolla izah edin.','Опишите хотя бы в 10 символах.','Explain in at least 10 characters.'),
 sendReport:L('Şikayəti göndər','Отправить жалобу','Send report'),cancel:L('Ləğv et','Отмена','Cancel'),
 reportDone:L('Şikayət qeyd olundu (elan № {n}). Demo: heç nə göndərilmədi.','Жалоба записана (объявление № {n}). Демо: ничего не отправлено.','Report recorded (ad no. {n}). Demo: nothing was sent.'),
 similar:L('Oxşar elanlar','Похожие объявления','Similar ads'),
 favTitle:L('Seçilmiş elanlar','Избранные объявления','Favourite ads'),favEmpty:L('Seçilmiş elan yoxdur','Избранных объявлений нет','No favourites yet'),favEmptyBody:L('Elanın yanındakı ulduza basın, o burada qalacaq. Siyahı yalnız bu brauzerdə saxlanılır.','Нажмите звёздочку у объявления, и оно останется здесь. Список хранится только в этом браузере.','Tap the star next to an ad to keep it here. The list is stored in this browser only.'),
 ssTitle:L('Yadda saxlanılan axtarışlar','Сохранённые поиски','Saved searches'),ssEmpty:L('Yadda saxlanılan axtarış yoxdur','Сохранённых поисков нет','No saved searches'),ssEmptyBody:L('Filtrləri seçin və “Axtarışı yadda saxla” düyməsinə basın. Yenidən açanda nəticələr yenilənəcək.','Выберите фильтры и нажмите «Сохранить поиск». При открытии результаты обновятся.','Set your filters and press “Save search”. Results refresh each time you open it.'),
 ssNow:L('İndi {n} elan','Сейчас объявлений: {n}','{n} ads now'),ssApply:L('Aç','Открыть','Open'),ssDelete:L('Sil','Удалить','Delete'),ssDeleteA:L('“{name}” axtarışını sil','Удалить поиск «{name}»','Delete search “{name}”'),
 ssAll:L('Bütün elanlar','Все объявления','All ads'),backToList:L('Elanlara qayıt','К объявлениям','Back to ads'),
 popular:L('Populyar markalar','Популярные марки','Popular makes'),
 footNote:L('Yolda uydurma platformadır: elanlar, adlar və nömrələr nümunədir. Seçilmişlər, axtarışlar və şikayətlər yalnız bu brauzerdə qalır.','Yolda — вымышленная площадка: объявления, имена и номера — примеры. Избранное, поиски и жалобы остаются только в этом браузере.','Yolda is a fictional platform: ads, names and numbers are samples. Favourites, searches and reports stay in this browser only.'),
 priceErr:L('Ən aşağı qiymət ən yüksəkdən böyükdür; yerlərini dəyişin.','Минимальная цена больше максимальной, поменяйте местами.','The minimum price is above the maximum; swap them.'),
 fromV:L('{v}-dən','от {v}','from {v}'),toV:L('{v}-dək','до {v}','up to {v}')
};

export default {id:'avto',brand:'Yolda',kind:'site',render(ctx){
 const t=x=>ctx.t(x),r=x=>ctx.resolve(x);
 const img={},big={};
 for(const a of ADS)if(a.photo&&assets['avto/'+a.photo]){
  const alt=`${a.make} ${a.model}, ${a.year}`;
  img[a.photo]=ctx.img('avto/'+a.photo,alt,{sizes:'(max-width:600px) 34vw, 168px'});
  big[a.photo]=ctx.img('avto/'+a.photo,alt,{sizes:'(max-width:900px) 100vw, 720px'});
 }
 const ads=ADS.map(a=>({...a,desc:r(a.desc)}));
 const D={lang:ctx.lang,today:TODAY,S:r(S),ads,city:r(CITY),fuel:r(FUEL),gear:r(GEAR),body:r(BODY),colour:r(COLOUR),market:r(MARKET),img,big};
 D.F=fmt(ctx.lang);
 const Sx=D.S,F=D.F,st={fav:new Set()};
 const count=(k,v)=>ADS.filter(a=>a[k]===v).length;
 const makes=[...new Set(ADS.map(a=>a.make))].sort();
 const checks=(name,obj)=>Object.keys(obj).filter(k=>count(name,k)).map(k=>`<label class="yo-ck"><input type="checkbox" name="${name}" value="${k}"><span>${esc(obj[k])}</span><em data-c="${name}:${k}">${count(name,k)}</em></label>`).join('');
 const years=[...new Set(ADS.map(a=>a.year))].sort((a,b)=>a-b);
 const pop=Object.entries(ADS.reduce((m,a)=>(m[a.make]=(m[a.make]||0)+1,m),{})).sort((a,b)=>b[1]-a[1]).slice(0,8);
 const list=[...ADS].sort(SORTS.new);
 const logo=`<svg class="yo-mark" viewBox="0 0 64 10" aria-hidden="true"><path d="M0 5h12M18 5h12M36 5h12M54 5h10"/></svg>`;
 const html=`<div class="yo-site">
<header class="yo-top"><div class="yo-wrap yo-top-in">
<a class="yo-logo" href="#elanlar"><b>yolda</b>${logo}<span class="sr-only">${t(S.brandLine)}</span></a>
<form class="yo-q" id="yo-q" role="search"><label class="sr-only" for="yo-q-in">${t(S.searchLabel)}</label><input id="yo-q-in" name="q" type="search" placeholder="${t(S.searchPh)}" autocomplete="off"><button type="submit" class="yo-btn yo-btn-main">${t(S.searchBtn)}</button></form>
<nav class="yo-topnav" aria-label="${t(S.topNav)}"><a href="#secilmisler">${ico.star}<span>${t(S.favourites)}</span><b data-n="fav">0</b></a><a href="#axtarislar"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></svg><span>${t(S.searches)}</span><b data-n="ss">0</b></a></nav>
</div>
<div class="yo-wrap yo-pop"><span>${t(S.popular)}</span><ul>${pop.map(([m,n])=>`<li><button type="button" data-pop="${esc(m)}">${esc(m)} <em>${n}</em></button></li>`).join('')}</ul></div>
</header>
<div class="yo-wrap yo-body" data-list-view>
<aside class="yo-side" id="yo-side" aria-labelledby="yo-f-h">
<div class="yo-side-head"><h2 id="yo-f-h">${t(S.filters)}</h2><button type="button" class="yo-side-close" data-close-filters>${t(S.closeFilters)}</button></div>
<form id="yo-f" class="yo-f" novalidate>
<div class="yo-fg yo-fg-2"><label><span>${t(S.make)}</span><select name="make"><option value="">${t(S.allMakes)}</option>${makes.map(m=>`<option>${esc(m)}</option>`).join('')}</select></label>
<label><span>${t(S.model)}</span><select name="model" disabled><option value="">${t(S.pickMake)}</option></select></label></div>
<fieldset class="yo-fg"><legend>${t(S.price)}</legend><div class="yo-range"><input name="pmin" type="number" inputmode="numeric" min="0" step="100" placeholder="${t(S.min)}" aria-label="${t(S.priceMin)}"><span aria-hidden="true">–</span><input name="pmax" type="number" inputmode="numeric" min="0" step="100" placeholder="${t(S.max)}" aria-label="${t(S.priceMax)}"></div><p class="yo-ferr" data-err="price" hidden></p></fieldset>
<fieldset class="yo-fg"><legend>${t(S.year)}</legend><div class="yo-range"><select name="ymin" aria-label="${t(S.yearMin)}"><option value="">${t(S.min)}</option>${years.map(y=>`<option>${y}</option>`).join('')}</select><span aria-hidden="true">–</span><select name="ymax" aria-label="${t(S.yearMax)}"><option value="">${t(S.max)}</option>${years.map(y=>`<option>${y}</option>`).join('')}</select></div></fieldset>
<div class="yo-fg"><label><span>${t(S.kmMax)}</span><input name="kmax" type="number" inputmode="numeric" min="0" step="5000"></label></div>
<fieldset class="yo-fg"><legend>${t(S.city)}</legend>${checks('city',D.city)}</fieldset>
<fieldset class="yo-fg"><legend>${t(S.fuel)}</legend>${checks('fuel',D.fuel)}</fieldset>
<fieldset class="yo-fg"><legend>${t(S.gearbox)}</legend>${checks('gear',D.gear)}</fieldset>
<fieldset class="yo-fg"><legend>${t(S.body)}</legend>${checks('body',D.body)}</fieldset>
<fieldset class="yo-fg"><legend>${t(S.seller)}</legend><div class="yo-seg">${[['',S.anySeller],['private',S.sellerPrivate],['dealer',S.sellerDealer]].map(([v,l],i)=>`<label><input type="radio" name="seller" value="${v}"${i?'':' checked'}><span>${t(l)}</span></label>`).join('')}</div></fieldset>
<fieldset class="yo-fg"><legend>${t(S.extras)}</legend>${['credit','barter','vin','photo'].map(k=>`<label class="yo-ck"><input type="checkbox" name="${k}"><span>${t(S['flag_'+k])}</span><em data-c="${k}">${k==='photo'?ADS.filter(a=>a.photo).length:ADS.filter(a=>a[k]).length}</em></label>`).join('')}</fieldset>
<div class="yo-f-foot"><button type="button" class="yo-btn yo-btn-main yo-show" data-close-filters>${ctx.raw(S.showN,{n:ADS.length})}</button><button type="reset" class="yo-link">${t(S.resetAll)}</button></div>
</form></aside>
<section class="yo-main" aria-labelledby="yo-h1">
<div class="yo-res-head"><h1 id="yo-h1">${t(S.h1)}</h1><p class="yo-count" data-count aria-live="polite">${ctx.raw(S.countN,{n:ADS.length})}</p>
<div class="yo-tools"><button type="button" class="yo-btn yo-btn-line yo-open-f" data-open-filters aria-controls="yo-side" aria-expanded="false">${ctx.raw(S.filters)}</button>
<label class="yo-sort"><span>${t(S.sort)}</span><select name="sort" data-sort>${[['new',S.sortNew],['cheap',S.sortCheap],['dear',S.sortDear],['km',S.sortKm],['year',S.sortYear]].map(([v,l])=>`<option value="${v}">${t(l)}</option>`).join('')}</select></label>
<fieldset class="yo-viewsw"><legend class="sr-only">${t(S.view)}</legend><label><input type="radio" name="view" value="list" checked><span>${t(S.viewList)}</span></label><label><input type="radio" name="view" value="table"><span>${t(S.viewTable)}</span></label></fieldset>
<button type="button" class="yo-btn yo-btn-line" data-save-search>${t(S.saveSearch)}</button></div></div>
<ul class="yo-chips" data-chips aria-label="${t(S.filters)}"></ul>
<div data-results><ul class="yo-list">${list.map(a=>row(a,D,st)).join('')}</ul></div>
<div class="yo-empty" data-empty hidden><h2>${t(S.emptyTitle)}</h2><p>${t(S.emptyBody)}</p><ul data-widen></ul></div>
</section></div>
<div class="yo-wrap yo-view" data-view hidden></div>
<dialog class="yo-dlg" id="yo-report" aria-labelledby="yo-r-h"><form method="dialog" novalidate data-report-form><h2 id="yo-r-h">${t(S.reportTitle)}</h2><p>${t(S.reportLead)}</p>
<fieldset><legend>${t(S.reason)}</legend>${S.reasons.map((x,i)=>`<label class="yo-ck"><input type="radio" name="reason" value="${i}"><span>${t(x)}</span></label>`).join('')}<p class="yo-ferr" data-err="reason" hidden></p></fieldset>
<label class="yo-ta"><span>${t(S.comment)}</span><textarea name="comment" rows="3" aria-describedby="yo-c-help"></textarea><small id="yo-c-help">${t(S.commentHelp)}</small><p class="yo-ferr" data-err="comment" hidden></p></label>
<div class="yo-dlg-foot"><button type="button" class="yo-link" data-dlg-cancel>${t(S.cancel)}</button><button type="submit" class="yo-btn yo-btn-danger">${t(S.sendReport)}</button></div></form></dialog>
<div class="yo-toast" role="status" aria-live="polite" data-toast></div>
<footer class="yo-foot"><div class="yo-wrap"><p><b>yolda</b> ${t(S.footNote)}</p>${ctx.credits(Object.keys(assets).filter(k=>k.startsWith('avto/')))}</div></footer>
</div>`;
 const {F:_,...pub}=D;
 return html+ctx.data(pub);
}};
