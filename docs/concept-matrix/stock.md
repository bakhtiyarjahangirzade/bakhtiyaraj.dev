# stock — Stockroom (kind: app)

## Thesis
Stockroom running the warehouse of **Dən Roastery** (fictional, Bakı), which roasts specialty coffee and supplies cafés with beans, cups, filters, syrups and oat milk. A ledger-like, condensed, label-printer aesthetic: every number carries its unit (kg, pcs, bottles), available = on hand − reserved by open café orders, status comes from a per-SKU minimum, and reorder suggestions come from daily usage × supplier lead time. The signature movement is a *roast batch*: green kg in, roasted kg out at the batch yield, both lines written to the audit log.

| | |
|---|---|
| Previous problem | A three-row table with "Məhsul A/B/C". |
| Audience | Small producers/distributors who track stock in spreadsheets. |
| Primary task | Record a stock movement or ship an order and see quantity, status, reorder list and audit log agree. |
| Palette | concrete #e4e7e5, ink (espresso) #2a201b, roast brown #6b3a24 (brand + primary action), label yellow #f1c644 (below minimum), out #b3261e, ok #2d7449. Status always icon + label. |
| Type | Fira Sans Condensed (headings, codes, table heads, tabs) + Fira Sans (body); both vendored with Cyrillic. |
| Imagery | None (no product photos: the tool is the hero, and the shared photo budget was left to site concepts). Level bars: available vs minimum tick, single series, scale 2.5 × minimum. |
| Composition | Header (warehouse, date, user) → attention buttons (below min/out, open orders, reorder count; each jumps to its view) → tabs (Stock, Café orders, Movement log, Reorder) → Stock: filters + sortable table + sticky side (selected SKU detail + movement form) → lower "how the numbers work" definitions. |
| Signature interaction | Roast batch: choose roasted SKU (green source follows), kg in, yield %; live preview of both balances; writes two log lines with one batch number. |
| Content | 18 SKUs in 6 categories with code, bin, unit, minimum, daily use, lead time, order multiple, supplier, cost; 8 café orders (3 shipped) whose open lines produce the reserve; 17-line audit history whose balances are derived backwards from today's on-hand figures. |
| Flow | Select SKU → Receive / Ship / Roast / Adjust (reason required) → validation (positive qty, can't ship reserved stock, green coffee available, ≤60 kg per roast entry, yield 70–90%, no negative balance) → table, status, detail, attention counts, reorder list and log update. Orders: start picking → ship (blocked with explanation when a line is short, e.g. caramel syrup 0/6) → lines deducted and logged. Reorder: place supplier order (adds "on order", lowers suggestions; receive it from the SKU detail) or plan roast (pre-fills the roast form). |
| States | Empty search/filter with clear action, out-of-stock row (negative available shown as a shortage), blocked order, validation summary + inline errors, empty log for an item, "nothing to reorder". |
| Verified | 1440×900 and 390×844 az, ru (flow re-run), en spot-check; 360px no overflow (az/ru, log tab); console clean; arithmetic checked (96 → 236 kg after receiving 140; 30 kg roasted at 84% → +25,2 kg; SF-1045 ships 3 lines, open orders 5 → 4). Tabs use roving tabindex with arrow/Home/End keys. |
| Mobile | Table rows become two-column records with labelled cells and a full-width level bar; tabs wrap; "record a movement" jump link; log/reorder tables become labelled records. |

## Open issues
- Mobile stock list is long (18 records) before the form; the jump link helps but a sticky action bar would be better.
- Demo movement times come from an incrementing demo clock, not the real time.
- Purchase orders are a quantity on the SKU, not separate documents with numbers and expected dates.
- No product photography.
