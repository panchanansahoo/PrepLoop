-- Migration: Coin feature real-data sync and hardening
-- Purpose:
-- 1) Ensure coin schema pieces exist for production usage
-- 2) Reconcile profiles.coins from persisted coin_transactions ledger

BEGIN;

-- Ensure profiles coin column is production-safe
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS coins INTEGER;

UPDATE profiles
SET coins = 0
WHERE coins IS NULL;

ALTER TABLE profiles
  ALTER COLUMN coins SET DEFAULT 0;

ALTER TABLE profiles
  ALTER COLUMN coins SET NOT NULL;

-- Ensure ledger table exists (kept compatible with existing code)
CREATE TABLE IF NOT EXISTS coin_transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('earn', 'spend')),
  description TEXT,
  reference_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE coin_transactions
  ADD COLUMN IF NOT EXISTS reference_key TEXT;

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user
  ON coin_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_created_at
  ON coin_transactions(user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_coin_transactions_user_reference_key
  ON coin_transactions(user_id, reference_key);

-- Reconcile balances from ledger for real persisted data correctness
WITH ledger AS (
  SELECT
    user_id,
    SUM(
      CASE
        WHEN type = 'earn' THEN amount
        WHEN type = 'spend' THEN -amount
        ELSE 0
      END
    )::INTEGER AS balance
  FROM coin_transactions
  GROUP BY user_id
)
UPDATE profiles p
SET coins = GREATEST(COALESCE(l.balance, 0), 0)
FROM ledger l
WHERE p.id = l.user_id
  AND p.coins IS DISTINCT FROM GREATEST(COALESCE(l.balance, 0), 0);

COMMIT;
