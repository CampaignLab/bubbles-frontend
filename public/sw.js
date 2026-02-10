const CACHE_NAME = 'campaignlab-tile-cache-v1';
const TILE_URL_PATTERN = /https:\/\/api\.protomaps\.com\//;

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only intercept Protomaps tile/style requests
    if (TILE_URL_PATTERN.test(request.url)) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(request).then((response) => {
                    // Return from cache if we have it (Cache-First)
                    if (response) {
                        console.log('✅ [SW Cache] Serving tile:', url.pathname);
                        return response;
                    }

                    // Otherwise fetch and cache
                    console.log('🌐 [SW Network] Fetching tile:', url.pathname);
                    return fetch(request).then((networkResponse) => {
                        // Only cache successful requests
                        if (networkResponse.status === 200) {
                            cache.put(request, networkResponse.clone());
                        }
                        return networkResponse;
                    });
                });
            })
        );
    }
});
