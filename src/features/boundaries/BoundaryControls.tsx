import { useState } from 'react';
import { boundaries } from '@/lib/data';
import { BoundaryItem } from './BoundaryItem';

interface BoundaryControlProps {
    selectedBoundaryId: string | null;
    onSelect: (id: string) => void;
}

export function BoundaryControl({ selectedBoundaryId, onSelect }: BoundaryControlProps) {
    const [mode, setMode] = useState<'Administrative' | 'Bubbles'>('Administrative');
    const [subType, setSubType] = useState<'Constituency' | 'Ward'>('Constituency');

    const selectedBoundary = boundaries.find(b => b.id === selectedBoundaryId);

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
                            onClick={() => setMode(t as any)}
                            style={{
                                flex: 1,
                                padding: '6px',
                                fontSize: '11px',
                                background: t === mode ? '#000' : '#eee',
                                color: t === mode ? '#fff' : '#000',
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
            {mode === 'Administrative' && (
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>BOUNDARY TYPE</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {['Constituency', 'Ward'].map(t => (
                            <button
                                key={t}
                                onClick={() => setSubType(t as any)}
                                style={{
                                    flex: 1,
                                    padding: '6px',
                                    fontSize: '11px',
                                    background: t === subType ? '#000' : '#eee',
                                    color: t === subType ? '#fff' : '#000',
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
            )}

            {mode === 'Bubbles' && (
                <div style={{
                    padding: '12px',
                    background: '#fff9db',
                    borderRadius: '4px',
                    border: '1px solid #fcc419',
                    fontSize: '12px',
                    marginBottom: '20px'
                }}>
                    <strong>Bubble Mode:</strong> Click on the map to place inclusion/exclusion circles. (In development)
                </div>
            )}

            <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>AVAILABLE {subType.toUpperCase()}S</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {boundaries.map((b) => (
                    <BoundaryItem
                        key={b.id}
                        name={b.name}
                        isSelected={selectedBoundaryId === b.id}
                        onClick={() => onSelect(b.id)}
                    />
                ))}
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
