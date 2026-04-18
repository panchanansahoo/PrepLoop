/**
 * Error Tracking Service
 * Comprehensive error tracking, logging, and alerting system
 */

import { createLogger } from './structuredLogger.js';

const logger = createLogger('error-tracker');

class ErrorTracker {
  constructor() {
    this.errors = [];
    this.maxErrors = 1000;
    this.errorCounts = new Map();
    this.alertThresholds = {
      critical: 10,
      high: 50,
      medium: 100,
    };
  }

  /**
   * Capture and track error
   */
  captureError(error, context = {}) {
    const errorData = {
      id: this.generateErrorId(),
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
      severity: this.determineSeverity(error),
      context: {
        ...context,
        userAgent: context.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'),
        url: context.url || (typeof window !== 'undefined' ? window.location.href : 'unknown'),
      },
      fingerprint: this.generateFingerprint(error),
    };

    this.storeError(errorData);
    this.updateErrorCounts(errorData.fingerprint);
    this.checkAlertThresholds(errorData);
    this.logError(errorData);

    return errorData.id;
  }

  /**
   * Capture exception with additional context
   */
  captureException(error, tags = {}, extra = {}) {
    return this.captureError(error, {
      tags,
      extra,
      type: 'exception',
    });
  }

  /**
   * Capture message (non-error logging)
   */
  captureMessage(message, level = 'info', context = {}) {
    const messageData = {
      id: this.generateErrorId(),
      message,
      level,
      timestamp: new Date().toISOString(),
      context,
    };

    logger.log(level, message, context);
    return messageData.id;
  }

  /**
   * Set user context
   */
  setUser(user) {
    this.userContext = {
      id: user.id,
      email: user.email,
      username: user.username,
    };
  }

  /**
   * Set tags for filtering
   */
  setTags(tags) {
    this.tags = { ...this.tags, ...tags };
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(breadcrumb) {
    if (!this.breadcrumbs) {
      this.breadcrumbs = [];
    }

    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 50 breadcrumbs
    if (this.breadcrumbs.length > 50) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Get error statistics
   */
  getStats() {
    const now = Date.now();
    const last24h = this.errors.filter(
      (e) => now - new Date(e.timestamp).getTime() < 24 * 60 * 60 * 1000
    );

    return {
      total: this.errors.length,
      last24h: last24h.length,
      bySeverity: this.groupBySeverity(last24h),
      topErrors: this.getTopErrors(10),
      errorRate: this.calculateErrorRate(),
    };
  }

  /**
   * Get errors by filter
   */
  getErrors(filter = {}) {
    let filtered = [...this.errors];

    if (filter.severity) {
      filtered = filtered.filter((e) => e.severity === filter.severity);
    }

    if (filter.fingerprint) {
      filtered = filtered.filter((e) => e.fingerprint === filter.fingerprint);
    }

    if (filter.since) {
      filtered = filtered.filter((e) => new Date(e.timestamp) >= new Date(filter.since));
    }

    return filtered.slice(0, filter.limit || 100);
  }

  /**
   * Clear old errors
   */
  clearOldErrors(daysToKeep = 7) {
    const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    this.errors = this.errors.filter(
      (e) => new Date(e.timestamp).getTime() > cutoff
    );
  }

  // Private methods
  storeError(errorData) {
    this.errors.push(errorData);

    // Maintain max size
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
  }

  updateErrorCounts(fingerprint) {
    const count = (this.errorCounts.get(fingerprint) || 0) + 1;
    this.errorCounts.set(fingerprint, count);
  }

  checkAlertThresholds(errorData) {
    const count = this.errorCounts.get(errorData.fingerprint);

    if (count === this.alertThresholds.critical) {
      this.sendAlert('critical', errorData, count);
    } else if (count === this.alertThresholds.high) {
      this.sendAlert('high', errorData, count);
    }
  }

  sendAlert(level, errorData, count) {
    logger.error(`Alert [${level}]: Error occurred ${count} times`, {
      error: errorData.message,
      fingerprint: errorData.fingerprint,
      count,
    });

    // Implement your alerting mechanism here (email, Slack, etc.)
  }

  logError(errorData) {
    logger.error('Error captured', {
      id: errorData.id,
      message: errorData.message,
      severity: errorData.severity,
      fingerprint: errorData.fingerprint,
      context: errorData.context,
    });
  }

  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateFingerprint(error) {
    // Create unique fingerprint based on error type and location
    const stackLine = error.stack?.split('\n')[1] || '';
    return `${error.name}:${error.message}:${stackLine}`.substring(0, 100);
  }

  determineSeverity(error) {
    if (error.name === 'TypeError' || error.name === 'ReferenceError') {
      return 'critical';
    }
    if (error.message?.includes('timeout') || error.message?.includes('network')) {
      return 'high';
    }
    return 'medium';
  }

  groupBySeverity(errors) {
    return errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {});
  }

  getTopErrors(limit) {
    return Array.from(this.errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([fingerprint, count]) => ({
        fingerprint,
        count,
        lastError: this.errors.find((e) => e.fingerprint === fingerprint),
      }));
  }

  calculateErrorRate() {
    const now = Date.now();
    const lastHour = this.errors.filter(
      (e) => now - new Date(e.timestamp).getTime() < 60 * 60 * 1000
    );
    return (lastHour.length / 60).toFixed(2); // errors per minute
  }
}

// Singleton instance
const errorTracker = new ErrorTracker();

// Global error handlers
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorTracker.captureError(event.error, {
      type: 'window.error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.captureError(
      new Error(event.reason),
      { type: 'unhandledRejection' }
    );
  });
}

export default errorTracker;
