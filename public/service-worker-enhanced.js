/**
 * Enhanced Service Worker for PrepLoop PWA
 * Provides intelligent caching strategies:
 * - Cache-First for versioned static assets & images
 * - Network-First for API requests with cache fallback
 * - Network-First for HTML navigation with offline fallback
 * - Periodic background cache synchronization & cleanup
 */

const STATIC_CACHE_NAME = 'preploop-enhanced-static-v1';
const DYNAMIC_CACHE_NAME = 'preploop-enhanced-dynamic-v1';
const API_CACHE_NAME = 'preploop-enhanced-api-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
];

const CACHEABLE_API_ROUTES = [
  /\/api\/dsa\/problems/,
  /\/api\/company-interview/,
  /\/api\/system-design/,
  /\/api\/notes/,
];

// Installation: Pre-cache core shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW-Enhanced] Pre-caching non-fatal warning:', err.message);
      });
    })
  );
  self.skipWaiting();
});

// Activation: Purge stale caches
self.addEventListener('activate', (event) => {
  const allowedCaches = new Set([STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME, API_CACHE_NAME]);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !allowedCaches.has(name))
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event listener: Intelligent routing & caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass non-GET requests and browser extensions
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // 1. Navigation requests: Network-First with cached shell fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match('/index.html');
          if (cached) return cached;
          return caches.match('/');
        })
    );
    return;
  }

  // 2. Cacheable API routes: Network-First with cached fallback
  if (url.pathname.startsWith('/api/')) {
    const isCacheable = CACHEABLE_API_ROUTES.some((pattern) => pattern.test(url.pathname));
    if (isCacheable) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            if (response.status === 200) {
              const copy = response.clone();
              caches.open(API_CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => caches.match(request))
      );
    }
    return;
  }

  // 3. Static assets & media: Cache-First with network fallback
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|gif|webp|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Default: Network fetch
  event.respondWith(fetch(request));
});

// Message handler for clients
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CLEAR_API_CACHE') {
    caches.delete(API_CACHE_NAME);
  }
});
