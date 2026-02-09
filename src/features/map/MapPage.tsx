
import React, { useState, useEffect, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MapDisplay } from "@/features/map/MapDisplay";
import type { MapConfig } from "@/lib/config";
import { mapConfigRegistry } from "@/lib/config";

function PreviewMapPageContents() {
    const searchParams = new URLSearchParams(window.location.search);
    const [activeConfig, setActiveConfig] = useState<MapConfig | null>(null);

    useEffect(() => {
        const configStr = searchParams.get('config');
        let configToLoad: MapConfig | null = null;

        if (configStr) {
            try {
                configToLoad = JSON.parse(decodeURIComponent(configStr));
            } catch (e) {
                console.error("Failed to parse config from URL, loading default.", e);
                configToLoad = mapConfigRegistry.getDefault();
            }
        } else {
            configToLoad = mapConfigRegistry.getDefault();
        }
        setActiveConfig(configToLoad);
    }, [searchParams]);

    if (!activeConfig) {
        return <Skeleton className="w-full h-screen" />;
    }

    return (
        <div style={{ height: "100vh", width: "100%" }}>
            <MapDisplay
                key={activeConfig.id}
                mapConfig={activeConfig}
                geojson={null}
            />
        </div>
    );
}

export default function PreviewMapPage() {
    return (
        <Suspense fallback={<Skeleton className="w-full h-screen" />}>
            <PreviewMapPageContents />
        </Suspense>
    )
}
