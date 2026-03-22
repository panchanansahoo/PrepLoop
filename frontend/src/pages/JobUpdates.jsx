import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase, Search, MapPin, Clock, ExternalLink,
  Building2, Loader2, AlertCircle, Tag,
  DollarSign, Calendar, Sparkles,
  Globe, Bookmark, TrendingUp, GraduationCap, Users,
  Zap, Brain, X, ArrowRight, Wand2
} from 'lucide-react';
import '../styles/JobUpdates.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CATEGORIES = [
  { id: 'all', label: 'All Jobs', icon: Briefcase },
  { id: 'fresher', label: 'Fresher', icon: GraduationCap },
  { id: 'off-campus', label: 'Off-Campus', icon: Globe },
  { id: 'internship', label: 'Internships', icon: Users },
  { id: 'campus', label: 'Campus Drives', icon: Building2 },
  { id: 'hiring-announcement', label: 'Announcements', icon: TrendingUp },
];

const TYPE_BADGES = {
  'full-time': { label: 'Full-Time', color: '#6366f1' },
  'internship': { label: 'Internship', color: '#8b5cf6' },
  'contract': { label: 'Contract', color: '#f59e0b' },
  'part-time': { label: 'Part-Time', color: '#10b981' },
};

const AI_EXAMPLES = [
  "React developer jobs in Bangalore",
  "Remote Python internships for freshers",
  "Full-stack roles at startups with 5 LPA+",
  "Machine learning engineer in Hyderabad",
  "Frontend developer remote part-time",
];

export default function JobUpdates() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasExternalApi, setHasExternalApi] = useState(false);
  const [savedJobs, setSavedJobs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('savedJobs') || '[]'); } catch { return []; }
  });

  // AI Search state
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiParams, setAiParams] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.append('category', activeCategory);
      if (debouncedSearch) params.append('search', debouncedSearch);
      params.append('page', page.toString());
      params.append('limit', '20');

      const headers = {};
      const token = localStorage.getItem('token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/jobs?${params}`, { headers });
      if (!response.ok) throw new Error('Failed to fetch jobs');

      const data = await response.json();
      setJobs(data.jobs || []);
      setTotalPages(data.totalPages || 1);
      setHasExternalApi(data.hasExternalApi || false);
    } catch (err) {
      setError(err.message);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, debouncedSearch, page]);

  useEffect(() => { if (!isAiMode) fetchJobs(); }, [fetchJobs, isAiMode]);
  useEffect(() => { setPage(1); }, [activeCategory, debouncedSearch]);

  // AI Search handler
  const handleAiSearch = async (query) => {
    const searchText = query || aiQuery;
    if (!searchText.trim()) return;

    setAiLoading(true);
    setAiError(null);
    setAiParams(null);
    setAiSuggestions([]);
    setJobs([]);

    try {
      const response = await fetch(`${API_URL}/api/jobs/ai-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchText }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'AI search failed');
      }

      const data = await response.json();
      setJobs(data.jobs || []);
      setAiParams(data.parsedParams || null);
      setAiSuggestions(data.suggestions || []);
    } catch (err) {
      setAiError(err.message);
      setJobs([]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiKeyDown = (e) => {
    if (e.key === 'Enter' && !aiLoading) {
      handleAiSearch();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setAiQuery(suggestion);
    handleAiSearch(suggestion);
  };

  const toggleAiMode = () => {
    const newMode = !isAiMode;
    setIsAiMode(newMode);
    if (newMode) {
      // Switching to AI mode — clear keyword results
      setJobs([]);
      setAiQuery('');
      setAiParams(null);
      setAiSuggestions([]);
      setAiError(null);
    } else {
      // Switching back to regular search
      setAiQuery('');
      setAiParams(null);
      setAiSuggestions([]);
      setAiError(null);
      // Regular jobs will auto-fetch via useEffect
    }
  };

  const toggleSaveJob = (jobId) => {
    const updated = savedJobs.includes(jobId)
      ? savedJobs.filter(id => id !== jobId)
      : [...savedJobs, jobId];
    setSavedJobs(updated);
    localStorage.setItem('savedJobs', JSON.stringify(updated));
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const formatDeadline = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((d - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Expired';
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 7) return `${diff} days left`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="job-updates-page">
      {/* Hero Header */}
      <div className="job-updates-hero">
        <div className="job-hero-content">
          <div className="job-hero-badge">
            <Sparkles size={14} />
            <span>Career Opportunities</span>
          </div>
          <h1>Job Updates</h1>
          <p>
            Discover the latest fresher jobs, internships, off-campus drives &amp; company hiring announcements.
            {hasExternalApi && <span className="api-badge"> • Live from job portals</span>}
          </p>
        </div>

        {/* Search Mode Toggle */}
        <div className="search-mode-container">
          <div className="search-mode-toggle">
            <button
              className={`mode-btn ${!isAiMode ? 'active' : ''}`}
              onClick={() => isAiMode && toggleAiMode()}
            >
              <Search size={14} />
              <span>Keyword</span>
            </button>
            <button
              className={`mode-btn ai ${isAiMode ? 'active' : ''}`}
              onClick={() => !isAiMode && toggleAiMode()}
            >
              <Brain size={14} />
              <span>AI Search</span>
              <span className="ai-spark">✨</span>
            </button>
          </div>
        </div>

        {/* Search Bars */}
        {!isAiMode ? (
          <div className="job-search-bar">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search by company, role, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>
        ) : (
          <div className="ai-search-wrapper">
            <div className={`ai-search-bar ${aiLoading ? 'searching' : ''}`}>
              <div className="ai-search-icon-wrap">
                {aiLoading ? (
                  <Loader2 size={20} className="spin" />
                ) : (
                  <Wand2 size={20} />
                )}
              </div>
              <input
                type="text"
                placeholder="Describe your dream job in plain English..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={handleAiKeyDown}
                disabled={aiLoading}
              />
              {aiQuery && !aiLoading && (
                <button className="search-clear" onClick={() => setAiQuery('')}>✕</button>
              )}
              <button
                className="ai-search-go"
                onClick={() => handleAiSearch()}
                disabled={aiLoading || !aiQuery.trim()}
              >
                {aiLoading ? 'Thinking...' : 'Search'}
                {!aiLoading && <ArrowRight size={14} />}
              </button>
            </div>

            {/* AI Example Prompts */}
            {!aiParams && !aiLoading && jobs.length === 0 && (
              <div className="ai-examples">
                <span className="ai-examples-label">Try asking:</span>
                <div className="ai-examples-list">
                  {AI_EXAMPLES.map((ex, i) => (
                    <button
                      key={i}
                      className="ai-example-chip"
                      onClick={() => { setAiQuery(ex); handleAiSearch(ex); }}
                    >
                      <Zap size={12} />
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Parsed Parameters */}
      {isAiMode && aiParams && (
        <div className="ai-params-strip">
          <div className="ai-params-header">
            <Brain size={14} />
            <span>AI understood your search as:</span>
          </div>
          <div className="ai-params-tags">
            {aiParams.role && (
              <span className="ai-param-tag role">
                <Briefcase size={11} /> {aiParams.role}
              </span>
            )}
            {aiParams.location && (
              <span className="ai-param-tag location">
                <MapPin size={11} /> {aiParams.location}
              </span>
            )}
            {aiParams.type && (
              <span className="ai-param-tag type">
                <Clock size={11} /> {aiParams.type}
              </span>
            )}
            {aiParams.experience_level && (
              <span className="ai-param-tag experience">
                <GraduationCap size={11} /> {aiParams.experience_level}
              </span>
            )}
            {aiParams.salary_range && (
              <span className="ai-param-tag salary">
                <DollarSign size={11} /> {aiParams.salary_range}
              </span>
            )}
            {aiParams.skills && aiParams.skills.length > 0 && aiParams.skills.map((skill, i) => (
              <span key={i} className="ai-param-tag skill">
                <Tag size={11} /> {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {isAiMode && aiSuggestions.length > 0 && (
        <div className="ai-suggestions">
          <span className="ai-suggestions-label">
            <Sparkles size={12} /> Related searches:
          </span>
          <div className="ai-suggestions-list">
            {aiSuggestions.map((sug, i) => (
              <button
                key={i}
                className="ai-suggestion-chip"
                onClick={() => handleSuggestionClick(sug)}
              >
                {sug}
                <ArrowRight size={12} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs (only in keyword mode) */}
      {!isAiMode && (
        <div className="job-categories">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                className={`job-category-tab ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <Icon size={16} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Results Info */}
      <div className="job-results-info">
        {isAiMode ? (
          aiLoading ? (
            <span className="ai-thinking-text">
              <Brain size={14} className="spin" /> AI is analyzing your query...
            </span>
          ) : aiError ? (
            <span className="ai-error-text">{aiError}</span>
          ) : aiParams ? (
            <span>{jobs.length} job{jobs.length !== 1 ? 's' : ''} found via AI search</span>
          ) : (
            <span>Describe what you're looking for above</span>
          )
        ) : (
          <>
            <span>{loading ? 'Loading...' : `${jobs.length} job${jobs.length !== 1 ? 's' : ''} found`}</span>
            {debouncedSearch && <span className="search-tag">for "{debouncedSearch}"</span>}
          </>
        )}
      </div>

      {/* Jobs Grid */}
      <div className="job-list">
        {(loading || aiLoading) ? (
          <div className="job-loading">
            {isAiMode ? (
              <>
                <div className="ai-loading-animation">
                  <Brain size={40} className="ai-brain-pulse" />
                  <div className="ai-loading-rings">
                    <div className="ring ring-1" />
                    <div className="ring ring-2" />
                    <div className="ring ring-3" />
                  </div>
                </div>
                <p>AI is finding the best matches for you...</p>
              </>
            ) : (
              <>
                <Loader2 size={32} className="spin" />
                <p>Fetching latest opportunities...</p>
              </>
            )}
          </div>
        ) : error || aiError ? (
          <div className="job-error">
            <AlertCircle size={32} />
            <p>{error || aiError}</p>
            <button className="btn-retry" onClick={isAiMode ? () => handleAiSearch() : fetchJobs}>Try Again</button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="job-empty">
            {isAiMode ? (
              <>
                <Brain size={48} strokeWidth={1} />
                <h3>No results yet</h3>
                <p>Try describing the type of job you're looking for, like "React developer in Mumbai" or "Remote data science internship"</p>
              </>
            ) : (
              <>
                <Briefcase size={48} strokeWidth={1} />
                <h3>No jobs found</h3>
                <p>
                  {debouncedSearch
                    ? `No results for "${debouncedSearch}". Try a different search.`
                    : 'No job listings available yet. Check back soon!'}
                </p>
              </>
            )}
          </div>
        ) : (
          jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              saved={savedJobs.includes(job.id)}
              onToggleSave={() => toggleSaveJob(job.id)}
              formatDeadline={formatDeadline}
              getTimeAgo={getTimeAgo}
            />
          ))
        )}
      </div>

      {/* Pagination (keyword mode only) */}
      {!isAiMode && !loading && totalPages > 1 && (
        <div className="job-pagination">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="pagination-btn"
          >
            ← Previous
          </button>
          <span className="pagination-info">Page {page} of {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="pagination-btn"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function JobCard({ job, saved, onToggleSave, formatDeadline, getTimeAgo }) {
  const typeBadge = TYPE_BADGES[job.type] || TYPE_BADGES['full-time'];
  const deadline = formatDeadline(job.deadline);
  const posted = getTimeAgo(job.created_at);
  const isExpired = deadline === 'Expired';
  const initials = (job.company || 'C').split(/[\s&]+/).map(w => w[0]).join('').substring(0, 2).toUpperCase();

  // Clean description — strip job requisition IDs and boilerplate
  const cleanDesc = (job.description || '')
    .replace(/Job Requisition ID\s*\S+/gi, '')
    .replace(/Position Overview\s*/gi, '')
    .replace(/By clicking.*?Takeda\.\.\./gi, '')
    .trim();

  return (
    <div className={`job-card ${isExpired ? 'expired' : ''}`}>
      <div className="job-card-header">
        <div className="job-card-company">
          {job.logo_url ? (
            <img src={job.logo_url} alt={job.company} className="company-logo" />
          ) : (
            <div className="company-logo-placeholder">
              {initials}
            </div>
          )}
          <div>
            <h3 className="job-title">{job.title}</h3>
            <span className="job-company">{job.company}</span>
          </div>
        </div>
        <button
          className={`save-btn ${saved ? 'saved' : ''}`}
          onClick={onToggleSave}
          title={saved ? 'Remove from saved' : 'Save job'}
        >
          <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="job-meta">
        {job.location && (
          <span className="job-meta-item">
            <MapPin size={13} /> {job.location}
          </span>
        )}
        <span className="job-meta-item type-badge" style={{ '--badge-color': typeBadge.color }}>
          {typeBadge.label}
        </span>
        {job.salary_range && (
          <span className="job-meta-item">
            <DollarSign size={13} /> {job.salary_range}
          </span>
        )}
        {posted && (
          <span className="job-meta-item">
            <Clock size={13} /> {posted}
          </span>
        )}
      </div>

      <p className="job-description">
        {cleanDesc.length > 200 ? cleanDesc.substring(0, 200) + '...' : cleanDesc}
      </p>

      {job.tags && job.tags.length > 0 && (
        <div className="job-tags">
          {(Array.isArray(job.tags) ? job.tags : []).slice(0, 4).map((tag, i) => (
            <span key={i} className="job-tag">
              <Tag size={10} /> {tag}
            </span>
          ))}
        </div>
      )}

      <div className="job-card-footer">
        <div className="job-footer-left">
          {deadline && !isExpired && (
            <span className="job-deadline">
              <Calendar size={14} /> Deadline: {deadline}
            </span>
          )}
          {isExpired && <span className="job-expired-badge">Expired</span>}
          {(job.source === 'adzuna' || job.source === 'remotive' || job.source === 'jsearch') && (
            <span className="job-source-badge">
              <Globe size={12} /> Live
            </span>
          )}
        </div>
        {job.apply_link && (
          <a
            href={job.apply_link}
            target="_blank"
            rel="noopener noreferrer"
            className="job-apply-btn"
          >
            Apply Now <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
}
