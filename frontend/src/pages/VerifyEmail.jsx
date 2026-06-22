import {useState} from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle, RefreshCw } from 'lucide-react';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);
    const email = searchParams.get('email') || 'your email';

    const handleResend = async () => {
        setResending(true);
        try {
            await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            setResent(true);
        } catch {
            alert('Failed to resend. Please try again.');
        }
        setResending(false);
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div className="auth-card" style={{ textAlign: 'center', maxWidth: 480 }}>
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
                    We've sent a verification link to
                </p>
                <p style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 16, marginBottom: 24 }}>
                    {email}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
                    Click the link in your email to verify your account. If you don't see it, check your spam folder.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button
                        onClick={handleResend}
                        disabled={resending || resent}
                        style={{
                            background: resent ? 'rgba(0,214,143,0.15)' : 'var(--bg-input)',
                            color: resent ? 'var(--green)' : 'var(--text-primary)',
                            border: `1px solid ${resent ? 'var(--green)' : 'var(--border)'}`,
                            padding: '12px 24px',
                            borderRadius: 10,
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: resending ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            fontFamily: 'inherit'
                        }}
                    >
                        {resent ? <><CheckCircle size={16} /> Email Resent!</> :
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
