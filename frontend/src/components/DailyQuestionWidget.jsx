import React, { useState, useEffect } from 'react';
import { Calendar, Code, MessageSquare, CheckCircle, ExternalLink } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../utils/apiFetch';
import { useNavigate } from 'react-router-dom';

export default function DailyQuestionWidget() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dsaDone, setDsaDone] = useState(false);
  const [behavDone, setBehavDone] = useState(false);

  const bg = isLight
    ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))'
    : 'linear-gradient(135deg, rgba(18,18,24,0.6), rgba(20,20,28,0.4))';
  const border = isLight ? '1px solid rgba(15,23,42,0.08)' : '1px solid rgba(255,255,255,0.08)';
  const text = isLight ? '#0f172a' : '#f8fafc';
  const muted = isLight ? '#64748b' : '#94a3b8';
  const card = isLight ? 'rgba(15,23,42,0.03)' : 'rgba(255,255,255,0.03)';

  useEffect(() => {
    apiFetch.get('/api/daily-question')
      .then(d => {
        setData(d);
        setDsaDone(d.dsa_completed || false);
        setBehavDone(d.behavioral_completed || false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markDone = async (type) => {
    if (type === 'dsa') setDsaDone(true);
    else setBehavDone(true);
    await apiFetch.post('/api/daily-question/complete', { type }).catch(() => {});
  };

  const diffColor = d => d === 'easy' ? '#4ade80' : d === 'medium' ? '#fbbf24' : '#f87171';

  if (loading) return (
    <div style={{ padding: '24px 28px', background: bg, borderRadius: 28, border, backdropFilter: 'blur(24px)' }}>
      <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: muted, fontSize: 13 }}>Loading today's questions...</div>
    </div>
  );

  if (!data) return null;

  return (
    <div style={{ padding: '24px 28px', background: bg, borderRadius: 28, border, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(168,85,247,0.15))', border: '1px solid rgba(99,102,241,0.2)' }}>
          <Calendar size={18} color="#818cf8" />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: text }}>Daily Questions</h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: muted, fontWeight: 500 }}>
            {data.personalizedFor ? `Personalized for: ${data.personalizedFor.join(', ')}` : 'Today\'s practice'}
          </p>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: muted }}>
          {(dsaDone ? 1 : 0) + (behavDone ? 1 : 0)}/2 done
        </div>
      </div>

      {/* DSA Question */}
      <div style={{ background: card, border, borderRadius: 16, padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Code size={14} color="#818cf8" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DSA</span>
          <span style={{ fontSize: 11, color: diffColor(data.dsa?.difficulty), fontWeight: 700, marginLeft: 'auto' }}>{data.dsa?.difficulty}</span>
        </div>
        <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: text }}>{data.dsa?.title}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={`https://leetcode.com/problems/${data.dsa?.leetcodeSlug}/`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}
          >
            <ExternalLink size={11} /> Solve on LeetCode
          </a>
          {!dsaDone ? (
            <button
              onClick={() => markDone('dsa')}
              style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}
            >
              Mark Done
            </button>
          ) : (
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#4ade80', fontWeight: 700 }}>
              <CheckCircle size={12} /> Done
            </span>
          )}
        </div>
      </div>

      {/* Behavioral Question */}
      <div style={{ background: card, border, borderRadius: 16, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <MessageSquare size={14} color="#f59e0b" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Behavioral</span>
        </div>
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: text, lineHeight: 1.5 }}>{data.behavioral?.question}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/behavioral-coach')}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#f59e0b', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <ExternalLink size={11} /> Practice with Coach
          </button>
          {!behavDone ? (
            <button
              onClick={() => markDone('behavioral')}
              style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}
            >
              Mark Done
            </button>
          ) : (
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#4ade80', fontWeight: 700 }}>
              <CheckCircle size={12} /> Done
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
