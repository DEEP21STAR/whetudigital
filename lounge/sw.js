// Lounge — app-shell service worker.
// Bump CACHE_NAME on every deploy that changes cached files (UI_STANDARD A5:
// "PWA cache freshness" is part of the mandatory interaction audit) -- an
// unbumped name means Deep's browser silently keeps serving the old build.
// Kept in lockstep with LOUNGE_BUILD in lounge.html and with
// latest.web.cacheName in apk/version.json -- the update checker compares those
// two, so all three move together or the app reports a phantom update.
const CACHE_NAME = 'lounge-shell-v150';
const SHELL_ASSETS = [
    '/lounge.html',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Network-first for the HTML shell itself, so a fresh build always wins
    // when online -- cache is purely an offline/TV-app fallback, never a
    // reason Deep sees a stale UI while actively developing against it.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match('/lounge.html'))
        );
        return;
    }
    event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
});
