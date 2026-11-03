// Luna Comics — the one canonical catalogue source.
// Every title, its page manifest, access rule, illustrative price and credits live here.
// Assets are served from /Luna/comics/<slug>/ (storefront/public/Luna/comics/<slug>/).
// To add a comic, follow docs/luna-implementation.md ("Adding a comic"); tests/luna.test.mjs validates this file.

export const ASSET_ROOT = '/Luna/comics';
export const WHATSAPP_NUMBER = '48571572697';

const PC_LICENSE = {
  name: 'CC BY 4.0',
  url: 'https://creativecommons.org/licenses/by/4.0/',
  evidence: 'https://www.peppercarrot.com/en/license/index.html',
};
const PC_SERIES = 'Pepper&Carrot';
const PC_CREATOR = 'David Revoy';
const sourceUrl = folder => `https://www.peppercarrot.com/0_sources/${folder}/low-res/`;
const pageUrl = (lang, folder) => `https://www.peppercarrot.com/${lang}/webcomic/${folder}.html`;
const pages = n => Array.from({ length: n }, (_, i) => `p${String(i + 1).padStart(2, '0')}.webp`);

// language: original-language label of the comic text (never translated by Luna)
export const LANGUAGES = {
  en: 'İngiliscə',
  ru: 'Rusca',
  none: 'Sözsüz',
};
export const ACCESS = {
  free: 'Pulsuz',
  sample: 'Nümunə məhsul',
};

export const titles = [
  {
    slug: 'pepper-carrot-01',
    series: PC_SERIES, episode: 1,
    title: 'The Potion of Flight',
    creator: PC_CREATOR,
    credits: [['Rəsm və ssenari', 'David Revoy'], ['İngiliscə mətn (orijinal)', 'David Revoy'], ['Korrektura', 'Amireeti, Alex Gryson']],
    language: 'en', languageNote: 'Orijinal ingiliscə versiya',
    genres: ['Fantastika', 'Komediya'],
    year: 2014,
    synopsis: 'Pepper qazanda uçuş iksirinin son tərkibini əlavə edir, amma nəticə ona hələ kifayət qədər güclü görünmür. Pişiyi Carrot isə qazana öz planı ilə yanaşır. Seriyanın üç səhifəlik ilk bölümü — Pepper ilə Carrotu tanımaq üçün ən qısa yol.',
    access: 'free', price: null,
    storyPages: 3, pages: pages(3),
    pageSize: [1200, 1660], coverSize: [1100, 765],
    tone: '#2f4a3f',
    featured: true,
    source: { folder: 'ep01_Potion-of-Flight', files: sourceUrl('ep01_Potion-of-Flight'), page: pageUrl('en', 'ep01_Potion-of-Flight'), published: '2014-05-10' },
    license: PC_LICENSE,
  },
  {
    slug: 'pepper-carrot-02',
    series: PC_SERIES, episode: 2,
    title: 'Rainbow Potions',
    creator: PC_CREATOR,
    credits: [['Rəsm və ssenari', 'David Revoy'], ['İngiliscə mətn (orijinal)', 'David Revoy'], ['Korrektura', 'Amireeti, Alex Gryson']],
    language: 'en', languageNote: 'Orijinal ingiliscə versiya; mətn əsasən səs effektləri və etiketlərdir',
    genres: ['Komediya'],
    year: 2014,
    synopsis: 'Pepper rəngbərəng iksirləri şüşələrə doldurub “cadı mülkü” xəbərdarlığı ilə rəfə düzür. Carrot bu göy qurşağını dadmaq qərarına gəlir və nəticəsi gözlənildiyindən də rəngli olur. Demək olar ki, sözsüz, səs effektləri ilə danışan beş səhifə.',
    access: 'free', price: null,
    storyPages: 5, pages: pages(5),
    pageSize: [1200, 1660], coverSize: [1100, 765],
    tone: '#6b4a2e',
    featured: true,
    source: { folder: 'ep02_Rainbow-potions', files: sourceUrl('ep02_Rainbow-potions'), page: pageUrl('en', 'ep02_Rainbow-potions'), published: '2014-07-25' },
    license: PC_LICENSE,
  },
  {
    slug: 'pepper-carrot-03',
    series: PC_SERIES, episode: 3,
    title: 'The Secret Ingredients',
    creator: PC_CREATOR,
    credits: [['Rəsm və ssenari', 'David Revoy'], ['İngiliscə mətn (orijinal)', 'David Revoy'], ['Korrektura', 'Amireeti, Alex Gryson']],
    language: 'en', languageNote: 'Orijinal ingiliscə versiya',
    genres: ['Macəra', 'Komediya'],
    year: 2014,
    synopsis: 'Komona bazarında Pepperin pulu səkkiz balqabaq-ulduza çatmır, rəqibi Saffron isə hər şeydən iki düjün sifariş verir. Sabah iksir yarışması olduğunu öyrənən Pepper Carrotla birlikdə qara buludlardan, perili cəngəllikdən və vulkanlar vadisindən tərkib toplamağa yollanır.',
    access: 'free', price: null,
    storyPages: 7, pages: pages(7),
    pageSize: [1200, 1660], coverSize: [1100, 765],
    tone: '#1f4c63',
    featured: true,
    source: { folder: 'ep03_The-secret-ingredients', files: sourceUrl('ep03_The-secret-ingredients'), page: pageUrl('en', 'ep03_The-secret-ingredients'), published: '2014-10-03' },
    license: { ...PC_LICENSE, note: 'Bölümün öz kredit səhifəsində o dövrdəki CC BY 3.0 göstərilir; müəllifin hazırkı lisenziya səhifəsi bütün komiksləri CC BY 4.0 ilə təqdim edir. Hər iki lisenziya istinadla kommersiya istifadəsinə icazə verir.' },
  },
  {
    slug: 'pepper-carrot-05',
    series: PC_SERIES, episode: 5,
    title: 'Special Holiday Episode',
    creator: PC_CREATOR,
    credits: [['Rəsm və ssenari', 'David Revoy'], ['Korrektura', 'Alex Gryson, Amireeti, Jihoon Kim']],
    language: 'none', languageNote: 'Sözsüz bölüm; yalnız bir ingiliscə təbrik yazısı var',
    genres: ['Bayram'],
    year: 2014,
    synopsis: 'Qarlı bayram günü: Pepper ilə Carrot qar adamı düzəldir, qarda yuvarlanır, sonra isti içki ilə qızınırlar. Son səhifə bütün hekayəni tamam başqa çərçivəyə salır. Dörd səhifəlik sözsüz bayram bölümü.',
    access: 'free', price: null,
    storyPages: 4, pages: pages(4),
    pageSize: [1200, 1660], coverSize: [1100, 765],
    tone: '#5d6b86',
    featured: false,
    source: { folder: 'ep05_Special-holiday-episode', files: sourceUrl('ep05_Special-holiday-episode'), page: pageUrl('en', 'ep05_Special-holiday-episode'), published: '2014-12-19' },
    license: PC_LICENSE,
  },
  {
    slug: 'pepper-carrot-06-ru',
    series: PC_SERIES, episode: 6,
    title: 'Конкурс зельеварения',
    titleNote: 'The Potion Contest',
    creator: PC_CREATOR,
    credits: [['Rəsm və ssenari', 'David Revoy'], ['Rusca tərcümə', 'Denis Prisukhin'], ['Mətn yoxlaması', 'Skybladev2, Denis Prisukhin'], ['Töhfə', 'Hồ Nhựt Châu']],
    language: 'ru', languageNote: 'Rusca icma tərcüməsi (Pepper&Carrot layihəsinin rəsmi tərcümə deposundan)',
    genres: ['Yarış', 'Komediya'],
    year: 2015,
    synopsis: 'Pepper Komona səmasında yuxudan oyanır: Carrot onu iksir yarışmasına özü gətirib. Şəhər başçısı dörd cadını — Coriander, Saffron, Shichimi və Pepperi — təqdim edir, qalibi isə alqış ölçən cihaz seçəcək. Doqquz səhifəlik bu nəşr rus dilindədir.',
    access: 'free', price: null,
    storyPages: 9, pages: pages(9),
    pageSize: [1200, 1660], coverSize: [1100, 765],
    tone: '#8a4f33',
    featured: false,
    source: { folder: 'ep06_The-Potion-Contest', files: sourceUrl('ep06_The-Potion-Contest'), page: pageUrl('ru', 'ep06_The-Potion-Contest'), published: '2015-03-28' },
    license: PC_LICENSE,
  },
  {
    slug: 'pepper-carrot-08',
    series: PC_SERIES, episode: 8,
    title: "Pepper's Birthday Party",
    creator: PC_CREATOR,
    credits: [['Rəsm və ssenari', 'David Revoy'], ['İngiliscə tərcümə', 'Alex Gryson']],
    language: 'en', languageNote: 'İngiliscə tərcümə (orijinal fransızca)',
    genres: ['Komediya'],
    year: 2015,
    synopsis: 'Ad günü yaxınlaşır, amma Pepperin onu birlikdə qeyd edəcək dostu yoxdur. Carrotun fikri ilə iksir yarışmasında tanış olduğu cadılara dəvət göndərir, süfrəni qurub gözləməyə başlayır.',
    access: 'sample', price: 6,
    storyPages: 6, previewPages: 2, pages: pages(2),
    pageSize: [1200, 1660], coverSize: [1100, 765],
    tone: '#7a5a2a',
    featured: false,
    source: { folder: 'ep08_Pepper-s-Birthday-Party', files: sourceUrl('ep08_Pepper-s-Birthday-Party'), page: pageUrl('en', 'ep08_Pepper-s-Birthday-Party'), published: '2015-06-28' },
    license: PC_LICENSE,
  },
  {
    slug: 'pepper-carrot-11',
    series: PC_SERIES, episode: 11,
    title: 'The Witches of Chaosah',
    creator: PC_CREATOR,
    credits: [['Rəsm və ssenari', 'David Revoy'], ['İngiliscə tərcümə', 'Alex Gryson'], ['Korrektura', 'Luke Bertot']],
    language: 'en', languageNote: 'İngiliscə tərcümə (orijinal fransızca)',
    genres: ['Fantastika', 'Dram'],
    year: 2015,
    synopsis: 'Pepperin xaç anaları — Chaosah cadıları Cayenne, Thyme və Cumin — onun qorxu salmaq əvəzinə hamıya çay və keks təklif etməsindən narazıdırlar. Pepperə ilk sınaq tapşırığı verilir: Acren-in gənc kralını qorxutmaq.',
    access: 'sample', price: 6,
    storyPages: 6, previewPages: 2, pages: pages(2),
    pageSize: [1200, 1660], coverSize: [1100, 765],
    tone: '#233a5e',
    featured: true,
    source: { folder: 'ep11_The-Witches-of-Chaosah', files: sourceUrl('ep11_The-Witches-of-Chaosah'), page: pageUrl('en', 'ep11_The-Witches-of-Chaosah'), published: '2015-09-30' },
    license: PC_LICENSE,
  },
  {
    slug: 'pepper-carrot-15',
    series: PC_SERIES, episode: 15,
    title: 'The Crystal Ball',
    creator: PC_CREATOR,
    credits: [['Rəsm və ssenari', 'David Revoy'], ['Korrektura', 'Rémi Rampin']],
    language: 'none', languageNote: 'Sözsüz bölüm',
    genres: ['Sirr', 'Komediya'],
    year: 2016,
    synopsis: 'Gecə meşəsində Pepper ilə Carrot mağarada büllur kürəyə baxan yaşlı bir cadını gizlicə izləyirlər. Cadı uçub gedəndə kürə onların əlinə keçir, kürənin göstərdikləri isə heç də gözlədikləri kimi deyil.',
    access: 'sample', price: 8,
    storyPages: 8, previewPages: 3, pages: pages(3),
    pageSize: [1200, 1660], coverSize: [1100, 765],
    tone: '#1d4a57',
    featured: false,
    source: { folder: 'ep15_The-Crystal-Ball', files: sourceUrl('ep15_The-Crystal-Ball'), page: pageUrl('en', 'ep15_The-Crystal-Ball'), published: '2016-03-25' },
    license: PC_LICENSE,
  },
];

export const bySlug = new Map(titles.map(t => [t.slug, t]));
export const coverSrc = (t, small = false) => `${ASSET_ROOT}/${t.slug}/${small ? 'cover-sm' : 'cover'}.webp`;
export const pageSrc = (t, file) => `${ASSET_ROOT}/${t.slug}/${file}`;
export const attribution = t => `“${t.title}” — ${t.series}, ${t.creator}, www.peppercarrot.com. ${t.license.name}. Luna-da WebP formatına çevrilib; kəsilməyib, dəyişdirilməyib.`;
export function whatsappUrl(t) {
  const text = `Salam! Luna Comics-də nümunə məhsul kimi göstərilən “${t.title}” (${t.series}, bölüm ${t.episode}) ilə maraqlanıram. Bu nəşr satışa çıxsa, məni xəbərdar edə bilərsiniz?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
