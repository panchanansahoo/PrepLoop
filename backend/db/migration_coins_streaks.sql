-- Migration: Coins, Streaks, Real Interviews, Chat
-- Run this against your Supabase database

-- 1. Add coin & streak columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_date TEXT;

-- 2. Coin transactions ledger
CREATE TABLE IF NOT EXISTS coin_transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('earn', 'spend')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id);

-- 3. Chat messages (AI assistant history)
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);

-- 4. Interview slots (HR availability)
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

-- 5. Real interviews (booked sessions)
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

-- 6. RLS policies
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coin transactions" ON coin_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own chat messages" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view available slots" ON interview_slots FOR SELECT USING (true);
CREATE POLICY "Users can view own interviews" ON real_interviews FOR SELECT USING (auth.uid() = user_id);
