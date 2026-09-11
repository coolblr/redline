-- 0002_analysis_schema.sql
--
-- Extends 0001_documents.sql with the analysis data shape the spec defines,
-- so every later seam ticket (04 analyzeDocument, 06 document defects,
-- 08 draftCounterOffer, 09 answerQuestion) can persist its own output as
-- soon as it's built, without improvising storage.
--
-- Four tables, each scoped to a document via document_id -> documents(id):
--   flags           - severity-ranked risk flags (see lib/domain-types.ts Flag)
--   document_defects - dangling references / ambiguous terms, always a
--                      separate collection from flags, never merged (ADR-0008)
--   counter_offers  - one row per flag it responds to
--   qa_history      - document-scoped Q&A log
--
-- Out of scope for this migration: red-line schema. Ticket 07 adds a
-- separate migration for it once its shape (per-user vs. per-document
-- scope, entry shape) is settled — spec.md says that isn't fixed yet.
--
-- No Supabase CLI or Docker is available in the environment this was
-- authored in, so this migration has not been applied against a live
-- database. Written as standard Postgres + Supabase RLS SQL, same as
-- 0001_documents.sql.

create table if not exists flags (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents (id) on delete cascade,
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
  severity_tier text not null check (severity_tier in ('top', 'middle', 'cite-only')),
  standard_or_unusual text not null check (standard_or_unusual in ('standard', 'unusual')),
  treatment_depth text not null check (treatment_depth in ('sharp', 'generic')),
  citation text not null,
  rationale text not null,
  created_at timestamptz not null default now()
);

alter table flags enable row level security;

create policy "Users can select flags on their own documents"
  on flags for select
  using (document_id in (select id from documents where user_id = auth.uid()));

create policy "Users can insert flags on their own documents"
  on flags for insert
  with check (document_id in (select id from documents where user_id = auth.uid()));

create policy "Users can update flags on their own documents"
  on flags for update
  using (document_id in (select id from documents where user_id = auth.uid()))
  with check (document_id in (select id from documents where user_id = auth.uid()));

create policy "Users can delete flags on their own documents"
  on flags for delete
  using (document_id in (select id from documents where user_id = auth.uid()));

create table if not exists document_defects (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents (id) on delete cascade,
  defect_type text not null check (defect_type in ('dangling-reference', 'ambiguous-term')),
  description text not null,
  citation text not null,
  created_at timestamptz not null default now()
);

alter table document_defects enable row level security;

create policy "Users can select defects on their own documents"
  on document_defects for select
  using (document_id in (select id from documents where user_id = auth.uid()));

create policy "Users can insert defects on their own documents"
  on document_defects for insert
  with check (document_id in (select id from documents where user_id = auth.uid()));

create policy "Users can update defects on their own documents"
  on document_defects for update
  using (document_id in (select id from documents where user_id = auth.uid()))
  with check (document_id in (select id from documents where user_id = auth.uid()));

create policy "Users can delete defects on their own documents"
  on document_defects for delete
  using (document_id in (select id from documents where user_id = auth.uid()));

-- One row per flag it responds to (spec.md). document_id is denormalized
-- here for simpler RLS/queries; keeping it consistent with the referenced
-- flags.document_id is an application-logic concern, not enforced by a
-- DB trigger (per the ticket).
create table if not exists counter_offers (
  id uuid primary key default gen_random_uuid(),
  flag_id uuid not null references flags (id) on delete cascade,
  document_id uuid not null references documents (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

alter table counter_offers enable row level security;

create policy "Users can select counter-offers on their own documents"
  on counter_offers for select
  using (document_id in (select id from documents where user_id = auth.uid()));

create policy "Users can insert counter-offers on their own documents"
  on counter_offers for insert
  with check (document_id in (select id from documents where user_id = auth.uid()));

create policy "Users can update counter-offers on their own documents"
  on counter_offers for update
  using (document_id in (select id from documents where user_id = auth.uid()))
  with check (document_id in (select id from documents where user_id = auth.uid()));

create policy "Users can delete counter-offers on their own documents"
  on counter_offers for delete
  using (document_id in (select id from documents where user_id = auth.uid()));

create table if not exists qa_history (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents (id) on delete cascade,
  question text not null,
  answer text not null,
  addressed_by_document boolean not null,
  created_at timestamptz not null default now()
);

alter table qa_history enable row level security;

create policy "Users can select Q&A on their own documents"
  on qa_history for select
  using (document_id in (select id from documents where user_id = auth.uid()));

create policy "Users can insert Q&A on their own documents"
  on qa_history for insert
  with check (document_id in (select id from documents where user_id = auth.uid()));

create policy "Users can update Q&A on their own documents"
  on qa_history for update
  using (document_id in (select id from documents where user_id = auth.uid()))
  with check (document_id in (select id from documents where user_id = auth.uid()));

create policy "Users can delete Q&A on their own documents"
  on qa_history for delete
  using (document_id in (select id from documents where user_id = auth.uid()));
