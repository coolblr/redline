# 04: analyzeDocument core — summary + severity-ranked flags

**What to build:** The `analyzeDocument(documentText, redLines) → { Summary, Flag[] }` seam: a plain-English summary and severity-ranked risk flags across all six red-line clause types, each citing an exact source sentence, generic treatment depth for every clause type at this stage. Persists directly to the schema from 03. Includes the clean-document path and the capped-but-one-sided middle-tier case.

**Blocked by:** 03

**Status:** done

- [x] Summary and Flag[] returned and persisted per the 03 schema (plus `0003_documents_summary.sql`, a small schema gap ticket 03 missed — `documents.summary`)
- [x] Every flag's citation is validated to resolve against the input documentText before being returned or stored; a flag that fails this check is never returned (ADR-0001)
- [x] Severity tier assigned per the three-tier exposure test (ADR-0005): computed deterministically in code (`lib/seams/severity.ts`) from model-reported `isExposureCapped`/`isMutual` facts, not self-reported by the model
- [x] A capped-but-one-sided fixture lands in the middle tier, not cite-only — verified against the stub in tests, and against the real model via `npm run smoke` (found and fixed a real prompt bug in the process — see BUILD-REPORT.md)
- [x] standardOrUnusual label assigned independently of severity tier (verified: fixture's arbitration flag is top-tier + standard)
- [x] A clean, well-drafted fixture document produces a plain "nothing above cite-only" statement, with the full (mostly cite-only) list still returned
- [x] Non-compete, limitation-of-liability, unilateral-termination, and scope-creep clauses are at least flagged when present in a fixture (recall bar, ADR-0006), even without sharp tuning
- [x] Scope-creep flags carry an explicit lower-confidence marker in their rationale (deterministically appended in code if the model doesn't already include one)
- [x] All rationale text states the pattern, never predicts an outcome (ADR-0007); enforced by a shared copy-check assertion (`lib/copy-checks.ts`)

## Comments

Document defects are explicitly not part of this seam's return type (`{ summary, flags }` only) — ticket 06 extends it. Live smoke run (`npm run smoke`) against the real model is recorded in BUILD-REPORT.md, including one accepted false alarm (unilateral-termination) and one known recall-bar-only miss (scope-creep tier) — both within the ticket's stated bar per ADR-0006.
