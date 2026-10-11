# BAKHY design direction

The user approved a soft gray design inspired by their reference: rounded pill
buttons, clean bold typography, rounded product previews with rich local gradients.
Initial content language is English with a direct, informal headline.

## Visual tokens

public/styles.css owns the runtime tokens: background #e0e2e4, ink #080a0b,
muted #606569, line #bdc2c6, lime #d6ef86. Typography uses local Segoe UI / Arial
with restrained monospace detail inside product previews. No external fonts.

## Catalog and interactions

All / Apps / Games / Tools / Lab filters are prominent above the catalog.
Category selection is persisted in the URL; browser back/forward restores it.
All cards are explicitly labeled Concept until a real project is implemented.
Preview buttons open accessible native modal dialogs with real project summaries,
Escape support and focus restoration. Contact links open GitHub's new-issue page.
JavaScript-free visits show the concepts and real links; unsupported controls hide.
Native anchors/buttons, visible focus, responsive stacked cards, reduced-motion
support, one document scroller and a global scrollbar baseline.

## Content truth

Pixel Lab, Color Riot, Grid Run and Focus Room are proposed concepts. Do not claim
they are usable, offer fake launch buttons, or fabricate counts of shipped products.
Lab has an honest empty state. No login, backend, tracking or paid dependencies.
