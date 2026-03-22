import { useState, useMemo, useEffect } from 'react';
import {
  ChevronDown, ChevronRight, Tag, Building2, Target,
  BarChart3, Lightbulb, BookOpen, ExternalLink, Link2,
  FileText, Clock, CheckCircle2, Eye, EyeOff,
  ChevronUp, AlertCircle, Code2, History, ArrowRight
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export default function ProblemDescriptionPanel({
  problem, problemId, onShowHints, showHints = false, allProblems = [], navigate
}) {
  const [activeTopTab, setActiveTopTab] = useState('problem');
  const [activeSubTab, setActiveSubTab] = useState('description');
  const [showConstraints, setShowConstraints] = useState(true);
  const [showExamples, setShowExamples] = useState(true);
  const [revealedHints, setRevealedHints] = useState(0);
  const [showAllTopics, setShowAllTopics] = useState(false);

  // Solution & History state
  const [solutionCode, setSolutionCode] = useState(null);
  const [loadingSolution, setLoadingSolution] = useState(false);
  const [solutionError, setSolutionError] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  if (!problem) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: 'rgba(255,255,255,0.3)', fontSize: 13,
      }}>
        Loading problem...
      </div>
    );
  }

  const diffColors = {
    Easy: { bg: 'rgba(34,197,94,0.1)', text: '#4ade80', border: 'rgba(34,197,94,0.2)' },
    Medium: { bg: 'rgba(250,204,21,0.1)', text: '#fbbf24', border: 'rgba(250,204,21,0.2)' },
    Hard: { bg: 'rgba(239,68,68,0.1)', text: '#f87171', border: 'rgba(239,68,68,0.2)' },
  };

  const dc = diffColors[problem.difficulty] || diffColors.Medium;
  const topics = problem.topics || [];
  const hints = problem.hints || [];
  const visibleTopics = showAllTopics ? topics : topics.slice(0, 3);
  const hiddenCount = topics.length - 3;

  // ─── Related Questions ───
  const relatedProblems = useMemo(() => {
    if (!problem || !allProblems.length) return [];
    const currentTopics = new Set(problem.topics || []);
    const currentPatterns = new Set(problem.patterns || []);

    const scored = allProblems
      .filter(p => p.id !== problem.id)
      .map(p => {
        let score = 0;
        (p.topics || []).forEach(t => { if (currentTopics.has(t)) score += 2; });
        (p.patterns || []).forEach(pt => { if (currentPatterns.has(pt)) score += 3; });
        if (p.difficulty === problem.difficulty) score += 1;
        return { ...p, score };
      })
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return scored;
  }, [problem, allProblems]);

  // Resolve numeric problem ID for API calls
  const resolvedId = problemId || problem?.id;

  // Fetch solution when Solution tab is activated
  useEffect(() => {
    if (activeTopTab !== 'solution' || !resolvedId || solutionCode !== null) return;
    setLoadingSolution(true);
    setSolutionError(null);
    fetch(`${API_URL}/api/dsa/problems/${resolvedId}/solution`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        setSolutionCode(data.solution || '');
      })
      .catch(err => {
        console.error('Error fetching solution:', err);
        setSolutionError('Could not load solution');
      })
      .finally(() => setLoadingSolution(false));
  }, [activeTopTab, resolvedId]);

  // Fetch submission history when History tab is activated
  useEffect(() => {
    if (activeTopTab !== 'history' || !resolvedId) return;
    setLoadingHistory(true);
    fetch(`${API_URL}/api/practice/submissions?problemId=${resolvedId}`, { headers: getAuthHeaders() })
      .then(r => {
        if (r.status === 401) return { submissions: [] };
        return r.json();
      })
      .then(data => {
        setSubmissions(data.submissions || []);
      })
      .catch(err => {
        console.error('Error fetching submissions:', err);
        setSubmissions([]);
      })
      .finally(() => setLoadingHistory(false));
  }, [activeTopTab, resolvedId]);

  // ─── Top-level tabs ───
  const topTabs = [
    { id: 'problem', label: 'Problem', icon: FileText },
    { id: 'solution', label: 'Solution', icon: Code2 },
    { id: 'history', label: 'History', icon: History },
  ];

  // ─── Sub-tabs (inside Problem) ───
  const subTabs = [
    { id: 'description', label: 'Description', icon: BookOpen },
    { id: 'testcases', label: 'Test Cases', icon: CheckCircle2 },
    { id: 'hints', label: 'Hints', icon: Lightbulb },
    { id: 'related', label: 'Related', icon: Link2 },
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      fontFamily: "'Inter', system-ui, sans-serif",
      background: 'rgba(10,10,26,0.95)',
    }}>

      {/* ═══ Top Tabs: Problem | Solution | History ═══ */}
      <div style={{
        display: 'flex', flexShrink: 0,
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {topTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTopTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTopTab(tab.id)} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, padding: '10px 8px', cursor: 'pointer',
              background: isActive ? 'rgba(139,92,246,0.08)' : 'transparent',
              border: 'none',
              borderBottom: `2px solid ${isActive ? '#8b5cf6' : 'transparent'}`,
              color: isActive ? '#c084fc' : 'rgba(255,255,255,0.4)',
              fontSize: 12, fontWeight: 700,
              transition: 'all 0.2s ease',
              letterSpacing: 0.3,
            }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══ PROBLEM TAB ═══ */}
      {activeTopTab === 'problem' && (
        <>
          {/* Title + Badges */}
          <div style={{
            padding: '14px 16px 10px', flexShrink: 0,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <h2 style={{
              fontSize: 17, fontWeight: 800, color: '#fff',
              margin: '0 0 10px 0', lineHeight: 1.3,
            }}>{problem.title}</h2>

            {/* Difficulty + DSA badge */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
              <span style={{
                padding: '3px 10px', borderRadius: 6,
                background: dc.bg, color: dc.text, border: `1px solid ${dc.border}`,
                fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                {problem.difficulty}
              </span>
              <span style={{
                padding: '3px 10px', borderRadius: 6,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700,
              }}>
                DSA
              </span>
            </div>

            {/* Topics tags */}
            {topics.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{
                  color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700,
                  marginRight: 2,
                }}>Topics:</span>
                {visibleTopics.map(topic => (
                  <span key={topic} style={{
                    padding: '3px 10px', borderRadius: 6,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 700,
                    cursor: 'default', transition: 'all 0.2s ease',
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(139,92,246,0.1)';
                      e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)';
                      e.currentTarget.style.color = '#c084fc';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                    }}
                  >
                    {topic}
                  </span>
                ))}
                {!showAllTopics && hiddenCount > 0 && (
                  <button onClick={() => setShowAllTopics(true)} style={{
                    padding: '3px 8px', borderRadius: 6, cursor: 'pointer',
                    background: 'rgba(139,92,246,0.08)',
                    border: '1px solid rgba(139,92,246,0.15)',
                    color: '#a78bfa', fontSize: 10, fontWeight: 700,
                    transition: 'all 0.2s ease',
                  }}>
                    +{hiddenCount} more
                  </button>
                )}
                {showAllTopics && hiddenCount > 0 && (
                  <button onClick={() => setShowAllTopics(false)} style={{
                    padding: '3px 8px', borderRadius: 6, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700,
                  }}>
                    less
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ─── Sub-tabs: Description | Test Cases | Hints ─── */}
          <div style={{
            display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '0 12px', flexShrink: 0,
            background: 'rgba(255,255,255,0.01)',
          }}>
            {subTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveSubTab(tab.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '8px 14px', cursor: 'pointer',
                  background: 'transparent', border: 'none',
                  borderBottom: `2px solid ${isActive ? '#8b5cf6' : 'transparent'}`,
                  color: isActive ? '#c084fc' : 'rgba(255,255,255,0.4)',
                  fontSize: 11, fontWeight: 700, transition: 'all 0.2s ease',
                }}>
                  <Icon size={12} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ─── Sub-tab Content ─── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

            {/* ── Description ── */}
            {activeSubTab === 'description' && (
              <>
                <div style={{
                  fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8,
                  marginBottom: 20,
                }}>
                  <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{problem.description}</p>
                </div>

                {/* Examples */}
                {problem.examples && problem.examples.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {problem.examples.map((ex, i) => (
                        <div key={i}>
                          <p style={{
                            color: '#fff', fontSize: 14, fontWeight: 700, margin: '0 0 8px 0'
                          }}>
                            Example {i + 1}:
                          </p>
                          <div style={{
                            padding: '12px 16px', borderRadius: 8,
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderLeft: '2px solid rgba(255, 255, 255, 0.2)',
                            fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                            color: 'rgba(255,255,255,0.8)', lineHeight: 1.6
                          }}>
                            <div style={{ marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, color: '#fff' }}>Input: </span>
                              <span>{ex.input}</span>
                            </div>
                            <div style={{ marginBottom: ex.explanation ? 4 : 0 }}>
                              <span style={{ fontWeight: 700, color: '#fff' }}>Output: </span>
                              <span>{ex.output}</span>
                            </div>
                            {ex.explanation && (
                              <div style={{ marginTop: 4 }}>
                                <span style={{ fontWeight: 700, color: '#fff' }}>Explanation: </span>
                                <span style={{ whiteSpace: 'pre-wrap' }}>{ex.explanation}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Constraints */}
                {problem.constraints && (
                  <div style={{ marginBottom: 24 }}>
                    <p style={{
                      color: '#fff', fontSize: 14, fontWeight: 700, margin: '0 0 12px 0'
                    }}>
                      Constraints:
                    </p>
                    <ul style={{
                      margin: 0, paddingLeft: 20,
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: 13, lineHeight: 1.8
                    }}>
                      {problem.constraints.split('\\n').filter(c => c.trim() !== '').map((constraint, i) => {
                        const cleanConstraint = constraint.trim().replace(/^- /, '');
                        return (
                          <li key={i} style={{ marginBottom: 6 }}>
                            <code style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              padding: '2px 6px', borderRadius: 4,
                              fontFamily: "'JetBrains Mono', monospace",
                              color: 'rgba(255, 255, 255, 0.85)'
                            }}>{cleanConstraint}</code>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* ── Test Cases ── */}
            {activeSubTab === 'testcases' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{
                  fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
                }}>Example Test Cases</div>
                {(problem.examples || []).map((ex, i) => (
                  <div key={i} style={{
                    padding: 14, borderRadius: 10,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.2s ease',
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    }}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      marginBottom: 10,
                    }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <CheckCircle2 size={13} color="rgba(74,222,128,0.5)" />
                        Test Case {i + 1}
                      </span>
                    </div>
                    <div style={{
                      padding: '8px 10px', borderRadius: 8,
                      background: 'rgba(0,0,0,0.2)',
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                      marginBottom: 6,
                    }}>
                      <div style={{ marginBottom: 4 }}>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>INPUT</span>
                      </div>
                      <div style={{ color: '#e2e8f0' }}>{ex.input}</div>
                    </div>
                    <div style={{
                      padding: '8px 10px', borderRadius: 8,
                      background: 'rgba(0,0,0,0.2)',
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                    }}>
                      <div style={{ marginBottom: 4 }}>
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>EXPECTED OUTPUT</span>
                      </div>
                      <div style={{ color: '#4ade80' }}>{ex.output}</div>
                    </div>
                  </div>
                ))}
                {(!problem.examples || problem.examples.length === 0) && (
                  <div style={{
                    textAlign: 'center', padding: '40px 20px',
                    color: 'rgba(255,255,255,0.3)',
                  }}>
                    <AlertCircle size={28} style={{ marginBottom: 10, opacity: 0.3 }} />
                    <p style={{ fontSize: 12, fontWeight: 600 }}>No test cases available</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Hints ── */}
            {activeSubTab === 'hints' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{
                  fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
                }}>Progressive Hints</div>
                {hints.length > 0 ? (
                  <>
                    {hints.map((hint, i) => {
                      const isRevealed = i < revealedHints;
                      return (
                        <div key={i} style={{
                          borderRadius: 10,
                          background: isRevealed
                            ? 'rgba(250,204,21,0.04)'
                            : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${isRevealed ? 'rgba(250,204,21,0.12)' : 'rgba(255,255,255,0.05)'}`,
                          overflow: 'hidden',
                          transition: 'all 0.3s ease',
                        }}>
                          <div style={{
                            padding: '10px 14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          }}>
                            <span style={{
                              fontSize: 12, fontWeight: 700,
                              color: isRevealed ? '#fbbf24' : 'rgba(255,255,255,0.5)',
                              display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                              <Lightbulb size={13} />
                              Hint {i + 1}
                            </span>
                            {!isRevealed && i === revealedHints && (
                              <button
                                onClick={() => setRevealedHints(r => r + 1)}
                                style={{
                                  padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                                  background: 'rgba(250,204,21,0.08)',
                                  border: '1px solid rgba(250,204,21,0.15)',
                                  color: '#fbbf24', fontSize: 10, fontWeight: 700,
                                  display: 'flex', alignItems: 'center', gap: 4,
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                <Eye size={11} /> Reveal
                              </button>
                            )}
                            {!isRevealed && i !== revealedHints && (
                              <span style={{
                                fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 600,
                              }}>🔒 Locked</span>
                            )}
                          </div>
                          {isRevealed && (
                            <div style={{
                              padding: '0 14px 12px',
                              fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7,
                            }}>
                              {hint}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {revealedHints > 0 && (
                      <button
                        onClick={() => setRevealedHints(0)}
                        style={{
                          padding: '8px 0', borderRadius: 8, cursor: 'pointer',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        }}
                      >
                        <EyeOff size={12} /> Reset Hints
                      </button>
                    )}
                  </>
                ) : (
                  <div style={{
                    textAlign: 'center', padding: '40px 20px',
                    color: 'rgba(255,255,255,0.3)',
                  }}>
                    <Lightbulb size={28} style={{ marginBottom: 10, opacity: 0.3 }} />
                    <p style={{ fontSize: 12, fontWeight: 600 }}>No hints available for this problem</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom: AI Hints toggle */}
          <div style={{
            padding: '10px 16px', flexShrink: 0,
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <button onClick={onShowHints} style={{
              width: '100%', padding: '10px 0', borderRadius: 10, cursor: 'pointer',
              background: showHints
                ? 'linear-gradient(135deg, rgba(250,204,21,0.1), rgba(139,92,246,0.1))'
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${showHints ? 'rgba(250,204,21,0.2)' : 'rgba(255,255,255,0.06)'}`,
              color: showHints ? '#fbbf24' : 'rgba(255,255,255,0.5)',
              fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.2s ease',
            }}>
              <Lightbulb size={14} />
              {showHints ? 'Hide AI Assistant' : '💡 AI Assistant — Get Hints & Analysis'}
            </button>
          </div>
        </>
      )}

      {/* ═══ SOLUTION TAB ═══ */}
      {activeTopTab === 'solution' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {loadingSolution ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)' }}>
              <div style={{
                width: 32, height: 32, border: '3px solid rgba(139,92,246,0.2)',
                borderTopColor: '#8b5cf6', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
              }} />
              <p style={{ fontSize: 12, fontWeight: 600 }}>Loading solution...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : solutionError ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)' }}>
              <AlertCircle size={28} style={{ marginBottom: 10, opacity: 0.4 }} />
              <p style={{ fontSize: 12, fontWeight: 600 }}>{solutionError}</p>
            </div>
          ) : solutionCode ? (
            <>
              <div style={{
                fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
              }}>Editorial Solution</div>
              <div style={{
                padding: 16, borderRadius: 10,
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(139,92,246,0.12)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12, lineHeight: 1.7,
                color: '#e2e8f0', overflowX: 'auto',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {solutionCode}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)' }}>
              <Code2 size={28} style={{ marginBottom: 10, opacity: 0.3 }} />
              <p style={{ fontSize: 12, fontWeight: 600 }}>No solution available yet</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ HISTORY TAB ═══ */}
      {activeTopTab === 'history' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <div style={{
            fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
          }}>Submission History</div>
          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)' }}>
              <div style={{
                width: 28, height: 28, border: '3px solid rgba(139,92,246,0.2)',
                borderTopColor: '#8b5cf6', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 10px',
              }} />
              <p style={{ fontSize: 12, fontWeight: 600 }}>Loading submissions...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)' }}>
              <History size={28} style={{ marginBottom: 10, opacity: 0.3 }} />
              <p style={{ fontSize: 12, fontWeight: 600 }}>No submissions yet</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
                Submit a solution to see your history here
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {submissions.map((sub) => {
                const isAccepted = sub.status === 'accepted';
                const statusLabel = sub.status === 'accepted' ? 'Accepted' : sub.status === 'wrong_answer' ? 'Wrong Answer' : sub.status;
                const statusColor = isAccepted
                  ? '#4ade80'
                  : sub.status === 'wrong_answer' ? '#f87171' : '#fbbf24';

                const timeAgo = sub.submitted_at ? (() => {
                  const diff = Date.now() - new Date(sub.submitted_at).getTime();
                  const mins = Math.floor(diff / 60000);
                  if (mins < 1) return 'Just now';
                  if (mins < 60) return `${mins}m ago`;
                  const hrs = Math.floor(mins / 60);
                  if (hrs < 24) return `${hrs}h ago`;
                  const days = Math.floor(hrs / 24);
                  return `${days}d ago`;
                })() : '';

                return (
                  <div key={sub.id} style={{
                    padding: '12px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.2s ease',
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    }}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      marginBottom: 6,
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>
                        {statusLabel}
                      </span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                        {timeAgo}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex', gap: 12, fontSize: 10, color: 'rgba(255,255,255,0.4)',
                    }}>
                      <span style={{ textTransform: 'capitalize' }}>{sub.language}</span>
                      {sub.test_cases_passed != null && sub.total_test_cases != null && (
                        <span>✅ {sub.test_cases_passed}/{sub.total_test_cases} passed</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
