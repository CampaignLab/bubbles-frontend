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
        const isTile = url.pathname.endsWith('.mvt') || url.pathname.endsWith('.pbf');

        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(request).then((cachedResponse) => {
                    if (isTile) {
                        // TILES: Cache-First (Save Credits)
                        if (cachedResponse) {
                            console.log('✅ [SW Cache-First] Tile:', url.pathname);
                            return cachedResponse;
                        }
                        return fetchAndCache(request, cache, '🌐 [SW Network] Tile:');
                    } else {
                        // STYLES/JSON: Stale-While-Revalidate (Speed)
                        const fetchPromise = fetchAndCache(request, cache, '🔄 [SW Refresh] Style:');
                        if (cachedResponse) {
                            console.log('⚡ [SW Stale] Style:', url.pathname);
                            return cachedResponse;
                        }
                        return fetchPromise;
                    }
                });
            })
        );
    }
});

function fetchAndCache(request, cache, logPrefix) {
    return fetch(request).then((networkResponse) => {
        if (networkResponse.status === 200) {
            console.log(logPrefix, new URL(request.url).pathname);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(err => {
        console.error('❌ [SW Fetch Error]', err);
    });
}
