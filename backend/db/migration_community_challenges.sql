-- Migration: Community Weekly Challenges & Leaderboards
-- Empowers weekly coding drops with real-time score ranking

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

CREATE INDEX IF NOT EXISTS idx_challenges_active ON public.community_challenges(is_active, year, week_number);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON public.challenge_submissions(user_id, challenge_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_challenge_user ON public.challenge_submissions(challenge_id, user_id) WHERE challenge_id IS NOT NULL;

