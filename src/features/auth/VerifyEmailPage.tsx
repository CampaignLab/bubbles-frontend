import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function VerifyEmailPage() {
    const { signOut } = useAuth();
    const [status, setStatus] = useState<'verifying' | 'confirm_invite' | 'set_password' | 'success' | 'error' | 'expired'>('verifying');
    const [emailType, setEmailType] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [password, setPassword] = useState('');
    const [isButtonHovered, setIsButtonHovered] = useState(false);
    const [isRejectHovered, setIsRejectHovered] = useState(false);

    useEffect(() => {
        const hash = window.location.hash;
        const search = window.location.search;

        // Check for error parameters in both Search AND Hash (Supabase sends these if OTP expired)
        const sParams = new URLSearchParams(search);
        const hParams = new URLSearchParams(hash.replace('#', ''));

        const error = sParams.get('error') || hParams.get('error');
        const errorCode = sParams.get('error_code') || hParams.get('error_code');
        const errorDesc = sParams.get('error_description') || hParams.get('error_description');

        if (error === 'access_denied' || errorCode === 'otp_expired' || errorCode === 'user_already_exists') {
            if (errorCode === 'user_already_exists') {
                setStatus('error');
                setErrorMessage('This account has already been registered. Please sign in with your email and password.');
            } else if (errorCode === 'otp_expired') {
                setStatus('expired');
                setErrorMessage('Verification link has expired.');
            } else {
                setStatus('expired');
                setErrorMessage(errorDesc ? decodeURIComponent(errorDesc).replace(/\+/g, ' ') : 'Verification link has expired.');
            }
            return;
        }

        if (!hash || !hash.includes('access_token=')) {
            // Only error if we aren't already in an expired/error state
            if (status !== 'expired' && status !== 'success') {
                setStatus('error');
                setErrorMessage('Invalid verification link. Please use the link sent to your email.');
            }
            return;
        }

        const params = new URLSearchParams(hash.replace('#', ''));
        const hashType = params.get('type');
        setEmailType(hashType);

        if (hashType === 'invite') {
            // For developer simulations, we check if they want to test the "User already exists" scenario
            const mockEmail = params.get('email');
            if (mockEmail && mockEmail.toLowerCase().includes('exist')) {
                setStatus('error');
                setErrorMessage('A user with this email address has already been registered.');
            } else {
                setStatus('confirm_invite');
            }
        } else {
            // Auto-verify for signup/magiclink
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    setStatus('success');
                    window.history.replaceState(null, '', window.location.pathname);
                }
            });
            return () => subscription.unsubscribe();
        }
    }, []);

    const handleAccept = () => {
        // After accepting an invite, we force them to set a password 
        // because invited users don't have one yet!
        setStatus('set_password');
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            setErrorMessage('Password must be at least 6 characters.');
            return;
        }

        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
            setErrorMessage(error.message);
        } else {
            setStatus('success');
            window.history.replaceState(null, '', window.location.pathname);
        }
    };

    const handleReject = async () => {
        // Decline = Clear session and go home.
        await signOut();
        window.history.replaceState(null, '', window.location.pathname);
        window.dispatchEvent(new Event('hashchange'));
    };

    const goHome = () => {
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
                        <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '0.05em', color: '#1e293b', margin: '0' }}>
                            {status === 'set_password' ? 'CREATE PASSWORD' : 'VERIFICATION'}
                        </h1>
                    </div>

                    {status === 'verifying' && <div style={{ textAlign: 'center', color: '#64748b' }}>Processing token...</div>}

                    {status === 'expired' && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ backgroundColor: '#fff7ed', border: '1px solid #ffedd5', color: '#c2410c', padding: '16px', borderRadius: '6px', marginBottom: '24px', fontSize: '13px' }}>
                                <strong>Link Expired:</strong> {errorMessage}
                            </div>
                            <button onClick={goHome} style={{ width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                                Back to Login
                            </button>
                        </div>
                    )}

                    {status === 'confirm_invite' && (
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ color: '#475569', fontSize: '14px', marginBottom: '24px' }}>
                                You've been invited to join the squad. Accept to continue.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button
                                    onClick={handleAccept}
                                    onMouseEnter={() => setIsButtonHovered(true)}
                                    onMouseLeave={() => setIsButtonHovered(false)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: isButtonHovered ? '#4338ca' : '#4f46e5',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s',
                                    }}
                                >
                                    Accept Invitation
                                </button>
                                <button
                                    onClick={handleReject}
                                    onMouseEnter={() => setIsRejectHovered(true)}
                                    onMouseLeave={() => setIsRejectHovered(false)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: isRejectHovered ? '#f1f5f9' : 'white',
                                        color: isRejectHovered ? '#ef4444' : '#64748b',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    )}

                    {status === 'set_password' && (
                        <form onSubmit={handlePasswordSubmit}>
                            <p style={{ color: '#475569', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>
                                Since you were invited, please set a password for your account.
                            </p>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Choose a password (min 6 chars)"
                                style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '16px', boxSizing: 'border-box' }}
                                required
                            />
                            <button type="submit" style={{ width: '100%', padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                Finish Setup
                            </button>
                        </form>
                    )}

                    {status === 'success' && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '40px', height: '40px', background: '#d1fae5', color: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontWeight: 'bold' }}>✓</div>
                            <h3 style={{ color: '#1e293b', marginBottom: '8px' }}>
                                {emailType === 'invite' ? 'Invite Accepted!' : 'Verification Success!'}
                            </h3>
                            <button onClick={goHome} style={{ width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                Enter Dashboard
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '16px', borderRadius: '6px', marginBottom: '24px', fontSize: '13px' }}>
                                {errorMessage}
                            </div>
                            <button onClick={goHome} style={{ width: '100%', padding: '12px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                Back to Login
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
                    POWERED BY <a
                        href="https://campaignlab.uk"
                        target="_blank"
                        rel="noopener noreferrer"
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                        style={{
                            color: '#64748b',
                            fontWeight: 'bold',
                            textDecoration: 'none',
                            transition: 'color 0.2s'
                        }}
                    >
                        CAMPAIGN LAB
                    </a>
                </div>
            </div>
        </div>
    );
}
