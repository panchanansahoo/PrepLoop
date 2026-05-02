/**
 * Company Interview UI Constants and Configuration
 * Centralizes time limits, UI config, presets, and runtime modes
 */

// Time limits (milliseconds)
export const TIMING_CONFIG = {
  AUTO_SUBMIT_DELAY_MS: 5000,           // Auto-submit after 5 seconds of no input
  SILENCE_TO_NEXT_QUESTION_MS: 8000,    // Move to next question after 8 seconds silence
  VOICE_INPUT_COMMIT_DELAY_MS: 500,     // Debounce voice input by 500ms
  MAX_INTERVIEW_DURATION_MS: 3600000,   // 1 hour max interview time
  QUESTION_TIMEOUT_MS: 120000,          // 2 minutes per question
};

// Interview phases
export const INTERVIEW_PHASE = {
  LOBBY: 'lobby',
  INTERVIEW: 'interview',
  SUMMARY: 'summary',
};

// Interview formats
export const INTERVIEW_FORMAT = {
  VOICE: 'voice',
  VIDEO: 'video',
  TEXT: 'text',
  HYBRID: 'hybrid',
};

// Interview runtime modes
export const INTERVIEW_RUNTIME_MODE = {
  FULL_REALTIME: 'full_realtime',
  VOICE_BRIDGE: 'realtime_voice_bridge',
  ASYNC: 'async_interview',
};

// Advanced options defaults
export const ADVANCED_OPTIONS_DEFAULTS = {
  interviewerIntensity: 'balanced',
  followUpDepth: 'standard',
  answerPace: 'balanced',
  realInterviewerMode: false,
  resumeInterviewMode: 'balanced',
  focusTopics: '',
  questionCount: 8,
};

// Scoring thresholds
export const SCORING_THRESHOLDS = {
  EXCELLENT: 85,
  GOOD: 70,
  AVERAGE: 50,
  NEEDS_IMPROVEMENT: 30,
  POOR: 0,
};

// Interview intensities
export const INTERVIEWER_INTENSITIES = [
  { value: 'relaxed', label: 'Relaxed', description: 'Friendly and supportive' },
  { value: 'balanced', label: 'Balanced', description: 'Professional and fair' },
  { value: 'challenging', label: 'Challenging', description: 'Rigorous and demanding' },
  { value: 'intense', label: 'Intense', description: 'Very challenging' },
];

// Follow-up depths
export const FOLLOWUP_DEPTHS = [
  { value: 'surface', label: 'Surface', description: 'Light follow-ups' },
  { value: 'standard', label: 'Standard', description: 'Normal follow-ups' },
  { value: 'deep', label: 'Deep', description: 'Comprehensive follow-ups' },
];

// Answer paces
export const ANSWER_PACES = [
  { value: 'quick', label: 'Quick', description: 'Fast-paced' },
  { value: 'balanced', label: 'Balanced', description: 'Normal pace' },
  { value: 'slow', label: 'Slow', description: 'Leisurely pace' },
];

// Interview UI layout configuration
export const INTERVIEW_UI_CONFIG = {
  // Top bar elements
  topBar: {
    showCompanyLogo: true,
    showTimer: true,
    showQuestionCount: true,
    showConnectionStatus: true,
  },

  // Sidebar elements
  sidebar: {
    showChat: true,
    showNotes: true,
    showResume: true,
    showHints: true,
  },

  // Main workspace
  workspace: {
    showCodeEditor: true,
    showVideoFeed: true,
    showMicLevel: true,
  },

  // Controls
  controls: {
    showMic: true,
    showVideo: true,
    showChat: true,
    showSubmit: true,
    showEnd: true,
  },
};

// Resume context modes
export const RESUME_CONTEXT_MODE = {
  NONE: 'none',
  BACKGROUND: 'background',
  FULL: 'full',
};

// Connection status
export const CONNECTION_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error',
};

// Mic states
export const MIC_STATE = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
  ERROR: 'error',
};

export default {
  TIMING_CONFIG,
  INTERVIEW_PHASE,
  INTERVIEW_FORMAT,
  INTERVIEW_RUNTIME_MODE,
  ADVANCED_OPTIONS_DEFAULTS,
  SCORING_THRESHOLDS,
  INTERVIEWER_INTENSITIES,
  FOLLOWUP_DEPTHS,
  ANSWER_PACES,
  INTERVIEW_UI_CONFIG,
  RESUME_CONTEXT_MODE,
  CONNECTION_STATUS,
  MIC_STATE,
};
