import { supabaseAdmin } from '../db/supabaseClient.js';
import { calculateDashboardStreak } from '../utils/dashboardStreak.js';

export const XP_BY_DIFFICULTY = {
  easy: 10,
  medium: 25,
  hard: 50,
};

export const LEVELS = [
  { name: 'Novice', minXP: 0 },
  { name: 'Apprentice', minXP: 100 },
  { name: 'Intermediate', minXP: 350 },
  { name: 'Advanced', minXP: 800 },
  { name: 'Expert', minXP: 1800 },
  { name: 'Master', minXP: 4000 },
  { name: 'Grandmaster', minXP: 8000 },
  { name: 'Legend', minXP: 15000 },
];

const DASHBOARD_PATTERN_CACHE_TTL_MS = 10 * 60 * 1000;
let dashboardPatternCatalogCache = {
  fetchedAt: 0,
  patternMap: new Map(),
  problemCountByPatternId: new Map(),
};

export const getDashboardPatternCatalog = async () => {
  const now = Date.now();
  if (
    dashboardPatternCatalogCache.fetchedAt &&
    now - dashboardPatternCatalogCache.fetchedAt < DASHBOARD_PATTERN_CACHE_TTL_MS
  ) {
    return dashboardPatternCatalogCache;
  }

  const [patternsResult, problemsResult] = await Promise.all([
    supabaseAdmin.from('patterns').select('id, name'),
    supabaseAdmin.from('problems').select('pattern_id'),
  ]);

  if (patternsResult.error) throw patternsResult.error;
  if (problemsResult.error) throw problemsResult.error;

  const patternMap = new Map();
  (patternsResult.data || []).forEach((pattern) => {
    patternMap.set(pattern.id, pattern);
  });

  const problemCountByPatternId = new Map();
  (problemsResult.data || []).forEach((problem) => {
    const patternId = problem.pattern_id;
    if (!patternId) return;
    problemCountByPatternId.set(
      patternId,
      (problemCountByPatternId.get(patternId) || 0) + 1
    );
  });

  dashboardPatternCatalogCache = {
    fetchedAt: now,
    patternMap,
    problemCountByPatternId,
  };

  return dashboardPatternCatalogCache;
};

export const getLevelInfo = (xp) => {
  const safeXP = Number(xp) || 0;
  for (let index = LEVELS.length - 1; index >= 0; index -= 1) {
    if (safeXP >= LEVELS[index].minXP) {
      return { ...LEVELS[index], index };
    }
  }
  return { ...LEVELS[0], index: 0 };
};

export const getLevelProgressInfo = (xp) => {
  const totalXP = Number(xp) || 0;
  const currentLevel = getLevelInfo(totalXP);
  const nextLevel = LEVELS[currentLevel.index + 1] || null;

  if (!nextLevel) {
    return {
      currentLevel,
      currentXP: totalXP,
      nextLevelXP: totalXP,
      rank: currentLevel.name,
    };
  }

  return {
    currentLevel,
    currentXP: totalXP - currentLevel.minXP,
    nextLevelXP: nextLevel.minXP,
    rank: currentLevel.name,
  };
};

export const getWeekRange = (offsetWeeks = 0) => {
  const start = new Date();
  start.setDate(start.getDate() - start.getDay() - offsetWeeks * 7);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return { start, end };
};

export const buildWeeklyStats = (submissions, start, end) => {
  const accepted = (submissions || []).filter((submission) => {
    const submittedAt = new Date(submission.submitted_at);
    return submission.status === 'accepted' && submittedAt >= start && submittedAt < end;
  });

  const totals = accepted.reduce(
    (accumulator, submission) => {
      const difficulty = String(submission.problems?.difficulty || '').toLowerCase();
      const executionTime = Number(submission.execution_time) || 0;

      accumulator.problems += 1;
      accumulator.timeHours += executionTime / 3600;
      accumulator.xp += XP_BY_DIFFICULTY[difficulty] || XP_BY_DIFFICULTY.easy;
      return accumulator;
    },
    { problems: 0, timeHours: 0, xp: 0 }
  );

  return {
    problems: totals.problems,
    time: Number(totals.timeHours.toFixed(1)),
    xp: totals.xp,
  };
};

export const getStableDailySeed = () => {
  const now = new Date();
  return Number(
    `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`
  );
};

export const pickDeterministicItems = (items, count, seed) => {
  if (!Array.isArray(items) || items.length === 0 || count <= 0) return [];

  const used = new Set();
  const result = [];
  let cursor = Math.abs(seed) % items.length;

  while (result.length < count && used.size < items.length) {
    if (!used.has(cursor)) {
      used.add(cursor);
      result.push(items[cursor]);
    }
    cursor = (cursor + 17) % items.length;
  }

  return result;
};

export const buildUpcomingItemsFromCalendar = (events = []) => {
  const now = new Date();

  return (events || [])
    .filter((evt) => {
      if (!evt?.event_date) return false;
      const eventDate = new Date(`${evt.event_date}T${evt.event_time || '00:00'}:00`);
      return eventDate >= now;
    })
    .sort((a, b) => {
      const left = new Date(`${a.event_date}T${a.event_time || '00:00'}:00`).getTime();
      const right = new Date(`${b.event_date}T${b.event_time || '00:00'}:00`).getTime();
      return left - right;
    })
    .slice(0, 8)
    .map((evt) => {
      const date = new Date(`${evt.event_date}T${evt.event_time || '00:00'}:00`);
      const rawTag = String(evt.tag || '').toLowerCase();

      let platform = 'PrepLoop';
      let icon = '📌';
      if (rawTag === 'contest') {
        platform = 'Contest';
        icon = '🏆';
      } else if (rawTag === 'interview') {
        platform = 'Interview';
        icon = '🎤';
      } else if (rawTag === 'deadline') {
        platform = 'Deadline';
        icon = '⏳';
      }

      return {
        platform,
        icon,
        name: evt.title,
        date: date.toISOString(),
        duration: evt.event_time || 'Scheduled',
        link: null,
        live: true,
      };
    });
};

export const fetchSqlProblemRecommendations = async (limit = 250) => {
  const candidates = [
    { table: 'sql_problems', select: 'id, title, difficulty' },
    { table: 'sql_challenges', select: 'id, title, difficulty' },
    { table: 'sql_questions', select: 'id, title, difficulty' },
    { table: 'problems_sql', select: 'id, title, difficulty' },
  ];

  for (const candidate of candidates) {
    const { data, error } = await supabaseAdmin
      .from(candidate.table)
      .select(candidate.select)
      .limit(limit);

    if (error || !Array.isArray(data) || data.length === 0) {
      continue;
    }

    const normalized = data
      .map((row, index) => ({
        id: row.id ?? index + 1,
        title: String(row.title || '').trim(),
        difficulty: row.difficulty || 'Medium',
      }))
      .filter((row) => row.title.length > 0);

    if (normalized.length > 0) {
      return normalized;
    }
  }

  return [];
};

/**
 * Fetch and aggregate comprehensive dashboard data for a user
 */
export async function getComprehensiveUserStats(userId) {
  const sqlProblemsPromise = fetchSqlProblemRecommendations(250);

  const [
    progressResult,
    submissionsResult,
    interviewsResult,
    sessionInterviewsResult,
    resumesResult,
    dailyProblemsResult,
    calendarEventsResult,
    sqlProblems,
  ] = await Promise.all([
    supabaseAdmin.from('user_progress').select('problem_id, status').eq('user_id', userId),
    supabaseAdmin
      .from('submissions')
      .select('submitted_at, status, problem_id, execution_time, problems(title, difficulty)')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false }),
    supabaseAdmin
      .from('mock_interviews')
      .select('id, interview_type, overall_score, communication_score, technical_score, problem_solving_score, started_at, completed_at')
      .eq('user_id', userId)
      .order('started_at', { ascending: false }),
    supabaseAdmin
      .from('interview_sessions')
      .select('id, session_id, interview_type, company_focus, difficulty_level, interview_score, communication_clarity_score, technical_depth_score, problem_solving_score, performance_metrics, started_at, completed_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('resume_analyses').select('id').eq('user_id', userId),
    supabaseAdmin.from('problems').select('id, title, difficulty').order('id', { ascending: true }).limit(400),
    supabaseAdmin
      .from('user_calendar_events')
      .select('title, event_date, event_time, tag')
      .eq('user_id', userId)
      .order('event_date', { ascending: true }),
    sqlProblemsPromise,
  ]);

  if (progressResult.error) throw progressResult.error;
  if (submissionsResult.error) throw submissionsResult.error;
  if (interviewsResult.error) throw interviewsResult.error;
  if (resumesResult.error) throw resumesResult.error;
  if (dailyProblemsResult.error) throw dailyProblemsResult.error;

  const progress = progressResult.data || [];
  const subs = submissionsResult.data || [];
  const mockInterviews = interviewsResult.data || [];
  const sessionInterviews = (sessionInterviewsResult?.data || []).map(s => {
    const pm = s.performance_metrics || {};
    return {
      id: s.id,
      interview_type: pm.stage || s.interview_type || 'technical',
      overall_score: s.interview_score ?? pm.overallScore ?? 0,
      communication_score: s.communication_clarity_score ?? pm.scores?.[0] ?? s.interview_score ?? 0,
      technical_score: s.technical_depth_score ?? pm.scores?.[1] ?? s.interview_score ?? 0,
      problem_solving_score: s.problem_solving_score ?? pm.scores?.[2] ?? s.interview_score ?? 0,
      started_at: s.started_at || s.created_at,
      completed_at: s.completed_at || s.created_at,
    };
  });
  const interviews = [...mockInterviews, ...sessionInterviews];
  const resumes = resumesResult.data || [];
  const allProblems = dailyProblemsResult.data || [];
  const calendarEvents = calendarEventsResult.error ? [] : calendarEventsResult.data || [];

  const solvedCount = progress.filter((p) => p.status === 'solved').length;
  const completedInterviews = interviews.filter((i) => i.completed_at);

  // Streak calculation
  const activityResult = await supabaseAdmin
    .from('user_activity')
    .select('date, seconds_active')
    .eq('user_id', userId)
    .gte('seconds_active', 60);

  const activityDates = (activityResult.data || []).map((activity) => activity.date);
  const submissionDates = subs.map((submission) => submission.submitted_at);

  const { currentStreak, bestStreak, weekProgress } = calculateDashboardStreak({
    submissionDateKeys: submissionDates,
    activityDateValues: activityDates,
  });

  try {
    await supabaseAdmin
      .from('profiles')
      .update({
        daily_streak: currentStreak,
        best_streak: Math.max(bestStreak, currentStreak),
        last_active_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', userId);
  } catch (updateError) {
    console.error('Error updating profile streak:', updateError);
  }

  // Average interview score
  let avgScore = 0;
  if (completedInterviews.length > 0) {
    const totalScore = completedInterviews.reduce((sum, i) => sum + (i.overall_score || 0), 0);
    avgScore = Math.round(totalScore / completedInterviews.length);
  }

  // Total XP
  const acceptedSubmissions = subs.filter((submission) => submission.status === 'accepted');
  const totalProblemXP = acceptedSubmissions.reduce((sum, submission) => {
    const difficulty = String(submission.problems?.difficulty || '').toLowerCase();
    return sum + (XP_BY_DIFFICULTY[difficulty] || XP_BY_DIFFICULTY.easy);
  }, 0);
  const totalXP = totalProblemXP + completedInterviews.length * 50;

  // Heatmap data
  const heatmapData = {};
  let totalSolvedYear = 0;
  let todaySolved = 0;
  const todayStr = new Date().toISOString().split('T')[0];
  subs.forEach((s) => {
    if (s.status !== 'accepted') return;
    const dateKey = new Date(s.submitted_at).toISOString().split('T')[0];
    if (!heatmapData[dateKey]) {
      heatmapData[dateKey] = { solved: 0, xp: 0, easy: 0, medium: 0, hard: 0 };
    }
    heatmapData[dateKey].solved++;
    heatmapData[dateKey].xp += 25;
    const diff = s.problems?.difficulty?.toLowerCase();
    if (diff === 'easy') heatmapData[dateKey].easy++;
    else if (diff === 'medium') heatmapData[dateKey].medium++;
    else if (diff === 'hard') heatmapData[dateKey].hard++;
    totalSolvedYear++;
    if (dateKey === todayStr) todaySolved++;
  });

  // Daily challenge selection
  const solvedProblemIds = new Set(
    progress.filter((p) => p.status === 'solved').map((p) => p.problem_id)
  );
  const unsolvedProblems = allProblems.filter((problem) => !solvedProblemIds.has(problem.id));
  const dailyPool = unsolvedProblems.length > 0 ? unsolvedProblems : allProblems;
  const dailySeed = getStableDailySeed() + Number(userId?.length || 0);

  const dailyDsa = pickDeterministicItems(dailyPool, 3, dailySeed).map((problem) => ({
    title: problem.title,
    difficulty: problem.difficulty || 'Medium',
    internalId: problem.id,
  }));

  const dailySql = pickDeterministicItems(sqlProblems, 3, dailySeed + 97).map((problem) => ({
    title: problem.title,
    difficulty: problem.difficulty || 'Medium',
    internalId: problem.id,
  }));

  const dailyChallenge = {
    name: 'Personalized DSA Challenge',
    type: 'From Your DB Progress',
    dsa: dailyDsa,
    sql: dailySql,
  };

  const upcomingContests = buildUpcomingItemsFromCalendar(calendarEvents);

  // Skill breakdown
  const skillBreakdown = { dsa: 0, sql: 0, aptitude: 0, systemDesign: 0, behavioral: 0 };
  skillBreakdown.dsa = solvedCount > 0 ? Math.min(100, solvedCount) : 0;
  const sqlInterviews = completedInterviews.filter((i) => i.interview_type?.toLowerCase().includes('sql'));
  const aptitudeInterviews = completedInterviews.filter((i) => i.interview_type?.toLowerCase().includes('aptitude'));
  const sysDesignInterviews = completedInterviews.filter(
    (i) => i.interview_type?.toLowerCase().includes('system') || i.interview_type?.toLowerCase().includes('design')
  );
  const behavioralInterviews = completedInterviews.filter(
    (i) => i.interview_type?.toLowerCase().includes('behavioral') || i.interview_type?.toLowerCase().includes('hr')
  );

  if (sqlInterviews.length > 0) {
    skillBreakdown.sql = Math.round(sqlInterviews.reduce((s, i) => s + (i.overall_score || 0), 0) / sqlInterviews.length);
  }
  if (aptitudeInterviews.length > 0) {
    skillBreakdown.aptitude = Math.round(aptitudeInterviews.reduce((s, i) => s + (i.overall_score || 0), 0) / aptitudeInterviews.length);
  }
  if (sysDesignInterviews.length > 0) {
    skillBreakdown.systemDesign = Math.round(
      sysDesignInterviews.reduce((s, i) => s + (i.overall_score || 0), 0) / sysDesignInterviews.length
    );
  }
  if (behavioralInterviews.length > 0) {
    skillBreakdown.behavioral = Math.round(
      behavioralInterviews.reduce((s, i) => s + (i.overall_score || 0), 0) / behavioralInterviews.length
    );
  }

  // Topic progress
  const topicProgressMap = {};
  const patternColors = [
    '#a78bfa', '#38bdf8', '#22c55e', '#f59e0b', '#fb923c',
    '#ec4899', '#14b8a6', '#ef4444', '#8b5cf6', '#06b6d4',
  ];
  const [catalog, solvedProblemPatternsResult] = await Promise.all([
    getDashboardPatternCatalog(),
    solvedProblemIds.size > 0
      ? supabaseAdmin.from('problems').select('id, pattern_id').in('id', [...solvedProblemIds])
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (solvedProblemPatternsResult.error) throw solvedProblemPatternsResult.error;

  const solvedCountByPatternId = new Map();
  (solvedProblemPatternsResult.data || []).forEach((problem) => {
    const patternId = problem.pattern_id;
    if (!patternId) return;
    solvedCountByPatternId.set(patternId, (solvedCountByPatternId.get(patternId) || 0) + 1);
  });

  Array.from(catalog.patternMap.values()).forEach((pattern, idx) => {
    const total = catalog.problemCountByPatternId.get(pattern.id) || 0;
    if (total === 0) return;

    topicProgressMap[pattern.name] = {
      name: pattern.name,
      solved: solvedCountByPatternId.get(pattern.id) || 0,
      total,
      color: patternColors[idx % patternColors.length],
    };
  });

  const topicProgress = Object.values(topicProgressMap);

  // Recent activity
  const recentActivity = [];
  subs.slice(0, 6).forEach((s) => {
    recentActivity.push({
      type: s.status === 'accepted' ? 'problem_solved' : 'dsa_practice',
      title: s.problems?.title ? `${s.problems.title} — ${s.status === 'accepted' ? 'Accepted' : 'Attempted'}` : 'Problem submission',
      timestamp: s.submitted_at,
    });
  });

  completedInterviews.slice(0, 4).forEach((i) => {
    recentActivity.push({
      type: 'interview_done',
      title: `Mock Interview: ${i.interview_type || 'General'} — ${i.overall_score ? i.overall_score + '%' : 'Completed'}`,
      timestamp: i.completed_at || i.started_at,
    });
  });

  recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const recentActivityFinal = recentActivity.slice(0, 6);

  // Weekly stats
  const thisWeekRange = getWeekRange(0);
  const lastWeekRange = getWeekRange(1);

  const thisWeekAccepted = subs.filter((submission) => {
    const submittedAt = new Date(submission.submitted_at);
    return submission.status === 'accepted' && submittedAt >= thisWeekRange.start && submittedAt < thisWeekRange.end;
  });

  const weeklyByDifficulty = thisWeekAccepted.reduce(
    (accumulator, submission) => {
      const difficulty = String(submission.problems?.difficulty || '').toLowerCase();
      if (difficulty === 'hard') accumulator.hard += 1;
      else if (difficulty === 'medium') accumulator.medium += 1;
      else accumulator.easy += 1;
      return accumulator;
    },
    { easy: 0, medium: 0, hard: 0 }
  );

  const thisWeek = buildWeeklyStats(subs, thisWeekRange.start, thisWeekRange.end);
  const lastWeek = buildWeeklyStats(subs, lastWeekRange.start, lastWeekRange.end);
  const levelInfo = getLevelProgressInfo(totalXP);

  const readinessData = {
    practiceCount: solvedCount,
    mockCount: completedInterviews.length,
    streak: currentStreak,
    timedSessions: subs.filter((s) => s.status === 'accepted').length,
  };

  const sessionsByDate = {};
  subs.forEach((submission) => {
    if (submission.status !== 'accepted') return;
    const dayKey = new Date(submission.submitted_at).toISOString().split('T')[0];
    sessionsByDate[dayKey] = (sessionsByDate[dayKey] || 0) + 1;
  });

  const pomodoroDates = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    pomodoroDates.push(day.toISOString().split('T')[0]);
  }

  const pomodoroStats = {
    sessionsToday: sessionsByDate[todayStr] || 0,
    sessionsByDate: pomodoroDates.reduce((accumulator, key) => {
      accumulator[key] = sessionsByDate[key] || 0;
      return accumulator;
    }, {}),
  };

  return {
    stats: {
      problemsSolved: solvedCount,
      problems_solved: solvedCount,
      totalSubmissions: subs.length,
      mockInterviews: completedInterviews.length,
      mock_interviews_completed: completedInterviews.length,
      resumesAnalyzed: resumes.length,
      avg_score: avgScore,
      avgScore: avgScore,
    },
    streak: currentStreak,
    bestStreak,
    weekProgress,
    avgScore,
    totalXP,
    heatmapData,
    totalSolvedYear,
    todaySolved,
    skillBreakdown,
    topicProgress,
    recentActivity: recentActivityFinal,
    weeklyGoals: weeklyByDifficulty,
    readinessData,
    thisWeekProblems: thisWeek.problems,
    lastWeekProblems: lastWeek.problems,
    thisWeekTime: thisWeek.time,
    lastWeekTime: lastWeek.time,
    thisWeekXP: thisWeek.xp,
    lastWeekXP: lastWeek.xp,
    currentLevel: levelInfo.currentLevel.index + 1,
    currentXP: levelInfo.currentXP,
    nextLevelXP: levelInfo.nextLevelXP,
    rank: levelInfo.rank,
    dailyChallenge,
    upcomingContests,
    pomodoroStats,
  };
}

/**
 * Fetch chronological session history for a user
 */
export async function fetchUserHistory(userId) {
  const sessions = [];

  const [interviewsResult, sessionInterviewsResult, submissionsResult, resumesResult] = await Promise.all([
    supabaseAdmin
      .from('mock_interviews')
      .select('id, interview_type, overall_score, started_at, completed_at, company, role')
      .eq('user_id', userId)
      .order('started_at', { ascending: false }),
    supabaseAdmin
      .from('interview_sessions')
      .select('id, session_id, interview_type, company_focus, difficulty_level, interview_score, performance_metrics, started_at, completed_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('submissions')
      .select('id, submitted_at, status, problems(title, difficulty)')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false }),
    supabaseAdmin
      .from('resume_analyses')
      .select('id, created_at, overall_score')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ]);

  const recordedInterviewTimes = new Set();

  if (sessionInterviewsResult.data) {
    sessionInterviewsResult.data.forEach((i) => {
      const completedTime = i.completed_at || i.created_at;
      if (!completedTime) return;
      const pm = i.performance_metrics || {};
      const company = i.company_focus || pm.company;
      const role = pm.role;

      let titleStr = 'AI Interview';
      if (company && role) titleStr = `${company} ${role} Interview`;
      else if (i.interview_type) titleStr = `${i.interview_type} Interview`;

      let durationStr = 'N/A';
      if (i.started_at && completedTime) {
        const ds = new Date(i.started_at);
        const de = new Date(completedTime);
        const mins = Math.max(1, Math.round((de - ds) / 60000));
        durationStr = `${mins} min`;
      } else if (pm.duration) {
        const mins = Math.max(1, Math.round(pm.duration / 60));
        durationStr = `${mins} min`;
      }

      const ts = new Date(completedTime).getTime();
      recordedInterviewTimes.add(Math.round(ts / 10000));

      sessions.push({
        id: String(i.session_id || i.id),
        type: 'interview',
        title: titleStr,
        date: new Date(completedTime).toISOString().split('T')[0],
        timestamp: ts,
        score: i.interview_score ?? pm.overallScore ?? 0,
        duration: durationStr,
      });
    });
  }

  if (interviewsResult.data) {
    interviewsResult.data.forEach((i) => {
      if (!i.completed_at) return;
      const ts = new Date(i.completed_at).getTime();
      const timeBucket = Math.round(ts / 10000);
      if (recordedInterviewTimes.has(timeBucket)) return; // Deduplicate mirrored session

      let titleStr = 'AI Interview';
      if (i.company && i.role) titleStr = `${i.company} ${i.role} Interview`;
      else if (i.interview_type) titleStr = `${i.interview_type} Interview`;

      let durationStr = 'N/A';
      if (i.started_at && i.completed_at) {
        const ds = new Date(i.started_at);
        const de = new Date(i.completed_at);
        const mins = Math.max(1, Math.round((de - ds) / 60000));
        durationStr = `${mins} min`;
      }

      sessions.push({
        id: String(i.id),
        type: 'interview',
        title: titleStr,
        date: new Date(i.completed_at).toISOString().split('T')[0],
        timestamp: ts,
        score: i.overall_score || 0,
        duration: durationStr,
      });
    });
  }

  if (submissionsResult.data) {
    submissionsResult.data.forEach((s) => {
      sessions.push({
        id: `practice_${s.id}`,
        type: 'practice',
        title: s.problems?.title ? `${s.problems.title} - ${s.status}` : `Practice - ${s.status}`,
        date: new Date(s.submitted_at).toISOString().split('T')[0],
        timestamp: new Date(s.submitted_at).getTime(),
        score: s.status === 'accepted' ? 100 : 0,
        duration: 'N/A',
      });
    });
  }

  if (resumesResult.data) {
    resumesResult.data.forEach((r) => {
      sessions.push({
        id: `resume_${r.id}`,
        type: 'resume',
        title: 'Resume ATS Analysis',
        date: new Date(r.created_at).toISOString().split('T')[0],
        timestamp: new Date(r.created_at).getTime(),
        score: Math.round(r.overall_score) || 0,
        duration: 'N/A',
      });
    });
  }

  sessions.sort((a, b) => b.timestamp - a.timestamp);
  return sessions;
}

/**
 * Fetch problem progress map for user
 */
export async function fetchUserProgress(userId) {
  const { data, error } = await supabaseAdmin
    .from('user_progress')
    .select('problem_id, status')
    .eq('user_id', userId);

  if (error) throw error;

  const progress = {};
  (data || []).forEach((row) => {
    progress[`problem_${row.problem_id}`] = {
      solved: row.status === 'solved',
      progress: row.status === 'solved' ? 100 : 0,
    };
  });

  return progress;
}

