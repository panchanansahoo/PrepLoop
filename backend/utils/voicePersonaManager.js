/**
 * Voice Persona Manager
 * Manages 20+ AI voice personas with accents, genders, emotions
 * Maps personas to provider capabilities
 */

/**
 * Comprehensive voice persona definitions
 * Structure: { persona: { accents: [voice_ids], qualities, providers } }
 */
export const VOICE_PERSONAS = {
  // Professional & Formal personas
  professional_neutral: {
    name: 'Professional Neutral',
    description: 'Formal, business-appropriate, clear enunciation',
    accents: {
      american: { elevenLabs: 'professional_american_m', groq: 'professional', openai: 'onyx' },
      british: { elevenLabs: 'professional_british_m', groq: 'formal', openai: 'echo' },
      neutral: { elevenLabs: 'professional_neutral_m', groq: 'professional', openai: 'nova' }
    },
    genders: ['male', 'female'],
    emotions: ['neutral', 'encouraging'],
    recommended_for: ['system-design', 'technical', 'formal_interviews'],
    quality_tier: 'premium',
    providers: ['elevenLabs', 'groq', 'openai']
  },

  professional_assertive: {
    name: 'Professional Assertive',
    description: 'Confident, challenging, probing depth',
    accents: {
      american: { elevenLabs: 'assertive_american_m', groq: 'assertive', openai: 'echo' },
      british: { elevenLabs: 'assertive_british_m', groq: 'formal_strong', openai: 'nova' }
    },
    genders: ['male', 'female'],
    emotions: ['challenging', 'direct'],
    recommended_for: ['senior-interviews', 'system-design'],
    quality_tier: 'premium',
    providers: ['elevenLabs', 'groq']
  },

  // Conversational personas
  conversational_friendly: {
    name: 'Conversational Friendly',
    description: 'Warm, approachable, supportive feedback',
    accents: {
      american: { elevenLabs: 'friendly_american_f', groq: 'friendly', kokoro: 'friendly', openai: 'shimmer' },
      australian: { elevenLabs: 'friendly_australian_f', groq: 'friendly', kokoro: 'warm' },
      neutral: { elevenLabs: 'friendly_neutral_f', groq: 'casual', kokoro: 'friendly', edge: 'cheerful' }
    },
    genders: ['male', 'female', 'neutral'],
    emotions: ['supportive', 'encouraging', 'helpful'],
    recommended_for: ['dsa-interviews', 'practice', 'beginner'],
    quality_tier: 'standard',
    providers: ['elevenLabs', 'groq', 'kokoro', 'edge', 'openai']
  },

  conversational_curious: {
    name: 'Conversational Curious',
    description: 'Inquisitive, thoughtful, exploring depth',
    accents: {
      american: { elevenLabs: 'curious_american_m', groq: 'inquisitive', kokoro: 'curious', openai: 'nova' },
      british: { elevenLabs: 'curious_british_m', groq: 'thoughtful', kokoro: 'inquisitive', openai: 'shimmer' },
      indian: { elevenLabs: 'curious_indian_m', groq: 'exploring', kokoro: 'analytical' }
    },
    genders: ['male', 'female'],
    emotions: ['curious', 'inquistive', 'exploring'],
    recommended_for: ['deep-dive', 'algorithm-explanation', 'thinking-process'],
    quality_tier: 'standard',
    providers: ['elevenLabs', 'groq', 'kokoro', 'openai']
  },

  // Analytical personas
  analytical_precise: {
    name: 'Analytical Precise',
    description: 'Methodical, detailed, focused on correctness',
    accents: {
      american: { elevenLabs: 'precise_american_m', groq: 'analytical', kokoro: 'analytical', openai: 'onyx' },
      british: { elevenLabs: 'precise_british_m', groq: 'methodical', kokoro: 'precise', openai: 'echo' },
      neutral: { elevenLabs: 'precise_neutral_m', groq: 'technical', kokoro: 'technical', openai: 'nova' }
    },
    genders: ['male', 'female'],
    emotions: ['methodical', 'focused', 'precise'],
    recommended_for: ['algorithm-analysis', 'complex-problems', 'technical-details'],
    quality_tier: 'premium',
    providers: ['elevenLabs', 'groq', 'kokoro', 'openai']
  },

  analytical_inquisitive: {
    name: 'Analytical Inquisitive',
    description: 'Questioning assumptions, seeking edge cases',
    accents: {
      american: { elevenLabs: 'inquisitive_american_m', groq: 'challenging', kokoro: 'challenging', openai: 'echo' },
      british: { elevenLabs: 'inquisitive_british_m', groq: 'skeptical', kokoro: 'analytical_deep', openai: 'nova' },
      indian: { elevenLabs: 'inquisitive_indian_m', groq: 'analytical_deep', kokoro: 'inquisitive', openai: 'shimmer' }
    },
    genders: ['male', 'female'],
    emotions: ['inquisitive', 'skeptical', 'challenging'],
    recommended_for: ['system-design', 'edge-cases', 'optimization'],
    quality_tier: 'premium',
    providers: ['elevenLabs', 'groq', 'kokoro', 'openai']
  },

  // Supportive personas
  calm_supportive: {
    name: 'Calm Supportive',
    description: 'Patient, encouraging, constructive feedback',
    accents: {
      american: { elevenLabs: 'supportive_american_f', groq: 'patient', kokoro: 'patient', openai: 'shimmer' },
      british: { elevenLabs: 'supportive_british_f', groq: 'gentle', kokoro: 'calm', openai: 'nova' },
      australian: { elevenLabs: 'supportive_australian_f', groq: 'relaxed', kokoro: 'supportive', openai: 'alloy' },
      neutral: { elevenLabs: 'supportive_neutral_f', groq: 'supportive', kokoro: 'encouraging', edge: 'calm' }
    },
    genders: ['male', 'female', 'neutral'],
    emotions: ['patient', 'supportive', 'constructive'],
    recommended_for: ['beginner', 'practice', 'confidence-building'],
    quality_tier: 'standard',
    providers: ['elevenLabs', 'groq', 'kokoro', 'edge', 'openai']
  },

  calm_empathetic: {
    name: 'Calm Empathetic',
    description: 'Understanding, empathetic, stress-aware',
    accents: {
      american: { elevenLabs: 'empathetic_american_f', groq: 'understanding', kokoro: 'empathetic', openai: 'nova' },
      british: { elevenLabs: 'empathetic_british_f', groq: 'compassionate', kokoro: 'understanding', openai: 'shimmer' },
      neutral: { elevenLabs: 'empathetic_neutral_f', groq: 'empathetic', kokoro: 'supportive_calm', edge: 'empathetic' }
    },
    genders: ['male', 'female', 'neutral'],
    emotions: ['empathetic', 'understanding', 'stress-aware'],
    recommended_for: ['stressful', 'high-pressure', 'confidence-building'],
    quality_tier: 'premium',
    providers: ['elevenLabs', 'groq', 'kokoro', 'edge', 'openai']
  },

  // Energetic personas
  energetic_enthusiastic: {
    name: 'Energetic Enthusiastic',
    description: 'Motivating, enthusiastic, energy-boosting',
    accents: {
      american: { elevenLabs: 'enthusiastic_american_m', groq: 'energetic', kokoro: 'motivational', openai: 'alloy' },
      british: { elevenLabs: 'enthusiastic_british_m', groq: 'exciting', kokoro: 'enthusiastic', openai: 'shimmer' },
      indian: { elevenLabs: 'enthusiastic_indian_m', groq: 'energetic_indian', kokoro: 'energetic', openai: 'echo' },
      neutral: { elevenLabs: 'enthusiastic_neutral_m', groq: 'motivating', kokoro: 'energetic', edge: 'enthusiastic' }
    },
    genders: ['male', 'female'],
    emotions: ['enthusiastic', 'motivating', 'energetic'],
    recommended_for: ['morning', 'low-energy', 'motivation'],
    quality_tier: 'standard',
    providers: ['elevenLabs', 'groq', 'kokoro', 'edge', 'openai']
  },

  energetic_driven: {
    name: 'Energetic Driven',
    description: 'Fast-paced, results-oriented, efficiency-focused',
    accents: {
      american: { elevenLabs: 'driven_american_m', groq: 'fast_paced', kokoro: 'efficient', openai: 'echo' },
      british: { elevenLabs: 'driven_british_m', groq: 'results_oriented', kokoro: 'focused', openai: 'onyx' },
      neutral: { elevenLabs: 'driven_neutral_m', groq: 'efficiency', kokoro: 'driven', openai: 'alloy' }
    },
    genders: ['male', 'female'],
    emotions: ['driven', 'efficient', 'results-oriented'],
    recommended_for: ['speed-practice', 'time-pressure', 'efficiency'],
    quality_tier: 'premium',
    providers: ['elevenLabs', 'groq', 'kokoro', 'openai']
  },

  // Mentor personas
  mentor_guide: {
    name: 'Mentor Guide',
    description: 'Educational, teaching-focused, step-by-step guidance',
    accents: {
      american: { elevenLabs: 'mentor_american_m', groq: 'teaching', kokoro: 'educational', openai: 'nova' },
      british: { elevenLabs: 'mentor_british_m', groq: 'instructional', kokoro: 'teacher', openai: 'shimmer' },
      neutral: { elevenLabs: 'mentor_neutral_m', groq: 'guiding', kokoro: 'mentor', edge: 'teacher' }
    },
    genders: ['male', 'female', 'neutral'],
    emotions: ['educational', 'patient', 'guiding'],
    recommended_for: ['learning', 'education', 'step-by-step'],
    quality_tier: 'premium',
    providers: ['elevenLabs', 'groq', 'kokoro', 'edge', 'openai']
  },

  // HR personas
  recruiter_hr: {
    name: 'Recruiter HR',
    description: 'Professional HR style, competency-focused, behavioral',
    accents: {
      american: { elevenLabs: 'hr_american_f', groq: 'hr_professional', kokoro: 'hr_voice', openai: 'nova' },
      british: { elevenLabs: 'hr_british_f', groq: 'recruiter', kokoro: 'hr_professional', openai: 'echo' },
      indian: { elevenLabs: 'hr_indian_f', groq: 'hr_indian', kokoro: 'hr_indian', openai: 'shimmer' },
      neutral: { elevenLabs: 'hr_neutral_f', groq: 'hr_general', kokoro: 'hr_neutral', edge: 'professional' }
    },
    genders: ['male', 'female'],
    emotions: ['professional', 'competency-focused', 'behavioral'],
    recommended_for: ['hr-round', 'behavioral', 'competency'],
    quality_tier: 'standard',
    providers: ['elevenLabs', 'groq', 'kokoro', 'edge', 'openai']
  },

  // Default persona
  default_neutral: {
    name: 'Default Neutral',
    description: 'Balanced, general-purpose, adaptable',
    accents: {
      american: { elevenLabs: 'default_american_m', groq: 'general', kokoro: 'default', openai: 'alloy', edge: 'default' },
      british: { elevenLabs: 'default_british_m', groq: 'standard', kokoro: 'neutral', openai: 'nova', edge: 'neutral' },
      indian: { elevenLabs: 'default_indian_m', groq: 'indian_standard', kokoro: 'indian_default', openai: 'echo' },
      neutral: { elevenLabs: 'default_neutral_m', groq: 'default', kokoro: 'standard', openai: 'nova', edge: 'default' },
      australian: { elevenLabs: 'default_australian_m', groq: 'aussie', kokoro: 'australian', openai: 'shimmer', edge: 'aussie' },
      canadian: { elevenLabs: 'default_canadian_m', groq: 'canadian', kokoro: 'north_american', openai: 'nova' }
    },
    genders: ['male', 'female', 'neutral'],
    emotions: ['balanced', 'adaptable', 'neutral'],
    recommended_for: ['general', 'default', 'fallback'],
    quality_tier: 'standard',
    providers: ['elevenLabs', 'groq', 'kokoro', 'edge', 'openai']
  }
};

/**
 * Accent profile definitions with regional characteristics
 */
export const ACCENT_PROFILES = {
  american: {
    rhythm: 'stress-timed',
    intonation: 'varied',
    vowel_reduction: 'common',
    speed: 'moderate-fast',
    clarity: 'high'
  },
  british: {
    rhythm: 'stress-timed',
    intonation: 'formal-melodic',
    vowel_reduction: 'distinctive',
    speed: 'moderate',
    clarity: 'very-high'
  },
  indian: {
    rhythm: 'syllable-timed',
    intonation: 'melodic',
    vowel_reduction: 'minimal',
    speed: 'moderate-fast',
    clarity: 'high'
  },
  australian: {
    rhythm: 'stress-timed',
    intonation: 'relaxed-melodic',
    vowel_reduction: 'unique',
    speed: 'moderate',
    clarity: 'high'
  },
  canadian: {
    rhythm: 'stress-timed',
    intonation: 'neutral',
    vowel_reduction: 'similar-to-american',
    speed: 'moderate',
    clarity: 'high'
  },
  neutral: {
    rhythm: 'stress-timed',
    intonation: 'balanced',
    vowel_reduction: 'standard',
    speed: 'moderate',
    clarity: 'high'
  }
};

/**
 * Get persona definition by name
 */
export function getPersona(personaName) {
  return VOICE_PERSONAS[personaName] || VOICE_PERSONAS.default_neutral;
}

/**
 * Get all persona names
 */
export function getPersonas() {
  return Object.keys(VOICE_PERSONAS);
}

/**
 * Get voice ID for a specific persona, accent, and gender
 */
export function getVoiceId(personaName, accent, gender) {
  const persona = getPersona(personaName);
  const accentVoices = persona.accents[accent] || persona.accents.neutral;
  return accentVoices['groq'] || accentVoices['elevenLabs'] || accentVoices['kokoro'] || accentVoices['openai'] || accentVoices['edge'] || 'default';
}

/**
 * Get recommended persona for a given scenario
 */
export function getRecommendedPersona(scenario, difficulty = 'medium', experience = 'intermediate') {
  // Scenario-based recommendations
  const scenarioMap = {
    'dsa-practice': 'conversational_friendly',
    'system-design': 'professional_neutral',
    'behavioral': 'recruiter_hr',
    'mock-interview': 'professional_neutral',
    'hr-round': 'recruiter_hr',
    'technical-screen': 'analytical_precise',
    'senior-role': 'professional_assertive',
    'junior-role': 'calm_supportive',
    'stress-test': 'energetic_driven',
    'learning': 'mentor_guide'
  };

  // Experience-based adjustments
  if (experience === 'beginner') {
    return scenarioMap[scenario] || 'calm_supportive';
  } else if (experience === 'expert') {
    return scenarioMap[scenario] || 'professional_assertive';
  }

  return scenarioMap[scenario] || 'default_neutral';
}

/**
 * Get persona metrics for evaluation
 */
export function getPersonaMetrics() {
  const metrics = {};
  for (const [name, persona] of Object.entries(VOICE_PERSONAS)) {
    metrics[name] = {
      quality_tier: persona.quality_tier,
      provider_count: persona.providers.length,
      accent_count: Object.keys(persona.accents).length,
      emotion_count: persona.emotions.length,
      recommended_for_count: persona.recommended_for.length
    };
  }
  return metrics;
}

/**
 * Validate persona configuration
 */
export function validatePersona(personaName) {
  const persona = getPersona(personaName);
  const errors = [];

  if (!persona.name) errors.push('Missing name');
  if (!persona.description) errors.push('Missing description');
  if (!persona.accents) errors.push('Missing accents');
  if (!persona.genders || persona.genders.length === 0) errors.push('Missing or empty genders');
  if (!persona.emotions || persona.emotions.length === 0) errors.push('Missing or empty emotions');
  if (!persona.recommended_for || persona.recommended_for.length === 0) errors.push('Missing or empty recommended_for');
  if (!persona.quality_tier) errors.push('Missing quality_tier');
  if (!persona.providers || persona.providers.length === 0) errors.push('Missing or empty providers');

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get fallback persona when primary persona is unavailable
 */
export function getFallbackPersona(personaName) {
  if (!VOICE_PERSONAS[personaName]) {
    return 'default_neutral';
  }

  const persona = VOICE_PERSONAS[personaName];

  // If same quality tier, try different accent
  for (const [name, p] of Object.entries(VOICE_PERSONAS)) {
    if (p.quality_tier === persona.quality_tier && name !== personaName) {
      return name;
    }
  }

  // If high-quality, try same family
  if (persona.quality_tier === 'premium') {
    const sameName = Object.keys(VOICE_PERSONAS)
      .filter(key => key.startsWith(personaName.split('_')[0]) && key !== personaName)
      .pop();
    if (sameName) return sameName;
  }

  // Default fallback
  return 'default_neutral';
}

/**
 * List all available combinations
 */
export function listAvailableVoices() {
  const voices = [];
  
  Object.entries(VOICE_PERSONAS).forEach(([personaName, persona]) => {
    Object.keys(persona.accents).forEach(accent => {
      persona.genders.forEach(gender => {
        voices.push({
          persona: personaName,
          accent,
          gender,
          quality: persona.quality_tier,
          voiceId: getVoiceId(personaName, accent, gender)
        });
      });
    });
  });
  
  return voices;
}

// Export the voice persona manager object
export const voicePersonaManager = {
  VOICE_PERSONAS,
  ACCENT_PROFILES,
  getPersona,
  getPersonas,
  getVoiceId,
  getRecommendedPersona,
  getPersonaMetrics,
  validatePersona,
  getFallbackPersona,
  listAvailableVoices
};

export default {
  VOICE_PERSONAS,
  ACCENT_PROFILES,
  getPersona,
  getPersonas,
  getVoiceId,
  getRecommendedPersona,
  getPersonaMetrics,
  validatePersona,
  getFallbackPersona,
  listAvailableVoices
};