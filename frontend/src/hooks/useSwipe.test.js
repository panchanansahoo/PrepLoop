import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import useSwipe from './useSwipe';
import { getMockSwipeProps, createMockTouchEvent } from '../factories/componentMocks';

describe('useSwipe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Swipe detection', () => {
    it('should detect swipe left', () => {
      const props = getMockSwipeProps();
      const { result } = renderHook(() => useSwipe(props));

      result.current.handlers.onTouchStart(createMockTouchEvent(100, 100));
      result.current.handlers.onTouchMove(createMockTouchEvent(40, 100)); // Swiped left by 60px (>50 threshold)
      result.current.handlers.onTouchEnd();

      expect(props.onSwipeLeft).toHaveBeenCalledTimes(1);
      expect(props.onSwipeRight).not.toHaveBeenCalled();
    });

    it('should detect swipe right', () => {
      const props = getMockSwipeProps();
      const { result } = renderHook(() => useSwipe(props));

      result.current.handlers.onTouchStart(createMockTouchEvent(100, 100));
      result.current.handlers.onTouchMove(createMockTouchEvent(160, 100)); // Swiped right by 60px (>50 threshold)
      result.current.handlers.onTouchEnd();

      expect(props.onSwipeRight).toHaveBeenCalledTimes(1);
      expect(props.onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  // TDD: New failing test for the 'disabled' feature
  describe('Disabled state', () => {
    it('should not trigger swipe callbacks when disabled is true', () => {
      // RED: We will test that when disabled is true, no callbacks are fired.
      const props = getMockSwipeProps({ disabled: true });
      const { result } = renderHook(() => useSwipe(props));

      // Attempt swipe left
      result.current.handlers.onTouchStart(createMockTouchEvent(100, 100));
      result.current.handlers.onTouchMove(createMockTouchEvent(40, 100));
      result.current.handlers.onTouchEnd();

      // Expect no calls because it's disabled
      expect(props.onSwipeLeft).not.toHaveBeenCalled();
    });
  });
});
