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

CREATE POLICY "Anyone can view public groups"
  ON study_groups FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create groups"
  ON study_groups FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own groups"
  ON study_groups FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Anyone can view group members"
  ON study_group_members FOR SELECT USING (true);

CREATE POLICY "Users can join groups"
  ON study_group_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON study_group_members FOR DELETE USING (auth.uid() = user_id);

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
CREATE TRIGGER trigger_update_member_count
  AFTER INSERT OR DELETE ON study_group_members
  FOR EACH ROW EXECUTE FUNCTION update_group_member_count();
