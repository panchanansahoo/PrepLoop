-- Migration: Core query indexes v2 for subscription tiers, problem filtering & submission ordering
-- Safe to run multiple times (idempotent IF NOT EXISTS)

-- Profiles subscription tier index for rapid plan quota and gating lookups
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);

-- DSA problems company filtering index (GIN for JSONB / array tags if applicable or standard B-tree)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'problems' AND column_name = 'companies' AND data_type = 'jsonb'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_problems_companies ON problems USING GIN (companies);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'problems' AND column_name = 'companies'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_problems_companies ON problems(companies);
  END IF;
END $$;

-- DSA problems tags filtering index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'problems' AND column_name = 'tags' AND data_type = 'jsonb'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_problems_tags ON problems USING GIN (tags);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'problems' AND column_name = 'tags'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_problems_tags ON problems(tags);
  END IF;
END $$;

-- Submissions chronological ordering per user and globally
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at DESC);

