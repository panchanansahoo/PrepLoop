-- Migration: Custom Question Sets for Employer Portal
-- Creates custom_question_sets table used by /api/employer/question-banks

CREATE TABLE IF NOT EXISTS custom_question_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL CHECK (char_length(trim(title)) > 0),
  company VARCHAR(255) NOT NULL DEFAULT 'Enterprise Partner',
  role VARCHAR(255) NOT NULL DEFAULT 'Software Engineer',
  questions JSONB NOT NULL DEFAULT '[]'
    CHECK (jsonb_typeof(questions) = 'array'),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_question_sets_created_by
  ON custom_question_sets(created_by, created_at DESC);

ALTER TABLE custom_question_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on custom_question_sets" ON custom_question_sets;
CREATE POLICY "Service role full access on custom_question_sets"
  ON custom_question_sets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Employers can manage own custom question sets" ON custom_question_sets;
CREATE POLICY "Employers can manage own custom question sets"
  ON custom_question_sets
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
