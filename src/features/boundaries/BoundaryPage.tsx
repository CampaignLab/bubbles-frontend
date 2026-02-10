import { Suspense, useState, useEffect } from "react";
import MapView from "../map/MapView";
import { BoundaryControl } from "./BoundaryControls";
import { useBoundaries } from "./useBoundaries";
import { LogConsole } from "@/components/LogConsole";
import { AnalyticsControls } from "../analytics/AnalyticsControls";
import { useBubbles } from "../analytics/useBubbles";
import { BubbleDrawControls } from "../analytics/BubbleDrawControls";

/**
 * Boundary Page component.
 * Composes the map, selection controls, and audience analytics pipeline.
 */
export default function BoundaryPage() {
    const [selectionMode, setSelectionMode] = useState<'Administrative' | 'Bubbles'>('Administrative');
    const [boundaryType, setBoundaryType] = useState<'ward' | 'constituency'>('constituency');
    const [isCtrlHeld, setIsCtrlHeld] = useState(false);

    const {
        selectedId,
        setSelectedId,
        geojson,
        allBoundaries: adminBoundaries
    } = useBoundaries(boundaryType);

    const {
        bubbles,
        availableBubbles,
        drawSettings,
        setDrawSettings,
        addBubble,
        generateAudienceCSV,
        saveBubbles,
        loadBubble
    } = useBubbles();

    // Keyboard listener for Ctrl key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Control') setIsCtrlHeld(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Control') setIsCtrlHeld(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // The list to show in the sidebar depends on the mode
    const activeList = selectionMode === 'Administrative' ? adminBoundaries : availableBubbles;

    const handleSelect = (id: string | null) => {
        if (selectionMode === 'Administrative') {
            setSelectedId(id);
        } else {
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
                    drawSettings={drawSettings}
                    showPreview={selectionMode === 'Bubbles' && isCtrlHeld}
                />
            </Suspense>

            {/* Manual Drawing Controls - Only shows when CTRL is held in Bubble mode */}
            <BubbleDrawControls
                radiusKm={drawSettings.radiusKm}
                setRadiusKm={(r: number) => setDrawSettings(prev => ({ ...prev, radiusKm: r }))}
                type={drawSettings.type}
                setType={(t: 'inclusion' | 'exclusion') => setDrawSettings(prev => ({ ...prev, type: t }))}
                visible={selectionMode === 'Bubbles' && isCtrlHeld}
            />

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
