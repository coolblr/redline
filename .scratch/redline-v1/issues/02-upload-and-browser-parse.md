# 02: Upload & browser-side parse

**What to build:** A signed-in User can upload a Contract file. It is parsed entirely in the browser; only the extracted text is sent to and stored in Supabase, tied to that User. The original file is never transmitted to the server or stored anywhere. After upload, the User lands on a document page showing the raw extracted text.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] User can upload a document file from the browser
- [ ] Parsing happens client-side; the original file is never sent to the server or stored (CLAUDE.md invariant)
- [ ] Only the extracted text is persisted to Supabase, associated with the uploading User
- [ ] After upload, User is taken to a document page rendering the extracted text
- [ ] Network inspection confirms no original file bytes leave the browser
