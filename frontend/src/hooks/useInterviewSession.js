import { useState, useEffect, useRef, useCallback } from "react";
import { authFetch } from "../utils/authFetch";
import { useVoiceAI } from "./useVoiceAI";
import useInterviewIntelligence from "./useInterviewIntelligence";
import { useAuth } from "../context/AuthContext";
import {
  getThinkingDelayMs,
  getInterviewerReaction,
  getSilencePrompt,
  communicationScore as calcCommunication,
  technicalScore as calcTechnical,
  problemSolvingScore as calcProblemSolving,
  codeQualityScore as calcCodeQuality,
  getQuestionTimeLimit,
} from "../pages/aiInterviewTiming";
import {
  BOILERPLATE,
  AI_INTERVIEW_GENDER_STORAGE_KEY,
  AI_INTERVIEW_SESSION_KEY,
  readStoredInterviewerGender,
  STAGE_MAP,
  formatTime,
} from "../pages/aiInterviewConfig";
import { CODE_DELIMITER_MARKER } from "../pages/aiInterviewRuntime";

const STAGE_API_MAP = {
  coding: "DSA / Coding",
  dsa: "DSA / Coding",
  "system-design": "System Design",
  behavioral: "Behavioral",
  product: "Technical",
  "data-science": "Technical",
  "ai-llm": "Technical",
  hr: "HR",
  technical: "Technical",
};

const SKILL_MAP = {
  coding: ["Data Structures", "Algorithms", "Problem Solving"],
  dsa: ["Data Structures", "Algorithms", "Complexity Analysis"],
  "system-design": ["System Design", "Scalability", "Distributed Systems"],
  behavioral: ["Leadership", "Stakeholder Communication", "Ownership"],
  product: ["Product Thinking", "Prioritization", "Execution"],
  "data-science": ["Machine Learning", "Data Analysis", "Experimentation"],
  "ai-llm": ["LLM Applications", "Prompt Engineering", "Evaluation"],
};

export function useInterviewSession() {
  const { _user, getAuthHeaders } = useAuth();

  const [phase, setPhase] = useState("lobby");
  const [interviewType, setInterviewType] = useState("technical");
  const [realtimeMode, setRealtimeMode] = useState(false);
  const [interviewerGender, setInterviewerGender] = useState(
    readStoredInterviewerGender,
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(
        AI_INTERVIEW_GENDER_STORAGE_KEY,
        interviewerGender,
      );
    } catch { /* empty */ }
  }, [interviewerGender]);

  const voiceHookRef = useRef(null);
  const [activeTab, setActiveTab] = useState("code");
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(BOILERPLATE.python);
  const [lineCount, setLineCount] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [totalPauseTime, setTotalPauseTime] = useState(0);
  const pauseStartRef = useRef(null);
  const [questionElapsed, setQuestionElapsed] = useState(0);
  const questionTimerRef = useRef(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(6);
  const [stageLabel, setStageLabel] = useState("");
  const [stagePlan, setStagePlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [consecutiveSilentQuestions, setConsecutiveSilentQuestions] =
    useState(0);
  const [scoreCue, setScoreCue] = useState(null);
  const [activeHint, setActiveHint] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [interviewerVideoReady, setInterviewerVideoReady] = useState({
    speaking: false,
    listening: false,
  });
  const [interviewerVisibleMode, setInterviewerVisibleMode] =
    useState("listening");
  const sendAnswerRef = useRef(null);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [awaitingAnswer, setAwaitingAnswer] = useState(false);
  const lastSpeechTimestampRef = useRef(0);
  const [transcript, setTranscriptRaw] = useState("");
  const isListeningRef = useRef(false);
  const isSendingRef = useRef(false);
  const ttsAudioRef = useRef(null);

  const setTranscript = useCallback((val) => {
    setTranscriptRaw(typeof val === "function" ? val : val || "");
  }, []);

  const voiceAI = useVoiceAI({
    onAnswer: useCallback((answerText) => {
      setTranscriptRaw(answerText || "");
      const isSilentAnswer =
        !answerText ||
        answerText.trim().length === 0 ||
        answerText === "I do not have a response to this question.";
      setConsecutiveSilentQuestions((prev) => (isSilentAnswer ? prev + 1 : 0));
      if (sendAnswerRef.current) sendAnswerRef.current(false, answerText);
    }, []),
    onTranscriptUpdate: useCallback((partial) => {
      setTranscriptRaw(partial || "");
    }, []),
    interviewType,
    personaGender: interviewerGender,
    question: currentQuestion,
    getAuthHeaders,
  });

  const intelligence = useInterviewIntelligence({ getAuthHeaders });
  const isListening = voiceAI.state === "listening";

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    setMicOn(isListening);
  }, [isListening]);

  useEffect(() => {
    if (voiceAI.interruptDetected) {
      setAiSpeaking(false);
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    }
  }, [voiceAI.interruptDetected]);

  const speakInterviewerText = useCallback(
    async (text) => {
      if (!text || speakerMuted) return;
      // Show a subtle thinking indicator while TTS audio is being fetched,
      // but do NOT start lip-sync/speaking video yet — that waits for actual audio playback.
      setInterviewerStatus("Preparing response...");
      try {
        await voiceAI.speak(text, {
          onStart: () => {
            // Audio is actually playing now — start lip-sync + speaking video
            setInterviewerStatus("");
            setAiSpeaking(true);
          },
          onEnd: () => {},
        });
      } finally {
        setAiSpeaking(false);
        setInterviewerStatus("");
      }
    },
    [voiceAI, speakerMuted],
  );

  const speakSequenceCancelledRef = useRef(false);
  const speakSequence = useCallback(
    async (segments, { pauseMs = 150 } = {}) => {
      if (!segments || segments.length === 0 || speakerMuted) return;
      speakSequenceCancelledRef.current = false;
      // Don't set aiSpeaking here — let voiceAI.speak's onStart fire it when audio plays
      try {
        for (let i = 0; i < segments.length; i++) {
          if (speakSequenceCancelledRef.current) break;
          const text = segments[i];
          if (!text || !text.trim()) continue;
          await voiceAI.speak(text, {
            onStart: () => setAiSpeaking(true),
            onEnd: () => {},
          });
          if (i < segments.length - 1 && pauseMs > 0) {
            if (speakSequenceCancelledRef.current) break;
            await new Promise((r) => setTimeout(r, pauseMs));
          }
        }
      } finally {
        setAiSpeaking(false);
      }
    },
    [voiceAI, speakerMuted],
  );

  const startVoiceRecording = useCallback(() => voiceAI.start(), [voiceAI]);
  const stopVoiceRecording = useCallback(() => voiceAI.stop(), [voiceAI]);

  const handoffToCandidate = useCallback(() => {
    setAwaitingAnswer(false);
    if (!isPaused && phase === "interview" && !isListeningRef.current) {
      setTimeout(() => {
        if (!isListeningRef.current) startVoiceRecording();
      }, 150);
    }
  }, [isPaused, phase, startVoiceRecording]);

  const [chatOpen, setChatOpen] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [userInput, setUserInput] = useState("");
  const chatEndRef = useRef(null);
  const [interviewerStatus, setInterviewerStatus] = useState("");
  const [silenceStage, setSilenceStage] = useState(0);
  const silenceStageTimerRef = useRef(null);

  const stateRefs = useRef({
    userInput: "",
    transcript: "",
    code: "",
    language: "python",
  });
  useEffect(() => {
    stateRefs.current = { userInput, transcript, code, language };
  }, [userInput, transcript, code, language]);

  useEffect(() => {
    if (transcript && transcript.trim().length > 0) {
      intelligence.ingestTranscript(transcript);
    }
  }, [transcript, intelligence]);

  useEffect(() => {
    if (voiceAI.inputLevel > 0) {
      lastSpeechTimestampRef.current = Date.now();
      intelligence.ingestAudioConfidence(voiceAI.inputLevel);
    }
  }, [voiceAI.inputLevel, intelligence]);

  const [notes, setNotes] = useState("");
  const [savedSession, setSavedSession] = useState(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(AI_INTERVIEW_SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        if (
          session.timestamp &&
          Date.now() - session.timestamp < 2 * 60 * 60 * 1000
        ) {
          setSavedSession(session);
        } else {
          window.localStorage.removeItem(AI_INTERVIEW_SESSION_KEY);
        }
      }
    } catch {
      try {
        window.localStorage.removeItem(AI_INTERVIEW_SESSION_KEY);
      } catch { /* empty */ }
    }
  }, []);

  useEffect(() => {
    if (phase !== "interview" || conversation.length === 0) return;
    try {
      window.localStorage.setItem(
        AI_INTERVIEW_SESSION_KEY,
        JSON.stringify({
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
        }),
      );
    } catch { /* empty */ }
  }, [
    conversation,
    phase,
    questionIndex,
    currentQuestion,
    elapsed,
    totalQuestions,
    interviewType,
    interviewerGender,
    code,
    language,
    notes,
  ]);

  const clearSavedSession = useCallback(() => {
    setSavedSession(null);
    try {
      window.localStorage.removeItem(AI_INTERVIEW_SESSION_KEY);
    } catch { /* empty */ }
  }, []);

  const restoreSession = useCallback((session) => {
    setConversation(session.conversation || []);
    setQuestionIndex(session.questionIndex || 1);
    setCurrentQuestion(session.currentQuestion || "");
    setElapsed(session.elapsed || 0);
    setTotalQuestions(session.totalQuestions || 6);
    setInterviewType(session.interviewType || "technical");
    setInterviewerGender(session.interviewerGender || "male");
    setCode(session.code || BOILERPLATE.python);
    setLanguage(session.language || "python");
    setNotes(session.notes || "");
    setSavedSession(null);
    setPhase("interview");
  }, []);

  const questionIndexRef = useRef(1);
  useEffect(() => {
    questionIndexRef.current = questionIndex;
  }, [questionIndex]);

  const [setupStep, setSetupStep] = useState(0);
  const [experienceLevel, setExperienceLevel] = useState("fresher");
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [companyTab, setCompanyTab] = useState("all");
  const [resumeFile, setResumeFile] = useState(null);
  const [activeResumeContext, setActiveResumeContext] = useState(null);

  useEffect(() => {
    setTotalQuestions(13);
  }, [experienceLevel]);

  const [resultTab, setResultTab] = useState("overview");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [expandedMoment, setExpandedMoment] = useState(null);

  const [captionsOn, setCaptionsOn] = useState(true);
  const [workspacePanelOpen, setWorkspacePanelOpen] = useState(true);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);

  const logAPIError = useCallback(
    (endpoint, stage, error, payload = {}) => {
      const errorContext = {
        timestamp: new Date().toISOString(),
        endpoint,
        stage,
        questionIndex: questionIndexRef.current,
        totalQuestions,
        phase,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
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
    },
    [totalQuestions, phase],
  );

  const createHttpError = useCallback((status, statusText = "") => {
    const error = new Error(
      `HTTP ${status}: ${statusText || "Request failed"}`,
    );
    error.name = "HttpError";
    error.status = status;
    return error;
  }, []);

  const getHttpStatus = useCallback((error) => {
    if (typeof Response !== "undefined" && error instanceof Response)
      return error.status;
    if (error && typeof error.status === "number") return error.status;
    if (error && typeof error.message === "string") {
      const match = error.message.match(/^HTTP\s+(\d{3})/);
      if (match) return Number(match[1]);
    }
    return null;
  }, []);

  const streamRef = useRef(null);
  const interviewerSpeakingVideoRef = useRef(null);
  const interviewerListeningVideoRef = useRef(null);
  const interviewerPlaybackRef = useRef({ speaking: 0, listening: 0 });
  const interviewerTargetModeRef = useRef("listening");
  const videoRef = useRef(null);

  const generateAnalysis = useCallback(async () => {
    const totalMessages = conversation.length;
    const userMessages = conversation.filter((m) => m.role === "candidate");
    const statsObj = {
      duration: formatTime(elapsed),
      questionsAnswered: questionIndex,
      totalMessages,
      linesOfCode: lineCount,
      language,
      pauseTime:
        totalPauseTime > 0
          ? formatTime(Math.round(totalPauseTime / 1000))
          : null,
    };

    const CATEGORY_ICONS = {
      Communication: { color: "#818cf8" },
      "Technical Skills": { color: "#22d3ee" },
      "Problem Solving": { color: "#a78bfa" },
      "Code Quality": { color: "#34d399" },
    };

    setAnalysisLoading(true);
    try {
      const res = await authFetch("/api/company-interview/evaluate", {
        method: "POST",
        body: JSON.stringify({
          conversation: conversation.map((m) => ({
            role: m.role,
            content: m.content,
            score: m.score,
            strengths: m.strengths,
            improvements: m.improvements,
            questionSource: m.questionSource,
            questionMeta: m.questionMeta,
            timestamp: m.timestamp,
          })),
          company: targetCompany || "General",
          role: targetRole || "Software Engineer",
          stage: interviewType,
          sessionScores: conversation
            .filter((m) => m.role === "feedback" && m.score)
            .map((m) => m.score),
        }),
      });
      const data = await res.json();
      if (data && !data.fallback && data.overallScore) {
        const score10 = Math.round((data.overallScore / 10) * 10) / 10;
        const cats = data.categoryScores ? [
          { name: "Technical Skills", score: Math.round((data.categoryScores.technicalSkills || 0) / 10 * 10) / 10 },
          { name: "Communication", score: Math.round((data.categoryScores.communication || 0) / 10 * 10) / 10 },
          { name: "Problem Solving", score: Math.round((data.categoryScores.problemSolving || 0) / 10 * 10) / 10 },
          { name: "Culture Fit", score: Math.round((data.categoryScores.cultureFit || 0) / 10 * 10) / 10 }
        ] : (data.categories || []);

        setAnalysisResult({
          ...data,
          overallScore: score10,
          perQuestionBreakdown: (data.questionBreakdown || []).map(q => ({
            ...q,
            scoreEstimate: Math.round((q.score || 0) / 10 * 10) / 10
          })),
          categories: cats.map((cat) => ({
            ...cat,
            icon: cat.name,
            color: CATEGORY_ICONS[cat.name]?.color || "#818cf8",
          })),
          performanceColor:
            score10 >= 7
              ? "#22c55e"
              : score10 >= 5
                ? "#f59e0b"
                : score10 >= 3
                  ? "#f97316"
                  : "#ef4444",
          stats: statsObj,
          aiGenerated: true,
        });
        setAnalysisLoading(false);
        return;
      }
    } catch (err) {
      console.warn("AI analysis failed, using local fallback:", err.message);
    }

    const avgResponseLength =
      userMessages.length > 0
        ? Math.round(
            userMessages.reduce(
              (sum, m) => sum + ((m.content || m.text || "").length || 0),
              0,
            ) / userMessages.length,
          )
        : 0;
    const commScore = calcCommunication(
      avgResponseLength,
      userMessages.length,
      Math.max(questionIndex, 1),
    );
    const techScore = calcTechnical(code, lineCount);
    const psScore = calcProblemSolving(questionIndex, userMessages.length);
    const cqScore = calcCodeQuality(code, lineCount);
    const overallScore =
      Math.round(((commScore + techScore + psScore + cqScore) / 4) * 10) / 10;

    const keyMoments = [];
    conversation.forEach((msg, idx) => {
      const text = msg.content || msg.text || "";
      if (msg.role === "interviewer" && text.length > 50 && idx < 3)
        keyMoments.push({
          type: "question",
          text: text.substring(0, 120) + "...",
          time: formatTime(
            Math.round((elapsed / Math.max(totalMessages, 1)) * idx),
          ),
        });
      if (msg.role === "candidate" && text.length > 80)
        keyMoments.push({
          type: "answer",
          text: text.substring(0, 120) + "...",
          time: formatTime(
            Math.round((elapsed / Math.max(totalMessages, 1)) * idx),
          ),
        });
    });

    setAnalysisResult({
      overallScore,
      performanceLabel:
        overallScore >= 7
          ? "Strong Hire"
          : overallScore >= 5
            ? "Inclined Hire"
            : overallScore >= 3
              ? "Needs Improvement"
              : "Not Ready",
      performanceColor:
        overallScore >= 7
          ? "#22c55e"
          : overallScore >= 5
            ? "#f59e0b"
            : overallScore >= 3
              ? "#f97316"
              : "#ef4444",
      categories: [
        {
          name: "Communication",
          score: commScore,
          icon: "Communication",
          color: "#818cf8",
        },
        {
          name: "Technical Skills",
          score: techScore,
          icon: "Technical Skills",
          color: "#22d3ee",
        },
        {
          name: "Problem Solving",
          score: psScore,
          icon: "Problem Solving",
          color: "#a78bfa",
        },
        {
          name: "Code Quality",
          score: cqScore,
          icon: "Code Quality",
          color: "#34d399",
        },
      ],
      strengths: [
        "Structured approach to problem decomposition",
        "Clear communication of thought process",
        userMessages.length > 3
          ? "Good follow-up engagement"
          : "Showed initiative in discussion",
      ],
      improvements: [
        "Consider edge cases more thoroughly",
        "Optimize time complexity analysis",
        "Strengthen system design fundamentals",
      ],
      keyMoments: keyMoments.slice(0, 5),
      stats: statsObj,
      aiGenerated: false,
    });
    setAnalysisLoading(false);
  }, [
    conversation,
    elapsed,
    questionIndex,
    code,
    lineCount,
    language,
    targetCompany,
    targetRole,
    interviewType,
    getAuthHeaders,
    totalPauseTime,
  ]);

  useEffect(() => {
    if (phase === "interview" && !isPaused) {
      timerRef.current = setInterval(
        () => setElapsed((prev) => prev + 1),
        1000,
      );
    }
    return () => clearInterval(timerRef.current);
  }, [phase, isPaused]);

  useEffect(() => {
    if (phase === "interview" && !isPaused) {
      questionTimerRef.current = setInterval(
        () => setQuestionElapsed((prev) => prev + 1),
        1000,
      );
    }
    return () => clearInterval(questionTimerRef.current);
  }, [phase, isPaused]);

  const countdownWarnedRef = useRef(false);
  useEffect(() => {
    setQuestionElapsed(0);
    countdownWarnedRef.current = false;
  }, [questionIndex]);

  useEffect(() => {
    if (phase !== "interview" || isPaused) return;
    const resolvedStage = STAGE_MAP[interviewType] || "Technical";
    const limit = getQuestionTimeLimit(resolvedStage);
    const remaining = limit - questionElapsed;
    if (remaining === 30 && !countdownWarnedRef.current) {
      countdownWarnedRef.current = true;
      setInterviewerStatus("30 seconds remaining");
      setTimeout(() => setInterviewerStatus(""), 4000);
    }
    if (
      questionElapsed >= limit &&
      sendAnswerRef.current &&
      !isSendingRef.current
    ) {
      console.info(
        `[AI Interview] Per-question timer expired for Q${questionIndex} (${formatTime(limit)}). Auto-submitting.`,
      );
      voiceAI.stop();
      if (silenceStageTimerRef.current)
        clearTimeout(silenceStageTimerRef.current);
      sendAnswerRef.current(true);
    }
  }, [questionElapsed, phase, isPaused, interviewType, questionIndex, voiceAI]);

  useEffect(() => {
    if (phase === "summary") generateAnalysis();
  }, [phase, generateAnalysis]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  useEffect(() => {
    setLineCount(code ? code.split("\n").length : 1);
  }, [code]);

  useEffect(() => {
    let cameraErrorTimer;
    if (phase === "interview" && cameraOn) {
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch((err) => {
          setCameraOn(false);
          const msg =
            err.name === "NotAllowedError"
              ? "Camera access denied."
              : err.name === "NotFoundError"
                ? "No camera found."
                : err.name === "NotReadableError"
                  ? "Camera in use by another app."
                  : `Camera error: ${err.message}`;
          setCameraError(msg);
          cameraErrorTimer = setTimeout(() => setCameraError(null), 5000);
        });
    }
    return () => {
      if (cameraErrorTimer) clearTimeout(cameraErrorTimer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [phase, cameraOn]);

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
    const video =
      mode === "speaking"
        ? interviewerSpeakingVideoRef.current
        : interviewerListeningVideoRef.current;
    if (!video) return;
    interviewerPlaybackRef.current[mode] = video.currentTime || 0;
  }, []);

  const handleInterviewerLoadedMetadata = useCallback((mode) => {
    const video =
      mode === "speaking"
        ? interviewerSpeakingVideoRef.current
        : interviewerListeningVideoRef.current;
    if (!video) return;
    const savedTime = interviewerPlaybackRef.current[mode] || 0;
    const duration = video.duration || 0;
    if (duration > 0) video.currentTime = savedTime % duration;
  }, []);

  const handleInterviewerCanPlay = useCallback((mode) => {
    setInterviewerVideoReady((prev) =>
      prev[mode] ? prev : { ...prev, [mode]: true },
    );
    if (interviewerTargetModeRef.current === mode)
      setInterviewerVisibleMode(mode);
  }, []);

  useEffect(() => {
    const activeMode = aiSpeaking ? "speaking" : "listening";
    interviewerTargetModeRef.current = activeMode;
    const speakingVideo = interviewerSpeakingVideoRef.current;
    const listeningVideo = interviewerListeningVideoRef.current;
    if (!speakingVideo || !listeningVideo) return;
    const activeVideo =
      activeMode === "speaking" ? speakingVideo : listeningVideo;
    const inactiveVideo =
      activeMode === "speaking" ? listeningVideo : speakingVideo;
    if (interviewerVideoReady[activeMode])
      setInterviewerVisibleMode(activeMode);
    inactiveVideo.pause();
    activeVideo.play().catch(() => {});
    return () => {
      interviewerPlaybackRef.current[activeMode] = activeVideo.currentTime || 0;
    };
  }, [aiSpeaking, interviewerVideoReady]);

  const startInterview = async () => {
    setPhase("connecting");
    setElapsed(0);
    setLoading(true);

    const resolvedStage = STAGE_API_MAP[interviewType] || "Technical";
    const resolvedCompany = targetCompany || "Google";
    const resolvedRole = targetRole || "Software Engineer";

    if (realtimeMode) {
      console.warn(
        "[Pipecat] Real-time mode is temporarily unavailable, falling back to classic flow.",
      );
      setRealtimeMode(false);
    }

    const minDelay = new Promise((resolve) => setTimeout(resolve, 1200));
    const technicalOpeningFallback =
      experienceLevel === "fresher"
        ? `Hey, welcome! So today we're going to have a technical chat — we'll cover things like databases, OOP, web concepts, that kind of stuff. But first, tell me a bit about yourself and what technologies you've been most interested in lately.`
        : `Hey, thanks for joining! So let's jump right in — can you walk me through one project you built recently? I'm curious about your design choices and the key trade-offs you made.`;

    try {
      const _headers = getAuthHeaders ? getAuthHeaders() : {};
      const advancedOpts = {
        interviewerIntensity:
          experienceLevel === "fresher" ? "supportive" : "balanced",
        followUpDepth: experienceLevel === "fresher" ? "shallow" : "deep",
        answerPace: experienceLevel === "fresher" ? "slow" : "balanced",
        resumeInterviewMode:
          experienceLevel === "fresher"
            ? "fresher-hr-tech"
            : "project-deep-dive",
        questionCount: totalQuestions,
      };

      const inferredSkills = SKILL_MAP[interviewType] || [
        "Software Engineering",
        "Problem Solving",
      ];
      const resumeCtx = resumeFile
        ? {
            candidateHeadline: `${experienceLevel === "experienced" ? "Experienced" : "Fresher"} ${resolvedRole}`,
            summary: `Resume uploaded: ${resumeFile.name}. Prioritize resume-based questioning and practical depth.`,
            coreSkills: inferredSkills,
            projectHighlights: [
              `Most relevant project from uploaded resume (${resumeFile.name})`,
            ],
            likelyQuestionAreas: [resolvedStage, ...inferredSkills.slice(0, 2)],
          }
        : null;

      setActiveResumeContext(resumeCtx);

      const [res] = await Promise.all([
        authFetch("/api/company-interview/start", {
          method: "POST",
          body: JSON.stringify({
            company: resolvedCompany,
            role: resolvedRole,
            stage: resolvedStage,
            difficulty: experienceLevel === "fresher" ? "easy" : "medium",
            experienceLevel,
            totalQuestions,
            interactionFormat: "text",
            advancedOptions: advancedOpts,
            resumeContext: resumeCtx,
            interviewerName: undefined,
            generateAllQuestions: true,
          }),
        }),
        minDelay,
      ]);

      if (!res.ok) {
        logAPIError(
          "/api/company-interview/start",
          "interview-start-http",
          res,
          { company: resolvedCompany, stage: resolvedStage, experienceLevel },
        );
        throw createHttpError(res.status, res.statusText);
      }

      const data = await res.json();
      const stageFallbacks = {
        "DSA / Coding": `Alright, let's kick things off with a coding problem. So, given an array of integers and a target sum, how would you find two numbers that add up to the target? Walk me through how you'd think about it.`,
        "System Design": `Cool, so let's talk system design. How would you go about designing something like a URL shortener — think bit.ly? What are the key pieces you'd need?`,
        Behavioral: `Hey, I'd love to get to know you a bit. Can you tell me about a challenging project you worked on? What made it tough, and how did you handle it?`,
        Technical: technicalOpeningFallback,
        HR: `Hey, welcome! Thanks for being here. Let's keep this relaxed — tell me a bit about yourself and your journey so far.`,
      };
      const questionText =
        data.question ||
        stageFallbacks[resolvedStage] ||
        `Welcome! Let's start this ${resolvedStage.toLowerCase()} interview. Tell me about a project you've worked on that you're proud of.`;
      setCurrentQuestion(questionText);
      setQuestionIndex(1);
      setConversation([
        { role: "interviewer", content: questionText, timestamp: Date.now() },
      ]);

      console.log("[Interview] Pre-generating audio for first question...");
      voiceAI.prefetch(questionText);
      await minDelay;

      setPhase("interview");
      setLoading(false);
      await speakInterviewerText(questionText);
      startVoiceRecording();
    } catch (error) {
      const statusCode = getHttpStatus(error);
      if (statusCode !== 401)
        logAPIError(
          "/api/company-interview/start",
          "interview-start-catch",
          error,
          { stage: resolvedStage },
        );
      else
        console.warn(
          "[AI Interview API Warning] start unauthorized; using local fallback question flow.",
        );
      await minDelay;
      const catchFallbacks = {
        "DSA / Coding": `Alright, let's start with a fun one. Given a linked list, how would you figure out if it has a cycle in it? Talk me through your thinking.`,
        "System Design": `So, let's say you need to design a simple chat app. How would you approach that? Think about the main components and how data flows.`,
        Behavioral: `Hey, tell me about a time you worked on a team project. What was your role, and what challenges came up?`,
        Technical: technicalOpeningFallback,
        HR: `Hey, thanks for being here! So what got you into tech in the first place? And what kind of role are you looking for right now?`,
      };
      const fallbackQ =
        catchFallbacks[resolvedStage] ||
        `Welcome! Tell me about your background and a project you're proud of.`;
      setCurrentQuestion(fallbackQ);
      setQuestionIndex(1);
      setConversation([
        { role: "interviewer", content: fallbackQ, timestamp: Date.now() },
      ]);
      voiceAI.prefetch(fallbackQ);
      setLoading(false);
      setPhase("interview");
      await speakInterviewerText(fallbackQ);
      startVoiceRecording();
    }
  };

  const sendAnswer = async (isAutoSkip = false, answerOverride = null) => {
    if (isSendingRef.current) return;
    isSendingRef.current = true;
    try {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
        questionTimerRef.current = null;
      }
      if (silenceStageTimerRef.current) {
        clearTimeout(silenceStageTimerRef.current);
        silenceStageTimerRef.current = null;
      }
      setSilenceStage(0);
      if (isListeningRef.current) stopVoiceRecording();
      speakSequenceCancelledRef.current = true;
      voiceAI.interrupt();
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      setAiSpeaking(false);

      const currentTranscript = stateRefs.current.transcript.trim();
      const currentUserInput = stateRefs.current.userInput.trim();
      // Include any pending interim text that hasn't been finalized by browser STT yet.
      // This prevents the last few words from being silently dropped.
      const interimText = (voiceAI.interimText || "").trim();
      const fullTranscript = interimText
        ? (currentTranscript + " " + interimText).trim()
        : currentTranscript;
      const providedAnswer = answerOverride?.trim() || currentUserInput || fullTranscript;
      
      const answer =
        isAutoSkip === true && !providedAnswer
          ? "I do not have a response to this question."
          : providedAnswer || "I do not have a response to this question.";

      if (isAutoSkip === true && !providedAnswer)
        setConsecutiveSilentQuestions((prev) => prev + 1);
      else if (answer && answer.length > 10 && answer !== "I do not have a response to this question.") setConsecutiveSilentQuestions(0);

      if (answer && answer.length > 10 && answer !== "I do not have a response to this question.")
        intelligence.analyzeAnswer(answer, currentQuestion).catch(() => {});
      if (!answer && !stateRefs.current.code.trim() && isAutoSkip !== true) {
        isSendingRef.current = false;
        return;
      }

      const currentCode = stateRefs.current.code.trim();
      const fullAnswer = currentCode
        ? `${answer}\n\n${CODE_DELIMITER_MARKER}\n${currentCode}`
        : answer;

      setConversation((prev) => [
        ...prev,
        {
          role: "candidate",
          content: answer || "[Code submitted]",
          timestamp: Date.now(),
        },
      ]);
      setUserInput("");
      setTranscript("");
      setLoading(true);

      const resolvedStage = STAGE_API_MAP[interviewType] || "Technical";
      const resolvedCompany = targetCompany || "Google";
      const resolvedRole = targetRole || "Software Engineer";

      const technicalFollowUpFallbacks =
        experienceLevel === "fresher"
          ? [
              "Can you connect that to a class project, internship, or side project you worked on?",
              "Can you give one concrete example from something you built or studied?",
              "Can you walk me through a specific project or coursework example that shows that in practice?",
            ]
          : [
              "Can you walk me through your approach step by step, including trade-offs?",
              "What alternative would you consider, and why?",
              "How would you apply that in a real system or team setting?",
            ];

      const pickTechnicalFollowUpFallback = (seed = 0) =>
        technicalFollowUpFallbacks[
          Math.abs(seed) % technicalFollowUpFallbacks.length
        ];

      try {
        const _headers = getAuthHeaders ? getAuthHeaders() : {};
        const followUpAdvancedOpts = {
          interviewerIntensity:
            experienceLevel === "fresher" ? "supportive" : "balanced",
          followUpDepth: experienceLevel === "fresher" ? "shallow" : "deep",
          answerPace: experienceLevel === "fresher" ? "slow" : "balanced",
          resumeInterviewMode:
            experienceLevel === "fresher"
              ? "fresher-hr-tech"
              : "project-deep-dive",
          questionCount: totalQuestions,
        };

        const res = await authFetch("/api/company-interview/follow-up", {
          method: "POST",
          body: JSON.stringify({
            previousQuestion: currentQuestion,
            userAnswer: fullAnswer,
            questionNumber: questionIndexRef.current + 1,
            totalQuestions,
            company: resolvedCompany,
            role: resolvedRole,
            stage: resolvedStage,
            difficulty: experienceLevel === "fresher" ? "easy" : "medium",
            experienceLevel,
            conversationHistory: conversation
              .slice(-12)
              .map((m) => ({ role: m.role, content: m.content })),
            code: code.trim() || undefined,
            codeLanguage: language,
            advancedOptions: followUpAdvancedOpts,
            resumeContext: activeResumeContext,
          }),
        });

        if (!res.ok) {
          logAPIError(
            "/api/company-interview/follow-up",
            "follow-up-http",
            res,
            { stage: resolvedStage, questionIndex, experienceLevel },
          );
          throw createHttpError(res.status, res.statusText);
        }

        const data = await res.json();
        const feedbackScore = data.feedback?.score || data.score || 0;
        if (data.stageLabel) setStageLabel(data.stageLabel);

        const nextQ =
          data.followUpQuestion || data.nextQuestion || data.question;
        const closingRemark = data.closingRemark;
        const isInterviewOver =
          data.complete === true || questionIndex >= totalQuestions;

        const followUpFallbackByStage = {
          "DSA / Coding":
            "Can you walk me through your approach step by step, and then share the time and space complexity?",
          "System Design":
            "Can you explain your architecture step by step, including key trade-offs and bottlenecks?",
          Behavioral:
            "Can you walk me through that situation using STAR: Situation, Task, Action, and Result?",
          Technical: pickTechnicalFollowUpFallback(questionIndex - 1),
          HR: "Can you share one concrete example that supports your answer?",
        };
        const fallbackQ =
          followUpFallbackByStage[resolvedStage] ||
          "Can you walk me through your approach step by step, including trade-offs?";
        const continueQ =
          typeof nextQ === "string" && nextQ.trim().length > 0
            ? nextQ
            : fallbackQ;

        if (!isInterviewOver) {
          console.log(
            "[Interview] Pre-fetching next question audio:",
            continueQ.substring(0, 50) + "...",
          );
          voiceAI.prefetch(continueQ);
        }

        const speakAndHandoff = async (questionSegment, isEnding = false) => {
          setLoading(false);
          if (isEnding) {
            await speakInterviewerText(questionSegment);
            setTimeout(() => endInterview(), 1500);
          } else {
            await speakInterviewerText(questionSegment);
            handoffToCandidate();
          }
        };

        if (isInterviewOver) {
          const closingText =
            data.closingRemark ||
            closingRemark ||
            "Great job today! Thank you for your time. We'll be in touch soon.";
          setConversation((prev) => [
            ...prev,
            {
              role: "interviewer",
              content: closingText,
              timestamp: Date.now(),
            },
          ]);
          await speakAndHandoff(closingText, true);
        } else if (consecutiveSilentQuestions >= 3) {
          const earlyEndText =
            "I notice you might need more time to prepare. That's completely okay! Let's wrap up here. Thank you for your time today, and feel free to come back when you're ready. Best of luck with your preparation!";
          setConversation((prev) => [
            ...prev,
            {
              role: "interviewer",
              content: earlyEndText,
              timestamp: Date.now(),
            },
          ]);
          setLoading(false);
          await speakInterviewerText(earlyEndText);
          setTimeout(() => endInterview(), 1500);
        } else {
          setCurrentQuestion(continueQ);
          setQuestionIndex((prev) => prev + 1);
          setConversation((prev) => [
            ...prev,
            { role: "interviewer", content: continueQ, timestamp: Date.now() },
          ]);
          const reaction = getInterviewerReaction(feedbackScore, interviewType);
          setInterviewerStatus(`${reaction.emoji} ${reaction.text}`);
          await speakAndHandoff(continueQ);
          setInterviewerStatus("");
        }
      } catch (error) {
        const statusCode = getHttpStatus(error);
        if (statusCode !== 401)
          logAPIError(
            "/api/company-interview/follow-up",
            "follow-up-catch",
            error,
            { stage: resolvedStage, questionIndex },
          );
        else
          console.warn(
            "[AI Interview API Warning] follow-up unauthorized; using local fallback feedback flow.",
          );

        const catchFollowUpFallbackByStage = {
          "DSA / Coding":
            "Can you tell me about the time and space complexity of your solution?",
          "System Design":
            "How would this design behave at 10x scale, and what would you change first?",
          Behavioral:
            "Can you share the specific action you took and what outcome it produced?",
          Technical: pickTechnicalFollowUpFallback(questionIndex),
          HR: "Can you give one concrete example that shows this about you?",
        };
        const fallbackQ =
          catchFollowUpFallbackByStage[resolvedStage] ||
          "Can you tell me about the time and space complexity of your solution?";
        const isInterviewOverFallback = questionIndex >= totalQuestions;

        if (isInterviewOverFallback) {
          const closingFallback =
            "Great job today! Thank you for your time. We'll be in touch soon.";
          setConversation((prev) => [
            ...prev,
            {
              role: "interviewer",
              content: closingFallback,
              timestamp: Date.now(),
            },
          ]);
          setLoading(false);
          await speakInterviewerText(closingFallback);
          setTimeout(() => endInterview(), 1500);
        } else {
          setConversation((prev) => [
            ...prev,
            { role: "interviewer", content: fallbackQ, timestamp: Date.now() },
          ]);
          setCurrentQuestion(fallbackQ);
          setQuestionIndex((prev) => prev + 1);
          setLoading(false);
          await speakInterviewerText(fallbackQ);
          handoffToCandidate();
        }
      }
    } finally {
      isSendingRef.current = false;
    }
  };

  useEffect(() => {
    sendAnswerRef.current = sendAnswer;
  }, [sendAnswer]);

  const stopSilenceHandling = useCallback(() => {
    if (silenceStageTimerRef.current)
      clearTimeout(silenceStageTimerRef.current);
    setSilenceStage(0);
    setInterviewerStatus("");
  }, []);

  const hasRecentSpeech = useCallback(() => {
    const hasTranscript = stateRefs.current.transcript.trim().length > 0;
    // 5-second window: natural pauses between thoughts are 3-5 seconds
    const recentAudio = Date.now() - lastSpeechTimestampRef.current < 5000;
    return hasTranscript || recentAudio;
  }, []);

  const startSilenceHandling = useCallback(() => {
    stopSilenceHandling();
    if (phase !== "interview") return;

    // Stage 1: Show encouragement after 12s of silence (was 8s)
    silenceStageTimerRef.current = setTimeout(() => {
      if (!isListeningRef.current || hasRecentSpeech()) return;
      setSilenceStage(1);
      setInterviewerStatus(getSilencePrompt(interviewType, 0));

      // Stage 2: Offer to rephrase after another 15s (27s total silence)
      silenceStageTimerRef.current = setTimeout(() => {
        if (!isListeningRef.current || hasRecentSpeech()) return;
        setSilenceStage(2);
        const rephraseText = "Would you like me to rephrase the question?";
        setInterviewerStatus(rephraseText);
        setConversation((prev) => [
          ...prev,
          { role: "interviewer", content: rephraseText, timestamp: Date.now() },
        ]);
        if (isListeningRef.current) stopVoiceRecording();
        speakInterviewerText(rephraseText).then(() => {
          if (!isPaused && phase === "interview") startVoiceRecording();
          // Stage 3: Auto-skip after another 15s of silence (42s total)
          silenceStageTimerRef.current = setTimeout(() => {
            if (hasRecentSpeech()) return;
            setSilenceStage(3);
            setInterviewerStatus("");
            if (sendAnswerRef.current) sendAnswerRef.current(true);
          }, 15000);
        });
      }, 15000);
    }, 12000);
  }, [
    phase,
    speakInterviewerText,
    stopSilenceHandling,
    interviewType,
    hasRecentSpeech,
    stopVoiceRecording,
    startVoiceRecording,
    isPaused,
  ]);

  useEffect(() => {
    if (isListening && !transcript.trim() && !aiSpeaking)
      startSilenceHandling();
    else stopSilenceHandling();
  }, [
    isListening,
    transcript,
    aiSpeaking,
    startSilenceHandling,
    stopSilenceHandling,
  ]);

  const endInterview = useCallback(() => {
    clearInterval(timerRef.current);
    clearInterval(questionTimerRef.current);
    if (silenceStageTimerRef.current)
      clearTimeout(silenceStageTimerRef.current);
    stopVoiceRecording();
    speakSequenceCancelledRef.current = true;
    voiceAI.interrupt();
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setAiSpeaking(false);
    setAwaitingAnswer(false);
    setShowEndConfirm(false);
    voiceAI.cleanup();
    try {
      const stats = voiceAI.getAnalytics();
      console.info("[AI Interview] Voice analytics:", stats);
    } catch { /* empty */ }
    clearSavedSession();
    setAnalysisLoading(true);
    setPhase("summary");
  }, [voiceAI, stopVoiceRecording, clearSavedSession]);

  const togglePause = useCallback(() => {
    if (isPaused) {
      if (pauseStartRef.current) {
        setTotalPauseTime(
          (prev) => prev + (Date.now() - pauseStartRef.current),
        );
        pauseStartRef.current = null;
      }
      setIsPaused(false);
      setInterviewerStatus("");
      if (!isListeningRef.current) startVoiceRecording();
    } else {
      pauseStartRef.current = Date.now();
      setIsPaused(true);
      setInterviewerStatus("Interview paused");
      stopVoiceRecording();
      voiceAI.interrupt();
      speakSequenceCancelledRef.current = true;
      if (ttsAudioRef.current) ttsAudioRef.current.pause();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    }
  }, [isPaused, startVoiceRecording, stopVoiceRecording, voiceAI]);

  const endInterviewRef = useRef(null);
  useEffect(() => {
    endInterviewRef.current = endInterview;
  }, [endInterview]);
  useEffect(() => {
    if (phase !== "interview" || isPaused) return;
    const resolvedStage = STAGE_MAP[interviewType] || "Technical";
    const totalBudget = totalQuestions * getQuestionTimeLimit(resolvedStage);
    if (elapsed >= totalBudget) {
      console.info(
        `[AI Interview] Global timer expired (${formatTime(totalBudget)}). Auto-ending interview.`,
      );
      if (endInterviewRef.current) endInterviewRef.current();
    }
  }, [elapsed, phase, isPaused, interviewType, totalQuestions]);

  const toggleMic = useCallback(() => {
    if (isListening) stopVoiceRecording();
    else startVoiceRecording();
  }, [isListening, stopVoiceRecording, startVoiceRecording]);

  const toggleCamera = useCallback(() => {
    if (cameraOn && streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    }
    setCameraOn((prev) => !prev);
  }, [cameraOn, streamRef, videoRef]);

  const handleVoiceInput = () => {
    if (isListening) stopVoiceRecording();
    else startVoiceRecording();
  };

  const handleAskQuestion = useCallback(
    async (question) => {
      const trimmedQuestion = String(question || "").trim();
      if (!trimmedQuestion) return;

      setAwaitingAnswer(false);
      setUserInput("");
      setTranscript("");
      if (isListeningRef.current) stopVoiceRecording();

      const clarification = currentQuestion
        ? `Good clarification. For this answer, focus on what the question is asking and walk me through your reasoning. I'll repeat it: ${currentQuestion}`
        : "Good clarification. Please answer with your reasoning, assumptions, and a concrete example if possible.";

      setConversation((prev) => [
        ...prev,
        {
          role: "candidate",
          content: trimmedQuestion,
          timestamp: Date.now(),
          isClarificationQuestion: true,
        },
        {
          role: "clarification",
          content: clarification,
          timestamp: Date.now(),
        },
      ]);

      await speakInterviewerText(clarification);
      handoffToCandidate();
    },
    [
      currentQuestion,
      handoffToCandidate,
      speakInterviewerText,
      stopVoiceRecording,
      setTranscript,
    ],
  );

  const startAnswer = useCallback(() => {
    setAwaitingAnswer(false);
    if (!isListeningRef.current) startVoiceRecording();
  }, [startVoiceRecording]);

  return {
    state: {
      phase,
      interviewType,
      realtimeMode,
      interviewerGender,
      activeTab,
      language,
      code,
      lineCount,
      elapsed,
      isPaused,
      totalPauseTime,
      questionElapsed,
      currentQuestion,
      questionIndex,
      totalQuestions,
      stageLabel,
      stagePlan,
      loading,
      consecutiveSilentQuestions,
      scoreCue,
      activeHint,
      analysisLoading,
      cameraOn,
      bookmarked,
      speakerMuted,
      micOn,
      interviewerVideoReady,
      interviewerVisibleMode,
      aiSpeaking,
      transcript,
      silenceCountdown: voiceAI.silenceCountdown || 0,
      chatOpen,
      conversation,
      userInput,
      interviewerStatus,
      silenceStage,
      notes,
      savedSession,
      cameraError,
      showEndConfirm,
      awaitingAnswer,
      setupStep,
      experienceLevel,
      targetRole,
      targetCompany,
      companySearch,
      companyTab,
      resumeFile,
      activeResumeContext,
      resultTab,
      analysisResult,
      expandedMoment,
      captionsOn,
      workspacePanelOpen,
      workspaceDropdownOpen,
    },
    refs: {
      voiceHookRef,
      sendAnswerRef,
      isListeningRef,
      isSendingRef,
      ttsAudioRef,
      chatEndRef,
      silenceStageTimerRef,
      stateRefs,
      questionIndexRef,
      timerRef,
      questionTimerRef,
      pauseStartRef,
      countdownWarnedRef,
      speakSequenceCancelledRef,
      streamRef,
      interviewerSpeakingVideoRef,
      interviewerListeningVideoRef,
      interviewerPlaybackRef,
      interviewerTargetModeRef,
      videoRef,
    },
    actions: {
      setPhase,
      setInterviewType,
      setRealtimeMode,
      setInterviewerGender,
      setActiveTab,
      setLanguage,
      setCode,
      setNotes,
      setElapsed,
      setIsPaused,
      setTotalPauseTime,
      setCurrentQuestion,
      setQuestionIndex,
      setTotalQuestions,
      setStageLabel,
      setStagePlan,
      setLoading,
      setConsecutiveSilentQuestions,
      setScoreCue,
      setActiveHint,
      setAnalysisLoading,
      setCameraOn,
      setBookmarked,
      setSpeakerMuted,
      setChatOpen,
      setConversation,
      setUserInput,
      setInterviewerStatus,
      setSilenceStage,
      setSetupStep,
      setExperienceLevel,
      setTargetRole,
      setTargetCompany,
      setCompanySearch,
      setCompanyTab,
      setResumeFile,
      setActiveResumeContext,
      setResultTab,
      setAnalysisResult,
      setExpandedMoment,
      setCaptionsOn,
      setWorkspacePanelOpen,
      setWorkspaceDropdownOpen,
      setSavedSession,
      setMicOn,
      setInterviewerVideoReady,
      setInterviewerVisibleMode,
      setTranscript,
      clearSavedSession,
      restoreSession,
      setShowEndConfirm,
      setCameraError,
      setAwaitingAnswer,
      handleLanguageChange,
      handleReset,
      startInterview,
      sendAnswer,
      endInterview,
      togglePause,
      toggleMic,
      toggleCamera,
      handleVoiceInput,
      startVoiceRecording,
      stopVoiceRecording,
      handleAskQuestion,
      startAnswer,
      speakInterviewerText,
      speakSequence,
      stopSilenceHandling,
      startSilenceHandling,
      logAPIError,
      createHttpError,
      getHttpStatus,
      handleInterviewerTimeUpdate,
      handleInterviewerLoadedMetadata,
      handleInterviewerCanPlay,
    },
    voiceAI,
    intelligence,
    isListening,
  };
}

export default useInterviewSession;
