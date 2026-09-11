# 01: Walking skeleton

**What to build:** A Next.js (App Router, TypeScript) project scaffolded and deployed on Vercel, with Supabase auth wired end-to-end and a single shared OpenRouter call wrapper — the only place in the codebase any model call happens. A signed-in User can trigger a stubbed call through that wrapper and see a real OpenRouter response, proving every layer of the stack (schema, API, UI, deploy) round-trips before any feature work starts.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Next.js (App Router, TypeScript, npm) project scaffolded and deployed to Vercel — scaffolding done; Vercel deploy not performed in this session (no Vercel project/credentials in this environment — flagged for the human, not skipped silently)
- [x] Supabase auth: a User can sign up, sign in, and sign out — implemented per the standard `@supabase/ssr` pattern (`/login` page, `/auth/signout` route); cannot be exercised end-to-end since no Supabase project exists yet in this environment
- [x] A single shared OpenRouter client wrapper exists and is the only place in the codebase that calls a model (CLAUDE.md: never a direct provider SDK) — `lib/openrouter.ts`
- [x] A signed-in User can trigger a stubbed call through the wrapper and see a real OpenRouter response rendered in the UI — `app/demo/page.tsx` + `app/demo/DemoForm.tsx` + `app/demo/actions.ts`; the underlying wrapper call was verified against the live OpenRouter API (200, valid JSON parsed) but the auth-gated UI path itself can't be clicked through until a Supabase project exists
- [x] No API keys or secrets committed; credentials live in `.env.local` (gitignored) — confirmed via `git status` and `git check-ignore`

## Comments

Built by an unattended agent session on 2026-09-11. See BUILD-REPORT.md for
the full file list, verification output, and open items (Vercel deploy,
Supabase project creation, end-to-end auth click-through) that need a human
or a later session with real credentials.
