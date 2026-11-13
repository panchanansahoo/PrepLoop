import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { authFetch } from '../utils/authFetch';
import apiClient from '../utils/apiClient';
import { mergeAuthHeaders } from '../utils/authHeaders';

const AuthContext = createContext(null);

export function stripAuthToken(userObj) {
  if (!userObj || typeof userObj !== 'object') return null;
  const { access_token: _at, token: _t, ...safeUser } = userObj;
  return safeUser;
}

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
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (token && stored) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return JSON.parse(stored);
      }
      return null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(() => {
    try {
      const token = localStorage.getItem('token');
      const stored = localStorage.getItem('user');
      // If we already have a valid token and cached user, don't block the UI
      if (token && stored) {
        return false;
      }
      // If there is no token and no Supabase, user is definitely unauthenticated
      if (!token && !supabase) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  });

  axios.defaults.withCredentials = true;

  // Fix #9: use a ref so the interceptor always calls the latest refreshSession
  const refreshSessionRef = useRef(null);
  // Deduplicate in-flight token refresh requests across concurrent calls
  const refreshPromiseRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        if (supabase) {
          // Timeout getSession so slow network or Supabase latency does not block startup
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise((resolve) =>
            setTimeout(() => resolve({ data: { session: null }, timeout: true }), 2000)
          );

          const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);

          if (session) {
            const token = session.access_token;
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            const userMetadata = session.user.user_metadata || {};
            const initialUser = {
              id: session.user.id,
              email: session.user.email,
              fullName: userMetadata.full_name || session.user.email?.split('@')[0],
              role: session.user.app_metadata?.role || userMetadata.role || 'user',
              subscriptionTier: 'free',
              experienceLevel: 'beginner',
              ...userMetadata,
            };

            // Immediately unblock UI with session/cached user
            if (mounted) {
              setUser((prev) => prev || initialUser);
              setLoading(false);
            }

            // Sync full profile in the background without blocking app startup
            apiClient.get('/api/user/profile', { timeout: 5000 })
              .then((response) => {
                if (!mounted) return;
                const profileData = response?.user || response?.data?.user;
                if (profileData) {
                  const fullUser = {
                    ...initialUser,
                    ...profileData,
                    fullName: profileData.fullName || userMetadata.full_name,
                    subscriptionTier: profileData.subscriptionTier || 'free',
                    experienceLevel: profileData.experienceLevel || 'beginner',
                    role: profileData.role || session.user.app_metadata?.role || userMetadata.role || 'user',
                  };
                  setUser(fullUser);
                  localStorage.setItem('user', JSON.stringify(stripAuthToken(fullUser)));
                }
              })
              .catch((err) => {
                console.warn('Background profile sync note:', err?.message || err);
                if (mounted) {
                  localStorage.setItem('user', JSON.stringify(stripAuthToken(initialUser)));
                }
              });

            return;
          }
        }

        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData && mounted) {
          try {
            setUser(JSON.parse(userData));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          } catch {}
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
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          const userMetadata = session.user.user_metadata || {};
          const initialUser = {
            id: session.user.id,
            email: session.user.email,
            fullName: userMetadata.full_name || session.user.email?.split('@')[0],
            role: session.user.app_metadata?.role || userMetadata.role || 'user',
            subscriptionTier: 'free',
            experienceLevel: 'beginner',
            ...userMetadata,
          };

          if (mounted) {
            setUser((prev) => prev || initialUser);
            setLoading(false);
          }

          apiClient.get('/api/user/profile', { timeout: 5000 })
            .then((response) => {
              if (!mounted) return;
              const profileData = response?.user || response?.data?.user;
              if (profileData) {
                const fullUser = {
                  ...initialUser,
                  ...profileData,
                  fullName: profileData.fullName || userMetadata.full_name,
                  role: profileData.role || session.user.app_metadata?.role || userMetadata.role || 'user',
                };
                setUser(fullUser);
                localStorage.setItem('user', JSON.stringify(stripAuthToken(fullUser)));
              }
            })
            .catch((e) => {
              console.warn('Profile fetch note in background:', e?.message || e);
            });
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
    const response = await apiClient.post(
      '/api/auth/login',
      { email: email.trim().toLowerCase(), password },
      { skipAuthRefresh: true, skipRetry: true }
    );
    const { token, user } = response;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(stripAuthToken(user)));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);

    return user;
  };

  const loginWithGoogle = async () => {
    if (!supabase) throw new Error('Supabase Authentication is not configured. Please check your .env file.');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' }
    });
    if (error) throw error;
  };

  const loginWithGithub = async () => {
    if (!supabase) throw new Error('Supabase Authentication is not configured.');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin + '/dashboard' }
    });
    if (error) throw error;
  };

  const loginWithLinkedin = async () => {
    if (!supabase) throw new Error('Supabase Authentication is not configured.');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: { redirectTo: window.location.origin + '/dashboard' }
    });
    if (error) throw error;
  };

  // Fix #4: signup now returns the user object so callers can redirect to /check-email
  const signup = async (email, password, fullName) => {
    const response = await apiClient.post(
      '/api/auth/signup',
      { email: email.trim().toLowerCase(), password, fullName: fullName.trim() },
      { skipAuthRefresh: true, skipRetry: true }
    );
    const payload = response || {};
    const { token, user } = payload;

    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(stripAuthToken(user)));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
    }

    return user || payload?.user || payload;
  };

  const logout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      const logoutResponse = await authFetch('/api/auth/logout', { method: 'POST' });
      if (!logoutResponse.ok) {
        console.warn('Session cookie cleanup failed:', logoutResponse.status);
      }
    } catch (err) {
      console.warn('Logout request failed:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };

  const refreshSession = () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    refreshPromiseRef.current = (async () => {
      let data = { session: null };
      let error = null;

      try {
        if (supabase) {
          const result = await supabase.auth.refreshSession();
          data = result.data;
          error = result.error;
        }

        if (!error && data?.session) {
          const token = data.session.access_token;
          localStorage.setItem('token', token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(prev => prev ? { ...prev, access_token: token } : prev);
          return true;
        }

        try {
          const response = await apiClient.post(
            '/api/auth/refresh',
            {},
            { skipAuthRefresh: true, skipRetry: true }
          );
          const { token } = response;
          localStorage.setItem('token', token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(prev => prev ? { ...prev, access_token: token } : prev);
          return true;
        } catch {
          logout();
          return false;
        }
      } catch (err) {
        console.error('Refresh session failed:', err);
        logout();
        return false;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  };

  // Fix #9: keep ref in sync so the interceptor always has the latest function
  refreshSessionRef.current = refreshSession;

  const isAdmin = user?.role === 'admin';

  const getAuthHeaders = useCallback((extraHeaders = {}) => {
    return mergeAuthHeaders(extraHeaders, user);
  }, [user]);

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
          (supabase || localStorage.getItem('refreshToken'))
        ) {
          originalRequest._retry = true;
          const refreshed = await refreshSessionRef.current();
          if (refreshed) {
            const freshToken = localStorage.getItem('token');
            if (freshToken) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers['Authorization'] = `Bearer ${freshToken}`;
            }
            return axios(originalRequest);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []); // safe — uses ref, no stale closure

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshSession, getAuthHeaders, loginWithGoogle, loginWithGithub, loginWithLinkedin, isAdmin }}>
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