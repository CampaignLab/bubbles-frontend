import { Source, Layer } from 'react-map-gl/maplibre';
import type { LayerProps } from 'react-map-gl/maplibre';

const polygonLayer: LayerProps = {
    id: "boundary-polygon",
    type: "fill",
    paint: {
        "fill-color": "hsl(211, 100%, 36%)",
        "fill-opacity": 0.2,
    },
};

interface BoundaryLayerProps {
    geojson: any;
}

export function BoundaryLayer({ geojson }: BoundaryLayerProps) {
    if (!geojson) return null;

    return (
        <Source
            id="boundary-data"
            type="geojson"
            data={geojson || { type: 'FeatureCollection', features: [] }}
        >
            <Layer {...polygonLayer} />
        </Source>
    );
}
