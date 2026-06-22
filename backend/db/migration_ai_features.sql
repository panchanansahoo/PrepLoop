-- Migration: AI Features (Code Review & Interview Simulation)
-- Purpose: Add database tables for AI Code Review and AI Interview Simulator
-- Date: 2026-03-31

-- 1. Code Review Sessions Table
CREATE TABLE IF NOT EXISTS code_review_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id INTEGER NOT NULL,
  
  -- Code submission details
  submitted_code TEXT NOT NULL,
  language VARCHAR(50),
  
  -- AI Review Results
  time_complexity VARCHAR(100),
  space_complexity VARCHAR(100),
  complexity_analysis TEXT,
  optimization_suggestions JSONB, -- Array of {title, description, severity}
  edge_cases_covered JSONB, -- {found: string[], missed: string[]}
  communication_score INTEGER CHECK (communication_score >= 0 AND communication_score <= 100),
  correctness_score INTEGER CHECK (correctness_score >= 0 AND correctness_score <= 100),
  efficiency_score INTEGER CHECK (efficiency_score >= 0 AND efficiency_score <= 100),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  
  -- Detailed feedback
  patterns_identified TEXT[], -- Array of DSA patterns found
  pattern_explanations JSONB, -- {pattern: explanation}
  refactoring_hints TEXT,
  reference_solution_approach TEXT,
  test_cases_recommendations JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ai_model_version VARCHAR(50), -- Track which model/version generated this
  processing_time_ms INTEGER,
  
  CONSTRAINT valid_scores CHECK (
    (communication_score IS NULL OR (communication_score >= 0 AND communication_score <= 100)) AND
    (correctness_score IS NULL OR (correctness_score >= 0 AND correctness_score <= 100)) AND
    (efficiency_score IS NULL OR (efficiency_score >= 0 AND efficiency_score <= 100)) AND
    (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 100))
  )
);

-- 2. Interview Simulation Sessions Table
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session Configuration
  interview_type VARCHAR(50) NOT NULL, -- 'dsa', 'system_design', 'behavioral', 'mixed'
  difficulty_level VARCHAR(20), -- 'easy', 'medium', 'hard'
  company_focus VARCHAR(100), -- e.g., 'Google', 'Meta', NULL for generic
  duration_minutes INTEGER,
  
  -- Initial Problem/Scenario
  problem_id INTEGER,
  problem_statement TEXT,
  initial_requirements TEXT,
  
  -- Interview Transcript (text-based)
  transcript JSONB, -- [{role: 'interviewer'|'candidate', text: string, timestamp: ISO}]
  
  -- Analysis & Scoring
  performance_metrics JSONB, -- {clarity: 0-100, problem_decomposition: 0-100, communication: 0-100, efficiency: 0-100}
  strengths TEXT[],
  areas_for_improvement TEXT[],
  critical_mistakes TEXT[],
  
  -- Interview Flow Data
  questions_asked INTEGER,
  follow_ups_count INTEGER,
  hints_given INTEGER,
  candidate_got_stuck BOOLEAN DEFAULT FALSE,
  pressure_responses JSONB, -- Track how user handles follow-up pressure
  
  -- Scoring
  interview_score INTEGER CHECK (interview_score >= 0 AND interview_score <= 100),
  communication_clarity_score INTEGER CHECK (communication_clarity_score >= 0 AND communication_clarity_score <= 100),
  problem_solving_score INTEGER CHECK (problem_solving_score >= 0 AND problem_solving_score <= 100),
  technical_depth_score INTEGER CHECK (technical_depth_score >= 0 AND technical_depth_score <= 100),
  
  -- Metadata
  status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  total_duration_seconds INTEGER,
  ai_model_version VARCHAR(50),
  
  -- Recommendations
  recommendations TEXT,
  follow_up_practice_problems JSONB, -- [{problem_id, title, reason}]
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Interview Feedback History Table
CREATE TABLE IF NOT EXISTS interview_feedback_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  
  feedback_round INTEGER NOT NULL,
  feedback_type VARCHAR(50), -- 'question', 'hint', 'clarification', 'encouragement'
  feedback_text TEXT NOT NULL,
  
  -- Track what triggered this feedback
  context JSONB, -- {previous_response: string, issue_detected: string}
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. AI Review Improvements Table (track user progress)
CREATE TABLE IF NOT EXISTS code_review_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Improvement Tracking
  problem_id INTEGER NOT NULL,
  first_review_id UUID REFERENCES code_review_sessions(id),
  second_review_id UUID REFERENCES code_review_sessions(id),
  
  -- Comparison metrics
  complexity_improved BOOLEAN,
  efficiency_gain_percent INTEGER,
  edge_cases_added INTEGER,
  score_improvement INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Interview Performance Trends Table
CREATE TABLE IF NOT EXISTS interview_performance_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  interview_type VARCHAR(50), -- 'dsa', 'system_design', 'behavioral'
  company_focus VARCHAR(100),
  
  -- Trend metrics
  interview_count INTEGER DEFAULT 0,
  avg_score NUMERIC(5,2),
  avg_communication_score NUMERIC(5,2),
  avg_problem_solving_score NUMERIC(5,2),
  best_score INTEGER,
  worst_score INTEGER,
  
  -- Performance history
  last_interview_date TIMESTAMP WITH TIME ZONE,
  score_trend JSONB, -- [{date, score}] for trend visualization
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. AI Service Logs (for observability)
CREATE TABLE IF NOT EXISTS ai_service_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  feature_type VARCHAR(50), -- 'code_review', 'interview_simulation'
  session_id UUID,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Execution details
  request_id VARCHAR(255),
  model_used VARCHAR(100),
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  
  -- Performance
  latency_ms INTEGER,
  status VARCHAR(50), -- 'success', 'error', 'timeout'
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============ INDEXES ============

CREATE INDEX IF NOT EXISTS idx_code_review_user_id ON code_review_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_code_review_problem_id ON code_review_sessions(problem_id);
CREATE INDEX IF NOT EXISTS idx_code_review_created_at ON code_review_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_interview_user_id ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_type ON interview_sessions(interview_type);
CREATE INDEX IF NOT EXISTS idx_interview_status ON interview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_interview_created_at ON interview_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_interview_feedback_session_id ON interview_feedback_history(interview_session_id);

CREATE INDEX IF NOT EXISTS idx_interview_trends_user_id ON interview_performance_trends(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_trends_type ON interview_performance_trends(interview_type);

CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON ai_service_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_feature_type ON ai_service_logs(feature_type);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON ai_service_logs(created_at DESC);

-- ============ RLS POLICIES (Row Level Security) ============

ALTER TABLE code_review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_feedback_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_review_improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_performance_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_service_logs ENABLE ROW LEVEL SECURITY;

-- Code Review: Users can only see their own reviews
DROP POLICY IF EXISTS "Users can view their own code reviews" ON code_review_sessions;
CREATE POLICY "Users can view their own code reviews"
  ON code_review_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own code reviews" ON code_review_sessions;
CREATE POLICY "Users can insert their own code reviews"
  ON code_review_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Interview Sessions: Users can only see their own
DROP POLICY IF EXISTS "Users can view their own interview sessions" ON interview_sessions;
CREATE POLICY "Users can view their own interview sessions"
  ON interview_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own interview sessions" ON interview_sessions;
CREATE POLICY "Users can insert their own interview sessions"
  ON interview_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own interview sessions" ON interview_sessions;
CREATE POLICY "Users can update their own interview sessions"
  ON interview_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Interview Feedback: Only accessible through parent session
DROP POLICY IF EXISTS "Users can view feedback from their sessions" ON interview_feedback_history;
CREATE POLICY "Users can view feedback from their sessions"
  ON interview_feedback_history FOR SELECT
  USING (
    interview_session_id IN (
      SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Only system can insert feedback" ON interview_feedback_history;
CREATE POLICY "Only system can insert feedback"
  ON interview_feedback_history FOR INSERT
  WITH CHECK (false);

-- Performance Trends: Users can only see their own
DROP POLICY IF EXISTS "Users can view their own performance trends" ON interview_performance_trends;
CREATE POLICY "Users can view their own performance trends"
  ON interview_performance_trends FOR SELECT
  USING (auth.uid() = user_id);

-- AI Logs: Users can only see their own (for transparency)
DROP POLICY IF EXISTS "Users can view their own AI service logs" ON ai_service_logs;
CREATE POLICY "Users can view their own AI service logs"
  ON ai_service_logs FOR SELECT
  USING (auth.uid() = user_id);
