import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';

/**
 * Email Verification Page Component
 * 
 * This page handles email verification after signup.
 * Users are redirected here by clicking the link in their verification email.
 * 
 * URL format: /verify-email?token=<token>&email=<email>
 */
export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your email...');
  const [email, setEmail] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const emailParam = searchParams.get('email');

      if (!token || !emailParam) {
        setStatus('error');
        setMessage('Invalid verification link. Please check the URL from your email.');
        setEmail(emailParam || '');
        return;
      }

      setEmail(emailParam);

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email: emailParam })
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
          // Redirect to login after 3 seconds
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to verify email');
          setCanResend(true);
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('Failed to verify email. Please try again or resend the verification email.');
        setCanResend(true);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  const handleResendEmail = async () => {
    if (!email || resendLoading) return;

    setResendLoading(true);
    try {
      const response = await fetch('/api/auth/resend-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('info');
        setMessage('Verification email sent! Check your inbox.');
        setCanResend(false);
        // Re-enable resend after 60 seconds
        setTimeout(() => setCanResend(true), 60000);
      } else {
        setMessage(data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setMessage('Failed to resend verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4">
      <div className="max-w-md w-full">
        {/* Verifying State */}
        {status === 'verifying' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 mb-6">
              <div className="animate-spin">
                <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-500 rounded-full"></div>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Verifying Email</h1>
            <p className="text-slate-400">{message}</p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
              <svg className="w-8 h-8 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
            <p className="text-slate-300 mb-6">{message}</p>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 mb-6">
              <p className="text-slate-400 text-sm">Redirecting to login page...</p>
            </div>
            <Link
              to="/login"
              className="inline-block w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg text-white font-medium transition transform hover:scale-105"
            >
              Go to Login
            </Link>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 mb-6">
              <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
            <p className="text-slate-300 mb-6">{message}</p>

            <div className="space-y-3">
              {canResend && email && (
                <button
                  onClick={handleResendEmail}
                  disabled={resendLoading}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition transform hover:scale-105"
                >
                  {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                </button>
              )}

              <Link
                to="/signup"
                className="block w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition text-center"
              >
                Back to Signup
              </Link>

              <Link
                to="/login"
                className="block w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white font-medium transition text-center"
              >
                Go to Login
              </Link>
            </div>

            {email && !canResend && (
              <p className="text-slate-500 text-sm mt-4">
                Please wait before requesting another verification email
              </p>
            )}
          </div>
        )}

        {/* Info State */}
        {status === 'info' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 mb-6">
              <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Check Your Email</h1>
            <p className="text-slate-300 mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-block w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg text-white font-medium transition transform hover:scale-105"
            >
              Back to Login
            </Link>
          </div>
        )}

        {/* Footer Help Text */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>
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
