// Service worker : précache de l'application pour un fonctionnement hors-ligne.
// Les modèles 3D (assets/models/*.glb) sont mis en cache à leur premier chargement (cache d'abord).
// Incrémentez VERSION à chaque déploiement pour forcer la mise à jour.
const VERSION = 'ls-studio-v4';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/tailwind.css',
  'css/app.css',
  'assets/models/selection.json',
  'js/armory/accessories.js',
  'js/armory/armory.js',
  'js/armory/gun-audio.js',
  'js/armory/scene3d.js',
  'js/armory/target.js',
  'js/armory/weapons/benelli.js',
  'js/armory/weapons/canik.js',
  'js/armory/weapons/glock17.js',
  'js/armory/weapons/hk416.js',
  'js/armory/weapons/index.js',
  'js/armory/weapons/mp5.js',
  'js/audio/engine-audio.js',
  'js/audio/engine-dsp.js',
  'js/audio/engine-sim.js',
  'js/cars/c6.js',
  'js/cars/camaro.js',
  'js/cars/corvette.js',
  'js/cars/index.js',
  'js/cars/rs3.js',
  'js/cars/tesla.js',
  'js/core/audio.js',
  'js/core/color.js',
  'js/core/credits.js',
  'js/core/sheet.js',
  'js/core/stage3d.js',
  'js/core/util.js',
  'js/garage/garage.js',
  'js/garage/scene3d.js',
  'js/garage/tach.js',
  'js/main.js',
  'vendor/three/addons/controls/OrbitControls.js',
  'vendor/three/addons/environments/RoomEnvironment.js',
  'vendor/three/addons/libs/meshopt_decoder.module.js',
  'vendor/three/addons/loaders/GLTFLoader.js',
  'vendor/three/addons/utils/BufferGeometryUtils.js',
  'vendor/three/three.module.min.js',
  'icons/icon.svg',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
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
