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

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'peer_interview_rooms' AND policyname = 'Participants can update their peer rooms'
    ) THEN
        CREATE POLICY "Participants can update their peer rooms"
            ON public.peer_interview_rooms
            FOR UPDATE
            USING (auth.uid() = interviewer_id OR auth.uid() = candidate_id)
            WITH CHECK (auth.uid() = interviewer_id OR auth.uid() = candidate_id);
    END IF;
END $$;


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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(year, week_number, difficulty)
);

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

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'challenge_submissions' AND policyname = 'Users can view their own submissions or public passed'
    ) THEN
        CREATE POLICY "Users can view their own submissions or public passed"
            ON public.challenge_submissions
            FOR SELECT
            USING (auth.uid() = user_id OR status = 'passed');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'challenge_submissions' AND policyname = 'Users can submit challenge solutions'
    ) THEN
        CREATE POLICY "Users can submit challenge solutions"
            ON public.challenge_submissions
            FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;


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

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Users have full control over their own API keys'
    ) THEN
        CREATE POLICY "Users have full control over their own API keys"
            ON public.api_keys
            FOR ALL
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

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
