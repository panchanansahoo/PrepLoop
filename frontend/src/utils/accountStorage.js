const ACCOUNT_KEY_PREFIX = 'preploop:';
const ACCOUNT_SCOPED_BASES = [
  'interview-history',
  'notes',
  'dsa-code-',
  'sql-code-',
  'playground-code-',
  'pg-exec-history',
  'dsa-solution-unlocked-',
  'sql-solution-unlocked-',
  'dsa-editor-lang',
  'playground-lang',
  'interview-session:',
  'last-interview-analysis',
  'last-company',
  'last-role',
];

const LEGACY_EXACT_KEYS = [
  'preploop_local_interview_history',
  'preploop_bookmarks',
  'preploop-ai-interview-session-v1',
  'preploop-ai-interview-session-v1:key',
  'preploop_last_interview_analysis',
  'preploop_last_company',
  'preploop_last_role',
  'preploop_active_transcript',
  'preploop_active_interview_session',
  'pg-exec-history',
  'dsa-editor-lang',
  'playground-lang',
];

const LEGACY_PREFIXES = [
  'dsa-code-',
  'sql-code-',
  'playground-code-',
  'dsa-solution-unlocked-',
  'sql-solution-unlocked-',
  'preploop_active_interview_session_',
  'dashboard:',
];

export function getAccountStorageKey(base, userId) {
  return userId ? `${ACCOUNT_KEY_PREFIX}${encodeURIComponent(userId)}:${base}` : null;
}

export function getDraftStorage(userId) {
  return userId ? localStorage : sessionStorage;
}

export function readDraft(key, userId) {
  if (!key) return null;
  try { return getDraftStorage(userId).getItem(key); } catch { return null; }
}

export function writeDraft(key, userId, value) {
  if (!key) return;
  try { getDraftStorage(userId).setItem(key, value); } catch { /* Storage can be disabled. */ }
}

export function removeDraft(key, userId) {
  if (!key) return;
  try { getDraftStorage(userId).removeItem(key); } catch { /* Storage can be disabled. */ }
}

export function readInterviewHistory(userId) {
  const key = getAccountStorageKey('interview-history', userId);
  if (!key) return [];
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function updateInterviewHistory(userId, update) {
  const key = getAccountStorageKey('interview-history', userId);
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(update(readInterviewHistory(userId)).slice(0, 50)));
  } catch { /* Storage can be disabled. */ }
}

function isAccountScopedCacheKey(key, userId) {
  if (!key.startsWith(ACCOUNT_KEY_PREFIX)) return false;
  if (userId && key.startsWith(`${ACCOUNT_KEY_PREFIX}${encodeURIComponent(userId)}:`)) {
    return true;
  }
  const rest = key.slice(ACCOUNT_KEY_PREFIX.length);
  const sepIdx = rest.indexOf(':');
  if (sepIdx <= 0) return false;
  const suffix = rest.slice(sepIdx + 1);
  return ACCOUNT_SCOPED_BASES.some(base => suffix === base || suffix.startsWith(base));
}

function isLegacyCacheKey(key) {
  return LEGACY_EXACT_KEYS.includes(key) || LEGACY_PREFIXES.some(prefix => key.startsWith(prefix));
}

function clearMatchingKeysFromStorage(storage, userId) {
  if (!storage || typeof storage.length !== 'number' || typeof storage.key !== 'function') return;
  try {
    const keys = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k) keys.push(k);
    }
    for (const k of keys) {
      if (isAccountScopedCacheKey(k, userId) || isLegacyCacheKey(k)) {
        storage.removeItem(k);
      }
    }
  } catch { /* Storage can be disabled. */ }
}

export function clearAccountStorage(userId = null) {
  if (typeof localStorage !== 'undefined') {
    clearMatchingKeysFromStorage(localStorage, userId);
  }
  if (typeof sessionStorage !== 'undefined') {
    clearMatchingKeysFromStorage(sessionStorage, userId);
  }
}
