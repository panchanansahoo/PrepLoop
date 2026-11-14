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
  ArrowRight,
  Trophy,
  Code2,
  Check,
  X,
  Loader2,
  Terminal,
  FileText,
  Award,
  Info
} from 'lucide-react';
import useCodingAssessment from '../hooks/useCodingAssessment';
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

  // Consume hook
  const assessment = useCodingAssessment({
    company,
    role,
    difficulty,
    durationMinutes: 60,
    questionCount: 2,
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
  } = assessment || {};

  // Local UI State
  const [activeDrawerTab, setActiveDrawerTab] = useState('cases'); // 'cases' | 'custom' | 'results'
  const [activeSampleCaseIdx, setActiveSampleCaseIdx] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [dismissedWarning, setDismissedWarning] = useState(false);
  const prevTabSwitchCountRef = useRef(tabSwitchCount);

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

  // Safe Start Exam with Fullscreen Request
  const handleStartExam = useCallback(async () => {
    try {
      if (typeof document !== 'undefined' && document.documentElement?.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request bypassed or not permitted:', err);
    }
    if (typeof startExam === 'function') {
      startExam();
    } else if (typeof setPhase === 'function') {
      setPhase('exam');
    }
  }, [startExam, setPhase]);

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

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 1: LOBBY
  // ═══════════════════════════════════════════════════════════════════════════
  if (phase === 'lobby') {
    return (
      <div className="coding-assessment-container">
        <div className="ca-lobby-wrapper">
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
                <span className="ca-spec-val">60 Minutes</span>
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

            {/* Instructions / Guidelines */}
            <div className="ca-guidelines-box">
              <h3>
                <Info size={16} /> Exam Guidelines & Instructions
              </h3>
              <ul className="ca-guidelines-list">
                <li>
                  <ChevronRight size={16} className="ca-guideline-bullet" />
                  <span>
                    <strong>Timed Environment:</strong> The countdown clock runs continuously once started. When time expires (00:00:00), your assessment will auto-submit.
                  </span>
                </li>
                <li>
                  <ChevronRight size={16} className="ca-guideline-bullet" />
                  <span>
                    <strong>Fullscreen & Tab Proctoring:</strong> Navigating away from the browser window or switching tabs triggers active proctoring warnings and is logged on your report.
                  </span>
                </li>
                <li>
                  <ChevronRight size={16} className="ca-guideline-bullet" />
                  <span>
                    <strong>Code Testing:</strong> Use the built-in console to run code against sample test cases or custom stdin before final submission.
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
  // VIEW 3: SCORECARD
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
                  Role: <strong style={{ color: '#e2e8f0' }}>{role}</strong> | Difficulty: <strong style={{ color: '#e2e8f0' }}>{difficulty}</strong>
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

            {/* Proctoring Integrity Check */}
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

            {/* Problem-by-problem Matrix */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', margin: '0 0 8px 0' }}>
                Problem Breakdown Matrix
              </h3>
              <table className="ca-matrix-table">
                <thead>
                  <tr>
                    <th>Problem</th>
                    <th>Difficulty</th>
                    <th>Status</th>
                    <th>Score</th>
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Actions */}
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
            {proctoringWarning || `Warning ${tabSwitchCount}/3: You navigated away from the exam window! All tab switches are logged.`}
          </span>
          <button
            type="button"
            className="ca-toast-dismiss"
            onClick={() => setDismissedWarning(true)}
            aria-label="Dismiss alert"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Split Workspace ── */}
      <main className="ca-workspace">
        {/* Left Pane: Problem Description */}
        <section className="ca-left-pane">
          {currentProblem ? (
            <>
              <div className="ca-problem-header">
                <div className="ca-problem-title-row">
                  <h2 className="ca-problem-title">
                    {currentProblemIndex + 1}. {currentProblem.title}
                  </h2>
                  <div className="ca-problem-badges">
                    <span className={`ca-pill ${diffClass}`}>
                      {currentProblem.difficulty || 'Medium'}
                    </span>
                    <span className="ca-pts-badge">100 Pts</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="ca-problem-desc">
                {currentProblem.description}
              </div>

              {/* Constraints */}
              {currentProblem.constraints && (
                <div className="ca-constraints-box">
                  <div className="ca-section-title">Constraints</div>
                  {Array.isArray(currentProblem.constraints) ? (
                    <ul className="ca-constraints-list">
                      {currentProblem.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="ca-constraints-list">{currentProblem.constraints}</div>
                  )}
                </div>
              )}

              {/* Examples */}
              {currentProblem.examples && currentProblem.examples.length > 0 && (
                <div className="ca-examples-section">
                  <div className="ca-section-title">Sample Examples</div>
                  {currentProblem.examples.map((ex, i) => (
                    <div key={i} className="ca-example-card">
                      <div className="ca-example-title">Example {i + 1}</div>
                      <div className="ca-example-block">
                        <div className="ca-example-label">Input:</div>
                        <div className="ca-example-code">{ex.input}</div>
                      </div>
                      <div className="ca-example-block">
                        <div className="ca-example-label">Output:</div>
                        <div className="ca-example-code">{ex.output}</div>
                      </div>
                      {ex.explanation && (
                        <div className="ca-example-expl">
                          <strong>Explanation: </strong>
                          {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
              Loading problem statement...
            </div>
          )}
        </section>

        {/* Right Pane: Monaco Editor & Bottom Test Drawer */}
        <section className="ca-right-pane">
          {/* Editor Toolbar */}
          <div className="ca-editor-toolbar">
            <select
              className="ca-lang-select"
              value={language}
              onChange={(e) => {
                const newLang = e.target.value;
                if (typeof setLanguage === 'function') {
                  setLanguage(newLang);
                }
              }}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.label}
                </option>
              ))}
            </select>

            <div className="ca-toolbar-actions">
              <button
                type="button"
                className="ca-btn-icon-subtle"
                onClick={handleResetTemplate}
                title="Reset to starter template"
              >
                <RotateCcw size={14} />
                Reset Template
              </button>
            </div>
          </div>

          {/* Monaco Editor Wrapper */}
          <div className="ca-monaco-wrapper">
            <Editor
              height="100%"
              theme="vs-dark"
              language={
                language === 'cpp'
                  ? 'cpp'
                  : language === 'javascript'
                  ? 'javascript'
                  : language === 'python'
                  ? 'python'
                  : language === 'java'
                  ? 'java'
                  : language === 'go'
                  ? 'go'
                  : 'python'
              }
              value={currentCode}
              onChange={(val) => handleCodeChange(val || '')}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                tabSize: 4,
                wordWrap: 'on',
              }}
            />
          </div>

          {/* Bottom Test Drawer */}
          <div className="ca-test-drawer">
            {/* Drawer Header with Tabs and Run/Submit buttons */}
            <div className="ca-drawer-header">
              <div className="ca-drawer-tabs">
                <button
                  type="button"
                  className={`ca-drawer-tab ${activeDrawerTab === 'cases' ? 'active' : ''}`}
                  onClick={() => setActiveDrawerTab('cases')}
                >
                  <FileText size={14} />
                  Sample Test Cases
                </button>
                <button
                  type="button"
                  className={`ca-drawer-tab ${activeDrawerTab === 'custom' ? 'active' : ''}`}
                  onClick={() => setActiveDrawerTab('custom')}
                >
                  <Terminal size={14} />
                  Custom Input
                </button>
                <button
                  type="button"
                  className={`ca-drawer-tab ${activeDrawerTab === 'results' ? 'active' : ''}`}
                  onClick={() => setActiveDrawerTab('results')}
                >
                  <Code2 size={14} />
                  Test Results / Output
                  {runOutput && (
                    <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', background: runOutput.passedCount === runOutput.totalCount ? '#10b981' : '#ef4444', color: '#fff' }}>
                      {runOutput.passedCount}/{runOutput.totalCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="ca-drawer-actions">
                <button
                  type="button"
                  className="ca-btn-run"
                  disabled={isRunning || isSubmitting}
                  onClick={() => {
                    setActiveDrawerTab('results');
                    if (typeof runCode === 'function') runCode();
                  }}
                >
                  {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  Run Code
                </button>
                <button
                  type="button"
                  className="ca-btn-submit"
                  disabled={isRunning || isSubmitting}
                  onClick={() => {
                    setActiveDrawerTab('results');
                    if (typeof submitCode === 'function') submitCode();
                  }}
                >
                  {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Submit Code
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="ca-drawer-body">
              {/* Tab: Sample Test Cases */}
              {activeDrawerTab === 'cases' && (
                <div>
                  {currentProblem?.test_cases && currentProblem.test_cases.length > 0 ? (
                    <div>
                      <div className="ca-cases-selector">
                        {currentProblem.test_cases.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={`ca-case-btn ${activeSampleCaseIdx === idx ? 'active' : ''}`}
                            onClick={() => setActiveSampleCaseIdx(idx)}
                          >
                            Case {idx + 1}
                          </button>
                        ))}
                      </div>
                      {currentProblem.test_cases[activeSampleCaseIdx] && (
                        <div className="ca-case-detail">
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                            Input:
                          </div>
                          <div className="ca-code-box">
                            {typeof currentProblem.test_cases[activeSampleCaseIdx].input === 'object'
                              ? JSON.stringify(currentProblem.test_cases[activeSampleCaseIdx].input)
                              : String(currentProblem.test_cases[activeSampleCaseIdx].input)}
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginTop: '6px' }}>
                            Expected Output:
                          </div>
                          <div className="ca-code-box">
                            {typeof currentProblem.test_cases[activeSampleCaseIdx].output === 'object'
                              ? JSON.stringify(currentProblem.test_cases[activeSampleCaseIdx].output)
                              : String(currentProblem.test_cases[activeSampleCaseIdx].output)}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : currentProblem?.examples && currentProblem.examples.length > 0 ? (
                    <div>
                      <div className="ca-cases-selector">
                        {currentProblem.examples.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={`ca-case-btn ${activeSampleCaseIdx === idx ? 'active' : ''}`}
                            onClick={() => setActiveSampleCaseIdx(idx)}
                          >
                            Case {idx + 1}
                          </button>
                        ))}
                      </div>
                      {currentProblem.examples[activeSampleCaseIdx] && (
                        <div className="ca-case-detail">
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                            Input:
                          </div>
                          <div className="ca-code-box">
                            {currentProblem.examples[activeSampleCaseIdx].input}
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginTop: '6px' }}>
                            Expected Output:
                          </div>
                          <div className="ca-code-box">
                            {currentProblem.examples[activeSampleCaseIdx].output}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                      No sample test cases specified.
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Custom Input */}
              {activeDrawerTab === 'custom' && (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                    Standard Input (stdin):
                  </div>
                  <textarea
                    className="ca-custom-input-textarea"
                    placeholder="Enter standard input values here..."
                    value={customInput}
                    onChange={(e) => {
                      if (typeof setCustomInput === 'function') {
                        setCustomInput(e.target.value);
                      }
                    }}
                  />
                </div>
              )}

              {/* Tab: Test Results / Output */}
              {activeDrawerTab === 'results' && (
                <div>
                  {isRunning || isSubmitting ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38bdf8', fontSize: '14px', padding: '16px 0' }}>
                      <Loader2 className="animate-spin" size={18} />
                      <span>{isSubmitting ? 'Evaluating solution against all test suites...' : 'Executing code against sample test cases...'}</span>
                    </div>
                  ) : runOutput ? (
                    <div>
                      {/* Summary Header */}
                      <div className="ca-results-summary">
                        <div className={`ca-result-status-badge ${runOutput.passedCount === runOutput.totalCount ? 'passed' : 'failed'}`}>
                          {runOutput.passedCount === runOutput.totalCount ? (
                            <CheckCircle size={18} />
                          ) : (
                            <AlertTriangle size={18} />
                          )}
                          <span>
                            {runOutput.passedCount === runOutput.totalCount
                              ? `All Tests Passed (${runOutput.passedCount}/${runOutput.totalCount})`
                              : `${runOutput.totalCount - runOutput.passedCount} Test Case(s) Failed (${runOutput.passedCount}/${runOutput.totalCount})`}
                          </span>
                        </div>

                        <div className="ca-metrics-row">
                          {runOutput.runtime && <span>Runtime: {runOutput.runtime}</span>}
                          {runOutput.memory && <span>Memory: {runOutput.memory}</span>}
                        </div>
                      </div>

                      {/* Compilation / Execution Error */}
                      {runOutput.error && (
                        <div className="ca-error-banner">
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
                              {c.executionTime && (
                                <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                                  {c.executionTime}
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
