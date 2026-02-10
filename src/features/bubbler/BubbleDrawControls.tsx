interface BubbleDrawControlsProps {
    radiusKm: number;
    setRadiusKm: (v: number) => void;
    type: 'inclusion' | 'exclusion';
    setType: (v: 'inclusion' | 'exclusion') => void;
    visible: boolean;
}

export function BubbleDrawControls({
    radiusKm,
    setRadiusKm,
    type,
    setType,
    visible
}: BubbleDrawControlsProps) {
    if (!visible) return null;

    return (
        <div style={{
            position: 'absolute',
            top: '20px',
            left: '340px', // Right next to the sidebar
            width: '240px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 1100,
            fontFamily: 'sans-serif'
        }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                (CTRL) DRAW SETTINGS
            </h4>

            <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                    <span>RADIUS:</span>
                    <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{radiusKm} KM</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="24"
                    step="1"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
                    style={{
                        width: '100%',
                        cursor: 'pointer'
                    }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                    <span>1km</span>
                    <span>24km</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                    onClick={() => setType('inclusion')}
                    style={{
                        padding: '8px',
                        fontSize: '11px',
                        background: type === 'inclusion' ? '#22c55e' : '#f8fafc',
                        color: type === 'inclusion' ? 'white' : '#64748b',
                        border: '1px solid',
                        borderColor: type === 'inclusion' ? '#16a34a' : '#e2e8f0',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: type === 'inclusion' ? 'bold' : 'normal'
                    }}
                >
                    INCLUSION
                </button>
                <button
                    onClick={() => setType('exclusion')}
                    style={{
                        padding: '8px',
                        fontSize: '11px',
                        background: type === 'exclusion' ? '#ef4444' : '#f8fafc',
                        color: type === 'exclusion' ? 'white' : '#64748b',
                        border: '1px solid',
                        borderColor: type === 'exclusion' ? '#dc2626' : '#e2e8f0',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: type === 'exclusion' ? 'bold' : 'normal'
                    }}
                >
                    EXCLUSION
                </button>
            </div>

            <div style={{ marginTop: '12px', fontSize: '10px', color: '#94a3b8', textAlign: 'center' }}>
                Left-Click to place bubble
            </div>
        </div>
    );
}
