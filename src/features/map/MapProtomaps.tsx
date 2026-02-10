"use client";

import { useMemo, useRef, useCallback, useEffect, useState } from "react";
import Map, { Source, Layer } from "react-map-gl/maplibre";
import type { MapRef, ViewStateChangeEvent, LayerProps } from "react-map-gl/maplibre";
// import type { MapDataEvent } from "maplibre-gl";
import { mapConfigurations } from "@/lib/config";
import type { MapConfig } from "@/lib/config";
import { circle } from "@turf/turf";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";

const polygonLayer: LayerProps = {
    id: "boundary-polygon",
    type: "fill",
    paint: {
        "fill-color": "hsl(211, 100%, 36%)",
        "fill-opacity": 0.2,
    },
};

const bubbleFillLayer: LayerProps = {
    id: "bubble-fill",
    type: "fill",
    paint: {
        "fill-color": ["case", ["==", ["get", "type"], "inclusion"], "#22c55e", "#ef4444"],
        "fill-opacity": 0.2,
    },
};

const bubbleOutlineLayer: LayerProps = {
    id: "bubble-outline",
    type: "line",
    paint: {
        "line-color": ["case", ["==", ["get", "type"], "inclusion"], "#16a34a", "#dc2626"],
        "line-width": 2,
    },
};

interface ProtomapsMapProps {
    geojson?: any;
    bubbles?: any[];
    onViewportChange?: (viewport: { latitude: number, longitude: number, zoom: number, bearing: number, pitch: number }) => void;
    onTileEvent?: (eventName: string, data: any) => void;
    onMapClick?: (lng: number, lat: number) => void;
    mapConfig: MapConfig | null;
}

export function ProtomapsMap({ geojson, bubbles = [], onViewportChange, onTileEvent, onMapClick, mapConfig }: ProtomapsMapProps) {
    const mapRef = useRef<MapRef | null>(null);
    const [isRendering, setIsRendering] = useState(false);

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


    const [styleLoaded, setStyleLoaded] = useState(false);

    const memoizedGeojson = useMemo(() => {
        return geojson;
    }, [geojson]);

    // Convert bubble points to polygons for rendering
    const bubblesGeojson = useMemo(() => {
        if (!bubbles.length) return null;
        return {
            type: 'FeatureCollection' as const,
            features: bubbles.map(b => circle([b.lng, b.lat], b.radiusKm, {
                units: 'kilometers',
                properties: { ...b }
            }))
        };
    }, [bubbles]);

    const handleMove = (evt: ViewStateChangeEvent) => {
        onViewportChange?.(evt.viewState);
    };

    const handleClick = useCallback((e: any) => {
        if (onMapClick) {
            onMapClick(e.lngLat.lng, e.lngLat.lat);
        }
    }, [onMapClick]);

    const handleLoading = useCallback(() => setIsRendering(true), []);
    const handleIdle = useCallback(() => setIsRendering(false), []);

    const handleLoad = useCallback(() => {
        setStyleLoaded(true);
        handleIdle();
    }, [handleIdle]);

    const onData = useCallback((e: any) => {
        if (e.dataType === 'source') {
            handleLoading();
        }
        if (e.dataType === 'source' && e.sourceDataType === 'metadata') {
            onTileEvent?.('MapLibre: Source Data Loaded', { sourceId: e.sourceId });
        }
    }, [onTileEvent, handleLoading]);

    useEffect(() => {
        const map = mapRef.current?.getMap();
        if (!map || !styleLoaded) return;

        if (memoizedGeojson) {
            try {
                // Imperatively update the source for immediate feedback
                const source = map.getSource('boundary-data') as maplibregl.GeoJSONSource;
                if (source) {
                    source.setData(memoizedGeojson);
                }

                const features = memoizedGeojson.features || (memoizedGeojson.type === 'Feature' ? [memoizedGeojson] : []);
                if (!features.length) return;

                const bounds = new maplibregl.LngLatBounds();
                let hasPoints = false;

                features.forEach((f: any) => {
                    const geom = f.geometry;
                    if (!geom) return;

                    const processCoords = (coords: any) => {
                        if (!coords) return;
                        if (typeof coords[0] === 'number') {
                            bounds.extend(coords as [number, number]);
                            hasPoints = true;
                        } else if (Array.isArray(coords)) {
                            coords.forEach(processCoords);
                        }
                    };
                    processCoords(geom.coordinates);
                });

                if (hasPoints) {
                    map.fitBounds(bounds, {
                        padding: 100,
                        duration: 1500
                    });
                }
            } catch (error) {
                console.error("Error updating map source/bounds:", error);
            }
        }
    }, [memoizedGeojson, styleLoaded]);


    if (!effectiveTileUrl) {
        return (
            <div style={{
                padding: '2rem',
                border: '2px dashed #ff4444',
                backgroundColor: 'rgba(255, 68, 68, 0.05)',
                color: '#ff4444',
                borderRadius: '8px',
                textAlign: 'center',
                margin: '20px',
                fontFamily: 'sans-serif'
            }}>
                <h2 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>API Key Required</h2>
                <p style={{ margin: '0 0 10px 0' }}>The "{mapConfig?.baseMapKey}" map requires an API key to load.</p>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                    Check your <code>VITE_PROTOMAPS_API_KEY</code> in <code>.env.local</code>
                </div>
            </div>
        );
    }
    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <Map
                ref={mapRef}
                initialViewState={initialViewport}
                mapStyle={effectiveTileUrl}
                style={{ width: "100%", height: "100%" }}
                onMove={handleMove}
                onData={onData}
                onLoad={handleLoad}
                onIdle={handleIdle}
                onClick={handleClick}
                minZoom={mapConfig?.minZoom}
                maxZoom={mapConfig?.maxZoom}
                maxBounds={mapConfig?.maxBounds}
            >
                {styleLoaded && (
                    <Source
                        id="boundary-data"
                        type="geojson"
                        data={memoizedGeojson || { type: 'FeatureCollection', features: [] }}
                    >
                        <Layer {...polygonLayer} />
                    </Source>
                )}

                {styleLoaded && bubblesGeojson && (
                    <Source id="bubble-data" type="geojson" data={bubblesGeojson}>
                        <Layer {...bubbleFillLayer} />
                        <Layer {...bubbleOutlineLayer} />
                    </Source>
                )}
            </Map>

            {/* Subtle Loading Overlay */}
            {isRendering && (
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(4px)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '12px',
                    color: '#64748b',
                    pointerEvents: 'none',
                    transition: 'opacity 0.3s ease-in-out'
                }}>
                    <div className="spinner-small" style={{
                        width: '12px',
                        height: '12px',
                        border: '2px solid #e2e8f0',
                        borderTopColor: '#3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    Updating Map Tiles...
                </div>
            )}
        </div>
    );
}
