import { useState, useEffect } from "react";
import { useLogs } from "@/context/logContext";
import { boundaryService } from "@/services/boundaryService";

/**
 * Domain-specific hook for managing boundary data and selection.
 */
export function useBoundaries(type: 'ward' | 'constituency' = 'constituency') {
    const { addLog } = useLogs() || {};
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [geojson, setGeojson] = useState<any | null>(null);
    const [geojsonId, setGeojsonId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [availableBoundaries, setAvailableBoundaries] = useState<any[]>([]);

    useEffect(() => {
        boundaryService.listBoundaries(type).then(setAvailableBoundaries);
    }, [type]);

    useEffect(() => {
        if (!selectedId) {
            setGeojson(null);
            setGeojsonId(null);
            return;
        }

        let active = true;
        setGeojson(null);
        setGeojsonId(null);
        setLoading(true);
        addLog?.("Fetching Boundary", "info", `Loading ${type} data for ${selectedId}`);

        boundaryService.getBoundaryGeoJSON(type, selectedId)
            .then(data => {
                if (!active) return;
                setGeojson(data);
                setGeojsonId(selectedId);
                setLoading(false);
                addLog?.("Boundary Received", "success", `Data parsed for ${selectedId}`);
            })
            .catch(err => {
                if (!active) return;
                console.error("Failed to load geojson:", err);
                addLog?.("Load Error", "error", err.message);
                setGeojson(null);
                setGeojsonId(null);
                setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [selectedId, type, addLog]);

    return {
        selectedId,
        setSelectedId,
        geojson,
        geojsonId,
        loading,
        currentBoundary: availableBoundaries.find(b => b.id === selectedId) || null,
        allBoundaries: availableBoundaries
    };
}
