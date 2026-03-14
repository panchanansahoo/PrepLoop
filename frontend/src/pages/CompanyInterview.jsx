import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
    Mic, MicOff, Video, VideoOff, MessageSquare, Phone,
    Send, Clock, Users, Sparkles, ChevronRight, ChevronLeft,
    Star, TrendingUp, CheckCircle, AlertCircle, BarChart3,
    RefreshCw, ArrowLeft, Volume2, X, Monitor, MoreVertical,
    Hand, SmilePlus, Settings, Copy, Maximize2, Minimize2,
    Lightbulb, Target, Brain, Award, Zap, Timer, Eye, Code2, Shield
} from 'lucide-react';
import { Upload, FileText } from 'lucide-react';
import { COMPANIES, STAGES, ROLES, DIFFICULTIES } from '../data/companyPrepData';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import SpeechAnalyzer from '../utils/speechAnalyzer';
import EmotionDetector from '../components/EmotionDetector';
import AICopilot from '../components/AICopilot';
import InterviewBadges from '../components/InterviewBadges';
import CodeEditorPanel from '../components/CodeEditorPanel';
import ProctoringManager from '../components/ProctoringManager';
import DetailedReport from '../components/interview/DetailedReport';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const INTERVIEW_PRESETS = [
    {
        id: 'real_interviewer',
        label: 'Real Interviewer',
        blurb: 'Closest to actual interview behavior: concise prompts, rigorous follow-ups, minimal coaching.',
        options: {
            interviewerIntensity: 'challenging',
            followUpDepth: 'deep',
            answerPace: 'balanced',
            realInterviewerMode: true,
            focusTopics: 'clarity, trade-offs, edge cases, decision making',
            questionCount: 8,
        },
    },
    {
        id: 'faang_loop',
        label: 'FAANG Loop',
        blurb: 'Sharper probing, deeper follow-ups, and longer loops for high-bar rounds.',
        options: {
            interviewerIntensity: 'challenging',
            followUpDepth: 'deep',
            answerPace: 'fast',
            realInterviewerMode: false,
            focusTopics: 'trade-offs, scalability, edge cases, optimization',
            questionCount: 10,
        },
    },
    {
        id: 'startup_rapid_fire',
        label: 'Startup Rapid-Fire',
        blurb: 'Fast pace, practical questioning, and shipping-focused conversations.',
        options: {
            interviewerIntensity: 'challenging',
            followUpDepth: 'standard',
            answerPace: 'fast',
            realInterviewerMode: false,
            focusTopics: 'MVP thinking, execution speed, prioritization, product sense',
            questionCount: 8,
        },
    },
    {
        id: 'campus_placement',
        label: 'Campus Placement',
        blurb: 'Supportive structure for fresher-style technical and behavioral rounds.',
        options: {
            interviewerIntensity: 'supportive',
            followUpDepth: 'standard',
            answerPace: 'balanced',
            realInterviewerMode: false,
            focusTopics: 'fundamentals, clarity, structured answers, confidence',
            questionCount: 6,
        },
    },
    {
        id: 'behavioral_coach',
        label: 'Behavioral Coach',
        blurb: 'Lower-pressure mode optimized for STAR stories and communication quality.',
        options: {
            interviewerIntensity: 'supportive',
            followUpDepth: 'deep',
            answerPace: 'slow',
            realInterviewerMode: false,
            focusTopics: 'STAR method, ownership, teamwork, conflict resolution',
            questionCount: 8,
        },
    },
];

// ─── AI Avatar Canvas Component (Human photo with animated rings) ───
function AIAvatar({ speaking, pose = 'neutral', companyColor, companyLogo, size = 'large' }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const phaseRef = useRef(0);
    const imgRef = useRef(null);
    const imgLoadedRef = useRef(false);

    useEffect(() => {
        const img = new Image();
        img.src = '/ai-interviewer.png';
        img.onload = () => { imgRef.current = img; imgLoadedRef.current = true; };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width = size === 'large' ? 280 : 140;
        const h = canvas.height = size === 'large' ? 280 : 140;
        const cx = w / 2, cy = h / 2;

        const draw = () => {
            phaseRef.current += 0.03;
            ctx.clearRect(0, 0, w, h);

            // Background gradient
            const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, w / 2);
            bg.addColorStop(0, 'rgba(15, 15, 25, 1)');
            bg.addColorStop(1, 'rgba(5, 5, 12, 1)');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, w, h);

            const baseRadius = size === 'large' ? 60 : 32;
            const ringCount = speaking ? 5 : 3;

            // Animated rings
            for (let i = ringCount; i >= 0; i--) {
                const pulse = speaking
                    ? Math.sin(phaseRef.current * 2 + i * 0.8) * (8 + i * 3)
                    : Math.sin(phaseRef.current + i * 0.6) * 3;
                const r = baseRadius + i * (size === 'large' ? 18 : 10) + pulse;
                const alpha = speaking
                    ? 0.15 - i * 0.025
                    : 0.06 - i * 0.015;

                ctx.beginPath();
                ctx.arc(cx, cy, Math.max(r, 1), 0, Math.PI * 2);
                ctx.strokeStyle = `${companyColor}${Math.round(Math.max(alpha, 0.01) * 255).toString(16).padStart(2, '0')}`;
                ctx.lineWidth = speaking ? 2.5 : 1.5;
                ctx.stroke();
            }

            // Circular human photo with talking animation
            if (imgLoadedRef.current && imgRef.current) {
                ctx.save();

                // Subtle posture changes so interviewer feels less static.
                const isListeningPose = pose === 'listening';
                const isThinkingPose = pose === 'thinking';
                const isSpeakingPose = speaking || pose === 'speaking';
                const isNotesPose = pose === 'notes';

                if (isListeningPose) {
                    const listenTilt = -0.035 + Math.sin(phaseRef.current * 1.6) * 0.012;
                    ctx.translate(cx, cy);
                    ctx.rotate(listenTilt);
                    ctx.translate(-cx, -cy);
                }

                if (isThinkingPose) {
                    const thinkingTilt = 0.028 + Math.sin(phaseRef.current * 1.2) * 0.01;
                    const thinkingNod = Math.sin(phaseRef.current * 1.8) * (size === 'large' ? 1.4 : 0.8);
                    ctx.translate(cx, cy + thinkingNod);
                    ctx.rotate(thinkingTilt);
                    ctx.translate(-cx, -cy);
                }

                if (isNotesPose) {
                    const notesTilt = 0.085 + Math.sin(phaseRef.current * 1.1) * 0.01;
                    const notesDrop = size === 'large' ? 3.2 : 1.8;
                    ctx.translate(cx, cy + notesDrop);
                    ctx.rotate(notesTilt);
                    ctx.translate(-cx, -cy);
                }

                // Speaking: subtle scale breathing + gentle bounce
                if (isSpeakingPose) {
                    const breathe = 1 + Math.sin(phaseRef.current * 3) * 0.018;
                    const bounceY = Math.sin(phaseRef.current * 2.5) * (size === 'large' ? 1.5 : 0.8);
                    ctx.translate(cx, cy + bounceY);
                    ctx.scale(breathe, breathe);
                    ctx.translate(-cx, -cy);
                }

                // Clip to circle and draw photo
                ctx.beginPath();
                ctx.arc(cx, cy, baseRadius - 3, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                const imgSize = (baseRadius - 3) * 2;
                ctx.drawImage(imgRef.current, cx - baseRadius + 3, cy - baseRadius + 3, imgSize, imgSize);

                // Speaking: jaw/mouth area glow to simulate talking
                if (isSpeakingPose) {
                    const mouthOpen = (Math.sin(phaseRef.current * 6) + 1) * 0.5;
                    const jawGlow = ctx.createRadialGradient(cx, cy + baseRadius * 0.35, 2, cx, cy + baseRadius * 0.35, baseRadius * 0.5);
                    jawGlow.addColorStop(0, `rgba(255,255,255,${0.06 + mouthOpen * 0.1})`);
                    jawGlow.addColorStop(1, 'rgba(255,255,255,0)');
                    ctx.fillStyle = jawGlow;
                    ctx.fillRect(cx - baseRadius, cy, baseRadius * 2, baseRadius);
                }

                ctx.restore();

                // Animated border ring — pulses brighter when speaking
                const borderGlow = isSpeakingPose
                    ? (Math.sin(phaseRef.current * 3) + 1) * 0.3 + 0.4
                    : 0.25;
                ctx.beginPath();
                ctx.arc(cx, cy, baseRadius - 2, 0, Math.PI * 2);
                ctx.strokeStyle = `${companyColor}${Math.round(borderGlow * 255).toString(16).padStart(2, '0')}`;
                ctx.lineWidth = size === 'large' ? 3 : 2;
                ctx.stroke();

                // Speaking: outer glow halo
                if (isSpeakingPose) {
                    const haloR = size === 'large' ? 8 : 5;
                    const halo = ctx.createRadialGradient(cx, cy, baseRadius - 2, cx, cy, baseRadius + haloR);
                    halo.addColorStop(0, `${companyColor}18`);
                    halo.addColorStop(1, `${companyColor}00`);
                    ctx.fillStyle = halo;
                    ctx.beginPath();
                    ctx.arc(cx, cy, baseRadius + haloR, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                // Fallback glow while image loads
                const innerGlow = ctx.createRadialGradient(cx, cy, baseRadius * 0.3, cx, cy, baseRadius);
                innerGlow.addColorStop(0, `${companyColor}30`);
                innerGlow.addColorStop(1, `${companyColor}08`);
                ctx.beginPath();
                ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
                ctx.fillStyle = innerGlow;
                ctx.fill();

                // Company logo emoji as fallback
                const fontSize = size === 'large' ? 38 : 22;
                ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(companyLogo, cx, cy);
            }

            // Speaking wave bars
            if (speaking || pose === 'speaking') {
                const barCount = 7;
                const barWidth = size === 'large' ? 4 : 2.5;
                const gap = size === 'large' ? 5 : 3;
                const totalW = barCount * barWidth + (barCount - 1) * gap;
                const startX = cx - totalW / 2;
                const barY = cy + baseRadius + (size === 'large' ? 22 : 12);

                for (let b = 0; b < barCount; b++) {
                    const barH = (Math.sin(phaseRef.current * 5 + b * 0.9) + 1) * (size === 'large' ? 10 : 6) + 3;
                    const x = startX + b * (barWidth + gap);
                    ctx.fillStyle = companyColor;
                    ctx.globalAlpha = 0.6 + Math.sin(phaseRef.current * 3 + b) * 0.2;
                    ctx.beginPath();
                    ctx.roundRect(x, barY - barH / 2, barWidth, barH, 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }

            animRef.current = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animRef.current);
    }, [speaking, pose, companyColor, companyLogo, size]);

    return (
        <canvas
            ref={canvasRef}
            className="ti-avatar-canvas"
            style={{ width: size === 'large' ? 280 : 140, height: size === 'large' ? 280 : 140 }}
        />
    );
}

// ─── Mic Level Indicator ───
function MicLevel({ stream }) {
    const [level, setLevel] = useState(0);
    const analyserRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        if (!stream) return;
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const tick = () => {
                analyser.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setLevel(Math.min(avg / 128, 1));
                rafRef.current = requestAnimationFrame(tick);
            };
            tick();

            return () => {
                cancelAnimationFrame(rafRef.current);
                audioCtx.close();
            };
        } catch (e) { /* AudioContext not available */ }
    }, [stream]);

    return (
        <div className="ti-mic-level">
            {[...Array(5)].map((_, i) => (
                <div
                    key={i}
                    className={`ti-mic-bar ${level > (i + 1) * 0.2 ? 'active' : ''}`}
                />
            ))}
        </div>
    );
}

function clampInterviewScore(value, fallback = 0) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.max(0, Math.min(100, Math.round(numeric)));
}

function buildInterviewSummaryFallback(avg, config, questionCount, speechHistory = []) {
    const overallScore = clampInterviewScore(avg, 70);
    const detailedBreakdown = {
        technicalSkills: clampInterviewScore(overallScore - 4, overallScore),
        communication: clampInterviewScore(overallScore + 3, overallScore),
        problemSolving: clampInterviewScore(overallScore - 1, overallScore),
        cultureFit: clampInterviewScore(overallScore + 2, overallScore),
    };

    return {
        overallScore,
        summary: `You completed ${questionCount || 0} questions for the ${config.role} role at ${config.company}. Your baseline communication held up, but the next gain will come from making answers more specific and structured.`,
        strengths: ['Stayed engaged across the session', 'Answered directly instead of stalling', 'Maintained a usable structure in most responses'],
        improvements: ['Add more specific examples and trade-offs', 'State the core answer earlier', 'Close answers with a concrete takeaway'],
        recommendation: 'Review the weakest answers from this mock and re-answer them with more depth.',
        verdict: overallScore >= 85 ? 'Strong Hire' : overallScore >= 70 ? 'Would Advance' : overallScore >= 55 ? 'Borderline' : 'Would Not Advance',
        verdictEmoji: overallScore >= 85 ? '🌟' : overallScore >= 70 ? '👍' : overallScore >= 55 ? '🤔' : '👎',
        detailedBreakdown,
        categoryScores: detailedBreakdown,
        suggestedTopics: [
            { topic: 'Answer specificity', priority: 'high', reason: 'The session needs more concrete examples and clearer support.' },
            { topic: `${config.stage} interview practice`, priority: 'medium', reason: 'Practicing the exact interview format will improve consistency.' },
            { topic: 'Follow-up question handling', priority: 'medium', reason: 'Stronger follow-up depth usually improves overall interview performance.' }
        ],
        practiceQuestions: [
            'Repeat one weak answer and make it twice as concrete.',
            'Answer a follow-up question that asks for trade-offs or edge cases.',
            `Practice one ${config.stage} interview question under a time limit.`,
            'Explain one solution and then summarize it in two crisp sentences.',
            'Record one answer and critique clarity, depth, and structure.'
        ],
        studyPlan: [
            { day: 'Day 1-2', focus: 'Weakest answers', tasks: ['Rewrite the weakest responses', 'Add one concrete example to each'] },
            { day: 'Day 3-4', focus: 'Structure', tasks: ['Practice clear openings', 'Add trade-offs and outcomes'] },
            { day: 'Day 5', focus: config.stage, tasks: ['Run a timed mock round', 'Review missed details'] },
            { day: 'Day 6', focus: 'Communication', tasks: ['Record 3 answers', 'Tighten pacing and clarity'] },
            { day: 'Day 7', focus: 'Review & Practice', tasks: ['Redo the mock', 'Compare against the prior round'] }
        ],
        questionBreakdown: [],
        recommendations: [{ area: 'Next Focus', action: 'Make each answer more specific and concrete.' }],
        speechAnalysis: speechHistory?.length > 0 ? {
            overallWPM: Math.round(speechHistory.reduce((sum, sample) => sum + (sample.wpm || 0), 0) / speechHistory.length),
            totalFillers: speechHistory.reduce((sum, sample) => sum + (sample.totalFillers || 0), 0),
            clarityTrend: speechHistory.map(sample => sample.clarityScore || 80),
            confidenceTrend: speechHistory.map(sample => sample.confidenceScore || 75),
        } : null,
    };
}


export default function CompanyInterview() {
    const { user } = useAuth();

    // ── State ──
    const [phase, setPhase] = useState('lobby'); // lobby | interview | summary
    const phaseRef = useRef(phase);
    useEffect(() => { phaseRef.current = phase; }, [phase]);

    const [config, setConfig] = useState({
        company: 'google', role: 'SDE', stage: 'Technical',
        difficulty: 'Medium', format: 'voice'
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
    const [useResumeContext, setUseResumeContext] = useState(false);
    const [resumeUploadLoading, setResumeUploadLoading] = useState(false);
    const [resumeContext, setResumeContext] = useState(null);
    const [resumeFileName, setResumeFileName] = useState('');
    const totalQuestions = advancedOptions.questionCount;

    // Realism features
    const [hintData, setHintData] = useState(null);
    const [hintLoading, setHintLoading] = useState(false);
    const [interviewerReaction, setInterviewerReaction] = useState(null);
    const [thinkTimeLeft, setThinkTimeLeft] = useState(0);
    const thinkTimerRef = useRef(null);

    // Media
    const [cameraOn, setCameraOn] = useState(true);
    const [micOn, setMicOn] = useState(true);
    const [stream, setStream] = useState(null);
    const [chatOpen, setChatOpen] = useState(true);
    const [fullscreen, setFullscreen] = useState(false);

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
    const [speechHistory, setSpeechHistory] = useState([]); // per-answer speech data

    // Adaptive difficulty
    const [difficultyLevel, setDifficultyLevel] = useState('medium');
    const [adaptiveNote, setAdaptiveNote] = useState(null);
    const [codeFeedback, setCodeFeedback] = useState(null);

    // Code editor (for DSA/OA stages)
    const [codeEditorOpen, setCodeEditorOpen] = useState(false);
    const [editorCode, setEditorCode] = useState('');
    const [editorLanguage, setEditorLanguage] = useState('python');

    // Proctoring
    const [proctoringEnabled, setProctoringEnabled] = useState(true);
    const [proctoringViolations, setProctoringViolations] = useState([]);

    // Company-specific questions
    const [useRealQuestions, setUseRealQuestions] = useState(false);
    const [questionBankIds, setQuestionBankIds] = useState([]);
    const [currentQuestionMeta, setCurrentQuestionMeta] = useState(null);
    const [questionSource, setQuestionSource] = useState('ai');

    // ── Helpers ──
    const companyObj = COMPANIES.find(c => c.id === config.company) || COMPANIES[0];
    const companyName = companyObj.name;
    const companyLogo = companyObj.logo;
    const companyColor = companyObj.color;

    const getAuthHeaders = () => {
        const token = user?.access_token || localStorage.getItem('access_token');
        return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

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

    const applyPreset = (preset) => {
        setActivePreset(preset.id);
        setAdvancedOptions(prev => ({ ...prev, ...preset.options }));
    };

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
            if (!res.ok) {
                throw new Error(data.error || 'Failed to upload CV');
            }

            setResumeContext(data.resumeProfile || null);
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
            const res = await fetch(`${API_URL}/api/resume/latest`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to load latest CV');
            }

            setResumeContext(data.resumeProfile || null);
            setResumeFileName('Latest saved CV');
            setUseResumeContext(true);
        } catch (error) {
            console.error('Load latest CV failed:', error);
            setResumeContext(null);
        } finally {
            setResumeUploadLoading(false);
        }
    };

    const getQuestionSourceBadge = (source) => {
        if (source === 'database') return { label: 'Real company', className: 'database' };
        if (source === 'resume') return { label: 'From CV', className: 'resume' };
        return { label: 'AI generated', className: 'ai' };
    };

    // ── Media controls ──
    const startMedia = async () => {
        try {
            const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = s;
            setStream(s);
            if (videoRef.current) videoRef.current.srcObject = s;
            return true;
        } catch {
            // Allow text-only if no camera
            setStream(null);
            setCameraOn(false);
            return false;
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

    // ── Timer ──
    useEffect(() => {
        if (phase === 'interview') {
            timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [phase]);

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
            window.speechSynthesis?.cancel();
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
                audioPlayerRef.current.src = '';
            }
        };
    }, []);

    // ── TTS — pick the most natural voice available ──
    const getBestVoice = () => {
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

    const speakText = async (text, onComplete) => {
        setAiSpeaking(true);

        // Always use friendly persona for warm, approachable voice
        const persona = 'friendly';

        // Try high-quality backend TTS first
        try {
            const res = await fetch(`${API_URL}/api/voice/tts`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ text, persona })
            });

            if (res.ok) {
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
                    URL.revokeObjectURL(audioUrl);
                    if (onComplete) setTimeout(() => onComplete(), 100);
                };

                audio.onerror = (e) => {
                    if (!isMountedRef.current || phaseRef.current !== 'interview') return;
                    console.warn('Audio playback error, falling back to browser TTS', e);
                    fallbackSpeakText(text, onComplete);
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
        fallbackSpeakText(text, onComplete);
    };

    const fallbackSpeakText = (text, onComplete) => {
        if (!window.speechSynthesis) {
            if (onComplete) onComplete();
            return;
        }
        window.speechSynthesis.cancel();

        const speak = () => {
            const utterance = new SpeechSynthesisUtterance(text);
            const voice = getBestVoice();
            if (voice) utterance.voice = voice;

            // Natural conversational parameters
            utterance.rate = 0.95;     // natural conversational pace
            utterance.pitch = 1.08;    // warmer, friendlier tone
            utterance.volume = 0.95;   // not blasting, feels natural

            utterance.onstart = () => {
                if (isMountedRef.current && phaseRef.current === 'interview') setAiSpeaking(true);
            };
            utterance.onend = () => {
                if (!isMountedRef.current || phaseRef.current !== 'interview') return;
                setAiSpeaking(false);
                utteranceRef.current = null;
                if (onComplete) setTimeout(() => onComplete(), 100);
            };
            utterance.onerror = (e) => {
                if (!isMountedRef.current || phaseRef.current !== 'interview') return;
                console.warn('SpeechSynthesis error:', e);
                setAiSpeaking(false);
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
            }

            if (finalTranscript) {
                accumulatedTranscriptRef.current += finalTranscript;
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
                setAutoSendCountdown(4);
                // Start 4-second countdown to auto-send
                let countdown = 4;
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
                }, 4000);
            } else if (interimTranscript) {
                // Show interim (live) text so user sees words appearing in real-time
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
                try { mediaRecorderRef.current.stop(); } catch (e) { }
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
            if (!recognitionRef.current) return;

            accumulatedTranscriptRef.current = '';
            setTranscript('');
            setInterimText('');
            setSpeechStartTime(Date.now());
            setAutoSendCountdown(0);
            clearTimeout(autoSendTimerRef.current);
            clearInterval(autoSendCountdownRef.current);

            try {
                recognitionRef.current.start();
                isListeningRef.current = true;
                setIsListening(true);

                // --- STT RECORDING START ---
                if (streamRef.current) {
                    const hasLiveAudio = streamRef.current.getAudioTracks().some(t => t.readyState === 'live');
                    if (hasLiveAudio) {
                        // Clean up any lingering recorder
                        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                            try { mediaRecorderRef.current.stop(); } catch (e) { }
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

                // Start 15-second inactivity timeout
                clearTimeout(inactivityTimerRef.current);
                inactivityTimerRef.current = setTimeout(() => {
                    if (isListeningRef.current && !accumulatedTranscriptRef.current.trim()) {
                        document.dispatchEvent(new CustomEvent('interview-auto-send', { detail: { autoSkip: true } }));
                    }
                }, 15000);
            } catch (e) {
                console.error('Failed to start speech recognition:', e);
                isListeningRef.current = false;
                setIsListening(false);
            }
        }
    }, [initSpeechRecognition, speechStartTime]);

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
            const res = await fetch(`${API_URL}/api/company-interview/hint`, {
                method: 'POST', headers: getAuthHeaders(),
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

        try {
            const res = await fetch(`${API_URL}/api/company-interview/start`, {
                method: 'POST', headers: getAuthHeaders(),
                body: JSON.stringify({
                    ...config,
                    totalQuestions,
                    useRealQuestions,
                    advancedOptions,
                    resumeContext: useResumeContext ? resumeContext : null,
                })
            });
            const data = await res.json();
            const q = data.question || `Hi! Great to have you here today. I'm excited to learn more about your experience as a ${config.role}. Let's start with something fundamental — can you tell me about a challenging technical problem you solved recently?`;
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

            const msg = { role: 'interviewer', content: q, tips: data.tips || [], reaction: 'greeting', timestamp: new Date().toISOString(), questionSource: data.questionSource, questionMeta: data.questionMeta };
            setConversation([msg]);
            speakText(q, () => toggleListening(true));
        } catch {
            const fallback = `Hi! Welcome to your ${companyName} interview. I'm looking forward to our conversation today. Let's dive in — tell me about a challenging project you worked on recently and what made it interesting.`;
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

    const sendAnswer = async (isAutoSkip = false) => {
        if (!userInput.trim() && !isAutoSkip) return;

        // Stop voice recognition if active
        if (isListeningRef.current) {
            isListeningRef.current = false;
            setIsListening(false);
            recognitionRef.current?.stop();
        }

        // --- STT RECORDING STOP ---
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.onstop = () => {
                processFinalAudioAndSend(isAutoSkip);
            };
            mediaRecorderRef.current.stop();
            return; // Exit here. The onstop callback handles the rest.
        } else {
            processFinalAudioAndSend(isAutoSkip);
        }
    };

    const processFinalAudioAndSend = async (isAutoSkip) => {
        let answerText = userInput.trim();

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

        if (!answerText && !isAutoSkip) return;
        const answer = isAutoSkip && !answerText ? "I do not have a response to this question." : answerText;

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

        // Clear auto-send timers
        clearTimeout(autoSendTimerRef.current);
        clearInterval(autoSendCountdownRef.current);
        clearTimeout(inactivityTimerRef.current);
        setAutoSendCountdown(0);

        setUserInput('');
        setTranscript('');
        setInterimText('');
        accumulatedTranscriptRef.current = '';
        clearInterval(thinkTimerRef.current);
        setThinkTimeLeft(0);

        setConversation(prev => [...prev, { role: 'candidate', content: answer, timestamp: new Date().toISOString() }]);
        setLoading(true);

        try {
            const lastScoreVal = sessionScores.length > 0 ? sessionScores[sessionScores.length - 1] : null;
            const avgScoreVal = sessionScores.length > 0 ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length) : null;

            const res = await fetch(`${API_URL}/api/company-interview/follow-up`, {
                method: 'POST', headers: getAuthHeaders(),
                body: JSON.stringify({
                    company: config.company, role: config.role, stage: config.stage,
                    difficulty: config.difficulty,
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
                })
            });
            const data = await res.json();

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
                strengths: data.strengths || [],
                improvements: data.improvements || [],
                reaction: data.interviewerReaction,
                timestamp: new Date().toISOString()
            }]);

            if (questionCount < totalQuestions) {
                const followUp = data.followUpQuestion || 'Can you elaborate on that approach?';
                const isDifficultFollowUp = data.difficultyLevel === 'hard' || (config.difficulty === 'Hard' && data.interviewerReaction === 'challenging');
                if (isDifficultFollowUp) {
                    setInterviewerReaction('notes');
                    await waitInterviewerBeat(520, 280);
                    if (phaseRef.current !== 'interview') return;
                }
                setInterviewerReaction('thinking');
                await waitInterviewerBeat(900, 700);
                if (phaseRef.current !== 'interview') return;
                setCurrentQuestion(followUp);
                setQuestionCount(prev => prev + 1);
                if (data.thinkTime) startThinkTimer(data.thinkTime);
                setConversation(prev => [...prev, {
                    role: 'interviewer', content: followUp, tips: [],
                    reaction: data.interviewerReaction,
                    timestamp: new Date().toISOString(),
                    questionSource: data.questionSource,
                    questionMeta: data.questionMeta
                }]);

                // Track question source metadata for next follow-up
                if (data.questionSource) setQuestionSource(data.questionSource);
                if (data.questionMeta) setCurrentQuestionMeta(data.questionMeta);
                speakText(followUp, () => toggleListening(true));
            } else {
                // All questions done — closing compliment and auto-end
                const closingMsg = data.closingRemark || `Thank you so much for your time today! You did a great job discussing these topics. I really appreciated your thoughtful answers. Let me compile your results now.`;
                setConversation(prev => [...prev, {
                    role: 'interviewer', content: closingMsg, tips: [],
                    reaction: 'positive',
                    timestamp: new Date().toISOString()
                }]);
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
            setConversation(prev => [...prev, {
                role: 'feedback', content: fallbackFeedbacks[Math.floor(Math.random() * fallbackFeedbacks.length)], score: 70 + Math.floor(Math.random() * 15),
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
            speakText(fallbackQ, () => toggleListening(true));
        }
        setLoading(false);
    };

    const fetchSpeechFeedback = async (text, duration) => {
        try {
            const res = await fetch(`${API_URL}/api/company-interview/speech-feedback`, {
                method: 'POST', headers: getAuthHeaders(),
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
            const res = await fetch(`${API_URL}/api/company-interview/detailed-report`, {
                method: 'POST', headers: getAuthHeaders(),
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
            fetch(`${API_URL}/api/company-interview/save-session`, {
                method: 'POST', headers: getAuthHeaders(),
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
        } catch { } // silently fail — session save is best-effort
    };

    const resetInterview = () => {
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

    const avgScore = sessionScores.length > 0
        ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length)
        : null;

    // Auto-send event listener
    useEffect(() => {
        const handleAutoSend = (e) => {
            const isAutoSkip = e.detail?.autoSkip;
            if ((accumulatedTranscriptRef.current.trim() || isAutoSkip) && isListeningRef.current) {
                // Stop listening first
                isListeningRef.current = false;
                setIsListening(false);
                recognitionRef.current?.stop();
                setAutoSendCountdown(0);
                // Trigger send
                sendAnswer(isAutoSkip);
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
                                <label>Company</label>
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
                                    <label>Role</label>
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
                                    <label>Stage</label>
                                    <select value={config.stage} onChange={e => setConfig(prev => ({ ...prev, stage: e.target.value }))}>
                                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="ti-form-section">
                                    <label>Difficulty</label>
                                    <select value={config.difficulty} onChange={e => setConfig(prev => ({ ...prev, difficulty: e.target.value }))}>
                                        {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Format */}
                            <div className="ti-form-section">
                                <label>Format</label>
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

                            {/* Question Source Toggle */}
                            <div className="ti-form-section">
                                <label>Question Source</label>
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
                                </div>
                                {useRealQuestions && (
                                    <div className="ti-realq-note">
                                        Questions sourced from actual {companyName} interview reports
                                    </div>
                                )}
                            </div>

                            <div className="ti-form-section">
                                <label>Resume-Based Personalization</label>
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
                                        <label>Resume Interview Mode</label>
                                        <select
                                            value={advancedOptions.resumeInterviewMode}
                                            onChange={e => updateAdvancedOption('resumeInterviewMode', e.target.value)}
                                        >
                                            <option value="balanced">Balanced Resume Mix</option>
                                            <option value="walkthrough">Walk Me Through Your Resume</option>
                                            <option value="project-deep-dive">Project Deep Dive</option>
                                        </select>
                                    </div>
                                </div>
                                {resumeContext && (
                                    <div className="ti-resume-preview">
                                        <div className="ti-resume-preview-title">{resumeContext.candidateHeadline || 'Resume profile ready'}</div>
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
                                <label>Advanced AI Controls</label>
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
                                            Real Interviewer Mode
                                            <small style={{ display: 'block', opacity: 0.75 }}>
                                                Less coaching, sharper follow-ups, and closer to real interview pressure.
                                            </small>
                                        </span>
                                    </label>
                                </div>
                                <div className="ti-form-row">
                                    <div className="ti-form-section">
                                        <label>Interviewer Style</label>
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
                                        <label>Follow-up Depth</label>
                                        <select
                                            value={advancedOptions.followUpDepth}
                                            onChange={e => updateAdvancedOption('followUpDepth', e.target.value)}
                                        >
                                            <option value="standard">Standard</option>
                                            <option value="deep">Deep</option>
                                        </select>
                                    </div>
                                    <div className="ti-form-section">
                                        <label>Pacing</label>
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
                                        <label>Questions</label>
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
                                        <label>Focus Topics (optional)</label>
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
                                    <span className="ti-setup-icon">⏱️</span> <span>Duration:</span> <strong>30 mins</strong>
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

                    {/* Gamification Badges */}
                    <InterviewBadges
                        sessionStats={{
                            score: summaryData.overallScore || 70,
                            totalFillers: speechFeedback?.totalFillers || 0,
                            eyeContact: emotionMetrics?.eyeContact || 0,
                            confidenceScore: speechFeedback?.confidenceScore || summaryData.overallScore || 70,
                            interviewCount: parseInt(localStorage.getItem('pl_interview_count') || '0') + 1
                        }}
                    />
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    //  INTERVIEW PHASE — Teams-Style Layout
    // ═══════════════════════════════════════════
    return (
        <div className={`ti-interview-page ${fullscreen ? 'ti-fullscreen' : ''}`}>
            {/* ── Header Bar ── */}
            <header className="ti-header">
                <div className="ti-header-left">
                    <div className="ti-header-logo" style={{ color: companyColor }}>{companyLogo}</div>
                    <div className="ti-header-info">
                        <strong>{companyName} Interview</strong>
                        <span>{config.role} · {config.stage} · {config.difficulty}</span>
                    </div>
                </div>
                <div className="ti-header-center">
                    <div className="ti-header-timer">
                        <Clock size={14} />
                        <span>{formatTime(elapsed)}</span>
                    </div>
                    {questionCount > 0 && (
                        <div className="ti-breadcrumbs">
                            {Array.from({ length: totalQuestions }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`ti-breadcrumb-dot ${i < questionCount - 1 ? 'completed' : i === questionCount - 1 ? 'active' : ''}`}
                                />
                            ))}
                        </div>
                    )}
                    {avgScore !== null && (
                        <div className="ti-header-score" style={{ color: avgScore >= 80 ? '#22c55e' : avgScore >= 60 ? '#f59e0b' : '#ef4444' }}>
                            <Star size={12} /> {avgScore}%
                        </div>
                    )}
                    {/* Adaptive Difficulty Indicator */}
                    {difficultyLevel && (
                        <div className={`difficulty-indicator ${difficultyLevel}`} title={adaptiveNote || ''}>
                            {difficultyLevel === 'hard' ? '🔥' : difficultyLevel === 'easy' ? '📉' : '📊'}
                            {difficultyLevel === 'hard' ? 'Ramping Up' : difficultyLevel === 'easy' ? 'Adjusting' : 'Steady'}
                        </div>
                    )}
                </div>
                <div className="ti-header-right">
                    <div className="ti-header-participants">
                        <Users size={14} /> <span>2</span>
                    </div>
                    <button
                        className="ti-header-btn"
                        onClick={() => setFullscreen(f => !f)}
                        title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    >
                        {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                </div>
            </header>

            {/* ── Proctoring Status Bar ── */}
            <ProctoringManager
                enabled={proctoringEnabled}
                isActive={phase === 'interview'}
                emotionMetrics={emotionMetrics}
                onViolation={(v) => setProctoringViolations(prev => [...prev, v])}
                violations={proctoringViolations}
            />

            {/* ── Main Content ── */}
            <div className="ti-main" style={{ display: 'flex' }}>
                {/* Video Grid */}
                <div className={`ti-video-grid ${chatOpen ? 'with-chat' : 'full'}`}>
                    {/* AI Interviewer Tile */}
                    <div className={`ti-tile ti-tile-ai ${aiSpeaking ? 'ai-speaking' : ''}`}>
                        <div className="ti-interviewer-stage">
                            <div className="ti-interviewer-camera-bar">
                                <span className={`ti-camera-led ${aiSpeaking || loading ? 'live' : ''}`} />
                                <span className="ti-camera-label">
                                    {aiSpeaking
                                        ? 'Asking Question'
                                        : interviewerReaction === 'notes'
                                            ? 'Checking Notes'
                                        : loading
                                            ? 'Reviewing Answer'
                                            : isListening
                                                ? 'Listening to You'
                                                : 'Front Camera'}
                                </span>
                            </div>

                            <div className="ti-interviewer-seat-wrap">
                                <div className="ti-interviewer-backdrop" />
                                <AIAvatar
                                    speaking={aiSpeaking || loading}
                                    pose={aiSpeaking ? 'speaking' : interviewerReaction === 'notes' ? 'notes' : loading ? 'thinking' : isListening ? 'listening' : 'neutral'}
                                    companyColor={companyColor}
                                    companyLogo={companyLogo}
                                    size="large"
                                />
                                <div className="ti-interviewer-desk" />
                            </div>

                            <div className="ti-interviewer-question-card">
                                <div className="ti-interviewer-question-label">Current Question</div>
                                <p className="ti-interviewer-question-text">
                                    {currentQuestion || 'I will ask your first interview question in a moment.'}
                                </p>
                            </div>
                        </div>

                        <div className="ti-tile-nameplate">
                            <div className="ti-tile-name">
                                {aiSpeaking && <span className="ti-speaking-dot" />}
                                AI Interviewer · {companyName}
                            </div>
                        </div>
                        {aiSpeaking && (
                            <div className="ti-tile-speaking-badge">Asking Question</div>
                        )}
                    </div>

                    {/* User Webcam Tile */}
                    <div className={`ti-tile ti-tile-user ${isListening ? 'listening' : ''}`} style={{ position: 'relative' }}>
                        {cameraOn && stream ? (
                            <video
                                ref={handleVideoRef}
                                autoPlay muted playsInline
                                className="ti-user-video"
                            />
                        ) : (
                            <div className="ti-tile-no-cam">
                                <div className="ti-user-avatar">
                                    {user?.user_metadata?.full_name?.[0] || '👤'}
                                </div>
                            </div>
                        )}

                        {/* Speech Analytics Overlay */}
                        {isListening && (
                            <div className="ti-speech-overlay">
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {/* Waveform when listening but no metrics yet or alongside metrics */}
                                    <div className="ti-waveform" style={{ marginRight: '8px', padding: '0 4px' }}>
                                        <div className="ti-waveform-bar"></div>
                                        <div className="ti-waveform-bar"></div>
                                        <div className="ti-waveform-bar"></div>
                                        <div className="ti-waveform-bar"></div>
                                        <div className="ti-waveform-bar"></div>
                                    </div>

                                    {speechMetrics && speechMetrics.wordCount > 0 && (
                                        <>
                                            <span className={`ti-speech-pill ${speechMetrics.paceStatus}`}>
                                                {speechMetrics.wpm} WPM
                                            </span>
                                            {speechMetrics.totalFillers > 0 && (
                                                <span className="ti-speech-pill filler">
                                                    {speechMetrics.totalFillers} fillers
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Live Confidence Bar */}
                                {speechMetrics && speechMetrics.wordCount > 0 && (
                                    <div className="ti-confidence-wrapper">
                                        <span className="ti-confidence-label">Confidence</span>
                                        <div className="ti-confidence-bar-container">
                                            <div
                                                className="ti-confidence-bar-fill"
                                                style={{ width: `${Math.max(10, speechMetrics.confidenceScore || 0)}%` }}
                                            />
                                        </div>
                                        <span className="ti-confidence-value">{speechMetrics.confidenceScore || 0}%</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Emotion Detector */}
                        {emotionEnabled && cameraOn && stream && (
                            <EmotionDetector
                                videoRef={videoRef}
                                enabled={emotionEnabled}
                                onMetricsUpdate={setEmotionMetrics}
                            />
                        )}

                        <div className="ti-tile-nameplate">
                            <div className="ti-tile-name">
                                {isListening && <span className="ti-speaking-dot" />}
                                {user?.user_metadata?.full_name || 'You'}
                                {!micOn && <MicOff size={12} className="ti-muted-icon" />}
                            </div>
                        </div>

                        {/* Emotion overlay badge */}
                        {emotionEnabled && emotionMetrics && (
                            <div className="ti-emotion-badge">
                                <Eye size={12} /> {Math.round(emotionMetrics.engagement || 0)}%
                            </div>
                        )}
                    </div>

                    {/* Live Captions Overlay */}
                    {isListening && (transcript || interimText) && (
                        <div className="ti-captions-overlay">
                            <div className="ti-captions-bar">
                                <div className="ti-captions-indicator">
                                    <span className="ti-captions-dot" />
                                    <span>LIVE</span>
                                </div>
                                <p className="ti-captions-text">
                                    {transcript && <span className="ti-captions-final">{transcript}</span>}
                                    {isTranscribing && <span className="ti-captions-interim"> [Transcribing Audio with AI...] </span>}
                                    {!isTranscribing && interimText && <span className="ti-captions-interim">{interimText}</span>}
                                    <span ref={captionsEndRef} />
                                </p>
                                {autoSendCountdown > 0 && !isTranscribing && (
                                    <div className="ti-captions-autosend">
                                        Sending in {autoSendCountdown}s...
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat Sidebar */}
                {chatOpen && (
                    <aside className="ti-chat-sidebar">
                        <div className="ti-chat-header">
                            <h3><MessageSquare size={16} /> Interview Chat</h3>
                            <button className="ti-chat-close" onClick={() => setChatOpen(false)}>
                                <X size={16} />
                            </button>
                        </div>

                        <div className="ti-chat-messages">
                            {conversation.map((msg, idx) => (
                                <div key={idx} className={`ti-chat-msg ti-chat-${msg.role}`}>
                                    {msg.role === 'interviewer' && (
                                        <>
                                            <div className="ti-chat-msg-header">
                                                <span className="ti-chat-sender" style={{ color: companyColor }}>
                                                    {companyLogo} AI Interviewer
                                                </span>
                                                <div className="ti-chat-meta">
                                                    {msg.questionSource && (
                                                        <span className={`ti-chat-source-badge ${getQuestionSourceBadge(msg.questionSource).className}`}>
                                                            {getQuestionSourceBadge(msg.questionSource).label}
                                                        </span>
                                                    )}
                                                    <span className="ti-chat-time">
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="ti-chat-text">{msg.content}</p>
                                            {msg.tips?.length > 0 && (
                                                <div className="ti-chat-tips">
                                                    {msg.tips.map((t, i) => <span key={i} className="ti-chat-tip">💡 {t}</span>)}
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {msg.role === 'candidate' && (
                                        <>
                                            <div className="ti-chat-msg-header">
                                                <span className="ti-chat-sender you">You</span>
                                                <span className="ti-chat-time">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="ti-chat-text">{msg.content}</p>
                                        </>
                                    )}
                                    {msg.role === 'feedback' && (
                                        <div className="ti-chat-feedback">
                                            {msg.reaction && (
                                                <div className={`ti-reaction-badge ti-reaction-${msg.reaction}`}>
                                                    {msg.reaction === 'impressed' && '🌟 Impressed'}
                                                    {msg.reaction === 'encouraging' && '👏 Encouraging'}
                                                    {msg.reaction === 'probing' && '🔍 Digging Deeper'}
                                                    {msg.reaction === 'challenging' && '💪 Challenging'}
                                                    {msg.reaction === 'neutral' && '📋 Evaluating'}
                                                    {msg.reaction === 'greeting' && '👋 Welcome'}
                                                </div>
                                            )}
                                            <div className="ti-chat-fb-score" style={{
                                                color: msg.score >= 80 ? '#22c55e' : msg.score >= 60 ? '#f59e0b' : '#ef4444'
                                            }}>
                                                {msg.score}% — {msg.content}
                                            </div>
                                            {msg.strengths?.length > 0 && (
                                                <div className="ti-chat-fb-list">
                                                    {msg.strengths.map((s, i) => <span key={i} className="ti-fb-good">✅ {s}</span>)}
                                                </div>
                                            )}
                                            {msg.improvements?.length > 0 && (
                                                <div className="ti-chat-fb-list">
                                                    {msg.improvements.map((s, i) => <span key={i} className="ti-fb-improve">📝 {s}</span>)}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {loading && (
                                <div className="ti-chat-msg ti-chat-interviewer">
                                    <div className="ti-chat-msg-header">
                                        <span className="ti-chat-sender" style={{ color: companyColor }}>
                                            {companyLogo} AI Interviewer
                                        </span>
                                    </div>
                                    <div className="ti-chat-typing">
                                        <span /><span /><span />
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Chat Input */}
                        {questionCount <= totalQuestions && (
                            <div className="ti-chat-input-area">
                                {/* Think time countdown */}
                                {thinkTimeLeft > 0 && (
                                    <div className="ti-think-timer">
                                        <Timer size={14} />
                                        <span>Take your time — {thinkTimeLeft}s suggested think time</span>
                                        <div className="ti-think-bar">
                                            <div className="ti-think-fill" style={{ width: `${Math.min(100, (thinkTimeLeft / 60) * 100)}%` }} />
                                        </div>
                                    </div>
                                )}

                                {speechFeedback && config.format === 'voice' && (
                                    <div className="ti-chat-speech-bar">
                                        <span>🎤 {speechFeedback.wpm} WPM</span>
                                        <span>📝 {speechFeedback.totalFillers} fillers</span>
                                        <span>✨ {speechFeedback.clarityScore}%</span>
                                        {speechFeedback.confidenceScore && <span>💪 {speechFeedback.confidenceScore}% confidence</span>}
                                    </div>
                                )}

                                {/* Hint system */}
                                {!hintData && !loading && (
                                    <button className="ti-hint-btn" onClick={requestHint} disabled={hintLoading}>
                                        <Lightbulb size={14} />
                                        {hintLoading ? 'Getting hint...' : 'Need a hint?'}
                                    </button>
                                )}
                                {hintData && (
                                    <div className="ti-hint-card">
                                        <div className="ti-hint-header">
                                            <Lightbulb size={14} /> <strong>Hint</strong>
                                            <button className="ti-hint-close" onClick={() => setHintData(null)}><X size={12} /></button>
                                        </div>
                                        <p className="ti-hint-text">{hintData.hint}</p>
                                        {hintData.approach && <p className="ti-hint-approach">💡 {hintData.approach}</p>}
                                        {hintData.keyTopics?.length > 0 && (
                                            <div className="ti-hint-topics">
                                                {hintData.keyTopics.map((t, i) => <span key={i} className="ti-hint-topic">{t}</span>)}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="ti-chat-input-row">
                                    <button
                                        className={`ti-chat-mic-btn ${isListening ? 'active' : ''}`}
                                        onClick={toggleListening}
                                        title={isListening ? 'Stop & send' : 'Start speaking'}
                                    >
                                        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                                    </button>
                                    <textarea
                                        value={userInput}
                                        onChange={e => setUserInput(e.target.value)}
                                        placeholder={isListening ? '🔴 Listening...' : 'Type your answer...'}
                                        rows={2}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAnswer(); } }}
                                    />
                                    <button
                                        className="ti-chat-send-btn"
                                        onClick={sendAnswer}
                                        disabled={!userInput.trim() || loading}
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                        {questionCount > totalQuestions && !loading && (
                            <div className="ti-chat-complete">
                                <p>🎉 All {totalQuestions} questions answered!</p>
                                <button onClick={endInterview} className="ti-chat-end-btn">
                                    <BarChart3 size={14} /> View Results
                                </button>
                            </div>
                        )}
                    </aside>
                )}
            </div>

            {/* ── Controls Bar ── */}
            <div className="ti-controls">
                <div className="ti-controls-left">
                    <span className="ti-controls-time">
                        <Clock size={14} /> {formatTime(elapsed)}
                    </span>
                </div>

                <div className="ti-controls-center">
                    <button
                        className={`ti-ctrl-btn ${!micOn ? 'off' : ''}`}
                        onClick={toggleMic}
                        title={micOn ? 'Mute (Ctrl+M)' : 'Unmute'}
                    >
                        {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                        <span>{micOn ? 'Mute' : 'Unmute'}</span>
                    </button>

                    <button
                        className={`ti-ctrl-btn ${!cameraOn ? 'off' : ''}`}
                        onClick={toggleCamera}
                        title={cameraOn ? 'Turn off camera' : 'Turn on camera'}
                    >
                        {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
                        <span>Camera</span>
                    </button>

                    <button
                        className={`ti-ctrl-btn ${chatOpen ? 'active' : ''}`}
                        onClick={() => setChatOpen(c => !c)}
                        title="Toggle chat"
                    >
                        <MessageSquare size={20} />
                        <span>Chat</span>
                    </button>

                    <button className="ti-ctrl-btn" title="Raise hand">
                        <Hand size={20} />
                        <span>Raise</span>
                    </button>

                    <button className="ti-ctrl-btn" title="Reactions">
                        <SmilePlus size={20} />
                        <span>React</span>
                    </button>

                    <button
                        className={`ti-ctrl-btn ${emotionEnabled ? 'active' : ''}`}
                        onClick={() => setEmotionEnabled(e => !e)}
                        title="Body language AI"
                    >
                        <Eye size={20} />
                        <span>Body AI</span>
                    </button>

                    <button
                        className={`ti-ctrl-btn ${copilotOpen ? 'active' : ''}`}
                        onClick={() => setCopilotOpen(c => !c)}
                        title="AI Copilot suggestions"
                    >
                        <Brain size={20} />
                        <span>Copilot</span>
                    </button>

                    {(config.stage === 'DSA / Coding' || config.stage === 'OA') && (
                        <button
                            className={`ti-ctrl-btn ${codeEditorOpen ? 'active' : ''}`}
                            onClick={() => setCodeEditorOpen(c => !c)}
                            title="Code Editor"
                        >
                            <Code2 size={20} />
                            <span>Code</span>
                        </button>
                    )}

                    <button className="ti-ctrl-btn ti-ctrl-leave" onClick={endInterview} disabled={loading}>
                        <Phone size={20} />
                        <span>Leave</span>
                    </button>
                </div>

                <div className="ti-controls-right">
                    {avgScore !== null && (
                        <div className="ti-controls-score" style={{
                            color: avgScore >= 80 ? '#22c55e' : avgScore >= 60 ? '#f59e0b' : '#ef4444'
                        }}>
                            <Star size={14} /> {avgScore}%
                        </div>
                    )}
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
