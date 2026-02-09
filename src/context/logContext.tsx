
import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';
import { debounce } from "lodash";

export interface LogEntry {
    timestamp: Date;
    title: string;
    type: 'info' | 'success' | 'error' | 'warning' | 'event';
    data: (string | undefined)[];
    count: number;
}

interface LogContextType {
    logs: LogEntry[];
    isOpen: boolean;
    addLog: (title: string, type: LogEntry['type'], data?: any) => void;
    toggleLogs: () => void;
    debouncedLogViewport: (title: string, type: LogEntry['type'], data?: any) => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export function LogProvider({ children }: { children: React.ReactNode }) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const addLog = useCallback((title: string, type: LogEntry['type'], data?: any) => {
        setLogs(prevLogs => {
            const lastLog = prevLogs[0];
            if (lastLog && lastLog.title === title && lastLog.type === type) {
                const updatedLog: LogEntry = {
                    ...lastLog,
                    timestamp: new Date(),
                    count: lastLog.count + 1,
                    data: [data, ...lastLog.data] // Prepend new data
                };
                // Capping the stored data payloads to prevent memory issues with very frequent events
                if (updatedLog.data.length > 50) {
                    updatedLog.data = updatedLog.data.slice(0, 50);
                }
                return [updatedLog, ...prevLogs.slice(1)];
            } else {
                const newLog: LogEntry = {
                    timestamp: new Date(),
                    title,
                    type,
                    data: [data],
                    count: 1,
                };
                return [newLog, ...prevLogs];
            }
        });
    }, []);

    const debouncedLogViewport = useMemo(() => debounce((title: string, type: LogEntry['type'], data?: any) => {
        addLog(title, type, data);
    }, 500), [addLog]);

    const toggleLogs = () => {
        setIsOpen(prev => !prev);
    };

    const value = useMemo(() => ({
        logs,
        isOpen,
        addLog,
        toggleLogs,
        debouncedLogViewport
    }), [logs, isOpen, addLog, debouncedLogViewport]);

    return (
        <LogContext.Provider value={value}>
            {children}
        </LogContext.Provider>
    );
}

export function useLogs() {
    const context = useContext(LogContext);
    return context;
}