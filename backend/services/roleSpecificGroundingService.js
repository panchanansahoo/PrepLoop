/**
 * Role-Specific Grounding Service
 * Extends interview grounding with company and role-specific context injection.
 * 
 * Tracks company norms, role expectations, and provides contextual feedback.
 */

// ─── Company & Role Context Database ─────────────────────────────────────

const COMPANY_PROFILES = {
  google: {
    name: 'Google',
    aliases: ['goog', 'alphabet'],
    emphasis: ['systems thinking', 'scalability', 'optimization'],
    coreValues: 'Focus on scale, efficiency, and elegant solutions. Google values candidates who can design systems that handle billions of users.',
    commonRoleExpectations: {
      backend: 'Understand distributed systems, consistency models, load balancing, and database optimization.',
      frontend: 'Master DOM manipulation, performance optimization, accessibility, and component design patterns.',
      fullstack: 'Balance between frontend optimization and backend scalability.',
      'systems-design': 'Design for scale: capacity planning, sharding strategies, failure handling.',
    },
    interviewFocusAreas: ['complexity analysis', 'trade-off discussion', 'scalability discussion'],
  },
  amazon: {
    name: 'Amazon',
    aliases: ['amzn', 'aws'],
    emphasis: ['operational excellence', 'customer focus', 'innovation', 'scalability'],
    coreValues: 'Amazon uses Leadership Principles heavily. Candidates should demonstrate bias for action, ownership, and frugality.',
    commonRoleExpectations: {
      backend: 'Handle high-throughput systems, eventual consistency, distributed caching.',
      frontend: 'Optimize for user experience and performance; understand mobile-first design.',
      'data-engineer': 'Process large-scale data pipelines; understand eventual consistency and durability.',
      'systems-design': 'Design for availability and fault tolerance. Think about AWS services integration.',
    },
    interviewFocusAreas: ['trade-off discussion', 'failure handling', 'STAR structure'],
  },
  microsoft: {
    name: 'Microsoft',
    aliases: ['msft', 'azure'],
    emphasis: ['cloud-first', 'enterprise solutions', 'collaboration', 'innovation'],
    coreValues: 'Microsoft values a growth mindset and collaboration. Enterprise reliability is paramount.',
    commonRoleExpectations: {
      backend: 'Understand cloud architecture (Azure), microservices, and enterprise integrations.',
      frontend: 'Master cross-platform web technologies, accessibility, and responsive design.',
      'devops': 'Understand CI/CD pipelines, containerization, infrastructure as code.',
      'systems-design': 'Design enterprise-grade systems with high availability and disaster recovery.',
    },
    interviewFocusAreas: ['reliability discussion', 'enterprise patterns', 'STAR structure'],
  },
  meta: {
    name: 'Meta (Facebook)',
    aliases: ['facebook', 'fb'],
    emphasis: ['scale at extreme', 'performance', 'real-time processing'],
    coreValues: 'Meta moves fast and breaks things thoughtfully. Values deep technical expertise and ability to handle billions of users.',
    commonRoleExpectations: {
      backend: 'Design for extreme scale; understand feed ranking, real-time messaging, and ad systems.',
      frontend: 'Optimize React for massive scale; understand virtual scrolling, code splitting.',
      'systems-design': 'Design for billions of users; understand newsfeed ranking, real-time infrastructure.',
    },
    interviewFocusAreas: ['complexity analysis', 'scalability discussion', 'performance optimization'],
  },
  apple: {
    name: 'Apple',
    aliases: [],
    emphasis: ['privacy', 'performance', 'design quality', 'security'],
    coreValues: 'Apple prioritizes user privacy, performance, and elegant design. Security-first mindset.',
    commonRoleExpectations: {
      backend: 'Focus on privacy, security, and handling personal data responsibly.',
      frontend: 'Master native frameworks (Swift, Objective-C); understand performance constraints.',
      'security': 'Deep expertise in cryptography, threat modeling, and secure communication.',
    },
    interviewFocusAreas: ['security discussion', 'privacy considerations', 'performance constraints'],
  },
};

const ROLE_LEVEL_DEFINITIONS = {
  junior: {
    yearsExperience: '0-2',
    focusAreas: ['fundamentals', 'communication', 'learning ability'],
    expectedDifficulty: 'easy-to-medium',
    scoreExpectation: '60-75',
  },
  'mid-level': {
    yearsExperience: '2-5',
    focusAreas: ['problem-solving', 'trade-offs', 'system design'],
    expectedDifficulty: 'medium-to-hard',
    scoreExpectation: '70-85',
  },
  senior: {
    yearsExperience: '5+',
    focusAreas: ['architectural thinking', 'business impact', 'mentoring mindset'],
    expectedDifficulty: 'hard-to-extreme',
    scoreExpectation: '80-95',
  },
};

// ─── Helper Functions ────────────────────────────────────────────────────

/**
 * Resolve company profile from company name or alias
 */
function resolveCompanyProfile(companyName) {
  if (!companyName) return null;

  const normalized = String(companyName).toLowerCase().trim();

  // Direct match
  if (COMPANY_PROFILES[normalized]) {
    return COMPANY_PROFILES[normalized];
  }

  // Alias match
  for (const [key, profile] of Object.entries(COMPANY_PROFILES)) {
    if (profile.aliases && profile.aliases.includes(normalized)) {
      return profile;
    }
  }

  return null;
}

/**
 * Resolve role level from years of experience or explicit level
 */
function resolveRoleLevel(yearsExperience, roleLevel) {
  if (roleLevel) {
    const normalized = String(roleLevel).toLowerCase().trim();
    if (ROLE_LEVEL_DEFINITIONS[normalized]) {
      return normalized;
    }
  }

  if (typeof yearsExperience === 'number') {
    if (yearsExperience < 2) return 'junior';
    if (yearsExperience < 5) return 'mid-level';
    return 'senior';
  }

  return 'mid-level'; // Default
}

/**
 * Generate role-specific follow-up guidance
 */
function generateRoleSpecificGuidance(roleType, company, roleLevel) {
  const guidance = [];
  const roleNormalized = String(roleType || '').toLowerCase();
  const companyProfile = resolveCompanyProfile(company);

  // Company-specific guidance
  if (companyProfile) {
    guidance.push({
      type: 'company-culture',
      text: `${companyProfile.coreValues}`,
      priority: 'high',
    });

    const roleExpectation = companyProfile.commonRoleExpectations[roleNormalized];
    if (roleExpectation) {
      guidance.push({
        type: 'role-specific',
        text: `For a ${roleNormalized} role at ${companyProfile.name}: ${roleExpectation}`,
        priority: 'high',
      });
    }
  }

  // Role-level guidance
  const levelDef = ROLE_LEVEL_DEFINITIONS[roleLevel];
  if (levelDef) {
    guidance.push({
      type: 'level-expectation',
      text: `As a ${roleLevel} candidate (${levelDef.yearsExperience} years), focus on: ${levelDef.focusAreas.join(', ')}. Expected score range: ${levelDef.scoreExpectation}.`,
      priority: 'medium',
    });
  }

  // Role-specific focus areas
  const rolesWithFocus = {
    backend: ['scalability', 'database optimization', 'caching strategies', 'API design'],
    frontend: ['performance optimization', 'accessibility', 'responsive design', 'state management'],
    fullstack: ['end-to-end architecture', 'database design', 'API design', 'UX considerations'],
    'systems-design': ['distributed systems', 'high availability', 'failure handling', 'monitoring'],
    'devops': ['infrastructure as code', 'CI/CD pipelines', 'monitoring', 'disaster recovery'],
  };

  if (rolesWithFocus[roleNormalized]) {
    guidance.push({
      type: 'role-focus',
      text: `Focus areas for ${roleNormalized}: ${rolesWithFocus[roleNormalized].join(', ')}.`,
      priority: 'medium',
    });
  }

  return guidance;
}

/**
 * Generate follow-up question hints based on company/role context
 */
function generateContextualFollowUpHints(responseScore, roleType, company, missingAreas) {
  const hints = [];
  const companyProfile = resolveCompanyProfile(company);

  if (!companyProfile) {
    return hints;
  }

  // If score is below expected for company's interview style
  const roleNormalized = String(roleType || '').toLowerCase();
  const roleExpectation = companyProfile.commonRoleExpectations[roleNormalized];

  if (responseScore < 70 && roleExpectation) {
    hints.push({
      hint: `Remember: ${roleExpectation}. Let's focus on this area in the next question.`,
      type: 'company-context',
    });
  }

  // Suggest follow-ups aligned with company's focus areas
  for (const focusArea of companyProfile.interviewFocusAreas) {
    if (missingAreas && missingAreas.includes(focusArea)) {
      hints.push({
        hint: `${companyProfile.name} places strong emphasis on ${focusArea}. Let's dive deeper.`,
        type: 'company-emphasis',
      });
    }
  }

  return hints;
}

/**
 * Anchor feedback to company context
 */
function anchorFeedbackToCompany(feedback, company, roleType) {
  const companyProfile = resolveCompanyProfile(company);
  if (!companyProfile) {
    return feedback;
  }

  let anchored = feedback;

  // Prepend company context to feedback
  if (feedback && typeof feedback === 'string') {
    anchored = `At ${companyProfile.name}: ${feedback}`;
  }

  return anchored;
}

// ─── Main Service Class ──────────────────────────────────────────────────

export class RoleSpecificGroundingService {
  /**
   * Get company and role context for interview
   *
   * @param {object} context - { company, roleType, yearsExperience, roleLevel, interviewType }
   * @returns {object} Enriched context with role/company-specific guidance
   */
  static getContext(context = {}) {
    const { company, roleType, yearsExperience, roleLevel, interviewType } = context;

    const normalizedRoleType = String(roleType || '').toLowerCase().trim();
    const normalizedInterviewType = String(interviewType || '').toLowerCase().trim();

    const resolvedLevel = resolveRoleLevel(yearsExperience, roleLevel);
    const resolvedCompany = resolveCompanyProfile(company);

    return {
      company: resolvedCompany || null,
      roleType: normalizedRoleType,
      roleLevel: resolvedLevel,
      yearsExperience,
      interviewType: normalizedInterviewType,
      isKnownCompany: !!resolvedCompany,
      // For telemetry
      companyNormalized: resolvedCompany?.name || company,
      roleLevelDefinition: ROLE_LEVEL_DEFINITIONS[resolvedLevel],
    };
  }

  /**
   * Get role-specific guidance for interview
   *
   * @param {object} context - { company, roleType, yearsExperience, roleLevel }
   * @returns {array} Array of guidance objects with type, text, priority
   */
  static getGuidance(context = {}) {
    const { company, roleType, roleLevel } = context;
    const resolvedLevel = roleLevel || resolveRoleLevel(context.yearsExperience, roleLevel);
    return generateRoleSpecificGuidance(roleType, company, resolvedLevel);
  }

  /**
   * Get contextual hints for follow-up questions
   *
   * @param {object} params - { responseScore, roleType, company, missingAreas }
   * @returns {array} Array of contextual hints
   */
  static getFollowUpHints(params = {}) {
    const { responseScore, roleType, company, missingAreas } = params;
    return generateContextualFollowUpHints(responseScore, roleType, company, missingAreas);
  }

  /**
   * Anchor feedback to company expectations
   *
   * @param {string} feedback - Original feedback text
   * @param {string} company - Company name
   * @param {string} roleType - Role type
   * @returns {string} Feedback anchored to company context
   */
  static anchorFeedback(feedback, company, roleType) {
    return anchorFeedbackToCompany(feedback, company, roleType);
  }

  /**
   * Check if response meets company-specific expectations
   *
   * @param {object} params - { responseScore, company, roleType, roleLevel, comparisonBenchmark }
   * @returns {object} Assessment with aligned/misaligned indicators
   */
  static assessCompanyAlignment(params = {}) {
    const { responseScore, company, roleType, roleLevel } = params;
    const resolvedLevel = roleLevel || resolveRoleLevel(params.yearsExperience, roleLevel);
    const levelDef = ROLE_LEVEL_DEFINITIONS[resolvedLevel];

    if (!levelDef) {
      return {
        aligned: responseScore >= 70,
        scoreRange: '70-100',
        recommendation: 'Focus on demonstrating clear thinking and communication.',
      };
    }

    const [minScore, maxScore] = levelDef.scoreExpectation.split('-').map(Number);
    const aligned = responseScore >= minScore && responseScore <= maxScore;
    const exceedsExpectation = responseScore > maxScore;
    const belowExpectation = responseScore < minScore;

    return {
      aligned,
      exceedsExpectation,
      belowExpectation,
      scoreRange: levelDef.scoreExpectation,
      focusAreas: levelDef.focusAreas,
      recommendation: belowExpectation
        ? `Score below ${resolvedLevel} expectation (${minScore}+). Focus on ${levelDef.focusAreas[0]}.`
        : exceedsExpectation
        ? 'Excellent! You exceeded expectations for this level.'
        : `On track for ${resolvedLevel} level.`,
    };
  }

  /**
   * Get difficulty adjustment based on role level and company expectations
   *
   * @param {object} context - { roleLevel, yearsExperience, company, currentScore, currentDifficulty }
   * @returns {object} Suggested difficulty adjustment and reasoning
   */
  static suggestDifficultyAdjustment(context = {}) {
    const { roleLevel, yearsExperience, currentScore, currentDifficulty } = context;
    const resolvedLevel = roleLevel || resolveRoleLevel(yearsExperience, roleLevel);
    const levelDef = ROLE_LEVEL_DEFINITIONS[resolvedLevel];

    if (!levelDef) {
      return { suggestedDifficulty: currentDifficulty, adjustment: 0, reasoning: 'No adjustment.' };
    }

    const [minScore, maxScore] = levelDef.scoreExpectation.split('-').map(Number);
    const midpoint = (minScore + maxScore) / 2;

    let adjustment = 0;
    let reasoning = '';

    if (currentScore > maxScore) {
      adjustment = 1;
      reasoning = `Score exceeds ${resolvedLevel} expectations. Increase difficulty.`;
    } else if (currentScore < minScore) {
      adjustment = -1;
      reasoning = `Score below ${resolvedLevel} expectations. Reduce difficulty to rebuild confidence.`;
    } else if (currentScore > midpoint) {
      adjustment = 0.5;
      reasoning = `Score above midpoint for ${resolvedLevel}. Gradually increase difficulty.`;
    } else {
      adjustment = 0;
      reasoning = `Score on track for ${resolvedLevel}. Maintain current difficulty.`;
    }

    return {
      suggestedAdjustment: adjustment,
      reasoning,
      expectedRange: levelDef.scoreExpectation,
      roleLevelDescription: resolvedLevel,
    };
  }
}

export default RoleSpecificGroundingService;
