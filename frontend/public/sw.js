/**
 * Service Worker — Offline Support
 *
 * Strategies:
 *   - Cache-first for static assets (JS/CSS/images/fonts)
 *   - Network-first for API calls with offline fallback
 *   - Stale-while-revalidate for HTML pages
 */

const CACHE_NAME = 'preploop-v1';
const STATIC_CACHE = 'preploop-static-v1';
const API_CACHE = 'preploop-api-v1';

const STATIC_ASSETS = [
  '/',
  '/favicon.svg',
];

// Install: pre-cache core static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: route-based caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (except fonts/CDN)
  if (url.origin !== self.location.origin && !url.hostname.includes('fonts.googleapis.com')) {
    return;
  }

  // API requests: network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCacheFallback(request));
    return;
  }

  // Static assets (hashed): cache-first
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML pages: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirstWithCacheFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: 'You are offline', offline: true }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then((c) => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => cached || new Response('Offline', { status: 503 }));

  return cached || fetchPromise;
}
