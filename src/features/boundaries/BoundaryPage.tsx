import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import MapView from "../map/MapView";
import { BoundaryControl } from "./BoundaryControls";
import { useBoundaries } from "./useBoundaries";
import { LogConsole } from "@/components/LogConsole";
import { AnalyticsControls } from "../analytics/AnalyticsControls";
import { useBubbles } from "../bubbler/useBubbles";
import { BubbleDrawControls } from "../bubbler/BubbleDrawControls";
import { BubblerLayer } from "../bubbler/BubblerLayer";
import { BoundaryLayer } from "./BoundaryLayer";
import type { MapRef } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";

/**
 * Boundary Page component.
 * Composes the map, selection controls, and audience analytics pipeline.
 */
export default function BoundaryPage() {
    const mapRef = useRef<MapRef | null>(null);
    const [previewPoint, setPreviewPoint] = useState<{ lng: number, lat: number } | null>(null);
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
        activeSessionId,
        activeSessionName,
        setDrawSettings,
        addBubble,
        generateAudienceCSV,
        saveBubbles,
        loadBubble,
        deleteSession
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

    // fitBounds logic whenever geojson changes
    useEffect(() => {
        const map = mapRef.current?.getMap();
        if (!map || !geojson) return;

        try {
            const features = geojson.features || (geojson.type === 'Feature' ? [geojson] : []);
            if (!features.length) return;

            const bounds = new maplibregl.LngLatBounds();
            let hasPoints = false;

            features.forEach((f: any) => {
                const geom = f.geometry;
                if (!geom) return;

                const processCoords = (coords: any) => {
                    if (!coords) return;
                    if (typeof coords[0] === 'number') {
                        bounds.extend(coords as [number, number]);
                        hasPoints = true;
                    } else if (Array.isArray(coords)) {
                        coords.forEach(processCoords);
                    }
                };
                processCoords(geom.coordinates);
            });

            if (hasPoints) {
                map.fitBounds(bounds, {
                    padding: 50,
                    duration: 500,
                    maxZoom: 11
                });
            }
        } catch (error) {
            console.error("Error updated map bounds:", error);
        }
    }, [geojson]);

    // The list to show in the sidebar depends on the mode
    const activeList = selectionMode === 'Administrative' ? adminBoundaries : availableBubbles;

    // Load bubbles when administrative boundary is selected
    useEffect(() => {
        if (selectionMode === 'Administrative' && selectedId) {
            loadBubble(selectedId);
        }
    }, [selectedId, selectionMode]);

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
        if (selectionMode === 'Bubbles' && isCtrlHeld) {
            addBubble(lng, lat);
        }
    };

    const handleMouseMove = useCallback((e: any) => {
        if (selectionMode === 'Bubbles' && isCtrlHeld) {
            setPreviewPoint({ lng: e.lngLat.lng, lat: e.lngLat.lat });
        } else {
            setPreviewPoint(null);
        }
    }, [selectionMode, isCtrlHeld]);

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
                    ref={mapRef}
                    onMapClick={handleMapClick}
                    onMouseMove={handleMouseMove}
                    isCtrlHeld={isCtrlHeld}
                >
                    <BoundaryLayer geojson={selectionMode === 'Administrative' ? geojson : null} />
                    <BubblerLayer
                        bubbles={selectionMode === 'Bubbles' ? bubbles : []}
                        drawSettings={drawSettings}
                        previewPoint={previewPoint}
                        showPreview={selectionMode === 'Bubbles' && isCtrlHeld}
                    />
                </MapView>
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
                activeSessionId={activeSessionId}
                activeSessionName={activeSessionName}
                onSelect={handleSelect}
                boundaryType={boundaryType}
                onTypeChange={setBoundaryType}
                allBoundaries={activeList}
                selectionMode={selectionMode}
                onModeChange={(mode) => {
                    setSelectionMode(mode);
                }}
                onExportCSV={generateAudienceCSV}
                onSaveBubbles={saveBubbles}
                onDeleteSession={deleteSession}
            />

            {/* Feature 2: Right Side Analytics */}
            <AnalyticsControls activeBoundaryId={selectedId} bubbles={bubbles} />

            {/* System Log Console */}
            {import.meta.env.DEV && <LogConsole />}
        </div>
    );
}
