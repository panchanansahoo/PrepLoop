import { COMPANIES, STAGES, ROLES, DIFFICULTIES } from '../data/companyPrepMeta';
import {
  INTERVIEW_LABELS,
  INTERVIEW_PRESETS,
  clampInterviewScore,
  buildInterviewSummaryFallback,
  normalizeFeedbackList,
} from '../pages/companyInterviewConfig';

/**
 * Company interview validation and configuration utilities
 */

/**
 * Validate company interview configuration
 */
export function validateInterviewConfig(config) {
  const errors = [];

  if (!config.company || !COMPANIES.some(c => c.value === config.company)) {
    errors.push('Invalid company selection');
  }

  if (!config.role || !ROLES.some(r => r.value === config.role)) {
    errors.push('Invalid role selection');
  }

  if (!config.stage || !STAGES.some(s => s.value === config.stage)) {
    errors.push('Invalid stage selection');
  }

  if (!config.difficulty || !DIFFICULTIES.some(d => d.value === config.difficulty)) {
    errors.push('Invalid difficulty selection');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get interview preset by name
 */
export function getInterviewPreset(presetName) {
  return INTERVIEW_PRESETS.find(p => p.name === presetName) || null;
}

/**
 * Apply preset configuration to interview config
 */
export function applyPresetToConfig(baseConfig, preset) {
  if (!preset) return baseConfig;

  return {
    ...baseConfig,
    company: preset.company || baseConfig.company,
    role: preset.role || baseConfig.role,
    stage: preset.stage || baseConfig.stage,
    difficulty: preset.difficulty || baseConfig.difficulty,
  };
}

/**
 * Get company metadata
 */
export function getCompanyMetadata(companyValue) {
  return COMPANIES.find(c => c.value === companyValue) || null;
}

/**
 * Calculate interview progress percentage
 */
export function calculateProgress(currentQuestion, totalQuestions) {
  if (totalQuestions <= 0) return 0;
  return Math.round((currentQuestion / totalQuestions) * 100);
}

/**
 * Format score with label
 */
export function formatScoreWithLabel(score) {
  const clamped = clampInterviewScore(score);
  
  if (clamped >= 85) return { label: 'Excellent', value: clamped, color: 'text-green-500' };
  if (clamped >= 70) return { label: 'Good', value: clamped, color: 'text-blue-500' };
  if (clamped >= 50) return { label: 'Average', value: clamped, color: 'text-yellow-500' };
  if (clamped >= 30) return { label: 'Needs Improvement', value: clamped, color: 'text-orange-500' };
  return { label: 'Poor', value: clamped, color: 'text-red-500' };
}

/**
 * Build interview summary from session data
 */
export function buildInterviewSummary(sessionScores, conversation, config) {
  if (!sessionScores || sessionScores.length === 0) {
    return buildInterviewSummaryFallback();
  }

  const lastScore = sessionScores[sessionScores.length - 1];
  
  return {
    overallScore: lastScore.overallScore || 0,
    communicationScore: lastScore.communicationScore || 0,
    technicalScore: lastScore.technicalScore || 0,
    problemSolvingScore: lastScore.problemSolvingScore || 0,
    codeQualityScore: lastScore.codeQualityScore || 0,
    feedback: normalizeFeedbackList(lastScore.feedback || []),
    strengths: extractStrengths(sessionScores),
    improvements: extractImprovements(sessionScores),
    duration: conversation.length > 0 ? 'N/A' : '0m 0s',
  };
}

/**
 * Extract strengths from session scores
 */
export function extractStrengths(sessionScores) {
  if (!sessionScores || sessionScores.length === 0) return [];

  const lastScore = sessionScores[sessionScores.length - 1];
  const strengths = [];

  if (lastScore.communicationScore >= 75) {
    strengths.push('Clear communication');
  }
  if (lastScore.technicalScore >= 75) {
    strengths.push('Strong technical knowledge');
  }
  if (lastScore.problemSolvingScore >= 75) {
    strengths.push('Excellent problem-solving');
  }
  if (lastScore.codeQualityScore >= 75) {
    strengths.push('High-quality code');
  }

  return strengths.length > 0 ? strengths : ['Good overall performance'];
}

/**
 * Extract improvements from session scores
 */
export function extractImprovements(sessionScores) {
  if (!sessionScores || sessionScores.length === 0) return [];

  const lastScore = sessionScores[sessionScores.length - 1];
  const improvements = [];

  if (lastScore.communicationScore < 70) {
    improvements.push('Work on clarity and conciseness');
  }
  if (lastScore.technicalScore < 70) {
    improvements.push('Deepen technical knowledge');
  }
  if (lastScore.problemSolvingScore < 70) {
    improvements.push('Improve problem analysis approach');
  }
  if (lastScore.codeQualityScore < 70) {
    improvements.push('Focus on code optimization');
  }

  return improvements.length > 0 ? improvements : ['Continue practicing'];
}

/**
 * Get recommended next step after interview
 */
export function getNextStepRecommendation(scores) {
  const overallScore = scores?.overallScore || 0;

  if (overallScore >= 80) {
    return 'Excellent performance! You are ready for real interviews.';
  }
  if (overallScore >= 70) {
    return 'Good performance. Practice more complex problems to improve.';
  }
  if (overallScore >= 60) {
    return 'Solid foundation. Work on problem-solving approach.';
  }
  if (overallScore >= 50) {
    return 'Keep practicing. Focus on technical fundamentals.';
  }
  return 'Review concepts and try again with simpler questions.';
}

export default {
  validateInterviewConfig,
  getInterviewPreset,
  applyPresetToConfig,
  getCompanyMetadata,
  calculateProgress,
  formatScoreWithLabel,
  buildInterviewSummary,
  extractStrengths,
  extractImprovements,
  getNextStepRecommendation,
};
