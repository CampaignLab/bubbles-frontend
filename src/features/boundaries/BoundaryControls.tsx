import { boundaries } from '@/lib/data';

interface BoundaryControlProps {
    selectedBoundaryId: string | null;
    onSelect: (id: string) => void;
}

export function BoundaryControl({ selectedBoundaryId, onSelect }: BoundaryControlProps) {
    const selectedBoundary = boundaries.find(b => b.id === selectedBoundaryId);

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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {boundaries.map((b) => (
                    <button
                        key={b.id}
                        onClick={() => onSelect(b.id)}
                        style={{
                            textAlign: 'left',
                            padding: '10px',
                            background: selectedBoundaryId === b.id ? '#f0f0f0' : 'white',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            fontSize: '13px'
                        }}
                    >
                        <strong>{b.name}</strong>
                    </button>
                ))}
            </div>

            {selectedBoundary && (
                <div style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid #eee'
                }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>
                        Description
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.4' }}>
                        {selectedBoundary.description}
                    </p>
                </div>
            )}
        </div>
    );
}
