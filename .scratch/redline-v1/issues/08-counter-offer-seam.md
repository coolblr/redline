# 08: draftCounterOffer seam

**What to build:** The `draftCounterOffer(documentText, flag) → CounterOffer` seam, deliberately isolated per PRD.md's note that its quality bar is unresolved. Each flag on the document page gets a drafted counter-offer.

**Blocked by:** 04

**Status:** done

- [x] Counter-offer generated per flag, via its own seam (`lib/seams/draft-counter-offer.ts`) — no other seam calls OpenRouter for this
- [x] Persists to `counter_offers` (03), one row per flag
- [x] Output passes the shared outcome-prediction copy check — states the pattern, never predicts the outcome (ADR-0007); zero hits in the live smoke run's 10 real counter-offers
- [x] Completes without error across all flag/clause types present in the fixture set — verified live (10/10 flags got a counter-offer); per-flag failures are caught and logged, never fail the whole analysis
- [x] Document page shows the drafted counter-offer alongside each flag — styled upright Archivo (Redline's own generated text), never Spectral-italic/quoted like a citation
