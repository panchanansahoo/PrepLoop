-- Migration: Row Level Security (RLS) & Schema Hardening for Enterprise Tables
-- Self-contained: safely creates tables IF NOT EXISTS, then enables RLS and policies idempotently.

-- ============================================================================
-- 1. PEER INTERVIEW ROOMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.peer_interview_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(12) UNIQUE NOT NULL,
    interviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    candidate_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    problem_id TEXT,
    status VARCHAR(30) DEFAULT 'waiting', -- 'waiting', 'active', 'completed', 'cancelled'
    code_snapshot TEXT,
    language VARCHAR(30) DEFAULT 'javascript',
    scores JSONB DEFAULT '{}'::jsonb,
    feedback_notes TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_peer_rooms_status ON public.peer_interview_rooms(status);
CREATE INDEX IF NOT EXISTS idx_peer_rooms_room_code ON public.peer_interview_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_peer_rooms_candidate ON public.peer_interview_rooms(candidate_id);
CREATE INDEX IF NOT EXISTS idx_peer_rooms_interviewer ON public.peer_interview_rooms(interviewer_id);

ALTER TABLE public.peer_interview_rooms ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'peer_interview_rooms' AND policyname = 'Users can view rooms they participate in or waiting rooms'
    ) THEN
        CREATE POLICY "Users can view rooms they participate in or waiting rooms"
            ON public.peer_interview_rooms
            FOR SELECT
            USING (
                auth.uid() = interviewer_id 
                OR auth.uid() = candidate_id 
                OR status = 'waiting'
            );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'peer_interview_rooms' AND policyname = 'Users can create peer interview rooms'
    ) THEN
        CREATE POLICY "Users can create peer interview rooms"
            ON public.peer_interview_rooms
            FOR INSERT
            WITH CHECK (auth.uid() = interviewer_id);
    END IF;
END $$;

DROP POLICY IF EXISTS "Participants can update their peer rooms" ON public.peer_interview_rooms;
DROP POLICY IF EXISTS "Participants and candidates can update peer rooms" ON public.peer_interview_rooms;

-- Allow interviewer, candidate, or a joining candidate (when waiting) to update room
CREATE POLICY "Participants and candidates can update peer rooms"
    ON public.peer_interview_rooms
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = interviewer_id 
        OR auth.uid() = candidate_id 
        OR (candidate_id IS NULL AND status = 'waiting')
    )
    WITH CHECK (
        auth.uid() = interviewer_id 
        OR auth.uid() = candidate_id
    );

-- Defense-in-depth: trigger to protect peer interview scores and creator from candidate tampering
CREATE OR REPLACE FUNCTION public.protect_peer_room_scores()
RETURNS TRIGGER AS $$
BEGIN
  IF (current_user IN ('anon', 'authenticated') OR (auth.jwt() IS NOT NULL AND auth.role() = 'authenticated')) THEN
    IF (auth.uid() IS NOT NULL AND auth.uid() != OLD.interviewer_id) THEN
      IF NEW.scores IS DISTINCT FROM OLD.scores THEN
        RAISE EXCEPTION 'Security violation: Candidates cannot modify peer interview scores.';
      END IF;
      IF NEW.interviewer_id IS DISTINCT FROM OLD.interviewer_id THEN
        RAISE EXCEPTION 'Security violation: Interviewer cannot be modified.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_peer_room_scores ON public.peer_interview_rooms;
CREATE TRIGGER trg_protect_peer_room_scores
  BEFORE UPDATE ON public.peer_interview_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_peer_room_scores();


-- ============================================================================
-- 2. COMMUNITY CHALLENGES & SUBMISSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.community_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_number INT NOT NULL,
    year INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
    points INT DEFAULT 25,
    starter_code JSONB DEFAULT '{"javascript": "// Code here"}'::jsonb,
    test_cases JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(year, week_number, difficulty)
);

ALTER TABLE public.community_challenges ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_challenges_active ON public.community_challenges(is_active, year, week_number);

CREATE TABLE IF NOT EXISTS public.challenge_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES public.community_challenges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    language VARCHAR(30) DEFAULT 'javascript',
    status VARCHAR(30) DEFAULT 'passed', -- 'passed', 'failed'
    execution_time_ms INT DEFAULT 0,
    score_awarded INT DEFAULT 0,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_user ON public.challenge_submissions(user_id, challenge_id);

ALTER TABLE public.community_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'community_challenges' AND policyname = 'Public read access to active community challenges'
    ) THEN
        CREATE POLICY "Public read access to active community challenges"
            ON public.community_challenges
            FOR SELECT
            USING (is_active = true);
    END IF;
END $$;

DROP POLICY IF EXISTS "Users can view their own submissions or public passed" ON public.challenge_submissions;
DROP POLICY IF EXISTS "Users can view own or completed challenge submissions" ON public.challenge_submissions;

-- Hide other users' passed submissions while challenge end_date > now() to prevent code leaking/scraping
CREATE POLICY "Users can view own or completed challenge submissions"
    ON public.challenge_submissions
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id 
        OR (
            status = 'passed' 
            AND EXISTS (
                SELECT 1 FROM public.community_challenges c
                WHERE c.id = challenge_submissions.challenge_id
                AND (c.end_date IS NOT NULL AND c.end_date <= NOW())
            )
        )
    );

DROP POLICY IF EXISTS "Users can submit challenge solutions" ON public.challenge_submissions;

-- Restrict direct client INSERT so scores cannot be forged (score evaluation is handled server-side)
CREATE POLICY "Users can submit challenge solutions"
    ON public.challenge_submissions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND (status IS NULL OR status = 'submitted' OR status = 'pending')
        AND (score_awarded IS NULL OR score_awarded = 0)
    );

-- Trigger protection: prevent client from forging 'passed' status or positive score_awarded
CREATE OR REPLACE FUNCTION public.protect_challenge_submission_scores()
RETURNS TRIGGER AS $$
BEGIN
  IF (current_user IN ('anon', 'authenticated') OR (auth.jwt() IS NOT NULL AND auth.role() = 'authenticated')) THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.status = 'passed' OR COALESCE(NEW.score_awarded, 0) > 0 THEN
        RAISE EXCEPTION 'Security violation: Submission status and scores must be evaluated server-side.';
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.status IS DISTINCT FROM OLD.status OR NEW.score_awarded IS DISTINCT FROM OLD.score_awarded THEN
        RAISE EXCEPTION 'Security violation: Submission status and scores cannot be modified by clients.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_challenge_submission_scores ON public.challenge_submissions;
CREATE TRIGGER trg_protect_challenge_submission_scores
  BEFORE INSERT OR UPDATE ON public.challenge_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_challenge_submission_scores();


-- ============================================================================
-- 3. PLATFORM API KEYS & WEBHOOKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(64) NOT NULL,
    prefix VARCHAR(12) NOT NULL,
    scopes TEXT[] DEFAULT ARRAY['interviews:read']::TEXT[],
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);

CREATE TABLE IF NOT EXISTS public.webhook_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    events TEXT[] DEFAULT ARRAY['interview.completed']::TEXT[],
    secret VARCHAR(64) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_user ON public.webhook_subscriptions(user_id);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID REFERENCES public.webhook_subscriptions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    response_status INT,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users have full control over their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.api_keys;
CREATE POLICY "Users can view their own API keys"
    ON public.api_keys
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.api_keys;
CREATE POLICY "Users can delete their own API keys"
    ON public.api_keys
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own api keys" ON public.api_keys;
CREATE POLICY "Users can insert own api keys"
    ON public.api_keys
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND scopes <@ ARRAY['interviews:read', 'interviews:write', 'interview:read', 'interview:write']::TEXT[]
        AND NOT (scopes @> ARRAY['*']::TEXT[])
    );

DROP POLICY IF EXISTS "Users can update own api keys" ON public.api_keys;
CREATE POLICY "Users can update own api keys"
    ON public.api_keys
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND scopes <@ ARRAY['interviews:read', 'interviews:write', 'interview:read', 'interview:write']::TEXT[]
        AND NOT (scopes @> ARRAY['*']::TEXT[])
    );

-- Trigger: strictly prevent client insertion/update of wildcard '*' scope or unauthorized elevated scopes
CREATE OR REPLACE FUNCTION public.protect_api_key_scopes()
RETURNS TRIGGER AS $$
BEGIN
  IF (current_user IN ('anon', 'authenticated') OR (auth.jwt() IS NOT NULL AND auth.role() = 'authenticated')) THEN
    IF NEW.scopes @> ARRAY['*']::TEXT[] THEN
      RAISE EXCEPTION 'Security violation: Wildcard scope is reserved for platform administrators.';
    END IF;
    IF NOT (NEW.scopes <@ ARRAY['interviews:read', 'interviews:write', 'interview:read', 'interview:write']::TEXT[]) THEN
      RAISE EXCEPTION 'Security violation: Unauthorized API key scope requested.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_api_key_scopes ON public.api_keys;
CREATE TRIGGER trg_protect_api_key_scopes
  BEFORE INSERT OR UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_api_key_scopes();

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'webhook_subscriptions' AND policyname = 'Users have full control over their webhook subscriptions'
    ) THEN
        CREATE POLICY "Users have full control over their webhook subscriptions"
            ON public.webhook_subscriptions
            FOR ALL
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'webhook_deliveries' AND policyname = 'Users can view deliveries for their own webhooks'
    ) THEN
        CREATE POLICY "Users can view deliveries for their own webhooks"
            ON public.webhook_deliveries
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.webhook_subscriptions s
                    WHERE s.id = webhook_deliveries.webhook_id
                    AND s.user_id = auth.uid()
                )
            );
    END IF;
END $$;


-- ============================================================================
-- 4. USER STREAKS & BADGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_streaks (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_active_date DATE,
    streak_freeze_count INT DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON public.user_streaks(user_id);

CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_code VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_code)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'user_streaks' AND policyname = 'Users can view their own streaks'
    ) THEN
        CREATE POLICY "Users can view their own streaks"
            ON public.user_streaks
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'user_badges' AND policyname = 'Users can view their own badges'
    ) THEN
        CREATE POLICY "Users can view their own badges"
            ON public.user_badges
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;


-- ============================================================================
-- 5. INTERVIEW SESSIONS & CHECKPOINTS RLS HARDENING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    interview_type VARCHAR(50) DEFAULT 'dsa',
    target_company VARCHAR(100),
    target_role VARCHAR(100),
    difficulty VARCHAR(50) DEFAULT 'medium',
    overall_score NUMERIC(5,2),
    conversation JSONB DEFAULT '[]'::jsonb,
    feedback JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_user ON public.interview_sessions(user_id);

CREATE TABLE IF NOT EXISTS public.interview_session_checkpoints (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_key TEXT NOT NULL,
    payload JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, session_key)
);

DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'interview_session_checkpoints' AND column_name = 'session_key'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_interview_checkpoints_session_key ON public.interview_session_checkpoints(session_key, user_id);
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'interview_session_checkpoints' AND column_name = 'updated_at'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_interview_checkpoints_updated ON public.interview_session_checkpoints(user_id, updated_at DESC);
    END IF;
END $$;

ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_session_checkpoints ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'interview_sessions' AND policyname = 'Users can view their own interview sessions'
    ) THEN
        CREATE POLICY "Users can view their own interview sessions"
            ON public.interview_sessions
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'interview_sessions' AND policyname = 'Users can insert their own interview sessions'
    ) THEN
        CREATE POLICY "Users can insert their own interview sessions"
            ON public.interview_sessions
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'interview_sessions' AND policyname = 'Users can update their own interview sessions'
    ) THEN
        CREATE POLICY "Users can update their own interview sessions"
            ON public.interview_sessions
            FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
END $$;

DROP POLICY IF EXISTS "Users can manage own interview checkpoints" ON public.interview_session_checkpoints;
DROP POLICY IF EXISTS "Users can view their own checkpoints" ON public.interview_session_checkpoints;
DROP POLICY IF EXISTS "Users can insert their own checkpoints" ON public.interview_session_checkpoints;

CREATE POLICY "Users can manage own interview checkpoints"
    ON public.interview_session_checkpoints
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Trigger: protect overall_score and feedback from client-side score forgery on interview_sessions
CREATE OR REPLACE FUNCTION public.protect_interview_session_scores()
RETURNS TRIGGER AS $$
BEGIN
  IF (current_user IN ('anon', 'authenticated') OR (auth.jwt() IS NOT NULL AND auth.role() = 'authenticated')) THEN
    IF NEW.overall_score IS DISTINCT FROM OLD.overall_score THEN
      RAISE EXCEPTION 'Security violation: Users cannot directly modify interview session scores.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_interview_session_scores ON public.interview_sessions;
CREATE TRIGGER trg_protect_interview_session_scores
  BEFORE UPDATE ON public.interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_interview_session_scores();


-- ============================================================================
-- 6. MULTI-ROUND SESSIONS RLS & SCORE PROTECTION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.multi_round_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  current_round INT NOT NULL DEFAULT 0,
  round_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  hiring_decision JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.multi_round_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own multi round sessions" ON public.multi_round_sessions;
DROP POLICY IF EXISTS "Users can view own multi round sessions" ON public.multi_round_sessions;
CREATE POLICY "Users can view own multi round sessions"
  ON public.multi_round_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own active multi round sessions" ON public.multi_round_sessions;
CREATE POLICY "Users can update own active multi round sessions"
  ON public.multi_round_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger: strictly prevent client-side forgery of round_scores and hiring_decision
CREATE OR REPLACE FUNCTION public.protect_multi_round_session_scores()
RETURNS TRIGGER AS $$
BEGIN
  IF (current_user IN ('anon', 'authenticated') OR (auth.jwt() IS NOT NULL AND auth.role() = 'authenticated')) THEN
    IF TG_OP = 'INSERT' THEN
      IF (NEW.round_scores IS NOT NULL AND jsonb_array_length(NEW.round_scores) > 0)
         OR NEW.hiring_decision IS NOT NULL THEN
        RAISE EXCEPTION 'Security violation: Initial round scores and hiring decision must be evaluated server-side.';
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.round_scores IS DISTINCT FROM OLD.round_scores THEN
        RAISE EXCEPTION 'Security violation: Candidates cannot modify multi-round session scores.';
      END IF;
      IF NEW.hiring_decision IS DISTINCT FROM OLD.hiring_decision THEN
        RAISE EXCEPTION 'Security violation: Candidates cannot modify hiring decisions.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_multi_round_session_scores ON public.multi_round_sessions;
CREATE TRIGGER trg_protect_multi_round_session_scores
  BEFORE INSERT OR UPDATE ON public.multi_round_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_multi_round_session_scores();


-- ============================================================================
-- 7. PERFORMANCE COMPOSITE INDEXES FOR HOT QUERY PATHS
-- ============================================================================

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'submissions') THEN
        CREATE INDEX IF NOT EXISTS idx_submissions_user_status_date 
            ON public.submissions(user_id, status, submitted_at DESC);
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interview_sessions') THEN
        CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_date 
            ON public.interview_sessions(user_id, created_at DESC);
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coin_transactions') THEN
        CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_date 
            ON public.coin_transactions(user_id, created_at DESC);
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'challenge_submissions') THEN
        CREATE INDEX IF NOT EXISTS idx_challenge_submissions_user_challenge 
            ON public.challenge_submissions(user_id, challenge_id);
    END IF;
END $$;
