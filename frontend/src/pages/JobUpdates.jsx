import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ToastContext from '../context/ToastContext';
import { Briefcase, Search, MapPin, Clock, ExternalLink, Building2, Loader2, AlertCircle, Tag, DollarSign, Calendar, Sparkles, Globe, Bookmark, TrendingUp, GraduationCap, Users, Zap, Brain, X, ArrowRight, Wand2, Target, CheckCircle2, ChevronDown, Plus } from 'lucide-react';
import { buildAuthHeaders } from '../utils/authHeaders';
import { authFetch } from '../utils/authFetch';
import { buildApiUrl } from '../utils/safeApiUrl';
import '../styles/JobUpdates.css';
import { API_URL } from '../config/api.js';



const _CATEGORIES = [
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

const getCareerOpsHistoryStorageKey = (userId) => {
  const normalizedUserId = String(userId || '').trim();
  return normalizedUserId ? `careerOpsHistory:${normalizedUserId}` : null;
};

const parseStoredHistory = (rawValue) => {
  try {
    const parsed = JSON.parse(rawValue || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function JobUpdates() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toastCtx = useContext(ToastContext);
  const showToast = useCallback((payload) => {
    if (toastCtx?.showToast) {
      toastCtx.showToast(payload);
    } else if (typeof window !== 'undefined' && typeof window.toast === 'function') {
      window.toast(payload.description || payload.title);
    }
  }, [toastCtx]);
  const careerOpsHistoryKey = getCareerOpsHistoryStorageKey(user?.id);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, _setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [retryJobs, setRetryJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [_hasExternalApi, setHasExternalApi] = useState(false);
  const [savedJobs, setSavedJobs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('savedJobs') || '[]'); } catch { return []; }
  });
  const [trackedApplications, setTrackedApplications] = useState([]);
  const [trackingLoadingIds, setTrackingLoadingIds] = useState(() => new Set());

  // AI Search state
  const [isAiMode, setIsAiMode] = useState(false);
  const [isCareerOpsMode, setIsCareerOpsMode] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiParams, setAiParams] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiError, setAiError] = useState(null);

  // Career Ops mode state
  const [careerOpsInput, setCareerOpsInput] = useState({
    company: '',
    role: '',
    jobDescription: '',
    candidateHeadline: '',
    candidateSummary: '',
    candidateSkills: '',
  });
  const [careerOpsLoading, setCareerOpsLoading] = useState(false);
  const [careerOpsError, setCareerOpsError] = useState(null);
  const [careerOpsResult, setCareerOpsResult] = useState(null);
  const [careerOpsHistory, setCareerOpsHistory] = useState(() => (
    careerOpsHistoryKey ? parseStoredHistory(localStorage.getItem(careerOpsHistoryKey)) : []
  ));

  useEffect(() => {
    if (!careerOpsHistoryKey) {
      setCareerOpsHistory([]);
      return;
    }

    setCareerOpsHistory(parseStoredHistory(localStorage.getItem(careerOpsHistoryKey)));
  }, [careerOpsHistoryKey]);

  useEffect(() => {
    if (!careerOpsHistoryKey) return;

    try {
      localStorage.setItem(careerOpsHistoryKey, JSON.stringify(careerOpsHistory.slice(0, 10)));
    } catch {
      // Ignore storage quota / privacy mode failures.
    }
  }, [careerOpsHistory, careerOpsHistoryKey]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const aiSearchControllerRef = useRef(null);

  const fetchJobs = useCallback(async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'all') params.append('category', activeCategory);
      if (debouncedSearch) params.append('search', debouncedSearch);
      params.append('page', page.toString());
      params.append('limit', '100');

      const _headers = buildAuthHeaders(user);

      const response = await authFetch(`${API_URL}/api/jobs?${params}`, { signal });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Failed to fetch jobs (HTTP ${response.status})`);
      }

      const data = await response.json();
      if (signal?.aborted) return;
      setJobs(data.jobs || []);
      setTotalPages(data.totalPages || 1);
      setHasExternalApi(data.hasExternalApi || false);
    } catch (err) {
      if (signal?.aborted || err?.name === 'AbortError') return;
      setError(err.message);
      setJobs([]);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [activeCategory, debouncedSearch, page]);

  useEffect(() => {
    if (isAiMode || isCareerOpsMode) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    void fetchJobs(controller.signal);
    return () => controller.abort();
  }, [fetchJobs, isAiMode, isCareerOpsMode, retryJobs]);
  useEffect(() => {
    if (!isAiMode || isCareerOpsMode) {
      aiSearchControllerRef.current?.abort();
      aiSearchControllerRef.current = null;
      setAiLoading(false);
    }
    return () => aiSearchControllerRef.current?.abort();
  }, [isAiMode, isCareerOpsMode]);
  useEffect(() => { setPage(1); }, [activeCategory, debouncedSearch]);

  // AI Search handler
  const handleAiSearch = async (query) => {
    const searchText = query || aiQuery;
    if (!searchText.trim()) return;

    aiSearchControllerRef.current?.abort();
    const controller = new AbortController();
    aiSearchControllerRef.current = controller;

    setAiLoading(true);
    setAiError(null);
    setAiParams(null);
    setAiSuggestions([]);
    setJobs([]);

    try {
      const response = await authFetch(`${API_URL}/api/jobs/ai-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchText }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'AI search failed');
      }

      const data = await response.json();
      if (controller.signal.aborted) return;
      setJobs(data.jobs || []);
      setAiParams(data.parsedParams || null);
      setAiSuggestions(data.suggestions || []);
    } catch (err) {
      if (controller.signal.aborted || err?.name === 'AbortError') return;
      setAiError(err.message);
      setJobs([]);
    } finally {
      if (aiSearchControllerRef.current === controller) {
        setAiLoading(false);
      }
    }
  };

  const handleAiKeyDown = (e) => {
    if (e.key === 'Enter' && !aiLoading) {
      handleAiSearch();
    }
  };

  const handleAiSearchClick = () => {
    handleAiSearch();
  };

  const handleSuggestionClick = (suggestion) => {
    setAiQuery(suggestion);
    handleAiSearch(suggestion);
  };

  const _toggleAiMode = () => {
    const newMode = !isAiMode;
    setIsAiMode(newMode);
    if (newMode) setIsCareerOpsMode(false);
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

  const _toggleCareerOpsMode = () => {
    const newMode = !isCareerOpsMode;
    setIsCareerOpsMode(newMode);
    if (newMode) {
      setIsAiMode(false);
      setJobs([]);
      setError(null);
      setAiError(null);
      loadCareerOpsHistory();
    } else {
      setCareerOpsError(null);
    }
  };

  const loadCareerOpsHistory = async () => {
    const headers = buildAuthHeaders(user);
    if (!headers.Authorization) return;

    try {
      const response = await authFetch(`${API_URL}/api/jobs/career-ops/history?limit=10`);

      if (!response.ok) return;

      const data = await response.json().catch(() => ({}));
      if (Array.isArray(data.data)) {
        setCareerOpsHistory(data.data);
      }
    } catch {
      // Fall back to local cache.
    }
  };

  const updateCareerOpsField = (field, value) => {
    setCareerOpsInput(prev => ({ ...prev, [field]: value }));
  };

  const handleCareerOpsEvaluate = async () => {
    const headers = buildAuthHeaders(user);
    if (!headers.Authorization) {
      setCareerOpsError('Please log in to use Career Ops evaluation.');
      return;
    }

    if (!careerOpsInput.jobDescription.trim() || careerOpsInput.jobDescription.trim().length < 40) {
      setCareerOpsError('Paste a fuller job description (minimum 40 characters).');
      return;
    }

    setCareerOpsLoading(true);
    setCareerOpsError(null);
    setCareerOpsResult(null);

    try {
      const candidateSkills = careerOpsInput.candidateSkills
        .split(',')
        .map(skill => skill.trim())
        .filter(Boolean);

      const response = await authFetch(`${API_URL}/api/jobs/career-ops/evaluate`, {
        method: 'POST',
        body: JSON.stringify({
          company: careerOpsInput.company,
          role: careerOpsInput.role,
          jobDescription: careerOpsInput.jobDescription,
          candidateProfile: {
            headline: careerOpsInput.candidateHeadline,
            summary: careerOpsInput.candidateSummary,
            coreSkills: candidateSkills,
          },
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Career Ops evaluation failed');
      }

      setCareerOpsResult(data);
      if (data.historyItem) {
        setCareerOpsHistory(prev => [data.historyItem, ...prev.filter(item => item.id !== data.historyItem.id)].slice(0, 10));
      } else {
        setCareerOpsHistory(prev => [
          {
            id: data.generatedAt || String(Date.now()),
            company: careerOpsInput.company,
            role: careerOpsInput.role,
            jobDescription: careerOpsInput.jobDescription,
            candidateHeadline: careerOpsInput.candidateHeadline,
            candidateSummary: careerOpsInput.candidateSummary,
            candidateSkills: careerOpsInput.candidateSkills,
            result: data,
          },
          ...prev.filter(item => item.jobDescription !== careerOpsInput.jobDescription),
        ].slice(0, 10));
      }
    } catch (err) {
      setCareerOpsError(err.message || 'Career Ops evaluation failed');
    } finally {
      setCareerOpsLoading(false);
    }
  };

  const loadTrackedApplications = useCallback(async () => {
    if (!user) {
      setTrackedApplications([]);
      return;
    }
    try {
      const res = await authFetch(buildApiUrl('/job-applications'));
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (Array.isArray(data.applications)) {
          setTrackedApplications(data.applications);
        }
      }
    } catch (err) {
      console.warn('[job-discovery] Could not load tracked applications:', err);
    }
  }, [user]);

  useEffect(() => {
    loadTrackedApplications();
  }, [loadTrackedApplications]);

  const findTrackedApplication = useCallback((job) => {
    if (!job) return null;
    const company = (job.company || job.company_name || '').trim().toLowerCase();
    const role = (job.title || job.role || '').trim().toLowerCase();
    const jobUrl = (job.apply_link || job.job_url || '').trim();

    return trackedApplications.find((app) => {
      if (job.id && app.notes && app.notes.includes(`[job_id:${job.id}]`)) {
        return true;
      }
      if (jobUrl && app.jobUrl && app.jobUrl.trim() === jobUrl) {
        return true;
      }
      if (
        company &&
        role &&
        app.company?.trim().toLowerCase() === company &&
        app.role?.trim().toLowerCase() === role
      ) {
        return true;
      }
      return false;
    }) || null;
  }, [trackedApplications]);

  const formatJobPayload = (job) => {
    const company = (job.company || job.company_name || 'Unknown Company').trim().slice(0, 120);
    const role = (job.title || job.role || 'Unknown Role').trim().slice(0, 160);

    let validJobUrl = '';
    const rawUrl = job.apply_link || job.job_url || job.url || '';
    if (typeof rawUrl === 'string' && rawUrl.trim()) {
      try {
        const parsed = new URL(rawUrl.trim());
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          validJobUrl = rawUrl.trim().slice(0, 500);
        }
      } catch {
        validJobUrl = '';
      }
    }

    const location = (job.location || '').trim().slice(0, 160);
    const salaryRange = (job.salary_range || job.salaryRange || job.compensation || '').trim().slice(0, 120);

    const descSnippet = job.description
      ? job.description.replace(/\s+/g, ' ').trim().slice(0, 250)
      : '';
    const notes = `[job_id:${job.id}] ${descSnippet ? `Description: ${descSnippet}...` : 'Bookmarked from Job Discovery'}`.trim().slice(0, 4000);

    return {
      company,
      role,
      status: 'bookmarked',
      jobUrl: validJobUrl,
      location,
      salaryRange,
      notes,
    };
  };

  const handleTrackJob = async (job) => {
    if (!job) return;

    // Unauthenticated guest user fallback to localStorage
    if (!user) {
      const updated = savedJobs.includes(job.id) ? savedJobs : [...savedJobs, job.id];
      setSavedJobs(updated);
      try {
        localStorage.setItem('savedJobs', JSON.stringify(updated));
      } catch {}
      showToast({
        type: 'info',
        title: 'Saved Locally',
        description: 'Job saved to browser bookmarks! Sign in to sync with your Job Tracker Kanban board.',
      });
      return;
    }

    // Check duplicate against tracked applications
    const existing = findTrackedApplication(job);
    if (existing) {
      showToast({
        type: 'info',
        title: 'Already in Job Tracker',
        description: `"${existing.role}" at ${existing.company} is currently in your "${existing.status}" stage.`,
      });
      navigate('/job-tracker');
      return;
    }

    if (trackingLoadingIds.has(job.id)) return;

    setTrackingLoadingIds((prev) => new Set(prev).add(job.id));
    const payload = formatJobPayload(job);

    try {
      const res = await authFetch(buildApiUrl('/job-applications'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to add job to tracker');
      }

      if (data.application) {
        setTrackedApplications((prev) => [data.application, ...prev]);
      }

      // Also sync to savedJobs in localStorage for backward compatibility
      const updated = Array.from(new Set([...savedJobs, job.id]));
      setSavedJobs(updated);
      try {
        localStorage.setItem('savedJobs', JSON.stringify(updated));
      } catch {}

      showToast({
        type: 'success',
        title: 'Added to Job Tracker',
        description: `${payload.company} — ${payload.role} added to your Bookmarked pipeline!`,
      });
    } catch (err) {
      console.error('Job tracking error:', err);
      // Fallback: save locally
      const updated = Array.from(new Set([...savedJobs, job.id]));
      setSavedJobs(updated);
      try {
        localStorage.setItem('savedJobs', JSON.stringify(updated));
      } catch {}

      showToast({
        type: 'warning',
        title: 'Saved Locally',
        description: 'Saved to local bookmarks. Could not sync to server Job Tracker right now.',
      });
    } finally {
      setTrackingLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(job.id);
        return next;
      });
    }
  };

  const toggleSaveJob = async (job) => {
    if (!job) return;

    // Guest fallback: localStorage
    if (!user) {
      const isSaved = savedJobs.includes(job.id);
      const updated = isSaved
        ? savedJobs.filter((id) => id !== job.id)
        : [...savedJobs, job.id];
      setSavedJobs(updated);
      try {
        localStorage.setItem('savedJobs', JSON.stringify(updated));
      } catch {}
      showToast({
        type: 'info',
        title: isSaved ? 'Removed Bookmark' : 'Job Bookmarked',
        description: isSaved
          ? 'Job removed from local bookmarks.'
          : 'Job saved locally. Sign in to sync with your Job Tracker.',
      });
      return;
    }

    // Authenticated user
    const existing = findTrackedApplication(job);
    if (existing) {
      if (existing.status === 'bookmarked') {
        try {
          const res = await authFetch(buildApiUrl(`/job-applications/${existing.id}`), {
            method: 'DELETE',
          });
          if (res.ok) {
            setTrackedApplications((prev) => prev.filter((a) => a.id !== existing.id));
          }
        } catch (err) {
          console.warn('Failed to delete bookmark from server:', err);
        }
      }

      const updated = savedJobs.filter((id) => id !== job.id);
      setSavedJobs(updated);
      try {
        localStorage.setItem('savedJobs', JSON.stringify(updated));
      } catch {}

      showToast({
        type: 'info',
        title: 'Bookmark Removed',
        description: existing.status === 'bookmarked'
          ? `Removed ${existing.company} from your Job Tracker.`
          : `Unbookmarked locally (remains in "${existing.status}" stage in Job Tracker).`,
      });
    } else {
      await handleTrackJob(job);
    }
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
      {/* Exact Header */}
      <div className="job-updates-header-exact">
        <div className="job-header-left">
          <h1>All Jobs</h1>
          <p>Browse through our curated collection of tech jobs from top companies</p>
        </div>
        
        {/* Search Mode Toggle (Moved to right) */}
        <div className="search-mode-container-exact">
          <div className="search-mode-toggle">
            <button
              className={`mode-btn ${!isAiMode && !isCareerOpsMode ? 'active' : ''}`}
              onClick={() => { setIsAiMode(false); setIsCareerOpsMode(false); }}
            >
              <Search size={14} />
              <span>Keyword</span>
            </button>
            <button
              className={`mode-btn ai ${isAiMode ? 'active' : ''}`}
              onClick={() => { setIsAiMode(true); setIsCareerOpsMode(false); }}
            >
              <Brain size={14} />
              <span>AI Search</span>
              <span className="ai-spark">✨</span>
            </button>
            <button
              className={`mode-btn career-ops ${isCareerOpsMode ? 'active' : ''}`}
              onClick={() => { setIsCareerOpsMode(true); setIsAiMode(false); }}
            >
              <Target size={14} />
              <span>Career Ops</span>
            </button>
          </div>
        </div>
      </div>

      <div className="job-content-area">
        {/* Search Bars */}
        {!isAiMode && !isCareerOpsMode ? (
          <div className="job-search-filter-row">
            <div className="job-search-input-exact">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search jobs, companies, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="job-filter-dropdowns">
              <div className="custom-select-wrapper">
                <select className="job-select-exact" defaultValue="">
                  <option value="" disabled hidden>All Locations</option>
                  <option value="all">All Locations</option>
                  <option value="remote">Remote</option>
                  <option value="noida">Noida</option>
                  <option value="pune">Pune</option>
                  <option value="mumbai">Mumbai</option>
                </select>
                <ChevronDown size={14} className="select-chevron" />
              </div>
              <div className="custom-select-wrapper">
                <select className="job-select-exact" defaultValue="">
                  <option value="" disabled hidden>All Types</option>
                  <option value="all">All Types</option>
                  <option value="full-time">Full-Time</option>
                  <option value="internship">Internship</option>
                </select>
                <ChevronDown size={14} className="select-chevron" />
              </div>
              <div className="custom-select-wrapper">
                <select className="job-select-exact" defaultValue="">
                  <option value="" disabled hidden>All Experience</option>
                  <option value="all">All Experience</option>
                  <option value="0">0 years</option>
                  <option value="1-3">1-3 years</option>
                  <option value="3+">3+ years</option>
                </select>
                <ChevronDown size={14} className="select-chevron" />
              </div>
            </div>
          </div>
        ) : isAiMode ? (
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
                onClick={handleAiSearchClick}
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
        ) : (
          <div className="career-ops-panel">
            <div className="career-ops-intro">
              <h3>Career Ops Job Fit Evaluator</h3>
              <p>Paste a JD and get a structured fit score, strongest matches, gaps, and a focused action plan before you apply.</p>
            </div>

            <div className="career-ops-grid">
              <input
                type="text"
                className="career-ops-input"
                placeholder="Company (optional)"
                value={careerOpsInput.company}
                onChange={(e) => updateCareerOpsField('company', e.target.value)}
              />
              <input
                type="text"
                className="career-ops-input"
                placeholder="Role (optional)"
                value={careerOpsInput.role}
                onChange={(e) => updateCareerOpsField('role', e.target.value)}
              />
              <input
                type="text"
                className="career-ops-input"
                placeholder="Your headline (e.g., Backend Engineer | Node + Postgres)"
                value={careerOpsInput.candidateHeadline}
                onChange={(e) => updateCareerOpsField('candidateHeadline', e.target.value)}
              />
              <input
                type="text"
                className="career-ops-input"
                placeholder="Core skills (comma-separated)"
                value={careerOpsInput.candidateSkills}
                onChange={(e) => updateCareerOpsField('candidateSkills', e.target.value)}
              />
              <textarea
                className="career-ops-textarea"
                placeholder="Candidate summary / impact bullets"
                value={careerOpsInput.candidateSummary}
                onChange={(e) => updateCareerOpsField('candidateSummary', e.target.value)}
              />
              <textarea
                className="career-ops-textarea career-ops-jd"
                placeholder="Paste job description here"
                value={careerOpsInput.jobDescription}
                onChange={(e) => updateCareerOpsField('jobDescription', e.target.value)}
              />
            </div>

            <button
              className="career-ops-evaluate-btn"
              onClick={handleCareerOpsEvaluate}
              disabled={careerOpsLoading}
            >
              {careerOpsLoading ? <Loader2 size={14} className="spin" /> : <Target size={14} />}
              {careerOpsLoading ? 'Evaluating...' : 'Evaluate Fit'}
            </button>

            {careerOpsError && <div className="career-ops-error">{careerOpsError}</div>}

            {careerOpsResult && (
              <CareerOpsResultCard result={careerOpsResult} />
            )}

            {careerOpsHistory.length > 0 && (
              <div className="career-ops-history">
                <div className="career-ops-history-header">
                  <span>Recent Evaluations</span>
                  <span>{careerOpsHistory.length}</span>
                </div>
                <div className="career-ops-history-list">
                  {careerOpsHistory.map((entry) => {
                    const entryScore = Number(entry.result?.overallScore || 0).toFixed(2);
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        className="career-ops-history-item"
                        onClick={() => {
                          setCareerOpsInput({
                            company: entry.company || '',
                            role: entry.role || '',
                            jobDescription: entry.jobDescription || '',
                            candidateHeadline: entry.candidateHeadline || '',
                            candidateSummary: entry.candidateSummary || '',
                            candidateSkills: entry.candidateSkills || '',
                          });
                          setCareerOpsResult(entry.result || null);
                        }}
                      >
                        <div className="career-ops-history-item-top">
                          <strong>{entry.company || 'Untitled role'}</strong>
                          <span>{entryScore} / 5</span>
                        </div>
                        <div className="career-ops-history-item-role">{entry.role || 'No role set'}</div>
                        <div className="career-ops-history-item-copy">
                          {(entry.jobDescription || '').slice(0, 120)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Parsed Parameters */}
      {isAiMode && !isCareerOpsMode && aiParams && (
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
      {isAiMode && !isCareerOpsMode && aiSuggestions.length > 0 && (
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

      {/* Category Tabs (Removed to match screenshot, kept empty or commented logic if needed) */}
      
      {/* Results Info */}
      {!isCareerOpsMode && (
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
      )}

      {/* Jobs Grid */}
      {!isCareerOpsMode && (
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
              <button className="btn-retry" onClick={isAiMode ? () => handleAiSearch() : () => setRetryJobs(value => value + 1)}>Try Again</button>
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
            jobs.map((job) => {
              const trackedApp = findTrackedApplication(job);
              const isSaved = savedJobs.includes(job.id) || Boolean(trackedApp);
              return (
                <JobCard
                  key={job.id}
                  job={job}
                  saved={isSaved}
                  trackedApp={trackedApp}
                  isTracking={trackingLoadingIds.has(job.id)}
                  onToggleSave={toggleSaveJob}
                  onTrackJob={handleTrackJob}
                  formatDeadline={formatDeadline}
                  getTimeAgo={getTimeAgo}
                />
              );
            })
          )}
        </div>
      )}

      {/* Pagination (keyword mode only) */}
      {!isAiMode && !isCareerOpsMode && !loading && totalPages > 1 && (
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

function CareerOpsResultCard({ result }) {
  const score = Number(result?.overallScore || 0);
  const scoreBand = result?.scoreBand || 'Unknown';
  const dimensions = Array.isArray(result?.dimensions) ? result.dimensions : [];
  const topMatches = Array.isArray(result?.topMatches) ? result.topMatches : [];
  const gaps = Array.isArray(result?.gaps) ? result.gaps : [];
  const actionPlan = Array.isArray(result?.actionPlan) ? result.actionPlan : [];

  return (
    <div className="career-ops-result">
      <div className="career-ops-score-block">
        <div className="career-ops-score-value">{score.toFixed(2)} / 5</div>
        <div className="career-ops-score-band">{scoreBand}</div>
      </div>

      <div className="career-ops-dimensions">
        {dimensions.map((dimension) => (
          <div key={dimension.id || dimension.label} className="career-ops-dimension">
            <div className="career-ops-dimension-top">
              <span>{dimension.label}</span>
              <span>{Number(dimension.score || 0).toFixed(2)}</span>
            </div>
            <div className="career-ops-progress-track">
              <div className="career-ops-progress-fill" style={{ width: `${Math.max(0, Math.min(100, (Number(dimension.score || 0) / 5) * 100))}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="career-ops-columns">
        <div className="career-ops-column">
          <h4><CheckCircle2 size={14} /> Top Matches</h4>
          <ul>
            {topMatches.map((match, idx) => <li key={`${match}-${idx}`}>{match}</li>)}
          </ul>
        </div>
        <div className="career-ops-column">
          <h4><AlertCircle size={14} /> Gaps</h4>
          <ul>
            {gaps.map((gap, idx) => <li key={`${gap}-${idx}`}>{gap}</li>)}
          </ul>
        </div>
      </div>

      <div className="career-ops-plan">
        <h4>Action Plan</h4>
        <ol>
          {actionPlan.map((step, idx) => <li key={`${step}-${idx}`}>{step}</li>)}
        </ol>
      </div>
    </div>
  );
}

function JobCard({
  job,
  saved,
  trackedApp,
  isTracking,
  onToggleSave,
  onTrackJob,
  formatDeadline,
  getTimeAgo,
}) {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const typeBadge = TYPE_BADGES[job.type] || TYPE_BADGES['full-time'];
  const deadline = formatDeadline(job.deadline);
  const _posted = getTimeAgo(job.created_at);
  const isExpired = deadline === 'Expired';
  const isTracked = Boolean(trackedApp);
  
  const companyName = job.company || job.company_name || 'Unknown Company';
  const roleName = job.title || job.role || 'Unknown Role';
  const initials = companyName.split(/[\s&]+/).map(w => w?.[0] || '').join('').substring(0, 2).toUpperCase() || 'C';

  const stageLabels = {
    bookmarked: 'Bookmarked',
    applied: 'Applied',
    phone_screen: 'Phone Screen',
    technical: 'Technical',
    onsite: 'Onsite',
    offer: 'Offer',
    rejected: 'Rejected',
  };

  const handleTrackButtonClick = (e) => {
    e.stopPropagation();
    if (isTracked) {
      navigate('/job-tracker');
    } else {
      onTrackJob(job);
    }
  };

  // Clean description — strip job requisition IDs and boilerplate
  const cleanDesc = (job.description || '')
    .replace(/Job Requisition ID\s*\S+/gi, '')
    .replace(/Position Overview\s*/gi, '')
    .replace(/By clicking.*?Takeda\.\.\./gi, '')
    .trim();

  return (
    <div className={`job-card-exact ${isExpired ? 'expired' : ''}`}>
      <div className="job-card-top-exact">
        <div className="company-logo-wrapper-exact">
          {job.logo_url ? (
            <img src={job.logo_url} alt={companyName} className="company-logo-exact" />
          ) : (
            <div className="company-logo-placeholder-exact">
              <span style={{ color: '#ef4444' }}>{initials.charAt(0)}</span>
              {initials.substring(1)}
            </div>
          )}
          <div className="online-indicator-exact"></div>
        </div>
        <div className="company-info-exact">
          <span className="job-company-exact">{companyName.toUpperCase()}</span>
          <span className="job-type-badge-exact">{typeBadge.label}</span>
        </div>
        <button
          type="button"
          className={`job-card-bookmark-btn ${saved ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(job);
          }}
          title={saved ? 'Remove bookmark' : 'Bookmark & Add to Job Tracker'}
          aria-label={saved ? 'Remove bookmark' : 'Bookmark & Add to Job Tracker'}
        >
          <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <h3 className="job-title-exact">{roleName}</h3>

      <div className="job-meta-exact">
        <span className="meta-item-exact">
          <MapPin size={14} /> {job.location || 'Remote'}
        </span>
        <span className="meta-item-exact">
          <Clock size={14} /> {job.experience || '0 years'}
        </span>
      </div>

      <p className="job-desc-exact">
        About the Company {cleanDesc.length > 150 && !showDetails ? cleanDesc.substring(0, 150) + '...' : cleanDesc}
      </p>
      
      {showDetails && job.requirements && job.requirements.length > 0 && (
        <div className="job-requirements-exact" style={{ marginTop: '10px', fontSize: '13px', color: '#94a3b8' }}>
          <strong style={{ color: '#f8fafc' }}>Requirements:</strong>
          <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
            {Array.isArray(job.requirements) 
              ? job.requirements.map((req, i) => <li key={i}>{req}</li>)
              : String(job.requirements).split(',').map((req, i) => <li key={i}>{req.trim()}</li>)
            }
          </ul>
        </div>
      )}

      <div className="job-compensation-exact">
        <span className="comp-label">COMPENSATION</span>
        <span className="comp-value">{job.salary_range || 'Competitive'}</span>
      </div>

      <div className="job-actions-exact">
        <div className="job-actions-row-exact">
          <button type="button" className="btn-match-score-exact" onClick={() => navigate('/copilot', { state: { jobDetails: job } })}>
            <Zap size={14} /> Check Match Score
          </button>
          <button
            type="button"
            className={`btn-track-exact ${isTracked ? 'tracked' : ''}`}
            onClick={handleTrackButtonClick}
            disabled={isTracking}
            title={isTracked ? 'View application in Job Tracker' : 'Add to Job Tracker'}
          >
            {isTracking ? (
              <>
                <Loader2 size={14} className="spin" />
                <span>Tracking...</span>
              </>
            ) : isTracked ? (
              <>
                <CheckCircle2 size={14} />
                <span>In Tracker ({stageLabels[trackedApp?.status] || 'Tracked'})</span>
              </>
            ) : (
              <>
                <Plus size={14} />
                <span>Add to Tracker</span>
              </>
            )}
          </button>
        </div>
        <div className="job-actions-row-exact">
          <button type="button" className="btn-view-details-exact" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>
          {job.apply_link ? (
            <a href={job.apply_link} target="_blank" rel="noopener noreferrer" className="btn-apply-now-exact">
              Apply Now
            </a>
          ) : (
            <button type="button" className="btn-apply-now-exact">Apply Now</button>
          )}
        </div>
      </div>
    </div>
  );
}
