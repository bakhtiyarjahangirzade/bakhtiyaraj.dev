# BAKHY design direction

## Workbench (2026 redesign)

The site follows the Focus Room Instrument world everywhere: a dark workbench with
charcoal chassis, amber vacuum-fluorescent screens (scanlines, glow, a flicker on change),
brass/amber latching radio keys with the bundled mechanical click, screws, status LEDs
(green = live, blinking amber = on the bench) and engraved labels.

- Hub: header unit with a typing VFD marquee and rack meters, a channel key bank
  (All / Games / Apps / Extensions, persisted in `?category=`), and a 19" rack where every
  project is one rack unit with ears, a nameplate, a live amber mini screen and controls.
- Below: operator datasheet, a patch bay of jacks for contact links, and a brass serial plate.
- Games share the shell: header unit, lobby panel with VFD title, room code on the screen,
  dark glass cards with backlit inks, cream dominoes, a brass/charcoal chess board.
- Tokens live in `public/assets/rack.css`. Fonts are the bundled Oxanium (wordmark),
  Barlow Condensed (controls) and DSEG7 (digits). No external fonts or scripts; strict CSP.
- One committed dark look. Reduced motion stops all animation; keyboard focus is always visible.

## Focus Room / web and Windows

public/apps/focus-room/focus.css owns the shared Pomodoro tokens and primitives.
Both web and Electron load the same renderer files; desktop uses the native
Windows titlebar and hides the web download area. Focus Room 1.2 faithfully follows
the selected Instrument reference: generated charcoal grain and amber metal,
locally bundled DSEG7 display type, Oxanium wordmark and Barlow Condensed controls.
Horizontal inset readout, right session meter, tactile Start/Reset controls and
a single lower equipment strip for duration, sound and rain. Native number fields
and range input remain keyboard-operable. Material images and icons ship offline.
Version 1.3 replaces the visible native duration steppers with split-flap number
drums and mechanical up/down keys. Native numeric editing remains underneath for
keyboard and assistive technology. Value changes animate, except with reduced
motion. Enabled buttons use a bundled MIT mechanical radio-click sample; master
volume controls the clicks, alarm and rain. The sample generator is included.
The catalog retains its separately approved gray design.
English copy, native duration fields and system-owned sound dropdown.
Start/pause/resume/reset remain explicit. Mode switching disables while running.
Completion records one session, plays the selected synthesized sound and offers
the next phase; it never automatically starts another session. Four completed
focus sessions lead to a long break. Motion is minimal and reduced-motion safe.
