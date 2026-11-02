-- Strengthen unlisted interview links and freeze question order per attempt.
-- Apply through the normal Supabase migration process before deploying the code.

ALTER TABLE public.admin_question_sets
  ALTER COLUMN share_code TYPE VARCHAR(64);

ALTER TABLE public.admin_interview_attempts
  ADD COLUMN IF NOT EXISTS question_snapshot JSONB;

UPDATE public.admin_interview_attempts AS attempt
SET question_snapshot = question_set.questions
FROM public.admin_question_sets AS question_set
WHERE attempt.question_set_id = question_set.id
  AND attempt.question_snapshot IS NULL;

ALTER TABLE public.admin_interview_attempts
  ALTER COLUMN question_snapshot SET DEFAULT '[]'::jsonb,
  ALTER COLUMN question_snapshot SET NOT NULL;

ALTER TABLE public.admin_interview_attempts
  DROP CONSTRAINT IF EXISTS admin_interview_attempts_question_snapshot_array;

ALTER TABLE public.admin_interview_attempts
  ADD CONSTRAINT admin_interview_attempts_question_snapshot_array
  CHECK (jsonb_typeof(question_snapshot) = 'array');

ALTER TABLE public.admin_question_sets
  ADD COLUMN IF NOT EXISTS passcode_hash TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS max_attempts INTEGER,
  ADD COLUMN IF NOT EXISTS attempts_started INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.admin_question_sets
  DROP CONSTRAINT IF EXISTS admin_question_sets_attempt_limits;

ALTER TABLE public.admin_question_sets
  ADD CONSTRAINT admin_question_sets_attempt_limits
  CHECK (
    (max_attempts IS NULL OR max_attempts BETWEEN 1 AND 5000)
    AND attempts_started >= 0
  );

UPDATE public.admin_question_sets AS question_set
SET attempts_started = GREATEST(
  question_set.attempts_started,
  COALESCE((
    SELECT COUNT(*)::INTEGER
    FROM public.admin_interview_attempts AS attempt
    WHERE attempt.question_set_id = question_set.id
  ), 0)
);

-- Atomically reserve a link attempt so concurrent starts cannot exceed its cap.
CREATE OR REPLACE FUNCTION public.claim_admin_interview_attempt(p_share_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed BOOLEAN := FALSE;
BEGIN
  UPDATE public.admin_question_sets
  SET attempts_started = attempts_started + 1,
      updated_at = NOW()
  WHERE share_code = p_share_code
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_attempts IS NULL OR attempts_started < max_attempts)
  RETURNING TRUE INTO claimed;

  RETURN COALESCE(claimed, FALSE);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_admin_interview_attempt(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_admin_interview_attempt(TEXT) TO service_role;
