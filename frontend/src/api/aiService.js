/**
 * AI Features API Service
 * Wrapper functions for all AI features endpoints
 */

import { buildApiUrl, normalizeRelativePath } from '../utils/safeApiUrl';
import { API_URL } from '../config/api.js';

// Fix #13: normalize base URL — strip trailing /api if present so we can append it consistently
const _rawApiUrl = API_URL;

function buildAiFeaturesUrl(endpoint) {
  const safeEndpoint = normalizeRelativePath(endpoint);
  return buildApiUrl(`/ai-features${safeEndpoint}`, { rawBaseUrl: _rawApiUrl, apiPrefix: '/api' });
}

function buildApiRootUrl(endpoint) {
  const safeEndpoint = normalizeRelativePath(endpoint);
  return buildApiUrl(safeEndpoint, { rawBaseUrl: _rawApiUrl, apiPrefix: '/api' });
}

function toTenScale(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  if (value <= 10) return Number(value.toFixed(1));
  return Number((value / 10).toFixed(1));
}

function toPerformanceLevel(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) return 'N/A';
  if (score >= 9) return 'Excellent';
  if (score >= 7.5) return 'Good';
  if (score >= 6) return 'Fair';
  return 'Needs Work';
}

function normalizeStagePlan(stagePlan) {
  if (!Array.isArray(stagePlan)) return [];

  return stagePlan
    .map((stage) => {
      if (typeof stage === 'string' && stage.trim()) {
        return { key: stage.trim(), label: stage.trim() };
      }

      if (stage && typeof stage === 'object' && typeof stage.key === 'string') {
        return {
          key: stage.key,
          label: typeof stage.label === 'string' && stage.label.trim() ? stage.label : stage.key,
        };
      }

      return null;
    })
    .filter(Boolean);
}

function mapCodeReview(raw) {
  if (!raw || typeof raw !== 'object') return raw;

  const correctness = toTenScale(raw.correctness_score);
  const efficiency = toTenScale(raw.efficiency_score);
  const readability = toTenScale(raw.communication_score);
  const overall = toTenScale(raw.overall_score);

  const suggestions = Array.isArray(raw.optimization_suggestions)
    ? raw.optimization_suggestions.map((item) => item?.description || item?.title).filter(Boolean)
    : [];

  return {
    ...raw,
    overall_score: overall,
    performance_level: raw.performance_level || toPerformanceLevel(overall || 0),
    scores: {
      correctness: correctness ?? 0,
      efficiency: efficiency ?? 0,
      readability: readability ?? 0,
      best_practices: efficiency ?? 0
    },
    feedback: {
      strengths: Array.isArray(raw.strengths) ? raw.strengths : [],
      improvements: Array.isArray(raw.improvements) ? raw.improvements : [],
      suggestions,
      code_snippets: raw.pattern_explanations || {}
    }
  };
}

function mapInterviewStart(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const stagePlan = normalizeStagePlan(raw.stagePlan);
  return {
    ...raw,
    sessionId: raw.sessionId || raw.session_id,
    session_id: raw.session_id || raw.sessionId,
    stagePlan,
    interviewMode: raw.interviewMode || raw.interview_mode || 'full_realtime',
    runtime: raw.runtime || null,
    status: raw.status || 'in_progress',
    interviewer: raw.interviewer || raw.interviewerGreeting || 'AI Interviewer',
    initial_question:
      raw.initial_question ||
      raw.initialQuestion ||
      raw.problem?.statement ||
      raw.problem_statement ||
      'Let us begin. Walk me through your approach to the problem.'
  };
}

function mapInterviewResponse(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const stagePlan = normalizeStagePlan(raw.stagePlan);
  const currentScores = raw.current_scores || raw.scores || null;
  return {
    ...raw,
    sessionId: raw.sessionId || raw.session_id,
    stagePlan,
    follow_up: raw.follow_up || raw.interviewerMessage || raw.message || null,
    interviewMode: raw.interviewMode || raw.interview_mode || 'full_realtime',
    runtime: raw.runtime || null,
    continueInterview: typeof raw.continueInterview === 'boolean' ? raw.continueInterview : true,
    current_scores: currentScores,
    adaptive_update: raw.adaptive_update || null
  };
}

function mapInterviewModes(raw) {
  if (!raw || typeof raw !== 'object') return raw;

  return {
    defaultMode: raw.defaultMode || 'full_realtime',
    supportedModes: Array.isArray(raw.supportedModes)
      ? raw.supportedModes
      : ['full_realtime'],
    description: raw.description || {}
  };
}

function mapInterviewTranscript(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      const role = item?.role || item?.type || 'system';
      const content = item?.text || item?.content || '';
      const timestamp = item?.timestamp ? new Date(item.timestamp) : new Date();

      if (!content) return null;

      return {
        type: role === 'candidate' ? 'user' : role === 'interviewer' ? 'interviewer' : 'system',
        content,
        timestamp,
      };
    })
    .filter(Boolean);
}

function mapInterviewCompletion(raw) {
  if (!raw || typeof raw !== 'object') return raw;

  const hasFinalScore = typeof raw.interview_score === 'number' && !Number.isNaN(raw.interview_score);
  const transcript = mapInterviewTranscript(raw.transcript);

  if (!hasFinalScore) {
    return {
      ...raw,
      sessionId: raw.sessionId || raw.session_id || raw.id,
      session_id: raw.session_id || raw.id,
      transcript,
      stagePlan: normalizeStagePlan(raw.interview_context?.stagePlan),
      final_scores: null,
      scores: raw.interview_context?.currentScores || null
    };
  }

  const overall = toTenScale(raw.interview_score);
  const finalScores = {
    overall: overall ?? 0,
    communication: toTenScale(raw.communication_clarity_score) ?? 0,
    problem_solving: toTenScale(raw.problem_solving_score) ?? 0,
    technical_depth: toTenScale(raw.technical_depth_score) ?? 0,
    performance_level: toPerformanceLevel(overall ?? 0)
  };

  return {
    ...raw,
    sessionId: raw.sessionId || raw.session_id || raw.id,
    session_id: raw.session_id || raw.id,
    transcript,
    stagePlan: normalizeStagePlan(raw.interview_context?.stagePlan),
    final_scores: finalScores,
    scores: finalScores
  };
}

function mapInterviewHistory(items) {
  if (!Array.isArray(items)) return items;
  return items.map((item) => ({
    ...item,
    sessionId: item.sessionId || item.session_id || item.id,
    session_id: item.session_id || item.sessionId || item.id,
    id: item.id || item.sessionId || item.session_id,
    type: item.type || item.interview_type,
    difficulty: item.difficulty || item.difficulty_level,
    score:
      typeof item.score === 'number'
        ? item.score
        : toTenScale(item.interview_score)
  }));
}

function mapTrends(raw) {
  if (!raw) return raw;

  // If backend already returns aggregated object, keep it.
  if (!Array.isArray(raw)) return raw;

  const totalAttempts = raw.reduce((acc, row) => acc + (row.interview_count || 0), 0);

  const categories = raw.reduce((acc, row) => {
    const key = row.interview_type || 'unknown';
    acc[key] = {
      average_score: toTenScale(Number(row.avg_score || 0)) || 0,
      interview_count: row.interview_count || 0
    };
    return acc;
  }, {});

  const sorted = Object.entries(categories).sort((a, b) => b[1].average_score - a[1].average_score);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  const avgScoreRaw = raw.length
    ? raw.reduce((acc, row) => acc + Number(row.avg_score || 0), 0) / raw.length
    : 0;

  return {
    total_attempts: totalAttempts,
    average_score: toTenScale(avgScoreRaw) || 0,
    score_trend: 'up',
    best_category: best?.[0] || null,
    best_category_score: best?.[1]?.average_score || 0,
    needs_work_category: worst?.[0] || null,
    needs_work_score: worst?.[1]?.average_score || 0,
    category_breakdown: categories
  };
}

// Fix #3: read token using the same key ('token') that AuthContext stores it under
function getAuthToken() {
  return localStorage.getItem('token') ||
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('auth_token') ||
    null;
}

// Helper: Make authenticated API request
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required. Please log in first.');
  }

  const response = await fetch(buildAiFeaturesUrl(endpoint), {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    if (
      data?.error === 'Insufficient coins' &&
      typeof data?.required === 'number' &&
      typeof data?.coins === 'number'
    ) {
      throw new Error(`Insufficient coins. You need ${data.required} coins, but you have ${data.coins} coins.`);
    }
    throw new Error(data?.message || data?.error || 'Request failed');
  }

  return data;
}

// ============================================================================
// AI INTERVIEW IMPROVEMENT PLAN
// ============================================================================

/**
 * Generate personalized improvement plan based on interview history
 * @param {Object} options - Generation options
 * @param {string[]} options.sessionIds - Optional: specific session IDs to analyze
 * @param {string[]} options.focusAreas - Optional: specific areas to focus on
 * @param {number} options.timeframe - Optional: plan duration in days (default: 7)
 * @returns {Promise<Object>} Generated improvement plan
 */
export async function generateImprovementPlan(options = {}) {
  const { sessionIds, focusAreas, timeframe = 7 } = options;
  
  const response = await apiRequest('/improvement-plan/generate', {
    method: 'POST',
    body: JSON.stringify({ sessionIds, focusAreas, timeframe })
  });

  return response.data;
}

/**
 * Get user's latest improvement plan
 * @returns {Promise<Object|null>} Latest improvement plan or null
 */
export async function getLatestImprovementPlan() {
  const response = await apiRequest('/improvement-plan/latest');
  return response.data;
}

/**
 * Get user's improvement plan history
 * @param {number} limit - Maximum number of plans to retrieve (default: 10)
 * @returns {Promise<Array>} Array of improvement plans
 */
export async function getImprovementPlanHistory(limit = 10) {
  const response = await apiRequest(`/improvement-plan/history?limit=${limit}`);
  return response.data || [];
}

/**
 * Update progress on an improvement plan
 * @param {string} planId - Plan ID
 * @param {Array} completedTasks - Array of completed task objects
 * @param {string} notes - Optional progress notes
 * @returns {Promise<Object>} Updated plan
 */
export async function updateImprovementPlanProgress(planId, completedTasks, notes = '') {
  const response = await apiRequest(`/improvement-plan/${planId}/progress`, {
    method: 'POST',
    body: JSON.stringify({ completedTasks, notes })
  });

  return response.data;
}

// Export all improvement plan functions
export const improvementPlan = {
  generate: generateImprovementPlan,
  getLatest: getLatestImprovementPlan,
  getHistory: getImprovementPlanHistory,
  updateProgress: updateImprovementPlanProgress
};

async function apiRequestAbsolute(endpoint, options = {}) {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Authentication required. Please log in first.');
  }

  const response = await fetch(buildApiRootUrl(endpoint), {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `API Error: ${response.status} ${response.statusText}`);
  }

  return data.data || data;
}

// ============== CODE REVIEW ENDPOINTS ==============

/**
 * Submit code for review
 * @param {number} problemId - The problem ID
 * @param {string} code - The code to review
 * @param {string} language - Programming language (js, python, java, etc.)
 * @returns {promise} Review result with scores and feedback
 */
export async function submitCodeReview(problemId, code, language = 'javascript') {
  const result = await apiRequest('/code-review', {
    method: 'POST',
    body: JSON.stringify({ problemId, code, language })
  });
  return mapCodeReview(result);
}

/**
 * Retrieve a specific code review
 * @param {string} reviewId - UUID of the review
 * @returns {promise} Review details with all scores and feedback
 */
export async function getCodeReview(reviewId) {
  const result = await apiRequest(`/code-review/${reviewId}`);
  return mapCodeReview(result);
}

/**
 * Get all code reviews for a specific problem
 * @param {number} problemId - The problem ID
 * @param {number} page - Page number for pagination (default: 1)
 * @param {number} limit - Items per page (default: 10, max: 50)
 * @returns {promise} Paginated list of reviews for the problem
 */
export async function getCodeReviewsByProblem(problemId, page = 1, limit = 10) {
  const query = new URLSearchParams({ page, limit });
  const result = await apiRequest(`/code-review/problem/${problemId}?${query}`);
  if (Array.isArray(result)) return result.map(mapCodeReview);
  if (Array.isArray(result?.data)) {
    return {
      ...result,
      data: result.data.map(mapCodeReview)
    };
  }
  return result;
}

/**
 * Get user's code review history
 * @param {number} page - Page number for pagination (default: 1)
 * @param {number} limit - Items per page (default: 10, max: 50)
 * @returns {promise} Paginated list of user's code reviews
 */
export async function getCodeReviewHistory(page = 1, limit = 10) {
  const query = new URLSearchParams({ page, limit });
  const result = await apiRequest(`/code-review/history?${query}`);
  if (Array.isArray(result)) return result.map(mapCodeReview);
  if (Array.isArray(result?.data)) {
    return {
      ...result,
      data: result.data.map(mapCodeReview)
    };
  }
  return result;
}

// ============== INTERVIEW ENDPOINTS ==============

/**
 * Start a new interview session
 * @param {string} interviewType - Type: 'dsa', 'system_design', 'behavioral', or 'mixed'
 * @param {string} difficulty - Level: 'easy', 'medium', or 'hard'
 * @param {string} companyFocus - Optional company name (e.g., 'Google', 'Amazon')
 * @returns {promise} Session ID and initial problem statement
 */
export async function startInterview(interviewType, difficulty, companyFocus = null, interviewMode = null) {
  const result = await apiRequest('/interview/start', {
    method: 'POST',
    body: JSON.stringify({ interviewType, difficulty, companyFocus, interviewMode })
  });
  return mapInterviewStart(result);
}

/**
 * Submit a response to an interview question
 * @param {string} sessionId - UUID of the interview session
 * @param {string} response - Candidate's response
 * @returns {promise} Interviewer follow-up, feedback, and current scores
 */
export async function submitInterviewResponse(sessionId, response, interviewMode = null) {
  const result = await apiRequest(`/interview/${sessionId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ response, interviewMode })
  });
  return mapInterviewResponse(result);
}

/**
 * Get supported interview runtime modes
 * @returns {promise} Default mode, available modes, and descriptions
 */
export async function getInterviewModes() {
  const result = await apiRequest('/interview/modes');
  return mapInterviewModes(result);
}

/**
 * Complete an interview session
 * @param {string} sessionId - UUID of the interview session
 * @returns {promise} Final scores, comprehensive analysis, and performance level
 */
export async function completeInterview(sessionId) {
  const result = await apiRequest(`/interview/${sessionId}/complete`, {
    method: 'POST'
  });
  return mapInterviewCompletion(result);
}

/**
 * Get interview session details
 * @param {string} sessionId - UUID of the interview session
 * @returns {promise} Full session details including all messages and scores
 */
export async function getInterviewSession(sessionId) {
  const result = await apiRequest(`/interview/${sessionId}`);
  return mapInterviewCompletion(result);
}

/**
 * Get user's interview history
 * @param {number} page - Page number for pagination (default: 1)
 * @param {number} limit - Items per page (default: 10, max: 50)
 * @param {string} status - Optional filter: 'completed' or 'in_progress'
 * @returns {promise} Paginated list of user's interviews
 */
export async function getInterviewHistory(page = 1, limit = 10, status = null) {
  const query = new URLSearchParams({ page, limit });
  if (status) query.append('status', status);
  const result = await apiRequest(`/interview/history?${query}`);
  if (Array.isArray(result)) return mapInterviewHistory(result);
  if (Array.isArray(result?.data)) {
    return {
      ...result,
      data: mapInterviewHistory(result.data)
    };
  }
  return result;
}

/**
 * Get user's performance trends across interviews
 * @param {string} type - Optional filter by interview type: 'dsa', 'system_design', 'behavioral', 'mixed'
 * @returns {promise} Aggregated performance metrics and trends
 */
export async function getPerformanceTrends(type = null) {
  const query = new URLSearchParams();
  if (type) query.append('type', type);
  const result = await apiRequest(`/performance-trends?${query}`);
  return mapTrends(result);
}

// ============== UTILITY ENDPOINTS ==============

/**
 * Get AI features usage statistics
 * @returns {promise} Statistics on feature usage
 */
export async function getAIStats() {
  return apiRequest('/stats');
}

// ============== ERROR HANDLING ==============

/**
 * Format error message for user display
 * @param {Error} error - Error object from API
 * @returns {string} User-friendly error message
 */
export function formatErrorMessage(error) {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    // Remove technical prefixes
    return error.message
      .replace('API Error: ', '')
      .replace('Error: ', '');
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Check if error is authentication-related
 * @param {Error} error - Error object
 * @returns {boolean}
 */
export function isAuthError(error) {
  return error?.message?.includes('401') || 
         error?.message?.includes('Authentication') ||
         error?.message?.includes('Please log in');
}
