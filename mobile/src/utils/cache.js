/**
 * cache.js — AsyncStorage-based TTL cache with stale-while-revalidate.
 *
 * Usage:
 *   import { cache } from '../utils/cache';
 *
 *   // Fetch with cache (returns cached data instantly, refreshes in background)
 *   const data = await cache.fetchWithCache('dsa_patterns', () => dsaApi.getPatterns(), 300);
 *
 *   // Manual operations
 *   await cache.set('key', data, 600);
 *   const data = await cache.get('key');
 *   await cache.remove('key');
 *   await cache.clear();
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "@preploop_cache:";

/**
 * Get a cached value. Returns null if expired or not found.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
async function get(key) {
    try {
        const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return null;
        const entry = JSON.parse(raw);
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            // Expired — remove silently
            AsyncStorage.removeItem(CACHE_PREFIX + key).catch(() => {});
            return null;
        }
        return entry.data;
    } catch {
        return null;
    }
}

/**
 * Get a cached value even if expired (for stale-while-revalidate).
 * Returns { data, isStale } or null if not found at all.
 */
async function getStale(key) {
    try {
        const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return null;
        const entry = JSON.parse(raw);
        const isStale = entry.expiresAt ? Date.now() > entry.expiresAt : false;
        return { data: entry.data, isStale };
    } catch {
        return null;
    }
}

/**
 * Set a cached value with a TTL in seconds.
 * @param {string} key
 * @param {any} data — must be JSON-serializable
 * @param {number} ttlSeconds — time-to-live in seconds (default 5 minutes)
 */
async function set(key, data, ttlSeconds = 300) {
    try {
        const entry = {
            data,
            cachedAt: Date.now(),
            expiresAt: Date.now() + ttlSeconds * 1000,
        };
        await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
        // Storage full or unavailable — silently fail
    }
}

/**
 * Remove a single cached entry.
 */
async function remove(key) {
    try {
        await AsyncStorage.removeItem(CACHE_PREFIX + key);
    } catch {}
}

/**
 * Clear all PrepLoop cache entries (preserves auth/other keys).
 */
async function clear() {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
        if (cacheKeys.length > 0) {
            await AsyncStorage.multiRemove(cacheKeys);
        }
    } catch {}
}

/**
 * Stale-while-revalidate fetch wrapper.
 *
 * 1. Returns cached data immediately if available (even if stale).
 * 2. Fetches fresh data in background (or foreground if no cache).
 * 3. Updates the cache with fresh data.
 *
 * @param {string} key — cache key
 * @param {() => Promise<any>} fetchFn — async function to fetch fresh data
 * @param {number} ttlSeconds — TTL in seconds (default 5 min)
 * @param {(data: any) => void} [onFreshData] — optional callback when fresh data arrives
 * @returns {Promise<any>} — cached or fresh data
 */
async function fetchWithCache(key, fetchFn, ttlSeconds = 300, onFreshData) {
    const cached = await getStale(key);

    if (cached && !cached.isStale) {
        // Fresh cache — return immediately
        return cached.data;
    }

    if (cached && cached.isStale) {
        // Stale cache — return stale data now, refresh in background
        fetchFn()
            .then((freshData) => {
                set(key, freshData, ttlSeconds);
                if (onFreshData) onFreshData(freshData);
            })
            .catch(() => {}); // Silently fail background refresh
        return cached.data;
    }

    // No cache at all — fetch synchronously
    try {
        const freshData = await fetchFn();
        await set(key, freshData, ttlSeconds);
        return freshData;
    } catch (err) {
        // Last resort — try to return expired cache
        const lastResort = await getStale(key);
        if (lastResort) return lastResort.data;
        throw err;
    }
}

export const cache = {
    get,
    getStale,
    set,
    remove,
    invalidate: remove,
    clear,
    fetchWithCache,
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
};

// Pre-defined TTLs (in seconds)
export const CACHE_TTL = {
    SHORT: 60, // 1 minute — for rapidly changing data
    MEDIUM: 300, // 5 minutes — default
    LONG: 900, // 15 minutes — for stable data
    VERY_LONG: 3600, // 1 hour — for rarely changing data (patterns, etc.)
};
