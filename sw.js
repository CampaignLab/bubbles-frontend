const CACHE_NAME = 'campaignlab-tile-cache-v2';
const TILE_URL_PATTERN = /https:\/\/api\.protomaps\.com\//;

self.addEventListener('install', (event) => {
    console.log('👷 [SW] Installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('👷 [SW] Activating...');
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only intercept Protomaps tile/style requests
    if (TILE_URL_PATTERN.test(request.url)) {
        const isTile = url.pathname.endsWith('.mvt') || url.pathname.endsWith('.pbf') || url.pathname.includes('/tiles/');

        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(request).then((cachedResponse) => {
                    if (cachedResponse) {
                        console.log('✅ [SW Cache Hit]:', url.pathname);
                        return cachedResponse;
                    }

                    console.log('🌐 [SW Cache Miss - Fetching]:', url.pathname);
                    return fetch(request).then((networkResponse) => {
                        // We only cache successful responses
                        if (networkResponse.status === 200) {
                            // Only cache if it's a GET request
                            if (request.method === 'GET') {
                                cache.put(request, networkResponse.clone());
                            }
                        }
                        return networkResponse;
                    }).catch(err => {
                        console.error('❌ [SW Fetch Error]', err);
                        return cachedResponse; // Return cached even if stale if network fails
                    });
                });
            })
        );
    }
});
