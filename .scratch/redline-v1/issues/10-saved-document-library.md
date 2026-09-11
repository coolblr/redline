# 10: Saved document library

**What to build:** UI only — list a User's past documents, open one, and replay whatever's already persisted for it (summary, flags, defects, counter-offers, Q&A history) via the schema from 03. No new seam logic.

**Blocked by:** 04 — note: this is a testability choice, not a hard dependency. This ticket is built to render each section (flags, defects, counter-offers, Q&A) independently and gracefully as empty/absent when nothing's persisted for it yet; 04 is listed as the blocker only because it's what gives this ticket real data to verify against, not because the UI itself requires Flag[] to exist. The defects/counter-offers/Q&A sections should populate automatically once 06/08/09 ship, with no further work on this ticket.

**Status:** done

- [x] Library page lists a signed-in User's past analyzed documents (`/library`, newest first, plain empty state when none exist)
- [x] Opening a document replays its persisted summary and Flag[] without re-running analysis
- [x] Document defects, counter-offers, and Q&A history sections render from persisted data when present, and render an empty/absent state gracefully when not (confirmed by reading each section's conditional rendering, built by tickets 06/08/09)
- [x] No re-analysis, re-parsing, or new OpenRouter calls happen when opening a saved document — confirmed by inspection: `app/documents/[id]/page.tsx` imports `runAnalysis` only as an unreferenced Server Action passed to a form; the page's own render path contains no call to `analyzeDocument`/`draftCounterOffer`/`answerQuestion`/`parseDocumentFile`/`openRouterClient`

## Comments

Ticket 10's subagent hit a Claude Code monthly spend limit mid-task (after implementation and tests, before its own build check) — orchestrator picked up verification (typecheck, full suite, build, code review) from there and confirmed everything green.
