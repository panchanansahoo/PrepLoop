-- Migration: Add Scheduled Time and Duration to Admin Question Sets
-- Supports private fixed-question interview sessions scheduled at fixed times.

ALTER TABLE public.admin_question_sets
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_duration_minutes INTEGER DEFAULT 45;

-- Ensure positive schedule duration between 5 and 480 minutes (8 hours)
ALTER TABLE public.admin_question_sets
  DROP CONSTRAINT IF EXISTS admin_question_sets_duration_check;

ALTER TABLE public.admin_question_sets
  ADD CONSTRAINT admin_question_sets_duration_check
  CHECK (
    scheduled_duration_minutes IS NULL OR (scheduled_duration_minutes BETWEEN 5 AND 480)
  );

CREATE INDEX IF NOT EXISTS idx_admin_question_sets_scheduled_at
  ON public.admin_question_sets(scheduled_at)
  WHERE scheduled_at IS NOT NULL;

