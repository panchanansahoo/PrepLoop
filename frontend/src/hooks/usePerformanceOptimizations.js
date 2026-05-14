import React, { useCallback, useRef, useEffect, useMemo } from 'react';

/**
 * Debounce hook - delays function execution until user stops calling it
 * Useful for search, filter, and resize events
 */
export function useDebounce(callback, delay = 300) {
    const timeoutRef = useRef(null);
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const debouncedCallback = useCallback(
        (...args) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                callbackRef.current(...args);
            }, delay);
        },
        [delay]
    );

    const cancel = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }, []);

    return [debouncedCallback, cancel];
}

/**
 * Throttle hook - executes function at most once every specified interval
 * Useful for scroll and resize events
 */
export function useThrottle(callback, delay = 300) {
    const lastExecutedRef = useRef(Date.now());
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const throttledCallback = useCallback(
        (...args) => {
            const now = Date.now();
            if (now >= lastExecutedRef.current + delay) {
                callbackRef.current(...args);
                lastExecutedRef.current = now;
            }
        },
        [delay]
    );

    return throttledCallback;
}

/**
 * Intersection Observer hook - detect when elements enter/exit viewport
 * Useful for lazy loading and virtualization
 */
export function useIntersectionObserver(ref, options = {}) {
    const [isVisible, setIsVisible] = React.useState(false);
    const observerRef = useRef(null);

    useEffect(() => {
        observerRef.current = new IntersectionObserver(([entry]) => {
            setIsVisible(entry.isIntersecting);
        }, {
            threshold: 0.1,
            ...options,
        });

        if (ref.current) {
            observerRef.current.observe(ref.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [ref, options]);

    return isVisible;
}

/**
 * Virtual list hook - only render visible items for large lists
 * Returns: { visibleItems, containerRef, scrollToIndex }
 */
export function useVirtualList(items, itemHeight, containerHeight, overscan = 3) {
    const containerRef = useRef(null);
    const [scrollOffset, setScrollOffset] = React.useState(0);

    const visibleRange = useMemo(() => {
        const startIndex = Math.max(0, Math.floor(scrollOffset / itemHeight) - overscan);
        const endIndex = Math.min(
            items.length,
            Math.ceil((scrollOffset + containerHeight) / itemHeight) + overscan
        );
        return { startIndex, endIndex };
    }, [scrollOffset, itemHeight, containerHeight, items.length, overscan]);

    const visibleItems = useMemo(
        () => items.slice(visibleRange.startIndex, visibleRange.endIndex),
        [items, visibleRange]
    );

    const handleScroll = useCallback((e) => {
        setScrollOffset(e.currentTarget.scrollTop);
    }, []);

    const scrollToIndex = useCallback((index) => {
        if (containerRef.current) {
            containerRef.current.scrollTop = index * itemHeight;
        }
    }, [itemHeight]);

    const totalHeight = items.length * itemHeight;
    const offsetY = visibleRange.startIndex * itemHeight;

    return {
        visibleItems,
        containerRef,
        handleScroll,
        scrollToIndex,
        totalHeight,
        offsetY,
        startIndex: visibleRange.startIndex,
    };
}

/**
 * Request idle callback hook - defer non-urgent work until browser is idle
 * Useful for expensive computations that don't need to be immediate
 */
export function useIdleCallback(callback, deps = []) {
    useEffect(() => {
        if ('requestIdleCallback' in window) {
            const id = requestIdleCallback(() => {
                callback();
            });
            return () => cancelIdleCallback(id);
        }
        // Fallback for browsers without requestIdleCallback
        return undefined;
    }, deps);
}

/**
 * Performance monitoring hook - tracks render times and component performance
 */
export function useRenderMetrics(componentName) {
    const renderCountRef = useRef(0);
    const renderTimesRef = useRef([]);

    useEffect(() => {
        renderCountRef.current += 1;

        // Development-only performance monitoring
        if (window?.location?.hostname === 'localhost' || window?.location?.hostname === '127.0.0.1') {
            const now = performance.now();
            renderTimesRef.current.push(now);

            if (renderTimesRef.current.length > 100) {
                renderTimesRef.current.shift();
            }

            const recentRenders = renderTimesRef.current.slice(-10);
            const avgTime = recentRenders.length > 1
                ? recentRenders[recentRenders.length - 1] - recentRenders[0]
                : 0;

            if (renderCountRef.current % 10 === 0) {
                // eslint-disable-next-line no-console
                console.log(
                    `[${componentName}] Renders: ${renderCountRef.current}, Avg 10-render time: ${avgTime.toFixed(2)}ms`
                );
            }
        }
    });

    return renderCountRef.current;
}
