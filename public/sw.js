// Minimal offline-first service worker for DinkQueue.
// The app runs entirely on-device, so caching the shell is enough to keep a
// session going on flaky court Wi-Fi.
const CACHE = "dinkqueue-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      try {
        const fresh = await fetch(request);
        cache.put(request, fresh.clone());
        return fresh;
      } catch {
        const cached = await cache.match(request);
        return cached || Response.error();
      }
    })
  );
});
