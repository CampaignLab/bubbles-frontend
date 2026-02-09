import { useState } from "react";

interface PlatformCredentialsProps {
    platform: 'Meta' | 'Google';
    onSave: (key: string) => void;
    disabled?: boolean;
}

export function PlatformCredentials({ platform, onSave, disabled }: PlatformCredentialsProps) {
    const [key, setKey] = useState('');

    return (
        <div style={{
            padding: '12px',
            background: disabled ? '#f1f3f5' : '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #eee',
            marginBottom: '10px',
            opacity: disabled ? 0.6 : 1,
            pointerEvents: disabled ? 'none' : 'auto'
        }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', color: '#555' }}>
                {platform} API ACCESS {disabled && '(WIP)'}
            </div>
            <input
                type="password"
                placeholder={disabled ? "Coming Soon..." : `Enter ${platform} Access Token...`}
                value={key}
                disabled={disabled}
                onChange={(e) => setKey(e.target.value)}
                style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '3px',
                    marginBottom: '8px',
                    boxSizing: 'border-box',
                    background: disabled ? '#e9ecef' : '#fff'
                }}
            />
            <button
                onClick={() => onSave(key)}
                disabled={disabled}
                style={{
                    fontSize: '10px',
                    padding: '4px 8px',
                    background: disabled ? '#adb5bd' : '#000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '2px',
                    cursor: disabled ? 'not-allowed' : 'pointer'
                }}
            >
                UPDATE TOKEN
            </button>
        </div>
    );
}
