// Politografisi Online — Service Worker
// Powered by Workbox for a "Gold Standard" PWA experience

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
    console.log(`Yay! Workbox is loaded 🎉`);

    // Force active the new service worker
    workbox.core.skipWaiting();
    workbox.core.clientsClaim();

    // 1. Caching Images (Stale While Revalidate)
    workbox.routing.registerRoute(
        ({ request }) => request.destination === 'image',
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'images-cache',
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 50,
                    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
                }),
            ],
        })
    );

    // 2. Caching CSS, JS, and Web Workers (Stale While Revalidate)
    workbox.routing.registerRoute(
        ({ request }) =>
            request.destination === 'script' ||
            request.destination === 'style' ||
            request.destination === 'worker',
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'static-resources',
        })
    );

    // 3. Caching Google Fonts
    workbox.routing.registerRoute(
        ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'google-fonts',
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 20,
                }),
            ],
        })
    );

    // 4. HTML/Navigation (Network First)
    workbox.routing.registerRoute(
        ({ request }) => request.mode === 'navigate',
        new workbox.strategies.NetworkFirst({
            cacheName: 'pages-cache',
            plugins: [
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [200],
                }),
            ],
        })
    );

    // Fallback to offline page
    const OFFLINE_URL = '/offline';
    workbox.routing.setCatchHandler(async ({ event }) => {
        if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL) || Response.error();
        }
        return Response.error();
    });

    // Precache offline fallback route explicitly
    workbox.precaching.precacheAndRoute([
        { url: '/offline', revision: '1' },
        { url: '/manifest.json', revision: '1' },
        { url: '/icons/icon-192.png', revision: '1' },
        { url: '/icons/icon-512.png', revision: '1' }
    ]);

} else {
    console.log(`Boo! Workbox didn't load 😬`);
}
