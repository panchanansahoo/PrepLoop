import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

/**
 * Signup Page Component with Email Verification
 * 
 * After signup, users receive an email with a verification link.
 * They must verify their email before they can login.
 */
export default function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field once user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSignupSuccess(true);
        setSignupEmail(formData.email);
      } else {
        setErrors({ 
          submit: data.error || 'Signup failed. Please try again.' 
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ 
        submit: 'An error occurred. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Success Message After Signup
  if (signupSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
        <div className="max-w-md w-full">
          <div className="text-center">
            {/* Success Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
              <svg className="w-8 h-8 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">Account Created!</h1>
            <p className="text-slate-300 mb-6">
              We've sent a verification email to <span className="font-medium text-white">{signupEmail}</span>
            </p>

            {/* Steps */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 mb-6 text-left">
              <h2 className="text-white font-semibold mb-4">Next steps:</h2>
              <ol className="space-y-3 text-slate-300 text-sm">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center mr-3 text-xs font-bold">1</span>
                  <span>Check your email inbox</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center mr-3 text-xs font-bold">2</span>
                  <span>Click the verification link in the email</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center mr-3 text-xs font-bold">3</span>
                  <span>Return here and login to your account</span>
                </li>
              </ol>
              <p className="text-slate-500 text-xs mt-4">
                📧 If you don't see the email, check your spam folder
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg text-white font-medium transition transform hover:scale-105"
              >
                Go to Login
              </Link>
              <button
                onClick={() => setSignupSuccess(false)}
                className="block w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition"
              >
                Back to Signup
              </button>
            </div>

            {/* Help Text */}
            <p className="text-slate-500 text-xs mt-6">
              Having trouble?{' '}
              <Link to="/help" className="text-purple-400 hover:text-purple-300 transition">
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Signup Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-slate-400">Join PrepLoop and start your journey</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className={`w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                errors.full_name ? 'border-red-500' : ''
              }`}
              placeholder="John Doe"
              disabled={loading}
            />
            {errors.full_name && (
              <p className="text-red-400 text-sm mt-1">{errors.full_name}</p>
            )}
          </div>

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
              className={`w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                errors.email ? 'border-red-500' : ''
              }`}
              placeholder="you@example.com"
              disabled={loading}
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                errors.password ? 'border-red-500' : ''
              }`}
              placeholder="••••••••"
              disabled={loading}
            />
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${
                errors.confirmPassword ? 'border-red-500' : ''
              }`}
              placeholder="••••••••"
              disabled={loading}
            />
            {errors.confirmPassword && (
              <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Email Verification Notice */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-blue-300 text-xs flex items-start">
              <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
              </svg>
              <span>We'll send you a verification email to confirm your account</span>
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-purple-600/50 disabled:to-purple-700/50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition transform hover:scale-105 mt-6"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-slate-400 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-400 hover:text-purple-300 transition font-medium">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
