import {
  getTurnTransition,
  getSilencePrompt,
  communicationScore as calcCommunication,
  technicalScore as calcTechnical,
  problemSolvingScore as calcProblemSolving,
  codeQualityScore as calcCodeQuality,
  getQuestionTimeLimit,
} from '../pages/aiInterviewTiming';

/**
 * Scoring utilities for interview analysis
 * Centralizes scoring logic for communication, technical, problem-solving
 */
export const InterviewScoring = {
  calculateCommunication: calcCommunication,
  calculateTechnical: calcTechnical,
  calculateProblemSolving: calcProblemSolving,
  calculateCodeQuality: calcCodeQuality,
};

/**
 * Timing utilities for interview flow
 * Determines turn transitions, silence prompts, question time limits
 */
export const InterviewTiming = {
  getTurnTransition,
  getSilencePrompt,
  getQuestionTimeLimit,
};

/**
 * Check if answer contains meaningful code
 */
export function hasMeaningfulCode(code) {
  if (!code || typeof code !== 'string') return false;
  const trimmed = code.trim();
  return trimmed.length > 20 && /[a-zA-Z0-9_]+/.test(trimmed);
}

/**
 * Calculate interview score from component scores
 */
export function calculateOverallScore(scores) {
  const {
    communication = 0,
    technical = 0,
    problemSolving = 0,
    codeQuality = 0,
  } = scores;

  // Weighted average: 25% communication, 25% technical, 25% problem-solving, 25% code quality
  return Math.round(
    (communication + technical + problemSolving + codeQuality) / 4
  );
}

/**
 * Determine interview performance level
 */
export function getPerformanceLevel(score) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Average';
  if (score >= 30) return 'Needs Improvement';
  return 'Poor';
}

/**
 * Format duration in seconds to readable string
 */
export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

/**
 * Validate interview phase transition
 */
export function isValidPhaseTransition(currentPhase, nextPhase) {
  const validTransitions = {
    lobby: ['connecting', 'interview'],
    connecting: ['interview', 'lobby'],
    interview: ['summary', 'lobby'],
    summary: ['lobby'],
  };

  return validTransitions[currentPhase]?.includes(nextPhase) ?? false;
}
