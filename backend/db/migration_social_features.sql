-- Migration: Social features (Accountability Partners, Weekly Reports)

-- Accountability partner pairs
CREATE TABLE IF NOT EXISTS accountability_pairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weekly_goal TEXT DEFAULT '',
  focus_areas TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  CONSTRAINT unique_pair UNIQUE (user_a, user_b)
);
ALTER TABLE accountability_pairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own pairs" ON accountability_pairs FOR SELECT
  USING (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY "Users can create pairs" ON accountability_pairs FOR INSERT
  WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY "Users can update own pairs" ON accountability_pairs FOR UPDATE
  USING (auth.uid() = user_a OR auth.uid() = user_b);
CREATE INDEX IF NOT EXISTS idx_pairs_user_a ON accountability_pairs(user_a, status);
CREATE INDEX IF NOT EXISTS idx_pairs_user_b ON accountability_pairs(user_b, status);

-- Accountability opt-in pool
CREATE TABLE IF NOT EXISTS accountability_pool (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  timezone TEXT DEFAULT 'UTC',
  focus_areas TEXT[] DEFAULT '{}',
  matched BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE accountability_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pool entry" ON accountability_pool FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_pool_unmatched ON accountability_pool(matched, level);

-- Weekly prep reports
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  report_data JSONB NOT NULL DEFAULT '{}',
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_week UNIQUE (user_id, week_start)
);
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own reports" ON weekly_reports FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_week ON weekly_reports(user_id, week_start DESC);

-- Email subscription preferences
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  weekly_report BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own subscriptions" ON email_subscriptions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
