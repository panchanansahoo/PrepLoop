-- Apply after migration_payment_activation.sql.
BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_billing_cycle text
    CHECK (subscription_billing_cycle IS NULL OR subscription_billing_cycle IN ('monthly', 'annual')),
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'active'
    CHECK (subscription_status IN ('active', 'cancelled', 'expired')),
  ADD COLUMN IF NOT EXISTS subscription_cancelled_at timestamptz;

-- Only assign an expiry and billing period to purchases with a recorded activation and billing period.
WITH last_activation AS (
  SELECT DISTINCT ON (user_id) user_id, plan, paid_at, billing_cycle
  FROM public.payments
  WHERE status = 'paid' AND activated_at IS NOT NULL AND paid_at IS NOT NULL
  ORDER BY user_id, paid_at DESC, id DESC
)
UPDATE public.profiles p
SET
  subscription_expires_at = COALESCE(
    p.subscription_expires_at,
    a.paid_at + CASE WHEN a.billing_cycle = 'annual' THEN interval '1 year' ELSE interval '1 month' END
  ),
  subscription_billing_cycle = COALESCE(p.subscription_billing_cycle, a.billing_cycle),
  subscription_status = CASE
    WHEN p.subscription_cancelled_at IS NOT NULL THEN 'cancelled'
    WHEN COALESCE(
      p.subscription_expires_at,
      a.paid_at + CASE WHEN a.billing_cycle = 'annual' THEN interval '1 year' ELSE interval '1 month' END
    ) <= now() THEN 'expired'
    ELSE 'active'
  END
FROM last_activation a
WHERE p.id = a.user_id AND p.subscription_tier = a.plan;

CREATE OR REPLACE FUNCTION public.protect_profile_subscription()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      IF COALESCE(NEW.subscription_tier, 'free') <> 'free'
         OR NEW.subscription_expires_at IS NOT NULL
         OR NEW.subscription_billing_cycle IS NOT NULL
         OR COALESCE(NEW.subscription_status, 'active') <> 'active'
         OR NEW.subscription_cancelled_at IS NOT NULL THEN
        RAISE EXCEPTION 'Subscription fields are managed by PrepLoop' USING ERRCODE = '42501';
      END IF;
    ELSIF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier
       OR NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at
       OR NEW.subscription_billing_cycle IS DISTINCT FROM OLD.subscription_billing_cycle
       OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
       OR NEW.subscription_cancelled_at IS DISTINCT FROM OLD.subscription_cancelled_at THEN
      RAISE EXCEPTION 'Subscription fields are managed by PrepLoop' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_subscription ON public.profiles;
CREATE TRIGGER trg_protect_profile_subscription
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_subscription();

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
  current_expiry timestamptz;
  active_billing_cycle text;
  active_status text;
  active_cancelled_at timestamptz;
  payment_date timestamptz;
  term interval;
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

  SELECT subscription_tier, subscription_expires_at, subscription_billing_cycle, subscription_status, subscription_cancelled_at
  INTO active_tier, current_expiry, active_billing_cycle, active_status, active_cancelled_at
  FROM public.profiles WHERE id = saved.user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment profile is unavailable';
  END IF;

  IF saved.activated_at IS NULL THEN
    payment_date := COALESCE(saved.paid_at, captured_at);
    term := CASE WHEN saved.billing_cycle = 'annual' THEN interval '1 year' ELSE interval '1 month' END;
    IF NOT EXISTS (
      SELECT 1 FROM public.payments AS newer
      WHERE newer.user_id = saved.user_id AND newer.status = 'paid' AND newer.id <> saved.id
        AND (newer.paid_at, newer.id) > (COALESCE(saved.paid_at, captured_at), saved.id)
    ) THEN
      current_expiry := CASE WHEN active_tier = saved.plan
        THEN GREATEST(current_expiry, payment_date) ELSE payment_date END + term;
      UPDATE public.profiles SET
        subscription_tier = saved.plan,
        subscription_expires_at = current_expiry,
        subscription_billing_cycle = saved.billing_cycle,
        subscription_status = 'active',
        subscription_cancelled_at = NULL,
        updated_at = now()
      WHERE id = saved.user_id;
      active_tier := saved.plan;
      active_billing_cycle := saved.billing_cycle;
      active_status := 'active';
      active_cancelled_at := NULL;
    END IF;
    UPDATE public.payments SET
      razorpay_payment_id = captured_payment,
      razorpay_signature = COALESCE(checkout_signature, saved.razorpay_signature),
      status = 'paid',
      paid_at = COALESCE(saved.paid_at, captured_at),
      activated_at = now()
    WHERE id = saved.id;
  END IF;

  RETURN jsonb_build_object(
    'userId', saved.user_id,
    'plan', CASE
      WHEN COALESCE(active_tier, 'free') = 'free' THEN 'free'
      WHEN current_expiry IS NOT NULL AND current_expiry <= now() THEN 'free'
      WHEN active_status = 'expired' THEN 'free'
      WHEN (active_status = 'cancelled' OR active_cancelled_at IS NOT NULL) AND current_expiry IS NULL THEN 'free'
      ELSE active_tier
    END,
    'paymentId', captured_payment,
    'billingCycle', COALESCE(active_billing_cycle, saved.billing_cycle),
    'subscriptionExpiresAt', current_expiry,
    'subscriptionStatus', CASE
      WHEN active_status = 'cancelled' OR active_cancelled_at IS NOT NULL THEN 'cancelled'
      WHEN current_expiry IS NOT NULL AND current_expiry <= now() THEN 'expired'
      ELSE COALESCE(active_status, 'active')
    END,
    'subscriptionCancelledAt', active_cancelled_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.activate_captured_payment(text, text, integer, text, timestamptz, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_captured_payment(text, text, integer, text, timestamptz, text) TO service_role;

COMMIT;
