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

CREATE POLICY "Users can view own bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookmarks" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookmarks" ON bookmarks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════
-- 6. Add RLS policies to user_activity table
-- ═══════════════════════════════════════════════
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity" ON user_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity" ON user_activity FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activity" ON user_activity FOR UPDATE USING (auth.uid() = user_id);
