/**
 * Reusable Skeleton Screen Components (Barrel Export)
 *
 * Named exports for all skeleton components:
 * - Primitive bones: Bone, CircleBone
 * - Page-level skeletons: DashboardSkeleton, ProblemListSkeleton, etc.
 * - Route-aware wrapper: RouteAwareSkeleton
 *
 * Import as: import { Bone, DashboardSkeleton } from './components/skeletons/index.jsx'
 * Or shorter: import { Bone } from './components/skeletons'
 *
 * Shimmer-effect loading placeholders that match page layouts
 * to eliminate content layout shift (CLS) and improve perceived performance.
 */

import React from 'react';

// ============================================================
// Base shimmer CSS (inject once)
// ============================================================
const shimmerStyles = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .skeleton-bone {
    background: linear-gradient(90deg, 
      rgba(255,255,255,0.04) 25%, 
      rgba(255,255,255,0.08) 50%, 
      rgba(255,255,255,0.04) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    border-radius: 8px;
  }
  .skeleton-container {
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto;
  }
  .skeleton-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
  }
  .skeleton-grid {
    display: grid;
    gap: 16px;
  }
  .skeleton-flex {
    display: flex;
    gap: 16px;
    align-items: center;
  }
`;

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = shimmerStyles;
  document.head.appendChild(style);
  stylesInjected = true;
}

// ============================================================
// Primitive skeleton elements
// ============================================================

export function Bone({ width = '100%', height = 16, borderRadius = 8, style = {} }) {
  injectStyles();
  return (
    <div
      className="skeleton-bone"
      role="presentation"
      aria-hidden="true"
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
        ...style,
      }}
    />
  );
}

export function CircleBone({ size = 40, style = {} }) {
  return <Bone width={size} height={size} borderRadius="50%" style={style} />;
}

// ============================================================
// Page-level skeleton screens
// ============================================================

export function DashboardSkeleton() {
  injectStyles();
  return (
    <div className="skeleton-container" role="status" aria-label="Loading dashboard">
      {/* Header */}
      <div className="skeleton-flex" style={{ marginBottom: 32 }}>
        <CircleBone size={48} />
        <div style={{ flex: 1 }}>
          <Bone width={200} height={24} style={{ marginBottom: 8 }} />
          <Bone width={300} height={14} />
        </div>
      </div>

      {/* Stats cards */}
      <div className="skeleton-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 24 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card">
            <Bone width={80} height={12} style={{ marginBottom: 12 }} />
            <Bone width={120} height={32} style={{ marginBottom: 8 }} />
            <Bone width={60} height={12} />
          </div>
        ))}
      </div>

      {/* Activity chart */}
      <div className="skeleton-card" style={{ height: 200, marginBottom: 24 }}>
        <Bone width={150} height={18} style={{ marginBottom: 16 }} />
        <Bone width="100%" height={140} />
      </div>

      {/* Recent activity */}
      <Bone width={180} height={20} style={{ marginBottom: 16 }} />
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-flex">
            <CircleBone size={36} />
            <div style={{ flex: 1 }}>
              <Bone width="60%" height={16} style={{ marginBottom: 6 }} />
              <Bone width="40%" height={12} />
            </div>
            <Bone width={80} height={14} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProblemListSkeleton() {
  injectStyles();
  return (
    <div className="skeleton-container" role="status" aria-label="Loading problems">
      <Bone width={250} height={28} style={{ marginBottom: 24 }} />

      {/* Filter bar */}
      <div className="skeleton-flex" style={{ marginBottom: 24 }}>
        <Bone width={200} height={36} />
        <Bone width={150} height={36} />
        <Bone width={150} height={36} />
      </div>

      {/* Problem list */}
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-flex">
            <Bone width={50} height={20} />
            <div style={{ flex: 1 }}>
              <Bone width="70%" height={18} style={{ marginBottom: 6 }} />
              <Bone width="40%" height={12} />
            </div>
            <Bone width={60} height={24} borderRadius={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function InterviewSkeleton() {
  injectStyles();
  return (
    <div className="skeleton-container" role="status" aria-label="Loading interview">
      {/* Interview header */}
      <div className="skeleton-card" style={{ marginBottom: 24 }}>
        <Bone width={300} height={28} style={{ marginBottom: 12 }} />
        <div className="skeleton-flex">
          <Bone width={100} height={14} />
          <Bone width={100} height={14} />
          <Bone width={80} height={14} />
        </div>
      </div>

      {/* Main content area */}
      <div className="skeleton-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Question panel */}
        <div className="skeleton-card" style={{ minHeight: 400 }}>
          <Bone width={120} height={16} style={{ marginBottom: 16 }} />
          <Bone width="100%" height={16} style={{ marginBottom: 8 }} />
          <Bone width="90%" height={16} style={{ marginBottom: 8 }} />
          <Bone width="95%" height={16} style={{ marginBottom: 8 }} />
          <Bone width="70%" height={16} style={{ marginBottom: 24 }} />
          <Bone width="100%" height={200} />
        </div>

        {/* Response panel */}
        <div className="skeleton-card" style={{ minHeight: 400 }}>
          <Bone width={160} height={16} style={{ marginBottom: 16 }} />
          <Bone width="100%" height={300} />
          <div className="skeleton-flex" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
            <Bone width={100} height={36} borderRadius={18} />
            <Bone width={120} height={36} borderRadius={18} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  injectStyles();
  return (
    <div className="skeleton-container" role="status" aria-label="Loading profile">
      {/* Profile header */}
      <div className="skeleton-card" style={{ padding: 32, textAlign: 'center', marginBottom: 24 }}>
        <CircleBone size={80} style={{ margin: '0 auto 16px' }} />
        <Bone width={200} height={24} style={{ margin: '0 auto 8px' }} />
        <Bone width={300} height={14} style={{ margin: '0 auto 16px' }} />
        <div className="skeleton-flex" style={{ justifyContent: 'center' }}>
          <Bone width={80} height={32} borderRadius={16} />
          <Bone width={100} height={32} borderRadius={16} />
        </div>
      </div>

      {/* Stats grid */}
      <div className="skeleton-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-card" style={{ textAlign: 'center' }}>
            <Bone width={40} height={32} style={{ margin: '0 auto 8px' }} />
            <Bone width={80} height={14} style={{ margin: '0 auto' }} />
          </div>
        ))}
      </div>

      {/* Content sections */}
      {[1, 2].map((i) => (
        <div key={i} className="skeleton-card" style={{ marginBottom: 16 }}>
          <Bone width={150} height={20} style={{ marginBottom: 16 }} />
          <Bone width="100%" height={14} style={{ marginBottom: 8 }} />
          <Bone width="80%" height={14} style={{ marginBottom: 8 }} />
          <Bone width="90%" height={14} />
        </div>
      ))}
    </div>
  );
}

export function GenericCardSkeleton({ count = 3 }) {
  injectStyles();
  return (
    <div className="skeleton-container" role="status" aria-label="Loading content">
      <Bone width={200} height={24} style={{ marginBottom: 24 }} />
      <div className="skeleton-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="skeleton-card">
            <Bone width="100%" height={140} style={{ marginBottom: 16 }} />
            <Bone width="80%" height={18} style={{ marginBottom: 8 }} />
            <Bone width="60%" height={14} style={{ marginBottom: 12 }} />
            <div className="skeleton-flex">
              <CircleBone size={24} />
              <Bone width={100} height={12} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Route-aware skeleton that picks the right skeleton by path
// ============================================================

const ROUTE_SKELETONS = {
  '/dashboard': DashboardSkeleton,
  '/overview': DashboardSkeleton,
  '/problems': ProblemListSkeleton,
  '/dsa-path': ProblemListSkeleton,
  '/ai-interview': InterviewSkeleton,
  '/interview': InterviewSkeleton,
  '/profile': ProfileSkeleton,
  '/settings': ProfileSkeleton,
};

export function RouteAwareSkeleton({ pathname }) {
  const normalizedPath = '/' + (pathname || window.location.pathname).split('/').filter(Boolean)[0];
  const SkeletonComponent = ROUTE_SKELETONS[normalizedPath] || GenericCardSkeleton;
  return <SkeletonComponent />;
}
