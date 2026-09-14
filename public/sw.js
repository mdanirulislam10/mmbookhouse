// Service Worker for M.M Book House Malda (PWA Offline Cache, Push & Sync - Module 20)
const CACHE_NAME = 'mm-bookhouse-v2-launch';
const OFFLINE_FALLBACK_URL = '/';

const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// 1. Install: Precache core shell & skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn('[SW] Precache asset fetch failure:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Activate: Purge stale caches & claim clients immediately (Item 10: Zero-Touch Update)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log('[SW] Purging stale cache:', name);
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Fetch: Cache-First for static assets/images, Network-First for APIs (Items 4 & 5)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests or chrome-extension URLs
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // A. Static Images, Banners, and Fonts (Cache-First + Stale-While-Revalidate)
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/_next/image') ||
    url.pathname.startsWith('/_next/static') ||
    url.hostname.includes('images.unsplash.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              (networkResponse.status === 200 || networkResponse.type === 'opaque')
            ) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // B. Navigation & HTML Pages (Network-First with Cache Fallback)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const fallback = await caches.match(OFFLINE_FALLBACK_URL);
          if (fallback) return fallback;
          return new Response(
            '<html><head><meta charset="utf-8"><title>Offline - M.M Book House</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;background:#eaeded;"><h2>⚠️ আপনি অফলাইনে আছেন</h2><p>অনুগ্রহ করে আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন। সংরক্ষিত আইটেম দেখানো হচ্ছে।</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // C. Default (Network-first with cache match)
  event.respondWith(
    fetch(request).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      return new Response(null, { status: 503, statusText: 'Service Unavailable (Offline)' });
    })
  );
});

// 4. Push Notification Event Listener (Item 8: Native-Feel Web Push & Vibration)
self.addEventListener('push', (event) => {
  let data = {
    title: 'M.M Book House Malda',
    body: 'আপনার অর্ডারের নতুন আপডেট এসেছে!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    url: '/orders',
    vibrate: [200, 100, 200],
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/icon-192.png',
    vibrate: data.vibrate || [200, 100, 200],
    data: {
      url: data.url || '/orders',
      dateOfArrival: Date.now(),
    },
    actions: [
      { action: 'open_url', title: 'বিস্তারিত দেখুন' },
      { action: 'close', title: 'মুছে ফেলুন' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 5. Notification Click Action Listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/orders';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// 6. Background Sync Listener (Item 6: Background Sync for Cart & Offline Orders)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-cart' || event.tag === 'sync-offline-orders') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'TRIGGER_OFFLINE_SYNC',
            tag: event.tag,
            timestamp: Date.now(),
          });
        });
      })
    );
  }
});

// 7. Silent Zero-Touch Code Update Trigger (Item 10)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
