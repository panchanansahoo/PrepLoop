import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    Bell,
    Globe,
    Shield,
    Trash2,
    CreditCard,
    Save,
    Code,
    RotateCcw,
    Eye,
    EyeOff,
    Check,
    X,
    AlertTriangle,
    KeyRound,
    LogOut,
} from 'lucide-react';
import { authFetch } from '../utils/authFetch';
import { apiUrl } from '../config/api';
import { getPlanBadgeMeta, readApiErrorMessage } from '../utils/profileHelpers';
import './Dashboard.css';

const DEFAULT_SETTINGS = {
    emailNotifications: true,
    practiceReminders: true,
    weeklyReport: true,
    language: 'en',
    codeEditor: 'vscode',
    difficulty: 'medium',
};

const VALID_LANGUAGES = new Set(['en', 'hi', 'es']);
const VALID_EDITORS = new Set(['vscode', 'sublime', 'vim']);
const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

const PASSWORD_RULES = [
    { id: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
    { id: 'uppercase', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
    { id: 'lowercase', label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
    { id: 'number', label: 'One number', test: (v) => /[0-9]/.test(v) },
    { id: 'special', label: 'One special character', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

function readStorage(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch {
        // Ignore storage quota or private-browsing errors
    }
}

function difficultyFromExperienceLevel(level) {
    if (level === 'beginner') return 'easy';
    if (level === 'advanced' || level === 'expert') return 'hard';
    return 'medium';
}

function experienceLevelFromDifficulty(difficulty) {
    if (difficulty === 'easy') return 'beginner';
    if (difficulty === 'hard') return 'advanced';
    return 'intermediate';
}

function normalizeSettingsState(raw = {}, fallback = DEFAULT_SETTINGS) {
    const expDifficulty = raw.experience_level
        ? difficultyFromExperienceLevel(raw.experience_level)
        : fallback.difficulty;

    return {
        emailNotifications:
            typeof raw.emailNotifications === 'boolean'
                ? raw.emailNotifications
                : fallback.emailNotifications,
        practiceReminders:
            typeof raw.practiceReminders === 'boolean'
                ? raw.practiceReminders
                : fallback.practiceReminders,
        weeklyReport:
            typeof raw.weeklyReport === 'boolean'
                ? raw.weeklyReport
                : fallback.weeklyReport,
        language: VALID_LANGUAGES.has(raw.language) ? raw.language : fallback.language,
        codeEditor: VALID_EDITORS.has(raw.codeEditor) ? raw.codeEditor : fallback.codeEditor,
        difficulty: VALID_DIFFICULTIES.has(raw.difficulty) ? raw.difficulty : expDifficulty,
    };
}

function loadCachedSettings() {
    let cachedObj = {};
    const rawCache = readStorage('app-settings-cache');
    if (rawCache) {
        try {
            const parsed = JSON.parse(rawCache);
            if (parsed && typeof parsed === 'object') {
                cachedObj = parsed;
            }
        } catch {
            // Ignore malformed local cache
        }
    }

    const savedLang = readStorage('app-language');
    const savedEditor = readStorage('app-code-editor');

    return normalizeSettingsState({
        ...cachedObj,
        ...(savedLang ? { language: savedLang } : {}),
        ...(savedEditor ? { codeEditor: savedEditor } : {}),
    });
}

function syncLocalPreferences(s) {
    writeStorage('app-language', s.language);
    writeStorage('pg-voice-errors-lang', s.language === 'hi' ? 'hi' : 'en');
    writeStorage('app-code-editor', s.codeEditor);
    writeStorage('app-settings-cache', JSON.stringify(s));
}

function Toggle({ checked, onChange, label, disabled = false }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`account-toggle ${checked ? 'is-on' : 'is-off'}`}
        >
            <span className="account-toggle-thumb" />
        </button>
    );
}

function Section({ title, subtitle, icon, action, children }) {
    return (
        <section className="account-panel settings-section">
            <div className="account-panel-header">
                <div>
                    <p className="account-panel-eyebrow">{subtitle}</p>
                    <h3 className="settings-section-title">
                        {icon} <span>{title}</span>
                    </h3>
                </div>
                {action || null}
            </div>
            <div className="settings-section-body">
                {children}
            </div>
        </section>
    );
}

function SettingRow({ label, desc, htmlFor, children }) {
    return (
        <div className="settings-row">
            <div className="settings-row-copy">
                {htmlFor ? (
                    <label htmlFor={htmlFor} className="settings-row-label">{label}</label>
                ) : (
                    <div className="settings-row-label">{label}</div>
                )}
                {desc && <div className="settings-row-desc">{desc}</div>}
            </div>
            {children}
        </div>
    );
}

export default function Settings() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const initialCached = useMemo(() => loadCachedSettings(), []);
    const [settings, setSettings] = useState(initialCached);
    const [savedSnapshot, setSavedSnapshot] = useState(initialCached);
    const [subscriptionTier, setSubscriptionTier] = useState(
        () => user?.subscriptionTier || user?.subscription_tier || 'free'
    );
    const [authProvider, setAuthProvider] = useState('');
    const [loadingSettings, setLoadingSettings] = useState(Boolean(user));
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [status, setStatus] = useState('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [signingOut, setSigningOut] = useState(false);

    // Change Password modal state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPwd, setShowCurrentPwd] = useState(false);
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [pwdSaving, setPwdSaving] = useState(false);
    const [pwdError, setPwdError] = useState('');
    const [pwdSuccess, setPwdSuccess] = useState('');
    const [resetEmailSending, setResetEmailSending] = useState(false);

    // Delete Account modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const savedTimerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (savedTimerRef.current) {
                clearTimeout(savedTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        setSubscriptionTier(user?.subscriptionTier || user?.subscription_tier || 'free');
    }, [user?.subscriptionTier, user?.subscription_tier]);

    useEffect(() => {
        if (!user) {
            setLoadingSettings(false);
            return undefined;
        }

        const controller = new AbortController();
        let active = true;

        const fetchSettings = async () => {
            setLoadingSettings(true);
            try {
                const res = await authFetch(apiUrl('/api/user/settings'), {
                    signal: controller.signal,
                });
                if (res.ok && active) {
                    const data = await res.json();
                    if (data?.settings) {
                        const normalized = normalizeSettingsState(data.settings, loadCachedSettings());
                        setSettings(normalized);
                        setSavedSnapshot(normalized);
                        syncLocalPreferences(normalized);
                        if (data.settings.subscription_tier) {
                            setSubscriptionTier(data.settings.subscription_tier);
                        }
                        if (data.settings.authProvider) {
                            setAuthProvider(data.settings.authProvider);
                        }
                    }
                }
            } catch (err) {
                if (err?.name !== 'AbortError') {
                    console.error('Failed to fetch settings', err);
                }
            } finally {
                if (active) {
                    setLoadingSettings(false);
                }
            }
        };

        fetchSettings();
        return () => {
            active = false;
            controller.abort();
        };
    }, [user?.id]);

    useEffect(() => {
        if (!showPasswordModal && !showDeleteModal) return undefined;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (showPasswordModal && !pwdSaving) setShowPasswordModal(false);
                if (showDeleteModal && !deletingAccount) setShowDeleteModal(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showPasswordModal, showDeleteModal, pwdSaving, deletingAccount]);

    const isDirty = useMemo(
        () => JSON.stringify(settings) !== JSON.stringify(savedSnapshot),
        [settings, savedSnapshot]
    );

    const isDefaultSettings = useMemo(
        () => JSON.stringify(settings) === JSON.stringify(DEFAULT_SETTINGS),
        [settings]
    );

    const updateSetting = useCallback((key, value) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setStatus('idle');
        setStatusMessage('');
        setSaved(false);
    }, []);

    const handleDiscardChanges = () => {
        setSettings(savedSnapshot);
        setStatus('idle');
        setStatusMessage('');
        setSaved(false);
    };

    const handleResetDefaults = () => {
        setSettings(DEFAULT_SETTINGS);
        setStatus('idle');
        setStatusMessage('');
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setStatus('idle');
        setStatusMessage('');
        if (savedTimerRef.current) {
            clearTimeout(savedTimerRef.current);
        }
        try {
            const experienceLevel = experienceLevelFromDifficulty(settings.difficulty);
            const res = await authFetch(apiUrl('/api/user/settings'), {
                method: 'PUT',
                body: JSON.stringify({
                    emailNotifications: settings.emailNotifications,
                    practiceReminders: settings.practiceReminders,
                    weeklyReport: settings.weeklyReport,
                    language: settings.language,
                    codeEditor: settings.codeEditor,
                    difficulty: settings.difficulty,
                    experienceLevel,
                }),
            });
            if (!res.ok) {
                throw new Error(await readApiErrorMessage(res, 'Could not save settings right now. Please try again.'));
            }
            const data = await res.json().catch(() => ({}));
            const savedState = data?.settings
                ? normalizeSettingsState(data.settings, settings)
                : settings;

            setSettings(savedState);
            setSavedSnapshot(savedState);
            syncLocalPreferences(savedState);
            if (data?.settings?.subscription_tier) {
                setSubscriptionTier(data.settings.subscription_tier);
            }

            setSaved(true);
            setStatus('saved');
            setStatusMessage('Settings saved successfully.');
            savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error(err);
            setStatus('error');
            setStatusMessage(err?.message || 'Could not save settings right now. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const openPasswordModal = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowCurrentPwd(false);
        setShowNewPwd(false);
        setPwdError('');
        setPwdSuccess('');
        setShowPasswordModal(true);
    };

    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault();
        setPwdError('');
        setPwdSuccess('');

        if (!currentPassword) {
            setPwdError('Please enter your current password.');
            return;
        }
        const failedRule = PASSWORD_RULES.find((rule) => !rule.test(newPassword));
        if (failedRule) {
            setPwdError(`New password requirement missing: ${failedRule.label}.`);
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwdError('New password and confirmation do not match.');
            return;
        }
        if (currentPassword === newPassword) {
            setPwdError('New password must be different from your current password.');
            return;
        }

        setPwdSaving(true);
        try {
            const res = await authFetch(apiUrl('/api/auth/change-password'), {
                method: 'POST',
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            if (!res.ok) {
                throw new Error(await readApiErrorMessage(res, 'Failed to update password.'));
            }
            setPwdSuccess('Password updated successfully.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setPwdError(err?.message || 'Failed to update password.');
        } finally {
            setPwdSaving(false);
        }
    };

    const handleSendResetEmail = async () => {
        if (!user?.email) {
            setPwdError('No email address is attached to this account.');
            return;
        }
        setResetEmailSending(true);
        setPwdError('');
        setPwdSuccess('');
        try {
            const res = await authFetch(apiUrl('/api/auth/forgot-password'), {
                method: 'POST',
                body: JSON.stringify({ email: user.email }),
            });
            if (!res.ok) {
                throw new Error(await readApiErrorMessage(res, 'Could not send reset email right now.'));
            }
            setPwdSuccess(`If an account exists for ${user.email}, a password reset link has been sent.`);
        } catch (err) {
            setPwdError(err?.message || 'Could not send reset email right now.');
        } finally {
            setResetEmailSending(false);
        }
    };

    const openDeleteModal = () => {
        setDeleteConfirmText('');
        setDeleteError('');
        setShowDeleteModal(true);
    };

    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
            setDeleteError('Please type DELETE to confirm permanent account deletion.');
            return;
        }

        setDeletingAccount(true);
        setDeleteError('');
        try {
            const res = await authFetch(apiUrl('/api/user/account'), {
                method: 'DELETE',
                body: JSON.stringify({ confirmation: deleteConfirmText.trim().toUpperCase() }),
            });
            if (!res.ok) {
                throw new Error(await readApiErrorMessage(res, 'Could not delete account right now. Please try again.'));
            }
            try {
                localStorage.removeItem('app-settings-cache');
            } catch {
                // ignore
            }
            await logout();
            navigate('/', { replace: true });
        } catch (err) {
            setDeleteError(err?.message || 'Could not delete account right now. Please try again.');
            setDeletingAccount(false);
        }
    };

    const handleSignOut = async () => {
        setSigningOut(true);
        try {
            await logout();
            navigate('/login', { replace: true });
        } finally {
            setSigningOut(false);
        }
    };

    const totalEnabled = [
        settings.emailNotifications,
        settings.practiceReminders,
        settings.weeklyReport,
    ].filter(Boolean).length;
    const userLabel = user?.fullName || user?.email || 'Account';
    const planMeta = getPlanBadgeMeta(subscriptionTier);

    const statusChipLabel = loadingSettings
        ? 'Loading...'
        : status === 'saved'
            ? 'Saved'
            : status === 'error'
                ? 'Save failed'
                : isDirty
                    ? 'Unsaved changes'
                    : 'Up to date';

    return (
        <div className="account-page settings-page">
            <div className="account-hero">
                <div className="account-hero-copy">
                    <p className="account-kicker">Account</p>
                    <h1>Settings</h1>
                    <p>
                        Tune the experience around your prep rhythm, from reminders and language to difficulty defaults.
                    </p>
                    <div className="account-chip-row">
                        <span className="account-chip">{totalEnabled}/3 notifications enabled</span>
                        <span className="account-chip">Theme: {theme}</span>
                        <span className={`account-chip${isDirty && status !== 'saved' ? ' settings-chip-dirty' : ''}`}>
                            {statusChipLabel}
                        </span>
                    </div>
                </div>
                <div className="account-hero-actions">
                    <div className="settings-hero-actions-row">
                        {isDirty && (
                            <button
                                type="button"
                                onClick={handleDiscardChanges}
                                disabled={saving}
                                className="account-secondary-button"
                            >
                                Discard
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || loadingSettings}
                            className="btn-hero-primary account-hero-button"
                            style={{ border: 'none', cursor: 'pointer' }}
                        >
                            <Save size={14} /> {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>

            {status === 'saved' && (
                <div className="account-status-message success" role="status" aria-live="polite">
                    {statusMessage || 'Settings saved successfully.'}
                </div>
            )}
            {status === 'error' && (
                <div className="account-status-message error" role="alert">
                    {statusMessage || 'Could not save settings right now. Please try again.'}
                </div>
            )}

            <div className="account-stat-grid">
                <article className="account-stat-card">
                    <span className="account-stat-label">Owner</span>
                    <strong className="account-stat-value">{userLabel}</strong>
                    <span className="account-stat-meta">
                        <Link to="/profile" className="account-link-action">
                            Manage public profile
                        </Link>
                    </span>
                </article>
                <article className="account-stat-card">
                    <span className="account-stat-label">Theme</span>
                    <strong className="account-stat-value">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</strong>
                    <span className="account-stat-meta">Applies immediately across the workspace</span>
                </article>
                <article className="account-stat-card">
                    <span className="account-stat-label">Practice focus</span>
                    <strong className="account-stat-value">
                        {settings.difficulty.charAt(0).toUpperCase() + settings.difficulty.slice(1)}
                    </strong>
                    <span className="account-stat-meta">Default difficulty for future problem sets</span>
                </article>
            </div>

            <div className="account-grid settings-grid">
                <div className="account-stack">
                    <Section title="Notifications" subtitle="Stay in the loop" icon={<Bell size={18} color="var(--text-primary)" />}>
                        <SettingRow label="Email notifications" desc="Receive updates about your progress">
                            <Toggle
                                label="Email notifications"
                                checked={settings.emailNotifications}
                                disabled={loadingSettings}
                                onChange={(v) => updateSetting('emailNotifications', v)}
                            />
                        </SettingRow>
                        <SettingRow label="Practice reminders" desc="Daily reminders to keep your streak">
                            <Toggle
                                label="Practice reminders"
                                checked={settings.practiceReminders}
                                disabled={loadingSettings}
                                onChange={(v) => updateSetting('practiceReminders', v)}
                            />
                        </SettingRow>
                        <SettingRow label="Weekly report" desc="Summary of your weekly performance">
                            <Toggle
                                label="Weekly report"
                                checked={settings.weeklyReport}
                                disabled={loadingSettings}
                                onChange={(v) => updateSetting('weeklyReport', v)}
                            />
                        </SettingRow>
                    </Section>

                    <Section title="Subscription" subtitle="Billing status" icon={<CreditCard size={18} color="var(--text-primary)" />}>
                        <SettingRow label="Current plan" desc={planMeta.label}>
                            <Link to="/pricing" className="account-link-action">
                                {planMeta.isPaid ? 'Manage plan' : 'Upgrade'}
                            </Link>
                        </SettingRow>
                    </Section>

                    <Section title="Developer & API" subtitle="Integrations and webhooks" icon={<Code size={18} color="var(--text-primary)" />}>
                        <SettingRow label="Platform API Keys" desc="Manage API keys and automated webhooks">
                            <Link to="/developer" className="account-link-action">Manage</Link>
                        </SettingRow>
                    </Section>
                </div>

                <div className="account-stack">
                    <Section
                        title="Preferences"
                        subtitle="Personalize the workspace"
                        icon={<Globe size={18} color="var(--text-primary)" />}
                        action={!isDefaultSettings ? (
                            <button
                                type="button"
                                onClick={handleResetDefaults}
                                className="account-inline-button"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12 }}
                            >
                                <RotateCcw size={13} /> Reset defaults
                            </button>
                        ) : null}
                    >
                        <SettingRow label="Theme" desc={theme === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}>
                            <Toggle label="Theme toggle" checked={theme === 'dark'} onChange={toggleTheme} />
                        </SettingRow>
                        <SettingRow label="Language" htmlFor="settings-language">
                            <select
                                id="settings-language"
                                aria-label="Language"
                                value={settings.language}
                                disabled={loadingSettings}
                                onChange={(e) => updateSetting('language', e.target.value)}
                                className="account-select"
                            >
                                <option value="en">English</option>
                                <option value="hi">Hindi</option>
                                <option value="es">Spanish</option>
                            </select>
                        </SettingRow>
                        <SettingRow label="Code Editor" htmlFor="settings-code-editor">
                            <select
                                id="settings-code-editor"
                                aria-label="Code Editor"
                                value={settings.codeEditor}
                                disabled={loadingSettings}
                                onChange={(e) => updateSetting('codeEditor', e.target.value)}
                                className="account-select"
                            >
                                <option value="vscode">VS Code</option>
                                <option value="sublime">Sublime Text</option>
                                <option value="vim">Vim</option>
                            </select>
                        </SettingRow>
                        <SettingRow label="Default difficulty" desc="For code practice problems" htmlFor="settings-difficulty">
                            <select
                                id="settings-difficulty"
                                aria-label="Default difficulty"
                                value={settings.difficulty}
                                disabled={loadingSettings}
                                onChange={(e) => updateSetting('difficulty', e.target.value)}
                                className="account-select"
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </SettingRow>
                    </Section>

                    <Section title="Account" subtitle="Security and data" icon={<Shield size={18} color="var(--text-primary)" />}>
                        <SettingRow
                            label="Change password"
                            desc={
                                authProvider && authProvider !== 'email'
                                    ? `Signed in via ${authProvider}. Set or reset your password anytime.`
                                    : 'Update your account password'
                            }
                        >
                            <button
                                className="account-inline-button"
                                type="button"
                                onClick={openPasswordModal}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >
                                <KeyRound size={14} /> Change
                            </button>
                        </SettingRow>
                        <SettingRow label="Delete account" desc="Permanently delete your account and data">
                            <button
                                className="account-danger-button"
                                type="button"
                                onClick={openDeleteModal}
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        </SettingRow>
                        <SettingRow label="Sign out" desc="Leave this device securely">
                            <button
                                className="account-inline-button"
                                type="button"
                                disabled={signingOut}
                                onClick={handleSignOut}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >
                                <LogOut size={14} /> {signingOut ? 'Signing out...' : 'Sign Out'}
                            </button>
                        </SettingRow>
                    </Section>
                </div>
            </div>

            {showPasswordModal && (
                <div
                    className="settings-modal-backdrop"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="change-password-title"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !pwdSaving) setShowPasswordModal(false);
                    }}
                >
                    <div className="settings-modal">
                        <div className="settings-modal-header">
                            <div>
                                <h3 id="change-password-title">Change password</h3>
                                <p>Enter your current password and choose a strong new password.</p>
                            </div>
                            <button
                                type="button"
                                className="settings-modal-close"
                                aria-label="Close change password dialog"
                                disabled={pwdSaving}
                                onClick={() => setShowPasswordModal(false)}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {pwdError && (
                            <div className="account-status-message error" role="alert">
                                {pwdError}
                            </div>
                        )}
                        {pwdSuccess && (
                            <div className="account-status-message success" role="status">
                                {pwdSuccess}
                            </div>
                        )}

                        <form className="settings-modal-body" onSubmit={handleChangePasswordSubmit}>
                            <div className="settings-field-group">
                                <label htmlFor="settings-current-password" className="account-field-label">
                                    Current Password
                                </label>
                                <div className="settings-password-wrap">
                                    <input
                                        id="settings-current-password"
                                        type={showCurrentPwd ? 'text' : 'password'}
                                        className="account-input"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        autoComplete="current-password"
                                        placeholder="Enter current password"
                                    />
                                    <button
                                        type="button"
                                        className="settings-password-toggle"
                                        aria-label={showCurrentPwd ? 'Hide current password' : 'Show current password'}
                                        onClick={() => setShowCurrentPwd((v) => !v)}
                                    >
                                        {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="settings-field-group">
                                <label htmlFor="settings-new-password" className="account-field-label">
                                    New Password
                                </label>
                                <div className="settings-password-wrap">
                                    <input
                                        id="settings-new-password"
                                        type={showNewPwd ? 'text' : 'password'}
                                        className="account-input"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        autoComplete="new-password"
                                        placeholder="Create a strong password"
                                    />
                                    <button
                                        type="button"
                                        className="settings-password-toggle"
                                        aria-label={showNewPwd ? 'Hide new password' : 'Show new password'}
                                        onClick={() => setShowNewPwd((v) => !v)}
                                    >
                                        {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="settings-password-rules" aria-label="Password requirements">
                                {PASSWORD_RULES.map((rule) => {
                                    const met = rule.test(newPassword);
                                    return (
                                        <span key={rule.id} className={`settings-password-rule${met ? ' is-met' : ''}`}>
                                            <Check size={12} /> {rule.label}
                                        </span>
                                    );
                                })}
                            </div>

                            <div className="settings-field-group">
                                <label htmlFor="settings-confirm-password" className="account-field-label">
                                    Confirm New Password
                                </label>
                                <input
                                    id="settings-confirm-password"
                                    type={showNewPwd ? 'text' : 'password'}
                                    className="account-input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                    placeholder="Re-enter new password"
                                />
                            </div>

                            {user?.email && (
                                <button
                                    type="button"
                                    className="settings-text-button"
                                    disabled={resetEmailSending || pwdSaving}
                                    onClick={handleSendResetEmail}
                                >
                                    {resetEmailSending
                                        ? 'Sending reset email...'
                                        : 'Signed up with OAuth or forgot your current password? Email reset link'}
                                </button>
                            )}

                            <div className="settings-modal-actions">
                                <button
                                    type="button"
                                    className="account-secondary-button"
                                    disabled={pwdSaving}
                                    onClick={() => setShowPasswordModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-hero-primary"
                                    disabled={pwdSaving}
                                    style={{ border: 'none', cursor: 'pointer' }}
                                >
                                    {pwdSaving ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div
                    className="settings-modal-backdrop"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="delete-account-title"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !deletingAccount) setShowDeleteModal(false);
                    }}
                >
                    <div className="settings-modal">
                        <div className="settings-modal-header">
                            <div>
                                <h3 id="delete-account-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <AlertTriangle size={18} color="var(--red, #ef4444)" />
                                    <span>Delete account</span>
                                </h3>
                                <p>
                                    This permanently removes your profile, progress, interview history, and settings. This action cannot be undone.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="settings-modal-close"
                                aria-label="Close delete account dialog"
                                disabled={deletingAccount}
                                onClick={() => setShowDeleteModal(false)}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {deleteError && (
                            <div className="account-status-message error" role="alert">
                                {deleteError}
                            </div>
                        )}

                        <form className="settings-modal-body" onSubmit={handleDeleteAccount}>
                            <div className="settings-field-group">
                                <label htmlFor="settings-delete-confirm" className="account-field-label">
                                    Type DELETE to confirm
                                </label>
                                <input
                                    id="settings-delete-confirm"
                                    type="text"
                                    className="account-input"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="DELETE"
                                    autoComplete="off"
                                />
                            </div>

                            <div className="settings-modal-actions">
                                <button
                                    type="button"
                                    className="account-secondary-button"
                                    disabled={deletingAccount}
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="account-danger-button"
                                    disabled={deletingAccount || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                                >
                                    <Trash2 size={14} /> {deletingAccount ? 'Deleting...' : 'Delete Permanently'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
