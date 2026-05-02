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
    emotions: ['encouraging', 'supportive'],
    recommended_for: ['behavioral', 'junior_interviews', 'friendly_companies'],
    quality_tier: 'premium',
    providers: ['elevenLabs', 'groq', 'kokoro', 'edge']
  },

  conversational_curious: {
    name: 'Conversational Curious',
    description: 'Inquisitive, interested, natural follow-up style',
    accents: {
      american: { elevenLabs: 'curious_american_f', groq: 'inquisitive', kokoro: 'curious' },
      neutral: { elevenLabs: 'curious_neutral_f', groq: 'conversational', kokoro: 'inquisitive' }
    },
    genders: ['female'],
    emotions: ['neutral', 'encouraging'],
    recommended_for: ['behavioral', 'follow_ups'],
    quality_tier: 'high',
    providers: ['elevenLabs', 'groq', 'kokoro']
  },

  // Analytical personas
  analytical_precise: {
    name: 'Analytical Precise',
    description: 'Methodical, detail-oriented, technical accuracy focus',
    accents: {
      american: { elevenLabs: 'analytical_american_m', groq: 'analytical', openai: 'onyx' },
      indian: { elevenLabs: 'analytical_indian_m', groq: 'analytical', kokoro: 'analytical' },
      neutral: { elevenLabs: 'analytical_neutral_m', groq: 'technical', kokoro: 'precise' }
    },
    genders: ['male', 'female'],
    emotions: ['neutral', 'challenging'],
    recommended_for: ['dsa', 'coding', 'system-design', 'technical'],
    quality_tier: 'premium',
    providers: ['elevenLabs', 'groq', 'kokoro', 'openai']
  },

  analytical_inquisitive: {
    name: 'Analytical Inquisitive',
    description: 'Questions assumptions, digs deeper, Socratic method',
    accents: {
      american: { elevenLabs: 'inquisitive_american_m', groq: 'analytical' },
      neutral: { elevenLabs: 'inquisitive_neutral_m', groq: 'probing', kokoro: 'analytical' }
    },
    genders: ['male', 'female'],
    emotions: ['challenging', 'curious'],
    recommended_for: ['dsa', 'system-design', 'senior_interviews'],
    quality_tier: 'high',
    providers: ['elevenLabs', 'groq', 'kokoro']
  },

  // Calm & Supportive personas
  calm_supportive: {
    name: 'Calm Supportive',
    description: 'Soothing, encouraging, low-pressure environment',
    accents: {
      american: { elevenLabs: 'calm_american_f', groq: 'calm', kokoro: 'calm' },
      neutral: { elevenLabs: 'calm_neutral_f', groq: 'supportive', kokoro: 'calm', edge: 'soothing' }
    },
    genders: ['female'],
    emotions: ['supportive', 'encouraging'],
    recommended_for: ['junior_interviews', 'behavioral', 'entry_level'],
    quality_tier: 'high',
    providers: ['elevenLabs', 'groq', 'kokoro', 'edge']
  },

  calm_empathetic: {
    name: 'Calm Empathetic',
    description: 'Empathetic, understanding, acknowledges effort',
    accents: {
      american: { elevenLabs: 'empathetic_american_f', groq: 'empathetic', kokoro: 'calm' },
      neutral: { elevenLabs: 'empathetic_neutral_f', groq: 'supportive', kokoro: 'warm' }
    },
    genders: ['female'],
    emotions: ['supportive', 'understanding'],
    recommended_for: ['behavioral', 'stressful_interviews'],
    quality_tier: 'high',
    providers: ['elevenLabs', 'groq', 'kokoro']
  },

  // Dynamic & Energetic personas
  energetic_enthusiastic: {
    name: 'Energetic Enthusiastic',
    description: 'Upbeat, motivating, high-energy engagement',
    accents: {
      american: { elevenLabs: 'enthusiastic_american_f', groq: 'enthusiastic', kokoro: 'enthusiastic' },
      australian: { elevenLabs: 'enthusiastic_australian_m', groq: 'energetic', kokoro: 'enthusiastic' }
    },
    genders: ['male', 'female'],
    emotions: ['encouraging', 'energetic'],
    recommended_for: ['junior_interviews', 'easy_questions', 'motivational'],
    quality_tier: 'high',
    providers: ['elevenLabs', 'groq', 'kokoro']
  },

  energetic_driven: {
    name: 'Energetic Driven',
    description: 'Motivated, action-oriented, pushes for excellence',
    accents: {
      american: { elevenLabs: 'driven_american_m', groq: 'driven', openai: 'echo' },
      neutral: { elevenLabs: 'driven_neutral_m', groq: 'assertive', kokoro: 'driven' }
    },
    genders: ['male'],
    emotions: ['challenging', 'energetic'],
    recommended_for: ['senior_interviews', 'leadership', 'hard_questions'],
    quality_tier: 'premium',
    providers: ['elevenLabs', 'groq', 'kokoro', 'openai']
  },

  // Industry-specific personas
  mentor_guide: {
    name: 'Mentor Guide',
    description: 'Wise, patient, teaching-focused guidance',
    accents: {
      american: { elevenLabs: 'mentor_american_m', groq: 'mentor', kokoro: 'warm' },
      neutral: { elevenLabs: 'mentor_neutral_m', groq: 'supportive', kokoro: 'mentor' }
    },
    genders: ['male', 'female'],
    emotions: ['supportive', 'encouraging'],
    recommended_for: ['junior_interviews', 'learning_focus', 'behavioral'],
    quality_tier: 'high',
    providers: ['elevenLabs', 'groq', 'kokoro']
  },

  recruiter_hr: {
    name: 'Recruiter HR',
    description: 'Professional recruiter, culture-fit focus, friendly-professional',
    accents: {
      american: { elevenLabs: 'recruiter_american_f', groq: 'professional' },
      neutral: { elevenLabs: 'recruiter_neutral_f', groq: 'friendly', edge: 'friendly' }
    },
    genders: ['female'],
    emotions: ['friendly', 'professional'],
    recommended_for: ['hr', 'behavioral', 'recruiter_focus'],
    quality_tier: 'high',
    providers: ['elevenLabs', 'groq', 'edge']
  },

  // Default fallback personas
  default_neutral: {
    name: 'Default Neutral',
    description: 'Neutral, clear, fallback option',
    accents: {
      neutral: { elevenLabs: 'default_neutral_m', groq: 'neutral', kokoro: 'neutral', edge: 'neutral', openai: 'nova' }
    },
    genders: ['male', 'female'],
    emotions: ['neutral'],
    recommended_for: ['all'],
    quality_tier: 'standard',
    providers: ['elevenLabs', 'groq', 'kokoro', 'edge', 'openai']
  }
};

/**
 * Accent profiles with language, dialect, clarity info
 */
export const ACCENT_PROFILES = {
  american: { language: 'en-US', clarity: 'very_high', availability: 'all_providers' },
  british: { language: 'en-GB', clarity: 'very_high', availability: 'elevenLabs,groq,openai' },
  indian: { language: 'en-IN', clarity: 'high', availability: 'elevenLabs,groq,kokoro' },
  australian: { language: 'en-AU', clarity: 'high', availability: 'elevenLabs,groq,kokoro' },
  canadian: { language: 'en-CA', clarity: 'high', availability: 'elevenLabs,groq' },
  neutral: { language: 'en', clarity: 'very_high', availability: 'all_providers' }
};

/**
 * Get persona by name
 */
export function getPersona(personaName) {
  return VOICE_PERSONAS[personaName] || VOICE_PERSONAS.default_neutral;
}

/**
 * Get all available personas with filters
 */
export function getPersonas(filters = {}) {
  const { recommended_for, quality_tier, providers } = filters;
  
  return Object.entries(VOICE_PERSONAS)
    .filter(([_, persona]) => {
      if (recommended_for && !persona.recommended_for.includes(recommended_for)) return false;
      if (quality_tier && persona.quality_tier !== quality_tier) return false;
      if (providers && !providers.some(p => persona.providers.includes(p))) return false;
      return true;
    })
    .reduce((acc, [name, persona]) => ({ ...acc, [name]: persona }), {});
}

/**
 * Get voice ID for a persona + accent + gender combination
 */
export function getVoiceId(personaName, accent = 'neutral', gender = 'female', provider = null) {
  const persona = getPersona(personaName);
  
  if (!persona.accents[accent]) {
    console.warn(`Accent '${accent}' not available for persona '${personaName}', using neutral`);
    accent = 'neutral';
  }
  
  const accentVoices = persona.accents[accent];
  if (!accentVoices) return null;
  
  // If provider specified, use it
  if (provider && accentVoices[provider]) {
    return accentVoices[provider];
  }
  
  // Otherwise use first available provider
  const voiceId = Object.values(accentVoices)[0];
  return voiceId;
}

/**
 * Get recommended persona for interview type + difficulty
 */
export function getRecommendedPersona(interviewType, difficulty, userPreferences = {}) {
  if (userPreferences.preferred_persona) {
    return userPreferences.preferred_persona;
  }
  
  // Map interview type + difficulty to persona
  const personaMap = {
    dsa: {
      easy: 'conversational_friendly',
      medium: 'analytical_precise',
      hard: 'analytical_inquisitive'
    },
    'system-design': {
      easy: 'conversational_friendly',
      medium: 'professional_neutral',
      hard: 'professional_assertive'
    },
    behavioral: {
      easy: 'calm_supportive',
      medium: 'conversational_friendly',
      hard: 'professional_neutral'
    },
    coding: {
      easy: 'calm_supportive',
      medium: 'analytical_precise',
      hard: 'analytical_inquisitive'
    },
    technical: {
      easy: 'mentor_guide',
      medium: 'analytical_precise',
      hard: 'professional_assertive'
    },
    'hr': {
      easy: 'recruiter_hr',
      medium: 'recruiter_hr',
      hard: 'recruiter_hr'
    }
  };
  
  const recommended = personaMap[interviewType]?.[difficulty] || 'default_neutral';
  return recommended;
}

/**
 * Get persona quality metrics for A/B testing
 */
export function getPersonaMetrics(personaName) {
  const persona = getPersona(personaName);
  
  return {
    persona: personaName,
    quality_tier: persona.quality_tier,
    providers: persona.providers,
    accent_count: Object.keys(persona.accents).length,
    gender_support: persona.genders,
    emotion_support: persona.emotions,
    ideal_for: persona.recommended_for
  };
}

/**
 * Validate persona configuration
 */
export function validatePersona(personaName, accent, gender) {
  const persona = getPersona(personaName);
  
  if (!persona.accents[accent]) {
    return { valid: false, error: `Accent '${accent}' not available` };
  }
  
  if (!persona.genders.includes(gender)) {
    return { valid: false, error: `Gender '${gender}' not available for this persona` };
  }
  
  return { valid: true };
}

/**
 * Get fallback persona if requested one unavailable
 */
export function getFallbackPersona(personaName) {
  const persona = getPersona(personaName);
  
  // Try to find similar persona
  if (persona.name === 'Default Neutral') {
    return 'default_neutral';
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

