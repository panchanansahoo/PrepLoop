import React from 'react';

/**
 * A lightweight loading skeleton for Suspense route transitions.
 * Uses pure CSS animation — no canvas, no particles, instant mount.
 */
const RouteLoadingSkeleton = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '20px',
    opacity: 0,
    animation: 'skeletonFadeIn 0.3s ease 0.15s forwards',
  }}>
    {/* Spinner ring */}
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid rgba(139, 92, 246, 0.12)',
      borderTop: '3px solid #a78bfa',
      borderRadius: '50%',
      animation: 'skeletonSpin 0.8s linear infinite',
    }} />

    {/* Shimmer bar */}
    <div style={{
      width: '120px',
      height: '4px',
      borderRadius: '2px',
      background: 'rgba(139, 92, 246, 0.1)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.4), transparent)',
        animation: 'skeletonShimmer 1.2s ease-in-out infinite',
      }} />
    </div>

    <style>{`
      @keyframes skeletonFadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes skeletonSpin {
        to { transform: rotate(360deg); }
      }
      @keyframes skeletonShimmer {
        0%   { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `}</style>
  </div>
);

export default RouteLoadingSkeleton;
