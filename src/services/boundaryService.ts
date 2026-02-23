import { supabase } from '@/lib/supabase';

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
const API_BASE = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, '') // Remove trailing slash if present
    : (import.meta.env.DEV ? '/api/data' : `${import.meta.env.BASE_URL}data`);

/**
 * Robustly extracts the bucket name and project ID from a Supabase Storage URL.
 */
const storageConfig = {
    isSupabase: API_BASE.includes('supabase.co/storage'),
    get bucketName() {
        if (!this.isSupabase) return 'data';
        // URL format: https://[project-id].supabase.co/storage/v1/object/public/[bucket-name]
        const segments = API_BASE.split('/');
        return segments[segments.length - 1] || 'data';
    }
};

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
        const folder = type === 'ward' ? 'ward' : 'const';

        console.log(`🔍 [Service] Requesting boundary list: ${type}`);

        // SUPABASE STORAGE MODE
        if (storageConfig.isSupabase) {
            const bucket = storageConfig.bucketName;
            console.log(`☁️ [Storage] Target Bucket: ${bucket}, Folder: ${folder}`);

            try {
                let { data, error } = await supabase.storage.from(bucket).list(folder, {
                    limit: 100,
                    sortBy: { column: 'name', order: 'asc' },
                });

                // Robust Plural Fallback: If 'ward' is empty, try 'wards'
                if (type === 'ward' && (!data || data.length === 0)) {
                    console.log(`☁️ [Storage] Folder 'ward' empty, retrying with 'wards'...`);
                    const retry = await supabase.storage.from(bucket).list('wards', { limit: 100 });
                    if (retry.data && retry.data.length > 0) {
                        data = retry.data;
                    }
                }

                if (error) {
                    console.error("❌ [Storage] Supabase list error:", error);
                    return [];
                }

                if (!data || data.length === 0) {
                    console.warn(`⚠️ [Storage] Folder checked successfully, but it is empty.`);
                    return [];
                }

                console.log(`✅ [Storage] Found ${data.length} files in '${folder}'.`);

                return data
                    .filter(file => file.name.endsWith('.geojson'))
                    .map(file => ({
                        id: file.name.replace('.geojson', ''),
                        name: file.name.replace('.geojson', '').toUpperCase()
                    }));
            } catch (e) {
                console.error("❌ [Storage] Unexpected error during listing:", e);
                return [];
            }
        }

        // STANDARD FETCH FALLBACK
        try {
            const response = await fetch(`${API_BASE}/${folder}/`);
            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            console.warn("Fallback fetch failed:", e);
            return [];
        }
    },

    /**
     * Lists saved bubble sessions - merges API samples and Local Cache.
     */
    async listSavedBubbles(): Promise<BoundaryMetadata[]> {
        console.log("🔍 [Service] Listing saved bubbles/sessions...");

        // 1. Get official samples from Cloud/API
        let apiList: BoundaryMetadata[] = [];
        try {
            if (storageConfig.isSupabase) {
                const bucket = storageConfig.bucketName;
                console.log("☁️ [Service] Fetching sessions from Supabase Storage 'bubbles' folder");
                const { data, error } = await supabase.storage.from(bucket).list('bubbles', {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'name', order: 'asc' },
                });

                if (error) {
                    console.error("❌ [Service] Supabase Bubbles list error:", error);
                } else if (data) {
                    apiList = data
                        .filter(file => file.name.endsWith('.json'))
                        .map(file => ({
                            id: file.name.replace('.json', ''),
                            name: file.name.replace('.json', '')
                        }));
                    console.log(`✅ [Service] Found ${apiList.length} global sessions in cloud.`);
                }
            } else {
                const response = await fetch(`${API_BASE}/bubbles/`);
                if (response.ok) apiList = await response.json();
            }
        } catch (e) {
            console.warn("Could not fetch bubble samples from API", e);
        }

        // 2. Get user sessions from local cache
        const localList = userCache.list();
        console.log(`🏠 [Service] Found ${localList.length} local sessions in browser storage.`);

        // 3. Merge (local browser storage overrides API if IDs match)
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
     * Internal helper to fetch content from Supabase Storage or standard URL.
     */
    async fetchFromStorage(path: string, responseType: 'json' | 'text' = 'json'): Promise<any> {
        if (storageConfig.isSupabase) {
            const bucket = storageConfig.bucketName;
            console.log(`☁️ [Storage] Downloading: ${path} from Bucket: ${bucket}`);

            const { data, error } = await supabase.storage.from(bucket).download(path);
            if (error) {
                console.error(`❌ [Storage] Download failed for ${path}:`, error);
                throw error;
            }
            if (responseType === 'json') {
                return JSON.parse(await data.text());
            }
            return await data.text();
        }

        const response = await fetch(`${API_BASE}/${path}`);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
        return responseType === 'json' ? await response.json() : await response.text();
    },

    /**
     * Fetches a GeoJSON boundary by ID and type.
     */
    async getBoundaryGeoJSON(type: 'ward' | 'constituency', id: string): Promise<GeoJSON.FeatureCollection> {
        const path = type === 'ward' ? `ward/${encodeURIComponent(id)}.geojson` : `const/${encodeURIComponent(id)}.geojson`;
        return this.fetchFromStorage(path, 'json');
    },

    /**
     * Saves a custom bubble.
     * Always saves to Local Cache. 
     */
    async saveBubble(id: string, geojson: any): Promise<void> {
        // 1. Always write to user cache (works everywhere)
        userCache.save(id, id, geojson);

        // 2. Sync to cloud/disk
        if (API_BASE.includes('supabase.co/storage')) {
            try {
                const { error } = await supabase.storage.from('data').upload(`bubbles/${id}.json`, JSON.stringify(geojson), {
                    upsert: true,
                    contentType: 'application/json'
                });
                if (error) throw error;
            } catch (e) {
                console.error("Cloud-sync failed:", e);
            }
        } else if (import.meta.env.DEV) {
            try {
                await fetch(`${API_BASE}/bubbles/${encodeURIComponent(id)}.json`, {
                    method: 'POST',
                    body: JSON.stringify(geojson),
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (e) {
                console.error("Dev-sync to disk failed:", e);
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

        // 2. Fallback to API/Storage
        return this.fetchFromStorage(`bubbles/${encodeURIComponent(id)}.json`, 'json');
    },

    /**
     * Deletes a saved bubble session.
     * Always removes from Local Cache.
     */
    async deleteBubble(id: string): Promise<void> {
        // 1. Remove from local cache
        userCache.delete(id);

        // 2. Sync deletion
        if (API_BASE.includes('supabase.co/storage')) {
            try {
                const { error } = await supabase.storage.from('data').remove([`bubbles/${id}.json`]);
                if (error) throw error;
            } catch (e) {
                console.error("Cloud-sync delete failed:", e);
            }
        } else if (import.meta.env.DEV) {
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
        const path = `bubbles/${pathType}/${encodeURIComponent(id)}.csv`;
        try {
            return await this.fetchFromStorage(path, 'text');
        } catch (e) {
            throw new Error("Audience data not available for this boundary.");
        }
    }
};
