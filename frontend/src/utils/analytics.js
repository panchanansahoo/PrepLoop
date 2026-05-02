/**
 * Frontend Analytics Tracker (Privacy-Respecting)
 *
 * Tracks user behavior for product insights without PII.
 * Batches events for efficiency and respects consent preferences.
 */

const EVENT_BUFFER = [];
const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 30000; // 30 seconds
let flushTimer = null;
let clickTrackingEnabled = false;
let errorTrackingEnabled = false;

export function init(options = {}) {
  if (typeof window === 'undefined') return;

  const {
    trackPageViews = false,
    trackClicks = false,
    trackErrors = false,
  } = options;

  if (trackPageViews) {
    analytics.trackPageView(window.location.pathname);
  }

  if (trackClicks && !clickTrackingEnabled) {
    window.addEventListener('click', handleDocumentClick);
    clickTrackingEnabled = true;
  }

  if (trackErrors && !errorTrackingEnabled) {
    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    errorTrackingEnabled = true;
  }
}

export function trackEvent(eventName, properties = {}) {
  EVENT_BUFFER.push({
    event: eventName,
    properties,
    timestamp: Date.now(),
    url: window.location.pathname,
    sessionId: getSessionId(),
  });
  if (EVENT_BUFFER.length >= BATCH_SIZE) flushEvents();
}

export function trackPageView(path) {
  trackEvent('page_view', { path: path || window.location.pathname });
}

export function trackFeatureUsage(featureName, action = 'used') {
  trackEvent('feature_usage', { feature: featureName, action });
}

function handleDocumentClick(event) {
  const target = event.target?.closest?.('button, a, [data-analytics-id]');
  if (!target) return;

  analytics.trackEvent('click', {
    element: target.tagName?.toLowerCase(),
    analyticsId: target.dataset?.analyticsId,
    href: target instanceof HTMLAnchorElement ? target.pathname : undefined,
  });
}

function handleWindowError(event) {
  analytics.trackEvent('client_error', {
    message: event.message,
    source: event.filename,
  });
}

function handleUnhandledRejection(event) {
  analytics.trackEvent('client_error', {
    message: event.reason?.message || String(event.reason || 'Unhandled promise rejection'),
    source: 'unhandledrejection',
  });
}

function getSessionId() {
  let id = sessionStorage.getItem('analytics_session');
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('analytics_session', id);
  }
  return id;
}

async function flushEvents() {
  if (EVENT_BUFFER.length === 0) return;
  const events = EVENT_BUFFER.splice(0);
  try {
    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    });
  } catch {
    if (EVENT_BUFFER.length < 100) EVENT_BUFFER.push(...events);
  }
}

if (typeof window !== 'undefined') {
  flushTimer = setInterval(flushEvents, FLUSH_INTERVAL);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushEvents();
  });
  window.addEventListener('beforeunload', () => { flushEvents(); clearInterval(flushTimer); });
}

const analytics = { init, trackEvent, trackPageView, trackFeatureUsage };

export default analytics;
