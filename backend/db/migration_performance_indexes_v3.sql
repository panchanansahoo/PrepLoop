-- Migration: Additional Performance Indexes V3
-- Identifies missing indexes on high-frequency queries
-- Based on route analysis: profiles.coins, status filters, problem queries
-- Safe to run multiple times (uses IF NOT EXISTS)

-- ============================================================
-- Profiles table — frequently queried columns
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_subscription_created
  ON profiles(subscription_tier, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_coins
  ON profiles(coins DESC) WHERE coins > 0;

-- ============================================================
-- Problems table — frequently filtered by difficulty and tags
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_difficulty
  ON problems(difficulty);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_pattern_difficulty
  ON problems(pattern_id, difficulty);

-- Using GIN index for JSONB tags column (efficient for JSON containment queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_tags_gin
  ON problems USING GIN(tags);

-- ============================================================
-- User Progress — critical for DSA dashboard queries
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_status
  ON user_progress(user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_solved_at
  ON user_progress(user_id, solved_at DESC) WHERE solved_at IS NOT NULL;

-- ============================================================
-- Submissions table — filtered by status and user
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_user_status
  ON submissions(user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_user_lang
  ON submissions(user_id, language);

-- ============================================================
-- Quiz Results table — frequently queried by date range
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quiz_results_user_attempted
  ON quiz_results(user_id, attempted_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quiz_results_topic
  ON quiz_results(user_id, topic, attempted_at DESC);

-- ============================================================
-- Interview History — heavily used for analytics and filtering
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_history_status
  ON interview_history(user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_history_difficulty
  ON interview_history(interview_type, difficulty, created_at DESC);

-- ============================================================
-- Feedback table — for feedback lookup and analytics
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedback_user_created
  ON feedback(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedback_interview_type
  ON feedback(interview_type, created_at DESC);

-- ============================================================
-- Real Interviews table — booking and scheduling queries
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_real_interviews_user_status
  ON real_interviews(user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_real_interviews_scheduled_start
  ON real_interviews(scheduled_at, user_id) WHERE scheduled_at IS NOT NULL;

-- ============================================================
-- Job Listings table — filtered by location, salary, skills
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_listings_location
  ON job_listings(location) WHERE status = 'active';

-- GIN index for skills JSON array filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_listings_skills_gin
  ON job_listings USING GIN(skills);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_listings_created_desc
  ON job_listings(created_at DESC) WHERE status = 'active';

-- ============================================================
-- Improvements Plans — commonly filtered by status
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_improvement_plans_user_status
  ON improvement_plans(user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_improvement_plans_due_date
  ON improvement_plans(user_id, due_date) WHERE status = 'in_progress';

-- ============================================================
-- Chat Messages — frequently queried for recent messages
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_user_at_desc
  ON chat_messages(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_room_created
  ON chat_messages(room_id, created_at DESC);

-- ============================================================
-- Resume Analyses — queried by user and status
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resume_analyses_user_status
  ON resume_analyses(user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resume_analyses_user_created
  ON resume_analyses(user_id, created_at DESC);

-- ============================================================
-- Activity Table — for dashboard and progress tracking
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_user_type_date
  ON user_activity(user_id, activity_type, activity_date DESC);

-- ============================================================
-- Notes table — frequently filtered by date
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_user_created
  ON notes(user_id, created_at DESC);

-- ============================================================
-- SQL Problems — searched by difficulty and keywords
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sql_problems_difficulty
  ON sql_problems(difficulty) WHERE difficulty IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sql_problems_user_created
  ON sql_problems(created_by, created_at DESC);

-- ============================================================
-- Community Posts — filtered by status and likes
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_community_posts_user_created
  ON community_posts(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_community_posts_status_created
  ON community_posts(status, created_at DESC) WHERE status = 'published';

-- ============================================================
-- Study Groups — active groups and member lookups
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_groups_members_user
  ON study_group_members(user_id, joined_at DESC);

-- ============================================================
-- Skill Tags — for efficient filtering in various contexts
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_skill_tags_name
  ON skill_tags(name) WHERE is_active = true;

-- ============================================================
-- Auth Sessions (if tracking)
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_sessions_user_created
  ON auth_sessions(user_id, created_at DESC) WHERE is_active = true;

-- ============================================================
-- Audit Logs — for compliance and debugging
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_created
  ON audit_logs(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action_date
  ON audit_logs(action, created_at DESC);
