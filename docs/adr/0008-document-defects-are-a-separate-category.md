# 0008. Document-level defects are their own category, surfaced before the severity list

## Decision
An issue with the document's internal consistency or completeness — a clause referencing a schedule or exhibit that isn't in the extracted text, an ambiguous defined term like "Contractor" that could mean the User or a subcontractor — is a **document defect**, not a risk flag. Document defects are surfaced as their own section, before the severity-ranked clause list, not mixed into it.

## Alternatives
- Treat defects as a special case of risk flag (e.g. a low-severity or informational flag): rejected — a defect isn't a judgment about a clause's content, it's a statement that Redline can't fully trust its own read of the document. Burying that inside the same list as content-based severity rankings understates how much it should change the User's trust in everything below it.
- Don't handle document defects at all in v1, treat them as out of scope: rejected — real freelance contracts, especially ones drafted by a non-lawyer client or small agency, are often internally inconsistent, and silently flagging clauses against a document Redline can't fully parse would violate the same "state only what the document supports" invariant that governs everything else (CLAUDE.md, ADR-0001).

## Why
Redline should never guess which party an ambiguous term refers to and cite it as if that were certain. That's the citation invariant showing up at the document level instead of the clause level — and it changes how much the User should trust everything below it, which is why it's surfaced first, not folded into the ranked list.

## Consequences
- The output data model needs a distinct "document defects" collection alongside the severity-ranked flags, not a severity tier within the same list.
- Detecting a defect (a dangling reference, an ambiguous defined term) is a different kind of task than evaluating a clause's risk, and may need its own prompting/detection approach — this isn't free to build alongside the sharp-treatment clauses in ADR-0004.
- If this pattern recurs meaningfully across future document types (leases, ToS), it may deserve promotion from this ADR into its own glossary term with broader rules — noted here rather than decided now.
