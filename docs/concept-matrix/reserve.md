# reserve — Reserve (kind: app)

## Thesis
Reserve as the front-desk calendar of **Ülgüc Barbershop** (fictional, Yasamal, Bakı): four barbers with their own hours, days off and breaks, a 15-minute time grid, and a booking panel that computes real free slots from service duration, working hours and existing bookings — never an overlap. The administrator books a phone client in four steps (service → barber → time → client), sees it land in the grid, and can reschedule or cancel. Green ink on pale grid paper, brass for "now" and the new booking.

| | |
|---|---|
| Previous problem | A 5×3 checkerboard of "Boş/Rezerv" with no time logic. |
| Audience | Owners of salons, barbershops and studios with several specialists. |
| Primary task | Book a client into a valid free slot and manage the day. |
| Palette | paper #f1f4f0, ink #13261e, booking #dcebe2 / #2c6b51, past #eceeec, brass #9c6a12 / #f7ecd5 (now line, ghost slot, new booking), hatched texture for breaks and off-hours. |
| Type | Onest (vendored, Cyrillic + latin-ext), tabular times. |
| Imagery | None; the time grid is the picture. Per-day utilisation bar in the week strip is the only data graphic (labelled with count and %). |
| Composition | One-line product header → day bar (prev/next week, today, date, three stat pills) → 7-day strip (count, % booked, utilisation bar; Sunday closed) → day grid (time rail + 4 barber columns, 18px per 15 min) + sticky booking panel → lower: four rules of slot calculation, price list table, team hours table. |
| Signature interaction | Choosing a slot draws a dashed brass ghost block in the calendar before confirming; rescheduling fades the original block while the ghost shows the new time. |
| Content | 7 services with durations/prices and who performs them, 4 barbers (hours, break, day off, role), 364 deterministic sample bookings over three weeks (seeded, zero overlaps verified), 26 client names; demo clock fixed at Tue 3 Nov 2026 13:20. |
| Flow | Service → barber (any / specific, with free-slot counts) → time (chips grouped by barber, past times hidden, whole duration must fit) → client name + phone (+994 format) → confirm → block appears (highlighted, focused), stats and week strip update. Click a booking → detail → reschedule (any day, same service, excludes itself from conflicts) or cancel with confirmation. |
| States | Sunday closed (with "go to Monday"), empty future day notice, barber day off column, no free time (with "next free: day, time" jump), past day ("can't book a past day"), past booking can't be changed, validation errors, race check "time was just taken". |
| Verified | 1440×900 and 390×844 az, en (flow re-run); 360px az/ru no page overflow; console clean; stats reconcile (22 → 23 bookings, 41% → 45%, 430 → 465 AZN; back after cancel). |
| Mobile | Barber switcher above a single-column grid; panel follows the grid; selecting a slot switches the visible column to that barber. |

## Open issues
- Grid starts at 10:00 and ends at 21:00 for everyone; a shop with different hours needs a configurable rail.
- On mobile the booking panel is below the grid, so the ghost preview is off-screen while choosing a time.
- No drag-to-reschedule in the grid (reschedule goes through the panel).
- Russian team table scrolls horizontally inside its own box at 360px.
