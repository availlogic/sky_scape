const CACHE_NAME = 'skyscape-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;700&display=swap'
];

// Install Service Worker and cache core shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event (cleanup old caches)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event (Robust Stale-While-Revalidate caching strategy)
self.addEventListener('fetch', (event) => {
  // Only handle local/GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  // Bypass HMR websocket upgrades
  if (event.request.headers.get('Upgrade') === 'websocket') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If we are offline and have a cached match, return it immediately to avoid network fail logs
      if (!navigator.onLine && cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Cache valid responses
        if (response && response.status === 200) {
          const cacheCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cacheCopy).catch(() => {});
          });
        }
        return response;
      }).catch(() => {
        // Fallback to cache when offline/fetch fails
        return cachedResponse || new Response('Offline fallback', { status: 503 });
      });
    })
  );
});
