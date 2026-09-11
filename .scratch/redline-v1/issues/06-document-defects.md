# 06: Document defects

**What to build:** Detect document-level defects — a dangling schedule/exhibit reference, an ambiguous defined term — as their own output category, surfaced before the severity-ranked flag list, never folded into a flag.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] A fixture with a clause referencing a schedule/exhibit absent from the extracted text produces a `dangling-reference` DocumentDefect, not a flag built on a guess
- [ ] A fixture with an ambiguous defined term (e.g. "Contractor" could mean the User or a subcontractor) produces an `ambiguous-term` DocumentDefect
- [ ] DocumentDefect[] persists to the `document_defects` table from 03, as a distinct collection from Flag[] (ADR-0008)
- [ ] Document page renders defects in their own section, above the flag list
