import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { ArrowLeft, Bug, Play, Timer, CheckCircle, X, AlertTriangle, Eye, Wrench, Zap, TrendingUp, RotateCcw, ChevronRight, MessageSquare, Award, Clock, Target, Code2, Lightbulb, ArrowRight } from 'lucide-react';
import {DEBUGGING_CHALLENGES} from '../data/interviewModesData';
import { analyzeDebuggingBehavior } from '../utils/interviewScoringEngine';
import InterviewRemediationPanel from '../components/InterviewRemediationPanel';
import './DebuggingInterview.css';

const CATEGORIES = [
  { id: 'all', label: 'All Bugs', icon: '🐛' },
  { id: 'logic', label: 'Logic Errors', icon: '🧠' },
  { id: 'performance', label: 'Performance', icon: '⚡' },
  { id: 'edge_case', label: 'Edge Cases', icon: '🔎' },
  { id: 'syntax', label: 'Syntax Issues', icon: '📝' },
];

const PHASES = {
  SELECT: 'select',
  IDENTIFY: 'identify',
  FIX: 'fix',
  EXPLAIN: 'explain',
  RESULTS: 'results',
};

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function DebuggingInterview() {
  const navigate = useNavigate();
  const editorRef = useRef(null);

  const [phase, setPhase] = useState(PHASES.SELECT);
  const [category, setCategory] = useState('all');
  const [challenge, setChallenge] = useState(null);

  // Track user actions for scoring
  const [fixedCode, setFixedCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [identifiedBugs, setIdentifiedBugs] = useState([]);
  const [bugInput, setBugInput] = useState('');
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [_startTime, setStartTime] = useState(null);
  const [phaseTimestamps, setPhaseTimestamps] = useState({});
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(null);

  // Timer
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => setTimer(p => p + 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  const filteredChallenges = useMemo(() => {
    if (category === 'all') return DEBUGGING_CHALLENGES;
    return DEBUGGING_CHALLENGES.filter(c => c.category === category);
  }, [category]);

  const startChallenge = (ch) => {
    setChallenge(ch);
    setFixedCode(ch.buggyCode);
    setExplanation('');
    setIdentifiedBugs([]);
    setBugInput('');
    setTimer(0);
    setTimerActive(true);
    setStartTime(Date.now());
    setHintsUsed(0);
    setShowHint(false);
    setScore(null);
    setPhaseTimestamps({ identifyStart: Date.now() });
    setPhase(PHASES.IDENTIFY);
  };

  const addIdentifiedBug = () => {
    if (bugInput.trim()) {
      setIdentifiedBugs(prev => [...prev, bugInput.trim()]);
      setBugInput('');
    }
  };

  const removeBug = (idx) => {
    setIdentifiedBugs(prev => prev.filter((_, i) => i !== idx));
  };

  const goToFix = () => {
    setPhaseTimestamps(prev => ({ ...prev, identifyEnd: Date.now(), fixStart: Date.now() }));
    setPhase(PHASES.FIX);
  };

  const goToExplain = () => {
    setPhaseTimestamps(prev => ({ ...prev, fixEnd: Date.now(), explainStart: Date.now() }));
    setPhase(PHASES.EXPLAIN);
  };

  const handleSubmit = useCallback(() => {
    setTimerActive(false);
    const endTime = Date.now();
    const timestamps = { ...phaseTimestamps, explainEnd: endTime };

    // Score the attempt
    const result = analyzeDebuggingBehavior(
      challenge.buggyCode,
      fixedCode,
      identifiedBugs,
      explanation,
      challenge,
      {
        totalTime: timer,
        hintsUsed,
        phaseTimestamps: timestamps,
      }
    );
    setScore(result);
    setPhase(PHASES.RESULTS);
  }, [challenge, fixedCode, identifiedBugs, explanation, timer, hintsUsed, phaseTimestamps]);

  const useHint = () => {
    setHintsUsed(prev => prev + 1);
    setShowHint(true);
  };

  // ── SELECT PHASE ──
  if (phase === PHASES.SELECT) {
    return (
      <div className="dbg-container">
        <div className="dbg-select">
          <button className="dbg-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Back
          </button>

          <div className="dbg-hero">
            <div className="dbg-hero-icon"><Bug size={36} /></div>
            <h1>Debugging Interview Mode</h1>
            <p>Find, fix, and explain bugs in production-like code — just like a real debugging interview round.</p>
          </div>

          <div className="dbg-categories">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                className={`dbg-cat-btn ${category === c.id ? 'active' : ''}`}
                onClick={() => setCategory(c.id)}
              >
                <span>{c.icon}</span> {c.label}
              </button>
            ))}
          </div>

          <div className="dbg-challenge-grid">
            {filteredChallenges.map((ch, idx) => (
              <div key={ch.id || idx} className="dbg-challenge-card" onClick={() => startChallenge(ch)}>
                <div className="dbg-card-header">
                  <span className={`dbg-severity ${ch.severity || 'medium'}`}>
                    {ch.severity === 'hard' ? '🔴' : ch.severity === 'easy' ? '🟢' : '🟡'} {ch.severity || 'Medium'}
                  </span>
                  <span className="dbg-card-lang">{ch.language || 'Python'}</span>
                </div>
                <h3>{ch.title}</h3>
                <p>{ch.description}</p>
                <div className="dbg-card-meta">
                  <span><Bug size={12} /> {ch.bugCount || ch.bugs?.length || '?'} bug{(ch.bugCount || ch.bugs?.length || 0) !== 1 ? 's' : ''}</span>
                  <span><Clock size={12} /> {ch.estimatedTime || '10-15 min'}</span>
                </div>
                <div className="dbg-card-arrow"><ChevronRight size={16} /></div>
              </div>
            ))}

            {filteredChallenges.length === 0 && (
              <div className="dbg-empty">
                <Bug size={32} />
                <p>No challenges in this category yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── IDENTIFY PHASE ──
  if (phase === PHASES.IDENTIFY && challenge) {
    return (
      <div className="dbg-container coding">
        <div className="dbg-timer-bar">
          <div className="dbg-timer-content">
            <div className="dbg-timer-left">
              <Timer size={14} className="dbg-timer-icon" />
              <span>{formatTime(timer)}</span>
            </div>
            <div className="dbg-phase-indicator">
              <span className="dbg-phase active">1. Identify</span>
              <ChevronRight size={12} />
              <span className="dbg-phase">2. Fix</span>
              <ChevronRight size={12} />
              <span className="dbg-phase">3. Explain</span>
            </div>
            <div className="dbg-timer-right">
              <button className="dbg-hint-btn" onClick={useHint} disabled={showHint}>
                <Lightbulb size={14} /> Hint ({hintsUsed})
              </button>
            </div>
          </div>
        </div>

        <div className="dbg-identify-layout">
          <div className="dbg-code-panel">
            <div className="dbg-panel-header">
              <Eye size={14} /> <strong>Buggy Code</strong>
              <span className="dbg-code-title">{challenge.title}</span>
            </div>
            <Editor
              height="100%"
              language={challenge.language || 'python'}
              value={challenge.buggyCode}
              theme="vs-dark"
              options={{
                readOnly: true,
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                padding: { top: 12 },
                lineNumbers: 'on',
              }}
            />
          </div>

          <div className="dbg-identify-panel">
            <h3><Target size={14} /> Identify the Bugs</h3>
            <p className="dbg-instruction">Read the code and list every bug you can find. Be specific about what's wrong and where.</p>

            {showHint && challenge.hints && challenge.hints.length > 0 && (
              <div className="dbg-hint-box">
                <Lightbulb size={14} />
                <span>{challenge.hints[Math.min(hintsUsed - 1, challenge.hints.length - 1)]}</span>
              </div>
            )}

            <div className="dbg-bug-input-row">
              <input
                type="text"
                value={bugInput}
                onChange={e => setBugInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addIdentifiedBug()}
                placeholder="Describe a bug you found..."
                className="dbg-bug-input"
              />
              <button className="dbg-add-bug" onClick={addIdentifiedBug} disabled={!bugInput.trim()}>
                Add
              </button>
            </div>

            <div className="dbg-bug-list">
              {identifiedBugs.map((bug, i) => (
                <div key={i} className="dbg-bug-item">
                  <span className="dbg-bug-num">#{i+1}</span>
                  <span className="dbg-bug-text">{bug}</span>
                  <button className="dbg-bug-remove" onClick={() => removeBug(i)}><X size={12} /></button>
                </div>
              ))}
              {identifiedBugs.length === 0 && (
                <p className="dbg-empty-bugs">No bugs identified yet. Read the code carefully!</p>
              )}
            </div>

            <button className="dbg-next-btn" onClick={goToFix} disabled={identifiedBugs.length === 0}>
              Next: Fix the Code <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── FIX PHASE ──
  if (phase === PHASES.FIX && challenge) {
    return (
      <div className="dbg-container coding">
        <div className="dbg-timer-bar">
          <div className="dbg-timer-content">
            <div className="dbg-timer-left">
              <Timer size={14} className="dbg-timer-icon" />
              <span>{formatTime(timer)}</span>
            </div>
            <div className="dbg-phase-indicator">
              <span className="dbg-phase done">✓ Identify</span>
              <ChevronRight size={12} />
              <span className="dbg-phase active">2. Fix</span>
              <ChevronRight size={12} />
              <span className="dbg-phase">3. Explain</span>
            </div>
            <div className="dbg-timer-right">
              <span className="dbg-bugs-found">{identifiedBugs.length} bugs found</span>
            </div>
          </div>
        </div>

        <div className="dbg-fix-layout">
          <div className="dbg-code-panel">
            <div className="dbg-panel-header">
              <Wrench size={14} /> <strong>Fix the Code</strong>
            </div>
            <Editor
              height="100%"
              language={challenge.language || 'python'}
              value={fixedCode}
              onChange={val => setFixedCode(val || '')}
              onMount={editor => { editorRef.current = editor; }}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                padding: { top: 12 },
                lineNumbers: 'on',
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>

          <div className="dbg-fix-sidebar">
            <h4>Your Identified Bugs</h4>
            <ul className="dbg-fix-bugs">
              {identifiedBugs.map((bug, i) => (
                <li key={i}><span>#{i+1}</span> {bug}</li>
              ))}
            </ul>

            <button className="dbg-next-btn" onClick={goToExplain}>
              Next: Explain Your Fix <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── EXPLAIN PHASE ──
  if (phase === PHASES.EXPLAIN && challenge) {
    return (
      <div className="dbg-container coding">
        <div className="dbg-timer-bar">
          <div className="dbg-timer-content">
            <div className="dbg-timer-left">
              <Timer size={14} className="dbg-timer-icon" />
              <span>{formatTime(timer)}</span>
            </div>
            <div className="dbg-phase-indicator">
              <span className="dbg-phase done">✓ Identify</span>
              <ChevronRight size={12} />
              <span className="dbg-phase done">✓ Fix</span>
              <ChevronRight size={12} />
              <span className="dbg-phase active">3. Explain</span>
            </div>
            <div className="dbg-timer-right">
              <button className="dbg-submit-final" onClick={handleSubmit}>
                <CheckCircle size={14} /> Submit
              </button>
            </div>
          </div>
        </div>

        <div className="dbg-explain-layout">
          <div className="dbg-explain-panel">
            <h3><MessageSquare size={16} /> Explain Your Debugging Process</h3>
            <p className="dbg-instruction">
              In a real interview, you'd walk through your thought process. Explain:
            </p>
            <ul className="dbg-explain-prompts">
              <li>How you identified each bug</li>
              <li>Why the original code was wrong</li>
              <li>How your fix addresses the root cause</li>
              <li>Any potential edge cases or optimizations</li>
            </ul>

            <textarea
              className="dbg-explain-textarea"
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              placeholder="Walk through your debugging process step by step..."
              rows={12}
            />

            <div className="dbg-explain-meta">
              <span>{explanation.split(/\s+/).filter(Boolean).length} words</span>
              <span>•</span>
              <span>{identifiedBugs.length} bugs identified</span>
              <span>•</span>
              <span>{hintsUsed} hints used</span>
            </div>

            <button className="dbg-submit-btn" onClick={handleSubmit}>
              <Award size={16} /> Submit & Get Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTS PHASE ──
  if (phase === PHASES.RESULTS && score && challenge) {
    const bugAccuracy = challenge.bugs
      ? Math.round((Math.min(identifiedBugs.length, challenge.bugs.length) / challenge.bugs.length) * 100)
      : score.score;

    return (
      <div className="dbg-container results">
        <div className="dbg-results">
          <div className="dbg-results-header">
            <div className={`dbg-results-grade grade-${score.score >= 80 ? 'a' : score.score >= 60 ? 'b' : score.score >= 40 ? 'c' : 'd'}`}>
              <span className="dbg-grade-score">{score.score}</span>
              <span className="dbg-grade-sub">/100</span>
            </div>
            <div>
              <h1>{challenge.title}</h1>
              <p>{formatTime(timer)} elapsed • {identifiedBugs.length} bugs found • {hintsUsed} hints used</p>
            </div>
          </div>

          <div className="dbg-results-grid">
            <div className="dbg-result-card">
              <h4><Target size={14} /> Bug Identification</h4>
              <div className="dbg-result-bar">
                <div className="dbg-result-fill" style={{ width: `${bugAccuracy}%` }} />
              </div>
              <p>{bugAccuracy}% — Found {identifiedBugs.length} of {challenge.bugs?.length || '?'} bugs</p>
            </div>

            <div className="dbg-result-card">
              <h4><Wrench size={14} /> Code Fix Quality</h4>
              <div className="dbg-result-bar">
                <div className="dbg-result-fill" style={{ width: `${score.details?.fixQuality || score.score}%` }} />
              </div>
              <p>{score.details?.fixQuality || score.score}% — Changes applied correctly</p>
            </div>

            <div className="dbg-result-card">
              <h4><MessageSquare size={14} /> Explanation Depth</h4>
              <div className="dbg-result-bar">
                <div className="dbg-result-fill" style={{ width: `${score.details?.explanationDepth || 0}%` }} />
              </div>
              <p>{score.details?.explanationDepth || 0}% — Clarity and thoroughness</p>
            </div>

            <div className="dbg-result-card">
              <h4><Zap size={14} /> Speed & Efficiency</h4>
              <div className="dbg-result-bar">
                <div className="dbg-result-fill" style={{ width: `${score.details?.efficiency || 0}%` }} />
              </div>
              <p>{score.details?.efficiency || 0}% — Time management</p>
            </div>
          </div>

          {/* Issues & Tips */}
          {score.issues && score.issues.length > 0 && (
            <div className="dbg-results-feedback">
              <h3><AlertTriangle size={14} /> Feedback</h3>
              <ul>
                {score.issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Correct Answer Reveal */}
          {challenge.fixedCode && (
            <div className="dbg-correct-answer">
              <h3><CheckCircle size={14} /> Reference Solution</h3>
              <Editor
                height="200px"
                language={challenge.language || 'python'}
                value={challenge.fixedCode}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  padding: { top: 8 },
                }}
              />
            </div>
          )}

          {/* Remediation */}
          {score.failedConcepts && score.failedConcepts.length > 0 && (
            <InterviewRemediationPanel failedConcepts={score.failedConcepts} />
          )}

          <div className="dbg-results-actions">
            <button className="dbg-action secondary" onClick={() => { setPhase(PHASES.SELECT); setChallenge(null); }}>
              <RotateCcw size={16} /> Try Another
            </button>
            <button className="dbg-action primary" onClick={() => navigate('/interview-analytics')}>
              <TrendingUp size={16} /> Analytics
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
