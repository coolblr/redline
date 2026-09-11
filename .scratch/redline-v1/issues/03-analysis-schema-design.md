# 03: Analysis schema design (prefactor)

**What to build:** One Supabase migration establishing the full analysis data shape the spec already defines, so every later seam ticket (04, 06, 08, 09) can persist its own output as soon as it's built, instead of improvising storage or waiting on sibling tickets to exist first. Covers `documents` (extending 02's table as needed), `flags`, `document_defects`, `counter_offers`, and `qa_history`. No seam logic lives here — this is schema only.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] `flags` table/columns match the Flag shape: clause type, severityTier (top/middle/cite-only), standardOrUnusual, treatmentDepth (sharp/generic), citation (resolves to a substring of the document's extracted text), rationale text
- [ ] `document_defects` table/columns match the DocumentDefect shape: defect type (dangling-reference/ambiguous-term), description, location in the extracted text
- [ ] `counter_offers` table exists, one row per flag it responds to
- [ ] `qa_history` table exists, scoped to a document
- [ ] Red-line schema is explicitly out of scope for this ticket — deferred to ticket 07, per the spec's own note that its schema (per-user vs. per-document scope, entry shape) isn't fixed yet
- [ ] A round-trip smoke test (insert + read) passes for each new table
- [ ] Migration applies cleanly against a fresh Supabase instance
