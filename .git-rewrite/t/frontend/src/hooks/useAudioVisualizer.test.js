import { describe, it, expect } from 'vitest';
import { normalizeBars } from './useAudioVisualizer';

describe('normalizeBars', () => {
  it('returns zeros for null/undefined input', () => {
    expect(normalizeBars(null, 8)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(normalizeBars(undefined, 4)).toEqual([0, 0, 0, 0]);
  });

  it('returns zeros for empty array', () => {
    const bars = normalizeBars(new Uint8Array([]), 8);
    expect(bars).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('normalizes frequency bins into fixed bars', () => {
    const bars = normalizeBars(new Uint8Array([0, 64, 128, 255]), 4);
    expect(bars).toHaveLength(4);
    expect(Math.max(...bars)).toBeLessThanOrEqual(1);
    expect(Math.min(...bars)).toBeGreaterThanOrEqual(0);
  });

  it('maps known values to expected ranges', () => {
    // 4 data points → 2 bars (2 per bar)
    const data = new Uint8Array([255, 255, 0, 0]);
    const result = normalizeBars(data, 2);
    expect(result).toHaveLength(2);
    expect(result[0]).toBeCloseTo(1.0, 1); // avg 255/255
    expect(result[1]).toBeCloseTo(0.0, 1); // avg 0/255
  });

  it('handles barCount larger than data length', () => {
    const data = new Uint8Array([128, 64]);
    const result = normalizeBars(data, 8);
    expect(result).toHaveLength(8);
    expect(result[0]).toBeGreaterThan(0);
  });

  it('never returns values outside [0, 1]', () => {
    const data = new Uint8Array(64).fill(200);
    const result = normalizeBars(data, 8);
    result.forEach((bar) => {
      expect(bar).toBeGreaterThanOrEqual(0);
      expect(bar).toBeLessThanOrEqual(1);
    });
  });
});

