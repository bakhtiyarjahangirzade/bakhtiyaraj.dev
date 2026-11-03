# Wolfpack (gym) — combat gym in Baku, kind `site`

## Previous problem
Showroom reskin: a hero photo with a bold headline, a decorative colour strip, generic discipline cards and a dead "trial class" button. No timetable that could be read, no prices, no rules.

## Thesis
A fight-poster printed on concrete. The page is the gym's wall: the week's timetable is the centrepiece, the prices are pinned beside it, the rules are the rules. Raw, physical, legible from across the room. The memorable thing is the poster type and the full timetable grid; everything else is disciplined.

- Audience: adults (16+) in Baku who want to start or switch to MMA, Muay Thai, BJJ or boxing; parents of teens for the youth group.
- Primary task: find a beginner class that fits the week and book a free trial in it.

## Art direction
- Palette: concrete `#D3D0C9`, tape white `#F6F5F1`, pure black `#000000` (type blocks, header), mat blue `#2340C4` (interactive state, selected class, filters), canvas red `#B3261E` (only "full" and errors). Discipline identity in the grid is carried by a text code + pattern, not colour alone.
- Type: Oswald (condensed, Cyrillic) for poster headlines and the grid; body in Oswald's lighter weights is too narrow for long copy, so body uses PT Sans (Cyrillic + latin-ext).
- Imagery: the owner-supplied generated black-and-white hand-wrap image (`/assets/showroom/gym.webp`) as the hero poster, plus CC0 photographs of gear/space (gloves, bags, ring) — no identifiable people.
- Composition: poster hero (stacked condensed type over the hand-wrap photo, schedule summary as a tear-off strip), then a full-width timetable (7 days × time rows on desktop; on mobile a day switcher and a list), class detail drawer, trial booking, prices as a comparison table, first visit, house rules, coaches as text, address/hours, footer.

## Signature interaction
Timetable filtered by discipline and level → class detail (coach, level, duration, capacity left, what to bring) → free trial booking (name, phone, experience, age 16+/guardian, rules accepted) → confirmation; the class's free places drop by one and full classes cannot be booked.

## Imagery and provenance
- Hero: owner-supplied generated image `/assets/showroom/gym.webp` (1200×900, black-and-white hand wraps, made by the owner in ChatGPT), CSS grayscale/contrast grade; stated in the footer.
- No Openverse photographs used. Searches "boxing gloves", "punching bag", "boxing ring", "kettlebell" (plus a failed "gym weights") returned only 6 results; the usable boxing image showed young boxers and a glove brand logo, so it was rejected. Discipline identity is carried by type, codes and stripe patterns instead.

## Verification
- `npm run build:web`, `npm test` (36/36). Playwright on served `dist/`: az desktop 1440×900 and mobile 390×844, en desktop, ru mobile flow. No console errors, no page overflow (chip rows scroll inside their own row on mobile).
- Flow completed: filter Muay Thai + Beginner → Monday 18:00 → dialog (coach, level, length, places, what to bring) → name/phone/age/experience/rules → "place held — demo, nothing sent"; places drop by one and the class becomes "Your trial" (`gym-flow.jpg`).
- States: dialog validation (phone, name, experience, under-18 consent, rules; under-16 on a non-youth class refused) (`gym-state.jpg`); filters with no result → message + reset (`gym-empty.jpg`); full classes cannot be booked; advanced classes explain trials are beginner/all-levels/youth only; a second trial is refused.
- Keyboard: classes are buttons; native `<dialog>` with Escape, focus returns to the class. Reduced motion removes the hover shift.

## Open issues
- Only one image; the lower page relies on typography and black/concrete bands.
- Coach names are fictional and shown without photos by design.

## Content
Prices in AZN with what is included; first-visit guidance; house rules (hygiene, nails, tap rules, sparring only with coach permission); coaches as name + discipline + classes they teach (no fake records or titles).
