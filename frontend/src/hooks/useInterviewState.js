import { useState, useEffect } from 'react';
import {
  AI_INTERVIEW_GENDER_STORAGE_KEY,
  readStoredInterviewerGender,
} from '../pages/aiInterviewConfig';

/**
 * Custom hook for managing AI interview state
 * Encapsulates: phase, interview type, realtime mode, interviewer selection
 */
export function useInterviewState() {
  const [phase, setPhase] = useState('lobby'); // lobby | connecting | interview | summary
  const [interviewType, setInterviewType] = useState('technical');
  const [realtimeMode, setRealtimeMode] = useState(false);
  const [interviewerGender, setInterviewerGender] = useState(readStoredInterviewerGender);

  // Persist interviewer gender preference
  useEffect(() => {
    try {
      window.localStorage.setItem(AI_INTERVIEW_GENDER_STORAGE_KEY, interviewerGender);
    } catch {
      // Ignore storage failures
    }
  }, [interviewerGender]);

  return {
    phase,
    setPhase,
    interviewType,
    setInterviewType,
    realtimeMode,
    setRealtimeMode,
    interviewerGender,
    setInterviewerGender,
  };
}
