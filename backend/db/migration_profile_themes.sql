-- Persist the visual theme selected for a user's public profile.
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_theme TEXT NOT NULL DEFAULT 'aurora';

ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_profile_theme_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_profile_theme_check
CHECK (profile_theme IN ('aurora', 'midnight', 'sunrise'));
