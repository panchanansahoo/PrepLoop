import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Moon, Globe, Shield, Trash2, CreditCard, Save } from 'lucide-react';

export default function Settings() {
    const { user, logout } = useAuth();
    const [settings, setSettings] = useState({
        emailNotifications: true,
        practiceReminders: true,
        weeklyReport: true,
        darkMode: true,
        language: 'en',
        codeEditor: 'vscode',
        difficulty: 'medium'
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(settings)
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) { console.error(err); }
        setSaving(false);
    };

    const Toggle = ({ checked, onChange }) => (
        <button
            onClick={() => onChange(!checked)}
            style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: checked ? 'var(--accent)' : 'var(--border)',
                position: 'relative', transition: 'background 0.2s'
            }}
        >
            <div style={{
                width: 18, height: 18, borderRadius: '50%', background: 'white',
                position: 'absolute', top: 3,
                left: checked ? 23 : 3,
                transition: 'left 0.2s'
            }} />
        </button>
    );

    const Section = ({ title, icon, children }) => (
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 24, border: '1px solid var(--border)', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                {icon} {title}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {children}
            </div>
        </div>
    );

    const SettingRow = ({ label, desc, children }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
                {desc && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>}
            </div>
            {children}
        </div>
    );

    return (
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700 }}>Settings</h1>
                <button onClick={handleSave} disabled={saving} className="btn-hero-primary" style={{ border: 'none', cursor: 'pointer', padding: '10px 20px', fontSize: 13 }}>
                    <Save size={14} /> {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <Section title="Notifications" icon={<Bell size={18} color="var(--accent)" />}>
                <SettingRow label="Email Notifications" desc="Receive updates about your progress">
                    <Toggle checked={settings.emailNotifications} onChange={v => setSettings({ ...settings, emailNotifications: v })} />
                </SettingRow>
                <SettingRow label="Practice Reminders" desc="Daily reminders to keep your streak">
                    <Toggle checked={settings.practiceReminders} onChange={v => setSettings({ ...settings, practiceReminders: v })} />
                </SettingRow>
                <SettingRow label="Weekly Report" desc="Summary of your weekly performance">
                    <Toggle checked={settings.weeklyReport} onChange={v => setSettings({ ...settings, weeklyReport: v })} />
                </SettingRow>
            </Section>

            <Section title="Preferences" icon={<Moon size={18} color="var(--accent)" />}>
                <SettingRow label="Dark Mode" desc="Currently using dark theme">
                    <Toggle checked={settings.darkMode} onChange={v => setSettings({ ...settings, darkMode: v })} />
                </SettingRow>
                <SettingRow label="Language">
                    <select
                        value={settings.language}
                        onChange={e => setSettings({ ...settings, language: e.target.value })}
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
                    >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="es">Spanish</option>
                    </select>
                </SettingRow>
                <SettingRow label="Default Difficulty" desc="For code practice problems">
                    <select
                        value={settings.difficulty}
                        onChange={e => setSettings({ ...settings, difficulty: e.target.value })}
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
                    >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                </SettingRow>
            </Section>

            <Section title="Subscription" icon={<CreditCard size={18} color="var(--accent)" />}>
                <SettingRow label="Current Plan" desc="Starter (Free)">
                    <Link to="/pricing" style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Upgrade →</Link>
                </SettingRow>
            </Section>

            <Section title="Account" icon={<Shield size={18} color="var(--red)" />}>
                <SettingRow label="Change Password" desc="Update your account password">
                    <button style={{
                        background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)',
                        padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit'
                    }}>Change</button>
                </SettingRow>
                <SettingRow label="Delete Account" desc="Permanently delete your account and data">
                    <button style={{
                        background: 'rgba(255,71,87,0.1)', border: '1px solid var(--red)', color: 'var(--red)',
                        padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 6
                    }}>
                        <Trash2 size={14} /> Delete
                    </button>
                </SettingRow>
            </Section>
        </div>
    );
}
