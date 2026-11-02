-- Migration: Performance query indexes v3 for high-frequency queries
-- Safe to run multiple times (idempotent and resilient across schema versions)

-- 1. Checkpoints retrieval by session_key and user_id (interview_session_checkpoints uses session_key)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'interview_session_checkpoints' AND column_name = 'session_key'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_checkpoints_session_user ON public.interview_session_checkpoints(session_key, user_id);
    END IF;
END $$;

-- 2. Career ops evaluations chronological lookup per candidate
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'career_ops_evaluations' AND column_name = 'user_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_career_ops_user_date ON public.career_ops_evaluations(user_id, created_at DESC);
    END IF;
END $$;

-- 3. Peer interview rooms lookup by code and status
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'peer_interview_rooms' AND column_name = 'room_code'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_peer_rooms_code_status ON public.peer_interview_rooms(room_code, status);
    END IF;
END $$;

-- 4. Quiz attempts lookup by user and attempted date (quiz_attempts uses attempted_at)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quiz_attempts' AND column_name = 'attempted_at'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_date ON public.quiz_attempts(user_id, attempted_at DESC);
    END IF;
END $$;

-- 5. Community challenges active lookup by active status, year, and week
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'community_challenges' AND column_name = 'is_active'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_community_challenges_active ON public.community_challenges(is_active, year, week_number);
    END IF;
END $$;
