import React, { useState, useEffect } from 'react';
import { Flame, X, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function StreakNotification() {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    checkStreak();
  }, [user]);

  const checkStreak = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/streak/check`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStreakData(data);
        if (data.isNewDay) {
          setVisible(true);
          // Request browser notification permission
          requestNotification(data);
          // Auto-dismiss after 8 seconds
          setTimeout(() => setVisible(false), 8000);
        }
      }
    } catch (err) {
      console.error('Failed to check streak:', err);
    }
  };

  const requestNotification = (data) => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showBrowserNotification(data);
        }
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      showBrowserNotification(data);
    }
  };

  const showBrowserNotification = (data) => {
    try {
      new Notification('🔥 PrepLoop Streak!', {
        body: data.streakBroken
          ? 'Your streak was reset. Start a new one today!'
          : `Day ${data.streak}! ${data.bonusCoins > 0 ? `+${data.bonusCoins} bonus coins!` : 'Keep it up!'}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    } catch (err) {
      // Browser notifications not supported
    }
  };

  if (!visible || dismissed || !streakData) return null;

  const isNewBest = streakData.streak === streakData.bestStreak && streakData.streak > 1;

  return (
    <>
      <div className={`streak-toast ${streakData.streakBroken ? 'broken' : ''}`}>
        <div className="streak-toast-icon">
          {streakData.streakBroken ? '💔' : <Flame size={24} />}
        </div>
        <div className="streak-toast-content">
          <div className="streak-toast-title">
            {streakData.streakBroken
              ? 'Streak Reset!'
              : `🔥 Day ${streakData.streak} Streak!`}
            {isNewBest && (
              <span className="streak-best-badge">
                <Trophy size={12} /> New Best!
              </span>
            )}
          </div>
          <div className="streak-toast-subtitle">
            {streakData.streakBroken
              ? "No worries! Start fresh today."
              : streakData.bonusCoins > 0
                ? `+${streakData.bonusCoins} bonus coins earned! 🪙`
                : 'Keep practicing to build your streak!'}
          </div>
        </div>
        <button className="streak-toast-close" onClick={() => { setVisible(false); setDismissed(true); }}>
          <X size={14} />
        </button>
      </div>

      <style>{`
        .streak-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          background: linear-gradient(135deg, rgba(251, 146, 60, 0.12), rgba(239, 68, 68, 0.08));
          border: 1px solid rgba(251, 146, 60, 0.25);
          border-radius: 14px;
          backdrop-filter: blur(20px);
          box-shadow: 0 8px 32px rgba(251, 146, 60, 0.15);
          animation: streakSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          max-width: 380px;
        }
        .streak-toast.broken {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(220, 38, 38, 0.08));
          border-color: rgba(239, 68, 68, 0.25);
          box-shadow: 0 8px 32px rgba(239, 68, 68, 0.15);
        }
        @keyframes streakSlideIn {
          from { opacity: 0; transform: translateX(40px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        .streak-toast-icon {
          font-size: 24px;
          color: #fb923c;
          animation: streakFlame 1s ease-in-out infinite alternate;
        }
        .streak-toast.broken .streak-toast-icon {
          animation: none;
          color: #ef4444;
        }
        @keyframes streakFlame {
          from { transform: scale(1) rotate(-3deg); }
          to { transform: scale(1.1) rotate(3deg); }
        }
        .streak-toast-content {
          flex: 1;
        }
        .streak-toast-title {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-primary, #fff);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .streak-best-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 10px;
          background: rgba(251, 191, 36, 0.15);
          color: #fbbf24;
          font-weight: 500;
        }
        .streak-toast-subtitle {
          font-size: 12px;
          color: var(--text-secondary, #888);
          margin-top: 2px;
        }
        .streak-toast-close {
          background: none;
          border: none;
          color: var(--text-secondary, #888);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
        }
        .streak-toast-close:hover {
          background: rgba(255,255,255,0.06);
        }

        @media (max-width: 480px) {
          .streak-toast {
            right: 8px;
            left: 8px;
            max-width: none;
          }
        }
      `}</style>
    </>
  );
}
