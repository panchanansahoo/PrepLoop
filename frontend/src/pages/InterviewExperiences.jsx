import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, ThumbsUp, Briefcase, Filter, X, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/apiFetch';

const COMPANIES = ['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix', 'Uber', 'Airbnb', 'Adobe', 'Flipkart', 'Zomato', 'Other'];
const ROUND_TYPES = ['technical', 'system-design', 'behavioral', 'hr', 'coding', 'managerial'];
const OUTCOMES = [
  { value: 'offer', label: '✅ Got Offer', color: '#4ade80' },
  { value: 'rejected', label: '❌ Rejected', color: '#f87171' },
  { value: 'pending', label: '⏳ Pending', color: '#fbbf24' },
  { value: 'unknown', label: '❓ Unknown', color: '#94a3b8' },
];

function ExperienceCard({ exp, onUpvote, isLight }) {
  const outcome = OUTCOMES.find(o => o.value === exp.outcome) || OUTCOMES[3];
  const border = isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)';
  const card = isLight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.04)';
  const text = isLight ? '#0f172a' : '#f8fafc';
  const muted = isLight ? '#64748b' : '#94a3b8';

  return (
    <div style={{ background: card, border, borderRadius: 20, padding: 24, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: text }}>{exp.company}</span>
            <span style={{ fontSize: 12, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>{exp.role}</span>
            <span style={{ fontSize: 12, color: outcome.color, fontWeight: 700 }}>{outcome.label}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: muted, background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 8 }}>{exp.round_type}</span>
            <span style={{ fontSize: 11, color: muted, background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 8 }}>{exp.difficulty}</span>
            {exp.yoe > 0 && <span style={{ fontSize: 11, color: muted }}>{exp.yoe} YOE</span>}
          </div>
        </div>
        <button
          onClick={() => onUpvote(exp.id)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '6px 12px', color: '#818cf8', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          <ThumbsUp size={13} /> {exp.upvotes || 0}
        </button>
      </div>
      <p style={{ margin: 0, fontSize: 14, color: muted, lineHeight: 1.7 }}>{exp.experience_text}</p>
      <p style={{ margin: '10px 0 0', fontSize: 11, color: muted }}>{new Date(exp.created_at).toLocaleDateString()}</p>
    </div>
  );
}

function SubmitModal({ onClose, onSubmit, isLight }) {
  const [form, setForm] = useState({ company: '', role: '', difficulty: 'medium', round_type: 'technical', experience_text: '', outcome: 'unknown', yoe: 0, is_anonymous: true });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const border = isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)';
  const inputStyle = { width: '100%', background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)', border, borderRadius: 10, padding: '10px 14px', color: isLight ? '#0f172a' : '#f8fafc', fontSize: 14, boxSizing: 'border-box' };

  const submit = async () => {
    if (!form.company || !form.role || form.experience_text.length < 50) return;
    setLoading(true);
    try { await onSubmit(form); onClose(); } catch { } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: isLight ? 'white' : '#1a1a2e', borderRadius: 24, padding: 32, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc' }}>Share Your Experience</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isLight ? '#64748b' : '#94a3b8' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <select value={form.company} onChange={e => set('company', e.target.value)} style={inputStyle}>
            <option value="">Select Company *</option>
            {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input placeholder="Role (e.g. SDE-2, Frontend Engineer) *" value={form.role} onChange={e => set('role', e.target.value)} style={inputStyle} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <select value={form.round_type} onChange={e => set('round_type', e.target.value)} style={inputStyle}>
              {ROUND_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} style={inputStyle}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <select value={form.outcome} onChange={e => set('outcome', e.target.value)} style={inputStyle}>
            {OUTCOMES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input type="number" placeholder="Years of Experience" value={form.yoe} onChange={e => set('yoe', e.target.value)} style={inputStyle} min={0} max={30} />
          <textarea
            placeholder="Describe your interview experience (min 50 chars). What questions were asked? How was the process? Any tips? *"
            value={form.experience_text}
            onChange={e => set('experience_text', e.target.value)}
            rows={5}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: isLight ? '#64748b' : '#94a3b8', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_anonymous} onChange={e => set('is_anonymous', e.target.checked)} />
            Post anonymously
          </label>
          <button
            onClick={submit}
            disabled={loading || !form.company || !form.role || form.experience_text.length < 50}
            style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 12, padding: '12px', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Submitting...' : 'Submit Experience'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InterviewExperiences() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isLight = theme === 'light';
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);

  const bg = isLight ? '#f8fafc' : '#0f0f1a';
  const text = isLight ? '#0f172a' : '#f8fafc';
  const muted = isLight ? '#64748b' : '#94a3b8';
  const border = isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)';

  const load = useCallback(async (p = 1, reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p });
      if (filterCompany) params.set('company', filterCompany);
      const data = await apiFetch.get(`/api/interview-experiences?${params}`);
      setExperiences(prev => reset ? data.experiences : [...prev, ...data.experiences]);
      setHasMore(data.hasMore);
      setPage(p);
    } catch { } finally { setLoading(false); }
  }, [filterCompany]);

  useEffect(() => { load(1, true); }, [load]);

  const handleUpvote = async (id) => {
    if (!user) return;
    await apiFetch.post(`/api/interview-experiences/${id}/upvote`, {});
    setExperiences(prev => prev.map(e => e.id === id ? { ...e, upvotes: (e.upvotes || 0) + 1 } : e));
  };

  const handleSubmit = async (form) => {
    await apiFetch.post('/api/interview-experiences', form);
    load(1, true);
  };

  const filtered = experiences.filter(e =>
    !search || e.company.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '32px 24px', color: text }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'grid', placeItems: 'center' }}>
                <Briefcase size={22} color="white" />
              </div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Interview Experiences</h1>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: muted }}>Real experiences shared by the community · Anonymized</p>
          </div>
          {user && (
            <button
              onClick={() => setShowSubmit(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              <Plus size={16} /> Share Yours
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: muted }} />
            <input
              placeholder="Search company or role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', background: isLight ? 'white' : 'rgba(255,255,255,0.06)', border, borderRadius: 12, padding: '10px 14px 10px 38px', color: text, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          <select
            value={filterCompany}
            onChange={e => { setFilterCompany(e.target.value); }}
            style={{ background: isLight ? 'white' : 'rgba(255,255,255,0.06)', border, borderRadius: 12, padding: '10px 14px', color: text, fontSize: 14, cursor: 'pointer' }}
          >
            <option value="">All Companies</option>
            {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* List */}
        {loading && page === 1 ? (
          <div style={{ textAlign: 'center', padding: 60, color: muted }}>Loading experiences...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: muted }}>
            <Briefcase size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p>No experiences found. Be the first to share!</p>
          </div>
        ) : (
          <>
            {filtered.map(exp => (
              <ExperienceCard key={exp.id} exp={exp} onUpvote={handleUpvote} isLight={isLight} />
            ))}
            {hasMore && (
              <button
                onClick={() => load(page + 1)}
                style={{ width: '100%', background: 'none', border, borderRadius: 12, padding: '12px', color: muted, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <ChevronDown size={16} /> Load More
              </button>
            )}
          </>
        )}
      </div>

      {showSubmit && <SubmitModal onClose={() => setShowSubmit(false)} onSubmit={handleSubmit} isLight={isLight} />}
    </div>
  );
}
