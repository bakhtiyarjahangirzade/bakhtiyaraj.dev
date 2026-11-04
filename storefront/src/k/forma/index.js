// Forma Store — a Baku homeware shop. The collection grid is the hero; detail, cart and checkout are dialogs driven by app.js.
import {L,esc} from '../kit.js';
import {CATS,MATS,CARE,PRODUCTS,ZONES} from './data.js';

const T={
 nav:[['#collection',L('Kolleksiya','Коллекция','Collection')],['#materials',L('Materiallar','Материалы','Materials')],['#delivery',L('Çatdırılma','Доставка','Delivery')]],
 search:L('Əşya axtar','Поиск по каталогу','Search objects'),
 cart:L('Səbət','Корзина','Cart'),
 strip:L('Bakı daxilində 120 AZN-dən yuxarı sifarişlərə çatdırılma pulsuzdur. Showroom-dan eyni gün götürə bilərsiniz.','Доставка по Баку бесплатна для заказов от 120 AZN. Из шоурума можно забрать в тот же день.','Free delivery in Baku on orders over 120 AZN. Same-day pickup from the showroom.'),
 h1w:[['stoneware',L('Gil','Глина','Clay')],['linen',L('kətan','лён','linen')],['walnut',L('qoz','орех','walnut')],['brass',L('latun','латунь','brass')]],
 h1hint:L('Materiala görə göstər: {m}','Показать по материалу: {m}','Show by material: {m}'),
 intro:L('Forma Store evdə hər gün əl altında olan əşyaları satır: vaza, kasa, süfrə, şamdan. Hamısı kiçik partiyalarla hazırlanır, buna görə hər məhsulun yanında anbarda neçə ədəd qaldığı yazılıb.','Forma Store продаёт вещи, которые каждый день под рукой: вазы, чаши, скатерти, подсвечники. Всё делается небольшими партиями, поэтому у каждого товара указано, сколько штук осталось на складе.','Forma Store sells the things you reach for every day: vases, bowls, tablecloths, candle holders. Everything is made in small batches, so each object shows how many are left in stock.'),
 season:L('Payız 2026 assortimenti','Ассортимент осени 2026','Autumn 2026 range'),
 all:L('Hamısı','Все','All'),
 filters:L('Kolleksiyanı süz','Фильтры коллекции','Filter the collection'),
 category:L('Kateqoriya','Категория','Category'),
 material:L('Material','Материал','Material'),
 anyMat:L('İstənilən material','Любой материал','Any material'),
 price:L('Qiymət','Цена','Price'),
 anyPrice:L('İstənilən qiymət','Любая цена','Any price'),
 p1:L('25 AZN-ə qədər','до 25 AZN','Up to 25 AZN'),
 p2:L('25–50 AZN','25–50 AZN','25–50 AZN'),
 p3:L('50 AZN-dən yuxarı','от 50 AZN','Over 50 AZN'),
 inStock:L('Yalnız anbarda olanlar','Только в наличии','In stock only'),
 sort:L('Sıralama','Сортировка','Sort'),
 sFeat:L('Seçdiklərimiz','Наш выбор','Our pick'),
 sNew:L('Yeni gələnlər','Новинки','Newest'),
 sAsc:L('Əvvəlcə ucuz','Сначала дешевле','Price: low to high'),
 sDesc:L('Əvvəlcə bahalı','Сначала дороже','Price: high to low'),
 reset:L('Filtrləri sıfırla','Сбросить фильтры','Reset filters'),
 count:L('{n} əşya','{n} товаров','{n} objects'),
 emptyH:L('Bu seçimə uyğun əşya yoxdur','Под этот выбор ничего не подходит','Nothing matches this selection'),
 emptyP:L('Materialı və ya qiyməti dəyişin, ya da "Yalnız anbarda olanlar" seçimini söndürün.','Измените материал или цену либо отключите «Только в наличии».','Change the material or price, or turn off “In stock only”.'),
 from:L('{p}-dən','от {p}','from {p}'),
 low:L('Son {n} ədəd','Осталось {n} шт.','Last {n} left'),
 out:L('Bitib','Нет в наличии','Sold out'),
 colours:L('{n} rəng','{n} цвета','{n} colours'),
 noteH:L('Rəng ekranda necə görünür?','Как цвет выглядит на экране?','How true is the colour on screen?'),
 noteP:L('Fotolar eyni ağ balansı və işıqla işlənib ki, rənglər bir-birinə yaxın görünsün. Şir, parça və ağacın təbii fərqləri qalır; şübhə varsa, showroom-da əşyanı canlı görün.','Фотографии обработаны с одинаковым балансом белого и светом, чтобы цвета выглядели сопоставимо. Естественные различия глазури, ткани и дерева остаются; если сомневаетесь, посмотрите вещь вживую в шоуруме.','Photos are processed with the same white balance and light so colours compare fairly. Natural differences in glaze, fabric and wood remain; if in doubt, see the piece in the showroom.'),
 noteA:L('Materiallar haqqında','О материалах','About the materials'),
 matH:L('Materiallar və qulluq','Материалы и уход','Materials and care'),
 matP:L('Hər materialın öz qaydası var. Məhsul səhifəsində də eyni məlumat göstərilir.','У каждого материала свои правила. Те же сведения есть на странице товара.','Every material has its own rules. The same notes appear on each product page.'),
 matOrigin:{
  stoneware:L('1240 °C-də bişirilir, su keçirmir. Şirlər qurğuşunsuzdur.','Обжиг при 1240 °C, не пропускает воду. Глазури без свинца.','Fired at 1240 °C and watertight. Lead-free glazes.'),
  porcelain:L('Nazik, işığı keçirən çini; gündəlik istifadə üçün qalınlaşdırılmış kənar.','Тонкий, просвечивающий фарфор; утолщённый край для ежедневного использования.','Thin, translucent porcelain with a reinforced rim for daily use.'),
  linen:L('Əvvəlcədən yuyulmuş kətan, 210 q/m². Rəngləmə OEKO-TEX sertifikatlı boyalarla.','Предварительно стиранный лён, 210 г/м². Окрашен красителями с сертификатом OEKO-TEX.','Pre-washed linen, 210 g/m², coloured with OEKO-TEX certified dyes.'),
  walnut:L('Qurudulmuş qoz, yalnız qida üçün təhlükəsiz yağla işlənir.','Высушенный орех, обработан только пищевым маслом.','Kiln-dried walnut finished only with food-safe oil.'),
  glass:L('Üfürmə şüşə; hər parçada kiçik hava qabarcıqları ola bilər.','Выдувное стекло; в каждом изделии возможны мелкие пузырьки.','Blown glass; small air bubbles are part of each piece.'),
  mulberry:L('Şəki tutu, yavaş qurudulur; sıx və ağır ağacdır.','Шекинская шелковица, медленная сушка; плотная и тяжёлая древесина.','Slow-dried Shaki mulberry, a dense and heavy wood.'),
  brass:L('Tökmə latun, lak çəkilmir — vaxtla patina yaranır.','Литая латунь без лака — со временем появляется патина.','Cast, unlacquered brass that develops a patina.')
 },
 delH:L('Çatdırılma və qaytarma','Доставка и возврат','Delivery and returns'),
 zone:L('Bölgə','Регион','Area'),
 fee:L('Çatdırılma','Доставка','Delivery'),
 freeFrom:L('Pulsuz','Бесплатно','Free from'),
 time:L('Müddət','Срок','Time'),
 freeAt:L('{p}-dən','от {p}','over {p}'),
 always:L('Həmişə','Всегда','Always'),
 retH:L('Qaytarma','Возврат','Returns'),
 retP:L('İstifadə olunmamış əşyanı 14 gün ərzində qaytara bilərsiniz. Bakıda kuryer pulsuz gəlir; regionlardan qaytarma çatdırılma xərci alıcıya düşür. Sınmış gəlibsə, qutunu açdığınız gün şəkil göndərin — yenisini göndəririk.','Неиспользованную вещь можно вернуть в течение 14 дней. В Баку курьер приезжает бесплатно; при возврате из регионов доставку оплачивает покупатель. Если вещь пришла разбитой, пришлите фото в день распаковки — мы отправим новую.','Unused objects can be returned within 14 days. In Baku the courier collects for free; returns from the regions are at the buyer’s cost. If something arrives broken, send a photo on the day you open the box and we send a replacement.'),
 payH:L('Ödəniş','Оплата','Payment'),
 payP:L('Kuryerə kartla və ya nağd; showroom-da kartla. Bu konseptdə onlayn ödəniş yoxdur.','Курьеру картой или наличными; в шоуруме — картой. В этом концепте онлайн-оплаты нет.','Card or cash to the courier; card in the showroom. There is no online payment in this concept.'),
 footShow:L('Showroom','Шоурум','Showroom'),
 footAddr:L('Bakı, Füzuli küç. 42 (nümunə ünvan). Hər gün 11:00–20:00.','Баку, ул. Физули, 42 (условный адрес). Ежедневно 11:00–20:00.','Baku, 42 Fuzuli St (sample address). Daily 11:00–20:00.'),
 footNote:L('Forma Store uydurma brenddir; məhsullar, qiymətlər və anbar qalıqları nümunədir.','Forma Store — вымышленный бренд; товары, цены и остатки — примеры.','Forma Store is a fictional brand; products, prices and stock levels are samples.'),
 close:L('Bağla','Закрыть','Close')
};

// Runtime strings for app.js (resolved to the page language by ctx.data).
const U={
 from:T.from,low:T.low,out:T.out,count:T.count,
 inStock:L('Anbarda {n} ədəd','В наличии {n} шт.','{n} in stock'),
 lowLine:L('Son {n} ədəd qalıb','Осталось всего {n} шт.','Only {n} left'),
 outLine:L('Bu variant bitib. Başqa rəng və ya ölçü seçin.','Этот вариант закончился. Выберите другой цвет или размер.','This variant is sold out. Choose another colour or size.'),
 colour:L('Rəng','Цвет','Colour'),size:L('Ölçü','Размер','Size'),qty:L('Say','Количество','Quantity'),
 add:L('Səbətə əlavə et','Добавить в корзину','Add to cart'),
 soldBtn:L('Bitib','Нет в наличии','Sold out'),
 added:L('{name} səbətə əlavə olundu','{name} добавлен в корзину','{name} added to cart'),
 viewCart:L('Səbətə bax','Открыть корзину','View cart'),
 maxed:L('Anbarda bundan çox yoxdur','Больше на складе нет','No more in stock'),
 dims:L('Ölçülər','Размеры','Dimensions'),care:L('Material və qulluq','Материал и уход','Material and care'),
 deliv:L('Çatdırılma və qaytarma','Доставка и возврат','Delivery and returns'),
 delivLine:L('Bakı: {fee}, {days}; {free}-dən pulsuz. Regionlar: {rfee}, {rdays}. Qaytarma 14 gün.','Баку: {fee}, {days}; бесплатно от {free}. Регионы: {rfee}, {rdays}. Возврат 14 дней.','Baku: {fee}, {days}; free over {free}. Regions: {rfee}, {rdays}. 14-day returns.'),
 photo:L('Şəkil {n}','Фото {n}','Photo {n}'),
 shown:L('Şəkildə: {c}','На фото: {c}','Shown: {c}'),
 cartH:L('Səbət','Корзина','Cart'),
 emptyH:L('Səbət boşdur','Корзина пуста','Your cart is empty'),
 emptyP:L('Kolleksiyadan bir əşya seçin — səbət burada toplanacaq.','Выберите что-нибудь в коллекции — корзина соберётся здесь.','Pick something from the collection and it will collect here.'),
 browse:L('Kolleksiyaya qayıt','Вернуться к коллекции','Back to the collection'),
 remove:L('Sil','Удалить','Remove'),
 removeA:L('{name} səbətdən sil','Удалить {name} из корзины','Remove {name} from cart'),
 dec:L('Azalt','Уменьшить','Decrease'),inc:L('Artır','Увеличить','Increase'),
 area:L('Çatdırılma bölgəsi','Регион доставки','Delivery area'),
 subtotal:L('Məhsullar','Товары','Subtotal'),delivery:L('Çatdırılma','Доставка','Delivery'),total:L('Cəmi','Итого','Total'),
 free:L('Pulsuz','Бесплатно','Free'),
 toFree:L('Pulsuz çatdırılmaya {p} qalıb','До бесплатной доставки {p}','{p} to go for free delivery'),
 gotFree:L('Çatdırılma pulsuzdur','Доставка бесплатная','Delivery is free'),
 checkout:L('Sifarişi rəsmiləşdir','Оформить заказ','Check out'),
 detailsH:L('Çatdırılma məlumatı','Данные для доставки','Delivery details'),
 name:L('Ad və soyad','Имя и фамилия','Full name'),
 phone:L('Mobil nömrə','Мобильный номер','Mobile number'),
 phoneHint:L('Məsələn: 50 123 45 67','Например: 50 123 45 67','For example: 50 123 45 67'),
 address:L('Ünvan','Адрес','Address'),
 addressHint:L('Küçə, ev, mənzil; giriş kodu varsa yazın','Улица, дом, квартира; код домофона, если есть','Street, building, flat; door code if any'),
 pay:L('Ödəniş','Оплата','Payment'),
 payCard:L('Kuryerə kartla','Картой курьеру','Card on delivery'),
 payCash:L('Nağd','Наличными','Cash'),
 note:L('Kuryer üçün qeyd (istəyə görə)','Комментарий для курьера (необязательно)','Note for the courier (optional)'),
 back:L('Səbətə qayıt','Назад в корзину','Back to cart'),
 review:L('Sifarişi yoxla','Проверить заказ','Review order'),
 eName:L('Adınızı və soyadınızı yazın.','Укажите имя и фамилию.','Enter your full name.'),
 ePhone:L('Nömrəni operator kodu ilə yazın: 50, 51, 55, 70, 77, 99, 10 və ya 60, sonra 7 rəqəm.','Введите номер с кодом оператора: 50, 51, 55, 70, 77, 99, 10 или 60 и ещё 7 цифр.','Enter the number with an operator code (50, 51, 55, 70, 77, 99, 10 or 60) followed by 7 digits.'),
 eAddress:L('Kuryerin gələcəyi ünvanı yazın.','Укажите адрес для курьера.','Enter the address for the courier.'),
 eSummary:L('Formada {n} sahəni düzəldin.','Исправьте поля формы: {n}.','Fix {n} field(s) in the form.'),
 reviewH:L('Sifarişin yoxlanması','Проверка заказа','Order review'),
 demo:L('Demo burada dayanır: sifariş heç yerə göndərilmir və ödəniş alınmır. Real mağazada bu addımda sifariş Forma Store-a çatar və sizə SMS gələrdi.','Демо останавливается здесь: заказ никуда не отправляется, оплата не списывается. В настоящем магазине на этом шаге заказ попал бы в Forma Store, а вам пришло бы SMS.','The demo stops here: the order is not sent anywhere and no payment is taken. In a real shop, this step would pass the order to Forma Store and text you a confirmation.'),
 to:L('Kimə','Получатель','Deliver to'),
 edit:L('Məlumatı dəyiş','Изменить данные','Edit details'),
 finish:L('Səbəti təmizlə və bitir','Очистить корзину и завершить','Clear cart and finish'),
 done:L('Səbət təmizləndi. Demo sifariş göndərilmədi.','Корзина очищена. Демо-заказ не отправлен.','Cart cleared. The demo order was not sent.'),
 items:L('{n} əşya','{n} шт.','{n} items'),
 close:T.close,
 pickup:L('Showroom-dan götürmə: ünvan lazım deyil.','Самовывоз из шоурума: адрес не нужен.','Showroom pickup: no address needed.')
};

const minPrice=p=>Math.min(...p.sizes.map(s=>s.price));
const total=p=>Object.values(p.stock).reduce((a,b)=>a+b,0);
const SIZES_TILE='(min-width:1180px) 22vw, (min-width:760px) 31vw, 46vw';

function tile(ctx,p){
 const t=total(p),flag=t===0?`<span class="f-flag is-out">${ctx.t(T.out)}</span>`:t<=3?`<span class="f-flag">${ctx.t(T.low,{n:t})}</span>`:'';
 const multi=new Set(p.sizes.map(s=>s.price)).size>1;
 const price=multi?ctx.t(T.from,{p:ctx.azn(minPrice(p))}):esc(ctx.azn(minPrice(p)));
 const sw=p.colors.length>1?`<span class="f-sw" aria-label="${ctx.t(T.colours,{n:p.colors.length})}">${p.colors.map(c=>`<i class="f-dot" data-hex="${c.hex}"></i>`).join('')}</span>`:'';
 return `<li class="f-tile" data-id="${p.id}" data-cat="${p.cat}" data-mat="${p.mat}" data-price="${minPrice(p)}" data-stock="${t}" data-rank="${p.rank}" data-added="${p.added}">`+
  `<button type="button" class="f-open" data-open="${p.id}" aria-haspopup="dialog"><span class="f-ph">${ctx.img(`forma/${p.img[0]}`,p.name,{sizes:SIZES_TILE})}${flag}</span>`+
  `<span class="f-meta"><span class="f-name">${ctx.t(p.name)}</span><span class="f-price">${price}</span><span class="f-line">${ctx.t(p.line)}</span>${sw}</span></button></li>`;
}

export default {
 id:'forma',brand:'Forma Store',kind:'site',
 render(ctx){
  const cats=Object.entries(CATS),mats=Object.entries(MATS);
  const note=`<li class="f-note" data-note><h2>${ctx.t(T.noteH)}</h2><p>${ctx.t(T.noteP)}</p><a href="#materials">${ctx.t(T.noteA)}</a></li>`;
  const sorted=[...PRODUCTS].sort((a,b)=>a.rank-b.rank);
  const tiles=sorted.map((p,i)=>tile(ctx,p)+(i===4?note:'')).join('');
  const imgs={};
  for(const p of PRODUCTS)imgs[p.id]={
   big:p.img.map(k=>ctx.img(`forma/${k}`,p.name,{sizes:'(min-width:900px) 46vw, 100vw'})),
   thumb:p.img.map(k=>ctx.img(`forma/${k}`,'',{sizes:'96px'}))
  };
  const data={
   locale:ctx.locale,u:U,cats:CATS,mats:MATS,care:CARE,imgs,
   zones:ZONES,
   products:PRODUCTS.map(p=>({...p,catName:CATS[p.cat],matName:MATS[p.mat]}))
  };
  const zoneRows=ZONES.map(z=>`<tr><th scope="row">${ctx.t(z.name)}</th><td>${z.fee?esc(ctx.azn(z.fee)):ctx.t(U.free)}</td><td>${z.free?ctx.t(T.freeAt,{p:ctx.azn(z.free)}):ctx.t(T.always)}</td><td>${ctx.t(z.days)}</td><td class="f-zn">${ctx.t(z.note)}</td></tr>`).join('');
  const matRows=mats.map(([k,n])=>`<div class="f-mat"><h3>${ctx.t(n)}</h3><p>${ctx.t(T.matOrigin[k])}</p><p class="f-care">${ctx.t(CARE[k])}</p></div>`).join('');
  return `<div class="f-shop">`+
  `<header class="f-head"><a class="f-logo" href="#top">Forma<span>Store</span></a>`+
   `<nav class="f-nav" aria-label="Forma Store">${T.nav.map(([h,l])=>`<a href="${h}">${ctx.t(l)}</a>`).join('')}</nav>`+
   `<label class="f-search"><span class="sr-only">${ctx.t(T.search)}</span><input type="search" id="f-q" placeholder="${ctx.t(T.search)}" autocomplete="off"></label>`+
   `<button type="button" class="f-cartbtn" id="f-cartbtn" aria-haspopup="dialog">${ctx.t(T.cart)} <span class="f-badge" id="f-count">0</span></button></header>`+
  `<p class="f-strip">${ctx.t(T.strip)}</p>`+
  `<section class="f-intro" id="collection" aria-labelledby="f-h1"><h1 id="f-h1">${T.h1w.map(([m,w])=>`<button type="button" class="f-hw" data-hw="${m}" aria-pressed="false" aria-label="${ctx.t(T.h1hint,{m:ctx.raw(MATS[m])})}">${ctx.t(w)}</button>`).join(', ')}.</h1><div class="f-introtext"><p>${ctx.t(T.intro)}</p><p class="f-season">${ctx.t(T.season)}: <span id="f-total">${ctx.t(T.count,{n:PRODUCTS.length})}</span></p></div></section>`+
  `<form class="f-bar" id="f-filters" aria-label="${ctx.t(T.filters)}">`+
   `<fieldset class="f-cats"><legend class="sr-only">${ctx.t(T.category)}</legend>`+
    [['all',T.all],...cats].map(([k,n],i)=>`<label class="f-chip"><input type="radio" name="cat" value="${k}"${i?'':' checked'}><span>${ctx.t(n)}</span></label>`).join('')+`</fieldset>`+
   `<div class="f-selects">`+
    `<label class="f-sel"><span>${ctx.t(T.material)}</span><select name="mat"><option value="">${ctx.t(T.anyMat)}</option>${mats.map(([k,n])=>`<option value="${k}">${ctx.t(n)}</option>`).join('')}</select></label>`+
    `<label class="f-sel"><span>${ctx.t(T.price)}</span><select name="price"><option value="">${ctx.t(T.anyPrice)}</option><option value="0-25">${ctx.t(T.p1)}</option><option value="25-50">${ctx.t(T.p2)}</option><option value="50-999">${ctx.t(T.p3)}</option></select></label>`+
    `<label class="f-sel"><span>${ctx.t(T.sort)}</span><select name="sort"><option value="rank">${ctx.t(T.sFeat)}</option><option value="new">${ctx.t(T.sNew)}</option><option value="asc">${ctx.t(T.sAsc)}</option><option value="desc">${ctx.t(T.sDesc)}</option></select></label>`+
    `<label class="f-check"><input type="checkbox" name="stock" value="1"><span>${ctx.t(T.inStock)}</span></label>`+
   `</div>`+
   `<p class="f-result"><output id="f-n" aria-live="polite">${ctx.t(T.count,{n:PRODUCTS.length})}</output> <button type="reset" class="f-reset" id="f-reset">${ctx.t(T.reset)}</button></p>`+
  `</form>`+
  `<ul class="f-grid" id="f-grid">${tiles}</ul>`+
  `<div class="f-empty" id="f-empty" hidden><h2>${ctx.t(T.emptyH)}</h2><p>${ctx.t(T.emptyP)}</p><button type="button" class="f-btn" data-reset>${ctx.t(T.reset)}</button></div>`+
  `<section class="f-mats" id="materials" aria-labelledby="f-mh"><div class="f-sechead"><h2 id="f-mh">${ctx.t(T.matH)}</h2><p>${ctx.t(T.matP)}</p></div><div class="f-matgrid">${matRows}</div></section>`+
  `<section class="f-del" id="delivery" aria-labelledby="f-dh"><div class="f-sechead"><h2 id="f-dh">${ctx.t(T.delH)}</h2></div>`+
   `<div class="f-tablewrap"><table class="f-table"><thead><tr><th scope="col">${ctx.t(T.zone)}</th><th scope="col">${ctx.t(T.fee)}</th><th scope="col">${ctx.t(T.freeFrom)}</th><th scope="col">${ctx.t(T.time)}</th><th scope="col" class="f-zn"><span class="sr-only">${ctx.t(T.zone)}</span></th></tr></thead><tbody>${zoneRows}</tbody></table></div>`+
   `<div class="f-terms"><div><h3>${ctx.t(T.retH)}</h3><p>${ctx.t(T.retP)}</p></div><div><h3>${ctx.t(T.payH)}</h3><p>${ctx.t(T.payP)}</p></div></div></section>`+
  `<footer class="f-foot"><div class="f-footbrand"><span class="f-logo">Forma<span>Store</span></span><p>${ctx.t(T.footNote)}</p></div><div><h3>${ctx.t(T.footShow)}</h3><p>${ctx.t(T.footAddr)}</p></div><div class="f-footcred">${ctx.credits(PRODUCTS.flatMap(p=>p.img.map(k=>`forma/${k}`)))}</div></footer>`+
  `</div>`+
  `<dialog class="f-dlg f-product" id="f-product" aria-labelledby="f-pname"><div class="f-pinner" id="f-pbody"></div></dialog>`+
  `<dialog class="f-dlg f-drawer" id="f-cart" aria-labelledby="f-carth"><div class="f-drawerin" id="f-cartbody"></div></dialog>`+
  `<div class="f-toast" id="f-toast" role="status" aria-live="polite" hidden></div>`+
  ctx.data(data);
 }
};

