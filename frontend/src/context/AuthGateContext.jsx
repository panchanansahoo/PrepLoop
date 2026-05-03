import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const AuthGateContext = createContext(null);

export function AuthGateProvider({ children }) {
    const { user } = useAuth();
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');

    const requireAuth = useCallback((customMessage = '') => {
        if (user) return true;
        setMessage(customMessage);
        setVisible(true);
        return false;
    }, [user]);

    const close = useCallback(() => {
        setVisible(false);
        setMessage('');
    }, []);

    return (
        <AuthGateContext.Provider value={{ requireAuth, visible, message, close }}>
            {children}
        </AuthGateContext.Provider>
    );
}

export function useAuthGate() {
    const ctx = useContext(AuthGateContext);
    if (!ctx) throw new Error('useAuthGate must be used within AuthGateProvider');
    return ctx;
}
