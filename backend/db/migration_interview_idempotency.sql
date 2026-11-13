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

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'interview_submission_keys' AND policyname = 'Users can manage own interview submission keys'
  ) THEN
    CREATE POLICY "Users can manage own interview submission keys"
      ON public.interview_submission_keys
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
