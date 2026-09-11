# 04: analyzeDocument core — summary + severity-ranked flags

**What to build:** The `analyzeDocument(documentText, redLines) → { Summary, Flag[] }` seam: a plain-English summary and severity-ranked risk flags across all six red-line clause types, each citing an exact source sentence, generic treatment depth for every clause type at this stage. Persists directly to the schema from 03. Includes the clean-document path and the capped-but-one-sided middle-tier case.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Summary and Flag[] returned and persisted per the 03 schema
- [ ] Every flag's citation is validated to resolve against the input documentText before being returned or stored; a flag that fails this check is never returned (ADR-0001)
- [ ] Severity tier assigned per the three-tier exposure test (ADR-0005): top = uncapped + one-sided, middle = capped + one-sided, cite-only = capped + mutual
- [ ] A capped-but-one-sided fixture lands in the middle tier, not cite-only — the case ADR-0005 flags as most likely to be miscategorized by a naive implementation
- [ ] standardOrUnusual label assigned independently of severity tier (e.g. arbitration: top-severity + standard)
- [ ] A clean, well-drafted fixture document produces a plain "nothing above cite-only" statement, with the full (mostly cite-only) list still returned
- [ ] Non-compete, limitation-of-liability, unilateral-termination, and scope-creep clauses are at least flagged when present in a fixture (recall bar, ADR-0006), even without sharp tuning
- [ ] Scope-creep flags carry an explicit lower-confidence marker in their rationale
- [ ] All rationale text states the pattern, never predicts an outcome (ADR-0007); enforced by a shared copy-check assertion
