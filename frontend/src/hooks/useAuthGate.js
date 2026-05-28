import { useState, useCallback } from 'react';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import LoginPromptModal from '../components/LoginPromptModal';

/**
 * Hook for gating actions behind authentication.
 *
 * Usage:
 *   const { requireAuth, LoginModal } = useAuthGate();
 *
 *   const handleSubmit = () => {
 *     if (!requireAuth('Sign in to submit your code')) return;
 *     // ... proceed
 *   };
 *
 *   return <>{LoginModal}<button onClick={handleSubmit}>Submit</button></>;
 */
export function useAuthGate() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const requireAuth = useCallback((message) => {
    if (user) return true;
    setModalMessage(message || '');
    setModalOpen(true);
    return false;
  }, [user]);

  const LoginModal = React.createElement(LoginPromptModal, {
    isOpen: modalOpen,
    onClose: () => setModalOpen(false),
    message: modalMessage,
  });

  return { requireAuth, LoginModal, isAuthenticated: !!user };
}
