import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function VerifyEmailPage() {
    const { signOut, signInWithDevBypass } = useAuth();
    const hasInitialized = useRef(false);
    const [status, setStatus] = useState<'verifying' | 'confirm_invite' | 'set_password' | 'success' | 'error' | 'expired'>('verifying');
    const [emailType, setEmailType] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [isSimulated, setIsSimulated] = useState(false);
    const [isButtonHovered, setIsButtonHovered] = useState(false);
    const [isRejectHovered, setIsRejectHovered] = useState(false);
    const [isSubmitHovered, setIsSubmitHovered] = useState(false);

    useEffect(() => {
        // --- PREVENT DOUBLE-PROCESSING IN STRICT MODE ---
        if (hasInitialized.current) return;

        const hash = window.location.hash;
        const search = window.location.search;

        const sParams = new URLSearchParams(search);
        const hParams = new URLSearchParams(hash.replace('#', ''));

        const error = sParams.get('error') || hParams.get('error');
        const errorCode = sParams.get('error_code') || hParams.get('error_code');
        const errorDesc = sParams.get('error_description') || hParams.get('error_description');

        // Handle error redirects from Supabase (expired, etc.)
        if (error === 'access_denied' || errorCode === 'otp_expired' || errorCode === 'user_already_exists') {
            hasInitialized.current = true;
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

        // --- SECURITY CHECK: TOKEN REQUIRED ---
        if (!hash || !hash.includes('access_token=')) {
            // We only show error if we haven't already initialized successfully
            if (status === 'verifying') {
                setStatus('error');
                setErrorMessage('Unauthorized access. Please use the verification link sent to your email.');
            }
            return;
        }

        const params = new URLSearchParams(hash.replace('#', ''));
        const token = params.get('access_token');
        const hashType = params.get('type');
        const userEmail = params.get('email');

        // --- BYPASS GATE: MOCK TOKEN VALIDATION ---
        // We use a specific "One-to-One" expected token for simulations
        if (token === 'sb-dev-invite-token-ref-12345') {
            if (import.meta.env.VITE_BYPASS_ENABLED !== 'true') {
                // Strictly reject mock tokens in production even if manually entered
                setStatus('error');
                setErrorMessage('Invalid verification token.');
                hasInitialized.current = true;
                return;
            }
            setIsSimulated(true);
        }

        // CONSUME TOKEN: Wipe the URL immediately after reading
        window.history.replaceState(null, '', window.location.pathname);
        hasInitialized.current = true;

        setEmailType(hashType);
        if (userEmail) setEmail(decodeURIComponent(userEmail));

        if (hashType === 'invite') {
            setStatus('confirm_invite');
        } else {
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    setStatus('success');
                }
            });
            return () => subscription.unsubscribe();
        }
    }, []);

    const handleAccept = () => {
        setStatus('set_password');
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        if (password.length < 6) {
            setErrorMessage('Password must be at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        if (isSimulated) {
            // MOCK PATH: Trigger developer bypass login
            signInWithDevBypass();
            setStatus('success');
            return;
        }

        // REAL PATH: Update actual Supabase user
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
            setErrorMessage(error.message);
        } else {
            setStatus('success');
        }
    };

    const handleReject = async () => {
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
                            {status === 'set_password' ? 'FINAL STEPS' : 'VERIFICATION'}
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
                        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {errorMessage && (
                                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '12px', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                                    {errorMessage}
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', letterSpacing: '0.02em' }}>ACCOUNT EMAIL</label>
                                <input
                                    type="text"
                                    value={email}
                                    readOnly
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        backgroundColor: '#f1f5f9',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        color: '#64748b',
                                        cursor: 'not-allowed',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', letterSpacing: '0.02em' }}>CREATE PASSWORD</label>
                                <input
                                    type="password"
                                    value={password}
                                    autoComplete="new-password"
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Minimum 6 characters"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', letterSpacing: '0.02em' }}>CONFIRM PASSWORD</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    autoComplete="new-password"
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat your password"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                onMouseEnter={() => setIsSubmitHovered(true)}
                                onMouseLeave={() => setIsSubmitHovered(false)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: isSubmitHovered ? '#059669' : '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    marginTop: '8px',
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                Finish Setup
                            </button>
                        </form>
                    )}

                    {status === 'success' && (
                        <div style={{ textAlign: 'center', padding: '10px 0' }}>
                            {/* Larger, more prominent checkmark */}
                            <div style={{
                                width: '64px',
                                height: '64px',
                                background: '#d1fae5',
                                color: '#10b981',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 24px',
                                fontSize: '32px',
                                boxShadow: '0 4px 10px rgba(16, 185, 129, 0.1)'
                            }}>
                                ✓
                            </div>

                            <h3 style={{
                                color: '#1e293b',
                                fontSize: '20px',
                                fontWeight: '800',
                                marginBottom: '12px',
                                letterSpacing: '-0.01em'
                            }}>
                                {emailType === 'invite' ? 'Welcome to the Squad!' : 'Identity Verified!'}
                            </h3>

                            <p style={{
                                color: '#64748b',
                                fontSize: '14px',
                                marginBottom: '32px',
                                lineHeight: '1.5'
                            }}>
                                Your account is now fully active. Ready to dive back into your campaign?
                            </p>

                            <button
                                onClick={goHome}
                                onMouseEnter={() => setIsSubmitHovered(true)}
                                onMouseLeave={() => setIsSubmitHovered(false)}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: isSubmitHovered ? '#4338ca' : '#4f46e5',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: '700',
                                    fontSize: '15px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: isSubmitHovered ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none',
                                    transform: isSubmitHovered ? 'translateY(-1px)' : 'none'
                                }}
                            >
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
