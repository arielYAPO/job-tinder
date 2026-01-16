-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ymvzketndlglxsrjjvhj/sql
-- Add enrichment columns for structured job data

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS is_tech boolean,
  ADD COLUMN IF NOT EXISTS job_family text,
  ADD COLUMN IF NOT EXISTS role_labels text[],
  ADD COLUMN IF NOT EXISTS ai_relevance text,
  ADD COLUMN IF NOT EXISTS ai_signals_strong text[],
  ADD COLUMN IF NOT EXISTS ai_signals_weak text[],
  ADD COLUMN IF NOT EXISTS skills_norm text[],
  ADD COLUMN IF NOT EXISTS summary_1l text,
  ADD COLUMN IF NOT EXISTS suggested_outreach_roles text[],
  ADD COLUMN IF NOT EXISTS enrichment_version int,
  ADD COLUMN IF NOT EXISTS enriched_at timestamptz,
  ADD COLUMN IF NOT EXISTS enrichment_error text,
  ADD COLUMN IF NOT EXISTS enrichment_json jsonb;

-- Indexes for fast matching
CREATE INDEX IF NOT EXISTS idx_jobs_is_tech ON public.jobs(is_tech);
CREATE INDEX IF NOT EXISTS idx_jobs_ai_relevance ON public.jobs(ai_relevance);
CREATE INDEX IF NOT EXISTS idx_jobs_job_family ON public.jobs(job_family);
CREATE INDEX IF NOT EXISTS idx_jobs_enrichment_version ON public.jobs(enrichment_version);
