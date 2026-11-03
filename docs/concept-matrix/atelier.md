# atelier — Atelier No.8 (site)

**Previous problem.** "Qeyri-adiyə baxan göz" headline, three generic cards (selected works / personal approach / collaboration) and three placeholder work titles over SVG shapes. No photographs in a photography portfolio.

**Thesis.** Atelier No.8 is a two-person architectural photography studio that works with one subject: how low coastal light lands on walls, stairs, concrete and water. The site is sequenced like a printed book — the order of images, their size and the white space between them is the design. Every frame is captioned with the hour it was made, and the index view re-orders the whole archive by time of day, from early light to night lamps.

**Audience.** Architects, interior studios, hotels and developers commissioning documentation of finished buildings; editors licensing single frames.

**Primary task.** Read a series → open frames in a lightbox and move through them with the keyboard → switch to the index → send a commission enquiry.

**Palette.** Haze `#E4E7E6` (page), wall `#F6F7F5` (plates), ink `#1B2124`, graphite `#5B6468`, Caspian blue `#244A63` (links, focus, time marks). Photographs carry the colour.

**Type.** Jost Variable (400) for titles, series names, captions, hour stamps and UI; Lora Variable for the long narrative text (17–19 px, 1.6 line-height, ≤ 36 em). Tenor Sans was the first choice but was rejected after a glyph test: its ı renders dotted and ş renders with a comma below (ș), both wrong for Azerbaijani.

**Imagery.** CC0 WordPress Photo Directory: shadows through windows, stair wells, concrete bridges, sea horizons, lamps at night. Locations are described by type (stair, pier, wall), not by real landmarks. No identifiable people.

**Composition.** Masthead with the studio statement and one full-bleed opening frame → three series, each with its own rhythm (full bleed + offset pair; small frame in a wide margin; tall/narrow diptych), each followed by a short essay → contact-sheet index ordered by hour → working method (a real sequence: recce, light study, shoot, edit, delivery) and day rates → enquiry form → footer with credits.

**Signature interaction.** Sequence ↔ index toggle where the index sorts every frame on an hour ruler; lightbox with ←/→/Esc, counter, caption, focus return.

**Flow / states.** Lightbox (keyboard, buttons, swipe-free click targets); index filter by series with empty-free states; enquiry with validation (name, email, type, location, date window, consent) → confirmation that says nothing was sent (demo).

**Content written.** 22 captioned frames in three series (Breakwater 7, Shadow timetable 9, Night shift 6) with essays, a margin note, an hour index in four light bands, a five-step method, four sample rates in AZN (labelled as sample), an enquiry form with a light-preference choice, and a footer note that the studio is fictional and the photos are CC0 from real places. A live Baku clock in the masthead names the current light ("late light, façades warming up").

**Verified (Playwright, built dist).** az desktop 1440×900, mobile 390×844, ru/en spot checks, 360 px: no overflow (a 1 px ruler-label overflow at 360 px was fixed), no console errors. Lightbox opens from any frame, →/← move through all 22 (5 / 22 after two presses from frame 3), Esc closes and focus returns to the opening frame; from the index with the "Night shift" filter the lightbox walks only that filter in hour order (1 / 6). Enquiry: invalid email / missing fields show inline errors plus a summary and focus the first error; a valid enquiry shows a summary that says nothing was sent. Shots: `docs/concept-shots/atelier-{desktop,mobile,flow,state}.jpg`, preview `storefront/public/assets/previews/atelier.jpg`.

**Open issues.** Photos come from many photographers and countries (CC0); the captions describe the frame type and hour, a fiction for the concept that the footer states. No swipe gesture in the lightbox (buttons and keys only).
