import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';

const STORAGE_KEY = 'preploop_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // Small delay so it does not jump abruptly on initial page paint
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Storage access blocked or restricted
    }
  }, []);

  const handleChoice = (preference) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          preference,
          timestamp: new Date().toISOString(),
          version: '1.0',
        })
      );
    } catch {
      // Ignore write error
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        right: '24px',
        maxWidth: '560px',
        margin: '0 auto',
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.96)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 20px rgba(139, 92, 246, 0.15)',
        color: '#f8fafc',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div
          style={{
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '10px',
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={22} color="#a78bfa" />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 id="cookie-banner-title" style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>
              Privacy &amp; Cookie Preferences
            </h3>
            <button
              type="button"
              onClick={() => handleChoice('dismissed')}
              aria-label="Dismiss cookie notice"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>

          <p id="cookie-banner-desc" style={{ margin: '0 0 16px 0', fontSize: '13px', lineHeight: '1.6', color: '#cbd5e1' }}>
            We use strictly necessary cookies for secure session authentication and CSRF defense, along with optional performance analytics to improve interview simulations. Learn more in our{' '}
            <Link to="/cookies" style={{ color: '#c4b5fd', textDecoration: 'underline' }}>
              Cookie Policy
            </Link>{' '}
            and{' '}
            <Link to="/privacy" style={{ color: '#c4b5fd', textDecoration: 'underline' }}>
              Privacy Policy
            </Link>.
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleChoice('all')}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                color: '#ffffff',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
            >
              Accept All
            </button>

            <button
              type="button"
              onClick={() => handleChoice('essential_only')}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#f1f5f9',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '9px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              Essential Only
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

