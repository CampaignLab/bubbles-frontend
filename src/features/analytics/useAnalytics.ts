import { useState, useCallback } from "react";
import { useLogs } from "@/context/logContext";

/**
 * Hook to manage dummy analytics state and "cloud function" triggers.
 */
export function useAnalytics() {
    const { addLog } = useLogs() || {};
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<any | null>(null);

    const runAnalytics = useCallback(async (boundaryId: string | null, customBubbles: any[] = []) => {
        if (!boundaryId && customBubbles.length === 0) {
            addLog?.("Analytics skipped", "warning", "No context to analyze (Select boundary or draw bubbles)");
            return;
        }

        setIsRunning(true);
        setResult(null);

        const mode = customBubbles.length > 0 ? "Manual Drawing" : "Admin Boundary";
        addLog?.("Pipeline Triggered", "info", { mode, target: boundaryId });

        // Simulating cloud processing
        await new Promise(resolve => setTimeout(resolve, 1500));

        let finalBubbles = [];
        let csv = "";

        if (customBubbles.length > 0) {
            // Use drawn bubbles
            finalBubbles = customBubbles;
            csv = "Type,Longitude,Latitude,RadiusKM\n" +
                customBubbles.map(b => `${b.type},${b.lng},${b.lat},${b.radiusKm}`).join("\n");
        } else {
            // Generate sample demo bubbles for the selected ward/const
            const lat = 51.5; // Mock center
            const lng = -0.1;
            finalBubbles = [
                { type: "inclusion", lng: lng + 0.01, lat: lat + 0.01, radiusKm: 1 },
                { type: "exclusion", lng: lng - 0.01, lat: lat - 0.01, radiusKm: 1 }
            ];
            csv = "Type,Longitude,Latitude,RadiusKM\n" +
                finalBubbles.map(b => `${b.type},${b.lng},${b.lat},${b.radiusKm}`).join("\n");
        }

        const resultPayload = {
            boundaryId,
            platform_ready: true,
            bubbles: finalBubbles,
            csv_preview: csv
        };

        setResult(resultPayload);
        setIsRunning(false);
        addLog?.("Analytics Complete", "success", { circles: finalBubbles.length });
    }, [addLog]);

    return {
        isRunning,
        result,
        runAnalytics
    };
}
