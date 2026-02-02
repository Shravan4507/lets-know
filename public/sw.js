const CACHE_NAME = 'intel-core-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/android-launchericon-192-192.png',
    '/android-launchericon-512-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
