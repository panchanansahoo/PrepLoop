-- Modern AI Interview System Database Migrations
-- Tables to support enhanced interview features

-- Interview Sessions (for audio/video interviews)
CREATE TABLE IF NOT EXISTS interview_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  interview_type VARCHAR(100) NOT NULL,
  difficulty VARCHAR(50),
  media_type VARCHAR(50) DEFAULT 'video', -- 'video', 'audio', 'text'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'paused'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  total_duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview Notes (for review and reflection)
CREATE TABLE IF NOT EXISTS interview_notes (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  interview_id SERIAL REFERENCES mock_interviews(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  question_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning Recommendations (personalized learning paths)
CREATE TABLE IF NOT EXISTS learning_recommendations (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  interview_type VARCHAR(100),
  recommendations JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'archived'
  viewed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview Performance Analytics (cached for dashboard performance)
CREATE TABLE IF NOT EXISTS interview_analytics (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  metric_type VARCHAR(100),
  metric_value FLOAT,
  interview_type VARCHAR(100),
  time_period VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'all_time'
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, metric_type, time_period)
);

-- Feedback History (track evolution of feedback quality)
CREATE TABLE IF NOT EXISTS feedback_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  interview_id SERIAL REFERENCES mock_interviews(id) ON DELETE CASCADE,
  question_index INTEGER,
  feedback JSONB NOT NULL,
  feedback_version VARCHAR(50), -- for tracking feedback model improvements
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_session_id ON interview_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_notes_interview_id ON interview_notes(interview_id);
CREATE INDEX IF NOT EXISTS idx_learning_recommendations_user_id ON learning_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_analytics_user_id ON interview_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_history_interview_id ON feedback_history(interview_id);

-- Create view for user dashboard statistics
CREATE OR REPLACE VIEW user_interview_stats AS
SELECT 
  mi.user_id,
  COUNT(mi.id) as total_interviews,
  ROUND(AVG(mi.overall_score), 2) as avg_score,
  MAX(mi.overall_score) as best_score,
  MIN(mi.overall_score) as worst_score,
  COUNT(DISTINCT mi.interview_type) as interview_types_attempted,
  MAX(mi.completed_at) as last_interview_date
FROM mock_interviews mi
GROUP BY mi.user_id;
