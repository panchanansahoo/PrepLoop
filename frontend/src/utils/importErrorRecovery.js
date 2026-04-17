import { createLogger } from './logger';

const logger = createLogger('import-error-recovery');

export const DYNAMIC_IMPORT_RECOVERY_KEY = 'preploop:dynamic-import-reload';

const DYNAMIC_IMPORT_ERROR_PATTERNS = [
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'ChunkLoadError',
  'Loading chunk',
];

const toErrorMessage = (value) => {
  if (!value) return '';

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value?.message === 'string') {
    return value.message;
  }

  return String(value);
};

export const isDynamicImportFetchError = (value) => {
  const message = toErrorMessage(value);
  return DYNAMIC_IMPORT_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
};

const safeStorageGet = (storage, key) => {
  try {
    return storage?.getItem?.(key) ?? null;
  } catch {
    return null;
  }
};

const safeStorageSet = (storage, key, value) => {
  try {
    storage?.setItem?.(key, value);
  } catch {
    // Ignore storage failures (e.g. private mode restrictions)
  }
};

export const recoverFromDynamicImportError = ({
  error,
  storage = typeof window !== 'undefined' ? window.sessionStorage : undefined,
  reload = () => window.location.reload(),
} = {}) => {
  if (!isDynamicImportFetchError(error)) {
    return false;
  }

  if (safeStorageGet(storage, DYNAMIC_IMPORT_RECOVERY_KEY) === '1') {
    logger.warn('Dynamic import failed after one recovery attempt; skipping auto-reload', {
      error: toErrorMessage(error),
    });
    return false;
  }

  safeStorageSet(storage, DYNAMIC_IMPORT_RECOVERY_KEY, '1');
  logger.warn('Dynamic import chunk missing, triggering one-time reload', {
    error: toErrorMessage(error),
  });
  reload();
  return true;
};

export const registerDynamicImportErrorRecovery = ({
  storage,
  reload,
} = {}) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleCandidate = (candidate) => {
    recoverFromDynamicImportError({
      error: candidate,
      storage,
      reload,
    });
  };

  const onError = (event) => {
    handleCandidate(event?.error ?? event?.message);
  };

  const onUnhandledRejection = (event) => {
    handleCandidate(event?.reason);
  };

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);

  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
  };
};
