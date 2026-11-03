// Bazarlıq — general second-hand marketplace concept with a posting studio. Static render + runtime data.
import {L,assets} from '../kit.js';
import {ADS,CATS,CITY,COND,TODAY} from './data.js';
import {esc,card,ico,SORTS} from './tpl.js';
import {fmt} from './tpl.js';

const S={
 tagline:L('Qonşudan qonşuya bazar','Рынок от соседа к соседу','A market from neighbour to neighbour'),
 searchL:L('Nə axtarırsınız?','Что ищете?','What are you looking for?'),searchPh:L('Məsələn, velosiped','Например, велосипед','For example, bicycle'),allCats:L('Bütün kateqoriyalar','Все категории','All categories'),find:L('Tap','Найти','Find'),
 favourites:L('Seçilmişlər','Избранное','Favourites'),myAds:L('Mənim elanlarım','Мои объявления','My ads'),post:L('Elan ver','Подать объявление','Post an ad'),nav:L('Hesab','Аккаунт','Account'),
 h1:L('Evdə artıq olanı sat, lazım olanı yaxında tap.','Продайте лишнее, найдите нужное рядом.','Sell what you no longer need, find what you do nearby.'),
 lead:L('Elektronika, ev əşyaları, uşaq və hobbi üçün işlənmiş və yeni əşyalar. Elan vermək pulsuzdur və dörd addım çəkir.','Б/у и новые вещи: электроника, дом, детское и хобби. Подать объявление бесплатно, это четыре шага.','Used and new things for electronics, home, kids and hobbies. Posting is free and takes four steps.'),
 todayN:L('Bu gün {n} yeni elan','Сегодня новых объявлений: {n}','{n} new ads today'),freeN:L('{n} əşya pulsuz verilir','{n} вещей отдают бесплатно','{n} things given away free'),
 catsL:L('Kateqoriyalar','Категории','Categories'),all:L('Hamısı','Все','All'),adsN:L('{n} elan','{n} объявл.','{n} ads'),
 browseAll:L('Bütün elanlar','Все объявления','All ads'),allSubs:L('Hamısı','Все','All'),
 cond:L('Vəziyyət','Состояние','Condition'),anyCond:L('İstənilən','Любое','Any'),city:L('Şəhər','Город','City'),anyCity:L('Bütün şəhərlər','Все города','All cities'),
 pmax:L('Qiymət, ən çox','Цена до','Price up to'),freeOnly:L('Pulsuz və barter','Бесплатно и обмен','Free and swap'),sort:L('Sıralama','Сортировка','Sort'),sortNew:L('Yeni əvvəl','Сначала новые','Newest'),sortCheap:L('Ucuz əvvəl','Сначала дешёвые','Cheapest'),sortDear:L('Bahalı əvvəl','Сначала дорогие','Most expensive'),
 countN:L('{n} elan','Объявлений: {n}','{n} ads'),
 emptyT:L('Heç nə tapılmadı','Ничего не найдено','Nothing found'),emptyB:L('Axtarış sözünü qısaldın və ya kateqoriyanı “Hamısı” edin. Bəlkə də bunu elə siz satırsınız?','Сократите запрос или выберите «Все» категории. Может быть, это продаёте вы?','Shorten the search or switch the category to “All”. Or maybe you are the one selling it?'),emptyReset:L('Filtrləri təmizlə','Сбросить фильтры','Clear filters'),
 priceTbd:L('Qiymət yazılmayıb','Цена не указана','No price yet'),free:L('Pulsuz','Бесплатно','Free'),swap:L('Barter','Обмен','Swap'),negShort:L('razılaşma','торг','offers'),negotiable:L('Qiymətdə razılaşmaq olar','Возможен торг','Open to offers'),noPhoto:L('Şəkil yoxdur','Нет фото','No photo'),
 today:L('Bu gün, {t}','Сегодня, {t}','Today, {t}'),yesterday:L('Dünən, {t}','Вчера, {t}','Yesterday, {t}'),
 favA:L('“{t}” seçilmişlərə əlavə et','Добавить «{t}» в избранное','Save “{t}”'),unfavA:L('“{t}” seçilmişlərdən çıxar','Убрать «{t}» из избранного','Remove “{t}” from favourites'),save:L('Seçilmişlərə əlavə et','В избранное','Save'),saved:L('Seçilmişlərdədir','В избранном','Saved'),
 favOn:L('Seçilmişlərə əlavə edildi','Добавлено в избранное','Saved to favourites'),favOff:L('Seçilmişlərdən çıxarıldı','Убрано из избранного','Removed from favourites'),
 yourAd:L('Sizin elan','Ваше объявление','Your ad'),yourAdNote:L('Bu elan yalnız sizin brauzerinizdə saxlanılır; başqaları onu görmür.','Это объявление хранится только в вашем браузере, другие его не видят.','This ad is stored only in your browser; nobody else can see it.'),deleteAd:L('Elanı sil','Удалить объявление','Delete ad'),deleted:L('Elan silindi','Объявление удалено','Ad deleted'),
 category:L('Kateqoriya','Категория','Category'),condition:L('Vəziyyət','Состояние','Condition'),postedL:L('Yerləşdirilib','Размещено','Posted'),
 writeSeller:L('Satıcıya yazın','Написать продавцу','Message the seller'),quick:[L('Hələ satılır?','Ещё продаётся?','Is it still available?'),L('Son qiymət nə qədərdir?','Какая последняя цена?','What is your best price?'),L('Bu gün baxmaq olar?','Можно посмотреть сегодня?','Can I see it today?')],send:L('Göndər','Отправить','Send'),
 errMsg:L('Mesaj ən azı 5 simvol olmalıdır.','Сообщение должно быть не короче 5 символов.','The message needs at least 5 characters.'),msgOk:L('Mesaj qeyd olundu. Demo: satıcıya heç nə göndərilmədi.','Сообщение записано. Демо: продавцу ничего не отправлено.','Message recorded. Demo: nothing was sent to the seller.'),
 back:L('Elanlara qayıt','К объявлениям','Back to ads'),similar:L('Bu kateqoriyada başqa','Ещё в этой категории','More in this category'),
 favTitle:L('Seçilmişlər','Избранное','Favourites'),favEmpty:L('Hələ heç nə seçməmisiniz','Вы пока ничего не сохранили','Nothing saved yet'),favEmptyB:L('Elan şəklindəki ürəyə basın, o burada qalacaq.','Нажмите на сердечко на фото объявления, и оно появится здесь.','Tap the heart on an ad photo to keep it here.'),
 mineTitle:L('Mənim elanlarım','Мои объявления','My ads'),mineEmpty:L('Hələ elanınız yoxdur','У вас пока нет объявлений','You have no ads yet'),mineEmptyB:L('Evdə işlətmədiyiniz bir əşyanı dörd addımda elan edin.','Разместите ненужную вещь за четыре шага.','List something you no longer use in four steps.'),
 howTitle:L('Elan necə verilir','Как подать объявление','How posting works'),
 how:[[L('Kateqoriya','Категория','Category'),L('Əşyanın aid olduğu bölməni seçin; uyğun sahələr özü açılır.','Выберите раздел, подходящие поля откроются сами.','Pick the section; the right fields open by themselves.')],[L('Təsvir','Описание','Details'),L('Başlıq, vəziyyət və bir neçə cümlə. Şəkil əlavə etmək olar.','Заголовок, состояние и пара предложений. Можно добавить фото.','A title, the condition and a few sentences. Add a photo if you like.')],[L('Qiymət','Цена','Price'),L('Qiymət yazın, pulsuz verin və ya barter təklif edin.','Укажите цену, отдайте бесплатно или предложите обмен.','Set a price, give it away or offer a swap.')],[L('Baxış və dərc','Просмотр и публикация','Preview and publish'),L('Elanı alıcının görəcəyi kimi yoxlayın və dərc edin.','Проверьте объявление глазами покупателя и опубликуйте.','Check the ad as a buyer will see it, then publish.')]],
 postTitle:L('Elan ver','Подать объявление','Post an ad'),stepsL:L('Addımlar','Шаги','Steps'),stepOf:L('Addım {n} / 4','Шаг {n} из 4','Step {n} of 4'),
 s1:L('Kateqoriya','Категория','Category'),s2:L('Təsvir','Описание','Details'),s3:L('Qiymət və əlaqə','Цена и контакт','Price and contact'),s4:L('Baxış','Просмотр','Preview'),
 pickCat:L('Əşya hansı bölməyə aiddir?','К какому разделу относится вещь?','Which section does it belong to?'),sub:L('Alt kateqoriya','Подкатегория','Sub-category'),chooseSub:L('Seçin','Выберите','Choose'),
 titleL:L('Başlıq','Заголовок','Title'),titleH:L('Nə olduğunu və əsas xüsusiyyəti yazın, 5–70 simvol.','Что это и главная особенность, 5–70 символов.','What it is and its key feature, 5–70 characters.'),
 descL:L('Təsvir','Описание','Description'),descH:L('Vəziyyəti, dəsti və necə təhvil verəcəyinizi yazın, ən azı 20 simvol.','Опишите состояние, комплект и как передадите, минимум 20 символов.','Describe the condition, what is included and how you will hand it over, at least 20 characters.'),
 condL:L('Vəziyyəti','Состояние','Condition'),photoL:L('Şəkil','Фото','Photo'),photoH:L('İstəyə bağlı. Şəkil kiçildilir və yalnız bu brauzerdə saxlanılır.','Необязательно. Фото уменьшается и хранится только в этом браузере.','Optional. The photo is resized and kept in this browser only.'),photoRemove:L('Şəkli sil','Удалить фото','Remove photo'),photoErr:L('Bu fayl şəkil deyil. JPG, PNG və ya WebP seçin.','Это не изображение. Выберите JPG, PNG или WebP.','This file is not an image. Choose a JPG, PNG or WebP.'),
 modeL:L('Necə verirsiniz?','Как отдаёте?','How are you offering it?'),modePrice:L('Qiymətlə satıram','Продаю за цену','For a price'),modeFree:L('Pulsuz verirəm','Отдаю бесплатно','Free'),modeSwap:L('Barter edirəm','Меняю','Swap'),
 priceL:L('Qiymət, AZN','Цена, AZN','Price, AZN'),negL:L('Qiymətdə razılaşmaq olar','Возможен торг','Open to offers'),nameL:L('Adınız','Ваше имя','Your name'),phoneL:L('Telefon','Телефон','Phone'),phoneH:L('Alıcılar zəng edəndə görəcək. Demo: heç yerə göndərilmir.','Покупатели увидят его при звонке. Демо: никуда не отправляется.','Buyers will see it when they call. Demo: it goes nowhere.'),
 prev:L('Geri','Назад','Back'),next:L('Davam et','Далее','Continue'),publish:L('Dərc et','Опубликовать','Publish'),
 live:L('Alıcı belə görəcək','Так увидит покупатель','What buyers will see'),liveNote:L('Kart siz yazdıqca yenilənir.','Карточка обновляется по мере ввода.','The card updates as you type.'),
 draftTitle:L('Elanın başlığı','Заголовок объявления','Your ad title'),
 errSum:L('Davam etmək üçün düzəldin:','Чтобы продолжить, исправьте:','To continue, fix:'),
 eCat:L('Kateqoriya seçin.','Выберите категорию.','Choose a category.'),eSub:L('Alt kateqoriya seçin.','Выберите подкатегорию.','Choose a sub-category.'),eTitle:L('Başlıq 5–70 simvol olmalıdır.','Заголовок должен быть от 5 до 70 символов.','The title must be 5–70 characters.'),eDesc:L('Təsvir ən azı 20 simvol olmalıdır.','Описание должно быть не короче 20 символов.','The description needs at least 20 characters.'),eCond:L('Vəziyyəti seçin.','Выберите состояние.','Choose the condition.'),eField:L('“{f}” sahəsini doldurun.','Заполните поле «{f}».','Fill in “{f}”.'),
 ePrice:L('1 ilə 100 000 AZN arasında qiymət yazın.','Укажите цену от 1 до 100 000 AZN.','Enter a price between 1 and 100,000 AZN.'),eCity:L('Şəhəri seçin.','Выберите город.','Choose a city.'),eName:L('Adınızı yazın.','Укажите имя.','Enter your name.'),ePhone:L('Nömrəni +994 və 9 rəqəmlə yazın.','Введите номер с +994 и 9 цифрами.','Enter the number with +994 and 9 digits.'),
 chars:L('{n}/{max}','{n}/{max}','{n}/{max}'),
 pvLead:L('Hər şey düzgündürsə, dərc edin. Dəyişmək üçün addımlara qayıdın.','Если всё верно, публикуйте. Чтобы изменить, вернитесь к шагам.','If everything is right, publish. Go back to any step to change it.'),
 pubTitle:L('Elan dərc olundu','Объявление опубликовано','Ad published'),pubBody:L('“{t}” indi elanların başındadır və “Mənim elanlarım” bölməsindədir. Demo: elan yalnız bu brauzerdə görünür.','«{t}» теперь в начале списка и в разделе «Мои объявления». Демо: объявление видно только в этом браузере.','“{t}” is now at the top of the ads and in “My ads”. Demo: it is visible in this browser only.'),pubView:L('Elana bax','Открыть объявление','View the ad'),pubAnother:L('Daha bir elan ver','Подать ещё одно','Post another'),
 footNote:L('Bazarlıq uydurma platformadır; elanlar, adlar və qiymətlər nümunədir. Seçilmişlər və sizin elanlarınız yalnız bu brauzerdə saxlanılır.','Bazarlıq — вымышленная площадка; объявления, имена и цены — примеры. Избранное и ваши объявления хранятся только в этом браузере.','Bazarlıq is a fictional platform; ads, names and prices are samples. Favourites and your ads are stored in this browser only.')
};

export default {id:'bazar',brand:'Bazarlıq',kind:'site',render(ctx){
 const t=x=>ctx.t(x),r=x=>ctx.resolve(x),raw=(x,v)=>ctx.raw(x,v);
 const img={};
 for(const a of ADS)if(assets['bazar/'+a.photo])img[a.photo]=ctx.img('bazar/'+a.photo,ctx.raw(a.title),{sizes:'(max-width:600px) 50vw, (max-width:1100px) 33vw, 300px'});
 const ads=ADS.map(a=>({...a,title:r(a.title),desc:r(a.desc)}));
 const D={lang:ctx.lang,today:TODAY,S:r(S),ads,cats:r(CATS),city:r(CITY),cond:r(COND),img};
 D.F=fmt(ctx.lang);
 const st={fav:new Set()},Sx=D.S;
 const n=c=>ADS.filter(a=>!c||a.cat===c).length;
 const todayN=ADS.filter(a=>a.posted.startsWith(TODAY)).length,freeN=ADS.filter(a=>a.mode!=='price').length;
 const catTiles=[{id:'',icon:'all',name:Sx.all},...D.cats].map(c=>`<li><button type="button" class="bz-cat bz-cat-${c.icon}" data-cat="${c.id}" aria-pressed="${c.id===''}"><span class="bz-cat-ico">${ico[c.icon]}</span><b>${esc(c.name)}</b><em>${raw(S.adsN,{n:n(c.id)})}</em></button></li>`).join('');
 const opt=(v,l)=>`<option value="${v}">${esc(l)}</option>`;
 const logo=`<span class="bz-logo-tag" aria-hidden="true"></span>`;
 const html=`<div class="bz-site">
<header class="bz-top"><div class="bz-wrap bz-top-in">
<a class="bz-logo" href="#elanlar">${logo}<b>Bazarlıq</b><span class="sr-only">${t(S.tagline)}</span></a>
<form class="bz-search" id="bz-search" role="search"><label class="sr-only" for="bz-q">${t(S.searchL)}</label><input id="bz-q" name="q" type="search" placeholder="${t(S.searchPh)}" autocomplete="off"><label class="sr-only" for="bz-qc">${t(S.category)}</label><select id="bz-qc" name="cat">${opt('',Sx.allCats)}${D.cats.map(c=>opt(c.id,c.name)).join('')}</select><button class="bz-btn bz-btn-ink" type="submit">${t(S.find)}</button></form>
<nav class="bz-nav" aria-label="${t(S.nav)}"><a href="#secilmisler">${ico.heart}<span>${t(S.favourites)}</span><b data-n="fav">0</b></a><a href="#menim"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5zM9 9h6M9 13h6"/></svg><span>${t(S.myAds)}</span><b data-n="mine">0</b></a><a class="bz-btn bz-btn-main bz-post-btn" href="#elan-ver">${t(S.post)}</a></nav>
</div></header>
<div data-home>
<section class="bz-intro"><div class="bz-wrap bz-intro-in"><div><h1>${t(S.h1)}</h1><p>${t(S.lead)}</p></div><ul class="bz-facts"><li>${raw(S.todayN,{n:todayN})}</li><li>${raw(S.freeN,{n:freeN})}</li></ul></div>
<div class="bz-wrap"><h2 class="sr-only">${t(S.catsL)}</h2><ul class="bz-cats">${catTiles}</ul></div></section>
<section class="bz-browse" id="elanlar" aria-labelledby="bz-br-h"><div class="bz-wrap">
<div class="bz-br-head"><h2 id="bz-br-h" data-br-title>${t(S.browseAll)}</h2><p class="bz-count" data-count aria-live="polite">${raw(S.countN,{n:ADS.length})}</p></div>
<ul class="bz-subs" data-subs hidden></ul>
<form class="bz-filters" id="bz-filters">
<label><span>${t(S.cond)}</span><select name="cond">${opt('',Sx.anyCond)}${Object.keys(COND).map(k=>opt(k,D.cond[k])).join('')}</select></label>
<label><span>${t(S.city)}</span><select name="city">${opt('',Sx.anyCity)}${Object.keys(CITY).map(k=>opt(k,D.city[k])).join('')}</select></label>
<label><span>${t(S.pmax)}</span><select name="pmax">${opt('',Sx.anyCond)}${[50,100,200,500].map(p=>opt(p,D.F.azn(p))).join('')}</select></label>
<label class="bz-switch"><input type="checkbox" name="free"><span>${t(S.freeOnly)}</span></label>
<label class="bz-sortl"><span>${t(S.sort)}</span><select name="sort">${opt('new',Sx.sortNew)}${opt('cheap',Sx.sortCheap)}${opt('dear',Sx.sortDear)}</select></label>
</form>
<div class="bz-grid" data-grid>${[...ads].sort(SORTS.new).map(a=>card(a,D,st)).join('')}</div>
<div class="bz-empty" data-empty hidden><h3>${t(S.emptyT)}</h3><p>${t(S.emptyB)}</p><div><button type="button" class="bz-btn bz-btn-line" data-clear>${t(S.emptyReset)}</button><a class="bz-btn bz-btn-main" href="#elan-ver">${t(S.post)}</a></div></div>
</div></section>
<section class="bz-how" aria-labelledby="bz-how-h"><div class="bz-wrap"><h2 id="bz-how-h">${t(S.howTitle)}</h2><ol>${S.how.map(([h,p])=>`<li><b>${t(h)}</b><p>${t(p)}</p></li>`).join('')}</ol><a class="bz-btn bz-btn-main" href="#elan-ver">${t(S.post)}</a></div></section>
</div>
<div class="bz-wrap bz-view" data-view hidden></div>
<section class="bz-wrap bz-post" data-post hidden aria-labelledby="bz-post-h">
<a class="bz-back" href="#elanlar">${ico.back}${t(S.back)}</a>
<h1 id="bz-post-h" tabindex="-1">${t(S.postTitle)}</h1>
<ol class="bz-steps" aria-label="${t(S.stepsL)}">${[S.s1,S.s2,S.s3,S.s4].map((s,i)=>`<li data-stepdot="${i+1}"><span>${i+1}</span>${t(s)}</li>`).join('')}</ol>
<div class="bz-post-grid" data-post-grid>
<form id="bz-pf" class="bz-pf" novalidate>
<div class="bz-err-sum" data-errsum role="alert" tabindex="-1" hidden></div>
<fieldset data-step="1"><legend>${t(S.pickCat)}</legend><div class="bz-pcats">${D.cats.map(c=>`<label class="bz-pcat"><input type="radio" name="cat" value="${c.id}"><span>${ico[c.icon]}<b>${esc(c.name)}</b></span></label>`).join('')}</div>
<label class="bz-f"><span>${t(S.sub)}</span><select name="sub" disabled><option value="">${t(S.chooseSub)}</option></select><small class="bz-err" data-e="sub"></small></label></fieldset>
<fieldset data-step="2" hidden><legend class="sr-only">${t(S.s2)}</legend>
<label class="bz-f"><span>${t(S.titleL)} <em data-cnt="title">0/70</em></span><input name="title" maxlength="70" aria-describedby="h-title e-title"><small id="h-title">${t(S.titleH)}</small><small class="bz-err" id="e-title" data-e="title"></small></label>
<label class="bz-f"><span>${t(S.descL)} <em data-cnt="desc">0/1000</em></span><textarea name="desc" rows="5" maxlength="1000" aria-describedby="h-desc e-desc"></textarea><small id="h-desc">${t(S.descH)}</small><small class="bz-err" id="e-desc" data-e="desc"></small></label>
<fieldset class="bz-f bz-radios"><legend>${t(S.condL)}</legend>${Object.keys(COND).map(k=>`<label><input type="radio" name="cond" value="${k}"><span>${esc(D.cond[k])}</span></label>`).join('')}<small class="bz-err" data-e="cond"></small></fieldset>
<div data-catfield></div>
<div class="bz-f bz-photo"><span>${t(S.photoL)}</span><label class="bz-drop"><input type="file" name="photo" accept="image/*"><span>${ico.cam}<b>${t(S.photoL)}</b></span></label><button type="button" class="bz-link" data-photo-rm hidden>${t(S.photoRemove)}</button><small>${t(S.photoH)}</small><small class="bz-err" data-e="photo"></small></div>
</fieldset>
<fieldset data-step="3" hidden><legend class="sr-only">${t(S.s3)}</legend>
<fieldset class="bz-f bz-radios"><legend>${t(S.modeL)}</legend>${[['price',S.modePrice],['free',S.modeFree],['swap',S.modeSwap]].map(([v,l],i)=>`<label><input type="radio" name="mode" value="${v}"${i?'':' checked'}><span>${t(l)}</span></label>`).join('')}</fieldset>
<div class="bz-f" data-pricebox><label for="bz-price">${t(S.priceL)}</label><input id="bz-price" name="price" type="number" inputmode="numeric" min="1" max="100000" aria-describedby="e-price"><small class="bz-err" id="e-price" data-e="price"></small><label class="bz-check"><input type="checkbox" name="neg"><span>${t(S.negL)}</span></label></div>
<label class="bz-f"><span>${t(S.city)}</span><select name="city"><option value="">${t(S.anyCity)}</option>${Object.keys(CITY).map(k=>opt(k,D.city[k])).join('')}</select><small class="bz-err" data-e="city"></small></label>
<div class="bz-f2"><label class="bz-f"><span>${t(S.nameL)}</span><input name="name" autocomplete="given-name"><small class="bz-err" data-e="name"></small></label>
<label class="bz-f"><span>${t(S.phoneL)}</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+994 50 123 45 67" aria-describedby="h-phone"><small id="h-phone">${t(S.phoneH)}</small><small class="bz-err" data-e="phone"></small></label></div>
</fieldset>
<div data-step="4" hidden><p class="bz-pv-lead">${t(S.pvLead)}</p><div data-pv></div></div>
<div class="bz-pf-nav"><button type="button" class="bz-btn bz-btn-line" data-prev hidden>${t(S.prev)}</button><span data-stepof>${raw(S.stepOf,{n:1})}</span><button type="submit" class="bz-btn bz-btn-ink" data-next>${t(S.next)}</button></div>
</form>
<aside class="bz-live" aria-labelledby="bz-live-h"><h2 id="bz-live-h">${t(S.live)}</h2><div data-live></div><p>${t(S.liveNote)}</p></aside>
</div>
<div class="bz-published" data-published hidden tabindex="-1"><span class="bz-pub-ico">${ico.check}</span><h2>${t(S.pubTitle)}</h2><p data-pub-body></p><div><a class="bz-btn bz-btn-ink" data-pub-view href="#elanlar">${t(S.pubView)}</a><button type="button" class="bz-btn bz-btn-line" data-pub-again>${t(S.pubAnother)}</button></div></div>
</section>
<div class="bz-toast" role="status" aria-live="polite" data-toast></div>
<footer class="bz-foot"><div class="bz-wrap"><p><b>Bazarlıq</b> ${t(S.footNote)}</p>${ctx.credits(Object.keys(assets).filter(k=>k.startsWith('bazar/')))}</div></footer>
</div>`;
 const {F:_,...pub}=D;
 return html+ctx.data(pub);
}};
