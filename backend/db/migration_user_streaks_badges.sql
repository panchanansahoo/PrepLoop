-- Migration: User Daily Streaks & Gamification Badges
-- Keeps daily engagement loops active with streaks, freezes, and unlockable achievement badges

CREATE TABLE IF NOT EXISTS public.user_streaks (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_active_date DATE,
    streak_freeze_count INT DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_code VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_code)
);

CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON public.user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);

