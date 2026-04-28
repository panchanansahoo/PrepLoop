-- Migration: Add indexes to improvement_plans table for better performance

-- Create index on user_id and creation date for faster queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_improvement_plans_user_created 
ON improvement_plans(user_id, created_at DESC);

-- Create index on status for filtering by status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_improvement_plans_status 
ON improvement_plans(status);

-- Create index on updated_at for tracking recent updates
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_improvement_plans_updated 
ON improvement_plans(updated_at DESC);

-- Create composite index for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_improvement_plans_user_status 
ON improvement_plans(user_id, status);

-- Create partial index for active plans (common query pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_improvement_plans_active_user 
ON improvement_plans(user_id) 
WHERE status = 'active';

-- Update table statistics for query planner
ANALYZE improvement_plans;