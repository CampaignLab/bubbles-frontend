import { useLogs } from '@/context/logContext';

export function LogConsole() {
    const logContext = useLogs();
    const { logs, isOpen, toggleLogs } = logContext || {};

    return (
        <>
            {/* LOG TOGGLE BUTTON */}
            <button
                onClick={toggleLogs}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    zIndex: 2000,
                    padding: '10px',
                    background: 'white',
                    border: '1px solid #000',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '13px'
                }}
            >
                {isOpen ? 'CLOSE LOGS' : `SHOW LOGS (${logs?.length || 0})`}
            </button>

            {/* LOG OVERLAY BOX */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '70px',
                    right: '20px',
                    width: '350px',
                    maxHeight: '80vh',
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #000',
                    overflowY: 'auto',
                    zIndex: 2000,
                    padding: '15px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}>
                    <div style={{ borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '10px', fontWeight: 'bold' }}>
                        SYSTEM_CONSOLE_v1.0
                    </div>
                    {logs?.map((log, i) => (
                        <div key={i} style={{
                            marginBottom: '10px',
                            paddingBottom: '10px',
                            borderBottom: '1px solid #eee'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#666' }}>[{log.timestamp.toLocaleTimeString()}]</span>
                                <span style={{
                                    fontWeight: 'bold',
                                    color: log.type === 'error' ? 'red' : log.type === 'success' ? 'green' : 'blue'
                                }}>
                                    {log.title.toUpperCase()}
                                </span>
                            </div>

                            {log.data && log.data.filter(Boolean).length > 0 && (
                                <pre style={{
                                    marginTop: '5px',
                                    background: '#f4f4f4',
                                    padding: '5px',
                                    borderRadius: '3px',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all'
                                }}>
                                    {log.data.map((d, di) => (
                                        <div key={di}>{typeof d === 'object' ? JSON.stringify(d, null, 2) : String(d)}</div>
                                    ))}
                                </pre>
                            )}
                        </div>
                    ))}
                    {logs?.length === 0 && <div style={{ color: '#999' }}>No events recorded.</div>}
                </div>
            )}
        </>
    );
}
