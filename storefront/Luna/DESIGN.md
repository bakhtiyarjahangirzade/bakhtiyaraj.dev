# Luna Comics — design

Luna has its own identity, separate from the BAKHY studio theme (`storefront/DESIGN.md`). Nothing here changes studio tokens; every Luna style lives in `storefront/Luna/src/luna.css` and is scoped to `/Luna`.

## Subject and audience

A small digital comics bookshop with a reader that feels like turning paper. Audience: Azerbaijani-speaking readers on phones first, desktop second. The primary job of every screen is to get a reader into a real page quickly; the shop exists around the reader, not the other way round.

## Palette — taken from the starter collection's art

The first collection is Pepper&Carrot, whose covers are night skies, moonlit forests and lantern-lit workshops. The palette is sampled from those scenes rather than invented.

| Token | Hex | Source and role |
|---|---|---|
| `--night` | `#0e2426` | Night teal of the episode 11 and 15 skies. Masthead, hero, footer, reader desk |
| `--paper` | `#e9ece5` | Cool page white (comic pages are pure white, so the shelf sits a step darker). Shelf background |
| `--page` | `#fafbf7` | Paper of the book pages, forms and info boxes |
| `--ink` | `#15201e` | Text |
| `--lantern` | `#f0b03f` | Lantern/moon amber. The one primary action per screen, the Luna crescent, focus rings |
| `--ember` | `#b94d22` | Carrot's orange, darkened for contrast. Used only for sample-product markers and the inquiry action, so "not for sale" is always the same colour |
| `--moss` | `#2c6a4c` | "Free" markers, saved state, progress |

Each title also carries a `tone` in the catalogue: the cloth colour of its Luna jacket, picked from that episode's cover.

## Type

- **Young Serif** (display): a warm, slightly heavy old-style serif — publisher's imprint energy, legible at jacket sizes. Covers ə, ğ, ş, ı, İ. Wordmark, headings, jacket titles.
- **Commissioner** (text and UI): variable sans with Latin-ext and Cyrillic, used for body copy, controls and Russian titles (Young Serif has no Cyrillic, so `:lang(ru)` headings switch to Commissioner semibold rather than falling back to a system face).
- Scale: 17px body / 1.55, headings from 1.15rem cards to clamp(2.3rem, 5.6vw, 4.6rem) hero. Measure ≤ 68ch.
- Sentence case everywhere; no all-caps labels.

## Signature element: the book

The reader is where boldness is spent. The storefront stays quiet so that the book feels physical:

- **Luna jacket.** Every title is presented as a cloth-bound board in its tone: series and number at the top, the untouched episode cover in a framed window, the title in Young Serif, a small lantern crescent. The window keeps the cover's own ratio (`object-fit: contain`), so original artwork is never cropped.
- **Spread.** Desktop shows a closed book (cover alone, centred), then facing pages with an inner-gutter shadow and spine line; an odd last leaf sits alone on the left with the book shifted, like the back of a real volume.
- **Turn.** A two-faced leaf rotates around the spine (≈720 ms, slight lift at mid-turn, shading that darkens the departing face and lightens the arriving one). Phones get a shorter single-page peel (≈520 ms). Reduced motion: immediate swap.
- The hero repeats the book once: a jacket and a real first page, with a single page-lift on load. This is the only non-user-triggered motion.

## Layout

```
masthead: Luna crescent wordmark ............ Kataloq  Kitabxanam  Daxil ol
hero (night): headline / lead / [Oxu] [Kataloq]      |  open book (jacket + real page)
shelf: "Oxumağa davam et" (only when there is progress)
shelf: Pepper&Carrot ilə tanışlıq — jackets in reading order
catalogue: search + access + language + genre | count | jacket grid | empty state
footer (night): about / payments / account
```

Left aligned throughout. Detail: jacket left (sticky on desktop), body right; sample products get an ember-bordered box with the illustrative price and inquiry. Phones: single column, hero copy first, two-column jacket grid, reader controls icon-only with screen-reader labels.

## Principles

1. Real pages first: every image on Luna is a real comic page or cover; there are no placeholder panels or stock photos.
2. Honest markers: "Pulsuz" and "Nümunə məhsul, satışda deyil" are visible on every card, detail and reader title.
3. Quiet controls: reader chrome is low-contrast until hovered/focused; navigation is always visible and at least 44 px.
4. One action colour per screen (lantern). Ember means "sample, not for sale" and nothing else.

## Accessibility floor

Visible focus (3px lantern ring), skip link, labelled form controls with persistent labels, `aria-live` page status, reader exits with Escape, keyboard and buttons equal to swipe, browser pinch-zoom never disabled, `prefers-reduced-motion` honoured, no horizontal scroll at 320 px.

## Critique notes

- Rejected: dark-only shop with a single neon accent (generic), cream + terracotta (cliché), cards with identical soft shadows (SaaS kit). Shelves use the jacket objects instead of cards.
- Removed: a highlighted word in the hero headline; middle-dot meta strings on cards.
