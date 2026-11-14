import { useState, useEffect, useCallback, useMemo } from 'react';
import './AdminDashboard.css';
import { authFetch } from '../utils/authFetch';
import { buildApiUrl } from '../utils/safeApiUrl';
import { QUESTION_SET_TEMPLATES } from '../data/questionSetTemplates.js';
import CandidateReviewDossier from '../components/interview/CandidateReviewDossier.jsx';

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
  Eye, Clock, HelpCircle, Sparkles, Share2, Download, Printer, CheckCircle2, XCircle,
  Mail, Send, Camera
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

  // Submissions & Live Roster modal state
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [submissionsModalTab, setSubmissionsModalTab] = useState('submissions');
  const [activeSetForSubmissions, setActiveSetForSubmissions] = useState(null);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [attemptsList, setAttemptsList] = useState([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState(null);
  const [printingSubmission, setPrintingSubmission] = useState(null);
  const [viewingDossier, setViewingDossier] = useState(null);
  const [submissionDecisionFilter, setSubmissionDecisionFilter] = useState('all');
  const [editingReviewNotes, setEditingReviewNotes] = useState({});
  const [savingReviewId, setSavingReviewId] = useState(null);

  // Personalized candidate invites modal
  const [showPersonalizedInvitesModal, setShowPersonalizedInvitesModal] = useState(false);
  const [activeSetForInvites, setActiveSetForInvites] = useState(null);
  const [copiedIndividualLink, setCopiedIndividualLink] = useState(null);
  const [dispatchingInvites, setDispatchingInvites] = useState(false);
  const [dispatchResults, setDispatchResults] = useState(null);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testWebhookResult, setTestWebhookResult] = useState(null);
  const [quickInviteInput, setQuickInviteInput] = useState('');
  const [addingInvites, setAddingInvites] = useState(false);

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
    scheduledAt: '',
    scheduledDurationMinutes: 45,
    passingScore: 70,
    maxAttempts: '',
    allowedEmails: '',
    companyName: '',
    roleName: '',
    customInstructions: '',
    webhookUrl: '',
    webhookSecret: '',
    probingMode: false,
    questions: [
      { question: '', context: '', expectedTopics: '', timeLimit: 60 }
    ],
  };
  const [setForm, setSetForm] = useState(initialSetForm);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkError, setBulkError] = useState('');

  // AI JD Generation Modal state
  const [showAiGenModal, setShowAiGenModal] = useState(false);
  const [aiJdText, setAiJdText] = useState('');
  const [aiRoleTitle, setAiRoleTitle] = useState('');
  const [aiInterviewType, setAiInterviewType] = useState('technical');
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGenError, setAiGenError] = useState('');

  const LIMIT = 15;

  const clearMessages = () => { setError(''); setSuccess(''); };

  // ─── Fetch Stats ───
  const fetchStats = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const res = await adminApi.get(buildAdminApiUrl('/admin/stats'));
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, [buildAdminApiUrl]);

  // ─── Fetch Users ───
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const res = await adminApi.get(buildAdminApiUrl('/admin/users'), {
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
  }, [buildAdminApiUrl, userPage, userSearch, userRoleFilter]);

  // ─── Fetch Content ───
  const fetchContent = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const res = await adminApi.get(buildAdminApiUrl('/admin/content'), {
        params: { type: contentType, page: contentPage, limit: LIMIT }
      });
      setContent(res.data.items);
      setContentTotal(res.data.total);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [buildAdminApiUrl, contentType, contentPage]);

  // ─── Fetch Jobs ───
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const res = await adminApi.get(buildAdminApiUrl('/jobs'), {
        params: { page: jobPage, limit: LIMIT, search: jobSearch || undefined, include_inactive: true, source: 'admin' }
      });
      setJobs(res.data.jobs || []);
      setJobTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [buildAdminApiUrl, jobPage, jobSearch]);

  // ─── Fetch Question Sets ───
  const fetchQuestionSets = useCallback(async () => {
    setLoading(true);
    clearMessages();
    try {
      const res = await adminApi.get(buildAdminApiUrl('/admin/question-sets'), {
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
  }, [buildAdminApiUrl, questionSetPage, questionSetSearch]);

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
      await adminApi.delete(buildAdminApiUrl(`/admin/users/${userId}`));
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
      await adminApi.delete(buildAdminApiUrl(`/admin/content/${type}/${id}`));
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
        await adminApi.put(buildAdminApiUrl(`/jobs/${editingJob.id}`), payload);
        setSuccess('Job updated successfully');
      } else {
        await adminApi.post(buildAdminApiUrl('/jobs'), payload);
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
      await adminApi.patch(buildAdminApiUrl(`/jobs/${jobId}/toggle`));
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
      await adminApi.delete(buildAdminApiUrl(`/jobs/${jobId}`));
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
      scheduledAt: (qs.scheduled_at || qs.settings?.scheduledAt) ? new Date(qs.scheduled_at || qs.settings?.scheduledAt).toISOString().slice(0, 16) : '',
      scheduledDurationMinutes: qs.scheduled_duration_minutes || qs.settings?.scheduledDurationMinutes || 45,
      maxAttempts: qs.max_attempts ?? '',
      allowedEmails: allowlistStr,
      companyName: qs.settings?.companyName || '',
      roleName: qs.settings?.roleName || qs.roleName || '',
      customInstructions: qs.settings?.customInstructions || '',
      passingScore: qs.settings?.passingScore ?? 70,
      webhookUrl: qs.settings?.webhookUrl || '',
      webhookSecret: qs.settings?.webhookSecret || '',
      probingMode: Boolean(qs.settings?.probingMode),
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

  const handleDuplicateSet = (qs) => {
    setEditingSet(null);
    const questionsArr = Array.isArray(qs.questions) ? qs.questions.map(q => ({
      question: q.question || '',
      context: q.context || '',
      expectedTopics: Array.isArray(q.expectedTopics) ? q.expectedTopics.join(', ') : (q.expectedTopics || ''),
      timeLimit: q.timeLimit || 60,
    })) : [{ question: '', context: '', expectedTopics: '', timeLimit: 60 }];

    const allowlist = Array.isArray(qs.allowed_emails) ? qs.allowed_emails : (qs.settings?.allowedEmails || []);
    const allowlistStr = allowlist.join('\n');

    setSetForm({
      title: `${qs.title} (Copy)`,
      description: qs.description || '',
      interviewType: qs.interview_type || 'technical',
      difficulty: qs.difficulty || 'medium',
      requiresLogin: qs.requires_login !== false,
      passcode: '',
      clearPasscode: false,
      hasPasscode: false,
      expiresAt: qs.expires_at ? new Date(qs.expires_at).toISOString().slice(0, 16) : '',
      scheduledAt: (qs.scheduled_at || qs.settings?.scheduledAt) ? new Date(qs.scheduled_at || qs.settings?.scheduledAt).toISOString().slice(0, 16) : '',
      scheduledDurationMinutes: qs.scheduled_duration_minutes || qs.settings?.scheduledDurationMinutes || 45,
      maxAttempts: qs.max_attempts ?? '',
      allowedEmails: allowlistStr,
      companyName: qs.settings?.companyName || '',
      roleName: qs.settings?.roleName || qs.roleName || '',
      customInstructions: qs.settings?.customInstructions || '',
      passingScore: qs.settings?.passingScore ?? 70,
      webhookUrl: qs.settings?.webhookUrl || '',
      webhookSecret: qs.settings?.webhookSecret || '',
      probingMode: Boolean(qs.settings?.probingMode),
      questions: questionsArr.length > 0 ? questionsArr : [{ question: '', context: '', expectedTopics: '', timeLimit: 60 }],
    });
    setShowBulkUpload(false);
    setBulkCsvText('');
    setBulkError('');
    setShowSetPreview(false);
    setShowSetModal(true);
    setSuccess(`Cloned "${qs.title}" into a new draft. Review and click Save.`);
  };

  const handleDownloadAdminIcs = (qs) => {
    if (!qs) return;
    const scheduledAt = qs.scheduled_at || qs.settings?.scheduledAt;
    if (!scheduledAt) return;
    const durationMinutes = Number(qs.scheduled_duration_minutes || qs.settings?.scheduledDurationMinutes) || 45;
    const shareCode = qs.share_code || qs.id;
    const joinUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://preploop.com'}/ai-interview?token=${shareCode}`;
    const startDate = new Date(scheduledAt);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
    const formatUtc = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const cleanTitle = String(qs.title || 'Technical Interview').replace(/[\r\n]+/g, ' ');
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PrepLoop Inc.//Interview Platform//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:interview-${shareCode}@preploop.me`,
      `DTSTAMP:${formatUtc(new Date())}`,
      `DTSTART:${formatUtc(startDate)}`,
      `DTEND:${formatUtc(endDate)}`,
      `SUMMARY:${cleanTitle} - PrepLoop Assessment`,
      `DESCRIPTION:Scheduled candidate assessment.\\n\\nJoin URL: ${joinUrl}`,
      `URL:${joinUrl}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-invite.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  // ─── 1-Click Load Template Handler ───
  const handleLoadTemplate = (templateId) => {
    if (!templateId) return;
    const template = QUESTION_SET_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const hasQuestions = setForm.questions.some(q => q.question && q.question.trim());
    if (hasQuestions) {
      const confirmReplace = window.confirm(
        `Load preset "${template.title}"? This will populate the form with ${template.questions.length} curated questions.`
      );
      if (!confirmReplace) return;
    }

    setSetForm(prev => ({
      ...prev,
      title: prev.title.trim() ? prev.title : template.title,
      description: prev.description.trim() ? prev.description : template.description,
      interviewType: template.interviewType || prev.interviewType,
      difficulty: template.difficulty || prev.difficulty,
      roleName: template.roleName || prev.roleName,
      customInstructions: template.customInstructions || prev.customInstructions,
      probingMode: template.probingMode ?? prev.probingMode,
      passingScore: template.passingScore ?? prev.passingScore,
      questions: template.questions.map(q => ({
        question: q.question,
        context: q.context || '',
        expectedTopics: Array.isArray(q.expectedTopics) ? q.expectedTopics.join(', ') : (q.expectedTopics || ''),
        timeLimit: q.timeLimit || 90,
      })),
    }));

    setSuccess(`Loaded "${template.title}" preset (${template.questions.length} questions).`);
  };

  // ─── AI Question Generation from Job Description ───
  const openAiGenModal = () => {
    setAiJdText('');
    setAiRoleTitle(setForm.roleName || '');
    setAiInterviewType(setForm.interviewType || 'technical');
    setAiDifficulty(setForm.difficulty || 'medium');
    setAiQuestionCount(5);
    setAiGenError('');
    setShowAiGenModal(true);
  };

  const handleGenerateFromJd = async (e) => {
    e?.preventDefault();
    if (!aiJdText.trim()) {
      setAiGenError('Please paste a job description');
      return;
    }

    setAiGenerating(true);
    setAiGenError('');

    try {
      const res = await adminApi.post(buildAdminApiUrl('/admin/question-sets/generate-from-jd'), {
        jobDescription: aiJdText.trim(),
        roleName: aiRoleTitle.trim() || undefined,
        interviewType: aiInterviewType,
        difficulty: aiDifficulty,
        questionCount: Number(aiQuestionCount) || 5,
      });

      const data = res.data;
      if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('No questions could be generated from the provided job description');
      }

      const formattedQuestions = data.questions.map(q => ({
        question: q.question || '',
        context: q.context || '',
        expectedTopics: Array.isArray(q.expectedTopics) ? q.expectedTopics.join(', ') : (q.expectedTopics || ''),
        timeLimit: Number(q.timeLimit) || 120,
      }));

      setEditingSet(null);
      setSetForm({
        ...initialSetForm,
        title: data.suggestedTitle || (aiRoleTitle ? `${aiRoleTitle} Assessment` : 'Role Assessment'),
        description: `Tailored interview assessment generated from job description for ${data.roleName || aiRoleTitle || 'Candidate'}.`,
        interviewType: data.interviewType || aiInterviewType,
        difficulty: data.difficulty || aiDifficulty,
        roleName: data.roleName || aiRoleTitle || '',
        probingMode: true,
        questions: formattedQuestions,
      });

      setShowAiGenModal(false);
      setShowSetModal(true);
      setSuccess(`Generated ${formattedQuestions.length} tailored questions from Job Description! Review and customize below.`);
    } catch (err) {
      console.error('AI question generation error:', err);
      setAiGenError(err.response?.data?.error || err.message || 'Failed to generate questions from JD');
    } finally {
      setAiGenerating(false);
    }
  };

  // ─── CSV / JSON Bulk Upload Validation & Parsing ───
  const validateAndParseCsvQuestions = useCallback((rawText) => {
    if (!rawText || !rawText.trim()) {
      return { rows: [], stats: { total: 0, valid: 0, warningsCount: 0, totalSeconds: 0, estimatedDuration: '0s' } };
    }

    let rawItems = [];
    const text = rawText.trim();

    // Try parsing as JSON array
    if (text.startsWith('[') || text.startsWith('{')) {
      try {
        const parsed = JSON.parse(text);
        const arr = Array.isArray(parsed) ? parsed : (parsed.questions || []);
        rawItems = arr.map(item => ({
          question: typeof item === 'string' ? item : (item.question || item.text || ''),
          context: item.context || '',
          expectedTopics: Array.isArray(item.expectedTopics) ? item.expectedTopics.join(', ') : (item.expectedTopics || item.topics || ''),
          timeLimit: Number(item.timeLimit || item.time_limit || 60),
        }));
      } catch {
        // Fallback to CSV parsing below
      }
    }

    // Parse CSV lines
    if (rawItems.length === 0) {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        const firstLine = lines[0].toLowerCase();
        const hasHeader = firstLine.includes('question') || firstLine.includes('topic');
        const dataLines = hasHeader ? lines.slice(1) : lines;

        rawItems = dataLines.map(line => {
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
        });
      }
    }

    let warningsCount = 0;
    let totalSeconds = 0;

    const rows = rawItems.map((item, idx) => {
      const warnings = [];
      const qText = (item.question || '').trim();
      const isValid = Boolean(qText);

      if (!qText) {
        warnings.push('Question text missing');
      } else if (qText.length < 15) {
        warnings.push('Brief question (<15 chars)');
      }

      const topics = (item.expectedTopics || '').trim();
      if (!topics) {
        warnings.push('Missing expected topics');
      }

      const tLimit = Number(item.timeLimit) || 60;
      if (tLimit < 30) {
        warnings.push('Time limit <30s');
      } else if (tLimit > 300) {
        warnings.push('Time limit >5 min');
      }

      if (isValid) {
        warningsCount += warnings.length;
        totalSeconds += tLimit;
      }

      return {
        index: idx + 1,
        question: qText,
        context: (item.context || '').trim(),
        expectedTopics: topics,
        timeLimit: tLimit,
        warnings,
        isValid,
      };
    });

    const validRows = rows.filter(r => r.isValid);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const estimatedDuration = minutes > 0
      ? (seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes} min`)
      : `${seconds}s`;

    return {
      rows,
      stats: {
        total: rows.length,
        valid: validRows.length,
        warningsCount,
        totalSeconds,
        estimatedDuration,
      }
    };
  }, []);

  const csvPreview = useMemo(() => {
    return validateAndParseCsvQuestions(bulkCsvText);
  }, [bulkCsvText, validateAndParseCsvQuestions]);

  const handleApplyBulkAppend = () => {
    setBulkError('');
    const validRows = csvPreview.rows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setBulkError('No valid questions found to append');
      return;
    }

    const newQuestions = validRows.map(r => ({
      question: r.question,
      context: r.context,
      expectedTopics: r.expectedTopics,
      timeLimit: r.timeLimit,
    }));

    setSetForm(prev => ({
      ...prev,
      questions: [
        ...prev.questions.filter(q => q.question && q.question.trim()),
        ...newQuestions
      ]
    }));

    setSuccess(`Appended ${validRows.length} questions from upload.`);
    setShowBulkUpload(false);
    setBulkCsvText('');
  };

  const handleApplyBulkReplace = () => {
    setBulkError('');
    const validRows = csvPreview.rows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setBulkError('No valid questions found to import');
      return;
    }

    const newQuestions = validRows.map(r => ({
      question: r.question,
      context: r.context,
      expectedTopics: r.expectedTopics,
      timeLimit: r.timeLimit,
    }));

    setSetForm(prev => ({
      ...prev,
      questions: newQuestions
    }));

    setSuccess(`Replaced question list with ${validRows.length} imported questions.`);
    setShowBulkUpload(false);
    setBulkCsvText('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      setBulkCsvText(text || '');
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
      scheduledAt: setForm.scheduledAt ? new Date(setForm.scheduledAt).toISOString() : null,
      scheduledDurationMinutes: Number(setForm.scheduledDurationMinutes) || 45,
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
        scheduledAt: setForm.scheduledAt ? new Date(setForm.scheduledAt).toISOString() : null,
        scheduledDurationMinutes: Number(setForm.scheduledDurationMinutes) || 45,
        passingScore: Number(setForm.passingScore) || 70,
        webhookUrl: setForm.webhookUrl?.trim() || '',
        webhookSecret: setForm.webhookSecret?.trim() || '',
        probingMode: Boolean(setForm.probingMode),
      }
    };

    setLoading(true);
    try {
      if (editingSet) {
        await adminApi.put(buildAdminApiUrl(`/admin/question-sets/${editingSet.id}`), payload);
        setSuccess('Question set updated successfully');
      } else {
        const res = await adminApi.post(buildAdminApiUrl('/admin/question-sets'), payload);
        const token = res.data.token || res.data.questionSet.share_code;
        setSuccess(`Question set created! Candidate join link: ${window.location.origin}/ai-interview?token=${token}`);
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
      await adminApi.put(buildAdminApiUrl(`/admin/question-sets/${qs.id}`), { isActive: !qs.is_active });
      setQuestionSets(prev => prev.map(s => s.id === qs.id ? { ...s, is_active: !s.is_active } : s));
      setSuccess(`Question set ${qs.is_active ? 'deactivated' : 'activated'}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleToggleRequiresLogin = async (qs) => {
    try {
      await adminApi.put(buildAdminApiUrl(`/admin/question-sets/${qs.id}`), { requiresLogin: !qs.requires_login });
      setQuestionSets(prev => prev.map(s => s.id === qs.id ? { ...s, requires_login: !s.requires_login } : s));
      setSuccess(`Updated "${qs.title}": ${qs.requires_login ? 'Now accessible via direct link without login' : 'Now requires candidate login'}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update access requirement');
    }
  };

  const handleDeleteQuestionSet = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question set? This will also remove associated submissions.')) return;
    try {
      await adminApi.delete(buildAdminApiUrl(`/admin/question-sets/${id}`));
      setSuccess('Question set deleted successfully');
      fetchQuestionSets();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete question set');
    }
  };

  const handleDispatchEmailInvites = async () => {
    if (!activeSetForInvites) return;
    setDispatchingInvites(true);
    setDispatchResults(null);
    clearMessages();
    try {
      const res = await adminApi.post(buildAdminApiUrl(`/admin/question-sets/${activeSetForInvites.id}/dispatch-invites`), {
        emails: activeSetForInvites.allowed_emails,
        customMessage: `Please join your scheduled technical interview for "${activeSetForInvites.title}".`,
      });
      setDispatchResults(res.data);
      if (res.data.candidateInvites) {
        const updatedSettings = {
          ...(activeSetForInvites.settings || {}),
          candidateInvites: res.data.candidateInvites,
        };
        const updatedSet = {
          ...activeSetForInvites,
          settings: updatedSettings,
        };
        setActiveSetForInvites(updatedSet);
        setQuestionSets(prev => prev.map(qs => qs.id === updatedSet.id ? { ...qs, ...updatedSet } : qs));
      }
      if (res.data.isSimulated) {
        setSuccess(`Generated invitation previews for ${res.data.total} candidates (email service running in simulation mode).`);
      } else {
        setSuccess(`Successfully sent ${res.data.sent} candidate invitation emails!`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to dispatch candidate invitations');
    } finally {
      setDispatchingInvites(false);
    }
  };

  const handleCsvInvitesUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeSetForInvites) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result;
        if (typeof text !== 'string') return;
        const matchedEmails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
        const cleanEmails = [...new Set(matchedEmails.map(m => m.trim().toLowerCase()))];
        if (cleanEmails.length === 0) {
          setError('No valid email addresses found in uploaded file');
          return;
        }

        const currentList = Array.isArray(activeSetForInvites.allowed_emails)
          ? activeSetForInvites.allowed_emails
          : [];
        const combined = [...new Set([...currentList, ...cleanEmails])];

        setAddingInvites(true);
        await adminApi.put(buildAdminApiUrl(`/admin/question-sets/${activeSetForInvites.id}`), {
          allowedEmails: combined,
        });

        const updatedSet = {
          ...activeSetForInvites,
          allowed_emails: combined,
          has_allowlist: combined.length > 0,
        };
        setActiveSetForInvites(updatedSet);
        setQuestionSets(prev => prev.map(qs => qs.id === updatedSet.id ? { ...qs, ...updatedSet } : qs));
        setSuccess(`Successfully imported ${cleanEmails.length} candidate email(s) from CSV`);
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to import CSV candidates');
      } finally {
        setAddingInvites(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleGenerateSingleUseLinks = async () => {
    if (!activeSetForInvites || !Array.isArray(activeSetForInvites.allowed_emails) || activeSetForInvites.allowed_emails.length === 0) {
      setError('Please add candidate emails to the allowlist first');
      return;
    }
    setAddingInvites(true);
    try {
      const existingInvites = { ...(activeSetForInvites.settings?.candidateInvites || {}) };
      const updatedInvites = { ...existingInvites };

      for (const email of activeSetForInvites.allowed_emails) {
        const lowerEmail = email.toLowerCase();
        const hasExisting = Object.keys(updatedInvites).find(t => updatedInvites[t]?.email?.toLowerCase() === lowerEmail);
        if (!hasExisting) {
          const randomPart = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
          const token = `inv_${randomPart}`;
          updatedInvites[token] = {
            email: lowerEmail,
            status: 'pending',
            createdAt: new Date().toISOString(),
          };
        }
      }

      const updatedSettings = {
        ...(activeSetForInvites.settings || {}),
        candidateInvites: updatedInvites,
      };

      await adminApi.put(buildAdminApiUrl(`/admin/question-sets/${activeSetForInvites.id}`), {
        settings: updatedSettings,
      });

      const updatedSet = {
        ...activeSetForInvites,
        settings: updatedSettings,
      };
      setActiveSetForInvites(updatedSet);
      setQuestionSets(prev => prev.map(qs => qs.id === updatedSet.id ? { ...qs, ...updatedSet } : qs));
      setSuccess(`Generated unique single-use magic links for ${activeSetForInvites.allowed_emails.length} candidate(s)!`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate single-use links');
    } finally {
      setAddingInvites(false);
    }
  };

  const handleQuickAddInvites = async () => {
    if (!activeSetForInvites || !quickInviteInput.trim()) return;
    const newEmails = quickInviteInput
      .split(/[\n,; ]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e && e.includes('@'));

    if (newEmails.length === 0) {
      setError('Please enter at least one valid candidate email address');
      return;
    }

    const currentList = Array.isArray(activeSetForInvites.allowed_emails)
      ? activeSetForInvites.allowed_emails
      : [];
    const combined = [...new Set([...currentList, ...newEmails])];

    setAddingInvites(true);
    try {
      await adminApi.put(buildAdminApiUrl(`/admin/question-sets/${activeSetForInvites.id}`), {
        allowedEmails: combined,
      });

      const updatedSet = {
        ...activeSetForInvites,
        allowed_emails: combined,
        has_allowlist: combined.length > 0,
      };
      setActiveSetForInvites(updatedSet);
      setQuestionSets(prev => prev.map(qs => qs.id === updatedSet.id ? { ...qs, ...updatedSet } : qs));
      setQuickInviteInput('');
      setSuccess(`Added ${newEmails.length} candidate email(s) successfully`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update candidate invite list');
    } finally {
      setAddingInvites(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!setForm.webhookUrl) {
      setError('Please provide a Webhook URL to test');
      return;
    }
    setTestingWebhook(true);
    setTestWebhookResult(null);
    clearMessages();
    try {
      const endpoint = editingSet
        ? `/admin/question-sets/${editingSet.id}/test-webhook`
        : `/admin/question-sets/test-webhook`;
      const res = await adminApi.post(buildAdminApiUrl(endpoint), {
        webhookUrl: setForm.webhookUrl.trim(),
        webhookSecret: setForm.webhookSecret?.trim() || '',
      });
      setTestWebhookResult(res.data);
      if (res.data.success) {
        setSuccess(`Webhook test succeeded! (HTTP ${res.data.status}, ${res.data.latencyMs}ms)`);
      } else {
        setError(`Webhook ping failed: ${res.data.error || 'Endpoint responded with error'}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to test webhook');
    } finally {
      setTestingWebhook(false);
    }
  };

  const [copiedInviteCode, setCopiedInviteCode] = useState(null);

  const handleCopyShareLink = (code) => {
    const link = `${window.location.origin}/ai-interview?token=${code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    });
  };

  const handleCopyFullInvite = (qs) => {
    const link = `${window.location.origin}/ai-interview?token=${qs.share_code}`;
    const scheduleStr = (qs.scheduled_at || qs.settings?.scheduledAt)
      ? `${new Date(qs.scheduled_at || qs.settings?.scheduledAt).toLocaleString()} (${qs.scheduled_duration_minutes || qs.settings?.scheduledDurationMinutes || 45} minutes)`
      : 'Flexible / On-demand';
    const roleStr = qs.settings?.roleName || qs.roleName || 'Candidate Assessment';
    const companyStr = qs.settings?.companyName || 'PrepLoop';
    const qCount = Array.isArray(qs.questions) ? qs.questions.length : 0;

    const inviteText = [
      `You're invited to an interview with ${companyStr}!`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Session: ${qs.title}`,
      `Role: ${roleStr}`,
      `Format: ${qs.interview_type || 'Technical'} (${qCount} fixed questions)`,
      `Schedule: ${scheduleStr}`,
      `Direct Join Link: ${link}`,
      qs.has_passcode ? `(A passcode is required to enter this session)` : '',
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Please ensure you join from a quiet location with a working microphone and camera.`,
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(inviteText).then(() => {
      setCopiedInviteCode(qs.share_code);
      setSuccess('Candidate invitation template copied to clipboard!');
      setTimeout(() => setCopiedInviteCode(null), 3000);
    });
  };

  const handleExportSubmissionsCsv = () => {
    if (!submissionsList || submissionsList.length === 0) return;
    const headers = ['Candidate Name', 'Email', 'Overall Score', 'Duration (Seconds)', 'Completed At', 'Question Count', 'Integrity Rating', 'Tab Switches'];
    const rows = submissionsList.map(sub => [
      `"${(sub.user_name || 'Guest Candidate').replace(/"/g, '""')}"`,
      `"${(sub.user_email || '').replace(/"/g, '""')}"`,
      sub.overall_score ?? 0,
      sub.duration ?? 0,
      `"${sub.completed_at || sub.created_at || ''}"`,
      Array.isArray(sub.responses) ? sub.responses.length : 0,
      `"${sub.scores?.integrity?.integrityRating || 'clean'}"`,
      sub.scores?.integrity?.tabSwitchCount ?? 0,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${(activeSetForSubmissions?.title || 'interview').replace(/[^a-z0-9]/gi, '_')}_submissions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintReport = (sub) => {
    setPrintingSubmission(sub);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const handleViewSubmissions = async (qs) => {
    setActiveSetForSubmissions(qs);
    setShowSubmissionsModal(true);
    setSubmissionsModalTab('submissions');
    setSubmissionsLoading(true);
    setExpandedSubmissionId(null);
    try {
      const [subsRes, attsRes] = await Promise.all([
        adminApi.get(buildAdminApiUrl(`/admin/question-sets/${qs.id}/submissions`)),
        adminApi.get(buildAdminApiUrl(`/admin/question-sets/${qs.id}/attempts`)).catch(() => ({ data: { attempts: [] } })),
      ]);
      setSubmissionsList(subsRes.data.submissions || []);
      setAttemptsList(attsRes.data?.attempts || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load submissions');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleRefreshAttempts = async (qsId) => {
    setAttemptsLoading(true);
    try {
      const res = await adminApi.get(buildAdminApiUrl(`/admin/question-sets/${qsId}/attempts`));
      setAttemptsList(res.data?.attempts || []);
    } catch (err) {
      console.error('Failed to refresh attempts:', err);
    } finally {
      setAttemptsLoading(false);
    }
  };

  const handleSaveSubmissionReview = async (subId, notes, decision) => {
    setSavingReviewId(subId);
    try {
      const res = await adminApi.patch(buildAdminApiUrl(`/admin/submissions/${subId}/review`), {
        reviewerNotes: notes,
        reviewerDecision: decision,
      });
      setSubmissionsList(prev => prev.map(s => {
        if (s.id === subId) {
          return {
            ...s,
            scores: res.data.submission?.scores || s.scores,
          };
        }
        return s;
      }));
      setSuccess('Candidate review updated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update candidate review');
    } finally {
      setSavingReviewId(null);
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
            <button
              className="admin-btn-secondary"
              onClick={openAiGenModal}
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.2) 100%)',
                borderColor: 'rgba(168,85,247,0.4)',
                color: '#e9d5ff',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={16} /> Generate with AI
            </button>
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
                  const shareUrl = `${window.location.origin}/ai-interview?token=${qs.share_code}`;
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
                        {(qs.scheduled_at || qs.settings?.scheduledAt) && (
                          <span style={{ display: 'block', width: 'fit-content', marginTop: '4px', fontSize: '10px', color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                            🗓️ {new Date(qs.scheduled_at || qs.settings?.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} ({qs.scheduled_duration_minutes || qs.settings?.scheduledDurationMinutes || 45}m)
                          </span>
                        )}
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
                          <button
                            className="admin-btn-sm"
                            onClick={() => handleCopyFullInvite(qs)}
                            style={{ background: copiedInviteCode === qs.share_code ? 'rgba(34,197,94,0.15)' : 'rgba(56,189,248,0.12)', color: copiedInviteCode === qs.share_code ? '#86efac' : '#38bdf8', border: '1px solid rgba(56,189,248,0.25)', padding: '4px 8px', gap: '4px', display: 'flex', alignItems: 'center' }}
                            title="Copy formatted email/Slack invitation template with full schedule details"
                          >
                            {copiedInviteCode === qs.share_code ? <Check size={13} /> : <Share2 size={13} />}
                            <span style={{ fontSize: '11px' }}>Invite</span>
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
                        <button
                          className="admin-btn-sm"
                          style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '4px 8px', gap: '4px', display: 'flex', alignItems: 'center' }}
                          onClick={() => {
                            setActiveSetForInvites(qs);
                            setShowPersonalizedInvitesModal(true);
                          }}
                          title="Generate candidate personalized invite links"
                        >
                          <Share2 size={13} />
                          <span style={{ fontSize: '11px' }}>Invites</span>
                        </button>
                        {(qs.scheduled_at || qs.settings?.scheduledAt) && (
                          <button
                            className="admin-btn-sm"
                            style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '4px 8px', gap: '4px', display: 'flex', alignItems: 'center' }}
                            onClick={() => handleDownloadAdminIcs(qs)}
                            title="Download .ICS Calendar Invitation"
                          >
                            <Download size={13} />
                            <span style={{ fontSize: '11px' }}>.ICS</span>
                          </button>
                        )}
                        <button
                          className="admin-btn-sm"
                          style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#cbd5e1', border: '1px solid rgba(255, 255, 255, 0.15)', padding: '4px 8px', gap: '4px', display: 'flex', alignItems: 'center' }}
                          onClick={() => handleDuplicateSet(qs)}
                          title="Duplicate / Clone Question Set"
                        >
                          <Copy size={13} />
                          <span style={{ fontSize: '11px' }}>Clone</span>
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
              {/* 1-Click Load Template Presets */}
              <div style={{
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.22)',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#c7d2fe', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ⚡ 1-Click Templates:
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                    Industry-standard presets
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {QUESTION_SET_TEMPLATES.map(tpl => (
                    <button
                      key={tpl.id}
                      type="button"
                      className="admin-btn-sm"
                      onClick={() => handleLoadTemplate(tpl.id)}
                      style={{
                        fontSize: '11px',
                        padding: '5px 11px',
                        background: 'rgba(255,255,255,0.07)',
                        color: '#e0e7ff',
                        border: '1px solid rgba(255,255,255,0.18)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title={`Load ${tpl.title} (${tpl.questions.length} questions)`}
                    >
                      {tpl.id === 'frontend-react' && '⚛️ React Frontend'}
                      {tpl.id === 'backend-nodejs' && '🟢 Node.js Backend'}
                      {tpl.id === 'system-design' && '📐 System Design'}
                      {tpl.id === 'behavioral-star' && '🤝 Behavioral STAR'}
                    </button>
                  ))}
                </div>
              </div>

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

              {/* Fixed Schedule & Session Window */}
              <div className="form-row" style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '10px', padding: '12px 14px', margin: '8px 0 16px', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1.5, margin: 0 }}>
                  <label style={{ color: '#38bdf8', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🗓️ Fixed Schedule Time (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={setForm.scheduledAt}
                    onChange={e => setSetForm({ ...setForm, scheduledAt: e.target.value })}
                  />
                  <span style={{ color: 'rgba(255,255,255,.5)', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                    Locks interview until this scheduled time. Candidates see a waiting room countdown until unlocked.
                  </span>
                </div>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label style={{ color: '#38bdf8', fontWeight: '700', fontSize: '13px' }}>
                    Fixed Session Duration
                  </label>
                  <select
                    value={setForm.scheduledDurationMinutes}
                    onChange={e => setSetForm({ ...setForm, scheduledDurationMinutes: Number(e.target.value) || 45 })}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes (Standard)</option>
                    <option value="60">60 minutes (1 hour)</option>
                    <option value="90">90 minutes</option>
                    <option value="120">120 minutes (2 hours)</option>
                  </select>
                  <span style={{ color: 'rgba(255,255,255,.5)', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                    Scheduled interview window length.
                  </span>
                </div>
                <div className="form-group" style={{ width: '140px', margin: 0 }}>
                  <label style={{ color: '#22c55e', fontWeight: '700', fontSize: '13px' }}>
                    Pass Threshold %
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="100"
                    value={setForm.passingScore ?? 70}
                    onChange={e => setSetForm({ ...setForm, passingScore: Math.min(100, Math.max(30, Number(e.target.value) || 70)) })}
                    style={{ width: '100%' }}
                  />
                  <span style={{ color: 'rgba(255,255,255,.5)', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                    Auto-qualify target.
                  </span>
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

              {/* ─── Webhook & Probing Settings ─── */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px', margin: '16px 0' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  ⚡ Integrations & Adaptive Probing
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>Candidate Submission Webhook URL (Slack/Teams/ATS)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="url"
                        value={setForm.webhookUrl}
                        onChange={e => setSetForm({ ...setForm, webhookUrl: e.target.value })}
                        placeholder="https://hooks.slack.com/services/... or https://api.yourats.com/webhook"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        onClick={handleTestWebhook}
                        disabled={testingWebhook || !setForm.webhookUrl}
                        style={{ whiteSpace: 'nowrap', padding: '6px 14px', fontSize: '12px' }}
                      >
                        {testingWebhook ? <Loader2 size={13} className="spin" /> : <Send size={13} />}
                        {testingWebhook ? ' Testing...' : ' Test Ping'}
                      </button>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,.45)', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                      Receives JSON payload with candidate score, integrity rating, decision, and breakdown upon completion.
                    </span>
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Webhook Secret Key (optional)</label>
                    <input
                      type="password"
                      value={setForm.webhookSecret}
                      onChange={e => setSetForm({ ...setForm, webhookSecret: e.target.value })}
                      placeholder="HMAC-SHA256 Secret"
                    />
                    <span style={{ color: 'rgba(255,255,255,.45)', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                      Passed in X-PrepLoop-Signature header.
                    </span>
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', cursor: 'pointer', padding: '8px 12px', background: setForm.probingMode ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.02)', borderRadius: '8px', border: setForm.probingMode ? '1px solid rgba(56,189,248,0.25)' : '1px solid rgba(255,255,255,0.06)' }}>
                  <input
                    type="checkbox"
                    checked={setForm.probingMode}
                    onChange={e => setSetForm({ ...setForm, probingMode: e.target.checked })}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: setForm.probingMode ? '#38bdf8' : '#e2e8f0' }}>
                      🧠 Adaptive AI Probing Mode
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                      When enabled, if the candidate gives a brief answer or misses expected topics, the AI interviewer dynamically asks 1 sharp follow-up question on that topic before advancing.
                    </div>
                  </div>
                </label>
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
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="admin-btn-sm"
                      onClick={openAiGenModal}
                      style={{ background: 'rgba(168,85,247,0.14)', color: '#d8b4fe', border: '1px solid rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Sparkles size={14} /> AI from JD
                    </button>
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

                {/* Bulk upload area with inline preview table validator */}
                {showBulkUpload && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(99,102,241,0.4)', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileUp size={15} /> Upload CSV or JSON Questions
                      </span>
                      <input
                        type="file"
                        accept=".csv,.json,.txt"
                        onChange={handleFileUpload}
                        style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}
                      />
                    </div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '0 0 10px' }}>
                      Format: <code>question, context, expected_topics, time_limit</code> or JSON array. Table validates and estimates duration automatically.
                    </p>
                    <textarea
                      rows={3}
                      value={bulkCsvText}
                      onChange={e => setBulkCsvText(e.target.value)}
                      placeholder={`What is virtualization?, Cloud computing context, VMs containers hardware, 60\nHow does Docker handle networking?, Docker network drivers, bridge host overlay, 90`}
                      style={{ width: '100%', fontSize: '12px', fontFamily: 'monospace', marginBottom: '10px' }}
                    />
                    {bulkError && (
                      <div style={{ color: '#fca5a5', fontSize: '12px', marginBottom: '10px' }}>
                        {bulkError}
                      </div>
                    )}

                    {/* Inline Validator Metrics Summary Bar */}
                    {csvPreview.rows.length > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'rgba(15,23,42,0.6)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        marginBottom: '12px',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{ fontSize: '12px', color: '#e2e8f0' }}>
                          <strong>Questions:</strong> <span style={{ color: '#38bdf8' }}>{csvPreview.stats.total} total</span> ({csvPreview.stats.valid} valid)
                        </div>
                        <div style={{ fontSize: '12px', color: '#e2e8f0' }}>
                          <strong>Est. Duration:</strong> <span style={{ color: '#4ade80' }}>⏱️ {csvPreview.stats.estimatedDuration}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#e2e8f0' }}>
                          <strong>Warnings:</strong> {csvPreview.stats.warningsCount > 0 ? (
                            <span style={{ color: '#fbbf24' }}>⚠️ {csvPreview.stats.warningsCount} warning{csvPreview.stats.warningsCount > 1 ? 's' : ''}</span>
                          ) : (
                            <span style={{ color: '#4ade80' }}>✓ 0 warnings (Clean)</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Inline Preview Table */}
                    {csvPreview.rows.length > 0 && (
                      <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                              <th style={{ padding: '6px 8px', width: '32px' }}>#</th>
                              <th style={{ padding: '6px 8px' }}>Question Text</th>
                              <th style={{ padding: '6px 8px' }}>Context / Hint</th>
                              <th style={{ padding: '6px 8px' }}>Expected Topics</th>
                              <th style={{ padding: '6px 8px', width: '60px' }}>Time</th>
                              <th style={{ padding: '6px 8px', width: '140px' }}>Validation Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csvPreview.rows.map(row => (
                              <tr key={row.index} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: row.isValid ? 'transparent' : 'rgba(239,68,68,0.05)' }}>
                                <td style={{ padding: '6px 8px', color: 'rgba(255,255,255,0.5)' }}>{row.index}</td>
                                <td style={{ padding: '6px 8px', color: row.isValid ? '#e2e8f0' : '#f87171', fontWeight: 500, maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {row.question || '<Empty Question>'}
                                </td>
                                <td style={{ padding: '6px 8px', color: 'rgba(255,255,255,0.5)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {row.context || '—'}
                                </td>
                                <td style={{ padding: '6px 8px', color: 'rgba(255,255,255,0.6)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {row.expectedTopics || '—'}
                                </td>
                                <td style={{ padding: '6px 8px', color: '#93c5fd' }}>
                                  {row.timeLimit}s
                                </td>
                                <td style={{ padding: '6px 8px' }}>
                                  {!row.isValid ? (
                                    <span style={{ color: '#ef4444', fontSize: '10px' }}>❌ Missing text</span>
                                  ) : row.warnings.length > 0 ? (
                                    <span style={{ color: '#f59e0b', fontSize: '10px' }} title={row.warnings.join(', ')}>
                                      ⚠️ {row.warnings[0]}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#10b981', fontSize: '10px' }}>✓ Valid</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="admin-btn-primary"
                        onClick={handleApplyBulkAppend}
                        disabled={csvPreview.stats.valid === 0}
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                      >
                        Append {csvPreview.stats.valid > 0 ? `${csvPreview.stats.valid} ` : ''}Questions
                      </button>
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        onClick={handleApplyBulkReplace}
                        disabled={csvPreview.stats.valid === 0}
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                      >
                        Replace All with {csvPreview.stats.valid > 0 ? `${csvPreview.stats.valid} ` : ''}Questions
                      </button>
                      {bulkCsvText && (
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          onClick={() => { setBulkCsvText(''); setBulkError(''); }}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Clear
                        </button>
                      )}
                    </div>
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

      {/* ═══ GENERATE FROM JOB DESCRIPTION (AI) MODAL ═══ */}
      {showAiGenModal && (
        <div className="admin-modal-overlay" onClick={() => !aiGenerating && setShowAiGenModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '680px', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', borderRadius: '8px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} color="#fff" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px' }}>Generate Assessment with AI</h2>
                  <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                    Paste a Job Description to extract competencies and generate tailored questions.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => !aiGenerating && setShowAiGenModal(false)}
                disabled={aiGenerating}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGenerateFromJd} style={{ padding: '20px 24px 24px' }}>
              {aiGenError && (
                <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#fca5a5', fontSize: '13px' }}>
                  {aiGenError}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Job Description *</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Paste requirements or role summary</span>
                </label>
                <textarea
                  rows={6}
                  required
                  value={aiJdText}
                  onChange={e => setAiJdText(e.target.value)}
                  placeholder={`e.g.\nRole: Senior Full Stack Engineer (React + Node)\nResponsibilities:\n- Build scalable frontend microfrontends in React and TypeScript\n- Architect robust REST and GraphQL APIs in Node.js\n- Optimize PostgreSQL queries and Redis caching layer\n- Maintain CI/CD pipelines and Kubernetes workloads\nRequirements:\n- 5+ years experience in React, TypeScript, Node.js\n- Strong understanding of event loops, distributed caching, and ACID transactions`}
                  style={{ width: '100%', fontSize: '12px', fontFamily: 'monospace' }}
                />
              </div>

              <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group" style={{ flex: 1.5, marginBottom: 0 }}>
                  <label>Target Role Title (optional)</label>
                  <input
                    type="text"
                    value={aiRoleTitle}
                    onChange={e => setAiRoleTitle(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer (or auto-infer)"
                  />
                </div>

                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Interview Type</label>
                  <select
                    value={aiInterviewType}
                    onChange={e => setAiInterviewType(e.target.value)}
                  >
                    <option value="technical">Technical</option>
                    <option value="system-design">System Design</option>
                    <option value="behavioral">Behavioral (STAR)</option>
                    <option value="coding">Coding & Algorithms</option>
                  </select>
                </div>
              </div>

              <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Target Difficulty</label>
                  <select
                    value={aiDifficulty}
                    onChange={e => setAiDifficulty(e.target.value)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Question Count</label>
                  <select
                    value={aiQuestionCount}
                    onChange={e => setAiQuestionCount(Number(e.target.value))}
                  >
                    <option value={3}>3 Questions (~6-9 mins)</option>
                    <option value={5}>5 Questions (~10-15 mins)</option>
                    <option value={7}>7 Questions (~15-20 mins)</option>
                    <option value={10}>10 Questions (~20-30 mins)</option>
                  </select>
                </div>
              </div>

              <div className="admin-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setShowAiGenModal(false)}
                  disabled={aiGenerating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary"
                  disabled={aiGenerating || !aiJdText.trim()}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    borderColor: '#818cf8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 18px',
                  }}
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      <span>Analyzing JD & Generating Questions...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Generate Assessment</span>
                    </>
                  )}
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
          <div className="admin-modal" style={{ maxWidth: submissionsModalTab === 'matrix' ? '1120px' : '840px', width: '95%', maxHeight: '88vh', transition: 'max-width 0.2s ease' }} onClick={e => e.stopPropagation()}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="admin-btn-sm"
                  onClick={handleExportSubmissionsCsv}
                  disabled={submissionsList.length === 0}
                  style={{
                    background: 'rgba(34,197,94,0.15)',
                    color: '#86efac',
                    border: '1px solid rgba(34,197,94,0.3)',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '6px',
                    cursor: submissionsList.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: submissionsList.length === 0 ? 0.5 : 1,
                  }}
                  title="Download candidate responses as CSV"
                >
                  <Download size={14} /> Export CSV
                </button>
                <button className="admin-modal-close" onClick={() => setShowSubmissionsModal(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Tabs: Submissions vs Live Roster vs Comparison Matrix */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 24px', background: 'rgba(0,0,0,0.2)', overflowX: 'auto' }}>
              <button
                type="button"
                onClick={() => setSubmissionsModalTab('submissions')}
                style={{
                  padding: '12px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: 'none',
                  border: 'none',
                  borderBottom: submissionsModalTab === 'submissions' ? '2px solid #6366f1' : '2px solid transparent',
                  color: submissionsModalTab === 'submissions' ? '#fff' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Completed Submissions ({submissionsList.length})
              </button>
              <button
                type="button"
                onClick={() => setSubmissionsModalTab('matrix')}
                style={{
                  padding: '12px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: 'none',
                  border: 'none',
                  borderBottom: submissionsModalTab === 'matrix' ? '2px solid #10b981' : '2px solid transparent',
                  color: submissionsModalTab === 'matrix' ? '#fff' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                <BarChart3 size={14} /> Side-by-Side Comparison Matrix ({submissionsList.length})
              </button>
              <button
                type="button"
                onClick={() => setSubmissionsModalTab('roster')}
                style={{
                  padding: '12px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: 'none',
                  border: 'none',
                  borderBottom: submissionsModalTab === 'roster' ? '2px solid #38bdf8' : '2px solid transparent',
                  color: submissionsModalTab === 'roster' ? '#fff' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                Live Candidate Activity
                {attemptsList.filter(a => a.status === 'in_progress').length > 0 && (
                  <span style={{ background: '#22c55e', color: '#fff', fontSize: '10px', padding: '1px 6px', borderRadius: '10px', fontWeight: '800' }}>
                    {attemptsList.filter(a => a.status === 'in_progress').length} active
                  </span>
                )}
              </button>
            </div>

            <div style={{ padding: '20px 24px 24px' }}>
              {submissionsModalTab === 'roster' ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                        <strong>{attemptsList.length}</strong> Total Session{attemptsList.length === 1 ? '' : 's'}
                      </span>
                      <span style={{ fontSize: '13px', color: '#86efac', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
                        {attemptsList.filter(a => a.status === 'in_progress').length} In Progress
                      </span>
                      <span style={{ fontSize: '13px', color: '#93c5fd' }}>
                        {attemptsList.filter(a => a.status === 'submitted' || a.status === 'completed').length} Completed
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRefreshAttempts(activeSetForSubmissions?.id)}
                      disabled={attemptsLoading}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <RefreshCw size={12} className={attemptsLoading ? 'spin' : ''} /> Refresh Live
                    </button>
                  </div>

                  {attemptsLoading ? (
                    <div className="admin-loading" style={{ padding: '40px 0' }}>
                      <Loader2 size={24} className="spin" />
                      <span>Checking active sessions...</span>
                    </div>
                  ) : attemptsList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.4)' }}>
                      <p style={{ fontSize: '14px', margin: 0 }}>No candidate sessions have started yet.</p>
                      <p style={{ fontSize: '12px', margin: '4px 0 0', color: 'rgba(255,255,255,0.3)' }}>
                        Share the join link with candidates to track live progress here.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {attemptsList.map((att) => {
                        const isInProgress = att.status === 'in_progress';
                        const isSubmitted = att.status === 'submitted';
                        const isCompleted = att.status === 'completed';

                        const statusBadgeColor = isInProgress ? '#22c55e' : (isSubmitted || isCompleted) ? '#38bdf8' : '#94a3b8';
                        const statusBadgeBg = isInProgress ? 'rgba(34,197,94,0.12)' : (isSubmitted || isCompleted) ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.05)';
                        const statusBadgeBorder = isInProgress ? 'rgba(34,197,94,0.3)' : (isSubmitted || isCompleted) ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.1)';

                        return (
                          <div
                            key={att.id}
                            style={{
                              background: 'rgba(255,255,255,0.02)',
                              border: isInProgress ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.06)',
                              borderRadius: '10px',
                              padding: '12px 16px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    color: statusBadgeColor,
                                    background: statusBadgeBg,
                                    border: `1px solid ${statusBadgeBorder}`,
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                  }}
                                >
                                  {isInProgress && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></span>}
                                  {att.status.replace('_', ' ')}
                                </span>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                                  Session <code>{att.id.slice(0, 8)}...</code>
                                </span>
                              </div>

                              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>
                                Started {new Date(att.startedAt).toLocaleTimeString()} · Stage: {att.stage || 'Technical'}
                              </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8' }}>
                                Question {att.currentQuestionNumber} of {att.totalQuestions || '—'}
                              </div>
                              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                                {att.answersCount} turn{att.answersCount === 1 ? '' : 's'} recorded
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : submissionsModalTab === 'matrix' ? (
                submissionsLoading ? (
                  <div className="admin-loading" style={{ padding: '40px 0' }}>
                    <Loader2 size={24} className="spin" />
                    <span>Loading candidate responses...</span>
                  </div>
                ) : submissionsList.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.4)' }}>
                    <p style={{ fontSize: '14px', margin: 0 }}>No candidate submissions yet to compare.</p>
                    <p style={{ fontSize: '12px', margin: '4px 0 0', color: 'rgba(255,255,255,0.3)' }}>
                      Share this interview link with candidates. Once they submit, their responses will appear side-by-side.
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                        Comparing <strong>{submissionsList.length}</strong> candidate submissions across <strong>{Array.isArray(activeSetForSubmissions?.questions) ? activeSetForSubmissions.questions.length : 0}</strong> questions
                      </span>
                      <button
                        type="button"
                        className="admin-btn-sm"
                        onClick={handleExportSubmissionsCsv}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(34,197,94,0.12)', color: '#86efac', border: '1px solid rgba(34,197,94,0.3)', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <Download size={13} /> Export Comparison
                      </button>
                    </div>

                    <table style={{ width: '100%', minWidth: `${Math.max(640, submissionsList.length * 280 + 220)}px`, borderCollapse: 'separate', borderSpacing: 0, border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', width: '220px', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', left: 0, background: '#0f172a', zIndex: 2 }}>
                            Evaluation Metric
                          </th>
                          {submissionsList.map((sub) => {
                            const score = sub.overall_score || 0;
                            const scoreColor = score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
                            const decision = sub.scores?.decision || (score >= 70 ? 'qualified' : score >= 55 ? 'review_needed' : 'rejected');

                            return (
                              <th key={sub.id} style={{ padding: '14px 16px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)', borderLeft: '1px solid rgba(255,255,255,0.06)', minWidth: '260px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                  <div style={{ fontWeight: '700', color: '#fff', fontSize: '14px' }}>
                                    {sub.user_name || sub.user_email?.split('@')[0] || 'Candidate'}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handlePrintReport(sub)}
                                    style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', padding: '2px' }}
                                    title="Print candidate assessment report"
                                  >
                                    <Printer size={13} />
                                  </button>
                                </div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                                  {sub.user_email || 'Direct Session'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '13px', fontWeight: '800', color: scoreColor, background: `${scoreColor}18`, padding: '2px 8px', borderRadius: '4px', border: `1px solid ${scoreColor}40` }}>
                                    {score} / 100
                                  </span>
                                  <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', background: decision === 'qualified' ? 'rgba(34,197,94,0.15)' : decision === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: decision === 'qualified' ? '#86efac' : decision === 'rejected' ? '#fca5a5' : '#fcd34d' }}>
                                    {decision.replace('_', ' ')}
                                  </span>
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Proctoring & Integrity Row */}
                        <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                          <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#a5b4fc', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', left: 0, background: '#0f172a', zIndex: 1 }}>
                            🛡️ Proctoring Telemetry
                          </td>
                          {submissionsList.map((sub) => {
                            const integrity = sub.scores?.integrity || {};
                            const tabSwitches = integrity.tabSwitchCount || 0;
                            const pastes = integrity.pasteCount || 0;
                            const isClean = tabSwitches === 0 && pastes === 0;

                            return (
                              <td key={`integrity-${sub.id}`} style={{ padding: '12px 16px', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isClean ? '#86efac' : tabSwitches <= 2 ? '#fcd34d' : '#fca5a5', fontWeight: '600' }}>
                                  <Shield size={13} />
                                  <span>{isClean ? 'Clean Focus' : `${tabSwitches} switches, ${pastes} pastes`}</span>
                                </div>
                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                  Confidence: {integrity.integrityRating ? integrity.integrityRating.toUpperCase() : (isClean ? 'HIGH (100%)' : 'MODERATE')}
                                </div>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Duration & Timestamp Row */}
                        <tr>
                          <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#a5b4fc', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', left: 0, background: '#0f172a', zIndex: 1 }}>
                            ⏱️ Duration & Date
                          </td>
                          {submissionsList.map((sub) => (
                            <td key={`meta-${sub.id}`} style={{ padding: '12px 16px', fontSize: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', borderLeft: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}>
                              <div>{Math.round((sub.duration || 0) / 60)} minutes</div>
                              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                                {new Date(sub.completed_at || sub.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                          ))}
                        </tr>

                        {/* Recruiter Notes Row */}
                        <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                          <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#a5b4fc', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', left: 0, background: '#0f172a', zIndex: 1 }}>
                            📝 Recruiter Notes
                          </td>
                          {submissionsList.map((sub) => (
                            <td key={`notes-${sub.id}`} style={{ padding: '12px 16px', fontSize: '11px', borderBottom: '1px solid rgba(255,255,255,0.06)', borderLeft: '1px solid rgba(255,255,255,0.06)', color: sub.scores?.reviewerNotes ? '#e2e8f0' : 'rgba(255,255,255,0.3)', fontStyle: sub.scores?.reviewerNotes ? 'normal' : 'italic' }}>
                              {sub.scores?.reviewerNotes || 'No notes added'}
                            </td>
                          ))}
                        </tr>

                        {/* Question Rows */}
                        {Array.isArray(activeSetForSubmissions?.questions) && activeSetForSubmissions.questions.map((qObj, qIdx) => (
                          <tr key={`q-row-${qIdx}`}>
                            <td style={{ padding: '14px 16px', verticalAlign: 'top', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', left: 0, background: '#0f172a', zIndex: 1 }}>
                              <div style={{ fontSize: '11px', fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase', marginBottom: '2px' }}>
                                Question {qIdx + 1}
                              </div>
                              <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff', lineHeight: 1.4, maxWidth: '200px' }}>
                                {qObj.question}
                              </div>
                              {qObj.expectedTopics && (
                                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                                  <strong>Rubric:</strong> {Array.isArray(qObj.expectedTopics) ? qObj.expectedTopics.join(', ') : qObj.expectedTopics}
                                </div>
                              )}
                            </td>
                            {submissionsList.map((sub) => {
                              const breakdownItem = sub.scores?.breakdown?.find(b => b.questionIndex === qIdx + 1);
                              const qScore = breakdownItem?.score;
                              const qScoreColor = typeof qScore === 'number' ? (qScore >= 70 ? '#22c55e' : qScore >= 50 ? '#f59e0b' : '#ef4444') : '#fff';
                              const answerExcerpt = breakdownItem?.answer || sub.responses?.find(r => r.role === 'candidate' && r.question_index === qIdx)?.content || '';

                              return (
                                <td key={`q-${qIdx}-${sub.id}`} style={{ padding: '14px 16px', verticalAlign: 'top', borderBottom: '1px solid rgba(255,255,255,0.06)', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '800', color: qScoreColor }}>
                                      {typeof qScore === 'number' ? `${qScore} / 100` : '—'}
                                    </span>
                                    {breakdownItem?.elapsedSeconds > 0 && (
                                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                                        {breakdownItem.elapsedSeconds}s
                                      </span>
                                    )}
                                  </div>

                                  {/* Topic Pills */}
                                  {breakdownItem && ((breakdownItem.coveredTopics?.length > 0) || (breakdownItem.missedTopics?.length > 0)) && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                                      {breakdownItem.coveredTopics?.map((t, idx) => (
                                        <span key={`m-cov-${idx}`} style={{ fontSize: '10px', color: '#86efac', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', padding: '1px 5px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                          ✓ {t}
                                        </span>
                                      ))}
                                      {breakdownItem.missedTopics?.map((t, idx) => (
                                        <span key={`m-mis-${idx}`} style={{ fontSize: '10px', color: '#fca5a5', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', padding: '1px 5px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                          ✗ {t}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {answerExcerpt ? (
                                    <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4', background: 'rgba(0,0,0,0.25)', padding: '8px', borderRadius: '6px', maxHeight: '110px', overflowY: 'auto', fontStyle: 'italic' }}>
                                      &ldquo;{answerExcerpt}&rdquo;
                                    </div>
                                  ) : (
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No response recorded</div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : submissionsLoading ? (
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
                  {/* Decision Filter Pills */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginRight: '4px' }}>Filter:</span>
                    <button
                      type="button"
                      onClick={() => setSubmissionDecisionFilter('all')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        background: submissionDecisionFilter === 'all' ? '#6366f1' : 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        border: 'none',
                      }}
                    >
                      All ({submissionsList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubmissionDecisionFilter('qualified')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        background: submissionDecisionFilter === 'qualified' ? '#22c55e' : 'rgba(34,197,94,0.1)',
                        color: submissionDecisionFilter === 'qualified' ? '#fff' : '#86efac',
                        border: '1px solid rgba(34,197,94,0.3)',
                      }}
                    >
                      ✓ Qualified ({submissionsList.filter(s => (s.scores?.decision || (s.overall_score >= 70 ? 'qualified' : '')) === 'qualified').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubmissionDecisionFilter('review_needed')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        background: submissionDecisionFilter === 'review_needed' ? '#f59e0b' : 'rgba(245,158,11,0.1)',
                        color: submissionDecisionFilter === 'review_needed' ? '#fff' : '#fcd34d',
                        border: '1px solid rgba(245,158,11,0.3)',
                      }}
                    >
                      Review Needed ({submissionsList.filter(s => (s.scores?.decision || '') === 'review_needed').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubmissionDecisionFilter('rejected')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        background: submissionDecisionFilter === 'rejected' ? '#ef4444' : 'rgba(239,68,68,0.1)',
                        color: submissionDecisionFilter === 'rejected' ? '#fff' : '#fca5a5',
                        border: '1px solid rgba(239,68,68,0.3)',
                      }}
                    >
                      Rejected ({submissionsList.filter(s => (s.scores?.decision || (s.overall_score < 55 ? 'rejected' : '')) === 'rejected').length})
                    </button>
                  </div>

                  {submissionsList
                    .filter(sub => {
                      if (submissionDecisionFilter === 'all') return true;
                      const decision = sub.scores?.decision || (sub.overall_score >= 70 ? 'qualified' : 'review_needed');
                      return decision === submissionDecisionFilter;
                    })
                    .map(sub => {
                    const isExpanded = expandedSubmissionId === sub.id;
                    const score = sub.overall_score || 0;
                    const scoreColor = score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
                    const decision = sub.scores?.decision || (score >= 70 ? 'qualified' : score >= 55 ? 'review_needed' : 'rejected');

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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: '700', color: '#fff', fontSize: '14px' }}>
                                {sub.user_name || sub.user_email || 'Candidate (Guest)'}
                              </span>
                              {decision === 'qualified' && (
                                <span style={{ background: 'rgba(34,197,94,0.15)', color: '#86efac', border: '1px solid rgba(34,197,94,0.3)', padding: '2px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
                                  ✓ Qualified
                                </span>
                              )}
                              {decision === 'review_needed' && (
                                <span style={{ background: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.3)', padding: '2px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
                                  Review Needed
                                </span>
                              )}
                              {decision === 'rejected' && (
                                <span style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', padding: '2px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
                                  Rejected
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
                              {sub.user_email || 'Direct link session'} · {new Date(sub.completed_at || sub.created_at).toLocaleString()}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            {sub.scores?.integrity && (
                              <div>
                                {sub.scores.integrity.tabSwitchCount === 0 && (sub.scores.integrity.pasteCount || 0) === 0 ? (
                                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#22c55e', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Shield size={11} /> Clean Focus (0 switches, 0 pastes)
                                  </span>
                                ) : sub.scores.integrity.integrityRating === 'moderate' ? (
                                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <AlertTriangle size={11} /> {sub.scores.integrity.tabSwitchCount} Switch{sub.scores.integrity.tabSwitchCount === 1 ? '' : 'es'}{sub.scores.integrity.pasteCount > 0 ? `, ${sub.scores.integrity.pasteCount} Paste${sub.scores.integrity.pasteCount === 1 ? '' : 's'}` : ''}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <AlertTriangle size={11} /> Flagged: {sub.scores.integrity.tabSwitchCount} Switch{sub.scores.integrity.tabSwitchCount === 1 ? '' : 'es'}{sub.scores.integrity.pasteCount > 0 ? `, ${sub.scores.integrity.pasteCount} Paste${sub.scores.integrity.pasteCount === 1 ? '' : 's'}` : ''}
                                  </span>
                                )}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingDossier(sub);
                              }}
                              style={{
                                background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.2) 100%)',
                                border: '1px solid rgba(168,85,247,0.4)',
                                color: '#e9d5ff',
                                borderRadius: '8px',
                                padding: '5px 10px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontWeight: '600',
                              }}
                              title="View Executive Summary & Topic Breakdown Dossier"
                            >
                              <Sparkles size={13} /> Dossier
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrintReport(sub);
                              }}
                              style={{
                                background: 'rgba(99,102,241,0.12)',
                                border: '1px solid rgba(99,102,241,0.3)',
                                color: '#a5b4fc',
                                borderRadius: '8px',
                                padding: '5px 10px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontWeight: '600',
                              }}
                              title="Print / Save PDF Evaluation Report"
                            >
                              <Printer size={13} /> Print
                            </button>

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
                            {/* AI 3-Bullet Executive Summary if present */}
                            {sub.scores?.executiveSummary && (
                              <div style={{ marginTop: '16px', marginBottom: '18px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '10px', padding: '14px 16px' }}>
                                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#a5b4fc', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Sparkles size={14} /> AI Executive Summary
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#e2e8f0', lineHeight: '1.5' }}>
                                  <div><strong style={{ color: '#86efac' }}>Key Strengths:</strong> {sub.scores.executiveSummary.keyStrengths || (Array.isArray(sub.scores.executiveSummary.bullets) && sub.scores.executiveSummary.bullets[0]?.replace(/^Key Strengths:\s*/i, ''))}</div>
                                  <div><strong style={{ color: '#fde047' }}>Growth Areas:</strong> {sub.scores.executiveSummary.growthAreas || (Array.isArray(sub.scores.executiveSummary.bullets) && sub.scores.executiveSummary.bullets[1]?.replace(/^Growth Areas:\s*/i, ''))}</div>
                                  <div><strong style={{ color: '#93c5fd' }}>Hiring Recommendation:</strong> {sub.scores.executiveSummary.hiringRecommendation || (Array.isArray(sub.scores.executiveSummary.bullets) && sub.scores.executiveSummary.bullets[2]?.replace(/^Hiring Recommendation:\s*/i, ''))}</div>
                                </div>
                              </div>
                            )}
                            {/* Proctoring Visual Telemetry Snapshots */}
                            {Array.isArray(sub.scores?.integrity?.snapshots) && sub.scores.integrity.snapshots.length > 0 && (
                              <div style={{ marginTop: '16px', marginBottom: '20px' }}>
                                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#a78bfa', letterSpacing: '0.5px', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Camera size={14} /> 📸 Proctoring Visual Telemetry ({sub.scores.integrity.snapshots.length} Checkpoints)
                                </h4>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                  {sub.scores.integrity.snapshots.map((snap, snapIdx) => (
                                    <div key={snapIdx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '6px', textAlign: 'center' }}>
                                      <img
                                        src={snap.thumbnail}
                                        alt={`Proctoring Checkpoint ${snapIdx + 1}`}
                                        style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '4px', display: 'block' }}
                                      />
                                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#38bdf8', marginTop: '4px', textTransform: 'capitalize' }}>
                                        {snap.trigger.replace(/_/g, ' ')}
                                      </div>
                                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>
                                        {new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Question Topic Breakdown */}
                            {Array.isArray(sub.scores?.breakdown) && sub.scores.breakdown.length > 0 && (
                              <div style={{ marginTop: '16px', marginBottom: '20px' }}>
                                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.5px', margin: '0 0 12px' }}>
                                  🎯 Question-by-Question Topic Coverage & Scoring
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  {sub.scores.breakdown.map((q, qIdx) => (
                                    <div
                                      key={qIdx}
                                      style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: '10px',
                                        padding: '12px 14px',
                                      }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                                          Q{q.questionIndex}: {q.question}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                          <span style={{ fontSize: '12px', fontWeight: '800', color: q.score >= 70 ? '#22c55e' : q.score >= 50 ? '#f59e0b' : '#ef4444' }}>
                                            {q.score} / 100
                                          </span>
                                          {q.elapsedSeconds > 0 && (
                                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                                              {q.elapsedSeconds}s
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Expected Topics Pills */}
                                      {((Array.isArray(q.coveredTopics) && q.coveredTopics.length > 0) || (Array.isArray(q.missedTopics) && q.missedTopics.length > 0)) && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                                          {q.coveredTopics?.map((t, idx) => (
                                            <span key={`cov-${idx}`} style={{ fontSize: '11px', color: '#86efac', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', padding: '2px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                              <CheckCircle2 size={10} /> {t}
                                            </span>
                                          ))}
                                          {q.missedTopics?.map((t, idx) => (
                                            <span key={`mis-${idx}`} style={{ fontSize: '11px', color: '#fca5a5', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', padding: '2px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                              <XCircle size={10} /> {t}
                                            </span>
                                          ))}
                                        </div>
                                      )}

                                      <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: '6px', fontStyle: 'italic' }}>
                                        &ldquo;{q.answer}&rdquo;
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', margin: '16px 0 10px' }}>
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

                            {/* Recruiter Evaluation Notes & Decision Panel */}
                            <div style={{ marginTop: '18px', padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#a5b4fc', letterSpacing: '0.5px', margin: 0 }}>
                                  📝 Recruiter Review & Decision
                                </h4>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveSubmissionReview(sub.id, editingReviewNotes[sub.id] ?? sub.scores?.reviewerNotes ?? '', 'qualified')}
                                    disabled={savingReviewId === sub.id}
                                    style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '4px', background: (sub.scores?.decision || decision) === 'qualified' ? '#22c55e' : 'rgba(34,197,94,0.12)', color: (sub.scores?.decision || decision) === 'qualified' ? '#fff' : '#86efac', border: '1px solid rgba(34,197,94,0.3)', cursor: 'pointer', fontWeight: '700' }}
                                  >
                                    ✓ Qualified
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveSubmissionReview(sub.id, editingReviewNotes[sub.id] ?? sub.scores?.reviewerNotes ?? '', 'review_needed')}
                                    disabled={savingReviewId === sub.id}
                                    style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '4px', background: (sub.scores?.decision || decision) === 'review_needed' ? '#f59e0b' : 'rgba(245,158,11,0.12)', color: (sub.scores?.decision || decision) === 'review_needed' ? '#fff' : '#fcd34d', border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer', fontWeight: '700' }}
                                  >
                                    Review
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveSubmissionReview(sub.id, editingReviewNotes[sub.id] ?? sub.scores?.reviewerNotes ?? '', 'rejected')}
                                    disabled={savingReviewId === sub.id}
                                    style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '4px', background: (sub.scores?.decision || decision) === 'rejected' ? '#ef4444' : 'rgba(239,68,68,0.12)', color: (sub.scores?.decision || decision) === 'rejected' ? '#fff' : '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', fontWeight: '700' }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>

                              <textarea
                                rows={2}
                                value={editingReviewNotes[sub.id] !== undefined ? editingReviewNotes[sub.id] : (sub.scores?.reviewerNotes || '')}
                                onChange={(e) => setEditingReviewNotes({ ...editingReviewNotes, [sub.id]: e.target.value })}
                                placeholder="Add private evaluation notes for this candidate (e.g. strong technical grasp, proceed to final interview)..."
                                style={{ width: '100%', fontSize: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 10px', color: '#fff', resize: 'vertical' }}
                              />
                              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleSaveSubmissionReview(sub.id, editingReviewNotes[sub.id] ?? sub.scores?.reviewerNotes ?? '', sub.scores?.decision || decision)}
                                  disabled={savingReviewId === sub.id}
                                  style={{ padding: '5px 14px', fontSize: '12px', borderRadius: '6px', background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                                >
                                  {savingReviewId === sub.id ? 'Saving...' : 'Save Notes'}
                                </button>
                              </div>
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

      {/* Printable Evaluation Report Dialog */}
      {printingSubmission && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setPrintingSubmission(null)}
          style={{ zIndex: 1200 }}
        >
          <div
            className="admin-modal"
            id="printable-assessment-report"
            style={{
              maxWidth: '850px',
              width: '92%',
              maxHeight: '90vh',
              background: '#0f172a',
              color: '#f8fafc',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '32px',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Print & Close controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid rgba(255,255,255,0.08)', paddingBottom: '20px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#6366f1', fontWeight: '800' }}>
                  PrepLoop Verified Assessment Report
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '4px 0 0', color: '#fff' }}>
                  {activeSetForSubmissions?.title || 'Private Interview Assessment'}
                </h2>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                  Session Code: <code style={{ color: '#38bdf8' }}>{activeSetForSubmissions?.share_code || '—'}</code> · Type: {activeSetForSubmissions?.interview_type || 'Technical'}
                </div>
              </div>

              <div className="print-hide" style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: '#6366f1',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  <Printer size={15} /> Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setPrintingSubmission(null)}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Candidate & Integrity Overview Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>Candidate</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginTop: '4px' }}>
                  {printingSubmission.user_name || 'Guest Candidate'}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                  {printingSubmission.user_email || 'Direct invite link'}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>Performance Score</div>
                <div style={{ fontSize: '20px', fontWeight: '800', marginTop: '2px', color: (printingSubmission.overall_score || 0) >= 70 ? '#22c55e' : (printingSubmission.overall_score || 0) >= 50 ? '#f59e0b' : '#ef4444' }}>
                  {printingSubmission.overall_score || 0} <span style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.4)' }}>/ 100</span>
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                  Duration: {Math.round((printingSubmission.duration || 0) / 60)} minutes
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>Session Integrity</div>
                <div style={{ fontSize: '15px', fontWeight: '700', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', color: (printingSubmission.scores?.integrity?.tabSwitchCount || 0) === 0 && (printingSubmission.scores?.integrity?.pasteCount || 0) === 0 ? '#22c55e' : (printingSubmission.scores?.integrity?.tabSwitchCount || 0) <= 2 ? '#f59e0b' : '#ef4444' }}>
                  <Shield size={16} />
                  {(printingSubmission.scores?.integrity?.tabSwitchCount || 0) === 0 && (printingSubmission.scores?.integrity?.pasteCount || 0) === 0
                    ? 'Clean Focus (0 switches, 0 pastes)'
                    : `${printingSubmission.scores?.integrity?.tabSwitchCount || 0} Switch(es) · ${printingSubmission.scores?.integrity?.pasteCount || 0} Paste(s)`}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                  Completed: {new Date(printingSubmission.completed_at || printingSubmission.created_at).toLocaleDateString()}
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>Hiring Status</div>
                <div style={{ fontSize: '15px', fontWeight: '800', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', color: (printingSubmission.scores?.decision || 'qualified') === 'qualified' ? '#22c55e' : (printingSubmission.scores?.decision === 'review_needed' ? '#f59e0b' : '#ef4444') }}>
                  {(printingSubmission.scores?.decision || (printingSubmission.overall_score >= 70 ? 'qualified' : 'review_needed')).replace('_', ' ')}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                  Target: {printingSubmission.scores?.passingScore ?? 70}%
                </div>
              </div>
            </div>

            {printingSubmission.scores?.reviewerNotes && (
              <div style={{ marginBottom: '24px', padding: '14px 16px', borderRadius: '10px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#a5b4fc', fontWeight: '800', marginBottom: '4px' }}>
                  Recruiter Reviewer Notes
                </div>
                <div style={{ fontSize: '13px', color: '#fff', lineHeight: '1.5' }}>
                  {printingSubmission.scores.reviewerNotes}
                </div>
              </div>
            )}

            {/* Proctoring Visual Snapshots */}
            {Array.isArray(printingSubmission.scores?.integrity?.snapshots) && printingSubmission.scores.integrity.snapshots.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#a78bfa', margin: '0 0 10px' }}>
                  Verified Proctoring Checkpoints ({printingSubmission.scores.integrity.snapshots.length})
                </h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {printingSubmission.scores.integrity.snapshots.map((snap, snapIdx) => (
                    <div key={snapIdx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '6px', textAlign: 'center' }}>
                      <img
                        src={snap.thumbnail}
                        alt={`Checkpoint ${snapIdx + 1}`}
                        style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '4px', display: 'block' }}
                      />
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#38bdf8', marginTop: '4px', textTransform: 'capitalize' }}>
                        {snap.trigger.replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>
                        {new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Question by question section */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#38bdf8', margin: '0 0 14px' }}>
                Question Performance & Topic Mastery
              </h3>
              {Array.isArray(printingSubmission.scores?.breakdown) && printingSubmission.scores.breakdown.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {printingSubmission.scores.breakdown.map((q, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '10px',
                        padding: '14px 16px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#fff' }}>
                          Question {q.questionIndex}: {q.question}
                        </div>
                        <div style={{ fontWeight: '800', fontSize: '14px', color: q.score >= 70 ? '#22c55e' : q.score >= 50 ? '#f59e0b' : '#ef4444' }}>
                          {q.score} / 100
                        </div>
                      </div>

                      {((Array.isArray(q.coveredTopics) && q.coveredTopics.length > 0) || (Array.isArray(q.missedTopics) && q.missedTopics.length > 0)) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '8px 0 10px' }}>
                          {q.coveredTopics?.map((t, tI) => (
                            <span key={`p-cov-${tI}`} style={{ fontSize: '11px', color: '#86efac', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', padding: '2px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <CheckCircle2 size={10} /> {t}
                            </span>
                          ))}
                          {q.missedTopics?.map((t, tI) => (
                            <span key={`p-mis-${tI}`} style={{ fontSize: '11px', color: '#fca5a5', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', padding: '2px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <XCircle size={10} /> {t}
                            </span>
                          ))}
                        </div>
                      )}

                      <div style={{ fontSize: '12px', lineHeight: '1.5', color: '#cbd5e1', background: 'rgba(0,0,0,0.25)', padding: '10px 12px', borderRadius: '8px' }}>
                        {q.answer}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', padding: '16px 0' }}>
                  No per-question breakdown recorded.
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              <span>Generated by PrepLoop Enterprise Evaluation Engine</span>
              <span>Confidential Assessment Document</span>
            </div>
          </div>
        </div>
      )}

      {/* Standalone Candidate Review Dossier Dialog */}
      {viewingDossier && (
        <CandidateReviewDossier
          submission={viewingDossier}
          questionSet={activeSetForSubmissions}
          onClose={() => setViewingDossier(null)}
        />
      )}

      {/* Personalized Candidate Invites Modal */}
      {showPersonalizedInvitesModal && activeSetForInvites && (
        <div className="admin-modal-backdrop" onClick={() => setShowPersonalizedInvitesModal(false)}>
          <div
            className="admin-modal"
            style={{ maxWidth: '680px', width: '92%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#10b981', fontWeight: '800' }}>
                  Candidate Link Dispatch
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '4px 0 0', color: '#fff' }}>
                  Personalized Candidate Join Links
                </h2>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                  {activeSetForInvites.title} · Share Code: <code>{activeSetForInvites.share_code}</code>
                </div>
              </div>
              <button className="admin-modal-close" onClick={() => setShowPersonalizedInvitesModal(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Schedule details note */}
            {activeSetForInvites.scheduled_at && (
              <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#7dd3fc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={15} style={{ flexShrink: 0 }} />
                <span>
                  Fixed Session: <strong>{new Date(activeSetForInvites.scheduled_at).toLocaleString()}</strong> ({activeSetForInvites.scheduled_duration_minutes || 45} mins). Candidate emails will be pre-filled and locked.
                </span>
              </div>
            )}

            {/* Quick Add Candidate Invites & CSV Import */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#e2e8f0' }}>
                  Quick Add Candidate Email(s)
                </span>
                <label
                  className="admin-btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '6px' }}
                  title="Upload CSV or TXT file containing candidate email addresses"
                >
                  <FileUp size={12} />
                  <span>Import CSV / TXT</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    hidden
                    onChange={handleCsvInvitesUpload}
                  />
                </label>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="e.g. candidate@domain.com or comma-separated emails"
                  value={quickInviteInput}
                  onChange={(e) => setQuickInviteInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleQuickAddInvites(); } }}
                  style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px' }}
                />
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={handleQuickAddInvites}
                  disabled={addingInvites || !quickInviteInput.trim()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', flexShrink: 0 }}
                >
                  {addingInvites ? <Loader2 size={13} className="spin" /> : <Plus size={13} />}
                  <span>{addingInvites ? 'Adding...' : 'Add'}</span>
                </button>
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
                Adds authorized candidate emails immediately to this question set.
              </div>
            </div>

            {/* List of candidates from allowed_emails or fallback */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 10px' }}>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                  Authorized Candidate Links ({activeSetForInvites.allowed_emails?.length || 0})
                </h4>
                {Array.isArray(activeSetForInvites.allowed_emails) && activeSetForInvites.allowed_emails.length > 0 && (
                  <button
                    type="button"
                    onClick={handleGenerateSingleUseLinks}
                    disabled={addingInvites}
                    style={{
                      background: 'rgba(129,140,248,0.12)',
                      color: '#a5b4fc',
                      border: '1px solid rgba(129,140,248,0.25)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Generate unique single-use magic tokens (inv_<id>) for all candidates"
                  >
                    <Sparkles size={11} /> Generate Single-Use Magic Links
                  </button>
                )}
              </div>

              {Array.isArray(activeSetForInvites.allowed_emails) && activeSetForInvites.allowed_emails.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                  {activeSetForInvites.allowed_emails.map((email, idx) => {
                    const candidateInvites = activeSetForInvites.settings?.candidateInvites || {};
                    const tokenEntry = Object.entries(candidateInvites).find(
                      ([, inv]) => inv?.email?.toLowerCase() === email.toLowerCase()
                    );
                    const singleUseToken = tokenEntry ? tokenEntry[0] : null;
                    const inviteInfo = tokenEntry ? tokenEntry[1] : null;

                    const candidateUrl = singleUseToken
                      ? `${typeof window !== 'undefined' ? window.location.origin : 'https://preploop.com'}/ai-interview?token=${singleUseToken}`
                      : `${typeof window !== 'undefined' ? window.location.origin : 'https://preploop.com'}/ai-interview?token=${activeSetForInvites.share_code}&email=${encodeURIComponent(email)}`;
                    const isCopied = copiedIndividualLink === email;

                    return (
                      <div
                        key={idx}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: singleUseToken ? '1px solid rgba(129,140,248,0.2)' : '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                              {email}
                            </span>
                            {singleUseToken ? (
                              inviteInfo?.status === 'completed' ? (
                                <span style={{ background: 'rgba(34,197,94,0.15)', color: '#86efac', border: '1px solid rgba(34,197,94,0.3)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
                                  ✓ Submitted
                                </span>
                              ) : inviteInfo?.status === 'claimed' ? (
                                <span style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
                                  In Progress
                                </span>
                              ) : (
                                <span style={{ background: 'rgba(129,140,248,0.15)', color: '#a5b4fc', border: '1px solid rgba(129,140,248,0.3)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
                                  Single-Use Link
                                </span>
                              )
                            ) : (
                              <span style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>
                                Allowlist Link
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: singleUseToken ? '#a5b4fc' : 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                            {candidateUrl}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(candidateUrl);
                            setCopiedIndividualLink(email);
                            setTimeout(() => setCopiedIndividualLink(null), 2500);
                          }}
                          style={{
                            background: isCopied ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
                            color: isCopied ? '#86efac' : '#a5b4fc',
                            border: isCopied ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(99,102,241,0.3)',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            flexShrink: 0,
                          }}
                        >
                          {isCopied ? <Check size={13} /> : <Copy size={13} />}
                          {isCopied ? 'Copied' : 'Copy Link'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', color: 'rgba(255,255,255,0.4)' }}>
                  <p style={{ fontSize: '13px', margin: 0 }}>This question set does not have an email allowlist configured.</p>
                  <p style={{ fontSize: '11px', margin: '4px 0 0' }}>Candidates can join directly using the general candidate token <code>{activeSetForInvites.share_code}</code>.</p>
                </div>
              )}

              {/* Email dispatch results summary banner */}
              {dispatchResults && (
                <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: dispatchResults.isSimulated ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)', border: dispatchResults.isSimulated ? '1px solid rgba(234,179,8,0.25)' : '1px solid rgba(34,197,94,0.25)', fontSize: '12px', color: dispatchResults.isSimulated ? '#fde047' : '#86efac' }}>
                  {dispatchResults.isSimulated ? (
                    <div>ℹ️ <strong>Simulated Email Dispatch:</strong> Generated {dispatchResults.total} candidate invitations with calendar attachments (.ics). (Email service credentials not configured in environment).</div>
                  ) : (
                    <div>✓ <strong>Dispatched:</strong> {dispatchResults.sent} sent, {dispatchResults.failed} failed of {dispatchResults.total} candidate emails.</div>
                  )}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => {
                  setShowPersonalizedInvitesModal(false);
                  setDispatchResults(null);
                }}
              >
                Close
              </button>
              {activeSetForInvites.scheduled_at && (
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => handleDownloadAdminIcs(activeSetForInvites)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.25)' }}
                  title="Download .ICS calendar invitation file"
                >
                  <Download size={14} /> Download .ICS
                </button>
              )}
              {Array.isArray(activeSetForInvites.allowed_emails) && activeSetForInvites.allowed_emails.length > 0 && (
                <>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    disabled={dispatchingInvites}
                    onClick={handleDispatchEmailInvites}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.25)' }}
                  >
                    {dispatchingInvites ? <Loader2 size={14} className="spin" /> : <Mail size={14} />}
                    {dispatchingInvites ? 'Sending Invites...' : 'Send Email Invites'}
                  </button>
                  <button
                    type="button"
                    className="admin-btn-primary"
                    onClick={() => {
                      const candidateInvites = activeSetForInvites.settings?.candidateInvites || {};
                      const allLinksText = activeSetForInvites.allowed_emails.map(email => {
                        const tokenEntry = Object.entries(candidateInvites).find(
                          ([, inv]) => inv?.email?.toLowerCase() === email.toLowerCase()
                        );
                        const singleUseToken = tokenEntry ? tokenEntry[0] : null;
                        const url = singleUseToken
                          ? `${typeof window !== 'undefined' ? window.location.origin : 'https://preploop.com'}/ai-interview?token=${singleUseToken}`
                          : `${typeof window !== 'undefined' ? window.location.origin : 'https://preploop.com'}/ai-interview?token=${activeSetForInvites.share_code}&email=${encodeURIComponent(email)}`;
                        return `${email}: ${url}`;
                      }).join('\n');
                      navigator.clipboard.writeText(allLinksText);
                      setSuccess('All candidate join links copied to clipboard!');
                      setTimeout(() => setShowPersonalizedInvitesModal(false), 800);
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Copy size={14} /> Copy All Links
                  </button>
                </>
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
