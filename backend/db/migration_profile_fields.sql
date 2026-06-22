-- Migration: add editable profile fields used by the profile page

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_summary TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education TEXT;
