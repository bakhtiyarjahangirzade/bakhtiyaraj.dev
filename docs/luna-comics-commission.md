# Luna Comics — dedicated store and reading experience

## Owner commission, 3 November 2026

Build a fully implemented, distinctive comics storefront and reader at **https://www.bakhtiyaraj.dev/Luna**. Visitors must discover comics, preview them, read free comics and initiate purchase inquiries for paid titles. Include simple sign-in and registration. Both phone and desktop must feel like reading and turning actual pages. This is an additional real product, not another fictional catalogue concept.

The owner explicitly chose **verified freely usable works and clearly marked sample paid products for the first release**. No owner manuscripts/assets or paid catalogue have been supplied. Do not block on them, misrepresent placeholders as available merchandise, or collect money for samples.

## Cloud work and isolation

- Repository: bakhtiyarjahangirzade/bakhtiyaraj.dev. Start from prepared branch `claude/luna-comics`, based on main `105a69a97421f4ae7bf83995350e14c33dea4f49`.
- Another Claude task is improving the main studio buyer journey on `claude/studio-business-upgrade`. Do not change that branch or undo PR #1's 18 concepts. Keep Luna files isolated and shared changes minimal; fetch latest main and integrate normal concurrent changes when necessary.
- Read `.claude/skills/frontend-design/SKILL.md`, repository design/behavior documentation and actual build/server/auth patterns first. Establish Luna-specific DESIGN.md and behavior documentation near the implementation; Luna needs its own identity without changing the BAKHY studio theme.
- Implement, validate, push and open a PR to main. Do not merge or deploy automatically. Finish the actual product, not just a plan or mockup. No credentials, new paid services or unrelated repository access are required.

## Product and art direction

Luna is a digital comics bookshop with a tactile reader: confident publishing identity, strong illustrated covers, purposeful typography, curated shelves and quiet controls. Make it feel authored and desirable rather than an AI/SaaS template. Derive the palette, typography and composition from actual comic art; do not use generic gradient blobs, decorative dashboards or empty book-shaped rectangles. Use existing locally licensed fonts where suitable. Azerbaijani-first, correct characters, readable copy; retain the work's original language and clearly label it. Never fabricate Azerbaijani translations of comics.

Catalogue: curated featured work, clear free/sample-paid markers, title/creator/language/genre/page count, useful search and filters, meaningful no-results state. Detail: actual cover, synopsis, attribution/license/source, preview availability, reading action and price/status. Users can save a title to their library and resume reading with visible feedback. Do not claim purchased ownership without a real verified purchase.

Free comics should be accessible without forcing registration. A simple account can support a saved library and progress if backed securely. Explicitly communicate whether reading state is device-only or synchronized. Empty library gives an actionable path to the collection.

## Content and free-resource sourcing

Provide a modest, cohesive starter collection with actual legible comic pages and covers, not random stock photos, panel placeholders or invented reviews. Add a comics category/entry to the existing free-resources area if one exists; inspect its real canonical source and build path. If the current site lacks such an area, provide a clear free-comics collection within Luna and a minimal discoverable BAKHY entry, avoiding unrelated reorganization.

Verify the exact work/edition's redistribution and commercial-use permission from primary license/public-domain evidence before bundling. A free-to-read/download link or old publication date alone is insufficient. Record title, creator, edition, exact source, license, required attribution and asset paths in `docs/luna-content-credits.md`. Avoid recognizable copyrighted characters without permission. Prefer explicitly open-licensed work or original artwork with clear rights. Browse authoritative sources for the rights evidence. If external availability fails, use a genuinely original short comic with actual sequential panels and narrative, explicitly identified as a Luna sample; do not silently substitute blank pages. Keep local optimized assets and preserve page legibility; observe the production CSP.

Paid products: label all examples prominently as samples, use any prices only as clearly illustrative AZN examples. Provide preview and an inquiry/waitlist-style action that accurately describes its result. There is no payment processor or final paid catalogue yet. No fake card form, automatic payment, false order confirmation, unlocking by localStorage, or claim that a purchase succeeded. Contact can open a WhatsApp draft to +48 571 572 697 containing the chosen title; never send automatically. Document the future secure checkout/entitlement boundary separately.

## Reader — the signature feature

- Desktop: convincing book spread with cover, proper sequential ordering, spine/paper/shadow treatment and a page-turn animation. Phone: readable single page with appropriate proportions; no tiny forced double spread.
- Swipe left/right, visible previous/next buttons and left/right keyboard shortcuts. Ignore reader shortcuts while typing. First/last boundaries are correct, no missing/duplicated pages, especially for odd page counts and cover/spread transitions. Support direct page selection and readable page count.
- Preserve the current logical page when changing viewport/orientation or switching single/spread mode. Deep links and resume return to the correct location. Preview access ends at its real boundary and clearly offers the proper next action rather than revealing protected pages in a fake lock.
- Zoom/fullscreen or a practical fit/readable mode for text-heavy pages; keep navigation reachable. Support touch without disabling browser zoom or normal scrolling. Make swipes deliberate, do not turn on incidental vertical scroll or pinch.
- Motion should feel like paper without making the art unreadable: bounded duration, no huge layout shifts, robust rapid repeated clicks and interruption. Respect prefers-reduced-motion with a simple immediate/static transition. Expose accessible page status, focus, labels and a way out of reader mode; no keyboard traps or hidden essential actions.
- Load the current/adjacent page first, lazy load the rest; handle missing image/error with retry and retain location. No fetching the whole high-resolution collection on the storefront. Do not ship a large animation dependency without justification.

## Simple sign-in/register, honestly implemented

Inspect and reuse established secure server/auth patterns where appropriate. Do not store raw passwords or reversible passwords in localStorage, ship a shared frontend password, pretend device-local profiles are real authenticated accounts, or create a second incompatible auth system.

The repository has a shared Supabase auth integration and an existing handle_new_user trigger that also creates a game profile with initial chips. Inspect these interactions before choosing reuse; do not silently rewrite shared triggers or unrelated app policies. Do not expose secrets/service-role keys. User library/progress data requires user-scoped authorization/RLS, not just frontend filtering. Anonymous free reading must still work if account service is unavailable. If truly missing backend configuration requires owner action, complete the rest of the product, clearly show the account service's unavailable state, and document the precise configuration gap rather than faking login success.

Form behavior: persistent labels, password visibility, basic validation, pending/error/success, sign-in/register navigation, logout and session expiry. No invented password-reset delivery; only offer reset if actually supported. No payment entitlements or personal data in URLs. Shared-device logout should leave no other user's library exposed.

## Routing and integration

The exact `/Luna` path must work with direct navigation and refresh in production. Choose one canonical casing/slash convention and make `/Luna`, `/Luna/` resolve consistently. Any nested title/reader routes must work on refresh or use a reliable query-based scheme. Inspect Vite multipage entries, static copying, i18n generation, sitemap and Vercel before changing build inputs. Do not broaden CSP globally to work around an asset issue. Keep inline scripts/styles compatible with existing CSP.

Do not change BAKHY service prices, primary studio layout, concept IDs, existing account/admin or unrelated app functionality. Add a small appropriate entry to Luna where discoverable. Existing AZ/RU/EN studio builds must keep passing; isolate Luna language strategy so current translation completeness rules remain honest.

## Acceptance and handoff

Write `docs/luna-implementation.md` recording architecture, rights evidence, content import format, auth/storage behavior, payment limits, routes and verification. Make it straightforward to add a real comic later (title, cover, ordered page manifest, price/access, preview count, credits), with one canonical catalogue source.

Run npm ci, npm run build:web and npm test, adding meaningful tests for page indexing/spread transitions, preview boundaries, catalogue filtering/manifest validity and progress normalization. Baseline has 36 passing tests. Test browser desktop plus 390px and 320px: discovery -> detail -> preview -> free full reader -> page turn/swipe -> resume -> library, account success/error where configured, logout, direct reload and WhatsApp draft URL without sending. Test reduced motion, keyboard, zoom, odd final spread, fast navigation and missing image. Check production CSP compatibility, no horizontal overflow or console errors, and asset payloads. Save actual screenshots of desktop shop and open reader plus mobile reader.

Push complete implementation and open a reviewable PR. Explain what is functional, exact account backend status, sample-sale limitations and validation. Do not claim deployment, payments or authentication work unless verified.
