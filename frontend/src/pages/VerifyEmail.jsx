import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, RefreshCw, ArrowRight } from 'lucide-react';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);
    const [activating, setActivating] = useState(false);
    const [activated, setActivated] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const queryEmail = searchParams.get('email') || '';
    const [inputEmail, setInputEmail] = useState(queryEmail);

    const email = (inputEmail || queryEmail || '').trim();

    const handleResend = async () => {
        if (!email) {
            setErrorMessage('Please enter your email address first.');
            return;
        }
        setErrorMessage('');
        setResending(true);
        try {
            const res = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                setResent(true);
            } else {
                setErrorMessage(data.error || 'Failed to resend verification email.');
            }
        } catch {
            setErrorMessage('Network error while requesting verification email.');
        } finally {
            setResending(false);
        }
    };

    const handleInstantActivate = async () => {
        if (!email) {
            setErrorMessage('Please enter your email address first.');
            return;
        }
        setErrorMessage('');
        setActivating(true);
        try {
            const res = await fetch('/api/auth/activate-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                setActivated(true);
                setTimeout(() => navigate('/login'), 1500);
            } else {
                setErrorMessage(data.error || 'Failed to activate account.');
            }
        } catch {
            setErrorMessage('Network error while activating account.');
        } finally {
            setActivating(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div className="auth-card" style={{ textAlign: 'center', maxWidth: 480, width: '100%' }}>
                <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'rgba(108, 92, 231, 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 24px'
                }}>
                    <Mail size={36} color="var(--accent)" />
                </div>

                <h1 style={{ fontSize: 28, marginBottom: 12 }}>Check Your Email</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: 15, lineHeight: 1.7 }}>
                    {queryEmail ? "We've sent a verification link to" : "Verify your account for"}
                </p>
                {queryEmail ? (
                    <p style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 16, marginBottom: 20 }}>
                        {queryEmail}
                    </p>
                ) : (
                    <div style={{ textAlign: 'left', marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                            Account Email:
                        </label>
                        <input
                            type="email"
                            value={inputEmail}
                            onChange={(e) => setInputEmail(e.target.value)}
                            placeholder="e.g. panchanansaoo.in@gmail.com"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: 10,
                                background: 'var(--bg-input, #1e1e2d)',
                                border: '1px solid var(--border, rgba(255,255,255,0.1))',
                                color: 'var(--text-primary, #ffffff)',
                                fontSize: 14,
                                fontFamily: 'inherit',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                )}

                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
                    If email delivery is delayed or not arriving, click below to activate your account instantly and log in right away.
                </p>

                {errorMessage && (
                    <div style={{
                        padding: '10px 14px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 8,
                        color: '#f87171',
                        fontSize: 13,
                        marginBottom: 16,
                        textAlign: 'left'
                    }}>
                        {errorMessage}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button
                        onClick={handleInstantActivate}
                        disabled={activating || activated || !email}
                        style={{
                            background: activated ? 'rgba(34,197,94,0.15)' : 'linear-gradient(135deg, #a855f7 0%, #c026d3 100%)',
                            color: activated ? '#4ade80' : '#ffffff',
                            border: activated ? '1px solid #4ade80' : 'none',
                            padding: '14px 24px',
                            borderRadius: 12,
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: activating ? 'wait' : (!email ? 'not-allowed' : 'pointer'),
                            opacity: (!email && !activated) ? 0.6 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            fontFamily: 'inherit',
                            boxShadow: activated ? 'none' : '0 4px 14px rgba(168, 85, 247, 0.35)',
                        }}
                    >
                        {activated ? <><CheckCircle size={18} /> Account Verified! Going to Sign In...</> :
                            activating ? <><RefreshCw size={18} className="spinning" /> Activating Account...</> :
                                <><CheckCircle size={18} /> Instant Activate Account & Log In <ArrowRight size={16} /></>}
                    </button>

                    <button
                        onClick={handleResend}
                        disabled={resending || resent || !email}
                        style={{
                            background: resent ? 'rgba(0,214,143,0.15)' : 'var(--bg-input, #1e1e2d)',
                            color: resent ? 'var(--green, #4ade80)' : 'var(--text-primary, #ffffff)',
                            border: `1px solid ${resent ? 'var(--green, #4ade80)' : 'var(--border, rgba(255,255,255,0.1))'}`,
                            padding: '12px 24px',
                            borderRadius: 10,
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: resending ? 'wait' : (!email ? 'not-allowed' : 'pointer'),
                            opacity: (!email && !resent) ? 0.6 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            fontFamily: 'inherit'
                        }}
                    >
                        {resent ? <><CheckCircle size={16} /> Verification Sent!</> :
                            resending ? <><RefreshCw size={16} className="spinning" /> Resending...</> :
                                <><RefreshCw size={16} /> Resend Verification Email</>}
                    </button>

                    <Link to="/login" style={{
                        color: 'var(--text-secondary)',
                        fontSize: 14,
                        textDecoration: 'none',
                        padding: '8px 0'
                    }}>
                        ← Back to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
