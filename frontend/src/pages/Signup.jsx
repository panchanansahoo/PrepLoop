import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle, Github, Linkedin, Chrome, Sparkles } from 'lucide-react';
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
  orb1: {
    position: 'fixed', top: '-15%', right: '-10%', width: '600px', height: '600px',
    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
    borderRadius: '50%', filter: 'blur(60px)',
    animation: 'float1 15s ease-in-out infinite',
    pointerEvents: 'none', zIndex: 0,
  },
  orb2: {
    position: 'fixed', bottom: '-20%', left: '-5%', width: '500px', height: '500px',
    background: 'radial-gradient(circle, rgba(217, 70, 239, 0.12) 0%, transparent 70%)',
    borderRadius: '50%', filter: 'blur(80px)',
    animation: 'float2 18s ease-in-out infinite',
    pointerEvents: 'none', zIndex: 0,
  },
  orb3: {
    position: 'fixed', top: '50%', left: '40%', width: '300px', height: '300px',
    background: 'radial-gradient(circle, rgba(192, 132, 252, 0.08) 0%, transparent 70%)',
    borderRadius: '50%', filter: 'blur(40px)',
    animation: 'float3 12s ease-in-out infinite',
    pointerEvents: 'none', zIndex: 0,
  },
  leftPanel: {
    flex: '1 1 50%',
    display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 64px',
    position: 'relative', zIndex: 1,
    background: 'linear-gradient(160deg, rgba(168, 85, 247, 0.05) 0%, rgba(217, 70, 239, 0.03) 50%, transparent 100%)',
    borderRight: '1px solid rgba(255,255,255,0.04)',
  },
  rightPanel: {
    flex: '1 1 50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px', position: 'relative', zIndex: 1,
  },
  formCard: {
    width: '100%', maxWidth: '440px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '24px',
    padding: '36px 36px',
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
    background: 'linear-gradient(135deg, #a78bfa, #c084fc)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  heading: {
    fontSize: '40px', fontWeight: 800, color: '#f8fafc',
    lineHeight: 1.15, marginBottom: '14px',
    letterSpacing: '-0.02em',
  },
  headingAccent: {
    background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f472b6 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '16px', color: 'rgba(148,163,184,0.8)', lineHeight: 1.6,
    marginBottom: '44px', maxWidth: '380px',
  },
  featureItem: {
    display: 'flex', alignItems: 'center', gap: '12px',
    marginBottom: '18px',
  },
  featureText: {
    fontSize: '14px', color: 'rgba(203,213,225,0.8)', fontWeight: 500,
  },
  formTitle: {
    fontSize: '26px', fontWeight: 700, color: '#f1f5f9', marginBottom: '6px',
  },
  formSubtitle: {
    fontSize: '14px', color: 'rgba(148,163,184,0.7)', marginBottom: '24px',
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
    borderRadius: '12px', color: '#f87171', fontSize: '13px', marginBottom: '20px',
    lineHeight: 1.5,
  },
  socialSection: {
    display: 'flex', flexDirection: 'column', gap: '10px',
    marginBottom: '20px',
  },
  socialBtnPrimary: {
    width: '100%', padding: '12px 16px', borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#e2e8f0', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    fontFamily: 'inherit', transition: 'all 0.2s ease',
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
    fontFamily: 'inherit', transition: 'all 0.2s ease',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: '16px',
    marginBottom: '20px',
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
    marginBottom: '16px',
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
  submitBtn: {
    width: '100%', padding: '14px', borderRadius: '14px',
    border: 'none',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%)',
    color: 'white', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    fontFamily: 'inherit',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 20px rgba(139,92,246,0.3)',
    marginTop: '6px',
  },
  guestBtn: {
    width: '100%', padding: '12px', borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'transparent', color: 'rgba(203,213,225,0.6)',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    fontFamily: 'inherit', marginTop: '12px',
    transition: 'all 0.2s ease',
  },
  termsText: {
    fontSize: '11px', color: 'rgba(148,163,184,0.4)', marginTop: '14px',
    textAlign: 'center', lineHeight: 1.6,
  },
  bottomLink: {
    marginTop: '18px', textAlign: 'center',
    color: 'rgba(148,163,184,0.5)', fontSize: '13px',
  },
  accentLink: {
    color: '#a78bfa', fontWeight: 600, textDecoration: 'none',
    transition: 'color 0.2s',
  },
  testimonial: {
    marginTop: '48px', paddingTop: '32px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  testimonialQuote: {
    fontSize: '15px', color: 'rgba(203,213,225,0.7)', fontStyle: 'italic',
    lineHeight: 1.7, marginBottom: '16px',
  },
  testimonialAuthor: {
    fontSize: '13px', color: 'rgba(148,163,184,0.5)', fontWeight: 600,
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
  @media (max-width: 900px) {
    .auth-left-panel { display: none !important; }
    .auth-right-panel { flex: 1 1 100% !important; }
  }
`;

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const { signup, loginAsGuest, loginWithGoogle, loginWithGithub, loginWithLinkedin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    try {
      await signup(email, password, fullName);
      navigate('/dashboard');
    } catch (err) {
      console.error("Signup error:", err);
      if (!err.response && (err.message === 'Network Error' || err.code === 'ERR_NETWORK' || err.code === 'ECONNREFUSED')) {
        setError('Unable to connect to the server. Please ensure the backend is running.');
      } else {
        setError(err.response?.data?.error || 'Signup failed. Please try again.');
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
      setError(`Failed to sign in with ${provider}`);
      console.error(err);
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

  const inputFocusHandler = (e) => {
    e.target.style.borderColor = 'rgba(139,92,246,0.5)';
    e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.08)';
  };
  const inputBlurHandler = (e) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.08)';
    e.target.style.boxShadow = 'none';
  };

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

          <h2 style={styles.heading}>
            Start Your Journey<br />
            <span style={styles.headingAccent}>to Dream Company</span>
          </h2>
          <p style={styles.subtitle}>
            Join thousands of engineers who landed their dream jobs using PrepLoop's AI-powered interview preparation.
          </p>

          <div>
            {[
              'Unlimited AI mock interviews',
              '90+ DSA patterns & detailed solutions',
              'ATS-optimized resume analysis',
              'Personalized AI coaching & study plans',
              'Company-specific preparation',
            ].map((text, i) => (
              <div key={i} style={styles.featureItem}>
                <CheckCircle size={18} color="#34d399" style={{ flexShrink: 0 }} />
                <span style={styles.featureText}>{text}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div style={styles.testimonial}>
            <p style={styles.testimonialQuote}>
              "PrepLoop's AI interviews were a game-changer. I practiced daily and got an offer from Google within 3 months."
            </p>
            <p style={styles.testimonialAuthor}>
              — Software Engineer at Google
            </p>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="auth-right-panel" style={styles.rightPanel}>
          <div style={styles.formCard}>
            <h1 style={styles.formTitle}>Create your account</h1>
            <p style={styles.formSubtitle}>Start preparing for your dream job today</p>

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
              <div style={styles.socialBtnRow}>
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
              <span style={styles.dividerText}>or sign up with email</span>
              <div style={styles.dividerLine} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={styles.inputIcon} />
                  <input
                    type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Your full name" required
                    style={styles.input}
                    onFocus={inputFocusHandler} onBlur={inputBlurHandler}
                  />
                </div>
              </div>

              <div style={styles.inputWrapper}>
                <label style={styles.label}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={styles.inputIcon} />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required
                    style={styles.input}
                    onFocus={inputFocusHandler} onBlur={inputBlurHandler}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={styles.label}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters" required
                    style={styles.input}
                    onFocus={inputFocusHandler} onBlur={inputBlurHandler}
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Password strength hint */}
                <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} style={{
                      flex: 1, height: '3px', borderRadius: '2px',
                      background: password.length >= (i + 1) * 3
                        ? (password.length >= 9 ? '#34d399' : password.length >= 6 ? '#facc15' : '#f87171')
                        : 'rgba(255,255,255,0.06)',
                      transition: 'all 0.3s ease',
                    }} />
                  ))}
                </div>
                <p style={{ fontSize: '11px', color: 'rgba(148,163,184,0.4)', marginTop: '6px' }}>
                  {password.length === 0 ? 'At least 6 characters' :
                    password.length < 6 ? `${6 - password.length} more characters needed` :
                      password.length < 9 ? 'Good password' : 'Strong password ✓'}
                </p>
              </div>

              <button
                type="submit" disabled={loading}
                style={{
                  ...styles.submitBtn,
                  ...(loading ? { opacity: 0.7, cursor: 'not-allowed' } : {}),
                  ...(hoveredBtn === 'submit' && !loading ? { transform: 'translateY(-2px)', boxShadow: '0 6px 30px rgba(139,92,246,0.4)' } : {}),
                }}
                onMouseEnter={() => setHoveredBtn('submit')}
                onMouseLeave={() => setHoveredBtn(null)}
              >
                {loading ? 'Creating account...' : 'Create Account'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <p style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <Link to="/terms" style={{ color: 'rgba(167,139,250,0.7)', textDecoration: 'none' }}>Terms</Link> and{' '}
              <Link to="/privacy" style={{ color: 'rgba(167,139,250,0.7)', textDecoration: 'none' }}>Privacy Policy</Link>.
            </p>

            <button
              onClick={() => { loginAsGuest(); navigate('/dashboard'); }}
              style={getHoverStyle('guest', styles.guestBtn)}
              onMouseEnter={() => setHoveredBtn('guest')}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <Sparkles size={14} /> Try as Guest
            </button>

            <div style={styles.bottomLink}>
              Already have an account?{' '}
              <Link to="/login" style={styles.accentLink}>Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
