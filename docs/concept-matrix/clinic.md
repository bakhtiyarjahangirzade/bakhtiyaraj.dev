# Sunny Kids (clinic) — paediatric clinic in Baku, kind `site`

## Previous problem
Showroom reskin: a 3D cartoon child on a tricycle (ChatGPT render), pastel arches, round avatar blobs standing in for doctors, an invented parent quote, and an appointment "flow" that was a static button.

## Thesis
Trust through clarity for a tired parent holding a phone with one hand. The page answers, in this order: is the clinic open now and what do I do if it is an emergency; who sees children today; how do I request a visit; what do I bring. Warmth comes from the sun-yellow and the tone of voice, not from cartoons.

- Audience: parents and grandparents in Baku (Nərimanov rayonu, fictional address), often on mobile, often in a hurry.
- Primary task: request an appointment for a child with the right specialist, on a day that specialist actually receives.

## Art direction
- Palette: white `#FFFFFF`, ink navy `#1C2A4A` (text, trust), sun `#FFC633` (the one bold surface: the request panel and today's board), sky `#E7F0FA` (quiet panels), available mint `#1F8A6B` (free slots), emergency red `#C62F2F` (used only for 103/112), rule `#D6DEE9`.
- Type: Nunito (rounded but serious at 800 for headings, 400/600 body at 17px on mobile). Numerals for times and phone numbers in tabular figures.
- Imagery: two CC0 WordPress Photo Directory photographs of wooden toys/objects on a windowsill, used small and calm in the "visiting us" section; no faces, no stock "doctors". Doctors are text records: name, specialty, reception days drawn as a Mon–Sat strip.
- Composition: top "Today" board (open/closed computed from the hours table, doctors receiving today, emergency line) next to a plain headline; then the request panel as the body of the page (a real 5-step sequence, so numbered); then a service table with duration and what to prepare; doctors' reception grid; hours, address and emergency guidance; parent FAQ; footer with credits.

## Signature interaction
The appointment request: specialty → doctor (only doctors of that specialty) → day (next 10 days, only that doctor's reception days, closed days disabled) → time slot (from the doctor's weekly schedule; a few pre-booked slots shown as taken) → child's name, age, parent phone (+994 format), reason → summary "request prepared — demo, nothing was sent; the clinic would call to confirm".

## Content rules
No diagnoses, no outcomes, no treatment claims, no credentials or years of experience. Emergency guidance: "If your child has trouble breathing, a seizure, is unresponsive or badly injured, call 103 (ambulance) or 112 now. Do not use this form."

## States
Step validation (no doctor, no slot, invalid phone, age outside 0–17, empty name), doctor with no reception in the next days, change-step navigation, start over.

## Imagery and provenance
Two CC0 photographs from the WordPress Photo Directory via Openverse, processed by `scripts/concept-assets/process.py` (`selections/clinic.json`): matryoshka dolls by María Cortés (the "each age" band, smallest to largest) and a wooden rainbow toy on a windowsill by ev0llution ("Before you come"). Credited in the footer with `ctx.credits`. The owner-supplied 3D cartoon render (`/assets/showroom/clinic.webp`) was not used: it is the childish cliché the brief asked to avoid. A "stethoscope" search returned nothing.

## Verification
- `npm run build:web`, `npm test` (36/36). Playwright on served `dist/`: az desktop 1440×900, mobile 390×844, ru mobile, en desktop flow. No console errors, no horizontal overflow.
- Flow completed: Paediatrician → Leyla Həsənova → first free day/slot → child/parent/phone/reason → review → "Request ready" with request number, the matching "what to bring" text and the demo note (`clinic-flow.jpg`). "Request this doctor" links in the schedule pre-fill steps 1–2 and jump to step 3.
- States: step errors without a choice; field errors for empty name/age/parent, invalid phone, short reason, with an error count (`clinic-state.jpg`); taken slots striped and disabled; days without reception disabled; "no reception in 14 days"/"no free time" messages exist but are not reachable with the sample schedule.
- Keyboard: radios, Continue/Change buttons, focus moves to the step heading; visible focus. Reduced motion disables smooth scroll. Mobile: doctor schedule table turns into per-doctor rows of day chips.
- The "Today" board and highlighted hours row are computed from Baku time (`Asia/Baku`), so screenshots differ by time of day.

## Open issues
- Taken slots are a deterministic pseudo-random sample, not a booking backend; nothing is sent (stated twice).
- Prices, phone (+994 12 000 00 00) and address are marked as samples; doctors are fictional.
