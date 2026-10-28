# Product configuration UX contract

The marketing homepage uses the Dovv-led design in DESIGN.md. Product routes use one shared retail-style layout in product.html and src/product.js. A service card always navigates to a product page; it does not prefill or submit a lead. Portfolio/concept detail actions navigate to that same configurator with a known reference ID.

Canonical owners:
- Product records, base prices, extra rates, option IDs, normalization and arithmetic: src/product-data.js. Prices approved: 199/799/1599/19/9 AZN; additional rates delegated by the user and recorded in that module.
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
