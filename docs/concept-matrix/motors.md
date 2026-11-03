# motors — AutoLane (site)

## Thesis
A dealer-grade used-car marketplace where the inspection report is the product. Every listing carries the same 120-point check, and the page is built like a calm technical document: the buyer reads what passed, what needs attention soon and what it costs, before they ever ask for a viewing. Trust comes from measurements (tread depth, pad thickness, battery health), not from adjectives.

## Previous problem
`showroom.js` rendered a static hero, four inert filter boxes with “—”, and three cards whose “photos” were CSS gradients. Same skeleton as Yolda and Bazarlıq with a different colour; no flow.

## Audience and primary task
Buyers in Bakı and Gəncə who want a used car without a mechanic friend. Task: narrow the stock by make, model, year, price, mileage, fuel and gearbox → open a car → read its inspection report → check an indicative monthly payment → compare up to three → save or request a viewing.

## Art direction
- Palette: report paper `#EEF1F3`, panel white `#FFFFFF`, ink `#15222E`, steel `#5B6B78`, lane blue `#1F5FAF` (actions), pass `#2E7A57`, advisory amber `#B7791F`. No gradients, no shadows beyond one hairline elevation for the sticky tray.
- Type: Commissioner Variable only. Display at 600 with tight tracking; data at 500 with tabular numerals; captions 400. One family, used as a document system.
- Imagery: one studio-lit crossover (owner-supplied generated image) in the hero; real CC0 photographs for the stock, each gallery made from crops of that car’s own photo so the gallery never shows a different car.
- Composition: left-aligned two-column documents. The search form is the hero’s main object; results are a three-column spec grid; detail is a two-column report with a sticky price/finance column.
- Signature: the inspection strip — six segments (body, tyres & brakes, engine & gearbox, electrics, interior, road test) on every card and expanded into a full itemised report with measurements and advisory notes on the detail page.

## Content written
12 cars (make, model, trim, year, km, fuel, gearbox, engine, power, drive, consumption, owners, colour, hub city, price, inspection date and per-system results with notes). Six-system checklist with named items. Finance copy is explicitly indicative with a user-chosen rate, deposit and term, no lender named.

## Flow
Search → results (live count in the search button, sort, removable filter chips) → detail (gallery, spec sheet, report, calculator, viewing request with validation) → compare (≤3, best value per row marked) → saved list.

## States
Empty results with one-click widen; compare limit message; compare with <2 cars; empty saved; viewing request validation; confirmation stating nothing was sent.

## Imagery and provenance
- Hero / Chery Tiggo 7 Pro listing: `/assets/showroom/motors.webp`, an owner-supplied generated image (ChatGPT, original prompt, no brand or text), used directly at 1200×900.
- 11 stock cars and 2 inspection photos: CC0 WordPress Photo Directory photographs (`k/motors/assets.json`, credits in the footer). Each car's gallery is two crops of its own photograph, so the gallery never shows a different car. Makes/models were assigned to match the body type in each photo; some photos show a near-identical model rather than the exact one named (e.g. the "Hyundai Tucson" photo shows a similar compact SUV). Fetched through the WordPress Photo Directory REST API by tag (`car`) because Openverse returned 500/504 during this session.

## Verification (3 Nov 2026)
- `npm run build:web`, `npm test` (36 pass).
- Playwright against `dist/`: az desktop 1440×900 and mobile 390×844; ru/en at 1440 and 360 — no horizontal overflow, no console errors.
- Flows completed: make filter → submit → card → detail (rate changed to 12.5 %, term 48) → report; three cars ticked → compare tray → compare table; Land Rover + ≤30 000 AZN → empty state with widen buttons; viewing request validation and demo confirmation.
- Deliverables: `docs/concept-shots/motors-{desktop,mobile,flow,state}.jpg`, preview `storefront/public/assets/previews/motors.jpg`.

## Open issues
- Make/model labels are approximations of what the CC0 photos show.
- Saved/compare live in localStorage only (by design for the demo).
- Detail view is hash-routed inside one page; there is no per-car URL beyond `#car/<id>`.
