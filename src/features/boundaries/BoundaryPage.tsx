import { lazy, Suspense, useState } from "react";
import { BoundaryControl } from "./BoundaryControls";
import { useBoundaries } from "./useBoundaries";
import { LogConsole } from "@/components/LogConsole";
import { AnalyticsControls } from "../analytics/AnalyticsControls";

const MapView = lazy(() => import("../map/MapView"));

import { useBubbles } from "../analytics/useBubbles";

/**
 * Boundary Page component.
 * Composes the map, selection controls, and audience analytics pipeline.
 */
export default function BoundaryPage() {
    const [selectionMode, setSelectionMode] = useState<'Administrative' | 'Bubbles'>('Administrative');
    const [boundaryType, setBoundaryType] = useState<'ward' | 'constituency'>('constituency');

    const { selectedId, setSelectedId, geojson, allBoundaries: adminBoundaries } = useBoundaries(boundaryType);
    const { bubbles, availableBubbles, addBubble, generateAudienceCSV, saveBubbles, loadBubble } = useBubbles();

    // The list to show in the sidebar depends on the mode
    const activeList = selectionMode === 'Administrative' ? adminBoundaries : availableBubbles;

    const handleSelect = (id: string | null) => {
        if (selectionMode === 'Administrative') {
            setSelectedId(id);
        } else {
            // In Bubbles mode, the boundary selection doesn't apply to the map geometry
            // but we might want to track which session is active
            if (id) {
                loadBubble(id);
            }
        }
    };

    const handleMapClick = (lng: number, lat: number) => {
        if (selectionMode === 'Bubbles') {
            addBubble(lng, lat);
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* The MapView now receives both, but we control visibility via props or logic inside MapView if needed */}
            <Suspense fallback={
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f8fafc',
                    color: '#64748b'
                }}>
                    Loading Map...
                </div>
            }>
                <MapView
                    geojson={selectionMode === 'Administrative' ? geojson : null}
                    bubbles={selectionMode === 'Bubbles' ? bubbles : []}
                    onMapClick={handleMapClick}
                />
            </Suspense>

            {/* Feature 1: Left Side Selection */}
            <BoundaryControl
                selectedBoundaryId={selectedId}
                onSelect={handleSelect}
                boundaryType={boundaryType}
                onTypeChange={setBoundaryType}
                allBoundaries={activeList}
                selectionMode={selectionMode}
                onModeChange={(mode) => {
                    setSelectionMode(mode);
                    setSelectedId(null);
                }}
                onExportCSV={generateAudienceCSV}
                onSaveBubbles={() => {
                    const name = prompt("Session Name:", `session-${Date.now()}`);
                    if (name) saveBubbles(name);
                }}
            />

            {/* Feature 2: Right Side Analytics */}
            <AnalyticsControls activeBoundaryId={selectedId} bubbles={bubbles} />

            {/* System Log Console */}
            {import.meta.env.DEV && <LogConsole />}
        </div>
    );
}
