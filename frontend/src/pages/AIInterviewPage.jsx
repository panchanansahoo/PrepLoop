import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAuth } from '../context/AuthContext';
// Legacy useVoiceInterview removed 
import { useVoiceAI } from '../hooks/useVoiceAI';
import useInterviewIntelligence from '../hooks/useInterviewIntelligence';
import VoiceWaveform from '../components/VoiceWaveform';
import InterviewResults from '../components/interview/InterviewResults';
import InterviewLobby from '../components/interview/InterviewLobby';
import InterviewControls from '../components/interview/InterviewControls';
import LiveCaptions from '../components/interview/LiveCaptions';
import InterviewWorkspace from '../components/interview/InterviewWorkspace';
import ChatSidebar from '../components/interview/ChatSidebar';
import InterviewTopBar from '../components/interview/InterviewTopBar';
import ScoreCueToast from '../components/interview/ScoreCueToast';
import HintBanner from '../components/interview/HintBanner';
import {
    Mic, MicOff, Sparkles,
    MessageSquare, Volume2, Wifi, User, Building2,
    AlertTriangle, Brain, Code2, Shield,
} from 'lucide-react';
import {
    getThinkingDelayMs,
    getInterviewerReaction,
    getSilencePrompt,
    communicationScore as calcCommunication,
    technicalScore as calcTechnical,
    problemSolvingScore as calcProblemSolving,
    codeQualityScore as calcCodeQuality,
    getQuestionTimeLimit,
} from './aiInterviewTiming';
import {
    BOILERPLATE,
    AI_INTERVIEW_GENDER_STORAGE_KEY,
    AI_INTERVIEW_SESSION_KEY,
    readStoredInterviewerGender,
    HR_INTERVIEWER_VIDEOS,
    COMPANY_INTERVIEWERS,
    DEFAULT_INTERVIEWER,
    STAGE_MAP,
    formatTime,
} from './aiInterviewConfig';
import './AIInterviewPage.css';

export default function AIInterviewPage() {
    const { user, getAuthHeaders } = useAuth();
    const navigate = useNavigate();

    // Interview configuration and UI phases
    const [phase, setPhase] = useState('lobby'); // lobby | connecting | interview | summary
    const [interviewType, setInterviewType] = useState('technical');
    const [realtimeMode, setRealtimeMode] = useState(false); // Pipecat real-time voice mode
    const [interviewerGender, setInterviewerGender] = useState(readStoredInterviewerGender);

    useEffect(() => {
        try {
            window.localStorage.setItem(AI_INTERVIEW_GENDER_STORAGE_KEY, interviewerGender);
        } catch {
            // Ignore storage failures and keep the in-memory selection.
        }
    }, [interviewerGender]);

    // 
    // We'll initialize voice hook lazily after speakerMuted is set up (see below)
    const voiceHookRef = useRef(null);

    // Active tab in the interview workspace (code/design/notes)
    const [activeTab, setActiveTab] = useState('code'); // code | design | notes

    // Code editor state
    const [language, setLanguage] = useState('python');
    const [code, setCode] = useState(BOILERPLATE.python);
    const [lineCount, setLineCount] = useState(1);

    // 
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef(null);

    // 
    const [isPaused, setIsPaused] = useState(false);
    const [totalPauseTime, setTotalPauseTime] = useState(0);
    const pauseStartRef = useRef(null);

    // 
    const [questionElapsed, setQuestionElapsed] = useState(0);
    const questionTimerRef = useRef(null);

    // 
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [questionIndex, setQuestionIndex] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(6);
    const [stageLabel, setStageLabel] = useState('');
    const [stagePlan, setStagePlan] = useState(null); // Array of stage objects from backend
    const [loading, setLoading] = useState(false);
    const [consecutiveSilentQuestions, setConsecutiveSilentQuestions] = useState(0); // Track silent questions

    // Live Intelligence UI State
    const [scoreCue, setScoreCue] = useState(null);     // { level, text, color }
    const [activeHint, setActiveHint] = useState(null); // { hintTier, hintMessage, isHint }

    // 
    const [analysisLoading, setAnalysisLoading] = useState(false);

    // 
    const [cameraOn, setCameraOn] = useState(true);
    const [bookmarked, setBookmarked] = useState(false);
    const [speakerMuted, setSpeakerMuted] = useState(false);
    const [micOn, setMicOn] = useState(false);
    const [interviewerVideoReady, setInterviewerVideoReady] = useState({ speaking: false, listening: false });
    const [interviewerVisibleMode, setInterviewerVisibleMode] = useState('listening');

    // 
    const sendAnswerRef = useRef(null);
    const [aiSpeaking, setAiSpeaking] = useState(false);
    const [transcript, setTranscriptRaw] = useState('');
    const [silenceCountdown] = useState(0); // Kept for UI compatibility
    const isListeningRef = useRef(false);
    const isSendingRef = useRef(false);
    const ttsAudioRef = useRef(null);

    // Stable setTranscript that also tracks final text
    const setTranscript = useCallback((val) => {
        if (typeof val === 'function') {
            setTranscriptRaw(val);
        } else {
            setTranscriptRaw(val || '');
        }
    }, []);

    // 
    // Runs the real-time STT (Deepgram) + TTS (Kokoro local) pipeline.
    // `onAnswer` bridges detected speech directly into sendAnswer().
    const voiceAI = useVoiceAI({
        onAnswer: useCallback((answerText) => {
            // Push transcribed text into state for UI display
            setTranscriptRaw(answerText || '');
            
            // Track if this was a silent answer (no speech detected)
            const isSilentAnswer = !answerText || answerText.trim().length === 0 || answerText === "I do not have a response to this question.";
            
            if (isSilentAnswer) {
                setConsecutiveSilentQuestions(prev => prev + 1);
            } else {
                // User spoke, reset silent counter
                setConsecutiveSilentQuestions(0);
            }
            
            // CRITICAL: Pass answerText directly to sendAnswer because React
            // state (transcript) won't update until the next render. Without
            // this, sendAnswer reads stale/empty transcript and silently bails.
            if (sendAnswerRef.current) sendAnswerRef.current(false, answerText);
        }, []),  // eslint-disable-line react-hooks/exhaustive-deps
        onTranscriptUpdate: useCallback((partial) => {
            setTranscriptRaw(partial || '');
        }, []),  // eslint-disable-line react-hooks/exhaustive-deps
        interviewType,
        personaGender: interviewerGender,
        question: currentQuestion,
        getAuthHeaders,
    });

    // 
    const intelligence = useInterviewIntelligence({ getAuthHeaders });

    // isListening now derived from voiceAI.state so the UI accurately reflects
    // the Deepgram MediaRecorder pipeline (not the legacy WebSpeech API)
    const isListening = voiceAI.state === 'listening';
    // Keep the shared ref in sync so closures that read isListeningRef work
    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening, isListeningRef]);

    // Fix 3: Keep micOn in perfect sync with isListening (single source of truth)
    useEffect(() => {
        setMicOn(isListening);
    }, [isListening]);

    // Fix 5: Detect when user interrupts AI speech and sync page-level state
    useEffect(() => {
        if (voiceAI.interruptDetected) {
            setAiSpeaking(false);
            if (ttsAudioRef.current) {
                ttsAudioRef.current.pause();
                ttsAudioRef.current = null;
            }
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        }
    }, [voiceAI.interruptDetected, setAiSpeaking, ttsAudioRef]);

    // 
    // speakInterviewerText 
    const speakInterviewerText = useCallback(async (text) => {
        // Fix #6: Respect speaker mute 
        if (!text || speakerMuted) return;
        setAiSpeaking(true);
        try {
            await voiceAI.speak(text, {
                onStart: () => setAiSpeaking(true),
                onEnd:   () => {},  // Handled by caller or speakSequence
            });
        } finally {
            // Only set false if this is a standalone call (speakSequence overrides)
            setAiSpeaking(false);
        }
    }, [voiceAI, setAiSpeaking, speakerMuted]);

    // speakSequence 
    // Keeps the interviewer video in "speaking" mode across all segments.
    const speakSequenceCancelledRef = useRef(false);
    const speakSequence = useCallback(async (segments, { pauseMs = 150 } = {}) => {
        // Fix #6: Respect speaker mute
        if (!segments || segments.length === 0 || speakerMuted) return;
        speakSequenceCancelledRef.current = false;
        setAiSpeaking(true);
        try {
            for (let i = 0; i < segments.length; i++) {
                // Abort remaining segments if paused or cancelled mid-sequence
                if (speakSequenceCancelledRef.current) break;

                const text = segments[i];
                if (!text || !text.trim()) continue;

                await voiceAI.speak(text, {
                    onStart: () => {},  // aiSpeaking already true
                    onEnd:   () => {},  // Don't set false between segments
                });

                // Brief natural pause between segments (not after last one)
                if (i < segments.length - 1 && pauseMs > 0) {
                    if (speakSequenceCancelledRef.current) break;
                    await new Promise(r => setTimeout(r, pauseMs));
                }
            }
        } finally {
            setAiSpeaking(false);
        }
    }, [voiceAI, setAiSpeaking, speakerMuted]);

    // startVoiceRecording / stopVoiceRecording 
    const startVoiceRecording = useCallback(() => {
        voiceAI.start();
    }, [voiceAI]);

    const stopVoiceRecording = useCallback(() => {
        voiceAI.stop();
    }, [voiceAI]);

    // 
    const [chatOpen, setChatOpen] = useState(false);
    const [conversation, setConversation] = useState([]);
    const [userInput, setUserInput] = useState('');
    const chatEndRef = useRef(null);

    const [interviewerStatus, setInterviewerStatus] = useState('');
    const [silenceStage, setSilenceStage] = useState(0);
    const silenceStageTimerRef = useRef(null);

    // 
    const stateRefs = useRef({ userInput: '', transcript: '', code: '', language: 'python' });
    useEffect(() => {
        stateRefs.current = { userInput, transcript, code, language };
    }, [userInput, transcript, code, language]);

    // 
    useEffect(() => {
        if (transcript && transcript.trim().length > 0) {
            intelligence.ingestTranscript(transcript);
        }
    }, [transcript, intelligence]);

    // 
    useEffect(() => {
        if (voiceAI.inputLevel > 0) {
            intelligence.ingestAudioConfidence(voiceAI.inputLevel);
        }
    }, [voiceAI.inputLevel, intelligence]);

    // 
    const [notes, setNotes] = useState('');

    // 
    const [savedSession, setSavedSession] = useState(null); // Recoverable session from localStorage

    // I9: Check for saved session on mount
    useEffect(() => {
        try {
            const raw = window.localStorage.getItem(AI_INTERVIEW_SESSION_KEY);
            if (raw) {
                const session = JSON.parse(raw);
                // Only offer recovery if session is less than 2 hours old
                if (session.timestamp && Date.now() - session.timestamp < 2 * 60 * 60 * 1000) {
                    setSavedSession(session);
                } else {
                    window.localStorage.removeItem(AI_INTERVIEW_SESSION_KEY);
                }
            }
        } catch {
            // Corrupted data 
            try { window.localStorage.removeItem(AI_INTERVIEW_SESSION_KEY); } catch {}
        }
    }, []);

    // I9: Save session to localStorage when conversation changes during interview
    useEffect(() => {
        if (phase !== 'interview' || conversation.length === 0) return;
        try {
            const sessionData = {
                conversation,
                questionIndex,
                currentQuestion,
                elapsed,
                totalQuestions,
                interviewType,
                interviewerGender,
                code,
                language,
                notes,
                timestamp: Date.now(),
            };
            window.localStorage.setItem(AI_INTERVIEW_SESSION_KEY, JSON.stringify(sessionData));
        } catch {
            // Storage full or unavailable 
        }
    }, [conversation, phase]); // eslint-disable-line react-hooks/exhaustive-deps

    // I9: Clear saved session helper
    const clearSavedSession = useCallback(() => {
        setSavedSession(null);
        try { window.localStorage.removeItem(AI_INTERVIEW_SESSION_KEY); } catch {}
    }, []);

    // I9: Restore session from saved data
    const restoreSession = useCallback((session) => {
        setConversation(session.conversation || []);
        setQuestionIndex(session.questionIndex || 1);
        setCurrentQuestion(session.currentQuestion || '');
        setElapsed(session.elapsed || 0);
        setTotalQuestions(session.totalQuestions || 6);
        setInterviewType(session.interviewType || 'technical');
        setInterviewerGender(session.interviewerGender || 'male');
        setCode(session.code || BOILERPLATE.python);
        setLanguage(session.language || 'python');
        setNotes(session.notes || '');
        setSavedSession(null);
        setPhase('interview');
    }, []); // eslint-disable-line react-hooks/exhaustive-deps


    // 
    const videoRef = useRef(null);
    // Fix #3: Track questionIndex in a ref so sendAnswer closures always read the latest value
    const questionIndexRef = useRef(1);
    // Keep questionIndexRef in sync with state
    useEffect(() => {
        questionIndexRef.current = questionIndex;
    }, [questionIndex]);

    const streamRef = useRef(null);
    const interviewerSpeakingVideoRef = useRef(null);
    const interviewerListeningVideoRef = useRef(null);
    const interviewerPlaybackRef = useRef({ speaking: 0, listening: 0 });
    const interviewerTargetModeRef = useRef('listening');
    const [workspacePanelOpen, setWorkspacePanelOpen] = useState(true);
    const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);

    // 
    const [captionsOn, setCaptionsOn] = useState(true);

    // 
    /**
     * Log API errors with context for debugging.
     * @param {string} endpoint - The API endpoint called
     * @param {string} stage - Context (e.g., "interview-start", "follow-up")
     * @param {Error|Response} error - The error object or response
     * @param {Object} payload - The request payload (sanitized)
     */
    const logAPIError = useCallback((endpoint, stage, error, payload = {}) => {
        const timestamp = new Date().toISOString();
        const errorContext = {
            timestamp,
            endpoint,
            stage,
            // Read from refs to avoid dependency churn on every question change
            questionIndex: questionIndexRef.current,
            totalQuestions,
            phase,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        };

        if (error instanceof Response) {
            errorContext.statusCode = error.status;
            errorContext.statusText = error.statusText;
        } else if (error instanceof Error) {
            errorContext.errorMessage = error.message;
            errorContext.stack = error.stack;
        }

        console.error(`[AI Interview API Error] ${stage}:`, {
            ...errorContext,
            payloadKeys: Object.keys(payload),
        });
    }, [totalQuestions, phase]);

    const createHttpError = useCallback((status, statusText = '') => {
        const normalizedStatusText = statusText && statusText.trim().length > 0 ? statusText : 'Request failed';
        const error = new Error(`HTTP ${status}: ${normalizedStatusText}`);
        error.name = 'HttpError';
        error.status = status;
        return error;
    }, []);

    const getHttpStatus = useCallback((error) => {
        if (typeof Response !== 'undefined' && error instanceof Response) {
            return error.status;
        }

        if (error && typeof error.status === 'number') {
            return error.status;
        }

        if (error && typeof error.message === 'string') {
            const match = error.message.match(/^HTTP\s+(\d{3})/);
            if (match) {
                return Number(match[1]);
            }
        }

        return null;
    }, []);

    // 
    const [setupStep, setSetupStep] = useState(0); // 0-5
    const [experienceLevel, setExperienceLevel] = useState('fresher'); // 'fresher' | 'experienced'
    const [targetRole, setTargetRole] = useState('');
    const [targetCompany, setTargetCompany] = useState('');
    const [companySearch, setCompanySearch] = useState('');
    const [companyTab, setCompanyTab] = useState('all');
    const [resumeFile, setResumeFile] = useState(null);
    const [activeResumeContext, setActiveResumeContext] = useState(null);

    // 
    React.useEffect(() => {
        if (experienceLevel === 'fresher') {
            setTotalQuestions(13);
        } else {
            setTotalQuestions(13);
        }
    }, [experienceLevel]);

    // 
    const [resultTab, setResultTab] = useState('overview');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [expandedMoment, setExpandedMoment] = useState(null);

    // 
    const companyPool = targetCompany && COMPANY_INTERVIEWERS[targetCompany]
        ? COMPANY_INTERVIEWERS[targetCompany]
        : DEFAULT_INTERVIEWER;
    const interviewerVideos = HR_INTERVIEWER_VIDEOS[interviewerGender] || HR_INTERVIEWER_VIDEOS.female;
    const INTERVIEWER = {
        ...(companyPool[interviewerGender] || companyPool.female),
        company: targetCompany || 'Google',
        avatar: '/interviewer-avatar.png',
    };

    // 
    const generateAnalysis = useCallback(async () => {
        const totalMessages = conversation.length;
        const userMessages = conversation.filter(m => m.role === 'candidate');

        const statsObj = {
            duration: formatTime(elapsed),
            questionsAnswered: questionIndex,
            totalMessages,
            linesOfCode: lineCount,
            language,
            pauseTime: totalPauseTime > 0 ? formatTime(Math.round(totalPauseTime / 1000)) : null,
        };

        // Icon and color mapping for category names
        const CATEGORY_ICONS = {
            'Communication': { icon: MessageSquare, color: '#818cf8' },
            'Technical Skills': { icon: Code2, color: '#22d3ee' },
            'Problem Solving': { icon: Brain, color: '#a78bfa' },
            'Code Quality': { icon: Shield, color: '#34d399' },
        };

        // Try AI-powered analysis first
        setAnalysisLoading(true);
        try {
            const headers = getAuthHeaders ? getAuthHeaders() : {};
            const res = await fetch('/api/company-interview/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({
                    conversation: conversation.map(m => ({
                        role: m.role,
                        content: m.content,
                        score: m.score,
                        strengths: m.strengths,
                        improvements: m.improvements,
                        questionSource: m.questionSource,
                        questionMeta: m.questionMeta,
                        timestamp: m.timestamp,
                    })),
                    company: targetCompany || 'General',
                    role: targetRole || 'Software Engineer',
                    stage: interviewType,
                    sessionScores: conversation.filter(m => m.role === 'feedback' && m.score).map(m => m.score),
                }),
            });
            const data = await res.json();

            if (data && !data.fallback && data.overallScore) {
                // Enrich categories with icons and colors
                const enrichedCategories = (data.categories || []).map(cat => ({
                    ...cat,
                    icon: CATEGORY_ICONS[cat.name]?.icon || Brain,
                    color: CATEGORY_ICONS[cat.name]?.color || '#818cf8',
                }));

                const score = data.overallScore;
                setAnalysisResult({
                    ...data,
                    categories: enrichedCategories,
                    performanceColor: score >= 7 ? '#22c55e' : score >= 5 ? '#f59e0b' : score >= 3 ? '#f97316' : '#ef4444',
                    stats: statsObj,
                    aiGenerated: true,
                });
                setAnalysisLoading(false);
                return;
            }
        } catch (err) {
            console.warn('AI analysis failed, using local fallback:', err.message);
        }

        // Fallback: deterministic client-side scoring (no Math.random())
        const avgResponseLength = userMessages.length > 0
            ? Math.round(userMessages.reduce((sum, m) => sum + ((m.content || m.text || '').length || 0), 0) / userMessages.length)
            : 0;
        const commScore = calcCommunication(avgResponseLength, userMessages.length, Math.max(questionIndex, 1));
        const techScore = calcTechnical(code, lineCount);
        const psScore = calcProblemSolving(questionIndex, userMessages.length);
        const cqScore = calcCodeQuality(code, lineCount);
        const overallScore = Math.round(((commScore + techScore + psScore + cqScore) / 4) * 10) / 10;

        const keyMoments = [];
        conversation.forEach((msg, idx) => {
            const text = msg.content || msg.text || '';
            if (msg.role === 'interviewer' && text.length > 50 && idx < 3) {
                keyMoments.push({ type: 'question', text: text.substring(0, 120) + '...', time: formatTime(Math.round((elapsed / Math.max(totalMessages, 1)) * idx)) });
            }
            if (msg.role === 'candidate' && text.length > 80) {
                keyMoments.push({ type: 'answer', text: text.substring(0, 120) + '...', time: formatTime(Math.round((elapsed / Math.max(totalMessages, 1)) * idx)) });
            }
        });

        setAnalysisResult({
            overallScore,
            performanceLabel: overallScore >= 7 ? 'Strong Hire' : overallScore >= 5 ? 'Inclined Hire' : overallScore >= 3 ? 'Needs Improvement' : 'Not Ready',
            performanceColor: overallScore >= 7 ? '#22c55e' : overallScore >= 5 ? '#f59e0b' : overallScore >= 3 ? '#f97316' : '#ef4444',
            categories: [
                { name: 'Communication', score: commScore, icon: MessageSquare, color: '#818cf8' },
                { name: 'Technical Skills', score: techScore, icon: Code2, color: '#22d3ee' },
                { name: 'Problem Solving', score: psScore, icon: Brain, color: '#a78bfa' },
                { name: 'Code Quality', score: cqScore, icon: Shield, color: '#34d399' },
            ],
            strengths: [
                'Structured approach to problem decomposition',
                'Clear communication of thought process',
                userMessages.length > 3 ? 'Good follow-up engagement' : 'Showed initiative in discussion',
            ],
            improvements: [
                'Consider edge cases more thoroughly',
                'Optimize time complexity analysis',
                'Strengthen system design fundamentals',
            ],
            keyMoments: keyMoments.slice(0, 5),
            stats: statsObj,
            aiGenerated: false,
        });
        setAnalysisLoading(false);
    }, [conversation, elapsed, questionIndex, code, lineCount, language, targetCompany, targetRole, interviewType, getAuthHeaders, INTERVIEWER.name]);

    // 
    useEffect(() => {
        if (phase === 'interview' && !isPaused) {
            timerRef.current = setInterval(() => {
                setElapsed(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [phase, isPaused]);

    // 
    useEffect(() => {
        if (phase === 'interview' && !isPaused) {
            questionTimerRef.current = setInterval(() => {
                setQuestionElapsed(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(questionTimerRef.current);
    }, [phase, isPaused]);

    // Reset per-question timer when question changes
    const countdownWarnedRef = useRef(false); // I8: track per-Q warning
    useEffect(() => {
        setQuestionElapsed(0);
        countdownWarnedRef.current = false;  // I8: reset on new question
    }, [questionIndex]);

    // 
    useEffect(() => {
        if (phase !== 'interview' || isPaused) return;
        const resolvedStage = STAGE_MAP[interviewType] || 'Technical';
        const limit = getQuestionTimeLimit(resolvedStage);
        const remaining = limit - questionElapsed;

        // I8: Fire a one-time 30-second countdown warning
        if (remaining === 30 && !countdownWarnedRef.current) {
            countdownWarnedRef.current = true;
            setInterviewerStatus('30 seconds remaining');
            setTimeout(() => setInterviewerStatus(''), 4000);
        }

        if (questionElapsed >= limit && sendAnswerRef.current && !isSendingRef.current) {
            console.info(`[AI Interview] Per-question timer expired for Q${questionIndex} (${formatTime(limit)}). Auto-submitting.`);
            // Bug 3 fix: Cancel ALL competing timers before submitting
            voiceAI.stop();  // Cancels Deepgram silence timers + recorder
            if (silenceStageTimerRef.current) clearTimeout(silenceStageTimerRef.current);
            sendAnswerRef.current(true); // Auto-skip
        }
    }, [questionElapsed, phase, isPaused, interviewType, questionIndex, voiceAI]);



    // 
    useEffect(() => {
        if (phase === 'summary') {
            generateAnalysis();
        }
    }, [phase, generateAnalysis]);

    // 
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);

    // 
    useEffect(() => {
        setLineCount(code ? code.split('\n').length : 1);
    }, [code]);

    // 
    useEffect(() => {
        if (phase === 'interview' && cameraOn) {
            navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
                .then(stream => {
                    streamRef.current = stream;
                    if (videoRef.current) videoRef.current.srcObject = stream;
                })
                .catch(() => { /* Camera not available / denied */ });
        }
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
        };
    }, [phase, cameraOn]);

    // 
    const handleLanguageChange = (newLang) => {
        setLanguage(newLang);
        if (!code || code === BOILERPLATE[language]) {
            setCode(BOILERPLATE[newLang] || BOILERPLATE.python);
        }
    };

    const handleReset = () => {
        setCode(BOILERPLATE[language] || BOILERPLATE.python);
    };

    const handleInterviewerTimeUpdate = useCallback((mode) => {
        const video = mode === 'speaking' ? interviewerSpeakingVideoRef.current : interviewerListeningVideoRef.current;
        if (!video) return;
        interviewerPlaybackRef.current[mode] = video.currentTime || 0;
    }, []);

    const handleInterviewerLoadedMetadata = useCallback((mode) => {
        const video = mode === 'speaking' ? interviewerSpeakingVideoRef.current : interviewerListeningVideoRef.current;
        if (!video) return;
        const savedTime = interviewerPlaybackRef.current[mode] || 0;
        const duration = video.duration || 0;
        if (duration > 0) {
            video.currentTime = savedTime % duration;
        }
    }, []);

    const handleInterviewerCanPlay = useCallback((mode) => {
        setInterviewerVideoReady(prev => (prev[mode] ? prev : { ...prev, [mode]: true }));

        if (interviewerTargetModeRef.current === mode) {
            setInterviewerVisibleMode(mode);
        }
    }, []);

    const handleSpeakingLoadedMetadata = useCallback(() => handleInterviewerLoadedMetadata('speaking'), [handleInterviewerLoadedMetadata]);
    const handleSpeakingTimeUpdate = useCallback(() => handleInterviewerTimeUpdate('speaking'), [handleInterviewerTimeUpdate]);
    const handleSpeakingCanPlay = useCallback(() => handleInterviewerCanPlay('speaking'), [handleInterviewerCanPlay]);
    const handleListeningLoadedMetadata = useCallback(() => handleInterviewerLoadedMetadata('listening'), [handleInterviewerLoadedMetadata]);
    const handleListeningTimeUpdate = useCallback(() => handleInterviewerTimeUpdate('listening'), [handleInterviewerTimeUpdate]);
    const handleListeningCanPlay = useCallback(() => handleInterviewerCanPlay('listening'), [handleInterviewerCanPlay]);

    const handleResumeDragOver = useCallback((e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }, []);
    const handleResumeDragLeave = useCallback((e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); }, []);
    const handleResumeDrop = useCallback((e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) setResumeFile(e.dataTransfer.files[0]);
    }, []);
    const handleResumeFileChange = useCallback((e) => {
        if (e.target.files?.[0]) setResumeFile(e.target.files[0]);
    }, []);

    useEffect(() => {
        const activeMode = aiSpeaking ? 'speaking' : 'listening';
        interviewerTargetModeRef.current = activeMode;

        const speakingVideo = interviewerSpeakingVideoRef.current;
        const listeningVideo = interviewerListeningVideoRef.current;

        if (!speakingVideo || !listeningVideo) return;

        const activeVideo = activeMode === 'speaking' ? speakingVideo : listeningVideo;
        const inactiveVideo = activeMode === 'speaking' ? listeningVideo : speakingVideo;

        // Keep visual layer in sync for every transition after initial preload.
        if (interviewerVideoReady[activeMode]) {
            setInterviewerVisibleMode(activeMode);
        }

        inactiveVideo.pause();
        activeVideo.play().catch(() => { });

        return () => {
            interviewerPlaybackRef.current[activeMode] = activeVideo.currentTime || 0;
        };
    }, [aiSpeaking, interviewerVideoReady]);

    // 
    // Helper: pick a natural-sounding browser voice
    // NOTE: Browser voice selection is handled entirely by useVoiceAI.pickBrowserVoice.
    // Voice preloading is also handled by the hook. No duplicate logic needed here.

    const splitTextForTTS = useCallback((input, maxLen = 220) => {
        const normalized = String(input || '').replace(/\s+/g, ' ').trim();
        if (!normalized) return [];

        // Prefer sentence boundaries for natural cadence.
        const sentences = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [normalized];
        const chunks = [];

        for (const sentence of sentences) {
            const piece = sentence.trim();
            if (!piece) continue;

            if (piece.length <= maxLen) {
                chunks.push(piece);
                continue;
            }

            const words = piece.split(' ');
            let current = '';
            for (const word of words) {
                const candidate = current ? `${current} ${word}` : word;
                if (candidate.length <= maxLen) {
                    current = candidate;
                } else {
                    if (current) chunks.push(current);
                    current = word;
                }
            }
            if (current) chunks.push(current);
        }

        return chunks;
    }, []);




    // 
    useEffect(() => {
        return () => {
            voiceAI.cleanup();
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            // Clear silence handling timers to prevent state-after-unmount
            if (silenceStageTimerRef.current) clearTimeout(silenceStageTimerRef.current);
            clearInterval(questionTimerRef.current);
        };
    }, [voiceAI.cleanup]);

    // 
    const startInterview = async () => {
        // Show connecting phase first
        setPhase('connecting');
        setElapsed(0);
        setLoading(true);

        // Map interview type to stage for the backend
        const stageMap = {
            'coding': 'DSA / Coding',
            'dsa': 'DSA / Coding',
            'system-design': 'System Design',
            'behavioral': 'Behavioral',
            'product': 'Technical',
            'data-science': 'Technical',
            'ai-llm': 'Technical',
            'hr': 'HR',
            'technical': 'Technical',
        };
        const resolvedStage = stageMap[interviewType] || 'Technical';
        const resolvedCompany = targetCompany || 'Google';
        const resolvedRole = targetRole || 'Software Engineer';

        // 
        if (realtimeMode) {
                console.warn('[Pipecat] Real-time mode is temporarily unavailable, falling back to classic flow.');
                setRealtimeMode(false);
            }

        // Minimum display time for connecting animation (kept minimal for speed)
        const minDelay = new Promise(resolve => setTimeout(resolve, 1200));

        // Define fallback opening text outside try-catch so it's accessible in both blocks
        const technicalOpeningFallback = experienceLevel === 'fresher'
            ? `Good afternoon, I will be conducting your technical discussion today. We'll cover fundamentals in databases, OOP, and web concepts. To begin with, could you introduce yourself and walk me through your background, including your technical interests?`
            : `Welcome! Let's start with a technical warm-up. Can you walk me through one project you built recently, your design choices, and the key trade-offs you made?`;

        try {
            const headers = getAuthHeaders ? getAuthHeaders() : {};

            // Build advancedOptions based on experience level
            const advancedOpts = {
                interviewerIntensity: experienceLevel === 'fresher' ? 'supportive' : 'balanced',
                followUpDepth: experienceLevel === 'fresher' ? 'shallow' : 'deep',
                answerPace: experienceLevel === 'fresher' ? 'slow' : 'balanced',
                resumeInterviewMode: experienceLevel === 'fresher' ? 'fresher-hr-tech' : 'project-deep-dive',
                questionCount: totalQuestions,
            };

            // Build richer resume context for experienced interviews so AI can ask resume-based deep-dive questions.
            const skillMap = {
                'coding': ['Data Structures', 'Algorithms', 'Problem Solving'],
                'dsa': ['Data Structures', 'Algorithms', 'Complexity Analysis'],
                'system-design': ['System Design', 'Scalability', 'Distributed Systems'],
                'behavioral': ['Leadership', 'Stakeholder Communication', 'Ownership'],
                'product': ['Product Thinking', 'Prioritization', 'Execution'],
                'data-science': ['Machine Learning', 'Data Analysis', 'Experimentation'],
                'ai-llm': ['LLM Applications', 'Prompt Engineering', 'Evaluation'],
            };

            const inferredSkills = skillMap[interviewType] || ['Software Engineering', 'Problem Solving'];
            const resumeCtx = resumeFile ? {
                candidateHeadline: `${experienceLevel === 'experienced' ? 'Experienced' : 'Fresher'} ${resolvedRole}`,
                summary: `Resume uploaded: ${resumeFile.name}. Prioritize resume-based questioning and practical depth.`,
                coreSkills: inferredSkills,
                projectHighlights: [`Most relevant project from uploaded resume (${resumeFile.name})`],
                likelyQuestionAreas: [resolvedStage, ...inferredSkills.slice(0, 2)],
            } : null;

            setActiveResumeContext(resumeCtx);

            // CRITICAL: Fetch ALL questions upfront for batch audio pre-generation
            const [res] = await Promise.all([
                fetch('/api/company-interview/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...headers },
                    body: JSON.stringify({
                        company: resolvedCompany,
                        role: resolvedRole,
                        stage: resolvedStage,
                        difficulty: experienceLevel === 'fresher' ? 'easy' : 'medium',
                        experienceLevel,
                        totalQuestions,
                        interactionFormat: 'text',
                        advancedOptions: advancedOpts,
                        resumeContext: resumeCtx,
                        interviewerName: INTERVIEWER.name,
                        generateAllQuestions: true, // Request all questions upfront
                    }),
                }),
                minDelay,
            ]);

            if (!res.ok) {
                const errorPayload = { company: resolvedCompany, stage: resolvedStage, experienceLevel };
                logAPIError('/api/company-interview/start', 'interview-start-http', res, errorPayload);
                throw createHttpError(res.status, res.statusText);
            }

            const data = await res.json();

            const stageFallbacks = {
                'DSA / Coding': `Welcome! Let's start with a coding challenge. Given an array of integers and a target sum, find two numbers that add up to the target. Walk me through your approach.`,
                'System Design': `Welcome! Let's dive into system design. How would you design a URL shortening service like bit.ly? Think about the key components.`,
                'Behavioral': `Welcome! I'd love to get to know you better. Can you tell me about a challenging project you worked on and how you handled it?`,
                'Technical': technicalOpeningFallback,
                'HR': `Welcome! I'm excited to chat with you. Tell me a bit about yourself`
            };
            const questionText = data.question || stageFallbacks[resolvedStage] || `Welcome! Let's start this ${resolvedStage.toLowerCase()} interview. Tell me about a project you've worked on that you're proud of.`;
            setCurrentQuestion(questionText);
            setQuestionIndex(1);
            setConversation([{
                role: 'interviewer',
                content: questionText,
                timestamp: Date.now(),
            }]);

            // CRITICAL: Pre-fetch TTS audio for first question DURING connecting phase
            // This eliminates the delay between "connected" and "speaking"
            console.log('[Interview] Pre-generating audio for first question...');
            voiceAI.prefetch(questionText);

            // Wait for minimum connecting animation time
            await minDelay;

            // Transition to interview phase
            setPhase('interview');
            setLoading(false);
            
            // Speak the greeting (audio already pre-fetched, plays instantly)
            await speakInterviewerText(questionText);
            
            // Auto-start mic after first question 
            startVoiceRecording();
        } catch (error) {
            const statusCode = getHttpStatus(error);
            if (statusCode !== 401) {
                logAPIError('/api/company-interview/start', 'interview-start-catch', error, { stage: resolvedStage });
            } else {
                console.warn('[AI Interview API Warning] start unauthorized; using local fallback question flow.');
            }
            await minDelay;
            const catchFallbacks = {
                'DSA / Coding': `Welcome! Let's start with a coding problem. Given a linked list, how would you detect if it contains a cycle? Walk me through your thinking.`,
                'System Design': `Welcome! How would you design a simple chat application? Think about the key components and data flow.`,
                'Behavioral': `Welcome! Tell me about a time you worked on a team project. How did you contribute and what challenges did you face?`,
                'Technical': technicalOpeningFallback,
                'HR': `Welcome! What motivates you to work in tech? What kind of role are you looking for?`,
            };
            const fallbackQ = catchFallbacks[resolvedStage] || `Welcome! Tell me about your background and a project you're proud of.`;
            setCurrentQuestion(fallbackQ);
            setQuestionIndex(1);
            setConversation([{
                role: 'interviewer',
                content: fallbackQ,
                timestamp: Date.now(),
            }]);
            
            // Pre-fetch fallback question audio
            voiceAI.prefetch(fallbackQ);
            
            setLoading(false);
            setPhase('interview');
            await speakInterviewerText(fallbackQ);
            startVoiceRecording();
        }
    };

    // 
    const sendAnswer = async (isAutoSkip = false, answerOverride = null) => {
        /**
         * CRITICAL QUESTION NUMBERING CONTRACT:
         * When sending an answer, we send `questionNumber: questionIndex + 1`
         * This means: "Send the NEXT question to ask" (not the current one just answered)
         * 
         * Example:
         * - User is on question 1 (questionIndex=0)
         * - They answer question 1
         * - We send questionNumber=1 to the backend
         * - Backend interprets this as: "The NEXT question (to ask) is question 1"
         * - Backend gets question 1 (0-indexed as questions[0])
         * 
         * This off-by-one conversion is intentional and required for proper backend behavior.
         */
        // Guard: prevent concurrent sends
        if (isSendingRef.current) return;
        isSendingRef.current = true;

        try {
        // Bug 3 fix: Cancel ALL competing timers to prevent duplicate submissions.
        // This is critical because sendAnswer can be called from:
        //   1. Per-question timer expiry (line ~632)
        //   2. Silence auto-skip (line ~1281)
        //   3. Manual submit button
        // Without cross-cancellation, multiple paths can fire simultaneously.
        if (questionTimerRef.current) {
            clearInterval(questionTimerRef.current);
            questionTimerRef.current = null;
        }
        if (silenceStageTimerRef.current) {
            clearTimeout(silenceStageTimerRef.current);
            silenceStageTimerRef.current = null;
        }
        setSilenceStage(0);

        // Stop any ongoing voice recording (use ref to avoid stale closure)
        if (isListeningRef.current) stopVoiceRecording();

        // Stop ALL AI speech immediately when user sends answer (smooth transition)
        speakSequenceCancelledRef.current = true;
        voiceAI.interrupt();
        if (ttsAudioRef.current) {
            ttsAudioRef.current.pause();
            ttsAudioRef.current = null;
        }
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        setAiSpeaking(false);

        // answerOverride allows callers (e.g. onAnswer from Deepgram STT) to
        // pass the answer text directly, bypassing stale React state.
        // Bug 3 fix: Read from stateRefs to avoid stale closure on userInput/transcript
        const answer = isAutoSkip === true
            ? "I do not have a response to this question."
            : (answerOverride?.trim() || stateRefs.current.userInput.trim() || stateRefs.current.transcript.trim());

        // Bug 1 fix: Track consecutive silent auto-skips for graceful early-exit
        if (isAutoSkip === true) {
            setConsecutiveSilentQuestions(prev => prev + 1);
        } else if (answer && answer.length > 10) {
            setConsecutiveSilentQuestions(0);
        }

        // Trigger answer analysis (non-blocking, fire-and-forget)
        if (answer && answer.length > 10) {
            intelligence.analyzeAnswer(answer, currentQuestion).catch(() => {});
        }
        if (!answer && !stateRefs.current.code.trim() && isAutoSkip !== true) { isSendingRef.current = false; return; }

        const currentCode = stateRefs.current.code.trim();
        const fullAnswer = currentCode
            ? `${answer}\n\n--- Code ---\n${currentCode}`
            : answer;

        setConversation(prev => [...prev, {
            role: 'candidate',
            content: answer || '[Code submitted]',
            timestamp: Date.now(),
        }]);
        setUserInput('');
        setTranscript('');
        setLoading(true);

        const resolvedStage = STAGE_MAP[interviewType] || 'Technical';
        const resolvedCompany = targetCompany || 'Google';
        const resolvedRole = targetRole || 'Software Engineer';

        const technicalFollowUpFallbacks = experienceLevel === 'fresher'
            ? [
                'Can you connect that to a class project, internship, or side project you worked on?',
                'Can you give one concrete example from something you built or studied?',
                'Can you walk me through a specific project or coursework example that shows that in practice?',
            ]
            : [
                'Can you walk me through your approach step by step, including trade-offs?',
                'What alternative would you consider, and why?',
                'How would you apply that in a real system or team setting?',
            ];
        const pickTechnicalFollowUpFallback = (seed = 0) => {
            const index = Math.abs(seed) % technicalFollowUpFallbacks.length;
            return technicalFollowUpFallbacks[index];
        };

        try {
            const headers = getAuthHeaders ? getAuthHeaders() : {};

            // Build experience-aware advanced options for follow-up
            const followUpAdvancedOpts = {
                interviewerIntensity: experienceLevel === 'fresher' ? 'supportive' : 'balanced',
                followUpDepth: experienceLevel === 'fresher' ? 'shallow' : 'deep',
                answerPace: experienceLevel === 'fresher' ? 'slow' : 'balanced',
                resumeInterviewMode: experienceLevel === 'fresher' ? 'fresher-hr-tech' : 'project-deep-dive',
                questionCount: totalQuestions,
            };

            const res = await fetch('/api/company-interview/follow-up', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({
                    previousQuestion: currentQuestion,
                    userAnswer: fullAnswer,
                    // Fix #3: Use ref to avoid stale closure on questionIndex
                    questionNumber: questionIndexRef.current + 1,
                    totalQuestions,
                    company: resolvedCompany,
                    role: resolvedRole,
                    stage: resolvedStage,
                    difficulty: experienceLevel === 'fresher' ? 'easy' : 'medium',
                    experienceLevel,
                    conversationHistory: conversation.slice(-12).map(m => ({ role: m.role, content: m.content })),
                    code: code.trim() || undefined,
                    codeLanguage: language,
                    advancedOptions: followUpAdvancedOpts,
                    resumeContext: activeResumeContext,
                }),
            });

            if (!res.ok) {
                const errorPayload = {
                    stage: resolvedStage,
                    questionIndex,
                    experienceLevel,
                };
                logAPIError('/api/company-interview/follow-up', 'follow-up-http', res, errorPayload);
                throw createHttpError(res.status, res.statusText);
            }

            const data = await res.json();

            // 
            const feedbackScore = data.feedback?.score || data.score || 0;

            // Update stage label from backend state machine
            if (data.stageLabel) {
                setStageLabel(data.stageLabel);
            }

            // 
            const nextQ = data.followUpQuestion || data.nextQuestion || data.question;
            const closingRemark = data.closingRemark;

            // ONLY end the interview when the backend explicitly signals completion.
            // DO NOT use closingRemark alone 
            const isInterviewOver = data.complete === true || questionIndex >= totalQuestions;
            const followUpFallbackByStage = {
                'DSA / Coding': 'Can you walk me through your approach step by step, and then share the time and space complexity?',
                'System Design': 'Can you explain your architecture step by step, including key trade-offs and bottlenecks?',
                'Behavioral': 'Can you walk me through that situation using STAR: Situation, Task, Action, and Result?',
                'Technical': pickTechnicalFollowUpFallback(questionIndex - 1),
                'HR': 'Can you share one concrete example that supports your answer?',
            };
            const fallbackQ = followUpFallbackByStage[resolvedStage] || 'Can you walk me through your approach step by step, including trade-offs?';
            const continueQ = (typeof nextQ === 'string' && nextQ.trim().length > 0) ? nextQ : fallbackQ;

            // CRITICAL: Pre-fetch TTS audio for next question ONLY.
            // Feedback is shown as text-only (not spoken) to minimize voice delay.
            if (!isInterviewOver) {
                console.log('[Interview] Pre-fetching next question audio:', continueQ.substring(0, 50) + '...');
                voiceAI.prefetch(continueQ);
            }

            // Shared speak-and-handoff logic (used in both try and catch)
            // SPEED FIX: Only speak the question 
            const speakAndHandoff = async (questionSegment, isEnding = false) => {
                setLoading(false);
                if (isEnding) {
                    await speakInterviewerText(questionSegment);
                    setTimeout(() => endInterview(), 1500);
                } else {
                    // Speak only the next question (no feedback speech)
                    await speakInterviewerText(questionSegment);
                    if (!isListeningRef.current) {
                        startVoiceRecording();
                    }
                }
            };

            if (isInterviewOver) {
                // Last question 
                const closingText = data.closingRemark || closingRemark || 'Great job today! Thank you for your time. We\'ll be in touch soon.';
                setConversation(prev => [...prev, {
                    role: 'interviewer',
                    content: closingText,
                    timestamp: Date.now(),
                }]);
                await speakAndHandoff(closingText, true);
            } else if (consecutiveSilentQuestions >= 3) {
                // User has been silent for 3 consecutive questions 
                const earlyEndText = "I notice you might need more time to prepare. That's completely okay! Let's wrap up here. Thank you for your time today, and feel free to come back when you're ready. Best of luck with your preparation!";
                setConversation(prev => [...prev, {
                    role: 'interviewer',
                    content: earlyEndText,
                    timestamp: Date.now(),
                }]);
                setLoading(false);
                await speakInterviewerText(earlyEndText);
                setTimeout(() => endInterview(), 1500);
            } else {
                setCurrentQuestion(continueQ);
                setQuestionIndex(prev => prev + 1);
                setConversation(prev => [...prev, {
                    role: 'interviewer',
                    content: continueQ,
                    timestamp: Date.now(),
                }]);
                // No artificial delay 
                // Feedback is already added to conversation as text above.
                const reaction = getInterviewerReaction(feedbackScore, interviewType);
                setInterviewerStatus(`${reaction.emoji} ${reaction.text}`);
                await speakAndHandoff(continueQ);
                setInterviewerStatus('');
            }
        } catch (error) {
            const statusCode = getHttpStatus(error);
            if (statusCode !== 401) {
                logAPIError('/api/company-interview/follow-up', 'follow-up-catch', error, {
                    stage: resolvedStage,
                    questionIndex,
                });
            } else {
                console.warn('[AI Interview API Warning] follow-up unauthorized; using local fallback feedback flow.');
            }
            const catchFollowUpFallbackByStage = {
                'DSA / Coding': 'Can you tell me about the time and space complexity of your solution?',
                'System Design': 'How would this design behave at 10x scale, and what would you change first?',
                'Behavioral': 'Can you share the specific action you took and what outcome it produced?',
                'Technical': pickTechnicalFollowUpFallback(questionIndex),
                'HR': 'Can you give one concrete example that shows this about you?',
            };
            const fallbackQ = catchFollowUpFallbackByStage[resolvedStage] || 'Can you tell me about the time and space complexity of your solution?';

            // Bug 12 Fix: Check if interview should be over even in error path
            const isInterviewOverFallback = questionIndex >= totalQuestions;

            if (isInterviewOverFallback) {
                const closingFallback = 'Great job today! Thank you for your time. We\'ll be in touch soon.';
                setConversation(prev => [...prev, {
                    role: 'interviewer',
                    content: closingFallback,
                    timestamp: Date.now(),
                }]);
                setLoading(false);
                await speakInterviewerText(closingFallback);
                setTimeout(() => endInterview(), 1500);
            } else {
                setConversation(prev => [...prev, {
                    role: 'interviewer',
                    content: fallbackQ,
                    timestamp: Date.now(),
                }]);
                setCurrentQuestion(fallbackQ);
                setQuestionIndex(prev => prev + 1);
                setLoading(false);
                await speakInterviewerText(fallbackQ);
                if (!isListeningRef.current) {
                    startVoiceRecording();
                }
            }
        }
        } finally {
            // Always release the send guard
            isSendingRef.current = false;
        }
    };

    useEffect(() => {
        sendAnswerRef.current = sendAnswer;
    }, [sendAnswer]);

    const stopSilenceHandling = useCallback(() => {
        if (silenceStageTimerRef.current) clearTimeout(silenceStageTimerRef.current);
        setSilenceStage(0);
        setInterviewerStatus('');
    }, []);

    const startSilenceHandling = useCallback(() => {
        stopSilenceHandling();
        if (phase !== 'interview') return;

        // Stage 1: After 5s of silence -> "Take your time"
        silenceStageTimerRef.current = setTimeout(() => {
            if (!isListeningRef.current || stateRefs.current.transcript.trim()) return;
            setSilenceStage(1);
            setInterviewerStatus(getSilencePrompt(interviewType, 0));

            // Stage 2: After 10s total -> Ask to rephrase
            silenceStageTimerRef.current = setTimeout(() => {
                if (!isListeningRef.current || stateRefs.current.transcript.trim()) return;
                setSilenceStage(2);
                const rephraseText = "Would you like me to rephrase the question?";
                setInterviewerStatus(rephraseText);
                setConversation(prev => [...prev, { role: 'interviewer', content: rephraseText, timestamp: Date.now() }]);
                // Wait for rephrase speech to finish before starting auto-skip timer
                speakInterviewerText(rephraseText).then(() => {
                    // Stage 3: After rephrase finishes + 5s silence -> Auto-skip
                    silenceStageTimerRef.current = setTimeout(() => {
                        // NOTE: Mic may have dropped 
                        // since its answer is hardcoded ("I do not have a response").
                        // Only bail if user actually started typing/speaking.
                        if (stateRefs.current.transcript.trim()) return;
                        setSilenceStage(3);
                        setInterviewerStatus('');
                        // Use ref to avoid stale closure in memoized callback
                        if (sendAnswerRef.current) sendAnswerRef.current(true);
                    }, 5000);
                });
            }, 5000);
        }, 5000);
    }, [phase, speakInterviewerText, stopSilenceHandling]);

    useEffect(() => {
        if (isListening && !transcript.trim() && !aiSpeaking) {
            startSilenceHandling();
        } else {
            stopSilenceHandling();
        }
    }, [isListening, transcript, aiSpeaking, startSilenceHandling, stopSilenceHandling]);

    // 
    // Bug 1+2 fix: useCallback with proper deps + full resource cleanup
    const endInterview = useCallback(() => {
        clearInterval(timerRef.current);
        clearInterval(questionTimerRef.current);
        if (silenceStageTimerRef.current) clearTimeout(silenceStageTimerRef.current);
        stopVoiceRecording();
        speakSequenceCancelledRef.current = true;
        voiceAI.interrupt();
        if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null; }
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        setAiSpeaking(false);
        // Bug 1 fix: Release WebSocket + mic stream (no longer needed after interview)
        voiceAI.cleanup();
        // I14: Log voice pipeline analytics
        try {
            const stats = voiceAI.getAnalytics();
            console.info('[AI Interview] Voice analytics:', stats);
        } catch {}
        // I9: Clear saved session 
        clearSavedSession();
        setPhase('summary');
    }, [voiceAI, stopVoiceRecording, clearSavedSession]);


    // Pause/Resume toggle 
    const togglePause = useCallback(() => {
        if (isPaused) {
            if (pauseStartRef.current) {
                setTotalPauseTime(prev => prev + (Date.now() - pauseStartRef.current));
                pauseStartRef.current = null;
            }
            setIsPaused(false);
            setInterviewerStatus('');
            if (!isListeningRef.current) startVoiceRecording();
        } else {
            pauseStartRef.current = Date.now();
            setIsPaused(true);
            setInterviewerStatus('Interview paused');
            stopVoiceRecording();
            voiceAI.interrupt();
            speakSequenceCancelledRef.current = true;
            if (ttsAudioRef.current) {
                ttsAudioRef.current.pause();
            }
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        }
    }, [isPaused, startVoiceRecording, stopVoiceRecording, voiceAI]);
    // 
    const endInterviewRef = useRef(null); // Avoids stale closure in effect
    useEffect(() => {
        endInterviewRef.current = endInterview;
    }, [endInterview]);
    useEffect(() => {
        if (phase !== 'interview' || isPaused) return;
        const resolvedStage = STAGE_MAP[interviewType] || 'Technical';
        const totalBudget = totalQuestions * getQuestionTimeLimit(resolvedStage);
        if (elapsed >= totalBudget) {
            console.info(`[AI Interview] Global timer expired (${formatTime(totalBudget)}). Auto-ending interview.`);
            if (endInterviewRef.current) endInterviewRef.current();
        }
    }, [elapsed, phase, isPaused, interviewType, totalQuestions]);

    // 
    const toggleMic = useCallback(() => {
        if (isListening) {
            // Currently listening 
            stopVoiceRecording();
            // micOn syncs automatically via useEffect
        } else {
            // Not listening 
            startVoiceRecording();
            // micOn syncs automatically via useEffect
        }
    }, [isListening, stopVoiceRecording, startVoiceRecording]);

    // 
    const handleVoiceInput = () => {
        if (isListening) {
            stopVoiceRecording();
        } else {
            startVoiceRecording();
            // micOn syncs automatically via useEffect
        }
    };

    // 
    const toggleCamera = useCallback(() => {
        if (cameraOn && streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
            if (videoRef.current) videoRef.current.srcObject = null;
        }
        setCameraOn(prev => !prev);
    }, [cameraOn, streamRef, videoRef]);


    // -- Keyboard Shortcuts (interview phase only) --
    useEffect(() => {
        if (phase !== 'interview') return;
        const handler = (e) => {
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
            if (document.activeElement?.classList?.contains('inputarea')) return;
            switch (e.key.toLowerCase()) {
                case 'm': toggleMic(); break;
                case 'v': toggleCamera(); break;
                case 'p': togglePause(); break;
                case 'escape': endInterview(); break;
                default: break;
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [phase, toggleMic, toggleCamera, togglePause, endInterview]);
    // 
    const userName = user?.user_metadata?.full_name || 'Panchanan Sahoo';
    const userInitial = userName[0]?.toUpperCase() || 'P';

    // 
    //  LOBBY PHASE 
    // 
    if (phase === 'lobby') {
        return (
            <InterviewLobby
                setupStep={setupStep} setSetupStep={setSetupStep}
                experienceLevel={experienceLevel} setExperienceLevel={setExperienceLevel}
                interviewType={interviewType} setInterviewType={setInterviewType}
                interviewerGender={interviewerGender} setInterviewerGender={setInterviewerGender}
                targetRole={targetRole} setTargetRole={setTargetRole}
                targetCompany={targetCompany} setTargetCompany={setTargetCompany}
                companySearch={companySearch} setCompanySearch={setCompanySearch}
                companyTab={companyTab} setCompanyTab={setCompanyTab}
                resumeFile={resumeFile}
                realtimeMode={realtimeMode} setRealtimeMode={setRealtimeMode}
                loading={loading}
                savedSession={savedSession}
                interviewer={INTERVIEWER}
                formatTime={formatTime}
                onStartInterview={startInterview}
                onRestoreSession={restoreSession}
                onClearSavedSession={clearSavedSession}
                onResumeDragOver={handleResumeDragOver}
                onResumeDragLeave={handleResumeDragLeave}
                onResumeDrop={handleResumeDrop}
                onResumeFileChange={handleResumeFileChange}
            />
        );
    }

    // 
    //  CONNECTING PHASE 
    // 
    if (phase === 'connecting') {
        return (
            <div className="ai-interview-page">
                <div className="ai-connect-backdrop">
                    {/* Ambient glow effects */}
                    <div className="ai-connect-glow ai-connect-glow--left" />
                    <div className="ai-connect-glow ai-connect-glow--right" />

                    <div className="ai-connect-container">
                        {/* Title with animated status */}
                        <div className="ai-connect-status-text">
                            <Wifi size={18} className="ai-connect-wifi-icon" />
                            Connecting to your interviewer
                        </div>
                        
                        {/* Progress steps */}
                        <div className="ai-connect-steps">
                            <div className="ai-connect-step ai-connect-step--active">
                                <div className="ai-connect-step-icon">
                                    <Sparkles size={14} />
                                </div>
                                <div className="ai-connect-step-label">Generating first question</div>
                            </div>
                            <div className="ai-connect-step ai-connect-step--active">
                                <div className="ai-connect-step-icon">
                                    <Volume2 size={14} />
                                </div>
                                <div className="ai-connect-step-label">Pre-generating audio</div>
                            </div>
                            <div className="ai-connect-step ai-connect-step--pending">
                                <div className="ai-connect-step-icon">
                                    <Mic size={14} />
                                </div>
                                <div className="ai-connect-step-label">Preparing microphone</div>
                            </div>
                        </div>

                        {/* Matchmaking cards */}
                        <div className="ai-connect-matchup">
                            {/* Candidate card */}
                            <div className="ai-connect-card ai-connect-card--candidate">
                                <div className="ai-connect-avatar">
                                    <div className="ai-connect-avatar-ring" />
                                    <div className="ai-connect-avatar-inner">
                                        <User size={28} />
                                    </div>
                                </div>
                                <div className="ai-connect-name">{userName}</div>
                                <div className="ai-connect-role">Candidate</div>
                            </div>

                            {/* Connection indicator */}
                            <div className="ai-connect-bridge">
                                <div className="ai-connect-line">
                                    <div className="ai-connect-dot ai-connect-dot--1" />
                                    <div className="ai-connect-dot ai-connect-dot--2" />
                                    <div className="ai-connect-dot ai-connect-dot--3" />
                                </div>
                                <div className="ai-connect-pulse-ring" />
                            </div>

                            {/* Interviewer card */}
                            <div className="ai-connect-card ai-connect-card--interviewer">
                                <div className="ai-connect-avatar ai-connect-avatar--ai">
                                    <div className="ai-connect-avatar-ring ai-connect-avatar-ring--ai" />
                                    <div className="ai-connect-avatar-inner ai-connect-avatar-inner--ai">
                                        <Sparkles size={28} />
                                    </div>
                                </div>
                                <div className="ai-connect-name">{INTERVIEWER.name}</div>
                                <div className="ai-connect-role">{INTERVIEWER.role}</div>
                                <div className="ai-connect-company">
                                    <Building2 size={12} />
                                    {INTERVIEWER.company}
                                </div>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="ai-connect-progress">
                            <div className="ai-connect-progress-bar" />
                        </div>
                        <p className="ai-connect-hint">Setting up your personalized session...</p>
                    </div>
                </div>
            </div>
        );
    }

    // 
    //  SUMMARY PHASE 
    // 
    if (phase === 'summary') {
        return (
            <InterviewResults
                analysisResult={analysisResult}
                analysisLoading={analysisLoading}
                interviewer={INTERVIEWER}
                interviewType={interviewType}
                conversation={conversation}
                onStartNew={() => {
                    setPhase('lobby');
                    setSetupStep(0);
                    setElapsed(0);
                    setConversation([]);
                    setQuestionIndex(0);
                    setAnalysisResult(null);
                    setInterviewerGender('female');
                    setExperienceLevel('fresher');
                }}
            />
        );
    }

    // 
    //  INTERVIEW PHASE 
    // 
    return (
        <div className="ai-interview-page ai-interview-page--videocall">
            {/* 
            {/* -- Minimal Top Bar -- */}
            <InterviewTopBar
                interviewType={interviewType}
                totalQuestions={totalQuestions}
                questionIndex={questionIndex}
                elapsed={elapsed}
                questionElapsed={questionElapsed}
                isPaused={isPaused}
                stageLabel={stageLabel}
                stagePlan={stagePlan}
                targetCompany={targetCompany}
                connectionMode={voiceAI.connectionMode}
                connectionHealth={voiceAI.connectionHealth}
                workspacePanelOpen={workspacePanelOpen}
                setWorkspacePanelOpen={setWorkspacePanelOpen}
                endInterview={endInterview}
                onNavigateBack={() => navigate('/interview-suite')}
            />

            <div className="ai-vc-body">
                {/* === LEFT: Video Call Area === */}
                <div className={`ai-vc-video-area ${!workspacePanelOpen ? 'ai-vc-video-area--full' : ''}`}>
                    {/* AI Interviewer */}
                    <div className={`ai-vc-tile ai-vc-tile--interviewer ${aiSpeaking ? 'ai-vc-tile--speaking' : ''}`}>
                        <div className="ai-vc-tile-bg">
                            <video
                                ref={interviewerSpeakingVideoRef}
                                src={interviewerVideos.speaking}
                                className={`ai-vc-ai-video ai-vc-ai-video--layer ai-vc-ai-video--speaking ${interviewerVisibleMode === 'speaking' ? 'is-active' : 'is-inactive'} ${interviewerTargetModeRef.current === 'speaking' && !interviewerVideoReady.speaking ? 'is-pending' : ''}`}
                                autoPlay
                                loop
                                muted
                                playsInline
                                preload="auto"
                                onLoadedMetadata={handleSpeakingLoadedMetadata}
                                onTimeUpdate={handleSpeakingTimeUpdate}
                                onCanPlay={handleSpeakingCanPlay}
                            />
                            <video
                                ref={interviewerListeningVideoRef}
                                src={interviewerVideos.listening}
                                className={`ai-vc-ai-video ai-vc-ai-video--layer ai-vc-ai-video--listening ${interviewerVisibleMode === 'listening' ? 'is-active' : 'is-inactive'} ${interviewerTargetModeRef.current === 'listening' && !interviewerVideoReady.listening ? 'is-pending' : ''}`}
                                autoPlay
                                loop
                                muted
                                playsInline
                                preload="auto"
                                onLoadedMetadata={handleListeningLoadedMetadata}
                                onTimeUpdate={handleListeningTimeUpdate}
                                onCanPlay={handleListeningCanPlay}
                            />

                            {aiSpeaking && (
                                <div className="ai-vc-video-speaking-glow" />
                            )}

                            {aiSpeaking && (
                                <div className="ai-vc-speaking-ring">
                                    <div className="ai-vc-speaking-ring-inner" />
                                </div>
                            )}

                            {/* AI Lip-sync bars (Phase 4) */}
                            {aiSpeaking && (
                                <div className="ai-vc-lipsync">
                                    {[...Array(3)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="ai-vc-lipsync-bar"
                                            style={{
                                                animationDelay: `${i * 0.12}s`,
                                                height: `${6 + (voiceAI.outputBars?.[i * 2] || 0) * 18}px`,
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Name badge */}
                        <div className="ai-vc-tile-badge">
                            <div className="ai-vc-tile-badge-dot" />
                            <span className="ai-vc-tile-badge-name">{INTERVIEWER.name}</span>
                            <span className="ai-vc-tile-badge-role">{INTERVIEWER.role}</span>
                        </div>
                        {/* Speaking wave overlay */}
                        {aiSpeaking ? (
                            <div className="ai-vc-wave-overlay" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 12px 10px' }}>
                                <VoiceWaveform
                                    bars={voiceAI.outputBars}
                                    active={voiceAI.outputActive}
                                    color="#a78bfa"
                                    height={36}
                                />
                            </div>
                        ) : isListening ? (
                            <div className="ai-vc-wave-overlay" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 12px 10px' }}>
                                <VoiceWaveform
                                    bars={voiceAI.inputBars}
                                    active={voiceAI.inputActive}
                                    color="#34d399"
                                    height={36}
                                />
                            </div>
                        ) : null}

                        {/* Filler word counter badge + Confidence meter (Phase 2) */}
                        {isListening && intelligence.totalFillers > 0 && (
                            <div className="ai-vc-filler-badge" title="Filler words detected">
                                <AlertTriangle size={11} />
                                <span>{intelligence.totalFillers}</span>
                            </div>
                        )}
                        {isListening && (
                            <div className="ai-vc-confidence-meter" title={`Confidence: ${intelligence.confidenceScore}%`}>
                                <div className="ai-vc-confidence-meter-fill" style={{ width: `${intelligence.confidenceScore}%` }} />
                            </div>
                        )}
                        {/* Status message overlay */}
                        <div className="ai-vc-status-overlay">
                            {aiSpeaking ? (
                                <div className="ai-vc-status-pill ai-vc-status-pill--speaking">
                                    <Volume2 size={12} /> Speaking...
                                </div>
                            ) : loading ? (
                                <div className="ai-vc-status-pill ai-vc-status-pill--thinking">
                                    <Brain size={12} /> Evaluating...
                                </div>
                            ) : interviewerStatus ? (
                                <div className="ai-vc-status-pill ai-vc-status-pill--thinking" style={{ background: 'rgba(245, 158, 11, 0.9)' }}>
                                    <MessageSquare size={12} /> {interviewerStatus}
                                </div>
                            ) : voiceAI.errorMessage ? (
                                <div className="ai-vc-status-pill ai-vc-status-pill--thinking" style={{ background: 'rgba(239, 68, 68, 0.9)' }}>
                                    <AlertTriangle size={12} /> {voiceAI.errorMessage}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* User Camera */}
                    <div className="ai-vc-tile ai-vc-tile--user">
                        {cameraOn ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="ai-vc-user-video"
                            />
                        ) : (
                            <div className="ai-vc-user-off">
                                <div className="ai-vc-user-off-avatar">
                                    {userInitial}
                                </div>
                            </div>
                        )}
                        <div className="ai-vc-tile-badge ai-vc-tile-badge--user">
                            <span className="ai-vc-tile-badge-name">You</span>
                            {!micOn && <MicOff size={11} className="ai-vc-muted-icon" />}
                        </div>
                    </div>

                    {/* -- Live Captions Overlay -- */}
                    <LiveCaptions
                        captionsOn={captionsOn}
                        isListening={isListening}
                        aiSpeaking={aiSpeaking}
                        interimText={voiceAI.interimText}
                        transcript={transcript}
                        conversation={conversation}
                        interviewerName={INTERVIEWER.name}
                        silenceCountdown={voiceAI.silenceCountdown}
                    />

                    {/* Floating Controls Bar */}
                    <InterviewControls
                        micOn={micOn} toggleMic={toggleMic} isListening={isListening}
                        cameraOn={cameraOn} toggleCamera={toggleCamera}
                        speakerMuted={speakerMuted} setSpeakerMuted={setSpeakerMuted}
                        isPaused={isPaused} onTogglePause={togglePause}
                        captionsOn={captionsOn} setCaptionsOn={setCaptionsOn}
                        chatOpen={chatOpen} setChatOpen={setChatOpen}
                        bookmarked={bookmarked} setBookmarked={setBookmarked}
                        endInterview={endInterview}
                        connectionMode={voiceAI.connectionMode}
                    />
                </div>

                {/* === RIGHT: Workspace Panel (Collapsible) === */}
                {/* === RIGHT: Workspace Panel (Collapsible) === */}
                {workspacePanelOpen && (
                    <InterviewWorkspace
                        activeTab={activeTab} setActiveTab={setActiveTab}
                        workspaceDropdownOpen={workspaceDropdownOpen} setWorkspaceDropdownOpen={setWorkspaceDropdownOpen}
                        language={language} onLanguageChange={handleLanguageChange}
                        code={code} setCode={setCode}
                        onReset={handleReset}
                        notes={notes} setNotes={setNotes}
                        isListening={isListening} transcript={transcript}
                        silenceCountdown={silenceCountdown}
                        onVoiceInput={handleVoiceInput}
                        userInput={userInput} setUserInput={setUserInput} setTranscript={setTranscript}
                        onSendAnswer={sendAnswer}
                        loading={loading}
                    />
                )}

                {/* Chat Sidebar (togglable, overlays) */}
                {chatOpen && (
                    <ChatSidebar
                        conversation={conversation}
                        interviewerName={INTERVIEWER.name}
                        loading={loading}
                        userInput={userInput} setUserInput={setUserInput}
                        onSendAnswer={sendAnswer}
                        onClose={() => setChatOpen(false)}
                        chatEndRef={chatEndRef}
                        code={code}
                    />
                )}

                {/* Live Intelligence Overlays */}
                <ScoreCueToast cue={scoreCue} onDismiss={() => setScoreCue(null)} />
                <HintBanner hint={activeHint} onDismiss={() => setActiveHint(null)} />
            </div>
        </div>
    );
}




