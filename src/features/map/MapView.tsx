import { useCallback } from "react";
import { ProtomapsMap } from "./MapProtomaps";
import { useLogs } from "@/context/logContext";
import { defaultMapConfig, type MapConfig } from "@/lib/config";

interface MapViewProps {
    config?: MapConfig;
    geojson?: any;
    className?: string;
}

/**
 * Universal Map View component. 
 * Decoupled from any specific business logic like "Boundaries".
 * Handles its own viewport and tile event logging.
 */
export default function MapView({ config = defaultMapConfig, geojson, className }: MapViewProps) {
    const logContext = useLogs();

    const handleViewport = useCallback((v: any) => {
        logContext?.debouncedLogViewport('Map Moved', 'event', {
            lat: v.latitude.toFixed(4),
            lng: v.longitude.toFixed(4),
            zoom: v.zoom.toFixed(2),
            rotation: v.bearing.toFixed(1) + '°',
            tilt: v.pitch.toFixed(1) + '°'
        });
    }, [logContext]);

    const handleTileEvent = useCallback((name: string, data: any) => {
        logContext?.addLog(name, 'event', data);
    }, [logContext]);

    return (
        <div className={className} style={{ width: '100%', height: '100%', position: 'relative' }}>
            <ProtomapsMap
                mapConfig={config}
                geojson={geojson}
                onViewportChange={handleViewport}
                onTileEvent={handleTileEvent}
            />
        </div>
    );
}
