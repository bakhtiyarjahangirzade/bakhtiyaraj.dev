---
name: bakhy-concept-craft
description: Redesign BAKHY catalogue concept websites and app demos with distinct art direction, substantial domain-specific content and working prototype flows. Apply to concept.html/showroom work, not unrelated production apps or infrastructure.
---

# BAKHY concept craft

Use this with the bundled frontend-design skill. Read docs/cloud-concept-upgrade.md for the current task and storefront/DESIGN.md and UX-CONTRACT.md for preserved product contracts.

## Design each product as its own commission
Before coding a concept, record its audience, primary task, narrative, palette, typography, image direction and distinguishing interaction in docs/concept-upgrade-matrix.md. Keep it brief and concrete. Do not generate the same hero/cards/testimonial/footer structure with different brand names. A clinic, architectural portfolio, marketplace and CRM have different information density, trust requirements and navigation needs.

Prefer subject-specific composition and original details: real spatial photography for architecture, food/menu storytelling for a restaurant, precise schedule and occupancy interactions for booking, real product inventory and comparisons for commerce. Let decisions come from what people do in the product. Avoid a page of interchangeable feature cards, vague slogans, decorative graphs, floating blobs, generic gradient meshes or simplistic SVG stand-ins used as the main artwork.

Art direction includes the lower page and all key states. Design typography as a system with deliberate headings, body, labels, data and captions, including Azerbaijani glyphs. Do not reduce a redesign to changing colors, increasing radii or swapping a hero image.

## Content and imagery
Write concrete copy appropriate to each domain: named offerings, meaningful product attributes, useful filters and credible operating detail. Copy must say what the visitor can do. Avoid inflated claims, generic AI prose, invented client endorsements, medical outcomes, financial promises and real-looking unverifiable business statistics. Mark sample data and fictional brands as demos where needed, without turning each screen into an implementation disclaimer.
Use images with deliberate crops and a coherent art direction per concept. Source from official assets or appropriately licensed sources, keep provenance and bundle optimized files locally to satisfy the existing CSP. Image generation is optional only when a real tool is available; never claim generated assets exist without producing them. No broken hotlinks or giant base64 images. For data graphics, use meaningful sample data consistently across views and draw functional charts, not decoration.

## Build a product, not a poster
Each concept needs a short, complete user journey appropriate to its category: filters and detail view; menu and reservation request; room/date selection; catalog/cart; CRM search/status/edit; calendar/booking; inventory/stock movement; list/map toggle; comparison; saved items. The path should be responsive and usable with keyboard and touch. Confirmations, empty results, validation and reset must make sense. Prototype local state is fine; do not imply real payments, bookings, medical advice or production synchronization.

Keep each concept independently styled and maintainable. Use scoped styles/modules rather than adding collisions to one global stylesheet. Retain stable project IDs, links, localization, back navigation and the connection to the canonical product configurator. Update catalogue previews to represent the implemented design faithfully, not a different stock mockup.

## Motion and verification
Choose motion that explains hierarchy or interaction. Avoid excessive entrances, scroll hijacking or animating every element. Prefer compositor properties; pause ambient effects offscreen/hidden and support reduced motion. Preserve focus and layout during transitions.
Inspect each concept on desktop and a narrow phone, including its primary completed flow and an empty/error boundary. Capture before/after and interaction screenshots. Check typography, crop quality, contrast, overflow, real link targets and console errors. A build pass is necessary but does not prove visual quality. Revisit a concept if its brand name could be swapped with another concept without changing the page structure.

Use an honest completion matrix. A concept is complete only after its main/lower content, key interaction, catalogue preview and mobile layout have been verified. Do not stop after the first impressive hero or silently leave the remaining concepts unchanged.
