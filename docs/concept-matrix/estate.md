# Ünvan (estate) — concept matrix

## Previous problem
The showroom version was a headline, one generated photo, three generic listing cards and a decorative "map" of six dots on a gradient. No filters worked, the map did not correspond to anything, and nothing could be opened, compared or requested.

## Thesis
Ünvan is a flat and house search for Baku that reads like the documents people actually check before buying: a surveyor's district sheet and the floor plan from the technical passport. The search page *is* the first screen: buy/rent, district, rooms, price, area, floor and building filters on the left, results in the middle, and a schematic district map of Baku (Caspian shoreline, Baku Bay, approximate district parcels and metro stations, clearly captioned as schematic) whose pins are the listings themselves. Every listing opens to a dossier: photographs, key facts, price per m² computed from price and area, a floor plan drawn to scale whose room areas sum to the stated area, building facts in Baku vernacular (series, title deed/kupça, boiler/kombi heating), an indicative loan calculator with a user-chosen rate, and a viewing request.

- **Audience**: families and young professionals in Baku buying or renting a flat; they compare districts, price per m², floor and whether there is a title deed.
- **Primary task**: narrow a shortlist, see where each flat is, compare up to three and request a viewing.
- **Palette**: chalk paper `#F1F2EE`, survey ink `#1D2733`, Caspian `#2F6F7E`, parcel sage `#D9E1D6`, saffron pin `#E2A230` (selected/hovered), rent mode shifts the accent to Caspian.
- **Type**: Jost (vendored, latin-ext + Cyrillic) for everything; tabular figures for prices and areas; plan labels at small sizes in Jost 500.
- **Imagery**: CC0 interiors and buildings with daylight, unbranded, no people; grouped per listing so each listing has its own set. Owner-supplied generated exterior (`/assets/showroom/estate.webp`) used only for the one hillside new build, captioned as a generated image.
- **Composition**: three-zone search workspace (filters / list / sticky map) on desktop; on phone the filters become a sheet and list/map become a two-state toggle with the map as a full panel. Lower page: districts sheet with medians computed from the sample listings and metro stations.
- **Signature interaction**: list ↔ map sync — hovering/focusing a listing lifts its pin; pins are buttons (keyboard reachable) that select and scroll to the listing; the selected listing's district parcel is highlighted.
- **Not doing**: no real bank offers, no investment returns, no agent portraits, no testimonials.

## Content written
- 18 fictional listings (11 for sale, 7 to rent) across Səbail, Nəsimi, Yasamal, Nərimanov, Xətai and Binəqədi. Each has a room list from which area, room count, price per m² (price ÷ area, shown with the formula) and the floor plan are derived, so list, map, dossier and comparison always show the same numbers.
- Baku vernacular facts per listing: building series (Stalin-era, Khrushchev-era, Leningrad and Czech series, pre-1917 stone, new monolithic frame, sawn-limestone house), title deed (kupça) or contract only, combi boiler vs central heating, ceiling height, lifts, parking, nearest metro and walking minutes; rentals carry furnished/unfurnished and deposit months.
- Districts sheet: one row per district with a short factual character note, metro stations on the schematic, listing counts and medians (sale AZN/m², rent AZN/m² a month) computed from the sample listings and labelled as such.
- Runtime copy (validation, empty states, toasts, compare limit, demo notice) in az/ru/en, with Russian plural forms.

## Flow
Buy/rent switch → filters (district with live counts, rooms 1–4+, price and area ranges with min>max validation, not-ground/not-top floor, building type, renovated only, title deed or furnished) → removable chips, sort (newest, price up/down, price per m², area) and live count → list ↔ map: hovering or focusing a row lights its pin and district parcel; pins are focusable buttons (Tab; Enter/Space selects, Enter again opens) and selecting one marks the row and fills the map card → dossier (`#elan-u110`; Back/Escape close it, focus returns to the row): gallery with arrows/thumbnails, key facts, plan to scale with numbered legend and total, building table, indicative annuity calculator at a user-chosen rate (sale) or move-in cost (rent), viewing request → confirmation (demo, nothing sent; the row then shows the requested slot; cancellable). Save and compare up to 3 per mode with a tray; a 4th is refused with a message; the comparison table marks the lowest price per m². Saved-only view. District rows start a district search.

## States
Empty results (remove any active filter or reset), saved-only with nothing saved, invalid price/area range, viewing form errors (summary with links + inline messages, Azerbaijani mobile number check, date from tomorrow to +30 days, time slot), invalid loan rate, compare limit, listing without photos (plan shown instead, with a note).

## Verification (3 Nov 2026)
- `npm run build:web` and `npm test` (36/36) pass.
- Playwright on `dist/` (:4251): az 1440×900 and 390×844, ru 1440 and 390, en 1440 and 360 — no console errors, no horizontal overflow. Flow completed end to end (filter → pin → dossier → viewing request; compare 3, 4th refused); keyboard path through pins and dialog checked.
- Shots: `docs/concept-shots/estate-desktop.png`, `estate-mobile.png`, `estate-flow.png` (dossier with plan and sent request), `estate-state.png` (viewing form validation, phone). Preview `storefront/public/assets/previews/estate.jpg` (1280×800, ribbon removed).

## Photography
CC0 photos from the WordPress Photo Directory; provenance in `storefront/src/k/estate/assets.json`, selection in `scripts/concept-assets/selections/estate.json`. Openverse returned HTTP 500 during this session, so candidates were fetched from the WordPress Photo Directory REST API directly (same CC0 source) and cached in the pipeline's schema; ids are `wp-<photo id>` instead of Openverse ids. The Bayıl new build uses the owner-supplied generated image `/assets/showroom/estate.webp`, captioned in the gallery as generated, not a real building. A light CSS grade ties the set together.

## Open issues
- The CC0 pool of domestic interiors is thin: 4 of 18 listings have no photos (shown honestly as "no photos"); the set is coherent in grade rather than place, and none of it is Baku-specific.
- The map is a schematic of six districts: parcel shapes, station positions and coastline are approximate (captioned). Pins can cover station labels.
- Floor plans are generated from room areas (habitable band above, service band below): areas are exact, layouts simplified; some rooms are reached through a neighbouring room.
- On phones the map pans sideways inside its panel; there is no zoom.
- Viewing requests live in memory only (the page says so); saved/compare lists persist in localStorage.
