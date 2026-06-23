import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, AlertCircle, ArrowRight, ArrowLeft, Eye, EyeOff, Github, Linkedin, Chrome, CheckCircle, Star, Rocket, Trophy, Target } from 'lucide-react';
import logo from '../assets/logo.svg';

/* ─── Canvas Particle Constellation ─── */
function ParticleCanvas() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const PARTICLE_COUNT = 70;
    const CONNECT_DIST = 130;
    const MOUSE_RADIUS = 180;

    class Particle {
      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = (Math.random() - 0.5) * 0.35;
        this.r = Math.random() * 2 + 0.5;
        this.hue = 280 + Math.random() * 50;
        this.alpha = Math.random() * 0.5 + 0.2;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;
        const dx = this.x - mouseRef.current.x;
        const dy = this.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * 0.015;
          this.vx += (dx / dist) * force;
          this.vy += (dy / dist) * force;
        }
        this.vx *= 0.999;
        this.vy *= 0.999;
      }
      draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 75%, 65%, ${this.alpha})`;
        ctx.fill();
      }
    }

    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());

    function animate() {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) { p.update(); p.draw(ctx); }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `hsla(280, 55%, 55%, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    const handleMouse = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouse);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      zIndex: 0, pointerEvents: 'none',
    }} />
  );
}

/* ─── Floating Code Snippets ─── */
function FloatingSnippets() {
  const snippets = [
    { code: 'class Solution {', top: '8%', left: '4%', delay: '0s', dur: '19s' },
    { code: 'while (lo < hi)', top: '22%', left: '7%', delay: '4s', dur: '21s' },
    { code: 'HashMap<K, V>', top: '58%', left: '5%', delay: '2s', dur: '17s' },
    { code: 'queue.push(node)', top: '75%', left: '9%', delay: '7s', dur: '23s' },
    { code: 'dp[i][j] = max(...)', top: '42%', left: '3%', delay: '5s', dur: '20s' },
  ];

  return (
    <>
      {snippets.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', top: s.top, left: s.left,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: '11px', color: 'rgba(192, 132, 252, 0.18)',
          letterSpacing: '0.05em', pointerEvents: 'none', whiteSpace: 'nowrap',
          animation: `snippetFloat ${s.dur} ease-in-out infinite`,
          animationDelay: s.delay,
        }}>
          {s.code}
        </div>
      ))}
    </>
  );
}

/* ─── CSS Keyframes ─── */
const keyframes = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

  @keyframes borderRotate {
    0% { --angle: 0deg; }
    100% { --angle: 360deg; }
  }

  @keyframes snippetFloat {
    0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.15; }
    25% { transform: translate(15px, -20px) rotate(1deg); opacity: 0.25; }
    50% { transform: translate(-10px, -35px) rotate(-1deg); opacity: 0.2; }
    75% { transform: translate(20px, -15px) rotate(0.5deg); opacity: 0.18; }
  }

  @keyframes pulseGlow {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.05); }
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px); filter: blur(6px); }
    to { opacity: 1; transform: translateY(0); filter: blur(0); }
  }

  @keyframes morphBlob {
    0%, 100% { border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%; }
    25% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
    50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
    75% { border-radius: 55% 45% 50% 50% / 30% 65% 35% 70%; }
  }

  @keyframes cardEntrance {
    from { opacity: 0; transform: perspective(1200px) rotateY(8deg) translateX(-40px) scale(0.95); }
    to { opacity: 1; transform: perspective(1200px) rotateY(0deg) translateX(0) scale(1); }
  }

  @keyframes fadeInStagger {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes strengthPulse {
    0%, 100% { box-shadow: none; }
    50% { box-shadow: 0 0 8px currentColor; }
  }

  .signup-page-wrapper * { box-sizing: border-box; }

  .signup-card-glow {
    animation: cardEntrance 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    opacity: 0;
  }

  .signup-stagger { animation: fadeInStagger 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .signup-stagger-1 { animation-delay: 0.1s; }
  .signup-stagger-2 { animation-delay: 0.2s; }
  .signup-stagger-3 { animation-delay: 0.25s; }
  .signup-stagger-4 { animation-delay: 0.3s; }
  .signup-stagger-5 { animation-delay: 0.35s; }
  .signup-stagger-6 { animation-delay: 0.4s; }
  .signup-stagger-7 { animation-delay: 0.45s; }
  .signup-stagger-8 { animation-delay: 0.55s; }
  .signup-stagger-9 { animation-delay: 0.65s; }

  .left-panel-animate-signup {
    animation: slideUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
  }

  /* ─── Gradient Border ─── */
  .signup-gradient-border {
    position: relative;
    background: rgba(12, 10, 20, 0.65);
    border-radius: 28px;
    overflow: hidden;
  }
  .signup-gradient-border::before {
    content: '';
    position: absolute;
    top: -2px; left: -2px; right: -2px; bottom: -2px;
    background: conic-gradient(
      from var(--angle, 0deg),
      #a855f7, #06b6d4, #ec4899, #8b5cf6, #a855f7
    );
    border-radius: 30px;
    z-index: -1;
    animation: borderRotate 6s linear infinite;
    opacity: 0.5;
  }
  .signup-gradient-border::after {
    content: '';
    position: absolute;
    top: 1px; left: 1px; right: 1px; bottom: 1px;
    background: rgba(12, 10, 20, 0.92);
    border-radius: 27px;
    z-index: -1;
  }

  /* ─── Input styling ─── */
  .signup-input-v2 {
    transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .signup-input-v2:focus {
    border-color: rgba(168, 85, 247, 0.6) !important;
    box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.08), 0 0 20px rgba(168, 85, 247, 0.05) !important;
    background: rgba(168, 85, 247, 0.04) !important;
  }
  .signup-input-wrap:focus-within .signup-icon-v2 {
    color: #c084fc !important;
    filter: drop-shadow(0 0 6px rgba(192, 132, 252, 0.4));
  }

  /* ─── Button effects ─── */
  .signup-social-v2 {
    transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
    position: relative;
    overflow: hidden;
  }
  .signup-social-v2::after {
    content: '';
    position: absolute;
    top: 50%; left: 50%;
    width: 0; height: 0;
    background: rgba(255,255,255,0.06);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.5s, height 0.5s;
  }
  .signup-social-v2:hover {
    border-color: rgba(168, 85, 247, 0.3) !important;
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.3), 0 0 20px rgba(168, 85, 247, 0.08);
  }
  .signup-social-v2:hover::after {
    width: 300px; height: 300px;
  }

  .signup-cta-btn {
    transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    position: relative;
    overflow: hidden;
    z-index: 1;
  }
  .signup-cta-btn::before {
    content: '';
    position: absolute;
    top: 0; left: -100%; right: 0; bottom: 0;
    width: 300%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    z-index: 2;
    transition: left 0.6s;
  }
  .signup-cta-btn:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.01);
    box-shadow: 0 16px 40px rgba(168, 85, 247, 0.4), 0 0 60px rgba(168, 85, 247, 0.15);
  }
  .signup-cta-btn:hover:not(:disabled)::before { left: 100%; }
  .signup-cta-btn:active:not(:disabled) { transform: translateY(0) scale(0.99); }

  .signup-back-v2 {
    transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .signup-back-v2:hover {
    background: rgba(255,255,255,0.08) !important;
    border-color: rgba(168, 85, 247, 0.3) !important;
    transform: translateX(-4px);
    color: #f8fafc !important;
  }

  .signup-link-v2 {
    transition: all 0.25s ease;
  }
  .signup-link-v2:hover {
    color: #e879f9 !important;
    text-shadow: 0 0 16px rgba(232, 121, 249, 0.5);
  }

  .signup-toggle-pw:hover {
    color: #c084fc !important;
  }

  /* ─── Milestone cards ─── */
  .milestone-card {
    transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .milestone-card:hover {
    background: rgba(168, 85, 247, 0.08) !important;
    border-color: rgba(168, 85, 247, 0.2) !important;
    transform: translateX(6px);
  }

  /* ─── Responsive ─── */
  @media (max-width: 960px) {
    .signup-left-v2 { display: none !important; }
    .signup-right-v2 { flex: 1 1 100% !important; }
  }
  @media (max-width: 560px) {
    .signup-social-row-v2 { flex-direction: column !important; }
    .signup-form-card-inner { padding: 24px 18px !important; }
  }

  @supports (background: conic-gradient(from 0deg, red, blue)) {
    @property --angle {
      syntax: '<angle>';
      initial-value: 0deg;
      inherits: false;
    }
  }
`;

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
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

  // Password strength
  const getStrength = () => {
    if (password.length === 0) return { level: 0, label: 'At least 8 characters', color: 'rgba(148,163,184,0.4)' };
    if (password.length < 6) return { level: 1, label: `${8 - password.length} more needed`, color: '#f87171' };
    if (password.length < 8) return { level: 2, label: `${8 - password.length} more needed`, color: '#fbbf24' };
    if (password.length < 12) return { level: 3, label: 'Good password', color: '#34d399' };
    return { level: 4, label: 'Strong password ✓', color: '#22d3ee' };
  };
  const strength = getStrength();

  const milestones = [
    { icon: <Rocket size={18} />, text: 'Unlimited AI mock interviews' },
    { icon: <Target size={18} />, text: '90+ DSA patterns & solutions' },
    { icon: <Star size={18} />, text: 'ATS-optimized resume analysis' },
    { icon: <Trophy size={18} />, text: 'Company-specific preparation' },
  ];

  return (
    <>
      <style>{keyframes}</style>
      <div className="signup-page-wrapper" style={{
        minHeight: '100vh', display: 'flex',
        background: 'linear-gradient(135deg, #030308 0%, #0a0614 40%, #0f0a1e 100%)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        position: 'relative', overflow: 'hidden',
      }}>
        <ParticleCanvas />

        {/* Morphing blobs */}
        <div style={{
          position: 'fixed', top: '-18%', right: '-8%',
          width: 'min(50vw, 480px)', height: 'min(50vw, 480px)',
          background: 'radial-gradient(ellipse, rgba(168, 85, 247, 0.07) 0%, transparent 70%)',
          animation: 'morphBlob 22s ease-in-out infinite, pulseGlow 9s ease-in-out infinite',
          pointerEvents: 'none', zIndex: 0, filter: 'blur(45px)',
        }} />
        <div style={{
          position: 'fixed', bottom: '-15%', left: '-6%',
          width: 'min(45vw, 420px)', height: 'min(45vw, 420px)',
          background: 'radial-gradient(ellipse, rgba(217, 70, 239, 0.06) 0%, transparent 70%)',
          animation: 'morphBlob 26s ease-in-out infinite reverse, pulseGlow 11s ease-in-out infinite 3s',
          pointerEvents: 'none', zIndex: 0, filter: 'blur(50px)',
        }} />

        {/* Back button */}
        <Link to="/" className="signup-back-v2" style={{
          position: 'absolute', top: 'clamp(16px, 3vw, 28px)', left: 'clamp(16px, 3vw, 28px)',
          zIndex: 50, display: 'flex', alignItems: 'center', gap: '8px',
          color: 'rgba(203,213,225,0.7)', textDecoration: 'none',
          fontSize: '13px', fontWeight: 600, padding: '10px 16px', borderRadius: '14px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        }}>
          <ArrowLeft size={15} /> Home
        </Link>

        {/* ─── Left Panel ─── */}
        <div className="signup-left-v2" style={{
          flex: '1 1 50%', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '60px clamp(40px, 5vw, 68px)',
          position: 'relative', zIndex: 1,
        }}>
          <FloatingSnippets />
          <div className="left-panel-animate-signup">
            {/* Logo */}
            <Link to="/" style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              textDecoration: 'none', marginBottom: '44px', width: 'fit-content',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(217,70,239,0.1))',
                border: '1px solid rgba(168,85,247,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(168,85,247,0.1)',
              }}>
                <img src={logo} alt="PrepLoop" style={{ width: 24, height: 24, objectFit: 'contain' }} />
              </div>
              <span style={{
                fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #e879f9, #c084fc, #818cf8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>PrepLoop</span>
            </Link>

            <h2 style={{
              fontSize: 'clamp(30px, 3.2vw, 42px)', fontWeight: 900, color: '#f8fafc',
              lineHeight: 1.1, marginBottom: '14px', letterSpacing: '-0.035em',
            }}>
              Start Your Journey<br />
              <span style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f472b6 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>to Your Dream Company</span>
            </h2>

            <p style={{
              fontSize: '15px', color: 'rgba(148,163,184,0.75)', lineHeight: 1.7,
              marginBottom: '40px', maxWidth: '400px', fontWeight: 400,
            }}>
              Join thousands of engineers who landed their dream jobs using AI-powered interview preparation.
            </p>

            {/* Milestone cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {milestones.map((m, i) => (
                <div key={i} className="milestone-card" style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px 16px', borderRadius: '14px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'default',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(34,211,238,0.06))',
                    border: '1px solid rgba(52,211,153,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#6ee7b7', flexShrink: 0,
                  }}>{m.icon}</div>
                  <span style={{ fontSize: '13px', color: 'rgba(203,213,225,0.8)', fontWeight: 600 }}>{m.text}</span>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div style={{
              marginTop: '44px', paddingTop: '28px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}>
              <p style={{
                fontSize: '14px', color: 'rgba(203,213,225,0.6)', fontStyle: 'italic',
                lineHeight: 1.7, marginBottom: '12px',
              }}>
                "PrepLoop's AI interviews were a game-changer. I practiced daily and got an offer from Google within 3 months."
              </p>
              <p style={{
                fontSize: '12px', color: 'rgba(148,163,184,0.45)', fontWeight: 700,
              }}>
                — Software Engineer at Google
              </p>
            </div>
          </div>
        </div>

        {/* ─── Right Panel ─── */}
        <div className="signup-right-v2" style={{
          flex: '1 1 50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'clamp(80px, 10vw, 40px) clamp(16px, 3vw, 36px) clamp(20px, 4vw, 36px)',
          position: 'relative', zIndex: 1,
        }}>
          <div className="signup-gradient-border signup-card-glow" style={{ width: '100%', maxWidth: '440px' }}>
            <div className="signup-form-card-inner" style={{
              padding: 'clamp(24px, 3.5vw, 36px) clamp(20px, 3vw, 32px)',
              position: 'relative', zIndex: 2,
            }}>
              {/* Header */}
              <div className="signup-stagger signup-stagger-1">
                <h1 style={{
                  fontSize: '24px', fontWeight: 800, color: '#f8fafc',
                  marginBottom: '4px', letterSpacing: '-0.02em',
                }}>Create your account</h1>
                <p style={{
                  fontSize: '13px', color: 'rgba(148,163,184,0.6)', marginBottom: '22px', fontWeight: 500,
                }}>Start preparing for your dream job today</p>
              </div>

              {/* Error */}
              {error && (
                <div className="signup-stagger" style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '11px 14px', marginBottom: '16px',
                  background: 'rgba(239,68,68,0.06)', borderRadius: '12px',
                  border: '1px solid rgba(239,68,68,0.15)',
                  color: '#fca5a5', fontSize: '13px', lineHeight: 1.5,
                }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
                </div>
              )}

              {/* Social */}
              <div className="signup-stagger signup-stagger-2" style={{
                display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px',
              }}>
                <button
                  onClick={() => handleSocialLogin('Google', loginWithGoogle)}
                  className="signup-social-v2"
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: '13px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    color: '#f1f5f9', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
                    fontFamily: 'inherit', position: 'relative',
                  }}
                >
                  <Chrome size={17} /> Continue with Google
                </button>
                <div className="signup-social-row-v2" style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleSocialLogin('GitHub', loginWithGithub)}
                    className="signup-social-v2"
                    style={{
                      flex: 1, padding: '11px', borderRadius: '13px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(255,255,255,0.02)',
                      color: '#cbd5e1', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                      fontFamily: 'inherit', position: 'relative',
                    }}
                  >
                    <Github size={16} /> GitHub
                  </button>
                  <button
                    onClick={() => handleSocialLogin('LinkedIn', loginWithLinkedin)}
                    className="signup-social-v2"
                    style={{
                      flex: 1, padding: '11px', borderRadius: '13px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(255,255,255,0.02)',
                      color: '#cbd5e1', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                      fontFamily: 'inherit', position: 'relative',
                    }}
                  >
                    <Linkedin size={16} /> LinkedIn
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="signup-stagger signup-stagger-3" style={{
                display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px',
              }}>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' }} />
                <span style={{ fontSize: '10px', color: 'rgba(148,163,184,0.4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>or email</span>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' }} />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                {/* Full Name */}
                <div className="signup-stagger signup-stagger-4 signup-input-wrap" style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '11px', fontWeight: 700, color: 'rgba(203,213,225,0.65)',
                    marginBottom: '6px', display: 'block', letterSpacing: '0.04em', textTransform: 'uppercase',
                  }}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} className="signup-icon-v2" style={{
                      position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)',
                      color: focusedField === 'name' ? '#c084fc' : 'rgba(148,163,184,0.35)',
                      pointerEvents: 'none', transition: 'all 0.3s ease',
                    }} />
                    <input
                      type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Your full name" required
                      className="signup-input-v2"
                      style={{
                        width: '100%', padding: '12px 13px 12px 40px',
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '13px', color: '#f8fafc', fontSize: '13px',
                        fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="signup-stagger signup-stagger-5 signup-input-wrap" style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '11px', fontWeight: 700, color: 'rgba(203,213,225,0.65)',
                    marginBottom: '6px', display: 'block', letterSpacing: '0.04em', textTransform: 'uppercase',
                  }}>Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} className="signup-icon-v2" style={{
                      position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)',
                      color: focusedField === 'email' ? '#c084fc' : 'rgba(148,163,184,0.35)',
                      pointerEvents: 'none', transition: 'all 0.3s ease',
                    }} />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="you@example.com" required
                      className="signup-input-v2"
                      style={{
                        width: '100%', padding: '12px 13px 12px 40px',
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '13px', color: '#f8fafc', fontSize: '13px',
                        fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="signup-stagger signup-stagger-6 signup-input-wrap" style={{ marginBottom: '18px' }}>
                  <label style={{
                    fontSize: '11px', fontWeight: 700, color: 'rgba(203,213,225,0.65)',
                    marginBottom: '6px', display: 'block', letterSpacing: '0.04em', textTransform: 'uppercase',
                  }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} className="signup-icon-v2" style={{
                      position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)',
                      color: focusedField === 'password' ? '#c084fc' : 'rgba(148,163,184,0.35)',
                      pointerEvents: 'none', transition: 'all 0.3s ease',
                    }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password} onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Minimum 8 characters" required
                      className="signup-input-v2"
                      style={{
                        width: '100%', padding: '12px 42px 12px 40px',
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '13px', color: '#f8fafc', fontSize: '13px',
                        fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button" onClick={() => setShowPassword(!showPassword)}
                      className="signup-toggle-pw"
                      style={{
                        position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgba(148,163,184,0.5)', padding: '3px',
                        display: 'flex', alignItems: 'center', transition: 'color 0.2s',
                      }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {/* Password strength bar */}
                  <div style={{ display: 'flex', gap: '3px', marginTop: '8px' }}>
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} style={{
                        flex: 1, height: '3px', borderRadius: '2px',
                        background: i < strength.level ? strength.color : 'rgba(255,255,255,0.05)',
                        transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                        boxShadow: i < strength.level ? `0 0 6px ${strength.color}33` : 'none',
                      }} />
                    ))}
                  </div>
                  <p style={{
                    fontSize: '10px', color: strength.color, marginTop: '5px',
                    fontWeight: 600, transition: 'color 0.3s ease',
                  }}>{strength.label}</p>
                </div>

                {/* Submit */}
                <div className="signup-stagger signup-stagger-7">
                  <button
                    type="submit" disabled={loading}
                    className="signup-cta-btn"
                    style={{
                      width: '100%', padding: '13px', borderRadius: '14px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 30%, #c026d3 70%, #db2777 100%)',
                      color: 'white', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
                      fontFamily: 'inherit', opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? (
                      <>
                        <div style={{
                          width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff', borderRadius: '50%',
                          animation: 'borderRotate 0.8s linear infinite',
                        }} />
                        Creating account...
                      </>
                    ) : (
                      <>Create Account <ArrowRight size={15} /></>
                    )}
                  </button>
                </div>
              </form>

              {/* Terms */}
              <p className="signup-stagger signup-stagger-8" style={{
                fontSize: '10px', color: 'rgba(148,163,184,0.35)', marginTop: '14px',
                textAlign: 'center', lineHeight: 1.7,
              }}>
                By creating an account, you agree to our{' '}
                <Link to="/terms" className="signup-link-v2" style={{ color: 'rgba(167,139,250,0.65)', textDecoration: 'none' }}>Terms</Link> and{' '}
                <Link to="/privacy" className="signup-link-v2" style={{ color: 'rgba(167,139,250,0.65)', textDecoration: 'none' }}>Privacy Policy</Link>.
              </p>

              {/* Bottom link */}
              <div className="signup-stagger signup-stagger-9" style={{
                marginTop: '16px', textAlign: 'center',
                color: 'rgba(148,163,184,0.45)', fontSize: '13px',
              }}>
                Already have an account?{' '}
                <Link to="/login" className="signup-link-v2" style={{
                  color: '#c084fc', fontWeight: 700, textDecoration: 'none',
                }}>Sign in</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
