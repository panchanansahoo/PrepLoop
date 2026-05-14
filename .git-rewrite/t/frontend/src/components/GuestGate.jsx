import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, X, Sparkles, Lock, ChevronRight } from 'lucide-react';

/**
 * GuestGate – a modal that blocks guest users from interactive features.
 *
 * Usage in pages:
 *   const { requireAuth } = useGuestGate();
 *
 *   const handleSubmit = () => {
 *     if (!requireAuth('Submit your solution')) return;
 *     // … actual submit logic
 *   };
 *
 * The <GuestGateModal /> is rendered once at the App level.
 */

// ── Shared event bus so any component can trigger the gate ──
const listeners = new Set();

function emit(featureLabel) {
  listeners.forEach(fn => fn(featureLabel));
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Hook for pages/components to gate an action behind auth.
 * Returns { requireAuth } where requireAuth(label) returns true if
 * the user is authenticated, or opens the gate modal and returns false.
 */
export function useGuestGate() {
  const { user } = useAuth();

  const requireAuth = useCallback((featureLabel = 'this feature') => {
    if (user) return true;
    emit(featureLabel);
    return false;
  }, [user]);

  return { requireAuth };
}

/**
 * Modal rendered once at app root. Listens for gate events and shows
 * a premium "Sign in to continue" overlay.
 */
export default function GuestGateModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [featureLabel, setFeatureLabel] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    return subscribe((label) => {
      setFeatureLabel(label);
      setIsOpen(true);
    });
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => setIsOpen(false);

  const handleLogin = () => {
    setIsOpen(false);
    navigate('/login', { state: { from: window.location.pathname } });
  };

  const handleSignup = () => {
    setIsOpen(false);
    navigate('/signup', { state: { from: window.location.pathname } });
  };

  return (
    <div className="guest-gate-overlay" onClick={handleClose}>
      <div className="guest-gate-modal" onClick={e => e.stopPropagation()}>
        {/* Close button */}
        <button className="guest-gate-close" onClick={handleClose} aria-label="Close">
          <X size={20} />
        </button>

        {/* Decorative glow */}
        <div className="guest-gate-glow" />

        {/* Icon */}
        <div className="guest-gate-icon-wrapper">
          <div className="guest-gate-icon">
            <Lock size={28} />
          </div>
          <div className="guest-gate-icon-ring" />
        </div>

        {/* Content */}
        <h2 className="guest-gate-title">Sign in to Continue</h2>
        <p className="guest-gate-subtitle">
          Create a free account to <strong>{featureLabel}</strong> and unlock your full learning potential.
        </p>

        {/* Benefits */}
        <div className="guest-gate-benefits">
          <div className="guest-gate-benefit">
            <Sparkles size={16} />
            <span>Track your progress & streaks</span>
          </div>
          <div className="guest-gate-benefit">
            <Sparkles size={16} />
            <span>AI-powered interview practice</span>
          </div>
          <div className="guest-gate-benefit">
            <Sparkles size={16} />
            <span>Personalized learning paths</span>
          </div>
        </div>

        {/* Actions */}
        <div className="guest-gate-actions">
          <button className="guest-gate-btn-primary" onClick={handleSignup}>
            <LogIn size={18} />
            Get Started Free
            <ChevronRight size={16} />
          </button>
          <button className="guest-gate-btn-secondary" onClick={handleLogin}>
            Already have an account? Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
