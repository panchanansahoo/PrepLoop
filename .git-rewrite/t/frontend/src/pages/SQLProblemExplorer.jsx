import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronRight, Database, Star, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { SQL_PROBLEMS, SQL_CATEGORIES, SQL_COMPANIES } from '../data/sqlProblemsDatabase';
import { useTheme } from '../context/ThemeContext';

const difficultyColors = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444' };

export default function SQLProblemExplorer() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState('All');
  const [catFilter, setCatFilter] = useState('All');
  const [compFilter, setCompFilter] = useState('All');
  const [sortKey, setSortKey] = useState('id');
  const [sortDir, setSortDir] = useState('asc');

  const filtered = useMemo(() => {
    let result = [...SQL_PROBLEMS];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.topics.some(t => t.toLowerCase().includes(q)));
    }
    if (diffFilter !== 'All') result = result.filter(p => p.difficulty === diffFilter);
    if (catFilter !== 'All') result = result.filter(p => p.category === catFilter);
    if (compFilter !== 'All') result = result.filter(p => p.companies.includes(compFilter));
    result.sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (sortKey === 'difficulty') { const order = { Easy: 1, Medium: 2, Hard: 3 }; va = order[va]; vb = order[vb]; }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return result;
  }, [search, diffFilter, catFilter, compFilter, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const stats = useMemo(() => ({
    total: SQL_PROBLEMS.length,
    easy: SQL_PROBLEMS.filter(p => p.difficulty === 'Easy').length,
    medium: SQL_PROBLEMS.filter(p => p.difficulty === 'Medium').length,
    hard: SQL_PROBLEMS.filter(p => p.difficulty === 'Hard').length,
  }), []);

  // Theme-aware colors
  const c = {
    pageBg: isLight ? '#f8f9fc' : '#0a0a1a',
    pageText: isLight ? '#1f2937' : '#e2e8f0',
    muted: isLight ? '#6b7280' : 'rgba(255,255,255,0.5)',
    mutedSoft: isLight ? '#9ca3af' : 'rgba(255,255,255,0.4)',
    mutedSofter: isLight ? '#d1d5db' : 'rgba(255,255,255,0.3)',
    cardBg: isLight ? '#fff' : 'rgba(255,255,255,0.03)',
    cardBorder: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)',
    inputBg: isLight ? '#fff' : 'rgba(255,255,255,0.04)',
    inputBorder: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.08)',
    hoverBg: isLight ? 'rgba(99,102,241,0.04)' : 'rgba(139,92,246,0.06)',
    stripeBg: isLight ? '#f9fafb' : 'rgba(255,255,255,0.015)',
    tableBorderB: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.06)',
    tableRowBorder: isLight ? '#f3f4f6' : 'rgba(255,255,255,0.03)',
    btnActiveBorder: isLight ? 'rgba(99,102,241,0.4)' : 'rgba(139,92,246,0.5)',
    btnActiveBg: isLight ? 'rgba(99,102,241,0.08)' : 'rgba(139,92,246,0.15)',
    btnActiveColor: isLight ? '#4f46e5' : '#a78bfa',
    btnBg: isLight ? '#f3f4f6' : 'rgba(255,255,255,0.03)',
    btnBorder: isLight ? '#e5e7eb' : 'rgba(255,255,255,0.08)',
    btnColor: isLight ? '#6b7280' : 'rgba(255,255,255,0.5)',
    chevronColor: isLight ? '#d1d5db' : 'rgba(255,255,255,0.2)',
    topicColor: isLight ? '#4b5563' : 'rgba(255,255,255,0.3)',
  };

  const btnStyle = (active) => ({
    padding: '6px 14px', borderRadius: 8, border: '1px solid',
    borderColor: active ? c.btnActiveBorder : c.btnBorder,
    background: active ? c.btnActiveBg : c.btnBg,
    color: active ? c.btnActiveColor : c.btnColor,
    fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
  });

  return (
    <div style={{ minHeight: '100vh', background: c.pageBg, color: c.pageText, padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Database size={28} style={{ color: '#8b5cf6' }} />
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #8b5cf6, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SQL Mastery</h1>
        </div>
        <p style={{ color: c.muted, fontSize: 14, margin: '0 0 24px 0' }}>Master SQL with {stats.total} real-world problems across 8 categories</p>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: stats.total, icon: Database, color: '#8b5cf6' },
            { label: 'Easy', value: stats.easy, icon: CheckCircle, color: '#10b981' },
            { label: 'Medium', value: stats.medium, icon: TrendingUp, color: '#f59e0b' },
            { label: 'Hard', value: stats.hard, icon: Star, color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 10 }}>
              <s.icon size={16} style={{ color: s.color }} />
              <span style={{ fontWeight: 700, fontSize: 16, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 12, color: c.mutedSoft }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Category cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 28 }}>
          {SQL_CATEGORIES.map(cat => {
            const count = SQL_PROBLEMS.filter(p => p.category === cat.id).length;
            const isActive = catFilter === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => setCatFilter(isActive ? 'All' : cat.id)}
                style={{ padding: '14px 16px', borderRadius: 12, border: `1px solid ${isActive ? cat.color + '50' : c.cardBorder}`, background: isActive ? cat.color + '10' : c.cardBg, cursor: 'pointer', transition: 'all 0.2s', transform: isActive ? 'scale(1.02)' : 'scale(1)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 18 }}>{cat.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: cat.color }}>{cat.name}</span>
                </div>
                <div style={{ fontSize: 11, color: c.mutedSoft, marginBottom: 6 }}>{cat.desc}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: c.muted }}>{count} problems</div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 250px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: c.mutedSofter }} />
            <input
              type="text" placeholder="Search problems, topics..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', background: c.inputBg, border: `1px solid ${c.inputBorder}`, borderRadius: 10, padding: '10px 12px 10px 36px', color: c.pageText, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Filter size={14} style={{ color: c.mutedSofter, alignSelf: 'center' }} />
            {['All', 'Easy', 'Medium', 'Hard'].map(d => (
              <button key={d} onClick={() => setDiffFilter(d)} style={btnStyle(diffFilter === d)}>{d}</button>
            ))}
          </div>
          <select
            value={compFilter} onChange={e => setCompFilter(e.target.value)}
            style={{ background: c.inputBg, border: `1px solid ${c.inputBorder}`, borderRadius: 8, padding: '6px 12px', color: c.pageText, fontSize: 12, outline: 'none', cursor: 'pointer' }}
          >
            <option value="All">All Companies</option>
            {SQL_COMPANIES.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
          </select>
        </div>

        {/* Problems table */}
        <div style={{ border: `1px solid ${c.cardBorder}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: c.cardBg }}>
                {[
                  { key: 'id', label: '#', width: 50 },
                  { key: 'title', label: 'Title', width: undefined },
                  { key: 'difficulty', label: 'Difficulty', width: 100 },
                  { key: 'category', label: 'Category', width: 140 },
                  { key: 'acceptance', label: 'Acceptance', width: 100 },
                  { key: 'timeEstimate', label: 'Time', width: 70 },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: c.muted, cursor: 'pointer', userSelect: 'none', width: col.width, whiteSpace: 'nowrap', borderBottom: `1px solid ${c.tableBorderB}` }}
                  >
                    {col.label} {sortKey === col.key && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const cat = SQL_CATEGORIES.find(co => co.id === p.category);
                return (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/sql-editor/${p.id}`)}
                    style={{ cursor: 'pointer', background: i % 2 === 0 ? 'transparent' : c.stripeBg, borderBottom: `1px solid ${c.tableRowBorder}`, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = c.hoverBg}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : c.stripeBg}
                  >
                    <td style={{ padding: '10px 14px', fontSize: 12, color: c.mutedSofter, fontFamily: 'monospace' }}>{p.id.replace('sql-', '')}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: c.pageText, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {p.title} <ChevronRight size={12} style={{ color: c.chevronColor }} />
                      </div>
                      <div style={{ fontSize: 11, color: c.topicColor, marginTop: 2 }}>
                        {p.topics.slice(0, 3).join(' · ')}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: difficultyColors[p.difficulty] + '18', color: difficultyColors[p.difficulty] }}>{p.difficulty}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: cat?.color || c.pageText }}>
                        <span>{cat?.icon}</span> {cat?.name}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: c.muted }}>{p.acceptance}%</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: c.mutedSoft, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {p.timeEstimate}m
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: c.mutedSofter }}>No problems match your filters</div>
          )}
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: c.mutedSofter, textAlign: 'right' }}>Showing {filtered.length} of {SQL_PROBLEMS.length} problems</div>
      </div>
    </div>
  );
}
