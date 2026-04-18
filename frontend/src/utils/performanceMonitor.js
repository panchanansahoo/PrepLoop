/**
 * Performance Monitoring
 * Tracks Core Web Vitals, custom metrics, and performance bottlenecks
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
    this.initialized = false;
  }

  /**
   * Initialize performance monitoring
   */
  init() {
    if (this.initialized || typeof window === 'undefined') return;

    this.trackWebVitals();
    this.trackNavigationTiming();
    this.trackResourceTiming();
    this.initialized = true;
  }

  /**
   * Track Core Web Vitals (LCP, FID, CLS)
   */
  trackWebVitals() {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('LCP', lastEntry.renderTime || lastEntry.loadTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer failed:', e.message);
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.recordMetric('FID', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer failed:', e.message);
      }

      // Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.recordMetric('CLS', clsValue);
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observer failed:', e.message);
      }
    }
  }

  /**
   * Track navigation timing
   */
  trackNavigationTiming() {
    if (typeof window === 'undefined' || !window.performance) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = performance.getEntriesByType('navigation')[0];
        if (timing) {
          this.recordMetric('TTFB', timing.responseStart - timing.requestStart);
          this.recordMetric('DOMContentLoaded', timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart);
          this.recordMetric('LoadComplete', timing.loadEventEnd - timing.loadEventStart);
        }
      }, 0);
    });
  }

  /**
   * Track resource timing
   */
  trackResourceTiming() {
    if (typeof window === 'undefined' || !window.performance) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const resources = performance.getEntriesByType('resource');
        const slowResources = resources
          .filter((r) => r.duration > 1000)
          .map((r) => ({
            name: r.name,
            duration: r.duration,
            type: r.initiatorType,
          }));

        if (slowResources.length > 0) {
          this.recordMetric('SlowResources', slowResources);
        }
      }, 0);
    });
  }

  /**
   * Record custom metric
   */
  recordMetric(name, value) {
    this.metrics.set(name, {
      value,
      timestamp: Date.now(),
    });

    // Send to analytics (implement your analytics service)
    this.sendToAnalytics(name, value);
  }

  /**
   * Mark custom timing
   */
  mark(name) {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(name);
    }
  }

  /**
   * Measure between marks
   */
  measure(name, startMark, endMark) {
    if (typeof window !== 'undefined' && window.performance) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        this.recordMetric(name, measure.duration);
      } catch (e) {
        console.warn('Performance measure failed:', e.message);
      }
    }
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Send metrics to analytics service
   */
  sendToAnalytics(name, value) {
    // Implement your analytics integration here
    if (import.meta.env.DEV) {
      console.log(`[Performance] ${name}:`, value);
    }

    // Example: Send to Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'performance_metric', {
        metric_name: name,
        metric_value: typeof value === 'number' ? value : JSON.stringify(value),
      });
    }
  }

  /**
   * Get performance report
   */
  getReport() {
    const metrics = this.getMetrics();
    return {
      webVitals: {
        LCP: metrics.LCP?.value,
        FID: metrics.FID?.value,
        CLS: metrics.CLS?.value,
      },
      timing: {
        TTFB: metrics.TTFB?.value,
        DOMContentLoaded: metrics.DOMContentLoaded?.value,
        LoadComplete: metrics.LoadComplete?.value,
      },
      slowResources: metrics.SlowResources?.value || [],
    };
  }

  /**
   * Cleanup observers
   */
  cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.initialized = false;
  }
}

export default new PerformanceMonitor();
