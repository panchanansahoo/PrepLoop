/**
 * ProactiveSuggestionService
 *
 * Implements conversational AI interview suggestion capabilities:
 * - Silence thresholds per interview stage
 * - Proactive thought-starters (Tier 0)
 * - Progressive coaching cues / hints (Tier 1)
 * - Approach options / architectural choices (Tier 2)
 * - Scaffolding / structured breakdowns (Tier 3)
 * - Stage-specific templates and dynamic suggestion generation
 */

export const SILENCE_THRESHOLDS_SEC = {
  intake: 15,
  warmup: 12,
  technical: 25,
  followup: 15,
  'follow-up': 15,
  challenge: 20,
  feedback: 10,
};

export const SILENCE_THRESHOLDS_MS = Object.freeze(
  Object.fromEntries(
    Object.entries(SILENCE_THRESHOLDS_SEC).map(([stage, sec]) => [stage, sec * 1000])
  )
);

export const SUGGESTION_TIERS = Object.freeze({
  TIER_0_THOUGHT_STARTER: 0,
  TIER_1_COACHING_CUE: 1,
  TIER_2_APPROACH_OPTIONS: 2,
  TIER_3_SCAFFOLDING: 3,
});

// ── Stage-Specific Suggestion Templates ────────────────────────────────
export const STAGE_SUGGESTION_TEMPLATES = {
  intake: {
    thoughtStarter: [
      'Take a moment to clarify expectations, role context, and the interview format.',
      'Consider asking about any assumptions or scope boundaries before diving in.',
      'Confirm the key goals and deliverables for this session.',
    ],
    scaffolding: [
      'Step 1: Confirm understanding of the problem statement and goal.',
      'Step 2: Ask about input constraints, expected volume, or scope limits.',
      'Step 3: State your planned agenda or roadmap before executing.',
    ],
  },
  warmup: {
    thoughtStarter: [
      'Give a concise 30-to-60 second summary of your engineering background.',
      'Highlight 1-2 core technologies or projects relevant to this role.',
      'Frame your experience around impact and technical ownership.',
    ],
    scaffolding: [
      'Step 1: State your current role/studies and main technical focus.',
      'Step 2: Highlight a flagship project and your specific contribution.',
      'Step 3: Connect your background to what excites you about this interview.',
    ],
  },
  technical: {
    dsa: {
      thoughtStarter: [
        'Start by walking through 1-2 concrete test cases, including edge cases (e.g., empty input, duplicates, negatives).',
        'Consider stating a brute-force approach first to establish a baseline time/space complexity.',
        'Identify what information you need to look up quickly—would a hash map, two pointers, or a heap help?',
      ],
      approachOptions: [
        {
          name: 'Two-Pointer / In-Place Scan',
          description: 'Sort or scan from both ends to achieve O(N) or O(N log N) time with O(1) extra space.',
          tradeOffs: 'Best for sorted data or arrays when auxiliary memory must be minimized.',
        },
        {
          name: 'Hash Map / Frequency Counter',
          description: 'Store seen values or frequencies to achieve O(N) time with O(N) auxiliary space.',
          tradeOffs: 'Provides fast O(1) lookups at the expense of additional heap space.',
        },
        {
          name: 'Divide & Conquer / Binary Search',
          description: 'Halve the search space iteratively or recursively for O(log N) time.',
          tradeOffs: 'Requires monotonic or partitioned property, highly optimal for large inputs.',
        },
      ],
      scaffolding: [
        'Step 1: Clarify input types, edge cases (empty array, single element), and expected return type.',
        'Step 2: State the naive brute-force time and space complexity.',
        'Step 3: Choose an optimal data structure to eliminate redundant work.',
        'Step 4: Trace the algorithm step-by-step with a small sample input before writing code.',
      ],
    },
    'system-design': {
      thoughtStarter: [
        'Begin by separating functional requirements (core features) from non-functional requirements (scale, latency, availability).',
        'Estimate daily active users and calculate read vs. write QPS and storage needs.',
        'Sketch the high-level data flow before drilling down into specific components.',
      ],
      approachOptions: [
        {
          name: 'Synchronous API Gateway + Read-Replica Cache',
          description: 'REST/gRPC services fronted by an API gateway, caching hot data in Redis and persisting in relational DB.',
          tradeOffs: 'Simple, low latency for reads, but write-heavy peaks can bottleneck the primary database.',
        },
        {
          name: 'Event-Driven Async Pipeline',
          description: 'Decouple producers and consumers via distributed log (Kafka) and worker clusters with eventual consistency.',
          tradeOffs: 'Highly resilient and fault-tolerant under burst traffic; introduces eventual consistency.',
        },
      ],
      scaffolding: [
        'Step 1: Outline functional scope (APIs) and non-functional requirements (QPS, SLA, CAP theorem trade-off).',
        'Step 2: Draw high-level architecture (Client -> CDN/LB -> API Gateway -> Service -> Cache -> DB).',
        'Step 3: Define data schema and storage choice (SQL vs NoSQL).',
        'Step 4: Address single points of failure, replication, and horizontal scaling strategies.',
      ],
    },
    behavioral: {
      thoughtStarter: [
        'Structure your response using the STAR method: Situation, Task, Action, Result.',
        'Focus specifically on YOUR personal contribution ("I decided", "I built"), not just team efforts ("we").',
        'Include measurable metrics or concrete outcomes (e.g. latency reduced by 30%, shipped on schedule).',
      ],
      approachOptions: [
        {
          name: 'Technical Challenge & Problem Solving',
          description: 'Focus on a complex technical bug, architectural bottleneck, or outage resolution.',
          tradeOffs: 'Demonstrates deep engineering skill, diagnosis, and systematic problem solving.',
        },
        {
          name: 'Cross-functional Collaboration & Conflict',
          description: 'Focus on aligning conflicting priorities between product, design, and engineering.',
          tradeOffs: 'Demonstrates communication, empathy, leadership, and pragmatic compromise.',
        },
      ],
      scaffolding: [
        'Step 1: Situation — Briefly set the context, company/team situation, and business stakes.',
        'Step 2: Task — Clarify your exact responsibility and the specific challenge you faced.',
        'Step 3: Action — Explain the concrete steps you personally initiated and executed.',
        'Step 4: Result — Conclude with quantifiable impact, lessons learned, or long-term benefits.',
      ],
    },
    hr: {
      thoughtStarter: [
        'Connect your personal career aspirations with the team mission and technical culture.',
        'Highlight adaptability, enthusiasm for continuous learning, and collaborative values.',
      ],
      scaffolding: [
        'Step 1: Articulate your core motivation and interest in the company/role.',
        'Step 2: Share an example showing collaboration and ownership.',
        'Step 3: Express curiosity about team culture, growth opportunities, or upcoming initiatives.',
      ],
    },
  },
  followup: {
    thoughtStarter: [
      'Consider how your approach behaves if data volume grows by 100x or concurrent users spike.',
      'Think about failure domains: what happens if the network drops or a dependency crashes?',
      'Reflect on trade-offs: what did you sacrifice (e.g. memory vs CPU, consistency vs availability)?',
    ],
    scaffolding: [
      'Step 1: Identify the primary bottleneck in your current design/code.',
      'Step 2: Propose one architectural or algorithmic optimization to address it.',
      'Step 3: State the trade-offs of the proposed optimization.',
    ],
  },
  challenge: {
    thoughtStarter: [
      'Analyze worst-case scenarios, malicious or adversarial inputs, and stress conditions.',
      'Explore distributed failure modes, split-brain recovery, or zero-downtime deployment strategies.',
    ],
    scaffolding: [
      'Step 1: Identify worst-case input or concurrent race condition.',
      'Step 2: Formulate defensive validation, rate limiting, or circuit-breaking mechanism.',
      'Step 3: Verify correctness under degraded network or storage conditions.',
    ],
  },
  feedback: {
    thoughtStarter: [
      'Reflect on key technical trade-offs discussed during the session.',
      'Ask the interviewer a thoughtful question regarding the problem space or architecture.',
    ],
    scaffolding: [
      'Step 1: Summarize what worked well and what you would optimize with more time.',
      'Step 2: Share one key takeaway or technical insight from the discussion.',
    ],
  },
};

// ── Service Class ──────────────────────────────────────────────────────
export class ProactiveSuggestionService {
  /**
   * Get silence threshold in seconds or milliseconds for a given stage
   */
  static getSilenceThreshold(stage, options = { unit: 'sec' }) {
    const norm = String(stage || 'technical').toLowerCase().trim();
    const sec = SILENCE_THRESHOLDS_SEC[norm] ?? SILENCE_THRESHOLDS_SEC.technical;
    return options?.unit === 'ms' ? sec * 1000 : sec;
  }

  /**
   * Determine whether silence duration has exceeded stage threshold
   */
  static isSilenceThresholdExceeded(stage, silenceDuration, options = { unit: 'sec' }) {
    const threshold = this.getSilenceThreshold(stage, options);
    const duration = Number(silenceDuration || 0);
    return duration >= threshold;
  }

  /**
   * Normalize interview type key
   */
  static normalizeInterviewType(interviewType) {
    const norm = String(interviewType || 'dsa').toLowerCase().trim();
    if (norm === 'system_design' || norm === 'system-design') return 'system-design';
    if (norm === 'behavioral') return 'behavioral';
    if (norm === 'hr') return 'hr';
    return 'dsa';
  }

  /**
   * Normalize interview stage key
   */
  static normalizeStage(stage) {
    const norm = String(stage || 'technical').toLowerCase().trim();
    if (norm === 'follow-up' || norm === 'followup') return 'followup';
    if (['intake', 'warmup', 'technical', 'challenge', 'feedback'].includes(norm)) return norm;
    return 'technical';
  }

  /**
   * Generate Tier 0 thought-starter
   */
  static generateThoughtStarter({ interviewType, stage, topic, problemStatement, turnNumber = 1 }) {
    const normStage = this.normalizeStage(stage);
    const normType = this.normalizeInterviewType(interviewType);

    if (normStage === 'technical') {
      const typeTemplates = STAGE_SUGGESTION_TEMPLATES.technical[normType] || STAGE_SUGGESTION_TEMPLATES.technical.dsa;
      const starters = typeTemplates.thoughtStarter || [];
      const index = Math.abs(Number(turnNumber || 0)) % Math.max(1, starters.length);
      return starters[index] || starters[0] || 'Clarify the core requirements and state your initial intuition.';
    }

    const stageTemplates = STAGE_SUGGESTION_TEMPLATES[normStage] || STAGE_SUGGESTION_TEMPLATES.technical.dsa;
    const starters = stageTemplates.thoughtStarter || [];
    const index = Math.abs(Number(turnNumber || 0)) % Math.max(1, starters.length);
    return starters[index] || starters[0] || 'Take a breath, structure your reasoning, and proceed step-by-step.';
  }

  /**
   * Generate Tier 2 approach options
   */
  static generateApproachOptions({ interviewType, stage, topic, problemStatement, missingAreas = [] }) {
    const normStage = this.normalizeStage(stage);
    const normType = this.normalizeInterviewType(interviewType);

    if (normStage === 'technical' || normStage === 'followup') {
      const typeTemplates = STAGE_SUGGESTION_TEMPLATES.technical[normType] || STAGE_SUGGESTION_TEMPLATES.technical.dsa;
      if (Array.isArray(typeTemplates.approachOptions) && typeTemplates.approachOptions.length > 0) {
        return typeTemplates.approachOptions;
      }
    }

    // Default approach options for generic stages
    return [
      {
        name: 'Iterative / Direct Solution',
        description: 'Implement a straightforward solution that directly satisfies the functional requirements.',
        tradeOffs: 'Quick to explain and code; may require optimization later.',
      },
      {
        name: 'Structured Modular Architecture',
        description: 'Decompose the problem into separate responsibilities before refining internals.',
        tradeOffs: 'High clarity and maintainability; takes slightly longer to outline.',
      },
    ];
  }

  /**
   * Generate Tier 3 scaffolding steps
   */
  static generateScaffolding({ interviewType, stage, topic, problemStatement, missingAreas = [], stuckLevel = 1 }) {
    const normStage = this.normalizeStage(stage);
    const normType = this.normalizeInterviewType(interviewType);

    if (normStage === 'technical') {
      const typeTemplates = STAGE_SUGGESTION_TEMPLATES.technical[normType] || STAGE_SUGGESTION_TEMPLATES.technical.dsa;
      if (Array.isArray(typeTemplates.scaffolding) && typeTemplates.scaffolding.length > 0) {
        return typeTemplates.scaffolding;
      }
    }

    const stageTemplates = STAGE_SUGGESTION_TEMPLATES[normStage] || STAGE_SUGGESTION_TEMPLATES.technical.dsa;
    if (Array.isArray(stageTemplates.scaffolding) && stageTemplates.scaffolding.length > 0) {
      return stageTemplates.scaffolding;
    }

    return [
      'Step 1: Restate the goal in your own words.',
      'Step 2: List the primary inputs, constraints, and outputs.',
      'Step 3: Solve a simple case manually before generalizing.',
    ];
  }

  /**
   * Master resolver for proactive suggestions
   */
  static getProactiveSuggestions({
    interviewType = 'dsa',
    stage = 'technical',
    missingAreas = [],
    problemStatement = '',
    turnNumber = 1,
    silenceDurationSec = 0,
    stuckLevel = 0,
    tier = null,
    weakestDimension = null,
  } = {}) {
    const normStage = this.normalizeStage(stage);
    const normType = this.normalizeInterviewType(interviewType);
    const silenceThreshold = this.getSilenceThreshold(normStage, { unit: 'sec' });
    const isSilenceExceeded = Number(silenceDurationSec || 0) >= silenceThreshold;

    // Resolve target tier
    let effectiveTier = SUGGESTION_TIERS.TIER_0_THOUGHT_STARTER;
    if (typeof tier === 'number' && [0, 1, 2, 3].includes(tier)) {
      effectiveTier = tier;
    } else if (Number(stuckLevel || 0) >= 2) {
      effectiveTier = SUGGESTION_TIERS.TIER_3_SCAFFOLDING;
    } else if (Number(stuckLevel || 0) === 1 || isSilenceExceeded) {
      effectiveTier = SUGGESTION_TIERS.TIER_2_APPROACH_OPTIONS;
    }

    const thoughtStarter = this.generateThoughtStarter({
      interviewType: normType,
      stage: normStage,
      problemStatement,
      turnNumber,
    });

    const approachOptions = this.generateApproachOptions({
      interviewType: normType,
      stage: normStage,
      problemStatement,
      missingAreas,
    });

    const scaffolding = this.generateScaffolding({
      interviewType: normType,
      stage: normStage,
      problemStatement,
      missingAreas,
      stuckLevel,
    });

    let coachingCue = null;
    if (weakestDimension) {
      const dim = String(weakestDimension).toLowerCase();
      if (dim === 'clarity') {
        coachingCue = 'Structure your explanation step-by-step; state assumptions before jumping into code.';
      } else if (dim === 'correctness') {
        coachingCue = 'Double-check edge conditions (e.g. boundary indices, empty input, off-by-one errors).';
      } else if (dim === 'depth') {
        coachingCue = 'Elaborate on internal mechanics and time/space complexity trade-offs.';
      }
    }

    return {
      stage: normStage,
      interviewType: normType,
      effectiveTier,
      silenceThresholdSec: silenceThreshold,
      isSilenceExceeded,
      thoughtStarter,
      approachOptions,
      scaffolding,
      coachingCue,
      missingAreas: Array.isArray(missingAreas) ? missingAreas : [],
    };
  }

  /**
   * Generate a targeted suggestion payload for a requested tier
   */
  static generateTieredSuggestion({
    tier = 0,
    interviewType = 'dsa',
    stage = 'technical',
    missingAreas = [],
    problemStatement = '',
    weakestDimension = null,
    stuckCount = 0,
  } = {}) {
    const normStage = this.normalizeStage(stage);
    const normType = this.normalizeInterviewType(interviewType);
    const clampedTier = Math.max(0, Math.min(3, Number(tier || 0)));

    switch (clampedTier) {
      case SUGGESTION_TIERS.TIER_0_THOUGHT_STARTER: {
        const text = this.generateThoughtStarter({
          interviewType: normType,
          stage: normStage,
          problemStatement,
          turnNumber: stuckCount,
        });
        return {
          tier: 0,
          type: 'thought_starter',
          title: 'Thought-Starter',
          content: text,
        };
      }
      case SUGGESTION_TIERS.TIER_1_COACHING_CUE: {
        let cue = 'Think through the trade-offs between memory footprint and execution speed.';
        if (weakestDimension) {
          const dim = String(weakestDimension).toLowerCase();
          if (dim === 'clarity') cue = 'Lead with the high-level concept first before diving into micro-optimizations.';
          else if (dim === 'correctness') cue = 'Verify your loop termination conditions and empty input handling.';
          else if (dim === 'depth') cue = 'Explain the big-O complexity and any data structure trade-offs.';
        } else if (Array.isArray(missingAreas) && missingAreas.length > 0) {
          cue = `Pay special attention to ${missingAreas[0]}.`;
        }
        return {
          tier: 1,
          type: 'coaching_cue',
          title: 'Coaching Hint',
          content: cue,
        };
      }
      case SUGGESTION_TIERS.TIER_2_APPROACH_OPTIONS: {
        const options = this.generateApproachOptions({
          interviewType: normType,
          stage: normStage,
          problemStatement,
          missingAreas,
        });
        return {
          tier: 2,
          type: 'approach_options',
          title: 'Approach Options',
          options,
        };
      }
      case SUGGESTION_TIERS.TIER_3_SCAFFOLDING:
      default: {
        const steps = this.generateScaffolding({
          interviewType: normType,
          stage: normStage,
          problemStatement,
          missingAreas,
          stuckLevel: stuckCount,
        });
        return {
          tier: 3,
          type: 'scaffolding',
          title: 'Step-by-Step Scaffolding',
          steps,
        };
      }
    }
  }
}

export default ProactiveSuggestionService;
