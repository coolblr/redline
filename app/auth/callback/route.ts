import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Where the confirmation link in the sign-up email lands (see the signUp
// call in app/login/page.tsx). Supabase appends a one-time ?code=; this
// exchanges it for a session cookie so the reader arrives signed in.
//
// The destination is fixed on purpose: no ?next= parameter, so this can't be
// used as an open redirect. A missing, expired or already-used code, or a
// link opened in a different browser from the one that signed up, sends the
// reader to the sign-in page, where their password still works.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}/app`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
