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
