# Focus Room Instrument — design QA

Source truth: `design/instrument-reference.png` (selected Instrument / option 2).

Implementation: `design/instrument-rendered.png`.
Full comparison: `design/instrument-comparison.png`.
Focused control comparison: `design/instrument-control-detail.png`.

Viewport: 1448 × 1086 CSS pixels, DPR 1. Source: 1448 × 1086.
Browser content screenshots exclude the scrollbar and include document scrolling.
Normalize app content rather than native/mock window chrome: source frame crop
(12,54)–(1437,1048); implementation (14,52)–(1419,1034). Minor frame-size variation
is recorded; the full source remains available for direct inspection.
State: focus selected, 25:00, idle, 0 completed sessions, rain off.

## Comparison history

1. First capture: [P1] readout too far left; [P2] numerals too tall;
   [P2] control-bank/frame too tall. Evidence: `instrument-comparison-first.png`.
2. Changed readout inset to 17% with an 80px meter gap, compacted the display and
   control bank, moved web-only download/footer information outside the case.
   Evidence: `instrument-comparison-second.png`.
3. Matched the numeral cap-height with a real DSEG font at 166px and its optical
   aspect adjustment; reference bright-digit bounds were about 500 × 139px.
   Restored 150px, 82px-tall duration controls and centered their labels.
   Evidence: `instrument-comparison-approved.png`; both source and rendered
   implementation were opened together, with a focused control comparison.
4. Narrow-width review: [P2] native number arrows crowded the value and wrapped
   captions shifted field baselines. Reduced mobile field type to 29px, narrowed
   input padding, and reserved a common 54px label row. Post-fix capture is
   `design/instrument-mobile.png`; all values remain readable.

## Required fidelity surfaces

- Typography: locally bundled DSEG7 Classic, Barlow Condensed and Oxanium.
  Seven-segment readout, tracked title and condensed equipment labels match the
  reference hierarchy. Font files and required licenses ship offline.
- Layout: centered title and mode selector, offset horizontal readout with a
  right session meter, physical Start/Reset buttons, and one lower control strip.
- Colors: charcoal material, warm amber display/buttons, pale brass lettering;
  blue/purple HUD and circular timer have been removed.
- Imagery: two individually generated inspected material assets are used in the
  actual case and control faces. Icons are from the licensed Tabler library.
  No screenshot is used as a fake interactive application.
- Copy: reference labels retained. Accessibility names supply the full current
  action (Start focus / Pause session / Resume session) while visible labels use
  START / PAUSE / RESUME. Operating instructions stay accessible.

## Runtime validation

- Start, pause, reset, focus/break selection, Listen, rain toggle tested in browser.
- Timer-core tests: 4 passed. Production static build passed.
- Console errors/warnings: none during tested workflow.
- Narrow viewport at 390px: document width 375px; controls reflow vertically.
- Desktop and Windows consume identical renderer assets through prepare.cjs.

## Remaining P3 differences

- Generated reference's decorative macOS dots are omitted: desktop uses actual
  Windows window chrome. Download/source metadata are outside the equipment case.
- Native number steppers and licensed reset/cloud symbols differ slightly from
  the illustration; they remain functional, keyboard-accessible controls.
- Grain and brush patterns vary from the conceptual image, retaining its palette
  and material character. No actionable P0/P1/P2 mismatch remains.

final result: passed

