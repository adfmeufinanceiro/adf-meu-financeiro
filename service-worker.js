const CACHE_NAME = 'adf-meu-financeiro-v1';

const ARQUIVOS = [
  './',
  './index.html',
  './manifest.json',
  './logo-adf.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ARQUIVOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Não intercepta serviços externos, como login e Google Drive.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copia = response.clone();
          caches.open(CACHE_NAME).then(cache =>
            cache.put('./index.html', copia)
          );
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (response && response.ok) {
          const copia = response.clone();
          caches.open(CACHE_NAME).then(cache =>
            cache.put(request, copia)
          );
        }
        return response;
      });
    })
  );
});
