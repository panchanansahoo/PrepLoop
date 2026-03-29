-- Bundle migration: Email verification + Coins/Streak/Chat + Interview scheduling
-- Safe to run multiple times.

-- =========================
-- 1) Email verification
-- =========================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_verification_token ON profiles(verification_token);
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(email_verified);

-- =========================
-- 2) Coins + streak profile fields
-- =========================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_date TEXT;

-- =========================
-- 3) Coin transactions
-- =========================
CREATE TABLE IF NOT EXISTS coin_transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('earn', 'spend')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id);

-- =========================
-- 4) Chat messages
-- =========================
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);

-- =========================
-- 5) Interview slots
-- =========================
CREATE TABLE IF NOT EXISTS interview_slots (
  id SERIAL PRIMARY KEY,
  hr_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  booked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_slots_hr ON interview_slots(hr_id);
CREATE INDEX IF NOT EXISTS idx_interview_slots_date ON interview_slots(slot_date);

-- =========================
-- 6) Real interviews
-- =========================
CREATE TABLE IF NOT EXISTS real_interviews (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  hr_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  slot_id INTEGER REFERENCES interview_slots(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  meeting_link TEXT,
  notes TEXT,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_real_interviews_user ON real_interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_real_interviews_hr ON real_interviews(hr_id);

-- =========================
-- 7) RLS + idempotent policies
-- =========================
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_interviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'coin_transactions' AND policyname = 'Users can view own coin transactions'
  ) THEN
    CREATE POLICY "Users can view own coin transactions"
    ON coin_transactions FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chat_messages' AND policyname = 'Users can view own chat messages'
  ) THEN
    CREATE POLICY "Users can view own chat messages"
    ON chat_messages FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'interview_slots' AND policyname = 'Anyone can view available slots'
  ) THEN
    CREATE POLICY "Anyone can view available slots"
    ON interview_slots FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'real_interviews' AND policyname = 'Users can view own interviews'
  ) THEN
    CREATE POLICY "Users can view own interviews"
    ON real_interviews FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
