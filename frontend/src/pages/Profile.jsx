import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCoins } from '../context/CoinContext';
import useDashboardData from '../hooks/useDashboardData';
import { buildAuthHeaders } from '../utils/authHeaders';
import {
  User, Briefcase, Award, LogOut, Shield
} from 'lucide-react';
import { StreakHeatmap } from '../components/QuickStats';

const PROFILE_FIELDS = [
  { label: 'Full Name', key: 'fullName', icon: User, hint: 'Display name across PrepLoop' },
  { label: 'Current Role', key: 'currentRole', icon: Briefcase, hint: 'What you are preparing for' },
  { label: 'Experience', key: 'experience', icon: Award, hint: 'Years, level, or current stage' },
  { label: 'Education', key: 'education', icon: Shield, hint: 'Degree, institute, or certification' }
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
    education: ''
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
    education: data?.education ?? ''
  };
}

function buildProfilePayload(profile) {
  const trimmedFullName = profile.fullName?.trim() || '';
  const trimmedCurrentRole = profile.currentRole?.trim() || '';
  const trimmedExperience = profile.experience?.trim() || '';

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
    bio: profile.bio?.trim() || ''
  };
}

function countFilledProfileFields(profile) {
  const values = [profile.fullName, profile.currentRole, profile.experience, profile.skills, profile.education, profile.bio];
  return values.filter((value) => Boolean(String(value || '').trim())).length;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { refreshBalance } = useCoins();
  const { data: dashboardData, loading: dashboardLoading } = useDashboardData();
  const [profile, setProfile] = useState({
    ...buildInitialProfile(user)
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('idle');
  const [rewardMessage, setRewardMessage] = useState('');

  useEffect(() => {
    if (status !== 'saved') return undefined;
    const timer = window.setTimeout(() => setStatus('idle'), 2600);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (!rewardMessage) return undefined;
    const timer = window.setTimeout(() => setRewardMessage(''), 4000);
    return () => window.clearTimeout(timer);
  }, [rewardMessage]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile', { headers: buildAuthHeaders(user) });
      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => ({
          ...prev,
          ...normalizeProfileData(data),
          ...normalizeProfileData(data?.user)
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

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
      if (!res.ok) {
        throw new Error('Failed to save profile');
      }
      const data = await res.json();
      if (data?.coinsAwarded) {
        setRewardMessage(`+${data.coinsAwarded} coins earned for completing your profile.`);
      }
      refreshBalance();
      setEditing(false);
      setStatus('saved');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
    setSaving(false);
  };

  const filledFields = countFilledProfileFields(profile);
  const completion = Math.round((filledFields / 6) * 100);
  const displayName = profile.fullName || user?.fullName || 'User';
  const initial = (displayName || user?.email || '?').charAt(0).toUpperCase();
  const roleLabel = profile.currentRole || profile.designation || 'Role not set';
  const experienceLabel = profile.experience || profile.experienceLevel || 'Experience not set';
  const skillsLabel = profile.skills || 'No skills added yet';
  const educationLabel = profile.education || 'Education not set';
  const heatmapData = dashboardData?.heatmapData || {};
  const currentStreak = dashboardData?.streak || 0;
  const bestStreak = dashboardData?.bestStreak || 0;

  return (
    <div className="account-page profile-page">
      <div className="account-hero">
        <div className="account-hero-copy">
          <p className="account-kicker">Account</p>
          <h1>Profile</h1>
          <p>
            Keep your prep identity, resume context, and interview-ready details aligned in one place.
          </p>
          <div className="account-chip-row">
            <span className="account-chip">{completion}% complete</span>
            <span className="account-chip">{editing ? 'Editing' : 'Review mode'}</span>
            <span className="account-chip">20 coin bonus at 100%</span>
            <span className="account-chip">{status === 'saved' ? 'Saved' : status === 'error' ? 'Save failed' : 'Synced to account'}</span>
          </div>
        </div>
        <div className="account-hero-actions">
          <button
            onClick={() => {
              if (!editing) setStatus('idle');
              editing ? handleSave() : setEditing(true);
            }}
            className="btn-hero-primary account-hero-button"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Edit Profile'}
          </button>
          {editing && (
            <button
              type="button"
              className="account-secondary-button"
              onClick={() => {
                setEditing(false);
                fetchProfile();
              }}
            >
              Discard
            </button>
          )}
        </div>
      </div>

      {status === 'saved' && (
        <div className="account-status-message success" role="status" aria-live="polite">
          Profile changes saved successfully.
          {rewardMessage ? ` ${rewardMessage}` : ''}
        </div>
      )}
      {status === 'error' && (
        <div className="account-status-message error" role="alert">
          Could not save profile right now. Please try again.
        </div>
      )}

      <div className="account-stat-grid">
        <article className="account-stat-card">
          <span className="account-stat-label">Identity</span>
          <strong className="account-stat-value">{displayName}</strong>
          <span className="account-stat-meta">{profile.email || user?.email || 'No email available'}</span>
        </article>
        <article className="account-stat-card">
          <span className="account-stat-label">Profile depth</span>
          <strong className="account-stat-value">{filledFields}/6 fields</strong>
          <span className="account-stat-meta">Add role, experience, and skills for better personalization and unlock a one-time 20 coin bonus</span>
        </article>
        <article className="account-stat-card">
          <span className="account-stat-label">Plan</span>
          <strong className="account-stat-value">Starter</strong>
          <span className="account-stat-meta">Free forever with core practice tools</span>
        </article>
      </div>

      <div className="account-grid">
        <aside className="account-stack">
          <section className="account-panel account-profile-summary">
            <div className="account-profile-avatar">{initial}</div>
            <div className="account-profile-copy">
              <h2>{displayName}</h2>
              <p>{profile.email || user?.email || 'Email not set'}</p>
            </div>
            <div className="account-profile-lines">
              <div>
                <span>Current role</span>
                <strong>{roleLabel}</strong>
              </div>
              <div>
                <span>Experience</span>
                <strong>{experienceLabel}</strong>
              </div>
              <div>
                <span>Skills</span>
                <strong>{skillsLabel}</strong>
              </div>
              <div>
                <span>Education</span>
                <strong>{educationLabel}</strong>
              </div>
            </div>
          </section>

          <section className="account-panel">
            <div className="account-panel-header">
              <div>
                <p className="account-panel-eyebrow">Progress tracking</p>
                <h3>Streak heatmap</h3>
              </div>
            </div>
            <p className="account-panel-copy">
              Your solve rhythm is mapped across the last 365 days so you can spot consistency gaps quickly.
            </p>
            {dashboardLoading && Object.keys(heatmapData).length === 0 ? (
              <p className="account-panel-copy" style={{ marginTop: 16 }}>Loading streak heatmap...</p>
            ) : (
              <div style={{ marginTop: 16 }}>
                <StreakHeatmap
                  heatmapData={heatmapData}
                  streak={currentStreak}
                  bestStreak={bestStreak}
                  title="Streak Heatmap"
                  subtitle="A glanceable record of your daily problem-solving rhythm."
                />
              </div>
            )}
          </section>

          <section className="account-panel">
            <div className="account-panel-header">
              <div>
                <p className="account-panel-eyebrow">Subscription</p>
                <h3>Starter plan</h3>
              </div>
              <span className="account-pill">Free forever</span>
            </div>
            <p className="account-panel-copy">Limited features, full access to your prep workspace.</p>
            <Link to="/pricing" className="account-link-action">
              View upgrade options
            </Link>
          </section>
        </aside>

        <section className="account-stack">
          <div className="account-panel">
            <div className="account-panel-header">
              <div>
                <p className="account-panel-eyebrow">Details</p>
                <h3>Profile fields</h3>
              </div>
              <span className="account-panel-note">{editing ? 'Editing enabled' : 'Read only'}</span>
            </div>

            <div className="account-field-grid">
              {PROFILE_FIELDS.map((field) => {
                const FieldIcon = field.icon;
                return (
                  <div key={field.key} className="account-field">
                    <label className="account-field-label">
                      <FieldIcon size={14} />
                      <span>{field.label}</span>
                    </label>
                    <span className="account-field-hint">{field.hint}</span>
                    {editing ? (
                      <input
                        value={profile[field.key] || ''}
                        onChange={(event) => setProfile({ ...profile, [field.key]: event.target.value })}
                        className="account-input"
                        placeholder={field.label}
                      />
                    ) : (
                      <div className="account-field-display">
                        {profile[field.key] || 'Not set'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="account-field account-field-full">
              <label className="account-field-label">
                <Shield size={14} />
                <span>Bio</span>
              </label>
              <span className="account-field-hint">Keep it concise and interview-focused.</span>
              {editing ? (
                <textarea
                  value={profile.bio || ''}
                  onChange={(event) => setProfile({ ...profile, bio: event.target.value })}
                  rows={4}
                  placeholder="Tell us about yourself..."
                  className="account-textarea"
                />
              ) : (
                <div className="account-field-display account-field-display-multiline">
                  {profile.bio || 'No bio added yet.'}
                </div>
              )}
            </div>
          </div>

          <div className="account-panel account-danger-panel">
            <div className="account-panel-header">
              <div>
                <p className="account-panel-eyebrow">Danger zone</p>
                <h3>Account access</h3>
              </div>
            </div>
            <div className="account-danger-row">
              <p>Log out of your account on this device.</p>
              <button onClick={logout} className="account-danger-button">
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
