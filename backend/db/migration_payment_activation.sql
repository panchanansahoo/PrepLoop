BEGIN;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS billing_cycle text NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'annual')),
  ADD COLUMN IF NOT EXISTS activated_at timestamptz;

CREATE OR REPLACE FUNCTION public.activate_captured_payment(
  captured_order text,
  captured_payment text,
  captured_amount integer,
  captured_currency text,
  captured_at timestamptz,
  checkout_signature text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  saved public.payments%ROWTYPE;
  active_tier text;
BEGIN
  SELECT * INTO saved FROM public.payments
    WHERE razorpay_order_id = captured_order FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  IF saved.plan NOT IN ('pro', 'elite') OR
     saved.amount IS DISTINCT FROM captured_amount OR
     upper(saved.currency) IS DISTINCT FROM upper(captured_currency) OR
     (saved.razorpay_payment_id IS NOT NULL AND saved.razorpay_payment_id <> captured_payment) THEN
    RAISE EXCEPTION 'Captured payment does not match the saved order' USING ERRCODE = '22023';
  END IF;

  SELECT subscription_tier INTO active_tier FROM public.profiles WHERE id = saved.user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment profile is unavailable';
  END IF;

  IF saved.activated_at IS NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.payments AS newer
      WHERE newer.user_id = saved.user_id AND newer.status = 'paid' AND newer.id <> saved.id
        AND (newer.paid_at, newer.id) > (COALESCE(saved.paid_at, captured_at), saved.id)
    ) THEN
      UPDATE public.profiles SET subscription_tier = saved.plan, updated_at = now() WHERE id = saved.user_id;
      active_tier := saved.plan;
    END IF;
    UPDATE public.payments SET
      razorpay_payment_id = captured_payment,
      razorpay_signature = COALESCE(checkout_signature, saved.razorpay_signature),
      status = 'paid',
      paid_at = COALESCE(saved.paid_at, captured_at),
      activated_at = now()
    WHERE id = saved.id;
  END IF;

  RETURN jsonb_build_object('userId', saved.user_id, 'plan', active_tier, 'paymentId', captured_payment);
END;
$$;

REVOKE ALL ON FUNCTION public.activate_captured_payment(text, text, integer, text, timestamptz, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_captured_payment(text, text, integer, text, timestamptz, text) TO service_role;

COMMIT;
