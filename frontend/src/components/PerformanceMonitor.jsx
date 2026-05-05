import React, { useState, useEffect } from 'react';
import performanceMonitor from '../utils/performanceMonitor';

const PerformanceMonitor = ({ showDetails = false }) => {
  const [metrics, setMetrics] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [thresholdAlerts, setThresholdAlerts] = useState([]);

  useEffect(() => {
    // Start monitoring on mount
    performanceMonitor.start();
    setIsMonitoring(true);

    // Listen for threshold alerts
    const handleThresholdAlert = (alert) => {
      setThresholdAlerts(prev => [...prev, alert]);
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setThresholdAlerts(prev => prev.filter(a => a !== alert));
      }, 5000);
    };

    performanceMonitor.addListener(handleThresholdAlert);

    // Grab initial metrics immediately
    setMetrics(performanceMonitor.getMetrics());

    // Update metrics periodically
    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics());
    }, 1000);

    return () => {
      clearInterval(interval);
      performanceMonitor.removeListener(handleThresholdAlert);
    };
  }, []);

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getMetricColor = (value, threshold) => {
    if (value <= threshold * 0.8) return 'text-green-500';
    if (value <= threshold) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (!isMonitoring || !metrics) {
    return (
      <div className="performance-monitor loading">
        <div className="performance-monitor-spinner"></div>
        <span>Initializing performance monitor...</span>
      </div>
    );
  }

  return (
    <div className="performance-monitor">
      <div className="performance-monitor-header">
        <h3 className="performance-monitor-title">Performance Metrics</h3>
        <div className={`performance-monitor-score ${getScoreColor(metrics.overallScore)}`}>
          {metrics.overallScore}/100
        </div>
      </div>

      {thresholdAlerts.length > 0 && (
        <div className="performance-monitor-alerts">
          {thresholdAlerts.map((alert, index) => (
            <div key={index} className="performance-monitor-alert">
              <span className="performance-monitor-alert-icon">⚠️</span>
              <span className="performance-monitor-alert-message">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="performance-monitor-metrics">
        <div className="performance-monitor-metric">
          <span className="performance-monitor-metric-label">Page Load:</span>
          <span className={`performance-monitor-metric-value ${getMetricColor(metrics.pageLoadTime, 3000)}`}>
            {metrics.pageLoadTime.toFixed(0)}ms
          </span>
        </div>

        <div className="performance-monitor-metric">
          <span className="performance-monitor-metric-label">First Contentful Paint:</span>
          <span className={`performance-monitor-metric-value ${getMetricColor(metrics.firstContentfulPaint, 1800)}`}>
            {metrics.firstContentfulPaint.toFixed(0)}ms
          </span>
        </div>

        <div className="performance-monitor-metric">
          <span className="performance-monitor-metric-label">Largest Contentful Paint:</span>
          <span className={`performance-monitor-metric-value ${getMetricColor(metrics.largestContentfulPaint, 2500)}`}>
            {metrics.largestContentfulPaint.toFixed(0)}ms
          </span>
        </div>

        <div className="performance-monitor-metric">
          <span className="performance-monitor-metric-label">First Input Delay:</span>
          <span className={`performance-monitor-metric-value ${getMetricColor(metrics.firstInputDelay, 100)}`}>
            {metrics.firstInputDelay.toFixed(0)}ms
          </span>
        </div>

        <div className="performance-monitor-metric">
          <span className="performance-monitor-metric-label">Cumulative Layout Shift:</span>
          <span className={`performance-monitor-metric-value ${getMetricColor(metrics.cumulativeLayoutShift * 1000, 100)}`}>
            {(metrics.cumulativeLayoutShift * 1000).toFixed(1)}
          </span>
        </div>

        {showDetails && (
          <>
            <div className="performance-monitor-metric">
              <span className="performance-monitor-metric-label">Time to Interactive:</span>
              <span className={`performance-monitor-metric-value ${getMetricColor(metrics.timeToInteractive, 5000)}`}>
                {metrics.timeToInteractive.toFixed(0)}ms
              </span>
            </div>

            <div className="performance-monitor-metric">
              <span className="performance-monitor-metric-label">API Response Time:</span>
              <span className={`performance-monitor-metric-value ${getMetricColor(metrics.averageApiResponseTime, 500)}`}>
                {metrics.averageApiResponseTime.toFixed(0)}ms
              </span>
            </div>

            <div className="performance-monitor-metric">
              <span className="performance-monitor-metric-label">Bundle Load Time:</span>
              <span className={`performance-monitor-metric-value ${getMetricColor(metrics.bundleLoadTime, 2000)}`}>
                {metrics.bundleLoadTime.toFixed(0)}ms
              </span>
            </div>
          </>
        )}
      </div>

      <div className="performance-monitor-actions">
        <button
          onClick={() => performanceMonitor.exportMetrics()}
          className="performance-monitor-button secondary"
        >
          Export Metrics
        </button>
        <button
          onClick={() => performanceMonitor.resetMetrics()}
          className="performance-monitor-button secondary"
        >
          Reset
        </button>
        <button
          onClick={() => setMetrics(performanceMonitor.getMetrics())}
          className="performance-monitor-button primary"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default PerformanceMonitor;