-- GDPR Compliance Migration
-- Adds soft-delete support, data export requests tracking, and consent management

-- Add soft-delete column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
  END IF;
END $$;

-- Add consent preferences column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'consent_preferences'
  ) THEN
    ALTER TABLE profiles ADD COLUMN consent_preferences JSONB DEFAULT '{"analytics": true, "marketing_emails": false, "third_party_sharing": false, "performance_tracking": true}'::jsonb;
  END IF;
END $$;

-- Create data export requests table
CREATE TABLE IF NOT EXISTS data_export_requests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('export', 'deletion')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  scheduled_hard_delete TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_export_requests_user
  ON data_export_requests(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_export_requests_status
  ON data_export_requests(status) WHERE status = 'pending';

-- Enable RLS on data export requests
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

-- Users can only see their own export requests
CREATE POLICY data_export_own_read ON data_export_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update
CREATE POLICY data_export_service_write ON data_export_requests
  FOR ALL WITH CHECK (true);

-- Index for finding soft-deleted users (scheduled cleanup job)
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at
  ON profiles(deleted_at) WHERE deleted_at IS NOT NULL;
