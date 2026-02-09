import React, { useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProtomapsMap } from "@/features/map/MapProtomaps";
import { useLogs } from "@/context/logContext";
import type { MapConfig } from "@/lib/config";


interface MapDisplayProps {
    geojson: any;
    mapConfig: MapConfig | null;
    onViewportChange?: (viewport: { latitude: number; longitude: number; zoom: number; }) => void;
}

export function MapDisplay({ geojson, mapConfig, onViewportChange }: MapDisplayProps) {
    const logContext = useLogs();

    const handleTileEvent = useCallback((eventName: string, data: any) => {
        logContext?.addLog(eventName, 'event', data);
    }, [logContext]);


    if (!mapConfig) {
        return <Skeleton className="w-full h-full" />;
    }

    const { mapSystem } = mapConfig;

    if (mapSystem === 'maplibre') {
        return (
            <ProtomapsMap
                geojson={geojson}
                onViewportChange={onViewportChange}
                onTileEvent={handleTileEvent}
                mapConfig={mapConfig}
            />
        );
    }

    return <Skeleton className="w-full h-full" />;
}