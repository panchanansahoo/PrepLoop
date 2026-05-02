/**
 * Route Prefetching Utility
 *
 * Preloads lazy-loaded route chunks when users hover or focus navigation links,
 * reducing perceived load time for subsequent navigations.
 *
 * Usage:
 *   import { prefetchRoute, usePrefetchOnHover } from '../utils/prefetchRoutes';
 *
 *   // Direct prefetch
 *   prefetchRoute('/dashboard');
 *
 *   // Hook for link elements
 *   const hoverProps = usePrefetchOnHover('/dashboard');
 *   <Link to="/dashboard" {...hoverProps}>Dashboard</Link>
 */

import { useCallback, useRef } from 'react';

// Map of route paths to their dynamic import functions
// Must match the lazy() calls in App.jsx
const ROUTE_IMPORTS = {
  '/dashboard': () => import('../pages/Dashboard'),
  '/overview': () => import('../pages/Overview'),
  '/problems': () => import('../pages/ProblemExplorer'),
  '/patterns': () => import('../pages/PatternDetail'),
  '/dsa-path': () => import('../pages/DSALearningPath'),
  '/technical-path': () => import('../pages/TechnicalLearningPath'),
  '/hr-path': () => import('../pages/HRLearningPath'),
  '/system-design': () => import('../pages/SystemDesignPath'),
  '/interview-suite': () => import('../pages/InterviewSuite'),
  '/ai-interview': () => import('../pages/AIInterviewPage'),
  '/analytics': () => import('../pages/Analytics'),
  '/profile': () => import('../pages/Profile'),
  '/job-updates': () => import('../pages/JobUpdates'),
  '/blog': () => import('../pages/BlogList'),
  '/pricing': () => import('../pages/Pricing'),
  '/library': () => import('../pages/Library'),
  '/playground': () => import('../pages/CodingPlayground'),
  '/quiz-arena': () => import('../pages/QuizArena'),
  '/aptitude': () => import('../pages/AptitudeHub'),
  '/improvement-plan': () => import('../pages/ImprovementPlanPage'),
  '/community': () => import('../pages/CommunityHub'),
};

// Track already-prefetched routes to avoid duplicate work
const prefetchedRoutes = new Set();

/**
 * Prefetch a route's lazy-loaded chunk.
 * Safe to call multiple times — will only trigger the import once.
 *
 * @param {string} path - Route path (e.g., '/dashboard')
 */
export function prefetchRoute(path) {
  if (typeof window === 'undefined') return;
  const normalized = path.replace(/\/$/, '') || '/';

  const importFn = ROUTE_IMPORTS[normalized];
  if (!importFn || prefetchedRoutes.has(normalized)) return;

  prefetchedRoutes.add(normalized);

  const schedulePreload = window.requestIdleCallback
    ? (cb) => window.requestIdleCallback(cb)
    : (cb) => setTimeout(cb, 100);

  schedulePreload(() => {
    importFn().catch(() => {
      prefetchedRoutes.delete(normalized);
    });
  });
}

/**
 * React hook that returns onMouseEnter/onFocus props to trigger prefetching.
 *
 * @param {string} path - Route path to prefetch
 * @returns {{ onMouseEnter: Function, onFocus: Function }}
 */
export function usePrefetchOnHover(path) {
  const prefetched = useRef(false);

  const handlePrefetch = useCallback(() => {
    if (!prefetched.current) {
      prefetched.current = true;
      prefetchRoute(path);
    }
  }, [path]);

  return {
    onMouseEnter: handlePrefetch,
    onFocus: handlePrefetch,
  };
}

/**
 * Prefetch multiple routes at once (e.g., after initial page load).
 * Uses requestIdleCallback to avoid blocking the main thread.
 *
 * @param {string[]} paths - Array of route paths
 */
export function prefetchRoutes(paths) {
  if (typeof window === 'undefined') return;
  const schedulePreload = window.requestIdleCallback
    ? (cb) => window.requestIdleCallback(cb)
    : (cb) => setTimeout(cb, 200);

  schedulePreload(() => {
    paths.forEach((path) => prefetchRoute(path));
  });
}

export default { prefetchRoute, prefetchRoutes, usePrefetchOnHover };
