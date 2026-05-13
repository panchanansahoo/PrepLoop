import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCoins } from '../context/CoinContext';
import useDashboardData from '../hooks/useDashboardData';
import { buildAuthHeaders } from '../utils/authHeaders';
import {
  User, Mail, Briefcase, Award, GraduationCap, Shield, LogOut,
  Github, Sparkles, FileText, Upload, Pencil, Save, X,
  Zap, Copy, Check, Link2, Palette, Globe, PenSquare, LayoutGrid, Zap as Bolt,
  ChevronRight, Building, MapPin, Calendar, Code, Coffee, Users, Star,
  Phone, Calendar as CalendarIcon, MapPin as LocationIcon, 
  ExternalLink, Hash, Tag, Camera, TrendingUp, Target, Play, BarChart3, Trophy
} from 'lucide-react';
import AIMatchReportModal from '../components/AIMatchReportModal';
import ImportCenterModal from '../components/ImportCenterModal';
import './Profile.css';

/* ─── Animated counter hook ─── */
function useAnimatedCounter(target, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) { setCount(0); return; }
    let start = 0;
    const step = Math.max(1, Math.ceil(target / (duration / 16)));
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(id); }
      else setCount(start);
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return count;
}

/* ─── Sparkline SVG ─── */
function Sparkline({ data = [], color }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 100, h = 28;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ');
  const areaPoints = `0,${h} ${points} ${w},${h}`;
  return (
    <div className="du-sparkline-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs><linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color || '#2cee91'} stopOpacity="0.3" /><stop offset="1" stopColor={color || '#2cee91'} stopOpacity="0" /></linearGradient></defs>
        <polygon points={areaPoints} className="du-sparkline-area" />
        <polyline points={points} className="du-sparkline-line" style={color ? { stroke: color } : undefined} />
      </svg>
    </div>
  );
}

/* ─── Skill Radar Chart ─── */
function SkillRadar({ skills = {} }) {
  const categories = [
    { key: 'dsa', label: 'DSA' },
    { key: 'sql', label: 'SQL' },
    { key: 'aptitude', label: 'Aptitude' },
    { key: 'systemDesign', label: 'System Design' },
    { key: 'behavioral', label: 'Behavioral' }
  ];
  const cx = 100, cy = 100, maxR = 70;
  const n = categories.length;
  const angleStep = (2 * Math.PI) / n;
  
  const getPoint = (index, value) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (Math.min(value, 100) / 100) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };
  
  const getGridPoints = (radius) => {
    return Array.from({ length: n }, (_, i) => {
      const angle = angleStep * i - Math.PI / 2;
      return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
    }).join(' ');
  };

  const dataPoints = categories.map((cat, i) => getPoint(i, skills[cat.key] || 0));
  const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="du-radar-wrap">
      <svg width="200" height="200" viewBox="0 0 200 200">
        {[1, 0.66, 0.33].map((scale, idx) => (
          <polygon key={idx} points={getGridPoints(maxR * scale)} className={idx === 0 ? 'du-radar-grid' : 'du-radar-grid-inner'} />
        ))}
        {categories.map((_, i) => {
          const p = getPoint(i, 100);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} className="du-radar-axis" />;
        })}
        <polygon points={polygonPoints} className="du-radar-area" />
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" className="du-radar-dot" style={{ animationDelay: `${0.8 + i * 0.15}s` }} />
        ))}
        {categories.map((cat, i) => {
          const labelP = getPoint(i, 130);
          const valP = getPoint(i, 115);
          return (
            <g key={cat.key}>
              <text x={labelP.x} y={labelP.y} className="du-radar-label" dominantBaseline="central">{cat.label}</text>
              <text x={valP.x} y={valP.y + 12} className="du-radar-value" dominantBaseline="central">{skills[cat.key] || 0}%</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── Profile Completion Ring ─── */
function ProfileCompletionRing({ profile, onClickMissing }) {
  const fields = [
    { key: 'fullName', label: 'Name' },
    { key: 'bio', label: 'Bio' },
    { key: 'currentRole', label: 'Role' },
    { key: 'company', label: 'Company' },
    { key: 'location', label: 'Location' },
    { key: 'skills', label: 'Skills' },
    { key: 'education', label: 'Education' },
    { key: 'phone', label: 'Phone' },
    { key: 'website', label: 'Website' },
    { key: 'experience', label: 'Experience' }
  ];
  const filled = fields.filter(f => String(profile[f.key] || '').trim().length > 0);
  const pct = Math.round((filled.length / fields.length) * 100);
  const missing = fields.filter(f => !String(profile[f.key] || '').trim());
  const r = 48, circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="du-completion-card">
      <div className="du-completion-ring-wrap">
        <svg viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} className="du-completion-ring-track" />
          <circle cx="60" cy="60" r={r} className="du-completion-ring-fill"
            strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <div className="du-completion-pct">
          <span className="du-completion-pct-num">{pct}%</span>
          <span className="du-completion-pct-label">Complete</span>
        </div>
      </div>
      <p className="du-completion-title">{pct === 100 ? '🎉 Profile Complete!' : 'Complete Your Profile'}</p>
      {missing.length > 0 && (
        <ul className="du-completion-missing">
          {missing.slice(0, 4).map(f => (
            <li key={f.key}><button type="button" className="du-completion-missing-btn" onClick={() => onClickMissing?.(f.key)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClickMissing?.(f.key); }} aria-label={`Add ${f.label}`} >+ {f.label}</button></li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─── Achievement Badges ─── */
function AchievementBadges({ dashboardData, interviewsDone }) {
  const solved = dashboardData?.stats?.problemsSolved || 0;
  const streak = dashboardData?.streak || 0;
  const quizzes = dashboardData?.stats?.totalSubmissions || 0;

  const badges = [
    { icon: '🚀', name: 'First Steps', unlocked: solved >= 1 },
    { icon: '🔥', name: '3-Day Streak', unlocked: streak >= 3 },
    { icon: '⚡', name: '10 Problems', unlocked: solved >= 10 },
    { icon: '🎯', name: 'First Interview', unlocked: interviewsDone >= 1 },
    { icon: '💎', name: '50 Problems', unlocked: solved >= 50 },
    { icon: '🏆', name: '7-Day Streak', unlocked: streak >= 7 },
    { icon: '🧠', name: 'Quiz Master', unlocked: quizzes >= 20 },
    { icon: '👑', name: '100 Problems', unlocked: solved >= 100 },
  ];

  return (
    <div className="du-badges-grid">
      {badges.map(b => (
        <div key={b.name} className={`du-badge-item ${b.unlocked ? 'unlocked' : 'locked'}`}>
          <span className="du-badge-icon">{b.icon}</span>
          <span className="du-badge-name">{b.name}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Activity Timeline ─── */
function ActivityTimeline({ activities = [] }) {
  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const getType = (activity) => {
    const t = String(activity?.type || activity?.action || '').toLowerCase();
    if (t.includes('interview')) return 'interview';
    if (t.includes('quiz')) return 'quiz';
    if (t.includes('achievement') || t.includes('badge')) return 'achievement';
    return 'practice';
  };

  const items = activities.slice(0, 6);
  if (!items.length) return <p style={{ color: '#52525b', fontSize: 13 }}>No recent activity yet. Start practicing!</p>;

  return (
    <div className="du-timeline">
      {items.map((a, i) => (
        <div key={i} className="du-timeline-item" style={{ animationDelay: `${i * 0.1}s` }}>
          <div className={`du-timeline-dot type-${getType(a)}`} />
          <div className="du-timeline-content">
            <span className="du-timeline-text">{a.title || a.description || a.action || 'Activity'}</span>
            <span className="du-timeline-time">{formatTime(a.timestamp || a.created_at || a.date)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}


/* ─── Data helpers (unchanged logic) ─── */
const MOCK_JOB_MATCHES = [
  { id: 1, title: 'Software Engineer Trainee', company: 'Roku', matchScore: 85 },
  { id: 2, title: 'Frontend Developer', company: 'Google', matchScore: 78 },
  { id: 3, title: 'Full Stack Engineer', company: 'Stripe', matchScore: 92 }
];

function buildInitialProfile(user) {
  return {
    fullName: user?.fullName || '',
    full_name: user?.fullName || '',
    email: user?.email || '',
    bio: '',
    currentRole: '',
    designation: '',
    experience: '',
    experienceLevel: '',
    experience_level: '',
    skills: '',
    education: '',
    githubUsername: '',
    phone: '',
    location: '',
    website: '',
    company: '',
    yearsOfExperience: '',
    specialization: '',
    socialLinks: {
      twitter: '',
      linkedin: '',
      portfolio: '',
      dribbble: ''
    }
  };
}

function normalizeProfileData(data) {
  return {
    fullName: data?.fullName ?? data?.full_name ?? '',
    full_name: data?.full_name ?? data?.fullName ?? '',
    email: data?.email ?? '',
    bio: data?.bio ?? '',
    currentRole: data?.currentRole ?? data?.designation ?? data?.role_title ?? '',
    designation: data?.designation ?? data?.currentRole ?? '',
    experience: data?.experience ?? data?.experienceLevel ?? data?.experience_level ?? '',
    experienceLevel: data?.experienceLevel ?? data?.experience_level ?? '',
    experience_level: data?.experience_level ?? data?.experienceLevel ?? '',
    skills: data?.skills ?? '',
    education: data?.education ?? '',
    githubUsername: data?.githubUsername ?? data?.github_username ?? '',
    phone: data?.phone ?? '',
    location: data?.location ?? '',
    website: data?.website ?? '',
    company: data?.company ?? '',
    yearsOfExperience: data?.yearsOfExperience ?? '',
    specialization: data?.specialization ?? '',
    socialLinks: data?.socialLinks ?? {
      twitter: data?.twitter ?? '',
      linkedin: data?.linkedin ?? '',
      portfolio: data?.portfolio ?? '',
      dribbble: data?.dribbble ?? ''
    }
  };
}

function buildProfilePayload(profile) {
  const trimmedFullName = profile.fullName?.trim() || '';
  const trimmedCurrentRole = profile.currentRole?.trim() || '';
  const trimmedExperience = profile.experience?.trim() || '';
  const trimmedCompany = profile.company?.trim() || '';
  const trimmedYearsExp = profile.yearsOfExperience?.trim() || '';
  const trimmedSpecialization = profile.specialization?.trim() || '';
  
  return {
    ...profile,
    fullName: trimmedFullName,
    full_name: trimmedFullName,
    currentRole: trimmedCurrentRole,
    designation: trimmedCurrentRole,
    experience: trimmedExperience,
    experienceLevel: trimmedExperience,
    experience_level: trimmedExperience,
    skills: profile.skills?.trim() || '',
    education: profile.education?.trim() || '',
    bio: profile.bio?.trim() || '',
    githubUsername: profile.githubUsername?.trim() || '',
    github_username: profile.githubUsername?.trim() || '',
    phone: profile.phone?.trim() || '',
    location: profile.location?.trim() || '',
    website: profile.website?.trim() || '',
    company: trimmedCompany,
    yearsOfExperience: trimmedYearsExp,
    specialization: trimmedSpecialization,
    socialLinks: profile.socialLinks || {},
    projects: Array.isArray(profile.projects) ? profile.projects : [],
    certifications: Array.isArray(profile.certifications) ? profile.certifications : []
  };
}

function splitSkillChips(skillsValue = '', resumeProfile = null) {
  const explicitSkills = String(skillsValue || '')
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);

  const inferredSkills = Array.isArray(resumeProfile?.coreSkills)
    ? resumeProfile.coreSkills.map((skill) => String(skill || '').trim()).filter(Boolean)
    : [];

  const merged = [...explicitSkills, ...inferredSkills];
  const deduped = [];
  const seen = new Set();

  merged.forEach((skill) => {
    const key = skill.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(skill);
  });

  return deduped.slice(0, 14);
}

function splitExperiencePoints(profileExperience = '', resumeProfile = null) {
  const normalized = String(profileExperience || '').trim();

  if (!normalized) {
    return Array.isArray(resumeProfile?.likelyQuestionAreas)
      ? resumeProfile.likelyQuestionAreas.slice(0, 4)
      : [];
  }

  const bullets = normalized
    .split(/\n|\.|;/)
    .map((part) => part.trim())
    .filter((part) => part.length > 5)
    .slice(0, 4);

  if (bullets.length) return bullets;
  return [normalized];
}

function hasNonEmptyText(value) {
  return String(value || '').trim().length > 0;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isHighConfidenceHeadline(value) {
  const headline = String(value || '').trim();
  if (headline.length < 10) return false;
  const low = headline.toLowerCase();
  if (low.includes('student candidate')) return false;
  if (low.includes('candidate with')) return false;
  if (low.includes('project-based experience')) return false;
  return true;
}

function filterHighConfidenceExperienceAreas(items = []) {
  const knownFallbacks = [
    'projects mentioned on the resume',
    'technical choices and trade-offs',
    'ownership and collaboration examples'
  ];

  return items
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((item) => item.length > 8)
    .filter((item) => !knownFallbacks.includes(item.toLowerCase()));
}

const AUTOFILL_FIELD_LABELS = {
  fullName: 'Full Name',
  currentRole: 'Current Role',
  skills: 'Skills',
  experience: 'Experience',
  bio: 'Bio',
  education: 'Education',
  location: 'Location',
  company: 'Company'
};

export default function Profile() {
  const { user, logout } = useAuth();
  const { refreshBalance } = useCoins();
  const { data: dashboardData } = useDashboardData();

  const [profile, setProfile] = useState({ ...buildInitialProfile(user) });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle', 'saved', 'error'
  const [rewardMessage, setRewardMessage] = useState('');
  
  // Portfolio connection status
  const [portfolioStatus, setPortfolioStatus] = useState({
    hasResume: false,
    hasGithub: false,
    hasLinkedIn: false,
    isPortfolioGenerated: false,
    portfolioUrl: null
  });
  const [selectedTemplate, setSelectedTemplate] = useState('minimal-professional');
  const [selectedTheme, setSelectedTheme] = useState('light');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [importingLinkedIn, setImportingLinkedIn] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [resumeSnapshot, setResumeSnapshot] = useState(null);
  const [autofillSuggestions, setAutofillSuggestions] = useState({});
  const [linkedinImporting, setLinkedinImporting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [resumeUploading, setResumeUploading] = useState(false);
  const [importCenterOpen, setImportCenterOpen] = useState(false);
  const [profileProjects, setProfileProjects] = useState([]);
  const [profileCertifications, setProfileCertifications] = useState([]);
  const [portfolioSlug, setPortfolioSlug] = useState('');
  const [portfolioTemplate, setPortfolioTemplate] = useState('minimal-professional');
  const [portfolioTheme, setPortfolioTheme] = useState('light');
  const [publishedUrl, setPublishedUrl] = useState('');
  const [publishingPortfolio, setPublishingPortfolio] = useState(false);
  const hasAutofilledFromResumeRef = useRef(false);
  const resumeFileRef = useRef(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile', { headers: buildAuthHeaders(user) });
      if (res.ok) {
        const data = await res.json();
        const normalized = {
          ...normalizeProfileData(data),
          ...normalizeProfileData(data?.user)
        };
        const userData = data?.user || {};
        const rawProjects = userData.projects || data?.projects || [];
        const rawCertifications = userData.certifications || data?.certifications || [];
        const portfolioData = userData.portfolio_data || data?.portfolio_data || {};

        setProfile((prev) => ({
          ...prev,
          ...normalized,
          portfolioData
        }));

        setProfileProjects(Array.isArray(rawProjects) ? rawProjects : []);
        setProfileCertifications(Array.isArray(rawCertifications) ? rawCertifications : []);
        setIsPublic(Boolean(portfolioData?.isPublished));
        setPublishedUrl(portfolioData?.publishedUrl || '');
        setPortfolioSlug(portfolioData?.slug || slugify(normalized.fullName || user?.fullName || user?.email || 'portfolio'));
        setPortfolioTemplate(portfolioData?.template || 'minimal-professional');
        setPortfolioTheme(portfolioData?.theme || 'light');

        if (normalized.githubUsername) {
          setGithubUsername(normalized.githubUsername);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  const fetchLatestResumeSnapshot = useCallback(async () => {
    try {
      const res = await fetch('/api/resume/latest', { headers: buildAuthHeaders(user) });
      if (!res.ok) return;
      const data = await res.json();
      setResumeSnapshot(data?.resumeProfile || null);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
    fetchLatestResumeSnapshot();
  }, [fetchProfile, fetchLatestResumeSnapshot]);

  useEffect(() => {
    if (!resumeSnapshot || hasAutofilledFromResumeRef.current) return;

    const inferredSkills = Array.isArray(resumeSnapshot?.coreSkills)
      ? resumeSnapshot.coreSkills.map((skill) => String(skill || '').trim()).filter(Boolean)
      : [];

    const inferredExperience = Array.isArray(resumeSnapshot?.likelyQuestionAreas)
      ? filterHighConfidenceExperienceAreas(resumeSnapshot.likelyQuestionAreas)
      : [];

    const safeHeadline = isHighConfidenceHeadline(resumeSnapshot?.candidateHeadline)
      ? String(resumeSnapshot.candidateHeadline).trim()
      : '';

    const safeSkills = inferredSkills.filter((skill) => skill.length >= 2);
    const safeSummary = (() => {
      const summary = String(resumeSnapshot?.summary || '').trim();
      if (summary.length < 40) return '';
      if (summary.toLowerCase().includes('focus on the candidate')) return '';
      return summary;
    })();

    let applied = false;
    let pendingSuggestions = {};
    setProfile((prev) => {
      const next = { ...prev };

      // Name from resume
      const resumeName = String(resumeSnapshot?.candidateName || resumeSnapshot?.name || '').trim();
      if (!hasNonEmptyText(prev.fullName) && resumeName.length >= 3) {
        next.fullName = resumeName;
        next.full_name = resumeName;
        pendingSuggestions.fullName = { previous: prev.fullName || '' };
        applied = true;
      }

      if (!hasNonEmptyText(prev.currentRole) && hasNonEmptyText(safeHeadline)) {
        next.currentRole = safeHeadline;
        next.designation = safeHeadline;
        pendingSuggestions.currentRole = { previous: prev.currentRole || '' };
        applied = true;
      }

      if (!hasNonEmptyText(prev.skills) && safeSkills.length >= 2) {
        next.skills = safeSkills.join(', ');
        pendingSuggestions.skills = { previous: prev.skills || '' };
        applied = true;
      }

      if (!hasNonEmptyText(prev.experience) && inferredExperience.length) {
        next.experience = inferredExperience.join('; ');
        next.experienceLevel = inferredExperience.join('; ');
        next.experience_level = inferredExperience.join('; ');
        pendingSuggestions.experience = { previous: prev.experience || '' };
        applied = true;
      }

      if (!hasNonEmptyText(prev.bio) && hasNonEmptyText(safeSummary)) {
        next.bio = safeSummary;
        pendingSuggestions.bio = { previous: prev.bio || '' };
        applied = true;
      }

      if (Array.isArray(resumeSnapshot?.projectHighlights) && resumeSnapshot.projectHighlights.length > 0) {
        const projectText = resumeSnapshot.projectHighlights.slice(0, 2).join('. ');
        if (!hasNonEmptyText(prev.bio) && hasNonEmptyText(projectText)) {
          next.bio = projectText;
          pendingSuggestions.bio = { previous: prev.bio || '' };
          applied = true;
        }
      }

      // Education from resume
      const resumeEducation = String(resumeSnapshot?.education || resumeSnapshot?.educationSummary || '').trim();
      if (!hasNonEmptyText(prev.education) && resumeEducation.length >= 5) {
        next.education = resumeEducation;
        pendingSuggestions.education = { previous: prev.education || '' };
        applied = true;
      }

      // Location from resume
      const resumeLocation = String(resumeSnapshot?.location || resumeSnapshot?.candidateLocation || '').trim();
      if (!hasNonEmptyText(prev.location) && resumeLocation.length >= 3) {
        next.location = resumeLocation;
        pendingSuggestions.location = { previous: prev.location || '' };
        applied = true;
      }

      // Company from resume
      const resumeCompany = String(resumeSnapshot?.company || resumeSnapshot?.currentCompany || resumeSnapshot?.latestCompany || '').trim();
      if (!hasNonEmptyText(prev.company) && resumeCompany.length >= 2) {
        next.company = resumeCompany;
        pendingSuggestions.company = { previous: prev.company || '' };
        applied = true;
      }

      // Phone from resume
      const resumePhone = String(resumeSnapshot?.phone || resumeSnapshot?.contactPhone || '').trim();
      if (!hasNonEmptyText(prev.phone) && resumePhone.length >= 7) {
        next.phone = resumePhone;
        applied = true;
      }

      // Website / portfolio from resume
      const resumeWebsite = String(resumeSnapshot?.website || resumeSnapshot?.portfolio || resumeSnapshot?.linkedinUrl || '').trim();
      if (!hasNonEmptyText(prev.website) && resumeWebsite.length >= 5) {
        next.website = resumeWebsite;
        applied = true;
      }

      return applied ? next : prev;
    });

    if (applied && Object.keys(pendingSuggestions).length > 0) {
      setAutofillSuggestions((prev) => ({ ...prev, ...pendingSuggestions }));
    }
    hasAutofilledFromResumeRef.current = true;
  }, [resumeSnapshot]);

  useEffect(() => {
    if (status !== 'saved' && status !== 'error') return undefined;
    const timer = window.setTimeout(() => setStatus('idle'), 3000);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (!rewardMessage) return undefined;
    const timer = window.setTimeout(() => setRewardMessage(''), 4000);
    return () => window.clearTimeout(timer);
  }, [rewardMessage]);

  const handleSave = async () => {
    setSaving(true);
    setStatus('idle');
    try {
      const payload = buildProfilePayload({
        ...profile,
        projects: profileProjects,
        certifications: profileCertifications,
      });
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: buildAuthHeaders(user),
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Your profile couldn\'t be saved. Please try again.');
      const data = await res.json();
      
      const normalized = normalizeProfileData(data);
      setProfile(prev => ({ ...prev, ...normalized }));
      
      if (data?.coinsAwarded) {
        setRewardMessage(`+${data.coinsAwarded} coins earned for completing your profile.`);
      }
      refreshBalance();
      setEditing(false);
      setStatus('saved');
      setAutofillSuggestions({});
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
    setSaving(false);
  };

  const handleGithubConnect = async () => {
    const githubUsername = prompt('Enter your GitHub username:');
    if (!githubUsername) return;

    try {
      setPublishingPortfolio(true);
      const res = await fetch('/api/portfolio/connect/github', {
        method: 'POST',
        headers: buildAuthHeaders(user),
        body: JSON.stringify({ githubUsername })
      });

      if (!res.ok) throw new Error('GitHub connection failed');
      const data = await res.json();

      if (data.success) {
        setRewardMessage('GitHub connected successfully!');
        setProfile(prev => ({
          ...prev,
          githubUsername: githubUsername
        }));
        setStatus('saved');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setPublishingPortfolio(false);
    }
  };

  const handleGithubDisconnect = async () => {
    setSaving(true);
    setStatus('idle');
    try {
      const payload = buildProfilePayload({ ...profile, githubUsername: '' });
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: buildAuthHeaders(user),
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('We couldn\'t disconnect GitHub. Please try again.');
      setProfile(prev => ({ ...prev, githubUsername: '' }));
      setGithubUsername('');
      setStatus('saved');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
    setSaving(false);
  };

  const handleCopyLink = () => {
    const link = publishedUrl || `${window.location.origin}/u/${portfolioSlug || slugify(displayName)}`;
    navigator.clipboard.writeText(link).catch(() => { /* fallback */ });
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handlePublishPortfolio = async () => {
    setPublishingPortfolio(true);
    setStatus('idle');

    try {
      const linkedinHandle = profile.socialLinks?.linkedin || '';
      const normalizedLinkedinUrl = linkedinHandle
        ? (linkedinHandle.startsWith('http') ? linkedinHandle : `https://www.linkedin.com/in/${linkedinHandle.replace(/^@/, '')}`)
        : '';

      const response = await fetch('/api/portfolio/generate', {
        method: 'POST',
        headers: buildAuthHeaders(user),
        body: JSON.stringify({
          slug: portfolioSlug || slugify(displayName || user?.email || 'portfolio'),
          template: portfolioTemplate,
          theme: portfolioTheme,
          githubUsername: profile.githubUsername || githubUsername,
          linkedinUrl: normalizedLinkedinUrl,
          linkedinData: {
            name: profile.fullName,
            headline: profile.currentRole,
            about: profile.bio,
            skills: profile.skills,
            experience: profile.experience,
            education: profile.education,
            location: profile.location,
            company: profile.company,
            website: profile.website,
            phone: profile.phone,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Publishing failed');
      }

      const data = await response.json();
      const generatedPortfolio = data?.portfolio || {};
      const generatedProjects = generatedPortfolio?.featuredProjects || [];

      setPublishedUrl(data?.publishedUrl || '');
      setPortfolioSlug(data?.slug || portfolioSlug);
      setIsPublic(true);
      if (Array.isArray(generatedProjects) && generatedProjects.length > 0) {
        setProfileProjects(generatedProjects);
      }

      setRewardMessage('Portfolio published successfully.');
      setStatus('saved');
    } catch (error) {
      console.error(error);
      setStatus('error');
    } finally {
      setPublishingPortfolio(false);
    }
  };

  const handleChange = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setAutofillSuggestions((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleChangeSocial = (platform, value) => {
    setProfile(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  const handleAcceptAutofillField = (key) => {
    setAutofillSuggestions((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleUndoAutofillField = (key) => {
    const suggestion = autofillSuggestions[key];
    if (!suggestion) return;
    setProfile((prev) => ({ ...prev, [key]: suggestion.previous || '' }));
    setAutofillSuggestions((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Handle resume upload
  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF, DOC, or DOCX file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setUploadingResume(true);
        const fileData = e.target.result.split(',')[1]; // Get base64 part
        
        const res = await fetch('/api/portfolio/upload/resume', {
          method: 'POST',
          headers: buildAuthHeaders(user),
          body: JSON.stringify({
            fileData,
            fileName: file.name,
            fileType: file.type.split('/')[1] // pdf, msword, or vnd.openxmlformats...
          })
        });

        if (!res.ok) throw new Error('Resume upload failed');
        const data = await res.json();

        if (data.success) {
          setRewardMessage('Resume uploaded and processed successfully!');
          setStatus('saved');
        }
      } catch (err) {
        console.error(err);
        setStatus('error');
      } finally {
        setUploadingResume(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Generate portfolio
  const handlePortfolioGeneration = async () => {
    setPublishingPortfolio(true);
    try {
      const res = await fetch('/api/portfolio/generate', {
        method: 'POST',
        headers: { ...buildAuthHeaders(user), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: selectedTemplate || 'minimal-professional',
          theme: selectedTheme || 'light',
          slug: portfolioSlug || slugify(displayName),
          githubUsername: profile.githubUsername,
          linkedinUrl: profile.socialLinks?.linkedin
        })
      });

      if (!res.ok) throw new Error('Portfolio generation failed');
      const data = await res.json();

      if (data.success) {
        setPublishedUrl(data.publishedUrl);
        setPortfolioSlug(data.slug);
        setIsPublic(true);
        setRewardMessage('Portfolio generated successfully!');
        setStatus('saved');
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
    } finally {
      setPublishingPortfolio(false);
    }
  };

  // Check portfolio connection status
  const checkPortfolioStatus = async () => {
    try {
      const res = await fetch('/api/portfolio/status', {
        headers: buildAuthHeaders(user)
      });

      if (!res.ok) throw new Error('Failed to get portfolio status');
      const status = await res.json();
      
      setPortfolioStatus(status);
    } catch (err) {
      console.error('Error checking portfolio status:', err);
    }
  };

  const handleLinkedInImport = async () => {
    const linkedinUrl = prompt('Paste your LinkedIn profile URL:');
    if (!linkedinUrl) return;

    setLinkedinImporting(true);
    try {
      const res = await fetch('/api/portfolio/connect/linkedin', {
        method: 'POST',
        headers: buildAuthHeaders(user),
        body: JSON.stringify({ linkedinUrl })
      });

      if (!res.ok) throw new Error('LinkedIn connection failed');
      const data = await res.json();

      if (data.success) {
        setRewardMessage('LinkedIn connected successfully!');
        setStatus('saved');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
    setLinkedinImporting(false);
  };

  // ── Computed display values ──
  const displayName = profile.fullName || user?.fullName || 'User';
  const emailDisplay = user?.email || profile.email || 'Not set';
  const roleDisplay = profile.currentRole || profile.designation || 'Not set';
  const companyDisplay = profile.company || 'Not set';
  const locationDisplay = profile.location || 'Not set';
  const yearsExpDisplay = profile.yearsOfExperience || 'Not specified';
  const specializationDisplay = profile.specialization || 'Not specified';
  const initial = (displayName.charAt(0) || 'U').toUpperCase();
  const profileLink = publishedUrl || `${window.location.origin}/u/${portfolioSlug || slugify(displayName)}`;
  const profileSummary = profile.bio || 'No bio added yet. Add a brief summary to make your profile stand out.';
  const resumeAutofillApplied = Object.keys(autofillSuggestions).length > 0;

  const skillChips = splitSkillChips(profile.skills, resumeSnapshot);
  const experiencePoints = splitExperiencePoints(profile.experience, resumeSnapshot);
  const projects = profile.projects || [];

  // Dashboard derived data
  const stats = dashboardData?.stats || {};
  const skillBreakdown = dashboardData?.skillBreakdown || { Arrays: 0, Strings: 0, Trees: 0, Graphs: 0, DP: 0 };
  const recentActivity = dashboardData?.recentActivity || [];
  const interviewsDone = stats.interviewsDone || 0;
  const currentStreak = stats.currentStreak || 0;
  const bestStreak = stats.bestStreak || 0;
  const totalXP = stats.totalXP || 0;
  const aiMatches = stats.aiMatches || 0;
  const coverLetters = stats.coverLetters || 0;

  // Level calculation
  const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000];
  const levelNames = ['Beginner', 'Apprentice', 'Practitioner', 'Specialist', 'Expert', 'Master', 'Grandmaster', 'Legend', 'Mythic', 'Transcendent'];
  let currentLevel = 0;
  for (let i = levelThresholds.length - 1; i >= 0; i--) {
    if (totalXP >= levelThresholds[i]) { currentLevel = i; break; }
  }
  const rank = levelNames[currentLevel] || 'Beginner';
  const currentLevelXP = totalXP - (levelThresholds[currentLevel] || 0);
  const nextLevelXP = (levelThresholds[currentLevel + 1] || levelThresholds[currentLevel] + 1000) - (levelThresholds[currentLevel] || 0);

  const handleCompletionClick = (fieldKey) => {
    setEditing(true);
    const fieldToTab = { fullName: 'basic', bio: 'basic', phone: 'basic', location: 'basic', website: 'basic',
      currentRole: 'professional', company: 'professional', skills: 'professional', education: 'professional', experience: 'professional' };
    setActiveTab(fieldToTab[fieldKey] || 'basic');
  };

  const handleImportApply = useCallback(async (updates) => {
    const { _importSource, _importTimestamp, projects: importedProjects, ...profileUpdates } = updates;

    // Apply profile field updates
    setProfile(prev => {
      const next = { ...prev };
      Object.entries(profileUpdates).forEach(([key, value]) => {
        if (key === 'githubUsername') {
          next.githubUsername = value;
          setGithubUsername(value);
        } else if (typeof value === 'string') {
          next[key] = value;
        }
      });
      return next;
    });

    // Apply projects
    if (Array.isArray(importedProjects) && importedProjects.length > 0) {
      setProfileProjects(prev => {
        const existing = new Set(prev.map(p => p.name?.toLowerCase()));
        const newProjects = importedProjects.filter(p => !existing.has(p.name?.toLowerCase()));
        return [...prev, ...newProjects].slice(0, 20);
      });
    }

    setRewardMessage(`Profile updated from ${_importSource || 'import'}! Review and save to keep changes.`);
    setEditing(true);
  }, []);

  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null;

  // Skill radar percentages (normalize from breakdown)
  const maxSkill = Math.max(...Object.values(skillBreakdown), 1);
  const radarSkills = Object.fromEntries(
    Object.entries(skillBreakdown).map(([k, v]) => [k, Math.round((v / maxSkill) * 100)])
  );

  return (
    <div className="du-profile">
      {/* ═══ Profile Header ═══ */}
      <div className="du-profile-header">
        <div className="du-profile-identity">
          <div className="du-profile-left">
            <div className="du-avatar">
              {initial}
              <span className="du-avatar-online" />
              {editing && (
                <button className="du-change-photo-btn" type="button">
                  <Camera size={14} />
                  Change Photo
                </button>
              )}
            </div>
            <div className="du-profile-info">
              <h1 className="du-profile-name">
                {displayName}
                <button className="du-name-edit" type="button" aria-label="Edit display name" onClick={() => setEditing(true)}>
                  <PenSquare size={14} />
                </button>
              </h1>
              <p className="du-profile-email">{emailDisplay}</p>
              
              <div className="du-profile-tags">
                <span className="du-tag">
                  <Briefcase size={12} />
                  {roleDisplay}
                </span>
                <span className="du-tag">
                  <Building size={12} />
                  {companyDisplay}
                </span>
                <span className="du-tag">
                  <MapPin size={12} />
                  {locationDisplay}
                </span>
              </div>
              
              <span className="du-plan-badge">
                <Sparkles size={12} />
                Explorer (Free)
              </span>
              {memberSince && (
                <span className="du-member-since">
                  <Calendar size={12} /> Member since {memberSince}
                </span>
              )}
            </div>
          </div>

          <div className="du-profile-meta">
            <div className="du-meta-row">
              <div className="du-meta-left">
                <Globe size={16} />
                <div>
                  <p className="du-meta-title">Profile is {isPublic ? 'Public' : 'Private'}</p>
                  <p className="du-meta-subtitle">Anyone with the link can view your profile</p>
                </div>
              </div>
              <button
                className={`du-toggle ${isPublic ? 'is-on' : ''}`}
                onClick={() => setIsPublic(!isPublic)}
                aria-label="Toggle profile visibility"
                type="button"
              >
                <span className="du-toggle-knob" />
              </button>
              <button className="du-copy-btn" onClick={handleCopyLink} type="button">
                {linkCopied ? <Check size={12} /> : <Copy size={12} />}
                {linkCopied ? 'Copied' : 'Copy Public Link'}
              </button>
            </div>

            <div className="du-meta-row">
              <div className="du-meta-left">
                <Link2 size={16} />
                <div>
                  <p className="du-meta-title">Public Profile Link</p>
                  <p className="du-meta-subtitle du-profile-url">{profileLink}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  className="du-form-input"
                  value={portfolioSlug}
                  onChange={(e) => setPortfolioSlug(slugify(e.target.value))}
                  placeholder="slug"
                  style={{ width: '140px' }}
                />
                <select
                  className="du-form-input"
                  value={portfolioTemplate}
                  onChange={(e) => setPortfolioTemplate(e.target.value)}
                  style={{ width: '168px' }}
                >
                  <option value="minimal-professional">Minimal professional</option>
                  <option value="developer-dark">Developer dark theme</option>
                  <option value="creative-modern">Creative modern</option>
                  <option value="fresher-student">Fresher/student profile</option>
                </select>
                <select
                  className="du-form-input"
                  value={portfolioTheme}
                  onChange={(e) => setPortfolioTheme(e.target.value)}
                  style={{ width: '112px' }}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="creative">Creative</option>
                  <option value="student">Student</option>
                </select>
                <button
                  className="du-claim-btn"
                  type="button"
                  onClick={handlePublishPortfolio}
                  disabled={publishingPortfolio}
                >
                  {publishingPortfolio ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* ═══ Two Column Grid ═══ */}
      <div className="du-profile-grid">

        {/* ─── Main Column ─── */}
        <div className="du-main-col">
          {/* Profile Navigation Tabs */}
          <div className="du-tabs">
            <button 
              className={`du-tab ${activeTab === 'basic' ? 'active' : ''}`}
              onClick={() => setActiveTab('basic')}
            >
              <User size={16} />
              Basic Info
            </button>
            <button 
              className={`du-tab ${activeTab === 'professional' ? 'active' : ''}`}
              onClick={() => setActiveTab('professional')}
            >
              <Briefcase size={16} />
              Professional
            </button>
            <button 
              className={`du-tab ${activeTab === 'social' ? 'active' : ''}`}
              onClick={() => setActiveTab('social')}
            >
              <Users size={16} />
              Social Links
            </button>
            <button 
              className={`du-tab ${activeTab === 'portfolio' ? 'active' : ''}`}
              onClick={() => setActiveTab('portfolio')}
            >
              <Globe size={16} />
              Portfolio
            </button>
          </div>

          {/* ═══ Portfolio Builder Tab Content ═══ */}
          {activeTab === 'portfolio' && (
            <div className="du-card du-portfolio-builder">
              <div className="du-card-header">
                <h2 className="du-card-title">
                  <Globe /> Portfolio Builder
                </h2>
                <span className="du-card-badge">{isPublic ? '🟢 Published' : '🔴 Draft'}</span>
              </div>

              {/* Connection Status */}
              <div className="du-portfolio-connections">
                <h3 className="du-section-label">Data Sources</h3>
                <div className="du-connection-grid">
                  <div className={`du-connection-card ${profile.githubUsername ? 'connected' : ''}`}>
                    <Github size={20} />
                    <div>
                      <strong>GitHub</strong>
                      <span>{profile.githubUsername || 'Not connected'}</span>
                    </div>
                    {profile.githubUsername && <Check size={16} className="du-check-icon" />}
                  </div>
                  <div className={`du-connection-card ${resumeSnapshot ? 'connected' : ''}`}>
                    <FileText size={20} />
                    <div>
                      <strong>Resume</strong>
                      <span>{resumeSnapshot ? 'Uploaded' : 'Not uploaded'}</span>
                    </div>
                    {resumeSnapshot && <Check size={16} className="du-check-icon" />}
                  </div>
                  <div className={`du-connection-card ${profile.socialLinks?.linkedin ? 'connected' : ''}`}>
                    <Users size={20} />
                    <div>
                      <strong>LinkedIn</strong>
                      <span>{profile.socialLinks?.linkedin || 'Not connected'}</span>
                    </div>
                    {profile.socialLinks?.linkedin && <Check size={16} className="du-check-icon" />}
                  </div>
                </div>
              </div>

              {/* Template Picker */}
              <div className="du-portfolio-templates">
                <h3 className="du-section-label">Choose Template</h3>
                <div className="du-template-grid">
                  {[
                    { id: 'minimal-professional', name: 'Minimal Professional', desc: 'Clean & elegant', color: '#2563eb' },
                    { id: 'developer-dark', name: 'Developer Dark', desc: 'Terminal-inspired', color: '#22d3ee' },
                    { id: 'creative-modern', name: 'Creative Modern', desc: 'Bold & vibrant', color: '#a855f7' },
                    { id: 'fresher-student', name: 'Fresher / Student', desc: 'Fresh & friendly', color: '#16a34a' },
                  ].map(t => (
                    <button
                      key={t.id}
                      className={`du-template-card ${portfolioTemplate === t.id ? 'selected' : ''}`}
                      onClick={() => setPortfolioTemplate(t.id)}
                      type="button"
                    >
                      <div className="du-template-preview" style={{ background: `linear-gradient(135deg, ${t.color}22, ${t.color}44)`, borderTop: `3px solid ${t.color}` }} />
                      <div className="du-template-info">
                        <strong>{t.name}</strong>
                        <span>{t.desc}</span>
                      </div>
                      {portfolioTemplate === t.id && <Check size={14} className="du-template-check" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section Toggles */}
              <div className="du-portfolio-sections">
                <h3 className="du-section-label">Visible Sections</h3>
                <div className="du-section-toggle-list">
                  {[
                    { key: 'hero', label: 'Hero / Header', icon: <User size={14} /> },
                    { key: 'about', label: 'About', icon: <FileText size={14} /> },
                    { key: 'skills', label: 'Skills', icon: <Code size={14} /> },
                    { key: 'experience', label: 'Experience', icon: <Briefcase size={14} /> },
                    { key: 'projects', label: 'Projects', icon: <Star size={14} /> },
                    { key: 'openSource', label: 'Open Source Stats', icon: <Github size={14} /> },
                    { key: 'education', label: 'Education', icon: <GraduationCap size={14} /> },
                    { key: 'achievements', label: 'Achievements', icon: <Award size={14} /> },
                    { key: 'contact', label: 'Contact', icon: <Mail size={14} /> },
                  ].map(sec => {
                    const vis = profile.portfolioData?.sectionVisibility || {};
                    const isOn = vis[sec.key] !== false;
                    return (
                      <label key={sec.key} className="du-section-toggle">
                        <span className="du-section-toggle-label">{sec.icon} {sec.label}</span>
                        <button
                          type="button"
                          className={`du-toggle ${isOn ? 'is-on' : ''}`}
                          onClick={() => {
                            const newVis = { ...(profile.portfolioData?.sectionVisibility || {}), [sec.key]: !isOn };
                            setProfile(prev => ({
                              ...prev,
                              portfolioData: { ...(prev.portfolioData || {}), sectionVisibility: newVis }
                            }));
                          }}
                        >
                          <span className="du-toggle-knob" />
                        </button>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Publish Actions */}
              <div className="du-portfolio-publish">
                <div className="du-portfolio-url-row">
                  <span className="du-portfolio-url-prefix">{window.location.origin}/u/</span>
                  <input
                    className="du-form-input"
                    value={portfolioSlug}
                    onChange={(e) => setPortfolioSlug(slugify(e.target.value))}
                    placeholder="your-slug"
                    style={{ flex: 1, maxWidth: 200 }}
                  />
                </div>
                <div className="du-portfolio-actions">
                  <button
                    className="du-save-btn"
                    onClick={handlePublishPortfolio}
                    disabled={publishingPortfolio}
                    type="button"
                  >
                    {publishingPortfolio ? (
                      <><Zap size={14} className="du-spin" /> Generating...</>
                    ) : (
                      <><Globe size={14} /> {isPublic ? 'Republish Portfolio' : 'Generate & Publish'}</>
                    )}
                  </button>
                  {isPublic && (
                    <a
                      href={profileLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="du-edit-btn"
                      style={{ textDecoration: 'none' }}
                    >
                      <ExternalLink size={14} /> View Portfolio
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Profile Info Card (non-portfolio tabs) */}
          {activeTab !== 'portfolio' && <div className="du-card">
            <div className="du-card-header">
              <h2 className="du-card-title">
                {activeTab === 'basic' && <User />} 
                {activeTab === 'professional' && <Briefcase />} 
                {activeTab === 'social' && <Users />}
                
                {activeTab === 'basic' && 'Basic Information'}
                {activeTab === 'professional' && 'Professional Details'}
                {activeTab === 'social' && 'Social Profiles'}
              </h2>
              {!editing ? (
                <button className="du-edit-btn" onClick={() => setEditing(true)}>
                  <Pencil size={13} /> Edit
                </button>
              ) : (
                <span className="du-card-badge">Editing</span>
              )}
            </div>

            <div className="du-tip-banner">
              <Sparkles size={16} />
              <span>Complete your profile to unlock <strong>20 bonus coins</strong> and get personalized interview prep.</span>
            </div>

            <div className="du-import-actions" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                className="du-import-center-trigger"
                onClick={() => setImportCenterOpen(true)}
                type="button"
              >
                <Upload size={14} />
                <span>Import from Resume, GitHub, or LinkedIn</span>
                <Sparkles size={14} style={{ color: '#a78bfa' }} />
              </button>
            </div>

            {resumeAutofillApplied && (
              <div className="du-resume-autofill-wrap">
                <div className="du-resume-autofill-hint">
                  <Check size={13} />
                  Fields were auto-filled from your latest resume analysis. Review and save to keep them.
                </div>
                <div className="du-resume-autofill-actions">
                  {Object.keys(autofillSuggestions).map((fieldKey) => (
                    <div key={fieldKey} className="du-autofill-action-item">
                      <span>{AUTOFILL_FIELD_LABELS[fieldKey] || fieldKey}</span>
                      <button type="button" onClick={() => handleAcceptAutofillField(fieldKey)}>Accept</button>
                      <button type="button" onClick={() => handleUndoAutofillField(fieldKey)}>Undo</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={`du-pro-showcase ${editing ? 'is-editing' : ''}`} aria-label="Professional profile snapshot">
              {editing && (
                <div className="du-showcase-live-badge">
                  <Sparkles size={12} /> Live preview while editing
                </div>
              )}
              {activeTab === 'basic' && (
                <div className="du-showcase-basic-info">
                  <div className="du-showcase-contact-grid">
                    <div className="du-showcase-contact-item">
                      <Mail size={16} className="du-contact-icon" />
                      <div className="du-contact-label">Email</div>
                      <div className="du-contact-value">{emailDisplay}</div>
                    </div>
                    {profile.phone && (
                      <div className="du-showcase-contact-item">
                        <Phone size={16} className="du-contact-icon" />
                        <div className="du-contact-label">Phone</div>
                        <div className="du-contact-value">{profile.phone}</div>
                      </div>
                    )}
                    {profile.location && (
                      <div className="du-showcase-contact-item">
                        <LocationIcon size={16} className="du-contact-icon" />
                        <div className="du-contact-label">Location</div>
                        <div className="du-contact-value">{profile.location}</div>
                      </div>
                    )}
                    {profile.website && (
                      <div className="du-showcase-contact-item">
                        <Link2 size={16} className="du-contact-icon" />
                        <div className="du-contact-label">Website</div>
                        <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                           target="_blank" rel="noopener noreferrer" 
                           className="du-contact-value du-link">
                          {profile.website}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="du-showcase-summary">
                    <div className="du-showcase-panel-head">
                      <FileText size={14} />
                      <span>Bio</span>
                    </div>
                    <p>{profileSummary}</p>
                  </div>
                </div>
              )}
              
              {activeTab === 'professional' && (
                <div className="du-showcase-professional-info">
                  <div className="du-showcase-top-grid">
                    <div className="du-showcase-mini-card">
                      <div className="du-showcase-mini-label">Current Role</div>
                      <div className="du-showcase-mini-value">{roleDisplay}</div>
                      <Briefcase size={26} className="du-showcase-mini-icon" />
                    </div>

                    <div className="du-showcase-mini-card">
                      <div className="du-showcase-mini-label">Company</div>
                      <div className="du-showcase-mini-value">{companyDisplay}</div>
                      <Building size={26} className="du-showcase-mini-icon" />
                    </div>

                    <div className="du-showcase-mini-card">
                      <div className="du-showcase-mini-label">Experience</div>
                      <div className="du-showcase-mini-value">{yearsExpDisplay}</div>
                      <Award size={26} className="du-showcase-mini-icon" />
                    </div>

                    <div className="du-showcase-mini-card">
                      <div className="du-showcase-mini-label">Specialization</div>
                      <div className="du-showcase-mini-value">{specializationDisplay}</div>
                      <Code size={26} className="du-showcase-mini-icon" />
                    </div>
                  </div>

                  <div className="du-showcase-panel">
                    <div className="du-showcase-panel-head">
                      <Zap size={14} />
                      <span>Skills</span>
                      <span className="du-showcase-count">{skillChips.length} detected</span>
                    </div>
                    <div className="du-showcase-chip-wrap">
                      {skillChips.length ? (
                        skillChips.map((skill) => (
                          <span key={skill} className="du-showcase-chip">{skill}</span>
                        ))
                      ) : (
                        <span className="du-showcase-empty">No skills detected yet</span>
                      )}
                    </div>
                  </div>

                  <div className="du-showcase-panel">
                    <div className="du-showcase-panel-head">
                      <Award size={14} />
                      <span>Experience</span>
                    </div>
                    {experiencePoints.length ? (
                      <ul className="du-showcase-list">
                        {experiencePoints.map((point, index) => (
                          <li key={`${point}-${index}`}>{point}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="du-showcase-empty">No experience details available yet</div>
                    )}
                  </div>

                  <div className="du-showcase-project-grid">
                    {projects.length ? projects.map((project, index) => (
                      <div key={`${project}-${index}`} className="du-showcase-project-card">
                        <div className="du-showcase-project-title">Project {index + 1}</div>
                        <div className="du-showcase-project-copy">{project}</div>
                      </div>
                    )) : (
                      <div className="du-showcase-project-empty">
                        <Building size={14} />
                        <span>Projects from latest resume analysis will appear here</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'social' && (
                <div className="du-showcase-social-links">
                  <div className="du-social-link-item">
                    <div className="du-social-platform">LinkedIn</div>
                    <div className="du-social-url">
                      {profile.socialLinks.linkedin ? (
                        <a href={`https://linkedin.com/in/${profile.socialLinks.linkedin}`} 
                           target="_blank" rel="noopener noreferrer">
                          {profile.socialLinks.linkedin}
                        </a>
                      ) : 'Not connected'}
                    </div>
                  </div>
                  <div className="du-social-link-item">
                    <div className="du-social-platform">Twitter</div>
                    <div className="du-social-url">
                      {profile.socialLinks.twitter ? (
                        <a href={`https://twitter.com/${profile.socialLinks.twitter}`} 
                           target="_blank" rel="noopener noreferrer">
                          {profile.socialLinks.twitter}
                        </a>
                      ) : 'Not connected'}
                    </div>
                  </div>
                  <div className="du-social-link-item">
                    <div className="du-social-platform">Portfolio</div>
                    <div className="du-social-url">
                      {profile.socialLinks.portfolio ? (
                        <a href={profile.socialLinks.portfolio.startsWith('http') ? profile.socialLinks.portfolio : `https://${profile.socialLinks.portfolio}`} 
                           target="_blank" rel="noopener noreferrer">
                          {profile.socialLinks.portfolio}
                        </a>
                      ) : 'Not set'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {editing && activeTab === 'basic' && <div className="du-form-grid">
              {/* Full Name */}
              <div className="du-form-group">
                <label className="du-form-label">
                  <User size={14} /> Full Name
                </label>
                <input
                  className="du-form-input"
                  value={profile.fullName || ''}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              {/* Email */}
              <div className="du-form-group">
                <label className="du-form-label">
                  <Mail size={14} /> Email Address
                </label>
                <div className="du-form-value">
                  {emailDisplay}
                </div>
              </div>

              {/* Phone */}
              <div className="du-form-group">
                <label className="du-form-label">
                  <Phone size={14} /> Phone
                </label>
                <input
                  className="du-form-input"
                  value={profile.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Your phone number"
                />
              </div>

              {/* Location */}
              <div className="du-form-group">
                <label className="du-form-label">
                  <MapPin size={14} /> Location
                </label>
                <input
                  className="du-form-input"
                  value={profile.location || ''}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="City, Country"
                />
              </div>

              {/* Website */}
              <div className="du-form-group">
                <label className="du-form-label">
                  <Link2 size={14} /> Website
                </label>
                <input
                  className="du-form-input"
                  value={profile.website || ''}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://your-website.com"
                />
              </div>

              {/* Bio */}
              <div className="du-form-group full-width">
                <label className="du-form-label">
                  <Shield size={14} /> Bio
                </label>
                <textarea
                  className="du-form-textarea"
                  value={profile.bio || ''}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Tell us about yourself — keep it concise and interview-focused."
                  rows={4}
                />
              </div>
            </div>}

            {editing && activeTab === 'professional' && <div className="du-form-grid">
              {/* Current Role */}
              <div className="du-form-group">
                <label className="du-form-label">
                  <Briefcase size={14} /> Current Role
                </label>
                <input
                  className="du-form-input"
                  value={profile.currentRole || ''}
                  onChange={(e) => handleChange('currentRole', e.target.value)}
                  placeholder="e.g. Frontend Developer"
                />
              </div>

              {/* Company */}
              <div className="du-form-group">
                <label className="du-form-label">
                  <Building size={14} /> Company
                </label>
                <input
                  className="du-form-input"
                  value={profile.company || ''}
                  onChange={(e) => handleChange('company', e.target.value)}
                  placeholder="Where you work"
                />
              </div>

              {/* Experience */}
              <div className="du-form-group">
                <label className="du-form-label">
                  <Award size={14} /> Years of Experience
                </label>
                <input
                  className="du-form-input"
                  value={profile.yearsOfExperience || ''}
                  onChange={(e) => handleChange('yearsOfExperience', e.target.value)}
                  placeholder="e.g. 3 years"
                />
              </div>

              {/* Specialization */}
              <div className="du-form-group">
                <label className="du-form-label">
                  <Code size={14} /> Specialization
                </label>
                <input
                  className="du-form-input"
                  value={profile.specialization || ''}
                  onChange={(e) => handleChange('specialization', e.target.value)}
                  placeholder="e.g. React, Node.js, Python..."
                />
              </div>

              {/* Skills */}
              <div className="du-form-group">
                <label className="du-form-label">
                  <Zap size={14} /> Skills
                </label>
                <input
                  className="du-form-input"
                  value={profile.skills || ''}
                  onChange={(e) => handleChange('skills', e.target.value)}
                  placeholder="React, Node.js, Python..."
                />
              </div>

              {/* Education */}
              <div className="du-form-group">
                <label className="du-form-label">
                  <GraduationCap size={14} /> Education
                </label>
                <input
                  className="du-form-input"
                  value={profile.education || ''}
                  onChange={(e) => handleChange('education', e.target.value)}
                  placeholder="Degree, Institute"
                />
              </div>

              {/* Experience Details */}
              <div className="du-form-group full-width">
                <label className="du-form-label">
                  <Award size={14} /> Experience Details
                </label>
                <textarea
                  className="du-form-textarea"
                  value={profile.experience || ''}
                  onChange={(e) => handleChange('experience', e.target.value)}
                  placeholder="Describe your work experience in detail"
                  rows={4}
                />
              </div>
            </div>}

            {editing && activeTab === 'social' && <div className="du-form-grid">
              {/* LinkedIn */}
              <div className="du-form-group">
                <label className="du-form-label">
                  <Users size={14} /> LinkedIn
                </label>
                <input
                  className="du-form-input"
                  value={profile.socialLinks?.linkedin || ''}
                  onChange={(e) => handleChangeSocial('linkedin', e.target.value)}
                  placeholder="your-linkedin-username"
                />
              </div>

              {/* Twitter */}
              <div className="du-form-group">
                <label className="du-form-label">
                  <Hash size={14} /> Twitter/X
                </label>
                <input
                  className="du-form-input"
                  value={profile.socialLinks?.twitter || ''}
                  onChange={(e) => handleChangeSocial('twitter', e.target.value)}
                  placeholder="your-twitter-username"
                />
              </div>

              {/* Portfolio */}
              <div className="du-form-group">
                <label className="du-form-label">
                  <Link2 size={14} /> Portfolio
                </label>
                <input
                  className="du-form-input"
                  value={profile.socialLinks?.portfolio || ''}
                  onChange={(e) => handleChangeSocial('portfolio', e.target.value)}
                  placeholder="https://your-portfolio.com"
                />
              </div>

              {/* Dribbble */}
              <div className="du-form-group">
                <label className="du-form-label">
                  <Coffee size={14} /> Dribbble
                </label>
                <input
                  className="du-form-input"
                  value={profile.socialLinks?.dribbble || ''}
                  onChange={(e) => handleChangeSocial('dribbble', e.target.value)}
                  placeholder="your-dribbble-username"
                />
              </div>
            </div>}

            {editing && (
              <div className="du-form-actions">
                <button className="du-save-btn" onClick={handleSave} disabled={saving}>
                  <Save size={14} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  className="du-cancel-btn"
                  onClick={() => { setEditing(false); fetchProfile(); }}
                >
                  <X size={14} />
                  Discard
                </button>
              </div>
            )}
          </div>}

          {/* ═══ Projects Section ═══ */}
          {profileProjects.length > 0 && (
            <div className="du-card du-projects-card">
              <div className="du-card-header">
                <h2 className="du-card-title">
                  <Code size={18} /> Projects
                </h2>
                <span className="du-card-badge">{profileProjects.length} total</span>
              </div>
              <div className="du-projects-grid">
                {profileProjects.slice(0, 6).map((project, i) => (
                  <div key={i} className="du-project-item">
                    <div className="du-project-header">
                      <h4 className="du-project-name">{project.name || 'Project'}</h4>
                      {project.source && (
                        <span className={`du-project-source du-source-${project.source}`}>
                          {project.source === 'github' && <Github size={10} />}
                          {project.source === 'resume' && <FileText size={10} />}
                          {project.source}
                        </span>
                      )}
                    </div>
                    {project.description && (
                      <p className="du-project-desc">{project.description}</p>
                    )}
                    <div className="du-project-footer">
                      {project.language && (
                        <span className="du-project-lang">
                          <span className="du-lang-dot" style={{ background: project.language === 'JavaScript' ? '#f7df1e' : project.language === 'Python' ? '#3776ab' : project.language === 'TypeScript' ? '#3178c6' : '#8b5cf6' }} />
                          {project.language}
                        </span>
                      )}
                      {Array.isArray(project.technologies) && project.technologies.map((t, ti) => (
                        <span key={ti} className="du-project-tech">{t}</span>
                      ))}
                      {typeof project.stars === 'number' && project.stars > 0 && (
                        <span className="du-project-stars"><Star size={11} /> {project.stars}</span>
                      )}
                      {project.link && (
                        <a href={project.link} target="_blank" rel="noopener noreferrer" className="du-project-link">
                          <ExternalLink size={11} /> View
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ Certifications Section ═══ */}
          {profileCertifications.length > 0 && (
            <div className="du-card du-certs-card">
              <div className="du-card-header">
                <h2 className="du-card-title">
                  <Award size={18} /> Certifications
                </h2>
              </div>
              <div className="du-certs-list">
                {profileCertifications.map((cert, i) => {
                  const certName = typeof cert === 'string' ? cert : cert.name;
                  const certIssuer = typeof cert === 'object' ? cert.issuer : '';
                  return (
                    <div key={i} className="du-cert-badge">
                      <Award size={14} />
                      <div className="du-cert-info">
                        <span className="du-cert-name">{certName}</span>
                        {certIssuer && <span className="du-cert-issuer">{certIssuer}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* GitHub Contributions */}
          <div className="du-card">
            <div className="du-card-header">
              <h2 className="du-card-title">
                <Github /> GitHub Contributions
              </h2>
              {profile.githubUsername && (
                <button className="du-edit-btn" onClick={handleGithubDisconnect} disabled={saving}>
                  Disconnect
                </button>
              )}
            </div>
            
            {!profile.githubUsername ? (
              <>
                <p className="du-card-subtitle">
                  Connect your GitHub account to automatically generate and display your contribution heatmap right on your profile.
                </p>
                <div className="du-github-connect">
                  <input
                    className="du-github-input"
                    placeholder="Enter github username..."
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGithubConnect()}
                  />
                  <button 
                    className="du-connect-btn" 
                    disabled={!githubUsername.trim() || saving}
                    onClick={handleGithubConnect}
                  >
                    {saving ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              </>
            ) : (
              <div className="du-heatmap-wrapper">
                <img 
                  src={`https://ghchart.rshah.org/2cee91/${profile.githubUsername}`} 
                  alt={`${profile.githubUsername}'s Github chart`} 
                  style={{ width: '100%', maxWidth: '100%' }}
                />
              </div>
            )}
          </div>

          {/* Application Dashboard */}
          <div className="du-card">
            <div className="du-card-header">
              <h2 className="du-card-title">
                <LayoutGrid /> Application Dashboard
              </h2>
            </div>
            <div className="du-app-list">
              {MOCK_JOB_MATCHES.map(match => (
                <div key={match.id} className="du-match-item" role="button" tabIndex={0} onClick={() => setSelectedMatch(match)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedMatch(match); }} aria-label={`Open match ${match.title} at ${match.company}`}>
                  <div className="du-match-icon">
                    <Building size={20} />
                  </div>
                  <div className="du-match-info">
                    <h4 className="du-match-job-title">{match.title}</h4>
                    <p className="du-match-company">{match.company}</p>
                  </div>
                  <div className="du-match-score-section">
                    <div className="du-match-score-tag">
                      <Sparkles size={12} /> {match.matchScore}% Match
                    </div>
                    <ChevronRight size={18} className="du-match-arrow" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="du-card du-danger-card">
            <div className="du-card-header">
              <h2 className="du-card-title" style={{ color: '#f87171' }}>
                <Shield /> Account Access
              </h2>
            </div>
            <div className="du-danger-row">
              <p>Sign out of your account on this device.</p>
              <button className="du-signout-btn" onClick={logout}>
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* ─── Sidebar Column ─── */}
        <div className="du-side-col">

          {/* Profile Completion Ring */}
          <div className="du-card du-completion-card">
            <div className="du-card-header">
              <h2 className="du-card-title">
                <Target /> Profile Strength
              </h2>
            </div>
            <ProfileCompletionRing profile={profile} onClickMissing={handleCompletionClick} />
          </div>

          {/* Level & Streak */}
          <div className="du-card du-level-card">
            <div className="du-card-header">
              <h2 className="du-card-title">
                <Trophy /> Level & Streak
              </h2>
            </div>
            <div className="du-level-header">
              <span className="du-level-name">
                <Award size={20} /> {rank}
              </span>
              <span className="du-level-xp-text">{currentLevelXP} / {nextLevelXP} XP</span>
            </div>
            <div className="du-level-bar-track">
              <div className="du-level-bar-fill" style={{ width: `${Math.min((currentLevelXP / Math.max(nextLevelXP, 1)) * 100, 100)}%` }} />
            </div>
            <div className="du-streak-row">
              <div className="du-streak-item">
                <span className="du-streak-fire">🔥</span>
                <div>
                  <div className="du-streak-num">{currentStreak}</div>
                  <div className="du-streak-label-text">Current Streak</div>
                </div>
              </div>
              <div className="du-streak-item du-streak-best">
                <span className="du-streak-fire">⭐</span>
                <div>
                  <div className="du-streak-num">{bestStreak}</div>
                  <div className="du-streak-label-text">Best Streak</div>
                </div>
              </div>
            </div>
          </div>

          {/* Skill Radar */}
          <div className="du-card du-radar-card">
            <div className="du-card-header">
              <h2 className="du-card-title">
                <BarChart3 /> Skill Breakdown
              </h2>
            </div>
            <SkillRadar skills={radarSkills} />
          </div>

          {/* Achievement Badges */}
          <div className="du-card du-badges-card">
            <div className="du-card-header">
              <h2 className="du-card-title">
                <Award /> Achievements
              </h2>
            </div>
            <AchievementBadges dashboardData={dashboardData} interviewsDone={interviewsDone} />
          </div>

          {/* Activity Timeline */}
          <div className="du-card du-timeline-card">
            <div className="du-card-header">
              <h2 className="du-card-title">
                <Calendar /> Recent Activity
              </h2>
            </div>
            <ActivityTimeline activities={recentActivity} />
          </div>

          {/* Subscription */}
          <div className="du-card">
            <div className="du-card-header">
              <h2 className="du-card-title">
                <Sparkles /> Subscription
              </h2>
              <span className="du-plan-pill">FREE</span>
            </div>
            <div className="du-sub-meters">
              <div className="du-sub-meter">
                <div className="du-sub-meter-top">
                  <span className="du-sub-meter-label">AI Matches</span>
                  <span className="du-sub-meter-value">{aiMatches}/39</span>
                </div>
                <div className="du-progress-track">
                  <div className="du-progress-fill" style={{ width: `${Math.min((aiMatches / 39) * 100, 100)}%` }} />
                </div>
              </div>
              <div className="du-sub-meter">
                <div className="du-sub-meter-top">
                  <span className="du-sub-meter-label">Cover Letters</span>
                  <span className="du-sub-meter-value">{coverLetters}/29</span>
                </div>
                <div className="du-progress-track">
                  <div className="du-progress-fill" style={{ width: `${Math.min((coverLetters / 29) * 100, 100)}%` }} />
                </div>
              </div>
              <div className="du-sub-meter">
                <div className="du-sub-meter-top">
                  <span className="du-sub-meter-label">Mock Interviews</span>
                  <span className="du-sub-meter-value">{interviewsDone}/19</span>
                </div>
                <div className="du-progress-track">
                  <div className="du-progress-fill" style={{ width: `${Math.min((interviewsDone / 19) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
            <Link to="/pricing" className="du-pro-btn">
              <Sparkles size={16} />
              Get Pro & Premium
            </Link>
          </div>

          {/* Resume */}
          <div className="du-card">
            <div className="du-card-header">
              <h2 className="du-card-title">
                <FileText /> Your Resume
              </h2>
            </div>
            <input
              type="file"
              accept=".pdf"
              ref={resumeFileRef}
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setResumeUploading(true);
                setStatus('idle');
                try {
                  const formData = new FormData();
                  formData.append('resume', file);
                  const authHdrs = buildAuthHeaders(user);
                  const res = await fetch('/api/resume/analyze', {
                    method: 'POST',
                    headers: { 'Authorization': authHdrs['Authorization'] || authHdrs['authorization'] || '' },
                    body: formData
                  });
                  if (!res.ok) throw new Error('Upload failed');
                  // Re-fetch resume snapshot to trigger autofill
                  hasAutofilledFromResumeRef.current = false;
                  await fetchLatestResumeSnapshot();
                  setStatus('saved');
                  setRewardMessage('Resume uploaded! Profile fields updated.');
                } catch (err) {
                  console.error(err);
                  setStatus('error');
                }
                setResumeUploading(false);
                if (resumeFileRef.current) resumeFileRef.current.value = '';
              }}
            />
            <div
              className="du-resume-dropzone"
              style={{ cursor: resumeUploading ? 'wait' : 'pointer' }}
              onClick={() => !resumeUploading && resumeFileRef.current?.click()}
            >
              <Upload size={28} />
              {resumeUploading ? (
                <p>Uploading & analyzing...</p>
              ) : (
                <>
                  <p>Drag and drop your resume <strong>PDF</strong> here</p>
                  <p>or</p>
                  <span className="du-browse-btn">Browse Files</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Toast Notifications ═══ */}
      {status === 'saved' && (
        <div className="du-toast success" role="status" aria-live="polite">
          <Check size={16} />
          Profile saved successfully.{rewardMessage ? ` ${rewardMessage}` : ''}
        </div>
      )}
      {status === 'error' && (
        <div className="du-toast error" role="alert">
          <X size={16} />
          Could not save profile. Please try again.
        </div>
      )}

      {selectedMatch && (
        <AIMatchReportModal 
          jobMatch={selectedMatch} 
          onClose={() => setSelectedMatch(null)} 
        />
      )}

      <ImportCenterModal
        isOpen={importCenterOpen}
        onClose={() => setImportCenterOpen(false)}
        onApply={handleImportApply}
        currentProfile={profile}
      />
    </div>
  );
}
