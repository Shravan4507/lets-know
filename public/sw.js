const CACHE_NAME = 'intel-core-v2';
const BASE_PATH = '/lets-know/';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Only cache same-origin requests
    if (event.request.url.startsWith(self.location.origin)) {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(event.request);
            })
        );
    }
});
