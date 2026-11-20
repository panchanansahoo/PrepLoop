-- Migration: Multi-Round Database Sessions & Bar-Raiser Veto Support
-- Table to store multi-round interview sessions, checkpoints, per-round scores, and hiring committee veto decisions

CREATE TABLE IF NOT EXISTS public.multi_round_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  current_round INT NOT NULL DEFAULT 0,
  round_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  hiring_decision JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_multi_round_sessions_user_id
  ON public.multi_round_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_multi_round_sessions_status
  ON public.multi_round_sessions(status);

CREATE INDEX IF NOT EXISTS idx_multi_round_sessions_company_role
  ON public.multi_round_sessions(company, role);

CREATE INDEX IF NOT EXISTS idx_multi_round_sessions_updated_at
  ON public.multi_round_sessions(updated_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.multi_round_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own multi-round sessions
DROP POLICY IF EXISTS "Users can manage own multi round sessions" ON public.multi_round_sessions;
DROP POLICY IF EXISTS "Users can view own multi round sessions" ON public.multi_round_sessions;
CREATE POLICY "Users can view own multi round sessions"
  ON public.multi_round_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own active multi round sessions" ON public.multi_round_sessions;
CREATE POLICY "Users can update own active multi round sessions"
  ON public.multi_round_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger: strictly prevent client-side forgery of round_scores and hiring_decision
CREATE OR REPLACE FUNCTION public.protect_multi_round_session_scores()
RETURNS TRIGGER AS $$
BEGIN
  IF (current_user IN ('anon', 'authenticated') OR (auth.jwt() IS NOT NULL AND auth.role() = 'authenticated')) THEN
    IF TG_OP = 'INSERT' THEN
      IF (NEW.round_scores IS NOT NULL AND jsonb_array_length(NEW.round_scores) > 0)
         OR NEW.hiring_decision IS NOT NULL THEN
        RAISE EXCEPTION 'Security violation: Initial round scores and hiring decision must be evaluated server-side.';
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.round_scores IS DISTINCT FROM OLD.round_scores THEN
        RAISE EXCEPTION 'Security violation: Candidates cannot modify multi-round session scores.';
      END IF;
      IF NEW.hiring_decision IS DISTINCT FROM OLD.hiring_decision THEN
        RAISE EXCEPTION 'Security violation: Candidates cannot modify hiring decisions.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_multi_round_session_scores ON public.multi_round_sessions;
CREATE TRIGGER trg_protect_multi_round_session_scores
  BEFORE INSERT OR UPDATE ON public.multi_round_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_multi_round_session_scores();

-- Policy: Service role has full administrative access
DROP POLICY IF EXISTS "Service role full access on multi round sessions" ON public.multi_round_sessions;
CREATE POLICY "Service role full access on multi round sessions"
  ON public.multi_round_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
