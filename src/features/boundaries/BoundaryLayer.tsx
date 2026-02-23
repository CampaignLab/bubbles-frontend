import { Source, Layer } from 'react-map-gl/maplibre';
import type { LayerProps } from 'react-map-gl/maplibre';
import { useMemo } from 'react';

const polygonLayer: LayerProps = {
    id: "boundary-polygon",
    type: "fill",
    paint: {
        "fill-color": "hsl(211, 100%, 36%)",
        "fill-opacity": 0.2,
    },
};

const boundaryOutlineLayer: LayerProps = {
    id: "boundary-outline",
    type: "line",
    paint: {
        "line-color": "hsl(211, 100%, 36%)",
        "line-width": 3,
        "line-opacity": 0.8
    }
};

const pointLayer: LayerProps = {
    id: "boundary-center-point",
    type: "circle",
    paint: {
        "circle-radius": 6,
        "circle-color": "hsl(211, 100%, 36%)",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff",
        "circle-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            8, 0.8, // Fully visible when zoomed far out
            10, 0    // Completely gone by the time the boundary fills the screen
        ],
        "circle-stroke-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            8, 1,
            10, 0
        ]
    }
};

/**
 * Renders the administrative boundary polygon.
 * Handles BNG to WGS84 projection for mock constituency data.
 */
export function BoundaryPolygon({ geojson }: { geojson: any }) {
    const isWGS84 = useMemo(() => {
        if (!geojson?.features?.[0]?.geometry?.coordinates) return true;
        const coords = geojson.features[0].geometry.coordinates;
        let first;
        if (Array.isArray(coords[0][0][0])) first = coords[0][0][0];
        else if (Array.isArray(coords[0][0])) first = coords[0][0];
        else first = coords[0];
        if (!first) return true;
        return Math.abs(first[0]) <= 180 && Math.abs(first[1]) <= 90;
    }, [geojson]);

    const processed = useMemo(() => {
        if (!geojson || isWGS84) return geojson;
        const cloned = JSON.parse(JSON.stringify(geojson));
        const props = cloned.features[0].properties;
        const bngE = props.BNG_E, bngN = props.BNG_N, lat = props.LAT, lng = props.LONG;

        if (bngE && bngN && lat && lng) {
            const transform = (coord: number[]) => [
                lng + ((coord[0] - bngE) / 68000),
                lat + ((coord[1] - bngN) / 111000)
            ];
            cloned.features.forEach((f: any) => {
                if (f.geometry.type === 'MultiPolygon') {
                    f.geometry.coordinates = f.geometry.coordinates.map((p: any) => p.map((r: any) => r.map(transform)));
                } else if (f.geometry.type === 'Polygon') {
                    f.geometry.coordinates = f.geometry.coordinates.map((r: any) => r.map(transform));
                }
            });
            return cloned;
        }
        return geojson;
    }, [geojson, isWGS84]);

    if (!processed) return null;
    return (
        <Source id="boundary-polygon-source" type="geojson" data={processed}>
            <Layer {...polygonLayer} />
            <Layer {...boundaryOutlineLayer} />
        </Source>
    );
}

/**
 * Renders a persistent indicator at the geographic center of a boundary.
 */
export function BoundaryCenterIndicator({ geojson }: { geojson: any }) {
    const pointData = useMemo(() => {
        if (!geojson?.features?.[0]?.properties) return null;
        const props = geojson.features[0].properties;
        if (!props.LONG || !props.LAT) return null;
        return {
            type: 'FeatureCollection' as const,
            features: [{
                type: 'Feature' as const,
                properties: props,
                geometry: { type: 'Point' as const, coordinates: [props.LONG, props.LAT] }
            }]
        };
    }, [geojson]);

    if (!pointData) return null;
    return (
        <Source id="boundary-point-source" type="geojson" data={pointData}>
            <Layer {...pointLayer} />
        </Source>
    );
}

export function BoundaryLayer({ geojson }: { geojson: any }) {
    if (!geojson) return null;
    return (
        <>
            <BoundaryPolygon geojson={geojson} />
            <BoundaryCenterIndicator geojson={geojson} />
        </>
    );
}
