-- Migration: Real-Time Multi-User / Peer Interview Rooms
-- Allows candidates to practice mock interviews in pairs with synchronized code and rubrics

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

-- Indexes for fast query lookup
CREATE INDEX IF NOT EXISTS idx_peer_rooms_status ON public.peer_interview_rooms(status);
CREATE INDEX IF NOT EXISTS idx_peer_rooms_room_code ON public.peer_interview_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_peer_rooms_candidate ON public.peer_interview_rooms(candidate_id);
CREATE INDEX IF NOT EXISTS idx_peer_rooms_interviewer ON public.peer_interview_rooms(interviewer_id);

