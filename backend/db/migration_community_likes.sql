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

CREATE POLICY "Anyone can view likes"
  ON community_post_likes FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes"
  ON community_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON community_post_likes FOR DELETE USING (auth.uid() = user_id);


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
