// Cibdə — chat-first mobile classifieds app concept: a working phone prototype inside a short product page.
import {L,assets} from '../kit.js';
import {ITEMS,THREADS,DISTRICT,CATS} from './data.js';
import {esc,fmt,feed,tabbar} from './tpl.js';

const S={
 kicker:L('Mobil tətbiq konsepti','Концепт мобильного приложения','Mobile app concept'),
 h1:L('Yaxınlıqdakı əşyanı bir söhbətlə al.','Купите вещь рядом за одну переписку.','Buy what is nearby in one conversation.'),
 lead:L('Cibdə ikinci əl əşyaları məhəllə miqyasında göstərir və satışı mesajlaşmaya çevirir: hazır suallar, qiymət təklifi və ictimai görüş yeri bir ekranda.','Cibdə показывает вещи с рук в пределах района и превращает покупку в переписку: готовые вопросы, предложение цены и людное место встречи на одном экране.','Cibdə shows second-hand things within your neighbourhood and turns buying into a chat: ready-made questions, a price offer and a public meeting place on one screen.'),
 tourL:L('Prototipi gəzin','Пройдите по прототипу','Walk through the prototype'),
 tour:[
  ['feed',L('Yaxınlıqdakılar','Рядом с вами','Nearby'),L('Lentdə hər əşyanın sizə məsafəsi görünür.','В ленте видно расстояние до каждой вещи.','The feed shows how far each item is.')],
  ['item',L('Əşya','Вещь','Item'),L('Satıcının adətən nə qədər tez cavab verdiyini görün.','Посмотрите, как быстро обычно отвечает продавец.','See how quickly the seller usually replies.')],
  ['chat',L('Söhbət və təklif','Чат и предложение','Chat and offer'),L('Hazır sualla yazın və ya qiymət təklif edin.','Напишите готовым вопросом или предложите цену.','Send a ready-made question or make an offer.')],
  ['search',L('Axtarış','Поиск','Search'),L('Tapılmayanda yeni elan üçün bildiriş qoşun.','Если ничего нет, включите уведомление.','If nothing turns up, switch on an alert.')],
  ['post',L('Elan ver','Подать объявление','Post'),L('Şəkil, ad, qiymət: üç ekran.','Фото, название, цена: три экрана.','Photo, title, price: three screens.')]],
 phoneL:L('Cibdə tətbiqinin işlək prototipi','Рабочий прототип приложения Cibdə','Working prototype of the Cibdə app'),
 notesL:L('Bu ekranda','На этом экране','On this screen'),
 notes:{
  feed:[L('Məsafə qiymətdən sonra ikinci ən vacib rəqəmdir, ona görə hər kartda var.','Расстояние — вторая по важности цифра после цены, поэтому оно на каждой карточке.','Distance is the second most important number after price, so every card shows it.'),L('Kateqoriyalar bir sətirdə, baş barmaqla sürüşdürülür.','Категории в одну строку, листаются большим пальцем.','Categories sit in one thumb-scrollable row.'),L('Reytinq ulduzları yoxdur: yeni satıcı köhnə ilə bərabər başlayır.','Нет звёздных рейтингов: новый продавец начинает на равных.','No star ratings: a new seller starts on equal terms.')],
  item:[L('Cavab vaxtı satıcının real davranışından hesablanır, rəy toplamır.','Время ответа считается по реальному поведению продавца, а не по отзывам.','Reply time comes from the seller’s real behaviour, not from reviews.'),L('Görüş yeri kimi yalnız ictimai yerlər təklif olunur.','В качестве места встречи предлагаются только людные места.','Only public places are suggested for meeting.'),L('Əsas düymə bir dənədir: yazmaq.','Главная кнопка одна: написать.','There is one main button: write.')],
  chat:[L('İlk mesaj bir toxunuşdur; satıcıya ən çox verilən üç sual hazırdır.','Первое сообщение — одно касание: три самых частых вопроса уже готовы.','The first message is one tap; the three most common questions are ready.'),L('Təklif adi mesaj deyil, ayrıca kartdır: qəbul, əks-təklif və ya rədd.','Предложение — не обычное сообщение, а карточка: принять, встречное или отказ.','An offer is a card, not a plain message: accept, counter or decline.'),L('Bu prototipdə satıcı cavabları avtomatikdir və “demo cavab” kimi işarələnir.','В этом прототипе ответы продавца автоматические и помечены «демо-ответ».','In this prototype seller replies are automatic and marked “demo reply”.')],
  chats:[L('Söhbətlər adamla deyil, əşya ilə qruplaşdırılır.','Чаты сгруппированы по вещам, а не по людям.','Chats are grouped by item, not by person.'),L('Oxunmamış mesaj sayı tab-da da görünür.','Число непрочитанных видно и на вкладке.','The unread count also shows on the tab.'),L('Son təklif siyahıda məbləğ kimi görünür.','Последнее предложение видно в списке суммой.','The latest offer shows as an amount in the list.')],
  search:[L('Son axtarışlar bir toxunuşla təkrarlanır.','Недавние поиски повторяются одним касанием.','Recent searches repeat with one tap.'),L('Nəticə yoxdursa, boş ekran bildiriş qoşmağı təklif edir.','Если результатов нет, пустой экран предлагает включить уведомление.','With no results, the empty screen offers an alert.'),L('Axtarış adla yanaşı kateqoriya adına da baxır.','Поиск смотрит и в название, и в категорию.','Search matches titles and category names.')],
  post:[L('Şəkil birinci gəlir, çünki alıcı əvvəlcə onu görür.','Фото идёт первым, потому что покупатель сначала видит его.','The photo comes first because buyers see it first.'),L('Hər addımda bir sual: telefonu bir əllə tutan adam üçün.','На каждом шаге один вопрос: для того, кто держит телефон одной рукой.','One question per step, for someone holding the phone in one hand.'),L('Dərc edilən elan bu demoda yalnız sizin cihazınızda qalır.','В этом демо опубликованное объявление остаётся только на вашем устройстве.','In this demo a published ad stays on your device only.')]},
 howTitle:L('Elan üç ekrandır','Объявление — это три экрана','An ad is three screens'),
 how:[[L('Şəkil','Фото','Photo'),L('Kamera açılır; şəkil kvadrat kəsilir ki, lentdə hamısı eyni görünsün.','Открывается камера; фото обрезается в квадрат, чтобы лента была ровной.','The camera opens; photos are cropped square so the feed stays even.')],[L('Ad və kateqoriya','Название и категория','Title and category'),L('Ad 60 simvola qədər; kateqoriya düymələrlə seçilir.','Название до 60 символов, категория выбирается кнопками.','Up to 60 characters; the category is picked with buttons.')],[L('Qiymət','Цена','Price'),L('Qiymət və “razılaşmaq olar” işarəsi. Dərc etmək bir toxunuşdur.','Цена и отметка «возможен торг». Публикация — одно касание.','A price and an “open to offers” tick. Publishing is one tap.')]],
 princTitle:L('Niyə söhbət birinci','Почему переписка на первом месте','Why chat comes first'),
 princ:[[L('Satış danışıqdır','Продажа — это разговор','Selling is a conversation'),L('Kiçik əşyalarda alıcı adətən eyni üç sualı verir. Onları hazır etmək ilk mesajı asanlaşdırır.','По мелким вещам покупатель обычно задаёт одни и те же три вопроса. Готовые варианты упрощают первое сообщение.','For small things buyers usually ask the same three questions. Having them ready makes the first message easy.')],[L('Təklif aydın olmalıdır','Предложение должно быть явным','An offer should be explicit'),L('Qiymət təklifi mətndə itmir: ayrıca kartdır və vəziyyəti görünür.','Предложение цены не теряется в тексте: это отдельная карточка со статусом.','A price offer does not get lost in text: it is a separate card with a status.')],[L('Görüş ictimai yerdə','Встреча в людном месте','Meet in public'),L('Tətbiq görüş üçün metro çıxışları və ticarət mərkəzləri təklif edir, ev ünvanı istəmir.','Приложение предлагает выходы метро и торговые центры и не просит домашний адрес.','The app suggests metro exits and malls for meeting and never asks for a home address.')]],
 footNote:L('Cibdə uydurma tətbiqdir; əşyalar, adlar və mesajlar nümunədir. Tətbiq mağazalarında yoxdur.','Cibdə — вымышленное приложение; вещи, имена и сообщения — примеры. В магазинах приложений его нет.','Cibdə is a fictional app; items, names and messages are samples. It is not in any app store.'),
 // in-app strings
 locName:L('Nəsimi, Bakı','Насими, Баку','Nasimi, Baku'),locRadius:L('5 km radiusda','в радиусе 5 км','within 5 km'),catsL:L('Kateqoriyalar','Категории','Categories'),allCats:L('Hamısı','Все','All'),nearby:L('Yaxınlıqda','Рядом','Nearby'),
 agoMin:L('{n} dəq','{n} мин','{n} min'),agoH:L('{n} saat','{n} ч','{n} h'),agoD:L('{n} gün','{n} дн.','{n} d'),
 favA:L('“{t}” yadda saxla','Сохранить «{t}»','Save “{t}”'),unfavA:L('“{t}” yadda saxlanılanlardan çıxar','Убрать «{t}» из сохранённых','Unsave “{t}”'),yours:L('Sizin','Ваше','Yours'),
 searchL:L('Axtarış','Поиск','Search'),searchPh:L('Nə axtarırsınız?','Что ищете?','What are you looking for?'),recent:L('Son axtarışlar','Недавние поиски','Recent searches'),recentList:[L('gitara','гитара','guitar'),L('kaktus','кактус','cactus'),L('kedlər','кеды','trainers'),L('velosiped','велосипед','bicycle')],
 found:L('{n} nəticə','Результатов: {n}','{n} results'),noneFor:L('“{q}” üçün hələ heç nə yoxdur','По запросу «{q}» пока ничего','Nothing for “{q}” yet'),noneBody:L('5 km radiusda belə elan yoxdur. Kimsə yerləşdirəndə xəbər verək?','В радиусе 5 км таких объявлений нет. Сообщить, когда появится?','No such ads within 5 km. Shall we tell you when one appears?'),alertBtn:L('Bildiriş qoş','Включить уведомление','Turn on alert'),alertOn:L('Bildiriş qoşuldu (demo)','Уведомление включено (демо)','Alert on (demo)'),
 back:L('Geri','Назад','Back'),since:L('Cibdə-də {y}-dən','На Cibdə с {y}','On Cibdə since {y}'),replies:L('adətən {n} dəq-yə cavab verir','обычно отвечает за {n} мин','usually replies in {n} min'),
 meetHint:L('Görüş üçün təklif: 28 May metrosu, 2-ci çıxış','Место встречи: метро 28 Мая, выход 2','Suggested meeting point: 28 May metro, exit 2'),write:L('Satıcıya yaz','Написать продавцу','Message seller'),yourItem:L('Bu sizin elanınızdır.','Это ваше объявление.','This is your ad.'),
 chats:L('Söhbətlər','Чаты','Chats'),noChats:L('Hələ söhbət yoxdur','Чатов пока нет','No chats yet'),unread:L('oxunmamış','непрочитано','unread'),
 offer:L('Təklif','Предложение','Offer'),offerLine:L('Təklif: {p}','Предложение: {p}','Offer: {p}'),offerWaiting:L('Cavab gözlənilir','Ждёт ответа','Waiting for reply'),offerAccepted:L('Qəbul edildi','Принято','Accepted'),offerCountered:L('Əks-təklif gəldi','Встречное предложение','Countered'),
 publicPlace:L('İctimai yer','Людное место','Public place'),demoReply:L('demo cavab','демо-ответ','demo reply'),typing:L('{n} yazır…','{n} печатает…','{n} is typing…'),
 quickL:L('Hazır cavablar','Быстрые ответы','Quick replies'),quick:[L('Hələ satılır?','Ещё продаётся?','Still available?'),L('Son qiymət?','Последняя цена?','Best price?'),L('Harada görüşək?','Где встретимся?','Where shall we meet?')],
 makeOffer:L('Qiymət təklif et','Предложить цену','Make an offer'),message:L('Mesaj','Сообщение','Message'),send:L('Göndər','Отправить','Send'),
 askPrice:L('Satıcının qiyməti: {p}','Цена продавца: {p}','Seller’s price: {p}'),yourOffer:L('Sizin təklifiniz, AZN','Ваше предложение, AZN','Your offer, AZN'),cancel:L('Ləğv et','Отмена','Cancel'),sendOffer:L('Təklifi göndər','Отправить предложение','Send offer'),
 offerErr:L('1 AZN ilə satıcının qiyməti arasında məbləğ yazın.','Введите сумму от 1 AZN до цены продавца.','Enter an amount between 1 AZN and the seller’s price.'),
 rYes:L('Bəli, satılır. Bu gün 19:00-dan sonra görüşə bilərəm.','Да, продаётся. Сегодня после 19:00 могу встретиться.','Yes, it is. I can meet today after 7 pm.'),rPrice:L('{p}-dən aşağı düşə bilmərəm, amma bu gün götürsəniz razıyam.','Ниже {p} не могу, но если заберёте сегодня — договоримся.','I cannot go below {p}, but if you collect today we have a deal.'),rPlace:L('28 May metrosu, 2-ci çıxış','Метро 28 Мая, выход 2','28 May metro, exit 2'),
 rAccept:L('Razıyam, {p}. Harada görüşək?','Согласен(на), {p}. Где встретимся?','Deal at {p}. Where shall we meet?'),rCounter:L('{p} olsa, razıyam.','За {p} согласен(на).','I would take {p}.'),rText:L('Mesajınızı gördüm, tezliklə cavab verəcəyəm.','Увидел(а) ваше сообщение, скоро отвечу.','Saw your message, will reply shortly.'),
 now:L('indi','сейчас','now'),
 newAd:L('Yeni elan','Новое объявление','New ad'),stepOf:L('Addım {n} / 3','Шаг {n} из 3','Step {n} of 3'),p1:L('Əşyanın şəklini çəkin','Сфотографируйте вещь','Take a photo of the item'),takePhoto:L('Şəkil çək və ya seç','Сделать или выбрать фото','Take or choose a photo'),photoNote:L('Kvadrat kəsilir, cihazda qalır','Обрезается в квадрат, остаётся на устройстве','Cropped square, stays on your device'),removePhoto:L('Şəkli dəyiş','Заменить фото','Change photo'),skipPhoto:L('Şəkilsiz davam et','Продолжить без фото','Continue without a photo'),photoErr:L('Bu fayl şəkil deyil.','Этот файл не изображение.','This file is not an image.'),
 p2:L('Bu nədir?','Что это?','What is it?'),titleL:L('Ad','Название','Title'),catL:L('Kateqoriya','Категория','Category'),p3:L('Neçəyə satırsınız?','За сколько продаёте?','How much are you asking?'),priceL:L('Qiymət, AZN','Цена, AZN','Price, AZN'),negL:L('Razılaşmaq olar','Возможен торг','Open to offers'),p3hint:L('Yaxınlıqda oxşar əşyalar 8–180 AZN arasındadır.','Похожие вещи рядом стоят от 8 до 180 AZN.','Similar items nearby go for 8–180 AZN.'),
 next:L('Davam et','Далее','Continue'),publish:L('Dərc et','Опубликовать','Publish'),
 eTitle:L('Ad 3–60 simvol olmalıdır.','Название должно быть от 3 до 60 символов.','The title needs 3–60 characters.'),eCat:L('Kateqoriya seçin.','Выберите категорию.','Choose a category.'),ePrice:L('1 ilə 10 000 AZN arasında qiymət yazın.','Укажите цену от 1 до 10 000 AZN.','Enter a price between 1 and 10,000 AZN.'),
 published:L('Elan dərc olundu, lentin başındadır (yalnız bu cihazda).','Объявление опубликовано и стоит первым в ленте (только на этом устройстве).','Ad published and pinned to the top of your feed (this device only).'),
 tFeed:L('Lent','Лента','Feed'),tSearch:L('Axtar','Поиск','Search'),tPost:L('Elan ver','Подать','Post'),tChats:L('Söhbət','Чаты','Chats'),appNav:L('Tətbiq menyusu','Меню приложения','App menu'),
 saved:L('Yadda saxlanıldı','Сохранено','Saved'),unsaved:L('Silindi','Удалено','Removed')
};

export default {id:'lal',brand:'Cibdə',kind:'app',render(ctx){
 const t=x=>ctx.t(x),r=x=>ctx.resolve(x);
 const img={};
 for(const it of ITEMS)if(assets['lal/'+it.photo])img[it.photo]=ctx.img('lal/'+it.photo,ctx.raw(it.title),{sizes:'(max-width:700px) 50vw, 180px'});
 const items=ITEMS.map(i=>({...i,title:r(i.title),desc:r(i.desc)}));
 const threads=THREADS.map(th=>({...th,msgs:th.msgs.map(([from,tx,at])=>({from,t:r(tx),at:r(at)}))}));
 const D={lang:ctx.lang,S:r(S),items,threads,district:r(DISTRICT),cats:r(CATS),img};
 D.F=fmt(ctx.lang);
 const st={items,cat:'',fav:new Set(),threads};
 const mark=`<svg class="cb-mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M8 10h24v14a12 12 0 0 1-24 0Z"/><path d="M8 16h24"/></svg>`;
 const html=`<div class="cb-site">
<header class="cb-top"><div class="cb-wrap cb-top-in"><span class="cb-logo">${mark}<b>Cibdə</b></span><span class="cb-kicker">${t(S.kicker)}</span></div></header>
<section class="cb-stage" aria-labelledby="cb-h1"><div class="cb-wrap cb-stage-in">
<div class="cb-intro"><h1 id="cb-h1">${t(S.h1)}</h1><p>${t(S.lead)}</p>
<h2 class="cb-tour-h">${t(S.tourL)}</h2><ol class="cb-tour">${S.tour.map(([k,h,p],i)=>`<li><button type="button" data-goto="${k}" aria-pressed="${i===0}"><b>${t(h)}</b><span>${t(p)}</span></button></li>`).join('')}</ol></div>
<div class="cb-phone-wrap"><div class="cb-phone" role="region" aria-label="${t(S.phoneL)}"><div class="cb-status" aria-hidden="true"><span>9:41</span><i></i></div>
<div class="cb-app" data-app><div class="cb-screen" data-screen="feed">${feed(D,st)}</div><div class="cb-sheet-host" data-host></div></div>
<nav class="cb-tabs" aria-label="${t(S.appNav)}" data-tabs>${tabbar('feed',D,st)}</nav><div class="cb-toast" role="status" aria-live="polite" data-toast></div></div></div>
<aside class="cb-notes" aria-labelledby="cb-notes-h"><h2 id="cb-notes-h">${t(S.notesL)}</h2><ul data-notes>${S.notes.feed.map(n=>`<li>${t(n)}</li>`).join('')}</ul></aside>
</div></section>
<section class="cb-how" aria-labelledby="cb-how-h"><div class="cb-wrap"><h2 id="cb-how-h">${t(S.howTitle)}</h2><ol>${S.how.map(([h,p])=>`<li><b>${t(h)}</b><p>${t(p)}</p></li>`).join('')}</ol></div></section>
<section class="cb-princ" aria-labelledby="cb-pr-h"><div class="cb-wrap"><h2 id="cb-pr-h">${t(S.princTitle)}</h2><div class="cb-princ-grid">${S.princ.map(([h,p])=>`<article><h3>${t(h)}</h3><p>${t(p)}</p></article>`).join('')}</div></div></section>
<footer class="cb-foot"><div class="cb-wrap"><p><b>Cibdə</b> ${t(S.footNote)}</p>${ctx.credits(Object.keys(assets).filter(k=>k.startsWith('lal/')))}</div></footer>
</div>`;
 const {F:_,...pub}=D;
 return html+ctx.data(pub);
}};
