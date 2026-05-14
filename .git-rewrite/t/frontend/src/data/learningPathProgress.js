// Learning Path Progress — localStorage-based tracking
const STORAGE_KEY = 'preploop_learning_progress';
const STREAK_KEY = 'preploop_learning_streak';

const load = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
};
const save = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

export const getTopicProgress = (topicId) => {
  const all = load();
  const tp = all[topicId] || { theoryComplete: false, methodsLearned: [], shortcutsLearned: [], attempts: [] };
  const correct = tp.attempts.filter(a => a.correct).length;
  const total = tp.attempts.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const uniqueSolved = new Set(tp.attempts.filter(a => a.correct).map(a => a.questionId)).size;

  let mastery = 0;
  if (tp.theoryComplete) mastery += 25;
  mastery += Math.min(25, (tp.methodsLearned.length / 3) * 25);
  mastery += Math.min(25, (tp.shortcutsLearned.length / 4) * 25);
  mastery += Math.min(25, (accuracy / 100) * 25);

  return { ...tp, accuracy, uniqueSolved, problemsSolved: total, masteryPercent: Math.round(mastery) };
};

export const markTheoryComplete = (topicId) => {
  const all = load();
  if (!all[topicId]) all[topicId] = { theoryComplete: false, methodsLearned: [], shortcutsLearned: [], attempts: [] };
  all[topicId].theoryComplete = true;
  save(all);
};

export const markMethodLearned = (topicId, methodId) => {
  const all = load();
  if (!all[topicId]) all[topicId] = { theoryComplete: false, methodsLearned: [], shortcutsLearned: [], attempts: [] };
  if (!all[topicId].methodsLearned.includes(methodId)) all[topicId].methodsLearned.push(methodId);
  save(all);
};

export const markShortcutLearned = (topicId, shortcutId) => {
  const all = load();
  if (!all[topicId]) all[topicId] = { theoryComplete: false, methodsLearned: [], shortcutsLearned: [], attempts: [] };
  if (!all[topicId].shortcutsLearned.includes(shortcutId)) all[topicId].shortcutsLearned.push(shortcutId);
  save(all);
};

export const recordPracticeAttempt = (topicId, questionId, correct, timeTaken) => {
  const all = load();
  if (!all[topicId]) all[topicId] = { theoryComplete: false, methodsLearned: [], shortcutsLearned: [], attempts: [] };
  all[topicId].attempts.push({ questionId, correct, timeTaken, date: new Date().toISOString() });
  save(all);
  recordDailyActivity();
};

export const getOverallProgress = (topicIds) => {
  let totalMastery = 0;
  let totalSolved = 0;
  let totalCorrect = 0;
  topicIds.forEach(id => {
    const p = getTopicProgress(id);
    totalMastery += p.masteryPercent;
    totalSolved += p.problemsSolved;
    totalCorrect += p.attempts.filter(a => a.correct).length;
  });
  return {
    avgMastery: topicIds.length > 0 ? Math.round(totalMastery / topicIds.length) : 0,
    totalSolved,
    totalCorrect,
    accuracy: totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0,
    topicsMastered: topicIds.filter(id => getTopicProgress(id).masteryPercent >= 90).length
  };
};

export const recordDailyActivity = () => {
  try {
    const streak = JSON.parse(localStorage.getItem(STREAK_KEY)) || { dates: [], current: 0 };
    const today = new Date().toISOString().split('T')[0];
    if (!streak.dates.includes(today)) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      streak.dates.push(today);
      streak.current = streak.dates.includes(yesterday) ? streak.current + 1 : 1;
      localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
    }
  } catch {}
};

export const getStreakDays = () => {
  try {
    const streak = JSON.parse(localStorage.getItem(STREAK_KEY)) || { dates: [], current: 0 };
    return streak.current;
  } catch { return 0; }
};
