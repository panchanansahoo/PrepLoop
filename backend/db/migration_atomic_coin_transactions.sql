-- Migration: Atomic coin transactions to prevent race conditions
-- Safe to run multiple times.

CREATE OR REPLACE FUNCTION coin_apply_transaction(
  user_id_input UUID,
  amount_input INTEGER,
  txn_type_input TEXT,
  description_input TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, error TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  IF amount_input IS NULL OR amount_input <= 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'Amount must be greater than zero';
    RETURN;
  END IF;

  IF txn_type_input NOT IN ('earn', 'spend') THEN
    RETURN QUERY SELECT FALSE, 0, 'Invalid transaction type';
    RETURN;
  END IF;

  IF txn_type_input = 'earn' THEN
    UPDATE profiles
    SET coins = COALESCE(coins, 0) + amount_input
    WHERE id = user_id_input
    RETURNING coins INTO current_balance;

    IF current_balance IS NULL THEN
      RETURN QUERY SELECT FALSE, 0, 'User profile not found';
      RETURN;
    END IF;

  ELSE
    UPDATE profiles
    SET coins = COALESCE(coins, 0) - amount_input
    WHERE id = user_id_input
      AND COALESCE(coins, 0) >= amount_input
    RETURNING coins INTO current_balance;

    IF current_balance IS NULL THEN
      SELECT COALESCE(coins, 0) INTO current_balance
      FROM profiles
      WHERE id = user_id_input;

      IF current_balance IS NULL THEN
        RETURN QUERY SELECT FALSE, 0, 'User profile not found';
      ELSE
        RETURN QUERY SELECT FALSE, current_balance, 'Insufficient coins';
      END IF;
      RETURN;
    END IF;
  END IF;

  INSERT INTO coin_transactions (user_id, amount, type, description)
  VALUES (user_id_input, amount_input, txn_type_input, LEFT(COALESCE(description_input, ''), 160));

  RETURN QUERY SELECT TRUE, current_balance, NULL::TEXT;
END;
$$;
