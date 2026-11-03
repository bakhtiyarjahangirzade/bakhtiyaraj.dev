# stream — Arena (site)

**Previous problem.** A Netflix-style dark hero ("Mövsümün ən yaxşı anları") with a ▶ button that did nothing, a row of ranked thumbnails and a generic footer. No schedule, no programme detail, no working control.

**Thesis.** Arena is a regional public-interest broadcaster's streaming hub for sport and culture — league football, volleyball, chess, mugham evenings, theatre. It is organised like a broadcast desk, not a movie shelf: the page opens on today's running order across four channels, laid on a time ruler with a moving "now" line, so the first question ("what is on right now, and what is next?") is answered before any artwork.

**Audience.** Viewers in Azerbaijan who follow the regional league and cultural programmes, often on phones; families planning an evening.

**Primary task.** See what is live/next → filter by category → open a programme (segments or episodes) → add to My list → open the player.

**Palette.** Night pitch `#0F1A24`, panel `#172633`, line `#2A3D4C`, chalk text `#E9EEF1`, muted `#94A6B3`, live red `#FF5A47` (only for live state), floodlight yellow `#F2C94C` (selection and focus). Category ticks: sport teal `#4FB6A8`, culture lilac `#B59CE6`.

**Type.** Unbounded Variable for the channel identity, clock, scores and titles (wide, set tight); Fira Sans Condensed 500/600 for listings, times and body — dense and legible on phones.

**Imagery.** CC0 photographs of empty stadiums, courts, stages, chess boards — no identifiable people, no brand logos; used as programme posters, darkened under text.

**Composition.** Channel bar + live clock → "On now" lead (the programme currently live) → running order on a time ruler (desktop: horizontal lanes; mobile: vertical list per channel) with category filters → this week's collections → My list → footer. Programme detail and player are dialogs.

**Signature interaction.** Running order computed from the visitor's clock (Baku time): blocks become *live*, *next* or *ended* as time passes; the now-line moves once a minute.

**Flow / states.** Category filter with empty state; programme detail with segments/episodes; save/remove to My list (localStorage, try/catch) with empty state; player dialog: poster + working controls that say plainly there is no video in the demo.

**Content written.** 15 programmes in 7 categories (league football, round review, youth-football documentary, beach volleyball final, basketball, 3×3 series, junior athletics, chess open with commentary, chess lessons, open-stage concert, candlelight recital, chamber evening, Baku–Gazakh rail documentary, night-train film, stadium-night film), each with segments or episodes and durations; a full 24-hour running order on four channels (every lane sums to 1440 min). Teams and channels are fictional.

**Verified (Playwright, built dist; clock fixed with `?t=HH:MM` for review, live Baku time otherwise).** At 19:40 the derby is the live feature ("First half, 41 min in"); On-now lists four channels with progress and next item; the running order marks past / now / live / next and the red now-line. Programme dialog → Add to my list (count 1, toast) → Watch live → demo player (play/pause, ±10 s, seek, back-to-live, mute, subtitles, quality, full screen; Esc returns focus to the schedule block). Empty catalogue search (chess + "tennis") with clear button; empty My list state. az desktop/mobile, ru/en, 360 px: no overflow, no console errors. Shots: `docs/concept-shots/stream-{desktop,mobile,flow,state}.jpg`, preview `storefront/public/assets/previews/stream.jpg` (taken at ?t=19:40).

**Open issues.** On phones the running order is a horizontally scrolled timeline inside its own container; a vertical "next 3 hours" list would read faster. The schedule repeats daily (no date picker). Posters are CC0 venue photographs from abroad chosen without readable sponsor logos (the first match photo was rejected for showing them); one studio shot has an unreadable ribbon banner at small size.
