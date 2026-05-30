import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { ArrowLeft, Play, Timer, Sparkles, Target, Brain, Bug, FlaskConical, ChevronRight, RotateCcw, Award, Zap, Code2, CheckCircle, AlertTriangle, Clock, Info, TrendingUp } from 'lucide-react';
import { PROBLEMS } from '../data/problemsDatabase';
import { SCORING_RUBRICS } from '../data/interviewModesData';
import {
  runFullAnalysis,
  buildFeedbackReport,
} from '../utils/interviewScoringEngine';
import InterviewRemediationPanel from '../components/InterviewRemediationPanel';
import './LiveCodingCopilot.css';

const LANGUAGES = [
  { id: 'python', label: 'Python', icon: '🐍' },
  { id: 'javascript', label: 'JavaScript', icon: '🟨' },
  { id: 'java', label: 'Java', icon: '☕' },
  { id: 'cpp', label: 'C++', icon: '⚙️' },
];

const STARTER_CODE = {
  python: `# Write your solution here\ndef solve(self, nums):\n    pass\n\n# Test your solution\n# print(solve(None, [1,2,3]))`,
  javascript: `// Write your solution here\nfunction solve(nums) {\n  \n}\n\n// Test your solution\n// console.log(solve([1,2,3]));`,
  java: `// Write your solution here\nclass Solution {\n    public int[] solve(int[] nums) {\n        \n    }\n}`,
  cpp: `// Write your solution here\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> solve(vector<int>& nums) {\n        \n    }\n};`,
};

const DIFFICULTY_FILTER = ['Easy', 'Medium', 'Hard'];

function ScoreGauge({ label, score, icon, color, maxScore = 100, animated = true }) {
  const [displayScore, setDisplayScore] = useState(0);
  const progress = (score / maxScore) * 100;

  useEffect(() => {
    if (!animated) { setDisplayScore(score); return; }
    const timer = setTimeout(() => setDisplayScore(score), 100);
    return () => clearTimeout(timer);
  }, [score, animated]);

  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (displayScore / maxScore) * circumference;

  return (
    <div className="score-gauge">
      <div className="gauge-ring">
        <svg viewBox="0 0 80 80" className="gauge-svg">
          <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
          <circle
            cx="40" cy="40" r="36" fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 40 40)"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="gauge-value" style={{ color }}>
          {Math.round(displayScore)}
        </div>
      </div>
      <div className="gauge-label">
        <span className="gauge-icon">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="gauge-bar-track">
        <div
          className="gauge-bar-fill"
          style={{ width: `${progress}%`, background: color, transition: 'width 0.8s ease' }}
        />
      </div>
    </div>
  );
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function LiveCodingCopilot() {
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const analyzerTimer = useRef(null);

  // ── Setup state ──
  const [phase, setPhase] = useState('setup'); // setup | coding | results
  const [difficulty, setDifficulty] = useState('Medium');
  const [language, setLanguage] = useState('python');

  // ── Problem state ──
  const [problem, setProblem] = useState(null);

  // ── Coding state ──
  const [code, setCode] = useState('');
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [totalTime] = useState(30 * 60); // 30 minutes

  // ── Live scores ──
  const [liveScores, setLiveScores] = useState({
    syntax: { score: 0, issues: [], details: {} },
    testDiscipline: { score: 0, issues: [], details: {} },
    complexity: { score: 0, issues: [], details: {} },
    debugging: { score: 0, issues: [], details: {} },
  });
  const [analysisCount, setAnalysisCount] = useState(0);

  // ── Results ──
  const [report, setReport] = useState(null);

  // Timer
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev >= totalTime) {
          setTimerActive(false);
          handleSubmit();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, totalTime]);

  // Problem selection
  const availableProblems = useMemo(() => {
    const all = Object.values(PROBLEMS).flat();
    return all.filter(p => p.difficulty === difficulty).slice(0, 50);
  }, [difficulty]);

  const startSession = () => {
    const problems = availableProblems;
    if (problems.length === 0) return;
    const selected = problems[Math.floor(Math.random() * problems.length)];
    setProblem(selected);
    setCode(STARTER_CODE[language] || STARTER_CODE.python);
    setTimer(0);
    setTimerActive(true);
    setPhase('coding');
    setReport(null);
    setAnalysisCount(0);
    setLiveScores({
      syntax: { score: 0, issues: [], details: {} },
      testDiscipline: { score: 0, issues: [], details: {} },
      complexity: { score: 0, issues: [], details: {} },
      debugging: { score: 0, issues: [], details: {} },
    });
  };

  // Live analysis (debounced)
  const handleCodeChange = useCallback((value) => {
    setCode(value || '');
    if (analyzerTimer.current) clearTimeout(analyzerTimer.current);
    analyzerTimer.current = setTimeout(() => {
      if (value && value.trim().length > 20) {
        const scores = runFullAnalysis(value, language);
        setLiveScores(scores);
        setAnalysisCount(prev => prev + 1);
      }
    }, 1500);
  }, [language]);

  const handleSubmit = useCallback(() => {
    setTimerActive(false);
    const scores = runFullAnalysis(code, language);
    setLiveScores(scores);
    const finalReport = buildFeedbackReport(scores, SCORING_RUBRICS.liveCoding);
    setReport(finalReport);
    setPhase('results');
  }, [code, language]);

  const timerProgress = (timer / totalTime) * 100;
  const timerColor = timerProgress < 60 ? '#22c55e' : timerProgress < 85 ? '#f59e0b' : '#ef4444';

  // ── SETUP PHASE ──
  if (phase === 'setup') {
    return (
      <div className="lcc-container">
        <div className="lcc-setup">
          <button className="lcc-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Back
          </button>

          <div className="lcc-setup-hero">
            <div className="lcc-hero-icon">
              <Sparkles size={40} />
            </div>
            <h1>Live Coding Copilot</h1>
            <p>Write code in real-time while getting scored on 4 key dimensions. Build habits that impress interviewers.</p>
          </div>

          <div className="lcc-setup-grid">
            <div className="lcc-setup-card">
              <h3>Difficulty</h3>
              <div className="lcc-option-group">
                {DIFFICULTY_FILTER.map(d => (
                  <button
                    key={d}
                    className={`lcc-option ${difficulty === d ? 'active' : ''}`}
                    onClick={() => setDifficulty(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="lcc-setup-card">
              <h3>Language</h3>
              <div className="lcc-option-group">
                {LANGUAGES.map(l => (
                  <button
                    key={l.id}
                    className={`lcc-option ${language === l.id ? 'active' : ''}`}
                    onClick={() => setLanguage(l.id)}
                  >
                    {l.icon} {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="lcc-setup-card scoring-preview">
              <h3>What You'll Be Scored On</h3>
              <div className="lcc-rubric-grid">
                {SCORING_RUBRICS.liveCoding.axes.map(axis => (
                  <div key={axis.id} className="lcc-rubric-item" style={{ borderColor: axis.color }}>
                    <span>{axis.icon}</span>
                    <div>
                      <strong>{axis.label}</strong>
                      <p>{axis.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button className="lcc-start-btn" onClick={startSession}>
            <Play size={20} />
            Start 30-Minute Session
          </button>
        </div>
      </div>
    );
  }

  // ── CODING PHASE ──
  if (phase === 'coding') {
    return (
      <div className="lcc-container coding">
        {/* Timer Bar */}
        <div className="lcc-timer-bar">
          <div className="lcc-timer-progress" style={{ width: `${timerProgress}%`, background: timerColor }} />
          <div className="lcc-timer-content">
            <div className="lcc-timer-left">
              <Timer size={14} style={{ color: timerColor }} />
              <span style={{ color: timerColor }}>{formatTime(timer)}</span>
              <span className="lcc-timer-sep">/</span>
              <span>{formatTime(totalTime)}</span>
            </div>
            <div className="lcc-timer-center">
              {problem && <span className="lcc-problem-badge">{problem.title}</span>}
              <span className={`lcc-diff-badge ${difficulty.toLowerCase()}`}>{difficulty}</span>
            </div>
            <div className="lcc-timer-right">
              <span className="lcc-analysis-count">
                <Zap size={12} /> {analysisCount} analyses
              </span>
              <button className="lcc-submit-btn" onClick={handleSubmit}>
                <CheckCircle size={14} /> Submit
              </button>
            </div>
          </div>
        </div>

        <div className="lcc-coding-layout">
          {/* Left: Problem + Editor */}
          <div className="lcc-editor-section">
            {/* Problem Description */}
            {problem && (
              <div className="lcc-problem-bar">
                <div className="lcc-problem-title">
                  <Code2 size={14} />
                  <strong>{problem.title}</strong>
                </div>
                <p className="lcc-problem-desc">
                  {problem.description || problem.prompt || 'Solve the problem using an efficient approach.'}
                </p>
                {problem.examples && problem.examples.length > 0 && (
                  <div className="lcc-examples">
                    {problem.examples.slice(0, 2).map((ex, i) => (
                      <div key={i} className="lcc-example">
                        <span>Input: {JSON.stringify(ex.input)}</span>
                        <span>Output: {JSON.stringify(ex.output)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Monaco Editor */}
            <div className="lcc-editor-wrapper">
              <div className="lcc-editor-header">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="lcc-lang-select"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.id} value={l.id}>{l.icon} {l.label}</option>
                  ))}
                </select>
                <button
                  className="lcc-reset-btn"
                  onClick={() => setCode(STARTER_CODE[language])}
                  title="Reset code"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
              <Editor
                height="100%"
                language={language === 'cpp' ? 'cpp' : language}
                value={code}
                onChange={handleCodeChange}
                onMount={(editor) => { editorRef.current = editor; }}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  tabSize: 4,
                  automaticLayout: true,
                  padding: { top: 12 },
                  bracketPairColorization: { enabled: true },
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                }}
              />
            </div>
          </div>

          {/* Right: Live Scores */}
          <div className="lcc-scores-section">
            <div className="lcc-scores-header">
              <Sparkles size={16} />
              <h3>Live Analysis</h3>
              <div className={`lcc-pulse ${analysisCount > 0 ? 'active' : ''}`} />
            </div>

            <div className="lcc-gauges">
              {SCORING_RUBRICS.liveCoding.axes.map(axis => (
                <ScoreGauge
                  key={axis.id}
                  label={axis.label}
                  score={liveScores[axis.id]?.score || 0}
                  icon={axis.icon}
                  color={axis.color}
                />
              ))}
            </div>

            {/* Live Issues */}
            <div className="lcc-live-issues">
              <h4><AlertTriangle size={13} /> Live Feedback</h4>
              {Object.values(liveScores).flatMap(s => s.issues || []).length === 0 ? (
                <p className="lcc-no-issues">
                  <Info size={13} /> Keep coding — feedback appears as you write
                </p>
              ) : (
                <ul>
                  {Object.entries(liveScores).flatMap(([key, s]) =>
                    (s.issues || []).map((issue, i) => (
                      <li key={`${key}-${i}`}>
                        <span className="issue-dot" style={{ background: SCORING_RUBRICS.liveCoding.axes.find(a => a.id === key)?.color || '#64748b' }} />
                        {issue}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTS PHASE ──
  if (phase === 'results' && report) {
    return (
      <div className="lcc-container results">
        <div className="lcc-results">
          <div className="lcc-results-header">
            <div className="lcc-results-grade" data-grade={report.grade}>
              <span className="grade-letter">{report.grade}</span>
              <span className="grade-score">{report.overallScore}/100</span>
            </div>
            <div>
              <h1>Session Complete</h1>
              <p>
                {problem?.title} • {difficulty} • {formatTime(timer)} elapsed
              </p>
            </div>
          </div>

          <div className="lcc-results-gauges">
            {report.axes.map(axis => (
              <div key={axis.id} className="lcc-result-axis">
                <ScoreGauge
                  label={axis.label}
                  score={axis.score}
                  icon={axis.icon}
                  color={axis.color}
                />
                {axis.issues && axis.issues.length > 0 && (
                  <ul className="lcc-axis-issues">
                    {axis.issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Learning Links */}
          {report.failedConcepts.length > 0 && (
            <InterviewRemediationPanel failedConcepts={report.failedConcepts} />
          )}

          <div className="lcc-results-actions">
            <button className="lcc-action-btn secondary" onClick={() => setPhase('setup')}>
              <RotateCcw size={16} /> New Session
            </button>
            <button className="lcc-action-btn primary" onClick={() => navigate('/interview-analytics')}>
              <TrendingUp size={16} /> View Analytics
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
