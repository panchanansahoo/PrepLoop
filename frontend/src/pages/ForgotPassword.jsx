
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, AlertCircle, ArrowLeft, CheckCircle, ArrowRight } from 'lucide-react';
import logo from '../assets/logo.svg';

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#030308',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: 'relative', overflow: 'hidden',
  },
  backButton: {
    position: 'absolute',
    top: 'clamp(20px, 4vw, 32px)',
    left: 'clamp(20px, 4vw, 32px)',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'rgba(203,213,225,0.8)',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 600,
    padding: '10px 16px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  orb1: {
    position: 'fixed', top: '-15%', left: '-10%', width: 'min(62vw, 600px)', height: 'min(62vw, 600px)',
    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 60%)',
    borderRadius: '50%', filter: 'blur(60px)',
    animation: 'float1 15s ease-in-out infinite',
    pointerEvents: 'none', zIndex: 0,
  },
  orb2: {
    position: 'fixed', bottom: '-20%', right: '-5%', width: 'min(52vw, 500px)', height: 'min(52vw, 500px)',
    background: 'radial-gradient(circle, rgba(236, 72, 153, 0.12) 0%, transparent 60%)',
    borderRadius: '50%', filter: 'blur(80px)',
    animation: 'float2 18s ease-in-out infinite',
    pointerEvents: 'none', zIndex: 0,
  },
  card: {
    width: '100%', maxWidth: '440px',
    background: 'rgba(20, 20, 28, 0.4)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px',
    padding: 'clamp(28px, 4vw, 44px) clamp(24px, 3.5vw, 40px)',
    backdropFilter: 'blur(32px)',
    WebkitBackdropFilter: 'blur(32px)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
    position: 'relative', zIndex: 1,
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: '14px',
    textDecoration: 'none', marginBottom: '32px',
    width: 'fit-content',
  },
  logoText: {
    fontSize: '24px', fontWeight: 800,
    background: 'linear-gradient(135deg, #e879f9, #c084fc, #818cf8)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.02em',
  },
  title: {
    fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginBottom: '8px',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '15px', color: 'rgba(148,163,184,0.8)', marginBottom: '32px', lineHeight: 1.6,
  },
  label: {
    fontSize: '13px', fontWeight: 600, color: 'rgba(203,213,225,0.8)',
    marginBottom: '10px', display: 'block', letterSpacing: '0.01em',
  },
  inputWrapper: { position: 'relative', marginBottom: '24px' },
  inputIcon: {
    position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
    color: 'rgba(148,163,184,0.5)', pointerEvents: 'none',
    transition: 'color 0.3s ease',
  },
  input: {
    width: '100%', padding: '14px 16px 14px 48px',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '14px', color: '#f8fafc', fontSize: '15px',
    fontFamily: 'inherit', outline: 'none',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', boxSizing: 'border-box',
  },
  submitBtn: {
    width: '100%', padding: '16px', borderRadius: '14px',
    border: 'none',
    background: 'linear-gradient(135deg, #a855f7 0%, #c026d3 50%, #db2777 100%)',
    color: 'white', fontSize: '16px', fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    fontFamily: 'inherit',
    marginTop: '10px',
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px',
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: '14px', color: '#fca5a5', fontSize: '14px', marginBottom: '24px',
    lineHeight: 1.5,
  },
  successBox: {
    display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px 18px',
    background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
    borderRadius: '14px', color: '#86efac', fontSize: '14px', marginBottom: '24px',
    lineHeight: 1.6,
  },
  backLink: {
    display: 'flex', alignItems: 'center', gap: '8px',
    color: 'rgba(148,163,184,0.6)', fontSize: '14px', fontWeight: 600,
    textDecoration: 'none', marginTop: '28px', justifyContent: 'center',
    transition: 'color 0.2s',
  },
};

const keyframes = `
  @keyframes float1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(50px, 30px) scale(1.05); }
    66% { transform: translate(-30px, 50px) scale(0.95); }
  }
  @keyframes float2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-40px, -30px) scale(1.08); }
    66% { transform: translate(60px, -20px) scale(0.92); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); filter: blur(4px); }
    to { opacity: 1; transform: translateY(0); filter: blur(0); }
  }
  
  .fade-in-up {
    animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
  }
  .delay-100 { animation-delay: 100ms; }
  
  .auth-back-btn:hover {
    background: rgba(255,255,255,0.08) !important;
    border-color: rgba(255,255,255,0.15) !important;
    color: #f8fafc !important;
    transform: translateX(-4px) !important;
  }
  
  /* Input focus styles */
  .auth-input:focus {
    border-color: rgba(192, 132, 252, 0.5) !important;
    box-shadow: 0 0 0 4px rgba(192, 132, 252, 0.1) !important;
    background: rgba(255, 255, 255, 0.05) !important;
  }
  .auth-input-wrapper:focus-within .auth-input-icon {
    color: #c084fc !important;
  }
  
  .auth-submit-btn {
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
    position: relative;
    overflow: hidden;
    z-index: 1;
  }
  .auth-submit-btn::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(135deg, #c026d3 0%, #db2777 50%, #a855f7 100%);
    z-index: -1;
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .auth-submit-btn:hover:not(:disabled) {
    transform: translateY(-2px) !important;
    box-shadow: 0 12px 30px rgba(168, 85, 247, 0.35) !important;
  }
  .auth-submit-btn:hover:not(:disabled)::before {
    opacity: 1;
  }
  .auth-submit-btn:active:not(:disabled) {
    transform: translateY(1px) !important;
  }

  .auth-link:hover {
    color: #f8fafc !important;
  }
`;

export default function ForgotPassword() {
  const EMAIL_ADDRESS_LABEL = 'Email address';
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
      <div style={styles.wrapper} className="auth-wrapper">
        <Link to="/" style={styles.backButton} className="auth-back-btn fade-in-up">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <div style={styles.orb1} />
        <div style={styles.orb2} />
        
        <div style={styles.card} className="fade-in-up delay-100">
          <Link to="/" style={styles.logo}>
            <img src={logo} alt="PrepLoop" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <span style={styles.logoText}>PrepLoop</span>
          </Link>

          <h1 style={styles.title}>Reset your password</h1>
          <p style={styles.subtitle}>
            Enter the email address associated with your account, and we'll send you a link to reset your password.
          </p>

          {error && (
            <div style={styles.errorBox} className="fade-in-up">
              <AlertCircle size={18} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          {success ? (
            <div className="fade-in-up">
              <div style={styles.successBox}>
                <CheckCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong style={{ color: '#bbf7d0', fontSize: '15px' }}>Check your inbox!</strong><br />
                  <div style={{ marginTop: '6px' }}>
                    We've sent a password reset link to <strong>{email}</strong>. The link expires in 1 hour.
                  </div>
                </div>
              </div>
              <Link to="/login" style={styles.backLink} className="auth-link">
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={styles.inputWrapper} className="auth-input-wrapper">
                <label style={styles.label}>{EMAIL_ADDRESS_LABEL}</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={styles.inputIcon} className="auth-input-icon" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required
                    style={styles.input}
                    className="auth-input"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} style={{
                ...styles.submitBtn,
                ...(loading ? { opacity: 0.7, cursor: 'not-allowed' } : {}),
              }} className="auth-submit-btn">
                {loading ? 'Sending link...' : 'Send Reset Link'}
                {!loading && <ArrowRight size={18} />}
              </button>

              <Link to="/login" style={styles.backLink} className="auth-link">
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
