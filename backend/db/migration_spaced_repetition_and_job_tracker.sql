-- Migration: Spaced Repetition (SM-2) + Job Application Tracker (Kanban)
-- Features: F2-1 (user_problem_reviews) and F2-6 (job_applications)

-- ── F2-1: Spaced Repetition for DSA Problems ──────────────────────────────────
CREATE TABLE IF NOT EXISTS user_problem_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id TEXT NOT NULL,
  problem_title TEXT DEFAULT '',
  repetitions INTEGER NOT NULL DEFAULT 0,
  interval_days INTEGER NOT NULL DEFAULT 1,
  ease_factor NUMERIC(4, 2) NOT NULL DEFAULT 2.50,
  last_quality INTEGER CHECK (last_quality >= 0 AND last_quality <= 5),
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, problem_id)
);

CREATE INDEX IF NOT EXISTS idx_user_problem_reviews_due
  ON user_problem_reviews (user_id, next_review_at ASC);

ALTER TABLE user_problem_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_problem_reviews_owner_policy ON user_problem_reviews;
CREATE POLICY user_problem_reviews_owner_policy
  ON user_problem_reviews
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── F2-6: Job Application Tracker (Kanban) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'bookmarked'
    CHECK (status IN ('bookmarked', 'applied', 'phone_screen', 'technical', 'onsite', 'offer', 'rejected')),
  notes TEXT DEFAULT '',
  job_url TEXT DEFAULT '',
  location TEXT DEFAULT '',
  salary_range TEXT DEFAULT '',
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_applications_user
  ON job_applications (user_id, status, applied_at DESC NULLS LAST, created_at DESC);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS job_applications_owner_policy ON job_applications;
CREATE POLICY job_applications_owner_policy
  ON job_applications
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
