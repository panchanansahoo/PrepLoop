import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CreateJobApplicationSchema, UpdateJobApplicationSchema } from '@preploop/contracts/jobs';
import {
  Briefcase,
  Building2,
  ExternalLink,
  Plus,
  Trash2,
  Sparkles,
  Search,
  X,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Mail,
  Copy,
  Check,
  TrendingUp,
  Users,
  Award,
  Clock,
  MapPin,
  DollarSign,
  AlertCircle,
  FileText,
  Target,
  ArrowRight,
  RefreshCw,
  Zap,
  Bookmark,
  Sliders,
  CheckCircle2,
  Tag,
  Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authFetch } from '../utils/authFetch';
import { buildApiUrl } from '../utils/safeApiUrl';

const COLUMNS = [
  { id: 'bookmarked', label: 'Bookmarked', accent: 'border-slate-500', badge: 'bg-slate-800 text-slate-300' },
  { id: 'applied', label: 'Applied', accent: 'border-blue-500/80', badge: 'bg-blue-950/60 text-blue-300 border border-blue-800/40' },
  { id: 'phone_screen', label: 'Phone Screen', accent: 'border-cyan-500/80', badge: 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/40' },
  { id: 'technical', label: 'Technical', accent: 'border-purple-500/80', badge: 'bg-purple-950/60 text-purple-300 border border-purple-800/40' },
  { id: 'onsite', label: 'Onsite', accent: 'border-amber-500/80', badge: 'bg-amber-950/60 text-amber-300 border border-amber-800/40' },
  { id: 'offer', label: 'Offer', accent: 'border-emerald-500/80', badge: 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40' },
  { id: 'rejected', label: 'Rejected', accent: 'border-rose-500/80', badge: 'bg-rose-950/60 text-rose-300 border border-rose-800/40' },
];

const POPULAR_SKILL_PRESETS = [
  'React',
  'Node.js',
  'Python',
  'TypeScript',
  'Java',
  'SQL',
  'AWS',
  'Docker',
  'Go',
  'Next.js',
  'System Design',
  'C++',
  'MongoDB',
  'GraphQL',
];

const EXPERIENCE_LEVELS = [
  { id: 'fresher', label: 'Fresher / Entry (0-1 yr)' },
  { id: 'junior', label: 'Junior (1-3 yrs)' },
  { id: 'mid', label: 'Mid-Level (3-5 yrs)' },
  { id: 'senior', label: 'Senior (5+ yrs)' },
];

const TARGET_ROLES = [
  'All Roles',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Software Development Engineer',
  'DevOps Engineer',
  'Data Analyst',
  'Machine Learning Engineer',
];

const LOCATIONS = [
  'All Locations',
  'Remote',
  'Bengaluru',
  'Hyderabad',
  'Pune',
  'Noida / Delhi NCR',
  'Mumbai',
  'Chennai',
];

const COMPANY_DOMAIN_MAP = {
  google: 'google.com', amazon: 'amazon.com', microsoft: 'microsoft.com',
  meta: 'meta.com', apple: 'apple.com', netflix: 'netflix.com',
  uber: 'uber.com', airbnb: 'airbnb.com', stripe: 'stripe.com',
  tcs: 'tcs.com', infosys: 'infosys.com', wipro: 'wipro.com',
  hcltech: 'hcltech.com', cognizant: 'cognizant.com', accenture: 'accenture.com',
  flipkart: 'flipkart.com', razorpay: 'razorpay.com', swiggy: 'swiggy.com',
  zomato: 'zomato.com', zerodha: 'zerodha.com', phonepe: 'phonepe.com',
  zoho: 'zoho.com', freshworks: 'freshworks.com', cred: 'cred.club',
  groww: 'groww.in', meesho: 'meesho.io', paytm: 'paytm.com',
  databricks: 'databricks.com', linear: 'linear.app',
};

function getLogoUrl(company) {
  if (!company) return null;
  const key = company.toLowerCase().trim().split(/\s+/)[0];
  const domain = COMPANY_DOMAIN_MAP[key] || `${key.replace(/[^a-z0-9]/g, '')}.com`;
  return `https://logo.clearbit.com/${domain}`;
}

const DEFAULT_MATCHED_JOBS = [
  {
    id: 'real_google_swe',
    title: 'Software Engineer - Frontend',
    company: 'Google',
    location: 'Bengaluru, India',
    salary_range: '₹18 - 30 LPA',
    type: 'full-time',
    matchScore: 92,
    matchedSkills: ['React', 'TypeScript', 'JavaScript'],
    matchedSignals: ['Skills: React, TypeScript', 'Location: Bengaluru'],
    requirements: ['3+ years in React / modern web frameworks', 'Strong CS fundamentals'],
    apply_link: 'https://careers.google.com/jobs/results/?q=software+engineer',
  },
  {
    id: 'real_amazon_sde',
    title: 'SDE-2 Full Stack Developer',
    company: 'Amazon',
    location: 'Hyderabad, India',
    salary_range: '₹22 - 38 LPA',
    type: 'full-time',
    matchScore: 88,
    matchedSkills: ['Node.js', 'AWS', 'SQL'],
    matchedSignals: ['Skills: Node.js, AWS', 'Experience Fit'],
    requirements: ['Distributed systems and microservices', '2-5 years experience'],
    apply_link: 'https://amazon.jobs/en/search?base_query=software+development+engineer',
  },
  {
    id: 'real_microsoft_swe',
    title: 'Backend Engineer - Cloud Platform',
    company: 'Microsoft',
    location: 'Pune / Remote',
    salary_range: '₹20 - 35 LPA',
    type: 'full-time',
    matchScore: 84,
    matchedSkills: ['Python', 'SQL', 'Docker'],
    matchedSignals: ['Skills: Python, SQL', 'Location: Remote'],
    requirements: ['Cloud platform engineering', 'Python, C# or Go'],
    apply_link: 'https://careers.microsoft.com/us/en/search-results?q=software+engineer',
  },
  {
    id: 'curated_9',
    title: 'Backend Engineer – Payments',
    company: 'Razorpay',
    location: 'Bengaluru, India',
    salary_range: '₹14 - 24 LPA',
    type: 'full-time',
    matchScore: 81,
    matchedSkills: ['Go', 'Node.js', 'SQL'],
    matchedSignals: ['Skills: Node.js, SQL', 'Fintech'],
    requirements: ['High throughput APIs', 'Relational and NoSQL databases'],
    apply_link: 'https://razorpay.com/jobs',
  },
  {
    id: 'curated_11',
    title: 'Frontend Engineer – Consumer App',
    company: 'Swiggy',
    location: 'Bengaluru, India',
    salary_range: '₹16 - 26 LPA',
    type: 'full-time',
    matchScore: 80,
    matchedSkills: ['React', 'TypeScript'],
    matchedSignals: ['Skills: React, TypeScript'],
    requirements: ['React web performance', 'Component systems & state management'],
    apply_link: 'https://careers.swiggy.com',
  },
  {
    id: 'curated_21',
    title: 'Backend Developer – Python',
    company: 'Meesho',
    location: 'Bengaluru, India',
    salary_range: '₹12 - 20 LPA',
    type: 'full-time',
    matchScore: 78,
    matchedSkills: ['Python', 'SQL'],
    matchedSignals: ['Skills: Python, SQL'],
    requirements: ['Python, Django/FastAPI', 'PostgreSQL & Redis experience'],
    apply_link: 'https://meesho.io/careers',
  },
];

function generateFollowUpEmail(company, role) {
  return `Subject: Following Up: ${role} Application - [Your Name]

Dear ${company} Hiring Team,

I hope this email finds you well.

I am writing to reiterate my enthusiasm for the ${role} position at ${company}. Having submitted my application recently, I wanted to follow up and see if there are any updates regarding the hiring process.

Given my background and passion for ${company}'s mission, I am eager to contribute to your team. Please let me know if you need any additional materials, portfolio samples, or references to support my candidacy.

Thank you very much for your time and consideration.

Best regards,
[Your Name]
[Your Phone Number]
[Your LinkedIn Profile]`;
}

export default function JobTracker() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // View mode switcher: 'kanban' or 'matches'
  const [viewMode, setViewMode] = useState('kanban');

  // Search & Filter state for Kanban
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Edit modal state
  const [editingApp, setEditingApp] = useState(null);
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Toast & Copied state
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Manual Add Form state
  const [form, setForm] = useState({
    company: '',
    role: '',
    status: 'bookmarked',
    location: '',
    salaryRange: '',
    jobUrl: '',
    notes: '',
  });

  // 🎯 Skills & Experience Profile for Job Matching
  const [userSkills, setUserSkills] = useState(() => {
    try {
      const stored = localStorage.getItem('preploop_tracker_skills');
      if (stored) return JSON.parse(stored);
    } catch {}
    return ['React', 'TypeScript', 'Node.js'];
  });
  const [customSkillInput, setCustomSkillInput] = useState('');

  const [experienceLevel, setExperienceLevel] = useState(() => {
    try {
      return localStorage.getItem('preploop_tracker_exp') || 'junior';
    } catch {
      return 'junior';
    }
  });

  const [targetRole, setTargetRole] = useState(() => {
    try {
      return localStorage.getItem('preploop_tracker_role') || 'All Roles';
    } catch {
      return 'All Roles';
    }
  });

  const [targetLocation, setTargetLocation] = useState(() => {
    try {
      return localStorage.getItem('preploop_tracker_loc') || 'All Locations';
    } catch {
      return 'All Locations';
    }
  });

  // Matched Jobs state
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [matchedLoading, setMatchedLoading] = useState(false);
  const [matchedError, setMatchedError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 4000);
  }, []);

  const loadApplications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch(buildApiUrl('/job-applications'));
      if (res.ok) {
        const data = await res.json();
        setApplications(Array.isArray(data.applications) ? data.applications : []);
      } else {
        setError('Unable to load job applications.');
      }
    } catch {
      setError('Unable to load job applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [user?.id]);

  // Fetch skill-matched jobs based on user skills & experience
  const fetchSkillMatchedJobs = useCallback(async () => {
    setMatchedLoading(true);
    setMatchedError(null);
    try {
      const params = new URLSearchParams();
      if (userSkills.length > 0) params.set('skills', userSkills.join(','));
      if (experienceLevel) params.set('experienceLevel', experienceLevel);
      if (targetRole && targetRole !== 'All Roles') params.set('role', targetRole);
      if (targetLocation && targetLocation !== 'All Locations') params.set('location', targetLocation);

      const url = buildApiUrl(`/jobs/skill-match?${params.toString()}`);
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        const fetched = Array.isArray(data.jobs) && data.jobs.length > 0 ? data.jobs : DEFAULT_MATCHED_JOBS;
        setMatchedJobs(fetched);
        setLastRefreshed(new Date());
      } else {
        setMatchedJobs(DEFAULT_MATCHED_JOBS);
        setLastRefreshed(new Date());
      }
    } catch {
      setMatchedJobs(DEFAULT_MATCHED_JOBS);
      setLastRefreshed(new Date());
    } finally {
      setMatchedLoading(false);
    }
  }, [userSkills, experienceLevel, targetRole, targetLocation]);

  useEffect(() => {
    if (viewMode === 'matches') {
      fetchSkillMatchedJobs();
    }
  }, [fetchSkillMatchedJobs, viewMode]);

  // Save skill preferences to localStorage
  const handleToggleSkill = (skill) => {
    setUserSkills((prev) => {
      const next = prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill];
      try {
        localStorage.setItem('preploop_tracker_skills', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    const clean = customSkillInput.trim();
    if (!clean) return;
    if (!userSkills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      const next = [...userSkills, clean];
      setUserSkills(next);
      try {
        localStorage.setItem('preploop_tracker_skills', JSON.stringify(next));
      } catch {}
    }
    setCustomSkillInput('');
  };

  const handleExperienceChange = (exp) => {
    setExperienceLevel(exp);
    try {
      localStorage.setItem('preploop_tracker_exp', exp);
    } catch {}
  };

  const handleRoleChange = (role) => {
    setTargetRole(role);
    try {
      localStorage.setItem('preploop_tracker_role', role);
    } catch {}
  };

  const handleLocationChange = (loc) => {
    setTargetLocation(loc);
    try {
      localStorage.setItem('preploop_tracker_loc', loc);
    } catch {}
  };

  // Check if a job is already in user's applications
  const getTrackedStatusForJob = useCallback(
    (job) => {
      const found = applications.find(
        (app) =>
          (app.company?.toLowerCase() === job.company?.toLowerCase() &&
            app.role?.toLowerCase() === (job.title || job.role)?.toLowerCase()) ||
          (job.apply_link && app.jobUrl === job.apply_link)
      );
      return found ? found.status : null;
    },
    [applications]
  );

  // 1-Click Track application from Matched Jobs
  const handleTrackJob = async (job, targetStatus = 'applied') => {
    const existingStatus = getTrackedStatusForJob(job);
    if (existingStatus) {
      showToast(`${job.company} is already in your tracker (${existingStatus})!`, 'info');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        company: job.company || 'Tech Company',
        role: job.title || job.role || 'Software Engineer',
        status: targetStatus,
        location: job.location || '',
        salaryRange: job.salary_range || '',
        jobUrl: job.apply_link || '',
        notes: `Matched via Skills & Experience (${job.matchScore || 85}% match). Requirements: ${(
          job.requirements || []
        )
          .slice(0, 2)
          .join(', ')}`,
        appliedAt: targetStatus !== 'bookmarked' ? new Date().toISOString() : null,
      };

      const res = await authFetch(buildApiUrl('/job-applications'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to track job application');
      }

      setApplications((prev) => [data.application, ...prev]);
      showToast(
        `✓ Added ${job.company} - ${job.title || job.role} to ${
          targetStatus === 'applied' ? 'Applied' : 'Bookmarked'
        } column!`,
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Could not track job application.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Pipeline Analytics Header metrics
  const analytics = useMemo(() => {
    const total = applications.length;
    const active = applications.filter((a) =>
      ['applied', 'phone_screen', 'technical', 'onsite'].includes(a.status)
    ).length;
    const interviewing = applications.filter((a) =>
      ['phone_screen', 'technical', 'onsite'].includes(a.status)
    ).length;
    const offers = applications.filter((a) => a.status === 'offer').length;
    const appliedOrBeyond = applications.filter((a) => a.status !== 'bookmarked').length;
    const conversionRate =
      appliedOrBeyond > 0 ? Math.round(((interviewing + offers) / appliedOrBeyond) * 100) : 0;

    return { total, active, interviewing, offers, conversionRate };
  }, [applications]);

  // Search & Filter for Kanban
  const filteredApplications = useMemo(() => {
    let result = applications;

    if (activeFilter === 'active') {
      result = result.filter((a) => ['applied', 'phone_screen', 'technical', 'onsite'].includes(a.status));
    } else if (activeFilter === 'interview') {
      result = result.filter((a) => ['phone_screen', 'technical', 'onsite'].includes(a.status));
    } else if (activeFilter === 'offers') {
      result = result.filter((a) => a.status === 'offer');
    } else if (activeFilter === 'rejected') {
      result = result.filter((a) => a.status === 'rejected');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          (a.company && a.company.toLowerCase().includes(q)) ||
          (a.role && a.role.toLowerCase().includes(q)) ||
          (a.location && a.location.toLowerCase().includes(q)) ||
          (a.notes && a.notes.toLowerCase().includes(q))
      );
    }

    return result;
  }, [applications, activeFilter, searchQuery]);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(COLUMNS.map((c) => [c.id, []]));
    for (const app of filteredApplications) {
      const key = map[app.status] ? app.status : 'bookmarked';
      map[key].push(app);
    }
    return map;
  }, [filteredApplications]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    const parsed = CreateJobApplicationSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues?.[0]?.message || 'Please check the application fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch(buildApiUrl('/job-applications'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save application');
      }
      setApplications((prev) => [data.application, ...prev]);
      setForm({ company: '', role: '', status: 'bookmarked', location: '', salaryRange: '', jobUrl: '', notes: '' });
      setShowForm(false);
      showToast(`Tracked application for ${data.application.company}!`);
    } catch (err) {
      setError(err.message || 'Could not create job application.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingStageUpdates = useRef(new Set());
  const handleStatusChange = async (id, nextStatus) => {
    const previous = applications.find(item => item.id === id);
    if (!previous || previous.status === nextStatus || pendingStageUpdates.current.has(id)) return;
    pendingStageUpdates.current.add(id);
    const needsAppliedAt = !previous.appliedAt && (
      nextStatus === 'applied' || (previous.status === 'bookmarked' && nextStatus !== 'bookmarked')
    );
    const nextAppliedAt = needsAppliedAt ? new Date().toISOString() : undefined;
    const rollback = () => setApplications(curr => curr.map(item =>
      item.id === id && item.status === nextStatus ? previous : item));
    setApplications((curr) => curr.map((item) => (
      item.id === id
        ? { ...item, status: nextStatus, ...(nextAppliedAt ? { appliedAt: nextAppliedAt } : {}) }
        : item
    )));
    try {
      const res = await authFetch(buildApiUrl(`/job-applications/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          ...(nextAppliedAt ? { appliedAt: nextAppliedAt } : {}),
        }),
      });
      if (!res.ok) {
        rollback();
        showToast('Failed to update stage', 'error');
      } else {
        const { application } = await res.json();
        setApplications(curr => curr.map(item =>
          item.id === id && item.status === nextStatus ? { ...item, ...application } : item));
        const targetCol = COLUMNS.find((c) => c.id === nextStatus);
        showToast(`Moved to ${targetCol?.label || nextStatus}`);
      }
    } catch {
      rollback();
      showToast('Failed to update stage', 'error');
    } finally {
      pendingStageUpdates.current.delete(id);
    }
  };

  const handleShiftStage = (card, direction) => {
    const currentIndex = COLUMNS.findIndex((c) => c.id === card.status);
    if (currentIndex === -1) return;
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < COLUMNS.length) {
      handleStatusChange(card.id, COLUMNS[newIndex].id);
    }
  };

  const handleOpenEdit = (card) => {
    setEditingApp({
      id: card.id,
      company: card.company,
      role: card.role,
      status: card.status,
      location: card.location || '',
      salaryRange: card.salaryRange || '',
      jobUrl: card.jobUrl || '',
      notes: card.notes || '',
      appliedAt: card.appliedAt || null,
    });
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingApp) return;
    setEditError('');

    const parsed = UpdateJobApplicationSchema.safeParse({
      company: editingApp.company,
      role: editingApp.role,
      status: editingApp.status,
      location: editingApp.location,
      salaryRange: editingApp.salaryRange,
      jobUrl: editingApp.jobUrl,
      notes: editingApp.notes,
    });

    if (!parsed.success) {
      setEditError(parsed.error.issues?.[0]?.message || 'Please check updated values.');
      return;
    }

    setEditSubmitting(true);
    try {
      const res = await authFetch(buildApiUrl(`/job-applications/${editingApp.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...parsed.data,
          ...(!editingApp.appliedAt && parsed.data.status === 'applied' && { appliedAt: new Date().toISOString() }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to update application');
      }

      setApplications((curr) =>
        curr.map((item) => (item.id === editingApp.id ? { ...item, ...data.application } : item))
      );
      setEditingApp(null);
      showToast(`Updated application for ${data.application.company}`);
    } catch (err) {
      setEditError(err.message || 'Error saving changes.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id, companyName) => {
    const prev = applications;
    setApplications((curr) => curr.filter((item) => item.id !== id));
    try {
      const res = await authFetch(buildApiUrl(`/job-applications/${id}`), { method: 'DELETE' });
      if (!res.ok) {
        setApplications(prev);
        showToast('Failed to delete application', 'error');
      } else {
        showToast(`Deleted ${companyName || 'application'}`);
      }
    } catch {
      setApplications(prev);
      showToast('Error deleting application', 'error');
    }
  };

  const handleCopyFollowUp = async (card) => {
    const emailText = generateFollowUpEmail(card.company, card.role);
    try {
      await navigator.clipboard.writeText(emailText);
      setCopiedId(card.id);
      showToast(`Follow-up email template for ${card.company} copied to clipboard!`);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      showToast('Could not copy to clipboard. Please allow clipboard permissions.', 'error');
    }
  };

  const filterTabs = [
    { id: 'all', label: 'All', count: applications.length },
    { id: 'active', label: 'Active', count: analytics.active },
    { id: 'interview', label: 'In Interview', count: analytics.interviewing },
    { id: 'offers', label: 'Offers', count: analytics.offers },
    { id: 'rejected', label: 'Rejected', count: applications.filter((a) => a.status === 'rejected').length },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6">
      <div className="max-w-[1700px] mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Briefcase className="text-indigo-400" size={24} />
              Job Application Tracker
            </h1>
            <p className="text-sm text-slate-400">
              Set your skills & experience, discover active matching tech openings, apply, and track every stage to offer.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/copilot"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <Sparkles size={15} className="text-purple-400" />
              AI Job Copilot
            </Link>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              aria-label="Add Application"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
            >
              <Plus size={16} />
              Add Application
            </button>
          </div>
        </div>

        {/* Primary View Mode Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-900/90 border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase size={16} />
              <span>Application Pipeline</span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${viewMode === 'kanban' ? 'bg-indigo-700' : 'bg-slate-800 text-slate-300'}`}>
                {applications.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matches')}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                viewMode === 'matches'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Target size={16} className="text-amber-400" />
              <span>Matched Opportunities</span>
              <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-xs font-bold">
                {matchedJobs.length} Active
              </span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Profile-based live matching active</span>
          </div>
        </div>

        {/* 1. Pipeline Analytics Header */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Total Tracked</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Briefcase size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">{analytics.total}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">All opportunities</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Active Pipeline</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Clock size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-400">{analytics.active}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Applied to onsite</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Interviewing</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Users size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-400">{analytics.interviewing}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Screen, tech & onsite</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Offers</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Award size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-400">{analytics.offers}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Received offers</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-slate-700 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Conversion Rate</span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold text-cyan-400">{analytics.conversionRate}%</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Applied to interview/offer</p>
          </div>
        </div>

        {/* View Mode 1: Matched Opportunities based on Skills & Experience */}
        {viewMode === 'matches' && (
          <div className="space-y-6">
            {/* Skill & Experience Configurator Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Sliders size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Your Skills & Experience Profile</h2>
                    <p className="text-xs text-slate-400">
                      Configure your skills and experience level. PrepLoop scores and shows live active tech jobs matched to your criteria.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fetchSkillMatchedJobs}
                  disabled={matchedLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw size={13} className={matchedLoading ? 'animate-spin' : ''} />
                  <span>{matchedLoading ? 'Refreshing...' : 'Refresh Matches'}</span>
                </button>
              </div>

              {/* Skills Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Target Tech Skills (Select or type custom):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SKILL_PRESETS.map((skill) => {
                    const isSelected = userSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleToggleSkill(skill)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                            : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {skill}
                      </button>
                    );
                  })}
                </div>

                {/* Custom skill add input */}
                <form onSubmit={handleAddCustomSkill} className="flex items-center gap-2 pt-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Add custom skill (e.g. FastAPI, Tailwind, Flutter)..."
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    Add
                  </button>
                </form>
              </div>

              {/* Experience Level & Filters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Experience Level:</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => handleExperienceChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {EXPERIENCE_LEVELS.map((exp) => (
                      <option key={exp.id} value={exp.id}>
                        {exp.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Role:</label>
                  <select
                    value={targetRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {TARGET_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Preferred Location:</label>
                  <select
                    value={targetLocation}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Matched Jobs Results List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" />
                  <span>Active Jobs Matching Your Profile</span>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300 font-semibold">
                    {matchedJobs.length} Openings
                  </span>
                </h3>
                {lastRefreshed && (
                  <span className="text-xs text-slate-400">
                    Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {matchedLoading ? (
                <div className="py-16 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-3">
                  <RefreshCw size={24} className="animate-spin text-indigo-400" />
                  <span>Matching live jobs against your skills and experience...</span>
                </div>
              ) : matchedJobs.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
                  <Target size={32} className="mx-auto mb-2 text-slate-500" />
                  <p className="font-semibold text-white">No exact matching jobs found</p>
                  <p className="text-xs mt-1">Try selecting broader skills or changing experience level.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {matchedJobs.map((job) => {
                    const trackedStatus = getTrackedStatusForJob(job);
                    const isTracked = Boolean(trackedStatus);
                    const logoUrl = job.logo_url || getLogoUrl(job.company);

                    return (
                      <article
                        key={job.id}
                        className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3.5 transition-all hover:border-slate-700 shadow-lg relative flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          {/* Card Top: Match Score & Tracked Badge */}
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                                job.matchScore >= 85
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                                  : job.matchScore >= 70
                                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                                  : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              <Zap size={12} />
                              {job.matchScore || 85}% Match
                            </span>

                            {isTracked ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-950 border border-indigo-500/40 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
                                <CheckCircle2 size={12} className="text-indigo-400" />
                                In Tracker ({trackedStatus})
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                                Active Tech Opening
                              </span>
                            )}
                          </div>

                          {/* Company & Role Header */}
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                              {logoUrl ? (
                                <img
                                  src={logoUrl}
                                  alt={job.company}
                                  className="w-full h-full object-contain p-1"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <Building2 size={18} className="text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-base font-bold text-white truncate" title={job.title || job.role}>
                                {job.title || job.role}
                              </h4>
                              <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                                <Building2 size={12} /> {job.company}
                              </p>
                            </div>
                          </div>

                          {/* Location, Salary & Type Tags */}
                          <div className="flex flex-wrap gap-2 text-xs">
                            {job.location && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-950 border border-slate-800 px-2 py-0.5 text-slate-300">
                                <MapPin size={11} className="text-slate-400" />
                                {job.location}
                              </span>
                            )}
                            {job.salary_range && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-950 border border-slate-800 px-2 py-0.5 text-emerald-400 font-medium">
                                <DollarSign size={11} className="text-emerald-400" />
                                {job.salary_range}
                              </span>
                            )}
                            {job.type && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-950 border border-slate-800 px-2 py-0.5 text-slate-400 uppercase text-[10px]">
                                {job.type}
                              </span>
                            )}
                          </div>

                          {/* Matched Skills Tags */}
                          {job.matchedSkills && job.matchedSkills.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[11px] font-medium text-slate-400">Matched to your skills:</span>
                              <div className="flex flex-wrap gap-1">
                                {job.matchedSkills.map((sk) => (
                                  <span
                                    key={sk}
                                    className="rounded-md bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 text-[11px] font-medium text-indigo-300"
                                  >
                                    ✓ {sk}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Requirements or Description snippet */}
                          {job.requirements && job.requirements.length > 0 ? (
                            <ul className="text-xs text-slate-400 space-y-0.5 list-disc list-inside">
                              {job.requirements.slice(0, 2).map((req, i) => (
                                <li key={i} className="line-clamp-1">
                                  {req}
                                </li>
                              ))}
                            </ul>
                          ) : job.description ? (
                            <p className="text-xs text-slate-400 line-clamp-2">{job.description}</p>
                          ) : null}
                        </div>

                        {/* Card Actions: Apply + 1-Click Track + Prep */}
                        <div className="pt-3 border-t border-slate-800 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            {/* External Apply Link */}
                            {job.apply_link ? (
                              <a
                                href={job.apply_link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
                              >
                                <span>Apply Now</span>
                                <ExternalLink size={12} />
                              </a>
                            ) : (
                              <span className="text-xs text-slate-500">Apply via Careers Portal</span>
                            )}

                            {/* 1-Click Track Actions */}
                            {isTracked ? (
                              <button
                                type="button"
                                onClick={() => setViewMode('kanban')}
                                className="inline-flex items-center gap-1 rounded-xl bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30 transition-colors"
                              >
                                <span>View in Kanban</span>
                                <ArrowRight size={12} />
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={submitting}
                                  onClick={() => handleTrackJob(job, 'applied')}
                                  className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-sm shadow-indigo-600/30 disabled:opacity-60"
                                  title="Mark as applied and add to tracker"
                                >
                                  <Check size={12} />
                                  <span>Track as Applied</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={submitting}
                                  onClick={() => handleTrackJob(job, 'bookmarked')}
                                  className="p-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-60"
                                  title="Bookmark for later"
                                  aria-label="Bookmark job"
                                >
                                  <Bookmark size={13} />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Quick Prep Links */}
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                            <Link
                              to={`/company-prep?company=${encodeURIComponent(job.company)}`}
                              className="text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1"
                            >
                              <span>Company Prep</span> →
                            </Link>
                            <Link
                              to="/copilot"
                              state={{
                                jobDetails: { company: job.company, role: job.title || job.role },
                                company: job.company,
                                role: job.title || job.role,
                              }}
                              className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                            >
                              <Sparkles size={11} />
                              <span>AI Copilot</span>
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Mode 2: Kanban Pipeline View */}
        {viewMode === 'kanban' && (
          <div className="space-y-6">
            {/* Banner linking to Matched Jobs */}
            <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/60 p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Target size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Looking for new active roles?
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] px-2 py-0.5">
                      {matchedJobs.length} Matched Openings
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Your skills ({userSkills.slice(0, 3).join(', ')}{userSkills.length > 3 ? '...' : ''}) and experience level are active. Browse, 1-click apply, and auto-track into this pipeline.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('matches')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/30"
              >
                <span>Browse Matched Jobs</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* 2. Search & Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by company or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-9 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {filterTabs.map((tab) => {
                  const isSelected = activeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveFilter(tab.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                          isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Add Application Form Drawer */}
            {showForm && (
              <form onSubmit={handleCreate} className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-3.5 shadow-2xl">
                <div className="flex items-center justify-between pb-1">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Plus size={16} className="text-indigo-400" />
                    Track New Application
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-slate-400 hover:text-white"
                    aria-label="Close form"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Company *"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Role *"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {COLUMNS.map((col) => (
                      <option key={col.id} value={col.id}>{col.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Location (e.g. Bengaluru / Remote)"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Salary Range (e.g. ₹20-25 LPA / $140k)"
                    value={form.salaryRange}
                    onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="url"
                    placeholder="Job URL (https://...)"
                    value={form.jobUrl}
                    onChange={(e) => setForm({ ...form, jobUrl: e.target.value })}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Notes, referral contact, tech stack, or interview focus..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    aria-label="Save Card"
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors"
                  >
                    {submitting ? 'Saving...' : 'Save Card'}
                  </button>
                </div>
              </form>
            )}

            {/* 3. Edit Application Modal */}
            {editingApp && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
                <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                        <Edit3 size={18} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">Edit Application</h2>
                        <p className="text-xs text-slate-400">Update details for {editingApp.company}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingApp(null)}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      aria-label="Close modal"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {editError && (
                    <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-sm text-rose-300 flex items-center gap-2">
                      <AlertCircle size={15} />
                      <span>{editError}</span>
                    </div>
                  )}

                  <form onSubmit={handleEditSubmit} className="space-y-3.5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Company *</label>
                        <input
                          type="text"
                          required
                          value={editingApp.company}
                          onChange={(e) => setEditingApp({ ...editingApp, company: e.target.value })}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Role *</label>
                        <input
                          type="text"
                          required
                          value={editingApp.role}
                          onChange={(e) => setEditingApp({ ...editingApp, role: e.target.value })}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Stage / Column</label>
                        <select
                          value={editingApp.status}
                          onChange={(e) => setEditingApp({ ...editingApp, status: e.target.value })}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        >
                          {COLUMNS.map((col) => (
                            <option key={col.id} value={col.id}>{col.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Location</label>
                        <input
                          type="text"
                          placeholder="e.g. Remote / Bengaluru"
                          value={editingApp.location}
                          onChange={(e) => setEditingApp({ ...editingApp, location: e.target.value })}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Salary Range</label>
                        <input
                          type="text"
                          placeholder="e.g. ₹20-25 LPA"
                          value={editingApp.salaryRange}
                          onChange={(e) => setEditingApp({ ...editingApp, salaryRange: e.target.value })}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Job Link</label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={editingApp.jobUrl}
                          onChange={(e) => setEditingApp({ ...editingApp, jobUrl: e.target.value })}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Notes & Follow-up</label>
                      <textarea
                        rows={3}
                        placeholder="Key interview feedback, referral contact, or preparation notes..."
                        value={editingApp.notes}
                        onChange={(e) => setEditingApp({ ...editingApp, notes: e.target.value })}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setEditingApp(null)}
                        className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={editSubmitting}
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors"
                      >
                        {editSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Kanban Columns */}
            {loading ? (
              <div className="text-sm text-slate-400 py-16 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading your Kanban pipeline...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5 items-start">
                {COLUMNS.map((col) => {
                  const cardsInCol = grouped[col.id] || [];
                  return (
                    <div
                      key={col.id}
                      className={`rounded-2xl border-t-4 ${col.accent} border border-slate-800/90 bg-slate-900/60 p-3 min-h-[360px] flex flex-col justify-between`}
                    >
                      <div>
                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-3 px-1">
                          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                            <span>{col.label}</span>
                          </h2>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${col.badge}`}>
                            {cardsInCol.length}
                          </span>
                        </div>

                        {/* Cards List */}
                        <div className="space-y-2.5">
                          {cardsInCol.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-800/80 p-4 text-center text-xs text-slate-500">
                              No applications
                            </div>
                          ) : (
                            cardsInCol.map((card) => (
                              <article
                                key={card.id}
                                className="rounded-xl border border-slate-800 bg-slate-950/95 p-3 space-y-2.5 shadow-sm transition-all hover:border-slate-700 hover:shadow-md relative group"
                              >
                                {/* Card Header */}
                                <div className="flex items-start justify-between gap-1.5">
                                  <div className="min-w-0 flex-1">
                                    <h3 className="text-sm font-bold text-white truncate" title={card.role}>
                                      {card.role}
                                    </h3>
                                    <p className="text-xs text-slate-400 flex items-center gap-1 truncate" title={card.company}>
                                      <Building2 size={12} className="text-slate-500 shrink-0" />
                                      <span className="truncate">{card.company}</span>
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(card)}
                                      aria-label={`Edit ${card.company} ${card.role}`}
                                      title="Edit application"
                                      className="text-slate-400 hover:text-indigo-400 p-1 rounded-lg hover:bg-slate-900 transition-colors"
                                    >
                                      <Edit3 size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(card.id, card.company)}
                                      aria-label={`Delete ${card.company} ${card.role}`}
                                      title="Delete application"
                                      className="text-slate-400 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-900 transition-colors"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>

                                {/* Metadata Tags (Location & Salary) */}
                                {(card.location || card.salaryRange) && (
                                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                                    {card.location && (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 truncate max-w-[130px]" title={card.location}>
                                        <MapPin size={10} className="text-slate-400 shrink-0" />
                                        <span className="truncate">{card.location}</span>
                                      </span>
                                    )}
                                    {card.salaryRange && (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[10px] text-emerald-400 truncate max-w-[130px]" title={card.salaryRange}>
                                        <DollarSign size={10} className="text-emerald-400 shrink-0" />
                                        <span className="truncate">{card.salaryRange}</span>
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Notes */}
                                {card.notes && (
                                  <p className="text-xs text-slate-400 line-clamp-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60" title={card.notes}>
                                    {card.notes}
                                  </p>
                                )}

                                {/* Ecosystem Deep Links & Quick Actions */}
                                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-800/80">
                                  <div className="flex items-center gap-2">
                                    <Link
                                      to={`/company-prep?company=${encodeURIComponent(card.company)}`}
                                      className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                                      title={`Open interview prep tailored for ${card.company}`}
                                    >
                                      Prep →
                                    </Link>
                                    <Link
                                      to="/copilot"
                                      state={{
                                        jobDetails: { company: card.company, role: card.role, title: card.role },
                                        company: card.company,
                                        role: card.role,
                                      }}
                                      className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-400 hover:text-purple-300 transition-colors"
                                      title={`Prep with AI Copilot for ${card.role} at ${card.company}`}
                                    >
                                      <Sparkles size={11} />
                                      Copilot
                                    </Link>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleCopyFollowUp(card)}
                                      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                                        copiedId === card.id
                                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                                      }`}
                                      title="Copy follow-up email template to clipboard"
                                    >
                                      {copiedId === card.id ? (
                                        <>
                                          <Check size={10} className="text-emerald-400" />
                                          <span>Copied</span>
                                        </>
                                      ) : (
                                        <>
                                          <Mail size={10} />
                                          <span>Follow-up</span>
                                        </>
                                      )}
                                    </button>

                                    {card.jobUrl && (
                                      <a
                                        href={card.jobUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-900 transition-colors"
                                        aria-label="Open job posting"
                                        title="View job posting"
                                      >
                                        <ExternalLink size={12} />
                                      </a>
                                    )}
                                  </div>
                                </div>

                                {/* 4. Quick Stage Navigation (Move Left / Dropdown / Move Right) */}
                                <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/60">
                                  <button
                                    type="button"
                                    onClick={() => handleShiftStage(card, -1)}
                                    disabled={COLUMNS.findIndex((c) => c.id === card.status) === 0}
                                    title={`Move ${card.company} to previous stage`}
                                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-900 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                                    aria-label={`Move ${card.company} to previous stage`}
                                  >
                                    <ChevronLeft size={13} />
                                  </button>

                                  <select
                                    aria-label={`Move ${card.company} status`}
                                    value={card.status}
                                    onChange={(e) => handleStatusChange(card.id, e.target.value)}
                                    className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500"
                                  >
                                    {COLUMNS.map((opt) => (
                                      <option key={opt.id} value={opt.id}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>

                                  <button
                                    type="button"
                                    onClick={() => handleShiftStage(card, 1)}
                                    disabled={COLUMNS.findIndex((c) => c.id === card.status) === COLUMNS.length - 1}
                                    title={`Move ${card.company} to next stage`}
                                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-900 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                                    aria-label={`Move ${card.company} to next stage`}
                                  >
                                    <ChevronRight size={13} />
                                  </button>
                                </div>
                              </article>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Global Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-slate-700 bg-slate-900/95 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
            {toast.type === 'error' ? (
              <AlertCircle size={18} className="text-rose-400 shrink-0" />
            ) : toast.type === 'info' ? (
              <Sparkles size={18} className="text-cyan-400 shrink-0" />
            ) : (
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            )}
            <span className="font-medium text-xs sm:text-sm">{toast.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
