# Focus Room interaction contract

The web and Windows renderer share public/apps/focus-room files.

| Capability | Owner | Observable behavior |
| --- | --- | --- |
| Timer state | timer-core.js + focus.js | Wall-clock deadline, pause freezes remaining time, reset returns to configured duration |
| Modes | focus.js | Focus / short / long; mode buttons disabled while running |
| Duration input | native number input + focus.js | Whole minutes; focus 1–120, breaks 1–60; inline validation |
| Select/Listbox | native | OS-owned sound popup is intentionally accepted on both platforms |
| Completion | focus.js | Record exactly once, play configured chime, offer next phase without autostart |
| Sound | Web Audio in focus.js | User gesture unlock; volume shared with generated rain; silence is supported |
| Persistence | device localStorage | Restore timer, settings and daily counts; storage failure leaves current timer usable |
| Windows shell | main.cjs | Native titlebar, isolated sandboxed renderer, no remote code or preload IPC |

No accounts, remote user data or paid services. Sounds require an open app.
Native focus behavior and controls, visible keyboard focus, reduced motion and
responsive single-column layout. Rain starts only on explicit user action and does
not silently resume on reload. Browser and desktop store their sessions separately.
