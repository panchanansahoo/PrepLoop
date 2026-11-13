-- Migration: user_todos and user_calendar_events
-- Supports ProductivityService (backend/services/productivityService.ts) and DashboardService

CREATE TABLE IF NOT EXISTS public.user_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  priority TEXT NOT NULL DEFAULT 'medium',
  category TEXT NOT NULL DEFAULT 'Study',
  due_date TEXT DEFAULT NULL,
  subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_todos_user_created
  ON public.user_todos (user_id, created_at ASC);

ALTER TABLE public.user_todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_todos_owner_policy ON public.user_todos;
CREATE POLICY user_todos_owner_policy
  ON public.user_todos
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_time TEXT DEFAULT NULL,
  tag TEXT NOT NULL DEFAULT 'study',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_calendar_events_user_date
  ON public.user_calendar_events (user_id, event_date ASC);

ALTER TABLE public.user_calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_calendar_events_owner_policy ON public.user_calendar_events;
CREATE POLICY user_calendar_events_owner_policy
  ON public.user_calendar_events
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
