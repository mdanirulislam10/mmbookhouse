/* mmbookhouse service worker.
 * - Static build assets, icons and book images: cached (cache-first / stale-while-revalidate).
 * - Page navigations: always the network; only when offline we show /offline.
 *   HTML is never cached, so a shared device never sees another person's header, cart or account.
 * - /admin, /api, /auth and every signed-in area are never touched. */
const VERSION = "mm-v1";
const STATIC_CACHE = `${VERSION}-static`;
const IMAGE_CACHE = `${VERSION}-images`;
const OFFLINE_URL = "/offline";
const MAX_IMAGES = 120;

const SKIP = [/^\/admin/, /^\/api\//, /^\/auth\//, /^\/account/, /^\/checkout/, /^\/cart/, /^\/orders/, /^\/wishlist/, /^\/login/, /^\/track/];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const hit = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      // Opaque (cross-origin no-cors) and ok responses are both fine for <img>.
      if (res.ok || res.type === "opaque") {
        cache.put(request, res.clone()).then(() => trim(IMAGE_CACHE, MAX_IMAGES));
      }
      return res;
    })
    .catch(() => hit);
  return hit || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    if (url.origin !== self.location.origin || SKIP.some((re) => re.test(url.pathname))) return;
    event.respondWith(
      fetch(request).catch(async () => (await caches.match(OFFLINE_URL)) || new Response("Offline", { status: 503 })),
    );
    return;
  }

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
      event.respondWith(cacheFirst(request));
    } else if (url.pathname.startsWith("/_next/image")) {
      event.respondWith(staleWhileRevalidate(request));
    }
    return;
  }

  if (request.destination === "image" && url.pathname.includes("/storage/v1/object/public/")) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
