-- Add columns for Station F data
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS sector text,
ADD COLUMN IF NOT EXISTS stack text[], -- Array of strings
ADD COLUMN IF NOT EXISTS pitch text,
ADD COLUMN IF NOT EXISTS source text DEFAULT 'lba', -- 'lba' or 'stationf'
ADD COLUMN IF NOT EXISTS location text;

-- Add index on source for faster filtering
CREATE INDEX IF NOT EXISTS idx_jobs_source ON public.jobs(source);

-- Ensure external_id is unique so we can upsert
ALTER TABLE public.jobs ADD CONSTRAINT jobs_external_id_key UNIQUE (external_id);
