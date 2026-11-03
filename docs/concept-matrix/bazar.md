# bazar — Bazarlıq (site)

## Thesis
A neighbourhood bazaar for second-hand things — electronics, home, kids’ gear, hobby and sport — where the most important screen is the one where you sell. Bazarlıq treats posting an ad as the product: a four-step form whose card is assembled live next to it, so a seller sees exactly what a buyer will see while they type. Buying is simple and warm: browse by category, open the item, save it.

## Previous problem
Static category grid of coloured boxes, no browsing, no listing, no posting; same skeleton as the other marketplaces.

## Audience and primary task
Households in Bakı, Sumqayıt, Gəncə selling what they no longer use. Task: choose a category → describe the item (validated) → set the price or mark it free / swap → preview → publish (locally). Buyers: browse categories, search, open, favourite.

## Art direction
- Palette: chalk white `#FBFAF7`, ink plum `#2A1B3D`, tag yellow `#FFD23F` (price tags and the post button), pomegranate `#C4314B` (favourites, errors), leaf `#2F6E4E` (free / swap), card line `#E6E1EA`.
- Type: Rubik Variable — rounded but firm; 800 for the wordmark and price tags, 500 for titles, 400 body.
- Imagery: real CC0 photographs of individual objects on their own background, cropped square like a seller’s phone photo.
- Composition: category rail as the navigation, a mixed-size grid of ads (larger tiles for items with more detail), the post-an-ad studio as a two-column composer with a sticky live card.
- Signature: the price tag — a die-cut tag shape (CSS, with punched hole) used for every price and the live preview.

## Content written
22 listings across 6 categories with condition, city, posted date, description and category-specific attributes; category-specific posting fields (e.g. memory for phones, age range for kids’ items, size for clothing).

## Flow
Category → listing grid (search, condition, price range, city, sort) → item detail → favourite. Post: category → details (validation) → price → preview → published into “My ads” and the fresh-listings grid (localStorage, removable).

## States
Validation per step with error summary; empty search; empty favourites; published confirmation stating it is local only.

## Imagery and provenance
22 CC0 WordPress Photo Directory photographs of single objects (`k/bazar/assets.json`), square crops. The owner-supplied `/assets/showroom/bazar.webp` (pastel 3D render) was not used: it reads as a render, not a seller's photo. Some listings name the visible brand of the item (Nikon lens, Sennheiser headphones, Zeiss Ikoflex), as a real used-goods ad would.

## Composition note
The grid is uniform (square tiles with a die-cut price tag); the "mixed-size grid" idea from the first thesis was dropped because uniform tiles scan better at two columns on mobile.

## Verification (3 Nov 2026)
- Build and tests pass; Playwright az desktop/mobile, ru/en desktop/360 — no overflow, no console errors.
- Post flow completed: hobby → bicycles → title too short (error summary with links + inline errors) → valid details + uploaded photo (resized to a data: URL, CSP-safe) → price 90 AZN, negotiable, Bakı, +994 phone → preview → published → appears first in the grid and in “My ads”, deletable.
- Buyer flow: category tile → sub-category chips → listing → quick-reply message (validated, demo confirmation) → favourite; search “piano” → empty state with clear/post actions.
- Deliverables: `docs/concept-shots/bazar-{desktop,mobile,flow,state}.jpg`, preview `storefront/public/assets/previews/bazar.jpg`.

## Open issues
- Published ads and photos are kept in localStorage; a very large photo may exceed the quota, in which case the ad is saved without its photo.
- On phones under ~400px the header wraps the search onto its own row (intended), and the step labels collapse to numbers except the current step.
