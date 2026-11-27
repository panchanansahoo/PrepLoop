/**
 * Computes the effective subscription tier taking expiry and cancellation into account.
 * Cancelled subscriptions retain paid access until `subscription_expires_at` passes
 * (or downgrade immediately if no expiry timestamp exists).
 */
export function effectiveSubscriptionTier(profile, now = Date.now()) {
  if (!profile) return 'free';

  const rawTier = String(profile.subscription_tier || 'free').trim().toLowerCase() || 'free';
  if (rawTier === 'free') return 'free';

  const rawStatus = String(profile.subscription_status || '').trim().toLowerCase();
  if (rawStatus === 'expired') return 'free';

  const expiresAt = profile.subscription_expires_at;
  if (expiresAt !== null && expiresAt !== undefined && expiresAt !== '') {
    const expiryMs = Date.parse(expiresAt);
    if (!(expiryMs > now)) return 'free';
    return rawTier;
  }

  // Cancelled legacy subscription without an expiry timestamp downgrades immediately
  if (rawStatus === 'cancelled' || (profile.subscription_cancelled_at !== null && profile.subscription_cancelled_at !== undefined)) {
    return 'free';
  }

  return rawTier;
}

/**
 * Returns full normalized subscription lifecycle state for a profile row.
 */
export function getSubscriptionState(profile, now = Date.now()) {
  const tier = effectiveSubscriptionTier(profile, now);
  const rawTier = String(profile?.subscription_tier || 'free').trim().toLowerCase() || 'free';
  const expiresAt = profile?.subscription_expires_at || null;
  const expiryMs = expiresAt ? Date.parse(expiresAt) : NaN;
  const hasFutureExpiry = Number.isFinite(expiryMs) && expiryMs > now;
  const isExpired = rawTier !== 'free' && expiresAt !== null && expiresAt !== undefined && expiresAt !== '' && !(expiryMs > now);
  const cancelledAt = profile?.subscription_cancelled_at || null;
  const rawStatus = String(profile?.subscription_status || '').trim().toLowerCase();
  const isCancelled = rawStatus === 'cancelled' || Boolean(cancelledAt);

  let status = 'free';
  if (tier !== 'free') {
    status = isCancelled ? 'cancelled' : 'active';
  } else if (isCancelled && rawTier !== 'free') {
    status = 'cancelled';
  } else if (isExpired || (rawTier !== 'free' && rawStatus === 'expired')) {
    status = 'expired';
  }

  return {
    tier,
    rawTier,
    billingCycle: profile?.subscription_billing_cycle || null,
    expiresAt,
    cancelledAt,
    status,
    cancelAtPeriodEnd: isCancelled && hasFutureExpiry && tier !== 'free',
    isPaid: tier !== 'free',
  };
}
