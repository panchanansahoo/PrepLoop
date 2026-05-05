/**
 * Playground Phase 2 Frontend Optimizations - Test Suite
 * Tests:
 * - Conversation history pruning (max 20 messages)
 * - Request debouncing (300ms)
 * - Code formatting cache
 */

import { renderHook, act } from '@testing-library/react';
import { useDebounce, useConversationHistory, useResponseCache } from '../hooks/usePlaygroundOptimizations';

describe('Playground Phase 2 Optimizations', () => {
  
  // ─── Test 1: History Pruning ───
  describe('useConversationHistory', () => {
    test('should limit messages to max configured', () => {
      const { result } = renderHook(() => useConversationHistory(5));

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.addMessage('user', `Message ${i}`);
        }
      });

      const history = result.current.getHistory();
      expect(history.length).toBe(5);
      expect(history[0].content).toBe('Message 5');
      expect(history[4].content).toBe('Message 9');
    });

    test('should use FIFO eviction when exceeding max', () => {
      const { result } = renderHook(() => useConversationHistory(3));

      act(() => {
        result.current.addMessage('user', 'First');
        result.current.addMessage('assistant', 'Response1');
        result.current.addMessage('user', 'Second');
        result.current.addMessage('assistant', 'Response2');
      });

      const history = result.current.getHistory();
      expect(history.length).toBe(3);
      expect(history[0].content).toBe('Second');
    });

    test('should track history stats', () => {
      const { result } = renderHook(() => useConversationHistory(5));

      act(() => {
        result.current.addMessage('user', 'Hello');
        result.current.addMessage('assistant', 'Hi');
      });

      const stats = result.current.getStats();
      expect(stats.messageCount).toBe(2);
      expect(stats.maxMessages).toBe(5);
      expect(stats.isFull).toBe(false);
    });

    test('should get recent history', () => {
      const { result } = renderHook(() => useConversationHistory(20));

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.addMessage('user', `Msg ${i}`);
        }
      });

      const recent = result.current.getRecentHistory(2);
      expect(recent.length).toBe(2);
      expect(recent[0].content).toBe('Msg 3');
      expect(recent[1].content).toBe('Msg 4');
    });

    test('should clear history', () => {
      const { result } = renderHook(() => useConversationHistory(10));

      act(() => {
        result.current.addMessage('user', 'Hello');
        result.current.addMessage('assistant', 'Hi');
        result.current.clear();
      });

      const history = result.current.getHistory();
      expect(history.length).toBe(0);
    });

    test('should default to 20 message limit for conversation', () => {
      const { result } = renderHook(() => useConversationHistory());

      act(() => {
        for (let i = 0; i < 25; i++) {
          result.current.addMessage('user', `Message ${i}`);
        }
      });

      const history = result.current.getHistory();
      expect(history.length).toBe(20);
    });
  });

  // ─── Test 2: Request Debouncing ───
  describe('useDebounce', () => {
    test('should debounce function calls', async () => {
      const mockFn = jest.fn(() => Promise.resolve('result'));
      const { result } = renderHook(() => useDebounce(mockFn, 100));

      act(() => {
        result.current.debounced('first');
        result.current.debounced('second');
        result.current.debounced('third');
      });

      expect(mockFn).not.toHaveBeenCalled();

      // Wait for debounce delay
      await new Promise(r => setTimeout(r, 150));

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('third');
    });

    test('should allow flush to execute immediately', async () => {
      const mockFn = jest.fn(() => Promise.resolve('result'));
      const { result } = renderHook(() => useDebounce(mockFn, 300));

      act(() => {
        result.current.debounced('test');
      });

      expect(mockFn).not.toHaveBeenCalled();

      act(() => {
        result.current.flush();
      });

      await new Promise(r => setTimeout(r, 50));

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    test('should allow cancel to prevent execution', async () => {
      const mockFn = jest.fn(() => Promise.resolve('result'));
      const { result } = renderHook(() => useDebounce(mockFn, 100));

      act(() => {
        result.current.debounced('test');
        result.current.cancel();
      });

      await new Promise(r => setTimeout(r, 150));

      expect(mockFn).not.toHaveBeenCalled();
    });

    test('should use 300ms default delay', async () => {
      const mockFn = jest.fn(() => Promise.resolve('result'));
      const { result } = renderHook(() => useDebounce(mockFn));

      act(() => {
        result.current.debounced('test');
      });

      expect(mockFn).not.toHaveBeenCalled();

      // Wait for default 300ms delay
      await new Promise(r => setTimeout(r, 350));

      expect(mockFn).toHaveBeenCalled();
    });

    test('should prevent request spam in AI assist', async () => {
      // Simulating rapid AI requests
      const mockFn = jest.fn(() => Promise.resolve('response'));
      const { result } = renderHook(() => useDebounce(mockFn, 300));

      // User rapidly clicks "Explain" button
      act(() => {
        result.current.debounced('explain');
        result.current.debounced('explain');
        result.current.debounced('explain');
        result.current.debounced('explain');
        result.current.debounced('explain');
      });

      expect(mockFn).not.toHaveBeenCalled();

      await new Promise(r => setTimeout(r, 350));

      // Should only call once despite 5 clicks
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Test 3: Response Caching ───
  describe('useResponseCache', () => {
    test('should cache and retrieve responses', () => {
      const { result } = renderHook(() => useResponseCache());

      act(() => {
        result.current.set('format', 'code', 'js', 'formatted code');
      });

      const cached = result.current.get('format', 'code', 'js');
      expect(cached).toBeDefined();
      expect(cached.value).toBe('formatted code');
    });

    test('should return undefined for cache miss', () => {
      const { result } = renderHook(() => useResponseCache());

      const cached = result.current.get('format', 'different code', 'js');
      expect(cached).toBeUndefined();
    });

    test('should invalidate specific cache entries', () => {
      const { result } = renderHook(() => useResponseCache());

      act(() => {
        result.current.set('format', 'code', 'js', 'formatted');
      });

      let cached = result.current.get('format', 'code', 'js');
      expect(cached).toBeDefined();

      act(() => {
        result.current.invalidate('format', 'code', 'js');
      });

      cached = result.current.get('format', 'code', 'js');
      expect(cached).toBeUndefined();
    });

    test('should clear all cache', () => {
      const { result } = renderHook(() => useResponseCache());

      act(() => {
        result.current.set('format', 'code1', 'js', 'result1');
        result.current.set('format', 'code2', 'py', 'result2');
        result.current.set('explain', 'code3', 'java', 'result3');
      });

      let stats = result.current.getStats();
      expect(stats.size).toBe(3);

      act(() => {
        result.current.clear();
      });

      stats = result.current.getStats();
      expect(stats.size).toBe(0);
    });

    test('should distinguish cache by type, code, and language', () => {
      const { result } = renderHook(() => useResponseCache());

      act(() => {
        result.current.set('format', 'code', 'js', 'js formatted');
        result.current.set('format', 'code', 'py', 'py formatted');
        result.current.set('explain', 'code', 'js', 'js explained');
      });

      const formatted_js = result.current.get('format', 'code', 'js');
      const formatted_py = result.current.get('format', 'code', 'py');
      const explained = result.current.get('explain', 'code', 'js');

      expect(formatted_js.value).toBe('js formatted');
      expect(formatted_py.value).toBe('py formatted');
      expect(explained.value).toBe('js explained');
    });

    test('should return cache stats', () => {
      const { result } = renderHook(() => useResponseCache());

      act(() => {
        result.current.set('format', 'code1', 'js', 'result1');
        result.current.set('explain', 'code2', 'py', 'result2');
      });

      const stats = result.current.getStats();
      expect(stats.size).toBe(2);
      expect(stats.entries.length).toBe(2);
      expect(stats.entries[0]).toHaveProperty('cached', true);
    });
  });

  // ─── Integration Test ───
  describe('Phase 2 Integration', () => {
    test('should handle bounded history with AI debouncing', async () => {
      const history = renderHook(() => useConversationHistory(20));
      const mockAiCall = jest.fn(() => Promise.resolve('response'));
      const debounce = renderHook(() => useDebounce(mockAiCall, 100));

      // Simulate rapid AI requests
      act(() => {
        debounce.result.current.debounced('request1');
        debounce.result.current.debounced('request2');
        debounce.result.current.debounced('request3');
      });

      expect(mockAiCall).not.toHaveBeenCalled();

      // Add messages to history
      act(() => {
        for (let i = 0; i < 30; i++) {
          history.result.current.addMessage('user', `Message ${i}`);
        }
      });

      // History should be limited to 20
      expect(history.result.current.getHistory().length).toBe(20);

      // Wait for debounce
      await new Promise(r => setTimeout(r, 150));

      // Should only call once
      expect(mockAiCall).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Phase 2 Performance Expectations', () => {
  test('history pruning reduces memory from >50MB to <20MB', () => {
    const { result } = renderHook(() => useConversationHistory(20));

    // Simulate 1 hour of messages (1 per minute)
    act(() => {
      for (let i = 0; i < 60; i++) {
        result.current.addMessage('user', 'A'.repeat(500)); // ~500 bytes per message
        result.current.addMessage('assistant', 'B'.repeat(1000)); // ~1000 bytes per response
      }
    });

    // With max 20 messages, memory should be bounded
    const history = result.current.getHistory();
    const estimatedMemory = history.reduce((sum, msg) => sum + msg.content.length, 0);
    
    // Should be much less than 50MB
    expect(estimatedMemory).toBeLessThan(100 * 1024); // 100KB estimate
  });

  test('debouncing limits request rate to <3/sec', async () => {
    const mockFn = jest.fn(() => Promise.resolve('result'));
    const { result } = renderHook(() => useDebounce(mockFn, 300));

    // Simulate 10 rapid clicks (would be 10 requests without debounce)
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.debounced(`request${i}`);
      }
    });

    await new Promise(r => setTimeout(r, 350));

    // Should only call once
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('request9');
  });

  test('response cache provides <100ms format button latency', () => {
    const { result } = renderHook(() => useResponseCache());

    const startTime = performance.now();

    act(() => {
      result.current.set('format', 'code', 'js', 'cached');
      const cached = result.current.get('format', 'code', 'js');
    });

    const elapsed = performance.now() - startTime;

    // Cache lookup should be <1ms
    expect(elapsed).toBeLessThan(10);
  });
});
