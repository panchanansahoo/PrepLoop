/**
 * Service Worker — Offline Support & Performance
 *
 * Caching Strategies:
 *   - Cache-first for static assets (JS/CSS/images/fonts) - fast repeat visits
 *   - Network-first for API calls with offline fallback - always fresh data when possible
 *   - Stale-while-revalidate for HTML pages - serve cached while fetching updates
 * 
 * Enables:
 * ✅ Offline functionality - browse cached content without network
 * ✅ Fast repeat visits - static assets served from cache
 * ✅ Resume interviews - API data cached for offline access
 * ✅ Reduced bandwidth - fewer server requests on slow networks
 * ✅ Better performance - warm cache for returning users
 */

const CACHE_NAME = 'preploop-v2';
const STATIC_CACHE = 'preploop-static-v2';
const API_CACHE = 'preploop-api-v2';
const FONT_CACHE = 'preploop-fonts-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
];

// API endpoints worth caching for offline access
const CACHEABLE_API_PATTERNS = [
  /\/api\/dsa\/problems/,
  /\/api\/dsa\/patterns/,
  /\/api\/company-interview\/company-prep-questions/,
  /\/api\/system-design/,
];

// Endpoints that should NEVER be cached (auth, payments, etc)
const NO_CACHE_PATTERNS = [
  /\/api\/auth\//,
  /\/api\/payment\//,
  /\/api\/admin\//,
];

console.log('[SW] Service Worker loaded and ready');

// ─── Install: pre-cache core static assets ───
self.addEventListener('install', (event) => {
  console.log('[SW] Installing - caching critical assets');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS)
          .catch((err) => {
            console.warn('[SW] Some static assets failed to cache:', err);
            // Continue even if some fail
          });
      })
      .then(() => {
        console.log('[SW] Skipping waiting phase');
        return self.skipWaiting();
      })
  );
});

// ─── Activate: clean up old caches ───
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating - cleaning old caches');
  
  event.waitUntil(
    caches.keys().then((keys) => {
      console.log('[SW] Existing caches:', keys);
      return Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, API_CACHE, CACHE_NAME, FONT_CACHE].includes(key))
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// ─── Fetch: route-based caching strategy ───
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip non-http requests
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Check if URL should never be cached
  if (NO_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    return;
  }

  // API requests: network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCacheFallback(request));
    return;
  }

  // Google Fonts: stale-while-revalidate with long caching
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            const cache = caches.open(FONT_CACHE);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Static assets (hashed with timestamps): cache-first (they never change)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML pages: stale-while-revalidate (serve cached while fetching fresh)
  event.respondWith(staleWhileRevalidate(request));
});

// ─── Cache-First Strategy ───
// Use for: static assets with cache busters (hash in filename)
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    console.log('[SW] Cache hit:', request.url);
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
      console.log('[SW] Cached asset:', request.url);
    }
    return response;
  } catch (error) {
    console.warn('[SW] Asset fetch failed (offline):', request.url);
    return new Response('Asset not available offline', { status: 503 });
  }
}

// ─── Network-First with Cache Fallback ───
// Use for: API calls - always try fresh data, fall back to cached for offline
async function networkFirstWithCacheFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Cache successful API responses
      const shouldCache = CACHEABLE_API_PATTERNS.some((pattern) => 
        pattern.test(new URL(request.url).pathname)
      );
      
      if (shouldCache) {
        const cache = await caches.open(API_CACHE);
        cache.put(request, response.clone());
        console.log('[SW] Cached API response:', request.url);
      }
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, checking cache:', request.url);
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Serving cached API response:', request.url);
      return cached;
    }
    console.warn('[SW] No cached response available:', request.url);
    return new Response(
      JSON.stringify({ 
        error: 'You are offline', 
        offline: true,
        message: 'API is not available offline. Check your connection.'
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ─── Stale-While-Revalidate ───
// Use for: HTML pages - serve cached immediately, update in background
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        const cache = caches.open(CACHE_NAME);
        cache.then((c) => {
          c.put(request, response.clone());
          console.log('[SW] Updated cache:', request.url);
        });
      }
      return response;
    })
    .catch((error) => {
      console.warn('[SW] Fetch failed, returning cached version:', request.url);
      if (cached) return cached;
      return new Response('Page not available offline', { status: 503 });
    });

  return cached || fetchPromise;
}

// ─── Message Handler ───
// Allows the app to control the service worker (updates, cache clearing, etc)
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data.type);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING - updating service worker');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] Clearing all caches');
    caches.keys().then((names) => {
      Promise.all(names.map((name) => caches.delete(name)));
      event.ports[0].postMessage({ success: true, cleared: names });
    });
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    const { urls } = event.data;
    console.log('[SW] Pre-caching URLs:', urls.length);
    caches.open(STATIC_CACHE).then((cache) => {
      cache.addAll(urls)
        .then(() => event.ports[0].postMessage({ success: true }))
        .catch((err) => event.ports[0].postMessage({ success: false, error: err.message }));
    });
  }
});

console.log('[SW] Service Worker ready for offline support');
