import { useState, useEffect, useCallback } from 'react';
import './AdminDashboard.css';
import { authFetch } from '../utils/authFetch';
import { buildApiUrl } from '../utils/safeApiUrl';

const adminApi = {
  get: async (url, config = {}) => {
    let fullUrl = url;
    if (config.params) {
      const searchParams = new URLSearchParams();
      for (const [key, val] of Object.entries(config.params)) {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, val);
        }
      }
      const qs = searchParams.toString();
      if (qs) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
      }
    }
    const res = await authFetch(fullUrl, { method: 'GET' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data?.error || `Request failed with status ${res.status}`);
      error.response = { status: res.status, data };
      throw error;
    }
    return { data, status: res.status };
  },
  post: async (url, body = {}) => {
    const res = await authFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data?.error || `Request failed with status ${res.status}`);
      error.response = { status: res.status, data };
      throw error;
    }
    return { data, status: res.status };
  },
  put: async (url, body = {}) => {
    const res = await authFetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data?.error || `Request failed with status ${res.status}`);
      error.response = { status: res.status, data };
      throw error;
    }
    return { data, status: res.status };
  },
  patch: async (url, body = {}) => {
    const res = await authFetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data?.error || `Request failed with status ${res.status}`);
      error.response = { status: res.status, data };
      throw error;
    }
    return { data, status: res.status };
  },
  delete: async (url) => {
    const res = await authFetch(url, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data?.error || `Request failed with status ${res.status}`);
      error.response = { status: res.status, data };
      throw error;
    }
    return { data, status: res.status };
  },
};
import {
  Users, FileText, BarChart3, Trash2, ShieldCheck, Shield,
  Search, ChevronLeft, ChevronRight, AlertTriangle, TrendingUp,
  UserCheck, UserX, MessageSquare, Loader2, RefreshCw,
  Briefcase, Plus, Edit3, ToggleLeft, ToggleRight, X, ExternalLink,
  ListChecks, Copy, Check, UploadCloud, FileUp, ChevronDown, ChevronUp,
  Eye, Clock, HelpCircle, Sparkles, Share2
} from 'lucide-react';

export default function AdminDashboard() {
  const API_BASE_URL = import.meta.env.VITE_API_URL || '';
  const buildAdminApiUrl = useCallback(
    (path) => buildApiUrl(path, { rawBaseUrl: API_BASE_URL, apiPrefix: '/api' }),
    [API_BASE_URL]
  );
  const FORM_LABELS = {
    requirements: 'Requirements (comma-separated)',
  };

  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // User filters
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);

  // Content filters
  const [contentType, setContentType] = useState('posts');
  const [contentPage, setContentPage] = useState(1);
  const [contentTotal, setContentTotal] = useState(0);

  // Job management
  const [jobs, setJobs] = useState([]);
  const [jobPage, setJobPage] = useState(1);
  const [jobTotal, setJobTotal] = useState(0);
  const [jobSearch, setJobSearch] = useState('');
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: '', company: '', category: 'fresher', job_type: 'full-time',
    location: '', salary_range: '', description: '', requirements: '',
    apply_link: '', deadline: '', tags: '', is_active: true
  });

  // Question Sets management
  const [questionSets, setQuestionSets] = useState([]);
  const [questionSetPage, setQuestionSetPage] = useState(1);
  const [questionSetTotal, setQuestionSetTotal] = useState(0);
  const [questionSetSearch, setQuestionSetSearch] = useState('');
  const [showSetModal, setShowSetModal] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [showSetPreview, setShowSetPreview] = useState(false);
  const [previewModalSet, setPreviewModalSet] = useState(null);

  // Submissions modal state
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [activeSetForSubmissions, setActiveSetForSubmissions] = useState(null);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState(null);

  // Question Set Form
  const initialSetForm = {
    title: '',
    description: '',
    interviewType: 'technical',
    difficulty: 'medium',
    requiresLogin: false,
    passcode: '',
    clearPasscode: false,
    hasPasscode: false,
    expiresAt: '',
    maxAttempts: '',
    allowedEmails: '',
    companyName: '',
    roleName: '',
    customInstructions: '',
    questions: [
      { question: '', context: '', expectedTopics: '', timeLimit: 60 }
    ],
  };
  const [setForm, setSetForm] = useState(initialSetForm);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkError, setBulkError] = useState('');

  const LIMIT = 15;

  const clearMessages = () => { setError(''); setSuccess(''); };

  // ─── Fetch Stats ───
  const fetchStats = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const res = await adminApi.get('/api/admin/stats');
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch Users ───
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const res = await adminApi.get('/api/admin/users', {
        params: {
          page: userPage,
          limit: LIMIT,
          search: userSearch || undefined,
          role: userRoleFilter || undefined
        }
      });
      setUsers(res.data.users);
      setUserTotal(res.data.total);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [userPage, userSearch, userRoleFilter]);

  // ─── Fetch Content ───
  const fetchContent = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const res = await adminApi.get('/api/admin/content', {
        params: { type: contentType, page: contentPage, limit: LIMIT }
      });
      setContent(res.data.items);
      setContentTotal(res.data.total);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [contentType, contentPage]);

  // ─── Fetch Jobs ───
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const res = await adminApi.get('/api/jobs', {
        params: { page: jobPage, limit: LIMIT, search: jobSearch || undefined, include_inactive: true, source: 'admin' }
      });
      setJobs(res.data.jobs || []);
      setJobTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [jobPage, jobSearch]);

  // ─── Fetch Question Sets ───
  const fetchQuestionSets = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const res = await adminApi.get('/api/admin/question-sets', {
        params: {
          page: questionSetPage,
          limit: LIMIT,
          search: questionSetSearch || undefined,
        }
      });
      setQuestionSets(res.data.questionSets || []);
      setQuestionSetTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load question sets');
    } finally {
      setLoading(false);
    }
  }, [questionSetPage, questionSetSearch]);

  useEffect(() => {
    if (activeTab === 'stats') fetchStats();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'content') fetchContent();
    if (activeTab === 'jobs') fetchJobs();
    if (activeTab === 'question-sets') fetchQuestionSets();
  }, [activeTab, fetchStats, fetchUsers, fetchContent, fetchJobs, fetchQuestionSets]);

  // ─── Actions ───
  const handleRoleChange = async (userId, newRole) => {
    clearMessages();
    try {
      await adminApi.put(buildAdminApiUrl(`/admin/users/${userId}/role`), { role: newRole });
      setSuccess(`Role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Delete user ${email}? This cannot be undone.`)) return;
    clearMessages();
    try {
      await adminApi.delete(`/api/admin/users/${userId}`);
      setSuccess('User deleted');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleDeleteContent = async (type, id) => {
    if (!window.confirm(`Delete this ${type.slice(0, -1)}?`)) return;
    clearMessages();
    try {
      await adminApi.delete(`/api/admin/content/${type}/${id}`);
      setSuccess('Content deleted');
      fetchContent();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete content');
    }
  };

  // ─── Job Actions ───
  const resetJobForm = () => {
    setJobForm({
      title: '', company: '', category: 'fresher', job_type: 'full-time',
      location: '', salary_range: '', description: '', requirements: '',
      apply_link: '', deadline: '', tags: '', is_active: true
    });
    setEditingJob(null);
  };

  const openCreateJob = () => { resetJobForm(); setShowJobModal(true); };

  const openEditJob = (job) => {
    setEditingJob(job);
    setJobForm({
      title: job.title || '', company: job.company || '', category: job.category || 'fresher',
      job_type: job.type || job.job_type || 'full-time', location: job.location || '',
      salary_range: job.salary_range || '', description: job.description || '',
      requirements: Array.isArray(job.requirements) ? job.requirements.join(', ') : (job.requirements || ''),
      apply_link: job.apply_link || '',
      deadline: job.deadline ? job.deadline.split('T')[0] : '',
      tags: Array.isArray(job.tags) ? job.tags.join(', ') : (job.tags || ''),
      is_active: job.is_active !== false
    });
    setShowJobModal(true);
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    const payload = {
      ...jobForm,
      requirements: jobForm.requirements ? jobForm.requirements.split(',').map(r => r.trim()).filter(Boolean) : [],
      tags: jobForm.tags ? jobForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      deadline: jobForm.deadline || null
    };
    try {
      if (editingJob) {
        await adminApi.put(`/api/jobs/${editingJob.id}`, payload);
        setSuccess('Job updated successfully');
      } else {
        await adminApi.post('/api/jobs', payload);
        setSuccess('Job created successfully');
      }
      setShowJobModal(false);
      resetJobForm();
      fetchJobs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save job');
    }
  };

  const handleToggleJob = async (jobId) => {
    clearMessages();
    try {
      await adminApi.patch(`/api/jobs/${jobId}/toggle`);
      setSuccess('Job status toggled');
      fetchJobs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to toggle job');
    }
  };

  const handleDeleteJob = async (jobId, title) => {
    if (!window.confirm(`Delete job "${title}"? This cannot be undone.`)) return;
    clearMessages();
    try {
      await adminApi.delete(`/api/jobs/${jobId}`);
      setSuccess('Job deleted');
      fetchJobs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete job');
    }
  };

  // ─── Question Set CRUD Handlers ───
  const openCreateSet = () => {
    setEditingSet(null);
    setSetForm(initialSetForm);
    setShowBulkUpload(false);
    setBulkCsvText('');
    setBulkError('');
    setShowSetPreview(false);
    setShowSetModal(true);
  };

  const openEditSet = (qs) => {
    setEditingSet(qs);
    const questionsArr = Array.isArray(qs.questions) ? qs.questions.map(q => ({
      question: typeof q === 'string' ? q : (q.question || ''),
      context: q.context || '',
      expectedTopics: Array.isArray(q.expectedTopics) ? q.expectedTopics.join(', ') : (q.expectedTopics || ''),
      timeLimit: q.timeLimit || 60,
    })) : [{ question: '', context: '', expectedTopics: '', timeLimit: 60 }];

    const allowlistStr = Array.isArray(qs.allowed_emails)
      ? qs.allowed_emails.join(', ')
      : (Array.isArray(qs.settings?.allowedEmails) ? qs.settings.allowedEmails.join(', ') : '');

    setSetForm({
      title: qs.title || '',
      description: qs.description || '',
      interviewType: qs.interview_type || 'technical',
      difficulty: qs.difficulty || 'medium',
      requiresLogin: qs.requires_login !== false,
      passcode: '',
      clearPasscode: false,
      hasPasscode: Boolean(qs.has_passcode),
      expiresAt: qs.expires_at ? new Date(qs.expires_at).toISOString().slice(0, 16) : '',
      maxAttempts: qs.max_attempts ?? '',
      allowedEmails: allowlistStr,
      companyName: qs.settings?.companyName || '',
      roleName: qs.settings?.roleName || qs.roleName || '',
      customInstructions: qs.settings?.customInstructions || '',
      questions: questionsArr.length > 0 ? questionsArr : [{ question: '', context: '', expectedTopics: '', timeLimit: 60 }],
    });
    setShowBulkUpload(false);
    setBulkCsvText('');
    setBulkError('');
    setShowSetPreview(false);
    setShowSetModal(true);
  };

  const handleQuestionChange = (index, field, value) => {
    setSetForm(prev => {
      const updated = [...prev.questions];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, questions: updated };
    });
  };

  const handleAddQuestion = () => {
    setSetForm(prev => ({
      ...prev,
      questions: [...prev.questions, { question: '', context: '', expectedTopics: '', timeLimit: 60 }]
    }));
  };

  const handleRemoveQuestion = (index) => {
    setSetForm(prev => {
      if (prev.questions.length <= 1) return prev;
      return {
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index)
      };
    });
  };

  const moveQuestion = (index, offset) => {
    setSetForm(prev => {
      const destination = index + offset;
      if (destination < 0 || destination >= prev.questions.length) return prev;
      const questions = [...prev.questions];
      [questions[index], questions[destination]] = [questions[destination], questions[index]];
      return { ...prev, questions };
    });
  };

  const handleParseBulkUpload = (rawText) => {
    setBulkError('');
    if (!rawText || !rawText.trim()) return;

    try {
      if (rawText.trim().startsWith('[') || rawText.trim().startsWith('{')) {
        const parsed = JSON.parse(rawText);
        const items = Array.isArray(parsed) ? parsed : (parsed.questions || []);
        if (items.length === 0) throw new Error('No questions found in JSON array');
        const formatted = items.map(item => ({
          question: typeof item === 'string' ? item : (item.question || item.text || ''),
          context: item.context || '',
          expectedTopics: Array.isArray(item.expectedTopics) ? item.expectedTopics.join(', ') : (item.expectedTopics || item.topics || ''),
          timeLimit: item.timeLimit || item.time_limit || 60,
        })).filter(q => q.question);

        setSetForm(prev => ({
          ...prev,
          questions: [...prev.questions.filter(q => q.question.trim()), ...formatted]
        }));
        setShowBulkUpload(false);
        setBulkCsvText('');
        return;
      }

      const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) throw new Error('File is empty');

      const firstLine = lines[0].toLowerCase();
      const hasHeader = firstLine.includes('question');
      const dataLines = hasHeader ? lines.slice(1) : lines;

      const newQuestions = dataLines.map(line => {
        const cols = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            cols.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        cols.push(cur.trim());

        return {
          question: cols[0] || '',
          context: cols[1] || '',
          expectedTopics: cols[2] || '',
          timeLimit: Number(cols[3]) || 60,
        };
      }).filter(q => q.question);

      if (newQuestions.length === 0) {
        throw new Error('No valid questions found in CSV');
      }

      setSetForm(prev => ({
        ...prev,
        questions: [...prev.questions.filter(q => q.question.trim()), ...newQuestions]
      }));
      setShowBulkUpload(false);
      setBulkCsvText('');
    } catch (err) {
      setBulkError(err.message || 'Failed to parse questions');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      setBulkCsvText(text);
      handleParseBulkUpload(text);
    };
    reader.readAsText(file);
  };

  const handleSaveQuestionSet = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!setForm.title.trim()) {
      setError('Please provide a title for the question set');
      return;
    }

    const cleanedQuestions = setForm.questions
      .filter(q => q.question && q.question.trim())
      .map(q => ({
        question: q.question.trim(),
        context: q.context?.trim() || '',
        expectedTopics: typeof q.expectedTopics === 'string'
          ? q.expectedTopics.split(',').map(t => t.trim()).filter(Boolean)
          : (q.expectedTopics || []),
        timeLimit: Number(q.timeLimit) || 60,
      }));

    if (cleanedQuestions.length === 0) {
      setError('Please add at least one question');
      return;
    }

    const emailsList = setForm.allowedEmails
      ? setForm.allowedEmails.split(/[\n,;]+/).map(s => s.trim().toLowerCase()).filter(Boolean)
      : [];

    const payload = {
      title: setForm.title.trim(),
      description: setForm.description?.trim() || '',
      interviewType: setForm.interviewType,
      difficulty: setForm.difficulty,
      requiresLogin: setForm.requiresLogin,
      passcode: setForm.passcode,
      clearPasscode: setForm.clearPasscode,
      expiresAt: setForm.expiresAt ? new Date(setForm.expiresAt).toISOString() : null,
      maxAttempts: setForm.maxAttempts,
      allowedEmails: emailsList,
      role: setForm.roleName?.trim() || '',
      roleName: setForm.roleName?.trim() || '',
      questions: cleanedQuestions,
      settings: {
        companyName: setForm.companyName?.trim() || '',
        roleName: setForm.roleName?.trim() || '',
        customInstructions: setForm.customInstructions?.trim() || '',
        allowedEmails: emailsList,
      }
    };

    setLoading(true);
    try {
      if (editingSet) {
        await adminApi.put(`/api/admin/question-sets/${editingSet.id}`, payload);
        setSuccess('Question set updated successfully');
      } else {
        const res = await adminApi.post('/api/admin/question-sets', payload);
        const token = res.data.token || res.data.questionSet.share_code;
        setSuccess(`Question set created! Candidate link: ${window.location.origin}/app?token=${token}`);
      }
      setShowSetModal(false);
      fetchQuestionSets();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save question set');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSetActive = async (qs) => {
    try {
      await adminApi.put(`/api/admin/question-sets/${qs.id}`, { isActive: !qs.is_active });
      setQuestionSets(prev => prev.map(s => s.id === qs.id ? { ...s, is_active: !s.is_active } : s));
      setSuccess(`Question set ${qs.is_active ? 'deactivated' : 'activated'}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleToggleRequiresLogin = async (qs) => {
    try {
      await adminApi.put(`/api/admin/question-sets/${qs.id}`, { requiresLogin: !qs.requires_login });
      setQuestionSets(prev => prev.map(s => s.id === qs.id ? { ...s, requires_login: !s.requires_login } : s));
      setSuccess(`Updated "${qs.title}": ${qs.requires_login ? 'Now accessible via direct link without login' : 'Now requires candidate login'}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update access requirement');
    }
  };

  const handleDeleteQuestionSet = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question set? This will also remove associated submissions.')) return;
    try {
      await adminApi.delete(`/api/admin/question-sets/${id}`);
      setSuccess('Question set deleted successfully');
      fetchQuestionSets();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete question set');
    }
  };

  const handleCopyShareLink = (code) => {
    const link = `${window.location.origin}/app?token=${code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    });
  };

  const handleViewSubmissions = async (qs) => {
    setActiveSetForSubmissions(qs);
    setShowSubmissionsModal(true);
    setSubmissionsLoading(true);
    setExpandedSubmissionId(null);
    try {
      const res = await adminApi.get(`/api/admin/question-sets/${qs.id}/submissions`);
      setSubmissionsList(res.data.submissions || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load submissions');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const totalUserPages = Math.ceil(userTotal / LIMIT);
  const totalContentPages = Math.ceil(contentTotal / LIMIT);
  const totalJobPages = Math.ceil(jobTotal / LIMIT);
  const totalQuestionSetPages = Math.ceil(questionSetTotal / LIMIT);

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-left">
          <ShieldCheck size={28} />
          <div>
            <h1>Admin Dashboard</h1>
            <p>Manage users, content, and platform analytics</p>
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="admin-alert admin-alert-error">
          <AlertTriangle size={16} /> {error}
          <button onClick={() => setError('')} className="admin-alert-close">&times;</button>
        </div>
      )}
      {success && (
        <div className="admin-alert admin-alert-success">
          <UserCheck size={16} /> {success}
          <button onClick={() => setSuccess('')} className="admin-alert-close">&times;</button>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        {[
          { key: 'stats', label: 'Overview', icon: BarChart3 },
          { key: 'users', label: 'Users', icon: Users },
          { key: 'content', label: 'Content', icon: MessageSquare },
          { key: 'jobs', label: 'Jobs', icon: Briefcase },
          { key: 'question-sets', label: 'Question Sets', icon: ListChecks }
        ].map(tab => (
          <button
            key={tab.key}
            className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.key); clearMessages(); }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="admin-loading">
          <Loader2 size={28} className="spin" />
          <span>Loading...</span>
        </div>
      )}

      {/* ═══ STATS TAB ═══ */}
      {activeTab === 'stats' && stats && !loading && (
        <div className="admin-stats-grid">
          <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="#6366f1" />
          <StatCard label="New (7d)" value={stats.newUsersLast7Days} icon={TrendingUp} color="#22c55e" />
          <StatCard label="Submissions" value={stats.totalSubmissions} icon={FileText} color="#f59e0b" />
          <StatCard label="Interviews" value={stats.totalInterviews} icon={BarChart3} color="#ec4899" />
          <StatCard label="Posts" value={stats.totalPosts} icon={MessageSquare} color="#8b5cf6" />
          <StatCard label="Replies" value={stats.totalReplies} icon={MessageSquare} color="#14b8a6" />

          {stats.subscriptionBreakdown && (
            <div className="admin-stats-card wide">
              <h3>Subscription Tiers</h3>
              <div className="tier-bars">
                {stats.subscriptionBreakdown.map(t => (
                  <div key={t.subscription_tier} className="tier-bar-row">
                    <span className="tier-label">{t.subscription_tier || 'free'}</span>
                    <div className="tier-bar-track">
                      <div
                        className="tier-bar-fill"
                        style={{ width: `${Math.min((t.count / stats.totalUsers) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="tier-count">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ USERS TAB ═══ */}
      {activeTab === 'users' && !loading && (
        <div className="admin-users-section">
          <div className="admin-toolbar">
            <div className="admin-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
              />
            </div>
            <select
              value={userRoleFilter}
              onChange={e => { setUserRoleFilter(e.target.value); setUserPage(1); }}
              className="admin-select"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button className="admin-btn-icon" onClick={fetchUsers} title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Tier</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="admin-user-cell">
                      <div className="admin-avatar">{(u.full_name || u.email || '?')[0].toUpperCase()}</div>
                      <span>{u.full_name || '—'}</span>
                    </td>
                    <td>{u.email || '—'}</td>
                    <td>
                      <span className={`admin-role-badge ${u.role}`}>
                        {u.role === 'admin' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                        {u.role}
                      </span>
                    </td>
                    <td><span className="admin-tier-badge">{u.subscription_tier || 'free'}</span></td>
                    <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                    <td className="admin-actions-cell">
                      {u.role === 'user' ? (
                        <button
                          className="admin-btn-sm promote"
                          onClick={() => handleRoleChange(u.id, 'admin')}
                          title="Promote to Admin"
                        >
                          <ShieldCheck size={14} /> Promote
                        </button>
                      ) : (
                        <button
                          className="admin-btn-sm demote"
                          onClick={() => handleRoleChange(u.id, 'user')}
                          title="Demote to User"
                        >
                          <UserX size={14} /> Demote
                        </button>
                      )}
                      <button
                        className="admin-btn-sm delete"
                        onClick={() => handleDeleteUser(u.id, u.email)}
                        title="Delete User"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="admin-empty">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalUserPages > 1 && (
            <Pagination current={userPage} total={totalUserPages} onChange={setUserPage} />
          )}
        </div>
      )}

      {/* ═══ CONTENT TAB ═══ */}
      {activeTab === 'content' && !loading && (
        <div className="admin-content-section">
          <div className="admin-toolbar">
            <select
              value={contentType}
              onChange={e => { setContentType(e.target.value); setContentPage(1); }}
              className="admin-select"
            >
              <option value="posts">Posts</option>
              <option value="replies">Replies</option>
            </select>
            <button className="admin-btn-icon" onClick={fetchContent} title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="admin-content-list">
            {content.map(item => (
              <div key={item.id} className="admin-content-card">
                <div className="admin-content-header">
                  <span className="admin-content-author">
                    {item.profiles?.full_name || 'Unknown'}
                  </span>
                  <span className="admin-content-date">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
                {item.title && <h4 className="admin-content-title">{item.title}</h4>}
                <p className="admin-content-body">
                  {(item.content || item.body || '').slice(0, 200)}
                  {(item.content || item.body || '').length > 200 ? '...' : ''}
                </p>
                <div className="admin-content-footer">
                  {item.category && <span className="admin-content-tag">{item.category}</span>}
                  <button
                    className="admin-btn-sm delete"
                    onClick={() => handleDeleteContent(contentType, item.id)}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
            {content.length === 0 && (
              <div className="admin-empty-state">
                <MessageSquare size={32} />
                <p>No {contentType} found</p>
              </div>
            )}
          </div>

          {totalContentPages > 1 && (
            <Pagination current={contentPage} total={totalContentPages} onChange={setContentPage} />
          )}
        </div>
      )}

      {/* ═══ JOBS TAB ═══ */}
      {activeTab === 'jobs' && !loading && (
        <div className="admin-jobs-section">
          <div className="admin-toolbar">
            <div className="admin-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search jobs..."
                value={jobSearch}
                onChange={e => { setJobSearch(e.target.value); setJobPage(1); }}
              />
            </div>
            <button className="admin-btn-primary" onClick={openCreateJob}>
              <Plus size={16} /> Add Job
            </button>
            <button className="admin-btn-icon" onClick={fetchJobs} title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Company</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id} className={!job.is_active ? 'inactive-row' : ''}>
                    <td className="admin-job-title-cell">
                      <span className="admin-job-title">{job.title}</span>
                      {job.apply_link && (
                        <a href={job.apply_link} target="_blank" rel="noopener noreferrer" className="admin-job-link">
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </td>
                    <td>{job.company || '—'}</td>
                    <td><span className="admin-content-tag">{job.category}</span></td>
                    <td><span className="admin-tier-badge">{job.type || job.job_type}</span></td>
                    <td>
                      <button
                        className={`admin-btn-sm ${job.is_active ? 'promote' : 'demote'}`}
                        onClick={() => handleToggleJob(job.id)}
                        title={job.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {job.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        {job.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>{job.deadline ? new Date(job.deadline).toLocaleDateString() : '—'}</td>
                    <td className="admin-actions-cell">
                      <button className="admin-btn-sm promote" onClick={() => openEditJob(job)} title="Edit">
                        <Edit3 size={14} />
                      </button>
                      <button
                        className="admin-btn-sm delete"
                        onClick={() => handleDeleteJob(job.id, job.title)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {jobs.length === 0 && (
                  <tr><td colSpan={7} className="admin-empty">No jobs found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalJobPages > 1 && (
            <Pagination current={jobPage} total={totalJobPages} onChange={setJobPage} />
          )}
        </div>
      )}

      {/* ═══ JOB MODAL ═══ */}
      {showJobModal && (
        <div className="admin-modal-overlay" onClick={() => setShowJobModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingJob ? 'Edit Job' : 'Create Job'}</h2>
              <button className="admin-modal-close" onClick={() => setShowJobModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleJobSubmit} className="admin-job-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text" required value={jobForm.title}
                    onChange={e => setJobForm({...jobForm, title: e.target.value})}
                    placeholder="e.g. Software Engineer"
                  />
                </div>
                <div className="form-group">
                  <label>Company *</label>
                  <input
                    type="text" required value={jobForm.company}
                    onChange={e => setJobForm({...jobForm, company: e.target.value})}
                    placeholder="e.g. TCS"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select value={jobForm.category} onChange={e => setJobForm({...jobForm, category: e.target.value})}>
                    <option value="fresher">Fresher</option>
                    <option value="off-campus">Off-Campus</option>
                    <option value="internship">Internship</option>
                    <option value="campus-drive">Campus Drive</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Job Type</label>
                  <select value={jobForm.job_type} onChange={e => setJobForm({...jobForm, job_type: e.target.value})}>
                    <option value="full-time">Full-Time</option>
                    <option value="part-time">Part-Time</option>
                    <option value="internship">Internship</option>
                    <option value="contract">Contract</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text" value={jobForm.location}
                    onChange={e => setJobForm({...jobForm, location: e.target.value})}
                    placeholder="e.g. Bangalore, India"
                  />
                </div>
                <div className="form-group">
                  <label>Salary Range</label>
                  <input
                    type="text" value={jobForm.salary_range}
                    onChange={e => setJobForm({...jobForm, salary_range: e.target.value})}
                    placeholder="e.g. ₹3-6 LPA"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3} value={jobForm.description}
                  onChange={e => setJobForm({...jobForm, description: e.target.value})}
                  placeholder="Brief job description..."
                />
              </div>
              <div className="form-group">
                <label>{FORM_LABELS.requirements}</label>
                <input
                  type="text" value={jobForm.requirements}
                  onChange={e => setJobForm({...jobForm, requirements: e.target.value})}
                  placeholder="e.g. React, Node.js, SQL"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Apply Link *</label>
                  <input
                    type="url" required value={jobForm.apply_link}
                    onChange={e => setJobForm({...jobForm, apply_link: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
                <div className="form-group">
                  <label>Deadline</label>
                  <input
                    type="date" value={jobForm.deadline}
                    onChange={e => setJobForm({...jobForm, deadline: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text" value={jobForm.tags}
                  onChange={e => setJobForm({...jobForm, tags: e.target.value})}
                  placeholder="e.g. freshers, remote, startup"
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox" checked={jobForm.is_active}
                    onChange={e => setJobForm({...jobForm, is_active: e.target.checked})}
                  />
                  Active (visible to users)
                </label>
              </div>
              <div className="form-actions">
                <button type="button" className="admin-btn-cancel" onClick={() => setShowJobModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn-primary">
                  {editingJob ? 'Update Job' : 'Create Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ QUESTION SETS TAB ═══ */}
      {activeTab === 'question-sets' && !loading && (
        <div className="admin-qsets-section">
          <div className="admin-toolbar">
            <div className="admin-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search question sets by title or type..."
                value={questionSetSearch}
                onChange={e => { setQuestionSetSearch(e.target.value); setQuestionSetPage(1); }}
              />
            </div>
            <button className="admin-btn-primary" onClick={openCreateSet}>
              <Plus size={16} /> Create Question Set
            </button>
            <button className="admin-btn-icon" onClick={fetchQuestionSets} title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type & Role</th>
                  <th>Questions</th>
                  <th>Access</th>
                  <th>Status</th>
                  <th>Share Link</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questionSets.map(qs => {
                  const qCount = Array.isArray(qs.questions) ? qs.questions.length : 0;
                  const shareUrl = `${window.location.origin}/app?token=${qs.share_code}`;
                  const isCopied = copiedCode === qs.share_code;

                  return (
                    <tr key={qs.id}>
                      <td>
                        <div style={{ fontWeight: '700', color: '#fff', fontSize: '14px', marginBottom: '2px' }}>
                          {qs.title}
                        </div>
                        {qs.description && (
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {qs.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          <span className={`admin-badge admin-badge-${qs.interview_type || 'technical'}`} style={{ textTransform: 'capitalize', fontSize: '11px', padding: '2px 8px', borderRadius: '6px' }}>
                            {qs.interview_type || 'Technical'}
                          </span>
                          {qs.settings?.roleName && (
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                              {qs.settings.roleName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ color: '#818cf8', fontWeight: '700' }}>{qCount} Qs</span>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
                          {qs.difficulty || 'medium'}
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleRequiresLogin(qs)}
                          style={{
                            background: qs.requires_login ? 'rgba(99,102,241,0.15)' : 'rgba(34,197,94,0.15)',
                            color: qs.requires_login ? '#a5b4fc' : '#86efac',
                            border: qs.requires_login ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(34,197,94,0.3)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'inline-block',
                          }}
                          title="Click to toggle candidate login requirement"
                        >
                          {qs.requires_login ? 'Login Req.' : 'Link Only'}
                        </button>
                        {qs.has_allowlist && <span style={{ display: 'block', width: 'fit-content', marginTop: '4px', fontSize: '10px', color: '#6ee7b7' }}>Email Allowlist</span>}
                        {qs.has_passcode && <span style={{ display: 'block', width: 'fit-content', marginTop: '4px', fontSize: '10px', color: '#c4b5fd' }}>Passcode</span>}
                        {qs.expires_at && <span style={{ display: 'block', marginTop: '4px', fontSize: '10px', color: new Date(qs.expires_at) <= new Date() ? '#fca5a5' : 'rgba(255,255,255,.45)' }}>Expires {new Date(qs.expires_at).toLocaleDateString()}</span>}
                        {Number.isInteger(qs.max_attempts) && <span style={{ display: 'block', marginTop: '4px', fontSize: '10px', color: 'rgba(255,255,255,.45)' }}>{qs.attempts_started || 0}/{qs.max_attempts} attempts used</span>}
                      </td>
                      <td>
                        <button
                          className={`admin-status-toggle ${qs.is_active ? 'active' : 'inactive'}`}
                          onClick={() => handleToggleSetActive(qs)}
                          title="Click to toggle status"
                        >
                          {qs.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          <span>{qs.is_active ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            className="admin-btn-sm"
                            onClick={() => handleCopyShareLink(qs.share_code)}
                            style={{ background: isCopied ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)', color: isCopied ? '#86efac' : '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)', padding: '4px 8px', gap: '4px', display: 'flex', alignItems: 'center' }}
                            title={`Copy candidate invite link: ${shareUrl}`}
                          >
                            {isCopied ? <Check size={13} /> : <Copy size={13} />}
                            <span style={{ fontSize: '11px', fontWeight: '600' }}>
                              {isCopied ? 'Copied!' : (qs.share_code?.length > 12 ? `${qs.share_code.slice(0, 8)}...` : qs.share_code)}
                            </span>
                          </button>
                          <a
                            href={shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-btn-icon"
                            title="Open candidate lobby in new tab"
                            style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      </td>
                      <td className="admin-actions-cell">
                        <button
                          className="admin-btn-sm"
                          style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '4px 8px', gap: '4px', display: 'flex', alignItems: 'center' }}
                          onClick={() => setPreviewModalSet(qs)}
                          title="Preview interview sequence"
                        >
                          <Eye size={13} />
                          <span style={{ fontSize: '11px' }}>Preview</span>
                        </button>
                        <button
                          className="admin-btn-sm"
                          style={{ background: 'rgba(129, 140, 248, 0.1)', color: '#a5b4fc', border: '1px solid rgba(129, 140, 248, 0.25)', padding: '4px 8px', gap: '4px', display: 'flex', alignItems: 'center' }}
                          onClick={() => handleViewSubmissions(qs)}
                          title="View candidate submissions"
                        >
                          <BarChart3 size={13} />
                          <span style={{ fontSize: '11px' }}>Results</span>
                        </button>
                        <button className="admin-btn-sm promote" onClick={() => openEditSet(qs)} title="Edit Question Set">
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="admin-btn-sm delete"
                          onClick={() => handleDeleteQuestionSet(qs.id)}
                          title="Delete Question Set"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {questionSets.length === 0 && (
                  <tr>
                    <td colSpan={7} className="admin-empty">
                      No question sets found. Click "Create Question Set" to add one!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalQuestionSetPages > 1 && (
            <Pagination current={questionSetPage} total={totalQuestionSetPages} onChange={setQuestionSetPage} />
          )}
        </div>
      )}

      {/* ═══ CREATE / EDIT QUESTION SET MODAL ═══ */}
      {showSetModal && (
        <div className="admin-modal-overlay" onClick={() => setShowSetModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '780px', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingSet ? 'Edit Question Set' : 'Create Custom Question Set'}</h2>
              <button className="admin-modal-close" onClick={() => setShowSetModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveQuestionSet} className="admin-job-form" style={{ padding: '20px 24px 24px' }}>
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Title *</label>
                  <input
                    type="text"
                    required
                    value={setForm.title}
                    onChange={e => setSetForm({ ...setForm, title: e.target.value })}
                    placeholder="e.g. Senior Frontend React Assessment"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Interview Type</label>
                  <select
                    value={setForm.interviewType}
                    onChange={e => setSetForm({ ...setForm, interviewType: e.target.value })}
                  >
                    <option value="technical">Technical</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="system-design">System Design</option>
                    <option value="coding">Coding / DSA</option>
                    <option value="hr">HR</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description / Candidate Overview</label>
                <textarea
                  rows={2}
                  value={setForm.description}
                  onChange={e => setSetForm({ ...setForm, description: e.target.value })}
                  placeholder="Short description displayed on the interview lobby..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Target Company (optional)</label>
                  <input
                    type="text"
                    value={setForm.companyName}
                    onChange={e => setSetForm({ ...setForm, companyName: e.target.value })}
                    placeholder="e.g. Google, Amazon, PrepLoop"
                  />
                </div>
                <div className="form-group">
                  <label>Target Role (optional)</label>
                  <input
                    type="text"
                    value={setForm.roleName}
                    onChange={e => setSetForm({ ...setForm, roleName: e.target.value })}
                    placeholder="e.g. Full Stack Developer"
                  />
                </div>
                <div className="form-group">
                  <label>Difficulty</label>
                  <select
                    value={setForm.difficulty}
                    onChange={e => setSetForm({ ...setForm, difficulty: e.target.value })}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="form-row" style={{ alignItems: 'center' }}>
                <div className="form-group checkbox-group" style={{ margin: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={setForm.requiresLogin}
                      onChange={e => setSetForm({ ...setForm, requiresLogin: e.target.checked })}
                    />
                    <span>Require candidate sign-in (otherwise anyone with this unlisted link can join)</span>
                  </label>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>{editingSet?.has_passcode ? 'Change passcode (optional)' : 'Passcode (optional)'}</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={4}
                    maxLength={64}
                    value={setForm.passcode}
                    onChange={e => setSetForm({ ...setForm, passcode: e.target.value, clearPasscode: false })}
                    placeholder={editingSet?.has_passcode ? 'Leave blank to keep current passcode' : '4–64 characters'}
                  />
                  {editingSet?.has_passcode && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '8px', fontSize: '12px' }}>
                      <input type="checkbox" checked={setForm.clearPasscode} onChange={e => setSetForm({ ...setForm, clearPasscode: e.target.checked, passcode: '' })} />
                      Remove existing passcode
                    </label>
                  )}
                </div>
                <div className="form-group">
                  <label>Link expiry (optional)</label>
                  <input
                    type="datetime-local"
                    value={setForm.expiresAt}
                    onChange={e => setSetForm({ ...setForm, expiresAt: e.target.value })}
                  />
                  <span style={{ color: 'rgba(255,255,255,.45)', fontSize: '11px' }}>The link stops accepting new interview attempts after this time.</span>
                </div>
                <div className="form-group">
                  <label>Maximum attempts (optional)</label>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    step="1"
                    value={setForm.maxAttempts}
                    onChange={e => setSetForm({ ...setForm, maxAttempts: e.target.value })}
                    placeholder="Unlimited"
                  />
                  <span style={{ color: 'rgba(255,255,255,.45)', fontSize: '11px' }}>Limits how many interview sessions can be started.</span>
                </div>
              </div>

              <div className="form-group">
                <label>Invitee Email Allowlist (optional, comma-separated)</label>
                <input
                  type="text"
                  value={setForm.allowedEmails}
                  onChange={e => setSetForm({ ...setForm, allowedEmails: e.target.value })}
                  placeholder="e.g. candidate1@company.com, candidate2@company.com"
                />
                <span style={{ color: 'rgba(255,255,255,.45)', fontSize: '11px' }}>
                  Restricts access strictly to these email addresses. Leave blank for unlisted open access.
                </span>
              </div>

              <div className="form-group">
                <label>Custom Instructions for Candidate (shown in lobby)</label>
                <input
                  type="text"
                  value={setForm.customInstructions}
                  onChange={e => setSetForm({ ...setForm, customInstructions: e.target.value })}
                  placeholder="e.g. Please speak clearly and outline trade-offs for each architectural choice."
                />
              </div>

              {/* ─── Questions Builder ─── */}
              <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>
                      Questions ({setForm.questions.length})
                    </h3>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                      Candidates will be asked these exact questions sequentially.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="admin-btn-sm"
                      onClick={() => setShowBulkUpload(!showBulkUpload)}
                      style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <UploadCloud size={14} />
                      {showBulkUpload ? 'Hide Bulk Import' : 'Bulk Import (CSV/JSON)'}
                    </button>
                    <button
                      type="button"
                      className="admin-btn-sm"
                      onClick={() => setShowSetPreview(value => !value)}
                      style={{ background: 'rgba(59,130,246,0.12)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Eye size={14} /> {showSetPreview ? 'Hide Preview' : 'Preview Interview'}
                    </button>
                    <button
                      type="button"
                      className="admin-btn-sm"
                      onClick={handleAddQuestion}
                      style={{ background: 'rgba(34,197,94,0.12)', color: '#86efac', border: '1px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Plus size={14} /> Add Question
                    </button>
                  </div>
                </div>

                {/* Bulk upload area */}
                {showBulkUpload && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(99,102,241,0.4)', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileUp size={15} /> Upload CSV or JSON
                      </span>
                      <input
                        type="file"
                        accept=".csv,.json,.txt"
                        onChange={handleFileUpload}
                        style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}
                      />
                    </div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '0 0 10px' }}>
                      Paste CSV format: <code>question, context, expected_topics, time_limit</code> or standard JSON array.
                    </p>
                    <textarea
                      rows={3}
                      value={bulkCsvText}
                      onChange={e => setBulkCsvText(e.target.value)}
                      placeholder={`What is virtualization?, Cloud computing context, VMs containers hardware, 60\nHow does Docker handle networking?, Docker network drivers, bridge host overlay, 90`}
                      style={{ width: '100%', fontSize: '12px', fontFamily: 'monospace' }}
                    />
                    {bulkError && (
                      <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '6px' }}>
                        {bulkError}
                      </div>
                    )}
                    <button
                      type="button"
                      className="admin-btn-primary"
                      onClick={() => handleParseBulkUpload(bulkCsvText)}
                      style={{ marginTop: '8px', padding: '6px 14px', fontSize: '12px' }}
                    >
                      Parse & Append Questions
                    </button>
                  </div>
                )}

                {/* Question items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
                  {setForm.questions.map((q, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '10px',
                        padding: '14px',
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#818cf8', background: 'rgba(129,140,248,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                          Question #{idx + 1}
                        </span>
                        {setForm.questions.length > 1 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <button type="button" onClick={() => moveQuestion(idx, -1)} disabled={idx === 0} aria-label={`Move question ${idx + 1} up`} title="Move question up" style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.35 : 0.8 }}>
                              <ChevronUp size={15} />
                            </button>
                            <button type="button" onClick={() => moveQuestion(idx, 1)} disabled={idx === setForm.questions.length - 1} aria-label={`Move question ${idx + 1} down`} title="Move question down" style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: idx === setForm.questions.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === setForm.questions.length - 1 ? 0.35 : 0.8 }}>
                              <ChevronDown size={15} />
                            </button>
                            <button type="button" onClick={() => handleRemoveQuestion(idx)} aria-label={`Remove question ${idx + 1}`} title="Remove question" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="form-group" style={{ marginBottom: '8px' }}>
                        <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Question Text *</label>
                        <textarea
                          rows={2}
                          required
                          value={q.question}
                          onChange={e => handleQuestionChange(idx, 'question', e.target.value)}
                          placeholder="e.g. Explain how event loops work in Node.js."
                        />
                      </div>

                      <div className="form-row" style={{ marginBottom: 0 }}>
                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                          <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Context / Hint (optional)</label>
                          <input
                            type="text"
                            value={q.context}
                            onChange={e => handleQuestionChange(idx, 'context', e.target.value)}
                            placeholder="e.g. Mention libuv, timers, microtask queue"
                          />
                        </div>
                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                          <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Expected Topics</label>
                          <input
                            type="text"
                            value={q.expectedTopics}
                            onChange={e => handleQuestionChange(idx, 'expectedTopics', e.target.value)}
                            placeholder="e.g. Call stack, Macro tasks, Promises"
                          />
                        </div>
                        <div className="form-group" style={{ width: '100px', marginBottom: 0 }}>
                          <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Time (s)</label>
                          <input
                            type="number"
                            min="15"
                            max="300"
                            value={q.timeLimit}
                            onChange={e => handleQuestionChange(idx, 'timeLimit', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {showSetPreview && (
                  <section aria-label="Interview preview" style={{ marginTop: '16px', padding: '16px', border: '1px solid rgba(129,140,248,0.3)', borderRadius: '12px', background: 'rgba(99,102,241,0.06)' }}>
                    <h4 style={{ color: '#fff', margin: '0 0 4px', fontSize: '14px' }}>{setForm.title || 'Untitled interview'} · Candidate preview</h4>
                    <p style={{ color: 'rgba(255,255,255,0.56)', fontSize: '12px', margin: '0 0 12px' }}>
                      {setForm.description || 'This is the fixed question order candidates will receive.'}
                    </p>
                    <ol style={{ margin: 0, paddingLeft: '22px', display: 'grid', gap: '10px' }}>
                      {setForm.questions.filter(q => q.question.trim()).map((q, idx) => (
                        <li key={`${idx}-${q.question}`} style={{ color: '#e4e4e7', paddingLeft: '4px' }}>
                          <div style={{ fontWeight: 650 }}>{q.question}</div>
                          {q.context?.trim() && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '3px' }}>Context: {q.context}</div>}
                          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', marginTop: '3px' }}>{Number(q.timeLimit) || 60} seconds</div>
                        </li>
                      ))}
                    </ol>
                    {setForm.questions.every(q => !q.question.trim()) && <span style={{ color: '#fca5a5', fontSize: '12px' }}>Add a question to preview the interview.</span>}
                  </section>
                )}
              </div>

              <div className="admin-modal-actions" style={{ marginTop: '24px' }}>
                <button type="button" className="admin-btn-secondary" onClick={() => setShowSetModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingSet ? 'Update Question Set' : 'Create Question Set')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ QUESTION SET PREVIEW MODAL ═══ */}
      {previewModalSet && (
        <div className="admin-modal-overlay" onClick={() => setPreviewModalSet(null)}>
          <div className="admin-modal" style={{ maxWidth: '820px', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#818cf8', fontWeight: 700 }}>
                    Interview Preview
                  </span>
                  <span className={`admin-badge admin-badge-${previewModalSet.interview_type || 'technical'}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                    {previewModalSet.interview_type || 'Technical'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
                    • {previewModalSet.difficulty || 'medium'}
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>{previewModalSet.title}</h2>
                {previewModalSet.settings?.roleName && (
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#93c5fd' }}>
                    Target Role: <strong>{previewModalSet.settings.roleName}</strong>
                    {previewModalSet.settings.companyName ? ` at ${previewModalSet.settings.companyName}` : ''}
                  </p>
                )}
              </div>
              <button className="admin-modal-close" onClick={() => setPreviewModalSet(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: 'calc(90vh - 160px)' }}>
              {/* Interview Metadata Card */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                padding: '14px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                marginBottom: '20px'
              }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block' }}>Access Mode</span>
                  <strong style={{ fontSize: '13px', color: previewModalSet.requires_login ? '#c4b5fd' : '#86efac' }}>
                    {previewModalSet.requires_login ? 'Candidate Login Required' : 'Direct Link Only (Unlisted)'}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block' }}>Voice Orchestrator</span>
                  <strong style={{ fontSize: '13px', color: '#67e8f9' }}>NVIDIA VoiceChat (Nemotron)</strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block' }}>Candidate Token</span>
                  <code style={{ fontSize: '12px', color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '2px 6px', borderRadius: '4px', wordBreak: 'break-all' }}>
                    {previewModalSet.share_code}
                  </code>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block' }}>Total Fixed Questions</span>
                  <strong style={{ fontSize: '13px', color: '#fff' }}>
                    {Array.isArray(previewModalSet.questions) ? previewModalSet.questions.length : 0} Questions
                  </strong>
                </div>
              </div>

              {previewModalSet.settings?.customInstructions && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'rgba(99,102,241,0.07)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#a5b4fc', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Interviewer Instructions
                  </div>
                  <div style={{ fontSize: '13px', color: '#e0e7ff', lineHeight: 1.5 }}>
                    {previewModalSet.settings.customInstructions}
                  </div>
                </div>
              )}

              {/* Ordered Question Sequence */}
              <div>
                <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.6)', margin: '0 0 12px' }}>
                  Fixed Question Sequence (App Enforced)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Array.isArray(previewModalSet.questions) && previewModalSet.questions.map((q, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '14px 16px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#818cf8' }}>
                          Question {idx + 1} of {previewModalSet.questions.length}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
                          <Clock size={12} />
                          <span>{q.timeLimit || 60}s time limit</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '8px', lineHeight: 1.4 }}>
                        {q.question}
                      </div>
                      {q.context && (
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', marginBottom: '6px' }}>
                          <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Context:</strong> {q.context}
                        </div>
                      )}
                      {q.expectedTopics && (
                        <div style={{ fontSize: '11px', color: '#93c5fd' }}>
                          <strong style={{ color: '#bfdbfe' }}>Expected Topics:</strong> {q.expectedTopics}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="admin-modal-actions" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '16px 24px' }}>
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => {
                  handleCopyShareLink(previewModalSet.share_code);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Copy size={14} />
                <span>Copy Candidate Link</span>
              </button>
              <a
                href={`${window.location.origin}/app?token=${previewModalSet.share_code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              >
                <ExternalLink size={14} />
                <span>Open Candidate Lobby</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SUBMISSIONS / RESULTS MODAL ═══ */}
      {showSubmissionsModal && (
        <div className="admin-modal-overlay" onClick={() => setShowSubmissionsModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '840px', maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2>Submissions: {activeSetForSubmissions?.title}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                    Candidates who completed this fixed-question voice interview
                  </p>
                  {activeSetForSubmissions && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={async () => {
                          await handleToggleSetActive(activeSetForSubmissions);
                          setActiveSetForSubmissions(prev => ({ ...prev, is_active: !prev.is_active }));
                        }}
                        style={{
                          background: activeSetForSubmissions.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                          color: activeSetForSubmissions.is_active ? '#86efac' : '#fca5a5',
                          border: 'none',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        title="Toggle interview active status"
                      >
                        {activeSetForSubmissions.is_active ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await handleToggleRequiresLogin(activeSetForSubmissions);
                          setActiveSetForSubmissions(prev => ({ ...prev, requires_login: !prev.requires_login }));
                        }}
                        style={{
                          background: activeSetForSubmissions.requires_login ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.15)',
                          color: activeSetForSubmissions.requires_login ? '#a5b4fc' : '#6ee7b7',
                          border: 'none',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        title="Toggle require login / link-only"
                      >
                        {activeSetForSubmissions.requires_login ? 'Login Req.' : 'Link-Only'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <button className="admin-modal-close" onClick={() => setShowSubmissionsModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px 24px 24px' }}>
              {submissionsLoading ? (
                <div className="admin-loading" style={{ padding: '40px 0' }}>
                  <Loader2 size={24} className="spin" />
                  <span>Loading candidate responses...</span>
                </div>
              ) : submissionsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.4)' }}>
                  <p style={{ fontSize: '14px', margin: 0 }}>No candidates have submitted this interview yet.</p>
                  <p style={{ fontSize: '12px', margin: '4px 0 0', color: 'rgba(255,255,255,0.3)' }}>
                    Candidate Token: <code>{activeSetForSubmissions?.share_code}</code>
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {submissionsList.map(sub => {
                    const isExpanded = expandedSubmissionId === sub.id;
                    const score = sub.overall_score || 0;
                    const scoreColor = score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

                    return (
                      <div
                        key={sub.id}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '12px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            padding: '14px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                          }}
                          onClick={() => setExpandedSubmissionId(isExpanded ? null : sub.id)}
                        >
                          <div>
                            <div style={{ fontWeight: '700', color: '#fff', fontSize: '14px' }}>
                              {sub.user_name || sub.user_email || 'Candidate (Guest)'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                              {sub.user_email || 'Direct link session'} · {new Date(sub.completed_at || sub.created_at).toLocaleString()}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '15px', fontWeight: '800', color: scoreColor }}>
                                {score} / 100
                              </div>
                              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                                {Math.round((sub.duration || 0) / 60)} mins elapsed
                              </div>
                            </div>
                            <button
                              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
                            >
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                          </div>
                        </div>

                        {/* Expanded conversation */}
                        {isExpanded && (
                          <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.15)' }}>
                            <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', margin: '14px 0 10px' }}>
                              Interview Transcript & Answers ({Array.isArray(sub.responses) ? sub.responses.length : 0} turns)
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                              {Array.isArray(sub.responses) && sub.responses.map((turn, tIdx) => (
                                <div
                                  key={tIdx}
                                  style={{
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    lineHeight: '1.5',
                                    background: turn.role === 'candidate' ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)',
                                    borderLeft: turn.role === 'candidate' ? '3px solid #6366f1' : '3px solid rgba(255,255,255,0.2)',
                                  }}
                                >
                                  <div style={{ fontSize: '11px', fontWeight: '700', color: turn.role === 'candidate' ? '#a5b4fc' : '#94a3b8', marginBottom: '3px', textTransform: 'capitalize' }}>
                                    {turn.role === 'candidate' ? (sub.user_name || 'Candidate') : 'AI Interviewer'}
                                    {turn.question_index !== undefined && (
                                      <span style={{ marginLeft: '6px', opacity: 0.7, fontWeight: 500 }}>
                                        (Question {turn.question_index + 1})
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ color: '#fff', whiteSpace: 'pre-wrap' }}>
                                    {turn.content || turn.text || '—'}
                                  </div>
                                </div>
                              ))}
                              {(!Array.isArray(sub.responses) || sub.responses.length === 0) && (
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                                  No transcript recorded for this session.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ───
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="admin-stats-card">
      <div className="admin-stats-icon" style={{ background: `${color}22`, color }}>
        <Icon size={20} />
      </div>
      <div className="admin-stats-info">
        <span className="admin-stats-value">{value ?? '—'}</span>
        <span className="admin-stats-label">{label}</span>
      </div>
    </div>
  );
}

// ─── Pagination ───
function Pagination({ current, total, onChange }) {
  return (
    <div className="admin-pagination">
      <button
        className="admin-page-btn"
        disabled={current <= 1}
        onClick={() => onChange(current - 1)}
      >
        <ChevronLeft size={16} />
      </button>
      <span className="admin-page-info">
        Page {current} of {total}
      </span>
      <button
        className="admin-page-btn"
        disabled={current >= total}
        onClick={() => onChange(current + 1)}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
