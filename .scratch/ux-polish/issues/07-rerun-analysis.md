# 07: No way to re-run an analysis

**Status:** needs-triage

**What the reader sees now:** once a document has a summary, the "Run analysis" button disappears and the saved result is final. The same PDF gave 1, 0, 6 and 4 flags across runs. A reader stuck with a thin result has no recourse except uploading the file again.

**Why this needs an explicit yes:** a re-run is new behaviour outside the six scoped features (`CLAUDE.md`, "Scope"). It also contradicts a deliberate rule in `app/documents/[id]/actions.ts`: analysis only runs on request, and opening a saved document never re-analyses it (ticket 10 depends on it).

**If approved:** add a "Run again" action on analysed documents. It must replace the previous flags, defects, counter-offers and summary together, so duplicates never appear, and it should ask the reader to confirm before it spends model credit and overwrites what they have. `runAnalysis` currently inserts without clearing, so a double call today would duplicate rows.

**Check:** run twice on one document and confirm one coherent set of rows, not two.

**Copy:** the action label and the confirmation go through the humanizer.

## Comments
