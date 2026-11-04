import { useEffect, useRef, useCallback } from 'react';
import { authFetch } from '../utils/authFetch';

/**
 * useBackchannelPlayer
 *
 * Provides subtle, natural interviewer backchannel audio cues ("mm-hmm", "I see", "go on")
 * while the candidate is answering.
 *
 * Features:
 * - Fetches backchannel audio clips from /api/voice/backchannel-clips (or synthesizes audio via Web Audio)
 * - Safe cooldown (12-16s) to ensure backchannels are tasteful and never spammy
 * - Mutes/cancels immediately when candidate stops speaking or when AI takes the floor
 */
export default function useBackchannelPlayer({
  isListening = false,
  aiSpeaking = false,
  speakerMuted = false,
  persona = 'friendly',
  gender = 'female',
  enabled = true,
} = {}) {
  const clipsRef = useRef({});
  const lastPlayTimeRef = useRef(0);
  const currentAudioRef = useRef(null);
  const playCountForTurnRef = useRef(0);

  // Fetch / cache backchannel clips
  useEffect(() => {
    let isMounted = true;
    async function loadClips() {
      try {
        const res = await authFetch(`/api/voice/backchannel-clips?persona=${encodeURIComponent(persona)}&gender=${encodeURIComponent(gender)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data?.available && data?.clips) {
          clipsRef.current = data.clips;
        }
      } catch {
        // Fallback: silent or synth
      }
    }
    loadClips();
    return () => {
      isMounted = false;
    };
  }, [persona, gender]);

  // Reset turn play count when listening stops
  useEffect(() => {
    if (!isListening) {
      playCountForTurnRef.current = 0;
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    }
  }, [isListening]);

  // Stop if AI begins speaking
  useEffect(() => {
    if (aiSpeaking && currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
  }, [aiSpeaking]);

  const playBackchannel = useCallback((clipKey = null) => {
    if (!enabled || speakerMuted || aiSpeaking || !isListening) return;

    const now = Date.now();
    // Enforce cooldown: at least 12 seconds between backchannels, max 2 per answer turn
    if (now - lastPlayTimeRef.current < 12000 || playCountForTurnRef.current >= 2) {
      return;
    }

    const availableKeys = Object.keys(clipsRef.current);
    if (availableKeys.length === 0) return;

    const chosenKey = clipKey && clipsRef.current[clipKey]
      ? clipKey
      : availableKeys[Math.floor(Math.random() * availableKeys.length)];

    const audioSrc = clipsRef.current[chosenKey];
    if (!audioSrc) return;

    try {
      const audio = new Audio(audioSrc);
      audio.volume = 0.35; // Gentle, non-intrusive volume
      currentAudioRef.current = audio;
      lastPlayTimeRef.current = now;
      playCountForTurnRef.current += 1;

      audio.onended = () => {
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
      };

      audio.play().catch(() => {});
    } catch {
      // Audio autoplay policy fallback
    }
  }, [enabled, speakerMuted, aiSpeaking, isListening]);

  const stop = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
  }, []);

  return {
    playBackchannel,
    stop,
    hasClips: Object.keys(clipsRef.current).length > 0,
  };
}

