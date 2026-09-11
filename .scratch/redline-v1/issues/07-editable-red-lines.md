# 07: Editable red lines

**What to build:** A User-facing, editable list of red lines that drives which risks `analyzeDocument` flags. Editing the list and re-running analysis visibly changes the output.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Red-line schema designed and persisted in Supabase (deferred from 03 — per-user vs. per-document scope and entry shape decided here)
- [ ] Default red-line set (per PRD.md's "My red lines") seeds new Users
- [ ] User can view and edit their red lines
- [ ] Re-running analysis with an edited red-line list produces a visibly different Flag[] than the default set would
