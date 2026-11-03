# SiteFilter (Chrome extension, Manifest V3)

Hides unwanted listings, sponsored posts and ad slots on marketplaces and any other site.
UI in English, Türkçe and Azərbaycanca (`_locales/`). Install page: `/apps/sitefilter/`.

## Features

- **Keywords per site and for every site.** `word` (case/accent-insensitive: `kirik` = `KIRIK`),
  `"word"` (whole word), `a & b` (all parts), `/regex/`.
- **Show-only mode:** keep only listings that match your words.
- **Price range:** reads prices like `18 500 AZN`, `₺1.250,50`, `$999`; listings without a price stay visible.
- **Sponsored / VIP / premium listings** by badge text (editable list) or class names.
- **Ad slots:** AdSense, GPT, Yandex RTB / AdFox, Taboola, Outbrain + per-site banners.
- **Element picker** (`Alt+Shift+X`): hide one listing (by link), one element or every element like it,
  or teach SiteFilter what a listing card looks like.
- **Right-click menu:** hide a listing link, hide listings containing the selected text.
- **Badge counter**, "show hidden" peek mode, fade-instead-of-remove, site on/off (`Alt+Shift+F`).
- **Infinite scroll / SPA aware** (MutationObserver), JSON export/import.
- Tuned card selectors for Tap.az, Turbo.az, Bina.az, Lalafo, Sahibinden, Arabam, Hepsiemlak, Emlakjet,
  Trendyol, Hepsiburada, N11, Letgo, OLX, Avito, Kolesa/Krisha, eBay, Amazon, AliExpress, Etsy,
  Facebook Marketplace, YouTube, Google. Other sites use automatic card detection
  (repeated sibling blocks that contain a link).

## Layout

| File | Role |
| --- | --- |
| `src/lib.js` | Settings schema, text normalisation, keyword compiler, price parser, matcher (shared, unit-tested) |
| `src/presets.js` | Per-site card / ad selectors and generic ad selectors |
| `src/content.js` | Card detection, hiding, observer, picker |
| `src/background.js` | Badge, context menu, keyboard commands |
| `src/popup.*`, `src/options.*`, `src/ui.css` | Toolbar popup and settings page |

## Develop

Load `extensions/sitefilter/` with **chrome://extensions → Developer mode → Load unpacked**.
Tests: `node --test tests/sitefilter.test.mjs`. Package: `node extensions/sitefilter/build.mjs [outDir]`
(`npm run build` puts `BAKHY-SiteFilter.zip` in `dist/downloads/`).

All data stays in `chrome.storage.local`; nothing is sent anywhere.
