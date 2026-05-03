import React, { useState, useEffect } from 'react';
import { Lightbulb, Send, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../utils/apiFetch';

const LEVELS = [
  { id: 'eli5', label: 'ELI5', desc: 'Simple analogies, no jargon', color: '#22c55e' },
  { id: 'intermediate', label: 'Intermediate', desc: 'CS student level', color: '#6366f1' },
  { id: 'senior', label: 'Senior', desc: 'Trade-offs & edge cases', color: '#f59e0b' },
];

export default function ConceptExplainer() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [topics, setTopics] = useState([]);
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('intermediate');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const bg = isLight ? '#f8fafc' : '#0f0f1a';
  const card = isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.04)';
  const border = isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)';
  const text = isLight ? '#0f172a' : '#f8fafc';
  const muted = isLight ? '#64748b' : '#94a3b8';

  useEffect(() => {
    apiFetch.get('/api/concept-explainer/topics').then(d => setTopics(d.topics)).catch(() => {});
  }, []);

  const explain = async () => {
    if (!topic.trim()) { setError('Enter a topic.'); return; }
    setError(''); setLoading(true); setResult(null);
    try {
      const data = await apiFetch.post('/api/concept-explainer/explain', { topic, level });
      setResult(data);
    } catch { setError('Explanation failed. Try again.'); }
    finally { setLoading(false); }
  };

  const activeLevel = LEVELS.find(l => l.id === level);

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '32px 24px', color: text }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#f59e0b,#6366f1)', display: 'grid', placeItems: 'center' }}>
            <Lightbulb size={22} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Concept Explainer</h1>
            <p style={{ margin: 0, fontSize: 13, color: muted }}>Any CS topic explained at your level — ELI5 to Senior</p>
          </div>
        </div>

        <div style={{ background: card, border, borderRadius: 20, padding: 24, marginBottom: 16 }}>
          {/* Level selector */}
          <p style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 10 }}>EXPLANATION LEVEL</p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {LEVELS.map(l => (
              <button key={l.id} onClick={() => setLevel(l.id)} style={{ flex: 1, padding: '12px 8px', borderRadius: 12, border: level === l.id ? `2px solid ${l.color}` : border, background: level === l.id ? `${l.color}18` : card, color: level === l.id ? l.color : muted, fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'center' }}>
                <div>{l.label}</div>
                <div style={{ fontSize: 10, fontWeight: 500, marginTop: 2 }}>{l.desc}</div>
              </button>
            ))}
          </div>

          {/* Topic input */}
          <p style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 8 }}>TOPIC</p>
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && explain()}
            placeholder="e.g. Binary Search, CAP Theorem, React useEffect..."
            style={{ width: '100%', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)', border, borderRadius: 12, padding: '12px 16px', color: text, fontSize: 14, boxSizing: 'border-box', marginBottom: 12 }}
          />

          {/* Popular topics */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {topics.slice(0, 8).map(t => (
              <button key={t} onClick={() => setTopic(t)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border, background: card, color: muted, cursor: 'pointer', fontWeight: 600 }}>{t}</button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {error && <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>}
            <button onClick={explain} disabled={loading} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: `linear-gradient(135deg,#f59e0b,${activeLevel?.color || '#6366f1'})`, color: 'white', border: 'none', borderRadius: 12, padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              <Send size={15} /> {loading ? 'Explaining...' : 'Explain'}
            </button>
          </div>
        </div>

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Summary */}
            <div style={{ background: `${activeLevel?.color || '#6366f1'}12`, border: `1px solid ${activeLevel?.color || '#6366f1'}30`, borderRadius: 16, padding: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: activeLevel?.color, marginBottom: 6 }}>TL;DR</p>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, lineHeight: 1.6 }}>{result.summary}</p>
            </div>

            {/* Explanation */}
            <div style={{ background: card, border, borderRadius: 16, padding: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 10 }}>EXPLANATION</p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{result.explanation}</p>
            </div>

            {/* Analogy */}
            {result.analogy && (
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, padding: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', marginBottom: 6 }}>🎯 REAL-WORLD ANALOGY</p>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, fontStyle: 'italic' }}>{result.analogy}</p>
              </div>
            )}

            {/* Key points + mistakes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {result.keyPoints?.length > 0 && (
                <div style={{ background: card, border, borderRadius: 16, padding: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', marginBottom: 10 }}>KEY POINTS</p>
                  {result.keyPoints.map((p, i) => <p key={i} style={{ margin: '0 0 6px', fontSize: 13, color: muted }}>• {p}</p>)}
                </div>
              )}
              {result.commonMistakes?.length > 0 && (
                <div style={{ background: card, border, borderRadius: 16, padding: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', marginBottom: 10 }}>COMMON MISTAKES</p>
                  {result.commonMistakes.map((m, i) => <p key={i} style={{ margin: '0 0 6px', fontSize: 13, color: muted }}>⚠️ {m}</p>)}
                </div>
              )}
            </div>

            {/* Interview tip */}
            {result.interviewTip && (
              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16, padding: 16 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#818cf8' }}>💼 <strong>Interview tip:</strong> {result.interviewTip}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
