import {useState, useMemo, useEffect} from 'react';
import './CompanyPrep.css';
import { Search, Filter, Building2, ChevronDown, ChevronUp, CheckCircle, Circle, Bookmark, BookmarkCheck, Star, Clock, Flame, StickyNote, ArrowRight, BarChart3, Target, X, Mic, Brain, Code, MessageSquare, Calendar, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { COMPANIES, STAGES, ROLES, DIFFICULTIES, DATA_LAST_UPDATED } from '../data/companyPrepMeta';
import { useCompanyPrepProgress } from '../data/companyPrepProgress';
import { Link } from 'react-router-dom';

export default function CompanyPrep() {
  const FILTER_LABELS = {
    difficulty: 'Difficulty',
    stage: 'Stage',
    role: 'Role',
    frequency: 'Frequency',
    recency: 'Recency',
    status: 'Status',
  };

  const [search, setSearch] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [frequencyMin, setFrequencyMin] = useState(0);
  const [recentFilter, setRecentFilter] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
  const [noteEditing, setNoteEditing] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [showSolvedOnly, setShowSolvedOnly] = useState(false);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [activeView, setActiveView] = useState('all'); // 'all' | 'company' | 'recommended'
  const [selectedCompanyTile, setSelectedCompanyTile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questionLoadError, setQuestionLoadError] = useState('');
  const QUESTIONS_PER_PAGE = 50;

  const { progress, toggleSolved, setNote, toggleBookmark, stats, isSolved, isBookmarked, getNote, getRecommendations } = useCompanyPrepProgress(questions);

  useEffect(() => {
    let cancelled = false;
    setLoadingQuestions(true);
    setQuestionLoadError('');

    fetch('/company-prep-questions.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch question bank');
        }
        return res.json();
      })
      .then((loaded) => {
        if (cancelled) return;
        setQuestions(Array.isArray(loaded) ? loaded : []);
      })
      .catch(() => {
        if (cancelled) return;
        setQuestionLoadError('Failed to load question bank. Please refresh and try again.');
        setQuestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingQuestions(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const companyStats = useMemo(() => {
    const byCompany = {};
    questions.forEach((q) => {
      byCompany[q.company] = byCompany[q.company] || { total: 0, byStage: {}, byDifficulty: { Easy: 0, Medium: 0, Hard: 0 } };
      byCompany[q.company].total += 1;
      byCompany[q.company].byStage[q.stage] = (byCompany[q.company].byStage[q.stage] || 0) + 1;
      byCompany[q.company].byDifficulty[q.difficulty] = (byCompany[q.company].byDifficulty[q.difficulty] || 0) + 1;
    });
    return byCompany;
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    let filtered = [...questions];

    if (selectedCompanyTile) {
      filtered = filtered.filter(q => q.company === selectedCompanyTile);
    } else if (selectedCompanies.length > 0) {
      const set = new Set(selectedCompanies);
      filtered = filtered.filter(q => set.has(q.company));
    }
    if (selectedDifficulty) filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
    if (selectedStage) filtered = filtered.filter(q => q.stage === selectedStage);
    if (selectedRole) filtered = filtered.filter(q => q.role === selectedRole);
    if (frequencyMin > 0) filtered = filtered.filter(q => q.frequencyScore >= frequencyMin);
    if (recentFilter > 0) {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - recentFilter);
      filtered = filtered.filter(q => new Date(q.lastReported) >= cutoff);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(q =>
        q.question.toLowerCase().includes(s) ||
        q.tags.some(t => t.includes(s)) ||
        q.company.includes(s)
      );
    }
    if (showSolvedOnly) filtered = filtered.filter(q => isSolved(q.id));
    if (showBookmarkedOnly) filtered = filtered.filter(q => isBookmarked(q.id));

    return filtered;
  }, [search, selectedCompanies, selectedDifficulty, selectedStage, selectedRole, frequencyMin, recentFilter, showSolvedOnly, showBookmarkedOnly, selectedCompanyTile, progress, questions]);

  // Reset to page 1 when filters change
  useMemo(() => setCurrentPage(1), [search, selectedCompanies, selectedDifficulty, selectedStage, selectedRole, frequencyMin, recentFilter, showSolvedOnly, showBookmarkedOnly, selectedCompanyTile]);

  const totalPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE);
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * QUESTIONS_PER_PAGE;
    return filteredQuestions.slice(start, start + QUESTIONS_PER_PAGE);
  }, [filteredQuestions, currentPage]);

  const recommendations = useMemo(() => getRecommendations(8), [getRecommendations]);

  const toggleExpand = (id) => setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));

  const startEditNote = (id) => {
    setNoteEditing(id);
    setNoteText(getNote(id));
  };

  const saveNote = (id) => {
    setNote(id, noteText);
    setNoteEditing(null);
    setNoteText('');
  };

  const clearFilters = () => {
    setSelectedCompanies([]); setSelectedDifficulty(''); setSelectedStage('');
    setSelectedRole(''); setFrequencyMin(0); setRecentFilter(0);
    setShowSolvedOnly(false); setShowBookmarkedOnly(false);
    setSelectedCompanyTile(null); setSearch('');
  };

  const getCompanyName = (id) => COMPANIES.find(c => c.id === id)?.name || id;
  const getCompanyLogo = (id) => COMPANIES.find(c => c.id === id)?.logo || '🏢';
  const getCompanyColor = (id) => COMPANIES.find(c => c.id === id)?.color || '#888';

  const difficultyColor = (d) => d === 'Easy' ? '#22c55e' : d === 'Medium' ? '#f59e0b' : '#ef4444';
  const frequencyLabel = (f) => f >= 4 ? 'Very Frequent' : f >= 3 ? 'Frequent' : f >= 2 ? 'Occasional' : 'Rare';

  const hasActiveFilters = selectedCompanies.length > 0 || selectedDifficulty || selectedStage || selectedRole || frequencyMin > 0 || recentFilter > 0 || showSolvedOnly || showBookmarkedOnly;

  return (
    <div className="company-prep-page">
      {/* Hero */}
      <div className="cp-hero">
        <div className="cp-hero-content">
          <div className="cp-hero-badge">🏢 Company Interview Prep</div>
          <h1>Company Prep Hub</h1>
          <p>Master real interview questions from top companies. Filtered by role, stage, difficulty & frequency.</p>
          <div className="cp-hero-stats">
            <div className="cp-stat-pill">
              <Target size={16} /> <strong>{stats.totalSolved}</strong> / {stats.totalQuestions} Solved
            </div>
            <div className="cp-stat-pill">
              <Building2 size={16} /> <strong>{COMPANIES.length}</strong> Companies
            </div>
            <div className="cp-stat-pill">
              <Flame size={16} /> <strong>{stats.byDifficulty.Hard}</strong> Hard Solved
            </div>
            <div className="cp-stat-pill cp-updated-pill">
              <Calendar size={16} /> Updated: <strong>{DATA_LAST_UPDATED}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="cp-action-bar">
        <div className="cp-search-wrap">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search questions, tags, companies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="cp-search-input"
          />
          {search && <button className="cp-clear-search" onClick={() => setSearch('')}><X size={14} /></button>}
        </div>
        <div className="cp-action-buttons">
          <button className={`cp-filter-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} /> Filters {hasActiveFilters && <span className="cp-filter-badge">{[selectedDifficulty, selectedStage, selectedRole, frequencyMin > 0, recentFilter > 0, showSolvedOnly, showBookmarkedOnly, selectedCompanies.length > 0].filter(Boolean).length}</span>}
          </button>
          <Link to="/company-interview" className="cp-action-link">
            <Mic size={16} /> Mock Interview
          </Link>
        </div>
      </div>

      {questionLoadError && (
        <div className="cp-recommended-section" style={{ marginBottom: 16 }}>
          <div className="cp-rec-header">
            <X size={20} />
            <div>
              <h3>Unable to load questions</h3>
              <p>{questionLoadError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="cp-filters-panel">
          <div className="cp-filter-group">
            <label>{FILTER_LABELS.difficulty}</label>
            <div className="cp-filter-pills">
              {DIFFICULTIES.map(d => (
                <button key={d} className={`cp-pill ${selectedDifficulty === d ? 'active' : ''}`} style={selectedDifficulty === d ? { background: difficultyColor(d), color: '#fff' } : {}} onClick={() => setSelectedDifficulty(selectedDifficulty === d ? '' : d)}>{d}</button>
              ))}
            </div>
          </div>
          <div className="cp-filter-group">
            <label>{FILTER_LABELS.stage}</label>
            <div className="cp-filter-pills">
              {STAGES.map(s => (
                <button key={s} className={`cp-pill ${selectedStage === s ? 'active' : ''}`} onClick={() => setSelectedStage(selectedStage === s ? '' : s)}>{s}</button>
              ))}
            </div>
          </div>
          <div className="cp-filter-group">
            <label>{FILTER_LABELS.role}</label>
            <div className="cp-filter-pills">
              {ROLES.map(r => (
                <button key={r} className={`cp-pill ${selectedRole === r ? 'active' : ''}`} onClick={() => setSelectedRole(selectedRole === r ? '' : r)}>{r}</button>
              ))}
            </div>
          </div>
          <div className="cp-filter-group">
            <label>{FILTER_LABELS.frequency}</label>
            <div className="cp-filter-pills">
              {[{ label: '🔥 High (4+)', val: 4 }, { label: '⚡ Medium (3+)', val: 3 }, { label: 'All', val: 0 }].map(f => (
                <button key={f.val} className={`cp-pill ${frequencyMin === f.val ? 'active' : ''}`} onClick={() => setFrequencyMin(frequencyMin === f.val ? 0 : f.val)}>{f.label}</button>
              ))}
            </div>
          </div>
          <div className="cp-filter-group">
            <label>{FILTER_LABELS.recency}</label>
            <div className="cp-filter-pills">
              {[{ label: 'Last 6 months', val: 6 }, { label: 'Last year', val: 12 }, { label: 'All time', val: 0 }].map(r => (
                <button key={r.val} className={`cp-pill ${recentFilter === r.val ? 'active' : ''}`} onClick={() => setRecentFilter(recentFilter === r.val ? 0 : r.val)}>{r.label}</button>
              ))}
            </div>
          </div>
          <div className="cp-filter-group">
            <label>{FILTER_LABELS.status}</label>
            <div className="cp-filter-pills">
              <button className={`cp-pill ${showSolvedOnly ? 'active' : ''}`} onClick={() => { setShowSolvedOnly(!showSolvedOnly); setShowBookmarkedOnly(false); }}>✅ Solved</button>
              <button className={`cp-pill ${showBookmarkedOnly ? 'active' : ''}`} onClick={() => { setShowBookmarkedOnly(!showBookmarkedOnly); setShowSolvedOnly(false); }}>🔖 Bookmarked</button>
            </div>
          </div>
          {hasActiveFilters && (
            <button className="cp-clear-all-btn" onClick={clearFilters}>Clear All Filters</button>
          )}
        </div>
      )}

      {/* View Tabs */}
      <div className="cp-view-tabs">
        <button className={`cp-view-tab ${activeView === 'all' && !selectedCompanyTile ? 'active' : ''}`} onClick={() => { setActiveView('all'); setSelectedCompanyTile(null); }}>
          📋 All Questions
        </button>
        <button className={`cp-view-tab ${activeView === 'company' || selectedCompanyTile ? 'active' : ''}`} onClick={() => { setActiveView('company'); setSelectedCompanyTile(null); }}>
          🏢 By Company
        </button>
        <button className={`cp-view-tab ${activeView === 'recommended' ? 'active' : ''}`} onClick={() => { setActiveView('recommended'); setSelectedCompanyTile(null); }}>
          ✨ Recommended
        </button>
      </div>

      {/* Company Tiles Grid */}
      {(activeView === 'company' && !selectedCompanyTile) && (
        <div className="cp-company-grid">
          {COMPANIES.map(c => (
            <button key={c.id} className="cp-company-tile" onClick={() => setSelectedCompanyTile(c.id)} style={{ '--company-color': c.color }}>
              <span className="cp-tile-logo">{c.logo}</span>
              <div className="cp-tile-info">
                <strong>{c.name}</strong>
                <span className="cp-tile-count">{companyStats[c.id]?.total || 0} questions</span>
              </div>
              <div className="cp-tile-progress">
                <div className="cp-tile-bar">
                  <div className="cp-tile-fill" style={{ width: `${((stats.byCompany[c.id] || 0) / (companyStats[c.id]?.total || 1)) * 100}%`, background: c.color }}></div>
                </div>
                <span className="cp-tile-solved">{stats.byCompany[c.id] || 0}/{companyStats[c.id]?.total || 0}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected Company Header */}
      {selectedCompanyTile && (
        <div className="cp-selected-company" style={{ '--company-color': getCompanyColor(selectedCompanyTile) }}>
          <button className="cp-back-btn" onClick={() => setSelectedCompanyTile(null)}>← Back to Companies</button>
          <div className="cp-selected-header">
            <span className="cp-selected-logo">{getCompanyLogo(selectedCompanyTile)}</span>
            <div>
              <h2>{getCompanyName(selectedCompanyTile)}</h2>
              <p>{companyStats[selectedCompanyTile]?.total || 0} questions · {stats.byCompany[selectedCompanyTile] || 0} solved</p>
            </div>
          </div>
        </div>
      )}

      {/* Recommended View */}
      {activeView === 'recommended' && (
        <div className="cp-recommended-section">
          <div className="cp-rec-header">
            <Brain size={20} />
            <div>
              <h3>Personalized Recommendations</h3>
              <p>Based on your weak areas and target companies</p>
            </div>
          </div>
          {stats.weakTags.length > 0 && (
            <div className="cp-weak-tags">
              <span className="cp-weak-label">Focus Areas:</span>
              {stats.weakTags.slice(0, 5).map(t => (
                <span key={t.tag} className="cp-weak-tag">{t.tag} ({t.solved}/{t.total})</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Questions List */}
      <div className="cp-questions-list">
        <div className="cp-list-header">
          <span>
            {loadingQuestions ? 'Loading question bank...' : `${activeView === 'recommended' ? recommendations.length : filteredQuestions.length} questions`}
            {!loadingQuestions && activeView !== 'recommended' && totalPages > 1 ? ` · Page ${currentPage} of ${totalPages}` : ''}
          </span>
        </div>

        {(activeView === 'recommended' ? recommendations : paginatedQuestions).map(q => (
          <div key={q.id} className={`cp-question-card ${isSolved(q.id) ? 'solved' : ''}`}>
            <div className="cp-card-header" onClick={() => toggleExpand(q.id)}>
              <button className="cp-solve-btn" onClick={e => { e.stopPropagation(); toggleSolved(q.id); }} title={isSolved(q.id) ? 'Mark unsolved' : 'Mark solved'}>
                {isSolved(q.id) ? <CheckCircle size={20} className="cp-solved-icon" /> : <Circle size={20} />}
              </button>
              <div className="cp-card-content">
                <div className="cp-card-meta">
                  <span className="cp-company-badge" style={{ background: `${getCompanyColor(q.company)}22`, color: getCompanyColor(q.company), borderColor: `${getCompanyColor(q.company)}44` }}>
                    {getCompanyLogo(q.company)} {getCompanyName(q.company)}
                  </span>
                  <span className="cp-diff-badge" style={{ color: difficultyColor(q.difficulty), background: `${difficultyColor(q.difficulty)}18` }}>
                    {q.difficulty}
                  </span>
                  <span className="cp-stage-badge">{q.stage}</span>
                  <span className="cp-role-badge">{q.role}</span>
                </div>
                <p className="cp-question-text">{q.question}</p>
                <div className="cp-card-footer">
                  <span className="cp-freq" title={frequencyLabel(q.frequencyScore)}>
                    {'🔥'.repeat(Math.min(q.frequencyScore, 5))}
                  </span>
                  <span className="cp-tags">
                    {q.tags.slice(0, 3).map(t => <span key={t} className="cp-tag">#{t}</span>)}
                  </span>
                  <span className="cp-reported"><Clock size={12} /> {q.lastReported}</span>
                </div>
              </div>
              <div className="cp-card-actions">
                <button className="cp-bookmark-btn" onClick={e => { e.stopPropagation(); toggleBookmark(q.id); }} title={isBookmarked(q.id) ? 'Remove bookmark' : 'Bookmark'}>
                  {isBookmarked(q.id) ? <BookmarkCheck size={18} className="cp-bookmarked" /> : <Bookmark size={18} />}
                </button>
                {expandedCards[q.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>

            {/* Expanded Answer */}
            {expandedCards[q.id] && (
              <div className="cp-card-expanded">
                {q.theory && (
                  <div className="cp-theory-section" style={{ marginBottom: '16px', padding: '14px 18px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.08)', borderLeft: '4px solid #3b82f6' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: '600', color: '#60a5fa', marginBottom: '8px', marginTop: 0 }}><Brain size={16} /> Theory</h4>
                    <p style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>{q.theory}</p>
                  </div>
                )}
                <div className="cp-answer-section">
                  <h4>💡 Answer</h4>
                  <div className="cp-answer-content">
                    {q.answer.split('```').map((block, idx) => {
                      if (idx % 2 === 1) {
                        const lines = block.split('\n');
                        const lang = lines[0].trim();
                        const code = lines.slice(1).join('\n');
                        return (
                          <pre key={idx} className="cp-code-block">
                            <div className="cp-code-header">{lang || 'code'}</div>
                            <code>{code}</code>
                          </pre>
                        );
                      }
                      return block.split('\n').map((line, i) => {
                        if (!line.trim()) return <br key={`${idx}-${i}`} />;
                        if (line.startsWith('**') && line.endsWith('**')) return <strong key={`${idx}-${i}`}>{line.slice(2, -2)}</strong>;
                        return <p key={`${idx}-${i}`} className="cp-answer-line">{line}</p>;
                      });
                    })}
                  </div>
                </div>

                {q.hints && q.hints.length > 0 && (
                  <div className="cp-hints-section">
                    <h4>💭 Hints</h4>
                    <ul>
                      {q.hints.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                )}

                {q.approach && (
                  <div className="cp-approach-section">
                    <h4><Lightbulb size={14} /> Approach</h4>
                    <p className="cp-approach-text">{q.approach}</p>
                  </div>
                )}

                {/* Notes Section */}
                <div className="cp-notes-section">
                  <h4><StickyNote size={14} /> Your Notes</h4>
                  {noteEditing === q.id ? (
                    <div className="cp-note-editor">
                      <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add your notes, key takeaways, or related links..." rows={3} />
                      <div className="cp-note-actions">
                        <button className="cp-note-save" onClick={() => saveNote(q.id)}>Save</button>
                        <button className="cp-note-cancel" onClick={() => setNoteEditing(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="cp-note-display" onClick={() => startEditNote(q.id)}>
                      {getNote(q.id) || <span className="cp-note-placeholder">Click to add notes...</span>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredQuestions.length === 0 && activeView !== 'recommended' && (
          <div className="cp-empty">
            <Search size={48} />
            <h3>No questions found</h3>
            <p>Try adjusting your filters or search term</p>
            <button className="cp-clear-all-btn" onClick={clearFilters}>Clear Filters</button>
          </div>
        )}

        {/* Pagination */}
        {activeView !== 'recommended' && totalPages > 1 && (
          <div className="cp-pagination">
            <button className="cp-page-btn" disabled={currentPage === 1} onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              <ChevronLeft size={16} /> Previous
            </button>
            <div className="cp-page-numbers">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }
                return (
                  <button key={pageNum} className={`cp-page-num ${currentPage === pageNum ? 'active' : ''}`} onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button className="cp-page-btn" disabled={currentPage === totalPages} onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
