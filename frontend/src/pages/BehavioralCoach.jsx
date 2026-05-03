import React, { useState, useEffect } from 'react';
import { Mic, Send, TrendingUp, AlertCircle, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../utils/apiFetch';

const SAMPLE_QUESTIONS = [
  'Tell me about a time you had to meet a tight deadline.',
  'Describe a situation where you disagreed with your manager.',
  'Tell me about a project you are most proud of.',
  'Describe a time you failed and what you learned.',
  'Tell me about a time you had to learn something new quickly.',
];

function ScoreRing({ value, label, color }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={72} height={72}>
        <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
        <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 36 36)" style={{ transition: 'stroke-dasharray 1s ease' }} />
        <text x={36} y={40} textAnchor="middle" fill="white" fontSize={14} fontWeight={800}>{value}</text>
      </svg>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function StarBadge({ label, met }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
      borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: met ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)',
      border: `1px solid ${met ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.2)'}`,
      color: met ? '#4ade80' : '#f87171',
    }}>
      {met ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
      {label}
    </div>
  );
}

export default function BehavioralCoach() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [question, setQuestion] = useState(SAMPLE_QUESTIONS[0]);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState('');

  const bg = isLight ? '#f8fafc' : '#0f0f1a';
  const card = isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.04)';
  const border = isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)';
  const text = isLight ? '#0f172a' : '#f8fafc';
  const muted = isLight ? '#64748b' : '#94a3b8';

  useEffect(() => {
    apiFetch.get('/api/behavioral-coach/history').then(setHistory).catch(() => {});
  }, []);

  const analyze = async () => {
    if (!answer.trim() || answer.trim().length < 20) {
      setError('Please write at least 20 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch.post('/api/behavioral-coach/analyze', { answer, question });
      setResult(data);
      apiFetch.get('/api/behavioral-coach/history').then(setHistory).catch(() => {});
    } catch {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = v => v >= 70 ? '#4ade80' : v >= 45 ? '#fbbf24' : '#f87171';

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '32px 24px', color: text }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#a855f7)', display: 'grid', placeItems: 'center' }}>
              <Mic size={22} color="white" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Behavioral Answer Coach</h1>
              <p style={{ margin: 0, fontSize: 13, color: muted }}>STAR method scoring · Filler word detection · AI feedback</p>
            </div>
          </div>
        </div>

        {/* Question selector */}
        <div style={{ background: card, border, borderRadius: 20, padding: 24, marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: muted, display: 'block', marginBottom: 10 }}>QUESTION</label>
          <select
            value={question}
            onChange={e => setQuestion(e.target.value)}
            style={{ width: '100%', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)', border, borderRadius: 12, padding: '12px 16px', color: text, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 12 }}
          >
            {SAMPLE_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
          <input
            placeholder="Or type your own question..."
            value={SAMPLE_QUESTIONS.includes(question) ? '' : question}
            onChange={e => setQuestion(e.target.value)}
            style={{ width: '100%', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)', border, borderRadius: 12, padding: '12px 16px', color: text, fontSize: 14, boxSizing: 'border-box' }}
          />
        </div>

        {/* Answer input */}
        <div style={{ background: card, border, borderRadius: 20, padding: 24, marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: muted, display: 'block', marginBottom: 10 }}>YOUR ANSWER</label>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Type or paste your answer here. Use the STAR method: Situation → Task → Action → Result..."
            rows={7}
            style={{ width: '100%', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)', border, borderRadius: 12, padding: '14px 16px', color: text, fontSize: 14, resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <span style={{ fontSize: 12, color: muted }}>{answer.split(/\s+/).filter(Boolean).length} words</span>
            {error && <span style={{ fontSize: 12, color: '#f87171' }}>{error}</span>}
            <button
              onClick={analyze}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              <Send size={15} /> {loading ? 'Analyzing...' : 'Analyze Answer'}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div style={{ background: card, border, borderRadius: 20, padding: 24, marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 800 }}>Analysis Results</h3>

            {/* Score rings */}
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
              <ScoreRing value={result.overallScore} label="Overall" color={getScoreColor(result.overallScore)} />
              <ScoreRing value={result.starScore} label="STAR Score" color={getScoreColor(result.starScore)} />
              <ScoreRing value={result.confidenceScore} label="Confidence" color={getScoreColor(result.confidenceScore)} />
              <ScoreRing value={result.clarityScore} label="Clarity" color={getScoreColor(result.clarityScore)} />
            </div>

            {/* STAR breakdown */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: muted, marginBottom: 10 }}>STAR COMPONENTS</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <StarBadge label="Situation" met={result.starBreakdown?.situation ?? result.starBreakdown?.hasSituation} />
                <StarBadge label="Task" met={result.starBreakdown?.task ?? result.starBreakdown?.hasTask} />
                <StarBadge label="Action" met={result.starBreakdown?.action ?? result.starBreakdown?.hasAction} />
                <StarBadge label="Result" met={result.starBreakdown?.result ?? result.starBreakdown?.hasResult} />
                <StarBadge label="Metrics" met={result.starBreakdown?.hasMetrics} />
              </div>
            </div>

            {/* Filler words */}
            {result.fillerCount > 0 && (
              <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#fbbf24', fontWeight: 700 }}>
                  ⚠️ {result.fillerCount} filler word{result.fillerCount > 1 ? 's' : ''} detected
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: muted }}>
                  Found: {result.fillerWords?.join(', ') || 'um, uh, like, basically'}
                </p>
              </div>
            )}

            {/* Strengths & improvements */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              {result.strengths?.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>✓ STRENGTHS</p>
                  {result.strengths.map((s, i) => <p key={i} style={{ fontSize: 13, color: muted, margin: '0 0 4px' }}>• {s}</p>)}
                </div>
              )}
              {result.improvements?.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#f87171', marginBottom: 8 }}>↑ IMPROVE</p>
                  {result.improvements.map((s, i) => <p key={i} style={{ fontSize: 13, color: muted, margin: '0 0 4px' }}>• {s}</p>)}
                </div>
              )}
            </div>

            {/* Rewritten opening */}
            {result.rewrittenOpening && (
              <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '12px 16px' }}>
                <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#818cf8' }}>💡 STRONGER OPENING</p>
                <p style={{ margin: 0, fontSize: 13, color: text, fontStyle: 'italic' }}>"{result.rewrittenOpening}"</p>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div style={{ background: card, border, borderRadius: 20, padding: 24 }}>
            <button
              onClick={() => setShowHistory(h => !h)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: text, fontSize: 15, fontWeight: 800, cursor: 'pointer', padding: 0 }}
            >
              <TrendingUp size={18} /> Past Sessions ({history.length})
              {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showHistory && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map(h => (
                  <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.04)', borderRadius: 12 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: text }}>{h.question?.slice(0, 60) || 'Behavioral question'}...</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} /> {new Date(h.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: getScoreColor(h.overall_score) }}>{h.overall_score}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
