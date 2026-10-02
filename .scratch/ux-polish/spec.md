# UX polish: clarity fixes, ranked by trust impact

Written 2026-10-02, after Session 4. Everything here comes from something observed that day (screenshots, the testing agent's report in `FINDINGS.md`, or the database), not from taste.

## Goal

Make what the reader sees easier to read and harder to misread. This is not a restyle. `DESIGN.md` sets the identity: paper ground, ink, one reserved Flag red, ruled rows, an invoice register and not a marketing page. Palette, type and the ledger layout stay as they are.

## Rules for every ticket

- Keep to `DESIGN.md`. No gradients, cards, badges or new colours.
- Any new label, message or empty state goes through the humanizer skill before it is committed (`CLAUDE.md`).
- Anything that adds behaviour outside the six scoped features needs an explicit yes first (`CLAUDE.md`, "Scope").
- One change per commit, each with its own check. Fixes go on a branch and merge through a PR.
- Review changed screens with `/impeccable` (critique mode) against `DESIGN.md` before the PR.

## Ranked tickets

| # | Ticket | Why it ranks here | Size | Status |
|---|---|---|---|---|
| 01 | Exposure column says "Uncapped" for any Top flag | Misleads a reader | S | needs-info |
| 02 | Counter-offers are one dense block | The reader can't tell what to send | M/L | needs-triage |
| 03 | Long results are hard to scan | 13 flags, each with a long counter-offer | S/M | ready-for-agent |
| 04 | Landing page has no sign-in link | A returning reader can't find the way in | S | ready-for-agent |
| 05 | Red-line saves give no feedback | Silent failure on the text that drives the analysis | S | ready-for-agent |
| 06 | Q&A shows stray markdown, can double-submit | Seen once, verify first | S | needs-info |
| 07 | No way to re-run an analysis | New behaviour, needs approval | M | needs-triage |

## Suggested order

1. First pass, no decisions needed: 04, 05, 03.
2. After the severity-rule decision (FINDINGS.md finding 2): 01.
3. Separate effort, touches the model seam and the database: 02.
4. Only if wanted: 07, and 06 once reproduced.

## Decisions needed from the owner

- What an uncapped-but-mutual clause should rank, and whether "capped" applies to termination and arbitration at all (unblocks 01; ADR-0005 does not define it).
- Whether to allow re-running an analysis (07 is outside the six scoped features).
- Whether counter-offers should become structured model output (02 changes the model's output shape and the `counter_offers` table).
