-- ==============================================================================
-- Migration: Zero-Cost Quota Counters & Deferred Jobs Persistence
-- Description: Persists daily token budget counters, per-user/IP usage, and
--              deferred turn-scoring/report-generation jobs to Supabase Postgres.
-- ==============================================================================

-- 1. Daily Quota Counters Table
CREATE TABLE IF NOT EXISTS public.quota_daily_usage (
    date_key TEXT PRIMARY KEY,
    total_tokens_used BIGINT DEFAULT 0,
    model_tokens JSONB DEFAULT '{}'::jsonb,
    provider_tokens JSONB DEFAULT '{}'::jsonb,
    user_usage JSONB DEFAULT '{}'::jsonb,
    ip_usage JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for fast lookup by date
CREATE INDEX IF NOT EXISTS idx_quota_daily_usage_date ON public.quota_daily_usage(date_key);

-- 2. Deferred Interview Jobs Table
CREATE TABLE IF NOT EXISTS public.deferred_interview_jobs (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'score_turn', 'report_generation'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    session_id TEXT,
    user_id TEXT,
    payload JSONB NOT NULL,
    result JSONB,
    error TEXT,
    attempts INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for deferred queue polling and session lookups
CREATE INDEX IF NOT EXISTS idx_deferred_jobs_status ON public.deferred_interview_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_deferred_jobs_session ON public.deferred_interview_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_deferred_jobs_user ON public.deferred_interview_jobs(user_id);

-- RLS Security: Service role has full access; users can view their own deferred jobs
ALTER TABLE public.quota_daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deferred_interview_jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'quota_daily_usage' AND policyname = 'service_role_quota_all'
    ) THEN
        CREATE POLICY service_role_quota_all ON public.quota_daily_usage
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'deferred_interview_jobs' AND policyname = 'service_role_jobs_all'
    ) THEN
        CREATE POLICY service_role_jobs_all ON public.deferred_interview_jobs
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'deferred_interview_jobs' AND policyname = 'user_read_own_jobs'
    ) THEN
        CREATE POLICY user_read_own_jobs ON public.deferred_interview_jobs
            FOR SELECT TO authenticated USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- 3. Session Pinned Scorers Table (Persists session's assigned AI model across container restarts)
CREATE TABLE IF NOT EXISTS public.session_pinned_scorers (
    session_id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    pinned_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_pinned_scorers_session ON public.session_pinned_scorers(session_id);

ALTER TABLE public.session_pinned_scorers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'session_pinned_scorers' AND policyname = 'service_role_scorers_all'
    ) THEN
        CREATE POLICY service_role_scorers_all ON public.session_pinned_scorers
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 4. Session Row Pinned Scorer Column & Resilience (interview_sessions)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interview_sessions'
    ) THEN
        ALTER TABLE public.interview_sessions ADD COLUMN IF NOT EXISTS pinned_scorer JSONB;
        ALTER TABLE public.interview_sessions ALTER COLUMN user_id DROP NOT NULL;
    END IF;
END $$;


