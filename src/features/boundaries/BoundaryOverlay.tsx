import MapView from "../map/MapView";
import { BoundaryControl } from "./BoundaryControls";
import { useBoundaries } from "./useBoundaries";
import { LogConsole } from "@/components/LogConsole";

/**
 * Feature component that composes the MapView with Boundary-specific logic.
 */
export default function BoundaryOverlay() {
    const { selectedId, setSelectedId, geojson, allBoundaries } = useBoundaries();

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* The individual, independent Map */}
            <MapView geojson={geojson} />

            {/* The individual, independent Controls */}
            <BoundaryControl
                selectedBoundaryId={selectedId}
                onSelect={setSelectedId}
            />

            {/* System Log Console */}
            {import.meta.env.DEV && <LogConsole />}
        </div>
    );
}
