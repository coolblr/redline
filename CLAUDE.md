# CLAUDE.md

## Redline
A web app: upload a contract, lease, freelance agreement, or ToS; get a plain-English summary, severity-ranked risky clauses with exact source-sentence citations, a drafted counter-offer per flagged clause, a document-scoped Q&A box, an editable list of the user's own red lines that drives the analysis, and a saved library of past documents.

## Stack (settled, do not reinterpret)
- Next.js, App Router, TypeScript, npm.
- Supabase for auth and database.
- Deployed on Vercel.
- Model calls go through OpenRouter, never a direct provider SDK.

## Non-negotiable invariants
- The uploaded file is parsed in the browser. Only extracted text is stored — never the original file.
- Every risk flag must cite the exact sentence it came from. A flag whose source sentence cannot be shown is a bug, not a missing feature.
- The product states only what the document says. Where the text doesn't support a claim, don't make it — this applies to summaries, flags, counter-offers, and Q&A answers alike.

## Scope — build this and stop
Summary, ranked risk flags with citations, counter-offers, document-scoped Q&A, editable user red lines, saved document library. Nothing else.
If something looks like an obvious next step and isn't on that list, ask before building it — don't infer it's wanted.

## Excluded on purpose
- Payments/billing, OCR for scanned documents, sharing a document between users.
- These are deliberately out for this version, which exists to prove the analysis can be trusted. None of the three make it more trustworthy — OCR actively undermines it, since a citation is worthless if the text it points at was misread.

## Standing rules
- Keep credentials in `.env.local` (gitignored). Never commit a secret — it's public the moment it's pushed and has to be rotated, not just removed.
- Ask before adding a dependency.

## Read before acting
- `research/summary.md` — the user research behind this product. Read before deciding what it should do.
- `PRD.md` — the actual brief. Read before building anything.

## Agent skills

### Issue tracker

Issues live as markdown files under `.scratch/<feature>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
