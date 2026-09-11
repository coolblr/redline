-- 0003_documents_summary.sql
--
-- Ticket 03's schema (0001_documents.sql) had no column to hold the
-- plain-English summary analyzeDocument produces (ticket 04). This adds
-- one nullable text column -- null means "not analyzed yet," the signal
-- app/documents/[id]/page.tsx uses to decide whether to show a "Run
-- analysis" action or the persisted summary/flags.
--
-- Same caveat as 0001/0002: no Supabase CLI or Docker is available in the
-- environment this was authored in, so this migration has not been applied
-- against a live database.

alter table documents add column if not exists summary text;
