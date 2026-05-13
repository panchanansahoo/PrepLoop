import React, { useEffect, useMemo, useState } from 'react';
import { Crown, Medal, Trophy, Flame, RefreshCw } from 'lucide-react';
import { buildAuthHeaders } from '../../utils/authHeaders';

import { API_URL as rawApiUrl } from '../../utils/safeApiUrl';
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl.slice(0, -4) : rawApiUrl.replace(/\/$/, '');

const TOP_COLORS = ['#fbbf24', '#c0c0c0', '#cd7f32'];

function rankIcon(rank) {
  if (rank === 1) return <Crown size={14} color={TOP_COLORS[0]} />;
  if (rank === 2) return <Medal size={14} color={TOP_COLORS[1]} />;
  if (rank === 3) return <Medal size={14} color={TOP_COLORS[2]} />;
  return <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>#{rank}</span>;
}

export function ProblemExplorerLeaderboard({ isLight }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaderboard = async (signal) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/user/problem-leaderboard?limit=8`, {
        headers: buildAuthHeaders(),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Leaderboard request failed (${response.status})`);
      }

      const data = await response.json();
      setLeaderboard(Array.isArray(data?.leaderboard) ? data.leaderboard : []);
      setCurrentUserRank(Number.isFinite(data?.currentUserRank) ? data.currentUserRank : null);
    } catch (fetchError) {
      if (fetchError?.name === 'AbortError') return;
      setError('Could not load leaderboard right now.');
      setLeaderboard([]);
      setCurrentUserRank(null);
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  const handleRefresh = () => {
    fetchLeaderboard();
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchLeaderboard(controller.signal);
    return () => controller.abort();
  }, []);

  const hasEntries = leaderboard.length > 0;

  const subtitle = useMemo(() => {
    if (currentUserRank) return `You are ranked #${currentUserRank} globally`;
    if (hasEntries) return 'Top solvers ranked by solved count and streak';
    return 'Solve a problem to enter the leaderboard';
  }, [currentUserRank, hasEntries]);

  return (
    <div
      style={{
        height: '100%',
        borderRadius: 20,
        background: isLight
          ? 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.95))'
          : 'linear-gradient(135deg, rgba(15,15,25,0.8), rgba(20,20,35,0.6))',
        border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Trophy size={16} color="#fbbf24" />
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em' }}>Problem Explorer Leaderboard</span>
          </div>
          <div style={{ fontSize: 11, color: isLight ? '#64748b' : 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{subtitle}</div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          style={{
            borderRadius: 9,
            border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.12)',
            background: 'transparent',
            color: isLight ? '#475569' : 'rgba(255,255,255,0.7)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 9px',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {isLoading && (
        <div style={{ fontSize: 12, color: isLight ? '#64748b' : 'rgba(255,255,255,0.45)' }}>Loading leaderboard...</div>
      )}

      {!isLoading && error && (
        <div style={{ fontSize: 12, color: '#f87171' }}>{error}</div>
      )}

      {!isLoading && !error && !hasEntries && (
        <div style={{ fontSize: 12, color: isLight ? '#64748b' : 'rgba(255,255,255,0.45)' }}>
          No leaderboard entries yet.
        </div>
      )}

      {!isLoading && !error && hasEntries && (
        <div style={{ display: 'grid', gap: 6 }}>
          {leaderboard.map((entry) => {
            const top3 = entry.rank <= 3;
            return (
              <div
                key={`${entry.userId}-${entry.rank}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '44px 1fr 64px 64px',
                  alignItems: 'center',
                  gap: 8,
                  borderRadius: 10,
                  padding: '8px 10px',
                  background: top3
                    ? `${TOP_COLORS[entry.rank - 1]}10`
                    : isLight
                      ? 'rgba(0,0,0,0.02)'
                      : 'rgba(255,255,255,0.03)',
                  border: top3
                    ? `1px solid ${TOP_COLORS[entry.rank - 1]}35`
                    : isLight
                      ? '1px solid rgba(0,0,0,0.04)'
                      : '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{rankIcon(entry.rank)}</div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: isLight ? '#0f172a' : '#f8fafc',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={entry.name}
                  >
                    {entry.name}
                  </div>
                  <div style={{ fontSize: 10, color: isLight ? '#64748b' : 'rgba(255,255,255,0.4)' }}>{entry.coins || 0} coins</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#6ee7b7' }}>{entry.solved}</div>
                  <div style={{ fontSize: 9, color: isLight ? '#94a3b8' : 'rgba(255,255,255,0.35)' }}>solved</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 800, color: '#f59e0b' }}>
                    <Flame size={11} />
                    {entry.streak}
                  </div>
                  <div style={{ fontSize: 9, color: isLight ? '#94a3b8' : 'rgba(255,255,255,0.35)' }}>streak</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
