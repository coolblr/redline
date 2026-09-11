import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Returns null when no Supabase project is
 * configured yet (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
 * absent) so callers can render a plain "no account system connected yet"
 * state instead of crashing.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createBrowserClient(url, anonKey);
}
