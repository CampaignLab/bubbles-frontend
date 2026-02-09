interface BoundaryItemProps {
    name: string;
    isSelected: boolean;
    onClick: () => void;
}

export function BoundaryItem({ name, isSelected, onClick }: BoundaryItemProps) {
    return (
        <button
            onClick={onClick}
            style={{
                textAlign: 'left',
                padding: '10px',
                background: isSelected ? '#f0f0f0' : 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background 0.2s',
                fontSize: '13px',
                outline: isSelected ? '2px solid #000' : 'none'
            }}
        >
            <strong>{name}</strong>
        </button>
    );
}
