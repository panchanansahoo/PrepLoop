import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Code2,
  GitBranch,
  Globe2,
  Map,
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
    glow: 'rgba(139, 92, 246, 0.24)',
    icon: BrainCircuit,
    hierarchy: dsaRoadmapHierarchy,
    patterns: dsaCatalogPatterns,
    config: roadmapTrackConfigs.dsa,
    layout: 'xl:col-span-7',
    notes: ['Arrays to graphs', 'Pattern recall', 'Timed reps'],
  },
  {
    key: 'language',
    code: 'R-02',
    title: 'Language Core',
    tagline: 'Turn syntax familiarity into runtime intuition.',
    accent: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.22)',
    icon: Code2,
    hierarchy: languageRoadmapHierarchy,
    patterns: languageCatalogPatterns,
    config: roadmapTrackConfigs.language,
    layout: 'xl:col-span-5',
    notes: ['Memory models', 'Concurrency basics', 'Language depth'],
  },
  {
    key: 'system-design',
    code: 'R-03',
    title: 'System Design',
    tagline: 'Reason from constraints, trade-offs, and scale.',
    accent: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.2)',
    icon: Network,
    hierarchy: systemDesignRoadmapHierarchy,
    patterns: systemDesignCatalogPatterns,
    config: roadmapTrackConfigs['system-design'],
    layout: 'xl:col-span-5',
    notes: ['Capacity thinking', 'Architecture drills', 'Distributed systems'],
  },
  {
    key: 'web-dev',
    code: 'R-04',
    title: 'Web Development',
    tagline: 'Connect frontend, backend, data, and delivery.',
    accent: '#34d399',
    glow: 'rgba(52, 211, 153, 0.2)',
    icon: Globe2,
    hierarchy: webDevRoadmapHierarchy,
    patterns: webDevCatalogPatterns,
    config: roadmapTrackConfigs['web-dev'],
    layout: 'xl:col-span-7',
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

function RouteCard({ track }) {
  const { guideProgressById, completedGuideCount } = useRoadmapProgress(track.config.trackKey, track.patterns);
  const totalGuides = track.patterns.length;
  const totalProblems = countProblems(track.patterns);
  const solvedProblems = Array.from(guideProgressById.values()).reduce(
    (sum, guide) => sum + guide.solvedCount,
    0
  );
  const guideProgress = totalGuides > 0 ? Math.round((completedGuideCount / totalGuides) * 100) : 0;
  const problemProgress = totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0;
  const Icon = track.icon;

  return (
    <Link
      to={track.config.path}
      className={`group relative block min-h-[380px] overflow-hidden rounded-[34px] border border-white/70 bg-white/72 p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1.5 hover:border-white hover:shadow-[0_28px_80px_rgba(79,70,229,0.16)] ${track.layout}`}
      style={{
        boxShadow: `0 24px 70px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.82), 0 0 0 1px ${track.glow}`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at top right, ${track.glow}, transparent 35%),
            linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.28) 32%, rgba(255,255,255,0.14) 100%)
          `,
        }}
      />
      <div
        className="pointer-events-none absolute -left-12 -top-16 h-40 w-40 rounded-full blur-3xl"
        style={{ backgroundColor: track.glow }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px]"
        style={{ background: `linear-gradient(180deg, ${track.accent}, transparent 88%)` }}
      />
      <div
        className="pointer-events-none absolute -right-5 top-2 text-[5.5rem] font-semibold tracking-[-0.08em] text-slate-200/55 sm:text-[7rem]"
      >
        {track.code}
      </div>

      <div className="relative z-10 flex h-full flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] shadow-sm"
                style={{
                  borderColor: `${track.accent}40`,
                  background: `linear-gradient(135deg, ${track.accent}14, rgba(255,255,255,0.8))`,
                  color: track.accent,
                }}
              >
                {track.code}
              </span>
              <span className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                {track.config.kicker}
              </span>
            </div>

            <div>
              <h2 className="max-w-[12ch] text-[2.2rem] font-semibold leading-[0.92] tracking-[-0.07em] text-slate-950 sm:text-[2.8rem]">
                {track.title}
              </h2>
              <p className="mt-3 max-w-[38ch] text-sm leading-6 text-slate-600 sm:text-[0.95rem]">
                {track.tagline}
              </p>
            </div>
          </div>

          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
            style={{
              borderColor: `${track.accent}30`,
              background: `linear-gradient(145deg, rgba(255,255,255,0.92), ${track.accent}16)`,
            }}
          >
            <Icon size={24} style={{ color: track.accent }} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1.25fr)_220px]">
          <div className="rounded-[26px] border border-white/80 bg-white/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-slate-400">
              <span>Route progress</span>
              <span>{guideProgress}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/80">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${guideProgress}%`,
                  background: `linear-gradient(90deg, ${track.accent}, rgba(255,255,255,0.92))`,
                }}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Sections</div>
                <div className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                  {formatCount(countTopLevelSections(track.hierarchy))}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Guides</div>
                <div className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                  {formatCount(totalGuides)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Reps</div>
                <div className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                  {formatCount(totalProblems)}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,255,0.78))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Best used for</div>
            <div className="mt-3 space-y-2">
              {track.notes.map((note) => (
                <div key={note} className="flex items-center gap-2 text-sm text-slate-600">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: track.accent, boxShadow: `0 0 18px ${track.accent}` }}
                  />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2 size={15} style={{ color: track.accent }} />
              <span>
                {formatCount(completedGuideCount)} / {formatCount(totalGuides)} guides complete
              </span>
            </div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
              {problemProgress}% of practice steps cleared
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-slate-900">Open roadmap</div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                {formatCount(solvedProblems)} / {formatCount(totalProblems)} reps solved
              </div>
            </div>
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full border transition duration-300 group-hover:translate-x-1"
              style={{
                borderColor: `${track.accent}30`,
                background: `linear-gradient(135deg, rgba(255,255,255,0.92), ${track.accent}16)`,
                color: track.accent,
              }}
            >
              <ArrowUpRight size={18} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function RoadmapIndex() {
  const totalTracks = TRACKS.length;
  const totalGuides = TRACKS.reduce((sum, track) => sum + track.patterns.length, 0);
  const totalProblems = TRACKS.reduce((sum, track) => sum + countProblems(track.patterns), 0);

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[#f6f8fc] text-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,_rgba(139,92,246,0.14),_transparent_28%),radial-gradient(circle_at_86%_18%,_rgba(56,189,248,0.14),_transparent_22%),radial-gradient(circle_at_50%_100%,_rgba(245,158,11,0.08),_transparent_28%),linear-gradient(180deg,_#fbfcff_0%,_#f2f6fb_48%,_#edf3f8_100%)]" />
        <div className="absolute inset-0 opacity-[0.3] [background-image:linear-gradient(rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_45%,_rgba(148,163,184,0.08)_100%)]" />
        <div className="absolute left-[8%] top-[8%] h-56 w-56 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="absolute bottom-[12%] right-[10%] h-64 w-64 rounded-full bg-cyan-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-5 py-12 sm:px-8 lg:px-10">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px] xl:items-start">
          <div className="relative overflow-hidden rounded-[38px] border border-white/80 bg-white/72 p-6 shadow-[0_30px_90px_rgba(79,70,229,0.10)] backdrop-blur-xl sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.72),rgba(255,255,255,0.34)_44%,rgba(124,58,237,0.04)_100%)]" />
            <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-violet-200/40 blur-3xl" />
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/82 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-slate-700 shadow-sm">
                <Map size={14} />
                Roadmap Control
              </div>
              <div className="bg-[linear-gradient(90deg,#4f46e5,#7c3aed,#0891b2)] bg-clip-text text-[11px] font-semibold uppercase tracking-[0.22em] text-transparent">
                Premium route-board aesthetic
              </div>
            </div>

            <div className="relative z-10 mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div>
                <h1 className="max-w-4xl font-[var(--font-display)] text-5xl font-semibold leading-[0.9] tracking-[-0.085em] text-slate-950 sm:text-6xl lg:text-[5.3rem]">
                  Choose a route
                  <br />
                  that feels worth finishing.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  These are not category cards. They are learning routes with sequence, reps, and
                  completion built in. Pick the lane that matters now and let the roadmap make the next
                  move obvious.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/86 px-4 py-2 text-sm text-slate-700 shadow-sm">
                    <Sparkles size={14} className="text-violet-500" />
                    Premium track layouts
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/86 px-4 py-2 text-sm text-slate-700 shadow-sm">
                    <CheckCircle2 size={14} className="text-cyan-600" />
                    Live progress cues
                  </div>
                </div>
              </div>

              <div className="rounded-[30px] border border-white/90 bg-white/78 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Route board</div>
                <div className="mt-4 space-y-4">
                  {TRACKS.map((track) => (
                    <div key={track.key} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex min-w-[52px] justify-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
                          style={{
                            borderColor: `${track.accent}30`,
                            backgroundColor: `${track.accent}12`,
                            color: track.accent,
                          }}
                        >
                          {track.code}
                        </span>
                        <span className="text-slate-700">{track.title}</span>
                      </div>
                      <span className="text-slate-400">{track.config.kicker}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-[22px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(79,70,229,0.08),rgba(8,145,178,0.06),rgba(255,255,255,0.8))] p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Why this page works
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    It shows sequence, scale, and progress in one glance so each route feels like a serious product, not a list of links.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-white/90 bg-white/78 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  <Sparkles size={14} />
                  Tracks
                </div>
                <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                  {formatCount(totalTracks)}
                </div>
              </div>
              <div className="rounded-[24px] border border-white/90 bg-white/78 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  <GitBranch size={14} />
                  Guides
                </div>
                <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                  {formatCount(totalGuides)}
                </div>
              </div>
              <div className="rounded-[24px] border border-white/90 bg-white/78 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  <BookOpen size={14} />
                  Practice reps
                </div>
                <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                  {formatCount(totalProblems)}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[38px] border border-white/90 bg-white/78 p-6 shadow-[0_24px_70px_rgba(8,145,178,0.08)] backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">
              <Sparkles size={14} className="text-amber-300" />
              Use the map well
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-[24px] border border-white/90 bg-white/82 p-4 shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
                <div className="text-sm font-semibold text-slate-900">1. Pick one route</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Choose the route that closes your biggest interview gap first. Breadth comes later.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/90 bg-white/82 p-4 shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
                <div className="text-sm font-semibold text-slate-900">2. Stay in sequence</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The order is the product. Follow the route instead of collecting disconnected topics.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/90 bg-white/82 p-4 shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
                <div className="text-sm font-semibold text-slate-900">3. Use reps as proof</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Completion is not aesthetic. It means you have turned a concept into working recall.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-12">
          {TRACKS.map((track) => (
            <RouteCard key={track.key} track={track} />
          ))}
        </section>
      </div>
    </div>
  );
}
