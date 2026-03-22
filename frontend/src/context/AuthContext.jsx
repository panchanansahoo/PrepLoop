import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // 1. Check for Supabase session (primary auth source)
        if (supabase) {
          const { data: { session }, error } = await supabase.auth.getSession();

          if (session) {
            const token = session.access_token;
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', session.refresh_token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            try {
              // Fetch profile from backend to get role
              const response = await axios.get('/api/user/profile');
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
              console.error("Profile sync error", err);
              // Fallback without role
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
            // Supabase session found — skip localStorage fallback to avoid overwriting
            return;
          }
        }

        // 2. Restore from localStorage (ONLY if no Supabase session exists)
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        const isGuest = localStorage.getItem('isGuest');

        if (token && userData) {
          if (mounted) {
            setUser(JSON.parse(userData));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          }
        } else if (isGuest === 'true') {
          if (mounted) {
            setUser({
              id: 'guest',
              fullName: 'Guest User',
              email: 'guest@careerloop.io',
              isGuest: true,
              role: 'user'
            });
          }
        }

      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('isGuest');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Set up listener
    let subscription = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session) {
          // ... logic to update user ...
          const token = session.access_token;
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', session.refresh_token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          try {
            const response = await axios.get('/api/user/profile');
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
            // Fallback
            const u = {
              id: session.user.id,
              email: session.user.email,
              fullName: session.user.user_metadata.full_name,
              role: 'user'
            };
            if (mounted) setUser(u);
          }
        } else if (event === 'SIGNED_OUT') {
          if (mounted) {
            setUser(null);
            localStorage.removeItem('token');
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
    const response = await axios.post('/api/auth/login', { email, password });
    const { token, refreshToken, user } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);

    return user;
  };

  /* Social Logins */
  const loginWithGoogle = async () => {
    if (!supabase) {
      console.error('Supabase client is not initialized. Check your environment variables.');
      throw new Error('Supabase Authentication is not configured. Please check your .env file.');
    }
    const redirectTo = window.location.origin + '/dashboard';
    console.log('Attempting Google login with redirect to:', redirectTo);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo
      }
    });

    if (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const loginWithGithub = async () => {
    if (!supabase) {
      console.error('Supabase client is not initialized. Check your environment variables.');
      return;
    }
    const redirectTo = window.location.origin + '/dashboard';
    console.log('Attempting GitHub login with redirect to:', redirectTo);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: redirectTo
      }
    });

    if (error) {
      console.error('GitHub login error:', error);
      throw error;
    }
  };

  const loginWithLinkedin = async () => {
    if (!supabase) {
      console.error('Supabase client is not initialized. Check your environment variables.');
      return;
    }
    const redirectTo = window.location.origin + '/dashboard';
    console.log('Attempting LinkedIn login with redirect to:', redirectTo);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc', // Using OIDC as it is the current standard
      options: {
        redirectTo: redirectTo
      }
    });

    if (error) {
      console.error('LinkedIn login error:', error);
      throw error;
    }
  };

  const signup = async (email, password, fullName) => {
    const response = await axios.post('/api/auth/signup', { email, password, fullName });
    const { token, refreshToken, user } = response.data;

    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setUser(user);

    return user;
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isGuest');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const loginAsGuest = () => {
    const guestUser = {
      id: 'guest',
      fullName: 'Guest User',
      email: 'guest@careerloop.io',
      isGuest: true,
      role: 'user'
    };
    setUser(guestUser);
    localStorage.setItem('isGuest', 'true');
    // Clear any potential leftover real auth data to avoid confusion
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  const refreshSession = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    // First try Supabase refresh if it's a supabase session
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

    // Fallback to custom backend refresh
    try {
      const response = await axios.post('/api/auth/refresh', { refreshToken });
      const { token, refreshToken: newRefreshToken } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', newRefreshToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return true;
    } catch (error) {
      logout();
      return false;
    }
  };

  // Derived helper
  const isAdmin = user?.role === 'admin';

  // Set up axios interceptor for token refresh on 401/403
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        if (
          (error.response?.status === 401 || error.response?.status === 403) &&
          !originalRequest._retry &&
          localStorage.getItem('refreshToken')
        ) {
          originalRequest._retry = true;
          const refreshed = await refreshSession();
          if (refreshed) {
            originalRequest.headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
            return axios(originalRequest);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, refreshSession, loginAsGuest, loginWithGoogle, loginWithGithub, loginWithLinkedin, isAdmin }}>
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
