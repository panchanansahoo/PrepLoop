import { useEffect, useMemo, useRef, useState } from 'react';

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

export default function useAudioVisualizer({ inputStream = null, outputAudioElement = null, barCount = 8 } = {}) {
  const [inputBars, setInputBars] = useState(() => Array.from({ length: barCount }, () => 0));
  const [outputBars, setOutputBars] = useState(() => Array.from({ length: barCount }, () => 0));
  const [inputLevel, setInputLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);

  const rafRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return undefined;

    let mounted = true;
    const audioContext = new AudioContextClass();

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
        outputSource = audioContext.createMediaElementSource(outputAudioElement);
        outputSource.connect(outputAnalyser);
        outputAnalyser.connect(audioContext.destination);
      } catch {
        // Media element may already be connected in another context.
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

      setInputBars(normalizeBars(inputFrequency, barCount));
      setOutputBars(normalizeBars(outputFrequency, barCount));
      setInputLevel(toRms(inputTime));
      setOutputLevel(toRms(outputTime));

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (outputSource) {
        try { outputSource.disconnect(); } catch { /* no-op */ }
      }
      if (inputSource) {
        try { inputSource.disconnect(); } catch { /* no-op */ }
      }
      try {
        audioContext.close();
      } catch {
        // no-op
      }
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
