/**
 * Session State Manager
 * Manages auto-save of interview state to localStorage
 * Enables recovery from interruptions
 */

const STORAGE_KEY = 'interview_session_state';
const VERSION = 1;
const AUTO_SAVE_INTERVAL_MS = 10000; // 10 seconds

/**
 * Current session state in memory
 */
let currentSessionState = null;
let autoSaveIntervalId = null;
let onStateChangeCallbacks = [];

/**
 * Initialize session state manager
 * Starts auto-save interval
 */
export function initSessionStateManager() {
  if (autoSaveIntervalId) {
    clearInterval(autoSaveIntervalId);
  }
  
  autoSaveIntervalId = setInterval(() => {
    if (currentSessionState) {
      saveSessionState(currentSessionState);
    }
  }, AUTO_SAVE_INTERVAL_MS);
  
  console.log('[SessionStateManager] Auto-save initialized at', AUTO_SAVE_INTERVAL_MS, 'ms');
}

/**
 * Stop auto-save and cleanup
 */
export function stopSessionStateManager() {
  if (autoSaveIntervalId) {
    clearInterval(autoSaveIntervalId);
    autoSaveIntervalId = null;
    console.log('[SessionStateManager] Auto-save stopped');
  }
}

/**
 * Create a new interview session state
 */
export function createSessionState({
  sessionId,
  interviewType,
  difficulty,
  startTime = Date.now(),
} = {}) {
  const sessionState = {
    sessionId: sessionId || generateSessionId(),
    interviewType,
    difficulty,
    responses: [],
    currentQuestionIndex: 0,
    stage: 'intake', // intake, warmup, technical, feedback, completed
    startTime,
    lastSaved: null,
    version: VERSION,
  };
  
  currentSessionState = sessionState;
  notifyStateChange(sessionState);
  
  return sessionState;
}

/**
 * Update session state
 */
export function updateSessionState(updates) {
  if (!currentSessionState) {
    console.warn('[SessionStateManager] No active session state to update');
    return null;
  }
  
  currentSessionState = {
    ...currentSessionState,
    ...updates,
  };
  
  notifyStateChange(currentSessionState);
  return currentSessionState;
}

/**
 * Add a response to current session
 */
export function addResponse(response) {
  if (!currentSessionState) {
    console.warn('[SessionStateManager] No active session state');
    return null;
  }
  
  currentSessionState.responses = [
    ...currentSessionState.responses,
    {
      ...response,
      timestamp: Date.now(),
    },
  ];
  
  notifyStateChange(currentSessionState);
  return currentSessionState;
}

/**
 * Get current session state (from memory)
 */
export function getCurrentSessionState() {
  return currentSessionState;
}

/**
 * Save session state to localStorage
 */
export function saveSessionState(state = currentSessionState) {
  if (!state) {
    console.warn('[SessionStateManager] No state to save');
    return false;
  }
  
  try {
    const stateToSave = {
      ...state,
      lastSaved: Date.now(),
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    currentSessionState.lastSaved = stateToSave.lastSaved;
    
    return true;
  } catch (error) {
    console.error('[SessionStateManager] Failed to save state to localStorage:', error);
    // Check for quota exceeded
    if (error.name === 'QuotaExceededError') {
      clearOldSessions(); // Try to free space
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
      } catch (retryError) {
        console.error('[SessionStateManager] Failed to save even after cleanup:', retryError);
        return false;
      }
    }
    return false;
  }
}

/**
 * Load session state from localStorage
 */
export function loadSessionState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }
    
    const state = JSON.parse(stored);
    
    // Validate state version
    if (state.version !== VERSION) {
      console.warn('[SessionStateManager] State version mismatch, discarding old state');
      return null;
    }
    
    // Validate required fields
    if (!state.sessionId || !state.interviewType) {
      console.warn('[SessionStateManager] Invalid state structure');
      return null;
    }
    
    // Check if state is too old (> 24 hours)
    const ageMs = Date.now() - state.lastSaved;
    if (ageMs > 24 * 60 * 60 * 1000) {
      console.log('[SessionStateManager] Discarding old state (>24h)');
      return null;
    }
    
    currentSessionState = state;
    return state;
  } catch (error) {
    console.error('[SessionStateManager] Failed to load state from localStorage:', error);
    return null;
  }
}

/**
 * Clear current session state (from memory and storage)
 */
export function clearSessionState() {
  currentSessionState = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[SessionStateManager] Failed to clear localStorage:', error);
  }
}

/**
 * Get session recovery info
 * @returns {object} Info about recoverable session or null
 */
export function getRecoverableSession() {
  const stored = loadSessionState();
  if (!stored) {
    return null;
  }
  
  const ageMs = Date.now() - stored.lastSaved;
  const ageMinutes = Math.floor(ageMs / 60000);
  
  return {
    sessionId: stored.sessionId,
    interviewType: stored.interviewType,
    difficulty: stored.difficulty,
    responseCount: stored.responses?.length || 0,
    lastSavedAgo: ageMinutes,
    canRecover: true,
  };
}

/**
 * Subscribe to state changes
 */
export function onSessionStateChange(callback) {
  if (typeof callback === 'function') {
    onStateChangeCallbacks.push(callback);
  }
}

/**
 * Unsubscribe from state changes
 */
export function offSessionStateChange(callback) {
  onStateChangeCallbacks = onStateChangeCallbacks.filter(cb => cb !== callback);
}

/**
 * Notify all subscribers of state change
 */
function notifyStateChange(state) {
  onStateChangeCallbacks.forEach(callback => {
    try {
      callback(state);
    } catch (error) {
      console.error('[SessionStateManager] Callback error:', error);
    }
  });
}

/**
 * Generate unique session ID
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clean up old sessions to free localStorage space
 */
function clearOldSessions() {
  try {
    // Try to remove the current session to free space
    // In production, could implement more sophisticated cleanup
    localStorage.removeItem(STORAGE_KEY);
    console.log('[SessionStateManager] Cleared old sessions to free space');
  } catch (error) {
    console.error('[SessionStateManager] Failed to clear old sessions:', error);
  }
}

/**
 * Get session statistics
 */
export function getSessionStats() {
  if (!currentSessionState) {
    return null;
  }
  
  const now = Date.now();
  const duration = now - currentSessionState.startTime;
  const durationMinutes = Math.floor(duration / 60000);
  
  return {
    sessionId: currentSessionState.sessionId,
    durationMinutes,
    responseCount: currentSessionState.responses.length,
    stage: currentSessionState.stage,
    lastSavedAgo: currentSessionState.lastSaved
      ? Math.floor((now - currentSessionState.lastSaved) / 1000)
      : null,
  };
}

export default {
  initSessionStateManager,
  stopSessionStateManager,
  createSessionState,
  updateSessionState,
  addResponse,
  getCurrentSessionState,
  saveSessionState,
  loadSessionState,
  clearSessionState,
  getRecoverableSession,
  onSessionStateChange,
  offSessionStateChange,
  getSessionStats,
};
