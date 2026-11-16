-- ============================================================================
-- Migration: Security Hotfix Audit Remediation
-- Fixes: CRIT-02, CRIT-03, HIGH-01, HIGH-12, HIGH-13
-- Safe and idempotent: can be executed repeatedly on existing databases.
-- ============================================================================

-- ============================================================================
-- 1. CRIT-02: Protect profiles table against unauthorized privilege escalation
-- ============================================================================

-- 1a. Revoke column-level updates on sensitive fields from client roles
REVOKE UPDATE (role, coins, email_verified) ON public.profiles FROM authenticated, anon, PUBLIC;

-- 1b. Trigger to strictly enforce that role, coins, and email_verified can only be updated by service_role/backend
CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if called from client contexts (anon or authenticated role)
  IF (current_user IN ('anon', 'authenticated') OR (auth.jwt() IS NOT NULL AND auth.role() = 'authenticated')) THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Security violation: Users cannot modify their own role.';
    END IF;
    IF NEW.coins IS DISTINCT FROM OLD.coins THEN
      RAISE EXCEPTION 'Security violation: Users cannot directly modify their coins balance.';
    END IF;
    IF NEW.email_verified IS DISTINCT FROM OLD.email_verified THEN
      RAISE EXCEPTION 'Security violation: Users cannot directly modify their email verification status.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_sensitive_profile_columns ON public.profiles;
CREATE TRIGGER trg_protect_sensitive_profile_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_sensitive_profile_columns();

-- 1c. Recreate user update policy with explicit defensive WITH CHECK
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );


-- ============================================================================
-- 2. CRIT-03: Revoke public execution of coin_apply_transaction (Infinite Currency)
-- ============================================================================

-- Revoke all execute privileges from PUBLIC, anon, and authenticated
REVOKE ALL ON FUNCTION public.coin_apply_transaction(UUID, INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.coin_apply_transaction(UUID, INTEGER, TEXT, TEXT, TEXT) TO service_role;

-- Handle 4-parameter overload if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'coin_apply_transaction'
      AND pronargs = 4
  ) THEN
    REVOKE ALL ON FUNCTION public.coin_apply_transaction(UUID, INTEGER, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.coin_apply_transaction(UUID, INTEGER, TEXT, TEXT) TO service_role;
  END IF;
END $$;


-- ============================================================================
-- 3. HIGH-01: Fix admin_interview_attempts RLS to remove insecure user_id IS NULL client access
-- ============================================================================

DROP POLICY IF EXISTS "Participants manage own interview attempts" ON public.admin_interview_attempts;
DROP POLICY IF EXISTS "Admins view attempts for their question sets" ON public.admin_interview_attempts;

-- Authenticated candidates can only access their own attempts where user_id matches auth.uid()
CREATE POLICY "Candidates manage own interview attempts"
  ON public.admin_interview_attempts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND user_id IS NOT NULL)
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Admins can view attempts for question sets they own
CREATE POLICY "Admins view attempts for their question sets"
  ON public.admin_interview_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_question_sets qs
      WHERE qs.id = question_set_id
        AND qs.admin_id = auth.uid()
    )
  );


-- ============================================================================
-- 4. HIGH-12: Enable RLS on four core interview tables with user ownership policies
-- ============================================================================

-- 4a. interview_notes
ALTER TABLE public.interview_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own interview notes" ON public.interview_notes;
CREATE POLICY "Users can manage own interview notes"
  ON public.interview_notes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4b. learning_recommendations
ALTER TABLE public.learning_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own learning recommendations" ON public.learning_recommendations;
CREATE POLICY "Users can view own learning recommendations"
  ON public.learning_recommendations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own learning recommendations" ON public.learning_recommendations;
CREATE POLICY "Users can update own learning recommendations"
  ON public.learning_recommendations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4c. interview_analytics
ALTER TABLE public.interview_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own interview analytics" ON public.interview_analytics;
CREATE POLICY "Users can view own interview analytics"
  ON public.interview_analytics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4d. feedback_history
ALTER TABLE public.feedback_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own feedback history" ON public.feedback_history;
CREATE POLICY "Users can view own feedback history"
  ON public.feedback_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4e. Ensure user_interview_stats view runs with security_invoker = true
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'user_interview_stats' AND schemaname = 'public') THEN
    ALTER VIEW public.user_interview_stats SET (security_invoker = true);
    REVOKE ALL ON public.user_interview_stats FROM anon;
    GRANT SELECT ON public.user_interview_stats TO authenticated;
  END IF;
END $$;


-- ============================================================================
-- 5. HIGH-13: Fix weekly_contest_submissions and quiz_attempts RLS (Score Forgery Protection)
-- ============================================================================

-- 5a. Drop direct client INSERT policies on weekly_contest_submissions
DROP POLICY IF EXISTS weekly_contest_submissions_write_policy ON public.weekly_contest_submissions;

-- Maintain SELECT access for leaderboard viewing
DROP POLICY IF EXISTS weekly_contest_submissions_read_policy ON public.weekly_contest_submissions;
CREATE POLICY weekly_contest_submissions_read_policy
  ON public.weekly_contest_submissions
  FOR SELECT
  TO authenticated
  USING (true);

-- 5b. Drop direct client INSERT on quiz_attempts
DROP POLICY IF EXISTS "Users can insert own quiz attempts" ON public.quiz_attempts;

-- Ensure users can only view their own quiz attempts
DROP POLICY IF EXISTS "Users can view own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Users can view own quiz attempts"
  ON public.quiz_attempts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 5c. Prevent pre-contest problem leakage by hiding problems before contest start
DROP POLICY IF EXISTS weekly_contests_read_policy ON public.weekly_contests;
CREATE POLICY weekly_contests_read_policy
  ON public.weekly_contests
  FOR SELECT
  TO authenticated, anon
  USING (starts_at <= NOW());
