import { useState, useCallback } from "react";
import { useLogs } from "@/context/logContext";
import { boundaryService } from "@/services/boundaryService";

/**
 * Hook to manage dummy analytics state and "cloud function" triggers.
 */
export function useAnalytics() {
    const { addLog } = useLogs() || {};
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<any | null>(null);

    const runAnalytics = useCallback(async (boundaryId: string | null, customBubbles: any[] = [], type: 'ward' | 'constituency' = 'ward') => {
        if (!boundaryId && customBubbles.length === 0) {
            addLog?.("Analytics skipped", "warning", "No context to analyze (Select boundary or draw bubbles)");
            return;
        }

        setIsRunning(true);
        setResult(null);

        const mode = customBubbles.length > 0 ? "Manual Drawing" : "Admin Boundary";
        addLog?.("Pipeline Triggered", "info", { mode, target: boundaryId });

        try {
            // Simulating cloud processing delay
            await new Promise(resolve => setTimeout(resolve, 800));

            let finalBubbles = [];
            let csv = "";

            if (customBubbles.length > 0) {
                // Use drawn bubbles
                finalBubbles = customBubbles;
                csv = "Type,Longitude,Latitude,RadiusKM\n" +
                    customBubbles.map(b => `${b.type},${b.lng},${b.lat},${b.radiusKm}`).join("\n");
            } else if (boundaryId) {
                // Fetch pre-calculated CSV from API
                csv = await boundaryService.getAudienceCSV(type, boundaryId);

                // Temporary simplified parsing for preview bubbles
                const lines = csv.trim().split('\n');
                if (lines.length > 1) {
                    finalBubbles = lines.slice(1).map((line) => {
                        const parts = line.split(',');
                        if (parts.length < 3) return null;

                        let t: any = 'inclusion';
                        let latNum = NaN;
                        let lngNum = NaN;
                        let radNum = NaN;

                        if (parts[1].trim().startsWith('"(') || parts[1].trim().startsWith('(')) {
                            t = parts[0].trim().toLowerCase();
                            const coordPart = parts.slice(1, -1).join(',');
                            const matches = coordPart.match(/\(?([-+]?\d*\.?\d+)\s*,\s*([-+]?\d*\.?\d+)\)?/);
                            if (matches) {
                                latNum = parseFloat(matches[1]);
                                lngNum = parseFloat(matches[2]);
                            }
                            radNum = parseFloat(parts[parts.length - 1]);
                        } else {
                            const [typePart, lng, lat, r] = parts;
                            t = typePart.trim().toLowerCase();
                            lngNum = parseFloat(lng);
                            latNum = parseFloat(lat);
                            radNum = parseFloat(r);
                        }

                        if (isNaN(lngNum) || isNaN(latNum) || isNaN(radNum)) return null;
                        return { type: t, lng: lngNum, lat: latNum, radiusKm: radNum };
                    }).filter(b => b !== null);
                }
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
            return resultPayload;
        } catch (err: any) {
            setIsRunning(false);
            addLog?.("Analytics Failed", "error", err.message);
            return null;
        }
    }, [addLog]);

    return {
        isRunning,
        result,
        runAnalytics
    };
}
