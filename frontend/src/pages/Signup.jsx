import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, AlertCircle, ArrowRight, ArrowLeft, Eye, EyeOff, CheckCircle, Github, Linkedin, Chrome } from 'lucide-react';
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
    background: 'rgba(20, 20, 28, 0.4)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px',
    padding: 'clamp(28px, 4vw, 44px) clamp(24px, 3.5vw, 40px)',
    backdropFilter: 'blur(32px)',
    WebkitBackdropFilter: 'blur(32px)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
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

export default function Signup() {
  const FORM_LABELS = {
    fullName: 'Full Name',
    email: 'Email',
    password: 'Password',
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, loginWithGoogle, loginWithGithub, loginWithLinkedin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }
    try {
      const user = await signup(email, password, fullName);
      if (user && user.emailVerified === false) {
        navigate(`/check-email?email=${encodeURIComponent(email)}`);
      } else {
        navigate('/login');
      }
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
            <img src={logo} alt="PrepLoop" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            <span style={styles.logoText}>PrepLoop</span>
          </Link>

          <h2 className="auth-brand-title" style={styles.heading}>
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
              <div key={i} style={styles.featureItem} className={`fade-in-up delay-${(i + 1) * 100}`}>
                <CheckCircle size={18} color="#34d399" style={{ flexShrink: 0 }} />
                <span style={styles.featureText}>{text}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div style={styles.testimonial} className="fade-in-up delay-300">
            <p style={styles.testimonialQuote}>
              "PrepLoop's AI interviews were a game-changer. I practiced daily and got an offer from Google within 3 months."
            </p>
            <p style={styles.testimonialAuthor}>
              — Software Engineer at Google
            </p>
          </div>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="auth-right-panel" style={styles.rightPanel}>
          <div style={styles.formCard} className="auth-card fade-in-up delay-100">
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
                  <Github size={17} /> GitHub
                </button>
                <button
                  onClick={() => handleSocialLogin('LinkedIn', loginWithLinkedin)}
                  style={styles.socialBtnSecondary}
                  className="auth-social-btn"
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
              <div style={styles.inputWrapper} className="auth-input-wrapper">
                <label style={styles.label}>{FORM_LABELS.fullName}</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={styles.inputIcon} className="auth-input-icon" />
                  <input
                    type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Your full name" required
                    style={styles.input}
                    className="auth-input"
                  />
                </div>
              </div>

              <div style={styles.inputWrapper} className="auth-input-wrapper">
                <label style={styles.label}>{FORM_LABELS.email}</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={styles.inputIcon} className="auth-input-icon" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required
                    style={styles.input}
                    className="auth-input"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '22px' }} className="auth-input-wrapper">
                <label style={styles.label}>{FORM_LABELS.password}</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={styles.inputIcon} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters" required
                    style={styles.input}
                    className="auth-input"
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                    className="auth-password-toggle"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Password strength hint */}
                <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} style={{
                      flex: 1, height: '3px', borderRadius: '2px',
                      background: password.length >= (i + 1) * 2
                        ? (password.length >= 10 ? '#34d399' : password.length >= 8 ? '#facc15' : '#f87171')
                        : 'rgba(255,255,255,0.06)',
                      transition: 'all 0.3s ease',
                    }} />
                  ))}
                </div>
                <p style={{ fontSize: '11px', color: 'rgba(148,163,184,0.4)', marginTop: '6px' }}>
                  {password.length === 0 ? 'At least 8 characters' :
                    password.length < 8 ? `${8 - password.length} more characters needed` :
                      password.length < 10 ? 'Good password' : 'Strong password ✓'}
                </p>
              </div>

              <button
                type="submit" disabled={loading}
                style={{
                  ...styles.submitBtn,
                  ...(loading ? { opacity: 0.7, cursor: 'not-allowed' } : {}),
                }}
                className="auth-submit-btn"
              >
                {loading ? 'Creating account...' : 'Create Account'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <p style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <Link to="/terms" style={{ color: 'rgba(167,139,250,0.7)', textDecoration: 'none' }} className="auth-link">Terms</Link> and{' '}
              <Link to="/privacy" style={{ color: 'rgba(167,139,250,0.7)', textDecoration: 'none' }} className="auth-link">Privacy Policy</Link>.
            </p>

            <div style={styles.bottomLink}>
              Already have an account?{' '}
              <Link to="/login" style={styles.accentLink} className="auth-link">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
