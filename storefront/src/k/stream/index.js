// Arena — a regional sport & culture streaming hub organised like a broadcast desk.
// Server-rendered running order and catalogue; app.js computes live/next/ended from the visitor's clock (Baku time).
import {L} from '../kit.js';
import {CATS,CHANNELS,PROGRAMMES,RUNNING} from './data.js';

const T={
 nav:[['#schedule',L('Efir cədvəli','Программа','Schedule')],['#catalogue',L('Kataloq','Каталог','Catalogue')],['#mylist',L('Siyahım','Мой список','My list')]],
 baku:L('Bakı','Баку','Baku'),
 onNow:L('İndi efirdə','Сейчас в эфире','On now'),
 leadKicker:L('Bu axşamın əsas yayımı','Главная трансляция вечера','Tonight’s main broadcast'),
 schedH:L('Bu günün efir cədvəli','Программа на сегодня','Today’s running order'),
 schedP:L('Dörd kanal, Bakı vaxtı ilə. Qırmızı xətt indiki anı göstərir; bloka basın — proqramın səhifəsi açılacaq.','Четыре канала по бакинскому времени. Красная линия — текущий момент; нажмите на блок, чтобы открыть страницу программы.','Four channels on Baku time. The red line marks now; select a block to open the programme.'),
 jumpNow:L('İndiki ana qayıt','К текущему моменту','Jump to now'),
 catH:L('Kataloq','Каталог','Catalogue'),
 catP:L('Bütün proqramlar və seriyalar — canlı yayımdan sonra təkrar baxış üçün qalır.','Все программы и сериалы — после эфира остаются в записи.','Every programme and series — they stay available after broadcast.'),
 all:L('Hamısı','Все','All'),
 search:L('Proqram axtar','Поиск программы','Search programmes'),
 emptyH:L('Bu axtarışa uyğun proqram yoxdur','По этому запросу программ нет','No programme matches this search'),
 emptyP:L('Başqa söz yazın və ya kateqoriyanı "Hamısı"na qaytarın.','Попробуйте другое слово или верните категорию «Все».','Try another word or switch the category back to “All”.'),
 clear:L('Axtarışı təmizlə','Очистить поиск','Clear search'),
 listH:L('Siyahım','Мой список','My list'),
 listEmptyH:L('Siyahınız hələ boşdur','Ваш список пока пуст','Your list is empty'),
 listEmptyP:L('Proqramın səhifəsində "Siyahıma əlavə et" düyməsinə basın — burada toplanacaq və bu brauzerdə yadda qalacaq.','Нажмите «Добавить в список» на странице программы — она появится здесь и сохранится в этом браузере.','Press “Add to my list” on any programme page — it will collect here and be remembered in this browser.'),
 browse:L('Kataloqa bax','Открыть каталог','Browse the catalogue'),
 episodes:L('{n} bölüm','{n} серий','{n} episodes'),
 footAbout:L('Arena regional idman və mədəniyyət yayımçısıdır: liqa oyunları, şahmat, konsertlər və sənədli filmlər. Bu səhifə konseptdir — kanal, komanda və proqramlar uydurmadır, video yayımı yoxdur.','Arena — региональный вещатель спорта и культуры: матчи лиги, шахматы, концерты и документальное кино. Эта страница — концепт: каналы, команды и программы вымышлены, видеотрансляции нет.','Arena is a regional sport and culture broadcaster: league matches, chess, concerts and documentaries. This page is a concept — the channels, teams and programmes are fictional and there is no video stream.'),
 footTime:L('Bütün vaxtlar Bakı vaxtı ilədir (UTC+4).','Всё время указано по Баку (UTC+4).','All times are Baku time (UTC+4).'),
 open:L('{t}, {c}, {s}','{t}, {c}, {s}','{t}, {c}, {s}')
};

// Runtime strings for app.js.
const U={
 live:L('Canlı','Прямой эфир','Live'),onAir:L('Efirdə','В эфире','On air'),next:L('Növbəti','Далее','Next'),ended:L('Bitdi','Завершено','Ended'),later:L('Sonra','Позже','Later'),
 replay:L('Təkrar','Повтор','Replay'),
 startsIn:L('{h} saat {m} dəq sonra','через {h} ч {m} мин','in {h} h {m} min'),
 startsInM:L('{m} dəqiqə sonra','через {m} мин','in {m} min'),
 minute:L('{p}, {m} dəqiqə keçib','{p}, идёт {m}-я минута','{p}, {m} min in'),
 left:L('{m} dəq qalıb','осталось {m} мин','{m} min left'),
 tomorrow:L('Sabah {t}','Завтра в {t}','Tomorrow {t}'),
 watch:L('İzlə','Смотреть','Watch'),watchLive:L('Canlı izlə','Смотреть в прямом эфире','Watch live'),watchFrom:L('Əvvəldən izlə','Смотреть с начала','Watch from the start'),
 add:L('Siyahıma əlavə et','Добавить в мой список','Add to my list'),added:L('Siyahımdadır','В моём списке','In my list'),
 addedT:L('"{t}" siyahınıza əlavə olundu','«{t}» добавлено в ваш список','“{t}” added to your list'),
 removedT:L('"{t}" siyahıdan çıxarıldı','«{t}» удалено из списка','“{t}” removed from your list'),
 remove:L('Siyahıdan çıxar','Убрать из списка','Remove from list'),
 airings:L('Bu gün efirdə','Сегодня в эфире','On air today'),
 noAir:L('Bu gün efirdə yoxdur — kataloqdan istənilən vaxt baxın.','Сегодня не в эфире — смотрите из каталога в любое время.','Not on air today — watch from the catalogue any time.'),
 parts:L('Hissələr','Части программы','Running order'),eps:L('Bölümlər','Серии','Episodes'),
 min:L('{m} dəq','{m} мин','{m} min'),
 close:L('Bağla','Закрыть','Close'),
 demo:L('Demo pleyer: bu konseptdə video yoxdur. Düymələr pleyerin necə işləyəcəyini göstərir, heç bir yayım yüklənmir.','Демо-плеер: в этом концепте нет видео. Кнопки показывают, как будет работать плеер; трансляция не загружается.','Demo player: there is no video in this concept. The controls show how the player would behave; no stream is loaded.'),
 play:L('Oynat','Воспроизвести','Play'),pause:L('Pauza','Пауза','Pause'),back10:L('10 saniyə geri','Назад на 10 секунд','Back 10 seconds'),fwd10:L('10 saniyə irəli','Вперёд на 10 секунд','Forward 10 seconds'),
 mute:L('Səsi söndür','Выключить звук','Mute'),unmute:L('Səsi aç','Включить звук','Unmute'),
 subs:L('Subtitr','Субтитры','Subtitles'),off:L('Söndürülüb','Выкл.','Off'),
 quality:L('Keyfiyyət','Качество','Quality'),auto:L('Avtomatik','Авто','Auto'),
 full:L('Tam ekran','Во весь экран','Full screen'),
 seek:L('Vaxt şkalası','Шкала времени','Timeline'),
 toLive:L('Canlıya qayıt','К прямому эфиру','Back to live'),
 nowPart:L('İndi: {p}','Сейчас: {p}','Now: {p}'),
 paused:L('Pauza edildi','Пауза','Paused'),playing:L('Oynadılır (demo, video yoxdur)','Воспроизводится (демо, видео нет)','Playing (demo, no video)')
};

const byId=Object.fromEntries(PROGRAMMES.map(p=>[p.id,p]));
const mins=t=>{const [h,m]=t.split(':').map(Number);return h*60+m};

export default {
 id:'stream',brand:'Arena',kind:'site',
 render(ctx){
  const posters={};for(const p of PROGRAMMES)posters[p.id]={card:ctx.img(`stream/${p.img}`,'',{sizes:'(min-width:1100px) 24vw, (min-width:700px) 33vw, 50vw'}),big:ctx.img(`stream/${p.img}`,'',{sizes:'(min-width:900px) 60vw, 100vw'})};
  const lanes=CHANNELS.map(c=>`<div class="r-lane" data-ch="${c.id}"><div class="r-chan"><b>${c.name}</b><span>${ctx.t(c.note)}</span></div><ol class="r-blocks">${RUNNING[c.id].map((b,i)=>{const p=byId[b.p];const end=mins(b.t)+b.min;const e=`${String(Math.floor(end/60)%24).padStart(2,'0')}:${String(end%60).padStart(2,'0')}`;return `<li class="r-b r-c-${p.cat}" data-ch="${c.id}" data-i="${i}" data-cat="${p.cat}" data-start="${mins(b.t)}" data-min="${b.min}"><button type="button" class="r-bb" data-prog="${p.id}" data-air="${c.id}:${i}"><span class="r-time">${b.t}–${e}</span><span class="r-title">${ctx.t(p.title)}</span><span class="r-state" data-state>${b.live?ctx.t(U.live):ctx.t(b.part!==null?p.parts[b.part].name:p.tag)}</span></button></li>`}).join('')}</ol></div>`).join('');
  const hours=Array.from({length:25},(_,h)=>`<span class="r-hr" data-h="${h}">${String(h%24).padStart(2,'0')}:00</span>`).join('');
  const cards=PROGRAMMES.map(p=>`<li class="g-card" data-cat="${p.cat}" data-id="${p.id}"><button type="button" class="g-open" data-prog="${p.id}"><span class="g-ph">${posters[p.id].card}<span class="g-badge" data-badge hidden></span></span><span class="g-cat r-c-${p.cat}">${ctx.t(CATS[p.cat])}</span><span class="g-title">${ctx.t(p.title)}</span><span class="g-tag">${ctx.t(p.tag)}</span><span class="g-when" data-when></span></button></li>`).join('');
  const data={
   u:U,cats:CATS,channels:CHANNELS,running:RUNNING,posters,
   programmes:PROGRAMMES.map(p=>({...p}))
  };
  return `<div class="ar">`+
  `<header class="ar-top"><a class="ar-logo" href="#top">Arena</a><nav class="ar-nav" aria-label="Arena">${T.nav.map(([h,l])=>`<a href="${h}">${ctx.t(l)}${h==='#mylist'?` <span class="ar-count" id="ar-count">0</span>`:''}</a>`).join('')}</nav><p class="ar-clock"><span>${ctx.t(T.baku)}</span> <b id="ar-clock">--:--</b></p></header>`+
  `<section class="ar-lead" aria-labelledby="ar-lead-t"><div class="ar-feature" id="ar-feature"><div class="ar-fph" id="ar-fph">${posters.derbi.big}</div><div class="ar-fcopy"><p class="ar-kick" id="ar-fkick">${ctx.t(T.leadKicker)}</p><h1 id="ar-lead-t">${ctx.t(byId.derbi.title)}</h1><p class="ar-ftag" id="ar-ftag">${ctx.t(byId.derbi.tag)}, Arena 1, 18:30</p><p class="ar-fcount" id="ar-fcount"></p><div class="ar-fact"><button type="button" class="ar-btn" id="ar-fwatch" data-watch="derbi">${ctx.t(U.watch)}</button><button type="button" class="ar-btn ar-ghost" id="ar-fmore" data-prog="derbi">${ctx.t(U.parts)}</button></div></div></div>`+
   `<div class="ar-now"><h2>${ctx.t(T.onNow)}</h2><ul id="ar-nowlist">${CHANNELS.map(c=>`<li data-ch="${c.id}"><b>${c.name}</b><span class="ar-nt">—</span></li>`).join('')}</ul></div></section>`+
  `<section class="ar-sched" id="schedule" aria-labelledby="ar-sh"><div class="ar-head"><h2 id="ar-sh">${ctx.t(T.schedH)}</h2><p>${ctx.t(T.schedP)}</p><button type="button" class="ar-btn ar-ghost ar-small" id="ar-jump">${ctx.t(T.jumpNow)}</button></div>`+
   `<div class="r-wrap" id="r-wrap" tabindex="0" aria-label="${ctx.t(T.schedH)}"><div class="r-grid" id="r-grid"><div class="r-hours" aria-hidden="true">${hours}</div>${lanes}<i class="r-now" id="r-now" hidden></i></div></div></section>`+
  `<section class="ar-cat" id="catalogue" aria-labelledby="ar-ch"><div class="ar-head"><h2 id="ar-ch">${ctx.t(T.catH)}</h2><p>${ctx.t(T.catP)}</p></div>`+
   `<div class="ar-tools"><fieldset class="ar-chips"><legend class="sr-only">${ctx.t(T.catH)}</legend>${[['all',T.all],...Object.entries(CATS)].map(([k,n],i)=>`<label><input type="radio" name="cat" value="${k}"${i?'':' checked'}><span>${ctx.t(n)}</span></label>`).join('')}</fieldset>`+
   `<label class="ar-search"><span class="sr-only">${ctx.t(T.search)}</span><input type="search" id="ar-q" placeholder="${ctx.t(T.search)}" autocomplete="off"></label></div>`+
   `<ul class="g-grid" id="g-grid">${cards}</ul>`+
   `<div class="ar-empty" id="ar-empty" hidden><p class="ar-eh">${ctx.t(T.emptyH)}</p><p>${ctx.t(T.emptyP)}</p><button type="button" class="ar-btn ar-ghost" id="ar-clear">${ctx.t(T.clear)}</button></div></section>`+
  `<section class="ar-list" id="mylist" aria-labelledby="ar-lh"><div class="ar-head"><h2 id="ar-lh">${ctx.t(T.listH)}</h2></div><ul class="g-grid g-mine" id="ar-mine"></ul>`+
   `<div class="ar-empty ar-lempty" id="ar-lempty"><p class="ar-eh">${ctx.t(T.listEmptyH)}</p><p>${ctx.t(T.listEmptyP)}</p><a class="ar-btn ar-ghost" href="#catalogue">${ctx.t(T.browse)}</a></div></section>`+
  `<footer class="ar-foot"><p class="ar-logo">Arena</p><div><p>${ctx.t(T.footAbout)}</p><p>${ctx.t(T.footTime)}</p></div><div class="ar-cred">${ctx.credits(PROGRAMMES.map(p=>`stream/${p.img}`))}</div></footer>`+
  `</div>`+
  `<dialog class="ar-dlg ar-prog" id="ar-prog" aria-labelledby="ar-pt"><div id="ar-pbody"></div></dialog>`+
  `<dialog class="ar-dlg ar-player" id="ar-player" aria-labelledby="ar-plt"><div id="ar-plbody"></div></dialog>`+
  `<div class="ar-toast" id="ar-toast" role="status" aria-live="polite" hidden></div>`+
  ctx.data(data);
 }
};
