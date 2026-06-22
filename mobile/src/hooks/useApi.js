import { useState, useCallback } from 'react';

/**
 * useApi — lightweight hook wrapping an async API call with
 * loading, error, and data state management.
 *
 * Usage:
 *   const { execute, data, loading, error } = useApi(dsaApi.getPatterns);
 *   useEffect(() => { execute(); }, []);
 */
export function useApi(apiFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn(...args);
      setData(result);
      return result;
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'An unexpected error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { execute, data, loading, error, reset, setData };
}

/**
 * usePaginated — extends useApi for paginated lists.
 */
export function usePaginated(apiFn, pageSize = 20) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPage = useCallback(async (pageNum, isRefresh = false) => {
    if (loading) return;
    setLoading(true);
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const result = await apiFn(pageNum, pageSize);
      const newItems = result.items || result.data || result || [];
      if (isRefresh) {
        setItems(newItems);
      } else {
        setItems(prev => [...prev, ...newItems]);
      }
      setHasMore(newItems.length === pageSize);
      setPage(pageNum);
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || 'Failed to load';
      setError(message);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, [apiFn, pageSize, loading]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) loadPage(page + 1);
  }, [loading, hasMore, page, loadPage]);

  const refresh = useCallback(() => {
    setHasMore(true);
    loadPage(1, true);
  }, [loadPage]);

  const load = useCallback(() => {
    loadPage(1);
  }, [loadPage]);

  return { items, loading, error, hasMore, refreshing, load, loadMore, refresh };
}
