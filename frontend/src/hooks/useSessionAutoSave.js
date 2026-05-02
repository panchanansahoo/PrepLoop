import { useEffect, useState, useCallback } from 'react';
import * as SessionStateManager from '../utils/SessionStateManager';

/**
 * Hook to manage interview session auto-save
 * Initializes manager on mount, stops on unmount
 */
export function useSessionAutoSave() {
  const [state, setState] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Initialize session manager
    SessionStateManager.initSessionStateManager();
    
    // Subscribe to state changes
    const handleStateChange = (newState) => {
      setState(newState);
      setStats(SessionStateManager.getSessionStats());
    };
    
    SessionStateManager.onSessionStateChange(handleStateChange);

    // Cleanup
    return () => {
      SessionStateManager.offSessionStateChange(handleStateChange);
      SessionStateManager.stopSessionStateManager();
    };
  }, []);

  // Create session
  const createSession = useCallback((config) => {
    const newSession = SessionStateManager.createSessionState(config);
    setState(newSession);
    setStats(SessionStateManager.getSessionStats());
    return newSession;
  }, []);

  // Update session
  const updateSession = useCallback((updates) => {
    const updated = SessionStateManager.updateSessionState(updates);
    setState(updated);
    setStats(SessionStateManager.getSessionStats());
    return updated;
  }, []);

  // Add response to session
  const addResponse = useCallback((response) => {
    const updated = SessionStateManager.addResponse(response);
    setState(updated);
    setStats(SessionStateManager.getSessionStats());
    return updated;
  }, []);

  // Clear session
  const clearSession = useCallback(() => {
    SessionStateManager.clearSessionState();
    setState(null);
    setStats(null);
  }, []);

  return {
    state,
    stats,
    createSession,
    updateSession,
    addResponse,
    clearSession,
    // Direct access to manager functions if needed
    saveNow: () => SessionStateManager.saveSessionState(state),
    getRecoverable: SessionStateManager.getRecoverableSession,
  };
}

export default useSessionAutoSave;
