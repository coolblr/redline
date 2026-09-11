-- 0004_red_lines.sql
--
-- Red lines: the User's own editable list of what they care about within
-- each of the seven clause types, which drives which risks analyzeDocument
-- surfaces (spec.md user stories 18-19; PRD.md "My red lines").
--
-- Scope decision (deferred by 0002_analysis_schema.sql, settled here):
-- per-user, not per-document. PRD.md and spec.md both describe red lines as
-- belonging to the User broadly ("an editable list of the User's own red
-- lines that drives the analysis") rather than to any one document, and
-- spec.md explicitly left the scope choice to implementation time. Per-user
-- is the simpler, more natural reading of that language, and it matches how
-- a real User thinks about their own red lines: as a standing set of
-- concerns they carry into every contract they're handed, not something
-- they'd want to redefine document by document. See the ticket 07 report
-- for the full reasoning.
--
-- One row per (user_id, clause_type) -- enforced by the unique constraint
-- below, which is also what a lazy-seed upsert (lib/red-lines-store.ts)
-- relies on to avoid duplicate rows on concurrent first-access.
--
-- No Supabase CLI or Docker is available in the environment this was
-- authored in, so this migration has not been applied against a live
-- database. Written as standard Postgres + Supabase RLS SQL, same idiom as
-- 0001_documents.sql and 0002_analysis_schema.sql.

create table if not exists red_lines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  clause_type text not null check (
    clause_type in (
      'indemnification',
      'ip-assignment',
      'limitation-of-liability',
      'non-compete',
      'unilateral-termination',
      'scope-creep',
      'arbitration'
    )
  ),
  guidance text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, clause_type)
);

alter table red_lines enable row level security;

create policy "Users can select their own red lines"
  on red_lines for select
  using (auth.uid() = user_id);

create policy "Users can insert their own red lines"
  on red_lines for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own red lines"
  on red_lines for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own red lines"
  on red_lines for delete
  using (auth.uid() = user_id);
