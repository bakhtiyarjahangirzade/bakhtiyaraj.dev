# Luna Comics — design

Luna has its own identity, separate from the BAKHY studio theme (`storefront/DESIGN.md`). Nothing here changes studio tokens; every Luna style lives in `storefront/Luna/src/luna.css` and only loads on `/Luna`.

## Direction (owner feedback, 3 Nov 2026)

The first pass, a quiet paper-and-teal bookshop, read as too plain and generic. The owner pointed to a Dribbble exploration, "Book Platform UI Elements Exploration": a dark bento grid of art-filled cards, tinted gradients taken from each book's artwork, pill chips, white pill buttons with an arrow disc, an authors card with ringed avatars, a recent-search card and an icon menu card. The owner asked for that mixed with Apple's style. Luna now combines:

- **From the reference:** a dark bento grid of tiles with different sizes, cover art as each tile's background and a gradient tinted with the title's own `tone`, uppercase pill chips ("Tövsiyə", "Janr", "Gecə seçimi"), white "+ Əlavə et" pills, "Birinci bölümü oxu ➜" with a black arrow disc, an authors card with gradient-ringed avatars, a search card, a menu card with coloured circular icons and a violet quote card.
- **From Apple (iOS / App Store / Apple Books):** system typography (SF on Apple devices, Inter elsewhere), a large-title header with a date line, frosted translucent bars, segmented controls, inset grouped lists, the App Store stat strip on title pages, a blurred-artwork title-page header, HUD-style toasts, and on phones a bottom tab bar with the active tab in system blue.

## Tokens

| Token | Value | Role |
|---|---|---|
| `--bg` | `#000` | Page background |
| `--surface` / `--surface-2` | `#1c1c1e` / `#2c2c2e` | Cards, grouped lists, inputs (Apple dark system greys) |
| `--label`, `--label-2`, `--label-3` | `#f5f5f7` and 64% / 38% white | Text hierarchy |
| `--violet` | `#7d5cff` → `#5b3df0` | One accent: primary form/authors button, quote card, side-card glow |
| `--green` / `--orange` | `#30d158` / `#ff9f0a` | "Pulsuz" badge and progress / "Nümunə məhsul" badge and inquiry |
| `--moon` | `#f5c451` | The Luna crescent |
| `tone` per title | catalogue | Tints the tile gradient, card wash and title-page backdrop |

Radii: 26px tiles, 20px cards, 14px covers and lists, pills fully rounded.

## Type

- Interface: `-apple-system`/SF Pro first, Inter (OFL, bundled) elsewhere, Commissioner for Cyrillic titles. Weights 600–700 for titles, tight tracking (−0.02 to −0.035em) as in Apple's large titles.
- Young Serif is kept only for the "Luna" wordmark and the book jacket inside the reader. That keeps the bookish brand while the storefront chrome stays Apple-like.

## Layout

```
frosted bar: Luna crescent ......  [Kəşf et | Kitabxanam | Hesab] ...... (search)
ÇƏRŞƏNBƏ AXŞAMI, 3 NOYABR
Kəşf et
┌pick──────┐┌feature: Cadılar, iksirlər… [Oxu ➜] + fanned covers┐┌authors──┐
│ ep 3     │└──────────────────────────────────────────────────┘└─────────┘
│ Tövsiyə  │┌Komediya──────┐┌tall: ep 11 Gecə seçimi─┐┌search────┐
└──────────┘└──────────────┘│                        │└──────────┘
┌Sözsüz────┐┌rec: ep 6 RU──┐│                        │┌quote─────┐
└──────────┘│              │└────────────────────────┘└──────────┘
┌Nümunə────┐│              │┌start / continue────────┐┌menu──────┐
└──────────┘└──────────────┘└────────────────────────┘└──────────┘
Bütün kataloq: search field, segmented access, chip rows (language, genre), card grid
```

Tablet: two columns. Phone: one column in the order feature, start/continue, night pick, recommendation…; bottom tab bar.

## Artwork rules

- Tiles use the cover as a decorative background (CSS `object-fit: cover`). The full, uncropped cover is always shown on the title page and in catalogue cards, whose box matches the cover's ratio, and inside the reader.
- Story pages are never cropped or overlaid.
- No people photos: the authors card uses initials, because Luna has no rights to portraits.
- The quote card quotes the comic itself ("Mmm… Best… Coffee… Ever!", *The Secret Ingredients*, page 7) with a link to that page. No invented reviews or star ratings.

## Reader

The page-turning book is unchanged: a paper spread with a 3D leaf turn on desktop and one page on phones. Only the chrome changed: a near-black stage, translucent top and bottom bars, round grey pill buttons, and a white "next" button.

## Accessibility floor

Visible focus ring (system blue), skip link, persistent labels, `aria-live` status, radio semantics for segmented controls, Escape exits zoom and then the reader, browser pinch-zoom never disabled, `prefers-reduced-motion` honoured, no horizontal scroll at 320 px. White-on-art text sits on a tone-tinted gradient for contrast.
