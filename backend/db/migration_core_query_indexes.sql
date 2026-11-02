-- Migration: Core query indexes for optimized reads & filtering
-- Safe to run multiple times (idempotent IF NOT EXISTS)

-- Mock Interviews lookups & history ordering
CREATE INDEX IF NOT EXISTS idx_mock_interviews_user_started ON mock_interviews(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_user_type ON mock_interviews(user_id, interview_type);

-- Interview feedback sequential retrieval per session
CREATE INDEX IF NOT EXISTS idx_interview_feedback_session_order ON interview_feedback(interview_id, question_index ASC);

-- User problem progress filtering (e.g. status = 'solved' or 'in_progress')
CREATE INDEX IF NOT EXISTS idx_user_progress_user_status ON user_progress(user_id, status);

-- Submissions filtering & history
CREATE INDEX IF NOT EXISTS idx_submissions_user_problem ON submissions(user_id, problem_id, submitted_at DESC);

-- Resume analyses chronological lookup per user
CREATE INDEX IF NOT EXISTS idx_resume_analyses_user_date ON resume_analyses(user_id, analyzed_at DESC);

-- DSA problem catalog filtering by category & difficulty
CREATE INDEX IF NOT EXISTS idx_problems_difficulty_pattern ON problems(difficulty, pattern_id);

-- Profiles activity sorting
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON profiles(last_login DESC NULLS LAST);

