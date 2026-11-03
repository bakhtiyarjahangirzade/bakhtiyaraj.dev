# Luna release review — 3 November 2026

Owner approved the current visual design and requested review and publication. Reviewed PR #2 at 79e7d4a514882d5b45cf555f020c7714ef9233a7, preserving its design.

## Independent checks

- Clean dependency install and `npm run build:web` succeeded. All 50 repository tests passed.
- Built application served with production CSP and `/Luna` rewrites using `scripts/luna/preview.mjs`.
- Desktop shop -> free reader: actual illustrated pages, facing-page layout, first/last bounds, fast successive next commands and preserved page in library.
- 390px phone: resume on page 3, single-page view, 200% readable zoom and controls. No horizontal overflow. 320px shop/search also had no horizontal overflow.
- Saved title appeared in library with progress and a correct resume link. Search no-results state provided a working direction/reset action.
- Account forms: empty sign-in and registration fields show errors; registration requires the shared-account acknowledgement. One deliberately invalid sign-in against the real auth endpoint returned the localized wrong-credentials message. No real registration email was sent and no end-to-end email confirmation/successful member login is claimed by this review.
- Sample title detail states that price is illustrative and it is not on sale. Preview stops after bundled pages; inquiry dialog contains the intended title and correct WhatsApp draft destination. No message was sent and no payment was attempted.
- No browser console errors were captured in sampled flows. Initial image-loading screenshots were rejected and recaptured after images loaded.

## Release setup and correction

Installed the two Luna tables on the existing `bakhy-dev` Supabase project. Added explicit non-anonymous-session guards to update/delete policies as well as select/insert, preserving row ownership and existing apps. Verified two RLS-enabled tables, eight policies and correct grants. Transactional database checks verified own-user reads/writes and rejection of cross-user and guest-session visibility; all test data rolled back. No shared auth triggers or existing app tables were changed.

## Evidence and limits

Own browser captures are saved in the task workspace `outputs/luna-review-01-shop.png`, `luna-review-02-reader.png`, `luna-review-03-mobile.png` and `luna-review-04-inquiry.png`. These are separate from the author's PR screenshots.

This is sampled independent verification alongside the 50 automated tests. Email delivery/confirmation and full signed-in cross-device UI synchronization were not manually exercised with a real user account. Paid titles remain explicitly illustrative sample products; no payment provider is configured. The author-site license statement was independently checked at https://www.peppercarrot.com/en/about/index.html; bundled works remain credited and unmodified apart from format conversion.
