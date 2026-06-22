-- Migration: Add fields to profiles for intelligent job matching
-- Description: Adds skills, experience_summary, preferred_role, and preferred_location to the profiles table.

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS skills TEXT,
ADD COLUMN IF NOT EXISTS experience_summary TEXT,
ADD COLUMN IF NOT EXISTS preferred_role TEXT,
ADD COLUMN IF NOT EXISTS preferred_location TEXT;
