import { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

  // Fetch jobs via REST API
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        query,
        ...(lastUpdate && { lastUpdate: lastUpdate.toISOString() })
      });

      const response = await fetch(`${API_URL}/api/jobs/live?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.hasUpdates && data.jobs.length > 0) {
        setJobs(data.jobs);
        setLastUpdate(new Date(data.timestamp));
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [query, lastUpdate]);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!useWebSocket || wsRef.current) return;

    try {
      const wsUrl = API_URL.replace('http', 'ws');
      const ws = new WebSocket(`${wsUrl}/jobs`);

      ws.onopen = () => {
        console.log('WebSocket connected for job updates');
        ws.send(JSON.stringify({ type: 'subscribe', query }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'job_update' && data.jobs) {
            setJobs(data.jobs);
            setLastUpdate(new Date(data.timestamp));
            setLoading(false);
          } else if (data.type === 'error') {
            setError(data.message);
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('WebSocket connection failed');
        // Fallback to polling
        startPolling();
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        wsRef.current = null;
        // Fallback to polling
        startPolling();
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('WebSocket setup error:', err);
      startPolling();
    }
  }, [useWebSocket, query]);

  // Polling mechanism
  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return;

    fetchJobs(); // Initial fetch

    pollTimerRef.current = setInterval(() => {
      fetchJobs();
    }, pollInterval);
  }, [fetchJobs, pollInterval]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // Initialize
  useEffect(() => {
    if (!enabled) return;

    if (useWebSocket) {
      connectWebSocket();
    } else {
      startPolling();
    }

    return () => {
      stopPolling();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled, useWebSocket, connectWebSocket, startPolling, stopPolling]);

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

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: filters.page || 1,
        limit: filters.limit || 20,
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.type && { type: filters.type }),
        ...(filters.company && { company: filters.company }),
        ...(filters.source && { source: filters.source })
      });

      const response = await fetch(`${API_URL}/api/jobs?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      setJobs(data.jobs || []);
      setPagination({
        page: data.page || 1,
        totalPages: data.totalPages || 1,
        total: data.total || 0
      });
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    loading,
    error,
    pagination,
    refresh: fetchJobs
  };
}
