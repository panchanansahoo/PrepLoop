/**
 * Interview UI Configuration
 * Centralizes constants used throughout AIInterviewPage
 */

export const INTERVIEW_PHASES = {
  LOBBY: 'lobby',
  CONNECTING: 'connecting',
  INTERVIEW: 'interview',
  SUMMARY: 'summary',
};

export const INTERVIEW_TYPES = {
  TECHNICAL: 'technical',
  BEHAVIORAL: 'behavioral',
  SYSTEM_DESIGN: 'system-design',
  DSA: 'dsa',
  DATA_SCIENCE: 'data-science',
};

export const INTERVIEW_UI_CONFIG = {
  // Top bar configuration
  topBar: {
    showTimer: true,
    showConnection: true,
    showInterviewer: true,
  },
  
  // Controls configuration
  controls: {
    showMic: true,
    showChat: true,
    showHint: true,
    showCode: true,
  },
  
  // Workspace configuration
  workspace: {
    showCodeEditor: true,
    showNotes: true,
    showScratchpad: true,
  },
  
  // Chat sidebar configuration
  chat: {
    showMessages: true,
    showSuggestions: true,
    maxMessagesVisible: 50,
  },
};

/**
 * Scoring thresholds
 */
export const SCORING_THRESHOLDS = {
  EXCELLENT: 85,
  GOOD: 70,
  AVERAGE: 50,
  NEEDS_IMPROVEMENT: 30,
};

/**
 * Time limits (seconds)
 */
export const TIME_LIMITS = {
  QUESTION_DEFAULT: 120,
  QUESTION_MAX: 300,
  SILENCE_TIMEOUT: 8,
  RESPONSE_MIN: 2,
  MAX_INTERVIEW_DURATION: 3600, // 1 hour
};

/**
 * Connection status values
 */
export const CONNECTION_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
};

/**
 * Mic state values
 */
export const MIC_STATE = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
};

export default {
  INTERVIEW_PHASES,
  INTERVIEW_TYPES,
  INTERVIEW_UI_CONFIG,
  SCORING_THRESHOLDS,
  TIME_LIMITS,
  CONNECTION_STATUS,
  MIC_STATE,
};
