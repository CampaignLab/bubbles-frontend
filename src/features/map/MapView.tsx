import { useCallback, forwardRef } from "react";
import { ProtomapsMap } from "./MapProtomaps";
import { useLogs } from "@/context/logContext";
import { defaultMapConfig, type MapConfig } from "@/lib/config";
import type { MapRef } from "react-map-gl/maplibre";

interface MapViewProps {
    config?: MapConfig;
    onMapClick?: (lng: number, lat: number) => void;
    onMouseMove?: (e: any) => void;
    className?: string;
    children?: React.ReactNode;
    isCtrlHeld?: boolean;
}

/**
 * Universal Map View component. 
 * Decoupled from any specific business logic like "Boundaries".
 */
const MapView = forwardRef<MapRef, MapViewProps>(({
    config = defaultMapConfig,
    onMapClick,
    onMouseMove,
    className,
    children,
    isCtrlHeld
}, ref) => {
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
                ref={ref}
                mapConfig={config}
                onViewportChange={handleViewport}
                onTileEvent={handleTileEvent}
                onMapClick={onMapClick}
                onMouseMove={onMouseMove}
                isCtrlHeld={isCtrlHeld}
            >
                {children}
            </ProtomapsMap>
        </div>
    );
});

MapView.displayName = 'MapView';
export default MapView;
