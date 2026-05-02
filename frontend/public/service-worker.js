const STATIC_CACHE = 'preploop-static-v3';
const DYNAMIC_CACHE = 'preploop-dynamic-v3';
const API_CACHE = 'preploop-api-v3';

const STATIC_ASSETS = [
  '/favicon.svg',
  '/manifest.json',
  '/',
];

// API endpoints worth caching for offline access
const API_CACHE_PATTERNS = [
  /\/api\/dsa\/problems/,
  /\/api\/dsa\/patterns/,
  /\/api\/company-interview\/company-prep-questions/,
  /\/api\/company-interview\/questions/,
  /\/api\/system-design/,
  /\/api\/user\/profile/,
];

// Cache control: Don't cache auth endpoints, real-time data, etc.
const NO_CACHE_PATTERNS = [
  /\/api\/auth\//,
  /\/api\/admin\//,
  /\/api\/payment\//,
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching critical static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Failed to cache some static assets:', err);
        // Continue even if some assets fail
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => ![STATIC_CACHE, DYNAMIC_CACHE, API_CACHE].includes(name))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome extensions and non-http
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Check if URL should not be cached
  const shouldNotCache = NO_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname));
  if (shouldNotCache) return;

  // ─── Navigation requests: NETWORK_FIRST with fallback ───
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          console.log('[SW] Navigation offline, serving cached:', url.pathname);
          const cachedIndex = await caches.match(request);
          if (cachedIndex) return cachedIndex;
          
          // Try to serve any cached version of the page
          const cachedFallback = await caches.match('/index.html');
          if (cachedFallback) return cachedFallback;
          
          return new Response('Offline - Page not available', { status: 503 });
        })
    );
    return;
  }

  // ─── API requests: NETWORK_FIRST with cache fallback ───
  if (url.pathname.startsWith('/api/')) {
    const shouldCache = API_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname));

    if (shouldCache) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(API_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            console.log('[SW] API offline, serving from cache:', url.pathname);
            return caches.match(request).then((cached) => {
              if (cached) return cached;
              return new Response(
                JSON.stringify({ error: 'Offline', cached: false }),
                { status: 503, headers: { 'Content-Type': 'application/json' } }
              );
            });
          })
      );
      return;
    }
  }

  // ─── Build assets (JS/CSS chunks): CACHE_FIRST to minimize stale mismatches ───
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request)
          .then((response) => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            console.log('[SW] Asset not available:', url.pathname);
            return new Response('Asset not available', { status: 404 });
          });
      })
    );
    return;
  }

  // ─── Google Fonts: STALE_WHILE_REVALIDATE ───
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open('fonts-cache-v1').then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });

        return cached || fetchPromise;
      })
    );
    return;
  }

  // ─── Everything else: NETWORK_FIRST with cache fallback ───
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) {
            console.log('[SW] Serving from cache:', url.pathname);
            return cached;
          }
          return new Response('Resource not available offline', { status: 503 });
        });
      })
  );
});

// ─── Message handling for SW updates and cache control ───
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting and claiming clients');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] Clearing all caches');
    caches.keys().then((names) => {
      Promise.all(names.map((name) => caches.delete(name)));
    });
  }
});

console.log('[SW] Service Worker initialized');
