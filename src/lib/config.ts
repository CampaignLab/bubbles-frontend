export type MapProvider = "maplibre";

export interface MapTheme {
    label: string;
    urlTemplate: string;
}

export interface BaseMap {
    label: string;
    type: "vector" | "raster";
    needsApiKey: boolean;
    themes: Record<string, MapTheme>;
}

export interface SystemConfig {
    label: string;
    baseMaps: Record<string, BaseMap>;
}

export interface MapConfig {
    id: string;
    name?: string;
    isDefault?: boolean;
    mapSystem: MapProvider;
    baseMapKey: string;
    themeKey: string;
    apiKey?: string;
    startLat: number;
    startLng: number;
    startZoom: number;
    minZoom?: number;
    maxZoom?: number;
    maxBounds?: [[number, number], [number, number]];
}

export const mapConfigurations: Record<MapProvider, SystemConfig> = {
    maplibre: {
        label: "MapLibre GL",
        baseMaps: {
            protomaps: {
                label: "Protomaps",
                type: "vector",
                needsApiKey: true,
                themes: {
                    light: {
                        label: "Light",
                        urlTemplate: "https://api.protomaps.com/styles/v5/light/en.json"
                    },
                    dark: {
                        label: "Dark",
                        urlTemplate: "https://api.protomaps.com/styles/v5/dark/en.json"
                    }
                }
            }
        }
    }
};

export const defaultMapConfig: MapConfig = {
    id: 'default',
    mapSystem: 'maplibre' as const,
    baseMapKey: 'protomaps',
    themeKey: 'light',
    // Pull the key from Vite's env system
    apiKey: import.meta.env.VITE_PROTOMAPS_API_KEY || '',
    startLat: 54.5,
    startLng: -1.0,
    startZoom: 6.0, // More zoomed in as requested
    maxZoom: 13,
    // Wider bounds to prevent "blank map" glitches on load
    maxBounds: [[-12.0, 47.0], [8.0, 63.0]],
};
