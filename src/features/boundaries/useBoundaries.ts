import { useState, useEffect } from "react";
import { boundaries } from "@/lib/data";
import { useLogs } from "@/context/logContext";
import { boundaryService } from "@/services/boundaryService";

/**
 * Domain-specific hook for managing boundary data and selection.
 */
export function useBoundaries() {
    const { addLog } = useLogs() || {};
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [geojson, setGeojson] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);

    const currentBoundary = boundaries.find(b => b.id === selectedId) || null;

    useEffect(() => {
        if (!selectedId) {
            setGeojson(null);
            return;
        }

        setLoading(true);
        addLog?.("Fetching Boundary", "info", `Loading data for ${selectedId}`);

        // Assuming 'ward' for the demo, but this can be dynamic later
        boundaryService.getBoundaryGeoJSON('ward', selectedId)
            .then(data => {
                setGeojson(data);
                setLoading(false);
                addLog?.("Boundary Loaded", "success", `Displaying geometry for ${selectedId}`);
            })
            .catch(err => {
                console.error("Failed to load geojson:", err);
                addLog?.("Load Error", "error", err.message);
                setGeojson(null);
                setLoading(false);
            });
    }, [selectedId, addLog]);

    return {
        selectedId,
        setSelectedId,
        geojson,
        loading,
        currentBoundary,
        allBoundaries: boundaries
    };
}
