import React, { useState } from 'react';
import { AlertTriangle, Send, Shield, TrendingUp, CheckCircle, Lightbulb, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../utils/apiFetch';

const SEVERITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#06b6d4' };

export default function RejectionAnalyzer() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [experience, setExperience] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [stage, setStage] = useState('');
  const [outcome, setOutcome] = useState('Rejected');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedReason, setExpandedReason] = useState(null);

  const bg = isLight ? '#f8fafc' : '#0f0f1a';
  const card = isLight ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.04)';
  const border = isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)';
  const text = isLight ? '#0f172a' : '#f8fafc';
  const muted = isLight ? '#64748b' : '#94a3b8';
  const accent = '#6366f1';

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (experience.trim().length < 20) { setError('Please describe your experience in more detail.'); return; }
    setLoading(true); setError(''); setAnalysis(null);
    try {
      const data = await apiFetch.post('/api/rejection-analyzer/analyze', { experience, company, role, stage, outcome });
      setAnalysis(data.analysis);
    } catch (err) { setError(err.response?.data?.error || 'Analysis failed. Please try again.'); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '32px 24px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Shield size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: text, margin: '0 0 6px' }}>Mock Rejection Analyzer</h1>
          <p style={{ color: muted, fontSize: 14, margin: 0 }}>Understand what went wrong and build a plan to come back stronger</p>
        </div>

        {/* Input Form */}
        {!analysis && (
          <form onSubmit={handleAnalyze} style={{ background: card, border, borderRadius: 20, padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Company</label>
                <input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Google" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border, background: bg, color: text, fontSize: 14, boxSizing: 'border-box' }}/>
              </div>
              <div>
                <label style={{ fontSize: 12, color: muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Role</label>
                <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. SDE" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border, background: bg, color: text, fontSize: 14, boxSizing: 'border-box' }}/>
              </div>
              <div>
                <label style={{ fontSize: 12, color: muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Stage</label>
                <select value={stage} onChange={e => setStage(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border, background: bg, color: text, fontSize: 14 }}>
                  <option value="">Select stage</option>
                  <option>HR</option><option>Technical</option><option>DSA / Coding</option>
                  <option>System Design</option><option>Behavioral</option><option>Managerial</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Outcome</label>
                <select value={outcome} onChange={e => setOutcome(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border, background: bg, color: text, fontSize: 14 }}>
                  <option>Rejected</option><option>Ghosted</option><option>Waitlisted</option><option>Unsure</option>
                </select>
              </div>
            </div>

            <label style={{ fontSize: 12, color: muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>What happened? Describe your experience</label>
            <textarea value={experience} onChange={e => setExperience(e.target.value)} placeholder="Describe your interview experience in detail... What questions were asked? How did you answer? What felt off? Include as much detail as possible for better analysis."
              style={{ width: '100%', minHeight: 160, padding: 14, borderRadius: 12, border, background: bg, color: text, fontSize: 14, lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}/>

            {error && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{error}</div>}

            <button type="submit" disabled={loading} style={{ marginTop: 16, width: '100%', padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff', border: 'none', fontWeight: 600, fontSize: 15, cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}>
              {loading ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/> Analyzing...</> : <><Send size={16}/> Analyze My Interview</>}
            </button>
          </form>
        )}

        {/* Results */}
        {analysis && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Overall */}
            {analysis.overall_assessment && (
              <div style={{ background: card, border, borderRadius: 16, padding: 20 }}>
                <h3 style={{ color: text, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>📋 Overall Assessment</h3>
                <p style={{ color: text, fontSize: 14, lineHeight: 1.6, margin: 0, opacity: 0.9 }}>{analysis.overall_assessment}</p>
              </div>
            )}

            {/* Likely Reasons */}
            {analysis.likely_reasons?.length > 0 && (
              <div style={{ background: card, border, borderRadius: 16, padding: 20 }}>
                <h3 style={{ color: text, fontSize: 16, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={18} color="#ef4444" /> Likely Rejection Reasons
                </h3>
                {analysis.likely_reasons.map((r, i) => (
                  <div key={i} style={{ marginBottom: i < analysis.likely_reasons.length - 1 ? 10 : 0, padding: '12px 14px', borderRadius: 12, background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', border: `1px solid ${SEVERITY_COLORS[r.severity] || muted}25`, cursor: 'pointer' }}
                    onClick={() => setExpandedReason(expandedReason === i ? null : i)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: SEVERITY_COLORS[r.severity] || muted, flexShrink: 0 }}/>
                        <span style={{ fontWeight: 600, color: text, fontSize: 14 }}>{r.reason}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: `${SEVERITY_COLORS[r.severity]}15`, color: SEVERITY_COLORS[r.severity], fontWeight: 600, textTransform: 'uppercase' }}>{r.severity}</span>
                      </div>
                      {expandedReason === i ? <ChevronUp size={16} color={muted}/> : <ChevronDown size={16} color={muted}/>}
                    </div>
                    {expandedReason === i && <p style={{ color: muted, fontSize: 13, lineHeight: 1.6, margin: '8px 0 0 16px' }}>{r.explanation}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Strengths */}
            {analysis.strengths?.length > 0 && (
              <div style={{ background: card, border, borderRadius: 16, padding: 20 }}>
                <h3 style={{ color: text, fontSize: 16, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={18} color="#22c55e" /> What You Did Well
                </h3>
                {analysis.strengths.map((s, i) => (
                  <div key={i} style={{ padding: '8px 12px', marginBottom: 6, borderRadius: 10, background: 'rgba(34,197,94,0.06)', borderLeft: '3px solid #22c55e', color: text, fontSize: 14 }}>{s}</div>
                ))}
              </div>
            )}

            {/* Fix Plan */}
            {analysis.fix_plan?.length > 0 && (
              <div style={{ background: card, border, borderRadius: 16, padding: 20 }}>
                <h3 style={{ color: text, fontSize: 16, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={18} color={accent} /> Your Fix Plan
                </h3>
                {analysis.fix_plan.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < analysis.fix_plan.length - 1 ? border : 'none' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${PRIORITY_COLORS[f.priority]}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: 13, color: PRIORITY_COLORS[f.priority] }}>{i + 1}</div>
                    <div>
                      <div style={{ fontWeight: 500, color: text, fontSize: 14 }}>{f.action}</div>
                      <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>⏱ {f.timeframe} · {f.priority} priority</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Encouragement */}
            {analysis.encouragement && (
              <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(168,85,247,0.06))', border: `1px solid ${accent}20`, borderRadius: 16, padding: 20, textAlign: 'center' }}>
                <Heart size={24} color="#a855f7" style={{ marginBottom: 8 }} />
                <p style={{ color: text, fontSize: 15, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{analysis.encouragement}</p>
              </div>
            )}

            {/* Try again */}
            <button onClick={() => { setAnalysis(null); setExperience(''); setError(''); }}
              style={{ padding: '12px 24px', borderRadius: 12, border, background: card, color: text, cursor: 'pointer', fontWeight: 500, fontSize: 14, alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lightbulb size={15} /> Analyze Another Interview
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
