import { BoundaryItem } from './BoundaryItem';
import type { Boundary } from '@/lib/data';

interface BoundaryControlProps {
    selectedBoundaryId: string | null;
    onSelect: (id: string | null) => void;
    boundaryType: 'ward' | 'constituency';
    onTypeChange: (type: 'ward' | 'constituency') => void;
    allBoundaries: Boundary[];
    selectionMode: 'Administrative' | 'Bubbles';
    onModeChange: (mode: 'Administrative' | 'Bubbles') => void;
    onExportCSV: () => void;
    onSaveBubbles: () => void;
}

export function BoundaryControl({
    selectedBoundaryId,
    onSelect,
    boundaryType,
    onTypeChange,
    allBoundaries,
    selectionMode,
    onModeChange,
    onExportCSV,
    onSaveBubbles
}: BoundaryControlProps) {
    const selectedBoundary = allBoundaries.find(b => b.id === selectedBoundaryId);

    // Dummy estimates (would eventually be linked to Meta API)
    const estimates = selectedBoundary ? {
        population: Math.floor(Math.random() * 500000) + 100000,
        targetUsers: Math.floor(Math.random() * 50000) + 5000
    } : null;

    return (
        <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            width: '280px',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #000',
            borderRadius: '4px',
            zIndex: 1000,
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontFamily: 'sans-serif'
        }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>
                Boundary Selection
            </h3>

            {/* Row 1: MODE */}
            <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>SELECTION MODE</div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {['Administrative', 'Bubbles'].map(t => (
                        <button
                            key={t}
                            onClick={() => {
                                onModeChange(t as any);
                                if (t === 'Bubbles') onSelect(null);
                            }}
                            style={{
                                flex: 1,
                                padding: '6px',
                                fontSize: '11px',
                                background: t === selectionMode ? '#000' : '#eee',
                                color: t === selectionMode ? '#fff' : '#000',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Row 2: TYPE (Admin only) */}
            {selectionMode === 'Administrative' && (
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>BOUNDARY TYPE</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {[
                            { label: 'Constituency', value: 'constituency' },
                            { label: 'Ward', value: 'ward' }
                        ].map(t => (
                            <button
                                key={t.value}
                                onClick={() => {
                                    onTypeChange(t.value as any);
                                    onSelect(null);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '6px',
                                    fontSize: '11px',
                                    background: t.value === boundaryType ? '#000' : '#eee',
                                    color: t.value === boundaryType ? '#fff' : '#000',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {selectionMode === 'Bubbles' && (
                <div style={{ marginBottom: '20px' }}>
                    <div style={{
                        padding: '12px',
                        background: '#fff9db',
                        borderRadius: '4px',
                        border: '1px solid #fcc419',
                        fontSize: '11px',
                        lineHeight: '1.4',
                        marginBottom: '12px'
                    }}>
                        <strong>Bubble Mode:</strong> Click on the map to place inclusion points (Min 1km radius).
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                            onClick={onExportCSV}
                            style={{
                                flex: 1,
                                padding: '8px',
                                fontSize: '11px',
                                background: '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Export CSV
                        </button>
                        <button
                            onClick={onSaveBubbles}
                            style={{
                                flex: 1,
                                padding: '8px',
                                fontSize: '11px',
                                background: '#10b981',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Save Locally
                        </button>
                    </div>
                </div>
            )}

            <div style={{ fontSize: '10px', color: '#888', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{selectionMode === 'Bubbles' ? 'PAST BOUNDARIES' : `SELECT ${boundaryType.toUpperCase()}`}</span>
                <span>{allBoundaries.length} entries</span>
            </div>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '16px',
                maxHeight: '220px',
                overflowY: 'auto',
                paddingRight: '4px',
                border: '1px solid #eee',
                padding: '8px',
                borderRadius: '4px',
                background: '#fafafa'
            }}>
                {allBoundaries.length > 0 ? (
                    allBoundaries.map((b) => (
                        <BoundaryItem
                            key={b.id}
                            name={b.name}
                            isSelected={selectedBoundaryId === b.id}
                            onClick={() => onSelect(b.id)}
                        />
                    ))
                ) : (
                    <div style={{
                        fontSize: '11px',
                        color: '#94a3b8',
                        fontStyle: 'italic',
                        textAlign: 'center',
                        padding: '20px 10px',
                        background: '#fff',
                        border: '1px dashed #cbd5e1',
                        borderRadius: '4px'
                    }}>
                        {selectionMode === 'Bubbles'
                            ? (
                                <div>
                                    No previous bubble sessions found.<br />
                                    <strong>CTRL + CLICK</strong> on map to place new ones.
                                </div>
                            )
                            : `No boundary data found for type "${boundaryType}". Check back soon!`}
                    </div>
                )}
            </div>

            {/* PRE-ANALYTICS METRICS */}
            {selectedBoundary && estimates && (
                <div style={{
                    paddingTop: '16px',
                    borderTop: '1px solid #eee'
                }}>
                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '8px', textTransform: 'uppercase' }}>Estimated Metrics</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div style={{ background: '#f8f9fa', padding: '8px', borderRadius: '4px' }}>
                            <div style={{ fontSize: '10px', color: '#666' }}>Population</div>
                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{estimates.population.toLocaleString()}</div>
                        </div>
                        <div style={{ background: '#f8f9fa', padding: '8px', borderRadius: '4px' }}>
                            <div style={{ fontSize: '10px', color: '#666' }}>Target Users</div>
                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{estimates.targetUsers.toLocaleString()}</div>
                        </div>
                    </div>
                    <p style={{ marginTop: '12px', fontSize: '12px', color: '#666', lineHeight: '1.4' }}>
                        {selectedBoundary.description}
                    </p>
                </div>
            )}
        </div>
    );
}
