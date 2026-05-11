import { useRef, useCallback } from 'react';

/**
 * useDebounce - Debounce async function calls
 * @param {Function} callback - Async function to debounce
 * @param {number} delay - Debounce delay in ms (default: 300ms)
 * @returns {Function} Debounced version of callback
 */
export function useDebounce(callback, delay = 300) {
  const timeoutRef = useRef(null);
  const pendingRef = useRef(null);
  const argsRef = useRef(null);

  const debounced = useCallback((...args) => {
    argsRef.current = args;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (argsRef.current) {
        pendingRef.current = callback(...argsRef.current);
        argsRef.current = null;
      }
      timeoutRef.current = null;
    }, delay);

    return pendingRef.current;
  }, [callback, delay]);

  const flush = useCallback(() => {
    if (timeoutRef.current && argsRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      pendingRef.current = callback(...argsRef.current);
      argsRef.current = null;
    }
    return pendingRef.current;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    argsRef.current = null;
    pendingRef.current = null;
  }, []);

  return { debounced, flush, cancel };
}

/**
 * useConversationHistory - Manage bounded conversation history
 * @param {number} maxMessages - Maximum messages to keep (default: 20)
 * @returns {Object} History management functions
 */
export function useConversationHistory(maxMessages = 20) {
  const historyRef = useRef([]);

  const addMessage = useCallback((role, content) => {
    const message = {
      role,
      content,
      timestamp: new Date().toLocaleTimeString(),
    };

    historyRef.current.push(message);

    // Enforce max message limit (FIFO eviction)
    if (historyRef.current.length > maxMessages) {
      historyRef.current = historyRef.current.slice(-maxMessages);
    }

    return message;
  }, [maxMessages]);

  const getHistory = useCallback(() => {
    return [...historyRef.current];
  }, []);

  const getRecentHistory = useCallback((count) => {
    return historyRef.current.slice(-count);
  }, []);

  const clear = useCallback(() => {
    historyRef.current = [];
  }, []);

  const getStats = useCallback(() => ({
    messageCount: historyRef.current.length,
    maxMessages,
    isFull: historyRef.current.length >= maxMessages,
  }), [maxMessages]);

  return {
    addMessage,
    getHistory,
    getRecentHistory,
    clear,
    getStats,
  };
}

/**
 * useResponseCache - Cache code formatting and AI responses
 * @returns {Object} Cache operations
 */
export function useResponseCache() {
  const cacheRef = useRef(new Map());

  const generateKey = useCallback((type, code, language) => {
    // Simple hash based on type, language, and code length
    // More sophisticated hash could be used, but this is fast
    const content = `${type}|${language}|${code.length}|${code.slice(0, 50)}`;
    return content;
  }, []);

  const get = useCallback((type, code, language) => {
    const key = generateKey(type, code, language);
    return cacheRef.current.get(key);
  }, [generateKey]);

  const set = useCallback((type, code, language, value) => {
    const key = generateKey(type, code, language);
    cacheRef.current.set(key, {
      value,
      timestamp: Date.now(),
    });
  }, [generateKey]);

  const invalidate = useCallback((type, code, language) => {
    const key = generateKey(type, code, language);
    cacheRef.current.delete(key);
  }, [generateKey]);

  const clear = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const getStats = useCallback(() => ({
    size: cacheRef.current.size,
    entries: Array.from(cacheRef.current.entries()).map(([key, val]) => ({
      key,
      cached: true,
      timestamp: val.timestamp,
    })),
  }), []);

  return {
    get,
    set,
    invalidate,
    clear,
    getStats,
  };
}

export default { useDebounce, useConversationHistory, useResponseCache };
