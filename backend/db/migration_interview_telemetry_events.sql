-- Migration: interview_telemetry_events
-- Supports asynchronous flush of telemetry snapshots and turn events at interview completion

CREATE TABLE IF NOT EXISTS public.interview_telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_telemetry_events_session_id
  ON public.interview_telemetry_events(session_id);

CREATE INDEX IF NOT EXISTS idx_interview_telemetry_events_created_at
  ON public.interview_telemetry_events(created_at DESC);

ALTER TABLE public.interview_telemetry_events ENABLE ROW LEVEL SECURITY;

-- Admins can query telemetry events for platform metrics dashboard
DROP POLICY IF EXISTS "Admins can view interview telemetry events" ON public.interview_telemetry_events;
CREATE POLICY "Admins can view interview telemetry events"
  ON public.interview_telemetry_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

