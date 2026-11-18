/**
 * Standard rubric definitions mapping questions and skills to the 4 core competencies.
 */
export const COMPETENCY_DEFINITIONS = {
  problem_solving: {
    key: 'problem_solving',
    name: 'Problem Solving',
    shortName: 'Problem Solving',
    icon: 'Brain',
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
    icon: 'Code2',
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
    icon: 'MessageSquare',
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
    icon: 'Network',
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

export function formatCompetencyItem(def, score, weight, targetPassingScore, topics) {
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
    weight,
    score,
    level,
    levelColor,
    deltaVsTarget,
    passed: score >= targetPassingScore,
    description: def.description,
    matchedTopics: topics || [],
  };
}

/**
 * Maps question breakdown and responses to the 4 weighted competencies.
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

    breakdown.forEach((q) => {
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
