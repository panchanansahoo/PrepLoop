import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ExternalLink, Hash, Tag, Camera
} from 'lucide-react';
import AIMatchReportModal from '../components/AIMatchReportModal';
import './Profile.css';

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
    socialLinks: profile.socialLinks || {}
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
  currentRole: 'Current Role',
  skills: 'Skills',
  experience: 'Experience',
  bio: 'Bio'
};

export default function Profile() {
  const { user, logout } = useAuth();
  const { refreshBalance } = useCoins();
  const { data: dashboardData } = useDashboardData();

  const [profile, setProfile] = useState({ ...buildInitialProfile(user) });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('idle');
  const [rewardMessage, setRewardMessage] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [resumeSnapshot, setResumeSnapshot] = useState(null);
  const [autofillSuggestions, setAutofillSuggestions] = useState({});
  const [linkedinImporting, setLinkedinImporting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const hasAutofilledFromResumeRef = useRef(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile', { headers: buildAuthHeaders(user) });
      if (res.ok) {
        const data = await res.json();
        const normalized = {
          ...normalizeProfileData(data),
          ...normalizeProfileData(data?.user)
        };
        setProfile((prev) => ({
          ...prev,
          ...normalized
        }));
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
      const payload = buildProfilePayload(profile);
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: buildAuthHeaders(user),
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save profile');
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
    if (!githubUsername.trim()) return;
    setSaving(true);
    setStatus('idle');
    try {
      const payload = buildProfilePayload({ ...profile, githubUsername: githubUsername.trim() });
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: buildAuthHeaders(user),
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save github username');
      setProfile(prev => ({ ...prev, githubUsername: githubUsername.trim() }));
      setStatus('saved');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
    setSaving(false);
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
      if (!res.ok) throw new Error('Failed to disconnect github');
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
    const link = `https://preploop.com/u/${displayName.toLowerCase().replace(/\s+/g, '-')}`;
    navigator.clipboard.writeText(link).catch(() => { /* fallback */ });
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
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

  const handleLinkedInImport = async () => {
    const linkedinUrl = prompt('Paste your LinkedIn profile URL or manually enter your data:');
    if (!linkedinUrl) return;

    setLinkedinImporting(true);
    try {
      const manualData = {
        name: prompt('Full Name:') || '',
        headline: prompt('Current Role/Headline:') || '',
        about: prompt('About/Summary:') || '',
        skills: prompt('Skills (comma-separated):') || '',
        experience: prompt('Experience (brief):') || '',
        education: prompt('Education:') || '',
        location: prompt('Location:') || '',
        company: prompt('Company:') || '',
        website: prompt('Website:') || '',
        phone: prompt('Phone:') || ''
      };

      const res = await fetch('/api/resume/import-linkedin', {
        method: 'POST',
        headers: buildAuthHeaders(user),
        body: JSON.stringify({ linkedinUrl, profileData: manualData })
      });

      if (!res.ok) throw new Error('Import failed');
      const data = await res.json();

      if (data.profileData) {
        setProfile(prev => ({
          ...prev,
          fullName: data.profileData.fullName || prev.fullName,
          currentRole: data.profileData.currentRole || prev.currentRole,
          bio: data.profileData.bio || prev.bio,
          skills: data.profileData.skills || prev.skills,
          experience: data.profileData.experience || prev.experience,
          education: data.profileData.education || prev.education,
          location: data.profileData.location || prev.location,
          company: data.profileData.company || prev.company,
          website: data.profileData.website || prev.website,
          phone: data.profileData.phone || prev.phone
        }));
        setStatus('saved');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
    setLinkedinImporting(false);
  };

  const displayName = profile.fullName || user?.fullName || 'User';
  const initial = (displayName || user?.email || '?').charAt(0).toUpperCase();
  const emailDisplay = profile.email || user?.email || 'Email not set';
  const interviewsDone = dashboardData?.interviewsCompleted || 0;
  const aiMatches = dashboardData?.aiMatches || dashboardData?.jobMatches || 0;
  const coverLetters = dashboardData?.coverLetters || 0;
  const profileLink = `https://preploop.com/u/${displayName.toLowerCase().replace(/\s+/g, '-')}`;
  const roleDisplay = profile.currentRole || resumeSnapshot?.candidateHeadline || 'Not set';
  const educationDisplay = profile.education || 'Not set';
  const skillChips = splitSkillChips(profile.skills, resumeSnapshot);
  const experiencePoints = splitExperiencePoints(profile.experience, resumeSnapshot);
  const projects = Array.isArray(resumeSnapshot?.projectHighlights)
    ? resumeSnapshot.projectHighlights.slice(0, 2)
    : [];
  const profileSummary = profile.bio || resumeSnapshot?.summary || 'No bio added yet.';
  const resumeAutofillApplied = Object.keys(autofillSuggestions).length > 0;
  const locationDisplay = profile.location || 'Location not set';
  const companyDisplay = profile.company || 'Company not set';
  const yearsExpDisplay = profile.yearsOfExperience || 'N/A';
  const specializationDisplay = profile.specialization || 'None specified';

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
              <button className="du-claim-btn" type="button">
                Claim Custom URL
              </button>
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
          </div>

          {/* Professional Profile */}
          <div className="du-card">
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
              <Link to="/resume-analyzer" className="du-import-btn" style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: '#6366f1', color: 'white', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }}>
                <Upload size={14} /> Import from Resume
              </Link>
              <button 
                className="du-import-btn" 
                onClick={handleLinkedInImport}
                disabled={linkedinImporting}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: '#0a66c2', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
              >
                <Link2 size={14} /> {linkedinImporting ? 'Importing...' : 'Import from LinkedIn'}
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
          </div>

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
                <div key={match.id} className="du-match-item" onClick={() => setSelectedMatch(match)}>
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
                  <span className="du-sub-meter-label">
                    AI Matches
                  </span>
                  <span className="du-sub-meter-value">{aiMatches}/39</span>
                </div>
                <div className="du-progress-track">
                  <div className="du-progress-fill" style={{ width: `${Math.min((aiMatches / 39) * 100, 100)}%` }} />
                </div>
              </div>
              <div className="du-sub-meter">
                <div className="du-sub-meter-top">
                  <span className="du-sub-meter-label">
                    Cover Letters
                  </span>
                  <span className="du-sub-meter-value">{coverLetters}/29</span>
                </div>
                <div className="du-progress-track">
                  <div className="du-progress-fill" style={{ width: `${Math.min((coverLetters / 29) * 100, 100)}%` }} />
                </div>
              </div>
              <div className="du-sub-meter">
                <div className="du-sub-meter-top">
                  <span className="du-sub-meter-label">
                    Mock Interviews
                  </span>
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
            <Link to="/resume-analyzer" className="du-resume-dropzone" style={{ textDecoration: 'none' }}>
              <Upload size={28} />
              <p>Drag and drop your resume <strong>PDF</strong> here</p>
              <p>or</p>
              <span className="du-browse-btn">Browse Files</span>
            </Link>
          </div>

          {/* Profile Themes */}
          <div className="du-card">
            <div className="du-card-header">
              <h2 className="du-card-title">
                <Palette /> Profile Theme
              </h2>
            </div>
            <p className="du-card-subtitle" style={{ marginBottom: 14 }}>
              Customize your public profile appearance.
            </p>
            <button className="du-theme-coming" type="button" disabled>
              More Themes Coming Soon
            </button>
          </div>
          
          {/* Quick Stats */}
          <div className="du-card">
            <div className="du-card-header">
              <h2 className="du-card-title">
                <Star /> Quick Stats
              </h2>
            </div>
            <div className="du-stats-grid">
              <div className="du-stat-item">
                <div className="du-stat-value">{interviewsDone}</div>
                <div className="du-stat-label">Interviews Done</div>
              </div>
              <div className="du-stat-item">
                <div className="du-stat-value">{aiMatches}</div>
                <div className="du-stat-label">AI Matches</div>
              </div>
              <div className="du-stat-item">
                <div className="du-stat-value">{coverLetters}</div>
                <div className="du-stat-label">Cover Letters</div>
              </div>
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
    </div>
  );
}