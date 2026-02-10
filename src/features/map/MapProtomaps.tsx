"use client";

import { useMemo, useCallback, useState, forwardRef } from "react";
import Map from "react-map-gl/maplibre";
import type { MapRef, ViewStateChangeEvent } from "react-map-gl/maplibre";
import { mapConfigurations } from "@/lib/config";
import type { MapConfig } from "@/lib/config";
import "maplibre-gl/dist/maplibre-gl.css";

interface ProtomapsMapProps {
    children?: React.ReactNode;
    onViewportChange?: (viewport: { latitude: number, longitude: number, zoom: number, bearing: number, pitch: number }) => void;
    onTileEvent?: (eventName: string, data: any) => void;
    onMapClick?: (lng: number, lat: number) => void;
    onMouseMove?: (e: any) => void;
    mapConfig: MapConfig | null;
    isCtrlHeld?: boolean;
    dragPan?: boolean | any;
    scrollZoom?: boolean | any;
}

export const ProtomapsMap = forwardRef<MapRef, ProtomapsMapProps>(({
    children,
    onViewportChange,
    onTileEvent,
    onMapClick,
    onMouseMove,
    mapConfig,
    isCtrlHeld = false,
    dragPan = true,
    scrollZoom = true
}, ref) => {
    const [isRendering, setIsRendering] = useState(false);
    const [styleLoaded, setStyleLoaded] = useState(false);

    const effectiveTileUrl = useMemo(() => {
        if (!mapConfig) return null;
        const mapSystemConfig = mapConfigurations[mapConfig.mapSystem];
        const baseMap = mapSystemConfig.baseMaps[mapConfig.baseMapKey];

        if (baseMap.needsApiKey && !mapConfig.apiKey) {
            return null;
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

    const handleMove = (evt: ViewStateChangeEvent) => {
        onViewportChange?.(evt.viewState);
    };

    const handleClick = useCallback((e: any) => {
        onMapClick?.(e.lngLat.lng, e.lngLat.lat);
    }, [onMapClick]);

    const cursor = useMemo(() => {
        if (isCtrlHeld) return 'crosshair';
        return 'grab';
    }, [isCtrlHeld]);

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
                ref={ref}
                initialViewState={initialViewport}
                mapStyle={effectiveTileUrl}
                style={{ width: "100%", height: "100%" }}
                onMove={handleMove}
                onMouseMove={onMouseMove}
                onData={onData}
                onLoad={handleLoad}
                onIdle={handleIdle}
                onClick={handleClick}
                minZoom={mapConfig?.minZoom}
                maxZoom={mapConfig?.maxZoom}
                maxBounds={mapConfig?.maxBounds}
                cursor={cursor}
                dragPan={dragPan}
                scrollZoom={scrollZoom}
            >
                {styleLoaded && children}
            </Map>

            {isRendering && (
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '12px',
                    color: '#64748b'
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
});
ProtomapsMap.displayName = 'ProtomapsMap';
