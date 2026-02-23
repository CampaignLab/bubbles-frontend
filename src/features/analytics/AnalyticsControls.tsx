import { useState } from "react";
import { useAnalytics } from "./useAnalytics";
import { PlatformCredentials } from "./PlatformCredentials";
import { useLogs } from "@/context/logContext";

interface AnalyticsControlsProps {
    activeBoundaryId: string | null;
    bubbles: any[];
    boundaryType?: 'ward' | 'constituency'; // Added
    onGenerated?: (csv: string, id: string) => void; // Added
}

export function AnalyticsControls({
    activeBoundaryId,
    bubbles,
    boundaryType = 'ward',
    onGenerated
}: AnalyticsControlsProps) {
    const { isRunning, result, runAnalytics } = useAnalytics();
    const { addLog } = useLogs() || {};
    const [isUploading, setIsUploading] = useState(false);

    const [genError, setGenError] = useState(false);

    const handleUpload = async (platform: string) => {
        setIsUploading(true);
        addLog?.(`Uploading to ${platform}`, "info", { boundary: activeBoundaryId, points: result?.bubbles.length });

        // Simulating SDK Upload
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsUploading(false);
        addLog?.(`Upload Successful`, "success", `Audience custom-list created on ${platform}`);
    };

    const copyToClipboard = () => {
        if (!result?.csv_preview) return;
        navigator.clipboard.writeText(result.csv_preview);
        addLog?.("CSV Copied", "success", "Data copied to clipboard");
    };

    const downloadCSV = () => {
        if (!result?.csv_preview) return;
        const blob = new Blob([result.csv_preview], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `audience_${activeBoundaryId || 'export'}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        addLog?.("CSV Downloaded", "success", "File download triggered");
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
                    onClick={async () => {
                        setGenError(false);
                        if (!activeBoundaryId && bubbles.length === 0) {
                            addLog?.("Selection Required", "warning", "Please select a boundary or draw circles first.");
                            return;
                        }
                        const res = await runAnalytics(activeBoundaryId, bubbles, boundaryType);
                        if (res?.csv_preview && onGenerated) {
                            onGenerated(res.csv_preview, activeBoundaryId || 'custom-session');
                        } else if (!res) {
                            setGenError(true);
                            setTimeout(() => setGenError(false), 2000);
                            addLog?.("Generation Failed", "error", "Could not retrieve audience data for this boundary.");
                        }
                    }}
                    disabled={isRunning}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: isRunning ? '#ccc' : (genError ? '#dc2626' : '#2563eb'),
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        transition: 'background 0.2s'
                    }}
                >
                    {isRunning ? 'CALCULATING BUBBLES...' : (genError ? 'DATA NOT FOUND (404)' : 'GENERATE AUDIENCE DATA')}
                </button>
                {!activeBoundaryId && bubbles.length === 0 && (
                    <div style={{ fontSize: '10px', color: '#dc2626', marginTop: '6px', fontWeight: 600 }}>
                        ⚠ Select a boundary or draw circles on the map.
                    </div>
                )}
            </div>

            {/* STEP 2: RESULTS PREVIEW */}
            {result && (
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ fontSize: '10px', color: '#888' }}>STEP 2: CSV PREVIEW</div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={copyToClipboard} style={{ fontSize: '9px', padding: '2px 6px', background: '#eee', border: '1px solid #ccc', borderRadius: '2px', cursor: 'pointer' }}>COPY</button>
                            <button onClick={downloadCSV} style={{ fontSize: '9px', padding: '2px 6px', background: '#eee', border: '1px solid #ccc', borderRadius: '2px', cursor: 'pointer' }}>DOWNLOAD</button>
                        </div>
                    </div>
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
                    <PlatformCredentials platform="Google" disabled={true} onSave={() => { }} />

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
                            disabled={true}
                            style={{
                                padding: '10px',
                                background: '#ccc',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'not-allowed'
                            }}
                        >
                            GOOGLE (WIP)
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
