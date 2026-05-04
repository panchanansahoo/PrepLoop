-- Phase 5.3: Leaderboards & Achievements
-- Tables: achievements, leaderboards, user_streaks, achievement_definitions
-- Date: 2026-05-03

BEGIN;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: achievement_definitions (Catalog of all possible badges)
CREATE TABLE achievement_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('badge', 'milestone', 'challenge')),
  unlock_condition JSONB NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: achievements (User's unlocked badges)
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_name TEXT NOT NULL REFERENCES achievement_definitions(badge_name),
  problem_id UUID REFERENCES dsa_problems(id) ON DELETE SET NULL,
  achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  progress JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, badge_name, problem_id)
);

-- Table 3: user_streaks (Activity streaks tracking)
CREATE TABLE user_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_days INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  streak_start DATE,
  last_activity_date DATE,
  is_active BOOLEAN DEFAULT true,
  points INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 4: leaderboards (Ranking entries)
CREATE TABLE leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('global', 'topic', 'problem', 'weekly', 'streak')),
  topic_id UUID REFERENCES dsa_topics(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES dsa_problems(id) ON DELETE CASCADE,
  rank INTEGER,
  score INTEGER NOT NULL DEFAULT 0,
  solutions_count INTEGER DEFAULT 0,
  avg_score DECIMAL(5,2) DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  week_start_date DATE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, scope, topic_id, problem_id, week_start_date)
);

-- Indexes for query performance
CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE INDEX idx_achievements_badge_name ON achievements(badge_name);
CREATE INDEX idx_achievements_achieved_at ON achievements(achieved_at DESC);
CREATE INDEX idx_achievements_problem_id ON achievements(problem_id);

CREATE INDEX idx_leaderboards_scope ON leaderboards(scope);
CREATE INDEX idx_leaderboards_user_id ON leaderboards(user_id);
CREATE INDEX idx_leaderboards_score ON leaderboards(score DESC);
CREATE INDEX idx_leaderboards_rank ON leaderboards(rank);
CREATE INDEX idx_leaderboards_topic_id ON leaderboards(topic_id);
CREATE INDEX idx_leaderboards_problem_id ON leaderboards(problem_id);
CREATE INDEX idx_leaderboards_week ON leaderboards(scope, week_start_date);
CREATE INDEX idx_leaderboards_updated ON leaderboards(updated_at DESC);

CREATE INDEX idx_user_streaks_streak_days ON user_streaks(streak_days DESC);
CREATE INDEX idx_user_streaks_longest_streak ON user_streaks(longest_streak DESC);
CREATE INDEX idx_user_streaks_is_active ON user_streaks(is_active);

CREATE INDEX idx_achievement_definitions_category ON achievement_definitions(category);
CREATE INDEX idx_achievement_definitions_rarity ON achievement_definitions(rarity);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements
CREATE POLICY achievements_users_can_view_own
  ON achievements FOR SELECT
  USING (auth.uid() = user_id OR true);  -- Public read for leaderboard display

CREATE POLICY achievements_users_can_insert_own
  ON achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY achievements_users_can_update_own
  ON achievements FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for leaderboards (Public read, service-only write)
CREATE POLICY leaderboards_public_read
  ON leaderboards FOR SELECT
  USING (true);

CREATE POLICY leaderboards_service_write
  ON leaderboards FOR INSERT
  WITH CHECK (true);

CREATE POLICY leaderboards_service_update
  ON leaderboards FOR UPDATE
  USING (true);

-- RLS Policies for user_streaks
CREATE POLICY user_streaks_users_view_own
  ON user_streaks FOR SELECT
  USING (auth.uid() = user_id OR true);

CREATE POLICY user_streaks_users_update_own
  ON user_streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for achievement_definitions (Public read)
CREATE POLICY achievement_definitions_public_read
  ON achievement_definitions FOR SELECT
  USING (true);

-- Seed achievement definitions (common badges)
INSERT INTO achievement_definitions (badge_name, description, category, unlock_condition, points, rarity) VALUES
  ('first_solve', 'Solve your first DSA problem', 'badge', '{"type": "first_solution"}', 5, 'common'),
  ('perfect_solve', 'Solve a problem with 100% test pass rate', 'badge', '{"type": "perfect_score", "minScore": 100}', 20, 'rare'),
  ('easy_master', 'Solve 25 easy-level problems', 'milestone', '{"type": "problem_count", "difficulty": "easy", "count": 25}', 30, 'common'),
  ('medium_master', 'Solve 25 medium-level problems', 'milestone', '{"type": "problem_count", "difficulty": "medium", "count": 25}', 75, 'rare'),
  ('hard_master', 'Solve 10 hard-level problems', 'milestone', '{"type": "problem_count", "difficulty": "hard", "count": 10}', 150, 'epic'),
  ('streak_7', 'Maintain a 7-day solving streak', 'challenge', '{"type": "streak_days", "days": 7}', 50, 'rare'),
  ('streak_30', 'Maintain a 30-day solving streak', 'challenge', '{"type": "streak_days", "days": 30}', 200, 'epic'),
  ('streak_100', 'Maintain a 100-day solving streak', 'challenge', '{"type": "streak_days", "days": 100}', 500, 'legendary'),
  ('speed_runner', 'Solve 5 problems in a single day', 'badge', '{"type": "daily_solve_count", "count": 5}', 40, 'rare'),
  ('blitz_master', 'Solve a problem in under 5 minutes', 'badge', '{"type": "solve_time", "maxSeconds": 300}', 25, 'common'),
  ('problems_10', 'Solve 10 DSA problems', 'milestone', '{"type": "total_solutions", "count": 10}', 25, 'common'),
  ('problems_50', 'Solve 50 DSA problems', 'milestone', '{"type": "total_solutions", "count": 50}', 75, 'rare'),
  ('problems_100', 'Solve 100 DSA problems', 'milestone', '{"type": "total_solutions", "count": 100}', 150, 'epic'),
  ('problems_250', 'Solve 250 DSA problems', 'milestone', '{"type": "total_solutions", "count": 250}', 300, 'legendary'),
  ('polymath', 'Solve problems across 10+ different topics', 'badge', '{"type": "topic_diversity", "minTopics": 10}', 150, 'epic'),
  ('knowledge_sharer', 'Publish 10 solutions to the community', 'badge', '{"type": "shared_solutions", "count": 10}', 50, 'rare'),
  ('helpful_reviewer', 'Earn 50+ mentor reviews with avg rating > 4.0', 'badge', '{"type": "mentor_rating", "reviewCount": 50, "minAvgRating": 4.0}', 80, 'epic'),
  ('mentor', 'Rate 100+ mentor reviews', 'badge', '{"type": "review_count", "count": 100}', 100, 'epic');

COMMIT;
