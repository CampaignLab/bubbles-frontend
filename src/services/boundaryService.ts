/**
 * Service for fetching administrative boundaries and other external geo data.
 * In development/staging, this hits the local mock API.
 * In production, it will be updated to hit the real Python backend.
 */

export interface BoundaryMetadata {
    id: string;
    name: string;
}

// Logic to determine the API root
// 1. Use VITE_API_URL if provided
// 2. Otherwise use /api/data (mock plugin) in dev/preview
// 3. Fallback to the public data folder in build/deployed pkg
const API_BASE = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : (import.meta.env.DEV ? '/api/data' : `${import.meta.env.BASE_URL}data`);

const LOCAL_STORAGE_KEY = 'bubbles_user_sessions';

/**
 * Internal helper to manage the local user cache (localStorage).
 */
const userCache = {
    getAll(): Record<string, any> {
        try {
            return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
        } catch {
            return {};
        }
    },
    get(id: string): any | null {
        return this.getAll()[id]?.data || null;
    },
    save(id: string, name: string, data: any) {
        const sessions = this.getAll();
        sessions[id] = { name, data, updatedAt: Date.now() };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
    },
    delete(id: string) {
        const sessions = this.getAll();
        delete sessions[id];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
    },
    list(): BoundaryMetadata[] {
        const sessions = this.getAll();
        return Object.keys(sessions).map(id => ({
            id,
            name: sessions[id].name
        }));
    }
};

export const boundaryService = {
    /**
     * Lists available boundaries of a certain type.
     */
    async listBoundaries(type: 'ward' | 'constituency'): Promise<BoundaryMetadata[]> {
        const path = type === 'ward' ? 'ward/' : 'const/';
        const response = await fetch(`${API_BASE}/${path}`);
        if (!response.ok) return [];
        return await response.json();
    },

    /**
     * Lists saved bubble sessions - merges API samples and Local Cache.
     */
    async listSavedBubbles(): Promise<BoundaryMetadata[]> {
        // 1. Get official samples from API
        let apiList: BoundaryMetadata[] = [];
        try {
            const response = await fetch(`${API_BASE}/bubbles/`);
            if (response.ok) apiList = await response.json();
        } catch (e) {
            console.warn("Could not fetch bubble samples from API", e);
        }

        // 2. Get user sessions from local cache
        const localList = userCache.list();

        // 3. Merge (local overrides API if IDs match)
        const combined = [...localList];
        const localIds = new Set(localList.map(l => l.id));

        apiList.forEach(apiItem => {
            if (!localIds.has(apiItem.id)) {
                combined.push(apiItem);
            }
        });

        return combined;
    },

    /**
     * Fetches a GeoJSON boundary by ID and type.
     */
    async getBoundaryGeoJSON(type: 'ward' | 'constituency', id: string): Promise<GeoJSON.FeatureCollection> {
        const path = type === 'ward' ? `ward/${encodeURIComponent(id)}.geojson` : `const/${encodeURIComponent(id)}.geojson`;
        const response = await fetch(`${API_BASE}/${path}`);
        if (!response.ok) throw new Error(`Failed to fetch boundary: ${response.statusText}`);
        return await response.json();
    },

    /**
     * Saves a custom bubble.
     * Always saves to Local Cache. 
     * In DEV, also attempts to sync to API (Mock server writes to disk).
     */
    async saveBubble(id: string, geojson: any): Promise<void> {
        // 1. Always write to user cache (works everywhere)
        userCache.save(id, id, geojson);

        // 2. In DEV, attempt to sync to disk via Mock API
        if (import.meta.env.DEV) {
            try {
                await fetch(`${API_BASE}/bubbles/${encodeURIComponent(id)}.json`, {
                    method: 'POST',
                    body: JSON.stringify(geojson),
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (e) {
                console.error("Dev-sycn to disk failed:", e);
            }
        }
    },

    /**
     * Fetches a saved bubble session.
     * Checks Local Cache first, then falls back to API.
     */
    async getBubble(id: string): Promise<any> {
        // 1. Check local cache
        const localData = userCache.get(id);
        if (localData) return localData;

        // 2. Fallback to API
        const response = await fetch(`${API_BASE}/bubbles/${encodeURIComponent(id)}.json`);
        if (!response.ok) throw new Error("Bubble not found");
        return await response.json();
    },

    /**
     * Deletes a saved bubble session.
     * Always removes from Local Cache.
     * In DEV, also syncs deletion to API.
     */
    async deleteBubble(id: string): Promise<void> {
        // 1. Remove from local cache
        userCache.delete(id);

        // 2. Sync to API in DEV
        if (import.meta.env.DEV) {
            try {
                await fetch(`${API_BASE}/bubbles/${encodeURIComponent(id)}.json`, {
                    method: 'DELETE'
                });
            } catch (e) {
                console.error("Dev-sync delete failed:", e);
            }
        }
    },

    /**
     * Fetches the pre-calculated audience CSV for a given boundary.
     */
    async getAudienceCSV(type: 'ward' | 'constituency', id: string): Promise<string> {
        const pathType = type === 'ward' ? 'ward' : 'const';
        const response = await fetch(`${API_BASE}/bubbles/${pathType}/${encodeURIComponent(id)}.csv`);
        if (!response.ok) throw new Error("Audience data not available for this boundary.");
        return await response.text();
    }
};
