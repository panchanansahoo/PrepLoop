
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
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
        borderRadius: '50%', filter: 'blur(60px)',
        animation: 'float1 15s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 0,
    },
    orb2: {
        position: 'fixed', bottom: '-20%', right: '-5%', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(217, 70, 239, 0.12) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(80px)',
        animation: 'float2 18s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 0,
    },
    card: {
        width: '100%', maxWidth: '440px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '24px',
        padding: '40px 36px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
        position: 'relative', zIndex: 1,
    },
    logo: {
        display: 'flex', alignItems: 'center', gap: '12px',
        textDecoration: 'none', marginBottom: '32px',
    },
    logoText: {
        fontSize: '22px', fontWeight: 700,
        background: 'linear-gradient(135deg, #c084fc, #e879f9)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    },
    title: {
        fontSize: '26px', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px',
    },
    subtitle: {
        fontSize: '14px', color: 'rgba(148,163,184,0.7)', marginBottom: '28px', lineHeight: 1.6,
    },
    label: {
        fontSize: '13px', fontWeight: 600, color: 'rgba(203,213,225,0.7)',
        marginBottom: '8px', display: 'block',
    },
    inputWrapper: { position: 'relative', marginBottom: '20px' },
    inputIcon: {
        position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
        color: 'rgba(148,163,184,0.4)', pointerEvents: 'none',
    },
    input: {
        width: '100%', padding: '13px 14px 13px 44px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px', color: '#f1f5f9', fontSize: '14px',
        fontFamily: 'inherit', outline: 'none',
        transition: 'all 0.2s ease', boxSizing: 'border-box',
    },
    submitBtn: {
        width: '100%', padding: '14px', borderRadius: '14px',
        border: 'none',
        background: 'linear-gradient(135deg, #a855f7 0%, #c026d3 50%, #d946ef 100%)',
        color: 'white', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        fontFamily: 'inherit', transition: 'all 0.25s ease',
        boxShadow: '0 4px 20px rgba(168,85,247,0.3)',
    },
    errorBox: {
        display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
        borderRadius: '12px', color: '#f87171', fontSize: '13px', marginBottom: '20px',
        lineHeight: 1.5,
    },
    successBox: {
        display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px',
        background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)',
        borderRadius: '12px', color: '#4ade80', fontSize: '13px', marginBottom: '20px',
        lineHeight: 1.6,
    },
    backLink: {
        display: 'flex', alignItems: 'center', gap: '6px',
        color: '#c084fc', fontSize: '13px', fontWeight: 600,
        textDecoration: 'none', marginTop: '24px', justifyContent: 'center',
    },
};

const keyframes = `
@keyframes float1 {
    0 %, 100 % { transform: translate(0, 0) scale(1); }
    33 % { transform: translate(50px, 30px) scale(1.05); }
    66 % { transform: translate(-30px, 50px) scale(0.95); }
}
@keyframes float2 {
    0 %, 100 % { transform: translate(0, 0) scale(1); }
    33 % { transform: translate(-40px, -30px) scale(1.08); }
    66 % { transform: translate(60px, -20px) scale(0.92); }
}
`;

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await axios.post('/api/auth/forgot-password', { email });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{keyframes}</style>
            <div style={styles.wrapper}>
                <div style={styles.orb1} />
                <div style={styles.orb2} />
                <div style={styles.card}>
                    <Link to="/" style={styles.logo}>
                        <img src={logo} alt="PrepLoop" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                        <span style={styles.logoText}>PrepLoop</span>
                    </Link>

                    <h1 style={styles.title}>Reset your password</h1>
                    <p style={styles.subtitle}>
                        Enter the email address associated with your account, and we'll send you a link to reset your password.
                    </p>

                    {error && (
                        <div style={styles.errorBox}>
                            <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
                        </div>
                    )}

                    {success ? (
                        <>
                            <div style={styles.successBox}>
                                <CheckCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                                <div>
                                    <strong>Check your inbox!</strong><br />
                                    We've sent a password reset link to <strong>{email}</strong>. The link expires in 1 hour.
                                </div>
                            </div>
                            <Link to="/login" style={styles.backLink}>
                                <ArrowLeft size={14} /> Back to Sign In
                            </Link>
                        </>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div style={styles.inputWrapper}>
                                <label style={styles.label}>Email address</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} style={styles.inputIcon} />
                                    <input
                                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                                        placeholder="you@example.com" required
                                        style={styles.input}
                                        onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)'; }}
                                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} style={{
                                ...styles.submitBtn,
                                ...(loading ? { opacity: 0.7, cursor: 'not-allowed' } : {}),
                            }}>
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>

                            <Link to="/login" style={styles.backLink}>
                                <ArrowLeft size={14} /> Back to Sign In
                            </Link>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}
