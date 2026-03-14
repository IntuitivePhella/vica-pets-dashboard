const IMAGE_CACHE_NAME = "vica-images-v2";
const STATIC_CACHE_NAME = "vica-static-v2";
const MAX_IMAGE_CACHE_ITEMS = 400;
const TRANSFORM_QUERY_PARAMS = ["width", "height", "quality", "resize", "format", "se"];

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
  const isSupabaseStorage = url.origin.includes("supabase.co") && url.pathname.includes("/storage/v1/object/public/");

  if ((isSameOrigin && url.pathname.startsWith("/supabase-img/")) || isSupabaseStorage) {
    const cacheKeyRequest = isSupabaseStorage
      ? buildCanonicalImageCacheKeyRequest(request)
      : request;
    event.respondWith(
      cacheFirst(request, IMAGE_CACHE_NAME, MAX_IMAGE_CACHE_ITEMS, cacheKeyRequest)
    );
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

function buildCanonicalImageCacheKeyRequest(request) {
  const canonicalUrl = new URL(request.url);
  TRANSFORM_QUERY_PARAMS.forEach((param) => canonicalUrl.searchParams.delete(param));
  return new Request(canonicalUrl.toString(), { method: "GET" });
}

async function cacheFirst(request, cacheName, maxItems, cacheKeyRequest = request) {
  const cached = await caches.match(cacheKeyRequest);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (!response || response.status !== 200) return response;

    const cache = await caches.open(cacheName);
    await cache.put(cacheKeyRequest, response.clone());

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
