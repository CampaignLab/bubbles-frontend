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
    const [loading, setLoading] = useState(false);
    const [availableBoundaries, setAvailableBoundaries] = useState<any[]>([]);

    const currentBoundary = availableBoundaries.find(b => b.id === selectedId) || null;

    // Fetch the list of available boundaries when type changes
    useEffect(() => {
        boundaryService.listBoundaries(type).then(setAvailableBoundaries);
    }, [type]);

    useEffect(() => {
        if (!selectedId) {
            setGeojson(null);
            return;
        }

        setLoading(true);
        addLog?.("Fetching Boundary", "info", `Loading ${type} data for ${selectedId}`);

        boundaryService.getBoundaryGeoJSON(type, selectedId)
            .then(data => {
                setGeojson(data);
                setLoading(false);
                addLog?.("Boundary Received", "success", `Data parsed for ${selectedId} (${data.features?.length || 0} features)`);
            })
            .catch(err => {
                console.error("Failed to load geojson:", err);
                addLog?.("Load Error", "error", err.message);
                setGeojson(null);
                setLoading(false);
            });
    }, [selectedId, type, addLog]);

    return {
        selectedId,
        setSelectedId,
        geojson,
        loading,
        currentBoundary,
        allBoundaries: availableBoundaries
    };
}
