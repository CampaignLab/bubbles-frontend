import React, { useCallback } from "react";
import { ProtomapsMap } from "./MapProtomaps";
import { useLogs } from "@/context/logContext";
import type { MapConfig } from "@/lib/config";

interface MapDisplayProps {
    mapConfig: MapConfig | null;
}

export function MapDisplay({ mapConfig }: MapDisplayProps) {
    const logContext = useLogs();

    const handleTileEvent = useCallback((eventName: string, data: any) => {
        logContext?.addLog(eventName, 'event', data);
    }, [logContext]);

    const handleViewportChange = useCallback((viewport: any) => {
        // We can use the debounced logger here to prevent flood
        logContext?.debouncedLogViewport('Map Moved', 'event', {
            lat: viewport.latitude.toFixed(4),
            lng: viewport.longitude.toFixed(4),
            zoom: viewport.zoom.toFixed(2),
            rotation: viewport.bearing.toFixed(1) + '°',
            tilt: viewport.pitch.toFixed(1) + '°'
        });
    }, [logContext]);

    if (!mapConfig) return <div>Loading Config...</div>;

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <ProtomapsMap
                mapConfig={mapConfig}
                onTileEvent={handleTileEvent}
                onViewportChange={handleViewportChange}
            />
        </div>
    );
}