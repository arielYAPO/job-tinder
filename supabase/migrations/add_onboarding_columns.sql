-- Migration: Add onboarding columns to profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS goal_type TEXT CHECK (goal_type IN ('apprenticeship', 'internship', 'fulltime')),
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS job_preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS has_liked_job BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_generated_cv BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_downloaded_cv BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN profiles.onboarding_step IS 'Onboarding step: 0-4 = in progress, 5 = complete';
COMMENT ON COLUMN profiles.goal_type IS 'User goal: apprenticeship, internship, or fulltime';
COMMENT ON COLUMN profiles.job_preferences IS 'JSON with city, job_family, start_date, remote_preference';
