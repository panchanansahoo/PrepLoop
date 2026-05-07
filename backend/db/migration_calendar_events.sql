-- Migration: User Calendar Events
-- Adds calendar event tracking for interview prep scheduling and contest reminders

-- Create user_calendar_events table
CREATE TABLE IF NOT EXISTS user_calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  tag VARCHAR(100) DEFAULT 'general' CHECK (tag IN ('contest', 'interview', 'deadline', 'reminder', 'general')),
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_event_date CHECK (event_date >= CURRENT_DATE - INTERVAL '1 year')
);

-- Enable Row Level Security
ALTER TABLE user_calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own events
CREATE POLICY "Users see own calendar events" ON user_calendar_events FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own events
CREATE POLICY "Users can create own calendar events" ON user_calendar_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own events
CREATE POLICY "Users can update own calendar events" ON user_calendar_events FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own events
CREATE POLICY "Users can delete own calendar events" ON user_calendar_events FOR DELETE
  USING (auth.uid() = user_id);

-- Index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_calendar_user_date ON user_calendar_events(user_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_user_tag ON user_calendar_events(user_id, tag);
CREATE INDEX IF NOT EXISTS idx_calendar_completion ON user_calendar_events(user_id, is_completed);
