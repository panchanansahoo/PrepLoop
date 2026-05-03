import React, { useState, useEffect, useCallback } from 'react';
import { Search, Building2, Filter, ChevronDown, ChevronUp, BookOpen, Lightbulb, Hash, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../utils/apiFetch';

const COMPANY_COLORS = {
  Google: '#4285F4', Amazon: '#FF9900', Meta: '#0084FF', Apple: '#A2AAAD',
  Microsoft: '#00A4EF', Netflix: '#E50914', Uber: '#000000', Nvidia: '#76B900',
  Adobe: '#FF0000', Airbnb: '#FF5A5F', OpenAI: '#412991', Anthropic: '#D4A574',
};

export default function QuestionBankSearch() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [query, setQuery] = useState('');
  const [company, setCompany] = useState('');
  const [topic, setTopic] = useState('');
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const bg = isLight ? '#f8fafc' : '#0f0f1a';
  const card = isLight ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.04)';
  const border = isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)';
  const text = isLight ? '#0f172a' : '#f8fafc';
  const muted = isLight ? '#64748b' : '#94a3b8';
  const accent = '#6366f1';

  useEffect(() => {
    apiFetch.get('/api/question-bank/stats').then(d => setStats(d)).catch(() => {});
    apiFetch.get('/api/question-bank/companies').then(d => setCompanies(d.companies || [])).catch(() => {});
  }, []);

  const doSearch = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '15' });
      if (query.trim()) params.set('q', query.trim());
      if (company) params.set('company', company);
      if (topic) params.set('topic', topic);
      const data = await apiFetch.get(`/api/question-bank/search?${params}`);
      setResults(data.results || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch { setResults([]); setTotal(0); }
    setLoading(false);
  }, [query, company, topic]);

  useEffect(() => { doSearch(1); }, [company, topic]);

  const handleSearch = (e) => { e.preventDefault(); doSearch(1); };

  const getCompanyColor = (c) => COMPANY_COLORS[c] || accent;

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '32px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: `linear-gradient(135deg, ${accent}, #a855f7)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Search size={24} color="#fff" />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: text, margin: 0 }}>Interview Question Bank</h1>
          </div>
          <p style={{ color: muted, fontSize: 15, margin: 0 }}>
            Search {stats?.totalQuestions?.toLocaleString() || '2,600+'} real interview questions from {stats?.totalCompanies || '15+'} top companies
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: muted }} />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search questions... (e.g. 'binary tree', 'system design', 'OOP')"
              style={{ width: '100%', padding: '14px 14px 14px 42px', borderRadius: 14, border, background: card, color: text, fontSize: 15, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', }}
            />
          </div>
          <button type="submit" style={{ padding: '14px 28px', borderRadius: 14, background: `linear-gradient(135deg, ${accent}, #a855f7)`, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 15, whiteSpace: 'nowrap', transition: 'transform 0.15s', }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >Search</button>
          <button type="button" onClick={() => setShowFilters(p => !p)} style={{ padding: '14px 18px', borderRadius: 14, background: card, border, color: text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={16} /> Filters {showFilters ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          </button>
        </form>

        {/* Filters */}
        {showFilters && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', padding: 16, borderRadius: 14, background: card, border }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontSize: 12, color: muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Company</label>
              <select value={company} onChange={e => setCompany(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border, background: bg, color: text, fontSize: 14 }}>
                <option value="">All Companies</option>
                {companies.map(c => <option key={c.company} value={c.company}>{c.company} ({c.count})</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontSize: 12, color: muted, fontWeight: 600, display: 'block', marginBottom: 4 }}>Topic</label>
              <select value={topic} onChange={e => setTopic(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border, background: bg, color: text, fontSize: 14 }}>
                <option value="">All Topics</option>
                {(stats?.subjects || []).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {(company || topic) && (
              <button onClick={() => { setCompany(''); setTopic(''); }} style={{ alignSelf: 'flex-end', padding: '10px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                <X size={14} /> Clear
              </button>
            )}
          </div>
        )}

        {/* Results count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 14, color: muted }}>{total.toLocaleString()} questions found</span>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: muted }}>
              <div style={{ width: 40, height: 40, border: '3px solid transparent', borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: muted }}>
              <BookOpen size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>No questions found. Try a different search term.</p>
            </div>
          ) : results.map((q, i) => (
            <div key={q.id || i} style={{ background: card, border, borderRadius: 16, padding: '18px 20px', cursor: 'pointer', transition: 'all 0.2s', borderLeft: `4px solid ${getCompanyColor(q.company)}` }}
              onClick={() => setExpandedId(expandedId === (q.id || i) ? null : (q.id || i))}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 20px ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.3)'}` }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <p style={{ color: text, fontSize: 15, fontWeight: 500, lineHeight: 1.5, margin: 0, flex: 1 }}>{q.question}</p>
                {expandedId === (q.id || i) ? <ChevronUp size={18} color={muted}/> : <ChevronDown size={18} color={muted}/>}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: `${getCompanyColor(q.company)}20`, color: getCompanyColor(q.company), fontWeight: 600 }}>
                  <Building2 size={11} style={{ marginRight: 3, verticalAlign: -1 }}/>{q.company}
                </span>
                {q.subject && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: `${accent}15`, color: accent, fontWeight: 500 }}>{q.subject}</span>}
                {q.position && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', color: muted }}>{q.position}</span>}
                {q.year && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', color: muted }}>{q.year}</span>}
              </div>

              {expandedId === (q.id || i) && (q.model_answer || q.hint) && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: border }}>
                  {q.hint && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Lightbulb size={13}/> Hint</div>
                      <p style={{ color: muted, fontSize: 14, margin: 0, lineHeight: 1.6 }}>{q.hint}</p>
                    </div>
                  )}
                  {q.model_answer && (
                    <div>
                      <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><BookOpen size={13}/> Model Answer</div>
                      <p style={{ color: text, fontSize: 14, margin: 0, lineHeight: 1.6, opacity: 0.9 }}>{q.model_answer.slice(0, 500)}{q.model_answer.length > 500 ? '...' : ''}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {total > 15 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            <button disabled={page <= 1} onClick={() => doSearch(page - 1)} style={{ padding: '10px 20px', borderRadius: 10, border, background: card, color: page <= 1 ? muted : text, cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>← Previous</button>
            <span style={{ padding: '10px 16px', color: muted, fontSize: 14 }}>Page {page} of {Math.ceil(total / 15)}</span>
            <button disabled={page >= Math.ceil(total / 15)} onClick={() => doSearch(page + 1)} style={{ padding: '10px 20px', borderRadius: 10, border, background: card, color: page >= Math.ceil(total / 15) ? muted : text, cursor: page >= Math.ceil(total / 15) ? 'default' : 'pointer', opacity: page >= Math.ceil(total / 15) ? 0.5 : 1 }}>Next →</button>
          </div>
        )}

        {/* Company Quick Stats */}
        {companies.length > 0 && !query && !company && !topic && (
          <div style={{ marginTop: 32 }}>
            <h3 style={{ color: text, fontSize: 18, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Hash size={18} color={accent}/> Companies</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {companies.slice(0, 12).map(c => (
                <button key={c.company} onClick={() => { setCompany(c.company); setShowFilters(true); }}
                  style={{ background: card, border, borderRadius: 14, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', borderLeft: `3px solid ${getCompanyColor(c.company)}` }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ fontWeight: 600, color: text, fontSize: 14 }}>{c.company}</div>
                  <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>{c.count} questions</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
