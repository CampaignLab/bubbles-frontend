import { useState, useCallback } from "react";
import { useLogs } from "@/context/logContext";

/**
 * Hook to manage dummy analytics state and "cloud function" triggers.
 */
export function useAnalytics() {
    const { addLog } = useLogs() || {};
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<any | null>(null);

    const runAnalytics = useCallback(async (boundaryId: string | null) => {
        if (!boundaryId) {
            addLog?.("Analytics skipped", "warning", "No boundary selected to analyze");
            return;
        }

        setIsRunning(true);
        setResult(null);
        addLog?.("Cloud Function Triggered", "info", {
            function: "runPopulationAnalytics",
            target: boundaryId
        });

        // Simulating cloud processing to generate audience "bubbles"
        await new Promise(resolve => setTimeout(resolve, 2000));

        const dummyBubbles = [
            {
                bubble_type: "inclusion",
                coordinates: `(${51.5498 + (Math.random() - 0.5) * 0.1}, ${-0.1891 + (Math.random() - 0.5) * 0.1}) +1km`,
                radius: 1
            },
            {
                bubble_type: "exclusion",
                coordinates: `(${51.5834 + (Math.random() - 0.5) * 0.1}, ${-0.1261 + (Math.random() - 0.5) * 0.1}) +1km`,
                radius: 1
            }
        ];

        const resultPayload = {
            boundaryId,
            platform_ready: true,
            bubbles: dummyBubbles,
            csv_preview: `bubble_type,coordinates,radius\n` +
                dummyBubbles.map(b => `${b.bubble_type},"${b.coordinates}",${b.radius}`).join('\n')
        };

        setResult(resultPayload);
        setIsRunning(false);
        addLog?.("Analytics Complete", "success", { bubblesGenerated: dummyBubbles.length });
    }, [addLog]);

    return {
        isRunning,
        result,
        runAnalytics
    };
}
