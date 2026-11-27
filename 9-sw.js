// Ramadan page service worker: always-fresh assets with offline fallback.
const CACHE = 'ramadan-site-v21';
const CORE = [
  './', './index.html', './styles.css', './app.js', './countdown-core.js', './tool.js', './scenes.js',
  './preview-hero.css', './v10.css', './v10.js', './daily-card.js', './ramadan-logo.svg',
  './manifest.webmanifest', './icon-192.png', './icon-512.png',
  './styles.css?v=10', './app.js?v=21', './countdown-core.js?v=21', './tool.js?v=20', './scenes.js?v=19',
  './preview-hero.css?v=10', './v10.css?v=13', './v10.js?v=21', './daily-card.js?v=21'
];
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(CORE.map((u) => c.add(new Request(new URL(u, self.location.href).href, { cache: 'reload' })).catch(() => null))))
      .then(() => self.skipWaiting())
  );
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
    fetch(event.request, { cache: 'no-cache' }).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then((c) => c.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});
