# Luna Comics — implementation notes

Live path: `https://www.bakhtiyaraj.dev/Luna` (after merge and deploy — not deployed by this change).

## Architecture

| Piece | File |
|---|---|
| Page shell (Vite entry `luna`) | `storefront/Luna/index.html` → `dist/Luna/index.html` |
| One canonical catalogue (titles, page manifests, access, price, credits) | `storefront/Luna/src/catalogue.js` |
| Pure logic: leaves, spreads, steps, layout mode, progress, filters, manifest validation | `storefront/Luna/src/core.js` |
| Reader (book, page turns, swipe, zoom, keyboard, loading/errors) | `storefront/Luna/src/reader.js` |
| Shop, detail, library, account views, routing, WhatsApp dialog | `storefront/Luna/src/app.js` |
| Library / progress storage (device or account) | `storefront/Luna/src/store.js` |
| Supabase auth + sync adapter (lazy loaded) | `storefront/Luna/src/account.js` |
| Styles, fonts | `storefront/Luna/src/luna.css`, `storefront/public/Luna/fonts/` |
| Comic assets | `storefront/public/Luna/comics/<slug>/` → `/Luna/comics/<slug>/` |
| Database migration | `supabase/luna.sql` |
| Asset import | `scripts/luna/import-peppercarrot.py` (+ `import-report.json` with source hashes) |
| Production-like local server | `node scripts/luna/preview.mjs` (serves `dist/` with the vercel.json CSP and rewrites) |
| Tests | `tests/luna.test.mjs` |
| Design and behaviour | `storefront/Luna/DESIGN.md` (dark bento + Apple-style direction), `storefront/Luna/BEHAVIOR.md` |
| Rights evidence | `docs/luna-content-credits.md` |

No framework and no animation library: page turns use the Web Animations API. The Supabase client (`@supabase/supabase-js`, already a dependency) is a dynamic import, so anonymous readers never download it (`luna-*.js` ≈ 19 kB gzip, CSS ≈ 6 kB gzip).

Shared files touched (minimal): `storefront/vite.config.mjs` (one entry), `vercel.json` (`/Luna` and `/Luna/` rewrites to `/Luna/index.html`; CSP unchanged), `scripts/i18n-pages.mjs` (adds `/Luna` to the sitemap), `public/lab/index.html` + `public/index.html` (one "Luna Comics" module in the free-tools rack, the existing free-resources area) and `public/hub.js` (its mini screen), `.gitignore` (`.cache/`). Studio prices, layouts, concept IDs, i18n tables, auth, admin and other apps are untouched.

## Routes and hosting

Canonical `/Luna` (capital L, no trailing slash); `/Luna/` serves the same document via rewrite. Nested views are query based (`?eser=`, `?oxu=&s=`, `?bolme=`), so refresh and deep links work on the static host without extra rewrites. All asset URLs are absolute. The page uses only external scripts/styles and CSSOM-set custom properties, so it runs under the existing production CSP (`script-src 'self'; style-src 'self'; img-src 'self' data:`; `connect-src` already allows the Supabase project).

Language: Luna's interface is Azerbaijani only and is not part of the AZ/RU/EN studio generator (`scripts/i18n-pages.mjs` does not process it), so studio translation completeness checks are unaffected. Comic text keeps its original language (English, Russian, wordless) and is labelled on every card and title page; Luna never translates comics.

## Content

Starter collection: 8 Pepper&Carrot episodes by David Revoy (CC BY 4.0) — 5 free (episodes 1, 2, 3, 5 in English/wordless and episode 6 in the Russian community translation) and 3 sample paid products (8, 11, 15) with only 2–3 preview pages bundled. 35 page files plus 16 cover files, 8.4 MB total, every file listed with source URL and hash in `docs/luna-content-credits.md`.

### Adding a comic

1. Confirm the rights from a primary source (license from the rights holder for that exact edition; free availability or age alone is not enough) and add a section to `docs/luna-content-credits.md`.
2. Put the files in `storefront/public/Luna/comics/<slug>/`: `cover.webp` (≈1100 px wide), `cover-sm.webp` (≈560 px), pages `p01.webp`, `p02.webp`, … all with the same size. For a sample/paid title, add **only** the preview pages. (For Pepper&Carrot, add a row to `EPISODES` in the import script and run it.)
3. Add an entry to `titles` in `storefront/Luna/src/catalogue.js`:

```js
{
  slug: 'my-comic-01', series: 'Series', episode: 1, title: 'Original title', titleNote: 'optional alt title',
  creator: 'Name', credits: [['Rəsm və ssenari', 'Name']],
  language: 'en' | 'ru' | 'none', languageNote: '…',
  genres: ['Macəra'], year: 2026,
  synopsis: 'Luna-nın öz qısa təsviri (Azerbaijani).',
  access: 'free' | 'sample', price: null | 8,            // AZN, illustrative for samples
  storyPages: 12, previewPages: 3,                       // previewPages only for samples
  pages: ['p01.webp', 'p02.webp', 'p03.webp'],           // ordered; all pages for free titles
  pageSize: [1200, 1660], coverSize: [1100, 765], tone: '#2f4a3f',
  featured: false,
  source: { folder: '…', files: 'https://…', page: 'https://…', published: 'YYYY-MM-DD' },
  license: { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/', evidence: 'https://…' },
}
```

4. `npm test` validates the manifest (required fields, unique slug, page counts vs access, preview not exceeded, tone, license and source URLs), checks every listed file exists with the declared size, that no unlisted pages are shipped, and that the credits doc mentions the title.

## Auth and storage

- **Reused**: the shared `bakhy-dev` Supabase project and publishable key already used by `/budgettracker` (e-mail + password, `mailer_autoconfirm` off, so registration sends a confirmation e-mail). Luna keeps its own session key (`luna.auth`) so it does not pick up the games' anonymous guest sessions. No second auth system, no passwords stored by Luna, no service-role key in the frontend.
- **Shared trigger**: the project's `handle_new_user` trigger also creates a games profile with play chips for every new auth user. Luna does not change it; the registration form discloses it and requires an acknowledgement.
- **Sync tables**: `supabase/luna.sql` creates `luna_library` and `luna_progress` with RLS (each authenticated, non-anonymous member reads/writes only rows where `user_id = auth.uid()`; anon has no grants). The policies were exercised in PGlite with a stubbed `auth` schema: own insert/select/upsert succeed; inserting for another user, reading/updating/deleting another user's rows, anon access and anonymous-guest inserts are all refused; slug and leaf constraints reject bad data.

### Account backend status (checked 3 Nov 2026)

- Auth endpoint reachable from the session; settings report e-mail auth on, sign-ups on, e-mail confirmation required. A sign-in with a non-existent account against production returned "Invalid login credentials", shown as "E-poçt və ya parol yanlışdır."
- **Owner action needed for synced libraries**: `luna_library` is not present in production (`PGRST205`). Until `supabase/luna.sql` is run in the Supabase SQL editor, signed-in members see "Sinxronizasiya hələ quraşdırılmayıb" and their library/progress stays in the browser. Nothing else changes when it is applied; the app detects the tables automatically.
- **Recommended owner check**: add `https://www.bakhtiyaraj.dev/Luna` to Authentication → URL configuration → Redirect URLs so confirmation links return to Luna (otherwise Supabase falls back to the Site URL; the account still confirms).
- Not offered: password reset (delivery and recovery flow not verified for Luna), social login.

## Payments

There is no payment processor, cart, order record or entitlement. Sample products only show preview pages that are physically the only pages on the server, an illustrative price and a WhatsApp draft (`https://wa.me/48571572697?text=…` with the title) that the visitor sends themselves. Nothing in localStorage or the URL unlocks content.

### Future checkout boundary (not built)

A real paid catalogue needs, server side: a payment provider webhook that writes `luna_entitlements(user_id, comic_slug, source, created_at)` with a service-role function (never from the browser); private storage for paid pages (e.g. a Supabase Storage bucket with RLS or signed URLs issued by an Edge Function that checks the entitlement); the reader requesting page URLs from that function instead of `/Luna/comics/`. The CSP would need the storage host in `img-src`. Until then paid titles must stay preview-only.

## Verification (this change)

- `npm ci`, `npm run build:web`, `npm test` (36 existing + 14 Luna tests).
- Browser (Playwright, Chromium) against `dist/` served with the production CSP and rewrites: desktop 1440×900 and phones 390×844 / 320×640 — discovery, search/filters/no-results, detail, save to library, reader open, keyboard turns, rapid clicks and interrupted turns, page select, zoom, mode switch on resize keeping the page, Escape out, resume on reload/direct link, library with progress, odd final spread, preview boundary (page 3 of a sample returns 404), WhatsApp draft URL (not opened), unknown slug, `/Luna/`, missing image + retry, reduced motion, swipe forward/back, vertical drag and short swipe ignored, no horizontal overflow, no console errors, no Supabase request for anonymous readers, no images of unopened titles fetched.
- Account flows: validation, password toggle and wrong credentials against production; success, sync-missing, synced merge/save/progress, logout clearing, registration confirmation and session expiry against a mocked Supabase API (no real account was created).
- Screenshots: `docs/luna-shots/`.
