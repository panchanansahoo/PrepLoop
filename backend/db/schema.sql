-- Supabase Schema for CareerLoop
-- Note: Users are managed by Supabase Auth (auth.users)
-- This schema creates app-specific tables that reference auth.users

-- Drop existing tables
DROP TABLE IF EXISTS community_replies CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS code_snippets CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS interview_feedback CASCADE;
DROP TABLE IF EXISTS mock_interviews CASCADE;
DROP TABLE IF EXISTS resume_analyses CASCADE;
DROP TABLE IF EXISTS problems CASCADE;
DROP TABLE IF EXISTS patterns CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  subscription_tier VARCHAR(50) DEFAULT 'free',
  experience_level VARCHAR(50) DEFAULT 'beginner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Patterns table (DSA patterns)
CREATE TABLE patterns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  difficulty VARCHAR(50),
  theory TEXT,
  examples JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Problems table
CREATE TABLE problems (
  id SERIAL PRIMARY KEY,
  pattern_id INTEGER REFERENCES patterns(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  difficulty VARCHAR(50) NOT NULL,
  constraints TEXT,
  examples JSONB,
  hints JSONB,
  solution_approach TEXT,
  starter_code JSONB,
  test_cases JSONB,
  companies JSONB,
  tags JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Progress table
CREATE TABLE user_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'not_started',
  attempts INTEGER DEFAULT 0,
  solved_at TIMESTAMP WITH TIME ZONE,
  last_attempt TIMESTAMP WITH TIME ZONE,
  best_time_complexity VARCHAR(100),
  best_space_complexity VARCHAR(100),
  UNIQUE(user_id, problem_id)
);

-- Submissions table
CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  language VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  execution_time FLOAT,
  memory_used FLOAT,
  test_cases_passed INTEGER,
  total_test_cases INTEGER,
  ai_feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mock Interviews table
CREATE TABLE mock_interviews (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  interview_type VARCHAR(100) NOT NULL,
  difficulty VARCHAR(50),
  duration INTEGER,
  questions JSONB,
  responses JSONB,
  ai_feedback TEXT,
  overall_score FLOAT,
  communication_score FLOAT,
  technical_score FLOAT,
  problem_solving_score FLOAT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Interview Feedback table (for real-time feedback during interviews)
CREATE TABLE interview_feedback (
  id SERIAL PRIMARY KEY,
  interview_id INTEGER REFERENCES mock_interviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  answer_text TEXT,
  feedback_content JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resume Analyses table
CREATE TABLE resume_analyses (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resume_text TEXT NOT NULL,
  ats_score FLOAT,
  strengths JSONB,
  weaknesses JSONB,
  suggestions JSONB,
  keyword_match JSONB,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Posts table
CREATE TABLE community_posts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  tags JSONB,
  likes INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Replies table
CREATE TABLE community_replies (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Code Snippets table
CREATE TABLE code_snippets (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code TEXT NOT NULL,
  language VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_id ON profiles(id);
CREATE INDEX idx_problems_pattern ON problems(pattern_id);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_problem ON user_progress(problem_id);
CREATE INDEX idx_submissions_user ON submissions(user_id);
CREATE INDEX idx_submissions_problem ON submissions(problem_id);
CREATE INDEX idx_mock_interviews_user ON mock_interviews(user_id);
CREATE INDEX idx_interview_feedback_interview ON interview_feedback(interview_id);
CREATE INDEX idx_interview_feedback_user ON interview_feedback(user_id);
CREATE INDEX idx_resume_analyses_user ON resume_analyses(user_id);
CREATE INDEX idx_community_posts_user ON community_posts(user_id);
CREATE INDEX idx_community_replies_post ON community_replies(post_id);
CREATE INDEX idx_code_snippets_user ON code_snippets(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_snippets ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can read/write their own data
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own submissions" ON submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own submissions" ON submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own interviews" ON mock_interviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interviews" ON mock_interviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interviews" ON mock_interviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own feedback" ON interview_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feedback" ON interview_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own resumes" ON resume_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resumes" ON resume_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view posts" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view replies" ON community_replies FOR SELECT USING (true);
CREATE POLICY "Users can create replies" ON community_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own snippets" ON code_snippets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create snippets" ON code_snippets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow public read access to patterns and problems
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view patterns" ON patterns FOR SELECT USING (true);
CREATE POLICY "Anyone can view problems" ON problems FOR SELECT USING (true);
