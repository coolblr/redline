-- 0001_documents.sql
--
-- Minimal foundation for a saved document: who uploaded it, what it was
-- called, and the text extracted from it in the browser (never the
-- original file — CLAUDE.md invariant).
--
-- This table is deliberately minimal. Ticket 03 (analysis schema design)
-- extends it with `flags`, `document_defects`, `counter_offers`, and
-- `qa_history` tables that reference `documents.id` — none of that lives
-- here, this is schema only for what upload-and-parse (ticket 02) needs.

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  filename text,
  extracted_text text not null,
  created_at timestamptz not null default now()
);

alter table documents enable row level security;

create policy "Users can select their own documents"
  on documents for select
  using (auth.uid() = user_id);

create policy "Users can insert their own documents"
  on documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own documents"
  on documents for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own documents"
  on documents for delete
  using (auth.uid() = user_id);
