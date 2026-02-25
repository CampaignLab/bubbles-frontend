import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export default function FirstTimeLogin() {
    const { signOut, user } = useAuth();
    const hasInitialized = useRef(false);
    const [status, setStatus] = useState<'verifying' | 'confirm_invite' | 'reveal_password' | 'success' | 'error' | 'expired'>('verifying');
    const [errorMessage, setErrorMessage] = useState('');
    const [email, setEmail] = useState('');
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [isButtonHovered, setIsButtonHovered] = useState(false);
    const [isRejectHovered, setIsRejectHovered] = useState(false);
    const [isSubmitHovered, setIsSubmitHovered] = useState(false);

    useEffect(() => {
        // --- PREVENT DOUBLE-PROCESSING IN STRICT MODE ---
        if (hasInitialized.current) return;

        const hash = (window as any).__INITIAL_HASH__ || window.location.hash;
        const search = (window as any).__INITIAL_SEARCH__ || window.location.search;

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
        // If we don't have a hash, but we DO have a user, we might have already consumed the token.
        if (!hash.includes('access_token=') && !user) {
            if (status === 'verifying') {
                setStatus('error');
                setErrorMessage('Unauthorized access. Please use the verification link sent to your email.');
            }
            return;
        }

        const params = new URLSearchParams(hash.replace('#', ''));
        const hashType = params.get('type');
        const userEmailUrl = params.get('email');

        // CONSUME TOKEN: Wipe the URL immediately after reading
        if (hash.includes('access_token=')) {
            window.history.replaceState(null, '', window.location.pathname);
            (window as any).__INITIAL_HASH__ = '';
            (window as any).__INITIAL_SEARCH__ = '';
        }

        hasInitialized.current = true;

        // EMAIL RESOLUTION: Prefer URL, fallback to authenticated user
        const finalEmail = userEmailUrl ? decodeURIComponent(userEmailUrl) : (user?.email || '');
        setEmail(finalEmail);

        if (hashType === 'invite' || hashType === 'signup') {
            // New user flow
            const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
            let newPassword = "";
            for (let i = 0; i < 18; i++) {
                newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
            }
            setGeneratedPassword(newPassword);
            setStatus('confirm_invite');
        } else if (hashType === 'magiclink') {
            // Existing user flow
            setStatus('success');
        } else if (user) {
            // Fallback: If we are already logged in but hash is gone, we must be in the success state
            // unless we specifically need to set a password.
            setStatus('success');
        } else {
            setStatus('error');
            setErrorMessage('Invalid link type. This page requires an invite or magic link.');
        }
    }, [status, user]);

    const handleAccept = () => {
        setStatus('reveal_password');
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedPassword);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        // REAL PATH: Update actual Supabase user with generated password
        const { error } = await supabase.auth.updateUser({ password: generatedPassword });
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
                            {status === 'reveal_password' ? 'SAVE LOGIN' : 'INVITATION'}
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

                    {status === 'reveal_password' && (
                        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {errorMessage && (
                                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '12px', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                                    {errorMessage}
                                </div>
                            )}

                            <p style={{ color: '#475569', fontSize: '14px', marginBottom: '8px', lineHeight: '1.5', textAlign: 'center' }}>
                                We've generated a highly secure password for your account. Please copy it and save it in your password manager.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', letterSpacing: '0.02em', textAlign: 'center' }}>GENERATED PASSWORD</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        value={generatedPassword}
                                        readOnly
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            backgroundColor: '#f8fafc',
                                            border: '1px dashed #cbd5e1',
                                            borderRadius: '6px',
                                            fontSize: '16px',
                                            color: '#0f172a',
                                            fontFamily: 'monospace',
                                            textAlign: 'center',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={copyToClipboard}
                                    style={{
                                        padding: '10px 16px',
                                        marginTop: '4px',
                                        backgroundColor: isCopied ? '#10b981' : '#f1f5f9',
                                        color: isCopied ? 'white' : '#475569',
                                        border: isCopied ? '1px solid #10b981' : '1px solid #cbd5e1',
                                        borderRadius: '6px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {isCopied ? 'Copied to Clipboard!' : 'Copy Password'}
                                </button>
                            </div>

                            {/* Hidden fields to trigger browser password manager save prompt */}
                            <div style={{ opacity: 0, position: 'absolute', pointerEvents: 'none', height: 0, overflow: 'hidden' }}>
                                <input type="text" name="username" value={email} autoComplete="username" readOnly />
                                <input type="password" name="password" value={generatedPassword} autoComplete="new-password" readOnly />
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
                                Save & Enter Dashboard
                            </button>
                        </form>
                    )}

                    {status === 'success' && (
                        <div style={{ textAlign: 'center', padding: '10px 0' }}>
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
                                Welcome to the Squad!
                            </h3>

                            <p style={{
                                color: '#64748b',
                                fontSize: '14px',
                                marginBottom: '32px',
                                lineHeight: '1.5'
                            }}>
                                Your account is secure. Remember to keep your new password safe.
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
