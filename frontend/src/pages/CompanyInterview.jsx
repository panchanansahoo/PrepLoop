import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import './CompanyInterview.css';
import { Mic, MicOff, Video, VideoOff, MessageSquare, Phone, Send, Clock, Users, Sparkles, ChevronRight, ChevronLeft, Star, TrendingUp, CheckCircle, AlertCircle, BarChart3, RefreshCw, ArrowLeft, Volume2, X, Monitor, MoreVertical, Hand, SmilePlus, Lightbulb, Target, Brain, Award, Zap, Timer, Eye, Code2, Shield, Bookmark, Settings } from 'lucide-react';
import { Upload, FileText } from 'lucide-react';
import { COMPANIES, STAGES, ROLES, DIFFICULTIES } from '../data/companyPrepMeta';
import { useAuth } from '../context/AuthContext';
import { buildAuthHeaders } from '../utils/authHeaders';
import { authFetch } from '../utils/authFetch';
import { Link } from 'react-router-dom';
import SpeechAnalyzer from '../utils/speechAnalyzer';
import EmotionDetector from '../components/EmotionDetector';
import AICopilot from '../components/AICopilot';
import CodeEditorPanel from '../components/CodeEditorPanel';
import ProctoringManager from '../components/ProctoringManager';
import DetailedReport from '../components/interview/DetailedReport';

import MicLevel from '../components/interview/MicLevel';
import {
    AUTO_SUBMIT_DELAY_MS,
    SILENCE_TO_NEXT_QUESTION_MS,
    VOICE_INPUT_COMMIT_DELAY_MS,
    buildVoiceAnswerSnapshot,
    formatInterviewDuration,
} from './companyInterviewTiming';
import {
    INTERVIEW_LABELS,
    INTERVIEW_PRESETS,
    _clampInterviewScore,
    buildInterviewSummaryFallback,
    normalizeFeedbackList,
} from './companyInterviewConfig';

import { API_URL } from '../config/api.js';
const AUTO_SUBMIT_COUNTDOWN_SECONDS = AUTO_SUBMIT_DELAY_MS / 1000;

export default function CompanyInterview() {
    const { user } = useAuth();
    const INTERVIEW_RUNTIME_MODES = [
        { value: 'full_realtime', label: 'Full Real-Time' },
    ];

    // ── State ──
    const [phase, setPhase] = useState('lobby'); // lobby | interview | summary
    const phaseRef = useRef(phase);
    useEffect(() => { phaseRef.current = phase; }, [phase]);

    const [config, setConfig] = useState({
        company: 'google', role: 'SDE', stage: 'Technical',
        difficulty: 'Medium', format: 'voice', interviewerGender: 'female', interviewerPersona: 'auto'
    });
    const [conversation, setConversation] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [sessionScores, setSessionScores] = useState([]);
    const [summaryData, setSummaryData] = useState(null);
    const [detailedReportData, setDetailedReportData] = useState(null);
    const [questionCount, setQuestionCount] = useState(0);
    const [advancedOptions, setAdvancedOptions] = useState({
        interviewerIntensity: 'balanced',
        followUpDepth: 'standard',
        answerPace: 'balanced',
        realInterviewerMode: false,
        resumeInterviewMode: 'balanced',
        focusTopics: '',
        questionCount: 8,
    });
    const [activePreset, setActivePreset] = useState(null);
    const [interviewRuntimeMode, setInterviewRuntimeMode] = useState('full_realtime');
    const [runtimeStrategy, setRuntimeStrategy] = useState('realtime_voice_bridge');
    const [realtimeStartError, setRealtimeStartError] = useState('');
    const [useResumeContext, setUseResumeContext] = useState(false);
    const [resumeUploadLoading, setResumeUploadLoading] = useState(false);
    const [resumeContext, setResumeContext] = useState(null);
    const [resumeFileName, setResumeFileName] = useState('');
    const totalQuestions = advancedOptions.questionCount;
    const isFresherHrTechMode = advancedOptions.resumeInterviewMode === 'fresher-hr-tech';
    const sessionDurationSeconds = isFresherHrTechMode ? 20 * 60 : 30 * 60;
    const remainingSeconds = Math.max(0, sessionDurationSeconds - elapsed);
    const timerDisplaySeconds = isFresherHrTechMode ? remainingSeconds : elapsed;

    // Realism features
    const [hintData, setHintData] = useState(null);
    const [hintLoading, setHintLoading] = useState(false);
    const [interviewerReaction, setInterviewerReaction] = useState(null);
    const [thinkTimeLeft, setThinkTimeLeft] = useState(0);
    const thinkTimerRef = useRef(null);

    // UX Realism — active listening, silence handling, status
    const [interviewerStatus, setInterviewerStatus] = useState(''); // 'reviewing' | 'thinking' | 'notes' | ''
    const [silenceStage, setSilenceStage] = useState(0); // 0=none, 1="take your time", 2="auto-advance"
    const silenceStageTimerRef = useRef(null);
    const activeListeningTimerRef = useRef(null);
    const [aiSpeechCaption, setAiSpeechCaption] = useState(''); // Live subtitles for AI speech
    const [tabFocused, setTabFocused] = useState(true);

    // Interviewer name — generated once per session for realism
    const interviewerName = useMemo(() => {
        const maleNames = ['James', 'David', 'Michael', 'Arjun', 'Rahul', 'Daniel', 'Robert', 'Aditya', 'Vikram', 'Sanjay'];
        const femaleNames = ['Sarah', 'Priya', 'Emily', 'Ananya', 'Megha', 'Jessica', 'Kavitha', 'Neha', 'Aisha', 'Rachel'];
        const lastNames = ['Sharma', 'Patel', 'Kumar', 'Chen', 'Williams', 'Johnson', 'Gupta', 'Lee', 'Singh', 'Taylor'];
        const names = config.interviewerGender === 'male' ? maleNames : femaleNames;
        const idx = Math.abs((config.company || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % names.length;
        const lIdx = Math.abs((config.role || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % lastNames.length;
        return `${names[idx]} ${lastNames[lIdx]}`;
    }, [config.company, config.role, config.interviewerGender]);

    const _interviewerRole = useMemo(() => {
        const stageLabel = String(config.stage || 'technical').replace(/[-_]/g, ' ');
        return `${stageLabel} interviewer`;
    }, [config.stage]);

    // Media
    const [cameraOn, setCameraOn] = useState(true);
    const [micOn, setMicOn] = useState(true);
    const [stream, setStream] = useState(null);
    const [chatOpen, setChatOpen] = useState(true);
    const [_fullscreen,_setFullscreenn] = useState(false);

    // Voice
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimText, setInterimText] = useState('');
    const [speechFeedback, setSpeechFeedback] = useState(null);
    const [speechStartTime, setSpeechStartTime] = useState(null);
    const [aiSpeaking, setAiSpeaking] = useState(false);
    const [autoSendCountdown, setAutoSendCountdown] = useState(0);
    const autoSendTimerRef = useRef(null);
    const autoSendCountdownRef = useRef(null);
    const interviewerPauseRef = useRef(null);

    // Timer
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef(null);
    const timeLimitTriggeredRef = useRef(false);

    // Refs
    const videoRef = useRef(null);
    const handleVideoRef = useCallback((node) => {
        videoRef.current = node;
        if (node && streamRef.current) {
            node.srcObject = streamRef.current;
        }
    }, []);
    const chatEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const streamRef = useRef(null);
    const speechAnalyzerRef = useRef(new SpeechAnalyzer());
    const speakingStartRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const consecutiveSkipsRef = useRef(0);
    const captionsEndRef = useRef(null);
    const resumeFileInputRef = useRef(null);
    const [isTranscribing, setIsTranscribing] = useState(false);

    // Advanced features state
    const [speechMetrics, setSpeechMetrics] = useState(null);
    const [emotionEnabled, setEmotionEnabled] = useState(false);
    const [emotionMetrics, setEmotionMetrics] = useState(null);
    const [copilotOpen, setCopilotOpen] = useState(false);
    const [speechHistory, _setSpeechHistory] = useState([]); // per-answer speech data

    // Adaptive difficulty
    const [difficultyLevel, setDifficultyLevel] = useState('medium');
    const [_adaptiveNote, setAdaptiveNote] = useState(null);
    const [codeFeedback, setCodeFeedback] = useState(null);

    // Code editor (for DSA/OA stages)
    const [codeEditorOpen, setCodeEditorOpen] = useState(false);
    const [editorCode, setEditorCode] = useState('');
    const [editorLanguage, setEditorLanguage] = useState('python');

    // Proctoring
    const [proctoringEnabled, _setProctoringEnabled] = useState(true);
    const [proctoringViolations, setProctoringViolations] = useState([]);

    // Company-specific questions
    const [useRealQuestions, setUseRealQuestions] = useState(false);
    const [questionBankIds, setQuestionBankIds] = useState([]);
    const [currentQuestionMeta, setCurrentQuestionMeta] = useState(null);
    const [_questionSource, setQuestionSource] = useState('ai');

    // ── Helpers ──
    const companyObj = COMPANIES.find(c => c.id === config.company) || COMPANIES[0];
    const companyName = companyObj.name;
    const companyLogo = companyObj.logo;
    const companyColor = companyObj.color;

    const getAuthHeaders = () => {
        return buildAuthHeaders(user);
    };

    const formatTime = (secs) => formatInterviewDuration(secs);

    const updateAdvancedOption = (key, value) => {
        setActivePreset(null);
        setAdvancedOptions(prev => ({ ...prev, [key]: value }));
    };

    const waitInterviewerBeat = (base = 900, jitter = 600) => {
        const duration = base + Math.floor(Math.random() * jitter);
        return new Promise(resolve => {
            interviewerPauseRef.current = setTimeout(() => {
                interviewerPauseRef.current = null;
                resolve();
            }, duration);
        });
    };

    // ── Ambient Typing Sounds (Web Audio API — no external files) ──
    const audioCtxRef = useRef(null);
    const typingSoundIntervalRef = useRef(null);

    const playTypingSound = useCallback(() => {
        try {
            if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') ctx.resume();

            const playClick = () => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 800 + Math.random() * 600; // Randomized key pitch
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.015, ctx.currentTime); // Very subtle
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.05);
            };

            // Random burst of 2-5 "keystrokes"
            const count = 2 + Math.floor(Math.random() * 4);
            for (let i = 0; i < count; i++) {
                setTimeout(playClick, i * (60 + Math.random() * 80));
            }
        } catch { /* Audio context unavailable — silent fallback */ }
    }, []);

    const startTypingSounds = useCallback(() => {
        clearInterval(typingSoundIntervalRef.current);
        typingSoundIntervalRef.current = setInterval(() => {
            playTypingSound();
        }, 1200 + Math.random() * 800); // Every 1.2-2s
    }, [playTypingSound]);

    const stopTypingSounds = useCallback(() => {
        clearInterval(typingSoundIntervalRef.current);
    }, []);

    // ── Interview Chime (start/end) ──
    const playChime = useCallback((type = 'start') => {
        try {
            if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') ctx.resume();

            const notes = type === 'start' ? [523, 659, 784] : [784, 659, 523]; // C-E-G ascending / descending
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                const startTime = ctx.currentTime + i * 0.15;
                gain.gain.setValueAtTime(0.06, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
                osc.start(startTime);
                osc.stop(startTime + 0.4);
            });
        } catch { /* silent */ }
    }, []);

    // ── Question transition state ──
    const [questionTransition, setQuestionTransition] = useState(false);

    const transitionToQuestion = useCallback((question) => {
        setQuestionTransition(true);
        setTimeout(() => {
            setCurrentQuestion(question);
            setQuestionTransition(false);
        }, 300);
    }, []);

    // ── Active Listening Cues ("mmhmm", "right", nod) ──
    const startActiveListening = useCallback(() => {
        clearInterval(activeListeningTimerRef.current);
        const cues = ['Mmhmm...', 'Right...', 'I see...', 'Go on...', 'Okay...'];
        let cueIndex = 0;
        activeListeningTimerRef.current = setInterval(() => {
            if (!isListeningRef.current || !accumulatedTranscriptRef.current || accumulatedTranscriptRef.current.trim().split(/\s+/).length < 12) return;
            // Show a brief visual nod/cue without interrupting speech recognition
            const cue = cues[cueIndex % cues.length];
            setInterviewerStatus(cue);
            setInterviewerReaction('listening');
            setTimeout(() => {
                if (isListeningRef.current) {
                    setInterviewerStatus('');
                }
            }, 1800);
            cueIndex++;
        }, 10000 + Math.floor(Math.random() * 5000)); // Every 10-15 seconds
    }, []);

    const stopActiveListening = useCallback(() => {
        clearInterval(activeListeningTimerRef.current);
        setInterviewerStatus('');
    }, []);

    // ── Progressive Silence Handling ──
    const startSilenceHandling = useCallback(() => {
        clearTimeout(silenceStageTimerRef.current);
        setSilenceStage(0);

        // Stage 1: After 4s of silence → gentle nudge
        silenceStageTimerRef.current = setTimeout(() => {
            if (!isListeningRef.current || accumulatedTranscriptRef.current.trim()) return;
            setSilenceStage(1);
            setInterviewerStatus('Take your time, no rush...');

            // Stage 2: After 10s total → advance to the next question
            silenceStageTimerRef.current = setTimeout(() => {
                if (!isListeningRef.current || accumulatedTranscriptRef.current.trim()) return;
                setSilenceStage(2);
                setInterviewerStatus('No answer detected. Moving to the next question...');
                document.dispatchEvent(new CustomEvent('interview-auto-send', { detail: { autoSkip: true } }));
            }, SILENCE_TO_NEXT_QUESTION_MS - AUTO_SUBMIT_DELAY_MS);
        }, AUTO_SUBMIT_DELAY_MS);
    }, []);

    const stopSilenceHandling = useCallback(() => {
        clearTimeout(silenceStageTimerRef.current);
        setSilenceStage(0);
    }, []);

    // ── Multi-part speaking: split feedback + question into natural beats ──
    const speakWithBeats = async (feedback, question, onComplete) => {
        if (!feedback && !question) {
            if (onComplete) onComplete();
            return;
        }

        // Beat 1: Brief acknowledgment
        const quickAcks = ['Got it.', 'Interesting.', 'Alright.', 'Nice.', 'Okay.', 'I see.'];
        const ack = quickAcks[Math.floor(Math.random() * quickAcks.length)];

        if (feedback) {
            // Speak brief ack
            setInterviewerReaction('thinking');
            await waitInterviewerBeat(400, 200);
            if (phaseRef.current !== 'interview') return;

            // Beat 2: Speak the feedback
            setInterviewerReaction('notes');
            setInterviewerStatus('');
            await new Promise(resolve => {
                speakText(`${ack} ${feedback}`, resolve);
            });
            if (phaseRef.current !== 'interview') return;

            // Beat 3: Brief pause before next question
            setInterviewerReaction('thinking');
            setAiSpeaking(false);
            await waitInterviewerBeat(600, 400);
            if (phaseRef.current !== 'interview') return;
        }

        if (question) {
            // Beat 4: Ask the next question
            setInterviewerReaction('neutral');
            speakText(question, onComplete);
        } else {
            if (onComplete) onComplete();
        }
    };

    const applyPreset = (preset) => {
        setActivePreset(preset.id);
        setAdvancedOptions(prev => ({ ...prev, ...preset.options }));
    };

    useEffect(() => {
        if (advancedOptions.resumeInterviewMode !== 'fresher-hr-tech') return;
        if (advancedOptions.questionCount === 12) return;
        setAdvancedOptions(prev => ({ ...prev, questionCount: 12 }));
    }, [advancedOptions.resumeInterviewMode, advancedOptions.questionCount]);

    useEffect(() => {
        if (phase !== 'interview') return;
        if (!isFresherHrTechMode) return;
        if (remainingSeconds > 0) return;
        if (timeLimitTriggeredRef.current) return;

        timeLimitTriggeredRef.current = true;
        endInterview();
    }, [phase, isFresherHrTechMode, remainingSeconds]);

    const uploadResumeForInterview = async (file) => {
        if (!file) return;

        setResumeUploadLoading(true);
        setResumeFileName(file.name);

        try {
            const formData = new FormData();
            formData.append('resume', file);

            const headers = getAuthHeaders();
            delete headers['Content-Type'];

            const res = await fetch(`${API_URL}/api/resume/analyze`, {
                method: 'POST',
                headers,
                body: formData,
            });

            const data = await res.json();
            if (data?.interviewRuntimeMode) {
                setInterviewRuntimeMode(data.interviewRuntimeMode);
            }
            if (data?.runtime?.strategy) {
                setRuntimeStrategy(data.runtime.strategy);
            }
            if (!res.ok) {
                throw new Error(data.error || 'Failed to upload CV');
            }

            const profile = data.resumeProfile || {};
            profile.ats_score = data.analysis?.atsScore || data.analysis?.ats_score;
            setResumeContext(profile);
            setUseResumeContext(true);
        } catch (error) {
            console.error('CV upload failed:', error);
            setResumeContext(null);
        } finally {
            setResumeUploadLoading(false);
        }
    };

    const loadLatestResumeForInterview = async () => {
        setResumeUploadLoading(true);
        try {
            const res = await authFetch(`${API_URL}/api/resume/latest`);

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to load latest CV');
            }

            const profile = data.resumeProfile || {};
            profile.ats_score = data.analysis?.ats_score || data.analysis?.atsScore;
            setResumeContext(profile);
            setResumeFileName('Latest saved CV');
            setUseResumeContext(true);
        } catch (error) {
            console.error('Load latest CV failed:', error);
            setResumeContext(null);
        } finally {
            setResumeUploadLoading(false);
        }
    };

    const _getQuestionSourceBadge = (source) => {
        if (source === 'database') return { label: 'Real company', className: 'database' };
        if (source === 'resume') return { label: 'From CV', className: 'resume' };
        if (source === 'ai-scripted') return { label: 'AI HR + Tech', className: 'ai' };
        return { label: 'AI generated', className: 'ai' };
    };

    // ── Media controls ──
    const startMedia = async () => {
        try {
            const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = s;
            setStream(s);
            if (videoRef.current) videoRef.current.srcObject = s;
            const videoTrack = s.getVideoTracks()[0];
            const audioTrack = s.getAudioTracks()[0];
            setCameraOn(Boolean(videoTrack?.enabled));
            setMicOn(Boolean(audioTrack?.enabled));
            return true;
        } catch {
            // Recover with microphone-only access when camera+audio fails.
            try {
                const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                streamRef.current = audioOnlyStream;
                setStream(audioOnlyStream);
                if (videoRef.current) videoRef.current.srcObject = null;
                const audioTrack = audioOnlyStream.getAudioTracks()[0];
                setCameraOn(false);
                setMicOn(Boolean(audioTrack?.enabled));
                return true;
            } catch {
                // Last fallback: no media available.
                setStream(null);
                setCameraOn(false);
                setMicOn(false);
                return false;
            }
        }
    };

    const stopMedia = () => {
        // Stop camera & mic tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
            setStream(null);
        }
        // Stop speech recognition
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.stop();
        }
        isListeningRef.current = false;
        setIsListening(false);
        setCameraOn(false);
        setMicOn(false);
    };

    const toggleCamera = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setCameraOn(videoTrack.enabled);
            }
        }
    };

    const toggleMic = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setMicOn(audioTrack.enabled);
            }
        }
    };

    // Scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);

    // Scroll captions
    useEffect(() => {
        captionsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [interimText, transcript]);

    // Connect video element when stream changes
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream, phase]);

    const isMountedRef = useRef(true);

    // Cleanup on component unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            stopMedia();
            clearInterval(timerRef.current);
            clearInterval(thinkTimerRef.current);
            clearTimeout(autoSendTimerRef.current);
            clearTimeout(inactivityTimerRef.current);
            clearInterval(autoSendCountdownRef.current);
            clearTimeout(silenceStageTimerRef.current);
            clearInterval(activeListeningTimerRef.current);
            clearInterval(typingSoundIntervalRef.current);
            window.speechSynthesis?.cancel();
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
                audioPlayerRef.current.src = '';
            }
            if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(() => {});
            }
        };
    }, []);

    // ── TTS — pick the most natural voice available ──
    const _getBestVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        if (!voices.length) return null;

        // Preferred voices ranked by naturalness (tested across browsers)
        const preferred = [
            'Google UK English Female',       // Chrome — very natural
            'Google US English',              // Chrome — natural
            'Microsoft Zira',                 // Edge/Windows — clear & warm
            'Microsoft Aria Online',          // Edge — neural, very human
            'Microsoft Jenny Online',         // Edge — neural
            'Samantha',                       // macOS/Safari — excellent
            'Karen',                          // macOS — good Australian
            'Daniel',                         // macOS — British male
            'Moira',                          // macOS — Irish
            'Google UK English Male',         // Chrome fallback
        ];

        // Try exact match first
        for (const name of preferred) {
            const match = voices.find(v => v.name === name);
            if (match) return match;
        }

        // Fallback: pick any English voice that's marked as natural/premium
        const naturalEn = voices.find(v =>
            v.lang.startsWith('en') && (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('neural') || v.name.toLowerCase().includes('online'))
        );
        if (naturalEn) return naturalEn;

        // Fallback: any female English voice (tend to sound clearer on TTS)
        const femaleEn = voices.find(v =>
            v.lang.startsWith('en') && (/female|zira|samantha|jenny|aria|fiona|karen/i.test(v.name))
        );
        if (femaleEn) return femaleEn;

        // Fallback: any English voice
        const anyEn = voices.find(v => v.lang.startsWith('en'));
        return anyEn || voices[0];
    };

    // Keep utterance in a ref to prevent garbage collection in Chrome which causes onend to not fire
    const utteranceRef = useRef(null);
    const audioPlayerRef = useRef(null);

    const sanitizeForSpeech = (rawText) => {
        const text = String(rawText || '')
            .replace(/```[\s\S]*?```/g, ' ')
            .replace(/[`*_#]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (!text) return '';

        // Add tiny pauses after punctuation to make TTS cadence feel less robotic.
        return text
            .replace(/([.,!?;:])(\s+|$)/g, '$1 ')
            .replace(/\s{2,}/g, ' ')
            .trim();
    };

    const _getVoicePersona = () => {
        if (config.interviewerPersona && config.interviewerPersona !== 'auto') {
            return config.interviewerPersona;
        }

        const companyId = String(config.company || '').toLowerCase();
        const isFaangLike = ['google', 'amazon', 'meta', 'microsoft', 'apple', 'netflix'].includes(companyId);
        const isStartupLike = ['flipkart', 'paytm', 'swiggy', 'zomato', 'razorpay', 'cred', 'meesho'].includes(companyId);

        if (interviewerReaction === 'challenging' || config.stage === 'System Design' || config.stage === 'Technical') {
            return 'analytical';
        }
        if (config.stage === 'HR' || config.stage === 'Behavioral') {
            return 'friendly';
        }
        if (isStartupLike) {
            return 'casual';
        }
        if (isFaangLike && config.stage === 'DSA / Coding') {
            return 'analytical';
        }
        if (interviewerReaction === 'neutral' && config.stage === 'DSA / Coding') {
            return 'formal';
        }
        return 'friendly';
    };

    const speakText = async (text, onComplete) => {
        setAiSpeaking(true);
        setAiSpeechCaption(text); // Show live caption

        const ttsPersona = 'friendly';
        const spokenText = sanitizeForSpeech(text);
        if (!spokenText) {
            setAiSpeaking(false);
            setAiSpeechCaption('');
            if (onComplete) onComplete();
            return;
        }

        // Try high-quality backend TTS first
        try {
            const res = await authFetch(`${API_URL}/api/voice/tts`, {
                method: 'POST',
                body: JSON.stringify({
                    text: spokenText,
                    persona: ttsPersona,
                    gender: config.interviewerGender
                })
            });

            if (res.ok) {
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await res.json();
                    if (data.fallback) {
                        fallbackSpeakText(spokenText, ttsPersona, onComplete);
                        return;
                    }
                }
                const blob = await res.blob();
                const audioUrl = URL.createObjectURL(blob);

                if (audioPlayerRef.current) {
                    audioPlayerRef.current.pause();
                    URL.revokeObjectURL(audioPlayerRef.current.src);
                }

                const audio = new Audio(audioUrl);
                audioPlayerRef.current = audio;

                audio.onended = () => {
                    if (!isMountedRef.current || phaseRef.current !== 'interview') return;
                    setAiSpeaking(false);
                    setAiSpeechCaption('');
                    URL.revokeObjectURL(audioUrl);
                    if (onComplete) setTimeout(() => onComplete(), 100);
                };

                audio.onerror = (e) => {
                    if (!isMountedRef.current || phaseRef.current !== 'interview') return;
                    console.warn('Audio playback error, falling back to browser TTS', e);
                    fallbackSpeakText(spokenText, ttsPersona, onComplete);
                };

                if (!isMountedRef.current || phaseRef.current !== 'interview') return;
                await audio.play();
                return; // Success, exit early
            } else {
                console.warn('Backend TTS failed, falling back to browser TTS');
            }
        } catch (err) {
            console.warn('Error fetching backend TTS, falling back to browser', err);
        }

        // Fast Fallback: built-in browser TTS
        fallbackSpeakText(spokenText, ttsPersona, onComplete);
    };

    const fallbackSpeakText = (text, persona = 'friendly', onComplete) => {
        if (!window.speechSynthesis) {
            if (onComplete) onComplete();
            return;
        }
        window.speechSynthesis.cancel();

        const speak = () => {
            const utterance = new SpeechSynthesisUtterance(text);
            const getBestVoice = () => {
                const voices = window.speechSynthesis.getVoices();
                if (voices.length === 0) return null;

                const englishVoices = voices.filter(v => v.lang?.toLowerCase().startsWith('en'));
                if (!englishVoices.length) return voices[0];

                const femalePreferred = [
                    'Microsoft Aria Online',
                    'Microsoft Jenny Online',
                    'Google UK English Female',
                    'Google US English',
                    'Samantha',
                    'Microsoft Zira',
                    'Microsoft Zira Desktop'
                ];
                const malePreferred = [
                    'Microsoft Guy Online',
                    'Google UK English Male',
                    'Daniel',
                    'Microsoft David',
                    'Microsoft David Desktop'
                ];

                const preferredNames = config.interviewerGender === 'male' ? malePreferred : femalePreferred;
                for (const name of preferredNames) {
                    const exact = englishVoices.find(v => v.name === name);
                    if (exact) return exact;
                }

                const genderHintRegex = config.interviewerGender === 'male'
                    ? /(male|guy|man|daniel|david|james)/i
                    : /(female|woman|girl|aria|jenny|zira|samantha|victoria|fiona|karen)/i;

                const genderNeuralLike = englishVoices.find(v =>
                    /(online|neural|natural|premium)/i.test(v.name) && genderHintRegex.test(v.name)
                );
                if (genderNeuralLike) return genderNeuralLike;

                const neuralLike = englishVoices.find(v => /(online|neural|natural|premium)/i.test(v.name));
                if (neuralLike) return neuralLike;

                const genderHint = englishVoices.find(v => genderHintRegex.test(v.name));
                if (genderHint) return genderHint;

                const localServiceVoice = englishVoices.find(v => v.localService);
                return localServiceVoice || englishVoices[0];
            };
            const voice = getBestVoice();
            if (voice) utterance.voice = voice;

            // Dynamic parameters tuned for realistic interviewer cadence
            const fastRounds = config.stage === 'DSA / Coding' || config.stage === 'Technical';
            const paceAdjust = fastRounds ? 0.02 : 0;

            if (persona === 'analytical') {
                utterance.rate = 0.92 + paceAdjust;
                utterance.pitch = 1.0;
            } else if (persona === 'formal') {
                utterance.rate = 0.9 + paceAdjust;
                utterance.pitch = 0.98;
            } else if (persona === 'casual') {
                utterance.rate = 0.95;
                utterance.pitch = 1.04;
            } else {
                utterance.rate = 0.93;
                utterance.pitch = 1.02;
            }
            utterance.volume = 0.95;   // not blasting, feels natural

            utterance.onstart = () => {
                if (isMountedRef.current && phaseRef.current === 'interview') setAiSpeaking(true);
            };
            utterance.onend = () => {
                if (!isMountedRef.current || phaseRef.current !== 'interview') return;
                setAiSpeaking(false);
                setAiSpeechCaption('');
                utteranceRef.current = null;
                if (onComplete) setTimeout(() => onComplete(), 100);
            };
            utterance.onerror = (e) => {
                if (!isMountedRef.current || phaseRef.current !== 'interview') return;
                console.warn('SpeechSynthesis error:', e);
                setAiSpeaking(false);
                setAiSpeechCaption('');
                utteranceRef.current = null;
                if (onComplete) setTimeout(() => onComplete(), 100);
            };

            utteranceRef.current = utterance; // Prevent GC
            if (isMountedRef.current && phaseRef.current === 'interview') {
                window.speechSynthesis.speak(utterance);
            }
        };

        // Voices may load async — wait if needed
        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = () => { speak(); window.speechSynthesis.onvoiceschanged = null; };
        } else {
            speak();
        }
    };

    // ── Speech Recognition (robust) ──
    const isListeningRef = useRef(false);
    const accumulatedTranscriptRef = useRef('');
    const latestUserInputRef = useRef('');
    const latestInterimTextRef = useRef('');
    const inactivityTimerRef = useRef(null);

    const initSpeechRecognition = useCallback(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            console.warn('Speech Recognition API not supported in this browser');
            return null;
        }
        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const t = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += t + ' ';
                } else {
                    interimTranscript += t;
                }
            }

            if (finalTranscript || interimTranscript) {
                clearTimeout(inactivityTimerRef.current);
                // Reset progressive silence handling — user is speaking
                stopSilenceHandling();
                setSilenceStage(0);
                setInterviewerStatus('');
            }

            if (finalTranscript) {
                accumulatedTranscriptRef.current += finalTranscript;
                latestInterimTextRef.current = '';
                latestUserInputRef.current = accumulatedTranscriptRef.current;
                setTranscript(accumulatedTranscriptRef.current);
                setUserInput(accumulatedTranscriptRef.current);
                setInterimText('');

                // Real-time speech analysis
                if (speakingStartRef.current) {
                    const dur = (Date.now() - speakingStartRef.current) / 1000;
                    const metrics = speechAnalyzerRef.current.analyze(accumulatedTranscriptRef.current, dur);
                    setSpeechMetrics(metrics);
                } else {
                    speakingStartRef.current = Date.now();
                }

                // Reset auto-send timer — user just finished a sentence
                clearTimeout(autoSendTimerRef.current);
                clearInterval(autoSendCountdownRef.current);
                setAutoSendCountdown(AUTO_SUBMIT_COUNTDOWN_SECONDS);
                // Start 4-second countdown to auto-send with clear visual indicator
                let countdown = AUTO_SUBMIT_COUNTDOWN_SECONDS;
                autoSendCountdownRef.current = setInterval(() => {
                    countdown--;
                    setAutoSendCountdown(countdown);
                    if (countdown <= 0) {
                        clearInterval(autoSendCountdownRef.current);
                    }
                }, 1000);
                autoSendTimerRef.current = setTimeout(() => {
                    // Auto-send if we still have text and are still listening
                    if (accumulatedTranscriptRef.current.trim()) {
                        // Trigger send via a custom event since we can't call sendAnswer directly
                        document.dispatchEvent(new CustomEvent('interview-auto-send'));
                    }
                }, 5000);
            } else if (interimTranscript) {
                // Show interim (live) text so user sees words appearing in real-time
                latestInterimTextRef.current = interimTranscript;
                latestUserInputRef.current = accumulatedTranscriptRef.current + interimTranscript;
                setInterimText(interimTranscript);
                setUserInput(accumulatedTranscriptRef.current + interimTranscript);
                // Cancel auto-send — user is still speaking
                clearTimeout(autoSendTimerRef.current);
                clearInterval(autoSendCountdownRef.current);
                setAutoSendCountdown(0);
            }
        };

        recognition.onerror = (event) => {
            console.warn('Speech recognition error:', event.error);
            // Don't stop for 'no-speech' — user just hasn't spoken yet
            if (event.error === 'no-speech' || event.error === 'aborted') return;
            // For other errors (not-allowed, network), stop listening
            isListeningRef.current = false;
            setIsListening(false);
        };

        recognition.onend = () => {
            // Auto-restart if we're supposed to still be listening
            // (recognition can timeout after silence, browser can stop it)
            if (isListeningRef.current) {
                try {
                    recognition.start();
                } catch (e) {
                    console.warn('Could not restart recognition:', e);
                    isListeningRef.current = false;
                    setIsListening(false);
                }
            }
        };

        return recognition;
    }, []);

    // ── Stop AI speech (for interruption) ──
    const stopAiSpeech = useCallback(() => {
        window.speechSynthesis?.cancel();
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current.currentTime = 0;
        }
        setAiSpeaking(false);
    }, []);

    const toggleListening = useCallback(async (forceStart = false) => {
        if (config.format !== 'voice') return; // Don't auto-listen in text mode

        // Interrupt AI speech when user starts speaking
        if (!isListeningRef.current || forceStart) {
            stopAiSpeech();
        }

        if (isListeningRef.current && !forceStart) {
            // ── Stop listening ──
            isListeningRef.current = false;
            setIsListening(false);
            recognitionRef.current?.stop();

            // Stop outstanding MediaRecorder if user mutes or aborts
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                try { mediaRecorderRef.current.stop(); } catch (_e) { /* empty */ }
            }

            // Send speech feedback with accumulated transcript
            const finalText = accumulatedTranscriptRef.current.trim();
            if (finalText && speechStartTime) {
                const duration = (Date.now() - speechStartTime) / 1000;
                fetchSpeechFeedback(finalText, duration);
            }
        } else {
            // If we are already listening and forceStart is requested, just return to keep it running
            if (isListeningRef.current && forceStart) return;

            // Create fresh recognition instance each time to avoid stale state
            recognitionRef.current = initSpeechRecognition();

            accumulatedTranscriptRef.current = '';
            latestUserInputRef.current = '';
            latestInterimTextRef.current = '';
            setTranscript('');
            setInterimText('');
            setSpeechStartTime(Date.now());
            setAutoSendCountdown(0);
            clearTimeout(autoSendTimerRef.current);
            clearInterval(autoSendCountdownRef.current);

            try {
                // Ensure we have a live microphone track for recorder/STT.
                if (!streamRef.current || !streamRef.current.getAudioTracks().some(t => t.readyState === 'live')) {
                    try {
                        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                        streamRef.current = micStream;
                        setStream(micStream);
                        setCameraOn(false);
                        setMicOn(true);
                    } catch (micError) {
                        console.error('Unable to access microphone for listening:', micError);
                    }
                }

                isListeningRef.current = true;
                setIsListening(true);

                // Start browser speech recognition when available.
                if (recognitionRef.current) {
                    recognitionRef.current.start();
                }

                // --- STT RECORDING START ---
                if (streamRef.current) {
                    const hasLiveAudio = streamRef.current.getAudioTracks().some(t => t.readyState === 'live');
                    if (hasLiveAudio) {
                        // Clean up any lingering recorder
                        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                            try { mediaRecorderRef.current.stop(); } catch (_e) { /* empty */ }
                        }

                        audioChunksRef.current = [];
                        // Create a stream with ONLY the audio track so we don't accidentally record video
                        const audioStream = new MediaStream(streamRef.current.getAudioTracks());
                        const mr = new MediaRecorder(audioStream);
                        mr.ondataavailable = (e) => {
                            if (e.data.size > 0) audioChunksRef.current.push(e.data);
                        };
                        mediaRecorderRef.current = mr;
                        mr.start();
                    }
                }

                // Start progressive silence handling (replaces hard 10s timeout)
                clearTimeout(inactivityTimerRef.current);
                startSilenceHandling();
                // Start active listening cues (mmhmm, nod)
                startActiveListening();
            } catch (e) {
                console.error('Failed to start speech recognition:', e);
                isListeningRef.current = false;
                setIsListening(false);
            }
        }
    }, [initSpeechRecognition, speechStartTime, startSilenceHandling, startActiveListening]);

    useEffect(() => {
        latestUserInputRef.current = userInput;
    }, [userInput]);

    useEffect(() => {
        latestInterimTextRef.current = interimText;
    }, [interimText]);

    // ── API Calls ──
    // Start think-time countdown
    const startThinkTimer = (seconds) => {
        clearInterval(thinkTimerRef.current);
        setThinkTimeLeft(seconds);
        thinkTimerRef.current = setInterval(() => {
            setThinkTimeLeft(prev => {
                if (prev <= 1) { clearInterval(thinkTimerRef.current); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    // Request a hint from AI
    const requestHint = async () => {
        setHintLoading(true);
        try {
            const res = await authFetch(`${API_URL}/api/company-interview/hint`, {
                method: 'POST',
                body: JSON.stringify({
                    company: config.company, role: config.role, stage: config.stage,
                    currentQuestion, conversationHistory: conversation
                })
            });
            const data = await res.json();
            setHintData(data);
        } catch {
            setHintData({
                hint: 'Try breaking this problem into smaller, manageable parts.',
                approach: 'Start with the simplest case and build up from there.',
                keyTopics: ['Core concepts', 'Edge cases', 'Optimization']
            });
        }
        setHintLoading(false);
    };

    const startInterview = async () => {
        setLoading(true);
        setRealtimeStartError('');
        timeLimitTriggeredRef.current = false;
        consecutiveSkipsRef.current = 0;
        if (!streamRef.current) {
            await startMedia();
        }
        setPhase('interview');
        setConversation([]);
        setSessionScores([]);
        setQuestionCount(0);
        setElapsed(0);
        setHintData(null);
        setInterviewerReaction(null);

        // Play interview start chime
        playChime('start');

        const resolvedExperienceLevel = isFresherHrTechMode ? 'fresher' : 'experienced';
        let effectiveInterviewMode = interviewRuntimeMode;

        try {
            const res = await authFetch(`${API_URL}/api/company-interview/start`, {
                method: 'POST',
                body: JSON.stringify({
                    ...config,
                    totalQuestions,
                    interviewRuntimeMode: effectiveInterviewMode,
                    experienceLevel: resolvedExperienceLevel,
                    useRealQuestions,
                    advancedOptions,
                    resumeContext: useResumeContext ? resumeContext : null,
                })
            });
            const data = await res.json();
            if (data?.interviewRuntimeMode) {
                setInterviewRuntimeMode(data.interviewRuntimeMode);
            }
            if (data?.runtime?.strategy) {
                setRuntimeStrategy(data.runtime.strategy);
            }

            // Warm greeting with interviewer name
            const greetings = [
                `Hi there! I'm ${interviewerName} from the ${config.stage} team at ${companyName}. Thanks for joining us today. `,
                `Hello! My name is ${interviewerName}, and I'll be conducting your ${config.stage} interview for ${companyName} today. `,
                `Welcome! I'm ${interviewerName}. I'll be your interviewer today for the ${config.stage} round at ${companyName}. `
            ];
            const greeting = greetings[Math.floor(Math.random() * greetings.length)];

            const q = data.question || `Can you tell me about a challenging technical problem you solved recently?`;
            const fullFirstMsg = `${greeting}Let's get started. ${q}`;

            setInterviewerReaction('thinking');
            await waitInterviewerBeat(550, 350);
            setCurrentQuestion(q);
            setQuestionCount(1);
            setInterviewerReaction(data.interviewerReaction || 'greeting');
            if (data.thinkTime) startThinkTimer(data.thinkTime);

            // Track question source and bank IDs
            setQuestionSource(data.questionSource || 'ai');
            if (data.questionBank) setQuestionBankIds(data.questionBank);
            if (data.questionMeta) setCurrentQuestionMeta(data.questionMeta);

            const msg = { role: 'interviewer', content: fullFirstMsg, tips: data.tips || [], reaction: 'greeting', timestamp: new Date().toISOString(), questionSource: data.questionSource, questionMeta: data.questionMeta };
            setConversation([msg]);
            speakText(fullFirstMsg, () => toggleListening(true));
        } catch {
            const fallback = `Hi! I'm ${interviewerName} from ${companyName}. Welcome to your ${config.stage} interview. I'm looking forward to our conversation today. Let's dive in — tell me about a challenging project you worked on recently and what made it interesting.`;
            setInterviewerReaction('thinking');
            await waitInterviewerBeat(550, 350);
            setCurrentQuestion(fallback);
            setQuestionCount(1);
            setInterviewerReaction('greeting');
            startThinkTimer(30);
            setConversation([{ role: 'interviewer', content: fallback, tips: [], reaction: 'greeting', timestamp: new Date().toISOString() }]);
            speakText(fallback, () => toggleListening(true));
        }
        setLoading(false);
    };

    const sendAnswer = async (isAutoSkip = false, isInterrupted = false) => {
        const answerSnapshot = buildVoiceAnswerSnapshot({
            userInput: latestUserInputRef.current || userInput,
            accumulatedTranscript: accumulatedTranscriptRef.current,
            interimText: latestInterimTextRef.current || interimText,
        });
        if (!answerSnapshot && !isAutoSkip && !isInterrupted) return;

        // Stop voice recognition if active
        if (isListeningRef.current) {
            isListeningRef.current = false;
            setIsListening(false);
            recognitionRef.current?.stop();
        }

        if (answerSnapshot) {
            await new Promise(resolve => setTimeout(resolve, VOICE_INPUT_COMMIT_DELAY_MS));
        }

        // --- STT RECORDING STOP ---
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.onstop = () => {
                processFinalAudioAndSend(isAutoSkip, isInterrupted, answerSnapshot);
            };
            mediaRecorderRef.current.stop();
            return; // Exit here. The onstop callback handles the rest.
        } else {
            processFinalAudioAndSend(isAutoSkip, isInterrupted, answerSnapshot);
        }
    };

    const processFinalAudioAndSend = async (isAutoSkip, isInterrupted, answerSnapshot = '') => {
        let answerText = String(answerSnapshot || userInput || '').trim();

        // Call STT backend if we have audio chunks
        if (audioChunksRef.current.length > 0) {
            setIsTranscribing(true);
            try {
                const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                const formData = new FormData();

                // Keep the extension generic or derive from mime type
                const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
                formData.append('audio', audioBlob, `recording.${ext}`);

                const headers = getAuthHeaders();
                delete headers['Content-Type']; // Let browser set boundary automatically

                const res = await fetch(`${API_URL}/api/company-interview/stt`, {
                    method: 'POST',
                    headers,
                    body: formData
                });

                if (res.ok) {
                    const sttData = await res.json();
                    if (sttData.text?.trim()) {
                        answerText = sttData.text.trim();
                    }
                }
            } catch (err) {
                console.error('Whisper STT failed, using fallback transcript', err);
            }
            setIsTranscribing(false);
            audioChunksRef.current = [];
        }

        // Bail out if user clicked "End Interview" while STT was processing
        if (phaseRef.current !== 'interview') return;

        if (!answerText && !isAutoSkip && !isInterrupted) return;
        const answer = (isAutoSkip || isInterrupted) && !answerText ? "I do not have a response to this question." : answerText;

        // Track consecutive skipped/unanswered questions
        const isSkipped = !answerText || answer === "I do not have a response to this question.";
        if (isSkipped) {
            consecutiveSkipsRef.current += 1;
        } else {
            consecutiveSkipsRef.current = 0;
        }

        // Auto-end interview after 3 consecutive unanswered questions
        if (consecutiveSkipsRef.current >= 3) {
            clearTimeout(autoSendTimerRef.current);
            clearInterval(autoSendCountdownRef.current);
            clearTimeout(inactivityTimerRef.current);
            setAutoSendCountdown(0);
            clearInterval(thinkTimerRef.current);
            setThinkTimeLeft(0);

            const compliment = `That's perfectly okay! I can see you've been thinking hard about these questions. ` +
                `Interviews can be intense, and it's completely normal to feel stuck sometimes. ` +
                `You showed great courage by participating today — that itself is a big step! ` +
                `Let me compile your results so you can review the areas to focus on. Keep practicing, you're doing great! 🌟`;
            setConversation(prev => [...prev,
            { role: 'candidate', content: answer, timestamp: new Date().toISOString() },
            { role: 'interviewer', content: compliment, tips: [], reaction: 'encouraging', timestamp: new Date().toISOString() }
            ]);
            speakText(compliment);
            setTimeout(() => { endInterview(); }, 8000);
            return;
        }

        // Clear auto-send timers and silence handling
        clearTimeout(autoSendTimerRef.current);
        clearInterval(autoSendCountdownRef.current);
        clearTimeout(inactivityTimerRef.current);
        stopSilenceHandling();
        stopActiveListening();
        setAutoSendCountdown(0);
        setSilenceStage(0);

        setUserInput('');
        setTranscript('');
        setInterimText('');
        accumulatedTranscriptRef.current = '';
        latestUserInputRef.current = '';
        latestInterimTextRef.current = '';
        clearInterval(thinkTimerRef.current);
        setThinkTimeLeft(0);

        if (isInterrupted) {
            const interruptMsg = "I hate to interrupt, but we have a lot to cover. Let's move on.";
            setConversation(prev => [...prev, 
                { role: 'candidate', content: answer === "I do not have a response to this question." ? "(Interrupted while speaking)" : answer, timestamp: new Date().toISOString() },
                { role: 'interviewer', content: interruptMsg, tips: [], reaction: 'probing', timestamp: new Date().toISOString() }
            ]);
        } else {
            setConversation(prev => [...prev, { role: 'candidate', content: answer, timestamp: new Date().toISOString() }]);
        }
        
        setLoading(true);
        // Show contextual "reviewing" status + start ambient typing sounds
        setInterviewerStatus('Reviewing your answer...');
        setInterviewerReaction('notes');
        startTypingSounds();

        try {
            const resolvedExperienceLevel = isFresherHrTechMode ? 'fresher' : 'experienced';
            const lastScoreVal = sessionScores.length > 0 ? sessionScores[sessionScores.length - 1] : null;
            const avgScoreVal = sessionScores.length > 0 ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length) : null;

            const res = await authFetch(`${API_URL}/api/company-interview/follow-up`, {
                method: 'POST',
                body: JSON.stringify({
                    company: config.company, role: config.role, stage: config.stage,
                    difficulty: config.difficulty,
                    interviewRuntimeMode,
                    previousQuestion: currentQuestion, userAnswer: answer,
                    conversationHistory: conversation,
                    questionNumber: questionCount + 1, totalQuestions,
                    lastScore: lastScoreVal,
                    averageScore: avgScoreVal,
                    cumulativeScores: sessionScores,
                    code: editorCode || undefined,
                    codeLanguage: editorLanguage || undefined,
                    useRealQuestions,
                    questionBankIds: questionBankIds.length > 0 ? questionBankIds : undefined,
                    currentQuestionId: currentQuestionMeta?.id || undefined,
                    advancedOptions,
                    resumeContext: useResumeContext ? resumeContext : null,
                    experienceLevel: resolvedExperienceLevel,
                })
            });
            const data = await res.json();
            if (data?.interviewRuntimeMode) {
                setInterviewRuntimeMode(data.interviewRuntimeMode);
            }
            if (data?.runtime?.strategy) {
                setRuntimeStrategy(data.runtime.strategy);
            }

            // Bail out if the user clicked "End Interview" while follow-up generation was in flight
            if (phaseRef.current !== 'interview') return;

            setSessionScores(prev => [...prev, data.score || 70]);
            setInterviewerReaction(data.interviewerReaction || 'neutral');
            setHintData(null);
            setDifficultyLevel(data.difficultyLevel || 'medium');
            setAdaptiveNote(data.adaptiveNote || null);
            setCodeFeedback(data.codeFeedback || null);
            if (editorCode) setEditorCode(''); // reset code editor after submission

            setConversation(prev => [...prev, {
                role: 'feedback', content: data.feedback || 'Good response.',
                score: data.score || 70,
                strengths: normalizeFeedbackList(data.strengths),
                improvements: normalizeFeedbackList(data.improvements),
                reaction: data.interviewerReaction,
                timestamp: new Date().toISOString()
            }]);

            const followUp = typeof data.followUpQuestion === 'string' ? data.followUpQuestion.trim() : '';
            const isExplicitlyComplete = data.complete === true;
            // Allow +1 for the Reverse Q&A phase (candidate asking company questions)
            const hasRemainingQuestions = questionCount <= totalQuestions;

            // Only end when backend explicitly marks completion, or when no questions remain.
            // If backend returns an empty follow-up unexpectedly, continue with a safe fallback.
            if (!isExplicitlyComplete && hasRemainingQuestions) {
                let continueQuestion = followUp;
                
                if (questionCount === totalQuestions) {
                     continueQuestion = "We're just about out of time. Do you have any questions for me about the company or the role?";
                } else if (!continueQuestion) {
                    const continuityFallbacks = [
                        'Can you walk me through a recent project and your exact contribution?',
                        'How would you debug a production bug that is hard to reproduce?',
                        'What trade-offs do you consider before picking a solution?',
                        'How do you test your code to avoid regressions?',
                        'Tell me about a time you handled uncertainty during implementation.',
                        'How would you explain your approach to a non-technical teammate?'
                    ];
                    continueQuestion = continuityFallbacks[(Math.max(questionCount, 1) - 1) % continuityFallbacks.length];
                }

                const isDifficultFollowUp = data.difficultyLevel === 'hard' || (config.difficulty === 'Hard' && data.interviewerReaction === 'challenging');
                if (isDifficultFollowUp && questionCount < totalQuestions) {
                    setInterviewerReaction('notes');
                    setInterviewerStatus('Taking notes...');
                    await waitInterviewerBeat(520, 280);
                    if (phaseRef.current !== 'interview') return;
                }
                setInterviewerStatus('');
                transitionToQuestion(continueQuestion);
                setQuestionCount(prev => prev + 1); // allows it to hit totalQuestions + 1
                if (data.thinkTime) startThinkTimer(data.thinkTime);

                // Mid-interview time-check nudge
                const midPoint = Math.ceil(totalQuestions / 2);
                let timeNudge = '';
                if (questionCount === midPoint) {
                    timeNudge = `We're about halfway through now. `;
                } else if (questionCount === totalQuestions - 1) {
                    timeNudge = `Just one more question after this. `;
                }
                setConversation(prev => [...prev, {
                    role: 'interviewer', content: continueQuestion, tips: [],
                    reaction: questionCount === totalQuestions ? 'greeting' : data.interviewerReaction,
                    timestamp: new Date().toISOString(),
                    questionSource: questionCount === totalQuestions ? 'reverse_qa' : data.questionSource,
                    questionMeta: data.questionMeta
                }]);

                // Track question source metadata for next follow-up
                if (data.questionSource) setQuestionSource(data.questionSource);
                if (data.questionMeta) setCurrentQuestionMeta(data.questionMeta);
                
                stopTypingSounds();  // Stop ambient sounds before speaking
                // Use natural beats: feedback — pause — question (instead of one long monologue)
                if (isInterrupted) {
                    speakText(`${timeNudge}${continueQuestion}`, () => toggleListening(true));
                } else {
                    speakWithBeats(`${timeNudge}${data.feedback || ''}`, continueQuestion, () => toggleListening(true));
                }
            } else {
                stopTypingSounds();
                // All questions done — closing compliment with interviewer name and auto-end
                const closingMsg = data.closingRemark || `Thank you so much for your time today! It was a pleasure speaking with you. You gave some really thoughtful answers. I'm ${interviewerName}, and I'll be sharing my notes with the team. Best of luck!`;
                setConversation(prev => [...prev, {
                    role: 'interviewer', content: closingMsg, tips: [],
                    reaction: 'positive',
                    timestamp: new Date().toISOString()
                }]);
                playChime('end');
                speakText(closingMsg);
                setTimeout(() => { endInterview(); }, 6000);
            }
        } catch {
            if (phaseRef.current !== 'interview') return;

            const fallbacks = [
                'Tell me about a recent project you worked on. What was your specific contribution?',
                'How would you approach debugging a complex issue in production? Walk me through your process.',
                'What design patterns have you used recently? Can you describe one in detail?',
                'How do you approach testing your code? What kinds of tests do you write?',
                'Tell me about a time you had to make a technical trade-off. What did you consider?',
                'How would you explain a complex technical concept to a non-technical stakeholder?',
                'What is something new you learned recently that changed how you write code?',
                'Describe how you would refactor a large, messy codebase. Where would you start?',
            ];
            const fallbackQ = fallbacks[(questionCount - 1) % fallbacks.length];
            const fallbackFeedbacks = [
                "That's a solid start! I like where you're going with that.",
                "Good thinking. Let me explore another area with you.",
                "I can see your reasoning there. Let's shift gears a bit.",
                "Nice approach! Let me ask you something different now.",
            ];
            setInterviewerReaction('thinking');
            await waitInterviewerBeat(900, 700);
            if (phaseRef.current !== 'interview') return;
            stopTypingSounds();
            const fallbackFeedback = fallbackFeedbacks[Math.floor(Math.random() * fallbackFeedbacks.length)];
            setConversation(prev => [...prev, {
                role: 'feedback', content: fallbackFeedback, score: 70 + Math.floor(Math.random() * 15),
                strengths: ['Clear communication'], improvements: ['Add more specifics'],
                reaction: 'encouraging',
                timestamp: new Date().toISOString()
            }, {
                role: 'interviewer',
                content: fallbackQ,
                tips: [], reaction: 'probing', timestamp: new Date().toISOString()
            }]);
            setQuestionCount(prev => prev + 1);
            startThinkTimer(45);
            speakWithBeats(fallbackFeedback, fallbackQ, () => toggleListening(true));
        }
        setLoading(false);
        setInterviewerStatus('');
    };

    const fetchSpeechFeedback = async (text, duration) => {
        try {
            const res = await authFetch(`${API_URL}/api/company-interview/speech-feedback`, {
                method: 'POST',
                body: JSON.stringify({ transcript: text, duration })
            });
            const data = await res.json();
            setSpeechFeedback(data);
        } catch {
            setSpeechFeedback({
                wpm: Math.round((text.split(/\s+/).length / duration) * 60),
                paceAssessment: 'Analysis unavailable', totalFillers: 0, clarityScore: 75,
                tips: ['Keep practicing']
            });
        }
    };

    const endInterview = async () => {
        setLoading(true);
        setPhase('summary'); // Immediately show loading summary UI
        phaseRef.current = 'summary'; // Immediately lock phase to prevent async bleeding

        // Stop ALL voice, timers, and media immediately
        window.speechSynthesis?.cancel();
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current.currentTime = 0;
        }
        setAiSpeaking(false);
        clearInterval(timerRef.current);
        clearInterval(thinkTimerRef.current);
        clearTimeout(autoSendTimerRef.current);
        clearTimeout(inactivityTimerRef.current);
        clearInterval(autoSendCountdownRef.current);
        clearTimeout(interviewerPauseRef.current);
        setAutoSendCountdown(0);
        setThinkTimeLeft(0);

        // Stop voice playback entirely
        window.speechSynthesis?.cancel();
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current.currentTime = 0;
        }
        setAiSpeaking(false);
        setIsTranscribing(false);

        // Stop speech recognition
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.stop();
        }
        isListeningRef.current = false;
        setIsListening(false);

        const avg = sessionScores.length > 0 ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length) : 70;
        let reportData = null;

        try {
            const res = await authFetch(`${API_URL}/api/company-interview/detailed-report`, {
                method: 'POST',
                body: JSON.stringify({
                    company: config.company,
                    role: config.role,
                    stage: config.stage,
                    conversation,
                    sessionScores,
                    speechHistory: speechHistory || []
                })
            });
            if (!res.ok) throw new Error('Detailed report request failed');
            reportData = await res.json();
        } catch {
            reportData = buildInterviewSummaryFallback(avg, config, questionCount, speechHistory || []);
        }

        setSummaryData(reportData);
        setDetailedReportData(reportData);

        // Release camera and microphone
        stopMedia();
        setPhase('summary');
        setLoading(false);

        // Auto-save session to backend (non-blocking)
        try {
            authFetch(`${API_URL}/api/company-interview/save-session`, {
                method: 'POST',
                body: JSON.stringify({
                    type: 'single',
                    company: config.company, role: config.role,
                    stage: config.stage, difficulty: config.difficulty,
                    conversation, scores: sessionScores,
                    overallScore: reportData?.overallScore || avg,
                    summaryData: reportData || {},
                    speechMetrics: speechMetrics || null,
                    emotionData: emotionMetrics || null,
                    proctoringViolations: proctoringViolations || [],
                    completedAt: new Date().toISOString()
                })
            }).catch(e => console.warn('Session save failed (non-critical):', e.message));
        } catch { /* empty */ } // silently fail — session save is best-effort
    };

    const resetInterview = () => {
        timeLimitTriggeredRef.current = false;
        setRealtimeStartError('');
        setPhase('lobby');
        setConversation([]);
        setSummaryData(null);
        setDetailedReportData(null);
        setSpeechFeedback(null);
        setSessionScores([]);
        setQuestionCount(0);
        setElapsed(0);
        setHintData(null);
        setInterviewerReaction(null);
        consecutiveSkipsRef.current = 0;
        clearInterval(thinkTimerRef.current);
        clearTimeout(interviewerPauseRef.current);
        setThinkTimeLeft(0);
        // Stop voice
        window.speechSynthesis?.cancel();
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current.currentTime = 0;
        }
        setAiSpeaking(false);
        isListeningRef.current = false;
        setIsListening(false);
        recognitionRef.current?.stop();
        accumulatedTranscriptRef.current = '';
        stopMedia();
    };

    const _avgScore = sessionScores.length > 0
        ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length)
        : null;

    // Auto-send event listener
    useEffect(() => {
        const handleAutoSend = (e) => {
            const isAutoSkip = e.detail?.autoSkip;
            const isInterrupted = e.detail?.interrupted;
            const hasCapturedSpeech = Boolean(
                buildVoiceAnswerSnapshot({
                    userInput: latestUserInputRef.current,
                    accumulatedTranscript: accumulatedTranscriptRef.current,
                    interimText: latestInterimTextRef.current,
                })
            );
            if ((hasCapturedSpeech || isAutoSkip || isInterrupted) && isListeningRef.current) {
                // Stop listening first
                isListeningRef.current = false;
                setIsListening(false);
                recognitionRef.current?.stop();
                setAutoSendCountdown(0);
                // Trigger send
                sendAnswer(isAutoSkip, isInterrupted);
            }
        };
        document.addEventListener('interview-auto-send', handleAutoSend);
        return () => document.removeEventListener('interview-auto-send', handleAutoSend);
    }, [sendAnswer]);

    // Elapsed timer
    useEffect(() => {
        if (phase === 'interview') {
            timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [phase]);

    // Rambling check effect
    useEffect(() => {
        let interval;
        if (isListening) {
            interval = setInterval(() => {
                if (speakingStartRef.current) {
                    const speakDuration = Date.now() - speakingStartRef.current;
                    if (speakDuration > 180000) { // 3 minutes
                        clearInterval(interval);
                        document.dispatchEvent(new CustomEvent('interview-auto-send', { detail: { interrupted: true } }));
                    }
                }
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isListening]);

    // Scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation, loading]);

    // Bind video stream across phase changes
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [phase, stream, cameraOn]);

    // P11: visibilitychange — auto-restart mic when user returns to tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setTabFocused(false);
            } else {
                setTabFocused(true);
                // If we should be listening but recognition stopped, restart it
                if (phase === 'interview' && config.format === 'voice' && !aiSpeaking && !loading) {
                    if (!isListeningRef.current && questionCount > 0) {
                        setTimeout(() => {
                            if (phaseRef.current === 'interview' && !isListeningRef.current) {
                                toggleListening(true);
                            }
                        }, 500);
                    }
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [phase, config.format, aiSpeaking, loading, questionCount, toggleListening]);

    // P16: Tab focus warning — gentle nudge
    useEffect(() => {
        if (!tabFocused && phase === 'interview' && isListeningRef.current) {
            // Pause silence handling while tab is blurred to avoid false auto-skips
            clearTimeout(silenceStageTimerRef.current);
        }
    }, [tabFocused, phase]);

    // Keyboard shortcuts
    useEffect(() => {
        if (phase !== 'interview') return;
        const handleKeyDown = (e) => {
            // Don't capture if user is typing in an input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.code === 'Space' && !e.shiftKey && !e.ctrlKey && config.format === 'voice') {
                e.preventDefault();
                if (!aiSpeaking && !loading) {
                    toggleListening();
                }
            }
            if (e.code === 'Enter' && !e.shiftKey && !loading) {
                e.preventDefault();
                if (userInput.trim() || accumulatedTranscriptRef.current.trim()) {
                    sendAnswer();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [phase, config.format, aiSpeaking, loading, userInput, toggleListening, sendAnswer]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearTimeout(autoSendTimerRef.current);
            clearInterval(autoSendCountdownRef.current);
            clearInterval(thinkTimerRef.current);
            clearInterval(timerRef.current);
            clearTimeout(interviewerPauseRef.current);
            window.speechSynthesis?.cancel();
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
                audioPlayerRef.current.src = "";
            }
            recognitionRef.current?.stop();
        };
    }, []);

    // ═══════════════════════════════════════════
    //  LOBBY PHASE
    // ═══════════════════════════════════════════
    if (phase === 'lobby') {
        return (
            <div className="ti-lobby-page">
                <div className="ti-lobby">
                    {/* Left — Preview */}
                    <div className="ti-lobby-preview">
                        <div className="ti-lobby-video-wrap">
                            <video
                                ref={handleVideoRef}
                                autoPlay muted playsInline
                                className="ti-lobby-video"
                                style={{ display: cameraOn && stream ? 'block' : 'none' }}
                            />
                            {(!cameraOn || !stream) && (
                                <div className="ti-lobby-no-cam">
                                    <div className="ti-lobby-avatar-circle">
                                        <span>{user?.user_metadata?.full_name?.[0] || '👤'}</span>
                                    </div>
                                    <p>Camera is off</p>
                                </div>
                            )}
                            {/* Preview controls */}
                            <div className="ti-lobby-preview-controls">
                                <button
                                    className={`ti-lobby-ctrl-btn ${!micOn ? 'off' : ''}`}
                                    onClick={toggleMic}
                                    title={micOn ? 'Mute' : 'Unmute'}
                                >
                                    {micOn ? <Mic size={18} /> : <MicOff size={18} />}
                                </button>
                                <button
                                    className={`ti-lobby-ctrl-btn ${!cameraOn ? 'off' : ''}`}
                                    onClick={toggleCamera}
                                    title={cameraOn ? 'Turn off camera' : 'Turn on camera'}
                                >
                                    {cameraOn ? <Video size={18} /> : <VideoOff size={18} />}
                                </button>
                                {stream && <MicLevel stream={stream} />}
                            </div>
                        </div>
                        <button className="ti-check-btn" onClick={startMedia}>
                            <Settings size={14} /> Check devices
                        </button>
                    </div>

                    {/* Right — Config */}
                    <div className="ti-lobby-config">
                        <div className="ti-lobby-header">
                            <Link to="/company-prep" className="ti-lobby-back">
                                <ArrowLeft size={16} /> Back
                            </Link>
                            <h1>AI Mock Interview 🎓</h1>
                            <p>Practice for your dream company — no pressure, just growth!</p>
                        </div>

                        <div className="ti-lobby-form">
                            {/* Company */}
                            <div className="ti-form-section">
                                <label>{INTERVIEW_LABELS.company}</label>
                                <div className="ti-company-chips">
                                    {COMPANIES.map(c => (
                                        <button
                                            key={c.id}
                                            className={`ti-company-chip ${config.company === c.id ? 'active' : ''}`}
                                            onClick={() => setConfig(prev => ({ ...prev, company: c.id }))}
                                            style={config.company === c.id ? { borderColor: c.color, background: `${c.color}15`, color: c.color } : {}}
                                        >
                                            <span>{c.logo}</span> {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Role, Stage, Difficulty row */}
                            <div className="ti-form-row">
                                <div className="ti-form-section">
                                    <label>{INTERVIEW_LABELS.role}</label>
                                    <input
                                        type="text"
                                        list="role-suggestions"
                                        value={config.role}
                                        onChange={e => setConfig(prev => ({ ...prev, role: e.target.value }))}
                                        placeholder="e.g. ML Engineer, iOS Dev..."
                                        className="ti-role-input"
                                    />
                                    <datalist id="role-suggestions">
                                        {ROLES.map(r => <option key={r} value={r} />)}
                                    </datalist>
                                </div>
                                <div className="ti-form-section">
                                    <label>{INTERVIEW_LABELS.stage}</label>
                                    <select value={config.stage} onChange={e => setConfig(prev => ({ ...prev, stage: e.target.value }))}>
                                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="ti-form-section">
                                    <label>{INTERVIEW_LABELS.difficulty}</label>
                                    <select value={config.difficulty} onChange={e => setConfig(prev => ({ ...prev, difficulty: e.target.value }))}>
                                        {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Format & Gender */}
                            <div className="ti-form-row">
                                <div className="ti-form-section">
                                    <label>{INTERVIEW_LABELS.format}</label>
                                    <div className="ti-format-toggle">
                                        <button
                                            className={`ti-format-btn ${config.format === 'voice' ? 'active' : ''}`}
                                            onClick={() => setConfig(prev => ({ ...prev, format: 'voice' }))}
                                        >
                                            <Mic size={16} /> Voice Interview
                                        </button>
                                        <button
                                            className={`ti-format-btn ${config.format === 'text' ? 'active' : ''}`}
                                            onClick={() => setConfig(prev => ({ ...prev, format: 'text' }))}
                                        >
                                            <MessageSquare size={16} /> Text Only
                                        </button>
                                    </div>
                                </div>
                                <div className="ti-form-section">
                                    <label>{INTERVIEW_LABELS.interviewerVoice}</label>
                                    <div className="ti-format-toggle">
                                        <button
                                            className={`ti-format-btn ${config.interviewerGender === 'female' ? 'active' : ''}`}
                                            onClick={() => setConfig(prev => ({ ...prev, interviewerGender: 'female' }))}
                                        >
                                            Female Voice
                                        </button>
                                        <button
                                            className={`ti-format-btn ${config.interviewerGender === 'male' ? 'active' : ''}`}
                                            onClick={() => setConfig(prev => ({ ...prev, interviewerGender: 'male' }))}
                                        >
                                            Male Voice
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Tone / Persona */}
                            <div className="ti-form-row">
                                <div className="ti-form-section">
                                    <label>{INTERVIEW_LABELS.tonePersona}</label>
                                    <div className="ti-format-toggle">
                                        <select
                                            value={config.interviewerPersona}
                                            onChange={e => setConfig(prev => ({ ...prev, interviewerPersona: e.target.value }))}
                                            style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', width: '100%', fontSize: '14px' }}
                                        >
                                            <option value="auto">Auto (Context-Aware)</option>
                                            <option value="friendly">Professional & Friendly</option>
                                            <option value="encouraging">Warm & Supportive</option>
                                            <option value="analytical">Analytical & Precise</option>
                                            <option value="formal">Formal & Structured</option>
                                            <option value="challenging">Rigorous & Challenging</option>
                                            <option value="casual">Casual & Relaxed</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Question Source Toggle */}
                            <div className="ti-form-section">
                                <label>{INTERVIEW_LABELS.questionSource}</label>
                                <div className="ti-realq-toggle">
                                    <label className="ti-toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={useRealQuestions}
                                            onChange={() => setUseRealQuestions(prev => !prev)}
                                        />
                                        <span className="ti-toggle-slider"></span>
                                    </label>
                                    <span className="ti-toggle-label">
                                        {useRealQuestions ? (
                                            <><span className="ti-realq-badge">📋</span> Real {companyName} interview questions</>
                                        ) : (
                                            <><span className="ti-realq-badge">🤖</span> AI-generated questions</>
                                        )}
                                    </span>
                                {useRealQuestions && (
                                    <div className="ti-realq-note">
                                        Questions sourced from actual {companyName} interview reports
                                    </div>
                                )}
                                </div>
                            </div>

                            <div className="ti-form-section">
                                <label>{INTERVIEW_LABELS.resumePersonalization}</label>
                                <div className="ti-realq-toggle">
                                    <label className="ti-toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={useResumeContext}
                                            onChange={() => setUseResumeContext(prev => !prev)}
                                        />
                                        <span className="ti-toggle-slider"></span>
                                    </label>
                                    <span className="ti-toggle-label">
                                        <span className="ti-realq-badge">📄</span> Ask questions based on my CV
                                    </span>
                                </div>
                                <div className="ti-resume-actions">
                                    <input
                                        ref={resumeFileInputRef}
                                        type="file"
                                        accept=".pdf,.txt,.md,.doc,.docx"
                                        style={{ display: 'none' }}
                                        onChange={e => uploadResumeForInterview(e.target.files?.[0])}
                                    />
                                    <button
                                        type="button"
                                        className="ti-check-btn"
                                        onClick={() => resumeFileInputRef.current?.click()}
                                        disabled={resumeUploadLoading}
                                    >
                                        <Upload size={14} /> {resumeUploadLoading ? 'Uploading CV...' : 'Upload CV'}
                                    </button>
                                    <button
                                        type="button"
                                        className="ti-check-btn"
                                        onClick={loadLatestResumeForInterview}
                                        disabled={resumeUploadLoading}
                                    >
                                        <FileText size={14} /> {resumeUploadLoading ? 'Loading...' : 'Use latest saved CV'}
                                    </button>
                                    {resumeFileName && (
                                        <span className="ti-resume-file"><FileText size={13} /> {resumeFileName}</span>
                                    )}
                                </div>
                                <div className="ti-form-row" style={{ marginTop: 12 }}>
                                    <div className="ti-form-section">
                                        <label>{INTERVIEW_LABELS.resumeMode}</label>
                                        <select
                                            value={advancedOptions.resumeInterviewMode}
                                            onChange={e => updateAdvancedOption('resumeInterviewMode', e.target.value)}
                                        >
                                            <option value="balanced">Balanced Resume Mix</option>
                                            <option value="walkthrough">Walk Me Through Your Resume</option>
                                            <option value="project-deep-dive">Project Deep Dive</option>
                                            <option value="fresher-hr-tech">Fresher HR + Technical Flow</option>
                                        </select>
                                    </div>
                                </div>
                                {resumeContext && (
                                    <div className="ti-resume-preview">
                                        <div className="ti-resume-preview-title">{resumeContext.ats_score != null ? `ATS Score: ${resumeContext.ats_score}` : 'Resume profile ready'}</div>
                                        <div className="ti-resume-preview-copy">{resumeContext.summary}</div>
                                        {Array.isArray(resumeContext.coreSkills) && resumeContext.coreSkills.length > 0 && (
                                            <div className="ti-resume-skill-list">
                                                {resumeContext.coreSkills.slice(0, 6).map(skill => (
                                                    <span key={skill} className="ti-resume-skill-chip">{skill}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {useResumeContext && !resumeContext && (
                                    <div className="ti-realq-note">
                                        Upload your CV so the interviewer can ask about your actual projects, tools, and experience.
                                    </div>
                                )}
                            </div>

                            {/* Advanced AI Controls */}
                            <div className="ti-form-section">
                                <label>{INTERVIEW_LABELS.advancedControls}</label>
                                <div className="ti-preset-grid">
                                    {INTERVIEW_PRESETS.map(preset => (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            className={`ti-preset-card ${activePreset === preset.id ? 'active' : ''}`}
                                            onClick={() => applyPreset(preset)}
                                        >
                                            <span className="ti-preset-title">{preset.label}</span>
                                            <span className="ti-preset-blurb">{preset.blurb}</span>
                                        </button>
                                    ))}
                                </div>
                                <div className="ti-preset-status">
                                    {activePreset
                                        ? `Preset active: ${INTERVIEW_PRESETS.find(p => p.id === activePreset)?.label || 'Custom'}`
                                        : 'Preset status: Custom configuration'}
                                </div>
                                <div className="ti-realq-toggle" style={{ marginTop: 10 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <input
                                            type="checkbox"
                                            checked={Boolean(advancedOptions.realInterviewerMode)}
                                            onChange={e => updateAdvancedOption('realInterviewerMode', e.target.checked)}
                                        />
                                        <span>
                                            {INTERVIEW_LABELS.realInterviewerMode}
                                            <small style={{ display: 'block', opacity: 0.75 }}>
                                                Less coaching, sharper follow-ups, and closer to real interview pressure.
                                            </small>
                                        </span>
                                    </label>
                                </div>
                                <div className="ti-form-row">
                                    <div className="ti-form-section">
                                        <label>{INTERVIEW_LABELS.runtimeMode}</label>
                                        <select
                                            value={interviewRuntimeMode}
                                            onChange={e => {
                                                setInterviewRuntimeMode(e.target.value);
                                                if (realtimeStartError) {
                                                    setRealtimeStartError('');
                                                }
                                            }}
                                        >
                                            {INTERVIEW_RUNTIME_MODES.map(mode => (
                                                <option key={mode.value} value={mode.value}>{mode.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {realtimeStartError && (
                                    <div
                                        role="alert"
                                        style={{
                                            marginTop: 12,
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            border: '1px solid rgba(248, 113, 113, 0.55)',
                                            background: 'rgba(127, 29, 29, 0.25)',
                                            color: '#fecaca',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            fontSize: 13,
                                            fontWeight: 600,
                                        }}
                                    >
                                        <AlertCircle size={16} />
                                        <span>{realtimeStartError}</span>
                                    </div>
                                )}

                                <div className="ti-form-row">
                                    <div className="ti-form-section">
                                        <label>{INTERVIEW_LABELS.interviewerStyle}</label>
                                        <select
                                            value={advancedOptions.interviewerIntensity}
                                            onChange={e => updateAdvancedOption('interviewerIntensity', e.target.value)}
                                        >
                                            <option value="supportive">Supportive</option>
                                            <option value="balanced">Balanced</option>
                                            <option value="challenging">Challenging</option>
                                        </select>
                                    </div>
                                    <div className="ti-form-section">
                                        <label>{INTERVIEW_LABELS.followUpDepth}</label>
                                        <select
                                            value={advancedOptions.followUpDepth}
                                            onChange={e => updateAdvancedOption('followUpDepth', e.target.value)}
                                        >
                                            <option value="standard">Standard</option>
                                            <option value="deep">Deep</option>
                                        </select>
                                    </div>
                                    <div className="ti-form-section">
                                        <label>{INTERVIEW_LABELS.pacing}</label>
                                        <select
                                            value={advancedOptions.answerPace}
                                            onChange={e => updateAdvancedOption('answerPace', e.target.value)}
                                        >
                                            <option value="slow">Slow</option>
                                            <option value="balanced">Balanced</option>
                                            <option value="fast">Fast</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="ti-form-row">
                                    <div className="ti-form-section">
                                        <label>{INTERVIEW_LABELS.questions}</label>
                                        <select
                                            value={advancedOptions.questionCount}
                                            onChange={e => updateAdvancedOption('questionCount', Number(e.target.value))}
                                        >
                                            <option value={6}>6 Questions</option>
                                            <option value={8}>8 Questions</option>
                                            <option value={10}>10 Questions</option>
                                            <option value={12}>12 Questions</option>
                                        </select>
                                    </div>
                                    <div className="ti-form-section" style={{ gridColumn: 'span 2' }}>
                                        <label>{INTERVIEW_LABELS.focusTopics}</label>
                                        <input
                                            type="text"
                                            className="ti-role-input"
                                            placeholder="e.g. caching, SQL tuning, API design"
                                            value={advancedOptions.focusTopics}
                                            onChange={e => updateAdvancedOption('focusTopics', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Setup Summary Card */}
                            <div className="ti-setup-summary">
                                <div className="ti-setup-row">
                                    <span className="ti-setup-icon">💼</span> <span>Role:</span> <strong>{config.role}</strong>
                                </div>
                                <div className="ti-setup-row">
                                    <span className="ti-setup-icon">⏱️</span> <span>Duration:</span> <strong>{isFresherHrTechMode ? '20 mins' : '30 mins'}</strong>
                                    <span className={`ti-diff-chip ${config.difficulty}`}>
                                        {config.difficulty}
                                    </span>
                                </div>
                                <div className="ti-setup-row">
                                    <span className="ti-setup-icon">❓</span> <span>Questions:</span> <strong>{totalQuestions}</strong>
                                </div>
                            </div>
                        </div>

                        {/* Join button */}
                        <button className="ti-join-btn" onClick={startInterview} disabled={loading}>
                            <Video size={20} />
                            {loading ? 'Connecting...' : 'Start Practice Session 🚀'}
                        </button>

                        <div className="ti-device-status">
                            <span className={`ti-device-chip ${micOn ? 'ok' : 'off'}`}>
                                <span className="ti-device-chip-dot"></span> Mic {micOn ? 'Ready' : 'Off'}
                            </span>
                            <span className={`ti-device-chip ${cameraOn && stream ? 'ok' : 'off'}`}>
                                <span className="ti-device-chip-dot"></span> Cam {cameraOn && stream ? 'Ready' : 'Off'}
                            </span>
                        </div>

                        <div className="ti-lobby-footnote">
                            <span>🔒 Your camera feed stays local — nothing is recorded or sent</span>
                            <br />
                            <span style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px', display: 'inline-block' }}>💪 This is a safe space to practice — mistakes are part of learning!</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    //  SUMMARY PHASE
    // ═══════════════════════════════════════════
    if (phase === 'summary' && summaryData) {
        const scoreColor = summaryData.overallScore >= 80 ? '#22c55e' : summaryData.overallScore >= 60 ? '#f59e0b' : '#ef4444';
        const bd = summaryData.detailedBreakdown || {};
        return (
            <div className="ti-summary-page">
                {/* Confetti Animation Layer */}
                {summaryData.overallScore >= 70 && (
                    <div className="ti-confetti-container">
                        {Array.from({ length: 30 }).map((_, i) => (
                            <div
                                key={i}
                                className="ti-confetti"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2}s`,
                                    backgroundColor: ['#6366f1', '#8b5cf6', '#22c55e', '#f59e0b'][Math.floor(Math.random() * 4)]
                                }}
                            />
                        ))}
                    </div>
                )}

                <div className="ti-summary" style={{ position: 'relative', zIndex: 1 }}>
                    <div className="ti-summary-header">
                        <h1>Interview Complete 🎉</h1>
                        <p>{companyLogo} {companyName} · {config.role} · {config.stage} · {formatTime(elapsed)}</p>
                    </div>

                    {/* Verdict badge */}
                    {summaryData.verdict && (
                        <div className="ti-verdict-badge" style={{ borderColor: scoreColor, color: scoreColor }}>
                            <span className="ti-verdict-emoji">{summaryData.verdictEmoji || '📋'}</span>
                            <span className="ti-verdict-text">{summaryData.verdict}</span>
                        </div>
                    )}

                    <div className="ti-score-ring" style={{ '--score-color': scoreColor }}>
                        <svg viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                            <circle cx="60" cy="60" r="50" fill="none" stroke={scoreColor} strokeWidth="8"
                                strokeDasharray={`${summaryData.overallScore * 3.14} 314`}
                                strokeLinecap="round" transform="rotate(-90 60 60)"
                                style={{ transition: 'stroke-dasharray 1s ease' }}
                            />
                        </svg>
                        <div className="ti-score-text">
                            <span className="ti-score-num">{summaryData.overallScore}</span>
                            <span className="ti-score-label">Score</span>
                        </div>
                    </div>

                    <p className="ti-summary-desc">{summaryData.summary}</p>

                    {/* Detailed Breakdown Bars */}
                    {Object.keys(bd).length > 0 && (
                        <div className="ti-breakdown-section">
                            <h3><BarChart3 size={16} /> Detailed Breakdown</h3>
                            <div className="ti-breakdown-bars">
                                {[{ key: 'technicalSkills', label: 'Technical Skills', icon: <Brain size={14} /> },
                                { key: 'communication', label: 'Communication', icon: <Volume2 size={14} /> },
                                { key: 'problemSolving', label: 'Problem Solving', icon: <Target size={14} /> },
                                { key: 'cultureFit', label: 'Culture Fit', icon: <Users size={14} /> }]
                                    .filter(item => bd[item.key] != null)
                                    .map(item => (
                                        <div key={item.key} className="ti-breakdown-bar">
                                            <div className="ti-breakdown-label">
                                                {item.icon} <span>{item.label}</span>
                                                <strong>{Math.min(100, Math.max(0, bd[item.key]))}%</strong>
                                            </div>
                                            <div className="ti-breakdown-track">
                                                <div className="ti-breakdown-fill" style={{
                                                    width: `${Math.min(100, Math.max(0, bd[item.key]))}%`,
                                                    background: bd[item.key] >= 80 ? '#22c55e' : bd[item.key] >= 60 ? '#f59e0b' : '#ef4444'
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    <div className="ti-summary-grid">
                        <div className="ti-summary-card strengths">
                            <h3><CheckCircle size={16} /> Strengths</h3>
                            <ul>{(summaryData.strengths || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
                        </div>
                        <div className="ti-summary-card improvements">
                            <h3><TrendingUp size={16} /> Areas to Improve</h3>
                            <ul>{(summaryData.improvements || []).map((s, i) => <li key={i}>{s}</li>)}</ul>

                            <div className="ti-topic-links">
                                <Link to="/learning-path" className="ti-topic-link">DSA Topics</Link>
                                <Link to="/system-design" className="ti-topic-link">System Design</Link>
                            </div>
                        </div>
                    </div>

                    {summaryData.recommendation && (
                        <div className="ti-recommendation">
                            <Sparkles size={16} /> <span>{summaryData.recommendation}</span>
                        </div>
                    )}

                    {/* Quick AI Suggestions Preview */}
                    {summaryData.suggestedTopics?.length > 0 && (
                        <div className="ti-ai-suggestions-preview" style={{ marginTop: 16, padding: 16, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 14 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, color: '#818cf8' }}>
                                🎯 Focus Areas Based on Your Answers
                            </h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {summaryData.suggestedTopics.slice(0, 4).map((t, i) => (
                                    <div key={i} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <strong style={{ color: t.priority === 'high' ? '#ef4444' : t.priority === 'medium' ? '#f59e0b' : '#22c55e' }}>{t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢'}</strong> {t.topic}
                                    </div>
                                ))}
                            </div>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 10 }}>See full study plan & practice questions in the Detailed Analysis below →</p>
                        </div>
                    )}

                    {speechFeedback && (
                        <div className="ti-speech-card">
                            <h3><Volume2 size={16} /> Voice Analysis</h3>
                            <div className="ti-speech-stats">
                                <div className="ti-speech-stat"><strong>{speechFeedback.wpm}</strong><span>WPM</span></div>
                                <div className="ti-speech-stat"><strong>{speechFeedback.totalFillers}</strong><span>Fillers</span></div>
                                <div className="ti-speech-stat"><strong>{speechFeedback.clarityScore}%</strong><span>Clarity</span></div>
                            </div>
                            <p>{speechFeedback.paceAssessment}</p>
                        </div>
                    )}

                    {/* Detailed Report */}
                    {detailedReportData ? (
                        <div style={{ marginTop: 24 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <BarChart3 size={16} /> Detailed Analysis
                            </h3>
                            <DetailedReport
                                data={{
                                    ...detailedReportData,
                                    suggestedTopics: detailedReportData.suggestedTopics || summaryData?.suggestedTopics || [],
                                    practiceQuestions: detailedReportData.practiceQuestions || summaryData?.practiceQuestions || [],
                                    studyPlan: detailedReportData.studyPlan || summaryData?.studyPlan || []
                                }}
                                companyName={companyName}
                                companyColor={companyColor}
                                companyLogo={companyLogo}
                                conversation={conversation}
                            />
                        </div>
                    ) : loading ? null : (
                        <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                            Loading detailed analysis...
                        </div>
                    )}

                    <div className="ti-summary-actions">
                        <button className="ti-retry-btn" onClick={resetInterview}>
                            <RefreshCw size={16} /> Try Again
                        </button>
                        <Link to="/company-prep" className="ti-back-btn">
                            <ArrowLeft size={16} /> Back to Prep
                        </Link>
                        <Link to="/dashboard" className="ti-home-btn">
                            🏠 Go Home
                        </Link>
                    </div>

                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    //  INTERVIEW PHASE — Premium Dark Layout
    // ═══════════════════════════════════════════
    return (
        <div className="ci-interview-page">
            {/* ── Top Navigation Bar ── */}
            <div className="ci-topbar">
                <div className="ci-topbar-left">
                    <span className="ci-company-logo">{companyLogo}</span>
                    <div className="ci-breadcrumb">
                        <span className="ci-breadcrumb-company">{companyName}</span>
                        <ChevronRight size={11} className="ci-breadcrumb-sep" />
                        <span className="ci-breadcrumb-info">{config.role} · {config.stage}</span>
                    </div>
                </div>

                <div className="ci-topbar-center">
                    <div className="ci-mode-badge">
                        <Zap size={12} />
                        {config.format === 'voice' ? 'Voice Interview' : 'Text Interview'} · {config.difficulty}
                    </div>
                    <div className="ci-mode-badge" style={{ marginLeft: 8 }}>
                        {interviewRuntimeMode === 'full_realtime' ? '⚡ Full Real-Time' : '🔁 Hybrid Rollout'}
                    </div>
                    <div className="ci-mode-badge" style={{ marginLeft: 8 }}>
                        {runtimeStrategy || 'runtime: n/a'}
                    </div>
                </div>


                {/* Recording + Connection + Participants indicators */}
                <div className="ci-topbar-right">
                    <div className="ci-recording-badge">
                        <span className="ci-rec-dot" />
                        REC
                    </div>
                    <div className="ci-connection-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <rect x="2" y="16" width="4" height="6" rx="1" fill="#22c55e" />
                            <rect x="8" y="11" width="4" height="11" rx="1" fill="#22c55e" />
                            <rect x="14" y="6" width="4" height="16" rx="1" fill="#22c55e" />
                            <rect x="20" y="2" width="4" height="20" rx="1" fill="#22c55e" opacity="0.3" />
                        </svg>
                        <span>Good</span>
                    </div>
                    <div className="ci-participants-badge">
                        <Users size={12} />
                        <span>2</span>
                    </div>
                    <div className="ci-timer">
                        <Clock size={14} />
                        {formatTime(timerDisplaySeconds)}
                    </div>
                    {questionCount > 0 && (
                        <div className="ci-progress-dots">
                            {Array.from({ length: totalQuestions }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`ci-progress-dot ${i < questionCount - 1 ? 'completed' : i === questionCount - 1 ? 'active' : ''}`}
                                />
                            ))}
                        </div>
                    )}
                    {/* Score hidden during interview for immersion — shown in summary */}
                    {difficultyLevel && (
                        <div className="ci-difficulty-badge">
                            {difficultyLevel === 'hard' ? '🔥' : difficultyLevel === 'easy' ? '📉' : '📊'}
                            {difficultyLevel === 'hard' ? 'Ramping Up' : difficultyLevel === 'easy' ? 'Adjusting' : 'Steady'}
                        </div>
                    )}
                    <div className="ci-user-avatar-topbar">
                        {user?.user_metadata?.full_name?.[0] || '👤'}
                    </div>
                </div>
            </div>

            {/* ── Status Bar with contextual interviewer status ── */}
            <div className="ci-status-bar">
                <Sparkles size={14} />
                <span className="ci-status-text">
                    {aiSpeaking
                        ? `${companyName} interviewer is speaking...`
                        : loading
                            ? (interviewerStatus || 'Reviewing your answer...')
                            : isListening
                                    ? (silenceStage === 1
                                    ? '💭 Take your time, no rush...'
                                    : silenceStage === 2
                                        ? '⏭️ No answer detected. Moving to the next question...'
                                        : interviewerStatus
                                            ? interviewerStatus
                                            : '🎤 Listening to your response...')
                                : questionCount > totalQuestions
                                    ? 'Q&A — Your Turn to Ask'
                                    : `Q${questionCount} of ${totalQuestions} — Take your time to think`}
                </span>
                {questionCount > 0 && (
                    <span className="ci-status-progress">Q{questionCount}/{totalQuestions}</span>
                )}
            </div>

            {/* ── Proctoring Status ── */}
            <ProctoringManager
                enabled={proctoringEnabled}
                isActive={phase === 'interview'}
                emotionMetrics={emotionMetrics}
                onViolation={(v) => {
                    setProctoringViolations(prev => [...prev, v]);
                    if (v.type === 'face_not_detected' && phase === 'interview' && !aiSpeaking) {
                        setProctoringViolations(prev => {
                            const faceWarnings = prev.filter(vi => vi.type === 'face_not_detected').length;
                            if (faceWarnings < 3) {
                                speakText("Please ensure you're looking at the camera during the interview.");
                            }
                            return prev;
                        });
                    }
                }}
                violations={proctoringViolations}
            />

            {/* ── Main Content ── */}
            <div className="ci-main-content">
                {/* Left: Interview Area */}
                <div className="ci-interview-panel">
                    {/* AI Interviewer Display */}
                    <div className={`ci-tile ${aiSpeaking ? 'speaking' : ''}`} style={{ flex: 1 }}>
                        <div className="ci-tile-content">
                            <div className={`ci-interviewer-avatar ${loading ? 'thinking' : ''}`}>
                                <div className="ci-avatar-placeholder">
                                    {companyLogo || '🤖'}
                                </div>
                                {/* Avatar state indicator */}
                                {(aiSpeaking || loading || isListening) && (
                                    <div className="ci-avatar-state">
                                        {aiSpeaking && <span className="ci-state-speaking">🔊 Speaking</span>}
                                        {loading && !aiSpeaking && <span className="ci-state-thinking">✍️ Reviewing</span>}
                                        {isListening && !aiSpeaking && !loading && <span className="ci-state-listening">👂 Listening</span>}
                                    </div>
                                )}
                            </div>

                            {/* Typing indicator while AI processes */}
                            {loading && !aiSpeaking && (
                                <div className="ci-thinking-indicator">
                                    <span /><span /><span />
                                    <div className="ci-thinking-label">{interviewerStatus || 'Preparing next question...'}</div>
                                </div>
                            )}

                            <div className={`ci-question-card ${loading && !aiSpeaking ? 'shimmer' : ''} ${questionTransition ? 'question-transition' : ''}`}>
                                <div className="ci-question-label">Current Question</div>
                                <p className="ci-question-text">
                                    {currentQuestion || 'I will ask your first interview question in a moment.'}
                                </p>
                            </div>
                        </div>

                        <div className="ci-tile-nameplate">
                            {aiSpeaking && <span className="ci-speaking-dot" />}
                            {interviewerName} · {companyName}
                            {aiSpeaking && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#a5b4fc' }}>Speaking</span>}
                            {loading && !aiSpeaking && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#fbbf24' }}>Reviewing...</span>}
                            {isListening && !aiSpeaking && !loading && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#22c55e' }}>Listening</span>}
                        </div>
                    </div>

                    {/* Captions Overlay — User speech */}
                    {isListening && (transcript || interimText) && (
                        <div className="ci-captions-overlay">
                            <div className="ci-captions-bar">
                                <div className="ci-captions-indicator">
                                    <span className="ci-captions-live-dot" />
                                    <span>LIVE</span>
                                </div>
                                <p className="ci-captions-text">
                                    {transcript && <span className="ci-captions-final">{transcript}</span>}
                                    {isTranscribing && <span className="ci-captions-interim"> [Transcribing...] </span>}
                                    {!isTranscribing && interimText && <span className="ci-captions-interim">{interimText}</span>}
                                    <span ref={captionsEndRef} />
                                </p>
                                {autoSendCountdown > 0 && !isTranscribing && (
                                    <div className="ci-captions-autosend">
                                        <svg className="ci-autosend-ring" viewBox="0 0 36 36">
                                            <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                                            <circle cx="18" cy="18" r="16" fill="none" stroke="#818cf8" strokeWidth="2"
                                                strokeDasharray={`${(autoSendCountdown / AUTO_SUBMIT_COUNTDOWN_SECONDS) * 100.53} 100.53`}
                                                strokeLinecap="round" transform="rotate(-90 18 18)"
                                                style={{ transition: 'stroke-dasharray 0.9s linear' }}
                                            />
                                        </svg>
                                        <span>{autoSendCountdown}s</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* AI Speech Captions — shows what the AI is saying */}
                    {aiSpeaking && aiSpeechCaption && (
                        <div className="ci-ai-caption-overlay">
                            <div className="ci-ai-caption-bar">
                                <div className="ci-ai-caption-indicator">
                                    <Volume2 size={12} />
                                    <span>AI Speaking</span>
                                </div>
                                <p className="ci-ai-caption-text">{aiSpeechCaption}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar: Profiles */}
                <div className="ci-sidebar-right">
                    {/* AI Interviewer */}
                    <div className="ci-profile-card">
                        <div className={`ci-profile-avatar ${aiSpeaking ? 'speaking' : ''}`}>
                            <div className="ci-profile-avatar-placeholder">
                                {companyLogo || '🤖'}
                            </div>
                        </div>
                        {aiSpeaking && (
                            <div className="ci-speaking-wave">
                                <span /><span /><span /><span /><span />
                            </div>
                        )}
                        <div className="ci-profile-name">{interviewerName}</div>
                        <div className="ci-profile-role">{config.stage} · {companyName}</div>
                    </div>

                    {/* Candidate */}
                    <div className="ci-profile-card">
                        <div className={`ci-profile-avatar ${isListening ? 'listening' : ''}`}>
                            {cameraOn && stream ? (
                                <video
                                    ref={handleVideoRef}
                                    autoPlay muted playsInline
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                                />
                            ) : (
                                <div className="ci-profile-avatar-placeholder">
                                    {user?.user_metadata?.full_name?.[0] || '👤'}
                                </div>
                            )}
                        </div>
                        <div className="ci-profile-name">{user?.user_metadata?.full_name || 'You'}</div>
                        <div className="ci-profile-role">Candidate</div>
                    </div>

                    {/* Emotion detector (hidden, processes in background) */}
                    {emotionEnabled && cameraOn && stream && (
                        <EmotionDetector
                            videoRef={videoRef}
                            enabled={emotionEnabled}
                            onMetricsUpdate={setEmotionMetrics}
                        />
                    )}
                </div>

                {/* Chat Sidebar (togglable) */}
                {chatOpen && (
                    <div className="ci-chat-panel">
                        <div className="ci-chat-header">
                            <h3><MessageSquare size={14} /> Interview Chat</h3>
                            <button className="ci-topbar-icon-btn" onClick={() => setChatOpen(false)}>
                                <X size={14} />
                            </button>
                        </div>

                        <div className="ci-chat-messages">
                            {conversation.map((msg, idx) => (
                                <div key={idx} className={`ci-chat-msg ${msg.role === 'interviewer' ? 'interviewer' : msg.role === 'candidate' ? 'candidate' : 'feedback'}`}>
                                    {msg.role === 'interviewer' && (
                                        <>
                                            <div className="ci-msg-sender">
                                                {companyLogo} {interviewerName}
                                                <span className="ci-msg-time">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="ci-msg-text">{msg.content}</p>
                                            {msg.tips?.length > 0 && (
                                                <div className="ci-msg-tips">
                                                    {msg.tips.map((t, i) => <span key={i} className="ci-msg-tip">💡 {t}</span>)}
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {msg.role === 'candidate' && (
                                        <>
                                            <div className="ci-msg-sender you">
                                                You
                                                <span className="ci-msg-time">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="ci-msg-text">{msg.content}</p>
                                        </>
                                    )}
                                    {msg.role === 'feedback' && (
                                        <>
                                            {msg.reaction && (
                                                <div className="ci-reaction-badge">
                                                    {msg.reaction === 'impressed' && '🌟 Impressed'}
                                                    {msg.reaction === 'encouraging' && '👏 Encouraging'}
                                                    {msg.reaction === 'probing' && '🔍 Digging Deeper'}
                                                    {msg.reaction === 'challenging' && '💪 Challenging'}
                                                    {msg.reaction === 'neutral' && '📋 Evaluating'}
                                                    {msg.reaction === 'greeting' && '👋 Welcome'}
                                                </div>
                                            )}
                                            {/* Verbal feedback only — scores deferred to summary for immersion */}
                                            <div className="ci-fb-verbal">
                                                {msg.content}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}

                            {loading && (
                                <div className="ci-typing-indicator">
                                    <span /><span /><span />
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Chat Input */}
                        {questionCount <= totalQuestions + 1 && (
                            <div className="ci-chat-input-area">
                                {thinkTimeLeft > 0 && (
                                    <div className="ci-think-timer">
                                        <Timer size={14} />
                                        <span>Take your time — {thinkTimeLeft}s</span>
                                        <div className="ci-think-bar">
                                            <div className="ci-think-fill" style={{ width: `${Math.min(100, (thinkTimeLeft / 60) * 100)}%` }} />
                                        </div>
                                    </div>
                                )}

                                {speechFeedback && config.format === 'voice' && (
                                    <div className="ci-speech-feedback">
                                        <span>🎤 {speechFeedback.wpm} WPM</span>
                                        <span>📝 {speechFeedback.totalFillers} fillers</span>
                                        <span>✨ {speechFeedback.clarityScore}%</span>
                                        {speechFeedback.confidenceScore && <span>💪 {speechFeedback.confidenceScore}%</span>}
                                    </div>
                                )}

                                {!hintData && !loading && (
                                    <button className="ci-hint-btn" onClick={requestHint} disabled={hintLoading}>
                                        <Lightbulb size={14} />
                                        {hintLoading ? 'Getting hint...' : 'Need a hint?'}
                                    </button>
                                )}

                                {hintData && (
                                    <div className="ci-hint-card">
                                        <div className="ci-hint-header">
                                            <Lightbulb size={14} /> <strong>Hint</strong>
                                            <button className="ci-hint-close" onClick={() => setHintData(null)}><X size={12} /></button>
                                        </div>
                                        <p className="ci-hint-text">{hintData.hint}</p>
                                        {hintData.approach && <p className="ci-hint-approach">💡 {hintData.approach}</p>}
                                        {hintData.keyTopics?.length > 0 && (
                                            <div className="ci-hint-topics">
                                                {hintData.keyTopics.map((t, i) => <span key={i} className="ci-hint-topic">{t}</span>)}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="ci-chat-input-row">
                                    <button
                                        className={`ci-chat-mic-btn ${isListening ? 'active' : ''}`}
                                        onClick={() => {
                                            const liveInputValue = document
                                                .querySelector('.ci-chat-input-row textarea')
                                                ?.value
                                                ?.trim() || '';
                                            const hasPendingResponse = Boolean(
                                                userInput.trim() || liveInputValue || accumulatedTranscriptRef.current.trim()
                                            );
                                            if (isListening || isListeningRef.current) {
                                                sendAnswer();
                                            } else if (hasPendingResponse) {
                                                // Submit pending dictated/typed content even after transient recognition drops.
                                                sendAnswer();
                                            } else {
                                                toggleListening();
                                            }
                                        }}
                                        title={isListening ? 'Stop & send' : 'Start speaking'}
                                    >
                                        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                                    </button>
                                    <textarea
                                        value={userInput}
                                        onChange={e => {
                                            latestUserInputRef.current = e.target.value;
                                            setUserInput(e.target.value);
                                        }}
                                        placeholder={isListening ? '🔴 Listening...' : 'Type your answer...'}
                                        rows={2}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAnswer(); } }}
                                    />
                                    <button
                                        className="ci-chat-send-btn"
                                        onClick={sendAnswer}
                                        disabled={!userInput.trim() || loading}
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {questionCount > totalQuestions + 1 && !loading && (
                            <div className="ci-chat-complete">
                                <p>🎉 Interview complete!</p>
                                <button onClick={endInterview} className="ci-chat-end-btn">
                                    <BarChart3 size={14} /> View Results
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Bottom Controls Bar ── */}
            <div className="ci-controls-bar">
                <div className="ci-controls-left">
                    <span className="ci-controls-time">
                        <Clock size={14} /> {formatTime(timerDisplaySeconds)}
                    </span>
                </div>

                <div className="ci-controls-center">
                    <div className="ci-controls-group">
                        <button
                            className={`ci-ctrl-btn mic ${!micOn ? 'muted' : ''}`}
                            onClick={toggleMic}
                            title={micOn ? 'Mute (Ctrl+M)' : 'Unmute'}
                        >
                            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                        </button>

                        <button
                            className={`ci-ctrl-btn camera ${!cameraOn ? 'off' : ''}`}
                            onClick={toggleCamera}
                            title={cameraOn ? 'Turn off camera' : 'Turn on camera'}
                        >
                            {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
                        </button>

                        <button
                            className={`ci-ctrl-btn secondary ${chatOpen ? 'active' : ''}`}
                            onClick={() => setChatOpen(c => !c)}
                            title="Toggle chat"
                        >
                            <MessageSquare size={20} />
                        </button>

                        <button
                            className={`ci-ctrl-btn secondary ${emotionEnabled ? 'active' : ''}`}
                            onClick={() => setEmotionEnabled(e => !e)}
                            title="Body language AI"
                        >
                            <Eye size={20} />
                        </button>

                        <button
                            className={`ci-ctrl-btn secondary ${copilotOpen ? 'active' : ''}`}
                            onClick={() => setCopilotOpen(c => !c)}
                            title="AI Copilot"
                        >
                            <Brain size={20} />
                        </button>

                        {(config.stage === 'DSA / Coding' || config.stage === 'OA') && (
                            <button
                                className={`ci-ctrl-btn secondary ${codeEditorOpen ? 'active' : ''}`}
                                onClick={() => setCodeEditorOpen(c => !c)}
                                title="Code Editor"
                            >
                                <Code2 size={20} />
                            </button>
                        )}

                        <button
                            className="ci-ctrl-btn end-call"
                            onClick={endInterview}
                            disabled={loading}
                            title="End interview"
                        >
                            <Phone size={20} style={{ transform: 'rotate(135deg)' }} />
                        </button>
                    </div>
                    <div className="ci-ctrl-label-bottom">
                        {!tabFocused && phase === 'interview' && (
                            <span className="ci-tab-warning">⚠️ Tab unfocused — click here to resume</span>
                        )}
                        {tabFocused && (
                            <span>Space = Mic · Enter = Send · Esc = End</span>
                        )}
                    </div>
                </div>

                <div className="ci-controls-right">
                    {/* Score deferred to summary for immersion */}
                    <div className="ci-controls-progress">
                        Q{questionCount}/{totalQuestions}
                    </div>
                </div>
            </div>

            {/* AI Copilot sidebar */}
            {copilotOpen && (
                <AICopilot
                    isOpen={copilotOpen}
                    onToggle={() => setCopilotOpen(c => !c)}
                    currentQuestion={currentQuestion}
                    partialAnswer={transcript || userInput}
                    stage={config.stage}
                    company={companyName}
                    role={config.role}
                    getAuthHeaders={getAuthHeaders}
                />
            )}

            {/* Code Editor Panel (DSA/OA stages) */}
            <CodeEditorPanel
                isOpen={codeEditorOpen}
                onClose={() => setCodeEditorOpen(false)}
                code={editorCode}
                onCodeChange={setEditorCode}
                language={editorLanguage}
                onLanguageChange={setEditorLanguage}
                codeFeedback={codeFeedback}
                onSubmitCode={sendAnswer}
                loading={loading}
            />
        </div>
    );
}

