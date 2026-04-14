import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/logo.svg';

const styles = {
    wrapper: {
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#050510',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        position: 'relative', overflow: 'hidden',
    },
    orb1: {
        position: 'fixed', top: '-15%', left: '-10%', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0,
    },
    card: {
        width: '100%', maxWidth: '440px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '24px', padding: '40px 36px',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
        position: 'relative', zIndex: 1,
    },
    logo: { display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', marginBottom: '32px' },
    logoText: { fontSize: '22px', fontWeight: 700, background: 'linear-gradient(135deg, #c084fc, #e879f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    title: { fontSize: '26px', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' },
    subtitle: { fontSize: '14px', color: 'rgba(148,163,184,0.7)', marginBottom: '28px', lineHeight: 1.6 },
    label: { fontSize: '13px', fontWeight: 600, color: 'rgba(203,213,225,0.7)', marginBottom: '8px', display: 'block' },
    inputWrapper: { position: 'relative', marginBottom: '18px' },
    inputIcon: { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,0.4)', pointerEvents: 'none' },
    input: {
        width: '100%', padding: '13px 14px 13px 44px',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px', color: '#f1f5f9', fontSize: '14px',
        fontFamily: 'inherit', outline: 'none', transition: 'all 0.2s ease', boxSizing: 'border-box',
    },
    passwordToggle: {
        position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'rgba(148,163,184,0.5)', padding: '4px', display: 'flex', alignItems: 'center',
    },
    submitBtn: {
        width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
        background: 'linear-gradient(135deg, #a855f7 0%, #c026d3 50%, #d946ef 100%)',
        color: 'white', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        fontFamily: 'inherit', transition: 'all 0.25s ease',
        boxShadow: '0 4px 20px rgba(168,85,247,0.3)', marginTop: '6px',
    },
    errorBox: {
        display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
        borderRadius: '12px', color: '#f87171', fontSize: '13px', marginBottom: '20px',
    },
    successBox: {
        display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px',
        background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)',
        borderRadius: '12px', color: '#4ade80', fontSize: '13px', marginBottom: '20px', lineHeight: 1.6,
    },
    loginLink: {
        display: 'block', textAlign: 'center', marginTop: '24px',
        color: '#c084fc', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
    },
};

export default function ResetPassword() {
    const NEW_PASSWORD_LABEL = 'New Password';
    const CONFIRM_PASSWORD_LABEL = 'Confirm Password';
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [ready, setReady] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Supabase automatically handles the recovery token from the URL
        // and establishes a session via onAuthStateChange
        if (supabase) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'PASSWORD_RECOVERY') {
                    setReady(true);
                }
            });

            // Also check if we already have a session (user arrived via recovery link)
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) setReady(true);
            });

            return () => subscription.unsubscribe();
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            // Use Supabase client directly — the session from the recovery link is already active
            const { error } = await supabase.auth.updateUser({ password });
            if (error) {
                setError(error.message);
            } else {
                setSuccess(true);
                setTimeout(() => navigate('/login'), 3000);
            }
        } catch (err) {
            setError('Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.orb1} />
            <div style={styles.card}>
                <Link to="/" style={styles.logo}>
                    <img src={logo} alt="PrepLoop" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                    <span style={styles.logoText}>PrepLoop</span>
                </Link>

                <h1 style={styles.title}>Set new password</h1>
                <p style={styles.subtitle}>Choose a strong password for your account.</p>

                {error && (
                    <div style={styles.errorBox}>
                        <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
                    </div>
                )}

                {!ready && !success && (
                    <div style={{ ...styles.errorBox, background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.15)', color: '#facc15' }}>
                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                        Waiting for recovery session... If you arrived here without clicking a reset link, please request a new one from the login page.
                    </div>
                )}

                {success ? (
                    <>
                        <div style={styles.successBox}>
                            <CheckCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                            <div>
                                <strong>Password reset successful!</strong><br />
                                Redirecting you to the login page...
                            </div>
                        </div>
                        <Link to="/login" style={styles.loginLink}>Go to Sign In</Link>
                    </>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div style={styles.inputWrapper}>
                            <label style={styles.label}>{NEW_PASSWORD_LABEL}</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={styles.inputIcon} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••" required minLength={6}
                                    style={styles.input}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.passwordToggle}>
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div style={styles.inputWrapper}>
                            <label style={styles.label}>{CONFIRM_PASSWORD_LABEL}</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={styles.inputIcon} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••" required minLength={6}
                                    style={styles.input}
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={loading || !ready} style={{
                            ...styles.submitBtn,
                            ...((loading || !ready) ? { opacity: 0.7, cursor: 'not-allowed' } : {}),
                        }}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>

                        <Link to="/login" style={styles.loginLink}>Back to Sign In</Link>
                    </form>
                )}
            </div>
        </div>
    );
}
