import { useRef, useCallback } from 'react';

/**
 * useSwipe — custom hook for touch swipe detection
 * 
 * Usage:
 *   const { handlers } = useSwipe({
 *     onSwipeLeft: () => goNext(),
 *     onSwipeRight: () => goPrev(),
 *     onSwipeUp: () => skipQuestion(),
 *     threshold: 50,
 *   });
 *   <div {...handlers}>...</div>
 */
export default function useSwipe({ onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50, disabled = false } = {}) {
    const touchStart = useRef({ x: 0, y: 0 });
    const touchEnd = useRef({ x: 0, y: 0 });

    const onTouchStart = useCallback((e) => {
        touchStart.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
        touchEnd.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
    }, []);

    const onTouchMove = useCallback((e) => {
        touchEnd.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
    }, []);

    const onTouchEnd = useCallback(() => {
        if (disabled) return;
        
        const dx = touchStart.current.x - touchEnd.current.x;
        const dy = touchStart.current.y - touchEnd.current.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (absDx > absDy && absDx > threshold) {
            if (dx > 0) onSwipeLeft?.();
            else onSwipeRight?.();
        } else if (absDy > absDx && absDy > threshold) {
            if (dy > 0) onSwipeUp?.();
            else onSwipeDown?.();
        }
    }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, disabled]);

    return {
        handlers: { onTouchStart, onTouchMove, onTouchEnd },
    };
}
