import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Gift, Users } from 'lucide-react';
import { authFetch } from '../utils/authFetch';
import { buildApiUrl } from '../utils/safeApiUrl';
import { API_URL } from '../config/api.js';

export default function ReferralPanel() {
  const [summary, setSummary] = useState(null);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);

  useEffect(() => () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadReferral() {
      try {
        const url = buildApiUrl('/coins/referral', { rawBaseUrl: API_URL, apiPrefix: '/api' });
        const res = await authFetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setSummary(data);
      } catch {
        // Ignore offline/unauthenticated
      }
    }
    loadReferral();
    return () => {
      cancelled = true;
    };
  }, []);

  const referralUrl = summary?.referralUrl || 'https://preploop.io/ref/PREPLOOP';

  function handleCopy() {
    navigator.clipboard?.writeText(referralUrl).catch(() => {});
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-slate-900/80 p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Gift className="w-4 h-4 text-amber-400" />
          Refer Friends, Earn 500 Coins
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-amber-300 font-medium">
          <Users className="w-3.5 h-3.5" />
          {summary?.rewardedCount ?? 0} rewarded
        </span>
      </div>
      <p className="text-xs text-slate-400">
        Share your referral link. You earn 500 coins when your friend completes their first paid interview!
      </p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={referralUrl}
          aria-label="Your referral link"
          className="flex-1 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-slate-200"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
