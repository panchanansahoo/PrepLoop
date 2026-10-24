CREATE TABLE IF NOT EXISTS public.usage_quota_windows (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, category, window_started_at)
);

CREATE INDEX IF NOT EXISTS idx_usage_quota_windows_lookup
  ON public.usage_quota_windows(user_id, category, window_started_at DESC);

ALTER TABLE public.usage_quota_windows ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_usage_quota(
  user_id_input UUID,
  category_input TEXT,
  window_started_at_input TIMESTAMPTZ,
  limit_input INTEGER
)
RETURNS TABLE(allowed BOOLEAN, request_count INTEGER, remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usage_quota_windows (user_id, category, window_started_at, request_count)
  VALUES (user_id_input, category_input, window_started_at_input, 1)
  ON CONFLICT (user_id, category, window_started_at)
  DO UPDATE SET request_count = usage_quota_windows.request_count + 1
  WHERE usage_quota_windows.request_count < limit_input;

  RETURN QUERY
  SELECT
    q.request_count <= limit_input,
    q.request_count,
    GREATEST(0, limit_input - q.request_count)
  FROM public.usage_quota_windows q
  WHERE q.user_id = user_id_input
    AND q.category = category_input
    AND q.window_started_at = window_started_at_input;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_usage_quota(UUID, TEXT, TIMESTAMPTZ, INTEGER)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.consume_usage_quota(UUID, TEXT, TIMESTAMPTZ, INTEGER)
  TO service_role;
