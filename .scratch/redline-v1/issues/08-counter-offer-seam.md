# 08: draftCounterOffer seam

**What to build:** The `draftCounterOffer(documentText, flag) → CounterOffer` seam, deliberately isolated per PRD.md's note that its quality bar is unresolved. Each flag on the document page gets a drafted counter-offer.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Counter-offer generated per flag, via its own seam — no other seam calls OpenRouter for this
- [ ] Persists to `counter_offers` (03), one row per flag
- [ ] Output passes the shared outcome-prediction copy check — states the pattern, never predicts the outcome (ADR-0007)
- [ ] Completes without error across all flag/clause types present in the fixture set — no quality bar on the drafted language beyond that, per spec
- [ ] Document page shows the drafted counter-offer alongside each flag
