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
| — | Fixtures (tests/fixtures/) | pending | |
| 01 | Walking skeleton | pending | |
| 02 | Upload & browser-side parse | pending | |
| 03 | Analysis schema design | pending | |
| 04 | analyzeDocument core | pending | |
| 05 | Sharp-treatment tuning | pending | |
| 06 | Document defects | pending | |
| 07 | Editable red lines | pending | |
| 08 | draftCounterOffer seam | pending | |
| 09 | answerQuestion seam | pending | |
| 10 | Saved document library | pending | |

## What could not be verified

(filled in as the build proceeds)

## Commands to run first

(filled in at the end)
