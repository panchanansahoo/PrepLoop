import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {MessageSquare, Code2, FileText, Clock, Filter, ChevronRight, Sparkles} from 'lucide-react';
import { authFetch } from '../utils/authFetch';
import { API_URL } from '../config/api.js';



const typeConfig = {
  interview: { icon: <MessageSquare size={18} />, label: 'AI Interview', color: '#f472b6', bg: 'rgba(236,72,153,0.15)' },

  practice: { icon: <Code2 size={18} />, label: 'Code Practice', color: '#22d3ee', bg: 'rgba(6,182,212,0.15)' },
  resume: { icon: <FileText size={18} />, label: 'Resume Analysis', color: '#34d399', bg: 'rgba(16,185,129,0.15)' }
};

export default function History() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    let serverSessions = [];
    try {
      const res = await authFetch(`${API_URL}/api/user/history`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.sessions)) {
          serverSessions = data.sessions;
        }
      }
    } catch (err) { console.error(err); }

    let localSessions = [];
    try {
      const local = JSON.parse(localStorage.getItem('preploop_local_interview_history') || '[]');
      if (Array.isArray(local) && local.length > 0) {
        // Cap localSessions to last 50 entries
        const cappedLocal = local.slice(-50);
        localSessions = cappedLocal.map((item, idx) => ({
          id: item.id || `local_interview_${idx}`,
          type: 'interview',
          title: item.company && item.role ? `${item.company} ${item.role} Interview` : 'AI Interview',
          date: item.completed_at ? new Date(item.completed_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          timestamp: item.completed_at ? new Date(item.completed_at).getTime() : Date.now(),
          score: item.overall_score || 0,
          duration: item.duration ? `${Math.max(1, Math.round(item.duration / 60))} min` : '15 min'
        }));
      }
    } catch (err) {
      console.error('Failed to parse local interview history:', err);
    }

    const seen = new Set();
    const combined = [];
    for (const s of [...serverSessions, ...localSessions]) {
      const key = String(s.id || '');
      if (key && !seen.has(key)) {
        seen.add(key);
        combined.push(s);
        if (combined.length >= 100) break;
      }
    }

    setSessions(combined.slice(0, 100));
    setLoading(false);
  };

  const handleLoadSampleSession = () => {
    const sample = {
      id: 'demo-google-fullstack-swe',
      session_id: 'demo-google-fullstack-swe',
      is_demo: true,
      session_type: 'single',
      company: 'Google',
      role: 'Full Stack Engineer',
      stage: 'Technical',
      difficulty: 'medium',
      overall_score: 88,
      score: 88,
      duration: 1260,
      completed_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    };
    try {
      const historyKey = 'preploop_local_interview_history';
      const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');
      localStorage.setItem(historyKey, JSON.stringify([sample, ...existing.filter(s => s.id !== sample.id)]));
    } catch { /* empty */ }
    fetchHistory();
  };

  const displaySessions = filter === 'all' ? sessions : sessions.filter(s => s.type === filter);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Session History</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={16} color="var(--text-muted)" />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              color: 'var(--text-primary)', padding: '8px 12px', borderRadius: 8,
              fontSize: 13, fontFamily: 'inherit', cursor: 'pointer'
            }}
          >
            <option value="all">All Sessions</option>
            <option value="interview">AI Interviews</option>

            <option value="practice">Code Practice</option>
            <option value="resume">Resume Analysis</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading history...</div>
      ) : displaySessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <Clock size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No sessions found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
            You haven't completed any {filter !== 'all' ? filter : ''} sessions yet.
          </p>
          <button
            onClick={handleLoadSampleSession}
            style={{
              padding: '9px 18px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 8, color: '#f59e0b', fontSize: 13, fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer'
            }}
          >
            <Sparkles size={14} /> Explore Sample Interview
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displaySessions.map((s, i) => {
            const cfg = typeConfig[s.type] || typeConfig.practice;
            return (
              <div key={s.id || i} style={{
                background: 'var(--bg-card)', borderRadius: 12, padding: '16px 20px',
                border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
                gap: 16, cursor: 'pointer', transition: 'all 0.2s'
              }} onClick={() => {
                if (s.type === 'interview') navigate('/interview-history', { state: { sessionId: s.id } });
                else if (s.type === 'practice') navigate('/coding-playground');
                else if (s.type === 'resume') navigate('/resume-analyzer');
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: cfg.bg, color: cfg.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {cfg.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: 'var(--text-primary)' }}>{s.title}</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {s.duration}</span>
                    <span>{s.date}</span>
                    <span style={{ background: cfg.bg, color: cfg.color, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>{cfg.label}</span>
                  </div>
                </div>
                {s.score !== null && s.score !== undefined && (
                  <div style={{
                    background: s.score >= 80 ? 'rgba(0,214,143,0.15)' : s.score >= 60 ? 'rgba(255,170,0,0.15)' : 'rgba(255,71,87,0.15)',
                    color: s.score >= 80 ? 'var(--green)' : s.score >= 60 ? 'var(--yellow)' : 'var(--red)',
                    padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: 15
                  }}>
                    {s.score}%
                  </div>
                )}
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
