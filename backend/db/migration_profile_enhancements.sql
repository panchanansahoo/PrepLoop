-- Migration to enhance profile table with additional fields
-- This adds new columns to the profiles table to support enhanced profile functionality

-- Add phone number column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT CHECK (char_length(phone) <= 20) DEFAULT '';

-- Add location column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS location TEXT CHECK (char_length(location) <= 100) DEFAULT '';

-- Add website column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS website TEXT CHECK (char_length(website) <= 200) DEFAULT '';

-- Add company column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS company TEXT CHECK (char_length(company) <= 100) DEFAULT '';

-- Add years_of_experience column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS years_of_experience TEXT CHECK (char_length(years_of_experience) <= 20) DEFAULT '';

-- Add specialization column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS specialization TEXT CHECK (char_length(specialization) <= 100) DEFAULT '';

-- Add social links as JSONB column to store various social profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Add individual social profile columns (kept for backward compatibility if needed)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS twitter TEXT CHECK (char_length(twitter) <= 50) DEFAULT '';

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS linkedin TEXT CHECK (char_length(linkedin) <= 50) DEFAULT '';

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS portfolio TEXT CHECK (char_length(portfolio) <= 200) DEFAULT '';

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS dribbble TEXT CHECK (char_length(dribbble) <= 50) DEFAULT '';

-- Add updated_at column for tracking profile updates
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update the RLS policies to allow users to update their own profiles
-- (assuming RLS is enabled)

-- Add indexes for better performance on commonly searched fields
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING gin(to_tsvector('english', location));
CREATE INDEX IF NOT EXISTS idx_profiles_specialization ON profiles USING gin(to_tsvector('english', specialization));
CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles USING gin(to_tsvector('english', company));
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles (updated_at);

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();