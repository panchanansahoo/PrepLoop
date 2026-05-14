// DSA Learning Path Progress — localStorage-based tracking
import { DSA_TOPICS } from './dsaLearningPathData';

const STORAGE_KEY = 'preploop_dsa_progress';

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

export const getDSATopicProgress = (topicId) => {
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
  mastery += Math.min(30, solved * 3); // max 30% from practice (10 problems)

  return {
    ...tp,
    accuracy,
    solved,
    totalAttempts,
    masteryPercent: Math.min(100, Math.round(mastery))
  };
};

export const markDSAConceptComplete = (topicId) => {
  const all = load();
  if (!all[topicId]) all[topicId] = defaultProgress();
  all[topicId].conceptComplete = true;
  all[topicId].lastActivity = new Date().toISOString();
  save(all);
  window.dispatchEvent(new CustomEvent('dsaTopicUpdate', { detail: { topicId } }));
};

export const markDSAThinkingComplete = (topicId) => {
  const all = load();
  if (!all[topicId]) all[topicId] = defaultProgress();
  all[topicId].thinkingComplete = true;
  all[topicId].lastActivity = new Date().toISOString();
  save(all);
  window.dispatchEvent(new CustomEvent('dsaTopicUpdate', { detail: { topicId } }));
};

export const markDSATricksComplete = (topicId) => {
  const all = load();
  if (!all[topicId]) all[topicId] = defaultProgress();
  all[topicId].tricksComplete = true;
  all[topicId].lastActivity = new Date().toISOString();
  save(all);
  window.dispatchEvent(new CustomEvent('dsaTopicUpdate', { detail: { topicId } }));
};

export const recordDSAPracticeAttempt = (topicId, problemId, correct) => {
  const all = load();
  if (!all[topicId]) all[topicId] = defaultProgress();
  all[topicId].attempts.push({ problemId, correct, date: new Date().toISOString() });
  if (correct && !all[topicId].solvedProblems.includes(problemId)) {
    all[topicId].solvedProblems.push(problemId);
  }
  all[topicId].lastActivity = new Date().toISOString();
  save(all);
  window.dispatchEvent(new CustomEvent('dsaTopicUpdate', { detail: { topicId } }));
};

export const getDSAOverallProgress = (topicIds) => {
  let totalMastery = 0, totalSolved = 0, totalCorrect = 0, totalAttempts = 0;
  topicIds.forEach(id => {
    const p = getDSATopicProgress(id);
    totalMastery += p.masteryPercent;
    totalSolved += p.solved;
    totalCorrect += p.attempts.filter(a => a.correct).length;
    totalAttempts += p.totalAttempts;
  });
  return {
    avgMastery: topicIds.length > 0 ? Math.round(totalMastery / topicIds.length) : 0,
    totalSolved,
    accuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
    topicsMastered: topicIds.filter(id => getDSATopicProgress(id).masteryPercent >= 90).length,
    topicsStarted: topicIds.filter(id => getDSATopicProgress(id).masteryPercent > 0).length
  };
};

export const getDSASkillRadar = (topicIds) => {
  return topicIds.map(id => {
    const p = getDSATopicProgress(id);
    return { topicId: id, mastery: p.masteryPercent, accuracy: p.accuracy, solved: p.solved };
  });
};

export const resetDSAProgress = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const markProblemAsAttempted = (problemId, correct) => {
  const topic = DSA_TOPICS.find(t => t.practiceProblems && t.practiceProblems.some(p => p.id === problemId));
  if (topic) {
    recordDSAPracticeAttempt(topic.id, problemId, correct);
  }
};
