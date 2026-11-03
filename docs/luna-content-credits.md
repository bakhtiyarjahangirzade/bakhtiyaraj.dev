# Luna Comics — content credits and rights evidence

Checked on 3 November 2026. Every bundled image comes from the official Pepper&Carrot source tree and is listed below with its exact source URL and SHA-256 of the downloaded file. Re-run `python3 scripts/luna/import-peppercarrot.py` to reproduce the assets (it rewrites `scripts/luna/import-report.json`).

## Rights evidence (primary sources)

| Evidence | What it says | URL |
|---|---|---|
| Pepper&Carrot license page (author's site) | "Pepper&Carrot webcomics, translations and artworks are licensed under a Creative Commons Attribution 4.0 International license unless otherwise noted (eg. fan-arts). Copyright © David Revoy 2026, www.peppercarrot.com" | https://www.peppercarrot.com/en/license/index.html |
| Same page, per-episode credits | Art and scenario by David Revoy; English original/translation, proofreading and Russian translation credits per episode (copied below) | https://www.peppercarrot.com/en/license/index.html and https://www.peppercarrot.com/ru/license/index.html |
| CC BY 4.0 legal code | Permits sharing and adapting, including commercially, with attribution, a link to the license and an indication of changes | https://creativecommons.org/licenses/by/4.0/legalcode |
| Author statement, 8 Oct 2026 (updated 18 Oct 2026) | "AI derivation prohibited" asserted as a moral-right statement next to CC BY; explicitly acknowledges CC licenses are irrevocable | https://www.davidrevoy.com/article1178/license-update-ai-derivation-prohibited-on-all-my-art-lore-stories-and-comics |
| Episode 3 credit page (in the comic itself) | States "Creative Commons Attribution 3.0 Unported" (the license used when it was published in 2014). The author's current license page covers all webcomics under CC BY 4.0; both versions allow commercial redistribution with attribution | https://www.peppercarrot.com/en/webcomic/ep03_The-secret-ingredients.html |

**Why this is sufficient.** The permission comes from the copyright holder's own license statement for these exact works (the webcomic episodes, including translations), not from free availability or age. No fan-art, no MiniFantasyTheater strips (CC BY-SA) and no third-party characters are used.

**How Luna complies.**
- Attribution on every title page, inside the reader (colophon / end-of-preview leaf) and in the storefront footer: title, creator, translators/proofreaders, source link, license name and link.
- Changes indicated: "converted to WebP; not cropped or altered". Pages are re-encoded only (Pillow, quality 80, original 1200 px width); covers are re-encoded at 1100 px and 560 px. Luna's book jackets place the untouched cover file inside a frame; CSS never crops it (`object-fit: contain`).
- The author's "AI derivation prohibited" statement is respected: Luna does not generate, extend, translate or alter any art, story or dialogue. Synopses on the site are Luna's own short descriptive copy in Azerbaijani, labelled as descriptions; comic text stays in its original language. No AI-generated imagery of the characters is used anywhere in the Luna identity.
- Sample paid products only bundle their preview pages, and the UI states that the full episode is free at the source under CC BY 4.0.

## Fonts

| Font | License | Source in repo |
|---|---|---|
| Young Serif | SIL OFL 1.1 (`storefront/public/Luna/fonts/young-serif-OFL.txt`) | copied from `storefront/public/assets/k/fonts/young-serif/` |
| Commissioner | SIL OFL 1.1 (`storefront/public/Luna/fonts/commissioner-OFL.txt`) | copied from `storefront/public/assets/k/fonts/commissioner/` |

## Titles

### Pepper&Carrot — Episode 1: The Potion of Flight

- Slug: `pepper-carrot-01` — assets: `storefront/public/Luna/comics/pepper-carrot-01/`
- Creator: David Revoy. Rəsm və ssenari: David Revoy; İngiliscə mətn (orijinal): David Revoy; Korrektura: Amireeti, Alex Gryson
- Edition: official Pepper&Carrot low-res export, language `en` (Orijinal ingiliscə versiya); first published 2014-05-10
- Episode page: https://www.peppercarrot.com/en/webcomic/ep01_Potion-of-Flight.html
- Source folder: https://www.peppercarrot.com/0_sources/ep01_Potion-of-Flight/low-res/
- License: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/); evidence https://www.peppercarrot.com/en/license/index.html
- Required attribution (as shown in Luna): "The Potion of Flight" — Pepper&Carrot, David Revoy, www.peppercarrot.com. CC BY 4.0. Converted to WebP; not cropped or altered.
- Access in Luna: free, all 3 story pages bundled

| File | Source URL | SHA-256 of source (first 16 hex; full hash in scripts/luna/import-report.json) |
|---|---|---|
| `pepper-carrot-01/cover.webp`, `pepper-carrot-01/cover-sm.webp` | https://www.peppercarrot.com/0_sources/ep01_Potion-of-Flight/low-res/en_Pepper-and-Carrot_by-David-Revoy_E01.jpg | `4cb56c76a4537d81…` |
| `pepper-carrot-01/p01.webp` | https://www.peppercarrot.com/0_sources/ep01_Potion-of-Flight/low-res/en_Pepper-and-Carrot_by-David-Revoy_E01P01.jpg | `f1de30872ce216b4…` |
| `pepper-carrot-01/p02.webp` | https://www.peppercarrot.com/0_sources/ep01_Potion-of-Flight/low-res/en_Pepper-and-Carrot_by-David-Revoy_E01P02.jpg | `7696832a48b3cd75…` |
| `pepper-carrot-01/p03.webp` | https://www.peppercarrot.com/0_sources/ep01_Potion-of-Flight/low-res/en_Pepper-and-Carrot_by-David-Revoy_E01P03.jpg | `2555dff43af17bf0…` |

### Pepper&Carrot — Episode 2: Rainbow Potions

- Slug: `pepper-carrot-02` — assets: `storefront/public/Luna/comics/pepper-carrot-02/`
- Creator: David Revoy. Rəsm və ssenari: David Revoy; İngiliscə mətn (orijinal): David Revoy; Korrektura: Amireeti, Alex Gryson
- Edition: official Pepper&Carrot low-res export, language `en` (Orijinal ingiliscə versiya; mətn əsasən səs effektləri və etiketlərdir); first published 2014-07-25
- Episode page: https://www.peppercarrot.com/en/webcomic/ep02_Rainbow-potions.html
- Source folder: https://www.peppercarrot.com/0_sources/ep02_Rainbow-potions/low-res/
- License: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/); evidence https://www.peppercarrot.com/en/license/index.html
- Required attribution (as shown in Luna): "Rainbow Potions" — Pepper&Carrot, David Revoy, www.peppercarrot.com. CC BY 4.0. Converted to WebP; not cropped or altered.
- Access in Luna: free, all 5 story pages bundled

| File | Source URL | SHA-256 of source (first 16 hex; full hash in scripts/luna/import-report.json) |
|---|---|---|
| `pepper-carrot-02/cover.webp`, `pepper-carrot-02/cover-sm.webp` | https://www.peppercarrot.com/0_sources/ep02_Rainbow-potions/low-res/en_Pepper-and-Carrot_by-David-Revoy_E02.jpg | `ab761e60c0feb754…` |
| `pepper-carrot-02/p01.webp` | https://www.peppercarrot.com/0_sources/ep02_Rainbow-potions/low-res/en_Pepper-and-Carrot_by-David-Revoy_E02P01.jpg | `9b011d958fdf514c…` |
| `pepper-carrot-02/p02.webp` | https://www.peppercarrot.com/0_sources/ep02_Rainbow-potions/low-res/en_Pepper-and-Carrot_by-David-Revoy_E02P02.jpg | `48da4890d7b1a2ca…` |
| `pepper-carrot-02/p03.webp` | https://www.peppercarrot.com/0_sources/ep02_Rainbow-potions/low-res/en_Pepper-and-Carrot_by-David-Revoy_E02P03.jpg | `b75ed25f427bb863…` |
| `pepper-carrot-02/p04.webp` | https://www.peppercarrot.com/0_sources/ep02_Rainbow-potions/low-res/en_Pepper-and-Carrot_by-David-Revoy_E02P04.jpg | `905bb566c3f7523f…` |
| `pepper-carrot-02/p05.webp` | https://www.peppercarrot.com/0_sources/ep02_Rainbow-potions/low-res/en_Pepper-and-Carrot_by-David-Revoy_E02P05.jpg | `7c8db22f79ac33f5…` |

### Pepper&Carrot — Episode 3: The Secret Ingredients

- Slug: `pepper-carrot-03` — assets: `storefront/public/Luna/comics/pepper-carrot-03/`
- Creator: David Revoy. Rəsm və ssenari: David Revoy; İngiliscə mətn (orijinal): David Revoy; Korrektura: Amireeti, Alex Gryson
- Edition: official Pepper&Carrot low-res export, language `en` (Orijinal ingiliscə versiya); first published 2014-10-03
- Episode page: https://www.peppercarrot.com/en/webcomic/ep03_The-secret-ingredients.html
- Source folder: https://www.peppercarrot.com/0_sources/ep03_The-secret-ingredients/low-res/
- License: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/); evidence https://www.peppercarrot.com/en/license/index.html
- Required attribution (as shown in Luna): "The Secret Ingredients" — Pepper&Carrot, David Revoy, www.peppercarrot.com. CC BY 4.0. Converted to WebP; not cropped or altered.
- Access in Luna: free, all 7 story pages bundled

| File | Source URL | SHA-256 of source (first 16 hex; full hash in scripts/luna/import-report.json) |
|---|---|---|
| `pepper-carrot-03/cover.webp`, `pepper-carrot-03/cover-sm.webp` | https://www.peppercarrot.com/0_sources/ep03_The-secret-ingredients/low-res/en_Pepper-and-Carrot_by-David-Revoy_E03.jpg | `65a98b160cca9282…` |
| `pepper-carrot-03/p01.webp` | https://www.peppercarrot.com/0_sources/ep03_The-secret-ingredients/low-res/en_Pepper-and-Carrot_by-David-Revoy_E03P01.jpg | `9e75470c8065b95e…` |
| `pepper-carrot-03/p02.webp` | https://www.peppercarrot.com/0_sources/ep03_The-secret-ingredients/low-res/en_Pepper-and-Carrot_by-David-Revoy_E03P02.jpg | `d24b44d0e6cb84f9…` |
| `pepper-carrot-03/p03.webp` | https://www.peppercarrot.com/0_sources/ep03_The-secret-ingredients/low-res/en_Pepper-and-Carrot_by-David-Revoy_E03P03.jpg | `c09c64ea47e2b831…` |
| `pepper-carrot-03/p04.webp` | https://www.peppercarrot.com/0_sources/ep03_The-secret-ingredients/low-res/en_Pepper-and-Carrot_by-David-Revoy_E03P04.jpg | `731c0a31f7e12825…` |
| `pepper-carrot-03/p05.webp` | https://www.peppercarrot.com/0_sources/ep03_The-secret-ingredients/low-res/en_Pepper-and-Carrot_by-David-Revoy_E03P05.jpg | `d57d1b0a3ac7d502…` |
| `pepper-carrot-03/p06.webp` | https://www.peppercarrot.com/0_sources/ep03_The-secret-ingredients/low-res/en_Pepper-and-Carrot_by-David-Revoy_E03P06.jpg | `afb134171c8abbe8…` |
| `pepper-carrot-03/p07.webp` | https://www.peppercarrot.com/0_sources/ep03_The-secret-ingredients/low-res/en_Pepper-and-Carrot_by-David-Revoy_E03P07.jpg | `b1f514daa5606bfc…` |

### Pepper&Carrot — Episode 5: Special Holiday Episode

- Slug: `pepper-carrot-05` — assets: `storefront/public/Luna/comics/pepper-carrot-05/`
- Creator: David Revoy. Rəsm və ssenari: David Revoy; Korrektura: Alex Gryson, Amireeti, Jihoon Kim
- Edition: official Pepper&Carrot low-res export, language `en` (Sözsüz bölüm; yalnız bir ingiliscə təbrik yazısı var); first published 2014-12-19
- Episode page: https://www.peppercarrot.com/en/webcomic/ep05_Special-holiday-episode.html
- Source folder: https://www.peppercarrot.com/0_sources/ep05_Special-holiday-episode/low-res/
- License: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/); evidence https://www.peppercarrot.com/en/license/index.html
- Required attribution (as shown in Luna): "Special Holiday Episode" — Pepper&Carrot, David Revoy, www.peppercarrot.com. CC BY 4.0. Converted to WebP; not cropped or altered.
- Access in Luna: free, all 4 story pages bundled

| File | Source URL | SHA-256 of source (first 16 hex; full hash in scripts/luna/import-report.json) |
|---|---|---|
| `pepper-carrot-05/cover.webp`, `pepper-carrot-05/cover-sm.webp` | https://www.peppercarrot.com/0_sources/ep05_Special-holiday-episode/low-res/en_Pepper-and-Carrot_by-David-Revoy_E05.jpg | `aa58e7709f169e60…` |
| `pepper-carrot-05/p01.webp` | https://www.peppercarrot.com/0_sources/ep05_Special-holiday-episode/low-res/en_Pepper-and-Carrot_by-David-Revoy_E05P01.jpg | `24689c89fe16afee…` |
| `pepper-carrot-05/p02.webp` | https://www.peppercarrot.com/0_sources/ep05_Special-holiday-episode/low-res/en_Pepper-and-Carrot_by-David-Revoy_E05P02.jpg | `8b0f5e2654f1aeeb…` |
| `pepper-carrot-05/p03.webp` | https://www.peppercarrot.com/0_sources/ep05_Special-holiday-episode/low-res/en_Pepper-and-Carrot_by-David-Revoy_E05P03.jpg | `8e0ac628a28b0df6…` |
| `pepper-carrot-05/p04.webp` | https://www.peppercarrot.com/0_sources/ep05_Special-holiday-episode/low-res/en_Pepper-and-Carrot_by-David-Revoy_E05P04.jpg | `e56f35a76ed7953c…` |

### Pepper&Carrot — Episode 6: Конкурс зельеварения (The Potion Contest)

- Slug: `pepper-carrot-06-ru` — assets: `storefront/public/Luna/comics/pepper-carrot-06-ru/`
- Creator: David Revoy. Rəsm və ssenari: David Revoy; Rusca tərcümə: Denis Prisukhin; Mətn yoxlaması: Skybladev2, Denis Prisukhin; Töhfə: Hồ Nhựt Châu
- Edition: official Pepper&Carrot low-res export, language `ru` (Rusca icma tərcüməsi (Pepper&Carrot layihəsinin rəsmi tərcümə deposundan)); first published 2015-03-28
- Episode page: https://www.peppercarrot.com/ru/webcomic/ep06_The-Potion-Contest.html
- Source folder: https://www.peppercarrot.com/0_sources/ep06_The-Potion-Contest/low-res/
- License: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/); evidence https://www.peppercarrot.com/en/license/index.html
- Required attribution (as shown in Luna): "Конкурс зельеварения" — Pepper&Carrot, David Revoy, www.peppercarrot.com. CC BY 4.0. Converted to WebP; not cropped or altered.
- Access in Luna: free, all 9 story pages bundled

| File | Source URL | SHA-256 of source (first 16 hex; full hash in scripts/luna/import-report.json) |
|---|---|---|
| `pepper-carrot-06-ru/cover.webp`, `pepper-carrot-06-ru/cover-sm.webp` | https://www.peppercarrot.com/0_sources/ep06_The-Potion-Contest/low-res/ru_Pepper-and-Carrot_by-David-Revoy_E06.jpg | `8280bdd833135c63…` |
| `pepper-carrot-06-ru/p01.webp` | https://www.peppercarrot.com/0_sources/ep06_The-Potion-Contest/low-res/ru_Pepper-and-Carrot_by-David-Revoy_E06P01.jpg | `9e7ae68e3461b2cf…` |
| `pepper-carrot-06-ru/p02.webp` | https://www.peppercarrot.com/0_sources/ep06_The-Potion-Contest/low-res/ru_Pepper-and-Carrot_by-David-Revoy_E06P02.jpg | `c556bb70fde05278…` |
| `pepper-carrot-06-ru/p03.webp` | https://www.peppercarrot.com/0_sources/ep06_The-Potion-Contest/low-res/ru_Pepper-and-Carrot_by-David-Revoy_E06P03.jpg | `5ba25d6c64048a73…` |
| `pepper-carrot-06-ru/p04.webp` | https://www.peppercarrot.com/0_sources/ep06_The-Potion-Contest/low-res/ru_Pepper-and-Carrot_by-David-Revoy_E06P04.jpg | `2b341c06445ebd7e…` |
| `pepper-carrot-06-ru/p05.webp` | https://www.peppercarrot.com/0_sources/ep06_The-Potion-Contest/low-res/ru_Pepper-and-Carrot_by-David-Revoy_E06P05.jpg | `7e5c5ed50b12e6fe…` |
| `pepper-carrot-06-ru/p06.webp` | https://www.peppercarrot.com/0_sources/ep06_The-Potion-Contest/low-res/ru_Pepper-and-Carrot_by-David-Revoy_E06P06.jpg | `5e3aa85537199aa4…` |
| `pepper-carrot-06-ru/p07.webp` | https://www.peppercarrot.com/0_sources/ep06_The-Potion-Contest/low-res/ru_Pepper-and-Carrot_by-David-Revoy_E06P07.jpg | `1b0d8a6d9ffe48b2…` |
| `pepper-carrot-06-ru/p08.webp` | https://www.peppercarrot.com/0_sources/ep06_The-Potion-Contest/low-res/ru_Pepper-and-Carrot_by-David-Revoy_E06P08.jpg | `81e7962b8dfc2072…` |
| `pepper-carrot-06-ru/p09.webp` | https://www.peppercarrot.com/0_sources/ep06_The-Potion-Contest/low-res/ru_Pepper-and-Carrot_by-David-Revoy_E06P09.jpg | `02aadff5799a31c7…` |

### Pepper&Carrot — Episode 8: Pepper's Birthday Party

- Slug: `pepper-carrot-08` — assets: `storefront/public/Luna/comics/pepper-carrot-08/`
- Creator: David Revoy. Rəsm və ssenari: David Revoy; İngiliscə tərcümə: Alex Gryson
- Edition: official Pepper&Carrot low-res export, language `en` (İngiliscə tərcümə (orijinal fransızca)); first published 2015-06-28
- Episode page: https://www.peppercarrot.com/en/webcomic/ep08_Pepper-s-Birthday-Party.html
- Source folder: https://www.peppercarrot.com/0_sources/ep08_Pepper-s-Birthday-Party/low-res/
- License: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/); evidence https://www.peppercarrot.com/en/license/index.html
- Required attribution (as shown in Luna): "Pepper's Birthday Party" — Pepper&Carrot, David Revoy, www.peppercarrot.com. CC BY 4.0. Converted to WebP; not cropped or altered.
- Access in Luna: sample paid product (illustrative 6 AZN, not for sale); only the first 2 of 6 pages bundled

| File | Source URL | SHA-256 of source (first 16 hex; full hash in scripts/luna/import-report.json) |
|---|---|---|
| `pepper-carrot-08/cover.webp`, `pepper-carrot-08/cover-sm.webp` | https://www.peppercarrot.com/0_sources/ep08_Pepper-s-Birthday-Party/low-res/en_Pepper-and-Carrot_by-David-Revoy_E08.jpg | `a6a5480a47ee372f…` |
| `pepper-carrot-08/p01.webp` | https://www.peppercarrot.com/0_sources/ep08_Pepper-s-Birthday-Party/low-res/en_Pepper-and-Carrot_by-David-Revoy_E08P01.jpg | `941909c20671544f…` |
| `pepper-carrot-08/p02.webp` | https://www.peppercarrot.com/0_sources/ep08_Pepper-s-Birthday-Party/low-res/en_Pepper-and-Carrot_by-David-Revoy_E08P02.jpg | `3b827a2c230240a7…` |

### Pepper&Carrot — Episode 11: The Witches of Chaosah

- Slug: `pepper-carrot-11` — assets: `storefront/public/Luna/comics/pepper-carrot-11/`
- Creator: David Revoy. Rəsm və ssenari: David Revoy; İngiliscə tərcümə: Alex Gryson; Korrektura: Luke Bertot
- Edition: official Pepper&Carrot low-res export, language `en` (İngiliscə tərcümə (orijinal fransızca)); first published 2015-09-30
- Episode page: https://www.peppercarrot.com/en/webcomic/ep11_The-Witches-of-Chaosah.html
- Source folder: https://www.peppercarrot.com/0_sources/ep11_The-Witches-of-Chaosah/low-res/
- License: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/); evidence https://www.peppercarrot.com/en/license/index.html
- Required attribution (as shown in Luna): "The Witches of Chaosah" — Pepper&Carrot, David Revoy, www.peppercarrot.com. CC BY 4.0. Converted to WebP; not cropped or altered.
- Access in Luna: sample paid product (illustrative 6 AZN, not for sale); only the first 2 of 6 pages bundled

| File | Source URL | SHA-256 of source (first 16 hex; full hash in scripts/luna/import-report.json) |
|---|---|---|
| `pepper-carrot-11/cover.webp`, `pepper-carrot-11/cover-sm.webp` | https://www.peppercarrot.com/0_sources/ep11_The-Witches-of-Chaosah/low-res/en_Pepper-and-Carrot_by-David-Revoy_E11.jpg | `1411423a905f37fc…` |
| `pepper-carrot-11/p01.webp` | https://www.peppercarrot.com/0_sources/ep11_The-Witches-of-Chaosah/low-res/en_Pepper-and-Carrot_by-David-Revoy_E11P01.jpg | `b3a1a181fcf50aac…` |
| `pepper-carrot-11/p02.webp` | https://www.peppercarrot.com/0_sources/ep11_The-Witches-of-Chaosah/low-res/en_Pepper-and-Carrot_by-David-Revoy_E11P02.jpg | `06e4585d91886bf0…` |

### Pepper&Carrot — Episode 15: The Crystal Ball

- Slug: `pepper-carrot-15` — assets: `storefront/public/Luna/comics/pepper-carrot-15/`
- Creator: David Revoy. Rəsm və ssenari: David Revoy; Korrektura: Rémi Rampin
- Edition: official Pepper&Carrot low-res export, language `en` (Sözsüz bölüm); first published 2016-03-25
- Episode page: https://www.peppercarrot.com/en/webcomic/ep15_The-Crystal-Ball.html
- Source folder: https://www.peppercarrot.com/0_sources/ep15_The-Crystal-Ball/low-res/
- License: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/); evidence https://www.peppercarrot.com/en/license/index.html
- Required attribution (as shown in Luna): "The Crystal Ball" — Pepper&Carrot, David Revoy, www.peppercarrot.com. CC BY 4.0. Converted to WebP; not cropped or altered.
- Access in Luna: sample paid product (illustrative 8 AZN, not for sale); only the first 3 of 8 pages bundled

| File | Source URL | SHA-256 of source (first 16 hex; full hash in scripts/luna/import-report.json) |
|---|---|---|
| `pepper-carrot-15/cover.webp`, `pepper-carrot-15/cover-sm.webp` | https://www.peppercarrot.com/0_sources/ep15_The-Crystal-Ball/low-res/en_Pepper-and-Carrot_by-David-Revoy_E15.jpg | `afd57dfe501f9516…` |
| `pepper-carrot-15/p01.webp` | https://www.peppercarrot.com/0_sources/ep15_The-Crystal-Ball/low-res/en_Pepper-and-Carrot_by-David-Revoy_E15P01.jpg | `e0cf578fa2a791c1…` |
| `pepper-carrot-15/p02.webp` | https://www.peppercarrot.com/0_sources/ep15_The-Crystal-Ball/low-res/en_Pepper-and-Carrot_by-David-Revoy_E15P02.jpg | `5c6dcb34bed79873…` |
| `pepper-carrot-15/p03.webp` | https://www.peppercarrot.com/0_sources/ep15_The-Crystal-Ball/low-res/en_Pepper-and-Carrot_by-David-Revoy_E15P03.jpg | `700998abbb8c3bc4…` |
