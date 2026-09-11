# 06: Document defects

**What to build:** Detect document-level defects — a dangling schedule/exhibit reference, an ambiguous defined term — as their own output category, surfaced before the severity-ranked flag list, never folded into a flag.

**Blocked by:** 04

**Status:** done

- [x] A fixture with a clause referencing a schedule/exhibit absent from the extracted text produces a `dangling-reference` DocumentDefect, not a flag built on a guess — verified against the stub AND the live model (caught the planted Schedule 1 reference)
- [x] A fixture with an ambiguous defined term (e.g. "Contractor" could mean the User or a subcontractor) produces an `ambiguous-term` DocumentDefect — verified against the stub AND the live model
- [x] DocumentDefect[] persists to the `document_defects` table from 03, as a distinct collection from Flag[] (ADR-0008)
- [x] Document page renders defects in their own section, above the flag list

## Comments

Live smoke run also produced one extra `dangling-reference` false positive (an internal "Section 2" cross-reference that does exist in the document) — citation still resolved exactly, so the invariant held; noted as real-world signal, not treated as a bug to chase given ADR-0006's recall-over-precision stance.
