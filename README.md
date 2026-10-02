Live: https://redline-the-fine-print1.vercel.app

## Production settings

The live app needs four settings. Each one is set on Vercel (Production) and in `.env.local` on the developer's machine. Neither place is in git.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`

The two `NEXT_PUBLIC_` settings are built into the page and reach every visitor's browser, so they must never hold a secret. A changed setting takes effect only after the app is rebuilt.
