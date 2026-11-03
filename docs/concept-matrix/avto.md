# avto — Yolda (site)

## Thesis
Peer-to-peer car classifieds for people who scan hundreds of ads a day. Yolda is a working instrument, not a showroom: a dense list (or an even denser table), filters with live counts beside every option, sort, saved searches and a fast listing page where the phone number is one tap away. Nothing is inspected or certified, and the interface says so plainly; it gives the buyer the seller type, history fields and a report button instead.

## Previous problem
The old `showroom.js` block was a hero, three badge cards and a fake filter column with no behaviour; structurally identical to AutoLane.

## Audience and primary task
Private buyers and small dealers across Azerbaijan (Bakı, Gəncə, Sumqayıt, Mingəçevir, Şəki, Lənkəran, Quba). Task: set many filters quickly → scan the list → open a listing → reveal the phone → save the search or the ad; report a suspicious ad.

## Art direction
- Palette: white `#FFFFFF`, rule grey `#DADFE3`, ink `#1B2126`, muted `#5E6870`, road-sign green `#0B6E4F` (brand and links), signal yellow `#F4C430` (only for “today” and the price highlight), alert red `#B3261E` (report). Flat, no radius above 4px.
- Type: PT Sans 400/700 for text at 14–15px, Fira Sans Condensed 600 for titles and prices so long model names and numbers fit in narrow rows.
- Imagery: small 4:3 thumbnails of real CC0 photographs; some ads intentionally have no photo (realistic, and filterable by “with photo”).
- Composition: three-zone desktop app — top search bar, left filter column, result list. Mobile: filters become a full-height sheet behind a sticky “Filters (n)” bar.
- Signature: filter counts and the empty state that lists exactly which filter to drop and how many ads that would return.
- Deliberate contrast with AutoLane: density instead of air, list rows instead of cards, condensed type instead of a document grotesque, seller-provided data instead of inspection data.

## Content written
24 private and dealer listings with make, model, year, engine, km, gearbox, fuel, body, colour, city, posted date, views, credit/swap/VIN flags, seller name and type, description in the seller’s voice.

## Flow
Filters → results (list/table, sort, count) → listing (photos, characteristics, description, seller, show phone, similar ads) → favourite / save search / report.

## States
Zero results with “widen” suggestions; empty favourites and saved searches; report form validation and local confirmation.

## Imagery and provenance
15 CC0 WordPress Photo Directory photographs (`k/avto/assets.json`), 9 listings intentionally without photos. None of these photos is used in AutoLane. Many are older/classic cars, which fits a peer marketplace (Volga, 2CV, Beetle) but over-represents classics compared with a real Azerbaijani feed; the common modern cars (Prius, Camry, E 220, Accent) are the no-photo listings. The Pajero photo carries a small rental-company decal on the door.

## Verification (3 Nov 2026)
- Build and tests pass; Playwright az desktop/mobile, ru/en desktop/360 — no overflow, no console errors.
- Flows completed: Bakı + automatic + ≤30 000 → table view (4 ads); BMW + Gəncə + credit → empty state with “without BMW: 1”; listing → reveal phone → favourite; report dialog with “Other” + short comment → validation; cabriolet filter → save search → saved-search view with live count.
- Mobile: filters open as a full-screen sheet with a live “Show N ads” button.
- Deliverables: `docs/concept-shots/avto-{desktop,mobile,flow,state}.jpg`, preview `storefront/public/assets/previews/avto.jpg`.

## Open issues
- Phone numbers are generated from the ad number with the non-existent +994 00 prefix and labelled as samples.
- Posted times are relative to a fixed sample date (3 Nov 2026), not the visitor's clock.
