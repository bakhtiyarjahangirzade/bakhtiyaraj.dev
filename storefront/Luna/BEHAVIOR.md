# Luna Comics — behaviour contract

## Routes (query based, refresh-safe)

| URL | View |
|---|---|
| `/Luna` (canonical; `/Luna/` serves the same page) | Kəşf et: bento grid (featured tiles, authors, recent searches, menu) and the full catalogue |
| `/Luna#kataloq` | Shop scrolled to the catalogue |
| `/Luna?eser=<slug>` | Title page |
| `/Luna?oxu=<slug>` | Reader at the saved position (or the jacket) |
| `/Luna?oxu=<slug>&s=<leaf>` | Reader at a leaf: 0 = jacket, 1…n = pages, last = credits / end of preview. Out-of-range values clamp |
| `/Luna?bolme=kitabxana` | Library |
| `/Luna?bolme=hesab[&forma=qeydiyyat]` | Account (sign in / register) |

No personal data or entitlements appear in URLs. Unknown slugs show "Bu əsər tapılmadı" with a link to the catalogue.

## Reader

- Leaves: Luna jacket, every bundled page once in order, then a closing leaf (credits for free titles, "Önizləmə burada bitir" for samples).
- Mode: spread when the stage is ≥ 900 px wide and two pages fit at ≥ 360 px height (`chooseMode` in `core.js`); otherwise one page. Desktop users can force single pages. The current logical page is kept across resize, rotation and mode changes.
- Spreads: `[jacket]`, `[1,2]`, `[3,4]` … ; an odd final leaf is alone on the left.
- Input: Previous/Next buttons, ← → (and PageUp/PageDown, Home/End), page `<select>`, deliberate horizontal swipe (single pointer, ≥ 56 px, 1.6× more horizontal than vertical, < 900 ms, ignored while the browser is pinch-zoomed). Vertical scroll and pinch stay native (`touch-action: pan-y pinch-zoom`). Shortcuts are ignored while typing in inputs/selects or while a dialog is open.
- Turns: any new request finishes the running turn instantly, so rapid clicks never skip or duplicate pages. Reduced motion: immediate change.
- "Yaxından oxu" (readable zoom): one page in a scrollable pane at 150 % (desktop) / 200 % (phones), adjustable 100–260 %, page by page; double-tap/double-click a page opens it at that point. Escape leaves zoom, a second Escape closes the reader.
- Fullscreen button where the browser supports element fullscreen.
- Loading: current page eager with high priority, two before / three after preloaded; the storefront only loads small covers and (on the hero) one page. A failed page shows "Səhifə N yüklənmədi" with "Yenidən yüklə"; the position is kept.
- Status: "Səhifə 3–4 / 7" in an `aria-live` region; focus moves to the stage on open and returns on close.

## Discovery

- Catalogue: search field, segmented access control (Hamısı / Pulsuz / Nümunə), chip rows for language and genre (radio semantics), live count, empty state with reset.
- Genre and sample tiles apply the matching filter and scroll to the catalogue. Author avatars and search pills run a search.
- Recent searches (3+ characters, after a pause or Enter) are kept on this device only (`luna.searches.v1`, max 8) and can be cleared. Before any search the card shows fixed suggestions, labelled as such.

## Sample products

- Marked "Nümunə məhsul, satışda deyil" everywhere, price shown as "6 AZN — illüstrativ nümunə qiymət".
- Only the preview pages exist on the server; there is nothing to unlock in the browser.
- "WhatsApp-da maraq bildir" opens a dialog that shows the exact draft, then a link to `https://wa.me/48571572697?text=…`. Nothing is sent automatically; no order, payment or ownership is recorded.

## Library and progress

- Anonymous: `localStorage` key `luna.device.v1` (`{v:1, library:{slug:iso}, progress:{slug:{i,n,at}}}`), labelled "yalnız bu brauzerdə".
- Signed in with sync installed: Supabase tables `luna_library` / `luna_progress` (RLS, `supabase/luna.sql`), labelled "hesabınızla sinxronlaşdırılır". Device items are moved into the account on sign-in (toast says how many), then removed from the device. Account data is held in memory only.
- Signed in without the tables (current production state): status says sync is not installed and reading state stays on the device.
- Sign-out (or session expiry) drops account data from memory, so the next person on the device sees an empty or device-only library.
- Progress is normalised on read (clamped, integer, `done` on the last leaf).

## Account

Shared BAKHY Supabase auth (e-mail + password), Luna session stored under `luna.auth`. Persistent labels, password visibility toggle, client validation (e-mail format, 8+ characters for new passwords, acknowledgement that the BAKHY account also creates a games profile), pending/error/success messages, confirmation-e-mail message after registration (no fake login), sign-out, session-expiry message. Password reset is not offered. If the service cannot be reached the account page says so; free reading continues.
