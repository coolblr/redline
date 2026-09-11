# 01: Walking skeleton

**What to build:** A Next.js (App Router, TypeScript) project scaffolded and deployed on Vercel, with Supabase auth wired end-to-end and a single shared OpenRouter call wrapper — the only place in the codebase any model call happens. A signed-in User can trigger a stubbed call through that wrapper and see a real OpenRouter response, proving every layer of the stack (schema, API, UI, deploy) round-trips before any feature work starts.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Next.js (App Router, TypeScript, npm) project scaffolded and deployed to Vercel
- [ ] Supabase auth: a User can sign up, sign in, and sign out
- [ ] A single shared OpenRouter client wrapper exists and is the only place in the codebase that calls a model (CLAUDE.md: never a direct provider SDK)
- [ ] A signed-in User can trigger a stubbed call through the wrapper and see a real OpenRouter response rendered in the UI
- [ ] No API keys or secrets committed; credentials live in `.env.local` (gitignored)
