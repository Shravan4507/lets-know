const CACHE_NAME = 'intel-core-v1';
const BASE_PATH = '/lets-know/';
const ASSETS = [
    BASE_PATH,
    BASE_PATH + 'index.html',
    BASE_PATH + 'manifest.json',
    BASE_PATH + 'android-launchericon-192-192.png',
    BASE_PATH + 'android-launchericon-512-512.png'
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
