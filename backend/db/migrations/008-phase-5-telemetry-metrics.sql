-- Phase 5 Task 1: Improvement Plan Metrics Table
-- Track performance metrics for improvement plan generation and operations

-- Create metrics table
CREATE TABLE IF NOT EXISTS improvement_plan_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES improvement_plans(id) ON DELETE CASCADE,
  metric_type VARCHAR(50) NOT NULL,  -- plan_generation, cache_operation, ai_call, lazy_analysis, user_engagement, error
  
  -- Common fields
  duration_ms INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Plan generation specific
  cache_hit BOOLEAN,
  stage VARCHAR(50),
  analysis_areas INTEGER,
  ai_calls INTEGER,
  ai_fallbacks INTEGER,
  areas_analyzed INTEGER,
  lazy_mode BOOLEAN,
  
  -- Cache operation specific
  operation VARCHAR(20),  -- get, set, delete, invalidate
  cache_type VARCHAR(20),  -- redis, memory, disk
  key_pattern TEXT,
  ttl_seconds INTEGER,
  size_bytes INTEGER,
  
  -- AI call specific
  ai_provider VARCHAR(50),
  ai_operation VARCHAR(50),  -- recommendation, analysis, summary
  tokens_used INTEGER,
  fallback_used BOOLEAN,
  success BOOLEAN,
  error_type VARCHAR(100),
  
  -- Lazy analysis specific
  lazy_analyzed INTEGER,
  lazy_skipped INTEGER,
  time_saved_ms INTEGER,
  accuracy_impact_percent NUMERIC(5,2),
  
  -- User engagement specific
  action VARCHAR(50),  -- view, expand, mark_complete, download, share
  element VARCHAR(100),
  time_on_page_ms INTEGER,
  scroll_depth_percent INTEGER,
  
  -- Error tracking
  error_message TEXT,
  stack_trace TEXT,
  context JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_metrics_user_type ON improvement_plan_metrics(user_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_metrics_user_time ON improvement_plan_metrics(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_plan_id ON improvement_plan_metrics(plan_id);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON improvement_plan_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_metric_type ON improvement_plan_metrics(metric_type);

-- Partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_metrics_errors ON improvement_plan_metrics(user_id, timestamp DESC) WHERE metric_type = 'error';
CREATE INDEX IF NOT EXISTS idx_metrics_ai_calls ON improvement_plan_metrics(user_id, timestamp DESC) WHERE metric_type = 'ai_call';
CREATE INDEX IF NOT EXISTS idx_metrics_cache_hits ON improvement_plan_metrics(user_id, timestamp DESC) WHERE metric_type = 'cache_operation' AND cache_hit = true;

-- Aggregated metrics view (for dashboard queries)
CREATE OR REPLACE VIEW improvement_plan_metrics_hourly AS
SELECT
  DATE_TRUNC('hour', timestamp) AS hour,
  user_id,
  metric_type,
  COUNT(*) AS count,
  AVG(CAST(duration_ms AS NUMERIC)) AS avg_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_duration_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) AS p99_duration_ms
FROM improvement_plan_metrics
WHERE metric_type IN ('plan_generation', 'ai_call', 'cache_operation')
GROUP BY DATE_TRUNC('hour', timestamp), user_id, metric_type;

-- Cache hit rate view
CREATE OR REPLACE VIEW cache_hit_rate_by_hour AS
SELECT
  DATE_TRUNC('hour', timestamp) AS hour,
  user_id,
  COUNT(*) AS total_ops,
  SUM(CASE WHEN cache_hit = true THEN 1 ELSE 0 END) AS hits,
  ROUND(100.0 * SUM(CASE WHEN cache_hit = true THEN 1 ELSE 0 END) / COUNT(*), 2) AS hit_rate_percent
FROM improvement_plan_metrics
WHERE metric_type = 'cache_operation'
GROUP BY DATE_TRUNC('hour', timestamp), user_id;

-- Error summary view
CREATE OR REPLACE VIEW error_summary_by_hour AS
SELECT
  DATE_TRUNC('hour', timestamp) AS hour,
  user_id,
  error_type,
  COUNT(*) AS error_count
FROM improvement_plan_metrics
WHERE metric_type = 'error'
GROUP BY DATE_TRUNC('hour', timestamp), user_id, error_type;

-- Create materialized view for fast dashboard queries (refresh hourly)
CREATE MATERIALIZED VIEW improvement_plan_metrics_summary AS
SELECT
  DATE_TRUNC('hour', timestamp) AS hour,
  user_id,
  COUNT(*) FILTER (WHERE metric_type = 'plan_generation') AS plan_generations,
  AVG(duration_ms) FILTER (WHERE metric_type = 'plan_generation') AS avg_generation_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) FILTER (WHERE metric_type = 'plan_generation') AS p95_generation_ms,
  COUNT(*) FILTER (WHERE metric_type = 'cache_operation') AS cache_ops,
  SUM(CASE WHEN metric_type = 'cache_operation' AND cache_hit = true THEN 1 ELSE 0 END) AS cache_hits,
  COUNT(*) FILTER (WHERE metric_type = 'ai_call') AS ai_calls,
  SUM(CASE WHEN metric_type = 'ai_call' AND fallback_used = true THEN 1 ELSE 0 END) AS ai_fallbacks,
  COUNT(*) FILTER (WHERE metric_type = 'error') AS error_count
FROM improvement_plan_metrics
GROUP BY DATE_TRUNC('hour', timestamp), user_id;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_metrics_summary_user_time ON improvement_plan_metrics_summary(user_id, hour DESC);

-- Function to refresh materialized view (call periodically)
CREATE OR REPLACE FUNCTION refresh_metrics_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY improvement_plan_metrics_summary;
END;
$$ LANGUAGE plpgsql;

-- Stored procedure for anomaly detection
CREATE OR REPLACE FUNCTION detect_metric_anomalies(user_id_param UUID, hours_back INTEGER DEFAULT 24)
RETURNS TABLE (
  anomaly_type TEXT,
  severity TEXT,
  metric_name TEXT,
  current_value NUMERIC,
  expected_value NUMERIC,
  deviation_percent NUMERIC
) AS $$
DECLARE
  mean_latency NUMERIC;
  stddev_latency NUMERIC;
  cache_hit_rate NUMERIC;
BEGIN
  -- Calculate latency statistics
  SELECT
    AVG(CAST(duration_ms AS NUMERIC)),
    STDDEV(CAST(duration_ms AS NUMERIC))
  INTO mean_latency, stddev_latency
  FROM improvement_plan_metrics
  WHERE user_id = user_id_param
    AND metric_type = 'plan_generation'
    AND timestamp > NOW() - (hours_back || ' hours')::INTERVAL;
  
  -- Return high latency anomalies
  RETURN QUERY
  SELECT
    'high_latency'::TEXT,
    CASE WHEN duration_ms > mean_latency + (3 * stddev_latency) THEN 'critical' ELSE 'warning' END,
    'plan_generation_duration_ms'::TEXT,
    CAST(duration_ms AS NUMERIC),
    CAST(mean_latency AS NUMERIC),
    ROUND(((CAST(duration_ms AS NUMERIC) - mean_latency) / mean_latency * 100), 2)
  FROM improvement_plan_metrics
  WHERE user_id = user_id_param
    AND metric_type = 'plan_generation'
    AND timestamp > NOW() - (hours_back || ' hours')::INTERVAL
    AND duration_ms > mean_latency + (2 * stddev_latency);
  
  -- Calculate cache hit rate
  SELECT
    100.0 * SUM(CASE WHEN cache_hit = true THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) 
  INTO cache_hit_rate
  FROM improvement_plan_metrics
  WHERE user_id = user_id_param
    AND metric_type = 'cache_operation'
    AND timestamp > NOW() - (hours_back || ' hours')::INTERVAL;
  
  -- Return low cache hit rate anomalies
  IF cache_hit_rate < 70 THEN
    RETURN QUERY
    SELECT
      'low_cache_hit_rate'::TEXT,
      'warning'::TEXT,
      'cache_hit_rate_percent'::TEXT,
      ROUND(cache_hit_rate, 2),
      80.0,
      ROUND((80.0 - cache_hit_rate), 2);
  END IF;
END;
$$ LANGUAGE plpgsql;
