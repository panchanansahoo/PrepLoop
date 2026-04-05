import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Bell, Moon, Globe, Shield, Trash2, CreditCard, Save } from 'lucide-react';

export default function Settings() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [settings, setSettings] = useState({
        emailNotifications: true,
        practiceReminders: true,
        weeklyReport: true,
        language: 'en',
        codeEditor: 'vscode',
        difficulty: 'medium'
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [status, setStatus] = useState('idle');

    const syncLanguagePreferences = (language) => {
        localStorage.setItem('app-language', language);
        localStorage.setItem('pg-voice-errors-lang', language === 'hi' ? 'hi' : 'en');
    };

    const handleSave = async () => {
        setSaving(true);
        setStatus('idle');
        try {
            const token = localStorage.getItem('token');
            syncLanguagePreferences(settings.language);
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(settings)
            });
            if (!res.ok) {
                throw new Error('Failed to save settings');
            }
            setSaved(true);
            setStatus('saved');
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
        setSaving(false);
    };

    const Toggle = ({ checked, onChange, label }) => (
        <button
            type="button"
            aria-pressed={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            className={`account-toggle ${checked ? 'is-on' : 'is-off'}`}
        >
            <span className="account-toggle-thumb" />
        </button>
    );

    const Section = ({ title, subtitle, icon, children }) => (
        <section className="account-panel settings-section">
            <div className="account-panel-header">
                <div>
                    <p className="account-panel-eyebrow">{subtitle}</p>
                    <h3 className="settings-section-title">
                        {icon} <span>{title}</span>
                    </h3>
                </div>
            </div>
            <div className="settings-section-body">
                {children}
            </div>
        </section>
    );

    const SettingRow = ({ label, desc, children }) => (
        <div className="settings-row">
            <div className="settings-row-copy">
                <div className="settings-row-label">{label}</div>
                {desc && <div className="settings-row-desc">{desc}</div>}
            </div>
            {children}
        </div>
    );

    const totalEnabled = [settings.emailNotifications, settings.practiceReminders, settings.weeklyReport].filter(Boolean).length;
    const userLabel = user?.fullName || user?.email || 'Account';

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
                        <span className="account-chip">{status === 'saved' ? 'Saved' : status === 'error' ? 'Save failed' : 'Ready to save'}</span>
                    </div>
                </div>
                <div className="account-hero-actions">
                    <button onClick={handleSave} disabled={saving} className="btn-hero-primary account-hero-button" style={{ border: 'none', cursor: 'pointer' }}>
                        <Save size={14} /> {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {status === 'saved' && (
                <div className="account-status-message success" role="status" aria-live="polite">
                    Settings saved successfully.
                </div>
            )}
            {status === 'error' && (
                <div className="account-status-message error" role="alert">
                    Could not save settings right now. Please try again.
                </div>
            )}

            <div className="account-stat-grid">
                <article className="account-stat-card">
                    <span className="account-stat-label">Owner</span>
                    <strong className="account-stat-value">{userLabel}</strong>
                    <span className="account-stat-meta">Personal preferences stay attached to this account</span>
                </article>
                <article className="account-stat-card">
                    <span className="account-stat-label">Theme</span>
                    <strong className="account-stat-value">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</strong>
                    <span className="account-stat-meta">Switch quickly without leaving the page</span>
                </article>
                <article className="account-stat-card">
                    <span className="account-stat-label">Practice focus</span>
                    <strong className="account-stat-value">{settings.difficulty.charAt(0).toUpperCase() + settings.difficulty.slice(1)}</strong>
                    <span className="account-stat-meta">Default difficulty for future problem sets</span>
                </article>
            </div>

            <div className="account-grid settings-grid">
                <div className="account-stack">
                    <Section title="Notifications" subtitle="Stay in the loop" icon={<Bell size={18} color="var(--text-primary)" />}>
                        <SettingRow label="Email notifications" desc="Receive updates about your progress">
                            <Toggle label="Email notifications" checked={settings.emailNotifications} onChange={(v) => setSettings({ ...settings, emailNotifications: v })} />
                        </SettingRow>
                        <SettingRow label="Practice reminders" desc="Daily reminders to keep your streak">
                            <Toggle label="Practice reminders" checked={settings.practiceReminders} onChange={(v) => setSettings({ ...settings, practiceReminders: v })} />
                        </SettingRow>
                        <SettingRow label="Weekly report" desc="Summary of your weekly performance">
                            <Toggle label="Weekly report" checked={settings.weeklyReport} onChange={(v) => setSettings({ ...settings, weeklyReport: v })} />
                        </SettingRow>
                    </Section>

                    <Section title="Subscription" subtitle="Billing status" icon={<CreditCard size={18} color="var(--text-primary)" />}>
                        <SettingRow label="Current plan" desc="Starter (Free)">
                            <Link to="/pricing" className="account-link-action">Upgrade</Link>
                        </SettingRow>
                    </Section>
                </div>

                <div className="account-stack">
                    <Section title="Preferences" subtitle="Personalize the workspace" icon={<Globe size={18} color="var(--text-primary)" />}>
                        <SettingRow label="Theme" desc={theme === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}>
                            <Toggle label="Theme toggle" checked={theme === 'dark'} onChange={() => toggleTheme()} />
                        </SettingRow>
                        <SettingRow label="Language">
                            <select
                                value={settings.language}
                                onChange={e => setSettings({ ...settings, language: e.target.value })}
                                className="account-select"
                            >
                                <option value="en">English</option>
                                <option value="hi">Hindi</option>
                                <option value="es">Spanish</option>
                            </select>
                        </SettingRow>
                        <SettingRow label="Default difficulty" desc="For code practice problems">
                            <select
                                value={settings.difficulty}
                                onChange={e => setSettings({ ...settings, difficulty: e.target.value })}
                                className="account-select"
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </SettingRow>
                    </Section>

                    <Section title="Account" subtitle="Security and data" icon={<Shield size={18} color="var(--text-primary)" />}>
                        <SettingRow label="Change password" desc="Update your account password">
                            <button className="account-inline-button" type="button">Change</button>
                        </SettingRow>
                        <SettingRow label="Delete account" desc="Permanently delete your account and data">
                            <button className="account-danger-button" type="button">
                                <Trash2 size={14} /> Delete
                            </button>
                        </SettingRow>
                        <SettingRow label="Sign out" desc="Leave this device securely">
                            <button className="account-inline-button" type="button" onClick={logout}>
                                Sign Out
                            </button>
                        </SettingRow>
                    </Section>
                </div>
            </div>
        </div>
    );
}
