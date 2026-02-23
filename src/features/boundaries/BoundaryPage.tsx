import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import MapView from "../map/MapView";
import { BoundaryControl } from "./BoundaryControls";
import { useBoundaries } from "./useBoundaries";
import { LogConsole } from "@/components/LogConsole";
import { AnalyticsControls } from "../analytics/AnalyticsControls";
import { useBubbles } from "../bubbler/useBubbles";
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
    const [hoveredBubbleId, setHoveredBubbleId] = useState<string | null>(null);

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
        interactionMode,
        setInteractionMode,
        toggleInteractionMode,
        activeSessionId,
        activeSessionName,
        setDrawSettings,
        addBubble,
        removeBubble,
        generateAudienceCSV,
        saveBubbles,
        loadBubble,
        deleteSession,
        loadBubblesFromCSV,
        clearBubbles
    } = useBubbles();

    const lastZoomId = useRef<string | null>(null);
    const skipNextZoom = useRef(false);

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
            if (e.key === 'Control') {
                setIsCtrlHeld(false);
                setInteractionMode('add');
                setHoveredBubbleId(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [setInteractionMode]);

    // fitBounds logic: Consolidated and Guarded
    useEffect(() => {
        const map = mapRef.current?.getMap();
        if (!map) return;

        const currentId = selectionMode === 'Administrative' ? selectedId : activeSessionId;
        if (!currentId) return;

        const currentZoomKey = `${selectionMode}-${currentId}`;

        // Data Readiness Check: Does data in memory match active selection?
        const isDataReady = (selectionMode === 'Administrative')
            ? (geojson && geojsonId === selectedId)
            : (bubbles.length > 0 && activeSessionId === currentId);

        if (!isDataReady || lastZoomId.current === currentZoomKey) return;

        // Visual check: Was this zoom triggered by a manual click?
        if (skipNextZoom.current) {
            lastZoomId.current = currentZoomKey;
            skipNextZoom.current = false;
            return;
        }

        let bbox: number[] | null = null;
        if (selectionMode === 'Administrative' && geojson) {
            bbox = turf.bbox(geojson);
        } else if (selectionMode === 'Bubbles' && bubbles.length > 0) {
            const points = turf.featureCollection(bubbles.map(b => turf.point([b.lng, b.lat])));
            bbox = turf.bbox(points);
        }

        if (bbox && bbox[0] !== Infinity && bbox[0] !== -Infinity) {
            // Safety check for valid coordinates [minLng, minLat, maxLng, maxLat]
            const isValid = bbox.every(v => typeof v === 'number' && !isNaN(v)) &&
                bbox[1] >= -90 && bbox[1] <= 90 &&
                bbox[3] >= -90 && bbox[3] <= 90;

            if (isValid) {
                const bounds = new maplibregl.LngLatBounds([bbox[0], bbox[1]], [bbox[2], bbox[3]]);
                lastZoomId.current = currentZoomKey;

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
            } else if (selectionMode === 'Administrative' && geojson?.features?.[0]?.properties?.LONG) {
                // Fallback for datasets encoded in BNG projection (epsg:27700) where turf returns invalid WGS84 bbox
                lastZoomId.current = currentZoomKey;
                const props = geojson.features[0].properties;
                map.flyTo({
                    center: [props.LONG, props.LAT],
                    zoom: 11.5,
                    duration: 500
                });
            }
        }
    }, [geojson, geojsonId, bubbles, selectionMode, selectedId, activeSessionId]);

    const handleSelect = (id: string | null) => {
        if (selectionMode === 'Administrative') {
            setSelectedId(id);
            clearBubbles();
        } else if (id) {
            loadBubble(id);
        }
    };

    const handleMapClick = (lng: number, lat: number) => {
        if (selectionMode === 'Bubbles') {
            // Only allow interaction if CTRL is held
            if (!isCtrlHeld) return;

            if (interactionMode === 'delete' && hoveredBubbleId) {
                removeBubble(hoveredBubbleId);
                setHoveredBubbleId(null);
            } else if (interactionMode === 'add') {
                // Prevent auto-zoom when manually starting a new session
                if (!activeSessionId) {
                    skipNextZoom.current = true;
                }
                addBubble(lng, lat);
            }
        }
    };

    const handleContextMenu = useCallback((e: any) => {
        if (selectionMode === 'Bubbles' && isCtrlHeld) {
            e.preventDefault();
            toggleInteractionMode();
        }
    }, [selectionMode, isCtrlHeld, toggleInteractionMode]);

    const handleMouseMove = useCallback((e: any) => {
        if (selectionMode !== 'Bubbles' || !isCtrlHeld) {
            setPreviewPoint(null);
            setHoveredBubbleId(null);
            return;
        }

        if (interactionMode === 'delete') {
            setPreviewPoint(null);
            // Hit-test for bubbles
            const map = mapRef.current?.getMap();
            if (map) {
                const features = map.queryRenderedFeatures(e.point, { layers: ['bubble-fill'] });
                if (features.length > 0) {
                    setHoveredBubbleId(features[0].properties?.id || null);
                } else {
                    setHoveredBubbleId(null);
                }
            }
        } else if (interactionMode === 'add') {
            setHoveredBubbleId(null);
            setPreviewPoint({ lng: e.lngLat.lng, lat: e.lngLat.lat });
        }
    }, [selectionMode, interactionMode, isCtrlHeld]);

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
                        onContextMenu={handleContextMenu}
                        isCtrlHeld={isCtrlHeld}
                        dragPan={isCtrlHeld ? { mouseButton: 'right' } : true}
                        scrollZoom={isCtrlHeld ? false : true}
                    >
                        <BoundaryLayer geojson={geojson} />
                        <BubblerLayer
                            bubbles={selectionMode === 'Bubbles' ? bubbles : []}
                            drawSettings={drawSettings}
                            previewPoint={previewPoint}
                            showPreview={selectionMode === 'Bubbles' && isCtrlHeld && interactionMode === 'add'}
                            hoveredBubbleId={hoveredBubbleId}
                        />
                    </MapView>
                </div>
            </Suspense>

            {/* Top-Level Selection & Drawing Controls */}
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
                isCtrlHeld={isCtrlHeld}
                interactionMode={interactionMode}
                drawSettings={drawSettings}
                onRadiusChange={(r: number) => setDrawSettings(prev => ({ ...prev, radiusKm: r }))}
                onDrawTypeChange={(t: 'inclusion' | 'exclusion') => setDrawSettings(prev => ({ ...prev, type: t }))}
            />

            {/* Right Side Analytics */}
            <AnalyticsControls
                activeBoundaryId={selectedId}
                bubbles={bubbles}
                selectionMode={selectionMode}
                boundaryType={boundaryType}
                onGenerated={useCallback((csv: string, id: string) => {
                    loadBubblesFromCSV(csv, id);
                    if (selectionMode !== 'Bubbles') setSelectionMode('Bubbles');
                }, [loadBubblesFromCSV, selectionMode])}
            />

            {/* System Log Console */}
            {import.meta.env.DEV && <LogConsole />}
        </div>
    );
}
