import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function VerifyEmailPage() {
    const { user } = useAuth();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [errorMessage, setErrorMessage] = useState('');
    const [isButtonHovered, setIsButtonHovered] = useState(false);

    useEffect(() => {
        const hash = window.location.hash;
        if (!hash || !hash.includes('access_token=') || (!hash.includes('type=signup') && !hash.includes('type=invite') && !hash.includes('type=magiclink') && !hash.includes('type=recovery'))) {
            console.error('[Verify] Invalid verification request: missing tokens.');
            setStatus('error');
            setErrorMessage('Invalid verification link. Please use the link sent to your email.');
            // Clear the invalid hash so it doesn't linger
            window.history.replaceState(null, '', window.location.pathname);
            return;
        }

        // Wait for SIGNED_IN event
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                setStatus('success');
                window.history.replaceState(null, '', window.location.pathname);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Also fallback to checking if user is already populated
    useEffect(() => {
        if (user && status === 'verifying') {
            setStatus('success');
            window.history.replaceState(null, '', window.location.pathname);
        }
    }, [user, status]);

    const goBack = () => {
        window.history.replaceState(null, '', window.location.pathname);
        window.dispatchEvent(new Event('hashchange'));
    };


    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{ padding: '40px 32px' }}>

                    {/* Header/Logo mimicking the Sidebar */}
                    <div style={{ textAlign: 'center', marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '24px',
                            marginBottom: '16px',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                        }}>
                            B
                        </div>
                        <h1 style={{
                            fontSize: '22px',
                            fontWeight: '800',
                            letterSpacing: '0.05em',
                            color: '#1e293b',
                            margin: '0 0 8px 0',
                        }}>
                            EMAIL VERIFICATION
                        </h1>
                        <p style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#94a3b8',
                            letterSpacing: '0.02em',
                            margin: 0
                        }}>
                            CONFIRMING ACCESS
                        </p>
                    </div>

                    {status === 'verifying' && (
                        <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                border: '3px solid rgba(59, 130, 246, 0.2)',
                                borderTop: '3px solid #3b82f6',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 16px auto',
                            }} />
                            <style>{`
                                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                            `}</style>
                            Please wait...
                        </div>
                    )}

                    {status === 'success' && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                backgroundColor: '#d1fae5',
                                color: '#10b981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                margin: '0 auto 16px auto'
                            }}>✓</div>
                            <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Email Verified!</h3>
                            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
                                Your account is now fully active.
                            </p>
                            <button
                                onClick={goBack}
                                onMouseEnter={() => setIsButtonHovered(true)}
                                onMouseLeave={() => setIsButtonHovered(false)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: isButtonHovered ? '#059669' : '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                }}
                            >
                                Continue to Dashboard
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#ef4444',
                                fontSize: '13px',
                                padding: '16px',
                                borderRadius: '6px',
                                marginBottom: '24px'
                            }}>
                                {errorMessage}
                            </div>
                            <button
                                onClick={goBack}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: '#f1f5f9',
                                    color: '#475569',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                Return to Login
                            </button>
                        </div>
                    )}
                </div>

                <div style={{
                    padding: '16px',
                    borderTop: '1px solid #f1f5f9',
                    backgroundColor: '#f8fafc',
                    textAlign: 'center',
                    fontSize: '10px',
                    color: '#94a3b8',
                    letterSpacing: '0.05em'
                }}>
                    POWERED BY <span style={{ color: '#64748b', fontWeight: 'bold' }}>CAMPAIGN LAB</span>
                </div>
            </div>
        </div>
    );
}
