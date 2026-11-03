# Olio — wood-fire and olive-oil kitchen, Bakı (concept `olio`, kind `site`)

**Previous problem.** Generic hero + three feature cards ("Mövsümi menyu", "Məkanın hekayəsi", "Rezervasiya sorğusu") and three dish names with no prices, no menu, no reservation logic and fake CSS art.

**Thesis.** The menu is the story. The page is the restaurant table: a dark olive-wood surface on which printed paper sheets are laid — the November menu, the producers' season sheet and a reservation chit. Everything a guest needs to decide (what is cooked tonight, where it comes from, what it costs, whether there is a table) is on paper; the photography is the food itself, shot close and warm.

- **Audience.** Baku locals choosing where to eat this week; visitors checking prices, dietary options and opening hours on a phone.
- **Primary task.** Read the menu (with dietary filter and dish detail) → send a table request.
- **Palette.** Olive table `#2E3120` / `#3C4029`, menu paper `#F1EADB`, ink `#24211A`, oil gold `#D9B54A`, pomegranate `#9B2335` (prices, marks), leaf `#6E7A3A`.
- **Type.** Young Serif (display, dish names; Cyrillic falls back to Lora 600) + Golos Text (body, data, tabular prices).
- **Imagery.** Eight CC0 WordPress Photo Directory photos (bread, oil dip, sprats, whole fish, mise en place, dining room, table lamp, tiramisu). One grade for all: warm, slightly crushed, low saturation (CSS filter), tight crops on the plate.
- **Composition.** Hero = oil-dip photo with "tonight" paper slip pinned over it; menu = a wide printed sheet with dotted leaders, four courses in columns and a detail pane; season sheet = 12-month producer table with the current month highlighted (a functional chart); seating described with real capacities; reservation = a paper chit with a live summary stub.
- **Signature interaction.** Dietary filter dims non-matching dishes and counts what remains; clicking a dish opens its card (ingredients, provenance, allergens, portion, price).
- **Flow.** Date (next 21 days, Mondays closed) → time slot (availability per date, full slots disabled) → party size (1–8; 9+ is routed to private dining) → seating (hall / heated terrace / oven bar, with rules) → name + Azerbaijani phone validation → summary → confirmation "demo — nothing was sent" → new request.
- **States.** Empty dietary result, closed Monday, full slot, bar limited to 3 guests, invalid phone/name, success.
- **Content.** 14 dishes with ingredients/provenance/allergens in AZN, 8 producer rows with seasons, seating capacities, private dining set menu, opening hours, address, FAQ.
- **Open issues.** Photos are amateur restaurant photography (not one shoot) — mitigated by one CSS grade and tight crops; the sprats are sardines standing in for Caspian kilka.
