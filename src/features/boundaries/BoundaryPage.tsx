import MapView from "../map/MapView";
import { BoundaryControl } from "./BoundaryControls";
import { useBoundaries } from "./useBoundaries";
import { LogConsole } from "@/components/LogConsole";
import { AnalyticsControls } from "../analytics/AnalyticsControls";

/**
 * Boundary Page component.
 * Composes the map, selection controls, and audience analytics pipeline.
 */
export default function BoundaryPage() {
    const { selectedId, setSelectedId, geojson } = useBoundaries();

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* The individual, independent Map */}
            <MapView geojson={geojson} />

            {/* Feature 1: Left Side Selection */}
            <BoundaryControl
                selectedBoundaryId={selectedId}
                onSelect={setSelectedId}
            />

            {/* Feature 2: Right Side Analytics */}
            <AnalyticsControls activeBoundaryId={selectedId} />

            {/* System Log Console */}
            {import.meta.env.DEV && <LogConsole />}
        </div>
    );
}
