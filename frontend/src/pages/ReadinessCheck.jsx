import React, { useState, useEffect } from 'react';
import { Target, ChevronRight, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../utils/apiFetch';

const ROLES = [
  { id: 'sde', label: 'SDE / Full Stack' },
  { id: 'frontend', label: 'Frontend Engineer' },
  { id: 'backend', label: 'Backend Engineer' },
  { id: 'default', label: 'Other Tech Role' },
];

function RadialScore({ score }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? '#22c55e' : score >= 45 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={140} height={140}>
      <circle cx={70} cy={70} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} />
      <circle cx={70} cy={70} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 70 70)" style={{ transition: 'stroke-dasharray 1.2s ease' }} />
      <text x={70} y={65} textAnchor="middle" fill={color} fontSize={28} fontWeight={800}>{score}</text>
      <text x={70} y={85} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={11} fontWeight={600}>/ 100</text>
    </svg>
  );
}

export default function ReadinessCheck() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [step, setStep] = useState('setup'); // setup | questions | result
  const [role, setRole] = useState('sde');
  const [company, setCompany] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);

  const bg = isLight ? '#f8fafc' : '#0f0f1a';
  const card = isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.04)';
  const border = isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)';
  const text = isLight ? '#0f172a' : '#f8fafc';
  const muted = isLight ? '#64748b' : '#94a3b8';

  const startCheck = async () => {
    setLoading(true);
    try {
      const data = await apiFetch.get(`/api/readiness/questions?role=${role}`);
      setQuestions(data.questions);
      setAnswers({});
      setCurrent(0);
      setStep('questions');
    } catch { /* use empty */ }
    setLoading(false);
  };

  const setAnswer = (id, field, value) => {
    setAnswers(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const submitAll = async () => {
    setLoading(true);
    const payload = questions.map(q => ({
      id: q.id,
      text: q.text,
      selfRating: answers[q.id]?.rating || 3,
      answer: answers[q.id]?.text || '',
    }));
    try {
      const data = await apiFetch.post('/api/readiness/evaluate', { role, targetCompany: company, answers: payload });
      setResult(data);
      setStep('result');
    } catch {
      setStep('result');
      setResult({ readinessScore: 50, verdict: 'Almost Ready', gaps: ['Could not connect to AI. Try again.'], strengths: [], weekPlan: [] });
    }
    setLoading(false);
  };

  const verdictColor = v => ({ Ready: '#22c55e', 'Almost Ready': '#f59e0b', 'Needs Work': '#ef4444' }[v] || '#6366f1');

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '32px 24px', color: text }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#22c55e,#06b6d4)', display: 'grid', placeItems: 'center' }}>
            <Target size={22} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Am I Ready?</h1>
            <p style={{ margin: 0, fontSize: 13, color: muted }}>5-question diagnostic → readiness score + gap plan</p>
          </div>
        </div>

        {/* Setup */}
        {step === 'setup' && (
          <div style={{ background: card, border, borderRadius: 20, padding: 32 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: muted, marginBottom: 12 }}>SELECT ROLE</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {ROLES.map(r => (
                <button key={r.id} onClick={() => setRole(r.id)}
                  style={{ padding: '14px 16px', borderRadius: 14, border: role === r.id ? '2px solid #22c55e' : border, background: role === r.id ? 'rgba(34,197,94,0.1)' : card, color: role === r.id ? '#22c55e' : text, fontWeight: 700, fontSize: 14, cursor: 'pointer', textAlign: 'left' }}>
                  {r.label}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: muted, marginBottom: 8 }}>TARGET COMPANY (optional)</p>
            <input
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="e.g. Google, Amazon, Startup..."
              style={{ width: '100%', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)', border, borderRadius: 12, padding: '12px 16px', color: text, fontSize: 14, boxSizing: 'border-box', marginBottom: 24 }}
            />
            <button onClick={startCheck} disabled={loading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#22c55e,#06b6d4)', color: 'white', border: 'none', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Loading...' : <><ChevronRight size={18} /> Start Readiness Check</>}
            </button>
          </div>
        )}

        {/* Questions */}
        {step === 'questions' && questions.length > 0 && (
          <div style={{ background: card, border, borderRadius: 20, padding: 32 }}>
            {/* Progress */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
              {questions.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= current ? '#22c55e' : (isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)'), transition: 'background 0.3s' }} />
              ))}
            </div>

            <p style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 8 }}>QUESTION {current + 1} OF {questions.length}</p>
            <p style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.5, marginBottom: 24 }}>{questions[current]?.text}</p>

            {/* Self rating */}
            <p style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 10 }}>HOW CONFIDENT ARE YOU?</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[1, 2, 3, 4, 5].map(r => (
                <button key={r} onClick={() => setAnswer(questions[current].id, 'rating', r)}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: answers[questions[current].id]?.rating === r ? '2px solid #22c55e' : border, background: answers[questions[current].id]?.rating === r ? 'rgba(34,197,94,0.15)' : card, color: answers[questions[current].id]?.rating === r ? '#22c55e' : muted, fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
                  {r}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: muted, marginBottom: 20 }}>
              <span>Not at all</span><span>Perfectly</span>
            </div>

            {/* Optional text */}
            <textarea
              value={answers[questions[current]?.id]?.text || ''}
              onChange={e => setAnswer(questions[current].id, 'text', e.target.value)}
              placeholder="Optional: briefly describe your experience (helps AI give better feedback)..."
              rows={3}
              style={{ width: '100%', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)', border, borderRadius: 12, padding: '12px 16px', color: text, fontSize: 13, resize: 'none', boxSizing: 'border-box', marginBottom: 20 }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              {current > 0 && (
                <button onClick={() => setCurrent(c => c - 1)}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border, background: card, color: text, fontWeight: 700, cursor: 'pointer' }}>
                  Back
                </button>
              )}
              {current < questions.length - 1 ? (
                <button onClick={() => setCurrent(c => c + 1)}
                  style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#22c55e,#06b6d4)', color: 'white', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button onClick={submitAll} disabled={loading}
                  style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#22c55e,#06b6d4)', color: 'white', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Evaluating...' : 'Get My Score'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Result */}
        {step === 'result' && result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Score card */}
            <div style={{ background: card, border, borderRadius: 20, padding: 32, textAlign: 'center' }}>
              <RadialScore score={result.readinessScore} />
              <h2 style={{ margin: '16px 0 4px', fontSize: 26, fontWeight: 800, color: verdictColor(result.verdict) }}>{result.verdict}</h2>
              {result.estimatedWeeksToReady > 0 && (
                <p style={{ margin: 0, fontSize: 13, color: muted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Clock size={14} /> ~{result.estimatedWeeksToReady} week{result.estimatedWeeksToReady > 1 ? 's' : ''} to be fully ready
                </p>
              )}
            </div>

            {/* Strengths & Gaps */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {result.strengths?.length > 0 && (
                <div style={{ background: card, border, borderRadius: 16, padding: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', marginBottom: 12 }}>✓ STRENGTHS</p>
                  {result.strengths.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                      <CheckCircle size={14} color="#22c55e" style={{ marginTop: 2, flexShrink: 0 }} />
                      <p style={{ margin: 0, fontSize: 13, color: muted }}>{s}</p>
                    </div>
                  ))}
                </div>
              )}
              {result.gaps?.length > 0 && (
                <div style={{ background: card, border, borderRadius: 16, padding: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', marginBottom: 12 }}>↑ GAPS TO CLOSE</p>
                  {result.gaps.map((g, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                      <AlertCircle size={14} color="#ef4444" style={{ marginTop: 2, flexShrink: 0 }} />
                      <p style={{ margin: 0, fontSize: 13, color: muted }}>{g}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Week plan */}
            {result.weekPlan?.length > 0 && (
              <div style={{ background: card, border, borderRadius: 16, padding: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', marginBottom: 12 }}>📅 YOUR PREP PLAN</p>
                {result.weekPlan.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#818cf8', minWidth: 20 }}>{i + 1}</span>
                    <p style={{ margin: 0, fontSize: 13, color: muted }}>{p}</p>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => { setStep('setup'); setResult(null); }}
              style={{ padding: '12px', borderRadius: 14, border, background: card, color: text, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Retake Check
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
