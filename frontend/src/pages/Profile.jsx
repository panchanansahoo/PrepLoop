import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCoins } from '../context/CoinContext';
import useDashboardData from '../hooks/useDashboardData';
import { mergeAuthHeaders } from '../utils/authHeaders';
import { authFetch } from '../utils/authFetch';
import { User, Mail, Briefcase, Award, GraduationCap, Shield, LogOut, Github, Sparkles, FileText, Upload, Pencil, Save, X, Zap, Copy, Check, Link2, Palette, PenSquare, LayoutGrid, Layout, Zap as _Bolt, ChevronRight, Building, MapPin, Calendar, Code, Coffee, Users, Star, Phone, Calendar as _CalendarIcon, MapPin as LocationIcon, ExternalLink, Hash, Tag, Camera, Info, GitFork, Globe, Linkedin, Twitter } from 'lucide-react';
import AIMatchReportModal from '../components/AIMatchReportModal';
import './Profile.css';
import {
  buildInitialProfile,
  fillLinkedinBlanks,
  normalizeProfileData,
  buildProfilePayload,
  splitSkillChips,
  calculateProfileCompletion,
  splitExperiencePoints,
  hasNonEmptyText,
  isHighConfidenceHeadline,
  filterHighConfidenceExperienceAreas,
  readApiErrorMessage,
  AUTOFILL_FIELD_LABELS,
  normalizeExternalUrl,
  buildSocialUrl,
  normalizeGithubHandle,
  normalizeLinkedinInput,
  getPlanBadgeMeta,
} from '../utils/profileHelpers';

export default function Profile() {
  const { user, logout } = useAuth();
  const { refreshBalance } = useCoins();
  const { data: dashboardData, refresh: refreshDashboard } = useDashboardData();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({ ...buildInitialProfile(user) });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('idle');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [rewardMessage, setRewardMessage] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [jobMatches, setJobMatches] = useState([]);
  const [jobMatchesLoading, setJobMatchesLoading] = useState(false);
  const [resumeSnapshot, setResumeSnapshot] = useState(null);
  const [autofillSuggestions, setAutofillSuggestions] = useState({});
  const [linkedinImporting, setLinkedinImporting] = useState(false);
  const [linkedinInput, setLinkedinInput] = useState('');
  const [showLinkedinPaste, setShowLinkedinPaste] = useState(false);
  const [linkedinPasteText, setLinkedinPasteText] = useState('');
  const [linkedinFallbackNotice, setLinkedinFallbackNotice] = useState('');
  const [resumeImporting, setResumeImporting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const isMountedRef = useRef(true);
  const hasAutofilledFromResumeRef = useRef(false);
  const avatarInputRef = useRef(null);
  const linkedinInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const [claimEditing, setClaimEditing] = useState(false);
  const [claimValue, setClaimValue] = useState('');
  const [claimStatus, setClaimStatus] = useState('idle');
  const [themeSaving, setThemeSaving] = useState(false);
  const [toastExiting, setToastExiting] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [githubChartError, setGithubChartError] = useState(false);
  const toastHideTimerRef = useRef(null);
  const toastFadeTimerRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await authFetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        const normalized = normalizeProfileData(data);
        if (isMountedRef.current) {
          setProfile((prev) => ({
            ...prev,
            ...normalized
          }));
          if (normalized.githubUsername) {
            setGithubUsername(normalized.githubUsername);
          }
          if (normalized.socialLinks?.linkedin) {
            setLinkedinInput((prev) => prev || normalized.socialLinks.linkedin);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [user?.id]);

  const fetchLatestResumeSnapshot = useCallback(async () => {
    try {
      const res = await authFetch('/api/resume/latest');
      if (!res.ok) return;
      const data = await res.json();
      if (isMountedRef.current) {
        setResumeSnapshot(data?.resumeProfile || null);
      }
    } catch (err) {
      console.error(err);
    }
  }, [user?.id]);

  const fetchJobMatches = useCallback(async (signal) => {
    if (!isMountedRef.current) return;
    setJobMatchesLoading(true);
    try {
      const res = await authFetch('/api/jobs/skill-match', { signal });
      if (res.ok) {
        const data = await res.json();
        if (isMountedRef.current) {
          setJobMatches((data.jobs || []).slice(0, 3).map(j => ({
            id: j.id,
            title: j.title,
            company: j.company,
            matchScore: j.matchScore ?? 50,
            description: j.description,
            apply_link: j.apply_link,
          })));
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
      }
    } finally {
      if (isMountedRef.current) {
        setJobMatchesLoading(false);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    const controller = new AbortController();
    fetchProfile();
    fetchLatestResumeSnapshot();
    fetchJobMatches(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchProfile, fetchLatestResumeSnapshot, fetchJobMatches]);

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
    setAvatarLoadError(false);
  }, [profile.avatar_url]);

  useEffect(() => {
    setGithubChartError(false);
  }, [profile.githubUsername]);

  useEffect(() => {
    if (status !== 'saved' && status !== 'error') return undefined;
    window.clearTimeout(toastFadeTimerRef.current);
    window.clearTimeout(toastHideTimerRef.current);
    toastFadeTimerRef.current = window.setTimeout(() => {
      setToastExiting(true);
      toastHideTimerRef.current = window.setTimeout(() => {
        setStatus('idle');
        setToastExiting(false);
      }, 300);
    }, 3000);
    return () => {
      window.clearTimeout(toastFadeTimerRef.current);
      window.clearTimeout(toastHideTimerRef.current);
    };
  }, [status]);

  useEffect(() => {
    if (!rewardMessage) return undefined;
    const timer = window.setTimeout(() => setRewardMessage(''), 4000);
    return () => window.clearTimeout(timer);
  }, [rewardMessage]);

  const handleSave = async () => {
    setSaving(true);
    setStatus('idle');
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const payload = buildProfilePayload(profile);
      const res = await authFetch('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, 'Could not save profile. Please try again.'));
      }
      const data = await res.json();

      const normalized = normalizeProfileData(data);
      setProfile(prev => ({ ...prev, ...normalized }));

      if (data?.coinsAwarded) {
        setRewardMessage(`+${data.coinsAwarded} coins earned for completing your profile.`);
      }
      refreshBalance();
      refreshDashboard();
      fetchJobMatches();
      setEditing(false);
      setSuccessMessage('Profile saved successfully.');
      setStatus('saved');
      setAutofillSuggestions({});
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Could not save profile. Please try again.');
      setStatus('error');
    }
    setSaving(false);
  };

  const persistProfileUpdates = async (nextProfile) => {
    const payload = buildProfilePayload(nextProfile);
    const res = await authFetch('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await readApiErrorMessage(res, 'Could not save profile updates.'));
    }
    const data = await res.json();
    const normalized = normalizeProfileData(data);
    setProfile((prev) => ({ ...prev, ...normalized }));
    if (data?.coinsAwarded) {
      setRewardMessage(`+${data.coinsAwarded} coins earned for completing your profile.`);
    }
    refreshBalance();
    refreshDashboard();
    fetchJobMatches();
    return normalized;
  };

  const handleGithubConnect = async () => {
    const normalizedHandle = normalizeGithubHandle(githubUsername);
    if (!normalizedHandle) {
      setErrorMessage('Please enter a valid GitHub username or profile URL.');
      setStatus('error');
      return;
    }
    setSaving(true);
    setStatus('idle');
    setErrorMessage('');
    setSuccessMessage('');
    try {
      let autofillData = null;
      try {
        const autoRes = await authFetch('/api/user/profile/github-autofill', {
          method: 'POST',
          body: JSON.stringify({ githubUsername: normalizedHandle }),
        });
        if (autoRes.ok) {
          autofillData = await autoRes.json();
        }
      } catch (_autoErr) {
        // Fallback to saving just the GitHub handle below
      }

      if (autofillData?.profileData) {
        const merged = fillLinkedinBlanks(profile, {
          ...autofillData.profileData,
          githubUsername: autofillData.githubUsername || normalizedHandle,
        });
        merged.githubUsername = autofillData.githubUsername || normalizedHandle;
        merged.github_username = merged.githubUsername;
        const saved = await persistProfileUpdates(merged);
        setGithubUsername(saved.githubUsername || merged.githubUsername);
        setGithubChartError(false);
        setActiveTab('portfolio');
        setSuccessMessage('GitHub connected and portfolio auto-filled.');
        setStatus('saved');
      } else {
        const res = await authFetch('/api/user/profile', {
          method: 'PUT',
          body: JSON.stringify({ githubUsername: normalizedHandle })
        });
        if (!res.ok) {
          throw new Error(await readApiErrorMessage(res, 'Failed to save GitHub username.'));
        }
        const data = await res.json();
        const normalized = normalizeProfileData(data);
        const savedHandle = normalized.githubUsername || normalizedHandle;
        setProfile(prev => ({ ...prev, githubUsername: savedHandle }));
        setGithubUsername(savedHandle);
        setGithubChartError(false);
        setSuccessMessage('GitHub account connected.');
        setStatus('saved');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to save GitHub username.');
      setStatus('error');
    }
    setSaving(false);
  };

  const handleGithubDisconnect = async () => {
    setSaving(true);
    setStatus('idle');
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await authFetch('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ githubUsername: '' })
      });
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, 'Failed to disconnect GitHub.'));
      }
      setProfile(prev => ({ ...prev, githubUsername: '' }));
      setGithubUsername('');
      setGithubChartError(false);
      setSuccessMessage('GitHub account disconnected.');
      setStatus('saved');
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to disconnect GitHub.');
      setStatus('error');
    }
    setSaving(false);
  };

  const [visibilitySaving, setVisibilitySaving] = useState(false);

  const toggleProfileVisibility = async () => {
    setVisibilitySaving(true);
    try {
      const isPublic = !profile.is_public;
      const response = await authFetch('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ is_public: isPublic }),
      });
      if (!response.ok) throw new Error(await readApiErrorMessage(response, 'Could not update profile visibility.'));
      setProfile(prev => ({ ...prev, is_public: isPublic }));
      setSuccessMessage(isPublic ? 'Your profile is public.' : 'Your profile is private.');
      setStatus('saved');
    } catch (error) {
      setErrorMessage(error.message);
      setStatus('error');
    } finally {
      setVisibilitySaving(false);
    }
  };

  const handleCopyLink = async () => {
    if (!profile.is_public) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(profileLink);
      } else {
        const ta = document.createElement('textarea');
        ta.value = profileLink;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
          if (!document.execCommand('copy')) throw new Error('Copy command was rejected');
        } finally {
          ta.remove();
        }
      }
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy profile link:', err);
      setErrorMessage('Could not copy the profile link. Please copy it manually.');
      setStatus('error');
    }
  };

  const handleClaimUrl = async () => {
    const slug = String(claimValue || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!slug) {
      setErrorMessage('Please enter a custom URL slug.');
      setStatus('error');
      return;
    }
    if (slug.length < 3 || slug.length > 30) {
      setErrorMessage('Custom URL must be between 3 and 30 characters.');
      setStatus('error');
      return;
    }

    setClaimStatus('busy');
    try {
      const res = await authFetch('/api/user/profile/claim-url', {
        method: 'POST',
        body: JSON.stringify({ custom_url: slug })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to claim custom URL');
      }
      const data = await res.json();
      const normalized = normalizeProfileData(data);
      setProfile((prev) => ({
        ...prev,
        ...normalized,
        custom_url: slug
      }));
      setClaimEditing(false);
      setClaimStatus('saved');
      setSuccessMessage(`Profile URL saved at ${publicAppUrl}/u/${slug}`);
      setStatus('saved');
    } catch (err) {
      console.error('Claim error', err);
      setClaimStatus('error');
      setErrorMessage(err.message || 'Failed to claim custom URL.');
      setStatus('error');
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

  const handleProfileThemeChange = async (event) => {
    const nextTheme = event.target.value;
    const previousTheme = profile.profileTheme || 'aurora';
    setProfile((prev) => ({ ...prev, profileTheme: nextTheme }));
    setThemeSaving(true);
    setErrorMessage('');
    try {
      const res = await authFetch('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ profile_theme: nextTheme })
      });
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, 'Could not update profile theme.'));
      }
      setSuccessMessage('Profile theme updated.');
      setStatus('saved');
    } catch (err) {
      console.error('Profile theme update error:', err);
      setProfile((prev) => ({ ...prev, profileTheme: previousTheme }));
      setErrorMessage(err.message || 'Could not update profile theme.');
      setStatus('error');
    } finally {
      setThemeSaving(false);
    }
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

  const handleLinkedInImport = () => {
    setErrorMessage('');
    setSuccessMessage('');
    linkedinInputRef.current?.click();
  };

  const applyImportedProfileData = useCallback((profileData = {}) => {
    setProfile(prev => ({
      ...prev,
      fullName: profileData.fullName || prev.fullName,
      full_name: profileData.fullName || prev.full_name,
      currentRole: profileData.currentRole || prev.currentRole,
      designation: profileData.currentRole || prev.designation,
      bio: profileData.bio || prev.bio,
      skills: profileData.skills || prev.skills,
      experience: profileData.experience || prev.experience,
      experienceLevel: profileData.experience || prev.experienceLevel,
      experience_level: profileData.experience || prev.experience_level,
      education: profileData.education || prev.education,
      location: profileData.location || prev.location,
      company: profileData.company || prev.company,
      website: profileData.website || prev.website,
      phone: profileData.phone || prev.phone,
      socialLinks: profileData.linkedin
        ? { ...(prev.socialLinks || {}), linkedin: profileData.linkedin }
        : prev.socialLinks
    }));
  }, []);

  const handleLinkedinIdImport = async () => {
    const parsed = normalizeLinkedinInput(linkedinInput);
    if (!parsed) {
      setErrorMessage('Enter a valid LinkedIn user ID (e.g. john-doe) or profile URL.');
      setStatus('error');
      return;
    }
    setLinkedinImporting(true);
    setStatus('idle');
    setSuccessMessage('');
    setErrorMessage('');
    setLinkedinFallbackNotice('');
    try {
      const res = await authFetch('/api/resume/import-linkedin', {
        method: 'POST',
        body: JSON.stringify({ linkedinUsername: parsed.url }),
      });
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, 'LinkedIn import failed.'));
      }
      const data = await res.json();
      const linkedinUrl = data.linkedinUrl || parsed.url;
      setLinkedinInput(linkedinUrl);

      if (data.imported && data.profileData) {
        const merged = fillLinkedinBlanks(profile, { ...data.profileData, linkedin: linkedinUrl });
        merged.socialLinks = { ...(merged.socialLinks || {}), linkedin: linkedinUrl };
        await persistProfileUpdates(merged);
        setShowLinkedinPaste(false);
        setActiveTab('portfolio');
        setSuccessMessage('LinkedIn profile imported and portfolio updated.');
        setStatus('saved');
      } else {
        const updatedSocial = { ...(profile.socialLinks || {}), linkedin: linkedinUrl };
        const saveRes = await authFetch('/api/user/profile', {
          method: 'PUT',
          body: JSON.stringify({ socialLinks: updatedSocial }),
        });
        if (!saveRes.ok) {
          throw new Error(await readApiErrorMessage(saveRes, 'Could not save the LinkedIn address.'));
        }
        const normalized = normalizeProfileData(await saveRes.json());
        setProfile(prev => ({ ...prev, ...normalized }));
        setShowLinkedinPaste(true);
        setLinkedinFallbackNotice(
          data.message ||
          'Paste your LinkedIn profile text or upload your LinkedIn PDF to fill in available portfolio details.'
        );
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'LinkedIn lookup failed. Please try again.');
      setStatus('error');
    } finally {
      setLinkedinImporting(false);
    }
  };

  const handleLinkedinPasteImport = async () => {
    if (!linkedinPasteText.trim()) {
      setErrorMessage('Paste your LinkedIn profile text first, or upload your LinkedIn PDF.');
      setStatus('error');
      return;
    }
    setLinkedinImporting(true);
    setStatus('idle');
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const res = await authFetch('/api/resume/import-linkedin', {
        method: 'POST',
        body: JSON.stringify({ exportText: linkedinPasteText }),
      });
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, 'Could not parse LinkedIn profile text.'));
      }
      const data = await res.json();
      if (data.profileData) {
        const parsedInput = normalizeLinkedinInput(linkedinInput);
        const imported = {
          ...data.profileData,
          linkedin: data.profileData.linkedin || parsedInput?.url || profile.socialLinks?.linkedin || '',
        };
        const merged = fillLinkedinBlanks(profile, imported);
        await persistProfileUpdates(merged);
        setShowLinkedinPaste(false);
        setLinkedinPasteText('');
        setLinkedinFallbackNotice('');
        setActiveTab('portfolio');
        setSuccessMessage('LinkedIn details auto-filled into your portfolio.');
        setStatus('saved');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Could not parse LinkedIn text.');
      setStatus('error');
    } finally {
      setLinkedinImporting(false);
    }
  };

  const handleLinkedInFileChange = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please select a LinkedIn PDF export.');
      setStatus('error');
      e.target.value = '';
      return;
    }
    setLinkedinImporting(true);
    setStatus('idle');
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const form = new FormData();
      form.append('file', file);

      const res = await authFetch('/api/resume/import-linkedin', {
        method: 'POST',
        headers: mergeAuthHeaders({}, user),
        body: form
      });

      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, 'LinkedIn import failed'));
      }
      const data = await res.json();

      if (data.profileData) {
        const parsedInput = normalizeLinkedinInput(linkedinInput);
        const imported = {
          ...data.profileData,
          linkedin: data.profileData.linkedin || parsedInput?.url || profile.socialLinks?.linkedin || '',
        };
        const merged = fillLinkedinBlanks(profile, imported);
        await persistProfileUpdates(merged);
        if (imported.linkedin) setLinkedinInput(imported.linkedin);
        setShowLinkedinPaste(false);
        setLinkedinFallbackNotice('');
        setActiveTab('portfolio');
        setSuccessMessage('LinkedIn PDF imported and portfolio updated.');
        setStatus('saved');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'LinkedIn import failed. Please try again.');
      setStatus('error');
    }
    setLinkedinImporting(false);
    if (linkedinInputRef.current) linkedinInputRef.current.value = '';
  };

  const handleResumeImport = () => {
    resumeInputRef.current?.click();
  };

  const handleResumeFileChange = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    if (!allowedExtensions.some((extension) => file.name.toLowerCase().endsWith(extension))) {
      setErrorMessage('Please select a PDF, DOC, or DOCX resume.');
      setStatus('error');
      e.target.value = '';
      return;
    }
    setResumeImporting(true);
    setStatus('idle');
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const form = new FormData();
      form.append('resume', file);

      const res = await authFetch('/api/resume/analyze', {
        method: 'POST',
        headers: mergeAuthHeaders({}, user),
        body: form
      });

      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, 'Resume import failed'));
      }
      const data = await res.json();

      if (data.resumeProfile) {
        const rp = data.resumeProfile;

        const inferredSkills = Array.isArray(rp.coreSkills)
          ? rp.coreSkills.map((skill) => String(skill || '').trim()).filter(Boolean)
          : [];
        const safeSkills = inferredSkills.filter((skill) => skill.length >= 2);

        const inferredExperience = Array.isArray(rp.likelyQuestionAreas)
          ? filterHighConfidenceExperienceAreas(rp.likelyQuestionAreas)
          : [];

        const safeHeadline = isHighConfidenceHeadline(rp.candidateHeadline)
          ? String(rp.candidateHeadline).trim()
          : '';

        const safeSummary = (() => {
          const summary = String(rp.summary || '').trim();
          if (summary.length < 40) return '';
          if (summary.toLowerCase().includes('focus on the candidate')) return '';
          return summary;
        })();

        setProfile(prev => ({
          ...prev,
          currentRole: safeHeadline || prev.currentRole,
          designation: safeHeadline || prev.designation,
          skills: safeSkills.length >= 2 ? safeSkills.join(', ') : prev.skills,
          experience: inferredExperience.length ? inferredExperience.join('; ') : prev.experience,
          experienceLevel: inferredExperience.length ? inferredExperience.join('; ') : prev.experienceLevel,
          experience_level: inferredExperience.length ? inferredExperience.join('; ') : prev.experience_level,
          bio: safeSummary || prev.bio
        }));
        setResumeSnapshot(data.resumeProfile);
        setEditing(true);
        setSuccessMessage('Resume data imported. Review and save to keep these changes.');

        setStatus('saved');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Resume import failed. Please try again.');
      setStatus('error');
    }
    setResumeImporting(false);
    if (resumeInputRef.current) resumeInputRef.current.value = '';
  };

  const handleAvatarButtonClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarFileChange = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file for your avatar.');
      setStatus('error');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Avatar images must be 5 MB or smaller.');
      setStatus('error');
      e.target.value = '';
      return;
    }
    setSaving(true);
    setStatus('idle');
    try {
      const form = new FormData();
      form.append('avatar', file);

      const headers = mergeAuthHeaders({}, user);

      const res = await authFetch('/api/user/profile/avatar', {
        method: 'POST',
        headers,
        body: form,
      });

      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, 'Avatar upload failed. Please try again.'));
      }
      const data = await res.json();

      const normalized = normalizeProfileData(data);

      setAvatarLoadError(false);
      setProfile((prev) => ({ ...prev, ...normalized }));
      setSuccessMessage('Profile photo updated.');
      setStatus('saved');
    } catch (err) {
      console.error('Avatar upload error:', err);
      setErrorMessage(err.message || 'Avatar upload failed. Please try again.');
      setStatus('error');
    }
    setSaving(false);
    // Clear input so same file can be selected again
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const displayName = profile.fullName || user?.fullName || 'User';
  const initial = (displayName || user?.email || '?').charAt(0).toUpperCase();
  const emailDisplay = profile.email || user?.email || 'Email not set';
  const interviewsDone = dashboardData?.stats?.mockInterviews || 0;
  const aiMatches = dashboardData?.stats?.problemsSolved || 0;
  const coverLetters = dashboardData?.stats?.resumesAnalyzed || 0;
  const suggestedSlug = displayName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'user';
  const activeSlug = profile.custom_url || profile.id || user?.id || '';
  const publicAppUrl = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/+$/, '');
  const publicAppHost = publicAppUrl.replace(/^https?:\/\//i, '');
  const profileLink = activeSlug ? `${publicAppUrl}/u/${activeSlug}` : '';
  const localProfilePath = activeSlug ? `/u/${activeSlug}` : '#';
  const roleDisplay = profile.currentRole || resumeSnapshot?.candidateHeadline || 'Not set';
  const _educationDisplay = profile.education || 'Not set';
  const skillChips = splitSkillChips(profile.skills, resumeSnapshot);
  const experiencePoints = splitExperiencePoints(profile.experience, resumeSnapshot);
  const projects = Array.isArray(resumeSnapshot?.projectHighlights)
    ? resumeSnapshot.projectHighlights.slice(0, 2)
    : [];
  const portfolioProjects = Array.isArray(profile.projects) && profile.projects.length > 0
    ? profile.projects.slice(0, 6)
    : projects.map((proj, idx) => ({
      id: `resume-proj-${idx}`,
      name: `Featured Project ${idx + 1}`,
      description: proj,
      stack: [],
    }));
  const githubHref = profile.githubUsername
    ? `https://github.com/${encodeURIComponent(profile.githubUsername)}`
    : '';
  const profileSummary = profile.bio || resumeSnapshot?.summary || 'No bio added yet.';
  const resumeAutofillApplied = Object.keys(autofillSuggestions).length > 0;
  const locationDisplay = profile.location || 'Location not set';
  const companyDisplay = profile.company || 'Company not set';
  const yearsExpDisplay = profile.yearsOfExperience || 'N/A';
  const specializationDisplay = profile.specialization || 'None specified';
  const profileCompletion = calculateProfileCompletion(profile, resumeSnapshot);
  const completionLabel = profileCompletion >= 100 ? 'Complete!' : `${profileCompletion}%`;
  const RING_CIRCUMFERENCE = 2 * Math.PI * 20;
  const ringDashoffset = RING_CIRCUMFERENCE - (profileCompletion / 100) * RING_CIRCUMFERENCE;
  const planBadgeMeta = getPlanBadgeMeta(profile.subscriptionTier || user?.subscriptionTier);
  const websiteHref = normalizeExternalUrl(profile.website);
  const linkedinHref = buildSocialUrl('linkedin', profile.socialLinks?.linkedin);
  const twitterHref = buildSocialUrl('twitter', profile.socialLinks?.twitter);
  const portfolioHref = buildSocialUrl('portfolio', profile.socialLinks?.portfolio);
  const dribbbleHref = buildSocialUrl('dribbble', profile.socialLinks?.dribbble);

  const dismissToast = () => {
    window.clearTimeout(toastFadeTimerRef.current);
    window.clearTimeout(toastHideTimerRef.current);
    setToastExiting(true);
    toastHideTimerRef.current = window.setTimeout(() => {
      setStatus('idle');
      setToastExiting(false);
    }, 300);
  };

  const handleDiscard = () => {
    setEditing(false);
    setAutofillSuggestions({});
    setErrorMessage('');
    setStatus('idle');
    fetchProfile();
  };

  return (
    <div className="du-profile">
      {/* ═══ Profile Header ═══ */}
      <div className="du-profile-header">
        <div className="du-profile-identity">
          <div className="du-profile-left">
            <div className="du-avatar">
              {profile.avatar_url && !avatarLoadError ? (
                <img
                  src={profile.avatar_url}
                  alt={`${displayName}'s avatar`}
                  className="du-avatar-img"
                  onError={() => setAvatarLoadError(true)}
                />
              ) : (
                initial
              )}
              <span className="du-avatar-online" />
              <button
                className={`du-change-photo-btn${editing ? ' is-visible' : ''}`}
                type="button"
                onClick={handleAvatarButtonClick}
                aria-label="Change profile photo"
              >
                <Camera size={14} />
                Change Photo
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarFileChange}
              />
            </div>
            <div className="du-profile-info">
              <h1 className="du-profile-name">
                {displayName}
                <button
                  className="du-name-edit"
                  type="button"
                  aria-label="Edit display name"
                  onClick={() => { setActiveTab('basic'); setEditing(true); }}
                >
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

              <span className={`du-plan-badge is-${planBadgeMeta.tier}`}>
                <Sparkles size={12} />
                {planBadgeMeta.label}
              </span>

              {/* Profile Completion Ring */}
              {profileCompletion < 100 && (
                <div className="du-completion-ring-wrap">
                  <div className="du-completion-ring">
                    <svg viewBox="0 0 44 44">
                      <circle className="du-completion-ring-bg" cx="22" cy="22" r="20" />
                      <circle
                        className="du-completion-ring-fill"
                        cx="22" cy="22" r="20"
                        strokeDasharray={RING_CIRCUMFERENCE}
                        strokeDashoffset={ringDashoffset}
                      />
                    </svg>
                    <span className="du-completion-ring-text">{completionLabel}</span>
                  </div>
                  <div className="du-completion-info">
                    <p className="du-completion-title">Profile {completionLabel} complete</p>
                    <p className="du-completion-subtitle">Fill in all fields to earn 20 bonus coins</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="du-profile-meta">
            <div className="du-meta-row">
              <div className="du-meta-left">
                <Link2 size={16} />
                <div>
                  <p className="du-meta-title">{profile.is_public ? 'Public Profile Link' : 'Private Profile Preview'}</p>
                  <a
                    href={localProfilePath}
                    target="_blank"
                    rel="noreferrer"
                    className="du-meta-subtitle du-profile-url"
                    title="Open public profile in new tab"
                  >
                    {profileLink}
                    <ExternalLink size={12} style={{ display: 'inline', marginLeft: 4 }} />
                  </a>
                </div>
              </div>
              {!claimEditing ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className="du-copy-btn" onClick={handleCopyLink} disabled={!profile.is_public || !activeSlug || visibilitySaving} type="button">
                    {linkCopied ? <Check size={12} /> : <Copy size={12} />}
                    {linkCopied ? 'Copied' : 'Copy Public Link'}
                  </button>
                  <button className="du-claim-btn" onClick={toggleProfileVisibility} disabled={visibilitySaving || editing} type="button">
                    {profile.is_public ? 'Make profile private' : 'Make profile public'}
                  </button>
                  <button
                    className="du-claim-btn"
                    type="button"
                    onClick={() => {
                      setClaimEditing(true);
                      setClaimValue(profile.custom_url || suggestedSlug);
                    }}
                  >
                    {profile.custom_url ? 'Edit Custom URL' : 'Claim Custom URL'}
                  </button>
                  <a
                    href={localProfilePath}
                    target="_blank"
                    rel="noreferrer"
                    className="du-copy-btn"
                    style={{ textDecoration: 'none' }}
                  >
                    <ExternalLink size={13} />
                    View
                  </a>
                </div>
              ) : (
                <div className="du-claim-input-group" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{publicAppHost}/u/</span>
                  <input
                    className="du-form-input"
                    style={{ width: 'auto', minWidth: 150 }}
                    placeholder="your-custom-slug"
                    value={claimValue}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
                      setClaimValue(val);
                    }}
                    autoFocus
                  />
                  <button
                    className="du-claim-btn"
                    type="button"
                    disabled={claimStatus === 'busy'}
                    onClick={handleClaimUrl}
                  >
                    {claimStatus === 'busy' ? 'Saving...' : (profile.custom_url ? 'Update' : 'Claim')}
                  </button>
                  <button
                    className="du-cancel-btn"
                    type="button"
                    onClick={() => { setClaimEditing(false); setClaimStatus('idle'); }}
                  >
                    Cancel
                  </button>
                </div>
              )}
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
              className={`du-tab ${activeTab === 'portfolio' ? 'active' : ''}`}
              onClick={() => setActiveTab('portfolio')}
            >
              <Layout size={16} />
              Portfolio
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
                {activeTab === 'portfolio' && <Layout />}
                {activeTab === 'social' && <Users />}

                {activeTab === 'basic' && 'Basic Information'}
                {activeTab === 'professional' && 'Professional Details'}
                {activeTab === 'portfolio' && 'Your Generated Portfolio'}
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

            <div className="du-linkedin-id-bar">
              <div className="du-linkedin-id-input-wrap">
                <Linkedin size={15} className="du-linkedin-id-icon" />
                <input
                  type="text"
                  className="du-linkedin-id-input"
                  value={linkedinInput}
                  onChange={(e) => setLinkedinInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLinkedinIdImport()}
                  placeholder="Enter LinkedIn user ID or URL (e.g. john-doe)"
                  aria-label="LinkedIn user ID or profile URL"
                  disabled={linkedinImporting}
                />
              </div>
              <button
                type="button"
                className="du-linkedin-id-btn"
                onClick={handleLinkedinIdImport}
                disabled={linkedinImporting || !linkedinInput.trim()}
              >
                <Sparkles size={14} />
                {linkedinImporting ? 'Importing...' : 'Auto-Fill from LinkedIn ID'}
              </button>
              <button
                type="button"
                className="du-linkedin-paste-toggle"
                onClick={() => setShowLinkedinPaste((prev) => !prev)}
                disabled={linkedinImporting}
              >
                {showLinkedinPaste ? 'Hide Paste Box' : 'Paste LinkedIn Text'}
              </button>
            </div>

            {showLinkedinPaste && (
              <div className="du-linkedin-paste-card">
                <p className="du-linkedin-paste-notice">
                  {linkedinFallbackNotice ||
                    'Open your LinkedIn profile, press Ctrl+A then Ctrl+C (or save as PDF), and paste below to auto-fill all sections.'}
                </p>
                <textarea
                  className="du-form-textarea"
                  rows={4}
                  value={linkedinPasteText}
                  onChange={(e) => setLinkedinPasteText(e.target.value)}
                  placeholder="Paste your LinkedIn profile text here (Name, Headline, About, Experience, Education, Skills)..."
                />
                <div className="du-linkedin-paste-actions">
                  <button
                    type="button"
                    className="du-save-btn"
                    onClick={handleLinkedinPasteImport}
                    disabled={linkedinImporting || !linkedinPasteText.trim()}
                  >
                    <Sparkles size={14} />
                    {linkedinImporting ? 'Auto-Filling...' : 'Auto-Fill Portfolio'}
                  </button>
                  <button
                    type="button"
                    className="du-import-linkedin-btn"
                    onClick={handleLinkedInImport}
                    disabled={linkedinImporting}
                  >
                    <Upload size={14} />
                    Upload LinkedIn PDF Instead
                  </button>
                  <button
                    type="button"
                    className="du-cancel-btn"
                    onClick={() => setShowLinkedinPaste(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="du-import-actions">
              <button
                className="du-import-resume-btn"
                onClick={handleResumeImport}
                disabled={resumeImporting}
              >
                <Upload size={14} /> {resumeImporting ? 'Importing...' : 'Import from Resume'}
              </button>
              <button
                className="du-import-linkedin-btn"
                onClick={handleLinkedInImport}
                disabled={linkedinImporting}
              >
                <Link2 size={14} /> {linkedinImporting ? 'Importing...' : 'Import LinkedIn PDF'}
              </button>
              <input type="file" ref={linkedinInputRef} accept=".pdf" style={{ display: 'none' }} onChange={handleLinkedInFileChange} />
              <input type="file" ref={resumeInputRef} accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleResumeFileChange} />
            </div>

            <p className="du-linkedin-hint">Add your LinkedIn user ID (or paste profile text / upload PDF) and connect GitHub to auto-fill your portfolio view.</p>

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
                <div className="du-tab-content du-showcase-basic-info">
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
                    {profile.website && websiteHref && (
                      <div className="du-showcase-contact-item">
                        <Link2 size={16} className="du-contact-icon" />
                        <div className="du-contact-label">Website</div>
                        <a href={websiteHref}
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
                <div className="du-tab-content du-showcase-professional-info">
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
                <div className="du-tab-content du-showcase-social-links">
                  <div className="du-social-link-item">
                    <div className="du-social-platform">LinkedIn</div>
                    <div className="du-social-url">
                      {linkedinHref ? (
                        <a href={linkedinHref}
                          target="_blank" rel="noopener noreferrer">
                          {profile.socialLinks.linkedin}
                        </a>
                      ) : 'Not connected'}
                    </div>
                  </div>
                  <div className="du-social-link-item">
                    <div className="du-social-platform">Twitter / X</div>
                    <div className="du-social-url">
                      {twitterHref ? (
                        <a href={twitterHref}
                          target="_blank" rel="noopener noreferrer">
                          {profile.socialLinks.twitter}
                        </a>
                      ) : 'Not connected'}
                    </div>
                  </div>
                  <div className="du-social-link-item">
                    <div className="du-social-platform">Portfolio</div>
                    <div className="du-social-url">
                      {portfolioHref ? (
                        <a href={portfolioHref}
                          target="_blank" rel="noopener noreferrer">
                          {profile.socialLinks.portfolio}
                        </a>
                      ) : 'Not set'}
                    </div>
                  </div>
                  <div className="du-social-link-item">
                    <div className="du-social-platform">Dribbble</div>
                    <div className="du-social-url">
                      {dribbbleHref ? (
                        <a href={dribbbleHref}
                          target="_blank" rel="noopener noreferrer">
                          {profile.socialLinks.dribbble}
                        </a>
                      ) : 'Not connected'}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'portfolio' && (
                <div className={`du-tab-content du-portfolio-showcase is-theme-${profile.profileTheme || 'aurora'}`}>
                  {/* CTA Banner */}
                  <div className="du-portfolio-cta-banner">
                    <div className="du-portfolio-cta-left">
                      <Layout size={20} />
                      <div>
                        <strong>Your Live Portfolio Preview</strong>
                        <p>Auto-populated from your LinkedIn, GitHub, and resume data. Share your public URL or customize further.</p>
                      </div>
                    </div>
                    <div className="du-portfolio-cta-actions">
                      <a
                        href={localProfilePath}
                        target="_blank"
                        rel="noreferrer"
                        className="du-copy-btn"
                        style={{ textDecoration: 'none' }}
                      >
                        <ExternalLink size={13} /> Open Public View
                      </a>
                      <button
                        type="button"
                        className="du-portfolio-cta-btn"
                        onClick={() => navigate('/portfolio-creator', {
                          state: {
                            form: {
                              useSavedProfile: true,
                              githubUsername: profile.githubUsername || '',
                              linkedinUrl: linkedinHref || '',
                            },
                          },
                        })}
                      >
                        <Sparkles size={14} /> Customize Portfolio →
                      </button>
                    </div>
                  </div>

                  {/* Portfolio Hero */}
                  <div className="du-portfolio-header-premium">
                    <div className="du-portfolio-hero-avatar">
                      {profile.avatar_url && !avatarLoadError ? (
                        <img
                          src={profile.avatar_url}
                          alt={`${displayName}'s portrait`}
                          onError={() => setAvatarLoadError(true)}
                        />
                      ) : (
                        <span>{initial}</span>
                      )}
                    </div>
                    <div className="du-portfolio-hero-badges">
                      <span className="du-portfolio-hero-badge">
                        <Sparkles size={12} /> Portfolio
                      </span>
                      {profile.company && (
                        <span className="du-portfolio-hero-badge is-subtle">
                          <Building size={12} /> {profile.company}
                        </span>
                      )}
                      {profile.yearsOfExperience && (
                        <span className="du-portfolio-hero-badge is-subtle">
                          <Award size={12} /> {profile.yearsOfExperience} exp
                        </span>
                      )}
                    </div>
                    <h1 className="du-portfolio-title">{profile.fullName || 'Your Name'}</h1>
                    <h3 className="du-portfolio-role">{roleDisplay}</h3>
                    {profile.location && (
                      <p className="du-portfolio-location">
                        <LocationIcon size={14} /> {profile.location}
                      </p>
                    )}

                    <div className="du-portfolio-social-pills">
                      {linkedinHref && (
                        <a href={linkedinHref} target="_blank" rel="noopener noreferrer" className="du-portfolio-social-pill">
                          <Linkedin size={13} /> LinkedIn
                        </a>
                      )}
                      {githubHref && (
                        <a href={githubHref} target="_blank" rel="noopener noreferrer" className="du-portfolio-social-pill">
                          <Github size={13} /> GitHub
                        </a>
                      )}
                      {twitterHref && (
                        <a href={twitterHref} target="_blank" rel="noopener noreferrer" className="du-portfolio-social-pill">
                          <Twitter size={13} /> Twitter
                        </a>
                      )}
                      {websiteHref && (
                        <a href={websiteHref} target="_blank" rel="noopener noreferrer" className="du-portfolio-social-pill">
                          <Globe size={13} /> Website
                        </a>
                      )}
                      {portfolioHref && (
                        <a href={portfolioHref} target="_blank" rel="noopener noreferrer" className="du-portfolio-social-pill">
                          <ExternalLink size={13} /> Portfolio
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="du-portfolio-body-grid">
                    <div className="du-portfolio-main">
                      {profileSummary && (
                        <div className="du-portfolio-section-card">
                          <h4 className="du-portfolio-section-title">
                            <FileText size={18} /> About Me
                          </h4>
                          <p className="du-portfolio-text">{profileSummary}</p>
                        </div>
                      )}

                      {portfolioProjects.length > 0 && (
                        <div className="du-portfolio-section-card">
                          <h4 className="du-portfolio-section-title">
                            <Code size={18} /> Featured Projects
                          </h4>
                          <div className="du-portfolio-projects-grid">
                            {portfolioProjects.map((proj, idx) => {
                              const stack = Array.isArray(proj.stack) ? proj.stack : [];
                              const repoUrl = normalizeExternalUrl(proj.repoUrl);
                              const liveUrl = normalizeExternalUrl(proj.liveUrl);
                              const stars = Number(proj.metrics?.stars || 0);
                              const forks = Number(proj.metrics?.forks || 0);
                              return (
                                <article key={proj.id || idx} className="du-portfolio-project-card">
                                  <div className="du-portfolio-project-head">
                                    <strong>{proj.name || `Project ${idx + 1}`}</strong>
                                    <div className="du-portfolio-project-metrics">
                                      {stars > 0 && <span><Star size={12} /> {stars}</span>}
                                      {forks > 0 && <span><GitFork size={12} /> {forks}</span>}
                                    </div>
                                  </div>
                                  {proj.description && (
                                    <p className="du-portfolio-project-desc">{proj.description}</p>
                                  )}
                                  {stack.length > 0 && (
                                    <div className="du-portfolio-project-stack">
                                      {stack.slice(0, 4).map((tech) => (
                                        <span key={tech} className="du-portfolio-project-tag">{tech}</span>
                                      ))}
                                    </div>
                                  )}
                                  {(repoUrl || liveUrl) && (
                                    <div className="du-portfolio-project-links">
                                      {repoUrl && (
                                        <a href={repoUrl} target="_blank" rel="noopener noreferrer">
                                          <Github size={13} /> Code
                                        </a>
                                      )}
                                      {liveUrl && (
                                        <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink size={13} /> Live
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </article>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="du-portfolio-section-card">
                        <h4 className="du-portfolio-section-title">
                          <Briefcase size={18} /> Experience
                        </h4>
                        {experiencePoints.length ? (
                          <div className="du-portfolio-timeline">
                            {experiencePoints.map((point, idx) => (
                              <div key={idx} className="du-portfolio-exp-item">
                                <span className="du-portfolio-exp-dot" />
                                <p className="du-portfolio-exp-text">{point}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="du-portfolio-text" style={{ opacity: 0.6 }}>
                            No experience listed yet. Add your LinkedIn profile or resume to auto-fill.
                          </p>
                        )}
                      </div>

                      {profile.education && (
                        <div className="du-portfolio-section-card">
                          <h4 className="du-portfolio-section-title">
                            <GraduationCap size={18} /> Education
                          </h4>
                          <p className="du-portfolio-text">{profile.education}</p>
                        </div>
                      )}
                    </div>

                    <div className="du-portfolio-sidebar">
                      <div className="du-portfolio-section-card">
                        <h4 className="du-portfolio-section-title">
                          <Zap size={18} /> Skills &amp; Stack
                        </h4>
                        <div className="du-portfolio-skills-grid">
                          {skillChips.length ? skillChips.map(skill => (
                            <span key={skill} className="du-portfolio-skill-chip">{skill}</span>
                          )) : <p className="du-portfolio-text" style={{ opacity: 0.6 }}>No skills listed.</p>}
                        </div>
                      </div>

                      <div className="du-portfolio-section-card">
                        <h4 className="du-portfolio-section-title">
                          <Mail size={18} /> Contact &amp; Links
                        </h4>
                        <ul className="du-portfolio-contact-list">
                          <li className="du-portfolio-contact-item">
                            <Mail size={16} /> <span>{emailDisplay}</span>
                          </li>
                          {profile.phone && (
                            <li className="du-portfolio-contact-item">
                              <Phone size={16} /> <span>{profile.phone}</span>
                            </li>
                          )}
                          {profile.website && websiteHref && (
                            <li className="du-portfolio-contact-item">
                              <Globe size={16} />
                              <a href={websiteHref} target="_blank" rel="noopener noreferrer">
                                {profile.website}
                              </a>
                            </li>
                          )}
                          {linkedinHref && (
                            <li className="du-portfolio-contact-item">
                              <Linkedin size={16} />
                              <a href={linkedinHref} target="_blank" rel="noopener noreferrer">
                                LinkedIn Profile
                              </a>
                            </li>
                          )}
                          {githubHref && (
                            <li className="du-portfolio-contact-item">
                              <Github size={16} />
                              <a href={githubHref} target="_blank" rel="noopener noreferrer">
                                @{profile.githubUsername}
                              </a>
                            </li>
                          )}
                        </ul>
                      </div>
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

            {editing && activeTab === 'portfolio' && (
              <div className="du-portfolio-edit-info">
                <Info size={16} />
                <span>Portfolio content is generated from your <strong>Basic</strong> and <strong>Professional</strong> info. Update those tabs, then visit the <strong>Portfolio Creator</strong> for full customization.</span>
              </div>
            )}

            {editing && (
              <div className="du-form-actions">
                <button className="du-save-btn" onClick={handleSave} disabled={saving}>
                  <Save size={14} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  className="du-cancel-btn"
                  type="button"
                  onClick={handleDiscard}
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
                {githubChartError ? (
                  <p className="du-card-subtitle">
                    Could not load contribution chart for <strong>@{profile.githubUsername}</strong>. Verify your GitHub username or{' '}
                    <a
                      href={`https://github.com/${encodeURIComponent(profile.githubUsername)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="du-link"
                    >
                      view profile on GitHub
                    </a>.
                  </p>
                ) : (
                  <img
                    src={`https://ghchart.rshah.org/2cee91/${encodeURIComponent(profile.githubUsername)}`}
                    alt={`${profile.githubUsername}'s Github chart`}
                    style={{ width: '100%', maxWidth: '100%' }}
                    onError={() => setGithubChartError(true)}
                  />
                )}
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
              {jobMatchesLoading ? (
                <p style={{ color: '#a1a1aa', fontSize: 13, padding: '8px 0' }}>Loading matches...</p>
              ) : jobMatches.length === 0 ? (
                <p style={{ color: '#a1a1aa', fontSize: 13, padding: '8px 0' }}>Complete your profile skills to see job matches.</p>
              ) : jobMatches.map(match => (
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
              <span className={`du-plan-pill is-${planBadgeMeta.tier}`}>{planBadgeMeta.pill}</span>
            </div>
            <div className="du-sub-meters">
              <div className="du-sub-meter">
                <div className="du-sub-meter-top">
                  <span className="du-sub-meter-label">Problems Solved</span>
                  <span className="du-sub-meter-value">{aiMatches}/100</span>
                </div>
                <div className="du-progress-track">
                  <div className="du-progress-fill" style={{ width: `${Math.min((aiMatches / 100) * 100, 100)}%` }} />
                </div>
              </div>
              <div className="du-sub-meter">
                <div className="du-sub-meter-top">
                  <span className="du-sub-meter-label">Resumes Analyzed</span>
                  <span className="du-sub-meter-value">{coverLetters}/10</span>
                </div>
                <div className="du-progress-track">
                  <div className="du-progress-fill" style={{ width: `${Math.min((coverLetters / 10) * 100, 100)}%` }} />
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
            <label className="du-theme-selector">
              <span>Choose a public profile theme</span>
              <select
                className="du-form-input"
                value={profile.profileTheme || 'aurora'}
                onChange={handleProfileThemeChange}
                disabled={themeSaving}
              >
                <option value="aurora">Aurora (Default)</option>
                <option value="midnight">Midnight</option>
                <option value="sunrise">Sunrise</option>
              </select>
              {themeSaving && <small>Saving theme...</small>}
            </label>
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
                <div className="du-stat-label">Mock Interviews</div>
              </div>
              <div className="du-stat-item">
                <div className="du-stat-value">{aiMatches}</div>
                <div className="du-stat-label">Problems Solved</div>
              </div>
              <div className="du-stat-item">
                <div className="du-stat-value">{coverLetters}</div>
                <div className="du-stat-label">Resumes Analyzed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Toast Notifications ═══ */}
      {status === 'saved' && (
        <div className={`du-toast success${toastExiting ? ' exiting' : ''}`} role="status" aria-live="polite">
          <Check size={16} />
          {successMessage || 'Profile saved successfully.'}{rewardMessage ? ` ${rewardMessage}` : ''}
          <button className="du-toast-close" onClick={dismissToast} type="button" aria-label="Dismiss">
            <X size={12} />
          </button>
        </div>
      )}
      {status === 'error' && (
        <div className={`du-toast error${toastExiting ? ' exiting' : ''}`} role="alert">
          <X size={16} />
          {errorMessage || 'Could not save profile. Please try again.'}
          <button className="du-toast-close" onClick={dismissToast} type="button" aria-label="Dismiss">
            <X size={12} />
          </button>
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
