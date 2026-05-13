-- Migration: add custom_url column to profiles for claiming public profile slugs

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS custom_url TEXT DEFAULT '';

-- Add a unique index to ensure no two users can claim the same slug (empty strings allowed)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_custom_url_unique ON profiles ((nullif(custom_url, '')));
