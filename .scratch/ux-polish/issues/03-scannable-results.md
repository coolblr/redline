# 03: Long results are hard to scan

**Status:** ready-for-agent

**What the reader sees now:** one analysed contract in the database has 13 flags, each followed by a long counter-offer, all on one scrolling page. The ranked list is hard to take in at a glance.

**Change:** collapse each counter-offer behind a "Show counter-offer" control, closed by default, so the ranked flags read as a scannable ledger. Nothing new is generated, and the tier order is unchanged. Use a native `<details>` element if it fits the ledger layout, since it needs no script.

**Check:** open the flooring PDF's analysis. Each flag row shows clause, label, quote, exposure and tier, and the counter-offer opens on click. Keyboard and screen-reader users can open it too.

**Copy:** the control's label goes through the humanizer.

## Comments
