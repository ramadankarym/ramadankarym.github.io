// Ramadan page service worker: offline-first for the site's own static assets.
const CACHE = 'ramadan-site-v10';
const CORE = [
  './', './index.html', './styles.css', './app.js', './tool.js', './scenes.js',
  './preview-hero.css', './v10.css', './v10.js', './daily-card.js', './ramadan-logo.svg',
  './manifest.webmanifest', './icon-192.png', './icon-512.png',
  './styles.css?v=10', './app.js?v=10', './tool.js?v=10', './scenes.js?v=10',
  './preview-hero.css?v=10', './v10.css?v=10', './v10.js?v=10', './daily-card.js?v=10'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
