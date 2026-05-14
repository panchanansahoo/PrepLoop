// System Design progress tracking — mirrors dsaLearningProgress.js
import { SD_TOPICS, SD_PHASES } from './systemDesignData';

const SD_PROGRESS_KEY = 'sd_learning_progress';

function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(SD_PROGRESS_KEY) || '{}');
  } catch { return {}; }
}

function saveProgress(data) {
  localStorage.setItem(SD_PROGRESS_KEY, JSON.stringify(data));
}

export function getSDTopicProgress(topicId) {
  const progress = getProgress();
  return progress[topicId] || { conceptsDone: false, thinkingDone: false, tricksDone: false, theoryDone: false };
}

export function setSDTopicProgress(topicId, field, value) {
  const progress = getProgress();
  if (!progress[topicId]) {
    progress[topicId] = { conceptsDone: false, thinkingDone: false, tricksDone: false, theoryDone: false };
  }
  progress[topicId][field] = value;
  saveProgress(progress);
}

export function isSDTopicComplete(topicId) {
  const p = getSDTopicProgress(topicId);
  return p.conceptsDone && p.thinkingDone && p.tricksDone;
}

export function getSDOverallProgress() {
  const total = SD_TOPICS.length;
  const completed = SD_TOPICS.filter(t => isSDTopicComplete(t.id)).length;
  return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
}

export function getSDPhaseProgress(phaseId) {
  const topics = SD_TOPICS.filter(t => t.stage === phaseId);
  const completed = topics.filter(t => isSDTopicComplete(t.id)).length;
  return { completed, total: topics.length, percentage: topics.length > 0 ? Math.round((completed / topics.length) * 100) : 0 };
}

export function getSDSkillRadar() {
  return SD_PHASES.map(phase => {
    const { percentage } = getSDPhaseProgress(phase.id);
    return { label: phase.name.replace(/Phase \d+: /, ''), value: percentage };
  });
}
