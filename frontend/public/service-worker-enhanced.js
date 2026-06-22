/**
 * Enhanced Service Worker
 * Provides offline support, caching strategies, and PWA capabilities
 */

const CACHE_VERSION = 'v2.0.0';
const CACHE_NAME = `preploop-${CACHE_VERSION}`;

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
};

// Resources to cache immediately
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/assets/logo.svg',
  '/assets/offline-icon.svg',
];

// Route patterns and their strategies
const ROUTE_STRATEGIES = [
  {
    pattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: 'images',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  {
    pattern: /\.(?:js|css)$/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cacheName: 'static-resources',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  {
    pattern: /^https:\/\/fonts\.googleapis\.com/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cacheName: 'google-fonts',
    maxAge: 365 * 24 * 60 * 60, // 1 year
  },
  {
    pattern: /\/api\/dsa\/problems/,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cacheName: 'api-problems',
    maxAge: 60 * 60, // 1 hour
  },
  {
    pattern: /\/api\//,
    strategy: CACHE_STRATEGIES.NETWORK_ONLY,
  },
];

/**
 * Install event - precache resources
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching resources');
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

/**
 * Fetch event - handle requests with appropriate strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Find matching route strategy
  const route = ROUTE_STRATEGIES.find((r) => r.pattern.test(url.href));
  
  if (!route) {
    return;
  }

  event.respondWith(
    handleRequest(request, route)
  );
});

/**
 * Handle request based on strategy
 */
async function handleRequest(request, route) {
  const { strategy, cacheName = CACHE_NAME, maxAge } = route;

  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cacheName, maxAge);
    
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cacheName, maxAge);
    
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cacheName, maxAge);
    
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return networkOnly(request);
    
    case CACHE_STRATEGIES.CACHE_ONLY:
      return cacheOnly(request, cacheName);
    
    default:
      return fetch(request);
  }
}

/**
 * Cache First Strategy
 */
async function cacheFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached && !isExpired(cached, maxAge)) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    if (cached) {
      return cached;
    }
    return getOfflineResponse(request);
  }
}

/**
 * Network First Strategy
 */
async function networkFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached && !isExpired(cached, maxAge)) {
      return cached;
    }
    return getOfflineResponse(request);
  }
}

/**
 * Stale While Revalidate Strategy
 */
async function staleWhileRevalidate(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  return cached || fetchPromise || getOfflineResponse(request);
}

/**
 * Network Only Strategy
 */
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return getOfflineResponse(request);
  }
}

/**
 * Cache Only Strategy
 */
async function cacheOnly(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  return cached || getOfflineResponse(request);
}

/**
 * Check if cached response is expired
 */
function isExpired(response, maxAge) {
  if (!maxAge) return false;

  const cachedDate = response.headers.get('date');
  if (!cachedDate) return false;

  const age = (Date.now() - new Date(cachedDate).getTime()) / 1000;
  return age > maxAge;
}

/**
 * Get offline response
 */
function getOfflineResponse(request) {
  const url = new URL(request.url);

  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    return caches.match('/offline.html');
  }

  // Return offline JSON for API requests
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'You are currently offline. Please check your connection.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Return generic offline response
  return new Response('Offline', { status: 503 });
}

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-submissions') {
    event.waitUntil(syncSubmissions());
  }
});

/**
 * Sync offline submissions
 */
async function syncSubmissions() {
  const cache = await caches.open('offline-submissions');
  const requests = await cache.keys();

  for (const request of requests) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.delete(request);
        console.log('[SW] Synced submission:', request.url);
      }
    } catch (error) {
      console.error('[SW] Failed to sync submission:', error);
    }
  }
}

/**
 * Push notification handler
 */
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'New notification from PrepLoop',
    icon: '/assets/logo.svg',
    badge: '/assets/badge.svg',
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'PrepLoop', options)
  );
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});

/**
 * Message handler for cache management
 */
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => {
        return Promise.all(names.map((name) => caches.delete(name)));
      })
    );
  }

  if (event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      getCacheSize().then((size) => {
        event.ports[0].postMessage({ size });
      })
    );
  }
});

/**
 * Calculate total cache size
 */
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;

  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }

  return totalSize;
}

console.log('[SW] Service worker loaded');
