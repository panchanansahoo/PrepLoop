-- Migration: New Features (Behavioral Coach, Daily Questions, Interview Experiences)

-- Behavioral coach sessions
CREATE TABLE IF NOT EXISTS behavioral_coach_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT,
  answer TEXT NOT NULL,
  question_type TEXT DEFAULT 'behavioral',
  overall_score INTEGER,
  star_score INTEGER,
  filler_count INTEGER DEFAULT 0,
  analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_behavioral_coach_user ON behavioral_coach_sessions(user_id, created_at DESC);
ALTER TABLE behavioral_coach_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own behavioral sessions" ON behavioral_coach_sessions FOR ALL USING (auth.uid() = user_id);

-- Daily questions (one per user per day)
CREATE TABLE IF NOT EXISTS daily_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  questions JSONB NOT NULL,
  dsa_completed BOOLEAN DEFAULT FALSE,
  behavioral_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_daily_questions_user_date ON daily_questions(user_id, date DESC);
ALTER TABLE daily_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own daily questions" ON daily_questions FOR ALL USING (auth.uid() = user_id);

-- Interview experiences feed
CREATE TABLE IF NOT EXISTS interview_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  round_type TEXT DEFAULT 'technical',
  experience_text TEXT NOT NULL,
  outcome TEXT DEFAULT 'unknown' CHECK (outcome IN ('offer', 'rejected', 'pending', 'unknown')),
  yoe INTEGER DEFAULT 0,
  is_anonymous BOOLEAN DEFAULT TRUE,
  is_approved BOOLEAN DEFAULT TRUE,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_experiences_company ON interview_experiences(company, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_experiences_approved ON interview_experiences(is_approved, created_at DESC);
ALTER TABLE interview_experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read approved experiences" ON interview_experiences FOR SELECT USING (is_approved = TRUE);
CREATE POLICY "Users manage own experiences" ON interview_experiences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Experience upvotes
CREATE TABLE IF NOT EXISTS experience_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES interview_experiences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(experience_id, user_id)
);
ALTER TABLE experience_upvotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own upvotes" ON experience_upvotes FOR ALL USING (auth.uid() = user_id);

-- Helper RPCs for upvote counts
CREATE OR REPLACE FUNCTION increment_experience_upvotes(exp_id UUID)
RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE interview_experiences SET upvotes = upvotes + 1 WHERE id = exp_id;
$$;

CREATE OR REPLACE FUNCTION decrement_experience_upvotes(exp_id UUID)
RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE interview_experiences SET upvotes = GREATEST(0, upvotes - 1) WHERE id = exp_id;
$$;
