import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Mail, Lock, User, Building, Award, ChevronRight, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function HRLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ fullName: '', email: '', password: '', company: '', designation: '', experience: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/hr/login' : '/api/hr/register';
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : form;

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      // Store HR token separately
      localStorage.setItem('hr_token', data.token);
      localStorage.setItem('hr_user', JSON.stringify(data.user));
      navigate('/hr/dashboard');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary, #050507)',
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: 'var(--bg-secondary, #0f0f13)',
        border: '1px solid var(--border, rgba(255,255,255,0.08))',
        borderRadius: 20,
        padding: '40px 32px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Briefcase size={24} style={{ color: '#818cf8' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            {mode === 'login' ? 'HR Login' : 'HR Registration'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {mode === 'login'
              ? 'Log in to manage interviews and post jobs'
              : 'Create your HR account to join PrepLoop'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24,
          background: 'var(--bg-tertiary, rgba(255,255,255,0.04))',
          borderRadius: 10, padding: 4,
        }}>
          {['login', 'register'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1, padding: '8px 14px', borderRadius: 8,
                border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 13,
                background: mode === m ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                color: mode === m ? '#818cf8' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 16,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#f87171', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <InputField
              icon={<User size={16} />}
              placeholder="Full Name *"
              value={form.fullName}
              onChange={v => updateForm('fullName', v)}
              required
            />
          )}

          <InputField
            icon={<Mail size={16} />}
            placeholder="Email *"
            type="email"
            value={form.email}
            onChange={v => updateForm('email', v)}
            required
          />

          <div style={{ position: 'relative' }}>
            <InputField
              icon={<Lock size={16} />}
              placeholder="Password *"
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={v => updateForm('password', v)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text-secondary)',
                cursor: 'pointer', padding: 4,
              }}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {mode === 'register' && (
            <>
              <InputField
                icon={<Building size={16} />}
                placeholder="Company Name"
                value={form.company}
                onChange={v => updateForm('company', v)}
              />
              <InputField
                icon={<Award size={16} />}
                placeholder="Designation (e.g. Senior HR Manager)"
                value={form.designation}
                onChange={v => updateForm('designation', v)}
              />
              <InputField
                icon={<Briefcase size={16} />}
                placeholder="Years of Experience"
                type="number"
                value={form.experience}
                onChange={v => updateForm('experience', v)}
              />
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px 20px',
              borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', fontWeight: 600, fontSize: 14,
              cursor: 'pointer', marginTop: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Please wait...' : (
              <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ChevronRight size={16} /></>
            )}
          </button>
        </form>

        <p style={{
          textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)',
          marginTop: 20,
        }}>
          {mode === 'login' ? (
            <>Not an HR? <a href="/login" style={{ color: '#818cf8' }}>Student Login →</a></>
          ) : (
            <>Already registered? <button onClick={() => setMode('login')} style={{ color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>Sign In</button></>
          )}
        </p>
      </div>
    </div>
  );
}

function InputField({ icon, placeholder, type = 'text', value, onChange, required }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--bg-tertiary, rgba(255,255,255,0.04))',
      border: '1px solid var(--border, rgba(255,255,255,0.08))',
      borderRadius: 10, padding: '0 14px',
      marginBottom: 12,
    }}>
      <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{
          flex: 1, padding: '12px 0',
          background: 'transparent', border: 'none', outline: 'none',
          color: 'var(--text-primary)', fontSize: 13,
        }}
      />
    </div>
  );
}
