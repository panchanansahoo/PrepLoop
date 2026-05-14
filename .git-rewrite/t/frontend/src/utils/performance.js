import { createLogger } from './logger';

const logger = createLogger('performance');

export const measureWebVitals = () => {
  if (typeof window === 'undefined' || !window.performance) return;

  // Measure Core Web Vitals
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      logger.info('Web Vital', {
        name: entry.name,
        value: entry.value,
        rating: getRating(entry.name, entry.value)
      });
    }
  });

  try {
    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
  } catch (e) {
    // Browser doesn't support these metrics
  }
};

const getRating = (metric, value) => {
  const thresholds = {
    'largest-contentful-paint': { good: 2500, poor: 4000 },
    'first-input': { good: 100, poor: 300 },
    'layout-shift': { good: 0.1, poor: 0.25 }
  };

  const threshold = thresholds[metric];
  if (!threshold) return 'unknown';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

export const measureApiCall = async (name, apiCall) => {
  const start = performance.now();
  
  try {
    const result = await apiCall();
    const duration = performance.now() - start;
    
    logger.debug('API call completed', {
      name,
      duration: `${duration.toFixed(2)}ms`,
      success: true
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    
    logger.error('API call failed', {
      name,
      duration: `${duration.toFixed(2)}ms`,
      error: error.message
    });
    
    throw error;
  }
};

export const measureComponentRender = (componentName) => {
  const start = performance.now();
  
  return () => {
    const duration = performance.now() - start;
    if (duration > 16) { // Longer than one frame
      logger.warn('Slow component render', {
        component: componentName,
        duration: `${duration.toFixed(2)}ms`
      });
    }
  };
};

export const reportLongTask = () => {
  if (!window.PerformanceObserver) return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) {
        logger.warn('Long task detected', {
          duration: `${entry.duration.toFixed(2)}ms`,
          startTime: entry.startTime
        });
      }
    }
  });

  try {
    observer.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    // Browser doesn't support longtask
  }
};

// Initialize performance monitoring
if (import.meta.env.PROD) {
  measureWebVitals();
  reportLongTask();
}
