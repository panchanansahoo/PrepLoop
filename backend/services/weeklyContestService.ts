import { supabaseAdmin } from '../db/supabaseClient.js';
import { applyCoinTransaction } from '../utils/coinTransactions.js';
import { createLogger } from '../utils/structuredLogger.js';

const logger = createLogger('weekly-contest');

export interface ContestProblem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  prompt: string;
  expectedKeywords: string[];
  starterCode: string;
}

export interface ContestSubmissionRecord {
  contestId: string;
  userId: string;
  username: string;
  score: number;
  problemsSolved: number;
  timeTakenSeconds: number;
  finishedAt: string;
}

const memoryLeaderboard = new Map<string, ContestSubmissionRecord[]>();

function getIsoWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `weekly-${d.getUTCFullYear()}-w${String(weekNo).padStart(2, '0')}`;
}

export function getActiveWeeklyContest(now = new Date()) {
  const contestId = getIsoWeekKey(now);
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

  const problems: ContestProblem[] = [
    {
      id: 'p1-two-sum-window',
      title: 'Subarray Target Window',
      difficulty: 'easy',
      points: 100,
      prompt: 'Given an integer array nums and target k, return true if any contiguous subarray sums to k.',
      expectedKeywords: ['map', 'prefix', 'sum', 'has', 'set'],
      starterCode: 'function hasSubarraySum(nums, k) {\n  // Your O(n) solution\n}',
    },
    {
      id: 'p2-lru-ttl',
      title: 'Rate-Limited LRU Cache',
      difficulty: 'medium',
      points: 200,
      prompt: 'Design an O(1) get/put LRU cache that also expires keys older than ttlMs.',
      expectedKeywords: ['map', 'delete', 'set', 'ttl', 'capacity'],
      starterCode: 'class TimedLRUCache {\n  constructor(capacity, ttlMs) {}\n  get(key) {}\n  put(key, value) {}\n}',
    },
    {
      id: 'p3-dag-scheduler',
      title: 'Parallel Task DAG Scheduler',
      difficulty: 'hard',
      points: 300,
      prompt: 'Compute minimum total completion time for N tasks with durations and prerequisite edges.',
      expectedKeywords: ['indegree', 'queue', 'topo', 'dp', 'max'],
      starterCode: 'function minCompletionTime(durations, edges) {\n  // Topological DP\n}',
    },
  ];

  return {
    id: contestId,
    title: `PrepLoop Weekly DSA Contest (${contestId.toUpperCase()})`,
    description: '90-minute timed contest with 3 curated problems (Easy / Medium / Hard).',
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    durationMinutes: 90,
    prizes: {
      top3: '1 month Pro free',
      finisherCoins: 50,
    },
    problems,
  };
}

export function gradeContestAnswers(
  problems: ContestProblem[],
  answers: Record<string, string>
): { score: number; problemsSolved: number } {
  let score = 0;
  let problemsSolved = 0;

  for (const problem of problems) {
    const code = String(answers?.[problem.id] || '').trim();
    if (code.length < 20) continue;
    const lower = code.toLowerCase();
    const hits = problem.expectedKeywords.filter((kw) => lower.includes(kw)).length;
    if (hits >= 2 || code.length >= 60) {
      problemsSolved += 1;
      const partialRatio = hits >= 2 ? 1 : 0.7;
      score += Math.round(problem.points * partialRatio);
    }
  }

  return { score, problemsSolved };
}

export async function getWeeklyContestLeaderboard(contestId: string): Promise<ContestSubmissionRecord[]> {
  let rows: ContestSubmissionRecord[] = [];
  try {
    const { data, error } = await supabaseAdmin
      .from('weekly_contest_submissions')
      .select('contest_id, user_id, username, score, problems_solved, time_taken_seconds, finished_at')
      .eq('contest_id', contestId)
      .order('score', { ascending: false })
      .order('time_taken_seconds', { ascending: true })
      .limit(100);

    if (!error && Array.isArray(data)) {
      rows = data.map((r: any) => ({
        contestId: r.contest_id,
        userId: r.user_id,
        username: r.username || 'Candidate',
        score: Number(r.score || 0),
        problemsSolved: Number(r.problems_solved || 0),
        timeTakenSeconds: Number(r.time_taken_seconds || 0),
        finishedAt: r.finished_at,
      }));
    }
  } catch (err: any) {
    logger.debug('Weekly contest leaderboard query skipped; using memory store', { error: err.message });
  }

  if (rows.length === 0) {
    rows = [...(memoryLeaderboard.get(contestId) || [])];
  }

  rows.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.timeTakenSeconds - b.timeTakenSeconds;
  });

  return rows;
}

export async function submitWeeklyContest({
  contestId,
  userId,
  username = 'Candidate',
  answers,
  timeTakenSeconds = 1800,
}: {
  contestId: string;
  userId: string;
  username?: string;
  answers: Record<string, string>;
  timeTakenSeconds?: number;
}) {
  const contest = getActiveWeeklyContest();
  const targetId = contestId || contest.id;
  const { score, problemsSolved } = gradeContestAnswers(contest.problems, answers);
  const clampedTime = Math.max(1, Math.min(contest.durationMinutes * 60, Math.round(Number(timeTakenSeconds) || 1800)));
  const finishedAt = new Date().toISOString();

  const record: ContestSubmissionRecord = {
    contestId: targetId,
    userId,
    username: String(username || 'Candidate').slice(0, 60),
    score,
    problemsSolved,
    timeTakenSeconds: clampedTime,
    finishedAt,
  };

  let persistedToDb = false;
  try {
    await supabaseAdmin.from('weekly_contests').upsert(
      {
        id: targetId,
        title: contest.title,
        description: contest.description,
        starts_at: contest.startsAt,
        ends_at: contest.endsAt,
        duration_minutes: contest.durationMinutes,
        problems: contest.problems,
        prizes: contest.prizes,
      },
      { onConflict: 'id' }
    );

    const { error } = await supabaseAdmin.from('weekly_contest_submissions').upsert(
      {
        contest_id: targetId,
        user_id: userId,
        username: record.username,
        score: record.score,
        problems_solved: record.problemsSolved,
        time_taken_seconds: record.timeTakenSeconds,
        answers,
        finished_at: finishedAt,
      },
      { onConflict: 'contest_id,user_id' }
    );
    if (!error) persistedToDb = true;
  } catch {
    // Memory fallback below
  }

  if (!persistedToDb) {
    const list = memoryLeaderboard.get(targetId) || [];
    const filtered = list.filter((item) => item.userId !== userId);
    filtered.push(record);
    memoryLeaderboard.set(targetId, filtered);
  }

  // Award finisher coins idempotently
  try {
    await applyCoinTransaction({
      userId,
      amount: contest.prizes.finisherCoins,
      type: 'earn',
      description: `Weekly Contest Finisher (${targetId})`,
      referenceKey: `contest-finisher:${targetId}:${userId}`,
    });
  } catch (coinErr: any) {
    logger.debug('Contest finisher coin award skipped', { error: coinErr.message });
  }

  const leaderboard = await getWeeklyContestLeaderboard(targetId);
  const rankIdx = leaderboard.findIndex((r) => r.userId === userId);
  const rank = rankIdx >= 0 ? rankIdx + 1 : 1;

  return {
    ...record,
    rank,
    totalParticipants: leaderboard.length,
    prizeEligible: rank <= 3 ? contest.prizes.top3 : `${contest.prizes.finisherCoins} coins`,
    shareCard: {
      text: `I ranked #${rank} in ${contest.title} on PrepLoop with ${score}/600 points!`,
      url: `https://preploop.io/contests/${encodeURIComponent(targetId)}`,
    },
  };
}
