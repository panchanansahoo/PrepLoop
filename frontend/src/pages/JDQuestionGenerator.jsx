import React, { useState } from 'react';
import { FileText, Send, Code, Users, Layout, MessageSquare } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../utils/apiFetch';

const TYPE_ICONS = { technical: <Code size={13} />, behavioral: <Users size={13} />, 'system-design': <Layout size={13} />, hr: <MessageSquare size={13} /> };
const TYPE_COLORS = { technical: '#6366f1', behavioral: '#22c55e', 'system-design': '#f59e0b', hr: '#a855f7' };
const DIFF_COLORS = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' };

const SAMPLE_JD = `We are looking for a Senior Frontend Engineer to join our team.

Requirements:
- 4+ years of experience with React and TypeScript
- Strong understanding of state management (Redux, Zustand)
- Experience with performance optimization and Core Web Vitals
- Familiarity with CI/CD pipelines and Docker
- Experience with REST APIs and GraphQL
- Strong communication skills and ability to work in an agile team`;

export default function JDQuestionGenerator() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [jd, setJd] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const bg = isLight ? '#f8fafc' : '#0f0f1a';
  const card = isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.04)';
  const border = isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)';
  const text = isLight ? '#0f172a' : '#f8fafc';
  const muted = isLight ? '#64748b' : '#94a3b8';

  const generate = async () => {
    if (!jd.trim() || jd.trim().length < 50) { setError('Please paste a job description (min 50 chars).'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch.post('/api/jd-questions/generate', { jobDescription: jd, count: 10 });
      setResult(data);
      setFilter('all');
    } catch {
      setError('Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = result?.questions?.filter(q => filter === 'all' || q.type === filter) || [];
  const types = result ? ['all', ...new Set(result.questions.map(q => q.type))] : [];

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '32px 24px', color: text }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#06b6d4,#6366f1)', display: 'grid', placeItems: 'center' }}>
            <FileText size={22} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>JD Question Generator</h1>
            <p style={{ margin: 0, fontSize: 13, color: muted }}>Paste a job description → get tailored interview questions</p>
          </div>
        </div>

        {/* JD Input */}
        <div style={{ background: card, border, borderRadius: 20, padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: muted }}>JOB DESCRIPTION</label>
            <button onClick={() => setJd(SAMPLE_JD)} style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Load Sample
            </button>
          </div>
          <textarea
            value={jd}
            onChange={e => setJd(e.target.value)}
            placeholder="Paste the full job description here..."
            rows={10}
            style={{ width: '100%', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)', border, borderRadius: 12, padding: '14px 16px', color: text, fontSize: 14, resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <span style={{ fontSize: 12, color: muted }}>{jd.length} chars</span>
            {error && <span style={{ fontSize: 12, color: '#ef4444' }}>{error}</span>}
            <button onClick={generate} disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#06b6d4,#6366f1)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              <Send size={15} /> {loading ? 'Generating...' : 'Generate Questions'}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <>
            {/* Role + Tech Stack */}
            <div style={{ background: card, border, borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 800 }}>🎯 {result.role}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.techStack?.map(t => (
                    <span key={t} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(99,102,241,0.12)', color: '#818cf8', fontWeight: 700 }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Type filter */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {types.map(t => (
                <button key={t} onClick={() => setFilter(t)}
                  style={{ padding: '6px 14px', borderRadius: 10, border, background: filter === t ? (TYPE_COLORS[t] || '#6366f1') : card, color: filter === t ? 'white' : text, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {TYPE_ICONS[t]} {t === 'all' ? `All (${result.questions.length})` : t}
                </button>
              ))}
            </div>

            {/* Questions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((q, i) => (
                <div key={i} style={{ background: card, border, borderRadius: 16, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, lineHeight: 1.5, flex: 1 }}>{q.question}</p>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${TYPE_COLORS[q.type] || '#6366f1'}18`, color: TYPE_COLORS[q.type] || '#6366f1', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {TYPE_ICONS[q.type]} {q.type}
                      </span>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${DIFF_COLORS[q.difficulty]}18`, color: DIFF_COLORS[q.difficulty], fontWeight: 700 }}>
                        {q.difficulty}
                      </span>
                    </div>
                  </div>
                  {q.whyAsked && (
                    <p style={{ margin: 0, fontSize: 12, color: muted, fontStyle: 'italic' }}>💡 {q.whyAsked}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
