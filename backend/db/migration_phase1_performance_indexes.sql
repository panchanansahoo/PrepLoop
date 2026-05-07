-- Phase 1 Performance Optimization: Additional Critical Indexes
-- Created: May 6, 2026
-- Purpose: Improve query performance for high-traffic endpoints

-- ============================================================================
-- User Activity & Progress Tracking
-- ============================================================================

-- Index for user activity queries (dashboard, analytics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_user_created 
ON user_activity(user_id, created_at DESC);

-- Index for filtering activity by type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_type 
ON user_activity(activity_type);

-- ============================================================================
-- Interview History & Feedback
-- ============================================================================

-- Composite index for interview history queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_history_user_date 
ON interview_history(user_id, created_at DESC);

-- Index for interview feedback lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_feedback_interview_id 
ON interview_feedback(interview_id);

-- Index for filtering interviews by type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_history_type 
ON interview_history(interview_type);

-- Index for interview scores aggregation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_history_scores 
ON interview_history(user_id, technical_score, communication_score);

-- ============================================================================
-- Problems & DSA Practice
-- ============================================================================

-- Index for problem difficulty filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_difficulty_pattern 
ON problems(difficulty, pattern_id);

-- Index for company-specific problems
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_company 
ON problems(company_name) WHERE company_name IS NOT NULL;

-- Index for problem tags (GIN index for array search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_tags 
ON problems USING GIN(tags);

-- Index for user progress on problems
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_user_problem 
ON user_progress(user_id, problem_id);

-- Index for tracking solved problems
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_solved 
ON user_progress(user_id) WHERE status = 'solved';

-- ============================================================================
-- Job Listings & Applications
-- ============================================================================

-- Index for job location-based searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_listings_location 
ON job_listings(location);

-- Index for job skills matching (GIN for array)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_listings_skills_gin 
ON job_listings USING GIN(skills);

-- Index for job experience level filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_listings_experience 
ON job_listings(experience_level);

-- Index for job applications by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_applications_user_status 
ON job_applications(user_id, status);

-- Index for job posting date (most recent first)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_listings_posted_date 
ON job_listings(posted_at DESC);

-- ============================================================================
-- Blog & Community
-- ============================================================================

-- Index for blog posts by slug (fast lookup)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_slug 
ON blog_posts(slug);

-- Index for blog posts by author
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_author 
ON blog_posts(author_id);

-- Index for blog posts by publish date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_published 
ON blog_posts(published_at DESC) WHERE published = true;

-- Index for community posts by category
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_community_posts_category 
ON community_posts(category);

-- Index for community posts engagement
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_community_posts_likes 
ON community_posts(likes_count DESC);

-- ============================================================================
-- Notes & Bookmarks
-- ============================================================================

-- Index for user notes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_user_updated 
ON notes(user_id, updated_at DESC);

-- Index for bookmarks by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookmarks_user_type 
ON bookmarks(user_id, bookmark_type);

-- ============================================================================
-- Payment & Transactions
-- ============================================================================

-- Index for payment transactions by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_user_date 
ON payments(user_id, created_at DESC);

-- Index for payment status tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status 
ON payments(status);

-- Index for coin transactions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coin_transactions_user 
ON coin_transactions(user_id, created_at DESC);

-- ============================================================================
-- Improvement Plans
-- ============================================================================

-- Index for improvement plans by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_improvement_plans_user_active 
ON improvement_plans(user_id) WHERE status = 'active';

-- Index for plan metrics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_plan_metrics_plan_date 
ON plan_metrics(plan_id, recorded_at DESC);

-- ============================================================================
-- Submissions & Code Reviews
-- ============================================================================

-- Index for code submissions by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_user_problem 
ON submissions(user_id, problem_id, submitted_at DESC);

-- Index for submission language
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_language 
ON submissions(language);

-- Index for AI code review sessions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_code_reviews_user 
ON code_review_sessions(user_id, created_at DESC);

-- ============================================================================
-- Resume Analyses
-- ============================================================================

-- Index for resume analyses by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resume_analyses_user 
ON resume_analyses(user_id, analyzed_at DESC);

-- ============================================================================
-- Learning Paths & Progress
-- ============================================================================

-- Index for learning path progress
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_learning_progress_user_topic 
ON learning_path_progress(user_id, topic_id);

-- Index for topic completion tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_learning_progress_completed 
ON learning_path_progress(user_id) WHERE completed = true;

-- ============================================================================
-- Verification & Audit
-- ============================================================================

-- Index for audit logs (recent first)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_time 
ON audit_logs(user_id, created_at DESC);

-- Index for audit logs by action type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action 
ON audit_logs(action);

-- ============================================================================
-- Refresh Tokens (Security)
-- ============================================================================

-- Ensure refresh tokens have proper indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refresh_tokens_user_active 
ON refresh_tokens(user_id) WHERE revoked = false;

-- ============================================================================
-- Partial Indexes for Common Queries
-- ============================================================================

-- Index for active users only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_active_users 
ON profiles(id) WHERE email_verified = true;

-- Index for premium subscribers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_premium 
ON profiles(subscription_tier) WHERE subscription_tier != 'free';

-- Index for recently active users (last 30 days)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_recent 
ON user_activity(created_at DESC) 
WHERE created_at > NOW() - INTERVAL '30 days';

-- ============================================================================
-- Verify Index Creation
-- ============================================================================

-- Query to check all indexes created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Query to check index usage statistics
SELECT
    relname AS table_name,
    indexrelname AS index_name,
    idx_scan AS times_used,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
