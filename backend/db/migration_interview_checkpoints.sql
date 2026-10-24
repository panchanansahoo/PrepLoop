CREATE TABLE IF NOT EXISTS public.interview_session_checkpoints (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_key TEXT NOT NULL,
  payload JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, session_key)
);

CREATE INDEX IF NOT EXISTS idx_interview_checkpoints_updated
  ON public.interview_session_checkpoints(user_id, updated_at DESC);

ALTER TABLE public.interview_session_checkpoints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own interview checkpoints" ON public.interview_session_checkpoints;
CREATE POLICY "Users can manage own interview checkpoints"
  ON public.interview_session_checkpoints
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
