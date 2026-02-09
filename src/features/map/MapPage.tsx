import React, { useEffect } from "react";
import { MapDisplay } from "./MapDisplay";
import { defaultMapConfig } from "@/lib/config";
import { LogConsole } from "@/components/LogConsole";
import { useLogs } from "@/context/logContext";

export default function MapPage() {
    const logContext = useLogs();
    const { addLog } = logContext || {};

    const hasLogRun = React.useRef(false);

    useEffect(() => {
        if (hasLogRun.current) return;

        if (import.meta.env.VITE_PROTOMAPS_API_KEY) {
            addLog?.("Environment Loaded", "success", "Protomaps API key found");
        } else {
            addLog?.("Environment Warning", "warning", "Protomaps API key missing");
        }

        hasLogRun.current = true;
    }, [addLog]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* The Map Layer */}
            <MapDisplay mapConfig={defaultMapConfig} />

            {/* The Floating Log Console (Dev Only) */}
            {import.meta.env.DEV && <LogConsole />}
        </div>
    );
}
