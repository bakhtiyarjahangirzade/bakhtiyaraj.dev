// Stockroom — warehouse of a fictional Baku coffee roastery that supplies cafés.
import {L,esc} from '../kit.js';
import {TODAY,units,cats,suppliers,skus,roastPairs,cafes,orders,reasons,people,history} from './data.js';
import {rows,counts,ordersHTML,logHTML,reorderHTML,detailHTML,makeFmt,addDays} from './view.js';

const S={
 st:{ok:L('Kifayətdir','Достаточно','In stock'),low:L('Minimumdan az','Ниже минимума','Below minimum'),out:L('Bitib','Нет в наличии','Out of stock')},
 ost:{new:L('Yeni','Новый','New'),picking:L('Yığılır','Собирается','Picking'),shipped:L('Göndərilib','Отгружен','Shipped')},
 mt:{receive:L('Qəbul','Приёмка','Receive'),ship:L('Göndərmə','Отгрузка','Ship'),roast:L('Qovurma','Обжарка','Roast'),adjust:L('Düzəliş','Корректировка','Adjust')},
 colLoc:L('Yer','Место','Bin'),colOn:L('Anbarda','На складе','On hand'),colRes:L('Rezerv','Резерв','Reserved'),colAvail:L('Mövcud','Доступно','Available'),
 colLevel:L('Minimuma görə','Относительно минимума','Against minimum'),colCover:L('Çatar','Хватит на','Cover'),
 colWhen:L('Vaxt','Время','When'),colType:L('Növ','Тип','Type'),colItem:L('Məhsul','Товар','Item'),colDelta:L('Dəyişiklik','Изменение','Change'),colBal:L('Qalıq','Остаток','Balance'),colRef:L('Sənəd, səbəb, kim','Документ, причина, кто','Document, reason, by'),
 colUse:L('Gündəlik sərf','Расход в день','Daily use'),colLead:L('Çatdırılma','Срок поставки','Lead time'),colSugg:L('Təklif','Предложение','Suggested'),colSup:L('Təchizatçı','Поставщик','Supplier'),colAction:L('Əməliyyat','Действие','Action'),
 daysN:L('{n} gün','{n} дн.','{n} days'),perDay:L('{q}/gün','{q}/день','{q}/day'),minShort:L('min {q}','мин. {q}','min {q}'),onOrderShort:L('+{q} yolda','+{q} в пути','+{q} on order'),
 today:L('bu gün','сегодня','today'),dueOn:L('Çatdırılma: {d}','Доставка: {d}','Due {d}'),shippedOn:L('Göndərilib: {d}','Отгружен: {d}','Shipped {d}'),
 startPick:L('Yığmağa başla','Начать сборку','Start picking'),shipOrder:L('Göndər və anbardan sil','Отгрузить и списать','Ship and deduct'),
 onlyHave:L('anbarda {q}','на складе {q}','{q} on hand'),blocked:L('{n} sətir üçün mal çatmır — əvvəlcə qəbul edin.','Не хватает товара в строках: {n} — сначала оприходуйте.','{n} line(s) short — receive stock first.'),
 blockedToast:L('SF-{no} göndərilə bilməz: mal çatmır.','SF-{no} нельзя отгрузить: не хватает товара.','SF-{no} can’t ship: stock is short.'),
 pickedToast:L('SF-{no} yığılmağa başladı.','SF-{no}: сборка начата.','SF-{no} is now being picked.'),
 shippedToast:L('SF-{no} göndərildi: {n} sətir anbardan silindi.','SF-{no} отгружен: списано строк — {n}.','SF-{no} shipped: {n} lines deducted.'),
 logEmpty:L('Bu məhsul üzrə hərəkət yoxdur.','По этому товару движений нет.','No movements for this item.'),
 noSugg:L('Hazırda sifariş verilməli məhsul yoxdur.','Сейчас нечего заказывать.','Nothing needs reordering right now.'),
 whyRe:L('Çatdırılanadək ({d}) qalacaq: {p}; minimum {min}','К поставке ({d}) останется {p}; минимум {min}','By arrival ({d}) {p} left; minimum {min}'),
 planRoast:L('Qovurmanı planla','Запланировать обжарку','Plan roast'),placePO:L('Sifariş ver','Заказать','Place order'),
 reTotal:L('Təchizatçı sifarişlərinin təxmini dəyəri: {sum}. Öz qovurmamız bu məbləğə daxil deyil.','Ориентировочная сумма заказов поставщикам: {sum}. Собственная обжарка не включена.','Estimated supplier spend: {sum}. Our own roasting isn’t included.'),
 poToast:L('{code}: {q} təchizatçıdan sifariş edildi (demo, heç nə göndərilmədi).','{code}: заказано {q} у поставщика (демо, ничего не отправлено).','{code}: {q} ordered from the supplier (demo, nothing was sent).'),
 planToast:L('{code}: qovurma forması {q} üçün dolduruldu.','{code}: форма обжарки заполнена на {q}.','{code}: roast form filled for {q}.'),
 levelLine:L('Minimum {min}. Gündə {use} sərf olunur — mövcud mal {d} günə çatar.','Минимум {min}. Расход {use} в день — доступного хватит на {d} дн.','Minimum {min}. {use} used per day — available stock lasts {d} days.'),
 onOrderLine:L('Təchizatçıdan yolda: {q}','В пути от поставщика: {q}','On order from supplier: {q}'),receivePO:L('Gələni qəbul et','Принять поставку','Receive delivery'),
 suggLine:L('Sifariş təklifi: {q}. “Sifariş təklifləri” bölməsinə baxın.','Предложение заказа: {q}. См. раздел «Предложения заказа».','Suggested order: {q}. See Reorder.'),
 lastMoves:L('Son hərəkətlər','Последние движения','Recent movements'),
 // form
 errQty:L('Müsbət miqdar yazın.','Укажите положительное количество.','Enter a positive quantity.'),
 errShip:L('Mövcud olandan çox göndərmək olmaz: {q}. Rezervdəki mal açıq sifarişlərə aiddir.','Нельзя отгрузить больше доступного: {q}. Резерв принадлежит открытым заказам.','You can ship at most {q}. Reserved stock belongs to open orders.'),
 errRoast:L('Anbarda bu qədər yaşıl dən yoxdur: {q}.','Столько зелёного зерна нет: {q}.','Not enough green coffee: {q} on hand.'),
 errBatch:L('Bir qeyddə ən çox 60 kg qovurmaq olar (4 partiya × 15 kg).','За одну запись — не более 60 кг (4 партии × 15 кг).','At most 60 kg per entry (4 batches × 15 kg).'),
 errYield:L('Çıxım 70% ilə 90% arasında olmalıdır.','Выход должен быть от 70% до 90%.','Yield must be between 70% and 90%.'),
 errDelta:L('Fərq sıfır ola bilməz.','Разница не может быть нулевой.','The difference can’t be zero.'),
 errBelow:L('Düzəlişdən sonra qalıq mənfi olardı.','После корректировки остаток станет отрицательным.','The balance would go below zero.'),
 errReason:L('Düzəlişin səbəbini seçin.','Выберите причину корректировки.','Choose a reason for the adjustment.'),
 errSummary:L('Hərəkət qeyd olunmadı: {n} xəta.','Движение не записано: ошибок — {n}.','Movement not recorded: {n} error(s).'),
 preview:L('{code}: {from} → {to}','{code}: {from} → {to}','{code}: {from} → {to}'),
 roastOut:L('Çıxacaq: {q} qovrulmuş dən','Выйдет: {q} обжаренного зерна','Output: {q} roasted'),
 savedToast:L('{type} qeyd olundu: {code} {delta}. Qalıq {bal}.','{type} записана: {code} {delta}. Остаток {bal}.','{type} recorded: {code} {delta}. Balance {bal}.'),
 roastToast:L('Qovurma {ref}: {gin} yaşıl → {rout} qovrulmuş.','Обжарка {ref}: {gin} зелёного → {rout} обжаренного.','Roast {ref}: {gin} green → {rout} roasted.'),
 noResult:L('“{q}” üzrə məhsul tapılmadı.','По запросу «{q}» товаров нет.','No items match “{q}”.'),noResultF:L('Bu filtrə uyğun məhsul yoxdur.','Под этот фильтр товаров нет.','No items match these filters.'),
 rowsN:L('{n} məhsul','товаров: {n}','{n} items'),
 attn:L('{low} məhsul minimumdan az, {out} bitib','{low} ниже минимума, {out} нет в наличии','{low} below minimum, {out} out of stock'),
 attnOrders:L('{n} açıq sifariş','открытых заказов: {n}','{n} open orders'),attnSugg:L('{n} sifariş təklifi','предложений заказа: {n}','{n} to reorder'),
 by:L('Aysel','Айсель','Aysel'),
 sortAsc:L('artan','по возрастанию','ascending'),sortDesc:L('azalan','по убыванию','descending')
};

export default {id:'stock',brand:'Stockroom',kind:'app',render(ctx){
 const t=ctx.t,raw=ctx.raw;
 const D={today:TODAY,locale:ctx.locale,S:ctx.resolve(S),units:ctx.resolve(units),cats:ctx.resolve(cats),reasons:ctx.resolve(reasons),cafes,roastPairs,
  months:raw(L('yan|fev|mar|apr|may|iyn|iyl|avq|sen|okt|noy|dek','янв|фев|мар|апр|мая|июн|июл|авг|сен|окт|ноя|дек','Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec')).split('|'),
  skus:skus.map(([code,name,cat,unit,on,min,use,lead,mult,sup,loc,cost])=>({code,name:raw(name),cat,unit,on,min,use,lead,mult,sup,supName:typeof suppliers[sup]==='string'?suppliers[sup]:raw(suppliers[sup]),loc,cost,onOrder:0})),
  orders:orders.map(([no,c,status,cr,due,lines])=>({no,cafe:cafes[c],status,created:addDays(TODAY,cr),due:addDays(TODAY,due),shipped:status==='shipped'?addDays(TODAY,due):null,lines}))};
 // Audit log: walk history newest → oldest so each balance ends at today's on-hand figure.
 const bal=Object.fromEntries(D.skus.map(s=>[s.code,s.on]));
 D.log=history.slice().reverse().map(([ago,time,type,code,delta,ref,by,reason])=>{const e={date:addDays(TODAY,-ago),time,type,code,delta,bal:Math.round(bal[code]*10)/10,ref,by:people[by],reason};bal[code]-=delta;return e}).reverse();
 const F=makeFmt(D),st={q:'',cat:'all',st:'all',sort:'status',dir:1,sel:'G-COL-HUI'},R=rows(D,F,st),C=counts(D);
 const ico=p=>`<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="${p}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
 const sortBtn=(k,label)=>`<button type="button" class="sr-sort" data-sort="${k}" aria-label="${t(label)}">${t(label)}<svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true"><path d="M2 4l3-3 3 3M2 6l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.3"/></svg></button>`;
 const skuOpts=(filter)=>Object.keys(cats).filter(c=>!filter||filter.includes(c)).map(c=>`<optgroup label="${esc(D.cats[c])}">${D.skus.filter(s=>s.cat===c).map(s=>`<option value="${s.code}"${s.code===st.sel?' selected':''}>${s.code} — ${esc(s.name)}</option>`).join('')}</optgroup>`).join('');
 const tab=(id,label,n,on)=>`<button type="button" role="tab" id="sr-tab-${id}" aria-controls="sr-p-${id}" aria-selected="${on}" tabindex="${on?0:-1}" data-tab="${id}">${t(label)}${n!==undefined?` <b id="sr-tn-${id}">${n}</b>`:''}</button>`;
 const field=(id,label,input,extra='')=>`<div class="sr-field${extra}" id="${id}-f"><label for="${id}">${label}</label>${input}<p class="sr-err" id="${id}-e"></p></div>`;
 return `<div class="sr">
<header class="sr-top">
 <p class="sr-brand"><svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><path d="M4 9.5 14 4l10 5.5v11L14 26 4 20.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M4 9.5 14 15l10-5.5M14 15v11" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><span>Stockroom</span></p>
 <div class="sr-top-t"><h1>${t(L('Dən Roastery — Bakı anbarı','Dən Roastery — склад в Баку','Dən Roastery — Baku warehouse'))}</h1>
 <p>${t(L('Fiktiv qovurma sexinin anbarı: yaşıl və qovrulmuş dən, kafelər üçün stəkan, filtr, sirop və bitki südü. Hər rəqəmin vahidi var; mövcud qalıq açıq kafe sifarişlərinin rezervi çıxılmaqla hesablanır.','Склад вымышленной обжарочной: зелёное и обжаренное зерно, стаканы, фильтры, сиропы и растительное молоко для кафе. У каждого числа есть единица; доступный остаток считается за вычетом резерва открытых заказов кафе.','The warehouse of a fictional roastery: green and roasted coffee plus cups, filters, syrups and plant milk for cafés. Every number has a unit; available stock is what’s left after open café orders are reserved.'))}</p></div>
 <p class="sr-who">${t(L('3 noyabr 2026, Aysel (anbar)','3 ноября 2026, Айсель (склад)','3 November 2026, Aysel (warehouse)'))}</p>
</header>
<div class="sr-attn" id="sr-attn">
 <button type="button" class="sr-attn-b is-warn" data-go="attn">${ico('M10 3.5 2.5 16.5h15zM10 8.5v3.5M10 14.3v.2')}<span id="sr-attn-st">${t(S.attn,{low:C.low,out:C.out})}</span></button>
 <button type="button" class="sr-attn-b" data-go="orders">${ico('M4 6h12l-1 10H5zM7 6V4.5h6V6')}<span id="sr-attn-o">${t(S.attnOrders,{n:C.open})}</span></button>
 <button type="button" class="sr-attn-b" data-go="reorder">${ico('M4 10a6 6 0 0 1 10.5-4M16 10a6 6 0 0 1-10.5 4M14 3v3.2h-3.2M6 17v-3.2h3.2')}<span id="sr-attn-r">${t(S.attnSugg,{n:C.sugg})}</span></button>
</div>
<div class="sr-tabs" role="tablist" aria-label="${t(L('Bölmələr','Разделы','Sections'))}">${tab('stock',L('Qalıqlar','Остатки','Stock'),undefined,true)}${tab('orders',L('Kafe sifarişləri','Заказы кафе','Café orders'),C.open,false)}${tab('log',L('Hərəkət jurnalı','Журнал движений','Movement log'),undefined,false)}${tab('reorder',L('Sifariş təklifləri','Предложения заказа','Reorder'),C.sugg,false)}</div>

<section class="sr-panel sr-p-stock" id="sr-p-stock" role="tabpanel" aria-labelledby="sr-tab-stock">
 <div class="sr-stock">
  <div class="sr-list">
   <div class="sr-filters">
    <div class="sr-search"><label class="sr-only" for="sr-q">${t(L('Kod və ya ad üzrə axtar','Поиск по коду или названию','Search by code or name'))}</label>${ico('M9 15.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13ZM14 14l4 4')}<input id="sr-q" type="search" autocomplete="off" placeholder="${t(L('Kod və ya ad, məs. G-KEN','Код или название, напр. G-KEN','Code or name, e.g. G-KEN'))}"></div>
    <label class="sr-only" for="sr-cat">${t(L('Kateqoriya','Категория','Category'))}</label><select id="sr-cat"><option value="all">${t(L('Bütün kateqoriyalar','Все категории','All categories'))}</option>${Object.keys(cats).map(c=>`<option value="${c}">${esc(D.cats[c])}</option>`).join('')}</select>
    <div class="sr-chips" role="group" aria-label="${t(L('Status','Статус','Status'))}"><button type="button" data-st="all" aria-pressed="true">${t(L('Hamısı','Все','All'))}</button><button type="button" data-st="attn" aria-pressed="false">${t(L('Diqqət tələb edir','Требуют внимания','Needs attention'))}</button><button type="button" data-st="out" aria-pressed="false">${t(S.st.out)}</button></div>
   </div>
   <div class="sr-countrow"><p class="sr-count" id="sr-count" aria-live="polite">${t(S.rowsN,{n:R.n})}</p><a class="sr-jump" href="#sr-move">${t(L('Hərəkət qeyd et','Записать движение','Record a movement'))}</a></div>
   <table class="sr-table" id="sr-table"><thead><tr><th scope="col" aria-sort="none">${sortBtn('name',L('Məhsul','Товар','Item'))}</th><th scope="col" class="sr-c-loc">${t(S.colLoc)}</th><th scope="col" class="sr-num sr-c-on">${t(S.colOn)}</th><th scope="col" class="sr-num sr-c-res">${t(S.colRes)}</th><th scope="col" class="sr-num" aria-sort="none">${sortBtn('avail',S.colAvail)}</th><th scope="col" class="sr-c-lvl">${t(S.colLevel)}</th><th scope="col" class="sr-num" aria-sort="none">${sortBtn('cover',S.colCover)}</th><th scope="col" aria-sort="ascending">${sortBtn('status',L('Status','Статус','Status'))}</th></tr></thead><tbody id="sr-rows">${R.html}</tbody></table>
   <div class="sr-empty" id="sr-empty" hidden><p id="sr-empty-t"></p><button type="button" class="sr-btn" id="sr-clear">${t(L('Filtrləri təmizlə','Сбросить фильтры','Clear filters'))}</button></div>
  </div>
  <aside class="sr-side" aria-label="${t(L('Seçilmiş məhsul və hərəkət','Выбранный товар и движение','Selected item and movement'))}">
   <section class="sr-detail" id="sr-detail" aria-live="polite">${detailHTML(D,F,st.sel)}</section>
   <form class="sr-move" id="sr-move" novalidate>
    <h2>${t(L('Hərəkət qeyd et','Записать движение','Record a movement'))}</h2>
    <fieldset class="sr-types"><legend class="sr-only">${t(S.colType)}</legend>${['receive','ship','roast','adjust'].map((k,i)=>`<label><input type="radio" name="type" value="${k}"${i===0?' checked':''}><span>${t(S.mt[k])}</span></label>`).join('')}</fieldset>
    <p class="sr-form-err" id="sr-form-err" role="alert" hidden></p>
    ${field('sr-sku',t(L('Məhsul','Товар','Item')),`<select id="sr-sku" name="sku">${skuOpts()}</select>`)}
    ${field('sr-green',t(L('Yaşıl dən (giriş)','Зелёное зерно (вход)','Green coffee (in)')),`<select id="sr-green" name="green">${skuOpts(['green'])}</select>`)}
    ${field('sr-roasted',t(L('Qovrulmuş dən (çıxış)','Обжаренное зерно (выход)','Roasted coffee (out)')),`<select id="sr-roasted" name="roasted">${skuOpts(['roasted'])}</select>`)}
    <div class="sr-row">
     ${field('sr-qty',`<span id="sr-qty-l">${t(L('Miqdar','Количество','Quantity'))}</span>, <span id="sr-unit">kg</span>`,`<input id="sr-qty" name="qty" type="number" inputmode="decimal" step="any" min="0" aria-describedby="sr-qty-e">`)}
     ${field('sr-yield',t(L('Çıxım, %','Выход, %','Yield, %')),`<input id="sr-yield" name="yield" type="number" inputmode="decimal" min="70" max="90" step="0.5" value="84" aria-describedby="sr-yield-e">`)}
     ${field('sr-delta',t(L('Fərq (+ və ya −)','Разница (+ или −)','Difference (+ or −)')),`<input id="sr-delta" name="delta" type="number" inputmode="decimal" step="any" aria-describedby="sr-delta-e">`)}
    </div>
    ${field('sr-ref',t(L('Qaimə nömrəsi (istəyə görə)','Номер накладной (необязательно)','Delivery note no. (optional)')),`<input id="sr-ref" name="ref" autocomplete="off" placeholder="AQ-7790">`)}
    ${field('sr-cafe',t(L('Kimə','Кому','To')),`<select id="sr-cafe" name="cafe">${cafes.map(c=>`<option>${esc(c)}</option>`).join('')}</select>`)}
    ${field('sr-reason',t(L('Səbəb','Причина','Reason')),`<select id="sr-reason" name="reason" aria-describedby="sr-reason-e"><option value="">${t(L('Seçin','Выберите','Choose'))}</option>${Object.keys(reasons).map(k=>`<option value="${k}">${esc(D.reasons[k])}</option>`).join('')}</select>`)}
    <p class="sr-preview" id="sr-preview" aria-live="polite"></p>
    <button type="submit" class="sr-btn sr-btn-primary">${t(L('Hərəkəti qeyd et','Записать движение','Record movement'))}</button>
    <p class="sr-demo">${t(L('Demo: dəyişikliklər yalnız bu səhifədə saxlanır.','Демо: изменения хранятся только на этой странице.','Demo: changes live on this page only.'))}</p>
   </form>
  </aside>
 </div>
</section>
<section class="sr-panel" id="sr-p-orders" role="tabpanel" aria-labelledby="sr-tab-orders" hidden><p class="sr-intro">${t(L('Yeni sifariş malı rezervə alır. “Yığılır” statusunda göndərmək olar; göndərmə hər sətri anbardan silir və jurnala yazır.','Новый заказ резервирует товар. Из статуса «Собирается» его можно отгрузить: каждая строка списывается и попадает в журнал.','A new order reserves stock. Once it’s being picked it can ship: every line is deducted and logged.'))}</p><div class="sr-orders" id="sr-orders">${ordersHTML(D,F)}</div></section>
<section class="sr-panel" id="sr-p-log" role="tabpanel" aria-labelledby="sr-tab-log" hidden><div class="sr-log-head"><label for="sr-log-f">${t(L('Məhsul','Товар','Item'))}</label><select id="sr-log-f"><option value="">${t(L('Bütün məhsullar','Все товары','All items'))}</option>${skuOpts().replace(/ selected/g,'')}</select></div><div id="sr-log">${logHTML(D,F)}</div></section>
<section class="sr-panel" id="sr-p-reorder" role="tabpanel" aria-labelledby="sr-tab-reorder" hidden><p class="sr-intro">${t(L('Təklif o zaman yaranır ki, təchizatçının çatdırılma müddəti ərzində sərfdən sonra qalacaq mal minimumdan aşağı düşsün. Miqdar: minimum + (çatdırılma + 14 gün) sərfi − mövcud − yolda olan, təchizatçının qablaşdırmasına yuvarlaqlaşdırılır.','Предложение появляется, когда после расхода за срок поставки остаток упадёт ниже минимума. Количество: минимум + расход за (срок поставки + 14 дней) − доступно − в пути, с округлением до упаковки поставщика.','A suggestion appears when the stock left after the supplier’s lead time would fall below the minimum. Quantity: minimum + use over (lead time + 14 days) − available − on order, rounded up to the supplier’s pack size.'))}</p><div id="sr-reorder">${reorderHTML(D,F)}</div></section>

<section class="sr-defs" aria-labelledby="sr-defs-h"><h2 id="sr-defs-h">${t(L('Rəqəmlər necə hesablanır','Как считаются цифры','How the numbers work'))}</h2><dl>
 <div><dt>${t(S.colAvail)}</dt><dd>${t(L('Anbarda olan − açıq (yeni və yığılan) sifarişlərin rezervi.','На складе − резерв открытых (новых и собираемых) заказов.','On hand − reserved by open (new and picking) orders.'))}</dd></div>
 <div><dt>${t(L('Status','Статус','Status'))}</dt><dd>${t(L('Mövcud miqdar minimumdan azdırsa “minimumdan az”, sıfırdırsa “bitib”.','«Ниже минимума», если доступно меньше минимума; «нет в наличии» при нуле.','Below minimum when available is under the minimum; out of stock at zero.'))}</dd></div>
 <div><dt>${t(S.colCover)}</dt><dd>${t(L('Mövcud miqdar ÷ son 30 günün orta gündəlik sərfi.','Доступно ÷ средний дневной расход за 30 дней.','Available ÷ average daily use over the last 30 days.'))}</dd></div>
 <div><dt>${t(S.mt.roast)}</dt><dd>${t(L('Yaşıl dən çıxılır, qovrulmuş dən çıxım faizi ilə əlavə olunur (adətən 82–86%: nəm və qabıq itir).','Зелёное зерно списывается, обжаренное приходуется с учётом выхода (обычно 82–86%: уходят влага и шелуха).','Green coffee goes out, roasted comes in at the batch yield (usually 82–86%: moisture and chaff are lost).'))}</dd></div>
</dl></section>
<footer class="sr-foot"><p><b>Stockroom</b> — ${t(L('BAKHY konsept nümunəsi. Dən Roastery, təchizatçılar, kafelər və qiymətlər uydurmadır.','концепт-пример BAKHY. Dən Roastery, поставщики, кафе и цены вымышлены.','a BAKHY concept sample. Dən Roastery, the suppliers, cafés and prices are fictional.'))}</p></footer>
<div class="sr-toast" id="sr-toast" role="status" aria-live="polite"></div>
${ctx.data(D)}
</div>`;
}};
