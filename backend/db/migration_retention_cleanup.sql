CREATE OR REPLACE FUNCTION public.cleanup_interview_retention(
  checkpoint_retention INTERVAL DEFAULT INTERVAL '30 days',
  idempotency_retention INTERVAL DEFAULT INTERVAL '90 days'
)
RETURNS TABLE(checkpoints_deleted BIGINT, idempotency_keys_deleted BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_checkpoints BIGINT;
  deleted_keys BIGINT;
BEGIN
  DELETE FROM public.interview_session_checkpoints
  WHERE updated_at < NOW() - checkpoint_retention;
  GET DIAGNOSTICS deleted_checkpoints = ROW_COUNT;

  DELETE FROM public.interview_submission_keys
  WHERE created_at < NOW() - idempotency_retention;
  GET DIAGNOSTICS deleted_keys = ROW_COUNT;

  RETURN QUERY SELECT deleted_checkpoints, deleted_keys;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_interview_retention(INTERVAL, INTERVAL)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_interview_retention(INTERVAL, INTERVAL)
  TO service_role;
