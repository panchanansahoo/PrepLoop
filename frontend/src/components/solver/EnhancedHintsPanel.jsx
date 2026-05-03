/**
 * Enhanced Hints Panel - Phase 1.1 Integration with Backend Hint API
 * Integrates with HintService backend API for progressive hint disclosure
 * Features: First-free hints, 5-minute cooldown, cooldown timer display
 */

import { useState, useEffect, useRef } from 'react';
import { Lightbulb, Lock, Unlock, AlertTriangle, Hourglass, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../../utils/apiFetch';

const HINT_TYPES = {
  approach: {
    label: 'Approach Hint',
    description: 'General algorithm strategy',
    icon: '🧠',
  },
  code: {
    label: 'Code Hint',
    description: 'Specific implementation pattern',
    icon: '💻',
  },
  edge_case: {
    label: 'Edge Case Hint',
    description: 'Edge cases to watch out for',
    icon: '⚠️',
  },
};

export default function EnhancedHintsPanel({
  problemId,
  code = '',
  language = 'python',
  onHintRevealed = () => {},
}) {
  const [hintStates, setHintStates] = useState({
    approach: { canReveal: true, revealedText: null, cooldownRemaining: 0, firstReveal: true },
    code: { canReveal: true, revealedText: null, cooldownRemaining: 0, firstReveal: true },
    edge_case: { canReveal: true, revealedText: null, cooldownRemaining: 0, firstReveal: true },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const cooldownTimers = useRef({});

  // Fetch user's hint statistics on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiFetch('/api/dsa/hints/stats/user', { method: 'GET' });
        setStats(response.stats);
      } catch (err) {
        console.warn('Failed to fetch hint stats:', err.message);
        // Non-blocking error - user can still use hints
      }
    };

    fetchStats();
  }, []);

  // Start cooldown timer for a hint type
  const startCooldownTimer = (hintType, remainingSeconds) => {
    if (cooldownTimers.current[hintType]) {
      clearInterval(cooldownTimers.current[hintType]);
    }

    let remaining = remainingSeconds;
    setHintStates((prev) => ({
      ...prev,
      [hintType]: { ...prev[hintType], cooldownRemaining: remaining },
    }));

    cooldownTimers.current[hintType] = setInterval(() => {
      remaining--;
      setHintStates((prev) => ({
        ...prev,
        [hintType]: { ...prev[hintType], cooldownRemaining: remaining },
      }));

      if (remaining <= 0) {
        clearInterval(cooldownTimers.current[hintType]);
        setHintStates((prev) => ({
          ...prev,
          [hintType]: { ...prev[hintType], canReveal: true, cooldownRemaining: 0 },
        }));
      }
    }, 1000);
  };

  // Reveal hint via backend API
  const revealHint = async (hintType) => {
    if (!problemId) {
      setError('Problem ID is required');
      return;
    }

    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/dsa/hints/${problemId}?hint_type=${hintType}`, {
        method: 'GET',
      });

      const { hint } = response;

      if (hint.can_reveal) {
        setHintStates((prev) => ({
          ...prev,
          [hintType]: {
            canReveal: false,
            revealedText: hint.hint_text || 'No hint available',
            cooldownRemaining: 0,
            firstReveal: hint.first_reveal,
          },
        }));

        // Start cooldown countdown
        startCooldownTimer(hintType, 300); // 5 minutes = 300 seconds

        // Callback to parent
        onHintRevealed({
          hintType,
          hintText: hint.hint_text,
          firstReveal: hint.first_reveal,
        });
      } else {
        // Cooldown active
        setHintStates((prev) => ({
          ...prev,
          [hintType]: {
            ...prev[hintType],
            canReveal: false,
            cooldownRemaining: hint.cooldown_remaining_seconds,
          },
        }));

        startCooldownTimer(hintType, hint.cooldown_remaining_seconds);
        setError(`Hint available again in ${formatTime(hint.cooldown_remaining_seconds)}`);
      }
    } catch (err) {
      console.error('Error revealing hint:', err);
      setError(
        err.response?.data?.error || err.message || 'Failed to reveal hint. Try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCooldownDisplay = (hintType) => {
    const remaining = hintStates[hintType].cooldownRemaining;
    if (remaining <= 0) return null;
    return `${formatTime(remaining)}`;
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-4 shadow-xl">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Progressive Hints</h3>
          {stats && (
            <span className="ml-auto text-sm text-slate-400">
              {stats.total_hints_revealed} hints revealed
            </span>
          )}
        </div>
        <p className="text-sm text-slate-400">
          💡 First hint is free. Subsequent hints have a 5-minute cooldown.
        </p>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        {Object.entries(HINT_TYPES).map(([hintType, hintInfo]) => {
          const state = hintStates[hintType];
          const cooldownDisplay = formatCooldownDisplay(hintType);
          const isRevealed = state.revealedText !== null;

          return (
            <div key={hintType} className="bg-slate-700 rounded border border-slate-600 overflow-hidden">
              {/* Header */}
              <button
                onClick={() => !isRevealed && revealHint(hintType)}
                disabled={loading || !state.canReveal}
                className={`w-full p-3 flex items-center gap-3 justify-between transition-colors ${
                  isRevealed
                    ? 'bg-slate-700 cursor-default'
                    : state.canReveal
                      ? 'hover:bg-slate-600 cursor-pointer'
                      : 'bg-slate-700/50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-xl">{hintInfo.icon}</span>
                  <div className="text-left">
                    <p className="font-medium text-white text-sm">{hintInfo.label}</p>
                    <p className="text-xs text-slate-400">{hintInfo.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isRevealed && <CheckCircle2 className="w-4 h-4 text-green-400" />}

                  {cooldownDisplay && (
                    <div className="flex items-center gap-1 text-yellow-400 text-xs font-mono">
                      <Hourglass className="w-3 h-3" />
                      {cooldownDisplay}
                    </div>
                  )}

                  {!isRevealed && state.canReveal && (
                    <Unlock className="w-4 h-4 text-green-400" />
                  )}
                  {!isRevealed && !state.canReveal && (
                    <Lock className="w-4 h-4 text-red-400" />
                  )}
                </div>
              </button>

              {/* Hint Text */}
              {isRevealed && state.revealedText && (
                <div className="px-3 pb-3 bg-slate-800/50 border-t border-slate-600">
                  <div className="text-sm text-slate-300 leading-relaxed">
                    {state.revealedText}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {state.firstReveal ? '✨ First reveal (free)' : '🔄 Cooldown active after use'}
                  </div>
                </div>
              )}

              {/* Cooldown Message */}
              {!isRevealed && !state.canReveal && (
                <div className="px-3 pb-3 bg-slate-800/50 border-t border-slate-600">
                  <p className="text-xs text-slate-400">
                    ⏳ Hint available again in {cooldownDisplay}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-700 text-xs text-slate-500">
        <p>
          💡 <strong>Tip:</strong> Use hints strategically! Hints help you learn faster while still
          challenging you to think independently.
        </p>
      </div>
    </div>
  );
}
