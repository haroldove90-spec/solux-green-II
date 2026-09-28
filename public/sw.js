const CACHE_NAME = 'solux-green-v3';

// Self-destructive service worker to heal broken client caches and avoid "Failed to load module script"
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      return self.clients.matchAll({ type: 'window' });
    }).then((clients) => {
      clients.forEach((client) => {
        try {
          client.navigate(client.url);
        } catch (err) {
          console.warn('Could not navigate client:', err);
        }
      });
    })
  );
});

// Pass-through all fetches directly to the network, bypassing cache entirely
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

