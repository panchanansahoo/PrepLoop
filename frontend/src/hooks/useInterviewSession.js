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

export function useInterviewSession(options = {}) {
  const { user: _user, getAuthHeaders } = useAuth();

  const [phase, setPhase] = useState("lobby");
  const [interviewType, setInterviewType] = useState("technical");
  const [realtimeMode, setRealtimeMode] = useState(false);
  const [interviewerGender, setInterviewerGender] = useState(
    readStoredInterviewerGender,
  );

  // ─── Custom Admin Question Set State ───
  const initialQuestionSetCode =
    options?.questionSetCode ||
    (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("set")
      : null);
  const initialFocusArea = options?.focusArea || "";
  const [questionSetCode, setQuestionSetCode] = useState(initialQuestionSetCode);
  const [focusArea] = useState(initialFocusArea);
  const [customQuestionSet, setCustomQuestionSet] = useState(null);
  const [questionSetLoading, setQuestionSetLoading] = useState(false);
  const [questionSetError, setQuestionSetError] = useState(null);
  const allAdminQuestionsRef = useRef([]);
  const customQuestionSetRef = useRef(null);
  const customAttemptIdRef = useRef(null);
  const questionBankIdsRef = useRef([]);
  const currentQuestionIdRef = useRef(null);
  const submissionSentRef = useRef(false);
  const sessionSavedRef = useRef(false);
  const saveIdempotencyKeyRef = useRef(
    `ai-interview-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  );
  const [submissionStatus, setSubmissionStatus] = useState(null);

  useEffect(() => {
    if (!questionSetCode) return;
    let isCancelled = false;

    async function loadQuestionSet() {
      setQuestionSetLoading(true);
      setQuestionSetError(null);
      try {
        const res = await authFetch(`/api/interview/question-set/${questionSetCode}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to load question set");
        }
        const data = await res.json();
        if (!isCancelled && data?.questionSet) {
          const qs = data.questionSet;
          setCustomQuestionSet(qs);
          customQuestionSetRef.current = qs;
          allAdminQuestionsRef.current = qs.questions || [];
          if (qs.interviewType) {
            setInterviewType(qs.interviewType);
          }
          if (qs.questionCount) {
            setTotalQuestions(qs.questionCount);
          }
          if (qs.settings?.companyName) {
            setTargetCompany(qs.settings.companyName);
          }
          if (qs.settings?.roleName) {
            setTargetRole(qs.settings.roleName);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("[useInterviewSession] Question set load error:", err);
          setQuestionSetError(err.message);
        }
      } finally {
        if (!isCancelled) {
          setQuestionSetLoading(false);
        }
      }
    }

    loadQuestionSet();
    return () => {
      isCancelled = true;
    };
  }, [questionSetCode, authFetch]);

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
  const submittedQuestionKeyRef = useRef(null);
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

  // Keep the latest phase in a ref so async callbacks (TTS/handoff) see the
  // real phase instead of the value captured by an older render.
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // These callbacks are stable; depending on them (instead of the whole
  // `intelligence` object) avoids re-running effects on every score update.
  const { ingestTranscript, ingestAudioConfidence } = intelligence;

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Clear the "your turn" cue as soon as either side becomes active again,
  // or when the microphone failed so the real error can be shown.
  useEffect(() => {
    if (isListening || aiSpeaking || voiceAI.state === "error") {
      setAwaitingAnswer(false);
    }
  }, [isListening, aiSpeaking, voiceAI.state]);

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
    if (!isPausedRef.current && phaseRef.current === "interview" && !isListeningRef.current) {
      // Cancel any lingering speechSynthesis before starting recognition.
      // This is critical — SpeechRecognition can't capture audio while
      // speechSynthesis is still active on some browsers.
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();

      // While the browser settles (and if recognition fails to start), keep a
      // visible "your turn" cue so the candidate knows they can use the mic.
      setAwaitingAnswer(true);

      // Give the browser time to settle after TTS playback ends.
      // SpeechRecognition can fail to capture audio if started too quickly
      // after TTS/audio playback due to echo cancellation conflicts.
      // 800ms is more reliable than 500ms across browsers.
      setTimeout(() => {
        if (!isListeningRef.current && !isSendingRef.current && phaseRef.current === "interview" && !isPausedRef.current) {
          startVoiceRecording();
          // Safety retry: if SpeechRecognition didn't start, try again after 1.5s
          setTimeout(() => {
            if (!isListeningRef.current && !isSendingRef.current && phaseRef.current === "interview" && !isPausedRef.current) {
              console.log("[handoffToCandidate] Retry #1 starting voice recording");
              startVoiceRecording();
              // Extra safety retry at 3s
              setTimeout(() => {
                if (!isListeningRef.current && !isSendingRef.current && phaseRef.current === "interview" && !isPausedRef.current) {
                  console.log("[handoffToCandidate] Retry #2 starting voice recording");
                  startVoiceRecording();
                }
              }, 1500);
            }
          }, 1500);
        }
      }, 800);
    }
  }, [startVoiceRecording]);

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
      ingestTranscript(transcript);
    }
  }, [transcript, ingestTranscript]);

  useEffect(() => {
    if (voiceAI.inputLevel > 0) {
      lastSpeechTimestampRef.current = Date.now();
      ingestAudioConfidence(voiceAI.inputLevel);
    }
  }, [voiceAI.inputLevel, ingestAudioConfidence]);

  const [notes, setNotes] = useState("");
  const [savedSession, setSavedSession] = useState(null);
  const checkpointKeyRef = useRef(null);
  const checkpointVersionRef = useRef(0);
  const checkpointTimerRef = useRef(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    let storedKey = null;
    try {
      storedKey = window.localStorage.getItem(`${AI_INTERVIEW_SESSION_KEY}:key`);
    } catch { /* storage may be blocked */ }
    const generatedKey = storedKey || (
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `interview-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    );
    checkpointKeyRef.current = generatedKey;
    try {
      window.localStorage.setItem(`${AI_INTERVIEW_SESSION_KEY}:key`, generatedKey);
    } catch { /* storage may be blocked */ }

    let cancelled = false;
    if (_user?.id) {
      authFetch(`/api/company-interview/checkpoints/${generatedKey}`)
        .then((response) => response.ok ? response.json() : null)
        .then((data) => {
          const checkpoint = data?.checkpoint;
          if (!cancelled && checkpoint?.payload) {
            checkpointVersionRef.current = checkpoint.version || 0;
            setSavedSession((current) => {
              if (current?.timestamp && current.timestamp >= Date.parse(checkpoint.updated_at || 0)) return current;
              return checkpoint.payload;
            });
          }
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      if (checkpointTimerRef.current) clearTimeout(checkpointTimerRef.current);
    };
  }, [_user?.id]);

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
          sessionKey: checkpointKeyRef.current,
          timestamp: Date.now(),
        }),
      );

      if (_user?.id && checkpointKeyRef.current) {
        const payload = {
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
        const version = checkpointVersionRef.current + 1;
        checkpointVersionRef.current = version;
        if (checkpointTimerRef.current) clearTimeout(checkpointTimerRef.current);
        checkpointTimerRef.current = setTimeout(() => {
          authFetch(`/api/company-interview/checkpoints/${checkpointKeyRef.current}`, {
            method: "PUT",
            body: JSON.stringify({ payload, version }),
          }).catch(() => {});
        }, 750);
      }
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
    _user?.id,
  ]);

  const clearSavedSession = useCallback(() => {
    setSavedSession(null);
    try {
      window.localStorage.removeItem(AI_INTERVIEW_SESSION_KEY);
      window.localStorage.removeItem(`${AI_INTERVIEW_SESSION_KEY}:key`);
      if (checkpointTimerRef.current) clearTimeout(checkpointTimerRef.current);
      if (_user?.id && checkpointKeyRef.current) {
        authFetch(`/api/company-interview/checkpoints/${checkpointKeyRef.current}`, {
          method: "DELETE",
        }).catch(() => {});
      }
    } catch { /* empty */ }
  }, [_user?.id]);

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
    setLoading(false);
    setPhase("interview");
    // Mid-answer transcripts are not part of the checkpoint, so resume the
    // current question by opening the mic again instead of waiting for the
    // candidate to discover the mic button.
    setTimeout(() => handoffToCandidate(), 600);
  }, [handoffToCandidate]);

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
  const [resumeParseError, setResumeParseError] = useState(null);

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
  const analysisRequestIdRef = useRef(0);

  const generateAnalysis = useCallback(async () => {
    // Ignore a late response from an evaluation for a previous interview.
    const requestId = ++analysisRequestIdRef.current;
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
      if (requestId !== analysisRequestIdRef.current) return;
      if (data && !data.fallback && Number.isFinite(Number(data.overallScore))) {
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

    // A newer interview started while this request was in flight.
    if (requestId !== analysisRequestIdRef.current) return;

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

  const submitCustomInterview = useCallback(async () => {
    const code =
      questionSetCode ||
      customQuestionSetRef.current?.share_code ||
      customQuestionSetRef.current?.shareCode;
    if (!code || !customAttemptIdRef.current) {
      setSubmissionStatus("failed");
      return;
    }
    const candidateName =
      _user?.user_metadata?.full_name || _user?.fullName || _user?.email || "Candidate";
    try {
      const res = await authFetch(`/api/interview/question-set/${code}/submit`, {
        method: "POST",
        body: JSON.stringify({
          attemptId: customAttemptIdRef.current,
          responses: conversation || [],
          scores: analysisResult?.categories || {},
          overallScore: Math.round((analysisResult?.overallScore || 0) * 10),
          duration: elapsed || 0,
          userName: candidateName,
          userEmail: _user?.email || null,
        }),
      });
      if (res.ok) {
        setSubmissionStatus("saved");
        return;
      }
      const body = await res.json().catch(() => ({}));
      setSubmissionStatus(
        res.status === 401 ? "login-required" :
          res.status === 409 ? "already-submitted" : "failed",
      );
      console.error("[Interview] Custom submission failed:", body.error || res.status);
    } catch (err) {
      setSubmissionStatus("failed");
      console.error("[Interview] Custom submission failed:", err.message);
    }
  }, [analysisResult, authFetch, conversation, elapsed, _user, questionSetCode]);

  // Auto-submit custom interview submission when analysis completes.
  useEffect(() => {
    if (
      phase === "summary" &&
      analysisResult &&
      (customQuestionSetRef.current || questionSetCode) &&
      !submissionSentRef.current
    ) {
      submissionSentRef.current = true;
      submitCustomInterview();
    }
  }, [phase, analysisResult, questionSetCode, submitCustomInterview]);

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
    // Only count time the candidate can actually answer: pause the per-question
    // clock while the AI is thinking (loading) or speaking (aiSpeaking).
    if (phase === "interview" && !isPaused && !loading && !aiSpeaking) {
      questionTimerRef.current = setInterval(
        () => setQuestionElapsed((prev) => prev + 1),
        1000,
      );
    }
    return () => clearInterval(questionTimerRef.current);
  }, [phase, isPaused, loading, aiSpeaking]);

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

  // Persist the finished interview so it shows up in Interview History and
  // analytics. Best-effort: a failure here must never break the results page.
  useEffect(() => {
    if (phase !== "summary" || !analysisResult || !_user?.id) return;
    if (sessionSavedRef.current) return;
    sessionSavedRef.current = true;

    const scores = conversation
      .filter((m) => m.role === "feedback" && Number.isFinite(Number(m.score)))
      .map((m) => Number(m.score));
    const numericOverall = Number(analysisResult.overallScore);
    const overallScore = Number.isFinite(numericOverall)
      ? Math.round(numericOverall * 10)
      : 0;

    authFetch("/api/company-interview/save-session", {
      method: "POST",
      headers: { "Idempotency-Key": saveIdempotencyKeyRef.current },
      body: JSON.stringify({
        type: "single",
        company: targetCompany || "General",
        role: targetRole || "Software Engineer",
        stage: STAGE_API_MAP[interviewType] || "Technical",
        difficulty: experienceLevel === "fresher" ? "easy" : "medium",
        conversation,
        scores,
        overallScore,
        summaryData: analysisResult,
        completedAt: new Date().toISOString(),
      }),
    }).catch((error) => {
      console.warn("[Interview] Session save failed (non-critical):", error.message);
    });
  }, [
    phase,
    analysisResult,
    _user?.id,
    conversation,
    targetCompany,
    targetRole,
    interviewType,
    experienceLevel,
  ]);

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

  const handleLanguageChange = useCallback((newLang) => {
    setLanguage(newLang);
    if (!code || code === BOILERPLATE[language]) {
      setCode(BOILERPLATE[newLang] || BOILERPLATE.python);
    }
  }, [code, language]);

  const handleReset = useCallback(() => {
    setCode(BOILERPLATE[language] || BOILERPLATE.python);
  }, [language]);

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
    // A previous interview may have been ended while paused (or left pause
    // stats behind). Reset everything pause-related or the new session would
    // start frozen with the mic handoff suppressed.
    setIsPaused(false);
    isPausedRef.current = false;
    pauseStartRef.current = null;
    setTotalPauseTime(0);
    setInterviewerStatus("");
    setAwaitingAnswer(false);
    setAnalysisResult(null);
    setAnalysisLoading(false);
    analysisRequestIdRef.current += 1;
    customAttemptIdRef.current = null;
    questionBankIdsRef.current = [];
    currentQuestionIdRef.current = null;
    submissionSentRef.current = false;
    sessionSavedRef.current = false;
    saveIdempotencyKeyRef.current = `ai-interview-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    setSubmissionStatus(null);
    setQuestionSetError(null);
    setResumeParseError(null);
    submittedQuestionKeyRef.current = null;

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
      let resumeCtx = null;
      if (resumeFile) {
        resumeCtx = {
          candidateHeadline: `${experienceLevel === "experienced" ? "Experienced" : "Fresher"} ${resolvedRole}`,
          summary: `Resume uploaded: ${resumeFile.name}. Prioritize resume-based questioning and practical depth.`,
          coreSkills: inferredSkills,
          projectHighlights: [
            `Most relevant project from uploaded resume (${resumeFile.name})`,
          ],
          likelyQuestionAreas: [resolvedStage, ...inferredSkills.slice(0, 2)],
        };

        if (_user?.id) {
          const resumeForm = new FormData();
          resumeForm.append("resume", resumeFile);
          try {
            const resumeResponse = await authFetch("/api/portfolio/profiles/import-resume", {
              method: "POST",
              body: resumeForm,
            });
            if (!resumeResponse.ok) {
              const errorBody = await resumeResponse.json().catch(() => ({}));
              throw new Error(errorBody.error || `Resume parsing failed (${resumeResponse.status})`);
            }
            const parsedResume = await resumeResponse.json();
            const parsedProfile = parsedResume.parsed || {};
            const parsedSkills = parsedProfile.skills && typeof parsedProfile.skills === "object"
              ? Object.values(parsedProfile.skills).flat().filter(Boolean)
              : [];
            const parsedProjects = Array.isArray(parsedProfile.experience)
              ? parsedProfile.experience.slice(0, 6).map((project) => project.title || project.company || project.role || JSON.stringify(project))
              : [];
            const extractedText = typeof parsedResume.resumeText === "string"
              ? parsedResume.resumeText.slice(0, 12000)
              : "";
            resumeCtx = {
              ...resumeCtx,
              summary: parsedProfile.basicInfo?.summary || extractedText.slice(0, 1200) || resumeCtx.summary,
              coreSkills: parsedSkills.length > 0
                ? parsedSkills.slice(0, 12)
                : resumeCtx.coreSkills,
              projectHighlights: parsedProjects.length > 0
                ? parsedProjects
                : resumeCtx.projectHighlights,
              resumeText: extractedText,
            };
          } catch (resumeError) {
            setResumeParseError("Resume text could not be extracted. Starting with basic interview personalization.");
            console.warn("[Interview] Resume parsing failed; using metadata fallback:", resumeError.message);
          }
        }
      }

      setActiveResumeContext(resumeCtx);

      const startPayload = {
        company: resolvedCompany,
        role: resolvedRole,
        stage: resolvedStage,
        difficulty: experienceLevel === "fresher" ? "easy" : "medium",
        experienceLevel,
        totalQuestions,
        interactionFormat: "voice",
        advancedOptions: advancedOpts,
        resumeContext: resumeCtx,
        interviewerName: undefined,
        generateAllQuestions: true,
        focusArea: focusArea || undefined,
      };

      if (questionSetCode) {
        startPayload.questionSetCode = questionSetCode;
      }

      const [res] = await Promise.all([
        authFetch("/api/company-interview/start", {
          method: "POST",
          body: JSON.stringify(startPayload),
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
      if (data.questionSetId) {
        customQuestionSetRef.current = {
          ...(customQuestionSetRef.current || {}),
          id: data.questionSetId,
        };
      }
      if (data.attemptId) {
        customAttemptIdRef.current = data.attemptId;
      }
      questionBankIdsRef.current = Array.isArray(data.questionBank) ? data.questionBank : [];
      currentQuestionIdRef.current = data.questionMeta?.id || null;
      if (data.context?.totalQuestions) {
        setTotalQuestions(data.context.totalQuestions);
      }
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
      const prefetchPromise = voiceAI.prefetch(questionText);
      await Promise.all([prefetchPromise, minDelay]);

      setPhase("interview");
      phaseRef.current = "interview";
      setLoading(false);
      await speakInterviewerText(questionText);
      handoffToCandidate();
    } catch (error) {
      if (questionSetCode) {
        setQuestionSetError(
          error?.message || "Unable to continue this custom interview",
        );
        setLoading(false);
        setPhase("lobby");
        return;
      }
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
      if (questionSetCode) {
        setQuestionSetError(
          error?.message || "Unable to start this custom interview",
        );
        setLoading(false);
        return;
      }
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
      const prefetchPromise = voiceAI.prefetch(fallbackQ);
      await prefetchPromise;
      setLoading(false);
      setPhase("interview");
      phaseRef.current = "interview";
      await speakInterviewerText(fallbackQ);
      handoffToCandidate();
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

      const questionKey = `${questionIndexRef.current}:${currentQuestion}`;
      if (submittedQuestionKeyRef.current === questionKey) return;
      submittedQuestionKeyRef.current = questionKey;

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

        const followUpPayload = {
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
            .filter((m) => m.role === "interviewer" || m.role === "candidate" || m.role === "clarification-question")
            .slice(-12)
            .map((m) => ({
              role: m.role === "interviewer" ? "interviewer" : "candidate",
              content: m.content,
            })),
          code: code.trim() || undefined,
          codeLanguage: language,
          advancedOptions: followUpAdvancedOpts,
          resumeContext: activeResumeContext,
          useRealQuestions: questionBankIdsRef.current.length > 0,
          questionBankIds: questionBankIdsRef.current,
          currentQuestionId: currentQuestionIdRef.current,
        };

        if (allAdminQuestionsRef.current?.length > 0 || questionSetCode) {
          followUpPayload.questionSource = 'admin-custom';
          followUpPayload.questionSetCode = questionSetCode;
          followUpPayload.attemptId = customAttemptIdRef.current;
        }

        const res = await authFetch("/api/company-interview/follow-up", {
          method: "POST",
          body: JSON.stringify(followUpPayload),
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
        currentQuestionIdRef.current = data.questionMeta?.id || null;
        const feedbackScore = data.feedback?.score || data.score || 0;
        if (data.stageLabel) setStageLabel(data.stageLabel);

        const nextQ =
          data.followUpQuestion || data.nextQuestion || data.question;
        const closingRemark = data.closingRemark;
        const isInterviewOver = data.complete === true;

        // Per-answer feedback is part of the conversation so the sidebar,
        // results transcript, and /evaluate QA extraction all see it.
        const feedbackObject =
          data.feedback && typeof data.feedback === "object" ? data.feedback : null;
        const feedbackContent = String(
          typeof data.feedback === "string"
            ? data.feedback
            : feedbackObject?.content || feedbackObject?.text || "",
        ).trim();
        if (feedbackContent || feedbackScore) {
          setConversation((prev) => [
            ...prev,
            {
              role: "feedback",
              content: feedbackContent || "Answer recorded.",
              score: feedbackScore,
              strengths: Array.isArray(data.strengths) ? data.strengths : [],
              improvements: Array.isArray(data.improvements) ? data.improvements : [],
              hint: data.hint || "",
              reaction: data.interviewerReaction || null,
              timestamp: Date.now(),
            },
          ]);
        }

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
          await voiceAI.prefetch(continueQ);
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
          await voiceAI.prefetch(closingText);
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
          await voiceAI.prefetch(closingFallback);
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
          await voiceAI.prefetch(fallbackQ);
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

  // Stable entry point for memoized children. `sendAnswer` closes over a lot
  // of changing state, so the ref always points at the newest implementation.
  const dispatchSendAnswer = useCallback(
    (...args) => sendAnswerRef.current?.(...args),
    [],
  );

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

  // Latest interview context for the hint endpoint. Kept in a ref so the
  // silence-timer callback below stays stable across conversation updates.
  const hintContextRef = useRef({});
  const hintRequestedForRef = useRef("");
  const hintInFlightRef = useRef(false);
  useEffect(() => {
    hintContextRef.current = {
      currentQuestion,
      targetCompany,
      targetRole,
      interviewType,
      conversation,
    };
  }, [currentQuestion, targetCompany, targetRole, interviewType, conversation]);

  const requestHint = useCallback(async () => {
    const context = hintContextRef.current || {};
    const questionText = String(context.currentQuestion || "").trim();
    if (!questionText || hintInFlightRef.current) return;
    if (hintRequestedForRef.current === questionText) return;
    hintRequestedForRef.current = questionText;
    hintInFlightRef.current = true;
    try {
      const res = await authFetch("/api/company-interview/hint", {
        method: "POST",
        body: JSON.stringify({
          company: context.targetCompany || "Google",
          role: context.targetRole || "Software Engineer",
          stage: STAGE_API_MAP[context.interviewType] || "Technical",
          currentQuestion: questionText,
          conversationHistory: (context.conversation || [])
            .filter(
              (m) =>
                m.role === "interviewer" ||
                m.role === "candidate" ||
                m.role === "clarification-question",
            )
            .slice(-6)
            .map((m) => ({
              role: m.role === "interviewer" ? "interviewer" : "candidate",
              content: m.content,
            })),
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const hintText = String(data?.hint || "").trim();
      // Don't pop a hint over an answer that has already started.
      if (hintText && !hasRecentSpeech()) {
        setActiveHint({ isHint: true, hintTier: 1, hintMessage: hintText });
      }
    } catch {
      // Hints are best-effort; a failure must never interrupt the interview.
    } finally {
      hintInFlightRef.current = false;
    }
  }, [hasRecentSpeech]);

  const startSilenceHandling = useCallback(() => {
    stopSilenceHandling();
    if (phase !== "interview") return;

    // Stage 1: Show encouragement after 12s of silence (was 8s)
    silenceStageTimerRef.current = setTimeout(() => {
      if (!isListeningRef.current || hasRecentSpeech()) return;
      setSilenceStage(1);
      setInterviewerStatus(getSilencePrompt(interviewType, 0));
      requestHint();

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
          // The candidate may have answered while the rephrase was spoken.
          // In that case the follow-up flow owns the microphone now: do not
          // restart recognition or schedule a stale auto-skip timer.
          if (
            isPausedRef.current ||
            phaseRef.current !== "interview" ||
            isSendingRef.current
          )
            return;
          if (!isListeningRef.current) startVoiceRecording();
          // Stage 3: Auto-skip after another 15s of silence (42s total)
          silenceStageTimerRef.current = setTimeout(() => {
            // Never burn a question while the tab is in the background.
            if (document.hidden || hasRecentSpeech()) return;
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
    requestHint,
  ]);

  useEffect(() => {
    // Don't nudge or skip while the candidate is composing a typed answer in
    // the chat panel — that reads as the system talking over them.
    if (isListening && !transcript.trim() && !userInput.trim() && !aiSpeaking)
      startSilenceHandling();
    else stopSilenceHandling();
  }, [
    isListening,
    transcript,
    userInput,
    aiSpeaking,
    startSilenceHandling,
    stopSilenceHandling,
  ]);

  const endInterview = useCallback((completionReason = "user_ended") => {
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
    setIsPaused(false);
    isPausedRef.current = false;
    pauseStartRef.current = null;
    setInterviewerStatus("");
    voiceAI.cleanup();
    try {
      const stats = voiceAI.getAnalytics();
      console.info("[AI Interview] Voice analytics:", stats);
    } catch { /* empty */ }
    clearSavedSession();
    if (questionSetCode && customAttemptIdRef.current) {
      authFetch(`/api/company-interview/attempt/${customAttemptIdRef.current}/terminate`, {
        method: "POST",
        body: JSON.stringify({ reason: completionReason }),
      }).catch((error) => {
        console.error("[Interview] Failed to finalize custom attempt:", error.message);
      });
    }
    setAnalysisLoading(true);
    setPhase("summary");
    phaseRef.current = "summary";
  }, [authFetch, clearSavedSession, questionSetCode, stopVoiceRecording, voiceAI]);

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
    if (isPausedRef.current) return;
    if (isListening) {
      // If user has spoken something, submit it instead of discarding
      const currentTranscript = stateRefs.current.transcript.trim();
      const interimText = (voiceAI.interimText || "").trim();
      const hasVoiceContent = currentTranscript.length > 0 || interimText.length > 0;
      if (hasVoiceContent) {
        // Submit the voice answer
        if (sendAnswerRef.current) sendAnswerRef.current(false);
      } else {
        stopVoiceRecording();
      }
    } else {
      startVoiceRecording();
    }
  }, [isListening, stopVoiceRecording, startVoiceRecording, voiceAI]);

  const toggleCamera = useCallback(() => {
    if (cameraOn && streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    }
    setCameraOn((prev) => !prev);
  }, [cameraOn, streamRef, videoRef]);

  const handleVoiceInput = useCallback(() => {
    if (isListening) {
      // If user has spoken something, submit it instead of discarding
      const currentTranscript = stateRefs.current.transcript.trim();
      const interimText = (voiceAI.interimText || "").trim();
      const hasVoiceContent = currentTranscript.length > 0 || interimText.length > 0;
      if (hasVoiceContent) {
        if (sendAnswerRef.current) sendAnswerRef.current(false);
      } else {
        stopVoiceRecording();
      }
    } else if (!isPausedRef.current) {
      startVoiceRecording();
    }
  }, [isListening, stopVoiceRecording, startVoiceRecording, voiceAI.interimText]);

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
          // Deliberately not "candidate": /evaluate treats any candidate turn
          // after an interviewer question as the answer, which would replace
          // the real answer with this clarifying question.
          role: "clarification-question",
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
    if (isPausedRef.current) return;
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
      isOnline,
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
      resumeParseError,
      resultTab,
      analysisResult,
      expandedMoment,
      captionsOn,
      workspacePanelOpen,
      workspaceDropdownOpen,
      questionSetCode,
      customQuestionSet,
      questionSetLoading,
      questionSetError,
      submissionStatus,
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
      setResumeParseError,
      setResultTab,
      setAnalysisResult,
      setExpandedMoment,
      setCaptionsOn,
      setWorkspacePanelOpen,
      setWorkspaceDropdownOpen,
      setSavedSession,
      retryCustomSubmission: submitCustomInterview,
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
      sendAnswer: dispatchSendAnswer,
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
