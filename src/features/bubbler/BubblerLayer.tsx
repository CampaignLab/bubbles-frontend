import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import type { LayerProps } from 'react-map-gl/maplibre';
import { circle } from '@turf/turf';

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

interface BubblerLayerProps {
    bubbles: any[];
    drawSettings?: { radiusKm: number, type: 'inclusion' | 'exclusion' };
    previewPoint?: { lng: number, lat: number } | null;
    showPreview?: boolean;
    hoveredBubbleId?: string | null;
}

export function BubblerLayer({ bubbles, drawSettings, previewPoint, showPreview, hoveredBubbleId }: BubblerLayerProps) {
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

    const previewGeojson = useMemo(() => {
        if (!showPreview || !previewPoint || !drawSettings) return null;
        return {
            type: 'FeatureCollection' as const,
            features: [
                circle([previewPoint.lng, previewPoint.lat], drawSettings.radiusKm, {
                    units: 'kilometers',
                    properties: { type: drawSettings.type, isPreview: true }
                })
            ]
        };
    }, [showPreview, previewPoint, drawSettings]);

    return (
        <>
            {bubblesGeojson && (
                <Source id="bubble-data" type="geojson" data={bubblesGeojson}>
                    <Layer {...bubbleFillLayer} />
                    <Layer {...bubbleOutlineLayer} />

                    {/* Highlight Layer for deletion (translucent fill) */}
                    <Layer
                        id="bubble-highlight-fill"
                        type="fill"
                        paint={{
                            "fill-color": "#facc15",
                            "fill-opacity": ["case", ["==", ["get", "id"], hoveredBubbleId || ""], 0.3, 0]
                        }}
                    />
                    <Layer
                        id="bubble-highlight-outline"
                        type="line"
                        paint={{
                            "line-color": "#facc15",
                            "line-width": 3,
                            "line-opacity": ["case", ["==", ["get", "id"], hoveredBubbleId || ""], 1, 0]
                        }}
                    />
                </Source>
            )}

            {previewGeojson && (
                <Source id="preview-data" type="geojson" data={previewGeojson}>
                    <Layer
                        id="preview-fill"
                        type="fill"
                        paint={{
                            ...((bubbleFillLayer as any).paint),
                            "fill-opacity": 0.4
                        }}
                    />
                    <Layer
                        id="preview-outline"
                        type="line"
                        paint={(bubbleOutlineLayer as any).paint}
                    />
                </Source>
            )}
        </>
    );
}
