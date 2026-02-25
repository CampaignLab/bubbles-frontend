import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
    onPageChange: (page: string) => void;
    activePage: string;
}

export function Sidebar({ onPageChange, activePage }: SidebarProps) {
    const { user, signOut } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside style={{
            width: isCollapsed ? '80px' : '260px',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 2000
        }}>
            {/* Header / Logo Section - Now the trigger */}
            <div
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{
                    padding: '20px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    transition: 'padding 0.3s'
                }}
            >
                {/* Logo Placeholder - Team Bubbles */}
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)'
                }}>
                    B
                </div>
                {!isCollapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{
                            fontWeight: '800',
                            fontSize: '15px',
                            letterSpacing: '0.05em',
                            color: '#1e293b',
                            whiteSpace: 'nowrap',
                            lineHeight: '1.1'
                        }}>
                            TEAM BUBBLES
                        </span>
                        <span style={{
                            fontSize: '10px',
                            fontWeight: '600',
                            color: '#94a3b8',
                            letterSpacing: '0.02em'
                        }}>
                            CAMPAIGN ORGANIZER
                        </span>
                    </div>
                )}
            </div>

            {/* Navigation Links - Centered Icons */}
            <nav style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    <SidebarItem
                        label="Campaign Dashboard"
                        icon="📈"
                        isActive={activePage === 'dashboard'}
                        isCollapsed={isCollapsed}
                        onClick={() => onPageChange('dashboard')}
                    />
                    <SidebarItem
                        label="Community Map"
                        icon="🤝"
                        isActive={activePage === 'boundaries'}
                        isCollapsed={isCollapsed}
                        onClick={() => onPageChange('boundaries')}
                    />
                </div>
            </nav>

            {/* Profile / Footer Section */}
            <div style={{ padding: '16px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    marginBottom: isCollapsed ? '0' : '16px'
                }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#334155',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        flexShrink: 0,
                        border: '2px solid #fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        {user?.email?.substring(0, 2).toUpperCase() || 'JD'}
                    </div>
                    {!isCollapsed && (
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                            <div style={{ fontSize: '13px', fontVariationSettings: '"wght" 600', whiteSpace: 'nowrap' }}>
                                {user?.user_metadata?.name || user?.email || 'John Doe'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>
                                {user?.app_metadata?.role || 'Organizer'}
                            </div>
                        </div>
                    )}
                </div>

                {/* Log Out Action */}
                {!isCollapsed && (
                    <button
                        onClick={() => void signOut()}
                        style={{
                            width: '100%',
                            padding: '8px',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
                    >
                        LOG OUT
                    </button>
                )}

                {/* Powered By Section */}
                {!isCollapsed && (
                    <div style={{
                        marginTop: '16px',
                        paddingTop: '12px',
                        borderTop: '1px dashed #e2e8f0',
                        fontSize: '10px',
                        color: '#94a3b8',
                        textAlign: 'center',
                        letterSpacing: '0.05em'
                    }}>
                        POWERED BY <span style={{ color: '#64748b', fontWeight: 'bold' }}>CAMPAIGN LAB</span>
                    </div>
                )}
            </div>
        </aside>
    );
}

function SidebarItem({ label, icon, isActive, isCollapsed, onClick }: { label: string, icon: string, isActive: boolean, isCollapsed: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            title={isCollapsed ? label : ''}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: '12px',
                padding: '12px',
                width: '100%',
                background: isActive ? '#f1f5f9' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                color: isActive ? '#4f46e5' : '#64748b'
            }}
        >
            <span style={{ fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
            {!isCollapsed && (
                <span style={{
                    fontSize: '14px',
                    fontWeight: isActive ? '600' : '500',
                    whiteSpace: 'nowrap'
                }}>
                    {label}
                </span>
            )}
        </button>
    );
}
