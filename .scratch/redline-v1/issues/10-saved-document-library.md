# 10: Saved document library

**What to build:** UI only — list a User's past documents, open one, and replay whatever's already persisted for it (summary, flags, defects, counter-offers, Q&A history) via the schema from 03. No new seam logic.

**Blocked by:** 04 — note: this is a testability choice, not a hard dependency. This ticket is built to render each section (flags, defects, counter-offers, Q&A) independently and gracefully as empty/absent when nothing's persisted for it yet; 04 is listed as the blocker only because it's what gives this ticket real data to verify against, not because the UI itself requires Flag[] to exist. The defects/counter-offers/Q&A sections should populate automatically once 06/08/09 ship, with no further work on this ticket.

**Status:** ready-for-agent

- [ ] Library page lists a signed-in User's past analyzed documents
- [ ] Opening a document replays its persisted summary and Flag[] without re-running analysis
- [ ] Document defects, counter-offers, and Q&A history sections render from persisted data when present, and render an empty/absent state gracefully when not (verify by pointing the UI at a schema-03 row with those tables empty)
- [ ] No re-analysis, re-parsing, or new OpenRouter calls happen when opening a saved document
