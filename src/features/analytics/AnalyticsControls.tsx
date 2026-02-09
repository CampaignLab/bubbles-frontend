import { useState } from "react";
import { useAnalytics } from "./useAnalytics";
import { PlatformCredentials } from "./PlatformCredentials";
import { useLogs } from "@/context/logContext";

interface AnalyticsControlsProps {
    activeBoundaryId: string | null;
}

export function AnalyticsControls({ activeBoundaryId }: AnalyticsControlsProps) {
    const { isRunning, result, runAnalytics } = useAnalytics();
    const { addLog } = useLogs() || {};
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async (platform: string) => {
        setIsUploading(true);
        addLog?.(`Uploading to ${platform}`, "info", { boundary: activeBoundaryId, points: result?.bubbles.length });

        // Simulating SDK Upload
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsUploading(false);
        addLog?.(`Upload Successful`, "success", `Audience custom-list created on ${platform}`);
    };

    return (
        <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '320px',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #000',
            borderRadius: '4px',
            zIndex: 1000,
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontFamily: 'sans-serif',
            maxHeight: 'calc(100vh - 40px)',
            overflowY: 'auto'
        }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>
                Audience Pipeline
            </h3>

            {/* STEP 1: GENERATE DATA */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>STEP 1: ANALYTICS</div>
                <button
                    onClick={() => runAnalytics(activeBoundaryId)}
                    disabled={isRunning || !activeBoundaryId}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: (isRunning || !activeBoundaryId) ? '#ccc' : '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: (isRunning || !activeBoundaryId) ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    {isRunning ? 'CALCULATING BUBBLES...' : 'GENERATE AUDIENCE DATA'}
                </button>
                {!activeBoundaryId && <div style={{ fontSize: '10px', color: 'red', marginTop: '4px' }}>Please select a boundary on the left first.</div>}
            </div>

            {/* STEP 2: RESULTS PREVIEW */}
            {result && (
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>STEP 2: CSV PREVIEW</div>
                    <div style={{
                        background: '#1e293b',
                        color: '#34d399',
                        padding: '10px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre',
                        overflowX: 'auto',
                        border: '1px solid #000'
                    }}>
                        {result.csv_preview}
                    </div>
                </div>
            )}

            {/* STEP 3: PLATFORM ACCESS & UPLOAD */}
            {result && (
                <div>
                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '8px' }}>STEP 3: PLATFORM SYNC</div>

                    <PlatformCredentials platform="Meta" onSave={() => addLog?.("Meta Key Updated", "success")} />
                    <PlatformCredentials platform="Google" onSave={() => addLog?.("Google Key Updated", "success")} />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                        <button
                            onClick={() => handleUpload('Meta')}
                            disabled={isUploading}
                            style={{
                                padding: '10px',
                                background: '#1877F2',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: isUploading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            UPLOAD TO META
                        </button>
                        <button
                            onClick={() => handleUpload('Google')}
                            disabled={isUploading}
                            style={{
                                padding: '10px',
                                background: '#4285F4',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: isUploading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            UPLOAD TO GOOGLE
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
