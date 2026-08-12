/* Minimal service worker: cache shell, always network for live stream. */
const CACHE = 'kastoriafm-shell-v1'
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './logo.png',
  './favicon.png',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Never cache the live radio stream.
  if (url.pathname.endsWith('/stream') || url.pathname.endsWith('/stream.php')) {
    return
  }

  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request)
        .then((response) => {
          if (response.ok && url.origin === self.location.origin) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(event.request, copy))
          }
          return response
        })
        .catch(() => cached)
      return cached || fetched
    }),
  )
})
