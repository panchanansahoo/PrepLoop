import React, { useState, useEffect } from 'react';
import { Users, Target, Clock, TrendingUp, UserPlus, UserMinus, Trophy, Zap, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../utils/apiFetch';

const FOCUS_OPTIONS = ['DSA', 'System Design', 'Behavioral', 'SQL', 'Frontend', 'Backend', 'Machine Learning'];
const LEVELS = [
  { id: 'beginner', label: 'Beginner', desc: 'Just starting prep', color: '#22c55e' },
  { id: 'intermediate', label: 'Intermediate', desc: '1-3 months of prep', color: '#6366f1' },
  { id: 'advanced', label: 'Advanced', desc: 'Interview-ready polishing', color: '#f59e0b' },
];

export default function AccountabilityPartner() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [partnerData, setPartnerData] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [optingIn, setOptingIn] = useState(false);
  const [level, setLevel] = useState('beginner');
  const [focusAreas, setFocusAreas] = useState([]);
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');

  const bg = isLight ? '#f8fafc' : '#0f0f1a';
  const card = isLight ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.04)';
  const border = isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)';
  const text = isLight ? '#0f172a' : '#f8fafc';
  const muted = isLight ? '#64748b' : '#94a3b8';
  const accent = '#6366f1';

  const fetchPartner = async () => {
    try {
      const data = await apiFetch.get('/api/accountability/partner');
      setPartnerData(data);
      if (data.hasPartner) {
        const prog = await apiFetch.get('/api/accountability/progress');
        setProgress(prog);
      }
    } catch { setPartnerData({ hasPartner: false, inPool: false }); }
    setLoading(false);
  };

  useEffect(() => { fetchPartner(); }, []);

  const handleOptIn = async () => {
    setOptingIn(true); setError('');
    try {
      await apiFetch.post('/api/accountability/opt-in', { level, focusAreas });
      await fetchPartner();
    } catch (err) { setError(err.response?.data?.error || 'Failed to opt in.'); }
    setOptingIn(false);
  };

  const handleSetGoal = async () => {
    if (!goal.trim()) return;
    try {
      await apiFetch.post('/api/accountability/set-goal', { goal });
      await fetchPartner();
      setGoal('');
    } catch { /* silent */ }
  };

  const handleLeave = async () => {
    if (!confirm('Leave your accountability partnership? This cannot be undone.')) return;
    try {
      await apiFetch.post('/api/accountability/leave');
      await fetchPartner();
    } catch { /* silent */ }
  };

  const toggleFocus = (f) => setFocusAreas(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f].slice(0, 3));

  const ProgressBar = ({ label, myVal, partnerVal, max = 7 }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: muted, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, color: muted }}>You: {myVal} | Partner: {partnerVal}</span>
      </div>
      <div style={{ display: 'flex', gap: 4, height: 8 }}>
        <div style={{ flex: 1, background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, (myVal / max) * 100)}%`, height: '100%', background: accent, borderRadius: 4, transition: 'width 0.5s' }}/>
        </div>
        <div style={{ flex: 1, background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, (partnerVal / max) * 100)}%`, height: '100%', background: '#a855f7', borderRadius: 4, transition: 'width 0.5s' }}/>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '32px 24px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg, ${accent}, #a855f7)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Users size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: text, margin: '0 0 6px' }}>Accountability Partner</h1>
          <p style={{ color: muted, fontSize: 14, margin: 0 }}>Pair up with a study buddy to stay consistent and motivated</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: muted }}>
            <div style={{ width: 40, height: 40, border: '3px solid transparent', borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            Finding your partner...
          </div>
        ) : partnerData?.hasPartner ? (
          /* Partner Found View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Partner Card */}
            <div style={{ background: `linear-gradient(135deg, ${accent}08, #a855f708)`, border: `1px solid ${accent}20`, borderRadius: 20, padding: 24, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, #a855f7)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28 }}>
                {partnerData.pair?.partnerAvatar ? <img src={partnerData.pair.partnerAvatar} alt="" style={{ width: 64, height: 64, borderRadius: '50%' }}/> : '👋'}
              </div>
              <h3 style={{ color: text, fontSize: 20, fontWeight: 600, margin: '0 0 4px' }}>{partnerData.pair?.partnerName}</h3>
              <p style={{ color: muted, fontSize: 13, margin: 0 }}>Partners since {new Date(partnerData.pair?.since).toLocaleDateString()}</p>

              {partnerData.pair?.weeklyGoal && (
                <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: card, border }}>
                  <div style={{ fontSize: 12, color: accent, fontWeight: 600, marginBottom: 4 }}>🎯 This Week's Goal</div>
                  <p style={{ color: text, fontSize: 14, margin: 0 }}>{partnerData.pair.weeklyGoal}</p>
                </div>
              )}
            </div>

            {/* Progress Comparison */}
            {progress && (
              <div style={{ background: card, border, borderRadius: 16, padding: 20 }}>
                <h3 style={{ color: text, fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={18} color={accent} /> This Week's Progress
                </h3>
                <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 4, borderRadius: 2, background: accent }}/><span style={{ fontSize: 12, color: muted }}>You</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 4, borderRadius: 2, background: '#a855f7' }}/><span style={{ fontSize: 12, color: muted }}>Partner</span></div>
                </div>
                <ProgressBar label="Active Days" myVal={progress.myProgress?.activeDays || 0} partnerVal={progress.partnerProgress?.activeDays || 0} />
                <ProgressBar label="Problems Solved" myVal={progress.myProgress?.problemsSolved || 0} partnerVal={progress.partnerProgress?.problemsSolved || 0} max={20} />
                <ProgressBar label="Pattern Accuracy" myVal={progress.myProgress?.patternAccuracy || 0} partnerVal={progress.partnerProgress?.patternAccuracy || 0} max={100} />
              </div>
            )}

            {/* Set Goal */}
            <div style={{ background: card, border, borderRadius: 16, padding: 20 }}>
              <h3 style={{ color: text, fontSize: 16, fontWeight: 600, marginBottom: 12 }}>🎯 Set Weekly Goal</h3>
              <div style={{ display: 'flex', gap: 10 }}>
                <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g. Solve 10 medium problems this week"
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border, background: bg, color: text, fontSize: 14, boxSizing: 'border-box' }}/>
                <button onClick={handleSetGoal} style={{ padding: '10px 20px', borderRadius: 10, background: accent, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Set Goal</button>
              </div>
            </div>

            {/* Leave */}
            <button onClick={handleLeave} style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 500, alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserMinus size={14} /> Leave Partnership
            </button>
          </div>
        ) : partnerData?.inPool ? (
          /* Waiting in Pool */
          <div style={{ background: card, border, borderRadius: 20, padding: 40, textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, border: '3px solid transparent', borderTopColor: accent, borderRightColor: accent, borderRadius: '50%', animation: 'spin 2s linear infinite', margin: '0 auto 16px' }} />
            <h3 style={{ color: text, fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>Looking for your partner...</h3>
            <p style={{ color: muted, fontSize: 14, margin: 0 }}>We're matching you with someone at your level. Check back soon!</p>
          </div>
        ) : (
          /* Opt-in Form */
          <div style={{ background: card, border, borderRadius: 20, padding: 28 }}>
            <h3 style={{ color: text, fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Find Your Study Partner</h3>

            {/* Level Selection */}
            <label style={{ fontSize: 13, color: muted, fontWeight: 600, display: 'block', marginBottom: 8 }}>Your Prep Level</label>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {LEVELS.map(l => (
                <button key={l.id} onClick={() => setLevel(l.id)} style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: level === l.id ? `2px solid ${l.color}` : border, background: level === l.id ? `${l.color}10` : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, color: text, fontSize: 14 }}>{l.label}</div>
                  <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{l.desc}</div>
                </button>
              ))}
            </div>

            {/* Focus Areas */}
            <label style={{ fontSize: 13, color: muted, fontWeight: 600, display: 'block', marginBottom: 8 }}>Focus Areas (pick up to 3)</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {FOCUS_OPTIONS.map(f => (
                <button key={f} onClick={() => toggleFocus(f)} style={{ padding: '8px 16px', borderRadius: 20, border: focusAreas.includes(f) ? `2px solid ${accent}` : border, background: focusAreas.includes(f) ? `${accent}12` : 'transparent', color: focusAreas.includes(f) ? accent : text, cursor: 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {focusAreas.includes(f) && <CheckCircle size={13}/>} {f}
                </button>
              ))}
            </div>

            {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</div>}

            <button onClick={handleOptIn} disabled={optingIn} style={{ width: '100%', padding: '14px', borderRadius: 14, background: `linear-gradient(135deg, ${accent}, #a855f7)`, color: '#fff', border: 'none', fontWeight: 600, fontSize: 15, cursor: optingIn ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: optingIn ? 0.7 : 1 }}>
              <UserPlus size={18} /> {optingIn ? 'Finding Partner...' : 'Find Me a Partner'}
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
