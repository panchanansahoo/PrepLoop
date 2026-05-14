import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, MailCheck, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';

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
  const [status, setStatus] = useState('verifying'); // verifying, success, error, info
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
          setMessage(data.message || 'Your email has been successfully verified.');
          // Redirect to login after 4 seconds
          setTimeout(() => navigate('/login'), 4000);
        } else {
          setStatus('error');
          setMessage(data.error || 'We couldn\'t verify your email. The link may have expired.');
          setCanResend(true);
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('Something went wrong during verification. Please try resending the verification email.');
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
        setMessage(data.error || 'We couldn\'t send the verification email. Please try again shortly.');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setMessage('We\'re having trouble sending the email right now. Please try again in a moment.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#030303] overflow-hidden p-4">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50rem] h-[50rem] bg-emerald-500/10 rounded-full mix-blend-screen filter blur-[150px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-panel rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center transform transition-all duration-500 hover:scale-[1.01]">
          
          {/* Verifying State */}
          {status === 'verifying' && (
            <div className="flex flex-col items-center w-full transition-opacity duration-500">
              <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6 group">
                <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping"></div>
                <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
              </div>
              <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Verifying Email</h1>
              <p className="text-zinc-400 text-lg">{message}</p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="flex flex-col items-center w-full transition-opacity duration-500">
              <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse"></div>
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Email Verified!</h1>
              <p className="text-zinc-400 text-lg mb-8">{message}</p>
              
              <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 mb-8 flex items-center justify-center space-x-3">
                <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                <span className="text-zinc-300 font-medium tracking-wide">Redirecting to login...</span>
              </div>

              <Link
                to="/login"
                className="group relative flex w-full justify-center items-center px-4 py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-all focus:outline-none focus:ring-2 focus:ring-white/50 active:scale-95"
              >
                Go to Login manually
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="flex flex-col items-center w-full transition-opacity duration-500">
              <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
                <div className="absolute inset-0 rounded-full bg-red-500/10 animate-pulse"></div>
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Verification Failed</h1>
              <p className="text-zinc-400 text-lg mb-8">{message}</p>

              <div className="w-full space-y-4">
                {canResend && email && (
                  <button
                    onClick={handleResendEmail}
                    disabled={resendLoading}
                    className="group relative flex w-full justify-center items-center px-4 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500/50 active:scale-95"
                  >
                    {resendLoading ? (
                      <>
                        <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 w-5 h-5 group-hover:-rotate-180 transition-transform duration-500" />
                        Resend Verification Email
                      </>
                    )}
                  </button>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Link
                    to="/signup"
                    className="flex justify-center items-center px-4 py-3.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors border border-white/5 hover:border-white/10 active:scale-95"
                  >
                    Back to Signup
                  </Link>
                  <Link
                    to="/login"
                    className="flex justify-center items-center px-4 py-3.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors border border-white/5 hover:border-white/10 active:scale-95"
                  >
                    Go to Login
                  </Link>
                </div>
              </div>

              {email && !canResend && (
                <div className="mt-6 inline-flex items-center justify-center bg-white/5 border border-white/10 py-2.5 px-5 rounded-full">
                  <AlertCircle className="w-4 h-4 mr-2 text-zinc-400" />
                  <span className="text-zinc-400 text-sm font-medium">Please wait before requesting again</span>
                </div>
              )}
            </div>
          )}

          {/* Info State (Resent) */}
          {status === 'info' && (
            <div className="flex flex-col items-center w-full transition-opacity duration-500">
              <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6 text-blue-400">
                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse"></div>
                <MailCheck className="w-10 h-10" />
              </div>
              <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Check Your Inbox</h1>
              <p className="text-zinc-400 text-lg mb-8">{message}</p>
              
              <Link
                to="/login"
                className="group flex w-full justify-center items-center px-4 py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                Go to Login
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}

        </div>

        {/* Footer Help Text */}
        <div className="mt-8 text-center text-zinc-500 text-sm">
          <p className="flex items-center justify-center">
            <span className="mr-2">Having trouble?</span>
            <Link to="/help" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium hover:underline underline-offset-4">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
