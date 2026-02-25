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

        // LOCAL DEV MODE (Only hits if NOT Supabase)
        try {
            console.log(`🏠 [Service] Fetching local boundaries from ${API_BASE}/${folder}/`);
            const response = await fetch(`${API_BASE}/${folder}/`);
            if (!response.ok) return [];
            return await response.json();
        } catch (e) {
            console.warn("Local fetch failed:", e);
            return [];
        }
    },

    /**
     * Lists saved bubble sessions - purely from Local Cache now.
     */
    async listSavedBubbles(): Promise<BoundaryMetadata[]> {
        console.log("🔍 [Service] Listing local saved bubbles/sessions...");
        const localList = userCache.list();
        console.log(`🏠 [Service] Found ${localList.length} local sessions in browser storage.`);
        return localList;
    },

    /**
     * Internal helper to fetch content from Supabase Storage or standard URL.
     * Used for Boundaries, NOT sessions.
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
     * Always saves strictly to Local Cache. 
     */
    async saveBubble(id: string, geojson: any): Promise<void> {
        userCache.save(id, id, geojson);
    },

    /**
     * Fetches a saved bubble session.
     * Always fetches strictly from Local Cache.
     */
    async getBubble(id: string): Promise<any> {
        const localData = userCache.get(id);
        if (localData) return localData;
        throw new Error(`Session ${id} not found locally.`);
    },

    /**
     * Deletes a saved bubble session.
     * Always deletes strictly from Local Cache.
     */
    async deleteBubble(id: string): Promise<void> {
        userCache.delete(id);
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
