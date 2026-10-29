// Copy for the per-service promotion pages (Azerbaijani source, translated via i18n/strings.js).
// Prices come from product-data.js; EXTRA mirrors the constants hard-wired in calculate() and is checked by tests/i18n.test.mjs.
import {products,printTypes,videoLengths} from './product-data.js';
export const EXTRA={page:29,language:49,module:149,sheet:9,raw:9};
export const serviceIds=['website','system','integrated','print','video'];
const opt=(id,optionId)=>products[id].options.find(o=>o.id===optionId).price;
export const serviceContent={
 website:{
  audience:['Yeni biznesin ilk təqdimat saytı.','Brendin, məhsulun və ya xidmətin səliqəli təqdimatı.','Portfolio və ya şəxsi brend səhifəsi.'],
  extras:[['Əlavə səhifə',EXTRA.page],['Əlavə dil',EXTRA.language]],
  faq:[
   ['Sayt neçə səhifədən ibarət ola bilər?','Başlanğıc qiymətə 1 səhifə daxildir. Hər əlavə səhifə +{page} AZN-dir; ümumilikdə 20 səhifəyə qədər seçmək olar.',{page:EXTRA.page}],
   ['Başqa dillər əlavə etmək olar?','Azərbaycan dili daxildir. Rus və ingilis dilləri hər biri +{language} AZN-dir.',{language:EXTRA.language}],
   ['Domen və hostinq qiymətə daxildirmi?','Xeyr. Domen, hostinq və üçüncü tərəf xidmətləri ayrıca hesablanır.']
  ]},
 system:{
  audience:['Müştəri, sifariş və ya rezervasiya qeydlərini bir yerdə idarə etmək istəyən biznes.','Excel cədvəlləri və mesajlar əvəzinə vahid iş axınına keçmək istəyənlər.','Sonradan rollar, hesabatlar və bildirişlərlə genişlənə bilən sistem.'],
  extras:[['Əlavə modul',EXTRA.module],['Əlavə dil',EXTRA.language]],
  faq:[
   ['Hansı iş axınlarını seçə bilərəm?','Müştəri uçotu, rezervasiya, sifariş idarəetməsi və ya fərdi iş axını. Bir əsas iş axını başlanğıc qiymətə daxildir.'],
   ['Əlavə modul nədir?','Əsas iş axınından kənar əlavə funksiyadır. Hər əlavə modul +{module} AZN-dir, dəqiq işi sizinlə razılaşdırılır.',{module:EXTRA.module}],
   ['Sistem sayta bağlana bilərmi?','Bəli. Sayt və sistemi birlikdə istəyirsinizsə, “Veb sayt + sistem” paketinə baxın.']
  ]},
 integrated:{
  audience:['Təqdimat saytı və arxasında işləyən idarəetmə sistemini birlikdə istəyən biznes.','Sayt və sistemin eyni dizayn və iş məntiqi ilə bir layihədə hazırlanması.','Sorğu, rezervasiya və ya sifarişlərin sayt ilə sistem arasında bağlı işləməsi.'],
  extras:[['Əlavə səhifə',EXTRA.page],['Əlavə dil',EXTRA.language],['Əlavə modul',EXTRA.module]],
  faq:[
   ['Paketə nələr daxildir?','3 sayt səhifəsi, 1 əsas iş axını, idarəetmə paneli və sayt ilə sistemin bağlantısı.'],
   ['Ayrı-ayrı sifariş etməkdən fərqi nədir?','Sayt və sistem bir layihə kimi planlanır; dizayn və iş axını bir-birinə uyğunlaşdırılır.'],
   ['Əlavə səhifə, dil və modul seçmək olar?','Bəli. Hər əlavə səhifə +{page} AZN, hər əlavə dil +{language} AZN, hər əlavə modul +{module} AZN-dir.',{page:EXTRA.page,language:EXTRA.language,module:EXTRA.module}]
  ]},
 print:{
  audience:['Vizit kart, flayer, afişa və ya broşur lazım olan biznes və şəxslər.','Çapa hazır fayl istəyən, çapı özü həll edən müştərilər.','Mövcud brendə uyğun çap materialı yaratmaq istəyənlər.'],
  extras:[['Əlavə səhifə / dizayn',EXTRA.sheet]],
  faq:[
   ['Qiymətə çap daxildirmi?','Xeyr. Qiymət yalnız dizayn üçündür; çap ayrıca hesablanır.'],
   ['Hansı material növləri var?','Vizit kart daxildir; flayer +{flyer} AZN, afişa +{poster} AZN, broşur +{brochure} AZN-dir.',{flyer:printTypes.flyer.price,poster:printTypes.poster.price,brochure:printTypes.brochure.price}],
   ['Redaktə edilə bilən fayl ala bilərəm?','Bəli. Redaktə edilə bilən mənbə faylı +{source} AZN-dir.',{source:opt('print','source')}]
  ]},
 video:{
  audience:['Reels və qısa təqdimat videoları hazırlayan məşqçilər.','Sadə kəsim və birləşdirmə lazım olan şəxslər.','Altyazı, səs və rəng düzəlişi ilə videonu yaxşılaşdırmaq istəyənlər.'],
  extras:[['Hər əlavə 5 dəqiqə ilkin material',EXTRA.raw]],
  faq:[
   ['Başlanğıc qiymətə nə daxildir?','1 video, 30 saniyəyədək, sadə kəsim və birləşdirmə, 5 dəqiqəyədək ilkin material.'],
   ['Video daha uzun olarsa nə dəyişir?','60 saniyəyədək +{l60} AZN, 90 saniyəyədək +{l90} AZN, 180 saniyəyədək +{l180} AZN; hər əlavə 5 dəqiqə ilkin material +{raw} AZN-dir.',{l60:videoLengths['60'],l90:videoLengths['90'],l180:videoLengths['180'],raw:EXTRA.raw}],
   ['Bir neçə video sifariş edə bilərəm?','Bəli. Video sayını seçirsiniz; qiymət hər videonun tam qiymətinə vurulur.']
  ]}
};
