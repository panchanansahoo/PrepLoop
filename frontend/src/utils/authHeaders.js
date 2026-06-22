const TOKEN_STORAGE_KEYS = ['token', 'access_token', 'auth_token'];

function safeStorageGet(storage, key) {
  try {
    return storage?.getItem?.(key) || null;
  } catch {
    return null;
  }
}

function readTokenFromStorage() {
  for (const key of TOKEN_STORAGE_KEYS) {
    const fromLocal = safeStorageGet(globalThis.localStorage, key);
    if (fromLocal) return fromLocal;

    const fromSession = safeStorageGet(globalThis.sessionStorage, key);
    if (fromSession) return fromSession;
  }

  return null;
}

function normalizeHeaders(headersInput = {}) {
  if (headersInput instanceof Headers) {
    const entries = {};
    for (const [key, value] of headersInput.entries()) {
      entries[key] = value;
    }
    return entries;
  }

  return { ...(headersInput || {}) };
}

export function resolveAuthToken(user) {
  return user?.access_token || user?.token || readTokenFromStorage();
}

export function mergeAuthHeaders(headersInput = {}, user) {
  const headers = normalizeHeaders(headersInput);
  const hasAuthorization = Boolean(headers.Authorization || headers.authorization);
  const token = resolveAuthToken(user);

  if (!hasAuthorization && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export function buildAuthHeaders(user) {
  return mergeAuthHeaders({ 'Content-Type': 'application/json' }, user);
}
