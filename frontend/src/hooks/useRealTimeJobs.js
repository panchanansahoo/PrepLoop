import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../utils/apiFetch';

export function useRealTimeJobs(query = 'software developer', options = {}) {
  const {
    enabled = true,
    pollInterval = 300000, // 5 minutes
    useWebSocket = false
  } = options;

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const wsRef = useRef(null);
  const pollTimerRef = useRef(null);
  // Use a ref so the polling callback never goes stale
  const lastUpdateRef = useRef(null);

  // Fetch jobs via centralized API client (auto-injects auth + retries)
  const fetchJobs = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ query });
      if (lastUpdateRef.current) {
        params.set('lastUpdate', lastUpdateRef.current.toISOString());
      }

      const data = await apiFetch.get(`/api/jobs/live?${params}`, { signal });

      if (data.hasUpdates && data.jobs.length > 0) {
        const ts = new Date(data.timestamp);
        setJobs(data.jobs);
        setLastUpdate(ts);
        lastUpdateRef.current = ts;
      }

      setLoading(false);
    } catch (err) {
      // Ignore cancellations from unmount / AbortController
      if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
      console.error('Failed to fetch jobs:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [query]); // lastUpdate removed — use ref instead to avoid infinite loop

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!useWebSocket || wsRef.current) return;

    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
      const wsUrl = API_URL.replace('http', 'ws');
      const ws = new WebSocket(`${wsUrl}/jobs`);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'subscribe', query }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'job_update' && data.jobs) {
            const ts = new Date(data.timestamp);
            setJobs(data.jobs);
            setLastUpdate(ts);
            lastUpdateRef.current = ts;
            setLoading(false);
          } else if (data.type === 'error') {
            setError(data.message);
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };

      ws.onerror = () => {
        setError('WebSocket connection failed');
      };

      ws.onclose = () => {
        wsRef.current = null;
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('WebSocket setup error:', err);
    }
  }, [useWebSocket, query]);

  // Initialize
  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    if (useWebSocket) {
      connectWebSocket();
    } else {
      // Initial fetch
      fetchJobs(controller.signal);

      // Start polling
      pollTimerRef.current = setInterval(() => {
        fetchJobs(controller.signal);
      }, pollInterval);
    }

    return () => {
      controller.abort();
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled, useWebSocket, connectWebSocket, fetchJobs, pollInterval]);

  // Refresh manually
  const refresh = useCallback(() => {
    if (useWebSocket && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', query }));
    } else {
      fetchJobs();
    }
  }, [useWebSocket, query, fetchJobs]);

  return {
    jobs,
    loading,
    error,
    lastUpdate,
    refresh,
    isConnected: useWebSocket ? wsRef.current?.readyState === WebSocket.OPEN : true
  };
}

// Hook for fetching jobs with filters
export function useJobs(filters = {}) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  // Serialize filters to a stable string so the effect doesn't infinite-loop on object identity
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);

        const parsed = JSON.parse(filtersKey);
        const params = new URLSearchParams({
          page: parsed.page || 1,
          limit: parsed.limit || 20,
          ...(parsed.search && { search: parsed.search }),
          ...(parsed.category && { category: parsed.category }),
          ...(parsed.type && { type: parsed.type }),
          ...(parsed.company && { company: parsed.company }),
          ...(parsed.source && { source: parsed.source })
        });

        const data = await apiFetch.get(`/api/jobs?${params}`, { signal: controller.signal });

        if (!cancelled) {
          setJobs(data.jobs || []);
          setPagination({
            page: data.page || 1,
            totalPages: data.totalPages || 1,
            total: data.total || 0
          });
          setLoading(false);
        }
      } catch (err) {
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
        console.error('Failed to fetch jobs:', err);
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchJobs();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [filtersKey]);

  const refresh = useCallback(() => {
    // Force re-run by resetting state — the effect will re-trigger via filtersKey
    setLoading(true);
    setError(null);
  }, []);

  return {
    jobs,
    loading,
    error,
    pagination,
    refresh
  };
}
