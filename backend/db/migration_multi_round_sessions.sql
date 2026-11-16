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

-- Policy: Users can view and manage their own multi-round sessions
DROP POLICY IF EXISTS "Users can manage own multi round sessions" ON public.multi_round_sessions;
CREATE POLICY "Users can manage own multi round sessions"
  ON public.multi_round_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role has full administrative access
DROP POLICY IF EXISTS "Service role full access on multi round sessions" ON public.multi_round_sessions;
CREATE POLICY "Service role full access on multi round sessions"
  ON public.multi_round_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
