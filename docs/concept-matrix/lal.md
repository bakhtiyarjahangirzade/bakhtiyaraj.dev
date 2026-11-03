# lal — Cibdə (app)

## Thesis
A pocket classifieds app where a sale is a conversation. Cibdə is presented as an app concept: a working phone prototype sits at the centre of a short product page, and the page is a guided tour of it — each step on the left drives the phone, each note on the right explains a decision. On a phone, the frame disappears and the prototype is the page.

## Previous problem
A static phone mock-up with three fixed bubbles; no screens, no navigation, nothing to tap.

## Audience and primary task
People in Bakı selling and buying small things nearby (clothes, sneakers, plants, instruments) between errands. Task: scroll the nearby feed → open an item → message the seller with a quick reply or an offer → agree a meeting place. Seller: photo → title & category → price → publish.

## Art direction
- Palette: cobalt `#2E3FE0` (page and brand), night `#141A3A` (text on light), mist `#EEF0FB` (app canvas), white, coral `#FF6B5A` for offers, mint `#2FB58A` for “seller replied”.
- Type: Comfortaa Variable for the brand and large headings (round, pocket-sized); Nunito Variable for app text where small sizes must stay legible.
- Imagery: real CC0 photos of single items, square crops like phone snaps.
- Composition: three columns on desktop (tour steps | phone | screen notes) on a cobalt field; below, a short sequence of how posting works and the principles behind chat-first selling. Mobile: full-screen prototype, then the notes.
- Signature: quick replies and the offer sheet inside the chat thread; the offer appears as a coral card the seller can answer.

## Content written
12 nearby items with distance, district, price, posted time and seller response time; four chat threads; quick replies in three languages; meeting-point suggestions (public places).

## Flow
Feed → item → chat (quick reply / offer, simulated reply marked as demo) ; Search (recent, live results, empty state) ; Post (photo → details → price → published at top of the feed).

## States
Empty search; post validation; demo reply note; no fake store badges or ratings.

## Imagery and provenance
12 CC0 WordPress Photo Directory photographs (`k/lal/assets.json`), square crops; none overlaps Bazarlıq's photos. The phone frame is plain CSS (no device brand). There are no store badges, ratings or download counts.

## Verification (3 Nov 2026)
- Build and tests pass; Playwright az desktop/mobile, ru/en desktop/360 — no overflow, no console errors.
- Flows completed in the prototype: feed → item → “Message seller” → quick reply “Still available?” → typing indicator → demo reply; offer sheet → 80 % suggestion → offer card → automatic counter-offer; search “piano” → empty state with alert toggle; post: title too short + no category → inline errors; photo upload → title + category → price → published at the top of the feed with a toast.
- The tour buttons on the left drive the phone; notes on the right change per screen. At ≤760px the frame disappears and the prototype fills the viewport, followed by the intro, tour and notes.
- Keyboard: focus ring visible inside the phone; Escape closes the offer sheet; reduced motion removes the screen transition.
- Deliverables: `docs/concept-shots/lal-{desktop,mobile,flow,state}.jpg`, preview `storefront/public/assets/previews/lal.jpg`.

## Open issues
- Seller replies are scripted (marked “demo reply”); the counter-offer rule is simply 90 % of the asking price.
- The offer sheet is a lightweight dialog without a full focus trap.
