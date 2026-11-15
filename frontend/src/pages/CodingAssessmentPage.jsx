import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  Clock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  CircleDot,
  Circle,
  Play,
  Send,
  RotateCcw,
  Maximize2,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Code2,
  Check,
  X,
  Loader2,
  Terminal,
  FileText,
  Award,
  Info,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Sliders,
  Download,
  Share2,
  Eye,
  Video,
  Layers,
  Settings2,
  FileCode,
  Sparkles,
  Copy,
  CheckCheck,
  Lightbulb,
  History,
  AlignLeft,
  Minus,
  Plus,
  Move,
} from 'lucide-react';
import useCodingAssessment, { COMPANY_FOCUS_POOLS } from '../hooks/useCodingAssessment';
import { PROBLEMS } from '../data/problemsDatabase';
import { CandidateReviewDossier } from '../components/interview/CandidateReviewDossier';
import './CodingAssessmentPage.css';

// ─── Supported Languages Configuration ───
const SUPPORTED_LANGUAGES = [
  { id: 'python', label: 'Python (3.10)', monaco: 'python' },
  { id: 'javascript', label: 'JavaScript (Node.js)', monaco: 'javascript' },
  { id: 'cpp', label: 'C++ (GCC 11)', monaco: 'cpp' },
  { id: 'java', label: 'Java (OpenJDK 17)', monaco: 'java' },
  { id: 'go', label: 'Go (1.20)', monaco: 'go' },
];

const DEFAULT_BOILERPLATES = {
  python: `# Write your solution here\nclass Solution:\n    def solve(self):\n        pass\n`,
  javascript: `// Write your solution here\nfunction solve() {\n    \n}\n`,
  cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        \n    }\n};\n`,
  java: `import java.util.*;\n\nclass Solution {\n    public void solve() {\n        \n    }\n}\n`,
  go: `package main\n\nimport "fmt"\n\nfunc solve() {\n    \n}\n`,
};

function formatTime(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return '00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatInputForDisplay(input, slug) {
  if (input === undefined || input === null) return '';

  if (slug === 'course-schedule' && Array.isArray(input) && input.length === 2) {
    return `numCourses = ${JSON.stringify(input[0])}\nprerequisites = ${JSON.stringify(input[1])}`;
  }
  if (slug === 'two-sum' && Array.isArray(input)) {
    if (input.length === 2) {
      return `nums = ${JSON.stringify(input[0])}\ntarget = ${JSON.stringify(input[1])}`;
    }
    return `nums = ${JSON.stringify(input)}`;
  }
  if (slug === '3sum' && Array.isArray(input)) {
    const arr = Array.isArray(input[0]) ? input[0] : input;
    return `nums = ${JSON.stringify(arr)}`;
  }
  if (slug === 'number-of-islands' && Array.isArray(input)) {
    const grid = Array.isArray(input[0]) && Array.isArray(input[0][0]) ? input[0] : input;
    return `grid = ${JSON.stringify(grid)}`;
  }
  if (slug === 'product-of-array-except-self' && Array.isArray(input)) {
    const arr = Array.isArray(input[0]) ? input[0] : input;
    return `nums = ${JSON.stringify(arr)}`;
  }
  if (slug === 'valid-parentheses') {
    const str = Array.isArray(input) ? input[0] : input;
    return `s = ${JSON.stringify(str)}`;
  }
  if (slug === 'longest-substring-without-repeating-characters') {
    const str = Array.isArray(input) ? input[0] : input;
    return `s = ${JSON.stringify(str)}`;
  }
  if (slug === 'trapping-rain-water' && Array.isArray(input)) {
    const arr = Array.isArray(input[0]) ? input[0] : input;
    return `height = ${JSON.stringify(arr)}`;
  }

  if (Array.isArray(input)) {
    if (input.length === 1 && typeof input[0] === 'object') {
      return JSON.stringify(input[0], null, 2);
    }
    return input.map((val, i) => `arg${i + 1} = ${typeof val === 'object' ? JSON.stringify(val) : String(val)}`).join('\n');
  }

  if (typeof input === 'object') {
    return JSON.stringify(input, null, 2);
  }

  return String(input);
}

function formatOutputForDisplay(output) {
  if (output === undefined || output === null) return '';
  if (typeof output === 'object') {
    return JSON.stringify(output);
  }
  return String(output);
}

export default function CodingAssessmentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve multiRoundContext if available
  const multiRoundCtx = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('multiRoundContext');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const company = searchParams.get('company') || multiRoundCtx?.company || 'google';
  const role = searchParams.get('role') || multiRoundCtx?.role || 'SDE';
  const difficulty = searchParams.get('difficulty') || multiRoundCtx?.difficulty || 'Medium';
  const isMultiRound = searchParams.get('multiRound') === 'true' || Boolean(multiRoundCtx?.multiRound);

  // Configurable parameters from URL or context
  const initialDuration = parseInt(searchParams.get('duration') || searchParams.get('durationMinutes') || '60', 10);
  const countParam = searchParams.get('count') || searchParams.get('questionCount');
  const initialQuestions = searchParams.get('questions') || searchParams.get('problemIds') || searchParams.get('q') || null;
  const parsedQuestionsCount = initialQuestions ? initialQuestions.split(',').filter(Boolean).length : 2;
  const initialCount = countParam ? parseInt(countParam, 10) : (initialQuestions ? parsedQuestionsCount : 2);

  // Consume assessment engine hook
  const assessment = useCodingAssessment({
    company,
    role,
    difficulty,
    durationMinutes: initialDuration,
    questionCount: initialCount,
    questions: initialQuestions,
  });

  const {
    phase = 'lobby',
    setPhase,
    currentProblemIndex = 0,
    setCurrentProblemIndex,
    problems = [],
    userSolutions = {},
    code: hookCode,
    setCode: hookSetCode,
    language = 'python',
    setLanguage,
    customInput = '',
    setCustomInput,
    isRunning = false,
    isSubmitting = false,
    runOutput = null,
    timeRemaining = 3600,
    tabSwitchCount = 0,
    proctoringWarning = null,
    finalScore = null,
    startExam,
    runCode,
    submitCode,
    submitExam,
    updateSolution,
    resetCode,
    // Customization & Setup
    durationMinutes = 60,
    setDurationMinutes,
    questionCount = 2,
    setQuestionCount,
    selectedQuestionIds,
    setSelectedQuestionIds,
    // Webcam & Proctoring
    webcamEnabled = false,
    audioEnabled = false,
    webcamStream = null,
    enableWebcam,
    disableWebcam,
    cameraSnapshots = [],
    captureSnapshot,
    proctoringLogs = [],
    submissionsHistory = {},
    restoreSubmissionCode,
  } = assessment || {};

  // Local UI State
  const [activeLeftTab, setActiveLeftTab] = useState('description'); // 'description' | 'editorial' | 'submissions'
  const [activeDrawerTab, setActiveDrawerTab] = useState('cases'); // 'cases' | 'custom' | 'results'
  const [activeSampleCaseIdx, setActiveSampleCaseIdx] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [dismissedWarning, setDismissedWarning] = useState(false);
  const [leftWidth, setLeftWidth] = useState(44); // 44% problem description, 56% editor
  const [drawerHeight, setDrawerHeight] = useState(240); // 140px to 480px
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  const [fontSize, setFontSize] = useState(13.5);
  const [editorTheme, setEditorTheme] = useState('vs-dark'); // 'vs-dark' | 'hc-black'
  const [copiedInputIdx, setCopiedInputIdx] = useState(null);
  const [expandedHints, setExpandedHints] = useState({});
  const [pipMinimized, setPipMinimized] = useState(false);
  const [camPos, setCamPos] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('preploop_assessment_cam_pos');
        if (saved) return JSON.parse(saved);
      }
    } catch {}
    return { preset: 'top-right', x: null, y: null };
  });
  const isCamDraggingRef = useRef(false);
  const camDragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });
  const camOverlayRef = useRef(null);

  const prevTabSwitchCountRef = useRef(tabSwitchCount);
  const isDraggingRef = useRef(false);
  const isDrawerDraggingRef = useRef(false);
  const startDragYRef = useRef(0);
  const startHeightRef = useRef(240);

  // Proctoring camera drag handler (Mouse & Touch)
  const handleCamMouseDown = useCallback((e) => {
    if (e.target.closest('button')) return;
    isCamDraggingRef.current = true;
    const rect = camOverlayRef.current?.getBoundingClientRect();
    camDragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: rect?.left || 0,
      startY: rect?.top || 0,
    };
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'move';
      document.body.style.userSelect = 'none';
    }
  }, []);

  const handleCamTouchStart = useCallback((e) => {
    if (e.target.closest('button')) return;
    const touch = e.touches?.[0];
    if (!touch) return;
    isCamDraggingRef.current = true;
    const rect = camOverlayRef.current?.getBoundingClientRect();
    camDragStartRef.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      startX: rect?.left || 0,
      startY: rect?.top || 0,
    };
  }, []);

  const setCamPreset = useCallback((presetName) => {
    const nextPos = { preset: presetName, x: null, y: null };
    setCamPos(nextPos);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('preploop_assessment_cam_pos', JSON.stringify(nextPos));
      }
    } catch {}
  }, []);

  const camStyle = useMemo(() => {
    const base = {
      position: 'fixed',
      zIndex: 9999,
    };
    if (camPos.preset === 'custom' && camPos.x !== null && camPos.y !== null) {
      return {
        ...base,
        left: `${camPos.x}px`,
        top: `${camPos.y}px`,
        right: 'auto',
        bottom: 'auto',
      };
    }
    if (camPos.preset === 'top-left') {
      return { ...base, top: '70px', left: '20px', right: 'auto', bottom: 'auto' };
    }
    if (camPos.preset === 'bottom-left') {
      return { ...base, bottom: '24px', left: '20px', right: 'auto', top: 'auto' };
    }
    if (camPos.preset === 'bottom-right') {
      return { ...base, bottom: '24px', right: '20px', left: 'auto', top: 'auto' };
    }
    // Default: 'top-right'
    return { ...base, top: '70px', right: '20px', left: 'auto', bottom: 'auto' };
  }, [camPos]);

  // Pane dragging handler (Horizontal)
  const handleResizerMouseDown = useCallback((e) => {
    isDraggingRef.current = true;
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
  }, []);

  // Drawer dragging handler (Vertical)
  const handleDrawerResizerMouseDown = useCallback((e) => {
    isDrawerDraggingRef.current = true;
    startDragYRef.current = e.clientY;
    startHeightRef.current = drawerHeight;
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    }
  }, [drawerHeight]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Horizontal split resizer
      if (isDraggingRef.current) {
        const clientX = e.clientX ?? e.touches?.[0]?.clientX;
        if (clientX !== undefined) {
          const pct = (clientX / window.innerWidth) * 100;
          if (pct >= 28 && pct <= 70) {
            setLeftWidth(pct);
          }
        }
      }
      // Vertical console drawer resizer
      if (isDrawerDraggingRef.current) {
        const clientY = e.clientY ?? e.touches?.[0]?.clientY;
        if (clientY !== undefined) {
          const deltaY = startDragYRef.current - clientY;
          const newHeight = Math.max(140, Math.min(startHeightRef.current + deltaY, 520));
          setDrawerHeight(newHeight);
          if (isDrawerCollapsed) setIsDrawerCollapsed(false);
        }
      }
      // Proctoring camera overlay drag
      if (isCamDraggingRef.current) {
        const clientX = e.clientX ?? e.touches?.[0]?.clientX;
        const clientY = e.clientY ?? e.touches?.[0]?.clientY;
        if (clientX !== undefined && clientY !== undefined) {
          const deltaX = clientX - camDragStartRef.current.mouseX;
          const deltaY = clientY - camDragStartRef.current.mouseY;
          const newX = Math.max(10, Math.min(window.innerWidth - 195, camDragStartRef.current.startX + deltaX));
          const newY = Math.max(55, Math.min(window.innerHeight - 150, camDragStartRef.current.startY + deltaY));
          setCamPos({ preset: 'custom', x: newX, y: newY });
        }
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current || isDrawerDraggingRef.current || isCamDraggingRef.current) {
        if (isCamDraggingRef.current) {
          isCamDraggingRef.current = false;
          setCamPos(current => {
            try {
              if (typeof window !== 'undefined' && window.localStorage && current.preset === 'custom') {
                window.localStorage.setItem('preploop_assessment_cam_pos', JSON.stringify(current));
              }
            } catch {}
            return current;
          });
        }
        isDraggingRef.current = false;
        isDrawerDraggingRef.current = false;
        if (typeof document !== 'undefined') {
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDrawerCollapsed]);

  // Copy sample test input to clipboard
  const handleCopyInput = useCallback((text, idx) => {
    const str = typeof text === 'object' ? JSON.stringify(text) : String(text ?? '');
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(str);
      } else if (typeof document !== 'undefined') {
        const ta = document.createElement('textarea');
        ta.value = str;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedInputIdx(idx);
      setTimeout(() => setCopiedInputIdx(null), 2000);
    } catch (e) {
      console.warn('Clipboard copy failed:', e);
    }
  }, []);

  // Toggle hints accordion
  const toggleHint = useCallback((idx) => {
    setExpandedHints(prev => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  // Zoom controls for Monaco editor
  const handleZoomIn = useCallback(() => setFontSize(prev => Math.min(prev + 1, 18)), []);
  const handleZoomOut = useCallback(() => setFontSize(prev => Math.max(prev - 1, 11)), []);

  // Customizer UI State
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customQuestionsInput, setCustomQuestionsInput] = useState(initialQuestions || '');
  const [activeCompanyPreset, setActiveCompanyPreset] = useState(company.toLowerCase());

  // Scorecard / Recruiter UI State
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [showSnapshotsGallery, setShowSnapshotsGallery] = useState(false);
  const [codeDiffProblem, setCodeDiffProblem] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Video refs for webcam feed
  const lobbyVideoRef = useRef(null);
  const examVideoRef = useRef(null);

  // Attach webcam stream to lobby video element
  useEffect(() => {
    if (lobbyVideoRef.current && webcamStream) {
      try {
        lobbyVideoRef.current.srcObject = webcamStream;
      } catch (e) {
        console.warn('Lobby video attachment error:', e);
      }
    }
  }, [webcamStream, phase, webcamEnabled]);

  // Attach webcam stream to exam PIP video element
  useEffect(() => {
    if (examVideoRef.current && webcamStream) {
      try {
        examVideoRef.current.srcObject = webcamStream;
      } catch (e) {
        console.warn('Exam video attachment error:', e);
      }
    }
  }, [webcamStream, phase, webcamEnabled, pipMinimized]);

  // Periodic camera snapshots during active examination
  useEffect(() => {
    if (phase !== 'exam' || !webcamEnabled) return;
    const interval = setInterval(() => {
      if (typeof captureSnapshot === 'function' && examVideoRef.current) {
        captureSnapshot(examVideoRef.current, 'Periodic AI Verification');
      }
    }, 45000);
    return () => clearInterval(interval);
  }, [phase, webcamEnabled, captureSnapshot]);

  // Auto-switch to results tab on run / submit
  useEffect(() => {
    if (isRunning || isSubmitting || runOutput) {
      setActiveDrawerTab('results');
    }
  }, [isRunning, isSubmitting, runOutput]);

  // Re-show proctoring alert if tabSwitchCount increments
  useEffect(() => {
    if (tabSwitchCount > prevTabSwitchCountRef.current) {
      setDismissedWarning(false);
      prevTabSwitchCountRef.current = tabSwitchCount;
    }
  }, [tabSwitchCount]);

  // Global keyboard shortcuts (Ctrl+Enter to Run, Ctrl+Shift+Enter to Submit)
  useEffect(() => {
    if (phase !== 'exam') return;
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          if (typeof submitCode === 'function') submitCode();
        } else {
          if (typeof runCode === 'function') runCode();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, runCode, submitCode]);

  // Safe Start Exam with Fullscreen Request
  const handleStartExam = useCallback(async () => {
    try {
      if (typeof document !== 'undefined' && document.documentElement?.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request bypassed or not permitted:', err);
    }

    // Capture initial exam entry snapshot
    if (webcamEnabled && typeof captureSnapshot === 'function') {
      captureSnapshot(lobbyVideoRef.current, 'Exam Entry Snapshot');
    }

    if (typeof startExam === 'function') {
      startExam();
    } else if (typeof setPhase === 'function') {
      setPhase('exam');
    }
  }, [startExam, setPhase, webcamEnabled, captureSnapshot]);

  // Current problem safe accessor
  const currentProblem = useMemo(() => {
    if (!problems || problems.length === 0) return null;
    return problems[currentProblemIndex] || problems[0];
  }, [problems, currentProblemIndex]);

  // Current solution & code
  const currentSolution = currentProblem ? (userSolutions[currentProblem.id] || {}) : {};
  const currentCode = hookCode !== undefined
    ? hookCode
    : (currentSolution.code !== undefined
      ? currentSolution.code
      : (currentProblem?.starter_code?.[language] || DEFAULT_BOILERPLATES[language] || ''));

  // Handle Code Change
  const handleCodeChange = (newCode) => {
    if (typeof hookSetCode === 'function') {
      hookSetCode(newCode);
    } else if (typeof updateSolution === 'function') {
      if (currentProblem) {
        updateSolution(currentProblem.id, { code: newCode, language });
      }
    } else if (assessment?.setUserSolutions && currentProblem) {
      assessment.setUserSolutions((prev) => ({
        ...prev,
        [currentProblem.id]: {
          ...(prev?.[currentProblem.id] || {}),
          code: newCode,
          language,
        },
      }));
    }
  };

  // Handle Reset Template
  const handleResetTemplate = () => {
    if (typeof resetCode === 'function') {
      resetCode();
    } else {
      const defaultCode = currentProblem?.starter_code?.[language] || DEFAULT_BOILERPLATES[language] || '';
      handleCodeChange(defaultCode);
    }
  };

  // Solved Count
  const solvedCount = useMemo(() => {
    if (!problems) return 0;
    return problems.filter((p) => userSolutions[p.id]?.status === 'solved').length;
  }, [problems, userSolutions]);

  // Format Company Name
  const formattedCompany = company ? company.charAt(0).toUpperCase() + company.slice(1) : 'Company';

  // Format Difficulty Class
  const diffClass = useMemo(() => {
    const d = (currentProblem?.difficulty || difficulty || 'Medium').toLowerCase();
    if (d.includes('easy')) return 'ca-pill-diff-easy';
    if (d.includes('hard')) return 'ca-pill-diff-hard';
    return 'ca-pill-diff-medium';
  }, [currentProblem, difficulty]);

  // Navigate next / round 2 from scorecard
  const handleAdvanceToRound2 = () => {
    if (isMultiRound) {
      navigate(`/multi-round-interview?company=${company}&role=${role}&difficulty=${difficulty}`);
    } else {
      navigate(`/company-interview?company=${company}&role=${role}&difficulty=${difficulty}`);
    }
  };

  // Back navigation handler (returns to previous page or home)
  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }, [navigate]);

  // Exit exam confirmation handler
  const handleExitExam = useCallback(() => {
    if (window.confirm('Are you sure you want to exit the assessment? Your unsubmitted progress will be lost.')) {
      if (typeof setPhase === 'function') {
        setPhase('lobby');
      } else {
        handleBack();
      }
    }
  }, [setPhase, handleBack]);

  // Apply custom question selection
  const handleApplyQuestions = (questionString) => {
    setCustomQuestionsInput(questionString);
    if (typeof setSelectedQuestionIds === 'function') {
      setSelectedQuestionIds(questionString);
    }
  };

  // Download JSON assessment report
  const handleDownloadReport = () => {
    const scoreData = finalScore || {
      totalPoints: solvedCount * 100,
      maxPoints: (problems.length || 2) * 100,
      percentage: Math.round((solvedCount / (problems.length || 1)) * 100),
      passedProblems: solvedCount,
      totalProblems: problems.length || 2,
      verdict: solvedCount >= 1 ? 'Qualified for Round 2: Technical Interview' : 'Assessment Completed',
    };

    const report = {
      platform: 'PrepLoop HackerRank-Style Assessment Engine',
      exportedAt: new Date().toISOString(),
      candidate: {
        role,
        company: formattedCompany,
        difficulty,
      },
      evaluation: {
        overallScore: scoreData.percentage,
        totalPoints: scoreData.totalPoints,
        maxPoints: scoreData.maxPoints,
        passedProblems: `${scoreData.passedProblems} / ${scoreData.totalProblems}`,
        verdict: scoreData.verdict,
        durationMinutes,
        timeRemainingSeconds: timeRemaining,
      },
      proctoring: {
        tabSwitches: tabSwitchCount,
        webcamVerified: webcamEnabled || cameraSnapshots.length > 0,
        snapshotCount: cameraSnapshots.length,
        integrityScore: Math.max(0, 100 - (tabSwitchCount * 15)),
        auditLogs: proctoringLogs,
      },
      problems: problems.map((prob, idx) => {
        const sol = userSolutions[prob.id] || {};
        return {
          problemNumber: idx + 1,
          id: prob.id,
          title: prob.title,
          difficulty: prob.difficulty,
          status: sol.status || 'unattempted',
          score: sol.status === 'solved' ? 100 : (sol.status === 'attempted' ? 30 : 0),
          code: sol.code || '',
          language: sol.language || language,
          testResults: sol.testResults || [],
        };
      }),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PrepLoop_${formattedCompany}_OA_Candidate_Report.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Recruiter Dossier object representation
  const dossierSubmission = useMemo(() => {
    const scoreData = finalScore || {
      percentage: Math.round((solvedCount / (problems.length || 1)) * 100),
      totalPoints: solvedCount * 100,
      maxPoints: (problems.length || 2) * 100,
      verdict: solvedCount >= 1 ? 'Qualified for Round 2: Technical Interview' : 'Assessment Completed',
    };

    return {
      id: `oa-${Date.now()}`,
      overall_score: scoreData.percentage,
      duration: durationMinutes * 60 - timeRemaining,
      created_at: new Date().toISOString(),
      user: {
        full_name: 'Candidate (Online Assessment)',
        email: 'candidate@preploop.internal',
        target_role: role,
        target_company: formattedCompany,
      },
      scores: {
        serverOverallScore: scoreData.percentage,
        score: scoreData.percentage,
        passingScore: 70,
        decision: scoreData.percentage >= 70 ? 'qualified' : 'review_needed',
        integrity: {
          tabSwitches: tabSwitchCount,
          cameraVerified: webcamEnabled || cameraSnapshots.length > 0,
          integrityScore: Math.max(0, 100 - (tabSwitchCount * 15)),
        },
        breakdown: problems.map(p => {
          const sol = userSolutions[p.id] || {};
          return {
            topic: p.title,
            score: sol.status === 'solved' ? 100 : (sol.status === 'attempted' ? 30 : 0),
            status: sol.status || 'unattempted',
            difficulty: p.difficulty,
          };
        }),
      },
      codeSubmissions: problems.map(p => ({
        problemId: p.id,
        title: p.title,
        code: userSolutions[p.id]?.code || '',
        language: userSolutions[p.id]?.language || language,
      })),
      proctoringLogs,
      cameraSnapshots,
    };
  }, [finalScore, solvedCount, problems, durationMinutes, timeRemaining, role, formattedCompany, tabSwitchCount, webcamEnabled, cameraSnapshots, userSolutions, language, proctoringLogs]);

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 1: LOBBY
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'lobby') {
    return (
      <div className="coding-assessment-container">
        <div className="ca-lobby-wrapper">
          {/* Lobby Topbar Navigation */}
          <header className="ca-lobby-nav">
            <button
              type="button"
              className="ca-btn-back"
              onClick={handleBack}
              title="Back"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <div className="ca-lobby-nav-brand">
              <Terminal size={15} className="ca-nav-brand-icon" />
              <span>PrepLoop Coding Assessment</span>
            </div>
            <div className="ca-lobby-nav-meta">
              <span className="ca-nav-meta-badge">{formattedCompany}</span>
              <span className="ca-nav-meta-role">Assessment Lobby</span>
            </div>
          </header>

          <div className="ca-lobby-card">
            {/* Header / Company Info */}
            <div className="ca-lobby-header">
              <div className="ca-company-badge-wrap">
                <div className="ca-company-logo">
                  {formattedCompany.charAt(0)}
                </div>
                <div className="ca-lobby-titles">
                  <h1>{formattedCompany} Online Assessment</h1>
                  <div className="ca-lobby-meta">
                    <span className="ca-pill ca-pill-role">{role}</span>
                    <span className={`ca-pill ${diffClass}`}>{difficulty} Level</span>
                  </div>
                </div>
              </div>

              {/* Admin / Recruiter Customizer Toggle */}
              <button
                type="button"
                className="ca-btn-customize-toggle"
                onClick={() => setShowCustomizer(!showCustomizer)}
                title="Configure custom duration, questions or company pool"
              >
                <Sliders size={16} />
                <span>{showCustomizer ? 'Close Customizer' : 'Customize Exam'}</span>
              </button>
            </div>

            {/* Exam Specs Grid */}
            <div className="ca-specs-grid">
              <div className="ca-spec-card">
                <Code2 size={22} className="ca-spec-icon" />
                <span className="ca-spec-label">Problems</span>
                <span className="ca-spec-val">{problems.length || 2} Coding Challenges</span>
              </div>
              <div className="ca-spec-card">
                <Clock size={22} className="ca-spec-icon" />
                <span className="ca-spec-label">Time Limit</span>
                <span className="ca-spec-val">{durationMinutes || 60} Minutes</span>
              </div>
              <div className="ca-spec-card">
                <ShieldAlert size={22} className="ca-spec-icon" />
                <span className="ca-spec-label">Proctoring</span>
                <span className="ca-spec-val">Tab Focus Tracking</span>
              </div>
              <div className="ca-spec-card">
                <Award size={22} className="ca-spec-icon" />
                <span className="ca-spec-label">Pass Cutoff</span>
                <span className="ca-spec-val">70% to Advance</span>
              </div>
            </div>

            {/* ── Webcam & Audio Pre-Flight Check ── */}
            <div className="ca-preflight-panel">
              <div className="ca-preflight-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Video size={18} color="#10b981" />
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                    Proctoring & Identity Pre-Flight Check
                  </h3>
                </div>
                <button
                  type="button"
                  className={`ca-btn-cam-toggle ${webcamEnabled ? 'active' : ''}`}
                  onClick={() => {
                    if (webcamEnabled) {
                      disableWebcam?.();
                    } else {
                      enableWebcam?.();
                    }
                  }}
                >
                  {webcamEnabled ? <Camera size={16} /> : <CameraOff size={16} />}
                  <span>{webcamEnabled ? 'Camera Active (Verified ✓)' : 'Enable Webcam & Mic Pre-Check'}</span>
                </button>
              </div>

              <div className="ca-preflight-body">
                {/* Live Video Preview Box */}
                <div className="ca-cam-preview-box">
                  {webcamEnabled ? (
                    <video
                      ref={lobbyVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="ca-cam-preview-video"
                    />
                  ) : (
                    <div className="ca-cam-placeholder">
                      <Camera size={36} color="#64748b" />
                      <span>Click "Enable Webcam & Mic" to test video & audio integrity</span>
                    </div>
                  )}
                  {webcamEnabled && (
                    <div className="ca-cam-live-indicator">
                      <span className="ca-live-dot" />
                      <span>Live Identity Feed</span>
                    </div>
                  )}
                </div>

                {/* Preflight Checklist */}
                <div className="ca-preflight-checks">
                  <div className={`ca-check-row ${webcamEnabled ? 'verified' : 'pending'}`}>
                    {webcamEnabled ? <CheckCircle size={16} /> : <Circle size={16} />}
                    <span>Webcam verification: {webcamEnabled ? 'Connected & Operational' : 'Ready to enable'}</span>
                  </div>
                  <div className={`ca-check-row ${audioEnabled ? 'verified' : 'pending'}`}>
                    {audioEnabled ? <CheckCircle size={16} /> : <Circle size={16} />}
                    <span>Audio presence detection: {audioEnabled ? 'Active Microphone' : 'Standby'}</span>
                  </div>
                  <div className="ca-check-row verified">
                    <CheckCircle size={16} />
                    <span>Fullscreen & Tab Focus Proctoring: Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Expandable Admin / Recruiter Customizer ── */}
            {showCustomizer && (
              <div className="ca-customizer-drawer">
                <div className="ca-customizer-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Settings2 size={18} color="#38bdf8" />
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                      Assessment Setup & Custom Question Pool
                    </h3>
                  </div>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Admin & Recruiter Mode</span>
                </div>

                <div className="ca-customizer-content">
                  {/* Company Focus Presets */}
                  <div className="ca-custom-section">
                    <label className="ca-custom-label">Company Specialization Pools:</label>
                    <div className="ca-preset-pills">
                      {['amazon', 'meta', 'google', 'microsoft'].map((compKey) => {
                        const pool = COMPANY_FOCUS_POOLS[compKey];
                        const isSelected = activeCompanyPreset === compKey;
                        return (
                          <button
                            key={compKey}
                            type="button"
                            className={`ca-preset-pill ${isSelected ? 'active' : ''}`}
                            onClick={() => {
                              setActiveCompanyPreset(compKey);
                              const targetSlugs = pool.signatureProblemSlugs?.slice(0, questionCount).join(',') || '';
                              handleApplyQuestions(targetSlugs);
                            }}
                          >
                            <strong>{pool.name}</strong>
                            <span>{compKey === 'amazon' ? 'LP + Trees/Graphs' : compKey === 'meta' ? 'Strings & Arrays' : compKey === 'google' ? 'DP & Graphs' : 'Lists & Stacks'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Problem Explorer Selection by ID or Number */}
                  <div className="ca-custom-section">
                    <label className="ca-custom-label">
                      Select Questions from Problem Explorer (by ID or Number):
                    </label>
                    <div className="ca-question-input-row">
                      <input
                        type="text"
                        className="ca-input-custom-q"
                        placeholder="e.g. 1, 4, 15 (Two Sum, Product of Array, 3Sum)"
                        value={customQuestionsInput}
                        onChange={(e) => setCustomQuestionsInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className="ca-btn-apply-q"
                        onClick={() => handleApplyQuestions(customQuestionsInput)}
                      >
                        Apply Questions
                      </button>
                    </div>

                    {/* Quick 3-Question Presets */}
                    <div className="ca-quick-presets">
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Quick 3-Question Sets:</span>
                      <button
                        type="button"
                        className="ca-quick-btn"
                        onClick={() => {
                          setQuestionCount?.(3);
                          handleApplyQuestions('1, 4, 15');
                        }}
                      >
                        Amazon 3-Pack (Two Sum, Array Product, 3Sum)
                      </button>
                      <button
                        type="button"
                        className="ca-quick-btn"
                        onClick={() => {
                          setQuestionCount?.(3);
                          handleApplyQuestions('1, 8, 14');
                        }}
                      >
                        Meta Top 3 (Two Sum, Rotated Search, Longest Substring)
                      </button>
                      <button
                        type="button"
                        className="ca-quick-btn"
                        onClick={() => {
                          setQuestionCount?.(3);
                          handleApplyQuestions('1, 2, 3');
                        }}
                      >
                        Top 3 Interview 150
                      </button>
                    </div>
                  </div>

                  {/* Custom Duration & Question Count Controls */}
                  <div className="ca-custom-grid-2">
                    <div className="ca-custom-section">
                      <label className="ca-custom-label">Exam Duration:</label>
                      <div className="ca-toggle-group">
                        {[30, 45, 60, 90, 120].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            className={`ca-toggle-opt ${durationMinutes === mins ? 'active' : ''}`}
                            onClick={() => setDurationMinutes?.(mins)}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="ca-custom-section">
                      <label className="ca-custom-label">Number of Questions:</label>
                      <div className="ca-toggle-group">
                        {[1, 2, 3, 4, 5].map((cnt) => (
                          <button
                            key={cnt}
                            type="button"
                            className={`ca-toggle-opt ${questionCount === cnt ? 'active' : ''}`}
                            onClick={() => setQuestionCount?.(cnt)}
                          >
                            {cnt} {cnt === 1 ? 'Problem' : 'Problems'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Preview Selected Questions */}
                  <div className="ca-selected-preview">
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>
                      Active Selected Challenges ({problems.length}):
                    </span>
                    <div className="ca-selected-chips">
                      {problems.map((p, i) => (
                        <span key={p.id || i} className="ca-selected-chip">
                          <strong>#{p.id}</strong> {p.title} ({p.difficulty})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions / Guidelines */}
            <div className="ca-guidelines-box">
              <h3>
                <Info size={16} /> Exam Guidelines & Instructions
              </h3>
              <ul className="ca-guidelines-list">
                <li>
                  <ChevronRight size={16} className="ca-guideline-bullet" />
                  <span>
                    <strong>Timed Environment:</strong> The countdown clock runs continuously once started ({durationMinutes}m). Auto-submission occurs at 00:00:00.
                  </span>
                </li>
                <li>
                  <ChevronRight size={16} className="ca-guideline-bullet" />
                  <span>
                    <strong>Fullscreen & Tab Proctoring:</strong> Navigating away from the browser window or switching tabs triggers active proctoring warnings.
                  </span>
                </li>
                <li>
                  <ChevronRight size={16} className="ca-guideline-bullet" />
                  <span>
                    <strong>AI Camera Verification:</strong> Optional live webcam feed captures periodic snapshots and logs proctoring integrity directly into your report.
                  </span>
                </li>
                <li>
                  <ChevronRight size={16} className="ca-guideline-bullet" />
                  <span>
                    <strong>Advancement:</strong> Scoring 70% or higher unlocks Round 2: Technical Interview in your PrepLoop multi-round interview pipeline.
                  </span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="ca-lobby-actions">
              <button
                type="button"
                className="ca-btn-secondary"
                onClick={() => navigate(-1)}
              >
                Cancel & Exit
              </button>
              <button
                type="button"
                className="ca-btn-start"
                onClick={handleStartExam}
              >
                <Maximize2 size={18} />
                Enter Fullscreen & Begin Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 3: SCORECARD & RECRUITER REPORTING
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'scorecard') {
    const scoreData = finalScore || {
      totalPoints: solvedCount * 100,
      maxPoints: (problems.length || 2) * 100,
      percentage: Math.round((solvedCount / (problems.length || 1)) * 100),
      passedProblems: solvedCount,
      totalProblems: problems.length || 2,
      verdict: solvedCount >= 1 ? 'Qualified for Round 2: Technical Interview' : 'Assessment Completed',
    };

    const isQualified = scoreData.percentage >= 70;
    const cleanProctoring = tabSwitchCount === 0;

    return (
      <div className="coding-assessment-container">
        <div className="ca-scorecard-wrapper">
          <div className="ca-scorecard-card">
            {/* Scorecard Topbar / Back button */}
            <div className="ca-scorecard-topbar">
              <button
                type="button"
                className="ca-btn-back"
                onClick={handleBack}
                title="Go back"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
            </div>

            {/* Header */}
            <div className="ca-scorecard-hero">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Trophy size={20} color="#10b981" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Online Assessment Evaluation
                  </span>
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', color: '#f8fafc' }}>
                  {formattedCompany} Coding Assessment Report
                </h1>
                <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
                  Role: <strong style={{ color: '#e2e8f0' }}>{role}</strong> | Difficulty: <strong style={{ color: '#e2e8f0' }}>{difficulty}</strong> | Duration: <strong style={{ color: '#e2e8f0' }}>{durationMinutes}m</strong>
                </p>
              </div>

              {/* Circular Gauge */}
              <div className="ca-score-circle">
                <span className="ca-score-percent">{scoreData.percentage}%</span>
                <span className="ca-score-sub">{scoreData.totalPoints} / {scoreData.maxPoints} pts</span>
              </div>
            </div>

            {/* Verdict Banner */}
            <div className={`ca-verdict-banner ${isQualified ? 'qualified' : 'completed'}`}>
              {isQualified ? <CheckCircle size={22} /> : <Award size={22} />}
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>
                  {scoreData.verdict || (isQualified ? 'Qualified for Round 2: Technical Interview' : 'Assessment Completed')}
                </div>
                <div style={{ fontSize: '12.5px', opacity: 0.9 }}>
                  {isQualified
                    ? 'Congratulations! You met the required benchmark to advance in the interview pipeline.'
                    : 'You have finished this coding assessment. Review your problem breakdown below.'}
                </div>
              </div>
            </div>

            {/* Proctoring & AI Camera Integrity Check */}
            <div className="ca-proctor-card-grid">
              <div className={`ca-proctor-shield ${cleanProctoring ? 'clean' : 'warning'}`} style={{ padding: '12px 16px', borderRadius: '10px' }}>
                {cleanProctoring ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>
                    {cleanProctoring ? 'Clean Record — Proctoring Verified' : `Proctoring Alert: ${tabSwitchCount} Tab Switch(es) Logged`}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.85 }}>
                    {cleanProctoring
                      ? 'No window focus departures or tab switches were detected during the examination.'
                      : 'Multiple focus changes were captured and noted in the interview evaluation trail.'}
                  </div>
                </div>
              </div>

              {/* Camera Snapshot Integrity */}
              <div className="ca-camera-audit-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Camera size={18} color="#10b981" />
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>
                      AI Camera Verification: {cameraSnapshots.length > 0 || webcamEnabled ? 'Verified ✓' : 'Standard'}
                    </span>
                  </div>
                  {cameraSnapshots.length > 0 && (
                    <button
                      type="button"
                      className="ca-btn-view-snapshots"
                      onClick={() => setShowSnapshotsGallery(!showSnapshotsGallery)}
                    >
                      <Eye size={14} />
                      {showSnapshotsGallery ? 'Hide Snapshots' : `View ${cameraSnapshots.length} Snapshots`}
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  Periodic snapshot integrity trail captures candidate presence throughout test.
                </div>

                {/* Snapshots Gallery Thumbnail Drawer */}
                {showSnapshotsGallery && cameraSnapshots.length > 0 && (
                  <div className="ca-snapshots-drawer">
                    {cameraSnapshots.map((snap, idx) => (
                      <div key={snap.id || idx} className="ca-snap-thumb-card">
                        {snap.dataUrl ? (
                          <img src={snap.dataUrl} alt={`Snapshot ${idx + 1}`} className="ca-snap-thumb-img" />
                        ) : (
                          <div className="ca-snap-thumb-placeholder">
                            <Camera size={20} color="#10b981" />
                            <span>Frame #{idx + 1}</span>
                          </div>
                        )}
                        <span className="ca-snap-thumb-time">
                          {snap.reason || `Snapshot ${idx + 1}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Problem-by-problem Matrix */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', margin: 0 }}>
                  Problem Breakdown Matrix
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Click "View Code" to review candidate submission</span>
              </div>

              <table className="ca-matrix-table">
                <thead>
                  <tr>
                    <th>Problem</th>
                    <th>Difficulty</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {problems.map((prob, idx) => {
                    const sol = userSolutions[prob.id] || {};
                    const isSolved = sol.status === 'solved';
                    return (
                      <tr key={prob.id || idx}>
                        <td>
                          <span style={{ fontWeight: 600, color: '#f1f5f9' }}>
                            {idx + 1}. {prob.title}
                          </span>
                        </td>
                        <td>
                          <span className={`ca-pill ${prob.difficulty === 'Easy' ? 'ca-pill-diff-easy' : prob.difficulty === 'Hard' ? 'ca-pill-diff-hard' : 'ca-pill-diff-medium'}`}>
                            {prob.difficulty}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: isSolved ? '#10b981' : sol.status === 'attempted' ? '#f59e0b' : '#64748b' }}>
                            {isSolved ? <CheckCircle size={14} /> : sol.status === 'attempted' ? <CircleDot size={14} /> : <Circle size={14} />}
                            {isSolved ? 'Solved' : sol.status === 'attempted' ? 'Attempted' : 'Unattempted'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: isSolved ? '#10b981' : '#94a3b8' }}>
                            {isSolved ? '100 / 100 pts' : sol.status === 'attempted' ? '30 / 100 pts' : '0 / 100 pts'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="ca-btn-view-code"
                            onClick={() => setCodeDiffProblem(prob)}
                          >
                            <FileCode size={14} />
                            <span>View Code</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Recruiter & HR Export Actions Bar */}
            <div className="ca-recruiter-export-panel">
              <div className="ca-export-desc">
                <Sparkles size={16} color="#38bdf8" />
                <span>
                  <strong>Recruiter / HR Tools:</strong> Inspect executive dossier, review code diffs, or export full JSON scorecard.
                </span>
              </div>
              <div className="ca-export-buttons">
                <button
                  type="button"
                  className="ca-btn-dossier"
                  onClick={() => setShowDossierModal(true)}
                >
                  <Eye size={16} />
                  <span>View in Recruiter Dossier</span>
                </button>
                <button
                  type="button"
                  className="ca-btn-download-json"
                  onClick={handleDownloadReport}
                >
                  <Download size={16} />
                  <span>Download Assessment Report</span>
                </button>
                <button
                  type="button"
                  className="ca-btn-copy-link"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(window.location.href);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2500);
                    }
                  }}
                >
                  <Share2 size={16} />
                  <span>{copiedLink ? 'Copied Link!' : 'Share Candidate Link'}</span>
                </button>
              </div>
            </div>

            {/* Standard Progression Actions */}
            <div className="ca-scorecard-actions">
              <button
                type="button"
                className="ca-btn-secondary"
                onClick={() => navigate('/dashboard')}
              >
                Back to Dashboard
              </button>
              <button
                type="button"
                className="ca-btn-advance"
                onClick={handleAdvanceToRound2}
              >
                Advance to Round 2: Technical Interview
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Candidate Review Dossier Modal ── */}
        {showDossierModal && (
          <div className="ca-modal-overlay" onClick={() => setShowDossierModal(false)}>
            <div className="ca-dossier-modal-wrapper" onClick={(e) => e.stopPropagation()}>
              <div className="ca-dossier-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={20} color="#10b981" />
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
                    Candidate Executive Dossier — {formattedCompany} OA
                  </h2>
                </div>
                <button
                  type="button"
                  className="ca-btn-close-modal"
                  onClick={() => setShowDossierModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="ca-dossier-modal-body">
                <CandidateReviewDossier
                  submission={dossierSubmission}
                  inline={true}
                  onClose={() => setShowDossierModal(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Code Submission Viewer Modal ── */}
        {codeDiffProblem && (
          <div className="ca-modal-overlay" onClick={() => setCodeDiffProblem(null)}>
            <div className="ca-code-viewer-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ca-code-viewer-header">
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                    Submitted Solution: {codeDiffProblem.title}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Language: {userSolutions[codeDiffProblem.id]?.language || language} | Status: {userSolutions[codeDiffProblem.id]?.status || 'unattempted'}
                  </span>
                </div>
                <button
                  type="button"
                  className="ca-btn-close-modal"
                  onClick={() => setCodeDiffProblem(null)}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="ca-code-viewer-body">
                <pre className="ca-code-viewer-pre">
                  <code>{userSolutions[codeDiffProblem.id]?.code || '// No code submitted for this problem'}</code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 2: EXAM IDE
  // ═══════════════════════════════════════════════════════════════════════════
  const timerClass = timeRemaining < 120 ? 'ca-timer-badge red' : timeRemaining < 600 ? 'ca-timer-badge amber' : 'ca-timer-badge';
  const proctorClass = tabSwitchCount >= 3 ? 'ca-proctor-shield danger' : tabSwitchCount > 0 ? 'ca-proctor-shield warning' : 'ca-proctor-shield clean';

  return (
    <div className="coding-assessment-container">
      {/* ── Fixed Exam Header ── */}
      <header className="ca-header">
        <div className="ca-header-left">
          <button
            type="button"
            className="ca-btn-back ca-btn-back-header"
            onClick={handleExitExam}
            title="Exit assessment"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <div className="ca-brand-title">
            <span className="ca-brand-badge">{formattedCompany}</span>
            <span>Coding Assessment</span>
            <span style={{ color: '#64748b', fontSize: '13px' }}>— {role}</span>
          </div>

          {/* Problem Selector Tabs */}
          <div className="ca-problem-tabs">
            {problems.map((prob, idx) => {
              const sol = userSolutions[prob.id] || {};
              const isSolved = sol.status === 'solved';
              const isAttempted = sol.status === 'attempted';
              const isActive = idx === currentProblemIndex;

              return (
                <button
                  key={prob.id || idx}
                  type="button"
                  className={`ca-prob-tab ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (typeof setCurrentProblemIndex === 'function') {
                      setCurrentProblemIndex(idx);
                    }
                    setActiveSampleCaseIdx(0);
                  }}
                >
                  <span className={`ca-tab-status-icon ${isSolved ? 'solved' : isAttempted ? 'attempted' : 'unattempted'}`}>
                    {isSolved ? <CheckCircle size={14} /> : isAttempted ? <CircleDot size={14} /> : <Circle size={14} />}
                  </span>
                  <span>
                    Problem {idx + 1}: {prob.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Header Right: Timer, Proctoring, Finish */}
        <div className="ca-header-right">
          {/* Global Countdown Clock */}
          <div className={timerClass} title="Time Remaining">
            <Clock size={16} />
            <span>{formatTime(timeRemaining)}</span>
          </div>

          {/* Camera Presence Status Badge */}
          {webcamEnabled && (
            <div className="ca-cam-active-badge" title="Live Camera Verified">
              <span className="ca-live-dot" />
              <span>Camera Verified</span>
            </div>
          )}

          {/* Proctoring Shield Badge */}
          <div className={proctorClass} title="Proctoring focus status">
            {tabSwitchCount > 0 ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
            <span>Tab Switches: {tabSwitchCount} / 3</span>
          </div>

          {/* Finish & Submit Button */}
          <button
            type="button"
            className="ca-btn-finish"
            onClick={() => setShowConfirmModal(true)}
          >
            Finish & Submit Exam
          </button>
        </div>
      </header>

      {/* ── Proctoring Toast Alert ── */}
      {tabSwitchCount > 0 && !dismissedWarning && (
        <div className={`ca-proctoring-toast ${tabSwitchCount >= 3 ? 'ca-toast-danger' : ''}`}>
          <AlertTriangle size={18} />
          <span className="ca-toast-text">
            {proctoringWarning || `Tab switch detected! Tab departures: ${tabSwitchCount} / 3`}
          </span>
          <button
            type="button"
            className="ca-btn-toast-dismiss"
            onClick={() => setDismissedWarning(true)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Main Split Pane: Problem Statement (Left) + Editor & Drawer (Right) ── */}
      <main className="ca-workspace ca-main-split">
        {/* LEFT PANEL: Problem Description, Editorial, Submissions */}
        <section
          className="ca-left-pane ca-panel-problem"
          style={{ width: `${leftWidth}%`, flex: `0 0 ${leftWidth}%` }}
        >
          {/* Sub-Tabs: Description | Editorial & Approaches | Submissions */}
          <div className="ca-left-tabs-nav">
            <button
              type="button"
              className={`ca-left-tab-btn ${activeLeftTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveLeftTab('description')}
            >
              <FileText size={14} />
              <span>Description</span>
            </button>
            <button
              type="button"
              className={`ca-left-tab-btn ${activeLeftTab === 'editorial' ? 'active' : ''}`}
              onClick={() => setActiveLeftTab('editorial')}
            >
              <Lightbulb size={14} />
              <span>Editorial & Approaches</span>
            </button>
            <button
              type="button"
              className={`ca-left-tab-btn ${activeLeftTab === 'submissions' ? 'active' : ''}`}
              onClick={() => setActiveLeftTab('submissions')}
            >
              <History size={14} />
              <span>Submissions</span>
              {currentProblem && submissionsHistory[currentProblem.id]?.length > 0 && (
                <span className="ca-sub-count-pill">
                  {submissionsHistory[currentProblem.id].length}
                </span>
              )}
            </button>
          </div>

          {currentProblem ? (
            <div className="ca-problem-scroll">
              {/* TAB 1: PROBLEM DESCRIPTION */}
              {activeLeftTab === 'description' && (
                <>
                  <div className="ca-problem-header">
                    <h2>
                      {currentProblemIndex + 1}. {currentProblem.title}
                    </h2>
                    <div className="ca-problem-meta-row">
                      <span className={`ca-pill ${diffClass}`}>
                        {currentProblem.difficulty || difficulty}
                      </span>
                      <span className="ca-pill ca-pill-pts">
                        {currentProblem.points || 100} Points
                      </span>
                      {currentProblem.acceptance && (
                        <span className="ca-pill ca-pill-acceptance">
                          Acceptance: {currentProblem.acceptance}%
                        </span>
                      )}
                      {currentProblem.timeEstimate && (
                        <span className="ca-pill ca-pill-time">
                          ⏱ ~{currentProblem.timeEstimate}m
                        </span>
                      )}
                    </div>

                    {/* Company and Topic Tag Pills */}
                    <div className="ca-tags-row">
                      {currentProblem.company && (
                        <span className="ca-tag-company">
                          {currentProblem.company} OA
                        </span>
                      )}
                      {Array.isArray(currentProblem.topics) && currentProblem.topics.map((t) => (
                        <span key={t} className="ca-topic-pill">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Problem Description Body */}
                  <div className="ca-problem-body">
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
                      {currentProblem.description || 'Problem statement details.'}
                    </p>
                  </div>

                  {/* Examples */}
                  {Array.isArray(currentProblem.examples) && currentProblem.examples.length > 0 && (
                    <div className="ca-section-block">
                      <h4 className="ca-section-title">Sample Examples</h4>
                      {currentProblem.examples.map((ex, i) => (
                        <div key={i} className="ca-example-card">
                          <div className="ca-example-header">
                            <span className="ca-example-title">Example {i + 1}</span>
                            <button
                              type="button"
                              className="ca-btn-copy-input"
                              onClick={() => handleCopyInput(ex.input, i)}
                              title="Copy input to clipboard"
                            >
                              {copiedInputIdx === i ? <CheckCheck size={13} color="#10b981" /> : <Copy size={13} />}
                              <span>{copiedInputIdx === i ? 'Copied!' : 'Copy Input'}</span>
                            </button>
                          </div>
                          <div className="ca-example-field">
                            <span className="ca-label">Input:</span>
                            <code>{typeof ex.input === 'object' ? JSON.stringify(ex.input) : String(ex.input)}</code>
                          </div>
                          <div className="ca-example-field">
                            <span className="ca-label">Output:</span>
                            <code>{typeof ex.output === 'object' ? JSON.stringify(ex.output) : String(ex.output)}</code>
                          </div>
                          {ex.explanation && (
                            <div className="ca-example-field">
                              <span className="ca-label">Explanation:</span>
                              <span style={{ color: '#cbd5e1' }}>{ex.explanation}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Constraints */}
                  {currentProblem.constraints && (
                    <div className="ca-section-block">
                      <h4 className="ca-section-title">Constraints</h4>
                      <ul className="ca-constraints-list">
                        {String(currentProblem.constraints)
                          .split('\n')
                          .filter(Boolean)
                          .map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {/* Hints Accordion */}
                  {Array.isArray(currentProblem.hints) && currentProblem.hints.length > 0 && (
                    <div className="ca-section-block">
                      <h4 className="ca-section-title">Hints & Guidance</h4>
                      <div className="ca-hints-accordion">
                        {currentProblem.hints.map((hint, idx) => {
                          const isExpanded = Boolean(expandedHints[idx]);
                          return (
                            <div key={idx} className="ca-hint-card">
                              <button
                                type="button"
                                className="ca-hint-trigger"
                                onClick={() => toggleHint(idx)}
                              >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Lightbulb size={14} color="#f59e0b" />
                                  <strong>Hint {idx + 1}</strong>
                                </span>
                                <span className="ca-hint-toggle-text">
                                  {isExpanded ? 'Hide Hint ▲' : 'Show Hint ▼'}
                                </span>
                              </button>
                              {isExpanded && (
                                <div className="ca-hint-content">
                                  {hint}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: EDITORIAL & APPROACHES */}
              {activeLeftTab === 'editorial' && (
                <div className="ca-editorial-pane">
                  {currentProblem.editorial ? (
                    <div className="ca-editorial-card">
                      <div className="ca-editorial-header">
                        <Sparkles size={18} color="#38bdf8" />
                        <h3>{currentProblem.editorial.approach || 'Optimal Algorithmic Approach'}</h3>
                      </div>
                      <p className="ca-editorial-overview">
                        {currentProblem.editorial.overview}
                      </p>

                      {Array.isArray(currentProblem.editorial.steps) && (
                        <div className="ca-editorial-steps">
                          <h4>Algorithmic Walkthrough:</h4>
                          <ol>
                            {currentProblem.editorial.steps.map((step, sIdx) => (
                              <li key={sIdx}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      <div className="ca-complexity-grid">
                        <div className="ca-complexity-box">
                          <span className="ca-comp-label">Time Complexity:</span>
                          <span className="ca-comp-val">{currentProblem.editorial.timeComplexity}</span>
                        </div>
                        <div className="ca-complexity-box">
                          <span className="ca-comp-label">Space Complexity:</span>
                          <span className="ca-comp-val">{currentProblem.editorial.spaceComplexity}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="ca-editorial-empty">
                      <Lightbulb size={28} color="#f59e0b" />
                      <h4>Interview Strategy & Hints</h4>
                      <p>
                        Identify the optimal data structures and time bounds based on input constraints.
                        Consider two-pointer narrowing, prefix hashes, BFS/DFS traversal, or dynamic programming.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SUBMISSIONS HISTORY */}
              {activeLeftTab === 'submissions' && (
                <div className="ca-submissions-pane">
                  <div className="ca-submissions-header">
                    <h4>Session Test & Submission History</h4>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Click "Restore Code" to revert editor to any past run
                    </span>
                  </div>

                  {submissionsHistory[currentProblem.id]?.length > 0 ? (
                    <div className="ca-submissions-list">
                      {submissionsHistory[currentProblem.id].map((sub, sIdx) => {
                        const isAccepted = sub.status === 'Accepted';
                        return (
                          <div key={sub.id || sIdx} className="ca-submission-item">
                            <div className="ca-sub-item-top">
                              <span className={`ca-sub-status ${isAccepted ? 'accepted' : 'failed'}`}>
                                {isAccepted ? <CheckCircle size={14} /> : <X size={14} />}
                                {sub.status} ({sub.passedCount ?? 0}/{sub.totalCount ?? 0})
                              </span>
                              <span className="ca-sub-time">{sub.timestamp}</span>
                            </div>
                            <div className="ca-sub-item-meta">
                              <span>Lang: <strong>{sub.language}</strong></span>
                              <span>Runtime: <strong>{sub.runtime || '15 ms'}</strong></span>
                              <button
                                type="button"
                                className="ca-btn-restore-sub"
                                onClick={() => {
                                  if (typeof restoreSubmissionCode === 'function') {
                                    restoreSubmissionCode(currentProblem.id, sub.code, sub.language);
                                  } else {
                                    handleCodeChange(sub.code);
                                  }
                                }}
                              >
                                Restore Code
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="ca-submissions-empty">
                      <History size={28} color="#64748b" />
                      <p>No test runs recorded yet in this assessment session.</p>
                      <span>Click "Run Code" or "Submit Code" to log your attempts.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
              No challenge selected.
            </div>
          )}
        </section>

        {/* Resizer Divider (Horizontal) */}
        <div
          className="ca-pane-resizer"
          onMouseDown={handleResizerMouseDown}
          title="Drag to resize panes"
        />

        {/* RIGHT PANEL: Monaco Code Editor + Bottom Console Drawer */}
        <section
          className="ca-right-pane ca-panel-editor"
          style={{ width: `${100 - leftWidth}%`, flex: 1 }}
        >
          {/* Editor Action Bar (Language, theme, font size, reset) */}
          <div className="ca-editor-toolbar">
            <div className="ca-toolbar-left">
              <label htmlFor="ca-lang-select" className="ca-toolbar-label">
                Language:
              </label>
              <select
                id="ca-lang-select"
                className="ca-select-lang"
                value={language}
                onChange={(e) => {
                  if (typeof setLanguage === 'function') {
                    setLanguage(e.target.value);
                  }
                }}
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>

              <div className="ca-autosave-badge" title="Code is auto-saved in your browser">
                <span className="ca-autosave-dot" />
                <span>Auto-saved</span>
              </div>
            </div>

            <div className="ca-toolbar-right">
              {/* Font Size Controls */}
              <div className="ca-font-controls" title="Adjust Editor Font Size">
                <button type="button" className="ca-btn-font" onClick={handleZoomOut} title="Decrease font size">
                  <Minus size={12} />
                </button>
                <span className="ca-font-size-label">{fontSize}px</span>
                <button type="button" className="ca-btn-font" onClick={handleZoomIn} title="Increase font size">
                  <Plus size={12} />
                </button>
              </div>

              {/* Theme Toggle */}
              <button
                type="button"
                className="ca-btn-toolbar"
                onClick={() => setEditorTheme(editorTheme === 'vs-dark' ? 'hc-black' : 'vs-dark')}
                title="Toggle High Contrast Theme"
              >
                <span>{editorTheme === 'vs-dark' ? 'Dark' : 'High Contrast'}</span>
              </button>

              {/* Reset Code */}
              <button
                type="button"
                className="ca-btn-toolbar"
                onClick={handleResetTemplate}
                title="Reset to starter boilerplate"
              >
                <RotateCcw size={14} />
                <span>Reset Code</span>
              </button>

              {/* Shortcut Hint */}
              <span className="ca-shortcut-pill" title="Press Ctrl+Enter anywhere to run test cases">
                Ctrl + Enter to Run
              </span>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="ca-monaco-wrapper">
            <Editor
              height="100%"
              language={
                SUPPORTED_LANGUAGES.find((l) => l.id === language)?.monaco || 'python'
              }
              theme={editorTheme}
              value={currentCode}
              onChange={(val) => handleCodeChange(val || '')}
              options={{
                fontSize,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 4,
                lineNumbers: 'on',
                renderWhitespace: 'none',
              }}
            />
          </div>

          {/* ── Picture-in-Picture Live Webcam Feed (Draggable & Switchable Anywhere) ── */}
          {webcamEnabled && (
            <div
              ref={camOverlayRef}
              className={`ca-pip-camera-overlay ${pipMinimized ? 'minimized' : ''}`}
              style={camStyle}
            >
              <div
                className="ca-pip-camera-header"
                onMouseDown={handleCamMouseDown}
                onTouchStart={handleCamTouchStart}
                onClick={() => {
                  if (pipMinimized) setPipMinimized(false);
                }}
                title="Drag anywhere across the screen for your best placement"
              >
                <div className="ca-cam-header-left-title">
                  <Move size={12} className="ca-cam-drag-icon" />
                  <span className="ca-live-dot" />
                  <span className="ca-cam-header-title">Proctoring Feed</span>
                </div>

                <div
                  className="ca-cam-header-controls"
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Quick Corner Snap Buttons */}
                  <div className="ca-cam-corner-btns" title="Quick snap to corner">
                    <button
                      type="button"
                      className={`ca-btn-corner ${camPos.preset === 'top-left' ? 'active' : ''}`}
                      onClick={() => setCamPreset('top-left')}
                      title="Move to Top-Left"
                    >
                      ↖
                    </button>
                    <button
                      type="button"
                      className={`ca-btn-corner ${camPos.preset === 'top-right' ? 'active' : ''}`}
                      onClick={() => setCamPreset('top-right')}
                      title="Move to Top-Right"
                    >
                      ↗
                    </button>
                    <button
                      type="button"
                      className={`ca-btn-corner ${camPos.preset === 'bottom-left' ? 'active' : ''}`}
                      onClick={() => setCamPreset('bottom-left')}
                      title="Move to Bottom-Left"
                    >
                      ↙
                    </button>
                    <button
                      type="button"
                      className={`ca-btn-corner ${camPos.preset === 'bottom-right' ? 'active' : ''}`}
                      onClick={() => setCamPreset('bottom-right')}
                      title="Move to Bottom-Right"
                    >
                      ↘
                    </button>
                  </div>

                  {/* Minimize / Expand Toggle */}
                  <button
                    type="button"
                    className="ca-btn-cam-min-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPipMinimized(!pipMinimized);
                    }}
                    title={pipMinimized ? 'Expand Camera View' : 'Minimize to compact badge'}
                  >
                    {pipMinimized ? '▲' : '▼'}
                  </button>
                </div>
              </div>

              {!pipMinimized && (
                <>
                  <div className="ca-pip-video-container">
                    {webcamStream ? (
                      <video
                        ref={examVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="ca-pip-camera-video"
                      />
                    ) : (
                      <div className="ca-cam-placeholder">
                        <Camera size={20} className="ca-cam-placeholder-icon" />
                        <span>Camera Active</span>
                      </div>
                    )}
                  </div>
                  <div className="ca-pip-camera-footer">
                    <span>Switches: {tabSwitchCount}</span>
                    <span>Snapshots: {cameraSnapshots.length}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Console / Test Drawer (Bottom) ── */}
          <div
            className={`ca-test-drawer ca-console-drawer ${isDrawerCollapsed ? 'collapsed' : ''}`}
            style={{ height: isDrawerCollapsed ? '42px' : `${drawerHeight}px` }}
          >
            {/* Drawer Top Drag Resizer */}
            <div
              className="ca-drawer-resizer"
              onMouseDown={handleDrawerResizerMouseDown}
              title="Drag up/down to resize console height"
            >
              <div className="ca-resizer-handle-bar" />
            </div>

            {/* Drawer Tabs Bar */}
            <div className="ca-drawer-header ca-drawer-tabs-bar">
              <div className="ca-drawer-tabs">
                <button
                  type="button"
                  className={`ca-drawer-tab ${activeDrawerTab === 'cases' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveDrawerTab('cases');
                    if (isDrawerCollapsed) setIsDrawerCollapsed(false);
                  }}
                >
                  <FileText size={14} />
                  <span>Test Cases</span>
                </button>
                <button
                  type="button"
                  className={`ca-drawer-tab ${activeDrawerTab === 'custom' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveDrawerTab('custom');
                    if (isDrawerCollapsed) setIsDrawerCollapsed(false);
                  }}
                >
                  <Terminal size={14} />
                  <span>Custom Stdin</span>
                </button>
                <button
                  type="button"
                  className={`ca-drawer-tab ${activeDrawerTab === 'results' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveDrawerTab('results');
                    if (isDrawerCollapsed) setIsDrawerCollapsed(false);
                  }}
                >
                  <CheckCircle size={14} />
                  <span>Test Results</span>
                  {runOutput && (
                    <span className={`ca-results-badge ${runOutput.passed ? 'pass' : 'fail'}`}>
                      {runOutput.passed ? 'Pass' : 'Fail'}
                    </span>
                  )}
                </button>

                {/* Drawer Collapse / Expand Button */}
                <button
                  type="button"
                  className="ca-btn-drawer-collapse"
                  onClick={() => setIsDrawerCollapsed(!isDrawerCollapsed)}
                  title={isDrawerCollapsed ? 'Expand Console' : 'Minimize Console'}
                >
                  {isDrawerCollapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  <span>{isDrawerCollapsed ? 'Console' : 'Minimize'}</span>
                </button>
              </div>

              {/* Run & Submit Execution Buttons */}
              <div className="ca-drawer-actions">
                <button
                  type="button"
                  className="ca-btn-run"
                  disabled={isRunning || isSubmitting}
                  onClick={() => {
                    if (isDrawerCollapsed) setIsDrawerCollapsed(false);
                    if (typeof runCode === 'function') runCode();
                  }}
                >
                  {isRunning ? <Loader2 size={15} className="ca-spin" /> : <Play size={15} />}
                  <span>Run Code</span>
                </button>
                <button
                  type="button"
                  className="ca-btn-submit"
                  disabled={isRunning || isSubmitting}
                  onClick={() => {
                    if (isDrawerCollapsed) setIsDrawerCollapsed(false);
                    if (typeof submitCode === 'function') submitCode();
                  }}
                >
                  {isSubmitting ? <Loader2 size={15} className="ca-spin" /> : <Send size={15} />}
                  <span>Submit Code</span>
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            {!isDrawerCollapsed && (
              <div className="ca-drawer-body ca-drawer-content">
                {/* Tab 1: Sample Test Cases */}
                {activeDrawerTab === 'cases' && (
                  <div className="ca-tab-cases">
                    {currentProblem?.sampleTestCases && currentProblem.sampleTestCases.length > 0 ? (
                      <>
                        <div className="ca-case-selector">
                          {currentProblem.sampleTestCases.map((tc, idx) => {
                            const caseResult = runOutput?.cases?.[idx];
                            return (
                              <button
                                key={tc.id || idx}
                                type="button"
                                className={`ca-case-pill ${activeSampleCaseIdx === idx ? 'active' : ''}`}
                                onClick={() => setActiveSampleCaseIdx(idx)}
                              >
                                {caseResult && (
                                  <span className={`ca-case-status-dot ${caseResult.passed ? 'passed' : 'failed'}`} />
                                )}
                                <span>Case {idx + 1}</span>
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            className="ca-case-pill ca-case-pill-custom"
                            onClick={() => setActiveDrawerTab('custom')}
                            title="Provide custom input"
                          >
                            + Custom Input
                          </button>
                        </div>

                        {currentProblem.sampleTestCases[activeSampleCaseIdx] && (
                          <div className="ca-case-card">
                            <div className="ca-case-block">
                              <div className="ca-case-block-header">
                                <span className="ca-case-label">Input</span>
                                <button
                                  type="button"
                                  className="ca-btn-copy-small"
                                  onClick={() => handleCopyInput(formatInputForDisplay(currentProblem.sampleTestCases[activeSampleCaseIdx]?.input, currentProblem.slug), 999)}
                                  title="Copy Input"
                                >
                                  {copiedInputIdx === 999 ? (
                                    <>
                                      <Check size={12} />
                                      <span>Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <pre className="ca-case-code-box">
                                {formatInputForDisplay(currentProblem.sampleTestCases[activeSampleCaseIdx]?.input, currentProblem.slug)}
                              </pre>
                            </div>

                            <div className="ca-case-block">
                              <div className="ca-case-block-header">
                                <span className="ca-case-label">Expected Output</span>
                              </div>
                              <pre className="ca-case-code-box ca-expected-code">
                                {formatOutputForDisplay(currentProblem.sampleTestCases[activeSampleCaseIdx]?.output)}
                              </pre>
                            </div>

                            {runOutput?.cases?.[activeSampleCaseIdx] && (
                              <div className="ca-case-block">
                                <div className="ca-case-block-header">
                                  <span className={`ca-case-label ${runOutput.cases[activeSampleCaseIdx].passed ? 'label-passed' : 'label-failed'}`}>
                                    Your Output {runOutput.cases[activeSampleCaseIdx].passed ? '(Passed ✓)' : '(Wrong Answer ✗)'}
                                  </span>
                                </div>
                                <pre className={`ca-case-code-box ${runOutput.cases[activeSampleCaseIdx].passed ? 'ca-actual-passed' : 'ca-actual-failed'}`}>
                                  {formatOutputForDisplay(runOutput.cases[activeSampleCaseIdx].actual)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                        Sample test cases available upon running code.
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Custom Stdin */}
                {activeDrawerTab === 'custom' && (
                  <div className="ca-tab-custom">
                    <label htmlFor="ca-custom-input" style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Enter custom stdin passed to your solution:
                    </label>
                    <textarea
                      id="ca-custom-input"
                      className="ca-custom-stdin"
                      placeholder="e.g. 5&#10;1 2 3 4 5"
                      value={customInput}
                      onChange={(e) => setCustomInput && setCustomInput(e.target.value)}
                    />
                  </div>
                )}

                {/* Tab 3: Test Results */}
                {activeDrawerTab === 'results' && (
                  <div className="ca-tab-results">
                    {isRunning || isSubmitting ? (
                      <div className="ca-results-loading">
                        <Loader2 size={22} className="ca-spin" />
                        <span>{isSubmitting ? 'Submitting code against all test cases...' : 'Compiling and executing code...'}</span>
                      </div>
                    ) : runOutput ? (
                      <div className="ca-results-body">
                        {/* Status Headline */}
                        <div className={`ca-results-hero ${runOutput.passed ? 'pass' : 'fail'}`}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {runOutput.passed ? <CheckCircle size={18} /> : <X size={18} />}
                            <span style={{ fontWeight: 700, fontSize: '14px' }}>
                              {runOutput.passed ? 'Accepted' : 'Wrong Answer / Errors'}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                            Passed: <strong>{runOutput.passedCount ?? 0} / {runOutput.totalCount ?? 0}</strong> test cases
                            {runOutput.runtime && ` | Runtime: ${runOutput.runtime}`}
                          </div>
                        </div>

                        {/* Error or Compiler Output */}
                        {runOutput.error && (
                          <div className="ca-results-error-box">
                            <strong>Execution Error:</strong>
                            {'\n'}{runOutput.error}
                          </div>
                        )}

                        {/* Individual Test Cases */}
                        {runOutput.cases && runOutput.cases.map((c, i) => {
                          const passed = Boolean(c.passed);
                          return (
                            <div key={i} className={`ca-result-case-card ${passed ? '' : 'fail'}`}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span style={{ fontWeight: 700, color: passed ? '#10b981' : '#f87171' }}>
                                  Case {i + 1}: {passed ? 'Passed ✓' : 'Failed ✗'}
                                </span>
                                {c.runtime && (
                                  <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                                    {c.runtime}
                                  </span>
                                )}
                              </div>

                              <div className="ca-result-diff-grid">
                                <div>
                                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Expected:</div>
                                  <div className="ca-code-box" style={{ padding: '4px 8px', fontSize: '12px' }}>
                                    {typeof c.expected === 'object' ? JSON.stringify(c.expected) : String(c.expected ?? '')}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Actual Output:</div>
                                  <div className="ca-code-box" style={{ padding: '4px 8px', fontSize: '12px', color: passed ? '#34d399' : '#fca5a5' }}>
                                    {typeof c.actual === 'object' ? JSON.stringify(c.actual) : String(c.actual ?? '')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ color: '#94a3b8', fontSize: '13px', padding: '12px 0' }}>
                        Run code or submit solution to view test case evaluation here.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ── Confirmation Modal ── */}
      {showConfirmModal && (
        <div className="ca-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="ca-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Finish & Submit Exam?</h3>
            <p>
              You have currently solved <strong>{solvedCount}</strong> of <strong>{problems.length}</strong> coding problems.
              Once submitted, your examination will end immediately and your HackerRank evaluation scorecard will be generated.
            </p>
            <div className="ca-modal-actions">
              <button
                type="button"
                className="ca-btn-secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                Keep Coding
              </button>
              <button
                type="button"
                className="ca-btn-finish"
                style={{ padding: '10px 20px' }}
                onClick={() => {
                  setShowConfirmModal(false);
                  if (typeof submitExam === 'function') {
                    submitExam();
                  } else if (typeof setPhase === 'function') {
                    setPhase('scorecard');
                  }
                }}
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
