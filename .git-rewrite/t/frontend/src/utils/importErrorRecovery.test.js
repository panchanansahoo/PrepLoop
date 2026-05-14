import { describe, it, expect, vi } from 'vitest';
import {
  isDynamicImportFetchError,
  recoverFromDynamicImportError,
  registerDynamicImportErrorRecovery,
  DYNAMIC_IMPORT_RECOVERY_KEY,
} from './importErrorRecovery';

describe('importErrorRecovery', () => {
  it('detects known dynamic import failure messages', () => {
    expect(isDynamicImportFetchError(new Error('Failed to fetch dynamically imported module: /assets/Home.js'))).toBe(true);
    expect(isDynamicImportFetchError(new Error('ChunkLoadError: Loading chunk 8 failed.'))).toBe(true);
    expect(isDynamicImportFetchError('Importing a module script failed.')).toBe(true);
    expect(isDynamicImportFetchError(new Error('Network error'))).toBe(false);
  });

  it('reloads only once per session for dynamic import failures', () => {
    const store = new Map();
    const storage = {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => {
        store.set(key, String(value));
      },
    };
    const reload = vi.fn();

    const first = recoverFromDynamicImportError({
      error: new Error('Failed to fetch dynamically imported module'),
      storage,
      reload,
    });

    const second = recoverFromDynamicImportError({
      error: new Error('Failed to fetch dynamically imported module'),
      storage,
      reload,
    });

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(storage.getItem(DYNAMIC_IMPORT_RECOVERY_KEY)).toBe('1');
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('registers handlers that recover on unhandled rejection import errors', () => {
    const store = new Map();
    const storage = {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => {
        store.set(key, String(value));
      },
    };
    const reload = vi.fn();

    const cleanup = registerDynamicImportErrorRecovery({ storage, reload });

    const rejectionEvent = new Event('unhandledrejection');
    Object.defineProperty(rejectionEvent, 'reason', {
      value: new Error('Failed to fetch dynamically imported module: /assets/Home.js'),
      configurable: true,
    });

    window.dispatchEvent(rejectionEvent);

    expect(reload).toHaveBeenCalledTimes(1);

    cleanup();
  });
});
