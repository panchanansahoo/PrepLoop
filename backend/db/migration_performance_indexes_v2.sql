-- Performance Indexes V2
-- Comprehensive indexing based on route and query analysis
-- All indexes use CONCURRENTLY to avoid locking tables during creation

-- ============================================================
-- Interview History — heavily queried by user.js, interview.js
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_history_user_created
  ON interview_history(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_history_user_type
  ON interview_history(user_id, interview_type);

-- ============================================================
-- User Activity — queried by activity.js, dashboard analytics
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_user_date
  ON user_activity(user_id, activity_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_type_date
  ON user_activity(activity_type, activity_date DESC);

-- ============================================================
-- Blog Posts — queried by blog.js (public listing, slug lookup)
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_published_date
  ON blog_posts(is_published, created_at DESC)
  WHERE is_published = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_slug
  ON blog_posts(slug) WHERE slug IS NOT NULL;

-- ============================================================
-- Coin Transactions — queried by coins.js, wallet operations
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coin_transactions_user_date
  ON coin_transactions(user_id, created_at DESC);

-- ============================================================
-- Improvement Plans — queried by improvement-plan.js
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_improvement_plans_user_active
  ON improvement_plans(user_id, is_active)
  WHERE is_active = true;

-- ============================================================
-- Community Posts — queried by community.js
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_community_posts_date
  ON community_posts(created_at DESC);

-- ============================================================
-- Profiles — frequently joined and filtered
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email
  ON profiles(email);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role
  ON profiles(role) WHERE role != 'user';

-- ============================================================
-- Notes — queried by notes.js
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_user_updated
  ON notes(user_id, updated_at DESC);

-- ============================================================
-- Study Groups — queried by study-groups.js
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_groups_active
  ON study_groups(is_active, created_at DESC)
  WHERE is_active = true;
