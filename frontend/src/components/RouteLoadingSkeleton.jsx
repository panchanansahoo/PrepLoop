import React from 'react';
import { RouteAwareSkeleton } from './skeletons';

/**
 * Route-aware loading skeleton for Suspense transitions.
 *
 * Picks the correct skeleton layout based on the current URL path.
 * Falls back to a minimal spinner for paths without a dedicated skeleton.
 *
 * Wrapped in a delayed fade-in (150ms) so fast navigations avoid flicker.
 */
const RouteLoadingSkeleton = () => (
  <div style={{
    opacity: 0,
    animation: 'skeletonFadeIn 0.3s ease 0.15s forwards',
  }}>
    <RouteAwareSkeleton />

    <style>{`
      @keyframes skeletonFadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `}</style>
  </div>
);

export default RouteLoadingSkeleton;
