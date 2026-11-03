# forma — Forma Store (site)

**Previous problem.** A hero line ("Birlikdə yaşayacağınız əşyalar"), three feature cards describing what a shop *would* have, and a list of three product names on abstract SVG blocks. No products, no prices, no cart: a poster about a shop.

**Thesis.** The shop is the page. Forma Store is a small Baku homeware brand (ceramics, linen, wood, glass) whose site opens straight on the assortment: the counted, filterable collection is the hero. Every object is photographed on the same pale stone set — the photos are multiplied onto one stone tone so the grid reads as one shoot — and the copy talks like a shop counter: material, size, glaze, stock, delivery day, care.

**Audience.** People furnishing apartments in Bakı and Sumqayıt, gift buyers, interior designers ordering in small quantities; regional buyers (Gəncə, Şəki, Lənkəran) who need clear delivery terms.

**Primary task.** Filter → open an object → choose colour/size (price and stock change) → add to cart → adjust quantities → review the order (demo stop, nothing is sent).

**Palette.** Stone `#DEDDD6` (photo set), paper `#F3F3EF`, ink `#1E2420`, clay line `#B9B5A8`, kiln-blue action `#2C4B7E`, low-stock ochre `#9A6A12`. No gradients, no shadow kit.

**Type.** Geologica Variable only (latin-ext + Cyrillic): 600 for product names and prices with tabular figures, 300–400 body, 15–17 px UI. One family, hierarchy from size/weight/width of columns.

**Imagery.** CC0 WordPress Photo Directory product shots on light backgrounds, cropped square-ish and blended (`mix-blend-mode:multiply`) into the stone tile so backgrounds unify; detail crops of the same originals form each product's gallery. Credits in footer.

**Composition.** Utility header (search, cart count) → one-line delivery promise → title row with the season count → sticky filter bar → dense 4/3/2-column grid with a single wide "material note" tile interrupting it → materials & care table → delivery table by region (AZN) → showroom/returns footer.

**Signature interaction.** Variant selection that visibly changes price, stock line and delivery day; cart drawer with a free-delivery meter that recalculates by region.

**Flow / states.** Filters + sort with live count and "nothing matches → reset" empty state; product dialog (gallery, variants, care, delivery); cart drawer (qty, remove, subtotal, threshold, empty cart); checkout form with validation (name, +994 phone, region, address) → review screen clearly marked demo.

**Content written.** 14 objects across 5 categories and 7 materials (stoneware, porcelain, linen, walnut, mulberry, glass, brass), each with line, description, dimensions, care text, colour/size variants with per-variant price and stock; 4 delivery zones (Baku 5 AZN / free from 120, Absheron 8 AZN, regions 12 AZN / free from 200, showroom pickup); returns and payment terms. All numbers come from one record (`k/forma/data.js`) and are identical in grid, dialog, cart and review. The headline words (clay, linen, walnut, brass) are buttons that filter the grid by material.

**Verified (Playwright, built dist).** az desktop 1440×900 and mobile 390×844, ru/en spot checks, 360 px: no horizontal overflow, no console errors. Flow: Khazar vase → Smoke + 26 cm shows "sold out" and disables add → 18 cm ×2 = 84 AZN → add; tablecloth 140×260 = 89 AZN → cart 173 AZN, free delivery in Baku → checkout → invalid phone / empty address errors with focus on the first error → valid → review marked demo → clear cart. Empty filter state (brass + ≤25 AZN) with reset. Shots: `docs/concept-shots/forma-{desktop,mobile,flow,state,empty}.jpg`, preview `storefront/public/assets/previews/forma.jpg`.

**Open issues.** The photographs are 14 different amateur CC0 shots, not one studio session: the stone-tile multiply grade unifies the light backgrounds, but the wood-table / red-table shots (cup, creamer, board with fruit, painted bowl) still read as different sets. A real commission needs its own product shoot. Colour variants do not swap the photo (the gallery states which colour is shown).


