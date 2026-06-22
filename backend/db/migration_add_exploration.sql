-- Migration: Add Explore Questions and Extended Test Cases to Problems
-- This migration adds fields to support educational exploration and comprehensive testing

-- Add new columns to problems table
ALTER TABLE problems ADD COLUMN IF NOT EXISTS explore_questions JSONB;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS extended_test_cases JSONB;
ALTER TABLE problems ADD COLUMN IF NOT EXISTS exploration_metadata JSONB;

-- Add comments to explain the new fields
COMMENT ON COLUMN problems.explore_questions IS 'Array of exploratory learning questions to help students understand the problem deeply';
COMMENT ON COLUMN problems.extended_test_cases IS 'Array of additional comprehensive test cases covering edge cases and special scenarios';
COMMENT ON COLUMN problems.exploration_metadata IS 'Metadata about the exploration enhancement (timestamp, counts, etc.)';

-- Create index for querying enhanced problems
CREATE INDEX IF NOT EXISTS idx_problems_explore_questions ON problems USING GIN (explore_questions);
CREATE INDEX IF NOT EXISTS idx_problems_enhanced ON problems(exploration_metadata);

-- Create a view for easy querying of fully enhanced problems
DROP VIEW IF EXISTS enhanced_problems;
CREATE OR REPLACE VIEW enhanced_problems AS
SELECT 
  p.*,
  COALESCE(jsonb_array_length(p.explore_questions), 0) as explore_questions_count,
  COALESCE(jsonb_array_length(p.extended_test_cases), 0) as extended_test_cases_count,
  CASE 
    WHEN p.explore_questions IS NOT NULL AND p.extended_test_cases IS NOT NULL 
    THEN 'fully_enhanced'
    WHEN p.explore_questions IS NOT NULL 
    THEN 'partially_enhanced'
    ELSE 'not_enhanced'
  END as enhancement_status
FROM problems p;
