# Luna — owner publishing and comics import

Implements `docs/luna-publishing-commission.md`. The approved storefront design and the page-turning reader are unchanged; imported comics use the same reader (desktop spread, phone single page, zoom, swipe, resume).

## Status: what is done and what needs the project owner

| | State |
|---|---|
| Editor panel, importer, storefront/reader integration, migrations, tests | Done, on this branch |
| Backend (tables, functions, buckets, policies) in the live `bakhy-dev` project | **Not applied.** This cloud session has only the public publishable key; it cannot run DDL. Verified read-only on 3 Nov 2026: `rpc/luna_catalogue` → `PGRST202` (not installed), bucket `luna-pages` → `NoSuchBucket`. Run the two SQL files below during release review. |
| Owner editor role | **Not granted** (same reason). Procedure below; the address is supplied privately at run time, never committed. |

Until the backend is installed the site behaves exactly as today: the starter collection works, the catalogue silently skips the missing published list, and `/Luna?bolme=redaktor` tells everyone (including the owner) that they are not an editor. No fake success anywhere.

## Release setup (exact steps)

1. Supabase dashboard → SQL editor (postgres role), project `bakhy-dev`. `supabase/luna.sql` is already installed; do not re-run it.
2. Run **`supabase/luna-publishing.sql`** once. It is idempotent and only creates `luna_*` objects, two private buckets and `luna_*` storage policies. It does not touch auth, users, triggers, `luna_library`/`luna_progress` rows or other apps.
3. The owner registers/confirms the Luna account normally at `/Luna?bolme=hesab&forma=qeydiyyat` (if not already).
4. Run **`supabase/luna-owner-setup.sql`** with the owner e-mail as a variable:
   `psql "$DATABASE_URL" -v owner_email='…' -f supabase/luna-owner-setup.sql`
   (SQL editor: paste it and replace `:'owner_email'` in the editor only). The final `select` must return exactly one row.
5. Storage → Settings: the project's global upload limit must be ≥ 50 MB (Free plan default is 50 MB). Bucket limits are set by the migration (sources 50 MB, pages 15 MB).
6. Check: sign in as the owner → Hesabım shows "Bu hesab Luna redaktorudur" → Redaktor paneli. Sign in as any other account → the panel is refused.

Revoke an editor: `delete from public.luna_editors where user_id = '<uuid>';` (effective on the next request).

## Architecture

```
Editor's browser ──(JWT)──► Postgres RPCs (SECURITY DEFINER, check luna_is_editor())   metadata, revisions, publish
      │                     Storage (RLS on storage.objects)                            pages (POST), original file (TUS)
      │  PDF.js / fflate locally: inspect → render/extract → decode → re-encode WebP
Visitor's browser ─(publishable key)─► rpc/luna_catalogue  → published titles, readable page paths only
                                      ► storage sign        → 3 h signed URLs (RLS decides what can be signed)
```

No Vercel function is involved: large files go straight from the browser to Supabase Storage, so Vercel's ~4.5 MB request body limit never applies. Authorization is enforced by Postgres (verified Supabase JWT → `auth.uid()`), not by hiding UI.

| Piece | File |
|---|---|
| Migration (tables, RPCs, buckets, storage policies) | `supabase/luna-publishing.sql` |
| Owner provisioning | `supabase/luna-owner-setup.sql` |
| Editor panel (lazy, editors only) | `storefront/Luna/src/editor.js`, `editor.css` |
| Page preparation (PDF.js, archives, raster) | `storefront/Luna/src/importer.js` |
| Pure import rules (signatures, ZIP reader, limits, validation) | `storefront/Luna/src/import-core.js` |
| Direct uploads (POST + resumable TUS) | `storefront/Luna/src/upload.js` |
| Public catalogue + signed URLs (plain fetch, no supabase-js for visitors) | `storefront/Luna/src/remote.js`, `published.js` |
| Shared config | `storefront/Luna/src/config.js` |
| PDF.js self-hosting | `scripts/vendor.mjs` → `/Luna/vendor/pdfjs-6.4.299/` (worker, cmaps, standard fonts, ICC, non-wasm JPX/JBIG2 decoders) |

### Schema

- `luna_editors(user_id, role, note, granted_at)` — RLS on, **no grants** to anon/authenticated: only the postgres role writes it. `luna_is_editor()` = signed in, not an anonymous guest, row present. `user_metadata`/`app_metadata` are never read.
- `luna_comics` — stable `id` (client-generated UUID, so retries never duplicate), `slug` (unique, `pepper-carrot-*` reserved, **permanent after the first publication** so saved libraries and links keep working), metadata, `access free|paid`, `is_sample`, `price` (AZN), `preview_pages`, `status draft|published|unpublished`, `draft_revision`, `published_revision`.
- `luna_revisions` — one import or one page-order edit: `uploading → ready | failed`, later `superseded | discarded`. Original file path in `luna-sources`.
- `luna_pages(revision_id, position, path, width, height, bytes)` — the ordered manifest. Revisions are immutable once ready; reordering/removing/cover changes create a new "edit" revision that reuses stored pages.
- Tables: RLS on, editors may `select`; nobody gets insert/update/delete — all writes go through the RPCs, each starting with `luna_require_editor()`. Supabase's default `public` grants are explicitly revoked (the test stub recreates those defaults to prove it).

RPCs: `luna_editor_me`, `luna_editor_list`, `luna_editor_get`, `luna_save_comic`, `luna_begin_revision`, `luna_finish_revision` (verifies every page, the cover and the source exist in Storage), `luna_fail_revision`, `luna_discard_revision`, `luna_publish` (validates; errors are listed in Azerbaijani), `luna_unpublish`, and public `luna_catalogue`.

### Storage and exact access

Buckets `luna-sources` (50 MB, PDF/ZIP/CBZ MIME only) and `luna-pages` (15 MB, WebP/JPEG/PNG only), both **private**.

| Who | Can read (sign) | Can write |
|---|---|---|
| Anonymous visitor, ordinary member, anonymous guest | Cover + **all pages of published free titles**; cover + **first `preview_pages` of published paid/sample titles** | Nothing |
| Editor | Everything in both buckets (draft preview) | Only `‹comic›/‹revision›/(pNNN.ext \| cover-*.ext \| source.ext)` of a revision that is still `uploading`; never an object used by a published revision (overwrite/delete refused) |

Visitors never receive non-preview paths (`luna_catalogue` trims them) and could not sign them anyway: signing goes through the same RLS check. Public URLs don't work (private bucket); original files, drafts, failed imports and unpublished titles are not signable by non-editors. Signed URLs last 3 hours; the reader re-signs silently when a page fails to load, so long reading sessions keep working.

### CSP

Only Luna's routes (`/Luna`, `/Luna/(.*)`) get a separate policy, identical to the site policy plus `img-src blob: https://yxiedrrahclzqukfnqrn.supabase.co` (signed pages, local thumbnails) and `worker-src 'self'` (self-hosted PDF.js worker). No `unsafe-inline`, `unsafe-eval` or `wasm-unsafe-eval` (PDF.js runs with `isEvalSupported: false, useWasm: false`). The site-wide rule now excludes `Luna`; everything else is byte-identical.

## Formats and limits

| Input | Rules |
|---|---|
| PDF | 1 file ≤ 50 MB, ≤ 300 pages, not password-protected (clear error), malformed PDFs refused. Each page is rendered one at a time to an image: portrait pages fit 1600×2600 px, landscape/double pages 2600×1600 px (text stays legible at the reader's 260 % zoom). Page ratio ≤ 1:4. |
| CBZ / ZIP | 1 archive ≤ 50 MB, ≤ 300 images, ≤ 1000 entries, ≤ 400 MB declared expanded, ≤ 25 MB per image, ratio ≤ 100:1. Strict central-directory parser: rejects ZIP64/multi-disk, encryption, unknown compression, `..`/absolute/backslash/control-char names, symlinks, duplicate names, overlapping entries, nested archives, non-image files (ComicInfo.xml, `__MACOSX`, `.DS_Store`, `Thumbs.db` are skipped). Inflate is capped at the declared size (lying bombs stop) and CRC-checked. Files are natural-sorted (2 before 10). |
| JPG / PNG / WebP | ≤ 300 files, ≤ 25 MB, ≤ 12000 px per side, ≤ 50 MP, ratio ≤ 1:4. Natural filename order. |
| Every page | Magic bytes checked (a renamed HTML/SVG/EXE is refused), header dimensions read, the image actually decoded (`createImageBitmap`) and the decoded size must match, then **re-encoded** to WebP (JPEG on Safari, which cannot encode WebP). Raster pages are never upscaled; total decoded pixels per import ≤ 3 GP. |
| Not supported (explicit message) | CBR/RAR, CB7/7z, EPUB, GIF, BMP, SVG, HEIC, TAR/GZ. |

## Import lifecycle

1. *Yeni əsər* creates a draft record (id remembered until the server confirms, so a double click or network retry cannot duplicate it).
2. Choose or drop files → local inspection (format, size, page count, password) **before anything is uploaded**; problems are listed per file.
3. *İdxala başla* → `luna_begin_revision` → pages are prepared sequentially while two uploads run in parallel (each retried 3× with backoff); the original PDF/CBZ goes to the private bucket via resumable TUS (6 MB chunks). Separate progress bars: preparation, page uploads, source bytes; thumbnails appear as pages are ready.
4. Cover = page 1 by default (1100 px + 560 px versions, tone colour from the artwork) → `luna_finish_revision` verifies every object server-side → draft ready.
5. **Cancel** aborts rendering and uploads, marks the revision failed, deletes its objects (`luna_discard_revision` returns only unreferenced paths). **Failure** shows the reason and *Yenidən cəhd et*: the same revision is reopened and only pages not yet prepared/uploaded are processed; metadata is untouched. A failed import is never published and never replaces the live version.
6. *Səhifələr*: move pages with ← → buttons (keyboard) or drag (desktop), remove/restore, pick a page as cover or upload a cover image; *Dəyişiklikləri saxla* creates a new draft revision.
7. *Məlumat*: title, other title, slug, series/episode, creator, synopsis, language (+note), genres, credits, rights statement, year, free vs *Satışda (WhatsApp sorğusu)* with AZN price and preview pages, optional *nümunə məhsul* (illustrative price, not on sale). Own works never get the Pepper&Carrot attribution.
8. *Ziyarətçi kimi önizlə* opens the draft in the real reader exactly as visitors will see it (paid: preview pages then the preview end); *Bütün səhifələr* shows the whole draft to the editor.
9. *Dərc et* → the title appears in "Luna-da yeni", the catalogue, search, `/Luna?eser=slug`, reader deep links, library and resume — no code change or redeploy. Editing a live title's metadata is applied immediately but refused if it would make the title invalid. A new import or page edit stays a draft (site keeps the old version) until *Yeni versiyanı dərc et*.
10. *Dərcdən çıxar* is reversible (records and files kept; *Yenidən dərc et*). Permanent deletion is not offered. *Versiyalar → Təmizlə* deletes files of failed/superseded revisions that nothing else uses.

## How the owner uploads a real comic

Hesabım → **Redaktor paneli** → **Yeni əsər** → drop the PDF (or CBZ, or the page images) → **İdxala başla** and wait for "Hazırdır" → check order and cover → fill *Məlumat* (title, author, synopsis, genre, rights statement; for a paid title the AZN price and number of free preview pages) → **Məlumatı yadda saxla** → **Ziyarətçi kimi önizlə** on phone and desktop → **Dərc et**.

## Payments

Unchanged scope: no checkout, no entitlements. Paid owner titles show "Satışda, N AZN", the free preview, and a **WhatsApp purchase-inquiry draft** to the existing number (`wa.me/48571572697`) stating the title and price. The text and dialog say that no payment is taken on the site and that sending the inquiry does not unlock anything. Nothing in the browser can unlock pages: they are not signable.

## Verification (3 Nov 2026)

- `npm run build:web`; `npm test`: **73 passing** (50 baseline + 14 import/manifest/CSP + 9 database authorization/publication tests).
- `tests/luna-db.test.mjs` runs the real migrations in PGlite (Postgres 17 in WASM) with Supabase's roles, default grants and an RLS-protected `storage.objects`: owner provisioning (unconfirmed/unknown/anonymous refused), members with forged `user_metadata`/`app_metadata` admin claims refused, anon/guest refused, helper functions not callable, upload path/state rules, finish verifies objects, catalogue/storage exposure for free/paid/sample, immutability of published objects, replace-keeps-live, reorder, cross-comic borrowing refused, cleanup, unpublish/republish, slug rules, library compatibility, revocation.
- `node scripts/luna/e2e-publishing.mjs` (Chromium, built site served with the production CSP by `scripts/luna/preview.mjs`): **50/50 checks**. Backend = `scripts/luna/mock-supabase.mjs`, a **local stand-in**: auth, PostgREST and Storage HTTP layers are re-implemented, while the database decisions are the real SQL in PGlite. Covers: guest/member refusal (UI and direct API), rejection of renamed HTML, RAR, traversal, nested archive, password PDF, corrupt PDF, 51 MB file, zip bomb (stopped during extraction and cleaned), cancel with cleanup, PDF import with a simulated storage outage then retry without duplicates, mixed portrait/landscape PDF, metadata persisted in the database, keyboard reorder + cover, draft preview spread, publish, second device (iPhone 13 viewport) catalogue/detail/reader/swipe/zoom/reload-resume/library, paid preview end + WhatsApp draft, refused signing of non-preview pages/original/public URL, raster import in natural order with a wide page in a desktop spread, editor at 390/320 px without overflow, unpublish hides title and pages while keeping records, no console errors or CSP violations.
- **Live backend:** only read-only checks were possible (not-installed responses above). The full flow has not yet run against the production Supabase project — that is the first thing to do after step 4 of the release setup.
- Screenshots: `docs/luna-shots/publishing/` (all from the local stand-in).

Fixtures (`tests/fixtures/luna/`, ~200 KB) are drawn by `scripts/luna/make-fixtures.py` (Pillow/reportlab/pypdf); no third-party art or manuscripts.

## Remaining limitations

- Backend setup and owner grant must be applied by someone with database access (see above); the end-to-end run against real Supabase Storage (TUS endpoint, signing) is therefore still pending.
- Conversion runs in the editor's browser: a 300-page PDF on an old phone is slow; a laptop is recommended for big files. Closing the tab mid-import leaves an *uploading* revision that can be cleaned in *Versiyalar*.
- No image transformations (paid Supabase feature): editor thumbnails load full pages lazily.
- Safari stores pages as JPEG (no WebP encoder).
- Original sources of raster uploads are not kept separately (the re-encoded pages are the archive); PDFs and CBZ/ZIP originals are kept privately.
- Unpublished titles disappear from visitors' libraries views (the library entry stays and works again on republish).
