import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  ArrowLeft, GitPullRequest, MessageSquare, Send, CheckCircle, AlertTriangle,
  ChevronRight, RotateCcw, Award, TrendingUp, Clock, Target, Star,
  ThumbsUp, ThumbsDown, Code2, Zap, Eye, Shield, Scale
} from 'lucide-react';
import { CODE_REVIEW_SCENARIOS, SCORING_RUBRICS } from '../data/interviewModesData';
import InterviewRemediationPanel from '../components/InterviewRemediationPanel';
import './CodeReviewInterview.css';

const REVIEW_CATEGORIES = [
  { id: 'correctness', label: 'Correctness', icon: <CheckCircle size={13} />, color: '#ef4444' },
  { id: 'readability', label: 'Readability', icon: <Eye size={13} />, color: '#3b82f6' },
  { id: 'performance', label: 'Performance', icon: <Zap size={13} />, color: '#f59e0b' },
  { id: 'security', label: 'Security', icon: <Shield size={13} />, color: '#8b5cf6' },
  { id: 'edge_case', label: 'Edge Cases', icon: <Target size={13} />, color: '#22c55e' },
  { id: 'scalability', label: 'Scalability', icon: <Scale size={13} />, color: '#ec4899' },
];

const PHASES = {
  SELECT: 'select',
  REVIEW: 'review',
  RESULTS: 'results',
};

export default function CodeReviewInterview() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState(PHASES.SELECT);
  const [scenario, setScenario] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('correctness');
  const [selectedLine, setSelectedLine] = useState(null);
  const [overallVerdict, setOverallVerdict] = useState(null); // 'approve' | 'request_changes' | 'comment'
  const [summaryComment, setSummaryComment] = useState('');
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [result, setResult] = useState(null);

  // Timer
  React.useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => setTimer(p => p + 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  const startReview = (sc) => {
    setScenario(sc);
    setComments([]);
    setCommentInput('');
    setSelectedCategory('correctness');
    setSelectedLine(null);
    setOverallVerdict(null);
    setSummaryComment('');
    setTimer(0);
    setTimerActive(true);
    setResult(null);
    setPhase(PHASES.REVIEW);
  };

  const addComment = () => {
    if (!commentInput.trim()) return;
    setComments(prev => [...prev, {
      id: Date.now(),
      line: selectedLine,
      category: selectedCategory,
      text: commentInput.trim(),
      timestamp: timer,
    }]);
    setCommentInput('');
    setSelectedLine(null);
  };

  const removeComment = (id) => {
    setComments(prev => prev.filter(c => c.id !== id));
  };

  const submitReview = useCallback(() => {
    setTimerActive(false);

    if (!scenario) return;

    // Score the review
    const expectedIssues = scenario.expectedIssues || [];
    const totalExpected = expectedIssues.length;

    // Match user comments to expected issues (simplified keyword matching)
    let matchedIssues = 0;
    const matchedCategories = new Set();
    const allCommentText = comments.map(c => c.text.toLowerCase()).join(' ');

    expectedIssues.forEach(issue => {
      const keywords = (issue.keywords || []).map(k => k.toLowerCase());
      if (keywords.some(kw => allCommentText.includes(kw))) {
        matchedIssues++;
        matchedCategories.add(issue.category);
      }
    });

    const coverageScore = totalExpected > 0 ? Math.round((matchedIssues / totalExpected) * 100) : 50;

    // Score comment quality via heuristics
    const avgWordCount = comments.length > 0
      ? comments.reduce((s, c) => s + c.text.split(/\s+/).length, 0) / comments.length
      : 0;
    const qualityScore = Math.min(100, Math.round(
      (avgWordCount > 15 ? 40 : avgWordCount > 8 ? 25 : 10) +
      (comments.length >= 3 ? 20 : comments.length >= 1 ? 10 : 0) +
      (summaryComment.length > 50 ? 20 : summaryComment.length > 20 ? 10 : 0) +
      (overallVerdict ? 20 : 0)
    ));

    // Verdict accuracy
    const correctVerdict = scenario.expectedVerdict || 'request_changes';
    const verdictScore = overallVerdict === correctVerdict ? 100 : overallVerdict ? 40 : 0;

    // Category coverage
    const uniqueCats = new Set(comments.map(c => c.category));
    const categoryScore = Math.min(100, Math.round((uniqueCats.size / 4) * 100));

    const overall = Math.round(
      coverageScore * 0.35 +
      qualityScore * 0.25 +
      verdictScore * 0.2 +
      categoryScore * 0.2
    );

    const issues = [];
    if (coverageScore < 60) issues.push('Missed several key issues in the code');
    if (qualityScore < 50) issues.push('Review comments could be more detailed and actionable');
    if (!overallVerdict) issues.push('No overall verdict was provided');
    if (uniqueCats.size < 2) issues.push('Review focused on only one category — consider breadth');
    if (comments.length < 2) issues.push('Very few comments — thoroughness is important');

    // Failed concepts for remediation
    const failedConcepts = [];
    if (coverageScore < 50) {
      failedConcepts.push({ conceptId: 'code_review', score: coverageScore, description: 'Identifying code issues during review' });
    }
    if (categoryScore < 40) {
      failedConcepts.push({ conceptId: 'edge_cases', score: categoryScore, description: 'Considering multiple review dimensions' });
    }

    setResult({
      overall,
      coverageScore,
      qualityScore,
      verdictScore,
      categoryScore,
      matchedIssues,
      totalExpected,
      issues,
      failedConcepts,
    });
    setPhase(PHASES.RESULTS);
  }, [scenario, comments, overallVerdict, summaryComment, timer]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ── SELECT PHASE ──
  if (phase === PHASES.SELECT) {
    return (
      <div className="crv-container">
        <div className="crv-select">
          <button className="crv-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Back
          </button>

          <div className="crv-hero">
            <div className="crv-hero-icon"><GitPullRequest size={36} /></div>
            <h1>Code Review Interview</h1>
            <p>Review pull requests like a senior engineer. Find bugs, suggest improvements, and provide actionable feedback.</p>
          </div>

          <div className="crv-scenario-grid">
            {CODE_REVIEW_SCENARIOS.map((sc, idx) => (
              <div key={sc.id || idx} className="crv-scenario-card" onClick={() => startReview(sc)}>
                <div className="crv-card-header">
                  <span className={`crv-diff-badge ${(sc.difficulty || 'medium').toLowerCase()}`}>
                    {sc.difficulty || 'Medium'}
                  </span>
                  <span className="crv-card-lang">{sc.language || 'JavaScript'}</span>
                </div>
                <h3>{sc.title}</h3>
                <p>{sc.context || sc.description}</p>
                <div className="crv-card-meta">
                  <span><Target size={12} /> {sc.expectedIssues?.length || '?'} issues</span>
                  <span><Clock size={12} /> {sc.estimatedTime || '10-15 min'}</span>
                </div>
                <div className="crv-card-tags">
                  {(sc.tags || []).slice(0, 3).map(tag => (
                    <span key={tag} className="crv-tag">{tag}</span>
                  ))}
                </div>
              </div>
            ))}

            {CODE_REVIEW_SCENARIOS.length === 0 && (
              <div className="crv-empty">
                <GitPullRequest size={32} />
                <p>No review scenarios available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── REVIEW PHASE ──
  if (phase === PHASES.REVIEW && scenario) {
    return (
      <div className="crv-container coding">
        <div className="crv-timer-bar">
          <div className="crv-timer-content">
            <div className="crv-timer-left">
              <Clock size={14} />
              <span>{formatTime(timer)}</span>
            </div>
            <div className="crv-timer-center">
              <GitPullRequest size={14} />
              <span>{scenario.title}</span>
            </div>
            <div className="crv-timer-right">
              <span className="crv-comment-count">{comments.length} comments</span>
              <button
                className="crv-submit-btn"
                onClick={submitReview}
                disabled={comments.length === 0 && !summaryComment}
              >
                <Send size={14} /> Submit Review
              </button>
            </div>
          </div>
        </div>

        <div className="crv-review-layout">
          {/* Code Panel */}
          <div className="crv-code-panel">
            <div className="crv-panel-header">
              <Code2 size={14} />
              <strong>PR Code — {scenario.title}</strong>
            </div>
            {scenario.context && (
              <div className="crv-pr-context">
                <strong>PR Description:</strong> {scenario.context}
              </div>
            )}
            <Editor
              height="100%"
              language={scenario.language || 'javascript'}
              value={scenario.code}
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
                glyphMargin: true,
              }}
              onMount={(editor) => {
                editor.onDidChangeCursorPosition((e) => {
                  setSelectedLine(e.position.lineNumber);
                });
              }}
            />
          </div>

          {/* Review Panel */}
          <div className="crv-review-panel">
            {/* Add Comment */}
            <div className="crv-add-section">
              <h3><MessageSquare size={14} /> Add Review Comment</h3>

              {selectedLine && (
                <div className="crv-line-indicator">
                  Commenting on <strong>Line {selectedLine}</strong>
                </div>
              )}

              <div className="crv-category-row">
                {REVIEW_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    className={`crv-cat-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={selectedCategory === cat.id ? { borderColor: cat.color, color: cat.color } : {}}
                    title={cat.label}
                  >
                    {cat.icon}
                  </button>
                ))}
              </div>

              <textarea
                className="crv-comment-input"
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                placeholder="What's the issue? Suggest a fix..."
                rows={3}
              />

              <button
                className="crv-add-btn"
                onClick={addComment}
                disabled={!commentInput.trim()}
              >
                <Send size={13} /> Add Comment
              </button>
            </div>

            {/* Comment List */}
            <div className="crv-comments-list">
              <h4>Your Comments ({comments.length})</h4>
              {comments.length === 0 ? (
                <p className="crv-no-comments">Click on a line and start reviewing!</p>
              ) : (
                comments.map(c => {
                  const cat = REVIEW_CATEGORIES.find(r => r.id === c.category);
                  return (
                    <div key={c.id} className="crv-comment-item">
                      <div className="crv-comment-header">
                        <span className="crv-comment-cat" style={{ color: cat?.color }}>
                          {cat?.icon} {cat?.label}
                        </span>
                        {c.line && <span className="crv-comment-line">L{c.line}</span>}
                        <button className="crv-comment-remove" onClick={() => removeComment(c.id)}>
                          <RotateCcw size={10} />
                        </button>
                      </div>
                      <p className="crv-comment-text">{c.text}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Summary & Verdict */}
            <div className="crv-verdict-section">
              <h4>Overall Verdict</h4>
              <div className="crv-verdict-btns">
                <button
                  className={`crv-verdict approve ${overallVerdict === 'approve' ? 'active' : ''}`}
                  onClick={() => setOverallVerdict('approve')}
                >
                  <ThumbsUp size={14} /> Approve
                </button>
                <button
                  className={`crv-verdict comment ${overallVerdict === 'comment' ? 'active' : ''}`}
                  onClick={() => setOverallVerdict('comment')}
                >
                  <MessageSquare size={14} /> Comment
                </button>
                <button
                  className={`crv-verdict request ${overallVerdict === 'request_changes' ? 'active' : ''}`}
                  onClick={() => setOverallVerdict('request_changes')}
                >
                  <ThumbsDown size={14} /> Request Changes
                </button>
              </div>

              <textarea
                className="crv-summary-input"
                value={summaryComment}
                onChange={e => setSummaryComment(e.target.value)}
                placeholder="Overall review summary..."
                rows={2}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTS PHASE ──
  if (phase === PHASES.RESULTS && result && scenario) {
    return (
      <div className="crv-container results">
        <div className="crv-results">
          <div className="crv-results-header">
            <div className={`crv-grade grade-${result.overall >= 80 ? 'a' : result.overall >= 60 ? 'b' : result.overall >= 40 ? 'c' : 'd'}`}>
              <span className="crv-grade-score">{result.overall}</span>
              <span className="crv-grade-label">/100</span>
            </div>
            <div>
              <h1>Review Complete</h1>
              <p>{scenario.title} • {formatTime(timer)} • {comments.length} comments</p>
            </div>
          </div>

          <div className="crv-results-grid">
            <div className="crv-result-card">
              <h4><Target size={14} /> Issue Coverage</h4>
              <div className="crv-bar"><div className="crv-bar-fill" style={{ width: `${result.coverageScore}%` }} /></div>
              <p>{result.matchedIssues}/{result.totalExpected} expected issues found ({result.coverageScore}%)</p>
            </div>
            <div className="crv-result-card">
              <h4><Star size={14} /> Comment Quality</h4>
              <div className="crv-bar"><div className="crv-bar-fill" style={{ width: `${result.qualityScore}%` }} /></div>
              <p>{result.qualityScore}% — Depth and actionability</p>
            </div>
            <div className="crv-result-card">
              <h4><CheckCircle size={14} /> Verdict Accuracy</h4>
              <div className="crv-bar"><div className="crv-bar-fill" style={{ width: `${result.verdictScore}%` }} /></div>
              <p>{result.verdictScore === 100 ? '✓ Correct verdict' : '✗ Expected: ' + (scenario.expectedVerdict || 'request_changes')}</p>
            </div>
            <div className="crv-result-card">
              <h4><Eye size={14} /> Category Coverage</h4>
              <div className="crv-bar"><div className="crv-bar-fill" style={{ width: `${result.categoryScore}%` }} /></div>
              <p>{result.categoryScore}% — Breadth of review</p>
            </div>
          </div>

          {/* Expected Issues Reveal */}
          {scenario.expectedIssues && scenario.expectedIssues.length > 0 && (
            <div className="crv-expected">
              <h3><AlertTriangle size={14} /> Expected Issues</h3>
              <div className="crv-expected-list">
                {scenario.expectedIssues.map((issue, i) => (
                  <div key={i} className="crv-expected-item">
                    <span className="crv-expected-cat">{issue.category}</span>
                    <span>{issue.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.issues.length > 0 && (
            <div className="crv-feedback">
              <h3><MessageSquare size={14} /> Feedback</h3>
              <ul>
                {result.issues.map((issue, i) => <li key={i}>{issue}</li>)}
              </ul>
            </div>
          )}

          {result.failedConcepts.length > 0 && (
            <InterviewRemediationPanel failedConcepts={result.failedConcepts} />
          )}

          <div className="crv-results-actions">
            <button className="crv-action secondary" onClick={() => { setPhase(PHASES.SELECT); setScenario(null); }}>
              <RotateCcw size={16} /> Review Another
            </button>
            <button className="crv-action primary" onClick={() => navigate('/interview-analytics')}>
              <TrendingUp size={16} /> Analytics
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
