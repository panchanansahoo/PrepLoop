-- Migration: Fix RLS Infinite Recursion on Profiles Table
-- Problem: Self-referential RLS policies cause infinite recursion
-- Solution: Disable RLS on profiles since all backend operations use service role key

-- 1. Disable RLS on profiles table
-- Since all backend operations use supabaseAdmin (service role key),
-- RLS is not needed and the self-referential policies cause recursion
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop problematic self-referential policies to clean up
-- These policies query profiles from within profiles RLS evaluation
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- 3. Verification: Confirm RLS is disabled
-- After running this migration, the following should show 0 policies on profiles:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'profiles';

-- 4. Note: If frontend needs direct profile access in future, consider:
-- - Creating a read-only view with simple conditions (not self-referential)
-- - Routing all profile updates through backend API (recommended)
-- - Using database functions with SECURITY DEFINER to handle RLS logic
