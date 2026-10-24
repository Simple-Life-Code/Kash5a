// Kashkha Fashions PWA Service Worker
const CACHE_NAME = 'kashkha-fashions-v2';

// Resolve base directory dynamically from service worker location
const SW_SCOPE = self.registration.scope || self.location.pathname.substring(0, self.location.pathname.lastIndexOf('/') + 1);

const ASSETS_TO_CACHE = [
  SW_SCOPE,
  `${SW_SCOPE}index.html`,
  `${SW_SCOPE}manifest.json`,
  `${SW_SCOPE}favicon.ico`,
  `${SW_SCOPE}favicon.png`,
  `${SW_SCOPE}apple-touch-icon.png`,
  `${SW_SCOPE}logo.jpg`,
  `${SW_SCOPE}logo.png`,
  `${SW_SCOPE}pwa-192x192.png`,
  `${SW_SCOPE}pwa-512x512.png`,
  `${SW_SCOPE}pwa-maskable-512x512.png`
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((url) =>
          fetch(url)
            .then((res) => {
              if (res.ok) return cache.put(url, res);
            })
            .catch(() => {})
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Navigation or asset requests
  if (event.request.method !== 'GET') return;
  
  // Ignore Firestore, Google APIs, and external tracking calls
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api') || url.pathname.includes('firestore') || url.pathname.includes('identitytoolkit')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).catch(() => caches.match('/index.html'));
    })
  );
});
