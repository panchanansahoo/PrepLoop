import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import apiClient from '../api/client';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

function isSafeRetryRequestUrl(requestUrl) {
  try {
    if (!requestUrl) return false;
    const raw = String(requestUrl).trim();
    if (!raw) return false;

    // Always allow relative API paths.
    if (raw.startsWith('/api/')) return true;

    // Allow absolute URLs only for configured API origin or current origin.
    const baseOrigin = window.location.origin;
    const resolved = new URL(raw, baseOrigin);
    const configuredApiOrigin = (() => {
      try {
        const fromEnv = import.meta.env.VITE_API_URL;
        return fromEnv ? new URL(fromEnv, baseOrigin).origin : null;
      } catch {
        return null;
      }
    })();

    if (resolved.origin === baseOrigin && resolved.pathname.startsWith('/api/')) return true;
    if (configuredApiOrigin && resolved.origin === configuredApiOrigin && resolved.pathname.startsWith('/api/')) return true;

    return false;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fix #9: use a ref so the interceptor always calls the latest refreshSession
  const refreshSessionRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        if (supabase) {
          const { data: { session }, error } = await supabase.auth.getSession();

          if (session) {
            const token = session.access_token;
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', session.refresh_token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            try {
              const response = await apiClient.get('/api/user/profile');
              const profileData = response.data.user;
              const fullUser = {
                id: session.user.id,
                email: session.user.email,
                fullName: profileData.full_name || session.user.user_metadata?.full_name,
                subscriptionTier: profileData.subscription_tier || 'free',
                experienceLevel: profileData.experience_level || 'beginner',
                role: profileData.role || 'user',
              };
              if (mounted) setUser(fullUser);
              localStorage.setItem('user', JSON.stringify(fullUser));
            } catch (err) {
              console.error('Profile sync error', err);
              const userMetadata = session.user.user_metadata || {};
              const fullUser = {
                id: session.user.id,
                email: session.user.email,
                fullName: userMetadata.full_name,
                role: 'user',
                ...userMetadata
              };
              if (mounted) setUser(fullUser);
              localStorage.setItem('user', JSON.stringify(fullUser));
            }
            return;
          }
        }

        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
          if (mounted) {
            setUser(JSON.parse(userData));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          }
        }

      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    let subscription = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session) {
          const token = session.access_token;
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', session.refresh_token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          try {
            const response = await apiClient.get('/api/user/profile');
            const profileData = response.data.user;
            const fullUser = {
              ...profileData,
              id: profileData.id,
              email: profileData.email || session.user.email,
              fullName: profileData.full_name,
              role: profileData.role || 'user',
            };
            if (mounted) {
              setUser(fullUser);
              localStorage.setItem('user', JSON.stringify(fullUser));
            }
          } catch (e) {
            console.error('Profile fetch failed', e);
            const u = {
              id: session.user.id,
              email: session.user.email,
              fullName: session.user.user_metadata?.full_name,
              role: 'user'
            };
            if (mounted) setUser(u);
          }
        } else if (event === 'SIGNED_OUT') {
          if (mounted) {
            setUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
          }
        }
      });
      subscription = data.subscription;
    }

    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const response = await apiClient.post('/api/auth/login', { email, password });
    const { token, refreshToken, user } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);

    return user;
  };

  const loginWithGoogle = async () => {
    if (!supabase) throw new Error('Supabase Authentication is not configured. Please check your .env file.');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/dashboard')}` }
    });
    if (error) throw error;
  };

  const loginWithGithub = async () => {
    if (!supabase) throw new Error('Supabase Authentication is not configured.');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/dashboard')}` }
    });
    if (error) throw error;
  };

  const loginWithLinkedin = async () => {
    if (!supabase) throw new Error('Supabase Authentication is not configured.');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/dashboard')}` }
    });
    if (error) throw error;
  };

  // Fix #4: signup now returns the user object so callers can redirect to /check-email
  const signup = async (email, password, fullName) => {
    const response = await apiClient.post('/api/auth/signup', { email, password, fullName });
    const { token, refreshToken, user } = response.data;

    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
    }

    return response.data.user;
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const refreshSession = async () => {
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) return false;

    let data = { session: null };
    let error = null;

    if (supabase) {
      const result = await supabase.auth.refreshSession();
      data = result.data;
      error = result.error;
    }

    if (!error && data?.session) {
      const token = data.session.access_token;
      const newRefreshToken = data.session.refresh_token;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', newRefreshToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return true;
    }

    try {
      const response = await apiClient.post('/api/auth/refresh', { refreshToken: storedRefreshToken });
      const { token, refreshToken: newRefreshToken } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', newRefreshToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return true;
    } catch {
      logout();
      return false;
    }
  };

  // Fix #9: keep ref in sync so the interceptor always has the latest function
  refreshSessionRef.current = refreshSession;

  const isAdmin = user?.role === 'admin';

  // Fix #9: interceptor uses ref — no stale closure
  // Fix #3: skip retry for EMAIL_NOT_VERIFIED 403 responses
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        const responseData = error.response?.data;

        if (!originalRequest || !isSafeRetryRequestUrl(originalRequest.url)) {
          return Promise.reject(error);
        }

        // Fix #3: do NOT retry if the 403 is specifically email-not-verified
        const isEmailNotVerified = error.response?.status === 403 &&
          responseData?.code === 'EMAIL_NOT_VERIFIED';

        if (
          (error.response?.status === 401 ||
            (error.response?.status === 403 && !isEmailNotVerified)) &&
          !originalRequest._retry &&
          localStorage.getItem('refreshToken')
        ) {
          originalRequest._retry = true;
          const refreshed = await refreshSessionRef.current();
          if (refreshed) {
            originalRequest.headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
            return axios(originalRequest);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []); // safe — uses ref, no stale closure

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, refreshSession, loginWithGoogle, loginWithGithub, loginWithLinkedin, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
