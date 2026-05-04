-- Migration: Enhanced Performance Indexes for Improvement Plan Feature (v2)
-- Purpose: Add optimized indexes for faster weakness analysis and plan history queries
-- Date: 2026-05-04

-- Optimize interview_sessions queries for improvement plan generation
-- This index speeds up the _fetchInterviewSessions query that filters by user, status, and completion date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_sessions_user_completed_status 
ON interview_sessions(user_id, completed_at DESC) 
WHERE status = 'completed';

-- Optimize the common "get latest plan" query pattern
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_improvement_plans_user_latest 
ON improvement_plans(user_id, created_at DESC) 
WHERE status = 'active';

-- Optimize plan history queries with pagination
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_improvement_plans_user_all 
ON improvement_plans(user_id, created_at DESC);

-- Optimize search by status and user for plan filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_improvement_plans_status_user 
ON improvement_plans(status, user_id) 
WHERE status IN ('active', 'completed');

-- Update statistics for all indexed tables
ANALYZE interview_sessions;
ANALYZE improvement_plans;
