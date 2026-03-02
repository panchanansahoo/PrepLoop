import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, ArrowRight, Sparkles, Code2, Brain, MessageSquare, Github, Linkedin, Chrome } from 'lucide-react';

import logo from '../assets/logo.svg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
        setError('Unable to connect to the server. Please ensure the backend is running (try "npm run dev").');
      } else {
        setError(err.response?.data?.error || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handSocialLogin = async (provider, loginFn) => {
    try {
      setError('');
      console.log(`Starting ${provider} login...`);
      await loginFn();
    } catch (err) {
      console.error(`${provider} login failed:`, err);
      setError(err.message || `Failed to sign in with ${provider}`);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left Panel — Branding */}
      <div style={{
        flex: 1, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: -100, right: -100, width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(108,92,231,0.15), transparent)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -80, width: 250, height: 250,
          background: 'radial-gradient(circle, rgba(168,85,247,0.1), transparent)',
          borderRadius: '50%'
        }} />

        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'white', textDecoration: 'none', marginBottom: 48, fontSize: 24, fontWeight: 700 }}>
          <img src={logo} alt="PrepLoop" className="w-8 h-8 object-contain" /> PrepLoop
        </Link>

        <h2 style={{ fontSize: 36, fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: 16 }}>
          Ace Your Next<br />Technical Interview
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 40, maxWidth: 400 }}>
          AI-powered mock interviews, personalized coaching, and patterns to land your dream job.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { icon: <MessageSquare size={18} />, text: 'AI Mock Interviews with instant feedback' },
            { icon: <Brain size={18} />, text: 'Personalized AI coaching' },
            { icon: <Code2 size={18} />, text: '90+ DSA patterns with detailed solutions' }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.7)' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: 'rgba(108,92,231,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#a78bfa'
              }}>{item.icon}</div>
              <span style={{ fontSize: 14 }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px', background: 'var(--bg-primary)'
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 32 }}>
            Login to continue your interview preparation
          </p>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
              background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.2)',
              borderRadius: 10, color: '#ff4757', fontSize: 14, marginBottom: 20
            }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {/* Social Auth Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            <button
              onClick={() => handSocialLogin('Google', loginWithGoogle)}
              style={{
                width: '100%', padding: '12px', borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)', color: 'var(--text-primary)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontFamily: 'inherit'
              }}
            >
              <Chrome size={18} /> Continue with Google
            </button>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => handSocialLogin('GitHub', loginWithGithub)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)', color: 'var(--text-primary)',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  fontFamily: 'inherit'
                }}
              >
                <Github size={18} /> GitHub
              </button>
              <button
                onClick={() => handSocialLogin('LinkedIn', loginWithLinkedin)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)', color: 'var(--text-primary)',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  fontFamily: 'inherit'
                }}
              >
                <Linkedin size={18} /> LinkedIn
              </button>
            </div>
          </div>


          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required
                  style={{ width: '100%', padding: '12px 14px 12px 42px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Password</label>
                <a href="#" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Forgot password?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                  style={{ width: '100%', padding: '12px 14px 12px 42px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit' }}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-hero-primary"
              style={{ width: '100%', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15, justifyContent: 'center' }}
            >
              {loading ? 'Logging in...' : 'Sign In'} {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <button
            onClick={() => {
              loginAsGuest();
              navigate('/dashboard');
            }}
            style={{
              width: '100%', padding: '12px', borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text-secondary)',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontFamily: 'inherit', marginTop: 16
            }}
          >
            Continue as Guest
          </button>

          <div style={{ marginTop: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Create account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
