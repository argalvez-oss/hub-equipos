// Service worker: guarda la app en el celular para que abra rápido y sin señal.
// Al publicar cambios, subir VERSION para que los celulares descarguen la nueva versión.
const VERSION = 'he-v4';
const JSQR = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
const SHELL = [
  './', 'index.html', 'styles.css', 'app.js', 'manifest.webmanifest', 'data/equipos.json',
  'icons/icon-192.png', 'icons/icon-512.png', JSQR
];

self.addEventListener('install', e => {
  // Se guarda cada archivo por separado: si alguno falta, el resto igual queda disponible sin señal.
  e.waitUntil(caches.open(VERSION)
    .then(c => Promise.allSettled(SHELL.map(u => c.add(u))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const propio = url.origin === location.origin;
  const fuentes = url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com';
  if (!propio && req.url !== JSQR && !fuentes) return;

  // Abrir la app y los datos: primero la red (cambios al instante), sin señal desde el celular
  if (req.mode === 'navigate' || url.pathname.endsWith('/data/equipos.json')) {
    e.respondWith(fetch(req).then(r => {
      if (r.ok) caches.open(VERSION).then(c => c.put(req.mode === 'navigate' ? 'index.html' : req, r.clone()));
      return r;
    }).catch(() => caches.match(req.mode === 'navigate' ? 'index.html' : req)));
    return;
  }
  // Resto (código, fotos, fuentes): responde desde el celular y actualiza en segundo plano
  e.respondWith(caches.open(VERSION).then(async cache => {
    const guardado = await cache.match(req);
    const red = fetch(req).then(r => { if (r.ok) cache.put(req, r.clone()); return r; }).catch(() => guardado);
    return guardado || red;
  }));
});
