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
import * as turf from "@turf/turf";

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
        geojsonId,
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

    const lastZoomId = useRef<string | null>(null);

    // Block browser zoom and handle radius scaling
    useEffect(() => {
        const handleNativeWheel = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -1 : 1;
                setDrawSettings(prev => ({
                    ...prev,
                    radiusKm: Math.max(1, Math.min(20, Math.round(prev.radiusKm + delta)))
                }));
            }
        };

        window.addEventListener('wheel', handleNativeWheel, { passive: false });
        return () => window.removeEventListener('wheel', handleNativeWheel);
    }, [setDrawSettings]);

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

    // fitBounds logic: Consolidated and Guarded
    useEffect(() => {
        const map = mapRef.current?.getMap();
        if (!map) return;

        const currentId = selectionMode === 'Administrative' ? selectedId : activeSessionId;
        if (!currentId) return;

        // Data Readiness Check: Does data in memory match active selection?
        const isDataReady = (selectionMode === 'Administrative')
            ? (geojson && geojsonId === selectedId)
            : (bubbles.length > 0 && activeSessionId === currentId);

        if (!isDataReady || lastZoomId.current === currentId) return;

        let bbox: number[] | null = null;
        if (selectionMode === 'Administrative' && geojson) {
            bbox = turf.bbox(geojson);
        } else if (selectionMode === 'Bubbles' && bubbles.length > 0) {
            const points = turf.featureCollection(bubbles.map(b => turf.point([b.lng, b.lat])));
            bbox = turf.bbox(points);
        }

        if (bbox && bbox[0] !== Infinity && bbox[0] !== -Infinity) {
            const bounds = new maplibregl.LngLatBounds([bbox[0], bbox[1]], [bbox[2], bbox[3]]);
            lastZoomId.current = currentId;

            const diameterKm = turf.distance([bbox[0], bbox[1]], [bbox[2], bbox[3]], { units: 'kilometers' });

            // Comfortable Zoom Thresholds
            let dynamicMaxZoom = 12;
            if (diameterKm < 1.0) dynamicMaxZoom = 14.5;
            else if (diameterKm < 2.5) dynamicMaxZoom = 13.5;
            else if (diameterKm > 20) dynamicMaxZoom = 10.5;
            else if (diameterKm > 10) dynamicMaxZoom = 11.5;

            map.fitBounds(bounds, {
                padding: 100,
                duration: 500,
                maxZoom: dynamicMaxZoom
            });
        }
    }, [geojson, geojsonId, bubbles, selectionMode, selectedId, activeSessionId]);

    // Load bubbles when administrative boundary is selected
    useEffect(() => {
        if (selectionMode === 'Administrative' && selectedId) {
            loadBubble(selectedId);
        }
    }, [selectedId, selectionMode, loadBubble]);

    const handleSelect = (id: string | null) => {
        if (selectionMode === 'Administrative') {
            setSelectedId(id);
        } else if (id) {
            loadBubble(id);
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
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <MapView
                        ref={mapRef}
                        onMapClick={handleMapClick}
                        onMouseMove={handleMouseMove}
                        isCtrlHeld={isCtrlHeld}
                        dragPan={isCtrlHeld ? { mouseButton: 'right' } : true}
                        scrollZoom={isCtrlHeld ? false : true}
                    >
                        <BoundaryLayer geojson={selectionMode === 'Administrative' ? geojson : null} />
                        <BubblerLayer
                            bubbles={selectionMode === 'Bubbles' ? bubbles : []}
                            drawSettings={drawSettings}
                            previewPoint={previewPoint}
                            showPreview={selectionMode === 'Bubbles' && isCtrlHeld}
                        />
                    </MapView>
                </div>
            </Suspense>

            {/* Manual Drawing Controls */}
            <BubbleDrawControls
                radiusKm={drawSettings.radiusKm}
                setRadiusKm={(r: number) => setDrawSettings(prev => ({ ...prev, radiusKm: r }))}
                type={drawSettings.type}
                setType={(t: 'inclusion' | 'exclusion') => setDrawSettings(prev => ({ ...prev, type: t }))}
                visible={selectionMode === 'Bubbles' && isCtrlHeld}
            />

            {/* Left Side Selection */}
            <BoundaryControl
                selectedBoundaryId={selectedId}
                activeSessionId={activeSessionId}
                activeSessionName={activeSessionName}
                onSelect={handleSelect}
                boundaryType={boundaryType}
                onTypeChange={setBoundaryType}
                allBoundaries={selectionMode === 'Administrative' ? adminBoundaries : availableBubbles}
                selectionMode={selectionMode}
                onModeChange={setSelectionMode}
                onExportCSV={generateAudienceCSV}
                onSaveBubbles={saveBubbles}
                onDeleteSession={deleteSession}
            />

            {/* Right Side Analytics */}
            <AnalyticsControls activeBoundaryId={selectedId} bubbles={bubbles} />

            {/* System Log Console */}
            {import.meta.env.DEV && <LogConsole />}
        </div>
    );
}
