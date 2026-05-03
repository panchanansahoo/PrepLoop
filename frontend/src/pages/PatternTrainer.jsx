import React, { useState, useEffect } from 'react';
import { Target, RefreshCw, CheckCircle, XCircle, BarChart2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../utils/apiFetch';

export default function PatternTrainer() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [problem, setProblem] = useState(null);
  const [patterns, setPatterns] = useState([]);
  const [selected, setSelected] = useState('');
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('practice');

  const bg = isLight ? '#f8fafc' : '#0f0f1a';
  const card = isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.04)';
  const border = isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)';
  const text = isLight ? '#0f172a' : '#f8fafc';
  const muted = isLight ? '#64748b' : '#94a3b8';

  const loadProblem = async () => {
    setResult(null); setSelected(''); setLoading(true);
    try {
      const data = await apiFetch.get('/api/pattern-trainer/problem');
      setProblem(data);
      setPatterns(data.patterns || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const loadStats = async () => {
    try { const data = await apiFetch.get('/api/pattern-trainer/stats'); setStats(data); } catch { /* ignore */ }
  };

  useEffect(() => { loadProblem(); loadStats(); }, []);

  const submit = async () => {
    if (!selected || !problem) return;
    setLoading(true);
    try {
      const data = await apiFetch.post('/api/pattern-trainer/submit', { problemId: problem.id, guessedPattern: selected });
      setResult(data);
      loadStats();
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '32px 24px', color: text }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#a855f7,#6366f1)', display: 'grid', placeItems: 'center' }}>
              <Target size={22} color="white" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Pattern Trainer</h1>
              <p style={{ margin: 0, fontSize: 13, color: muted }}>Read the problem → identify the DSA pattern</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['practice', 'stats'].map(t => (
              <button key={t} onClick={() => { setTab(t); if (t === 'stats') loadStats(); }} style={{ padding: '8px 16px', borderRadius: 10, border, background: tab === t ? 'linear-gradient(135deg,#a855f7,#6366f1)' : card, color: tab === t ? 'white' : text, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {t === 'practice' ? 'Practice' : 'Stats'}
              </button>
            ))}
          </div>
        </div>

        {tab === 'stats' && stats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {[
                { label: 'Total Attempts', value: stats.total, color: '#6366f1' },
                { label: 'Correct', value: stats.correct, color: '#22c55e' },
                { label: 'Accuracy', value: `${stats.accuracy}%`, color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} style={{ background: card, border, borderRadius: 16, padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: muted, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {Object.keys(stats.byPattern || {}).length > 0 && (
              <div style={{ background: card, border, borderRadius: 16, padding: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 12 }}>BY PATTERN</p>
                {Object.entries(stats.byPattern).map(([pattern, s]) => (
                  <div key={pattern} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{pattern}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 100, height: 6, background: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${Math.round((s.correct / s.total) * 100)}%`, background: '#6366f1', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, color: muted, minWidth: 40 }}>{s.correct}/{s.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'practice' && (
          <>
            {problem && (
              <div style={{ background: card, border, borderRadius: 20, padding: 28, marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 12 }}>PROBLEM STATEMENT</p>
                <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.6, margin: '0 0 24px' }}>{problem.statement}</p>

                <p style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 12 }}>WHICH PATTERN APPLIES?</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 8 }}>
                  {patterns.map(p => {
                    const isSelected = selected === p;
                    const isCorrect = result && p === result.correctPattern;
                    const isWrong = result && isSelected && !result.isCorrect;
                    return (
                      <button key={p} onClick={() => !result && setSelected(p)}
                        style={{ padding: '10px 12px', borderRadius: 10, border: isCorrect ? '2px solid #22c55e' : isWrong ? '2px solid #ef4444' : isSelected ? '2px solid #6366f1' : border, background: isCorrect ? 'rgba(34,197,94,0.12)' : isWrong ? 'rgba(239,68,68,0.1)' : isSelected ? 'rgba(99,102,241,0.12)' : card, color: isCorrect ? '#22c55e' : isWrong ? '#ef4444' : isSelected ? '#818cf8' : text, fontWeight: 600, fontSize: 12, cursor: result ? 'default' : 'pointer', textAlign: 'left' }}>
                        {p}
                      </button>
                    );
                  })}
                </div>

                {!result && (
                  <button onClick={submit} disabled={!selected || loading} style={{ marginTop: 20, width: '100%', padding: '12px', borderRadius: 12, background: selected ? 'linear-gradient(135deg,#a855f7,#6366f1)' : (isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)'), color: selected ? 'white' : muted, border: 'none', fontWeight: 700, fontSize: 14, cursor: selected ? 'pointer' : 'not-allowed' }}>
                    {loading ? 'Checking...' : 'Submit Answer'}
                  </button>
                )}
              </div>
            )}

            {result && (
              <div style={{ background: card, border, borderRadius: 20, padding: 24, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  {result.isCorrect ? <CheckCircle size={24} color="#22c55e" /> : <XCircle size={24} color="#ef4444" />}
                  <span style={{ fontSize: 18, fontWeight: 800, color: result.isCorrect ? '#22c55e' : '#ef4444' }}>
                    {result.isCorrect ? 'Correct!' : `Not quite — it's ${result.correctPattern}`}
                  </span>
                </div>
                <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.7, color: muted }}>{result.explanation}</p>
                <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#818cf8' }}>💡 <strong>Hint:</strong> {result.hint}</p>
                </div>
                <button onClick={loadProblem} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#a855f7,#6366f1)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  <RefreshCw size={15} /> Next Problem
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
