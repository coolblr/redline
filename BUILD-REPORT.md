# Build Report

This report is written incrementally by an orchestrating agent working through
`.scratch/redline-v1/issues/01`–`10` unattended. It is safe to re-run the build;
each ticket's `Status:` line in its issue file is the source of truth for what's
done. Read that before trusting this file's "Tickets" table if they ever disagree —
this file is a summary, the issue files are the record.

## Decisions made without asking (and why)

These are decisions CLAUDE.md would normally have the agent stop and ask about.
The orchestration prompt for this run pre-answered the two big ones (model/OpenRouter
config, and Supabase-absent behavior — both applied verbatim below) and told the
agent to write down everything else it would otherwise ask about, rather than stop.

1. **Model calls: plain `fetch`, no SDK.** OpenRouter's endpoint is OpenAI-compatible,
   but `CLAUDE.md` says "never a direct provider SDK." Reading the OpenAI SDK as a
   provider SDK in spirit (it's built to assume you're talking to OpenAI), the
   wrapper in ticket 01 uses a hand-rolled `fetch` call against
   `https://openrouter.ai/api/v1/chat/completions` instead of installing `openai`.
   Zero new runtime dependency for the single most load-bearing piece of the app.
2. **Model id: `process.env.OPENROUTER_MODEL`, never a literal.** Per the prompt's
   pre-answered instruction. Every seam reads it at call time; nothing hardcodes a
   model string, including tests (tests stub the whole client, not just the model id).
3. **Provider pinning:** every OpenRouter call sends
   `provider: { order: ["fireworks"], allow_fallbacks: false }`,
   `require_parameters: true`, and a low reasoning effort, and requests structured
   JSON output (`response_format: { type: "json_schema", ... }` per seam). Per the
   prompt's pre-answered instruction.
4. **Supabase-absent behavior:** no Supabase project exists yet. The app must start
   and `analyzeDocument` must run against pasted/uploaded text with
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` both absent. Concretely:
   analysis (summary, flags, defects, counter-offers, Q&A for a single in-memory
   document) works with no session. Only the saved library and the user's red-line
   list — both of which need a `user_id` to scope to — require a signed-in Supabase
   session. Where the app can't reach Supabase, sign-in/library/red-lines degrade to
   a visible "needs an account" state rather than throwing.
5. **Test framework: Vitest.** No test framework existed in this greenfield repo
   (spec.md says this is an implementation-time choice). Vitest, chosen over Jest:
   native ESM/TS, fast, works cleanly with Next.js App Router route handlers and
   plain TS modules without a heavy config. Added as a devDependency.
6. **Browser-side document parsing: `pdfjs-dist` (PDF) + `mammoth` (DOCX), plain
   `FileReader` text for `.txt`.** All three run entirely client-side — no server
   ever sees the original file bytes, per the CLAUDE.md invariant. OCR is out of
   scope on purpose (CLAUDE.md), so a scanned/image-only PDF is allowed to extract
   little or nothing rather than being OCR'd.
7. **Supabase client libraries: `@supabase/supabase-js` + `@supabase/ssr`.** Standard
   pairing for Next.js App Router auth (cookie-based session handling). Not a
   "direct provider SDK" in the CLAUDE.md sense — that rule is about model calls.
8. **Structured-output validation: `zod`.** Used to validate/parse every OpenRouter
   JSON response into the seam's typed shape, and to implement the shared
   "citation resolves against documentText" and "no outcome-prediction language"
   checks as reusable assertions (used by both the seams themselves and the test
   suite).
9. **Ticket status values:** this repo's issues use a `Status:` line
   (`docs/agents/triage-labels.md`). Everything currently reads `ready-for-agent`.
   This run adds two pragmatic values on top for its own bookkeeping:
   `in-progress` (a subagent is actively working it) and `done` (merged, tests
   green). A ticket that fails twice is marked `blocked` with a note explaining why.

## Tickets

| # | Title | Status | Notes |
|---|-------|--------|-------|
| — | Fixtures (tests/fixtures/) | done | 6 planted flags + 2 defects in adhesion-contract.txt, clean-contract.txt has none; all sourceSentences verified as exact substrings |
| 01 | Walking skeleton | done | Supabase auth (`/login`, `/auth/signout`), `lib/openrouter.ts` wrapper, `/demo` page wired to a real (verified live) OpenRouter call. Vercel deploy and end-to-end auth click-through not performed — no Vercel project/credentials and no Supabase project exist in this environment. |
| 02 | Upload & browser-side parse | done | `lib/parse-document.ts` (.txt/.pdf/.docx, client-side, real fixture tests, no OCR fallback); upload at `/app` (matches existing landing-page CTA); `app/documents/[id]/page.tsx`; `supabase/migrations/0001_documents.sql` (unverified against a live DB — no Supabase CLI/Docker here) |
| 03 | Analysis schema design | done | `lib/domain-types.ts` (Flag/DocumentDefect/CounterOffer/Answer zod schemas + types, 7-value ClauseType incl. arbitration); `supabase/migrations/0002_analysis_schema.sql` (flags/document_defects/counter_offers/qa_history, owner-scoped RLS via documents join, unverified against a live DB); honest-skip round-trip smoke test at `tests/integration/analysis-schema.smoke.test.ts` |
| 04 | analyzeDocument core | done | `lib/seams/analyze-document.ts` + `lib/seams/severity.ts` (severityTier/treatmentDepth computed deterministically in code, never self-reported by the model — the actual correctness lever for the ADR-0005 middle-tier case); ledger UI on the document page per DESIGN.md; `npm run smoke` exists and was run live (see below) |
| 05 | Sharp-treatment tuning | done | IP-assignment gets its own timing-based tier function (deterministic, not model-self-reported); `npm run eval:sharp` reports sharp/generic as separate numbers (6/6, 4/4 live) |
| 06 | Document defects | done | `analyzeDocument` now returns `{ summary, flags, documentDefects }` — defects detected in the same OpenRouter call, same citation-drop discipline as flags (ADR-0001 applied per ADR-0008); document page renders a defects section above the ledger; live smoke run caught both planted defects |
| 07 | Editable red lines | done | Per-user `red_lines` table + `/red-lines` editor; filtering by enabled clause type happens outside analyzeDocument (`filterFlagsByRedLines`), deterministic and stub-testable — built in parallel with 05, no file overlap |
| 08 | draftCounterOffer seam | done | `lib/seams/draft-counter-offer.ts`, one call per persisted (post-red-lines-filter) flag; per-flag failures caught/logged, never fail the whole `runAnalysis`; live smoke run: 10/10 flags got a counter-offer, zero outcome-prediction hits |
| 09 | answerQuestion seam | pending | |
| 10 | Saved document library | pending | |

## What could not be verified

- **Ticket 01 — Vercel deployment.** No Vercel project or credentials exist in this
  environment, so the app was verified locally (`npm run build`, `npm run dev`) only.
  A human needs to create/link the Vercel project and deploy.
- **Ticket 01 — Supabase sign-up/sign-in/sign-out round trip.** No Supabase project
  exists yet (`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are unset).
  `/login` and `/auth/signout` are implemented per the standard `@supabase/ssr`
  Next.js pattern and the app correctly falls back to a "no account system
  connected yet" state with both vars absent (confirmed by curling `/login` and
  `/demo` with the dev server running), but the actual auth round trip — sign up,
  email confirmation, sign in, session cookie, sign out — has not been exercised
  against a live project. A human should provision Supabase, fill in the two env
  vars, and click through this once.
- **Ticket 01 — OpenRouter demo call.** This *was* verified: the same request shape
  `lib/openrouter.ts` sends was posted directly against the live OpenRouter API
  using the real key in `.env.local` and returned HTTP 200 with a valid parsed
  `{ message: "..." }` JSON body. The `/demo` page's UI path (signed-in User clicks
  the button, sees the response) could not be clicked through end-to-end because
  that page is gated on a Supabase session, which doesn't exist yet — see above.

- **Ticket 02 — `supabase/migrations/0001_documents.sql`.** No Supabase CLI or Docker
  is available in this environment. Written as standard Postgres + Supabase RLS SQL,
  not applied anywhere. A human needs to run it once a Supabase project exists.
- **Ticket 02 — in-browser upload UX.** `parseDocumentFile`'s `.txt`/`.pdf`/`.docx`
  paths are covered by real (non-mocked) Vitest tests against real fixture files, and
  `npm run build` confirms pdfjs-dist/mammoth are code-split into the `/app` route.
  Actual drag-and-drop and the pdfjs web-worker asset resolving correctly in a real
  browser were not clicked through (no browser available in this environment).

- **Ticket 03 — `supabase/migrations/0002_analysis_schema.sql`.** Same constraint as
  0001: no Supabase CLI/Docker here, unapplied. `tests/integration/analysis-schema.smoke.test.ts`
  is written against a service-role key (RLS bypass, needed since the schema has no
  anon-safe way to fabricate an authenticated `auth.uid()` outside a real sign-in
  flow) and self-skips with a clear message until a human sets
  `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` and applies both
  migrations — running `npm test` again at that point is the actual verification.

- **Ticket 04 — `supabase/migrations/0003_documents_summary.sql`.** Same constraint
  as 0001/0002: no Supabase CLI/Docker here, unapplied.
- **Ticket 04 — real model behavior (`npm run smoke`, live OpenRouter call against
  `tests/fixtures/adhesion-contract.txt`).** Ran twice. First run surfaced a real bug:
  `limitation-of-liability` (the deliberately-asymmetric middle-tier fixture clause)
  came back `top` because the prompt's definition of `isExposureCapped` read as false
  when the *User's own* side of the clause was the uncapped one. Fixed by adding an
  explicit worked example to the system prompt (a cap that exists anywhere in the
  clause, applied unevenly, is capped-and-one-sided — not fully-uncapped). Second run
  confirmed the fix: `limitation-of-liability` → `middle`, correctly. This is exactly
  the failure mode ADR-0005 names as "most likely to be miscategorized by a naive
  implementation," caught by the smoke test before it could compound into 05/06/08/09.
  Two accepted deviations from the fixture's planted answers, both within the ticket's
  stated bar: `unilateral-termination` was flagged as a false alarm beyond the 6
  planted clauses (ADR-0006 accepts this — its citation still resolved exactly);
  `scope-creep` came back `top` instead of the fixture's `middle` (scope-creep is a
  recall-bar clause type per spec.md — presence matters more than exact tier here,
  flagged for whoever tunes ticket 05/06 next). No flags were silently dropped for a
  bad citation in either run.

- **Ticket 07 — `supabase/migrations/0004_red_lines.sql`.** Same constraint as prior
  migrations: no Supabase CLI/Docker here, unapplied.
- **Tickets 05 and 07 were built in parallel** (different seams of the spec, no shared
  files — verified by the orchestrator after both landed: `git status` showed no
  overlapping paths, `npm test`/`npm run build` passed cleanly against the merged
  tree). 05 owns `lib/seams/analyze-document.ts`/`severity.ts`; 07 owns
  `lib/red-lines.ts`, `app/red-lines/`, and a single call-site edit in
  `app/documents/[id]/actions.ts`.

## Commands to run first

```
npm install
npm run typecheck   # npx tsc --noEmit
npm test             # vitest run
npm run build
```

All three passed as of 2026-09-11. `npm run build` succeeds with
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` absent — this is the
expected condition until a human provisions a Supabase project and adds those two
vars (plus `OPENROUTER_API_KEY` / `OPENROUTER_MODEL`, already set) to `.env.local`.
