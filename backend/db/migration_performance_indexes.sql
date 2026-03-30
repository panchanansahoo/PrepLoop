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
