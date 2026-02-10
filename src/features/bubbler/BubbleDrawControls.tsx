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
        <div style={{ width: '100%' }}>
            <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 600, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>
                    <span>Radius</span>
                    <span style={{ color: '#0f172a' }}>{radiusKm} KM</span>
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
                        cursor: 'pointer',
                        accentColor: '#0f172a'
                    }}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <button
                    onClick={() => setType('inclusion')}
                    style={{
                        padding: '6px',
                        fontSize: '10px',
                        background: type === 'inclusion' ? '#22c55e' : '#fff',
                        color: type === 'inclusion' ? 'white' : '#64748b',
                        border: '1px solid',
                        borderColor: type === 'inclusion' ? '#16a34a' : '#e2e8f0',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: type === 'inclusion' ? 600 : 500,
                        transition: 'all 0.2s'
                    }}
                >
                    INCLUSION
                </button>
                <button
                    onClick={() => setType('exclusion')}
                    style={{
                        padding: '6px',
                        fontSize: '10px',
                        background: type === 'exclusion' ? '#ef4444' : '#fff',
                        color: type === 'exclusion' ? 'white' : '#64748b',
                        border: '1px solid',
                        borderColor: type === 'exclusion' ? '#dc2626' : '#e2e8f0',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: type === 'exclusion' ? 600 : 500,
                        transition: 'all 0.2s'
                    }}
                >
                    EXCLUSION
                </button>
            </div>
        </div>
    );
}
