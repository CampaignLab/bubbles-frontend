import { useState, useCallback, useEffect, useRef } from 'react';
import { boundaryService } from '@/services/boundaryService';
import { useLogs } from '@/context/logContext';

export interface BubblePoint {
    id: string;
    lng: number;
    lat: number;
    radiusKm: number;
    type: 'inclusion' | 'exclusion';
}

export function useBubbles() {
    const { addLog } = useLogs() || {};
    const [bubbles, setBubbles] = useState<BubblePoint[]>([]);
    const [availableBubbles, setAvailableBubbles] = useState<any[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [activeSessionName, setActiveSessionName] = useState<string | null>(null);

    // Tracking for race conditions
    const lastRequestRef = useRef<string | null>(null);

    const [interactionMode, setInteractionMode] = useState<'add' | 'delete'>('add');

    // Manual Drawing Settings
    const [drawSettings, setDrawSettings] = useState<{
        radiusKm: number;
        type: 'inclusion' | 'exclusion';
        units: 'km' | 'miles';
    }>({
        radiusKm: 1.0,
        type: 'inclusion',
        units: 'km'
    });

    const toggleInteractionMode = useCallback(() => {
        setInteractionMode(prev => prev === 'add' ? 'delete' : 'add');
    }, []);

    const refreshSavedList = useCallback(async () => {
        const list = await boundaryService.listSavedBubbles();
        setAvailableBubbles(list);
    }, []);

    useEffect(() => {
        refreshSavedList();
    }, [refreshSavedList]);

    const addBubble = useCallback((lng: number, lat: number) => {
        if (!activeSessionId) {
            const newId = `Session ${Date.now()}`;
            setActiveSessionId(newId);
            setActiveSessionName(newId);
            addLog?.("New Session", "info", `Starting new session: ${newId}`);
        }

        const id = `bubble-${Date.now()}`;
        const newBubble: BubblePoint = {
            id,
            lng,
            lat,
            radiusKm: drawSettings.radiusKm,
            type: drawSettings.type
        };
        setBubbles(prev => [...prev, newBubble]);
        addLog?.("Bubble Added", "info", `${drawSettings.type} bubble (${drawSettings.radiusKm}km) created.`);
    }, [drawSettings, addLog, activeSessionId]);

    const removeBubble = useCallback((id: string) => {
        setBubbles(prev => prev.filter(b => b.id !== id));
        addLog?.("Bubble Removed", "info", "Bubble deleted from session.");
    }, [addLog]);

    const loadBubble = useCallback(async (id: string) => {
        // Prevent redundant loads if already active or being fetched
        if (id === activeSessionId && bubbles.length > 0) return;
        if (id === lastRequestRef.current) return;

        lastRequestRef.current = id;
        setBubbles([]);

        try {
            const data = await boundaryService.getBubble(id);

            // Validate that we still care about this specific request
            if (lastRequestRef.current !== id) return;

            if (data.features) {
                const points = data.features.map((f: any) => f.properties as BubblePoint);
                setBubbles(points);
                setActiveSessionId(id);
                const saved = availableBubbles.find(b => b.id === id);
                setActiveSessionName(saved ? saved.name : id);
                addLog?.("Session Loaded", "success", `Loaded ${points.length} points from ${id}`);
            }
        } catch (err: any) {
            if (lastRequestRef.current !== id) return;

            setBubbles([]);
            setActiveSessionId(id);
            setActiveSessionName(id);

            if (!err.message?.includes('404') && !err.message?.includes('found')) {
                addLog?.("Load Error", "error", err.message);
            }
        }
    }, [activeSessionId, bubbles.length, availableBubbles, addLog]);

    const saveBubbles = async (name: string) => {
        try {
            const geojson = {
                type: 'FeatureCollection',
                features: bubbles.map(b => ({
                    type: 'Feature',
                    properties: { ...b },
                    geometry: {
                        type: 'Point',
                        coordinates: [b.lng, b.lat]
                    }
                }))
            };
            await boundaryService.saveBubble(name, geojson);
            setActiveSessionId(name);
            setActiveSessionName(name);
            addLog?.("Bubbles Saved", "success", `Saved ${bubbles.length} bubbles as ${name}`);
            refreshSavedList();
        } catch (err: any) {
            addLog?.("Save Error", "error", err.message);
        }
    };

    const deleteSession = async (id: string) => {
        try {
            await boundaryService.deleteBubble(id);
            if (activeSessionId === id) {
                setBubbles([]);
                setActiveSessionId(null);
                setActiveSessionName(null);
                lastRequestRef.current = null;
            }
            addLog?.("Session Deleted", "info", `Removed session ${id}`);
            refreshSavedList();
        } catch (err: any) {
            addLog?.("Delete Error", "error", err.message);
        }
    };

    const generateAudienceCSV = () => {
        const header = "Type,Longitude,Latitude,RadiusKM\n";
        const rows = bubbles.map(b => `${b.type},${b.lng},${b.lat},${b.radiusKm}`).join("\n");
        const blob = new Blob([header + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audience-${Date.now()}.csv`;
        a.click();
        addLog?.("CSV Generated", "success", "Audience export complete.");
    };

    return {
        bubbles,
        availableBubbles,
        drawSettings,
        activeSessionId,
        activeSessionName,
        setDrawSettings,
        addBubble,
        removeBubble,
        interactionMode,
        setInteractionMode,
        toggleInteractionMode,
        saveBubbles,
        loadBubble,
        deleteSession,
        generateAudienceCSV
    };
}
