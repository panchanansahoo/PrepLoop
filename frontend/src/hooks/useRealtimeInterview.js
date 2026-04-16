/**
 * useRealtimeInterview — Advanced real-time interview orchestrator
 * Coordinates voice, video, transcription, and answer submission
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useDeepgramVoice } from './useDeepgramVoice';
import useWebRTCVideo from './useWebRTCVideo';

const ANSWER_MIN_LENGTH = 10;
const SILENCE_THRESHOLD_MS = 3000; // 3s silence after speech
const MAX_ANSWER_DURATION_MS = 120000; // 2 min max per answer

export function useRealtimeInterview({
  onAnswer,
  onTranscriptUpdate,
  getAuthHeaders,
  interviewType = 'technical',
  personaGender = 'female',
  currentQuestion = '',
}) {
  const [state, setState] = useState('idle'); // idle | listening | processing | speaking
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [answerStartTime, setAnswerStartTime] = useState(null);
  
  const answerBufferRef = useRef('');
  const silenceTimerRef = useRef(null);
  const maxDurationTimerRef = useRef(null);

  // Voice pipeline (Deepgram STT + Kokoro TTS)
  const voice = useDeepgramVoice({
    onAnswer: useCallback((text) => {
      // Voice detected answer completion
      submitAnswer(text);
    }, []), // eslint-disable-line react-hooks/exhaustive-deps
    onTranscriptUpdate: useCallback((partial) => {
      setTranscript(partial);
      setInterimText(partial);
      answerBufferRef.current = partial;
      
      // Update parent
      if (onTranscriptUpdate) {
        onTranscriptUpdate(partial);
      }

      // Reset silence timer on new speech
      if (partial && partial.trim().length > 0) {
        resetSilenceTimer();
      }
    }, [onTranscriptUpdate]),
    interviewType,
    personaGender,
    question: currentQuestion,
    getAuthHeaders,
    enableInterrupt: true,
  });

  // Video pipeline
  const video = useWebRTCVideo({
    quality: 'sd',
    autoStart: false,
  });

  // Reset silence timer
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    
    silenceTimerRef.current = setTimeout(() => {
      // User stopped speaking for SILENCE_THRESHOLD_MS
      const answer = answerBufferRef.current.trim();
      if (answer.length >= ANSWER_MIN_LENGTH) {
        submitAnswer(answer);
      }
    }, SILENCE_THRESHOLD_MS);
  }, []);

  // Submit answer
  const submitAnswer = useCallback((answerText) => {
    const answer = answerText || answerBufferRef.current.trim();
    
    if (answer.length < ANSWER_MIN_LENGTH) {
      return;
    }

    // Clear timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }

    // Stop listening
    voice.stop();
    setState('processing');

    // Reset buffers
    answerBufferRef.current = '';
    setTranscript('');
    setInterimText('');
    setAnswerStartTime(null);

    // Notify parent
    if (onAnswer) {
      onAnswer(answer);
    }
  }, [onAnswer, voice]);

  // Start listening for answer
  const startListening = useCallback(async () => {
    setState('listening');
    setAnswerStartTime(Date.now());
    answerBufferRef.current = '';
    setTranscript('');
    setInterimText('');

    // Start voice recording
    await voice.start();

    // Safety: auto-submit after MAX_ANSWER_DURATION_MS
    maxDurationTimerRef.current = setTimeout(() => {
      const answer = answerBufferRef.current.trim();
      if (answer.length >= ANSWER_MIN_LENGTH) {
        submitAnswer(answer);
      } else {
        submitAnswer('I need more time to think about this.');
      }
    }, MAX_ANSWER_DURATION_MS);
  }, [voice, submitAnswer]);

  // Stop listening
  const stopListening = useCallback(() => {
    voice.stop();
    setState('idle');
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
  }, [voice]);

  // Speak interviewer text
  const speak = useCallback(async (text, options = {}) => {
    setState('speaking');
    await voice.speak(text, {
      ...options,
      onStart: () => {
        setState('speaking');
        if (options.onStart) options.onStart();
      },
      onEnd: () => {
        setState('idle');
        if (options.onEnd) options.onEnd();
      },
    });
  }, [voice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      voice.cleanup();
      video.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (maxDurationTimerRef.current) clearTimeout(maxDurationTimerRef.current);
    };
  }, [voice, video]);

  return {
    // State
    state,
    transcript,
    interimText,
    answerStartTime,
    
    // Voice
    voiceState: voice.state,
    inputBars: voice.inputBars,
    outputBars: voice.outputBars,
    inputLevel: voice.inputLevel,
    outputLevel: voice.outputLevel,
    connectionMode: voice.connectionMode,
    
    // Video
    videoStream: video.stream,
    videoActive: video.isActive,
    videoError: video.error,
    videoRef: video.videoRef,
    
    // Controls
    startListening,
    stopListening,
    speak,
    submitAnswer,
    
    // Video controls
    startVideo: video.start,
    stopVideo: video.stop,
    switchCamera: video.switchCamera,
    
    // Cleanup
    cleanup: () => {
      voice.cleanup();
      video.stop();
    },
  };
}

export default useRealtimeInterview;
