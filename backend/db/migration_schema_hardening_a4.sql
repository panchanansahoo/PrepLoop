-- Migration: A4 Database Schema Hardening
-- Adds missing composite indexes and automatic updated_at triggers on major tables.

-- 1. Generic updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Missing composite indexes (safe idempotent creation)
CREATE INDEX IF NOT EXISTS idx_job_applications_user
  ON job_applications (user_id, status, applied_at DESC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interview_transcripts') THEN
    CREATE INDEX IF NOT EXISTS idx_interview_transcripts_session
      ON interview_transcripts (session_id, created_at DESC);
  END IF;
END $$;

-- 3. Attach updated_at triggers to major tables when they exist and have an updated_at column
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'profiles',
    'mock_interviews',
    'job_applications',
    'user_problem_reviews',
    'user_streaks',
    'portfolios',
    'improvement_plans',
    'feature_gates',
    'weekly_contests',
    'weekly_contest_submissions'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'updated_at'
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I', tbl, tbl);
      EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
        tbl,
        tbl
      );
    END IF;
  END LOOP;
END $$;
