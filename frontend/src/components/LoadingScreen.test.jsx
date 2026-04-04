import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LoadingScreen from './LoadingScreen';

function buildMockContext() {
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillText: vi.fn(),
  };
}

describe('LoadingScreen', () => {
  let getContextSpy;

  beforeEach(() => {
    vi.useFakeTimers();
    getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(buildMockContext());
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('calls onFinished even when requestAnimationFrame callback is throttled', () => {
    const onFinished = vi.fn();

    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation(() => 1);

    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    render(<LoadingScreen onFinished={onFinished} minimumDuration={100} />);

    act(() => {
      // 400ms entering delay + (minimumDuration + 1200) fallback + 700ms exit
      vi.advanceTimersByTime(2600);
    });

    expect(getContextSpy).toHaveBeenCalled();
    expect(rafSpy).toHaveBeenCalled();
    expect(onFinished).toHaveBeenCalledTimes(1);
  });
});
