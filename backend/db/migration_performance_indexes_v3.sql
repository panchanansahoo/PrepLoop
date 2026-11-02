-- Migration: Performance query indexes v3 for high-frequency queries
-- Safe to run multiple times (idempotent IF NOT EXISTS)

-- Checkpoints retrieval by session and user
CREATE INDEX IF NOT EXISTS idx_checkpoints_session_user ON interview_session_checkpoints(session_id, user_id);

-- Career ops evaluations chronological lookup per candidate
CREATE INDEX IF NOT EXISTS idx_career_ops_user_date ON career_ops_evaluations(user_id, created_at DESC);

-- Peer interview rooms lookup by code and status
CREATE INDEX IF NOT EXISTS idx_peer_rooms_code_status ON peer_interview_rooms(room_code, status);

-- Quiz attempts lookup by user and created date
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_date ON quiz_attempts(user_id, created_at DESC);

-- Community challenges active lookup
CREATE INDEX IF NOT EXISTS idx_community_challenges_active ON community_challenges(is_active, ends_at);

