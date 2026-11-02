-- Migration: Invitee Email Allowlist for Private Fixed Interviews
-- Allows admins to restrict unlisted interview links to a specific list of invited emails.

ALTER TABLE public.admin_question_sets
  ADD COLUMN IF NOT EXISTS allowed_emails JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.admin_question_sets
  DROP CONSTRAINT IF EXISTS admin_question_sets_allowed_emails_array;

ALTER TABLE public.admin_question_sets
  ADD CONSTRAINT admin_question_sets_allowed_emails_array
  CHECK (jsonb_typeof(allowed_emails) = 'array');

-- Function to check if a candidate's email is allowed to access an unlisted interview
CREATE OR REPLACE FUNCTION public.is_invitee_email_allowed(p_share_code TEXT, p_candidate_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allowed_emails JSONB;
BEGIN
  SELECT allowed_emails INTO v_allowed_emails
  FROM public.admin_question_sets
  WHERE share_code = p_share_code
    AND is_active = TRUE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Empty allowlist means anyone with the unlisted link can join
  IF v_allowed_emails IS NULL OR jsonb_array_length(v_allowed_emails) = 0 THEN
    RETURN TRUE;
  END IF;

  IF p_candidate_email IS NULL OR TRIM(p_candidate_email) = '' THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(v_allowed_emails) AS email_item
    WHERE LOWER(TRIM(email_item)) = LOWER(TRIM(p_candidate_email))
  );
END;
$$;
