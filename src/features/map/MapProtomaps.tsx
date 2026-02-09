"use client";

import React, { useMemo, useRef, useCallback, useEffect } from "react";
import Map, { Source, Layer } from "react-map-gl/maplibre";
import type { MapRef, ViewStateChangeEvent, LayerProps } from "react-map-gl/maplibre";
// import type { MapDataEvent } from "maplibre-gl";
import { mapConfigurations } from "@/lib/config";
import type { MapConfig } from "@/lib/config";
import "maplibre-gl/dist/maplibre-gl.css";


const polygonLayer: LayerProps = {
    id: "polygon",
    type: "fill",
    paint: {
        "fill-color": "hsl(211, 100%, 36%)",
        "fill-opacity": 0.3,
    },
};

interface ProtomapsMapProps {
    geojson?: any;
    onViewportChange?: (viewport: { latitude: number, longitude: number, zoom: number }) => void;
    onTileEvent?: (eventName: string, data: any) => void;
    mapConfig: MapConfig | null;
}

export function ProtomapsMap({ geojson, onViewportChange, onTileEvent, mapConfig }: ProtomapsMapProps) {
    const mapRef = useRef<MapRef | null>(null);

    const effectiveTileUrl = useMemo(() => {
        if (!mapConfig) return null;
        const mapSystemConfig = mapConfigurations[mapConfig.mapSystem];
        const baseMap = mapSystemConfig.baseMaps[mapConfig.baseMapKey];

        // Check if we have API key before proceeding
        if (baseMap.needsApiKey && !mapConfig.apiKey) {
            return null; // Trigger error display in the component
        }
        const theme = baseMap?.themes[mapConfig.themeKey];
        return theme ? `${theme.urlTemplate}?key=${mapConfig.apiKey}` : null;
    }, [mapConfig]);

    const initialViewport = useMemo(() => {
        if (mapConfig) {
            return {
                latitude: mapConfig.startLat,
                longitude: mapConfig.startLng,
                zoom: mapConfig.startZoom,
            };
        }
        return {
            latitude: 54.5,
            longitude: -2.5,
            zoom: 4.5,
        };
    }, [mapConfig]);


    const memoizedGeojson = useMemo(() => {
        return geojson;
    }, [geojson]);


    const handleMove = (evt: ViewStateChangeEvent) => {
        onViewportChange?.(evt.viewState);
    };

    const onData = useCallback((e: any) => {
        if (e.dataType === 'source' && e.sourceDataType === 'metadata') {
            onTileEvent?.('MapLibre: Source Data Loaded', { sourceId: e.sourceId });
        }
    }, [onTileEvent]);

    useEffect(() => {
        const map = mapRef.current?.getMap();
        if (!map || !map.isStyleLoaded()) return;

        if (memoizedGeojson) {
            const source = map.getSource('boundary-data') as any;
            if (source) {
                source.setData(memoizedGeojson);
            }

            try {
                // This relies on maplibregl being available on the window, which react-map-gl should ensure.
                // A null check is added for safety.
                const maplibregl = (window as any).maplibregl;
                if (!maplibregl) {
                    console.error("maplibregl is not available on window object.");
                    return;
                }

                const coordinates = geojson.features[0].geometry.coordinates[0][0];
                const bounds = coordinates.reduce((bounds: any, coord: any) => {
                    return bounds.extend(coord);
                }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));

                if (bounds) {
                    map.fitBounds(bounds, {
                        padding: 20
                    });
                }
            } catch (error) {
                console.error("Error fitting bounds:", error);
                // Fallback to center/zoom if bounds fitting fails
                map.setCenter([mapConfig?.startLng || -2.5, mapConfig?.startLat || 54.5]);
                map.setZoom(mapConfig?.startZoom || 5);
            }

        }
    }, [memoizedGeojson, mapConfig]);


    if (!effectiveTileUrl) {
        return (
            <div className="p-8 border-2 border-dashed border-red-500 bg-red-50/10 text-red-500 rounded-lg">
                <h2 className="text-xl font-bold">API Key Required</h2>
                <p>The "{mapConfig?.baseMapKey}" map requires an API key to load.</p>
                <p className="text-sm mt-2 opacity-70">Check your configuration in src/lib/config.ts</p>
            </div>
        );
    }
    return (
        <Map
            ref={mapRef}
            key={effectiveTileUrl}
            initialViewState={initialViewport}
            mapStyle={effectiveTileUrl}
            style={{ width: "100%", height: "100%" }}
            onMove={handleMove}
            onData={onData}
            minZoom={mapConfig?.minZoom}
            maxZoom={mapConfig?.maxZoom}
        >
            {memoizedGeojson && (
                <Source id="boundary-data" type="geojson" data={memoizedGeojson}>
                    <Layer {...polygonLayer} />
                </Source>
            )}
        </Map>
    );
}