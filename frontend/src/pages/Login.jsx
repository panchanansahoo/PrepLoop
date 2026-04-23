import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, ArrowRight, ArrowLeft, Eye, EyeOff, MessageSquare, Brain, Code2, Sparkles, Github, Linkedin, Chrome } from 'lucide-react';
import logo from '../assets/logo.svg';

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    background: '#030308',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: 'relative',
    overflow: 'hidden',
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
    transition: 'all 0.3s ease',
  },
  // Animated background orbs
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
  orb3: {
    position: 'fixed', top: '40%', right: '30%', width: 'min(38vw, 300px)', height: 'min(38vw, 300px)',
    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 60%)',
    borderRadius: '50%', filter: 'blur(40px)',
    animation: 'float3 12s ease-in-out infinite',
    pointerEvents: 'none', zIndex: 0,
  },
  leftPanel: {
    flex: '1 1 50%',
    display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px clamp(40px, 6vw, 80px)',
    position: 'relative', zIndex: 1,
    background: 'linear-gradient(160deg, rgba(168, 85, 247, 0.04) 0%, rgba(236, 72, 153, 0.02) 50%, transparent 100%)',
    borderRight: '1px solid rgba(255,255,255,0.03)',
  },
  rightPanel: {
    flex: '1 1 50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 'clamp(80px, 12vw, 40px) clamp(20px, 5vw, 40px) clamp(20px, 5vw, 40px)', position: 'relative', zIndex: 1,
  },
  formCard: {
    width: '100%', maxWidth: '440px',
    background: 'rgba(20, 20, 28, 0.4)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px',
    padding: 'clamp(28px, 4vw, 44px) clamp(24px, 3.5vw, 40px)',
    backdropFilter: 'blur(32px)',
    WebkitBackdropFilter: 'blur(32px)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: '14px',
    textDecoration: 'none', marginBottom: '56px',
    width: 'fit-content',
  },
  logoText: {
    fontSize: '24px', fontWeight: 800,
    background: 'linear-gradient(135deg, #e879f9, #c084fc, #818cf8)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.02em',
  },
  heading: {
    fontSize: 'clamp(36px, 4vw, 48px)', fontWeight: 800, color: '#f8fafc',
    lineHeight: 1.1, marginBottom: '20px',
    letterSpacing: '-0.03em',
  },
  headingAccent: {
    background: 'linear-gradient(135deg, #c084fc 0%, #e879f9 50%, #f472b6 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '18px', color: 'rgba(148,163,184,0.9)', lineHeight: 1.6,
    marginBottom: '48px', maxWidth: '420px',
    fontWeight: 400,
  },
  featureItem: {
    display: 'flex', alignItems: 'center', gap: '16px',
    marginBottom: '24px',
  },
  featureIcon: {
    width: '46px', height: '46px', borderRadius: '14px',
    background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(236,72,153,0.05))',
    border: '1px solid rgba(168,85,247,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#d8b4fe', flexShrink: 0,
    boxShadow: '0 4px 12px rgba(168,85,247,0.05)',
  },
  featureText: {
    fontSize: '15px', color: 'rgba(226,232,240,0.9)',
    fontWeight: 500, letterSpacing: '0.01em',
  },
  formTitle: {
    fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginBottom: '8px',
    letterSpacing: '-0.02em',
  },
  formSubtitle: {
    fontSize: '15px', color: 'rgba(148,163,184,0.8)', marginBottom: '32px',
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px',
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: '14px', color: '#fca5a5', fontSize: '14px', marginBottom: '24px',
    lineHeight: 1.5,
  },
  socialSection: {
    display: 'flex', flexDirection: 'column', gap: '12px',
    marginBottom: '28px',
  },
  socialBtnPrimary: {
    width: '100%', padding: '13px 16px', borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.03)',
    color: '#f8fafc', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    fontFamily: 'inherit',
  },
  socialBtnRow: {
    display: 'flex', gap: '12px',
  },
  socialBtnSecondary: {
    flex: 1, padding: '13px 16px', borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.02)',
    color: '#e2e8f0', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    fontFamily: 'inherit',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: '16px',
    marginBottom: '28px',
  },
  dividerLine: {
    flex: 1, height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
  },
  dividerText: {
    fontSize: '12px', color: 'rgba(148,163,184,0.6)', fontWeight: 600,
    letterSpacing: '0.1em', textTransform: 'uppercase',
  },
  label: {
    fontSize: '13px', fontWeight: 600, color: 'rgba(203,213,225,0.8)',
    marginBottom: '10px', display: 'block', letterSpacing: '0.01em',
  },
  inputWrapper: {
    position: 'relative', marginBottom: '20px',
  },
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
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    boxSizing: 'border-box',
  },
  passwordToggle: {
    position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'rgba(148,163,184,0.6)', padding: '4px',
    display: 'flex', alignItems: 'center',
    transition: 'color 0.2s',
  },
  forgotLink: {
    fontSize: '13px', color: '#c084fc', textDecoration: 'none', fontWeight: 600,
    transition: 'all 0.2s',
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
  guestBtn: {
    width: '100%', padding: '14px', borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'transparent', color: 'rgba(203,213,225,0.8)',
    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    fontFamily: 'inherit', marginTop: '16px',
  },
  bottomLink: {
    marginTop: '28px', textAlign: 'center',
    color: 'rgba(148,163,184,0.6)', fontSize: '14px',
  },
  accentLink: {
    color: '#d8b4fe', fontWeight: 600, textDecoration: 'none',
    transition: 'color 0.2s',
    marginLeft: '6px',
  },
  statsRow: {
    display: 'flex', gap: '32px', marginTop: '56px',
    paddingTop: '36px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  stat: {
    flex: 1,
  },
  statNumber: {
    fontSize: '28px', fontWeight: 800, color: '#f8fafc',
    marginBottom: '6px', letterSpacing: '-0.02em',
  },
  statLabel: {
    fontSize: '13px', color: 'rgba(148,163,184,0.6)',
    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
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
  @keyframes float3 {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(30px, -40px) scale(1.1); }
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
  .delay-200 { animation-delay: 200ms; }
  .delay-300 { animation-delay: 300ms; }
  
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

  /* Button hover states */
  .auth-social-btn, .auth-guest-btn {
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }
  .auth-social-btn:hover, .auth-guest-btn:hover {
    background: rgba(255, 255, 255, 0.08) !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 20px rgba(0,0,0,0.2) !important;
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

  .auth-password-toggle:hover {
    color: #f8fafc !important;
  }
  .auth-link:hover {
    color: #e879f9 !important;
    text-shadow: 0 0 12px rgba(232, 121, 249, 0.4);
  }

  @media (max-width: 900px) {
    .auth-left-panel { display: none !important; }
    .auth-right-panel { flex: 1 1 100% !important; padding: 24px !important; }
  }
  @media (max-width: 560px) {
    .auth-social-row { flex-direction: column !important; }
    .auth-brand-title { font-size: 2.4rem !important; }
  }
`;

export default function Login() {
  const FORM_LABELS = {
    email: 'Email address',
    password: 'Password',
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle, loginWithGithub, loginWithLinkedin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error("Login error:", err);
      if (!err.response && (err.message === 'Network Error' || err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED')) {
        setError('Unable to connect to the server. Please ensure the backend is running.');
      } else if (err.response?.status === 403 && err.response?.data?.email) {
        navigate(`/check-email?email=${encodeURIComponent(err.response.data.email)}`);
      } else {
        setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider, loginFn) => {
    try {
      setError('');
      await loginFn();
    } catch (err) {
      console.error(`${provider} login failed:`, err);
      setError(err.message || `Failed to sign in with ${provider}`);
    }
  };

  return (
    <>
      <style>{keyframes}</style>
      <div style={styles.wrapper}>
        <Link to="/" style={styles.backButton} className="auth-back-btn fade-in-up">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <div style={styles.orb1} />
        <div style={styles.orb2} />
        <div style={styles.orb3} />

        {/* Left Panel — Branding */}
        <div className="auth-left-panel" style={styles.leftPanel}>
          <div className="fade-in-up">
            <Link to="/" style={styles.logo} className="auth-link">
              <img src={logo} alt="PrepLoop" style={{ width: 36, height: 36, objectFit: 'contain' }} />
              <span style={styles.logoText}>PrepLoop</span>
            </Link>

            <h2 className="auth-brand-title" style={styles.heading}>
              Ace Your Next<br />
              <span style={styles.headingAccent}>Technical Interview</span>
            </h2>
            <p style={styles.subtitle}>
              AI-powered mock interviews, personalized coaching, and proven patterns to land your dream job at top companies.
            </p>

            <div>
              {[
                { icon: <MessageSquare size={20} />, text: 'AI Mock Interviews with real-time feedback' },
                { icon: <Brain size={20} />, text: 'Personalized AI coaching & study plans' },
                { icon: <Code2 size={20} />, text: '90+ DSA patterns with detailed solutions' },
                { icon: <Sparkles size={20} />, text: 'ATS-optimized resume analysis' },
              ].map((item, i) => (
                <div key={i} style={styles.featureItem} className={`fade-in-up delay-${(i + 1) * 100}`}>
                  <div style={styles.featureIcon}>{item.icon}</div>
                  <span style={styles.featureText}>{item.text}</span>
                </div>
              ))}
            </div>

            <div style={styles.statsRow} className="fade-in-up delay-300">
              {[
                { number: '10K+', label: 'Engineers trained' },
                { number: '95%', label: 'Success rate' },
                { number: '500+', label: 'Companies' },
              ].map((s, i) => (
                <div key={i} style={styles.stat}>
                  <div style={styles.statNumber}>{s.number}</div>
                  <div style={styles.statLabel}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="auth-right-panel" style={styles.rightPanel}>
          <div style={styles.formCard} className="auth-card fade-in-up delay-100">
            <h1 style={styles.formTitle}>Welcome back</h1>
            <p style={styles.formSubtitle}>Sign in to continue your preparation</p>

            {error && (
              <div style={styles.errorBox} className="fade-in-up">
                <AlertCircle size={18} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}

            {/* Social Login */}
            <div style={styles.socialSection}>
              <button
                onClick={() => handleSocialLogin('Google', loginWithGoogle)}
                style={styles.socialBtnPrimary}
                className="auth-social-btn"
              >
                <Chrome size={18} /> Continue with Google
              </button>
              <div className="auth-social-row" style={styles.socialBtnRow}>
                <button
                  onClick={() => handleSocialLogin('GitHub', loginWithGithub)}
                  style={styles.socialBtnSecondary}
                  className="auth-social-btn"
                >
                  <Github size={18} /> GitHub
                </button>
                <button
                  onClick={() => handleSocialLogin('LinkedIn', loginWithLinkedin)}
                  style={styles.socialBtnSecondary}
                  className="auth-social-btn"
                >
                  <Linkedin size={18} /> LinkedIn
                </button>
              </div>
            </div>

            {/* Divider */}
            <div style={styles.divider}>
              <div style={styles.dividerLine} />
              <span style={styles.dividerText}>or continue with email</span>
              <div style={styles.dividerLine} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={styles.inputWrapper} className="auth-input-wrapper">
                <label style={styles.label}>{FORM_LABELS.email}</label>
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

              <div style={{ marginBottom: '28px' }} className="auth-input-wrapper">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ ...styles.label, marginBottom: 0 }}>{FORM_LABELS.password}</label>
                  <Link to="/forgot-password" style={styles.forgotLink} className="auth-link">Forgot password?</Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={styles.inputIcon} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    style={styles.input}
                    className="auth-input"
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                    className="auth-password-toggle"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                style={{
                  ...styles.submitBtn,
                  ...(loading ? { opacity: 0.7, cursor: 'not-allowed' } : {}),
                }}
                className="auth-submit-btn"
              >
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div style={styles.bottomLink}>
              Don't have an account?
              <Link to="/signup" style={styles.accentLink} className="auth-link">Create account</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

