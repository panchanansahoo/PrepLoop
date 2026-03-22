-- Migration: Add role column to profiles table
-- Run this against your Supabase database

-- 1. Add role column with default 'user'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- 2. Index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 3. Update the handle_new_user trigger to include role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Admin RLS policies (admins can see and manage all profiles)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT
      USING (
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update all profiles'
  ) THEN
    CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE
      USING (
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      );
  END IF;
END $$;

-- Admin policies for other tables
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all submissions'
  ) THEN
    CREATE POLICY "Admins can view all submissions" ON submissions FOR SELECT
      USING (
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all interviews'
  ) THEN
    CREATE POLICY "Admins can view all interviews" ON mock_interviews FOR SELECT
      USING (
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete community posts'
  ) THEN
    CREATE POLICY "Admins can delete community posts" ON community_posts FOR DELETE
      USING (
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete community replies'
  ) THEN
    CREATE POLICY "Admins can delete community replies" ON community_replies FOR DELETE
      USING (
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      );
  END IF;
END $$;
