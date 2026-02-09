import { useState } from "react";

interface PlatformCredentialsProps {
    platform: 'Meta' | 'Google';
    onSave: (key: string) => void;
}

export function PlatformCredentials({ platform, onSave }: PlatformCredentialsProps) {
    const [key, setKey] = useState('');

    return (
        <div style={{
            padding: '12px',
            background: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #eee',
            marginBottom: '10px'
        }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', color: '#555' }}>
                {platform} API ACCESS
            </div>
            <input
                type="password"
                placeholder={`Enter ${platform} Access Token...`}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '3px',
                    marginBottom: '8px',
                    boxSizing: 'border-box'
                }}
            />
            <button
                onClick={() => onSave(key)}
                style={{
                    fontSize: '10px',
                    padding: '4px 8px',
                    background: '#000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '2px',
                    cursor: 'pointer'
                }}
            >
                UPDATE TOKEN
            </button>
        </div>
    );
}
