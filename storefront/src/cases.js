// Case studies for the three real, live projects (Azerbaijani source; translated through i18n/strings.js).
// Every statement is checkable on the live domain or in the screenshots under public/assets/cases/,
// captured from the live sites on 3 November 2026 (Promo X: the earlier screenshot kept in the repository).
// No client quotes, metrics or results are claimed. Role wording follows the existing portfolio labels.
const shot=(base,widths,alt,caption)=>({base,widths,alt,caption});
export const cases={
 savor:{
  domain:'savor.com.az',
  context:'Savor kərə yağı və ərinmiş yağ istehsal edir. Sayt məhsulları, qablaşdırma ölçülərini və istehsalın necə qurulduğunu həm ev alıcısına, həm də HoReCa müştərisinə göstərir.',
  scope:['Azərbaycan, rus və ingilis dilləri','Altı mərhələli istehsal hekayəsi və 70 saniyəlik zavod filmi','200 q-dan 20 kq-a qədər beş məhsul, hər biri üçün ayrıca səhifə','Qalereya, reseptlər, haqqımızda və əlaqə','Açıq və tünd görünüş'],
  decisions:['Əsas vizual material brendin öz istehsal fotolarıdır: avadanlıq, laboratoriya, qablaşdırma, çatdırılma.','Məhsullar çəkiyə görə sıralanır, alıcı öz ölçüsünü siyahıdan dərhal tapır.','Serif başlıqlar və krem fon qida brendinə sakit, etibarlı ton verir.'],
  shots:[shot('/assets/cases/savor-home',[640,1280],'Savor saytının ana səhifəsi','Ana səhifə'),shot('/assets/cases/savor-process',[640,1280],'Savor saytında istehsal mərhələləri','İstehsal mərhələləri'),shot('/assets/cases/savor-products',[640,1280],'Savor saytında məhsul siyahısı','Beş məhsul')],
  mobile:'/assets/cases/savor-mobile-480.jpg'
 },
 isoclub:{
  domain:'isoclub.az',
  context:'İsoClub məşqçi ilə üzvün birlikdə işlədiyi qapalı fitness icmasıdır. Platforma üzvlüyə müraciəti, məşqçinin hazırladığı planları və pulsuz alətləri bir yerdə toplayır.',
  scope:['Üzvlük müraciəti və hesaba giriş','Məşq və qidalanma planının tətbiq ekranları','Addım-addım işləyən pulsuz hesablayıcılar','Məşqçinin şərh etdiyi məqalələr, mağaza və tərəfdaşlıq bölməsi','Üç dil, açıq və tünd görünüş, məxfilik və şərtlər səhifələri'],
  decisions:['Tünd fon və bir parlaq yaşıl vurğu: idman tətbiqi hissi yaradır, əsas düymələr aydın seçilir.','Ana səhifədə tətbiqin ekranları göstərilir: ziyarətçi üzv olandan sonra nə görəcəyini əvvəlcədən bilir.','Hesablayıcı e-poçt, məlumatlar və nəticələr kimi üç addıma bölünüb.'],
  shots:[shot('/assets/cases/isoclub-home',[640,1280],'İsoClub platformasının ana səhifəsi','Ana səhifə'),shot('/assets/cases/isoclub-app',[640,1280],'İsoClub tətbiqinin təqdimat bölməsi','Tətbiq bölməsi'),shot('/assets/cases/isoclub-tools',[640,1280],'İsoClub pulsuz hesablayıcılar səhifəsi','Pulsuz hesablayıcılar')],
  mobile:'/assets/cases/isoclub-mobile-480.jpg'
 },
 promox:{
  domain:'promox.az',
  context:'Promo X korporativ hədiyyələr və promo məhsullar təklif edir. Sayt çoxlu kateqoriyadan ibarət məhsul kataloqudur.',
  scope:['Başlıqda məhsul axtarışı','İkonlu kateqoriya paneli və bütün kateqoriyalar menyusu','Kampaniya slayderi və seçilmiş məhsul blokları','Seçilmişlər siyahısı','Telefon, e-poçt, WhatsApp və Instagram keçidləri'],
  decisions:['Kateqoriyalar ekranın kənarında həmişə görünür, geniş çeşiddə naviqasiya qısalır.','Axtarış başlığın mərkəzindədir, çünki alıcı çox vaxt konkret məhsul axtarır.'],
  shots:[shot('/assets/cases/promox-home',[640,1024],'Promo X saytının ana səhifəsi','Ana səhifə')]
 }
};
export const caseIds=Object.keys(cases);
export const caseUi=['Real layihə','Kontekst','Görülən iş','Dizayn qərarları','Mənim rolum','Dizayn və proqramlaşdırma','Saytı aç','Bu istiqamətdə layihə','Mobil görünüş','Ekran görüntüsünü göstər: {name}'];
