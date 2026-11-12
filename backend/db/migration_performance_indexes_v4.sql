-- Migration: Performance query indexes v4 for feed & employer pipeline queries
-- Safe to run multiple times (idempotent and resilient across schema versions)

-- 1. Employer talent pipeline & feed ordering by completed_at DESC
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'mock_interviews' AND column_name = 'completed_at'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_mock_interviews_completed_at
          ON public.mock_interviews(completed_at DESC NULLS LAST);
    END IF;
END $$;

-- 2. Employer filtering by overall_score DESC and completed_at DESC
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'mock_interviews' AND column_name = 'overall_score'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'mock_interviews' AND column_name = 'completed_at'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_mock_interviews_score_completed
          ON public.mock_interviews(overall_score DESC, completed_at DESC)
          WHERE completed_at IS NOT NULL;
    END IF;
END $$;

-- 3. Submissions activity feed & status filtering
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'submissions' AND column_name = 'submitted_at'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_submissions_user_submitted
          ON public.submissions(user_id, submitted_at DESC);
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'submissions' AND column_name = 'status'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'submissions' AND column_name = 'submitted_at'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_submissions_status_submitted
          ON public.submissions(status, submitted_at DESC);
    END IF;
END $$;

-- 4. User progress active date & streak computation
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'user_progress' AND column_name = 'last_attempted_at'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_user_progress_active_date
          ON public.user_progress(user_id, last_attempted_at DESC);
    END IF;
END $$;

