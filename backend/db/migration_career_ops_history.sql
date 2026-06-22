-- Career Ops evaluation history
-- Stores JD fit analyses so users can revisit prior evaluations across sessions/devices.

CREATE TABLE IF NOT EXISTS career_ops_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT,
  role TEXT,
  job_description TEXT NOT NULL,
  candidate_headline TEXT,
  candidate_summary TEXT,
  candidate_skills TEXT[] DEFAULT '{}',
  overall_score NUMERIC(4,2) NOT NULL,
  score_band TEXT NOT NULL,
  dimensions JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_matches JSONB NOT NULL DEFAULT '[]'::jsonb,
  gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
  action_plan JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_career_ops_evaluations_user_id ON career_ops_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_career_ops_evaluations_created_at ON career_ops_evaluations(created_at DESC);

ALTER TABLE career_ops_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own career ops evaluations" ON career_ops_evaluations;
CREATE POLICY "Users can view own career ops evaluations"
  ON career_ops_evaluations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own career ops evaluations" ON career_ops_evaluations;
CREATE POLICY "Users can insert own career ops evaluations"
  ON career_ops_evaluations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
