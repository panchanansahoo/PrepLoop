-- Daily wins micro-journal
CREATE TABLE IF NOT EXISTS daily_wins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  topic TEXT NOT NULL,
  note TEXT DEFAULT '',
  minutes INT DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE daily_wins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wins" ON daily_wins FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_daily_wins_user_date ON daily_wins(user_id, date);

-- Pattern trainer attempts
CREATE TABLE IF NOT EXISTS pattern_trainer_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id TEXT NOT NULL,
  guessed_pattern TEXT NOT NULL,
  correct_pattern TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pattern_trainer_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pattern attempts" ON pattern_trainer_attempts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_pattern_attempts_user ON pattern_trainer_attempts(user_id);

-- Answer timer attempts
CREATE TABLE IF NOT EXISTS timer_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL,
  question TEXT,
  time_taken_seconds INT,
  completed_in_time BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE timer_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own timer attempts" ON timer_attempts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_timer_attempts_user ON timer_attempts(user_id);
