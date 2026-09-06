const CACHE_NAME = 'ferry-cache-v4'; // Bumped to v4 to force a clean slate
const assetsToCache = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assetsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            // This deletes v1, v2, and v3 caches automatically
            return caches.delete(key); 
          }
        })
      );
    })
  );
  self.clientsClaim();
});

self.addEventListener('fetch', (event) => {
  // Always bypass cache for HKO weather data to ensure live warnings
  if (event.request.url.includes('weather.gov.hk')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For HTML / Navigation requests, use a Network-First strategy
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // For other static assets, use Cache-First with background update
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => {});

      return cachedResponse || fetchPromise;
    })
  );
});