-- Migration: AI Interview Improvement Plans
-- Purpose: Add database table for personalized improvement plans
-- Date: 2026-04-12

-- Improvement Plans Table
CREATE TABLE IF NOT EXISTS improvement_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Plan content
  plan_data JSONB NOT NULL, -- Full plan structure with daily tasks, recommendations, etc.
  session_ids UUID[], -- Interview sessions this plan is based on
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'abandoned'
  progress JSONB DEFAULT '{"completedTasks": [], "lastUpdated": null}'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_improvement_plans_user_id ON improvement_plans(user_id);
CREATE INDEX idx_improvement_plans_status ON improvement_plans(status);
CREATE INDEX idx_improvement_plans_created_at ON improvement_plans(created_at DESC);

-- RLS Policies
ALTER TABLE improvement_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own improvement plans"
  ON improvement_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own improvement plans"
  ON improvement_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own improvement plans"
  ON improvement_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own improvement plans"
  ON improvement_plans FOR DELETE
  USING (auth.uid() = user_id);
