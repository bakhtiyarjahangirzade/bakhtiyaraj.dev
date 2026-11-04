# BAKHY — professional web-services business upgrade

## Commission, 3 November 2026

The owner wants the site to feel like the work of an accomplished website and systems specialist with ten years of professional maturity. Treat this as a quality standard, NEVER as permission to invent years of experience, degrees, internships, team size, certificates, customer counts, testimonials or results. Think as the owner selling these services: every section must help a serious buyer understand, trust, compare or configure the work.

Implement the improvements fully, not just an audit or suggested copy. Make informed design decisions independently. Deliver a tested pull request; do not merge it yourself.

## Repository and baseline

- Production: https://www.bakhtiyaraj.dev, repository bakhtiyarjahangirzade/bakhtiyaraj.dev.
- Prepared branch: `claude/studio-business-upgrade`, based on merged main `105a69a97421f4ae7bf83995350e14c33dea4f49`.
- PR #1 (the 18-concept collection) is already merged and published. Preserve it. This task primarily improves the main business website and buyer journey, not another wholesale rewrite of all concept demos.
- Read this brief, `storefront/DESIGN.md`, `storefront/UX-CONTRACT.md`, `.claude/skills/frontend-design/SKILL.md`, `.claude/skills/bakhy-concept-craft/SKILL.md`, and current code. Existing source and this new brief override obsolete inventories or baseline commits in older handoffs.
- Work in Claude Cloud with the existing repository access. Push this branch or a new descendant branch and open a PR to main. No other repository permissions, host credentials, purchases or paid add-ons are required.
- Do not update the old chatgpt.site copy, production account/admin/auth logic, Supabase, unrelated apps/games or deployment configuration for this design task.

## Business direction and priorities

1. **Positioning.** Speak plainly to Azerbaijani business owners buying a website or operational system. Explain who it serves, what the client receives, and how to start. Mature, specific, confident copy; no generic AI superlatives or invented agency history. Azerbaijan is the primary market, AZN the currency, Azerbaijani the primary language. Preserve complete English/Russian support and correct Azerbaijani characters.
2. **Proof before persuasion.** Feature Savor, IsoClub and Promo X as real work using genuine project assets and source-verifiable descriptions. Present useful case details: client context, implemented scope, design decisions, functions, own contribution when evidenced, actual screenshots and external link. Do not invent conversion lifts, revenue, clients' quotes or business outcomes. Velvet stays explicitly a concept until evidence says otherwise. Separate real work from conceptual demonstrations clearly.
3. **A deliberate homepage.** Build a coherent sequence: precise offer, selected proof, service choices, useful process, configuration entry, answers to buying concerns and contact. Curate rather than showing an undifferentiated wall of equal cards. Make hierarchy, typography, spacing and transitions feel authored. Inspect existing sections before choosing what to keep, condense or restructure.
4. **Services with understandable scope.** Websites start at 199 AZN, custom systems at 799 AZN, website + integrated custom system at 1599 AZN. Print design (19 AZN) and a simple single-video edit (9 AZN) stay secondary, not the lead offer. Preserve the canonical add-on pricing and calculations already implemented. Clearly show what a starting package includes and which selections increase it; keep home, service, product, review and FAQ copy consistent. Do not silently invent support durations, revision quotas, guarantees, hosting prices, refunds or new binding commercial policies. Use established repository facts; record unknown commercial details separately without blocking useful implementation.
5. **A buyer journey, not an immediate quote wall.** Keep the retail-like product/configuration flow: see starting price, choose service/design, select pages/languages/modules, understand each addition, review scope and running estimate, then contact. Selected demo references and deep links must remain functional. Provide concise help for nontechnical buyers, sensible defaults, validation, back navigation and a readable final summary. WhatsApp: +48 571 572 697. No invented email address, automatic messages, payments, tracking or fake checkout success.
6. **Credible delivery.** Explain brief, design, implementation, checking and handover in practical deliverables and client responsibilities. Respect the owner's one-week delivery target for the agreed scope; do not add impossible universal guarantees for arbitrary system complexity. Show how scope and assets are agreed. Avoid pretending policies or timelines have been contractually confirmed when they have not.
7. **Catalogue as a sales tool.** Distinguish real projects, website concepts and system demos. Let buyers understand sector/use case and follow a preview into a relevant configuration. Keep all 18 new concepts, routes, IDs, translations and working interactions. Improve selected inconsistent stock photography where genuinely necessary, particularly Forma's product-image coherence, Aurea's courtyard and Wolfpack's limited image range. Subject relevance and honest visual quality beat random decorative photos.

## Art direction and interaction

Professional craftsmanship, not a template with more decoration. Continue the approved Dovv-inspired direction while making it BAKHY's own: decisive typography, disciplined grids, confident editorial composition, relevant photography, legible contrast and restrained holographic accents. Preserve the approved pricing emphasis (including the light middle card), intrinsic footer wordmark hitbox and useful process motion. Fix weak icons with a consistent well-drawn set. No rejected green B-circle, gratuitous 3D museum, gradient blobs, generic SaaS card soup or decorative graphs with fabricated data.

Motion should explain process or provide feedback, work with pointer and keyboard, and respect reduced-motion. Good focus states, navigation and readable mobile content are part of visual quality. Avoid animation that competes with buying decisions. Never hide essential information behind hover alone.

## Working method and acceptance

- First inspect the actual current site and source. Write a concise `docs/studio-business-upgrade-matrix.md` listing observed problems, chosen changes, affected routes, proof/unknowns and completion evidence. Then implement; do not stop at the matrix.
- Prioritize the complete public buyer journey and make changes cohesive across the relevant pages. Avoid framework migrations or unrelated technical churn. Reuse the existing canonical service/pricing data instead of creating divergent price tables.
- Capture real before/after screenshots at desktop and mobile. Check 320/390px, tablet and laptop layouts; no horizontal overflow, obstructed controls, unreadable pricing or oversized hitboxes. Test keyboard focus, dialogs, reduced motion, empty/invalid states and page loading.
- Verify catalogue -> real project/concept -> configuration -> reviewed estimate -> WhatsApp link. Inspect the destination/message without sending an actual message. Verify selection persistence, back navigation, languages, calculations and existing demo functionality.
- Review titles/descriptions, canonical URLs, hreflang, sitemap consistency, image sizing/loading, contrast and console errors on modified routes. Do not claim measured performance scores without recording an actual measurement.
- Run `npm ci`, `npm run build:web` and `npm test`. Existing baseline is 36 passing tests. Add meaningful regression coverage when logic changes justify it; do not write cosmetic tests that merely mirror markup.
- PR must explain the buyer-facing changes, evidence, screenshots, validation and honest remaining limitations. List any commercial facts still needed separately. Push implementation and open PR; never merge automatically.

## Review of the preceding collection task

PR #1 was accepted as a substantial improvement: distinct concept modules and art direction, local licensed fonts, credited photographs, real screenshot previews, working interactions, preserved routes/locales and canonical pricing. Build succeeded and all 36 tests passed. Independent browser sampling covered catalogue, Casa project dialog/focus return, Flow search/empty state/stage update, Forma variant/cart and Olio at 390px without horizontal overflow. This is sampled verification, not a claim that all interactions in all 18 concepts were manually audited. Some stock photography still needs stronger curation. Improve these limitations without discarding the accepted work.
