import { useState, useEffect } from 'react';
import performanceMonitor from '../utils/performanceMonitor';

/**
 * Hook for monitoring and managing performance metrics
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoStart - Start monitoring automatically
 * @param {boolean} options.trackThresholds - Track threshold violations
 * @param {number} options.refreshInterval - Metrics refresh interval in ms
 * @returns {Object} Performance monitoring state and controls
 */
export const usePerformance = (options = {}) => {
  const {
    autoStart = true,
    trackThresholds = true,
    refreshInterval = 1000
  } = options;

  const [metrics, setMetrics] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [thresholdViolations, setThresholdViolations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (autoStart && !isMonitoring) {
      startMonitoring();
    }
  }, [autoStart, isMonitoring]);

  const startMonitoring = async () => {
    try {
      setIsLoading(true);
      performanceMonitor.start();
      setIsMonitoring(true);
      
      // Get initial metrics
      const initialMetrics = await performanceMonitor.getMetrics();
      setMetrics(initialMetrics);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to start performance monitoring:', error);
      setIsLoading(false);
    }
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    // Note: performanceMonitor doesn't have a stop method in current implementation
  };

  const refreshMetrics = async () => {
    if (!isMonitoring) return;
    
    try {
      const newMetrics = await performanceMonitor.getMetrics();
      setMetrics(newMetrics);
      return newMetrics;
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
      return null;
    }
  };

  const resetMetrics = async () => {
    try {
      performanceMonitor.resetMetrics();
      const newMetrics = await performanceMonitor.getMetrics();
      setMetrics(newMetrics);
      setThresholdViolations([]);
    } catch (error) {
      console.error('Failed to reset metrics:', error);
    }
  };

  const exportMetrics = async () => {
    try {
      return await performanceMonitor.exportMetrics();
    } catch (error) {
      console.error('Failed to export metrics:', error);
      return null;
    }
  };

  const checkThresholds = (currentMetrics) => {
    if (!currentMetrics || !trackThresholds) return [];

    const violations = [];
    const thresholds = performanceMonitor.thresholds;

    if (currentMetrics.pageLoadTime > thresholds.pageLoadTime) {
      violations.push({
        metric: 'pageLoadTime',
        value: currentMetrics.pageLoadTime,
        threshold: thresholds.pageLoadTime,
        severity: currentMetrics.pageLoadTime > thresholds.pageLoadTime * 1.5 ? 'high' : 'medium'
      });
    }

    if (currentMetrics.firstContentfulPaint > thresholds.firstContentfulPaint) {
      violations.push({
        metric: 'firstContentfulPaint',
        value: currentMetrics.firstContentfulPaint,
        threshold: thresholds.firstContentfulPaint,
        severity: currentMetrics.firstContentfulPaint > thresholds.firstContentfulPaint * 1.5 ? 'high' : 'medium'
      });
    }

    if (currentMetrics.largestContentfulPaint > thresholds.largestContentfulPaint) {
      violations.push({
        metric: 'largestContentfulPaint',
        value: currentMetrics.largestContentfulPaint,
        threshold: thresholds.largestContentfulPaint,
        severity: currentMetrics.largestContentfulPaint > thresholds.largestContentfulPaint * 1.5 ? 'high' : 'medium'
      });
    }

    if (currentMetrics.firstInputDelay > thresholds.firstInputDelay) {
      violations.push({
        metric: 'firstInputDelay',
        value: currentMetrics.firstInputDelay,
        threshold: thresholds.firstInputDelay,
        severity: 'high'
      });
    }

    if (currentMetrics.cumulativeLayoutShift > thresholds.cumulativeLayoutShift) {
      violations.push({
        metric: 'cumulativeLayoutShift',
        value: currentMetrics.cumulativeLayoutShift,
        threshold: thresholds.cumulativeLayoutShift,
        severity: currentMetrics.cumulativeLayoutShift > thresholds.cumulativeLayoutShift * 2 ? 'high' : 'medium'
      });
    }

    if (currentMetrics.averageApiResponseTime > thresholds.apiResponseTime) {
      violations.push({
        metric: 'apiResponseTime',
        value: currentMetrics.averageApiResponseTime,
        threshold: thresholds.apiResponseTime,
        severity: currentMetrics.averageApiResponseTime > thresholds.apiResponseTime * 2 ? 'high' : 'medium'
      });
    }

    return violations;
  };

  // Set up periodic refresh
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(async () => {
      const newMetrics = await refreshMetrics();
      if (newMetrics && trackThresholds) {
        const violations = checkThresholds(newMetrics);
        setThresholdViolations(violations);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isMonitoring, refreshInterval, trackThresholds]);

  // Listen for threshold alerts from performance monitor
  useEffect(() => {
    if (!trackThresholds) return;

    const handleThresholdAlert = (alert) => {
      const violation = {
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
        severity: alert.severity || 'medium',
        timestamp: Date.now()
      };

      setThresholdViolations(prev => [...prev, violation]);
    };

    performanceMonitor.addListener(handleThresholdAlert);

    return () => {
      performanceMonitor.removeListener(handleThresholdAlert);
    };
  }, [trackThresholds]);

  const getOverallScore = () => {
    if (!metrics) return 0;
    return metrics.overallScore || 0;
  };

  const getPerformanceGrade = () => {
    const score = getOverallScore();
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const isPerformanceGood = () => {
    return getOverallScore() >= 70 && thresholdViolations.length === 0;
  };

  const getRecommendations = () => {
    if (!metrics) return [];

    const recommendations = [];

    if (metrics.pageLoadTime > 3000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'Page load time is slow. Consider optimizing images and reducing bundle size.'
      });
    }

    if (metrics.firstContentfulPaint > 1800) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'First contentful paint is slow. Consider preloading critical resources.'
      });
    }

    if (metrics.largestContentfulPaint > 2500) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'Largest contentful paint is slow. Consider optimizing hero images and fonts.'
      });
    }

    if (metrics.firstInputDelay > 100) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: 'First input delay is high. Consider reducing JavaScript execution time.'
      });
    }

    if (metrics.cumulativeLayoutShift > 0.1) {
      recommendations.push({
        type: 'ux',
        priority: 'medium',
        message: 'Layout shift is high. Consider reserving space for dynamic content.'
      });
    }

    if (metrics.averageApiResponseTime > 500) {
      recommendations.push({
        type: 'api',
        priority: 'high',
        message: 'API response time is slow. Consider implementing caching or optimizing database queries.'
      });
    }

    return recommendations;
  };

  return {
    // State
    metrics,
    isMonitoring,
    isLoading,
    thresholdViolations,
    
    // Controls
    startMonitoring,
    stopMonitoring,
    refreshMetrics,
    resetMetrics,
    exportMetrics,
    
    // Utilities
    getOverallScore,
    getPerformanceGrade,
    isPerformanceGood,
    getRecommendations,
    checkThresholds
  };
};

export default usePerformance;