-- Migration: Admin Custom Interview Question Sets
-- Adds tables for admin-created question sets and user submission tracking
-- v2: Hardened RLS, CHECK constraints, auto-updating updated_at trigger

-- ═══════════════════════════════════════════════════════════════════
-- 1. TABLES
-- ═══════════════════════════════════════════════════════════════════

-- Admin Question Sets: stores custom interview question sets created by admins
CREATE TABLE IF NOT EXISTS admin_question_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL CHECK (char_length(trim(title)) > 0),
  description TEXT,
  share_code VARCHAR(20) NOT NULL UNIQUE CHECK (char_length(share_code) >= 5),
  interview_type VARCHAR(100) NOT NULL DEFAULT 'technical'
    CHECK (interview_type IN ('technical', 'behavioral', 'system-design', 'coding', 'dsa', 'mixed', 'hr')),
  difficulty VARCHAR(50) DEFAULT 'medium'
    CHECK (difficulty IN ('easy', 'medium', 'hard')),
  requires_login BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  questions JSONB NOT NULL DEFAULT '[]'
    CHECK (jsonb_typeof(questions) = 'array'),
  settings JSONB DEFAULT '{}'
    CHECK (jsonb_typeof(settings) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin Interview Submissions: tracks who took which custom interview and their scores
CREATE TABLE IF NOT EXISTS admin_interview_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID,
  question_set_id UUID NOT NULL REFERENCES admin_question_sets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  responses JSONB DEFAULT '[]'
    CHECK (jsonb_typeof(responses) = 'array'),
  scores JSONB DEFAULT '{}'
    CHECK (jsonb_typeof(scores) = 'object'),
  overall_score INTEGER NOT NULL DEFAULT 0
    CHECK (overall_score >= 0 AND overall_score <= 100),
  duration INTEGER NOT NULL DEFAULT 0
    CHECK (duration >= 0),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep this migration safe for databases created from the earlier version.
ALTER TABLE admin_interview_submissions
  ADD COLUMN IF NOT EXISTS attempt_id UUID;

UPDATE admin_interview_submissions
SET attempt_id = gen_random_uuid()
WHERE attempt_id IS NULL;

ALTER TABLE admin_interview_submissions
  ALTER COLUMN attempt_id SET NOT NULL;

-- ═══════════════════════════════════════════════════════════════════
-- 2. INDEXES
-- ═══════════════════════════════════════════════════════════════════

-- Single-column lookups
CREATE INDEX IF NOT EXISTS idx_admin_question_sets_admin_id
  ON admin_question_sets(admin_id);

-- Composite index for the hot public lookup: share_code + is_active
-- Covers: WHERE share_code = $1 AND is_active = true  (used by /start and /question-set/:code)
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_question_sets_share_code
  ON admin_question_sets(share_code);
CREATE INDEX IF NOT EXISTS idx_admin_question_sets_active_share
  ON admin_question_sets(share_code, is_active) WHERE is_active = true;

-- Submission lookups
CREATE INDEX IF NOT EXISTS idx_admin_submissions_set_id
  ON admin_interview_submissions(question_set_id);
CREATE INDEX IF NOT EXISTS idx_admin_submissions_user
  ON admin_interview_submissions(user_id);
-- Sorting submissions by completion time (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_admin_submissions_completed
  ON admin_interview_submissions(question_set_id, completed_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_submissions_attempt_id
  ON admin_interview_submissions(attempt_id);

-- Server-owned state for an in-progress custom interview.
CREATE TABLE IF NOT EXISTS admin_interview_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_set_id UUID NOT NULL REFERENCES admin_question_sets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stage VARCHAR(100) NOT NULL DEFAULT 'Technical',
  current_question_index INTEGER NOT NULL DEFAULT 0 CHECK (current_question_index >= 0),
  responses JSONB NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(responses) = 'array'),
  current_question_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  completion_reason VARCHAR(50),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE admin_interview_attempts
  ADD COLUMN IF NOT EXISTS stage VARCHAR(100) NOT NULL DEFAULT 'Technical';
ALTER TABLE admin_interview_attempts
  ADD COLUMN IF NOT EXISTS responses JSONB NOT NULL DEFAULT '[]'
  CHECK (jsonb_typeof(responses) = 'array');
ALTER TABLE admin_interview_attempts
  ADD COLUMN IF NOT EXISTS current_question_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE admin_interview_attempts
  ADD COLUMN IF NOT EXISTS completion_reason VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_admin_attempts_set_id
  ON admin_interview_attempts(question_set_id);
CREATE INDEX IF NOT EXISTS idx_admin_attempts_user_id
  ON admin_interview_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_attempts_active
  ON admin_interview_attempts(id, expires_at)
  WHERE completed_at IS NULL AND submitted_at IS NULL;

ALTER TABLE admin_interview_attempts ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════
-- 3. AUTO-UPDATE updated_at TRIGGER
-- ═══════════════════════════════════════════════════════════════════

-- Reusable trigger function (create once, safe to re-run)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop + recreate to make migration idempotent
DROP TRIGGER IF EXISTS trg_admin_question_sets_updated_at ON admin_question_sets;
CREATE TRIGGER trg_admin_question_sets_updated_at
  BEFORE UPDATE ON admin_question_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════
-- 4. ROW LEVEL SECURITY (Granular Policies)
-- ═══════════════════════════════════════════════════════════════════
--
-- The backend uses supabaseAdmin (service_role key) which BYPASSES RLS.
-- These policies only restrict direct Supabase client access (PostgREST).
--
-- Strategy:
--   admin_question_sets:
--     • Admins can CRUD their own sets (auth.uid() = admin_id)
--     • Anyone can SELECT active sets (for public share-code lookup)
--   admin_interview_submissions:
--     • Anyone can INSERT (guests submit without login)
--     • Admins can SELECT submissions for their own question sets
--     • No client-side UPDATE/DELETE (only backend manages these)

ALTER TABLE admin_question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_interview_submissions ENABLE ROW LEVEL SECURITY;

-- Drop legacy wide-open policies if they exist (from v1)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Service role full access on question sets" ON admin_question_sets;
  DROP POLICY IF EXISTS "Service role full access on submissions" ON admin_interview_submissions;
EXCEPTION WHEN undefined_object THEN
  NULL; -- table may not exist on first run
END $$;

-- ─── admin_question_sets policies ────────────────────────────────

-- Admins can manage (SELECT, INSERT, UPDATE, DELETE) their own question sets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_question_sets'
      AND policyname = 'Admins manage own question sets'
  ) THEN
    CREATE POLICY "Admins manage own question sets"
      ON admin_question_sets
      FOR ALL
      TO authenticated
      USING (auth.uid() = admin_id)
      WITH CHECK (auth.uid() = admin_id);
  END IF;
END $$;

-- Public access is served through the backend endpoint, which can hide
-- protected question text. Do not expose the table directly to anon users.
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public can read active question sets" ON admin_question_sets;
END $$;

-- ─── admin_interview_submissions policies ────────────────────────

-- Anyone can insert submissions (supports guest/public interviews)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_interview_submissions'
      AND policyname = 'Anyone can submit interview responses'
  ) THEN
    CREATE POLICY "Anyone can submit interview responses"
      ON admin_interview_submissions
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Admins can view submissions only for question sets they own
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_interview_submissions'
      AND policyname = 'Admins view own set submissions'
  ) THEN
    CREATE POLICY "Admins view own set submissions"
      ON admin_interview_submissions
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM admin_question_sets qs
          WHERE qs.id = question_set_id
            AND qs.admin_id = auth.uid()
        )
      );
  END IF;
END $$;
