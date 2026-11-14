import React, { useMemo, useState } from 'react';
import {
  Brain,
  Code2,
  MessageSquare,
  Network,
  Info,
  TrendingUp,
  Award,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

/**
 * Standard rubric definitions mapping questions and skills to the 4 core competencies.
 */
export const COMPETENCY_DEFINITIONS = {
  problem_solving: {
    key: 'problem_solving',
    name: 'Problem Solving',
    shortName: 'Problem Solving',
    icon: Brain,
    color: '#818cf8',
    gradient: 'rgba(129, 140, 248, 0.35)',
    defaultWeight: 30,
    description: 'Algorithmic reasoning, edge-case mitigation, structured logic, and computational complexity optimization.',
    keywords: [
      'algorithm', 'array', 'string', 'tree', 'graph', 'dp', 'dynamic programming',
      'complexity', 'optimize', 'sort', 'binary search', 'hash', 'recursion',
      'edge case', 'problem-solving', 'logic', 'dsa', 'math', 'sliding window',
    ],
  },
  technical_depth: {
    key: 'technical_depth',
    name: 'Technical Depth',
    shortName: 'Tech Depth',
    icon: Code2,
    color: '#38bdf8',
    gradient: 'rgba(56, 189, 248, 0.35)',
    defaultWeight: 30,
    description: 'Framework mastery, execution internals, language idioms, type safety, and memory management.',
    keywords: [
      'react', 'node', 'javascript', 'typescript', 'async', 'event loop', 'promise',
      'memory', 'closure', 'hook', 'state', 'sql', 'indexing', 'nosql', 'orm',
      'concurrency', 'threading', 'api', 'syntax', 'backend', 'frontend',
    ],
  },
  communication: {
    key: 'communication',
    name: 'Communication',
    shortName: 'Communication',
    icon: MessageSquare,
    color: '#34d399',
    gradient: 'rgba(52, 211, 153, 0.35)',
    defaultWeight: 20,
    description: 'Articulate technical trade-offs, structured explanation (STAR), clarity, and collaborative responsiveness.',
    keywords: [
      'behavioral', 'star', 'conflict', 'team', 'leadership', 'clarif',
      'trade-off', 'articulate', 'presentation', 'stakeholder', 'communication',
      'explain', 'feedback', 'culture', 'values', 'collaboration', 'ownership',
    ],
  },
  system_architecture: {
    key: 'system_architecture',
    name: 'System Architecture',
    shortName: 'Architecture',
    icon: Network,
    color: '#f472b6',
    gradient: 'rgba(244, 114, 182, 0.35)',
    defaultWeight: 20,
    description: 'Distributed design, scalability, caching patterns, resilient data stores, and high-availability trade-offs.',
    keywords: [
      'system design', 'architecture', 'microservice', 'scalability', 'cache',
      'redis', 'load balancer', 'kafka', 'queue', 'database design', 'cdn',
      'sharding', 'replication', 'distributed', 'fault tolerance', 'latency',
      'throughput', 'high availability', 'failover',
    ],
  },
};

/**
 * Maps question breakdown and responses to the 4 weighted competencies.
 *
 * @param {object} params
 * @param {Array} params.breakdown - Array of per-question scores and topics
 * @param {number} params.overallScore - Candidate overall score (0-100)
 * @param {object} [params.customScores] - Explicitly provided rubric scores
 * @param {object} [params.weights] - Custom rubric weights (defaults to 30/30/20/20)
 * @param {number} [params.targetPassingScore=70]
 * @returns {Array} Array of 4 competency objects with scores, weights, and ratings
 */
export function calculateCompetencies({
  breakdown = [],
  overallScore = 70,
  customScores = null,
  weights = null,
  targetPassingScore = 70,
}) {
  const baseScore = Math.max(0, Math.min(100, Math.round(Number(overallScore) || 70)));
  const effectiveWeights = {
    problem_solving: weights?.problem_solving ?? COMPETENCY_DEFINITIONS.problem_solving.defaultWeight,
    technical_depth: weights?.technical_depth ?? COMPETENCY_DEFINITIONS.technical_depth.defaultWeight,
    communication: weights?.communication ?? COMPETENCY_DEFINITIONS.communication.defaultWeight,
    system_architecture: weights?.system_architecture ?? COMPETENCY_DEFINITIONS.system_architecture.defaultWeight,
  };

  // If explicit custom scores were provided in submission metadata
  if (customScores && typeof customScores === 'object') {
    return Object.keys(COMPETENCY_DEFINITIONS).map((key) => {
      const def = COMPETENCY_DEFINITIONS[key];
      const rawVal =
        customScores[key] ??
        customScores[def.name] ??
        customScores[key.replace('_', '')] ??
        baseScore;
      const score = Math.max(0, Math.min(100, Math.round(Number(rawVal) || baseScore)));
      return formatCompetencyItem(def, score, effectiveWeights[key], targetPassingScore, []);
    });
  }

  // If breakdown array has question items, map each question to competencies
  if (Array.isArray(breakdown) && breakdown.length > 0) {
    const scoresAccum = {
      problem_solving: { total: 0, weightSum: 0, topics: [] },
      technical_depth: { total: 0, weightSum: 0, topics: [] },
      communication: { total: 0, weightSum: 0, topics: [] },
      system_architecture: { total: 0, weightSum: 0, topics: [] },
    };

    breakdown.forEach((q, idx) => {
      const qScore = Math.max(0, Math.min(100, Math.round(Number(q.score) || baseScore)));
      const textToScan = `${q.question || ''} ${q.category || ''} ${(q.coveredTopics || []).join(' ')} ${(q.missedTopics || []).join(' ')}`.toLowerCase();

      // Check keyword hits for each competency
      const matches = {};
      let totalMatches = 0;

      for (const [key, def] of Object.entries(COMPETENCY_DEFINITIONS)) {
        const hits = def.keywords.filter((kw) => textToScan.includes(kw));
        matches[key] = hits.length;
        totalMatches += hits.length;
        if (hits.length > 0) {
          scoresAccum[key].topics.push(...(q.coveredTopics || []).slice(0, 2));
        }
      }

      // If no specific keywords matched, distribute evenly across general technical rubrics
      if (totalMatches === 0) {
        matches.problem_solving = 1;
        matches.technical_depth = 1;
        matches.communication = 1;
        totalMatches = 3;
      }

      for (const key of Object.keys(COMPETENCY_DEFINITIONS)) {
        if (matches[key] > 0) {
          const affinity = matches[key] / totalMatches;
          scoresAccum[key].total += qScore * affinity;
          scoresAccum[key].weightSum += affinity;
        }
      }
    });

    return Object.keys(COMPETENCY_DEFINITIONS).map((key) => {
      const def = COMPETENCY_DEFINITIONS[key];
      const accum = scoresAccum[key];
      let computedScore = accum.weightSum > 0
        ? Math.round(accum.total / accum.weightSum)
        : baseScore;

      // Small realistic baseline stabilization
      computedScore = Math.max(0, Math.min(100, computedScore));
      const uniqueTopics = [...new Set(accum.topics)].slice(0, 4);

      return formatCompetencyItem(def, computedScore, effectiveWeights[key], targetPassingScore, uniqueTopics);
    });
  }

  // Default synthetic fallback anchored to overall score with realistic distribution
  const offsets = {
    problem_solving: +2,
    technical_depth: +4,
    communication: -3,
    system_architecture: -1,
  };

  return Object.keys(COMPETENCY_DEFINITIONS).map((key) => {
    const def = COMPETENCY_DEFINITIONS[key];
    const score = Math.max(10, Math.min(99, baseScore + (offsets[key] || 0)));
    return formatCompetencyItem(def, score, effectiveWeights[key], targetPassingScore, []);
  });
}

function formatCompetencyItem(def, score, weight, targetPassingScore, topics) {
  let level = 'Needs Focus';
  let levelColor = '#f43f5e';

  if (score >= 85) {
    level = 'Mastery / Advanced';
    levelColor = '#10b981';
  } else if (score >= targetPassingScore) {
    level = 'Proficient';
    levelColor = '#38bdf8';
  } else if (score >= targetPassingScore - 15) {
    level = 'Developing';
    levelColor = '#f59e0b';
  }

  const deltaVsTarget = score - targetPassingScore;

  return {
    key: def.key,
    name: def.name,
    shortName: def.shortName,
    icon: def.icon,
    color: def.color,
    gradient: def.gradient,
    score,
    weight,
    level,
    levelColor,
    deltaVsTarget,
    description: def.description,
    topics,
  };
}

/**
 * CompetencyRadarChart
 *
 * Renders an interactive 4-axis SVG radar/spider chart comparing candidate competencies
 * against target hiring benchmarks, accompanied by weighted rubric cards.
 */
export function CompetencyRadarChart({
  breakdown = [],
  overallScore = 75,
  customScores = null,
  targetScore = 70,
  cohortAverages = null,
  className = '',
}) {
  const [activeCompetency, setActiveCompetency] = useState(null);

  const competencies = useMemo(() => {
    return calculateCompetencies({
      breakdown,
      overallScore,
      customScores,
      targetPassingScore: targetScore,
    });
  }, [breakdown, overallScore, customScores, targetScore]);

  // Radar chart geometry configuration
  const size = 320;
  const center = size / 2;
  const radius = 110;
  const levels = [0.25, 0.5, 0.75, 1.0];

  // 4 Axes angles: Top (-90°), Right (0°), Bottom (90°), Left (180°)
  const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];

  // Calculate polygon coordinates for Candidate
  const candidatePoints = competencies.map((comp, idx) => {
    const angle = angles[idx];
    const r = (comp.score / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, score: comp.score, key: comp.key, name: comp.name };
  });

  const candidatePolygonString = candidatePoints.map((p) => `${p.x},${p.y}`).join(' ');

  // Calculate polygon coordinates for Target Benchmark (e.g. 70%)
  const benchmarkPoints = angles.map((angle) => {
    const r = (targetScore / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  // Weighted overall composite score
  const compositeScore = useMemo(() => {
    const totalWeight = competencies.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight === 0) return overallScore;
    const weightedSum = competencies.reduce((sum, c) => sum + c.score * c.weight, 0);
    return Math.round(weightedSum / totalWeight);
  }, [competencies, overallScore]);

  return (
    <div
      className={`competency-radar-container ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '24px',
        color: '#f8fafc',
      }}
    >
      {/* ─── Header Section ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#818cf8', fontWeight: '800' }}>
            <Award size={13} /> 4-Axis Candidate Competency Rubric
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '4px 0 0', color: '#fff' }}>
            Competency Radar & Weighted Mastery
          </h3>
          <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.55)', margin: '4px 0 0' }}>
            Algorithmic mapping across Problem Solving, Technical Depth, Communication & Architecture.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(0, 0, 0, 0.25)', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#818cf8' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#818cf8', display: 'inline-block' }} />
            Candidate ({compositeScore})
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1.5px dashed #94a3b8', display: 'inline-block' }} />
            Target Bar ({targetScore}%)
          </div>
        </div>
      </div>

      {/* ─── Main Content Grid: SVG Radar + Rubric Details ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 340px) 1fr',
          gap: '24px',
          alignItems: 'center',
        }}
      >
        {/* Radar SVG Chart */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          <svg
            viewBox={`0 0 ${size} ${size}`}
            width={size}
            height={size}
            style={{ overflow: 'visible', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}
          >
            <defs>
              <linearGradient id="candidateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#f472b6" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Concentric Grid Rings */}
            {levels.map((level, lIdx) => {
              const r = level * radius;
              const points = angles.map((angle) => {
                const x = center + r * Math.cos(angle);
                const y = center + r * Math.sin(angle);
                return `${x},${y}`;
              }).join(' ');

              return (
                <g key={lIdx}>
                  <polygon
                    points={points}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="1"
                  />
                  <text
                    x={center + 4}
                    y={center - r + 11}
                    fill="rgba(255, 255, 255, 0.3)"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {Math.round(level * 100)}%
                  </text>
                </g>
              );
            })}

            {/* Axis Spokes from center to 100% boundary */}
            {angles.map((angle, aIdx) => {
              const x2 = center + radius * Math.cos(angle);
              const y2 = center + radius * Math.sin(angle);
              return (
                <line
                  key={aIdx}
                  x1={center}
                  y1={center}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              );
            })}

            {/* Target Passing Benchmark Polygon (Dashed) */}
            <polygon
              points={benchmarkPoints}
              fill="rgba(148, 163, 184, 0.04)"
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="4,3"
            />

            {/* Candidate Polygon (Filled Gradient + Stroke) */}
            <polygon
              points={candidatePolygonString}
              fill="url(#candidateGradient)"
              stroke="#818cf8"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Vertex Nodes & Interactive Markers */}
            {candidatePoints.map((p, pIdx) => {
              const comp = competencies[pIdx];
              const isSelected = activeCompetency === comp.key;

              return (
                <g
                  key={pIdx}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveCompetency(isSelected ? null : comp.key)}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isSelected ? 7 : 5}
                    fill={comp.color}
                    stroke="#0f172a"
                    strokeWidth="2"
                  />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isSelected ? 11 : 8}
                    fill="none"
                    stroke={comp.color}
                    strokeWidth="1"
                    strokeOpacity={isSelected ? 0.8 : 0.3}
                  />
                </g>
              );
            })}

            {/* Axis Text Labels */}
            {competencies.map((comp, idx) => {
              const angle = angles[idx];
              const labelRadius = radius + 24;
              const lx = center + labelRadius * Math.cos(angle);
              const ly = center + labelRadius * Math.sin(angle);
              const isSelected = activeCompetency === comp.key;

              let textAnchor = 'middle';
              if (idx === 1) textAnchor = 'start';
              if (idx === 3) textAnchor = 'end';

              return (
                <g
                  key={`lbl-${idx}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveCompetency(isSelected ? null : comp.key)}
                >
                  <text
                    x={lx}
                    y={ly}
                    fill={isSelected ? '#38bdf8' : comp.color}
                    fontSize="11"
                    fontWeight="700"
                    textAnchor={textAnchor}
                    dominantBaseline="central"
                  >
                    {comp.shortName}
                  </text>
                  <text
                    x={lx}
                    y={ly + (idx === 0 ? -12 : idx === 2 ? 14 : 12)}
                    fill="#f8fafc"
                    fontSize="10"
                    fontWeight="800"
                    textAnchor={textAnchor}
                    dominantBaseline="central"
                  >
                    {comp.score}%
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* ─── 4 Rubric Breakdown Cards ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {competencies.map((comp) => {
            const Icon = comp.icon;
            const isSelected = activeCompetency === comp.key;

            return (
              <div
                key={comp.key}
                onClick={() => setActiveCompetency(isSelected ? null : comp.key)}
                style={{
                  background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? `1.5px solid ${comp.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        padding: '5px',
                        borderRadius: '6px',
                        background: `${comp.color}22`,
                        color: comp.color,
                      }}
                    >
                      <Icon size={14} />
                    </span>
                    <strong style={{ fontSize: '13px', color: '#fff' }}>{comp.name}</strong>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: comp.color }}>
                    {comp.score}
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>/100</span>
                  </span>
                </div>

                {/* Score Progress Bar */}
                <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${comp.score}%`,
                      background: comp.color,
                      borderRadius: '3px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                  <span style={{ color: comp.levelColor, fontWeight: '700' }}>
                    {comp.level}
                  </span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    Weight: {comp.weight}%
                  </span>
                </div>

                {/* Topics Tag List */}
                {comp.topics.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                    {comp.topics.map((t, tIdx) => (
                      <span
                        key={tIdx}
                        style={{
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: '#cbd5e1',
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CompetencyRadarChart;
