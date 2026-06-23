import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, ArrowRight, ArrowLeft, Eye, EyeOff, Github, Linkedin, Chrome, Zap, Shield, BarChart3, Cpu } from 'lucide-react';
import logo from '../assets/logo.svg';

/* ─── Canvas Particle Constellation ─── */
function ParticleCanvas() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef([]);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const PARTICLE_COUNT = 80;
    const CONNECT_DIST = 140;
    const MOUSE_RADIUS = 200;

    class Particle {
      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.r = Math.random() * 2 + 0.5;
        this.hue = 260 + Math.random() * 60;
        this.alpha = Math.random() * 0.5 + 0.3;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;
        // Mouse repulsion
        const dx = this.x - mouseRef.current.x;
        const dy = this.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * 0.02;
          this.vx += (dx / dist) * force;
          this.vy += (dy / dist) * force;
        }
        // Dampen
        this.vx *= 0.999;
        this.vy *= 0.999;
      }
      draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 80%, 70%, ${this.alpha})`;
        ctx.fill();
      }
    }

    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
    particlesRef.current = particles;

    function animate() {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.update();
        p.draw(ctx);
      }
      // Connect nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `hsla(270, 60%, 60%, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    const handleMouse = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouse);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        zIndex: 0, pointerEvents: 'none',
      }}
    />
  );
}

/* ─── Typing Effect Hook ─── */
function useTypingEffect(texts, typingSpeed = 60, deletingSpeed = 30, pauseTime = 2000) {
  const [displayed, setDisplayed] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = texts[textIndex];
    let timeout;

    if (!isDeleting && charIndex < currentText.length) {
      timeout = setTimeout(() => {
        setDisplayed(currentText.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, typingSpeed);
    } else if (!isDeleting && charIndex === currentText.length) {
      timeout = setTimeout(() => setIsDeleting(true), pauseTime);
    } else if (isDeleting && charIndex > 0) {
      timeout = setTimeout(() => {
        setDisplayed(currentText.slice(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      }, deletingSpeed);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setTextIndex((textIndex + 1) % texts.length);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex, texts, typingSpeed, deletingSpeed, pauseTime]);

  return displayed;
}

/* ─── Floating Code Snippets ─── */
function FloatingSnippets() {
  const snippets = [
    { code: 'function solve(arr) {', top: '12%', left: '5%', delay: '0s', dur: '18s' },
    { code: 'return dp[n-1];', top: '28%', left: '8%', delay: '3s', dur: '22s' },
    { code: 'O(n log n)', top: '65%', left: '3%', delay: '6s', dur: '20s' },
    { code: 'BFS(graph, start)', top: '80%', left: '10%', delay: '1s', dur: '16s' },
    { code: 'merge(left, right)', top: '45%', left: '2%', delay: '8s', dur: '24s' },
  ];

  return (
    <>
      {snippets.map((s, i) => (
        <div
          key={i}
          className="floating-snippet"
          style={{
            position: 'absolute', top: s.top, left: s.left,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: '11px', color: 'rgba(192, 132, 252, 0.2)',
            letterSpacing: '0.05em', pointerEvents: 'none', whiteSpace: 'nowrap',
            animation: `snippetFloat ${s.dur} ease-in-out infinite`,
            animationDelay: s.delay,
          }}
        >
          {s.code}
        </div>
      ))}
    </>
  );
}

/* ─── CSS-in-JS Keyframes ─── */
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

  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  @keyframes morphBlob {
    0%, 100% { border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%; }
    25% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
    50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
    75% { border-radius: 55% 45% 50% 50% / 30% 65% 35% 70%; }
  }

  @keyframes cardEntrance {
    from { opacity: 0; transform: perspective(1200px) rotateY(-8deg) translateX(40px) scale(0.95); }
    to { opacity: 1; transform: perspective(1200px) rotateY(0deg) translateX(0) scale(1); }
  }

  @keyframes fadeInStagger {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .auth-page-wrapper * { box-sizing: border-box; }

  .auth-card-glow {
    animation: cardEntrance 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    opacity: 0;
  }

  .auth-stagger { animation: fadeInStagger 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .auth-stagger-1 { animation-delay: 0.1s; }
  .auth-stagger-2 { animation-delay: 0.2s; }
  .auth-stagger-3 { animation-delay: 0.3s; }
  .auth-stagger-4 { animation-delay: 0.4s; }
  .auth-stagger-5 { animation-delay: 0.5s; }
  .auth-stagger-6 { animation-delay: 0.6s; }
  .auth-stagger-7 { animation-delay: 0.7s; }

  .left-panel-animate {
    animation: slideUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
  }

  /* ─── Gradient Border Effect ─── */
  .auth-gradient-border {
    position: relative;
    background: rgba(12, 10, 20, 0.65);
    border-radius: 28px;
    overflow: hidden;
  }
  .auth-gradient-border::before {
    content: '';
    position: absolute;
    top: -2px; left: -2px; right: -2px; bottom: -2px;
    background: conic-gradient(
      from var(--angle, 0deg),
      #a855f7, #ec4899, #8b5cf6, #06b6d4, #a855f7
    );
    border-radius: 30px;
    z-index: -1;
    animation: borderRotate 6s linear infinite;
    opacity: 0.6;
  }
  .auth-gradient-border::after {
    content: '';
    position: absolute;
    top: 1px; left: 1px; right: 1px; bottom: 1px;
    background: rgba(12, 10, 20, 0.92);
    border-radius: 27px;
    z-index: -1;
  }

  /* ─── Input styling ─── */
  .auth-input-v2 {
    transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .auth-input-v2:focus {
    border-color: rgba(168, 85, 247, 0.6) !important;
    box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.08), 0 0 20px rgba(168, 85, 247, 0.05) !important;
    background: rgba(168, 85, 247, 0.04) !important;
  }
  .auth-input-wrap:focus-within .auth-icon-v2 {
    color: #c084fc !important;
    filter: drop-shadow(0 0 6px rgba(192, 132, 252, 0.4));
  }

  /* ─── Button effects ─── */
  .auth-social-v2 {
    transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
    position: relative;
    overflow: hidden;
  }
  .auth-social-v2::after {
    content: '';
    position: absolute;
    top: 50%; left: 50%;
    width: 0; height: 0;
    background: rgba(255,255,255,0.06);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.5s, height 0.5s;
  }
  .auth-social-v2:hover {
    border-color: rgba(168, 85, 247, 0.3) !important;
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.3), 0 0 20px rgba(168, 85, 247, 0.08);
  }
  .auth-social-v2:hover::after {
    width: 300px;
    height: 300px;
  }

  .auth-cta-btn {
    transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    position: relative;
    overflow: hidden;
    z-index: 1;
  }
  .auth-cta-btn::before {
    content: '';
    position: absolute;
    top: 0; left: -100%; right: 0; bottom: 0;
    width: 300%;
    background: linear-gradient(
      90deg,
      transparent, rgba(255,255,255,0.1), transparent
    );
    z-index: 2;
    transition: left 0.6s;
  }
  .auth-cta-btn:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.01);
    box-shadow: 0 16px 40px rgba(168, 85, 247, 0.4), 0 0 60px rgba(168, 85, 247, 0.15);
  }
  .auth-cta-btn:hover:not(:disabled)::before {
    left: 100%;
  }
  .auth-cta-btn:active:not(:disabled) {
    transform: translateY(0) scale(0.99);
  }

  .auth-back-v2 {
    transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .auth-back-v2:hover {
    background: rgba(255,255,255,0.08) !important;
    border-color: rgba(168, 85, 247, 0.3) !important;
    transform: translateX(-4px);
    color: #f8fafc !important;
  }

  .auth-link-v2 {
    transition: all 0.25s ease;
  }
  .auth-link-v2:hover {
    color: #e879f9 !important;
    text-shadow: 0 0 16px rgba(232, 121, 249, 0.5);
  }

  .auth-toggle-pw:hover {
    color: #c084fc !important;
  }

  /* ─── Feature cards ─── */
  .feature-card-v2 {
    transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .feature-card-v2:hover {
    background: rgba(168, 85, 247, 0.08) !important;
    border-color: rgba(168, 85, 247, 0.2) !important;
    transform: translateX(6px);
  }

  /* ─── Responsive ─── */
  @media (max-width: 960px) {
    .auth-left-v2 { display: none !important; }
    .auth-right-v2 { flex: 1 1 100% !important; }
  }
  @media (max-width: 560px) {
    .auth-social-row-v2 { flex-direction: column !important; }
    .auth-form-card-inner { padding: 28px 20px !important; }
  }

  /* Animated gradient border uses @property for angle */
  @supports (background: conic-gradient(from 0deg, red, blue)) {
    @property --angle {
      syntax: '<angle>';
      initial-value: 0deg;
      inherits: false;
    }
  }
`;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { login, loginWithGoogle, loginWithGithub, loginWithLinkedin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = new URLSearchParams(location.search).get('redirect');

  const typedText = useTypingEffect([
    'Technical Interviews',
    'System Design',
    'DSA Mastery',
    'Dream Career',
  ], 70, 40, 2200);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const target = redirectTo && redirectTo.startsWith('/') ? decodeURIComponent(redirectTo) : '/dashboard';
      navigate(target);
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

  const features = [
    { icon: <Zap size={20} />, title: 'AI Mock Interviews', desc: 'Real-time feedback & analysis' },
    { icon: <Cpu size={20} />, title: 'Smart Study Plans', desc: 'Personalized learning paths' },
    { icon: <BarChart3 size={20} />, title: '90+ DSA Patterns', desc: 'With detailed solutions' },
    { icon: <Shield size={20} />, title: 'Resume Analysis', desc: 'ATS-optimized scoring' },
  ];

  return (
    <>
      <style>{keyframes}</style>
      <div className="auth-page-wrapper" style={{
        minHeight: '100vh', display: 'flex',
        background: 'linear-gradient(135deg, #030308 0%, #0a0614 40%, #0f0a1e 100%)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        position: 'relative', overflow: 'hidden',
      }}>
        <ParticleCanvas />

        {/* Morphing blobs */}
        <div style={{
          position: 'fixed', top: '-20%', left: '-10%',
          width: 'min(55vw, 500px)', height: 'min(55vw, 500px)',
          background: 'radial-gradient(ellipse, rgba(168, 85, 247, 0.08) 0%, transparent 70%)',
          animation: 'morphBlob 20s ease-in-out infinite, pulseGlow 8s ease-in-out infinite',
          pointerEvents: 'none', zIndex: 0, filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'fixed', bottom: '-15%', right: '-8%',
          width: 'min(50vw, 450px)', height: 'min(50vw, 450px)',
          background: 'radial-gradient(ellipse, rgba(236, 72, 153, 0.06) 0%, transparent 70%)',
          animation: 'morphBlob 25s ease-in-out infinite reverse, pulseGlow 10s ease-in-out infinite 2s',
          pointerEvents: 'none', zIndex: 0, filter: 'blur(50px)',
        }} />

        {/* Back button */}
        <Link to="/" className="auth-back-v2" style={{
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
        <div className="auth-left-v2" style={{
          flex: '1 1 52%', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '60px clamp(40px, 5vw, 72px)',
          position: 'relative', zIndex: 1,
        }}>
          <FloatingSnippets />
          <div className="left-panel-animate">
            {/* Logo */}
            <Link to="/" style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              textDecoration: 'none', marginBottom: '48px', width: 'fit-content',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.1))',
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

            {/* Headline with typing effect */}
            <h2 style={{
              fontSize: 'clamp(32px, 3.5vw, 46px)', fontWeight: 900, color: '#f8fafc',
              lineHeight: 1.1, marginBottom: '16px', letterSpacing: '-0.035em',
            }}>
              Ace Your Next<br />
              <span style={{
                background: 'linear-gradient(135deg, #c084fc 0%, #e879f9 40%, #f472b6 80%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                display: 'inline',
              }}>
                {typedText}
              </span>
              <span style={{
                display: 'inline-block', width: '3px', height: '0.9em',
                background: 'linear-gradient(180deg, #c084fc, #e879f9)',
                marginLeft: '2px', verticalAlign: 'text-bottom',
                animation: 'pulseGlow 1s ease-in-out infinite',
                borderRadius: '2px',
              }} />
            </h2>

            <p style={{
              fontSize: '16px', color: 'rgba(148,163,184,0.8)', lineHeight: 1.7,
              marginBottom: '44px', maxWidth: '420px', fontWeight: 400,
            }}>
              AI-powered mock interviews, personalized coaching, and proven strategies to land your dream job.
            </p>

            {/* Feature cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {features.map((f, i) => (
                <div key={i} className="feature-card-v2" style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '14px 18px', borderRadius: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'default',
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(236,72,153,0.06))',
                    border: '1px solid rgba(168,85,247,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#d8b4fe', flexShrink: 0,
                  }}>{f.icon}</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginBottom: '2px' }}>{f.title}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(148,163,184,0.6)', fontWeight: 500 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div style={{
              display: 'flex', gap: '40px', marginTop: '48px', paddingTop: '32px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}>
              {[
                { num: '10K+', label: 'Engineers' },
                { num: '95%', label: 'Success Rate' },
                { num: '500+', label: 'Companies' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{
                    fontSize: '26px', fontWeight: 900, letterSpacing: '-0.02em',
                    background: 'linear-gradient(135deg, #f8fafc 30%, #c084fc 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    marginBottom: '4px',
                  }}>{s.num}</div>
                  <div style={{
                    fontSize: '11px', color: 'rgba(148,163,184,0.5)',
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Right Panel ─── */}
        <div className="auth-right-v2" style={{
          flex: '1 1 48%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'clamp(80px, 10vw, 40px) clamp(20px, 4vw, 40px) clamp(20px, 4vw, 40px)',
          position: 'relative', zIndex: 1,
        }}>
          <div className="auth-gradient-border auth-card-glow" style={{ width: '100%', maxWidth: '440px' }}>
            <div className="auth-form-card-inner" style={{
              padding: 'clamp(28px, 4vw, 40px) clamp(24px, 3.5vw, 36px)',
              position: 'relative', zIndex: 2,
            }}>
              {/* Form header */}
              <div className="auth-stagger auth-stagger-1">
                <h1 style={{
                  fontSize: '26px', fontWeight: 800, color: '#f8fafc',
                  marginBottom: '6px', letterSpacing: '-0.02em',
                }}>Welcome back</h1>
                <p style={{
                  fontSize: '14px', color: 'rgba(148,163,184,0.65)', marginBottom: '28px',
                  fontWeight: 500,
                }}>Sign in to continue your preparation</p>
              </div>

              {/* Error */}
              {error && (
                <div className="auth-stagger" style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 16px', marginBottom: '20px',
                  background: 'rgba(239,68,68,0.06)', borderRadius: '14px',
                  border: '1px solid rgba(239,68,68,0.15)',
                  color: '#fca5a5', fontSize: '13px', lineHeight: 1.5,
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
                </div>
              )}

              {/* Social Login */}
              <div className="auth-stagger auth-stagger-2" style={{
                display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px',
              }}>
                <button
                  onClick={() => handleSocialLogin('Google', loginWithGoogle)}
                  className="auth-social-v2"
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    color: '#f1f5f9', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    fontFamily: 'inherit', position: 'relative',
                  }}
                >
                  <Chrome size={18} /> Continue with Google
                </button>
                <div className="auth-social-row-v2" style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleSocialLogin('GitHub', loginWithGithub)}
                    className="auth-social-v2"
                    style={{
                      flex: 1, padding: '12px', borderRadius: '14px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(255,255,255,0.02)',
                      color: '#cbd5e1', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      fontFamily: 'inherit', position: 'relative',
                    }}
                  >
                    <Github size={17} /> GitHub
                  </button>
                  <button
                    onClick={() => handleSocialLogin('LinkedIn', loginWithLinkedin)}
                    className="auth-social-v2"
                    style={{
                      flex: 1, padding: '12px', borderRadius: '14px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(255,255,255,0.02)',
                      color: '#cbd5e1', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      fontFamily: 'inherit', position: 'relative',
                    }}
                  >
                    <Linkedin size={17} /> LinkedIn
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="auth-stagger auth-stagger-3" style={{
                display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px',
              }}>
                <div style={{
                  flex: 1, height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                }} />
                <span style={{
                  fontSize: '11px', color: 'rgba(148,163,184,0.45)', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>or email</span>
                <div style={{
                  flex: 1, height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                }} />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                {/* Email */}
                <div className="auth-stagger auth-stagger-4 auth-input-wrap" style={{ marginBottom: '16px' }}>
                  <label style={{
                    fontSize: '12px', fontWeight: 700, color: 'rgba(203,213,225,0.7)',
                    marginBottom: '8px', display: 'block', letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                  }}>Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} className="auth-icon-v2" style={{
                      position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                      color: focusedField === 'email' ? '#c084fc' : 'rgba(148,163,184,0.4)',
                      pointerEvents: 'none', transition: 'all 0.3s ease',
                    }} />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="you@example.com" required
                      className="auth-input-v2"
                      style={{
                        width: '100%', padding: '13px 14px 13px 42px',
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '14px', color: '#f8fafc', fontSize: '14px',
                        fontFamily: 'inherit', outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="auth-stagger auth-stagger-5 auth-input-wrap" style={{ marginBottom: '24px' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: '8px',
                  }}>
                    <label style={{
                      fontSize: '12px', fontWeight: 700, color: 'rgba(203,213,225,0.7)',
                      letterSpacing: '0.02em', textTransform: 'uppercase',
                    }}>Password</label>
                    <Link to="/forgot-password" className="auth-link-v2" style={{
                      fontSize: '12px', color: '#a78bfa', textDecoration: 'none', fontWeight: 600,
                    }}>Forgot?</Link>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} className="auth-icon-v2" style={{
                      position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                      color: focusedField === 'password' ? '#c084fc' : 'rgba(148,163,184,0.4)',
                      pointerEvents: 'none', transition: 'all 0.3s ease',
                    }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password} onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••" required
                      className="auth-input-v2"
                      style={{
                        width: '100%', padding: '13px 44px 13px 42px',
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '14px', color: '#f8fafc', fontSize: '14px',
                        fontFamily: 'inherit', outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button" onClick={() => setShowPassword(!showPassword)}
                      className="auth-toggle-pw"
                      style={{
                        position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgba(148,163,184,0.5)', padding: '4px',
                        display: 'flex', alignItems: 'center',
                        transition: 'color 0.2s',
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <div className="auth-stagger auth-stagger-6">
                  <button
                    type="submit" disabled={loading}
                    className="auth-cta-btn"
                    style={{
                      width: '100%', padding: '14px', borderRadius: '14px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 30%, #c026d3 70%, #db2777 100%)',
                      color: 'white', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      fontFamily: 'inherit',
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? (
                      <>
                        <div style={{
                          width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff', borderRadius: '50%',
                          animation: 'borderRotate 0.8s linear infinite',
                        }} />
                        Signing in...
                      </>
                    ) : (
                      <>Sign In <ArrowRight size={16} /></>
                    )}
                  </button>
                </div>
              </form>

              {/* Bottom link */}
              <div className="auth-stagger auth-stagger-7" style={{
                marginTop: '24px', textAlign: 'center',
                color: 'rgba(148,163,184,0.5)', fontSize: '13px',
              }}>
                Don't have an account?{' '}
                <Link to="/signup" className="auth-link-v2" style={{
                  color: '#c084fc', fontWeight: 700, textDecoration: 'none', marginLeft: '4px',
                }}>Create account</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
