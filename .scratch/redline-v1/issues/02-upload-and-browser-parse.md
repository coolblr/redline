# 02: Upload & browser-side parse

**What to build:** A signed-in User can upload a Contract file. It is parsed entirely in the browser; only the extracted text is sent to and stored in Supabase, tied to that User. The original file is never transmitted to the server or stored anywhere. After upload, the User lands on a document page showing the raw extracted text.

**Blocked by:** 01

**Status:** done

- [x] User can upload a document file from the browser
- [x] Parsing happens client-side; the original file is never sent to the server or stored (CLAUDE.md invariant)
- [x] Only the extracted text is persisted to Supabase, associated with the uploading User
- [x] After upload, User is taken to a document page rendering the extracted text
- [x] Network inspection confirms no original file bytes leave the browser (verified by inspection: `saveDocument`'s Server Action parameter type is `{ filename: string; text: string }` — a File/Blob cannot cross that boundary; confirmed no other code path imports `lib/parse-document.ts` outside the client component and its test)

## Comments

Migration `supabase/migrations/0001_documents.sql` is written but unverified against a live database — no Supabase CLI/Docker available in this build environment.
