import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import './roadmap-index.css';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Code2,
  GitBranch,
  Globe2,
  Layers,
  Network,
  Sparkles,
} from 'lucide-react';

import useRoadmapProgress from '../hooks/useRoadmapProgress';
import {
  dsaCatalogPatterns,
  dsaRoadmapHierarchy,
  languageCatalogPatterns,
  languageRoadmapHierarchy,
  roadmapTrackConfigs,
  systemDesignCatalogPatterns,
  systemDesignRoadmapHierarchy,
  webDevCatalogPatterns,
  webDevRoadmapHierarchy,
} from '../data/roadmapCatalog';

const TRACKS = [
  {
    key: 'dsa',
    code: 'R-01',
    title: 'DSA Mastery',
    tagline: 'Pattern-first problem solving under interview pressure.',
    accent: '#8b5cf6',
    accentRgb: '139, 92, 246',
    icon: BrainCircuit,
    hierarchy: dsaRoadmapHierarchy,
    patterns: dsaCatalogPatterns,
    config: roadmapTrackConfigs.dsa,
    notes: ['Arrays → Graphs', 'Pattern recall', 'Timed reps'],
  },
  {
    key: 'language',
    code: 'R-02',
    title: 'Language Core',
    tagline: 'Turn syntax familiarity into runtime intuition.',
    accent: '#38bdf8',
    accentRgb: '56, 189, 248',
    icon: Code2,
    hierarchy: languageRoadmapHierarchy,
    patterns: languageCatalogPatterns,
    config: roadmapTrackConfigs.language,
    notes: ['Memory models', 'Concurrency basics', 'Language depth'],
  },
  {
    key: 'system-design',
    code: 'R-03',
    title: 'System Design',
    tagline: 'Reason from constraints, trade-offs, and scale.',
    accent: '#f59e0b',
    accentRgb: '245, 158, 11',
    icon: Network,
    hierarchy: systemDesignRoadmapHierarchy,
    patterns: systemDesignCatalogPatterns,
    config: roadmapTrackConfigs['system-design'],
    notes: ['Capacity thinking', 'Architecture drills', 'Distributed systems'],
  },
  {
    key: 'web-dev',
    code: 'R-04',
    title: 'Web Development',
    tagline: 'Connect frontend, backend, data, and delivery.',
    accent: '#34d399',
    accentRgb: '52, 211, 153',
    icon: Globe2,
    hierarchy: webDevRoadmapHierarchy,
    patterns: webDevCatalogPatterns,
    config: roadmapTrackConfigs['web-dev'],
    notes: ['Frontend systems', 'Backend flows', 'Production readiness'],
  },
];

function countTopLevelSections(hierarchy = []) {
  return hierarchy.length;
}

function countProblems(patterns = []) {
  return patterns.reduce((sum, pattern) => sum + (pattern.problems?.length || 0), 0);
}

function formatCount(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

/* ─── Track Card ─── */
function RouteCard({ track }) {
  const { guideProgressById, completedGuideCount } = useRoadmapProgress(track.config.trackKey, track.patterns);
  const totalGuides = track.patterns.length;
  const totalProblems = countProblems(track.patterns);
  const solvedProblems = Array.from(guideProgressById.values()).reduce(
    (sum, guide) => sum + guide.solvedCount,
    0
  );
  const guideProgress = totalGuides > 0 ? Math.round((completedGuideCount / totalGuides) * 100) : 0;
  const Icon = track.icon;
  const hasStarted = completedGuideCount > 0;

  return (
    <Link
      to={track.config.path}
      className="ri-card group"
      style={{
        '--card-accent': track.accent,
        '--card-accent-rgb': track.accentRgb,
      }}
    >
      {/* Ambient glow */}
      <div className="ri-card-glow" />

      {/* Accent left strip */}
      <div className="ri-card-strip" />

      {/* Large faded code watermark */}
      <div className="ri-card-watermark">{track.code}</div>

      {/* Content */}
      <div className="ri-card-body">
        {/* Top row: badge + icon */}
        <div className="ri-card-top">
          <div className="ri-card-badges">
            <span className="ri-card-code">{track.code}</span>
            <span className="ri-card-kicker">{track.config.kicker}</span>
          </div>
          <div className="ri-card-icon">
            <Icon size={22} />
          </div>
        </div>

        {/* Title + tagline */}
        <div className="ri-card-heading">
          <h2>{track.title}</h2>
          <p>{track.tagline}</p>
        </div>

        {/* Progress bar */}
        <div className="ri-card-progress-section">
          <div className="ri-card-progress-header">
            <span>Route progress</span>
            <span>{guideProgress}%</span>
          </div>
          <div className="ri-card-progress-track">
            <div
              className="ri-card-progress-fill"
              style={{ width: `${Math.max(guideProgress, 2)}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="ri-card-stats">
          <div className="ri-card-stat">
            <div className="ri-card-stat-val">{formatCount(countTopLevelSections(track.hierarchy))}</div>
            <div className="ri-card-stat-label">Sections</div>
          </div>
          <div className="ri-card-stat">
            <div className="ri-card-stat-val">{formatCount(totalGuides)}</div>
            <div className="ri-card-stat-label">Guides</div>
          </div>
          <div className="ri-card-stat">
            <div className="ri-card-stat-val">{formatCount(totalProblems)}</div>
            <div className="ri-card-stat-label">Reps</div>
          </div>
        </div>

        {/* Notes */}
        <div className="ri-card-notes">
          {track.notes.map((note) => (
            <div key={note} className="ri-card-note">
              <span className="ri-card-note-dot" />
              <span>{note}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="ri-card-footer">
          <div className="ri-card-footer-meta">
            <div className="ri-card-footer-line">
              <CheckCircle2 size={14} />
              <span>{formatCount(completedGuideCount)} / {formatCount(totalGuides)} guides</span>
            </div>
            <div className="ri-card-footer-solved">
              {formatCount(solvedProblems)} / {formatCount(totalProblems)} reps solved
            </div>
          </div>
          <div className="ri-card-cta">
            <span>{hasStarted ? 'Continue' : 'Start'}</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Overall Progress Ring ─── */
function OverallProgressRing({ tracks }) {
  // Gather progress from all tracks
  const allProgress = tracks.map((track) => {
    const total = track.patterns.length;
    return { total };
  });
  const totalGuides = allProgress.reduce((sum, p) => sum + p.total, 0);
  // We can't easily call hooks per track here, so show total guides as the ring
  // This is a visual element showing the scope
  const circumference = 2 * Math.PI * 24;
  const dashOffset = circumference * 0.75; // visual placeholder at 25%

  return (
    <div className="ri-hero-progress-ring">
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle
          cx="32" cy="32" r="24"
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
      <div className="ri-hero-progress-ring-value">{totalGuides}</div>
    </div>
  );
}

/* ─── Index Page ─── */
export default function RoadmapIndex() {
  const totalTracks = TRACKS.length;
  const totalGuides = TRACKS.reduce((sum, track) => sum + track.patterns.length, 0);
  const totalProblems = TRACKS.reduce((sum, track) => sum + countProblems(track.patterns), 0);

  return (
    <div className="ri-page">
      {/* Atmospheric background */}
      <div className="ri-atmosphere" aria-hidden="true">
        <span className="ri-atmo-glow ri-atmo-glow-a" />
        <span className="ri-atmo-glow ri-atmo-glow-b" />
        <span className="ri-atmo-glow ri-atmo-glow-c" />
        <span className="ri-atmo-grid" />
        <span className="ri-atmo-noise" />
        <span className="ri-atmo-vignette" />
      </div>

      <div className="ri-content">
        {/* ── Hero ── */}
        <section className="ri-hero">
          <div className="ri-hero-chip">
            <Layers size={14} />
            <span>Learning Roadmaps</span>
          </div>

          <h1 className="ri-hero-title">
            Choose a route<br />
            <span className="ri-hero-title-gradient">worth finishing.</span>
          </h1>

          <p className="ri-hero-subtitle">
            Not category cards — structured learning routes with sequence, reps, and completion
            built in. Pick what matters now.
          </p>

          {/* Overall Progress Ring */}
          <OverallProgressRing tracks={TRACKS} />

          {/* Summary stats */}
          <div className="ri-hero-stats">
            <div className="ri-hero-stat">
              <Sparkles size={15} className="ri-hero-stat-icon" />
              <strong>{formatCount(totalTracks)}</strong>
              <span>Tracks</span>
            </div>
            <div className="ri-hero-stat-divider" />
            <div className="ri-hero-stat">
              <GitBranch size={15} className="ri-hero-stat-icon" />
              <strong>{formatCount(totalGuides)}</strong>
              <span>Guides</span>
            </div>
            <div className="ri-hero-stat-divider" />
            <div className="ri-hero-stat">
              <BookOpen size={15} className="ri-hero-stat-icon" />
              <strong>{formatCount(totalProblems)}</strong>
              <span>Practice reps</span>
            </div>
          </div>
        </section>

        {/* ── Track Cards Grid ── */}
        <section className="ri-grid">
          {TRACKS.map((track) => (
            <RouteCard key={track.key} track={track} />
          ))}
        </section>

        <section className="ri-specials">
          <Link to="/advanced-learning-path" className="ri-special-card">
            <div className="ri-special-icon">
              <Sparkles size={18} />
            </div>
            <div className="ri-special-body">
              <div className="ri-special-kicker">Power Tool</div>
              <h3>AI Advanced Roadmap Planner</h3>
              <p>
                Build date-wise preparation plans across DSA, Aptitude, SQL, and System Design with
                confidence scoring, rescheduling, and calendar exports.
              </p>
            </div>
            <div className="ri-special-cta">
              <span>Open Planner</span>
              <ArrowUpRight size={14} />
            </div>
          </Link>
        </section>
      </div>
    </div>
  );
}
