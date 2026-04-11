import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff, MessageSquare, Brain, Code2, Github, Linkedin, Chrome, Sparkles } from 'lucide-react';
import logo from '../assets/logo.svg';

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    background: '#050510',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  // Animated background orbs
  orb1: {
    position: 'fixed', top: '-15%', left: '-10%', width: 'min(62vw, 600px)', height: 'min(62vw, 600px)',
    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
    borderRadius: '50%', filter: 'blur(60px)',
    animation: 'float1 15s ease-in-out infinite',
    pointerEvents: 'none', zIndex: 0,
  },
  orb2: {
    position: 'fixed', bottom: '-20%', right: '-5%', width: 'min(52vw, 500px)', height: 'min(52vw, 500px)',
    background: 'radial-gradient(circle, rgba(217, 70, 239, 0.12) 0%, transparent 70%)',
    borderRadius: '50%', filter: 'blur(80px)',
    animation: 'float2 18s ease-in-out infinite',
    pointerEvents: 'none', zIndex: 0,
  },
  orb3: {
    position: 'fixed', top: '40%', right: '30%', width: 'min(38vw, 300px)', height: 'min(38vw, 300px)',
    background: 'radial-gradient(circle, rgba(192, 132, 252, 0.08) 0%, transparent 70%)',
    borderRadius: '50%', filter: 'blur(40px)',
    animation: 'float3 12s ease-in-out infinite',
    pointerEvents: 'none', zIndex: 0,
  },
  leftPanel: {
    flex: '1 1 50%',
    display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 64px',
    position: 'relative', zIndex: 1,
    background: 'linear-gradient(160deg, rgba(168, 85, 247, 0.06) 0%, rgba(217, 70, 239, 0.03) 50%, transparent 100%)',
    borderRight: '1px solid rgba(255,255,255,0.04)',
  },
  rightPanel: {
    flex: '1 1 50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 'clamp(16px, 4vw, 40px)', position: 'relative', zIndex: 1,
  },
  formCard: {
    width: '100%', maxWidth: '440px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '24px',
    padding: 'clamp(22px, 3.6vw, 40px) clamp(18px, 3vw, 36px)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: '12px',
    textDecoration: 'none', marginBottom: '48px',
  },
  logoText: {
    fontSize: '22px', fontWeight: 700,
    background: 'linear-gradient(135deg, #c084fc, #e879f9)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  heading: {
    fontSize: '40px', fontWeight: 800, color: '#f8fafc',
    lineHeight: 1.15, marginBottom: '14px',
    letterSpacing: '-0.02em',
  },
  headingAccent: {
    background: 'linear-gradient(135deg, #c084fc 0%, #e879f9 50%, #f472b6 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '16px', color: 'rgba(148,163,184,0.8)', lineHeight: 1.6,
    marginBottom: '44px', maxWidth: '380px',
  },
  featureItem: {
    display: 'flex', alignItems: 'center', gap: '14px',
    marginBottom: '20px',
  },
  featureIcon: {
    width: '42px', height: '42px', borderRadius: '12px',
    background: 'rgba(168,85,247,0.08)',
    border: '1px solid rgba(168,85,247,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#c084fc', flexShrink: 0,
  },
  featureText: {
    fontSize: '14px', color: 'rgba(203,213,225,0.8)',
    fontWeight: 500,
  },
  formTitle: {
    fontSize: '26px', fontWeight: 700, color: '#f1f5f9', marginBottom: '6px',
  },
  formSubtitle: {
    fontSize: '14px', color: 'rgba(148,163,184,0.7)', marginBottom: '28px',
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
    borderRadius: '12px', color: '#f87171', fontSize: '13px', marginBottom: '20px',
    lineHeight: 1.5,
  },
  socialSection: {
    display: 'flex', flexDirection: 'column', gap: '10px',
    marginBottom: '24px',
  },
  socialBtnPrimary: {
    width: '100%', padding: '12px 16px', borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#e2e8f0', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
  },
  socialBtnRow: {
    display: 'flex', gap: '10px',
  },
  socialBtnSecondary: {
    flex: 1, padding: '12px 16px', borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.02)',
    color: '#cbd5e1', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: '16px',
    marginBottom: '24px',
  },
  dividerLine: {
    flex: 1, height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
  },
  dividerText: {
    fontSize: '11px', color: 'rgba(148,163,184,0.5)', fontWeight: 600,
    letterSpacing: '0.08em', textTransform: 'uppercase',
  },
  label: {
    fontSize: '13px', fontWeight: 600, color: 'rgba(203,213,225,0.7)',
    marginBottom: '8px', display: 'block',
  },
  inputWrapper: {
    position: 'relative', marginBottom: '18px',
  },
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
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  },
  passwordToggle: {
    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'rgba(148,163,184,0.5)', padding: '4px',
    display: 'flex', alignItems: 'center',
  },
  forgotLink: {
    fontSize: '12px', color: '#c084fc', textDecoration: 'none', fontWeight: 500,
    transition: 'color 0.2s',
  },
  submitBtn: {
    width: '100%', padding: '14px', borderRadius: '14px',
    border: 'none',
    background: 'linear-gradient(135deg, #a855f7 0%, #c026d3 50%, #d946ef 100%)',
    color: 'white', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    fontFamily: 'inherit',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 20px rgba(168,85,247,0.3)',
    marginTop: '6px',
  },
  guestBtn: {
    width: '100%', padding: '12px', borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'transparent', color: 'rgba(203,213,225,0.6)',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    fontFamily: 'inherit', marginTop: '14px',
    transition: 'all 0.2s ease',
  },
  bottomLink: {
    marginTop: '22px', textAlign: 'center',
    color: 'rgba(148,163,184,0.5)', fontSize: '13px',
  },
  accentLink: {
    color: '#c084fc', fontWeight: 600, textDecoration: 'none',
    transition: 'color 0.2s',
  },
  statsRow: {
    display: 'flex', gap: '24px', marginTop: '48px',
    paddingTop: '32px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  stat: {
    flex: 1,
  },
  statNumber: {
    fontSize: '24px', fontWeight: 800, color: '#f1f5f9',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '12px', color: 'rgba(148,163,184,0.5)',
    fontWeight: 500,
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
    50% { transform: translate(30px, -40px); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @media (max-width: 900px) {
    .auth-left-panel { display: none !important; }
    .auth-right-panel { flex: 1 1 100% !important; }
  }
  @media (max-width: 560px) {
    .auth-social-row { flex-direction: column !important; }
    .auth-brand-title { font-size: 2rem !important; }
  }
`;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const { login, loginAsGuest, loginWithGoogle, loginWithGithub, loginWithLinkedin } = useAuth();
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

  const getHoverStyle = (btnId, baseStyle) => ({
    ...baseStyle,
    ...(hoveredBtn === btnId ? {
      background: 'rgba(255,255,255,0.08)',
      borderColor: 'rgba(255,255,255,0.15)',
      transform: 'translateY(-1px)',
    } : {}),
  });

  return (
    <>
      <style>{keyframes}</style>
      <div style={styles.wrapper}>
        <div style={styles.orb1} />
        <div style={styles.orb2} />
        <div style={styles.orb3} />

        {/* Left Panel — Branding */}
        <div className="auth-left-panel" style={styles.leftPanel}>
          <Link to="/" style={styles.logo}>
            <img src={logo} alt="PrepLoop" style={{ width: 32, height: 32, objectFit: 'contain' }} />
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
              { icon: <MessageSquare size={18} />, text: 'AI Mock Interviews with real-time feedback' },
              { icon: <Brain size={18} />, text: 'Personalized AI coaching & study plans' },
              { icon: <Code2 size={18} />, text: '90+ DSA patterns with detailed solutions' },
              { icon: <Sparkles size={18} />, text: 'ATS-optimized resume analysis' },
            ].map((item, i) => (
              <div key={i} style={styles.featureItem}>
                <div style={styles.featureIcon}>{item.icon}</div>
                <span style={styles.featureText}>{item.text}</span>
              </div>
            ))}
          </div>

          <div style={styles.statsRow}>
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

        {/* Right Panel — Form */}
        <div className="auth-right-panel" style={styles.rightPanel}>
          <div style={styles.formCard}>
            <h1 style={styles.formTitle}>Welcome back</h1>
            <p style={styles.formSubtitle}>Sign in to continue your preparation</p>

            {error && (
              <div style={styles.errorBox}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}

            {/* Social Login */}
            <div style={styles.socialSection}>
              <button
                onClick={() => handleSocialLogin('Google', loginWithGoogle)}
                style={getHoverStyle('google', styles.socialBtnPrimary)}
                onMouseEnter={() => setHoveredBtn('google')}
                onMouseLeave={() => setHoveredBtn(null)}
              >
                <Chrome size={18} /> Continue with Google
              </button>
              <div className="auth-social-row" style={styles.socialBtnRow}>
                <button
                  onClick={() => handleSocialLogin('GitHub', loginWithGithub)}
                  style={getHoverStyle('github', styles.socialBtnSecondary)}
                  onMouseEnter={() => setHoveredBtn('github')}
                  onMouseLeave={() => setHoveredBtn(null)}
                >
                  <Github size={17} /> GitHub
                </button>
                <button
                  onClick={() => handleSocialLogin('LinkedIn', loginWithLinkedin)}
                  style={getHoverStyle('linkedin', styles.socialBtnSecondary)}
                  onMouseEnter={() => setHoveredBtn('linkedin')}
                  onMouseLeave={() => setHoveredBtn(null)}
                >
                  <Linkedin size={17} /> LinkedIn
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
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Email</label>
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

              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ ...styles.label, marginBottom: 0 }}>Password</label>
                  <Link to="/forgot-password" style={styles.forgotLink}>Forgot password?</Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    style={styles.input}
                    onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                style={{
                  ...styles.submitBtn,
                  ...(loading ? { opacity: 0.7, cursor: 'not-allowed' } : {}),
                  ...(hoveredBtn === 'submit' && !loading ? { transform: 'translateY(-2px)', boxShadow: '0 6px 30px rgba(168,85,247,0.4)' } : {}),
                }}
                onMouseEnter={() => setHoveredBtn('submit')}
                onMouseLeave={() => setHoveredBtn(null)}
              >
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <button
              onClick={() => { loginAsGuest(); navigate('/dashboard'); }}
              style={getHoverStyle('guest', styles.guestBtn)}
              onMouseEnter={() => setHoveredBtn('guest')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <Sparkles size={14} /> Try as Guest
            </button>

            <div style={styles.bottomLink}>
              Don't have an account?{' '}
              <Link to="/signup" style={styles.accentLink}>Create account</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
