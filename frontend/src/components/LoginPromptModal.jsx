import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogIn, UserPlus, X, Lock } from 'lucide-react';
import './LoginPromptModal.css';

export default function LoginPromptModal({ isOpen, onClose, message }) {
  const location = useLocation();
  const redirectPath = encodeURIComponent(location.pathname + location.search);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="login-prompt-overlay" onClick={onClose}>
      <div className="login-prompt-card" onClick={(e) => e.stopPropagation()}>
        <button className="login-prompt-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <div className="login-prompt-icon-wrap">
          <div className="login-prompt-icon-ring">
            <Lock size={28} />
          </div>
        </div>

        <h2 className="login-prompt-title">Sign in required</h2>
        <p className="login-prompt-message">
          {message || 'Sign in to access this feature and unlock your full potential.'}
        </p>

        <div className="login-prompt-actions">
          <Link
            to={`/login?redirect=${redirectPath}`}
            className="login-prompt-btn login-prompt-btn-primary"
            onClick={onClose}
          >
            <LogIn size={16} />
            Sign In
          </Link>
          <Link
            to={`/signup?redirect=${redirectPath}`}
            className="login-prompt-btn login-prompt-btn-secondary"
            onClick={onClose}
          >
            <UserPlus size={16} />
            Create Account
          </Link>
        </div>

        <p className="login-prompt-hint">
          Free account — no credit card required
        </p>
      </div>
    </div>
  );
}
