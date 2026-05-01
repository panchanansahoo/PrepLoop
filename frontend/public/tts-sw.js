/**
 * Service Worker for TTS Audio Caching
 * 
 * Caches TTS audio responses with intelligent versioning.
 * Cache keys: "tts-v1:hash:timestamp"
 * 
 * Strategy:
 * - Intercept /api/voice/* requests
 * - Check cache first (if offline or cache-hit)
 * - Fall back to network if cache miss
 * - Store audio blobs with 24-hour expiry
 * - Automatic cleanup on stale cache entries
 */

const CACHE_VERSION = 'v1';
const TTS_CACHE_NAME = `tts-${CACHE_VERSION}`;
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Check every hour

// Track cache metadata (key → timestamp)
const cacheMetadata = new Map();

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
  console.log('[TTS SW] Installing...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(TTS_CACHE_NAME)
      .then((cache) => {
        console.log(`[TTS SW] Cache "${TTS_CACHE_NAME}" opened`);
        // Load metadata from IndexedDB
        loadCacheMetadata();
      })
      .catch((err) => console.error('[TTS SW] Cache open failed:', err))
  );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', (event) => {
  console.log('[TTS SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('tts-') && name !== TTS_CACHE_NAME)
            .map((name) => {
              console.log(`[TTS SW] Deleting old cache: ${name}`);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[TTS SW] Claimed clients');
        self.clients.claim();
        // Schedule cleanup task
        scheduleCleanup();
      })
  );
});

/**
 * Fetch Event Handler
 * Intercepts TTS API requests and serves from cache when possible
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept TTS API endpoints
  if (!url.pathname.includes('/api/voice/') || request.method !== 'GET') {
    return;
  }

  // Exclude health checks and metadata endpoints
  if (
    url.pathname.includes('/provider-stats') ||
    url.pathname.includes('/best-provider') ||
    url.pathname.includes('/health')
  ) {
    return;
  }

  event.respondWith(handleTTSRequest(request));
});

/**
 * Handle TTS Request
 * Strategy: Cache first (if online), network fallback
 */
async function handleTTSRequest(request) {
  try {
    // Step 1: Check cache (fast path)
    const cached = await caches.match(request);
    if (cached) {
      const isStale = isExpired(request.url);
      if (!isStale) {
        console.log('[TTS SW] Cache hit:', request.url);
        return cached;
      } else {
        // Cache stale, delete it
        caches.open(TTS_CACHE_NAME).then((cache) => cache.delete(request));
        console.log('[TTS SW] Stale cache deleted:', request.url);
      }
    }

    // Step 2: Try network (fresh data)
    const response = await fetch(request);
    if (response.ok && response.type !== 'error') {
      // Cache successful TTS responses
      const cacheControl = response.headers.get('cache-control');
      if (
        response.headers.get('content-type')?.includes('audio') ||
        cacheControl?.includes('public')
      ) {
        const responseToCache = response.clone();
        caches.open(TTS_CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
          recordCacheEntry(request.url);
          console.log('[TTS SW] Cached response:', request.url);
        });
      }
    }
    return response;
  } catch (err) {
    // Network error, fall back to cache
    console.log('[TTS SW] Network error, trying cache:', err);
    const cached = await caches.match(request);
    if (cached) {
      console.log('[TTS SW] Serving stale cache (offline):', request.url);
      return cached;
    }

    // Last resort: return error response
    return new Response(
      JSON.stringify({
        error: 'Network error and no cached audio available',
        message: err.message,
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Record cache entry timestamp
 */
function recordCacheEntry(url) {
  cacheMetadata.set(url, Date.now());
  // Also store in IndexedDB for persistence across SW updates
  storeCacheMetadata(url, Date.now());
}

/**
 * Check if cache entry is expired
 */
function isExpired(url) {
  const timestamp = cacheMetadata.get(url);
  if (!timestamp) return true;
  return Date.now() - timestamp > CACHE_EXPIRY_MS;
}

/**
 * Schedule periodic cleanup of expired entries
 */
function scheduleCleanup() {
  setInterval(async () => {
    console.log('[TTS SW] Running cleanup...');
    const cache = await caches.open(TTS_CACHE_NAME);
    const requests = await cache.keys();

    let deleted = 0;
    for (const request of requests) {
      if (isExpired(request.url)) {
        await cache.delete(request);
        cacheMetadata.delete(request.url);
        deleted++;
      }
    }

    console.log(`[TTS SW] Cleanup complete: ${deleted} expired entries deleted`);
  }, CLEANUP_INTERVAL_MS);
}

/**
 * Get cache statistics
 * Called from main thread via postMessage
 */
function getCacheStats() {
  const stats = {
    cacheVersion: CACHE_VERSION,
    cacheName: TTS_CACHE_NAME,
    entries: cacheMetadata.size,
    expiryMs: CACHE_EXPIRY_MS,
    timestamp: Date.now(),
    entries_details: Array.from(cacheMetadata.entries()).map(([url, ts]) => ({
      url,
      cachedAt: new Date(ts).toISOString(),
      expiresAt: new Date(ts + CACHE_EXPIRY_MS).toISOString(),
      isStale: Date.now() - ts > CACHE_EXPIRY_MS,
    })),
  };
  return stats;
}

/**
 * Message Handler
 * Allows main thread to query cache stats or clear cache
 */
self.addEventListener('message', (event) => {
  const { action } = event.data;

  if (action === 'GET_CACHE_STATS') {
    const stats = getCacheStats();
    event.ports[0].postMessage({ success: true, stats });
  } else if (action === 'CLEAR_CACHE') {
    caches.delete(TTS_CACHE_NAME).then(() => {
      cacheMetadata.clear();
      event.ports[0].postMessage({ success: true, message: 'Cache cleared' });
      console.log('[TTS SW] Cache cleared by client request');
    });
  } else if (action === 'CLEAR_ENTRY') {
    const { url } = event.data;
    caches.open(TTS_CACHE_NAME).then((cache) => {
      cache.delete(url).then((deleted) => {
        if (deleted) {
          cacheMetadata.delete(url);
        }
        event.ports[0].postMessage({ success: true, deleted });
      });
    });
  }
});

/**
 * IndexedDB Helper: Store cache metadata
 * Persists across service worker updates
 */
function storeCacheMetadata(url, timestamp) {
  const request = indexedDB.open('preploop-tts-cache', 1);

  request.onupgradeneeded = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains('metadata')) {
      db.createObjectStore('metadata', { keyPath: 'url' });
    }
  };

  request.onsuccess = (e) => {
    const db = e.target.result;
    const tx = db.transaction('metadata', 'readwrite');
    const store = tx.objectStore('metadata');
    store.put({ url, timestamp });
    db.close();
  };

  request.onerror = (e) => {
    console.warn('[TTS SW] IndexedDB write failed:', e);
  };
}

/**
 * Load cache metadata from IndexedDB
 */
function loadCacheMetadata() {
  const request = indexedDB.open('preploop-tts-cache', 1);

  request.onupgradeneeded = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains('metadata')) {
      db.createObjectStore('metadata', { keyPath: 'url' });
    }
  };

  request.onsuccess = (e) => {
    const db = e.target.result;
    const tx = db.transaction('metadata', 'readonly');
    const store = tx.objectStore('metadata');
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = () => {
      getAllRequest.result.forEach(({ url, timestamp }) => {
        cacheMetadata.set(url, timestamp);
      });
      console.log(`[TTS SW] Loaded ${cacheMetadata.size} cache entries from IndexedDB`);
    };

    db.close();
  };

  request.onerror = (e) => {
    console.warn('[TTS SW] IndexedDB read failed:', e);
  };
}
