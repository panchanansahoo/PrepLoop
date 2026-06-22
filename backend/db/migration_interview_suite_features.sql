-- Interview intelligence features: peer matching, mentor booking, and doubt threads
-- Safe to run multiple times.

-- =========================
-- 1) Peer mock profile + requests
-- =========================
CREATE TABLE IF NOT EXISTS peer_mock_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  role_target VARCHAR(120) NOT NULL,
  company_target VARCHAR(120),
  language_preference VARCHAR(50) DEFAULT 'english',
  skill_level VARCHAR(30) DEFAULT 'intermediate' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  availability JSONB DEFAULT '[]'::jsonb,
  bio TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS peer_mock_requests (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_target VARCHAR(120) NOT NULL,
  company_target VARCHAR(120),
  language_preference VARCHAR(50) DEFAULT 'english',
  skill_level VARCHAR(30) DEFAULT 'intermediate' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  requested_slot TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'matched', 'cancelled', 'completed')),
  matched_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_peer_profiles_role_company ON peer_mock_profiles(role_target, company_target);
CREATE INDEX IF NOT EXISTS idx_peer_profiles_user ON peer_mock_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_peer_requests_user ON peer_mock_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_peer_requests_status ON peer_mock_requests(status);

-- =========================
-- 2) Mentor slots + bookings
-- =========================
CREATE TABLE IF NOT EXISTS mentor_mock_slots (
  id SERIAL PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_focus VARCHAR(120),
  role_focus VARCHAR(120),
  language VARCHAR(50) DEFAULT 'english',
  skill_band VARCHAR(30) DEFAULT 'intermediate' CHECK (skill_band IN ('beginner', 'intermediate', 'advanced')),
  topic VARCHAR(120),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS mentor_mock_bookings (
  id SERIAL PRIMARY KEY,
  slot_id INTEGER NOT NULL REFERENCES mentor_mock_slots(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(30) DEFAULT 'booked' CHECK (status IN ('booked', 'completed', 'cancelled')),
  booking_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(slot_id)
);

CREATE INDEX IF NOT EXISTS idx_mentor_slots_mentor ON mentor_mock_slots(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_slots_time ON mentor_mock_slots(starts_at);
CREATE INDEX IF NOT EXISTS idx_mentor_slots_filters ON mentor_mock_slots(company_focus, role_focus, language, skill_band);
CREATE INDEX IF NOT EXISTS idx_mentor_bookings_user ON mentor_mock_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_bookings_mentor ON mentor_mock_bookings(mentor_id);

-- =========================
-- 3) Doubt threads + replies + votes
-- =========================
CREATE TABLE IF NOT EXISTS doubt_threads (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type VARCHAR(30) NOT NULL CHECK (target_type IN ('problem', 'pattern', 'interview_round')),
  target_id VARCHAR(120) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  solved BOOLEAN DEFAULT FALSE,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doubt_replies (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER NOT NULL REFERENCES doubt_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_mentor_reply BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doubt_votes (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER NOT NULL REFERENCES doubt_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_doubt_threads_target ON doubt_threads(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_doubt_threads_user ON doubt_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_doubt_replies_thread ON doubt_replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_doubt_votes_thread ON doubt_votes(thread_id);

-- =========================
-- 4) RLS
-- =========================
ALTER TABLE peer_mock_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_mock_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_mock_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_mock_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubt_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubt_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubt_votes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'peer_mock_profiles' AND policyname = 'Users can view peer profiles'
  ) THEN
    CREATE POLICY "Users can view peer profiles" ON peer_mock_profiles FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'peer_mock_profiles' AND policyname = 'Users can manage own peer profile'
  ) THEN
    CREATE POLICY "Users can manage own peer profile" ON peer_mock_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'peer_mock_requests' AND policyname = 'Users can view peer requests'
  ) THEN
    CREATE POLICY "Users can view peer requests" ON peer_mock_requests FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'peer_mock_requests' AND policyname = 'Users can manage own peer requests'
  ) THEN
    CREATE POLICY "Users can manage own peer requests" ON peer_mock_requests FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mentor_mock_slots' AND policyname = 'Users can view mentor slots'
  ) THEN
    CREATE POLICY "Users can view mentor slots" ON mentor_mock_slots FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mentor_mock_slots' AND policyname = 'Mentors can manage own slots'
  ) THEN
    CREATE POLICY "Mentors can manage own slots" ON mentor_mock_slots FOR ALL USING (auth.uid() = mentor_id) WITH CHECK (auth.uid() = mentor_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mentor_mock_bookings' AND policyname = 'Users can view related mentor bookings'
  ) THEN
    CREATE POLICY "Users can view related mentor bookings" ON mentor_mock_bookings FOR SELECT USING (auth.uid() = user_id OR auth.uid() = mentor_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mentor_mock_bookings' AND policyname = 'Users can create own mentor bookings'
  ) THEN
    CREATE POLICY "Users can create own mentor bookings" ON mentor_mock_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mentor_mock_bookings' AND policyname = 'Users can update related mentor bookings'
  ) THEN
    CREATE POLICY "Users can update related mentor bookings" ON mentor_mock_bookings FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = mentor_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doubt_threads' AND policyname = 'Users can view doubt threads'
  ) THEN
    CREATE POLICY "Users can view doubt threads" ON doubt_threads FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doubt_threads' AND policyname = 'Users can create doubt threads'
  ) THEN
    CREATE POLICY "Users can create doubt threads" ON doubt_threads FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doubt_threads' AND policyname = 'Users can update own doubt threads'
  ) THEN
    CREATE POLICY "Users can update own doubt threads" ON doubt_threads FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doubt_replies' AND policyname = 'Users can view doubt replies'
  ) THEN
    CREATE POLICY "Users can view doubt replies" ON doubt_replies FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doubt_replies' AND policyname = 'Users can create doubt replies'
  ) THEN
    CREATE POLICY "Users can create doubt replies" ON doubt_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doubt_votes' AND policyname = 'Users can view doubt votes'
  ) THEN
    CREATE POLICY "Users can view doubt votes" ON doubt_votes FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doubt_votes' AND policyname = 'Users can manage own doubt votes'
  ) THEN
    CREATE POLICY "Users can manage own doubt votes" ON doubt_votes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
