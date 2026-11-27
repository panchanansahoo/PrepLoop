BEGIN;

ALTER TABLE public.mock_interviews
  ADD COLUMN IF NOT EXISTS source_interview_session_id uuid
  REFERENCES public.interview_sessions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_mock_interviews_source_session
  ON public.mock_interviews(source_interview_session_id)
  WHERE source_interview_session_id IS NOT NULL;

-- Connect historical mirrors only when both sides have one matching row.
WITH candidates AS (
  SELECT m.id AS mirror_id, s.id AS session_id,
    count(*) OVER (PARTITION BY m.id) AS sessions_per_mirror,
    count(*) OVER (PARTITION BY s.id) AS mirrors_per_session
  FROM public.mock_interviews m
  JOIN public.interview_sessions s ON s.user_id = m.user_id
    AND s.interview_type = m.interview_type
    AND s.completed_at = m.completed_at
    AND s.interview_score = m.overall_score
    AND s.company_focus = m.company
    AND s.performance_metrics->>'role' = m.role
  WHERE m.source_interview_session_id IS NULL
    AND s.performance_metrics ? 'sessionType'
)
UPDATE public.mock_interviews m
SET source_interview_session_id = c.session_id
FROM candidates c
WHERE m.id = c.mirror_id AND c.sessions_per_mirror = 1 AND c.mirrors_per_session = 1;

COMMIT;
