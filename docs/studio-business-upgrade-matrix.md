# Studio business upgrade — problem and completion matrix

Brief: `docs/studio-business-upgrade.md` (3 November 2026). Baseline: main `105a69a`, inspected as a local production build (`npm run build:web`) and the live project domains on 3 November 2026. Before/after screenshots: `docs/business-shots/`.

## Observed problems → changes

| # | Observed on baseline | Route(s) | Change | Evidence of completion |
|---|---|---|---|---|
| 1 | Hero says "SAYTLAR YARADIRAM. İDEYALARI BÖYÜDÜRƏM." — no buyer, no offer, no price. | `/`, `/az|ru|en/` | Headline names the offer (sites and systems for a business); lead sentence names audience and deliverable; three canonical starting prices link straight into the configurator. Stickers kept. | `after/home-*.png`; prices rendered from `product-data.js` |
| 2 | Velvet appears in the "Seçilmiş işlər" name row and under the *Portfolio* filter, though velvet.az is a hosting "coming soon" page. | `/`, `/catalogue.html` | Velvet moved to concepts (`type:'website'`, `vitrine:true`) and labelled *Vitrin konsepti*; name row removed. Real work = Savor, IsoClub, Promo X only. | test `real work and concepts are separated` |
| 3 | Real work is four equal cards (one a concept), each a single cropped screenshot; dialog has one sentence and generic "Veb dizayn / Proqramlaşdırma" tags. | `/`, `/catalogue.html` | Three case studies: client context, implemented scope, design decisions, my part (as already stated in the repo), real desktop/mobile screenshots captured from the live domains, link out. Same case data powers the catalogue dialog. | `src/cases.js`, `assets/cases/*` |
| 4 | Concepts and real work mixed in one grid; filter "Portfolio"; hard-coded count "22"; every card tagged "Proqramlaşdırma". | `/catalogue.html` | Filters *Real layihələr / Sayt konseptləri / Sistem demoları* with computed counts; grouped headings in "all"; cards show sector + starting price; `?filter=` deep links. | `after/catalogue-*.png` |
| 5 | Pricing cards list included items but not what raises the price. | `/` | Each card adds "who it is for" and the three most common priced additions straight from canonical data; one worked example computed by `calculate()`. | `offers.js` reads `products` + `calculate` |
| 6 | Process is four short slogans (`TANIŞLIQ…YAYIM`), no deliverables or client responsibilities, and differs in nothing from service pages. | `/`, `/services/*` | One shared `processSteps` source: what happens, what the client provides, what the client receives; one-week target stated as a target for agreed scope, not a guarantee. Service pages render the same steps. | `services-content.js`, test `process copy is shared` |
| 7 | No bridge from browsing to the configurator except pricing cards. | `/` | "Qiyməti özünüz hesablayın" section: five configurator steps and a live example estimate. | `after/home-*.png` |
| 8 | FAQ does not answer buying concerns (what to prepare, what is not included, timeline, payment). | `/` | Rewritten around buying concerns; unknown policies are explicitly "agreed per project", not invented. | test `homepage FAQ quotes canonical prices` |
| 9 | Contact block (desktop): arrow glyph overlaps the last letter, phone number wraps word by word because `.contact` inherits a two-column grid from `style.css`. | `/` | Contact rebuilt with its own grid: statement, number, "what to send in the first message" checklist. | `after/home-desk-contact.png` |
| 10 | Configurator design picker offers 5 of 13 site concepts; `reference=gym` shows the Casa Forma preview; system preview always Flow regardless of reference. | `/product.html` | Design picker offers every site concept; site references preselect their own design; system references show their own preview and default workflow (Flow → CRM, Reserve → booking, Stockroom → orders). | tests in `product.test.mjs` |
| 11 | Configurator: no way to switch service; included items hidden in a collapsed disclosure; invalid link parameters silently replaced. | `/product.html` | Service switcher (keeps reference), included items visible next to the starting price, numbered steps, help note for non-technical buyers, notice when link options were not recognised (`invalidParams`). | `after/product-*.png` |
| 12 | Review dialog is a plain text block. | `/product.html` | Structured summary (choices, priced lines, total) + unchanged WhatsApp draft. | e2e script output |
| 13 | Catalogue `<meta description>` duplicated the homepage. | `/catalogue.html` | Own description. | built HTML |
| 14 | Weak, inconsistent icon glyphs (text arrows of different fonts, ✓ text). | new sections | One 24-unit outline SVG set (arrow, external, check, plus) matching the nav icons. | `src/icons.js` |
| 15 | Forma product photos incoherent, Aurea courtyard weak, Wolfpack one image. | `/concepts/forma|aurea|gym.html` | Re-curated CC0 photography through the existing provenance pipeline. | `docs/concept-asset-credits.md` |

## Proof used (source-verifiable)

- **Savor** (savor.com.az, live 3 Nov 2026): AZ/RU/EN, production story in six stages, 70-second factory film, five products (200 g – 20 kg butter, 600 g ghee) with detail pages, gallery, recipes, light/dark switch.
- **IsoClub** (isoclub.az, live 3 Nov 2026): AZ/RU/EN membership platform — member application, sign-in, coach-written plans shown as app screens, free calculators, articles, store, partner section, privacy/terms/cookie pages, light/dark switch.
- **Promo X** (promox.az): the network policy of this environment blocks the domain, so only the screenshot already in the repository is used; described features (search, category rail, all-categories menu, wishlist, contact channels) are those visible in it.
- Role: the repository already labels all three as "Veb dizayn + Proqramlaşdırma" by Bakhtiyar; no other contribution split, client quote or metric is claimed.

## Unknowns (not invented; listed in the PR)

Client permission/attribution wording for case studies, exact contribution split per project, Promo X current state, payment terms and deposit, revision rounds, post-launch support length, hosting/domain prices, refund policy, contract/invoice form, legal entity, working hours/response time.
