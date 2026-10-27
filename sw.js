// Service worker : précache de l'application pour un fonctionnement hors-ligne.
// Incrémentez VERSION à chaque déploiement pour forcer la mise à jour.
const VERSION = 'ls-garage-v1';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/main.js', 'js/portfolio.js', 'js/data/profile.js',
  'js/cars/index.js', 'js/cars/rs3.js', 'js/cars/corvette.js', 'js/cars/camaro.js', 'js/cars/c6.js', 'js/cars/tesla.js',
  'js/garage/garage.js', 'js/garage/renderer.js', 'js/garage/wheels.js', 'js/garage/xray.js', 'js/garage/tach.js', 'js/garage/sheet.js',
  'js/audio/engine-audio.js', 'js/audio/engine-sim.js', 'js/audio/engine-dsp.js',
  'icons/icon.svg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Réseau d'abord pour la page (mises à jour rapides), cache d'abord pour le reste.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put('index.html', copy));
          return res;
        })
        .catch(() => caches.match('index.html')),
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
      }
      return res;
    })),
  );
});
