# flow — Flow CRM (kind: app)

## Thesis
Flow CRM as configured for **Nar Catering**, a fictional Baku company that sells corporate lunch contracts and event catering to offices. The CRM is not a generic "contacts + kanban": its pipeline has a catering-specific *Dequstasiya* (tasting) stage, and every deal value is computed from the two numbers the sales team actually negotiates — headcount and portion price (daily contract: people × portion × 21 working days × months; event: guests × price per guest). A four-person team works the board; the page is a dense, cool, paper-and-navy operating tool, the opposite of a landing page.

| | |
|---|---|
| Previous problem | Three placeholder columns ("Müştəri A…E"), generic feature cards, no interaction. |
| Audience | A B2B sales lead deciding whether a custom CRM fits their process. |
| Primary task | Move a deal through stages, see the pipeline totals react, log the next step. |
| Palette | canvas #e6eaf0, frame #f7f9fb, lane #edf1f5, ink #15223a, navy #2b4a7e (stage value bars), pomegranate #a3243a (brand mark + primary action only), late #b3261e, won #1f6f4f. |
| Type | IBM Plex Sans (vendored, Cyrillic + latin-ext), tabular numerals for all money. |
| Imagery | None — a working tool; the only graphics are stage value bars (single series, SVG, labelled in text). |
| Composition | Short type-led intro (who it is for, what to try) → app frame: toolbar (workspace, search, new deal) → owner chips + "show lost" → 4-figure summary strip → 5/6-column board → lower "how this setup works" (6 stage entry rules, value formula with the largest live deal as worked example). |
| Signature interaction | Stage change (drawer select, or drag between columns with a mouse) updates column count/sum/bar, open/weighted/signed totals, owner chip counts and the activity timeline at once. |
| Content | 24 deals, 24 fictional Baku companies, Azerbaijani contact names, 4 owners, 10 next-step templates, 3 loss reasons, per-stage generated activity history, phone numbers; all az/ru/en. |
| Flow | Open card (keyboard Enter) → change stage → add note → schedule next step (date ≥ today) → Esc returns focus to the card. New deal dialog: company/contact/phone/type/headcount/price/term/owner with live value preview, inline + summary validation, duplicate-open-deal check → card appears in Inquiry and is focused. Losing a deal requires a reason. |
| States | Empty search (with clear action), empty column, overdue next step (red, counted in summary), validation in dialog and in drawer, lost column toggle, toast for every change ("demo, data lives only on this page"). |
| Verified | 1440×900 and 390×844 az, ru (flow re-run), 360px no overflow (az/ru, drawer open); console clean; totals reconcile (e.g. Kaspi 77 805 AZN moved 50%→70% adds 15 561 to weighted; new 150 × 8,20 × 21 × 12 = 309 960). Reduced motion disables drawer slide/toast transitions. |
| Mobile | Board becomes stage tabs with counts (one column at a time), summary 2×2, chips scroll horizontally, drawer full-width. |

## Open issues
- Drag-and-drop is mouse only (HTML5 DnD); keyboard/touch users change stage via the drawer select — intentional, but there is no touch drag.
- The "what needs to happen" field uses a datalist, which renders an empty dropdown arrow in Chromium; looks slightly unpolished.
- Contact roles are empty for deals created in the demo.
- Shared kit gap: none needed; number/date formatting is local (headless Chromium lacks az-AZ Intl data, so Intl output differed from the build).
