# Growly (wealth) — goal-based savings planner, kind `app`

## Previous problem
Showroom reskin: hero with a ChatGPT render of a phone with glowing coins and a decorative rising line, three numbered feature cards and a disclaimer. Nothing could be calculated; the "chart" was art.

## Thesis
A calm working instrument, not a fintech advert. The first screen *is* the planner: one goal, its numbers, and a chart drawn from those numbers. Growly is presented as a planner that never holds money, so the honest copy (rates are assumptions, inflation, fees, deposit-insurance limits) is part of the product, not a footer apology.

- Audience: salaried people in Azerbaijan saving in AZN for a concrete goal (a flat deposit, tuition, an emergency fund).
- Primary task: "How much do I need to put aside each month to reach X AZN by date Y, and what if I change one thing?"

## Art direction
- Palette: sage paper `#EEF1EC`, sheet white `#FCFCFB`, graphite ink `#17201B`, contribution green `#0E8A5F`, assumed-growth amber `#B8620F` (validated pair with the dataviz validator: CVD ΔE 8.8, both ≥3:1 on the sheet), muted rule `#C9D1C7`, warning brick `#A63A28`.
- Type: Golos Text only (Cyrillic + Azerbaijani glyphs). Tabular figures for every amount. Large figures are set in weight 600 at 40–56px; labels are sentence case, 13px secondary ink. No all-caps eyebrows.
- Imagery: none. A planner earns trust with numbers, and stock coins/phones are the cliché being removed. The owner-supplied render is intentionally not used.
- Composition: app shell. Desktop 1440: left rail of goals, centre chart + month table, right column of inputs and the "what-if" panel. Mobile: one phone column with a bottom tab bar (Goals / Plan / Table / How it works) and sticky required-monthly readout.

## Signature interaction
Editing any input recalculates the month-by-month projection: stacked area (own contributions vs assumed growth), a horizontal goal line, a dashed what-if line, crosshair tooltip on hover/keyboard (arrow keys move the month), and the headline sentence "To reach 20 000 AZN by June 2029 you need 412 AZN a month" — all from the same function.

## Content
Three sample goals with internally consistent numbers; formula explained in plain words; fees and risks section (inflation, rate changes, early-withdrawal penalties, investment products can lose value, deposit insurance limits — check the bank's terms); disclaimer "hypothetical calculation, not advice, returns are not guaranteed" next to the chart, not hidden.

## Flow
Pick or create a goal → set target, date, current savings, monthly contribution, assumed rate (0–10 %, default 3 %) → read required monthly, shortfall/surplus, month goal is reached → what-if (extra per month / different rate) → save goal (local state, says so) → delete → empty state.

## States
Validation (target ≤ current, past date, rate out of range, empty fields) with field messages and a disabled chart summary; empty goal list; goal already reached; zero rate.

## Verification
- Built (`npm run build:web`), `npm test` green (36/36). Served `dist/` and checked with Playwright: az desktop 1440×900 and mobile 390×844, ru desktop flow, en spot check. No console errors, no horizontal overflow (scrollWidth = innerWidth).
- Flow verified: switch goal → edit monthly/rate/inflation/what-if → save (toast "saved — on this page only, demo") → chart tooltip by pointer and by keyboard (focus chart, arrows/PageUp/PageDown/Home/End). Delete all goals → empty state with "Create your first goal".
- States verified: empty target, past date and rate 14 % show field messages and blank the chart/stats (`wealth-state.jpg`); empty goal list (`wealth-empty.jpg`).
- Chart colours validated with the dataviz palette validator (green/amber pair passes CVD and contrast); legend + direct goal label + table view.
- Shots: `docs/concept-shots/wealth-{desktop,mobile,flow,state,empty}.jpg`; preview `storefront/public/assets/previews/wealth.jpg`.

## Imagery and provenance
No photographs. The owner-supplied generated render (`/assets/showroom/wealth.webp`, phone with coins) was deliberately not used: it shows a decorative rising chart, the cliché being removed.

## Open issues
- Number grouping follows Intl `az-AZ` data (Chromium prints `24,000`). A real product should pin one grouping style for Azerbaijani.
- Saved goals live in memory only and are lost on reload (by design, stated in the toast).
- Runtime month names are nominative, so RU sentences are phrased around "срок — …"/"к сроку (…)" to stay grammatical; a real product would use genitive date formats.
- Contributions are modelled at month end with a constant rate; no fees/taxes unless the visitor lowers the rate (explained in "How it works").
