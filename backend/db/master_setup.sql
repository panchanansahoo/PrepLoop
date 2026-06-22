

-- ==========================================
-- File: schema.sql
-- ==========================================

-- Supabase Schema for CareerLoop
-- Note: Users are managed by Supabase Auth (auth.users)
-- This schema creates app-specific tables that reference auth.users

-- Drop existing tables

DROP TABLE IF EXISTS user_activity CASCADE;
DROP TABLE IF EXISTS blogs CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS code_review_sessions CASCADE;
DROP TABLE IF EXISTS interview_sessions CASCADE;
DROP TABLE IF EXISTS interview_feedback_history CASCADE;
DROP TABLE IF EXISTS code_review_improvements CASCADE;
DROP TABLE IF EXISTS interview_performance_trends CASCADE;
DROP TABLE IF EXISTS ai_service_logs CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS career_ops_evaluations CASCADE;
DROP TABLE IF EXISTS coin_transactions CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS interview_slots CASCADE;
DROP TABLE IF EXISTS real_interviews CASCADE;
DROP TABLE IF EXISTS community_post_likes CASCADE;
DROP TABLE IF EXISTS bookmarks CASCADE;
DROP TABLE IF EXISTS interview_bookings CASCADE;
DROP TABLE IF EXISTS improvement_plans CASCADE;
DROP TABLE IF EXISTS interview_notes CASCADE;
DROP TABLE IF EXISTS learning_recommendations CASCADE;
DROP TABLE IF EXISTS interview_analytics CASCADE;
DROP TABLE IF EXISTS feedback_history CASCADE;
DROP TABLE IF EXISTS peer_mock_profiles CASCADE;
DROP TABLE IF EXISTS peer_mock_requests CASCADE;
DROP TABLE IF EXISTS mentor_mock_slots CASCADE;
DROP TABLE IF EXISTS mentor_mock_bookings CASCADE;
DROP TABLE IF EXISTS doubt_threads CASCADE;
DROP TABLE IF EXISTS doubt_replies CASCADE;
DROP TABLE IF EXISTS doubt_votes CASCADE;
DROP TABLE IF EXISTS job_listings CASCADE;
DROP TABLE IF EXISTS library_books CASCADE;
DROP TABLE IF EXISTS library_book_reviews CASCADE;
DROP TABLE IF EXISTS library_user_shelves CASCADE;
DROP TABLE IF EXISTS connected_accounts CASCADE;
DROP TABLE IF EXISTS resume_uploads CASCADE;
DROP TABLE IF EXISTS normalized_profiles CASCADE;
DROP TABLE IF EXISTS portfolio_sites CASCADE;
DROP TABLE IF EXISTS short_links CASCADE;
DROP TABLE IF EXISTS portfolio_visits CASCADE;
DROP TABLE IF EXISTS career_courses CASCADE;
DROP TABLE IF EXISTS career_roles CASCADE;
DROP TABLE IF EXISTS career_pathways CASCADE;
DROP TABLE IF EXISTS career_market_signals CASCADE;
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS study_groups CASCADE;
DROP TABLE IF EXISTS study_group_members CASCADE;

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
  experience_summary TEXT,
  bio TEXT,
  skills TEXT,
  education TEXT,
  qualification TEXT,
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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
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
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_problems_pattern ON problems(pattern_id);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_problem ON user_progress(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem ON submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_user ON mock_interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_interview ON interview_feedback(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_user ON interview_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_analyses_user ON resume_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_user ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_replies_post ON community_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_code_snippets_user ON code_snippets(user_id);

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
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
CREATE POLICY "Users can view own submissions" ON submissions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can insert own submissions" ON submissions;
CREATE POLICY "Users can insert own submissions" ON submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view own interviews" ON mock_interviews;
DROP POLICY IF EXISTS "Users can view own interviews" ON mock_interviews;
CREATE POLICY "Users can view own interviews" ON mock_interviews FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own interviews" ON mock_interviews;
DROP POLICY IF EXISTS "Users can insert own interviews" ON mock_interviews;
CREATE POLICY "Users can insert own interviews" ON mock_interviews FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own interviews" ON mock_interviews;
DROP POLICY IF EXISTS "Users can update own interviews" ON mock_interviews;
CREATE POLICY "Users can update own interviews" ON mock_interviews FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view own feedback" ON interview_feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON interview_feedback;
CREATE POLICY "Users can view own feedback" ON interview_feedback FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own feedback" ON interview_feedback;
DROP POLICY IF EXISTS "Users can insert own feedback" ON interview_feedback;
CREATE POLICY "Users can insert own feedback" ON interview_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view own resumes" ON resume_analyses;
DROP POLICY IF EXISTS "Users can view own resumes" ON resume_analyses;
CREATE POLICY "Users can view own resumes" ON resume_analyses FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own resumes" ON resume_analyses;
DROP POLICY IF EXISTS "Users can insert own resumes" ON resume_analyses;
CREATE POLICY "Users can insert own resumes" ON resume_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Anyone can view posts" ON community_posts;
DROP POLICY IF EXISTS "Anyone can view posts" ON community_posts;
CREATE POLICY "Anyone can view posts" ON community_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create posts" ON community_posts;
DROP POLICY IF EXISTS "Users can create posts" ON community_posts;
CREATE POLICY "Users can create posts" ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own posts" ON community_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON community_posts;
CREATE POLICY "Users can update own posts" ON community_posts FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Anyone can view replies" ON community_replies;
DROP POLICY IF EXISTS "Anyone can view replies" ON community_replies;
CREATE POLICY "Anyone can view replies" ON community_replies FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create replies" ON community_replies;
DROP POLICY IF EXISTS "Users can create replies" ON community_replies;
CREATE POLICY "Users can create replies" ON community_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view own snippets" ON code_snippets;
DROP POLICY IF EXISTS "Users can view own snippets" ON code_snippets;
CREATE POLICY "Users can view own snippets" ON code_snippets FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create snippets" ON code_snippets;
DROP POLICY IF EXISTS "Users can create snippets" ON code_snippets;
CREATE POLICY "Users can create snippets" ON code_snippets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow public read access to patterns and problems
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view patterns" ON patterns;
DROP POLICY IF EXISTS "Anyone can view patterns" ON patterns;
CREATE POLICY "Anyone can view patterns" ON patterns FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view problems" ON problems;
DROP POLICY IF EXISTS "Anyone can view problems" ON problems;
CREATE POLICY "Anyone can view problems" ON problems FOR SELECT USING (true);


-- ==========================================
-- File: schema_activity.sql
-- ==========================================

-- Activity Tracking Table
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    seconds_active INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Index for querying history
CREATE INDEX IF NOT EXISTS idx_user_activity_user_date ON user_activity(user_id, date);


-- ==========================================
-- File: schema_blogs.sql
-- ==========================================

-- Create blogs table if it doesn't exist
CREATE TABLE IF NOT EXISTS blogs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content JSONB NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  category TEXT DEFAULT 'General',
  cover_image TEXT,
  read_time INTEGER DEFAULT 5,
  is_published BOOLEAN DEFAULT TRUE,
  views INTEGER DEFAULT 0
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_blogs_author ON blogs(author_id);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);

-- Enable RLS
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public blogs are viewable by everyone" ON blogs;
DROP POLICY IF EXISTS "Public blogs are viewable by everyone" ON blogs;
CREATE POLICY "Public blogs are viewable by everyone" ON blogs FOR SELECT 
USING (is_published = true);

DROP POLICY IF EXISTS "Users can create blogs" ON blogs;
DROP POLICY IF EXISTS "Users can create blogs" ON blogs;
CREATE POLICY "Users can create blogs" ON blogs FOR INSERT 
WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own blogs" ON blogs;
DROP POLICY IF EXISTS "Users can update own blogs" ON blogs;
CREATE POLICY "Users can update own blogs" ON blogs FOR UPDATE 
USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete own blogs" ON blogs;
DROP POLICY IF EXISTS "Users can delete own blogs" ON blogs;
CREATE POLICY "Users can delete own blogs" ON blogs FOR DELETE 
USING (auth.uid() = author_id);


-- ==========================================
-- File: schema_contacts.sql
-- ==========================================

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'new' -- new, read, replied
);

-- Enable RLS (optional, depends on if we want admin dashboard to read them)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public contact form)
DROP POLICY IF EXISTS "Anyone can insert contacts" ON contacts;
DROP POLICY IF EXISTS "Anyone can insert contacts" ON contacts;
CREATE POLICY "Anyone can insert contacts" ON contacts FOR INSERT 
WITH CHECK (true);

-- Only admins/service role can view (handled by backend suppression of RLS usually, or specific policy)
-- For now, we'll rely on service_role key in backend to read/write if needed, or just insert.
-- The backend uses supabaseAdmin which bypasses RLS, so this is fine.


-- ==========================================
-- File: schema_payments.sql
-- ==========================================

-- Payments table for Razorpay integration
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  razorpay_order_id VARCHAR(255) UNIQUE NOT NULL,
  razorpay_payment_id VARCHAR(255),
  razorpay_signature VARCHAR(512),
  plan VARCHAR(50) NOT NULL,       -- 'pro' or 'elite'
  amount INTEGER NOT NULL,
  reference_key TEXT,          -- amount in paise (e.g., 9900 = ₹99)
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'created',  -- 'created', 'paid', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(razorpay_order_id);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service can insert payments" ON payments;
DROP POLICY IF EXISTS "Service can insert payments" ON payments;
CREATE POLICY "Service can insert payments" ON payments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Service can update payments" ON payments;
DROP POLICY IF EXISTS "Service can update payments" ON payments;
CREATE POLICY "Service can update payments" ON payments FOR UPDATE USING (true);


-- ==========================================
-- File: migration_add_custom_url.sql
-- ==========================================

-- Migration: add custom_url column to profiles for claiming public profile slugs

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS custom_url TEXT DEFAULT '';

-- Add a unique index to ensure no two users can claim the same slug (empty strings allowed)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_custom_url_unique ON profiles ((nullif(custom_url, '')));


-- ==========================================
-- File: migration_add_exploration.sql
-- ==========================================

-- Migration: Add Explore Questions and Extended Test Cases to Problems
-- This migration adds fields to support educational exploration and comprehensive testing

-- Add new columns to problems table
ALTER TABLE problems ADD COLUMN IF NOT EXISTS explore_questions JSONB;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS extended_test_cases JSONB;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS exploration_metadata JSONB;

-- Add comments to explain the new fields
COMMENT ON COLUMN problems.explore_questions IS 'Array of exploratory learning questions to help students understand the problem deeply';
COMMENT ON COLUMN problems.extended_test_cases IS 'Array of additional comprehensive test cases covering edge cases and special scenarios';
COMMENT ON COLUMN problems.exploration_metadata IS 'Metadata about the exploration enhancement (timestamp, counts, etc.)';

-- Create index for querying enhanced problems
CREATE INDEX IF NOT EXISTS idx_problems_explore_questions ON problems USING GIN (explore_questions);
CREATE INDEX IF NOT EXISTS idx_problems_enhanced ON problems(exploration_metadata);

-- Create a view for easy querying of fully enhanced problems
CREATE OR REPLACE VIEW enhanced_problems AS
SELECT 
  p.*,
  COALESCE(jsonb_array_length(p.explore_questions), 0) as explore_questions_count,
  COALESCE(jsonb_array_length(p.extended_test_cases), 0) as extended_test_cases_count,
  CASE 
    WHEN p.explore_questions IS NOT NULL AND p.extended_test_cases IS NOT NULL 
    THEN 'fully_enhanced'
    WHEN p.explore_questions IS NOT NULL 
    THEN 'partially_enhanced'
    ELSE 'not_enhanced'
  END as enhancement_status
FROM problems p;


-- ==========================================
-- File: migration_add_roles.sql
-- ==========================================

-- Migration: Add role column to profiles table
-- Run this against your Supabase database

-- 1. Add role column with default 'user'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- 2. Index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 3. Update the handle_new_user trigger to include role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Admin RLS policies (admins can see and manage all profiles)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all profiles'
  ) THEN
    DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT
      USING (
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update all profiles'
  ) THEN
    DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE
      USING (
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      );
  END IF;
END $$;

-- Admin policies for other tables
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all submissions'
  ) THEN
    DROP POLICY IF EXISTS "Admins can view all submissions" ON submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON submissions;
CREATE POLICY "Admins can view all submissions" ON submissions FOR SELECT
      USING (
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all interviews'
  ) THEN
    DROP POLICY IF EXISTS "Admins can view all interviews" ON mock_interviews;
DROP POLICY IF EXISTS "Admins can view all interviews" ON mock_interviews;
CREATE POLICY "Admins can view all interviews" ON mock_interviews FOR SELECT
      USING (
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete community posts'
  ) THEN
    DROP POLICY IF EXISTS "Admins can delete community posts" ON community_posts;
DROP POLICY IF EXISTS "Admins can delete community posts" ON community_posts;
CREATE POLICY "Admins can delete community posts" ON community_posts FOR DELETE
      USING (
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete community replies'
  ) THEN
    DROP POLICY IF EXISTS "Admins can delete community replies" ON community_replies;
DROP POLICY IF EXISTS "Admins can delete community replies" ON community_replies;
CREATE POLICY "Admins can delete community replies" ON community_replies FOR DELETE
      USING (
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      );
  END IF;
END $$;


-- ==========================================
-- File: migration_ai_features.sql
-- ==========================================

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
  session_id VARCHAR(255) UNIQUE NOT NULL,
  interview_type VARCHAR(100) NOT NULL,
  media_type VARCHAR(50) DEFAULT 'video',
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
DROP POLICY IF EXISTS "Users can view their own code reviews" ON code_review_sessions;
CREATE POLICY "Users can view their own code reviews" ON code_review_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own code reviews" ON code_review_sessions;
DROP POLICY IF EXISTS "Users can insert their own code reviews" ON code_review_sessions;
CREATE POLICY "Users can insert their own code reviews" ON code_review_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Interview Sessions: Users can only see their own
DROP POLICY IF EXISTS "Users can view their own interview sessions" ON interview_sessions;
DROP POLICY IF EXISTS "Users can view their own interview sessions" ON interview_sessions;
CREATE POLICY "Users can view their own interview sessions" ON interview_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own interview sessions" ON interview_sessions;
DROP POLICY IF EXISTS "Users can insert their own interview sessions" ON interview_sessions;
CREATE POLICY "Users can insert their own interview sessions" ON interview_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own interview sessions" ON interview_sessions;
DROP POLICY IF EXISTS "Users can update their own interview sessions" ON interview_sessions;
CREATE POLICY "Users can update their own interview sessions" ON interview_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Interview Feedback: Only accessible through parent session
DROP POLICY IF EXISTS "Users can view feedback from their sessions" ON interview_feedback_history;
DROP POLICY IF EXISTS "Users can view feedback from their sessions" ON interview_feedback_history;
CREATE POLICY "Users can view feedback from their sessions" ON interview_feedback_history FOR SELECT
  USING (
    interview_session_id IN (
      SELECT id FROM interview_sessions WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Only system can insert feedback" ON interview_feedback_history;
DROP POLICY IF EXISTS "Only system can insert feedback" ON interview_feedback_history;
CREATE POLICY "Only system can insert feedback" ON interview_feedback_history FOR INSERT
  WITH CHECK (false);

-- Performance Trends: Users can only see their own
DROP POLICY IF EXISTS "Users can view their own performance trends" ON interview_performance_trends;
DROP POLICY IF EXISTS "Users can view their own performance trends" ON interview_performance_trends;
CREATE POLICY "Users can view their own performance trends" ON interview_performance_trends FOR SELECT
  USING (auth.uid() = user_id);

-- AI Logs: Users can only see their own (for transparency)
DROP POLICY IF EXISTS "Users can view their own AI service logs" ON ai_service_logs;
DROP POLICY IF EXISTS "Users can view their own AI service logs" ON ai_service_logs;
CREATE POLICY "Users can view their own AI service logs" ON ai_service_logs FOR SELECT
  USING (auth.uid() = user_id);


-- ==========================================
-- File: migration_atomic_coin_transactions.sql
-- ==========================================

-- Migration: Atomic coin transactions to prevent race conditions
-- Safe to run multiple times.

CREATE OR REPLACE FUNCTION coin_apply_transaction(
  user_id_input UUID,
  amount_input INTEGER,
  txn_type_input TEXT,
  description_input TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, error TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  IF amount_input IS NULL OR amount_input <= 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'Amount must be greater than zero';
    RETURN;
  END IF;

  IF txn_type_input NOT IN ('earn', 'spend') THEN
    RETURN QUERY SELECT FALSE, 0, 'Invalid transaction type';
    RETURN;
  END IF;

  IF txn_type_input = 'earn' THEN
    UPDATE profiles
    SET coins = COALESCE(coins, 0) + amount_input
    WHERE id = user_id_input
    RETURNING coins INTO current_balance;

    IF current_balance IS NULL THEN
      RETURN QUERY SELECT FALSE, 0, 'User profile not found';
      RETURN;
    END IF;

  ELSE
    UPDATE profiles
    SET coins = COALESCE(coins, 0) - amount_input
    WHERE id = user_id_input
      AND COALESCE(coins, 0) >= amount_input
    RETURNING coins INTO current_balance;

    IF current_balance IS NULL THEN
      SELECT COALESCE(coins, 0) INTO current_balance
      FROM profiles
      WHERE id = user_id_input;

      IF current_balance IS NULL THEN
        RETURN QUERY SELECT FALSE, 0, 'User profile not found';
      ELSE
        RETURN QUERY SELECT FALSE, current_balance, 'Insufficient coins';
      END IF;
      RETURN;
    END IF;
  END IF;

  INSERT INTO coin_transactions (user_id, amount, type, description)
  VALUES (user_id_input, amount_input, txn_type_input, LEFT(COALESCE(description_input, ''), 160));

  RETURN QUERY SELECT TRUE, current_balance, NULL::TEXT;
END;
$$;


-- ==========================================
-- File: migration_blog_posts.sql
-- ==========================================

-- Migration: Add Blog Posts Table (Admin Only)
-- Created: 2026-04-01

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt VARCHAR(500),
  featured_image_url TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  view_count INTEGER DEFAULT 0
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_admin_id ON public.blog_posts(admin_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON public.blog_posts(created_at DESC);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can insert/update/delete their own posts
DROP POLICY IF EXISTS blog_posts_admin_write ON public.blog_posts;


-- RLS Policy: Anyone can read published posts
DROP POLICY IF EXISTS blog_posts_public_read ON public.blog_posts;
CREATE POLICY blog_posts_public_read ON public.blog_posts
  FOR SELECT
  USING (status = 'published');

-- RLS Policy: Admins can read all posts (drafts, published, archived)
DROP POLICY IF EXISTS blog_posts_admin_read ON public.blog_posts;
CREATE POLICY blog_posts_admin_read ON public.blog_posts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Grant table access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT SELECT ON public.blog_posts TO anon;

-- Grant sequence access
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;


-- ==========================================
-- File: migration_career_ops_history.sql
-- ==========================================

-- Career Ops evaluation history
-- Stores JD fit analyses so users can revisit prior evaluations across sessions/devices.

CREATE TABLE IF NOT EXISTS career_ops_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT,
  role TEXT,
  job_description TEXT NOT NULL,
  candidate_headline TEXT,
  candidate_summary TEXT,
  candidate_skills TEXT[] DEFAULT '{}',
  overall_score NUMERIC(4,2) NOT NULL,
  score_band TEXT NOT NULL,
  dimensions JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_matches JSONB NOT NULL DEFAULT '[]'::jsonb,
  gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
  action_plan JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_career_ops_evaluations_user_id ON career_ops_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_career_ops_evaluations_created_at ON career_ops_evaluations(created_at);
DROP POLICY IF EXISTS blog_posts_admin_write ON public.blog_posts;
CREATE POLICY blog_posts_admin_write ON public.blog_posts
  FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policy: Anyone can read published posts
DROP POLICY IF EXISTS blog_posts_public_read ON public.blog_posts;
CREATE POLICY blog_posts_public_read ON public.blog_posts
  FOR SELECT
  USING (status = 'published');

-- RLS Policy: Admins can read all posts (drafts, published, archived)
DROP POLICY IF EXISTS blog_posts_admin_read ON public.blog_posts;
CREATE POLICY blog_posts_admin_read ON public.blog_posts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Grant table access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT SELECT ON public.blog_posts TO anon;

-- Grant sequence access
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;


-- ==========================================
-- File: migration_career_ops_history.sql
-- ==========================================

-- Career Ops evaluation history
-- Stores JD fit analyses so users can revisit prior evaluations across sessions/devices.

CREATE TABLE IF NOT EXISTS career_ops_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT,
  role TEXT,
  job_description TEXT NOT NULL,
  candidate_headline TEXT,
  candidate_summary TEXT,
  candidate_skills TEXT[] DEFAULT '{}',
  overall_score NUMERIC(4,2) NOT NULL,
  score_band TEXT NOT NULL,
  dimensions JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_matches JSONB NOT NULL DEFAULT '[]'::jsonb,
  gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
  action_plan JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_career_ops_evaluations_user_id ON career_ops_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_career_ops_evaluations_created_at ON career_ops_evaluations(created_at DESC);

ALTER TABLE career_ops_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own career ops evaluations" ON career_ops_evaluations;
DROP POLICY IF EXISTS "Users can view own career ops evaluations" ON career_ops_evaluations;
CREATE POLICY "Users can view own career ops evaluations" ON career_ops_evaluations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own career ops evaluations" ON career_ops_evaluations;
DROP POLICY IF EXISTS "Users can insert own career ops evaluations" ON career_ops_evaluations;
CREATE POLICY "Users can insert own career ops evaluations" ON career_ops_evaluations FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ==========================================
-- File: migration_coins_streaks.sql
-- ==========================================

-- Migration: Coins, Streaks, Real Interviews, Chat
-- Run this against your Supabase database

-- 1. Add coin & streak columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_date TEXT;

-- 2. Coin transactions ledger
CREATE TABLE IF NOT EXISTS coin_transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('earn', 'spend')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id);

-- 3. Chat messages (AI assistant history)
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);

-- 4. Interview slots (HR availability)
CREATE TABLE IF NOT EXISTS interview_slots (
  id SERIAL PRIMARY KEY,
  hr_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  booked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_slots_hr ON interview_slots(hr_id);
CREATE INDEX IF NOT EXISTS idx_interview_slots_date ON interview_slots(slot_date);

-- 5. Real interviews (booked sessions)
CREATE TABLE IF NOT EXISTS real_interviews (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  hr_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  slot_id INTEGER REFERENCES interview_slots(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  meeting_link TEXT,
  notes TEXT,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_real_interviews_user ON real_interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_real_interviews_hr ON real_interviews(hr_id);

-- 6. RLS policies
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own coin transactions" ON coin_transactions;
DROP POLICY IF EXISTS "Users can view own coin transactions" ON coin_transactions;
CREATE POLICY "Users can view own coin transactions" ON coin_transactions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can view own chat messages" ON chat_messages;
CREATE POLICY "Users can view own chat messages" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Anyone can view available slots" ON interview_slots;
DROP POLICY IF EXISTS "Anyone can view available slots" ON interview_slots;
CREATE POLICY "Anyone can view available slots" ON interview_slots FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can view own interviews" ON real_interviews;
DROP POLICY IF EXISTS "Users can view own interviews" ON real_interviews;
CREATE POLICY "Users can view own interviews" ON real_interviews FOR SELECT USING (auth.uid() = user_id);


-- ==========================================
-- File: migration_coin_real_data_sync.sql
-- ==========================================

-- Migration: Coin feature real-data sync and hardening
-- Purpose:
-- 1) Ensure coin schema pieces exist for production usage
-- 2) Reconcile profiles.coins from persisted coin_transactions ledger

BEGIN;

-- Ensure profiles coin column is production-safe
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS coins INTEGER;

UPDATE profiles
SET coins = 0
WHERE coins IS NULL;

ALTER TABLE profiles
  ALTER COLUMN coins SET DEFAULT 0;

ALTER TABLE profiles
  ALTER COLUMN coins SET NOT NULL;

-- Ensure ledger table exists (kept compatible with existing code)
CREATE TABLE IF NOT EXISTS coin_transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('earn', 'spend')),
  description TEXT,
  reference_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE coin_transactions
  ADD COLUMN IF NOT EXISTS reference_key TEXT;

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user
  ON coin_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_created_at
  ON coin_transactions(user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_coin_transactions_user_reference_key
  ON coin_transactions(user_id, reference_key);

-- Reconcile balances from ledger for real persisted data correctness
WITH ledger AS (
  SELECT
    user_id,
    SUM(
      CASE
        WHEN type = 'earn' THEN amount
        WHEN type = 'spend' THEN -amount
        ELSE 0
      END
    )::INTEGER AS balance
  FROM coin_transactions
  GROUP BY user_id
)
UPDATE profiles p
SET coins = GREATEST(COALESCE(l.balance, 0), 0)
FROM ledger l
WHERE p.id = l.user_id
  AND p.coins IS DISTINCT FROM GREATEST(COALESCE(l.balance, 0), 0);

COMMIT;


-- ==========================================
-- File: migration_coin_transaction_idempotency.sql
-- ==========================================

-- Migration: Add idempotency support to atomic coin transactions.
-- Safe to run multiple times.

ALTER TABLE coin_transactions
ADD COLUMN IF NOT EXISTS reference_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_coin_transactions_user_reference_key
ON coin_transactions(user_id, reference_key);

CREATE OR REPLACE FUNCTION coin_apply_transaction(
  user_id_input UUID,
  amount_input INTEGER,
  txn_type_input TEXT,
  description_input TEXT DEFAULT NULL,
  reference_key_input TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, error TEXT, applied BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance INTEGER;
  inserted_txn_id INTEGER;
BEGIN
  IF amount_input IS NULL OR amount_input <= 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'Amount must be greater than zero', FALSE;
    RETURN;
  END IF;

  IF txn_type_input NOT IN ('earn', 'spend') THEN
    RETURN QUERY SELECT FALSE, 0, 'Invalid transaction type', FALSE;
    RETURN;
  END IF;

  IF reference_key_input IS NOT NULL AND LENGTH(TRIM(reference_key_input)) > 0 THEN
    INSERT INTO coin_transactions (user_id, amount, type, description, reference_key)
    VALUES (
      user_id_input,
      amount_input,
      txn_type_input,
      LEFT(COALESCE(description_input, ''), 160),
      LEFT(TRIM(reference_key_input), 120)
    )
    ON CONFLICT (user_id, reference_key) DO NOTHING
    RETURNING id INTO inserted_txn_id;

    IF inserted_txn_id IS NULL THEN
      SELECT COALESCE(coins, 0) INTO current_balance
      FROM profiles
      WHERE id = user_id_input;

      RETURN QUERY SELECT TRUE, COALESCE(current_balance, 0), 'duplicate_reference', FALSE;
      RETURN;
    END IF;
  END IF;

  IF txn_type_input = 'earn' THEN
    UPDATE profiles
    SET coins = COALESCE(coins, 0) + amount_input
    WHERE id = user_id_input
    RETURNING coins INTO current_balance;

    IF current_balance IS NULL THEN
      IF inserted_txn_id IS NOT NULL THEN
        DELETE FROM coin_transactions WHERE id = inserted_txn_id;
      END IF;
      RETURN QUERY SELECT FALSE, 0, 'User profile not found', FALSE;
      RETURN;
    END IF;
  ELSE
    UPDATE profiles
    SET coins = COALESCE(coins, 0) - amount_input
    WHERE id = user_id_input
      AND COALESCE(coins, 0) >= amount_input
    RETURNING coins INTO current_balance;

    IF current_balance IS NULL THEN
      IF inserted_txn_id IS NOT NULL THEN
        DELETE FROM coin_transactions WHERE id = inserted_txn_id;
      END IF;

      SELECT COALESCE(coins, 0) INTO current_balance
      FROM profiles
      WHERE id = user_id_input;

      IF current_balance IS NULL THEN
        RETURN QUERY SELECT FALSE, 0, 'User profile not found', FALSE;
      ELSE
        RETURN QUERY SELECT FALSE, current_balance, 'Insufficient coins', FALSE;
      END IF;
      RETURN;
    END IF;
  END IF;

  IF inserted_txn_id IS NULL THEN
    INSERT INTO coin_transactions (user_id, amount, type, description)
    VALUES (user_id_input, amount_input, txn_type_input, LEFT(COALESCE(description_input, ''), 160));
  END IF;

  RETURN QUERY SELECT TRUE, current_balance, NULL::TEXT, TRUE;
END;
$$;


-- ==========================================
-- File: migration_community_likes.sql
-- ==========================================

-- Migration: Add community_post_likes table and increment_field RPC function
-- Required by the API audit fix for atomic like increments and deduplication
-- Run this in Supabase SQL Editor or via migration tool

-- ═══════════════════════════════════════════════
-- 1. community_post_likes — Like deduplication table
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS community_post_likes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)  -- Each user can only like a post once
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_community_post_likes_post ON community_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_likes_user ON community_post_likes(user_id);

-- RLS: Enable and add policies
ALTER TABLE community_post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view likes" ON community_post_likes;
DROP POLICY IF EXISTS "Anyone can view likes" ON community_post_likes;
CREATE POLICY "Anyone can view likes" ON community_post_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own likes" ON community_post_likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON community_post_likes;
CREATE POLICY "Users can insert own likes" ON community_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own likes" ON community_post_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON community_post_likes;
CREATE POLICY "Users can delete own likes" ON community_post_likes FOR DELETE USING (auth.uid() = user_id);


-- ═══════════════════════════════════════════════
-- 2. increment_field — Generic atomic counter RPC
--    Used for community_posts.likes and .replies
-- ═══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION increment_field(
  table_name TEXT,
  field_name TEXT,
  row_id INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Only allow whitelisted tables/fields to prevent SQL injection
  IF table_name = 'community_posts' AND field_name IN ('likes', 'replies') THEN
    EXECUTE format(
      'UPDATE %I SET %I = COALESCE(%I, 0) + 1 WHERE id = $1',
      table_name, field_name, field_name
    ) USING row_id;
  ELSE
    RAISE EXCEPTION 'Disallowed table/field combination: %.%', table_name, field_name;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════
-- 3. Bonus: increment_blog_view (referenced by blog.js)
--    Creates it if it doesn't exist yet
-- ═══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION increment_blog_view(blog_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE blogs SET views = COALESCE(views, 0) + 1 WHERE id = blog_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- File: migration_email_verification.sql
-- ==========================================

-- Migration: Add email verification fields to profiles
-- Description: Adds fields to support email verification on signup

-- Add email verification columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster token lookup during verification
CREATE INDEX IF NOT EXISTS idx_profiles_verification_token ON profiles(verification_token);

-- Create index for email_verified status
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(email_verified);


-- ==========================================
-- File: migration_feedback.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    feedback_type TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- File: migration_fix_mismatches.sql
-- ==========================================

-- Migration: Fix schema mismatches found during backend audit
-- Run this in Supabase SQL Editor

-- ═══════════════════════════════════════════════
-- 1. Add solution_code column to problems table
-- ═══════════════════════════════════════════════
ALTER TABLE problems ADD COLUMN IF NOT EXISTS solution_code JSONB;

-- ═══════════════════════════════════════════════
-- 2. Add company and role columns to mock_interviews
-- ═══════════════════════════════════════════════
ALTER TABLE mock_interviews ADD COLUMN IF NOT EXISTS company VARCHAR(255);
ALTER TABLE mock_interviews ADD COLUMN IF NOT EXISTS role VARCHAR(255);

-- ═══════════════════════════════════════════════
-- 3. Add overall_score to resume_analyses 
--    (ats_score exists but overall_score is also queried)
-- ═══════════════════════════════════════════════
ALTER TABLE resume_analyses ADD COLUMN IF NOT EXISTS overall_score FLOAT;

-- ═══════════════════════════════════════════════
-- 4. Add avatar_url to profiles
-- ═══════════════════════════════════════════════
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ═══════════════════════════════════════════════
-- 5. Create bookmarks table (used by notes.js)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS bookmarks (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id INTEGER,
  question_title TEXT DEFAULT 'Untitled',
  question_type TEXT DEFAULT 'dsa',
  tags JSONB DEFAULT '[]',
  note TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_question ON bookmarks(user_id, question_id);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can view own bookmarks" ON bookmarks;
CREATE POLICY "Users can view own bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can create bookmarks" ON bookmarks;
CREATE POLICY "Users can create bookmarks" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can update own bookmarks" ON bookmarks;
CREATE POLICY "Users can update own bookmarks" ON bookmarks FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON bookmarks;
CREATE POLICY "Users can delete own bookmarks" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════
-- 6. Add RLS policies to user_activity table
-- ═══════════════════════════════════════════════
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activity" ON user_activity;
DROP POLICY IF EXISTS "Users can view own activity" ON user_activity;
CREATE POLICY "Users can view own activity" ON user_activity FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own activity" ON user_activity;
DROP POLICY IF EXISTS "Users can insert own activity" ON user_activity;
CREATE POLICY "Users can insert own activity" ON user_activity FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own activity" ON user_activity;
DROP POLICY IF EXISTS "Users can update own activity" ON user_activity;
CREATE POLICY "Users can update own activity" ON user_activity FOR UPDATE USING (auth.uid() = user_id);


-- ==========================================
-- File: migration_fix_rls_recursion.sql
-- ==========================================

-- Migration: Fix RLS Infinite Recursion on Profiles Table
-- Problem: Self-referential RLS policies cause infinite recursion
-- Solution: Disable RLS on profiles since all backend operations use service role key

-- 1. Disable RLS on profiles table
-- Since all backend operations use supabaseAdmin (service role key),
-- RLS is not needed and the self-referential policies cause recursion
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop problematic self-referential policies to clean up
-- These policies query profiles from within profiles RLS evaluation
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- 3. Verification: Confirm RLS is disabled
-- After running this migration, the following should show 0 policies on profiles:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'profiles';

-- 4. Note: If frontend needs direct profile access in future, consider:
-- - Creating a read-only view with simple conditions (not self-referential)
-- - Routing all profile updates through backend API (recommended)
-- - Using database functions with SECURITY DEFINER to handle RLS logic


-- ==========================================
-- File: migration_hr_system.sql
-- ==========================================

-- Migration: HR System additions
-- Adds HR-specific columns to profiles, updates interview_slots, creates interview_bookings

-- 1. Add HR columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'student';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS designation VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER;

-- 2. Add max_bookings and status to interview_slots
ALTER TABLE interview_slots ADD COLUMN IF NOT EXISTS max_bookings INTEGER DEFAULT 1;
ALTER TABLE interview_slots ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'available';

-- 3. Interview bookings table (replaces simple booked_by on slots)
CREATE TABLE IF NOT EXISTS interview_bookings (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  slot_id INTEGER REFERENCES interview_slots(id) ON DELETE CASCADE,
  hr_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_bookings_user ON interview_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_bookings_slot ON interview_bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_interview_bookings_hr ON interview_bookings(hr_id);

-- 4. Add source column to job_listings for HR-posted jobs
-- ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'admin';

-- 5. RLS
ALTER TABLE interview_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own bookings" ON interview_bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON interview_bookings;
CREATE POLICY "Users can view own bookings" ON interview_bookings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "HR can view their bookings" ON interview_bookings;
DROP POLICY IF EXISTS "HR can view their bookings" ON interview_bookings;
CREATE POLICY "HR can view their bookings" ON interview_bookings FOR SELECT USING (auth.uid() = hr_id);


-- ==========================================
-- File: migration_improvement_plans.sql
-- ==========================================

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
CREATE INDEX IF NOT EXISTS idx_improvement_plans_user_id ON improvement_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_improvement_plans_status ON improvement_plans(status);
CREATE INDEX IF NOT EXISTS idx_improvement_plans_created_at ON improvement_plans(created_at DESC);

-- RLS Policies
ALTER TABLE improvement_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own improvement plans" ON improvement_plans;
DROP POLICY IF EXISTS "Users can view their own improvement plans" ON improvement_plans;
CREATE POLICY "Users can view their own improvement plans" ON improvement_plans FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own improvement plans" ON improvement_plans;
DROP POLICY IF EXISTS "Users can insert their own improvement plans" ON improvement_plans;
CREATE POLICY "Users can insert their own improvement plans" ON improvement_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own improvement plans" ON improvement_plans;
DROP POLICY IF EXISTS "Users can update their own improvement plans" ON improvement_plans;
CREATE POLICY "Users can update their own improvement plans" ON improvement_plans FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own improvement plans" ON improvement_plans;
DROP POLICY IF EXISTS "Users can delete their own improvement plans" ON improvement_plans;
CREATE POLICY "Users can delete their own improvement plans" ON improvement_plans FOR DELETE
  USING (auth.uid() = user_id);


-- ==========================================
-- File: migration_improvement_plan_indexes.sql
-- ==========================================

-- Migration: Add indexes to improvement_plans table for better performance

-- Create index on user_id and creation date for faster queries
CREATE INDEX IF NOT EXISTS idx_improvement_plans_user_created 
ON improvement_plans(user_id, created_at DESC);

-- Create index on status for filtering by status
CREATE INDEX IF NOT EXISTS idx_improvement_plans_status 
ON improvement_plans(status);

-- Create index on updated_at for tracking recent updates
CREATE INDEX IF NOT EXISTS idx_improvement_plans_updated 
ON improvement_plans(updated_at DESC);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_improvement_plans_user_status 
ON improvement_plans(user_id, status);

-- Create partial index for active plans (common query pattern)
CREATE INDEX IF NOT EXISTS idx_improvement_plans_active_user 
ON improvement_plans(user_id) 
WHERE status = 'active';

-- Update table statistics for query planner
ANALYZE improvement_plans;

-- ==========================================
-- File: migration_interview_enhancement.sql
-- ==========================================

-- Modern AI Interview System Database Migrations
-- Tables to support enhanced interview features

-- Interview Sessions (for audio/video interviews)
-- Second interview_sessions removed

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
  ROUND(AVG(mi.overall_score)::numeric, 2) as avg_score,
  MAX(mi.overall_score) as best_score,
  MIN(mi.overall_score) as worst_score,
  COUNT(DISTINCT mi.interview_type) as interview_types_attempted,
  MAX(mi.completed_at) as last_interview_date
FROM mock_interviews mi
GROUP BY mi.user_id;


-- ==========================================
-- File: migration_interview_suite_features.sql
-- ==========================================

-- Interview intelligence features: peer matching, mentor booking, and doubt threads
-- Safe to run multiple times.

-- =========================
-- 1) Peer mock profile + requests
-- =========================
CREATE TABLE IF NOT EXISTS peer_mock_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  role_target VARCHAR(120) NOT NULL,
  company_target VARCHAR(120),
  language_preference VARCHAR(50) DEFAULT 'english',
  skill_level VARCHAR(30) DEFAULT 'intermediate' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  availability JSONB DEFAULT '[]'::jsonb,
  bio TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS peer_mock_requests (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_target VARCHAR(120) NOT NULL,
  company_target VARCHAR(120),
  language_preference VARCHAR(50) DEFAULT 'english',
  skill_level VARCHAR(30) DEFAULT 'intermediate' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  requested_slot TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'matched', 'cancelled', 'completed')),
  matched_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_peer_profiles_role_company ON peer_mock_profiles(role_target, company_target);
CREATE INDEX IF NOT EXISTS idx_peer_profiles_user ON peer_mock_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_peer_requests_user ON peer_mock_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_peer_requests_status ON peer_mock_requests(status);

-- =========================
-- 2) Mentor slots + bookings
-- =========================
CREATE TABLE IF NOT EXISTS mentor_mock_slots (
  id SERIAL PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_focus VARCHAR(120),
  role_focus VARCHAR(120),
  language VARCHAR(50) DEFAULT 'english',
  skill_band VARCHAR(30) DEFAULT 'intermediate' CHECK (skill_band IN ('beginner', 'intermediate', 'advanced')),
  topic VARCHAR(120),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS mentor_mock_bookings (
  id SERIAL PRIMARY KEY,
  slot_id INTEGER NOT NULL REFERENCES mentor_mock_slots(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(30) DEFAULT 'booked' CHECK (status IN ('booked', 'completed', 'cancelled')),
  booking_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(slot_id)
);

CREATE INDEX IF NOT EXISTS idx_mentor_slots_mentor ON mentor_mock_slots(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_slots_time ON mentor_mock_slots(starts_at);
CREATE INDEX IF NOT EXISTS idx_mentor_slots_filters ON mentor_mock_slots(company_focus, role_focus, language, skill_band);
CREATE INDEX IF NOT EXISTS idx_mentor_bookings_user ON mentor_mock_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_bookings_mentor ON mentor_mock_bookings(mentor_id);

-- =========================
-- 3) Doubt threads + replies + votes
-- =========================
CREATE TABLE IF NOT EXISTS doubt_threads (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type VARCHAR(30) NOT NULL CHECK (target_type IN ('problem', 'pattern', 'interview_round')),
  target_id VARCHAR(120) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  solved BOOLEAN DEFAULT FALSE,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doubt_replies (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER NOT NULL REFERENCES doubt_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_mentor_reply BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doubt_votes (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER NOT NULL REFERENCES doubt_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_doubt_threads_target ON doubt_threads(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_doubt_threads_user ON doubt_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_doubt_replies_thread ON doubt_replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_doubt_votes_thread ON doubt_votes(thread_id);

-- =========================
-- 4) RLS
-- =========================
ALTER TABLE peer_mock_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_mock_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_mock_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_mock_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubt_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubt_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubt_votes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'peer_mock_profiles' AND policyname = 'Users can view peer profiles'
  ) THEN
    DROP POLICY IF EXISTS "Users can view peer profiles" ON peer_mock_profiles;
DROP POLICY IF EXISTS "Users can view peer profiles" ON peer_mock_profiles;
CREATE POLICY "Users can view peer profiles" ON peer_mock_profiles FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'peer_mock_profiles' AND policyname = 'Users can manage own peer profile'
  ) THEN
    DROP POLICY IF EXISTS "Users can manage own peer profile" ON peer_mock_profiles;
DROP POLICY IF EXISTS "Users can manage own peer profile" ON peer_mock_profiles;
CREATE POLICY "Users can manage own peer profile" ON peer_mock_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'peer_mock_requests' AND policyname = 'Users can view peer requests'
  ) THEN
    DROP POLICY IF EXISTS "Users can view peer requests" ON peer_mock_requests;
DROP POLICY IF EXISTS "Users can view peer requests" ON peer_mock_requests;
CREATE POLICY "Users can view peer requests" ON peer_mock_requests FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'peer_mock_requests' AND policyname = 'Users can manage own peer requests'
  ) THEN
    DROP POLICY IF EXISTS "Users can manage own peer requests" ON peer_mock_requests;
DROP POLICY IF EXISTS "Users can manage own peer requests" ON peer_mock_requests;
CREATE POLICY "Users can manage own peer requests" ON peer_mock_requests FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mentor_mock_slots' AND policyname = 'Users can view mentor slots'
  ) THEN
    DROP POLICY IF EXISTS "Users can view mentor slots" ON mentor_mock_slots;
DROP POLICY IF EXISTS "Users can view mentor slots" ON mentor_mock_slots;
CREATE POLICY "Users can view mentor slots" ON mentor_mock_slots FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mentor_mock_slots' AND policyname = 'Mentors can manage own slots'
  ) THEN
    DROP POLICY IF EXISTS "Mentors can manage own slots" ON mentor_mock_slots;
DROP POLICY IF EXISTS "Mentors can manage own slots" ON mentor_mock_slots;
CREATE POLICY "Mentors can manage own slots" ON mentor_mock_slots FOR ALL USING (auth.uid() = mentor_id) WITH CHECK (auth.uid() = mentor_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mentor_mock_bookings' AND policyname = 'Users can view related mentor bookings'
  ) THEN
    DROP POLICY IF EXISTS "Users can view related mentor bookings" ON mentor_mock_bookings;
DROP POLICY IF EXISTS "Users can view related mentor bookings" ON mentor_mock_bookings;
CREATE POLICY "Users can view related mentor bookings" ON mentor_mock_bookings FOR SELECT USING (auth.uid() = user_id OR auth.uid() = mentor_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mentor_mock_bookings' AND policyname = 'Users can create own mentor bookings'
  ) THEN
    DROP POLICY IF EXISTS "Users can create own mentor bookings" ON mentor_mock_bookings;
DROP POLICY IF EXISTS "Users can create own mentor bookings" ON mentor_mock_bookings;
CREATE POLICY "Users can create own mentor bookings" ON mentor_mock_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mentor_mock_bookings' AND policyname = 'Users can update related mentor bookings'
  ) THEN
    DROP POLICY IF EXISTS "Users can update related mentor bookings" ON mentor_mock_bookings;
DROP POLICY IF EXISTS "Users can update related mentor bookings" ON mentor_mock_bookings;
CREATE POLICY "Users can update related mentor bookings" ON mentor_mock_bookings FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = mentor_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doubt_threads' AND policyname = 'Users can view doubt threads'
  ) THEN
    DROP POLICY IF EXISTS "Users can view doubt threads" ON doubt_threads;
DROP POLICY IF EXISTS "Users can view doubt threads" ON doubt_threads;
CREATE POLICY "Users can view doubt threads" ON doubt_threads FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doubt_threads' AND policyname = 'Users can create doubt threads'
  ) THEN
    DROP POLICY IF EXISTS "Users can create doubt threads" ON doubt_threads;
DROP POLICY IF EXISTS "Users can create doubt threads" ON doubt_threads;
CREATE POLICY "Users can create doubt threads" ON doubt_threads FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doubt_threads' AND policyname = 'Users can update own doubt threads'
  ) THEN
    DROP POLICY IF EXISTS "Users can update own doubt threads" ON doubt_threads;
DROP POLICY IF EXISTS "Users can update own doubt threads" ON doubt_threads;
CREATE POLICY "Users can update own doubt threads" ON doubt_threads FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doubt_replies' AND policyname = 'Users can view doubt replies'
  ) THEN
    DROP POLICY IF EXISTS "Users can view doubt replies" ON doubt_replies;
DROP POLICY IF EXISTS "Users can view doubt replies" ON doubt_replies;
CREATE POLICY "Users can view doubt replies" ON doubt_replies FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doubt_replies' AND policyname = 'Users can create doubt replies'
  ) THEN
    DROP POLICY IF EXISTS "Users can create doubt replies" ON doubt_replies;
DROP POLICY IF EXISTS "Users can create doubt replies" ON doubt_replies;
CREATE POLICY "Users can create doubt replies" ON doubt_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doubt_votes' AND policyname = 'Users can view doubt votes'
  ) THEN
    DROP POLICY IF EXISTS "Users can view doubt votes" ON doubt_votes;
DROP POLICY IF EXISTS "Users can view doubt votes" ON doubt_votes;
CREATE POLICY "Users can view doubt votes" ON doubt_votes FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'doubt_votes' AND policyname = 'Users can manage own doubt votes'
  ) THEN
    DROP POLICY IF EXISTS "Users can manage own doubt votes" ON doubt_votes;
DROP POLICY IF EXISTS "Users can manage own doubt votes" ON doubt_votes;
CREATE POLICY "Users can manage own doubt votes" ON doubt_votes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- ==========================================
-- File: migration_job_listings.sql
-- ==========================================

-- Migration: Add job_listings table for the Job Updates feature

CREATE TABLE IF NOT EXISTS job_listings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  company VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'fresher',
  type VARCHAR(50) DEFAULT 'full-time',
  location VARCHAR(255),
  salary_range VARCHAR(100),
  description TEXT NOT NULL,
  requirements JSONB DEFAULT '[]'::jsonb,
  apply_link VARCHAR(1000),
  deadline TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  posted_by UUID REFERENCES profiles(id),
  tags JSONB DEFAULT '[]'::jsonb,
  source VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_listings_category ON job_listings(category);
CREATE INDEX IF NOT EXISTS idx_job_listings_active ON job_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_job_listings_company ON job_listings(company);
CREATE INDEX IF NOT EXISTS idx_job_listings_created ON job_listings(created_at DESC);

-- Enable RLS
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active job listings
DROP POLICY IF EXISTS "Anyone can view active jobs" ON job_listings;
DROP POLICY IF EXISTS "Anyone can view active jobs" ON job_listings;
CREATE POLICY "Anyone can view active jobs" ON job_listings
  FOR SELECT USING (is_active = true);

-- Admins can manage all jobs (insert/update/delete handled via service role key)


-- ==========================================
-- File: migration_library.sql
-- ==========================================

-- Migration: Library Management System
-- Purpose: Add database tables for library book management
-- Date: 2026-04-01

-- 1. Books Table
CREATE TABLE IF NOT EXISTS library_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Book Information
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  isbn VARCHAR(20),
  description TEXT,
  cover_url VARCHAR(500),
  
  -- Categorization
  category VARCHAR(100), -- e.g., 'DSA', 'System Design', 'Web Development', 'Interview Prep'
  subcategory VARCHAR(100),
  tags TEXT[], -- Array of tags for filtering
  
  -- Book Details
  publisher VARCHAR(255),
  publication_date DATE,
  language VARCHAR(50) DEFAULT 'English',
  pages INTEGER,
  edition VARCHAR(50),
  
  -- Resource Links
  amazon_url VARCHAR(500),
  goodreads_url VARCHAR(500),
  resource_url VARCHAR(500), -- Link to read online or download
  
  -- Metadata
  difficulty_level VARCHAR(50), -- 'Beginner', 'Intermediate', 'Advanced'
  rating NUMERIC(3, 2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  
  -- Admin Information
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  approved BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Book Reviews Table
CREATE TABLE IF NOT EXISTS library_book_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate reviews from same user for same book
  UNIQUE(book_id, user_id)
);

-- 3. User Library Shelf Table (for marking books as read/favorites)
CREATE TABLE IF NOT EXISTS library_user_shelves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  
  -- Shelf status
  status VARCHAR(50), -- 'reading', 'completed', 'wishlist', 'favorite'
  
  notes TEXT,
  reading_progress INTEGER DEFAULT 0, -- Percentage (0-100)
  
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate shelf entries
  UNIQUE(user_id, book_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_library_books_category ON library_books(category);
CREATE INDEX IF NOT EXISTS idx_library_books_created_at ON library_books(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_library_books_approved ON library_books(approved);
CREATE INDEX IF NOT EXISTS idx_library_books_tags ON library_books USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_library_book_reviews_book_id ON library_book_reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_library_user_shelves_user_id ON library_user_shelves(user_id);
CREATE INDEX IF NOT EXISTS idx_library_user_shelves_book_id ON library_user_shelves(book_id);

-- Enable Row Level Security (RLS)
ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_book_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_user_shelves ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view approved books
DROP POLICY IF EXISTS "Anyone can view approved books" ON library_books;
DROP POLICY IF EXISTS "Anyone can view approved books" ON library_books;
CREATE POLICY "Anyone can view approved books" ON library_books FOR SELECT
  USING (approved = TRUE);

-- Only admins can insert/update/delete books
DROP POLICY IF EXISTS "Only admins can manage books" ON library_books;
DROP POLICY IF EXISTS "Only admins can manage books" ON library_books;
CREATE POLICY "Only admins can manage books" ON library_books FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE (raw_user_meta_data->>'role')::text = 'admin' OR
            (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    )
  );

-- Anyone authenticated can view and create reviews
DROP POLICY IF EXISTS "Authenticated users can view reviews" ON library_book_reviews;
DROP POLICY IF EXISTS "Authenticated users can view reviews" ON library_book_reviews;
CREATE POLICY "Authenticated users can view reviews" ON library_book_reviews FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can create their own reviews" ON library_book_reviews;
DROP POLICY IF EXISTS "Authenticated users can create their own reviews" ON library_book_reviews;
CREATE POLICY "Authenticated users can create their own reviews" ON library_book_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON library_book_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON library_book_reviews;
CREATE POLICY "Users can update their own reviews" ON library_book_reviews FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON library_book_reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON library_book_reviews;
CREATE POLICY "Users can delete their own reviews" ON library_book_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- User shelf policies
DROP POLICY IF EXISTS "Authenticated users can view shelves" ON library_user_shelves;
DROP POLICY IF EXISTS "Authenticated users can view shelves" ON library_user_shelves;
CREATE POLICY "Authenticated users can view shelves" ON library_user_shelves FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can manage their own shelf" ON library_user_shelves;
DROP POLICY IF EXISTS "Users can manage their own shelf" ON library_user_shelves;
CREATE POLICY "Users can manage their own shelf" ON library_user_shelves FOR ALL
  USING (auth.uid() = user_id);


-- ==========================================
-- File: migration_performance_indexes.sql
-- ==========================================

-- Migration: Performance indexes for high-frequency read patterns
-- Safe to run multiple times.

-- community feeds
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_likes_created_at ON community_posts(likes DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_replies_post_created_at ON community_replies(post_id, created_at ASC);

-- user activity/history fetches
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_created_at ON coin_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created_at ON chat_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_user_submitted_at ON submissions(user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_real_interviews_user_scheduled_at ON real_interviews(user_id, scheduled_at DESC);

-- interview suite timeline and booking lookups
CREATE INDEX IF NOT EXISTS idx_doubt_threads_created_at ON doubt_threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentor_mock_slots_starts_at ON mentor_mock_slots(starts_at ASC);
CREATE INDEX IF NOT EXISTS idx_mentor_mock_bookings_user_created_at ON mentor_mock_bookings(user_id, created_at DESC);


-- ==========================================
-- File: migration_portfolio_phase1.sql
-- ==========================================

-- Migration: Portfolio generator phase 1 schema
-- Scope: normalized profiles, published portfolio sites, short links, and import account/resume tracking.

CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('github', 'linkedin')),
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_provider
  ON connected_accounts(user_id, provider);

CREATE TABLE IF NOT EXISTS resume_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  mime_type TEXT,
  parsed_content JSONB NOT NULL DEFAULT '{}'::jsonb,
  parse_confidence_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  parsing_error TEXT,
  parsed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_uploads_user_id
  ON resume_uploads(user_id);

CREATE INDEX IF NOT EXISTS idx_resume_uploads_created_at
  ON resume_uploads(created_at DESC);

CREATE TABLE IF NOT EXISTS normalized_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  basic_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  contacts JSONB NOT NULL DEFAULT '{}'::jsonb,
  socials JSONB NOT NULL DEFAULT '{}'::jsonb,
  skills JSONB NOT NULL DEFAULT '{}'::jsonb,
  experience JSONB NOT NULL DEFAULT '[]'::jsonb,
  education JSONB NOT NULL DEFAULT '[]'::jsonb,
  projects JSONB NOT NULL DEFAULT '[]'::jsonb,
  certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  achievements JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  data_quality_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  last_import_sources TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_normalized_profiles_user_id
  ON normalized_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_normalized_profiles_data_quality
  ON normalized_profiles(data_quality_score DESC);

CREATE TABLE IF NOT EXISTS portfolio_sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES normalized_profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  template TEXT NOT NULL DEFAULT 'minimal',
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  html_content TEXT,
  title TEXT,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'unlisted')),
  custom_domain TEXT,
  custom_domain_verified BOOLEAN NOT NULL DEFAULT FALSE,
  seo_data JSONB NOT NULL DEFAULT '{"title":"","description":"","keywords":[]}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_sites_user_id
  ON portfolio_sites(user_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_sites_slug
  ON portfolio_sites(slug);

CREATE INDEX IF NOT EXISTS idx_portfolio_sites_published
  ON portfolio_sites(published, visibility);

CREATE TABLE IF NOT EXISTS short_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_site_id UUID NOT NULL REFERENCES portfolio_sites(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  full_url TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_short_links_slug
  ON short_links(slug);

CREATE INDEX IF NOT EXISTS idx_short_links_portfolio_site_id
  ON short_links(portfolio_site_id);

CREATE TABLE IF NOT EXISTS portfolio_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_site_id UUID NOT NULL REFERENCES portfolio_sites(id) ON DELETE CASCADE,
  visitor_ip TEXT,
  visitor_country TEXT,
  referrer TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  session_duration_seconds INTEGER,
  sections_viewed TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_visits_site_id
  ON portfolio_visits(portfolio_site_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_visits_visited_at
  ON portfolio_visits(visited_at DESC);

ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE normalized_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE short_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_visits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'connected_accounts' AND policyname = 'Users can manage own connected accounts'
  ) THEN
    DROP POLICY IF EXISTS "Users can manage own connected accounts" ON connected_accounts;
DROP POLICY IF EXISTS "Users can manage own connected accounts" ON connected_accounts;
CREATE POLICY "Users can manage own connected accounts" ON connected_accounts
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'resume_uploads' AND policyname = 'Users can manage own resume uploads'
  ) THEN
    DROP POLICY IF EXISTS "Users can manage own resume uploads" ON resume_uploads;
DROP POLICY IF EXISTS "Users can manage own resume uploads" ON resume_uploads;
CREATE POLICY "Users can manage own resume uploads" ON resume_uploads
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'normalized_profiles' AND policyname = 'Users can manage own normalized profiles'
  ) THEN
    DROP POLICY IF EXISTS "Users can manage own normalized profiles" ON normalized_profiles;
DROP POLICY IF EXISTS "Users can manage own normalized profiles" ON normalized_profiles;
CREATE POLICY "Users can manage own normalized profiles" ON normalized_profiles
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'portfolio_sites' AND policyname = 'Users can manage own portfolio sites'
  ) THEN
    DROP POLICY IF EXISTS "Users can manage own portfolio sites" ON portfolio_sites;
DROP POLICY IF EXISTS "Users can manage own portfolio sites" ON portfolio_sites;
CREATE POLICY "Users can manage own portfolio sites" ON portfolio_sites
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'portfolio_sites' AND policyname = 'Public can read published portfolio sites'
  ) THEN
    DROP POLICY IF EXISTS "Public can read published portfolio sites" ON portfolio_sites;
DROP POLICY IF EXISTS "Public can read published portfolio sites" ON portfolio_sites;
CREATE POLICY "Public can read published portfolio sites" ON portfolio_sites
      FOR SELECT
      USING (published = TRUE AND visibility IN ('public', 'unlisted'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'short_links' AND policyname = 'Users can manage own short links through site ownership'
  ) THEN
    DROP POLICY IF EXISTS "Users can manage own short links through site ownership" ON short_links;
DROP POLICY IF EXISTS "Users can manage own short links through site ownership" ON short_links;
CREATE POLICY "Users can manage own short links through site ownership" ON short_links
      USING (
        EXISTS (
          SELECT 1
          FROM portfolio_sites ps
          WHERE ps.id = short_links.portfolio_site_id
            AND ps.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM portfolio_sites ps
          WHERE ps.id = short_links.portfolio_site_id
            AND ps.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'short_links' AND policyname = 'Public can resolve short links'
  ) THEN
    DROP POLICY IF EXISTS "Public can resolve short links" ON short_links;
DROP POLICY IF EXISTS "Public can resolve short links" ON short_links;
CREATE POLICY "Public can resolve short links" ON short_links
      FOR SELECT
      USING (TRUE);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'portfolio_visits' AND policyname = 'Users can read own portfolio visits'
  ) THEN
    DROP POLICY IF EXISTS "Users can read own portfolio visits" ON portfolio_visits;
DROP POLICY IF EXISTS "Users can read own portfolio visits" ON portfolio_visits;
CREATE POLICY "Users can read own portfolio visits" ON portfolio_visits
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM portfolio_sites ps
          WHERE ps.id = portfolio_visits.portfolio_site_id
            AND ps.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'portfolio_visits' AND policyname = 'Public can insert portfolio visits'
  ) THEN
    DROP POLICY IF EXISTS "Public can insert portfolio visits" ON portfolio_visits;
DROP POLICY IF EXISTS "Public can insert portfolio visits" ON portfolio_visits;
CREATE POLICY "Public can insert portfolio visits" ON portfolio_visits
      FOR INSERT
      WITH CHECK (TRUE);
  END IF;
END $$;


-- ==========================================
-- File: migration_portfolio_resume_upload.sql
-- ==========================================

-- Migration: portfolio_resume_upload
-- Adds resume file URL and parsed timestamp to normalized_profiles

ALTER TABLE normalized_profiles
  ADD COLUMN IF NOT EXISTS resume_file_url TEXT,
  ADD COLUMN IF NOT EXISTS resume_file_name TEXT,
  ADD COLUMN IF NOT EXISTS resume_parsed_at TIMESTAMPTZ;

-- Index for querying profiles with uploaded resumes
CREATE INDEX IF NOT EXISTS idx_normalized_profiles_resume_parsed_at
  ON normalized_profiles (resume_parsed_at)
  WHERE resume_parsed_at IS NOT NULL;


-- ==========================================
-- File: migration_preploop_career_guidance.sql
-- ==========================================

-- PrepLoop career guidance data model

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS qualification TEXT;

CREATE TABLE IF NOT EXISTS career_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_name TEXT NOT NULL,
  institution TEXT,
  category TEXT,
  level TEXT,
  qualification TEXT,
  skills TEXT[] DEFAULT '{}'::text[],
  normalized_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_career_courses_course_name ON career_courses(course_name);
CREATE INDEX IF NOT EXISTS idx_career_courses_category ON career_courses(category);
CREATE INDEX IF NOT EXISTS idx_career_courses_level ON career_courses(level);

CREATE TABLE IF NOT EXISTS career_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL,
  company_type TEXT,
  location TEXT,
  qualification TEXT,
  skills TEXT[] DEFAULT '{}'::text[],
  salary_min NUMERIC(12,2),
  salary_max NUMERIC(12,2),
  demand_score NUMERIC(5,2) DEFAULT 0,
  normalized_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_career_roles_role_name ON career_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_career_roles_location ON career_roles(location);
CREATE INDEX IF NOT EXISTS idx_career_roles_demand_score ON career_roles(demand_score DESC);

CREATE TABLE IF NOT EXISTS career_pathways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES career_courses(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES career_roles(id) ON DELETE CASCADE,
  similarity_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  skill_overlap NUMERIC(5,2) NOT NULL DEFAULT 0,
  demand_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  constraints JSONB NOT NULL DEFAULT '{}'::jsonb,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_career_pathways_course_id ON career_pathways(course_id);
CREATE INDEX IF NOT EXISTS idx_career_pathways_role_id ON career_pathways(role_id);
CREATE INDEX IF NOT EXISTS idx_career_pathways_similarity_score ON career_pathways(similarity_score DESC);

CREATE TABLE IF NOT EXISTS career_market_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES career_roles(id) ON DELETE CASCADE,
  location TEXT,
  salary_min NUMERIC(12,2),
  salary_max NUMERIC(12,2),
  trend_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  emerging_skills TEXT[] DEFAULT '{}'::text[],
  source TEXT,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_career_market_signals_role_id ON career_market_signals(role_id);
CREATE INDEX IF NOT EXISTS idx_career_market_signals_location ON career_market_signals(location);
CREATE INDEX IF NOT EXISTS idx_career_market_signals_trend_score ON career_market_signals(trend_score DESC);


-- ==========================================
-- File: migration_profiles_job_matching.sql
-- ==========================================

-- Migration: Add fields to profiles for intelligent job matching
-- Description: Adds skills, experience_summary, preferred_role, and preferred_location to the profiles table.

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS skills TEXT,
ADD COLUMN IF NOT EXISTS experience_summary TEXT,
ADD COLUMN IF NOT EXISTS preferred_role TEXT,
ADD COLUMN IF NOT EXISTS preferred_location TEXT;


-- ==========================================
-- File: migration_profile_enhancements.sql
-- ==========================================

-- Migration to enhance profile table with additional fields
-- This adds new columns to the profiles table to support enhanced profile functionality

-- Add phone number column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT CHECK (char_length(phone) <= 20) DEFAULT '';

-- Add location column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS location TEXT CHECK (char_length(location) <= 100) DEFAULT '';

-- Add website column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS website TEXT CHECK (char_length(website) <= 200) DEFAULT '';

-- Add company column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS company TEXT CHECK (char_length(company) <= 100) DEFAULT '';

-- Add years_of_experience column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS years_of_experience TEXT CHECK (char_length(years_of_experience) <= 20) DEFAULT '';

-- Add specialization column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS specialization TEXT CHECK (char_length(specialization) <= 100) DEFAULT '';

-- Add social links as JSONB column to store various social profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Add individual social profile columns (kept for backward compatibility if needed)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS twitter TEXT CHECK (char_length(twitter) <= 50) DEFAULT '';

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS linkedin TEXT CHECK (char_length(linkedin) <= 50) DEFAULT '';

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS portfolio TEXT CHECK (char_length(portfolio) <= 200) DEFAULT '';

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS dribbble TEXT CHECK (char_length(dribbble) <= 50) DEFAULT '';

-- Add updated_at column for tracking profile updates
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update the RLS policies to allow users to update their own profiles
-- (assuming RLS is enabled)

-- Add indexes for better performance on commonly searched fields
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING gin(to_tsvector('english', location));
CREATE INDEX IF NOT EXISTS idx_profiles_specialization ON profiles USING gin(to_tsvector('english', specialization));
CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles USING gin(to_tsvector('english', company));
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles (updated_at);

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- File: migration_profile_fields.sql
-- ==========================================

-- Migration: add editable profile fields used by the profile page

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_summary TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education TEXT;


-- ==========================================
-- File: migration_quiz_feature.sql
-- ==========================================

-- Migration: Quiz feature storage and leaderboard support

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_topic_attempted
  ON quiz_attempts(user_id, topic, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_topic_attempted
  ON quiz_attempts(topic, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_attempted_at
  ON quiz_attempts(attempted_at DESC);


-- ==========================================
-- File: migration_required_bundle.sql
-- ==========================================

-- Bundle migration: Email verification + Coins/Streak/Chat + Interview scheduling
-- Safe to run multiple times.

-- =========================
-- 1) Email verification
-- =========================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_verification_token ON profiles(verification_token);
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(email_verified);

-- =========================
-- 2) Coins + streak profile fields
-- =========================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_date TEXT;

-- =========================
-- 3) Coin transactions
-- =========================
CREATE TABLE IF NOT EXISTS coin_transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('earn', 'spend')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id);

-- =========================
-- 4) Chat messages
-- =========================
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);

-- =========================
-- 5) Interview slots
-- =========================
CREATE TABLE IF NOT EXISTS interview_slots (
  id SERIAL PRIMARY KEY,
  hr_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  booked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_slots_hr ON interview_slots(hr_id);
CREATE INDEX IF NOT EXISTS idx_interview_slots_date ON interview_slots(slot_date);

-- =========================
-- 6) Real interviews
-- =========================
CREATE TABLE IF NOT EXISTS real_interviews (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  hr_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  slot_id INTEGER REFERENCES interview_slots(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  meeting_link TEXT,
  notes TEXT,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_real_interviews_user ON real_interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_real_interviews_hr ON real_interviews(hr_id);

-- =========================
-- 7) RLS + idempotent policies
-- =========================
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_interviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'coin_transactions' AND policyname = 'Users can view own coin transactions'
  ) THEN
    DROP POLICY IF EXISTS "Users can view own coin transactions" ON coin_transactions;
DROP POLICY IF EXISTS "Users can view own coin transactions" ON coin_transactions;
CREATE POLICY "Users can view own coin transactions" ON coin_transactions FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chat_messages' AND policyname = 'Users can view own chat messages'
  ) THEN
    DROP POLICY IF EXISTS "Users can view own chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can view own chat messages" ON chat_messages;
CREATE POLICY "Users can view own chat messages" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'interview_slots' AND policyname = 'Anyone can view available slots'
  ) THEN
    DROP POLICY IF EXISTS "Anyone can view available slots" ON interview_slots;
DROP POLICY IF EXISTS "Anyone can view available slots" ON interview_slots;
CREATE POLICY "Anyone can view available slots" ON interview_slots FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'real_interviews' AND policyname = 'Users can view own interviews'
  ) THEN
    DROP POLICY IF EXISTS "Users can view own interviews" ON real_interviews;
DROP POLICY IF EXISTS "Users can view own interviews" ON real_interviews;
CREATE POLICY "Users can view own interviews" ON real_interviews FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;


-- ==========================================
-- File: migration_study_groups.sql
-- ==========================================

-- Migration: Add study groups feature
-- Creates tables for study groups, memberships, and sessions

-- ═══════════════════════════════════════════════
-- 1. study_groups table
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS study_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  emoji VARCHAR(10) DEFAULT '📚',
  color VARCHAR(20) DEFAULT '#60a5fa',
  tags JSONB DEFAULT '[]'::jsonb,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_count INTEGER DEFAULT 1,
  online_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════
-- 2. study_group_members table
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS study_group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member', -- 'admin', 'moderator', 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- ═══════════════════════════════════════════════
-- 3. Indexes
-- ═══════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_study_groups_creator ON study_groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_study_groups_public ON study_groups(is_public);
CREATE INDEX IF NOT EXISTS idx_study_group_members_group ON study_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_user ON study_group_members(user_id);

-- ═══════════════════════════════════════════════
-- 4. RLS Policies
-- ═══════════════════════════════════════════════
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public groups" ON study_groups;
DROP POLICY IF EXISTS "Anyone can view public groups" ON study_groups;
CREATE POLICY "Anyone can view public groups" ON study_groups FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Users can create groups" ON study_groups;
DROP POLICY IF EXISTS "Users can create groups" ON study_groups;
CREATE POLICY "Users can create groups" ON study_groups FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators can update own groups" ON study_groups;
DROP POLICY IF EXISTS "Creators can update own groups" ON study_groups;
CREATE POLICY "Creators can update own groups" ON study_groups FOR UPDATE USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Anyone can view group members" ON study_group_members;
DROP POLICY IF EXISTS "Anyone can view group members" ON study_group_members;
CREATE POLICY "Anyone can view group members" ON study_group_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join groups" ON study_group_members;
DROP POLICY IF EXISTS "Users can join groups" ON study_group_members;
CREATE POLICY "Users can join groups" ON study_group_members FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave groups" ON study_group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON study_group_members;
CREATE POLICY "Users can leave groups" ON study_group_members FOR DELETE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════
-- 5. Trigger to update member count
-- ═══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE study_groups 
    SET member_count = member_count + 1 
    WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE study_groups 
    SET member_count = GREATEST(member_count - 1, 0)
    WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_member_count ON study_group_members;
DROP TRIGGER IF EXISTS trigger_update_member_count ON study_group_members;
CREATE TRIGGER trigger_update_member_count AFTER INSERT OR DELETE ON study_group_members
  FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

