/**
 * cache.js — Tiered L1 (In-Memory Map) + L2 (AsyncStorage) cache with TTL expiration,
 * LRU pruning, and resilient stale-while-revalidate / offline browsing support.
 *
 * Usage:
 *   import { cache, CACHE_KEYS, CACHE_TTL } from '../utils/cache';
 *
 *   // Fetch with cache (returns cached data instantly, refreshes in background)
 *   const data = await cache.fetchWithCache(CACHE_KEYS.QUESTIONS, () => api.getQuestions(), CACHE_TTL.LONG);
 *
 *   // Manual operations
 *   await cache.set('key', data, 600);
 *   const data = await cache.get('key');
 *   const syncData = cache.getSync('key');
 *   await cache.remove('key');
 *   await cache.clear();
 *   await cache.pruneExpired();
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "@preploop_cache:";
const MAX_MEMORY_ENTRIES = 100;

// L1 In-Memory Cache (Map preserves insertion order for LRU eviction)
const memoryCache = new Map();

/**
 * Update memory entry position (LRU touch)
 */
function touchMemory(key, entry) {
    memoryCache.delete(key);
    memoryCache.set(key, entry);
    // Evict oldest if exceeding cap
    if (memoryCache.size > MAX_MEMORY_ENTRIES) {
        const oldestKey = memoryCache.keys().next().value;
        if (oldestKey !== undefined) {
            memoryCache.delete(oldestKey);
        }
    }
}

/**
 * Synchronous in-memory lookup. Returns null if expired or not in memory.
 * Useful for instantaneous UI renders during screen transitions.
 * @param {string} key
 * @returns {any|null}
 */
function getSync(key) {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
        memoryCache.delete(key);
        return null;
    }
    // Refresh LRU position
    touchMemory(key, entry);
    return entry.data;
}

/**
 * Get a cached value. Checks L1 memory first, then L2 AsyncStorage.
 * Returns null if expired or not found.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
async function get(key) {
    // 1. Check L1 memory cache
    const memEntry = memoryCache.get(key);
    if (memEntry) {
        if (memEntry.expiresAt && Date.now() > memEntry.expiresAt) {
            memoryCache.delete(key);
            AsyncStorage.removeItem(CACHE_PREFIX + key).catch(() => {});
            return null;
        }
        touchMemory(key, memEntry);
        return memEntry.data;
    }

    // 2. Check L2 AsyncStorage
    try {
        const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return null;
        const entry = JSON.parse(raw);
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            AsyncStorage.removeItem(CACHE_PREFIX + key).catch(() => {});
            return null;
        }
        // Promote to L1 memory cache
        touchMemory(key, entry);
        return entry.data;
    } catch {
        return null;
    }
}

/**
 * Get a cached value even if expired (for stale-while-revalidate and offline support).
 * Returns { data, isStale } or null if not found at all.
 * @param {string} key
 * @returns {Promise<{ data: any, isStale: boolean }|null>}
 */
async function getStale(key) {
    // Check L1 memory
    const memEntry = memoryCache.get(key);
    if (memEntry) {
        const isStale = memEntry.expiresAt ? Date.now() > memEntry.expiresAt : false;
        touchMemory(key, memEntry);
        return { data: memEntry.data, isStale };
    }

    // Check L2 AsyncStorage
    try {
        const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return null;
        const entry = JSON.parse(raw);
        const isStale = entry.expiresAt ? Date.now() > entry.expiresAt : false;
        touchMemory(key, entry);
        return { data: entry.data, isStale };
    } catch {
        return null;
    }
}

/**
 * Set a cached value with a TTL in seconds.
 * Stores in both L1 memory and L2 AsyncStorage.
 * @param {string} key
 * @param {any} data — must be JSON-serializable
 * @param {number} ttlSeconds — time-to-live in seconds (default 5 minutes)
 */
async function set(key, data, ttlSeconds = 300) {
    const entry = {
        data,
        cachedAt: Date.now(),
        expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    };

    // Store in L1 memory cache with LRU eviction
    touchMemory(key, entry);

    // Store in L2 AsyncStorage
    try {
        await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
        // Storage full or unavailable — silently fail
    }
}

/**
 * Remove a single cached entry from both L1 and L2.
 */
async function remove(key) {
    memoryCache.delete(key);
    try {
        await AsyncStorage.removeItem(CACHE_PREFIX + key);
    } catch {}
}

/**
 * Clear all PrepLoop cache entries (preserves auth/other keys).
 */
async function clear() {
    memoryCache.clear();
    try {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
        if (cacheKeys.length > 0) {
            await AsyncStorage.multiRemove(cacheKeys);
        }
    } catch {}
}

/**
 * Prune all expired entries from memory and AsyncStorage.
 * Sweeps stale items to reclaim storage.
 * @returns {Promise<{ memoryPruned: number, storagePruned: number }>}
 */
async function pruneExpired() {
    const now = Date.now();
    let memoryPruned = 0;
    let storagePruned = 0;

    // Prune L1
    for (const [key, entry] of memoryCache.entries()) {
        if (entry.expiresAt && now > entry.expiresAt) {
            memoryCache.delete(key);
            memoryPruned++;
        }
    }

    // Prune L2
    try {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
        if (cacheKeys.length > 0) {
            const pairs = await AsyncStorage.multiGet(cacheKeys);
            const expiredKeys = [];
            for (const [fullKey, raw] of pairs) {
                if (!raw) continue;
                try {
                    const entry = JSON.parse(raw);
                    if (entry.expiresAt && now > entry.expiresAt) {
                        expiredKeys.push(fullKey);
                    }
                } catch {
                    expiredKeys.push(fullKey);
                }
            }
            if (expiredKeys.length > 0) {
                await AsyncStorage.multiRemove(expiredKeys);
                storagePruned = expiredKeys.length;
            }
        }
    } catch {}

    return { memoryPruned, storagePruned };
}

/**
 * Stale-while-revalidate / Offline-first fetch wrapper.
 *
 * 1. Checks memory & storage cache.
 * 2. If fresh data exists and forceRefresh is false, returns cached data immediately.
 * 3. If stale data exists, returns cached data and revalidates in the background.
 * 4. If network fails or user is offline, falls back gracefully to stale cache before throwing.
 *
 * @param {string} key — cache key
 * @param {() => Promise<any>} fetchFn — async function to fetch fresh data
 * @param {number} ttlSeconds — TTL in seconds (default 5 min)
 * @param {(data: any) => void} [onFreshData] — optional callback when fresh data arrives
 * @param {object} [options] — optional configuration
 * @param {boolean} [options.forceRefresh=false] — bypass cache read and force network fetch
 * @param {boolean} [options.cacheFirst=false] — return cache without revalidating if available
 * @returns {Promise<any>} — cached or fresh data
 */
async function fetchWithCache(key, fetchFn, ttlSeconds = 300, onFreshData, options = {}) {
    const { forceRefresh = false, cacheFirst = false } = options;

    if (!forceRefresh) {
        const cached = await getStale(key);

        if (cached && !cached.isStale) {
            // Fresh cache — return immediately
            return cached.data;
        }

        if (cached && cached.isStale) {
            if (cacheFirst) {
                return cached.data;
            }
            // Stale cache — return stale data now, refresh in background
            fetchFn()
                .then((freshData) => {
                    set(key, freshData, ttlSeconds);
                    if (onFreshData) onFreshData(freshData);
                })
                .catch(() => {}); // Silently fail background refresh
            return cached.data;
        }
    }

    // No cache at all or forceRefresh — fetch synchronously
    try {
        const freshData = await fetchFn();
        await set(key, freshData, ttlSeconds);
        return freshData;
    } catch (err) {
        // Network or fetch failed — last resort fallback to expired cache (offline resilience)
        const lastResort = await getStale(key);
        if (lastResort) return lastResort.data;
        throw err;
    }
}

// Automatically prune expired keys in background on module initialization
if (typeof setTimeout === "function") {
    setTimeout(() => {
        pruneExpired().catch(() => {});
    }, 1000);
}

export const cache = {
    get,
    getStale,
    getSync,
    set,
    remove,
    invalidate: remove,
    clear,
    pruneExpired,
    fetchWithCache,
    getMemorySize: () => memoryCache.size,
};

// Pre-defined cache keys for consistency
export const CACHE_KEYS = {
    DSA_PATTERNS: "dsa_patterns",
    DASHBOARD_STATS: "dashboard_stats",
    COIN_BALANCE: "coin_balance",
    PROFILE: "user_profile",
    DAILY_CHALLENGE: "daily_challenge",
    ACTIVITY: "user_activity",
    RESUME_HISTORY: "resume_history",
    QUESTIONS: "questions_list",
    CURRICULUM: "curriculum_data",
    EXAMS: "exams_list",
    PROBLEM_DETAILS: "problem_details",
    INTERVIEW_HISTORY: "interview_history",
};

// Pre-defined TTLs (in seconds)
export const CACHE_TTL = {
    SHORT: 60, // 1 minute — for rapidly changing data
    MEDIUM: 300, // 5 minutes — default
    LONG: 900, // 15 minutes — for stable data
    VERY_LONG: 3600, // 1 hour — for rarely changing data (patterns, curriculum)
    OFFLINE_PERSISTENT: 604800, // 7 days — offline question and curriculum browsing
};
