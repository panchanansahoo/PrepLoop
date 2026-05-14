-- Migration: portfolio_resume_upload
-- Adds resume file URL and parsed timestamp to normalized_profiles

ALTER TABLE normalized_profiles
  ADD COLUMN IF NOT EXISTS resume_file_url TEXT,
  ADD COLUMN IF NOT EXISTS resume_file_name TEXT,
  ADD COLUMN IF NOT EXISTS resume_parsed_at TIMESTAMPTZ;

-- Index for querying profiles with uploaded resumes
CREATE INDEX IF NOT EXISTS idx_normalized_profiles_resume_parsed_at
  ON normalized_profiles (resume_parsed_at)
  WHERE resume_parsed_at IS NOT NULL;
