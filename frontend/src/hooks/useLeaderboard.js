import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiFetch';

export function useLeaderboard(type = 'weekly') {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch.get(`/api/leaderboard?type=${type}&limit=10`)
      .then(d => setLeaderboard(d.leaderboard || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [type]);

  return { leaderboard, loading };
}

export function useUserStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch.get('/api/leaderboard/stats')
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading };
}
