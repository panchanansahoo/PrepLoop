// SQL Learning Path Progress — localStorage-based tracking
const STORAGE_KEY = 'preploop_sql_progress';

const load = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
};
const save = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const defaultProgress = () => ({
  conceptComplete: false,
  thinkingComplete: false,
  tricksComplete: false,
  solvedProblems: [],
  attempts: [],
  lastActivity: null
});

export const getSQLTopicProgress = (topicId) => {
  const all = load();
  const tp = all[topicId] || defaultProgress();
  const solved = new Set(tp.solvedProblems).size;
  const totalAttempts = tp.attempts.length;
  const correct = tp.attempts.filter(a => a.correct).length;
  const accuracy = totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : 0;

  let mastery = 0;
  if (tp.conceptComplete) mastery += 25;
  if (tp.thinkingComplete) mastery += 25;
  if (tp.tricksComplete) mastery += 20;
  mastery += Math.min(30, solved * 3);

  return {
    ...tp,
    accuracy,
    solved,
    totalAttempts,
    masteryPercent: Math.min(100, Math.round(mastery))
  };
};

export const markSQLConceptComplete = (topicId) => {
  const all = load();
  if (!all[topicId]) all[topicId] = defaultProgress();
  all[topicId].conceptComplete = true;
  all[topicId].lastActivity = new Date().toISOString();
  save(all);
};

export const markSQLThinkingComplete = (topicId) => {
  const all = load();
  if (!all[topicId]) all[topicId] = defaultProgress();
  all[topicId].thinkingComplete = true;
  all[topicId].lastActivity = new Date().toISOString();
  save(all);
};

export const markSQLTricksComplete = (topicId) => {
  const all = load();
  if (!all[topicId]) all[topicId] = defaultProgress();
  all[topicId].tricksComplete = true;
  all[topicId].lastActivity = new Date().toISOString();
  save(all);
};

export const recordSQLPracticeAttempt = (topicId, problemId, correct) => {
  const all = load();
  if (!all[topicId]) all[topicId] = defaultProgress();
  all[topicId].attempts.push({ problemId, correct, date: new Date().toISOString() });
  if (correct && !all[topicId].solvedProblems.includes(problemId)) {
    all[topicId].solvedProblems.push(problemId);
  }
  all[topicId].lastActivity = new Date().toISOString();
  save(all);
};

export const getSQLOverallProgress = (topicIds) => {
  let totalMastery = 0, totalSolved = 0, totalCorrect = 0, totalAttempts = 0;
  topicIds.forEach(id => {
    const p = getSQLTopicProgress(id);
    totalMastery += p.masteryPercent;
    totalSolved += p.solved;
    totalCorrect += p.attempts.filter(a => a.correct).length;
    totalAttempts += p.totalAttempts;
  });
  return {
    avgMastery: topicIds.length > 0 ? Math.round(totalMastery / topicIds.length) : 0,
    totalSolved,
    accuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
    topicsMastered: topicIds.filter(id => getSQLTopicProgress(id).masteryPercent >= 90).length,
    topicsStarted: topicIds.filter(id => getSQLTopicProgress(id).masteryPercent > 0).length
  };
};

export const getSQLSkillRadar = (topicIds) => {
  return topicIds.map(id => {
    const p = getSQLTopicProgress(id);
    return { topicId: id, mastery: p.masteryPercent, accuracy: p.accuracy, solved: p.solved };
  });
};

export const resetSQLProgress = () => {
  localStorage.removeItem(STORAGE_KEY);
};
