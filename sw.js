const CACHE = 'agenda-v1';
const BASE = self.location.pathname.replace(/[^/]+$/, '');
const ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'css/style.css',
  BASE + 'js/data.js',
  BASE + 'js/ui.js',
  BASE + 'js/app.js',
  BASE + 'manifest.json',
  BASE + 'assets/icon.svg'
];
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => new Response('Sin conexión', { status: 503 })))
  );
});
