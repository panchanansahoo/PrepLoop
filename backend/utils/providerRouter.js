/**
 * Provider Router
 * Intelligently routes voice personas to optimal providers
 * Scores providers by quality, latency, cost, and accent coverage
 */

/**
 * Provider scoring configuration
 * Each provider has different strengths
 */
const PROVIDER_SCORES = {
  elevenLabs: {
    quality: 95,          // Highest quality, most natural sounding
    latency: 70,          // Medium latency (500-1000ms)
    cost: 40,             // Expensive (per-character)
    accent_coverage: 95,  // Extensive accent support
    special_features: ['voice-cloning', 'fine-tuning', 'streaming']
  },
  groq: {
    quality: 80,          // High quality, good variety
    latency: 75,          // Medium-low latency (200-500ms)
    cost: 50,             // Moderate cost
    accent_coverage: 75,  // Good accent support
    special_features: ['fast', 'reliable', 'multiple-models']
  },
  openai: {
    quality: 85,          // Very high quality
    latency: 60,          // Slower latency (1-2s)
    cost: 35,             // Reasonable cost
    accent_coverage: 70,  // Limited accents
    special_features: ['natural', 'clear', 'professional']
  },
  kokoro: {
    quality: 70,          // Good quality
    latency: 95,          // Very fast when warm (50-200ms)
    cost: 100,            // Free (local)
    accent_coverage: 40,  // Limited accents
    special_features: ['local', 'free', 'instant-second-call']
  },
  edge: {
    quality: 65,          // Adequate quality
    latency: 90,          // Very fast
    cost: 100,            // Free (Azure)
    accent_coverage: 60,  // Moderate accents
    special_features: ['free', 'quick', 'built-in']
  }
};

/**
 * Context-based routing: which providers excel in different scenarios
 */
const CONTEXT_PREFERENCES = {
  low_latency: ['kokoro', 'edge', 'groq'],           // Fast response needed
  premium_quality: ['elevenLabs', 'openai', 'groq'], // Best quality
  cost_optimized: ['kokoro', 'edge', 'groq'],        // Free/cheap
  accent_support: ['elevenLabs', 'groq', 'kokoro'],  // Diverse voices
  streaming: ['elevenLabs', 'kokoro'],               // Stream-capable
  enterprise: ['openai', 'elevenLabs'],              // Stable, enterprise-ready
  casual: ['kokoro', 'groq', 'edge']                 // Less formal
};

/**
 * Persona to provider preference mapping
 */
const PERSONA_PROVIDER_AFFINITY = {
  professional_neutral: ['openai', 'elevenLabs', 'groq'],
  professional_assertive: ['elevenLabs', 'openai'],
  conversational_friendly: ['groq', 'kokoro', 'elevenLabs', 'edge'],
  conversational_curious: ['groq', 'kokoro', 'elevenLabs'],
  analytical_precise: ['openai', 'elevenLabs', 'groq', 'kokoro'],
  analytical_inquisitive: ['elevenLabs', 'groq', 'kokoro'],
  calm_supportive: ['groq', 'kokoro', 'elevenLabs', 'edge'],
  calm_empathetic: ['groq', 'kokoro', 'elevenLabs'],
  energetic_enthusiastic: ['groq', 'kokoro', 'elevenLabs'],
  energetic_driven: ['elevenLabs', 'openai', 'groq'],
  mentor_guide: ['groq', 'kokoro', 'elevenLabs'],
  recruiter_hr: ['elevenLabs', 'groq', 'edge'],
  default_neutral: ['kokoro', 'groq', 'edge', 'openai', 'elevenLabs']
};

/**
 * Accent to provider mapping
 */
const ACCENT_PROVIDER_SUPPORT = {
  american: ['elevenLabs', 'groq', 'kokoro', 'openai', 'edge'],
  british: ['elevenLabs', 'groq', 'openai'],
  indian: ['elevenLabs', 'groq', 'kokoro'],
  australian: ['elevenLabs', 'groq', 'kokoro'],
  canadian: ['elevenLabs', 'groq'],
  neutral: ['elevenLabs', 'groq', 'kokoro', 'edge', 'openai']
};

/**
 * Score a provider for a specific request
 */
export function scoreProvider(provider, options = {}) {
  const {
    persona,
    accent = 'neutral',
    priority = 'quality',  // quality, latency, cost, balanced
    userContext = {}        // latency_budget, cost_budget, quality_min
  } = options;
  
  const score = { ...PROVIDER_SCORES[provider] };
  
  // Adjust based on accent support
  const accentSupport = ACCENT_PROVIDER_SUPPORT[accent] || [];
  if (!accentSupport.includes(provider)) {
    score.accent_coverage *= 0.5; // Penalty for unsupported accent
  }
  
  // Adjust based on priority
  switch (priority) {
    case 'latency':
      score.total = score.latency * 0.5 + score.quality * 0.3 + score.cost * 0.2;
      break;
    case 'cost':
      score.total = score.cost * 0.5 + score.latency * 0.3 + score.quality * 0.2;
      break;
    case 'quality':
      score.total = score.quality * 0.5 + score.latency * 0.3 + score.cost * 0.2;
      break;
    case 'balanced':
    default:
      score.total = (score.quality + score.latency + score.cost) / 3;
      break;
  }
  
  // Apply constraints
  if (userContext.latency_budget && score.latency > userContext.latency_budget) {
    score.total *= 0.5; // Penalize if exceeds budget
  }
  if (userContext.quality_min && score.quality < userContext.quality_min) {
    score.total = 0; // Disqualify if quality too low
  }
  
  return score.total;
}

/**
 * Find best provider for a request
 */
export function selectProvider(options = {}) {
  const {
    persona = 'default_neutral',
    accent = 'neutral',
    priority = 'quality',
    context = 'standard',
    excludeProviders = [],
    userContext = {}
  } = options;
  
  // Get providers from persona affinity
  let candidates = PERSONA_PROVIDER_AFFINITY[persona] || PERSONA_PROVIDER_AFFINITY.default_neutral;
  
  // Filter by context
  if (CONTEXT_PREFERENCES[context]) {
    const contextPrefs = CONTEXT_PREFERENCES[context];
    candidates = candidates.filter(p => contextPrefs.includes(p));
  }
  
  // Remove excluded providers
  candidates = candidates.filter(p => !excludeProviders.includes(p));
  
  if (candidates.length === 0) {
    // Fallback: use all available providers, score them
    candidates = Object.keys(PROVIDER_SCORES);
  }
  
  // Score and sort
  const scored = candidates.map(provider => ({
    provider,
    score: scoreProvider(provider, { persona, accent, priority, userContext })
  }));
  
  scored.sort((a, b) => b.score - a.score);
  
  return {
    best: scored[0],
    alternatives: scored.slice(1, 3),
    all_ranked: scored
  };
}

/**
 * Get provider chain for fallback
 */
export function getProviderChain(options = {}) {
  const {
    persona = 'default_neutral',
    accent = 'neutral',
    priority = 'quality',
    context = 'standard'
  } = options;
  
  const selection = selectProvider(options);
  
  // Build chain: best -> alternatives -> fallbacks
  const chain = [
    selection.best.provider,
    ...selection.alternatives.map(alt => alt.provider)
  ];
  
  // Add fallbacks
  const allProviders = Object.keys(PROVIDER_SCORES);
  const missing = allProviders.filter(p => !chain.includes(p));
  
  // Sort missing by score
  missing.sort((a, b) => 
    scoreProvider(b, { persona, accent, priority }) - 
    scoreProvider(a, { persona, accent, priority })
  );
  
  return chain.concat(missing);
}

/**
 * Cost estimation for provider
 */
export function estimateCost(provider, textLength, options = {}) {
  // Rough cost estimates per 1000 characters
  const costsPerK = {
    elevenLabs: 0.30,  // $0.30 per 1M chars
    groq: 0.01,        // $0.001 per req
    openai: 0.015,     // $0.015 per 1K chars
    kokoro: 0,         // Free
    edge: 0            // Free
  };
  
  const cost = (textLength / 1000) * (costsPerK[provider] || 0);
  return { provider, cost, text_length: textLength };
}

/**
 * Latency estimation
 */
export function estimateLatency(provider, options = {}) {
  const baseLatencies = {
    elevenLabs: 500,  // ms
    groq: 250,
    openai: 1500,
    kokoro: 100,      // when warm
    edge: 200
  };
  
  let latency = baseLatencies[provider] || 500;
  
  // Adjust for context
  if (provider === 'kokoro' && options.cold_start) {
    latency += 1900; // First call penalty
  }
  
  if (options.text_length > 500) {
    latency *= 1.2; // Longer text = more processing
  }
  
  return { provider, estimated_ms: latency };
}

/**
 * Provider health check (last success time)
 */
const PROVIDER_HEALTH = {
  elevenLabs: { last_success: Date.now(), failures: 0, cooldown_until: null },
  groq: { last_success: Date.now(), failures: 0, cooldown_until: null },
  openai: { last_success: Date.now(), failures: 0, cooldown_until: null },
  kokoro: { last_success: Date.now(), failures: 0, cooldown_until: null },
  edge: { last_success: Date.now(), failures: 0, cooldown_until: null }
};

/**
 * Check if provider is in cooldown
 */
export function isProviderHealthy(provider) {
  const health = PROVIDER_HEALTH[provider];
  if (!health) return false;
  
  if (health.cooldown_until && health.cooldown_until > Date.now()) {
    return false; // In cooldown
  }
  
  return true;
}

/**
 * Record provider failure
 */
export function recordProviderFailure(provider) {
  const health = PROVIDER_HEALTH[provider];
  if (!health) return;
  
  health.failures += 1;
  
  // Exponential cooldown: 60s * 2^(failures-1)
  const cooldownMs = 60000 * Math.pow(2, Math.max(0, health.failures - 1));
  health.cooldown_until = Date.now() + cooldownMs;
  
  console.warn(`[ProviderRouter] ${provider} in cooldown for ${cooldownMs}ms (${health.failures} failures)`);
}

/**
 * Record provider success
 */
export function recordProviderSuccess(provider) {
  const health = PROVIDER_HEALTH[provider];
  if (!health) return;
  
  health.last_success = Date.now();
  health.failures = 0;
  health.cooldown_until = null;
}

/**
 * Get provider stats
 */
export function getProviderStats() {
  return Object.entries(PROVIDER_HEALTH).reduce((acc, [provider, health]) => {
    acc[provider] = {
      healthy: isProviderHealthy(provider),
      failures: health.failures,
      last_success_ago_ms: Date.now() - health.last_success,
      cooldown_remaining_ms: health.cooldown_until 
        ? Math.max(0, health.cooldown_until - Date.now())
        : 0
    };
    return acc;
  }, {});
}

export default {
  PROVIDER_SCORES,
  CONTEXT_PREFERENCES,
  PERSONA_PROVIDER_AFFINITY,
  scoreProvider,
  selectProvider,
  getProviderChain,
  estimateCost,
  estimateLatency,
  isProviderHealthy,
  recordProviderFailure,
  recordProviderSuccess,
  getProviderStats
};

