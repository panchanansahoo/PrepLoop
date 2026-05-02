import { useState, useRef, useEffect } from 'react';
import {
  AUTO_SUBMIT_DELAY_MS,
  SILENCE_TO_NEXT_QUESTION_MS,
  VOICE_INPUT_COMMIT_DELAY_MS,
  buildVoiceAnswerSnapshot,
  formatInterviewDuration,
} from '../pages/companyInterviewTiming';
import {
  INTERVIEW_LABELS,
  INTERVIEW_PRESETS,
  clampInterviewScore,
  buildInterviewSummaryFallback,
  normalizeFeedbackList,
} from '../pages/companyInterviewConfig';

/**
 * Custom hook for managing Company Interview configuration and state
 * Encapsulates: interview config, conversation, scores, phase management
 */
export function useCompanyInterviewState() {
  // Phase state (lobby | interview | summary)
  const [phase, setPhase] = useState('lobby');
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Interview configuration
  const [config, setConfig] = useState({
    company: 'google',
    role: 'SDE',
    stage: 'Technical',
    difficulty: 'Medium',
    format: 'voice',
    interviewerGender: 'female',
    interviewerPersona: 'auto'
  });

  // Interview content state
  const [conversation, setConversation] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionCount, setQuestionCount] = useState(0);

  // Scoring and results
  const [sessionScores, setSessionScores] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [detailedReportData, setDetailedReportData] = useState(null);

  // Advanced options
  const [advancedOptions, setAdvancedOptions] = useState({
    interviewerIntensity: 'balanced',
    followUpDepth: 'standard',
    answerPace: 'balanced',
    realInterviewerMode: false,
    resumeInterviewMode: 'balanced',
    focusTopics: '',
    questionCount: 8,
  });

  // Runtime mode
  const [interviewRuntimeMode, setInterviewRuntimeMode] = useState('full_realtime');
  const [runtimeStrategy, setRuntimeStrategy] = useState('realtime_voice_bridge');

  // Resume context
  const [useResumeContext, setUseResumeContext] = useState(false);

  return {
    // Phase
    phase,
    setPhase,
    phaseRef,

    // Config
    config,
    setConfig,

    // Conversation
    conversation,
    setConversation,
    userInput,
    setUserInput,
    currentQuestion,
    setCurrentQuestion,
    questionCount,
    setQuestionCount,

    // Scoring
    sessionScores,
    setSessionScores,
    summaryData,
    setSummaryData,
    detailedReportData,
    setDetailedReportData,

    // Advanced
    advancedOptions,
    setAdvancedOptions,

    // Runtime
    interviewRuntimeMode,
    setInterviewRuntimeMode,
    runtimeStrategy,
    setRuntimeStrategy,

    // Resume
    useResumeContext,
    setUseResumeContext,
  };
}

export default useCompanyInterviewState;
