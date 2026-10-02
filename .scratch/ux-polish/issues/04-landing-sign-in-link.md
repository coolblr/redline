# 04: The landing page has no sign-in link and doesn't show you're signed in

**Status:** ready-for-agent

**What the reader sees now:** the landing page looks identical signed in or out. Its only action is "Try it on a document", which goes to `/app`. A signed-out returning reader has no direct way to sign in (FINDINGS.md finding 11).

**Change:** a small link in the top bar beside the wordmark. Signed out: "Sign in". Signed in: a link to the library, plus the account email or a "Sign out" action if it fits. The page must read the session on the server, as `/app` already does.

**Check:** signed out, the link goes to `/login`. Signed in, it shows the signed-in state and goes to the library. Check at phone width, where the top bar must not wrap badly.

**Copy:** the link text goes through the humanizer.

## Comments
