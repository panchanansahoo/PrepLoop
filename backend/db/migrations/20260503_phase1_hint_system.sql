-- Migration: Create user_hint_usage table for Phase 1.1 Progressive Hint System
-- Tracks which hints users have viewed and when (for cooldown management)

CREATE TABLE IF NOT EXISTS user_hint_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id INT NOT NULL,
  hint_type TEXT NOT NULL CHECK (hint_type IN ('approach', 'code', 'edge_case')),
  revealed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cooldown_until TIMESTAMPTZ, -- When user can next reveal this hint type for this problem
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one row per user/problem/hint_type to easily check cooldown
  UNIQUE(user_id, problem_id, hint_type)
);

-- Index for efficient queries: find user's hint usage for a problem
CREATE INDEX idx_user_hint_usage_problem 
  ON user_hint_usage(user_id, problem_id);

-- Index for checking cooldown expiry
CREATE INDEX idx_user_hint_usage_cooldown 
  ON user_hint_usage(user_id, cooldown_until) 
  WHERE cooldown_until IS NOT NULL AND cooldown_until > NOW();

-- Add hint_text and hint_source columns to problems table (if not exists)
ALTER TABLE problems ADD COLUMN IF NOT EXISTS hints JSONB DEFAULT '{
  "approach": "",
  "code": "",
  "edge_case": ""
}'::jsonb;

-- Rollback SQL:
-- DROP INDEX IF EXISTS idx_user_hint_usage_cooldown;
-- DROP INDEX IF EXISTS idx_user_hint_usage_problem;
-- DROP TABLE IF EXISTS user_hint_usage;
-- ALTER TABLE problems DROP COLUMN IF EXISTS hints;
