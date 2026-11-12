import { supabaseAdmin } from '../db/supabaseClient.js';

export interface Sm2Input {
  quality: number;
  repetitions?: number;
  intervalDays?: number;
  easeFactor?: number;
  now?: Date;
}

export interface Sm2Result {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewAt: string;
}

export interface ProblemReviewRecord {
  id?: string;
  user_id: string;
  problem_id: string;
  problem_title?: string;
  repetitions: number;
  interval_days: number;
  ease_factor: number;
  last_quality: number;
  next_review_at: string;
  last_reviewed_at: string;
}

/**
 * Pure SM-2 spaced repetition algorithm.
 * quality: 0-5 (0=blackout, 3=recalled with difficulty, 5=perfect)
 */
export function computeSm2NextReview({
  quality,
  repetitions = 0,
  intervalDays = 1,
  easeFactor = 2.5,
  now = new Date(),
}: Sm2Input): Sm2Result {
  const q = Math.max(0, Math.min(5, Math.round(Number(quality) || 0)));
  const prevReps = Math.max(0, Math.floor(Number(repetitions) || 0));
  const prevInterval = Math.max(1, Math.floor(Number(intervalDays) || 1));
  const prevEF = Math.max(1.3, Number(easeFactor) || 2.5);

  const delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  const newEaseFactor = Math.max(1.3, Number((prevEF + delta).toFixed(2)));

  let newRepetitions: number;
  let newInterval: number;

  if (q < 3) {
    newRepetitions = 0;
    newInterval = 1;
  } else {
    newRepetitions = prevReps + 1;
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.max(1, Math.round(prevInterval * newEaseFactor));
    }
  }

  const nextReviewAt = new Date(now.getTime() + newInterval * 86_400_000).toISOString();

  return {
    repetitions: newRepetitions,
    intervalDays: newInterval,
    easeFactor: newEaseFactor,
    nextReviewAt,
  };
}

function isMissingTableError(error: any): boolean {
  const code = String(error?.code || '').toUpperCase();
  const msg = String(error?.message || '').toLowerCase();
  return code === '42P01' || msg.includes('does not exist') || msg.includes('could not find');
}

export async function recordProblemReview(
  userId: string,
  { problemId, problemTitle = '', quality }: { problemId: string; problemTitle?: string; quality: number }
): Promise<{ review: ProblemReviewRecord; schedule: Sm2Result; persisted: boolean }> {
  const now = new Date();
  let existing: any = null;

  try {
    const { data, error } = await (supabaseAdmin as any)
      .from('user_problem_reviews')
      .select('*')
      .eq('user_id', userId)
      .eq('problem_id', problemId)
      .maybeSingle();

    if (error && !isMissingTableError(error)) {
      throw error;
    }
    existing = data;
  } catch (err) {
    if (!isMissingTableError(err)) throw err;
  }

  const schedule = computeSm2NextReview({
    quality,
    repetitions: existing?.repetitions ?? 0,
    intervalDays: existing?.interval_days ?? 1,
    easeFactor: existing?.ease_factor ?? 2.5,
    now,
  });

  const payload: ProblemReviewRecord = {
    user_id: userId,
    problem_id: problemId,
    problem_title: problemTitle || existing?.problem_title || '',
    repetitions: schedule.repetitions,
    interval_days: schedule.intervalDays,
    ease_factor: schedule.easeFactor,
    last_quality: Math.max(0, Math.min(5, Math.round(quality))),
    next_review_at: schedule.nextReviewAt,
    last_reviewed_at: now.toISOString(),
  };

  try {
    const { data, error } = await (supabaseAdmin as any)
      .from('user_problem_reviews')
      .upsert(payload, { onConflict: 'user_id,problem_id' })
      .select()
      .single();

    if (error) {
      if (isMissingTableError(error)) {
        return { review: payload, schedule, persisted: false };
      }
      throw error;
    }
    return { review: data || payload, schedule, persisted: true };
  } catch (err) {
    if (isMissingTableError(err)) {
      return { review: payload, schedule, persisted: false };
    }
    throw err;
  }
}

export async function getDueReviews(
  userId: string,
  { limit = 20 }: { limit?: number } = {}
): Promise<{ dueCount: number; totalTracked: number; dueProblems: ProblemReviewRecord[] }> {
  const nowIso = new Date().toISOString();

  try {
    const [{ data: dueRows, error: dueErr }, { count: totalCount, error: countErr }] = await Promise.all([
      (supabaseAdmin as any)
        .from('user_problem_reviews')
        .select('*')
        .eq('user_id', userId)
        .lte('next_review_at', nowIso)
        .order('next_review_at', { ascending: true })
        .limit(limit),
      (supabaseAdmin as any)
        .from('user_problem_reviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
    ]);

    if (dueErr && !isMissingTableError(dueErr)) throw dueErr;
    if (countErr && !isMissingTableError(countErr)) throw countErr;
    if (isMissingTableError(dueErr) || isMissingTableError(countErr)) {
      return { dueCount: 0, totalTracked: 0, dueProblems: [] };
    }

    const dueProblems = dueRows || [];
    return {
      dueCount: dueProblems.length,
      totalTracked: totalCount ?? dueProblems.length,
      dueProblems,
    };
  } catch (err) {
    if (isMissingTableError(err)) {
      return { dueCount: 0, totalTracked: 0, dueProblems: [] };
    }
    throw err;
  }
}
