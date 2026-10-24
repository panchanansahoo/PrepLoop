CREATE TABLE IF NOT EXISTS public.interview_submission_keys (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  resource_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_interview_submission_keys_created
  ON public.interview_submission_keys(created_at);

ALTER TABLE public.interview_submission_keys ENABLE ROW LEVEL SECURITY;
