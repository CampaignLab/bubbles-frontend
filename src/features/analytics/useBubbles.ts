import { useState, useCallback, useEffect } from 'react';
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

    const refreshSavedList = useCallback(async () => {
        const list = await boundaryService.listSavedBubbles();
        setAvailableBubbles(list);
    }, []);

    useEffect(() => {
        refreshSavedList();
    }, [refreshSavedList]);

    const addBubble = useCallback((lng: number, lat: number) => {
        const id = `bubble-${Date.now()}`;
        const newBubble: BubblePoint = {
            id,
            lng,
            lat,
            radiusKm: 1.0, // Minimum 1km as requested
            type: 'inclusion'
        };
        setBubbles(prev => [...prev, newBubble]);
        addLog?.("Bubble Added", "info", `New bubble at ${lng.toFixed(4)}, ${lat.toFixed(4)}`);
    }, [addLog]);

    const updateBubble = useCallback((id: string, updates: Partial<BubblePoint>) => {
        setBubbles(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    }, []);

    const removeBubble = useCallback((id: string) => {
        setBubbles(prev => prev.filter(b => b.id === id));
    }, []);

    const loadBubble = async (id: string) => {
        try {
            const data = await boundaryService.getBubble(id);
            if (data.features) {
                const points = data.features.map((f: any) => f.properties as BubblePoint);
                setBubbles(points);
                addLog?.("Session Loaded", "success", `Loaded ${points.length} points from ${id}`);
            }
        } catch (err: any) {
            addLog?.("Load Error", "error", err.message);
        }
    };

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
            addLog?.("Bubbles Saved", "success", `Saved ${bubbles.length} bubbles as ${name}`);
            refreshSavedList();
        } catch (err: any) {
            addLog?.("Save Error", "error", err.message);
        }
    };

    /**
     * Generates a sample CSV format for audiences.
     */
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
        addBubble,
        updateBubble,
        removeBubble,
        saveBubbles,
        loadBubble,
        generateAudienceCSV
    };
}
