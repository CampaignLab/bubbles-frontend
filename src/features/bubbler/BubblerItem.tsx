import { Trash2, Edit3 } from 'lucide-react';

interface BubblerItemProps {
    name: string;
    isSelected: boolean;
    onClick: () => void;
    onDelete: (e: React.MouseEvent) => void;
    onRename: (e: React.MouseEvent) => void;
    showRename?: boolean;
}

export function BubblerItem({ name, isSelected, onClick, onDelete, onRename, showRename = true }: BubblerItemProps) {
    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px',
                background: isSelected ? '#f1f5f9' : 'white',
                border: '1px solid',
                borderColor: isSelected ? '#3b82f6' : '#e2e8f0',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '13px',
                boxShadow: isSelected ? '0 2px 4px rgba(59, 130, 246, 0.1)' : 'none'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isSelected ? '#3b82f6' : '#94a3b8'
                }} />
                <strong style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: isSelected ? '#1e293b' : '#475569'
                }}>
                    {name}
                </strong>
            </div>

            <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                {showRename && (
                    <button
                        onClick={onRename}
                        title="Rename session"
                        style={{
                            padding: '4px',
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        <Edit3 size={14} />
                    </button>
                )}
                <button
                    onClick={onDelete}
                    title="Delete session"
                    style={{
                        padding: '4px',
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}
