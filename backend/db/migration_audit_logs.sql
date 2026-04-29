-- Audit Logs Table
-- Stores security-relevant user actions for compliance and forensic analysis.
-- Non-blocking writes from the auditLogger middleware.

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index: query by user + action (most common admin query)
CREATE INDEX IF NOT EXISTS idx_audit_user_action
  ON audit_logs(user_id, action, created_at DESC);

-- Index: query by resource type
CREATE INDEX IF NOT EXISTS idx_audit_resource
  ON audit_logs(resource, resource_id, created_at DESC);

-- Index: query by date range (compliance reports)
CREATE INDEX IF NOT EXISTS idx_audit_created_at
  ON audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: only admins can read audit logs
CREATE POLICY audit_logs_admin_read ON audit_logs
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Policy: service role can insert (backend writes via service key)
CREATE POLICY audit_logs_service_insert ON audit_logs
  FOR INSERT
  WITH CHECK (true);
