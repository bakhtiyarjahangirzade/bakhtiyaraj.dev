# BAKHY design direction

The user approved a soft gray design inspired by their reference: rounded pill
buttons, clean bold typography, rounded product previews with rich local gradients.
Initial content language is English with a direct, informal headline.

## Visual tokens

public/styles.css owns the runtime tokens: background #e0e2e4, ink #080a0b,
muted #606569, line #bdc2c6, lime #d6ef86. Typography uses local Segoe UI / Arial
with restrained monospace detail inside product previews. No external fonts.

## Catalog and interactions

All / Apps / Games / Tools / Lab filters are prominent above the catalog.
Category selection is persisted in the URL; browser back/forward restores it.
All cards are explicitly labeled Concept until a real project is implemented.
Preview buttons open accessible native modal dialogs with real project summaries,
Escape support and focus restoration. Contact links open GitHub's new-issue page.
JavaScript-free visits show the concepts and real links; unsupported controls hide.
Native anchors/buttons, visible focus, responsive stacked cards, reduced-motion
support, one document scroller and a global scrollbar baseline.

## Content truth

Pixel Lab, Color Riot and Grid Run are proposed concepts. Focus Room is a working
Pomodoro application and its card links to /apps/focus-room/. Do not fabricate
counts of shipped products.
Lab has an honest empty state. No login, backend, tracking or paid dependencies.

## Focus Room / web and Windows

public/apps/focus-room/focus.css owns the shared Pomodoro tokens and primitives.
Both web and Electron load the same renderer files; desktop uses the native
Windows titlebar and hides the web download area. Focus Room 1.1 uses a futuristic
dark shell (#080d18), cyan accent (#77eaff), fine grid detail, glowing progress ring,
monospace timer, dark bordered controls and purple accents during breaks.
The catalog retains its separately approved gray design.
English copy, native duration fields and system-owned sound dropdown.
Start/pause/resume/reset remain explicit. Mode switching disables while running.
Completion records one session, plays the selected synthesized sound and offers
the next phase; it never automatically starts another session. Four completed
focus sessions lead to a long break. Motion is minimal and reduced-motion safe.
