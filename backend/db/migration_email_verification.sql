-- Migration: Add email verification fields to profiles
-- Description: Adds fields to support email verification on signup

-- Add email verification columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster token lookup during verification
CREATE INDEX IF NOT EXISTS idx_profiles_verification_token ON profiles(verification_token);

-- Create index for email_verified status
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(email_verified);
