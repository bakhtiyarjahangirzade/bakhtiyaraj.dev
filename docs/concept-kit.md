# Concept kit — how a redesigned concept is built

Every catalogue concept (`/<lang>/concepts/<id>.html`) is an independent module in `storefront/src/k/<id>/`.
Read `.claude/skills/frontend-design/SKILL.md`, `.claude/skills/bakhy-concept-craft/SKILL.md`, `docs/cloud-concept-upgrade.md` first.

## Files of one concept

| File | Runs in | Job |
|---|---|---|
| `k/<id>/index.js` | Node, at build | `export default {id, brand, kind, render(ctx)}`. Returns the page body HTML for one language. |
| `k/<id>/app.js` | Browser | Vite entry. First lines: `import '../ribbon.css'; import './style.css'; import '../../i18n.js';` then the interactive prototype. Must **not** import `kit.js` (it uses `node:fs`). |
| `k/<id>/style.css` | Browser | All rules scoped under `body.concept-<id>` (the body has `class="concept-body concept-<id> k-page"`). `@import '../fonts/<family>.css';` at the top for its typefaces. |
| `k/<id>/assets.json` | generated | Photo provenance, written by `scripts/concept-assets/process.py`. Never edit by hand. |

`kind` must stay what it was (`site` or `app`): it decides the configurator link (`website`/`system`). `brand` keeps the existing brand name. Discovery is automatic (`concepts.js` + `vite.config.mjs` scan `k/*/`). IDs, URLs and the ribbon (sample notice + “customise this concept” link to `/product.html?service=…&reference=<id>`) are produced by the shell; do not duplicate them.

## Rendering contract (`ctx` from `k/kit.js`)

- Copy: `import {L} from '../kit.js'` and write every visible string as `L('az','ru','en')`. Azerbaijani is the source; Russian and English must be real translations with the same `{placeholders}`. The test `tests/concepts.test.mjs` fails on empty/mismatched leaves.
- `ctx.t(leaf,vars)` → escaped text; `ctx.raw(leaf)` → unescaped; `ctx.num(n)`, `ctx.azn(n)` (“1 250 AZN”, locale grouping), `ctx.date(d,opts)`; `ctx.href('/product.html?...')` → language-prefixed in-site link (the body is not post-processed, so in-site links must use it).
- Images: `ctx.img('<id>/<key>', L(alt...), {cls, sizes, eager})` → responsive `<img>` with width/height. `ctx.credits([...keys])` → the credit line; put it in the concept footer.
- Runtime data: `ctx.data({...})` emits `<script type="application/json" id="k-data">` with all `Tx` leaves resolved to the page language. `app.js` reads it with `JSON.parse(document.getElementById('k-data').textContent)`. Runtime UI strings (toasts, validation, empty states) go there too — never hardcode one language in `app.js`.
- CSP is `script-src 'self'; style-src 'self'; img-src 'self' data:`: **no inline `style=""` attributes, no inline scripts, no external URLs** for images/fonts. Setting `el.style.x` from JS is fine. SVG inline markup is fine.
- Escaping: anything interpolated into HTML goes through `ctx.t`/`esc`.

## Photography pipeline (CC0 / public domain only)

Network: `api.openverse.org` (anonymous: 20 requests/min, **200/day shared by everyone in this session — max 4 new searches per concept**) and `pd.w.org` (WordPress Photo Directory files) work. Wikimedia/Flickr hosts return 429 here; `images.unsplash.com` downloads work but there is no permitted search, so do not use Unsplash.

1. Search (cached, merges): `python3 -I scripts/concept-assets/search.py /tmp/claude-0/cache <id> "<query>"` (default source `wordpress`). Look in `/tmp/claude-0/cache/<id>.json` first — searches were already run for every concept.
2. Review: `python3 -I scripts/concept-assets/sheet.py /tmp/claude-0/cache <id> 6` → numbered contact sheets `/tmp/claude-0/cache/sheet-<id>-N.jpg` (originals in `/tmp/claude-0/cache/orig/`). Look at them; pick by crop quality, light and coherence, not by title.
3. Select: `scripts/concept-assets/selections/<id>.json` = `[{"key":"hall","id":"<openverse id>","crop":[x0,y0,x1,y1],"widths":[640,1280,1920]}]` (crop fractions optional).
4. Process: `python3 -I scripts/concept-assets/process.py /tmp/claude-0/cache <id>` → `storefront/public/assets/k/<id>/<key>-<w>.webp` + `k/<id>/assets.json`.
   Colour grading/duotone is better done in CSS (`filter`, blend modes) or by adding `"grade"` handling in your own crop choice than by inventing images.
5. Never use people's faces as identifiable “doctors”, “clients”, “founders”. No brand logos. No AI-generated images unless a real tool produced them in this session.

Openverse was unreliable (500/504) for much of this session, so `scripts/concept-assets/wpsearch.py <cache> <name> "<query>"` queries the WordPress Photo Directory's own REST API (same CC0 source) and writes the same cache format (ids `wp-<n>`).
Rebuilding later does not need the cache: `process.py` reads each file's original URL and provenance back from `k/<id>/assets.json` and downloads missing originals. `credits.py` regenerates `docs/concept-asset-credits.md`.
A few concepts reuse the owner-supplied generated images in `storefront/public/assets/showroom/*.webp` (motors, gym, estate); they are captioned as generated where shown.

## Fonts

OFL families already vendored (latin, latin-ext for Azerbaijani ə ğ ı ö ş ü ç, and Cyrillic where the family has it) as `storefront/src/k/fonts/<name>.css`: bodoni-moda, comfortaa, commissioner, eb-garamond, exo-2, fira-sans, fira-sans-condensed, geologica, golos-text, ibm-plex-sans, jost, lora, nunito, onest, oswald, pt-sans, rubik, tenor-sans, unbounded, young-serif (no Cyrillic: young-serif, bodoni-moda — give a Cyrillic fallback). Do not use tenor-sans for Azerbaijani text: it draws a dotted ı and a comma-below ş. The CSS family names are e.g. `'Commissioner Variable'`, `'Fira Sans'`. Do not use the studio fonts (Inter/Archivo) as a concept's identity.

## Build and check

- `npm run build:web` (≈3 s) → `dist/`. Serve: `npx --yes http-server`-style tools are not installed; use `python3 -m http.server 4173 -d dist` (run in background) and Playwright (`require('playwright')`, `chromium.launch()`).
- Check `/az/concepts/<id>.html`, `/ru/…`, `/en/…`: desktop 1440×900 and mobile 390×844, keyboard focus, `prefers-reduced-motion`, empty/error states, console errors, horizontal overflow (`document.documentElement.scrollWidth > innerWidth`).
- `npm test` must pass.
- Screenshots: `docs/concept-shots/<id>-desktop.png`, `<id>-mobile.png`, `<id>-flow.png` (primary interaction completed), plus `<id>-state.png` (empty/error/validation) — deviceScaleFactor 1, JPEG/PNG under ~400 KB each (crop to the first 1–2 screens for desktop; full-page desktop goes to `/tmp`).
- Catalogue preview: `storefront/public/assets/previews/<id>.jpg`, 1280×800 screenshot of the real built page top (desktop, ribbon hidden via `document.querySelector('.concept-ribbon').remove()`), quality ~82.
- Matrix notes: `docs/concept-matrix/<id>.md` (previous problem, audience, primary task, palette, type, imagery, composition, signature interaction, content written, flow, states, desktop/mobile verified, open issues). Honest.

## Content rules

Fictional brands, Azerbaijani context (Bakı, Gəncə, Şəki, Qəbələ, Lənkəran…), AZN. Sample data must be internally consistent across views (the same record shows the same numbers everywhere). No invented testimonials, awards, press, client logos, medical outcomes, investment returns or “trusted by 10 000” statistics. Clinic: no diagnoses or outcome claims; booking is a request. Finance: projections are explicit hypothetical calculations with user-chosen rate, labelled “not advice”. Prototype actions are local state and say so where it matters (“request sent — demo, nothing was sent”).
