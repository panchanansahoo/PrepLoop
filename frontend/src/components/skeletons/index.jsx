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
// Additional page-level skeletons
// ============================================================

export function CodingPlaygroundSkeleton() {
  injectStyles();
  return (
    <div className="skeleton-container" role="status" aria-label="Loading code editor" style={{ maxWidth: '100%', padding: 0 }}>
      {/* Top toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Bone width={140} height={32} borderRadius={6} />
        <Bone width={120} height={32} borderRadius={6} />
        <div style={{ flex: 1 }} />
        <Bone width={80} height={32} borderRadius={6} />
        <Bone width={90} height={32} borderRadius={6} />
      </div>

      {/* Split pane: problem description + code editor */}
      <div style={{ display: 'flex', height: 'calc(100vh - 120px)' }}>
        {/* Left: Problem panel */}
        <div style={{ width: '40%', padding: 20, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <Bone width={200} height={24} style={{ marginBottom: 16 }} />
          <div className="skeleton-flex" style={{ marginBottom: 20, gap: 8 }}>
            <Bone width={60} height={22} borderRadius={11} />
            <Bone width={70} height={22} borderRadius={11} />
            <Bone width={80} height={22} borderRadius={11} />
          </div>
          {[1, 2, 3, 4, 5].map(i => (
            <Bone key={i} width={`${85 - i * 5}%`} height={14} style={{ marginBottom: 10 }} />
          ))}
          <Bone width="100%" height={100} style={{ marginTop: 20, marginBottom: 16 }} />
          <Bone width="90%" height={14} style={{ marginBottom: 8 }} />
          <Bone width="80%" height={14} />
        </div>

        {/* Right: Code editor area */}
        <div style={{ flex: 1, padding: 20 }}>
          <div className="skeleton-flex" style={{ marginBottom: 12, gap: 8 }}>
            <Bone width={90} height={28} borderRadius={6} />
            <Bone width={90} height={28} borderRadius={6} />
            <Bone width={90} height={28} borderRadius={6} />
          </div>
          <Bone width="100%" height="70%" style={{ marginBottom: 16 }} />
          <div className="skeleton-flex" style={{ justifyContent: 'flex-end', gap: 12 }}>
            <Bone width={100} height={36} borderRadius={8} />
            <Bone width={120} height={36} borderRadius={8} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function JobUpdatesSkeleton() {
  injectStyles();
  return (
    <div className="skeleton-container" role="status" aria-label="Loading job listings">
      {/* Header */}
      <Bone width={240} height={32} style={{ marginBottom: 8 }} />
      <Bone width={380} height={16} style={{ marginBottom: 28 }} />

      {/* Search + filters bar */}
      <div className="skeleton-flex" style={{ marginBottom: 24, gap: 12 }}>
        <Bone width={300} height={40} borderRadius={20} />
        <Bone width={120} height={40} borderRadius={8} />
        <Bone width={120} height={40} borderRadius={8} />
        <Bone width={100} height={40} borderRadius={8} />
      </div>

      {/* Job cards grid */}
      <div className="skeleton-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-flex" style={{ marginBottom: 12 }}>
              <CircleBone size={40} />
              <div style={{ flex: 1 }}>
                <Bone width="70%" height={18} style={{ marginBottom: 6 }} />
                <Bone width="50%" height={14} />
              </div>
            </div>
            <div className="skeleton-flex" style={{ marginBottom: 10, gap: 8 }}>
              <Bone width={70} height={20} borderRadius={10} />
              <Bone width={80} height={20} borderRadius={10} />
              <Bone width={60} height={20} borderRadius={10} />
            </div>
            <Bone width="100%" height={14} style={{ marginBottom: 6 }} />
            <Bone width="85%" height={14} style={{ marginBottom: 16 }} />
            <div className="skeleton-flex" style={{ justifyContent: 'space-between' }}>
              <Bone width={100} height={12} />
              <Bone width={80} height={30} borderRadius={15} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AIInterviewVideoSkeleton() {
  injectStyles();
  return (
    <div role="status" aria-label="Loading AI interview" style={{ width: '100%', height: '100vh', background: '#0a0a0f', padding: 0 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Bone width={120} height={20} />
        <div style={{ flex: 1 }} />
        <Bone width={60} height={24} borderRadius={12} />
        <Bone width={80} height={24} borderRadius={12} />
        <Bone width={40} height={24} borderRadius={12} />
        <div style={{ flex: 1 }} />
        <Bone width={90} height={32} borderRadius={8} />
      </div>

      {/* Main body: video + workspace */}
      <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
        {/* Video area (left 60%) */}
        <div style={{ flex: 6, position: 'relative', padding: 16 }}>
          {/* Interviewer video tile */}
          <div style={{ width: '100%', height: '75%', borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
            <Bone width="100%" height="100%" borderRadius={16} />
            {/* Name badge */}
            <div style={{ position: 'absolute', bottom: 16, left: 16 }}>
              <Bone width={160} height={24} borderRadius={12} />
            </div>
            {/* Status pill */}
            <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)' }}>
              <Bone width={120} height={28} borderRadius={14} />
            </div>
          </div>

          {/* User PIP tile */}
          <div style={{ position: 'absolute', bottom: 80, right: 32, width: 180, height: 135, borderRadius: 12, overflow: 'hidden' }}>
            <Bone width="100%" height="100%" borderRadius={12} />
          </div>

          {/* Controls bar */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <CircleBone key={i} size={44} />
            ))}
          </div>
        </div>

        {/* Workspace panel (right 40%) */}
        <div style={{ flex: 4, borderLeft: '1px solid rgba(255,255,255,0.06)', padding: 16 }}>
          {/* Tab bar */}
          <div className="skeleton-flex" style={{ marginBottom: 16, gap: 8 }}>
            <Bone width={70} height={30} borderRadius={6} />
            <Bone width={70} height={30} borderRadius={6} />
            <Bone width={70} height={30} borderRadius={6} />
          </div>
          {/* Code editor area */}
          <Bone width="100%" height="70%" style={{ marginBottom: 12 }} />
          {/* Input + submit */}
          <Bone width="100%" height={60} style={{ marginBottom: 12 }} />
          <div className="skeleton-flex" style={{ justifyContent: 'flex-end' }}>
            <Bone width={100} height={36} borderRadius={8} />
          </div>
        </div>
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
  '/ai-interview': AIInterviewVideoSkeleton,
  '/interview': InterviewSkeleton,
  '/interview-suite': InterviewSkeleton,
  '/profile': ProfileSkeleton,
  '/settings': ProfileSkeleton,
  '/coding-playground': CodingPlaygroundSkeleton,
  '/playground': CodingPlaygroundSkeleton,
  '/jobs': JobUpdatesSkeleton,
  '/job-updates': JobUpdatesSkeleton,
};

export function RouteAwareSkeleton({ pathname }) {
  const normalizedPath = '/' + (pathname || window.location.pathname).split('/').filter(Boolean)[0];
  const SkeletonComponent = ROUTE_SKELETONS[normalizedPath] || GenericCardSkeleton;
  return <SkeletonComponent />;
}
