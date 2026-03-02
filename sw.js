const IMAGE_CACHE_NAME = "vica-images-v1";
const STATIC_CACHE_NAME = "vica-static-v1";
const MAX_IMAGE_CACHE_ITEMS = 100;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys
          .filter((key) => key !== IMAGE_CACHE_NAME && key !== STATIC_CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin && url.pathname.startsWith("/supabase-img/")) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE_NAME, MAX_IMAGE_CACHE_ITEMS));
    return;
  }

  if (
    isSameOrigin &&
    /\.(?:css|js|png|jpg|jpeg|webp|svg|ico|woff|woff2)$/i.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
    return;
  }

  if (isSameOrigin && (request.mode === "navigate" || request.destination === "document")) {
    event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request, cacheName, maxItems) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (!response || response.status !== 200) return response;

    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());

    if (maxItems) {
      await trimCache(cacheName, maxItems);
    }

    return response;
  } catch (_error) {
    return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (_error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
  }
}

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxItems) return;

  const excess = keys.length - maxItems;
  await Promise.all(keys.slice(0, excess).map((request) => cache.delete(request)));
}
