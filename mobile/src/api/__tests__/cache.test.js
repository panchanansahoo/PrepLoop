const test = require('node:test');
const assert = require('node:assert/strict');

// Mock AsyncStorage in-memory store for unit testing
function createMockAsyncStorage() {
  const store = new Map();
  return {
    async getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    async setItem(key, val) {
      store.set(key, String(val));
    },
    async removeItem(key) {
      store.delete(key);
    },
    async getAllKeys() {
      return Array.from(store.keys());
    },
    async multiGet(keys) {
      return keys.map((k) => [k, store.get(k) || null]);
    },
    async multiRemove(keys) {
      keys.forEach((k) => store.delete(k));
    },
    _store: store,
  };
}

function createCacheManager(asyncStorage, maxMemoryEntries = 5) {
  const CACHE_PREFIX = "@preploop_cache:";
  const memoryCache = new Map();

  function touchMemory(key, entry) {
    memoryCache.delete(key);
    memoryCache.set(key, entry);
    if (memoryCache.size > maxMemoryEntries) {
      const oldestKey = memoryCache.keys().next().value;
      if (oldestKey !== undefined) {
        memoryCache.delete(oldestKey);
      }
    }
  }

  function getSync(key) {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    touchMemory(key, entry);
    return entry.data;
  }

  async function get(key) {
    const memEntry = memoryCache.get(key);
    if (memEntry) {
      if (memEntry.expiresAt && Date.now() > memEntry.expiresAt) {
        memoryCache.delete(key);
        asyncStorage.removeItem(CACHE_PREFIX + key).catch(() => {});
        return null;
      }
      touchMemory(key, memEntry);
      return memEntry.data;
    }

    try {
      const raw = await asyncStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        asyncStorage.removeItem(CACHE_PREFIX + key).catch(() => {});
        return null;
      }
      touchMemory(key, entry);
      return entry.data;
    } catch {
      return null;
    }
  }

  async function getStale(key) {
    const memEntry = memoryCache.get(key);
    if (memEntry) {
      const isStale = memEntry.expiresAt ? Date.now() > memEntry.expiresAt : false;
      touchMemory(key, memEntry);
      return { data: memEntry.data, isStale };
    }

    try {
      const raw = await asyncStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      const isStale = entry.expiresAt ? Date.now() > entry.expiresAt : false;
      touchMemory(key, entry);
      return { data: entry.data, isStale };
    } catch {
      return null;
    }
  }

  async function set(key, data, ttlSeconds = 300) {
    const entry = {
      data,
      cachedAt: Date.now(),
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    };
    touchMemory(key, entry);
    await asyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  }

  async function pruneExpired() {
    const now = Date.now();
    let memoryPruned = 0;
    let storagePruned = 0;

    for (const [key, entry] of memoryCache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        memoryCache.delete(key);
        memoryPruned++;
      }
    }

    const keys = await asyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (cacheKeys.length > 0) {
      const pairs = await asyncStorage.multiGet(cacheKeys);
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
        await asyncStorage.multiRemove(expiredKeys);
        storagePruned = expiredKeys.length;
      }
    }

    return { memoryPruned, storagePruned };
  }

  async function fetchWithCache(key, fetchFn, ttlSeconds = 300, onFreshData, options = {}) {
    const { forceRefresh = false, cacheFirst = false } = options;

    if (!forceRefresh) {
      const cached = await getStale(key);
      if (cached && !cached.isStale) {
        return cached.data;
      }
      if (cached && cached.isStale) {
        if (cacheFirst) {
          return cached.data;
        }
        fetchFn()
          .then((fresh) => {
            set(key, fresh, ttlSeconds);
            if (onFreshData) onFreshData(fresh);
          })
          .catch(() => {});
        return cached.data;
      }
    }

    try {
      const freshData = await fetchFn();
      await set(key, freshData, ttlSeconds);
      return freshData;
    } catch (err) {
      const lastResort = await getStale(key);
      if (lastResort) return lastResort.data;
      throw err;
    }
  }

  return {
    get,
    getSync,
    getStale,
    set,
    pruneExpired,
    fetchWithCache,
    getMemorySize: () => memoryCache.size,
  };
}

test('cache: sets and retrieves from memory (L1) and sync access', async () => {
  const storage = createMockAsyncStorage();
  const c = createCacheManager(storage, 5);

  await c.set('curriculum_data', { topic: 'Trees' }, 60);

  // Sync access should hit L1 immediately
  const syncHit = c.getSync('curriculum_data');
  assert.deepEqual(syncHit, { topic: 'Trees' });

  // Async access should hit L1
  const asyncHit = await c.get('curriculum_data');
  assert.deepEqual(asyncHit, { topic: 'Trees' });
});

test('cache: evicts least recently used entry when memory cap is reached', async () => {
  const storage = createMockAsyncStorage();
  const c = createCacheManager(storage, 3); // Max 3 items

  await c.set('k1', 'v1', 60);
  await c.set('k2', 'v2', 60);
  await c.set('k3', 'v3', 60);

  // Touch k1 so k2 is now oldest
  c.getSync('k1');

  // Insert k4, which should evict k2 from L1 memory
  await c.set('k4', 'v4', 60);

  assert.equal(c.getSync('k2'), null); // Evicted from L1
  assert.equal(c.getSync('k1'), 'v1'); // Kept in L1
  assert.equal(c.getSync('k4'), 'v4'); // Added to L1

  // k2 is still recoverable from L2 storage
  const fromStorage = await c.get('k2');
  assert.equal(fromStorage, 'v2');
});

test('cache: pruneExpired removes stale entries from both L1 and L2', async () => {
  const storage = createMockAsyncStorage();
  const c = createCacheManager(storage, 5);

  // Set with negative TTL (already expired)
  await c.set('stale_exam', { examId: '101' }, -10);
  await c.set('fresh_exam', { examId: '102' }, 300);

  const pruneResult = await c.pruneExpired();
  assert.equal(pruneResult.memoryPruned, 1);
  assert.equal(pruneResult.storagePruned, 1);

  assert.equal(c.getSync('stale_exam'), null);
  assert.deepEqual(c.getSync('fresh_exam'), { examId: '102' });
});

test('cache: fetchWithCache provides offline resilience when network fails', async () => {
  const storage = createMockAsyncStorage();
  const c = createCacheManager(storage, 5);

  // Initial fetch succeeds and caches
  let networkOnline = true;
  const fetchMock = async () => {
    if (!networkOnline) throw new Error('Network request failed');
    return [{ id: 'q1', title: 'Two Sum' }];
  };

  const initial = await c.fetchWithCache('questions_list', fetchMock, 300);
  assert.deepEqual(initial, [{ id: 'q1', title: 'Two Sum' }]);

  // Simulate network offline
  networkOnline = false;

  // fetchWithCache should fall back to cached questions gracefully without throwing
  const offlineResult = await c.fetchWithCache('questions_list', fetchMock, 300);
  assert.deepEqual(offlineResult, [{ id: 'q1', title: 'Two Sum' }]);
});
