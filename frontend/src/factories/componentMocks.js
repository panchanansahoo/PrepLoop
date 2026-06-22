/**
 * Factory for creating mock component props
 */
export const getMockSwipeProps = (overrides = {}) => {
  return {
    onSwipeLeft: vi.fn(),
    onSwipeRight: vi.fn(),
    onSwipeUp: vi.fn(),
    onSwipeDown: vi.fn(),
    threshold: 50,
    disabled: false,
    ...overrides,
  };
};

/**
 * Factory for creating mock touch events
 */
export const createMockTouchEvent = (clientX, clientY) => ({
  targetTouches: [{ clientX, clientY }],
});
