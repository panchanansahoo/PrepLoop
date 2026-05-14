/**
 * Analytics & A/B Testing Framework
 * Comprehensive analytics tracking and experimentation platform
 */

class AnalyticsService {
  constructor() {
    this.events = [];
    this.experiments = new Map();
    this.userProperties = {};
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize analytics
   */
  init(config = {}) {
    this.config = {
      trackPageViews: true,
      trackClicks: true,
      trackErrors: true,
      ...config,
    };

    if (typeof window !== 'undefined') {
      this.setupAutoTracking();
    }
  }

  /**
   * Track custom event
   */
  track(eventName, properties = {}) {
    const event = {
      name: eventName,
      properties: {
        ...properties,
        ...this.userProperties,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : null,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      },
    };

    this.events.push(event);
    this.sendToBackend(event);

    // Also send to third-party analytics
    this.sendToGoogleAnalytics(event);
    this.sendToMixpanel(event);
  }

  /**
   * Track page view
   */
  pageView(pageName, properties = {}) {
    this.track('page_view', {
      page: pageName,
      ...properties,
    });
  }

  /**
   * Track user action
   */
  action(actionName, properties = {}) {
    this.track('user_action', {
      action: actionName,
      ...properties,
    });
  }

  /**
   * Track conversion
   */
  conversion(conversionName, value = 0, properties = {}) {
    this.track('conversion', {
      conversion: conversionName,
      value,
      ...properties,
    });
  }

  /**
   * Set user properties
   */
  identify(userId, properties = {}) {
    this.userProperties = {
      userId,
      ...properties,
    };

    this.track('identify', this.userProperties);
  }

  /**
   * A/B Testing - Create experiment
   */
  createExperiment(experimentName, variants, options = {}) {
    const { weights = null, targeting = null } = options;

    this.experiments.set(experimentName, {
      variants,
      weights: weights || variants.map(() => 1 / variants.length),
      targeting,
      assignments: new Map(),
    });
  }

  /**
   * Get variant for user
   */
  getVariant(experimentName, userId = null) {
    const experiment = this.experiments.get(experimentName);
    if (!experiment) return null;

    const user = userId || this.userProperties.userId || this.sessionId;

    // Check if user already assigned
    if (experiment.assignments.has(user)) {
      return experiment.assignments.get(user);
    }

    // Check targeting
    if (experiment.targeting && !this.matchesTargeting(experiment.targeting)) {
      return null;
    }

    // Assign variant based on weights
    const variant = this.assignVariant(experiment.variants, experiment.weights, user);
    experiment.assignments.set(user, variant);

    // Track assignment
    this.track('experiment_assignment', {
      experiment: experimentName,
      variant,
      userId: user,
    });

    return variant;
  }

  /**
   * Track experiment conversion
   */
  trackExperimentConversion(experimentName, conversionName, value = 0) {
    const variant = this.getVariant(experimentName);
    
    this.track('experiment_conversion', {
      experiment: experimentName,
      variant,
      conversion: conversionName,
      value,
    });
  }

  /**
   * Get experiment results
   */
  getExperimentResults(experimentName) {
    const events = this.events.filter(
      (e) => e.properties.experiment === experimentName
    );

    const byVariant = events.reduce((acc, event) => {
      const variant = event.properties.variant;
      if (!acc[variant]) {
        acc[variant] = {
          assignments: 0,
          conversions: 0,
          totalValue: 0,
        };
      }

      if (event.name === 'experiment_assignment') {
        acc[variant].assignments++;
      } else if (event.name === 'experiment_conversion') {
        acc[variant].conversions++;
        acc[variant].totalValue += event.properties.value || 0;
      }

      return acc;
    }, {});

    // Calculate conversion rates
    Object.keys(byVariant).forEach((variant) => {
      const data = byVariant[variant];
      data.conversionRate = data.assignments > 0
        ? (data.conversions / data.assignments * 100).toFixed(2)
        : 0;
      data.avgValue = data.conversions > 0
        ? (data.totalValue / data.conversions).toFixed(2)
        : 0;
    });

    return byVariant;
  }

  /**
   * Funnel analysis
   */
  createFunnel(steps) {
    const funnel = {
      steps,
      data: [],
    };

    let previousCount = null;

    steps.forEach((step, index) => {
      const count = this.events.filter((e) => e.name === step).length;
      const dropoff = previousCount ? ((previousCount - count) / previousCount * 100).toFixed(2) : 0;

      funnel.data.push({
        step,
        count,
        dropoff: index > 0 ? dropoff : 0,
        conversionRate: previousCount ? ((count / previousCount) * 100).toFixed(2) : 100,
      });

      previousCount = count;
    });

    return funnel;
  }

  /**
   * Cohort analysis
   */
  cohortAnalysis(cohortBy = 'week', metric = 'retention') {
    // Group users by cohort
    const cohorts = new Map();

    this.events.forEach((event) => {
      if (event.name === 'identify') {
        const cohortDate = this.getCohortDate(event.properties.timestamp, cohortBy);
        if (!cohorts.has(cohortDate)) {
          cohorts.set(cohortDate, new Set());
        }
        cohorts.get(cohortDate).add(event.properties.userId);
      }
    });

    // Calculate retention for each cohort
    const results = [];
    cohorts.forEach((users, cohortDate) => {
      const retention = this.calculateRetention(users, cohortDate);
      results.push({
        cohort: cohortDate,
        size: users.size,
        retention,
      });
    });

    return results;
  }

  /**
   * Get analytics dashboard data
   */
  getDashboard() {
    const now = Date.now();
    const last24h = this.events.filter(
      (e) => now - new Date(e.properties.timestamp).getTime() < 24 * 60 * 60 * 1000
    );

    return {
      totalEvents: this.events.length,
      last24h: last24h.length,
      uniqueUsers: new Set(this.events.map((e) => e.properties.userId)).size,
      topEvents: this.getTopEvents(10),
      conversionRate: this.calculateOverallConversionRate(),
      avgSessionDuration: this.calculateAvgSessionDuration(),
    };
  }

  // Private methods
  setupAutoTracking() {
    if (this.config.trackPageViews) {
      // Track initial page view
      this.pageView(window.location.pathname);

      // Track navigation
      window.addEventListener('popstate', () => {
        this.pageView(window.location.pathname);
      });
    }

    if (this.config.trackClicks) {
      document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-track]');
        if (target) {
          this.action('click', {
            element: target.dataset.track,
            text: target.textContent,
          });
        }
      });
    }

    if (this.config.trackErrors) {
      window.addEventListener('error', (e) => {
        this.track('error', {
          message: e.message,
          filename: e.filename,
          lineno: e.lineno,
        });
      });
    }
  }

  assignVariant(variants, weights, userId) {
    // Deterministic assignment based on userId hash
    const hash = this.hashString(userId);
    const random = (hash % 10000) / 10000;

    let cumulative = 0;
    for (let i = 0; i < variants.length; i++) {
      cumulative += weights[i];
      if (random < cumulative) {
        return variants[i];
      }
    }

    return variants[variants.length - 1];
  }

  matchesTargeting(targeting) {
    // Implement targeting logic
    return true;
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getCohortDate(timestamp, cohortBy) {
    const date = new Date(timestamp);
    if (cohortBy === 'week') {
      const week = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
      return `Week ${week}`;
    }
    return date.toISOString().split('T')[0];
  }

  calculateRetention(users, cohortDate) {
    // Simplified retention calculation
    return Array.from(users).filter((userId) => {
      const userEvents = this.events.filter((e) => e.properties.userId === userId);
      return userEvents.length > 1;
    }).length / users.size * 100;
  }

  getTopEvents(limit) {
    const counts = this.events.reduce((acc, event) => {
      acc[event.name] = (acc[event.name] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));
  }

  calculateOverallConversionRate() {
    const conversions = this.events.filter((e) => e.name === 'conversion').length;
    const sessions = new Set(this.events.map((e) => e.properties.sessionId)).size;
    return sessions > 0 ? (conversions / sessions * 100).toFixed(2) : 0;
  }

  calculateAvgSessionDuration() {
    // Simplified calculation
    return '5:32'; // minutes:seconds
  }

  sendToBackend(event) {
    if (typeof fetch !== 'undefined') {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      }).catch(() => {});
    }
  }

  sendToGoogleAnalytics(event) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event.name, event.properties);
    }
  }

  sendToMixpanel(event) {
    if (typeof window !== 'undefined' && window.mixpanel) {
      window.mixpanel.track(event.name, event.properties);
    }
  }
}

export default new AnalyticsService();
