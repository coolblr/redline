# 07: Editable red lines

**What to build:** A User-facing, editable list of red lines that drives which risks `analyzeDocument` flags. Editing the list and re-running analysis visibly changes the output.

**Blocked by:** 04

**Status:** done

- [x] Red-line schema designed and persisted in Supabase (`supabase/migrations/0004_red_lines.sql`, unverified against a live DB — no Supabase CLI/Docker here) — scoped **per-user**, not per-document (reasoning in BUILD-REPORT.md)
- [x] Default red-line set (per PRD.md's "My red lines") seeds new Users (lazy-seeded on first access, `lib/red-lines-store.ts`)
- [x] User can view and edit their red lines (`/red-lines`, guidance text + enabled toggle per clause type)
- [x] Re-running analysis with an edited red-line list produces a visibly different Flag[] than the default set would — deterministic by design: `filterFlagsByRedLines` filters `analyzeDocument`'s output by clause-type `enabled` state, applied in `runAnalysis` before persisting; proven with a stub client (no live-model variability needed) in `tests/integration/red-lines-affect-analysis.test.ts`
