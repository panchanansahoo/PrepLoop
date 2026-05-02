/**
 * Hook for Question Quality Recommendations
 * 
 * Provides easy access to smart question recommendations based on
 * quality, novelty, and user performance.
 * 
 * Usage:
 * const { recommendations, loading, error, refresh } = useQuestionRecommendations({
 *   category: 'behavioral',
 *   difficulty: 'medium',
 *   currentScore: 75,
 *   limit: 5
 * });
 */

import { useState, useCallback, useEffect } from 'react';
import { buildAuthHeaders } from '../utils/authHeaders';

export const useQuestionRecommendations = (options = {}) => {
  const {
    category = 'technical',
    difficulty = 'medium',
    currentScore = 70,
    limit = 5,
    autoRefresh = true,
  } = options;

  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = useCallback(async (recentIds = []) => {
    try {
      setLoading(true);
      setError(null);

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const recentParam = recentIds.join(',');

      const response = await fetch(
        `${API_URL}/api/questions/recommendations?category=${category}&difficulty=${difficulty}&currentScore=${currentScore}&limit=${limit}&recent=${recentParam}`,
        {
          method: 'GET',
          headers: buildAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
      }

      const data = await response.json();
      setRecommendations(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching recommendations:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [category, difficulty, currentScore, limit]);

  // Auto-refresh on mount or when options change
  useEffect(() => {
    if (autoRefresh) {
      fetchRecommendations();
    }
  }, [autoRefresh, fetchRecommendations]);

  return {
    recommendations,
    loading,
    error,
    refresh: fetchRecommendations,
  };
};

/**
 * Hook for Question Metrics
 * Get performance metrics for a specific question
 */
export const useQuestionMetrics = (questionId) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    if (!questionId) return;

    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(
        `${API_URL}/api/questions/metrics/${questionId}`,
        {
          method: 'GET',
          headers: buildAuthHeaders(),
        }
      );

      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to fetch metrics');
      }

      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      } else {
        setMetrics(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refresh: fetchMetrics };
};

/**
 * Hook for Recording Question Feedback
 * Used when user provides feedback on question quality
 */
export const useRecordQuestionFeedback = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const recordFeedback = useCallback(async (questionId, rating, positive = null) => {
    try {
      setLoading(true);
      setError(null);

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(`${API_URL}/api/questions/record-feedback`, {
        method: 'POST',
        headers: {
          ...buildAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          rating: Math.max(0, Math.min(100, parseInt(rating) || 50)),
          positive,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record feedback');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error recording feedback:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { recordFeedback, loading, error };
};

/**
 * Hook for Gem Questions (high quality, underutilized)
 * Perfect for deep learning
 */
export const useGemQuestions = (category, limit = 3) => {
  const [gems, setGems] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGems = useCallback(async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(
        `${API_URL}/api/questions/gems?category=${category}&limit=${limit}`,
        {
          method: 'GET',
          headers: buildAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch gem questions');
      }

      const data = await response.json();
      setGems(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching gems:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [category, limit]);

  useEffect(() => {
    if (category) {
      fetchGems();
    }
  }, [category, fetchGems]);

  return { gems, loading, error, refresh: fetchGems };
};

/**
 * Hook for Category Summary
 * Get health and statistics for a question category
 */
export const useCategorySummary = (category) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    if (!category) return;

    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(
        `${API_URL}/api/questions/category-summary/${category}`,
        {
          method: 'GET',
          headers: buildAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch category summary');
      }

      const data = await response.json();
      setSummary(data);
      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, refresh: fetchSummary };
};

/**
 * Hook for Trending Questions
 * Get recently high-performing questions
 */
export const useTrendingQuestions = (category, limit = 5) => {
  const [trending, setTrending] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTrending = useCallback(async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const response = await fetch(
        `${API_URL}/api/questions/trending/${category}?limit=${limit}`,
        {
          method: 'GET',
          headers: buildAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch trending questions');
      }

      const data = await response.json();
      setTrending(data);
      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [category, limit]);

  useEffect(() => {
    if (category) {
      fetchTrending();
    }
  }, [category, fetchTrending]);

  return { trending, loading, error, refresh: fetchTrending };
};

export default {
  useQuestionRecommendations,
  useQuestionMetrics,
  useRecordQuestionFeedback,
  useGemQuestions,
  useCategorySummary,
  useTrendingQuestions,
};
