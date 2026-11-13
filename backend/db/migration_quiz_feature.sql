-- Migration: Quiz feature storage and leaderboard support

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_topic_attempted
  ON quiz_attempts(user_id, topic, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_topic_attempted
  ON quiz_attempts(topic, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_attempted_at
  ON quiz_attempts(attempted_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quiz_attempts' AND policyname = 'Users can view own quiz attempts'
  ) THEN
    CREATE POLICY "Users can view own quiz attempts"
      ON quiz_attempts
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quiz_attempts' AND policyname = 'Users can insert own quiz attempts'
  ) THEN
    CREATE POLICY "Users can insert own quiz attempts"
      ON quiz_attempts
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
