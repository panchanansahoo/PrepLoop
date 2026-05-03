-- Phase 5.1: Solution Sharing & Discussion - Database Schema
-- Create tables for collaborative code review and solution sharing

-- Table 1: solution_submissions - Stores user-submitted solutions
CREATE TABLE IF NOT EXISTS solution_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  problem_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'javascript',
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'deleted')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  execution_time_ms INTEGER,
  memory_mb NUMERIC,
  code_length INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_solution_submissions_user_id ON solution_submissions(user_id);
CREATE INDEX idx_solution_submissions_problem_id ON solution_submissions(problem_id);
CREATE INDEX idx_solution_submissions_visibility ON solution_submissions(problem_id, visibility);
CREATE INDEX idx_solution_submissions_created_at ON solution_submissions(created_at DESC);

-- Table 2: solution_votes - Tracks upvotes and downvotes
CREATE TABLE IF NOT EXISTS solution_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  solution_id UUID NOT NULL REFERENCES solution_submissions(id) ON DELETE CASCADE,
  vote_value INTEGER CHECK (vote_value IN (-1, 0, 1)),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, solution_id)
);

CREATE INDEX idx_solution_votes_solution_id ON solution_votes(solution_id);
CREATE INDEX idx_solution_votes_user_id ON solution_votes(user_id);

-- Table 3: solution_discussions - Threaded discussion/comments
CREATE TABLE IF NOT EXISTS solution_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id UUID NOT NULL REFERENCES solution_submissions(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES solution_discussions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  comment TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_solution_discussions_solution_id ON solution_discussions(solution_id);
CREATE INDEX idx_solution_discussions_thread_id ON solution_discussions(thread_id);
CREATE INDEX idx_solution_discussions_user_id ON solution_discussions(user_id);

-- Table 4: solution_insights - Analysis and metadata about solutions
CREATE TABLE IF NOT EXISTS solution_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id UUID NOT NULL UNIQUE REFERENCES solution_submissions(id) ON DELETE CASCADE,
  approach TEXT,
  time_complexity TEXT,
  space_complexity TEXT,
  efficiency_score INTEGER CHECK (efficiency_score >= 0 AND efficiency_score <= 100),
  code_quality_score INTEGER CHECK (code_quality_score >= 0 AND code_quality_score <= 100),
  readability_score INTEGER CHECK (readability_score >= 0 AND readability_score <= 100),
  has_comments BOOLEAN DEFAULT false,
  has_constants BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_solution_insights_solution_id ON solution_insights(solution_id);
CREATE INDEX idx_solution_insights_approach ON solution_insights(approach);
