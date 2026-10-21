# Kervan model kaynakları

Yeni karakter, hayvan ve tank dosyaları CC0 1.0 kapsamında kullanılır. Ticari kullanım,
değişiklik ve yeniden dağıtım mümkündür. Üretici adları ve kaynaklar korunmuştur.
Tam dosya listesi, kaynak sürümleri ve SHA-256 özetleri `manifest.json` ve
projedeki `scripts/people-sources.json` dosyalarındadır.

| Kaynak | Üretici | Dönüşüm |
| --- | --- | --- |
| https://kaylousberg.itch.io/kaykit-adventurers | Kay Lousberg | Resmî GitHub sürümü; bekleme pozu ve köşe paleti |
| https://kaylousberg.itch.io/kaykit-series-4 | Kay Lousberg | CC0 kamusal yeniden dağıtım; sabit poz |
| https://kaylousberg.itch.io/kaykit-series-5 | Kay Lousberg | CC0 kamusal yeniden dağıtım; sabit poz |
| https://quaternius.com/packs/toonshootergamekit.html | Quaternius | Üreticiden CC0 doğrulandı; sabit GitHub aynası; sabit poz |
| https://quaternius.com/packs/ultimateanimatedanimals.html | Quaternius | CC0; sabit GitHub aynası; sabit poz |
| https://kenney.nl/assets/mini-characters | Kenney | Resmî ZIP; köşe paleti |

KayKit Series 4/5 üreticinin mağazasında ücretli paketlerdir; dosyalar CC0 olarak kamusal
yeniden dağıtımdan edinilmiştir. Üreticiye ödeme/satın alma yapılmamıştır. Diğer paketlerin
üreticiden ücretsiz indirme seçenekleri vardır. Hiçbir model Kervan'ın özgün çizimi gibi sunulmaz.

Lisanslar 2026-10-21 tarihinde üretici sayfalarından kontrol edilmiştir. KayKit, Kenney ve
Quaternius hayvan kaynaklarının lisans metinleri bu klasörde tutulur. Toon Shooter kitinin
üretici sayfası da CC0 ve kişisel/ticari kullanımı açıkça belirtir.

İlk kütüphanedeki yurt/kerpiç modellerinin kaynağı Kervan'ın `scripts/build-art.mjs` dosyasıdır;
bu iki özgün model için üçüncü taraf CC0 iddiası yapılmaz.

## Genişleme setleri

- Modern şehir (33 model): https://kaylousberg.itch.io/city-builder-bits — CC0.
- Uzay üssü (57 model): https://kaylousberg.itch.io/space-base-bits — CC0.
- Silah/aksesuar (27 model): Adventurers resmî GitHub sürümü — CC0.
- 8 animasyon seti / 131 farklı Rig_Medium hareketi:
  https://kaylousberg.itch.io/kaykit-character-animations — CC0.

Animasyon dosyaları `public/animations` içinde, lisans ve kaynak özetleri kendi manifestindedir.
Tüm bu ek setlerin ücretsiz sürümleri kullanılmıştır; satın alma yapılmamıştır.

## Orta çağ ve sanayi genişlemesi — 2026-10-21

- 13 ek KayKit Medieval Hexagon modeli: kale, kilise, han, kışla, okçuluk alanı,
  su değirmeni, maden, iki kule, sur, kapı, ambar ve köprü.
  Üretici: https://kaylousberg.itch.io/kaykit-medieval-hexagon — CC0.
  Resmî kaynak sürümü: 84fa4e91af6a88989be7c99e0891cede11f2ca38.
  Önceden kullanılan 20 KayKit modeli bu sayıya tekrar dahil edilmez.
- 37 Kenney City Kit Industrial 2.0 modeli: 20 yapı, bacalar, tanklar, su kulesi,
  konteynerler, güneş panelleri ve türbinler.
  Üretici: https://kenney.nl/assets/city-kit-industrial — CC0.
  Arşiv URL: https://kenney.nl/media/pages/assets/city-kit-industrial/0ec35b139d-1788171848/kenney_city-kit-industrial_2.0.zip
  Arşiv ve kaynak GLB SHA256 değerleri manifestte, lisans LICENSE-Kenney-industrial.txt içindedir.

Yeniden üretim: `python scripts/import-periods.py --industrial-zip <arşiv>` ardından
`node scripts/optimize-periods.mjs` ve `node scripts/check-art.mjs --optimize`.
Paletler köşe renklerine çevrilir, dokular ve gereksiz teğetler kaldırılır;
kale 5000 üçgen bütçesine indirgenir. Toplam kütüphane 227 modeldir.


## Kervan özgün model ailesi — 2026-10-21

94 yeni GLB, `scripts/build-custom-models.mjs` içindeki düzenlenebilir geometri
kaynağından üretildi. Dışarıdan alınmış ticari model veya yeni üçüncü taraf paket
yoktur. Kaynak sahibi Kervan projesi; manifestte lisans `project source` olarak
ayrılır, bu varlıklara üçüncü taraf CC0 iddiası yapılmaz. Ortak dışa aktarıcı
`scripts/build-art.mjs` içinde; kaynak yolu GLB içine de yazılır.

İçerik: 31 üretim yapısı, 13 şehir yapısı, 6 kültürel konut, 7 deniz taşıtı,
8 kara taşıtı/birlik modeli, 6 insan, 14 harika, 8 doğa/ayrıntı ve 1 yay.
Her model ayrı siluet ve işlev ayrıntılarıyla üretilir; tek malzeme ve köşe
rengi kullanır, dış doku isteği yapmaz. Modeller statiktir; mevcut animasyonlu
insan/hayvan aileleri ayrıca kullanılmaya devam eder.

Yeniden üretim:
1. `npm run models:build`
2. `node scripts/check-art.mjs --optimize --prefix=custom-`
3. `node scripts/check-model-coverage.mjs --report`
4. `npm run assets:check`

Model eşlemeleri `src/ui/map/assetBindings.ts` içinde; 85 oyun türü eksiksizdir:
31 üretim, 13 şehir, 13 birlik, 14 ticaret taşıtı, 14 harika. Ayrıca 6 kültür
konutu ve 8 doğa/ayrıntı tipi kontrol edilir. Bu kapsam oyundaki nesne türlerini
ifade eder; 321 dosyanın tamamının aynı anda sahnede kullanıldığı anlamına gelmez.
Arazi, nehir, deniz, küre ve eğri yollar kendi düzenlenebilir ağlarını; sis,
duman, ateş ışığı ve dalgalanan sancaklar kendi dinamik çizimlerini korur.
`coverage.json` bu ayrımı ve her oyun nesnesinin kaynak/lisansını kaydeder.
