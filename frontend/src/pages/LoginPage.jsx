import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Adjust path based on your auth context

/**
 * Login Page Component with Email Verification Check
 * 
 * Handles:
 * - Email/password login
 * - Email verification requirement check
 * - Resend verification email option if email not verified
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    setEmailNotVerified(false);

    // Basic validation
    if (!formData.email || !formData.password) {
      setErrors({
        submit: 'Please enter both email and password'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful
        if (login) {
          login(data.token);
        } else {
          // If no auth context, store token manually
          localStorage.setItem('authToken', data.token);
        }
        navigate('/dashboard');
      } else if (response.status === 403) {
        // Email not verified error
        if (data.error === 'Please verify your email before logging in') {
          setEmailNotVerified(true);
          setUnverifiedEmail(formData.email);
          setResendMessage('');
        } else {
          setErrors({ submit: data.error || 'Login failed' });
        }
      } else {
        // Other login errors
        setErrors({
          submit: data.error || 'Invalid email or password'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        submit: 'An error occurred. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail || resendLoading) return;

    setResendLoading(true);
    setResendMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: unverifiedEmail })
      });

      const data = await response.json();

      if (response.ok) {
        setResendMessage('Verification email sent! Check your inbox.');
      } else {
        setResendMessage(data.error || 'Failed to resend email. Please try again.');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setResendMessage('Failed to resend email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // Email Not Verified State
  if (emailNotVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
        <div className="max-w-md w-full">
          <div className="text-center">
            {/* Warning Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 mb-6">
              <svg className="w-8 h-8 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">Email Not Verified</h1>
            <p className="text-slate-300 mb-6">
              Please verify your email address before logging in.
            </p>

            {/* Email Display */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 mb-6">
              <p className="text-slate-400 text-sm mb-2">Email address:</p>
              <p className="text-white font-medium break-all">{unverifiedEmail}</p>
            </div>

            {/* Resend Message */}
            {resendMessage && (
              <div className={`rounded-lg p-3 mb-4 ${
                resendMessage.includes('sent') 
                  ? 'bg-emerald-500/10 border border-emerald-500/30' 
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <p className={`text-sm ${
                  resendMessage.includes('sent') 
                    ? 'text-emerald-300' 
                    : 'text-red-300'
                }`}>
                  {resendMessage}
                </p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6 text-left">
              <h3 className="text-blue-300 font-semibold text-sm mb-2">What to do:</h3>
              <ol className="space-y-2 text-blue-300/80 text-xs">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>Check your email for a verification link from PrepLoop</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>Click the link to verify your email</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>Return here and try logging in again</span>
                </li>
              </ol>
              <p className="text-blue-300/60 text-xs mt-3">
                💡 Tip: Check your spam folder if you don't see the email
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition transform hover:scale-105"
              >
                {resendLoading ? 'Sending...' : 'Resend Verification Email'}
              </button>
              <button
                onClick={() => setEmailNotVerified(false)}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition"
              >
                Back to Login
              </button>
            </div>

            {/* Help */}
            <p className="text-slate-500 text-xs mt-6">
              Still having trouble?{' '}
              <Link to="/help" className="text-purple-400 hover:text-purple-300 transition">
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Login Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">Login to your PrepLoop account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              placeholder="you@example.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-200">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-purple-400 hover:text-purple-300 transition"
              >
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              placeholder="••••••••"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-purple-600/50 disabled:to-purple-700/50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition transform hover:scale-105 mt-6"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Signup Link */}
        <p className="text-center text-slate-400 text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-purple-400 hover:text-purple-300 transition font-medium">
            Sign up here
          </Link>
        </p>

        {/* Security Badge */}
        <div className="flex items-center justify-center mt-8 text-slate-500 text-xs">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Your account is secure with email verification</span>
        </div>
      </div>
    </div>
  );
}
