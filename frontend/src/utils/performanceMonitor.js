/**
 * Performance Monitoring Utility
 * 
 * Tracks key performance metrics and provides real-time monitoring
 * for optimization efforts and user experience improvements.
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = this.createEmptyMetrics();
    
    this.thresholds = {
      pageLoadTime: 3000,        // 3 seconds
      firstContentfulPaint: 1800, // 1.8 seconds
      largestContentfulPaint: 2500, // 2.5 seconds
      firstInputDelay: 100,        // 100ms
      cumulativeLayoutShift: 0.1,  // 0.1
      timeToInteractive: 5000,    // 5 seconds
      apiResponseTime: 500,        // 500ms
      bundleLoadTime: 2000       // 2 seconds
    };
    
    this.listeners = new Set();
    this.isMonitoring = false;
    this.originalFetch = null;
  }

  createEmptyMetrics() {
    return {
      pageLoadTime: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0,
      timeToInteractive: 0,
      resourceLoadTimes: new Map(),
      apiResponseTimes: new Map(),
      bundleLoadTimes: new Map()
    };
  }

  init() {
    this.start();
  }

  /**
   * Start performance monitoring
   */
  start() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.setupWebVitals();
    this.setupResourceTiming();
    this.setupAPIMonitoring();
    this.setupBundleMonitoring();
    
    console.log('🚀 Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stop() {
    this.isMonitoring = false;
    console.log('⏹️ Performance monitoring stopped');
  }

  /**
   * Setup Web Vitals monitoring
   */
  setupWebVitals() {
    if (typeof window === 'undefined') return;

    if ('PerformanceObserver' in window) {
      // First Contentful Paint
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.metrics.firstContentfulPaint = entry.startTime;
            this.checkThreshold('firstContentfulPaint', entry.startTime);
            this.notifyListeners('fcp', entry.startTime);
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
      } catch (e) {
        console.warn('FCP monitoring not supported');
      }

      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.metrics.largestContentfulPaint = entry.startTime;
            this.checkThreshold('largestContentfulPaint', entry.startTime);
            this.notifyListeners('lcp', entry.startTime);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP monitoring not supported');
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
            this.checkThreshold('firstInputDelay', this.metrics.firstInputDelay);
            this.notifyListeners('fid', this.metrics.firstInputDelay);
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID monitoring not supported');
      }

      // Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          this.metrics.cumulativeLayoutShift = clsValue;
          this.checkThreshold('cumulativeLayoutShift', clsValue);
          this.notifyListeners('cls', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS monitoring not supported');
      }
    }

    // Time to Interactive
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.metrics.timeToInteractive = performance.now();
        this.checkThreshold('timeToInteractive', this.metrics.timeToInteractive);
        this.notifyListeners('tti', this.metrics.timeToInteractive);
      }, 0);
    });
  }

  /**
   * Setup Resource Timing monitoring
   */
  setupResourceTiming() {
    if (typeof window === 'undefined') return;

    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
              // API calls will be handled by API monitoring
              continue;
            }
            
            this.metrics.resourceLoadTimes.set(entry.name, {
              duration: entry.duration,
              size: entry.transferSize,
              type: entry.initiatorType
            });
            
            // Track bundle loading specifically
            if (entry.name.includes('.js') && entry.name.includes('chunk')) {
              this.metrics.bundleLoadTimes.set(entry.name, entry.duration);
              this.checkThreshold('bundleLoadTime', entry.duration);
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (e) {
        console.warn('Resource timing monitoring not supported');
      }
    }
  }

  /**
   * Setup API response time monitoring
   */
  setupAPIMonitoring() {
    // Avoid double-patching: main.jsx may have already wrapped window.fetch for
    // API routing. We wrap the *current* fetch (whatever it is) and store a
    // reference so we never wrap our own wrapper on hot-reload.
    if (typeof window === 'undefined' || !window.fetch) return;
    if (window.__perfMonitorPatched) return;
    window.__perfMonitorPatched = true;

    this.originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0];
      
      try {
        const response = await this.originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.metrics.apiResponseTimes.set(url, duration);
        this.checkThreshold('apiResponseTime', duration);
        this.notifyListeners('apiResponse', { url, duration, status: response.status });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.metrics.apiResponseTimes.set(url, duration);
        this.notifyListeners('apiError', { url, duration, error });
        throw error;
      }
    };
  }

  /**
   * Setup bundle loading monitoring
   */
  setupBundleMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor main bundle loading
    window.addEventListener('load', () => {
      const navigationEntry = performance.getEntriesByType('navigation')[0];
      if (navigationEntry) {
        this.metrics.pageLoadTime = navigationEntry.loadEventEnd - navigationEntry.fetchStart;
        this.checkThreshold('pageLoadTime', this.metrics.pageLoadTime);
        this.notifyListeners('pageLoad', this.metrics.pageLoadTime);
      }
    });
  }

  /**
   * Check if metric exceeds threshold
   */
  checkThreshold(metric, value) {
    const threshold = this.thresholds[metric];
    if (threshold && value > threshold) {
      console.warn(`⚠️ Performance warning: ${metric} (${value.toFixed(2)}ms) exceeds threshold (${threshold}ms)`);
      this.notifyListeners('thresholdExceeded', {
        metric,
        value,
        threshold,
        message: `${metric} exceeded ${threshold}ms`,
      });
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const apiTimes = Array.from(this.metrics.apiResponseTimes.values());
    const bundleTimes = Array.from(this.metrics.bundleLoadTimes.values());
    const averageApiResponseTime = apiTimes.length
      ? apiTimes.reduce((sum, value) => sum + value, 0) / apiTimes.length
      : 0;
    const bundleLoadTime = bundleTimes.length
      ? bundleTimes.reduce((sum, value) => sum + value, 0) / bundleTimes.length
      : 0;

    return {
      ...this.metrics,
      averageApiResponseTime,
      bundleLoadTime,
      overallScore: this.getPerformanceScore(),
      resourceLoadTimes: Object.fromEntries(this.metrics.resourceLoadTimes),
      apiResponseTimes: Object.fromEntries(this.metrics.apiResponseTimes),
      bundleLoadTimes: Object.fromEntries(this.metrics.bundleLoadTimes)
    };
  }

  /**
   * Get performance score (0-100)
   */
  getPerformanceScore() {
    const weights = {
      firstContentfulPaint: 0.25,
      largestContentfulPaint: 0.25,
      firstInputDelay: 0.20,
      cumulativeLayoutShift: 0.15,
      timeToInteractive: 0.15
    };

    let score = 100;
    
    Object.entries(weights).forEach(([metric, weight]) => {
      const value = this.metrics[metric];
      const threshold = this.thresholds[metric];
      
      if (value && threshold) {
        const ratio = value / threshold;
        if (ratio > 1) {
          score -= (ratio - 1) * 100 * weight;
        }
      }
    });
    
    return Math.max(0, Math.round(score));
  }

  /**
   * Add performance listener
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  resetMetrics() {
    this.metrics = this.createEmptyMetrics();
    this.notifyListeners('reset', this.getMetrics());
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(data, event);
      } catch (error) {
        console.error('Error in performance listener:', error);
      }
    });
  }

  /**
   * Export metrics for analytics
   */
  exportMetrics() {
    return {
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      url: typeof window !== 'undefined' ? window.location.href : '',
      metrics: this.getMetrics(),
      performanceScore: this.getPerformanceScore()
    };
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Auto-start in development
if (import.meta.env.DEV) {
  performanceMonitor.start();
}

export default performanceMonitor;
