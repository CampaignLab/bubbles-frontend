import { BoundaryItem } from './BoundaryItem';
import { BubblerItem } from '../bubbler/BubblerItem';
import type { Boundary } from '@/lib/data';

interface BoundaryControlProps {
    selectedBoundaryId: string | null;
    activeSessionId: string | null;
    activeSessionName: string | null;
    onSelect: (id: string | null) => void;
    boundaryType: 'ward' | 'constituency';
    onTypeChange: (type: 'ward' | 'constituency') => void;
    allBoundaries: Boundary[];
    selectionMode: 'Administrative' | 'Bubbles';
    onModeChange: (mode: 'Administrative' | 'Bubbles') => void;
    onExportCSV: () => void;
    onSaveBubbles: (name: string) => void;
    onDeleteSession: (id: string) => void;
}

export function BoundaryControl({
    selectedBoundaryId,
    activeSessionId,
    activeSessionName,
    onSelect,
    boundaryType,
    onTypeChange,
    allBoundaries,
    selectionMode,
    onModeChange,
    onExportCSV,
    onSaveBubbles,
    onDeleteSession
}: BoundaryControlProps) {
    const selectedBoundary = allBoundaries.find(b => b.id === (selectionMode === 'Administrative' ? selectedBoundaryId : activeSessionId));

    // Dummy estimates (would eventually be linked to Meta API)
    const estimates = selectionMode === 'Administrative' && selectedBoundary ? {
        population: Math.floor(Math.random() * 500000) + 100000,
        targetUsers: Math.floor(Math.random() * 50000) + 5000
    } : null;

    const handleRename = (id: string) => {
        const newName = prompt("Rename Session:", activeSessionName || id);
        if (newName && newName !== activeSessionName) {
            onSaveBubbles(newName);
        }
    };

    return (
        <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            width: '280px',
            background: 'rgba(255, 255, 255, 0.98)',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            zIndex: 1000,
            padding: '20px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            fontFamily: 'Inter, system-ui, sans-serif',
            color: '#1e293b'
        }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.025em' }}>
                Map Controls
            </h3>

            {/* Row 1: MODE */}
            <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    SELECTION MODE
                </div>
                <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                    {['Administrative', 'Bubbles'].map(t => (
                        <button
                            key={t}
                            onClick={() => {
                                onModeChange(t as any);
                            }}
                            style={{
                                flex: 1,
                                padding: '8px 12px',
                                fontSize: '12px',
                                fontWeight: t === selectionMode ? 600 : 500,
                                background: t === selectionMode ? '#fff' : 'transparent',
                                color: t === selectionMode ? '#0f172a' : '#64748b',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                boxShadow: t === selectionMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
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
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        BOUNDARY TYPE
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
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
                                    padding: '8px',
                                    fontSize: '11px',
                                    fontWeight: t.value === boundaryType ? 600 : 500,
                                    background: t.value === boundaryType ? '#0f172a' : '#fff',
                                    color: t.value === boundaryType ? '#fff' : '#64748b',
                                    border: '1px solid',
                                    borderColor: t.value === boundaryType ? '#0f172a' : '#e2e8f0',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
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
                        background: '#fef9c3',
                        borderRadius: '8px',
                        border: '1px solid #fde047',
                        fontSize: '11px',
                        color: '#854d0e',
                        lineHeight: '1.5',
                        marginBottom: '16px'
                    }}>
                        <strong>Bubble Mode:</strong> <strong>CTRL + CLICK</strong> on map to place inclusion points (Min 1km radius).
                    </div>
                </div>
            )}

            {/* SECTION: SELECTED BOUNDARY / SESSION */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    SELECTED {selectionMode === 'Bubbles' ? 'SESSION' : boundaryType.toUpperCase()}
                </div>
                {(selectionMode === 'Administrative' && selectedBoundaryId) || (selectionMode === 'Bubbles' && activeSessionId) ? (
                    selectionMode === 'Bubbles' ? (
                        <BubblerItem
                            name={activeSessionName || activeSessionId || 'Draft Session'}
                            isSelected={true}
                            onClick={() => { }}
                            onDelete={(e) => { e.stopPropagation(); onDeleteSession(activeSessionId!); }}
                            onRename={(e) => { e.stopPropagation(); handleRename(activeSessionId!); }}
                        />
                    ) : (
                        <BoundaryItem
                            name={allBoundaries.find(b => b.id === selectedBoundaryId)?.name || 'Unknown'}
                            isSelected={true}
                            onClick={() => { }}
                        />
                    )
                ) : (
                    <div style={{
                        padding: '12px',
                        border: '1px dashed #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#94a3b8',
                        textAlign: 'center',
                        background: '#f8fafc'
                    }}>
                        None Selected
                    </div>
                )}
            </div>

            {/* Bubber Actions Group */}
            {selectionMode === 'Bubbles' && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    <button
                        onClick={onExportCSV}
                        style={{
                            flex: 1,
                            padding: '10px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                    >
                        Export CSV
                    </button>
                    <button
                        onClick={() => {
                            const name = prompt("Session Name:", activeSessionName || "");
                            if (name) onSaveBubbles(name);
                        }}
                        style={{
                            flex: 1,
                            padding: '10px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                    >
                        Save
                    </button>
                </div>
            )}

            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span>{selectionMode === 'Bubbles' ? 'PAST SESSIONS' : `AVAILABLE ${boundaryType.toUpperCase()}S`}</span>
                <span style={{ color: '#94a3b8', fontWeight: 400 }}>{allBoundaries.length} total</span>
            </div>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '16px',
                maxHeight: '200px',
                overflowY: 'auto',
                paddingRight: '6px',
                padding: '4px'
            }}>
                {allBoundaries.length > 0 ? (
                    allBoundaries.map((b) => (
                        selectionMode === 'Bubbles' ? (
                            <BubblerItem
                                key={b.id}
                                name={b.name}
                                isSelected={activeSessionId === b.id}
                                onClick={() => onSelect(b.id)}
                                onDelete={(e) => { e.stopPropagation(); onDeleteSession(b.id); }}
                                onRename={(e) => { e.stopPropagation(); handleRename(b.id); }}
                            />
                        ) : (
                            <BoundaryItem
                                key={b.id}
                                name={b.name}
                                isSelected={selectedBoundaryId === b.id}
                                onClick={() => onSelect(b.id)}
                            />
                        )
                    ))
                ) : (
                    <div style={{
                        padding: '24px 12px',
                        background: '#f8fafc',
                        border: '1px dashed #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#94a3b8',
                        textAlign: 'center',
                        fontStyle: 'italic'
                    }}>
                        {selectionMode === 'Bubbles'
                            ? (
                                <div>
                                    No custom sessions stored.<br />
                                    <strong>CTRL + CLICK</strong> map to begin.
                                </div>
                            )
                            : `No data for "${boundaryType}" type.`}
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
