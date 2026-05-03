import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Target, Clock, Flame, Brain, RefreshCw, Mail, MailCheck, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../utils/apiFetch';

export default function WeeklyReport() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  const bg = isLight ? '#f8fafc' : '#0f0f1a';
  const card = isLight ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.04)';
  const border = isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)';
  const text = isLight ? '#0f172a' : '#f8fafc';
  const muted = isLight ? '#64748b' : '#94a3b8';
  const accent = '#6366f1';

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch.get('/api/weekly-report/latest').catch(() => ({ report: null })),
      apiFetch.get('/api/weekly-report/subscription').catch(() => ({ subscribed: false })),
    ]).then(([r, s]) => {
      setReport(r.report);
      setSubscribed(s.subscribed);
    }).finally(() => setLoading(false));
  }, []);

  const generateReport = async () => {
    setGenerating(true);
    setError('');
    try {
      const data = await apiFetch.post('/api/weekly-report/generate');
      setReport(data.report);
    } catch (err) { setError('Failed to generate report. Try again.'); }
    setGenerating(false);
  };

  const toggleSubscription = async () => {
    try {
      const data = await apiFetch.post('/api/weekly-report/subscribe', { enabled: !subscribed });
      setSubscribed(data.subscribed);
    } catch { /* silent */ }
  };

  const StatCard = ({ icon: Icon, label, value, sub, color }) => (
    <div style={{ background: card, border, borderRadius: 16, padding: '20px', flex: '1 1 140px', minWidth: 140, borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={18} color={color} />
        <span style={{ fontSize: 12, color: muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: text }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '32px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${accent}, #a855f7)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart3 size={22} color="#fff" />
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: text, margin: 0 }}>Weekly Prep Report</h1>
            </div>
            <p style={{ color: muted, fontSize: 14, margin: 0 }}>Your personalized weekly interview prep summary</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={toggleSubscription} style={{ padding: '10px 18px', borderRadius: 12, border, background: subscribed ? `${accent}15` : card, color: subscribed ? accent : text, cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
              {subscribed ? <><MailCheck size={15}/> Subscribed</> : <><Mail size={15}/> Get Email Digest</>}
            </button>
            <button onClick={generateReport} disabled={generating} style={{ padding: '10px 20px', borderRadius: 12, background: `linear-gradient(135deg, ${accent}, #a855f7)`, color: '#fff', border: 'none', fontWeight: 600, cursor: generating ? 'wait' : 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, opacity: generating ? 0.7 : 1 }}>
              <RefreshCw size={15} style={{ animation: generating ? 'spin 1s linear infinite' : 'none' }}/> {generating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {error && <div style={{ padding: 14, borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', marginBottom: 20, fontSize: 14 }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: muted }}>
            <div style={{ width: 40, height: 40, border: '3px solid transparent', borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            Loading report...
          </div>
        ) : !report ? (
          <div style={{ textAlign: 'center', padding: 80, background: card, border, borderRadius: 20 }}>
            <BarChart3 size={48} color={muted} style={{ opacity: 0.3, marginBottom: 16 }} />
            <h3 style={{ color: text, fontWeight: 600, marginBottom: 8 }}>No report yet</h3>
            <p style={{ color: muted, fontSize: 14, marginBottom: 20 }}>Click "Generate Report" to create your first weekly summary.</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
              <StatCard icon={Flame} label="Active Days" value={`${report.activeDays}/7`} sub={`${report.streak} day streak`} color="#f59e0b" />
              <StatCard icon={Target} label="Problems" value={report.problemsSolved} sub={`${report.totalMinutes} min total`} color="#22c55e" />
              <StatCard icon={Brain} label="Pattern Acc." value={`${report.patternAccuracy}%`} sub={`${report.patternAttempts} attempts`} color={accent} />
              <StatCard icon={Clock} label="Timer Rate" value={`${report.timerCompletion}%`} sub={`${report.timerAttempts} timed`} color="#06b6d4" />
              <StatCard icon={TrendingUp} label="Interviews" value={report.interviewCount} sub={`Avg: ${report.avgInterviewScore}/100`} color="#a855f7" />
            </div>

            {/* Weak Topics */}
            {report.weakTopics?.length > 0 && (
              <div style={{ background: card, border, borderRadius: 16, padding: 20, marginBottom: 20 }}>
                <h3 style={{ color: text, fontSize: 16, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Target size={18} color="#ef4444" /> Areas to Improve
                </h3>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {report.weakTopics.map((w, i) => (
                    <div key={i} style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', fontSize: 13, fontWeight: 500 }}>
                      {w.topic} <span style={{ opacity: 0.7 }}>({w.missCount} missed)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Topics Studied */}
            {report.topicsStudied?.length > 0 && (
              <div style={{ background: card, border, borderRadius: 16, padding: 20, marginBottom: 20 }}>
                <h3 style={{ color: text, fontSize: 16, fontWeight: 600, marginBottom: 12 }}>📚 Topics Studied</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {report.topicsStudied.map((t, i) => (
                    <span key={i} style={{ padding: '6px 14px', borderRadius: 20, background: `${accent}12`, color: accent, fontSize: 13, fontWeight: 500 }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Recommendation */}
            {report.focusRecommendation && (
              <div style={{ background: `linear-gradient(135deg, ${accent}08, #a855f708)`, border: `1px solid ${accent}20`, borderRadius: 16, padding: 20 }}>
                <h3 style={{ color: accent, fontSize: 16, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  ✨ Focus for Next Week
                </h3>
                <p style={{ color: text, fontSize: 14, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{report.focusRecommendation}</p>
              </div>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
