# Product configuration UX contract

The marketing homepage uses the Dovv-led design in DESIGN.md. Product routes use one shared retail-style layout in product.html and src/product.js. A service card always navigates to a product page; it does not prefill or submit a lead. Portfolio/concept detail actions navigate to that same configurator with a known reference ID.

Canonical owners:
- Product records, base prices, extra rates, option IDs, normalization and arithmetic: src/product-data.js. Prices approved: 399/1399/1599/19/9 AZN; additional rates delegated by the user and recorded in that module.
- Forms/selects: native inputs, checkboxes and selects in src/product.js; native popup appearance is intentionally accepted. Fields have persistent labels, native keyboard behavior, bounded enums and quantities. No required personal details or browser validation bubbles in product flow.
- Product state: non-personal choices in URL query parameters via replaceState, normalized on entry. Browser back/forward and shared links restore selections. Invalid enums and quantities fall back or clamp. Unknown references/options are discarded. Customer name and notes remain page-memory fields and are never serialized into the page URL.
- Price: one pure calculate function supplies breakdown, live total, sticky header, review and WhatsApp draft. All five services use the same calculation model. Video quantity multiplies the full per-video price. Discounts, tax rules, payment or recurring billing are not inferred.
- Dialog: native dialog for final review, Escape and close/edit return focus to its trigger. No submission/payment occurs on opening review. The final WhatsApp anchor opens a prefilled draft for the user to review/send.
- Feedback: a polite atomic live output announces the total; no toasts or alerts. Selections retain focus; updating the price does not rerender the form.
- Reset: defaults for the selected service, preserving a known portfolio reference. Keeps focus on reset and updates total, URL and previews.
- Scrollbars, typography, focus: shared style.css/theme.css; product.css adds layout. Product form scrolls with the document; gallery alone is sticky on desktop. No fixed-height wrapper clips options. Mobile is a single natural-height column with a persistent header price.

No automatic messages, checkout, uploads, account or customer-data storage is added. Print/video are secondary, collapsed homepage services. Their product pages remain directly usable.

### Studio catalogue route
Home exposes four selected project previews; `/catalogue.html` owns the complete 12-project filter/search experience. Shared showcase cards open the existing detail dialog. Escape/close restores trigger focus; customization carries the known project reference into product.html. This presentation change does not change pricing or dispatch WhatsApp messages automatically.


## Print shop exception — 11 November 2026 (supersedes legacy print configurator)
- Canonical catalogue/prices/calculation: src/print/model.js; localized copy: src/print/copy.js; static renderer: src/print/render.js; interaction: src/print/app.js; scoped styles: src/print/style.css. Vite entry print-shop.html is localized by scripts/i18n-pages.mjs into /az|ru|en/services/print.html. Legacy product?service=print redirects to the shop, mapping known print types.
- Card tier selector and add-to-bag button support repeated/multiple configurations. Native dialog configures package, independent design quantity, page count or dimensions, and people where applicable. Escape/close restores trigger focus. No custom select implementation.
- Bag is a versioned list of choices stored locally, never trusted prices. Recompute against current catalogue. Invalid/corrupt records are discarded, numeric values bounded, duplicate keys removed. Max 60 lines. Persistence failure keeps a session bag with visible explanation. Cross-tab updates are synchronized.
- Separate design quantity from people: first person included; +10% of tier base for every additional person per design. 20 AZN × 1 design × (1 + 0.1 × (2−1)) = 22 AZN. Every line can change tier, quantity, people, pages/dimensions directly at checkout; remove offers undo. Zero, fractional counts and out-of-range fields block enquiry until corrected.
- Optional names/company/person details/brief remain in memory, absent from local storage and URLs. Only choices persist. All display text and message text are escaped/encoded. WhatsApp receives a draft only after user clicks; we do not send it. No payment capture or claim of placed order. Long messages offer copy/paste, no silent truncation.
- Search/category filters have pressed and empty/reset states; add/remove/total feedback uses polite live regions. Visible focus, native fields/dialog, 44px controls, document scroll, reduced-motion and 320px layout supported. No fictitious customer reviews.
