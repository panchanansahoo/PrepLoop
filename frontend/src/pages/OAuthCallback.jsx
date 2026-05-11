import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Completing sign-in...');
  const [hasError, setHasError] = useState(false);

  const nextPath = useMemo(() => {
    const candidate = searchParams.get('next') || '/dashboard';
    return candidate.startsWith('/') ? candidate : '/dashboard';
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    const finalize = async () => {
      if (!supabase) {
        if (!active) return;
        setHasError(true);
        setMessage('Auth is not configured in this environment.');
        return;
      }

      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error) {
        setHasError(true);
        setMessage(error.message || 'OAuth sign-in failed.');
        return;
      }

      if (data?.session) {
        navigate(nextPath, { replace: true });
        return;
      }

      setHasError(true);
      setMessage('No active session was created. Please sign in again.');
    };

    const timer = window.setTimeout(() => {
      void finalize();
    }, 150);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [navigate, nextPath]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030308] px-4">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white">
        {hasError ? (
          <>
            <AlertCircle className="mx-auto mb-4 text-red-400" size={40} />
            <h1 className="text-2xl font-bold mb-2">Sign-in failed</h1>
            <p className="text-sm text-white/70">{message}</p>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto mb-4 animate-spin text-indigo-400" size={40} />
            <h1 className="text-2xl font-bold mb-2">Signing you in</h1>
            <p className="text-sm text-white/70">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
