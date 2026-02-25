import { useState, useEffect } from "react";
import { useLogs } from "@/context/logContext";
import { useAuth } from "@/hooks/useAuth";
import { boundaryService } from "@/services/boundaryService";

/**
 * Domain-specific hook for managing boundary data and selection.
 */
export function useBoundaries(type: 'ward' | 'constituency' = 'constituency') {
    const { addLog } = useLogs() || {};
    const { user } = useAuth();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [geojson, setGeojson] = useState<any | null>(null);
    const [geojsonId, setGeojsonId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [availableBoundaries, setAvailableBoundaries] = useState<any[]>([]);

    useEffect(() => {
        setAvailableBoundaries([]);
        setSelectedId(null);
        setGeojson(null);

        // Security: Spoofed users (devBypass) should not see gated data from the remote bucket.
        // If the environment is pointing to Supabase, we block the fetch entirely.
        // If the environment is pointing to Local Mock Data, we allow it for testing.
        if (user && 'devBypass' in user) {
            const isSupabase = import.meta.env.VITE_API_URL?.includes('supabase.co') || import.meta.env.VITE_SUPABASE_URL;
            if (isSupabase) {
                console.warn('[Boundaries] Spoofed user detected. Remote S3 Access restricted.');
                return;
            }
            console.log('[Boundaries] Using simulated session. Data source: Local');
        }

        boundaryService.listBoundaries(type).then(setAvailableBoundaries);
    }, [type, user]);

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
