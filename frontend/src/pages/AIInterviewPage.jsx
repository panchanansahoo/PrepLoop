import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAuth } from '../context/AuthContext';
import { useVoiceInterview } from '../hooks/useVoiceInterview';
import { useDeepgramVoice } from '../hooks/useDeepgramVoice';
import useInterviewIntelligence from '../hooks/useInterviewIntelligence';
import VoiceWaveform from '../components/VoiceWaveform';
import {
    Mic, MicOff, Phone, Flag, Code2, FileText, Palette,
    Clock, Search, Bell, Settings, RotateCcw, Sparkles,
    Send, MessageSquare, X, ChevronRight, Zap, Play,
    Bookmark, Volume2, VolumeX, Wifi, User, Building2,
    ArrowLeft, ArrowRight, CheckCircle, Star,
    Award, TrendingUp, BarChart3, Target, Brain, Shield,
    ThumbsUp, ThumbsDown, AlertTriangle, Download, Share2,
    RefreshCw, ChevronDown, ChevronUp, Eye, Timer,
    Lightbulb, Trophy, Gauge, CircleDot,
    Video, VideoOff, PanelRightOpen, PanelRightClose,
    Captions, CaptionsOff, GraduationCap, Briefcase
} from 'lucide-react';
import './AIInterviewPage.css';

/* ═══ Constants ═══ */
const LANGUAGES = [
    { id: 'python', label: 'Python', icon: '🐍' },
    { id: 'javascript', label: 'JavaScript', icon: '🟨' },
    { id: 'java', label: 'Java', icon: '☕' },
    { id: 'cpp', label: 'C++', icon: '⚙️' },
    { id: 'typescript', label: 'TypeScript', icon: '🔷' },
    { id: 'go', label: 'Go', icon: '🔵' },
];

const BOILERPLATE = {
    python: `def solution(nums, k):
    """
    Solve the problem here.

    Args:
        nums: Input array
        k: Parameter k

    Returns:
        Result
    """
    # Your solution here
    pass

# Test your solution
if __name__ == "__main__":
    test_nums = [1, 2, 3]
    test_k = 1
    result = solution(test_nums, test_k)
    print(f"Result: {result}")
`,
    javascript: `// Write your solution here
function solution(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (seen.has(complement)) {
            return [seen.get(complement), i];
        }
        seen.set(nums[i], i);
    }
    return [];
}

// Test cases
console.log(solution([2, 7, 11, 15], 9));  // [0, 1]
console.log(solution([3, 2, 4], 6));       // [1, 2]
`,
    java: `// Write your solution here
import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[]{seen.get(complement), i};
            }
            seen.put(nums[i], i);
        }
        return new int[]{};
    }
}
`,
    cpp: `// Write your solution here
#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (seen.count(complement)) {
            return {seen[complement], i};
        }
        seen[nums[i]] = i;
    }
    return {};
}

int main() {
    vector<int> nums = {2, 7, 11, 15};
    auto result = twoSum(nums, 9);
    cout << result[0] << ", " << result[1] << endl;
    return 0;
}
`,
    typescript: `// Write your solution here
function solution(nums: number[], target: number): number[] {
    const seen = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (seen.has(complement)) {
            return [seen.get(complement)!, i];
        }
        seen.set(nums[i], i);
    }
    return [];
}

// Test cases
console.log(solution([2, 7, 11, 15], 9));
console.log(solution([3, 2, 4], 6));
`,
    go: `package main

import "fmt"

func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, num := range nums {
        complement := target - num
        if j, ok := seen[complement]; ok {
            return []int{j, i}
        }
        seen[num] = i
    }
    return []int{}
}

func main() {
    fmt.Println(twoSum([]int{2, 7, 11, 15}, 9))
}
`,
};

const AI_INTERVIEW_GENDER_STORAGE_KEY = 'preploop-ai-interview-gender-v1';

const readStoredInterviewerGender = () => {
    if (typeof window === 'undefined') return 'male';

    try {
        const stored = window.localStorage.getItem(AI_INTERVIEW_GENDER_STORAGE_KEY);
        return stored === 'female' ? 'female' : 'male';
    } catch {
        return 'male';
    }
};

const HR_INTERVIEWER_VIDEOS = {
    male: {
        speaking: '/malespeaking.mp4',
        listening: '/malelisrning.mp4',
    },
    female: {
        speaking: '/HannahChenSpeaking.mp4',
        listening: '/HannahChenListening.mp4',
    },
};

const COMPANY_INTERVIEWERS = {
    'Google':      { male: { name: 'Ryan Mitchell', role: 'Senior Software Engineer' },   female: { name: 'Hannah Chen', role: 'Senior Software Engineer' } },
    'Apple':       { male: { name: 'James Park', role: 'Staff Engineer' },                female: { name: 'Megan Liu', role: 'Staff Engineer' } },
    'Meta':        { male: { name: 'Kevin Patel', role: 'Engineering Manager' },           female: { name: 'Priya Sharma', role: 'Engineering Manager' } },
    'Amazon':      { male: { name: 'David Kim', role: 'Principal SDE' },                  female: { name: 'Emily Torres', role: 'Principal SDE' } },
    'Netflix':     { male: { name: 'Marcus Lee', role: 'Senior Engineer' },                female: { name: 'Sarah Johnson', role: 'Senior Engineer' } },
    'Microsoft':   { male: { name: 'Alex Rodriguez', role: 'Principal Engineer' },         female: { name: 'Jessica Wang', role: 'Principal Engineer' } },
    'Infosys':     { male: { name: 'Rajesh Nair', role: 'Technical Lead' },                female: { name: 'Megha Iyer', role: 'Technical Lead' } },
    'TCS':         { male: { name: 'Suresh Kumar', role: 'Solution Architect' },            female: { name: 'Ananya Gupta', role: 'Solution Architect' } },
    'Wipro':       { male: { name: 'Karthik Menon', role: 'Senior Developer' },             female: { name: 'Lavanya Reddy', role: 'Senior Developer' } },
    'Flipkart':    { male: { name: 'Arjun Das', role: 'SDE-3' },                           female: { name: 'Sneha Patel', role: 'SDE-3' } },
    'Razorpay':    { male: { name: 'Arjun Mehta', role: 'Backend Lead' },                  female: { name: 'Ritu Saxena', role: 'Backend Lead' } },
    'Swiggy':      { male: { name: 'Varun Srinivasan', role: 'Engineering Manager' },      female: { name: 'Divya Krishnan', role: 'Engineering Manager' } },
    'Zomato':      { male: { name: 'Rohit Verma', role: 'Staff Engineer' },                female: { name: 'Pooja Bansal', role: 'Staff Engineer' } },
    'Paytm':       { male: { name: 'Nikhil Jain', role: 'Tech Lead' },                     female: { name: 'Neha Agarwal', role: 'Tech Lead' } },
    'Meesho':      { male: { name: 'Vikram Singh', role: 'Senior SDE' },                   female: { name: 'Aditi Sharma', role: 'Senior SDE' } },
    'Dream11':     { male: { name: 'Aditya Joshi', role: 'Platform Engineer' },             female: { name: 'Tanvi Desai', role: 'Platform Engineer' } },
    'PhonePe':     { male: { name: 'Harish Rao', role: 'Engineering Lead' },                female: { name: 'Kavitha Raman', role: 'Engineering Lead' } },
    'CRED':        { male: { name: 'Siddharth Rao', role: 'Senior Backend Engineer' },     female: { name: 'Nisha Kapoor', role: 'Senior Backend Engineer' } },
    'Spotify':     { male: { name: 'Erik Lindström', role: 'Senior Engineer' },             female: { name: 'Sofia Andersson', role: 'Senior Engineer' } },
    'Airbnb':      { male: { name: 'Tyler Brooks', role: 'Staff Engineer' },                female: { name: 'Michelle Wu', role: 'Staff Engineer' } },
    'Uber':        { male: { name: 'Carlos Mendez', role: 'Senior SDE' },                  female: { name: 'Aisha Patel', role: 'Senior SDE' } },
    'Stripe':      { male: { name: 'Nathan Cole', role: 'Engineering Lead' },               female: { name: 'Emma Clarke', role: 'Engineering Lead' } },
    'Salesforce':  { male: { name: 'Michael Torres', role: 'Principal Engineer' },          female: { name: 'Laura Chen', role: 'Principal Engineer' } },
    'Adobe':       { male: { name: 'Brian Zhang', role: 'Staff Software Engineer' },        female: { name: 'Lisa Wang', role: 'Staff Software Engineer' } },
    'Oracle':      { male: { name: 'Robert Chen', role: 'Senior Architect' },               female: { name: 'Sandra Lee', role: 'Senior Architect' } },
    'IBM':         { male: { name: 'Thomas Reed', role: 'Distinguished Engineer' },          female: { name: 'Nadia Okonkwo', role: 'Distinguished Engineer' } },
    'Twitter / X': { male: { name: 'Jake Morrison', role: 'Senior Backend Engineer' },     female: { name: 'Maya Singh', role: 'Senior Backend Engineer' } },
    'LinkedIn':    { male: { name: 'Daniel Park', role: 'Senior Software Engineer' },       female: { name: 'Rachel Kim', role: 'Senior Software Engineer' } },
    'Nvidia':      { male: { name: 'Daniel Liu', role: 'Senior CUDA Engineer' },            female: { name: 'Wei Lin', role: 'Senior CUDA Engineer' } },
    'Tesla':       { male: { name: 'Mark Johnson', role: 'Firmware Lead' },                 female: { name: 'Anna Kowalski', role: 'Firmware Lead' } },
};

const DEFAULT_INTERVIEWER = {
    male:   { name: 'Ryan Mitchell', role: 'Senior Software Engineer' },
    female: { name: 'Hannah Chen', role: 'Senior Software Engineer' },
};

/* ═══ Helper: Format elapsed time ═══ */
function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

/* ═══ Main Component ═══ */
export default function AIInterviewPage() {
    const { user, getAuthHeaders } = useAuth();
    const navigate = useNavigate();

    // ── Interview Config ──
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

    // ── Prevent hook instantiation before dependencies are ready ──
    // We'll initialize voice hook lazily after speakerMuted is set up (see below)
    const voiceHookRef = useRef(null);

    // ── Tab State ──
    const [activeTab, setActiveTab] = useState('code'); // code | design | notes

    // ── Code Editor State ──
    const [language, setLanguage] = useState('python');
    const [code, setCode] = useState(BOILERPLATE.python);
    const [lineCount, setLineCount] = useState(1);

    // ── Timer ──
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef(null);

    // ── Interview State ──
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [questionIndex, setQuestionIndex] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(6);
    const [loading, setLoading] = useState(false);

    // ── Analysis Loading State ──
    const [analysisLoading, setAnalysisLoading] = useState(false);

    // ── Controls ──
    const [cameraOn, setCameraOn] = useState(true);
    const [bookmarked, setBookmarked] = useState(false);
    const [speakerMuted, setSpeakerMuted] = useState(false);
    const [micOn, setMicOn] = useState(false);
    const [interviewerVideoReady, setInterviewerVideoReady] = useState({ speaking: false, listening: false });
    const [interviewerVisibleMode, setInterviewerVisibleMode] = useState('listening');

    // ── Voice Orchestration Hook ──
    const sendAnswerRef = useRef(null);
    const classicVoice = useVoiceInterview({
        speakerMuted,
        interviewerGender,
        getAuthHeaders,
        getBrowserVoice: () => ({ pitch: 1.0, rate: 0.95 }),
        splitTextForTTS: (text) => {
            const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
            return sentences.map(s => s.trim()).filter(s => s.length > 0);
        },
        onAutoSend: () => {
            if (sendAnswerRef.current) sendAnswerRef.current();
        }
    });

    // ── Deepgram Streaming Voice Hook ──
    // Runs the real-time STT (Deepgram) + TTS (Kokoro local) pipeline.
    // `onAnswer` bridges detected speech directly into sendAnswer().
    const dgVoice = useDeepgramVoice({
        onAnswer: useCallback((answerText) => {
            // Push transcribed text into state for UI display
            classicVoice.setTranscript(answerText);
            // CRITICAL: Pass answerText directly to sendAnswer because React
            // state (transcript) won't update until the next render. Without
            // this, sendAnswer reads stale/empty transcript and silently bails.
            if (sendAnswerRef.current) sendAnswerRef.current(false, answerText);
        }, []),  // eslint-disable-line react-hooks/exhaustive-deps
        onTranscriptUpdate: useCallback((partial) => {
            classicVoice.setTranscript(partial);
        }, []),  // eslint-disable-line react-hooks/exhaustive-deps
        interviewType,
        personaGender: interviewerGender,
        question: currentQuestion,
    });

    // ── Interview Intelligence (filler detection + answer analysis) ──
    const intelligence = useInterviewIntelligence({ getAuthHeaders });

    // Use classic voice as foundation; override speak/record with Deepgram pipeline.
    const voice = classicVoice;


    // Destructure classic voice hook values (refs / TTS state)
    const {
        aiSpeaking,
        setAiSpeaking,
        transcript,
        setTranscript,
        silenceCountdown,
        isListeningRef,
        isSendingRef,
        ttsAudioRef,
    } = voice;

    // isListening now derived from dgVoice.state so the UI accurately reflects
    // the Deepgram MediaRecorder pipeline (not the legacy WebSpeech API)
    const isListening = dgVoice.state === 'listening';
    // Keep the shared ref in sync so closures that read isListeningRef work
    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening, isListeningRef]);

    // ── Upgraded voice controls ──
    // speakInterviewerText → routes through backend TTS (Kokoro local → Groq Orpheus → browser)
    const speakInterviewerText = useCallback(async (text) => {
        if (!text) return;
        setAiSpeaking(true);
        await dgVoice.speak(text, {
            onStart: () => setAiSpeaking(true),
            onEnd:   () => setAiSpeaking(false),
        });
        setAiSpeaking(false);
    }, [dgVoice, setAiSpeaking]);

    // startVoiceRecording / stopVoiceRecording → Deepgram MediaRecorder pipeline
    const startVoiceRecording = useCallback(() => {
        dgVoice.start();
    }, [dgVoice]);

    const stopVoiceRecording = useCallback(() => {
        dgVoice.stop();
    }, [dgVoice]);

    // ── Chat ──
    const [chatOpen, setChatOpen] = useState(false);
    const [conversation, setConversation] = useState([]);
    const [userInput, setUserInput] = useState('');
    const chatEndRef = useRef(null);

    const [interviewerStatus, setInterviewerStatus] = useState('');
    const [silenceStage, setSilenceStage] = useState(0);
    const silenceStageTimerRef = useRef(null);

    // ── State Refs for Auto-Send Check (tracks current state values in closures) ──
    const stateRefs = useRef({ userInput: '', transcript: '', code: '', language: 'python' });
    useEffect(() => {
        stateRefs.current = { userInput, transcript, code, language };
    }, [userInput, transcript, code, language]);

    // ── Intelligence: feed live transcript to filler detector ──
    useEffect(() => {
        if (transcript && transcript.trim().length > 0) {
            intelligence.ingestTranscript(transcript);
        }
    }, [transcript, intelligence]);

    // ── Intelligence: feed audio RMS to confidence scorer ──
    useEffect(() => {
        if (dgVoice.inputLevel > 0) {
            intelligence.ingestAudioConfidence(dgVoice.inputLevel);
        }
    }, [dgVoice.inputLevel, intelligence]);

    // ── Notes ──
    const [notes, setNotes] = useState('');

    // ── Webcam ──
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const interviewerSpeakingVideoRef = useRef(null);
    const interviewerListeningVideoRef = useRef(null);
    const interviewerPlaybackRef = useRef({ speaking: 0, listening: 0 });
    const interviewerTargetModeRef = useRef('listening');
    const [workspacePanelOpen, setWorkspacePanelOpen] = useState(true);
    const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);

    // ── Captions ──
    const [captionsOn, setCaptionsOn] = useState(true);

    // ── API Error Logger ──
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
            questionIndex,
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
    }, [questionIndex, totalQuestions, phase]);

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

    // ── Setup Wizard State ──
    const [setupStep, setSetupStep] = useState(0); // 0-5
    const [experienceLevel, setExperienceLevel] = useState('fresher'); // 'fresher' | 'experienced'
    const [targetRole, setTargetRole] = useState('');
    const [targetCompany, setTargetCompany] = useState('');
    const [companySearch, setCompanySearch] = useState('');
    const [companyTab, setCompanyTab] = useState('all');
    const [resumeFile, setResumeFile] = useState(null);
    const [activeResumeContext, setActiveResumeContext] = useState(null);

    // ── Auto-adjust question count based on experience level ──
    React.useEffect(() => {
        if (experienceLevel === 'fresher') {
            setTotalQuestions(12);
        } else {
            setTotalQuestions(6);
        }
    }, [experienceLevel]);

    // ── Results State ──
    const [resultTab, setResultTab] = useState('overview');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [expandedMoment, setExpandedMoment] = useState(null);

    // ── Derived: pick interviewer based on selected company + gender ──
    const companyPool = targetCompany && COMPANY_INTERVIEWERS[targetCompany]
        ? COMPANY_INTERVIEWERS[targetCompany]
        : DEFAULT_INTERVIEWER;
    const interviewerVideos = HR_INTERVIEWER_VIDEOS[interviewerGender] || HR_INTERVIEWER_VIDEOS.female;
    const INTERVIEWER = {
        ...(companyPool[interviewerGender] || companyPool.female),
        company: targetCompany || 'Google',
        avatar: '/interviewer-avatar.png',
    };

    // ── Generate Analysis from conversation data (AI-powered with fallback) ──
    const generateAnalysis = useCallback(async () => {
        const totalMessages = conversation.length;
        const userMessages = conversation.filter(m => m.role === 'candidate');

        const statsObj = {
            duration: formatTime(elapsed),
            questionsAnswered: questionIndex,
            totalMessages,
            linesOfCode: lineCount,
            language,
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
            const res = await fetch('/api/company-interview/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({
                    conversation: conversation.map(m => ({ role: m.role, content: m.content })),
                    company: targetCompany || 'General',
                    role: targetRole || 'Software Engineer',
                    stage: interviewType,
                    interviewType,
                    duration: formatTime(elapsed),
                    questionsAnswered: questionIndex,
                    code,
                    language,
                    linesOfCode: lineCount,
                    interviewerName: INTERVIEWER.name,
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

        // Fallback: client-side basic scoring
        const avgResponseLength = userMessages.length > 0
            ? Math.round(userMessages.reduce((sum, m) => sum + ((m.content || m.text || '').length || 0), 0) / userMessages.length)
            : 0;
        const communicationScore = Math.min(10, Math.round((avgResponseLength / 50) * 3 + (userMessages.length / Math.max(questionIndex, 1)) * 4 + Math.random() * 3));
        const technicalScore = Math.min(10, Math.round(3 + (code.length > 100 ? 3 : 1) + (lineCount > 5 ? 2 : 0) + Math.random() * 2));
        const problemSolvingScore = Math.min(10, Math.round(2 + (questionIndex > 2 ? 3 : 1) + (userMessages.length > 3 ? 2 : 0) + Math.random() * 3));
        const overallScore = Math.round(((communicationScore + technicalScore + problemSolvingScore) / 3) * 10) / 10;

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
                { name: 'Communication', score: communicationScore, icon: MessageSquare, color: '#818cf8' },
                { name: 'Technical Skills', score: technicalScore, icon: Code2, color: '#22d3ee' },
                { name: 'Problem Solving', score: problemSolvingScore, icon: Brain, color: '#a78bfa' },
                { name: 'Code Quality', score: Math.min(10, Math.round(3 + (lineCount > 10 ? 3 : 1) + Math.random() * 4)), icon: Shield, color: '#34d399' },
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

    // ── Timer Logic ──
    useEffect(() => {
        if (phase === 'interview') {
            timerRef.current = setInterval(() => {
                setElapsed(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [phase]);

    // ── Generate analysis when summary phase starts ──
    useEffect(() => {
        if (phase === 'summary') {
            generateAnalysis();
        }
    }, [phase, generateAnalysis]);

    // ── Auto-scroll chat ──
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);

    // ── Code line count ──
    useEffect(() => {
        setLineCount(code ? code.split('\n').length : 1);
    }, [code]);

    // ── Webcam init/cleanup ──
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

    // ── Language change handler ──
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

    // ── Speak interviewer text via TTS ──
    // Helper: pick a natural-sounding browser voice
    const getBrowserVoice = useCallback((gender = interviewerGender) => {
        if (!('speechSynthesis' in window)) return null;
        const voices = window.speechSynthesis.getVoices();
        const preferred = gender === 'male'
            ? [
                'Google US English', 'Google UK English Male', 'Alex', 'Daniel',
                'Microsoft David', 'Google UK English Female', 'Samantha', 'Karen',
                'Microsoft Zira', 'Microsoft Jenny', 'Moira', 'Fiona',
            ]
            : [
                'Google US English', 'Google UK English Female', 'Samantha', 'Karen',
                'Microsoft Zira', 'Microsoft Jenny', 'Moira', 'Fiona',
                'Google UK English Male', 'Alex', 'Daniel', 'Microsoft David',
            ];
        for (const name of preferred) {
            const v = voices.find(v => v.name.includes(name));
            if (v) return v;
        }
        // Fallback: any English voice that matches the selected gender when possible
        const genderedVoice = gender === 'male'
            ? voices.find(v => v.lang.startsWith('en') && /male|man|david|alex|daniel/i.test(v.name))
            : voices.find(v => v.lang.startsWith('en') && /female|woman|samantha|jenny|karen/i.test(v.name));
        if (genderedVoice) return genderedVoice;

        // Any English voice
        return voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
    }, [interviewerGender]);

    // Preload voices
    useEffect(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.getVoices(); // triggers loading
            window.speechSynthesis.onvoiceschanged = () => {}; // ensure loaded
        }
    }, []);

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




    // ── Cleanup Voice Resources on Unmount ──
    useEffect(() => {
        return () => {
            voice.cleanup();
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        };
    }, [voice.cleanup]);

    // ── Start Interview ──
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

        // ── Pipecat Real-Time Mode ──
        if (realtimeMode) {
                console.warn('[Pipecat] Real-time mode is temporarily unavailable, falling back to classic flow.');
                setRealtimeMode(false);
            }

        // Minimum display time for connecting animation
        const minDelay = new Promise(resolve => setTimeout(resolve, 3200));

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
                'HR': `Welcome! I'm excited to chat with you. Tell me a bit about yourself — what are you studying and what excites you about this role?`,
            };
            const questionText = data.question || stageFallbacks[resolvedStage] || `Welcome! Let's start this ${resolvedStage.toLowerCase()} interview. Tell me about a project you've worked on that you're proud of.`;
            setCurrentQuestion(questionText);
            setQuestionIndex(1);
            setConversation([{
                role: 'interviewer',
                content: questionText,
                timestamp: Date.now(),
            }]);

            // Speak the greeting, then auto-enable mic
            setPhase('interview');
            setLoading(false);
            await speakInterviewerText(questionText);
            // Auto-start mic after first question
            startVoiceRecording();
            setMicOn(true);
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
            setLoading(false);
            setPhase('interview');
            await speakInterviewerText(fallbackQ);
            startVoiceRecording();
            setMicOn(true);
        }
    };

    // ── Send Answer ──
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
        // Stop any ongoing voice recording (use ref to avoid stale closure)
        if (isListeningRef.current) stopVoiceRecording();

        // Stop AI speech immediately when user sends answer (smooth transition)
        if (ttsAudioRef.current) {
            ttsAudioRef.current.pause();
            ttsAudioRef.current = null;
        }
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        setAiSpeaking(false);

        // answerOverride allows callers (e.g. onAnswer from Deepgram STT) to
        // pass the answer text directly, bypassing stale React state.
        const answer = isAutoSkip === true
            ? "I do not have a response to this question."
            : (answerOverride?.trim() || userInput.trim() || transcript.trim());

        // Trigger answer analysis (non-blocking, fire-and-forget)
        if (answer && answer.length > 10) {
            intelligence.analyzeAnswer(answer, currentQuestion).catch(() => {});
        }
        if (!answer && !code.trim() && isAutoSkip !== true) { isSendingRef.current = false; return; }

        const fullAnswer = code.trim()
            ? `${answer}\n\n--- Code ---\n${code}`
            : answer;

        setConversation(prev => [...prev, {
            role: 'candidate',
            content: answer || '[Code submitted]',
            timestamp: Date.now(),
        }]);
        setUserInput('');
        setTranscript('');
        setLoading(true);

        const stageMap = {
            'coding': 'DSA / Coding', 'dsa': 'DSA / Coding',
            'system-design': 'System Design', 'behavioral': 'Behavioral',
            'product': 'Technical', 'data-science': 'Technical', 'ai-llm': 'Technical',
            'hr': 'HR', 'technical': 'Technical',
        };
        const resolvedStage = stageMap[interviewType] || 'Technical';
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
                    questionNumber: questionIndex + 1,
                    totalQuestions,
                    company: resolvedCompany,
                    role: resolvedRole,
                    stage: resolvedStage,
                    difficulty: experienceLevel === 'fresher' ? 'easy' : 'medium',
                    experienceLevel,
                    conversationHistory: conversation.map(m => ({ role: m.role, content: m.content })),
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

            // ── Show feedback with score, strengths, and improvements ──
            const feedbackText = data.feedback?.comment || data.feedback || '';
            const feedbackScore = data.feedback?.score || data.score || 0;
            if (feedbackText) {
                setConversation(prev => [...prev, {
                    role: 'feedback',
                    content: feedbackText,
                    score: feedbackScore,
                    strengths: data.strengths || [],
                    improvements: data.improvements || [],
                    hint: data.hint || '',
                    codeFeedback: data.codeFeedback || null,
                    timestamp: Date.now(),
                }]);
            }

            // ── Resolve next question (backend uses followUpQuestion) ──
            const nextQ = data.followUpQuestion || data.nextQuestion || data.question;
            const closingRemark = data.closingRemark;

            // ── Speak feedback first, then ask next question after a pause ──
            const spokenFeedback = feedbackText ? feedbackText.substring(0, 500) : '';

            // ONLY end the interview when the backend explicitly signals completion.
            // DO NOT use closingRemark alone — the AI LLM can hallucinate it on any question.
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

            // Speculative TTS pre-fetch: start downloading the audio for the
            // next question NOW, while feedback is still being spoken + thinking
            // delay runs. By the time speak(continueQ) is called, the blob is
            // already cached → near-zero TTS latency.
            if (!isInterviewOver) {
                dgVoice.prefetch(continueQ);
            }

            if (isInterviewOver) {
                // Last question — speak closing remark and end
                const closingText = data.closingRemark || closingRemark || 'Great job today! Thank you for your time. We\'ll be in touch soon.';
                setConversation(prev => [...prev, {
                    role: 'interviewer',
                    content: closingText,
                    timestamp: Date.now(),
                }]);
                setLoading(false);
                if (spokenFeedback) {
                    await speakInterviewerText(spokenFeedback);
                    // Brief pause between feedback and closing
                    await new Promise(r => setTimeout(r, 1200));
                }
                await speakInterviewerText(closingText);
                // End interview after closing is spoken
                setTimeout(() => endInterview(), 2000);
            } else {
                setCurrentQuestion(continueQ);
                setQuestionIndex(prev => prev + 1);
                setConversation(prev => [...prev, {
                    role: 'interviewer',
                    content: continueQ,
                    timestamp: Date.now(),
                }]);
                setLoading(false);
                setMicOn(false); // Mic off while AI speaks
                // Speak feedback first, then the next question
                if (spokenFeedback) {
                    await speakInterviewerText(spokenFeedback);
                    // Brief pause between feedback and next question
                    await new Promise(r => setTimeout(r, 1000));
                }
                // Natural thinking delay — makes AI feel human (0.8–1.6s)
                const thinkDelay = 800 + Math.random() * 800;
                await new Promise(r => setTimeout(r, thinkDelay));
                await speakInterviewerText(continueQ);
                // Smooth handoff: brief pause then auto-enable mic
                await new Promise(r => setTimeout(r, 600));
                if (!isListeningRef.current) {
                    startVoiceRecording();
                    setMicOn(true);
                }
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
            const fallbackFeedback = 'That\'s a thoughtful response. Let me build on that.';
            const catchFollowUpFallbackByStage = {
                'DSA / Coding': 'Can you tell me about the time and space complexity of your solution?',
                'System Design': 'How would this design behave at 10x scale, and what would you change first?',
                'Behavioral': 'Can you share the specific action you took and what outcome it produced?',
                'Technical': pickTechnicalFollowUpFallback(questionIndex),
                'HR': 'Can you give one concrete example that shows this about you?',
            };
            const fallbackQ = catchFollowUpFallbackByStage[resolvedStage] || 'Can you tell me about the time and space complexity of your solution?';
            setConversation(prev => [...prev,
                {
                    role: 'feedback',
                    content: fallbackFeedback,
                    score: 70,
                    strengths: ['Clear communication'],
                    improvements: ['Add more detail'],
                    hint: '',
                    codeFeedback: null,
                    timestamp: Date.now(),
                },
                {
                    role: 'interviewer',
                    content: fallbackQ,
                    timestamp: Date.now(),
                },
            ]);
            setCurrentQuestion(fallbackQ);
            setQuestionIndex(prev => prev + 1);
            setLoading(false);
            setMicOn(false);
            await speakInterviewerText(fallbackFeedback);
            await new Promise(r => setTimeout(r, 800));
            await speakInterviewerText(fallbackQ);
            // Smooth handoff: brief pause then auto-enable mic
            await new Promise(r => setTimeout(r, 600));
            if (!isListeningRef.current) {
                startVoiceRecording();
                setMicOn(true);
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
            setInterviewerStatus('Take your time, no rush...');

            // Stage 2: After 10s total -> Ask to rephrase
            silenceStageTimerRef.current = setTimeout(() => {
                if (!isListeningRef.current || stateRefs.current.transcript.trim()) return;
                setSilenceStage(2);
                const rephraseText = "Would you like me to rephrase the question?";
                setInterviewerStatus(rephraseText);
                setConversation(prev => [...prev, { role: 'interviewer', content: rephraseText, timestamp: Date.now() }]);
                speakInterviewerText(rephraseText);

                // Stage 3: After 15s total -> Auto-skip
                silenceStageTimerRef.current = setTimeout(() => {
                    if (!isListeningRef.current || stateRefs.current.transcript.trim()) return;
                    setSilenceStage(3);
                    setInterviewerStatus('');
                    // Trigger auto skip
                    sendAnswer(true);
                }, 5000);
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

    // ── End Interview ──
    const endInterview = () => {
        clearInterval(timerRef.current);
        stopVoiceRecording();
        dgVoice.interrupt();
        if (ttsAudioRef.current) { ttsAudioRef.current.pause(); ttsAudioRef.current = null; }
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        setAiSpeaking(false);
        setPhase('summary');
    };

    // ── Toggle Mic (also controls STT) ──
    const toggleMic = () => {
        if (isListening) {
            // Currently listening — stop recording and process
            stopVoiceRecording();
            setMicOn(false);
        } else {
            // Not listening — start recording
            startVoiceRecording();
            setMicOn(true);
        }
    };

    // ── Dedicated voice record button for workspace input ──
    const handleVoiceInput = () => {
        if (isListening) {
            stopVoiceRecording();
        } else {
            startVoiceRecording();
            setMicOn(true);
        }
    };

    // ── Toggle Camera ──
    const toggleCamera = () => {
        if (cameraOn && streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
            if (videoRef.current) videoRef.current.srcObject = null;
        }
        setCameraOn(prev => !prev);
    };

    // ── User info ──
    const userName = user?.user_metadata?.full_name || 'Panchanan Sahoo';
    const userInitial = userName[0]?.toUpperCase() || 'P';

    // ── Workspace dropdown options ──
    const workspaceOptions = [
        { id: 'code', label: 'Code Editor', icon: <Code2 size={14} /> },
        { id: 'design', label: 'Design Canvas', icon: <Palette size={14} /> },
        { id: 'notes', label: 'Notes', icon: <FileText size={14} /> },
    ];

    // ═══════════════════════════════════
    //  LOBBY PHASE — Multi-Step Setup Wizard
    // ═══════════════════════════════════

    const TOPIC_PILLS = [
        { id: 'hr', label: 'HR Round' },
        { id: 'technical', label: 'Technical Round' },
    ];

    const SETUP_STEPS = [
        'Experience',
        'Interview Type',
        'Resume',
        'Target Role',
        'Company',
        'Start',
    ];

    const STEP_DESCRIPTIONS = [
        'Are you a fresher or an experienced professional?',
        'Choose the type of interview you want to practice',
        'Upload your resume for personalized questions',
        'Enter your target role for tailored preparation',
        'Choose the target company for your interview',
        'Review your setup and start your interview',
    ];

    const COMPANIES = [
        { name: 'Google', industry: 'Technology', icon: '🔍', category: 'faang', starred: true },
        { name: 'Apple', industry: 'Technology', icon: '🍎', category: 'faang' },
        { name: 'Meta', industry: 'Social Media', icon: '📘', category: 'faang' },
        { name: 'Amazon', industry: 'E-Commerce', icon: '📦', category: 'faang' },
        { name: 'Netflix', industry: 'Entertainment', icon: '🎬', category: 'faang' },
        { name: 'Microsoft', industry: 'Technology', icon: '🪟', category: 'faang' },
        { name: 'Infosys', industry: 'IT Services', icon: '💼', category: 'indian' },
        { name: 'TCS', industry: 'IT Services', icon: '🏢', category: 'indian' },
        { name: 'Wipro', industry: 'IT Services', icon: '🔧', category: 'indian' },
        { name: 'Flipkart', industry: 'E-Commerce', icon: '🛒', category: 'indian' },
        { name: 'Razorpay', industry: 'Fintech', icon: '💳', category: 'indian' },
        { name: 'Swiggy', industry: 'Food Delivery', icon: '🍔', category: 'indian' },
        { name: 'Zomato', industry: 'Food Delivery', icon: '🍕', category: 'indian' },
        { name: 'Paytm', industry: 'Fintech', icon: '💰', category: 'indian' },
        { name: 'Meesho', industry: 'E-Commerce', icon: '🛍️', category: 'indian' },
        { name: 'Dream11', industry: 'Gaming', icon: '🎮', category: 'indian' },
        { name: 'PhonePe', industry: 'Fintech', icon: '📱', category: 'indian' },
        { name: 'CRED', industry: 'Fintech', icon: '💎', category: 'indian' },
        { name: 'Spotify', industry: 'Music', icon: '🎵', category: 'global' },
        { name: 'Airbnb', industry: 'Travel', icon: '🏠', category: 'global' },
        { name: 'Uber', industry: 'Transport', icon: '🚗', category: 'global' },
        { name: 'Stripe', industry: 'Fintech', icon: '💳', category: 'global' },
        { name: 'Salesforce', industry: 'CRM', icon: '☁️', category: 'global' },
        { name: 'Adobe', industry: 'Software', icon: '🎨', category: 'global' },
        { name: 'Oracle', industry: 'Database', icon: '🗄️', category: 'global' },
        { name: 'IBM', industry: 'Technology', icon: '💻', category: 'global' },
        { name: 'Twitter / X', industry: 'Social Media', icon: '🐦', category: 'global' },
        { name: 'LinkedIn', industry: 'Professional', icon: '🔗', category: 'global' },
        { name: 'Nvidia', industry: 'Hardware', icon: '🟢', category: 'global' },
        { name: 'Tesla', industry: 'Automotive', icon: '⚡', category: 'global' },
    ];

    const SUGGESTED_COMPANIES = ['Amazon', 'Google', 'Netflix', 'Spotify', 'Airbnb'];

    const COMPANY_TABS = [
        { id: 'all', label: `All (${COMPANIES.length})` },
        { id: 'faang', label: `FAANG (${COMPANIES.filter(c => c.category === 'faang').length})` },
        { id: 'indian', label: `Indian (${COMPANIES.filter(c => c.category === 'indian').length})` },
        { id: 'global', label: `Global (${COMPANIES.filter(c => c.category === 'global').length})` },
    ];

    const filteredCompanies = COMPANIES.filter(c => {
        const matchTab = companyTab === 'all' || c.category === companyTab;
        const matchSearch = !companySearch || c.name.toLowerCase().includes(companySearch.toLowerCase());
        return matchTab && matchSearch;
    });

    if (phase === 'lobby') {
        return (
            <div className="ai-interview-page">
                <div className="ai-setup-backdrop">
                    <div className="ai-setup-glow ai-setup-glow--purple" />
                    <div className="ai-setup-glow ai-setup-glow--blue" />

                    <div className="ai-setup-modal ai-setup-modal--wizard">
                        {/* Header */}
                        <div className="ai-setup-header">
                            <div>
                                <h1 className="ai-setup-title">Interview Setup</h1>
                                <p className="ai-setup-subtitle">{STEP_DESCRIPTIONS[setupStep]}</p>
                            </div>
                            <button className="ai-setup-close" onClick={() => navigate('/interview-suite')} title="Close">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Stepper */}
                        <div className="ai-wizard-stepper">
                            {SETUP_STEPS.map((step, i) => (
                                <React.Fragment key={i}>
                                    <div
                                        className={`ai-wizard-step ${i < setupStep ? 'completed' : ''} ${i === setupStep ? 'active' : ''}`}
                                        onClick={() => i <= setupStep && setSetupStep(i)}
                                    >
                                        {i < setupStep ? <CheckCircle size={22} /> : <span>{i + 1}</span>}
                                    </div>
                                    {i < SETUP_STEPS.length - 1 && (
                                        <div className={`ai-wizard-connector ${i < setupStep ? 'completed' : ''}`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Step Content */}
                        <div className="ai-wizard-content">

                            {/* ─── Step 0: Experience Level ─── */}
                            {setupStep === 0 && (
                                <div className="ai-wizard-step-body">
                                    <div className="ai-setup-experience-grid">
                                        <button
                                            className={`ai-setup-experience-card ${experienceLevel === 'fresher' ? 'selected' : ''}`}
                                            onClick={() => setExperienceLevel('fresher')}
                                        >
                                            <div className="ai-setup-experience-icon-wrap ai-setup-experience-icon--fresher">
                                                <GraduationCap size={32} />
                                            </div>
                                            <div className="ai-setup-experience-info">
                                                <span className="ai-setup-experience-title">Fresher</span>
                                                <span className="ai-setup-experience-desc">Fresh graduate or 0–1 years of experience. Questions focus on fundamentals, aptitude, and college projects.</span>
                                            </div>
                                            {experienceLevel === 'fresher' && <CheckCircle size={22} className="ai-setup-experience-check" />}
                                        </button>
                                        <button
                                            className={`ai-setup-experience-card ${experienceLevel === 'experienced' ? 'selected' : ''}`}
                                            onClick={() => setExperienceLevel('experienced')}
                                        >
                                            <div className="ai-setup-experience-icon-wrap ai-setup-experience-icon--experienced">
                                                <Briefcase size={32} />
                                            </div>
                                            <div className="ai-setup-experience-info">
                                                <span className="ai-setup-experience-title">Experienced</span>
                                                <span className="ai-setup-experience-desc">1+ years of industry experience. Questions focus on system design, leadership, and real-world problem solving.</span>
                                            </div>
                                            {experienceLevel === 'experienced' && <CheckCircle size={22} className="ai-setup-experience-check" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ─── Step 1: Interview Type ─── */}
                            {setupStep === 1 && (
                                <div className="ai-wizard-step-body">
                                    <div className="ai-setup-experience-grid">
                                        <button
                                            className={`ai-setup-experience-card ${interviewType === 'hr' ? 'selected' : ''}`}
                                            onClick={() => setInterviewType('hr')}
                                        >
                                            <div className="ai-setup-experience-icon-wrap ai-setup-experience-icon--fresher">
                                                <MessageSquare size={32} />
                                            </div>
                                            <div className="ai-setup-experience-info">
                                                <span className="ai-setup-experience-title">HR Round</span>
                                                <span className="ai-setup-experience-desc">Behavioral and situational questions. Focus on culture fit, teamwork, and leadership.</span>
                                            </div>
                                            {interviewType === 'hr' && <CheckCircle size={22} className="ai-setup-experience-check" />}
                                        </button>
                                        <button
                                            className={`ai-setup-experience-card ${interviewType === 'technical' ? 'selected' : ''}`}
                                            onClick={() => setInterviewType('technical')}
                                        >
                                            <div className="ai-setup-experience-icon-wrap ai-setup-experience-icon--experienced">
                                                <Code2 size={32} />
                                            </div>
                                            <div className="ai-setup-experience-info">
                                                <span className="ai-setup-experience-title">Technical Round</span>
                                                <span className="ai-setup-experience-desc">Core technical skills, data structures, algorithms, and system design concepts.</span>
                                            </div>
                                            {interviewType === 'technical' && <CheckCircle size={22} className="ai-setup-experience-check" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ─── Step 1: Resume Upload ─── */}
                            {setupStep === 2 && (
                                <div className="ai-wizard-step-body">
                                    <div className="ai-setup-resume-section ai-setup-resume-section--open">
                                        <div className="ai-setup-resume-toggle" style={{ pointerEvents: 'none' }}>
                                            <div className="ai-setup-resume-left">
                                                <div className="ai-setup-resume-icon">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <div className="ai-setup-resume-title">
                                                        Add your resume
                                                        <span className="ai-setup-badge-rec">recommended</span>
                                                    </div>
                                                    <div className="ai-setup-resume-desc">
                                                        Personalizes questions to your background & projects
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ai-setup-resume-body expanded">
                                            <div
                                                className={`ai-setup-drop-zone ${resumeFile ? 'has-file' : ''}`}
                                                onClick={() => document.getElementById('resume-file-input')?.click()}
                                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                                                onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); }}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    e.currentTarget.classList.remove('drag-over');
                                                    if (e.dataTransfer.files.length > 0) setResumeFile(e.dataTransfer.files[0]);
                                                }}
                                            >
                                                {resumeFile ? (
                                                    <>
                                                        <CheckCircle size={28} className="ai-setup-drop-icon" style={{ color: '#22c55e' }} />
                                                        <p className="ai-setup-drop-text" style={{ color: '#22c55e' }}>{resumeFile.name}</p>
                                                        <p className="ai-setup-drop-hint">Click to replace</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FileText size={28} className="ai-setup-drop-icon" />
                                                        <p className="ai-setup-drop-text">Drop your resume here or <span>browse files</span></p>
                                                        <p className="ai-setup-drop-hint">PDF, DOCX up to 5MB</p>
                                                    </>
                                                )}
                                                <input
                                                    id="resume-file-input"
                                                    type="file"
                                                    accept=".pdf,.doc,.docx"
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => {
                                                        if (e.target.files?.[0]) setResumeFile(e.target.files[0]);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ─── Step 2: Target Role ─── */}
                            {setupStep === 3 && (
                                <div className="ai-wizard-step-body">
                                    <div className="ai-wizard-field">
                                        <label className="ai-wizard-label">
                                            <span className="ai-wizard-label-dot" />
                                            Target Role
                                            <span className="ai-wizard-label-optional">(optional but Recommended)</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="ai-wizard-input"
                                            placeholder="e.g. Senior Software Engineer, Backend Developer, Data Scientist..."
                                            value={targetRole}
                                            onChange={(e) => setTargetRole(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ─── Step 3: Company & Interviewer Preference ─── */}
                            {setupStep === 4 && (
                                <div className="ai-wizard-step-body">
                                    {/* Gender Preference */}
                                    <div className="ai-wizard-gender-picker">
                                        <span className="ai-wizard-gender-label">Interviewer Preference</span>
                                        <div className="ai-wizard-gender-toggle">
                                            <button
                                                className={`ai-wizard-gender-btn ${interviewerGender === 'male' ? 'selected' : ''}`}
                                                onClick={() => setInterviewerGender('male')}
                                            >
                                                <span className="ai-wizard-gender-emoji">👨‍💼</span>
                                                Male
                                            </button>
                                            <button
                                                className={`ai-wizard-gender-btn ${interviewerGender === 'female' ? 'selected' : ''}`}
                                                onClick={() => setInterviewerGender('female')}
                                            >
                                                <span className="ai-wizard-gender-emoji">👩‍💼</span>
                                                Female
                                            </button>
                                        </div>
                                    </div>

                                    {/* Suggested pills */}
                                    <div className="ai-wizard-suggested">
                                        <span className="ai-wizard-suggested-label">Suggested for this problem</span>
                                        <div className="ai-wizard-suggested-pills">
                                            {SUGGESTED_COMPANIES.map((name) => (
                                                <button
                                                    key={name}
                                                    className={`ai-wizard-company-pill ${targetCompany === name ? 'selected' : ''}`}
                                                    onClick={() => setTargetCompany(name)}
                                                >
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Search */}
                                    <div className="ai-wizard-search">
                                        <Search size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search companies..."
                                            value={companySearch}
                                            onChange={(e) => setCompanySearch(e.target.value)}
                                        />
                                    </div>

                                    {/* Tabs */}
                                    <div className="ai-wizard-tabs">
                                        {COMPANY_TABS.map((tab) => (
                                            <button
                                                key={tab.id}
                                                className={`ai-wizard-tab ${companyTab === tab.id ? 'active' : ''}`}
                                                onClick={() => setCompanyTab(tab.id)}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Company grid */}
                                    <div className="ai-wizard-company-grid">
                                        {filteredCompanies.map((company) => (
                                            <button
                                                key={company.name}
                                                className={`ai-wizard-company-card ${targetCompany === company.name ? 'selected' : ''}`}
                                                onClick={() => setTargetCompany(company.name)}
                                            >
                                                <div className="ai-wizard-company-top">
                                                    <span className="ai-wizard-company-icon">{company.icon}</span>
                                                    <span className="ai-wizard-company-name">{company.name}</span>
                                                    {company.starred && <Star size={14} className="ai-wizard-company-star" />}
                                                </div>
                                                <span className="ai-wizard-company-industry">{company.industry}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ─── Step 4: Review & Start ─── */}
                            {setupStep === 5 && (
                                <div className="ai-wizard-step-body">
                                    <div className="ai-wizard-review">
                                        <div className="ai-wizard-review-row">
                                            <span className="ai-wizard-review-label">Experience</span>
                                            <span className="ai-wizard-review-value">
                                                {experienceLevel === 'fresher' ? '🎓 Fresher' : '💼 Experienced'}
                                            </span>
                                        </div>
                                        <div className="ai-wizard-review-row">
                                            <span className="ai-wizard-review-label">Interview Type</span>
                                            <span className="ai-wizard-review-value">
                                                {TOPIC_PILLS.find(t => t.id === interviewType)?.label || 'Technical Round'}
                                            </span>
                                        </div>
                                        <div className="ai-wizard-review-row">
                                            <span className="ai-wizard-review-label">Resume</span>
                                            <span className="ai-wizard-review-value">
                                                {resumeFile ? resumeFile.name : '—  Not uploaded'}
                                            </span>
                                        </div>
                                        <div className="ai-wizard-review-row">
                                            <span className="ai-wizard-review-label">Target Role</span>
                                            <span className="ai-wizard-review-value">
                                                {targetRole || '—  Not specified'}
                                            </span>
                                        </div>
                                        <div className="ai-wizard-review-row">
                                            <span className="ai-wizard-review-label">Target Company</span>
                                            <span className="ai-wizard-review-value">
                                                {targetCompany || '—  Not specified'}
                                            </span>
                                        </div>
                                        <div className="ai-wizard-review-row">
                                            <span className="ai-wizard-review-label">Interviewer</span>
                                            <span className="ai-wizard-review-value">
                                                {interviewerGender === 'male' ? '👨‍💼' : '👩‍💼'} {INTERVIEWER.name} · {INTERVIEWER.role}
                                            </span>
                                        </div>
                                        <div className="ai-wizard-review-row" style={{ borderTop: '1px solid rgba(139,92,246,0.15)', paddingTop: 12, marginTop: 8 }}>
                                            <span className="ai-wizard-review-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Zap size={14} style={{ color: '#a78bfa' }} /> Real-Time Voice
                                                <span style={{ fontSize: '0.65rem', background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', padding: '2px 6px', borderRadius: 4, color: '#fff', fontWeight: 600, letterSpacing: '0.5px' }}>BETA</span>
                                            </span>
                                            <button
                                                onClick={() => setRealtimeMode(m => !m)}
                                                style={{
                                                    position: 'relative',
                                                    width: 44, height: 24, borderRadius: 12, border: 'none',
                                                    background: realtimeMode ? 'linear-gradient(135deg, #8b5cf6, #06b6d4)' : 'rgba(100,116,139,0.3)',
                                                    cursor: 'pointer', transition: 'background 0.2s',
                                                }}
                                            >
                                                <div style={{
                                                    position: 'absolute', top: 2, left: realtimeMode ? 22 : 2,
                                                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                                                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                                }} />
                                            </button>
                                        </div>
                                        {realtimeMode && (
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', padding: '8px 0 0 0', lineHeight: 1.5 }}>
                                                ⚡ Deepgram STT + Kokoro TTS — ultra-low latency, 100% Node.js. No Python required.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Bar */}
                        <div className="ai-wizard-nav">
                            <button
                                className="ai-wizard-nav-btn ai-wizard-nav-btn--back"
                                onClick={() => setSetupStep(s => Math.max(0, s - 1))}
                                disabled={setupStep === 0}
                            >
                                <ArrowLeft size={16} /> Back
                            </button>
                            <div className="ai-wizard-nav-right">
                                {setupStep < 5 && (
                                    <button
                                        className="ai-wizard-nav-btn ai-wizard-nav-btn--skip"
                                        onClick={() => setSetupStep(s => Math.min(5, s + 1))}
                                    >
                                        Skip
                                    </button>
                                )}
                                {setupStep < 5 ? (
                                    <button
                                        className="ai-wizard-nav-btn ai-wizard-nav-btn--next"
                                        onClick={() => setSetupStep(s => Math.min(5, s + 1))}
                                    >
                                        Next <ArrowRight size={16} />
                                    </button>
                                ) : (
                                    <button
                                        className="ai-wizard-nav-btn ai-wizard-nav-btn--next ai-setup-start-btn"
                                        onClick={startInterview}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Sparkles size={18} className="ai-setup-spin" />
                                                Connecting...
                                            </>
                                        ) : (
                                            <>Start Interview <ArrowRight size={16} /></>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        <p className="ai-setup-privacy">
                            🔒 Your data is encrypted and never shared. Sessions are private.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════
    //  CONNECTING PHASE — Matchmaking animation
    // ═══════════════════════════════════
    if (phase === 'connecting') {
        return (
            <div className="ai-interview-page">
                <div className="ai-connect-backdrop">
                    {/* Ambient glow effects */}
                    <div className="ai-connect-glow ai-connect-glow--left" />
                    <div className="ai-connect-glow ai-connect-glow--right" />

                    <div className="ai-connect-container">
                        {/* Title */}
                        <div className="ai-connect-status-text">
                            <Wifi size={18} className="ai-connect-wifi-icon" />
                            Connecting you to your interviewer…
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
                        <p className="ai-connect-hint">Setting up your personalized session…</p>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════
    //  SUMMARY PHASE — Results & Analysis
    // ═══════════════════════════════════
    if (phase === 'summary') {
        const a = analysisResult; // shorthand

        // Show loading state during AI analysis
        if (analysisLoading && !a) {
            return (
                <div className="ai-interview-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '24px' }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        border: '3px solid rgba(139,92,246,0.2)',
                        borderTopColor: '#8b5cf6',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <div style={{ color: '#e2e8f0', fontSize: '1.15rem', fontWeight: 600 }}>Analyzing your interview with AI...</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>This may take a few seconds</div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
            );
        }

        return (
            <div className="ai-interview-page">
                <header className="ai-topbar">
                    <div className="ai-topbar-left">
                        <div className="ai-breadcrumb">
                            <span className="ai-breadcrumb-link" onClick={() => navigate('/interview-suite')}>← Interview Suite</span>
                            <ChevronRight size={12} className="ai-breadcrumb-sep" />
                            <span className="ai-breadcrumb-current">Session Results</span>
                        </div>
                    </div>
                    <div className="ai-topbar-center">
                        <div className="ai-mode-badge" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                            <CheckCircle size={12} />
                            Complete
                        </div>
                    </div>
                    <div className="ai-topbar-right">
                        <button className="ai-result-action-btn" onClick={() => navigate('/interview-history')}>
                            <Clock size={14} /> History
                        </button>
                        <button className="ai-result-action-btn">
                            <Share2 size={14} /> Share
                        </button>
                        <button className="ai-result-action-btn ai-result-action-btn--primary">
                            <Download size={14} /> Export
                        </button>
                    </div>
                </header>

                <div className="ai-result-page">
                    {/* ── Hero Section ── */}
                    <div className="ai-result-hero">
                        <div className="ai-result-hero-left">
                            <div className="ai-result-label">Interview Feedback</div>
                            <h1 className="ai-result-title">
                                  {interviewType === 'hr' ? 'HR Round' :
                                   interviewType === 'technical' ? 'Technical Round' :
                                   'General'} Interview
                            </h1>
                            <div className="ai-result-meta">
                                <span><Building2 size={13} /> {INTERVIEWER.company}</span>
                                <span><User size={13} /> {INTERVIEWER.name}</span>
                                <span><Clock size={13} /> {a?.stats?.duration || '00:00'}</span>
                            </div>
                        </div>
                        <div className="ai-result-hero-right">
                            <div className="ai-result-score-ring">
                                <svg viewBox="0 0 120 120" className="ai-result-score-svg">
                                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                                    <circle cx="60" cy="60" r="52"
                                        fill="none"
                                        stroke={a?.performanceColor || '#8b5cf6'}
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeDasharray={`${(a?.overallScore || 0) / 10 * 327} 327`}
                                        transform="rotate(-90 60 60)"
                                        className="ai-result-score-circle"
                                    />
                                </svg>
                                <div className="ai-result-score-value">
                                    <span className="ai-result-score-num" style={{ color: a?.performanceColor }}>{a?.overallScore || '—'}</span>
                                    <span className="ai-result-score-of">/10</span>
                                </div>
                            </div>
                            <div className="ai-result-verdict" style={{ background: `${a?.performanceColor}18`, color: a?.performanceColor, borderColor: `${a?.performanceColor}40` }}>
                                {a?.overallScore >= 7 ? <Trophy size={14} /> : a?.overallScore >= 5 ? <TrendingUp size={14} /> : <AlertTriangle size={14} />}
                                {a?.performanceLabel || 'Analyzing...'}
                            </div>
                            {a?.aiGenerated && (
                                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: '#8b5cf6', opacity: 0.85 }}>
                                    <Sparkles size={11} /> AI-Analyzed by Groq
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── AI Summary ── */}
                    {a?.summary && (
                        <div style={{
                            background: 'rgba(139,92,246,0.06)',
                            border: '1px solid rgba(139,92,246,0.15)',
                            borderRadius: 12, padding: '16px 20px', marginBottom: 20,
                            color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.6
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#e2e8f0', fontWeight: 600, fontSize: '0.85rem' }}>
                                <Brain size={14} style={{ color: '#8b5cf6' }} /> AI Summary
                            </div>
                            {a.summary}
                        </div>
                    )}

                    {/* ── Quick Stats ── */}
                    <div className="ai-result-stats-row">
                        <div className="ai-result-stat">
                            <div className="ai-result-stat-icon"><Award size={18} /></div>
                            <div className="ai-result-stat-info">
                                <div className="ai-result-stat-label">Performance</div>
                                <div className="ai-result-stat-value">{a?.performanceLabel || '—'}</div>
                            </div>
                        </div>
                        <div className="ai-result-stat">
                            <div className="ai-result-stat-icon" style={{ background: 'rgba(34,211,238,0.1)', color: '#22d3ee' }}><BarChart3 size={18} /></div>
                            <div className="ai-result-stat-info">
                                <div className="ai-result-stat-label">Category</div>
                                <div className="ai-result-stat-value">{interviewType}</div>
                            </div>
                        </div>
                        <div className="ai-result-stat">
                            <div className="ai-result-stat-icon" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}><Star size={18} /></div>
                            <div className="ai-result-stat-info">
                                <div className="ai-result-stat-label">Key Moments</div>
                                <div className="ai-result-stat-value">{a?.keyMoments?.length || 0}</div>
                            </div>
                        </div>
                        <div className="ai-result-stat">
                            <div className="ai-result-stat-icon" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}><Gauge size={18} /></div>
                            <div className="ai-result-stat-info">
                                <div className="ai-result-stat-label">Categories</div>
                                <div className="ai-result-stat-value">{a?.categories?.length || 0}</div>
                            </div>
                        </div>
                    </div>

                    {/* ── Tabs ── */}
                    <div className="ai-result-tabs">
                        {[
                            { id: 'overview', label: 'Overview', icon: TrendingUp },
                            { id: 'analysis', label: 'Detailed Analysis', icon: BarChart3 },
                            { id: 'moments', label: 'Key Moments', icon: Star },
                            { id: 'session', label: 'Session Details', icon: FileText },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                className={`ai-result-tab ${resultTab === tab.id ? 'ai-result-tab--active' : ''}`}
                                onClick={() => setResultTab(tab.id)}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ── Tab Content ── */}
                    <div className="ai-result-content">
                        {/* OVERVIEW TAB */}
                        {resultTab === 'overview' && a && (
                            <div className="ai-result-overview">
                                {/* Category Scores */}
                                <div className="ai-result-card">
                                    <h3 className="ai-result-card-title"><Target size={16} /> Competency Breakdown</h3>
                                    <div className="ai-result-categories">
                                        {a.categories.map((cat, i) => (
                                            <div key={i} className="ai-result-cat">
                                                <div className="ai-result-cat-header">
                                                    <div className="ai-result-cat-label">
                                                        <cat.icon size={14} style={{ color: cat.color }} />
                                                        {cat.name}
                                                    </div>
                                                    <span className="ai-result-cat-score" style={{ color: cat.color }}>{cat.score}/10</span>
                                                </div>
                                                <div className="ai-result-cat-bar">
                                                    <div className="ai-result-cat-fill" style={{ width: `${cat.score * 10}%`, background: cat.color }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Strengths & Improvements */}
                                <div className="ai-result-two-col">
                                    <div className="ai-result-card ai-result-card--green">
                                        <h3 className="ai-result-card-title"><ThumbsUp size={16} style={{ color: '#22c55e' }} /> Strengths</h3>
                                        <ul className="ai-result-list">
                                            {a.strengths.map((s, i) => (
                                                <li key={i}><CheckCircle size={14} className="ai-result-list-icon ai-result-list-icon--green" /> {s}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="ai-result-card ai-result-card--amber">
                                        <h3 className="ai-result-card-title"><Lightbulb size={16} style={{ color: '#f59e0b' }} /> Areas to Improve</h3>
                                        <ul className="ai-result-list">
                                            {a.improvements.map((s, i) => (
                                                <li key={i}><AlertTriangle size={14} className="ai-result-list-icon ai-result-list-icon--amber" /> {s}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DETAILED ANALYSIS TAB */}
                        {resultTab === 'analysis' && a && (
                            <div className="ai-result-analysis">
                                <div className="ai-result-card">
                                    <h3 className="ai-result-card-title"><Brain size={16} /> AI Analysis Summary</h3>
                                    <p className="ai-result-analysis-text">
                                        Based on your {a.stats.questionsAnswered} questions answered across {a.stats.duration} of interview time,
                                        here is a detailed breakdown of your performance across each competency area.
                                        Your strongest area was <strong>{a.categories.reduce((a, b) => a.score > b.score ? a : b).name}</strong> with
                                        a score of {a.categories.reduce((a, b) => a.score > b.score ? a : b).score}/10.
                                    </p>
                                </div>
                                {a.categories.map((cat, i) => (
                                    <div key={i} className="ai-result-card">
                                        <div className="ai-result-analysis-cat-header">
                                            <div className="ai-result-cat-label">
                                                <cat.icon size={18} style={{ color: cat.color }} />
                                                <strong>{cat.name}</strong>
                                            </div>
                                            <div className="ai-result-analysis-score" style={{ color: cat.color }}>
                                                {cat.score}/10
                                            </div>
                                        </div>
                                        <div className="ai-result-cat-bar" style={{ marginTop: 12 }}>
                                            <div className="ai-result-cat-fill" style={{ width: `${cat.score * 10}%`, background: cat.color }} />
                                        </div>
                                        <p className="ai-result-analysis-detail">
                                            {cat.detail || (cat.score >= 7
                                                ? `Excellent performance in ${cat.name.toLowerCase()}. You demonstrated strong competency and clear understanding.`
                                                : cat.score >= 5
                                                ? `Solid foundation in ${cat.name.toLowerCase()}. Consider deepening your knowledge in edge cases and advanced patterns.`
                                                : `Focus on improving your ${cat.name.toLowerCase()} skills. Practice structured approaches and review fundamentals.`)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* KEY MOMENTS TAB */}
                        {resultTab === 'moments' && a && (
                            <div className="ai-result-moments">
                                {a.keyMoments.length === 0 ? (
                                    <div className="ai-result-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                                        <Star size={32} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: 12 }} />
                                        <p style={{ color: 'rgba(255,255,255,0.4)' }}>No key moments recorded for this session</p>
                                    </div>
                                ) : (
                                    a.keyMoments.map((moment, i) => (
                                        <div
                                            key={i}
                                            className={`ai-result-moment ${expandedMoment === i ? 'ai-result-moment--expanded' : ''}`}
                                            onClick={() => setExpandedMoment(expandedMoment === i ? null : i)}
                                        >
                                            <div className="ai-result-moment-header">
                                                <div className="ai-result-moment-left">
                                                    <div className={`ai-result-moment-icon ai-result-moment-icon--${moment.type}`}>
                                                        {moment.type === 'question' ? <MessageSquare size={14} /> : <ThumbsUp size={14} />}
                                                    </div>
                                                    <div className="ai-result-moment-info">
                                                        <div className="ai-result-moment-type">{moment.type === 'question' ? 'Question Asked' : 'Strong Response'}</div>
                                                        <div className="ai-result-moment-time"><Timer size={11} /> {moment.time}</div>
                                                    </div>
                                                </div>
                                                {expandedMoment === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </div>
                                            {expandedMoment === i && (
                                                <div className="ai-result-moment-body">{moment.text}</div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* SESSION DETAILS TAB */}
                        {resultTab === 'session' && a && (
                            <div className="ai-result-session">
                                <div className="ai-result-card">
                                    <h3 className="ai-result-card-title"><FileText size={16} /> Session Info</h3>
                                    <div className="ai-result-session-grid">
                                        <div className="ai-result-session-item">
                                            <Clock size={16} />
                                            <div>
                                                <div className="ai-result-session-label">Duration</div>
                                                <div className="ai-result-session-value">{a.stats.duration}</div>
                                            </div>
                                        </div>
                                        <div className="ai-result-session-item">
                                            <MessageSquare size={16} />
                                            <div>
                                                <div className="ai-result-session-label">Questions</div>
                                                <div className="ai-result-session-value">{a.stats.questionsAnswered}</div>
                                            </div>
                                        </div>
                                        <div className="ai-result-session-item">
                                            <Code2 size={16} />
                                            <div>
                                                <div className="ai-result-session-label">Lines of Code</div>
                                                <div className="ai-result-session-value">{a.stats.linesOfCode}</div>
                                            </div>
                                        </div>
                                        <div className="ai-result-session-item">
                                            <Zap size={16} />
                                            <div>
                                                <div className="ai-result-session-label">Language</div>
                                                <div className="ai-result-session-value">{a.stats.language}</div>
                                            </div>
                                        </div>
                                        <div className="ai-result-session-item">
                                            <User size={16} />
                                            <div>
                                                <div className="ai-result-session-label">Interviewer</div>
                                                <div className="ai-result-session-value">{INTERVIEWER.name}</div>
                                            </div>
                                        </div>
                                        <div className="ai-result-session-item">
                                            <Building2 size={16} />
                                            <div>
                                                <div className="ai-result-session-label">Company</div>
                                                <div className="ai-result-session-value">{INTERVIEWER.company}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Conversation Transcript */}
                                <div className="ai-result-card">
                                    <h3 className="ai-result-card-title"><Eye size={16} /> Conversation Transcript</h3>
                                    <div className="ai-result-transcript">
                                        {conversation.length === 0 ? (
                                            <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 24 }}>No conversation data available</p>
                                        ) : (
                                            conversation.map((msg, i) => (
                                                <div key={i} className={`ai-result-transcript-msg ai-result-transcript-msg--${msg.role}`}>
                                                    <div className="ai-result-transcript-role">
                                                        {msg.role === 'interviewer' ? <Sparkles size={12} /> : <User size={12} />}
                                                        {msg.role === 'interviewer' ? INTERVIEWER.name : 'You'}
                                                    </div>
                                                    <div className="ai-result-transcript-text">{msg.content || msg.text}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── AI Next Steps ── */}
                    {a?.nextSteps && a.nextSteps.length > 0 && (
                        <div style={{
                            background: 'rgba(34,197,94,0.04)',
                            border: '1px solid rgba(34,197,94,0.12)',
                            borderRadius: 12, padding: '16px 20px', marginBottom: 20, marginTop: 8,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#22c55e', fontWeight: 600, fontSize: '0.9rem' }}>
                                <Target size={15} /> Recommended Next Steps
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {a.nextSteps.map((step, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 10,
                                        padding: '10px 14px', borderRadius: 8,
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.04)',
                                        color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.5,
                                    }}>
                                        <span style={{
                                            minWidth: 22, height: 22, borderRadius: '50%',
                                            background: 'rgba(34,197,94,0.15)', color: '#22c55e',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.72rem', fontWeight: 700, flexShrink: 0, marginTop: 1,
                                        }}>{i + 1}</span>
                                        {step}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Bottom Actions ── */}
                    <div className="ai-result-actions">
                        <button className="ai-result-cta" onClick={() => { setPhase('lobby'); setSetupStep(0); setElapsed(0); setConversation([]); setQuestionIndex(0); setResultTab('overview'); setAnalysisResult(null); setInterviewerGender('female'); setExperienceLevel('fresher'); }}>
                            <RefreshCw size={16} /> Start New Interview
                        </button>
                        <button className="ai-result-cta ai-result-cta--secondary" onClick={() => navigate('/interview-suite')}>
                            <ArrowLeft size={16} /> Back to Interview Suite
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════
    //  INTERVIEW PHASE — Real Video Call
    // ═══════════════════════════════════
    return (
        <div className="ai-interview-page ai-interview-page--videocall">
            {/* ── Minimal Top Bar ── */}
            <header className="ai-vc-topbar">
                <div className="ai-vc-topbar-left">
                    <div className="ai-vc-logo" onClick={() => navigate('/interview-suite')}>
                        <Sparkles size={16} />
                        <span>PrepLoop</span>
                    </div>
                    <div className="ai-vc-separator" />
                    <div className="ai-mode-badge">
                        🔒 Interview Mode
                    </div>
                </div>
                <div className="ai-vc-topbar-center">
                    <div className="ai-vc-timer">
                        <div className="ai-vc-timer-dot" />
                        <Clock size={13} />
                        {formatTime(Math.max(0, 1200 - elapsed))}
                    </div>
                    <div className="ai-vc-progress">
                        {Array.from({ length: totalQuestions }).map((_, i) => (
                            <div
                                key={i}
                                className={`ai-vc-progress-pip ${i < questionIndex - 1 ? 'done' : i === questionIndex - 1 ? 'active' : ''}`}
                            />
                        ))}
                        <span className="ai-vc-progress-label">Q{questionIndex}/{totalQuestions}</span>
                    </div>
                </div>
                <div className="ai-vc-topbar-right">
                    <button
                        className="ai-vc-panel-toggle"
                        onClick={() => setWorkspacePanelOpen(p => !p)}
                        title={workspacePanelOpen ? 'Hide workspace' : 'Show workspace'}
                    >
                        {workspacePanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                        <span>{workspacePanelOpen ? 'Hide Panel' : 'Show Panel'}</span>
                    </button>
                    <button className="ai-vc-end-btn" onClick={endInterview}>
                        <Phone size={14} style={{ transform: 'rotate(135deg)' }} />
                        End Interview
                    </button>
                </div>
            </header>

            {/* ── Main Video Call Layout ── */}
            <div className="ai-vc-body">
                {/* === LEFT: Video Call Area === */}
                <div className={`ai-vc-video-area ${!workspacePanelOpen ? 'ai-vc-video-area--full' : ''}`}>
                    {/* AI Interviewer – Large Video Tile */}
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
                                onLoadedMetadata={() => handleInterviewerLoadedMetadata('speaking')}
                                onTimeUpdate={() => handleInterviewerTimeUpdate('speaking')}
                                onCanPlay={() => handleInterviewerCanPlay('speaking')}
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
                                onLoadedMetadata={() => handleInterviewerLoadedMetadata('listening')}
                                onTimeUpdate={() => handleInterviewerTimeUpdate('listening')}
                                onCanPlay={() => handleInterviewerCanPlay('listening')}
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
                                                height: `${6 + (dgVoice.outputBars?.[i * 2] || 0) * 18}px`,
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
                            <span className="ai-vc-tile-badge-role">{INTERVIEWER.role} · {INTERVIEWER.company}</span>
                        </div>
                        {/* Speaking wave overlay — Deepgram real-time waveform */}
                        {aiSpeaking ? (
                            <div className="ai-vc-wave-overlay" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 12px 10px' }}>
                                <VoiceWaveform
                                    bars={dgVoice.outputBars}
                                    active={dgVoice.outputActive}
                                    color="#a78bfa"
                                    height={36}
                                />
                            </div>
                        ) : (isListening && (
                            <div className="ai-vc-wave-overlay" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 12px 10px' }}>
                                <VoiceWaveform
                                    bars={dgVoice.inputBars}
                                    active={dgVoice.inputActive}
                                    color="#34d399"
                                    height={36}
                                />
                            </div>
                        ))}

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
                            ) : null}
                        </div>
                    </div>

                    {/* User Camera – PIP (Picture-in-Picture) */}
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

                    {/* ── Live Captions Overlay ── */}
                    {captionsOn && (() => {
                        const lastMsg = [...conversation].reverse().find(m => m.role === 'interviewer' || m.role === 'candidate' || m.role === 'feedback');
                        const currentSpeech = aiSpeaking
                            ? (conversation.filter(m => m.role === 'interviewer' || m.role === 'feedback').slice(-1)[0]?.content || 'Thinking...')
                            : lastMsg?.content;
                        const speakerName = aiSpeaking
                            ? INTERVIEWER.name
                            : lastMsg?.role === 'interviewer'
                                ? INTERVIEWER.name
                                : lastMsg?.role === 'feedback'
                                    ? `${INTERVIEWER.name} (Feedback)`
                                    : lastMsg?.role === 'candidate'
                                        ? 'You'
                                        : null;
                        if (!speakerName) return null;

                        // Word-by-word animation (Phase 3)
                        const displayText = currentSpeech && currentSpeech.length > 200
                            ? '...' + currentSpeech.slice(-200)
                            : currentSpeech || '';
                        const words = displayText.split(/\s+/).filter(Boolean);

                        return (
                            <div className="ai-vc-captions">
                                <div className="ai-vc-captions-inner">
                                    <span className={`ai-vc-captions-speaker ${aiSpeaking ? 'ai-vc-captions-speaker--ai' : ''}`}>
                                        {speakerName}:
                                    </span>
                                    <span className="ai-vc-captions-text">
                                        {words.map((word, i) => (
                                            <span
                                                key={`${word}-${i}`}
                                                className="ai-vc-caption-word"
                                                style={{ animationDelay: `${i * 0.06}s` }}
                                            >
                                                {word}{' '}
                                            </span>
                                        ))}
                                    </span>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Floating Controls Bar (Zoom/Meet style) */}
                    <div className="ai-vc-controls">
                        <div className="ai-vc-controls-group">
                            <button
                                className={`ai-vc-ctrl ${!micOn ? 'ai-vc-ctrl--off' : ''} ${isListening ? 'ai-vc-ctrl--listening' : ''}`}
                                onClick={toggleMic}
                                title={micOn ? (isListening ? 'Stop listening' : 'Mute') : 'Unmute & start listening'}
                            >
                                {micOn ? <Mic size={18} /> : <MicOff size={18} />}
                                <span className="ai-vc-ctrl-label">{isListening ? 'Listening...' : micOn ? 'Mic' : 'Muted'}</span>
                                {isListening && <span className="ai-vc-listening-dot" />}
                            </button>
                            <button
                                className={`ai-vc-ctrl ${!cameraOn ? 'ai-vc-ctrl--off' : ''}`}
                                onClick={toggleCamera}
                                title={cameraOn ? 'Turn off camera' : 'Turn on camera'}
                            >
                                {cameraOn ? <Video size={18} /> : <VideoOff size={18} />}
                                <span className="ai-vc-ctrl-label">{cameraOn ? 'Camera' : 'Off'}</span>
                            </button>
                            <button
                                className={`ai-vc-ctrl ${speakerMuted ? 'ai-vc-ctrl--off' : ''}`}
                                onClick={() => setSpeakerMuted(p => !p)}
                                title={speakerMuted ? 'Unmute speaker' : 'Mute speaker'}
                            >
                                {speakerMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                <span className="ai-vc-ctrl-label">{speakerMuted ? 'Speaker Off' : 'Speaker'}</span>
                            </button>
                        </div>
                        <div className="ai-vc-controls-divider" />
                        <div className="ai-vc-controls-group">
                            <button
                                className={`ai-vc-ctrl ${captionsOn ? 'ai-vc-ctrl--active' : ''}`}
                                onClick={() => setCaptionsOn(p => !p)}
                                title={captionsOn ? 'Turn off captions' : 'Turn on captions'}
                            >
                                {captionsOn ? <Captions size={18} /> : <CaptionsOff size={18} />}
                                <span className="ai-vc-ctrl-label">{captionsOn ? 'CC' : 'CC Off'}</span>
                            </button>
                            <button
                                className={`ai-vc-ctrl ${chatOpen ? 'ai-vc-ctrl--active' : ''}`}
                                onClick={() => setChatOpen(p => !p)}
                                title="Chat"
                            >
                                <MessageSquare size={18} />
                                <span className="ai-vc-ctrl-label">Chat</span>
                            </button>
                            <button
                                className={`ai-vc-ctrl ${bookmarked ? 'ai-vc-ctrl--active' : ''}`}
                                onClick={() => setBookmarked(p => !p)}
                                title="Bookmark"
                            >
                                <Bookmark size={18} />
                                <span className="ai-vc-ctrl-label">Bookmark</span>
                            </button>
                        </div>
                        <div className="ai-vc-controls-divider" />
                        <button className="ai-vc-ctrl ai-vc-ctrl--end" onClick={endInterview} title="End">
                            <Phone size={18} style={{ transform: 'rotate(135deg)' }} />
                            <span className="ai-vc-ctrl-label">End</span>
                        </button>
                    </div>
                </div>

                {/* === RIGHT: Workspace Panel (Collapsible) === */}
                {workspacePanelOpen && (
                    <div className="ai-vc-workspace">
                        {/* Workspace Dropdown Header */}
                        <div className="ai-vc-ws-header">
                            <div className="ai-vc-ws-dropdown" onClick={() => setWorkspaceDropdownOpen(p => !p)}>
                                <div className="ai-vc-ws-dropdown-selected">
                                    {activeTab === 'code' && <><Code2 size={14} /> Code Editor</>}
                                    {activeTab === 'design' && <><Palette size={14} /> Design Canvas</>}
                                    {activeTab === 'notes' && <><FileText size={14} /> Notes</>}
                                </div>
                                <ChevronDown size={14} className={`ai-vc-ws-chevron ${workspaceDropdownOpen ? 'ai-vc-ws-chevron--open' : ''}`} />
                            </div>
                            {workspaceDropdownOpen && (
                                <div className="ai-vc-ws-dropdown-menu">
                                    {workspaceOptions.map(opt => (
                                        <button
                                            key={opt.id}
                                            className={`ai-vc-ws-dropdown-item ${activeTab === opt.id ? 'active' : ''}`}
                                            onClick={() => { setActiveTab(opt.id); setWorkspaceDropdownOpen(false); }}
                                        >
                                            {opt.icon}
                                            {opt.label}
                                            {activeTab === opt.id && <CheckCircle size={12} className="ai-vc-ws-check" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="ai-vc-ws-header-right">
                                <div className="ai-live-sync">
                                    <span className="ai-live-sync-dot" />
                                    <Sparkles size={11} />
                                    Synced
                                </div>
                            </div>
                        </div>

                        {/* Workspace Content */}
                        <div className="ai-vc-ws-content">
                            {activeTab === 'code' && (
                                <div className="ai-vc-ws-editor">
                                    <div className="ai-editor-toolbar">
                                        <div className="ai-editor-toolbar-left">
                                            <div className="ai-lang-icon"><Code2 size={12} /></div>
                                            <select
                                                className="ai-lang-selector"
                                                value={language}
                                                onChange={(e) => handleLanguageChange(e.target.value)}
                                            >
                                                {LANGUAGES.map(lang => (
                                                    <option key={lang.id} value={lang.id}>
                                                        {lang.icon} {lang.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <button className="ai-reset-btn" onClick={handleReset}>
                                                <RotateCcw size={12} /> Reset
                                            </button>
                                        </div>
                                    </div>
                                    <div className="ai-editor-body">
                                        <Editor
                                            height="100%"
                                            language={language === 'cpp' ? 'cpp' : language}
                                            value={code}
                                            onChange={(value) => setCode(value || '')}
                                            theme="vs-dark"
                                            options={{
                                                fontSize: 13,
                                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                                minimap: { enabled: false },
                                                scrollBeyondLastLine: false,
                                                lineNumbers: 'on',
                                                wordWrap: 'on',
                                                tabSize: 4,
                                                automaticLayout: true,
                                                padding: { top: 12, bottom: 12 },
                                                suggestOnTriggerCharacters: true,
                                                bracketPairColorization: { enabled: true },
                                                smoothScrolling: true,
                                                cursorBlinking: 'smooth',
                                                cursorSmoothCaretAnimation: 'on',
                                                renderLineHighlight: 'all',
                                                lineHeight: 20,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'design' && (
                                <div className="ai-design-canvas">
                                    <Palette size={48} />
                                    <p>Design Canvas — coming soon</p>
                                    <p style={{ fontSize: 12, opacity: 0.5 }}>Draw system design diagrams here</p>
                                </div>
                            )}

                            {activeTab === 'notes' && (
                                <div className="ai-notes-panel">
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder={"Take notes during the interview...\n\n• Key points to mention\n• Edge cases to consider\n• Time/space complexity analysis"}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Voice transcript indicator */}
                        {isListening && transcript && (
                            <div style={{
                                padding: '6px 12px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                borderTop: '1px solid rgba(16, 185, 129, 0.2)',
                                fontSize: '12px',
                                color: '#10b981',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}>
                                <span style={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    background: '#10b981',
                                    animation: 'pulse 1.5s ease-in-out infinite',
                                    display: 'inline-block',
                                }} />
                                <span style={{ opacity: 0.8 }}>🎙️ "{transcript}"</span>
                            </div>
                        )}
                        {/* Text input for chat at bottom of workspace */}
                        <div className="ai-vc-ws-input">
                            <button
                                className={`ai-vc-ws-voice ${isListening ? 'ai-vc-ws-voice--active' : ''}`}
                                onClick={handleVoiceInput}
                                title={isListening ? 'Stop listening' : 'Speak your answer'}
                                style={{
                                    background: isListening ? '#ef4444' : 'rgba(255,255,255,0.08)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: isListening ? '#fff' : 'rgba(255,255,255,0.6)',
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                    flexShrink: 0,
                                }}
                            >
                                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                                {isListening && <span style={{
                                    position: 'absolute', inset: -3,
                                    borderRadius: '10px',
                                    border: '2px solid #ef4444',
                                    animation: 'pulse 1.5s ease-in-out infinite',
                                    pointerEvents: 'none',
                                }} />}
                            </button>
                            {/* Auto-send silence countdown indicator */}
                            {isListening && silenceCountdown > 0 && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '4px 10px',
                                    background: 'rgba(251,191,36,0.12)',
                                    border: '1px solid rgba(251,191,36,0.25)',
                                    borderRadius: 8,
                                    fontSize: 11,
                                    color: '#fbbf24',
                                    flexShrink: 0,
                                    animation: 'fadeIn 0.3s ease',
                                }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 36 36" style={{ flexShrink: 0 }}>
                                        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(251,191,36,0.2)" strokeWidth="3" />
                                        <circle cx="18" cy="18" r="15"
                                            fill="none" stroke="#fbbf24" strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeDasharray={`${(silenceCountdown / 4) * 94.2} 94.2`}
                                            transform="rotate(-90 18 18)"
                                            style={{ transition: 'stroke-dasharray 0.3s ease' }}
                                        />
                                    </svg>
                                    <span>Sending in {silenceCountdown}s</span>
                                </div>
                            )}
                            <input
                                type="text"
                                value={userInput || transcript}
                                onChange={(e) => { setUserInput(e.target.value); setTranscript(''); }}
                                placeholder={isListening
                                    ? (silenceCountdown > 0 ? `Auto-sending in ${silenceCountdown}s...` : "Listening... speak now")
                                    : "Type or speak your response..."}
                                onKeyDown={(e) => { if (e.key === 'Enter') sendAnswer(); }}
                            />
                            <button
                                className="ai-vc-ws-send"
                                onClick={sendAnswer}
                                disabled={(!userInput.trim() && !transcript.trim() && !code.trim()) || loading}
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Chat Sidebar (togglable, overlays) */}
                {chatOpen && (
                    <div className="ai-vc-chat-overlay">
                        <div className="ai-chat-header">
                            <h3><MessageSquare size={14} /> Live Chat</h3>
                            <button className="ai-topbar-icon-btn" onClick={() => setChatOpen(false)}>
                                <X size={14} />
                            </button>
                        </div>
                        <div className="ai-chat-messages">
                            {conversation.map((msg, idx) => {
                                if (msg.role === 'feedback') {
                                    const scoreColor = msg.score >= 80 ? '#4ade80' : msg.score >= 60 ? '#fbbf24' : '#f87171';
                                    const scoreBg = msg.score >= 80 ? 'rgba(74,222,128,0.08)' : msg.score >= 60 ? 'rgba(251,191,36,0.08)' : 'rgba(248,113,113,0.08)';
                                    const scoreBorder = msg.score >= 80 ? 'rgba(74,222,128,0.2)' : msg.score >= 60 ? 'rgba(251,191,36,0.2)' : 'rgba(248,113,113,0.2)';
                                    return (
                                        <div key={idx} className="ai-chat-feedback-card" style={{
                                            borderLeft: `3px solid ${scoreColor}`,
                                            background: scoreBg,
                                            borderRadius: 10,
                                            padding: '12px 14px',
                                            margin: '6px 0',
                                            fontSize: '0.82rem',
                                            lineHeight: 1.5,
                                        }}>
                                            {/* Score Badge */}
                                            <div style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                marginBottom: 8,
                                            }}>
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                    color: scoreColor, fontWeight: 700, fontSize: '0.85rem',
                                                }}>
                                                    {msg.score >= 80 ? '🌟' : msg.score >= 60 ? '👍' : '📝'}
                                                    <span>Score: {msg.score}%</span>
                                                </div>
                                                <div style={{
                                                    padding: '2px 10px', borderRadius: 20,
                                                    background: scoreBorder, color: scoreColor,
                                                    fontSize: '0.7rem', fontWeight: 600,
                                                }}>
                                                    {msg.score >= 80 ? 'Excellent' : msg.score >= 60 ? 'Good' : 'Needs Work'}
                                                </div>
                                            </div>
                                            {/* Feedback Text */}
                                            <div style={{ color: '#e2e8f0', marginBottom: 8 }}>{msg.content}</div>
                                            {/* Strengths */}
                                            {msg.strengths && msg.strengths.length > 0 && (
                                                <div style={{ marginBottom: 6 }}>
                                                    <div style={{ color: '#4ade80', fontSize: '0.72rem', fontWeight: 600, marginBottom: 3 }}>✓ Strengths</div>
                                                    {msg.strengths.map((s, i) => (
                                                        <div key={i} style={{ color: '#a7f3d0', fontSize: '0.76rem', paddingLeft: 10 }}>• {s}</div>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Improvements */}
                                            {msg.improvements && msg.improvements.length > 0 && (
                                                <div style={{ marginBottom: 6 }}>
                                                    <div style={{ color: '#fbbf24', fontSize: '0.72rem', fontWeight: 600, marginBottom: 3 }}>⬆ Improve</div>
                                                    {msg.improvements.map((s, i) => (
                                                        <div key={i} style={{ color: '#fde68a', fontSize: '0.76rem', paddingLeft: 10 }}>• {s}</div>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Hint */}
                                            {msg.hint && (
                                                <div style={{
                                                    marginTop: 6, padding: '6px 10px', borderRadius: 6,
                                                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)',
                                                    color: '#a5b4fc', fontSize: '0.74rem',
                                                }}>
                                                    💡 Hint: {msg.hint}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                return (
                                    <div key={idx} className={`ai-chat-msg ${msg.role === 'interviewer' ? 'interviewer' : 'candidate'}`}>
                                        <div className="msg-sender">
                                            {msg.role === 'interviewer' ? `${INTERVIEWER.name}` : 'You'}
                                        </div>
                                        {msg.content}
                                    </div>
                                );
                            })}
                            {loading && (
                                <div className="ai-typing-indicator">
                                    <span /><span /><span />
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="ai-chat-input-area">
                            <input
                                type="text"
                                className="ai-chat-input"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="Type your answer..."
                                onKeyDown={(e) => { if (e.key === 'Enter') sendAnswer(); }}
                            />
                            <button
                                className="ai-chat-send-btn"
                                onClick={sendAnswer}
                                disabled={(!userInput.trim() && !code.trim()) || loading}
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}




