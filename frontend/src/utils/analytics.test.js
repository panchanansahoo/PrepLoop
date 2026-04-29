import { describe, expect, it, vi } from 'vitest';
import analytics from './analytics';

describe('analytics startup API', () => {
  it('initializes with startup tracking options without throwing', () => {
    expect(() => {
      analytics.init({
        trackPageViews: true,
        trackClicks: true,
        trackErrors: true,
      });
    }).not.toThrow();
  });

  it('tracks page views during initialization when enabled', () => {
    const trackSpy = vi.spyOn(analytics, 'trackPageView');

    analytics.init({ trackPageViews: true });

    expect(trackSpy).toHaveBeenCalledWith(window.location.pathname);
  });
});
