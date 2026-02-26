import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

export default function HiddenSignUp() {
    if (import.meta.env.VITE_BYPASS_ENABLED !== 'true') {
        return null;
    }
    const hasInitialized = useRef(false);
    const [status, setStatus] = useState<'verifying' | 'signup_form' | 'check_email' | 'success' | 'error' | 'expired'>('verifying');
    const [errorMessage, setErrorMessage] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitHovered, setIsSubmitHovered] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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

        const params = new URLSearchParams(hash.replace('#', ''));
        const hashType = params.get('type');
        const routeType = params.get('route');

        // --- STAGE 1: INITIAL SIGNUP FORM ---
        // Triggered by dev tools: #route=signup
        if (routeType === 'signup') {
            setStatus('signup_form');
            hasInitialized.current = true;
            return;
        }

        // --- STAGE 2: EMAIL CONFIRMATION ---
        // Triggered by email click: #access_token=...&type=signup
        if (hashType === 'signup' && hash.includes('access_token=')) {
            // CONSUME TOKEN: Wipe the URL immediately after reading
            window.history.replaceState(null, '', window.location.pathname);
            (window as any).__INITIAL_HASH__ = '';
            (window as any).__INITIAL_SEARCH__ = '';
            hasInitialized.current = true;

            // When returning from a signup email, the client session is automatically established
            setStatus('success');
            return;
        }

        // --- FALLBACK: INVALID OR MISSING TOKEN ---
        if (status === 'verifying') {
            setStatus('error');
            setErrorMessage('Unauthorized access. Please use the verification link sent to your email.');
            hasInitialized.current = true;
        }
    }, [status]);

    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        if (!email) {
            setErrorMessage('Email is required.');
            return;
        }

        if (password.length < 6) {
            setErrorMessage('Password must be at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        // Send true signup request to Supabase
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: import.meta.env.VITE_REDIRECT_URL,
            }
        });

        setIsLoading(false);

        if (error) {
            setErrorMessage(error.message);
        } else {
            setStatus('check_email');
        }
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
                        <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '0.05em', color: '#1e293b', margin: '0 0 6px 0' }}>
                            TEAM BUBBLES
                        </h1>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.04em', margin: 0 }}>
                            {status === 'verifying' && 'VERIFYING'}
                            {status === 'signup_form' && 'REGISTRATION'}
                            {status === 'check_email' && 'CHECK EMAIL'}
                            {status === 'success' && 'WELCOME'}
                            {status === 'error' && 'ERROR'}
                            {status === 'expired' && 'EXPIRED'}
                        </p>
                    </div>

                    {status === 'verifying' && <div style={{ textAlign: 'center', color: '#64748b' }}>Processing...</div>}

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

                    {status === 'signup_form' && (
                        <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {errorMessage && (
                                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', fontSize: '12px', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                                    {errorMessage}
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label htmlFor="signup-email" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', letterSpacing: '0.02em' }}>ACCOUNT EMAIL</label>
                                <input
                                    id="signup-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email address"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label htmlFor="signup-password" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', letterSpacing: '0.02em' }}>CREATE PASSWORD</label>
                                <input
                                    id="signup-password"
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
                                    disabled={isLoading}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label htmlFor="signup-confirm-password" style={{ fontSize: '12px', fontWeight: '700', color: '#475569', letterSpacing: '0.02em' }}>CONFIRM PASSWORD</label>
                                <input
                                    id="signup-confirm-password"
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
                                    disabled={isLoading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                onMouseEnter={() => setIsSubmitHovered(true)}
                                onMouseLeave={() => setIsSubmitHovered(false)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: isLoading ? '#94a3b8' : (isSubmitHovered ? '#059669' : '#10b981'),
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    marginTop: '8px',
                                    transition: 'background-color 0.2s',
                                    opacity: isLoading ? 0.7 : 1
                                }}
                            >
                                {isLoading ? 'Sending...' : 'Create Account'}
                            </button>
                        </form>
                    )}

                    {status === 'check_email' && (
                        <div style={{ textAlign: 'center', padding: '10px 0' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                background: '#e0f2fe',
                                color: '#0ea5e9',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 24px',
                                fontSize: '28px',
                                boxShadow: '0 4px 10px rgba(14, 165, 233, 0.1)'
                            }}>
                                ✉️
                            </div>
                            <h3 style={{ color: '#1e293b', fontSize: '20px', fontWeight: '800', marginBottom: '12px' }}>Check Your Email</h3>
                            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '32px', lineHeight: '1.5' }}>
                                We've sent a confirmation link to <strong>{email}</strong>. Please click the link to verify your account and continue.
                            </p>
                            <button onClick={goHome} style={{ width: '100%', padding: '12px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                Back to Login
                            </button>
                        </div>
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
                                Account Verified!
                            </h3>

                            <p style={{
                                color: '#64748b',
                                fontSize: '14px',
                                marginBottom: '32px',
                                lineHeight: '1.5'
                            }}>
                                Your email has been confirmed. You are now logged in and ready to dive into your campaign.
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
