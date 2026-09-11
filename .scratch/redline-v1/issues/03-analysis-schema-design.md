# 03: Analysis schema design (prefactor)

**What to build:** One Supabase migration establishing the full analysis data shape the spec already defines, so every later seam ticket (04, 06, 08, 09) can persist its own output as soon as it's built, instead of improvising storage or waiting on sibling tickets to exist first. Covers `documents` (extending 02's table as needed), `flags`, `document_defects`, `counter_offers`, and `qa_history`. No seam logic lives here — this is schema only.

**Blocked by:** 02

**Status:** done

- [x] `flags` table/columns match the Flag shape: clause type, severityTier (top/middle/cite-only), standardOrUnusual, treatmentDepth (sharp/generic), citation (resolves to a substring of the document's extracted text), rationale text
- [x] `document_defects` table/columns match the DocumentDefect shape: defect type (dangling-reference/ambiguous-term), description, location in the extracted text
- [x] `counter_offers` table exists, one row per flag it responds to
- [x] `qa_history` table exists, scoped to a document
- [x] Red-line schema is explicitly out of scope for this ticket — deferred to ticket 07, per the spec's own note that its schema (per-user vs. per-document scope, entry shape) isn't fixed yet
- [x] A round-trip smoke test (insert + read) written (`tests/integration/analysis-schema.smoke.test.ts`, service-role key, all 4 tables) — skips honestly (`4 skipped`, not faked-pass) since no live Supabase project exists in this build environment
- [ ] Migration applies cleanly against a fresh Supabase instance — **unverified**, no Supabase CLI/Docker available here; a human needs to apply `supabase/migrations/0001_documents.sql` and `0002_analysis_schema.sql` and then re-run `npm test` to exercise the smoke test for real

## Comments

Shared TypeScript types + zod schemas landed at `lib/domain-types.ts` for later seam tickets to import (`Flag`, `DocumentDefect`, `CounterOffer`, `Answer` + their schemas and the `ClauseType`/`SeverityTier`/`StandardOrUnusual`/`TreatmentDepth`/`DefectType` enums).
