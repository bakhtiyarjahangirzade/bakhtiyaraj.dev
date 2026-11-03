# BAKHY concept collection — Claude Cloud commission

## Current user request, 3 November 2026
Develop in Claude Code CLOUD using the user's open Samir account. All concept websites and applications in the bakhtiyaraj.dev catalogue look standard, simplistic and AI-generated to the user. Raise the entire collection to a distinctive professional studio standard: strong art direction, rich relevant content, refined graphics, interaction and motion. They explicitly do not want ordinary templates, basic illustrations or cosmetic-only redesigns. They authorize useful skills.

This is a complete redesign/implementation task, not a report or a prompt-writing exercise. Make reasonable design choices and carry all concepts through to completion. Work in the cloud repository; do not use Windows local paths.

## Repository and cloud handoff
- Repository: https://github.com/bakhtiyarjahangirzade/bakhtiyaraj.dev (public).
- Prepared working branch: claude/concept-art-direction, based on main commit 76594f54fe6c57f1abe462f5a7f7c2532db8d762. Fetch current main and integrate later changes normally, preserving user work.
- Skills installed in this branch: .claude/skills/frontend-design (official anthropics/skills, pinned source ca45fc496a3436251f191354091d557da31c15b5, license retained), and .claude/skills/bakhy-concept-craft (project-specific).
- Read both skills, storefront/DESIGN.md, storefront/UX-CONTRACT.md and current source. Existing older root handoff documents may have obsolete file inventories/commits; current code is the implementation evidence. Do not reset main to an older handoff commit.
- Cloud GitHub identity: samirgulamzada-dev. The owner approved a WRITE collaborator invite for this repository only. Accept/link through normal GitHub/Claude UI, never request or expose host tokens or private keys. No other account or repository access is required.
- Work on the prepared branch, or a Claude-generated branch descended from it. Push and create a PR to main. Do not automatically merge the PR or expose real customer data. This reviewable PR is the completion handoff for this Samir cloud task; deployments from main remain the owner's release path.
- Do not alter the old chatgpt.site copy. Production is https://www.bakhtiyaraj.dev.

## Scope inventory, verify against source
Original concepts: casa/Casa Forma (architecture), olio/Olio (restaurant), aurea/Aurea (hotel), forma/Forma Store (commerce), atelier/Atelier No.8 (creative portfolio), flow/Flow CRM, reserve/Reserve (booking), stock/Stockroom (inventory).
Additional showroom IDs in showroom-copy.js and showroom.js: clinic (Sunny Kids), wealth (Growly), gym (Wolfpack), motors (AutoLane), give (Bir Sufre), stream (Arena), bazar (Bazarliq), avto (Yolda), lal (Cibde), estate (Unvan). Use actual locale spellings in source, not these ASCII spellings. Inspect dynamically exported IDs to avoid omissions. Velvet is explicitly a vitrine concept while its domain was coming soon; preserve that honest distinction and improve its concept presentation if included.

Savor, IsoClub and Promo X are real external portfolio projects. Do not replace their real screenshots/content with invented projects. Existing working apps and services (including KuryeBro, Authentic, games and account/admin functionality) are not permission to rewrite production business logic. The focus is the catalogue's conceptual websites/app demos and their previews, plus necessary cohesion in the hosting portfolio.

## Important current files
- storefront/src/projects.js: project index, identity and preview metadata.
- storefront/src/concepts.js: original concept data.
- storefront/src/concept.js: concept page, renderConceptHtml, static-generation interface and concept IDs; read all exports before restructuring.
- storefront/src/showroom.js, showroom-copy.js: ten additional concepts, copy/localization metadata.
- storefront/src/concept.css and showroom.css: existing demo styles.
- storefront/src/showcase.js, main.js, landing.css: catalogue/project previews and navigation.
- storefront/src/i18n.js, i18n/strings.js; scripts/i18n-pages.mjs: AZ/RU/EN and generated localized pages. Preserve current locale behavior and routes.
- storefront/src/product-data.js, product.js, product.css: canonical service choices, price calculations and review/WhatsApp workflow.
- storefront/vite.config.mjs: multi-entry build, plus budgettracker entry. Preserve other entries.
- public/: existing tools, games, APIs, apps and legacy lab; never replace this whole directory to ship the storefront.

## Art-direction starting hypotheses, not templates
Architecture: a spatial/editorial project archive with architectural details, big image rhythm, material palettes and case studies. Restaurant: a strong food identity, menu hierarchy, seasonal dishes, atmosphere and reservation flow. Hotel: stay/room storytelling, selected dates, room comparison and useful amenities. Commerce: retail-quality collection grid, carefully shot products, product detail/variants/cart. Creative portfolio: distinctive visual thesis, varied project pacing and a real project narrative.
CRM: a legible operating tool with useful records, pipeline, contextual action and consistent sample data. Booking: timeline/calendar and actual appointment flow. Inventory: meaningful inventory/stock movements with status and search. Other concepts need equally deliberate treatment suited to their users: no single generic dashboard reskin for them all.
These are directions to investigate. Choose the strongest outcome for each concept; do not impose an unrelated aesthetic on every project.

## Preserved commercial and identity constraints
- Main audience Azerbaijan; AZN; current AZ/RU/EN locale support.
- Website from 199 AZN, custom systems from 799, integrated site+system from 1599. Print design from19 and one simple video edit from9 remain secondary. Add-on rates canonical in product-data.js (page29, language49, module149 etc.).
- Service purchase flow: view product, customize, see updated estimate, review choices, then manually continue to WhatsApp +48 571 572 697. No public email supplied. Do not invent it, implement checkout or send messages automatically.
- The approved studio shell is inspired by https://dovvstudio.com/: holographic accents, strong typography, sophisticated project presentations, coherent outline navigation, clear three-card pricing, intrinsic footer-logo hitbox, no green B circle. Preserve these user decisions while improving visual consistency. The request is especially to upgrade concepts, not revert the studio to a generic agency template or the rejected 3D museum.

## Execution and acceptance
1. Audit current live/catalogue and source; enumerate every concept and its primary journey. Build docs/concept-upgrade-matrix.md with per-concept diagnosis, chosen visual thesis and completion state.
2. Establish per-concept art direction and an asset plan, then implement substantial full-page content and working demos. Refactor into coherent modules when needed, without a framework migration solely for style.
3. Use existing runtime/tools. When needed, source licensed assets, local fonts or maintained libraries, retaining provenance. Do not ask for paid services/keys to substitute for basic execution. If image tools are unavailable, use carefully art-directed legitimate assets rather than fake generated placeholders.
4. Update real catalogue screenshots/previews from the implemented pages. Keep concepts labeled as concepts, sample data honest and real portfolio projects real.
5. Test all concepts, not only one. Capture desktop/mobile plus the primary interaction and empty/error state. No dead major CTA, no layout overflow, no broken asset, no unreadable data graphics, no forgotten lower half of a page, no identical branded reskins.
6. Run npm ci and relevant tests, npm run build:web, and the locale/static generation. npm run build:web skips existing desktop installers. Serve the built dist for actual browser testing (root npm run dev serves legacy public, not the storefront). Track any pre-existing failures distinctly.
7. Commit coherent changes, push the branch and return a PR with visual proof and a truthful coverage matrix. If context gets long, persist findings and next steps in the matrix and continue; do not declare all work complete because the first batch looks good.

Do not claim an objective 'best site in the world'. Deliver visible improvements and concrete verification. User-facing status should be concise Turkish/Azerbaijani.
