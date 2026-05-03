import React from 'react';
import { Link } from 'react-router-dom';
import { X, LogIn, UserPlus, Shield, Zap, CheckCircle } from 'lucide-react';
import { useAuthGate } from '../context/AuthGateContext';
import './AuthGate.css';

export default function AuthGate() {
    const { visible, message, close } = useAuthGate();

    if (!visible) return null;

    return (
        <div className="auth-gate-overlay" onClick={close}>
            <div className="auth-gate-modal" onClick={e => e.stopPropagation()}>
                <button className="auth-gate-close" onClick={close} aria-label="Close">
                    <X size={16} />
                </button>

                <div className="auth-gate-icon">
                    <Shield size={28} />
                </div>

                <h2 className="auth-gate-title">Sign in to continue</h2>
                <p className="auth-gate-subtitle">
                    {message || 'Create a free account to access this feature, track your progress, and unlock personalized insights.'}
                </p>

                <div className="auth-gate-actions">
                    <Link to="/signup" className="auth-gate-btn-primary" onClick={close}>
                        <UserPlus size={18} />
                        Create Free Account
                    </Link>
                    <Link to="/login" className="auth-gate-btn-secondary" onClick={close}>
                        <LogIn size={18} />
                        Sign In
                    </Link>
                </div>

                <div className="auth-gate-features">
                    <span className="auth-gate-feature"><CheckCircle size={12} /> Free forever</span>
                    <span className="auth-gate-feature"><Zap size={12} /> Instant access</span>
                    <span className="auth-gate-feature"><Shield size={12} /> Secure</span>
                </div>
            </div>
        </div>
    );
}
