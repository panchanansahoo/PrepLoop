-- Migration: Add Performance Indexes for AI Interview Sessions
-- Goal: Optimize queries filtering by user, state, and type

-- 1. Index for querying active/completed sessions per user efficiently
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_sessions_user_id_status_created_at 
ON interview_sessions (user_id, status, created_at DESC);

-- 2. Index for analytics and filtering by difficulty/type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_sessions_interview_type_difficulty 
ON interview_sessions (interview_type, difficulty);

-- 3. Partial index for queries regarding specific companies
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_sessions_company_focus 
ON interview_sessions (company_focus) WHERE company_focus IS NOT NULL;
