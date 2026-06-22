-- Migration: Add idempotency support to atomic coin transactions.
-- Safe to run multiple times.

ALTER TABLE coin_transactions
ADD COLUMN IF NOT EXISTS reference_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_coin_transactions_user_reference_key
ON coin_transactions(user_id, reference_key);

CREATE OR REPLACE FUNCTION coin_apply_transaction(
  user_id_input UUID,
  amount_input INTEGER,
  txn_type_input TEXT,
  description_input TEXT DEFAULT NULL,
  reference_key_input TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, error TEXT, applied BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance INTEGER;
  inserted_txn_id INTEGER;
BEGIN
  IF amount_input IS NULL OR amount_input <= 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'Amount must be greater than zero', FALSE;
    RETURN;
  END IF;

  IF txn_type_input NOT IN ('earn', 'spend') THEN
    RETURN QUERY SELECT FALSE, 0, 'Invalid transaction type', FALSE;
    RETURN;
  END IF;

  IF reference_key_input IS NOT NULL AND LENGTH(TRIM(reference_key_input)) > 0 THEN
    INSERT INTO coin_transactions (user_id, amount, type, description, reference_key)
    VALUES (
      user_id_input,
      amount_input,
      txn_type_input,
      LEFT(COALESCE(description_input, ''), 160),
      LEFT(TRIM(reference_key_input), 120)
    )
    ON CONFLICT (user_id, reference_key) DO NOTHING
    RETURNING id INTO inserted_txn_id;

    IF inserted_txn_id IS NULL THEN
      SELECT COALESCE(coins, 0) INTO current_balance
      FROM profiles
      WHERE id = user_id_input;

      RETURN QUERY SELECT TRUE, COALESCE(current_balance, 0), 'duplicate_reference', FALSE;
      RETURN;
    END IF;
  END IF;

  IF txn_type_input = 'earn' THEN
    UPDATE profiles
    SET coins = COALESCE(coins, 0) + amount_input
    WHERE id = user_id_input
    RETURNING coins INTO current_balance;

    IF current_balance IS NULL THEN
      IF inserted_txn_id IS NOT NULL THEN
        DELETE FROM coin_transactions WHERE id = inserted_txn_id;
      END IF;
      RETURN QUERY SELECT FALSE, 0, 'User profile not found', FALSE;
      RETURN;
    END IF;
  ELSE
    UPDATE profiles
    SET coins = COALESCE(coins, 0) - amount_input
    WHERE id = user_id_input
      AND COALESCE(coins, 0) >= amount_input
    RETURNING coins INTO current_balance;

    IF current_balance IS NULL THEN
      IF inserted_txn_id IS NOT NULL THEN
        DELETE FROM coin_transactions WHERE id = inserted_txn_id;
      END IF;

      SELECT COALESCE(coins, 0) INTO current_balance
      FROM profiles
      WHERE id = user_id_input;

      IF current_balance IS NULL THEN
        RETURN QUERY SELECT FALSE, 0, 'User profile not found', FALSE;
      ELSE
        RETURN QUERY SELECT FALSE, current_balance, 'Insufficient coins', FALSE;
      END IF;
      RETURN;
    END IF;
  END IF;

  IF inserted_txn_id IS NULL THEN
    INSERT INTO coin_transactions (user_id, amount, type, description)
    VALUES (user_id_input, amount_input, txn_type_input, LEFT(COALESCE(description_input, ''), 160));
  END IF;

  RETURN QUERY SELECT TRUE, current_balance, NULL::TEXT, TRUE;
END;
$$;
