import { supabaseAdmin } from '../db/supabaseClient.js';
import { applyCoinTransaction } from '../utils/coinTransactions.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('referral-service');

export const REFERRAL_REWARD_COINS = 500;
const PUBLIC_ORIGIN = process.env.PUBLIC_APP_URL || 'https://preploop.io';

export function normalizeReferralCode(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 40)
    .toUpperCase();
}

export function buildReferralLink(code: string): string {
  return `${PUBLIC_ORIGIN.replace(/\/$/, '')}/ref/${encodeURIComponent(code)}`;
}

// In-memory fallback for environments where referrals table hasn't been applied yet
const memoryReferrals: Array<{
  id: string;
  referrer_id: string;
  referee_id: string;
  referral_code: string;
  status: 'pending' | 'qualified' | 'rewarded';
  reward_coins: number;
  rewarded_at: string | null;
  created_at: string;
}> = [];

export async function getUserReferralCode(userId: string, fallbackName?: string): Promise<string> {
  try {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('username, full_name, referral_code')
      .eq('id', userId)
      .maybeSingle();

    if ((data as any)?.referral_code) {
      const existing = normalizeReferralCode((data as any).referral_code);
      if (existing.length >= 3) return existing;
    }

    const raw = (data as any)?.username || fallbackName || `USER${String(userId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 6)}`;
    const normalized = normalizeReferralCode(raw);
    if (normalized.length >= 3) {
      // Best-effort persist generated referral_code so /referral/claim can resolve it
      try {
        await supabaseAdmin
          .from('profiles')
          .update({ referral_code: normalized })
          .eq('id', userId)
          .is('referral_code', null);
      } catch {
        // Ignore if referral_code column not yet migrated
      }
      return normalized;
    }
  } catch {
    // Fallback below
  }
  return normalizeReferralCode(fallbackName || `USER${String(userId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 6)}`);
}

export async function getReferralSummary(userId: string, usernameHint?: string) {
  const referralCode = await getUserReferralCode(userId, usernameHint);
  const referralUrl = buildReferralLink(referralCode);

  let rows: any[] = [];
  try {
    const { data, error } = await supabaseAdmin
      .from('referrals')
      .select('id, referee_id, referral_code, status, reward_coins, rewarded_at, created_at')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      rows = data;
    }
  } catch (err: any) {
    logger.debug('Referrals table query skipped; using memory fallback', { error: err.message });
  }

  if (rows.length === 0) {
    rows = memoryReferrals.filter((r) => r.referrer_id === userId);
  }

  const rewardedCount = rows.filter((r) => r.status === 'rewarded').length;
  const totalEarnedCoins = rows
    .filter((r) => r.status === 'rewarded')
    .reduce((sum, r) => sum + Number(r.reward_coins || REFERRAL_REWARD_COINS), 0);

  return {
    referralCode,
    referralUrl,
    rewardCoinsPerReferral: REFERRAL_REWARD_COINS,
    totalReferred: rows.length,
    rewardedCount,
    totalEarnedCoins,
    referrals: rows,
  };
}

export async function claimReferral({
  refereeId,
  referrerId,
  referralCode,
}: {
  refereeId: string;
  referrerId: string;
  referralCode: string;
}) {
  const cleanCode = normalizeReferralCode(referralCode);
  if (!cleanCode) {
    throw new Error('Invalid referral code');
  }
  if (refereeId === referrerId) {
    throw new Error('Self-referral is not allowed');
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referee_id: refereeId,
        referral_code: cleanCode,
        status: 'pending',
        reward_coins: REFERRAL_REWARD_COINS,
      })
      .select('*')
      .single();

    if (!error && data) {
      return { referral: data, storage: 'supabase' as const };
    }
    if (error?.code === '23505') {
      throw new Error('Referral already claimed for this account');
    }
    const errCode = String(error?.code || '').toUpperCase();
    const isSchemaMissing = errCode === '42P01' || errCode === '42703' || errCode === 'PGRST205';
    if (error && !isSchemaMissing) {
      throw new Error(error.message || 'Failed to claim referral');
    }
  } catch (err: any) {
    if (/already claimed/i.test(err?.message || '')) {
      throw err;
    }
    // Fallback to memory store only when schema/table is unavailable
  }

  const duplicate = memoryReferrals.find((r) => r.referee_id === refereeId);
  if (duplicate) {
    throw new Error('Referral already claimed for this account');
  }

  const memRow = {
    id: `ref-${Date.now()}`,
    referrer_id: referrerId,
    referee_id: refereeId,
    referral_code: cleanCode,
    status: 'pending' as const,
    reward_coins: REFERRAL_REWARD_COINS,
    rewarded_at: null,
    created_at: new Date().toISOString(),
  };
  memoryReferrals.push(memRow);
  return { referral: memRow, storage: 'memory' as const };
}

export async function completeReferralReward(refereeId: string) {
  let referral: any = null;
  let fromDb = false;

  try {
    const { data, error } = await supabaseAdmin
      .from('referrals')
      .select('*')
      .eq('referee_id', refereeId)
      .maybeSingle();

    if (!error && data) {
      referral = data;
      fromDb = true;
    }
  } catch {
    // Fallback below
  }

  if (!referral) {
    referral = memoryReferrals.find((r) => r.referee_id === refereeId) || null;
  }

  if (!referral) {
    return { rewarded: false, reason: 'no_referral_found' };
  }

  if (referral.status === 'rewarded') {
    return { rewarded: false, reason: 'already_rewarded' };
  }

  const rewardAmount = Number(referral.reward_coins || REFERRAL_REWARD_COINS);
  await applyCoinTransaction({
    userId: referral.referrer_id,
    amount: rewardAmount,
    type: 'earn',
    description: `Referral bonus (${referral.referral_code})`,
    referenceKey: `referral-reward:${refereeId}`,
  });

  const rewardedAt = new Date().toISOString();
  if (fromDb) {
    await supabaseAdmin
      .from('referrals')
      .update({ status: 'rewarded', rewarded_at: rewardedAt })
      .eq('id', referral.id);
  } else {
    referral.status = 'rewarded';
    referral.rewarded_at = rewardedAt;
  }

  return {
    rewarded: true,
    referrerId: referral.referrer_id,
    coinsAwarded: rewardAmount,
    rewardedAt,
  };
}
