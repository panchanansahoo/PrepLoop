import { useState, useCallback, useEffect } from 'react';

/**
 * useVoicePersona Hook
 * Manages voice persona selection and preferences
 * Integrates with TTS backend and user settings
 */

export function useVoicePersona(initialPersona = 'default_neutral') {
  const [currentPersona, setCurrentPersona] = useState(initialPersona);
  const [currentAccent, setCurrentAccent] = useState('neutral');
  const [currentGender, setCurrentGender] = useState('female');
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [previewAudio, setPreviewAudio] = useState(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load user's saved preferences on mount
  useEffect(() => {
    loadUserPreferences();
  }, []);

  /**
   * Load user's saved voice preferences from localStorage/server
   */
  const loadUserPreferences = useCallback(async () => {
    try {
      // Try to load from localStorage first
      const savedPreferences = localStorage.getItem('voice_preferences');
      if (savedPreferences) {
        const prefs = JSON.parse(savedPreferences);
        if (prefs.persona) setCurrentPersona(prefs.persona);
        if (prefs.accent) setCurrentAccent(prefs.accent);
        if (prefs.gender) setCurrentGender(prefs.gender);
        if (prefs.emotion) setCurrentEmotion(prefs.emotion);
      }
    } catch (err) {
      console.error('Failed to load voice preferences:', err);
    }
  }, []);

  /**
   * Save voice preferences to localStorage and server
   */
  const savePreferences = useCallback(async () => {
    try {
      const preferences = {
        persona: currentPersona,
        accent: currentAccent,
        gender: currentGender,
        emotion: currentEmotion,
        saved_at: new Date().toISOString()
      };

      // Save to localStorage
      localStorage.setItem('voice_preferences', JSON.stringify(preferences));

      // Optional: Save to server via API
      // await fetch('/api/user/voice-preferences', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(preferences)
      // });

      return preferences;
    } catch (err) {
      setError(`Failed to save preferences: ${err.message}`);
      throw err;
    }
  }, [currentPersona, currentAccent, currentGender, currentEmotion]);

  /**
   * Change persona
   */
  const changePersona = useCallback((newPersona) => {
    setCurrentPersona(newPersona);
    setError(null);
  }, []);

  /**
   * Change accent
   */
  const changeAccent = useCallback((newAccent) => {
    setCurrentAccent(newAccent);
  }, []);

  /**
   * Change gender
   */
  const changeGender = useCallback((newGender) => {
    setCurrentGender(newGender);
  }, []);

  /**
   * Change emotion
   */
  const changeEmotion = useCallback((newEmotion) => {
    setCurrentEmotion(newEmotion);
  }, []);

  /**
   * Generate and play preview audio
   */
  const playPreview = useCallback(async (sampleText = "Hello, I'm your AI interviewer. How are you feeling today?") => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/voice/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          persona: currentPersona,
          accent: currentAccent,
          gender: currentGender,
          emotion: currentEmotion
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate preview: ${response.status}`);
      }

      const data = await response.json();
      
      // Play audio
      const audio = new Audio(data.audio_url || `data:audio/wav;base64,${data.audio_base64}`);
      audio.onended = () => setIsPreviewPlaying(false);
      
      setPreviewAudio(audio);
      setIsPreviewPlaying(true);
      await audio.play();
    } catch (err) {
      setError(`Preview failed: ${err.message}`);
      console.error('Preview generation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPersona, currentAccent, currentGender, currentEmotion]);

  /**
   * Stop preview
   */
  const stopPreview = useCallback(() => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
    }
    setIsPreviewPlaying(false);
  }, [previewAudio]);

  /**
   * Get recommended persona for interview type
   */
  const getRecommendedPersona = useCallback(async (interviewType, difficulty) => {
    try {
      const response = await fetch(`/api/voice/recommended?type=${interviewType}&difficulty=${difficulty}`);
      if (!response.ok) throw new Error('Failed to get recommendation');
      const data = await response.json();
      return data.persona;
    } catch (err) {
      console.warn('Failed to get recommended persona:', err);
      return 'default_neutral';
    }
  }, []);

  /**
   * Apply recommended persona
   */
  const applyRecommendation = useCallback(async (interviewType, difficulty) => {
    const recommended = await getRecommendedPersona(interviewType, difficulty);
    changePersona(recommended);
  }, [getRecommendedPersona, changePersona]);

  /**
   * Reset to defaults
   */
  const resetToDefaults = useCallback(() => {
    setCurrentPersona('default_neutral');
    setCurrentAccent('neutral');
    setCurrentGender('female');
    setCurrentEmotion('neutral');
    setError(null);
  }, []);

  /**
   * Get current configuration summary
   */
  const getSummary = useCallback(() => {
    return {
      persona: currentPersona,
      accent: currentAccent,
      gender: currentGender,
      emotion: currentEmotion,
      description: `${currentPersona} with ${currentAccent} accent, ${currentGender} voice, ${currentEmotion} emotion`
    };
  }, [currentPersona, currentAccent, currentGender, currentEmotion]);

  return {
    // Current state
    currentPersona,
    currentAccent,
    currentGender,
    currentEmotion,
    isPreviewPlaying,
    isLoading,
    error,

    // Setters
    changePersona,
    changeAccent,
    changeGender,
    changeEmotion,

    // Actions
    playPreview,
    stopPreview,
    savePreferences,
    resetToDefaults,
    applyRecommendation,
    getSummary
  };
}

export default useVoicePersona;
