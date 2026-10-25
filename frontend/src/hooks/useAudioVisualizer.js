import { useEffect, useMemo, useRef, useState } from 'react';

// Global singletons to prevent "MediaElement already connected" errors
// and to avoid repeatedly creating/destroying AudioContexts.
let globalAudioContext = null;
const mediaElementSourceCache = new WeakMap();

function getGlobalAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!globalAudioContext || globalAudioContext.state === 'closed') {
    globalAudioContext = new AudioContextClass();
  }
  return globalAudioContext;
}

export function normalizeBars(frequencyData, barCount = 8) {
  if (!frequencyData || frequencyData.length === 0) {
    return Array.from({ length: barCount }, () => 0);
  }

  const chunkSize = Math.max(1, Math.floor(frequencyData.length / barCount));
  const bars = [];

  for (let i = 0; i < barCount; i += 1) {
    const start = i * chunkSize;
    const end = Math.min(frequencyData.length, start + chunkSize);
    if (start >= end) {
      bars.push(0);
      continue;
    }

    let sum = 0;
    for (let j = start; j < end; j += 1) {
      sum += frequencyData[j];
    }
    bars.push(Math.max(0, Math.min(1, (sum / (end - start)) / 255)));
  }

  return bars;
}

const toRms = (timeData) => {
  if (!timeData || timeData.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < timeData.length; i += 1) {
    const sample = (timeData[i] - 128) / 128;
    sum += sample * sample;
  }
  return Math.sqrt(sum / timeData.length);
};

const LEVEL_EPSILON = 0.015;
const BAR_EPSILON = 0.02;

function barsDiffer(nextBars, previousBars) {
  if (!previousBars || previousBars.length !== nextBars.length) return true;
  for (let i = 0; i < nextBars.length; i += 1) {
    if (Math.abs(nextBars[i] - previousBars[i]) > BAR_EPSILON) return true;
  }
  return false;
}

export default function useAudioVisualizer({ inputStream = null, outputAudioElement = null, barCount = 8 } = {}) {
  const [inputBars, setInputBars] = useState(() => Array.from({ length: barCount }, () => 0));
  const [outputBars, setOutputBars] = useState(() => Array.from({ length: barCount }, () => 0));
  const [inputLevel, setInputLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);

  const rafRef = useRef(null);
  // Remember the last painted values so silence doesn't re-render the whole
  // page 60 times a second.
  const lastPaintRef = useRef({
    inputBars: null,
    outputBars: null,
    inputLevel: 0,
    outputLevel: 0,
  });

  useEffect(() => {
    const audioContext = getGlobalAudioContext();
    if (!audioContext) return undefined;

    // Resume context if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }

    let mounted = true;
    let inputSource = null;
    let outputSource = null;

    const inputAnalyser = audioContext.createAnalyser();
    const outputAnalyser = audioContext.createAnalyser();
    inputAnalyser.fftSize = 128;
    outputAnalyser.fftSize = 128;

    if (inputStream) {
      try {
        inputSource = audioContext.createMediaStreamSource(inputStream);
        inputSource.connect(inputAnalyser);
      } catch {
        // No-op: stream may have ended.
      }
    }

    if (outputAudioElement && outputAudioElement.src) {
      try {
        // Only create MediaElementSource ONCE per HTMLMediaElement
        if (mediaElementSourceCache.has(outputAudioElement)) {
          outputSource = mediaElementSourceCache.get(outputAudioElement);
        } else {
          outputSource = audioContext.createMediaElementSource(outputAudioElement);
          mediaElementSourceCache.set(outputAudioElement, outputSource);
        }
        
        // Re-connect the cached or new source to our analyser and destination
        outputSource.disconnect(); // Clear any old connections safely
        outputSource.connect(outputAnalyser);
        outputAnalyser.connect(audioContext.destination);
      } catch (err) {
        console.warn('[useAudioVisualizer] Could not connect output element:', err);
      }
    }

    const inputFrequency = new Uint8Array(inputAnalyser.frequencyBinCount);
    const inputTime = new Uint8Array(inputAnalyser.fftSize);
    const outputFrequency = new Uint8Array(outputAnalyser.frequencyBinCount);
    const outputTime = new Uint8Array(outputAnalyser.fftSize);

    const tick = () => {
      if (!mounted) return;

      inputAnalyser.getByteFrequencyData(inputFrequency);
      inputAnalyser.getByteTimeDomainData(inputTime);
      outputAnalyser.getByteFrequencyData(outputFrequency);
      outputAnalyser.getByteTimeDomainData(outputTime);

      const nextInputBars = normalizeBars(inputFrequency, barCount);
      const nextOutputBars = normalizeBars(outputFrequency, barCount);
      const nextInputLevel = toRms(inputTime);
      const nextOutputLevel = toRms(outputTime);
      const lastPaint = lastPaintRef.current;

      if (barsDiffer(nextInputBars, lastPaint.inputBars)) {
        lastPaint.inputBars = nextInputBars;
        setInputBars(nextInputBars);
      }
      if (barsDiffer(nextOutputBars, lastPaint.outputBars)) {
        lastPaint.outputBars = nextOutputBars;
        setOutputBars(nextOutputBars);
      }
      if (Math.abs(nextInputLevel - lastPaint.inputLevel) > LEVEL_EPSILON) {
        lastPaint.inputLevel = nextInputLevel;
        setInputLevel(nextInputLevel);
      }
      if (Math.abs(nextOutputLevel - lastPaint.outputLevel) > LEVEL_EPSILON) {
        lastPaint.outputLevel = nextOutputLevel;
        setOutputLevel(nextOutputLevel);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (outputSource) {
        try { 
            outputSource.disconnect(); 
            // Crucial: Connect it back directly to destination so audio still plays 
            // even when the visualizer component is unmounted or re-rendering!
            outputSource.connect(audioContext.destination);
        } catch { /* no-op */ }
      }
      if (inputSource) {
        try { inputSource.disconnect(); } catch { /* no-op */ }
      }
      
      // Do NOT close the global audio context here, as it is shared and reused!
    };
  }, [inputStream, outputAudioElement, barCount]);

  return useMemo(() => ({
    inputBars,
    outputBars,
    inputLevel,
    outputLevel,
    inputActive: inputLevel > 0.08,
    outputActive: outputLevel > 0.05,
  }), [inputBars, outputBars, inputLevel, outputLevel]);
}
