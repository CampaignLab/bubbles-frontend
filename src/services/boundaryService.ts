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
     * Lists saved bubble sessions.
     */
    async listSavedBubbles(): Promise<BoundaryMetadata[]> {
        const response = await fetch(`${API_BASE}/bubbles/`);
        if (!response.ok) return [];
        return await response.json();
    },
    /**
     * Fetches a GeoJSON boundary by ID and type.
     */
    async getBoundaryGeoJSON(type: 'ward' | 'constituency', id: string): Promise<GeoJSON.FeatureCollection> {
        // Mapping types to backend/mock paths
        const path = type === 'ward' ? `ward/${id}.geojson` : `const/${id}.geojson`;
        const response = await fetch(`${API_BASE}/${path}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch boundary: ${response.statusText}`);
        }

        return await response.json();
    },

    /**
     * Saves a custom bubble locally.
     */
    async saveBubble(id: string, geojson: any): Promise<void> {
        const response = await fetch(`${API_BASE}/bubbles/${id}.json`, {
            method: 'POST',
            body: JSON.stringify(geojson),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Failed to save bubble: ${response.statusText}`);
        }
    },

    /**
     * Fetches all saved bubbles (not implemented in mock backend yet, would need directory listing)
     * For now, we'll assume the frontend knows the bubble IDs or we use a manifest file.
     */
    async getBubble(id: string): Promise<any> {
        const response = await fetch(`${API_BASE}/bubbles/${id}.json`);
        if (!response.ok) throw new Error("Bubble not found");
        return await response.json();
    }
};
