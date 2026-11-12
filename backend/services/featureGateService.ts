import type { NextFunction, Request, Response } from 'express';
import { supabaseAdmin } from '../db/supabaseClient.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('feature-gates');

export type SubscriptionTier = 'free' | 'pro' | 'elite';
export type FeatureKey =
  | 'ai_mock_interview'
  | 'company_question_bank'
  | 'voice_interview'
  | 'resume_analysis'
  | 'code_review_ai'
  | 'peer_interview_room'
  | 'job_application_tracker'
  | 'improvement_plan_ai';

export interface GateRule {
  enabled: boolean;
  limit: number | null; // null = unlimited
  period: 'day' | 'week' | 'month' | 'total' | 'unlimited';
}

export const DEFAULT_FEATURE_GATES: Record<FeatureKey, Record<SubscriptionTier, GateRule>> = {
  ai_mock_interview: {
    free: { enabled: true, limit: 3, period: 'month' },
    pro: { enabled: true, limit: null, period: 'unlimited' },
    elite: { enabled: true, limit: null, period: 'unlimited' },
  },
  company_question_bank: {
    free: { enabled: true, limit: 2, period: 'total' },
    pro: { enabled: true, limit: null, period: 'unlimited' },
    elite: { enabled: true, limit: null, period: 'unlimited' },
  },
  voice_interview: {
    free: { enabled: true, limit: 1, period: 'week' },
    pro: { enabled: true, limit: 10, period: 'week' },
    elite: { enabled: true, limit: null, period: 'unlimited' },
  },
  resume_analysis: {
    free: { enabled: true, limit: 1, period: 'total' },
    pro: { enabled: true, limit: 5, period: 'month' },
    elite: { enabled: true, limit: null, period: 'unlimited' },
  },
  code_review_ai: {
    free: { enabled: false, limit: 0, period: 'month' },
    pro: { enabled: true, limit: 3, period: 'month' },
    elite: { enabled: true, limit: null, period: 'unlimited' },
  },
  peer_interview_room: {
    free: { enabled: false, limit: 0, period: 'total' },
    pro: { enabled: true, limit: null, period: 'unlimited' },
    elite: { enabled: true, limit: null, period: 'unlimited' },
  },
  job_application_tracker: {
    free: { enabled: true, limit: 10, period: 'total' },
    pro: { enabled: true, limit: null, period: 'unlimited' },
    elite: { enabled: true, limit: null, period: 'unlimited' },
  },
  improvement_plan_ai: {
    free: { enabled: false, limit: 0, period: 'total' },
    pro: { enabled: true, limit: null, period: 'unlimited' },
    elite: { enabled: true, limit: null, period: 'unlimited' },
  },
};

export function normalizeTier(rawTier?: string | null): SubscriptionTier {
  const t = String(rawTier || 'free').toLowerCase().trim();
  if (t === 'elite' || t === 'premium') return 'elite';
  if (t === 'pro') return 'pro';
  return 'free';
}

export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return 'free';
    return normalizeTier((data as any).subscription_tier);
  } catch {
    return 'free';
  }
}

export async function getGateRule(featureKey: FeatureKey, tier: SubscriptionTier): Promise<GateRule> {
  try {
    const { data, error } = await supabaseAdmin
      .from('feature_gates')
      .select('enabled, limit_value, limit_period')
      .eq('feature_key', featureKey)
      .eq('tier', tier)
      .maybeSingle();

    if (!error && data) {
      return {
        enabled: Boolean((data as any).enabled),
        limit: (data as any).limit_value !== null ? Number((data as any).limit_value) : null,
        period: ((data as any).limit_period || 'unlimited') as GateRule['period'],
      };
    }
  } catch (err: any) {
    logger.debug('feature_gates table lookup skipped; using default matrix', { error: err.message });
  }

  return DEFAULT_FEATURE_GATES[featureKey]?.[tier] || { enabled: false, limit: 0, period: 'total' };
}

export async function checkFeatureAccess({
  userId,
  featureKey,
  currentUsageCount = 0,
  tierOverride,
}: {
  userId: string;
  featureKey: FeatureKey;
  currentUsageCount?: number;
  tierOverride?: SubscriptionTier;
}) {
  const tier = tierOverride || (await getUserTier(userId));
  const rule = await getGateRule(featureKey, tier);

  if (!rule.enabled) {
    return {
      allowed: false,
      tier,
      featureKey,
      limit: rule.limit,
      period: rule.period,
      remaining: 0,
      upgradeRequired: true,
    };
  }

  if (rule.limit === null) {
    return {
      allowed: true,
      tier,
      featureKey,
      limit: null,
      period: rule.period,
      remaining: null,
      upgradeRequired: false,
    };
  }

  const remaining = Math.max(0, rule.limit - currentUsageCount);
  const allowed = currentUsageCount < rule.limit;
  return {
    allowed,
    tier,
    featureKey,
    limit: rule.limit,
    period: rule.period,
    remaining,
    upgradeRequired: !allowed,
  };
}

export function requireFeature(
  featureKey: FeatureKey,
  getUsageCount?: (req: Request) => Promise<number> | number
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const usageCount = getUsageCount ? await getUsageCount(req) : 0;
      const access = await checkFeatureAccess({ userId, featureKey, currentUsageCount: usageCount });
      if (!access.allowed) {
        return res.status(403).json({
          error: `Feature "${featureKey}" limit reached on ${access.tier} plan`,
          code: 'FEATURE_GATE_BLOCKED',
          ...access,
        });
      }
      (req as any).featureAccess = access;
      return next();
    } catch (err: any) {
      logger.warn('Feature gate check error (fail-open)', { featureKey, error: err.message });
      return next();
    }
  };
}
