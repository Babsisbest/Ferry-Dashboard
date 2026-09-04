const CACHE_NAME = 'ferry-dashboard-v5';

// Install event: skip waiting to activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Dynamically cache the exact path you are currently viewing
      return cache.addAll([location.pathname]).catch(() => console.log("Local caching bypassed."));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Fetch event: Network-first, fallback to cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(async () => {
      const response = await caches.match(event.request);
      if (response) return response;
      // If totally offline and cache fails, return a basic offline response
      return new Response("App is completely offline. Start your local server.", {
        status: 503,
        statusText: "Service Unavailable"
      });
    })
  );
});