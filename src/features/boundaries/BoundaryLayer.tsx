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

const pointLayer: LayerProps = {
    id: "boundary-point",
    type: "circle",
    paint: {
        "circle-radius": 6,
        "circle-color": "hsl(211, 100%, 36%)",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff"
    }
};

interface BoundaryLayerProps {
    geojson: any;
}

export function BoundaryLayer({ geojson }: BoundaryLayerProps) {
    // Check if geometry is in valid WGS84 range
    const isWGS84 = useMemo(() => {
        if (!geojson?.features?.[0]?.geometry?.coordinates) return true;
        const coords = geojson.features[0].geometry.coordinates;
        // Check first coordinate of first polygon
        let first;
        if (Array.isArray(coords[0][0][0])) first = coords[0][0][0]; // MultiPolygon
        else if (Array.isArray(coords[0][0])) first = coords[0][0]; // Polygon
        else first = coords[0];

        if (!first) return true;
        return Math.abs(first[0]) <= 180 && Math.abs(first[1]) <= 90;
    }, [geojson]);

    // Fallback source if projected
    const processedGeojson = useMemo(() => {
        if (!geojson) return null;
        if (isWGS84) return geojson;

        // Clone to avoid mutating original
        const cloned = JSON.parse(JSON.stringify(geojson));

        // Helper to transform [East, North] -> [Lng, Lat] 
        // This is a naive approximation for the mock data context
        // Real BNG to WGS84 usually requires a complex Helmert transform or proj4
        // However, for the provided data range (Coventry approx 430000, 280000):
        // PCON24NM: "Coventry North West", BNG_E: 430294.0, BNG_N: 281733.0, LAT: 52.43276, LONG: -1.55584
        // We can use the props.LAT/props.LONG and the BNG offset if we had a full library,
        // but since this is a mock environment, we'll implement a static offset transform 
        // based on the known center points in the file.
        const props = cloned.features[0].properties;
        const bngE = props.BNG_E;
        const bngN = props.BNG_N;
        const lat = props.LAT;
        const lng = props.LONG;

        if (bngE && bngN && lat && lng) {
            const transform = (coord: number[]) => {
                const de = coord[0] - bngE;
                const dn = coord[1] - bngN;
                // Constants for Coventry roughly: 1 deg Lat ~ 111km, 1 deg Lng ~ 68km
                // BNG units are meters.
                return [
                    lng + (de / 68000),
                    lat + (dn / 111000)
                ];
            };

            cloned.features.forEach((f: any) => {
                if (f.geometry.type === 'MultiPolygon') {
                    f.geometry.coordinates = f.geometry.coordinates.map((poly: any) =>
                        poly.map((ring: any) => ring.map(transform))
                    );
                } else if (f.geometry.type === 'Polygon') {
                    f.geometry.coordinates = f.geometry.coordinates.map((ring: any) => ring.map(transform));
                }
            });
            return cloned;
        }

        // Final fallback: Single point
        if (props.LONG && props.LAT) {
            return {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    properties: props,
                    geometry: {
                        type: 'Point',
                        coordinates: [props.LONG, props.LAT]
                    }
                }]
            };
        }
        return null;
    }, [geojson, isWGS84]);

    if (!processedGeojson) return null;

    return (
        <Source
            id="boundary-data"
            type="geojson"
            data={processedGeojson}
        >
            {isWGS84 ? (
                <Layer {...polygonLayer} />
            ) : (
                <Layer {...pointLayer} />
            )}
        </Source>
    );
}
