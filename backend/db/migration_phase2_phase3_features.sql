-- Migration: Phase 2 (F2-3, F2-4) & Phase 3 (G3-1, G3-2, G3-3) Features

-- ── F2-3: Interview Recording & Transcript Playback ───────────────────────────
CREATE TABLE IF NOT EXISTS interview_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  turn_index INTEGER NOT NULL DEFAULT 0,
  speaker TEXT NOT NULL CHECK (speaker IN ('interviewer', 'candidate', 'system')),
  transcript_text TEXT NOT NULL DEFAULT '',
  ideal_answer TEXT DEFAULT '',
  turn_score NUMERIC(5, 2),
  feedback_notes TEXT DEFAULT '',
  timestamp_ms INTEGER NOT NULL DEFAULT 0,
  audio_url TEXT DEFAULT NULL,
  audio_consent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_transcripts_session
  ON interview_transcripts (session_id, turn_index ASC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_interview_transcripts_user
  ON interview_transcripts (user_id, created_at DESC);

ALTER TABLE interview_transcripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS interview_transcripts_owner_policy ON interview_transcripts;
CREATE POLICY interview_transcripts_owner_policy
  ON interview_transcripts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── F2-4: Daily Streak Push Tokens & Reminder Log ─────────────────────────────
ALTER TABLE user_streaks ADD COLUMN IF NOT EXISTS last_reminded_date DATE DEFAULT NULL;

CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  platform TEXT DEFAULT 'expo',
  email_reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_reminded_date DATE DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, expo_push_token)
);

ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_push_tokens_owner_policy ON user_push_tokens;
CREATE POLICY user_push_tokens_owner_policy
  ON user_push_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── G3-1: Freemium Feature Gates ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'elite')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  limit_value INTEGER DEFAULT NULL, -- NULL = unlimited
  limit_period TEXT DEFAULT 'month' CHECK (limit_period IN ('day', 'week', 'month', 'total', 'unlimited')),
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (feature_key, tier)
);

INSERT INTO feature_gates (feature_key, tier, enabled, limit_value, limit_period, description)
VALUES
  ('ai_mock_interview', 'free', true, 3, 'month', 'AI mock interviews per month'),
  ('ai_mock_interview', 'pro', true, NULL, 'unlimited', 'Unlimited AI mock interviews'),
  ('ai_mock_interview', 'elite', true, NULL, 'unlimited', 'Unlimited AI mock interviews'),
  ('company_question_bank', 'free', true, 2, 'total', 'Company question banks'),
  ('company_question_bank', 'pro', true, NULL, 'unlimited', 'All company question banks'),
  ('company_question_bank', 'elite', true, NULL, 'unlimited', 'All company question banks'),
  ('voice_interview', 'free', true, 1, 'week', 'Voice interview sessions per week'),
  ('voice_interview', 'pro', true, 10, 'week', '10 voice interview sessions per week'),
  ('voice_interview', 'elite', true, NULL, 'unlimited', 'Unlimited voice interview sessions'),
  ('resume_analysis', 'free', true, 1, 'total', 'Resume analysis'),
  ('resume_analysis', 'pro', true, 5, 'month', '5 resume analyses per month'),
  ('resume_analysis', 'elite', true, NULL, 'unlimited', 'Unlimited resume analyses'),
  ('code_review_ai', 'free', false, 0, 'month', 'AI Code Review for real projects'),
  ('code_review_ai', 'pro', true, 3, 'month', '3 AI code reviews per month'),
  ('code_review_ai', 'elite', true, NULL, 'unlimited', 'Unlimited AI code reviews'),
  ('peer_interview_room', 'free', false, 0, 'total', 'Peer interview rooms'),
  ('peer_interview_room', 'pro', true, NULL, 'unlimited', 'Peer interview rooms'),
  ('peer_interview_room', 'elite', true, NULL, 'unlimited', 'Peer interview rooms'),
  ('job_application_tracker', 'free', true, 10, 'total', 'Job application tracker entries'),
  ('job_application_tracker', 'pro', true, NULL, 'unlimited', 'Unlimited job tracker entries'),
  ('job_application_tracker', 'elite', true, NULL, 'unlimited', 'Unlimited job tracker entries'),
  ('improvement_plan_ai', 'free', false, 0, 'total', 'AI improvement plan'),
  ('improvement_plan_ai', 'pro', true, NULL, 'unlimited', 'AI improvement plan'),
  ('improvement_plan_ai', 'elite', true, NULL, 'unlimited', 'AI improvement plan + coaching')
ON CONFLICT (feature_key, tier) DO NOTHING;

-- ── G3-2: Referral & Coin Economy ─────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles (referral_code) WHERE referral_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'rewarded')),
  reward_coins INTEGER NOT NULL DEFAULT 500,
  rewarded_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals (referrer_id, status);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals (referral_code);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS referrals_owner_policy ON referrals;
CREATE POLICY referrals_owner_policy
  ON referrals
  FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- ── G3-3: Weekly Contest System with Leaderboard ──────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_contests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 90,
  problems JSONB NOT NULL DEFAULT '[]'::jsonb,
  prizes JSONB NOT NULL DEFAULT '{"top3":"1 month Pro free","finisherCoins":50}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_contest_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id TEXT NOT NULL REFERENCES weekly_contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT DEFAULT 'Candidate',
  score INTEGER NOT NULL DEFAULT 0,
  problems_solved INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  finished_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (contest_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_weekly_contest_leaderboard
  ON weekly_contest_submissions (contest_id, score DESC, time_taken_seconds ASC);

ALTER TABLE weekly_contest_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS weekly_contest_submissions_read_policy ON weekly_contest_submissions;
CREATE POLICY weekly_contest_submissions_read_policy
  ON weekly_contest_submissions
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS weekly_contest_submissions_write_policy ON weekly_contest_submissions;
CREATE POLICY weekly_contest_submissions_write_policy
  ON weekly_contest_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
