/**
 * Service for fetching administrative boundaries and other external geo data.
 * In development/staging, this hits the local mock API.
 * In production, it will be updated to hit the real Python backend.
 */

export interface BoundaryMetadata {
    id: string;
    name: string;
    type: 'ward' | 'constituency';
}

export const boundaryService = {
    /**
     * Fetches a GeoJSON boundary by ID and type.
     */
    async getBoundaryGeoJSON(type: 'ward' | 'constituency', id: string): Promise<GeoJSON.FeatureCollection> {
        // We use relative URLs so Vite's proxy/middleware can intercept them
        // In full production, this might be a full URL from an env variable
        const path = type === 'ward' ? `ward/${id}.geojson` : `const/${id}.geojson`;
        const response = await fetch(`/api/data/${path}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch boundary: ${response.statusText}`);
        }

        return await response.json();
    }
};
