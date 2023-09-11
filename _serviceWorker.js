const CACHE_NAME = `HocheMap-v1`;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    cache.addAll([
      '/',
      '/js/index.js',
      '/js/dijkstra.js',
      '/css/style.css',
      '/tuiles/General.svg',
      '/tuiles/E--1.svg',
      '/tuiles/E-0.svg',
      '/tuiles/E-1.svg',
      '/tuiles/E-2.svg',
      '/tuiles/E-3.svg',
      '/data/corresp_chang.json',
      '/data/graph.json',
      '/data/search.json',
      '/data/points.json',
      '/CIH.html'
    ]);
  })());
});

self.addEventListener('fetch', event => {
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Get the resource from the cache.
    const cachedResponse = await cache.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    } else {
        try {
          // If the resource was not in the cache, try the network.
          const fetchResponse = await fetch(event.request);

          // Save the resource in the cache and return it.
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        } catch (e) {
          // The network failed.
        }
    }
  })());
});